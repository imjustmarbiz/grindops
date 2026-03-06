/**
 * DevStorage - returns empty/mock data when DATABASE_URL is missing.
 * All APIs using storage will get sensible defaults for local dev without a database.
 */
import type {
  Service, InsertService, Grinder, InsertGrinder, Order, InsertOrder,
  Bid, InsertBid, Assignment, InsertAssignment, QueueConfig, InsertQueueConfig,
  GrinderPayoutMethod,
  AuditLog, InsertAuditLog, OrderUpdate, InsertOrderUpdate, ActivityCheckpoint,
  InsertActivityCheckpoint, PerformanceReport, InsertPerformanceReport,
  PayoutRequest, InsertPayoutRequest, EliteRequest, InsertEliteRequest,
  StaffAlert, InsertStaffAlert, StrikeLog, InsertStrikeLog, StrikeAppeal,
  InsertStrikeAppeal, MessageThread, InsertMessageThread, ThreadParticipant,
  InsertThreadParticipant, Message, InsertMessage, Notification, InsertNotification,
  Event, InsertEvent, PatchNote, InsertPatchNote, CustomerReview, InsertCustomerReview,
  OrderClaimRequest, InsertOrderClaimRequest, ReviewAccessCode, InsertReviewAccessCode,
  GrinderTask, InsertGrinderTask, GrinderBadge, InsertGrinderBadge,
  StaffBadge, InsertStaffBadge, StaffTask, InsertStaffTask, StaffActionDismissal,
  CreatorBadge, InsertCreatorBadge,
  DeletionRequest, InsertDeletionRequest, FinePayment, InsertFinePayment,
  BusinessWallet, InsertBusinessWallet, WalletTransaction, InsertWalletTransaction,
  BusinessPayout, InsertBusinessPayout, WalletTransfer, InsertWalletTransfer,
  OrderPaymentLink, InsertOrderPaymentLink, UserActivityLog, InsertUserActivityLog,
  Creator, InsertCreator, CreatorPayoutDetailRequest, InsertCreatorPayoutDetailRequest, AnalyticsSummary, SuggestionResult, DashboardStats,
} from "@shared/schema";
import type { IStorage } from "./storage";

const DEV_SERVICES: Service[] = [
  { id: 'S1', name: 'VC Grinding 🪙', group: 'VC', defaultComplexity: 1, slaDays: 5, notes: null, isActive: true, logoUrl: null },
  { id: 'S2', name: 'Badge Grinding 🎖️', group: 'Badges', defaultComplexity: 2, slaDays: 5, notes: null, isActive: true, logoUrl: null },
  { id: 'S3', name: 'Rep Grinding ⚡', group: 'Rep', defaultComplexity: 5, slaDays: 7, notes: null, isActive: true, logoUrl: null },
  { id: 'S4', name: 'Hot Zones 🔥', group: 'Hot Zones', defaultComplexity: 3, slaDays: 5, notes: null, isActive: true, logoUrl: null },
  { id: 'S5', name: 'Build Specializations 🛠️', group: 'Build', defaultComplexity: 3, slaDays: 5, notes: null, isActive: true, logoUrl: null },
  { id: 'S6', name: 'Lifetime Challenges 🏆', group: 'Challenges', defaultComplexity: 4, slaDays: 7, notes: null, isActive: true, logoUrl: null },
  { id: 'S7', name: 'Plate Card Grinding 🃏', group: 'Cards', defaultComplexity: 2, slaDays: 5, notes: null, isActive: true, logoUrl: null },
  { id: 'S8', name: 'Event Grinding 🏟️', group: 'Events', defaultComplexity: 3, slaDays: 5, notes: null, isActive: true, logoUrl: null },
  { id: 'S9', name: 'Bundle Order 🎁', group: 'Bundle', defaultComplexity: 3, slaDays: 5, notes: null, isActive: true, logoUrl: null },
  { id: 'S10', name: 'Season Pass Grinding 🎫', group: 'Season', defaultComplexity: 3, slaDays: 7, notes: null, isActive: true, logoUrl: null },
  { id: 'S11', name: 'Add-Ons ➕', group: 'Add-Ons', defaultComplexity: 1, slaDays: 3, notes: null, isActive: true, logoUrl: null },
];

