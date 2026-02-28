import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useStaffData } from "@/hooks/use-staff-data";
import { formatCurrency, formatCompact, AnimatedRing, LastUpdated, categoryIcon, pluralize, formatLabel } from "@/lib/staff-utils";
import { BiddingCountdownPanel } from "@/components/bidding-countdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2, DollarSign, TrendingUp, Users, Package, AlertTriangle,
  CheckCircle, Clock, Search, X, BarChart3, Gauge, Target, Timer,
  Zap, Crown, ArrowUpRight, ArrowDownRight, ShieldAlert, Flame, Activity, LayoutDashboard, Wallet,
  Shield, Calendar, ListOrdered, Gavel, UserCheck, ClipboardList
} from "lucide-react";
import {
  STAFF_BADGE_COMPONENTS, STAFF_BADGE_META, type StaffBadgeId,
} from "@/components/staff-achievement-badges";
import type { StaffBadge as StaffBadgeType } from "@shared/schema";


function SparkBar({ segments, height = 6 }: { segments: { value: number; color: string; label: string }[]; height?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div className="w-full rounded-full bg-white/5" style={{ height }} />;
  return (
    <div className="w-full rounded-full bg-white/5 overflow-hidden flex" style={{ height }}>
      {segments.map((seg, i) => (
        <div key={i} className={`${seg.color} transition-all duration-700`} style={{ width: `${(seg.value / total) * 100}%` }} />
      ))}
    </div>
  );
}

function StatCard({ label, value, subtitle, icon: Icon, gradient, iconBg, textColor, trend, trendUp }: {
  label: string; value: string; subtitle: string; icon: any; gradient: string; iconBg: string; textColor: string; trend?: string; trendUp?: boolean;
}) {
  return (
    <Card className={`${gradient} border-0 overflow-hidden relative group sm:hover:scale-[1.02] transition-transform duration-300`}>
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.03] -translate-y-8 translate-x-8" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-white/50">{label}</p>
            <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${textColor} tracking-tight truncate`} data-testid={`text-${label.toLowerCase().replace(/\s+/g, "-")}`}>{value}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-white/40">{subtitle}</p>
              {trend && (
                <span className={`flex items-center gap-0.5 text-[10px] font-medium ${trendUp ? "text-emerald-400" : "text-red-400"}`}>
                  {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {trend}
                </span>
              )}
            </div>
          </div>
          <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center backdrop-blur-sm`}>
            <Icon className={`w-5 h-5 ${textColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StaffOverview() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const isOwner = user?.role === "owner";
  const {
    analytics, analyticsLoading,
    analyticsUpdatedAt, grindersUpdatedAt, auditLogsUpdatedAt,
    assignmentsUpdatedAt, ordersUpdatedAt, bidsUpdatedAt,
    ordersLoading, grindersLoading, bidsLoading,
    grinders: allGrinders,
    auditLogs,
    assignments: allAssignments,
    orders: allOrders,
    bids: allBids,
    services: allServices,
    payoutReqs,
  } = useStaffData();

  const [searchQuery, setSearchQuery] = useState("");

  const latestUpdate = Math.max(grindersUpdatedAt || 0, auditLogsUpdatedAt || 0, assignmentsUpdatedAt || 0, ordersUpdatedAt || 0, bidsUpdatedAt || 0, analyticsUpdatedAt || 0);
  const lastUpdatedDate = latestUpdate > 0 ? new Date(latestUpdate) : null;

  const { data: myBadges = [] } = useQuery<StaffBadgeType[]>({
    queryKey: ["/api/staff/my-badges"],
    refetchInterval: 60000,
  });

  const dataLoading = isOwner ? analyticsLoading : (ordersLoading || grindersLoading || bidsLoading);

  if (dataLoading) {
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
  const paidOutOrders = allOrders.filter(o => o.status === "Paid Out").length;
  const cancelledOrders = allOrders.filter(o => o.status === "Cancelled").length;
  const totalOrders = allOrders.length;

  const rushOrders = allOrders.filter(o => o.isRush && (o.status === "Open" || o.status === "Assigned" || o.status === "In Progress")).length;
  const emergencyOrders = allOrders.filter(o => o.isEmergency && (o.status === "Open" || o.status === "Assigned" || o.status === "In Progress")).length;

  const activeOrders = allOrders.filter(o => o.status === "Open" || o.status === "Assigned" || o.status === "In Progress").length;
  const pendingBids = allBids.filter(b => b.status === "Pending").length;
  const acceptedBids = allBids.filter(b => b.status === "Accepted").length;
  const availableGrinders = allGrinders.filter(g => g.activeOrders < g.capacity && !g.suspended).length;
  const suspendedGrinders = allGrinders.filter(g => g.suspended);
  const atCapacity = allGrinders.filter(g => g.activeOrders >= g.capacity).length;
  const totalCapacity = allGrinders.reduce((s, g) => s + g.capacity, 0);
  const totalActive = allGrinders.reduce((s, g) => s + g.activeOrders, 0);
  const fleetUtilization = totalCapacity > 0 ? (totalActive / totalCapacity) * 100 : 0;
  const grindersWithStrikes = allGrinders.filter(g => g.strikes > 0).sort((a, b) => b.strikes - a.strikes);

  const pendingPayouts = payoutReqs.filter((p: any) => p.status === "Pending" || p.status === "pending").length;

  const revenue = analytics?.totalRevenue || 0;
  const payouts = analytics?.totalGrinderPayouts || 0;
  const profit = analytics?.totalCompanyProfit || 0;
  const profitMarginPct = revenue > 0 ? (profit / revenue) * 100 : 0;
  const nonCancelledOrders = allOrders.filter(o => o.status !== "Cancelled");
  const avgOrderValue = nonCancelledOrders.length > 0 ? nonCancelledOrders.reduce((s, o) => s + Number(o.customerPrice || 0), 0) / nonCancelledOrders.length : 0;

  const pipelineData = [
    { label: "Open", count: openOrders, icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", ring: "bg-blue-500" },
    { label: "Assigned", count: assignedOrders, icon: Target, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", ring: "bg-amber-500" },
    { label: "In Progress", count: inProgressOrders, icon: Timer, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", ring: "bg-purple-500" },
    { label: "Completed", count: completedOrders, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", ring: "bg-emerald-500" },
    { label: "Paid Out", count: paidOutOrders, icon: DollarSign, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", ring: "bg-cyan-500" },
    { label: "Cancelled", count: cancelledOrders, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", ring: "bg-red-500" },
  ];

  return (
    <TooltipProvider>
    <AnimatedPage className="space-y-6">
      <FadeInUp>
        <div className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 ${
          isOwner 
            ? "border-red-500/20 bg-gradient-to-r from-red-950/40 via-red-900/20 to-amber-950/30" 
            : "border-primary/20 bg-gradient-to-r from-primary/10 via-background to-primary/5"
        }`}>
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-16 translate-x-16 ${
            isOwner ? "bg-red-500/[0.06]" : "bg-primary/[0.04]"
          }`} />
          
          <div className="relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="relative">
                <Avatar className={`h-14 w-14 sm:h-20 sm:w-20 border-2 shadow-lg ${
                  isOwner ? "border-red-500/40" : "border-primary/40"
                }`}>
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback className={`${isOwner ? "bg-red-500/20 text-red-400" : "bg-primary/20 text-primary"} text-2xl font-bold`}>
                    {(user?.firstName || user?.discordUsername || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isOwner && (
                  <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center shadow-lg">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h1 className="text-xl sm:text-3xl font-bold font-display tracking-tight" data-testid="text-page-title">
                    {user?.firstName || user?.discordUsername || "User"}
                  </h1>
                  {user?.discordUsername && user?.firstName && user.firstName !== user.discordUsername && (
                    <span className="text-base sm:text-lg text-muted-foreground font-medium" data-testid="text-discord-username">(@{user.discordUsername})</span>
                  )}
                  <Badge className={`gap-1 ${
                    isOwner 
                      ? "bg-red-500/20 text-red-400 border-red-500/30" 
                      : "bg-primary/20 text-primary border-primary/30"
                  }`}>
                    {isOwner ? <Crown className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                    {isOwner ? "Owner" : "Staff"}
                  </Badge>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">Live</span>
                  </div>
                </div>
                
                <p className={`text-sm mt-1 font-medium ${isOwner ? "text-red-400/70" : "text-primary/70"}`}>
                  {isOwner ? "Owner Command Center" : "Operations Hub"}
                </p>
                
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                  <span className="hidden sm:inline opacity-20">|</span>
                  <LastUpdated date={lastUpdatedDate} />
                </div>
              </div>
            </div>

            {myBadges.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
                  {myBadges.map((b) => {
                    const BadgeComp = STAFF_BADGE_COMPONENTS[b.badgeId as StaffBadgeId];
                    const meta = STAFF_BADGE_META[b.badgeId as StaffBadgeId];
                    if (!BadgeComp || !meta) return null;
                    return (
                      <TooltipProvider key={b.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col items-center gap-1 cursor-default" data-testid={`profile-badge-${b.badgeId}`}>
                              <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center [&_svg]:w-10 [&_svg]:h-10 sm:[&_svg]:w-12 sm:[&_svg]:h-12 [&>div]:!w-10 [&>div]:!h-10 sm:[&>div]:!w-12 sm:[&>div]:!h-12">
                                <BadgeComp />
                              </div>
                              <span className="text-[9px] sm:text-[10px] text-muted-foreground text-center leading-tight max-w-[56px] sm:max-w-[72px] truncate">{meta.label}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[200px]">
                            <p className="text-xs font-medium">{meta.label}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{meta.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search orders, grinders, bids..."
          className="pl-10 pr-10 h-11 bg-white/[0.03] border-white/10 rounded-xl focus:border-primary/50 transition-colors"
          data-testid="input-search"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors" data-testid="button-clear-search">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      </FadeInUp>

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
          <Card className="border-primary/20 bg-white/[0.02]" data-testid="card-search-results">
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
                        {categoryIcon(g.displayRole || g.category)}
                        <span className="font-medium">{g.name}</span>
                        {g.discordUsername && <span className="text-xs text-muted-foreground">@{g.discordUsername}</span>}
                        <Badge variant="outline" className="text-[10px]">{g.category}</Badge>
                        <span className="text-xs text-muted-foreground ml-auto">{pluralize(g.activeOrders, 'order')}/{g.capacity}</span>
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

      <FadeInUp>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isOwner ? (
          <>
            <StatCard label="Total Revenue" value={formatCurrency(revenue)} subtitle={pluralize(nonCancelledOrders.length, 'order')} icon={DollarSign}
              gradient="bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent" iconBg="bg-emerald-500/20" textColor="text-emerald-400" />
            <StatCard label="Grinder Payouts" value={formatCurrency(payouts)} subtitle={`${allGrinders.length} grinders`} icon={Users}
              gradient="bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent" iconBg="bg-blue-500/20" textColor="text-blue-400" />
            <StatCard label="Company Profit" value={formatCurrency(profit)} subtitle={`${profitMarginPct.toFixed(1)}% margin`} icon={TrendingUp}
              gradient="bg-gradient-to-br from-purple-500/15 via-purple-500/5 to-transparent" iconBg="bg-purple-500/20" textColor="text-purple-400" />
            <StatCard label="Avg Order Value" value={formatCurrency(avgOrderValue)} subtitle={`avg margin ${(analytics?.avgMargin || 0).toFixed(1)}%`} icon={BarChart3}
              gradient="bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent" iconBg="bg-amber-500/20" textColor="text-amber-400" />
          </>
        ) : (
          <>
            <StatCard label="Active Orders" value={String(activeOrders)} subtitle={`${openOrders} open, ${inProgressOrders} in progress`} icon={ListOrdered}
              gradient="bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent" iconBg="bg-blue-500/20" textColor="text-blue-400" />
            <StatCard label="Pending Bids" value={String(pendingBids)} subtitle={`${acceptedBids} accepted total`} icon={Gavel}
              gradient="bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent" iconBg="bg-amber-500/20" textColor="text-amber-400" />
            <StatCard label="Grinder Availability" value={`${availableGrinders}/${allGrinders.length}`} subtitle={`${atCapacity} at capacity`} icon={Users}
              gradient="bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent" iconBg="bg-emerald-500/20" textColor="text-emerald-400" />
            <StatCard label="Pending Payouts" value={String(pendingPayouts)} subtitle={`${suspendedGrinders.length} suspended grinders`} icon={ClipboardList}
              gradient="bg-gradient-to-br from-purple-500/15 via-purple-500/5 to-transparent" iconBg="bg-purple-500/20" textColor="text-purple-400" />
          </>
        )}
      </div>
      </FadeInUp>

      {isOwner && (
        <FadeInUp>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div onClick={() => navigate("/business")} className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-900/5 border border-amber-500/15 cursor-pointer hover:border-amber-500/30 transition-all group" data-testid="quick-action-business">
              <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Business</p>
                <p className="text-[10px] text-muted-foreground">Revenue & margins</p>
              </div>
            </div>
            <div onClick={() => navigate("/payouts")} className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-900/5 border border-emerald-500/15 cursor-pointer hover:border-emerald-500/30 transition-all group" data-testid="quick-action-payouts">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Grinder Payouts</p>
                <p className="text-[10px] text-muted-foreground">Pending approvals</p>
              </div>
            </div>
            <div onClick={() => navigate("/admin")} className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-900/5 border border-blue-500/15 cursor-pointer hover:border-blue-500/30 transition-all group" data-testid="quick-action-admin">
              <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Admin</p>
                <p className="text-[10px] text-muted-foreground">Team & settings</p>
              </div>
            </div>
            <div onClick={() => navigate("/wallets")} className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-900/5 border border-purple-500/15 cursor-pointer hover:border-purple-500/30 transition-all group" data-testid="quick-action-wallets">
              <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Business Wallet</p>
                <p className="text-[10px] text-muted-foreground">Wallets & payouts</p>
              </div>
            </div>
          </div>
        </FadeInUp>
      )}

      {!isOwner && (
        <FadeInUp>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div onClick={() => navigate("/orders")} className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-900/5 border border-blue-500/15 cursor-pointer hover:border-blue-500/30 transition-all group" data-testid="quick-action-orders">
              <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ListOrdered className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Orders</p>
                <p className="text-[10px] text-muted-foreground">Manage & assign</p>
              </div>
            </div>
            <div onClick={() => navigate("/bids")} className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-900/5 border border-amber-500/15 cursor-pointer hover:border-amber-500/30 transition-all group" data-testid="quick-action-bids">
              <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Gavel className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Bids</p>
                <p className="text-[10px] text-muted-foreground">Review & approve</p>
              </div>
            </div>
            <div onClick={() => navigate("/grinders")} className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-900/5 border border-emerald-500/15 cursor-pointer hover:border-emerald-500/30 transition-all group" data-testid="quick-action-grinders">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Grinders</p>
                <p className="text-[10px] text-muted-foreground">Team & roster</p>
              </div>
            </div>
            <div onClick={() => navigate("/payouts")} className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-900/5 border border-purple-500/15 cursor-pointer hover:border-purple-500/30 transition-all group" data-testid="quick-action-payouts">
              <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Payouts</p>
                <p className="text-[10px] text-muted-foreground">Grinder payments</p>
              </div>
            </div>
          </div>
        </FadeInUp>
      )}

      <FadeInUp>
      <BiddingCountdownPanel />
      </FadeInUp>

      <Card className="border-white/[0.06] bg-white/[0.02]">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Order Pipeline
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {rushOrders > 0 && (
                <Badge className="bg-red-500/15 text-red-400 border border-red-500/20 gap-1 text-[10px]">
                  <Flame className="w-3 h-3" /> {rushOrders} Rush
                </Badge>
              )}
              {emergencyOrders > 0 && (
                <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 gap-1 text-[10px]">
                  <Zap className="w-3 h-3" /> {emergencyOrders} Emergency
                </Badge>
              )}
              <LastUpdated date={ordersUpdatedAt ? new Date(ordersUpdatedAt) : null} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SparkBar height={8} segments={pipelineData.map(p => ({ value: p.count, color: p.ring, label: p.label }))} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {pipelineData.map((p) => {
              const pct = totalOrders > 0 ? ((p.count / totalOrders) * 100).toFixed(0) : "0";
              const Icon = p.icon;
              return (
                <div key={p.label} className={`relative flex flex-col items-center p-3 sm:p-4 rounded-xl border ${p.border} ${p.bg} transition-all sm:hover:scale-[1.03] cursor-default group`} data-testid={`pipeline-${p.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  <div className={`w-8 h-8 rounded-lg ${p.bg} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-4 h-4 ${p.color}`} />
                  </div>
                  <span className={`text-2xl font-bold ${p.color}`}>{p.count}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{p.label}</span>
                  <span className="text-[10px] text-white/30">{pct}%</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">
        <FadeInUp className="h-full">
        <Card className="border-white/[0.06] bg-white/[0.02] h-full flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gauge className="w-5 h-5 text-cyan-400" />
              Fleet Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-center">
              <AnimatedRing
                percent={fleetUtilization}
                color={fleetUtilization > 80 ? "#f87171" : fleetUtilization > 60 ? "#fbbf24" : "#34d399"}
                label="Fleet Utilization"
                value={`${fleetUtilization.toFixed(0)}%`}
                size={110}
                stroke={10}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 cursor-default">
                    <p className="text-lg font-bold text-emerald-400" data-testid="text-available-grinders">{availableGrinders}</p>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Available</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Grinders with open order slots</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-2 rounded-lg bg-red-500/5 border border-red-500/10 cursor-default">
                    <p className="text-lg font-bold text-red-400" data-testid="text-at-limit">{atCapacity}</p>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">At Limit</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Grinders at their order limit</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-2 rounded-lg bg-blue-500/5 border border-blue-500/10 cursor-default">
                    <p className="text-lg font-bold text-blue-400" data-testid="text-total-slots">{totalActive}<span className="text-white/30">/{totalCapacity}</span></p>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Slots</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Active orders / total capacity</TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                <span className="text-muted-foreground">Pending Bids</span>
                <span className="font-bold text-yellow-400">{pendingBids}</span>
              </div>
              <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <span className="text-muted-foreground">Accepted Bids</span>
                <span className="font-bold text-emerald-400">{acceptedBids}</span>
              </div>
              {suspendedGrinders.length > 0 && (
                <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                  <span className="text-muted-foreground">Suspended</span>
                  <span className="font-bold text-red-400">{suspendedGrinders.length}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </FadeInUp>

        <FadeInUp className="h-full">
        <Card className="border-white/[0.06] bg-white/[0.02] h-full flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Recent Activity
              </CardTitle>
              <LastUpdated date={auditLogsUpdatedAt ? new Date(auditLogsUpdatedAt) : null} />
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
              {(!auditLogs || auditLogs.length === 0) && (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No activity yet</p>
                </div>
              )}
              {(auditLogs || []).slice(0, 15).map((log) => {
                const actionColor =
                  log.action.includes("created") || log.action.includes("accepted") || log.action.includes("paid") ? "bg-emerald-400" :
                  log.action.includes("rejected") || log.action.includes("denied") || log.action.includes("deleted") ? "bg-red-400" :
                  log.action.includes("updated") || log.action.includes("changed") || log.action.includes("price") || log.action.includes("assign") ? "bg-blue-400" :
                  log.action.includes("imported") ? "bg-purple-400" :
                  "bg-muted-foreground";
                return (
                  <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors" data-testid={`card-audit-${log.id}`}>
                    <div className="relative mt-1.5 flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${actionColor}`} />
                      <div className={`absolute inset-0 w-2 h-2 rounded-full ${actionColor} animate-ping opacity-20`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        <span className="font-medium capitalize">{formatLabel(log.entityType)}</span>{" "}
                        <span className="text-white/40">{log.entityId}</span>{" "}
                        <span className="text-primary/80">{formatLabel(log.action)}</span>
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5">
                        {log.actor} &middot; {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        </FadeInUp>
      </div>

      <FadeInUp>
      <Card className="border-white/[0.06] bg-white/[0.02]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Risk & Alerts
            </CardTitle>
            <LastUpdated date={grindersUpdatedAt ? new Date(grindersUpdatedAt) : null} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-center">
              <p className="text-2xl font-bold text-amber-400" data-testid="text-grinders-with-strikes">{grindersWithStrikes.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">With Strikes</p>
            </div>
            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-center">
              <p className="text-2xl font-bold text-red-400" data-testid="text-max-strikes">{allGrinders.filter(g => g.strikes >= 3).length}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Max Strikes</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 text-center">
              <p className="text-2xl font-bold text-orange-400" data-testid="text-suspended">{suspendedGrinders.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Suspended</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center">
              <p className="text-2xl font-bold text-blue-400" data-testid="text-reassigned">{allAssignments.filter(a => a.wasReassigned).length}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Reassigned</p>
            </div>
          </div>

          {grindersWithStrikes.length === 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm text-emerald-400 font-medium">All grinders in good standing</span>
            </div>
          ) : (
            <div className="space-y-2">
              {grindersWithStrikes.slice(0, 5).map((g) => (
                <div key={g.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors" data-testid={`card-risk-${g.id}`}>
                  <div className="flex items-center gap-3">
                    {categoryIcon(g.displayRole || g.category)}
                    <div>
                      <span className="text-sm font-medium">{g.name}</span>
                      {g.suspended && <Badge className="ml-2 bg-red-500/15 text-red-400 border-red-500/20 text-[9px]">Suspended</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className={`w-3 h-3 rounded-full transition-all ${i < g.strikes ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]" : "bg-white/10"}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {(atCapacity > 0 || openOrders > 5) && (
            <div className="mt-3 space-y-2">
              {atCapacity > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <Gauge className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-sm text-amber-400">{atCapacity} grinder{atCapacity > 1 ? "s" : ""} at order limit</span>
                </div>
              )}
              {openOrders > 5 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <Package className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-sm text-blue-400">{pluralize(openOrders, 'order')} waiting for assignment</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      </FadeInUp>

    </AnimatedPage>
    </TooltipProvider>
  );
}
