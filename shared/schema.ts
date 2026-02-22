import { pgTable, text, varchar, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export * from "./models/auth";

// === TABLE DEFINITIONS ===

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
  tier: text("tier").notNull().default("New"),
  capacity: integer("capacity").notNull().default(3),
  activeOrders: integer("active_orders").notNull().default(0),
  ordersAssignedL7D: integer("orders_assigned_l7d").notNull().default(0),
  totalOrders: integer("total_orders").notNull().default(0),
  totalReviews: integer("total_reviews").notNull().default(0),
  winRate: numeric("win_rate"),
  lastAssigned: timestamp("last_assigned"),
  utilization: numeric("utilization").notNull().default("0"),
  avgQualityRating: numeric("avg_quality_rating"),
  onTimeRate: numeric("on_time_rate"),
  cancelRate: numeric("cancel_rate"),
  avgTurnaroundDays: numeric("avg_turnaround_days"),
  notes: text("notes"),
  strikes: integer("strikes").notNull().default(0),
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
  complexity: integer("complexity").notNull().default(1),
  location: text("location"),
  status: text("status").notNull().default("Open"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
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
  margin: numeric("margin"),
  marginPct: numeric("margin_pct"),
  dueDateTime: timestamp("due_date_time").notNull(),
  deliveredDateTime: timestamp("delivered_date_time"),
  isOnTime: boolean("is_on_time"),
  qualityRating: integer("quality_rating"),
  notes: text("notes"),
});

export const queueConfig = pgTable("queue_config", {
  id: varchar("id").primaryKey(),
  profitWeight: numeric("profit_weight").notNull().default("0.40"),
  fairnessWeight: numeric("fairness_weight").notNull().default("0.36"),
  tierWeight: numeric("tier_weight").notNull().default("0.04"),
  deliveryWeight: numeric("delivery_weight").notNull().default("0.15"),
  qualityWeight: numeric("quality_weight").notNull().default("0.05"),
  reliabilityWeight: numeric("reliability_weight").notNull().default("0.00"),
  riskWeight: numeric("risk_weight").notNull().default("0.00"),
});

// === RELATIONS ===

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

// === EXPLICIT API CONTRACT TYPES ===

export const insertServiceSchema = createInsertSchema(services);
export const insertGrinderSchema = createInsertSchema(grinders);
export const insertOrderSchema = createInsertSchema(orders).omit({ createdAt: true });
export const insertBidSchema = createInsertSchema(bids);
export const insertAssignmentSchema = createInsertSchema(assignments);
export const insertQueueConfigSchema = createInsertSchema(queueConfig);

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

export type QueueItem = {
  id: string;
  orderId: string;
  serviceName: string;
  customerPrice: string;
  dueDateTime: Date;
  grinderName: string;
  tier: string;
  bidAmount: string;
  estDeliveryDateTime: Date;
  finalPriorityScore: number;
};

export type DashboardStats = {
  activeOrders: number;
  completedToday: number;
  availableGrinders: number;
  totalGrinders: number;
};