const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  id: 'dev-config',
  marginWeight: '0.20', capacityWeight: '0.15', tierWeight: '0.10', fairnessWeight: '0.15',
  newGrinderWeight: '0.10', reliabilityWeight: '0.10', qualityWeight: '0.10', riskWeight: '0.10',
  emergencyBoost: '0.25', largeOrderThreshold: '500', largeOrderEliteBoost: '0.15',
  creatorCommissionPercent: '10',
  creatorPayoutMethods: ['paypal'],
  dailyCheckupsEnabled: true, mgtBotEnabled: true, maintenanceMode: false, maintenanceModeSetBy: null,
  customerUpdatesEnabled: true, embedThumbnailUrl: null, earlyAccessMode: false,
  customPayoutRoles: null, customPayoutCategories: null, platforms: ['Xbox', 'PS5'],
  holidayTheme: 'none', gameTheme: 'none',
};

const ZERO_ANALYTICS: AnalyticsSummary = {
  totalRevenue: 0, totalGrinderPayouts: 0, totalCompanyProfit: 0, avgMargin: 0,
  totalOrders: 0, completedOrders: 0, activeOrders: 0, openOrders: 0,
  totalGrinders: 0, availableGrinders: 0, pendingBids: 0, acceptedBids: 0,
  activeAssignments: 0, completedAssignments: 0, fineRevenue: 0,
};

const ZERO_DASHBOARD: DashboardStats = {
  activeOrders: 0, completedToday: 0, availableGrinders: 0, totalGrinders: 0,
};

const devOrders = new Map<string, Order>();
const devBids = new Map<string, Bid>();
const devAssignments = new Map<string, Assignment>();

export class DevStorage implements IStorage {
  async getServices() { return DEV_SERVICES; }
  async getServiceByName() { return undefined; }
  async createService(s: InsertService) { return { ...s, id: s.id || `S${Date.now()}` } as Service; }
  async updateService() { return undefined; }
  async deleteService() {}

  async getGrinders() {
    const devAsns = Array.from(devAssignments.values()).filter((a: any) => a.grinderId?.startsWith?.("dev-grinder"));
    const activeOrders = devAsns.filter((a: any) => a.status === "Active").length;
    const completedOrders = devAsns.filter((a: any) => a.status === "Completed").length;
    const devGrinder: Grinder = {
      id: "dev-grinder-grinder",
      name: "Demo Grinder",
      discordUserId: "dev-user-grinder",
      discordUsername: "demogrinder",
      discordRoleId: null,
      category: "Grinder",
      roles: ["Grinder"],
      displayRole: "Grinder",
      tier: "New",
      capacity: 3,
      activeOrders,
      completedOrders,
      ordersAssignedL7D: devAsns.length,
      totalOrders: devAsns.length,
      totalReviews: 0,
      totalEarnings: "0",
      winRate: null,
      lastAssigned: null,
      utilization: "0",
      avgQualityRating: null,
      onTimeRate: null,
      completionRate: null,
      cancelRate: null,
      reassignmentCount: 0,
      rulesAccepted: false,
      rulesAcceptedAt: null,
      strikes: 0,
      suspended: false,
      outstandingFine: "0",
      avgTurnaroundDays: null,
      availabilityStatus: "available",
      availabilityNote: null,
      availabilityUpdatedAt: null,
      notes: null,
      twitchUsername: null,
      joinedAt: new Date(),
      eliteSince: null,
      isRemoved: false,
      removedAt: null,
      removedBy: null,
      createdAt: new Date(),
    } as Grinder;
    return [devGrinder];
  }
  async getGrinder() { return undefined; }
  async getGrinderByDiscordId() { return undefined; }
  async createGrinder(g: InsertGrinder) { return g as Grinder; }
  async updateGrinder() { return undefined; }
  async deleteGrinder() { return false; }
  async softRemoveGrinder() { return undefined; }
  async upsertGrinderByDiscordId(g: InsertGrinder) { return g as Grinder; }

