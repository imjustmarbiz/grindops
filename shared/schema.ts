import { pgTable, text, varchar, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const services = pgTable("services", {
  id: varchar("id").primaryKey(), // e.g. S1
  name: text("name").notNull(), // e.g. "VC Grinding"
  group: text("group").notNull(), // e.g. "VC"
  defaultComplexity: integer("default_complexity").notNull().default(1),
  slaDays: integer("sla_days").notNull().default(1),
  notes: text("notes"),
});

export const grinders = pgTable("grinders", {
  id: varchar("id").primaryKey(), // e.g. GRD-01
  name: text("name").notNull(),
  tier: text("tier").notNull().default("Regular"), // "Regular", "Elite"
  capacity: integer("capacity").notNull().default(3),
  activeOrders: integer("active_orders").notNull().default(0),
  ordersAssignedL7D: integer("orders_assigned_l7d").notNull().default(0),
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
  id: varchar("id").primaryKey(), // e.g. O1001
  serviceId: varchar("service_id").references(() => services.id).notNull(),
  customerPrice: numeric("customer_price").notNull(),
  orderDueDate: timestamp("order_due_date").notNull(),
  isRush: boolean("is_rush").notNull().default(false),
  complexity: integer("complexity").notNull().default(1),
  location: text("location"), // e.g. "Retail"
  status: text("status").notNull().default("Open"), // "Open", "Assigned", "Completed"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bids = pgTable("bids", {
  id: varchar("id").primaryKey(), // e.g. B2001
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  grinderId: varchar("grinder_id").references(() => grinders.id).notNull(),
  bidAmount: numeric("bid_amount").notNull(),
  bidTime: timestamp("bid_time").defaultNow().notNull(),
  estDeliveryDate: timestamp("est_delivery_date").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("Pending"), // "Pending", "Accepted", "Rejected"
});

export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey(), // e.g. A1
  grinderId: varchar("grinder_id").references(() => grinders.id).notNull(),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  assignedDateTime: timestamp("assigned_date_time").defaultNow().notNull(),
  status: text("status").notNull().default("Active"), // "Active", "Completed", "Cancelled", "Reassigned"
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

// Zod schemas
export const insertServiceSchema = createInsertSchema(services);
export const insertGrinderSchema = createInsertSchema(grinders);
export const insertOrderSchema = createInsertSchema(orders).omit({ createdAt: true });
export const insertBidSchema = createInsertSchema(bids);
export const insertAssignmentSchema = createInsertSchema(assignments);
export const insertQueueConfigSchema = createInsertSchema(queueConfig);

// Types
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
  id: string; // bid id
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
