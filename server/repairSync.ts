import { storage } from "./storage";

export async function repairMissingAssignments() {
  console.log("[repair-sync] Starting comprehensive data repair...");

  const allBids = await storage.getBids();
  const allAssignments = await storage.getAssignments();
  const allOrders = await storage.getOrders();
  const allGrinders = await storage.getGrinders();

  let totalRepairs = 0;

  // === 1. Create missing assignments for accepted bids ===
  const assignedOrderIds = new Set(allAssignments.map(a => a.orderId));

  for (const bid of allBids.filter(b => b.status === "Accepted")) {
    if (assignedOrderIds.has(bid.orderId)) continue;

    const order = allOrders.find(o => o.id === bid.orderId);
    if (!order) continue;

    const orderPrice = Number(order.customerPrice) || 0;
    const grinderEarnings = Number(bid.bidAmount) || 0;
    const companyProfit = orderPrice - grinderEarnings;
    const marginPct = orderPrice > 0 ? ((companyProfit / orderPrice) * 100) : 0;
    const assignmentId = `ASN-${bid.id}-${order.id}`.replace(/[^a-zA-Z0-9-]/g, "");

    try {
      await storage.createAssignment({
        id: assignmentId,
        grinderId: bid.grinderId,
        orderId: order.id,
        dueDateTime: order.orderDueDate,
        status: "Active",
        bidAmount: grinderEarnings.toFixed(2),
        orderPrice: orderPrice.toFixed(2),
        margin: companyProfit.toFixed(2),
        marginPct: marginPct.toFixed(2),
        companyProfit: companyProfit.toFixed(2),
        grinderEarnings: grinderEarnings.toFixed(2),
      });
      assignedOrderIds.add(bid.orderId);
      totalRepairs++;
      console.log(`[repair-sync] Created missing assignment ${assignmentId} for accepted bid ${bid.id} on order ${order.id}`);
    } catch (e: any) {
      if (!e.message?.includes("duplicate")) {
        console.error(`[repair-sync] Failed to create assignment for bid ${bid.id}:`, e.message);
      }
    }
  }

  // === 1b. Create missing bid records for assignments that have no accepted bid ===
  const bidsByOrderGrinder = new Set(
    allBids.filter(b => b.status === "Accepted").map(b => `${b.orderId}::${b.grinderId}`)
  );

  for (const assignment of allAssignments) {
    const key = `${assignment.orderId}::${assignment.grinderId}`;
    if (bidsByOrderGrinder.has(key)) continue;

    const order = allOrders.find(o => o.id === assignment.orderId);
    if (!order) continue;

    const bidAmount = assignment.grinderEarnings || assignment.bidAmount || "0";
    const orderPrice = Number(order.customerPrice) || 0;
    const grinderPay = Number(bidAmount) || 0;
    const margin = orderPrice - grinderPay;
    const marginPct = orderPrice > 0 ? ((margin / orderPrice) * 100) : 0;

    const retroBidId = `BID-${assignment.id}-retro`.replace(/[^a-zA-Z0-9-]/g, "");

    try {
      await storage.createBid({
        id: retroBidId,
        orderId: assignment.orderId,
        grinderId: assignment.grinderId,
        bidAmount: grinderPay.toFixed(2),
        bidTime: assignment.assignedDateTime || new Date(),
        estDeliveryDate: assignment.dueDateTime || order.orderDueDate || new Date(),
        timeline: "Staff assigned",
        canStart: "Immediately",
        qualityScore: null,
        margin: margin.toFixed(2),
        marginPct: marginPct.toFixed(2),
        notes: `Retroactive bid from assignment ${assignment.id}`,
        status: "Accepted",
        acceptedBy: "staff_override",
      });

      if (!order.acceptedBidId) {
        await storage.updateOrder(order.id, { acceptedBidId: retroBidId });
      }

      bidsByOrderGrinder.add(key);
      totalRepairs++;
      console.log(`[repair-sync] Created retroactive bid ${retroBidId} for assignment ${assignment.id} on order ${assignment.orderId}`);
    } catch (e: any) {
      if (!e.message?.includes("duplicate")) {
        console.error(`[repair-sync] Failed to create retro bid for assignment ${assignment.id}:`, e.message);
      }
    }
  }

  // === 2. Sync order status & fields for accepted bids ===
  for (const bid of allBids.filter(b => b.status === "Accepted")) {
    const order = allOrders.find(o => o.id === bid.orderId);
    if (!order) continue;

    const updates: Record<string, any> = {};

    if (order.status === "Open" || order.status === "Bidding Closed") {
      updates.status = "Assigned";
    }
    if (!order.assignedGrinderId) {
      updates.assignedGrinderId = bid.grinderId;
    }
    if (!order.acceptedBidId) {
      updates.acceptedBidId = bid.id;
    }

    const orderPrice = Number(order.customerPrice) || 0;
    const grinderEarnings = Number(bid.bidAmount) || 0;
    if (orderPrice > 0 && !order.companyProfit) {
      updates.companyProfit = (orderPrice - grinderEarnings).toFixed(2);
    }

    if (Object.keys(updates).length > 0) {
      if (updates.status) {
        await storage.updateOrderStatus(order.id, updates.status);
        delete updates.status;
      }
      if (Object.keys(updates).length > 0) {
        await storage.updateOrder(order.id, updates);
      }
      totalRepairs++;
      console.log(`[repair-sync] Synced order ${order.id} fields: ${Object.keys(updates).join(", ")}`);
    }
  }

  // === 3. Auto-deny pending/countered bids on orders that already have an accepted bid ===
  const freshBids = await storage.getBids();
  const ordersWithAcceptedBid = new Map<string, string>();
  for (const bid of freshBids) {
    if (bid.status === "Accepted") {
      ordersWithAcceptedBid.set(bid.orderId, bid.id);
    }
  }
  for (const bid of freshBids) {
    if ((bid.status === "Pending" || bid.status === "Countered") && ordersWithAcceptedBid.has(bid.orderId)) {
      const acceptedBidId = ordersWithAcceptedBid.get(bid.orderId);
      if (acceptedBidId !== bid.id) {
        await storage.updateBidStatus(bid.id, "Denied", "system-repair");
        totalRepairs++;
        console.log(`[repair-sync] Auto-denied stale bid ${bid.id} on order ${bid.orderId} (accepted bid: ${acceptedBidId})`);
      }
    }
  }

  // === 4. Recalculate bid margins when order price exists but margin is missing ===
  for (const bid of allBids) {
    const order = allOrders.find(o => o.id === bid.orderId);
    if (!order) continue;

    const orderPrice = Number(order.customerPrice) || 0;
    const bidAmount = Number(bid.bidAmount) || 0;

    if (orderPrice > 0 && bidAmount > 0 && !bid.margin) {
      const margin = orderPrice - bidAmount;
      const marginPct = (margin / orderPrice) * 100;
      await storage.updateBid(bid.id, {
        margin: margin.toFixed(2),
        marginPct: marginPct.toFixed(2),
      });
      totalRepairs++;
      console.log(`[repair-sync] Calculated margin for bid ${bid.id}: $${margin.toFixed(2)} (${marginPct.toFixed(1)}%)`);
    }
  }

  // === 4. Update assignment financials when order price was added after assignment creation ===
  const freshAssignments = await storage.getAssignments();
  for (const assignment of freshAssignments) {
    const order = allOrders.find(o => o.id === assignment.orderId);
    if (!order) continue;

    const orderPrice = Number(order.customerPrice) || 0;
    const currentOrderPrice = Number(assignment.orderPrice) || 0;
    const grinderEarnings = Number(assignment.grinderEarnings) || Number(assignment.bidAmount) || 0;

    if (orderPrice > 0 && currentOrderPrice !== orderPrice) {
      const companyProfit = orderPrice - grinderEarnings;
      const marginPct = orderPrice > 0 ? ((companyProfit / orderPrice) * 100) : 0;

      await storage.updateAssignment(assignment.id, {
        orderPrice: orderPrice.toFixed(2),
        margin: companyProfit.toFixed(2),
        marginPct: marginPct.toFixed(2),
        companyProfit: companyProfit.toFixed(2),
      });

      if (!order.companyProfit || Number(order.companyProfit) !== companyProfit) {
        await storage.updateOrder(order.id, { companyProfit: companyProfit.toFixed(2) });
      }

      totalRepairs++;
      console.log(`[repair-sync] Updated assignment ${assignment.id} financials: price=$${orderPrice}, profit=$${companyProfit.toFixed(2)}`);
    }
  }

  // === 5. Recalculate grinder stats from actual assignment data ===
  const latestAssignments = await storage.getAssignments();

  for (const grinder of allGrinders) {
    const grinderAssignments = latestAssignments.filter(a => a.grinderId === grinder.id);
    const activeAssignments = grinderAssignments.filter(a => a.status === "Active");
    const completedAssignments = grinderAssignments.filter(a => a.status === "Completed");

    const correctActiveOrders = activeAssignments.length;
    const correctTotalOrders = grinderAssignments.length;
    const correctCompletedOrders = completedAssignments.length;

    let correctTotalEarnings = 0;
    for (const a of grinderAssignments) {
      correctTotalEarnings += Number(a.grinderEarnings) || Number(a.bidAmount) || 0;
    }

    let correctLastAssigned: Date | null = null;
    for (const a of grinderAssignments) {
      const assignedDate = a.assignedDateTime ? new Date(a.assignedDateTime) : null;
      if (assignedDate && (!correctLastAssigned || assignedDate > correctLastAssigned)) {
        correctLastAssigned = assignedDate;
      }
    }

    const now7dAgo = new Date();
    now7dAgo.setDate(now7dAgo.getDate() - 7);
    const correctL7D = grinderAssignments.filter(a => {
      const d = a.assignedDateTime ? new Date(a.assignedDateTime) : null;
      return d && d >= now7dAgo;
    }).length;

    const grinderBids = allBids.filter(b => b.grinderId === grinder.id);
    const acceptedBids = grinderBids.filter(b => b.status === "Accepted");
    const correctWinRate = grinderBids.length > 0
      ? ((acceptedBids.length / grinderBids.length) * 100).toFixed(0)
      : grinder.winRate;

    const correctUtilization = grinder.capacity > 0
      ? ((correctActiveOrders / grinder.capacity) * 100).toFixed(0)
      : "0";

    const updates: Record<string, any> = {};
    if (grinder.activeOrders !== correctActiveOrders) updates.activeOrders = correctActiveOrders;
    if (grinder.totalOrders !== correctTotalOrders) updates.totalOrders = correctTotalOrders;
    if (grinder.completedOrders !== correctCompletedOrders) updates.completedOrders = correctCompletedOrders;
    if (Number(grinder.totalEarnings) !== correctTotalEarnings) updates.totalEarnings = correctTotalEarnings.toFixed(2);
    if (grinder.ordersAssignedL7D !== correctL7D) updates.ordersAssignedL7D = correctL7D;
    if (correctWinRate && grinder.winRate !== correctWinRate) updates.winRate = correctWinRate;
    if (grinder.utilization !== correctUtilization) updates.utilization = correctUtilization;
    if (correctLastAssigned && (!grinder.lastAssigned || new Date(grinder.lastAssigned).getTime() !== correctLastAssigned.getTime())) {
      updates.lastAssigned = correctLastAssigned;
    }

    if (Object.keys(updates).length > 0) {
      await storage.updateGrinder(grinder.id, updates);
      totalRepairs++;
      console.log(`[repair-sync] Fixed grinder ${grinder.name} (${grinder.id}) stats: ${JSON.stringify(updates)}`);
    }
  }

  // === 6. Fix orders that say "Assigned" but have no assignment record ===
  for (const order of allOrders.filter(o => o.status === "Assigned")) {
    const hasAssignment = latestAssignments.some(a => a.orderId === order.id);
    if (!hasAssignment && !order.assignedGrinderId) {
      await storage.updateOrderStatus(order.id, "Open");
      totalRepairs++;
      console.log(`[repair-sync] Reset orphaned order ${order.id} from Assigned back to Open (no assignment found)`);
    }
  }

  // === Summary ===
  if (totalRepairs > 0) {
    console.log(`[repair-sync] Completed ${totalRepairs} total repair(s)`);
  } else {
    console.log(`[repair-sync] All data is consistent - no repairs needed`);
  }
}
