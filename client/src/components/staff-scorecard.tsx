import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Loader2, Crown, Shield, Calendar, Activity, ClipboardList, Gavel,
  DollarSign, ListOrdered, Clock, BarChart3, Zap
} from "lucide-react";
import {
  STAFF_BADGE_COMPONENTS, STAFF_BADGE_META, type StaffBadgeId,
} from "@/components/staff-achievement-badges";

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

function StaffScorecardContent({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery<any>({
    queryKey: [`/api/staff/scorecard/${userId}`],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground text-center py-8">No data available</p>;

  const { profile, badges, stats, actionBreakdown, recentLogs } = data;
  const isOwnerProfile = profile.role === "owner";
  const accent = isOwnerProfile ? "text-red-400" : "text-teal-400";
  const accentBg = isOwnerProfile ? "bg-red-500/10" : "bg-teal-500/10";
  const accentBorder = isOwnerProfile ? "border-red-500/20" : "border-teal-500/20";

  const topActions = Object.entries(actionBreakdown || {})
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 8);

  return (
    <div className="space-y-4 mt-2">
      <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl ${accentBg} border ${accentBorder}`}>
        <Avatar className={`h-14 w-14 sm:h-16 sm:w-16 border-2 ${accentBorder}`}>
          <AvatarImage src={profile.avatarUrl || undefined} />
          <AvatarFallback className={`${accentBg} ${accent} text-xl font-bold`}>
            {(profile.name || "?").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold" data-testid="text-scorecard-name">{profile.firstName || profile.name}</h2>
            {profile.discordUsername && profile.firstName && profile.firstName !== profile.discordUsername && (
              <span className="text-sm text-muted-foreground">(@{profile.discordUsername})</span>
            )}
            <Badge className={`gap-1 ${isOwnerProfile ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-teal-500/20 text-teal-400 border-teal-500/30"}`}>
              {isOwnerProfile ? <Crown className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
              {isOwnerProfile ? "Owner" : "Staff"}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Joined {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"}
            </span>
            {stats.lastAction && (
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                Last active {timeAgo(stats.lastAction)}
              </span>
            )}
          </div>
        </div>
      </div>

      {badges && badges.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Badges ({badges.length})</h3>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            {badges.map((b: any) => {
              const BadgeComp = STAFF_BADGE_COMPONENTS[b.badgeId as StaffBadgeId];
              const meta = STAFF_BADGE_META[b.badgeId as StaffBadgeId];
              if (!BadgeComp || !meta) return null;
              return (
                <TooltipProvider key={b.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center gap-1 cursor-default" data-testid={`scorecard-badge-${b.badgeId}`}>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center [&_svg]:w-10 [&_svg]:h-10 sm:[&_svg]:w-12 sm:[&_svg]:h-12 [&>div]:!w-10 [&>div]:!h-10 sm:[&>div]:!w-12 sm:[&>div]:!h-12">
                          <BadgeComp />
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground text-center leading-tight max-w-[56px] sm:max-w-[72px] truncate">{meta.label}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px]">
                      <p className="text-xs font-medium">{meta.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{meta.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardContent className="p-3 text-center">
            <ListOrdered className={`w-4 h-4 mx-auto mb-1 ${accent}`} />
            <p className="text-lg sm:text-xl font-bold" data-testid="text-orders-managed">{stats.ordersManaged}</p>
            <p className="text-[10px] text-muted-foreground">Orders Created</p>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardContent className="p-3 text-center">
            <Gavel className={`w-4 h-4 mx-auto mb-1 ${accent}`} />
            <p className="text-lg sm:text-xl font-bold" data-testid="text-bids-reviewed">{stats.bidsReviewed}</p>
            <p className="text-[10px] text-muted-foreground">Bids Reviewed</p>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardContent className="p-3 text-center">
            <ClipboardList className={`w-4 h-4 mx-auto mb-1 ${accent}`} />
            <p className="text-lg sm:text-xl font-bold" data-testid="text-assignments-made">{stats.assignmentsMade}</p>
            <p className="text-[10px] text-muted-foreground">Assignments</p>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardContent className="p-3 text-center">
            <DollarSign className={`w-4 h-4 mx-auto mb-1 ${accent}`} />
            <p className="text-lg sm:text-xl font-bold" data-testid="text-payouts-processed">{stats.payoutsProcessed}</p>
            <p className="text-[10px] text-muted-foreground">Payouts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Last 24h</p>
            <p className="text-xl font-bold text-emerald-400" data-testid="text-actions-24h">{stats.actionsLast24h}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Last 7d</p>
            <p className="text-xl font-bold text-blue-400" data-testid="text-actions-7d">{stats.actionsLast7d}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">All-Time</p>
            <p className="text-xl font-bold" data-testid="text-actions-total">{stats.totalActions}</p>
          </CardContent>
        </Card>
      </div>

      {topActions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            Top Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {topActions.map(([action, count]) => (
              <div key={action} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-xs text-muted-foreground truncate mr-2">{formatLabel(action)}</span>
                <span className="text-xs font-mono font-medium">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentLogs && recentLogs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Recent Activity ({recentLogs.length})
          </h3>
          <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
            {recentLogs.slice(0, 20).map((log: any) => (
              <div key={log.id} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <Zap className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{formatLabel(log.action)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {log.entityType && <span className="capitalize">{log.entityType}</span>}
                    {log.entityId && <span className="ml-1 font-mono opacity-60">{log.entityId.slice(0, 12)}</span>}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{timeAgo(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function StaffScorecardDialog({ userId, open, onClose, staffName }: {
  userId: string | null;
  open: boolean;
  onClose: () => void;
  staffName?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-staff-scorecard">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" data-testid="text-scorecard-title">
            <Activity className="w-5 h-5 text-primary" />
            Staff Scorecard
          </DialogTitle>
        </DialogHeader>
        {userId && <StaffScorecardContent userId={userId} />}
      </DialogContent>
    </Dialog>
  );
}

export function ClickableStaffName({ userId, name, className }: {
  userId: string;
  name: string;
  className?: string;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        const event = new CustomEvent("open-staff-scorecard", { detail: { userId, name } });
        window.dispatchEvent(event);
      }}
      className={`hover:underline hover:text-primary transition-colors cursor-pointer ${className || ""}`}
      data-testid={`button-staff-name-${userId}`}
    >
      {name}
    </button>
  );
}
