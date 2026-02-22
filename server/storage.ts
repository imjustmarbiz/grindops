import { db } from "./db";
import { 
  services, grinders, orders, bids, assignments, queueConfig, auditLogs,
  type Service, type InsertService,
  type Grinder, type InsertGrinder,
  type Order, type InsertOrder,
  type Bid, type InsertBid,
  type Assignment, type InsertAssignment,
  type QueueConfig, type InsertQueueConfig,
  type AuditLog, type InsertAuditLog,
  type AnalyticsSummary, type SuggestionResult, type DashboardStats,
  GRINDER_ROLES, ROLE_CAPACITY, ROLE_LABELS,
} from "@shared/schema";
import { eq, sql, desc, and, or, gte, lte } from "drizzle-orm";

export interface IStorage {
  getServices(): Promise<Service[]>;
  getServiceByName(name: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;

  getGrinders(): Promise<Grinder[]>;
  getGrinder(id: string): Promise<Grinder | undefined>;
  getGrinderByDiscordId(discordUserId: string): Promise<Grinder | undefined>;
  createGrinder(grinder: InsertGrinder): Promise<Grinder>;
  updateGrinder(id: string, data: Partial<InsertGrinder>): Promise<Grinder | undefined>;
  upsertGrinderByDiscordId(discordUserId: string, data: Partial<InsertGrinder>): Promise<Grinder>;

  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByMgtNumber(mgtOrderNumber: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  upsertOrderByMgtNumber(mgtOrderNumber: number, data: Partial<InsertOrder>): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  updateOrder(id: string, data: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;

  getBids(): Promise<Bid[]>;
  getBidByProposalId(mgtProposalId: number): Promise<Bid | undefined>;
  createBid(bid: InsertBid): Promise<Bid>;
  upsertBidByProposalId(mgtProposalId: number, data: Partial<InsertBid>): Promise<Bid>;
  updateBidStatus(id: string, status: string, acceptedBy?: string): Promise<Bid | undefined>;

  getAssignments(): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: string, data: Partial<InsertAssignment>): Promise<Assignment | undefined>;

  getQueueConfig(): Promise<QueueConfig | undefined>;
  upsertQueueConfig(config: InsertQueueConfig): Promise<QueueConfig>;

  getAuditLogs(limit?: number, entityType?: string): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  getDashboardStats(): Promise<DashboardStats>;
  getAnalyticsSummary(): Promise<AnalyticsSummary>;
  getSuggestionsForOrder(orderId: string): Promise<SuggestionResult[]>;
  getEmergencyQueue(): Promise<SuggestionResult[]>;
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

  async updateGrinder(id: string, data: Partial<InsertGrinder>): Promise<Grinder | undefined> {
    const [updated] = await db.update(grinders).set(data).where(eq(grinders.id, id)).returning();
    return updated;
  }

  async upsertGrinderByDiscordId(discordUserId: string, data: Partial<InsertGrinder>): Promise<Grinder> {
    const existing = await this.getGrinderByDiscordId(discordUserId);
    if (existing) {
      const updateData: Record<string, any> = {};
      if (data.name) updateData.name = data.name;
      if (data.discordUsername) updateData.discordUsername = data.discordUsername;
      if (data.tier) updateData.tier = data.tier;
      if (data.discordRoleId) updateData.discordRoleId = data.discordRoleId;
      if (data.category) updateData.category = data.category;
      if (data.capacity !== undefined) updateData.capacity = data.capacity;
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
      discordRoleId: data.discordRoleId,
      category: data.category || "Grinder",
      tier: data.tier || "New",
      capacity: data.capacity ?? 5,
      totalOrders: data.totalOrders ?? 0,
      totalReviews: data.totalReviews ?? 0,
      winRate: data.winRate,
    }).returning();
    return created;
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
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
      if (data.serviceId) updateData.serviceId = data.serviceId;
      if (data.isEmergency !== undefined) updateData.isEmergency = data.isEmergency;

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
    const [updated] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return updated;
  }

  async updateOrder(id: string, data: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set(data).where(eq(orders.id, id)).returning();
    return updated;
  }

  async deleteOrder(id: string): Promise<boolean> {
    await db.delete(bids).where(eq(bids.orderId, id));
    await db.delete(assignments).where(eq(assignments.orderId, id));
    const result = await db.delete(orders).where(eq(orders.id, id)).returning();
    return result.length > 0;
  }

  async getBids(): Promise<Bid[]> {
    return await db.select().from(bids).orderBy(desc(bids.bidTime));
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
    return await db.select().from(assignments).orderBy(desc(assignments.assignedDateTime));
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [created] = await db.insert(assignments).values(assignment).returning();
    return created;
  }

  async updateAssignment(id: string, data: Partial<InsertAssignment>): Promise<Assignment | undefined> {
    const [updated] = await db.update(assignments).set(data).where(eq(assignments.id, id)).returning();
    return updated;
  }

  async getQueueConfig(): Promise<QueueConfig | undefined> {
    const results = await db.select().from(queueConfig);
    if (results.length === 0) {
      const [created] = await db.insert(queueConfig).values({
        id: "default",
        marginWeight: "0.20",
        capacityWeight: "0.15",
        tierWeight: "0.10",
        fairnessWeight: "0.15",
        newGrinderWeight: "0.10",
        reliabilityWeight: "0.10",
        qualityWeight: "0.10",
        riskWeight: "0.10",
        emergencyBoost: "0.25",
        largeOrderThreshold: "500",
        largeOrderEliteBoost: "0.15",
      }).returning();
      return created;
    }
    return results[0];
  }

  async upsertQueueConfig(config: InsertQueueConfig): Promise<QueueConfig> {
    const existing = await this.getQueueConfig();
    if (existing) {
      const [updated] = await db.update(queueConfig).set(config).where(eq(queueConfig.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(queueConfig).values({ id: "default", ...config }).returning();
    return created;
  }

  async getAuditLogs(limit = 100, entityType?: string): Promise<AuditLog[]> {
    if (entityType) {
      return await db.select().from(auditLogs)
        .where(eq(auditLogs.entityType, entityType))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);
    }
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
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

  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const allOrders = await db.select().from(orders);
    const allAssignments = await db.select().from(assignments);
    const allGrinders = await db.select().from(grinders);
    const allBids = await db.select().from(bids);

    const completedAssignments = allAssignments.filter(a => a.status === "Completed");
    const activeAssignments = allAssignments.filter(a => a.status === "Active");

    let totalRevenue = 0;
    let totalGrinderPayouts = 0;
    let totalCompanyProfit = 0;

    for (const a of completedAssignments) {
      const orderPrice = Number(a.orderPrice) || 0;
      const grinderEarnings = Number(a.grinderEarnings) || Number(a.bidAmount) || 0;
      totalRevenue += orderPrice;
      totalGrinderPayouts += grinderEarnings;
      totalCompanyProfit += Number(a.companyProfit) || (orderPrice - grinderEarnings);
    }

    for (const a of activeAssignments) {
      const orderPrice = Number(a.orderPrice) || 0;
      const grinderEarnings = Number(a.grinderEarnings) || Number(a.bidAmount) || 0;
      totalRevenue += orderPrice;
      totalGrinderPayouts += grinderEarnings;
      totalCompanyProfit += Number(a.companyProfit) || (orderPrice - grinderEarnings);
    }

    const avgMargin = totalRevenue > 0 ? (totalCompanyProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalGrinderPayouts,
      totalCompanyProfit,
      avgMargin,
      totalOrders: allOrders.length,
      completedOrders: allOrders.filter(o => o.status === "Completed").length,
      activeOrders: allOrders.filter(o => o.status === "Assigned" || o.status === "In Progress").length,
      openOrders: allOrders.filter(o => o.status === "Open").length,
      totalGrinders: allGrinders.length,
      availableGrinders: allGrinders.filter(g => g.activeOrders < g.capacity).length,
      pendingBids: allBids.filter(b => b.status === "Pending").length,
      acceptedBids: allBids.filter(b => b.status === "Accepted").length,
      activeAssignments: activeAssignments.length,
      completedAssignments: completedAssignments.length,
    };
  }

  async getSuggestionsForOrder(orderId: string): Promise<SuggestionResult[]> {
    const order = await this.getOrder(orderId);
    if (!order) return [];

    const config = await this.getQueueConfig();
    if (!config) return [];

    const allGrinders = await this.getGrinders();
    const allBids = await this.getBids();
    const orderBids = allBids.filter(b => b.orderId === orderId && b.status === "Pending");

    const availableGrinders = allGrinders.filter(g => g.activeOrders < g.capacity && g.strikes < 3);
    
    const orderPrice = Number(order.customerPrice) || 0;
    const isEmergency = order.isEmergency;
    const isLargeOrder = orderPrice >= Number(config.largeOrderThreshold);

    const results: SuggestionResult[] = [];

    for (const g of availableGrinders) {
      const grinderBid = orderBids.find(b => b.grinderId === g.id);
      const bidAmount = grinderBid ? Number(grinderBid.bidAmount) : 0;

      const marginScore = bidAmount > 0 && orderPrice > 0 
        ? Math.min(1, (orderPrice - bidAmount) / orderPrice) 
        : 0;

      const capacityScore = 1 - (g.activeOrders / g.capacity);

      let tierScore = 0;
      if (g.category === "Elite Grinder" || g.tier === "Elite") tierScore = 1;
      else if (g.category === "VC Grinder") tierScore = 0.6;
      else if (g.category === "Event Grinder") tierScore = 0.5;
      else tierScore = 0.3;

      const now = Date.now();
      const lastAssigned = g.lastAssigned ? new Date(g.lastAssigned).getTime() : 0;
      const daysSinceAssigned = lastAssigned > 0 ? (now - lastAssigned) / (1000 * 60 * 60 * 24) : 30;
      const fairnessScore = Math.min(1, daysSinceAssigned / 14);

      const newGrinderScore = g.completedOrders === 0 ? 1 : 0;

      const onTimeRate = Number(g.onTimeRate) || 0;
      const completionRate = Number(g.completionRate) || 1;
      const reassignPenalty = g.reassignmentCount > 0 ? Math.max(0, 1 - (g.reassignmentCount * 0.2)) : 1;
      const reliabilityScore = (onTimeRate * 0.4 + completionRate * 0.4 + reassignPenalty * 0.2);

      const qualityScore = Number(g.avgQualityRating) ? Number(g.avgQualityRating) / 5 : 0.5;

      const strikePenalty = g.strikes / 3;
      const cancelPenalty = Number(g.cancelRate) || 0;
      const riskScore = Math.max(0, 1 - strikePenalty - cancelPenalty * 0.5);

      const w = {
        margin: Number(config.marginWeight),
        capacity: Number(config.capacityWeight),
        tier: Number(config.tierWeight),
        fairness: Number(config.fairnessWeight),
        newGrinder: Number(config.newGrinderWeight),
        reliability: Number(config.reliabilityWeight),
        quality: Number(config.qualityWeight),
        risk: Number(config.riskWeight),
      };

      const totalWeighted = 
        marginScore * w.margin +
        capacityScore * w.capacity +
        tierScore * w.tier +
        fairnessScore * w.fairness +
        newGrinderScore * w.newGrinder +
        reliabilityScore * w.reliability +
        qualityScore * w.quality +
        riskScore * w.risk;

      let finalScore = totalWeighted;
      if (isEmergency) finalScore *= (1 + Number(config.emergencyBoost));
      if (isLargeOrder && (g.category === "Elite Grinder" || g.tier === "Elite")) {
        finalScore *= (1 + Number(config.largeOrderEliteBoost));
      }

      results.push({
        grinderId: g.id,
        grinderName: g.name,
        category: g.category,
        tier: g.tier,
        scores: {
          margin: Math.round(marginScore * 100) / 100,
          capacity: Math.round(capacityScore * 100) / 100,
          tier: Math.round(tierScore * 100) / 100,
          fairness: Math.round(fairnessScore * 100) / 100,
          newGrinder: Math.round(newGrinderScore * 100) / 100,
          reliability: Math.round(reliabilityScore * 100) / 100,
          quality: Math.round(qualityScore * 100) / 100,
          risk: Math.round(riskScore * 100) / 100,
          total: Math.round(totalWeighted * 100) / 100,
          finalScore: Math.round(finalScore * 100) / 100,
        },
        bidId: grinderBid?.id,
        bidAmount: grinderBid?.bidAmount,
        activeOrders: g.activeOrders,
        capacity: g.capacity,
        strikes: g.strikes,
      });
    }

    results.sort((a, b) => b.scores.finalScore - a.scores.finalScore);
    return results;
  }

  async getEmergencyQueue(): Promise<SuggestionResult[]> {
    const openOrders = (await this.getOrders()).filter(o => o.status === "Open");
    if (openOrders.length === 0) return [];

    const allSuggestions: SuggestionResult[] = [];
    
    for (const order of openOrders) {
      const suggestions = await this.getSuggestionsForOrder(order.id);
      if (suggestions.length > 0) {
        allSuggestions.push(suggestions[0]);
      }
    }

    allSuggestions.sort((a, b) => b.scores.finalScore - a.scores.finalScore);
    return allSuggestions.slice(0, 20);
  }

  async getTopQueueItems() {
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
