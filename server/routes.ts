import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupDiscordAuth, isAuthenticated, requireStaff, requireOwner, requireGrinderOrStaff } from "./discord/auth";
import { authStorage } from "./replit_integrations/auth/storage";

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

  app.delete("/api/grinders/:id", requireOwner, async (req, res) => {
    try {
      const grinder = await storage.getGrinder(req.params.id);
      if (!grinder) return res.status(404).json({ message: "Grinder not found" });
      const deleted = await storage.deleteGrinder(req.params.id);
      if (!deleted) return res.status(500).json({ message: "Failed to delete grinder" });
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "grinder",
        entityId: req.params.id,
        action: "grinder_removed",
        actor: (req as any).userId || "owner",
        details: JSON.stringify({ name: grinder.name, discordUsername: grinder.discordUsername }),
      });
      res.json({ success: true });
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

  app.post(api.orders.staffAssign.path, requireStaff, async (req, res) => {
    try {
      const input = api.orders.staffAssign.input.parse(req.body);
      const orderId = req.params.id;

      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (order.status !== "Open" && order.status !== "Bidding Closed") {
        return res.status(400).json({ message: `Cannot assign order with status "${order.status}". Order must be Open or Bidding Closed.` });
      }
      if (order.assignedGrinderId) {
        return res.status(400).json({ message: "Order already has a grinder assigned" });
      }

      const grinder = await storage.getGrinder(input.grinderId);
      if (!grinder) return res.status(404).json({ message: "Grinder not found" });
      if (grinder.suspended) {
        const fine = parseFloat(grinder.outstandingFine?.toString() || "0");
        return res.status(403).json({ message: `Grinder is suspended with $${fine.toFixed(2)} outstanding fine. Clear fines before assigning.` });
      }

      const bidAmount = parseFloat(input.bidAmount);
      if (isNaN(bidAmount) || bidAmount < 0) return res.status(400).json({ message: "Invalid bid/pay amount" });

      const customerPrice = Number(order.customerPrice || 0);
      const margin = customerPrice - bidAmount;
      const marginPct = customerPrice > 0 ? (margin / customerPrice) * 100 : 0;
      const companyProfit = margin;
      const now = new Date();

      const { db } = await import("./db");
      const { orders: ordersTable } = await import("@shared/schema");
      const { eq, sql, and } = await import("drizzle-orm");

      const [lockedOrder] = await db.update(ordersTable).set({
        status: "Assigned",
        assignedGrinderId: input.grinderId,
        companyProfit: companyProfit.toFixed(2),
      }).where(
        and(
          eq(ordersTable.id, orderId),
          sql`${ordersTable.status} IN ('Open', 'Bidding Closed')`,
          sql`${ordersTable.assignedGrinderId} IS NULL`
        )
      ).returning();

      if (!lockedOrder) {
        return res.status(409).json({ message: "Order was already assigned by another action. Please refresh and try again." });
      }

      const assignmentId = `ASN-${Date.now().toString(36)}`;
      const assignment = await storage.createAssignment({
        id: assignmentId,
        grinderId: input.grinderId,
        orderId: orderId,
        assignedDateTime: now,
        status: "Active",
        bidAmount: input.bidAmount,
        orderPrice: order.customerPrice,
        margin: margin.toFixed(2),
        marginPct: marginPct.toFixed(2),
        companyProfit: companyProfit.toFixed(2),
        grinderEarnings: input.bidAmount,
        dueDateTime: order.orderDueDate,
        notes: input.notes || "Staff override assignment",
      });

      if (order.firstBidAt && order.biddingClosesAt && new Date(order.biddingClosesAt) > now) {
        const existingStages = (order.biddingNotifiedStages as string[]) || [];
        const updatedStages = existingStages.includes("closed") ? existingStages : [...existingStages, "closed"];
        await storage.updateOrder(orderId, {
          biddingClosesAt: now,
          biddingNotifiedStages: updatedStages,
        } as any);
      }

      const allBids = await storage.getBids();
      const orderBids = allBids.filter(b => b.orderId === orderId);
      let acceptedBidId: string | null = null;
      const orderLabel = order.mgtOrderNumber ? `#${order.mgtOrderNumber}` : orderId;
      for (const bid of orderBids) {
        if (bid.grinderId === input.grinderId && bid.status === "Pending") {
          await storage.updateBidStatus(bid.id, "Accepted", "staff_override");
          acceptedBidId = bid.id;
        } else if (bid.status === "Pending") {
          await storage.updateBidStatus(bid.id, "Order Assigned");
          await storage.createStaffAlert({
            id: `SA-${Date.now().toString(36)}-${bid.grinderId}`,
            targetType: "grinder",
            grinderId: bid.grinderId,
            title: `Order ${orderLabel} Assigned`,
            message: `Order ${orderLabel} has been assigned to another grinder. Your bid of $${bid.bidAmount} was not selected.`,
            severity: "warning",
            createdBy: "system",
          });
        }
      }
      if (acceptedBidId) {
        await storage.updateOrder(orderId, { acceptedBidId });
      }

      await storage.updateGrinder(input.grinderId, {
        activeOrders: (grinder.activeOrders || 0) + 1,
        totalOrders: (grinder.totalOrders || 0) + 1,
        lastAssigned: now,
      });

      const user = (req as any).user;
      const actorName = user?.discordUsername || user?.firstName || "staff";
      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "assignment",
        entityId: assignmentId,
        action: "staff_override_assign",
        actor: actorName,
        details: JSON.stringify({
          orderId,
          grinderId: input.grinderId,
          grinderName: grinder.name,
          bidAmount: input.bidAmount,
          customerPrice: order.customerPrice,
          margin: margin.toFixed(2),
          notes: input.notes,
        }),
      });

      res.status(201).json(assignment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      console.error("[staff-assign] Error:", err);
      res.status(500).json({ message: "Failed to assign grinder" });
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

  app.get("/api/bidding-timers", async (req, res) => {
    const allOrders = await storage.getOrders();
    const activeTimers = allOrders
      .filter(o => o.status === "Open" && o.biddingClosesAt)
      .map(o => ({
        orderId: o.id,
        mgtOrderNumber: o.mgtOrderNumber,
        status: o.status,
        firstBidAt: o.firstBidAt,
        biddingClosesAt: o.biddingClosesAt,
        createdAt: o.createdAt,
      }));
    const recentlyClosed = allOrders
      .filter(o => o.status === "Bidding Closed" && o.biddingClosesAt)
      .filter(o => {
        const closedTime = new Date(o.biddingClosesAt!).getTime();
        return Date.now() - closedTime < 5 * 60 * 1000;
      })
      .map(o => ({
        orderId: o.id,
        mgtOrderNumber: o.mgtOrderNumber,
        status: o.status,
        firstBidAt: o.firstBidAt,
        biddingClosesAt: o.biddingClosesAt,
        createdAt: o.createdAt,
      }));
    res.json({ activeTimers, recentlyClosed, serverTime: new Date().toISOString() });
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

  app.patch("/api/bids/:id/status", requireStaff, async (req, res) => {
    try {
      const { status, acceptedBy } = req.body;
      if (!status || !["Accepted", "Denied", "Pending"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const bid = await storage.getBid(req.params.id);
      if (!bid) return res.status(404).json({ message: "Bid not found" });

      const userId = (req as any).userId;
      const dbUser = await authStorage.getUser(userId);
      const actorName = acceptedBy || dbUser?.firstName || dbUser?.discordUsername || "Staff";

      await storage.updateBidStatus(bid.id, status, actorName);

      if (status === "Accepted") {
        const order = await storage.getOrder(bid.orderId);
        if (order) {
          await storage.updateOrder(bid.orderId, { acceptedBidId: bid.id, status: "Assigned", assignedGrinderId: bid.grinderId });
          const orderLabel = order.mgtOrderNumber ? `#${order.mgtOrderNumber}` : bid.orderId;
          const allBids = await storage.getBids();
          const otherPending = allBids.filter(b => b.orderId === bid.orderId && b.id !== bid.id && b.status === "Pending");
          for (const ob of otherPending) {
            await storage.updateBidStatus(ob.id, "Order Assigned");
            await storage.createStaffAlert({
              id: `SA-${Date.now().toString(36)}-${ob.grinderId}`,
              targetType: "grinder",
              grinderId: ob.grinderId,
              title: `Order ${orderLabel} Assigned`,
              message: `Order ${orderLabel} has been assigned to another grinder. Your bid of $${ob.bidAmount} was not selected.`,
              severity: "warning",
              createdBy: "system",
            });
          }
        }
      }

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "bid",
        entityId: bid.id,
        action: `bid_${status.toLowerCase()}_by_staff`,
        actor: actorName,
        details: JSON.stringify({ orderId: bid.orderId, grinderId: bid.grinderId, bidAmount: bid.bidAmount }),
      });

      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ message: String(err) });
    }
  });

  app.patch("/api/bids/:id/override", requireOwner, async (req, res) => {
    try {
      const { status, acceptedBy } = req.body;
      if (!status || !["Accepted", "Denied", "Pending"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const bid = await storage.getBid(req.params.id);
      if (!bid) return res.status(404).json({ message: "Bid not found" });

      const userId = (req as any).userId;
      const dbUser = await authStorage.getUser(userId);
      const actorName = acceptedBy || dbUser?.firstName || dbUser?.discordUsername || "Owner";
      const previousStatus = bid.status;
      const previousAcceptedBy = bid.acceptedBy;

      await storage.updateBidStatus(bid.id, status, `${actorName} (override)`);

      if (status === "Accepted") {
        const order = await storage.getOrder(bid.orderId);
        if (order) {
          const prevAccepted = order.acceptedBidId;
          if (prevAccepted && prevAccepted !== bid.id) {
            await storage.updateBidStatus(prevAccepted, "Order Assigned", `${actorName} (override)`);
          }
          await storage.updateOrder(bid.orderId, { acceptedBidId: bid.id, status: "Assigned", assignedGrinderId: bid.grinderId });
          const orderLabel = order.mgtOrderNumber ? `#${order.mgtOrderNumber}` : bid.orderId;
          const allBids = await storage.getBids();
          const otherPending = allBids.filter(b => b.orderId === bid.orderId && b.id !== bid.id && b.status === "Pending");
          for (const ob of otherPending) {
            await storage.updateBidStatus(ob.id, "Order Assigned");
            await storage.createStaffAlert({
              id: `SA-${Date.now().toString(36)}-${ob.grinderId}`,
              targetType: "grinder",
              grinderId: ob.grinderId,
              title: `Order ${orderLabel} Assigned`,
              message: `Order ${orderLabel} has been assigned to another grinder. Your bid of $${ob.bidAmount} was not selected.`,
              severity: "warning",
              createdBy: "system",
            });
          }
        }
      } else if (status === "Denied" || status === "Pending") {
        const order = await storage.getOrder(bid.orderId);
        if (order && order.acceptedBidId === bid.id) {
          await storage.updateOrder(bid.orderId, { acceptedBidId: null, status: "Open", assignedGrinderId: null });
        }
      }

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "bid",
        entityId: bid.id,
        action: "owner_override_bid",
        actor: actorName,
        details: JSON.stringify({
          orderId: bid.orderId,
          grinderId: bid.grinderId,
          previousStatus,
          previousAcceptedBy,
          newStatus: status,
        }),
      });

      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ message: String(err) });
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
    let myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.json(null);

    const authUser = await authStorage.getUser(userId);
    if (authUser && myGrinder.name === "Unknown") {
      const displayName = authUser.firstName || authUser.discordUsername || "Unknown";
      if (displayName !== "Unknown") {
        await storage.updateGrinder(myGrinder.id, { name: displayName, discordUsername: authUser.discordUsername || myGrinder.discordUsername });
        myGrinder = { ...myGrinder, name: displayName, discordUsername: authUser.discordUsername || myGrinder.discordUsername };
      }
    }

    const allAssignments = await storage.getAssignments();
    const myAssignments = allAssignments.filter((a: any) => a.grinderId === myGrinder.id);

    const allBids = await storage.getBids();
    const myBids = allBids.filter((b: any) => b.grinderId === myGrinder.id);

    const allOrders = await storage.getOrders();
    const myOrderUpdates = await storage.getOrderUpdates(myGrinder.id);
    const myPayoutRequests = await storage.getPayoutRequests(myGrinder.id);
    const myPayoutMethods = await storage.getGrinderPayoutMethods(myGrinder.id);
    const myStrikeLogs = await storage.getStrikeLogs(myGrinder.id);
    const myAlerts = await storage.getStaffAlerts(myGrinder.id);
    const myEliteRequests = await storage.getEliteRequests(myGrinder.id);

    const isElite = myGrinder.discordRoleId === "1466370965016412316" || myGrinder.tier === "Elite" || myGrinder.category === "Elite Grinder";
    const ELITE_PRIORITY_MINUTES = 5;
    const now = new Date();

    const openOrders = allOrders.filter((o: any) => {
      if (o.status !== "Open" || o.visibleToGrinders === false) return false;
      if (isElite) return true;
      const orderAge = (now.getTime() - new Date(o.createdAt).getTime()) / (1000 * 60);
      return orderAge >= ELITE_PRIORITY_MINUTES;
    });

    const availableOrders = openOrders.map((o: any) => {
      const orderBids = allBids.filter((b: any) => b.orderId === o.id);
      const myBidOnOrder = myBids.find((b: any) => b.orderId === o.id);
      const orderAge = (now.getTime() - new Date(o.createdAt).getTime()) / (1000 * 60);
      const isElitePriority = orderAge < ELITE_PRIORITY_MINUTES;
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
        isManual: o.isManual,
        discordMessageId: o.discordMessageId,
        createdAt: o.createdAt,
        firstBidAt: o.firstBidAt,
        biddingClosesAt: o.biddingClosesAt,
        totalBids: orderBids.length,
        hasBid: !!myBidOnOrder,
        myBidId: myBidOnOrder?.id || null,
        myBidStatus: myBidOnOrder?.status || null,
        myBidAmount: myBidOnOrder?.bidAmount || null,
        elitePriority: isElitePriority,
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
    if (Number(myGrinder.onTimeRate || 100) < 80 && myGrinder.completedOrders > 0) {
      aiTips.push("Focus on meeting deadlines. Your on-time rate could use improvement - consider requesting more time if needed.");
    }
    if (myGrinder.activeOrders >= myGrinder.capacity - 1 && myGrinder.capacity > 1) {
      aiTips.push("You're near capacity. Focus on completing current orders before taking new ones.");
    }
    if (lostBids.length > 2) {
      aiTips.push("You've lost several recent bids. Try offering faster delivery times or better quality guarantees.");
    }
    if (myGrinder.avgQualityRating && Number(myGrinder.avgQualityRating) < 70) {
      aiTips.push("Your quality score could be higher. Ask for feedback on completed orders and focus on thoroughness.");
    }
    if (completedAssignments.length >= 5 && winRate > 0.5) {
      aiTips.push("Great track record! You're eligible for Elite status - keep up the consistency.");
    }

    const eliteGrinders = allGrinders.filter((g: any) => g.discordRoleId === "1466370965016412316" || g.tier === "Elite" || g.category === "Elite Grinder");
    let eliteCoaching: any = null;
    if (!isElite && eliteGrinders.length > 0) {
      const eliteAvgWinRate = eliteGrinders.reduce((s: number, g: any) => s + (Number(g.winRate) || 0), 0) / eliteGrinders.length;
      const eliteAvgQuality = eliteGrinders.reduce((s: number, g: any) => s + (Number(g.avgQualityRating) || 0), 0) / eliteGrinders.length;
      const eliteAvgOnTime = eliteGrinders.reduce((s: number, g: any) => s + (Number(g.onTimeRate) || 0), 0) / eliteGrinders.length;
      const eliteAvgCompletion = eliteGrinders.reduce((s: number, g: any) => s + (Number(g.completionRate) || 0), 0) / eliteGrinders.length;
      const eliteAvgTurnaround = eliteGrinders.reduce((s: number, g: any) => s + (Number(g.avgTurnaroundDays) || 0), 0) / eliteGrinders.length;
      const eliteAvgCompleted = eliteGrinders.reduce((s: number, g: any) => s + (g.completedOrders || 0), 0) / eliteGrinders.length;

      const myWinRate = Number(myGrinder.winRate) || 0;
      const myQuality = Number(myGrinder.avgQualityRating) || 0;
      const myOnTime = Number(myGrinder.onTimeRate) || 0;
      const myCompletion = Number(myGrinder.completionRate) || 0;
      const myTurnaround = Number(myGrinder.avgTurnaroundDays) || 0;

      const tips: string[] = [];
      if (myWinRate < eliteAvgWinRate * 0.8) {
        tips.push(`Boost your win rate to ${eliteAvgWinRate.toFixed(0)}%+ (elite average). Focus on quality proposals and quick response times.`);
      }
      if (myQuality < eliteAvgQuality * 0.8 && eliteAvgQuality > 0) {
        tips.push(`Raise your quality rating to ${(eliteAvgQuality / 20).toFixed(1)}/5+ (elite avg). Pay extra attention to detail and communication.`);
      }
      if (myOnTime < eliteAvgOnTime * 0.8 && eliteAvgOnTime > 0) {
        tips.push(`Improve your on-time delivery to ${eliteAvgOnTime.toFixed(0)}%+ (elite avg). Set realistic deadlines and communicate delays early.`);
      }
      if (myCompletion < eliteAvgCompletion * 0.8 && eliteAvgCompletion > 0) {
        tips.push(`Increase completion rate to ${eliteAvgCompletion.toFixed(0)}%+ (elite avg). Avoid cancelling orders once accepted.`);
      }
      if (myTurnaround > eliteAvgTurnaround * 1.3 && eliteAvgTurnaround > 0) {
        tips.push(`Reduce turnaround time to ${eliteAvgTurnaround.toFixed(1)} days or less (elite avg). Faster delivery builds trust.`);
      }
      if (myGrinder.completedOrders < Math.round(eliteAvgCompleted * 0.5)) {
        tips.push(`Complete more orders (elite avg: ${Math.round(eliteAvgCompleted)} completed). Volume + consistency unlocks elite consideration.`);
      }
      if (myGrinder.strikes > 0) {
        tips.push("Clear your strikes first. Elite grinders maintain a clean record with zero strikes.");
      }
      if (tips.length === 0) {
        tips.push("You're performing at elite levels! Consider requesting Elite status from the dashboard.");
      }

      eliteCoaching = {
        yourMetrics: { winRate: myWinRate, quality: myQuality, onTime: myOnTime, completion: myCompletion, turnaround: myTurnaround, completed: myGrinder.completedOrders, strikes: myGrinder.strikes },
        eliteAverages: { winRate: eliteAvgWinRate, quality: eliteAvgQuality, onTime: eliteAvgOnTime, completion: eliteAvgCompletion, turnaround: eliteAvgTurnaround, completed: Math.round(eliteAvgCompleted) },
        tips,
        readiness: tips.length <= 1 && myGrinder.strikes === 0 ? "ready" : tips.length <= 3 ? "close" : "developing",
      };
    }

    const unreadAlerts = myAlerts.filter((a: any) => {
      const readByArr = Array.isArray(a.readBy) ? a.readBy : [];
      return !readByArr.includes(myGrinder.id);
    });
    const unackedStrikes = myStrikeLogs.filter((s: any) => !s.acknowledgedAt);

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
      rulesAccepted: myGrinder.rulesAccepted,
      rulesAcceptedAt: myGrinder.rulesAcceptedAt,
      strikes: myGrinder.strikes,
      suspended: myGrinder.suspended,
      outstandingFine: myGrinder.outstandingFine,
      avgTurnaroundDays: myGrinder.avgTurnaroundDays,
      availabilityStatus: myGrinder.availabilityStatus,
      availabilityNote: myGrinder.availabilityNote,
      availabilityUpdatedAt: myGrinder.availabilityUpdatedAt,
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
      payoutMethods: myPayoutMethods,
      strikeLogs: myStrikeLogs,
      alerts: myAlerts.map((a: any) => ({
        ...a,
        isRead: Array.isArray(a.readBy) ? a.readBy.includes(myGrinder.id) : false,
      })),
      eliteRequests: myEliteRequests,
      eliteCoaching,
      unreadAlertCount: unreadAlerts.length,
      unackedStrikeCount: unackedStrikes.length,
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

    const { assignmentId, orderId, amount, notes, payoutPlatform, payoutDetails, savePayoutMethod } = req.body;
    if (!assignmentId || !orderId || !amount || !payoutPlatform || !payoutDetails) {
      return res.status(400).json({ message: "Missing required fields (amount, platform, and payout details are required)" });
    }

    const assignment = await storage.getAssignment(assignmentId);
    if (!assignment || assignment.grinderId !== myGrinder.id) {
      return res.status(403).json({ message: "Not your assignment" });
    }

    if (savePayoutMethod) {
      const existingMethods = await storage.getGrinderPayoutMethods(myGrinder.id);
      const existing = existingMethods.find((m: any) => m.platform === payoutPlatform);
      if (existing) {
        await storage.updateGrinderPayoutMethod(existing.id, { details: payoutDetails });
      } else {
        await storage.createGrinderPayoutMethod({
          id: `PM-${Date.now().toString(36)}`,
          grinderId: myGrinder.id,
          platform: payoutPlatform,
          details: payoutDetails,
          isDefault: existingMethods.length === 0,
        });
      }
    }

    const request = await storage.createPayoutRequest({
      id: `PR-${Date.now().toString(36)}`,
      assignmentId,
      orderId,
      grinderId: myGrinder.id,
      amount: String(amount),
      payoutPlatform,
      payoutDetails,
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
      details: JSON.stringify({ orderId, assignmentId, amount, payoutPlatform }),
    });

    res.status(201).json(request);
  });

  app.get("/api/grinder/me/payout-methods", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "Grinder profile not found" });
    const methods = await storage.getGrinderPayoutMethods(myGrinder.id);
    res.json(methods);
  });

  app.delete("/api/grinder/me/payout-methods/:id", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "Grinder profile not found" });
    const methods = await storage.getGrinderPayoutMethods(myGrinder.id);
    const method = methods.find((m: any) => m.id === req.params.id);
    if (!method) return res.status(404).json({ message: "Payout method not found" });
    await storage.deleteGrinderPayoutMethod(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/grinder/me/accept-rules", async (req, res) => {
    try {
      const userId = (req as any).userId;
      const allGrinders = await storage.getGrinders();
      const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
      if (!myGrinder) return res.status(404).json({ message: "Grinder profile not found" });

      if (myGrinder.rulesAccepted) {
        return res.json({ message: "Rules already accepted", rulesAccepted: true });
      }

      await storage.updateGrinder(myGrinder.id, {
        rulesAccepted: true,
        rulesAcceptedAt: new Date(),
      });

      res.json({ message: "Rules accepted successfully", rulesAccepted: true });
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.post("/api/grinder/me/bids", async (req, res) => {
    try {
      const userId = (req as any).userId;
      const allGrinders = await storage.getGrinders();
      const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
      if (!myGrinder) return res.status(404).json({ message: "Grinder profile not found" });

      const { orderId, bidAmount, timeline, canStart } = req.body;
      if (!orderId || !bidAmount) return res.status(400).json({ message: "orderId and bidAmount are required" });

      if (!myGrinder.rulesAccepted) {
        return res.status(403).json({ message: "You must accept the Grinder Rules before placing bids. Use /grinder rules from the MGT Bot in any Discord text channel to accept." });
      }

      if (myGrinder.suspended) {
        const fine = parseFloat(myGrinder.outstandingFine?.toString() || "0");
        return res.status(403).json({ message: `You are suspended. Pay your outstanding fine of $${fine.toFixed(2)} before placing bids.` });
      }

      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (order.status !== "Open") return res.status(400).json({ message: "Order is not open for bidding" });
      if (!order.visibleToGrinders) return res.status(403).json({ message: "This order is not open for grinder bids" });

      const bidderIsElite = myGrinder.discordRoleId === "1466370965016412316" || myGrinder.tier === "Elite" || myGrinder.category === "Elite Grinder";
      if (!bidderIsElite && order.createdAt) {
        const orderAgeMin = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60);
        if (orderAgeMin < 5) {
          return res.status(403).json({ message: "This order is in the Elite priority window. Regular grinders can bid after 5 minutes." });
        }
      }

      const allBids = await storage.getBids();
      const existingBid = allBids.find((b: any) => b.orderId === orderId && b.grinderId === myGrinder.id);
      if (existingBid) return res.status(400).json({ message: "You already have a bid on this order" });

      if (myGrinder.activeOrders >= myGrinder.capacity) {
        return res.status(400).json({ message: "You are at your order limit" });
      }

      const bidId = `BID-${Date.now().toString(36)}`;
      const now = new Date();
      const estDelivery = timeline
        ? new Date(now.getTime() + parseInt(timeline) * 3600000)
        : new Date(now.getTime() + 48 * 3600000);

      const newBid = await storage.createBid({
        id: bidId,
        orderId,
        grinderId: myGrinder.id,
        bidAmount: String(bidAmount),
        bidTime: now,
        estDeliveryDate: estDelivery,
        timeline: timeline || null,
        canStart: canStart || null,
        status: "Pending",
      });

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "bid",
        entityId: bidId,
        action: "bid_placed_via_dashboard",
        actor: myGrinder.name,
        details: JSON.stringify({ orderId, bidAmount, isManualOrder: order.isManual }),
      });

      res.status(201).json(newBid);
    } catch (err) {
      res.status(400).json({ message: String(err) });
    }
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

    const newCompleted = (myGrinder.completedOrders || 0) + 1;
    const newActive = Math.max(0, (myGrinder.activeOrders || 0) - 1);
    const grinderEarnings = Number(assignment.grinderEarnings) || Number(assignment.bidAmount) || 0;
    const newEarnings = (Number(myGrinder.totalEarnings || 0) + grinderEarnings).toFixed(2);
    await storage.updateGrinder(myGrinder.id, {
      completedOrders: newCompleted,
      activeOrders: newActive,
      totalEarnings: newEarnings,
    });

    if (assignment.orderId) {
      await storage.updateOrderStatus(assignment.orderId, "Completed");
    }

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
    const updateData: any = {
      status,
      reviewedBy: reviewedBy || "staff",
      reviewedAt: new Date(),
    };
    if (status === "Paid") {
      updateData.paidAt = new Date();
    }
    const updated = await storage.updatePayoutRequest(req.params.id, updateData);
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

  app.get("/api/staff/grinder-payout-methods/:grinderId", requireStaff, async (req, res) => {
    const methods = await storage.getGrinderPayoutMethods(req.params.grinderId);
    res.json(methods);
  });

  app.post("/api/grinder/me/elite-request", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "No grinder profile found" });

    const existing = await storage.getEliteRequests(myGrinder.id);
    const pending = existing.find((e: any) => e.status === "Pending");
    if (pending) return res.status(400).json({ message: "You already have a pending elite request" });

    const request = await storage.createEliteRequest({
      id: `ER-${Date.now().toString(36)}`,
      grinderId: myGrinder.id,
      status: "Pending",
    });

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "elite_request",
      entityId: request.id,
      action: "created",
      actor: myGrinder.name,
    });

    res.status(201).json(request);
  });

  app.post("/api/grinder/me/alerts/:alertId/read", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "No grinder profile found" });

    await storage.markAlertRead(req.params.alertId as string, myGrinder.id);
    res.json({ success: true });
  });

  app.post("/api/grinder/me/strikes/:strikeId/ack", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "No grinder profile found" });

    await storage.acknowledgeStrike(req.params.strikeId as string);
    res.json({ success: true });
  });

  app.patch("/api/grinder/me/availability", async (req, res) => {
    const userId = (req as any).userId;
    const allGrinders = await storage.getGrinders();
    const myGrinder = allGrinders.find((g: any) => g.discordUserId === userId);
    if (!myGrinder) return res.status(404).json({ message: "No grinder profile found" });

    const { status, note } = req.body;
    const validStatuses = ["available", "busy", "away", "offline"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be: " + validStatuses.join(", ") });
    }

    const updated = await storage.updateGrinder(myGrinder.id, {
      availabilityStatus: status,
      availabilityNote: note || null,
      availabilityUpdatedAt: new Date(),
    });
    res.json(updated);
  });

  app.get("/api/staff/elite-requests", requireStaff, async (req, res) => {
    const requests = await storage.getEliteRequests();
    const allGrinders = await storage.getGrinders();
    const enriched = requests.map((r: any) => {
      const grinder = allGrinders.find((g: any) => g.id === r.grinderId);
      return { ...r, grinderName: grinder?.name || r.grinderId, grinderTier: grinder?.tier, grinderCategory: grinder?.category, completedOrders: grinder?.completedOrders || 0, winRate: grinder?.winRate, avgQualityRating: grinder?.avgQualityRating, onTimeRate: grinder?.onTimeRate, strikes: grinder?.strikes || 0 };
    });
    res.json(enriched);
  });

  app.patch("/api/staff/elite-requests/:id", requireStaff, async (req, res) => {
    const { status, reviewedBy, decisionNotes } = req.body;
    const updated = await storage.updateEliteRequest(req.params.id as string, {
      status,
      reviewedBy: reviewedBy || "staff",
      reviewedAt: new Date(),
      decisionNotes,
    });
    if (!updated) return res.status(404).json({ message: "Elite request not found" });

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "elite_request",
      entityId: req.params.id as string,
      action: `elite_${status.toLowerCase()}`,
      actor: reviewedBy || "staff",
      details: decisionNotes,
    });

    res.json(updated);
  });

  app.get("/api/staff/alerts", requireStaff, async (req, res) => {
    const alerts = await storage.getStaffAlerts();
    res.json(alerts);
  });

  app.post("/api/staff/alerts", requireStaff, async (req, res) => {
    const { targetType, grinderId, title, message, severity, createdBy } = req.body;
    const alert = await storage.createStaffAlert({
      id: `SA-${Date.now().toString(36)}`,
      targetType: targetType || "all",
      grinderId: grinderId || null,
      title,
      message,
      severity: severity || "info",
      createdBy: createdBy || "staff",
      readBy: [],
    });

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "staff_alert",
      entityId: alert.id,
      action: "alert_sent",
      actor: createdBy || "staff",
      details: `Target: ${targetType || "all"}, Title: ${title}`,
    });

    res.status(201).json(alert);
  });

  app.delete("/api/staff/alerts/:id", requireStaff, async (req, res) => {
    const deleted = await storage.deleteStaffAlert(req.params.id as string);
    if (!deleted) return res.status(404).json({ message: "Alert not found" });
    res.json({ success: true });
  });

  const STRIKE_FINES: Record<number, number> = { 1: 25, 2: 50, 3: 100 };

  app.post("/api/staff/strikes", requireStaff, async (req, res) => {
    const { grinderId, action, reason, createdBy } = req.body;
    if (!grinderId || !action || !reason) {
      return res.status(400).json({ message: "grinderId, action, and reason are required" });
    }

    const grinder = await storage.getGrinder(grinderId);
    if (!grinder) return res.status(404).json({ message: "Grinder not found" });

    const delta = action === "add" ? 1 : -1;
    const newStrikes = Math.max(0, grinder.strikes + delta);

    const fineAmount = action === "add" ? (STRIKE_FINES[newStrikes] || 100) : 0;
    const currentFine = parseFloat(grinder.outstandingFine?.toString() || "0");
    const newOutstandingFine = action === "add"
      ? (currentFine + fineAmount).toString()
      : currentFine.toString();
    const shouldSuspend = action === "add" && newStrikes >= 1;

    await storage.updateGrinder(grinderId, {
      strikes: newStrikes,
      suspended: shouldSuspend,
      outstandingFine: newOutstandingFine,
    });

    const strikeLog = await storage.createStrikeLog({
      id: `SL-${Date.now().toString(36)}`,
      grinderId,
      action,
      reason,
      delta,
      resultingStrikes: newStrikes,
      fineAmount: fineAmount.toString(),
      createdBy: createdBy || "staff",
    });

    const fineMsg = action === "add"
      ? ` A fine of $${fineAmount} has been applied. Your total outstanding fine is $${newOutstandingFine}. You are suspended from taking orders until all fines are paid.`
      : "";

    await storage.createStaffAlert({
      id: `SA-${Date.now().toString(36)}s`,
      targetType: "grinder",
      grinderId,
      title: action === "add" ? `Strike ${newStrikes} - $${fineAmount} Fine` : "Strike Removed",
      message: `${action === "add" ? "A strike has been added to" : "A strike has been removed from"} your profile. Reason: ${reason}. You now have ${newStrikes} strike${newStrikes !== 1 ? "s" : ""}.${fineMsg}`,
      severity: action === "add" ? "danger" : "success",
      createdBy: createdBy || "staff",
      readBy: [],
    });

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "grinder",
      entityId: grinderId,
      action: `strike_${action}`,
      actor: createdBy || "staff",
      details: JSON.stringify({ reason, delta, resultingStrikes: newStrikes, fineAmount, outstandingFine: newOutstandingFine, suspended: shouldSuspend }),
    });

    res.status(201).json({ strikeLog, newStrikes, fineAmount, outstandingFine: newOutstandingFine, suspended: shouldSuspend });
  });

  app.get("/api/staff/strike-logs", requireStaff, async (req, res) => {
    const logs = await storage.getStrikeLogs();
    res.json(logs);
  });

  app.post("/api/staff/fines/:grinderId/pay", requireStaff, async (req, res) => {
    try {
      const grinder = await storage.getGrinder(req.params.grinderId);
      if (!grinder) return res.status(404).json({ message: "Grinder not found" });

      const currentFine = parseFloat(grinder.outstandingFine?.toString() || "0");
      if (currentFine <= 0) return res.status(400).json({ message: "No outstanding fines" });

      await storage.updateGrinder(req.params.grinderId, {
        outstandingFine: "0",
        suspended: false,
      });

      const logs = await storage.getStrikeLogs();
      const unpaidLogs = logs.filter((l: any) => l.grinderId === req.params.grinderId && !l.finePaid && parseFloat(l.fineAmount?.toString() || "0") > 0);
      for (const log of unpaidLogs) {
        await storage.updateStrikeLog(log.id, { finePaid: true, finePaidAt: new Date() });
      }

      await storage.createStaffAlert({
        id: `SA-${Date.now().toString(36)}fp`,
        targetType: "grinder",
        grinderId: req.params.grinderId,
        title: "Fines Cleared - Suspension Lifted",
        message: `Your outstanding fine of $${currentFine.toFixed(2)} has been marked as paid. Your suspension has been lifted and you can now take orders again.`,
        severity: "success",
        createdBy: (req as any).userId || "staff",
        readBy: [],
      });

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}`,
        entityType: "grinder",
        entityId: req.params.grinderId,
        action: "fine_paid",
        actor: (req as any).userId || "staff",
        details: JSON.stringify({ amountPaid: currentFine }),
      });

      res.json({ success: true, amountPaid: currentFine });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/staff/elite-vs-grinder-metrics", requireStaff, async (req, res) => {
    const allGrinders = await storage.getGrinders();
    const eliteGrinders = allGrinders.filter((g: any) => g.discordRoleId === "1466370965016412316" || g.tier === "Elite" || g.category === "Elite Grinder");
    const regularGrinders = allGrinders.filter((g: any) => !(g.discordRoleId === "1466370965016412316" || g.tier === "Elite" || g.category === "Elite Grinder"));

    const computeAvg = (arr: any[], field: string) => {
      const vals = arr.map(g => Number(g[field]) || 0);
      return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    };

    res.json({
      elite: {
        count: eliteGrinders.length,
        avgWinRate: computeAvg(eliteGrinders, "winRate"),
        avgQuality: computeAvg(eliteGrinders, "avgQualityRating"),
        avgOnTime: computeAvg(eliteGrinders, "onTimeRate"),
        avgCompletion: computeAvg(eliteGrinders, "completionRate"),
        avgTurnaround: computeAvg(eliteGrinders, "avgTurnaroundDays"),
        avgCompletedOrders: computeAvg(eliteGrinders, "completedOrders"),
        avgStrikes: computeAvg(eliteGrinders, "strikes"),
        totalEarnings: eliteGrinders.reduce((s: number, g: any) => s + (Number(g.totalEarnings) || 0), 0),
      },
      grinders: {
        count: regularGrinders.length,
        avgWinRate: computeAvg(regularGrinders, "winRate"),
        avgQuality: computeAvg(regularGrinders, "avgQualityRating"),
        avgOnTime: computeAvg(regularGrinders, "onTimeRate"),
        avgCompletion: computeAvg(regularGrinders, "completionRate"),
        avgTurnaround: computeAvg(regularGrinders, "avgTurnaroundDays"),
        avgCompletedOrders: computeAvg(regularGrinders, "completedOrders"),
        avgStrikes: computeAvg(regularGrinders, "strikes"),
        totalEarnings: regularGrinders.reduce((s: number, g: any) => s + (Number(g.totalEarnings) || 0), 0),
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
      { id: 'S1', name: 'VC Grinding 🪙', group: 'VC', defaultComplexity: 1, slaDays: 5 },
      { id: 'S2', name: 'Badge Grinding 🎖️', group: 'Badges', defaultComplexity: 2, slaDays: 5 },
      { id: 'S3', name: 'Rep Grinding ⚡', group: 'Rep', defaultComplexity: 5, slaDays: 7 },
      { id: 'S4', name: 'Hot Zones 🔥', group: 'Hot Zones', defaultComplexity: 3, slaDays: 5 },
      { id: 'S5', name: 'Build Specializations 🛠️', group: 'Build', defaultComplexity: 3, slaDays: 5 },
      { id: 'S6', name: 'Lifetime Challenges 🏆', group: 'Challenges', defaultComplexity: 4, slaDays: 7 },
      { id: 'S7', name: 'Plate Card Grinding 🃏', group: 'Cards', defaultComplexity: 2, slaDays: 5 },
      { id: 'S8', name: 'Event Grinding 🏟️', group: 'Events', defaultComplexity: 3, slaDays: 5 },
      { id: 'S9', name: 'Bundle Order 🎁', group: 'Bundle', defaultComplexity: 3, slaDays: 5 },
      { id: 'S10', name: 'Season Pass Grinding 🎫', group: 'Season', defaultComplexity: 3, slaDays: 7 },
      { id: 'S11', name: 'Add-Ons ➕', group: 'Add-Ons', defaultComplexity: 1, slaDays: 3 },
    ];
    for (const s of servicesData) await storage.createService(s);
  }
  await storage.getQueueConfig();
}
