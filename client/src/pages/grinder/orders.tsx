import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGrinderData, getDiscordMessageLink, getBidWarLink, BID_WAR_CHANNEL_ID } from "@/hooks/use-grinder-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InlineCountdown } from "@/components/bidding-countdown";
import {
  Loader2, Gavel, Zap, Target, ExternalLink, Sparkles, FileText, Gamepad2, Monitor, Hash, User, StickyNote, DollarSign, AlertTriangle,
  Brain, ChevronDown, ChevronUp, Crown, Gauge, Scale, Shield, Star, Lightbulb, TrendingUp, Info
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

export default function GrinderOrders() {
  const {
    grinder, isElite, availableOrders, serviceName, placeBidMutation,
    eliteAccent, eliteGradient, eliteBorder,
  } = useGrinderData();

  const [placeBidDialog, setPlaceBidDialog] = useState<any>(null);
  const [placeBidAmount, setPlaceBidAmount] = useState("");
  const [placeBidTimeline, setPlaceBidTimeline] = useState("");
  const [placeBidCanStart, setPlaceBidCanStart] = useState("");
  const [viewDetailsOrder, setViewDetailsOrder] = useState<any>(null);
  const [showQueueStanding, setShowQueueStanding] = useState(false);

  const { data: queuePosition, isLoading: queueLoading } = useQuery<any>({
    queryKey: ["/api/grinder/me/queue-position"],
  });

  if (!grinder) return null;

  const replacementOrders = availableOrders.filter((o: any) => o.isEmergency === true);
  const regularOrders = availableOrders.filter((o: any) => !o.isEmergency);

  const renderOrderCard = (order: any, isReplacement?: boolean) => (
    <Card
      key={order.id}
      className={`border-0 ${isReplacement ? "border border-red-500/20 bg-red-500/[0.04]" : "bg-white/[0.03]"} ${isElite ? "sm:hover:bg-cyan-500/[0.05]" : "sm:hover:bg-[#5865F2]/[0.05]"} transition-all duration-200`}
      data-testid={`card-order-${order.id}`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="font-bold text-lg">
                {order.mgtOrderNumber ? `Order #${order.mgtOrderNumber}` : order.id}
              </span>
              <InlineCountdown biddingClosesAt={order.biddingClosesAt} />
              {isReplacement && <Badge className="bg-red-500/20 text-red-400 border-red-500/30">REPLACEMENT</Badge>}
              {order.elitePriority && isElite && <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30"><Sparkles className="w-3 h-3 mr-0.5" />Elite Early Access</Badge>}
              {order.isManual && <Badge className="bg-amber-500/20 text-amber-400">Dashboard</Badge>}
              {order.isEmergency && <Badge className="bg-red-500/20 text-red-400">EMERGENCY</Badge>}
              {order.isRush && <Badge className="bg-orange-500/20 text-orange-400">RUSH</Badge>}
              <Badge variant="outline" className="text-muted-foreground">{serviceName(order.serviceId)}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              {order.platform && <span>Platform: {order.platform}</span>}
              {order.gamertag && <span>GT: {order.gamertag}</span>}
              <span>Due: {new Date(order.orderDueDate).toLocaleDateString()}</span>
              <span>Complexity: {order.complexity}/5</span>
              <span>{order.totalBids} bid{order.totalBids !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-0 sm:ml-4">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-white/10 text-muted-foreground hover:text-foreground"
              data-testid={`button-details-${order.id}`}
              onClick={() => setViewDetailsOrder(order)}
            >
              <FileText className="w-3.5 h-3.5" />
              Details
            </Button>
            {order.hasBid ? (
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-500/20 text-blue-400">
                  Bid: ${order.myBidAmount}
                </Badge>
                {order.myBidStatus === "Pending" && (
                  <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">Pending</Badge>
                )}
              </div>
            ) : order.isManual ? (
              <Button
                size="sm"
                className={`gap-2 ${isElite ? "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white" : ""}`}
                data-testid={`button-bid-${order.id}`}
                onClick={() => {
                  setPlaceBidDialog(order);
                  setPlaceBidAmount("");
                  setPlaceBidTimeline("");
                  setPlaceBidCanStart("");
                }}
              >
                <Gavel className="w-4 h-4" />
                Place Bid
              </Button>
            ) : (
              <Button
                size="sm"
                className={`gap-2 ${isElite ? "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white" : ""}`}
                data-testid={`button-bid-${order.id}`}
                onClick={() => {
                  const link = order.discordBidLink
                    ? order.discordBidLink
                    : order.discordMessageId
                      ? getDiscordMessageLink(BID_WAR_CHANNEL_ID, order.discordMessageId)
                      : getBidWarLink();
                  window.open(link, "_blank");
                }}
              >
                <Gavel className="w-4 h-4" />
                Place Bid
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AnimatedPage className="space-y-4">
      <FadeInUp>
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-amber-500/15"} flex items-center justify-center`}>
            <Zap className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
          </div>
          Available Orders
          <HelpTip text="Browse open orders available for bidding." />
          <Badge className="border-0 bg-white/[0.06] text-white/60 text-xs">{availableOrders.length}</Badge>
        </h2>
      </div>
      </FadeInUp>

      <FadeInUp>
        <Card className={`border-0 overflow-hidden bg-white/[0.03]`} data-testid="card-queue-standing">
          <button
            className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
            onClick={() => setShowQueueStanding(!showQueueStanding)}
            data-testid="button-toggle-queue-standing"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-purple-500/15"} flex items-center justify-center`}>
                <Brain className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-purple-400"}`} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-bold">Your Queue Standing</span>
                  <HelpTip text="See where you rank in the AI queue without seeing other grinders. Improve your weakest factors to move up." />
                </div>
                {queuePosition && queuePosition.rankedIn > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Avg. rank <span className={`font-bold ${isElite ? "text-cyan-400" : "text-purple-400"}`}>#{queuePosition.averagePosition}</span> across {queuePosition.rankedIn} order{queuePosition.rankedIn !== 1 ? "s" : ""}
                    {queuePosition.totalGrindersInQueue > 0 && <span className="text-white/30"> · {queuePosition.totalGrindersInQueue} grinders eligible</span>}
                  </p>
                )}
                {queuePosition && queuePosition.rankedIn === 0 && (
                  <p className="text-xs text-red-400 mt-0.5">Not currently eligible for the queue</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {queuePosition && queuePosition.bestPosition > 0 && (
                <Badge className={`border-0 ${isElite ? "bg-cyan-500/20 text-cyan-400" : "bg-purple-500/20 text-purple-400"} text-xs`} data-testid="badge-best-position">
                  Best: #{queuePosition.bestPosition}
                </Badge>
              )}
              {showQueueStanding ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </button>
          {showQueueStanding && (
            <CardContent className="px-4 pb-4 pt-0 space-y-5">
              {queueLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Calculating your position...</span>
                </div>
              ) : queuePosition ? (
                <>
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
          )}
        </Card>
      </FadeInUp>

      {replacementOrders.length > 0 && (
        <FadeInUp>
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <h3 className="text-lg font-bold" data-testid="text-replacement-orders-header">Replacement Orders</h3>
              <Badge className="border-0 bg-red-500/20 text-red-400 text-xs" data-testid="badge-replacement-count">{replacementOrders.length}</Badge>
              <HelpTip text="Replacement orders are high-priority. They come with an emergency boost in the queue, meaning your bid carries extra weight." />
            </div>
            <p className="text-sm text-muted-foreground">High-priority orders needing immediate attention</p>
            <div className="grid gap-4" data-testid="section-replacement-orders">
              {replacementOrders.map((order: any) => renderOrderCard(order, true))}
            </div>
          </div>
        </FadeInUp>
      )}

      <FadeInUp>
      {availableOrders.length === 0 ? (
        <Card className="border-0 bg-white/[0.03]">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
              <Target className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white/40">No open orders right now. Check back soon!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {replacementOrders.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-lg font-bold" data-testid="text-open-orders-header">Open Orders</h3>
              <Badge className="border-0 bg-white/[0.06] text-white/60 text-xs">{regularOrders.length}</Badge>
            </div>
          )}
          {regularOrders.length === 0 && replacementOrders.length > 0 ? (
            <Card className="border-0 bg-white/[0.03]">
              <CardContent className="p-8 text-center">
                <p className="text-white/40">No additional open orders right now.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4" data-testid="section-regular-orders">
              {regularOrders.map((order: any) => renderOrderCard(order, false))}
            </div>
          )}
        </div>
      )}
      </FadeInUp>

      <Dialog open={!!viewDetailsOrder} onOpenChange={(open) => !open && setViewDetailsOrder(null)}>
        <DialogContent className="border-white/10 bg-background/95 backdrop-blur-xl sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg ${isElite ? "bg-cyan-500/15" : "bg-amber-500/15"} flex items-center justify-center`}>
                <FileText className={`w-4 h-4 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
              </div>
              Order Details
            </DialogTitle>
          </DialogHeader>
          {viewDetailsOrder && (
            <div className="space-y-4 mt-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                <div className={`px-4 py-3 ${isElite ? "bg-cyan-500/10 border-b border-cyan-500/20" : "bg-amber-500/10 border-b border-amber-500/20"}`}>
                  <div className="flex items-center gap-2">
                    <Hash className={`w-4 h-4 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
                    <span className="font-bold text-lg">
                      {viewDetailsOrder.mgtOrderNumber ? `Order #${viewDetailsOrder.mgtOrderNumber}` : viewDetailsOrder.id}
                    </span>
                    {viewDetailsOrder.isEmergency && <Badge className="bg-red-500/20 text-red-400 border-0 text-[10px]">EMERGENCY</Badge>}
                    {viewDetailsOrder.isRush && <Badge className="bg-orange-500/20 text-orange-400 border-0 text-[10px]">RUSH</Badge>}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Gamepad2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Service</p>
                      <p className="font-medium">{serviceName(viewDetailsOrder.serviceId)}</p>
                    </div>
                  </div>
                  {viewDetailsOrder.platform && (
                    <div className="flex items-start gap-3">
                      <Monitor className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Platform</p>
                        <p className="font-medium">{viewDetailsOrder.platform}</p>
                      </div>
                    </div>
                  )}
                  {viewDetailsOrder.gamertag && (
                    <div className="flex items-start gap-3">
                      <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Gamertag</p>
                        <p className="font-medium">{viewDetailsOrder.gamertag}</p>
                      </div>
                    </div>
                  )}
                  {viewDetailsOrder.notes && (
                    <div className="flex items-start gap-3">
                      <StickyNote className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Order Notes</p>
                        <p className="text-sm">{viewDetailsOrder.notes}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Complexity</p>
                      <p className="font-medium">{viewDetailsOrder.complexity}/5</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Due Date</p>
                      <p className="font-medium">{new Date(viewDetailsOrder.orderDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                  </div>
                </div>

                {viewDetailsOrder.orderBrief && (
                  <div className="border-t border-white/10 p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Full Brief</p>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {viewDetailsOrder.orderBrief.split("\n").map((line: string, i: number) => {
                        const boldMatch = line.match(/^\*\*(.*?)\*\*\s*(.*)/);
                        if (boldMatch) {
                          return <p key={i} className="mb-1"><span className="font-semibold text-foreground">{boldMatch[1]}</span> {boldMatch[2]}</p>;
                        }
                        return <p key={i} className="mb-1 text-muted-foreground">{line}</p>;
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {!viewDetailsOrder.hasBid && !viewDetailsOrder.isManual && (
                  <Button
                    className={`flex-1 gap-2 ${isElite ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white" : ""}`}
                    data-testid={`button-bid-from-details-${viewDetailsOrder.id}`}
                    onClick={() => {
                      const link = viewDetailsOrder.discordBidLink
                        ? viewDetailsOrder.discordBidLink
                        : viewDetailsOrder.discordMessageId
                          ? getDiscordMessageLink(BID_WAR_CHANNEL_ID, viewDetailsOrder.discordMessageId)
                          : getBidWarLink();
                      window.open(link, "_blank");
                    }}
                  >
                    <Gavel className="w-4 h-4" />
                    Bid on Discord
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                )}
                {!viewDetailsOrder.hasBid && viewDetailsOrder.isManual && (
                  <Button
                    className={`flex-1 gap-2 ${isElite ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white" : ""}`}
                    data-testid={`button-bid-manual-from-details-${viewDetailsOrder.id}`}
                    onClick={() => {
                      setViewDetailsOrder(null);
                      setPlaceBidDialog(viewDetailsOrder);
                      setPlaceBidAmount("");
                      setPlaceBidTimeline("");
                      setPlaceBidCanStart("");
                    }}
                  >
                    <Gavel className="w-4 h-4" />
                    Place Bid
                  </Button>
                )}
                <Button variant="outline" className="border-white/10" onClick={() => setViewDetailsOrder(null)} data-testid="button-close-details">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!placeBidDialog} onOpenChange={(open) => !open && setPlaceBidDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Bid - {placeBidDialog?.mgtOrderNumber ? `Order #${placeBidDialog.mgtOrderNumber}` : placeBidDialog?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Service:</span>
                <span className="font-medium">{serviceName(placeBidDialog?.serviceId)}</span>
              </div>
              {placeBidDialog?.platform && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Platform:</span>
                  <span>{placeBidDialog.platform}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Due:</span>
                <span>{placeBidDialog?.orderDueDate ? new Date(placeBidDialog.orderDueDate).toLocaleDateString() : "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Complexity:</span>
                <span>{placeBidDialog?.complexity}/5</span>
              </div>
              <Badge className="bg-amber-500/20 text-amber-400 mt-1">Dashboard Order</Badge>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Your Bid Amount ($)</label>
              <Input type="number" step="0.01" min="0" value={placeBidAmount} onChange={(e) => setPlaceBidAmount(e.target.value)} placeholder="Enter your price" data-testid="input-place-bid-amount" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Timeline</label>
              <Input value={placeBidTimeline} onChange={(e) => setPlaceBidTimeline(e.target.value)} placeholder="e.g., 2 hours, 1 day" data-testid="input-place-bid-timeline" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Can Start</label>
              <Input value={placeBidCanStart} onChange={(e) => setPlaceBidCanStart(e.target.value)} placeholder="e.g., Immediately, 3:00 PM" data-testid="input-place-bid-can-start" />
            </div>
            <Button
              className={`w-full ${isElite ? "bg-gradient-to-r from-cyan-500 to-teal-500" : ""}`}
              disabled={!placeBidAmount || placeBidMutation.isPending}
              data-testid="button-submit-bid"
              onClick={() => {
                placeBidMutation.mutate({
                  orderId: placeBidDialog.id,
                  bidAmount: placeBidAmount,
                  timeline: placeBidTimeline || undefined,
                  canStart: placeBidCanStart || undefined,
                });
                setPlaceBidDialog(null);
                setPlaceBidAmount("");
                setPlaceBidTimeline("");
                setPlaceBidCanStart("");
              }}
            >
              {placeBidMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Gavel className="w-4 h-4 mr-2" />}
              Submit Bid
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  );
}
