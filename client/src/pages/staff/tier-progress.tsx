import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, Award, CheckCircle, Search, Users, Clock, Trophy,
  Star, DollarSign, Calendar, ChevronDown, ChevronUp, Info, Zap, Shield
} from "lucide-react";

const TIER_ORDER = ["New", "Bronze", "Silver", "Gold", "Diamond", "Elite"];

function getTierColor(tier: string) {
  switch (tier) {
    case "Elite": return "text-cyan-400";
    case "Diamond": return "text-violet-400";
    case "Gold": return "text-amber-400";
    case "Silver": return "text-gray-300";
    case "Bronze": return "text-orange-400";
    default: return "text-white/40";
  }
}

function getTierBg(tier: string) {
  switch (tier) {
    case "Elite": return "bg-cyan-500/15";
    case "Diamond": return "bg-violet-500/15";
    case "Gold": return "bg-amber-500/15";
    case "Silver": return "bg-gray-400/15";
    case "Bronze": return "bg-orange-500/15";
    default: return "bg-white/[0.05]";
  }
}

function formatDays(days: number) {
  if (days >= 365) return `${Math.floor(days / 365)}y ${Math.floor((days % 365) / 30)}mo`;
  if (days >= 30) return `${Math.floor(days / 30)}mo ${days % 30}d`;
  return `${days}d`;
}

type GrinderTierData = {
  id: string;
  name: string;
  tier: string;
  completedOrders: number;
  avgQualityRating: number;
  winRate: number;
  onTimeRate: number;
  totalEarnings: number;
  windowStats: { completedL30D: number; completedL90D: number; onTimeL30D: number; tenureDays: number };
};

type Threshold = {
  tier: string;
  minCompleted: number;
  minQuality: number;
  minWinRate: number;
  minOnTime: number;
  minEarnings: number;
  minTenureDays: number;
  minCompletedL30D: number;
  minCompletedL90D: number;
  minOnTimeL30D: number;
};

function getMetrics(g: GrinderTierData, t: Threshold) {
  return [
    { label: "Orders (30d)", current: g.windowStats.completedL30D, required: t.minCompletedL30D, cat: "short" as const },
    ...(t.minOnTimeL30D > 0 ? [{ label: "On-Time (30d)", current: Math.round(g.windowStats.onTimeL30D), required: t.minOnTimeL30D, cat: "short" as const }] : []),
    { label: "Orders (90d)", current: g.windowStats.completedL90D, required: t.minCompletedL90D, cat: "mid" as const },
    { label: "Quality", current: Math.round(g.avgQualityRating), required: t.minQuality, cat: "mid" as const },
    { label: "Win Rate", current: Math.round(g.winRate), required: t.minWinRate, cat: "mid" as const },
    { label: "Total Orders", current: g.completedOrders, required: t.minCompleted, cat: "long" as const },
    { label: "On-Time", current: Math.round(g.onTimeRate), required: t.minOnTime, cat: "long" as const },
    { label: "Earnings", current: g.totalEarnings, required: t.minEarnings, cat: "long" as const },
    { label: "Tenure", current: g.windowStats.tenureDays, required: t.minTenureDays, cat: "long" as const },
  ];
}

