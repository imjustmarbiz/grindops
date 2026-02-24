import { useGrinderData } from "@/hooks/use-grinder-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BiddingCountdownPanel } from "@/components/bidding-countdown";
import {
  TrendingUp, FileCheck, Ban, X, Lightbulb, Clock, CheckCircle, Gavel, Target, BarChart3
} from "lucide-react";

export default function GrinderOverview() {
  const {
    grinder, isElite, assignments, lostBids, aiTips, stats, eliteAccent,
  } = useGrinderData();

  if (!grinder) return null;

  return (
    <div className="space-y-6">
      <BiddingCountdownPanel variant="compact" />

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
                  <div key={a.id} className={`flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] ${isElite ? "hover:border-cyan-500/20" : "hover:border-[#5865F2]/20"} transition-all duration-200`} data-testid={`card-assignment-${a.id}`}>
                    <div>
                      <p className="text-sm font-medium">Order {a.orderId}</p>
                      <p className="text-xs text-white/40">
                        Due: {a.dueDateTime ? new Date(a.dueDateTime).toLocaleDateString() : "TBD"}
                        {a.grinderEarnings && <span className="text-emerald-400 ml-2">${Number(a.grinderEarnings).toFixed(2)}</span>}
                      </p>
                    </div>
                    <Badge
                      className={a.status === "Active" ? "bg-emerald-500/20 text-emerald-400 border-0" : a.status === "Completed" ? "bg-blue-500/20 text-blue-400 border-0" : "bg-white/[0.06] text-white/40 border-0"}>
                      {a.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {aiTips.length > 0 && (
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
                  <Lightbulb className={`w-4 h-4 mt-0.5 ${eliteAccent} flex-shrink-0`} />
                  <span className="text-sm text-white/60">{tip}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {lostBids.length > 0 && (
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
      )}
    </div>
  );
}
