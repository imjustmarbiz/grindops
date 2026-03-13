import { EmbedBuilder, TextChannel } from "discord.js";
import { getDiscordBotClient } from "./bot";
import { db } from "../db";
import { storage } from "../storage";
import { orders, bids, grinders } from "@shared/schema";
import { eq, and, isNotNull, sql } from "drizzle-orm";

const isDevNoDb = () => {
  if (process.env.NODE_ENV === "production") return false;
  const databaseUrl = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL || "";
  return (
    !databaseUrl ||
    databaseUrl.includes("localhost:5432") ||
    databaseUrl.includes("127.0.0.1:5432") ||
    databaseUrl.includes("[::1]:5432")
  );
};

const BID_WAR_CHANNEL_ID = "1467912681670447140";
const GRINDERS_ROLE_ID = "1466369179648004224";

const CHECK_INTERVAL_MS = 60_000;

type NotificationStage = "open" | "first_bid" | "5min" | "2min" | "1min" | "closed";

async function getOrderBidCount(orderId: string): Promise<number> {
  if (isDevNoDb() || !db) return 0;
  const result = await db.select({ count: sql<number>`count(*)::int` }).from(bids).where(eq(bids.orderId, orderId));
  return result[0]?.count ?? 0;
}

async function markStageNotified(orderId: string, stage: NotificationStage, currentStages: string[]): Promise<void> {
  if (isDevNoDb() || !db) return;
  const updated = [...currentStages, stage];
  await db.update(orders).set({ biddingNotifiedStages: updated }).where(eq(orders.id, orderId));
}

async function isBidWarNotificationsEnabled(): Promise<boolean> {
  try {
    const config = await storage.getQueueConfig();
    return (config as any)?.bidWarNotificationsEnabled !== false;
  } catch {
    return true;
  }
}