function GrinderTierCard({ grinder, thresholds, expanded, onToggle }: { grinder: GrinderTierData; thresholds: Threshold[]; expanded: boolean; onToggle: () => void }) {
  const tierIndex = TIER_ORDER.indexOf(grinder.tier);
  const nextTier = tierIndex < TIER_ORDER.length - 1 ? TIER_ORDER[tierIndex + 1] : null;
  const nextReqs = nextTier ? thresholds.find(t => t.tier === nextTier) : null;
  const metrics = nextReqs ? getMetrics(grinder, nextReqs) : [];
  const metCount = metrics.filter(m => m.current >= m.required).length;
  const totalReqs = metrics.length;
  const overallPct = totalReqs > 0 ? Math.round((metCount / totalReqs) * 100) : 100;

  const categories = [
    { key: "short" as const, label: "Short-Term (30d)", color: "text-amber-400", border: "border-amber-500/15", bg: "bg-amber-500/[0.03]" },
    { key: "mid" as const, label: "Mid-Term (90d)", color: "text-blue-400", border: "border-blue-500/15", bg: "bg-blue-500/[0.03]" },
    { key: "long" as const, label: "Long-Term (All-Time)", color: "text-violet-400", border: "border-violet-500/15", bg: "bg-violet-500/[0.03]" },
  ];

  return (
    <Card className="border-0 bg-white/[0.03] overflow-hidden" data-testid={`tier-card-${grinder.id}`}>
      <div
        className="flex items-center gap-3 p-3 sm:p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={onToggle}
        data-testid={`tier-card-toggle-${grinder.id}`}
      >
        <div className={`w-8 h-8 rounded-lg ${getTierBg(grinder.tier)} flex items-center justify-center shrink-0`}>
          <Award className={`w-4 h-4 ${getTierColor(grinder.tier)}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white truncate">{grinder.name}</span>
            <Badge className={`border-0 text-[10px] ${getTierBg(grinder.tier)} ${getTierColor(grinder.tier)}`}>{grinder.tier}</Badge>
          </div>
          {nextTier && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden max-w-[200px]">
                <div
                  className={`h-full rounded-full transition-all ${overallPct === 100 ? "bg-emerald-500" : overallPct >= 50 ? "bg-blue-500" : "bg-white/20"}`}
                  style={{ width: `${overallPct}%` }}
                />
              </div>
              <span className={`text-[10px] font-medium ${overallPct === 100 ? "text-emerald-400" : "text-white/40"}`}>
                {metCount}/{totalReqs} met
              </span>
              <span className="text-[10px] text-white/30">→ {nextTier}</span>
            </div>
          )}
          {!nextTier && <p className="text-[10px] text-cyan-400/70 mt-0.5">Max tier reached</p>}
        </div>
        {nextTier && (expanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />)}
      </div>

      {expanded && nextReqs && (
        <CardContent className="pt-0 pb-4 px-3 sm:px-4 space-y-2.5">
          <div className="border-t border-white/[0.06] pt-3">
            <p className="text-xs text-white/50 mb-2">Progress to <span className={getTierColor(nextTier!)}>{nextTier}</span></p>
            <div className="space-y-2">
              {categories.map(cat => {
                const catMetrics = metrics.filter(m => m.cat === cat.key);
                if (catMetrics.length === 0) return null;
                const catMet = catMetrics.filter(m => m.current >= m.required).length;
                return (
                  <div key={cat.key} className={`rounded-lg border ${cat.border} ${cat.bg} p-2.5`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[9px] font-semibold uppercase tracking-wider ${cat.color}`}>{cat.label}</span>
                      <span className={`text-[9px] font-medium ${catMet === catMetrics.length ? "text-emerald-400" : "text-white/40"}`}>{catMet}/{catMetrics.length}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {catMetrics.map((m, i) => {
                        const met = m.current >= m.required;
                        const pct = Math.min((m.current / Math.max(m.required, 1)) * 100, 100);
                        const isCurrency = m.label === "Earnings";
                        const isDays = m.label === "Tenure";
                        const dispCur = isCurrency ? `$${m.current.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : isDays ? formatDays(m.current) : `${m.current}${m.label.includes("Rate") || m.label.includes("Time") || m.label === "Quality" || m.label === "Win Rate" ? "%" : ""}`;
                        const dispReq = isCurrency ? `$${m.required.toLocaleString()}` : isDays ? formatDays(m.required) : `${m.required}${m.label.includes("Rate") || m.label.includes("Time") || m.label === "Quality" || m.label === "Win Rate" ? "%" : ""}`;
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-2 h-2 shrink-0">
                              {met ? <CheckCircle className="w-2 h-2 text-emerald-400" /> : <div className="w-2 h-2 rounded-full border border-white/20" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between text-[10px] mb-0.5">
                                <span className="text-white/50">{m.label}</span>
                                <span className={met ? "text-emerald-400" : "text-white/60"}>{dispCur}/{dispReq}</span>
                              </div>
                              <div className="h-0.5 rounded-full bg-white/[0.06] overflow-hidden">
                                <div className={`h-full rounded-full ${met ? "bg-emerald-500" : "bg-white/20"}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function TierProgressPage() {
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showGuide, setShowGuide] = useState(false);

  const { data, isLoading } = useQuery<{ grinders: GrinderTierData[]; tierThresholds: Threshold[] }>({
    queryKey: ["/api/staff/tier-overview"],
    queryFn: async () => {
      const res = await fetch("/api/staff/tier-overview", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tier data");
      return res.json();
    },
    refetchInterval: 60000,
  });

  const grinders = data?.grinders || [];
  const thresholds = data?.tierThresholds || [];

  const tierDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    TIER_ORDER.forEach(t => dist[t] = 0);
    grinders.forEach(g => { dist[g.tier] = (dist[g.tier] || 0) + 1; });
    return dist;
  }, [grinders]);

  const filtered = useMemo(() => {
    let list = grinders;
    if (filterTier !== "all") list = list.filter(g => g.tier === filterTier);
    if (search) list = list.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
    return list.sort((a, b) => {
      const ai = TIER_ORDER.indexOf(a.tier);
      const bi = TIER_ORDER.indexOf(b.tier);
      return bi - ai || a.name.localeCompare(b.name);
    });
  }, [grinders, filterTier, search]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <AnimatedPage className="space-y-6" data-testid="page-tier-progress">
      <FadeInUp>
        <div className="flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight" data-testid="text-tier-progress-title">Tier Progress</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Track grinder advancement across short-term, mid-term, and long-term performance windows</p>
      </FadeInUp>

      <FadeInUp>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {TIER_ORDER.map(t => (
            <Card
              key={t}
              className={`border-0 cursor-pointer transition-all ${filterTier === t ? `${getTierBg(t)} ring-1 ring-white/10` : "bg-white/[0.03] hover:bg-white/[0.05]"}`}
              onClick={() => setFilterTier(filterTier === t ? "all" : t)}
              data-testid={`filter-tier-${t.toLowerCase()}`}
            >
              <CardContent className="p-3 text-center">
                <p className={`text-lg sm:text-xl font-bold ${getTierColor(t)}`}>{tierDistribution[t] || 0}</p>
                <p className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-wider font-medium">{t}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </FadeInUp>

      <FadeInUp>
        <Card
          className={`border-0 overflow-hidden cursor-pointer transition-all ${showGuide ? "bg-white/[0.04]" : "bg-white/[0.02] hover:bg-white/[0.04]"}`}
          onClick={() => setShowGuide(!showGuide)}
          data-testid="card-tier-guide-toggle"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">How the Tier System Works</span>
              </div>
              {showGuide ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
            </div>
            {showGuide && (
              <div className="mt-4 space-y-4" onClick={e => e.stopPropagation()}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.03] p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400">Short-Term (30 Days)</h4>
                    </div>
                    <ul className="space-y-1">
                      <li className="text-[11px] text-white/60 flex items-start gap-1.5"><span className="w-1 h-1 rounded-full bg-amber-400/50 mt-1.5 shrink-0" />Recent order completion count in the last 30 days</li>
                      <li className="text-[11px] text-white/60 flex items-start gap-1.5"><span className="w-1 h-1 rounded-full bg-amber-400/50 mt-1.5 shrink-0" />On-time delivery rate from recent work (Gold+ only)</li>
                      <li className="text-[11px] text-white/60 flex items-start gap-1.5"><span className="w-1 h-1 rounded-full bg-amber-400/50 mt-1.5 shrink-0" />Proves the grinder is actively working, not coasting</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-blue-500/15 bg-blue-500/[0.03] p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400">Mid-Term (90 Days)</h4>
                    </div>
                    <ul className="space-y-1">
                      <li className="text-[11px] text-white/60 flex items-start gap-1.5"><span className="w-1 h-1 rounded-full bg-blue-400/50 mt-1.5 shrink-0" />Sustained order volume over 3 months</li>
                      <li className="text-[11px] text-white/60 flex items-start gap-1.5"><span className="w-1 h-1 rounded-full bg-blue-400/50 mt-1.5 shrink-0" />Quality score and bid win rate consistency</li>
                      <li className="text-[11px] text-white/60 flex items-start gap-1.5"><span className="w-1 h-1 rounded-full bg-blue-400/50 mt-1.5 shrink-0" />Prevents short bursts from inflating tier status</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-violet-500/15 bg-violet-500/[0.03] p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-violet-400" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-violet-400">Long-Term (All-Time)</h4>
                    </div>
                    <ul className="space-y-1">
                      <li className="text-[11px] text-white/60 flex items-start gap-1.5"><span className="w-1 h-1 rounded-full bg-violet-400/50 mt-1.5 shrink-0" />Total completed orders and career earnings</li>
                      <li className="text-[11px] text-white/60 flex items-start gap-1.5"><span className="w-1 h-1 rounded-full bg-violet-400/50 mt-1.5 shrink-0" />Overall on-time rate across all orders</li>
                      <li className="text-[11px] text-white/60 flex items-start gap-1.5"><span className="w-1 h-1 rounded-full bg-violet-400/50 mt-1.5 shrink-0" />Minimum tenure requirement (time since joining)</li>
                    </ul>
                  </div>
                </div>

                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left p-2 text-white/40 font-medium">Tier</th>
                        <th className="text-center p-2 text-amber-400/70 font-medium">30d Orders</th>
                        <th className="text-center p-2 text-amber-400/70 font-medium">30d On-Time</th>
                        <th className="text-center p-2 text-blue-400/70 font-medium">90d Orders</th>
                        <th className="text-center p-2 text-blue-400/70 font-medium">Quality</th>
                        <th className="text-center p-2 text-blue-400/70 font-medium">Win Rate</th>
                        <th className="text-center p-2 text-violet-400/70 font-medium">Total Orders</th>
                        <th className="text-center p-2 text-violet-400/70 font-medium">On-Time</th>
                        <th className="text-center p-2 text-violet-400/70 font-medium">Earnings</th>
                        <th className="text-center p-2 text-violet-400/70 font-medium">Tenure</th>
                      </tr>
                    </thead>
                    <tbody>
                      {thresholds.map(t => (
                        <tr key={t.tier} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                          <td className={`p-2 font-medium ${getTierColor(t.tier)}`}>{t.tier}</td>
                          <td className="text-center p-2 text-white/60">{t.minCompletedL30D}</td>
                          <td className="text-center p-2 text-white/60">{t.minOnTimeL30D > 0 ? `${t.minOnTimeL30D}%` : "—"}</td>
                          <td className="text-center p-2 text-white/60">{t.minCompletedL90D}</td>
                          <td className="text-center p-2 text-white/60">{t.minQuality}%</td>
                          <td className="text-center p-2 text-white/60">{t.minWinRate}%</td>
                          <td className="text-center p-2 text-white/60">{t.minCompleted}</td>
                          <td className="text-center p-2 text-white/60">{t.minOnTime}%</td>
                          <td className="text-center p-2 text-white/60">${t.minEarnings.toLocaleString()}</td>
                          <td className="text-center p-2 text-white/60">{formatDays(t.minTenureDays)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-white/40 leading-relaxed">
                    Grinders must meet <span className="text-white/60 font-medium">all requirements</span> across all three time windows to advance. This ensures consistent, sustained effort — not just short bursts. Completed order repairs are exempt from daily compliance tracking, and claim-missing orders can optionally have compliance enabled.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeInUp>

      <FadeInUp>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search grinders..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white/[0.03] border-white/10 text-sm"
              data-testid="input-tier-search"
            />
          </div>
          {filterTier !== "all" && (
            <Badge
              className={`cursor-pointer ${getTierBg(filterTier)} ${getTierColor(filterTier)} border-0`}
              onClick={() => setFilterTier("all")}
            >
              {filterTier} × 
            </Badge>
          )}
          <span className="text-xs text-white/30 ml-auto">{filtered.length} grinder{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </FadeInUp>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : (
        <FadeInUp>
          <div className="space-y-2" data-testid="tier-grinder-list">
            {filtered.length === 0 ? (
              <Card className="border-0 bg-white/[0.03]">
                <CardContent className="p-8 text-center">
                  <Users className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-sm text-white/40">No grinders match your filters</p>
                </CardContent>
              </Card>
            ) : (
              filtered.map(g => (
                <GrinderTierCard
                  key={g.id}
                  grinder={g}
                  thresholds={thresholds}
                  expanded={expandedIds.has(g.id)}
                  onToggle={() => toggleExpand(g.id)}
                />
              ))
            )}
          </div>
        </FadeInUp>
      )}
    </AnimatedPage>
  );
}
