import { useQuery } from "@tanstack/react-query";
import type { AnalyticsSummary, AuditLog, Grinder, Assignment, Order, Bid, Service } from "@shared/schema";

export function useStaffData() {
  const analytics = useQuery<AnalyticsSummary>({ queryKey: ["/api/analytics/summary"], refetchInterval: 30000 });
  const grinders = useQuery<Grinder[]>({ queryKey: ["/api/grinders"], refetchInterval: 30000 });
  const auditLogs = useQuery<AuditLog[]>({ queryKey: ["/api/audit-logs?limit=15"], refetchInterval: 30000 });
  const assignments = useQuery<Assignment[]>({ queryKey: ["/api/assignments"], refetchInterval: 30000 });
  const orders = useQuery<Order[]>({ queryKey: ["/api/orders"], refetchInterval: 30000 });
  const bids = useQuery<Bid[]>({ queryKey: ["/api/bids"], refetchInterval: 30000 });
  const services = useQuery<Service[]>({ queryKey: ["/api/services"], refetchInterval: 60000 });
  const grinderUpdates = useQuery<any[]>({ queryKey: ["/api/staff/order-updates"], refetchInterval: 30000 });
  const payoutReqs = useQuery<any[]>({ queryKey: ["/api/staff/payout-requests"], refetchInterval: 30000 });
  const eliteVsGrinderMetrics = useQuery<any>({ queryKey: ["/api/staff/elite-vs-grinder-metrics"], refetchInterval: 60000 });
  const eliteRequests = useQuery<any[]>({ queryKey: ["/api/staff/elite-requests"], refetchInterval: 30000 });
  const staffAlerts = useQuery<any[]>({ queryKey: ["/api/staff/alerts"], refetchInterval: 30000 });
  const strikeLogs = useQuery<any[]>({ queryKey: ["/api/staff/strike-logs"], refetchInterval: 30000 });

  const allGrindersData = grinders.data || [];
  const activeGrindersData = allGrindersData.filter(g => !g.isRemoved);

  return {
    analytics: analytics.data,
    analyticsLoading: analytics.isLoading,
    analyticsUpdatedAt: analytics.dataUpdatedAt,
    grinders: activeGrindersData,
    allGrindersIncludingRemoved: allGrindersData,
    grindersUpdatedAt: grinders.dataUpdatedAt,
    auditLogs: auditLogs.data || [],
    auditLogsUpdatedAt: auditLogs.dataUpdatedAt,
    assignments: assignments.data || [],
    assignmentsUpdatedAt: assignments.dataUpdatedAt,
    orders: orders.data || [],
    ordersUpdatedAt: orders.dataUpdatedAt,
    bids: bids.data || [],
    bidsUpdatedAt: bids.dataUpdatedAt,
    services: services.data || [],
    grinderUpdates: grinderUpdates.data || [],
    payoutReqs: payoutReqs.data || [],
    eliteVsGrinderMetrics: eliteVsGrinderMetrics.data,
    eliteRequests: eliteRequests.data || [],
    staffAlerts: staffAlerts.data || [],
    strikeLogs: strikeLogs.data || [],
  };
}