  async getOrders() {
    return Array.from(devOrders.values()).map((o) => ({
      ...o,
      status: (o as any).status || "Open",
    })) as Order[];
  }
  async getOrder(id: string) { return devOrders.get(id); }
  async getOrderByMgtNumber(n: number) { return Array.from(devOrders.values()).find(o => (o as any).mgtOrderNumber === n); }
  async createOrder(o: InsertOrder) {
    const id = (o as any).id || ((o as any).mgtOrderNumber ? `MGT-${(o as any).mgtOrderNumber}` : `ORD-${Date.now().toString(36)}`);
    const order = {
      ...o,
      id,
      status: (o as any).status || "Open",
      createdAt: new Date(),
    } as Order;
    devOrders.set(id, order);
    return order;
  }
  async upsertOrderByMgtNumber(o: InsertOrder) {
    const num = (o as any).mgtOrderNumber;
    const id = num ? `MGT-${num}` : `ORD-${Date.now().toString(36)}`;
    const order = {
      ...o,
      id,
      status: (o as any).status || "Open",
      createdAt: new Date(),
    } as Order;
    devOrders.set(id, order);
    return order;
  }
  async updateOrderStatus(id: string, status: string) {
    const o = devOrders.get(id);
    if (!o) return undefined;
    const completedAt = status === "Completed" ? new Date() : status !== "Paid Out" ? null : (o as any).completedAt;
    const updated = { ...o, status, completedAt };
    devOrders.set(id, updated);
    return updated;
  }
  async updateOrder(id: string, data: Partial<InsertOrder>) {
    const o = devOrders.get(id);
    if (!o) return undefined;
    const updated = { ...o, ...data };
    devOrders.set(id, updated);
    return updated;
  }
  async deleteOrder(id: string) { return devOrders.delete(id); }

  async getBids() { return Array.from(devBids.values()); }
  async getBid(id: string) { return devBids.get(id); }
  async getBidByProposalId() { return undefined; }
  async getBidsForOrder(orderId: string) { return Array.from(devBids.values()).filter(b => (b as any).orderId === orderId); }
  async createBid(b: InsertBid) {
    const id = (b as any).id || `BID-${Date.now().toString(36)}`;
    const bid = { ...b, id } as Bid;
    devBids.set(id, bid);
    return bid;
  }
  async upsertBidByProposalId(b: InsertBid) { return b as Bid; }
  async updateBidStatus(id: string, status: string) {
    const b = devBids.get(id);
    if (!b) return undefined;
    const updated = { ...b, status };
    devBids.set(id, updated);
    return updated;
  }
  async deleteBid(id: string) { return devBids.delete(id); }

  async getAssignments() { return Array.from(devAssignments.values()); }
  async getAssignment(id: string) { return devAssignments.get(id); }
  async createAssignment(a: InsertAssignment) {
    const id = (a as any).id || `ASN-${Date.now().toString(36)}`;
    const asn = { ...a, id } as Assignment;
    devAssignments.set(id, asn);
    return asn;
  }
  async deleteAssignment(id: string) { return devAssignments.delete(id); }
  async updateAssignment(id: string, data: any) {
    const a = devAssignments.get(id);
    if (!a) return undefined;
    const updated = { ...a, ...data };
    devAssignments.set(id, updated);
    return updated;
  }
  async replaceGrinder() { return undefined; }

  async getQueueConfig() { return DEFAULT_QUEUE_CONFIG; }
  async upsertQueueConfig(c: InsertQueueConfig) { return { ...DEFAULT_QUEUE_CONFIG, ...c } as QueueConfig; }

