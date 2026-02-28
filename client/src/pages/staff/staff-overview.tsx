import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useStaffData } from "@/hooks/use-staff-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { formatLabel } from "@/lib/staff-utils";
import { StaffPerformanceDialog } from "@/components/staff-scorecard";
import {
  Loader2, UserCheck, ClipboardList, History, Activity, Users,
  Clock, CheckCircle, TrendingUp, BarChart3, ScrollText,
} from "lucide-react";

export default function StaffOverviewPage() {
  const { user } = useAuth();
  const { auditLogs, auditLogsUpdatedAt } = useStaffData();
  const [perfUserId, setPerfUserId] = useState<string | null>(null);
  const [perfOpen, setPerfOpen] = useState(false);

  const { data: staffMembers = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/owner/staff-members"],
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalActions24h = staffMembers.reduce((s: number, m: any) => s + m.actionsLast24h, 0);
  const totalActions7d = staffMembers.reduce((s: number, m: any) => s + m.actionsLast7d, 0);
  const totalPending = staffMembers.reduce((s: number, m: any) => s + m.pendingTasks, 0);
  const totalCompleted = staffMembers.reduce((s: number, m: any) => s + m.completedTasks, 0);
  const totalActionsAll = staffMembers.reduce((s: number, m: any) => s + m.totalActions, 0);
  const sorted = [...staffMembers].sort((a: any, b: any) => b.actionsLast7d - a.actionsLast7d);
  const maxActions7d = Math.max(...staffMembers.map((m: any) => m.actionsLast7d), 1);

  const staffAuditLogs = (auditLogs || []).filter(log => {
    return staffMembers.some((m: any) => {
      const actor = log.actor?.toLowerCase() || "";
      const username = (m.name || "").toLowerCase();
      return actor === username || actor === m.discordId;
    });
  }).slice(0, 20);

  return (
    <TooltipProvider>
      <AnimatedPage className="space-y-6" data-testid="staff-overview-page">
        <FadeInUp>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <UserCheck className="w-7 h-7 text-primary" />
                <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight" data-testid="text-page-title">
                  Staff Overview
                </h1>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">Live</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-white/5 text-muted-foreground border-0 text-[10px]">
                  {staffMembers.length} member{staffMembers.length !== 1 ? "s" : ""}
                </Badge>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-[10px]">
                  {totalActions24h} actions today
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Team activity, performance metrics, and task management</p>
          </div>
        </FadeInUp>

        <FadeInUp>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center">
              <p className="text-2xl font-bold text-blue-400" data-testid="text-total-staff">{staffMembers.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Total Staff</p>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-center">
              <p className="text-2xl font-bold text-cyan-400" data-testid="text-actions-today">{totalActions24h}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Today</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
              <p className="text-2xl font-bold text-emerald-400" data-testid="text-total-actions-7d">{totalActions7d}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Actions (7d)</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-center">
              <p className="text-2xl font-bold text-purple-400" data-testid="text-total-actions-all">{totalActionsAll}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">All Time</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-center">
              <p className="text-2xl font-bold text-amber-400" data-testid="text-pending-tasks">{totalPending}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Pending Tasks</p>
            </div>
            <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10 text-center">
              <p className="text-2xl font-bold text-green-400" data-testid="text-completed-tasks">{totalCompleted}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Tasks Done</p>
            </div>
          </div>
        </FadeInUp>

        <FadeInUp>
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sorted.map((member: any) => {
                  const isActive24h = member.actionsLast24h > 0;
                  const barWidth = maxActions7d > 0 ? (member.actionsLast7d / maxActions7d) * 100 : 0;
                  const lastActionStr = member.lastAction ? new Date(member.lastAction).toLocaleString() : "No activity yet";
                  return (
                    <div key={member.id} className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors cursor-pointer" onClick={() => { setPerfUserId(member.id); setPerfOpen(true); }} data-testid={`card-staff-${member.discordId}`}>
                      <Avatar className="w-10 h-10 border border-white/10">
                        <AvatarImage src={member.avatarUrl || undefined} />
                        <AvatarFallback className="bg-white/5 text-xs">{member.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">{member.name}</span>
                          <Badge className={`border-0 text-[9px] px-1.5 py-0 ${member.role === "owner" ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"}`}>
                            {member.role === "owner" ? "Owner" : "Staff"}
                          </Badge>
                          {isActive24h && (
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="text-[9px] text-emerald-400">Active today</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all duration-700" style={{ width: `${barWidth}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{member.actionsLast7d} this week</span>
                        </div>
                        <p className="text-[10px] text-white/30 mt-1">Last active: {lastActionStr}</p>
                      </div>
                      <div className="flex items-center gap-4 text-right shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-center cursor-default">
                              <div className="flex items-center gap-1 justify-center">
                                <History className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm font-bold text-cyan-400">{member.actionsLast24h}</span>
                              </div>
                              <p className="text-[8px] text-muted-foreground">today</p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{member.actionsLast24h} actions in the last 24 hours</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-center cursor-default">
                              <div className="flex items-center gap-1 justify-center">
                                <BarChart3 className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm font-bold text-purple-400">{member.totalActions}</span>
                              </div>
                              <p className="text-[8px] text-muted-foreground">total</p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{member.totalActions} actions all time</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-center cursor-default">
                              <div className="flex items-center gap-1 justify-center">
                                <ClipboardList className="w-3 h-3 text-muted-foreground" />
                                <span className={`text-sm font-bold ${member.pendingTasks > 0 ? "text-amber-400" : "text-muted-foreground"}`}>{member.pendingTasks}</span>
                              </div>
                              <p className="text-[8px] text-muted-foreground">tasks</p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{member.pendingTasks} pending, {member.completedTasks} completed, {member.tasksAssigned} assigned to others</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
                {staffMembers.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">No staff members found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </FadeInUp>

        <FadeInUp>
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ScrollText className="w-5 h-5 text-blue-400" />
                  Staff Activity Log
                </CardTitle>
                {auditLogsUpdatedAt && (
                  <span className="text-[10px] text-muted-foreground">Updated {new Date(auditLogsUpdatedAt).toLocaleTimeString()}</span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                {staffAuditLogs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Activity className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">No staff activity recorded yet</p>
                  </div>
                )}
                {staffAuditLogs.map((log) => {
                  const actionColor =
                    log.action.includes("created") || log.action.includes("accepted") || log.action.includes("paid") ? "bg-emerald-400" :
                    log.action.includes("rejected") || log.action.includes("denied") || log.action.includes("deleted") ? "bg-red-400" :
                    log.action.includes("updated") || log.action.includes("changed") || log.action.includes("price") || log.action.includes("assign") ? "bg-blue-400" :
                    log.action.includes("imported") ? "bg-purple-400" :
                    "bg-muted-foreground";
                  return (
                    <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors" data-testid={`card-staff-audit-${log.id}`}>
                      <div className="relative mt-1.5 flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full ${actionColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">
                          <span className="font-medium capitalize">{formatLabel(log.entityType)}</span>{" "}
                          <span className="text-white/40">{log.entityId}</span>{" "}
                          <span className="text-primary/80">{formatLabel(log.action)}</span>
                        </p>
                        <p className="text-[10px] text-white/30 mt-0.5">
                          {log.actor} &middot; {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </FadeInUp>
      <StaffPerformanceDialog
        userId={perfUserId}
        open={perfOpen}
        onClose={() => { setPerfOpen(false); setPerfUserId(null); }}
      />
      </AnimatedPage>
    </TooltipProvider>
  );
}
