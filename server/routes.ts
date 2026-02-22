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
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.json(null);

    const allAssignments = await storage.getAssignments();
    const myAssignments = allAssignments.filter((a: any) => a.grinderId === myGrinder.id);

    const allBids = await storage.getBids();
    const myBids = allBids.filter((b: any) => b.grinderId === myGrinder.id);

    const allOrders = await storage.getOrders();
    const myOrderUpdates = await storage.getOrderUpdates(myGrinder.id);
    const myPayoutRequests = await storage.getPayoutRequests(myGrinder.id);

    const openOrders = allOrders.filter((o: any) => o.status === "Open");
    const myBidOrderIds = myBids.map((b: any) => b.orderId);

    const availableOrders = openOrders.map((o: any) => {
      const orderBids = allBids.filter((b: any) => b.orderId === o.id);
      const myBidOnOrder = myBids.find((b: any) => b.orderId === o.id);
      return {
        id: o.id,
        mgtOrderNumber: o.mgtOrderNumber,
        serviceId: o.serviceId,
        platform: o.platform,
        gamertag: o.gamertag,
        orderDueDate: o.orderDueDate,
        isRush: o.isRush,
        isEmergency: o.isEmergency,
        complexity: o.complexity,
        location: o.location,
        status: o.status,
        discordMessageId: o.discordMessageId,
        createdAt: o.createdAt,
        totalBids: orderBids.length,
        hasBid: !!myBidOnOrder,
        myBidId: myBidOnOrder?.id || null,
        myBidStatus: myBidOnOrder?.status || null,
        myBidAmount: myBidOnOrder?.bidAmount || null,
      };
    });

    const lostBids = myBids.filter((b: any) => {
      const order = allOrders.find((o: any) => o.id === b.orderId);
      return order && order.status === "Assigned" && order.assignedGrinderId !== myGrinder.id && b.status !== "Accepted";
    });

    const completedAssignments = myAssignments.filter((a: any) => a.status === "Completed");
    const totalEarned = completedAssignments.reduce((sum: number, a: any) => sum + (Number(a.grinderEarnings) || Number(a.bidAmount) || 0), 0);
    const activeEarnings = myAssignments.filter((a: any) => a.status === "Active").reduce((sum: number, a: any) => sum + (Number(a.grinderEarnings) || Number(a.bidAmount) || 0), 0);

    const aiTips: string[] = [];
    const acceptedBids = myBids.filter((b: any) => b.status === "Accepted").length;
    const totalBidsCount = myBids.length;
    const winRate = totalBidsCount > 0 ? acceptedBids / totalBidsCount : 0;
    
    if (winRate < 0.3 && totalBidsCount >= 3) {
      aiTips.push("Your bid acceptance rate is below 30%. Try highlighting your experience and availability in proposals.");
    }
    if (myGrinder.completedOrders === 0) {
      aiTips.push("Complete your first order to build reputation. Consider bidding on simpler tasks to get started.");
    }
    if (Number(myGrinder.onTimeRate || 1) < 0.8 && myGrinder.completedOrders > 0) {
      aiTips.push("Focus on meeting deadlines. Your on-time rate could use improvement - consider requesting more time if needed.");
    }
    if (myGrinder.activeOrders >= myGrinder.capacity - 1 && myGrinder.capacity > 1) {
      aiTips.push("You're near capacity. Focus on completing current orders before taking new ones.");
    }
    if (lostBids.length > 2) {
      aiTips.push("You've lost several recent bids. Try offering faster delivery times or better quality guarantees.");
    }
    if (myGrinder.avgQualityRating && Number(myGrinder.avgQualityRating) < 3.5) {
      aiTips.push("Your quality score could be higher. Ask for feedback on completed orders and focus on thoroughness.");
    }
    if (completedAssignments.length >= 5 && winRate > 0.5) {
      aiTips.push("Great track record! You're eligible for Elite status - keep up the consistency.");
    }

    const isElite = myGrinder.discordRoleId === "1466370965016412316" || myGrinder.tier === "Elite" || myGrinder.category === "Elite Grinder";

    const safeGrinder = {
      id: myGrinder.id,
      name: myGrinder.name,
      discordUserId: myGrinder.discordUserId,
      discordUsername: myGrinder.discordUsername,
      discordRoleId: myGrinder.discordRoleId,
      category: myGrinder.category,
      tier: myGrinder.tier,
      capacity: myGrinder.capacity,
      activeOrders: myGrinder.activeOrders,
      completedOrders: myGrinder.completedOrders,
      totalOrders: myGrinder.totalOrders,
      totalReviews: myGrinder.totalReviews,
      winRate: myGrinder.winRate,
      lastAssigned: myGrinder.lastAssigned,
      avgQualityRating: myGrinder.avgQualityRating,
      onTimeRate: myGrinder.onTimeRate,
      completionRate: myGrinder.completionRate,
      strikes: myGrinder.strikes,
      avgTurnaroundDays: myGrinder.avgTurnaroundDays,
      notes: myGrinder.notes,
    };

    res.json({
      grinder: safeGrinder,
      isElite,
      assignments: myAssignments.map((a: any) => ({
        id: a.id,
        orderId: a.orderId,
        status: a.status,
        assignedDateTime: a.assignedDateTime,
        dueDateTime: a.dueDateTime,
        deliveredDateTime: a.deliveredDateTime,
        isOnTime: a.isOnTime,
        qualityRating: a.qualityRating,
        grinderEarnings: a.grinderEarnings,
        bidAmount: a.bidAmount,
        grinderId: a.grinderId,
      })),
      bids: myBids.map((b: any) => ({
        id: b.id,
        orderId: b.orderId,
        status: b.status,
        bidAmount: b.bidAmount,
        bidTime: b.bidTime,
        estDeliveryDate: b.estDeliveryDate,
        timeline: b.timeline,
        canStart: b.canStart,
        discordMessageId: b.discordMessageId,
      })),
      availableOrders,
      lostBids: lostBids.map((b: any) => ({
        id: b.id,
        orderId: b.orderId,
        bidAmount: b.bidAmount,
        status: b.status,
      })),
      orderUpdates: myOrderUpdates,
      payoutRequests: myPayoutRequests,
      stats: {
        totalAssignments: myAssignments.length,
        activeAssignments: myAssignments.filter((a: any) => a.status === "Active").length,
        completedAssignments: completedAssignments.length,
        totalBids: myBids.length,
        pendingBids: myBids.filter((b: any) => b.status === "Pending").length,
        acceptedBids,
        winRate: Math.round(winRate * 100),
        totalEarned: Math.round(totalEarned * 100) / 100,
        activeEarnings: Math.round(activeEarnings * 100) / 100,
        totalEarnings: Number(myGrinder.totalEarnings) || 0,
      },
      aiTips,
    });
  });

  app.post("/api/grinder/me/order-updates", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "Grinder profile not found" });

    const { assignmentId, orderId, updateType, message, newDeadline } = req.body;
    if (!assignmentId || !orderId || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const assignment = await storage.getAssignment(assignmentId);
    if (!assignment || assignment.grinderId !== myGrinder.id) {
      return res.status(403).json({ message: "Not your assignment" });
    }

    const update = await storage.createOrderUpdate({
      id: `OU-${Date.now().toString(36)}`,
      assignmentId,
      orderId,
      grinderId: myGrinder.id,
      updateType: updateType || "progress",
      message,
      newDeadline: newDeadline ? new Date(newDeadline) : null,
    });

    if (newDeadline) {
      await storage.updateAssignment(assignmentId, { dueDateTime: new Date(newDeadline) });
    }

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "order_update",
      entityId: update.id,
      action: "grinder_update",
      actor: myGrinder.name,
      details: JSON.stringify({ orderId, assignmentId, updateType, message }),
    });

    res.status(201).json(update);
  });

  app.post("/api/grinder/me/payout-requests", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "Grinder profile not found" });

    const { assignmentId, orderId, amount, notes } = req.body;
    if (!assignmentId || !orderId || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const assignment = await storage.getAssignment(assignmentId);
    if (!assignment || assignment.grinderId !== myGrinder.id) {
      return res.status(403).json({ message: "Not your assignment" });
    }

    const request = await storage.createPayoutRequest({
      id: `PR-${Date.now().toString(36)}`,
      assignmentId,
      orderId,
      grinderId: myGrinder.id,
      amount: String(amount),
      status: "Pending",
      notes: notes || null,
      reviewedBy: null,
    });

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "payout_request",
      entityId: request.id,
      action: "payout_requested",
      actor: myGrinder.name,
      details: JSON.stringify({ orderId, assignmentId, amount }),
    });

    res.status(201).json(request);
  });

  app.patch("/api/grinder/me/bids/:bidId", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "Grinder profile not found" });

    const allBids = await storage.getBids();
    const bid = allBids.find((b: any) => b.id === req.params.bidId);
    if (!bid || bid.grinderId !== myGrinder.id) {
      return res.status(403).json({ message: "Not your bid" });
    }
    if (bid.status !== "Pending") {
      return res.status(400).json({ message: "Can only edit pending bids" });
    }

    const { bidAmount, estDeliveryDate, timeline, canStart } = req.body;
    const updateData: any = {};
    if (bidAmount) updateData.bidAmount = String(bidAmount);
    if (estDeliveryDate) updateData.estDeliveryDate = new Date(estDeliveryDate);
    if (timeline) updateData.timeline = timeline;
    if (canStart) updateData.canStart = canStart;

    const updated = await storage.updateBid(bid.id, updateData);

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "bid",
      entityId: bid.id,
      action: "bid_edited_by_grinder",
      actor: myGrinder.name,
      details: JSON.stringify(updateData),
    });

    res.json(updated);
  });

  app.patch("/api/grinder/me/assignments/:assignmentId/complete", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "Grinder profile not found" });

    const assignment = await storage.getAssignment(req.params.assignmentId);
    if (!assignment || assignment.grinderId !== myGrinder.id) {
      return res.status(403).json({ message: "Not your assignment" });
    }

    const now = new Date();
    const isOnTime = assignment.dueDateTime ? now <= new Date(assignment.dueDateTime) : true;

    const updated = await storage.updateAssignment(assignment.id, {
      status: "Completed",
      deliveredDateTime: now,
      isOnTime,
    });

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "assignment",
      entityId: assignment.id,
      action: "marked_complete_by_grinder",
      actor: myGrinder.name,
      details: JSON.stringify({ orderId: assignment.orderId, isOnTime }),
    });

    res.json(updated);
  });

  app.get("/api/staff/order-updates", requireStaff, async (req, res) => {
    const updates = await storage.getOrderUpdates();
    res.json(updates);
  });

  app.get("/api/staff/payout-requests", requireStaff, async (req, res) => {
    const requests = await storage.getPayoutRequests();
    res.json(requests);
  });

  app.patch("/api/staff/payout-requests/:id", requireStaff, async (req, res) => {
    const { status, reviewedBy } = req.body;
    const updated = await storage.updatePayoutRequest(req.params.id, {
      status,
      reviewedBy: reviewedBy || "staff",
      reviewedAt: new Date(),
    });
    if (!updated) return res.status(404).json({ message: "Payout request not found" });

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "payout_request",
      entityId: req.params.id,
      action: `payout_${status.toLowerCase()}`,
      actor: reviewedBy || "staff",
      details: JSON.stringify({ status }),
    });

    res.json(updated);
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
