import { useState, useMemo } from "react";
import { useStaffData } from "@/hooks/use-staff-data";
import { formatCurrency } from "@/lib/staff-utils";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import spLogo from "@assets/image_1771930905137.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DollarSign, TrendingUp, Percent, Users, BarChart3, PieChart,
  ArrowUpRight, ArrowDownRight, Minus, CalendarRange, Filter, Loader2,
  Wallet, Target, Package, Gamepad2, Monitor
} from "lucide-react";
import type { Order, Assignment, Grinder, Service } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

type DateRange = "all" | "today" | "7d" | "14d" | "30d" | "90d" | "this_month" | "last_month" | "this_year";

function getDateRange(range: DateRange): { start: Date | null; end: Date } {
  const now = new Date();
  const end = new Date(now);
  switch (range) {
    case "today": return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()), end };
    case "7d": return { start: new Date(now.getTime() - 7 * 86400000), end };
    case "14d": return { start: new Date(now.getTime() - 14 * 86400000), end };
    case "30d": return { start: new Date(now.getTime() - 30 * 86400000), end };
    case "90d": return { start: new Date(now.getTime() - 90 * 86400000), end };
    case "this_month": return { start: new Date(now.getFullYear(), now.getMonth(), 1), end };
    case "last_month": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start: s, end: e };
    }
    case "this_year": return { start: new Date(now.getFullYear(), 0, 1), end };
    default: return { start: null, end };
  }
}

function isInRange(date: string | Date | null | undefined, range: { start: Date | null; end: Date }): boolean {
  if (!date) return false;
  const d = new Date(date);
  if (range.start && d < range.start) return false;
  if (d > range.end) return false;
  return true;
}

