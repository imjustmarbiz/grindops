import { db, pool } from "./db";
import { 
  services, grinders, orders, bids, assignments, queueConfig, auditLogs,
  orderUpdates, payoutRequests, eliteRequests, staffAlerts, strikeLogs, grinderPayoutMethods,
  activityCheckpoints, performanceReports, messageThreads, threadParticipants, messages, notifications, events,
  patchNotes, customerReviews, orderClaimRequests, reviewAccessCodes, grinderTasks, grinderBadges, staffBadges, staffTasks, staffActionDismissals,
  creatorBadges,
  deletionRequests, finePayments, businessWallets, walletTransactions, businessPayouts, walletTransfers, orderPaymentLinks,
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
  type StrikeAppeal, type InsertStrikeAppeal,
  strikeAppeals,
  type MessageThread, type InsertMessageThread,
  type ThreadParticipant, type InsertThreadParticipant,
  type Message, type InsertMessage,
  type Notification, type InsertNotification,
  type Event, type InsertEvent,
  type PatchNote, type InsertPatchNote,
  type CustomerReview, type InsertCustomerReview,
  type OrderClaimRequest, type InsertOrderClaimRequest,
  type ReviewAccessCode, type InsertReviewAccessCode,
  type GrinderTask, type InsertGrinderTask,
  type GrinderBadge, type InsertGrinderBadge,
  type StaffBadge, type InsertStaffBadge,
  type CreatorBadge, type InsertCreatorBadge,
  type StaffTask, type InsertStaffTask, type StaffActionDismissal,
  type DeletionRequest, type InsertDeletionRequest,
  type FinePayment, type InsertFinePayment,
  type BusinessWallet, type InsertBusinessWallet,
  type WalletTransaction, type InsertWalletTransaction,
  type BusinessPayout, type InsertBusinessPayout,
  type WalletTransfer, type InsertWalletTransfer,
  type OrderPaymentLink, type InsertOrderPaymentLink,
  type UserActivityLog, type InsertUserActivityLog, userActivityLogs,
  type Creator, type InsertCreator, creators,
  type CreatorPayoutDetailRequest, type InsertCreatorPayoutDetailRequest, creatorPayoutDetailRequests,
  type Quote, type InsertQuote, quotes,
  type AnalyticsSummary, type SuggestionResult, type DashboardStats,
  GRINDER_ROLES, ROLE_CAPACITY, ROLE_LABELS,
} from "@shared/schema";
import { eq, sql, desc, and, or, gte, lte, inArray } from "drizzle-orm";
import { DevStorage } from "./dev-storage";

export interface IStorage {
  getServices(): Promise<Service[]>;
  getServiceByName(name: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, data: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string): Promise<void>;

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
  getBidsForOrder(orderId: string): Promise<Bid[]>;
  getBid(id: string): Promise<Bid | undefined>;
  getBidByProposalId(mgtProposalId: number): Promise<Bid | undefined>;
  createBid(bid: InsertBid): Promise<Bid>;
  upsertBidByProposalId(mgtProposalId: number, data: Partial<InsertBid>): Promise<Bid>;
  updateBidStatus(id: string, status: string, acceptedBy?: string): Promise<Bid | undefined>;
  deleteBid(id: string): Promise<boolean>;

  getAssignments(): Promise<Assignment[]>;
  getAssignment(id: string): Promise<Assignment | undefined>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  deleteAssignment(id: string): Promise<boolean>;
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
  getFullQueue(): Promise<{ orderId: string; mgtOrderNumber: number | null; customerPrice: string; serviceId: string; platform: string; isEmergency: boolean; suggestions: SuggestionResult[] }[]>;

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
  getStrikeAppeals(grinderId?: string): Promise<StrikeAppeal[]>;
  createStrikeAppeal(appeal: InsertStrikeAppeal): Promise<StrikeAppeal>;
  updateStrikeAppeal(id: string, data: Partial<StrikeAppeal>): Promise<void>;

  getActivityCheckpoints(assignmentId?: string, grinderId?: string): Promise<ActivityCheckpoint[]>;
  createActivityCheckpoint(checkpoint: InsertActivityCheckpoint): Promise<ActivityCheckpoint>;
  updateActivityCheckpoint(id: string, data: Partial<ActivityCheckpoint>): Promise<ActivityCheckpoint | undefined>;

  getPerformanceReports(grinderId?: string): Promise<PerformanceReport[]>;
  getPerformanceReport(id: string): Promise<PerformanceReport | undefined>;
  createPerformanceReport(report: InsertPerformanceReport): Promise<PerformanceReport>;
  updatePerformanceReport(id: string, data: Partial<PerformanceReport>): Promise<PerformanceReport | undefined>;

  updateOrderUpdate(id: string, data: Partial<OrderUpdate>): Promise<OrderUpdate | undefined>;

  getThreadsForUser(userId: string): Promise<(MessageThread & { participants: ThreadParticipant[] })[]>;
  createThread(data: InsertMessageThread, participants: InsertThreadParticipant[]): Promise<MessageThread & { participants: ThreadParticipant[] }>;
  getThread(threadId: string): Promise<(MessageThread & { participants: ThreadParticipant[] }) | undefined>;
  addParticipant(participant: InsertThreadParticipant): Promise<ThreadParticipant>;
  removeParticipant(threadId: string, userId: string): Promise<void>;
  getMessagesForThread(threadId: string): Promise<Message[]>;
  createMessage(msg: InsertMessage): Promise<Message>;
  deleteMessage(messageId: string): Promise<boolean>;
  deleteThread(threadId: string): Promise<boolean>;
  markThreadRead(threadId: string, userId: string): Promise<void>;

