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
  // Services
  getServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;

  // Grinders
  getGrinders(): Promise<Grinder[]>;
  getGrinder(id: string): Promise<Grinder | undefined>;
  createGrinder(grinder: InsertGrinder): Promise<Grinder>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;

  // Bids
  getBids(): Promise<Bid[]>;
  createBid(bid: InsertBid): Promise<Bid>;

  // Assignments
  getAssignments(): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;

  // Dashboard & Queue
  getDashboardStats(): Promise<DashboardStats>;
  getTopQueueItems(): Promise<QueueItem[]>;
}

export class DatabaseStorage implements IStorage {
  async getServices(): Promise<Service[]> {
    return await db.select().from(services);
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

  async createGrinder(grinder: InsertGrinder): Promise<Grinder> {
    const [created] = await db.insert(grinders).values(grinder).returning();
    return created;
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
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

  async createBid(bid: InsertBid): Promise<Bid> {
    const [created] = await db.insert(bids).values(bid).returning();
    return created;
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
    const completedTodayRes = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(orders).where(eq(orders.status, 'Completed')); // Should be limited to today ideally
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
    // This is a simplified version of the queue ranking logic from the spreadsheet
    // In a real scenario, this would apply all the complex weights (profit, fairness, delivery)
    
    // Using raw SQL for the join
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
        -- Simplified score for demo: based on bid amount / customer price (lower is better, so inverted)
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
