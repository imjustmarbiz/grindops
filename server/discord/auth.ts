import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import crypto from "crypto";
import { authStorage } from "../replit_integrations/auth/storage";
import { getDiscordBotClient } from "./bot";

const DISCORD_API = "https://discord.com/api/v10";
const OWNER_ROLE = "1466369177043599514";
const STAFF_ROLE = "1466369178729578663";
const GRINDER_ROLE = "1466369179648004224";
const ALL_GRINDER_ROLES = [
  "1466369179648004224",
  "1466370965016412316",
  "1468501279478255708",
  "1468501106916065363",
  "1468796147136073922",
  "1469613880073257125",
];

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: sessionTtl,
    },
  });
}

function getRedirectUri(req: any): string {
  if (process.env.DISCORD_REDIRECT_URI) {
    return process.env.DISCORD_REDIRECT_URI;
  }
  const domains = process.env.REPLIT_DOMAINS;
  if (domains) {
    const primaryDomain = domains.split(",")[0].trim();
    return `https://${primaryDomain}/api/auth/discord/callback`;
  }
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  if (devDomain) {
    return `https://${devDomain}/api/auth/discord/callback`;
  }
  const host = req.get("host") || req.headers["x-forwarded-host"] || req.hostname;
  const protocol = req.headers["x-forwarded-proto"] || "https";
  return `${protocol}://${host}/api/auth/discord/callback`;
}

