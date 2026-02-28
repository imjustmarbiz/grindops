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
import { Gavel, Clock, CheckCircle, XCircle, Filter, Search, Shield, RotateCcw, Pencil, DollarSign, Link2, Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { HelpTip } from "@/components/help-tip";
import { useAuth } from "@/hooks/use-auth";
import type { Bid, Order, Grinder } from "@shared/schema";
import { useTableSort } from "@/hooks/use-table-sort";

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
              <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight flex items-center gap-3">
                <Gavel className="w-7 h-7 text-primary" />
                Proposals & Bids
                <HelpTip text="Bids are imported from the MGT Bot. Accept a bid to auto-create an assignment." />
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Grinder proposals imported from MGT Bot.</p>
            </div>
          </div>
        </FadeInUp>

        <FadeInUp>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total", value: bids?.length || 0, color: "text-foreground", icon: Gavel },
              { label: "Pending", value: pendingCount, color: "text-blue-400", icon: Clock },
              { label: "Accepted", value: acceptedCount, color: "text-emerald-400", icon: CheckCircle },
              { label: "Rejected", value: rejectedCount, color: "text-red-400", icon: XCircle },
            ].map(s => (
              <Card key={s.label} className="border-0 bg-white/[0.02]">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
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

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64 bg-white/[0.03]"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-white/[0.03]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Accepted">Accepted</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="border-0 bg-white/[0.02] overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => toggleSort("id")} className="cursor-pointer">ID</TableHead>
                  <TableHead onClick={() => toggleSort("orderId")} className="cursor-pointer">Order</TableHead>
                  <TableHead onClick={() => toggleSort("grinderId")} className="cursor-pointer">Grinder</TableHead>
                  <TableHead onClick={() => toggleSort("bidAmount")} className="cursor-pointer text-right">Amount</TableHead>
                  <TableHead onClick={() => toggleSort("status")} className="cursor-pointer">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedBids.map(bid => {
                  const grinder = (grinders || []).find(g => g.id === bid.grinderId);
                  const order = (orders || []).find(o => o.id === bid.orderId);
                  return (
                    <TableRow key={bid.id}>
                      <TableCell className="font-mono text-xs">{bid.mgtProposalId || bid.id}</TableCell>
                      <TableCell className="font-bold">{order?.mgtOrderNumber ? `#${order.mgtOrderNumber}` : bid.orderId}</TableCell>
                      <TableCell>{grinder?.name || bid.grinderId}</TableCell>
                      <TableCell className="text-right font-bold text-emerald-400">${bid.bidAmount}</TableCell>
                      <TableCell>
                        <Badge className={statusColor(bid.status)}>{bid.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {bid.status === "Pending" && (
                            <>
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
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-red-400"
                                onClick={() => bidStatusMutation.mutate({ bidId: bid.id, status: "Rejected" })}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {isOwner && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-blue-400"
                              onClick={() => bidOverrideMutation.mutate({ bidId: bid.id, status: "Pending" })}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
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
