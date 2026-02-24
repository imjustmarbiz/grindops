import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useStaffData } from "@/hooks/use-staff-data";
import { formatCurrency, pluralize } from "@/lib/staff-utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Target, Bell, Send, Trash2, Loader2, ToggleLeft, ToggleRight,
  CheckCircle, X, CreditCard, Package, Zap, AlertTriangle,
} from "lucide-react";
import { BiddingCountdownPanel } from "@/components/bidding-countdown";
import { AnimatedPage, FadeInUp } from "@/lib/animations";

export default function StaffOperations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const {
    orders: allOrders,
    bids: allBids,
    grinders: allGrinders,
    services: allServices,
    staffAlerts: staffAlertsList,
    analyticsLoading,
  } = useStaffData();

  const [manualOrderService, setManualOrderService] = useState("");
  const [manualOrderPrice, setManualOrderPrice] = useState("");
  const [manualOrderPlatform, setManualOrderPlatform] = useState("");
  const [manualOrderGamertag, setManualOrderGamertag] = useState("");
  const [manualOrderDueDays, setManualOrderDueDays] = useState("3");
  const [manualOrderNotes, setManualOrderNotes] = useState("");
  const [manualOrderSendToGrinders, setManualOrderSendToGrinders] = useState(true);
  const [manualOrderIsRush, setManualOrderIsRush] = useState(false);
  const [manualOrderComplexity, setManualOrderComplexity] = useState("1");

  const [assignOrderId, setAssignOrderId] = useState("");
  const [assignGrinderId, setAssignGrinderId] = useState("");
  const [assignBidAmount, setAssignBidAmount] = useState("");
  const [assignNotes, setAssignNotes] = useState("");

  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("info");
  const [alertTarget, setAlertTarget] = useState("all");
  const [alertGrinderId, setAlertGrinderId] = useState("");

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

  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const assignableOrders = allOrders.filter(o => o.status === "Open" || o.status === "Bidding Closed");
  const selectedOrder = assignableOrders.find(o => o.id === assignOrderId);
  const orderBids = allBids.filter(b => b.orderId === assignOrderId);
  const selectedGrinder = allGrinders.find(g => g.id === assignGrinderId);

  return (
    <AnimatedPage className="space-y-5 sm:space-y-6">
      <FadeInUp>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-glow" data-testid="text-page-title">
              Operations
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Create orders, assign grinders, and send alerts</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 gap-1">
              <Package className="w-3 h-3" />
              {pluralize(allOrders.length, 'order')}
            </Badge>
            <Badge className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 gap-1">
              <Target className="w-3 h-3" />
              {assignableOrders.length} assignable
            </Badge>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
        <BiddingCountdownPanel />
      </FadeInUp>

      <FadeInUp>
      <Card className="border-0 bg-gradient-to-br from-amber-500/[0.08] via-background to-amber-900/[0.04] overflow-hidden relative" data-testid="card-create-manual-order">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-amber-500/[0.04] -translate-y-12 translate-x-12" />
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Plus className="w-4 h-4 text-amber-400" />
            </div>
            Create Manual Order
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Service</label>
              <Select value={manualOrderService} onValueChange={setManualOrderService}>
                <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-manual-service">
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
              <Input type="number" step="0.01" min="0" placeholder="Price" value={manualOrderPrice} onChange={(e) => setManualOrderPrice(e.target.value)} className="bg-background/50 border-white/10" data-testid="input-manual-price" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Platform</label>
              <Select value={manualOrderPlatform} onValueChange={setManualOrderPlatform}>
                <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-manual-platform">
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
              <Input placeholder="Customer gamertag" value={manualOrderGamertag} onChange={(e) => setManualOrderGamertag(e.target.value)} className="bg-background/50 border-white/10" data-testid="input-manual-gamertag" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Due in (days)</label>
              <Input type="number" min="1" placeholder="3" value={manualOrderDueDays} onChange={(e) => setManualOrderDueDays(e.target.value)} className="bg-background/50 border-white/10" data-testid="input-manual-due" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Complexity (1-5)</label>
              <Select value={manualOrderComplexity} onValueChange={setManualOrderComplexity}>
                <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-manual-complexity">
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
            <Input placeholder="Additional details..." value={manualOrderNotes} onChange={(e) => setManualOrderNotes(e.target.value)} className="bg-background/50 border-white/10" data-testid="input-manual-notes" />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
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
                <Zap className="w-3 h-3 text-red-400" />
                Rush
              </label>
            </div>
          </div>
          <Button
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-lg shadow-amber-500/20 sm:hover:-translate-y-0.5 transition-all duration-300"
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
      </FadeInUp>

      {assignableOrders.length > 0 && (
        <FadeInUp>
        <Card className="border-0 bg-gradient-to-br from-cyan-500/[0.08] via-background to-cyan-900/[0.04] overflow-hidden relative" data-testid="card-staff-assign">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-cyan-500/[0.04] -translate-y-12 translate-x-12" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                <Target className="w-4 h-4 text-cyan-400" />
              </div>
              Staff Override Assign
              <Badge className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 ml-auto text-xs">{assignableOrders.length} assignable</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Select Order</label>
                  <Select value={assignOrderId} onValueChange={(v) => { setAssignOrderId(v); setAssignGrinderId(""); setAssignBidAmount(""); }}>
                    <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-assign-order">
                      <SelectValue placeholder="Choose an order to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableOrders.map(o => {
                        const svc = allServices.find(s => s.id === o.serviceId);
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
                    <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-assign-grinder">
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
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Order Details</span>
                    <Badge variant="outline" className="text-[10px]">{selectedOrder.status}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-white/[0.03]">
                      <span className="text-muted-foreground">Price: </span>
                      <span className="text-emerald-400 font-semibold">{formatCurrency(Number(selectedOrder.customerPrice))}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03]">
                      <span className="text-muted-foreground">Platform: </span>
                      <span>{selectedOrder.platform || "N/A"}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03]">
                      <span className="text-muted-foreground">Bids: </span>
                      <span className="text-blue-400 font-semibold">{orderBids.length}</span>
                    </div>
                  </div>
                  {orderBids.length > 0 && (
                    <div className="space-y-1 mt-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Existing bids:</span>
                      {orderBids.filter(b => b.status === "Pending").map(b => {
                        const bidGrinder = allGrinders.find(g => g.id === b.grinderId);
                        return (
                          <div key={b.id} className="flex items-center justify-between flex-wrap gap-2 text-xs p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]" data-testid={`bid-option-${b.id}`}>
                            <span className="font-medium">{bidGrinder?.name || b.grinderId}</span>
                            <span className="text-emerald-400 font-semibold">{formatCurrency(Number(b.bidAmount))}</span>
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
                    className="bg-background/50 border-white/10"
                    data-testid="input-assign-amount"
                  />
                  {selectedOrder && assignBidAmount && (
                    <div className="text-[10px] text-muted-foreground">
                      Margin: <span className={Number(selectedOrder.customerPrice) - Number(assignBidAmount) >= 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
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
                    className="bg-background/50 border-white/10"
                    data-testid="input-assign-notes"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  data-testid="button-staff-assign"
                  className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-500/20 sm:hover:-translate-y-0.5 transition-all duration-300"
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
        </FadeInUp>
      )}

      <FadeInUp>
      <Card className="border-0 bg-gradient-to-br from-blue-500/[0.08] via-background to-blue-900/[0.04] overflow-hidden relative" data-testid="card-alert-composer">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-blue-500/[0.04] -translate-y-12 translate-x-12" />
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <Bell className="w-4 h-4 text-blue-400" />
            </div>
            Alert Composer
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Input
                placeholder="Alert title"
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                className="bg-background/50 border-white/10"
                data-testid="input-alert-title"
              />
              <Textarea
                placeholder="Alert message"
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                className="resize-none bg-background/50 border-white/10 min-h-[80px]"
                data-testid="input-alert-message"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={alertSeverity} onValueChange={setAlertSeverity}>
                  <SelectTrigger className="w-32 bg-background/50 border-white/10" data-testid="select-alert-severity">
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
                  <SelectTrigger className="w-40 bg-background/50 border-white/10" data-testid="select-alert-target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grinders</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
                {alertTarget === "individual" && (
                  <Select value={alertGrinderId} onValueChange={setAlertGrinderId}>
                    <SelectTrigger className="w-40 bg-background/50 border-white/10" data-testid="select-alert-grinder">
                      <SelectValue placeholder="Select grinder" />
                    </SelectTrigger>
                    <SelectContent>
                      {allGrinders.map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Button
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/20 sm:hover:-translate-y-0.5 transition-all duration-300"
                disabled={!alertTitle || !alertMessage || alertMutation.isPending}
                data-testid="button-send-alert"
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
                }}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Alert
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sent Alerts</p>
                <Badge variant="outline" className="text-[10px]">{(staffAlertsList || []).length}</Badge>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {(!staffAlertsList || staffAlertsList.length === 0) && (
                  <div className="p-6 text-center text-muted-foreground text-sm rounded-xl bg-white/[0.02]">
                    No alerts sent yet
                  </div>
                )}
                {(staffAlertsList || []).slice(0, 10).map((a: any) => (
                  <div key={a.id} className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] group" data-testid={`card-alert-${a.id}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      a.severity === "danger" ? "bg-red-400" :
                      a.severity === "warning" ? "bg-amber-400" :
                      a.severity === "success" ? "bg-emerald-400" :
                      "bg-blue-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{a.title}</span>
                        <Badge variant="outline" className="text-[9px] shrink-0">{a.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {a.targetType === "all" ? "All grinders" : "Individual"} · {new Date(a.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all flex-shrink-0"
                      onClick={() => deleteAlertMutation.mutate(a.id)}
                      data-testid={`button-delete-alert-${a.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </FadeInUp>
    </AnimatedPage>
  );
}
