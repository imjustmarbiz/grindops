import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import type { AnalyticsSummary, AuditLog, Grinder, Assignment, Order, Bid, Service } from "@shared/schema";

export function useStaffData() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";

  const analytics = useQuery<AnalyticsSummary>({ queryKey: ["/api/analytics/summary"], refetchInterval: 30000, enabled: isOwner });
  const grinders = useQuery<Grinder[]>({ queryKey: ["/api/grinders"], refetchInterval: 30000 });
  const auditLogs = useQuery<AuditLog[]>({ queryKey: ["/api/audit-logs?limit=15"], refetchInterval: 30000 });
  const assignments = useQuery<Assignment[]>({ queryKey: ["/api/assignments"], refetchInterval: 30000 });
  const orders = useQuery<Order[]>({ queryKey: ["/api/orders"], refetchInterval: 30000 });
  const bids = useQuery<Bid[]>({ queryKey: ["/api/bids"], refetchInterval: 30000 });
  const services = useQuery<Service[]>({ queryKey: ["/api/services"], refetchInterval: 60000 });
  const grinderUpdates = useQuery<any[]>({ queryKey: ["/api/staff/order-updates"], refetchInterval: 30000 });
  const payoutReqs = useQuery<any[]>({ queryKey: ["/api/staff/payout-requests"], refetchInterval: 30000 });
  const eliteVsGrinderMetrics = useQuery<any>({ queryKey: ["/api/staff/elite-vs-grinder-metrics"], refetchInterval: 60000, enabled: isOwner });
  const eliteRequests = useQuery<any[]>({ queryKey: ["/api/staff/elite-requests"], refetchInterval: 30000 });
  const staffAlerts = useQuery<any[]>({ queryKey: ["/api/staff/alerts"], refetchInterval: 30000 });
  const strikeLogs = useQuery<any[]>({ queryKey: ["/api/staff/strike-logs"], refetchInterval: 30000 });
  const events = useQuery<any[]>({ queryKey: ["/api/events"], refetchInterval: 60000 });

  const allGrindersData = grinders.data || [];
  const activeGrindersData = allGrindersData.filter(g => !g.isRemoved);

  return {
    analytics: analytics.data,
    analyticsLoading: isOwner ? analytics.isLoading : false,
    analyticsUpdatedAt: analytics.dataUpdatedAt,
    grinders: activeGrindersData,
    allGrindersIncludingRemoved: allGrindersData,
    grindersLoading: grinders.isLoading,
    grindersUpdatedAt: grinders.dataUpdatedAt,
    auditLogs: auditLogs.data || [],
    auditLogsUpdatedAt: auditLogs.dataUpdatedAt,
    assignments: assignments.data || [],
    assignmentsUpdatedAt: assignments.dataUpdatedAt,
    orders: orders.data || [],
    ordersLoading: orders.isLoading,
    ordersUpdatedAt: orders.dataUpdatedAt,
    events: events.data || [],
    eventsUpdatedAt: events.dataUpdatedAt,
    bids: bids.data || [],
    bidsLoading: bids.isLoading,
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
