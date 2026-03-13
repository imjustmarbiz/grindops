import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

process.on("uncaughtException", (err) => {
  console.error("[CRASH] Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[CRASH] Unhandled Rejection:", reason);
});
process.on("SIGTERM", () => {
  console.error("[SIGNAL] SIGTERM received — process being terminated");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.error("[SIGNAL] SIGINT received");
  process.exit(0);
});
process.on("SIGHUP", () => {
  console.error("[SIGNAL] SIGHUP received");
});
process.on("exit", (code) => {
  console.error(`[EXIT] Process exiting with code ${code}`);
});

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5050", 10);

  // Bind to 0.0.0.0 so the server is reachable via LAN IP (e.g. 192.168.x.x:5050)
  httpServer.listen(
    { port, host: "0.0.0.0" },
    () => {
      log(`serving on http://0.0.0.0:${port} (localhost:${port} or LAN IP)`);
      initializeBackgroundServices();
    },
  );
})();

function logMemory(label: string) {
  const mem = process.memoryUsage();
  const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);
  log(
    `[memory] ${label}: RSS=${mb(mem.rss)}MB Heap=${mb(mem.heapUsed)}/${mb(
      mem.heapTotal,
    )}MB`,
    "system",
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isDbConnectionRefused(error: unknown): boolean {
  const err = error as { code?: string; errors?: Array<{ code?: string }> } | undefined;
  return err?.code === "ECONNREFUSED" || err?.errors?.some((item) => item?.code === "ECONNREFUSED") === true;
}

async function initializeBackgroundServices() {
  logMemory("before background services");

  try {
    const { ensureCreatorPayoutDetailRequestsTable, ensureQuoteGeneratorSplitColumns, ensureCreatorCommissionPercentColumn, ensureCreatorQuoteDiscountPercentColumn, ensureQuotesLastEditedColumns, ensureRepQuoteSettingsColumn, ensureBadgeQuoteSettingsColumn, ensureMyPlayerTypeSettingsColumn, ensureBundleQuoteSettingsColumn, ensureHotZonesQuoteSettingsColumn, ensureAllowedAccessRolesColumn } = await import("./ensure-tables");
    await ensureCreatorPayoutDetailRequestsTable();
    await ensureQuoteGeneratorSplitColumns();
    await ensureCreatorCommissionPercentColumn();
    await ensureCreatorQuoteDiscountPercentColumn();
    await ensureQuotesLastEditedColumns();
    await ensureRepQuoteSettingsColumn();
    await ensureBadgeQuoteSettingsColumn();
    await ensureMyPlayerTypeSettingsColumn();
    await ensureBundleQuoteSettingsColumn();
    await ensureHotZonesQuoteSettingsColumn();
    await ensureAllowedAccessRolesColumn();
  } catch (e) {
    if (process.env.NODE_ENV !== "production" && isDbConnectionRefused(e)) {
      log("Database unavailable in development; skipping ensure-tables", "system");
    } else {
      console.error("Failed to ensure tables:", e);
    }
  }

  try {
    const { seedDatabase } = await import("./routes");
    await seedDatabase();
    log("Database seeded successfully");
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && isDbConnectionRefused(error)) {
      log("Database unavailable in development; skipping database seed", "system");
    } else {
      console.error("Failed to seed database:", error);
    }
  }

  try {
    const { db } = await import("./db");
    const { users } = await import("@shared/models/auth");
    const { creators, creatorBadges, creatorPayoutDetailRequests } = await import("@shared/schema");
    const { sql, eq, like } = await import("drizzle-orm");
    if (db) {
      const spacedUsers = await db.select().from(users).where(like(users.discordId, " %"));
      for (const su of spacedUsers) {
        const trimmedId = su.discordId!.trim();
        const canonical = await db.select().from(users).where(eq(users.discordId, trimmedId));
        if (canonical.length > 0) {
          const dupCreatorRows = await db.select().from(creators).where(eq(creators.userId, su.id));
          for (const dc of dupCreatorRows) {
            await db.delete(creatorBadges).where(eq(creatorBadges.creatorId, dc.id));
            await db.delete(creatorPayoutDetailRequests).where(eq(creatorPayoutDetailRequests.creatorId, dc.id));
            await db.delete(creators).where(eq(creators.id, dc.id));
            console.log(`[cleanup] Removed duplicate creator ${dc.id} (code=${dc.code}) for user ${su.id}`);
          }
          await db.delete(users).where(eq(users.id, su.id));
          console.log(`[cleanup] Removed duplicate user ${su.id} (discordId had leading space)`);
        } else {
          await db.update(users).set({ discordId: trimmedId }).where(eq(users.id, su.id));
          console.log(`[cleanup] Trimmed discordId whitespace for user ${su.id}`);
        }
      }
    }
  } catch (e) {
    if (process.env.NODE_ENV !== "production" && isDbConnectionRefused(e)) {
      log("Database unavailable in development; skipping duplicate-user cleanup", "system");
    } else {
      console.error("[cleanup] Error during duplicate user cleanup:", e);
    }
  }

  logMemory("after database seed");

  const isDev = process.env.NODE_ENV !== "production";
  const skipDiscord = isDev && process.env.SKIP_DISCORD_BOT === "true";

  if (skipDiscord) {
    log(
      "Dev mode: skipping Discord bot, bidding timer, Twitch checker (SKIP_DISCORD_BOT=true)",
    );
  } else {
    await delay(2000);

    try {
      const { startBiddingTimerScheduler } = await import(
        "./discord/biddingTimer"
      );
      startBiddingTimerScheduler();
    } catch (error) {
      console.error("Failed to start bidding timer scheduler:", error);
    }

    try {
      const { startDailyUpdateChecker } = await import(
        "./dailyUpdateChecker"
      );
      startDailyUpdateChecker();
    } catch (error) {
      console.error("Failed to start daily update checker:", error);
    }

    await delay(2000);

    try {
      const { startTwitchStreamChecker } = await import(
        "./twitchStreamChecker"
      );
      startTwitchStreamChecker();
    } catch (error) {
      console.error("Failed to start Twitch stream checker:", error);
    }

    logMemory("before Discord bot");
    await delay(3000);

    try {
      const { startDiscordBot } = await import("./discord/bot");
      await startDiscordBot();
    } catch (error) {
      console.error("Failed to start Discord bot:", error);
    }
    logMemory("after Discord bot");
  }

  if (!skipDiscord) {
    await delay(2000);

    try {
      const { repairMissingAssignments } = await import("./repairSync");
      await repairMissingAssignments();
    } catch (error) {
      console.error("Failed to repair missing assignments:", error);
    }
  } else {
    log("Dev mode: skipping repair-sync (SKIP_DISCORD_BOT=true)");
  }

  logMemory("all services initialized");

  setInterval(() => logMemory("periodic"), 5 * 60 * 1000);
}