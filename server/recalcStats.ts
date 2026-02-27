import { storage } from "./storage";

const TIER_THRESHOLDS = [
  {
    tier: "Elite",
    minCompleted: 75, minQuality: 90, minWinRate: 65, minOnTime: 90, minEarnings: 5000,
    minTenureDays: 180, minCompletedL30D: 8, minCompletedL90D: 20, minOnTimeL30D: 85,
  },
  {
    tier: "Diamond",
    minCompleted: 50, minQuality: 85, minWinRate: 55, minOnTime: 85, minEarnings: 2500,
    minTenureDays: 120, minCompletedL30D: 5, minCompletedL90D: 12, minOnTimeL30D: 80,
  },
  {
    tier: "Gold",
    minCompleted: 25, minQuality: 75, minWinRate: 45, minOnTime: 75, minEarnings: 1000,
    minTenureDays: 60, minCompletedL30D: 3, minCompletedL90D: 7, minOnTimeL30D: 70,
  },
  {
    tier: "Silver",
    minCompleted: 10, minQuality: 65, minWinRate: 35, minOnTime: 65, minEarnings: 300,
    minTenureDays: 14, minCompletedL30D: 2, minCompletedL90D: 3, minOnTimeL30D: 0,
  },
  {
    tier: "Bronze",
    minCompleted: 3, minQuality: 50, minWinRate: 20, minOnTime: 50, minEarnings: 50,
    minTenureDays: 3, minCompletedL30D: 1, minCompletedL90D: 1, minOnTimeL30D: 0,
  },
];

export { TIER_THRESHOLDS };

interface WindowStats {
  completedL30D: number;
  completedL90D: number;
  onTimeL30D: number;
  tenureDays: number;
}