async function sendBiddingNotification(orderId: string, mgtOrderNumber: number | null, stage: NotificationStage, closesAt: Date | null): Promise<void> {
  if (!(await isBidWarNotificationsEnabled())) return;
  const client = getDiscordBotClient();
  if (!client) return;

  try {
    const channel = await client.channels.fetch(BID_WAR_CHANNEL_ID) as TextChannel;
    if (!channel) return;

    const orderLabel = mgtOrderNumber ? `Order #${mgtOrderNumber}` : orderId;
    let color = 0x5865F2;
    let title = "";
    let description = "";

    switch (stage) {
      case "open":
        color = 0x57F287;
        title = `📢 ${orderLabel} — Bidding Open!`;
        description = `A new order is available for bidding.\nBidding window: **10 minutes** from first bid.\n\n<@&${GRINDERS_ROLE_ID}> Submit your proposals!`;
        break;
      case "first_bid":
        color = 0xFEE75C;
        title = `⏱️ ${orderLabel} — First Bid Received!`;
        const closeTime = closesAt ? `<t:${Math.floor(closesAt.getTime() / 1000)}:R>` : "in 10 minutes";
        description = `The 10-minute bidding countdown has started!\nBidding closes ${closeTime}.\n\n<@&${GRINDERS_ROLE_ID}> Get your bids in now!`;
        break;
      case "5min":
        color = 0xFEE75C;
        title = `⏳ ${orderLabel} — 5 Minutes Left!`;
        description = `Only **5 minutes** remaining to place your bid.\n\n<@&${GRINDERS_ROLE_ID}> Don't miss out!`;
        break;
      case "2min":
        color = 0xED4245;
        title = `🔥 ${orderLabel} — 2 Minutes Left!`;
        description = `Only **2 minutes** remaining! Bidding is closing soon.\n\n<@&${GRINDERS_ROLE_ID}> Last chance!`;
        break;
      case "1min":
        color = 0xED4245;
        title = `⚠️ ${orderLabel} — 1 Minute Left!`;
        description = `**FINAL MINUTE!** Bidding closes in 60 seconds!\n\n<@&${GRINDERS_ROLE_ID}> Submit now or miss it!`;
        break;
      case "closed": {
        color = 0x95A5A6;
        const bidCount = await getOrderBidCount(orderId);
        title = `🔒 ${orderLabel} — Bidding Closed`;
        description = `This bidding window has closed.\n📊 **${bidCount}** proposal${bidCount !== 1 ? "s" : ""} received.\n\nStaff is reviewing proposals. Winner will be announced soon.`;
        break;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .setTimestamp();

    if (closesAt && stage !== "closed" && stage !== "open") {
      embed.setFooter({ text: `Bidding closes at ${closesAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}` });
    }

    await channel.send({ embeds: [embed] });
    console.log(`[bidding-timer] Sent ${stage} notification for ${orderLabel}`);
  } catch (error) {
    console.error(`[bidding-timer] Failed to send ${stage} notification:`, error);
  }
}

async function checkBiddingTimers(): Promise<void> {
  if (isDevNoDb() || !db) return;
  try {
    const openOrders = await db.select().from(orders).where(
      and(
        eq(orders.status, "Open"),
        isNotNull(orders.biddingClosesAt)
      )
    );

    const now = Date.now();

    for (const order of openOrders) {
      if (!order.biddingClosesAt) continue;

      const closesAt = new Date(order.biddingClosesAt).getTime();
      const remaining = closesAt - now;
      const stages = (order.biddingNotifiedStages as string[]) || [];

      if (!stages.includes("first_bid")) {
        await sendBiddingNotification(order.id, order.mgtOrderNumber, "first_bid", order.biddingClosesAt);
        await markStageNotified(order.id, "first_bid", stages);
        stages.push("first_bid");
      }

      if (remaining <= 5 * 60 * 1000 && remaining > 2 * 60 * 1000 && !stages.includes("5min")) {
        await sendBiddingNotification(order.id, order.mgtOrderNumber, "5min", order.biddingClosesAt);
        await markStageNotified(order.id, "5min", stages);
        stages.push("5min");
      }

      if (remaining <= 2 * 60 * 1000 && remaining > 1 * 60 * 1000 && !stages.includes("2min")) {
        await sendBiddingNotification(order.id, order.mgtOrderNumber, "2min", order.biddingClosesAt);
        await markStageNotified(order.id, "2min", stages);
        stages.push("2min");
      }

      if (remaining <= 1 * 60 * 1000 && remaining > 0 && !stages.includes("1min")) {
        await sendBiddingNotification(order.id, order.mgtOrderNumber, "1min", order.biddingClosesAt);
        await markStageNotified(order.id, "1min", stages);
        stages.push("1min");
      }

      if (remaining <= 0 && !stages.includes("closed")) {
        await db.update(orders).set({ status: "Bidding Closed" }).where(eq(orders.id, order.id));
        await sendBiddingNotification(order.id, order.mgtOrderNumber, "closed", order.biddingClosesAt);
        await markStageNotified(order.id, "closed", stages);
        console.log(`[bidding-timer] Auto-closed bidding for order ${order.id}`);
      }
    }

    const newOpenOrders = await db.select().from(orders).where(
      and(
        eq(orders.status, "Open"),
        sql`${orders.firstBidAt} IS NULL`
      )
    );

    for (const order of newOpenOrders) {
      const stages = (order.biddingNotifiedStages as string[]) || [];
      if (!stages.includes("open")) {
        await sendBiddingNotification(order.id, order.mgtOrderNumber, "open", null);
        await markStageNotified(order.id, "open", stages);
      }
    }
  } catch (error) {
    console.error("[bidding-timer] Error checking timers:", error);
  }
}

let timerInterval: ReturnType<typeof setInterval> | null = null;

export function startBiddingTimerScheduler(): void {
  if (timerInterval) return;
  timerInterval = setInterval(checkBiddingTimers, CHECK_INTERVAL_MS);
  console.log(`[bidding-timer] Scheduler started (checking every ${CHECK_INTERVAL_MS / 1000}s)`);
  setTimeout(checkBiddingTimers, 5000);
}

export function stopBiddingTimerScheduler(): void {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}
