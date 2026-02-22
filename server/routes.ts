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
  await setupAuth(app);
  registerAuthRoutes(app);

  app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/auth') || req.path === '/login' || req.path === '/callback' || req.path === '/logout') {
      return next();
    }
    return isAuthenticated(req, res, next);
  });

  app.get(api.services.list.path, async (req, res) => {
    const results = await storage.getServices();
    res.json(results);
  });

  app.get(api.grinders.list.path, async (req, res) => {
    const results = await storage.getGrinders();
    res.json(results);
  });

  app.get(api.grinders.get.path, async (req, res) => {
    const result = await storage.getGrinder(req.params.id);
    if (!result) return res.status(404).json({ message: "Grinder not found" });
    res.json(result);
  });

  app.patch(api.grinders.update.path, async (req, res) => {
    try {
      const result = await storage.updateGrinder(req.params.id, req.body);
      if (!result) return res.status(404).json({ message: "Grinder not found" });
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "grinder",
        entityId: req.params.id,
        action: "updated",
        actor: "admin",
        details: JSON.stringify(req.body),
      });
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: String(err) });
    }
  });

  app.get(api.orders.list.path, async (req, res) => {
    const results = await storage.getOrders();
    res.json(results);
  });

  app.get(api.orders.get.path, async (req, res) => {
    const result = await storage.getOrder(req.params.id);
    if (!result) return res.status(404).json({ message: "Order not found" });
    res.json(result);
  });

  app.post(api.orders.create.path, async (req, res) => {
    try {
      const input = api.orders.create.input.parse(req.body);
      const result = await storage.createOrder(input);
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "order",
        entityId: result.id,
        action: "created",
        actor: "admin",
        details: JSON.stringify({ customerPrice: result.customerPrice, serviceId: result.serviceId }),
      });
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.patch(api.orders.updateStatus.path, async (req, res) => {
    try {
      const { status } = api.orders.updateStatus.input.parse(req.body);
      const result = await storage.updateOrderStatus(req.params.id, status);
      if (!result) return res.status(404).json({ message: "Order not found" });
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "order",
        entityId: req.params.id,
        action: `status_changed_to_${status}`,
        actor: "admin",
        details: JSON.stringify({ newStatus: status }),
      });
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.orders.suggestions.path, async (req, res) => {
    const suggestions = await storage.getSuggestionsForOrder(req.params.id);
    res.json(suggestions);
  });

  app.get(api.bids.list.path, async (req, res) => {
    const results = await storage.getBids();
    res.json(results);
  });

  app.post(api.bids.create.path, async (req, res) => {
    try {
      const input = api.bids.create.input.parse(req.body);
      const result = await storage.createBid(input);
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "bid",
        entityId: result.id,
        action: "created",
        actor: "admin",
        details: JSON.stringify({ orderId: result.orderId, grinderId: result.grinderId, bidAmount: result.bidAmount }),
      });
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.get(api.assignments.list.path, async (req, res) => {
    const results = await storage.getAssignments();
    res.json(results);
  });

  app.post(api.assignments.create.path, async (req, res) => {
    try {
      const input = api.assignments.create.input.parse(req.body);
      const result = await storage.createAssignment(input);
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "assignment",
        entityId: result.id,
        action: "created",
        actor: "admin",
        details: JSON.stringify({ grinderId: result.grinderId, orderId: result.orderId }),
      });
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.get(api.analytics.summary.path, async (req, res) => {
    const summary = await storage.getAnalyticsSummary();
    res.json(summary);
  });

  app.get(api.dashboard.stats.path, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  app.get(api.queue.getTop.path, async (req, res) => {
    const topItems = await storage.getTopQueueItems();
    res.json(topItems);
  });

  app.get(api.queue.emergency.path, async (req, res) => {
    const emergency = await storage.getEmergencyQueue();
    res.json(emergency);
  });

  app.get(api.auditLogs.list.path, async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 100;
    const entityType = req.query.entityType as string | undefined;
    const logs = await storage.getAuditLogs(limit, entityType);
    res.json(logs);
  });

  app.get(api.config.get.path, async (req, res) => {
    const config = await storage.getQueueConfig();
    res.json(config);
  });

  app.put(api.config.update.path, async (req, res) => {
    try {
      const config = await storage.upsertQueueConfig(req.body);
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "config",
        entityId: "default",
        action: "updated",
        actor: "admin",
        details: JSON.stringify(req.body),
      });
      res.json(config);
    } catch (err) {
      res.status(400).json({ message: String(err) });
    }
  });

  return httpServer;
}

export async function seedDatabase() {
  const existingServices = await storage.getServices();
  if (existingServices.length === 0) {
    const servicesData = [
      { id: 'S1', name: 'VC Grinding', group: 'VC', defaultComplexity: 1, slaDays: 5 },
      { id: 'S2', name: 'Badge Grinding', group: 'Badges', defaultComplexity: 2, slaDays: 5 },
      { id: 'S3', name: 'Rep Grinding', group: 'Rep', defaultComplexity: 5, slaDays: 7 },
      { id: 'S4', name: 'Build Services', group: 'Build', defaultComplexity: 3, slaDays: 3 },
    ];
    for (const s of servicesData) await storage.createService(s);
  }
  await storage.getQueueConfig();
}
