import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupDiscordAuth, isAuthenticated, requireStaff, requireOwner, requireGrinderOrStaff } from "./discord/auth";
import { authStorage } from "./replit_integrations/auth/storage";
import { recalcGrinderStats } from "./recalcStats";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { siteAlerts, GRINDER_ROLES } from "@shared/schema";
import { or, eq, sql, desc, and } from "drizzle-orm";
import multer from "multer";

const BUSINESS_BLOCKED_IDS = ["872820240139046952"];
const WALLET_BLOCKED_IDS: string[] = [];
const WALLET_RESTRICTED_IDS = ["872820240139046952"];

function isBusinessBlocked(req: any): boolean {
  const discordId = (req.user as any)?.discordId || "";
  return BUSINESS_BLOCKED_IDS.includes(discordId);
}

function isWalletBlocked(req: any): boolean {
  const discordId = (req.user as any)?.discordId || "";
  return WALLET_BLOCKED_IDS.includes(discordId);
}

function isWalletRestricted(req: any): boolean {
  const discordId = (req.user as any)?.discordId || "";
  return WALLET_RESTRICTED_IDS.includes(discordId);
}

function formatUSD(n: number): string {
  return `$${n.toFixed(2)}`;
}

function getActorName(req: any): string {
  const user = req.user;
  if (!user) return "system";
  return user.discordUsername || user.firstName || user.email || user.id || "system";
}
import path from "path";
import fs from "fs";
import { messages as messagesTable, normalizePlatform } from "@shared/schema";
import { isGrinderLive } from "./twitchStreamChecker";

const uploadsDir = path.join(process.cwd(), "uploads", "chat");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const proofsDir = path.join(process.cwd(), "uploads", "proofs");
if (!fs.existsSync(proofsDir)) {
  fs.mkdirSync(proofsDir, { recursive: true });
}

const paymentProofsDir = path.join(process.cwd(), "uploads", "payment-proofs");
if (!fs.existsSync(paymentProofsDir)) {
  fs.mkdirSync(paymentProofsDir, { recursive: true });
}

const fineProofsDir = path.join(process.cwd(), "uploads", "fine-proofs");
if (!fs.existsSync(fineProofsDir)) {
  fs.mkdirSync(fineProofsDir, { recursive: true });
}

const proofUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, proofsDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(mp4|mov|webm|mkv|avi)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed (mp4, mov, webm, mkv, avi)"));
    }
  },
});

const paymentProofUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, paymentProofsDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|pdf)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("Only image and PDF files are allowed (jpg, png, gif, webp, pdf)"));
    }
  },
});

const fineProofUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, fineProofsDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|pdf)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("Only image and PDF files are allowed (jpg, png, gif, webp, pdf)"));
    }
  },
});

const chatUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|mp4|mov|webm|mp3|ogg|wav|m4a|pdf|doc|docx|txt|zip|rar)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"));
    }
  },
});

