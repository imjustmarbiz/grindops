import { useDashboardStats } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Target, Users, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useDashboardStats();

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
        <h1 className="text-3xl font-display font-bold tracking-tight">Command Center</h1>
        <p className="text-muted-foreground mt-1">Real-time overview of your grinding operations.</p>
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
            <Card className="glass-panel border-l-4 border-l-primary hover:border-l-primary/80 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Orders</CardTitle>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold">{stats?.activeOrders || 0}</div>
                <p className="text-xs text-muted-foreground mt-1 text-primary/80 font-medium">Currently in progress</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="glass-panel border-l-4 border-l-accent hover:border-l-accent/80 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed Today</CardTitle>
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold">{stats?.completedToday || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Delivered successfully</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="glass-panel border-l-4 border-l-green-500 hover:border-l-green-500/80 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Available Grinders</CardTitle>
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Target className="h-4 w-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold">{stats?.availableGrinders || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Ready for assignment</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="glass-panel border-l-4 border-l-blue-500 hover:border-l-blue-500/80 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Roster</CardTitle>
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold">{stats?.totalGrinders || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Active accounts</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Placeholder for future charts or activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 glass-panel border-border/50">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border border-dashed border-border/50 rounded-xl bg-white/[0.02]">
              <p className="text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" /> Operations running smoothly
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="h-[300px] flex items-center justify-center border border-dashed border-border/50 rounded-xl bg-white/[0.02]">
              <p className="text-muted-foreground text-sm">No critical alerts</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