  getNotificationsForUser(userId: string, role: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(notificationId: string, userId: string): Promise<void>;

  getEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;

  getPatchNotes(publishedOnly?: boolean): Promise<PatchNote[]>;
  getPatchNote(id: string): Promise<PatchNote | undefined>;
  createPatchNote(note: InsertPatchNote): Promise<PatchNote>;
  updatePatchNote(id: string, data: Partial<PatchNote>): Promise<PatchNote | undefined>;
  deletePatchNote(id: string): Promise<boolean>;

  getCustomerReviews(grinderId?: string, status?: string): Promise<CustomerReview[]>;
  getCustomerReview(id: string): Promise<CustomerReview | undefined>;
  createCustomerReview(review: InsertCustomerReview): Promise<CustomerReview>;
  updateCustomerReview(id: string, data: Partial<CustomerReview>): Promise<CustomerReview | undefined>;

  getOrderClaimRequests(grinderId?: string, status?: string): Promise<OrderClaimRequest[]>;
  getOrderClaimRequest(id: string): Promise<OrderClaimRequest | undefined>;
  createOrderClaimRequest(request: InsertOrderClaimRequest): Promise<OrderClaimRequest>;
  updateOrderClaimRequest(id: string, data: Partial<OrderClaimRequest>): Promise<OrderClaimRequest | undefined>;

  getReviewAccessCodes(grinderId?: string): Promise<ReviewAccessCode[]>;
  getReviewAccessCode(id: string): Promise<ReviewAccessCode | undefined>;
  getReviewAccessCodeByCode(accessCode: string): Promise<ReviewAccessCode | undefined>;
  getReviewAccessCodeBySession(sessionToken: string): Promise<ReviewAccessCode | undefined>;
  createReviewAccessCode(code: InsertReviewAccessCode): Promise<ReviewAccessCode>;
  updateReviewAccessCode(id: string, data: Partial<ReviewAccessCode>): Promise<ReviewAccessCode | undefined>;

  getGrinderTasks(grinderId?: string): Promise<GrinderTask[]>;
  getGrinderTask(id: string): Promise<GrinderTask | undefined>;
  createGrinderTask(task: InsertGrinderTask): Promise<GrinderTask>;
  updateGrinderTask(id: string, data: Partial<GrinderTask>): Promise<GrinderTask | undefined>;
  deleteGrinderTask(id: string): Promise<boolean>;

  getGrinderBadges(grinderId?: string): Promise<GrinderBadge[]>;
  createGrinderBadge(badge: InsertGrinderBadge): Promise<GrinderBadge>;
  deleteGrinderBadge(id: string): Promise<boolean>;

  getStaffBadges(userId?: string): Promise<StaffBadge[]>;
  createStaffBadge(badge: InsertStaffBadge): Promise<StaffBadge>;
  deleteStaffBadge(id: string): Promise<boolean>;

  getCreatorBadges(creatorId?: string): Promise<CreatorBadge[]>;
  createCreatorBadge(badge: InsertCreatorBadge): Promise<CreatorBadge>;
  deleteCreatorBadge(id: string): Promise<boolean>;

  getStaffTasks(assignedTo?: string): Promise<StaffTask[]>;
  createStaffTask(task: InsertStaffTask): Promise<StaffTask>;
  updateStaffTask(id: string, data: Partial<StaffTask>): Promise<StaffTask | undefined>;
  getStaffActionDismissals(): Promise<StaffActionDismissal[]>;
  createStaffActionDismissal(data: { id: string; actionKey: string; dismissedBy: string; dismissedByName?: string }): Promise<StaffActionDismissal>;

  getDeletionRequests(status?: string): Promise<DeletionRequest[]>;
  createDeletionRequest(request: InsertDeletionRequest): Promise<DeletionRequest>;
  updateDeletionRequest(id: string, data: Partial<DeletionRequest>): Promise<DeletionRequest | undefined>;

  getFinePayments(grinderId?: string): Promise<FinePayment[]>;
  createFinePayment(payment: InsertFinePayment): Promise<FinePayment>;
  updateFinePayment(id: string, data: Partial<FinePayment>): Promise<FinePayment | undefined>;

  getWallets(): Promise<BusinessWallet[]>;
  getWallet(id: string): Promise<BusinessWallet | undefined>;
  createWallet(data: InsertBusinessWallet): Promise<BusinessWallet>;
  updateWallet(id: string, data: Partial<BusinessWallet>): Promise<BusinessWallet | undefined>;
  deleteWallet(id: string, preserveHistory: boolean): Promise<void>;

  getWalletTransactions(filters?: { walletId?: string; category?: string; type?: string; startDate?: Date; endDate?: Date; orderId?: string }): Promise<WalletTransaction[]>;
  createWalletTransaction(data: InsertWalletTransaction): Promise<WalletTransaction>;

  getBusinessPayouts(filters?: { status?: string; category?: string; recipientRole?: string; walletId?: string; startDate?: Date; endDate?: Date }): Promise<BusinessPayout[]>;
  createBusinessPayout(data: InsertBusinessPayout): Promise<BusinessPayout>;
  updateBusinessPayout(id: string, data: Partial<BusinessPayout>): Promise<BusinessPayout | undefined>;

  getWalletTransfers(): Promise<WalletTransfer[]>;
  createWalletTransfer(data: InsertWalletTransfer): Promise<WalletTransfer>;
  updateWalletTransfer(id: string, data: Partial<WalletTransfer>): Promise<WalletTransfer | undefined>;

  getOrderPaymentLinks(orderId?: string): Promise<OrderPaymentLink[]>;
  createOrderPaymentLink(data: InsertOrderPaymentLink): Promise<OrderPaymentLink>;
  updateOrderPaymentLink(id: string, data: Partial<OrderPaymentLink>): Promise<OrderPaymentLink | undefined>;

  getUserActivityLogs(filters?: { userId?: string; category?: string; action?: string; limit?: number }): Promise<UserActivityLog[]>;
  createUserActivityLog(log: InsertUserActivityLog): Promise<UserActivityLog>;

  getCreatorByUserId(userId: string): Promise<Creator | undefined>;
  getCreator(id: string): Promise<Creator | undefined>;
  createCreator(creator: InsertCreator): Promise<Creator>;
  updateCreator(id: string, data: Partial<InsertCreator>): Promise<Creator | undefined>;
  getCreators(): Promise<Creator[]>;

  getCreatorPayoutDetailRequests(creatorId?: string): Promise<CreatorPayoutDetailRequest[]>;
  getCreatorPayoutDetailRequest(id: string): Promise<CreatorPayoutDetailRequest | undefined>;
  createCreatorPayoutDetailRequest(data: InsertCreatorPayoutDetailRequest): Promise<CreatorPayoutDetailRequest>;
  updateCreatorPayoutDetailRequest(id: string, data: Partial<CreatorPayoutDetailRequest>): Promise<CreatorPayoutDetailRequest | undefined>;
  deleteCreatorPayoutDetailRequest(id: string): Promise<boolean>;

  getQuotes(limit?: number): Promise<Quote[]>;
  getQuote(id: string): Promise<Quote | undefined>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: string, data: Partial<InsertQuote>): Promise<Quote | undefined>;
  deleteQuote(id: string): Promise<boolean>;
}

