import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Gavel, Clock, CheckCircle, XCircle, Filter, Search, Shield, RotateCcw, Pencil, DollarSign, Link2, Loader2, Plus, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { HelpTip } from "@/components/help-tip";
import { useAuth } from "@/hooks/use-auth";
import type { Bid, Order, Grinder } from "@shared/schema";
import { useTableSort } from "@/hooks/use-table-sort";
import { SortableHeader } from "@/components/sortable-header";

export default function Bids() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: bids } = useQuery<Bid[]>({ queryKey: ["/api/bids"], refetchInterval: 30000 });
  const { data: orders } = useQuery<Order[]>({ queryKey: ["/api/orders"], refetchInterval: 30000 });
  const { data: grinders } = useQuery<Grinder[]>({ queryKey: ["/api/grinders"], refetchInterval: 30000 });

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterOrderId, setFilterOrderId] = useState("all");
  const [filterGrinderId, setFilterGrinderId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingBid, setEditingBid] = useState<Bid | null>(null);
  const [addBidOpen, setAddBidOpen] = useState(false);
  const [addBidForm, setAddBidForm] = useState({ orderId: "", grinderId: "", bidAmount: "", timeline: "", canStart: "", notes: "" });
  const [pricePrompt, setPricePrompt] = useState<{ bidId: string; orderId: string; orderLabel: string; isOverride?: boolean } | null>(null);
  const [promptPrice, setPromptPrice] = useState("");
  const [ticketDialog, setTicketDialog] = useState<{ orderId: string; orderLabel: string } | null>(null);
  const [ticketChannelId, setTicketChannelId] = useState("");
  const [customerDiscordId, setCustomerDiscordId] = useState("");

  const [editForm, setEditForm] = useState({ bidAmount: "", timeline: "", notes: "" });

  const bidStatusMutation = useMutation({
    mutationFn: async ({ bidId, status }: { bidId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/bids/${bidId}/status`, { status });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      if (data.status === "Accepted") {
        const order = (orders || []).find(o => o.id === data.orderId);
        setTicketDialog({ orderId: data.orderId, orderLabel: order?.mgtOrderNumber ? `#${order.mgtOrderNumber}` : data.orderId });
      }
    },
  });

  const bidOverrideMutation = useMutation({
    mutationFn: async ({ bidId, status }: { bidId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/staff/bids/${bidId}/override`, { status });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({ title: `Bid status overridden to ${data.status}` });
      if (data.status === "Accepted") {
        const order = (orders || []).find(o => o.id === data.orderId);
        setTicketDialog({ orderId: data.orderId, orderLabel: order?.mgtOrderNumber ? `#${order.mgtOrderNumber}` : data.orderId });
      }
    },
  });

  const linkTicketMutation = useMutation({
    mutationFn: async (data: { orderId: string; discordTicketChannelId: string; customerDiscordId?: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${data.orderId}/ticket`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Ticket linked successfully" });
      setTicketDialog(null);
      setTicketChannelId("");
      setCustomerDiscordId("");
    },
  });

  const createBidMutation = useMutation({
    mutationFn: async (data: { orderId: string; grinderId: string; bidAmount: string; timeline?: string; canStart?: string; notes?: string }) => {
      const res = await apiRequest("POST", "/api/bids", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Bid created", description: "Manual bid added successfully." });
      setAddBidOpen(false);
      setAddBidForm({ orderId: "", grinderId: "", bidAmount: "", timeline: "", canStart: "", notes: "" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to create bid", description: err.message || "Something went wrong", variant: "destructive" });
    },
  });

  const filteredBids = useMemo(() => {
    let result = bids || [];
    if (filterStatus !== "all") result = result.filter(b => b.status === filterStatus);
    if (filterOrderId !== "all") result = result.filter(b => b.orderId === filterOrderId);
    if (filterGrinderId !== "all") result = result.filter(b => b.grinderId === filterGrinderId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => {
        const grinder = (grinders || []).find(g => g.id === b.grinderId);
        const order = (orders || []).find(o => o.id === b.orderId);
        return (
          grinder?.name?.toLowerCase().includes(q) ||
          order?.mgtOrderNumber?.toString().includes(q) ||
          b.notes?.toLowerCase().includes(q)
        );
      });
    }
    return result;
  }, [bids, filterStatus, filterOrderId, filterGrinderId, searchQuery, grinders, orders]);

  const { sortedItems: sortedBids, sortKey, sortDir, toggleSort } = useTableSort<Bid>(filteredBids);

  const pendingCount = bids?.filter(b => b.status === "Pending").length || 0;
  const acceptedCount = bids?.filter(b => b.status === "Accepted").length || 0;
  const rejectedCount = bids?.filter(b => b.status === "Rejected" || b.status === "Denied").length || 0;
  const bidsWithMargin = (bids || []).filter(b => b.marginPct && Number(b.marginPct) > 0);
  const avgMargin = bidsWithMargin.length > 0
    ? `${(bidsWithMargin.reduce((s, b) => s + Number(b.marginPct || 0), 0) / bidsWithMargin.length).toFixed(0)}%`
    : "—";

  const statusColor = (s: string) => {
    if (s === "Accepted") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (s === "Rejected" || s === "Denied") return "text-red-400 bg-red-500/10 border-red-500/20";
    return "text-blue-400 bg-blue-500/10 border-blue-500/20";
  };

  const editOrder = editingBid ? (orders || []).find(o => o.id === editingBid.orderId) : null;
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
                <HelpTip text="Accept a bid to auto-create an assignment. Bids come from grinder dashboard submissions and can also be added manually by staff." />
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Track and manage grinder bids. Accept a bid to auto-create an assignment.</p>
            </div>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => setAddBidOpen(true)}
              data-testid="button-add-bid"
            >
              <Plus className="w-4 h-4" />
              Add Bid
            </Button>
          </div>
        </FadeInUp>

        <FadeInUp>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: "Total", value: bids?.length || 0, icon: Gavel, gradient: "from-purple-500/[0.08] via-background to-purple-900/[0.04]", iconBg: "bg-purple-500/15", color: "text-purple-400" },
              { label: "Pending", value: pendingCount, icon: Clock, gradient: "from-blue-500/[0.08] via-background to-blue-900/[0.04]", iconBg: "bg-blue-500/15", color: "text-blue-400" },
              { label: "Accepted", value: acceptedCount, icon: CheckCircle, gradient: "from-emerald-500/[0.08] via-background to-emerald-900/[0.04]", iconBg: "bg-emerald-500/15", color: "text-emerald-400" },
              { label: "Rejected", value: rejectedCount, icon: XCircle, gradient: "from-red-500/[0.08] via-background to-red-900/[0.04]", iconBg: "bg-red-500/15", color: "text-red-400" },
              { label: "Avg Margin", value: avgMargin, icon: Percent, gradient: "from-amber-500/[0.06] via-background to-amber-900/[0.03]", iconBg: "bg-amber-500/15", color: "text-amber-400" },
            ].map(s => (
              <Card key={s.label} className={`border-0 bg-gradient-to-br ${s.gradient} overflow-hidden relative`}>
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/[0.02] -translate-y-6 translate-x-6" />
                <CardContent className="p-4 flex items-center gap-3 relative">
                  <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center shrink-0`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className={`text-xl font-bold ${s.color}`} data-testid={`text-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </FadeInUp>

        <FadeInUp>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, order, grinder..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white/[0.03] border-white/[0.08]"
                  data-testid="input-search-bids"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[160px] bg-white/[0.03] border-white/[0.08]" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Denied">Denied</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterGrinderId} onValueChange={setFilterGrinderId}>
                <SelectTrigger className="w-[160px] bg-white/[0.03] border-white/[0.08]" data-testid="select-grinder-filter">
                  <SelectValue placeholder="Grinder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grinders</SelectItem>
                  {(grinders || []).map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground mt-3" data-testid="text-showing-count">
              Showing {filteredBids.length} of {(bids || []).length} bids
            </p>
          </div>
        </FadeInUp>

        <FadeInUp>
        <Card className="border-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01] overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader label="ID" sortKey="id" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
                  <SortableHeader label="Order" sortKey="orderId" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
                  <SortableHeader label="Grinder" sortKey="grinderId" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
                  <SortableHeader label="Bid Amount" sortKey="bidAmount" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
                  <SortableHeader label="Margin" sortKey="margin" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
                  <SortableHeader label="Timeline" sortKey="timeline" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
                  <SortableHeader label="Submitted" sortKey="bidTime" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
                  <SortableHeader label="Status" sortKey="status" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={toggleSort} />
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedBids.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Gavel className="w-8 h-8 opacity-30" />
                        <p>No bids yet. Bids appear when grinders submit proposals or staff adds them manually.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedBids.map(bid => {
                  const grinder = (grinders || []).find(g => g.id === bid.grinderId);
                  const order = (orders || []).find(o => o.id === bid.orderId);
                  const marginVal = bid.marginPct ? `${Number(bid.marginPct).toFixed(0)}%` : bid.margin ? `$${Number(bid.margin).toFixed(0)}` : "—";
                  return (
                    <TableRow key={bid.id} data-testid={`row-bid-${bid.id}`}>
                      <TableCell className="font-mono text-xs">{bid.displayId || bid.mgtProposalId || bid.id}</TableCell>
                      <TableCell className="font-bold">{order?.mgtOrderNumber ? `#${order.mgtOrderNumber}` : bid.orderId}</TableCell>
                      <TableCell>{grinder?.name || bid.grinderId}</TableCell>
                      <TableCell className="font-bold text-emerald-400">${bid.bidAmount}</TableCell>
                      <TableCell className="text-muted-foreground">{marginVal}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{bid.timeline || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{bid.bidTime ? format(new Date(bid.bidTime), "MMM d, yyyy") : "—"}</TableCell>
                      <TableCell>
                        <Badge className={statusColor(bid.status)}>{bid.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {bid.status === "Pending" && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-emerald-400"
                                    onClick={() => {
                                      if (!order?.customerPrice || Number(order.customerPrice) <= 0) {
                                        setPricePrompt({ bidId: bid.id, orderId: bid.orderId, orderLabel: order?.mgtOrderNumber ? `#${order.mgtOrderNumber}` : bid.orderId });
                                      } else {
                                        bidStatusMutation.mutate({ bidId: bid.id, status: "Accepted" });
                                      }
                                    }}
                                    data-testid={`button-accept-bid-${bid.id}`}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Accept</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-red-400"
                                    onClick={() => bidStatusMutation.mutate({ bidId: bid.id, status: "Rejected" })}
                                    data-testid={`button-reject-bid-${bid.id}`}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Reject</TooltipContent>
                              </Tooltip>
                            </>
                          )}
                          {isOwner && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-blue-400"
                                  onClick={() => bidOverrideMutation.mutate({ bidId: bid.id, status: "Pending" })}
                                  data-testid={`button-reset-bid-${bid.id}`}
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reset to Pending</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
        </FadeInUp>

        <Dialog open={!!pricePrompt} onOpenChange={() => setPricePrompt(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Order Price</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">Order {pricePrompt?.orderLabel} has no price. Set one before accepting the bid.</p>
              <Input
                type="number"
                placeholder="0.00"
                value={promptPrice}
                onChange={(e) => setPromptPrice(e.target.value)}
              />
              <Button
                className="w-full"
                onClick={async () => {
                  if (!pricePrompt || !promptPrice) return;
                  await apiRequest("PATCH", `/api/orders/${pricePrompt.orderId}/price`, { customerPrice: promptPrice });
                  if (pricePrompt.isOverride) {
                    bidOverrideMutation.mutate({ bidId: pricePrompt.bidId, status: "Accepted" });
                  } else {
                    bidStatusMutation.mutate({ bidId: pricePrompt.bidId, status: "Accepted" });
                  }
                  setPricePrompt(null);
                }}
              >
                Set Price & Accept
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={addBidOpen} onOpenChange={setAddBidOpen}>
          <DialogContent data-testid="dialog-add-bid">
            <DialogHeader>
              <DialogTitle>Add Bid Manually</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Order</Label>
                <Select value={addBidForm.orderId} onValueChange={(v) => setAddBidForm(f => ({ ...f, orderId: v }))}>
                  <SelectTrigger data-testid="select-add-bid-order">
                    <SelectValue placeholder="Select an order" />
                  </SelectTrigger>
                  <SelectContent>
                    {(orders || []).filter(o => o.status === "Open").map(o => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.mgtOrderNumber ? `#${o.mgtOrderNumber}` : o.id} — {o.serviceName || o.gameTitle || "Order"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Grinder</Label>
                <Select value={addBidForm.grinderId} onValueChange={(v) => setAddBidForm(f => ({ ...f, grinderId: v }))}>
                  <SelectTrigger data-testid="select-add-bid-grinder">
                    <SelectValue placeholder="Select a grinder" />
                  </SelectTrigger>
                  <SelectContent>
                    {(grinders || []).filter(g => !g.suspended).map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Bid Amount ($)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={addBidForm.bidAmount}
                  onChange={(e) => setAddBidForm(f => ({ ...f, bidAmount: e.target.value }))}
                  data-testid="input-add-bid-amount"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Timeline</Label>
                  <Input
                    placeholder="e.g. 2 days"
                    value={addBidForm.timeline}
                    onChange={(e) => setAddBidForm(f => ({ ...f, timeline: e.target.value }))}
                    data-testid="input-add-bid-timeline"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Can Start</Label>
                  <Input
                    placeholder="e.g. Immediately"
                    value={addBidForm.canStart}
                    onChange={(e) => setAddBidForm(f => ({ ...f, canStart: e.target.value }))}
                    data-testid="input-add-bid-can-start"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Optional notes..."
                  value={addBidForm.notes}
                  onChange={(e) => setAddBidForm(f => ({ ...f, notes: e.target.value }))}
                  data-testid="input-add-bid-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddBidOpen(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={!addBidForm.orderId || !addBidForm.grinderId || !addBidForm.bidAmount || createBidMutation.isPending}
                onClick={() => createBidMutation.mutate({
                  orderId: addBidForm.orderId,
                  grinderId: addBidForm.grinderId,
                  bidAmount: addBidForm.bidAmount,
                  timeline: addBidForm.timeline || undefined,
                  canStart: addBidForm.canStart || undefined,
                  notes: addBidForm.notes || undefined,
                })}
                data-testid="button-submit-add-bid"
              >
                {createBidMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Add Bid
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!ticketDialog} onOpenChange={() => setTicketDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link Discord Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Label>Channel ID</Label>
              <Input value={ticketChannelId} onChange={(e) => setTicketChannelId(e.target.value)} />
              <Label>Customer User ID</Label>
              <Input value={customerDiscordId} onChange={(e) => setCustomerDiscordId(e.target.value)} />
              <Button
                className="w-full"
                onClick={() => {
                  if (ticketDialog) {
                    linkTicketMutation.mutate({
                      orderId: ticketDialog.orderId,
                      discordTicketChannelId: ticketChannelId,
                      customerDiscordId: customerDiscordId || undefined
                    });
                  }
                }}
              >
                Link Ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </AnimatedPage>
    </TooltipProvider>
  );
}
