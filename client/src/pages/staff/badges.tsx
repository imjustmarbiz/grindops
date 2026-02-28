import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Loader2, Plus, Trash2, Sparkles, Star, Shield, Users } from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { HelpTip } from "@/components/help-tip";
import { BADGE_COMPONENTS, BADGE_META, MANUAL_BADGE_IDS, AUTO_BADGE_IDS, TIER_LABELS, TIER_COLORS, type BadgeId, type BadgeTier } from "@/components/achievement-badges";
import {
  STAFF_BADGE_COMPONENTS, STAFF_BADGE_META, MANUAL_STAFF_BADGE_IDS, AUTO_STAFF_BADGE_IDS,
  STAFF_TIER_LABELS, STAFF_TIER_COLORS, type StaffBadgeId, type StaffBadgeTier,
} from "@/components/staff-achievement-badges";
import type { Grinder, GrinderBadge, StaffBadge as StaffBadgeType } from "@shared/schema";

function BadgeCatalogueSection({ title, icon, badgeIds, components, meta, tierLabels, tierColors, color }: {
  title: string; icon: React.ReactNode;
  badgeIds: string[]; components: Record<string, () => JSX.Element>;
  meta: Record<string, { label: string; tooltip: string; category: string; tier: string }>;
  tierLabels: Record<string, string>; tierColors: Record<string, string>; color: string;
}) {
  return (
    <div>
      <h3 className={`text-sm font-medium uppercase tracking-wider mb-3 flex items-center gap-2 ${color}`}>
        {icon}
        {title} ({badgeIds.length})
      </h3>
      {(["short", "mid", "long"] as string[]).map(tier => {
        const tierBadges = badgeIds.filter(id => meta[id]?.tier === tier);
        if (tierBadges.length === 0) return null;
        return (
          <div key={tier} className="mb-4">
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${tierColors[tier] || "text-muted-foreground"}`}>{tierLabels[tier] || tier}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tierBadges.map(id => {
                const BadgeComp = components[id];
                const m = meta[id];
                if (!BadgeComp || !m) return null;
                return (
                  <div key={id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]" data-testid={`catalogue-badge-${id}`}>
                    <div className="shrink-0"><BadgeComp /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{m.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{m.tooltip}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StaffBadgesSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedBadge, setSelectedBadge] = useState<StaffBadgeId | "">("");
  const [badgeNote, setBadgeNote] = useState("");

  const actorDiscordId = (user as any)?.discordId || (user as any)?.id || "";
  const isDavidGrinds = actorDiscordId === "872820240139046952";

  const { data: staffMembers = [], isLoading: staffLoading } = useQuery<any[]>({
    queryKey: ["/api/owner/staff-members"],
  });

  const selectedMember = staffMembers.find((m: any) => m.id === selectedUserId) || null;

  const { data: assignedBadges = [], isLoading: badgesLoading } = useQuery<StaffBadgeType[]>({
    queryKey: ["/api/owner/staff-badges", selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return [];
      const res = await fetch(`/api/owner/staff-badges/${selectedUserId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch badges");
      return res.json();
    },
    enabled: !!selectedUserId,
  });

  const { data: badgeStats } = useQuery<any>({
    queryKey: ["/api/owner/staff-badge-stats"],
  });

  const autoBadgeIds = useMemo(() => {
    if (!badgeStats) return [] as StaffBadgeId[];
    const ids = new Set<StaffBadgeId>();
    const { totalOrders, totalAssignments, reviewedBids, processedPayouts, totalAlerts,
      totalStrikes, totalReviews, totalEvents, totalAuditLogs, totalGrinders, totalRevenue } = badgeStats;

    if (totalAuditLogs >= 1) ids.add("staff-first-action");
    if (totalOrders >= 5) ids.add("staff-order-5");
    if (reviewedBids >= 10) ids.add("staff-bid-10");
    if (processedPayouts >= 1) ids.add("staff-payout-1");
    if (totalAssignments >= 5) ids.add("staff-assign-5");
    if (totalAlerts >= 1) ids.add("staff-alert-1");
    if (totalStrikes >= 1) ids.add("staff-strike-1");
    if (totalReviews >= 5) ids.add("staff-review-5");
    if (totalEvents >= 1) ids.add("staff-event-1");
    if (totalOrders >= 25) ids.add("staff-order-25");
    if (totalOrders >= 50) ids.add("staff-order-50");
    if (totalAssignments >= 25) ids.add("staff-assign-25");
    if (reviewedBids >= 50) ids.add("staff-bid-50");
    if (processedPayouts >= 10) ids.add("staff-payout-10");
    if (totalRevenue >= 5000) ids.add("staff-rev-5k");
    if (totalRevenue >= 10000) ids.add("staff-rev-10k");
    if (totalGrinders >= 10) ids.add("staff-grinder-mgr");
    if (totalOrders >= 100) ids.add("staff-order-100");
    if (totalOrders >= 250) ids.add("staff-order-250");
    if (totalOrders >= 500) ids.add("staff-order-500");
    if (totalOrders >= 1000) ids.add("staff-order-1000");
    if (totalRevenue >= 25000) ids.add("staff-rev-25k");
    if (totalRevenue >= 50000) ids.add("staff-rev-50k");
    if (totalRevenue >= 100000) ids.add("staff-rev-100k");

    if (user?.createdAt) {
      const daysSinceJoin = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000);
      if (daysSinceJoin >= 7) ids.add("staff-7d");
      if (daysSinceJoin >= 30) ids.add("staff-30d");
      if (daysSinceJoin >= 90) ids.add("staff-90d");
      if (daysSinceJoin >= 180) ids.add("staff-180d");
      if (daysSinceJoin >= 365) ids.add("staff-365d");
      if (daysSinceJoin >= 730) ids.add("staff-730d");
    }

    return Array.from(ids);
  }, [badgeStats, user]);

  const assignedIds = new Set(assignedBadges.map(b => b.badgeId));
  const availableManualBadges = MANUAL_STAFF_BADGE_IDS.filter(id => !assignedIds.has(id));

  const assignMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/owner/staff-badges", {
        userId: selectedUserId,
        badgeId: selectedBadge,
        note: badgeNote || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/staff-badges", selectedUserId] });
      toast({ title: "Staff badge awarded", description: `${STAFF_BADGE_META[selectedBadge as StaffBadgeId]?.label} given to ${selectedMember?.firstName || selectedMember?.discordUsername}` });
      setSelectedBadge("");
      setBadgeNote("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to assign badge", variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (badgeDbId: string) => {
      await apiRequest("DELETE", `/api/owner/staff-badges/${badgeDbId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/staff-badges", selectedUserId] });
      toast({ title: "Staff badge removed" });
    },
  });

  if (isDavidGrinds) {
    return (
      <Card className="border-0 bg-white/[0.02]">
        <CardContent className="py-8 text-center">
          <Shield className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">You do not have permission to manage staff badges</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <FadeInUp delay={0.03}>
        <Card className="border-0 bg-gradient-to-br from-red-500/[0.06] via-background to-background overflow-hidden relative" data-testid="card-staff-badge-management">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-red-500/[0.03] -translate-y-16 translate-x-16" />
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                <Shield className="w-4 h-4 text-red-400" />
              </div>
              Award Staff Badges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Select Staff Member</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-full h-10 text-sm bg-white/[0.03] border-white/10" data-testid="select-staff-member">
                  <SelectValue placeholder="Choose a staff member or owner..." />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((m: any) => (
                    <SelectItem key={m.id} value={m.id} data-testid={`staff-option-${m.id}`}>
                      {m.firstName || m.discordUsername || "Unknown"} {m.discordUsername ? `(@${m.discordUsername})` : ""} — {m.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMember && (
              <>
                {badgesLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {selectedMember.firstName || selectedMember.discordUsername}'s Badges
                        </label>
                        <Badge variant="outline" className="text-[10px]">{assignedBadges.length} awarded</Badge>
                      </div>
                      {assignedBadges.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3" data-testid="staff-assigned-badges-grid">
                          {assignedBadges.map(badge => {
                            const id = badge.badgeId as StaffBadgeId;
                            const BadgeComp = STAFF_BADGE_COMPONENTS[id];
                            const meta = STAFF_BADGE_META[id];
                            if (!BadgeComp || !meta) return null;
                            return (
                              <div key={badge.id} className="relative group flex flex-col items-center gap-1 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all" data-testid={`staff-badge-awarded-${id}`}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex flex-col items-center gap-1">
                                      <BadgeComp />
                                      <span className="text-[9px] font-semibold text-muted-foreground/80 text-center leading-tight">{meta.label}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                                    <p className="font-bold">{meta.label}</p>
                                    <p>{meta.tooltip}</p>
                                    {badge.awardedByName && <p className="text-muted-foreground mt-1">By {badge.awardedByName}</p>}
                                    {badge.note && <p className="text-muted-foreground italic">"{badge.note}"</p>}
                                    <p className="text-[10px] text-muted-foreground/60 mt-1">{meta.category === "auto" ? "Auto-earned" : "Owner awarded"}</p>
                                  </TooltipContent>
                                </Tooltip>
                                {meta.category !== "auto" && (
                                  <button
                                    onClick={() => removeMutation.mutate(badge.id)}
                                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    data-testid={`remove-staff-badge-${id}`}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                          <Shield className="w-8 h-8 text-muted-foreground/20 mx-auto mb-1" />
                          <p className="text-xs text-muted-foreground/60">No staff badges awarded yet</p>
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Plus className="w-4 h-4 text-red-400" />
                        Award New Staff Badge
                      </h3>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Select value={selectedBadge} onValueChange={(v) => setSelectedBadge(v as StaffBadgeId)}>
                          <SelectTrigger className="flex-1 h-9 text-sm bg-white/[0.03] border-white/10" data-testid="select-staff-badge-to-award">
                            <SelectValue placeholder="Choose a badge..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {availableManualBadges.map(id => {
                              const meta = STAFF_BADGE_META[id];
                              return (
                                <SelectItem key={id} value={id} data-testid={`staff-badge-option-${id}`}>
                                  <span>{meta.label}</span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <Input
                          value={badgeNote}
                          onChange={(e) => setBadgeNote(e.target.value)}
                          placeholder="Reason (optional)"
                          className="flex-1 h-9 text-sm bg-white/[0.03] border-white/10"
                          data-testid="input-staff-badge-note"
                        />
                        <Button
                          size="sm"
                          className="h-9 gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                          disabled={!selectedBadge || assignMutation.isPending}
                          onClick={() => assignMutation.mutate()}
                          data-testid="button-award-staff-badge"
                        >
                          {assignMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                          Award
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {!selectedMember && (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-7 h-7 text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground/60 text-sm">Select a staff member above to manage their badges</p>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeInUp>

      {autoBadgeIds.length > 0 && (
        <FadeInUp delay={0.05}>
          <Card className="border-0 bg-white/[0.02]" data-testid="card-auto-staff-badges">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Team Auto-Earned Badges
                <Badge variant="outline" className="text-[10px] ml-2">{autoBadgeIds.length} unlocked</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">Badges earned by the team based on overall business metrics</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {autoBadgeIds.map(id => {
                  const BadgeComp = STAFF_BADGE_COMPONENTS[id];
                  const meta = STAFF_BADGE_META[id];
                  if (!BadgeComp || !meta) return null;
                  return (
                    <Tooltip key={id}>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]" data-testid={`auto-staff-badge-${id}`}>
                          <BadgeComp />
                          <span className="text-[9px] font-semibold text-muted-foreground/80 text-center leading-tight">{meta.label}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                        <p className="font-bold">{meta.label}</p>
                        <p>{meta.tooltip}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">Auto-earned</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </FadeInUp>
      )}

      <FadeInUp delay={0.07}>
        <Card className="border-0 bg-white/[0.02]" data-testid="card-staff-badge-catalogue">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-red-400" />
              Staff Badge Catalogue
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">All 50 staff badges and how they are earned</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <BadgeCatalogueSection
              title="Owner-Awarded Staff Badges"
              icon={<Star className="w-4 h-4" />}
              badgeIds={MANUAL_STAFF_BADGE_IDS as unknown as string[]}
              components={STAFF_BADGE_COMPONENTS as unknown as Record<string, () => JSX.Element>}
              meta={STAFF_BADGE_META as unknown as Record<string, any>}
              tierLabels={STAFF_TIER_LABELS}
              tierColors={STAFF_TIER_COLORS}
              color="text-red-400"
            />
            <BadgeCatalogueSection
              title="Auto-Earned Staff Badges"
              icon={<Sparkles className="w-4 h-4" />}
              badgeIds={AUTO_STAFF_BADGE_IDS as unknown as string[]}
              components={STAFF_BADGE_COMPONENTS as unknown as Record<string, () => JSX.Element>}
              meta={STAFF_BADGE_META as unknown as Record<string, any>}
              tierLabels={STAFF_TIER_LABELS}
              tierColors={STAFF_TIER_COLORS}
              color="text-emerald-400"
            />
          </CardContent>
        </Card>
      </FadeInUp>
    </div>
  );
}

export default function StaffBadges() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const [selectedGrinderId, setSelectedGrinderId] = useState<string>("");
  const [selectedBadge, setSelectedBadge] = useState<BadgeId | "">("");
  const [badgeNote, setBadgeNote] = useState("");

  const { data: grinders = [], isLoading: grindersLoading } = useQuery<Grinder[]>({
    queryKey: ["/api/grinders"],
  });

  const selectedGrinder = grinders.find(g => g.id === selectedGrinderId) || null;

  const { data: assignedBadges = [], isLoading: badgesLoading } = useQuery<GrinderBadge[]>({
    queryKey: ["/api/staff/grinder-badges", selectedGrinderId],
    queryFn: async () => {
      if (!selectedGrinderId) return [];
      const res = await fetch(`/api/staff/grinder-badges/${selectedGrinderId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch badges");
      return res.json();
    },
    enabled: !!selectedGrinderId,
  });

  const assignedIds = new Set(assignedBadges.map(b => b.badgeId));
  const availableBadges = MANUAL_BADGE_IDS.filter(id => !assignedIds.has(id));

  const assignMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/staff/grinder-badges", {
        grinderId: selectedGrinderId,
        badgeId: selectedBadge,
        note: badgeNote || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/grinder-badges", selectedGrinderId] });
      toast({ title: "Badge awarded", description: `${BADGE_META[selectedBadge as BadgeId]?.label} given to ${selectedGrinder?.name}` });
      setSelectedBadge("");
      setBadgeNote("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to assign badge", variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (badgeDbId: string) => {
      await apiRequest("DELETE", `/api/staff/grinder-badges/${badgeDbId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/grinder-badges", selectedGrinderId] });
      toast({ title: "Badge removed" });
    },
  });

  if (grindersLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-badges">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AnimatedPage>
      <TooltipProvider delayDuration={200}>
        <div className="space-y-6">
          <FadeInUp delay={0}>
            <div className="flex items-center gap-3">
              <Award className="w-7 h-7 text-primary" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight" data-testid="text-page-title">Badge Management</h1>
                  <HelpTip text="Most badges are earned automatically based on performance milestones. Manual badges can be awarded here for special recognition. Grinders see all their badges on their overview page." />
                </div>
                <p className="text-sm text-muted-foreground mt-1">Award and manage achievement badges</p>
              </div>
            </div>
          </FadeInUp>

          {isOwner ? (
            <Tabs defaultValue="grinders" className="w-full">
              <FadeInUp delay={0.02}>
                <TabsList className="grid w-full grid-cols-2 bg-white/[0.03] border border-white/[0.06]">
                  <TabsTrigger value="grinders" className="gap-2 data-[state=active]:bg-primary/20" data-testid="tab-grinder-badges">
                    <Users className="w-4 h-4" />
                    Grinder Badges
                  </TabsTrigger>
                  <TabsTrigger value="staff" className="gap-2 data-[state=active]:bg-red-500/20" data-testid="tab-staff-badges">
                    <Shield className="w-4 h-4" />
                    Staff Badges
                  </TabsTrigger>
                </TabsList>
              </FadeInUp>

              <TabsContent value="grinders" className="space-y-6 mt-6">
                <FadeInUp delay={0.03}>
                  <Card className="border-0 bg-gradient-to-br from-primary/[0.06] via-background to-background overflow-hidden relative" data-testid="card-badge-management">
                    <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-primary/[0.03] -translate-y-16 translate-x-16" />
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                          <Award className="w-4 h-4 text-primary" />
                        </div>
                        Award Grinder Badges
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Select Grinder</label>
                        <Select value={selectedGrinderId} onValueChange={setSelectedGrinderId}>
                          <SelectTrigger className="w-full h-10 text-sm bg-white/[0.03] border-white/10" data-testid="select-grinder">
                            <SelectValue placeholder="Choose a grinder..." />
                          </SelectTrigger>
                          <SelectContent>
                            {grinders.map(g => (
                              <SelectItem key={g.id} value={g.id} data-testid={`grinder-option-${g.id}`}>
                                {g.name}{g.discordUsername ? ` (@${g.discordUsername})` : ""} — {g.category || "grinder"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedGrinder && (
                        <>
                          {badgesLoading ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            </div>
                          ) : (
                            <>
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{selectedGrinder.name}'s Badges</label>
                                  <Badge variant="outline" className="text-[10px]">{assignedBadges.length} awarded</Badge>
                                </div>
                                {assignedBadges.length > 0 ? (
                                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3" data-testid="assigned-badges-grid">
                                    {assignedBadges.map(badge => {
                                      const id = badge.badgeId as BadgeId;
                                      const BadgeComp = BADGE_COMPONENTS[id];
                                      const meta = BADGE_META[id];
                                      if (!BadgeComp || !meta) return null;
                                      return (
                                        <div key={badge.id} className="relative group flex flex-col items-center gap-1 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all" data-testid={`badge-awarded-${id}`}>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="flex flex-col items-center gap-1">
                                                <BadgeComp />
                                                <span className="text-[9px] font-semibold text-muted-foreground/80 text-center leading-tight">{meta.label}</span>
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                                              <p className="font-bold">{meta.label}</p>
                                              <p>{meta.tooltip}</p>
                                              {badge.awardedByName && <p className="text-muted-foreground mt-1">By {badge.awardedByName}</p>}
                                              {badge.note && <p className="text-muted-foreground italic">"{badge.note}"</p>}
                                              <p className="text-[10px] text-muted-foreground/60 mt-1">{meta.category === "auto" ? "Auto-earned" : "Staff awarded"}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                          {meta.category !== "auto" && (
                                            <button
                                              onClick={() => removeMutation.mutate(badge.id)}
                                              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                              data-testid={`remove-badge-${id}`}
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                                    <Award className="w-8 h-8 text-muted-foreground/20 mx-auto mb-1" />
                                    <p className="text-xs text-muted-foreground/60">No badges awarded yet</p>
                                  </div>
                                )}
                              </div>

                              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                                <h3 className="text-sm font-medium flex items-center gap-2">
                                  <Plus className="w-4 h-4 text-primary" />
                                  Award New Badge
                                </h3>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Select value={selectedBadge} onValueChange={(v) => setSelectedBadge(v as BadgeId)}>
                                    <SelectTrigger className="flex-1 h-9 text-sm bg-white/[0.03] border-white/10" data-testid="select-badge-to-award">
                                      <SelectValue placeholder="Choose a badge..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                      {availableBadges.map(id => {
                                        const meta = BADGE_META[id];
                                        return (
                                          <SelectItem key={id} value={id} data-testid={`badge-option-${id}`}>
                                            <span>{meta.label}</span>
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    value={badgeNote}
                                    onChange={(e) => setBadgeNote(e.target.value)}
                                    placeholder="Reason (optional)"
                                    className="flex-1 h-9 text-sm bg-white/[0.03] border-white/10"
                                    data-testid="input-badge-note"
                                  />
                                  <Button
                                    size="sm"
                                    className="h-9 gap-1.5"
                                    disabled={!selectedBadge || assignMutation.isPending}
                                    onClick={() => assignMutation.mutate()}
                                    data-testid="button-award-badge"
                                  >
                                    {assignMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                    Award
                                  </Button>
                                </div>
                              </div>
                            </>
                          )}
                        </>
                      )}

                      {!selectedGrinder && (
                        <div className="text-center py-8">
                          <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
                            <Award className="w-7 h-7 text-muted-foreground/30" />
                          </div>
                          <p className="text-muted-foreground/60 text-sm">Select a grinder above to manage their badges</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </FadeInUp>

                <FadeInUp delay={0.07}>
                  <Card className="border-0 bg-white/[0.02]" data-testid="card-badge-catalogue">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        Grinder Badge Catalogue
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">All available grinder badges and how they are earned</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <BadgeCatalogueSection
                        title="Staff-Awarded Badges"
                        icon={<Star className="w-4 h-4" />}
                        badgeIds={MANUAL_BADGE_IDS as unknown as string[]}
                        components={BADGE_COMPONENTS as unknown as Record<string, () => JSX.Element>}
                        meta={BADGE_META as unknown as Record<string, any>}
                        tierLabels={TIER_LABELS}
                        tierColors={TIER_COLORS}
                        color="text-amber-400"
                      />
                      <BadgeCatalogueSection
                        title="Auto-Earned Badges"
                        icon={<Sparkles className="w-4 h-4" />}
                        badgeIds={AUTO_BADGE_IDS as unknown as string[]}
                        components={BADGE_COMPONENTS as unknown as Record<string, () => JSX.Element>}
                        meta={BADGE_META as unknown as Record<string, any>}
                        tierLabels={TIER_LABELS}
                        tierColors={TIER_COLORS}
                        color="text-emerald-400"
                      />
                    </CardContent>
                  </Card>
                </FadeInUp>
              </TabsContent>

              <TabsContent value="staff" className="mt-6">
                <StaffBadgesSection />
              </TabsContent>
            </Tabs>
          ) : (
            <>
              <FadeInUp delay={0.03}>
                <Card className="border-0 bg-gradient-to-br from-primary/[0.06] via-background to-background overflow-hidden relative" data-testid="card-badge-management">
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-primary/[0.03] -translate-y-16 translate-x-16" />
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                        <Award className="w-4 h-4 text-primary" />
                      </div>
                      Award Badges
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Select Grinder</label>
                      <Select value={selectedGrinderId} onValueChange={setSelectedGrinderId}>
                        <SelectTrigger className="w-full h-10 text-sm bg-white/[0.03] border-white/10" data-testid="select-grinder">
                          <SelectValue placeholder="Choose a grinder..." />
                        </SelectTrigger>
                        <SelectContent>
                          {grinders.map(g => (
                            <SelectItem key={g.id} value={g.id} data-testid={`grinder-option-${g.id}`}>
                              {g.name}{g.discordUsername ? ` (@${g.discordUsername})` : ""} — {g.category || "grinder"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedGrinder && (
                      <>
                        {badgesLoading ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{selectedGrinder.name}'s Badges</label>
                                <Badge variant="outline" className="text-[10px]">{assignedBadges.length} awarded</Badge>
                              </div>
                              {assignedBadges.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3" data-testid="assigned-badges-grid">
                                  {assignedBadges.map(badge => {
                                    const id = badge.badgeId as BadgeId;
                                    const BadgeComp = BADGE_COMPONENTS[id];
                                    const meta = BADGE_META[id];
                                    if (!BadgeComp || !meta) return null;
                                    return (
                                      <div key={badge.id} className="relative group flex flex-col items-center gap-1 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all" data-testid={`badge-awarded-${id}`}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex flex-col items-center gap-1">
                                              <BadgeComp />
                                              <span className="text-[9px] font-semibold text-muted-foreground/80 text-center leading-tight">{meta.label}</span>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                                            <p className="font-bold">{meta.label}</p>
                                            <p>{meta.tooltip}</p>
                                            {badge.awardedByName && <p className="text-muted-foreground mt-1">By {badge.awardedByName}</p>}
                                            {badge.note && <p className="text-muted-foreground italic">"{badge.note}"</p>}
                                          </TooltipContent>
                                        </Tooltip>
                                        {meta.category !== "auto" && (
                                          <button
                                            onClick={() => removeMutation.mutate(badge.id)}
                                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            data-testid={`remove-badge-${id}`}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-center py-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                                  <Award className="w-8 h-8 text-muted-foreground/20 mx-auto mb-1" />
                                  <p className="text-xs text-muted-foreground/60">No badges awarded yet</p>
                                </div>
                              )}
                            </div>

                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                              <h3 className="text-sm font-medium flex items-center gap-2">
                                <Plus className="w-4 h-4 text-primary" />
                                Award New Badge
                              </h3>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Select value={selectedBadge} onValueChange={(v) => setSelectedBadge(v as BadgeId)}>
                                  <SelectTrigger className="flex-1 h-9 text-sm bg-white/[0.03] border-white/10" data-testid="select-badge-to-award">
                                    <SelectValue placeholder="Choose a badge..." />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-[300px]">
                                    {availableBadges.map(id => {
                                      const meta = BADGE_META[id];
                                      return (
                                        <SelectItem key={id} value={id} data-testid={`badge-option-${id}`}>
                                          <span>{meta.label}</span>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                                <Input
                                  value={badgeNote}
                                  onChange={(e) => setBadgeNote(e.target.value)}
                                  placeholder="Reason (optional)"
                                  className="flex-1 h-9 text-sm bg-white/[0.03] border-white/10"
                                  data-testid="input-badge-note"
                                />
                                <Button
                                  size="sm"
                                  className="h-9 gap-1.5"
                                  disabled={!selectedBadge || assignMutation.isPending}
                                  onClick={() => assignMutation.mutate()}
                                  data-testid="button-award-badge"
                                >
                                  {assignMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                  Award
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {!selectedGrinder && (
                      <div className="text-center py-8">
                        <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
                          <Award className="w-7 h-7 text-muted-foreground/30" />
                        </div>
                        <p className="text-muted-foreground/60 text-sm">Select a grinder above to manage their badges</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </FadeInUp>

              <FadeInUp delay={0.07}>
                <Card className="border-0 bg-white/[0.02]" data-testid="card-badge-catalogue">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      Badge Catalogue
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">All available badges and how they are earned</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <BadgeCatalogueSection
                      title="Staff-Awarded Badges"
                      icon={<Star className="w-4 h-4" />}
                      badgeIds={MANUAL_BADGE_IDS as unknown as string[]}
                      components={BADGE_COMPONENTS as unknown as Record<string, () => JSX.Element>}
                      meta={BADGE_META as unknown as Record<string, any>}
                      tierLabels={TIER_LABELS}
                      tierColors={TIER_COLORS}
                      color="text-amber-400"
                    />
                    <BadgeCatalogueSection
                      title="Auto-Earned Badges"
                      icon={<Sparkles className="w-4 h-4" />}
                      badgeIds={AUTO_BADGE_IDS as unknown as string[]}
                      components={BADGE_COMPONENTS as unknown as Record<string, () => JSX.Element>}
                      meta={BADGE_META as unknown as Record<string, any>}
                      tierLabels={TIER_LABELS}
                      tierColors={TIER_COLORS}
                      color="text-emerald-400"
                    />
                  </CardContent>
                </Card>
              </FadeInUp>
            </>
          )}
        </div>
      </TooltipProvider>
    </AnimatedPage>
  );
}
