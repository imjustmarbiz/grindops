import confetti from "canvas-confetti";
import { useState, useMemo, useRef, useEffect } from "react";
import { useGrinderData } from "@/hooks/use-grinder-data";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BiddingCountdownPanel } from "@/components/bidding-countdown";
import {
  TrendingUp, FileCheck, Ban, X, Lightbulb, Clock, CheckCircle, Gavel, Target, BarChart3,
  Signal, ScrollText, Sparkles, Crown, ShieldCheck, ChevronRight, Coins, Landmark, Globe, MessageSquare
} from "lucide-react";
import { FaXbox } from "react-icons/fa6";
import { SiPlaystation } from "react-icons/si";
import { Link } from "wouter";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { HelpTip } from "@/components/help-tip";
import { BADGE_COMPONENTS, BADGE_META, type BadgeId } from "@/components/achievement-badges";
import type { GrinderBadge } from "@shared/schema";

function BadgeItem({ id }: { id: BadgeId }) {
  const BadgeComp = BADGE_COMPONENTS[id];
  const meta = BADGE_META[id];
  const [showMobile, setShowMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMobile) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setShowMobile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showMobile]);

  useEffect(() => {
    if (!showMobile || !popupRef.current || !containerRef.current) return;
    const popup = popupRef.current;
    const container = containerRef.current;
    if (!popup || !container) return;
    
    // Reset width and transform to get natural measurements
    popup.style.width = "auto";
    popup.style.transform = "none";
    
    const popupWidth = Math.min(popup.offsetWidth, window.innerWidth - 32);
    popup.style.width = `${popupWidth}px`;
    
    const containerRect = container.getBoundingClientRect();
    const rightOverflow = containerRect.left + containerRect.width / 2 + popupWidth / 2 - window.innerWidth + 16;
    const leftOverflow = -(containerRect.left + containerRect.width / 2 - popupWidth / 2 - 16);
    
    if (rightOverflow > 0) {
      popup.style.transform = `translateX(-${rightOverflow}px)`;
    } else if (leftOverflow > 0) {
      popup.style.transform = `translateX(${leftOverflow}px)`;
    } else {
      popup.style.transform = "translateX(-50%)";
    }
  }, [showMobile]);

  return (
    <div ref={containerRef} className="relative group">
      <button
        onClick={() => setShowMobile(prev => !prev)}
        className="flex flex-col items-center gap-0.5 transition-transform active:scale-95"
        data-testid={`badge-tap-${id}`}
      >
        <BadgeComp />
        <span className="text-[9px] font-semibold text-muted-foreground/80 leading-none text-center max-w-[64px] truncate">{meta.label}</span>
      </button>

      <div
        className="hidden md:group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 rounded-lg bg-popover border border-border shadow-2xl z-[9999] pointer-events-none"
        data-testid={`badge-tooltip-${id}`}
      >
        <p className="text-xs font-bold text-foreground">{meta.label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{meta.tooltip}</p>
      </div>

      {showMobile && (
        <div
          ref={popupRef}
          className="md:hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 rounded-lg bg-popover border border-border shadow-2xl z-[9999] animate-in fade-in-0 zoom-in-95"
          data-testid={`badge-popup-${id}`}
        >
          <p className="text-xs font-bold text-foreground">{meta.label}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{meta.tooltip}</p>
        </div>
      )}
    </div>
  );
}

function BadgeGrid({ badgeIds }: { badgeIds: BadgeId[] }) {
  return (
    <div className="flex items-center gap-2 mt-4 flex-wrap" data-testid="section-badges">
      {badgeIds.map(id => (
        <BadgeItem key={id} id={id} />
      ))}
    </div>
  );
}

