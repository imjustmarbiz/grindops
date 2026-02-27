import { useQuery } from "@tanstack/react-query";
import { useGrinderData } from "@/hooks/use-grinder-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardCheck, Star, Clock, CheckCircle, Trophy, CalendarCheck,
  BarChart3, FileText, MessageSquare, LogIn, AlertTriangle, Send,
  ScrollText, CheckSquare, ExternalLink, Wallet, DollarSign,
  TrendingUp, Award, ShieldCheck, Package
} from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";

import type { CustomerReview } from "@shared/schema";

function getGradeLetter(score: number): { letter: string; color: string } {
  if (score >= 90) return { letter: "A", color: "text-emerald-400" };
  if (score >= 75) return { letter: "B", color: "text-blue-400" };
  if (score >= 60) return { letter: "C", color: "text-yellow-400" };
  if (score >= 40) return { letter: "D", color: "text-orange-400" };
  return { letter: "F", color: "text-red-400" };
}

const TIER_ORDER = ["New", "Bronze", "Silver", "Gold", "Diamond", "Elite"];

function getTierColor(tier: string) {
  switch (tier) {
    case "Elite": return "text-cyan-400";
    case "Diamond": return "text-violet-400";
    case "Gold": return "text-amber-400";
    case "Silver": return "text-gray-300";
    case "Bronze": return "text-orange-400";
    default: return "text-white/60";
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

export default function GrinderScorecard() {
  const {
    grinder, isElite, isLoading: profileLoading,
    eliteAccent, eliteGradient, eliteBorder, eliteGlow,
  } = useGrinderData();

  const { data: scorecardData, isLoading: scorecardLoading } = useQuery<any>({
    queryKey: ["/api/grinder/me/scorecard"],
  });

  const { data: performanceReports, isLoading: reportsLoading } = useQuery<any[]>({
    queryKey: ["/api/grinder/me/performance-reports"],
  });

  const { data: customerReviews = [] } = useQuery<CustomerReview[]>({
    queryKey: ["/api/reviews"],
  });

  const approvedReviews = customerReviews.filter(r => r.status === "approved");

  const isLoading = profileLoading || scorecardLoading || reportsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="scorecard-loading">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!grinder) return null;

  const freshGrinder = scorecardData?.grinder || grinder;
  const checkpointStats = scorecardData?.checkpointCompliance || scorecardData?.checkpointStats;
  const reports = performanceReports || [];
  const orderLogs: any[] = scorecardData?.orderLogs || [];
  const strikeLogs: any[] = scorecardData?.strikeLogs || [];
  const payoutSummary = scorecardData?.payoutSummary || {};
  const orderHistory: any[] = scorecardData?.orderHistory || [];
  const tierThresholds: any[] = scorecardData?.tierThresholds || [];

  const qualityScore = freshGrinder.avgQualityRating != null ? Number(freshGrinder.avgQualityRating) : 0;
  const onTimeRate = freshGrinder.onTimeRate != null ? Number(freshGrinder.onTimeRate) : 0;
  const completionRate = freshGrinder.completionRate != null ? Number(freshGrinder.completionRate) : 0;
  const winRate = freshGrinder.winRate != null ? Number(freshGrinder.winRate) : 0;
  const dailyUpdateCompliance = freshGrinder.dailyUpdateCompliance != null ? Number(freshGrinder.dailyUpdateCompliance) : 0;
  const utilization = freshGrinder.utilization != null ? Number(freshGrinder.utilization) : 0;
  const activeOrders = freshGrinder.activeOrders || 0;
  const capacity = freshGrinder.capacity || 0;
  const totalEarnings = freshGrinder.totalEarnings != null ? Number(freshGrinder.totalEarnings) : 0;
  const completedOrders = freshGrinder.completedOrders || 0;
  const tier = freshGrinder.tier || "New";

  const grade = getGradeLetter(qualityScore);

  const metrics = [
    { label: "On-Time Rate", value: onTimeRate, icon: Clock, gradient: "bg-gradient-to-br from-blue-500/[0.08] via-background to-blue-500/[0.04]", iconBg: "bg-blue-500/15", textColor: "text-blue-400" },
    { label: "Completion Rate", value: completionRate, icon: CheckCircle, gradient: "bg-gradient-to-br from-emerald-500/[0.08] via-background to-emerald-500/[0.04]", iconBg: "bg-emerald-500/15", textColor: "text-emerald-400" },
    { label: "Win Rate", value: winRate, icon: Trophy, gradient: "bg-gradient-to-br from-purple-500/[0.08] via-background to-purple-500/[0.04]", iconBg: "bg-purple-500/15", textColor: "text-purple-400" },
    { label: "Daily Update Compliance", value: dailyUpdateCompliance, icon: CalendarCheck, gradient: "bg-gradient-to-br from-yellow-500/[0.08] via-background to-yellow-500/[0.04]", iconBg: "bg-yellow-500/15", textColor: "text-yellow-400" },
  ];

  const tierIndex = TIER_ORDER.indexOf(tier);
  const nextTier = tierIndex < TIER_ORDER.length - 1 ? TIER_ORDER[tierIndex + 1] : null;
  const tierProgress = tierIndex >= 0 ? Math.min(((tierIndex) / (TIER_ORDER.length - 1)) * 100, 100) : 0;

  const nextTierReqs = nextTier ? tierThresholds.find((t: any) => t.tier === nextTier) : null;
  const tierProgressMetrics = nextTierReqs ? [
    { label: "Completed Orders", current: completedOrders, required: nextTierReqs.minCompleted, unit: "" },
    { label: "Quality Score", current: Math.round(qualityScore), required: nextTierReqs.minQuality, unit: "%" },
    { label: "Win Rate", current: Math.round(winRate), required: nextTierReqs.minWinRate, unit: "%" },
    { label: "On-Time Rate", current: Math.round(onTimeRate), required: nextTierReqs.minOnTime, unit: "%" },
    { label: "Total Earnings", current: totalEarnings, required: nextTierReqs.minEarnings, unit: "$", isCurrency: true },
  ] : [];

  const totalPaidOut = payoutSummary.totalPaidOut || 0;
  const totalPending = payoutSummary.totalPending || 0;
  const paidCount = payoutSummary.paidCount || 0;
  const pendingCount = payoutSummary.pendingCount || 0;
  const recentPayouts: any[] = payoutSummary.recentPayouts || [];
  const pendingPayoutsList: any[] = payoutSummary.pendingPayoutsList || [];

  const activeStrikes = freshGrinder.strikes || 0;

  return (
    <AnimatedPage className="space-y-6" data-testid="scorecard-page">
      <FadeInUp>
      <div className="flex items-center gap-3">
        <ClipboardCheck className={`w-7 h-7 ${eliteAccent}`} />
        <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight" data-testid="text-scorecard-header">My Scorecard</h1>
      </div>
      <p className="text-sm text-muted-foreground mt-1">Your performance metrics, quality score, and customer reviews</p>
      </FadeInUp>

      <FadeInUp>
      <Card className={`border-0 overflow-hidden relative bg-gradient-to-r ${eliteGradient} border ${eliteBorder} ${eliteGlow}`} data-testid="card-quality-score">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/[0.02] -translate-y-12 translate-x-12" />
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-24 h-24 rounded-2xl ${isElite ? "bg-cyan-500/10 border border-cyan-500/20" : "bg-[#5865F2]/10 border border-[#5865F2]/20"} flex items-center justify-center`}>
                <span className={`text-5xl font-bold ${grade.color}`} data-testid="text-grade-letter">{grade.letter}</span>
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Overall Grade</p>
            </div>
            <div className="flex-1 w-full space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Star className={`w-5 h-5 ${eliteAccent}`} />
                  <span className="text-sm font-medium text-muted-foreground">Quality Score</span>
                </div>
                <span className="text-2xl font-bold" data-testid="text-quality-score">{qualityScore.toFixed(0)}%</span>
              </div>
              <Progress value={qualityScore} className={`h-3 ${isElite ? "[&>div]:bg-cyan-500" : ""}`} />
              <p className="text-xs text-white/40">
                {qualityScore >= 90 ? "Excellent performance" : qualityScore >= 75 ? "Good performance" : qualityScore >= 60 ? "Average performance" : qualityScore >= 40 ? "Below average" : "Needs improvement"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </FadeInUp>

      <FadeInUp>
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
        {[
          { label: "Active / Capacity", value: `${activeOrders} / ${capacity}`, sub: `${utilization.toFixed(0)}% utilization` },
          { label: "Tier", value: tier, sub: freshGrinder.ordersAssignedL7D != null ? `${freshGrinder.ordersAssignedL7D} orders (7d)` : undefined },
          { label: "Total Orders", value: String(freshGrinder.totalOrders || 0), sub: `${freshGrinder.completedOrders || 0} completed` },
          { label: "Total Earnings", value: `$${totalEarnings.toFixed(2)}`, sub: undefined },
        ].map((stat, i) => (
          <Card key={i} className="border-0 bg-white/[0.03] border border-white/[0.06]" data-testid={`card-stat-${stat.label.toLowerCase().replace(/[\s\/]/g, '-')}`}>
            <CardContent className="p-4">
              <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-white/40">{stat.label}</p>
              <p className="text-lg sm:text-xl font-bold mt-1">{stat.value}</p>
              {stat.sub && <p className="text-[10px] text-white/30 mt-0.5">{stat.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
      </FadeInUp>

      <FadeInUp>
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, i) => (
          <Card key={i} className={`${metric.gradient} border-0 overflow-hidden relative`} data-testid={`card-metric-${metric.label.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/[0.02] -translate-y-6 translate-x-6" />
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1">
                  <p className={`text-xl sm:text-2xl font-bold ${metric.textColor} tracking-tight`} data-testid={`text-metric-${metric.label.toLowerCase().replace(/\s/g, '-')}`}>{metric.value.toFixed(0)}%</p>
                  <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-white/40">{metric.label}</p>
                </div>
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${metric.iconBg} flex items-center justify-center backdrop-blur-sm shrink-0`}>
                  <metric.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${metric.textColor}`} />
                </div>
              </div>
              <Progress value={metric.value} className="h-1.5 mt-3" />
            </CardContent>
          </Card>
        ))}
      </div>
      </FadeInUp>

      <FadeInUp>
      <Card className="border-0 bg-white/[0.03] overflow-hidden relative" data-testid="card-tier-progress">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className={`w-9 h-9 rounded-xl ${getTierBg(tier)} flex items-center justify-center`}>
              <Award className={`w-5 h-5 ${getTierColor(tier)}`} />
            </div>
            Tier Progress
            <Badge className={`ml-auto border-0 ${getTierBg(tier)} ${getTierColor(tier)} text-xs`} data-testid="badge-current-tier">{tier}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40">Current Tier</span>
                  {nextTier && <span className="text-xs text-white/40">Next: <span className={getTierColor(nextTier)}>{nextTier}</span></span>}
                </div>
                <div className="relative h-3 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 bg-gradient-to-r from-orange-500 via-amber-500 via-gray-300 via-violet-500 to-cyan-500" style={{ width: `${tierProgress}%` }} />
                </div>
              </div>
            </div>
            <div className="flex justify-between px-1">
              {TIER_ORDER.map((t, i) => (
                <div key={t} className={`flex flex-col items-center gap-1 ${tierIndex >= i ? "opacity-100" : "opacity-30"}`}>
                  <div className={`w-2 h-2 rounded-full ${tierIndex >= i ? getTierBg(t).replace("/15", "/60") : "bg-white/10"}`} />
                  <span className={`text-[9px] font-medium ${tierIndex === i ? getTierColor(t) : "text-white/40"}`}>{t}</span>
                </div>
              ))}
            </div>

            {nextTierReqs && tierProgressMetrics.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <p className="text-xs font-medium text-white/50 mb-2.5">Requirements for <span className={getTierColor(nextTier!)}>{nextTier}</span></p>
                <div className="space-y-2">
                  {tierProgressMetrics.map((m, i) => {
                    const met = m.current >= m.required;
                    const pct = Math.min((m.current / m.required) * 100, 100);
                    const displayCurrent = (m as any).isCurrency ? `$${m.current.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : `${m.current}${m.unit}`;
                    const displayRequired = (m as any).isCurrency ? `$${m.required.toLocaleString()}` : `${m.required}${m.unit}`;
                    return (
                      <div key={i} className="flex items-center gap-3" data-testid={`tier-req-${i}`}>
                        <div className="w-2.5 h-2.5 shrink-0">
                          {met ? <CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> : <div className="w-2.5 h-2.5 rounded-full border border-white/20" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[11px] text-white/50">{m.label}</span>
                            <span className={`text-[11px] font-medium ${met ? "text-emerald-400" : "text-white/70"}`}>
                              {displayCurrent} / {displayRequired}
                            </span>
                          </div>
                          <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${met ? "bg-emerald-500" : "bg-white/20"}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-white/30 mt-2.5">
                  Meet all 5 requirements to advance. {tierProgressMetrics.filter(m => m.current >= m.required).length}/{tierProgressMetrics.length} met
                </p>
              </div>
            )}

            {tier === "Elite" && (
              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <p className="text-xs text-cyan-400/80 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  You've reached the highest tier. Keep up the great work!
                </p>
              </div>
            )}

            <div className="mt-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <p className="text-[10px] text-white/30 leading-relaxed">
                <span className="text-white/50 font-medium">Tier vs. Grinder Role:</span> Your <span className="text-white/50">tier</span> (New through Elite) is earned automatically based on performance metrics like completed orders, quality score, win rate, on-time delivery, and earnings. Your <span className="text-white/50">grinder role</span> (shown in your profile) is a tag assigned by staff based on your specialization or team role — it doesn't affect tier progress.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </FadeInUp>

      <FadeInUp>
      <Card className="border-0 bg-gradient-to-br from-violet-500/[0.08] via-background to-violet-900/[0.04] overflow-hidden relative" data-testid="card-payout-summary">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-violet-500/[0.02] -translate-y-8 translate-x-8" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-violet-400" />
            </div>
            Payout Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 mb-4">
            {[
              { label: "Total Paid", value: `$${totalPaidOut.toFixed(2)}`, color: "text-emerald-400", bg: "bg-emerald-500/10" },
              { label: "Pending", value: `$${totalPending.toFixed(2)}`, color: "text-amber-400", bg: "bg-amber-500/10" },
              { label: "Paid Payouts", value: String(paidCount), color: "text-violet-400", bg: "bg-violet-500/10" },
              { label: "Avg Payout", value: paidCount > 0 ? `$${(totalPaidOut / paidCount).toFixed(2)}` : "$0.00", color: "text-blue-400", bg: "bg-blue-500/10" },
            ].map((stat, i) => (
              <div key={i} className={`p-3 rounded-lg ${stat.bg} border border-white/[0.04]`} data-testid={`payout-stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.color} mt-1`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {pendingPayoutsList.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium uppercase tracking-wider text-white/40 mb-2">Pending Payouts</p>
              <div className="space-y-2">
                {pendingPayoutsList.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/[0.04] border border-amber-500/10" data-testid={`pending-payout-${p.id}`}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-sm text-white/70">{p.orderId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-amber-400">${parseFloat(p.amount || "0").toFixed(2)}</span>
                      <Badge className="border-0 text-[10px] bg-amber-500/15 text-amber-400">{p.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentPayouts.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40 mb-2">Recent Payouts</p>
              <div className="space-y-2">
                {recentPayouts.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/10" data-testid={`recent-payout-${p.id}`}>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-sm text-white/70">{p.orderId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-emerald-400">${parseFloat(p.amount || "0").toFixed(2)}</span>
                      {p.paidAt && <span className="text-[10px] text-white/30">{new Date(p.paidAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {paidCount === 0 && pendingCount === 0 && (
            <div className="text-center py-4">
              <p className="text-white/40 text-sm">No payouts yet</p>
            </div>
          )}
        </CardContent>
      </Card>
      </FadeInUp>

      <FadeInUp>
      <Card className="border-0 bg-white/[0.03] overflow-hidden relative" data-testid="card-strike-history">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-red-500/[0.02] -translate-y-8 translate-x-8" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            Strike & Fine History
            <div className="ml-auto flex items-center gap-2">
              <Badge className={`border-0 text-xs ${activeStrikes > 0 ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`} data-testid="badge-active-strikes">
                {activeStrikes}/3 strikes
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {strikeLogs.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/[0.08] flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400/40" />
              </div>
              <p className="text-emerald-400/60 text-sm font-medium" data-testid="text-no-strikes">Clean record — no strikes or fines</p>
            </div>
          ) : (
            <div className="space-y-3">
              {strikeLogs.map((log: any) => (
                <div key={log.id} className={`p-3 rounded-xl border ${log.action === "add" ? "bg-red-500/[0.04] border-red-500/10" : "bg-emerald-500/[0.04] border-emerald-500/10"}`} data-testid={`strike-log-${log.id}`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <div className="flex items-center gap-2">
                      {log.action === "add" ? (
                        <Badge className="border-0 text-[10px] bg-red-500/15 text-red-400">+Strike</Badge>
                      ) : (
                        <Badge className="border-0 text-[10px] bg-emerald-500/15 text-emerald-400">-Strike</Badge>
                      )}
                      <span className="text-xs text-white/50">{log.resultingStrikes}/3 strikes</span>
                    </div>
                    <span className="text-[10px] text-white/40">
                      {log.createdAt ? new Date(log.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 mt-1">{log.reason}</p>
                  {Number(log.fineAmount) > 0 && (
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs font-medium text-amber-400">${Number(log.fineAmount).toFixed(2)} fine</span>
                      <Badge variant="outline" className={`text-[10px] ${log.finePaid ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/10" : "border-red-500/20 text-red-400 bg-red-500/10"}`}>
                        {log.finePaid ? "Paid" : "Unpaid"}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </FadeInUp>

      <FadeInUp>
      <Card className="border-0 bg-white/[0.03] overflow-hidden relative" data-testid="card-performance-reports">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-[#5865F2]/15"} flex items-center justify-center`}>
              <FileText className={`w-5 h-5 ${eliteAccent}`} />
            </div>
            Performance Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-white/20" />
              </div>
              <p className="text-white/40 text-sm" data-testid="text-no-reports">No performance reports yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report: any, idx: number) => {
                const reportGrade = report.overallGrade || "N/A";
                return (
                  <div key={report.id || idx} className={`p-4 rounded-lg bg-white/[0.03] border border-white/[0.06] ${isElite ? "hover:border-cyan-500/20" : "hover:border-[#5865F2]/20"} transition-all duration-200`} data-testid={`card-report-${report.id || idx}`}>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${isElite ? "bg-cyan-500/15" : "bg-[#5865F2]/15"} flex items-center justify-center`}>
                          <BarChart3 className={`w-4 h-4 ${eliteAccent}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium" data-testid={`text-report-assignment-${report.id || idx}`}>Assignment {report.assignmentId || "N/A"}</p>
                          <p className="text-xs text-white/40">
                            Created: {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "N/A"}
                            {report.approvedAt && (
                              <span className="ml-2">Approved: {new Date(report.approvedAt).toLocaleDateString()}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`border-0 ${reportGrade === "A" ? "bg-emerald-500/20 text-emerald-400" : reportGrade === "B" ? "bg-blue-500/20 text-blue-400" : reportGrade === "C" ? "bg-yellow-500/20 text-yellow-400" : reportGrade === "D" ? "bg-orange-500/20 text-orange-400" : "bg-red-500/20 text-red-400"}`} data-testid={`badge-grade-${report.id || idx}`}>
                          Grade: {reportGrade}
                        </Badge>
                        {report.dailyUpdateCompliance != null && (
                          <Badge className="border-0 bg-white/[0.06] text-white/60" data-testid={`badge-compliance-${report.id || idx}`}>
                            Updates: {Number(report.dailyUpdateCompliance).toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                    </div>

                    {report.metricsSnapshot && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                        {[
                          { label: "Quality", value: report.metricsSnapshot.qualityScore },
                          { label: "Completion", value: report.metricsSnapshot.completionRate },
                          { label: "Win Rate", value: report.metricsSnapshot.winRate },
                          { label: "On-Time", value: report.metricsSnapshot.onTimeRate },
                        ].map((m, mi) => (
                          <div key={mi} className="p-2 rounded-md bg-white/[0.03] border border-white/[0.04]">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">{m.label}</p>
                            <p className="text-sm font-semibold" data-testid={`text-snapshot-${m.label.toLowerCase().replace(/\s/g, '-')}-${report.id || idx}`}>{m.value != null ? `${Number(m.value).toFixed(0)}%` : "N/A"}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {report.staffNotes && (
                      <div className="mt-3 p-3 rounded-md bg-white/[0.03] border border-white/[0.04]">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="w-3.5 h-3.5 text-white/30" />
                          <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">Staff Notes</p>
                        </div>
                        <p className="text-sm text-white/60" data-testid={`text-staff-notes-${report.id || idx}`}>{report.staffNotes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </FadeInUp>

      {orderHistory.length > 0 && (
        <FadeInUp>
        <Card className="border-0 bg-white/[0.03] overflow-hidden relative" data-testid="card-order-history">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-[#5865F2]/15"} flex items-center justify-center`}>
                <Package className={`w-5 h-5 ${eliteAccent}`} />
              </div>
              Completed Orders
              <Badge className={`${isElite ? "bg-cyan-500/20 text-cyan-400" : "bg-[#5865F2]/20 text-[#5865F2]"} border-0 text-xs ml-auto`}>{orderHistory.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orderHistory.map((order: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]" data-testid={`order-history-${idx}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${order.isOnTime === true ? "bg-emerald-500/15" : order.isOnTime === false ? "bg-red-500/15" : "bg-white/[0.06]"}`}>
                        {order.isOnTime === true ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : order.isOnTime === false ? <Clock className="w-4 h-4 text-red-400" /> : <Package className="w-4 h-4 text-white/30" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium truncate">Order {order.mgtOrderNumber ? `#${order.mgtOrderNumber}` : order.orderId}</p>
                          <Badge className={`border-0 text-[10px] ${
                            order.orderStatus === "Paid Out" ? "bg-cyan-500/20 text-cyan-400" :
                            order.orderStatus === "Completed" ? "bg-blue-500/20 text-blue-400" :
                            "bg-white/[0.06] text-white/40"
                          }`}>
                            {order.orderStatus || "Completed"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {order.serviceName && <span className="text-[10px] text-white/30">{order.serviceName.replace(/\s*[🔥🛠️🏆🃏🏟️🎁🎫➕⚡🎖️🪙]/g, "").trim()}</span>}
                          {order.platform && <span className="text-[10px] text-white/30">• {order.platform}</span>}
                          {order.gamertag && <span className="text-[10px] text-white/30">• {order.gamertag}</span>}
                          {order.deliveredAt && <span className="text-[10px] text-white/30">• {new Date(order.deliveredAt).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-medium text-emerald-400">${parseFloat(order.earnings || "0").toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 ml-11 flex-wrap">
                    {order.isOnTime === true && <Badge className="border-0 text-[10px] bg-emerald-500/15 text-emerald-400">On Time</Badge>}
                    {order.isOnTime === false && <Badge className="border-0 text-[10px] bg-red-500/15 text-red-400">Late</Badge>}
                    {order.qualityRating && <Badge className="border-0 text-[10px] bg-white/[0.06] text-white/50">{order.qualityRating}/5 Quality</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </FadeInUp>
      )}

      <FadeInUp>
      <Card className="border-0 bg-white/[0.03] overflow-hidden relative" data-testid="card-order-logs">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-[#5865F2]/15"} flex items-center justify-center`}>
              <ScrollText className={`w-5 h-5 ${eliteAccent}`} />
            </div>
            Order Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orderLogs.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
                <ScrollText className="w-6 h-6 text-white/20" />
              </div>
              <p className="text-white/40 text-sm" data-testid="text-no-order-logs">No order logs yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orderLogs.map((log: any, idx: number) => (
                <div key={log.id || idx} className={`p-4 rounded-lg bg-white/[0.03] border border-white/[0.06] ${isElite ? "hover:border-cyan-500/20" : "hover:border-[#5865F2]/20"} transition-all duration-200`} data-testid={`card-order-log-${log.id || idx}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg ${log.updateType === "progress" ? "bg-blue-500/15" : log.updateType === "completion" ? "bg-emerald-500/15" : "bg-yellow-500/15"} flex items-center justify-center shrink-0 mt-0.5`}>
                        {log.updateType === "completion" ? (
                          <CheckSquare className={`w-4 h-4 ${log.updateType === "completion" ? "text-emerald-400" : "text-blue-400"}`} />
                        ) : (
                          <Send className={`w-4 h-4 ${log.updateType === "progress" ? "text-blue-400" : "text-yellow-400"}`} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" data-testid={`text-order-log-title-${log.id || idx}`}>{log.orderTitle}</p>
                        <p className="text-xs text-white/40 mt-0.5">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <Badge className={`border-0 text-[10px] ${log.updateType === "progress" ? "bg-blue-500/20 text-blue-400" : log.updateType === "completion" ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`} data-testid={`badge-update-type-${log.id || idx}`}>
                        {log.updateType === "progress" ? "Progress" : log.updateType === "completion" ? "Completion" : log.updateType}
                      </Badge>
                      {log.acknowledgedAt && (
                        <Badge className="border-0 text-[10px] bg-emerald-500/10 text-emerald-400" data-testid={`badge-ack-${log.id || idx}`}>
                          Acknowledged
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 ml-11">
                    <p className="text-sm text-white/60 whitespace-pre-wrap" data-testid={`text-order-log-message-${log.id || idx}`}>{log.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </FadeInUp>

      {checkpointStats && (
        <FadeInUp>
        <Card className="border-0 bg-white/[0.03] overflow-hidden relative" data-testid="card-activity-summary">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-[#5865F2]/15"} flex items-center justify-center`}>
                <BarChart3 className={`w-5 h-5 ${eliteAccent}`} />
              </div>
              Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
              {[
                { label: "Total Logins", value: checkpointStats.totalLogins ?? 0, icon: LogIn, color: "text-blue-400", bg: "bg-blue-500/15" },
                { label: "Issues Reported", value: checkpointStats.issuesReported ?? 0, icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/15" },
                { label: "Updates Submitted", value: checkpointStats.updatesSubmitted ?? 0, icon: Send, color: "text-emerald-400", bg: "bg-emerald-500/15" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]" data-testid={`card-activity-${item.label.toLowerCase().replace(/\s/g, '-')}`}>
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold" data-testid={`text-activity-${item.label.toLowerCase().replace(/\s/g, '-')}`}>{item.value}</p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </FadeInUp>
      )}

      {approvedReviews.length > 0 && (
        <FadeInUp>
        <Card className="border-0 bg-white/[0.03] overflow-hidden relative" data-testid="card-customer-reviews">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-[#5865F2]/15"} flex items-center justify-center`}>
                <Star className={`w-5 h-5 ${eliteAccent}`} />
              </div>
              Customer Reviews
              <Badge className={`${isElite ? "bg-cyan-500/20 text-cyan-400" : "bg-[#5865F2]/20 text-[#5865F2]"} border-0 text-xs`}>
                {approvedReviews.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {approvedReviews.map((review) => (
                <div key={review.id} className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]" data-testid={`card-review-${review.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm truncate" data-testid={`text-review-title-${review.id}`}>{review.title}</h4>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? "text-amber-400 fill-amber-400" : "text-white/10"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-white/60 line-clamp-2" data-testid={`text-review-body-${review.id}`}>{review.body}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-white/30">By {review.reviewerName}</span>
                        <span className="text-[10px] text-white/30">{new Date(review.createdAt).toLocaleDateString()}</span>
                        {review.proofLinks && (review.proofLinks as string[]).length > 0 && (
                          <span className="text-[10px] text-white/30 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            {(review.proofLinks as string[]).length} proof{(review.proofLinks as string[]).length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
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