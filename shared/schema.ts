import { pgTable, text, varchar, integer, boolean, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export * from "./models/auth";

export const GRINDER_ROLES = {
  GRINDER: "1466369179648004224",
  ELITE: "1466370965016412316",
  VC_1: "1468501279478255708",
  VC_2: "1468501106916065363",
  EVENT: "1468796147136073922",
} as const;

export const ROLE_CAPACITY: Record<string, number> = {
  [GRINDER_ROLES.GRINDER]: 3,
  [GRINDER_ROLES.ELITE]: 5,
  [GRINDER_ROLES.VC_1]: 3,
  [GRINDER_ROLES.VC_2]: 3,
  [GRINDER_ROLES.EVENT]: 3,
};

export const ROLE_LABELS: Record<string, string> = {
  [GRINDER_ROLES.GRINDER]: "Grinder",
  [GRINDER_ROLES.ELITE]: "Elite Grinder",
  [GRINDER_ROLES.VC_1]: "VC Grinder",
  [GRINDER_ROLES.VC_2]: "VC Grinder",
  [GRINDER_ROLES.EVENT]: "Event Grinder",
};

export const PAYOUT_PLATFORMS = ["Zelle", "PayPal", "Apple Pay", "Cash App", "Venmo"] as const;

export const services = pgTable("services", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  group: text("group").notNull(),
  defaultComplexity: integer("default_complexity").notNull().default(1),
  slaDays: integer("sla_days").notNull().default(1),
  notes: text("notes"),
});

export const grinders = pgTable("grinders", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  discordUserId: varchar("discord_user_id"),
  discordUsername: text("discord_username"),
  discordRoleId: varchar("discord_role_id"),
  category: text("category").notNull().default("Grinder"),
  tier: text("tier").notNull().default("New"),
  capacity: integer("capacity").notNull().default(3),
  activeOrders: integer("active_orders").notNull().default(0),
  completedOrders: integer("completed_orders").notNull().default(0),
  ordersAssignedL7D: integer("orders_assigned_l7d").notNull().default(0),
  totalOrders: integer("total_orders").notNull().default(0),
  totalReviews: integer("total_reviews").notNull().default(0),
  totalEarnings: numeric("total_earnings").notNull().default("0"),
  winRate: numeric("win_rate"),
  lastAssigned: timestamp("last_assigned"),
  utilization: numeric("utilization").notNull().default("0"),
  avgQualityRating: numeric("avg_quality_rating"),
  onTimeRate: numeric("on_time_rate"),
  completionRate: numeric("completion_rate"),
  cancelRate: numeric("cancel_rate"),
  reassignmentCount: integer("reassignment_count").notNull().default(0),
  avgTurnaroundDays: numeric("avg_turnaround_days"),
  strikes: integer("strikes").notNull().default(0),
  availabilityStatus: text("availability_status").notNull().default("available"),
  availabilityNote: text("availability_note"),
  availabilityUpdatedAt: timestamp("availability_updated_at"),
  notes: text("notes"),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey(),
  mgtOrderNumber: integer("mgt_order_number"),
  discordMessageId: varchar("discord_message_id"),
  serviceId: varchar("service_id").references(() => services.id).notNull(),
  customerPrice: numeric("customer_price").notNull(),
  platform: text("platform"),
  gamertag: text("gamertag"),
  orderDueDate: timestamp("order_due_date").notNull(),
  isRush: boolean("is_rush").notNull().default(false),
  isEmergency: boolean("is_emergency").notNull().default(false),
  complexity: integer("complexity").notNull().default(1),
  location: text("location"),
  status: text("status").notNull().default("Open"),
  assignedGrinderId: varchar("assigned_grinder_id"),
  acceptedBidId: varchar("accepted_bid_id"),
  companyProfit: numeric("company_profit"),
  notes: text("notes"),
  isManual: boolean("is_manual").notNull().default(false),
  visibleToGrinders: boolean("visible_to_grinders").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  firstBidAt: timestamp("first_bid_at"),
  biddingClosesAt: timestamp("bidding_closes_at"),
  biddingNotifiedStages: jsonb("bidding_notified_stages").notNull().default([]),
});

