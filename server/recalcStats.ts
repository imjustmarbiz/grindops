import { storage } from "./storage";

export async function recalcGrinderStats(grinderId: string) {
  const allAssignments = await storage.getAssignments();
  const myAssignments = allAssignments.filter((a: any) => a.grinderId === grinderId);
  const completed = myAssignments.filter((a: any) => a.status === "Completed");
  const active = myAssignments.filter((a: any) => a.status === "Active");
  const reassigned = myAssignments.filter((a: any) => a.wasReassigned && a.originalGrinderId === grinderId);
  const totalNonCancelled = myAssignments.filter((a: any) => a.status !== "Cancelled").length;

  const completedCount = completed.length;
  const onTimeCount = completed.filter((a: any) => a.isOnTime === true).length;
  const onTimeRate = completedCount > 0 ? ((onTimeCount / completedCount) * 100) : 100;

  const completionRate = totalNonCancelled > 0 ? ((completedCount / totalNonCancelled) * 100) : 100;

  let totalTurnaroundDays = 0;
  let turnaroundCount = 0;
  for (const a of completed) {
    if (a.assignedDateTime && a.deliveredDateTime) {
      const days = (new Date(a.deliveredDateTime).getTime() - new Date(a.assignedDateTime).getTime()) / (1000 * 60 * 60 * 24);
      totalTurnaroundDays += days;
      turnaroundCount++;
    }
  }
  const avgTurnaroundDays = turnaroundCount > 0 ? (totalTurnaroundDays / turnaroundCount).toFixed(2) : null;

  const grinder = await storage.getGrinder(grinderId);
  if (!grinder) return null;
  const strikes = grinder.strikes || 0;
  const reassignedCount = reassigned.length;

  const allBids = await storage.getBids();
  const myBids = allBids.filter((b: any) => b.grinderId === grinderId);
  const acceptedBids = myBids.filter((b: any) => b.status === "Accepted").length;
  const totalBidsCount = myBids.length;
  const winRate = totalBidsCount > 0 ? ((acceptedBids / totalBidsCount) * 100) : 0;

  const totalEarnings = completed.reduce((sum: number, a: any) => sum + (Number(a.grinderEarnings) || Number(a.bidAmount) || 0), 0)
    + active.reduce((sum: number, a: any) => sum + (Number(a.grinderEarnings) || Number(a.bidAmount) || 0), 0);

  let qualityScore = 100;
  if (completedCount > 0) {
    const onTimeFactor = (onTimeCount / completedCount) * 100;
    let speedFactor = 100;
    if (turnaroundCount > 0) {
      const avgDays = totalTurnaroundDays / turnaroundCount;
      if (avgDays <= 2) speedFactor = 100;
      else if (avgDays <= 4) speedFactor = 85;
      else if (avgDays <= 6) speedFactor = 70;
      else speedFactor = Math.max(40, 100 - (avgDays * 8));
    }
    const strikePenalty = Math.min(strikes * 15, 60);
    const reassignPenalty = completedCount > 0 ? Math.min((reassignedCount / (completedCount + reassignedCount)) * 100, 50) : 0;

    qualityScore = Math.round(
      (onTimeFactor * 0.40) +
      (speedFactor * 0.25) +
      ((100 - strikePenalty) * 0.20) +
      ((100 - reassignPenalty) * 0.15)
    );
    qualityScore = Math.max(0, Math.min(100, qualityScore));
  }

  let lastAssigned: Date | null = null;
  for (const a of myAssignments) {
    const assignedDate = a.assignedDateTime ? new Date(a.assignedDateTime) : null;
    if (assignedDate && (!lastAssigned || assignedDate > lastAssigned)) {
      lastAssigned = assignedDate;
    }
  }

  const now7dAgo = new Date();
  now7dAgo.setDate(now7dAgo.getDate() - 7);
  const ordersAssignedL7D = myAssignments.filter((a: any) => {
    const d = a.assignedDateTime ? new Date(a.assignedDateTime) : null;
    return d && d >= now7dAgo;
  }).length;

  const utilization = grinder.capacity > 0
    ? ((active.length / grinder.capacity) * 100).toFixed(0)
    : "0";

  const updates: any = {
    completedOrders: completedCount,
    activeOrders: active.length,
    totalOrders: totalNonCancelled,
    onTimeRate: onTimeRate.toFixed(1),
    completionRate: completionRate.toFixed(1),
    avgQualityRating: qualityScore.toString(),
    winRate: winRate.toFixed(1),
    totalEarnings: totalEarnings.toFixed(2),
    ordersAssignedL7D,
    utilization,
    ...(avgTurnaroundDays ? { avgTurnaroundDays } : {}),
    ...(lastAssigned ? { lastAssigned } : {}),
  };

  await storage.updateGrinder(grinderId, updates);
  return updates;
}
