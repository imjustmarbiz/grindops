import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupDiscordAuth, isAuthenticated, requireStaff, requireGrinderOrStaff } from "./discord/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupDiscordAuth(app);

  app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/auth') || req.path === '/logout') {
      return next();
    }
    return isAuthenticated(req, res, next);
  });

  app.get(api.services.list.path, async (req, res) => {
    const results = await storage.getServices();
    res.json(results);
  });

  app.get(api.grinders.list.path, requireStaff, async (req, res) => {
    const results = await storage.getGrinders();
    res.json(results);
  });

  app.get(api.grinders.get.path, requireStaff, async (req, res) => {
    const result = await storage.getGrinder(req.params.id);
    if (!result) return res.status(404).json({ message: "Grinder not found" });
    res.json(result);
  });

  app.patch(api.grinders.update.path, requireStaff, async (req, res) => {
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

  app.get(api.orders.list.path, requireStaff, async (req, res) => {
    const results = await storage.getOrders();
    res.json(results);
  });

  app.get(api.orders.get.path, requireStaff, async (req, res) => {
    const result = await storage.getOrder(req.params.id);
    if (!result) return res.status(404).json({ message: "Order not found" });
    res.json(result);
  });

  app.post(api.orders.create.path, requireStaff, async (req, res) => {
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

  app.patch(api.orders.updateStatus.path, requireStaff, async (req, res) => {
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

  app.delete(api.orders.delete.path, requireStaff, async (req, res) => {
    try {
      const deleted = await storage.deleteOrder(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Order not found" });
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "order",
        entityId: req.params.id,
        action: "deleted",
        actor: "admin",
        details: JSON.stringify({ orderId: req.params.id }),
      });
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ message: String(err) });
    }
  });

  app.patch(api.orders.updatePrice.path, requireStaff, async (req, res) => {
    try {
      const { customerPrice } = api.orders.updatePrice.input.parse(req.body);
      const result = await storage.updateOrder(req.params.id, { customerPrice });
      if (!result) return res.status(404).json({ message: "Order not found" });
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "order",
        entityId: req.params.id,
        action: "price_updated",
        actor: "admin",
        details: JSON.stringify({ newPrice: customerPrice }),
      });
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.orders.update.path, requireStaff, async (req, res) => {
    try {
      const input = api.orders.update.input.parse(req.body);
      const updateData: any = { ...input };
      if (input.orderDueDate) {
        updateData.orderDueDate = new Date(input.orderDueDate);
      }
      const result = await storage.updateOrder(req.params.id, updateData);
      if (!result) return res.status(404).json({ message: "Order not found" });
      const changedFields = Object.keys(input).join(", ");
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "order",
        entityId: req.params.id,
        action: "fields_updated",
        actor: "admin",
        details: JSON.stringify(input),
      });
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(400).json({ message: String(err) });
    }
  });

  app.get(api.orders.suggestions.path, requireStaff, async (req, res) => {
    const suggestions = await storage.getSuggestionsForOrder(req.params.id);
    res.json(suggestions);
  });

  app.get(api.bids.list.path, requireStaff, async (req, res) => {
    const results = await storage.getBids();
    res.json(results);
  });

  app.post(api.bids.create.path, requireStaff, async (req, res) => {
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

  app.get(api.assignments.list.path, requireStaff, async (req, res) => {
    const results = await storage.getAssignments();
    res.json(results);
  });

  app.post(api.assignments.create.path, requireStaff, async (req, res) => {
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

  app.post(api.assignments.replace.path, requireStaff, async (req, res) => {
    try {
      const input = api.assignments.replace.input.parse(req.body);
      const assignment = await storage.getAssignment(req.params.id);
      if (!assignment) return res.status(404).json({ message: "Assignment not found" });
      if (assignment.status !== "Active") return res.status(400).json({ message: "Can only replace grinders on active assignments" });

      const replacementGrinder = await storage.getGrinder(input.replacementGrinderId);
      if (!replacementGrinder) return res.status(404).json({ message: "Replacement grinder not found" });

      const origPay = parseFloat(input.originalGrinderPay) || 0;
      const replPay = parseFloat(input.replacementGrinderPay) || 0;
      if (origPay < 0 || replPay < 0) return res.status(400).json({ message: "Pay values cannot be negative" });

      const originalGrinderId = assignment.grinderId;
      const result = await storage.replaceGrinder(req.params.id, {
        replacementGrinderId: input.replacementGrinderId,
        originalGrinderPay: input.originalGrinderPay,
        replacementGrinderPay: input.replacementGrinderPay,
        reason: input.reason,
      });

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "assignment",
        entityId: req.params.id,
        action: "grinder_replaced",
        actor: "admin",
        details: JSON.stringify({
          orderId: assignment.orderId,
          originalGrinderId,
          replacementGrinderId: input.replacementGrinderId,
          originalGrinderPay: input.originalGrinderPay,
          replacementGrinderPay: input.replacementGrinderPay,
          reason: input.reason,
        }),
      });

      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(400).json({ message: String(err) });
    }
  });

  app.get("/api/grinder/me", async (req, res) => {
    const userId = (req as any).userId;
    const grinders = await storage.getGrinders();
    const myGrinder = grinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.json(null);

    const allAssignments = await storage.getAssignments();
    const myAssignments = allAssignments.filter((a: any) => a.grinderId === myGrinder.id);

    const allBids = await storage.getBids();
    const myBids = allBids.filter((b: any) => b.grinderId === myGrinder.id);

    res.json({
      grinder: myGrinder,
      assignments: myAssignments.map((a: any) => ({
        id: a.id,
        orderId: a.orderId,
        status: a.status,
        startDate: a.startDate,
        grinderId: a.grinderId,
      })),
      bids: myBids.map((b: any) => ({
        id: b.id,
        orderId: b.orderId,
        status: b.status,
        bidAmount: b.bidAmount,
        createdAt: b.createdAt,
      })),
      stats: {
        totalAssignments: myAssignments.length,
        activeAssignments: myAssignments.filter((a: any) => a.status === "Active").length,
        completedAssignments: myAssignments.filter((a: any) => a.status === "Completed").length,
        totalBids: myBids.length,
        pendingBids: myBids.filter((b: any) => b.status === "Pending").length,
      },
    });
  });

  app.get(api.analytics.summary.path, requireStaff, async (req, res) => {
    const summary = await storage.getAnalyticsSummary();
    res.json(summary);
  });

  app.get(api.dashboard.stats.path, requireStaff, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  app.get(api.queue.getTop.path, requireStaff, async (req, res) => {
    const topItems = await storage.getTopQueueItems();
    res.json(topItems);
  });

  app.get(api.queue.emergency.path, requireStaff, async (req, res) => {
    const emergency = await storage.getEmergencyQueue();
    res.json(emergency);
  });

  app.get(api.auditLogs.list.path, requireStaff, async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 100;
    const entityType = req.query.entityType as string | undefined;
    const logs = await storage.getAuditLogs(limit, entityType);
    res.json(logs);
  });

  app.get(api.config.get.path, requireStaff, async (req, res) => {
    const config = await storage.getQueueConfig();
    res.json(config);
  });

  app.put(api.config.update.path, requireStaff, async (req, res) => {
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