function calculateTier(
  completedOrders: number,
  qualityScore: number,
  winRate: number,
  onTimeRate: number,
  totalEarnings: number,
  windowStats: WindowStats
): string {
  for (const t of TIER_THRESHOLDS) {
    if (
      completedOrders >= t.minCompleted &&
      qualityScore >= t.minQuality &&
      winRate >= t.minWinRate &&
      onTimeRate >= t.minOnTime &&
      totalEarnings >= t.minEarnings &&
      windowStats.tenureDays >= t.minTenureDays &&
      windowStats.completedL30D >= t.minCompletedL30D &&
      windowStats.completedL90D >= t.minCompletedL90D &&
      (t.minOnTimeL30D === 0 || windowStats.onTimeL30D >= t.minOnTimeL30D)
    ) {
      return t.tier;
    }
  }
  return "New";
}

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

  const now = new Date();
  const now30dAgo = new Date(now);
  now30dAgo.setDate(now30dAgo.getDate() - 30);
  const now90dAgo = new Date(now);
  now90dAgo.setDate(now90dAgo.getDate() - 90);

  const completedL30D = completed.filter((a: any) => {
    const d = a.deliveredDateTime ? new Date(a.deliveredDateTime) : null;
    return d && d >= now30dAgo;
  });
  const completedL90D = completed.filter((a: any) => {
    const d = a.deliveredDateTime ? new Date(a.deliveredDateTime) : null;
    return d && d >= now90dAgo;
  });

  const onTimeL30DCount = completedL30D.filter((a: any) => a.isOnTime === true).length;
  const onTimeL30D = completedL30D.length > 0 ? ((onTimeL30DCount / completedL30D.length) * 100) : 100;

  let totalSpeedScore = 0;
  let speedCount = 0;
  let totalTurnaroundDays = 0;
  let turnaroundCount = 0;
  for (const a of completed) {
    const startTime = (a as any).startedAt || a.assignedDateTime;
    if (startTime && a.deliveredDateTime) {
      const startMs = new Date(startTime).getTime();
      const deliveredMs = new Date(a.deliveredDateTime).getTime();
      const actualDays = (deliveredMs - startMs) / (1000 * 60 * 60 * 24);
      totalTurnaroundDays += actualDays;
      turnaroundCount++;

      if (actualDays <= 2) {
        totalSpeedScore += 100;
      } else {
        const dueDate = a.dueDateTime || (a as any).orderDueDate;
        if (dueDate) {
          const dueMs = new Date(dueDate).getTime();
          const availableDays = Math.max(0.5, (dueMs - startMs) / (1000 * 60 * 60 * 24));
          const ratio = actualDays / availableDays;
          if (ratio <= 0.5) totalSpeedScore += 100;
          else if (ratio <= 0.75) totalSpeedScore += 90;
          else if (ratio <= 1.0) totalSpeedScore += 75;
          else totalSpeedScore += Math.max(40, 75 - ((ratio - 1) * 35));
        } else {
          if (actualDays <= 4) totalSpeedScore += 85;
          else if (actualDays <= 6) totalSpeedScore += 70;
          else totalSpeedScore += Math.max(40, 100 - (actualDays * 8));
        }
      }
      speedCount++;
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

  const exemptOrderIds = new Set(myAssignments.filter((a: any) => a.exemptFromCompliance).map((a: any) => a.orderId));
  const complianceAssignments = myAssignments.filter((a: any) => !a.exemptFromCompliance);

  const allCheckpoints = await storage.getActivityCheckpoints(undefined, grinderId);
  const missedUpdates = allCheckpoints.filter((c: any) => c.type === "missed_update" && !exemptOrderIds.has(c.orderId)).length;
  const totalCheckpointDays = complianceAssignments.reduce((sum: number, a: any) => {
    if (!a.assignedDateTime) return sum;
    const start = new Date(a.assignedDateTime);
    const end = a.deliveredDateTime ? new Date(a.deliveredDateTime) : new Date();
    return sum + Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }, 0);
  const updateComplianceRate = totalCheckpointDays > 0
    ? Math.max(0, ((totalCheckpointDays - missedUpdates) / totalCheckpointDays) * 100)
    : 100;

  let qualityScore = 100;
  if (completedCount > 0 || active.length > 0) {
    const onTimeFactor = completedCount > 0 ? (onTimeCount / completedCount) * 100 : 100;
    const speedFactor = speedCount > 0 ? totalSpeedScore / speedCount : 100;
    const strikePenalty = Math.min(strikes * 15, 60);
    const reassignPenalty = completedCount > 0 ? Math.min((reassignedCount / (completedCount + reassignedCount)) * 100, 50) : 0;

    qualityScore = Math.round(
      (onTimeFactor * 0.35) +
      (speedFactor * 0.20) +
      ((100 - strikePenalty) * 0.15) +
      ((100 - reassignPenalty) * 0.15) +
      (updateComplianceRate * 0.15)
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

  let earliestOrderDate: Date | null = null;
  for (const a of myAssignments) {
    const candidates = [
      (a as any).startDateTime ? new Date((a as any).startDateTime) : null,
      a.assignedDateTime ? new Date(a.assignedDateTime) : null,
    ].filter(Boolean) as Date[];
    for (const d of candidates) {
      if (!earliestOrderDate || d < earliestOrderDate) earliestOrderDate = d;
    }
  }

  const tenureStart = earliestOrderDate || (grinder.joinedAt ? new Date(grinder.joinedAt) : null);
  const tenureDays = tenureStart
    ? Math.floor((now.getTime() - tenureStart.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const windowStats: WindowStats = {
    completedL30D: completedL30D.length,
    completedL90D: completedL90D.length,
    onTimeL30D: Math.round(onTimeL30D * 10) / 10,
    tenureDays,
  };

  const autoTier = calculateTier(completedCount, qualityScore, winRate, onTimeRate, totalEarnings, windowStats);

  const updates: any = {
    completedOrders: completedCount,
    activeOrders: active.length,
    totalOrders: totalNonCancelled,
    onTimeRate: onTimeRate.toFixed(1),
    completionRate: completionRate.toFixed(1),
    avgQualityRating: qualityScore.toString(),
    winRate: winRate.toFixed(1),
    totalEarnings: totalEarnings.toFixed(2),
    dailyUpdateCompliance: updateComplianceRate.toFixed(1),
    ordersAssignedL7D,
    utilization,
    tier: autoTier,
    ...(avgTurnaroundDays ? { avgTurnaroundDays } : {}),
    ...(lastAssigned ? { lastAssigned } : {}),
  };

  await storage.updateGrinder(grinderId, updates);
  return { ...updates, windowStats };
}
