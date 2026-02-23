import { storage } from "./storage";

export async function repairMissingAssignments() {
  const allBids = await storage.getBids();
  const allAssignments = await storage.getAssignments();
  const allOrders = await storage.getOrders();

  const acceptedBids = allBids.filter(b => b.status === "Accepted");
  const assignedOrderIds = new Set(allAssignments.map(a => a.orderId));

  let repaired = 0;

  for (const bid of acceptedBids) {
    if (assignedOrderIds.has(bid.orderId)) continue;

    const order = allOrders.find(o => o.id === bid.orderId);
    if (!order) continue;

    if (order.status !== "Open" && order.status !== "Bidding Closed" && order.status !== "Assigned") continue;

    const orderPrice = Number(order.customerPrice) || 0;
    const grinderEarnings = Number(bid.bidAmount) || 0;
    const companyProfit = orderPrice - grinderEarnings;
    const marginPct = orderPrice > 0 ? ((companyProfit / orderPrice) * 100) : 0;

    const assignmentId = `ASN-${bid.id}-${order.id}`.replace(/[^a-zA-Z0-9-]/g, "");

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

    if (order.status !== "Assigned") {
      await storage.updateOrderStatus(order.id, "Assigned");
    }
    await storage.updateOrder(order.id, {
      assignedGrinderId: bid.grinderId,
      acceptedBidId: bid.id,
      companyProfit: companyProfit.toFixed(2),
    });

    const grinder = await storage.getGrinder(bid.grinderId);
    if (grinder) {
      const newEarnings = Number(grinder.totalEarnings) + grinderEarnings;
      await storage.updateGrinder(bid.grinderId, {
        activeOrders: grinder.activeOrders + 1,
        totalOrders: grinder.totalOrders + 1,
        totalEarnings: newEarnings.toFixed(2),
        lastAssigned: new Date(),
      });
    }

    await storage.createAuditLog({
      id: `AL-repair-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      entityType: "assignment",
      entityId: assignmentId,
      action: "auto_repaired",
      actor: "system",
      details: JSON.stringify({ bidId: bid.id, orderId: order.id, grinderId: bid.grinderId, grinderEarnings, companyProfit }),
    });

    repaired++;
    console.log(`[repair-sync] Created missing assignment ${assignmentId} for accepted bid ${bid.id} on order ${order.id}`);
  }

  if (repaired > 0) {
    console.log(`[repair-sync] Repaired ${repaired} missing assignment(s)`);
  } else {
    console.log(`[repair-sync] All accepted bids have assignments - no repairs needed`);
  }
}
