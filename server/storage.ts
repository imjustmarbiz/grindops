import { db } from "./db";
import { 
  services, grinders, orders, bids, assignments, queueConfig, auditLogs,
  orderUpdates, payoutRequests, eliteRequests, staffAlerts, strikeLogs, grinderPayoutMethods,
  activityCheckpoints, performanceReports, messageThreads, messages, notifications,
  type Service, type InsertService,
  type Grinder, type InsertGrinder,
  type Order, type InsertOrder,
  type Bid, type InsertBid,
  type Assignment, type InsertAssignment,
  type QueueConfig, type InsertQueueConfig,
  type AuditLog, type InsertAuditLog,
  type OrderUpdate, type InsertOrderUpdate,
  type ActivityCheckpoint, type InsertActivityCheckpoint,
  type PerformanceReport, type InsertPerformanceReport,
  type PayoutRequest, type InsertPayoutRequest,
  type GrinderPayoutMethod, type InsertGrinderPayoutMethod,
  type EliteRequest, type InsertEliteRequest,
  type StaffAlert, type InsertStaffAlert,
  type StrikeLog, type InsertStrikeLog,
  type MessageThread, type InsertMessageThread,
  type Message, type InsertMessage,
  type Notification, type InsertNotification,
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
  deleteGrinder(id: string): Promise<boolean>;
  softRemoveGrinder(id: string, removedBy: string): Promise<Grinder | undefined>;
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
  getBid(id: string): Promise<Bid | undefined>;
  getBidByProposalId(mgtProposalId: number): Promise<Bid | undefined>;
  createBid(bid: InsertBid): Promise<Bid>;
  upsertBidByProposalId(mgtProposalId: number, data: Partial<InsertBid>): Promise<Bid>;
  updateBidStatus(id: string, status: string, acceptedBy?: string): Promise<Bid | undefined>;

  getAssignments(): Promise<Assignment[]>;
  getAssignment(id: string): Promise<Assignment | undefined>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: string, data: Partial<InsertAssignment>): Promise<Assignment | undefined>;
  replaceGrinder(assignmentId: string, data: { replacementGrinderId: string; originalGrinderPay: string; replacementGrinderPay: string; reason?: string }): Promise<Assignment | undefined>;

  getQueueConfig(): Promise<QueueConfig | undefined>;
  upsertQueueConfig(config: InsertQueueConfig): Promise<QueueConfig>;

  getAuditLogs(limit?: number, entityType?: string): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  getDashboardStats(): Promise<DashboardStats>;
  getAnalyticsSummary(): Promise<AnalyticsSummary>;
  getSuggestionsForOrder(orderId: string): Promise<SuggestionResult[]>;
  getEmergencyQueue(): Promise<SuggestionResult[]>;

  getOrderUpdates(grinderId?: string): Promise<OrderUpdate[]>;
  createOrderUpdate(update: InsertOrderUpdate): Promise<OrderUpdate>;

  getPayoutRequests(grinderId?: string): Promise<PayoutRequest[]>;
  getPayoutRequest(id: string): Promise<PayoutRequest | undefined>;
  createPayoutRequest(request: InsertPayoutRequest): Promise<PayoutRequest>;
  updatePayoutRequest(id: string, data: Partial<InsertPayoutRequest & { reviewedAt: Date; paidAt: Date; grinderApprovedAt: Date; disputeReason: string | null; requestedPlatform: string | null; requestedDetails: string | null; requestedAmount: string | null }>): Promise<PayoutRequest | undefined>;

  updateBid(id: string, data: Partial<InsertBid>): Promise<Bid | undefined>;

  getEliteRequests(grinderId?: string): Promise<EliteRequest[]>;
  createEliteRequest(request: InsertEliteRequest): Promise<EliteRequest>;
  updateEliteRequest(id: string, data: Partial<EliteRequest>): Promise<EliteRequest | undefined>;

  getStaffAlerts(grinderId?: string): Promise<StaffAlert[]>;
  createStaffAlert(alert: InsertStaffAlert): Promise<StaffAlert>;
  markAlertRead(alertId: string, grinderId: string): Promise<void>;
  deleteStaffAlert(id: string): Promise<boolean>;

  getStrikeLogs(grinderId?: string): Promise<StrikeLog[]>;
  createStrikeLog(log: InsertStrikeLog): Promise<StrikeLog>;
  updateStrikeLog(id: string, data: Partial<StrikeLog>): Promise<void>;
  acknowledgeStrike(id: string): Promise<void>;

  getActivityCheckpoints(assignmentId?: string, grinderId?: string): Promise<ActivityCheckpoint[]>;
  createActivityCheckpoint(checkpoint: InsertActivityCheckpoint): Promise<ActivityCheckpoint>;
  updateActivityCheckpoint(id: string, data: Partial<ActivityCheckpoint>): Promise<ActivityCheckpoint | undefined>;

  getPerformanceReports(grinderId?: string): Promise<PerformanceReport[]>;
  getPerformanceReport(id: string): Promise<PerformanceReport | undefined>;
  createPerformanceReport(report: InsertPerformanceReport): Promise<PerformanceReport>;
  updatePerformanceReport(id: string, data: Partial<PerformanceReport>): Promise<PerformanceReport | undefined>;

  updateOrderUpdate(id: string, data: Partial<OrderUpdate>): Promise<OrderUpdate | undefined>;

  getThreadsForUser(userId: string): Promise<MessageThread[]>;
  getOrCreateThread(data: InsertMessageThread): Promise<MessageThread>;
  getMessagesForThread(threadId: string): Promise<Message[]>;
  createMessage(msg: InsertMessage): Promise<Message>;
  markThreadRead(threadId: string, userId: string): Promise<void>;

  getNotificationsForUser(userId: string, role: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(notificationId: string, userId: string): Promise<void>;
}

