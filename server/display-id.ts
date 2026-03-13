import { db } from "./db";
import { orders, bids, assignments, orderUpdates, payoutRequests, strikeLogs, finePayments, events, customerReviews, orderClaimRequests } from "@shared/schema";
import { eq, sql, count } from "drizzle-orm";
import { randomBytes } from "crypto";

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

function pad(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}

let _devOrderSeq = 0;
async function getNextOrderNumber(): Promise<number> {
  if (isDevNoDb() || !db) return ++_devOrderSeq;
  const result = await db.select({ max: sql<number>`COALESCE(MAX(mgt_order_number), 0)` }).from(orders);
  return (result[0]?.max || 0) + 1;
}

async function countBidsForOrder(orderId: string): Promise<number> {
  if (isDevNoDb() || !db) return 0;
  const result = await db.select({ cnt: count() }).from(bids).where(eq(bids.orderId, orderId));
  return result[0]?.cnt || 0;
}

async function countAssignmentsForOrder(orderId: string): Promise<number> {
  if (isDevNoDb() || !db) return 0;
  const result = await db.select({ cnt: count() }).from(assignments).where(eq(assignments.orderId, orderId));
  return result[0]?.cnt || 0;
}

async function countUpdatesForOrder(orderId: string): Promise<number> {
  if (isDevNoDb() || !db) return 0;
  const result = await db.select({ cnt: count() }).from(orderUpdates).where(eq(orderUpdates.orderId, orderId));
  return result[0]?.cnt || 0;
}

async function countPayoutsForOrder(orderId: string): Promise<number> {
  if (isDevNoDb() || !db) return 0;
  const result = await db.select({ cnt: count() }).from(payoutRequests).where(eq(payoutRequests.orderId, orderId));
  return result[0]?.cnt || 0;
}

async function getGlobalCount(table: any): Promise<number> {
  if (isDevNoDb() || !db) return 0;
  const result = await db.select({ cnt: count() }).from(table);
  return result[0]?.cnt || 0;
}

function getOrderPad(orderNum: number): string {
  return orderNum >= 100 ? String(orderNum) : pad(orderNum);
}

export async function generateOrderDisplayId(mgtOrderNumber?: number): Promise<{ displayId: string; mgtOrderNumber: number }> {
  const orderNum = mgtOrderNumber ?? await getNextOrderNumber();
  return { displayId: `ORD-${getOrderPad(orderNum)}`, mgtOrderNumber: orderNum };
}

function devOrderNumFromId(orderId: string): number {
  const m = orderId.match(/^MGT-(\d+)$/);
  return m ? parseInt(m[1], 10) : (_devOrderSeq || 1);
}

export async function generateBidDisplayId(orderId: string): Promise<string> {
  let orderNum = 0;
  if (!isDevNoDb() && db) {
    const order = await db.select({ mgtOrderNumber: orders.mgtOrderNumber }).from(orders).where(eq(orders.id, orderId)).limit(1);
    orderNum = order[0]?.mgtOrderNumber || 0;
  } else {
    orderNum = devOrderNumFromId(orderId);
  }
  const existingCount = await countBidsForOrder(orderId);
  return `BID-${getOrderPad(orderNum)}-${existingCount + 1}`;
}

export async function generateAssignmentDisplayId(orderId: string): Promise<string> {
  let orderNum = 0;
  if (!isDevNoDb() && db) {
    const order = await db.select({ mgtOrderNumber: orders.mgtOrderNumber }).from(orders).where(eq(orders.id, orderId)).limit(1);
    orderNum = order[0]?.mgtOrderNumber || 0;
  } else {
    orderNum = devOrderNumFromId(orderId);
  }
  const existingCount = await countAssignmentsForOrder(orderId);
  return `ASN-${getOrderPad(orderNum)}-${pad(existingCount + 1)}`;
}

export async function generateUpdateDisplayId(orderId: string): Promise<string> {
  let orderNum = 0;
  if (!isDevNoDb() && db) {
    const order = await db.select({ mgtOrderNumber: orders.mgtOrderNumber }).from(orders).where(eq(orders.id, orderId)).limit(1);
    orderNum = order[0]?.mgtOrderNumber || 0;
  } else {
    orderNum = devOrderNumFromId(orderId);
  }
  const existingCount = await countUpdatesForOrder(orderId);
  return `UPD-${getOrderPad(orderNum)}-${pad(existingCount + 1)}`;
}

export async function generatePayoutDisplayId(orderId: string): Promise<string> {
  let orderNum = 0;
  if (!isDevNoDb() && db) {
    const order = await db.select({ mgtOrderNumber: orders.mgtOrderNumber }).from(orders).where(eq(orders.id, orderId)).limit(1);
    orderNum = order[0]?.mgtOrderNumber || 0;
  } else {
    orderNum = devOrderNumFromId(orderId);
  }
  const existingCount = await countPayoutsForOrder(orderId);
  return `PAY-${getOrderPad(orderNum)}-${pad(existingCount + 1)}`;
}

export async function generateStrikeDisplayId(): Promise<string> {
  const cnt = await getGlobalCount(strikeLogs);
  return `STR-${pad(cnt + 1)}`;
}

export async function generateFineDisplayId(): Promise<string> {
  const cnt = await getGlobalCount(finePayments);
  return `FIN-${pad(cnt + 1)}`;
}

export async function generateEventDisplayId(): Promise<string> {
  const cnt = await getGlobalCount(events);
  return `EVT-${pad(cnt + 1)}`;
}

export async function generateReviewDisplayId(orderId?: string | null): Promise<string> {
  if (orderId) {
    let orderNum = 0;
    let cnt = 0;
    if (!isDevNoDb() && db) {
      const order = await db.select({ mgtOrderNumber: orders.mgtOrderNumber }).from(orders).where(eq(orders.id, orderId)).limit(1);
      orderNum = order[0]?.mgtOrderNumber || 0;
      const res = await db.select({ cnt: count() }).from(customerReviews).where(eq(customerReviews.orderId, orderId));
      cnt = res[0]?.cnt || 0;
    } else {
      orderNum = devOrderNumFromId(orderId);
    }
    return `REV-${getOrderPad(orderNum)}-${cnt + 1}`;
  }
  const cnt = await getGlobalCount(customerReviews);
  return `REV-${pad(cnt + 1)}`;
}

export async function generateClaimDisplayId(): Promise<string> {
  const cnt = await getGlobalCount(orderClaimRequests);
  return `CLM-${pad(cnt + 1)}`;
}

export function formatDisplayId(entity: { displayId?: string | null; id: string; mgtOrderNumber?: number | null }): string {
  if (entity.displayId) return entity.displayId;
  if ('mgtOrderNumber' in entity && entity.mgtOrderNumber) return `ORD-${getOrderPad(entity.mgtOrderNumber)}`;
  return entity.id;
}

export function generateShortId(prefix: string): string {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  let result = "";
  const bytes = randomBytes(4);
  for (let i = 0; i < 4; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return `${prefix}-${result}`;
}
