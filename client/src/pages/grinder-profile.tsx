import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { PAYOUT_PLATFORMS } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BiddingCountdownPanel, InlineCountdown } from "@/components/bidding-countdown";
import {
  Loader2, FileCheck, Gavel, TrendingUp, Clock, CheckCircle, AlertCircle,
  ExternalLink, X, DollarSign, Star, Zap, Send, CalendarClock,
  Award, Target, BarChart3, Lightbulb, Crown, ShieldCheck, Sparkles,
  Ban, Edit3, MessageSquare, Banknote, Bell, ArrowUpCircle, AlertOctagon, Eye,
  Signal, ScrollText
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
  const [payoutPlatform, setPayoutPlatform] = useState("");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [savePayoutMethod, setSavePayoutMethod] = useState(true);
  const [availStatus, setAvailStatus] = useState("available");
  const [availNote, setAvailNote] = useState("");
  const [placeBidDialog, setPlaceBidDialog] = useState<any>(null);
  const [placeBidAmount, setPlaceBidAmount] = useState("");
  const [placeBidTimeline, setPlaceBidTimeline] = useState("");
  const [placeBidCanStart, setPlaceBidCanStart] = useState("");

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
      setPayoutPlatform("");
      setPayoutDetails("");
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

  const placeBidMutation = useMutation({
    mutationFn: async (data: { orderId: string; bidAmount: string; timeline?: string; canStart?: string }) => {
      const res = await apiRequest("POST", "/api/grinder/me/bids", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinder/me"] });
      setPlaceBidDialog(null);
      setPlaceBidAmount("");
      setPlaceBidTimeline("");
      setPlaceBidCanStart("");
      toast({ title: "Bid submitted!", description: "Staff will review your bid." });
    },
    onError: (e: any) => toast({ title: "Bid failed", description: e.message, variant: "destructive" }),
  });

  const availabilityMutation = useMutation({
    mutationFn: async (data: { status: string; note: string }) => {
      const res = await apiRequest("PATCH", "/api/grinder/me/availability", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinder/me"] });
      toast({ title: "Availability updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (profile?.grinder) {
      setAvailStatus(profile.grinder.availabilityStatus || "available");
      setAvailNote(profile.grinder.availabilityNote || "");
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#5865F2]/15 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#5865F2]" />
          </div>
          <p className="text-sm text-white/40 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4 sm:space-y-6" data-testid="text-no-profile">
        <div className="relative rounded-2xl bg-gradient-to-r from-[#5865F2]/20 via-[#5865F2]/10 to-[#5865F2]/5 border border-[#5865F2]/30 p-4 sm:p-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#5865F2]/20 border-2 border-[#5865F2]/40 flex items-center justify-center">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-[#5865F2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-display font-bold" data-testid="text-welcome-title">Welcome to GrindOps</h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">Your grinder profile hasn't been created yet. Here's how to get started and what your dashboard will look like.</p>
            </div>
          </div>
        </div>

        <div className="relative rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-amber-500/5 p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Target className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-400" data-testid="text-get-started-title">How to Get Started</h2>
              <p className="text-muted-foreground text-sm mt-1 mb-4">Follow these steps to create your grinder profile and start receiving orders:</p>
              <div className="space-y-3">
                {[
                  { step: 1, icon: ExternalLink, title: "Join the Discord Server", desc: "Make sure you have the Grinder role in the Discord server. If you don't have it, ask a staff member to assign it." },
                  { step: 2, icon: Eye, title: "Watch the Bid War Channel", desc: "New orders are posted in the Bid War channel. Keep an eye out for orders that match your skills and availability." },
                  { step: 3, icon: Gavel, title: "Submit Your First Bid", desc: "When you see an order you want, submit a bid through the MGT Bot in the Bid Proposals channel. This automatically creates your grinder profile." },
                  { step: 4, icon: CheckCircle, title: "Get Assigned & Start Working", desc: "Once staff accepts your bid, you'll be assigned the order. Track progress, submit updates, and request payouts right from this dashboard." },
                ].map(({ step, icon: StepIcon, title, desc }) => (
                  <div key={step} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-400 text-sm font-bold">{step}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <StepIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span className="font-semibold text-sm">{title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#5865F2]" />
            Dashboard Preview
          </h2>
          <p className="text-muted-foreground text-sm mb-4">Once your profile is created, your dashboard will include all of these features:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: BarChart3, title: "Performance Stats", desc: "Track your win rate, completed orders, and earnings over time.", color: "from-blue-500/10 to-blue-500/5 border-blue-500/20", iconColor: "text-blue-400" },
              { icon: FileCheck, title: "Available Orders", desc: "Browse open orders and submit competitive bids to win work.", color: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20", iconColor: "text-emerald-400" },
              { icon: Gavel, title: "Bid Management", desc: "View, edit, and track all your pending and past bids.", color: "from-purple-500/10 to-purple-500/5 border-purple-500/20", iconColor: "text-purple-400" },
              { icon: Clock, title: "Active Assignments", desc: "Manage your current orders with progress updates and deadlines.", color: "from-orange-500/10 to-orange-500/5 border-orange-500/20", iconColor: "text-orange-400" },
              { icon: DollarSign, title: "Payout Tracking", desc: "Request payouts for completed work and track payment history.", color: "from-green-500/10 to-green-500/5 border-green-500/20", iconColor: "text-green-400" },
              { icon: Lightbulb, title: "AI Coaching", desc: "Get personalized tips to improve your performance and win more bids.", color: "from-yellow-500/10 to-yellow-500/5 border-yellow-500/20", iconColor: "text-yellow-400" },
              { icon: Crown, title: "Elite Path", desc: "Track your progress toward Elite Grinder status with better order limits.", color: "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20", iconColor: "text-cyan-400" },
              { icon: Bell, title: "Alerts & Notifications", desc: "Receive staff announcements and important updates in real time.", color: "from-pink-500/10 to-pink-500/5 border-pink-500/20", iconColor: "text-pink-400" },
              { icon: Signal, title: "Availability Status", desc: "Set your availability so staff knows when you're ready for work.", color: "from-indigo-500/10 to-indigo-500/5 border-indigo-500/20", iconColor: "text-indigo-400" },
            ].map(({ icon: CardIcon, title, desc, color, iconColor }) => (
              <Card key={title} className={`bg-gradient-to-br ${color} opacity-80`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0`}>
                      <CardIcon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="border-[#5865F2]/20 bg-[#5865F2]/5">
          <CardContent className="p-4 sm:p-6 text-center">
            <Zap className="w-8 h-8 text-[#5865F2] mx-auto mb-2" />
            <p className="font-semibold">Ready to get started?</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Head over to Discord and submit your first bid to unlock your full dashboard.</p>
            <a href={getBidWarLink()} target="_blank" rel="noopener noreferrer">
              <Button className="bg-[#5865F2]" data-testid="button-go-to-discord">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Bid War Channel
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { grinder, isElite, assignments, bids, availableOrders, lostBids, aiTips, orderUpdates, payoutRequests, payoutMethods, strikeLogs, alerts, eliteRequests, eliteCoaching, unreadAlertCount, unackedStrikeCount } = profile;
  const stats = profile.stats || { totalAssignments: 0, activeAssignments: 0, completedAssignments: 0, totalBids: 0, pendingBids: 0, acceptedBids: 0, winRate: 0, totalEarned: 0, activeEarnings: 0, totalEarnings: 0 };
  const serviceName = (serviceId: string) => services?.find((s: any) => s.id === serviceId)?.name || serviceId;
  const eliteGradient = isElite ? "from-cyan-500/20 via-cyan-500/10 to-teal-500/20" : "from-[#5865F2]/20 via-[#5865F2]/10 to-[#5865F2]/5";
  const eliteBorder = isElite ? "border-cyan-500/30" : "border-[#5865F2]/30";
  const eliteGlow = isElite ? "shadow-cyan-500/10 shadow-lg" : "";
  const eliteAccent = isElite ? "text-cyan-400" : "text-[#5865F2]";

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className={`relative rounded-2xl bg-gradient-to-r ${eliteGradient} border ${eliteBorder} p-4 sm:p-6 ${eliteGlow} overflow-hidden`}>
        {isElite && (
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/5 rounded-full blur-3xl pointer-events-none" />
        )}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 relative z-10">
          <div className="relative">
            <Avatar className={`h-14 w-14 sm:h-20 sm:w-20 border-2 ${isElite ? "border-cyan-500/50 ring-2 ring-cyan-400/20" : "border-[#5865F2]/30"}`}>
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className={`${isElite ? "bg-cyan-500/20 text-cyan-400" : "bg-[#5865F2]/20 text-[#5865F2]"} text-2xl`}>
                {grinder.name?.charAt(0) || "G"}
              </AvatarFallback>
            </Avatar>
            {isElite && (
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg">
                <Crown className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className={`text-xl sm:text-3xl font-display font-bold ${isElite ? "bg-gradient-to-r from-cyan-300 to-teal-400 bg-clip-text text-transparent" : ""}`} data-testid="text-grinder-name">
                {grinder.name}
              </h1>
              {isElite && <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />}
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {(grinder.roles && grinder.roles.length > 0 ? grinder.roles : [grinder.category || (isElite ? "Elite Grinder" : "Grinder")]).map((role: string) => (
                <Badge key={role} className={`${role === "Elite Grinder" ? "bg-gradient-to-r from-cyan-500/30 to-teal-500/30 text-cyan-300 border-cyan-500/30" : role === "VC Grinder" ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" : role === "Event Grinder" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "border-[#5865F2]/30 text-[#5865F2]"}`} data-testid={`badge-role-${role.toLowerCase().replace(/\s/g, "-")}`}>
                  {role === "Elite Grinder" && <Crown className="w-3 h-3 mr-1" />}
                  {role}
                </Badge>
              ))}
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

      {!grinder.rulesAccepted && (
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
                  Read the rules below and click "I Accept" to continue.
                </p>
              </div>
            </div>
            <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs font-medium text-muted-foreground mb-2">📜 Grinder Rules & Guidelines</p>
              <p className="text-xs text-muted-foreground mb-2">By working as a grinder, you agree to:</p>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p><span className="text-amber-400 font-bold">1️⃣</span> <span className="font-medium">Privacy</span> — Never discuss customer prices with anyone</p>
                <p><span className="text-amber-400 font-bold">2️⃣</span> <span className="font-medium">Quality</span> — Complete all orders to the highest standard</p>
                <p><span className="text-amber-400 font-bold">3️⃣</span> <span className="font-medium">Communication</span> — Stay responsive during active orders</p>
                <p><span className="text-amber-400 font-bold">4️⃣</span> <span className="font-medium">Honesty</span> — Only bid on orders you can realistically complete</p>
                <p><span className="text-amber-400 font-bold">5️⃣</span> <span className="font-medium">Timeliness</span> — Meet your quoted timelines</p>
                <p><span className="text-amber-400 font-bold">6️⃣</span> <span className="font-medium">Professionalism</span> — Represent the team professionally</p>
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
      )}

      {grinder.suspended && (
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
                  You cannot place bids or accept orders until all fines are paid. Contact staff to arrange payment.
                </p>
              </div>
            </div>
            <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs font-medium text-muted-foreground mb-1">Strike Fine Policy</p>
              <div className="flex gap-4 text-xs">
                <span className={grinder.strikes >= 1 ? "text-red-400 font-bold" : "text-muted-foreground"}>Strike 1: $25</span>
                <span className={grinder.strikes >= 2 ? "text-red-400 font-bold" : "text-muted-foreground"}>Strike 2: $50</span>
                <span className={grinder.strikes >= 3 ? "text-red-400 font-bold" : "text-muted-foreground"}>Strike 3: $100</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            {grinder.availabilityUpdatedAt && (
              <span className="text-[10px] text-muted-foreground">
                Updated {new Date(grinder.availabilityUpdatedAt).toLocaleString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

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

      {aiTips.length > 0 && (
        <Card className={`border-0 overflow-hidden relative ${isElite ? "bg-gradient-to-r from-cyan-500/[0.08] via-background to-teal-500/[0.04]" : "bg-gradient-to-r from-blue-500/[0.08] via-background to-indigo-500/[0.04]"}`}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/[0.02] -translate-y-10 translate-x-10" />
          <CardContent className="p-4 sm:p-5 relative">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-blue-500/15"} flex items-center justify-center`}>
                <Lightbulb className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-blue-400"}`} />
              </div>
              <span className={`font-semibold ${isElite ? "text-cyan-300" : "text-blue-300"}`}>
                {isElite ? "Elite AI Coach" : "AI Suggestions"}
              </span>
            </div>
            <div className="space-y-2.5">
              {aiTips.map((tip: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-white/60 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]" data-testid={`text-ai-tip-${i}`}>
                  <Sparkles className={`w-4 h-4 mt-0.5 shrink-0 ${isElite ? "text-cyan-500" : "text-blue-500"}`} />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <BiddingCountdownPanel variant="compact" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`flex w-full overflow-x-auto ${isElite ? "bg-cyan-500/5" : "bg-muted/50"}`}>
          <TabsTrigger value="overview" data-testid="tab-overview" className={`flex-shrink-0 text-xs sm:text-sm ${isElite ? "data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300" : ""}`}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="orders" data-testid="tab-orders" className={`flex-shrink-0 text-xs sm:text-sm ${isElite ? "data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300" : ""}`}>
            Available Orders
          </TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments" className={`flex-shrink-0 text-xs sm:text-sm ${isElite ? "data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300" : ""}`}>
            My Work
          </TabsTrigger>
          <TabsTrigger value="bids" data-testid="tab-bids" className={`flex-shrink-0 text-xs sm:text-sm ${isElite ? "data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300" : ""}`}>
            My Bids
          </TabsTrigger>
          <TabsTrigger value="payouts" data-testid="tab-payouts" className={`flex-shrink-0 text-xs sm:text-sm ${isElite ? "data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300" : ""}`}>
            Payouts
          </TabsTrigger>
          <TabsTrigger value="status" data-testid="tab-status" className={`flex-shrink-0 text-xs sm:text-sm relative ${isElite ? "data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300" : ""}`}>
            Status
            {(unreadAlertCount > 0 || unackedStrikeCount > 0) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="guide" data-testid="tab-guide" className={`flex-shrink-0 text-xs sm:text-sm ${isElite ? "data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300" : ""}`}>
            Guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
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
        </TabsContent>

        <TabsContent value="orders" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-amber-500/15"} flex items-center justify-center`}>
                <Zap className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
              </div>
              Available Orders
              <Badge className="border-0 bg-white/[0.06] text-white/60 text-xs">{availableOrders.length}</Badge>
            </h2>
          </div>
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
            <div className="grid gap-4">
              {availableOrders.map((order: any) => (
                <Card key={order.id} className={`border-0 bg-white/[0.03] ${isElite ? "sm:hover:bg-cyan-500/[0.05]" : "sm:hover:bg-[#5865F2]/[0.05]"} transition-all duration-200`} data-testid={`card-order-${order.id}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-bold text-lg">
                            {order.mgtOrderNumber ? `Order #${order.mgtOrderNumber}` : order.id}
                          </span>
                          <InlineCountdown biddingClosesAt={order.biddingClosesAt} />
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
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-emerald-500/15"} flex items-center justify-center`}>
              <FileCheck className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-emerald-400"}`} />
            </div>
            My Assignments
            <Badge className="border-0 bg-white/[0.06] text-white/60 text-xs">{assignments.length}</Badge>
          </h2>
          {assignments.length === 0 ? (
            <Card className="border-0 bg-white/[0.03]">
              <CardContent className="p-8 sm:p-12 text-center">
                <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
                  <FileCheck className="w-7 h-7 text-white/20" />
                </div>
                <p className="text-white/40">No assignments yet. Win a bid to get your first order!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {assignments.map((a: any) => (
                <Card key={a.id} className="border-0 bg-white/[0.03] sm:hover:bg-white/[0.05] transition-all duration-200" data-testid={`card-work-assignment-${a.id}`}>
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <span className="font-bold text-lg">Order {a.orderId}</span>
                        <div className="flex items-center gap-3 mt-1 text-sm text-white/40 flex-wrap">
                          <span>Assigned: {new Date(a.assignedDateTime).toLocaleDateString()}</span>
                          <span>Due: {a.dueDateTime ? new Date(a.dueDateTime).toLocaleDateString() : "TBD"}</span>
                          {a.deliveredDateTime && <span>Completed: {new Date(a.deliveredDateTime).toLocaleDateString()}</span>}
                          {a.grinderEarnings && <span className="text-emerald-400 font-medium">${Number(a.grinderEarnings).toFixed(2)}</span>}
                        </div>
                      </div>
                      <Badge className={a.status === "Active" ? "bg-emerald-500/20 text-emerald-400 border-0" : a.status === "Completed" ? "bg-blue-500/20 text-blue-400 border-0" : "bg-white/[0.06] text-white/40 border-0"}>
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
                            onClick={() => {
                              setPayoutDialog(a);
                              setPayoutAmount(String(Number(a.grinderEarnings || a.bidAmount || 0).toFixed(2)));
                              setPayoutNotes("");
                              const defaultMethod = payoutMethods?.find((m: any) => m.isDefault) || payoutMethods?.[0];
                              if (defaultMethod) { setPayoutPlatform(defaultMethod.platform); setPayoutDetails(defaultMethod.details); setSavePayoutMethod(false); }
                              else { setPayoutPlatform(""); setPayoutDetails(""); setSavePayoutMethod(true); }
                            }}>
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
            <Card className="border-0 bg-white/[0.03] mt-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-blue-500/15"} flex items-center justify-center`}>
                    <MessageSquare className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-blue-400"}`} />
                  </div>
                  My Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {orderUpdates.slice(0, 10).map((u: any) => (
                    <div key={u.id} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]" data-testid={`card-update-${u.id}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Order {u.orderId}</span>
                        <span className="text-xs text-white/30">{new Date(u.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-white/50">{u.message}</p>
                      {u.newDeadline && <p className="text-xs text-yellow-400 mt-1">New deadline: {new Date(u.newDeadline).toLocaleDateString()}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bids" className="space-y-4 mt-6">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-purple-500/15"} flex items-center justify-center`}>
              <Gavel className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-purple-400"}`} />
            </div>
            My Bids
            <Badge className="border-0 bg-white/[0.06] text-white/60 text-xs">{bids.length}</Badge>
          </h2>
          {bids.length === 0 ? (
            <Card className="border-0 bg-white/[0.03]">
              <CardContent className="p-8 sm:p-12 text-center">
                <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
                  <Gavel className="w-7 h-7 text-white/20" />
                </div>
                <p className="text-white/40">No bids yet. Check available orders to start bidding!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {bids.map((b: any) => {
                const isLost = lostBids.find((lb: any) => lb.id === b.id);
                return (
                  <Card key={b.id} className={`border-0 ${isLost ? "bg-gradient-to-r from-red-500/[0.04] to-transparent" : "bg-white/[0.03]"} sm:hover:bg-white/[0.05] transition-all duration-200`} data-testid={`card-bid-${b.id}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          {isLost && (
                            <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                              <X className="w-4 h-4 text-red-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">Order {b.orderId}</p>
                            <div className="flex items-center gap-3 text-sm text-white/40 mt-1 flex-wrap">
                              <span className="font-medium text-white/60">Bid: ${b.bidAmount}</span>
                              {b.timeline && <span>Timeline: {b.timeline}</span>}
                              {b.canStart && <span>Can Start: {b.canStart}</span>}
                              <span>{b.bidTime ? new Date(b.bidTime).toLocaleDateString() : ""}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`border-0 ${
                            b.status === "Accepted" ? "bg-emerald-500/20 text-emerald-400" :
                            b.status === "Denied" ? "bg-red-500/20 text-red-400" :
                            b.status === "Order Assigned" ? "bg-red-500/20 text-red-400" :
                            isLost ? "bg-red-500/20 text-red-400" :
                            "bg-yellow-500/20 text-yellow-400"
                          }`}>
                            {b.status === "Order Assigned" ? "Order Assigned" : isLost ? "Not Selected" : b.status}
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
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-emerald-500/15"} flex items-center justify-center`}>
              <Banknote className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-emerald-400"}`} />
            </div>
            Payout Requests
          </h2>
          {(!payoutRequests || payoutRequests.length === 0) ? (
            <Card className="border-0 bg-white/[0.03]">
              <CardContent className="p-8 sm:p-12 text-center">
                <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-7 h-7 text-white/20" />
                </div>
                <p className="text-white/40">No payout requests yet. Complete an order and request payout.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {payoutRequests.map((p: any) => (
                <Card key={p.id} className="border-0 bg-white/[0.03] sm:hover:bg-white/[0.05] transition-all duration-200" data-testid={`card-payout-${p.id}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">Order {p.orderId}</p>
                        <p className="text-sm text-white/50">
                          Amount: <span className="text-emerald-400 font-medium">${Number(p.amount).toFixed(2)}</span>
                          {p.payoutPlatform && <span className="ml-2">via {p.payoutPlatform}</span>}
                        </p>
                        {p.notes && <p className="text-xs text-white/40">{p.notes}</p>}
                        <p className="text-xs text-white/30">{new Date(p.createdAt).toLocaleString()}</p>
                      </div>
                      <Badge className={`border-0 ${
                        p.status === "Paid" ? "bg-emerald-500/20 text-emerald-400" :
                        p.status === "Approved" ? "bg-blue-500/20 text-blue-400" :
                        p.status === "Denied" ? "bg-red-500/20 text-red-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>
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
          <Card className="border-0 bg-white/[0.03] overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-blue-500/15"} flex items-center justify-center`}>
                  <Bell className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-blue-400"}`} />
                </div>
                Alerts Inbox
                {unreadAlertCount > 0 && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-0 ml-2">{unreadAlertCount} unread</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6 text-white/20" />
                  </div>
                  <p className="text-white/40 text-sm">No alerts yet.</p>
                </div>
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

          <Card className="border-0 bg-white/[0.03] overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className={`w-9 h-9 rounded-xl ${grinder.strikes > 0 ? "bg-red-500/15" : isElite ? "bg-cyan-500/15" : "bg-[#5865F2]/15"} flex items-center justify-center`}>
                  <AlertOctagon className={`w-5 h-5 ${grinder.strikes > 0 ? "text-red-400" : eliteAccent}`} />
                </div>
                Strike History
                <div className="flex items-center gap-1 ml-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span
                      key={i}
                      className={`w-3 h-3 rounded-full ${i < (grinder.strikes || 0) ? "bg-red-500" : "bg-white/[0.1]"}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-white/40 ml-1">({grinder.strikes || 0}/3)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {strikeLogs.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-emerald-400/40" />
                  </div>
                  <p className="text-white/40 text-sm">No strike history. Keep it up!</p>
                </div>
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
                        {parseFloat(log.fineAmount || "0") > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={log.finePaid ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                              <DollarSign className="w-3 h-3 mr-0.5" />
                              {log.finePaid ? "Paid" : "Unpaid"}: ${parseFloat(log.fineAmount).toFixed(2)}
                            </Badge>
                          </div>
                        )}
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

          <Card className={`border-0 overflow-hidden relative ${isElite ? "bg-gradient-to-r from-cyan-500/[0.08] via-background to-teal-500/[0.04]" : "bg-white/[0.03]"}`}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-amber-500/15"} flex items-center justify-center`}>
                  <Crown className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
                </div>
                {isElite ? "Elite Status" : "Elite Grinder Role"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isElite ? (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/20">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-cyan-300 text-lg">Elite Status Active</p>
                    <p className="text-sm text-muted-foreground">You have access to elite-tier orders and priority bidding.</p>
                  </div>
                  <Sparkles className="w-6 h-6 text-cyan-400 ml-auto animate-pulse" />
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
                              { label: "Quality", yours: `${(Number(eliteCoaching.yourMetrics.quality) / 20).toFixed(1)}/5`, elite: `${(Number(eliteCoaching.eliteAverages.quality) / 20).toFixed(1)}/5`, good: eliteCoaching.yourMetrics.quality >= eliteCoaching.eliteAverages.quality },
                              { label: "On-Time", yours: `${Number(eliteCoaching.yourMetrics.onTime).toFixed(0)}%`, elite: `${Number(eliteCoaching.eliteAverages.onTime).toFixed(0)}%`, good: eliteCoaching.yourMetrics.onTime >= eliteCoaching.eliteAverages.onTime },
                              { label: "Completion", yours: `${Number(eliteCoaching.yourMetrics.completion).toFixed(0)}%`, elite: `${Number(eliteCoaching.eliteAverages.completion).toFixed(0)}%`, good: eliteCoaching.yourMetrics.completion >= eliteCoaching.eliteAverages.completion },
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
                    className={`w-full gap-2 ${isElite ? "" : "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"}`}
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

        <TabsContent value="guide" className="space-y-4 mt-6">
          <Card className="border-0 bg-white/[0.03] overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-[#5865F2]/15"} flex items-center justify-center`}>
                  <Target className={`w-5 h-5 ${eliteAccent}`} />
                </div>
                How to Use Your Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { step: 1, icon: Eye, title: "Check Available Orders", desc: "Go to the 'Available Orders' tab to see all open orders you can bid on. Each card shows the service type, platform, and when bidding closes." },
                { step: 2, icon: Gavel, title: "Place Your Bids", desc: "Click 'Place Bid' on any available order. Enter your bid amount, timeline, and when you can start. Lower bids with faster timelines tend to win." },
                { step: 3, icon: Clock, title: "Watch the Countdown", desc: "Once the first bid is placed, a 10-minute countdown begins. You can edit your bid before time runs out. After the timer expires, bidding closes." },
                { step: 4, icon: FileCheck, title: "Manage Your Work", desc: "When your bid is accepted, the order appears in 'My Work'. Send progress updates to staff, update deadlines, and mark orders complete when finished." },
                { step: 5, icon: DollarSign, title: "Request Payouts", desc: "After completing an order, go to 'Payouts' to request payment. Enter the amount and any notes. Staff will review and process your payout." },
                { step: 6, icon: Signal, title: "Set Your Availability", desc: "Use the availability dropdown at the top of your dashboard to let staff know when you're available, busy, away, or offline." },
                { step: 7, icon: Bell, title: "Check Alerts & Strikes", desc: "The 'Status' tab shows your alerts from staff and any strikes. Make sure to acknowledge new strikes and read important alerts." },
                { step: 8, icon: Crown, title: "Aim for Elite Status", desc: "In the Overview tab, you can request Elite status. Elite grinders get a higher order limit (5 vs 3), a special cyan theme, and priority consideration." },
              ].map(({ step, icon: StepIcon, title, desc }) => (
                <div key={step} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] sm:hover:bg-white/[0.05] transition-all duration-200" data-testid={`guide-step-${step}`}>
                  <div className={`w-7 h-7 rounded-full ${isElite ? "bg-cyan-500/20 text-cyan-400" : "bg-[#5865F2]/20 text-[#5865F2]"} flex items-center justify-center flex-shrink-0 text-sm font-bold`}>{step}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <StepIcon className={`w-4 h-4 ${eliteAccent} flex-shrink-0`} />
                      <span className="font-semibold text-sm">{title}</span>
                    </div>
                    <p className="text-xs text-white/40 mt-1">{desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/[0.03] overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-amber-500/15"} flex items-center justify-center`}>
                  <Lightbulb className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
                </div>
                Tips for Success
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { icon: TrendingUp, tip: "Maintain a high completion rate to build your reputation and win more bids." },
                  { icon: CalendarClock, tip: "Submit realistic timelines. Missing deadlines can result in strikes." },
                  { icon: Send, tip: "Send regular progress updates on active orders to keep staff informed." },
                  { icon: Star, tip: "Quality matters. Consistently great work is the fastest path to Elite status." },
                  { icon: Zap, tip: "Bid quickly when new orders drop. The 10-minute countdown starts with the first bid." },
                  { icon: ArrowUpCircle, tip: "Keep your availability status updated so you get considered for direct assignments." },
                ].map(({ icon: TipIcon, tip }, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]" data-testid={`tip-${i}`}>
                    <TipIcon className={`w-4 h-4 mt-0.5 ${eliteAccent} flex-shrink-0`} />
                    <p className="text-xs text-white/40">{tip}</p>
                  </div>
                ))}
              </div>
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
              }}
            >
              {placeBidMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Gavel className="w-4 h-4 mr-2" />}
              Submit Bid
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!payoutDialog} onOpenChange={(open) => !open && setPayoutDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Payout - Order {payoutDialog?.orderId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-muted-foreground">Amount Owed</p>
              <p className="text-xl font-bold text-green-400" data-testid="text-payout-owed">${Number(payoutDialog?.grinderEarnings || payoutDialog?.bidAmount || 0).toFixed(2)}</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Payout Amount ($)</label>
              <Input type="number" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} data-testid="input-payout-amount" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Payout Platform</label>
              {payoutMethods && payoutMethods.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground mb-1.5">Saved methods:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {payoutMethods.map((m: any) => (
                      <Badge
                        key={m.id}
                        variant="outline"
                        className={`cursor-pointer transition-colors text-xs ${payoutPlatform === m.platform && payoutDetails === m.details ? "bg-primary/20 border-primary text-primary" : "border-border/50"}`}
                        onClick={() => { setPayoutPlatform(m.platform); setPayoutDetails(m.details); setSavePayoutMethod(false); }}
                        data-testid={`badge-saved-method-${m.id}`}
                      >
                        {m.platform}: {m.details}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <Select value={payoutPlatform} onValueChange={(val) => {
                setPayoutPlatform(val);
                const saved = payoutMethods?.find((m: any) => m.platform === val);
                if (saved) { setPayoutDetails(saved.details); setSavePayoutMethod(false); }
                else { setPayoutDetails(""); setSavePayoutMethod(true); }
              }}>
                <SelectTrigger data-testid="select-payout-platform">
                  <SelectValue placeholder="Select platform..." />
                </SelectTrigger>
                <SelectContent>
                  {PAYOUT_PLATFORMS.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                {payoutPlatform === "Zelle" ? "Email or Phone Number" :
                 payoutPlatform === "PayPal" ? "PayPal Email" :
                 payoutPlatform === "Apple Pay" ? "Phone Number" :
                 payoutPlatform === "Cash App" ? "$Cashtag" :
                 payoutPlatform === "Venmo" ? "@Username" :
                 "Payout Details"}
              </label>
              <Input
                value={payoutDetails}
                onChange={(e) => setPayoutDetails(e.target.value)}
                placeholder={
                  payoutPlatform === "Zelle" ? "email@example.com or (555) 123-4567" :
                  payoutPlatform === "PayPal" ? "your@paypal.email" :
                  payoutPlatform === "Apple Pay" ? "(555) 123-4567" :
                  payoutPlatform === "Cash App" ? "$YourCashtag" :
                  payoutPlatform === "Venmo" ? "@YourUsername" :
                  "Enter your payout details"
                }
                data-testid="input-payout-details"
              />
            </div>
            {!payoutMethods?.find((m: any) => m.platform === payoutPlatform && m.details === payoutDetails) && payoutPlatform && payoutDetails && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={savePayoutMethod} onChange={(e) => setSavePayoutMethod(e.target.checked)} className="rounded" data-testid="checkbox-save-method" />
                Save this payment method for future payouts
              </label>
            )}
            <div>
              <label className="text-sm font-medium mb-1 block">Notes (optional)</label>
              <Textarea value={payoutNotes} onChange={(e) => setPayoutNotes(e.target.value)} placeholder="Any notes for staff..." data-testid="input-payout-notes" />
            </div>
            <Button className="w-full bg-green-600" data-testid="button-submit-payout"
              disabled={!payoutAmount || !payoutPlatform || !payoutDetails || requestPayoutMutation.isPending}
              onClick={() => {
                requestPayoutMutation.mutate({
                  assignmentId: payoutDialog.id,
                  orderId: payoutDialog.orderId,
                  amount: payoutAmount,
                  payoutPlatform,
                  payoutDetails,
                  savePayoutMethod,
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
