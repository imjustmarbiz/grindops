import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Loader2, DollarSign, TrendingUp, Users, Package, AlertTriangle,
  CheckCircle, Clock, Activity, Crown, Zap, Shield, ArrowRight,
  BarChart3, PieChart, Gauge, Star, Target, Timer, Percent, Repeat,
} from "lucide-react";
import type { AnalyticsSummary, AuditLog, Grinder, Assignment, Order, Bid, Service } from "@shared/schema";

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
}

function formatCompact(val: number) {
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${val.toFixed(0)}`;
}

function AnimatedRing({ percent, size = 80, stroke = 8, color, label, value }: { percent: number; size?: number; stroke?: number; color: string; label: string; value: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-white/5" />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold">{value}</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}

function MiniBar({ value, max, color, label }: { value: number; max: number; color: string; label?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 w-full">
      {label && <span className="text-xs text-muted-foreground w-16 truncate">{label}</span>}
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className="text-xs font-mono w-8 text-right">{value}</span>
    </div>
  );
}

function PipelineStep({ label, count, total, color, icon: Icon, isLast }: { label: string; count: number; total: number; color: string; icon: any; isLast?: boolean }) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(0) : "0";
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className={`flex flex-col items-center p-3 rounded-xl border flex-1 ${color} transition-all hover:scale-[1.02]`} data-testid={`pipeline-${label.toLowerCase().replace(/\s+/g, "-")}`}>
        <Icon className="w-5 h-5 mb-1" />
        <span className="text-2xl font-bold">{count}</span>
        <span className="text-[10px] uppercase tracking-wider opacity-70">{label}</span>
        <span className="text-[10px] opacity-50">{pct}%</span>
      </div>
      {!isLast && <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
    </div>
  );
}

function LastUpdated({ date }: { date: Date | null }) {
  if (!date) return null;
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }).format(date);
  return (
    <span className="text-[10px] text-muted-foreground font-mono" data-testid="text-last-updated">
      Last updated {fmt}
    </span>
  );
}

export default function Dashboard() {
  const { data: analytics, isLoading, dataUpdatedAt } = useQuery<AnalyticsSummary>({ queryKey: ["/api/analytics/summary"], refetchInterval: 10000 });
  const { data: grindersList, dataUpdatedAt: grindersUpdatedAt } = useQuery<Grinder[]>({ queryKey: ["/api/grinders"], refetchInterval: 10000 });
  const { data: auditLogs, dataUpdatedAt: logsUpdatedAt } = useQuery<AuditLog[]>({ queryKey: ["/api/audit-logs?limit=15"], refetchInterval: 10000 });
  const { data: assignmentsList, dataUpdatedAt: assignmentsUpdatedAt } = useQuery<Assignment[]>({ queryKey: ["/api/assignments"], refetchInterval: 10000 });
  const { data: ordersList, dataUpdatedAt: ordersUpdatedAt } = useQuery<Order[]>({ queryKey: ["/api/orders"], refetchInterval: 10000 });
  const { data: bidsList, dataUpdatedAt: bidsUpdatedAt } = useQuery<Bid[]>({ queryKey: ["/api/bids"], refetchInterval: 10000 });
  const { data: servicesList } = useQuery<Service[]>({ queryKey: ["/api/services"], refetchInterval: 10000 });

  const latestUpdate = Math.max(dataUpdatedAt || 0, grindersUpdatedAt || 0, logsUpdatedAt || 0, assignmentsUpdatedAt || 0, ordersUpdatedAt || 0, bidsUpdatedAt || 0);
  const lastUpdatedDate = latestUpdate > 0 ? new Date(latestUpdate) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const allOrders = ordersList || [];
  const allBids = bidsList || [];
  const allAssignments = assignmentsList || [];
  const allGrinders = grindersList || [];
  const allServices = servicesList || [];

  const openOrders = allOrders.filter(o => o.status === "Open").length;
  const assignedOrders = allOrders.filter(o => o.status === "Assigned").length;
  const inProgressOrders = allOrders.filter(o => o.status === "In Progress").length;
  const completedOrders = allOrders.filter(o => o.status === "Completed").length;
  const cancelledOrders = allOrders.filter(o => o.status === "Cancelled").length;
  const totalOrders = allOrders.length;

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

  const serviceDistribution = allServices.map(s => {
    const count = allOrders.filter(o => o.serviceId === s.id).length;
    const serviceRevenue = allOrders.filter(o => o.serviceId === s.id).reduce((sum, o) => sum + Number(o.customerPrice || 0), 0);
    return { name: s.name, id: s.id, count, revenue: serviceRevenue };
  }).sort((a, b) => b.count - a.count);
  const maxServiceCount = Math.max(...serviceDistribution.map(s => s.count), 1);

  const serviceColors = ["bg-primary", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-cyan-500", "bg-pink-500"];

  const topEarners = [...allGrinders].sort((a, b) => Number(b.totalEarnings) - Number(a.totalEarnings)).slice(0, 5);
  const maxEarnings = topEarners.length > 0 ? Number(topEarners[0].totalEarnings) : 1;

  const grindersWithStrikes = allGrinders.filter(g => g.strikes > 0).sort((a, b) => b.strikes - a.strikes);
  const rushOrders = allOrders.filter(o => o.isRush && (o.status === "Open" || o.status === "Assigned" || o.status === "In Progress")).length;
  const emergencyOrders = allOrders.filter(o => o.isEmergency && (o.status === "Open" || o.status === "Assigned" || o.status === "In Progress")).length;

  const avgOrderValue = totalOrders > 0 ? allOrders.reduce((s, o) => s + Number(o.customerPrice || 0), 0) / totalOrders : 0;

  const completedAssignments = allAssignments.filter(a => a.status === "Completed");
  const onTimeCount = completedAssignments.filter(a => a.isOnTime === true).length;
  const onTimeRate = completedAssignments.length > 0 ? (onTimeCount / completedAssignments.length) * 100 : 0;

  const replacedAssignments = allAssignments.filter(a => a.wasReassigned);
  const totalOriginalGrinderPay = replacedAssignments.reduce((s, a) => s + Number(a.originalGrinderPay || 0), 0);
  const totalReplacementGrinderPay = replacedAssignments.reduce((s, a) => s + Number(a.replacementGrinderPay || 0), 0);
  const replacementRate = allAssignments.length > 0 ? (replacedAssignments.length / allAssignments.length) * 100 : 0;
  const grindersReplacedOff = [...new Set(replacedAssignments.map(a => a.originalGrinderId).filter(Boolean))];
  const grindersReplacedIn = [...new Set(replacedAssignments.map(a => a.replacementGrinderId).filter(Boolean))];

  const categoryIcon = (cat: string) => {
    if (cat === "Elite Grinder") return <Crown className="w-3 h-3 text-yellow-500" />;
    if (cat === "VC Grinder") return <Zap className="w-3 h-3 text-cyan-400" />;
    if (cat === "Event Grinder") return <Shield className="w-3 h-3 text-purple-400" />;
    return <Users className="w-3 h-3 text-primary" />;
  };

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-glow" data-testid="text-page-title">GrindOps Command Center</h1>
          <p className="text-muted-foreground mt-1">Real-time analytics and operations overview</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
          <LastUpdated date={lastUpdatedDate} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-400" data-testid="text-total-revenue">{formatCurrency(revenue)}</p>
                <p className="text-xs text-muted-foreground mt-1">{totalOrders} orders total</p>
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
                <p className="text-2xl font-bold text-blue-400" data-testid="text-grinder-payouts">{formatCurrency(payouts)}</p>
                <p className="text-xs text-muted-foreground mt-1">{allGrinders.length} grinders</p>
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
                <p className="text-2xl font-bold text-purple-400" data-testid="text-company-profit">{formatCurrency(profit)}</p>
                <p className="text-xs text-muted-foreground mt-1">{profitMarginPct.toFixed(1)}% margin</p>
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
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold text-amber-400" data-testid="text-avg-order-value">{formatCurrency(avgOrderValue)}</p>
                <p className="text-xs text-muted-foreground mt-1">avg margin {(analytics?.avgMargin || 0).toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Order Pipeline
            </CardTitle>
            <LastUpdated date={ordersUpdatedAt ? new Date(ordersUpdatedAt) : null} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1">
            <PipelineStep label="Open" count={openOrders} total={totalOrders} color="border-blue-500/30 bg-blue-500/5 text-blue-400" icon={Clock} />
            <PipelineStep label="Assigned" count={assignedOrders} total={totalOrders} color="border-amber-500/30 bg-amber-500/5 text-amber-400" icon={Target} />
            <PipelineStep label="In Progress" count={inProgressOrders} total={totalOrders} color="border-purple-500/30 bg-purple-500/5 text-purple-400" icon={Timer} />
            <PipelineStep label="Completed" count={completedOrders} total={totalOrders} color="border-emerald-500/30 bg-emerald-500/5 text-emerald-400" icon={CheckCircle} />
            <PipelineStep label="Cancelled" count={cancelledOrders} total={totalOrders} color="border-red-500/30 bg-red-500/5 text-red-400" icon={AlertTriangle} isLast />
          </div>
          {(rushOrders > 0 || emergencyOrders > 0) && (
            <div className="flex gap-3 mt-3 pt-3 border-t border-border/50">
              {rushOrders > 0 && <Badge variant="destructive" className="gap-1"><Clock className="w-3 h-3" /> {rushOrders} Rush Active</Badge>}
              {emergencyOrders > 0 && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1"><AlertTriangle className="w-3 h-3" /> {emergencyOrders} Emergency Active</Badge>}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border/50">
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

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gauge className="w-5 h-5 text-cyan-400" />
              Fleet Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-around mb-4">
              <AnimatedRing percent={fleetUtilization} color={fleetUtilization > 80 ? "#f87171" : fleetUtilization > 60 ? "#fbbf24" : "#34d399"} label="Capacity Used" value={`${fleetUtilization.toFixed(0)}%`} size={90} />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs text-muted-foreground">Available</span>
                  <span className="text-sm font-bold ml-auto">{availableGrinders}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-xs text-muted-foreground">At Capacity</span>
                  <span className="text-sm font-bold ml-auto">{atCapacity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-xs text-muted-foreground">Total Slots</span>
                  <span className="text-sm font-bold ml-auto">{totalActive}/{totalCapacity}</span>
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
                  <TooltipContent>{g.name}: {g.activeOrders}/{g.capacity} slots used ({g.category})</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
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
                  <span className="text-sm font-bold ml-auto">{pendingBids}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs text-muted-foreground">Accepted</span>
                  <span className="text-sm font-bold ml-auto">{acceptedBids}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-xs text-muted-foreground">Rejected</span>
                  <span className="text-sm font-bold ml-auto">{rejectedBids}</span>
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
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
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
                      <div className="flex items-center gap-2 mb-1">
                        {categoryIcon(g.category)}
                        <span className="font-medium text-sm truncate">{g.name}</span>
                        <Badge variant="outline" className="text-[10px] h-4">{g.tier}</Badge>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-700" style={{ width: `${maxEarnings > 0 ? (earnings / maxEarnings) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-emerald-400 text-sm">{formatCurrency(earnings)}</p>
                      <p className="text-[10px] text-muted-foreground">{g.completedOrders} done &middot; {g.totalOrders} total</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Recent Activity
              </CardTitle>
              <LastUpdated date={logsUpdatedAt ? new Date(logsUpdatedAt) : null} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
              {(!auditLogs || auditLogs.length === 0) && <p className="text-muted-foreground text-sm">No activity yet</p>}
              {(auditLogs || []).slice(0, 12).map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors" data-testid={`card-audit-${log.id}`}>
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    log.action.includes("created") || log.action.includes("accepted") ? "bg-emerald-400" :
                    log.action.includes("rejected") || log.action.includes("denied") ? "bg-red-400" :
                    log.action.includes("updated") || log.action.includes("changed") || log.action.includes("price") ? "bg-blue-400" :
                    log.action.includes("deleted") ? "bg-red-400" :
                    "bg-muted-foreground"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      <span className="font-medium capitalize">{log.entityType}</span>{" "}
                      <span className="text-muted-foreground">{log.entityId}</span>{" "}
                      <span className="text-primary">{log.action.replace(/_/g, " ")}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {log.actor} &middot; {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Risk & Alerts
              </CardTitle>
              <LastUpdated date={grindersUpdatedAt ? new Date(grindersUpdatedAt) : null} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-lg bg-white/5 text-center">
                  <p className="text-lg font-bold text-amber-400">{grindersWithStrikes.length}</p>
                  <p className="text-[10px] text-muted-foreground">With Strikes</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 text-center">
                  <p className="text-lg font-bold text-red-400">{allGrinders.filter(g => g.strikes >= 3).length}</p>
                  <p className="text-[10px] text-muted-foreground">Max Strikes</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 text-center">
                  <p className="text-lg font-bold text-blue-400">{allAssignments.filter(a => a.wasReassigned).length}</p>
                  <p className="text-[10px] text-muted-foreground">Reassigned</p>
                </div>
              </div>

              {grindersWithStrikes.length === 0 ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-400">All grinders in good standing</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {grindersWithStrikes.slice(0, 4).map((g) => (
                    <div key={g.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5" data-testid={`card-risk-${g.id}`}>
                      <div className="flex items-center gap-2">
                        {categoryIcon(g.category)}
                        <span className="text-sm font-medium">{g.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < g.strikes ? "bg-red-500" : "bg-white/10"}`} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {atCapacity > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <Gauge className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-amber-400">{atCapacity} grinder{atCapacity > 1 ? "s" : ""} at maximum capacity</span>
                </div>
              )}

              {openOrders > 5 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <Package className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-400">{openOrders} orders waiting for assignment</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {replacedAssignments.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Repeat className="w-5 h-5 text-amber-400" />
                Replacement Tracker
              </CardTitle>
              <LastUpdated date={assignmentsUpdatedAt ? new Date(assignmentsUpdatedAt) : null} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-white/5 text-center">
                <p className="text-xl font-bold text-amber-400" data-testid="text-replacement-count">{replacedAssignments.length}</p>
                <p className="text-[10px] text-muted-foreground">Total Replacements</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 text-center">
                <p className="text-xl font-bold text-red-400">{formatCurrency(totalOriginalGrinderPay)}</p>
                <p className="text-[10px] text-muted-foreground">Paid to Originals</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 text-center">
                <p className="text-xl font-bold text-blue-400">{formatCurrency(totalReplacementGrinderPay)}</p>
                <p className="text-[10px] text-muted-foreground">Paid to Replacements</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 text-center">
                <p className="text-xl font-bold text-amber-400">{grindersReplacedOff.length}</p>
                <p className="text-[10px] text-muted-foreground">Grinders Removed</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 text-center">
                <p className="text-xl font-bold">{replacementRate.toFixed(1)}%</p>
                <p className="text-[10px] text-muted-foreground">Replacement Rate</p>
              </div>
            </div>
            <div className="space-y-2">
              {replacedAssignments.slice(0, 5).map(a => {
                const orig = allGrinders.find(g => g.id === a.originalGrinderId);
                const repl = allGrinders.find(g => g.id === a.replacementGrinderId);
                const order = allOrders.find(o => o.id === a.orderId);
                return (
                  <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5" data-testid={`row-replacement-${a.id}`}>
                    <div className="flex items-center gap-1.5 text-sm flex-1">
                      <span className="text-red-400 font-medium">{orig?.name || "Unknown"}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="text-blue-400 font-medium">{repl?.name || "Unknown"}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{order?.mgtOrderNumber ? `#${order.mgtOrderNumber}` : ""}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-red-400">${a.originalGrinderPay || "0"}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-blue-400">${a.replacementGrinderPay || "0"}</span>
                    </div>
                    {a.replacementReason && (
                      <Badge variant="outline" className="text-[10px] border-border/50 max-w-[120px] truncate">
                        {a.replacementReason}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </TooltipProvider>
  );
}
