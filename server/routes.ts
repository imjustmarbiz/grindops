import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  // Require auth for all other API routes
  app.use('/api', (req, res, next) => {
    // Let auth routes pass through
    if (req.path.startsWith('/auth') || req.path === '/login' || req.path === '/callback' || req.path === '/logout') {
      return next();
    }
    return isAuthenticated(req, res, next);
  });

  // Services
  app.get(api.services.list.path, async (req, res) => {
    const results = await storage.getServices();
    res.json(results);
  });

  // Grinders
  app.get(api.grinders.list.path, async (req, res) => {
    const results = await storage.getGrinders();
    res.json(results);
  });

  app.get(api.grinders.get.path, async (req, res) => {
    const result = await storage.getGrinder(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Grinder not found" });
    }
    res.json(result);
  });

  // Orders
  app.get(api.orders.list.path, async (req, res) => {
    const results = await storage.getOrders();
    res.json(results);
  });

  app.get(api.orders.get.path, async (req, res) => {
    const result = await storage.getOrder(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(result);
  });

  app.post(api.orders.create.path, async (req, res) => {
    try {
      const input = api.orders.create.input.parse(req.body);
      const result = await storage.createOrder(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.orders.updateStatus.path, async (req, res) => {
    try {
      const { status } = api.orders.updateStatus.input.parse(req.body);
      const result = await storage.updateOrderStatus(req.params.id, status);
      if (!result) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      throw err;
    }
  });

  // Bids
  app.get(api.bids.list.path, async (req, res) => {
    const results = await storage.getBids();
    res.json(results);
  });

  app.post(api.bids.create.path, async (req, res) => {
    try {
      const input = api.bids.create.input.parse(req.body);
      const result = await storage.createBid(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Assignments
  app.get(api.assignments.list.path, async (req, res) => {
    const results = await storage.getAssignments();
    res.json(results);
  });

  app.post(api.assignments.create.path, async (req, res) => {
    try {
      const input = api.assignments.create.input.parse(req.body);
      const result = await storage.createAssignment(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Dashboard & Queue
  app.get(api.dashboard.stats.path, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  app.get(api.queue.getTop.path, async (req, res) => {
    const topItems = await storage.getTopQueueItems();
    res.json(topItems);
  });

  return httpServer;
}

export async function seedDatabase() {
  const existingServices = await storage.getServices();
  if (existingServices.length === 0) {
    // Seed Services
    const servicesData = [
      { id: 'S1', name: 'VC Grinding 🪙', group: 'VC', defaultComplexity: 1, slaDays: 5 },
      { id: 'S2', name: 'Badge Grinding 🎖️', group: 'Badges', defaultComplexity: 2, slaDays: 5 },
      { id: 'S3', name: 'Rep Grinding ⚡', group: 'Rep', defaultComplexity: 5, slaDays: 7 },
    ];
    for (const s of servicesData) await storage.createService(s);

    // Seed Grinders
    const grindersData = [
      { id: 'GRD-01', name: '7unds', tier: 'Regular', capacity: 3, activeOrders: 1 },
      { id: 'GRD-02', name: '8fy1', tier: 'Regular', capacity: 3, activeOrders: 0 },
      { id: 'GRD-03', name: 'comptomuch', tier: 'Elite', capacity: 5, activeOrders: 0 },
    ];
    for (const g of grindersData) await storage.createGrinder(g);

    // Seed Orders
    const now = new Date();
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const ordersData = [
      { id: 'O1001', serviceId: 'S1', customerPrice: "25.00", orderDueDate: futureDate, isRush: false, complexity: 1, location: 'Retail', status: 'Open' },
      { id: 'O1002', serviceId: 'S2', customerPrice: "50.00", orderDueDate: futureDate, isRush: true, complexity: 2, location: 'Retail', status: 'Open' },
      { id: 'O1003', serviceId: 'S3', customerPrice: "100.00", orderDueDate: futureDate, isRush: false, complexity: 5, location: 'Retail', status: 'Assigned' },
    ];
    for (const o of ordersData) await storage.createOrder(o);

    // Seed Bids
    const bidsData = [
      { id: 'B2001', orderId: 'O1001', grinderId: 'GRD-01', bidAmount: "15.00", estDeliveryDate: futureDate, status: 'Pending' },
      { id: 'B2002', orderId: 'O1001', grinderId: 'GRD-02', bidAmount: "18.00", estDeliveryDate: futureDate, status: 'Pending' },
      { id: 'B2003', orderId: 'O1002', grinderId: 'GRD-03', bidAmount: "35.00", estDeliveryDate: futureDate, status: 'Pending' },
    ];
    for (const b of bidsData) await storage.createBid(b);

    // Seed Assignments
    const assignmentsData = [
      { id: 'A1', grinderId: 'GRD-01', orderId: 'O1003', dueDateTime: futureDate, status: 'Active' },
    ];
    for (const a of assignmentsData) await storage.createAssignment(a);
  }
}
