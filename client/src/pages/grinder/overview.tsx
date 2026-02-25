import { useState } from "react";
import { useGrinderData } from "@/hooks/use-grinder-data";
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
  Signal, ScrollText, Sparkles, Crown, ShieldCheck
} from "lucide-react";
import { Link } from "wouter";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { HelpTip } from "@/components/help-tip";

export default function GrinderOverview() {
  const {
    user, grinder, isElite, assignments, lostBids, aiTips, stats,
    eliteAccent, eliteGradient, eliteBorder, eliteGlow,
    availabilityMutation, toast, queryClient,
  } = useGrinderData();

  const [availStatus, setAvailStatus] = useState(grinder?.availabilityStatus || "available");
  const [availNote, setAvailNote] = useState(grinder?.availabilityNote || "");

  if (!grinder) return null;

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
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                {grinder.name || grinder.discordUsername}
                <HelpTip text="Your personal dashboard with active orders, performance metrics, and alerts." />
                {grinder.discordUsername && (
                  <span className="text-base font-normal text-muted-foreground ml-2">(@{grinder.discordUsername})</span>
                )}
              </h1>
              {isElite ? (
                <Badge className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border-cyan-500/30 gap-1">
                  <Crown className="w-3.5 h-3.5" />
                  Elite Grinder
                </Badge>
              ) : (
                <Badge className="bg-[#5865F2]/20 text-[#5865F2] border-[#5865F2]/30 gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Grinder
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
              {grinder.roles && grinder.roles.length > 0 && grinder.roles.map((r: string, i: number) => (
                <Badge key={i} variant="outline" className="text-xs">{r}</Badge>
              ))}
              <span>Joined {grinder.joinedAt ? new Date(grinder.joinedAt).toLocaleDateString() : grinder.createdAt ? new Date(grinder.createdAt).toLocaleDateString() : "N/A"}</span>
              {isElite && grinder.eliteSince && (
                <span className="text-cyan-400/70">Elite since {new Date(grinder.eliteSince).toLocaleDateString()}</span>
              )}
            </div>
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
          { label: "Active Orders", value: stats.activeAssignments, icon: Clock, gradient: "bg-gradient-to-br from-yellow-500/[0.08] via-background to-yellow-500/[0.04]", iconBg: "bg-yellow-500/15", textColor: "text-yellow-400" },
          { label: "Completed", value: stats.completedAssignments, icon: CheckCircle, gradient: "bg-gradient-to-br from-emerald-500/[0.08] via-background to-emerald-500/[0.04]", iconBg: "bg-emerald-500/15", textColor: "text-emerald-400" },
          { label: "Total Bids", value: stats.totalBids, icon: Gavel, gradient: "bg-gradient-to-br from-purple-500/[0.08] via-background to-purple-500/[0.04]", iconBg: "bg-purple-500/15", textColor: "text-purple-400" },
          { label: "Pending Bids", value: stats.pendingBids, icon: Target, gradient: "bg-gradient-to-br from-blue-500/[0.08] via-background to-blue-500/[0.04]", iconBg: "bg-blue-500/15", textColor: "text-blue-400" },
          { label: "Order Limit", value: `${grinder.activeOrders}/${grinder.capacity}`, icon: BarChart3, gradient: isElite ? "bg-gradient-to-br from-cyan-500/[0.08] via-background to-cyan-500/[0.04]" : "bg-gradient-to-br from-[#5865F2]/[0.08] via-background to-[#5865F2]/[0.04]", iconBg: isElite ? "bg-cyan-500/15" : "bg-[#5865F2]/15", textColor: isElite ? "text-cyan-400" : "text-[#5865F2]" },
        ].map((stat, i) => (
          <Card key={i} className={`${stat.gradient} border-0 overflow-hidden relative group sm:hover:scale-[1.02] transition-transform duration-300`}>
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
                    <div className={`flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] ${isElite ? "hover:border-cyan-500/20" : "hover:border-[#5865F2]/20"} hover:bg-white/[0.05] active:scale-[0.98] cursor-pointer transition-all duration-200`} data-testid={`card-assignment-${a.id}`}>
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
