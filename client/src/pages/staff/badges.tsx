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
import { Award, Search, X, Loader2, Plus, Trash2 } from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { BADGE_COMPONENTS, BADGE_META, MANUAL_BADGE_IDS, type BadgeId } from "@/components/achievement-badges";
import type { Grinder, GrinderBadge } from "@shared/schema";

export default function StaffBadges() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedGrinder, setSelectedGrinder] = useState<Grinder | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<BadgeId | "">("");
  const [badgeNote, setBadgeNote] = useState("");

  const { data: grinders = [], isLoading: grindersLoading } = useQuery<Grinder[]>({
    queryKey: ["/api/staff/grinders"],
  });

  const { data: assignedBadges = [], isLoading: badgesLoading } = useQuery<GrinderBadge[]>({
    queryKey: ["/api/staff/grinder-badges", selectedGrinder?.id],
    queryFn: async () => {
      if (!selectedGrinder) return [];
      const res = await fetch(`/api/staff/grinder-badges/${selectedGrinder.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch badges");
      return res.json();
    },
    enabled: !!selectedGrinder,
  });

  const assignedIds = new Set(assignedBadges.map(b => b.badgeId));
  const availableBadges = MANUAL_BADGE_IDS.filter(id => !assignedIds.has(id));

  const assignMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/staff/grinder-badges", {
        grinderId: selectedGrinder!.id,
        badgeId: selectedBadge,
        note: badgeNote || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/grinder-badges", selectedGrinder!.id] });
      toast({ title: "Badge awarded", description: `${BADGE_META[selectedBadge as BadgeId]?.label} given to ${selectedGrinder!.name}` });
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
      queryClient.invalidateQueries({ queryKey: ["/api/staff/grinder-badges", selectedGrinder!.id] });
      toast({ title: "Badge removed" });
    },
  });

  const filteredGrinders = grinders.filter(g =>
    !search || g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.discordUsername && g.discordUsername.toLowerCase().includes(search.toLowerCase()))
  );

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

          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
            <FadeInUp delay={0.03}>
              <Card className="border-0 bg-gradient-to-br from-amber-500/[0.06] via-background to-background overflow-hidden relative" data-testid="card-grinder-list">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-amber-500/[0.03] -translate-y-12 translate-x-12" />
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    Select Grinder
                  </CardTitle>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search grinders..."
                      className="pl-9 pr-8 h-9 text-sm bg-white/[0.03] border-white/10"
                      data-testid="input-search-grinders"
                    />
                    {search && (
                      <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="max-h-[500px] overflow-y-auto space-y-1">
                  {filteredGrinders.map(g => (
                    <div
                      key={g.id}
                      onClick={() => setSelectedGrinder(g)}
                      className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                        selectedGrinder?.id === g.id
                          ? "bg-primary/10 border border-primary/20 text-primary"
                          : "hover:bg-white/[0.04] border border-transparent"
                      }`}
                      data-testid={`grinder-select-${g.id}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-xs font-bold">
                        {g.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{g.name}</p>
                        {g.discordUsername && (
                          <p className="text-[10px] text-muted-foreground">@{g.discordUsername}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[9px] shrink-0">{g.category || "grinder"}</Badge>
                    </div>
                  ))}
                  {filteredGrinders.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">No grinders found</p>
                  )}
                </CardContent>
              </Card>
            </FadeInUp>

            <FadeInUp delay={0.05}>
              {selectedGrinder ? (
                <div className="space-y-4">
                  <Card className="border-0 bg-gradient-to-br from-primary/[0.06] via-background to-background overflow-hidden relative" data-testid="card-badge-management">
                    <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-primary/[0.03] -translate-y-16 translate-x-16" />
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                          <Award className="w-4 h-4 text-primary" />
                        </div>
                        {selectedGrinder.name}'s Badges
                        <Badge variant="outline" className="text-[10px] ml-auto">{assignedBadges.length} awarded</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {badgesLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <>
                          {assignedBadges.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3" data-testid="assigned-badges-grid">
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
                            <div className="text-center py-6">
                              <Award className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground/60">No badges awarded yet</p>
                            </div>
                          )}

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
                                    const BadgeComp = BADGE_COMPONENTS[id];
                                    const meta = BADGE_META[id];
                                    return (
                                      <SelectItem key={id} value={id} data-testid={`badge-option-${id}`}>
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 flex items-center justify-center" style={{ transform: "scale(0.4)", transformOrigin: "center" }}>
                                            <BadgeComp />
                                          </div>
                                          <span>{meta.label}</span>
                                        </div>
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
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-white/[0.02]" data-testid="card-available-badges">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground">Available Manual Badges ({availableBadges.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {MANUAL_BADGE_IDS.map(id => {
                          const BadgeComp = BADGE_COMPONENTS[id];
                          const meta = BADGE_META[id];
                          const isAssigned = assignedIds.has(id);
                          return (
                            <Tooltip key={id}>
                              <TooltipTrigger asChild>
                                <div
                                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-default ${
                                    isAssigned
                                      ? "bg-emerald-500/5 border-emerald-500/20 opacity-60"
                                      : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                                  }`}
                                  data-testid={`badge-available-${id}`}
                                >
                                  <div className="w-8 h-8 flex items-center justify-center" style={{ transform: "scale(0.5)", transformOrigin: "center" }}>
                                    <BadgeComp />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-medium truncate">{meta.label}</p>
                                    {isAssigned && <p className="text-[9px] text-emerald-400">Awarded</p>}
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs max-w-[200px]">
                                <p className="font-bold">{meta.label}</p>
                                <p>{meta.tooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="border-0 bg-white/[0.02]">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-xl bg-white/[0.05] flex items-center justify-center mb-4">
                      <Award className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                    <p className="text-muted-foreground/60 text-sm">Select a grinder to manage their badges</p>
                    <p className="text-muted-foreground/40 text-xs mt-1">Use the search panel on the left to find a grinder</p>
                  </CardContent>
                </Card>
              )}
            </FadeInUp>
          </div>
        </div>
      </TooltipProvider>
    </AnimatedPage>
  );
}
