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
  INTERNATIONAL: "1469613880073257125",
  XBOX: "1466651663090712639",
  PS5: "1466651625815806077",
} as const;

export const ROLE_CAPACITY: Record<string, number> = {
  [GRINDER_ROLES.GRINDER]: 3,
  [GRINDER_ROLES.ELITE]: 5,
  [GRINDER_ROLES.VC_1]: 3,
  [GRINDER_ROLES.VC_2]: 3,
  [GRINDER_ROLES.EVENT]: 3,
  [GRINDER_ROLES.INTERNATIONAL]: 3,
  [GRINDER_ROLES.XBOX]: 3,
  [GRINDER_ROLES.PS5]: 3,
};

export const ROLE_LABELS: Record<string, string> = {
  [GRINDER_ROLES.GRINDER]: "Grinder",
  [GRINDER_ROLES.ELITE]: "Elite Grinder",
  [GRINDER_ROLES.VC_1]: "VC Grinder",
  [GRINDER_ROLES.VC_2]: "VC Grinder",
  [GRINDER_ROLES.EVENT]: "Event Grinder",
  [GRINDER_ROLES.INTERNATIONAL]: "International Grinder",
  [GRINDER_ROLES.XBOX]: "Xbox Grinder",
  [GRINDER_ROLES.PS5]: "PS5 Grinder",
};

export const PAYOUT_PLATFORMS = ["Zelle", "PayPal", "Apple Pay", "Cash App", "Venmo"] as const;

export const services = pgTable("services", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  group: text("group").notNull(),
  defaultComplexity: integer("default_complexity").notNull().default(1),
  slaDays: integer("sla_days").notNull().default(1),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  logoUrl: text("logo_url"),
});

export const grinders = pgTable("grinders", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  discordUserId: varchar("discord_user_id"),
  discordUsername: text("discord_username"),
  discordRoleId: varchar("discord_role_id"),
  category: text("category").notNull().default("Grinder"),
  roles: text("roles").array().default([]),
  displayRole: text("display_role"),
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
  rulesAccepted: boolean("rules_accepted").notNull().default(false),
  rulesAcceptedAt: timestamp("rules_accepted_at"),
  strikes: integer("strikes").notNull().default(0),
  suspended: boolean("suspended").notNull().default(false),
  outstandingFine: numeric("outstanding_fine").notNull().default("0"),
  availabilityStatus: text("availability_status").notNull().default("available"),
  availabilityNote: text("availability_note"),
  availabilityUpdatedAt: timestamp("availability_updated_at"),
  notes: text("notes"),
  twitchUsername: text("twitch_username"),
  joinedAt: timestamp("joined_at"),
  eliteSince: timestamp("elite_since"),
  isRemoved: boolean("is_removed").notNull().default(false),
  removedAt: timestamp("removed_at"),
  removedBy: text("removed_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey(),
  displayId: varchar("display_id"),
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
  orderBrief: text("order_brief"),
  discordBidLink: text("discord_bid_link"),
  discordTicketChannelId: varchar("discord_ticket_channel_id"),
  customerDiscordId: varchar("customer_discord_id"),
  skipDailyCheckup: boolean("skip_daily_checkup").notNull().default(false),
  isManual: boolean("is_manual").notNull().default(false),
  visibleToGrinders: boolean("visible_to_grinders").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  firstBidAt: timestamp("first_bid_at"),
  biddingClosesAt: timestamp("bidding_closes_at"),
  biddingNotifiedStages: jsonb("bidding_notified_stages").notNull().default([]),
  refundToCustomer: numeric("refund_to_customer"),
  refundToGrinder: numeric("refund_to_grinder"),
  refundToCompany: numeric("refund_to_company"),
});

