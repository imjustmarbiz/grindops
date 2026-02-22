import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useStaffData } from "@/hooks/use-staff-data";
import { formatCurrency } from "@/lib/staff-utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, Target, Bell, Send, Trash2, Loader2, ToggleLeft, ToggleRight,
  CheckCircle, X, CreditCard,
} from "lucide-react";

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
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-display font-bold text-glow" data-testid="text-page-title">
          Operations
        </h1>
        <p className="text-muted-foreground mt-1">Create orders, assign grinders, and send alerts</p>
      </div>

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

      {assignableOrders.length > 0 && (
        <Card className="glass-panel border-cyan-500/20" data-testid="card-staff-assign">
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
                  <div className="flex items-center justify-between flex-wrap gap-2">
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
                          <div key={b.id} className="flex items-center justify-between flex-wrap gap-2 text-xs p-1.5 rounded bg-white/5" data-testid={`bid-option-${b.id}`}>
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

              <div className="flex items-center gap-3 flex-wrap">
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
      )}

      <Card className="glass-panel border-blue-500/20" data-testid="card-alert-composer">
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
              {(!staffAlertsList || staffAlertsList.length === 0) && <p className="text-muted-foreground text-sm" data-testid="text-no-alerts">No alerts sent</p>}
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
    </div>
  );
}