export function setupDiscordAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  const domains = process.env.REPLIT_DOMAINS;
  if (domains) {
    const primaryDomain = domains.split(",")[0].trim();
    console.log(`[discord-auth] Add this redirect URI to Discord Developer Portal: https://${primaryDomain}/api/auth/discord/callback`);
  }

  app.get("/api/auth/discord/login", (req, res) => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ message: "Discord Client ID not configured" });
    }
    const state = crypto.randomBytes(16).toString("hex");
    (req.session as any).oauthState = state;
    req.session.save(() => {
      const rawRedirectUri = getRedirectUri(req);
      console.log("[discord-auth] Redirect URI:", rawRedirectUri);
      const redirectUri = encodeURIComponent(rawRedirectUri);
      const scope = encodeURIComponent("identify guilds.members.read");
      const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;
      res.redirect(url);
    });
  });

  app.get("/api/auth/discord/callback", async (req, res) => {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const storedState = (req.session as any)?.oauthState;

    if (!code) {
      return res.redirect("/login?error=no_code");
    }

    if (!state || state !== storedState) {
      return res.redirect("/login?error=auth_failed");
    }

    delete (req.session as any).oauthState;

    try {
      const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID!,
          client_secret: process.env.DISCORD_CLIENT_SECRET!,
          grant_type: "authorization_code",
          code,
          redirect_uri: getRedirectUri(req),
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error("[discord-auth] Token exchange failed:", errText);
        return res.redirect("/login?error=token_failed");
      }

      const tokens = await tokenRes.json();

      const userRes = await fetch(`${DISCORD_API}/users/@me`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userRes.ok) {
        return res.redirect("/login?error=user_fetch_failed");
      }

      const discordUser = await userRes.json();

      let role = "none";
      let guildRoleIds: string[] = [];

      const botClient = getDiscordBotClient();
      if (botClient) {
        const guilds = Array.from(botClient.guilds.cache.values());
        for (const guild of guilds) {
          try {
            const member = await guild.members.fetch({ user: discordUser.id, force: true });
            if (member) {
              guildRoleIds = Array.from(member.roles.cache.keys());
              console.log(`[discord-auth] Login role check for ${discordUser.username} (${discordUser.id}): roles=${JSON.stringify(guildRoleIds)}`);

              if (guildRoleIds.includes(OWNER_ROLE)) {
                role = "owner";
              } else if (guildRoleIds.includes(STAFF_ROLE)) {
                role = "staff";
              } else if (guildRoleIds.some((r: string) => ALL_GRINDER_ROLES.includes(r))) {
                role = "grinder";
              }
              console.log(`[discord-auth] Assigned role: ${role}`);
              break;
            }
          } catch {
          }
        }
      }

      const avatarUrl = discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=128`
        : `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(discordUser.id) >> BigInt(22)) % 6}.png`;

      const user = await authStorage.upsertUser({
        id: discordUser.id,
        email: discordUser.email || null,
        firstName: discordUser.global_name || discordUser.username,
        lastName: null,
        profileImageUrl: avatarUrl,
        discordId: discordUser.id,
        discordUsername: discordUser.username,
        discordAvatar: discordUser.avatar,
        role,
        discordRoles: guildRoleIds,
      });

      (req.session as any).userId = user.id;
      (req.session as any).userRole = role;

      req.session.save(() => {
        res.redirect("/");
      });
    } catch (error) {
      console.error("[discord-auth] Callback error:", error);
      res.redirect("/login?error=auth_failed");
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = await authStorage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const lastRoleCheck = (req.session as any).lastRoleCheck || 0;
      const now = Date.now();
      if (user.discordId && now - lastRoleCheck > 60_000) {
        const botClient = getDiscordBotClient();
        if (botClient) {
          const guilds = Array.from(botClient.guilds.cache.values());
          for (const guild of guilds) {
            try {
              const member = await guild.members.fetch({ user: user.discordId, force: true });
              if (member) {
                const guildRoleIds: string[] = Array.from(member.roles.cache.keys());
                console.log(`[discord-auth] Role refresh for ${user.discordUsername || user.discordId}: roles=${JSON.stringify(guildRoleIds)}`);
                let newRole = "none";
                if (guildRoleIds.includes(OWNER_ROLE)) {
                  newRole = "owner";
                } else if (guildRoleIds.includes(STAFF_ROLE)) {
                  newRole = "staff";
                } else if (guildRoleIds.some((r) => ALL_GRINDER_ROLES.includes(r))) {
                  newRole = "grinder";
                }

                const currentRoles = (user.discordRoles as string[] || []).slice().sort();
                const newRoles = guildRoleIds.slice().sort();
                if (newRole !== user.role || JSON.stringify(newRoles) !== JSON.stringify(currentRoles)) {
                  console.log(`[discord-auth] Updating role for ${user.discordUsername}: ${user.role} -> ${newRole}`);
                  const updated = await authStorage.upsertUser({
                    ...user,
                    role: newRole,
                    discordRoles: guildRoleIds,
                  });
                  (req.session as any).userRole = newRole;
                  (req.session as any).lastRoleCheck = now;
                  return res.json(updated);
                }

                (req.session as any).lastRoleCheck = now;
                break;
              }
            } catch {}
          }
        }
      }

      if (!user.profileImageUrl && user.discordId) {
        let computedAvatar: string | null = null;
        if (user.discordAvatar) {
          computedAvatar = `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png?size=128`;
        } else {
          try {
            computedAvatar = `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(user.discordId) >> BigInt(22)) % 6}.png`;
          } catch { computedAvatar = null; }
        }
        if (computedAvatar) {
          const updated = await authStorage.upsertUser({
            ...user,
            profileImageUrl: computedAvatar,
          });
          return res.json(updated);
        }
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/login");
    });
  });

  if (process.env.NODE_ENV === "development") {
    const DEV_ROLES: Record<string, { userId: string; email: string; firstName: string; lastName: string; discordId: string; discordUsername: string; sessionRole: string }> = {
      owner: { userId: "dev-owner-user", email: "dev-owner@test.local", firstName: "Demo", lastName: "Owner", discordId: "dev-owner-discord", discordUsername: "DemoOwner", sessionRole: "owner" },
      staff: { userId: "dev-staff-user", email: "dev-staff@test.local", firstName: "Demo", lastName: "Staff", discordId: "dev-staff-discord", discordUsername: "DemoStaff", sessionRole: "staff" },
      grinder: { userId: "dev-grinder-user", email: "dev-grinder@test.local", firstName: "Demo", lastName: "Grinder", discordId: "dev-grinder-discord", discordUsername: "DemoGrinder", sessionRole: "grinder" },
      elite: { userId: "dev-elite-user", email: "dev-elite@test.local", firstName: "Demo", lastName: "Elite", discordId: "dev-elite-discord", discordUsername: "DemoElite", sessionRole: "grinder" },
    };

    app.get("/api/auth/dev/login", async (req, res) => {
      const roleKey = (req.query.role as string) || "grinder";
      const config = DEV_ROLES[roleKey];
      if (!config) {
        return res.status(400).json({ message: `Invalid role. Use: owner, staff, grinder, elite` });
      }
      try {
        const user = await authStorage.upsertUser({
          id: config.userId,
          email: config.email,
          firstName: config.firstName,
          lastName: config.lastName,
          profileImageUrl: null,
          discordId: config.discordId,
          discordUsername: config.discordUsername,
          discordAvatar: null,
          role: config.sessionRole,
          discordRoles: [],
        });
        (req.session as any).userId = user.id;
        (req.session as any).userRole = config.sessionRole;
        req.session.save(() => {
          const redirect = (req.query.redirect as string) || "/";
          res.redirect(redirect);
        });
      } catch (error) {
        console.error("[dev-auth] Error:", error);
        res.status(500).json({ message: "Dev login failed" });
      }
    });
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const user = await authStorage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    (req as any).userId = userId;
    (req as any).userRole = user.role || "none";
    (req as any).user = user;
    next();
  } catch {
    return res.status(500).json({ message: "Auth check failed" });
  }
};

export const requireStaff: RequestHandler = async (req, res, next) => {
  const userRole = (req as any).userRole;
  if (userRole !== "staff" && userRole !== "owner") {
    return res.status(403).json({ message: "Staff access required" });
  }
  next();
};

export const requireOwner: RequestHandler = async (req, res, next) => {
  const userRole = (req as any).userRole;
  if (userRole !== "owner") {
    return res.status(403).json({ message: "Owner access required" });
  }
  next();
};

export const requireGrinderOrStaff: RequestHandler = async (req, res, next) => {
  const userRole = (req as any).userRole;
  if (userRole !== "staff" && userRole !== "grinder" && userRole !== "owner") {
    return res.status(403).json({ message: "Access denied. You need a Staff or Grinder role in Discord." });
  }
  next();
};
