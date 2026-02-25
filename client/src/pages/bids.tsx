import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gavel, Clock, DollarSign, CalendarCheck, Play, CheckCircle, XCircle, RotateCcw, Shield, Pencil, Loader2, Filter, Plus } from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import type { Bid, Order, Grinder } from "@shared/schema";

import { useTableSort } from "@/hooks/use-table-sort";
import { SortableHeader } from "@/components/sortable-header";

export default function Bids() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const { data: bids, isLoading } = useQuery<Bid[]>({ queryKey: ["/api/bids"] });
  const { data: orders } = useQuery<Order[]>({ queryKey: ["/api/orders"] });
  const { data: grinders } = useQuery<Grinder[]>({ queryKey: ["/api/grinders"] });

  const [filterOrderId, setFilterOrderId] = useState<string>("all");
  const [editingBid, setEditingBid] = useState<Bid | null>(null);
  const [editForm, setEditForm] = useState({ bidAmount: "", timeline: "", canStart: "", notes: "" });
  const [addBidOpen, setAddBidOpen] = useState(false);
  const [addBidForm, setAddBidForm] = useState({
    orderId: "",
    grinderId: "",
    bidAmount: "",
    timeline: "",
    canStart: "",
    notes: "",
  });

  const openEditDialog = (bid: Bid) => {
    setEditForm({
      bidAmount: bid.bidAmount?.toString() || "",
      timeline: bid.timeline || "",
      canStart: bid.canStart || "",
      notes: bid.notes || "",
    });
    setEditingBid(bid);
  };

  const bidStatusMutation = useMutation({
    mutationFn: async ({ bidId, status }: { bidId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/bids/${bidId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({ title: "Bid status updated" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const bidOverrideMutation = useMutation({
    mutationFn: async ({ bidId, status }: { bidId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/bids/${bidId}/override`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({ title: "Owner override applied" });
    },
    onError: (e: any) => toast({ title: "Override failed", description: e.message, variant: "destructive" }),
  });

  const bidEditMutation = useMutation({
    mutationFn: async ({ bidId, data }: { bidId: string; data: Record<string, any> }) => {
      const res = await apiRequest("PATCH", `/api/bids/${bidId}/edit`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setEditingBid(null);
      toast({ title: "Bid updated successfully" });
    },
    onError: (e: any) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const createBidMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await apiRequest("POST", "/api/bids", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setAddBidOpen(false);
      setAddBidForm({ orderId: "", grinderId: "", bidAmount: "", timeline: "", canStart: "", notes: "" });
      toast({ title: "Bid created successfully" });
    },
    onError: (e: any) => toast({ title: "Failed to create bid", description: e.message, variant: "destructive" }),
  });

  const handleAddBidSubmit = () => {
    if (!addBidForm.orderId || !addBidForm.grinderId || !addBidForm.bidAmount) {
      toast({ title: "Missing fields", description: "Order, grinder, and bid amount are required", variant: "destructive" });
      return;
    }
    const bidId = `BID-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date();
    const estDelivery = addBidForm.timeline
      ? new Date(now.getTime() + parseInt(addBidForm.timeline) * 3600000)
      : new Date(now.getTime() + 48 * 3600000);

    const selectedOrder = (orders || []).find((o: Order) => o.id === addBidForm.orderId);
    const bidAmt = parseFloat(addBidForm.bidAmount);
    const customerPrice = selectedOrder?.customerPrice ? parseFloat(selectedOrder.customerPrice) : 0;
    const margin = customerPrice > 0 ? customerPrice - bidAmt : 0;
    const marginPct = customerPrice > 0 ? ((margin / customerPrice) * 100).toFixed(1) : "0";

    createBidMutation.mutate({
      id: bidId,
      orderId: addBidForm.orderId,
      grinderId: addBidForm.grinderId,
      bidAmount: addBidForm.bidAmount,
      estDeliveryDate: estDelivery.toISOString(),
      timeline: addBidForm.timeline || null,
      canStart: addBidForm.canStart || null,
      notes: addBidForm.notes || null,
      status: "Pending",
      margin: margin.toFixed(2),
      marginPct,
    });
  };

  const handleEditSubmit = () => {
    if (!editingBid) return;
    const data: Record<string, any> = {};
    if (editForm.bidAmount && editForm.bidAmount !== editingBid.bidAmount?.toString()) {
      data.bidAmount = parseFloat(editForm.bidAmount);
    }
    if (editForm.timeline !== (editingBid.timeline || "")) data.timeline = editForm.timeline;
    if (editForm.canStart !== (editingBid.canStart || "")) data.canStart = editForm.canStart;
    if (editForm.notes !== (editingBid.notes || "")) data.notes = editForm.notes;

    if (Object.keys(data).length === 0) {
      toast({ title: "No changes", description: "Nothing was modified" });
      return;
    }
    bidEditMutation.mutate({ bidId: editingBid.id, data });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "Accepted": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
      case "Rejected":
      case "Denied": return "bg-red-500/15 text-red-400 border-red-500/20";
      case "Order Assigned": return "bg-orange-500/15 text-orange-400 border-orange-500/20";
      case "Countered": return "bg-yellow-500/15 text-yellow-400 border-yellow-500/20";
      default: return "bg-blue-500/15 text-blue-400 border-blue-500/20";
    }
  };

  const filteredBids = filterOrderId === "all" ? bids : bids?.filter(b => b.orderId === filterOrderId);
  const { sortedItems: sortedBids, sortKey, sortDir, toggleSort } = useTableSort<Bid>(filteredBids || []);
  const pendingCount = bids?.filter(b => b.status === "Pending").length || 0;
  const acceptedCount = bids?.filter(b => b.status === "Accepted").length || 0;
  const rejectedCount = bids?.filter(b => b.status === "Rejected" || b.status === "Denied").length || 0;

  const ordersWithBids = Array.from(new Set(bids?.map(b => b.orderId) || [])).map(orderId => {
    const order = (orders || []).find((o: Order) => o.id === orderId);
    const bidCount = bids?.filter(b => b.orderId === orderId).length || 0;
    return {
      orderId,
      label: order?.mgtOrderNumber ? `#${order.mgtOrderNumber}` : orderId,
      bidCount,
    };
  }).sort((a, b) => b.bidCount - a.bidCount);

  const editOrder = editingBid ? (orders || []).find((o: Order) => o.id === editingBid.orderId) : null;
  const editGrinder = editingBid ? (grinders || []).find((g: Grinder) => g.id === editingBid.grinderId) : null;
  const editMarginPreview = editForm.bidAmount && editOrder?.customerPrice
    ? Number(editOrder.customerPrice) - Number(editForm.bidAmount)
    : null;

  return (
    <TooltipProvider>
    <AnimatedPage className="space-y-5">
      <FadeInUp>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight flex items-center gap-3" data-testid="text-bids-title">
            <Gavel className="w-7 h-7 text-primary" />
            Proposals & Bids
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Grinder proposals imported from MGT Bot.</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/20 gap-1 animate-pulse">
              <Clock className="w-3 h-3" />
              {pendingCount} pending
            </Badge>
          )}
          <Button
            onClick={() => setAddBidOpen(true)}
            className="gap-2 bg-gradient-to-r from-primary to-primary/80"
            data-testid="button-add-bid"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Bid</span>
          </Button>
        </div>
      </div>
      </FadeInUp>

      <FadeInUp>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: bids?.length || 0, gradient: "from-white/[0.04] via-background to-white/[0.01]", color: "text-foreground", iconBg: "bg-white/10", icon: Gavel },
          { label: "Pending", value: pendingCount, gradient: "from-blue-500/[0.08] via-background to-blue-900/[0.04]", color: "text-blue-400", iconBg: "bg-blue-500/15", icon: Clock },
          { label: "Accepted", value: acceptedCount, gradient: "from-emerald-500/[0.08] via-background to-emerald-900/[0.04]", color: "text-emerald-400", iconBg: "bg-emerald-500/15", icon: CheckCircle },
          { label: "Rejected", value: rejectedCount, gradient: "from-red-500/[0.08] via-background to-red-900/[0.04]", color: "text-red-400", iconBg: "bg-red-500/15", icon: XCircle },
        ].map(s => (
          <Card key={s.label} className={`border-0 bg-gradient-to-br ${s.gradient} overflow-hidden relative`}>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/[0.02] -translate-y-6 translate-x-6" />
            <CardContent className="p-4 flex items-center gap-3 relative">
              <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      </FadeInUp>

      {ordersWithBids.length > 1 && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>Filter by Order:</span>
          </div>
          <Select value={filterOrderId} onValueChange={setFilterOrderId}>
            <SelectTrigger className="w-56 bg-white/[0.03] border-white/[0.08]" data-testid="select-filter-order">
              <SelectValue placeholder="All Orders" />
            </SelectTrigger>
            <SelectContent className="bg-[#0a0a0f] border-white/[0.08]">
              <SelectItem value="all" data-testid="select-filter-all">All Orders ({bids?.length || 0} bids)</SelectItem>
              {ordersWithBids.map(o => (
                <SelectItem key={o.orderId} value={o.orderId} data-testid={`select-filter-order-${o.orderId}`}>
                  Order {o.label} ({o.bidCount} {o.bidCount === 1 ? "bid" : "bids"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filterOrderId !== "all" && (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => setFilterOrderId("all")} data-testid="button-clear-filter">
              Clear
            </Button>
          )}
          {filterOrderId !== "all" && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1">
              Showing {filteredBids?.length || 0} of {bids?.length || 0} bids
            </Badge>
          )}
        </div>
      )}

      <Card className="border-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01] overflow-hidden">
        <div className="overflow-x-auto">
        <Table className="min-w-[1400px]">
          <TableHeader className="bg-white/[0.03]">
            <TableRow className="border-white/[0.06]">
              <TableHead className="whitespace-nowrap">Proposal</TableHead>
              <SortableHeader label="Order" sortKey="orderId" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
              <SortableHeader label="Grinder" sortKey="grinderId" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
              <SortableHeader label="Bid" sortKey="bidAmount" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} className="text-right" />
              <TableHead className="text-right whitespace-nowrap">Order Price</TableHead>
              <SortableHeader label="Margin" sortKey="margin" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} className="text-right" />
              <SortableHeader label="Timeline" sortKey="timeline" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
              <TableHead className="whitespace-nowrap">Can Start</TableHead>
              <TableHead className="whitespace-nowrap">Est. Delivery</TableHead>
              <TableHead className="text-center whitespace-nowrap">QS</TableHead>
              <SortableHeader label="Submitted" sortKey="bidTime" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
              <SortableHeader label="Status" sortKey="status" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
              <TableHead className="whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={13} className="text-center h-24">Loading...</TableCell></TableRow>
            ) : sortedBids && sortedBids.length > 0 ? sortedBids.map((bid: Bid) => {
              const grinder = (grinders || []).find((g: Grinder) => g.id === bid.grinderId);
              const order = (orders || []).find((o: Order) => o.id === bid.orderId);
              const orderRef = order?.mgtOrderNumber ? `#${order.mgtOrderNumber}` : bid.orderId;
              return (
                <TableRow key={bid.id} className="hover:bg-white/[0.03] border-white/[0.04] transition-colors" data-testid={`row-bid-${bid.id}`}>
                  <TableCell className="font-mono text-sm">{bid.mgtProposalId ? `P${bid.mgtProposalId}` : bid.id}</TableCell>
                  <TableCell className="font-medium text-primary">{orderRef}</TableCell>
                  <TableCell>
                    <div>
                      <Link href={`/grinders?highlight=${bid.grinderId}`} className="font-medium text-primary hover:underline cursor-pointer" data-testid={`link-grinder-${bid.grinderId}`}>
                        {grinder?.name || bid.grinderId}
                      </Link>
                      {grinder && <p className="text-xs text-muted-foreground">{grinder.category}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-400 whitespace-nowrap">${bid.bidAmount}</TableCell>
                  <TableCell className="text-right text-muted-foreground whitespace-nowrap">{order ? `$${order.customerPrice}` : "-"}</TableCell>
                  <TableCell className="text-right">
                    {(() => {
                      const orderPrice = order?.customerPrice ? parseFloat(order.customerPrice) : 0;
                      const bidAmt = bid.bidAmount ? parseFloat(bid.bidAmount) : 0;
                      const liveMargin = orderPrice > 0 ? orderPrice - bidAmt : parseFloat(bid.margin || "0");
                      const liveMarginPct = orderPrice > 0 ? ((liveMargin / orderPrice) * 100).toFixed(1) : bid.marginPct || "0";
                      return liveMargin !== 0 || bid.margin ? (
                        <span className={`font-medium whitespace-nowrap ${liveMargin >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          ${liveMargin.toFixed(2)}
                          <span className="text-xs text-muted-foreground ml-1">({liveMarginPct}%)</span>
                        </span>
                      ) : <span className="text-muted-foreground">-</span>;
                    })()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {bid.timeline ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span>{bid.timeline}</span>
                      </div>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {bid.canStart ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Play className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="text-cyan-300">{bid.canStart}</span>
                      </div>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {bid.estDeliveryDate ? (
                      <div className="flex items-center gap-1 text-sm">
                        <CalendarCheck className="w-3 h-3 text-orange-400 shrink-0" />
                        <span>{format(new Date(bid.estDeliveryDate), "MMM d")}</span>
                      </div>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {bid.qualityScore ? (
                      <Badge variant="outline" className="border-purple-500/20 text-purple-400 bg-purple-500/10 text-xs">{bid.qualityScore}</Badge>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {bid.bidTime ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(bid.bidTime), "MMM d, h:mm a")}</span>
                        </TooltipTrigger>
                        <TooltipContent>{format(new Date(bid.bidTime), "PPpp")}</TooltipContent>
                      </Tooltip>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className={`border ${statusColor(bid.status)}`}>{bid.status}</Badge>
                      {bid.acceptedBy && <span className="text-[10px] text-muted-foreground">by {bid.acceptedBy}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-blue-400 hover:bg-blue-500/10"
                            data-testid={`button-edit-bid-${bid.id}`}
                            onClick={() => openEditDialog(bid)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit Bid</TooltipContent>
                      </Tooltip>
                      {bid.status === "Pending" && (
                        <>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-emerald-400 hover:bg-emerald-500/10"
                            data-testid={`button-accept-bid-${bid.id}`}
                            disabled={bidStatusMutation.isPending}
                            onClick={() => bidStatusMutation.mutate({ bidId: bid.id, status: "Accepted" })}>
                            <CheckCircle className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-red-400 hover:bg-red-500/10"
                            data-testid={`button-deny-bid-${bid.id}`}
                            disabled={bidStatusMutation.isPending}
                            onClick={() => bidStatusMutation.mutate({ bidId: bid.id, status: "Denied" })}>
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                      {isOwner && bid.status !== "Pending" && (
                        <>
                          {(bid.status === "Denied" || bid.status === "Order Assigned") && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-amber-400 hover:bg-amber-500/10"
                                  data-testid={`button-override-accept-${bid.id}`}
                                  disabled={bidOverrideMutation.isPending}
                                  onClick={() => bidOverrideMutation.mutate({ bidId: bid.id, status: "Accepted" })}>
                                  <Shield className="w-3.5 h-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Owner Override: Accept</TooltipContent>
                            </Tooltip>
                          )}
                          {bid.status === "Accepted" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-amber-400 hover:bg-amber-500/10"
                                  data-testid={`button-override-deny-${bid.id}`}
                                  disabled={bidOverrideMutation.isPending}
                                  onClick={() => bidOverrideMutation.mutate({ bidId: bid.id, status: "Denied" })}>
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Owner Override: Revoke & Deny</TooltipContent>
                            </Tooltip>
                          )}
                        </>
                      )}
                      {isOwner && bid.status !== "Pending" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-blue-400 hover:bg-blue-500/10"
                              data-testid={`button-override-reset-${bid.id}`}
                              disabled={bidOverrideMutation.isPending}
                              onClick={() => bidOverrideMutation.mutate({ bidId: bid.id, status: "Pending" })}>
                              <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Owner Override: Reset to Pending</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            }) : (
              <TableRow>
                <TableCell colSpan={13} className="text-center h-24 text-muted-foreground">
                  <Gavel className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  {filterOrderId !== "all"
                    ? "No bids found for this order."
                    : "No bids yet. Proposals appear when grinders submit via MGT Bot."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </Card>

      <Dialog open={!!editingBid} onOpenChange={(open) => !open && setEditingBid(null)}>
        <DialogContent className="bg-[#0a0a0f] border-white/[0.08] max-w-md" data-testid="dialog-edit-bid">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <Pencil className="w-4 h-4 text-blue-400" />
              </div>
              Edit Bid
            </DialogTitle>
            {editingBid && (
              <p className="text-sm text-muted-foreground mt-1">
                {editGrinder?.name || editingBid.grinderId} &mdash; Order {editOrder?.mgtOrderNumber ? `#${editOrder.mgtOrderNumber}` : editingBid.orderId}
                <Badge variant="outline" className={`ml-2 text-xs ${statusColor(editingBid.status)}`}>{editingBid.status}</Badge>
              </p>
            )}
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-bid-amount" className="text-sm font-medium">Bid Amount ($)</Label>
              <Input
                id="edit-bid-amount"
                type="number"
                step="0.01"
                min="0"
                value={editForm.bidAmount}
                onChange={(e) => setEditForm({ ...editForm, bidAmount: e.target.value })}
                className="bg-white/[0.03] border-white/[0.08]"
                data-testid="input-edit-bid-amount"
              />
              {editMarginPreview !== null && (
                <p className={`text-xs ${editMarginPreview >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  Margin: ${editMarginPreview.toFixed(2)} ({editOrder?.customerPrice && Number(editOrder.customerPrice) > 0
                    ? ((editMarginPreview / Number(editOrder.customerPrice)) * 100).toFixed(1) : "0"}%)
                  {editOrder?.customerPrice && <span className="text-muted-foreground ml-1">(Order: ${editOrder.customerPrice})</span>}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bid-timeline" className="text-sm font-medium">Timeline</Label>
              <Input
                id="edit-bid-timeline"
                value={editForm.timeline}
                onChange={(e) => setEditForm({ ...editForm, timeline: e.target.value })}
                placeholder="e.g. 2 hours, 1 day"
                className="bg-white/[0.03] border-white/[0.08]"
                data-testid="input-edit-bid-timeline"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bid-canstart" className="text-sm font-medium">Can Start</Label>
              <Input
                id="edit-bid-canstart"
                value={editForm.canStart}
                onChange={(e) => setEditForm({ ...editForm, canStart: e.target.value })}
                placeholder="e.g. Now, Tonight, Tomorrow"
                className="bg-white/[0.03] border-white/[0.08]"
                data-testid="input-edit-bid-canstart"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bid-notes" className="text-sm font-medium">Notes</Label>
              <Textarea
                id="edit-bid-notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Staff notes about this bid..."
                className="bg-white/[0.03] border-white/[0.08] resize-none"
                rows={3}
                data-testid="input-edit-bid-notes"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditingBid(null)} className="border-white/[0.08]" data-testid="button-edit-bid-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={bidEditMutation.isPending}
              className="gap-2"
              data-testid="button-edit-bid-save"
            >
              {bidEditMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={addBidOpen} onOpenChange={setAddBidOpen}>
        <DialogContent className="bg-[#0a0a0f] border-white/[0.08] max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              Add Bid
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Order *</Label>
              <Select value={addBidForm.orderId} onValueChange={(val) => setAddBidForm({ ...addBidForm, orderId: val })}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.08]" data-testid="select-add-bid-order">
                  <SelectValue placeholder="Select an order" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0f] border-white/[0.08] max-h-60">
                  {(orders || [])
                    .filter((o: Order) => o.status !== "Completed" && o.status !== "Paid Out")
                    .map((o: Order) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.mgtOrderNumber ? `#${o.mgtOrderNumber}` : o.id} — {o.serviceName || "Unknown"} {o.customerPrice ? `($${o.customerPrice})` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Grinder *</Label>
              <Select value={addBidForm.grinderId} onValueChange={(val) => setAddBidForm({ ...addBidForm, grinderId: val })}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.08]" data-testid="select-add-bid-grinder">
                  <SelectValue placeholder="Select a grinder" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0f] border-white/[0.08] max-h-60">
                  {(grinders || [])
                    .filter((g: Grinder) => g.status !== "suspended")
                    .sort((a: Grinder, b: Grinder) => (a.name || "").localeCompare(b.name || ""))
                    .map((g: Grinder) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name || g.discordUsername} {g.category ? `(${g.category})` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Bid Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  value={addBidForm.bidAmount}
                  onChange={(e) => setAddBidForm({ ...addBidForm, bidAmount: e.target.value })}
                  placeholder="0.00"
                  className="bg-white/[0.03] border-white/[0.08] pl-9"
                  data-testid="input-add-bid-amount"
                />
              </div>
              {addBidForm.bidAmount && addBidForm.orderId && (() => {
                const selOrder = (orders || []).find((o: Order) => o.id === addBidForm.orderId);
                if (!selOrder?.customerPrice) return null;
                const m = Number(selOrder.customerPrice) - Number(addBidForm.bidAmount);
                const mp = ((m / Number(selOrder.customerPrice)) * 100).toFixed(1);
                return (
                  <p className={`text-xs ${m >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    Margin: ${m.toFixed(2)} ({mp}%)
                    <span className="text-muted-foreground ml-1">(Order: ${selOrder.customerPrice})</span>
                  </p>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Timeline (hours)</Label>
                <Input
                  type="number"
                  value={addBidForm.timeline}
                  onChange={(e) => setAddBidForm({ ...addBidForm, timeline: e.target.value })}
                  placeholder="e.g. 24"
                  className="bg-white/[0.03] border-white/[0.08]"
                  data-testid="input-add-bid-timeline"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Can Start</Label>
                <Input
                  value={addBidForm.canStart}
                  onChange={(e) => setAddBidForm({ ...addBidForm, canStart: e.target.value })}
                  placeholder="e.g. Now, Tonight"
                  className="bg-white/[0.03] border-white/[0.08]"
                  data-testid="input-add-bid-canstart"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Notes</Label>
              <Textarea
                value={addBidForm.notes}
                onChange={(e) => setAddBidForm({ ...addBidForm, notes: e.target.value })}
                placeholder="Optional notes about this bid..."
                className="bg-white/[0.03] border-white/[0.08] resize-none"
                rows={3}
                data-testid="input-add-bid-notes"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAddBidOpen(false)} className="border-white/[0.08]" data-testid="button-add-bid-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleAddBidSubmit}
              disabled={createBidMutation.isPending || !addBidForm.orderId || !addBidForm.grinderId || !addBidForm.bidAmount}
              className="gap-2"
              data-testid="button-add-bid-submit"
            >
              {createBidMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Bid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
    </TooltipProvider>
  );
}
