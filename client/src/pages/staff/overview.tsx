import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useStaffData } from "@/hooks/use-staff-data";
import { formatCurrency, formatCompact, AnimatedRing, PipelineStep, LastUpdated, categoryIcon } from "@/lib/staff-utils";
import { BiddingCountdownPanel } from "@/components/bidding-countdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Loader2, DollarSign, TrendingUp, Users, Package, AlertTriangle,
  CheckCircle, Clock, Activity, Search, X, BarChart3, Gauge, Target, Timer,
} from "lucide-react";

export default function StaffOverview() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const isOwner = user?.role === "owner";
  const {
    analytics, analyticsLoading,
    analyticsUpdatedAt, grindersUpdatedAt, auditLogsUpdatedAt,
    assignmentsUpdatedAt, ordersUpdatedAt, bidsUpdatedAt,
    grinders: allGrinders,
    auditLogs,
    assignments: allAssignments,
    orders: allOrders,
    bids: allBids,
    services: allServices,
  } = useStaffData();

  const [searchQuery, setSearchQuery] = useState("");

  const latestUpdate = Math.max(analyticsUpdatedAt || 0, grindersUpdatedAt || 0, auditLogsUpdatedAt || 0, assignmentsUpdatedAt || 0, ordersUpdatedAt || 0, bidsUpdatedAt || 0);
  const lastUpdatedDate = latestUpdate > 0 ? new Date(latestUpdate) : null;

  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const openOrders = allOrders.filter(o => o.status === "Open").length;
  const assignedOrders = allOrders.filter(o => o.status === "Assigned").length;
  const inProgressOrders = allOrders.filter(o => o.status === "In Progress").length;
  const completedOrders = allOrders.filter(o => o.status === "Completed").length;
  const cancelledOrders = allOrders.filter(o => o.status === "Cancelled").length;
  const totalOrders = allOrders.length;

  const rushOrders = allOrders.filter(o => o.isRush && (o.status === "Open" || o.status === "Assigned" || o.status === "In Progress")).length;
  const emergencyOrders = allOrders.filter(o => o.isEmergency && (o.status === "Open" || o.status === "Assigned" || o.status === "In Progress")).length;

  const revenue = analytics?.totalRevenue || 0;
  const payouts = analytics?.totalGrinderPayouts || 0;
  const profit = analytics?.totalCompanyProfit || 0;
  const profitMarginPct = revenue > 0 ? (profit / revenue) * 100 : 0;
  const avgOrderValue = totalOrders > 0 ? allOrders.reduce((s, o) => s + Number(o.customerPrice || 0), 0) / totalOrders : 0;

  const grindersWithStrikes = allGrinders.filter(g => g.strikes > 0).sort((a, b) => b.strikes - a.strikes);
  const atCapacity = allGrinders.filter(g => g.activeOrders >= g.capacity).length;

  return (
    <TooltipProvider>
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-3xl font-display font-bold text-glow" data-testid="text-page-title">
            {isOwner ? "Owner Command Center" : "Staff Command Center"}
          </h1>
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search orders, grinders, bids..."
          className="pl-9 pr-9 bg-white/5 border-border/30"
          data-testid="input-search"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" data-testid="button-clear-search">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {searchQuery.trim().length > 0 && (() => {
        const q = searchQuery.toLowerCase().trim();
        const matchedOrders = allOrders.filter(o =>
          (o.mgtOrderNumber && String(o.mgtOrderNumber).includes(q)) ||
          o.id.toLowerCase().includes(q) ||
          (o.gamertag && o.gamertag.toLowerCase().includes(q)) ||
          (o.platform && o.platform.toLowerCase().includes(q)) ||
          o.status.toLowerCase().includes(q)
        ).slice(0, 10);
        const matchedGrinders = allGrinders.filter(g =>
          g.name.toLowerCase().includes(q) ||
          g.id.toLowerCase().includes(q) ||
          (g.discordUsername && g.discordUsername.toLowerCase().includes(q)) ||
          (g.category && g.category.toLowerCase().includes(q))
        ).slice(0, 10);
        const matchedBids = allBids.filter(b =>
          b.id.toLowerCase().includes(q) ||
          b.orderId.toLowerCase().includes(q) ||
          b.grinderId.toLowerCase().includes(q) ||
          b.status.toLowerCase().includes(q) ||
          (String(b.bidAmount)).includes(q)
        ).slice(0, 10);
        const total = matchedOrders.length + matchedGrinders.length + matchedBids.length;
        return (
          <Card className="glass-panel border-primary/20" data-testid="card-search-results">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                Search Results ({total})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {matchedOrders.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Orders ({matchedOrders.length})</p>
                  <div className="space-y-1.5">
                    {matchedOrders.map(o => {
                      const svc = allServices.find(s => s.id === o.serviceId);
                      return (
                        <div key={o.id} onClick={() => { setSearchQuery(""); navigate("/orders"); }} className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-white/5 text-sm cursor-pointer hover:bg-white/10 transition-colors" data-testid={`search-order-${o.id}`}>
                          <span className="font-medium">{o.mgtOrderNumber ? `#${o.mgtOrderNumber}` : o.id.slice(0, 8)}</span>
                          <span className="text-muted-foreground">{svc?.name || o.serviceId}</span>
                          {o.gamertag && <span className="text-xs text-muted-foreground">({o.gamertag})</span>}
                          <Badge variant="outline" className="text-[10px]">{o.status}</Badge>
                          <span className="text-emerald-400 font-medium ml-auto">{formatCurrency(Number(o.customerPrice))}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {matchedGrinders.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Grinders ({matchedGrinders.length})</p>
                  <div className="space-y-1.5">
                    {matchedGrinders.map(g => (
                      <div key={g.id} onClick={() => { setSearchQuery(""); navigate("/grinders"); }} className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-white/5 text-sm cursor-pointer hover:bg-white/10 transition-colors" data-testid={`search-grinder-${g.id}`}>
                        {categoryIcon(g.category)}
                        <span className="font-medium">{g.name}</span>
                        {g.discordUsername && <span className="text-xs text-muted-foreground">@{g.discordUsername}</span>}
                        <Badge variant="outline" className="text-[10px]">{g.category}</Badge>
                        <span className="text-xs text-muted-foreground ml-auto">{g.activeOrders}/{g.capacity} orders</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {matchedBids.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Bids ({matchedBids.length})</p>
                  <div className="space-y-1.5">
                    {matchedBids.map(b => {
                      const grinder = allGrinders.find(g => g.id === b.grinderId);
                      return (
                        <div key={b.id} onClick={() => { setSearchQuery(""); navigate("/bids"); }} className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-white/5 text-sm cursor-pointer hover:bg-white/10 transition-colors" data-testid={`search-bid-${b.id}`}>
                          <span className="font-medium">{grinder?.name || b.grinderId.slice(0, 8)}</span>
                          <span className="text-muted-foreground">on {b.orderId.slice(0, 8)}</span>
                          <span className="text-emerald-400">${Number(b.bidAmount).toFixed(2)}</span>
                          <Badge variant="outline" className={`text-[10px] ${b.status === "Accepted" ? "text-green-400" : b.status === "Denied" ? "text-red-400" : "text-yellow-400"}`}>{b.status}</Badge>
                          {b.acceptedBy && <span className="text-[10px] text-muted-foreground">by {b.acceptedBy}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {total === 0 && <p className="text-sm text-muted-foreground text-center py-4">No results found for "{searchQuery}"</p>}
            </CardContent>
          </Card>
        );
      })()}

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

      <BiddingCountdownPanel />

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Order Pipeline
            </CardTitle>
            <LastUpdated date={ordersUpdatedAt ? new Date(ordersUpdatedAt) : null} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <PipelineStep label="Open" count={openOrders} total={totalOrders} color="border-blue-500/30 bg-blue-500/5 text-blue-400" icon={Clock} hideArrow />
            <PipelineStep label="Assigned" count={assignedOrders} total={totalOrders} color="border-amber-500/30 bg-amber-500/5 text-amber-400" icon={Target} hideArrow />
            <PipelineStep label="In Progress" count={inProgressOrders} total={totalOrders} color="border-purple-500/30 bg-purple-500/5 text-purple-400" icon={Timer} hideArrow />
            <PipelineStep label="Completed" count={completedOrders} total={totalOrders} color="border-emerald-500/30 bg-emerald-500/5 text-emerald-400" icon={CheckCircle} hideArrow />
            <PipelineStep label="Cancelled" count={cancelledOrders} total={totalOrders} color="border-red-500/30 bg-red-500/5 text-red-400" icon={AlertTriangle} isLast hideArrow />
          </div>
          {(rushOrders > 0 || emergencyOrders > 0) && (
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border/50">
              {rushOrders > 0 && <Badge variant="destructive" className="gap-1"><Clock className="w-3 h-3" /> {rushOrders} Rush Active</Badge>}
              {emergencyOrders > 0 && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1"><AlertTriangle className="w-3 h-3" /> {emergencyOrders} Emergency Active</Badge>}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Recent Activity
              </CardTitle>
              <LastUpdated date={auditLogsUpdatedAt ? new Date(auditLogsUpdatedAt) : null} />
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
            <div className="flex items-center justify-between gap-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Risk & Alerts
              </CardTitle>
              <LastUpdated date={grindersUpdatedAt ? new Date(grindersUpdatedAt) : null} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-3 rounded-lg bg-white/5 text-center">
                  <p className="text-lg font-bold text-amber-400" data-testid="text-grinders-with-strikes">{grindersWithStrikes.length}</p>
                  <p className="text-[10px] text-muted-foreground">With Strikes</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 text-center">
                  <p className="text-lg font-bold text-red-400" data-testid="text-max-strikes">{allGrinders.filter(g => g.strikes >= 3).length}</p>
                  <p className="text-[10px] text-muted-foreground">Max Strikes</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 text-center">
                  <p className="text-lg font-bold text-blue-400" data-testid="text-reassigned">{allAssignments.filter(a => a.wasReassigned).length}</p>
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
                  <span className="text-sm text-amber-400">{atCapacity} grinder{atCapacity > 1 ? "s" : ""} at order limit</span>
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
    </div>
    </TooltipProvider>
  );
}
