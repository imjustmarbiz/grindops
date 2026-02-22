import { db } from "./db";
import { 
  services, grinders, orders, bids, assignments, queueConfig,
  type Service, type InsertService,
  type Grinder, type InsertGrinder,
  type Order, type InsertOrder,
  type Bid, type InsertBid,
  type Assignment, type InsertAssignment,
  type QueueConfig, type InsertQueueConfig,
  type QueueItem, type DashboardStats
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  getServices(): Promise<Service[]>;
  getServiceByName(name: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;

  getGrinders(): Promise<Grinder[]>;
  getGrinder(id: string): Promise<Grinder | undefined>;
  getGrinderByDiscordId(discordUserId: string): Promise<Grinder | undefined>;
  createGrinder(grinder: InsertGrinder): Promise<Grinder>;
  upsertGrinderByDiscordId(discordUserId: string, data: Partial<InsertGrinder>): Promise<Grinder>;

  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByMgtNumber(mgtOrderNumber: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  upsertOrderByMgtNumber(mgtOrderNumber: number, data: Partial<InsertOrder>): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;

  getBids(): Promise<Bid[]>;
  getBidByProposalId(mgtProposalId: number): Promise<Bid | undefined>;
  createBid(bid: InsertBid): Promise<Bid>;
  upsertBidByProposalId(mgtProposalId: number, data: Partial<InsertBid>): Promise<Bid>;
  updateBidStatus(id: string, status: string, acceptedBy?: string): Promise<Bid | undefined>;

  getAssignments(): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;

  getDashboardStats(): Promise<DashboardStats>;
  getTopQueueItems(): Promise<QueueItem[]>;
}

export class DatabaseStorage implements IStorage {
  async getServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async getServiceByName(name: string): Promise<Service | undefined> {
    const results = await db.select().from(services);
    return results.find(s => s.name.toLowerCase() === name.toLowerCase());
  }

  async createService(service: InsertService): Promise<Service> {
    const [created] = await db.insert(services).values(service).returning();
    return created;
  }

  async getGrinders(): Promise<Grinder[]> {
    return await db.select().from(grinders);
  }

  async getGrinder(id: string): Promise<Grinder | undefined> {
    const [grinder] = await db.select().from(grinders).where(eq(grinders.id, id));
    return grinder;
  }

  async getGrinderByDiscordId(discordUserId: string): Promise<Grinder | undefined> {
    const [grinder] = await db.select().from(grinders).where(eq(grinders.discordUserId, discordUserId));
    return grinder;
  }

  async createGrinder(grinder: InsertGrinder): Promise<Grinder> {
    const [created] = await db.insert(grinders).values(grinder).returning();
    return created;
  }

  async upsertGrinderByDiscordId(discordUserId: string, data: Partial<InsertGrinder>): Promise<Grinder> {
    const existing = await this.getGrinderByDiscordId(discordUserId);
    if (existing) {
      const updateData: Record<string, any> = {};
      if (data.name) updateData.name = data.name;
      if (data.discordUsername) updateData.discordUsername = data.discordUsername;
      if (data.tier) updateData.tier = data.tier;
      if (data.totalOrders !== undefined) updateData.totalOrders = data.totalOrders;
      if (data.totalReviews !== undefined) updateData.totalReviews = data.totalReviews;
      if (data.winRate !== undefined) updateData.winRate = data.winRate;

      if (Object.keys(updateData).length > 0) {
        const [updated] = await db.update(grinders).set(updateData).where(eq(grinders.id, existing.id)).returning();
        return updated;
      }
      return existing;
    }

    const grinderId = `GRD-${discordUserId.slice(-6)}`;
    const [created] = await db.insert(grinders).values({
      id: grinderId,
      name: data.name || "Unknown",
      discordUserId,
      discordUsername: data.discordUsername,
      tier: data.tier || "New",
      totalOrders: data.totalOrders ?? 0,
      totalReviews: data.totalReviews ?? 0,
      winRate: data.winRate,
      ...data,
    }).returning();
    return created;
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderByMgtNumber(mgtOrderNumber: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.mgtOrderNumber, mgtOrderNumber));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }

  async upsertOrderByMgtNumber(mgtOrderNumber: number, data: Partial<InsertOrder>): Promise<Order> {
    const existing = await this.getOrderByMgtNumber(mgtOrderNumber);
    if (existing) {
      const updateData: Record<string, any> = {};
      if (data.customerPrice) updateData.customerPrice = data.customerPrice;
      if (data.platform) updateData.platform = data.platform;
      if (data.gamertag) updateData.gamertag = data.gamertag;
      if (data.status) updateData.status = data.status;
      if (data.notes) updateData.notes = data.notes;
      if (data.discordMessageId) updateData.discordMessageId = data.discordMessageId;

      if (Object.keys(updateData).length > 0) {
        const [updated] = await db.update(orders).set(updateData).where(eq(orders.id, existing.id)).returning();
        return updated;
      }
      return existing;
    }

    const orderId = `MGT-${mgtOrderNumber}`;
    const [created] = await db.insert(orders).values({
      id: orderId,
      mgtOrderNumber,
      serviceId: data.serviceId || "UNKNOWN",
      customerPrice: data.customerPrice || "0",
      orderDueDate: data.orderDueDate || new Date(),
      status: "Open",
      ...data,
    }).returning();
    return created;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async getBids(): Promise<Bid[]> {
    return await db.select().from(bids);
  }

  async getBidByProposalId(mgtProposalId: number): Promise<Bid | undefined> {
    const [bid] = await db.select().from(bids).where(eq(bids.mgtProposalId, mgtProposalId));
    return bid;
  }

  async createBid(bid: InsertBid): Promise<Bid> {
    const [created] = await db.insert(bids).values(bid).returning();
    return created;
  }

  async upsertBidByProposalId(mgtProposalId: number, data: Partial<InsertBid>): Promise<Bid> {
    const existing = await this.getBidByProposalId(mgtProposalId);
    if (existing) {
      const updateData: Record<string, any> = {};
      if (data.bidAmount) updateData.bidAmount = data.bidAmount;
      if (data.timeline) updateData.timeline = data.timeline;
      if (data.canStart) updateData.canStart = data.canStart;
      if (data.qualityScore !== undefined) updateData.qualityScore = data.qualityScore;
      if (data.margin) updateData.margin = data.margin;
      if (data.marginPct) updateData.marginPct = data.marginPct;
      if (data.status) updateData.status = data.status;
      if (data.discordMessageId) updateData.discordMessageId = data.discordMessageId;

      if (Object.keys(updateData).length > 0) {
        const [updated] = await db.update(bids).set(updateData).where(eq(bids.id, existing.id)).returning();
        return updated;
      }
      return existing;
    }

    const bidId = `P${mgtProposalId}`;
    const [created] = await db.insert(bids).values({
      id: bidId,
      mgtProposalId,
      orderId: data.orderId || "UNKNOWN",
      grinderId: data.grinderId || "UNKNOWN",
      bidAmount: data.bidAmount || "0",
      estDeliveryDate: data.estDeliveryDate || new Date(),
      status: "Pending",
      ...data,
    }).returning();
    return created;
  }

  async updateBidStatus(id: string, status: string, acceptedBy?: string): Promise<Bid | undefined> {
    const updateData: Record<string, any> = { status };
    if (acceptedBy) updateData.acceptedBy = acceptedBy;
    const [updated] = await db.update(bids).set(updateData).where(eq(bids.id, id)).returning();
    return updated;
  }

  async getAssignments(): Promise<Assignment[]> {
    return await db.select().from(assignments);
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [created] = await db.insert(assignments).values(assignment).returning();
    return created;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const activeOrdersRes = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(orders).where(eq(orders.status, 'Open'));
    const completedTodayRes = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(orders).where(eq(orders.status, 'Completed'));
    const availableGrindersRes = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(grinders).where(sql`${grinders.activeOrders} < ${grinders.capacity}`);
    const totalGrindersRes = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(grinders);

    return {
      activeOrders: activeOrdersRes[0].count || 0,
      completedToday: completedTodayRes[0].count || 0,
      availableGrinders: availableGrindersRes[0].count || 0,
      totalGrinders: totalGrindersRes[0].count || 0,
    };
  }

  async getTopQueueItems(): Promise<QueueItem[]> {
    const result = await db.execute(sql`
      SELECT 
        b.id,
        o.id as "orderId",
        s.name as "serviceName",
        o.customer_price as "customerPrice",
        o.order_due_date as "dueDateTime",
        g.name as "grinderName",
        g.tier as "tier",
        b.bid_amount as "bidAmount",
        b.est_delivery_date as "estDeliveryDateTime",
        (CAST(o.customer_price AS FLOAT) - CAST(b.bid_amount AS FLOAT)) as "finalPriorityScore"
      FROM bids b
      JOIN orders o ON b.order_id = o.id
      JOIN services s ON o.service_id = s.id
      JOIN grinders g ON b.grinder_id = g.id
      WHERE o.status = 'Open' AND b.status = 'Pending'
      ORDER BY "finalPriorityScore" DESC
      LIMIT 10
    `);

    return result.rows.map(row => ({
      id: String(row.id),
      orderId: String(row.orderId),
      serviceName: String(row.serviceName),
      customerPrice: String(row.customerPrice),
      dueDateTime: new Date(row.dueDateTime as any),
      grinderName: String(row.grinderName),
      tier: String(row.tier),
      bidAmount: String(row.bidAmount),
      estDeliveryDateTime: new Date(row.estDeliveryDateTime as any),
      finalPriorityScore: Number(row.finalPriorityScore) || 0
    }));
  }
}

export const storage = new DatabaseStorage();
