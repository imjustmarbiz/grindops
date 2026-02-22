import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Gavel, Clock, Zap, DollarSign } from "lucide-react";
import type { Bid, Order, Grinder } from "@shared/schema";

export default function Bids() {
  const { data: bids, isLoading } = useQuery<Bid[]>({ queryKey: ["/api/bids"] });
  const { data: orders } = useQuery<Order[]>({ queryKey: ["/api/orders"] });
  const { data: grinders } = useQuery<Grinder[]>({ queryKey: ["/api/grinders"] });

  const statusColor = (status: string) => {
    switch (status) {
      case "Accepted": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Rejected": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "Countered": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default: return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3" data-testid="text-bids-title">
          <Gavel className="w-8 h-8 text-primary" /> Proposals & Bids
        </h1>
        <p className="text-muted-foreground mt-1">Grinder proposals imported from MGT Bot.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: bids?.length || 0, color: "text-foreground" },
          { label: "Pending", value: bids?.filter(b => b.status === "Pending").length || 0, color: "text-blue-400" },
          { label: "Accepted", value: bids?.filter(b => b.status === "Accepted").length || 0, color: "text-green-400" },
          { label: "Rejected", value: bids?.filter(b => b.status === "Rejected").length || 0, color: "text-red-400" },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <div className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow>
              <TableHead>Proposal</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Grinder</TableHead>
              <TableHead className="text-right">Bid</TableHead>
              <TableHead className="text-right">Order Price</TableHead>
              <TableHead className="text-right">Margin</TableHead>
              <TableHead>Timeline</TableHead>
              <TableHead className="text-center">QS</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center h-24">Loading...</TableCell></TableRow>
            ) : bids && bids.length > 0 ? bids.map((bid: Bid) => {
              const grinder = (grinders || []).find((g: Grinder) => g.id === bid.grinderId);
              const order = (orders || []).find((o: Order) => o.id === bid.orderId);
              const orderRef = order?.mgtOrderNumber ? `#${order.mgtOrderNumber}` : bid.orderId;
              return (
                <TableRow key={bid.id} className="hover:bg-white/[0.02]" data-testid={`row-bid-${bid.id}`}>
                  <TableCell className="font-mono text-sm">{bid.mgtProposalId ? `P${bid.mgtProposalId}` : bid.id}</TableCell>
                  <TableCell className="font-medium text-primary">{orderRef}</TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{grinder?.name || bid.grinderId}</span>
                      {grinder && <p className="text-xs text-muted-foreground">{grinder.category}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-400">${bid.bidAmount}</TableCell>
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
                  <TableCell className="text-center">
                    {bid.qualityScore ? (
                      <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">{bid.qualityScore}</Badge>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className={statusColor(bid.status)}>{bid.status}</Badge>
                      {bid.acceptedBy && <span className="text-[10px] text-muted-foreground">by {bid.acceptedBy}</span>}
                    </div>
                  </TableCell>
                </TableRow>
              );
            }) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                  No bids yet. Proposals appear when grinders submit via MGT Bot.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
