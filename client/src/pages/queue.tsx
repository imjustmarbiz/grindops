import { useTopQueue } from "@/hooks/use-queue";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Activity, Clock, Crown, TrendingUp, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Queue() {
  const { data: queue, isLoading, isError } = useTopQueue();

  if (isError) {
    return <div className="text-destructive p-4 border border-destructive/20 rounded-xl bg-destructive/10">Failed to load priority queue.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3 tracking-tight" data-testid="text-queue-title">
            Priority Queue <Badge variant="secondary" className="bg-primary/20 text-primary font-bold border-primary/30">LIVE</Badge>
          </h1>
          <p className="text-muted-foreground mt-1">Algorithmically sorted assignments based on fairness, profit, and delivery.</p>
        </div>
      </div>

      <Card className="glass-panel overflow-hidden border-border/50 shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/5 border-b border-white/10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-24 text-center font-medium text-white/70">Score</TableHead>
                <TableHead className="font-medium text-white/70">Order ID</TableHead>
                <TableHead className="font-medium text-white/70">Service</TableHead>
                <TableHead className="font-medium text-white/70">Grinder</TableHead>
                <TableHead className="text-right font-medium text-white/70">Bid / Price</TableHead>
                <TableHead className="text-right font-medium text-white/70">Deadlines</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : queue && queue.length > 0 ? (
                queue.map((item, index) => (
                  <TableRow 
                    key={item.id} 
                    className={`transition-colors hover:bg-white/[0.04] ${index === 0 ? 'bg-primary/[0.03]' : ''}`}
                    data-testid={`row-queue-${item.id}`}
                  >
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`font-display font-bold text-sm border-white/10 ${
                        item.finalPriorityScore >= 80 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        item.finalPriorityScore >= 50 ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        'bg-white/5 text-muted-foreground'
                      }`} data-testid={`badge-score-${item.id}`}>
                        {item.finalPriorityScore.toFixed(0)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-medium" data-testid={`text-queue-order-${item.id}`}>{item.orderId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-accent" />
                        <span className="font-medium" data-testid={`text-queue-service-${item.id}`}>{item.serviceName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.tier === 'Elite' ? <Crown className="w-4 h-4 text-yellow-500" /> : <Users className="w-4 h-4 text-muted-foreground" />}
                        <span className={item.tier === 'Elite' ? 'font-bold text-yellow-500' : 'font-medium text-foreground'} data-testid={`text-queue-grinder-${item.id}`}>{item.grinderName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-green-400" data-testid={`text-queue-bid-${item.id}`}>${item.bidAmount}</span>
                        <span className="text-xs text-muted-foreground line-through">${item.customerPrice}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1 text-sm font-medium text-orange-400">
                          <TrendingUp className="w-3 h-3" />
                          Est: {format(new Date(item.estDeliveryDateTime), "MMM d, h:mm a")}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          Due: {format(new Date(item.dueDateTime), "MMM d, h:mm a")}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Activity className="w-8 h-8 opacity-20" />
                      <p>Queue is empty. Waiting for MGT Bot orders and bids.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
