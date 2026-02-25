import { useQuery } from "@tanstack/react-query";
import { useGrinderData } from "@/hooks/use-grinder-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, Crown, Gauge, Scale, Shield, Star, Sparkles, AlertTriangle,
  Brain, DollarSign, Lightbulb, TrendingUp, Info
} from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { HelpTip } from "@/components/help-tip";

const QUEUE_FACTORS = [
  { key: "margin", label: "Margin", icon: DollarSign, desc: "How much profit your bid leaves for the business" },
  { key: "capacity", label: "Capacity", icon: Gauge, desc: "How much room you have for new orders" },
  { key: "fairness", label: "Fairness", icon: Scale, desc: "How long since your last assignment — longer wait = higher score" },
  { key: "reliability", label: "Reliability", icon: Shield, desc: "On-time rate, completion rate, and reassignment history" },
  { key: "tier", label: "Tier", icon: Crown, desc: "Your grinder tier — Elite ranks highest" },
  { key: "quality", label: "Quality", icon: Star, desc: "Your overall quality rating based on performance metrics" },
  { key: "newGrinder", label: "New Grinder", icon: Sparkles, desc: "Boost for new grinders with no orders in their first 14 days" },
  { key: "risk", label: "Risk", icon: AlertTriangle, desc: "Lower strikes and cancellations = higher score" },
] as const;

function factorColor(score: number): string {
  if (score >= 0.7) return "text-emerald-400";
  if (score >= 0.4) return "text-yellow-400";
  return "text-red-400";
}

function factorBarColor(score: number): string {
  if (score >= 0.7) return "[&>div]:bg-emerald-500";
  if (score >= 0.4) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-red-500";
}

export default function GrinderQueue() {
  const { grinder, isElite } = useGrinderData();

  const { data: queuePosition, isLoading: queueLoading } = useQuery<any>({
    queryKey: ["/api/grinder/me/queue-position"],
  });

  if (!grinder) return null;

  return (
    <AnimatedPage className="space-y-5">
      <FadeInUp>
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3" data-testid="text-queue-title">
            <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-purple-500/15"} flex items-center justify-center`}>
              <Brain className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-purple-400"}`} />
            </div>
            Your Queue Standing
            <HelpTip text="See where you rank in the AI queue across all open orders. Improve your weakest factors to move up." />
          </h2>
          {queuePosition && queuePosition.bestPosition > 0 && (
            <Badge className={`border-0 ${isElite ? "bg-cyan-500/20 text-cyan-400" : "bg-purple-500/20 text-purple-400"}`} data-testid="badge-best-position">
              Best: #{queuePosition.bestPosition}
            </Badge>
          )}
        </div>
      </FadeInUp>

      <FadeInUp>
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.06]" data-testid="banner-queue-disclaimer">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300/90">
            Queue position is a <strong className="font-semibold text-amber-300">guide</strong> — it helps keep everyone on a fair playing field and rewards better performers, but it doesn't guarantee you will or won't receive any specific order.
          </p>
        </div>
      </FadeInUp>

      <FadeInUp>
        <Card className="border-0 bg-white/[0.03]" data-testid="card-queue-standing">
          <CardContent className="p-4 space-y-5">
            {queueLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Calculating your position...</span>
              </div>
            ) : queuePosition ? (
              <>
                {queuePosition.rankedIn > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Avg. rank <span className={`font-bold ${isElite ? "text-cyan-400" : "text-purple-400"}`}>#{queuePosition.averagePosition}</span> across {queuePosition.rankedIn} order{queuePosition.rankedIn !== 1 ? "s" : ""}
                    {queuePosition.totalGrindersInQueue > 0 && <span className="text-white/30"> · {queuePosition.totalGrindersInQueue} grinders eligible</span>}
                  </p>
                ) : (
                  <p className="text-sm text-red-400">Not currently eligible for the queue</p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl bg-white/[0.04] p-3 text-center">
                    <p className={`text-2xl font-bold ${isElite ? "text-cyan-400" : "text-purple-400"}`} data-testid="text-avg-position">
                      {queuePosition.rankedIn > 0 ? `#${queuePosition.averagePosition}` : "—"}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Avg Position</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-400" data-testid="text-best-position">
                      {queuePosition.bestPosition > 0 ? `#${queuePosition.bestPosition}` : "—"}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Best Position</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-3 text-center">
                    <p className="text-2xl font-bold" data-testid="text-ranked-in">
                      {queuePosition.rankedIn}/{queuePosition.totalOpenOrders}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Orders Eligible</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-3 text-center">
                    <p className="text-2xl font-bold" data-testid="text-total-grinders">
                      {queuePosition.totalGrindersInQueue || "—"}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Grinders in Queue</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className={`w-4 h-4 ${isElite ? "text-cyan-400" : "text-purple-400"}`} />
                    <span className="text-sm font-semibold">Factor Breakdown</span>
                    <HelpTip text="Each factor contributes to your queue ranking with its own weight. Green (≥70%) is strong, yellow (40-69%) is average, red (<40%) needs work." />
                  </div>
                  <div className="space-y-2.5">
                    {QUEUE_FACTORS.map((factor) => {
                      const score = queuePosition.factorScores?.[factor.key] ?? 0;
                      const weight = queuePosition.queueWeights?.[factor.key] ?? 0;
                      const Icon = factor.icon;
                      return (
                        <div key={factor.key} className="flex items-center gap-2" data-testid={`factor-${factor.key}`}>
                          <Icon className={`w-4 h-4 shrink-0 ${factorColor(score)}`} />
                          <div className="w-20 shrink-0">
                            <span className="text-xs font-medium">{factor.label}</span>
                            <span className="text-[10px] text-muted-foreground ml-1">({Math.round(weight * 100)}%)</span>
                          </div>
                          <div className="flex-1">
                            <Progress value={score * 100} className={`h-2 ${factorBarColor(score)}`} />
                          </div>
                          <span className={`text-xs font-mono w-10 text-right ${factorColor(score)}`}>
                            {Math.round(score * 100)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 px-2.5 py-1.5">
                    <Info className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-[11px] text-orange-400 font-medium">Emergency Boost: +{Math.round((queuePosition.queueWeights?.emergencyBoost || 0.25) * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1.5">
                    <Crown className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[11px] text-cyan-400 font-medium">Large Order Elite Boost: +{Math.round((queuePosition.queueWeights?.largeOrderEliteBoost || 0.15) * 100)}%</span>
                  </div>
                </div>

                {queuePosition.improvementTips && queuePosition.improvementTips.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className={`w-4 h-4 ${isElite ? "text-cyan-400" : "text-yellow-400"}`} />
                      <span className="text-sm font-semibold">How to Improve</span>
                    </div>
                    <div className="space-y-1.5">
                      {queuePosition.improvementTips.map((tip: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground" data-testid={`tip-${i}`}>
                          <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${isElite ? "bg-cyan-400" : "bg-purple-400"}`} />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      </FadeInUp>
    </AnimatedPage>
  );
}
