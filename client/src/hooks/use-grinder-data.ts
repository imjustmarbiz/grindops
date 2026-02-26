import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const BID_WAR_CHANNEL_ID = "1467912681670447140";
const GUILD_ID = "1466331568078458942";

export function getDiscordMessageLink(channelId: string, messageId: string) {
  return `https://discord.com/channels/${GUILD_ID}/${channelId}/${messageId}`;
}

export function getBidWarLink() {
  return `https://discord.com/channels/${GUILD_ID}/${BID_WAR_CHANNEL_ID}`;
}

export { BID_WAR_CHANNEL_ID, GUILD_ID };

export function useGrinderData() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ["/api/grinder/me"],
    refetchInterval: 10000,
  });

  const { data: services } = useQuery<any[]>({
    queryKey: ["/api/services"],
    refetchInterval: 30000,
  });

  const serviceName = (serviceId: string) => services?.find((s: any) => s.id === serviceId)?.name || serviceId;

  const grinder = profile?.grinder;
  const isElite = profile?.isElite;
  const assignments = profile?.assignments || [];
  const bids = profile?.bids || [];
  const availableOrders = profile?.availableOrders || [];
  const lostBids = profile?.lostBids || [];
  const aiTips = profile?.aiTips || [];
  const orderUpdates = profile?.orderUpdates || [];
  const payoutRequests = profile?.payoutRequests || [];
  const payoutMethods = profile?.payoutMethods || [];
  const strikeLogs = profile?.strikeLogs || [];
  const strikeAppeals = profile?.strikeAppeals || [];
  const alerts = profile?.alerts || [];
  const systemNotifications = profile?.systemNotifications || [];
  const eliteRequests = profile?.eliteRequests || [];
  const eliteCoaching = profile?.eliteCoaching;
  const unreadAlertCount = profile?.unreadAlertCount || 0;
  const unackedStrikeCount = profile?.unackedStrikeCount || 0;
  const stats = profile?.stats || { totalAssignments: 0, activeAssignments: 0, completedAssignments: 0, totalBids: 0, pendingBids: 0, acceptedBids: 0, winRate: 0, totalEarned: 0, activeEarnings: 0, totalEarnings: 0 };

  const eliteGradient = isElite ? "from-cyan-500/20 via-cyan-500/10 to-teal-500/20" : "from-[#5865F2]/20 via-[#5865F2]/10 to-[#5865F2]/5";
  const eliteBorder = isElite ? "border-cyan-500/30" : "border-[#5865F2]/30";
  const eliteGlow = isElite ? "shadow-cyan-500/10 shadow-lg" : "";
  const eliteAccent = isElite ? "text-cyan-400" : "text-[#5865F2]";

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/grinder/me"] });

  const submitUpdateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/grinder/me/order-updates", data);
      return res.json();
    },
    onSuccess: () => {
      invalidate();
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
      invalidate();
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
      invalidate();
      toast({ title: "Payout requested", description: "Staff will review your request." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const approvePayoutMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      const res = await apiRequest("PATCH", `/api/grinder/me/payout-requests/${payoutId}/approve`, {});
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Payout approved", description: "Staff will now process your payment." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const disputePayoutMutation = useMutation({
    mutationFn: async ({ payoutId, data }: { payoutId: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/grinder/me/payout-requests/${payoutId}/dispute`, data);
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Dispute submitted", description: "Staff will review your request." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const markCompleteMutation = useMutation({
    mutationFn: async ({ assignmentId, payoutPlatform, payoutDetails, savePayoutMethod, completionProofUrl }: { assignmentId: string; payoutPlatform: string; payoutDetails: string; savePayoutMethod?: boolean; completionProofUrl: string }) => {
      const res = await apiRequest("PATCH", `/api/grinder/me/assignments/${assignmentId}/complete`, { payoutPlatform, payoutDetails, savePayoutMethod, completionProofUrl });
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Order marked complete", description: "Payout request created with your chosen method." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const eliteRequestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/grinder/me/elite-request", {});
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Elite request submitted", description: "Staff will review your request." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const markAlertReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const res = await apiRequest("POST", `/api/grinder/me/alerts/${alertId}/read`, {});
      return res.json();
    },
    onSuccess: () => invalidate(),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const markNotifReadMutation = useMutation({
    mutationFn: async (notifId: string) => {
      const res = await apiRequest("POST", `/api/notifications/${notifId}/read`, {});
      return res.json();
    },
    onSuccess: () => invalidate(),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const ackStrikeMutation = useMutation({
    mutationFn: async (strikeId: string) => {
      const res = await apiRequest("POST", `/api/grinder/me/strikes/${strikeId}/ack`, {});
      return res.json();
    },
    onSuccess: () => {
      invalidate();
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
      invalidate();
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
      invalidate();
      toast({ title: "Availability updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return {
    user,
    toast,
    queryClient,
    profile,
    isLoading,
    services,
    serviceName,
    grinder,
    isElite,
    assignments,
    bids,
    availableOrders,
    lostBids,
    aiTips,
    orderUpdates,
    payoutRequests,
    payoutMethods,
    strikeLogs,
    strikeAppeals,
    alerts,
    systemNotifications,
    eliteRequests,
    eliteCoaching,
    unreadAlertCount,
    unackedStrikeCount,
    stats,
    eliteGradient,
    eliteBorder,
    eliteGlow,
    eliteAccent,
    invalidate,
    submitUpdateMutation,
    editBidMutation,
    requestPayoutMutation,
    approvePayoutMutation,
    disputePayoutMutation,
    markCompleteMutation,
    eliteRequestMutation,
    markAlertReadMutation,
    markNotifReadMutation,
    ackStrikeMutation,
    placeBidMutation,
    availabilityMutation,
  };
}
