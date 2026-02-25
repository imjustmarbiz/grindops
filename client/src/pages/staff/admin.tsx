import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useStaffData } from "@/hooks/use-staff-data";
import { formatCurrency, categoryIcon, pluralize } from "@/lib/staff-utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Crown, AlertTriangle, Users, Shield, Ban, Gavel, Repeat, ClipboardList, Send, Trash2,
  ArrowRight, CheckCircle, Loader2, Zap, Clock, Search, Settings,
} from "lucide-react";
import { BiddingCountdownPanel } from "@/components/bidding-countdown";
import { AnimatedPage, FadeInUp } from "@/lib/animations";


export default function StaffAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const {
    allGrindersIncludingRemoved: allGrinders,
    assignments: allAssignments,
    orders: allOrders,
    eliteRequests: eliteRequestsList,
    strikeLogs: strikeLogsList,
  } = useStaffData();

  const [strikeGrinderId, setStrikeGrinderId] = useState("");
  const [strikeReason, setStrikeReason] = useState("");
  const [denyEliteDialogOpen, setDenyEliteDialogOpen] = useState(false);
  const [denyEliteReqId, setDenyEliteReqId] = useState("");
  const [denyEliteReason, setDenyEliteReason] = useState("");
  const [editLimitGrinderId, setEditLimitGrinderId] = useState("");
  const [editLimitValue, setEditLimitValue] = useState("");
  const [removeGrinder, setRemoveGrinder] = useState<any>(null);
  const [deleteHistoricalData, setDeleteHistoricalData] = useState(false);
  const [editProfileGrinder, setEditProfileGrinder] = useState<any>(null);
  const [editProfileName, setEditProfileName] = useState("");
  const [editProfileCategory, setEditProfileCategory] = useState("");
  const [editProfileCapacity, setEditProfileCapacity] = useState("");
  const [editProfileNotes, setEditProfileNotes] = useState("");
  const [checkupOrderSearch, setCheckupOrderSearch] = useState("");
  const [taskGrinderId, setTaskGrinderId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("normal");
  const [taskOrderId, setTaskOrderId] = useState("");

  const { data: checkupConfig } = useQuery<{ enabled: boolean; skippedOrders: string[] }>({
    queryKey: ["/api/daily-checkups/config"],
  });

  const toggleGlobalCheckupsMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest("PATCH", "/api/daily-checkups/global", { enabled });
      return res.json();
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-checkups/config"] });
      toast({ title: enabled ? "Daily checkups enabled for all orders" : "Daily checkups disabled for all orders" });
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const toggleOrderCheckupMutation = useMutation({
    mutationFn: async ({ orderId, skip }: { orderId: string; skip: boolean }) => {
      const res = await apiRequest("PATCH", `/api/daily-checkups/order/${orderId}`, { skip });
      return res.json();
    },
    onSuccess: (_, { skip }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-checkups/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: skip ? "Daily checkups disabled for this order" : "Daily checkups enabled for this order" });
    },
    onError: () => toast({ title: "Failed to update order", variant: "destructive" }),
  });

  const eliteReqMutation = useMutation({
    mutationFn: async ({ id, status, decisionNotes }: { id: string; status: string; decisionNotes?: string }) => {
      const res = await apiRequest("PATCH", `/api/staff/elite-requests/${id}`, { status, reviewedBy: "staff", decisionNotes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/elite-requests"] });
      toast({ title: "Elite request updated" });
    },
  });

  const { data: staffTasks = [] } = useQuery<any[]>({
    queryKey: ["/api/staff/grinder-tasks"],
  });

  const sendTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/staff/grinder-tasks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/grinder-tasks"] });
      setTaskGrinderId("");
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("normal");
      setTaskOrderId("");
      toast({ title: "Task sent", description: "The grinder will see this on their To-Do List." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/staff/grinder-tasks/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/grinder-tasks"] });
      toast({ title: "Task removed" });
    },
  });

  const { data: strikeAppeals = [] } = useQuery<any[]>({
    queryKey: ["/api/staff/strike-appeals"],
  });

  const [appealReviewId, setAppealReviewId] = useState<string | null>(null);
  const [appealReviewNote, setAppealReviewNote] = useState("");

  const appealReviewMutation = useMutation({
    mutationFn: async ({ id, status, reviewNote }: { id: string; status: string; reviewNote: string }) => {
      const res = await apiRequest("PATCH", `/api/staff/strike-appeals/${id}`, { status, reviewNote });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/strike-appeals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/strike-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      setAppealReviewId(null);
      setAppealReviewNote("");
      toast({ title: "Appeal reviewed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const strikeMutation = useMutation({
    mutationFn: async (data: { grinderId: string; action: string; reason: string }) => {
      const res = await apiRequest("POST", "/api/staff/strikes", { ...data, createdBy: "staff" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/strike-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      toast({ title: "Strike updated" });
    },
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

  const removeGrinderMutation = useMutation({
    mutationFn: async ({ grinderId, deleteHistory }: { grinderId: string; deleteHistory: boolean }) => {
      const res = await apiRequest("DELETE", `/api/grinders/${grinderId}?deleteHistory=${deleteHistory}`);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payout-requests"] });
      setRemoveGrinder(null);
      setDeleteHistoricalData(false);
      toast({ title: variables.deleteHistory ? "Grinder and all historical data permanently deleted" : "Grinder access removed (historical data preserved)" });
    },
    onError: () => toast({ title: "Failed to remove grinder", variant: "destructive" }),
  });

  const replacedAssignments = allAssignments.filter(a => a.wasReassigned);
  const totalOriginalGrinderPay = replacedAssignments.reduce((s, a) => s + Number(a.originalGrinderPay || 0), 0);
  const totalReplacementGrinderPay = replacedAssignments.reduce((s, a) => s + Number(a.replacementGrinderPay || 0), 0);
  const replacementRate = allAssignments.length > 0 ? (replacedAssignments.length / allAssignments.length) * 100 : 0;
  const grindersReplacedOff = Array.from(new Set(replacedAssignments.map(a => a.originalGrinderId).filter(Boolean)));

  return (
    <AnimatedPage className="space-y-5 sm:space-y-6" data-testid="page-staff-admin">
      <FadeInUp>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Settings className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight" data-testid="text-admin-title">
                Admin Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Elite requests, strikes, limits, and profiles</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 gap-1">
              <Crown className="w-3 h-3" />
              {(eliteRequestsList || []).filter((r: any) => r.status === "Pending").length} elite pending
            </Badge>
            <Badge className="bg-red-500/15 text-red-400 border border-red-500/20 gap-1" data-testid="badge-suspended-count">
              <AlertTriangle className="w-3 h-3" />
              {allGrinders.filter(g => g.suspended).length} suspended
            </Badge>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
        <BiddingCountdownPanel variant="compact" />
      </FadeInUp>

      {isOwner && (
        <FadeInUp>
          <Card className="border-0 bg-gradient-to-br from-blue-500/[0.08] via-background to-blue-900/[0.04] overflow-hidden relative" data-testid="card-daily-checkups">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-blue-500/[0.04] -translate-y-12 translate-x-12" />
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-400" />
                </div>
                Daily Checkups
                <Badge className={`ml-auto text-xs ${checkupConfig?.enabled !== false ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-red-500/15 text-red-400 border border-red-500/20"}`}>
                  {checkupConfig?.enabled !== false ? "Active" : "Disabled"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div>
                  <p className="text-sm font-medium">Global Daily Checkups</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Enable or disable checkups for all orders system-wide</p>
                </div>
                <Switch
                  checked={checkupConfig?.enabled !== false}
                  onCheckedChange={(checked) => toggleGlobalCheckupsMutation.mutate(checked)}
                  disabled={toggleGlobalCheckupsMutation.isPending}
                  data-testid="switch-global-checkups"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-medium">Per-Order Overrides</p>
                  <Badge className="bg-white/5 text-muted-foreground border border-white/10 text-xs">
                    {checkupConfig?.skippedOrders?.length || 0} skipped
                  </Badge>
                </div>
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by order ID or MGT #..."
                    value={checkupOrderSearch}
                    onChange={(e) => setCheckupOrderSearch(e.target.value)}
                    className="pl-8 h-8 text-sm bg-background/50 border-white/10"
                    data-testid="input-checkup-order-search"
                  />
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {(() => {
                    const activeOrders = (allOrders || []).filter((o: any) =>
                      o.status === "In Progress" || o.status === "Open" || o.status === "Bidding Open" || o.status === "Bidding Closed" || o.status === "Need Replacement"
                    );
                    const filtered = checkupOrderSearch.trim()
                      ? activeOrders.filter((o: any) => {
                          const q = checkupOrderSearch.toLowerCase();
                          return o.id.toLowerCase().includes(q) || (o.mgtOrderNumber && String(o.mgtOrderNumber).includes(q));
                        })
                      : activeOrders;
                    if (filtered.length === 0) return <p className="text-xs text-muted-foreground py-2">No active orders found</p>;
                    return filtered.slice(0, 20).map((order: any) => {
                      const isSkipped = checkupConfig?.skippedOrders?.includes(order.id);
                      return (
                        <div key={order.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] text-xs" data-testid={`row-checkup-order-${order.id}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-primary font-medium">{order.mgtOrderNumber ? `#${order.mgtOrderNumber}` : order.id}</span>
                            <Badge className="text-[10px] px-1.5 py-0 bg-white/5 text-muted-foreground border border-white/10">{order.status}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] ${isSkipped ? "text-red-400" : "text-emerald-400"}`}>
                              {isSkipped ? "Skipped" : "Active"}
                            </span>
                            <Switch
                              checked={!isSkipped}
                              onCheckedChange={(checked) => toggleOrderCheckupMutation.mutate({ orderId: order.id, skip: !checked })}
                              disabled={toggleOrderCheckupMutation.isPending}
                              className="scale-75"
                              data-testid={`switch-checkup-${order.id}`}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeInUp>
      )}

      <FadeInUp>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-0 bg-gradient-to-br from-amber-500/[0.08] via-background to-amber-900/[0.04] overflow-hidden relative" data-testid="card-elite-requests">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-amber-500/[0.04] -translate-y-12 translate-x-12" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Crown className="w-4 h-4 text-amber-400" />
              </div>
              Elite Requests
              {eliteRequestsList && (
                <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 ml-auto text-xs">
                  {eliteRequestsList.filter((r: any) => r.status === "Pending").length} pending
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {(!eliteRequestsList || eliteRequestsList.length === 0) && (
                <div className="py-6 text-center text-muted-foreground text-sm rounded-xl bg-white/[0.02]" data-testid="text-no-elite-requests">
                  <Crown className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No elite requests
                </div>
              )}
              {(eliteRequestsList || []).map((req: any) => {
                const grinder = allGrinders.find(g => g.id === req.grinderId);
                return (
                  <div key={req.id} className={`p-3 rounded-xl border ${req.status === "Pending" ? "border-amber-500/20 bg-amber-500/[0.03]" : "border-white/[0.06] bg-white/[0.02]"}`} data-testid={`card-elite-req-${req.id}`}>
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-medium">{grinder?.name || req.grinderId}</span>
                      <Badge className={
                        req.status === "Approved" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" :
                        req.status === "Denied" ? "bg-red-500/15 text-red-400 border border-red-500/20" :
                        "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                      }>{req.status}</Badge>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 text-[10px] text-muted-foreground mb-2">
                      <div className="text-center p-1.5 rounded-lg bg-white/[0.03]"><p className="font-bold text-foreground">{req.completedOrders ?? grinder?.completedOrders ?? 0}</p>Orders</div>
                      <div className="text-center p-1.5 rounded-lg bg-white/[0.03]"><p className="font-bold text-foreground">{Number(req.winRate ?? grinder?.winRate ?? 0).toFixed(0)}%</p>Win Rate</div>
                      <div className="text-center p-1.5 rounded-lg bg-white/[0.03]"><p className="font-bold text-foreground">{req.avgQualityRating ? (Number(req.avgQualityRating) / 20).toFixed(1) : "N/A"}/5</p>Quality</div>
                      <div className="text-center p-1.5 rounded-lg bg-white/[0.03]"><p className="font-bold text-foreground">{Number(req.onTimeRate ?? 0).toFixed(0)}%</p>On-Time</div>
                      <div className="text-center p-1.5 rounded-lg bg-white/[0.03]"><p className="font-bold text-foreground">{req.strikes ?? grinder?.strikes ?? 0}</p>Strikes</div>
                    </div>
                    {req.decisionNotes && <p className="text-xs text-muted-foreground italic mb-2">{req.decisionNotes}</p>}
                    {req.status === "Pending" && (
                      <div className="flex items-center gap-2">
                        <Button size="sm" className="text-xs bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20" data-testid={`button-approve-elite-${req.id}`}
                          disabled={eliteReqMutation.isPending}
                          onClick={() => eliteReqMutation.mutate({ id: req.id, status: "Approved" })}>
                          Approve
                        </Button>
                        <Button size="sm" className="text-xs bg-red-500/15 text-red-400 border border-red-500/20" data-testid={`button-deny-elite-${req.id}`}
                          disabled={eliteReqMutation.isPending}
                          onClick={() => { setDenyEliteReqId(req.id); setDenyEliteReason(""); setDenyEliteDialogOpen(true); }}>
                          Deny
                        </Button>
                      </div>
                    )}
                    {req.status === "Denied" && req.decisionNotes && (
                      <p className="text-xs text-red-400/70 mt-2 italic">Reason: {req.decisionNotes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Dialog open={denyEliteDialogOpen} onOpenChange={setDenyEliteDialogOpen}>
          <DialogContent className="border-white/10 bg-background/95 backdrop-blur-xl sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="font-display text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-red-400" />
                </div>
                Deny Elite Request
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reason for denial (visible to grinder)</label>
                <Textarea
                  value={denyEliteReason}
                  onChange={(e) => setDenyEliteReason(e.target.value)}
                  placeholder="e.g. Need more completed orders, improve on-time rate..."
                  className="mt-1.5 bg-background/50 border-white/10 min-h-[80px]"
                  data-testid="textarea-deny-elite-reason"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDenyEliteDialogOpen(false)} className="border-white/10">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25"
                  disabled={eliteReqMutation.isPending}
                  data-testid="button-confirm-deny-elite"
                  onClick={() => {
                    eliteReqMutation.mutate(
                      { id: denyEliteReqId, status: "Denied", decisionNotes: denyEliteReason.trim() || undefined },
                      { onSuccess: () => setDenyEliteDialogOpen(false) }
                    );
                  }}
                >
                  {eliteReqMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deny Request"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="border-0 bg-gradient-to-br from-red-500/[0.08] via-background to-red-900/[0.04] overflow-hidden relative" data-testid="card-strike-management">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-red-500/[0.04] -translate-y-12 translate-x-12" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              Strike Management
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-3">
              <div className="space-y-2">
                <Select value={strikeGrinderId} onValueChange={setStrikeGrinderId}>
                  <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-strike-grinder">
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
                  className="bg-background/50 border-white/10"
                  data-testid="input-strike-reason"
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" className="text-xs bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20"
                    data-testid="button-add-strike"
                    disabled={!strikeGrinderId || !strikeReason || strikeMutation.isPending}
                    onClick={() => { strikeMutation.mutate({ grinderId: strikeGrinderId, action: "add", reason: strikeReason }); setStrikeReason(""); }}>
                    Add Strike
                  </Button>
                  <Button size="sm" className="text-xs bg-white/[0.05] text-muted-foreground border border-white/10 hover:bg-white/10"
                    data-testid="button-remove-strike"
                    disabled={!strikeGrinderId || !strikeReason || strikeMutation.isPending}
                    onClick={() => { strikeMutation.mutate({ grinderId: strikeGrinderId, action: "remove", reason: strikeReason }); setStrikeReason(""); }}>
                    Remove Strike
                  </Button>
                </div>
              </div>
              {allGrinders.filter(g => g.suspended).length > 0 && (
                <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/[0.05] space-y-2">
                  <p className="text-xs font-semibold text-red-400 flex items-center gap-1"><Ban className="w-3 h-3" /> Suspended Grinders</p>
                  {allGrinders.filter(g => g.suspended).map(g => (
                    <div key={g.id} className="flex items-center justify-between gap-2 text-xs p-2 rounded-lg bg-red-500/[0.05]" data-testid={`row-suspended-${g.id}`}>
                      <span className="font-medium truncate">{g.name}</span>
                      <span className="text-red-400 font-bold">${parseFloat(g.outstandingFine || "0").toFixed(2)}</span>
                      <Button size="sm" className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
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
                {(!strikeLogsList || strikeLogsList.length === 0) && <p className="text-muted-foreground text-xs py-3 text-center" data-testid="text-no-strike-logs">No strike logs</p>}
                {(strikeLogsList || []).slice(0, 10).map((log: any) => {
                  const grinder = allGrinders.find(g => g.id === log.grinderId);
                  return (
                    <div key={log.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs" data-testid={`card-strike-${log.id}`}>
                      <Badge className={log.action === "add" ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"} variant="outline">
                        {log.action === "add" ? "+" : "-"}
                      </Badge>
                      <span className="font-medium flex-1 truncate">{grinder?.name || log.grinderId}</span>
                      {parseFloat(log.fineAmount || "0") > 0 && (
                        <Badge className={log.finePaid ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px]" : "bg-red-500/10 text-red-400 border border-red-500/20 text-[9px]"}>
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
      </FadeInUp>

      {strikeAppeals.length > 0 && (
        <FadeInUp>
          <Card className="border-0 bg-gradient-to-br from-violet-500/[0.08] via-background to-violet-900/[0.04] overflow-hidden relative" data-testid="card-strike-appeals">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-violet-500/[0.04] -translate-y-12 translate-x-12" />
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                  <Gavel className="w-4 h-4 text-violet-400" />
                </div>
                Strike Appeals
                {strikeAppeals.filter((a: any) => a.status === "pending").length > 0 && (
                  <Badge className="bg-violet-500/15 text-violet-400 border border-violet-500/20 ml-auto text-xs animate-pulse">
                    {strikeAppeals.filter((a: any) => a.status === "pending").length} pending
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {strikeAppeals.map((appeal: any) => {
                  const grinder = allGrinders.find((g: any) => g.id === appeal.grinderId);
                  const strikeLog = (strikeLogsList || []).find((l: any) => l.id === appeal.strikeLogId);
                  const isReviewing = appealReviewId === appeal.id;
                  return (
                    <div
                      key={appeal.id}
                      className={`p-3 rounded-xl border ${
                        appeal.status === "pending" ? "bg-violet-500/[0.04] border-violet-500/15" :
                        appeal.status === "approved" ? "bg-emerald-500/[0.04] border-emerald-500/15 opacity-60" :
                        "bg-red-500/[0.04] border-red-500/15 opacity-60"
                      }`}
                      data-testid={`card-appeal-${appeal.id}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold">{grinder?.name || appeal.grinderId}</span>
                            <Badge className={`text-[10px] ${
                              appeal.status === "pending" ? "bg-violet-500/20 text-violet-400 border-violet-500/20" :
                              appeal.status === "approved" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" :
                              "bg-red-500/20 text-red-400 border-red-500/20"
                            }`}>
                              {appeal.status === "pending" ? "Pending" : appeal.status === "approved" ? "Approved" : "Denied"}
                            </Badge>
                          </div>
                          {strikeLog && (
                            <div className="mt-1.5 p-2 rounded-lg bg-red-500/[0.04] border border-red-500/10">
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium text-red-400">Original strike:</span> {strikeLog.reason}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Fine: ${parseFloat(strikeLog.fineAmount || "0").toFixed(2)} — {new Date(strikeLog.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          <div className="mt-1.5">
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">Appeal reason:</span> {appeal.reason}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Submitted {new Date(appeal.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {appeal.reviewNote && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              <span className="font-medium">Staff note:</span> {appeal.reviewNote} — {appeal.reviewedByName}
                            </p>
                          )}
                        </div>
                      </div>
                      {appeal.status === "pending" && (
                        <div className="mt-3 space-y-2">
                          {isReviewing ? (
                            <>
                              <Textarea
                                value={appealReviewNote}
                                onChange={(e) => setAppealReviewNote(e.target.value)}
                                placeholder="Review note (optional for approval, recommended for denial)"
                                className="bg-background/50 border-white/10 min-h-[60px] resize-none text-xs"
                                data-testid={`textarea-appeal-note-${appeal.id}`}
                              />
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  className="text-xs bg-gradient-to-r from-emerald-600 to-emerald-500 text-white gap-1"
                                  disabled={appealReviewMutation.isPending}
                                  onClick={() => appealReviewMutation.mutate({ id: appeal.id, status: "approved", reviewNote: appealReviewNote })}
                                  data-testid={`button-approve-appeal-${appeal.id}`}
                                >
                                  {appealReviewMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                  Approve & Remove Strike
                                </Button>
                                <Button
                                  size="sm"
                                  className="text-xs bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 gap-1"
                                  disabled={appealReviewMutation.isPending}
                                  onClick={() => appealReviewMutation.mutate({ id: appeal.id, status: "denied", reviewNote: appealReviewNote })}
                                  data-testid={`button-deny-appeal-${appeal.id}`}
                                >
                                  {appealReviewMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                                  Deny
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs text-muted-foreground"
                                  onClick={() => { setAppealReviewId(null); setAppealReviewNote(""); }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-violet-500/20 text-violet-400 hover:bg-violet-500/10 gap-1"
                              onClick={() => { setAppealReviewId(appeal.id); setAppealReviewNote(""); }}
                              data-testid={`button-review-appeal-${appeal.id}`}
                            >
                              <Gavel className="w-3 h-3" />
                              Review Appeal
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </FadeInUp>
      )}

      <FadeInUp>
      <Card className="border-0 bg-gradient-to-br from-purple-500/[0.08] via-background to-purple-900/[0.04] overflow-hidden relative" data-testid="card-order-limits">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-purple-500/[0.03] -translate-y-16 translate-x-16" />
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            Grinder Order Limits
            <Badge className="bg-purple-500/15 text-purple-400 border border-purple-500/20 ml-auto text-xs">{allGrinders.length} grinders</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {allGrinders.map(g => (
              <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] sm:hover:bg-white/[0.05] transition-colors" data-testid={`row-limit-${g.id}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{g.name}</span>
                    {g.suspended && <Badge className="bg-red-500/15 text-red-400 border border-red-500/20 text-[9px]"><Ban className="w-2.5 h-2.5 mr-0.5" />Suspended</Badge>}
                    {!(g as any).rulesAccepted && <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[9px]">Rules Pending</Badge>}
                    <Badge variant="outline" className="text-[10px] bg-white/[0.03]">{g.category}</Badge>
                    <Badge className={`text-[10px] border ${
                      (g as any).availabilityStatus === "busy" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" :
                      (g as any).availabilityStatus === "away" ? "bg-orange-500/15 text-orange-400 border-orange-500/20" :
                      (g as any).availabilityStatus === "offline" ? "bg-red-500/15 text-red-400 border-red-500/20" :
                      "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
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
                      className="w-16 text-xs bg-background/50 border-white/10"
                      value={editLimitValue}
                      onChange={(e) => setEditLimitValue(e.target.value)}
                      data-testid={`input-limit-${g.id}`}
                    />
                    <Button size="icon" variant="ghost"
                      data-testid={`button-save-limit-${g.id}`}
                      disabled={!editLimitValue || updateLimitMutation.isPending}
                      onClick={() => updateLimitMutation.mutate({ grinderId: g.id, capacity: parseInt(editLimitValue) })}>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    </Button>
                    <Button size="icon" variant="ghost"
                      onClick={() => { setEditLimitGrinderId(""); setEditLimitValue(""); }}>
                      <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${g.activeOrders >= g.capacity ? "text-red-400" : "text-emerald-400"}`}>{g.capacity}</span>
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground hover:text-purple-400"
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
      </FadeInUp>

      {(isOwner || user?.role === "staff") && (
        <FadeInUp>
        <Card className="border-0 bg-gradient-to-br from-amber-500/[0.06] via-background to-background overflow-hidden relative" data-testid="card-owner-profiles">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-amber-500/[0.03] -translate-y-16 translate-x-16" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              Edit Grinder Profiles
              <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 ml-auto text-xs">{allGrinders.filter(g => !g.isRemoved).length} active · {allGrinders.filter(g => g.isRemoved).length} removed</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {allGrinders.map(g => (
                <div key={g.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${g.isRemoved ? "bg-red-500/[0.03] border-red-500/10 opacity-60" : "bg-white/[0.03] border-white/[0.06] sm:hover:bg-white/[0.05]"}`} data-testid={`row-profile-${g.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-medium ${g.isRemoved ? "line-through text-muted-foreground" : ""}`}>{g.name}</span>
                      {g.isRemoved && <Badge className="bg-red-500/15 text-red-400 border border-red-500/20 text-[10px]">Removed</Badge>}
                      <Badge variant="outline" className="text-[10px] bg-white/[0.03]">{g.category}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {pluralize(g.activeOrders, 'order')}/{g.capacity} · {g.completedOrders} completed · {pluralize(g.strikes, 'strike')}
                      </span>
                    </div>
                    {g.isRemoved && g.removedAt && <p className="text-[10px] text-red-400/60 mt-0.5">Removed {new Date(g.removedAt).toLocaleDateString()}</p>}
                    {g.notes && !g.isRemoved && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{g.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    {g.isRemoved ? (
                      <Button size="sm" variant="ghost" className="text-green-400 text-xs hover:bg-green-500/10"
                        data-testid={`button-restore-grinder-${g.id}`}
                        onClick={() => {
                          updateProfileMutation.mutate({ grinderId: g.id, data: { isRemoved: false, removedAt: null, removedBy: null, availabilityStatus: "available" } });
                          toast({ title: `${g.name} has been restored` });
                        }}>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Restore
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" variant="ghost" className="text-amber-400 text-xs hover:bg-amber-500/10"
                          data-testid={`button-edit-profile-${g.id}`}
                          onClick={() => {
                            setEditProfileGrinder(g);
                            setEditProfileName(g.name);
                            setEditProfileCategory(g.category);

                            setEditProfileCapacity(String(g.capacity));
                            setEditProfileNotes(g.notes || "");
                          }}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-400 text-xs hover:text-red-300 hover:bg-red-500/10"
                          data-testid={`button-remove-grinder-${g.id}`}
                          onClick={() => setRemoveGrinder(g)}>
                          <Ban className="w-3 h-3 mr-1" />
                          Remove
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </FadeInUp>
      )}

      <Dialog open={!!editProfileGrinder} onOpenChange={(open) => !open && setEditProfileGrinder(null)}>
        <DialogContent className="border-white/10 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              Edit Profile: {editProfileGrinder?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <Input value={editProfileName} onChange={(e) => setEditProfileName(e.target.value)} className="bg-background/50 border-white/10" data-testid="input-profile-name" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Tier</label>
              <Select value={editProfileCategory} onValueChange={setEditProfileCategory}>
                <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-profile-category">
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
              <label className="text-sm font-medium mb-1 block">Order Limit</label>
              <Input type="number" min="1" max="20" value={editProfileCapacity} onChange={(e) => setEditProfileCapacity(e.target.value)} className="bg-background/50 border-white/10" data-testid="input-profile-capacity" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea value={editProfileNotes} onChange={(e) => setEditProfileNotes(e.target.value)} className="bg-background/50 border-white/10 resize-none" data-testid="input-profile-notes" />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-lg shadow-amber-500/20"
              data-testid="button-save-profile"
              disabled={updateProfileMutation.isPending}
              onClick={() => {
                if (!editProfileGrinder) return;
                updateProfileMutation.mutate({
                  grinderId: editProfileGrinder.id,
                  data: {
                    name: editProfileName,
                    category: editProfileCategory,
                    capacity: parseInt(editProfileCapacity),
                    notes: editProfileNotes || null,
                  },
                });
              }}
            >
              {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!removeGrinder} onOpenChange={(open) => { if (!open) { setRemoveGrinder(null); setDeleteHistoricalData(false); } }}>
        <DialogContent className="border-red-500/20 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400 font-display">
              <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                <Ban className="w-4 h-4 text-red-400" />
              </div>
              Remove Grinder
            </DialogTitle>
          </DialogHeader>
          {removeGrinder && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Remove <span className="text-foreground font-medium">{removeGrinder.name}</span> from the system? This will revoke their dashboard access immediately.
              </p>

              <div className="space-y-3 rounded-lg border border-border/50 p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Historical Data</p>

                <label className="flex items-start gap-3 p-2.5 rounded-md border border-border/50 cursor-pointer hover:bg-muted/30 transition-colors" data-testid="option-preserve-history">
                  <input type="radio" name="deleteHistory" checked={!deleteHistoricalData} onChange={() => setDeleteHistoricalData(false)}
                    className="mt-0.5 accent-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Preserve historical data</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Keep all revenue, payouts, completed orders, bids, and performance records. The grinder will appear as inactive in reports.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-md border border-red-500/20 cursor-pointer hover:bg-red-500/5 transition-colors" data-testid="option-delete-history">
                  <input type="radio" name="deleteHistory" checked={deleteHistoricalData} onChange={() => setDeleteHistoricalData(true)}
                    className="mt-0.5 accent-red-500" />
                  <div>
                    <p className="text-sm font-medium text-red-400">Delete all historical data</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Permanently erase all records including assignments, payouts, bids, strikes, and earnings. This cannot be undone.</p>
                  </div>
                </label>
              </div>

              {deleteHistoricalData && (
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-300">This will permanently delete all of {removeGrinder.name}'s data including revenue records, payout history, and completed orders. This action cannot be reversed.</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Button
                  className={deleteHistoricalData
                    ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20"
                    : "bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/20"
                  }
                  data-testid="button-confirm-remove"
                  disabled={removeGrinderMutation.isPending}
                  onClick={() => removeGrinderMutation.mutate({ grinderId: removeGrinder.id, deleteHistory: deleteHistoricalData })}>
                  {removeGrinderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
                  {deleteHistoricalData ? "Delete Permanently" : "Remove Access"}
                </Button>
                <Button variant="ghost" onClick={() => { setRemoveGrinder(null); setDeleteHistoricalData(false); }}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <FadeInUp>
        <Card className="border-0 bg-gradient-to-br from-cyan-500/[0.08] via-background to-cyan-900/[0.04] overflow-hidden relative" data-testid="card-grinder-tasks">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-cyan-500/[0.04] -translate-y-12 translate-x-12" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-cyan-400" />
              </div>
              Send Task to Grinder
              {staffTasks.filter((t: any) => t.status === "pending").length > 0 && (
                <Badge className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 ml-auto text-xs">
                  {staffTasks.filter((t: any) => t.status === "pending").length} active
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Grinder</label>
                <Select value={taskGrinderId} onValueChange={setTaskGrinderId}>
                  <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-task-grinder">
                    <SelectValue placeholder="Select grinder" />
                  </SelectTrigger>
                  <SelectContent>
                    {allGrinders.filter((g: any) => !g.removedAt).map((g: any) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
                <Select value={taskPriority} onValueChange={setTaskPriority}>
                  <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Task Title</label>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Upload updated screenshot of progress"
                className="bg-background/50 border-white/10"
                data-testid="input-task-title"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description (optional)</label>
              <Textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Additional details about what needs to be done..."
                className="bg-background/50 border-white/10 min-h-[60px]"
                data-testid="textarea-task-description"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Link to Order (optional)</label>
              <Select value={taskOrderId} onValueChange={setTaskOrderId}>
                <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-task-order">
                  <SelectValue placeholder="No specific order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific order</SelectItem>
                  {allOrders.filter((o: any) => o.status !== "Completed" && o.status !== "Cancelled").map((o: any) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.mgtOrderNumber ? `#${o.mgtOrderNumber}` : o.id} — {o.serviceId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full gap-2 bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/25"
              disabled={!taskGrinderId || !taskTitle.trim() || sendTaskMutation.isPending}
              onClick={() => sendTaskMutation.mutate({
                grinderId: taskGrinderId,
                title: taskTitle.trim(),
                description: taskDescription.trim() || undefined,
                priority: taskPriority,
                orderId: taskOrderId && taskOrderId !== "none" ? taskOrderId : undefined,
              })}
              data-testid="button-send-task"
            >
              {sendTaskMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Task
            </Button>

            {staffTasks.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Recent Tasks</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {staffTasks.slice(0, 15).map((task: any) => {
                    const grinder = allGrinders.find((g: any) => g.id === task.grinderId);
                    return (
                      <div
                        key={task.id}
                        className={`flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs ${task.status === "completed" ? "opacity-50" : ""}`}
                        data-testid={`row-staff-task-${task.id}`}
                      >
                        {task.status === "completed" ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <ClipboardList className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        )}
                        <span className="text-primary font-medium truncate max-w-[120px]">{grinder?.name || task.grinderId}</span>
                        <span className="text-muted-foreground truncate flex-1">{task.title}</span>
                        {task.priority === "urgent" && <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-[10px] px-1.5">Urgent</Badge>}
                        {task.priority === "high" && <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-[10px] px-1.5">High</Badge>}
                        <Badge className={`text-[10px] px-1.5 ${task.status === "completed" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-muted-foreground border-white/10"}`}>
                          {task.status === "completed" ? "Done" : "Pending"}
                        </Badge>
                        {task.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400"
                            onClick={() => deleteTaskMutation.mutate(task.id)}
                            data-testid={`button-delete-task-${task.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeInUp>

      {replacedAssignments.length > 0 && (
        <FadeInUp>
        <Card className="border-0 bg-gradient-to-br from-orange-500/[0.06] via-background to-background overflow-hidden relative" data-testid="card-replacement-tracker">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-orange-500/[0.03] -translate-y-12 translate-x-12" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
                <Repeat className="w-4 h-4 text-orange-400" />
              </div>
              Replacement Tracker
              <Badge className="bg-orange-500/15 text-orange-400 border border-orange-500/20 ml-auto text-xs">{replacedAssignments.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <p className="text-lg font-bold text-orange-400">{replacedAssignments.length}</p>
                <p className="text-[10px] text-muted-foreground">Replacements</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <p className="text-lg font-bold text-amber-400">{replacementRate.toFixed(0)}%</p>
                <p className="text-[10px] text-muted-foreground">Rate</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <p className="text-lg font-bold text-red-400">{formatCurrency(totalOriginalGrinderPay)}</p>
                <p className="text-[10px] text-muted-foreground">Original Pay</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <p className="text-lg font-bold text-blue-400">{formatCurrency(totalReplacementGrinderPay)}</p>
                <p className="text-[10px] text-muted-foreground">Replacement Pay</p>
              </div>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {replacedAssignments.slice(0, 10).map(a => {
                const orig = allGrinders.find(g => g.id === a.originalGrinderId);
                const repl = allGrinders.find(g => g.id === a.grinderId);
                const order = allOrders.find(o => o.id === a.orderId);
                return (
                  <div key={a.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs" data-testid={`row-replacement-${a.id}`}>
                    <span className="text-primary font-medium">{order?.mgtOrderNumber ? `#${order.mgtOrderNumber}` : a.orderId}</span>
                    <span className="text-red-400">{orig?.name || "?"}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-blue-400">{repl?.name || "?"}</span>
                    <span className="text-muted-foreground ml-auto">{a.replacementReason || "No reason"}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        </FadeInUp>
      )}
    </AnimatedPage>
  );
}