export const bids = pgTable("bids", {
  id: varchar("id").primaryKey(),
  mgtProposalId: integer("mgt_proposal_id"),
  discordMessageId: varchar("discord_message_id"),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  grinderId: varchar("grinder_id").references(() => grinders.id).notNull(),
  bidAmount: numeric("bid_amount").notNull(),
  bidTime: timestamp("bid_time").defaultNow().notNull(),
  estDeliveryDate: timestamp("est_delivery_date").notNull(),
  timeline: text("timeline"),
  canStart: text("can_start"),
  qualityScore: integer("quality_score"),
  margin: numeric("margin"),
  marginPct: numeric("margin_pct"),
  acceptedBy: text("accepted_by"),
  notes: text("notes"),
  status: text("status").notNull().default("Pending"),
});

export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey(),
  grinderId: varchar("grinder_id").references(() => grinders.id).notNull(),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  assignedDateTime: timestamp("assigned_date_time").defaultNow().notNull(),
  status: text("status").notNull().default("Active"),
  bidAmount: numeric("bid_amount"),
  orderPrice: numeric("order_price"),
  margin: numeric("margin"),
  marginPct: numeric("margin_pct"),
  companyProfit: numeric("company_profit"),
  grinderEarnings: numeric("grinder_earnings"),
  dueDateTime: timestamp("due_date_time").notNull(),
  deliveredDateTime: timestamp("delivered_date_time"),
  isOnTime: boolean("is_on_time"),
  qualityRating: integer("quality_rating"),
  wasReassigned: boolean("was_reassigned").notNull().default(false),
  originalGrinderId: varchar("original_grinder_id"),
  replacementGrinderId: varchar("replacement_grinder_id"),
  originalGrinderPay: numeric("original_grinder_pay"),
  replacementGrinderPay: numeric("replacement_grinder_pay"),
  replacedAt: timestamp("replaced_at"),
  replacementReason: text("replacement_reason"),
  notes: text("notes"),
});

export const queueConfig = pgTable("queue_config", {
  id: varchar("id").primaryKey(),
  marginWeight: numeric("margin_weight").notNull().default("0.20"),
  capacityWeight: numeric("capacity_weight").notNull().default("0.15"),
  tierWeight: numeric("tier_weight").notNull().default("0.10"),
  fairnessWeight: numeric("fairness_weight").notNull().default("0.15"),
  newGrinderWeight: numeric("new_grinder_weight").notNull().default("0.10"),
  reliabilityWeight: numeric("reliability_weight").notNull().default("0.10"),
  qualityWeight: numeric("quality_weight").notNull().default("0.10"),
  riskWeight: numeric("risk_weight").notNull().default("0.10"),
  emergencyBoost: numeric("emergency_boost").notNull().default("0.25"),
  largeOrderThreshold: numeric("large_order_threshold").notNull().default("500"),
  largeOrderEliteBoost: numeric("large_order_elite_boost").notNull().default("0.15"),
});