function ProgressBar({ value, max, color, className }: { value: number; max: number; color: string; className?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className={`w-full h-2 bg-white/5 rounded-full overflow-hidden ${className || ""}`}>
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function ChangeIndicator({ current, previous, format = "currency" }: { current: number; previous: number; format?: "currency" | "percent" | "number" }) {
  if (previous === 0 && current === 0) return <span className="text-[10px] text-muted-foreground">—</span>;
  const change = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;
  const isUp = change > 0;
  const isFlat = change === 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${isFlat ? "text-muted-foreground" : isUp ? "text-emerald-400" : "text-red-400"}`}>
      {isFlat ? <Minus className="w-3 h-3" /> : isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(change).toFixed(1)}%
    </span>
  );
}

function KpiCard({ title, value, subtitle, icon: Icon, iconColor, trend }: {
  title: string; value: string; subtitle?: string; icon: any; iconColor: string; trend?: { current: number; previous: number };
}) {
  return (
    <Card className="bg-card/50 border-border/30" data-testid={`kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="text-xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
            {trend && <ChangeIndicator current={trend.current} previous={trend.previous} />}
          </div>
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${iconColor}`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function normalizePlatform(platform: string | null | undefined): string {
  if (!platform) return "Unknown";
  const lower = platform.toLowerCase().trim();
  if (lower.includes("ps") || lower.includes("playstation")) return "PlayStation";
  if (lower.includes("xbox")) return "Xbox";
  if (lower.includes("pc")) return "PC";
  if (lower.includes("switch") || lower.includes("nintendo")) return "Nintendo";
  return platform;
}

export default function BusinessPerformance() {
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");

  const {
    analytics,
    orders: allOrders,
    assignments: allAssignments,
    grinders: allGrinders,
    services: allServices,
    payoutReqs,
  } = useStaffData();

  const { data: allPayouts } = useQuery<any[]>({ queryKey: ["/api/staff/payout-requests"] });

  const range = useMemo(() => getDateRange(dateRange), [dateRange]);

  const filteredOrders = useMemo(() => {
    let orders = allOrders.filter(o => isInRange(o.createdAt, range));
    if (serviceFilter !== "all") orders = orders.filter(o => o.serviceId === serviceFilter);
    return orders;
  }, [allOrders, range, serviceFilter]);

  const filteredAssignments = useMemo(() => {
    const orderIds = new Set(filteredOrders.map(o => o.id));
    return allAssignments.filter(a => orderIds.has(a.orderId));
  }, [allAssignments, filteredOrders]);

  const totalRevenue = filteredOrders.reduce((s, o) => s + parseFloat(o.customerPrice || "0"), 0);
  const totalGrinderCost = filteredAssignments.reduce((s, a) => s + parseFloat(a.grinderEarnings || "0"), 0);
  const totalCompanyProfit = filteredAssignments.reduce((s, a) => s + parseFloat(a.companyProfit || "0"), 0);
  const avgMarginPct = filteredAssignments.length > 0
    ? filteredAssignments.reduce((s, a) => s + parseFloat(a.marginPct || "0"), 0) / filteredAssignments.length : 0;
  const completedOrders = filteredOrders.filter(o => o.status === "Completed" || o.status === "Paid Out").length;
  const completionRate = filteredOrders.length > 0 ? (completedOrders / filteredOrders.length) * 100 : 0;
  const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
  const avgGrinderPay = filteredAssignments.length > 0 ? totalGrinderCost / filteredAssignments.length : 0;
  const costToRevenueRatio = totalRevenue > 0 ? (totalGrinderCost / totalRevenue) * 100 : 0;

  const paidPayouts = (allPayouts || []).filter((p: any) => p.status === "Paid" && isInRange(p.paidAt || p.createdAt, range));
  const totalPaidOut = paidPayouts.reduce((s: number, p: any) => s + parseFloat(p.amount || "0"), 0);
  const pendingPayouts = (allPayouts || []).filter((p: any) => p.status === "Pending" || p.status === "Approved");
  const totalPending = pendingPayouts.reduce((s: number, p: any) => s + parseFloat(p.amount || "0"), 0);

  const previousRange = useMemo(() => {
    if (!range.start) return null;
    const duration = range.end.getTime() - range.start.getTime();
    return { start: new Date(range.start.getTime() - duration), end: new Date(range.start.getTime() - 1) };
  }, [range]);

  const prevOrders = useMemo(() => {
    if (!previousRange) return [];
    let orders = allOrders.filter(o => isInRange(o.createdAt, previousRange));
    if (serviceFilter !== "all") orders = orders.filter(o => o.serviceId === serviceFilter);
    return orders;
  }, [allOrders, previousRange, serviceFilter]);

  const prevAssignments = useMemo(() => {
    if (!previousRange) return [];
    const orderIds = new Set(prevOrders.map(o => o.id));
    return allAssignments.filter(a => orderIds.has(a.orderId));
  }, [allAssignments, previousRange, prevOrders]);

  const prevRevenue = prevOrders.reduce((s, o) => s + parseFloat(o.customerPrice || "0"), 0);
  const prevProfit = prevAssignments.reduce((s, a) => s + parseFloat(a.companyProfit || "0"), 0);
  const prevGrinderCost = prevAssignments.reduce((s, a) => s + parseFloat(a.grinderEarnings || "0"), 0);

  const serviceBreakdown = useMemo(() => {
    return allServices.map(s => {
      const sOrders = filteredOrders.filter(o => o.serviceId === s.id);
      const sAssigns = filteredAssignments.filter(a => {
        const order = filteredOrders.find(o => o.id === a.orderId);
        return order?.serviceId === s.id;
      });
      const revenue = sOrders.reduce((sum, o) => sum + parseFloat(o.customerPrice || "0"), 0);
      const grinderCost = sAssigns.reduce((sum, a) => sum + parseFloat(a.grinderEarnings || "0"), 0);
      const profit = sAssigns.reduce((sum, a) => sum + parseFloat(a.companyProfit || "0"), 0);
      const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;
      const completed = sOrders.filter(o => o.status === "Completed" || o.status === "Paid Out").length;
      return {
        service: s,
        orderCount: sOrders.length,
        revenue,
        grinderCost,
        profit,
        marginPct,
        completedCount: completed,
        completionRate: sOrders.length > 0 ? (completed / sOrders.length) * 100 : 0,
        avgOrderValue: sOrders.length > 0 ? revenue / sOrders.length : 0,
      };
    }).filter(s => s.orderCount > 0).sort((a, b) => b.revenue - a.revenue);
  }, [allServices, filteredOrders, filteredAssignments]);

  const maxServiceRevenue = Math.max(...serviceBreakdown.map(s => s.revenue), 1);

  const grinderPerformance = useMemo(() => {
    return allGrinders.map(g => {
      const gAssigns = filteredAssignments.filter(a => a.grinderId === g.id);
      const totalEarnings = gAssigns.reduce((s, a) => s + parseFloat(a.grinderEarnings || "0"), 0);
      const totalProfit = gAssigns.reduce((s, a) => s + parseFloat(a.companyProfit || "0"), 0);
      const completedCount = gAssigns.filter(a => a.status === "Completed").length;
      const orderRevenue = gAssigns.reduce((s, a) => s + parseFloat(a.orderPrice || "0"), 0);
      const avgMargin = gAssigns.length > 0 ? gAssigns.reduce((s, a) => s + parseFloat(a.marginPct || "0"), 0) / gAssigns.length : 0;

      const serviceMap: Record<string, { count: number; earnings: number }> = {};
      gAssigns.forEach(a => {
        const order = filteredOrders.find(o => o.id === a.orderId);
        const sId = order?.serviceId || "unknown";
        if (!serviceMap[sId]) serviceMap[sId] = { count: 0, earnings: 0 };
        serviceMap[sId].count += 1;
        serviceMap[sId].earnings += parseFloat(a.grinderEarnings || "0");
      });

      return {
        grinder: g,
        assignmentCount: gAssigns.length,
        totalEarnings,
        totalProfit,
        completedCount,
        orderRevenue,
        avgMargin,
        costPerOrder: gAssigns.length > 0 ? totalEarnings / gAssigns.length : 0,
        serviceBreakdown: serviceMap,
      };
    }).filter(g => g.assignmentCount > 0).sort((a, b) => b.totalEarnings - a.totalEarnings);
  }, [allGrinders, filteredAssignments, filteredOrders]);

  const maxGrinderEarnings = Math.max(...grinderPerformance.map(g => g.totalEarnings), 1);

  const platformBreakdown = useMemo(() => {
    const platforms: Record<string, { orders: number; revenue: number; grinderCost: number; profit: number; completed: number }> = {};
    filteredOrders.forEach(o => {
      const p = normalizePlatform(o.platform);
      if (!platforms[p]) platforms[p] = { orders: 0, revenue: 0, grinderCost: 0, profit: 0, completed: 0 };
      platforms[p].orders += 1;
      platforms[p].revenue += parseFloat(o.customerPrice || "0");
      if (o.status === "Completed" || o.status === "Paid Out") platforms[p].completed += 1;
    });
    filteredAssignments.forEach(a => {
      const order = filteredOrders.find(o => o.id === a.orderId);
      const p = normalizePlatform(order?.platform);
      if (platforms[p]) {
        platforms[p].grinderCost += parseFloat(a.grinderEarnings || "0");
        platforms[p].profit += parseFloat(a.companyProfit || "0");
      }
    });
    return Object.entries(platforms).sort((a, b) => b[1].revenue - a[1].revenue);
  }, [filteredOrders, filteredAssignments]);

  const monthlyTrend = useMemo(() => {
    const months: Record<string, { revenue: number; cost: number; profit: number; orders: number }> = {};
    allOrders.forEach(o => {
      if (!o.createdAt) return;
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { revenue: 0, cost: 0, profit: 0, orders: 0 };
      months[key].revenue += parseFloat(o.customerPrice || "0");
      months[key].orders += 1;
      const orderAssignments = allAssignments.filter(a => a.orderId === o.id);
      orderAssignments.forEach(a => {
        months[key].cost += parseFloat(a.grinderEarnings || "0");
        months[key].profit += parseFloat(a.companyProfit || "0");
      });
    });
    return Object.entries(months).sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
  }, [allOrders, allAssignments]);

  const maxMonthlyRevenue = Math.max(...monthlyTrend.map(([, d]) => Math.max(d.revenue, d.cost)), 1);

  const dateRangeLabel: Record<DateRange, string> = {
    all: "All Time", today: "Today", "7d": "Last 7 Days", "14d": "Last 14 Days",
    "30d": "Last 30 Days", "90d": "Last 90 Days", this_month: "This Month",
    last_month: "Last Month", this_year: "This Year",
  };

  if (allServices.length === 0) {
    return (
      <AnimatedPage>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AnimatedPage>
    );
  }

  return (
    <TooltipProvider>
      <AnimatedPage className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto" data-testid="business-performance-page">
        <FadeInUp delay={0}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={spLogo} alt="SP" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight" data-testid="text-business-title">Business Performance</h1>
                <p className="text-sm text-muted-foreground">Financial analytics, margins, and cost analysis</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2" data-testid="filter-controls">
              <div className="flex items-center gap-1.5">
                <CalendarRange className="w-4 h-4 text-muted-foreground" />
                <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
                  <SelectTrigger className="w-[140px] text-xs" data-testid="select-date-range">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(dateRangeLabel).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={serviceFilter} onValueChange={setServiceFilter}>
                  <SelectTrigger className="w-[160px] text-xs" data-testid="select-service-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {allServices.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </FadeInUp>

        <FadeInUp delay={0.03}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard title="Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} iconColor="bg-emerald-500/20 text-emerald-400"
              subtitle={`${filteredOrders.length} orders`}
              trend={previousRange ? { current: totalRevenue, previous: prevRevenue } : undefined} />
            <KpiCard title="Grinder Costs" value={formatCurrency(totalGrinderCost)} icon={Users} iconColor="bg-blue-500/20 text-blue-400"
              subtitle={`${filteredAssignments.length} assignments`}
              trend={previousRange ? { current: totalGrinderCost, previous: prevGrinderCost } : undefined} />
            <KpiCard title="Net Profit" value={formatCurrency(totalCompanyProfit)} icon={TrendingUp} iconColor="bg-purple-500/20 text-purple-400"
              subtitle={`${avgMarginPct.toFixed(1)}% avg margin`}
              trend={previousRange ? { current: totalCompanyProfit, previous: prevProfit } : undefined} />
            <KpiCard title="Cost Ratio" value={`${costToRevenueRatio.toFixed(1)}%`} icon={Percent} iconColor="bg-amber-500/20 text-amber-400"
              subtitle="Grinder cost / Revenue" />
            <KpiCard title="Avg Order Value" value={formatCurrency(avgOrderValue)} icon={Target} iconColor="bg-cyan-500/20 text-cyan-400"
              subtitle={`Avg pay: ${formatCurrency(avgGrinderPay)}`} />
            <KpiCard title="Paid Out" value={formatCurrency(totalPaidOut)} icon={Wallet} iconColor="bg-pink-500/20 text-pink-400"
              subtitle={totalPending > 0 ? `${formatCurrency(totalPending)} pending` : "No pending"} />
          </div>
        </FadeInUp>

        <FadeInUp delay={0.06}>
          <Card className="bg-card/50 border-border/30" data-testid="card-revenue-vs-cost">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Revenue vs Grinder Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl p-4 border border-emerald-500/20 bg-emerald-500/5">
                  <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalRevenue)}</p>
                  <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }} />
                  </div>
                </div>
                <div className="rounded-xl p-4 border border-blue-500/20 bg-blue-500/5">
                  <p className="text-xs text-muted-foreground mb-1">Grinder Costs</p>
                  <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalGrinderCost)}</p>
                  <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${totalRevenue > 0 ? (totalGrinderCost / totalRevenue) * 100 : 0}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{costToRevenueRatio.toFixed(1)}% of revenue</p>
                </div>
                <div className="rounded-xl p-4 border border-purple-500/20 bg-purple-500/5">
                  <p className="text-xs text-muted-foreground mb-1">Net Profit</p>
                  <p className={`text-2xl font-bold ${totalCompanyProfit >= 0 ? "text-purple-400" : "text-red-400"}`}>{formatCurrency(totalCompanyProfit)}</p>
                  <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${totalCompanyProfit >= 0 ? "bg-purple-500" : "bg-red-500"}`}
                      style={{ width: `${totalRevenue > 0 ? Math.abs(totalCompanyProfit / totalRevenue) * 100 : 0}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{totalRevenue > 0 ? ((totalCompanyProfit / totalRevenue) * 100).toFixed(1) : 0}% margin</p>
                </div>
              </div>

              {totalRevenue > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Revenue Distribution</p>
                  <div className="w-full h-5 rounded-full overflow-hidden flex bg-white/5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${costToRevenueRatio}%` }} />
                      </TooltipTrigger>
                      <TooltipContent><p>Grinder Costs: {formatCurrency(totalGrinderCost)} ({costToRevenueRatio.toFixed(1)}%)</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`h-full transition-all duration-700 ${totalCompanyProfit >= 0 ? "bg-purple-500" : "bg-red-500"}`}
                          style={{ width: `${totalRevenue > 0 ? Math.abs(totalCompanyProfit / totalRevenue) * 100 : 0}%` }} />
                      </TooltipTrigger>
                      <TooltipContent><p>Net Profit: {formatCurrency(totalCompanyProfit)} ({((totalCompanyProfit / totalRevenue) * 100).toFixed(1)}%)</p></TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex gap-4 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Grinder Costs</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /> Company Profit</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeInUp>

        {monthlyTrend.length > 1 && (
          <FadeInUp delay={0.09}>
            <Card className="bg-card/50 border-border/30" data-testid="card-monthly-trend">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Monthly Revenue & Cost Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {monthlyTrend.map(([month, data]) => {
                    const label = new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                    const profitPct = data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0;
                    return (
                      <div key={month} className="group" data-testid={`row-month-${month}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-14 font-mono">{label}</span>
                          <div className="flex-1 space-y-0.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500/70 rounded-full transition-all duration-700" style={{ width: `${(data.revenue / maxMonthlyRevenue) * 100}%` }} />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent><p>Revenue: {formatCurrency(data.revenue)}</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500/70 rounded-full transition-all duration-700" style={{ width: `${(data.cost / maxMonthlyRevenue) * 100}%` }} />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent><p>Grinder Cost: {formatCurrency(data.cost)}</p></TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="text-right w-20">
                            <p className="text-xs font-medium">{formatCurrency(data.revenue)}</p>
                            <p className={`text-[10px] ${data.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {data.profit >= 0 ? "+" : ""}{formatCurrency(data.profit)}
                            </p>
                          </div>
                          <div className="w-10 text-right">
                            <span className={`text-[10px] font-medium ${profitPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {profitPct.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4 text-[10px] text-muted-foreground mt-3 pt-2 border-t border-border/20">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Revenue</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Grinder Cost</span>
                </div>
              </CardContent>
            </Card>
          </FadeInUp>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FadeInUp delay={0.12}>
            <Card className="bg-card/50 border-border/30 h-full" data-testid="card-service-revenue">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Revenue by Service
                  <Badge variant="secondary" className="text-[10px]">{serviceBreakdown.length} active</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {serviceBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No data for selected period</p>
                ) : serviceBreakdown.map(s => (
                  <div key={s.service.id} className="space-y-1.5" data-testid={`row-service-${s.service.id}`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium truncate max-w-[200px]">{s.service.name}</span>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span>{s.orderCount} orders</span>
                        <span className="font-medium text-foreground">{formatCurrency(s.revenue)}</span>
                      </div>
                    </div>
                    <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden flex">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="h-full bg-blue-500 transition-all duration-700"
                            style={{ width: `${(s.grinderCost / (maxServiceRevenue || 1)) * 100}%` }} />
                        </TooltipTrigger>
                        <TooltipContent><p>Grinder Cost: {formatCurrency(s.grinderCost)}</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={`h-full transition-all duration-700 ${s.profit >= 0 ? "bg-emerald-500" : "bg-red-500"}`}
                            style={{ width: `${(Math.abs(s.profit) / (maxServiceRevenue || 1)) * 100}%` }} />
                        </TooltipTrigger>
                        <TooltipContent><p>Profit: {formatCurrency(s.profit)} ({s.marginPct.toFixed(1)}%)</p></TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      <span>Avg: {formatCurrency(s.avgOrderValue)}</span>
                      <span>Cost: {formatCurrency(s.grinderCost)}</span>
                      <span className={s.profit >= 0 ? "text-emerald-400" : "text-red-400"}>
                        Margin: {s.marginPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </FadeInUp>

          <FadeInUp delay={0.12}>
            <Card className="bg-card/50 border-border/30 h-full" data-testid="card-platform-financials">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-primary" />
                  Platform Financial Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {platformBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No data for selected period</p>
                ) : platformBreakdown.map(([platform, stats]) => {
                  const margin = stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0;
                  return (
                    <div key={platform} className="rounded-xl p-3 border border-border/20 bg-white/[0.02]" data-testid={`row-platform-${platform.toLowerCase()}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {platform === "PlayStation" ? <Gamepad2 className="w-4 h-4 text-blue-400" /> :
                           platform === "Xbox" ? <Monitor className="w-4 h-4 text-green-400" /> :
                           <Package className="w-4 h-4 text-muted-foreground" />}
                          <span className="text-sm font-medium">{platform}</span>
                          <Badge variant="outline" className="text-[10px]">{stats.orders} orders</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground text-[10px]">Revenue</p>
                          <p className="font-medium text-emerald-400">{formatCurrency(stats.revenue)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-[10px]">Grinder Cost</p>
                          <p className="font-medium text-blue-400">{formatCurrency(stats.grinderCost)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-[10px]">Profit</p>
                          <p className={`font-medium ${stats.profit >= 0 ? "text-purple-400" : "text-red-400"}`}>{formatCurrency(stats.profit)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-[10px]">Margin</p>
                          <p className={`font-medium ${margin >= 0 ? "text-emerald-400" : "text-red-400"}`}>{margin.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </FadeInUp>
        </div>

        <FadeInUp delay={0.15}>
          <Card className="bg-card/50 border-border/30" data-testid="card-grinder-economics">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Grinder Economics
                  <Badge variant="secondary" className="text-[10px]">{grinderPerformance.length} active</Badge>
                </CardTitle>
                <div className="flex gap-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Earnings</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Profit Generated</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {grinderPerformance.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No data for selected period</p>
              ) : (
                <div className="space-y-3">
                  {grinderPerformance.slice(0, 15).map((gp, idx) => (
                    <div key={gp.grinder.id} className="group" data-testid={`row-grinder-${gp.grinder.id}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-5 text-right font-mono">{idx + 1}</span>
                        <span className="text-xs font-medium w-32 truncate">{gp.grinder.name}</span>
                        <div className="flex-1 space-y-0.5">
                          <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500/70 rounded-full transition-all duration-700"
                              style={{ width: `${(gp.totalEarnings / maxGrinderEarnings) * 100}%` }} />
                          </div>
                          {gp.totalProfit !== 0 && (
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-700 ${gp.totalProfit >= 0 ? "bg-emerald-500/60" : "bg-red-500/60"}`}
                                style={{ width: `${(Math.abs(gp.totalProfit) / maxGrinderEarnings) * 100}%` }} />
                            </div>
                          )}
                        </div>
                        <div className="text-right w-32">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs font-medium text-blue-400">{formatCurrency(gp.totalEarnings)}</span>
                            <span className={`text-[10px] ${gp.totalProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {gp.totalProfit >= 0 ? "+" : ""}{formatCurrency(gp.totalProfit)}
                            </span>
                          </div>
                          <div className="flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
                            <span>{gp.assignmentCount} jobs</span>
                            <span>~{formatCurrency(gp.costPerOrder)}/order</span>
                          </div>
                        </div>
                      </div>
                      {Object.keys(gp.serviceBreakdown).length > 1 && (
                        <div className="ml-8 mt-1 flex gap-2 flex-wrap opacity-0 group-hover:opacity-100 transition-opacity">
                          {Object.entries(gp.serviceBreakdown).sort((a, b) => b[1].earnings - a[1].earnings).map(([sId, sd]) => {
                            const svc = allServices.find(s => s.id === sId);
                            return (
                              <Badge key={sId} variant="outline" className="text-[9px] gap-1">
                                {svc?.name?.replace(/\s*[^\w\s]+$/g, '').trim() || sId}: {sd.count}x ({formatCurrency(sd.earnings)})
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeInUp>

        <FadeInUp delay={0.18}>
          <Card className="bg-card/50 border-border/30" data-testid="card-profitability-summary">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <PieChart className="w-4 h-4 text-primary" />
                Profitability Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-xl border border-border/20 bg-white/[0.02]">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Gross Margin</p>
                  <p className={`text-2xl font-bold mt-1 ${totalRevenue > 0 && totalCompanyProfit / totalRevenue >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {totalRevenue > 0 ? ((totalCompanyProfit / totalRevenue) * 100).toFixed(1) : "0"}%
                  </p>
                </div>
                <div className="text-center p-3 rounded-xl border border-border/20 bg-white/[0.02]">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Revenue/Order</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(avgOrderValue)}</p>
                </div>
                <div className="text-center p-3 rounded-xl border border-border/20 bg-white/[0.02]">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cost/Order</p>
                  <p className="text-2xl font-bold mt-1 text-blue-400">{formatCurrency(avgGrinderPay)}</p>
                </div>
                <div className="text-center p-3 rounded-xl border border-border/20 bg-white/[0.02]">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Profit/Order</p>
                  <p className={`text-2xl font-bold mt-1 ${(avgOrderValue - avgGrinderPay) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatCurrency(avgOrderValue - avgGrinderPay)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeInUp>
      </AnimatedPage>
    </TooltipProvider>
  );
}
