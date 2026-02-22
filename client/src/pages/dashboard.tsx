import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BiddingCountdownPanel } from "@/components/bidding-countdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Loader2, DollarSign, TrendingUp, Users, Package, AlertTriangle,
  CheckCircle, Clock, Activity, Crown, Zap, Shield, ArrowRight,
  BarChart3, PieChart, Gauge, Star, Target, Timer, Percent, Repeat,
  MessageSquare, Banknote, Bell, Send, Trash2, Award, Eye, Ban,
  Gavel, FileCheck, Lightbulb, HelpCircle, Settings, UserCheck,
  Search, X, CreditCard, Wallet, Plus, ToggleLeft, ToggleRight,
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

function PipelineStep({ label, count, total, color, icon: Icon, isLast, hideArrow }: { label: string; count: number; total: number; color: string; icon: any; isLast?: boolean; hideArrow?: boolean }) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(0) : "0";
  return (
    <>
      <div className={`flex flex-col items-center p-3 rounded-xl border ${color} transition-all hover:scale-[1.02]`} data-testid={`pipeline-${label.toLowerCase().replace(/\s+/g, "-")}`}>
        <Icon className="w-5 h-5 mb-1" />
        <span className="text-2xl font-bold">{count}</span>
        <span className="text-[10px] uppercase tracking-wider opacity-70">{label}</span>
        <span className="text-[10px] opacity-50">{pct}%</span>
      </div>
      {!isLast && <ArrowRight className={`w-4 h-4 text-muted-foreground flex-shrink-0 ${hideArrow ? "hidden lg:block" : ""}`} />}
    </>
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const { data: analytics, isLoading, dataUpdatedAt } = useQuery<AnalyticsSummary>({ queryKey: ["/api/analytics/summary"], refetchInterval: 10000 });
  const { data: grindersList, dataUpdatedAt: grindersUpdatedAt } = useQuery<Grinder[]>({ queryKey: ["/api/grinders"], refetchInterval: 10000 });
  const { data: auditLogs, dataUpdatedAt: logsUpdatedAt } = useQuery<AuditLog[]>({ queryKey: ["/api/audit-logs?limit=15"], refetchInterval: 10000 });
  const { data: assignmentsList, dataUpdatedAt: assignmentsUpdatedAt } = useQuery<Assignment[]>({ queryKey: ["/api/assignments"], refetchInterval: 10000 });
  const { data: ordersList, dataUpdatedAt: ordersUpdatedAt } = useQuery<Order[]>({ queryKey: ["/api/orders"], refetchInterval: 10000 });
  const { data: bidsList, dataUpdatedAt: bidsUpdatedAt } = useQuery<Bid[]>({ queryKey: ["/api/bids"], refetchInterval: 10000 });
  const { data: servicesList } = useQuery<Service[]>({ queryKey: ["/api/services"], refetchInterval: 10000 });
  const { data: grinderUpdates } = useQuery<any[]>({ queryKey: ["/api/staff/order-updates"], refetchInterval: 10000 });
  const { data: payoutReqs } = useQuery<any[]>({ queryKey: ["/api/staff/payout-requests"], refetchInterval: 10000 });
  const { data: eliteVsGrinderMetrics } = useQuery<any>({ queryKey: ["/api/staff/elite-vs-grinder-metrics"], refetchInterval: 10000 });
  const { data: eliteRequestsList } = useQuery<any[]>({ queryKey: ["/api/staff/elite-requests"], refetchInterval: 10000 });
  const { data: staffAlertsList } = useQuery<any[]>({ queryKey: ["/api/staff/alerts"], refetchInterval: 10000 });
  const { data: strikeLogsList } = useQuery<any[]>({ queryKey: ["/api/staff/strike-logs"], refetchInterval: 10000 });

  const payoutMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/staff/payout-requests/${id}`, { status, reviewedBy: "staff" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/payout-requests"] });
      toast({ title: "Payout request updated" });
    },
  });

  const eliteReqMutation = useMutation({
    mutationFn: async ({ id, status, decisionNotes }: { id: string; status: string; decisionNotes?: string }) => {
      const res = await apiRequest("PATCH", `/api/staff/elite-requests/${id}`, { status, reviewedBy: "staff", decisionNotes });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/staff/elite-requests"] }); toast({ title: "Elite request updated" }); },
  });

  const strikeMutation = useMutation({
    mutationFn: async (data: { grinderId: string; action: string; reason: string }) => {
      const res = await apiRequest("POST", "/api/staff/strikes", { ...data, createdBy: "staff" });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/staff/strike-logs"] }); queryClient.invalidateQueries({ queryKey: ["/api/grinders"] }); toast({ title: "Strike updated" }); },
  });

  const finePayMutation = useMutation({
    mutationFn: async (grinderId: string) => {
      const res = await apiRequest("POST", `/api/staff/fines/${grinderId}/pay`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/strike-logs"] });
      toast({ title: "Fines marked as paid, suspension lifted" });
    },
  });

  const alertMutation = useMutation({
    mutationFn: async (data: { targetType: string; grinderId?: string; title: string; message: string; severity: string }) => {
      const res = await apiRequest("POST", "/api/staff/alerts", { ...data, createdBy: "staff" });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/staff/alerts"] }); toast({ title: "Alert sent" }); },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/staff/alerts/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/staff/alerts"] }); toast({ title: "Alert deleted" }); },
  });

  const staffAssignMutation = useMutation({
    mutationFn: async (data: { orderId: string; grinderId: string; bidAmount: string; notes?: string }) => {
      const res = await apiRequest("POST", `/api/orders/${data.orderId}/assign`, {
        grinderId: data.grinderId,
        bidAmount: data.bidAmount,
        notes: data.notes,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/audit-logs?limit=15"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bidding-timers"] });
      setAssignOrderId("");
      setAssignGrinderId("");
      setAssignBidAmount("");
      setAssignNotes("");
      toast({ title: "Grinder assigned successfully", description: "Order status, bids, and timers have been synced." });
    },
    onError: (err: any) => {
      toast({ title: "Assignment failed", description: err.message || "Something went wrong", variant: "destructive" });
    },
  });

  const [strikeGrinderId, setStrikeGrinderId] = useState("");
  const [strikeReason, setStrikeReason] = useState("");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("info");
  const [alertTarget, setAlertTarget] = useState("all");
  const [alertGrinderId, setAlertGrinderId] = useState("");
  const [assignOrderId, setAssignOrderId] = useState("");
  const [assignGrinderId, setAssignGrinderId] = useState("");
  const [assignBidAmount, setAssignBidAmount] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [editLimitGrinderId, setEditLimitGrinderId] = useState("");
  const [editLimitValue, setEditLimitValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editProfileGrinder, setEditProfileGrinder] = useState<any>(null);
  const [editProfileName, setEditProfileName] = useState("");
  const [editProfileCategory, setEditProfileCategory] = useState("");
  const [editProfileTier, setEditProfileTier] = useState("");
  const [editProfileCapacity, setEditProfileCapacity] = useState("");
  const [editProfileNotes, setEditProfileNotes] = useState("");
  const [manualOrderService, setManualOrderService] = useState("");
  const [manualOrderPrice, setManualOrderPrice] = useState("");
  const [manualOrderPlatform, setManualOrderPlatform] = useState("");
  const [manualOrderGamertag, setManualOrderGamertag] = useState("");
  const [manualOrderDueDays, setManualOrderDueDays] = useState("3");
  const [manualOrderNotes, setManualOrderNotes] = useState("");
  const [manualOrderSendToGrinders, setManualOrderSendToGrinders] = useState(true);
  const [manualOrderIsRush, setManualOrderIsRush] = useState(false);
  const [manualOrderComplexity, setManualOrderComplexity] = useState("1");

  const createManualOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/audit-logs?limit=15"] });
      setManualOrderService("");
      setManualOrderPrice("");
      setManualOrderPlatform("");
      setManualOrderGamertag("");
      setManualOrderDueDays("3");
      setManualOrderNotes("");
      setManualOrderSendToGrinders(true);
      setManualOrderIsRush(false);
      setManualOrderComplexity("1");
      toast({ title: "Manual order created", description: manualOrderSendToGrinders ? "Order is visible to grinders for bidding." : "Order created for manual assignment only." });
    },
    onError: (err: any) => {
      toast({ title: "Failed to create order", description: err.message || "Something went wrong", variant: "destructive" });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ grinderId, data }: { grinderId: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/grinders/${grinderId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      setEditProfileGrinder(null);
      toast({ title: "Grinder profile updated" });
    },
    onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
  });

  const updateLimitMutation = useMutation({
    mutationFn: async ({ grinderId, capacity }: { grinderId: string; capacity: number }) => {
      const res = await apiRequest("PATCH", `/api/grinders/${grinderId}`, { capacity });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      setEditLimitGrinderId("");
      setEditLimitValue("");
      toast({ title: "Order limit updated" });
    },
    onError: () => {
      toast({ title: "Failed to update order limit", variant: "destructive" });
    },
  });

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

  const nonCancelledOrders = allOrders.filter(o => o.status !== "Cancelled");
  const serviceDistribution = allServices.map(s => {
    const svcOrders = nonCancelledOrders.filter(o => o.serviceId === s.id);
    const count = svcOrders.length;
    const serviceRevenue = svcOrders.reduce((sum, o) => sum + Number(o.customerPrice || 0), 0);
    return { name: s.name, id: s.id, count, revenue: serviceRevenue };
  }).sort((a, b) => b.count - a.count);
  const maxServiceCount = Math.max(...serviceDistribution.map(s => s.count), 1);

  const serviceColors = ["bg-primary", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-cyan-500", "bg-pink-500"];

  const topEarners = [...allGrinders].sort((a, b) => Number(b.totalEarnings) - Number(a.totalEarnings)).slice(0, 5);
  const maxEarnings = topEarners.length > 0 ? Number(topEarners[0].totalEarnings) : 1;

  const grindersWithStrikes = allGrinders.filter(g => g.strikes > 0).sort((a, b) => b.strikes - a.strikes);
  const rushOrders = allOrders.filter(o => o.isRush && (o.status === "Open" || o.status === "Assigned" || o.status === "In Progress")).length;
  const emergencyOrders = allOrders.filter(o => o.isEmergency && (o.status === "Open" || o.status === "Assigned" || o.status === "In Progress")).length;

  const avgOrderValue = nonCancelledOrders.length > 0 ? nonCancelledOrders.reduce((s, o) => s + Number(o.customerPrice || 0), 0) / nonCancelledOrders.length : 0;

  const completedAssignments = allAssignments.filter(a => a.status === "Completed");
  const onTimeCount = completedAssignments.filter(a => a.isOnTime === true).length;
  const onTimeRate = completedAssignments.length > 0 ? (onTimeCount / completedAssignments.length) * 100 : 0;

  const replacedAssignments = allAssignments.filter(a => a.wasReassigned);
  const totalOriginalGrinderPay = replacedAssignments.reduce((s, a) => s + Number(a.originalGrinderPay || 0), 0);
  const totalReplacementGrinderPay = replacedAssignments.reduce((s, a) => s + Number(a.replacementGrinderPay || 0), 0);
  const replacementRate = allAssignments.length > 0 ? (replacedAssignments.length / allAssignments.length) * 100 : 0;
  const grindersReplacedOff = [...new Set(replacedAssignments.map(a => a.originalGrinderId).filter(Boolean))];
  const grindersReplacedIn = [...new Set(replacedAssignments.map(a => a.replacementGrinderId).filter(Boolean))];

  const allPayoutReqs = payoutReqs || [];
  const pendingPayouts = allPayoutReqs.filter((p: any) => p.status === "Pending");
  const approvedPayouts = allPayoutReqs.filter((p: any) => p.status === "Approved");
  const paidPayouts = allPayoutReqs.filter((p: any) => p.status === "Paid");
  const totalOwed = [...pendingPayouts, ...approvedPayouts].reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const totalPaidOut = paidPayouts.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

  const categoryIcon = (cat: string) => {
    if (cat === "Elite Grinder") return <Crown className="w-3 h-3 text-yellow-500" />;
    if (cat === "VC Grinder") return <Zap className="w-3 h-3 text-cyan-400" />;
    if (cat === "Event Grinder") return <Shield className="w-3 h-3 text-purple-400" />;
    return <Users className="w-3 h-3 text-primary" />;
  };

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
                        <div key={o.id} className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-white/5 text-sm" data-testid={`search-order-${o.id}`}>
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
                      <div key={g.id} className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-white/5 text-sm" data-testid={`search-grinder-${g.id}`}>
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
                        <div key={b.id} className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-white/5 text-sm" data-testid={`search-bid-${b.id}`}>
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

      <Card className="glass-panel border-amber-500/20" data-testid="card-create-manual-order">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-400" />
            Create Manual Order
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Service</label>
              <Select value={manualOrderService} onValueChange={setManualOrderService}>
                <SelectTrigger data-testid="select-manual-service">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {allServices.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Customer Price ($)</label>
              <Input type="number" step="0.01" min="0" placeholder="Price" value={manualOrderPrice} onChange={(e) => setManualOrderPrice(e.target.value)} data-testid="input-manual-price" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Platform</label>
              <Select value={manualOrderPlatform} onValueChange={setManualOrderPlatform}>
                <SelectTrigger data-testid="select-manual-platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Xbox">Xbox</SelectItem>
                  <SelectItem value="PS5">PS5</SelectItem>
                  <SelectItem value="PS4">PS4</SelectItem>
                  <SelectItem value="PC">PC</SelectItem>
                  <SelectItem value="Switch">Switch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Gamertag</label>
              <Input placeholder="Customer gamertag" value={manualOrderGamertag} onChange={(e) => setManualOrderGamertag(e.target.value)} data-testid="input-manual-gamertag" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Due in (days)</label>
              <Input type="number" min="1" placeholder="3" value={manualOrderDueDays} onChange={(e) => setManualOrderDueDays(e.target.value)} data-testid="input-manual-due" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Complexity (1-5)</label>
              <Select value={manualOrderComplexity} onValueChange={setManualOrderComplexity}>
                <SelectTrigger data-testid="select-manual-complexity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map(n => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Notes (optional)</label>
            <Input placeholder="Additional details..." value={manualOrderNotes} onChange={(e) => setManualOrderNotes(e.target.value)} data-testid="input-manual-notes" />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 flex-1">
              <button
                type="button"
                onClick={() => setManualOrderSendToGrinders(!manualOrderSendToGrinders)}
                className="flex items-center gap-2"
                data-testid="toggle-send-to-grinders"
              >
                {manualOrderSendToGrinders
                  ? <ToggleRight className="w-8 h-5 text-emerald-400" />
                  : <ToggleLeft className="w-8 h-5 text-muted-foreground" />
                }
              </button>
              <div>
                <span className={`text-sm font-medium ${manualOrderSendToGrinders ? "text-emerald-400" : "text-muted-foreground"}`}>
                  {manualOrderSendToGrinders ? "Send to Grinders" : "Manual Assign Only"}
                </span>
                <p className="text-[10px] text-muted-foreground">
                  {manualOrderSendToGrinders
                    ? "Grinders will see this order and can submit bids from their dashboard"
                    : "Only staff sees this order. Use Override Assign below to assign a grinder"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input type="checkbox" checked={manualOrderIsRush} onChange={(e) => setManualOrderIsRush(e.target.checked)} className="rounded" data-testid="checkbox-manual-rush" />
                Rush
              </label>
            </div>
          </div>
          <Button
            className="w-full bg-amber-600"
            disabled={!manualOrderService || !manualOrderPrice || createManualOrderMutation.isPending}
            data-testid="button-create-manual-order"
            onClick={() => {
              const dueDate = new Date();
              dueDate.setDate(dueDate.getDate() + Number(manualOrderDueDays || 3));
              createManualOrderMutation.mutate({
                id: `MO-${Date.now().toString(36)}`,
                serviceId: manualOrderService,
                customerPrice: manualOrderPrice,
                platform: manualOrderPlatform || null,
                gamertag: manualOrderGamertag || null,
                orderDueDate: dueDate.toISOString(),
                isRush: manualOrderIsRush,
                isEmergency: false,
                complexity: Number(manualOrderComplexity),
                notes: manualOrderNotes || null,
                isManual: true,
                visibleToGrinders: manualOrderSendToGrinders,
                status: "Open",
              });
            }}
          >
            {createManualOrderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Create Order
          </Button>
        </CardContent>
      </Card>

      {(() => {
        const assignableOrders = allOrders.filter(o => o.status === "Open" || o.status === "Bidding Closed");
        const selectedOrder = assignableOrders.find(o => o.id === assignOrderId);
        const orderBids = (bidsList || []).filter(b => b.orderId === assignOrderId);
        const selectedGrinder = allGrinders.find(g => g.id === assignGrinderId);

        return assignableOrders.length > 0 ? (
          <Card className="border-cyan-500/20" data-testid="card-staff-assign">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                Staff Override Assign
                <Badge className="bg-cyan-500/20 text-cyan-400 ml-auto">{assignableOrders.length} assignable</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-medium">Select Order</label>
                    <Select value={assignOrderId} onValueChange={(v) => { setAssignOrderId(v); setAssignGrinderId(""); setAssignBidAmount(""); }}>
                      <SelectTrigger data-testid="select-assign-order">
                        <SelectValue placeholder="Choose an order to assign" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableOrders.map(o => {
                          const svc = (servicesList || []).find(s => s.id === o.serviceId);
                          return (
                            <SelectItem key={o.id} value={o.id}>
                              {o.mgtOrderNumber ? `#${o.mgtOrderNumber}` : o.id} — {svc?.name || o.serviceId} ({o.status})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-medium">Assign To Grinder</label>
                    <Select value={assignGrinderId} onValueChange={(v) => {
                      setAssignGrinderId(v);
                      const existingBid = orderBids.find(b => b.grinderId === v && b.status === "Pending");
                      if (existingBid) setAssignBidAmount(existingBid.bidAmount);
                    }}>
                      <SelectTrigger data-testid="select-assign-grinder">
                        <SelectValue placeholder="Choose a grinder" />
                      </SelectTrigger>
                      <SelectContent>
                        {allGrinders.map(g => {
                          const hasBid = orderBids.some(b => b.grinderId === g.id && b.status === "Pending");
                          return (
                            <SelectItem key={g.id} value={g.id}>
                              {g.name} ({g.activeOrders}/{g.capacity}){hasBid ? " - has bid" : ""}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedOrder && (
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Order Details</span>
                      <Badge variant="outline" className="text-[10px]">{selectedOrder.status}</Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Price: </span>
                        <span className="text-emerald-400 font-medium">{formatCurrency(Number(selectedOrder.customerPrice))}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Platform: </span>
                        <span>{selectedOrder.platform || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Bids: </span>
                        <span className="text-blue-400">{orderBids.length}</span>
                      </div>
                    </div>
                    {orderBids.length > 0 && (
                      <div className="space-y-1 mt-1">
                        <span className="text-[10px] text-muted-foreground">Existing bids:</span>
                        {orderBids.filter(b => b.status === "Pending").map(b => {
                          const bidGrinder = allGrinders.find(g => g.id === b.grinderId);
                          return (
                            <div key={b.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-white/5" data-testid={`bid-option-${b.id}`}>
                              <span>{bidGrinder?.name || b.grinderId}</span>
                              <span className="text-emerald-400">{formatCurrency(Number(b.bidAmount))}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-medium">Grinder Pay Amount ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Amount to pay grinder"
                      value={assignBidAmount}
                      onChange={(e) => setAssignBidAmount(e.target.value)}
                      data-testid="input-assign-amount"
                    />
                    {selectedOrder && assignBidAmount && (
                      <div className="text-[10px] text-muted-foreground">
                        Margin: <span className={Number(selectedOrder.customerPrice) - Number(assignBidAmount) >= 0 ? "text-emerald-400" : "text-red-400"}>
                          {formatCurrency(Number(selectedOrder.customerPrice) - Number(assignBidAmount))}
                        </span>
                        {" "}({Number(selectedOrder.customerPrice) > 0 ? (((Number(selectedOrder.customerPrice) - Number(assignBidAmount)) / Number(selectedOrder.customerPrice)) * 100).toFixed(1) : 0}%)
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-medium">Notes (optional)</label>
                    <Input
                      placeholder="Reason for override assignment"
                      value={assignNotes}
                      onChange={(e) => setAssignNotes(e.target.value)}
                      data-testid="input-assign-notes"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="default"
                    data-testid="button-staff-assign"
                    disabled={!assignOrderId || !assignGrinderId || !assignBidAmount || staffAssignMutation.isPending}
                    onClick={() => {
                      staffAssignMutation.mutate({
                        orderId: assignOrderId,
                        grinderId: assignGrinderId,
                        bidAmount: assignBidAmount,
                        notes: assignNotes || undefined,
                      });
                    }}
                  >
                    {staffAssignMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Target className="w-3 h-3 mr-1" />}
                    Assign Grinder
                  </Button>
                  {selectedGrinder && (
                    <span className="text-xs text-muted-foreground">
                      Assigning <span className="text-cyan-400 font-medium">{selectedGrinder.name}</span> to order{" "}
                      <span className="text-cyan-400 font-medium">{selectedOrder?.mgtOrderNumber ? `#${selectedOrder.mgtOrderNumber}` : assignOrderId}</span>
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null;
      })()}

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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <PipelineStep label="Open" count={openOrders} total={totalOrders} color="border-blue-500/30 bg-blue-500/5 text-blue-400" icon={Clock} hideArrow />
            <PipelineStep label="Assigned" count={assignedOrders} total={totalOrders} color="border-amber-500/30 bg-amber-500/5 text-amber-400" icon={Target} hideArrow />
            <PipelineStep label="In Progress" count={inProgressOrders} total={totalOrders} color="border-purple-500/30 bg-purple-500/5 text-purple-400" icon={Timer} hideArrow />
            <PipelineStep label="Completed" count={completedOrders} total={totalOrders} color="border-emerald-500/30 bg-emerald-500/5 text-emerald-400" icon={CheckCircle} hideArrow />
            <PipelineStep label="Cancelled" count={cancelledOrders} total={totalOrders} color="border-red-500/30 bg-red-500/5 text-red-400" icon={AlertTriangle} isLast hideArrow />
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
              <AnimatedRing percent={fleetUtilization} color={fleetUtilization > 80 ? "#f87171" : fleetUtilization > 60 ? "#fbbf24" : "#34d399"} label="Limit Used" value={`${fleetUtilization.toFixed(0)}%`} size={90} />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs text-muted-foreground">Available</span>
                  <span className="text-sm font-bold ml-auto">{availableGrinders}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-xs text-muted-foreground">At Limit</span>
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
                  <TooltipContent>{g.name}: {g.activeOrders}/{g.capacity} orders ({g.category}) - {(g as any).availabilityStatus || "available"}</TooltipContent>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(grinderUpdates && grinderUpdates.length > 0) && (
          <Card className="border-blue-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                Grinder Order Updates
                <Badge className="bg-blue-500/20 text-blue-400 ml-auto">{grinderUpdates.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {grinderUpdates.slice(0, 15).map((u: any) => {
                  const grinder = (grindersList || []).find(g => g.id === u.grinderId);
                  return (
                    <div key={u.id} className="p-3 rounded-lg bg-white/5 border border-white/10" data-testid={`card-grinder-update-${u.id}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-blue-400">{grinder?.name || u.grinderId}</span>
                          <Badge variant="outline" className="text-[10px]">{u.updateType}</Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{new Date(u.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Order {u.orderId}: {u.message}</p>
                      {u.newDeadline && <p className="text-xs text-yellow-400 mt-1">New deadline: {new Date(u.newDeadline).toLocaleDateString()}</p>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {(payoutReqs && payoutReqs.length > 0) && (
          <Card className="border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Banknote className="w-5 h-5 text-green-400" />
                Payout Requests
                <Badge className="bg-green-500/20 text-green-400 ml-auto">
                  {payoutReqs.filter((p: any) => p.status === "Pending").length} pending
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {payoutReqs.slice(0, 15).map((p: any) => {
                  const grinder = (grindersList || []).find(g => g.id === p.grinderId);
                  return (
                    <div key={p.id} className="p-3 rounded-lg bg-white/5 border border-white/10" data-testid={`card-payout-req-${p.id}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{grinder?.name || p.grinderId}</span>
                          <span className="text-sm text-green-400 font-bold">${Number(p.amount).toFixed(2)}</span>
                        </div>
                        <Badge className={
                          p.status === "Approved" ? "bg-green-500/20 text-green-400" :
                          p.status === "Denied" ? "bg-red-500/20 text-red-400" :
                          "bg-yellow-500/20 text-yellow-400"
                        }>{p.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Order {p.orderId} &middot; {new Date(p.createdAt).toLocaleString()}</p>
                      {p.notes && <p className="text-xs text-muted-foreground mt-1">{p.notes}</p>}
                      {p.status === "Pending" && (
                        <div className="flex items-center gap-2 mt-2">
                          <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" data-testid={`button-approve-payout-${p.id}`}
                            disabled={payoutMutation.isPending}
                            onClick={() => payoutMutation.mutate({ id: p.id, status: "Approved" })}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10" data-testid={`button-deny-payout-${p.id}`}
                            disabled={payoutMutation.isPending}
                            onClick={() => payoutMutation.mutate({ id: p.id, status: "Denied" })}>
                            Deny
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Elite vs Grinder Performance Comparison */}
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
                <div className="flex items-center gap-2 mb-3">
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
                  <span className="text-sm font-bold text-amber-400">{formatCurrency(Number(eliteVsGrinderMetrics.elite?.totalEarnings || 0))}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
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
                  <span className="text-sm font-bold text-blue-400">{formatCurrency(Number(eliteVsGrinderMetrics.grinders?.totalEarnings || 0))}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Loading metrics...</p>
          )}
        </CardContent>
      </Card>

      {/* Elite Requests + Strike Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-amber-500/20" data-testid="card-elite-requests">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              Elite Requests Review
              {eliteRequestsList && <Badge className="bg-amber-500/20 text-amber-400 ml-auto">{eliteRequestsList.filter((r: any) => r.status === "Pending").length} pending</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {(!eliteRequestsList || eliteRequestsList.length === 0) && <p className="text-muted-foreground text-sm">No elite requests</p>}
              {(eliteRequestsList || []).map((req: any) => {
                const grinder = allGrinders.find(g => g.id === req.grinderId);
                return (
                  <div key={req.id} className={`p-3 rounded-lg bg-white/5 border ${req.status === "Pending" ? "border-amber-500/30" : "border-white/10"}`} data-testid={`card-elite-req-${req.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{grinder?.name || req.grinderId}</span>
                      <Badge className={
                        req.status === "Approved" ? "bg-emerald-500/20 text-emerald-400" :
                        req.status === "Denied" ? "bg-red-500/20 text-red-400" :
                        "bg-amber-500/20 text-amber-400"
                      }>{req.status}</Badge>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 text-[10px] text-muted-foreground mb-2">
                      <div className="text-center"><p className="font-bold text-foreground">{req.completedOrders ?? grinder?.completedOrders ?? 0}</p>Orders</div>
                      <div className="text-center"><p className="font-bold text-foreground">{Number(req.winRate ?? grinder?.winRate ?? 0).toFixed(0)}%</p>Win Rate</div>
                      <div className="text-center"><p className="font-bold text-foreground">{req.avgQualityRating ? (Number(req.avgQualityRating) / 20).toFixed(1) : "N/A"}/5</p>Quality</div>
                      <div className="text-center"><p className="font-bold text-foreground">{Number(req.onTimeRate ?? 0).toFixed(0)}%</p>On-Time</div>
                      <div className="text-center"><p className="font-bold text-foreground">{req.strikes ?? grinder?.strikes ?? 0}</p>Strikes</div>
                    </div>
                    {req.decisionNotes && <p className="text-xs text-muted-foreground italic mb-2">{req.decisionNotes}</p>}
                    {req.status === "Pending" && (
                      <div className="flex items-center gap-2">
                        <Button size="sm" className="text-xs bg-emerald-600" data-testid={`button-approve-elite-${req.id}`}
                          disabled={eliteReqMutation.isPending}
                          onClick={() => eliteReqMutation.mutate({ id: req.id, status: "Approved" })}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs border-red-500/30 text-red-400" data-testid={`button-deny-elite-${req.id}`}
                          disabled={eliteReqMutation.isPending}
                          onClick={() => eliteReqMutation.mutate({ id: req.id, status: "Denied" })}>
                          Deny
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20" data-testid="card-strike-management">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Strike Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-2">
                <Select value={strikeGrinderId} onValueChange={setStrikeGrinderId}>
                  <SelectTrigger data-testid="select-strike-grinder">
                    <SelectValue placeholder="Select grinder" />
                  </SelectTrigger>
                  <SelectContent>
                    {allGrinders.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name} ({g.strikes} strikes)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Reason for strike action"
                  value={strikeReason}
                  onChange={(e) => setStrikeReason(e.target.value)}
                  data-testid="input-strike-reason"
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="destructive" className="text-xs"
                    data-testid="button-add-strike"
                    disabled={!strikeGrinderId || !strikeReason || strikeMutation.isPending}
                    onClick={() => { strikeMutation.mutate({ grinderId: strikeGrinderId, action: "add", reason: strikeReason }); setStrikeReason(""); }}>
                    Add Strike
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs"
                    data-testid="button-remove-strike"
                    disabled={!strikeGrinderId || !strikeReason || strikeMutation.isPending}
                    onClick={() => { strikeMutation.mutate({ grinderId: strikeGrinderId, action: "remove", reason: strikeReason }); setStrikeReason(""); }}>
                    Remove Strike
                  </Button>
                </div>
              </div>
              {allGrinders.filter(g => g.suspended).length > 0 && (
                <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 space-y-2">
                  <p className="text-xs font-semibold text-red-400 flex items-center gap-1"><Ban className="w-3 h-3" /> Suspended Grinders</p>
                  {allGrinders.filter(g => g.suspended).map(g => (
                    <div key={g.id} className="flex items-center justify-between gap-2 text-xs" data-testid={`row-suspended-${g.id}`}>
                      <span className="font-medium truncate">{g.name}</span>
                      <span className="text-red-400 font-bold">${parseFloat(g.outstandingFine || "0").toFixed(2)}</span>
                      <Button size="sm" variant="outline" className="text-xs h-6 px-2 border-green-500/30 text-green-400 hover:bg-green-500/10"
                        data-testid={`button-pay-fine-${g.id}`}
                        disabled={finePayMutation.isPending}
                        onClick={() => finePayMutation.mutate(g.id)}>
                        Mark Paid
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(!strikeLogsList || strikeLogsList.length === 0) && <p className="text-muted-foreground text-xs">No strike logs</p>}
                {(strikeLogsList || []).slice(0, 10).map((log: any) => {
                  const grinder = allGrinders.find(g => g.id === log.grinderId);
                  return (
                    <div key={log.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 text-xs" data-testid={`card-strike-${log.id}`}>
                      <Badge className={log.action === "add" ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"} variant="outline">
                        {log.action === "add" ? "+" : "-"}
                      </Badge>
                      <span className="font-medium flex-1 truncate">{grinder?.name || log.grinderId}</span>
                      {parseFloat(log.fineAmount || "0") > 0 && (
                        <Badge className={log.finePaid ? "bg-green-500/15 text-green-400 text-[9px]" : "bg-red-500/15 text-red-400 text-[9px]"}>
                          ${parseFloat(log.fineAmount).toFixed(0)} {log.finePaid ? "Paid" : "Owed"}
                        </Badge>
                      )}
                      <span className="text-muted-foreground truncate max-w-[100px]">{log.reason}</span>
                      <span className="text-muted-foreground text-[10px]">{new Date(log.createdAt).toLocaleDateString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-purple-500/20" data-testid="card-order-limits">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Grinder Order Limits
            <Badge className="bg-purple-500/20 text-purple-400 ml-auto">{allGrinders.length} grinders</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {allGrinders.map(g => (
              <div key={g.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10" data-testid={`row-limit-${g.id}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{g.name}</span>
                    {g.suspended && <Badge className="bg-red-500/20 text-red-400 text-[9px]"><Ban className="w-2.5 h-2.5 mr-0.5" />Suspended</Badge>}
                    {!(g as any).rulesAccepted && <Badge className="bg-amber-500/20 text-amber-400 text-[9px]">Rules Pending</Badge>}
                    <Badge variant="outline" className="text-[10px]">{g.category}</Badge>
                    <Badge className={`text-[10px] ${
                      (g as any).availabilityStatus === "busy" ? "bg-yellow-500/20 text-yellow-400" :
                      (g as any).availabilityStatus === "away" ? "bg-orange-500/20 text-orange-400" :
                      (g as any).availabilityStatus === "offline" ? "bg-red-500/20 text-red-400" :
                      "bg-emerald-500/20 text-emerald-400"
                    }`}>
                      {(g as any).availabilityStatus || "available"}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {g.activeOrders} active / {g.capacity} limit
                    {(g as any).availabilityNote && ` · ${(g as any).availabilityNote}`}
                  </span>
                </div>
                {editLimitGrinderId === g.id ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      className="w-16 h-7 text-xs"
                      value={editLimitValue}
                      onChange={(e) => setEditLimitValue(e.target.value)}
                      data-testid={`input-limit-${g.id}`}
                    />
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                      data-testid={`button-save-limit-${g.id}`}
                      disabled={!editLimitValue || updateLimitMutation.isPending}
                      onClick={() => updateLimitMutation.mutate({ grinderId: g.id, capacity: parseInt(editLimitValue) })}>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                      onClick={() => { setEditLimitGrinderId(""); setEditLimitValue(""); }}>
                      <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${g.activeOrders >= g.capacity ? "text-red-400" : "text-emerald-400"}`}>{g.capacity}</span>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground"
                      data-testid={`button-edit-limit-${g.id}`}
                      onClick={() => { setEditLimitGrinderId(g.id); setEditLimitValue(String(g.capacity)); }}>
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {(isOwner || user?.role === "staff") && (
        <Card className="border-amber-500/20" data-testid="card-owner-profiles">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              Edit Grinder Profiles
              <Badge className="bg-amber-500/20 text-amber-400 ml-auto">{allGrinders.length} grinders</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {allGrinders.map(g => (
                <div key={g.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10" data-testid={`row-profile-${g.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{g.name}</span>
                      <Badge variant="outline" className="text-[10px]">{g.category}</Badge>
                      <Badge variant="outline" className="text-[10px]">{g.tier}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {g.activeOrders}/{g.capacity} orders · {g.completedOrders} completed · {g.strikes} strikes
                      </span>
                    </div>
                    {g.notes && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{g.notes}</p>}
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-amber-400 text-xs"
                    data-testid={`button-edit-profile-${g.id}`}
                    onClick={() => {
                      setEditProfileGrinder(g);
                      setEditProfileName(g.name);
                      setEditProfileCategory(g.category);
                      setEditProfileTier(g.tier);
                      setEditProfileCapacity(String(g.capacity));
                      setEditProfileNotes(g.notes || "");
                    }}>
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editProfileGrinder} onOpenChange={(open) => !open && setEditProfileGrinder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              Edit Profile: {editProfileGrinder?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <Input value={editProfileName} onChange={(e) => setEditProfileName(e.target.value)} data-testid="input-profile-name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Select value={editProfileCategory} onValueChange={setEditProfileCategory}>
                  <SelectTrigger data-testid="select-profile-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grinder">Grinder</SelectItem>
                    <SelectItem value="Elite Grinder">Elite Grinder</SelectItem>
                    <SelectItem value="VC Grinder">VC Grinder</SelectItem>
                    <SelectItem value="Event Grinder">Event Grinder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tier</label>
                <Select value={editProfileTier} onValueChange={setEditProfileTier}>
                  <SelectTrigger data-testid="select-profile-tier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Bronze">Bronze</SelectItem>
                    <SelectItem value="Silver">Silver</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="Platinum">Platinum</SelectItem>
                    <SelectItem value="Diamond">Diamond</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Order Limit</label>
              <Input type="number" min="1" max="20" value={editProfileCapacity} onChange={(e) => setEditProfileCapacity(e.target.value)} data-testid="input-profile-capacity" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea value={editProfileNotes} onChange={(e) => setEditProfileNotes(e.target.value)} placeholder="Owner notes about this grinder..." data-testid="input-profile-notes" />
            </div>
            <Button className="w-full bg-amber-600"
              data-testid="button-save-profile"
              disabled={updateProfileMutation.isPending}
              onClick={() => {
                const data: any = {};
                if (editProfileName && editProfileName !== editProfileGrinder?.name) data.name = editProfileName;
                if (editProfileCategory && editProfileCategory !== editProfileGrinder?.category) data.category = editProfileCategory;
                if (editProfileTier && editProfileTier !== editProfileGrinder?.tier) data.tier = editProfileTier;
                const capNum = parseInt(editProfileCapacity);
                if (!isNaN(capNum) && capNum > 0 && capNum !== editProfileGrinder?.capacity) data.capacity = capNum;
                if (editProfileNotes !== (editProfileGrinder?.notes || "")) data.notes = editProfileNotes;
                if (Object.keys(data).length === 0) { toast({ title: "No changes to save" }); return; }
                updateProfileMutation.mutate({ grinderId: editProfileGrinder.id, data });
              }}>
              {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
              Save Profile Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Composer */}
      <Card className="border-blue-500/20" data-testid="card-alert-composer">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            Alert Composer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Input
                placeholder="Alert title"
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                data-testid="input-alert-title"
              />
              <Textarea
                placeholder="Alert message"
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                className="resize-none"
                data-testid="input-alert-message"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={alertSeverity} onValueChange={setAlertSeverity}>
                  <SelectTrigger className="w-32" data-testid="select-alert-severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="danger">Danger</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={alertTarget} onValueChange={setAlertTarget}>
                  <SelectTrigger className="w-40" data-testid="select-alert-target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grinders</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
                {alertTarget === "individual" && (
                  <Select value={alertGrinderId} onValueChange={setAlertGrinderId}>
                    <SelectTrigger className="w-40" data-testid="select-alert-grinder">
                      <SelectValue placeholder="Select grinder" />
                    </SelectTrigger>
                    <SelectContent>
                      {allGrinders.map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button size="sm" className="bg-blue-600 gap-1"
                  data-testid="button-send-alert"
                  disabled={!alertTitle || !alertMessage || alertMutation.isPending}
                  onClick={() => {
                    alertMutation.mutate({
                      targetType: alertTarget,
                      grinderId: alertTarget === "individual" ? alertGrinderId : undefined,
                      title: alertTitle,
                      message: alertMessage,
                      severity: alertSeverity,
                    });
                    setAlertTitle("");
                    setAlertMessage("");
                  }}>
                  <Send className="w-3 h-3" /> Send
                </Button>
              </div>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {(!staffAlertsList || staffAlertsList.length === 0) && <p className="text-muted-foreground text-sm">No alerts sent</p>}
              {(staffAlertsList || []).slice(0, 10).map((alert: any) => (
                <div key={alert.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5" data-testid={`card-alert-${alert.id}`}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    alert.severity === "danger" ? "bg-red-400" :
                    alert.severity === "warning" ? "bg-amber-400" :
                    alert.severity === "success" ? "bg-emerald-400" :
                    "bg-blue-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{alert.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{alert.message}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{alert.readCount ?? 0} read</Badge>
                  <Button size="icon" variant="ghost" data-testid={`button-delete-alert-${alert.id}`}
                    disabled={deleteAlertMutation.isPending}
                    onClick={() => deleteAlertMutation.mutate(alert.id)}>
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

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
                  <div key={a.id} className="flex flex-wrap items-center gap-3 p-2.5 rounded-lg bg-white/5" data-testid={`row-replacement-${a.id}`}>
                    <div className="flex items-center gap-1.5 text-sm flex-1 min-w-[140px]">
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
      <Card className="glass-panel border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="w-5 h-5 text-green-400" />
            Payout Management
            {pendingPayouts.length > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-400 ml-2">{pendingPayouts.length} pending</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
              <p className="text-xl font-bold text-yellow-400" data-testid="text-total-owed">{formatCurrency(totalOwed)}</p>
              <p className="text-[10px] text-muted-foreground">Outstanding</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
              <p className="text-xl font-bold text-green-400" data-testid="text-total-paid">{formatCurrency(totalPaidOut)}</p>
              <p className="text-[10px] text-muted-foreground">Paid Out</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
              <p className="text-xl font-bold text-blue-400">{allPayoutReqs.length}</p>
              <p className="text-[10px] text-muted-foreground">Total Requests</p>
            </div>
          </div>

          {[...pendingPayouts, ...approvedPayouts].length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Payouts</p>
              {[...pendingPayouts, ...approvedPayouts].map((p: any) => {
                const grinder = allGrinders.find(g => g.id === p.grinderId);
                return (
                  <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/5" data-testid={`staff-payout-${p.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{grinder?.name || p.grinderId}</span>
                        <span className="text-green-400 font-bold">{formatCurrency(Number(p.amount))}</span>
                        <Badge variant="outline" className={`text-[10px] ${p.status === "Approved" ? "text-blue-400 border-blue-500/30" : "text-yellow-400 border-yellow-500/30"}`}>{p.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        {p.payoutPlatform && (
                          <Badge variant="outline" className="text-[10px] border-border/50 gap-1">
                            <CreditCard className="w-3 h-3" /> {p.payoutPlatform}: {p.payoutDetails || "N/A"}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">Order {p.orderId.slice(0, 10)}</span>
                        <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                      {p.notes && <p className="text-xs text-muted-foreground mt-1">{p.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {p.status === "Pending" && (
                        <>
                          <Button size="sm" variant="outline" className="text-xs bg-blue-500/10 border-blue-500/30 text-blue-400 h-7 px-2" data-testid={`button-approve-payout-${p.id}`}
                            disabled={payoutMutation.isPending}
                            onClick={() => payoutMutation.mutate({ id: p.id, status: "Approved" })}>
                            <CheckCircle className="w-3 h-3 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs bg-red-500/10 border-red-500/30 text-red-400 h-7 px-2" data-testid={`button-deny-payout-${p.id}`}
                            disabled={payoutMutation.isPending}
                            onClick={() => payoutMutation.mutate({ id: p.id, status: "Denied" })}>
                            <X className="w-3 h-3 mr-1" /> Deny
                          </Button>
                        </>
                      )}
                      {(p.status === "Approved" || p.status === "Pending") && (
                        <Button size="sm" className="text-xs bg-green-600 h-7 px-2" data-testid={`button-mark-paid-${p.id}`}
                          disabled={payoutMutation.isPending}
                          onClick={() => payoutMutation.mutate({ id: p.id, status: "Paid" })}>
                          <Banknote className="w-3 h-3 mr-1" /> Mark Paid
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">No pending payouts.</p>
          )}

          {paidPayouts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recently Paid ({paidPayouts.length})</p>
              {paidPayouts.slice(0, 5).map((p: any) => {
                const grinder = allGrinders.find(g => g.id === p.grinderId);
                return (
                  <div key={p.id} className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-white/5 opacity-70 text-sm" data-testid={`staff-paid-${p.id}`}>
                    <span className="font-medium">{grinder?.name || p.grinderId}</span>
                    <span className="text-green-400">{formatCurrency(Number(p.amount))}</span>
                    {p.payoutPlatform && <span className="text-xs text-muted-foreground">via {p.payoutPlatform}</span>}
                    <Badge className="bg-green-500/20 text-green-400 text-[10px]">Paid</Badge>
                    {p.paidAt && <span className="text-xs text-muted-foreground ml-auto">{new Date(p.paidAt).toLocaleDateString()}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-panel border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="w-5 h-5 text-primary" />
            How to Use the Command Center
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { step: 1, icon: Eye, title: "Monitor the Pipeline", desc: "The pipeline at the top shows order flow from Open to Delivered. Click any stage to see orders at that step." },
              { step: 2, icon: Gavel, title: "Review Bids & Assign", desc: "Check the Pending Bids section to review grinder proposals. Accept or deny bids to move orders forward." },
              { step: 3, icon: UserCheck, title: "Override Assign", desc: "Use Staff Override to manually assign any grinder to an order, bypassing the bidding process when needed." },
              { step: 4, icon: Settings, title: "Manage Order Limits", desc: "Adjust individual grinder order limits in the Order Limits card. Default is 3 for regular grinders, 5 for elite." },
              { step: 5, icon: Bell, title: "Send Alerts", desc: "Use Staff Alerts to broadcast messages to all grinders or target individual grinders with different severity levels." },
              { step: 6, icon: Shield, title: "Manage Strikes", desc: "Add or remove strikes from grinders with documented reasons. Grinders must acknowledge strikes on their dashboard." },
              { step: 7, icon: Crown, title: "Review Elite Requests", desc: "When grinders apply for Elite status, review their performance metrics and approve or deny from the Elite section." },
              { step: 8, icon: FileCheck, title: "Process Updates & Payouts", desc: "Review grinder progress updates and payout requests. Approve payouts once work is verified complete." },
              { step: 9, icon: BarChart3, title: "Track Analytics", desc: "Use revenue, margin, and performance cards to monitor business health. The system auto-calculates profit margins." },
              { step: 10, icon: Activity, title: "Audit Trail", desc: "Every action is logged in the Audit Trail. Review who did what and when for full accountability." },
            ].map(({ step, icon: StepIcon, title, desc }) => (
              <div key={step} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5" data-testid={`staff-guide-step-${step}`}>
                <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-sm font-bold">{step}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <StepIcon className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="font-semibold text-sm">{title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="text-blue-400 font-medium">Pro tip:</span> The dashboard auto-refreshes every 10 seconds. New orders from the MGT Bot in Discord are automatically imported. Keep this dashboard open alongside Discord for the best workflow.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
}