export default function GrinderOverview() {
  const {
    user, grinder, isElite, isLoading, assignments, lostBids, aiTips, stats,
    eliteAccent, eliteGradient, eliteBorder, eliteGlow,
    availabilityMutation, toast, queryClient,
  } = useGrinderData();

  const [availStatus, setAvailStatus] = useState(grinder?.availabilityStatus || "available");
  const [availNote, setAvailNote] = useState(grinder?.availabilityNote || "");

  const { data: manualBadges } = useQuery<GrinderBadge[]>({
    queryKey: ["/api/grinder/me/badges"],
  });

  const allBadgeIds = useMemo(() => {
    if (!grinder) return [] as BadgeId[];
    const ids = new Set<BadgeId>();
    const completed = grinder.completedOrders || 0;
    const totalOrders = grinder.totalOrders || 0;
    const quality = Number(grinder.avgQualityRating) || 0;
    const winRate = Number(grinder.winRate) || 0;
    const onTime = Number(grinder.onTimeRate) || 0;
    const completion = Number(grinder.completionRate) || 0;
    const earned = stats?.totalEarned || 0;
    const strikes = grinder.strikes || 0;
    const tier = grinder.tier;
    const daysSinceJoin = grinder.joinedAt ? Math.floor((Date.now() - new Date(grinder.joinedAt).getTime()) / 86400000) : 0;

    if (isElite) ids.add("elite");
    if (completed >= 1) ids.add("first-order");
    if (completed >= 5) ids.add("grind-5");
    if (completed >= 10) ids.add("grind-10");
    if (completed >= 25) ids.add("veteran");
    if (completed >= 50) ids.add("grind-50");
    if (completed >= 100) ids.add("grind-100");
    if (completed >= 250) ids.add("grind-250");
    if (completed >= 500) ids.add("grind-500");
    if (quality >= 95 && completed >= 3) ids.add("quality");
    const totalBids = stats?.totalBids || 0;
    if (winRate >= 80 && totalBids >= 5) ids.add("sharp");
    if (onTime >= 100 && completed >= 5) ids.add("punctual");
    if (completion >= 100 && completed >= 5) ids.add("reliable");
    if (strikes === 0 && completed >= 5) ids.add("clean");
    if (earned >= 500) ids.add("earn-500");
    if (earned >= 2000) ids.add("earn-2k");
    if (earned >= 5000) ids.add("earn-5k");
    if (earned >= 10000) ids.add("earn-10k");
    if (earned >= 25000) ids.add("earn-25k");
    if (earned >= 50000) ids.add("earn-50k");
    if (earned >= 100000) ids.add("earn-100k");
    if (daysSinceJoin <= 7) ids.add("newbie");
    if (daysSinceJoin >= 90) ids.add("loyal");
    if (daysSinceJoin >= 180) ids.add("loyal-6m");
    if (daysSinceJoin >= 365) ids.add("loyal-1y");
    if (daysSinceJoin >= 730) ids.add("loyal-2y");
    if (daysSinceJoin >= 1825) ids.add("loyal-5y");
    if (grinder.twitchUsername) ids.add("streamer");

    const roles = grinder.roles as string[] | null;
    if (roles) {
      if (roles.includes("VC Grinder")) ids.add("vc-grinder");
      if (roles.includes("Event Grinder")) ids.add("event-grinder");
      if (roles.includes("International Grinder")) ids.add("international-grinder");
      if (roles.includes("Xbox Grinder")) ids.add("xbox-grinder");
      if (roles.includes("PS5 Grinder")) ids.add("ps5-grinder");
      if (roles.length >= 3) ids.add("versatile");
    }

    if (grinder.tier === "Diamond" || grinder.tier === "Elite") {
      ids.add("top-tier");
    }

    if (manualBadges) {
      manualBadges.forEach(b => {
        if (BADGE_META[b.badgeId as BadgeId]) ids.add(b.badgeId as BadgeId);
      });
    }

    return Array.from(ids);
  }, [grinder, stats, isElite, manualBadges]);

  // Handle badge celebration
  const prevBadgesRef = useRef<string[]>([]);
  useEffect(() => {
    if (allBadgeIds.length > prevBadgesRef.current.length && prevBadgesRef.current.length > 0) {
      const newBadges = allBadgeIds.filter(id => !prevBadgesRef.current.includes(id));
      if (newBadges.length > 0) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: isElite ? ["#06b6d4", "#ffffff", "#0891b2"] : ["#5865f2", "#ffffff", "#4752c4"],
          zIndex: 10000,
        });
        
        const badgeNames = newBadges.map(id => BADGE_META[id]?.label || id).join(", ");
        toast({
          title: "New Achievement Unlocked!",
          description: `You've earned: ${badgeNames}`,
          variant: "default",
        });
      }
    }
    prevBadgesRef.current = allBadgeIds;
  }, [allBadgeIds, isElite, toast]);

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="overview-loading">
        <div className="h-48 rounded-2xl bg-white/[0.03] animate-pulse" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 rounded-xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!grinder) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center" data-testid="overview-no-profile">
        <div className="w-16 h-16 rounded-full bg-white/[0.05] flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-white/20" />
        </div>
        <h2 className="text-lg font-semibold">Profile Not Found</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Your grinder profile couldn't be loaded. Please try refreshing the page or contact staff if the issue persists.
        </p>
      </div>
    );
  }

  const avatarUrl = grinder.discordAvatarUrl || user?.profileImageUrl || undefined;

  return (
    <AnimatedPage className="space-y-6">
      <FadeInUp>
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${eliteGradient} border ${eliteBorder} ${eliteGlow}`}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/[0.02] -translate-y-16 translate-x-16" />
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 relative">
          <Avatar className={`h-20 w-20 border-2 ${isElite ? "border-cyan-500/40" : "border-[#5865F2]/40"} shadow-lg`}>
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
              {grinder.discordUsername?.charAt(0)?.toUpperCase() || "G"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight flex items-center gap-2">
                {grinder.name || grinder.discordUsername}
                {grinder.discordUsername && (
                  <span className="text-base font-normal text-muted-foreground ml-2">(@{grinder.discordUsername})</span>
                )}
              </h1>
              {isElite ? (
                <Badge className="bg-cyan-950 text-cyan-300 border-cyan-500/40 gap-1" data-testid="badge-primary-role">
                  <Crown className="w-3.5 h-3.5" />
                  Elite Grinder
                </Badge>
              ) : (
                <Badge className="bg-[#1a1a3e] text-[#8b9aff] border-[#5865F2]/40 gap-1" data-testid="badge-primary-role">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Grinder
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
              {grinder.roles && grinder.roles.length > 0 && grinder.roles.filter((r: string) => r !== "Grinder" && r !== "Elite Grinder").map((r: string, i: number) => {
                const roleStyles: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
                  "VC Grinder": { bg: "bg-yellow-500/15", text: "text-yellow-300", border: "border-yellow-500/30", icon: <Coins className="w-3 h-3" /> },
                  "Event Grinder": { bg: "bg-blue-500/15", text: "text-blue-300", border: "border-blue-500/30", icon: <Landmark className="w-3 h-3" /> },
                  "International Grinder": { bg: "bg-pink-500/15", text: "text-pink-300", border: "border-pink-500/30", icon: <Globe className="w-3 h-3" /> },
                  "Xbox Grinder": { bg: "bg-green-500/15", text: "text-green-300", border: "border-green-500/30", icon: <FaXbox className="w-3 h-3" /> },
                  "PS5 Grinder": { bg: "bg-blue-600/15", text: "text-blue-300", border: "border-blue-600/30", icon: <SiPlaystation className="w-3 h-3" /> },
                };
                const style = roleStyles[r] || { bg: "bg-primary/10", text: "text-primary", border: "border-primary/30", icon: <ShieldCheck className="w-3 h-3" /> };
                return (
                  <Badge key={i} className={`${style.bg} ${style.text} ${style.border} gap-1 text-xs`} data-testid={`badge-role-${i}`}>
                    {style.icon}
                    {r}
                  </Badge>
                );
              })}
              <span>Joined {grinder.joinedAt ? new Date(grinder.joinedAt).toLocaleDateString() : grinder.createdAt ? new Date(grinder.createdAt).toLocaleDateString() : "N/A"}</span>
              {isElite && grinder.eliteSince && (
                <span className="text-cyan-400/70">Elite since {new Date(grinder.eliteSince).toLocaleDateString()}</span>
              )}
            </div>
            {allBadgeIds.length > 0 && (
              <BadgeGrid badgeIds={allBadgeIds} />
            )}
          </div>
        </div>
      </div>
      </FadeInUp>

      {!grinder.rulesAccepted && (
        <FadeInUp>
        <Card className="border-amber-500/40 bg-amber-500/5" data-testid="card-rules-banner">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <ScrollText className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-400">Accept Rules to Start Bidding</h3>
                <p className="text-sm text-muted-foreground">
                  You must accept the Grinder Rules & Guidelines before you can place bids on orders.
                </p>
              </div>
            </div>
            <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs font-medium text-muted-foreground mb-2">Grinder Rules & Guidelines</p>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p><span className="text-amber-400 font-bold">1.</span> <span className="font-medium">Privacy</span> — Never discuss customer prices with anyone</p>
                <p><span className="text-amber-400 font-bold">2.</span> <span className="font-medium">Quality</span> — Complete all orders to the highest standard</p>
                <p><span className="text-amber-400 font-bold">3.</span> <span className="font-medium">Communication</span> — Stay responsive during active orders</p>
                <p><span className="text-amber-400 font-bold">4.</span> <span className="font-medium">Honesty</span> — Only bid on orders you can realistically complete</p>
                <p><span className="text-amber-400 font-bold">5.</span> <span className="font-medium">Timeliness</span> — Meet your quoted timelines</p>
                <p><span className="text-amber-400 font-bold">6.</span> <span className="font-medium">Professionalism</span> — Represent the team professionally</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2 italic">Violations may result in strikes or removal.</p>
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                data-testid="button-accept-rules"
                onClick={() => {
                  apiRequest("POST", "/api/grinder/me/accept-rules").then(() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/grinder/me"] });
                    toast({ title: "Rules Accepted", description: "You can now place bids on orders!" });
                  }).catch(() => {
                    toast({ title: "Error", description: "Failed to accept rules. Please try again.", variant: "destructive" });
                  });
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                I Accept the Rules
              </Button>
            </div>
          </CardContent>
        </Card>
        </FadeInUp>
      )}

      {grinder.suspended && (
        <FadeInUp>
        <Card className="border-red-500/40 bg-red-500/5" data-testid="card-suspension-banner">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-400">Account Suspended</h3>
                <p className="text-sm text-muted-foreground">
                  You have an outstanding fine of <span className="text-red-400 font-bold">${parseFloat(grinder.outstandingFine || "0").toFixed(2)}</span>.
                  You cannot place bids or accept orders until all fines are paid.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </FadeInUp>
      )}

      <FadeInUp>
      <Card className={`border-0 ${isElite ? "bg-gradient-to-r from-cyan-500/[0.06] to-transparent" : "bg-gradient-to-r from-[#5865F2]/[0.06] to-transparent"}`} data-testid="card-availability">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg ${isElite ? "bg-cyan-500/15" : "bg-[#5865F2]/15"} flex items-center justify-center`}>
                <Signal className={`w-3.5 h-3.5 ${isElite ? "text-cyan-400" : "text-[#5865F2]"}`} />
              </div>
              <span className="text-sm font-medium">Availability</span>
              <HelpTip text="Set your availability so staff knows when you're ready to take orders. Use the status note to share details like your schedule or timezone. Staying 'Available' boosts your queue position." />
            </div>
            <Select
              value={availStatus}
              onValueChange={(val) => { setAvailStatus(val); availabilityMutation.mutate({ status: val, note: availNote }); }}
            >
              <SelectTrigger className="w-40 h-8 text-xs" data-testid="select-availability">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="away">Away</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
            <Input
              className="flex-1 h-8 text-xs min-w-[150px]"
              placeholder="Status note (optional)"
              value={availNote}
              onChange={(e) => setAvailNote(e.target.value)}
              onBlur={() => {
                if (availNote !== (grinder.availabilityNote || "")) {
                  availabilityMutation.mutate({ status: availStatus, note: availNote });
                }
              }}
              data-testid="input-availability-note"
            />
          </div>
        </CardContent>
      </Card>
      </FadeInUp>

      <FadeInUp>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Active Orders", value: stats.activeAssignments, icon: Clock, gradient: "bg-gradient-to-br from-yellow-500/[0.08] via-background to-yellow-500/[0.04]", iconBg: "bg-yellow-500/15", textColor: "text-yellow-400", path: "/grinder/assignments" },
              { label: "Completed", value: stats.completedAssignments, icon: CheckCircle, gradient: "bg-gradient-to-br from-emerald-500/[0.08] via-background to-emerald-500/[0.04]", iconBg: "bg-emerald-500/15", textColor: "text-emerald-400", path: "/grinder/assignments" },
              { label: "Total Bids", value: stats.totalBids, icon: Gavel, gradient: "bg-gradient-to-br from-purple-500/[0.08] via-background to-purple-500/[0.04]", iconBg: "bg-purple-500/15", textColor: "text-purple-400", path: "/grinder/bids" },
              { label: "Pending Bids", value: stats.pendingBids, icon: Target, gradient: "bg-gradient-to-br from-blue-500/[0.08] via-background to-blue-500/[0.04]", iconBg: "bg-blue-500/15", textColor: "text-blue-400", path: "/grinder/bids" },
              { label: "Order Limit", value: `${grinder.activeOrders}/${grinder.capacity}`, icon: BarChart3, gradient: isElite ? "bg-gradient-to-br from-cyan-500/[0.08] via-background to-cyan-500/[0.04]" : "bg-gradient-to-br from-[#5865F2]/[0.08] via-background to-[#5865F2]/[0.04]", iconBg: isElite ? "bg-cyan-500/15" : "bg-[#5865F2]/15", textColor: isElite ? "text-cyan-400" : "text-[#5865F2]", path: "/grinder/queue" },
            ].map((stat, i) => (
              <Link key={i} href={stat.path}>
                <Card className={`${stat.gradient} border-0 overflow-hidden relative group sm:hover:scale-[1.02] transition-transform duration-300 cursor-pointer`}>
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/[0.02] -translate-y-6 translate-x-6" />
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className={`text-xl sm:text-2xl font-bold ${stat.textColor} tracking-tight`} data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>{stat.value}</p>
                        <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-white/40">{stat.label}</p>
                      </div>
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${stat.iconBg} flex items-center justify-center backdrop-blur-sm`}>
                        <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.textColor}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
      </FadeInUp>

      <FadeInUp>
      <BiddingCountdownPanel variant="compact" />
      </FadeInUp>

      <FadeInUp>
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card className="border-0 bg-white/[0.03] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-[#5865F2]/15"} flex items-center justify-center`}>
                <TrendingUp className={`w-5 h-5 ${eliteAccent}`} />
              </div>
              Performance Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 grid-cols-2">
              {[
                { label: "Total Orders", value: grinder.totalOrders, color: "text-white" },
                { label: "Total Earned", value: `$${(stats.totalEarned || 0).toLocaleString()}`, color: "text-emerald-400" },
                { label: "Active Earnings", value: `$${(stats.activeEarnings || 0).toLocaleString()}`, color: "text-yellow-400" },
                { label: "Win Rate", value: `${stats.winRate}%`, color: isElite ? "text-cyan-400" : "text-[#5865F2]" },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">{item.label}</p>
                  <p className={`text-xl font-bold ${item.color} mt-1`} data-testid={`text-analytics-${item.label.toLowerCase().replace(/\s/g, '-')}`}>{item.value}</p>
                </div>
              ))}
            </div>
            {grinder.avgQualityRating != null && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Quality Score</span>
                  <span className="font-medium">{(Number(grinder.avgQualityRating) / 20).toFixed(1)}/5</span>
                </div>
                <Progress value={Number(grinder.avgQualityRating)} className={`h-2 ${isElite ? "[&>div]:bg-cyan-500" : ""}`} />
              </div>
            )}
            {grinder.onTimeRate != null && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">On-Time Rate</span>
                  <span className="font-medium">{Number(grinder.onTimeRate).toFixed(0)}%</span>
                </div>
                <Progress value={Number(grinder.onTimeRate)} className={`h-2 ${isElite ? "[&>div]:bg-cyan-500" : ""}`} />
              </div>
            )}
            {grinder.completionRate != null && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className="font-medium">{Number(grinder.completionRate).toFixed(0)}%</span>
                </div>
                <Progress value={Number(grinder.completionRate)} className={`h-2 ${isElite ? "[&>div]:bg-cyan-500" : ""}`} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/[0.03] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-emerald-500/15"} flex items-center justify-center`}>
                <FileCheck className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-emerald-400"}`} />
              </div>
              Recent Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
                  <FileCheck className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-white/40 text-sm">No assignments yet. Start bidding on orders!</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {assignments.slice(0, 5).map((a: any) => (
                  <Link key={a.id} href="/grinder/assignments">
                    <div className={`flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] ${isElite ? "hover:border-cyan-500/20" : "hover:border-[#5865F2]/20"} hover:bg-white/[0.05] active:scale-[0.98] cursor-pointer transition-all duration-200 group`} data-testid={`card-assignment-${a.id}`}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">Order {a.mgtOrderNumber ? `#${a.mgtOrderNumber}` : a.orderId}</p>
                        <p className="text-xs text-white/40">
                          {a.serviceName && <span>{a.serviceName.replace(/\s*[🔥🛠️🏆🃏🏟️🎁🎫➕⚡🎖️🪙]/g, "").trim()} • </span>}
                          Due: {a.dueDateTime ? new Date(a.dueDateTime).toLocaleDateString() : "TBD"}
                          {a.grinderEarnings && <span className="text-emerald-400 ml-2">${Number(a.grinderEarnings).toFixed(2)}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            (a.orderStatus || a.status) === "Active" ? "bg-emerald-500/20 text-emerald-400 border-0" :
                            (a.orderStatus || a.status) === "Paid Out" ? "bg-cyan-500/20 text-cyan-400 border-0" :
                            (a.orderStatus || a.status) === "Completed" || a.status === "Completed" ? "bg-blue-500/20 text-blue-400 border-0" :
                            "bg-white/[0.06] text-white/40 border-0"
                          }>
                          {a.orderStatus || a.status}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </FadeInUp>

      {aiTips.length > 0 && (
        <FadeInUp>
        <Card className={`border-0 ${isElite ? "bg-gradient-to-r from-cyan-500/[0.06] via-background to-teal-500/[0.03]" : "bg-gradient-to-r from-[#5865F2]/[0.06] via-background to-[#5865F2]/[0.03]"} overflow-hidden relative`}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-[#5865F2]/15"} flex items-center justify-center`}>
                <Lightbulb className={`w-5 h-5 ${eliteAccent}`} />
              </div>
              AI Performance Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {aiTips.map((tip: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]" data-testid={`text-ai-tip-${i}`}>
                  <Sparkles className={`w-4 h-4 mt-0.5 ${eliteAccent} flex-shrink-0`} />
                  <span className="text-sm text-white/60">{tip}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </FadeInUp>
      )}

      {stats.activeAssignments > 0 && (
        <FadeInUp>
        <Card className="border-0 bg-gradient-to-r from-blue-500/[0.08] via-background to-blue-500/[0.03] overflow-hidden relative" data-testid="card-customer-updates-info">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-blue-400">Customer Updates Active</h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Your daily updates and proof uploads are automatically sent to customers via Discord. When you complete an order, the customer approves your work before payout.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </FadeInUp>
      )}

      {lostBids.length > 0 && (
        <FadeInUp>
        <Card className="border-0 bg-gradient-to-r from-red-500/[0.06] via-background to-red-500/[0.03] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-lg text-red-400">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-400" />
              </div>
              Bids Not Selected ({lostBids.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lostBids.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]" data-testid={`card-lost-bid-${b.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                      <X className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Order {b.orderId}</p>
                      <p className="text-xs text-white/40">Bid: ${b.bidAmount}</p>
                    </div>
                  </div>
                  <Badge className="border-0 bg-red-500/15 text-red-400">
                    {b.status === "Order Assigned" ? "Order Assigned" : "Not Selected"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </FadeInUp>
      )}
    </AnimatedPage>
  );
}
