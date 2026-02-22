import { useAuth } from "@/hooks/use-auth";
import { useStaffData } from "@/hooks/use-staff-data";
import { formatCurrency, formatCompact, AnimatedRing, MiniBar, LastUpdated, categoryIcon } from "@/lib/staff-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DollarSign, TrendingUp, Users, PieChart, Gauge, Percent, Crown, BarChart3, Award } from "lucide-react";

export default function StaffAnalytics() {
  const { user } = useAuth();
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

  const completedAssignments = allAssignments.filter(a => a.status === "Completed");
  const onTimeCount = completedAssignments.filter(a => a.isOnTime === true).length;
  const onTimeRate = completedAssignments.length > 0 ? (onTimeCount / completedAssignments.length) * 100 : 0;

  const serviceDistribution = allServices.map(s => {
    const count = allOrders.filter(o => o.serviceId === s.id).length;
    const serviceRevenue = allOrders.filter(o => o.serviceId === s.id).reduce((sum, o) => sum + Number(o.customerPrice || 0), 0);
    return { name: s.name, id: s.id, count, revenue: serviceRevenue };
  }).sort((a, b) => b.count - a.count);
  const maxServiceCount = Math.max(...serviceDistribution.map(s => s.count), 1);
  const serviceColors = ["bg-primary", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-cyan-500", "bg-pink-500"];

  const topEarners = [...allGrinders].sort((a, b) => Number(b.totalEarnings) - Number(a.totalEarnings)).slice(0, 5);
  const maxEarnings = topEarners.length > 0 ? Number(topEarners[0].totalEarnings) : 1;

  const latestUpdate = Math.max(analyticsUpdatedAt || 0, grindersUpdatedAt || 0, assignmentsUpdatedAt || 0, ordersUpdatedAt || 0, bidsUpdatedAt || 0);
  const lastUpdatedDate = latestUpdate > 0 ? new Date(latestUpdate) : null;

  return (
    <TooltipProvider>
      <div className="space-y-4 sm:space-y-6" data-testid="staff-analytics-page">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-3xl font-display font-bold text-glow" data-testid="text-analytics-title">
              Analytics
            </h1>
            <p className="text-muted-foreground mt-1">Revenue, fleet, and performance metrics</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
            <LastUpdated date={lastUpdatedDate} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-border/50" data-testid="card-revenue-split">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-400" />
                Revenue Split
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-around">
                <AnimatedRing percent={revenue > 0 ? (payouts / revenue) * 100 : 0} color="#60a5fa" label="Grinder Pay" value={formatCompact(payouts)} />
                <AnimatedRing percent={profitMarginPct} color="#a78bfa" label="Company Profit" value={formatCompact(profit)} />
                <AnimatedRing percent={100} color="#34d399" label="Total Revenue" value={formatCompact(revenue)} size={90} />
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Grinder Share</span>
                  <span className="text-blue-400 font-medium">{revenue > 0 ? ((payouts / revenue) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="h-3 rounded-full bg-white/5 overflow-hidden flex">
                  <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${revenue > 0 ? (payouts / revenue) * 100 : 0}%` }} />
                  <div className="h-full bg-purple-500 transition-all duration-700" style={{ width: `${profitMarginPct}%` }} />
                </div>
                <div className="flex justify-between text-xs">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Payouts</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /> Profit</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50" data-testid="card-fleet-utilization">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Gauge className="w-5 h-5 text-cyan-400" />
                Fleet Utilization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-around mb-4">
                <AnimatedRing percent={fleetUtilization} color={fleetUtilization > 80 ? "#f87171" : fleetUtilization > 60 ? "#fbbf24" : "#34d399"} label="Limit Used" value={`${fleetUtilization.toFixed(0)}%`} size={90} />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-muted-foreground">Available</span>
                    <span className="text-sm font-bold ml-auto" data-testid="text-available-grinders">{availableGrinders}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-xs text-muted-foreground">At Limit</span>
                    <span className="text-sm font-bold ml-auto" data-testid="text-at-capacity">{atCapacity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-xs text-muted-foreground">Total Slots</span>
                    <span className="text-sm font-bold ml-auto" data-testid="text-total-slots">{totalActive}/{totalCapacity}</span>
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

          <Card className="border-border/50" data-testid="card-bid-conversion">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Percent className="w-5 h-5 text-amber-400" />
                  Bid Conversion
                </CardTitle>
                <LastUpdated date={bidsUpdatedAt ? new Date(bidsUpdatedAt) : null} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-around mb-4">
                <AnimatedRing percent={bidConversionRate} color="#34d399" label="Win Rate" value={`${bidConversionRate.toFixed(0)}%`} size={90} />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-xs text-muted-foreground">Pending</span>
                    <span className="text-sm font-bold ml-auto" data-testid="text-pending-bids">{pendingBids}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-muted-foreground">Accepted</span>
                    <span className="text-sm font-bold ml-auto" data-testid="text-accepted-bids">{acceptedBids}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-xs text-muted-foreground">Rejected</span>
                    <span className="text-sm font-bold ml-auto" data-testid="text-rejected-bids">{rejectedBids}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Total Bids: {totalBids}</span>
                  <span>On-Time: {onTimeRate.toFixed(0)}%</span>
                </div>
                <div className="h-3 rounded-full bg-white/5 overflow-hidden flex">
                  {totalBids > 0 && (
                    <>
                      <div className="h-full bg-emerald-500" style={{ width: `${(acceptedBids / totalBids) * 100}%` }} />
                      <div className="h-full bg-red-500" style={{ width: `${(rejectedBids / totalBids) * 100}%` }} />
                      <div className="h-full bg-blue-500" style={{ width: `${(pendingBids / totalBids) * 100}%` }} />
                    </>
                  )}
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-emerald-400">Accepted</span>
                  <span className="text-red-400">Rejected</span>
                  <span className="text-blue-400">Pending</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/50" data-testid="card-top-earners">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  Top Earners
                </CardTitle>
                <LastUpdated date={grindersUpdatedAt ? new Date(grindersUpdatedAt) : null} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topEarners.length === 0 && <p className="text-muted-foreground text-sm">No grinder data yet</p>}
                {topEarners.map((g, i) => {
                  const earnings = Number(g.totalEarnings);
                  return (
                    <div key={g.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors" data-testid={`card-top-earner-${i}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${i === 0 ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30" : i === 1 ? "bg-gray-400/20 text-gray-300" : i === 2 ? "bg-orange-500/20 text-orange-400" : "bg-white/10 text-muted-foreground"}`}>
                        #{i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {categoryIcon(g.category)}
                          <span className="font-medium text-sm truncate">{g.name}</span>
                          <Badge variant="outline" className="text-[10px] h-4">{g.tier}</Badge>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-700" style={{ width: `${maxEarnings > 0 ? (earnings / maxEarnings) * 100 : 0}%` }} />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-emerald-400 text-sm" data-testid={`text-earnings-${i}`}>{formatCurrency(earnings)}</p>
                        <p className="text-[10px] text-muted-foreground">{g.completedOrders} done &middot; {g.totalOrders} total</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50" data-testid="card-service-distribution">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Service Distribution
                </CardTitle>
                <LastUpdated date={ordersUpdatedAt ? new Date(ordersUpdatedAt) : null} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {serviceDistribution.length === 0 && <p className="text-muted-foreground text-sm">No order data yet</p>}
                {serviceDistribution.map((s, i) => (
                  <div key={s.id} className="space-y-1" data-testid={`service-dist-${s.id}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{s.count} orders</span>
                        <span className="text-xs font-medium text-emerald-400">{formatCurrency(s.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${serviceColors[i % serviceColors.length]}`} style={{ width: `${(s.count / maxServiceCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-purple-500/5 to-amber-500/5 border-purple-500/20" data-testid="card-elite-vs-grinder">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              Elite vs Grinder Performance Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eliteVsGrinderMetrics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-amber-400">Elite Grinders</span>
                    <Badge variant="outline" className="ml-auto text-[10px]">{eliteVsGrinderMetrics.elite?.count || 0}</Badge>
                  </div>
                  {[
                    { label: "Avg Win Rate", value: eliteVsGrinderMetrics.elite?.avgWinRate, otherValue: eliteVsGrinderMetrics.grinders?.avgWinRate, suffix: "%" },
                    { label: "Avg Quality", value: eliteVsGrinderMetrics.elite?.avgQuality, otherValue: eliteVsGrinderMetrics.grinders?.avgQuality, suffix: "%" },
                    { label: "Avg On-Time", value: eliteVsGrinderMetrics.elite?.avgOnTime, otherValue: eliteVsGrinderMetrics.grinders?.avgOnTime, suffix: "%" },
                    { label: "Avg Completion", value: eliteVsGrinderMetrics.elite?.avgCompletion, otherValue: eliteVsGrinderMetrics.grinders?.avgCompletion, suffix: "%" },
                    { label: "Avg Turnaround", value: eliteVsGrinderMetrics.elite?.avgTurnaround, otherValue: eliteVsGrinderMetrics.grinders?.avgTurnaround, suffix: "h" },
                    { label: "Avg Strikes", value: eliteVsGrinderMetrics.elite?.avgStrikes, otherValue: eliteVsGrinderMetrics.grinders?.avgStrikes, suffix: "", lowerBetter: true },
                  ].map((metric) => {
                    const val = Number(metric.value || 0);
                    const other = Number(metric.otherValue || 0);
                    const isBetter = metric.lowerBetter ? val <= other : val >= other;
                    return (
                      <div key={metric.label} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-28 truncate">{metric.label}</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-amber-500 transition-all duration-700" style={{ width: `${Math.min(100, val)}%` }} />
                        </div>
                        <span className={`text-xs font-mono w-14 text-right ${isBetter ? "text-emerald-400" : "text-muted-foreground"}`}>
                          {val.toFixed(1)}{metric.suffix}
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">Total Earnings</span>
                    <span className="text-sm font-bold text-amber-400" data-testid="text-elite-earnings">{formatCurrency(Number(eliteVsGrinderMetrics.elite?.totalEarnings || 0))}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-bold text-blue-400">Regular Grinders</span>
                    <Badge variant="outline" className="ml-auto text-[10px]">{eliteVsGrinderMetrics.grinders?.count || 0}</Badge>
                  </div>
                  {[
                    { label: "Avg Win Rate", value: eliteVsGrinderMetrics.grinders?.avgWinRate, otherValue: eliteVsGrinderMetrics.elite?.avgWinRate, suffix: "%" },
                    { label: "Avg Quality", value: eliteVsGrinderMetrics.grinders?.avgQuality, otherValue: eliteVsGrinderMetrics.elite?.avgQuality, suffix: "%" },
                    { label: "Avg On-Time", value: eliteVsGrinderMetrics.grinders?.avgOnTime, otherValue: eliteVsGrinderMetrics.elite?.avgOnTime, suffix: "%" },
                    { label: "Avg Completion", value: eliteVsGrinderMetrics.grinders?.avgCompletion, otherValue: eliteVsGrinderMetrics.elite?.avgCompletion, suffix: "%" },
                    { label: "Avg Turnaround", value: eliteVsGrinderMetrics.grinders?.avgTurnaround, otherValue: eliteVsGrinderMetrics.elite?.avgTurnaround, suffix: "h" },
                    { label: "Avg Strikes", value: eliteVsGrinderMetrics.grinders?.avgStrikes, otherValue: eliteVsGrinderMetrics.elite?.avgStrikes, suffix: "", lowerBetter: true },
                  ].map((metric) => {
                    const val = Number(metric.value || 0);
                    const other = Number(metric.otherValue || 0);
                    const isBetter = metric.lowerBetter ? val <= other : val >= other;
                    return (
                      <div key={metric.label} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-28 truncate">{metric.label}</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-blue-500 transition-all duration-700" style={{ width: `${Math.min(100, val)}%` }} />
                        </div>
                        <span className={`text-xs font-mono w-14 text-right ${isBetter ? "text-emerald-400" : "text-muted-foreground"}`}>
                          {val.toFixed(1)}{metric.suffix}
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">Total Earnings</span>
                    <span className="text-sm font-bold text-blue-400" data-testid="text-grinder-earnings">{formatCurrency(Number(eliteVsGrinderMetrics.grinders?.totalEarnings || 0))}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Loading metrics...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
