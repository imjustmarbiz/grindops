import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileCheck, DollarSign, Users, CheckCircle, Clock } from "lucide-react";
import type { Assignment, Order, Grinder } from "@shared/schema";

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
}

export default function Assignments() {
  const { data: assignments, isLoading } = useQuery<Assignment[]>({ queryKey: ["/api/assignments"] });
  const { data: orders } = useQuery<Order[]>({ queryKey: ["/api/orders"] });
  const { data: grinders } = useQuery<Grinder[]>({ queryKey: ["/api/grinders"] });

  const active = (assignments || []).filter(a => a.status === "Active");
  const completed = (assignments || []).filter(a => a.status === "Completed");
  const totalGrinderPay = (assignments || []).reduce((sum, a) => sum + (Number(a.grinderEarnings) || 0), 0);
  const totalProfit = (assignments || []).reduce((sum, a) => sum + (Number(a.companyProfit) || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3" data-testid="text-assignments-title">
          <FileCheck className="w-8 h-8 text-primary" /> Assignments
        </h1>
        <p className="text-muted-foreground mt-1">Auto-created when bids are accepted via MGT Bot.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-400" />
            <div>
              <p className="text-xl font-bold">{active.length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            <div>
              <p className="text-xl font-bold">{completed.length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-400" />
            <div>
              <p className="text-xl font-bold text-blue-400">{formatCurrency(totalGrinderPay)}</p>
              <p className="text-xs text-muted-foreground">Grinder Pay</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            <div>
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalProfit)}</p>
              <p className="text-xs text-muted-foreground">Company Profit</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Grinder</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="text-right">Order Price</TableHead>
              <TableHead className="text-right">Grinder Pay</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center h-24">Loading...</TableCell></TableRow>
            ) : assignments && assignments.length > 0 ? assignments.map((a: Assignment) => {
              const grinder = (grinders || []).find((g: Grinder) => g.id === a.grinderId);
              const order = (orders || []).find((o: Order) => o.id === a.orderId);
              const orderRef = order?.mgtOrderNumber ? `#${order.mgtOrderNumber}` : a.orderId;
              return (
                <TableRow key={a.id} className="hover:bg-white/[0.02]" data-testid={`row-assignment-${a.id}`}>
                  <TableCell className="font-mono text-sm text-muted-foreground">{a.id}</TableCell>
                  <TableCell className="font-bold text-primary">{orderRef}</TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{grinder?.name || a.grinderId}</span>
                      {grinder && <p className="text-xs text-muted-foreground">{grinder.category}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(a.assignedDateTime), "MMM d, h:mm a")}</TableCell>
                  <TableCell className="text-sm text-orange-400">{format(new Date(a.dueDateTime), "MMM d, h:mm a")}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{a.orderPrice ? `$${a.orderPrice}` : "-"}</TableCell>
                  <TableCell className="text-right font-medium text-blue-400">{a.grinderEarnings ? `$${a.grinderEarnings}` : a.bidAmount ? `$${a.bidAmount}` : "-"}</TableCell>
                  <TableCell className="text-right font-bold text-emerald-400">{a.companyProfit ? `$${a.companyProfit}` : a.margin ? `$${a.margin}` : "-"}</TableCell>
                  <TableCell>
                    <Badge variant={a.status === "Active" ? "default" : "secondary"} className={a.status === "Active" ? "bg-primary/20 text-primary border-primary/30" : ""}>
                      {a.status}
                      {a.wasReassigned && " (Re)"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            }) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                  No assignments yet. Assignments are auto-created when staff accepts bids in Discord.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