export const bids = pgTable("bids", {
  id: varchar("id").primaryKey(),
  displayId: varchar("display_id"),
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
  displayId: varchar("display_id"),
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
  startedAt: timestamp("started_at"),
  exemptFromCompliance: boolean("exempt_from_compliance").notNull().default(false),
  customerApproved: boolean("customer_approved").notNull().default(false),
  customerApprovedAt: timestamp("customer_approved_at"),
  customerApprovalToken: varchar("customer_approval_token"),
  customerIssueReported: boolean("customer_issue_reported").notNull().default(false),
  customerIssueReportedAt: timestamp("customer_issue_reported_at"),
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
  dailyCheckupsEnabled: boolean("daily_checkups_enabled").notNull().default(true),
  mgtBotEnabled: boolean("mgt_bot_enabled").notNull().default(true),
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  maintenanceModeSetBy: varchar("maintenance_mode_set_by"),
  customerUpdatesEnabled: boolean("customer_updates_enabled").notNull().default(true),
  embedThumbnailUrl: text("embed_thumbnail_url"),
  earlyAccessMode: boolean("early_access_mode").notNull().default(false),
  customPayoutRoles: jsonb("custom_payout_roles"),
  customPayoutCategories: jsonb("custom_payout_categories"),
  platforms: jsonb("platforms").$type<string[]>().default(["Xbox", "PS5"]),
});