async function createSystemNotification(opts: {
  userId?: string;
  roleScope?: string;
  type: string;
  title: string;
  body: string;
  linkUrl?: string;
  icon?: string;
  severity?: string;
}) {
  try {
    await storage.createNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: opts.userId || null,
      roleScope: opts.roleScope || (opts.userId ? "user" : "all"),
      type: opts.type,
      title: opts.title,
      body: opts.body,
      linkUrl: opts.linkUrl || null,
      icon: opts.icon || null,
      severity: opts.severity || "info",
      readBy: [],
      expiresAt: null,
    });
  } catch (err) {
    console.error("[notification] Failed to create notification:", err);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupDiscordAuth(app);

  const express = await import("express");
  app.use('/uploads', express.default.static(path.join(process.cwd(), "uploads")));

  app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/auth') || req.path === '/logout' || req.path.startsWith('/public/')) {
      return next();
    }
    return isAuthenticated(req, res, async () => {
      const userRole = (req as any).userRole;
      if (userRole === "grinder") {
        if (req.path === '/config/maintenance') return next();
        try {
          const config = await storage.getQueueConfig();
          if (config?.earlyAccessMode) {
            const discordRoles: string[] = ((req as any).user?.discordRoles as string[]) || [];
            const hasElite = discordRoles.includes(GRINDER_ROLES.ELITE);
            if (!hasElite) {
              return res.status(403).json({ message: "Early access mode is active. Only Elite Grinders can access the dashboard." });
            }
          }
        } catch {}
      }
      next();
    });
  });

  app.get(api.services.list.path, async (req, res) => {
    const results = await storage.getServices();
    res.json(results);
  });

  app.post("/api/services", requireOwner, async (req, res) => {
    try {
      const { name, group, defaultComplexity, slaDays } = req.body;
      if (!name || !group) return res.status(400).json({ error: "Name and group are required" });
      const id = `S${Date.now().toString(36).toUpperCase()}`;
      const service = await storage.createService({
        id,
        name,
        group,
        defaultComplexity: defaultComplexity || 1,
        slaDays: slaDays || 5,
      });
      res.json(service);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/services/:id", requireOwner, async (req, res) => {
    try {
      const { name, group, defaultComplexity, slaDays } = req.body;
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (group !== undefined) updateData.group = group;
      if (defaultComplexity !== undefined) updateData.defaultComplexity = defaultComplexity;
      if (slaDays !== undefined) updateData.slaDays = slaDays;
      const updated = await storage.updateService(req.params.id, updateData);
      if (!updated) return res.status(404).json({ error: "Service not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/services/:id/toggle", requireOwner, async (req, res) => {
    try {
      const allServices = await storage.getServices();
      const svc = allServices.find(s => s.id === req.params.id);
      if (!svc) return res.status(404).json({ error: "Service not found" });
      const updated = await storage.updateService(req.params.id, { isActive: !svc.isActive });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/services/:id", requireOwner, async (req, res) => {
    try {
      await storage.deleteService(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/owner/staff-members", requireOwner, async (req, res) => {
    try {
      const staffUsers = await db.select().from(users)
        .where(or(eq(users.role, "staff"), eq(users.role, "owner")));
      const allAuditLogs = await storage.getAuditLogs();
      const allTasks = await storage.getStaffTasks();

      const members = staffUsers.map(s => {
        const discordId = s.discordId || s.id;
        const staffLogs = allAuditLogs.filter(l => {
          const actor = l.actor?.toLowerCase() || "";
          const username = (s.discordUsername || "").toLowerCase();
          return actor === username || actor === discordId;
        });
        const staffTasksAssigned = allTasks.filter(t => t.assignedBy === discordId);
        const staffTasksReceived = allTasks.filter(t => t.assignedTo === discordId);
        const pendingTasks = staffTasksReceived.filter(t => t.status === "pending").length;
        const completedTasks = staffTasksReceived.filter(t => t.status === "completed").length;

        const now = Date.now();
        const last24h = staffLogs.filter(l => now - new Date(l.createdAt).getTime() < 86400000).length;
        const last7d = staffLogs.filter(l => now - new Date(l.createdAt).getTime() < 604800000).length;
        const lastAction = staffLogs.length > 0 ? staffLogs[0].createdAt : null;

        return {
          id: s.id,
          discordId,
          name: s.discordUsername || s.firstName || "Staff",
          role: s.role,
          avatarUrl: s.discordAvatar ? `https://cdn.discordapp.com/avatars/${s.discordId}/${s.discordAvatar}.png` : s.profileImageUrl || null,
          totalActions: staffLogs.length,
          actionsLast24h: last24h,
          actionsLast7d: last7d,
          lastAction,
          tasksAssigned: staffTasksAssigned.length,
          pendingTasks,
          completedTasks,
        };
      });

      res.json(members);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/owner/clear-data", requireOwner, async (req, res) => {
    try {
      const { tables } = req.body;
      if (!tables || !Array.isArray(tables) || tables.length === 0) {
        return res.status(400).json({ error: "No tables specified" });
      }
      const allowed = [
        "orders", "bids", "assignments", "grinders", "payout_requests",
        "notifications", "audit_logs", "activity_checkpoints", "strike_logs",
        "customer_reviews", "messages", "message_threads", "thread_participants",
        "events", "patch_notes", "performance_reports", "staff_tasks",
        "grinder_badges", "strike_appeals",
      ];
      const safeOrder = [
        "grinder_badges", "strike_logs", "staff_tasks", "activity_checkpoints",
        "payout_requests", "customer_reviews", "notifications", "messages",
        "thread_participants", "message_threads", "events", "patch_notes",
        "performance_reports", "strike_appeals", "audit_logs",
        "assignments", "bids", "orders", "grinders",
      ];
      const toDelete = safeOrder.filter(t => tables.includes(t) && allowed.includes(t));
      const results: Record<string, boolean> = {};
      for (const table of toDelete) {
        try {
          await db.execute(sql`SELECT 1 FROM information_schema.tables WHERE table_name = ${table}`);
          await db.execute(sql`TRUNCATE TABLE ${sql.identifier(table)} CASCADE`);
          results[table] = true;
        } catch (e) {
          results[table] = false;
        }
      }
      res.json({ success: true, results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get(api.grinders.list.path, requireStaff, async (req, res) => {
    const allGrinders = await storage.getGrinders();
    const allUsers = await db.select().from(users);
    const ownerStaffIds = new Set(
      allUsers
        .filter(u => u.role === "owner" || u.role === "staff")
        .map(u => u.id)
    );
    const results = allGrinders.filter(g => !ownerStaffIds.has(g.discordUserId));
    res.json(results);
  });

  app.get('/api/grinders/live-streams', async (req, res) => {
    const allGrinders = await storage.getGrinders();
    const streaming = allGrinders.filter(g => g.twitchUsername && !g.isRemoved);
    const allAssignments = await storage.getAssignments();
    const allOrders = await storage.getOrders();
    const ordersMap = new Map(allOrders.map(o => [o.id, o]));
    res.json(streaming.map(g => {
      const activeOrders = allAssignments
        .filter((a: any) => a.grinderId === g.id && a.status === "Active")
        .map((a: any) => {
          const order = ordersMap.get(a.orderId);
          return {
            orderId: a.orderId,
            serviceId: order?.serviceId || "",
            platform: order?.platform || "",
            ticketLink: order?.discordBidLink || "",
          };
        });
      return {
        id: g.id,
        name: g.name,
        twitchUsername: g.twitchUsername,
        tier: g.tier,
        avatarUrl: (g as any).discordAvatarUrl,
        roles: g.roles,
        isLive: isGrinderLive(g.id),
        activeOrders,
      };
    }));
  });

  app.get(api.grinders.get.path, requireStaff, async (req, res) => {
    const result = await storage.getGrinder(req.params.id);
    if (!result) return res.status(404).json({ message: "Grinder not found" });
    res.json(result);
  });

  app.patch(api.grinders.update.path, requireStaff, async (req, res) => {
    try {
      const result = await storage.updateGrinder(req.params.id, req.body);
      if (!result) return res.status(404).json({ message: "Grinder not found" });
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "grinder",
        entityId: req.params.id,
        action: "updated",
        actor: getActorName(req),
        details: JSON.stringify(req.body),
      });

      if (req.body.roles && Array.isArray(req.body.roles) && result.discordUserId) {
        const { syncDiscordRoles } = await import("./discord/bot");
        syncDiscordRoles(result.discordUserId, req.body.roles).catch((e: any) =>
          console.error("[routes] Discord role sync failed:", e.message)
        );
      }

      res.json(result);
    } catch (err) {
      res.status(400).json({ message: String(err) });
    }
  });

  app.post("/api/grinders", requireStaff, async (req, res) => {
    try {
      const { discordUserId, name, category, capacity } = req.body;
      if (!discordUserId) {
        return res.status(400).json({ message: "Discord User ID is required" });
      }

      const existing = await storage.getGrinderByDiscordId(discordUserId);
      if (existing) {
        return res.status(409).json({ message: `Grinder already exists: ${existing.name} (${existing.id})` });
      }

      let resolvedName = name || "Unknown";
      let resolvedUsername: string | undefined;
      let roleId = "1466369179648004224";
      let resolvedCategory = category || "Grinder";
      let resolvedCapacity = capacity ?? 3;
      let resolvedRoles: string[] = [];

      const { GRINDER_ROLES, ROLE_LABELS, ROLE_CAPACITY } = await import("@shared/schema");
      const { getDiscordBotClient } = await import("./discord/bot");
      const client = getDiscordBotClient();
      if (client) {
        try {
          const guilds = client.guilds.cache;
          for (const [, guild] of guilds) {
            const member = await guild.members.fetch(discordUserId).catch(() => null);
            if (member) {
              if (!name || name === "Unknown") {
                resolvedName = member.displayName || member.user.globalName || member.user.username;
              }
              resolvedUsername = member.user.username;

              const allRoleIds = Object.values(GRINDER_ROLES) as string[];
              for (const rid of allRoleIds) {
                if (member.roles.cache.has(rid)) {
                  const label = ROLE_LABELS[rid];
                  if (label && !resolvedRoles.includes(label)) {
                    resolvedRoles.push(label);
                  }
                }
              }

              if (resolvedRoles.length > 0) {
                if (resolvedRoles.includes("Elite Grinder")) {
                  roleId = GRINDER_ROLES.ELITE;
                  if (!category) resolvedCategory = "Elite Grinder";
                  if (capacity === undefined) resolvedCapacity = ROLE_CAPACITY[GRINDER_ROLES.ELITE] || 5;
                } else {
                  const firstRole = resolvedRoles[0];
                  const matchedRoleId = Object.entries(ROLE_LABELS).find(([, label]) => label === firstRole)?.[0];
                  if (matchedRoleId) roleId = matchedRoleId;
                  if (!category) resolvedCategory = firstRole;
                  if (capacity === undefined && matchedRoleId) resolvedCapacity = ROLE_CAPACITY[matchedRoleId] || 3;
                }
              }
              break;
            }
          }
        } catch (e) {
          console.error("[api] Failed to fetch Discord member for new grinder:", e);
        }
      }

      if (resolvedRoles.length === 0) {
        resolvedRoles = [resolvedCategory];
      }

      const grinderId = `GRD-${discordUserId.slice(-6)}`;
      const grinder = await storage.createGrinder({
        id: grinderId,
        name: resolvedName,
        discordUserId,
        discordUsername: resolvedUsername,
        discordRoleId: roleId,
        category: resolvedCategory,
        roles: resolvedRoles,
        tier: "New",
        capacity: resolvedCapacity,
      });

      const userId = (req as any).userId;
      const dbUser = await authStorage.getUser(userId);
      const actorName = dbUser?.firstName || dbUser?.discordUsername || "Staff";

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        entityType: "grinder",
        entityId: grinder.id,
        action: "grinder_manually_added",
        actor: actorName,
        details: JSON.stringify({ discordUserId, name: resolvedName, category: resolvedCategory }),
      });

      res.json(grinder);
    } catch (err) {
      res.status(400).json({ message: String(err) });
    }
  });

  app.delete("/api/grinders/:id", requireOwner, async (req, res) => {
    try {
      const grinder = await storage.getGrinder(req.params.id);
      if (!grinder) return res.status(404).json({ message: "Grinder not found" });

      const deleteHistory = req.query.deleteHistory === "true";
      const actor = (req as any).userId || "owner";

      if (deleteHistory) {
        const deleted = await storage.deleteGrinder(req.params.id);
        if (!deleted) return res.status(500).json({ message: "Failed to delete grinder" });
        await storage.createAuditLog({
          id: `AL-${Date.now().toString(36)}`,
          entityType: "grinder",
          entityId: req.params.id,
          action: "grinder_permanently_deleted",
          actor,
          details: JSON.stringify({ name: grinder.name, discordUsername: grinder.discordUsername, historicalDataDeleted: true }),
        });
      } else {
        const removed = await storage.softRemoveGrinder(req.params.id, actor);
        if (!removed) return res.status(500).json({ message: "Failed to remove grinder" });
        await storage.createAuditLog({
          id: `AL-${Date.now().toString(36)}`,
          entityType: "grinder",
          entityId: req.params.id,
          action: "grinder_removed",
          actor,
          details: JSON.stringify({ name: grinder.name, discordUsername: grinder.discordUsername, historicalDataPreserved: true }),
        });
      }

      res.json({ success: true, deleteHistory });
    } catch (err) {
      res.status(400).json({ message: String(err) });
    }
  });

  app.get(api.orders.list.path, requireStaff, async (req, res) => {
    const results = await storage.getOrders();
    res.json(results);
  });

  app.get(api.orders.get.path, requireStaff, async (req, res) => {
    const result = await storage.getOrder(req.params.id);
    if (!result) return res.status(404).json({ message: "Order not found" });
    res.json(result);
  });

  app.post(api.orders.create.path, requireStaff, async (req, res) => {
    try {
      if (typeof req.body.orderDueDate === "string") {
        req.body.orderDueDate = new Date(req.body.orderDueDate);
      }
      const input = api.orders.create.input.parse(req.body);
      if (input.platform) input.platform = normalizePlatform(input.platform);
      if (!input.discordMessageId && !input.discordBidLink && input.isManual === undefined) {
        (input as any).isManual = true;
      }
      if (!input.orderBrief && !input.discordMessageId) {
        const allServices = await storage.getServices();
        const svc = allServices.find((s: any) => s.id === input.serviceId);
        if (svc?.defaultComplexity && (!input.complexity || input.complexity === 1)) {
          (input as any).complexity = svc.defaultComplexity;
        }
        const briefLines: string[] = [];
        if (svc) briefLines.push(`**Service:** ${svc.name.replace(/\s*[🔥🛠️🏆🃏🏟️🎁🎫➕⚡🎖️🪙]/g, "").trim()}`);
        if (input.platform) briefLines.push(`**Platform:** ${input.platform}`);
        if (input.gamertag) briefLines.push(`**Gamertag:** ${input.gamertag}`);
        if (input.customerPrice && Number(input.customerPrice) > 0) briefLines.push(`**Price:** $${Number(input.customerPrice).toFixed(2)}`);
        if (input.complexity && input.complexity > 1) briefLines.push(`**Complexity:** ${input.complexity}/5`);
        if (input.isRush) briefLines.push(`**Rush:** Yes`);
        if (input.isEmergency) briefLines.push(`**Emergency:** Yes`);
        if (input.location) briefLines.push(`**Location:** ${input.location}`);
        if (input.notes) briefLines.push(`**Notes:** ${input.notes}`);
        if (briefLines.length > 0) {
          (input as any).orderBrief = briefLines.join("\n");
        }
      }
      const result = await storage.createOrder(input);
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "order",
        entityId: result.id,
        action: "created",
        actor: getActorName(req),
        details: JSON.stringify({ customerPrice: result.customerPrice, serviceId: result.serviceId }),
      });
      createSystemNotification({
        roleScope: "grinder",
        type: "new_order",
        title: "New Order Available",
        body: `A new order (#${result.mgtOrderNumber || result.id}) is now open for bidding.`,
        linkUrl: "/grinder/orders",
        icon: "package",
        severity: "info",
      });
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.patch(api.orders.updateStatus.path, requireStaff, async (req, res) => {
    try {
      const { status, replacementAction, replacementReason } = api.orders.updateStatus.input.parse(req.body);
      const order = await storage.getOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Order not found" });

      if (status === "Need Replacement" && order.assignedGrinderId) {
        const allAssignments = await storage.getAssignments();
        const activeAssignment = allAssignments.find((a: any) => a.orderId === order.id && a.status === "Active");
        if (activeAssignment) {
          await storage.updateAssignment(activeAssignment.id, { status: "Cancelled" });
        }

        const grinder = await storage.getGrinder(order.assignedGrinderId);
        const staffUser = (req as any).user;
        const staffName = staffUser?.username || staffUser?.discordUsername || "Staff";
        const orderRef = order.mgtOrderNumber ? `#${order.mgtOrderNumber}` : order.id;
        const reasonText = replacementReason || "No reason provided";

        if (replacementAction === "strike" && grinder) {
          const newStrikes = grinder.strikes + 1;
          const STRIKE_FINES: Record<number, number> = { 1: 25, 2: 50, 3: 100 };
          const fineAmount = STRIKE_FINES[newStrikes] || 100;
          const currentFine = parseFloat(grinder.outstandingFine?.toString() || "0");
          const newOutstandingFine = (currentFine + fineAmount).toString();

          await storage.updateGrinder(order.assignedGrinderId, {
            strikes: newStrikes,
            suspended: true,
            outstandingFine: newOutstandingFine,
          });

          await storage.createStrikeLog({
            id: `SL-${Date.now().toString(36)}`,
            grinderId: order.assignedGrinderId,
            action: "add",
            reason: `Replacement on order ${orderRef}: ${reasonText}`,
            delta: 1,
            resultingStrikes: newStrikes,
            fineAmount: fineAmount.toString(),
            createdBy: staffName,
          });

          await createSystemNotification({
            userId: grinder.discordUserId,
            type: "replacement_strike",
            title: `Strike Issued — Order ${orderRef}`,
            body: `You have been removed from order ${orderRef} and received Strike ${newStrikes} with a $${fineAmount} fine. Reason: ${reasonText}`,
            severity: "error",
            linkUrl: "/my-orders",
          });
        } else if (replacementAction === "warning" && grinder) {
          await createSystemNotification({
            userId: grinder.discordUserId,
            type: "replacement_warning",
            title: `Warning — Removed from Order ${orderRef}`,
            body: `You have been removed from order ${orderRef} with a formal warning. Further issues may result in a strike. Reason: ${reasonText}`,
            severity: "warning",
            linkUrl: "/my-orders",
          });
        } else if (grinder) {
          await createSystemNotification({
            userId: grinder.discordUserId,
            type: "replacement_no_penalty",
            title: `Removed from Order ${orderRef}`,
            body: `You have been removed from order ${orderRef} with no penalties. Reason: ${reasonText}`,
            severity: "info",
            linkUrl: "/my-orders",
          });
        }

        await storage.createAuditLog({
          id: `AL-${Date.now().toString(36)}`,
          entityType: "order",
          entityId: order.id,
          action: "need_replacement",
          actor: staffName,
          details: JSON.stringify({
            previousGrinderId: order.assignedGrinderId,
            previousGrinderName: grinder?.name || "Unknown",
            replacementAction: replacementAction || "no_penalty",
            reason: reasonText,
          }),
        });

        await recalcGrinderStats(order.assignedGrinderId);
      }

      const result = await storage.updateOrderStatus(req.params.id, status);

      if (status === "Completed" && order.assignedGrinderId) {
        const allAssignments = await storage.getAssignments();
        const activeAssignment = allAssignments.find((a: any) => a.orderId === order.id && (a.status === "Active" || a.status === "Completed"));
        if (activeAssignment) {
          if (activeAssignment.status === "Active") {
            const now = new Date();
            const dueDate = order.orderDueDate ? new Date(order.orderDueDate) : (activeAssignment.dueDateTime ? new Date(activeAssignment.dueDateTime) : null);
            const isOnTime = dueDate ? now <= dueDate : true;
            await storage.updateAssignment(activeAssignment.id, {
              status: "Completed",
              deliveredDateTime: now,
              isOnTime,
            });
            await recalcGrinderStats(order.assignedGrinderId);
          }

          const payoutAmount = activeAssignment.grinderEarnings || activeAssignment.bidAmount || "0";
          const payoutMethods = await storage.getGrinderPayoutMethods(order.assignedGrinderId);
          const defaultMethod = payoutMethods.find((m: any) => m.isDefault) || payoutMethods[0];
          const existingPayouts = await storage.getPayoutRequests(order.assignedGrinderId);
          const alreadyRequested = existingPayouts.find((p: any) => p.assignmentId === activeAssignment.id);

          if (!alreadyRequested && Number(payoutAmount) > 0) {
            await storage.createPayoutRequest({
              id: `PR-${Date.now().toString(36)}`,
              assignmentId: activeAssignment.id,
              orderId: order.id,
              grinderId: order.assignedGrinderId,
              amount: String(payoutAmount),
              payoutPlatform: defaultMethod?.platform || null,
              payoutDetails: defaultMethod?.details || null,
              status: "Pending Grinder Approval",
              notes: "Auto-created on staff completion - awaiting grinder confirmation",
              reviewedBy: null,
            });
          }
        }
      }

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "order",
        entityId: req.params.id,
        action: `status_changed_to_${status}`,
        actor: getActorName(req),
        details: JSON.stringify({ newStatus: status, previousStatus: order.status, previousGrinderId: order.assignedGrinderId }),
      });
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.orders.delete.path, requireOwner, async (req, res) => {
    try {
      const deleted = await storage.deleteOrder(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Order not found" });
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "order",
        entityId: req.params.id,
        action: "deleted",
        actor: getActorName(req),
        details: JSON.stringify({ orderId: req.params.id }),
      });
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ message: String(err) });
    }
  });

  app.post(api.orders.staffAssign.path, requireStaff, async (req, res) => {
    try {
      const input = api.orders.staffAssign.input.parse(req.body);
      const orderId = req.params.id;

      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ message: "Order not found" });
      const isReplacement = order.status === "Need Replacement";
      if (!isReplacement && order.status !== "Open" && order.status !== "Bidding Closed") {
        return res.status(400).json({ message: `Cannot assign order with status "${order.status}". Order must be Open, Bidding Closed, or Need Replacement.` });
      }
      if (!isReplacement && order.assignedGrinderId) {
        return res.status(400).json({ message: "Order already has a grinder assigned" });
      }

      const grinder = await storage.getGrinder(input.grinderId);
      if (!grinder) return res.status(404).json({ message: "Grinder not found" });
      if (grinder.suspended) {
        const fine = parseFloat(grinder.outstandingFine?.toString() || "0");
        return res.status(403).json({ message: `Grinder is suspended with $${fine.toFixed(2)} outstanding fine. Clear fines before assigning.` });
      }

      const bidAmount = parseFloat(input.bidAmount);
      if (isNaN(bidAmount) || bidAmount < 0) return res.status(400).json({ message: "Invalid bid/pay amount" });

      const customerPrice = Number(order.customerPrice || 0);
      const now = new Date();

      const { db } = await import("./db");
      const { orders: ordersTable } = await import("@shared/schema");
      const { eq, sql, and } = await import("drizzle-orm");

      let originalGrinderId: string | null = null;
      let originalGrinderPay = 0;
      let cancelledAssignment: any = null;

      if (isReplacement) {
        const allAssignments = await storage.getAssignments();
        const cancelledAssignments = allAssignments
          .filter((a: any) => a.orderId === orderId && a.status === "Cancelled")
          .sort((a: any, b: any) => new Date(a.assignedDateTime).getTime() - new Date(b.assignedDateTime).getTime());

        if (cancelledAssignments.length > 0) {
          originalGrinderId = cancelledAssignments[0].grinderId;
          originalGrinderPay = cancelledAssignments.reduce((sum: number, a: any) => {
            return sum + Number(a.grinderEarnings || a.bidAmount || 0);
          }, 0);
          cancelledAssignment = cancelledAssignments[cancelledAssignments.length - 1];
        }
      }

      const totalGrinderCost = isReplacement ? (originalGrinderPay + bidAmount) : bidAmount;
      const margin = customerPrice - totalGrinderCost;
      const marginPct = customerPrice > 0 ? (margin / customerPrice) * 100 : 0;
      const companyProfit = margin;

      const [lockedOrder] = await db.update(ordersTable).set({
        status: "Assigned",
        assignedGrinderId: input.grinderId,
        companyProfit: companyProfit.toFixed(2),
      }).where(
        isReplacement
          ? and(eq(ordersTable.id, orderId), sql`${ordersTable.status} = 'Need Replacement'`)
          : and(eq(ordersTable.id, orderId), sql`${ordersTable.status} IN ('Open', 'Bidding Closed')`, sql`${ordersTable.assignedGrinderId} IS NULL`)
      ).returning();

      if (!lockedOrder) {
        return res.status(409).json({ message: "Order was already assigned by another action. Please refresh and try again." });
      }

      const assignmentId = `ASN-${Date.now().toString(36)}`;
      const assignmentData: any = {
        id: assignmentId,
        grinderId: input.grinderId,
        orderId: orderId,
        assignedDateTime: now,
        status: "Active",
        bidAmount: input.bidAmount,
        orderPrice: order.customerPrice,
        margin: margin.toFixed(2),
        marginPct: marginPct.toFixed(2),
        companyProfit: companyProfit.toFixed(2),
        grinderEarnings: input.bidAmount,
        dueDateTime: order.orderDueDate,
        notes: input.notes || (isReplacement ? "Replacement grinder assignment" : "Staff override assignment"),
      };

      if (isReplacement && originalGrinderId) {
        assignmentData.wasReassigned = true;
        assignmentData.originalGrinderId = originalGrinderId;
        assignmentData.replacementGrinderId = input.grinderId;
        assignmentData.originalGrinderPay = originalGrinderPay.toFixed(2);
        assignmentData.replacementGrinderPay = bidAmount.toFixed(2);
        assignmentData.replacedAt = now;
        assignmentData.replacementReason = input.notes || "Need Replacement";
      }

      const assignment = await storage.createAssignment(assignmentData);

      if (order.firstBidAt && order.biddingClosesAt && new Date(order.biddingClosesAt) > now) {
        const existingStages = (order.biddingNotifiedStages as string[]) || [];
        const updatedStages = existingStages.includes("closed") ? existingStages : [...existingStages, "closed"];
        await storage.updateOrder(orderId, {
          biddingClosesAt: now,
          biddingNotifiedStages: updatedStages,
        } as any);
      }

      const allBids = await storage.getBids();
      const orderBids = allBids.filter(b => b.orderId === orderId);
      let acceptedBidId: string | null = null;
      const orderLabel = order.mgtOrderNumber ? `#${order.mgtOrderNumber}` : orderId;
      for (const bid of orderBids) {
        if (bid.grinderId === input.grinderId && bid.status === "Pending") {
          await storage.updateBidStatus(bid.id, "Accepted", "staff_override");
          acceptedBidId = bid.id;
        } else if (bid.status === "Pending" || bid.status === "Countered") {
          await storage.updateBidStatus(bid.id, "Denied", "staff_override");
          await storage.createStaffAlert({
            id: `SA-${Date.now().toString(36)}-${bid.grinderId}`,
            targetType: "grinder",
            grinderId: bid.grinderId,
            title: `Order ${orderLabel} Assigned`,
            message: `Order ${orderLabel} has been assigned to another grinder. Your bid of $${bid.bidAmount} was not selected.`,
            severity: "warning",
            createdBy: "system",
          });
        }
      }

      if (!acceptedBidId) {
        const staffBidId = `BID-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        await storage.createBid({
          id: staffBidId,
          orderId: orderId,
          grinderId: input.grinderId,
          bidAmount: input.bidAmount,
          bidTime: now,
          estDeliveryDate: order.orderDueDate || now,
          timeline: "Staff assigned",
          canStart: "Immediately",
          qualityScore: null,
          margin: margin.toFixed(2),
          marginPct: marginPct.toFixed(2),
          notes: input.notes || "Auto-created bid from staff override assignment",
          status: "Accepted",
          acceptedBy: "staff_override",
        });
        acceptedBidId = staffBidId;
      }

      await storage.updateOrder(orderId, { acceptedBidId });

      await storage.updateGrinder(input.grinderId, { lastAssigned: now });
      await recalcGrinderStats(input.grinderId);

      const user = (req as any).user;
      const actorName = user?.discordUsername || user?.firstName || "staff";
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "assignment",
        entityId: assignmentId,
        action: "staff_override_assign",
        actor: actorName,
        details: JSON.stringify({
          orderId,
          grinderId: input.grinderId,
          grinderName: grinder.name,
          bidAmount: input.bidAmount,
          customerPrice: order.customerPrice,
          margin: margin.toFixed(2),
          notes: input.notes,
        }),
      });

      res.status(201).json(assignment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      console.error("[staff-assign] Error:", err);
      res.status(500).json({ message: "Failed to assign grinder" });
    }
  });

  async function recalcMarginsForOrder(orderId: string, newPrice: number) {
    const allBids = await storage.getBids();
    const orderBids = allBids.filter(b => b.orderId === orderId);
    for (const bid of orderBids) {
      const bidAmt = Number(bid.bidAmount) || 0;
      const margin = newPrice - bidAmt;
      const marginPct = newPrice > 0 ? ((margin / newPrice) * 100).toFixed(2) : "0";
      await storage.updateBid(bid.id, { margin: String(margin.toFixed(2)), marginPct } as any);
    }
    const allAssignments = await storage.getAssignments();
    const orderAssignments = allAssignments.filter(a => a.orderId === orderId);
    for (const assignment of orderAssignments) {
      const bidAmt = Number(assignment.bidAmount) || 0;
      const margin = newPrice - bidAmt;
      const marginPct = newPrice > 0 ? ((margin / newPrice) * 100).toFixed(2) : "0";
      const companyProfit = newPrice - (Number(assignment.grinderEarnings) || bidAmt);
      await storage.updateAssignment(assignment.id, {
        margin: String(margin.toFixed(2)),
        marginPct,
        companyProfit: String(companyProfit.toFixed(2)),
      } as any);
    }
  }

  app.patch(api.orders.updatePrice.path, requireStaff, async (req, res) => {
    try {
      const { customerPrice } = api.orders.updatePrice.input.parse(req.body);
      const result = await storage.updateOrder(req.params.id, { customerPrice });
      if (!result) return res.status(404).json({ message: "Order not found" });
      await recalcMarginsForOrder(req.params.id, Number(customerPrice));
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "order",
        entityId: req.params.id,
        action: "price_updated",
        actor: getActorName(req),
        details: JSON.stringify({ newPrice: customerPrice }),
      });
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.orders.update.path, requireStaff, async (req, res) => {
    try {
      const input = api.orders.update.input.parse(req.body);
      const updateData: any = { ...input };
      if (updateData.platform) updateData.platform = normalizePlatform(updateData.platform);
      if (input.orderDueDate) {
        updateData.orderDueDate = new Date(input.orderDueDate);
      }
      if (input.completedAt !== undefined) {
        updateData.completedAt = input.completedAt ? new Date(input.completedAt) : null;
      }
      const briefFields = ["platform", "serviceId", "gamertag", "complexity", "location", "notes", "customerPrice", "isRush", "isEmergency"];
      const touchesBriefFields = briefFields.some(f => f in input);

      if (touchesBriefFields && input.orderBrief === undefined) {
        const existingOrder = await storage.getOrder(req.params.id);
        if (existingOrder) {
          const merged = { ...existingOrder, ...updateData };
          const allServices = await storage.getServices();
          const svc = allServices.find((s: any) => s.id === merged.serviceId);
          const briefLines: string[] = [];
          if (svc) briefLines.push(`**Service:** ${svc.name.replace(/\s*[🔥🛠️🏆🃏🏟️🎁🎫➕⚡🎖️🪙]/g, "").trim()}`);
          if (merged.platform) briefLines.push(`**Platform:** ${merged.platform}`);
          if (merged.gamertag) briefLines.push(`**Gamertag:** ${merged.gamertag}`);
          if (merged.mgtOrderNumber) briefLines.push(`**Order ID:** #${merged.mgtOrderNumber}`);
          if (merged.customerPrice && Number(merged.customerPrice) > 0) briefLines.push(`**Price:** $${Number(merged.customerPrice).toFixed(2)}`);
          if (merged.complexity && merged.complexity > 1) briefLines.push(`**Complexity:** ${merged.complexity}/5`);
          if (merged.isRush) briefLines.push(`**Rush:** Yes`);
          if (merged.isEmergency) briefLines.push(`**Emergency:** Yes`);
          if (merged.location) briefLines.push(`**Location:** ${merged.location}`);
          if (merged.notes) briefLines.push(`**Notes:** ${merged.notes}`);
          if (briefLines.length > 0) {
            updateData.orderBrief = briefLines.join("\n");
          }
        }
      }

      const result = await storage.updateOrder(req.params.id, updateData);
      if (!result) return res.status(404).json({ message: "Order not found" });
      if (input.customerPrice !== undefined) {
        await recalcMarginsForOrder(req.params.id, Number(input.customerPrice));
      }
      const changedFields = Object.keys(input).join(", ");
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "order",
        entityId: req.params.id,
        action: "fields_updated",
        actor: getActorName(req),
        details: JSON.stringify(input),
      });
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(400).json({ message: String(err) });
    }
  });

  app.get(api.orders.suggestions.path, requireStaff, async (req, res) => {
    const suggestions = await storage.getSuggestionsForOrder(req.params.id);
    res.json(suggestions);
  });

  app.patch(api.orders.linkTicket.path, requireStaff, async (req, res) => {
    try {
      const input = api.orders.linkTicket.input.parse(req.body);
      const order = await storage.getOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Order not found" });
      const result = await storage.updateOrder(req.params.id, { discordTicketChannelId: input.discordTicketChannelId } as any);
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "order",
        entityId: req.params.id,
        action: "ticket_linked",
        actor: getActorName(req),
        details: JSON.stringify({ discordTicketChannelId: input.discordTicketChannelId }),
      });
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: String(err) });
    }
  });

  app.delete(api.orders.unlinkTicket.path, requireStaff, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Order not found" });
      const result = await storage.updateOrder(req.params.id, { discordTicketChannelId: null } as any);
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "order",
        entityId: req.params.id,
        action: "ticket_unlinked",
        actor: getActorName(req),
        details: JSON.stringify({ orderId: req.params.id }),
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.post(api.orders.ticketInvite.path, isAuthenticated, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (!order.discordTicketChannelId) return res.status(400).json({ message: "No ticket linked to this order" });

      const userId = (req as any).userId;
      const authUser = await authStorage.getUser(userId);
      const isStaff = authUser?.role === "staff" || authUser?.role === "owner";

      if (!isStaff) {
        const allGrinders = await storage.getGrinders();
        const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
        if (!myGrinder || order.assignedGrinderId !== myGrinder.id) {
          return res.status(403).json({ message: "You can only access tickets for orders assigned to you." });
        }
      }

      const { getDiscordBotClient } = await import("./discord/bot");
      const client = getDiscordBotClient();
      if (!client) return res.status(503).json({ message: "Discord bot is not connected" });

      try {
        const channel = await client.channels.fetch(order.discordTicketChannelId);
        if (!channel) return res.status(404).json({ message: "Discord channel not found" });

        if ('guild' in channel && (channel as any).guild) {
          const guildId = (channel as any).guild.id;
          if ('createInvite' in channel && typeof channel.createInvite === 'function') {
            const invite = await channel.createInvite({ maxAge: 3600, maxUses: 1, unique: true });
            return res.json({ inviteUrl: `https://discord.gg/${invite.code}`, channelId: order.discordTicketChannelId, guildId });
          } else {
            return res.json({ channelUrl: `https://discord.com/channels/${guildId}/${order.discordTicketChannelId}`, channelId: order.discordTicketChannelId, guildId });
          }
        } else {
          return res.json({ channelUrl: `https://discord.com/channels/@me/${order.discordTicketChannelId}`, channelId: order.discordTicketChannelId });
        }
      } catch (discordErr: any) {
        console.error("[ticket-invite] Discord error:", discordErr);
        return res.status(500).json({ message: "Could not create invite. The bot may not have permission to access that channel." });
      }
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/bidding-timers", async (req, res) => {
    const allOrders = await storage.getOrders();
    const activeTimers = allOrders
      .filter(o => o.status === "Open" && o.biddingClosesAt)
      .map(o => ({
        orderId: o.id,
        mgtOrderNumber: o.mgtOrderNumber,
        status: o.status,
        firstBidAt: o.firstBidAt,
        biddingClosesAt: o.biddingClosesAt,
        createdAt: o.createdAt,
      }));
    const recentlyClosed = allOrders
      .filter(o => o.status === "Bidding Closed" && o.biddingClosesAt)
      .filter(o => {
        const closedTime = new Date(o.biddingClosesAt!).getTime();
        return Date.now() - closedTime < 5 * 60 * 1000;
      })
      .map(o => ({
        orderId: o.id,
        mgtOrderNumber: o.mgtOrderNumber,
        status: o.status,
        firstBidAt: o.firstBidAt,
        biddingClosesAt: o.biddingClosesAt,
        createdAt: o.createdAt,
      }));
    res.json({ activeTimers, recentlyClosed, serverTime: new Date().toISOString() });
  });

  app.get(api.bids.list.path, requireStaff, async (req, res) => {
    const results = await storage.getBids();
    res.json(results);
  });

  app.post(api.bids.create.path, requireStaff, async (req, res) => {
    try {
      const body = req.body;
      const input = {
        id: body.id || `BID-${Date.now().toString(36)}`,
        orderId: body.orderId,
        grinderId: body.grinderId,
        bidAmount: String(body.bidAmount),
        bidTime: body.bidTime ? new Date(body.bidTime) : new Date(),
        estDeliveryDate: body.estDeliveryDate ? new Date(body.estDeliveryDate) : new Date(Date.now() + 48 * 3600000),
        timeline: body.timeline || null,
        canStart: body.canStart || null,
        notes: body.notes || null,
        status: body.status || "Pending",
        margin: body.margin ? String(body.margin) : null,
        marginPct: body.marginPct ? String(body.marginPct) : null,
      };
      if (!input.orderId || !input.grinderId) {
        return res.status(400).json({ message: "orderId and grinderId are required" });
      }
      const result = await storage.createBid(input);
      const userId = (req as any).userId;
      const dbUser = userId ? await authStorage.getUser(userId) : null;
      const actorName = dbUser?.firstName || dbUser?.discordUsername || "Staff";
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "bid",
        entityId: result.id,
        action: "created",
        actor: actorName,
        details: JSON.stringify({ orderId: result.orderId, grinderId: result.grinderId, bidAmount: result.bidAmount, manuallyAdded: true }),
      });

      const order = await storage.getOrder(result.orderId);
      if (order && !order.firstBidAt) {
        const now = new Date();
        const biddingCloses = new Date(now.getTime() + 10 * 60 * 1000);
        await storage.updateOrder(order.id, { firstBidAt: now, biddingClosesAt: biddingCloses });
      }

      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.patch("/api/bids/:id/status", requireStaff, async (req, res) => {
    try {
      const { status, acceptedBy } = req.body;
      if (!status || !["Accepted", "Denied", "Pending"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const bid = await storage.getBid(req.params.id);
      if (!bid) return res.status(404).json({ message: "Bid not found" });

      const userId = (req as any).userId;
      const dbUser = await authStorage.getUser(userId);
      const actorName = acceptedBy || dbUser?.firstName || dbUser?.discordUsername || "Staff";

      await storage.updateBidStatus(bid.id, status, actorName);

      if (status === "Accepted") {
        const order = await storage.getOrder(bid.orderId);
        if (order) {
          const bidAmount = Number(bid.bidAmount) || 0;
          const orderPrice = Number(order.customerPrice) || 0;
          const margin = orderPrice - bidAmount;
          const marginPct = orderPrice > 0 ? ((margin / orderPrice) * 100).toFixed(2) : "0";
          const companyProfit = margin > 0 ? margin : 0;

          await storage.updateOrder(bid.orderId, {
            acceptedBidId: bid.id,
            status: "Assigned",
            assignedGrinderId: bid.grinderId,
            companyProfit: companyProfit.toFixed(2),
          });

          const now = new Date();
          const assignmentId = `ASN-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
          await storage.createAssignment({
            id: assignmentId,
            grinderId: bid.grinderId,
            orderId: bid.orderId,
            assignedDateTime: now,
            status: "Active",
            bidAmount: bid.bidAmount,
            orderPrice: order.customerPrice,
            margin: margin.toFixed(2),
            marginPct,
            companyProfit: companyProfit.toFixed(2),
            grinderEarnings: bid.bidAmount,
            dueDateTime: order.orderDueDate,
            notes: `Assigned via bid acceptance by ${actorName}`,
          });

          await storage.updateGrinder(bid.grinderId, { lastAssigned: now });
          await recalcGrinderStats(bid.grinderId);

          if (order.firstBidAt && order.biddingClosesAt && new Date(order.biddingClosesAt) > now) {
            const existingStages = (order.biddingNotifiedStages as string[]) || [];
            const updatedStages = existingStages.includes("closed") ? existingStages : [...existingStages, "closed"];
            await storage.updateOrder(bid.orderId, {
              biddingClosesAt: now,
              biddingNotifiedStages: updatedStages,
            } as any);
          }

          const orderLabel = order.mgtOrderNumber ? `#${order.mgtOrderNumber}` : bid.orderId;

          const winnerGrinder = await storage.getGrinder(bid.grinderId);
          if (winnerGrinder) {
            createSystemNotification({
              userId: winnerGrinder.discordUserId,
              type: "bid_accepted",
              title: "Bid Accepted!",
              body: `Your bid of $${bid.bidAmount} on order ${orderLabel} was accepted. You've been assigned!`,
              linkUrl: "/grinder/orders",
              icon: "check-circle",
              severity: "success",
            });
          }

          const allBids = await storage.getBids();
          const otherBids = allBids.filter(b => b.orderId === bid.orderId && b.id !== bid.id && (b.status === "Pending" || b.status === "Countered"));
          for (const ob of otherBids) {
            await storage.updateBidStatus(ob.id, "Denied", actorName);
            await storage.createStaffAlert({
              id: `SA-${Date.now().toString(36)}-${ob.grinderId}`,
              targetType: "grinder",
              grinderId: ob.grinderId,
              title: `Order ${orderLabel} Assigned`,
              message: `Order ${orderLabel} has been assigned to another grinder. Your bid of $${ob.bidAmount} was not selected.`,
              severity: "warning",
              createdBy: "system",
            });
            const loserGrinder = await storage.getGrinder(ob.grinderId);
            if (loserGrinder) {
              createSystemNotification({
                userId: loserGrinder.discordUserId,
                type: "bid_denied",
                title: "Bid Not Selected",
                body: `Your bid of $${ob.bidAmount} on order ${orderLabel} was not selected.`,
                linkUrl: "/grinder/orders",
                icon: "x-circle",
                severity: "warning",
              });
            }
          }
          if (otherBids.length > 0) {
            console.log(`[bids] Auto-denied ${otherBids.length} other bid(s) on order ${bid.orderId}`);
          }
        }
      }

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "bid",
        entityId: bid.id,
        action: `bid_${status.toLowerCase()}_by_staff`,
        actor: actorName,
        details: JSON.stringify({ orderId: bid.orderId, grinderId: bid.grinderId, bidAmount: bid.bidAmount }),
      });

      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ message: String(err) });
    }
  });

  app.patch("/api/bids/:id/edit", requireStaff, async (req, res) => {
    try {
      const bid = await storage.getBid(req.params.id);
      if (!bid) return res.status(404).json({ message: "Bid not found" });

      const { bidAmount, timeline, canStart, notes } = req.body;
      const updateData: any = {};
      if (bidAmount !== undefined) updateData.bidAmount = String(bidAmount);
      if (timeline !== undefined) updateData.timeline = timeline;
      if (canStart !== undefined) updateData.canStart = canStart;
      if (notes !== undefined) updateData.notes = notes;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No fields to update" });
      }

      if (updateData.bidAmount) {
        const order = await storage.getOrder(bid.orderId);
        if (order && order.customerPrice) {
          const orderPrice = Number(order.customerPrice);
          const newBidAmount = Number(updateData.bidAmount);
          const margin = orderPrice - newBidAmount;
          const marginPct = orderPrice > 0 ? ((margin / orderPrice) * 100).toFixed(2) : "0";
          updateData.margin = String(margin);
          updateData.marginPct = marginPct;
        }
      }

      const updated = await storage.updateBid(bid.id, updateData);

      const userId = (req as any).userId;
      const dbUser = await authStorage.getUser(userId);
      const actorName = dbUser?.firstName || dbUser?.discordUsername || "Staff";

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        entityType: "bid",
        entityId: bid.id,
        action: "bid_edited_by_staff",
        actor: actorName,
        details: JSON.stringify({ changes: updateData, previousAmount: bid.bidAmount }),
      });

      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: String(err) });
    }
  });

  app.patch("/api/bids/:id/override", requireOwner, async (req, res) => {
    try {
      const { status, acceptedBy } = req.body;
      if (!status || !["Accepted", "Denied", "Pending"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const bid = await storage.getBid(req.params.id);
      if (!bid) return res.status(404).json({ message: "Bid not found" });

      const userId = (req as any).userId;
      const dbUser = await authStorage.getUser(userId);
      const actorName = acceptedBy || dbUser?.firstName || dbUser?.discordUsername || "Owner";
      const previousStatus = bid.status;
      const previousAcceptedBy = bid.acceptedBy;

      await storage.updateBidStatus(bid.id, status, `${actorName} (override)`);

      if (status === "Accepted") {
        const order = await storage.getOrder(bid.orderId);
        if (order) {
          const prevAccepted = order.acceptedBidId;
          if (prevAccepted && prevAccepted !== bid.id) {
            await storage.updateBidStatus(prevAccepted, "Order Assigned", `${actorName} (override)`);
          }

          const bidAmount = Number(bid.bidAmount) || 0;
          const orderPrice = Number(order.customerPrice) || 0;
          const margin = orderPrice - bidAmount;
          const marginPct = orderPrice > 0 ? ((margin / orderPrice) * 100).toFixed(2) : "0";
          const companyProfit = margin > 0 ? margin : 0;

          await storage.updateOrder(bid.orderId, {
            acceptedBidId: bid.id,
            status: "Assigned",
            assignedGrinderId: bid.grinderId,
            companyProfit: companyProfit.toFixed(2),
          });

          const now = new Date();
          const assignmentId = `ASN-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
          await storage.createAssignment({
            id: assignmentId,
            grinderId: bid.grinderId,
            orderId: bid.orderId,
            assignedDateTime: now,
            status: "Active",
            bidAmount: bid.bidAmount,
            orderPrice: order.customerPrice,
            margin: margin.toFixed(2),
            marginPct,
            companyProfit: companyProfit.toFixed(2),
            grinderEarnings: bid.bidAmount,
            dueDateTime: order.orderDueDate,
            notes: `Owner override assignment by ${actorName}`,
          });

          await storage.updateGrinder(bid.grinderId, { lastAssigned: now });
          await recalcGrinderStats(bid.grinderId);

          const orderLabel = order.mgtOrderNumber ? `#${order.mgtOrderNumber}` : bid.orderId;
          const allBids = await storage.getBids();
          const otherBids = allBids.filter(b => b.orderId === bid.orderId && b.id !== bid.id && (b.status === "Pending" || b.status === "Countered"));
          for (const ob of otherBids) {
            await storage.updateBidStatus(ob.id, "Denied", `${actorName} (override)`);
            await storage.createStaffAlert({
              id: `SA-${Date.now().toString(36)}-${ob.grinderId}`,
              targetType: "grinder",
              grinderId: ob.grinderId,
              title: `Order ${orderLabel} Assigned`,
              message: `Order ${orderLabel} has been assigned to another grinder. Your bid of $${ob.bidAmount} was not selected.`,
              severity: "warning",
              createdBy: "system",
            });
          }
          if (otherBids.length > 0) {
            console.log(`[bids] Owner override auto-denied ${otherBids.length} other bid(s) on order ${bid.orderId}`);
          }
        }
      } else if (status === "Denied" || status === "Pending") {
        const order = await storage.getOrder(bid.orderId);
        if (order && order.acceptedBidId === bid.id) {
          await storage.updateOrder(bid.orderId, { acceptedBidId: null, status: "Open", assignedGrinderId: null });
        }
      }

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "bid",
        entityId: bid.id,
        action: "owner_override_bid",
        actor: actorName,
        details: JSON.stringify({
          orderId: bid.orderId,
          grinderId: bid.grinderId,
          previousStatus,
          previousAcceptedBy,
          newStatus: status,
        }),
      });

      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ message: String(err) });
    }
  });

  app.get(api.assignments.list.path, requireStaff, async (req, res) => {
    const results = await storage.getAssignments();
    res.json(results);
  });

  app.post(api.assignments.create.path, requireStaff, async (req, res) => {
    try {
      const input = api.assignments.create.input.parse(req.body);
      const result = await storage.createAssignment(input);
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "assignment",
        entityId: result.id,
        action: "created",
        actor: getActorName(req),
        details: JSON.stringify({ grinderId: result.grinderId, orderId: result.orderId }),
      });
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.post(api.assignments.replace.path, requireStaff, async (req, res) => {
    try {
      const input = api.assignments.replace.input.parse(req.body);
      const assignment = await storage.getAssignment(req.params.id);
      if (!assignment) return res.status(404).json({ message: "Assignment not found" });
      if (assignment.status !== "Active") return res.status(400).json({ message: "Can only replace grinders on active assignments" });

      const replacementGrinder = await storage.getGrinder(input.replacementGrinderId);
      if (!replacementGrinder) return res.status(404).json({ message: "Replacement grinder not found" });

      const origPay = parseFloat(input.originalGrinderPay) || 0;
      const replPay = parseFloat(input.replacementGrinderPay) || 0;
      if (origPay < 0 || replPay < 0) return res.status(400).json({ message: "Pay values cannot be negative" });

      const originalGrinderId = assignment.grinderId;
      const result = await storage.replaceGrinder(req.params.id, {
        replacementGrinderId: input.replacementGrinderId,
        originalGrinderPay: input.originalGrinderPay,
        replacementGrinderPay: input.replacementGrinderPay,
        reason: input.reason,
      });

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "assignment",
        entityId: req.params.id,
        action: "grinder_replaced",
        actor: getActorName(req),
        details: JSON.stringify({
          orderId: assignment.orderId,
          originalGrinderId,
          replacementGrinderId: input.replacementGrinderId,
          originalGrinderPay: input.originalGrinderPay,
          replacementGrinderPay: input.replacementGrinderPay,
          reason: input.reason,
        }),
      });

      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(400).json({ message: String(err) });
    }
  });

  app.get("/api/grinder/me", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    let myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);

    const authUser = await authStorage.getUser(userId);

    if (!myGrinder && authUser && (authUser.role === "grinder" || authUser.role === "owner" || authUser.role === "staff")) {
      const { GRINDER_ROLES: GR, ROLE_LABELS: RL, ROLE_CAPACITY: RC } = await import("@shared/schema");
      const displayName = authUser.firstName || authUser.discordUsername || authUser.username || "Unknown";
      const isDevElite = userId === "dev-elite-user";
      const discordRoles = (authUser as any).discordRoles as string[] | null;

      const detectedRoles = new Set<string>(["Grinder"]);
      if (discordRoles) {
        for (const dRoleId of discordRoles) {
          const label = RL[dRoleId];
          if (label) detectedRoles.add(label);
        }
      }
      if (isDevElite) detectedRoles.add("Elite Grinder");
      const hasElite = detectedRoles.has("Elite Grinder");
      const rolesArr = Array.from(detectedRoles);

      myGrinder = await storage.createGrinder({
        id: `G-${Date.now().toString(36)}`,
        name: displayName,
        discordUserId: userId,
        discordUsername: authUser.discordUsername || authUser.username || null,
        discordRoleId: hasElite ? GR.ELITE : null,
        category: hasElite ? "Elite Grinder" : rolesArr.find(r => r !== "Grinder") || "Grinder",
        tier: "New",
        roles: rolesArr,
        capacity: hasElite ? (RC[GR.ELITE] || 5) : 3,
      });
    }

    if (!myGrinder) return res.json(null);
    if (myGrinder.isRemoved) return res.status(403).json({ message: "Your access has been revoked. Contact staff for more information." });

    if (authUser) {
      const displayName = authUser.firstName || authUser.discordUsername || "Unknown";
      const shouldSyncName = displayName !== "Unknown" && (myGrinder.name === "Unknown" || (userId.startsWith("dev-") && displayName !== myGrinder.name));
      if (shouldSyncName) {
        await storage.updateGrinder(myGrinder.id, { name: displayName, discordUsername: authUser.discordUsername || myGrinder.discordUsername });
        myGrinder = { ...myGrinder, name: displayName, discordUsername: authUser.discordUsername || myGrinder.discordUsername };
      }
    }

    if (authUser) {
      const { GRINDER_ROLES, ROLE_LABELS } = await import("@shared/schema");
      const discordRoles = (authUser as any).discordRoles as string[] | null;
      const grinderCurrentRoles = (myGrinder as any).roles as string[] | null;

      const isDevElite = userId === "dev-elite-user";
      if (discordRoles && discordRoles.length > 0 || isDevElite) {
        const detectedRoles = new Set<string>();
        if (discordRoles) {
          for (const dRoleId of discordRoles) {
            const label = ROLE_LABELS[dRoleId];
            if (label) detectedRoles.add(label);
          }
        }
        if (isDevElite) detectedRoles.add("Elite Grinder");
        if (detectedRoles.size === 0) detectedRoles.add("Grinder");
        if (!detectedRoles.has("Grinder") && detectedRoles.size > 0) detectedRoles.add("Grinder");

        const newRolesArr = Array.from(detectedRoles);
        const hasElite = detectedRoles.has("Elite Grinder");
        const wasElite = grinderCurrentRoles && grinderCurrentRoles.includes("Elite Grinder");
        const currentSorted = (grinderCurrentRoles || []).slice().sort().join(",");
        const newSorted = newRolesArr.slice().sort().join(",");

        if (currentSorted !== newSorted) {
          const roleSync: any = {
            roles: newRolesArr,
            category: hasElite ? "Elite Grinder" : newRolesArr.find(r => r !== "Grinder") || "Grinder",
            discordRoleId: hasElite ? GRINDER_ROLES.ELITE : null,
          };
          if (hasElite) {
            if (!myGrinder.eliteSince) roleSync.eliteSince = new Date();
          } else if (wasElite && !hasElite) {
            roleSync.eliteSince = null;
          }
          await storage.updateGrinder(myGrinder.id, roleSync);
          myGrinder = { ...myGrinder, ...roleSync };
          console.log(`[grinder-me] Synced roles for ${myGrinder.name}: ${newRolesArr.join(", ")}`);
        }
      }
    }

    const allAssignments = await storage.getAssignments();
    const myAssignments = allAssignments.filter((a: any) => a.grinderId === myGrinder.id);

    const allBids = await storage.getBids();
    const myBids = allBids.filter((b: any) => b.grinderId === myGrinder.id);

    const allOrders = await storage.getOrders();
    const myOrderUpdates = await storage.getOrderUpdates(myGrinder.id);
    const myPayoutRequests = await storage.getPayoutRequests(myGrinder.id);
    const myPayoutMethods = await storage.getGrinderPayoutMethods(myGrinder.id);
    const myStrikeLogs = await storage.getStrikeLogs(myGrinder.id);
    const myStrikeAppeals = await storage.getStrikeAppeals(myGrinder.id);
    const myAlerts = await storage.getStaffAlerts(myGrinder.id);
    const mySystemNotifications = await storage.getNotificationsForUser(userId, "grinder");
    const myEliteRequests = await storage.getEliteRequests(myGrinder.id);

    const grinderRoles = (myGrinder as any).roles as string[] | null;
    const isElite = myGrinder.discordRoleId === "1466370965016412316" || myGrinder.tier === "Elite" || myGrinder.category === "Elite Grinder" || (grinderRoles && grinderRoles.includes("Elite Grinder"));
    const now = new Date();

    const updates: any = {};
    if (!myGrinder.joinedAt && myGrinder.discordUserId) {
      try {
        const { getDiscordBotClient } = await import("./discord/auth");
        const botClient = getDiscordBotClient();
        if (botClient) {
          for (const guild of botClient.guilds.cache.values()) {
            try {
              const member = await guild.members.fetch({ user: myGrinder.discordUserId, force: true });
              if (member?.joinedAt) {
                updates.joinedAt = member.joinedAt;
                break;
              }
            } catch {}
          }
        }
      } catch {}
      if (!updates.joinedAt) {
        updates.joinedAt = myGrinder.createdAt || new Date();
      }
    }
    if (isElite && !myGrinder.eliteSince) {
      updates.eliteSince = new Date();
    }
    if (Object.keys(updates).length > 0) {
      await storage.updateGrinder(myGrinder.id, updates);
      myGrinder = { ...myGrinder, ...updates };
    }

    const BIDDING_CLOSED_GRACE_MS = 10 * 60 * 1000;
    const openOrders = allOrders.filter((o: any) => {
      if (o.visibleToGrinders === false) return false;
      if (o.status === "Bidding Closed") {
        if (o.assignedGrinderId) return false;
        if (!o.biddingClosesAt) return false;
        const closedAgo = now.getTime() - new Date(o.biddingClosesAt).getTime();
        return closedAgo < BIDDING_CLOSED_GRACE_MS;
      }
      if (o.status === "Need Replacement") return true;
      if (o.status !== "Open") return false;
      return true;
    });
    console.log(`[grinder-me] ${myGrinder.name} (${myGrinder.category}): ${allOrders.length} total orders, ${openOrders.length} open, statuses: ${[...new Set(allOrders.map((o: any) => o.status))].join(",")}`);

    const availableOrders = openOrders.map((o: any) => {
      const orderBids = allBids.filter((b: any) => b.orderId === o.id);
      const myBidOnOrder = myBids.find((b: any) => b.orderId === o.id);
      return {
        id: o.id,
        mgtOrderNumber: o.mgtOrderNumber,
        serviceId: o.serviceId,
        platform: o.platform,
        gamertag: o.gamertag,
        orderDueDate: o.orderDueDate,
        isRush: o.isRush,
        isEmergency: o.isEmergency,
        complexity: o.complexity,
        location: o.location,
        status: o.status,
        isManual: o.isManual,
        discordMessageId: o.discordMessageId,
        discordBidLink: o.discordBidLink,
        orderBrief: o.orderBrief,
        notes: o.notes,
        createdAt: o.createdAt,
        firstBidAt: o.firstBidAt,
        biddingClosesAt: o.biddingClosesAt,
        totalBids: orderBids.length,
        hasBid: !!myBidOnOrder,
        myBidId: myBidOnOrder?.id || null,
        myBidStatus: myBidOnOrder?.status || null,
        myBidAmount: myBidOnOrder?.bidAmount || null,
      };
    });

    const lostBids = myBids.filter((b: any) => {
      const order = allOrders.find((o: any) => o.id === b.orderId);
      return order && order.status === "Assigned" && order.assignedGrinderId !== myGrinder.id && b.status !== "Accepted";
    });

    const completedAssignments = myAssignments.filter((a: any) => a.status === "Completed");
    const totalEarned = completedAssignments.reduce((sum: number, a: any) => sum + (Number(a.grinderEarnings) || Number(a.bidAmount) || 0), 0);
    const activeEarnings = myAssignments.filter((a: any) => a.status === "Active").reduce((sum: number, a: any) => sum + (Number(a.grinderEarnings) || Number(a.bidAmount) || 0), 0);

    const aiTips: string[] = [];
    const acceptedBids = myBids.filter((b: any) => b.status === "Accepted").length;
    const totalBidsCount = myBids.length;
    const winRate = totalBidsCount > 0 ? acceptedBids / totalBidsCount : 0;
    
    if (winRate < 0.3 && totalBidsCount >= 3) {
      aiTips.push("Your bid acceptance rate is below 30%. Try highlighting your experience and availability in proposals.");
    }
    if (myGrinder.completedOrders === 0) {
      aiTips.push("Complete your first order to build reputation. Consider bidding on simpler tasks to get started.");
    }
    if (Number(myGrinder.onTimeRate || 100) < 80 && myGrinder.completedOrders > 0) {
      aiTips.push("Focus on meeting deadlines. Your on-time rate could use improvement - consider requesting more time if needed.");
    }
    if (myGrinder.activeOrders >= myGrinder.capacity - 1 && myGrinder.capacity > 1) {
      aiTips.push("You're near capacity. Focus on completing current orders before taking new ones.");
    }
    if (lostBids.length > 2) {
      aiTips.push("You've lost several recent bids. Try offering faster delivery times or better quality guarantees.");
    }
    if (myGrinder.avgQualityRating && Number(myGrinder.avgQualityRating) < 70) {
      aiTips.push("Your quality score could be higher. Ask for feedback on completed orders and focus on thoroughness.");
    }
    if (completedAssignments.length >= 5 && winRate > 0.5) {
      aiTips.push("Great track record! You're eligible for Elite status - keep up the consistency.");
    }

    const eliteGrinders = allGrinders.filter((g: any) => g.discordRoleId === "1466370965016412316" || g.tier === "Elite" || g.category === "Elite Grinder" || (g.roles && g.roles.includes("Elite Grinder")));
    let eliteCoaching: any = null;
    if (!isElite) {
      const hasElites = eliteGrinders.length > 0;
      const eliteAvgWinRate = hasElites ? eliteGrinders.reduce((s: number, g: any) => s + (Number(g.winRate) || 0), 0) / eliteGrinders.length : 70;
      const eliteAvgQuality = hasElites ? eliteGrinders.reduce((s: number, g: any) => s + (Number(g.avgQualityRating) || 0), 0) / eliteGrinders.length : 80;
      const eliteAvgOnTime = hasElites ? eliteGrinders.reduce((s: number, g: any) => s + (Number(g.onTimeRate) || 0), 0) / eliteGrinders.length : 90;
      const eliteAvgCompletion = hasElites ? eliteGrinders.reduce((s: number, g: any) => s + (Number(g.completionRate) || 0), 0) / eliteGrinders.length : 90;
      const eliteAvgTurnaround = hasElites ? eliteGrinders.reduce((s: number, g: any) => s + (Number(g.avgTurnaroundDays) || 0), 0) / eliteGrinders.length : 2;
      const eliteAvgCompleted = hasElites ? eliteGrinders.reduce((s: number, g: any) => s + (g.completedOrders || 0), 0) / eliteGrinders.length : 10;

      const myWinRate = Number(myGrinder.winRate) || 0;
      const myQuality = Number(myGrinder.avgQualityRating) || 0;
      const myOnTime = Number(myGrinder.onTimeRate) || 0;
      const myCompletion = Number(myGrinder.completionRate) || 0;
      const myTurnaround = Number(myGrinder.avgTurnaroundDays) || 0;

      const tips: string[] = [];
      if (myWinRate < eliteAvgWinRate * 0.8) {
        tips.push(`Boost your win rate to ${eliteAvgWinRate.toFixed(0)}%+ (elite average). Focus on quality proposals and quick response times.`);
      }
      if (myQuality < eliteAvgQuality * 0.8 && eliteAvgQuality > 0) {
        tips.push(`Raise your quality rating to ${(eliteAvgQuality / 20).toFixed(1)}/5+ (elite avg). Pay extra attention to detail and communication.`);
      }
      if (myOnTime < eliteAvgOnTime * 0.8 && eliteAvgOnTime > 0) {
        tips.push(`Improve your on-time delivery to ${eliteAvgOnTime.toFixed(0)}%+ (elite avg). Set realistic deadlines and communicate delays early.`);
      }
      if (myCompletion < eliteAvgCompletion * 0.8 && eliteAvgCompletion > 0) {
        tips.push(`Increase completion rate to ${eliteAvgCompletion.toFixed(0)}%+ (elite avg). Avoid cancelling orders once accepted.`);
      }
      if (myTurnaround > eliteAvgTurnaround * 1.3 && eliteAvgTurnaround > 0) {
        tips.push(`Reduce turnaround time to ${eliteAvgTurnaround.toFixed(1)} days or less (elite avg). Faster delivery builds trust.`);
      }
      if (myGrinder.completedOrders < Math.round(eliteAvgCompleted * 0.5)) {
        tips.push(`Complete more orders (elite avg: ${Math.round(eliteAvgCompleted)} completed). Volume + consistency unlocks elite consideration.`);
      }
      if (myGrinder.strikes > 0) {
        tips.push("Clear your strikes first. Elite grinders maintain a clean record with zero strikes.");
      }
      if (tips.length === 0) {
        tips.push("You're performing at elite levels! Consider requesting Elite status from the dashboard.");
      }

      eliteCoaching = {
        yourMetrics: { winRate: myWinRate, quality: myQuality, onTime: myOnTime, completion: myCompletion, turnaround: myTurnaround, completed: myGrinder.completedOrders, strikes: myGrinder.strikes },
        eliteAverages: { winRate: eliteAvgWinRate, quality: eliteAvgQuality, onTime: eliteAvgOnTime, completion: eliteAvgCompletion, turnaround: eliteAvgTurnaround, completed: Math.round(eliteAvgCompleted) },
        tips,
        readiness: tips.length <= 1 && myGrinder.strikes === 0 ? "ready" : tips.length <= 3 ? "close" : "developing",
        hasEliteData: hasElites,
      };
    }

    const unreadAlerts = myAlerts.filter((a: any) => {
      const readByArr = Array.isArray(a.readBy) ? a.readBy : [];
      return !readByArr.includes(myGrinder.id);
    });
    const unackedStrikes = myStrikeLogs.filter((s: any) => !s.acknowledgedAt);

    let discordAvatarUrl = authUser?.profileImageUrl || null;
    if (!discordAvatarUrl && myGrinder.discordUserId) {
      if (authUser?.discordAvatar) {
        discordAvatarUrl = `https://cdn.discordapp.com/avatars/${myGrinder.discordUserId}/${authUser.discordAvatar}.png?size=128`;
      } else {
        try {
          discordAvatarUrl = `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(myGrinder.discordUserId) >> BigInt(22)) % 6}.png`;
        } catch { discordAvatarUrl = null; }
      }
    }

    const safeGrinder = {
      id: myGrinder.id,
      name: myGrinder.name,
      discordUserId: myGrinder.discordUserId,
      discordUsername: myGrinder.discordUsername,
      discordAvatarUrl,
      discordRoleId: myGrinder.discordRoleId,
      category: myGrinder.category,
      roles: (myGrinder as any).roles || [myGrinder.category || "Grinder"],
      tier: myGrinder.tier,
      capacity: myGrinder.capacity,
      activeOrders: myGrinder.activeOrders,
      completedOrders: myGrinder.completedOrders,
      totalOrders: myGrinder.totalOrders,
      totalReviews: myGrinder.totalReviews,
      winRate: myGrinder.winRate,
      lastAssigned: myGrinder.lastAssigned,
      avgQualityRating: myGrinder.avgQualityRating,
      onTimeRate: myGrinder.onTimeRate,
      completionRate: myGrinder.completionRate,
      rulesAccepted: myGrinder.rulesAccepted,
      rulesAcceptedAt: myGrinder.rulesAcceptedAt,
      strikes: myGrinder.strikes,
      suspended: myGrinder.suspended,
      outstandingFine: myGrinder.outstandingFine,
      avgTurnaroundDays: myGrinder.avgTurnaroundDays,
      availabilityStatus: myGrinder.availabilityStatus,
      availabilityNote: myGrinder.availabilityNote,
      availabilityUpdatedAt: myGrinder.availabilityUpdatedAt,
      twitchUsername: myGrinder.twitchUsername,
      isStreaming: isGrinderLive(myGrinder.id),
      notes: myGrinder.notes,
      joinedAt: myGrinder.joinedAt,
      eliteSince: myGrinder.eliteSince,
    };

    const allServices = await storage.getServices();

    res.json({
      grinder: safeGrinder,
      isElite,
      assignments: await Promise.all(myAssignments.map(async (a: any) => {
        const order = allOrders.find((o: any) => o.id === a.orderId);
        const checkpoints = await storage.getActivityCheckpoints(a.id);
        const hasTicketAck = checkpoints.some((cp: any) => cp.type === "ticket_ack");
        const loginLogoffs = checkpoints
          .filter((cp: any) => cp.type === "login" || cp.type === "logoff")
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const isLoggedIn = loginLogoffs.length > 0 && loginLogoffs[0].type === "login";
        const svc = allServices.find((s: any) => s.id === order?.serviceId);
        return {
          id: a.id,
          orderId: a.orderId,
          status: a.status,
          orderStatus: order?.status || a.status,
          assignedDateTime: a.assignedDateTime,
          dueDateTime: a.dueDateTime,
          deliveredDateTime: a.deliveredDateTime,
          isOnTime: a.isOnTime,
          qualityRating: a.qualityRating,
          grinderEarnings: a.grinderEarnings,
          bidAmount: a.bidAmount,
          grinderId: a.grinderId,
          hasTicket: !!(order?.discordTicketChannelId),
          hasTicketAck,
          orderBrief: order?.orderBrief || null,
          platform: order?.platform || null,
          gamertag: order?.gamertag || null,
          serviceName: svc?.name || order?.serviceId || null,
          complexity: order?.complexity || null,
          location: order?.location || null,
          notes: order?.notes || null,
          isRush: order?.isRush || false,
          isEmergency: order?.isEmergency || false,
          mgtOrderNumber: order?.mgtOrderNumber || null,
          startedAt: a.startedAt || null,
          hasStarted: !!a.startedAt,
          isLoggedIn,
        };
      })),
      bids: myBids.map((b: any) => {
        const order = allOrders.find((o: any) => o.id === b.orderId);
        return {
          id: b.id,
          orderId: b.orderId,
          status: b.status,
          bidAmount: b.bidAmount,
          bidTime: b.bidTime,
          estDeliveryDate: b.estDeliveryDate,
          timeline: b.timeline,
          canStart: b.canStart,
          discordMessageId: b.discordMessageId,
          hasTicket: !!(order?.discordTicketChannelId),
          biddingClosesAt: order?.biddingClosesAt || null,
        };
      }),
      availableOrders,
      lostBids: lostBids.map((b: any) => ({
        id: b.id,
        orderId: b.orderId,
        bidAmount: b.bidAmount,
        status: b.status,
      })),
      orderUpdates: myOrderUpdates,
      payoutRequests: myPayoutRequests,
      payoutMethods: myPayoutMethods,
      strikeLogs: myStrikeLogs,
      strikeAppeals: myStrikeAppeals,
      alerts: myAlerts.map((a: any) => ({
        ...a,
        isRead: Array.isArray(a.readBy) ? a.readBy.includes(myGrinder.id) : false,
      })),
      eliteRequests: myEliteRequests,
      eliteCoaching,
      systemNotifications: mySystemNotifications.map((n: any) => {
        const rb = Array.isArray(n.readBy) ? n.readBy : [];
        const readIds = [userId, myGrinder.discordUserId, authUser?.discordId].filter(Boolean);
        return { ...n, isRead: readIds.some(id => rb.includes(id)) };
      }),
      unreadAlertCount: unreadAlerts.length + mySystemNotifications.filter((n: any) => {
        const rb = Array.isArray(n.readBy) ? n.readBy : [];
        const readIds = [userId, myGrinder.discordUserId, authUser?.discordId].filter(Boolean);
        return !readIds.some(id => rb.includes(id));
      }).length,
      unackedStrikeCount: unackedStrikes.length,
      stats: {
        totalAssignments: myAssignments.length,
        activeAssignments: myAssignments.filter((a: any) => a.status === "Active").length,
        completedAssignments: completedAssignments.length,
        totalBids: myBids.length,
        pendingBids: myBids.filter((b: any) => b.status === "Pending").length,
        acceptedBids,
        winRate: Math.round(winRate * 100),
        totalEarned: Math.round(totalEarned * 100) / 100,
        activeEarnings: Math.round(activeEarnings * 100) / 100,
        totalEarnings: Number(myGrinder.totalEarnings) || 0,
      },
      aiTips,
    });
  });

  app.get("/api/grinder/me/queue-position", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "Grinder profile not found" });

    const allOrders = await storage.getOrders();
    const openOrders = allOrders.filter((o: any) => o.status === "Open");
    const config = await storage.getQueueConfig();

    const positions: number[] = [];
    const factorTotals = { margin: 0, capacity: 0, tier: 0, fairness: 0, newGrinder: 0, reliability: 0, quality: 0, risk: 0 };
    let totalGrindersMax = 0;

    for (const order of openOrders) {
      const suggestions = await storage.getSuggestionsForOrder(order.id);
      if (suggestions.length === 0) continue;
      if (suggestions.length > totalGrindersMax) totalGrindersMax = suggestions.length;
      const myIndex = suggestions.findIndex((s: any) => s.grinderId === myGrinder.id);
      if (myIndex === -1) continue;
      positions.push(myIndex + 1);
      const myScores = suggestions[myIndex].scores;
      factorTotals.margin += myScores.margin;
      factorTotals.capacity += myScores.capacity;
      factorTotals.tier += myScores.tier;
      factorTotals.fairness += myScores.fairness;
      factorTotals.newGrinder += myScores.newGrinder;
      factorTotals.reliability += myScores.reliability;
      factorTotals.quality += myScores.quality;
      factorTotals.risk += myScores.risk;
    }

    const rankedIn = positions.length;
    const avgPos = rankedIn > 0 ? Math.round((positions.reduce((a, b) => a + b, 0) / rankedIn) * 10) / 10 : 0;
    const bestPos = rankedIn > 0 ? Math.min(...positions) : 0;

    const avgFactors: any = {};
    for (const key of Object.keys(factorTotals) as (keyof typeof factorTotals)[]) {
      avgFactors[key] = rankedIn > 0 ? Math.round((factorTotals[key] / rankedIn) * 100) / 100 : 0;
    }

    const allAssignments = await storage.getAssignments();
    const myAssignments = allAssignments.filter((a: any) => a.grinderId === myGrinder.id);
    const allBids = await storage.getBids();
    const myBids = allBids.filter((b: any) => b.grinderId === myGrinder.id);
    const isNewGrinder = myAssignments.length === 0 && myBids.length === 0;
    const hasNoHistory = (myGrinder.completedOrders || 0) === 0 && myAssignments.length === 0;

    if (isNewGrinder && rankedIn === 0) {
      for (const key of Object.keys(avgFactors)) {
        avgFactors[key] = 0;
      }
      avgFactors.capacity = 1;
      avgFactors.fairness = 1;
      avgFactors.reliability = 1;
      avgFactors.quality = 1;
      avgFactors.risk = 1;
      avgFactors.newGrinder = 1;
    }

    const improvementTips: string[] = [];
    const isTopPerformer = bestPos > 0 && bestPos <= 3;
    const midPoint = Math.ceil(totalGrindersMax / 2);
    const isMidRange = avgPos > 0 && avgPos <= midPoint && !isTopPerformer;

    if (rankedIn === 0 && myGrinder.strikes >= 3) {
      improvementTips.push("You're suspended from the queue due to 3+ strikes. Contact staff to resolve outstanding strikes.");
    } else if (rankedIn === 0 && myGrinder.activeOrders >= myGrinder.capacity) {
      improvementTips.push("You're at full capacity. Complete current orders to appear in the queue again.");
    } else if (isNewGrinder || (hasNoHistory && rankedIn === 0)) {
      improvementTips.push("Welcome! You're a new grinder with a fresh profile. Your capacity, reliability, quality, and fairness scores start at 100%.");
      improvementTips.push("You have a new grinder boost active — bid on orders as they come in to take advantage of it.");
      if (openOrders.length === 0) {
        improvementTips.push("There are no open orders right now. When new orders are posted, you'll appear in the queue automatically.");
      } else {
        improvementTips.push("Start by submitting bids on open orders. Competitive pricing will improve your margin score and boost your rank.");
      }
    } else if (rankedIn === 0) {
      if (openOrders.length === 0) {
        improvementTips.push("No open orders right now — you'll be ranked when new orders are posted.");
      } else {
        improvementTips.push("You're not ranked in any current orders. Submit bids on open orders to appear in the queue.");
      }
      if (myBids.length === 0 && myAssignments.length === 0) {
        improvementTips.push("Get started by bidding on available orders. Competitive pricing helps you rank higher in the queue.");
      }
    } else if (isTopPerformer) {
      improvementTips.push("You're ranked near the top — great work. Stay consistent with quality and on-time delivery to hold your position.");
      if (avgFactors.margin < 0.5) improvementTips.push("Your margin score is your weakest area. Keep bid amounts competitive to protect your ranking.");
      if (avgFactors.capacity < 0.6) improvementTips.push("Freeing up a slot would strengthen your capacity score and help you stay on top.");
      if (avgFactors.newGrinder === 1) improvementTips.push("You're benefiting from a new grinder boost — bid actively now while it lasts.");
    } else if (isMidRange) {
      improvementTips.push("You're in the middle of the pack. Focus on your weakest factors below to climb higher.");
      if (avgFactors.margin < 0.3) improvementTips.push("Lower your bid amounts to improve your margin score. Competitive pricing moves you up the queue.");
      if (avgFactors.capacity < 0.4) improvementTips.push("You're near full capacity. Complete current orders to free up slots and boost your capacity score.");
      if (avgFactors.reliability < 0.6) improvementTips.push("Improve your reliability by delivering on time, completing all orders, and avoiding reassignments.");
      if (avgFactors.quality < 0.5) improvementTips.push("Boost your quality score by focusing on on-time delivery, faster turnaround, and daily updates.");
      if (avgFactors.tier < 0.5) improvementTips.push("Higher tier grinders rank better. Work toward Elite status for a significant queue advantage.");
      if (avgFactors.newGrinder === 1) improvementTips.push("You're getting a new grinder boost — make the most of it by bidding on orders now.");
    } else {
      if (avgFactors.margin < 0.3 && myBids.length > 0) improvementTips.push("Your bids are high relative to order prices. Lower them to improve your margin score.");
      if (avgFactors.capacity < 0.4 && myGrinder.activeOrders > 0) improvementTips.push("You're near full capacity. Complete current orders to free up slots and boost your capacity score.");
      if (avgFactors.fairness < 0.3 && myAssignments.length > 0) improvementTips.push("You were recently assigned an order. Your fairness score will naturally improve over time as the system rotates work.");
      if (avgFactors.reliability < 0.6 && myAssignments.length > 0) improvementTips.push("Reliability is holding you back. Focus on delivering on time and completing all orders without reassignments.");
      if (avgFactors.quality < 0.5 && myAssignments.length > 0) improvementTips.push("Quality is a weak spot. Prioritize on-time delivery, faster turnaround, daily updates, and avoiding strikes.");
      if (avgFactors.risk > 0 && avgFactors.risk < 0.5) improvementTips.push("Your risk score is low due to strikes or cancellations. A clean record going forward will help a lot.");
      if (avgFactors.tier < 0.5 && myAssignments.length > 0) improvementTips.push("Higher tier grinders rank better. Work toward Elite status for a significant queue advantage.");
      if (avgFactors.newGrinder === 1) improvementTips.push("You're getting a new grinder boost — bid on orders now to take advantage of it.");
      if (improvementTips.length === 0) improvementTips.push("You're performing well across all factors. Keep it up to maintain your position!");
    }

    res.json({
      totalOpenOrders: openOrders.length,
      rankedIn,
      averagePosition: avgPos,
      bestPosition: bestPos,
      totalGrindersInQueue: totalGrindersMax,
      factorScores: avgFactors,
      improvementTips,
      queueWeights: config ? {
        margin: Number(config.marginWeight),
        capacity: Number(config.capacityWeight),
        tier: Number(config.tierWeight),
        fairness: Number(config.fairnessWeight),
        newGrinder: Number(config.newGrinderWeight),
        reliability: Number(config.reliabilityWeight),
        quality: Number(config.qualityWeight),
        risk: Number(config.riskWeight),
        emergencyBoost: Number(config.emergencyBoost),
        largeOrderEliteBoost: Number(config.largeOrderEliteBoost),
      } : null,
    });
  });

  app.post("/api/grinder/me/order-updates", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "Grinder profile not found" });

    const { assignmentId, orderId, updateType, message, newDeadline } = req.body;
    if (!assignmentId || !orderId || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const assignment = await storage.getAssignment(assignmentId);
    if (!assignment || assignment.grinderId !== myGrinder.id) {
      return res.status(403).json({ message: "Not your assignment" });
    }

    const update = await storage.createOrderUpdate({
      id: `OU-${Date.now().toString(36)}`,
      assignmentId,
      orderId,
      grinderId: myGrinder.id,
      updateType: updateType || "progress",
      message,
      newDeadline: newDeadline ? new Date(newDeadline) : null,
    });

    if (newDeadline) {
      await storage.updateAssignment(assignmentId, { dueDateTime: new Date(newDeadline) });
    }

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "order_update",
      entityId: update.id,
      action: "grinder_update",
      actor: myGrinder.name,
      details: JSON.stringify({ orderId, assignmentId, updateType, message }),
    });

    res.status(201).json(update);
  });

  app.post("/api/grinder/me/payout-requests", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "Grinder profile not found" });

    const { assignmentId, orderId, amount, notes, payoutPlatform, payoutDetails, savePayoutMethod } = req.body;
    if (!assignmentId || !orderId || !amount || !payoutPlatform || !payoutDetails) {
      return res.status(400).json({ message: "Missing required fields (amount, platform, and payout details are required)" });
    }

    const assignment = await storage.getAssignment(assignmentId);
    if (!assignment || assignment.grinderId !== myGrinder.id) {
      return res.status(403).json({ message: "Not your assignment" });
    }

    if (savePayoutMethod) {
      const existingMethods = await storage.getGrinderPayoutMethods(myGrinder.id);
      const existing = existingMethods.find((m: any) => m.platform === payoutPlatform);
      if (existing) {
        await storage.updateGrinderPayoutMethod(existing.id, { details: payoutDetails });
      } else {
        await storage.createGrinderPayoutMethod({
          id: `PM-${Date.now().toString(36)}`,
          grinderId: myGrinder.id,
          platform: payoutPlatform,
          details: payoutDetails,
          isDefault: existingMethods.length === 0,
        });
      }
    }

    const request = await storage.createPayoutRequest({
      id: `PR-${Date.now().toString(36)}`,
      assignmentId,
      orderId,
      grinderId: myGrinder.id,
      amount: String(amount),
      payoutPlatform,
      payoutDetails,
      status: "Pending",
      notes: notes || null,
      reviewedBy: null,
    });

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "payout_request",
      entityId: request.id,
      action: "payout_requested",
      actor: myGrinder.name,
      details: JSON.stringify({ orderId, assignmentId, amount, payoutPlatform }),
    });

    res.status(201).json(request);
  });

  app.get("/api/grinder/me/payout-methods", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "Grinder profile not found" });
    const methods = await storage.getGrinderPayoutMethods(myGrinder.id);
    res.json(methods);
  });

  app.delete("/api/grinder/me/payout-methods/:id", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "Grinder profile not found" });
    const methods = await storage.getGrinderPayoutMethods(myGrinder.id);
    const method = methods.find((m: any) => m.id === req.params.id);
    if (!method) return res.status(404).json({ message: "Payout method not found" });
    await storage.deleteGrinderPayoutMethod(req.params.id);
    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "grinder",
      entityId: myGrinder.id,
      action: "payout_method_deleted",
      actor: myGrinder.name || myGrinder.id,
      details: JSON.stringify({ platform: method.platform, details: method.details }),
    });
    res.json({ success: true });
  });

  app.patch("/api/grinder/me/payout-requests/:id/approve", async (req, res) => {
    try {
      const userId = (req as any).userId;
      const allGrinders = await storage.getGrinders();
      const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
      if (!myGrinder) return res.status(404).json({ message: "Grinder profile not found" });

      const payouts = await storage.getPayoutRequests(myGrinder.id);
      const payout = payouts.find((p: any) => p.id === req.params.id);
      if (!payout) return res.status(404).json({ message: "Payout request not found" });
      if (payout.status !== "Pending Grinder Approval") {
        return res.status(400).json({ message: "Payout is not pending your approval" });
      }

      await storage.updatePayoutRequest(payout.id, {
        status: "Pending",
        grinderApprovedAt: new Date(),
        notes: "Grinder approved payout details",
      });

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "payout",
        entityId: payout.id,
        action: "grinder_approved_payout",
        actor: myGrinder.name,
        details: JSON.stringify({ orderId: payout.orderId, amount: payout.amount }),
      });

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.patch("/api/grinder/me/payout-requests/:id/dispute", async (req, res) => {
    try {
      const userId = (req as any).userId;
      const allGrinders = await storage.getGrinders();
      const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
      if (!myGrinder) return res.status(404).json({ message: "Grinder profile not found" });

      const payouts = await storage.getPayoutRequests(myGrinder.id);
      const payout = payouts.find((p: any) => p.id === req.params.id);
      if (!payout) return res.status(404).json({ message: "Payout request not found" });
      if (payout.status !== "Pending Grinder Approval") {
        return res.status(400).json({ message: "Payout is not pending your approval" });
      }

      const { reason, requestedPlatform, requestedDetails, requestedAmount } = req.body;
      if (!reason) return res.status(400).json({ message: "Dispute reason is required" });

      await storage.updatePayoutRequest(payout.id, {
        status: "Grinder Disputed",
        disputeReason: reason,
        requestedPlatform: requestedPlatform || null,
        requestedDetails: requestedDetails || null,
        requestedAmount: requestedAmount ? String(requestedAmount) : null,
      });

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "payout",
        entityId: payout.id,
        action: "grinder_disputed_payout",
        actor: myGrinder.name,
        details: JSON.stringify({ reason, requestedPlatform, requestedDetails, requestedAmount }),
      });

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.post("/api/grinder/me/accept-rules", async (req, res) => {
    try {
      const userId = (req as any).userId;
      const allGrinders = await storage.getGrinders();
      const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
      if (!myGrinder) return res.status(404).json({ message: "Grinder profile not found" });

      if (myGrinder.rulesAccepted) {
        return res.json({ message: "Rules already accepted", rulesAccepted: true });
      }

      await storage.updateGrinder(myGrinder.id, {
        rulesAccepted: true,
        rulesAcceptedAt: new Date(),
      });

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "grinder",
        entityId: myGrinder.id,
        action: "rules_accepted",
        actor: myGrinder.name || myGrinder.id,
        details: JSON.stringify({ grinderId: myGrinder.id }),
      });

      res.json({ message: "Rules accepted successfully", rulesAccepted: true });
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.post("/api/grinder/me/bids", async (req, res) => {
    try {
      const userId = (req as any).userId;
      const allGrinders = await storage.getGrinders();
      const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
      if (!myGrinder) return res.status(404).json({ message: "Grinder profile not found" });

      const { orderId, bidAmount, timeline, canStart } = req.body;
      if (!orderId || !bidAmount) return res.status(400).json({ message: "orderId and bidAmount are required" });

      if (!myGrinder.rulesAccepted) {
        return res.status(403).json({ message: "You must accept the Grinder Rules before placing bids. Use /grinder rules from the MGT Bot in any Discord text channel to accept." });
      }

      if (myGrinder.suspended) {
        const fine = parseFloat(myGrinder.outstandingFine?.toString() || "0");
        return res.status(403).json({ message: `You are suspended. Pay your outstanding fine of $${fine.toFixed(2)} before placing bids.` });
      }

      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (order.status !== "Open") return res.status(400).json({ message: "Order is not open for bidding" });
      if (!order.visibleToGrinders) return res.status(403).json({ message: "This order is not open for grinder bids" });

      const bidderIsElite = myGrinder.discordRoleId === "1466370965016412316" || myGrinder.tier === "Elite" || myGrinder.category === "Elite Grinder";
      if (!bidderIsElite && order.createdAt) {
        const orderAgeSec = (Date.now() - new Date(order.createdAt).getTime()) / 1000;
        const priorityWindowSec = 30;
        if (orderAgeSec < priorityWindowSec) {
          const remaining = Math.ceil(priorityWindowSec - orderAgeSec);
          return res.status(403).json({ message: `This order is in the Elite priority window. Regular grinders can bid after ${remaining} seconds.` });
        }
      }

      const allBids = await storage.getBids();
      const existingBid = allBids.find((b: any) => b.orderId === orderId && b.grinderId === myGrinder.id);
      if (existingBid) return res.status(400).json({ message: "You already have a bid on this order" });

      if (myGrinder.activeOrders >= myGrinder.capacity) {
        return res.status(400).json({ message: "You are at your order limit" });
      }

      const bidId = `BID-${Date.now().toString(36)}`;
      const now = new Date();
      const estDelivery = timeline
        ? new Date(now.getTime() + parseInt(timeline) * 3600000)
        : new Date(now.getTime() + 48 * 3600000);

      const newBid = await storage.createBid({
        id: bidId,
        orderId,
        grinderId: myGrinder.id,
        bidAmount: String(bidAmount),
        bidTime: now,
        estDeliveryDate: estDelivery,
        timeline: timeline || null,
        canStart: canStart || null,
        status: "Pending",
      });

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "bid",
        entityId: bidId,
        action: "bid_placed_via_dashboard",
        actor: myGrinder.name,
        details: JSON.stringify({ orderId, bidAmount, isManualOrder: order.isManual }),
      });

      res.status(201).json(newBid);
    } catch (err) {
      res.status(400).json({ message: String(err) });
    }
  });

  app.patch("/api/grinder/me/bids/:bidId", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "Grinder profile not found" });

    const allBids = await storage.getBids();
    const bid = allBids.find((b: any) => b.id === req.params.bidId);
    if (!bid || bid.grinderId !== myGrinder.id) {
      return res.status(403).json({ message: "Not your bid" });
    }
    if (bid.status !== "Pending") {
      return res.status(400).json({ message: "Can only edit pending bids" });
    }

    const order = await storage.getOrder(bid.orderId);
    if (order && order.biddingClosesAt && new Date(order.biddingClosesAt) <= new Date()) {
      return res.status(400).json({ message: "Bidding window has closed. Contact staff to update your bid manually." });
    }

    const { bidAmount, estDeliveryDate, timeline, canStart } = req.body;
    const updateData: any = {};
    if (bidAmount) updateData.bidAmount = String(bidAmount);
    if (estDeliveryDate) updateData.estDeliveryDate = new Date(estDeliveryDate);
    if (timeline) updateData.timeline = timeline;
    if (canStart) updateData.canStart = canStart;

    const updated = await storage.updateBid(bid.id, updateData);

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "bid",
      entityId: bid.id,
      action: "bid_edited_by_grinder",
      actor: myGrinder.name,
      details: JSON.stringify(updateData),
    });

    res.json(updated);
  });

  app.patch("/api/grinder/me/assignments/:assignmentId/complete", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "Grinder profile not found" });

    const assignment = await storage.getAssignment(req.params.assignmentId);
    if (!assignment || assignment.grinderId !== myGrinder.id) {
      return res.status(403).json({ message: "Not your assignment" });
    }

    const { payoutPlatform, payoutDetails, savePayoutMethod, completionProofUrl } = req.body;
    if (!payoutPlatform || !payoutDetails) {
      return res.status(400).json({ message: "Payout platform and details are required" });
    }
    if (!completionProofUrl) {
      return res.status(400).json({ message: "Video proof of completion is required" });
    }

    const now = new Date();

    const order = assignment.orderId ? await storage.getOrder(assignment.orderId) : null;
    const dueDate = order?.orderDueDate ? new Date(order.orderDueDate) : (assignment.dueDateTime ? new Date(assignment.dueDateTime) : null);
    const isOnTime = dueDate ? now <= dueDate : true;

    const updated = await storage.updateAssignment(assignment.id, {
      status: "Completed",
      deliveredDateTime: now,
      isOnTime,
    });

    if (assignment.orderId) {
      await storage.updateOrderStatus(assignment.orderId, "Completed");
    }

    await recalcGrinderStats(myGrinder.id);

    if (savePayoutMethod) {
      const existingMethods = await storage.getGrinderPayoutMethods(myGrinder.id);
      const alreadyExists = existingMethods.find((m: any) => m.platform === payoutPlatform && m.details === payoutDetails);
      if (!alreadyExists) {
        await storage.createGrinderPayoutMethod({
          id: `PM-${Date.now().toString(36)}`,
          grinderId: myGrinder.id,
          platform: payoutPlatform,
          details: payoutDetails,
          isDefault: existingMethods.length === 0,
        });
      }
    }

    const payoutAmount = assignment.grinderEarnings || assignment.bidAmount || "0";

    const existingPayouts = await storage.getPayoutRequests(myGrinder.id);
    const alreadyRequested = existingPayouts.find((p: any) => p.assignmentId === assignment.id);

    if (!alreadyRequested && Number(payoutAmount) > 0) {
      await storage.createPayoutRequest({
        id: `PR-${Date.now().toString(36)}`,
        assignmentId: assignment.id,
        orderId: assignment.orderId,
        grinderId: myGrinder.id,
        amount: String(payoutAmount),
        payoutPlatform: payoutPlatform,
        payoutDetails: payoutDetails,
        status: "Pending",
        notes: "Auto-created on order completion",
        reviewedBy: null,
        completionProofUrl: completionProofUrl || null,
      });
    }

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "assignment",
      entityId: assignment.id,
      action: "marked_complete_by_grinder",
      actor: myGrinder.name,
      details: JSON.stringify({ orderId: assignment.orderId, isOnTime, completedAt: now.toISOString(), autoPayoutCreated: !alreadyRequested, payoutPlatform, payoutDetails }),
    });

    res.json(updated);
  });

  app.get("/api/staff/order-updates", requireStaff, async (req, res) => {
    const updates = await storage.getOrderUpdates();
    res.json(updates);
  });

  app.get("/api/staff/payout-requests", requireStaff, async (req, res) => {
    const requests = await storage.getPayoutRequests();
    res.json(requests);
  });

  app.post("/api/staff/upload-payment-proof", requireStaff, paymentProofUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const fileUrl = `/uploads/payment-proofs/${req.file.filename}`;
      res.json({ url: fileUrl });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Upload failed" });
    }
  });

  app.patch("/api/staff/payout-requests/:id", requireStaff, async (req, res) => {
    const { status, reviewedBy, paymentProofUrl, walletId, paidAt } = req.body;
    const updateData: any = {
      status,
      reviewedBy: reviewedBy || "staff",
      reviewedAt: new Date(),
    };
    if (status === "Paid") {
      updateData.paidAt = paidAt ? new Date(paidAt + "T12:00:00") : new Date();
    }
    if (paidAt && !status) {
      updateData.paidAt = new Date(paidAt + "T12:00:00");
      delete updateData.status;
    }
    if (paymentProofUrl) {
      updateData.paymentProofUrl = paymentProofUrl;
    }

    const payoutReq = await storage.getPayoutRequest(req.params.id);
    if (!payoutReq) return res.status(404).json({ message: "Payout request not found" });

    const updated = await storage.updatePayoutRequest(req.params.id, updateData);
    if (!updated) return res.status(404).json({ message: "Payout request not found" });

    if (status === "Paid" && payoutReq.grinderId) {
      await recalcGrinderStats(payoutReq.grinderId);
      if (payoutReq.orderId) {
        await storage.updateOrderStatus(payoutReq.orderId, "Paid Out");
      }
      if (walletId) {
        try {
          const wallet = await storage.getWallet(walletId);
          if (wallet) {
            const payAmount = parseFloat(payoutReq.amount?.toString() || "0");
            const currentBal = parseFloat(wallet.balance?.toString() || "0");
            const newBal = currentBal - payAmount;
            const actorName = reviewedBy || getActorName(req);
            const actorId = (req.user as any)?.discordId || (req.user as any)?.id || "";
            await storage.createWalletTransaction({
              id: `WTX-${Date.now().toString(36)}-gpo`,
              walletId: wallet.id,
              type: "grinder_payout",
              amount: payAmount.toFixed(2),
              balanceBefore: currentBal.toFixed(2),
              balanceAfter: newBal.toFixed(2),
              category: "grinder_payout",
              description: `Grinder payout to ${payoutReq.grinderId}${payoutReq.orderId ? ` for order ${payoutReq.orderId}` : ""}`,
              relatedPayoutId: req.params.id,
              relatedOrderId: payoutReq.orderId || null,
              relatedGrinderId: payoutReq.grinderId,
              performedBy: actorId,
              performedByName: actorName,
              performedByRole: (req.user as any)?.role || "staff",
            });
            await storage.updateWallet(wallet.id, { balance: newBal.toFixed(2), updatedAt: new Date() });
          }
        } catch (e: any) {
          console.error("[wallet] Failed to create grinder payout transaction:", e.message);
        }
      }
    }

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "payout_request",
      entityId: req.params.id,
      action: `payout_${status.toLowerCase()}`,
      actor: reviewedBy || "staff",
      details: JSON.stringify({ status, grinderId: payoutReq.grinderId, amount: payoutReq.amount, orderId: payoutReq.orderId }),
    });

    if (payoutReq.grinderId) {
      const grinder = await storage.getGrinder(payoutReq.grinderId);
      if (grinder) {
        const notifMap: Record<string, { title: string; body: string; severity: string }> = {
          "Approved": { title: "Payout Approved", body: `Your payout of $${payoutReq.amount} has been approved and is being processed.`, severity: "success" },
          "Paid": { title: "Payout Sent", body: `Your payout of $${payoutReq.amount} has been sent${payoutReq.payoutPlatform ? ` via ${payoutReq.payoutPlatform}` : ""}.`, severity: "success" },
          "Denied": { title: "Payout Denied", body: `Your payout request of $${payoutReq.amount} was denied. Contact staff for details.`, severity: "danger" },
          "Pending Grinder Approval": { title: "Payout Pending Your Approval", body: `A payout of $${payoutReq.amount} is ready for your review.`, severity: "warning" },
        };
        const notif = notifMap[status];
        if (notif) {
          createSystemNotification({
            userId: grinder.discordUserId,
            type: status === "Paid" ? "payout_paid" : status === "Approved" ? "payout_approved" : status === "Denied" ? "payout_rejected" : "payout_pending",
            title: notif.title,
            body: notif.body,
            linkUrl: "/grinder/payouts",
            icon: "banknote",
            severity: notif.severity,
          });
        }
      }
    }

    res.json(updated);
  });

  app.patch("/api/staff/payout-requests/:id/resolve-dispute", requireStaff, async (req, res) => {
    try {
      const { action, reviewedBy } = req.body;
      const payoutReq = await storage.getPayoutRequest(req.params.id);
      if (!payoutReq) return res.status(404).json({ message: "Payout request not found" });
      if (payoutReq.status !== "Grinder Disputed") {
        return res.status(400).json({ message: "Payout is not in disputed state" });
      }

      if (action === "accept_changes") {
        await storage.updatePayoutRequest(req.params.id, {
          status: "Pending",
          amount: payoutReq.requestedAmount || payoutReq.amount,
          payoutPlatform: payoutReq.requestedPlatform || payoutReq.payoutPlatform,
          payoutDetails: payoutReq.requestedDetails || payoutReq.payoutDetails,
          reviewedBy: reviewedBy || "staff",
          reviewedAt: new Date(),
          notes: "Dispute resolved - grinder's requested changes accepted",
        });
      } else if (action === "resend") {
        await storage.updatePayoutRequest(req.params.id, {
          status: "Pending Grinder Approval",
          disputeReason: null,
          requestedPlatform: null,
          requestedDetails: null,
          requestedAmount: null,
          notes: "Resent for grinder approval after dispute review",
        });
      }

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "payout_request",
        entityId: req.params.id,
        action: `dispute_${action}`,
        actor: reviewedBy || "staff",
        details: JSON.stringify({ payoutId: req.params.id, action }),
      });

      const updated = await storage.getPayoutRequest(req.params.id);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.patch("/api/staff/payout-requests/:id/reduce", requireStaff, async (req, res) => {
    try {
      const { newAmount, reason } = req.body;
      const userRole = (req as any).userRole;
      const reviewedBy = req.body.reviewedBy || "staff";

      if (!newAmount || !reason) {
        return res.status(400).json({ message: "New amount and reason are required" });
      }

      const payoutReq = await storage.getPayoutRequest(req.params.id);
      if (!payoutReq) return res.status(404).json({ message: "Payout request not found" });

      if (Number(newAmount) >= Number(payoutReq.amount)) {
        return res.status(400).json({ message: "Reduced amount must be less than current amount" });
      }
      if (Number(newAmount) < 0) {
        return res.status(400).json({ message: "Amount cannot be negative" });
      }

      const originalAmount = payoutReq.originalAmount || payoutReq.amount;

      if (userRole === "owner") {
        const difference = Number(payoutReq.amount) - Number(newAmount);
        await storage.updatePayoutRequest(req.params.id, {
          amount: newAmount,
          originalAmount,
          reductionReason: reason,
          reductionRequestedBy: reviewedBy,
          reductionRequestedAt: new Date(),
          reductionStatus: "approved",
          reductionApprovedBy: reviewedBy,
          reductionApprovedAt: new Date(),
        });

        if (payoutReq.orderId) {
          const order = await storage.getOrder(payoutReq.orderId);
          if (order) {
            const currentProfit = Number(order.companyProfit || 0);
            await storage.updateOrder(payoutReq.orderId, {
              companyProfit: String(currentProfit + difference),
            });
          }
        }

        if (payoutReq.assignmentId) {
          const assignment = await storage.getAssignment(payoutReq.assignmentId);
          if (assignment) {
            const currentAssignProfit = Number(assignment.companyProfit || 0);
            await storage.updateAssignment(payoutReq.assignmentId, {
              grinderEarnings: newAmount,
              companyProfit: String(currentAssignProfit + difference),
            });
          }
        }

        await storage.createAuditLog({
          id: `AL-${Date.now().toString(36)}`,
          entityType: "payout_request",
          entityId: req.params.id,
          action: "payout_reduction_applied",
          actor: reviewedBy,
          details: JSON.stringify({ originalAmount, newAmount, difference, reason, grinderId: payoutReq.grinderId, orderId: payoutReq.orderId }),
        });
      } else {
        await storage.updatePayoutRequest(req.params.id, {
          originalAmount,
          reductionReason: reason,
          reductionRequestedBy: reviewedBy,
          reductionRequestedAt: new Date(),
          reductionStatus: "pending",
          requestedAmount: newAmount,
        });

        await storage.createAuditLog({
          id: `AL-${Date.now().toString(36)}`,
          entityType: "payout_request",
          entityId: req.params.id,
          action: "payout_reduction_requested",
          actor: reviewedBy,
          details: JSON.stringify({ originalAmount, requestedNewAmount: newAmount, reason, grinderId: payoutReq.grinderId, orderId: payoutReq.orderId }),
        });
      }

      const updated = await storage.getPayoutRequest(req.params.id);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.patch("/api/staff/payout-requests/:id/reduction-review", requireOwner, async (req, res) => {
    try {
      const { action, reviewedBy, deniedReason } = req.body;
      const payoutReq = await storage.getPayoutRequest(req.params.id);
      if (!payoutReq) return res.status(404).json({ message: "Payout request not found" });

      if (payoutReq.reductionStatus !== "pending") {
        return res.status(400).json({ message: "No pending reduction to review" });
      }

      if (action === "approve") {
        const newAmount = payoutReq.requestedAmount;
        const difference = Number(payoutReq.amount) - Number(newAmount);

        await storage.updatePayoutRequest(req.params.id, {
          amount: newAmount!,
          reductionStatus: "approved",
          reductionApprovedBy: reviewedBy || "owner",
          reductionApprovedAt: new Date(),
          requestedAmount: null,
        });

        if (payoutReq.orderId) {
          const order = await storage.getOrder(payoutReq.orderId);
          if (order) {
            const currentProfit = Number(order.companyProfit || 0);
            await storage.updateOrder(payoutReq.orderId, {
              companyProfit: String(currentProfit + difference),
            });
          }
        }

        if (payoutReq.assignmentId) {
          const assignment = await storage.getAssignment(payoutReq.assignmentId);
          if (assignment) {
            const currentAssignProfit = Number(assignment.companyProfit || 0);
            await storage.updateAssignment(payoutReq.assignmentId, {
              grinderEarnings: newAmount!,
              companyProfit: String(currentAssignProfit + difference),
            });
          }
        }

        await storage.createAuditLog({
          id: `AL-${Date.now().toString(36)}`,
          entityType: "payout_request",
          entityId: req.params.id,
          action: "payout_reduction_approved",
          actor: reviewedBy || "owner",
          details: JSON.stringify({ originalAmount: payoutReq.originalAmount, newAmount, difference, reason: payoutReq.reductionReason, grinderId: payoutReq.grinderId, orderId: payoutReq.orderId }),
        });
      } else if (action === "deny") {
        await storage.updatePayoutRequest(req.params.id, {
          reductionStatus: "denied",
          reductionApprovedBy: reviewedBy || "owner",
          reductionApprovedAt: new Date(),
          reductionDeniedReason: deniedReason || "",
          requestedAmount: null,
        });

        await storage.createAuditLog({
          id: `AL-${Date.now().toString(36)}`,
          entityType: "payout_request",
          entityId: req.params.id,
          action: "payout_reduction_denied",
          actor: reviewedBy || "owner",
          details: JSON.stringify({ originalAmount: payoutReq.originalAmount, requestedAmount: payoutReq.requestedAmount, reason: payoutReq.reductionReason, deniedReason, grinderId: payoutReq.grinderId }),
        });
      }

      const updated = await storage.getPayoutRequest(req.params.id);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/staff/grinder-payout-methods/:grinderId", requireStaff, async (req, res) => {
    const methods = await storage.getGrinderPayoutMethods(req.params.grinderId);
    res.json(methods);
  });

  app.post("/api/grinder/me/elite-request", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "No grinder profile found" });

    const existing = await storage.getEliteRequests(myGrinder.id);
    const pending = existing.find((e: any) => e.status === "Pending");
    if (pending) return res.status(400).json({ message: "You already have a pending elite request" });

    const request = await storage.createEliteRequest({
      id: `ER-${Date.now().toString(36)}`,
      grinderId: myGrinder.id,
      status: "Pending",
    });

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "elite_request",
      entityId: request.id,
      action: "created",
      actor: myGrinder.name,
    });

    res.status(201).json(request);
  });

  app.post("/api/grinder/me/alerts/:alertId/read", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "No grinder profile found" });

    await storage.markAlertRead(req.params.alertId as string, myGrinder.id);

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "grinder",
      entityId: myGrinder.id,
      action: "alert_read",
      actor: myGrinder.name || myGrinder.id,
      details: JSON.stringify({ alertId: req.params.alertId }),
    });

    res.json({ success: true });
  });

  app.post("/api/grinder/me/strikes/:strikeId/ack", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "No grinder profile found" });

    await storage.acknowledgeStrike(req.params.strikeId as string);

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "grinder",
      entityId: myGrinder.id,
      action: "strike_acknowledged",
      actor: myGrinder.name || myGrinder.id,
      details: JSON.stringify({ strikeId: req.params.strikeId }),
    });

    res.json({ success: true });
  });

  app.get("/api/grinder/me/strike-appeals", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "No grinder profile found" });
    const appeals = await storage.getStrikeAppeals(myGrinder.id);
    res.json(appeals);
  });

  app.post("/api/grinder/me/strike-appeals", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "No grinder profile found" });

    const { strikeLogId, reason } = req.body;
    if (!strikeLogId || !reason?.trim()) {
      return res.status(400).json({ message: "strikeLogId and reason are required" });
    }

    const strikeLogs = await storage.getStrikeLogs(myGrinder.id);
    const strikeLog = strikeLogs.find((l: any) => l.id === strikeLogId && l.delta > 0);
    if (!strikeLog) return res.status(404).json({ message: "Strike not found" });

    const existingAppeals = await storage.getStrikeAppeals(myGrinder.id);
    const alreadyAppealed = existingAppeals.find((a: any) => a.strikeLogId === strikeLogId && a.status === "pending");
    if (alreadyAppealed) return res.status(400).json({ message: "You already have a pending appeal for this strike" });

    const appeal = await storage.createStrikeAppeal({
      id: `APPEAL-${Date.now().toString(36)}`,
      strikeLogId,
      grinderId: myGrinder.id,
      reason: reason.trim(),
      status: "pending",
    });

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "grinder",
      entityId: myGrinder.id,
      action: "strike_appeal_submitted",
      actor: myGrinder.name || myGrinder.id,
      details: JSON.stringify({ strikeLogId, appealId: appeal.id }),
    });

    res.status(201).json(appeal);
  });

  app.get("/api/grinder/me/fine-payments", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "No grinder profile found" });
    const payments = await storage.getFinePayments(myGrinder.id);
    res.json(payments);
  });

  app.post("/api/grinder/me/fine-payments", fineProofUpload.single('proof'), async (req, res) => {
    try {
      const userId = (req as any).userId;
      const allGrinders = await storage.getGrinders();
      const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
      if (!myGrinder) return res.status(404).json({ message: "No grinder profile found" });

      const currentFine = parseFloat(myGrinder.outstandingFine?.toString() || "0");
      if (currentFine <= 0) return res.status(400).json({ message: "No outstanding fines to pay" });

      if (!req.file) return res.status(400).json({ message: "Screenshot proof is required" });

      const { paymentMethod } = req.body;
      if (!paymentMethod) return res.status(400).json({ message: "Payment method is required" });
      const allowedMethods = ["Zelle", "PayPal", "Apple Pay", "Cash App", "Venmo"];
      if (!allowedMethods.includes(paymentMethod)) return res.status(400).json({ message: "Invalid payment method" });

      const existingPayments = await storage.getFinePayments(myGrinder.id);
      const hasPending = existingPayments.some((p: any) => p.status === "pending");
      if (hasPending) return res.status(400).json({ message: "You already have a pending fine payment submission. Please wait for staff review." });

      const proofUrl = `/uploads/fine-proofs/${req.file.filename}`;

      const payment = await storage.createFinePayment({
        id: `FP-${Date.now().toString(36)}`,
        grinderId: myGrinder.id,
        amount: currentFine.toString(),
        paymentMethod,
        proofUrl,
        status: "pending",
      });

      await storage.createStaffAlert({
        id: `SA-${Date.now().toString(36)}fp`,
        targetType: "staff",
        title: "Fine Payment Submitted",
        message: `${myGrinder.name} has submitted a fine payment of $${currentFine.toFixed(2)} via ${paymentMethod} and uploaded proof. Please review.`,
        severity: "warning",
        createdBy: "system",
        readBy: [],
      });

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "grinder",
        entityId: myGrinder.id,
        action: "fine_payment_submitted",
        actor: myGrinder.name || myGrinder.id,
        details: JSON.stringify({ amount: currentFine, paymentMethod, paymentId: payment.id }),
      });

      res.status(201).json(payment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/grinder/me/availability", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "No grinder profile found" });

    const { status, note } = req.body;
    const validStatuses = ["available", "busy", "away", "offline"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be: " + validStatuses.join(", ") });
    }

    const updated = await storage.updateGrinder(myGrinder.id, {
      availabilityStatus: status,
      availabilityNote: note || null,
      availabilityUpdatedAt: new Date(),
    });

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "grinder",
      entityId: myGrinder.id,
      action: "availability_changed",
      actor: myGrinder.name || myGrinder.id,
      details: JSON.stringify({ status, note: note || null }),
    });

    res.json(updated);
  });

  app.patch("/api/grinder/me/twitch", async (req, res) => {
    try {
      const userId = (req as any).userId;
      const allGrinders = await storage.getGrinders();
      const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
      if (!myGrinder) return res.status(404).json({ message: "No grinder profile found" });
      const { twitchUsername } = req.body;
      const sanitized = twitchUsername ? twitchUsername.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 25) : null;
      const updated = await storage.updateGrinder(myGrinder.id, { twitchUsername: sanitized });
      if (!updated) return res.status(500).json({ message: "Failed to update" });
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "grinder",
        entityId: myGrinder.id,
        action: "twitch_updated",
        actor: myGrinder.name || myGrinder.id,
        details: JSON.stringify({ twitchUsername: sanitized }),
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update Twitch username" });
    }
  });

  app.get("/api/staff/elite-requests", requireStaff, async (req, res) => {
    const requests = await storage.getEliteRequests();
    const allGrinders = await storage.getGrinders();
    const enriched = requests.map((r: any) => {
      const grinder = allGrinders.find((g: any) => g.id === r.grinderId);
      return { ...r, grinderName: grinder?.name || r.grinderId, grinderTier: grinder?.tier, grinderCategory: grinder?.category, completedOrders: grinder?.completedOrders || 0, winRate: grinder?.winRate, avgQualityRating: grinder?.avgQualityRating, onTimeRate: grinder?.onTimeRate, strikes: grinder?.strikes || 0 };
    });
    res.json(enriched);
  });

  app.patch("/api/staff/elite-requests/:id", requireStaff, async (req, res) => {
    const { status, reviewedBy, decisionNotes } = req.body;
    const updated = await storage.updateEliteRequest(req.params.id as string, {
      status,
      reviewedBy: reviewedBy || "staff",
      reviewedAt: new Date(),
      decisionNotes,
    });
    if (!updated) return res.status(404).json({ message: "Elite request not found" });

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "elite_request",
      entityId: req.params.id as string,
      action: `elite_${status.toLowerCase()}`,
      actor: reviewedBy || "staff",
      details: decisionNotes,
    });

    res.json(updated);
  });

  app.get("/api/staff/alerts", requireStaff, async (req, res) => {
    const alerts = await storage.getStaffAlerts();
    res.json(alerts);
  });

  app.post("/api/staff/alerts", requireStaff, async (req, res) => {
    const { targetType, grinderId, title, message, severity, createdBy } = req.body;
    const alert = await storage.createStaffAlert({
      id: `SA-${Date.now().toString(36)}`,
      targetType: targetType || "all",
      grinderId: grinderId || null,
      title,
      message,
      severity: severity || "info",
      createdBy: createdBy || "staff",
      readBy: [],
    });

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "staff_alert",
      entityId: alert.id,
      action: "alert_sent",
      actor: createdBy || "staff",
      details: `Target: ${targetType || "all"}, Title: ${title}`,
    });

    res.status(201).json(alert);
  });

  app.delete("/api/staff/alerts/:id", requireStaff, async (req, res) => {
    const deleted = await storage.deleteStaffAlert(req.params.id as string);
    if (!deleted) return res.status(404).json({ message: "Alert not found" });
    res.json({ success: true });
  });

  const STRIKE_FINES: Record<number, number> = { 1: 25, 2: 50, 3: 100 };

  app.post("/api/staff/strikes", requireStaff, async (req, res) => {
    const { grinderId, action, reason, createdBy } = req.body;
    if (!grinderId || !action || !reason) {
      return res.status(400).json({ message: "grinderId, action, and reason are required" });
    }

    const grinder = await storage.getGrinder(grinderId);
    if (!grinder) return res.status(404).json({ message: "Grinder not found" });

    const delta = action === "add" ? 1 : -1;
    const newStrikes = Math.max(0, grinder.strikes + delta);

    const fineAmount = action === "add" ? (STRIKE_FINES[newStrikes] || 100) : 0;
    const currentFine = parseFloat(grinder.outstandingFine?.toString() || "0");
    const newOutstandingFine = action === "add"
      ? (currentFine + fineAmount).toString()
      : currentFine.toString();
    const shouldSuspend = action === "add" && newStrikes >= 1;

    await storage.updateGrinder(grinderId, {
      strikes: newStrikes,
      suspended: shouldSuspend,
      outstandingFine: newOutstandingFine,
    });

    await recalcGrinderStats(grinderId);

    const strikeLog = await storage.createStrikeLog({
      id: `SL-${Date.now().toString(36)}`,
      grinderId,
      action,
      reason,
      delta,
      resultingStrikes: newStrikes,
      fineAmount: fineAmount.toString(),
      createdBy: createdBy || "staff",
    });

    const fineMsg = action === "add"
      ? ` A fine of $${fineAmount} has been applied. Your total outstanding fine is $${newOutstandingFine}. You are suspended from taking orders until all fines are paid.`
      : "";

    await storage.createStaffAlert({
      id: `SA-${Date.now().toString(36)}s`,
      targetType: "grinder",
      grinderId,
      title: action === "add" ? `Strike ${newStrikes} - $${fineAmount} Fine` : "Strike Removed",
      message: `${action === "add" ? "A strike has been added to" : "A strike has been removed from"} your profile. Reason: ${reason}. You now have ${newStrikes} strike${newStrikes !== 1 ? "s" : ""}.${fineMsg}`,
      severity: action === "add" ? "danger" : "success",
      createdBy: createdBy || "staff",
      readBy: [],
    });

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "grinder",
      entityId: grinderId,
      action: `strike_${action}`,
      actor: createdBy || "staff",
      details: JSON.stringify({ reason, delta, resultingStrikes: newStrikes, fineAmount, outstandingFine: newOutstandingFine, suspended: shouldSuspend }),
    });

    createSystemNotification({
      userId: grinder.discordUserId || grinderId,
      type: "strike",
      title: action === "add" ? "Strike Received" : "Strike Removed",
      body: `${action === "add" ? "You received a strike" : "A strike was removed"}. Reason: ${reason}. Current strikes: ${newStrikes}.`,
      linkUrl: "/grinder/status",
      icon: "alert-triangle",
      severity: action === "add" ? "danger" : "success",
    });

    res.status(201).json({ strikeLog, newStrikes, fineAmount, outstandingFine: newOutstandingFine, suspended: shouldSuspend });
  });

  app.get("/api/staff/strike-logs", requireStaff, async (req, res) => {
    const logs = await storage.getStrikeLogs();
    res.json(logs);
  });

  app.get("/api/staff/strike-appeals", requireStaff, async (req, res) => {
    const appeals = await storage.getStrikeAppeals();
    res.json(appeals);
  });

  app.patch("/api/staff/strike-appeals/:id", requireStaff, async (req, res) => {
    try {
      const { status, reviewNote } = req.body;
      if (!status || !["approved", "denied"].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'denied'" });
      }

      const appeals = await storage.getStrikeAppeals();
      const appeal = appeals.find((a: any) => a.id === req.params.id);
      if (!appeal) return res.status(404).json({ message: "Appeal not found" });
      if (appeal.status !== "pending") return res.status(400).json({ message: "Appeal already reviewed" });

      const reviewerName = (req as any).userName || (req as any).userId || "Staff";

      await storage.updateStrikeAppeal(req.params.id, {
        status,
        reviewedBy: (req as any).userId || "staff",
        reviewedByName: reviewerName,
        reviewNote: reviewNote || null,
        reviewedAt: new Date(),
      });

      if (status === "approved") {
        const grinder = await storage.getGrinder(appeal.grinderId);
        if (grinder) {
          const strikeLog = (await storage.getStrikeLogs(appeal.grinderId)).find((l: any) => l.id === appeal.strikeLogId);
          const newStrikes = Math.max(0, grinder.strikes - 1);

          const fineRefund = strikeLog ? parseFloat(strikeLog.fineAmount?.toString() || "0") : 0;
          const currentFine = parseFloat(grinder.outstandingFine?.toString() || "0");
          const newFine = Math.max(0, currentFine - fineRefund);
          const shouldUnsuspend = newStrikes === 0 && newFine <= 0;

          await storage.updateGrinder(appeal.grinderId, {
            strikes: newStrikes,
            outstandingFine: newFine.toString(),
            ...(shouldUnsuspend ? { suspended: false } : {}),
          });

          if (strikeLog) {
            await storage.updateStrikeLog(appeal.strikeLogId, { finePaid: true, finePaidAt: new Date() });
          }

          await storage.createStrikeLog({
            id: `SL-${Date.now().toString(36)}`,
            grinderId: appeal.grinderId,
            action: "remove",
            reason: `Strike appeal approved: ${reviewNote || "Appeal granted"}`,
            delta: -1,
            resultingStrikes: newStrikes,
            fineAmount: "0",
            createdBy: reviewerName,
          });

          await storage.createStaffAlert({
            id: `SA-${Date.now().toString(36)}ap`,
            targetType: "grinder",
            grinderId: appeal.grinderId,
            title: "Strike Appeal Approved",
            message: `Your strike appeal has been approved. The strike has been removed and your fine of $${fineRefund.toFixed(2)} has been waived. You now have ${newStrikes} strike${newStrikes !== 1 ? "s" : ""}.${shouldUnsuspend ? " Your suspension has been lifted." : ""}`,
            severity: "success",
            createdBy: reviewerName,
            readBy: [],
          });

          createSystemNotification({
            userId: grinder.discordUserId || appeal.grinderId,
            type: "strike",
            title: "Strike Appeal Approved",
            body: `Your appeal was approved. Strike removed. Current strikes: ${newStrikes}.`,
            linkUrl: "/grinder/status",
            icon: "check-circle",
            severity: "success",
          });
        }
      } else {
        const grinder = await storage.getGrinder(appeal.grinderId);
        if (grinder) {
          await storage.createStaffAlert({
            id: `SA-${Date.now().toString(36)}ad`,
            targetType: "grinder",
            grinderId: appeal.grinderId,
            title: "Strike Appeal Denied",
            message: `Your strike appeal has been denied.${reviewNote ? ` Reason: ${reviewNote}` : ""} The original strike and fine remain in effect.`,
            severity: "danger",
            createdBy: reviewerName,
            readBy: [],
          });

          createSystemNotification({
            userId: grinder.discordUserId || appeal.grinderId,
            type: "strike",
            title: "Strike Appeal Denied",
            body: `Your appeal was denied.${reviewNote ? ` Reason: ${reviewNote}` : ""}`,
            linkUrl: "/grinder/status",
            icon: "x-circle",
            severity: "danger",
          });
        }
      }

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "grinder",
        entityId: appeal.grinderId,
        action: `strike_appeal_${status}`,
        actor: reviewerName,
        details: JSON.stringify({ appealId: req.params.id, strikeLogId: appeal.strikeLogId, reviewNote }),
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/staff/fines/:grinderId/pay", requireStaff, async (req, res) => {
    try {
      const grinder = await storage.getGrinder(req.params.grinderId);
      if (!grinder) return res.status(404).json({ message: "Grinder not found" });

      const currentFine = parseFloat(grinder.outstandingFine?.toString() || "0");
      if (currentFine <= 0) return res.status(400).json({ message: "No outstanding fines" });

      await storage.updateGrinder(req.params.grinderId, {
        outstandingFine: "0",
        suspended: false,
      });

      const logs = await storage.getStrikeLogs();
      const unpaidLogs = logs.filter((l: any) => l.grinderId === req.params.grinderId && !l.finePaid && parseFloat(l.fineAmount?.toString() || "0") > 0);
      for (const log of unpaidLogs) {
        await storage.updateStrikeLog(log.id, { finePaid: true, finePaidAt: new Date() });
      }

      const { walletId } = req.body;
      if (walletId) {
        try {
          const wallet = await storage.getWallet(walletId);
          if (wallet) {
            const currentBal = parseFloat(wallet.balance?.toString() || "0");
            const newBal = currentBal + currentFine;
            const actorId = (req.user as any)?.discordId || (req.user as any)?.id || "";
            const actorName = getActorName(req);
            await storage.createWalletTransaction({
              id: `WTX-${Date.now().toString(36)}-fine`,
              walletId: wallet.id,
              type: "fine_received",
              amount: currentFine.toFixed(2),
              balanceBefore: currentBal.toFixed(2),
              balanceAfter: newBal.toFixed(2),
              category: "fine",
              description: `Fine payment received from grinder ${grinder.name || req.params.grinderId}`,
              relatedGrinderId: req.params.grinderId,
              performedBy: actorId,
              performedByName: actorName,
              performedByRole: (req.user as any)?.role || "staff",
            });
            await storage.updateWallet(wallet.id, { balance: newBal.toFixed(2), updatedAt: new Date() });
          }
        } catch (e: any) {
          console.error("[wallet] Failed to create fine received transaction:", e.message);
        }
      }

      await storage.createStaffAlert({
        id: `SA-${Date.now().toString(36)}fp`,
        targetType: "grinder",
        grinderId: req.params.grinderId,
        title: "Fines Cleared - Suspension Lifted",
        message: `Your outstanding fine of $${currentFine.toFixed(2)} has been marked as paid. Your suspension has been lifted and you can now take orders again.`,
        severity: "success",
        createdBy: (req as any).userId || "staff",
        readBy: [],
      });

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "grinder",
        entityId: req.params.grinderId,
        action: "fine_paid",
        actor: getActorName(req),
        details: JSON.stringify({ amountPaid: currentFine }),
      });

      res.json({ success: true, amountPaid: currentFine });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/staff/fine-payments", requireStaff, async (req, res) => {
    const payments = await storage.getFinePayments();
    res.json(payments);
  });

  app.patch("/api/staff/fine-payments/:id/review", requireStaff, async (req, res) => {
    try {
      const { status, reviewNote } = req.body;
      if (!status || !["approved", "denied"].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'denied'" });
      }

      const allPayments = await storage.getFinePayments();
      const payment = allPayments.find((p: any) => p.id === req.params.id);
      if (!payment) return res.status(404).json({ message: "Fine payment not found" });
      if (payment.status !== "pending") return res.status(400).json({ message: "This payment has already been reviewed" });

      const reviewerName = getActorName(req);

      await storage.updateFinePayment(req.params.id, {
        status,
        reviewedBy: (req as any).userId || "staff",
        reviewedByName: reviewerName,
        reviewNote: reviewNote || null,
        reviewedAt: new Date(),
      });

      if (status === "approved") {
        const grinder = await storage.getGrinder(payment.grinderId);
        if (grinder) {
          const currentFine = parseFloat(grinder.outstandingFine?.toString() || "0");
          const paidAmount = parseFloat(payment.amount?.toString() || "0");
          const newFine = Math.max(0, currentFine - paidAmount);

          await storage.updateGrinder(payment.grinderId, {
            outstandingFine: newFine.toString(),
            suspended: newFine > 0 ? true : false,
          });

          const logs = await storage.getStrikeLogs();
          const unpaidLogs = logs
            .filter((l: any) => l.grinderId === payment.grinderId && !l.finePaid && parseFloat(l.fineAmount?.toString() || "0") > 0)
            .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          let remaining = paidAmount;
          for (const log of unpaidLogs) {
            if (remaining <= 0) break;
            const logFine = parseFloat(log.fineAmount?.toString() || "0");
            if (logFine <= remaining) {
              await storage.updateStrikeLog(log.id, { finePaid: true, finePaidAt: new Date() });
              remaining -= logFine;
            }
          }

          await storage.createStaffAlert({
            id: `SA-${Date.now().toString(36)}fpa`,
            targetType: "grinder",
            grinderId: payment.grinderId,
            title: "Fine Payment Approved",
            message: `Your fine payment of $${paidAmount.toFixed(2)} via ${payment.paymentMethod} has been approved. ${newFine <= 0 ? "Your suspension has been lifted and you can now take orders again." : `Remaining fine balance: $${newFine.toFixed(2)}.`}`,
            severity: "success",
            createdBy: (req as any).userId || "staff",
            readBy: [],
          });
        }
      } else {
        await storage.createStaffAlert({
          id: `SA-${Date.now().toString(36)}fpd`,
          targetType: "grinder",
          grinderId: payment.grinderId,
          title: "Fine Payment Denied",
          message: `Your fine payment submission was denied.${reviewNote ? ` Reason: ${reviewNote}` : ""} Please resubmit with valid proof.`,
          severity: "danger",
          createdBy: (req as any).userId || "staff",
          readBy: [],
        });
      }

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "grinder",
        entityId: payment.grinderId,
        action: `fine_payment_${status}`,
        actor: reviewerName,
        details: JSON.stringify({ paymentId: req.params.id, amount: payment.amount, reviewNote }),
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/staff/elite-vs-grinder-metrics", requireStaff, async (req, res) => {
    const allGrinders = await storage.getGrinders();
    const isEliteGrinder = (g: any) => g.discordRoleId === "1466370965016412316" || g.tier === "Elite" || g.category === "Elite Grinder" || (g.roles && g.roles.includes("Elite Grinder"));
    const eliteGrinders = allGrinders.filter(isEliteGrinder);
    const regularGrinders = allGrinders.filter((g: any) => !isEliteGrinder(g));

    const computeAvg = (arr: any[], field: string) => {
      const vals = arr.map(g => Number(g[field]) || 0);
      return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    };

    res.json({
      elite: {
        count: eliteGrinders.length,
        avgWinRate: computeAvg(eliteGrinders, "winRate"),
        avgQuality: computeAvg(eliteGrinders, "avgQualityRating"),
        avgOnTime: computeAvg(eliteGrinders, "onTimeRate"),
        avgCompletion: computeAvg(eliteGrinders, "completionRate"),
        avgTurnaround: computeAvg(eliteGrinders, "avgTurnaroundDays"),
        avgCompletedOrders: computeAvg(eliteGrinders, "completedOrders"),
        avgStrikes: computeAvg(eliteGrinders, "strikes"),
        totalEarnings: eliteGrinders.reduce((s: number, g: any) => s + (Number(g.totalEarnings) || 0), 0),
      },
      grinders: {
        count: regularGrinders.length,
        avgWinRate: computeAvg(regularGrinders, "winRate"),
        avgQuality: computeAvg(regularGrinders, "avgQualityRating"),
        avgOnTime: computeAvg(regularGrinders, "onTimeRate"),
        avgCompletion: computeAvg(regularGrinders, "completionRate"),
        avgTurnaround: computeAvg(regularGrinders, "avgTurnaroundDays"),
        avgCompletedOrders: computeAvg(regularGrinders, "completedOrders"),
        avgStrikes: computeAvg(regularGrinders, "strikes"),
        totalEarnings: regularGrinders.reduce((s: number, g: any) => s + (Number(g.totalEarnings) || 0), 0),
      },
    });
  });

  app.get(api.analytics.summary.path, requireStaff, async (req, res) => {
    const summary = await storage.getAnalyticsSummary();
    res.json(summary);
  });

  app.get(api.dashboard.stats.path, requireStaff, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  app.get(api.queue.getTop.path, requireStaff, async (req, res) => {
    const topItems = await storage.getTopQueueItems();
    res.json(topItems);
  });

  app.get(api.queue.emergency.path, requireStaff, async (req, res) => {
    const emergency = await storage.getEmergencyQueue();
    res.json(emergency);
  });

  app.get("/api/queue/full", requireStaff, async (req, res) => {
    const fullQueue = await storage.getFullQueue();
    res.json(fullQueue);
  });

  app.get(api.auditLogs.list.path, requireStaff, async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 100;
    const entityType = req.query.entityType as string | undefined;
    const logs = await storage.getAuditLogs(limit, entityType);
    res.json(logs);
  });

  app.get(api.config.get.path, requireStaff, async (req, res) => {
    const config = await storage.getQueueConfig();
    res.json(config);
  });

  app.put(api.config.update.path, requireStaff, async (req, res) => {
    try {
      const config = await storage.upsertQueueConfig(req.body);
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "config",
        entityId: "default",
        action: "updated",
        actor: getActorName(req),
        details: JSON.stringify(req.body),
      });
      res.json(config);
    } catch (err) {
      res.status(400).json({ message: String(err) });
    }
  });

  // ============ ACTIVITY CHECKPOINTS (Grinder routes) ============

  app.get("/api/grinder/me/checkpoints/:assignmentId", async (req, res) => {
    try {
      const userId = (req as any).userId;
      const allGrinders = await storage.getGrinders();
      const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
      if (!myGrinder) return res.status(403).json({ message: "Grinder profile not found" });

      const checkpoints = await storage.getActivityCheckpoints(req.params.assignmentId);
      const mine = checkpoints.filter((c: any) => c.grinderId === myGrinder.id);
      res.json(mine);
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.post("/api/grinder/me/checkpoints", async (req, res) => {
    try {
      const userId = (req as any).userId;
      const allGrinders = await storage.getGrinders();
      const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
      if (!myGrinder) return res.status(403).json({ message: "Grinder profile not found" });

      const { assignmentId, orderId, type, response, note } = req.body;
      if (!assignmentId || !orderId || !type) {
        return res.status(400).json({ message: "assignmentId, orderId, and type are required" });
      }

      const validTypes = ["ticket_ack", "login", "logoff", "issue", "order_update", "start_order"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ message: `Invalid type. Must be one of: ${validTypes.join(", ")}` });
      }

      if (type === "ticket_ack") {
        if (response !== "yes" && response !== "no") {
          return res.status(400).json({ message: "ticket_ack requires response to be 'yes' or 'no'" });
        }
        if (response === "no" && !note) {
          return res.status(400).json({ message: "Note is required when declining a ticket" });
        }
      }

      if (type === "login" || type === "logoff") {
        const existingCheckpoints = await storage.getActivityCheckpoints(assignmentId);
        const loginLogoffs = existingCheckpoints
          .filter((c: any) => c.grinderId === myGrinder.id && (c.type === "login" || c.type === "logoff"))
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const lastType = loginLogoffs.length > 0 ? loginLogoffs[0].type : null;

        if (type === "login") {
          if (lastType === "login") {
            return res.status(400).json({ message: "Already logged in. Must logoff first." });
          }
        }
        if (type === "logoff") {
          if (lastType !== "login") {
            return res.status(400).json({ message: "Not currently logged in. Must login first." });
          }
        }
      }

      if (type === "start_order") {
        const existingCheckpoints = await storage.getActivityCheckpoints(assignmentId);
        const alreadyStarted = existingCheckpoints.some((c: any) => c.grinderId === myGrinder.id && c.type === "start_order");
        if (alreadyStarted) {
          return res.status(400).json({ message: "Order has already been started" });
        }
        const loginLogoffs = existingCheckpoints
          .filter((c: any) => c.grinderId === myGrinder.id && (c.type === "login" || c.type === "logoff"))
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const lastType = loginLogoffs.length > 0 ? loginLogoffs[0].type : null;
        if (lastType !== "login") {
          return res.status(400).json({ message: "You must log in before starting an order" });
        }
      }

      if (type === "issue" && !note) {
        return res.status(400).json({ message: "Note is required for issue checkpoints" });
      }

      if (type === "order_update" && !req.body.message && !note) {
        return res.status(400).json({ message: "Message is required for order_update checkpoints" });
      }

      const checkpoint = await storage.createActivityCheckpoint({
        id: `CP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        assignmentId,
        orderId,
        grinderId: myGrinder.id,
        type,
        response: response || null,
        note: note || req.body.message || null,
      });

      if (type === "start_order") {
        await storage.updateAssignment(assignmentId, { startedAt: new Date() } as any);
        if (orderId) {
          await storage.updateOrderStatus(orderId, "In Progress");
        }
      }

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        entityType: "checkpoint",
        entityId: checkpoint.id,
        action: `checkpoint_${type}`,
        actor: myGrinder.name || myGrinder.id,
        details: JSON.stringify({ assignmentId, orderId, type, response: response || null }),
      });

      res.status(201).json(checkpoint);
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  // ============ ACTIVITY CHECKPOINTS (Staff routes) ============

  app.get("/api/staff/checkpoints", requireStaff, async (req, res) => {
    try {
      const { assignmentId, grinderId } = req.query;
      const checkpoints = await storage.getActivityCheckpoints(
        assignmentId as string | undefined,
        grinderId as string | undefined
      );
      res.json(checkpoints);
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.patch("/api/staff/checkpoints/:id/resolve", requireStaff, async (req, res) => {
    try {
      const { resolvedBy, resolvedNote } = req.body;
      if (!resolvedBy || !resolvedNote) {
        return res.status(400).json({ message: "resolvedBy and resolvedNote are required" });
      }
      const updated = await storage.updateActivityCheckpoint(req.params.id, {
        resolvedBy,
        resolvedNote,
        resolvedAt: new Date(),
      });
      if (!updated) return res.status(404).json({ message: "Checkpoint not found" });

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        entityType: "checkpoint",
        entityId: req.params.id,
        action: "checkpoint_resolved",
        actor: resolvedBy,
        details: JSON.stringify({ resolvedNote }),
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.patch("/api/staff/checkpoints/:id/edit-time", requireStaff, async (req, res) => {
    try {
      const { createdAt } = req.body;
      if (!createdAt) {
        return res.status(400).json({ message: "createdAt is required" });
      }
      const newDate = new Date(createdAt);
      if (isNaN(newDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      const updated = await storage.updateActivityCheckpoint(req.params.id, {
        createdAt: newDate,
      } as any);
      if (!updated) return res.status(404).json({ message: "Checkpoint not found" });

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        entityType: "checkpoint",
        entityId: req.params.id,
        action: "checkpoint_time_edited",
        actor: getActorName(req),
        details: JSON.stringify({ newTime: createdAt }),
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/orders/:orderId/activity-log", async (req, res) => {
    try {
      const userId = (req as any).userId;
      const user = (req as any).user;
      if (!userId && !user) return res.status(401).json({ message: "Not authenticated" });

      const orderId = req.params.orderId;
      const allAssignments = await storage.getAssignments();
      const orderAssignments = allAssignments.filter((a: any) => a.orderId === orderId);

      const allGrinders = await storage.getGrinders();
      const isStaff = user?.role === "staff" || user?.role === "owner";
      if (!isStaff) {
        const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
        if (!myGrinder) return res.status(403).json({ message: "Not authorized" });
        const isAssigned = orderAssignments.some((a: any) => a.grinderId === myGrinder.id);
        if (!isAssigned) return res.status(403).json({ message: "Not authorized for this order" });
      }

      const allCheckpoints = await storage.getActivityCheckpoints();
      const orderCheckpoints = allCheckpoints.filter((c: any) => c.orderId === orderId);

      const allUpdates = await storage.getOrderUpdates();
      const orderUpdates = (allUpdates || []).filter((u: any) => u.orderId === orderId);

      const log: any[] = [];

      for (const cp of orderCheckpoints) {
        const grinder = allGrinders.find((g: any) => g.id === cp.grinderId);
        log.push({
          id: cp.id,
          type: cp.type,
          source: "checkpoint",
          grinderName: grinder?.name || cp.grinderId,
          grinderId: cp.grinderId,
          response: cp.response,
          note: cp.note,
          resolvedBy: cp.resolvedBy,
          resolvedAt: cp.resolvedAt,
          resolvedNote: cp.resolvedNote,
          createdAt: cp.createdAt,
        });
      }

      for (const u of orderUpdates) {
        const grinder = allGrinders.find((g: any) => g.id === u.grinderId);
        log.push({
          id: u.id,
          type: u.type || "order_update",
          source: "update",
          grinderName: grinder?.name || u.grinderId || "Unknown",
          grinderId: u.grinderId,
          note: u.message,
          newDeadline: u.newDeadline,
          acknowledgedBy: u.acknowledgedBy,
          createdAt: u.createdAt,
        });
      }

      log.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const assignment = orderAssignments[0];
      res.json({
        log,
        startedAt: assignment?.startedAt || null,
        assignedAt: assignment?.assignedDateTime || null,
        dueAt: assignment?.dueDateTime || null,
        deliveredAt: assignment?.deliveredDateTime || null,
      });
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  // ============ ORDER UPDATES (Staff routes) ============

  app.patch("/api/staff/order-updates/:id/acknowledge", requireStaff, async (req, res) => {
    try {
      const { acknowledgedBy } = req.body;
      if (!acknowledgedBy) {
        return res.status(400).json({ message: "acknowledgedBy is required" });
      }
      const updated = await storage.updateOrderUpdate(req.params.id, {
        acknowledgedBy,
        acknowledgedAt: new Date(),
      });
      if (!updated) return res.status(404).json({ message: "Order update not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/staff/order-updates", requireStaff, async (req, res) => {
    try {
      const updates = await storage.getOrderUpdates();
      res.json(updates);
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/staff/grinder-scorecard/:grinderId", requireStaff, async (req, res) => {
    try {
      const { grinderId } = req.params;
      const grinder = await storage.getGrinder(grinderId);
      if (!grinder) return res.status(404).json({ message: "Grinder not found" });

      const reports = await storage.getPerformanceReports(grinderId);
      const sortedReports = reports
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20);

      const orderUpdateLogs = await storage.getOrderUpdates(grinderId);
      const orders = await storage.getOrders();
      const orderMap = new Map(orders.map((o: any) => [o.id, o]));

      const enrichedLogs = orderUpdateLogs.map((log: any) => {
        const order = orderMap.get(log.orderId);
        return {
          ...log,
          orderTitle: order?.title || order?.id || log.orderId,
          orderStatus: order?.status || "Unknown",
        };
      });

      const loggedOrderIds = new Set(orderUpdateLogs.map((l: any) => l.orderId));
      const allAssignments = await storage.getAssignments();
      const grinderAssignments = allAssignments.filter((a: any) => a.grinderId === grinderId);
      for (const assignment of grinderAssignments) {
        if (!assignment.orderId || loggedOrderIds.has(assignment.orderId)) continue;
        const order = orderMap.get(assignment.orderId);
        if (!order) continue;
        const isCompleted = order.status === "Completed" || order.status === "Paid Out";
        enrichedLogs.push({
          id: `SYN-${assignment.orderId}`,
          assignmentId: assignment.id,
          orderId: assignment.orderId,
          grinderId,
          updateType: isCompleted ? "completion" : "system",
          message: isCompleted
            ? `Order completed. Grinder Pay: $${parseFloat(assignment.grinderEarnings || assignment.bidAmount || "0").toFixed(2)}`
            : `Order assigned — Status: ${order.status}`,
          createdAt: order.completedAt || assignment.assignedAt || order.createdAt,
          orderTitle: order.title || order.id,
          orderStatus: order.status,
        });
      }
      enrichedLogs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const checkpoints = await storage.getActivityCheckpoints(undefined, grinderId);

      const checkpointCompliance = {
        totalCheckpoints: checkpoints.length,
        issuesReported: checkpoints.filter((c: any) => c.type === "issue").length,
        resolvedIssues: checkpoints.filter((c: any) => c.type === "issue" && c.resolvedAt).length,
        totalLogins: checkpoints.filter((c: any) => c.type === "login").length,
        updatesSubmitted: orderUpdateLogs.length,
      };

      const strikeLogs = await storage.getStrikeLogs(grinderId);

      res.json({
        reports: sortedReports,
        orderLogs: enrichedLogs,
        checkpointCompliance,
        strikeLogs,
      });
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  // ============ PERFORMANCE REPORTS ============

  app.post("/api/staff/performance-reports/generate", requireStaff, async (req, res) => {
    try {
      const { assignmentId } = req.body;
      if (!assignmentId) return res.status(400).json({ message: "assignmentId is required" });

      const assignment = await storage.getAssignment(assignmentId);
      if (!assignment) return res.status(404).json({ message: "Assignment not found" });

      const grinder = await storage.getGrinder(assignment.grinderId);
      if (!grinder) return res.status(404).json({ message: "Grinder not found" });

      const checkpoints = await storage.getActivityCheckpoints(assignmentId);
      const orderUpdates = await storage.getOrderUpdates(assignment.grinderId);
      const assignmentUpdates = orderUpdates.filter((u: any) => u.assignmentId === assignmentId);

      const metricsSnapshot = {
        qualityScore: grinder.avgQualityRating || "0",
        completionRate: grinder.completionRate || "0",
        winRate: grinder.winRate || "0",
        onTimeRate: grinder.onTimeRate || "0",
        totalEarnings: grinder.totalEarnings || "0",
      };

      const ticketAcked = checkpoints.filter((c: any) => c.type === "ticket_ack").length > 0;
      const totalLogins = checkpoints.filter((c: any) => c.type === "login").length;
      const totalLogoffs = checkpoints.filter((c: any) => c.type === "logoff").length;
      const issuesReported = checkpoints.filter((c: any) => c.type === "issue").length;
      const issuesResolved = checkpoints.filter((c: any) => c.type === "issue" && c.resolvedAt).length;
      const updatesSubmitted = assignmentUpdates.length;

      const checkpointSummary = {
        ticketAcked,
        totalLogins,
        totalLogoffs,
        issuesReported,
        issuesResolved,
        updatesSubmitted,
      };

      const startDate = new Date(assignment.assignedDateTime);
      const endDate = assignment.deliveredDateTime ? new Date(assignment.deliveredDateTime) : new Date();
      const diffMs = endDate.getTime() - startDate.getTime();
      const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const rawCompliance = (updatesSubmitted / days) * 100;
      const dailyUpdateCompliance = Math.min(100, Math.round(rawCompliance));

      const qualityVal = Number(grinder.avgQualityRating || 0);
      const qualityNorm = (qualityVal / 5) * 100;
      const gradeScore = (dailyUpdateCompliance + qualityNorm) / 2;

      let overallGrade: string;
      if (gradeScore >= 90) overallGrade = "A";
      else if (gradeScore >= 75) overallGrade = "B";
      else if (gradeScore >= 60) overallGrade = "C";
      else if (gradeScore >= 40) overallGrade = "D";
      else overallGrade = "F";

      const report = await storage.createPerformanceReport({
        id: `PR-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        assignmentId,
        orderId: assignment.orderId,
        grinderId: assignment.grinderId,
        metricsSnapshot,
        metricDeltas: {},
        checkpointSummary,
        dailyUpdateCompliance: String(dailyUpdateCompliance),
        overallGrade,
        status: "Draft",
      });

      const userId = (req as any).userId;
      const dbUser = await authStorage.getUser(userId);
      const actorName = dbUser?.firstName || dbUser?.discordUsername || "Staff";
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        entityType: "report",
        entityId: report.id,
        action: "report_generated",
        actor: actorName,
        details: JSON.stringify({ assignmentId, grinderId: assignment.grinderId, grade: overallGrade }),
      });

      res.status(201).json(report);
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/staff/performance-reports", requireStaff, async (req, res) => {
    try {
      const { grinderId, status } = req.query;
      let reports = await storage.getPerformanceReports(grinderId as string | undefined);
      if (status) {
        reports = reports.filter((r: any) => r.status === status);
      }
      res.json(reports);
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.patch("/api/staff/performance-reports/:id", requireStaff, async (req, res) => {
    try {
      const { staffNotes, status } = req.body;
      const updateData: any = {};
      if (staffNotes !== undefined) updateData.staffNotes = staffNotes;
      if (status !== undefined) {
        updateData.status = status;
        if (status === "Approved") {
          const userId = (req as any).userId;
          const dbUser = await authStorage.getUser(userId);
          updateData.approvedBy = dbUser?.firstName || dbUser?.discordUsername || "Staff";
          updateData.approvedAt = new Date();
        }
      }
      const updated = await storage.updatePerformanceReport(req.params.id, updateData);
      if (!updated) return res.status(404).json({ message: "Performance report not found" });

      const userId2 = (req as any).userId;
      const dbUser2 = await authStorage.getUser(userId2);
      const actorName2 = dbUser2?.firstName || dbUser2?.discordUsername || "Staff";
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        entityType: "report",
        entityId: req.params.id,
        action: status === "Approved" ? "report_approved" : "report_updated",
        actor: actorName2,
        details: JSON.stringify({ status: updateData.status, staffNotes: updateData.staffNotes }),
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.delete("/api/staff/performance-reports/:id", requireStaff, async (req, res) => {
    try {
      const deleted = await storage.deletePerformanceReport(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Performance report not found" });

      const userId = (req as any).userId;
      const dbUser = await authStorage.getUser(userId);
      const actorName = dbUser?.firstName || dbUser?.discordUsername || "Staff";
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "report",
        entityId: req.params.id,
        action: "report_deleted",
        actor: actorName,
      });

      res.json({ message: "Report deleted" });
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/grinder/me/performance-reports", async (req, res) => {
    try {
      const userId = (req as any).userId;
      const allGrinders = await storage.getGrinders();
      const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
      if (!myGrinder) return res.status(403).json({ message: "Grinder profile not found" });

      const reports = await storage.getPerformanceReports(myGrinder.id);
      const approved = reports.filter((r: any) => r.status === "Approved");
      res.json(approved);
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/grinder/me/scorecard", async (req, res) => {
    try {
      const userId = (req as any).userId;
      const allGrinders = await storage.getGrinders();
      let myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
      if (!myGrinder) return res.status(403).json({ message: "Grinder profile not found" });

      await recalcGrinderStats(myGrinder.id);
      myGrinder = await storage.getGrinder(myGrinder.id) as any;
      if (!myGrinder) return res.status(403).json({ message: "Grinder profile not found" });

      const reports = await storage.getPerformanceReports(myGrinder.id);
      const approvedReports = reports
        .filter((r: any) => r.status === "Approved")
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

      const checkpoints = await storage.getActivityCheckpoints(undefined, myGrinder.id);
      const totalCheckpoints = checkpoints.length;
      const issueCheckpoints = checkpoints.filter((c: any) => c.type === "issue").length;
      const resolvedIssues = checkpoints.filter((c: any) => c.type === "issue" && c.resolvedAt).length;
      const loginCount = checkpoints.filter((c: any) => c.type === "login").length;

      const checkpointCompliance = {
        totalCheckpoints,
        issueCheckpoints,
        resolvedIssues,
        loginCount,
        issueResolutionRate: issueCheckpoints > 0 ? Math.round((resolvedIssues / issueCheckpoints) * 100) : 100,
      };

      const orderUpdateLogs = await storage.getOrderUpdates(myGrinder.id);

      const orders = await storage.getOrders();
      const orderMap = new Map(orders.map((o: any) => [o.id, o]));
      const scServices = await storage.getServices();
      const scServiceMap = new Map(scServices.map((s: any) => [s.id, s]));

      const enrichedLogs = orderUpdateLogs.map((log: any) => {
        const order = orderMap.get(log.orderId);
        return {
          ...log,
          orderTitle: order?.title || order?.id || log.orderId,
          orderStatus: order?.status || "Unknown",
        };
      });

      const loggedOrderIds = new Set(orderUpdateLogs.map((l: any) => l.orderId));
      const allAssignments = await storage.getAssignments();
      const myAssignments = allAssignments.filter((a: any) => a.grinderId === myGrinder.id);
      for (const assignment of myAssignments) {
        if (!assignment.orderId || loggedOrderIds.has(assignment.orderId)) continue;
        const order = orderMap.get(assignment.orderId);
        if (!order) continue;
        const isCompleted = order.status === "Completed" || order.status === "Paid Out";
        enrichedLogs.push({
          id: `SYN-${assignment.orderId}`,
          assignmentId: assignment.id,
          orderId: assignment.orderId,
          grinderId: myGrinder.id,
          updateType: isCompleted ? "completion" : "system",
          message: isCompleted
            ? `Order completed. Grinder Pay: $${parseFloat(assignment.grinderEarnings || assignment.bidAmount || "0").toFixed(2)}`
            : `Order assigned — Status: ${order.status}`,
          createdAt: order.completedAt || assignment.assignedAt || order.createdAt,
          orderTitle: order.title || order.id,
          orderStatus: order.status,
        });
      }
      enrichedLogs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const strikeLogs = await storage.getStrikeLogs(myGrinder.id);

      const payoutReqs = await storage.getPayoutRequests(myGrinder.id);
      const paidPayouts = payoutReqs.filter((p: any) => p.status === "Paid");
      const pendingPayouts = payoutReqs.filter((p: any) => p.status === "Pending" || p.status === "Approved");
      const totalPaidOut = paidPayouts.reduce((sum: number, p: any) => sum + parseFloat(p.amount?.toString() || "0"), 0);
      const totalPending = pendingPayouts.reduce((sum: number, p: any) => sum + parseFloat(p.amount?.toString() || "0"), 0);

      const myAssignmentsFull = (await storage.getAssignments()).filter((a: any) => a.grinderId === myGrinder.id);
      const completedAssignments = myAssignmentsFull.filter((a: any) => {
        const order = orderMap.get(a.orderId);
        return order && (order.status === "Completed" || order.status === "Paid Out");
      });

      const tierThresholds = [
        { tier: "Elite",   minCompleted: 75, minQuality: 90, minWinRate: 65, minOnTime: 90, minEarnings: 5000 },
        { tier: "Diamond", minCompleted: 50, minQuality: 85, minWinRate: 55, minOnTime: 85, minEarnings: 2500 },
        { tier: "Gold",    minCompleted: 25, minQuality: 75, minWinRate: 45, minOnTime: 75, minEarnings: 1000 },
        { tier: "Silver",  minCompleted: 10, minQuality: 65, minWinRate: 35, minOnTime: 65, minEarnings: 300 },
        { tier: "Bronze",  minCompleted: 3,  minQuality: 50, minWinRate: 20, minOnTime: 50, minEarnings: 50 },
      ];

      res.json({
        grinder: myGrinder,
        tierThresholds,
        recentReports: approvedReports,
        checkpointCompliance,
        orderLogs: enrichedLogs,
        strikeLogs,
        payoutSummary: {
          totalPaidOut,
          totalPending,
          paidCount: paidPayouts.length,
          pendingCount: pendingPayouts.length,
          recentPayouts: paidPayouts.slice(0, 10).map((p: any) => ({
            id: p.id,
            orderId: p.orderId,
            amount: p.amount,
            status: p.status,
            paidAt: p.paidAt,
          })),
          pendingPayoutsList: pendingPayouts.slice(0, 10).map((p: any) => ({
            id: p.id,
            orderId: p.orderId,
            amount: p.amount,
            status: p.status,
          })),
        },
        orderHistory: completedAssignments.slice(0, 20).map((a: any) => {
          const order = orderMap.get(a.orderId);
          const svc = scServiceMap.get(order?.serviceId);
          return {
            orderId: a.orderId,
            mgtOrderNumber: order?.mgtOrderNumber || null,
            earnings: a.grinderEarnings || a.bidAmount || "0",
            deliveredAt: a.deliveredDateTime,
            isOnTime: a.isOnTime,
            qualityRating: a.qualityRating,
            orderStatus: order?.status,
            serviceName: svc?.name || order?.serviceId || null,
            platform: order?.platform || null,
            gamertag: order?.gamertag || null,
          };
        }),
      });
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  // ============ GRINDER ORDER UPDATE SUBMISSION ============

  app.post("/api/grinder/me/order-updates", async (req, res) => {
    try {
      const userId = (req as any).userId;
      const allGrinders = await storage.getGrinders();
      const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
      if (!myGrinder) return res.status(403).json({ message: "Grinder profile not found" });

      const { assignmentId, orderId, message, mediaUrls, mediaTypes } = req.body;
      if (!assignmentId || !orderId || !message) {
        return res.status(400).json({ message: "assignmentId, orderId, and message are required" });
      }

      const update = await storage.createOrderUpdate({
        id: `OU-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        assignmentId,
        orderId,
        grinderId: myGrinder.id,
        message,
        mediaUrls: mediaUrls || [],
        mediaTypes: mediaTypes || [],
      });

      res.status(201).json(update);
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.get('/api/chat/members', async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const userId = user.discordId || user.id;
    const staffUsers = await db.select().from(users)
      .where(or(eq(users.role, "staff"), eq(users.role, "owner")));
    const allGrinders = await storage.getGrinders();
    const members: Array<{ id: string; name: string; role: string; avatarUrl: string | null; type: string }> = [];
    for (const s of staffUsers) {
      const sId = s.discordId || s.id;
      if (sId === userId) continue;
      members.push({
        id: sId,
        name: s.discordUsername || s.firstName || "Staff",
        role: "staff",
        avatarUrl: s.discordAvatar ? `https://cdn.discordapp.com/avatars/${s.discordId}/${s.discordAvatar}.png` : s.profileImageUrl || null,
        type: "staff",
      });
    }
    for (const g of allGrinders) {
      if (g.isRemoved) continue;
      const gId = g.discordUserId || g.id;
      if (gId === userId) continue;
      if (members.some(m => m.id === gId)) continue;
      members.push({
        id: gId,
        name: g.name,
        role: "grinder",
        avatarUrl: (g as any).discordAvatarUrl || null,
        type: "grinder",
      });
    }
    res.json(members);
  });

  app.get('/api/chat/threads', async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const threads = await storage.getThreadsForUser(user.discordId || user.id);
    res.json(threads);
  });

  app.post('/api/chat/threads', async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const userId = user.discordId || user.id;
    const { title, type, participantIds, participantNames, participantRoles, participantAvatarUrls } = req.body;
    const threadType = type || "dm";
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ error: "At least one participant required" });
    }
    if (threadType === "dm" && participantIds.length === 1) {
      const existingThreads = await storage.getThreadsForUser(userId);
      const existingDm = existingThreads.find(t =>
        t.type === "dm" &&
        t.participants.length === 2 &&
        t.participants.some(p => p.userId === participantIds[0])
      );
      if (existingDm) return res.json(existingDm);
    }
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const participants = [
      {
        id: `tp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        threadId,
        userId,
        userName: user.displayName || user.username || "Staff",
        userRole: user.role || "staff",
        userAvatarUrl: user.avatarUrl || null,
      },
      ...participantIds.map((pid: string, i: number) => ({
        id: `tp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`,
        threadId,
        userId: pid,
        userName: participantNames?.[i] || "User",
        userRole: participantRoles?.[i] || "grinder",
        userAvatarUrl: participantAvatarUrls?.[i] || null,
      })),
    ];
    const thread = await storage.createThread(
      { id: threadId, title: title || null, type: threadType, ownerId: userId },
      participants
    );
    res.json(thread);
  });

  app.post('/api/chat/threads/:threadId/participants', async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const userId = user.discordId || user.id;
    const thread = await storage.getThread(req.params.threadId);
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    if (thread.ownerId !== userId) return res.status(403).json({ error: "Only the thread owner can add participants" });
    const { participantId, participantName, participantRole, participantAvatarUrl } = req.body;
    if (!participantId || !participantName) return res.status(400).json({ error: "Missing participant info" });
    if (thread.participants.some(p => p.userId === participantId)) {
      return res.status(400).json({ error: "User is already a participant" });
    }
    const participant = await storage.addParticipant({
      id: `tp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      threadId: req.params.threadId,
      userId: participantId,
      userName: participantName,
      userRole: participantRole || "grinder",
      userAvatarUrl: participantAvatarUrl || null,
    });
    res.json(participant);
  });

  app.delete('/api/chat/threads/:threadId/participants/:participantUserId', async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const userId = user.discordId || user.id;
    const thread = await storage.getThread(req.params.threadId);
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    if (thread.ownerId !== userId && req.params.participantUserId !== userId) {
      return res.status(403).json({ error: "Only thread owner can remove others" });
    }
    await storage.removeParticipant(req.params.threadId, req.params.participantUserId);
    res.json({ success: true });
  });

  app.get('/api/chat/threads/:threadId/messages', async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const userId = user.discordId || user.id;
    const thread = await storage.getThread(req.params.threadId);
    if (!thread || !thread.participants.some(p => p.userId === userId)) {
      return res.status(403).json({ error: "Not a participant" });
    }
    const msgs = await storage.getMessagesForThread(req.params.threadId);
    await storage.markThreadRead(req.params.threadId, userId);
    res.json(msgs);
  });

  app.post('/api/chat/threads/:threadId/messages', async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const userId = user.discordId || user.id;
    const thread = await storage.getThread(req.params.threadId);
    if (!thread || !thread.participants.some(p => p.userId === userId)) {
      return res.status(403).json({ error: "Not a participant" });
    }
    const { body, attachments } = req.body;
    if ((!body || !body.trim()) && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: "Message body or attachment required" });
    }
    const trimmedBody = (body || "").trim();
    const msg = await storage.createMessage({
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      threadId: req.params.threadId,
      senderUserId: userId,
      senderName: user.displayName || user.username || "Staff",
      senderRole: user.role || "staff",
      body: trimmedBody,
      attachments: attachments || null,
    });

    const mentions = trimmedBody.match(/@(\w+)/g);
    if (mentions && mentions.length > 0) {
      const mentionedNames = mentions.map((m: string) => m.substring(1).toLowerCase());
      for (const participant of thread.participants) {
        const pName = (participant.userName || "").toLowerCase();
        if (participant.userId !== userId && mentionedNames.some((n: string) => pName.includes(n) || n.includes(pName.split(" ")[0]))) {
          await createSystemNotification({
            userId: participant.userId,
            type: "message",
            title: "You were mentioned",
            body: `${user.displayName || user.username || "Someone"} mentioned you: "${trimmedBody.substring(0, 80)}${trimmedBody.length > 80 ? "..." : ""}"`,
            severity: "info",
          });
        }
      }
    }

    res.json(msg);
  });

  app.delete('/api/chat/messages/:messageId', async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const userId = user.discordId || user.id;
    const [msg] = await db.select().from(messagesTable).where(eq(messagesTable.id, req.params.messageId));
    if (!msg) return res.status(404).json({ error: "Message not found" });
    if (msg.senderUserId !== userId && user.role !== "owner" && user.role !== "staff") {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }
    if (msg.attachments) {
      for (const url of msg.attachments) {
        const filename = url.split("/").pop();
        if (filename) {
          const filePath = path.join(uploadsDir, filename);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      }
    }
    await storage.deleteMessage(req.params.messageId);
    res.json({ success: true });
  });

  app.post('/api/chat/upload', chatUpload.array('files', 10), async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) return res.status(400).json({ error: "No files uploaded" });
    const urls = files.map(f => `/uploads/chat/${f.filename}`);
    res.json({ urls });
  });

  app.post('/api/grinder/me/upload-proof', proofUpload.single('video'), async (req, res) => {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No video file uploaded" });
    const url = `/uploads/proofs/${file.filename}`;

    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (myGrinder) {
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "grinder",
        entityId: myGrinder.id,
        action: "proof_uploaded",
        actor: myGrinder.name || myGrinder.id,
        details: JSON.stringify({ filename: file.filename }),
      });
    }

    res.json({ url });
  });

  app.delete('/api/chat/threads/:threadId', async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const userId = user.discordId || user.id;
    const thread = await storage.getThread(req.params.threadId);
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    const isParticipant = thread.participants.some(p => p.userId === userId);
    if (!isParticipant && user.role !== "owner" && user.role !== "staff") {
      return res.status(403).json({ error: "Not authorized to delete this thread" });
    }
    const threadMessages = await storage.getMessagesForThread(req.params.threadId);
    for (const msg of threadMessages) {
      if (msg.attachments) {
        for (const url of msg.attachments) {
          const filename = url.split("/").pop();
          if (filename) {
            const filePath = path.join(uploadsDir, filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          }
        }
      }
    }
    await storage.deleteThread(req.params.threadId);
    res.json({ success: true });
  });

  app.post('/api/chat/threads/:threadId/read', async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    await storage.markThreadRead(req.params.threadId, user.discordId || user.id);
    res.json({ success: true });
  });

  app.get('/api/notifications', async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const notifs = await storage.getNotificationsForUser(user.discordId || user.id, user.role || "grinder");
    res.json(notifs);
  });

  app.post('/api/notifications/:id/read', async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    await storage.markNotificationRead(req.params.id, user.discordId || user.id);
    res.json({ success: true });
  });

  app.patch('/api/grinders/:id/twitch', async (req, res) => {
    const { twitchUsername } = req.body;
    const sanitized = twitchUsername ? twitchUsername.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 25) : null;
    const updated = await storage.updateGrinder(req.params.id, { twitchUsername: sanitized });
    if (!updated) return res.status(404).json({ error: "Grinder not found" });
    res.json(updated);
  });

  app.get("/api/grinder/me/tasks", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "Grinder profile not found" });
    const tasks = await storage.getGrinderTasks(myGrinder.id);
    res.json(tasks);
  });

  app.patch("/api/grinder/me/tasks/:taskId/complete", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "Grinder profile not found" });
    const task = await storage.getGrinderTask(req.params.taskId);
    if (!task || task.grinderId !== myGrinder.id) return res.status(404).json({ message: "Task not found" });
    const updated = await storage.updateGrinderTask(req.params.taskId, { status: "completed", completedAt: new Date() });
    await storage.createAuditLog({
      id: `AUD-${Date.now()}`,
      entityType: "grinder_task",
      entityId: req.params.taskId,
      action: "task_completed",
      actor: myGrinder.id,
      details: { taskTitle: task.title },
    });
    res.json(updated);
  });

  app.get("/api/staff/grinder-tasks", requireStaff, async (req, res) => {
    const { grinderId } = req.query;
    const tasks = await storage.getGrinderTasks(grinderId as string | undefined);
    res.json(tasks);
  });

  app.post("/api/staff/grinder-tasks", requireStaff, async (req, res) => {
    const user = (req as any).user;
    const { grinderId, assignmentId, orderId, title, description, priority } = req.body;
    if (!grinderId || !title) return res.status(400).json({ error: "grinderId and title are required" });
    const grinder = await storage.getGrinder(grinderId);
    if (!grinder) return res.status(404).json({ error: "Grinder not found" });
    const task = await storage.createGrinderTask({
      id: `TASK-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      grinderId,
      assignmentId: assignmentId || null,
      orderId: orderId || null,
      title,
      description: description || null,
      type: "custom",
      status: "pending",
      priority: priority || "normal",
      createdBy: user.id || (req as any).userId,
      createdByName: user.username || user.displayName || "Staff",
    });
    await storage.createAuditLog({
      id: `AUD-${Date.now()}`,
      entityType: "grinder_task",
      entityId: task.id,
      action: "task_created",
      actor: user.id || (req as any).userId,
      details: { grinderId, title, priority },
    });
    res.json(task);
  });

  app.delete("/api/staff/grinder-tasks/:id", requireStaff, async (req, res) => {
    const deleted = await storage.deleteGrinderTask(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Task not found" });
    res.json({ success: true });
  });

  app.get("/api/staff/grinder-badges/:grinderId", requireStaff, async (req, res) => {
    const badges = await storage.getGrinderBadges(req.params.grinderId);
    res.json(badges);
  });

  app.post("/api/staff/grinder-badges", requireStaff, async (req, res) => {
    const user = (req as any).user;
    const { grinderId, badgeId, note } = req.body;
    if (!grinderId || !badgeId) return res.status(400).json({ error: "grinderId and badgeId are required" });

    const existing = await storage.getGrinderBadges(grinderId);
    if (existing.some(b => b.badgeId === badgeId)) {
      return res.status(409).json({ error: "Badge already assigned to this grinder" });
    }

    const badge = await storage.createGrinderBadge({
      id: `BDG-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      grinderId,
      badgeId,
      awardedBy: user.id,
      awardedByName: user.firstName || user.discordUsername || "Staff",
      note: note || null,
    });

    await storage.createAuditLog({
      id: `AUD-${Date.now().toString(36)}`,
      entityType: "grinder_badge",
      entityId: badge.id,
      action: "badge_awarded",
      actor: user.discordUsername || user.firstName || user.id,
      details: { grinderId, badgeId, note },
    });

    res.json(badge);
  });

  app.delete("/api/staff/grinder-badges/:id", requireStaff, async (req, res) => {
    const user = (req as any).user;
    const badges = await storage.getGrinderBadges();
    const badge = badges.find(b => b.id === req.params.id);

    const deleted = await storage.deleteGrinderBadge(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Badge not found" });

    if (badge) {
      await storage.createAuditLog({
        id: `AUD-${Date.now().toString(36)}`,
        entityType: "grinder_badge",
        entityId: req.params.id,
        action: "badge_removed",
        actor: user.discordUsername || user.firstName || user.id,
        details: { grinderId: badge.grinderId, badgeId: badge.badgeId },
      });
    }

    res.json({ success: true });
  });

  app.get("/api/grinder/me/badges", async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const grinder = await storage.getGrinderByDiscordId(user.discordId || user.id);
    if (!grinder) return res.status(404).json({ error: "Grinder not found" });
    const badges = await storage.getGrinderBadges(grinder.id);
    res.json(badges);
  });

  app.get('/api/events', async (req, res) => {
    const allEvents = await storage.getEvents();
    res.json(allEvents);
  });

  app.post('/api/events', async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    if (user.role !== "staff" && user.role !== "owner") return res.status(403).json({ error: "Staff only" });
    const { type, title, description, startDate, endDate, discountPercent, tags, priority } = req.body;
    if (!title || !description || !startDate) return res.status(400).json({ error: "Title, description, and start date are required" });
    const event = await storage.createEvent({
      id: `EVT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      type: type || "event",
      title,
      description,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      discountPercent: discountPercent || null,
      tags: tags || [],
      priority: priority || "normal",
      isActive: true,
      createdBy: user.discordId || user.id,
      createdByName: user.displayName || user.username || "Staff",
    });
    res.status(201).json(event);
  });

  app.patch('/api/events/:id', async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    if (user.role !== "staff" && user.role !== "owner") return res.status(403).json({ error: "Staff only" });
    const { title, description, startDate, endDate, discountPercent, tags, priority, isActive, type } = req.body;
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (startDate !== undefined) data.startDate = new Date(startDate);
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
    if (discountPercent !== undefined) data.discountPercent = discountPercent;
    if (tags !== undefined) data.tags = tags;
    if (priority !== undefined) data.priority = priority;
    if (isActive !== undefined) data.isActive = isActive;
    if (type !== undefined) data.type = type;
    const updated = await storage.updateEvent(req.params.id, data);
    if (!updated) return res.status(404).json({ error: "Event not found" });
    res.json(updated);
  });

  app.delete('/api/events/:id', async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    if (user.role !== "staff" && user.role !== "owner") return res.status(403).json({ error: "Staff only" });
    await storage.deleteEvent(req.params.id);
    res.json({ success: true });
  });

  // ===== PATCH NOTES =====
  app.get('/api/patch-notes', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const publishedOnly = user.role === "grinder";
      const notes = await storage.getPatchNotes(publishedOnly);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching patch notes:", error);
      res.status(500).json({ error: "Failed to fetch patch notes" });
    }
  });

  app.post('/api/patch-notes', requireStaff, async (req, res) => {
    try {
      const user = (req as any).user;
      const { title, rawText } = req.body;
      if (!title || !rawText) return res.status(400).json({ error: "Title and raw text required" });

      const id = `PN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const note = await storage.createPatchNote({
        id,
        title,
        rawText,
        status: "draft",
        createdBy: user.id,
        createdByName: user.displayName || user.username,
      });
      res.json(note);
    } catch (error) {
      console.error("Error creating patch note:", error);
      res.status(500).json({ error: "Failed to create patch note" });
    }
  });

  app.post('/api/patch-notes/:id/ai-rewrite', requireStaff, async (req, res) => {
    try {
      const note = await storage.getPatchNote(req.params.id);
      if (!note) return res.status(404).json({ error: "Patch note not found" });

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a patch notes writer for a gaming service platform. Rewrite the following raw update notes into polished, grinder-friendly patch notes. Use clear headings and bullet points. Keep it concise, professional yet friendly. Focus on what matters to grinders (service providers). Format with markdown."
          },
          {
            role: "user",
            content: `Title: ${note.title}\n\nRaw Notes:\n${note.rawText}`
          }
        ],
        max_tokens: 1500,
      });

      const polishedText = completion.choices[0]?.message?.content || note.rawText;
      const updated = await storage.updatePatchNote(note.id, { polishedText });
      res.json(updated);
    } catch (error) {
      console.error("Error AI rewriting patch note:", error);
      res.status(500).json({ error: "Failed to AI rewrite patch note" });
    }
  });

  app.patch('/api/patch-notes/:id', requireStaff, async (req, res) => {
    try {
      const { title, rawText, polishedText, status } = req.body;
      const data: any = {};
      if (title !== undefined) data.title = title;
      if (rawText !== undefined) data.rawText = rawText;
      if (polishedText !== undefined) data.polishedText = polishedText;
      if (status !== undefined) {
        data.status = status;
        if (status === "published") data.publishedAt = new Date();
      }
      const updated = await storage.updatePatchNote(req.params.id, data);
      if (!updated) return res.status(404).json({ error: "Patch note not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating patch note:", error);
      res.status(500).json({ error: "Failed to update patch note" });
    }
  });

  app.delete('/api/patch-notes/:id', requireStaff, async (req, res) => {
    try {
      await storage.deletePatchNote(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting patch note:", error);
      res.status(500).json({ error: "Failed to delete patch note" });
    }
  });

  // ===== CUSTOMER REVIEWS =====
  app.get('/api/reviews', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const grinderId = req.query.grinderId as string | undefined;
      const status = req.query.status as string | undefined;
      if (user.role === "grinder") {
        const reviews = await storage.getCustomerReviews(user.grinderId, undefined);
        return res.json(reviews);
      }
      const reviews = await storage.getCustomerReviews(grinderId, status);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.post('/api/reviews', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const { grinderId, orderId, rating, title, body, proofLinks, proofNotes } = req.body;
      if (!grinderId || !rating || !title || !body) {
        return res.status(400).json({ error: "Grinder ID, rating, title, and body are required" });
      }
      if (rating < 1 || rating > 5) return res.status(400).json({ error: "Rating must be 1-5" });

      const id = `REV-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const review = await storage.createCustomerReview({
        id,
        grinderId,
        orderId: orderId || null,
        reviewerId: user.id,
        reviewerName: user.displayName || user.username,
        reviewerRole: user.role,
        rating,
        title,
        body,
        proofLinks: proofLinks || [],
        proofNotes: proofNotes || null,
        status: "pending",
      });

      await storage.createNotification({
        id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: "New Review Submitted",
        body: `A new review has been submitted for review.`,
        type: "info",
        roleScope: "staff",
        userId: null,
        readBy: [],
      });

      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  app.patch('/api/reviews/:id', requireStaff, async (req, res) => {
    try {
      const user = (req as any).user;
      const { status, decisionNote } = req.body;
      if (!status) return res.status(400).json({ error: "Status required" });

      const review = await storage.getCustomerReview(req.params.id);
      if (!review) return res.status(404).json({ error: "Review not found" });

      const updated = await storage.updateCustomerReview(req.params.id, {
        status,
        decisionBy: user.id,
        decisionByName: user.displayName || user.username,
        decisionNote: decisionNote || null,
        decisionAt: new Date(),
      });
      res.json(updated);
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(500).json({ error: "Failed to update review" });
    }
  });

  // ===== ORDER CLAIM REQUESTS =====
  app.get('/api/order-claims', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const grinderId = req.query.grinderId as string | undefined;
      const status = req.query.status as string | undefined;
      if (user.role === "grinder") {
        const claims = await storage.getOrderClaimRequests(user.grinderId, status);
        return res.json(claims);
      }
      const claims = await storage.getOrderClaimRequests(grinderId, status);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching order claims:", error);
      res.status(500).json({ error: "Failed to fetch order claims" });
    }
  });

  app.post('/api/order-claims', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user.grinderId) return res.status(403).json({ error: "Only grinders can submit repair requests" });

      const { repairType, orderId, ticketName, serviceId, proofLinks, proofNotes, dueDate, startDateTime, completedDateTime, grinderAmount, payoutPlatform, payoutDetails, fixFields } = req.body;
      const validTypes = ["fix_order", "claim_missing", "add_completed"];
      if (!repairType || !validTypes.includes(repairType)) return res.status(400).json({ error: "Invalid repair type" });

      if (repairType === "fix_order") {
        if (!orderId) return res.status(400).json({ error: "Order ID is required for fix requests" });
        const order = await storage.getOrder(orderId);
        if (!order) return res.status(404).json({ error: "Order not found" });
        if (order.assignedGrinderId !== user.grinderId) return res.status(403).json({ error: "You can only fix orders assigned to you" });
        if (!fixFields) return res.status(400).json({ error: "Please specify what needs to be fixed" });
        let parsedFix: any = {};
        try { parsedFix = JSON.parse(fixFields); } catch { return res.status(400).json({ error: "Invalid fix fields format" }); }
        if (!parsedFix.description || !parsedFix.description.trim()) return res.status(400).json({ error: "Please describe what needs to be fixed" });
        const existing = await storage.getOrderClaimRequests(user.grinderId, "pending");
        const alreadyPending = existing.find(c => c.orderId === orderId && (c as any).repairType === "fix_order");
        if (alreadyPending) return res.status(400).json({ error: "You already have a pending fix request for this order" });
      }

      if (repairType === "claim_missing" || repairType === "add_completed") {
        if (!ticketName || !ticketName.trim()) return res.status(400).json({ error: "Ticket name is required" });
        if (repairType === "add_completed" && !completedDateTime) return res.status(400).json({ error: "Completed date is required for completed order submissions" });
        if (orderId) {
          const order = await storage.getOrder(orderId);
          if (!order) return res.status(404).json({ error: "Order not found" });
          const existing = await storage.getOrderClaimRequests(user.grinderId, "pending");
          const alreadyClaimed = existing.find(c => c.orderId === orderId);
          if (alreadyClaimed) return res.status(400).json({ error: "You already have a pending request for this order" });
        }
      }

      const id = `RPR-${Date.now().toString(36)}`;
      const claim = await storage.createOrderClaimRequest({
        id,
        grinderId: user.grinderId,
        repairType,
        orderId: orderId || null,
        ticketName: (ticketName || "").trim() || (repairType === "fix_order" ? `fix-${orderId}` : ""),
        serviceId: serviceId || null,
        proofLinks: proofLinks || [],
        proofNotes: proofNotes || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        startDateTime: startDateTime ? new Date(startDateTime) : null,
        completedDateTime: completedDateTime ? new Date(completedDateTime) : null,
        grinderAmount: grinderAmount || null,
        payoutPlatform: payoutPlatform || null,
        payoutDetails: payoutDetails || null,
        fixFields: fixFields || null,
        status: "pending",
      });

      const typeLabels: Record<string, string> = { fix_order: "Fix Order", claim_missing: "Claim Missing Order", add_completed: "Add Completed Order" };
      const orderLabel = orderId ? orderId : `ticket "${(ticketName || "").trim()}"`;
      await storage.createNotification({
        id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: "New Order Repair Request",
        body: `${typeLabels[repairType]}: A grinder has submitted a repair request for ${orderLabel}.`,
        type: "info",
        roleScope: "staff",
        userId: null,
        readBy: [],
      });

      res.json(claim);
    } catch (error) {
      console.error("Error creating grind repair:", error);
      res.status(500).json({ error: "Failed to create repair request" });
    }
  });

  app.post('/api/order-claims/staff', requireStaff, async (req, res) => {
    try {
      const user = (req as any).user;
      const { repairType, grinderId, ticketName, serviceId, proofNotes, completedDateTime, startDateTime, dueDate, payoutDate, grinderAmount, customerPrice, platform, gamertag } = req.body;
      const validTypes = ["claim_missing", "add_completed"];
      if (!repairType || !validTypes.includes(repairType)) return res.status(400).json({ error: "Invalid repair type" });
      if (!grinderId) return res.status(400).json({ error: "Grinder is required" });
      const grinder = await storage.getGrinder(grinderId);
      if (!grinder) return res.status(404).json({ error: "Grinder not found" });
      if (repairType === "add_completed" && !completedDateTime) return res.status(400).json({ error: "Completed date is required" });

      const id = `RPR-${Date.now().toString(36)}`;
      const claim = await storage.createOrderClaimRequest({
        id,
        grinderId,
        repairType,
        orderId: null,
        ticketName: (ticketName || "").trim() || `staff-${repairType}-${Date.now()}`,
        serviceId: serviceId || null,
        proofLinks: [],
        proofNotes: proofNotes || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        startDateTime: startDateTime ? new Date(startDateTime) : null,
        completedDateTime: completedDateTime ? new Date(completedDateTime) : null,
        grinderAmount: grinderAmount || null,
        payoutPlatform: null,
        payoutDetails: null,
        fixFields: JSON.stringify({ customerPrice, platform, gamertag, payoutDate }),
        status: "pending",
      });

      await storage.createAuditLog({
        id: `AL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        userId: user.id,
        userName: user.displayName || user.discordUsername || "Staff",
        action: "staff_repair_request",
        entityType: "order_claim",
        entityId: id,
        details: `Staff created ${repairType} repair for grinder ${grinder.name}`,
      });

      res.json(claim);
    } catch (error) {
      console.error("Error creating staff repair:", error);
      res.status(500).json({ error: "Failed to create repair request" });
    }
  });

  app.patch('/api/order-claims/:id', requireStaff, async (req, res) => {
    try {
      const user = (req as any).user;
      const { status, decisionNote, customerPrice, platform, gamertag, serviceId: staffServiceId } = req.body;
      if (!status) return res.status(400).json({ error: "Status required" });

      const claim = await storage.getOrderClaimRequest(req.params.id);
      if (!claim) return res.status(404).json({ error: "Claim not found" });

      if (status === "approved") {
        const repairType = claim.repairType || "claim_missing";

        if (repairType === "fix_order") {
          const orderId = claim.orderId;
          if (!orderId) return res.status(400).json({ error: "Fix request has no order ID" });
          const order = await storage.getOrder(orderId);
          if (!order) return res.status(404).json({ error: "Order not found" });

          let fixData: Record<string, any> = {};
          try { fixData = JSON.parse(claim.fixFields || "{}"); } catch { fixData = {}; }

          const orderUpdate: any = {};
          if (fixData.serviceId) orderUpdate.serviceId = fixData.serviceId;
          if (fixData.dueDate) orderUpdate.orderDueDate = new Date(fixData.dueDate);
          if (fixData.customerPrice) orderUpdate.customerPrice = String(fixData.customerPrice);
          if (fixData.platform) orderUpdate.platform = fixData.platform;
          if (fixData.gamertag) orderUpdate.gamertag = fixData.gamertag;
          if (customerPrice) orderUpdate.customerPrice = String(customerPrice);
          if (platform) orderUpdate.platform = platform;
          if (gamertag) orderUpdate.gamertag = gamertag;
          if (staffServiceId) orderUpdate.serviceId = staffServiceId;

          if (Object.keys(orderUpdate).length > 0) {
            await storage.updateOrder(orderId, orderUpdate);
          }

          const assignments = (await storage.getAssignments()).filter(a => a.orderId === orderId && a.grinderId === claim.grinderId);
          if (assignments.length > 0) {
            const assignment = assignments[0];
            const assignUpdate: any = {};
            const updatedOrder = await storage.getOrder(orderId);
            if (fixData.grinderAmount || claim.grinderAmount) {
              const newGrinderPay = fixData.grinderAmount || claim.grinderAmount;
              assignUpdate.grinderEarnings = String(newGrinderPay);
              const orderPriceNum = updatedOrder?.customerPrice ? parseFloat(updatedOrder.customerPrice) : 0;
              const grinderPayNum = parseFloat(newGrinderPay) || 0;
              const priorOrigPay = Number(assignment.originalGrinderPay || 0);
              const totalGrinderCost = priorOrigPay + grinderPayNum;
              const profit = orderPriceNum - totalGrinderCost;
              assignUpdate.companyProfit = String(profit.toFixed(2));
              assignUpdate.margin = String(profit.toFixed(2));
              assignUpdate.marginPct = orderPriceNum > 0 ? String(((profit / orderPriceNum) * 100).toFixed(1)) : "0";
              if (updatedOrder) {
                await storage.updateOrder(orderId, { companyProfit: String(profit.toFixed(2)) });
              }
            }
            if (fixData.dueDate) assignUpdate.dueDateTime = new Date(fixData.dueDate);
            if (fixData.startDateTime) assignUpdate.assignedDateTime = new Date(fixData.startDateTime);
            if (Object.keys(assignUpdate).length > 0) {
              await storage.updateAssignment(assignment.id, assignUpdate);
            }
          }

          const { recalcGrinderStats } = await import("./recalcStats");
          await recalcGrinderStats(claim.grinderId);

          await storage.createAuditLog({
            id: `AL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            action: "grind_repair_approved",
            performedBy: user.id,
            performedByName: user.displayName || user.username,
            entityType: "grind_repair",
            entityId: claim.id,
            details: `Approved fix order repair for order ${orderId} by grinder ${claim.grinderId}. Fields updated: ${Object.keys(fixData).join(", ")}`,
          });
        } else {
          let resolvedOrderId = claim.orderId;
          const resolvedServiceId = staffServiceId || claim.serviceId;
          const isAddCompleted = repairType === "add_completed";

          if (!resolvedOrderId) {
            if (!resolvedServiceId) return res.status(400).json({ error: "Service is required to approve a repair without an order ID" });
            if (!customerPrice) return res.status(400).json({ error: "Customer price is required to approve a repair without an order ID" });

            const newOrderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
            const orderDueDate = claim.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const isCompleted = isAddCompleted || !!claim.completedDateTime;

            await storage.createOrder({
              id: newOrderId,
              serviceId: resolvedServiceId,
              customerPrice: String(customerPrice),
              platform: platform || null,
              gamertag: gamertag || null,
              orderDueDate,
              status: isCompleted ? "Completed" : "In Progress",
              assignedGrinderId: claim.grinderId,
              isManual: true,
              complexity: 1,
              isRush: false,
              isEmergency: false,
              completedAt: isCompleted ? (claim.completedDateTime || new Date()) : null,
              skipDailyCheckup: true,
            });

            resolvedOrderId = newOrderId;
            await storage.updateOrderClaimRequest(req.params.id, { orderId: newOrderId });
          } else {
            const updateData: any = { assignedGrinderId: claim.grinderId, skipDailyCheckup: true };
            if (customerPrice) updateData.customerPrice = String(customerPrice);
            if (platform) updateData.platform = platform;
            if (gamertag) updateData.gamertag = gamertag;
            if (resolvedServiceId) updateData.serviceId = resolvedServiceId;
            if (isAddCompleted || claim.completedDateTime) {
              updateData.status = "Completed";
              updateData.completedAt = claim.completedDateTime || new Date();
            } else {
              updateData.status = "In Progress";
            }
            await storage.updateOrder(resolvedOrderId, updateData);
          }

          let existingAssignments = (await storage.getAssignments()).filter(a => a.orderId === resolvedOrderId);
          const order = await storage.getOrder(resolvedOrderId);
          const grinderPay = claim.grinderAmount || "0";
          const orderPriceNum = order?.customerPrice ? parseFloat(order.customerPrice) : 0;
          const grinderPayNum = parseFloat(grinderPay) || 0;
          const isCompleted = isAddCompleted || !!claim.completedDateTime;

          const existingOrigPay = existingAssignments.length > 0 ? Number(existingAssignments[0].originalGrinderPay || 0) : 0;
          const totalGrinderCost = existingOrigPay + grinderPayNum;
          const profit = orderPriceNum - totalGrinderCost;
          const marginPct = orderPriceNum > 0 ? (profit / orderPriceNum) * 100 : 0;

          if (existingAssignments.length === 0) {
            const newAssignmentId = `A-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
            await storage.createAssignment({
              id: newAssignmentId,
              orderId: resolvedOrderId,
              grinderId: claim.grinderId,
              status: isCompleted ? "Completed" : "Active",
              grinderEarnings: grinderPay,
              orderPrice: order?.customerPrice || String(customerPrice || "0"),
              companyProfit: String(profit.toFixed(2)),
              margin: String(profit.toFixed(2)),
              marginPct: String(marginPct.toFixed(1)),
              dueDateTime: claim.dueDate || order?.orderDueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              assignedDateTime: claim.startDateTime || new Date(),
              deliveredDateTime: isCompleted ? (claim.completedDateTime || new Date()) : null,
              isOnTime: claim.completedDateTime && claim.dueDate
                ? new Date(claim.completedDateTime) <= new Date(claim.dueDate)
                : null,
            });
            existingAssignments = [{ id: newAssignmentId } as any];
          } else {
            const assignment = existingAssignments[0];
            const assignUpdate: any = {
              grinderId: claim.grinderId,
              status: isCompleted ? "Completed" : "Active",
              grinderEarnings: grinderPay,
              orderPrice: order?.customerPrice || String(customerPrice || "0"),
              companyProfit: String(profit.toFixed(2)),
              margin: String(profit.toFixed(2)),
              marginPct: String(marginPct.toFixed(1)),
            };
            if (isCompleted) {
              assignUpdate.deliveredDateTime = claim.completedDateTime || new Date();
              assignUpdate.isOnTime = claim.completedDateTime && claim.dueDate
                ? new Date(claim.completedDateTime) <= new Date(claim.dueDate)
                : null;
            }
            if (claim.startDateTime) assignUpdate.assignedDateTime = claim.startDateTime;
            if (claim.dueDate) assignUpdate.dueDateTime = claim.dueDate;
            await storage.updateAssignment(assignment.id, assignUpdate);
          }

          if (order && grinderPayNum > 0) {
            await storage.updateOrder(resolvedOrderId, { companyProfit: String(profit.toFixed(2)) });
          }

          if (claim.grinderAmount && (isAddCompleted || claim.completedDateTime)) {
            const existingPayouts = (await storage.getPayoutRequests(claim.grinderId))
              .filter(p => p.orderId === resolvedOrderId);
            if (existingPayouts.length === 0) {
              let repairFixData: Record<string, any> = {};
              try { repairFixData = JSON.parse(claim.fixFields || "{}"); } catch { repairFixData = {}; }
              const payoutReq: any = {
                id: `PR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                assignmentId: existingAssignments[0].id,
                orderId: resolvedOrderId,
                grinderId: claim.grinderId,
                amount: claim.grinderAmount,
                payoutPlatform: claim.payoutPlatform || null,
                payoutDetails: claim.payoutDetails || null,
                status: "Pending",
                completionProofUrl: "grind-repair",
              };
              if (repairFixData.payoutDate) {
                payoutReq.paidAt = new Date(repairFixData.payoutDate + "T12:00:00");
                payoutReq.status = "Paid";
              }
              await storage.createPayoutRequest(payoutReq);
            }
          }

          await storage.createOrderUpdate({
            id: `OU-${Date.now().toString(36)}`,
            assignmentId: existingAssignments[0].id,
            orderId: resolvedOrderId,
            grinderId: claim.grinderId,
            updateType: "system",
            message: repairType === "add_completed"
              ? `Completed order backlogged via repair request. Earnings: $${parseFloat(claim.grinderAmount || "0").toFixed(2)}`
              : `Missing order claimed via repair request and linked to profile.`,
          });

          const repairGrinder = await storage.getGrinder(claim.grinderId);
          if (repairGrinder?.discordUserId) {
            await storage.createNotification({
              id: `NOTIF-${Date.now().toString(36)}`,
              title: repairType === "add_completed" ? "Completed Order Backlogged" : "Missing Order Claimed",
              body: repairType === "add_completed"
                ? `A completed order has been backlogged to your profile. Order: ${resolvedOrderId}. Earnings: $${parseFloat(claim.grinderAmount || "0").toFixed(2)}. Your stats have been updated.`
                : `A missing order (${resolvedOrderId}) has been claimed and linked to your profile.`,
              type: "success",
              roleScope: null,
              userId: repairGrinder.discordUserId,
              readBy: [],
            });
          }

          const { recalcGrinderStats } = await import("./recalcStats");
          await recalcGrinderStats(claim.grinderId);

          const typeLabel = repairType === "add_completed" ? "add completed order" : "claim missing order";
          await storage.createAuditLog({
            id: `AL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            action: "grind_repair_approved",
            performedBy: user.id,
            performedByName: user.displayName || user.username,
            entityType: "grind_repair",
            entityId: claim.id,
            details: `Approved ${typeLabel} repair for order ${resolvedOrderId} by grinder ${claim.grinderId}. ${!claim.orderId ? "New order created from repair." : ""}`,
          });
        }
      }

      const updated = await storage.updateOrderClaimRequest(req.params.id, {
        status,
        decidedBy: user.id,
        decidedByName: user.displayName || user.username,
        decisionNote: decisionNote || null,
        decidedAt: new Date(),
      });
      res.json(updated);
    } catch (error) {
      console.error("Error updating order claim:", error);
      res.status(500).json({ error: "Failed to update order claim" });
    }
  });

  // ===== DELETION REQUESTS =====

  app.get('/api/deletion-requests', requireStaff, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const requests = await storage.getDeletionRequests(status);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deletion requests" });
    }
  });

  app.post('/api/deletion-requests', requireStaff, async (req, res) => {
    try {
      const { entityType, entityId, entityLabel, reason } = req.body;
      if (!entityType || !entityId || !reason) {
        return res.status(400).json({ error: "entityType, entityId, and reason are required" });
      }

      const existing = await storage.getDeletionRequests("Pending");
      const duplicate = existing.find(r => r.entityType === entityType && r.entityId === entityId);
      if (duplicate) {
        return res.status(400).json({ error: "A pending deletion request already exists for this item" });
      }

      const id = `DR-${Date.now().toString(36)}`;
      const request = await storage.createDeletionRequest({
        id,
        entityType,
        entityId,
        entityLabel: entityLabel || entityId,
        reason,
        requestedBy: (req as any).userId,
        requestedByName: getActorName(req),
        status: "Pending",
        reviewedBy: null,
        reviewedByName: null,
        reviewedAt: null,
        denyReason: null,
      });

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "deletion_request",
        entityId: id,
        action: "deletion_requested",
        actor: getActorName(req),
        details: JSON.stringify({ entityType, entityId, entityLabel, reason }),
      });

      res.json(request);
    } catch (error) {
      console.error("Error creating deletion request:", error);
      res.status(500).json({ error: "Failed to create deletion request" });
    }
  });

  app.patch('/api/deletion-requests/:id/approve', requireOwner, async (req, res) => {
    try {
      const request = (await storage.getDeletionRequests()).find(r => r.id === req.params.id);
      if (!request) return res.status(404).json({ error: "Deletion request not found" });
      if (request.status !== "Pending") return res.status(400).json({ error: "Request already processed" });

      let deleted = false;
      try {
        if (request.entityType === "order") {
          deleted = await storage.deleteOrder(request.entityId);
        } else if (request.entityType === "bid") {
          deleted = await storage.deleteBid(request.entityId);
        } else if (request.entityType === "grinder") {
          deleted = await storage.deleteGrinder(request.entityId);
        } else if (request.entityType === "assignment") {
          deleted = await storage.deleteAssignment(request.entityId);
        }
      } catch (err: any) {
        return res.status(400).json({ error: `Failed to delete: ${err.message}` });
      }

      if (!deleted) {
        return res.status(404).json({ error: "Entity not found or already deleted" });
      }

      const updated = await storage.updateDeletionRequest(req.params.id, {
        status: "Approved",
        reviewedBy: (req as any).userId,
        reviewedByName: getActorName(req),
        reviewedAt: new Date(),
      });

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "deletion_request",
        entityId: req.params.id,
        action: "deletion_approved",
        actor: getActorName(req),
        details: JSON.stringify({ entityType: request.entityType, entityId: request.entityId, entityLabel: request.entityLabel }),
      });

      res.json(updated);
    } catch (error) {
      console.error("Error approving deletion request:", error);
      res.status(500).json({ error: "Failed to approve deletion request" });
    }
  });

  app.patch('/api/deletion-requests/:id/deny', requireOwner, async (req, res) => {
    try {
      const request = (await storage.getDeletionRequests()).find(r => r.id === req.params.id);
      if (!request) return res.status(404).json({ error: "Deletion request not found" });
      if (request.status !== "Pending") return res.status(400).json({ error: "Request already processed" });

      const updated = await storage.updateDeletionRequest(req.params.id, {
        status: "Denied",
        reviewedBy: (req as any).userId,
        reviewedByName: getActorName(req),
        reviewedAt: new Date(),
        denyReason: req.body.reason || null,
      });

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "deletion_request",
        entityId: req.params.id,
        action: "deletion_denied",
        actor: getActorName(req),
        details: JSON.stringify({ entityType: request.entityType, entityId: request.entityId, denyReason: req.body.reason }),
      });

      res.json(updated);
    } catch (error) {
      console.error("Error denying deletion request:", error);
      res.status(500).json({ error: "Failed to deny deletion request" });
    }
  });

  // ===== REVIEW ACCESS CODES (Password-Protected Customer Reviews) =====

  app.post('/api/review-access/generate', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const { orderId } = req.body;

      let grinderId: string | undefined;
      if (req.body.grinderId) {
        grinderId = req.body.grinderId;
      } else {
        const userId = (req as any).userId;
        const allGrinders = await storage.getGrinders();
        const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
        if (myGrinder) grinderId = myGrinder.id;
      }

      if (!grinderId) {
        return res.status(400).json({ error: "Grinder ID is required" });
      }

      const grinder = await storage.getGrinder(grinderId);
      if (!grinder) return res.status(404).json({ error: "Grinder not found" });

      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let accessCode = "";
      for (let i = 0; i < 8; i++) {
        accessCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const id = `RAC-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const code = await storage.createReviewAccessCode({
        id,
        orderId: orderId || null,
        grinderId,
        accessCode,
        status: "unused",
        sessionToken: null,
        customerName: null,
        expiresAt,
      });

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "review_access",
        entityId: id,
        action: "access_code_generated",
        actor: getActorName(req),
        details: JSON.stringify({ orderId, grinderId, expiresAt: expiresAt.toISOString() }),
      });

      res.json(code);
    } catch (error) {
      console.error("Error generating review access code:", error);
      res.status(500).json({ error: "Failed to generate access code" });
    }
  });

  app.get('/api/review-access/codes', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      let grinderId = req.query.grinderId as string | undefined;
      if (!grinderId && (user.role === "grinder" || !grinderId)) {
        const userId = (req as any).userId;
        const allGrinders = await storage.getGrinders();
        const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
        if (myGrinder) grinderId = myGrinder.id;
      }
      const codes = await storage.getReviewAccessCodes(grinderId);
      res.json(codes);
    } catch (error) {
      console.error("Error fetching access codes:", error);
      res.status(500).json({ error: "Failed to fetch access codes" });
    }
  });

  app.patch('/api/review-access/:id/approve', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const code = await storage.getReviewAccessCode(req.params.id);
      if (!code) return res.status(404).json({ error: "Access request not found" });

      if (user.role === "grinder") {
        const myGrinder = await storage.getGrinderByDiscordId(user.id);
        if (!myGrinder || code.grinderId !== myGrinder.id) {
          return res.status(403).json({ error: "Not your access request" });
        }
      }

      const sessionToken = `ST-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;

      const updated = await storage.updateReviewAccessCode(req.params.id, {
        status: "approved",
        sessionToken,
        approvedBy: user.id,
        approvedByName: user.discordUsername || user.firstName || user.id,
        approvedAt: new Date(),
      });

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "review_access",
        entityId: req.params.id,
        action: "access_approved",
        actor: getActorName(req),
        details: JSON.stringify({ customerName: code.customerName, grinderId: code.grinderId }),
      });

      res.json(updated);
    } catch (error) {
      console.error("Error approving access:", error);
      res.status(500).json({ error: "Failed to approve access" });
    }
  });

  app.patch('/api/review-access/:id/deny', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const code = await storage.getReviewAccessCode(req.params.id);
      if (!code) return res.status(404).json({ error: "Access request not found" });

      if (user.role === "grinder") {
        const myGrinder = await storage.getGrinderByDiscordId(user.id);
        if (!myGrinder || code.grinderId !== myGrinder.id) {
          return res.status(403).json({ error: "Not your access request" });
        }
      }

      const updated = await storage.updateReviewAccessCode(req.params.id, {
        status: "denied",
        deniedBy: user.id,
        deniedByName: user.displayName || user.username,
        deniedAt: new Date(),
      });

      res.json(updated);
    } catch (error) {
      console.error("Error denying access:", error);
      res.status(500).json({ error: "Failed to deny access" });
    }
  });

  // ===== PUBLIC CUSTOMER REVIEW ENDPOINTS (No Auth Required) =====

  app.post('/api/public/review-access/verify', async (req, res) => {
    try {
      const { accessCode, customerName } = req.body;
      if (!accessCode || !customerName) {
        return res.status(400).json({ error: "Access code and your name are required" });
      }

      const code = await storage.getReviewAccessCodeByCode(accessCode.toUpperCase().trim());
      if (!code) return res.status(404).json({ error: "Invalid access code" });

      if (new Date() > new Date(code.expiresAt)) {
        return res.status(410).json({ error: "This access code has expired" });
      }

      if (code.status === "denied") {
        return res.status(403).json({ error: "This access request was denied" });
      }

      if (code.status === "approved" && code.sessionToken) {
        return res.json({ status: "approved", sessionToken: code.sessionToken, message: "Access already approved" });
      }

      if (code.status === "pending_approval") {
        return res.json({ status: "pending_approval", accessId: code.id, message: "Your access code has been verified. Please wait for approval before submitting your review." });
      }

      if (code.status === "used") {
        return res.status(410).json({ error: "This access code has already been used to submit a review" });
      }

      await storage.updateReviewAccessCode(code.id, {
        status: "pending_approval",
        customerName: customerName.trim(),
        usedAt: new Date(),
      });

      const grinder = await storage.getGrinder(code.grinderId);

      await storage.createNotification({
        id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: "Customer Review Access Request",
        body: `${customerName.trim()} entered a review access code and is waiting for approval.`,
        type: "info",
        roleScope: "staff",
        userId: null,
        readBy: [],
      });

      res.json({ 
        status: "pending_approval", 
        accessId: code.id,
        message: "Your access code has been verified. Please wait for approval before submitting your review." 
      });
    } catch (error) {
      console.error("Error verifying access code:", error);
      res.status(500).json({ error: "Failed to verify access code" });
    }
  });

  app.get('/api/public/review-access/:accessId/status', async (req, res) => {
    try {
      const code = await storage.getReviewAccessCode(req.params.accessId);
      if (!code) return res.status(404).json({ error: "Access request not found" });

      if (code.status === "approved" && code.sessionToken) {
        return res.json({ status: "approved", sessionToken: code.sessionToken });
      }

      res.json({ status: code.status });
    } catch (error) {
      console.error("Error checking access status:", error);
      res.status(500).json({ error: "Failed to check status" });
    }
  });

  app.post('/api/public/review/submit', async (req, res) => {
    try {
      const { sessionToken, rating, title, body, proofLinks, proofNotes } = req.body;
      if (!sessionToken) return res.status(401).json({ error: "Session token is required" });
      if (!rating || !title || !body) return res.status(400).json({ error: "Rating, title, and body are required" });
      if (rating < 1 || rating > 5) return res.status(400).json({ error: "Rating must be 1-5" });

      const code = await storage.getReviewAccessCodeBySession(sessionToken);
      if (!code) return res.status(401).json({ error: "Invalid session token" });

      if (code.status !== "approved") {
        return res.status(403).json({ error: "Access not approved" });
      }

      if (new Date() > new Date(code.expiresAt)) {
        return res.status(410).json({ error: "This access code has expired" });
      }

      const reviewId = `REV-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const review = await storage.createCustomerReview({
        id: reviewId,
        grinderId: code.grinderId,
        orderId: code.orderId || null,
        reviewerId: `customer-${code.id}`,
        reviewerName: code.customerName || "Customer",
        reviewerRole: "customer",
        rating,
        title: title.trim(),
        body: body.trim(),
        proofLinks: proofLinks || [],
        proofNotes: proofNotes || null,
        status: "pending",
      });

      await storage.updateReviewAccessCode(code.id, { status: "used" });

      await storage.createNotification({
        id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: "New Customer Review Submitted",
        body: `${code.customerName || "A customer"} submitted a review. Awaiting staff approval.`,
        type: "info",
        roleScope: "staff",
        userId: null,
        readBy: [],
      });

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "customer_review",
        entityId: reviewId,
        action: "customer_review_submitted",
        actor: code.customerName || "Customer",
        details: JSON.stringify({ grinderId: code.grinderId, orderId: code.orderId, rating, accessCodeId: code.id }),
      });

      res.json({ success: true, message: "Review submitted successfully! It will be reviewed by staff." });
    } catch (error) {
      console.error("Error submitting review:", error);
      res.status(500).json({ error: "Failed to submit review" });
    }
  });

  app.get('/api/discord/channels/search', requireStaff, async (req, res) => {
    try {
      const query = (req.query.q as string || "").toLowerCase().trim();
      if (!query) return res.json([]);

      const { getDiscordBotClient } = await import("./discord/bot");
      const client = getDiscordBotClient();
      if (!client) return res.status(503).json({ error: "Discord bot is not connected" });

      const results: { id: string; name: string; categoryName?: string }[] = [];
      for (const [, guild] of client.guilds.cache) {
        const channels = guild.channels.cache.filter(
          ch => ch.isTextBased() && ch.name.toLowerCase().includes(query)
        );
        for (const [, ch] of channels) {
          results.push({
            id: ch.id,
            name: ch.name,
            categoryName: (ch as any).parent?.name || undefined,
          });
          if (results.length >= 25) break;
        }
        if (results.length >= 25) break;
      }
      res.json(results);
    } catch (error) {
      console.error("Error searching Discord channels:", error);
      res.status(500).json({ error: "Failed to search channels" });
    }
  });

  app.get("/api/daily-checkups/config", requireStaff, async (req, res) => {
    try {
      const config = await storage.getQueueConfig();
      const orders = await storage.getOrders();
      const skippedOrders = orders.filter((o: any) => o.skipDailyCheckup).map((o: any) => o.id);
      res.json({ enabled: config?.dailyCheckupsEnabled !== false, skippedOrders });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily checkup config" });
    }
  });

  app.patch("/api/daily-checkups/global", requireOwner, async (req, res) => {
    try {
      const { enabled } = req.body;
      if (typeof enabled !== "boolean") return res.status(400).json({ error: "enabled must be a boolean" });
      const config = await storage.getQueueConfig();
      if (!config) return res.status(404).json({ error: "Config not found" });
      await storage.upsertQueueConfig({ ...config, dailyCheckupsEnabled: enabled });
      res.json({ success: true, enabled });
    } catch (error) {
      res.status(500).json({ error: "Failed to update daily checkup config" });
    }
  });

  app.patch("/api/daily-checkups/order/:orderId", requireOwner, async (req, res) => {
    try {
      const { orderId } = req.params;
      const { skip } = req.body;
      if (typeof skip !== "boolean") return res.status(400).json({ error: "skip must be a boolean" });
      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ error: "Order not found" });
      await storage.updateOrder(orderId, { skipDailyCheckup: skip });
      res.json({ success: true, orderId, skip });
    } catch (error) {
      res.status(500).json({ error: "Failed to update order daily checkup" });
    }
  });

  app.patch("/api/config/mgt-bot", requireOwner, async (req, res) => {
    try {
      const { enabled } = req.body;
      if (typeof enabled !== "boolean") return res.status(400).json({ error: "enabled must be a boolean" });
      const config = await storage.getQueueConfig();
      if (!config) return res.status(404).json({ error: "Config not found" });
      await storage.upsertQueueConfig({ ...config, mgtBotEnabled: enabled });
      const actorName = getActorName(req);
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        action: enabled ? "mgt_bot_enabled" : "mgt_bot_disabled",
        entityType: "config",
        entityId: "mgt-bot",
        performedBy: (req.user as any)?.discordId || (req.user as any)?.id || "",
        performedByName: actorName,
        details: `MGT Bot data tracking ${enabled ? "enabled" : "disabled"} by ${actorName}`,
      });
      res.json({ success: true, enabled });
    } catch (error) {
      res.status(500).json({ error: "Failed to update MGT bot config" });
    }
  });

  app.get("/api/config/maintenance", isAuthenticated, async (req, res) => {
    try {
      const config = await storage.getQueueConfig();
      res.json({
        maintenanceMode: config?.maintenanceMode || false,
        maintenanceModeSetBy: config?.maintenanceModeSetBy || null,
        earlyAccessMode: config?.earlyAccessMode || false,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch maintenance config" });
    }
  });

  app.patch("/api/config/maintenance", requireOwner, async (req, res) => {
    try {
      const actorUsername = (req.user as any)?.discordUsername || (req.user as any)?.firstName || "";
      const actorDiscordId = (req.user as any)?.discordId || (req.user as any)?.id || "";
      if (actorUsername.toLowerCase() !== "imjustmar" && actorDiscordId !== "172526626888876032") {
        return res.status(403).json({ error: "Only imjustmar can toggle maintenance mode" });
      }
      const { enabled } = req.body;
      if (typeof enabled !== "boolean") return res.status(400).json({ error: "enabled must be a boolean" });
      const config = await storage.getQueueConfig();
      if (!config) return res.status(404).json({ error: "Config not found" });
      await storage.upsertQueueConfig({
        ...config,
        maintenanceMode: enabled,
        maintenanceModeSetBy: enabled ? actorUsername : null,
      });
      const actorName = getActorName(req);
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        action: enabled ? "maintenance_enabled" : "maintenance_disabled",
        entityType: "config",
        entityId: "maintenance",
        performedBy: (req.user as any)?.discordId || (req.user as any)?.id || "",
        performedByName: actorName,
        details: `Maintenance mode ${enabled ? "enabled" : "disabled"} by ${actorName}`,
      });
      res.json({ success: true, enabled });
    } catch (error) {
      res.status(500).json({ error: "Failed to update maintenance config" });
    }
  });

  app.patch("/api/config/early-access", requireOwner, async (req, res) => {
    try {
      const { enabled } = req.body;
      if (typeof enabled !== "boolean") return res.status(400).json({ error: "enabled must be a boolean" });
      const config = await storage.getQueueConfig();
      if (!config) return res.status(404).json({ error: "Config not found" });
      await storage.upsertQueueConfig({ ...config, earlyAccessMode: enabled });
      const actorName = getActorName(req);
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        action: enabled ? "early_access_enabled" : "early_access_disabled",
        entityType: "config",
        entityId: "early_access",
        performedBy: (req.user as any)?.discordId || (req.user as any)?.id || "",
        performedByName: actorName,
        details: `Early access mode ${enabled ? "enabled" : "disabled"} by ${actorName}`,
      });
      res.json({ success: true, enabled });
    } catch (error) {
      res.status(500).json({ error: "Failed to update early access config" });
    }
  });

  app.get("/api/site-alerts", isAuthenticated, async (req, res) => {
    try {
      const userRole = (req.user as any)?.role || "none";
      const discordId = (req.user as any)?.discordId || "";
      const odId = (req.user as any)?.id || "";
      const isStaffOrOwner = userRole === "staff" || userRole === "owner";

      const allAlerts = await db.select().from(siteAlerts).where(eq(siteAlerts.enabled, true)).orderBy(desc(siteAlerts.createdAt));

      const filtered = allAlerts.filter(a => {
        if (a.target === "all") return true;
        if (a.target === "staff" && isStaffOrOwner) return true;
        if (a.target === "grinders" && userRole === "grinder") return true;
        if (a.target === "user" && a.targetUserId && (a.targetUserId === discordId || a.targetUserId === odId)) return true;
        return false;
      });

      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch site alerts" });
    }
  });

  app.get("/api/site-alerts/all", requireOwner, async (req, res) => {
    try {
      const allAlerts = await db.select().from(siteAlerts).orderBy(desc(siteAlerts.createdAt));
      res.json(allAlerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch site alerts" });
    }
  });

  app.post("/api/site-alerts", requireOwner, async (req, res) => {
    try {
      const { message, target, targetUserId, targetUserName } = req.body;
      if (!message?.trim()) return res.status(400).json({ error: "Message is required" });
      if (!["all", "staff", "grinders", "user"].includes(target)) return res.status(400).json({ error: "Invalid target" });
      if (target === "user" && !targetUserId) return res.status(400).json({ error: "Target user ID is required" });

      const actorName = (req.user as any)?.discordUsername || (req.user as any)?.firstName || "Owner";
      const actorId = (req.user as any)?.discordId || (req.user as any)?.id || "";

      const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await db.insert(siteAlerts).values({
        id,
        message: message.trim(),
        target,
        targetUserId: target === "user" ? targetUserId : null,
        targetUserName: target === "user" ? (targetUserName || null) : null,
        enabled: true,
        createdBy: actorId,
        createdByName: actorName,
      });

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        action: "site_alert_created",
        entityType: "site_alert",
        entityId: id,
        actor: actorName,
        details: `Site alert created: "${message.trim().slice(0, 80)}" → ${target}${target === "user" ? ` (${targetUserName || targetUserId})` : ""}`,
      });

      res.json({ success: true, id });
    } catch (error) {
      console.error("[site-alerts] create error:", error);
      res.status(500).json({ error: "Failed to create site alert" });
    }
  });

  app.patch("/api/site-alerts/:id", requireOwner, async (req, res) => {
    try {
      const { enabled, message } = req.body;
      const updates: any = {};
      if (typeof enabled === "boolean") updates.enabled = enabled;
      if (typeof message === "string" && message.trim()) updates.message = message.trim();

      await db.update(siteAlerts).set(updates).where(eq(siteAlerts.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update site alert" });
    }
  });

  app.delete("/api/site-alerts/:id", requireOwner, async (req, res) => {
    try {
      await db.delete(siteAlerts).where(eq(siteAlerts.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete site alert" });
    }
  });

  app.get("/api/staff/tasks", requireStaff, async (req, res) => {
    try {
      const discordId = (req.user as any)?.discordId || (req.user as any)?.id || "";
      const tasks = await storage.getStaffTasks(discordId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/staff/tasks/all", requireStaff, async (req, res) => {
    try {
      const tasks = await storage.getStaffTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/staff/tasks", requireStaff, async (req, res) => {
    try {
      const { title, description, assignedTo, priority, orderId } = req.body;
      if (!title || !assignedTo) {
        return res.status(400).json({ message: "Title and assignedTo are required" });
      }
      const assignerName = (req.user as any)?.firstName || (req.user as any)?.discordUsername || "Staff";
      const assignerId = (req.user as any)?.discordId || (req.user as any)?.id || "";
      const task = await storage.createStaffTask({
        id: `ST-${Date.now().toString(36)}`,
        title,
        description: description || null,
        assignedTo,
        assignedBy: assignerId,
        assignedByName: assignerName,
        priority: priority || "normal",
        status: "pending",
        orderId: orderId || null,
      });
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "staff_task",
        entityId: task.id,
        action: "created",
        actor: assignerName,
        details: JSON.stringify({ title, assignedTo, priority }),
      });
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch("/api/staff/tasks/:id/complete", requireStaff, async (req, res) => {
    try {
      const task = await storage.updateStaffTask(req.params.id, {
        status: "completed",
        completedAt: new Date(),
      });
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete task" });
    }
  });

  // ============================================
  // WALLET SYSTEM ROUTES
  // ============================================

  app.get("/api/wallets", requireStaff, async (req, res) => {
    try {
      if (isWalletBlocked(req)) return res.status(403).json({ message: "Access denied" });
      const wallets = await storage.getWallets();
      const isOwner = (req.user as any)?.role === "owner" && !isWalletRestricted(req);
      const actorId = (req.user as any)?.discordId || (req.user as any)?.id || "";
      if (isOwner) return res.json(wallets);
      const visible = wallets.filter(w => w.scope === "company" || w.ownerDiscordId === actorId || w.scope === "personal");
      const sanitized = visible.map(w => {
        if (w.scope === "company") return { ...w, accountIdentifier: null };
        if (w.scope === "personal" && w.ownerDiscordId !== actorId) return { ...w, accountIdentifier: null, balance: undefined };
        return w;
      });
      res.json(sanitized);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wallets" });
    }
  });

  app.post("/api/wallets", requireStaff, async (req, res) => {
    try {
      if (isWalletBlocked(req)) return res.status(403).json({ message: "Access denied" });
      const { name, type, accountIdentifier, startingBalance, notes, scope, ownerDiscordId, ownerName } = req.body;
      if (!name || !type) return res.status(400).json({ message: "Name and type are required" });
      const actorName = getActorName(req);
      const actorId = (req.user as any)?.discordId || (req.user as any)?.id || "";
      const isOwner = (req.user as any)?.role === "owner" && !isWalletRestricted(req);
      const walletScope = scope || (isOwner ? "company" : "personal");
      if (!isOwner && walletScope === "company") return res.status(403).json({ message: "Staff can only create personal wallets" });
      const id = `WAL-${Date.now().toString(36)}`;
      const balance = startingBalance || "0";
      const wallet = await storage.createWallet({
        id,
        name,
        type,
        scope: walletScope,
        ownerDiscordId: walletScope === "personal" ? (ownerDiscordId || actorId) : null,
        ownerName: walletScope === "personal" ? (ownerName || actorName) : null,
        accountIdentifier: accountIdentifier || null,
        balance,
        startingBalance: balance,
        notes: notes || null,
        isActive: true,
        createdBy: actorId,
        createdByName: actorName,
      });
      if (parseFloat(balance) > 0) {
        await storage.createWalletTransaction({
          id: `WTX-${Date.now().toString(36)}-init`,
          walletId: id,
          type: "deposit",
          amount: balance,
          balanceBefore: "0",
          balanceAfter: balance,
          category: "misc",
          description: "Starting balance",
          performedBy: actorId,
          performedByName: actorName,
          performedByRole: isOwner ? "owner" : "staff",
        });
      }
      res.status(201).json(wallet);
    } catch (error) {
      res.status(500).json({ message: "Failed to create wallet" });
    }
  });

  app.patch("/api/wallets/:id", requireStaff, async (req, res) => {
    try {
      if (isWalletBlocked(req)) return res.status(403).json({ message: "Access denied" });
      const wallet = await storage.getWallet(req.params.id);
      if (!wallet) return res.status(404).json({ message: "Wallet not found" });
      const isOwner = (req.user as any)?.role === "owner" && !isWalletRestricted(req);
      const actorId = (req.user as any)?.discordId || (req.user as any)?.id || "";
      if (!isOwner && wallet.ownerDiscordId !== actorId) return res.status(403).json({ message: "Cannot edit this wallet" });
      if (!isOwner && wallet.scope === "company") return res.status(403).json({ message: "Cannot edit company wallets" });
      const updates: any = { updatedAt: new Date() };
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.type !== undefined) updates.type = req.body.type;
      if (req.body.accountIdentifier !== undefined) updates.accountIdentifier = req.body.accountIdentifier;
      if (req.body.notes !== undefined) updates.notes = req.body.notes;
      if (isOwner) {
        if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
        if (req.body.startingBalance !== undefined) updates.startingBalance = req.body.startingBalance;
        if (req.body.scope !== undefined) updates.scope = req.body.scope;
        if (req.body.ownerDiscordId !== undefined) updates.ownerDiscordId = req.body.ownerDiscordId;
        if (req.body.ownerName !== undefined) updates.ownerName = req.body.ownerName;
      }
      const updated = await storage.updateWallet(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update wallet" });
    }
  });

  app.post("/api/wallets/:id/adjust", requireStaff, async (req, res) => {
    try {
      if (isWalletBlocked(req)) return res.status(403).json({ message: "Access denied" });
      const wallet = await storage.getWallet(req.params.id);
      if (!wallet) return res.status(404).json({ message: "Wallet not found" });
      const isOwner = (req.user as any)?.role === "owner" && !isWalletRestricted(req);
      const actorId = (req.user as any)?.discordId || (req.user as any)?.id || "";
      if (!isOwner) {
        if (wallet.scope === "company") return res.status(403).json({ message: "Staff cannot adjust company wallets" });
        if (wallet.ownerDiscordId !== actorId) return res.status(403).json({ message: "You can only adjust your own wallets" });
      }
      const { amount, type, description, category, relatedOrderId } = req.body;
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ message: "Invalid amount" });
      if (!type || !["deposit", "withdrawal"].includes(type)) return res.status(400).json({ message: "Type must be deposit or withdrawal" });
      const currentBalance = parseFloat(wallet.balance?.toString() || "0");
      const newBalance = type === "deposit" ? currentBalance + numAmount : currentBalance - numAmount;
      const actorName = getActorName(req);
      const txId = `WTX-${Date.now().toString(36)}`;
      await storage.createWalletTransaction({
        id: txId,
        walletId: wallet.id,
        type: type === "deposit" ? "deposit" : "withdrawal",
        amount: numAmount.toFixed(2),
        balanceBefore: currentBalance.toFixed(2),
        balanceAfter: newBalance.toFixed(2),
        category: category || "misc",
        description: description || (type === "deposit" ? "Manual deposit" : "Manual withdrawal"),
        relatedOrderId: relatedOrderId || null,
        performedBy: actorId,
        performedByName: actorName,
        performedByRole: isOwner ? "owner" : "staff",
      });
      const updated = await storage.updateWallet(wallet.id, { balance: newBalance.toFixed(2), updatedAt: new Date() });
      res.json({ wallet: updated, transaction: { id: txId } });
    } catch (error) {
      res.status(500).json({ message: "Failed to adjust wallet" });
    }
  });

  app.post("/api/wallets/transfer", requireStaff, async (req, res) => {
    try {
      if (isWalletBlocked(req)) return res.status(403).json({ message: "Access denied" });
      const { fromWalletId, toWalletId, amount, description, relatedOrderId, proofUrl, transferFee } = req.body;
      if (!fromWalletId || !toWalletId || fromWalletId === toWalletId) return res.status(400).json({ message: "Invalid wallet selection" });
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ message: "Invalid amount" });
      const numFee = parseFloat(transferFee || "0") || 0;
      const fromWallet = await storage.getWallet(fromWalletId);
      const toWallet = await storage.getWallet(toWalletId);
      if (!fromWallet || !toWallet) return res.status(404).json({ message: "Wallet not found" });
      const actorId = (req.user as any)?.discordId || (req.user as any)?.id || "";
      const actorName = getActorName(req);
      const isOwner = (req.user as any)?.role === "owner" && !isWalletRestricted(req);
      if (!isOwner) {
        if (fromWallet.ownerDiscordId !== actorId) return res.status(403).json({ message: "You can only transfer from your own wallet" });
        const toIsOwn = toWallet.ownerDiscordId === actorId;
        const toIsCompany = toWallet.scope === "company";
        const toIsStaffPersonal = toWallet.scope === "personal" && toWallet.ownerDiscordId && toWallet.ownerDiscordId !== actorId;
        if (!toIsOwn && !toIsCompany && !toIsStaffPersonal) return res.status(403).json({ message: "Staff can only transfer to own wallets, company wallets, or other staff wallets" });
      }
      const transferId = `TRF-${Date.now().toString(36)}`;
      const status = isOwner ? "completed" : "pending";
      await storage.createWalletTransfer({
        id: transferId,
        fromWalletId,
        toWalletId,
        amount: numAmount.toFixed(2),
        transferFee: numFee > 0 ? numFee.toFixed(2) : "0",
        description: description || null,
        relatedOrderId: relatedOrderId || null,
        proofUrl: proofUrl || null,
        performedBy: actorId,
        performedByName: actorName,
        status,
      });
      if (isOwner) {
        const fromBal = parseFloat(fromWallet.balance?.toString() || "0");
        const toBal = parseFloat(toWallet.balance?.toString() || "0");
        const totalDeducted = numAmount + numFee;
        const newFromBal = fromBal - totalDeducted;
        const amountReceived = numAmount;
        const newToBal = toBal + amountReceived;
        const ts = Date.now().toString(36);
        await storage.createWalletTransaction({
          id: `WTX-${ts}-out`,
          walletId: fromWalletId,
          type: "transfer_out",
          amount: totalDeducted.toFixed(2),
          balanceBefore: fromBal.toFixed(2),
          balanceAfter: newFromBal.toFixed(2),
          category: "transfer",
          description: `Transfer to ${toWallet.name}${numFee > 0 ? ` (fee: $${numFee.toFixed(2)})` : ''}${description ? ': ' + description : ''}`,
          relatedTransferId: transferId,
          relatedOrderId: relatedOrderId || null,
          performedBy: actorId,
          performedByName: actorName,
          performedByRole: "owner",
        });
        await storage.createWalletTransaction({
          id: `WTX-${ts}-in`,
          walletId: toWalletId,
          type: "transfer_in",
          amount: amountReceived.toFixed(2),
          balanceBefore: toBal.toFixed(2),
          balanceAfter: newToBal.toFixed(2),
          category: "transfer",
          description: `Transfer from ${fromWallet.name}${description ? ': ' + description : ''}`,
          relatedTransferId: transferId,
          relatedOrderId: relatedOrderId || null,
          performedBy: actorId,
          performedByName: actorName,
          performedByRole: "owner",
        });
        await storage.updateWallet(fromWalletId, { balance: newFromBal.toFixed(2), updatedAt: new Date() });
        await storage.updateWallet(toWalletId, { balance: newToBal.toFixed(2), updatedAt: new Date() });
      }
      await createSystemNotification({
        roleScope: "owner",
        type: "wallet",
        title: "Transfer " + (status === "completed" ? "Completed" : "Submitted"),
        body: `${actorName} ${status === "completed" ? "transferred" : "requested transfer of"} ${formatUSD(numAmount)} from ${fromWallet.name} to ${toWallet.name}${numFee > 0 ? ` (fee: ${formatUSD(numFee)})` : ''}`,
        linkUrl: "/wallets",
        severity: status === "pending" ? "warning" : "info",
      });
      if (!isOwner && fromWallet.ownerDiscordId) {
        await createSystemNotification({
          userId: fromWallet.ownerDiscordId,
          type: "wallet",
          title: "Transfer Submitted",
          body: `You submitted a transfer of ${formatUSD(numAmount)} from ${fromWallet.name} to ${toWallet.name}. Awaiting approval.`,
          linkUrl: "/wallets",
        });
      }
      res.status(201).json({ transferId, status });
    } catch (error) {
      res.status(500).json({ message: "Failed to create transfer" });
    }
  });

  app.patch("/api/wallets/transfers/:id/approve", requireOwner, async (req, res) => {
    try {
      const transfer = (await storage.getWalletTransfers()).find(t => t.id === req.params.id);
      if (!transfer) return res.status(404).json({ message: "Transfer not found" });
      if (transfer.status !== "pending") return res.status(400).json({ message: "Transfer is not pending" });
      const fromWallet = await storage.getWallet(transfer.fromWalletId);
      const toWallet = await storage.getWallet(transfer.toWalletId);
      if (!fromWallet || !toWallet) return res.status(404).json({ message: "Wallet not found" });
      const numAmount = parseFloat(transfer.amount?.toString() || "0");
      const numFee = parseFloat(transfer.transferFee?.toString() || "0");
      const totalDeducted = numAmount + numFee;
      const fromBal = parseFloat(fromWallet.balance?.toString() || "0");
      const toBal = parseFloat(toWallet.balance?.toString() || "0");
      const newFromBal = fromBal - totalDeducted;
      const newToBal = toBal + numAmount;
      const actorId = (req.user as any)?.discordId || (req.user as any)?.id || "";
      const actorName = getActorName(req);
      const ts = Date.now().toString(36);
      await storage.createWalletTransaction({
        id: `WTX-${ts}-out`,
        walletId: transfer.fromWalletId,
        type: "transfer_out",
        amount: totalDeducted.toFixed(2),
        balanceBefore: fromBal.toFixed(2),
        balanceAfter: newFromBal.toFixed(2),
        category: "transfer",
        description: `Transfer to ${toWallet.name}${numFee > 0 ? ` (fee: $${numFee.toFixed(2)})` : ''}${transfer.description ? ': ' + transfer.description : ''}`,
        relatedTransferId: transfer.id,
        relatedOrderId: transfer.relatedOrderId || null,
        performedBy: actorId,
        performedByName: actorName,
        performedByRole: "owner",
      });
      await storage.createWalletTransaction({
        id: `WTX-${ts}-in`,
        walletId: transfer.toWalletId,
        type: "transfer_in",
        amount: numAmount.toFixed(2),
        balanceBefore: toBal.toFixed(2),
        balanceAfter: newToBal.toFixed(2),
        category: "transfer",
        description: `Transfer from ${fromWallet.name}${transfer.description ? ': ' + transfer.description : ''}`,
        relatedTransferId: transfer.id,
        relatedOrderId: transfer.relatedOrderId || null,
        performedBy: actorId,
        performedByName: actorName,
        performedByRole: "owner",
      });
      await storage.updateWallet(transfer.fromWalletId, { balance: newFromBal.toFixed(2), updatedAt: new Date() });
      await storage.updateWallet(transfer.toWalletId, { balance: newToBal.toFixed(2), updatedAt: new Date() });
      await storage.updateWalletTransfer(transfer.id, { status: "completed", approvedBy: actorId, approvedByName: actorName, approvedAt: new Date() });
      if (transfer.performedBy) {
        await createSystemNotification({
          userId: transfer.performedBy,
          type: "wallet",
          title: "Transfer Approved",
          body: `Your transfer of ${formatUSD(numAmount)} from ${fromWallet.name} to ${toWallet.name} has been approved by ${actorName}.`,
          linkUrl: "/wallets",
        });
      }
      if (transfer.relatedOrderId) {
        const links = await storage.getOrderPaymentLinks(transfer.relatedOrderId);
        const matchingLink = links.find(l => l.transferId === transfer.id || (l.receivedByWalletId === transfer.fromWalletId && l.transferStatus === "pending_transfer"));
        if (matchingLink) {
          await storage.updateOrderPaymentLink(matchingLink.id, { transferStatus: "transferred", transferId: transfer.id });
        }
      }
      res.json({ message: "Transfer approved" });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve transfer" });
    }
  });

  app.get("/api/wallet-transactions", requireStaff, async (req, res) => {
    try {
      if (isWalletBlocked(req)) return res.status(403).json({ message: "Access denied" });
      const filters: any = {};
      if (req.query.walletId) filters.walletId = req.query.walletId;
      if (req.query.category) filters.category = req.query.category;
      if (req.query.type) filters.type = req.query.type;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.orderId) filters.orderId = req.query.orderId;
      let transactions = await storage.getWalletTransactions(filters);
      const isOwner = (req.user as any)?.role === "owner" && !isWalletRestricted(req);
      if (!isOwner) {
        const actorId = (req.user as any)?.discordId || (req.user as any)?.id || "";
        const wallets = await storage.getWallets();
        const visibleWalletIds = new Set(wallets.filter(w => w.scope === "company" || w.ownerDiscordId === actorId).map(w => w.id));
        transactions = transactions.filter(tx => visibleWalletIds.has(tx.walletId));
      }
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get("/api/wallet-transfers", requireStaff, async (req, res) => {
    try {
      if (isWalletBlocked(req)) return res.status(403).json({ message: "Access denied" });
      let transfers = await storage.getWalletTransfers();
      const isOwner = (req.user as any)?.role === "owner" && !isWalletRestricted(req);
      if (!isOwner) {
        const actorId = (req.user as any)?.discordId || (req.user as any)?.id || "";
        transfers = transfers.filter(t => t.performedBy === actorId);
      }
      res.json(transfers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transfers" });
    }
  });

  app.get("/api/business-payouts", requireStaff, async (req, res) => {
    try {
      if (isWalletBlocked(req)) return res.status(403).json({ message: "Access denied" });
      const filters: any = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.category) filters.category = req.query.category;
      if (req.query.recipientRole) filters.recipientRole = req.query.recipientRole;
      if (req.query.walletId) filters.walletId = req.query.walletId;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      let payouts = await storage.getBusinessPayouts(filters);
      const isOwner = (req.user as any)?.role === "owner";
      if (!isOwner) {
        const actorId = (req.user as any)?.discordId || (req.user as any)?.id || "";
        const actorName = getActorName(req);
        payouts = payouts.filter(p => p.requestedBy === actorId || p.recipientName === actorName);
      }
      res.json(payouts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business payouts" });
    }
  });

  app.post("/api/business-payouts", requireOwner, async (req, res) => {
    try {
      const { recipientName, recipientRole, category, amount, description, walletId, orderId, proofUrl } = req.body;
      if (!recipientName || !recipientRole || !category || !amount) {
        return res.status(400).json({ message: "Recipient name, role, category and amount are required" });
      }
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ message: "Invalid amount" });
      const actorId = (req.user as any)?.discordId || (req.user as any)?.id || "";
      const actorName = getActorName(req);
      const isOwner = (req.user as any)?.role === "owner";
      const id = `BPO-${Date.now().toString(36)}`;
      const payout = await storage.createBusinessPayout({
        id,
        walletId: walletId || null,
        recipientName,
        recipientRole,
        category,
        amount: numAmount.toFixed(2),
        description: description || null,
        orderId: orderId || null,
        proofUrl: proofUrl || null,
        status: "approved",
        requestedBy: actorId,
        requestedByName: actorName,
      });
      await createSystemNotification({
        roleScope: "owner",
        type: "wallet",
        title: "Payout Created",
        body: `${actorName} created a payout of ${formatUSD(numAmount)} to ${recipientName} (${category}).`,
        linkUrl: "/wallets",
      });
      res.status(201).json(payout);
    } catch (error) {
      res.status(500).json({ message: "Failed to create business payout" });
    }
  });

  app.patch("/api/business-payouts/:id/approve", requireOwner, async (req, res) => {
    try {
      const payout = (await storage.getBusinessPayouts()).find(p => p.id === req.params.id);
      if (!payout) return res.status(404).json({ message: "Payout not found" });
      if (payout.status !== "pending") return res.status(400).json({ message: "Payout is not pending" });
      const actorId = (req.user as any)?.discordId || (req.user as any)?.id || "";
      const actorName = getActorName(req);
      await storage.updateBusinessPayout(req.params.id, {
        status: "approved",
        approvedBy: actorId,
        approvedByName: actorName,
        approvedAt: new Date(),
      });
      await createSystemNotification({
        roleScope: "staff",
        type: "wallet",
        title: "Payout Approved",
        body: `Payout of ${formatUSD(parseFloat(payout.amount?.toString() || "0"))} to ${payout.recipientName} has been approved by ${actorName}.`,
        linkUrl: "/wallets",
      });
      res.json({ message: "Payout approved" });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve payout" });
    }
  });

  app.patch("/api/business-payouts/:id/reject", requireOwner, async (req, res) => {
    try {
      const payout = (await storage.getBusinessPayouts()).find(p => p.id === req.params.id);
      if (!payout) return res.status(404).json({ message: "Payout not found" });
      if (payout.status !== "pending") return res.status(400).json({ message: "Payout is not pending" });
      const actorId = (req.user as any)?.discordId || (req.user as any)?.id || "";
      const actorName = getActorName(req);
      await storage.updateBusinessPayout(req.params.id, {
        status: "rejected",
        rejectedBy: actorId,
        rejectedByName: actorName,
        rejectedAt: new Date(),
        rejectionReason: req.body.reason || null,
      });
      await createSystemNotification({
        roleScope: "staff",
        type: "wallet",
        title: "Payout Rejected",
        body: `Payout of ${formatUSD(parseFloat(payout.amount?.toString() || "0"))} to ${payout.recipientName} was rejected by ${actorName}.`,
        linkUrl: "/wallets",
        severity: "warning",
      });
      res.json({ message: "Payout rejected" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reject payout" });
    }
  });

  app.patch("/api/business-payouts/:id/pay", requireOwner, async (req, res) => {
    try {
      const payout = (await storage.getBusinessPayouts()).find(p => p.id === req.params.id);
      if (!payout) return res.status(404).json({ message: "Payout not found" });
      if (payout.status !== "approved") return res.status(400).json({ message: "Payout must be approved before paying" });
      const numAmount = parseFloat(payout.amount?.toString() || "0");
      const actorId = (req.user as any)?.discordId || (req.user as any)?.id || "";
      const actorName = getActorName(req);
      const walletId = req.body.walletId || payout.walletId;
      if (walletId) {
        const wallet = await storage.getWallet(walletId);
        if (wallet) {
          const currentBal = parseFloat(wallet.balance?.toString() || "0");
          const newBal = currentBal - numAmount;
          await storage.createWalletTransaction({
            id: `WTX-${Date.now().toString(36)}-bpo`,
            walletId: wallet.id,
            type: "business_payout",
            amount: numAmount.toFixed(2),
            balanceBefore: currentBal.toFixed(2),
            balanceAfter: newBal.toFixed(2),
            category: payout.category || "misc",
            description: `Business payout to ${payout.recipientName}: ${payout.description || payout.category}`,
            relatedPayoutId: payout.id,
            relatedOrderId: payout.orderId || null,
            performedBy: actorId,
            performedByName: actorName,
            performedByRole: "owner",
          });
          await storage.updateWallet(wallet.id, { balance: newBal.toFixed(2), updatedAt: new Date() });
        }
      }
      await storage.updateBusinessPayout(req.params.id, {
        status: "paid",
        paidAt: new Date(),
        walletId: walletId || payout.walletId,
      });
      await createSystemNotification({
        roleScope: "staff",
        type: "wallet",
        title: "Payout Paid",
        body: `Payout of ${formatUSD(numAmount)} to ${payout.recipientName} has been marked as paid by ${actorName}.`,
        linkUrl: "/wallets",
      });
      res.json({ message: "Payout marked as paid" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark payout as paid" });
    }
  });

  app.get("/api/wallet-summary", requireStaff, async (req, res) => {
    try {
      if (isWalletBlocked(req)) return res.status(403).json({ message: "Access denied" });
      const wallets = await storage.getWallets();
      const isOwner = (req.user as any)?.role === "owner" && !isWalletRestricted(req);
      const actorId = (req.user as any)?.discordId || (req.user as any)?.id || "";
      const activeWallets = wallets.filter(w => w.isActive);
      const relevantWallets = isOwner ? activeWallets : activeWallets.filter(w => w.ownerDiscordId === actorId);
      const companyWallets = activeWallets.filter(w => w.scope === "company");
      const personalWallets = activeWallets.filter(w => w.scope === "personal");
      const totalBalance = (isOwner ? companyWallets : relevantWallets).reduce((sum, w) => sum + parseFloat(w.balance?.toString() || "0"), 0);
      const allTx = await storage.getWalletTransactions();
      const relevantWalletIds = new Set(relevantWallets.map(w => w.id));
      const transactions = isOwner ? allTx : allTx.filter(t => relevantWalletIds.has(t.walletId));
      const totalDeposits = transactions.filter(t => ["deposit", "transfer_in", "fine_received", "order_income"].includes(t.type)).reduce((sum, t) => sum + parseFloat(t.amount?.toString() || "0"), 0);
      const totalWithdrawals = transactions.filter(t => ["withdrawal", "transfer_out", "grinder_payout", "business_payout"].includes(t.type)).reduce((sum, t) => sum + parseFloat(t.amount?.toString() || "0"), 0);
      const payouts = await storage.getBusinessPayouts();
      const pendingPayouts = payouts.filter(p => p.status === "pending").reduce((sum, p) => sum + parseFloat(p.amount?.toString() || "0"), 0);
      const paidPayouts = payouts.filter(p => p.status === "paid").reduce((sum, p) => sum + parseFloat(p.amount?.toString() || "0"), 0);
      const transfers = await storage.getWalletTransfers();
      const pendingTransfers = transfers.filter(t => t.status === "pending").reduce((sum, t) => sum + parseFloat(t.amount?.toString() || "0"), 0);

      const perWalletStats: any[] = relevantWallets.map(w => {
        const wTx = allTx.filter(t => t.walletId === w.id);
        const wIn = wTx.filter(t => ["deposit", "transfer_in", "fine_received", "order_income"].includes(t.type)).reduce((s, t) => s + parseFloat(t.amount?.toString() || "0"), 0);
        const wOut = wTx.filter(t => ["withdrawal", "transfer_out", "grinder_payout", "business_payout"].includes(t.type)).reduce((s, t) => s + parseFloat(t.amount?.toString() || "0"), 0);
        return { walletId: w.id, name: w.name, type: w.type, scope: w.scope, balance: parseFloat(w.balance?.toString() || "0"), totalIn: wIn, totalOut: wOut, txCount: wTx.length };
      });

      const staffHolding = isOwner ? personalWallets.reduce((sum, w) => sum + parseFloat(w.balance?.toString() || "0"), 0) : 0;
      const orderPaymentLinks = await storage.getOrderPaymentLinks();
      const outstandingTransfers = orderPaymentLinks.filter(l => l.transferStatus === "pending_transfer").length;

      res.json({
        totalBalance,
        walletCount: relevantWallets.length,
        companyWalletCount: companyWallets.length,
        personalWalletCount: personalWallets.length,
        totalDeposits,
        totalWithdrawals,
        pendingPayouts,
        paidPayouts,
        pendingTransfers,
        staffHolding,
        outstandingTransfers,
        transactionCount: transactions.length,
        perWalletStats,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wallet summary" });
    }
  });

  app.get("/api/order-payment-links", requireStaff, async (req, res) => {
    try {
      if (isWalletBlocked(req)) return res.status(403).json({ message: "Access denied" });
      const orderId = req.query.orderId as string | undefined;
      let links = await storage.getOrderPaymentLinks(orderId);
      const isOwner = (req.user as any)?.role === "owner";
      if (!isOwner) {
        const actorId = (req.user as any)?.discordId || (req.user as any)?.id || "";
        const wallets = await storage.getWallets();
        const visibleWalletIds = new Set(wallets.filter(w => w.scope === "company" || w.ownerDiscordId === actorId).map(w => w.id));
        links = links.filter(l => visibleWalletIds.has(l.receivedByWalletId));
      }
      res.json(links);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order payment links" });
    }
  });

  app.post("/api/order-payment-links", requireStaff, async (req, res) => {
    try {
      if (isWalletBlocked(req)) return res.status(403).json({ message: "Access denied" });
      const { orderId, receivedByWalletId, companyWalletId, amount, proofUrl, notes } = req.body;
      if (!orderId || !receivedByWalletId || !amount) return res.status(400).json({ message: "Order ID, wallet, and amount are required" });
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ message: "Invalid amount" });
      const wallet = await storage.getWallet(receivedByWalletId);
      if (!wallet) return res.status(404).json({ message: "Wallet not found" });
      const actorId = (req.user as any)?.discordId || (req.user as any)?.id || "";
      const isOwner = (req.user as any)?.role === "owner";
      if (!isOwner) {
        if (wallet.scope === "company") {
          return res.status(403).json({ message: "Staff can only link order payments to their own personal wallets" });
        }
        if (wallet.ownerDiscordId !== actorId) {
          return res.status(403).json({ message: "You can only link payments to your own wallet" });
        }
      }
      const actorName = getActorName(req);
      const isCompanyWallet = wallet.scope === "company";
      const transferStatus = isCompanyWallet ? "not_needed" : "pending_transfer";
      const id = `OPL-${Date.now().toString(36)}`;
      const link = await storage.createOrderPaymentLink({
        id,
        orderId,
        receivedByWalletId,
        companyWalletId: companyWalletId || null,
        amount: numAmount.toFixed(2),
        transferStatus,
        proofUrl: proofUrl || null,
        notes: notes || null,
        createdBy: actorId,
        createdByName: actorName,
      });

      const currentBal = parseFloat(wallet.balance?.toString() || "0");
      const newBal = currentBal + numAmount;
      await storage.createWalletTransaction({
        id: `WTX-${Date.now().toString(36)}-opl`,
        walletId: wallet.id,
        type: "order_income",
        amount: numAmount.toFixed(2),
        balanceBefore: currentBal.toFixed(2),
        balanceAfter: newBal.toFixed(2),
        category: "order_income",
        description: `Order payment received - ${orderId}`,
        relatedOrderId: orderId,
        performedBy: actorId,
        performedByName: actorName,
        performedByRole: (req.user as any)?.role || "staff",
      });
      await storage.updateWallet(wallet.id, { balance: newBal.toFixed(2), updatedAt: new Date() });

      res.status(201).json(link);
    } catch (error) {
      res.status(500).json({ message: "Failed to create order payment link" });
    }
  });

  app.post("/api/order-payment-links/:id/request-transfer", requireOwner, async (req, res) => {
    try {
      const link = (await storage.getOrderPaymentLinks()).find(l => l.id === req.params.id);
      if (!link) return res.status(404).json({ message: "Payment link not found" });
      if (link.transferStatus !== "pending_transfer") return res.status(400).json({ message: "Transfer not needed or already completed" });
      const { companyWalletId } = req.body;
      if (!companyWalletId) return res.status(400).json({ message: "Company wallet is required" });
      const companyWallet = await storage.getWallet(companyWalletId);
      if (!companyWallet || companyWallet.scope !== "company") return res.status(400).json({ message: "Must select a company wallet" });
      await storage.updateOrderPaymentLink(req.params.id, { companyWalletId, transferStatus: "pending_transfer" });
      res.json({ message: "Transfer requested" });
    } catch (error) {
      res.status(500).json({ message: "Failed to request transfer" });
    }
  });

  app.get("/api/wallet-config", requireStaff, async (req, res) => {
    try {
      if (isWalletBlocked(req)) return res.status(403).json({ message: "Access denied" });
      const config = await storage.getQueueConfig();
      const customRoles = (config as any)?.customPayoutRoles || [];
      const customCategories = (config as any)?.customPayoutCategories || [];
      res.json({ customRoles, customCategories });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wallet config" });
    }
  });

  app.patch("/api/wallet-config", requireOwner, async (req, res) => {
    try {
      const { customRoles, customCategories } = req.body;
      const config = await storage.getQueueConfig();
      if (!config) return res.status(500).json({ message: "Config not found" });
      const updates: any = {};
      if (customRoles !== undefined) updates.customPayoutRoles = customRoles;
      if (customCategories !== undefined) updates.customPayoutCategories = customCategories;
      await storage.upsertQueueConfig({ ...config, ...updates } as any);
      res.json({ message: "Config updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update wallet config" });
    }
  });

  app.get("/api/wallet/payout-recipients", requireOwner, async (req, res) => {
    try {
      const role = (req.query.role as string || "").toLowerCase();
      const allUsers = await db.select().from(users);
      const allGrinders = await storage.getGrinders();
      const recipients: { name: string; discordId?: string; source: string }[] = [];

      if (role === "staff" || role === "staff pay") {
        allUsers.filter(u => u.role === "staff").forEach(u => {
          recipients.push({ name: u.discordUsername || u.firstName || u.email || "Unknown", discordId: u.discordId || undefined, source: "staff" });
        });
      } else if (role === "owner" || role === "owner pay") {
        allUsers.filter(u => u.role === "owner").forEach(u => {
          recipients.push({ name: u.discordUsername || u.firstName || u.email || "Unknown", discordId: u.discordId || undefined, source: "owner" });
        });
      }

      res.json(recipients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recipients" });
    }
  });

  return httpServer;
}

export async function seedDatabase() {
  const servicesData = [
    { id: 'S1', name: 'VC Grinding 🪙', group: 'VC', defaultComplexity: 1, slaDays: 5 },
    { id: 'S2', name: 'Badge Grinding 🎖️', group: 'Badges', defaultComplexity: 2, slaDays: 5 },
    { id: 'S3', name: 'Rep Grinding ⚡', group: 'Rep', defaultComplexity: 5, slaDays: 7 },
    { id: 'S4', name: 'Hot Zones 🔥', group: 'Hot Zones', defaultComplexity: 3, slaDays: 5 },
    { id: 'S5', name: 'Build Specializations 🛠️', group: 'Build', defaultComplexity: 3, slaDays: 5 },
    { id: 'S6', name: 'Lifetime Challenges 🏆', group: 'Challenges', defaultComplexity: 4, slaDays: 7 },
    { id: 'S7', name: 'Plate Card Grinding 🃏', group: 'Cards', defaultComplexity: 2, slaDays: 5 },
    { id: 'S8', name: 'Event Grinding 🏟️', group: 'Events', defaultComplexity: 3, slaDays: 5 },
    { id: 'S9', name: 'Bundle Order 🎁', group: 'Bundle', defaultComplexity: 3, slaDays: 5 },
    { id: 'S10', name: 'Season Pass Grinding 🎫', group: 'Season', defaultComplexity: 3, slaDays: 7 },
    { id: 'S11', name: 'Add-Ons ➕', group: 'Add-Ons', defaultComplexity: 1, slaDays: 3 },
  ];
  const existingServices = await storage.getServices();
  const existingIds = new Set(existingServices.map(s => s.id));
  for (const s of servicesData) {
    if (!existingIds.has(s.id)) {
      await storage.createService(s);
    }
  }
  await storage.getQueueConfig();
}
