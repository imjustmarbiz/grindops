import { useAuth } from "@/hooks/use-auth";
import { useStaffData } from "@/hooks/use-staff-data";
import { formatCurrency, formatCompact, AnimatedRing, MiniBar, LastUpdated, categoryIcon } from "@/lib/staff-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DollarSign, TrendingUp, Users, PieChart, Gauge, Percent, Crown, BarChart3, Award, ArrowUpRight, ArrowDownRight, Target, Clock, CheckCircle, XCircle } from "lucide-react";
import { useLocation } from "wouter";

function SplitBar({ segments, height = 10 }: { segments: { value: number; color: string; label: string }[]; height?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div className="w-full rounded-full bg-white/5" style={{ height }} />;
  return (
    <div className="w-full rounded-full bg-white/5 overflow-hidden flex" style={{ height }}>
      {segments.filter(s => s.value > 0).map((seg, i) => (
        <div key={i} className={`${seg.color} transition-all duration-700`} style={{ width: `${(seg.value / total) * 100}%` }} />
      ))}
    </div>
  );
}

function MetricRow({ label, value, maxValue, color, suffix, icon: Icon }: {
  label: string; value: number; maxValue: number; color: string; suffix: string; icon?: any;
}) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      {Icon && <Icon className={`w-3.5 h-3.5 ${color} flex-shrink-0`} />}
      <span className="text-xs text-muted-foreground w-24 sm:w-28 truncate">{label}</span>
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700`} style={{ width: `${Math.min(100, pct)}%`, background: `var(--bar-color)` }} />
      </div>
      <span className="text-xs font-mono w-14 text-right font-medium" style={{ color: `var(--bar-color)` }}>
        {value.toFixed(1)}{suffix}
      </span>
    </div>
  );
}

export default function StaffAnalytics() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const {
    analytics,
    analyticsLoading,
    analyticsUpdatedAt,
    grinders: allGrinders,
    grindersUpdatedAt,
    assignments: allAssignments,
    assignmentsUpdatedAt,
    orders: allOrders,
    ordersUpdatedAt,
    bids: allBids,
    bidsUpdatedAt,
    services: allServices,
    eliteVsGrinderMetrics,
  } = useStaffData();

  const pendingBids = allBids.filter(b => b.status === "Pending").length;
  const acceptedBids = allBids.filter(b => b.status === "Accepted").length;
  const rejectedBids = allBids.filter(b => b.status === "Rejected").length;
  const totalBids = allBids.length;
  const bidConversionRate = totalBids > 0 ? (acceptedBids / totalBids) * 100 : 0;

  const totalCapacity = allGrinders.reduce((sum, g) => sum + g.capacity, 0);
  const totalActive = allGrinders.reduce((sum, g) => sum + g.activeOrders, 0);
  const fleetUtilization = totalCapacity > 0 ? (totalActive / totalCapacity) * 100 : 0;
  const availableGrinders = allGrinders.filter(g => g.activeOrders < g.capacity).length;
  const atCapacity = allGrinders.filter(g => g.activeOrders >= g.capacity).length;

  const revenue = analytics?.totalRevenue || 0;
  const payouts = analytics?.totalGrinderPayouts || 0;
  const profit = analytics?.totalCompanyProfit || 0;
  const profitMarginPct = revenue > 0 ? (profit / revenue) * 100 : 0;
  const payoutPct = revenue > 0 ? (payouts / revenue) * 100 : 0;

  const completedAssignments = allAssignments.filter(a => a.status === "Completed");
  const onTimeCount = completedAssignments.filter(a => a.isOnTime === true).length;
  const onTimeRate = completedAssignments.length > 0 ? (onTimeCount / completedAssignments.length) * 100 : 0;

  const nonCancelledOrders = allOrders.filter(o => o.status !== "Cancelled");
  const serviceDistribution = allServices.map(s => {
    const svcOrders = nonCancelledOrders.filter(o => o.serviceId === s.id);
    const count = svcOrders.length;
    const serviceRevenue = svcOrders.reduce((sum, o) => sum + Number(o.customerPrice || 0), 0);
    return { name: s.name, id: s.id, count, revenue: serviceRevenue };
  }).sort((a, b) => b.revenue - a.revenue);
  const maxServiceRevenue = Math.max(...serviceDistribution.map(s => s.revenue), 1);
  const totalServiceRevenue = serviceDistribution.reduce((s, d) => s + d.revenue, 0);
  const serviceColors = ["bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-purple-500", "bg-cyan-500", "bg-pink-500", "bg-rose-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500", "bg-lime-500"];

  const topEarners = [...allGrinders].sort((a, b) => Number(b.totalEarnings) - Number(a.totalEarnings)).slice(0, 5);
  const maxEarnings = topEarners.length > 0 ? Number(topEarners[0].totalEarnings) : 1;

  const latestUpdate = Math.max(analyticsUpdatedAt || 0, grindersUpdatedAt || 0, assignmentsUpdatedAt || 0, ordersUpdatedAt || 0, bidsUpdatedAt || 0);
  const lastUpdatedDate = latestUpdate > 0 ? new Date(latestUpdate) : null;

  return (
    <TooltipProvider>
      <div className="space-y-6" data-testid="staff-analytics-page">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-3xl font-display font-bold tracking-tight" data-testid="text-analytics-title">
                Analytics
              </h1>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">Live</span>
              </div>
            </div>
            <LastUpdated date={lastUpdatedDate} />
          </div>
          <p className="text-sm text-muted-foreground">Revenue, fleet, and performance metrics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="border-white/[0.06] bg-white/[0.02] overflow-hidden" data-testid="card-revenue-split">
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <PieChart className="w-4 h-4 text-emerald-400" />
                </div>
                Revenue Split
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-around gap-2">
                <AnimatedRing percent={payoutPct} color="#60a5fa" label="Grinder Pay" value={formatCompact(payouts)} />
                <AnimatedRing percent={profitMarginPct} color="#a78bfa" label="Company Profit" value={formatCompact(profit)} />
                <AnimatedRing percent={100} color="#34d399" label="Total Revenue" value={formatCompact(revenue)} size={90} />
              </div>
              <div className="space-y-3">
                <SplitBar height={10} segments={[
                  { value: payouts, color: "bg-blue-500", label: "Payouts" },
                  { value: profit, color: "bg-purple-500", label: "Profit" },
                ]} />
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Grinder Share</p>
                    <p className="text-lg font-bold text-blue-400">{payoutPct.toFixed(1)}%</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-purple-500/5 border border-purple-500/10">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Profit Margin</p>
                    <p className="text-lg font-bold text-purple-400">{profitMarginPct.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/[0.06] bg-white/[0.02] overflow-hidden" data-testid="card-fleet-utilization">
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                </div>
                Fleet Utilization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 sm:gap-6">
                <AnimatedRing percent={fleetUtilization} color={fleetUtilization > 80 ? "#f87171" : fleetUtilization > 60 ? "#fbbf24" : "#34d399"} label="Limit Used" value={`${fleetUtilization.toFixed(0)}%`} size={90} stroke={10} />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-xs text-muted-foreground">Available</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-400" data-testid="text-available-grinders">{availableGrinders}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="text-xs text-muted-foreground">At Limit</span>
                    </div>
                    <span className="text-sm font-bold text-red-400" data-testid="text-at-capacity">{atCapacity}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-xs text-muted-foreground">Slots</span>
                    </div>
                    <span className="text-sm font-bold text-blue-400" data-testid="text-total-slots">{totalActive}/{totalCapacity}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                {allGrinders.slice(0, 6).map(g => (
                  <Tooltip key={g.id}>
                    <TooltipTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-20 truncate text-left">{g.name}</span>
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${g.activeOrders >= g.capacity ? "bg-red-500" : g.activeOrders > 0 ? "bg-primary" : "bg-white/10"}`} style={{ width: `${g.capacity > 0 ? (g.activeOrders / g.capacity) * 100 : 0}%` }} />
                        </div>
                        <span className="text-[10px] font-mono w-6 text-right">{g.activeOrders}/{g.capacity}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{g.name}: {g.activeOrders}/{g.capacity} orders ({g.category}) - {(g as any).availabilityStatus || "available"}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/[0.06] bg-white/[0.02] overflow-hidden" data-testid="card-bid-conversion">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                    <Percent className="w-4 h-4 text-amber-400" />
                  </div>
                  Bid Conversion
                </CardTitle>
                <LastUpdated date={bidsUpdatedAt ? new Date(bidsUpdatedAt) : null} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 sm:gap-6">
                <AnimatedRing percent={bidConversionRate} color="#34d399" label="Win Rate" value={`${bidConversionRate.toFixed(0)}%`} size={90} stroke={10} />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-yellow-400" />
                      <span className="text-xs text-muted-foreground">Pending</span>
                    </div>
                    <span className="text-sm font-bold text-yellow-400" data-testid="text-pending-bids">{pendingBids}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      <span className="text-xs text-muted-foreground">Accepted</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-400" data-testid="text-accepted-bids">{acceptedBids}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-3 h-3 text-red-400" />
                      <span className="text-xs text-muted-foreground">Rejected</span>
                    </div>
                    <span className="text-sm font-bold text-red-400" data-testid="text-rejected-bids">{rejectedBids}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <SplitBar height={10} segments={[
                  { value: acceptedBids, color: "bg-emerald-500", label: "Accepted" },
                  { value: rejectedBids, color: "bg-red-500", label: "Rejected" },
                  { value: pendingBids, color: "bg-yellow-500", label: "Pending" },
                ]} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Total Bids: {totalBids}</span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    On-Time: <span className={onTimeRate >= 80 ? "text-emerald-400" : "text-amber-400"}>{onTimeRate.toFixed(0)}%</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="border-white/[0.06] bg-white/[0.02]" data-testid="card-top-earners">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                    <Crown className="w-4 h-4 text-amber-400" />
                  </div>
                  Top Earners
                </CardTitle>
                <LastUpdated date={grindersUpdatedAt ? new Date(grindersUpdatedAt) : null} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {topEarners.length === 0 && (
                  <div className="flex flex-col items-center py-6 text-muted-foreground">
                    <Crown className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">No grinder data yet</p>
                  </div>
                )}
                {topEarners.map((g, i) => {
                  const earnings = Number(g.totalEarnings);
                  const medalColors = [
                    "bg-gradient-to-br from-amber-500/25 to-amber-600/15 text-amber-400 ring-1 ring-amber-500/30",
                    "bg-gradient-to-br from-slate-400/25 to-slate-500/15 text-slate-300 ring-1 ring-slate-400/30",
                    "bg-gradient-to-br from-orange-500/25 to-orange-600/15 text-orange-400 ring-1 ring-orange-500/30",
                  ];
                  return (
                    <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] sm:hover:bg-white/[0.05] transition-colors" data-testid={`card-top-earner-${i}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${i < 3 ? medalColors[i] : "bg-white/5 text-muted-foreground"}`}>
                        #{i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {categoryIcon(g.category)}
                          <span className="font-medium text-sm truncate cursor-pointer hover:underline"
                            data-testid={`link-earner-${g.id}`}
                            onClick={() => navigate(`/grinders?scorecard=${g.id}`)}>{g.name}</span>
                          <Badge variant="outline" className="text-[9px] h-4">{g.tier}</Badge>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-700" style={{ width: `${maxEarnings > 0 ? (earnings / maxEarnings) * 100 : 0}%` }} />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-emerald-400 text-sm" data-testid={`text-earnings-${i}`}>{formatCurrency(earnings)}</p>
                        <p className="text-[10px] text-muted-foreground">{g.completedOrders} done</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/[0.06] bg-white/[0.02]" data-testid="card-service-distribution">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-primary" />
                  </div>
                  Service Distribution
                </CardTitle>
                <LastUpdated date={ordersUpdatedAt ? new Date(ordersUpdatedAt) : null} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <SplitBar height={12} segments={serviceDistribution.map((s, i) => ({
                  value: s.revenue,
                  color: serviceColors[i % serviceColors.length],
                  label: s.name,
                }))} />
              </div>
              <div className="space-y-2">
                {serviceDistribution.length === 0 && (
                  <div className="flex flex-col items-center py-6 text-muted-foreground">
                    <BarChart3 className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">No order data yet</p>
                  </div>
                )}
                {serviceDistribution.map((s, i) => {
                  const revPct = totalServiceRevenue > 0 ? (s.revenue / totalServiceRevenue) * 100 : 0;
                  return (
                    <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg sm:hover:bg-white/[0.03] transition-colors" data-testid={`service-dist-${s.id}`}>
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${serviceColors[i % serviceColors.length]}`} />
                      <span className="text-sm font-medium flex-1 min-w-0 truncate">{s.name}</span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">{s.count} orders</span>
                      <span className="text-xs font-medium text-emerald-400 flex-shrink-0 w-16 text-right">{formatCurrency(s.revenue)}</span>
                      <span className="text-[10px] text-white/30 w-8 text-right flex-shrink-0">{revPct.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/[0.06] bg-gradient-to-br from-purple-500/[0.04] via-transparent to-amber-500/[0.04] overflow-hidden" data-testid="card-elite-vs-grinder">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <Award className="w-4 h-4 text-purple-400" />
              </div>
              Elite vs Grinder Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eliteVsGrinderMetrics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    label: "Elite Grinders",
                    data: eliteVsGrinderMetrics.elite,
                    other: eliteVsGrinderMetrics.grinders,
                    icon: Crown,
                    color: "#f59e0b",
                    textColor: "text-amber-400",
                    bgColor: "bg-amber-500/5",
                    borderColor: "border-amber-500/10",
                    barColor: "bg-amber-500",
                  },
                  {
                    label: "Regular Grinders",
                    data: eliteVsGrinderMetrics.grinders,
                    other: eliteVsGrinderMetrics.elite,
                    icon: Users,
                    color: "#3b82f6",
                    textColor: "text-blue-400",
                    bgColor: "bg-blue-500/5",
                    borderColor: "border-blue-500/10",
                    barColor: "bg-blue-500",
                  },
                ].map((group) => {
                  const GroupIcon = group.icon;
                  const metrics = [
                    { label: "Avg Win Rate", value: group.data?.avgWinRate, otherValue: group.other?.avgWinRate, suffix: "%", max: 100 },
                    { label: "Avg Quality", value: group.data?.avgQuality, otherValue: group.other?.avgQuality, suffix: "%", max: 100 },
                    { label: "Avg On-Time", value: group.data?.avgOnTime, otherValue: group.other?.avgOnTime, suffix: "%", max: 100 },
                    { label: "Avg Completion", value: group.data?.avgCompletion, otherValue: group.other?.avgCompletion, suffix: "%", max: 100 },
                    { label: "Avg Turnaround", value: group.data?.avgTurnaround, otherValue: group.other?.avgTurnaround, suffix: "h", max: Math.max(Number(group.data?.avgTurnaround || 1), Number(group.other?.avgTurnaround || 1)) * 1.2 },
                    { label: "Avg Strikes", value: group.data?.avgStrikes, otherValue: group.other?.avgStrikes, suffix: "", max: 3, lowerBetter: true },
                  ];
                  return (
                    <div key={group.label} className={`p-4 rounded-xl ${group.bgColor} border ${group.borderColor} space-y-3`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GroupIcon className={`w-4 h-4 ${group.textColor}`} />
                          <span className={`text-sm font-bold ${group.textColor}`}>{group.label}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{group.data?.count || 0}</Badge>
                      </div>
                      <div className="space-y-2.5">
                        {metrics.map((m) => {
                          const val = Number(m.value || 0);
                          const other = Number(m.otherValue || 0);
                          const isBetter = m.lowerBetter ? val <= other : val >= other;
                          const pct = m.max > 0 ? Math.min(100, (val / m.max) * 100) : 0;
                          return (
                            <div key={m.label} className="flex items-center gap-2 sm:gap-3">
                              <span className="text-[11px] text-muted-foreground w-24 sm:w-28 truncate">{m.label}</span>
                              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${group.barColor} transition-all duration-700`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className={`text-xs font-mono w-12 sm:w-14 text-right font-medium flex items-center justify-end gap-0.5 ${isBetter ? "text-emerald-400" : "text-muted-foreground"}`}>
                                {isBetter && val !== other && <ArrowUpRight className="w-2.5 h-2.5" />}
                                {val.toFixed(1)}{m.suffix}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                        <span className="text-xs text-muted-foreground">Total Earnings</span>
                        <span className={`text-sm font-bold ${group.textColor}`} data-testid={`text-${group.label.includes("Elite") ? "elite" : "grinder"}-earnings`}>
                          {formatCurrency(Number(group.data?.totalEarnings || 0))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <Award className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Loading metrics...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
