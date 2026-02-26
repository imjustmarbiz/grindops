import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Award, Loader2, Plus, Trash2, Sparkles, Star } from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { BADGE_COMPONENTS, BADGE_META, ALL_BADGE_IDS, MANUAL_BADGE_IDS, AUTO_BADGE_IDS, TIER_LABELS, TIER_COLORS, type BadgeId, type BadgeTier } from "@/components/achievement-badges";
import type { Grinder, GrinderBadge } from "@shared/schema";

export default function StaffBadges() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
                <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight" data-testid="text-page-title">Badge Management</h1>
                <p className="text-sm text-muted-foreground mt-1">Award and manage grinder achievement badges</p>
              </div>
            </div>
          </FadeInUp>

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
                  Badge Catalogue
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">All available badges and how they are earned</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Staff-Awarded Badges ({MANUAL_BADGE_IDS.length})
                  </h3>
                  {(["short", "mid", "long"] as BadgeTier[]).map(tier => {
                    const tierBadges = MANUAL_BADGE_IDS.filter(id => BADGE_META[id].tier === tier);
                    if (tierBadges.length === 0) return null;
                    return (
                      <div key={tier} className="mb-4">
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${TIER_COLORS[tier]}`}>{TIER_LABELS[tier]}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {tierBadges.map(id => {
                            const BadgeComp = BADGE_COMPONENTS[id];
                            const meta = BADGE_META[id];
                            return (
                              <div key={id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]" data-testid={`catalogue-badge-${id}`}>
                                <div className="shrink-0">
                                  <BadgeComp />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{meta.label}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{meta.tooltip}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Auto-Earned Badges ({AUTO_BADGE_IDS.length})
                  </h3>
                  {(["short", "mid", "long"] as BadgeTier[]).map(tier => {
                    const tierBadges = AUTO_BADGE_IDS.filter(id => BADGE_META[id].tier === tier);
                    if (tierBadges.length === 0) return null;
                    return (
                      <div key={tier} className="mb-4">
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${TIER_COLORS[tier]}`}>{TIER_LABELS[tier]}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {tierBadges.map(id => {
                            const BadgeComp = BADGE_COMPONENTS[id];
                            const meta = BADGE_META[id];
                            return (
                              <div key={id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]" data-testid={`catalogue-badge-${id}`}>
                                <div className="shrink-0">
                                  <BadgeComp />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{meta.label}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{meta.tooltip}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </FadeInUp>
        </div>
      </TooltipProvider>
    </AnimatedPage>
  );
}
