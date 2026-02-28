import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { LastUpdated } from "@/lib/staff-utils";
import { StaffBadgeGrid } from "@/components/staff-badge-grid";
import { type StaffBadgeId } from "@/components/staff-achievement-badges";
import type { StaffBadge as StaffBadgeType } from "@shared/schema";
import {
  Loader2, Crown, Shield, Calendar, Activity, ClipboardList, Gavel,
  DollarSign, ListOrdered, BarChart3, Zap, Clock, Target, TrendingUp,
  CheckCircle, AlertCircle
} from "lucide-react";

function formatLabel(action: string) {
  return action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return "Never";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function KpiCard({ label, value, subtitle, icon: Icon, color, bg }: {
  label: string; value: string | number; subtitle?: string; icon: any; color: string; bg: string;
}) {
  return (
    <Card className="bg-white/[0.02] border-white/[0.06] overflow-hidden relative group">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/[0.02] -translate-y-6 translate-x-6" />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className={`text-2xl sm:text-3xl font-bold ${color}`} data-testid={`text-kpi-${label.toLowerCase().replace(/\s+/g, "-")}`}>{value}</p>
            {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyPerformance() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";

  const { data: perfData, isLoading: perfLoading, dataUpdatedAt } = useQuery<any>({
    queryKey: [`/api/staff/scorecard/${user?.id}`],
    enabled: !!user?.id,
    refetchInterval: 60000,
  });

  const { data: myBadges = [] } = useQuery<StaffBadgeType[]>({
    queryKey: ["/api/staff/my-badges"],
    refetchInterval: 60000,
  });

  const { data: myTasks = [] } = useQuery<any[]>({
    queryKey: ["/api/staff/tasks"],
    refetchInterval: 60000,
  });

  if (perfLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = perfData?.stats || {};
  const actionBreakdown = perfData?.actionBreakdown || {};
  const recentLogs = perfData?.recentLogs || [];

  const topActions = Object.entries(actionBreakdown)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 12);

  const totalBreakdownActions = Object.values(actionBreakdown).reduce((s: number, v: any) => s + (v as number), 0) as number;

  const badgeIds = myBadges.map(b => b.badgeId as StaffBadgeId);

  const pendingTasks = myTasks.filter((t: any) => t.status === "pending");
  const completedTasks = myTasks.filter((t: any) => t.status === "completed");

  return (
    <AnimatedPage className="space-y-6">
      <FadeInUp>
        <div className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 ${
          isOwner
            ? "border-red-500/20 bg-gradient-to-r from-red-950/40 via-red-900/20 to-amber-950/30"
            : "border-primary/20 bg-gradient-to-r from-primary/10 via-background to-primary/5"
        }`}>
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-16 translate-x-16 ${
            isOwner ? "bg-red-500/[0.06]" : "bg-primary/[0.04]"
          }`} />

          <div className="relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="relative">
                <Avatar className={`h-14 w-14 sm:h-20 sm:w-20 border-2 shadow-lg ${
                  isOwner ? "border-red-500/40" : "border-primary/40"
                }`}>
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback className={`${isOwner ? "bg-red-500/20 text-red-400" : "bg-primary/20 text-primary"} text-2xl font-bold`}>
                    {(user?.firstName || user?.discordUsername || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isOwner && (
                  <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center shadow-lg">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h1 className="text-xl sm:text-3xl font-bold font-display tracking-tight" data-testid="text-performance-page-title">
                    {user?.firstName || user?.discordUsername || "User"}
                  </h1>
                  {user?.discordUsername && user?.firstName && user.firstName !== user.discordUsername && (
                    <span className="text-base sm:text-lg text-muted-foreground font-medium">(@{user.discordUsername})</span>
                  )}
                  <Badge className={`gap-1 ${
                    isOwner
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : "bg-primary/20 text-primary border-primary/30"
                  }`}>
                    {isOwner ? <Crown className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                    {isOwner ? "Owner" : "Staff"}
                  </Badge>
                </div>

                <p className={`text-sm mt-1 font-medium ${isOwner ? "text-red-400/70" : "text-primary/70"}`}>
                  My Performance
                </p>

                <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                  <span className="hidden sm:inline opacity-20">|</span>
                  <LastUpdated date={dataUpdatedAt ? new Date(dataUpdatedAt) : null} />
                </div>
              </div>
            </div>

            {badgeIds.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <StaffBadgeGrid badgeIds={badgeIds} testIdPrefix="my-perf" />
              </div>
            )}
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <KpiCard label="Total Actions" value={stats.totalActions || 0} subtitle="All-time operations" icon={Activity} color="text-primary" bg="bg-primary/15" />
          <KpiCard label="Last 24 Hours" value={stats.actionsLast24h || 0} subtitle="Recent activity" icon={Zap} color="text-emerald-400" bg="bg-emerald-500/15" />
          <KpiCard label="Last 7 Days" value={stats.actionsLast7d || 0} subtitle="Weekly performance" icon={TrendingUp} color="text-blue-400" bg="bg-blue-500/15" />
          <KpiCard label="Orders Created" value={stats.ordersManaged || 0} subtitle="Orders you've created" icon={ListOrdered} color="text-amber-400" bg="bg-amber-500/15" />
          <KpiCard label="Bids Reviewed" value={stats.bidsReviewed || 0} subtitle="Accepted, denied, rejected" icon={Gavel} color="text-purple-400" bg="bg-purple-500/15" />
          <KpiCard label="Assignments" value={stats.assignmentsMade || 0} subtitle="Grinder assignments" icon={ClipboardList} color="text-cyan-400" bg="bg-cyan-500/15" />
          <KpiCard label="Payouts" value={stats.payoutsProcessed || 0} subtitle="Processed & approved" icon={DollarSign} color="text-green-400" bg="bg-green-500/15" />
          <KpiCard label="Tasks Done" value={completedTasks.length} subtitle={`${pendingTasks.length} pending`} icon={Target} color="text-orange-400" bg="bg-orange-500/15" />
        </div>
      </FadeInUp>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FadeInUp>
          <Card className="border-white/[0.06] bg-white/[0.02] h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Action Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topActions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No actions recorded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {topActions.map(([action, count]) => {
                    const pct = totalBreakdownActions > 0 ? ((count as number) / totalBreakdownActions) * 100 : 0;
                    return (
                      <div key={action} className="space-y-1" data-testid={`breakdown-${action}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{formatLabel(action)}</span>
                          <span className="text-xs font-mono font-medium">{count as number}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isOwner ? "bg-red-500/60" : "bg-teal-500/60"
                            }`}
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeInUp>

        <FadeInUp>
          <Card className="border-white/[0.06] bg-white/[0.02] h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Recent Activity
                </CardTitle>
                <span className="text-[10px] text-muted-foreground">{recentLogs.length} entries</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {recentLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                  {recentLogs.slice(0, 30).map((log: any) => {
                    const actionColor =
                      log.action?.includes("created") || log.action?.includes("accepted") || log.action?.includes("paid") ? "bg-emerald-400" :
                      log.action?.includes("rejected") || log.action?.includes("denied") || log.action?.includes("deleted") ? "bg-red-400" :
                      log.action?.includes("updated") || log.action?.includes("changed") || log.action?.includes("assign") ? "bg-blue-400" :
                      "bg-muted-foreground";
                    return (
                      <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors" data-testid={`my-log-${log.id}`}>
                        <div className="relative mt-1.5 flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full ${actionColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">
                            <span className="font-medium">{formatLabel(log.action)}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {log.entityType && <span className="capitalize">{log.entityType}</span>}
                            {log.entityId && <span className="ml-1 font-mono opacity-60">{log.entityId.slice(0, 12)}</span>}
                            <span className="ml-2">{timeAgo(log.createdAt)}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeInUp>
      </div>

      {(pendingTasks.length > 0 || completedTasks.length > 0) && (
        <FadeInUp>
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-400" />
                  My Tasks
                </CardTitle>
                <div className="flex items-center gap-2">
                  {pendingTasks.length > 0 && (
                    <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-[10px]">
                      {pendingTasks.length} Pending
                    </Badge>
                  )}
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[10px]">
                    {completedTasks.length} Done
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {pendingTasks.map((task: any) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10" data-testid={`task-pending-${task.id}`}>
                    <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{task.title || task.description || "Task"}</p>
                      {task.description && task.title && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {task.createdAt ? timeAgo(task.createdAt) : ""}
                        {task.priority && <span className="ml-2 capitalize">Priority: {task.priority}</span>}
                      </p>
                    </div>
                  </div>
                ))}
                {completedTasks.slice(0, 10).map((task: any) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 opacity-70" data-testid={`task-done-${task.id}`}>
                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-through">{task.title || task.description || "Task"}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Completed {task.completedAt ? timeAgo(task.completedAt) : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeInUp>
      )}

      {stats.lastAction && (
        <FadeInUp>
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground">
              Last active {timeAgo(stats.lastAction)}
            </p>
          </div>
        </FadeInUp>
      )}
    </AnimatedPage>
  );
}