export const orderUpdates = pgTable("order_updates", {
  id: varchar("id").primaryKey(),
  displayId: varchar("display_id"),
  assignmentId: varchar("assignment_id").references(() => assignments.id).notNull(),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  grinderId: varchar("grinder_id").references(() => grinders.id).notNull(),
  updateType: text("update_type").notNull().default("progress"),
  message: text("message").notNull(),
  newDeadline: timestamp("new_deadline"),
  deadlineStatus: text("deadline_status"),
  deadlineReviewedBy: text("deadline_reviewed_by"),
  deadlineReviewedAt: timestamp("deadline_reviewed_at"),
  mediaUrls: text("media_urls").array().default([]),
  mediaTypes: text("media_types").array().default([]),
  proofUrls: text("proof_urls").array().default([]),
  acknowledgedBy: text("acknowledged_by"),
  acknowledgedAt: timestamp("acknowledged_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activityCheckpoints = pgTable("activity_checkpoints", {
  id: varchar("id").primaryKey(),
  assignmentId: varchar("assignment_id").references(() => assignments.id).notNull(),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  grinderId: varchar("grinder_id").references(() => grinders.id).notNull(),
  type: text("type").notNull(),
  response: text("response"),
  note: text("note"),
  resolvedBy: text("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  resolvedNote: text("resolved_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const performanceReports = pgTable("performance_reports", {
  id: varchar("id").primaryKey(),
  assignmentId: varchar("assignment_id").references(() => assignments.id).notNull(),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  grinderId: varchar("grinder_id").references(() => grinders.id).notNull(),
  metricsSnapshot: jsonb("metrics_snapshot").notNull().default({}),
  metricDeltas: jsonb("metric_deltas").notNull().default({}),
  checkpointSummary: jsonb("checkpoint_summary").notNull().default({}),
  dailyUpdateCompliance: numeric("daily_update_compliance").default("100"),
  overallGrade: text("overall_grade").default("A"),
  staffNotes: text("staff_notes"),
  status: text("status").notNull().default("Draft"),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payoutRequests = pgTable("payout_requests", {
  id: varchar("id").primaryKey(),
  displayId: varchar("display_id"),
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
  grinderApprovedAt: timestamp("grinder_approved_at"),
  disputeReason: text("dispute_reason"),
  requestedPlatform: text("requested_platform"),
  requestedDetails: text("requested_details"),
  requestedAmount: numeric("requested_amount"),
  completionProofUrl: text("completion_proof_url"),
  paymentProofUrl: text("payment_proof_url"),
  originalAmount: numeric("original_amount"),
  reductionReason: text("reduction_reason"),
  reductionRequestedBy: text("reduction_requested_by"),
  reductionRequestedAt: timestamp("reduction_requested_at"),
  reductionStatus: text("reduction_status"),
  reductionApprovedBy: text("reduction_approved_by"),
  reductionApprovedAt: timestamp("reduction_approved_at"),
  reductionDeniedReason: text("reduction_denied_reason"),
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
  displayId: varchar("display_id"),
  grinderId: varchar("grinder_id").references(() => grinders.id).notNull(),
  action: text("action").notNull(),
  reason: text("reason").notNull(),
  delta: integer("delta").notNull(),
  resultingStrikes: integer("resulting_strikes").notNull(),
  fineAmount: numeric("fine_amount").notNull().default("0"),
  finePaid: boolean("fine_paid").notNull().default(false),
  finePaidAt: timestamp("fine_paid_at"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  acknowledgedAt: timestamp("acknowledged_at"),
});

export const strikeAppeals = pgTable("strike_appeals", {
  id: varchar("id").primaryKey(),
  strikeLogId: varchar("strike_log_id").references(() => strikeLogs.id).notNull(),
  grinderId: varchar("grinder_id").references(() => grinders.id).notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"),
  reviewedBy: text("reviewed_by"),
  reviewedByName: text("reviewed_by_name"),
  reviewNote: text("review_note"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

export const messageThreads = pgTable("message_threads", {
  id: varchar("id").primaryKey(),
  title: text("title"),
  type: text("type").notNull().default("dm"),
  ownerId: varchar("owner_id").notNull(),
  lastMessageText: text("last_message_text"),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const threadParticipants = pgTable("thread_participants", {
  id: varchar("id").primaryKey(),
  threadId: varchar("thread_id").references(() => messageThreads.id).notNull(),
  userId: varchar("user_id").notNull(),
  userName: text("user_name").notNull(),
  userRole: text("user_role").notNull().default("grinder"),
  userAvatarUrl: text("user_avatar_url"),
  unreadCount: integer("unread_count").notNull().default(0),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey(),
  threadId: varchar("thread_id").references(() => messageThreads.id).notNull(),
  senderUserId: varchar("sender_user_id").notNull(),
  senderName: text("sender_name").notNull(),
  senderRole: text("sender_role").notNull().default("grinder"),
  body: text("body").notNull(),
  attachments: text("attachments").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id"),
  roleScope: text("role_scope").notNull().default("all"),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  linkUrl: text("link_url"),
  icon: text("icon"),
  severity: text("severity").notNull().default("info"),
  readBy: jsonb("read_by").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey(),
  displayId: varchar("display_id"),
  type: text("type").notNull().default("event"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  discountPercent: integer("discount_percent"),
  tags: text("tags").array().default([]),
  priority: text("priority").notNull().default("normal"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull(),
  createdByName: text("created_by_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const patchNotes = pgTable("patch_notes", {
  id: varchar("id").primaryKey(),
  rawText: text("raw_text").notNull(),
  polishedText: text("polished_text"),
  title: text("title").notNull(),
  status: text("status").notNull().default("draft"),
  createdBy: varchar("created_by").notNull(),
  createdByName: text("created_by_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
});

export const customerReviews = pgTable("customer_reviews", {
  id: varchar("id").primaryKey(),
  displayId: varchar("display_id"),
  grinderId: varchar("grinder_id").references(() => grinders.id).notNull(),
  orderId: varchar("order_id").references(() => orders.id),
  reviewerId: varchar("reviewer_id").notNull(),
  reviewerName: text("reviewer_name").notNull(),
  reviewerRole: text("reviewer_role").notNull(),
  rating: integer("rating").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  proofLinks: text("proof_links").array().default([]),
  proofNotes: text("proof_notes"),
  status: text("status").notNull().default("pending"),
  decisionBy: varchar("decision_by"),
  decisionByName: text("decision_by_name"),
  decisionNote: text("decision_note"),
  decisionAt: timestamp("decision_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderClaimRequests = pgTable("order_claim_requests", {
  id: varchar("id").primaryKey(),
  displayId: varchar("display_id"),
  grinderId: varchar("grinder_id").references(() => grinders.id).notNull(),
  repairType: text("repair_type").notNull().default("claim_missing"),
  orderId: varchar("order_id"),
  ticketName: text("ticket_name").notNull(),
  serviceId: varchar("service_id"),
  proofLinks: text("proof_links").array().default([]),
  proofNotes: text("proof_notes"),
  dueDate: timestamp("due_date"),
  startDateTime: timestamp("start_date_time"),
  completedDateTime: timestamp("completed_date_time"),
  grinderAmount: numeric("grinder_amount"),
  payoutPlatform: text("payout_platform"),
  payoutDetails: text("payout_details"),
  fixFields: text("fix_fields"),
  status: text("status").notNull().default("pending"),
  decidedBy: varchar("decided_by"),
  decidedByName: text("decided_by_name"),
  decisionNote: text("decision_note"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  decidedAt: timestamp("decided_at"),
});

export const reviewAccessCodes = pgTable("review_access_codes", {
  id: varchar("id").primaryKey(),
  orderId: varchar("order_id").references(() => orders.id),
  grinderId: varchar("grinder_id").references(() => grinders.id).notNull(),
  accessCode: varchar("access_code").notNull(),
  customerName: text("customer_name"),
  status: text("status").notNull().default("unused"),
  sessionToken: varchar("session_token"),
  approvedBy: varchar("approved_by"),
  approvedByName: text("approved_by_name"),
  approvedAt: timestamp("approved_at"),
  deniedBy: varchar("denied_by"),
  deniedByName: text("denied_by_name"),
  deniedAt: timestamp("denied_at"),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const grinderTasks = pgTable("grinder_tasks", {
  id: varchar("id").primaryKey(),
  grinderId: varchar("grinder_id").references(() => grinders.id).notNull(),
  assignmentId: varchar("assignment_id").references(() => assignments.id),
  orderId: varchar("order_id").references(() => orders.id),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull().default("custom"),
  status: text("status").notNull().default("pending"),
  priority: text("priority").notNull().default("normal"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const grinderBadges = pgTable("grinder_badges", {
  id: varchar("id").primaryKey(),
  grinderId: varchar("grinder_id").references(() => grinders.id).notNull(),
  badgeId: varchar("badge_id").notNull(),
  awardedBy: varchar("awarded_by"),
  awardedByName: text("awarded_by_name"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGrinderBadgeSchema = createInsertSchema(grinderBadges).omit({ createdAt: true });
export type InsertGrinderBadge = z.infer<typeof insertGrinderBadgeSchema>;
export type GrinderBadge = typeof grinderBadges.$inferSelect;

export const deletionRequests = pgTable("deletion_requests", {
  id: varchar("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  entityLabel: text("entity_label"),
  reason: text("reason").notNull(),
  requestedBy: text("requested_by").notNull(),
  requestedByName: text("requested_by_name"),
  status: text("status").notNull().default("Pending"),
  reviewedBy: text("reviewed_by"),
  reviewedByName: text("reviewed_by_name"),
  reviewedAt: timestamp("reviewed_at"),
  denyReason: text("deny_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDeletionRequestSchema = createInsertSchema(deletionRequests).omit({ createdAt: true });
export type InsertDeletionRequest = z.infer<typeof insertDeletionRequestSchema>;
export type DeletionRequest = typeof deletionRequests.$inferSelect;

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

export const finePayments = pgTable("fine_payments", {
  id: varchar("id").primaryKey(),
  displayId: varchar("display_id"),
  grinderId: varchar("grinder_id").references(() => grinders.id).notNull(),
  amount: numeric("amount").notNull(),
  paymentMethod: text("payment_method").notNull(),
  proofUrl: text("proof_url").notNull(),
  status: text("status").notNull().default("pending"),
  reviewedBy: text("reviewed_by"),
  reviewedByName: text("reviewed_by_name"),
  reviewNote: text("review_note"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertServiceSchema = createInsertSchema(services);
export const insertGrinderSchema = createInsertSchema(grinders);
export const insertOrderSchema = createInsertSchema(orders, {
  orderDueDate: z.string().or(z.date()),
  customerPrice: z.string(),
  complexity: z.number().min(1).max(5),
}).omit({ createdAt: true });
export const insertBidSchema = createInsertSchema(bids);
export const insertAssignmentSchema = createInsertSchema(assignments);
export const insertQueueConfigSchema = createInsertSchema(queueConfig);
export const insertOrderUpdateSchema = createInsertSchema(orderUpdates).omit({ createdAt: true, acknowledgedBy: true, acknowledgedAt: true });
export const insertActivityCheckpointSchema = createInsertSchema(activityCheckpoints).omit({ createdAt: true, resolvedBy: true, resolvedAt: true, resolvedNote: true });
export const insertPerformanceReportSchema = createInsertSchema(performanceReports).omit({ createdAt: true, approvedBy: true, approvedAt: true });
export const insertPayoutRequestSchema = createInsertSchema(payoutRequests).omit({ createdAt: true, reviewedAt: true, paidAt: true });
export const insertGrinderPayoutMethodSchema = createInsertSchema(grinderPayoutMethods).omit({ createdAt: true, updatedAt: true });
export const insertEliteRequestSchema = createInsertSchema(eliteRequests).omit({ requestedAt: true, reviewedAt: true });
export const insertStaffAlertSchema = createInsertSchema(staffAlerts).omit({ createdAt: true });
export const insertStrikeLogSchema = createInsertSchema(strikeLogs).omit({ createdAt: true, acknowledgedAt: true });
export const insertStrikeAppealSchema = createInsertSchema(strikeAppeals).omit({ createdAt: true, reviewedAt: true, reviewedBy: true, reviewedByName: true, reviewNote: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ createdAt: true });
export const insertMessageThreadSchema = createInsertSchema(messageThreads).omit({ createdAt: true });
export const insertThreadParticipantSchema = createInsertSchema(threadParticipants).omit({ joinedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ createdAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ createdAt: true, updatedAt: true });
export const insertPatchNoteSchema = createInsertSchema(patchNotes).omit({ createdAt: true, publishedAt: true });
export const insertCustomerReviewSchema = createInsertSchema(customerReviews).omit({ createdAt: true, updatedAt: true, decisionBy: true, decisionByName: true, decisionNote: true, decisionAt: true });
export const insertOrderClaimRequestSchema = createInsertSchema(orderClaimRequests).omit({ requestedAt: true, decidedAt: true, decidedBy: true, decidedByName: true, decisionNote: true });
export const insertReviewAccessCodeSchema = createInsertSchema(reviewAccessCodes).omit({ createdAt: true, approvedBy: true, approvedByName: true, approvedAt: true, deniedBy: true, deniedByName: true, deniedAt: true, usedAt: true });
export const insertGrinderTaskSchema = createInsertSchema(grinderTasks).omit({ createdAt: true, completedAt: true });
export const insertFinePaymentSchema = createInsertSchema(finePayments).omit({ createdAt: true, reviewedAt: true, reviewedBy: true, reviewedByName: true, reviewNote: true });

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
export type ActivityCheckpoint = typeof activityCheckpoints.$inferSelect;
export type InsertActivityCheckpoint = z.infer<typeof insertActivityCheckpointSchema>;
export type PerformanceReport = typeof performanceReports.$inferSelect;
export type InsertPerformanceReport = z.infer<typeof insertPerformanceReportSchema>;
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
export type StrikeAppeal = typeof strikeAppeals.$inferSelect;
export type InsertStrikeAppeal = z.infer<typeof insertStrikeAppealSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type MessageThread = typeof messageThreads.$inferSelect;
export type InsertMessageThread = z.infer<typeof insertMessageThreadSchema>;
export type ThreadParticipant = typeof threadParticipants.$inferSelect;
export type InsertThreadParticipant = z.infer<typeof insertThreadParticipantSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type PatchNote = typeof patchNotes.$inferSelect;
export type InsertPatchNote = z.infer<typeof insertPatchNoteSchema>;
export type CustomerReview = typeof customerReviews.$inferSelect;
export type InsertCustomerReview = z.infer<typeof insertCustomerReviewSchema>;
export type OrderClaimRequest = typeof orderClaimRequests.$inferSelect;
export type InsertOrderClaimRequest = z.infer<typeof insertOrderClaimRequestSchema>;
export type ReviewAccessCode = typeof reviewAccessCodes.$inferSelect;
export type InsertReviewAccessCode = z.infer<typeof insertReviewAccessCodeSchema>;
export type GrinderTask = typeof grinderTasks.$inferSelect;
export type InsertGrinderTask = z.infer<typeof insertGrinderTaskSchema>;

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
  displayRole?: string | null;
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
  fineRevenue: number;
};

export type DashboardStats = {
  activeOrders: number;
  completedToday: number;
  availableGrinders: number;
  totalGrinders: number;
};

export const staffTasks = pgTable("staff_tasks", {
  id: varchar("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: text("assigned_to").notNull(),
  assignedBy: text("assigned_by").notNull(),
  assignedByName: text("assigned_by_name").notNull(),
  priority: text("priority").notNull().default("normal"),
  status: text("status").notNull().default("pending"),
  orderId: text("order_id"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStaffTaskSchema = createInsertSchema(staffTasks).omit({ completedAt: true, createdAt: true });
export type InsertStaffTask = z.infer<typeof insertStaffTaskSchema>;
export type StaffTask = typeof staffTasks.$inferSelect;

export type FinePayment = typeof finePayments.$inferSelect;
export type InsertFinePayment = z.infer<typeof insertFinePaymentSchema>;

export const WALLET_TYPES = ["PayPal", "Zelle", "Chase Bank", "Cash App", "Venmo", "Bank Account", "Crypto", "Other"] as const;
export const TRANSACTION_TYPES = ["deposit", "withdrawal", "transfer_in", "transfer_out", "grinder_payout", "business_payout", "fine_received", "order_income", "adjustment"] as const;
export const TRANSACTION_CATEGORIES = ["staff_pay", "owner_pay", "commission", "bot_maintenance", "grinder_payout", "fine", "order_income", "transfer", "subscription", "refund", "misc"] as const;
export const DEFAULT_PAYOUT_CATEGORIES = ["Staff Pay", "Owner Pay", "Commission", "Bot Maintenance", "Subscription", "Misc"] as const;
export const DEFAULT_PAYOUT_ROLES = ["Staff", "Owner", "Creator", "Vendor", "Misc"] as const;

export const businessWallets = pgTable("business_wallets", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  scope: text("scope").notNull().default("company"),
  ownerDiscordId: varchar("owner_discord_id"),
  ownerName: text("owner_name"),
  accountIdentifier: text("account_identifier"),
  balance: numeric("balance").notNull().default("0"),
  startingBalance: numeric("starting_balance").notNull().default("0"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull(),
  createdByName: text("created_by_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBusinessWalletSchema = createInsertSchema(businessWallets).omit({ createdAt: true, updatedAt: true });
export type InsertBusinessWallet = z.infer<typeof insertBusinessWalletSchema>;
export type BusinessWallet = typeof businessWallets.$inferSelect;

export const walletTransactions = pgTable("wallet_transactions", {
  id: varchar("id").primaryKey(),
  walletId: varchar("wallet_id").references(() => businessWallets.id).notNull(),
  type: text("type").notNull(),
  amount: numeric("amount").notNull(),
  balanceBefore: numeric("balance_before").notNull(),
  balanceAfter: numeric("balance_after").notNull(),
  category: text("category").notNull().default("misc"),
  description: text("description"),
  relatedOrderId: varchar("related_order_id"),
  relatedPayoutId: varchar("related_payout_id"),
  relatedGrinderId: varchar("related_grinder_id"),
  relatedTransferId: varchar("related_transfer_id"),
  proofUrl: text("proof_url"),
  performedBy: varchar("performed_by").notNull(),
  performedByName: text("performed_by_name").notNull(),
  performedByRole: text("performed_by_role"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({ createdAt: true });
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;

export const businessPayouts = pgTable("business_payouts", {
  id: varchar("id").primaryKey(),
  walletId: varchar("wallet_id").references(() => businessWallets.id),
  recipientName: text("recipient_name").notNull(),
  recipientRole: text("recipient_role").notNull(),
  category: text("category").notNull(),
  amount: numeric("amount").notNull(),
  description: text("description"),
  orderId: varchar("order_id"),
  proofUrl: text("proof_url"),
  status: text("status").notNull().default("pending"),
  requestedBy: varchar("requested_by").notNull(),
  requestedByName: text("requested_by_name").notNull(),
  approvedBy: varchar("approved_by"),
  approvedByName: text("approved_by_name"),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  rejectedBy: varchar("rejected_by"),
  rejectedByName: text("rejected_by_name"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBusinessPayoutSchema = createInsertSchema(businessPayouts).omit({ approvedBy: true, approvedByName: true, approvedAt: true, paidAt: true, rejectedBy: true, rejectedByName: true, rejectedAt: true, rejectionReason: true, createdAt: true });
export type InsertBusinessPayout = z.infer<typeof insertBusinessPayoutSchema>;
export type BusinessPayout = typeof businessPayouts.$inferSelect;

export const walletTransfers = pgTable("wallet_transfers", {
  id: varchar("id").primaryKey(),
  fromWalletId: varchar("from_wallet_id").references(() => businessWallets.id).notNull(),
  toWalletId: varchar("to_wallet_id").references(() => businessWallets.id).notNull(),
  amount: numeric("amount").notNull(),
  transferFee: numeric("transfer_fee").default("0"),
  description: text("description"),
  relatedOrderId: varchar("related_order_id"),
  proofUrl: text("proof_url"),
  performedBy: varchar("performed_by").notNull(),
  performedByName: text("performed_by_name").notNull(),
  status: text("status").notNull().default("pending"),
  approvedBy: varchar("approved_by"),
  approvedByName: text("approved_by_name"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWalletTransferSchema = createInsertSchema(walletTransfers).omit({ approvedBy: true, approvedByName: true, approvedAt: true, createdAt: true });
export type InsertWalletTransfer = z.infer<typeof insertWalletTransferSchema>;
export type WalletTransfer = typeof walletTransfers.$inferSelect;

export const orderPaymentLinks = pgTable("order_payment_links", {
  id: varchar("id").primaryKey(),
  orderId: varchar("order_id").notNull(),
  receivedByWalletId: varchar("received_by_wallet_id").references(() => businessWallets.id).notNull(),
  companyWalletId: varchar("company_wallet_id").references(() => businessWallets.id),
  amount: numeric("amount").notNull(),
  transferStatus: text("transfer_status").notNull().default("not_needed"),
  transferId: varchar("transfer_id"),
  proofUrl: text("proof_url"),
  notes: text("notes"),
  createdBy: varchar("created_by").notNull(),
  createdByName: text("created_by_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderPaymentLinkSchema = createInsertSchema(orderPaymentLinks).omit({ createdAt: true });
export type InsertOrderPaymentLink = z.infer<typeof insertOrderPaymentLinkSchema>;
export type OrderPaymentLink = typeof orderPaymentLinks.$inferSelect;

export const siteAlerts = pgTable("site_alerts", {
  id: varchar("id").primaryKey(),
  message: text("message").notNull(),
  target: text("target").notNull().default("all"),
  targetUserId: varchar("target_user_id"),
  targetUserName: text("target_user_name"),
  targetRoles: text("target_roles").array().default([]),
  enabled: boolean("enabled").notNull().default(true),
  createdBy: varchar("created_by").notNull(),
  createdByName: text("created_by_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSiteAlertSchema = createInsertSchema(siteAlerts).omit({ createdAt: true });
export type InsertSiteAlert = z.infer<typeof insertSiteAlertSchema>;
export type SiteAlert = typeof siteAlerts.$inferSelect;

export const userActivityLogs = pgTable("user_activity_logs", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  userName: text("user_name").notNull(),
  userRole: text("user_role").notNull(),
  action: text("action").notNull(),
  category: text("category").notNull(),
  targetType: text("target_type"),
  targetId: varchar("target_id"),
  targetName: text("target_name"),
  metadata: text("metadata"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  sessionId: varchar("session_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserActivityLogSchema = createInsertSchema(userActivityLogs).omit({ createdAt: true });
export type UserActivityLog = typeof userActivityLogs.$inferSelect;
export type InsertUserActivityLog = z.infer<typeof insertUserActivityLogSchema>;

export function normalizePlatform(platform: string | null | undefined): string {
  if (!platform) return "Unknown";
  const lower = platform.toLowerCase().trim();
  if (lower.includes("xbox") || lower.includes("xb")) return "Xbox";
  if (lower.includes("ps") || lower.includes("playstation")) return "PS5";
  if (lower.includes("pc") || lower.includes("steam") || lower.includes("epic")) return "PC";
  if (lower.includes("switch") || lower.includes("nintendo")) return "Nintendo";
  return platform;
}