const BIDDING_WINDOW_MS = 10 * 60 * 1000;

export async function startBiddingTimerIfFirst(orderId: string): Promise<boolean> {
  if (!process.env.DATABASE_URL || !db) return false;
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

  async updateService(id: string, data: Partial<InsertService>): Promise<Service | undefined> {
    const [updated] = await db.update(services).set(data).where(eq(services.id, id)).returning();
    return updated;
  }

  async deleteService(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
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
    await db.delete(activityCheckpoints).where(eq(activityCheckpoints.grinderId, id));
    await db.delete(performanceReports).where(eq(performanceReports.grinderId, id));
    await db.delete(orderUpdates).where(eq(orderUpdates.grinderId, id));
    await db.delete(orderClaimRequests).where(eq(orderClaimRequests.grinderId, id));
    await db.delete(reviewAccessCodes).where(eq(reviewAccessCodes.grinderId, id));
    await db.delete(customerReviews).where(eq(customerReviews.grinderId, id));
    await db.delete(grinderTasks).where(eq(grinderTasks.grinderId, id));
    await db.delete(grinderBadges).where(eq(grinderBadges.grinderId, id));
    await db.delete(payoutRequests).where(eq(payoutRequests.grinderId, id));
    await db.delete(strikeAppeals).where(eq(strikeAppeals.grinderId, id));
    await db.delete(strikeLogs).where(eq(strikeLogs.grinderId, id));
    await db.delete(bids).where(eq(bids.grinderId, id));
    await db.delete(assignments).where(eq(assignments.grinderId, id));
    await db.delete(eliteRequests).where(eq(eliteRequests.grinderId, id));
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
      if (data.customerPrice && data.customerPrice !== "0" && (!existing.customerPrice || existing.customerPrice === "0")) updateData.customerPrice = data.customerPrice;
      if (data.platform && !existing.platform) updateData.platform = data.platform;
      if (data.gamertag && !existing.gamertag) updateData.gamertag = data.gamertag;
      if (data.notes && !existing.notes) updateData.notes = data.notes;
      if (data.discordMessageId) updateData.discordMessageId = data.discordMessageId;
      if (data.discordBidLink && !existing.discordBidLink) updateData.discordBidLink = data.discordBidLink;
      if (data.orderBrief && !existing.orderBrief) updateData.orderBrief = data.orderBrief;
      if (data.serviceId && existing.serviceId === "UNKNOWN") updateData.serviceId = data.serviceId;
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
      displayId: `ORD-${String(mgtOrderNumber).padStart(2, '0')}`,
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
    } else if (status !== "Paid Out") {
      setData.completedAt = null;
    }
    if (status === "Need Replacement") {
      setData.isEmergency = true;
      setData.assignedGrinderId = null;
      setData.acceptedBidId = null;
      setData.firstBidAt = null;
      setData.biddingClosesAt = null;
      setData.biddingNotifiedStages = [];
    }
    const [updated] = await db.update(orders).set(setData).where(eq(orders.id, id)).returning();
    return updated;
  }

  async updateOrder(id: string, data: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set(data).where(eq(orders.id, id)).returning();
    return updated;
  }

  async deleteOrder(id: string): Promise<boolean> {
    await db.delete(activityCheckpoints).where(eq(activityCheckpoints.orderId, id));
    await db.delete(performanceReports).where(eq(performanceReports.orderId, id));
    await db.delete(orderUpdates).where(eq(orderUpdates.orderId, id));
    await db.delete(orderClaimRequests).where(eq(orderClaimRequests.orderId, id));
    await db.delete(payoutRequests).where(eq(payoutRequests.orderId, id));
    await db.delete(bids).where(eq(bids.orderId, id));
    await db.delete(assignments).where(eq(assignments.orderId, id));
    const result = await db.delete(orders).where(eq(orders.id, id)).returning();
    return result.length > 0;
  }

  async getBids(): Promise<Bid[]> {
    return await db.select().from(bids).orderBy(desc(bids.bidTime));
  }

  async getBidsForOrder(orderId: string): Promise<Bid[]> {
    return await db.select().from(bids).where(eq(bids.orderId, orderId)).orderBy(desc(bids.bidTime));
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
      if (data.estDeliveryDate) updateData.estDeliveryDate = data.estDeliveryDate;
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

  async deleteBid(id: string): Promise<boolean> {
    const result = await db.delete(bids).where(eq(bids.id, id)).returning();
    return result.length > 0;
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

  async deleteAssignment(id: string): Promise<boolean> {
    await db.delete(activityCheckpoints).where(eq(activityCheckpoints.assignmentId, id));
    await db.delete(performanceReports).where(eq(performanceReports.assignmentId, id));
    await db.delete(orderUpdates).where(eq(orderUpdates.assignmentId, id));
    await db.delete(payoutRequests).where(eq(payoutRequests.assignmentId, id));
    const result = await db.delete(assignments).where(eq(assignments.id, id)).returning();
    return result.length > 0;
  }

  async updateAssignment(id: string, data: Partial<InsertAssignment>): Promise<Assignment | undefined> {
    const [updated] = await db.update(assignments).set(data).where(eq(assignments.id, id)).returning();
    return updated;
  }

  async replaceGrinder(assignmentId: string, data: { replacementGrinderId: string; originalGrinderPay: string; replacementGrinderPay: string; reason?: string }): Promise<Assignment | undefined> {
    const assignment = await this.getAssignment(assignmentId);
    if (!assignment) return undefined;

    const originalGrinderId = assignment.grinderId;
    const priorOriginalPay = Number(assignment.originalGrinderPay || 0);
    const cumulativeOriginalPay = priorOriginalPay + (Number(data.originalGrinderPay) || 0);

    const [updated] = await db.update(assignments).set({
      grinderId: data.replacementGrinderId,
      originalGrinderId: assignment.originalGrinderId || originalGrinderId,
      replacementGrinderId: data.replacementGrinderId,
      originalGrinderPay: cumulativeOriginalPay.toFixed(2),
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
      const totalGrinderCost = cumulativeOriginalPay + replPay;
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
        creatorCommissionPercent: "10",
        creatorPayoutMethods: ["paypal"],
        quoteGeneratorCompanyPct: "70",
        quoteGeneratorGrinderPct: "30",
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
    const allFinePayments = await db.select().from(finePayments);

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

    const fineRevenue = allFinePayments
      .filter(fp => fp.status === "approved")
      .reduce((sum, fp) => sum + (Number(fp.amount) || 0), 0);

    totalCompanyProfit += fineRevenue;
    totalRevenue += fineRevenue;

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
      fineRevenue,
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

    const availableGrinders = allGrinders.filter(g => 
      !g.isRemoved && 
      !g.suspended && 
      g.availabilityStatus !== "unavailable" &&
      g.activeOrders < g.capacity && 
      g.strikes < 3
    );
    
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

      const capacityScore = g.capacity > 0 ? 1 - (g.activeOrders / g.capacity) : 0;

      let tierScore = 0;
      if (g.category === "Elite Grinder" || g.tier === "Elite") tierScore = 1;
      else if (g.category === "VC Grinder") tierScore = 0.6;
      else if (g.category === "Event Grinder") tierScore = 0.5;
      else tierScore = 0.3;

      const now = Date.now();
      const lastAssigned = g.lastAssigned ? new Date(g.lastAssigned).getTime() : 0;
      const daysSinceAssigned = lastAssigned > 0 ? (now - lastAssigned) / (1000 * 60 * 60 * 24) : 30;
      const fairnessScore = Math.min(1, daysSinceAssigned / 14);

      const completedOrders = g.completedOrders || 0;
      const newGrinderScore = completedOrders < 3 ? Math.max(0, 1 - (completedOrders / 3)) : 0;

      const hasHistory = g.totalOrders > 0;
      const onTimeRate = hasHistory ? (Number(g.onTimeRate) || 0) / 100 : 0.7;
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
        displayRole: g.displayRole,
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

  async getFullQueue(): Promise<{ orderId: string; mgtOrderNumber: number | null; customerPrice: string; serviceId: string; platform: string; isEmergency: boolean; suggestions: SuggestionResult[] }[]> {
    const openOrders = (await this.getOrders()).filter(o => o.status === "Open");
    if (openOrders.length === 0) return [];

    const results = [];
    for (const order of openOrders) {
      const suggestions = await this.getSuggestionsForOrder(order.id);
      results.push({
        orderId: order.id,
        mgtOrderNumber: order.mgtOrderNumber,
        customerPrice: String(order.customerPrice),
        serviceId: order.serviceId,
        platform: order.platform || "",
        isEmergency: order.isEmergency || false,
        suggestions: suggestions.slice(0, 5),
      });
    }
    return results;
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
    const existing = await db.select().from(staffAlerts).where(eq(staffAlerts.id, alertId));
    if (existing.length > 0) {
      const currentReadBy = (existing[0].readBy as string[]) || [];
      if (!currentReadBy.includes(grinderId)) {
        await db.update(staffAlerts).set({
          readBy: [...currentReadBy, grinderId],
        }).where(eq(staffAlerts.id, alertId));
      }
    }
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

  async getStrikeAppeals(grinderId?: string): Promise<StrikeAppeal[]> {
    if (grinderId) {
      return await db.select().from(strikeAppeals).where(eq(strikeAppeals.grinderId, grinderId)).orderBy(desc(strikeAppeals.createdAt));
    }
    return await db.select().from(strikeAppeals).orderBy(desc(strikeAppeals.createdAt));
  }

  async createStrikeAppeal(appeal: InsertStrikeAppeal): Promise<StrikeAppeal> {
    const [created] = await db.insert(strikeAppeals).values(appeal).returning();
    return created;
  }

  async updateStrikeAppeal(id: string, data: Partial<StrikeAppeal>): Promise<void> {
    await db.update(strikeAppeals).set(data).where(eq(strikeAppeals.id, id));
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

  async getThreadsForUser(userId: string): Promise<(MessageThread & { participants: ThreadParticipant[] })[]> {
    const userParticipations = await db.select().from(threadParticipants)
      .where(eq(threadParticipants.userId, userId));
    if (userParticipations.length === 0) return [];
    const threadIds = userParticipations.map(p => p.threadId);
    const threads = await db.select().from(messageThreads)
      .where(inArray(messageThreads.id, threadIds))
      .orderBy(desc(messageThreads.lastMessageAt));
    const allParticipants = await db.select().from(threadParticipants)
      .where(inArray(threadParticipants.threadId, threadIds));
    return threads.map(t => ({
      ...t,
      participants: allParticipants.filter(p => p.threadId === t.id),
    }));
  }

  async createThread(data: InsertMessageThread, participantData: InsertThreadParticipant[]): Promise<MessageThread & { participants: ThreadParticipant[] }> {
    const [created] = await db.insert(messageThreads).values(data).returning();
    const participants: ThreadParticipant[] = [];
    for (const p of participantData) {
      const [inserted] = await db.insert(threadParticipants).values({ ...p, threadId: created.id }).returning();
      participants.push(inserted);
    }
    return { ...created, participants };
  }

  async getThread(threadId: string): Promise<(MessageThread & { participants: ThreadParticipant[] }) | undefined> {
    const [thread] = await db.select().from(messageThreads).where(eq(messageThreads.id, threadId));
    if (!thread) return undefined;
    const participants = await db.select().from(threadParticipants)
      .where(eq(threadParticipants.threadId, threadId));
    return { ...thread, participants };
  }

  async addParticipant(participant: InsertThreadParticipant): Promise<ThreadParticipant> {
    const [created] = await db.insert(threadParticipants).values(participant).returning();
    return created;
  }

  async removeParticipant(threadId: string, userId: string): Promise<void> {
    await db.delete(threadParticipants)
      .where(and(eq(threadParticipants.threadId, threadId), eq(threadParticipants.userId, userId)));
  }

  async getMessagesForThread(threadId: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(messages.createdAt);
  }

  async createMessage(msg: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(msg).returning();
    await db.update(messageThreads).set({
      lastMessageText: msg.body.substring(0, 100),
      lastMessageAt: new Date(),
    }).where(eq(messageThreads.id, msg.threadId));
    const otherParticipants = await db.select().from(threadParticipants)
      .where(and(
        eq(threadParticipants.threadId, msg.threadId),
        sql`${threadParticipants.userId} != ${msg.senderUserId}`
      ));
    for (const p of otherParticipants) {
      await db.update(threadParticipants).set({
        unreadCount: p.unreadCount + 1,
      }).where(eq(threadParticipants.id, p.id));
    }
    return created;
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    const result = await db.delete(messages).where(eq(messages.id, messageId)).returning();
    return result.length > 0;
  }

  async deleteThread(threadId: string): Promise<boolean> {
    await db.delete(messages).where(eq(messages.threadId, threadId));
    await db.delete(threadParticipants).where(eq(threadParticipants.threadId, threadId));
    const result = await db.delete(messageThreads).where(eq(messageThreads.id, threadId)).returning();
    return result.length > 0;
  }

  async markThreadRead(threadId: string, userId: string): Promise<void> {
    await db.update(threadParticipants).set({ unreadCount: 0 })
      .where(and(eq(threadParticipants.threadId, threadId), eq(threadParticipants.userId, userId)));
  }

  async getNotificationsForUser(userId: string, role: string): Promise<Notification[]> {
    const conditions = [
      and(
        eq(notifications.userId, userId),
        or(
          eq(notifications.roleScope, "user"),
          eq(notifications.roleScope, role)
        )
      ),
      eq(notifications.roleScope, "all"),
    ];
    if (role === "owner" || role === "staff") {
      conditions.push(and(eq(notifications.roleScope, "staff"), sql`${notifications.userId} IS NULL`));
    }
    if (role === "owner") {
      conditions.push(and(eq(notifications.roleScope, "owner"), sql`${notifications.userId} IS NULL`));
    }
    if (role === "creator") {
      conditions.push(and(eq(notifications.roleScope, "creator"), sql`${notifications.userId} IS NULL`));
    }
    return await db.select().from(notifications)
      .where(or(...conditions))
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
  async getEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.startDate));
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [created] = await db.insert(events).values(event).returning();
    return created;
  }

  async updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updated] = await db.update(events)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return updated;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return true;
  }

  async getPatchNotes(publishedOnly?: boolean): Promise<PatchNote[]> {
    if (publishedOnly) {
      return await db.select().from(patchNotes)
        .where(eq(patchNotes.status, "published"))
        .orderBy(desc(patchNotes.publishedAt));
    }
    return await db.select().from(patchNotes).orderBy(desc(patchNotes.createdAt));
  }

  async getPatchNote(id: string): Promise<PatchNote | undefined> {
    const [note] = await db.select().from(patchNotes).where(eq(patchNotes.id, id));
    return note;
  }

  async createPatchNote(note: InsertPatchNote): Promise<PatchNote> {
    const [created] = await db.insert(patchNotes).values(note).returning();
    return created;
  }

  async updatePatchNote(id: string, data: Partial<PatchNote>): Promise<PatchNote | undefined> {
    const [updated] = await db.update(patchNotes).set(data).where(eq(patchNotes.id, id)).returning();
    return updated;
  }

  async deletePatchNote(id: string): Promise<boolean> {
    await db.delete(patchNotes).where(eq(patchNotes.id, id));
    return true;
  }

  async getCustomerReviews(grinderId?: string, status?: string): Promise<CustomerReview[]> {
    const conditions = [];
    if (grinderId) conditions.push(eq(customerReviews.grinderId, grinderId));
    if (status) conditions.push(eq(customerReviews.status, status));
    if (conditions.length > 0) {
      return await db.select().from(customerReviews)
        .where(and(...conditions))
        .orderBy(desc(customerReviews.createdAt));
    }
    return await db.select().from(customerReviews).orderBy(desc(customerReviews.createdAt));
  }

  async getCustomerReview(id: string): Promise<CustomerReview | undefined> {
    const [review] = await db.select().from(customerReviews).where(eq(customerReviews.id, id));
    return review;
  }

  async createCustomerReview(review: InsertCustomerReview): Promise<CustomerReview> {
    const [created] = await db.insert(customerReviews).values(review).returning();
    return created;
  }

  async updateCustomerReview(id: string, data: Partial<CustomerReview>): Promise<CustomerReview | undefined> {
    const [updated] = await db.update(customerReviews).set({ ...data, updatedAt: new Date() }).where(eq(customerReviews.id, id)).returning();
    return updated;
  }

  async getOrderClaimRequests(grinderId?: string, status?: string): Promise<OrderClaimRequest[]> {
    const conditions = [];
    if (grinderId) conditions.push(eq(orderClaimRequests.grinderId, grinderId));
    if (status) conditions.push(eq(orderClaimRequests.status, status));
    if (conditions.length > 0) {
      return await db.select().from(orderClaimRequests)
        .where(and(...conditions))
        .orderBy(desc(orderClaimRequests.requestedAt));
    }
    return await db.select().from(orderClaimRequests).orderBy(desc(orderClaimRequests.requestedAt));
  }

  async getOrderClaimRequest(id: string): Promise<OrderClaimRequest | undefined> {
    const [request] = await db.select().from(orderClaimRequests).where(eq(orderClaimRequests.id, id));
    return request;
  }

  async createOrderClaimRequest(request: InsertOrderClaimRequest): Promise<OrderClaimRequest> {
    const [created] = await db.insert(orderClaimRequests).values(request).returning();
    return created;
  }

  async updateOrderClaimRequest(id: string, data: Partial<OrderClaimRequest>): Promise<OrderClaimRequest | undefined> {
    const [updated] = await db.update(orderClaimRequests).set(data).where(eq(orderClaimRequests.id, id)).returning();
    return updated;
  }

  async getReviewAccessCodes(grinderId?: string): Promise<ReviewAccessCode[]> {
    if (grinderId) {
      return await db.select().from(reviewAccessCodes).where(eq(reviewAccessCodes.grinderId, grinderId)).orderBy(desc(reviewAccessCodes.createdAt));
    }
    return await db.select().from(reviewAccessCodes).orderBy(desc(reviewAccessCodes.createdAt));
  }

  async getReviewAccessCode(id: string): Promise<ReviewAccessCode | undefined> {
    const [code] = await db.select().from(reviewAccessCodes).where(eq(reviewAccessCodes.id, id));
    return code;
  }

  async getReviewAccessCodeByCode(accessCode: string): Promise<ReviewAccessCode | undefined> {
    const [code] = await db.select().from(reviewAccessCodes).where(eq(reviewAccessCodes.accessCode, accessCode));
    return code;
  }

  async getReviewAccessCodeBySession(sessionToken: string): Promise<ReviewAccessCode | undefined> {
    const [code] = await db.select().from(reviewAccessCodes).where(eq(reviewAccessCodes.sessionToken, sessionToken));
    return code;
  }

  async createReviewAccessCode(code: InsertReviewAccessCode): Promise<ReviewAccessCode> {
    const [created] = await db.insert(reviewAccessCodes).values(code).returning();
    return created;
  }

  async updateReviewAccessCode(id: string, data: Partial<ReviewAccessCode>): Promise<ReviewAccessCode | undefined> {
    const [updated] = await db.update(reviewAccessCodes).set(data).where(eq(reviewAccessCodes.id, id)).returning();
    return updated;
  }

  async getGrinderTasks(grinderId?: string): Promise<GrinderTask[]> {
    if (grinderId) {
      return await db.select().from(grinderTasks).where(eq(grinderTasks.grinderId, grinderId)).orderBy(desc(grinderTasks.createdAt));
    }
    return await db.select().from(grinderTasks).orderBy(desc(grinderTasks.createdAt));
  }

  async getGrinderTask(id: string): Promise<GrinderTask | undefined> {
    const [task] = await db.select().from(grinderTasks).where(eq(grinderTasks.id, id));
    return task;
  }

  async createGrinderTask(task: InsertGrinderTask): Promise<GrinderTask> {
    const [created] = await db.insert(grinderTasks).values(task).returning();
    return created;
  }

  async updateGrinderTask(id: string, data: Partial<GrinderTask>): Promise<GrinderTask | undefined> {
    const [updated] = await db.update(grinderTasks).set(data).where(eq(grinderTasks.id, id)).returning();
    return updated;
  }

  async deleteGrinderTask(id: string): Promise<boolean> {
    const result = await db.delete(grinderTasks).where(eq(grinderTasks.id, id));
    return (result?.rowCount ?? 0) > 0;
  }

  async getGrinderBadges(grinderId?: string): Promise<GrinderBadge[]> {
    if (grinderId) {
      return await db.select().from(grinderBadges).where(eq(grinderBadges.grinderId, grinderId)).orderBy(desc(grinderBadges.createdAt));
    }
    return await db.select().from(grinderBadges).orderBy(desc(grinderBadges.createdAt));
  }

  async createGrinderBadge(badge: InsertGrinderBadge): Promise<GrinderBadge> {
    const [created] = await db.insert(grinderBadges).values(badge).returning();
    return created;
  }

  async deleteGrinderBadge(id: string): Promise<boolean> {
    const result = await db.delete(grinderBadges).where(eq(grinderBadges.id, id));
    return (result?.rowCount ?? 0) > 0;
  }

  async getStaffBadges(userId?: string): Promise<StaffBadge[]> {
    if (userId) {
      return await db.select().from(staffBadges).where(eq(staffBadges.userId, userId)).orderBy(desc(staffBadges.createdAt));
    }
    return await db.select().from(staffBadges).orderBy(desc(staffBadges.createdAt));
  }

  async createStaffBadge(badge: InsertStaffBadge): Promise<StaffBadge> {
    const [created] = await db.insert(staffBadges).values(badge).returning();
    return created;
  }

  async deleteStaffBadge(id: string): Promise<boolean> {
    const result = await db.delete(staffBadges).where(eq(staffBadges.id, id));
    return (result?.rowCount ?? 0) > 0;
  }

  async getCreatorBadges(creatorId?: string): Promise<CreatorBadge[]> {
    const run = () =>
      creatorId
        ? db.select().from(creatorBadges).where(eq(creatorBadges.creatorId, creatorId)).orderBy(desc(creatorBadges.createdAt))
        : db.select().from(creatorBadges).orderBy(desc(creatorBadges.createdAt));
    try {
      return await run();
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === "42P01") {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS creator_badges (
            id varchar PRIMARY KEY NOT NULL,
            creator_id varchar NOT NULL REFERENCES creators(id),
            badge_id varchar NOT NULL,
            awarded_by varchar,
            awarded_by_name text,
            note text,
            created_at timestamp DEFAULT now() NOT NULL
          )
        `);
        return await run();
      }
      throw err;
    }
  }

  async createCreatorBadge(badge: InsertCreatorBadge): Promise<CreatorBadge> {
    const [created] = await db.insert(creatorBadges).values(badge).returning();
    return created;
  }

  async deleteCreatorBadge(id: string): Promise<boolean> {
    const result = await db.delete(creatorBadges).where(eq(creatorBadges.id, id));
    return (result?.rowCount ?? 0) > 0;
  }

  async getStaffTasks(assignedTo?: string): Promise<StaffTask[]> {
    if (assignedTo) {
      return await db.select().from(staffTasks).where(eq(staffTasks.assignedTo, assignedTo)).orderBy(desc(staffTasks.createdAt));
    }
    return await db.select().from(staffTasks).orderBy(desc(staffTasks.createdAt));
  }

  async createStaffTask(task: InsertStaffTask): Promise<StaffTask> {
    const [created] = await db.insert(staffTasks).values(task).returning();
    return created;
  }

  async updateStaffTask(id: string, data: Partial<StaffTask>): Promise<StaffTask | undefined> {
    const [updated] = await db.update(staffTasks).set(data).where(eq(staffTasks.id, id)).returning();
    return updated;
  }

  async getStaffActionDismissals(): Promise<StaffActionDismissal[]> {
    return await db.select().from(staffActionDismissals);
  }

  async createStaffActionDismissal(data: { id: string; actionKey: string; dismissedBy: string; dismissedByName?: string }): Promise<StaffActionDismissal> {
    const [created] = await db.insert(staffActionDismissals).values(data).returning();
    return created;
  }

  async getDeletionRequests(status?: string): Promise<DeletionRequest[]> {
    if (status) {
      return await db.select().from(deletionRequests).where(eq(deletionRequests.status, status)).orderBy(desc(deletionRequests.createdAt));
    }
    return await db.select().from(deletionRequests).orderBy(desc(deletionRequests.createdAt));
  }

  async createDeletionRequest(request: InsertDeletionRequest): Promise<DeletionRequest> {
    const [created] = await db.insert(deletionRequests).values(request).returning();
    return created;
  }

  async updateDeletionRequest(id: string, data: Partial<DeletionRequest>): Promise<DeletionRequest | undefined> {
    const [updated] = await db.update(deletionRequests).set(data).where(eq(deletionRequests.id, id)).returning();
    return updated;
  }

  async getFinePayments(grinderId?: string): Promise<FinePayment[]> {
    if (grinderId) {
      return await db.select().from(finePayments).where(eq(finePayments.grinderId, grinderId)).orderBy(desc(finePayments.createdAt));
    }
    return await db.select().from(finePayments).orderBy(desc(finePayments.createdAt));
  }

  async createFinePayment(payment: InsertFinePayment): Promise<FinePayment> {
    const [created] = await db.insert(finePayments).values(payment).returning();
    return created;
  }

  async updateFinePayment(id: string, data: Partial<FinePayment>): Promise<FinePayment | undefined> {
    const [updated] = await db.update(finePayments).set(data).where(eq(finePayments.id, id)).returning();
    return updated;
  }

  async getWallets(): Promise<BusinessWallet[]> {
    return await db.select().from(businessWallets).orderBy(desc(businessWallets.createdAt));
  }

  async getWallet(id: string): Promise<BusinessWallet | undefined> {
    const [wallet] = await db.select().from(businessWallets).where(eq(businessWallets.id, id));
    return wallet;
  }

  async createWallet(data: InsertBusinessWallet): Promise<BusinessWallet> {
    const [created] = await db.insert(businessWallets).values(data).returning();
    return created;
  }

  async updateWallet(id: string, data: Partial<BusinessWallet>): Promise<BusinessWallet | undefined> {
    const [updated] = await db.update(businessWallets).set(data).where(eq(businessWallets.id, id)).returning();
    return updated;
  }

  async deleteWallet(id: string, preserveHistory: boolean): Promise<void> {
    if (!preserveHistory) {
      await db.delete(walletTransactions).where(eq(walletTransactions.walletId, id));
      await db.delete(walletTransfers).where(or(eq(walletTransfers.fromWalletId, id), eq(walletTransfers.toWalletId, id)));
      await db.delete(orderPaymentLinks).where(eq(orderPaymentLinks.receivedByWalletId, id));
      await db.delete(businessPayouts).where(eq(businessPayouts.walletId, id));
    }
    await db.delete(businessWallets).where(eq(businessWallets.id, id));
  }

  async getWalletTransactions(filters?: { walletId?: string; category?: string; type?: string; startDate?: Date; endDate?: Date; orderId?: string }): Promise<WalletTransaction[]> {
    if (!filters) {
      return await db.select().from(walletTransactions).orderBy(desc(walletTransactions.createdAt));
    }
    const conditions = [];
    if (filters.walletId) conditions.push(eq(walletTransactions.walletId, filters.walletId));
    if (filters.category) conditions.push(eq(walletTransactions.category, filters.category));
    if (filters.type) conditions.push(eq(walletTransactions.type, filters.type));
    if (filters.startDate) conditions.push(gte(walletTransactions.createdAt, filters.startDate));
    if (filters.endDate) conditions.push(lte(walletTransactions.createdAt, filters.endDate));
    if (filters.orderId) conditions.push(eq(walletTransactions.relatedOrderId, filters.orderId));
    if (conditions.length === 0) {
      return await db.select().from(walletTransactions).orderBy(desc(walletTransactions.createdAt));
    }
    return await db.select().from(walletTransactions).where(and(...conditions)).orderBy(desc(walletTransactions.createdAt));
  }

  async createWalletTransaction(data: InsertWalletTransaction): Promise<WalletTransaction> {
    const [created] = await db.insert(walletTransactions).values(data).returning();
    return created;
  }

  async getBusinessPayouts(filters?: { status?: string; category?: string; recipientRole?: string; walletId?: string; startDate?: Date; endDate?: Date }): Promise<BusinessPayout[]> {
    if (!filters) {
      return await db.select().from(businessPayouts).orderBy(desc(businessPayouts.createdAt));
    }
    const conditions = [];
    if (filters.status) conditions.push(eq(businessPayouts.status, filters.status));
    if (filters.category) conditions.push(eq(businessPayouts.category, filters.category));
    if (filters.recipientRole) conditions.push(eq(businessPayouts.recipientRole, filters.recipientRole));
    if (filters.walletId) conditions.push(eq(businessPayouts.walletId, filters.walletId));
    if (filters.startDate) conditions.push(gte(businessPayouts.createdAt, filters.startDate));
    if (filters.endDate) conditions.push(lte(businessPayouts.createdAt, filters.endDate));
    if (conditions.length === 0) {
      return await db.select().from(businessPayouts).orderBy(desc(businessPayouts.createdAt));
    }
    return await db.select().from(businessPayouts).where(and(...conditions)).orderBy(desc(businessPayouts.createdAt));
  }

  async createBusinessPayout(data: InsertBusinessPayout): Promise<BusinessPayout> {
    const [created] = await db.insert(businessPayouts).values(data).returning();
    return created;
  }

  async updateBusinessPayout(id: string, data: Partial<BusinessPayout>): Promise<BusinessPayout | undefined> {
    const [updated] = await db.update(businessPayouts).set(data).where(eq(businessPayouts.id, id)).returning();
    return updated;
  }

  async getWalletTransfers(): Promise<WalletTransfer[]> {
    return await db.select().from(walletTransfers).orderBy(desc(walletTransfers.createdAt));
  }

  async createWalletTransfer(data: InsertWalletTransfer): Promise<WalletTransfer> {
    const [created] = await db.insert(walletTransfers).values(data).returning();
    return created;
  }

  async updateWalletTransfer(id: string, data: Partial<WalletTransfer>): Promise<WalletTransfer | undefined> {
    const [updated] = await db.update(walletTransfers).set(data).where(eq(walletTransfers.id, id)).returning();
    return updated;
  }

  async getOrderPaymentLinks(orderId?: string): Promise<OrderPaymentLink[]> {
    if (orderId) {
      return await db.select().from(orderPaymentLinks).where(eq(orderPaymentLinks.orderId, orderId)).orderBy(desc(orderPaymentLinks.createdAt));
    }
    return await db.select().from(orderPaymentLinks).orderBy(desc(orderPaymentLinks.createdAt));
  }

  async createOrderPaymentLink(data: InsertOrderPaymentLink): Promise<OrderPaymentLink> {
    const [created] = await db.insert(orderPaymentLinks).values(data).returning();
    return created;
  }

  async updateOrderPaymentLink(id: string, data: Partial<OrderPaymentLink>): Promise<OrderPaymentLink | undefined> {
    const [updated] = await db.update(orderPaymentLinks).set(data).where(eq(orderPaymentLinks.id, id)).returning();
    return updated;
  }

  async getUserActivityLogs(filters?: { userId?: string; category?: string; action?: string; limit?: number }): Promise<UserActivityLog[]> {
    const conditions = [];
    if (filters?.userId) conditions.push(eq(userActivityLogs.userId, filters.userId));
    if (filters?.category) conditions.push(eq(userActivityLogs.category, filters.category));
    if (filters?.action) conditions.push(eq(userActivityLogs.action, filters.action));
    const limit = filters?.limit || 500;
    if (conditions.length > 0) {
      return await db.select().from(userActivityLogs).where(and(...conditions)).orderBy(desc(userActivityLogs.createdAt)).limit(limit);
    }
    return await db.select().from(userActivityLogs).orderBy(desc(userActivityLogs.createdAt)).limit(limit);
  }

  async createUserActivityLog(log: InsertUserActivityLog): Promise<UserActivityLog> {
    const [created] = await db.insert(userActivityLogs).values(log).returning();
    return created;
  }

  async getCreatorByUserId(userId: string): Promise<Creator | undefined> {
    const [row] = await db.select().from(creators).where(eq(creators.userId, userId)).limit(1);
    return row;
  }

  async getCreator(id: string): Promise<Creator | undefined> {
    const [row] = await db.select().from(creators).where(eq(creators.id, id)).limit(1);
    return row;
  }

  async createCreator(creator: InsertCreator): Promise<Creator> {
    const [created] = await db.insert(creators).values(creator).returning();
    return created;
  }

  async updateCreator(id: string, data: Partial<InsertCreator>): Promise<Creator | undefined> {
    const updateData = { ...data, updatedAt: new Date() } as Partial<Creator>;
    const [updated] = await db.update(creators).set(updateData).where(eq(creators.id, id)).returning();
    return updated;
  }

  async deleteCreator(id: string): Promise<boolean> {
    await db.delete(creators).where(eq(creators.id, id));
    return true;
  }

  async getCreators(): Promise<Creator[]> {
    return await db.select().from(creators).orderBy(creators.displayName);
  }

  async getCreatorPayoutDetailRequests(creatorId?: string): Promise<CreatorPayoutDetailRequest[]> {
    const base = db.select().from(creatorPayoutDetailRequests).orderBy(desc(creatorPayoutDetailRequests.createdAt));
    if (creatorId) return base.where(eq(creatorPayoutDetailRequests.creatorId, creatorId));
    return base;
  }

  async getCreatorPayoutDetailRequest(id: string): Promise<CreatorPayoutDetailRequest | undefined> {
    const [row] = await db.select().from(creatorPayoutDetailRequests).where(eq(creatorPayoutDetailRequests.id, id)).limit(1);
    return row;
  }

  async createCreatorPayoutDetailRequest(data: InsertCreatorPayoutDetailRequest): Promise<CreatorPayoutDetailRequest> {
    const [created] = await db.insert(creatorPayoutDetailRequests).values(data).returning();
    return created;
  }

  async updateCreatorPayoutDetailRequest(id: string, data: Partial<CreatorPayoutDetailRequest>): Promise<CreatorPayoutDetailRequest | undefined> {
    const [updated] = await db.update(creatorPayoutDetailRequests).set(data).where(eq(creatorPayoutDetailRequests.id, id)).returning();
    return updated;
  }

  async deleteCreatorPayoutDetailRequest(id: string): Promise<boolean> {
    await db.delete(creatorPayoutDetailRequests).where(eq(creatorPayoutDetailRequests.id, id));
    return true;
  }

  async getQuotes(limit = 100): Promise<Quote[]> {
    const rows = await db.select().from(quotes).orderBy(desc(quotes.createdAt)).limit(limit);
    return rows;
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    const [row] = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
    return row;
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const [created] = await db.insert(quotes).values(quote).returning();
    return created;
  }

  async updateQuote(id: string, data: Partial<InsertQuote>): Promise<Quote | undefined> {
    const [updated] = await db.update(quotes).set(data).where(eq(quotes.id, id)).returning();
    return updated;
  }

  async deleteQuote(id: string): Promise<boolean> {
    const [deleted] = await db.delete(quotes).where(eq(quotes.id, id)).returning({ id: quotes.id });
    return !!deleted;
  }
}

export const storage: IStorage =
  !process.env.DATABASE_URL && process.env.NODE_ENV !== "production"
    ? new DevStorage()
    : new DatabaseStorage();

if (storage instanceof DevStorage) {
  console.log("[storage] Using DevStorage (no DATABASE_URL)");
}
