import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { BiddingCountdownPanel, InlineCountdown } from "@/components/bidding-countdown";
import {
  Loader2, FileCheck, Gavel, TrendingUp, Clock, CheckCircle, AlertCircle,
  ExternalLink, X, DollarSign, Star, Zap, Send, CalendarClock,
  Award, Target, BarChart3, Lightbulb, Crown, ShieldCheck, Sparkles,
  Ban, Edit3, MessageSquare, Banknote, Bell, ArrowUpCircle, AlertOctagon, Eye
} from "lucide-react";

const BID_WAR_CHANNEL_ID = "1467912681670447140";
const GUILD_ID = "1466331568078458942";

function getDiscordMessageLink(channelId: string, messageId: string) {
  return `https://discord.com/channels/${GUILD_ID}/${channelId}/${messageId}`;
}

function getBidWarLink() {
  return `https://discord.com/channels/${GUILD_ID}/${BID_WAR_CHANNEL_ID}`;
}

export default function GrinderProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ["/api/grinder/me"],
  });

  const { data: services } = useQuery<any[]>({
    queryKey: ["/api/services"],
  });

  const [activeTab, setActiveTab] = useState("overview");
  const [updateDialog, setUpdateDialog] = useState<any>(null);
  const [editBidDialog, setEditBidDialog] = useState<any>(null);
  const [payoutDialog, setPayoutDialog] = useState<any>(null);
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateType, setUpdateType] = useState("progress");
  const [newDeadline, setNewDeadline] = useState("");
  const [editBidAmount, setEditBidAmount] = useState("");
  const [editTimeline, setEditTimeline] = useState("");
  const [editCanStart, setEditCanStart] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");

  const submitUpdateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/grinder/me/order-updates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinder/me"] });
      setUpdateDialog(null);
      setUpdateMessage("");
      setNewDeadline("");
      toast({ title: "Update submitted", description: "Staff has been notified." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const editBidMutation = useMutation({
    mutationFn: async ({ bidId, data }: { bidId: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/grinder/me/bids/${bidId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinder/me"] });
      setEditBidDialog(null);
      toast({ title: "Bid updated", description: "Your bid has been modified." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const requestPayoutMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/grinder/me/payout-requests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinder/me"] });
      setPayoutDialog(null);
      setPayoutAmount("");
      setPayoutNotes("");
      toast({ title: "Payout requested", description: "Staff will review your request." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const markCompleteMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await apiRequest("PATCH", `/api/grinder/me/assignments/${assignmentId}/complete`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinder/me"] });
      toast({ title: "Order marked complete", description: "You can now request payout." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const eliteRequestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/grinder/me/elite-request", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinder/me"] });
      toast({ title: "Elite request submitted", description: "Staff will review your request." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const markAlertReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const res = await apiRequest("POST", `/api/grinder/me/alerts/${alertId}/read`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinder/me"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const ackStrikeMutation = useMutation({
    mutationFn: async (strikeId: string) => {
      const res = await apiRequest("POST", `/api/grinder/me/strikes/${strikeId}/ack`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinder/me"] });
      toast({ title: "Strike acknowledged" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center" data-testid="text-no-profile">
        <AlertCircle className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-2xl font-display font-bold">No Grinder Profile Found</h2>
        <p className="text-muted-foreground max-w-md">
          Your Discord account isn't linked to a grinder profile yet. Submit a bid through the MGT Bot to get started.
        </p>
      </div>
    );
  }

  const { grinder, isElite, assignments, bids, availableOrders, lostBids, aiTips, orderUpdates, payoutRequests, strikeLogs, alerts, eliteRequests, eliteCoaching, unreadAlertCount, unackedStrikeCount } = profile;
  const stats = profile.stats || { totalAssignments: 0, activeAssignments: 0, completedAssignments: 0, totalBids: 0, pendingBids: 0, acceptedBids: 0, winRate: 0, totalEarned: 0, activeEarnings: 0, totalEarnings: 0 };
  const serviceName = (serviceId: string) => services?.find((s: any) => s.id === serviceId)?.name || serviceId;

  const eliteGradient = isElite ? "from-amber-500/20 via-yellow-500/10 to-orange-500/20" : "from-primary/10 via-primary/5 to-accent/10";
  const eliteBorder = isElite ? "border-amber-500/30" : "border-border/50";
  const eliteGlow = isElite ? "shadow-amber-500/10 shadow-lg" : "";
  const eliteAccent = isElite ? "text-amber-400" : "text-primary";

  return (
    <div className="space-y-6">
      <div className={`relative rounded-2xl bg-gradient-to-r ${eliteGradient} border ${eliteBorder} p-6 ${eliteGlow} overflow-hidden`}>
        {isElite && (
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
        )}
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative">
            <Avatar className={`h-20 w-20 border-2 ${isElite ? "border-amber-500/50 ring-2 ring-amber-400/20" : "border-primary/20"}`}>
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className={`${isElite ? "bg-amber-500/20 text-amber-400" : "bg-primary/20 text-primary"} text-2xl`}>
                {grinder.name?.charAt(0) || "G"}
              </AvatarFallback>
            </Avatar>
            {isElite && (
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Crown className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className={`text-3xl font-display font-bold ${isElite ? "bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent" : ""}`} data-testid="text-grinder-name">
                {grinder.name}
              </h1>
              {isElite && <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />}
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <Badge className={`${isElite ? "bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300 border-amber-500/30" : "border-primary/30 text-primary"}`} data-testid="text-grinder-tier">
                {isElite && <Crown className="w-3 h-3 mr-1" />}
                {grinder.tier || grinder.category || "Grinder"}
              </Badge>
              <Badge variant={grinder.activeOrders < grinder.capacity ? "default" : "secondary"}
                className={grinder.activeOrders < grinder.capacity ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"} data-testid="text-grinder-status">
                {grinder.activeOrders < grinder.capacity ? "Available" : "At Order Limit"}
              </Badge>
              {grinder.strikes > 0 && (
                <Badge variant="destructive" className="bg-red-500/20 text-red-400">
                  {grinder.strikes} Strike{grinder.strikes > 1 ? "s" : ""}
                </Badge>
              )}
              {unreadAlertCount > 0 && (
                <Badge className="bg-blue-500/20 text-blue-400 gap-1" data-testid="badge-unread-alerts">
                  <Bell className="w-3 h-3" /> {unreadAlertCount} Unread
                </Badge>
              )}
              {unackedStrikeCount > 0 && (
                <Badge className="bg-orange-500/20 text-orange-400 gap-1" data-testid="badge-unacked-strikes">
                  <AlertOctagon className="w-3 h-3" /> {unackedStrikeCount} New Strike{unackedStrikeCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-center">
              <p className={`text-2xl font-bold ${eliteAccent}`} data-testid="text-stat-win-rate">{stats.winRate}%</p>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
            <div className="w-px h-10 bg-border/50" />
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400" data-testid="text-stat-earned">${(stats.totalEarned || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Earned</p>
            </div>
            <div className="w-px h-10 bg-border/50" />
            <div className="text-center">
              <p className="text-2xl font-bold" data-testid="text-stat-completed">{stats.completedAssignments}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Active Orders", value: stats.activeAssignments, icon: Clock, color: "yellow" },
          { label: "Completed", value: stats.completedAssignments, icon: CheckCircle, color: "green" },
          { label: "Total Bids", value: stats.totalBids, icon: Gavel, color: "purple" },
          { label: "Pending Bids", value: stats.pendingBids, icon: Target, color: "blue" },
          { label: "Order Limit", value: `${grinder.activeOrders}/${grinder.capacity}`, icon: BarChart3, color: "cyan" },
        ].map((stat, i) => (
          <Card key={i} className={`glass-panel ${eliteBorder} ${isElite ? "hover:border-amber-500/40" : "hover:border-primary/30"} transition-all`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {aiTips.length > 0 && (
        <Card className={`${isElite ? "border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-transparent" : "border-blue-500/20 bg-blue-500/5"}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className={`w-5 h-5 ${isElite ? "text-amber-400" : "text-blue-400"}`} />
              <span className={`font-semibold ${isElite ? "text-amber-300" : "text-blue-300"}`}>
                {isElite ? "Elite AI Coach" : "AI Suggestions"}
              </span>
            </div>
            <div className="space-y-2">
              {aiTips.map((tip: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground" data-testid={`text-ai-tip-${i}`}>
                  <Sparkles className={`w-4 h-4 mt-0.5 shrink-0 ${isElite ? "text-amber-500" : "text-blue-500"}`} />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <BiddingCountdownPanel variant="compact" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-6 ${isElite ? "bg-amber-500/5" : "bg-muted/50"}`}>
          <TabsTrigger value="overview" data-testid="tab-overview" className={isElite ? "data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300" : ""}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="orders" data-testid="tab-orders" className={isElite ? "data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300" : ""}>
            Available Orders
          </TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments" className={isElite ? "data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300" : ""}>
            My Work
          </TabsTrigger>
          <TabsTrigger value="bids" data-testid="tab-bids" className={isElite ? "data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300" : ""}>
            My Bids
          </TabsTrigger>
          <TabsTrigger value="payouts" data-testid="tab-payouts" className={isElite ? "data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300" : ""}>
            Payouts
          </TabsTrigger>
          <TabsTrigger value="status" data-testid="tab-status" className={`relative ${isElite ? "data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300" : ""}`}>
            Status
            {(unreadAlertCount > 0 || unackedStrikeCount > 0) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className={`glass-panel ${eliteBorder}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className={`w-5 h-5 ${eliteAccent}`} />
                  Performance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-xl font-bold" data-testid="text-analytics-total-orders">{grinder.totalOrders}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                    <p className="text-xl font-bold text-green-400" data-testid="text-analytics-total-earned">${(stats.totalEarned || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Earnings</p>
                    <p className="text-xl font-bold text-yellow-400">${(stats.activeEarnings || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                    <p className="text-xl font-bold">{stats.winRate}%</p>
                  </div>
                </div>
                {grinder.avgQualityRating != null && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Quality Score</span>
                      <span className="font-medium">{Number(grinder.avgQualityRating).toFixed(1)}/5</span>
                    </div>
                    <Progress value={Number(grinder.avgQualityRating) / 5 * 100} className={`h-2 ${isElite ? "[&>div]:bg-amber-500" : ""}`} />
                  </div>
                )}
                {grinder.onTimeRate != null && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">On-Time Rate</span>
                      <span className="font-medium">{(Number(grinder.onTimeRate) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={Number(grinder.onTimeRate) * 100} className={`h-2 ${isElite ? "[&>div]:bg-amber-500" : ""}`} />
                  </div>
                )}
                {grinder.completionRate != null && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Completion Rate</span>
                      <span className="font-medium">{(Number(grinder.completionRate) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={Number(grinder.completionRate) * 100} className={`h-2 ${isElite ? "[&>div]:bg-amber-500" : ""}`} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={`glass-panel ${eliteBorder}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileCheck className={`w-5 h-5 ${eliteAccent}`} />
                  Recent Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No assignments yet. Start bidding on orders!</p>
                ) : (
                  <div className="space-y-3">
                    {assignments.slice(0, 5).map((a: any) => (
                      <div key={a.id} className={`flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 ${isElite ? "hover:border-amber-500/20" : "hover:border-primary/20"} transition-colors`} data-testid={`card-assignment-${a.id}`}>
                        <div>
                          <p className="text-sm font-medium">Order {a.orderId}</p>
                          <p className="text-xs text-muted-foreground">
                            Due: {a.dueDateTime ? new Date(a.dueDateTime).toLocaleDateString() : "TBD"}
                            {a.grinderEarnings && <span className="text-green-400 ml-2">${Number(a.grinderEarnings).toFixed(2)}</span>}
                          </p>
                        </div>
                        <Badge
                          className={a.status === "Active" ? "bg-green-500/20 text-green-400" : a.status === "Completed" ? "bg-blue-500/20 text-blue-400" : "bg-muted text-muted-foreground"}>
                          {a.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {lostBids.length > 0 && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-red-400">
                  <Ban className="w-5 h-5" />
                  Bids Not Selected ({lostBids.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lostBids.map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10" data-testid={`card-lost-bid-${b.id}`}>
                      <div className="flex items-center gap-3">
                        <X className="w-5 h-5 text-red-500" />
                        <div>
                          <p className="text-sm font-medium">Order {b.orderId}</p>
                          <p className="text-xs text-muted-foreground">Bid: ${b.bidAmount}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-red-500/30 text-red-400">Not Selected</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Zap className={`w-5 h-5 ${eliteAccent}`} />
              Available Orders ({availableOrders.length})
            </h2>
          </div>
          {availableOrders.length === 0 ? (
            <Card className={`glass-panel ${eliteBorder}`}>
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No open orders right now. Check back soon!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {availableOrders.map((order: any) => (
                <Card key={order.id} className={`glass-panel ${eliteBorder} ${isElite ? "hover:border-amber-500/30" : "hover:border-primary/30"} transition-all`} data-testid={`card-order-${order.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-lg">
                            {order.mgtOrderNumber ? `Order #${order.mgtOrderNumber}` : order.id}
                          </span>
                          <InlineCountdown biddingClosesAt={order.biddingClosesAt} />
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
                      <div className="flex items-center gap-2 ml-4">
                        {order.hasBid ? (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-500/20 text-blue-400">
                              Bid: ${order.myBidAmount}
                            </Badge>
                            {order.myBidStatus === "Pending" && (
                              <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">Pending</Badge>
                            )}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className={`gap-2 ${isElite ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white" : ""}`}
                            data-testid={`button-bid-${order.id}`}
                            onClick={() => {
                              const link = order.discordMessageId
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
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4 mt-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileCheck className={`w-5 h-5 ${eliteAccent}`} />
            My Assignments ({assignments.length})
          </h2>
          {assignments.length === 0 ? (
            <Card className={`glass-panel ${eliteBorder}`}>
              <CardContent className="p-8 text-center">
                <FileCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No assignments yet. Win a bid to get your first order!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {assignments.map((a: any) => (
                <Card key={a.id} className={`glass-panel ${eliteBorder}`} data-testid={`card-work-assignment-${a.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-bold text-lg">Order {a.orderId}</span>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span>Assigned: {new Date(a.assignedDateTime).toLocaleDateString()}</span>
                          <span>Due: {a.dueDateTime ? new Date(a.dueDateTime).toLocaleDateString() : "TBD"}</span>
                          {a.grinderEarnings && <span className="text-green-400">${Number(a.grinderEarnings).toFixed(2)}</span>}
                        </div>
                      </div>
                      <Badge className={a.status === "Active" ? "bg-green-500/20 text-green-400" : a.status === "Completed" ? "bg-blue-500/20 text-blue-400" : "bg-muted text-muted-foreground"}>
                        {a.status}
                      </Badge>
                    </div>
                    {a.status === "Active" && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button size="sm" variant="outline" className="gap-1 text-xs" data-testid={`button-update-${a.id}`}
                          onClick={() => { setUpdateDialog(a); setUpdateType("progress"); setUpdateMessage(""); setNewDeadline(""); }}>
                          <MessageSquare className="w-3 h-3" /> Submit Update
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 text-xs" data-testid={`button-deadline-${a.id}`}
                          onClick={() => { setUpdateDialog(a); setUpdateType("deadline"); setUpdateMessage(""); setNewDeadline(""); }}>
                          <CalendarClock className="w-3 h-3" /> Update Deadline
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 text-xs bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20" data-testid={`button-complete-${a.id}`}
                          onClick={() => markCompleteMutation.mutate(a.id)}>
                          <CheckCircle className="w-3 h-3" /> Mark Complete
                        </Button>
                      </div>
                    )}
                    {a.status === "Completed" && (
                      <div className="flex items-center gap-2">
                        {a.isOnTime !== null && (
                          <Badge className={a.isOnTime ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                            {a.isOnTime ? "On Time" : "Late"}
                          </Badge>
                        )}
                        {a.qualityRating && (
                          <Badge variant="outline" className="gap-1">
                            <Star className="w-3 h-3" /> {a.qualityRating}/5
                          </Badge>
                        )}
                        {!payoutRequests?.find((p: any) => p.assignmentId === a.id) && (
                          <Button size="sm" variant="outline" className="gap-1 text-xs bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 ml-auto" data-testid={`button-payout-${a.id}`}
                            onClick={() => { setPayoutDialog(a); setPayoutAmount(a.grinderEarnings || a.bidAmount || ""); setPayoutNotes(""); }}>
                            <Banknote className="w-3 h-3" /> Request Payout
                          </Button>
                        )}
                        {payoutRequests?.find((p: any) => p.assignmentId === a.id) && (
                          <Badge className="ml-auto bg-yellow-500/20 text-yellow-400">
                            Payout {payoutRequests.find((p: any) => p.assignmentId === a.id)?.status}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {orderUpdates && orderUpdates.length > 0 && (
            <Card className={`glass-panel ${eliteBorder} mt-6`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className={`w-5 h-5 ${eliteAccent}`} />
                  My Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orderUpdates.slice(0, 10).map((u: any) => (
                    <div key={u.id} className="p-3 rounded-lg bg-white/5 border border-white/10" data-testid={`card-update-${u.id}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Order {u.orderId}</span>
                        <span className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{u.message}</p>
                      {u.newDeadline && <p className="text-xs text-yellow-400 mt-1">New deadline: {new Date(u.newDeadline).toLocaleDateString()}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bids" className="space-y-4 mt-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Gavel className={`w-5 h-5 ${eliteAccent}`} />
            My Bids ({bids.length})
          </h2>
          {bids.length === 0 ? (
            <Card className={`glass-panel ${eliteBorder}`}>
              <CardContent className="p-8 text-center">
                <Gavel className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No bids yet. Check available orders to start bidding!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {bids.map((b: any) => {
                const isLost = lostBids.find((lb: any) => lb.id === b.id);
                return (
                  <Card key={b.id} className={`glass-panel ${isLost ? "border-red-500/20" : eliteBorder}`} data-testid={`card-bid-${b.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isLost && <X className="w-5 h-5 text-red-500" />}
                          <div>
                            <p className="font-medium">Order {b.orderId}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              <span>Bid: ${b.bidAmount}</span>
                              {b.timeline && <span>Timeline: {b.timeline}</span>}
                              {b.canStart && <span>Can Start: {b.canStart}</span>}
                              <span>{b.bidTime ? new Date(b.bidTime).toLocaleDateString() : ""}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            b.status === "Accepted" ? "bg-green-500/20 text-green-400" :
                            b.status === "Denied" ? "bg-red-500/20 text-red-400" :
                            isLost ? "bg-red-500/20 text-red-400" :
                            "bg-yellow-500/20 text-yellow-400"
                          }>
                            {isLost ? "Not Selected" : b.status}
                          </Badge>
                          {b.status === "Pending" && !isLost && (
                            <Button size="sm" variant="ghost" className="gap-1 text-xs" data-testid={`button-edit-bid-${b.id}`}
                              onClick={() => {
                                setEditBidDialog(b);
                                setEditBidAmount(b.bidAmount || "");
                                setEditTimeline(b.timeline || "");
                                setEditCanStart(b.canStart || "");
                              }}>
                              <Edit3 className="w-3 h-3" /> Edit
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4 mt-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Banknote className={`w-5 h-5 ${eliteAccent}`} />
            Payout Requests
          </h2>
          {(!payoutRequests || payoutRequests.length === 0) ? (
            <Card className={`glass-panel ${eliteBorder}`}>
              <CardContent className="p-8 text-center">
                <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No payout requests yet. Complete an order and request payout.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {payoutRequests.map((p: any) => (
                <Card key={p.id} className={`glass-panel ${eliteBorder}`} data-testid={`card-payout-${p.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Order {p.orderId}</p>
                        <p className="text-sm text-muted-foreground">
                          Amount: <span className="text-green-400 font-medium">${Number(p.amount).toFixed(2)}</span>
                          {p.notes && <span className="ml-2">- {p.notes}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleString()}</p>
                      </div>
                      <Badge className={
                        p.status === "Approved" ? "bg-green-500/20 text-green-400" :
                        p.status === "Denied" ? "bg-red-500/20 text-red-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }>
                        {p.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="status" className="space-y-6 mt-6">
          <Card className={`glass-panel ${eliteBorder}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className={`w-5 h-5 ${eliteAccent}`} />
                Alerts Inbox
                {unreadAlertCount > 0 && (
                  <Badge className="bg-blue-500/20 text-blue-400 ml-2">{unreadAlertCount} unread</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No alerts yet.</p>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert: any) => {
                    const severityColors: Record<string, string> = {
                      info: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                      warning: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
                      success: "text-green-400 bg-green-500/10 border-green-500/20",
                      danger: "text-red-400 bg-red-500/10 border-red-500/20",
                    };
                    const colors = severityColors[alert.severity] || severityColors.info;
                    return (
                      <div
                        key={alert.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${colors} cursor-pointer transition-opacity ${alert.isRead ? "opacity-60" : ""}`}
                        onClick={() => { if (!alert.isRead) markAlertReadMutation.mutate(alert.id); }}
                        data-testid={`card-alert-${alert.id}`}
                      >
                        {!alert.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />}
                        {alert.isRead && <Eye className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{alert.title}</span>
                            <Badge variant="outline" className={`text-xs ${colors}`}>{alert.severity}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(alert.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`glass-panel ${eliteBorder}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertOctagon className={`w-5 h-5 ${grinder.strikes > 0 ? "text-red-400" : eliteAccent}`} />
                Strike History
                <div className="flex items-center gap-1 ml-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span
                      key={i}
                      className={`w-3 h-3 rounded-full ${i < (grinder.strikes || 0) ? "bg-red-500" : "bg-muted"}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground ml-1">({grinder.strikes || 0}/3)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {strikeLogs.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No strike history. Keep it up!</p>
              ) : (
                <div className="space-y-2">
                  {strikeLogs.map((log: any) => (
                    <div key={log.id} className={`flex items-start justify-between gap-3 p-3 rounded-lg border ${log.delta > 0 ? "bg-red-500/5 border-red-500/20" : "bg-green-500/5 border-green-500/20"}`} data-testid={`card-strike-${log.id}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={log.delta > 0 ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}>
                            {log.action} ({log.delta > 0 ? "+" : ""}{log.delta})
                          </Badge>
                          {!log.acknowledgedAt && (
                            <Badge className="bg-orange-500/20 text-orange-400">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{log.reason}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.createdAt).toLocaleString()} — Resulting strikes: {log.resultingStrikes}
                        </p>
                      </div>
                      {!log.acknowledgedAt && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 gap-1"
                          disabled={ackStrikeMutation.isPending}
                          onClick={() => ackStrikeMutation.mutate(log.id)}
                          data-testid={`button-ack-strike-${log.id}`}
                        >
                          <CheckCircle className="w-3 h-3" /> Acknowledge
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`glass-panel ${isElite ? "border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-transparent" : eliteBorder}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Crown className={`w-5 h-5 ${isElite ? "text-amber-400" : eliteAccent}`} />
                {isElite ? "Elite Status" : "Elite Path Coaching"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isElite ? (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-amber-300 text-lg">Elite Status Active</p>
                    <p className="text-sm text-muted-foreground">You have access to elite-tier orders and priority bidding.</p>
                  </div>
                  <Sparkles className="w-6 h-6 text-amber-400 ml-auto animate-pulse" />
                </div>
              ) : (
                <>
                  {eliteCoaching && (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={
                          eliteCoaching.readiness === "ready" ? "bg-green-500/20 text-green-400" :
                          eliteCoaching.readiness === "close" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-blue-500/20 text-blue-400"
                        } data-testid="badge-readiness">
                          {eliteCoaching.readiness === "ready" ? "Ready for Elite" :
                           eliteCoaching.readiness === "close" ? "Almost There" :
                           "Developing"}
                        </Badge>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/50">
                              <th className="text-left py-2 text-muted-foreground font-medium">Metric</th>
                              <th className="text-right py-2 text-muted-foreground font-medium">Yours</th>
                              <th className="text-right py-2 text-muted-foreground font-medium">Elite Avg</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { label: "Win Rate", yours: `${eliteCoaching.yourMetrics.winRate}%`, elite: `${eliteCoaching.eliteAverages.winRate}%`, good: eliteCoaching.yourMetrics.winRate >= eliteCoaching.eliteAverages.winRate },
                              { label: "Quality", yours: `${eliteCoaching.yourMetrics.quality}/5`, elite: `${eliteCoaching.eliteAverages.quality}/5`, good: eliteCoaching.yourMetrics.quality >= eliteCoaching.eliteAverages.quality },
                              { label: "On-Time", yours: `${(eliteCoaching.yourMetrics.onTime * 100).toFixed(0)}%`, elite: `${(eliteCoaching.eliteAverages.onTime * 100).toFixed(0)}%`, good: eliteCoaching.yourMetrics.onTime >= eliteCoaching.eliteAverages.onTime },
                              { label: "Completion", yours: `${(eliteCoaching.yourMetrics.completion * 100).toFixed(0)}%`, elite: `${(eliteCoaching.eliteAverages.completion * 100).toFixed(0)}%`, good: eliteCoaching.yourMetrics.completion >= eliteCoaching.eliteAverages.completion },
                              { label: "Turnaround", yours: `${eliteCoaching.yourMetrics.turnaround}h`, elite: `${eliteCoaching.eliteAverages.turnaround}h`, good: eliteCoaching.yourMetrics.turnaround <= eliteCoaching.eliteAverages.turnaround },
                              { label: "Completed", yours: String(eliteCoaching.yourMetrics.completed), elite: String(eliteCoaching.eliteAverages.completed), good: eliteCoaching.yourMetrics.completed >= eliteCoaching.eliteAverages.completed },
                              { label: "Strikes", yours: String(eliteCoaching.yourMetrics.strikes), elite: "0", good: eliteCoaching.yourMetrics.strikes === 0 },
                            ].map((row) => (
                              <tr key={row.label} className="border-b border-border/30">
                                <td className="py-2">{row.label}</td>
                                <td className={`py-2 text-right font-medium ${row.good ? "text-green-400" : "text-red-400"}`}>{row.yours}</td>
                                <td className="py-2 text-right text-muted-foreground">{row.elite}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {eliteCoaching.tips.length > 0 && (
                        <div className="space-y-2 mt-4">
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-blue-400" /> Tips to Reach Elite
                          </p>
                          {eliteCoaching.tips.map((tip: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground" data-testid={`text-elite-tip-${i}`}>
                              <ArrowUpCircle className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  <Button
                    className={`w-full gap-2 ${isElite ? "" : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"}`}
                    disabled={eliteRequestMutation.isPending || eliteRequests.some((r: any) => r.status === "Pending")}
                    onClick={() => eliteRequestMutation.mutate()}
                    data-testid="button-request-elite"
                  >
                    {eliteRequestMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Crown className="w-4 h-4" />
                    )}
                    {eliteRequests.some((r: any) => r.status === "Pending") ? "Elite Request Pending" : "Request Elite Status"}
                  </Button>
                </>
              )}

              {eliteRequests.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2 text-muted-foreground">Request History</p>
                  <div className="space-y-2">
                    {eliteRequests.map((req: any) => (
                      <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10" data-testid={`card-elite-request-${req.id}`}>
                        <div>
                          <p className="text-sm">{new Date(req.requestedAt).toLocaleDateString()}</p>
                          {req.decisionNotes && <p className="text-xs text-muted-foreground mt-1">{req.decisionNotes}</p>}
                        </div>
                        <Badge className={
                          req.status === "Approved" ? "bg-green-500/20 text-green-400" :
                          req.status === "Denied" ? "bg-red-500/20 text-red-400" :
                          "bg-yellow-500/20 text-yellow-400"
                        }>
                          {req.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!updateDialog} onOpenChange={(open) => !open && setUpdateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {updateType === "deadline" ? "Update Deadline" : "Submit Order Update"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Order: {updateDialog?.orderId}</label>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Message</label>
              <Textarea
                value={updateMessage}
                onChange={(e) => setUpdateMessage(e.target.value)}
                placeholder={updateType === "deadline" ? "Reason for deadline change..." : "Progress update..."}
                data-testid="input-update-message"
              />
            </div>
            {updateType === "deadline" && (
              <div>
                <label className="text-sm font-medium mb-1 block">New Deadline</label>
                <Input type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} data-testid="input-new-deadline" />
              </div>
            )}
            <Button className="w-full" data-testid="button-submit-update"
              disabled={!updateMessage || submitUpdateMutation.isPending}
              onClick={() => {
                submitUpdateMutation.mutate({
                  assignmentId: updateDialog.id,
                  orderId: updateDialog.orderId,
                  updateType,
                  message: updateMessage,
                  newDeadline: newDeadline || undefined,
                });
              }}>
              {submitUpdateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editBidDialog} onOpenChange={(open) => !open && setEditBidDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bid - Order {editBidDialog?.orderId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Bid Amount ($)</label>
              <Input type="number" value={editBidAmount} onChange={(e) => setEditBidAmount(e.target.value)} data-testid="input-edit-bid-amount" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Timeline</label>
              <Input value={editTimeline} onChange={(e) => setEditTimeline(e.target.value)} placeholder="e.g., 3 days" data-testid="input-edit-timeline" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Can Start</label>
              <Input value={editCanStart} onChange={(e) => setEditCanStart(e.target.value)} placeholder="e.g., Immediately" data-testid="input-edit-can-start" />
            </div>
            <Button className="w-full" data-testid="button-save-bid"
              disabled={editBidMutation.isPending}
              onClick={() => {
                const data: any = {};
                if (editBidAmount) data.bidAmount = editBidAmount;
                if (editTimeline) data.timeline = editTimeline;
                if (editCanStart) data.canStart = editCanStart;
                editBidMutation.mutate({ bidId: editBidDialog.id, data });
              }}>
              {editBidMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!payoutDialog} onOpenChange={(open) => !open && setPayoutDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Payout - Order {payoutDialog?.orderId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Payout Amount ($)</label>
              <Input type="number" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} data-testid="input-payout-amount" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes (optional)</label>
              <Textarea value={payoutNotes} onChange={(e) => setPayoutNotes(e.target.value)} placeholder="Any notes for staff..." data-testid="input-payout-notes" />
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700" data-testid="button-submit-payout"
              disabled={!payoutAmount || requestPayoutMutation.isPending}
              onClick={() => {
                requestPayoutMutation.mutate({
                  assignmentId: payoutDialog.id,
                  orderId: payoutDialog.orderId,
                  amount: payoutAmount,
                  notes: payoutNotes || undefined,
                });
              }}>
              {requestPayoutMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Banknote className="w-4 h-4 mr-2" />}
              Request Payout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