  private devAuditLogs: AuditLog[] = [];
  async getAuditLogs(limit = 100, _entityType?: string) {
    return [...this.devAuditLogs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
  async createAuditLog(l: InsertAuditLog) {
    const log = { ...l, id: l.id || `AL-${Date.now()}`, createdAt: new Date().toISOString() } as AuditLog;
    this.devAuditLogs.unshift(log);
    return log;
  }

  async getDashboardStats() { return ZERO_DASHBOARD; }
  async getAnalyticsSummary() { return ZERO_ANALYTICS; }
  async getSuggestionsForOrder() { return []; }
  async getEmergencyQueue() { return []; }
  async getFullQueue() { return []; }

  async getOrderUpdates() { return []; }
  async createOrderUpdate(u: InsertOrderUpdate) { return u as OrderUpdate; }

  async getPayoutRequests() { return []; }
  async getPayoutRequest() { return undefined; }
  async createPayoutRequest(r: InsertPayoutRequest) { return r as PayoutRequest; }
  async updatePayoutRequest() { return undefined; }

  async getGrinderPayoutMethods(_grinderId: string) { return [] as GrinderPayoutMethod[]; }

  async updateBid() { return undefined; }

  async getEliteRequests() { return []; }
  async createEliteRequest(r: InsertEliteRequest) { return r as EliteRequest; }
  async updateEliteRequest() { return undefined; }

  async getStaffAlerts() { return []; }
  async createStaffAlert(a: InsertStaffAlert) { return a as StaffAlert; }
  async markAlertRead() {}
  async deleteStaffAlert() { return false; }

  async getStrikeLogs() { return []; }
  async createStrikeLog(l: InsertStrikeLog) { return l as StrikeLog; }
  async updateStrikeLog() {}
  async acknowledgeStrike() {}
  async getStrikeAppeals() { return []; }
  async createStrikeAppeal(a: InsertStrikeAppeal) { return a as StrikeAppeal; }
  async updateStrikeAppeal() {}

  async getActivityCheckpoints() { return []; }
  async createActivityCheckpoint(c: InsertActivityCheckpoint) { return c as ActivityCheckpoint; }
  async updateActivityCheckpoint() { return undefined; }

  async getPerformanceReports() { return []; }
  async getPerformanceReport() { return undefined; }
  async createPerformanceReport(r: InsertPerformanceReport) { return r as PerformanceReport; }
  async updatePerformanceReport() { return undefined; }

  async updateOrderUpdate() { return undefined as any; }

  async getThreadsForUser() { return []; }
  async createThread(d: InsertMessageThread, p: InsertThreadParticipant[]) {
    return { ...d, participants: p } as MessageThread & { participants: ThreadParticipant[] };
  }
  async getThread() { return undefined; }
  async addParticipant(p: InsertThreadParticipant) { return p as ThreadParticipant; }
  async removeParticipant() {}
  async getMessagesForThread() { return []; }
  async createMessage(m: InsertMessage) { return m as Message; }
  async deleteMessage() { return false; }
  async deleteThread() { return false; }
  async markThreadRead() {}

  async getNotificationsForUser() { return []; }
  async createNotification(n: InsertNotification) { return n as Notification; }
  async markNotificationRead() {}

  async getEvents() { return []; }
  async getEvent() { return undefined; }
  async createEvent(e: InsertEvent) { return e as Event; }
  async updateEvent() { return undefined; }
  async deleteEvent() { return false; }

  async getPatchNotes() { return []; }
  async getPatchNote() { return undefined; }
  async createPatchNote(n: InsertPatchNote) { return n as PatchNote; }
  async updatePatchNote() { return undefined; }
  async deletePatchNote() { return false; }

  async getCustomerReviews() { return []; }
  async getCustomerReview() { return undefined; }
  async createCustomerReview(r: InsertCustomerReview) { return r as CustomerReview; }
  async updateCustomerReview() { return undefined; }

  async getOrderClaimRequests() { return []; }
  async getOrderClaimRequest() { return undefined; }
  async createOrderClaimRequest(r: InsertOrderClaimRequest) { return r as OrderClaimRequest; }
  async updateOrderClaimRequest() { return undefined; }

  async getReviewAccessCodes() { return []; }
  async getReviewAccessCode() { return undefined; }
  async getReviewAccessCodeByCode() { return undefined; }
  async getReviewAccessCodeBySession() { return undefined; }
  async createReviewAccessCode(c: InsertReviewAccessCode) { return c as ReviewAccessCode; }
  async updateReviewAccessCode() { return undefined; }

  async getGrinderTasks() { return []; }
  async getGrinderTask() { return undefined; }
  async createGrinderTask(t: InsertGrinderTask) { return t as GrinderTask; }
  async updateGrinderTask() { return undefined; }
  async deleteGrinderTask() { return false; }

  async getGrinderBadges() { return []; }
  async createGrinderBadge(b: InsertGrinderBadge) { return b as GrinderBadge; }
  async deleteGrinderBadge() { return false; }

  async getStaffBadges() { return []; }
  async createStaffBadge(b: InsertStaffBadge) { return b as StaffBadge; }
  async deleteStaffBadge() { return false; }

  async getCreatorBadges() { return []; }
  async createCreatorBadge(b: InsertCreatorBadge) { return b as CreatorBadge; }
  async deleteCreatorBadge() { return false; }

  async getStaffTasks() { return []; }
  async createStaffTask(t: InsertStaffTask) { return t as StaffTask; }
  async updateStaffTask() { return undefined; }
  async getStaffActionDismissals() { return []; }
  async createStaffActionDismissal(d: any) { return d as StaffActionDismissal; }

  async getDeletionRequests() { return []; }
  async createDeletionRequest(r: InsertDeletionRequest) { return r as DeletionRequest; }
  async updateDeletionRequest() { return undefined; }

  async getFinePayments() { return []; }
  async createFinePayment(p: InsertFinePayment) { return p as FinePayment; }
  async updateFinePayment() { return undefined; }

  async getWallets() { return []; }
  async getWallet() { return undefined; }
  async createWallet(d: InsertBusinessWallet) { return d as BusinessWallet; }
  async updateWallet() { return undefined; }
  async deleteWallet() {}

  async getWalletTransactions() { return []; }
  async createWalletTransaction(d: InsertWalletTransaction) { return d as WalletTransaction; }

  async getBusinessPayouts() { return []; }
  async createBusinessPayout(d: InsertBusinessPayout) { return d as BusinessPayout; }
  async updateBusinessPayout() { return undefined; }

  async getWalletTransfers() { return []; }
  async createWalletTransfer(d: InsertWalletTransfer) { return d as WalletTransfer; }
  async updateWalletTransfer() { return undefined; }

  async getOrderPaymentLinks() { return []; }
  async createOrderPaymentLink(d: InsertOrderPaymentLink) { return d as OrderPaymentLink; }
  async updateOrderPaymentLink() { return undefined; }

  async getUserActivityLogs() { return []; }
  async createUserActivityLog(l: InsertUserActivityLog) { return l as UserActivityLog; }

  private devCreators = new Map<string, Creator>();
  private devCreatorPayoutDetailRequests = new Map<string, CreatorPayoutDetailRequest>();

  async getCreatorByUserId(userId: string): Promise<Creator | undefined> {
    return Array.from(this.devCreators.values()).find((c) => c.userId === userId);
  }
  async createCreator(c: InsertCreator): Promise<Creator> {
    const created = { ...c, createdAt: new Date(), updatedAt: new Date() } as Creator;
    this.devCreators.set(c.id, created);
    return created;
  }
  async updateCreator(id: string, data: Partial<InsertCreator>): Promise<Creator | undefined> {
    const existing = this.devCreators.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data, updatedAt: new Date() } as Creator;
    this.devCreators.set(id, updated);
    return updated;
  }
  async getCreators(): Promise<Creator[]> {
    return Array.from(this.devCreators.values());
  }

  async getCreatorPayoutDetailRequests(creatorId?: string): Promise<CreatorPayoutDetailRequest[]> {
    const list = Array.from(this.devCreatorPayoutDetailRequests.values());
    if (creatorId) return list.filter((r) => r.creatorId === creatorId).sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
    return list.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getCreatorPayoutDetailRequest(id: string): Promise<CreatorPayoutDetailRequest | undefined> {
    return this.devCreatorPayoutDetailRequests.get(id);
  }

  async createCreatorPayoutDetailRequest(data: InsertCreatorPayoutDetailRequest): Promise<CreatorPayoutDetailRequest> {
    const created = { ...data, createdAt: new Date() } as CreatorPayoutDetailRequest;
    this.devCreatorPayoutDetailRequests.set(data.id, created);
    return created;
  }

  async updateCreatorPayoutDetailRequest(id: string, data: Partial<CreatorPayoutDetailRequest>): Promise<CreatorPayoutDetailRequest | undefined> {
    const existing = this.devCreatorPayoutDetailRequests.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data } as CreatorPayoutDetailRequest;
    this.devCreatorPayoutDetailRequests.set(id, updated);
    return updated;
  }
}
