import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, TrendingUp, Users, Package, AlertTriangle, CheckCircle, Clock, Activity } from "lucide-react";
import type { AnalyticsSummary, AuditLog, Grinder, Assignment } from "@shared/schema";

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
}

export default function Dashboard() {
  const { data: analytics, isLoading } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/analytics/summary"],
    refetchInterval: 10000,
  });
  const { data: grindersList } = useQuery<Grinder[]>({ queryKey: ["/api/grinders"], refetchInterval: 10000 });
  const { data: auditLogs } = useQuery<AuditLog[]>({ queryKey: ["/api/audit-logs?limit=15"], refetchInterval: 10000 });
  const { data: assignmentsList } = useQuery<Assignment[]>({ queryKey: ["/api/assignments"], refetchInterval: 10000 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const topEarners = [...(grindersList || [])].sort((a, b) => Number(b.totalEarnings) - Number(a.totalEarnings)).slice(0, 5);
  const recentAssignments = (assignmentsList || []).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-glow" data-testid="text-page-title">GrindOps Command Center</h1>
        <p className="text-muted-foreground mt-1">Complete analytics and operations overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-400" data-testid="text-total-revenue">{formatCurrency(analytics?.totalRevenue || 0)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Grinder Payouts</p>
                <p className="text-2xl font-bold text-blue-400" data-testid="text-grinder-payouts">{formatCurrency(analytics?.totalGrinderPayouts || 0)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Company Profit</p>
                <p className="text-2xl font-bold text-purple-400" data-testid="text-company-profit">{formatCurrency(analytics?.totalCompanyProfit || 0)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Margin</p>
                <p className="text-2xl font-bold text-amber-400" data-testid="text-avg-margin">{(analytics?.avgMargin || 0).toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Total Orders", value: analytics?.totalOrders || 0, icon: Package },
          { label: "Open", value: analytics?.openOrders || 0, icon: Clock },
          { label: "Active", value: analytics?.activeOrders || 0, icon: Activity },
          { label: "Completed", value: analytics?.completedOrders || 0, icon: CheckCircle },
          { label: "Grinders", value: `${analytics?.availableGrinders || 0}/${analytics?.totalGrinders || 0}`, icon: Users },
          { label: "Pending Bids", value: analytics?.pendingBids || 0, icon: AlertTriangle },
          { label: "Assignments", value: analytics?.activeAssignments || 0, icon: Activity },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-4 text-center">
              <stat.icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Top Earners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topEarners.length === 0 && <p className="text-muted-foreground text-sm">No grinder data yet</p>}
              {topEarners.map((g, i) => (
                <div key={g.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5" data-testid={`card-top-earner-${i}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-amber-500/20 text-amber-400" : i === 1 ? "bg-gray-400/20 text-gray-300" : i === 2 ? "bg-orange-500/20 text-orange-400" : "bg-white/10 text-muted-foreground"}`}>
                      #{i + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{g.name}</p>
                      <Badge variant="outline" className="text-xs">{g.category}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">{formatCurrency(Number(g.totalEarnings))}</p>
                    <p className="text-xs text-muted-foreground">{g.completedOrders} completed</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(!auditLogs || auditLogs.length === 0) && <p className="text-muted-foreground text-sm">No activity yet</p>}
              {(auditLogs || []).slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors" data-testid={`card-audit-${log.id}`}>
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    log.action.includes("created") || log.action.includes("accepted") ? "bg-emerald-400" :
                    log.action.includes("rejected") || log.action.includes("denied") ? "bg-red-400" :
                    log.action.includes("updated") || log.action.includes("changed") ? "bg-blue-400" :
                    "bg-muted-foreground"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      <span className="font-medium capitalize">{log.entityType}</span>{" "}
                      <span className="text-muted-foreground">{log.entityId}</span>{" "}
                      <span className="text-primary">{log.action.replace(/_/g, " ")}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.actor} &middot; {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              Recent Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentAssignments.length === 0 && <p className="text-muted-foreground text-sm">No assignments yet</p>}
              {recentAssignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5" data-testid={`card-assignment-${a.id}`}>
                  <div>
                    <p className="font-medium text-sm">{a.orderId}</p>
                    <p className="text-xs text-muted-foreground">Grinder: {a.grinderId}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={a.status === "Active" ? "default" : a.status === "Completed" ? "secondary" : "outline"}>
                      {a.status}
                    </Badge>
                    {a.companyProfit && (
                      <p className="text-xs text-emerald-400 mt-1">Profit: {formatCurrency(Number(a.companyProfit))}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Grinder Risk Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(grindersList || []).filter(g => g.strikes > 0).length === 0 && (
                <p className="text-muted-foreground text-sm">No grinders with strikes</p>
              )}
              {(grindersList || []).filter(g => g.strikes > 0).sort((a, b) => b.strikes - a.strikes).map((g) => (
                <div key={g.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5" data-testid={`card-risk-${g.id}`}>
                  <div>
                    <p className="font-medium text-sm">{g.name}</p>
                    <Badge variant="outline" className="text-xs">{g.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className={`w-3 h-3 rounded-full ${i < g.strikes ? "bg-red-500" : "bg-white/10"}`} />
                    ))}
                    <span className="text-sm text-red-400 ml-2">{g.strikes}/3</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
