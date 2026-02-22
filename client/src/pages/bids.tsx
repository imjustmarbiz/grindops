import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Gavel, Clock, DollarSign, CalendarCheck, Play, CheckCircle, XCircle, RotateCcw, Shield, Loader2 } from "lucide-react";
import type { Bid, Order, Grinder } from "@shared/schema";

export default function Bids() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const { data: bids, isLoading } = useQuery<Bid[]>({ queryKey: ["/api/bids"] });
  const { data: orders } = useQuery<Order[]>({ queryKey: ["/api/orders"] });
  const { data: grinders } = useQuery<Grinder[]>({ queryKey: ["/api/grinders"] });

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

  const pendingCount = bids?.filter(b => b.status === "Pending").length || 0;
  const acceptedCount = bids?.filter(b => b.status === "Accepted").length || 0;
  const rejectedCount = bids?.filter(b => b.status === "Rejected" || b.status === "Denied").length || 0;

  return (
    <TooltipProvider>
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold flex items-center gap-3" data-testid="text-bids-title">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Gavel className="w-5 h-5 text-primary" />
            </div>
            Proposals & Bids
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Grinder proposals imported from MGT Bot.</p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/20 gap-1 animate-pulse">
            <Clock className="w-3 h-3" />
            {pendingCount} pending
          </Badge>
        )}
      </div>

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

      <Card className="border-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01] overflow-hidden">
        <Table>
          <TableHeader className="bg-white/[0.03]">
            <TableRow className="border-white/[0.06]">
              <TableHead>Proposal</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Grinder</TableHead>
              <TableHead className="text-right">Bid</TableHead>
              <TableHead className="text-right">Order Price</TableHead>
              <TableHead className="text-right">Margin</TableHead>
              <TableHead>Timeline</TableHead>
              <TableHead>Can Start</TableHead>
              <TableHead>Est. Delivery</TableHead>
              <TableHead className="text-center">QS</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={13} className="text-center h-24">Loading...</TableCell></TableRow>
            ) : bids && bids.length > 0 ? bids.map((bid: Bid) => {
              const grinder = (grinders || []).find((g: Grinder) => g.id === bid.grinderId);
              const order = (orders || []).find((o: Order) => o.id === bid.orderId);
              const orderRef = order?.mgtOrderNumber ? `#${order.mgtOrderNumber}` : bid.orderId;
              return (
                <TableRow key={bid.id} className="hover:bg-white/[0.03] border-white/[0.04] transition-colors" data-testid={`row-bid-${bid.id}`}>
                  <TableCell className="font-mono text-sm">{bid.mgtProposalId ? `P${bid.mgtProposalId}` : bid.id}</TableCell>
                  <TableCell className="font-medium text-primary">{orderRef}</TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{grinder?.name || bid.grinderId}</span>
                      {grinder && <p className="text-xs text-muted-foreground">{grinder.category}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-400">${bid.bidAmount}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{order ? `$${order.customerPrice}` : "-"}</TableCell>
                  <TableCell className="text-right">
                    {bid.margin ? (
                      <span className="font-medium text-emerald-400">
                        <DollarSign className="w-3 h-3 inline" />{bid.margin}
                        {bid.marginPct && <span className="text-xs text-muted-foreground ml-1">({bid.marginPct}%)</span>}
                      </span>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    {bid.timeline ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span>{bid.timeline}</span>
                      </div>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    {bid.canStart ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Play className="w-3 h-3 text-cyan-400" />
                        <span className="text-cyan-300">{bid.canStart}</span>
                      </div>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    {bid.estDeliveryDate ? (
                      <div className="flex items-center gap-1 text-sm">
                        <CalendarCheck className="w-3 h-3 text-orange-400" />
                        <span>{format(new Date(bid.estDeliveryDate), "MMM d")}</span>
                      </div>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {bid.qualityScore ? (
                      <Badge variant="outline" className="border-purple-500/20 text-purple-400 bg-purple-500/10 text-xs">{bid.qualityScore}</Badge>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    {bid.bidTime ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-xs text-muted-foreground">{format(new Date(bid.bidTime), "MMM d, h:mm a")}</span>
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
                  No bids yet. Proposals appear when grinders submit via MGT Bot.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
    </TooltipProvider>
  );
}