export const orderUpdates = pgTable("order_updates", {
  id: varchar("id").primaryKey(),
  assignmentId: varchar("assignment_id").references(() => assignments.id).notNull(),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  grinderId: varchar("grinder_id").references(() => grinders.id).notNull(),
  updateType: text("update_type").notNull().default("progress"),
  message: text("message").notNull(),
  newDeadline: timestamp("new_deadline"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payoutRequests = pgTable("payout_requests", {
  id: varchar("id").primaryKey(),
  assignmentId: varchar("assignment_id").references(() => assignments.id).notNull(),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  grinderId: varchar("grinder_id").references(() => grinders.id).notNull(),
  amount: numeric("amount").notNull(),
  payoutPlatform: text("payout_platform"),
  payoutDetails: text("payout_details"),
  status: text("status").notNull().default("Pending"),
  notes: text("notes"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const grinderPayoutMethods = pgTable("grinder_payout_methods", {
  id: varchar("id").primaryKey(),
  grinderId: varchar("grinder_id").references(() => grinders.id).notNull(),
  platform: text("platform").notNull(),
  details: text("details").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eliteRequests = pgTable("elite_requests", {
  id: varchar("id").primaryKey(),
  grinderId: varchar("grinder_id").references(() => grinders.id).notNull(),
  status: text("status").notNull().default("Pending"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  decisionNotes: text("decision_notes"),
});

export const staffAlerts = pgTable("staff_alerts", {
  id: varchar("id").primaryKey(),
  targetType: text("target_type").notNull().default("all"),
  grinderId: varchar("grinder_id"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull().default("info"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  readBy: jsonb("read_by").notNull().default([]),
});

export const strikeLogs = pgTable("strike_logs", {
  id: varchar("id").primaryKey(),
  grinderId: varchar("grinder_id").references(() => grinders.id).notNull(),
  action: text("action").notNull(),
  reason: text("reason").notNull(),
  delta: integer("delta").notNull(),
  resultingStrikes: integer("resulting_strikes").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  acknowledgedAt: timestamp("acknowledged_at"),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  action: text("action").notNull(),
  actor: text("actor").notNull().default("system"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  service: one(services, {
    fields: [orders.serviceId],
    references: [services.id],
  }),
  bids: many(bids),
  assignments: many(assignments),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  order: one(orders, {
    fields: [bids.orderId],
    references: [orders.id],
  }),
  grinder: one(grinders, {
    fields: [bids.grinderId],
    references: [grinders.id],
  }),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  order: one(orders, {
    fields: [assignments.orderId],
    references: [orders.id],
  }),
  grinder: one(grinders, {
    fields: [assignments.grinderId],
    references: [grinders.id],
  }),
}));

export const insertServiceSchema = createInsertSchema(services);
export const insertGrinderSchema = createInsertSchema(grinders);
export const insertOrderSchema = createInsertSchema(orders).omit({ createdAt: true });
export const insertBidSchema = createInsertSchema(bids);
export const insertAssignmentSchema = createInsertSchema(assignments);
export const insertQueueConfigSchema = createInsertSchema(queueConfig);
export const insertOrderUpdateSchema = createInsertSchema(orderUpdates).omit({ createdAt: true });
export const insertPayoutRequestSchema = createInsertSchema(payoutRequests).omit({ createdAt: true, reviewedAt: true, paidAt: true });
export const insertGrinderPayoutMethodSchema = createInsertSchema(grinderPayoutMethods).omit({ createdAt: true, updatedAt: true });
export const insertEliteRequestSchema = createInsertSchema(eliteRequests).omit({ requestedAt: true, reviewedAt: true });
export const insertStaffAlertSchema = createInsertSchema(staffAlerts).omit({ createdAt: true });
export const insertStrikeLogSchema = createInsertSchema(strikeLogs).omit({ createdAt: true, acknowledgedAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ createdAt: true });

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Grinder = typeof grinders.$inferSelect;
export type InsertGrinder = z.infer<typeof insertGrinderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Bid = typeof bids.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type QueueConfig = typeof queueConfig.$inferSelect;
export type InsertQueueConfig = z.infer<typeof insertQueueConfigSchema>;
export type OrderUpdate = typeof orderUpdates.$inferSelect;
export type InsertOrderUpdate = z.infer<typeof insertOrderUpdateSchema>;
export type PayoutRequest = typeof payoutRequests.$inferSelect;
export type InsertPayoutRequest = z.infer<typeof insertPayoutRequestSchema>;
export type GrinderPayoutMethod = typeof grinderPayoutMethods.$inferSelect;
export type InsertGrinderPayoutMethod = z.infer<typeof insertGrinderPayoutMethodSchema>;
export type EliteRequest = typeof eliteRequests.$inferSelect;
export type InsertEliteRequest = z.infer<typeof insertEliteRequestSchema>;
export type StaffAlert = typeof staffAlerts.$inferSelect;
export type InsertStaffAlert = z.infer<typeof insertStaffAlertSchema>;
export type StrikeLog = typeof strikeLogs.$inferSelect;
export type InsertStrikeLog = z.infer<typeof insertStrikeLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type GrinderScorecard = {
  grinder: Grinder;
  scores: {
    margin: number;
    capacity: number;
    tier: number;
    fairness: number;
    newGrinder: number;
    reliability: number;
    quality: number;
    risk: number;
    total: number;
    finalScore: number;
  };
  earnings: number;
  companyProfit: number;
};

export type SuggestionResult = {
  grinderId: string;
  grinderName: string;
  category: string;
  tier: string;
  scores: {
    margin: number;
    capacity: number;
    tier: number;
    fairness: number;
    newGrinder: number;
    reliability: number;
    quality: number;
    risk: number;
    total: number;
    finalScore: number;
  };
  bidId?: string;
  bidAmount?: string;
  activeOrders: number;
  capacity: number;
  strikes: number;
};

export type AnalyticsSummary = {
  totalRevenue: number;
  totalGrinderPayouts: number;
  totalCompanyProfit: number;
  avgMargin: number;
  totalOrders: number;
  completedOrders: number;
  activeOrders: number;
  openOrders: number;
  totalGrinders: number;
  availableGrinders: number;
  pendingBids: number;
  acceptedBids: number;
  activeAssignments: number;
  completedAssignments: number;
};

export type DashboardStats = {
  activeOrders: number;
  completedToday: number;
  availableGrinders: number;
  totalGrinders: number;
};