const BIDDING_WINDOW_MS = 10 * 60 * 1000;

export async function startBiddingTimerIfFirst(orderId: string): Promise<boolean> {
  const now = new Date();
  const closesAt = new Date(now.getTime() + BIDDING_WINDOW_MS);
  const result = await db.update(orders).set({
    firstBidAt: now,
    biddingClosesAt: closesAt,
  }).where(
    and(
      eq(orders.id, orderId),
      eq(orders.status, "Open"),
      sql`${orders.firstBidAt} IS NULL`
    )
  ).returning();

  if (result.length > 0) {
    console.log(`[bidding-timer] Started 10-min countdown for order ${orderId}, closes at ${closesAt.toISOString()}`);
    return true;
  }
  return false;
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

  async deleteGrinder(id: string): Promise<boolean> {
    await db.delete(bids).where(eq(bids.grinderId, id));
    await db.delete(assignments).where(eq(assignments.grinderId, id));
    await db.delete(strikeLogs).where(eq(strikeLogs.grinderId, id));
    await db.delete(eliteRequests).where(eq(eliteRequests.grinderId, id));
    await db.delete(orderUpdates).where(eq(orderUpdates.grinderId, id));
    await db.delete(payoutRequests).where(eq(payoutRequests.grinderId, id));
    await db.delete(grinderPayoutMethods).where(eq(grinderPayoutMethods.grinderId, id));
    await db.delete(staffAlerts).where(eq(staffAlerts.grinderId, id));
    const [deleted] = await db.delete(grinders).where(eq(grinders.id, id)).returning();
    return !!deleted;
  }

  async softRemoveGrinder(id: string, removedBy: string): Promise<Grinder | undefined> {
    const [updated] = await db.update(grinders).set({
      isRemoved: true,
      removedAt: new Date(),
      removedBy,
      availabilityStatus: "removed",
    }).where(eq(grinders.id, id)).returning();
    return updated;
  }

  async upsertGrinderByDiscordId(discordUserId: string, data: Partial<InsertGrinder>): Promise<Grinder> {
    const existing = await this.getGrinderByDiscordId(discordUserId);
    if (existing) {
      const updateData: Record<string, any> = {};
      if (data.name && data.name !== "Unknown") updateData.name = data.name;
      else if (data.name && existing.name === "Unknown") updateData.name = data.name;
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
    const setData: any = { status };
    if (status === "Completed") {
      setData.completedAt = new Date();
    }
    if (status === "Need Replacement") {
      setData.isEmergency = true;
      setData.assignedGrinderId = null;
      setData.acceptedBidId = null;
      setData.firstBidAt = null;
      setData.biddingClosesAt = null;
      setData.biddingNotifiedStages = [];
      setData.status = "Open";
    }
    const [updated] = await db.update(orders).set(setData).where(eq(orders.id, id)).returning();
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

  async getBid(id: string): Promise<Bid | undefined> {
    const [bid] = await db.select().from(bids).where(eq(bids.id, id));
    return bid;
  }

  async getBidByProposalId(mgtProposalId: number): Promise<Bid | undefined> {
    const [bid] = await db.select().from(bids).where(eq(bids.mgtProposalId, mgtProposalId));
    return bid;
  }

  async createBid(bid: InsertBid): Promise<Bid> {
    const [created] = await db.insert(bids).values(bid).returning();
    await startBiddingTimerIfFirst(created.orderId);
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
    if (created.orderId !== "UNKNOWN") {
      await startBiddingTimerIfFirst(created.orderId);
    }
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

  async getAssignment(id: string): Promise<Assignment | undefined> {
    const [result] = await db.select().from(assignments).where(eq(assignments.id, id));
    return result;
  }

  async updateAssignment(id: string, data: Partial<InsertAssignment>): Promise<Assignment | undefined> {
    const [updated] = await db.update(assignments).set(data).where(eq(assignments.id, id)).returning();
    return updated;
  }

  async replaceGrinder(assignmentId: string, data: { replacementGrinderId: string; originalGrinderPay: string; replacementGrinderPay: string; reason?: string }): Promise<Assignment | undefined> {
    const assignment = await this.getAssignment(assignmentId);
    if (!assignment) return undefined;

    const originalGrinderId = assignment.grinderId;

    const [updated] = await db.update(assignments).set({
      grinderId: data.replacementGrinderId,
      originalGrinderId: originalGrinderId,
      replacementGrinderId: data.replacementGrinderId,
      originalGrinderPay: data.originalGrinderPay,
      replacementGrinderPay: data.replacementGrinderPay,
      grinderEarnings: data.replacementGrinderPay,
      replacedAt: new Date(),
      replacementReason: data.reason || null,
      wasReassigned: true,
    }).where(eq(assignments.id, assignmentId)).returning();

    const origPay = Number(data.originalGrinderPay) || 0;
    const replPay = Number(data.replacementGrinderPay) || 0;

    const originalGrinder = await this.getGrinder(originalGrinderId);
    if (originalGrinder) {
      const newActive = Math.max(0, originalGrinder.activeOrders - 1);
      const newEarnings = (Number(originalGrinder.totalEarnings) + origPay).toFixed(2);
      const allBids = await this.getBids();
      const origBids = allBids.filter(b => b.grinderId === originalGrinderId);
      const origAccepted = origBids.filter(b => b.status === "Accepted").length;
      const origWinRate = origBids.length > 0 ? ((origAccepted / origBids.length) * 100).toFixed(0) : originalGrinder.winRate;
      const origUtilization = originalGrinder.capacity > 0 ? ((newActive / originalGrinder.capacity) * 100).toFixed(0) : "0";
      await this.updateGrinder(originalGrinderId, {
        activeOrders: newActive,
        reassignmentCount: originalGrinder.reassignmentCount + 1,
        totalEarnings: newEarnings,
        winRate: origWinRate,
        utilization: origUtilization,
      });
    }

    const replacementGrinder = await this.getGrinder(data.replacementGrinderId);
    if (replacementGrinder) {
      const newReplEarnings = (Number(replacementGrinder.totalEarnings) + replPay).toFixed(2);
      const newReplActive = replacementGrinder.activeOrders + 1;
      const replUtilization = replacementGrinder.capacity > 0 ? ((newReplActive / replacementGrinder.capacity) * 100).toFixed(0) : "0";
      await this.updateGrinder(data.replacementGrinderId, {
        activeOrders: newReplActive,
        totalOrders: replacementGrinder.totalOrders + 1,
        totalEarnings: newReplEarnings,
        lastAssigned: new Date(),
        utilization: replUtilization,
      });
    }

    const order = assignment.orderId ? await this.getOrder(assignment.orderId) : null;
    if (order) {
      const orderPrice = Number(order.customerPrice) || 0;
      const totalGrinderCost = origPay + replPay;
      const newProfit = orderPrice - totalGrinderCost;
      const newMarginPct = orderPrice > 0 ? ((newProfit / orderPrice) * 100).toFixed(2) : "0";

      await this.updateOrder(order.id, {
        assignedGrinderId: data.replacementGrinderId,
        companyProfit: newProfit.toFixed(2),
      });

      await db.update(assignments).set({
        margin: newProfit.toFixed(2),
        marginPct: newMarginPct,
        companyProfit: newProfit.toFixed(2),
      }).where(eq(assignments.id, assignmentId));
    }

    try {
      const replBidId = `BID-${assignmentId}-repl-${Date.now().toString(36)}`;
      await this.createBid({
        id: replBidId,
        orderId: assignment.orderId,
        grinderId: data.replacementGrinderId,
        bidAmount: replPay.toFixed(2),
        bidTime: new Date(),
        estDeliveryDate: assignment.dueDateTime || (order?.orderDueDate) || new Date(),
        timeline: "Replacement",
        canStart: "Immediately",
        qualityScore: null,
        margin: order ? (Number(order.customerPrice) - replPay).toFixed(2) : null,
        marginPct: order && Number(order.customerPrice) > 0 ? (((Number(order.customerPrice) - replPay) / Number(order.customerPrice)) * 100).toFixed(2) : null,
        notes: `Replacement grinder bid for assignment ${assignmentId}`,
        status: "Accepted",
        acceptedBy: "replacement",
      });
    } catch (e: any) {
      if (!e.message?.includes("duplicate")) {
        console.error(`[replace] Failed to create replacement bid:`, e.message);
      }
    }

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

    const nonCancelledOrders = allOrders.filter(o => o.status !== "Cancelled");
    for (const o of nonCancelledOrders) {
      totalRevenue += Number(o.customerPrice) || 0;
    }

    for (const a of [...completedAssignments, ...activeAssignments]) {
      const grinderEarnings = Number(a.grinderEarnings) || Number(a.bidAmount) || 0;
      totalGrinderPayouts += grinderEarnings;
      const orderPrice = Number(a.orderPrice) || 0;
      totalCompanyProfit += Number(a.companyProfit) || (orderPrice - grinderEarnings);
    }

    const avgMargin = totalRevenue > 0 ? (totalCompanyProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalGrinderPayouts,
      totalCompanyProfit,
      avgMargin,
      totalOrders: allOrders.length,
      completedOrders: allOrders.filter(o => o.status === "Completed" || o.status === "Paid Out").length,
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

      const grinderCreatedAt = (g as any).createdAt ? new Date((g as any).createdAt).getTime() : 0;
      const daysSinceCreated = grinderCreatedAt > 0 ? (now - grinderCreatedAt) / (1000 * 60 * 60 * 24) : 999;
      const hasNoAssignments = g.totalOrders === 0;
      const newGrinderScore = (hasNoAssignments && daysSinceCreated < 14) ? 1 : 0;

      const onTimeRate = (Number(g.onTimeRate) || 0) / 100;
      const completionRate = (Number(g.completionRate) || 100) / 100;
      const reassignPenalty = g.reassignmentCount > 0 ? Math.max(0, 1 - (g.reassignmentCount * 0.2)) : 1;
      const reliabilityScore = (onTimeRate * 0.4 + completionRate * 0.4 + reassignPenalty * 0.2);

      const qualityScore = Number(g.avgQualityRating) ? Number(g.avgQualityRating) / 100 : 0.5;

      const strikePenalty = g.strikes / 3;
      const cancelPenalty = (Number(g.cancelRate) || 0) / 100;
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

  async getOrderUpdates(grinderId?: string): Promise<OrderUpdate[]> {
    if (grinderId) {
      return await db.select().from(orderUpdates).where(eq(orderUpdates.grinderId, grinderId)).orderBy(desc(orderUpdates.createdAt));
    }
    return await db.select().from(orderUpdates).orderBy(desc(orderUpdates.createdAt));
  }

  async createOrderUpdate(update: InsertOrderUpdate): Promise<OrderUpdate> {
    const [created] = await db.insert(orderUpdates).values(update).returning();
    return created;
  }

  async getPayoutRequests(grinderId?: string): Promise<PayoutRequest[]> {
    if (grinderId) {
      return await db.select().from(payoutRequests).where(eq(payoutRequests.grinderId, grinderId)).orderBy(desc(payoutRequests.createdAt));
    }
    return await db.select().from(payoutRequests).orderBy(desc(payoutRequests.createdAt));
  }

  async getPayoutRequest(id: string): Promise<PayoutRequest | undefined> {
    const [result] = await db.select().from(payoutRequests).where(eq(payoutRequests.id, id));
    return result;
  }

  async createPayoutRequest(request: InsertPayoutRequest): Promise<PayoutRequest> {
    const [created] = await db.insert(payoutRequests).values(request).returning();
    return created;
  }

  async updatePayoutRequest(id: string, data: Partial<InsertPayoutRequest & { reviewedAt: Date; paidAt: Date; grinderApprovedAt: Date; disputeReason: string | null; requestedPlatform: string | null; requestedDetails: string | null; requestedAmount: string | null }>): Promise<PayoutRequest | undefined> {
    const [updated] = await db.update(payoutRequests).set(data).where(eq(payoutRequests.id, id)).returning();
    return updated;
  }

  async getGrinderPayoutMethods(grinderId: string): Promise<GrinderPayoutMethod[]> {
    return await db.select().from(grinderPayoutMethods).where(eq(grinderPayoutMethods.grinderId, grinderId)).orderBy(desc(grinderPayoutMethods.createdAt));
  }

  async createGrinderPayoutMethod(method: InsertGrinderPayoutMethod): Promise<GrinderPayoutMethod> {
    const [created] = await db.insert(grinderPayoutMethods).values(method).returning();
    return created;
  }

  async updateGrinderPayoutMethod(id: string, data: Partial<InsertGrinderPayoutMethod>): Promise<GrinderPayoutMethod | undefined> {
    const [updated] = await db.update(grinderPayoutMethods).set({ ...data, updatedAt: new Date() }).where(eq(grinderPayoutMethods.id, id)).returning();
    return updated;
  }

  async deleteGrinderPayoutMethod(id: string): Promise<void> {
    await db.delete(grinderPayoutMethods).where(eq(grinderPayoutMethods.id, id));
  }

  async updateBid(id: string, data: Partial<InsertBid>): Promise<Bid | undefined> {
    const [updated] = await db.update(bids).set(data).where(eq(bids.id, id)).returning();
    return updated;
  }

  async getEliteRequests(grinderId?: string): Promise<EliteRequest[]> {
    if (grinderId) {
      return await db.select().from(eliteRequests).where(eq(eliteRequests.grinderId, grinderId)).orderBy(desc(eliteRequests.requestedAt));
    }
    return await db.select().from(eliteRequests).orderBy(desc(eliteRequests.requestedAt));
  }

  async createEliteRequest(request: InsertEliteRequest): Promise<EliteRequest> {
    const [created] = await db.insert(eliteRequests).values(request).returning();
    return created;
  }

  async updateEliteRequest(id: string, data: Partial<EliteRequest>): Promise<EliteRequest | undefined> {
    const [updated] = await db.update(eliteRequests).set(data).where(eq(eliteRequests.id, id)).returning();
    return updated;
  }

  async getStaffAlerts(grinderId?: string): Promise<StaffAlert[]> {
    if (grinderId) {
      return await db.select().from(staffAlerts)
        .where(or(eq(staffAlerts.targetType, "all"), eq(staffAlerts.grinderId, grinderId)))
        .orderBy(desc(staffAlerts.createdAt));
    }
    return await db.select().from(staffAlerts).orderBy(desc(staffAlerts.createdAt));
  }

  async createStaffAlert(alert: InsertStaffAlert): Promise<StaffAlert> {
    const [created] = await db.insert(staffAlerts).values(alert).returning();
    return created;
  }

  async markAlertRead(alertId: string, grinderId: string): Promise<void> {
    await db.execute(sql`UPDATE staff_alerts SET read_by = read_by || ${JSON.stringify([grinderId])}::jsonb WHERE id = ${alertId} AND NOT read_by @> ${JSON.stringify([grinderId])}::jsonb`);
  }

  async deleteStaffAlert(id: string): Promise<boolean> {
    const result = await db.delete(staffAlerts).where(eq(staffAlerts.id, id)).returning();
    return result.length > 0;
  }

  async getStrikeLogs(grinderId?: string): Promise<StrikeLog[]> {
    if (grinderId) {
      return await db.select().from(strikeLogs).where(eq(strikeLogs.grinderId, grinderId)).orderBy(desc(strikeLogs.createdAt));
    }
    return await db.select().from(strikeLogs).orderBy(desc(strikeLogs.createdAt));
  }

  async createStrikeLog(log: InsertStrikeLog): Promise<StrikeLog> {
    const [created] = await db.insert(strikeLogs).values(log).returning();
    return created;
  }

  async updateStrikeLog(id: string, data: Partial<StrikeLog>): Promise<void> {
    await db.update(strikeLogs).set(data).where(eq(strikeLogs.id, id));
  }

  async acknowledgeStrike(id: string): Promise<void> {
    await db.update(strikeLogs).set({ acknowledgedAt: new Date() }).where(eq(strikeLogs.id, id));
  }

  async getActivityCheckpoints(assignmentId?: string, grinderId?: string): Promise<ActivityCheckpoint[]> {
    if (assignmentId) {
      return await db.select().from(activityCheckpoints).where(eq(activityCheckpoints.assignmentId, assignmentId)).orderBy(desc(activityCheckpoints.createdAt));
    }
    if (grinderId) {
      return await db.select().from(activityCheckpoints).where(eq(activityCheckpoints.grinderId, grinderId)).orderBy(desc(activityCheckpoints.createdAt));
    }
    return await db.select().from(activityCheckpoints).orderBy(desc(activityCheckpoints.createdAt));
  }

  async createActivityCheckpoint(checkpoint: InsertActivityCheckpoint): Promise<ActivityCheckpoint> {
    const [result] = await db.insert(activityCheckpoints).values(checkpoint).returning();
    return result;
  }

  async updateActivityCheckpoint(id: string, data: Partial<ActivityCheckpoint>): Promise<ActivityCheckpoint | undefined> {
    const [result] = await db.update(activityCheckpoints).set(data).where(eq(activityCheckpoints.id, id)).returning();
    return result;
  }

  async getPerformanceReports(grinderId?: string): Promise<PerformanceReport[]> {
    if (grinderId) {
      return await db.select().from(performanceReports).where(eq(performanceReports.grinderId, grinderId)).orderBy(desc(performanceReports.createdAt));
    }
    return await db.select().from(performanceReports).orderBy(desc(performanceReports.createdAt));
  }

  async getPerformanceReport(id: string): Promise<PerformanceReport | undefined> {
    const [result] = await db.select().from(performanceReports).where(eq(performanceReports.id, id));
    return result;
  }

  async createPerformanceReport(report: InsertPerformanceReport): Promise<PerformanceReport> {
    const [result] = await db.insert(performanceReports).values(report).returning();
    return result;
  }

  async updatePerformanceReport(id: string, data: Partial<PerformanceReport>): Promise<PerformanceReport | undefined> {
    const [result] = await db.update(performanceReports).set(data).where(eq(performanceReports.id, id)).returning();
    return result;
  }

  async deletePerformanceReport(id: string): Promise<boolean> {
    const result = await db.delete(performanceReports).where(eq(performanceReports.id, id)).returning();
    return result.length > 0;
  }

  async updateOrderUpdate(id: string, data: Partial<OrderUpdate>): Promise<OrderUpdate | undefined> {
    const [result] = await db.update(orderUpdates).set(data).where(eq(orderUpdates.id, id)).returning();
    return result;
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

  async getThreadsForUser(userId: string): Promise<MessageThread[]> {
    return await db.select().from(messageThreads)
      .where(or(eq(messageThreads.userAId, userId), eq(messageThreads.userBId, userId)))
      .orderBy(desc(messageThreads.lastMessageAt));
  }

  async getOrCreateThread(data: InsertMessageThread): Promise<MessageThread> {
    const existing = await db.select().from(messageThreads).where(
      or(
        and(eq(messageThreads.userAId, data.userAId), eq(messageThreads.userBId, data.userBId)),
        and(eq(messageThreads.userAId, data.userBId), eq(messageThreads.userBId, data.userAId))
      )
    );
    if (existing.length > 0) return existing[0];
    const [created] = await db.insert(messageThreads).values(data).returning();
    return created;
  }

  async getMessagesForThread(threadId: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(messages.createdAt);
  }

  async createMessage(msg: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(msg).returning();
    const thread = await db.select().from(messageThreads).where(eq(messageThreads.id, msg.threadId));
    if (thread.length > 0) {
      const t = thread[0];
      const isUserA = t.userAId === msg.senderUserId;
      await db.update(messageThreads).set({
        lastMessageText: msg.body.substring(0, 100),
        lastMessageAt: new Date(),
        ...(isUserA ? { userBUnread: t.userBUnread + 1 } : { userAUnread: t.userAUnread + 1 }),
      }).where(eq(messageThreads.id, msg.threadId));
    }
    return created;
  }

  async markThreadRead(threadId: string, userId: string): Promise<void> {
    const thread = await db.select().from(messageThreads).where(eq(messageThreads.id, threadId));
    if (thread.length > 0) {
      const t = thread[0];
      if (t.userAId === userId) {
        await db.update(messageThreads).set({ userAUnread: 0 }).where(eq(messageThreads.id, threadId));
      } else if (t.userBId === userId) {
        await db.update(messageThreads).set({ userBUnread: 0 }).where(eq(messageThreads.id, threadId));
      }
    }
  }

  async getNotificationsForUser(userId: string, role: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(
        or(
          eq(notifications.userId, userId),
          eq(notifications.roleScope, role),
          eq(notifications.roleScope, "all")
        )
      )
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationRead(notificationId: string, userId: string): Promise<void> {
    const existing = await db.select().from(notifications).where(eq(notifications.id, notificationId));
    if (existing.length > 0) {
      const currentReadBy = (existing[0].readBy as string[]) || [];
      if (!currentReadBy.includes(userId)) {
        await db.update(notifications).set({
          readBy: [...currentReadBy, userId],
        }).where(eq(notifications.id, notificationId));
      }
    }
  }
}

export const storage = new DatabaseStorage();
