import { storage } from "./storage";

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const CHECK_INTERVAL_MS = 5 * 60_000;

let accessToken: string | null = null;
let tokenExpiresAt = 0;

const liveGrinders = new Map<string, { assignmentIds: string[]; startedAt: number }>();

async function getTwitchAccessToken(): Promise<string | null> {
  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) return null;
  if (accessToken && Date.now() < tokenExpiresAt - 60_000) return accessToken;

  try {
    const res = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
    });
    if (!res.ok) {
      console.error("[twitch-checker] Failed to get access token:", res.status);
      return null;
    }
    const data = await res.json();
    accessToken = data.access_token;
    tokenExpiresAt = Date.now() + data.expires_in * 1000;
    return accessToken;
  } catch (err) {
    console.error("[twitch-checker] Token fetch error:", err);
    return null;
  }
}

async function checkStreams(usernames: string[]): Promise<Set<string>> {
  const token = await getTwitchAccessToken();
  if (!token || !TWITCH_CLIENT_ID) return new Set();

  const liveUsernames = new Set<string>();
  const batchSize = 100;

  for (let i = 0; i < usernames.length; i += batchSize) {
    const batch = usernames.slice(i, i + batchSize);
    const params = new URLSearchParams();
    batch.forEach(u => params.append("user_login", u.toLowerCase()));

    try {
      const res = await fetch(`https://api.twitch.tv/helix/streams?${params.toString()}`, {
        headers: {
          "Client-ID": TWITCH_CLIENT_ID,
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        console.error("[twitch-checker] Streams API error:", res.status);
        continue;
      }
      const data = await res.json();
      for (const stream of data.data || []) {
        if (stream.type === "live") {
          liveUsernames.add(stream.user_login.toLowerCase());
        }
      }
    } catch (err) {
      console.error("[twitch-checker] Streams fetch error:", err);
    }
  }

  return liveUsernames;
}

function generateCheckpointId(): string {
  const rand = Math.random().toString(36).substring(2, 10);
  const ts = Date.now().toString(36);
  return `CP-${rand}-${ts}`;
}

async function rehydrateLiveState() {
  try {
    const allGrinders = await storage.getGrinders();
    const grindersWithTwitch = allGrinders.filter(g => g.twitchUsername && !g.isRemoved);
    if (grindersWithTwitch.length === 0) return;

    const usernameToGrinder = new Map<string, typeof grindersWithTwitch[0]>();
    for (const g of grindersWithTwitch) {
      usernameToGrinder.set(g.twitchUsername!.toLowerCase(), g);
    }

    const usernames = Array.from(usernameToGrinder.keys());
    const liveNow = await checkStreams(usernames);

    const allAssignments = await storage.getAssignments();
    const activeAssignmentsByGrinder = new Map<string, any[]>();
    for (const a of allAssignments) {
      if (a.status === "Active") {
        const list = activeAssignmentsByGrinder.get(a.grinderId) || [];
        list.push(a);
        activeAssignmentsByGrinder.set(a.grinderId, list);
      }
    }

    for (const [username, grinder] of usernameToGrinder) {
      if (liveNow.has(username)) {
        const activeAssignments = activeAssignmentsByGrinder.get(grinder.id) || [];
        liveGrinders.set(grinder.id, {
          assignmentIds: activeAssignments.map(a => a.id),
          startedAt: Date.now(),
        });
        console.log(`[twitch-checker] Rehydrated: ${grinder.name} is currently LIVE`);
      }
    }
  } catch (err) {
    console.error("[twitch-checker] Rehydrate error:", err);
  }
}

async function hasRecentStreamCheckpoint(grinderId: string, type: string, withinMs: number = 5 * 60_000): Promise<boolean> {
  try {
    const checkpoints = await storage.getActivityCheckpoints(grinderId);
    const cutoff = new Date(Date.now() - withinMs);
    return checkpoints.some(
      cp => cp.type === type && cp.grinderId === grinderId && new Date(cp.createdAt!) > cutoff
    );
  } catch {
    return false;
  }
}

async function runCheck() {
  try {
    const allGrinders = await storage.getGrinders();
    const grindersWithTwitch = allGrinders.filter(
      g => g.twitchUsername && !g.isRemoved
    );

    if (grindersWithTwitch.length === 0) return;

    const allAssignments = await storage.getAssignments();
    const activeAssignmentsByGrinder = new Map<string, any[]>();
    for (const a of allAssignments) {
      if (a.status === "Active") {
        const list = activeAssignmentsByGrinder.get(a.grinderId) || [];
        list.push(a);
        activeAssignmentsByGrinder.set(a.grinderId, list);
      }
    }

    const usernameToGrinder = new Map<string, typeof grindersWithTwitch[0]>();
    for (const g of grindersWithTwitch) {
      usernameToGrinder.set(g.twitchUsername!.toLowerCase(), g);
    }

    const usernames = Array.from(usernameToGrinder.keys());
    const liveNow = await checkStreams(usernames);

    for (const [username, grinder] of usernameToGrinder) {
      const activeAssignments = activeAssignmentsByGrinder.get(grinder.id) || [];
      const wasLive = liveGrinders.has(grinder.id);
      const isLive = liveNow.has(username);

      if (isLive && !wasLive) {
        const alreadyLogged = await hasRecentStreamCheckpoint(grinder.id, "stream_live");
        liveGrinders.set(grinder.id, {
          assignmentIds: activeAssignments.map(a => a.id),
          startedAt: Date.now(),
        });
        if (!alreadyLogged) {
          for (const a of activeAssignments) {
            await storage.createActivityCheckpoint({
              id: generateCheckpointId(),
              assignmentId: a.id,
              orderId: a.orderId,
              grinderId: grinder.id,
              type: "stream_live",
              note: `Stream went live on Twitch (${grinder.twitchUsername})`,
            });
          }
          console.log(`[twitch-checker] ${grinder.name} went LIVE (${activeAssignments.length} active assignments)`);
        } else {
          console.log(`[twitch-checker] ${grinder.name} still LIVE (skipped duplicate checkpoint)`);
        }
      } else if (!isLive && wasLive) {
        const session = liveGrinders.get(grinder.id)!;
        const durationMin = Math.round((Date.now() - session.startedAt) / 60_000);
        liveGrinders.delete(grinder.id);
        for (const a of activeAssignments) {
          await storage.createActivityCheckpoint({
            id: generateCheckpointId(),
            assignmentId: a.id,
            orderId: a.orderId,
            grinderId: grinder.id,
            type: "stream_offline",
            note: `Stream ended on Twitch after ${durationMin} min (${grinder.twitchUsername})`,
          });
        }
        console.log(`[twitch-checker] ${grinder.name} went OFFLINE (streamed ${durationMin} min)`);
      }
    }
  } catch (err) {
    console.error("[twitch-checker] Check error:", err);
  }
}

export function isGrinderLive(grinderId: string): boolean {
  return liveGrinders.has(grinderId);
}

export function getLiveGrinders(): Map<string, { assignmentIds: string[]; startedAt: number }> {
  return liveGrinders;
}

export async function startTwitchStreamChecker() {
  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    console.log("[twitch-checker] Skipped — TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET not set");
    return;
  }
  console.log("[twitch-checker] Stream checker started (checking every 60s)");
  await rehydrateLiveState();
  setInterval(runCheck, CHECK_INTERVAL_MS);
}
