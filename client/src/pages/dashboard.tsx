import { useDashboardStats } from "@/hooks/use-dashboard";
import { useBids } from "@/hooks/use-bids";
import { useOrders } from "@/hooks/use-orders";
import { useGrinders } from "@/hooks/use-grinders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Target, Users, CheckCircle2, Gavel, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useDashboardStats();
  const { data: bids } = useBids();
  const { data: orders } = useOrders();
  const { data: grinders } = useGrinders();

  const pendingBids = bids?.filter(b => b.status === "Pending").length || 0;
  const acceptedBids = bids?.filter(b => b.status === "Accepted").length || 0;
  const recentBids = bids?.slice(-5).reverse() || [];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (isError) {
    return <div className="text-destructive p-4 border border-destructive/20 rounded-xl bg-destructive/10">Failed to load dashboard statistics.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight" data-testid="text-dashboard-title">Command Center</h1>
        <p className="text-muted-foreground mt-1">Real-time overview powered by MGT Bot data.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl bg-card" />)}
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div variants={item}>
            <Card className="glass-panel border-l-4 border-l-primary hover:border-l-primary/80 transition-colors" data-testid="card-active-orders">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Orders</CardTitle>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold" data-testid="text-active-orders">{stats?.activeOrders || 0}</div>
                <p className="text-xs text-muted-foreground mt-1 text-primary/80 font-medium">Open in queue</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="glass-panel border-l-4 border-l-accent hover:border-l-accent/80 transition-colors" data-testid="card-pending-bids">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Bids</CardTitle>
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <Gavel className="h-4 w-4 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold" data-testid="text-pending-bids">{pendingBids}</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting staff review</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="glass-panel border-l-4 border-l-green-500 hover:border-l-green-500/80 transition-colors" data-testid="card-available-grinders">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Grinder Roster</CardTitle>
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold" data-testid="text-total-grinders">{stats?.totalGrinders || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats?.availableGrinders || 0} available for work</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="glass-panel border-l-4 border-l-blue-500 hover:border-l-blue-500/80 transition-colors" data-testid="card-accepted-bids">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Accepted Bids</CardTitle>
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold" data-testid="text-accepted-bids">{acceptedBids}</div>
                <p className="text-xs text-muted-foreground mt-1">Assigned to grinders</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Recent Proposals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentBids.length > 0 ? (
              <div className="space-y-3">
                {recentBids.map(bid => {
                  const grinder = grinders?.find(g => g.id === bid.grinderId);
                  const order = orders?.find(o => o.id === bid.orderId);
                  const orderRef = order?.mgtOrderNumber ? `#${order.mgtOrderNumber}` : bid.orderId;
                  return (
                    <div key={bid.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5" data-testid={`activity-bid-${bid.id}`}>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {grinder?.name || bid.grinderId} bid on Order {orderRef}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ${bid.bidAmount} {bid.timeline ? `- ${bid.timeline}` : ""}
                        </span>
                      </div>
                      <Badge variant="outline" className={
                        bid.status === "Accepted" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                        bid.status === "Rejected" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                        "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      }>
                        {bid.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center border border-dashed border-border/50 rounded-xl bg-white/[0.02]">
                <p className="text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Waiting for MGT Bot activity...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.02]">
                <span className="text-sm text-muted-foreground">Total Orders</span>
                <span className="font-bold" data-testid="text-total-orders">{orders?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.02]">
                <span className="text-sm text-muted-foreground">Total Bids</span>
                <span className="font-bold" data-testid="text-total-bids">{bids?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.02]">
                <span className="text-sm text-muted-foreground">Completed Orders</span>
                <span className="font-bold" data-testid="text-completed">{stats?.completedToday || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.02]">
                <span className="text-sm text-muted-foreground">Bid Acceptance Rate</span>
                <span className="font-bold text-green-400" data-testid="text-acceptance-rate">
                  {bids && bids.length > 0 ? ((acceptedBids / bids.length) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
