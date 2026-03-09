import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useStaffData } from "@/hooks/use-staff-data";
import { ROLE_LABELS } from "@shared/schema";
import { getDefaultRepQuoteSettings, mergeRepQuoteSettings, type RepQuoteSettings } from "@shared/rep-quote-settings";
import { getDefaultBadgeQuoteSettings, mergeBadgeQuoteSettings, type BadgeQuoteSettings } from "@shared/badge-quote-settings";
import { getDefaultMyPlayerTypeSettings, mergeMyPlayerTypeSettings, type MyPlayerTypeSettings } from "@shared/my-player-type-settings";
import { ALL_BADGES } from "@shared/badge-data";
import { formatCurrency, categoryIcon, pluralize } from "@/lib/staff-utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Crown, AlertTriangle, Users, Shield, Ban, Gavel, Repeat, ClipboardList, Send, Trash2,
  ArrowRight, CheckCircle, Loader2, Zap, Medal, Clock, Search, Settings, UserPlus, Hash,
  Bot, Construction, Wrench, Megaphone, Power, Eye, EyeOff, User, ShieldCheck, MessageSquare, Gamepad2, Plus, X, Palette, Star, ExternalLink, Percent, CreditCard, Calculator, LayoutDashboard,
} from "lucide-react";
import { useSearch, Link } from "wouter";
import { BiddingCountdownPanel } from "@/components/bidding-countdown";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { OperationsContent, ServiceManagement, DeletionRequestsPanel, ClearDataPanel } from "./operations";
import { CREATOR_MANUAL_BADGE_IDS } from "@shared/creator-badges";
import { CREATOR_BADGE_META } from "@/components/creator-achievement-badges";
import { SiPaypal, SiApple, SiApplepay, SiVenmo, SiCashapp, SiZelle } from "react-icons/si";

const CREATOR_PAYOUT_METHOD_LABELS: Record<string, string> = { paypal: "PayPal", zelle: "Zelle", applepay: "Apple Pay", venmo: "Venmo", cashapp: "Cash App" };

/** Apple logo only — matches button green (emerald) when enabled */
function ApplePayVerticalLogo({ className }: { className?: string }) {
  return <SiApple className={className} style={{ color: "currentColor" }} aria-hidden />;
}

/** Venmo — Apple App Store style icon (blue squircle, white V) */
function VenmoVerticalLogo({ className }: { className?: string }) {
  return (
    <img
      src="/venmo-app-icon.svg"
      alt=""
      className={className}
      width={20}
      height={20}
      style={{ flexShrink: 0, objectFit: "contain" }}
      aria-hidden
    />
  );
}

function CreatorRow({ c, isOwner, editingCreatorQuoteDiscountId, editingCreatorQuoteDiscountValue, setEditingCreatorQuoteDiscountId, setEditingCreatorQuoteDiscountValue, updateCreatorQuoteDiscountMutation, editingCreatorCommissionId, editingCreatorCommissionValue, setEditingCreatorCommissionId, setEditingCreatorCommissionValue, updateCreatorCommissionMutation, editingCreatorUserIdId, editingCreatorUserIdValue, setEditingCreatorUserIdId, setEditingCreatorUserIdValue, updateCreatorUserIdMutation, setAssignCreatorBadgeCreator, setAssignCreatorBadgeId, setAssignCreatorBadgeNote }: {
  c: any;
  isOwner: boolean;
  editingCreatorQuoteDiscountId: string | null;
  editingCreatorQuoteDiscountValue: string;
  setEditingCreatorQuoteDiscountId: (id: string | null) => void;
  setEditingCreatorQuoteDiscountValue: (v: string) => void;
  updateCreatorQuoteDiscountMutation: any;
  editingCreatorCommissionId: string | null;
  editingCreatorCommissionValue: string;
  setEditingCreatorCommissionId: (id: string | null) => void;
  setEditingCreatorCommissionValue: (v: string) => void;
  updateCreatorCommissionMutation: any;
  editingCreatorUserIdId: string | null;
  editingCreatorUserIdValue: string;
  setEditingCreatorUserIdId: (id: string | null) => void;
  setEditingCreatorUserIdValue: (v: string) => void;
  updateCreatorUserIdMutation: any;
  setAssignCreatorBadgeCreator: (c: any) => void;
  setAssignCreatorBadgeId: (id: string) => void;
  setAssignCreatorBadgeNote: (note: string) => void;
}) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
      <div className="flex-1 min-w-0">
        <p className="font-medium">{c.displayName}</p>
        <code className="text-sm text-emerald-400 font-mono">{c.code}</code>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/staff/creators/${c.id}`}>
          <Button variant="outline" size="sm" className="shrink-0 border-blue-500/30 text-blue-400 hover:bg-blue-500/10" data-testid={`button-view-creator-dashboard-${c.id}`}>
            <LayoutDashboard className="w-3.5 h-3.5 mr-1" />
            View dashboard
          </Button>
        </Link>
        {isOwner && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap">Quote %</label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                placeholder="—"
                className="w-20 h-8 text-sm"
                value={editingCreatorQuoteDiscountId === c.id ? editingCreatorQuoteDiscountValue : (c.quoteDiscountPercent ?? "")}
                onChange={(e) => { setEditingCreatorQuoteDiscountId(c.id); setEditingCreatorQuoteDiscountValue(e.target.value); }}
                onFocus={() => { setEditingCreatorQuoteDiscountId(c.id); setEditingCreatorQuoteDiscountValue(String(c.quoteDiscountPercent ?? "")); }}
                onBlur={() => {
                  if (editingCreatorQuoteDiscountId !== c.id) return;
                  const v = editingCreatorQuoteDiscountValue.trim();
                  const num = v === "" ? null : parseFloat(v);
                  if (v === "" || (num !== null && !Number.isNaN(num) && num >= 0 && num <= 100)) {
                    updateCreatorQuoteDiscountMutation.mutate({ creatorId: c.id, quoteDiscountPercent: num });
                    setEditingCreatorQuoteDiscountId(null);
                    setEditingCreatorQuoteDiscountValue("");
                  }
                }}
                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap">Commission %</label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                placeholder="Default"
                className="w-20 h-8 text-sm"
                value={editingCreatorCommissionId === c.id ? editingCreatorCommissionValue : (c.commissionPercent ?? "")}
                onChange={(e) => { setEditingCreatorCommissionId(c.id); setEditingCreatorCommissionValue(e.target.value); }}
                onFocus={() => { setEditingCreatorCommissionId(c.id); setEditingCreatorCommissionValue(String(c.commissionPercent ?? "")); }}
                onBlur={() => {
                  if (editingCreatorCommissionId !== c.id) return;
                  const v = editingCreatorCommissionValue.trim();
                  const num = v === "" ? null : parseFloat(v);
                  if (v === "" || (num !== null && !Number.isNaN(num) && num >= 0 && num <= 100)) {
                    updateCreatorCommissionMutation.mutate({ creatorId: c.id, commissionPercent: num });
                    setEditingCreatorCommissionId(null);
                    setEditingCreatorCommissionValue("");
                  }
                }}
                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap">Discord ID</label>
              <Input
                placeholder="Not linked"
                className="w-36 h-8 text-sm font-mono"
                value={editingCreatorUserIdId === c.id ? editingCreatorUserIdValue : (c.userId && c.userId !== c.id ? c.userId : "")}
                onChange={(e) => { setEditingCreatorUserIdId(c.id); setEditingCreatorUserIdValue(e.target.value); }}
                onFocus={() => { setEditingCreatorUserIdId(c.id); setEditingCreatorUserIdValue(c.userId && c.userId !== c.id ? c.userId : ""); }}
                onBlur={() => {
                  if (editingCreatorUserIdId !== c.id) return;
                  const v = editingCreatorUserIdValue.trim();
                  const current = c.userId && c.userId !== c.id ? c.userId : "";
                  if (v !== current) {
                    updateCreatorUserIdMutation.mutate({ creatorId: c.id, userId: v });
                    setEditingCreatorUserIdId(null);
                    setEditingCreatorUserIdValue("");
                  }
                }}
                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              />
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2 items-center">
          {c.youtubeUrl && <a href={c.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-red-400 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" /> YouTube</a>}
          {c.twitchUrl && <a href={c.twitchUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Twitch</a>}
          {c.tiktokUrl && <a href={c.tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-pink-400 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" /> TikTok</a>}
          {c.instagramUrl && <a href={c.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-rose-400 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Instagram</a>}
          {c.xUrl && <a href={c.xUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" /> X</a>}
          {!c.youtubeUrl && !c.twitchUrl && !c.tiktokUrl && !c.instagramUrl && !c.xUrl && <span className="text-xs text-muted-foreground">No socials linked</span>}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
            onClick={() => { setAssignCreatorBadgeCreator(c); setAssignCreatorBadgeId(""); setAssignCreatorBadgeNote(""); }}
            data-testid={`button-assign-creator-badge-${c.id}`}
          >
            <Star className="w-3.5 h-3.5 mr-1" />
            Assign badge
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function StaffAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const {
    allGrindersIncludingRemoved: allGrinders,
    assignments: allAssignments,
    orders: allOrders,
    eliteRequests: eliteRequestsList,
    strikeLogs: strikeLogsList,
    services: allServices,
  } = useStaffData();

  const [strikeGrinderId, setStrikeGrinderId] = useState("");
  const [strikeReason, setStrikeReason] = useState("");
  const [denyEliteDialogOpen, setDenyEliteDialogOpen] = useState(false);
  const [denyEliteReqId, setDenyEliteReqId] = useState("");
  const [denyEliteReason, setDenyEliteReason] = useState("");
  const [rejectPayoutDetailReqId, setRejectPayoutDetailReqId] = useState("");
  const [rejectPayoutDetailReason, setRejectPayoutDetailReason] = useState("");
  const [rejectPayoutDetailDialogOpen, setRejectPayoutDetailDialogOpen] = useState(false);
  const [editLimitGrinderId, setEditLimitGrinderId] = useState("");
  const [editLimitValue, setEditLimitValue] = useState("");
  const [removeGrinder, setRemoveGrinder] = useState<any>(null);
  const [deleteHistoricalData, setDeleteHistoricalData] = useState(false);
  const [editProfileGrinder, setEditProfileGrinder] = useState<any>(null);
  const [editProfileName, setEditProfileName] = useState("");
  const [editProfileRoles, setEditProfileRoles] = useState<string[]>([]);
  const [editProfileCapacity, setEditProfileCapacity] = useState("");
  const [editProfileNotes, setEditProfileNotes] = useState("");
  const [editProfileTwitch, setEditProfileTwitch] = useState("");
  const [editProfileDisplayRole, setEditProfileDisplayRole] = useState("");
  const [checkupOrderSearch, setCheckupOrderSearch] = useState("");
  const [taskGrinderId, setTaskGrinderId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("normal");
  const [taskOrderId, setTaskOrderId] = useState("");

  const [assignCreatorBadgeCreator, setAssignCreatorBadgeCreator] = useState<any>(null);
  const [assignCreatorBadgeId, setAssignCreatorBadgeId] = useState("");
  const [assignCreatorBadgeNote, setAssignCreatorBadgeNote] = useState("");

  const { data: checkupConfig } = useQuery<{ enabled: boolean; skippedOrders: string[] }>({
    queryKey: ["/api/daily-checkups/config"],
  });

  const toggleGlobalCheckupsMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest("PATCH", "/api/daily-checkups/global", { enabled });
      return res.json();
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-checkups/config"] });
      toast({ title: enabled ? "Daily checkups enabled for all orders" : "Daily checkups disabled for all orders" });
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const toggleOrderCheckupMutation = useMutation({
    mutationFn: async ({ orderId, skip }: { orderId: string; skip: boolean }) => {
      const res = await apiRequest("PATCH", `/api/daily-checkups/order/${orderId}`, { skip });
      return res.json();
    },
    onSuccess: (_, { skip }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-checkups/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: skip ? "Daily checkups disabled for this order" : "Daily checkups enabled for this order" });
    },
    onError: () => toast({ title: "Failed to update order", variant: "destructive" }),
  });

  const eliteReqMutation = useMutation({
    mutationFn: async ({ id, status, decisionNotes }: { id: string; status: string; decisionNotes?: string }) => {
      const res = await apiRequest("PATCH", `/api/staff/elite-requests/${id}`, { status, reviewedBy: "staff", decisionNotes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/elite-requests"] });
      toast({ title: "Elite request updated" });
    },
  });

  const { data: staffTasks = [] } = useQuery<any[]>({
    queryKey: ["/api/staff/grinder-tasks"],
  });

  const { data: creatorsList = [] } = useQuery<any[]>({
    queryKey: ["/api/staff/creators"],
  });

  const { data: creatorPayoutDetailRequestsList = [] } = useQuery<any[]>({
    queryKey: ["/api/staff/creator-payout-detail-requests"],
  });

  const payoutDetailRequestMutation = useMutation({
    mutationFn: async ({ id, action, rejectionReason }: { id: string; action: "approve" | "reject"; rejectionReason?: string }) => {
      const res = await apiRequest("PATCH", `/api/staff/creator-payout-detail-requests/${id}`, { action, rejectionReason });
      return res.json();
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/creator-payout-detail-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/creators"] });
      toast({ title: action === "approve" ? "Payout details approved and updated" : "Request rejected" });
      setRejectPayoutDetailDialogOpen(false);
      setRejectPayoutDetailReqId("");
      setRejectPayoutDetailReason("");
    },
    onError: (e: any) => toast({ title: "Failed to update", description: e?.message, variant: "destructive" }),
  });

  const assignCreatorBadgeMutation = useMutation({
    mutationFn: async ({ creatorId, badgeId, note }: { creatorId: string; badgeId: string; note?: string }) => {
      const res = await apiRequest("POST", "/api/creator/badges", { creatorId, badgeId, note: note || undefined });
      return res.json();
    },
    onSuccess: () => {
      setAssignCreatorBadgeCreator(null);
      setAssignCreatorBadgeId("");
      setAssignCreatorBadgeNote("");
      queryClient.invalidateQueries({ queryKey: ["/api/staff/creators"] });
      toast({ title: "Creator badge assigned" });
    },
    onError: (e: any) => {
      const msg = e?.message || (e && typeof e === "object" && "message" in e ? String((e as Error).message) : "");
      if (msg.includes("409") || msg.includes("already assigned")) {
        toast({ title: "Badge already assigned", description: "This creator already has this badge.", variant: "destructive" });
      } else {
        toast({ title: "Failed to assign badge", description: msg, variant: "destructive" });
      }
    },
  });

  const sendTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/staff/grinder-tasks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/grinder-tasks"] });
      setTaskGrinderId("");
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("normal");
      setTaskOrderId("");
      toast({ title: "Task sent", description: "The grinder will see this on their To-Do List." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/staff/grinder-tasks/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/grinder-tasks"] });
      toast({ title: "Task removed" });
    },
  });

  const { data: finePayments = [] } = useQuery<any[]>({
    queryKey: ["/api/staff/fine-payments"],
  });
  const [fineReviewId, setFineReviewId] = useState<string | null>(null);
  const [fineReviewNote, setFineReviewNote] = useState("");
  const [viewFineProofUrl, setViewFineProofUrl] = useState<string | null>(null);

  const fineReviewMutation = useMutation({
    mutationFn: async (data: { id: string; status: string; reviewNote: string }) => {
      const res = await apiRequest("PATCH", `/api/staff/fine-payments/${data.id}/review`, { status: data.status, reviewNote: data.reviewNote });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/fine-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/strike-logs"] });
      setFineReviewId(null);
      setFineReviewNote("");
      toast({ title: "Fine payment reviewed" });
    },
  });

  const { data: strikeAppeals = [] } = useQuery<any[]>({
    queryKey: ["/api/staff/strike-appeals"],
  });

  const [appealReviewId, setAppealReviewId] = useState<string | null>(null);
  const [appealReviewNote, setAppealReviewNote] = useState("");

  const appealReviewMutation = useMutation({
    mutationFn: async ({ id, status, reviewNote }: { id: string; status: string; reviewNote: string }) => {
      const res = await apiRequest("PATCH", `/api/staff/strike-appeals/${id}`, { status, reviewNote });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/strike-appeals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/strike-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      setAppealReviewId(null);
      setAppealReviewNote("");
      toast({ title: "Appeal reviewed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const strikeMutation = useMutation({
    mutationFn: async (data: { grinderId: string; action: string; reason: string }) => {
      const res = await apiRequest("POST", "/api/staff/strikes", { ...data, createdBy: "staff" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/strike-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      toast({ title: "Strike updated" });
    },
  });

  const finePayMutation = useMutation({
    mutationFn: async (grinderId: string) => {
      const res = await apiRequest("POST", `/api/staff/fines/${grinderId}/pay`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/strike-logs"] });
      toast({ title: "Fines marked as paid, suspension lifted" });
    },
  });

  const updateLimitMutation = useMutation({
    mutationFn: async ({ grinderId, capacity }: { grinderId: string; capacity: number }) => {
      const res = await apiRequest("PATCH", `/api/grinders/${grinderId}`, { capacity });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      setEditLimitGrinderId("");
      setEditLimitValue("");
      toast({ title: "Order limit updated" });
    },
    onError: () => {
      toast({ title: "Failed to update order limit", variant: "destructive" });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ grinderId, data }: { grinderId: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/grinders/${grinderId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      setEditProfileGrinder(null);
      toast({ title: "Grinder profile updated" });
    },
    onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
  });

  const removeGrinderMutation = useMutation({
    mutationFn: async ({ grinderId, deleteHistory }: { grinderId: string; deleteHistory: boolean }) => {
      const res = await apiRequest("DELETE", `/api/grinders/${grinderId}?deleteHistory=${deleteHistory}`);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payout-requests"] });
      setRemoveGrinder(null);
      setDeleteHistoricalData(false);
      toast({ title: variables.deleteHistory ? "Grinder and all historical data permanently deleted" : "Grinder access removed (historical data preserved)" });
    },
    onError: () => toast({ title: "Failed to remove grinder", variant: "destructive" }),
  });

  const replacedAssignments = allAssignments.filter(a => a.wasReassigned);
  const totalOriginalGrinderPay = replacedAssignments.reduce((s, a) => s + Number(a.originalGrinderPay || 0), 0);
  const totalReplacementGrinderPay = replacedAssignments.reduce((s, a) => s + Number(a.replacementGrinderPay || 0), 0);
  const replacementRate = allAssignments.length > 0 ? (replacedAssignments.length / allAssignments.length) * 100 : 0;
  const grindersReplacedOff = Array.from(new Set(replacedAssignments.map(a => a.originalGrinderId).filter(Boolean)));

  const { data: queueConfig } = useQuery<any>({
    queryKey: ["/api/config"],
    enabled: isOwner,
  });

  const { data: maintenanceConfig } = useQuery<{ maintenanceMode: boolean; maintenanceModeSetBy: string | null; earlyAccessMode: boolean; holidayTheme?: string }>({
    queryKey: ["/api/config/maintenance"],
  });

  const toggleBotMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest("PATCH", "/api/config/mgt-bot", { enabled });
      return res.json();
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({ title: enabled ? "MGT Bot data tracking enabled" : "MGT Bot data tracking disabled" });
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const toggleCustomerUpdatesMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest("PATCH", "/api/config/customer-updates", { enabled });
      return res.json();
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({ title: enabled ? "Customer updates pipeline enabled" : "Customer updates pipeline disabled" });
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const toggleMaintenanceMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest("PATCH", "/api/config/maintenance", { enabled });
      return res.json();
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ["/api/config/maintenance"] });
      toast({ title: enabled ? "Maintenance mode enabled" : "Maintenance mode disabled" });
    },
    onError: (e: any) => toast({ title: "Failed to update", description: e.message, variant: "destructive" }),
  });

  const toggleEarlyAccessMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest("PATCH", "/api/config/early-access", { enabled });
      return res.json();
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ["/api/config/maintenance"] });
      toast({ title: enabled ? "Elite access mode enabled — only Elite Grinders can access" : "Elite access mode disabled — all grinders can access" });
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const HOLIDAY_THEMES = [
    { value: "none", label: "Default (No Holiday)", color: "text-muted-foreground", emoji: "" },
    { value: "christmas", label: "Christmas", color: "text-red-400", emoji: "🎄" },
    { value: "thanksgiving", label: "Thanksgiving", color: "text-amber-400", emoji: "🦃" },
    { value: "4th-of-july", label: "4th of July", color: "text-blue-400", emoji: "🇺🇸" },
    { value: "halloween", label: "Halloween", color: "text-orange-400", emoji: "🎃" },
    { value: "valentines", label: "Valentine's Day", color: "text-pink-400", emoji: "💝" },
    { value: "new-years", label: "New Year's Eve", color: "text-purple-400", emoji: "🎆" },
    { value: "st-patricks", label: "St. Patrick's Day", color: "text-emerald-400", emoji: "☘️" },
  ];

  const setHolidayThemeMutation = useMutation({
    mutationFn: async (theme: string) => {
      const res = await apiRequest("PATCH", "/api/config/holiday-theme", { theme });
      return res.json();
    },
    onSuccess: (_, theme) => {
      queryClient.invalidateQueries({ queryKey: ["/api/config/maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      const label = HOLIDAY_THEMES.find(t => t.value === theme)?.label || theme;
      toast({ title: theme === "none" ? "Holiday theme disabled" : `Holiday theme set to ${label}` });
    },
    onError: () => toast({ title: "Failed to update holiday theme", variant: "destructive" }),
  });

  const setCreatorCommissionMutation = useMutation({
    mutationFn: async (percent: number) => {
      const res = await apiRequest("PATCH", "/api/config/creator-commission", { percent });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({ title: "Creator commission % updated" });
    },
    onError: (e: any) => toast({ title: "Failed to update creator commission", description: e.message, variant: "destructive" }),
  });

  const setCreatorPayoutMethodsMutation = useMutation({
    mutationFn: async (methods: string[]) => {
      const res = await apiRequest("PATCH", "/api/config/creator-payout-methods", { methods });
      return res.json();
    },
    onMutate: async (methods) => {
      await queryClient.cancelQueries({ queryKey: ["/api/config"] });
      const prev = queryClient.getQueryData<any>(["/api/config"]);
      queryClient.setQueryData(["/api/config"], (old: any) => (old ? { ...old, creatorPayoutMethods: methods } : old));
      return { prev };
    },
    onError: (_err, _methods, ctx) => {
      if (ctx?.prev != null) queryClient.setQueryData(["/api/config"], ctx.prev);
      toast({ title: "Failed to update", description: "Could not save payout methods.", variant: "destructive" });
    },
    onSuccess: (data: { success?: boolean; creatorPayoutMethods?: string[] }) => {
      const methods = Array.isArray(data?.creatorPayoutMethods) ? data.creatorPayoutMethods : undefined;
      if (methods != null) {
        queryClient.setQueryData(["/api/config"], (prev: any) => prev ? { ...prev, creatorPayoutMethods: methods } : prev);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({ title: "Creator payout methods updated" });
    },
  });

  const setQuoteGeneratorSplitMutation = useMutation({
    mutationFn: async ({ companyPct, grinderPct }: { companyPct?: number; grinderPct?: number }) => {
      const res = await apiRequest("PATCH", "/api/config/quote-generator-split", { companyPct, grinderPct });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({ title: "Quote generator split updated" });
    },
    onError: (e: any) => toast({ title: "Failed to update quote generator split", description: e?.message, variant: "destructive" }),
  });

  const [repQuoteSettingsLocal, setRepQuoteSettingsLocal] = useState<RepQuoteSettings | null>(null);
  const [badgeQuoteSettingsLocal, setBadgeQuoteSettingsLocal] = useState<BadgeQuoteSettings | null>(null);
  const [myPlayerTypeSettingsLocal, setMyPlayerTypeSettingsLocal] = useState<MyPlayerTypeSettings | null>(null);
  const [adminQuoteGenTab, setAdminQuoteGenTab] = useState<"rep" | "badge">("rep");

  const saveRepQuoteSettingsMutation = useMutation({
    mutationFn: async (payload: RepQuoteSettings) => {
      const res = await apiRequest("PATCH", "/api/config/rep-quote-settings", payload);
      return res.json();
    },
    onSuccess: (data: { repQuoteSettings?: RepQuoteSettings }) => {
      const saved = data?.repQuoteSettings ? mergeRepQuoteSettings(data.repQuoteSettings) : null;
      if (saved) setRepQuoteSettingsLocal(saved);
      queryClient.setQueryData(["/api/config"], (prev: Record<string, unknown> | undefined) =>
        prev && saved ? { ...prev, repQuoteSettings: saved } : prev
      );
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({ title: "Rep quote settings saved" });
    },
    onError: (e: any) => toast({ title: "Failed to save rep quote settings", description: e?.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (queueConfig?.repQuoteSettings && repQuoteSettingsLocal === null) setRepQuoteSettingsLocal(mergeRepQuoteSettings(queueConfig.repQuoteSettings));
  }, [queueConfig?.repQuoteSettings, repQuoteSettingsLocal]);

  const saveBadgeQuoteSettingsMutation = useMutation({
    mutationFn: async (s: BadgeQuoteSettings) => {
      const res = await apiRequest("PATCH", "/api/config/badge-quote-settings", s);
      const data = await res.json();
      if (!data.success) throw new Error("Failed to save");
      return data;
    },
    onSuccess: (data) => {
      const saved = data?.badgeQuoteSettings ? mergeBadgeQuoteSettings(data.badgeQuoteSettings) : null;
      if (saved) setBadgeQuoteSettingsLocal(saved);
      queryClient.setQueryData(["/api/config"], (prev: Record<string, unknown> | undefined) =>
        prev && saved ? { ...prev, badgeQuoteSettings: saved } : prev
      );
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({ title: "Badge quote settings saved" });
    },
  });

  useEffect(() => {
    if (queueConfig?.badgeQuoteSettings && badgeQuoteSettingsLocal === null) setBadgeQuoteSettingsLocal(mergeBadgeQuoteSettings(queueConfig.badgeQuoteSettings));
  }, [queueConfig?.badgeQuoteSettings, badgeQuoteSettingsLocal]);

  const saveMyPlayerTypeSettingsMutation = useMutation({
    mutationFn: async (s: MyPlayerTypeSettings) => {
      const res = await apiRequest("PATCH", "/api/config/my-player-type-settings", s);
      const data = await res.json();
      if (!data.success) throw new Error("Failed to save");
      return data;
    },
    onSuccess: (data) => {
      const saved = data?.myPlayerTypeSettings ? mergeMyPlayerTypeSettings(data.myPlayerTypeSettings) : null;
      if (saved) setMyPlayerTypeSettingsLocal(saved);
      queryClient.setQueryData(["/api/config"], (prev: Record<string, unknown> | undefined) =>
        prev && saved ? { ...prev, myPlayerTypeSettings: saved } : prev
      );
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({ title: "MyPlayer Type settings saved" });
    },
    onError: (e: any) => toast({ title: "Failed to save MyPlayer Type settings", description: e?.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (queueConfig?.myPlayerTypeSettings != null && myPlayerTypeSettingsLocal === null) setMyPlayerTypeSettingsLocal(mergeMyPlayerTypeSettings(queueConfig.myPlayerTypeSettings));
  }, [queueConfig?.myPlayerTypeSettings, myPlayerTypeSettingsLocal]);

  const updateCreatorQuoteDiscountMutation = useMutation({
    mutationFn: async ({ creatorId, quoteDiscountPercent }: { creatorId: string; quoteDiscountPercent: number | null }) => {
      const res = await apiRequest("PATCH", `/api/staff/creators/${creatorId}`, { quoteDiscountPercent });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/creators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({ title: "Creator quote discount % updated" });
    },
    onError: (e: any) => toast({ title: "Failed to update creator quote discount", description: e?.message, variant: "destructive" }),
  });

  const updateCreatorCommissionMutation = useMutation({
    mutationFn: async ({ creatorId, commissionPercent }: { creatorId: string; commissionPercent: number | null }) => {
      const res = await apiRequest("PATCH", `/api/staff/creators/${creatorId}`, { commissionPercent });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/creators"] });
      toast({ title: "Creator commission % updated" });
    },
    onError: (e: any) => toast({ title: "Failed to update creator commission", description: e?.message, variant: "destructive" }),
  });

  const updateCreatorUserIdMutation = useMutation({
    mutationFn: async ({ creatorId, userId }: { creatorId: string; userId: string }) => {
      const res = await apiRequest("PATCH", `/api/staff/creators/${creatorId}`, { userId: userId.trim() });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/creators"] });
      toast({ title: "Creator Discord link updated" });
    },
    onError: (e: any) => toast({ title: "Failed to update Discord link", description: e?.message, variant: "destructive" }),
  });

  const createCreatorMutation = useMutation({
    mutationFn: async ({ code, displayName, discordUserId }: { code: string; displayName: string; discordUserId?: string }) => {
      const body: { code: string; displayName: string; discordUserId?: string } = { code: code.trim(), displayName: displayName.trim() };
      if (discordUserId != null && discordUserId.trim() !== "") body.discordUserId = discordUserId.trim();
      const res = await apiRequest("POST", "/api/staff/creators", body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/creators"] });
      setAddCreatorOpen(false);
      setAddCreatorCode("");
      setAddCreatorDisplayName("");
      setAddCreatorDiscordUserId("");
      toast({ title: "Creator added" });
    },
    onError: (e: any) => toast({ title: "Failed to add creator", description: e?.message, variant: "destructive" }),
  });

  const actorUsername = ((user as any)?.discordUsername || (user as any)?.firstName || "").toLowerCase();
  const actorDiscordId = (user as any)?.discordId || (user as any)?.id || "";
  const isImjustmar = actorUsername === "imjustmar" || actorUsername === "demoowner" || actorDiscordId === "172526626888876032";

  const searchString = useSearch();
  const linkOrderIdFromUrl = new URLSearchParams(searchString.startsWith("?") ? searchString.slice(1) : searchString).get("linkOrderId") || undefined;
  const [activeTab, setActiveTab] = useState("operations");

  const [alertMessage, setAlertMessage] = useState("");
  const [alertTarget, setAlertTarget] = useState("all");
  const [alertTargetUserId, setAlertTargetUserId] = useState("");
  const [alertUserSearch, setAlertUserSearch] = useState("");
  const [alertTargetRoles, setAlertTargetRoles] = useState<string[]>([]);

  const { data: platformsList = ["Xbox", "PS5"] } = useQuery<string[]>({ queryKey: ["/api/platforms"] });
  const [newPlatform, setNewPlatform] = useState("");
  const [editingPlatforms, setEditingPlatforms] = useState<string[] | null>(null);
  const activePlatforms = editingPlatforms || platformsList;
  const [creatorCommissionInput, setCreatorCommissionInput] = useState<string>("");
  const [quoteGeneratorCompanyInput, setQuoteGeneratorCompanyInput] = useState<string>("");
  const [quoteGeneratorGrinderInput, setQuoteGeneratorGrinderInput] = useState<string>("");
  const [editingCreatorQuoteDiscountId, setEditingCreatorQuoteDiscountId] = useState<string | null>(null);
  const [editingCreatorQuoteDiscountValue, setEditingCreatorQuoteDiscountValue] = useState<string>("");
  const [editingCreatorCommissionId, setEditingCreatorCommissionId] = useState<string | null>(null);
  const [editingCreatorCommissionValue, setEditingCreatorCommissionValue] = useState<string>("");
  const [editingCreatorUserIdId, setEditingCreatorUserIdId] = useState<string | null>(null);
  const [editingCreatorUserIdValue, setEditingCreatorUserIdValue] = useState<string>("");
  const [addCreatorOpen, setAddCreatorOpen] = useState(false);
  const [addCreatorCode, setAddCreatorCode] = useState("");
  const [addCreatorDisplayName, setAddCreatorDisplayName] = useState("");
  const [addCreatorDiscordUserId, setAddCreatorDiscordUserId] = useState("");

  const updatePlatformsMutation = useMutation({
    mutationFn: async (platforms: string[]) => {
      const res = await apiRequest("PATCH", "/api/config/platforms", { platforms });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
      setEditingPlatforms(null);
      setNewPlatform("");
      toast({ title: "Platforms updated" });
    },
    onError: (e: any) => toast({ title: "Failed to update platforms", description: e.message, variant: "destructive" }),
  });

  const { data: allSiteAlerts = [] } = useQuery<any[]>({
    queryKey: ["/api/site-alerts/all"],
    enabled: isOwner,
  });

  const createAlertMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/site-alerts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-alerts/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-alerts"] });
      setAlertMessage("");
      setAlertTarget("all");
      setAlertTargetUserId("");
      setAlertUserSearch("");
      toast({ title: "Site alert published" });
    },
    onError: (e: any) => toast({ title: "Failed to create alert", description: e.message, variant: "destructive" }),
  });

  const toggleAlertMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await apiRequest("PATCH", `/api/site-alerts/${id}`, { enabled });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-alerts/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-alerts"] });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/site-alerts/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-alerts/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-alerts"] });
      toast({ title: "Alert deleted" });
    },
  });

  const alertTargetOptions = [
    { value: "all", label: "Everyone", icon: Users, desc: "All staff & grinders" },
    { value: "staff", label: "Staff Only", icon: Shield, desc: "Staff & owners only" },
    { value: "grinders", label: "Grinders Only", icon: User, desc: "Grinders only" },
    { value: "roles", label: "Specific Roles", icon: ShieldCheck, desc: "By role" },
    { value: "user", label: "Specific User", icon: UserPlus, desc: "One person" },
  ];

  const allUsersForAlert = [
    ...(allGrinders || []).map((g: any) => ({ id: g.discordUserId || g.id, name: g.name, type: "grinder" })),
  ].filter(u => u.id);

  const filteredAlertUsers = alertUserSearch.trim()
    ? allUsersForAlert.filter(u => u.name.toLowerCase().includes(alertUserSearch.toLowerCase()))
    : allUsersForAlert.slice(0, 10);

  return (
    <AnimatedPage className="space-y-5 sm:space-y-6" data-testid="page-staff-admin">
      {maintenanceConfig?.maintenanceMode && (
        <FadeInUp>
          <Card className="border border-amber-500/30 bg-amber-500/10">
            <CardContent className="p-4 flex items-center gap-3">
              <Construction className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-400">Maintenance Mode Active</p>
                <p className="text-xs text-muted-foreground">Site access is restricted. Only imjustmar can access the dashboard.</p>
              </div>
            </CardContent>
          </Card>
        </FadeInUp>
      )}

      {maintenanceConfig?.earlyAccessMode && !maintenanceConfig?.maintenanceMode && (
        <FadeInUp>
          <Card className="border border-cyan-500/30 bg-cyan-500/10">
            <CardContent className="p-4 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-cyan-400">Elite Grinders Only Access Active</p>
                <p className="text-xs text-muted-foreground">Only Elite Grinders can access the dashboard. Regular grinders are denied.</p>
              </div>
            </CardContent>
          </Card>
        </FadeInUp>
      )}

      <FadeInUp>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Settings className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight" data-testid="text-admin-title">
                Admin
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Operations, management, and system settings</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 gap-1">
              <Crown className="w-3 h-3" />
              {(eliteRequestsList || []).filter((r: any) => r.status === "Pending").length} elite pending
            </Badge>
            <Badge className="bg-red-500/15 text-red-400 border border-red-500/20 gap-1" data-testid="badge-suspended-count">
              <AlertTriangle className="w-3 h-3" />
              {allGrinders.filter(g => g.suspended).length} suspended
            </Badge>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
        <BiddingCountdownPanel variant="compact" />
      </FadeInUp>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto" data-testid="admin-tabs">
          <TabsTrigger value="operations" className="gap-1.5" data-testid="tab-operations">
            <Wrench className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Operations</span>
            <span className="sm:hidden">Ops</span>
          </TabsTrigger>
          <TabsTrigger value="management" className="gap-1.5" data-testid="tab-management">
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Management</span>
            <span className="sm:hidden">Mgmt</span>
          </TabsTrigger>
          <TabsTrigger value="creators" className="gap-1.5" data-testid="tab-creators">
            <Star className="w-3.5 h-3.5" />
            Creators
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="quote-generator" className="gap-1.5" data-testid="tab-quote-generator">
              <Calculator className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quote Generator</span>
              <span className="sm:hidden">Quotes</span>
            </TabsTrigger>
          )}
          {isOwner && (
            <TabsTrigger value="system" className="gap-1.5" data-testid="tab-system">
              <Settings className="w-3.5 h-3.5" />
              System
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="operations" className="mt-5">
          <OperationsContent embedded initialLinkOrderId={linkOrderIdFromUrl} />
        </TabsContent>

        <TabsContent value="creators" className="mt-5 space-y-5">
          <FadeInUp>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
              <p className="text-sm text-white/90">
                <strong className="text-emerald-400">Creator management.</strong> Add creators and assign codes for quote attribution, order linking, and commission. Set default commission below; override per creator. Use <strong className="text-emerald-400">View dashboard</strong> for earnings, orders, and payouts.
              </p>
            </div>
          </FadeInUp>
          {isOwner && (
          <FadeInUp>
            <Card className="border-0 bg-gradient-to-br from-emerald-500/[0.08] via-background to-emerald-900/[0.04] overflow-hidden relative" data-testid="card-default-commission">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-emerald-500/[0.04] -translate-y-12 translate-x-12" />
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <Percent className="w-4 h-4 text-emerald-400" />
                  </div>
                  Default commission % (orders)
                  <Badge className="ml-auto text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    {queueConfig?.creatorCommissionPercent ?? 10}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-3">
                <p className="text-xs text-muted-foreground">Applied to completed orders with a creator code when the creator has no custom %. Also used for Creator dashboard earnings.</p>
                <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  className="w-20 h-9"
                  value={creatorCommissionInput !== "" ? creatorCommissionInput : (queueConfig?.creatorCommissionPercent ?? 10)}
                  onChange={(e) => setCreatorCommissionInput(e.target.value)}
                  onBlur={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!Number.isNaN(v) && v >= 0 && v <= 100) {
                      setCreatorCommissionMutation.mutate(v);
                      setCreatorCommissionInput("");
                    }
                  }}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                />
                <span className="text-sm text-muted-foreground">%</span>
                <Button size="sm" variant="secondary" onClick={() => {
                  const v = parseFloat(creatorCommissionInput || String(queueConfig?.creatorCommissionPercent ?? 10));
                  if (!Number.isNaN(v) && v >= 0 && v <= 100) {
                    setCreatorCommissionMutation.mutate(v);
                    setCreatorCommissionInput("");
                  }
                }} disabled={setCreatorCommissionMutation.isPending}>
                  {setCreatorCommissionMutation.isPending ? "Saving…" : "Save"}
                </Button>
                </div>
              </CardContent>
            </Card>
          </FadeInUp>
          )}
          {isOwner && (
          <FadeInUp>
            <Card className="border-0 bg-gradient-to-br from-emerald-500/[0.08] via-background to-emerald-900/[0.04] overflow-hidden relative" data-testid="card-creator-payout-methods">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-emerald-500/[0.04] -translate-y-12 translate-x-12" />
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                  </div>
                  Creator Payout Methods
                  <Badge className="ml-auto text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  {(Array.isArray(queueConfig?.creatorPayoutMethods) ? (queueConfig.creatorPayoutMethods as string[]).length : 1)} enabled
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-3">
                <p className="text-xs text-muted-foreground">Choose which payout methods creators can use when requesting commission payouts. Click to enable or disable.</p>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: "paypal", label: "PayPal", Icon: SiPaypal, VerticalLogo: null as React.ComponentType<{ className?: string }> | null },
                    { id: "zelle", label: "Zelle", Icon: SiZelle, VerticalLogo: null as React.ComponentType<{ className?: string }> | null },
                    { id: "applepay", label: "Apple Pay", Icon: SiApplepay, VerticalLogo: ApplePayVerticalLogo },
                    { id: "venmo", label: "Venmo", Icon: SiVenmo, VerticalLogo: VenmoVerticalLogo },
                    { id: "cashapp", label: "Cash App", Icon: SiCashapp, VerticalLogo: null as React.ComponentType<{ className?: string }> | null },
                  ].map(({ id, label, Icon, VerticalLogo }) => {
                    const raw = queueConfig?.creatorPayoutMethods;
                    const current = Array.isArray(raw) ? raw : ["paypal"];
                    const isChecked = current.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          const next = isChecked ? current.filter((m: string) => m !== id) : Array.from(new Set([...current, id]));
                          setCreatorPayoutMethodsMutation.mutate(next.length ? next : ["paypal"]);
                        }}
                        disabled={setCreatorPayoutMethodsMutation.isPending}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                          isChecked
                            ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/25"
                            : "border-white/10 bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        data-testid={`payout-method-${id}`}
                      >
                        {isChecked ? (
                          VerticalLogo ? (
                            <VerticalLogo className="h-5 w-auto shrink-0 min-w-[24px]" />
                          ) : (
                            <Icon className="w-4 h-4 shrink-0" aria-hidden />
                          )
                        ) : null}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </FadeInUp>
          )}
          {creatorPayoutDetailRequestsList.filter((r: any) => r.status === "pending").length > 0 && (
            <FadeInUp>
              <Card className="border-0 bg-gradient-to-br from-amber-500/[0.08] via-background to-amber-900/[0.04] overflow-hidden relative" data-testid="card-creator-payout-detail-requests">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                    Creator Payout Detail Requests
                    <Badge className="ml-auto text-xs bg-amber-500/15 text-amber-400 border border-amber-500/20">
                      {creatorPayoutDetailRequestsList.filter((r: any) => r.status === "pending").length} pending
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Approve or reject creators’ requests to change their PayPal (or other) payout details. On approve, their profile is updated.</p>
                </CardHeader>
                <CardContent className="relative space-y-3">
                  {creatorPayoutDetailRequestsList.filter((r: any) => r.status === "pending").map((req: any) => (
                    <div key={req.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{req.creatorDisplayName ?? req.creatorId}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Requested: <span className="text-amber-200">{CREATOR_PAYOUT_METHOD_LABELS[String(req.requestedMethod ?? "")] ?? req.requestedMethod}</span> — <code className="text-emerald-400">{req.requestedDetail}</code>
                        </p>
                        {req.currentPayoutDetail != null && req.currentPayoutDetail !== "" && (
                          <p className="text-xs text-muted-foreground mt-1">Current on profile: <code className="text-white/70">{req.currentPayoutDetail}</code></p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Requested {req.createdAt ? new Date(req.createdAt).toLocaleString() : ""}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30"
                          disabled={payoutDetailRequestMutation.isPending}
                          onClick={() => payoutDetailRequestMutation.mutate({ id: req.id, action: "approve" })}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 text-red-300 hover:bg-red-500/20"
                          disabled={payoutDetailRequestMutation.isPending}
                          onClick={() => { setRejectPayoutDetailReqId(req.id); setRejectPayoutDetailReason(""); setRejectPayoutDetailDialogOpen(true); }}
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </FadeInUp>
          )}
          <FadeInUp>
            <Card className="border border-border bg-card overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-emerald-400" />
                  Creators
                  <Badge className="ml-auto text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">{creatorsList.length}</Badge>
                  {isOwner && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                      onClick={() => { setAddCreatorOpen(true); setAddCreatorCode(""); setAddCreatorDisplayName(""); setAddCreatorDiscordUserId(""); }}
                      data-testid="button-add-creator"
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1" />
                      Add creator
                    </Button>
                  )}
                </CardTitle>
                <p className="text-xs text-muted-foreground">Creator codes and linked socials. Use these for referral attribution and payouts (Business Wallet → Creator). Add a creator to get a code for the quote generator and orders. View dashboard shows their earnings, orders, and payouts.</p>
              </CardHeader>
              <CardContent>
                {creatorsList.length === 0 && (
                  <p className="text-sm text-muted-foreground">No creators yet.</p>
                )}
                {creatorsList.length > 0 && (
                  <div className="space-y-3">
                    {creatorsList.map((c) => (
                      <CreatorRow
                        key={c.id}
                        c={c}
                        isOwner={isOwner}
                        editingCreatorQuoteDiscountId={editingCreatorQuoteDiscountId}
                        editingCreatorQuoteDiscountValue={editingCreatorQuoteDiscountValue}
                        setEditingCreatorQuoteDiscountId={setEditingCreatorQuoteDiscountId}
                        setEditingCreatorQuoteDiscountValue={setEditingCreatorQuoteDiscountValue}
                        updateCreatorQuoteDiscountMutation={updateCreatorQuoteDiscountMutation}
                        editingCreatorCommissionId={editingCreatorCommissionId}
                        editingCreatorCommissionValue={editingCreatorCommissionValue}
                        setEditingCreatorCommissionId={setEditingCreatorCommissionId}
                        setEditingCreatorCommissionValue={setEditingCreatorCommissionValue}
                        updateCreatorCommissionMutation={updateCreatorCommissionMutation}
                        editingCreatorUserIdId={editingCreatorUserIdId}
                        editingCreatorUserIdValue={editingCreatorUserIdValue}
                        setEditingCreatorUserIdId={setEditingCreatorUserIdId}
                        setEditingCreatorUserIdValue={setEditingCreatorUserIdValue}
                        updateCreatorUserIdMutation={updateCreatorUserIdMutation}
                        setAssignCreatorBadgeCreator={setAssignCreatorBadgeCreator}
                        setAssignCreatorBadgeId={setAssignCreatorBadgeId}
                        setAssignCreatorBadgeNote={setAssignCreatorBadgeNote}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeInUp>

          {/* Add Creator dialog - must live inside Creators tab so it's mounted when button is clicked */}
          <Dialog open={addCreatorOpen} onOpenChange={(open) => { if (!open) { setAddCreatorOpen(false); setAddCreatorCode(""); setAddCreatorDisplayName(""); setAddCreatorDiscordUserId(""); } }}>
            <DialogContent className="border-white/10 bg-background/95 backdrop-blur-xl sm:max-w-[420px]" data-testid="dialog-add-creator">
              <DialogHeader>
                <DialogTitle className="font-display text-lg flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                  Add creator
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Create a new creator code for the quote generator and orders. The code will be stored in uppercase (e.g. MYCODE). Add their Discord User ID so when they sign in with Discord they are linked to this profile and can access the creator dashboard.
                </p>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Creator code</label>
                  <Input
                    value={addCreatorCode}
                    onChange={(e) => setAddCreatorCode(e.target.value)}
                    placeholder="e.g. MYCODE or STREAMER1"
                    className="mt-1.5 bg-background/50 border-white/10"
                    data-testid="input-add-creator-code"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Display name</label>
                  <Input
                    value={addCreatorDisplayName}
                    onChange={(e) => setAddCreatorDisplayName(e.target.value)}
                    placeholder="e.g. Streamer Name"
                    className="mt-1.5 bg-background/50 border-white/10"
                    data-testid="input-add-creator-display-name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Discord User ID (optional)</label>
                  <Input
                    value={addCreatorDiscordUserId}
                    onChange={(e) => setAddCreatorDiscordUserId(e.target.value)}
                    placeholder="e.g. 123456789012345678"
                    className="mt-1.5 bg-background/50 border-white/10 font-mono text-sm"
                    data-testid="input-add-creator-discord-user-id"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Links this profile to their Discord account. When they sign in with Discord, they’ll see the creator dashboard. Right‑click their avatar in Discord → Copy User ID (enable Developer Mode in Discord settings if needed).</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setAddCreatorOpen(false); setAddCreatorCode(""); setAddCreatorDisplayName(""); setAddCreatorDiscordUserId(""); }} className="border-white/10">
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25"
                    disabled={!addCreatorCode.trim() || !addCreatorDisplayName.trim() || createCreatorMutation.isPending}
                    onClick={() => createCreatorMutation.mutate({ code: addCreatorCode.trim(), displayName: addCreatorDisplayName.trim(), discordUserId: addCreatorDiscordUserId.trim() || undefined })}
                    data-testid="button-submit-add-creator"
                  >
                    {createCreatorMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add creator"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="quote-generator" className="mt-5 space-y-5">
          {isOwner && (
            <>
              <FadeInUp>
                <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4">
                  <p className="text-sm text-white/90">
                    <strong className="text-amber-400">Quote Generator settings.</strong> Configure default payout split and any options used on the staff Quote Generator page. Creator codes and their quote discount % are managed under the <strong className="text-amber-400">Creators</strong> tab.
                  </p>
                  <Link href="/quote-generator">
                    <Button variant="outline" size="sm" className="mt-3 border-amber-500/30 text-amber-400 hover:bg-amber-500/20">
                      <Calculator className="w-3.5 h-3.5 mr-1.5" />
                      Open Quote Generator
                    </Button>
                  </Link>
                </div>
              </FadeInUp>
              <Tabs value={adminQuoteGenTab} onValueChange={(v) => setAdminQuoteGenTab(v as "rep" | "badge")} className="space-y-4">
                <TabsList className="w-full sm:w-auto grid grid-cols-2 bg-white/[0.04] border border-white/10 p-1 h-auto">
                  <TabsTrigger value="rep" className="min-h-10 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/30 border border-transparent">
                    <Zap className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    Rep Grinding
                  </TabsTrigger>
                  <TabsTrigger value="badge" className="min-h-10 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/30 border border-transparent">
                    <span className="mr-1.5 shrink-0" aria-hidden>🎖️</span>
                    Badge Grinding
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="rep" className="mt-0">
              <FadeInUp>
                <Card className="border-0 bg-white/[0.02] border border-white/[0.06] overflow-hidden relative" data-testid="card-rep-grinding-quote-settings">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-amber-400" />
                      </div>
                      Rep Grinding Quote Settings
                      <Badge className="ml-auto text-xs bg-amber-500/15 text-amber-400 border border-amber-500/20">Editable</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative space-y-3">
                    <p className="text-xs text-muted-foreground">Configure rounding, urgency multipliers, volume modifier, late efficiency, and rep segment pricing. The quote generator uses these when generating quotes.</p>
                    {(() => {
                      const s = repQuoteSettingsLocal ?? mergeRepQuoteSettings(queueConfig?.repQuoteSettings ?? null);
                      return (
                        <>
                          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                            <p className="text-xs font-medium text-primary">Rep Grinding Profit Split</p>
                            <p className="text-[11px] text-muted-foreground leading-tight">When no grinder bid is entered, payouts use this split. Company share funds creator commission when a creator code is used.</p>
                            <div className="flex flex-wrap items-center gap-4">
                              <div className="flex items-center gap-2">
                                <label className="text-sm text-muted-foreground">Company</label>
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step={1}
                                  className="w-16 bg-white/[0.04] border-white/10 text-foreground"
                                  value={quoteGeneratorCompanyInput !== "" ? quoteGeneratorCompanyInput : (queueConfig?.quoteGeneratorCompanyPct ?? 70)}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    setQuoteGeneratorCompanyInput(raw);
                                    const v = parseFloat(raw);
                                    if (!Number.isNaN(v) && v >= 0 && v <= 100) setQuoteGeneratorGrinderInput(String(100 - v));
                                  }}
                                  onBlur={() => {
                                    const v = parseFloat(quoteGeneratorCompanyInput || String(queueConfig?.quoteGeneratorCompanyPct ?? 70));
                                    if (!Number.isNaN(v) && v >= 0 && v <= 100) {
                                      const company = Math.round(v);
                                      setQuoteGeneratorSplitMutation.mutate({ companyPct: company, grinderPct: 100 - company });
                                      setQuoteGeneratorCompanyInput("");
                                      setQuoteGeneratorGrinderInput("");
                                    }
                                  }}
                                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                                />
                                <span className="text-sm text-muted-foreground">%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-sm text-muted-foreground">Grinder</label>
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step={1}
                                  className="w-16 bg-white/[0.04] border-white/10 text-foreground"
                                  value={quoteGeneratorGrinderInput !== "" ? quoteGeneratorGrinderInput : (queueConfig?.quoteGeneratorGrinderPct ?? 30)}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    setQuoteGeneratorGrinderInput(raw);
                                    const v = parseFloat(raw);
                                    if (!Number.isNaN(v) && v >= 0 && v <= 100) setQuoteGeneratorCompanyInput(String(100 - v));
                                  }}
                                  onBlur={() => {
                                    const v = parseFloat(quoteGeneratorGrinderInput || String(queueConfig?.quoteGeneratorGrinderPct ?? 30));
                                    if (!Number.isNaN(v) && v >= 0 && v <= 100) {
                                      const grinder = Math.round(v);
                                      setQuoteGeneratorSplitMutation.mutate({ companyPct: 100 - grinder, grinderPct: grinder });
                                      setQuoteGeneratorCompanyInput("");
                                      setQuoteGeneratorGrinderInput("");
                                    }
                                  }}
                                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                                />
                                <span className="text-sm text-muted-foreground">%</span>
                              </div>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  const company = parseFloat(quoteGeneratorCompanyInput || String(queueConfig?.quoteGeneratorCompanyPct ?? 70));
                                  const grinder = parseFloat(quoteGeneratorGrinderInput || String(queueConfig?.quoteGeneratorGrinderPct ?? 30));
                                  if (!Number.isNaN(company) && company >= 0 && company <= 100) {
                                    setQuoteGeneratorSplitMutation.mutate({ companyPct: Math.round(company), grinderPct: 100 - Math.round(company) });
                                    setQuoteGeneratorCompanyInput("");
                                    setQuoteGeneratorGrinderInput("");
                                  } else if (!Number.isNaN(grinder) && grinder >= 0 && grinder <= 100) {
                                    setQuoteGeneratorSplitMutation.mutate({ companyPct: 100 - Math.round(grinder), grinderPct: Math.round(grinder) });
                                    setQuoteGeneratorCompanyInput("");
                                    setQuoteGeneratorGrinderInput("");
                                  }
                                }}
                                disabled={setQuoteGeneratorSplitMutation.isPending}
                              >
                                {setQuoteGeneratorSplitMutation.isPending ? "Saving…" : "Save"}
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                              <p className="text-xs font-medium text-primary">Rounding ($)</p>
                              <p className="text-[11px] text-muted-foreground leading-tight">Round quote amounts to the nearest $X (e.g. 5 rounds to $125, $130).</p>
                              <Input
                                type="number"
                                min={1}
                                max={100}
                                className="h-9 w-20 bg-white/[0.04] border-white/10"
                                value={s.roundBy}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value, 10);
                                  if (!Number.isNaN(v) && v >= 1) setRepQuoteSettingsLocal((prev) => (prev ? { ...prev, roundBy: v } : getDefaultRepQuoteSettings()));
                                }}
                              />
                            </div>
                            {(["Rush", "Normal", "Slow"] as const).map((u) => (
                              <div key={u} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                                <p className="text-xs font-medium text-primary">Quote multiplier · {u}</p>
                                <p className="text-[11px] text-muted-foreground leading-tight">Multiplies base quote for this urgency (e.g. 1.2 = 20% more).</p>
                                <Input
                                  type="number"
                                  step={0.01}
                                  min={0.5}
                                  max={1.5}
                                  className="h-9 w-20 bg-white/[0.04] border-white/10"
                                  value={s.urgencyQuoteMultipliers[u] ?? 1}
                                  onChange={(e) => {
                                    const v = parseFloat(e.target.value);
                                    if (!Number.isNaN(v)) setRepQuoteSettingsLocal((prev) => {
                                      const next = prev ? { ...prev } : getDefaultRepQuoteSettings();
                                      next.urgencyQuoteMultipliers = { ...next.urgencyQuoteMultipliers, [u]: v };
                                      return next;
                                    });
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {(["Rush", "Normal", "Slow"] as const).map((u) => {
                              const f = s.urgencyDeliveryFactors[u] ?? { min: 1, max: 1 };
                              return (
                                <div key={u} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                                  <p className="text-xs font-medium text-primary">Delivery factor (min/max) · {u}</p>
                                  <p className="text-[11px] text-muted-foreground leading-tight">Multipliers for min/max delivery days by urgency.</p>
                                  <div className="flex gap-2 items-center">
                                    <div className="flex-1 flex flex-col gap-1">
                                      <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Min</label>
                                      <Input
                                        type="number"
                                        step={0.01}
                                        className="h-9 w-full bg-white/[0.04] border-white/10"
                                        value={f.min}
                                        onChange={(e) => {
                                          const v = parseFloat(e.target.value);
                                          if (!Number.isNaN(v)) setRepQuoteSettingsLocal((prev) => {
                                            const next = prev ? { ...prev } : getDefaultRepQuoteSettings();
                                            next.urgencyDeliveryFactors = { ...next.urgencyDeliveryFactors, [u]: { ...(next.urgencyDeliveryFactors[u] ?? { min: 1, max: 1 }), min: v } };
                                            return next;
                                          });
                                        }}
                                      />
                                    </div>
                                    <div className="flex-1 flex flex-col gap-1">
                                      <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Max</label>
                                      <Input
                                        type="number"
                                        step={0.01}
                                        className="h-9 w-full bg-white/[0.04] border-white/10"
                                        value={f.max}
                                      onChange={(e) => {
                                        const v = parseFloat(e.target.value);
                                        if (!Number.isNaN(v)) setRepQuoteSettingsLocal((prev) => {
                                          const next = prev ? { ...prev } : getDefaultRepQuoteSettings();
                                          next.urgencyDeliveryFactors = { ...next.urgencyDeliveryFactors, [u]: { ...(next.urgencyDeliveryFactors[u] ?? { min: 1, max: 1 }), max: v } };
                                          return next;
                                        });
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                            })}
                          </div>
                          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                            <p className="text-xs font-medium text-primary">Volume modifier (bars 1–6)</p>
                            <p className="text-[11px] text-muted-foreground leading-tight">Multiplier per bar count (e.g. 1.1 = 10% more for that bar count).</p>
                            <div className="flex flex-wrap gap-2">
                              {[1, 2, 3, 4, 5, 6].map((b) => (
                                <div key={b} className="flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground w-12">{b} bar{b > 1 ? "s" : ""}</span>
                                  <Input
                                    type="number"
                                    step={0.01}
                                    min={0.5}
                                    max={2}
                                    className="h-8 w-16 bg-white/[0.04] border-white/10 text-xs"
                                    value={s.volumeMultiplierByBars[String(b)] ?? 1}
                                    onChange={(e) => {
                                      const v = parseFloat(e.target.value);
                                      if (!Number.isNaN(v)) setRepQuoteSettingsLocal((prev) => {
                                        const next = prev ? { ...prev } : getDefaultRepQuoteSettings();
                                        next.volumeMultiplierByBars = { ...next.volumeMultiplierByBars, [String(b)]: v };
                                        return next;
                                      });
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                              <p className="text-xs font-medium text-primary">Late efficiency surcharge (level 1–5)</p>
                              <p className="text-[11px] text-muted-foreground leading-tight">Additional % added based on late efficiency level (0.01 = 1%).</p>
                              <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4, 5].map((lvl) => (
                                  <div key={lvl} className="flex items-center gap-1">
                                    <span className="text-xs text-muted-foreground w-6">L{lvl}</span>
                                    <Input
                                      type="number"
                                      step={0.001}
                                      min={0}
                                      max={0.5}
                                      className="h-8 w-20 bg-white/[0.04] border-white/10 text-xs"
                                      value={s.lateEfficiencySurcharge[String(lvl)] ?? 0}
                                      onChange={(e) => {
                                        const v = parseFloat(e.target.value);
                                        if (!Number.isNaN(v)) setRepQuoteSettingsLocal((prev) => {
                                          const next = prev ? { ...prev } : getDefaultRepQuoteSettings();
                                          next.lateEfficiencySurcharge = { ...next.lateEfficiencySurcharge, [String(lvl)]: v };
                                          return next;
                                        });
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                              <p className="text-xs font-medium text-primary">Late efficiency tier factor</p>
                              <p className="text-[11px] text-muted-foreground leading-tight">Multiplier by rep tier (Rookie, Starter, Veteran, Legend).</p>
                              <div className="flex flex-wrap gap-2">
                                {["Rookie", "Starter", "Veteran", "Legend"].map((tier) => (
                                  <div key={tier} className="flex items-center gap-1">
                                    <span className="text-xs text-muted-foreground w-14">{tier}</span>
                                    <Input
                                      type="number"
                                      step={0.1}
                                      min={0}
                                      max={2}
                                      className="h-8 w-16 bg-white/[0.04] border-white/10 text-xs"
                                      value={s.lateEfficiencyTierFactor[tier] ?? 1}
                                      onChange={(e) => {
                                        const v = parseFloat(e.target.value);
                                        if (!Number.isNaN(v)) setRepQuoteSettingsLocal((prev) => {
                                          const next = prev ? { ...prev } : getDefaultRepQuoteSettings();
                                          next.lateEfficiencyTierFactor = { ...next.lateEfficiencyTierFactor, [tier]: v };
                                          return next;
                                        });
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.06]">
                            <Button
                              size="sm"
                              className="bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30"
                              onClick={() => saveRepQuoteSettingsMutation.mutate(s)}
                              disabled={saveRepQuoteSettingsMutation.isPending}
                            >
                              {saveRepQuoteSettingsMutation.isPending ? "Saving…" : "Save all"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-white/10"
                              onClick={() => setRepQuoteSettingsLocal(getDefaultRepQuoteSettings())}
                            >
                              Reset to defaults
                            </Button>
                          </div>
                          <details className="group">
                            <summary className="text-xs font-medium text-primary cursor-pointer list-none flex items-center gap-1">Rep Pricing (segment rates) — click to expand</summary>
                              <p className="text-[11px] text-muted-foreground mt-1">Rate and full-bar value per rep segment (e.g. 0–25, 25–50).</p>
                            <div className="mt-2 overflow-x-auto max-h-64 overflow-y-auto">
                              <table className="text-xs w-full min-w-[280px] border border-white/10 rounded-lg overflow-hidden">
                                <thead><tr className="bg-white/5"><th className="text-left p-1.5">From → To</th><th className="p-1.5 min-w-[5rem]">Rate</th><th className="p-1.5 min-w-[5rem]">Full bar</th></tr></thead>
                                <tbody>
                                  {s.repPricing.map((row, i) => (
                                    <tr key={i} className="border-t border-white/5">
                                      <td className="p-1.5">{row.fromLabel} → {row.toLabel}</td>
                                      <td className="p-1.5 min-w-[5rem]">
                                        <Input type="number" step={0.01} className="h-7 min-w-[5rem] w-20 bg-white/[0.04] border-white/10 text-xs" value={row.rate} onChange={(e) => {
                                          const v = parseFloat(e.target.value);
                                          if (!Number.isNaN(v)) setRepQuoteSettingsLocal((prev) => {
                                            const next = prev ? { ...prev, repPricing: prev.repPricing.map((r, j) => j === i ? { ...r, rate: v } : r) } : getDefaultRepQuoteSettings();
                                            return next;
                                          });
                                        }} />
                                      </td>
                                      <td className="p-1.5 min-w-[5rem]">
                                        <Input type="number" className="h-7 min-w-[5rem] w-20 bg-white/[0.04] border-white/10 text-xs" value={row.fullBar} onChange={(e) => {
                                          const v = parseInt(e.target.value, 10);
                                          if (!Number.isNaN(v)) setRepQuoteSettingsLocal((prev) => {
                                            const next = prev ? { ...prev, repPricing: prev.repPricing.map((r, j) => j === i ? { ...r, fullBar: v } : r) } : getDefaultRepQuoteSettings();
                                            return next;
                                          });
                                        }} />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </details>
                          <details className="group">
                            <summary className="text-xs font-medium text-primary cursor-pointer list-none flex items-center gap-1">Rep Delivery (min/max days per segment) — click to expand</summary>
                              <p className="text-[11px] text-muted-foreground mt-1">Min and max delivery days per rep segment.</p>
                            <div className="mt-2 overflow-x-auto max-h-64 overflow-y-auto">
                              <table className="text-xs w-full min-w-[280px] border border-white/10 rounded-lg overflow-hidden">
                                <thead><tr className="bg-white/5"><th className="text-left p-1.5">From → To</th><th className="p-1.5 min-w-[5rem]">Min days</th><th className="p-1.5 min-w-[5rem]">Max days</th></tr></thead>
                                <tbody>
                                  {s.repDelivery.map((row, i) => (
                                    <tr key={i} className="border-t border-white/5">
                                      <td className="p-1.5">{row.from} → {row.to}</td>
                                      <td className="p-1.5 min-w-[5rem]">
                                        <Input type="number" step={0.01} className="h-7 min-w-[5rem] w-20 bg-white/[0.04] border-white/10 text-xs" value={row.minDays} onChange={(e) => {
                                          const v = parseFloat(e.target.value);
                                          if (!Number.isNaN(v)) setRepQuoteSettingsLocal((prev) => {
                                            const next = prev ? { ...prev, repDelivery: prev.repDelivery.map((r, j) => j === i ? { ...r, minDays: v } : r) } : getDefaultRepQuoteSettings();
                                            return next;
                                          });
                                        }} />
                                      </td>
                                      <td className="p-1.5 min-w-[5rem]">
                                        <Input type="number" step={0.01} className="h-7 min-w-[5rem] w-20 bg-white/[0.04] border-white/10 text-xs" value={row.maxDays} onChange={(e) => {
                                          const v = parseFloat(e.target.value);
                                          if (!Number.isNaN(v)) setRepQuoteSettingsLocal((prev) => {
                                            const next = prev ? { ...prev, repDelivery: prev.repDelivery.map((r, j) => j === i ? { ...r, maxDays: v } : r) } : getDefaultRepQuoteSettings();
                                            return next;
                                          });
                                        }} />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </details>
                          <details className="group">
                            <summary className="text-xs font-medium text-primary cursor-pointer list-none flex items-center gap-1">Rep Market Value (for market quote) — click to expand</summary>
                              <p className="text-[11px] text-muted-foreground mt-1">Rate and full-bar value used for market-based quotes.</p>
                            <div className="mt-2 overflow-x-auto max-h-64 overflow-y-auto">
                              <table className="text-xs w-full min-w-[280px] border border-white/10 rounded-lg overflow-hidden">
                                <thead><tr className="bg-white/5"><th className="text-left p-1.5">From → To</th><th className="p-1.5 min-w-[5rem]">Rate</th><th className="p-1.5 min-w-[5rem]">Full bar</th></tr></thead>
                                <tbody>
                                  {s.repMarketValue.map((row, i) => (
                                    <tr key={i} className="border-t border-white/5">
                                      <td className="p-1.5">{row.fromLabel} → {row.toLabel}</td>
                                      <td className="p-1.5 min-w-[5rem]">
                                        <Input type="number" step={0.01} className="h-7 min-w-[5rem] w-20 bg-white/[0.04] border-white/10 text-xs" value={row.rate} onChange={(e) => {
                                          const v = parseFloat(e.target.value);
                                          if (!Number.isNaN(v)) setRepQuoteSettingsLocal((prev) => {
                                            const next = prev ? { ...prev, repMarketValue: prev.repMarketValue.map((r, j) => j === i ? { ...r, rate: v } : r) } : getDefaultRepQuoteSettings();
                                            return next;
                                          });
                                        }} />
                                      </td>
                                      <td className="p-1.5 min-w-[5rem]">
                                        <Input type="number" className="h-7 min-w-[5rem] w-20 bg-white/[0.04] border-white/10 text-xs" value={row.fullBar} onChange={(e) => {
                                          const v = parseInt(e.target.value, 10);
                                          if (!Number.isNaN(v)) setRepQuoteSettingsLocal((prev) => {
                                            const next = prev ? { ...prev, repMarketValue: prev.repMarketValue.map((r, j) => j === i ? { ...r, fullBar: v } : r) } : getDefaultRepQuoteSettings();
                                            return next;
                                          });
                                        }} />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </details>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              </FadeInUp>
                </TabsContent>
                <TabsContent value="badge" className="mt-0">
                  <FadeInUp>
                    <Card className="border-0 bg-white/[0.02] border border-white/[0.06] overflow-hidden relative" data-testid="card-badge-grinding-quote-settings">
                      <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <Medal className="w-4 h-4 text-amber-400" />
                      </div>
                      Badge Grinding Quote Settings
                      <Badge className="ml-auto text-xs bg-amber-500/15 text-amber-400 border border-amber-500/20">Editable</Badge>
                    </CardTitle>
                      </CardHeader>
                      <CardContent className="relative space-y-3">
                    <p className="text-xs text-muted-foreground">Configure pricing per badge, max total, urgency multipliers, and delivery for the Badge Grinding tab on the Quote Generator. <a href="https://www.nba2klab.com/badge-descriptions" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">NBA 2K26 badge list</a></p>
                    {(() => {
                      const s = badgeQuoteSettingsLocal ?? mergeBadgeQuoteSettings(queueConfig?.badgeQuoteSettings ?? null);
                      return (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                              <p className="text-xs font-medium text-primary">Rounding ($)</p>
                              <p className="text-[11px] text-muted-foreground leading-tight">Round quote amounts to the nearest $X.</p>
                              <Input type="number" min={1} max={100} className="h-9 w-20 bg-white/[0.04] border-white/10" value={s.roundBy} onChange={(e) => { const v = parseInt(e.target.value, 10); if (!Number.isNaN(v) && v >= 1) setBadgeQuoteSettingsLocal((prev) => (prev ? { ...prev, roundBy: v } : getDefaultBadgeQuoteSettings())); }} />
                            </div>
                            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                              <p className="text-xs font-medium text-primary">Default badge price ($)</p>
                              <p className="text-[11px] text-muted-foreground leading-tight">Fallback when a badge has no custom price.</p>
                              <Input type="number" min={0} step={1} className="h-9 w-20 bg-white/[0.04] border-white/10" value={s.defaultBadgePrice} onChange={(e) => { const v = parseFloat(e.target.value); if (!Number.isNaN(v) && v >= 0) setBadgeQuoteSettingsLocal((prev) => (prev ? { ...prev, defaultBadgePrice: v } : getDefaultBadgeQuoteSettings())); }} />
                            </div>
                            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                              <p className="text-xs font-medium text-primary">Max badges price ($)</p>
                              <p className="text-[11px] text-muted-foreground leading-tight">Cap total badge cost. 0 = no cap.</p>
                              <Input type="number" min={0} step={1} className="h-9 w-20 bg-white/[0.04] border-white/10" value={s.maxBadgesPrice ?? ""} placeholder="No cap" onChange={(e) => { const v = e.target.value === "" ? null : parseFloat(e.target.value); setBadgeQuoteSettingsLocal((prev) => (prev ? { ...prev, maxBadgesPrice: v !== null && !Number.isNaN(v) ? v : null } : getDefaultBadgeQuoteSettings())); }} />
                            </div>
                            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                              <p className="text-xs font-medium text-primary">Base delivery (days)</p>
                              <p className="text-[11px] text-muted-foreground leading-tight">Min / max days before urgency.</p>
                              <div className="flex gap-2">
                                <Input type="number" min={1} className="h-9 w-16 bg-white/[0.04] border-white/10" placeholder="Min" value={s.baseMinDays} onChange={(e) => { const v = parseInt(e.target.value, 10); if (!Number.isNaN(v) && v >= 1) setBadgeQuoteSettingsLocal((prev) => (prev ? { ...prev, baseMinDays: v } : getDefaultBadgeQuoteSettings())); }} />
                                <Input type="number" min={1} className="h-9 w-16 bg-white/[0.04] border-white/10" placeholder="Max" value={s.baseMaxDays} onChange={(e) => { const v = parseInt(e.target.value, 10); if (!Number.isNaN(v) && v >= 1) setBadgeQuoteSettingsLocal((prev) => (prev ? { ...prev, baseMaxDays: v } : getDefaultBadgeQuoteSettings())); }} />
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {(["Rush", "Normal", "Slow"] as const).map((u) => (
                              <div key={u} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                                <p className="text-xs font-medium text-primary">Quote multiplier · {u}</p>
                                <Input type="number" step={0.01} min={0.5} max={1.5} className="h-9 w-20 bg-white/[0.04] border-white/10" value={s.urgencyQuoteMultipliers[u] ?? 1} onChange={(e) => { const v = parseFloat(e.target.value); if (!Number.isNaN(v)) setBadgeQuoteSettingsLocal((prev) => { const next = prev ? { ...prev } : getDefaultBadgeQuoteSettings(); next.urgencyQuoteMultipliers = { ...next.urgencyQuoteMultipliers, [u]: v }; return next; }); }} />
                              </div>
                            ))}
                          </div>
                          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-2">
                            <p className="text-xs font-medium text-primary">MyPlayer Type (Badge Grinding only)</p>
                            <p className="text-[11px] text-muted-foreground">Both Non-Rebirth and Rebirth add to cost. Prices configurable below.</p>
                            {(() => {
                              const mpt = myPlayerTypeSettingsLocal ?? mergeMyPlayerTypeSettings(queueConfig?.myPlayerTypeSettings ?? null);
                              return (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1.5">
                                    <Label className="text-[10px]">Non-Rebirth add ($)</Label>
                                    <Input type="number" min={0} step={1} className="h-9 w-24 bg-white/[0.04] border-white/10" value={mpt.nonRebirthAdd} onChange={(e) => { const v = parseInt(e.target.value, 10); if (!Number.isNaN(v) && v >= 0) setMyPlayerTypeSettingsLocal((prev) => (prev ? { ...prev, nonRebirthAdd: v } : { ...getDefaultMyPlayerTypeSettings(), nonRebirthAdd: v })); }} />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-[10px]">Rebirth add ($)</Label>
                                    <Input type="number" min={0} step={1} className="h-9 w-24 bg-white/[0.04] border-white/10" value={mpt.rebirthAdd} onChange={(e) => { const v = parseInt(e.target.value, 10); if (!Number.isNaN(v) && v >= 0) setMyPlayerTypeSettingsLocal((prev) => (prev ? { ...prev, rebirthAdd: v } : { ...getDefaultMyPlayerTypeSettings(), rebirthAdd: v })); }} />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <Button size="sm" variant="outline" className="border-white/10" onClick={() => saveMyPlayerTypeSettingsMutation.mutate(myPlayerTypeSettingsLocal ?? mergeMyPlayerTypeSettings(queueConfig?.myPlayerTypeSettings ?? null))} disabled={saveMyPlayerTypeSettingsMutation.isPending}>
                                      {saveMyPlayerTypeSettingsMutation.isPending ? "Saving…" : "Save MyPlayer Type"}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                          <details className="group">
                            <summary className="text-xs font-medium text-primary cursor-pointer list-none">Per-badge pricing — click to expand</summary>
                            <p className="text-[11px] text-muted-foreground mt-1">Set custom $ per badge. Badges not listed use the default price.</p>
                            <div className="mt-2 overflow-x-auto max-h-64 overflow-y-auto">
                              <div className="flex flex-wrap gap-2 p-2">
                                {ALL_BADGES.map((b) => {
                                  const price = s.badgePricing[b.id] ?? s.defaultBadgePrice;
                                  return (
                                    <div key={b.id} className="flex items-center gap-1.5 p-1.5 rounded bg-white/[0.03] border border-white/5">
                                      <span className="text-xs w-32 truncate">{b.name}</span>
                                      <Input type="number" min={0} step={1} className="h-7 w-16 bg-white/[0.04] border-white/10 text-xs" value={price} onChange={(e) => { const v = parseFloat(e.target.value); if (!Number.isNaN(v) && v >= 0) setBadgeQuoteSettingsLocal((prev) => { const next = prev ? { ...prev } : getDefaultBadgeQuoteSettings(); next.badgePricing = { ...next.badgePricing, [b.id]: v }; return next; }); }} />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </details>
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.06]">
                            <Button size="sm" className="bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30" onClick={() => saveBadgeQuoteSettingsMutation.mutate(s)} disabled={saveBadgeQuoteSettingsMutation.isPending}>
                              {saveBadgeQuoteSettingsMutation.isPending ? "Saving…" : "Save all"}
                            </Button>
                            <Button size="sm" variant="outline" className="border-white/10" onClick={() => setBadgeQuoteSettingsLocal(getDefaultBadgeQuoteSettings())}>
                              Reset to defaults
                            </Button>
                          </div>
                        </>
                      );
                    })()}
                    </CardContent>
                  </Card>
                </FadeInUp>
                </TabsContent>
              </Tabs>
            </>
          )}
        </TabsContent>

        <TabsContent value="management" className="mt-5 space-y-5 sm:space-y-6">

      {isOwner && (
        <FadeInUp>
          <Card className="border-0 bg-gradient-to-br from-blue-500/[0.08] via-background to-blue-900/[0.04] overflow-hidden relative" data-testid="card-daily-checkups">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-blue-500/[0.04] -translate-y-12 translate-x-12" />
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-400" />
                </div>
                Daily Checkups
                <Badge className={`ml-auto text-xs ${checkupConfig?.enabled !== false ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-red-500/15 text-red-400 border border-red-500/20"}`}>
                  {checkupConfig?.enabled !== false ? "Active" : "Disabled"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div>
                  <p className="text-sm font-medium">Global Daily Checkups</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Enable or disable checkups for all orders system-wide</p>
                </div>
                <Switch
                  checked={checkupConfig?.enabled !== false}
                  onCheckedChange={(checked) => toggleGlobalCheckupsMutation.mutate(checked)}
                  disabled={toggleGlobalCheckupsMutation.isPending}
                  data-testid="switch-global-checkups"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-medium">Per-Order Overrides</p>
                  <Badge className="bg-white/5 text-muted-foreground border border-white/10 text-xs">
                    {checkupConfig?.skippedOrders?.length || 0} skipped
                  </Badge>
                </div>
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by order ID or MGT #..."
                    value={checkupOrderSearch}
                    onChange={(e) => setCheckupOrderSearch(e.target.value)}
                    className="pl-8 h-8 text-sm bg-background/50 border-white/10"
                    data-testid="input-checkup-order-search"
                  />
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {(() => {
                    const activeOrders = (allOrders || []).filter((o: any) =>
                      o.status === "In Progress" || o.status === "Open" || o.status === "Bidding Open" || o.status === "Bidding Closed" || o.status === "Need Replacement"
                    );
                    const filtered = checkupOrderSearch.trim()
                      ? activeOrders.filter((o: any) => {
                          const q = checkupOrderSearch.toLowerCase();
                          return o.id.toLowerCase().includes(q) || (o.mgtOrderNumber && String(o.mgtOrderNumber).includes(q));
                        })
                      : activeOrders;
                    if (filtered.length === 0) return <p className="text-xs text-muted-foreground py-2">No active orders found</p>;
                    return filtered.slice(0, 20).map((order: any) => {
                      const isSkipped = checkupConfig?.skippedOrders?.includes(order.id);
                      const assignedGrinder = order.assignedGrinderId ? allGrinders.find((g: any) => g.id === order.assignedGrinderId) : null;
                      return (
                        <div key={order.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] text-xs" data-testid={`row-checkup-order-${order.id}`}>
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className="text-primary font-medium">{order.mgtOrderNumber ? `#${order.mgtOrderNumber}` : order.id}</span>
                            <Badge className="text-[10px] px-1.5 py-0 bg-white/5 text-muted-foreground border border-white/10">{order.status}</Badge>
                            {assignedGrinder && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-cyan-400">
                                <UserPlus className="w-2.5 h-2.5" />
                                {assignedGrinder.name}
                              </span>
                            )}
                            {order.discordTicketChannelId && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-purple-400">
                                <Hash className="w-2.5 h-2.5" />
                                Ticket
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[10px] ${isSkipped ? "text-red-400" : "text-emerald-400"}`}>
                              {isSkipped ? "Skipped" : "Active"}
                            </span>
                            <Switch
                              checked={!isSkipped}
                              onCheckedChange={(checked) => toggleOrderCheckupMutation.mutate({ orderId: order.id, skip: !checked })}
                              disabled={toggleOrderCheckupMutation.isPending}
                              className="scale-75"
                              data-testid={`switch-checkup-${order.id}`}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeInUp>
      )}

      <FadeInUp>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-0 bg-gradient-to-br from-amber-500/[0.08] via-background to-amber-900/[0.04] overflow-hidden relative" data-testid="card-elite-requests">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-amber-500/[0.04] -translate-y-12 translate-x-12" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Crown className="w-4 h-4 text-amber-400" />
              </div>
              Elite Requests
              {eliteRequestsList && (
                <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 ml-auto text-xs">
                  {eliteRequestsList.filter((r: any) => r.status === "Pending").length} pending
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {(!eliteRequestsList || eliteRequestsList.length === 0) && (
                <div className="py-6 text-center text-muted-foreground text-sm rounded-xl bg-white/[0.02]" data-testid="text-no-elite-requests">
                  <Crown className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No elite requests
                </div>
              )}
              {(eliteRequestsList || []).map((req: any) => {
                const grinder = allGrinders.find(g => g.id === req.grinderId);
                return (
                  <div key={req.id} className={`p-3 rounded-xl border ${req.status === "Pending" ? "border-amber-500/20 bg-amber-500/[0.03]" : "border-white/[0.06] bg-white/[0.02]"}`} data-testid={`card-elite-req-${req.id}`}>
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-medium">{grinder?.name || req.grinderId}</span>
                      <Badge className={
                        req.status === "Approved" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" :
                        req.status === "Denied" ? "bg-red-500/15 text-red-400 border border-red-500/20" :
                        "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                      }>{req.status}</Badge>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 text-[10px] text-muted-foreground mb-2">
                      <div className="text-center p-1.5 rounded-lg bg-white/[0.03]"><p className="font-bold text-foreground">{req.completedOrders ?? grinder?.completedOrders ?? 0}</p>Orders</div>
                      <div className="text-center p-1.5 rounded-lg bg-white/[0.03]"><p className="font-bold text-foreground">{Number(req.winRate ?? grinder?.winRate ?? 0).toFixed(0)}%</p>Win Rate</div>
                      <div className="text-center p-1.5 rounded-lg bg-white/[0.03]"><p className="font-bold text-foreground">{req.avgQualityRating ? (Number(req.avgQualityRating) / 20).toFixed(1) : "N/A"}/5</p>Quality</div>
                      <div className="text-center p-1.5 rounded-lg bg-white/[0.03]"><p className="font-bold text-foreground">{Number(req.onTimeRate ?? 0).toFixed(0)}%</p>On-Time</div>
                      <div className="text-center p-1.5 rounded-lg bg-white/[0.03]"><p className="font-bold text-foreground">{req.strikes ?? grinder?.strikes ?? 0}</p>Strikes</div>
                    </div>
                    {req.decisionNotes && <p className="text-xs text-muted-foreground italic mb-2">{req.decisionNotes}</p>}
                    {req.status === "Pending" && (
                      <div className="flex items-center gap-2">
                        <Button size="sm" className="text-xs bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20" data-testid={`button-approve-elite-${req.id}`}
                          disabled={eliteReqMutation.isPending}
                          onClick={() => eliteReqMutation.mutate({ id: req.id, status: "Approved" })}>
                          Approve
                        </Button>
                        <Button size="sm" className="text-xs bg-red-500/15 text-red-400 border border-red-500/20" data-testid={`button-deny-elite-${req.id}`}
                          disabled={eliteReqMutation.isPending}
                          onClick={() => { setDenyEliteReqId(req.id); setDenyEliteReason(""); setDenyEliteDialogOpen(true); }}>
                          Deny
                        </Button>
                      </div>
                    )}
                    {req.status === "Denied" && req.decisionNotes && (
                      <p className="text-xs text-red-400/70 mt-2 italic">Reason: {req.decisionNotes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Dialog open={denyEliteDialogOpen} onOpenChange={setDenyEliteDialogOpen}>
          <DialogContent className="border-white/10 bg-background/95 backdrop-blur-xl sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="font-display text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-red-400" />
                </div>
                Deny Elite Request
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reason for denial (visible to grinder)</label>
                <Textarea
                  value={denyEliteReason}
                  onChange={(e) => setDenyEliteReason(e.target.value)}
                  placeholder="e.g. Need more completed orders, improve on-time rate..."
                  className="mt-1.5 bg-background/50 border-white/10 min-h-[80px]"
                  data-testid="textarea-deny-elite-reason"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDenyEliteDialogOpen(false)} className="border-white/10">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25"
                  disabled={eliteReqMutation.isPending}
                  data-testid="button-confirm-deny-elite"
                  onClick={() => {
                    eliteReqMutation.mutate(
                      { id: denyEliteReqId, status: "Denied", decisionNotes: denyEliteReason.trim() || undefined },
                      { onSuccess: () => setDenyEliteDialogOpen(false) }
                    );
                  }}
                >
                  {eliteReqMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deny Request"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={rejectPayoutDetailDialogOpen} onOpenChange={setRejectPayoutDetailDialogOpen}>
          <DialogContent className="border-white/10 bg-background/95 backdrop-blur-xl sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="font-display text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-red-400" />
                </div>
                Reject Payout Detail Change Request
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reason (optional, visible to creator)</label>
                <Textarea
                  value={rejectPayoutDetailReason}
                  onChange={(e) => setRejectPayoutDetailReason(e.target.value)}
                  placeholder="e.g. Invalid email, use business account..."
                  className="mt-1.5 bg-background/50 border-white/10 min-h-[80px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setRejectPayoutDetailDialogOpen(false)} className="border-white/10">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25"
                  disabled={payoutDetailRequestMutation.isPending}
                  onClick={() => payoutDetailRequestMutation.mutate({ id: rejectPayoutDetailReqId, action: "reject", rejectionReason: rejectPayoutDetailReason.trim() || undefined })}
                >
                  {payoutDetailRequestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reject Request"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!assignCreatorBadgeCreator} onOpenChange={(open) => { if (!open) { setAssignCreatorBadgeCreator(null); setAssignCreatorBadgeId(""); setAssignCreatorBadgeNote(""); } }}>
          <DialogContent className="border-white/10 bg-background/95 backdrop-blur-xl sm:max-w-[420px]" data-testid="dialog-assign-creator-badge">
            <DialogHeader>
              <DialogTitle className="font-display text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-emerald-400" />
                Assign Creator Badge
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Assign a manual badge to {assignCreatorBadgeCreator?.displayName ?? "creator"} ({assignCreatorBadgeCreator?.code ?? ""}).
              </p>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Badge</label>
                <Select value={assignCreatorBadgeId} onValueChange={setAssignCreatorBadgeId}>
                  <SelectTrigger className="mt-1.5 bg-background/50 border-white/10">
                    <SelectValue placeholder="Select a badge..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CREATOR_MANUAL_BADGE_IDS.map((id) => {
                      const meta = CREATOR_BADGE_META[id];
                      return (
                        <SelectItem key={id} value={id}>
                          {meta?.label ?? id}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Note (optional)</label>
                <Input
                  value={assignCreatorBadgeNote}
                  onChange={(e) => setAssignCreatorBadgeNote(e.target.value)}
                  placeholder="e.g. Top promoter Q1"
                  className="mt-1.5 bg-background/50 border-white/10"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setAssignCreatorBadgeCreator(null); setAssignCreatorBadgeId(""); setAssignCreatorBadgeNote(""); }} className="border-white/10">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25"
                  disabled={!assignCreatorBadgeId || assignCreatorBadgeMutation.isPending}
                  onClick={() => assignCreatorBadgeCreator && assignCreatorBadgeMutation.mutate({ creatorId: assignCreatorBadgeCreator.id, badgeId: assignCreatorBadgeId, note: assignCreatorBadgeNote.trim() || undefined })}
                  data-testid="button-submit-assign-creator-badge"
                >
                  {assignCreatorBadgeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="border-0 bg-gradient-to-br from-red-500/[0.08] via-background to-red-900/[0.04] overflow-hidden relative" data-testid="card-strike-management">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-red-500/[0.04] -translate-y-12 translate-x-12" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              Strike Management
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-3">
              <div className="space-y-2">
                <Select value={strikeGrinderId} onValueChange={setStrikeGrinderId}>
                  <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-strike-grinder">
                    <SelectValue placeholder="Select grinder" />
                  </SelectTrigger>
                  <SelectContent>
                    {allGrinders.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name} ({g.strikes} strikes)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Reason for strike action"
                  value={strikeReason}
                  onChange={(e) => setStrikeReason(e.target.value)}
                  className="bg-background/50 border-white/10"
                  data-testid="input-strike-reason"
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" className="text-xs bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20"
                    data-testid="button-add-strike"
                    disabled={!strikeGrinderId || !strikeReason || strikeMutation.isPending}
                    onClick={() => { strikeMutation.mutate({ grinderId: strikeGrinderId, action: "add", reason: strikeReason }); setStrikeReason(""); }}>
                    Add Strike
                  </Button>
                  <Button size="sm" className="text-xs bg-white/[0.05] text-muted-foreground border border-white/10 hover:bg-white/10"
                    data-testid="button-remove-strike"
                    disabled={!strikeGrinderId || !strikeReason || strikeMutation.isPending}
                    onClick={() => { strikeMutation.mutate({ grinderId: strikeGrinderId, action: "remove", reason: strikeReason }); setStrikeReason(""); }}>
                    Remove Strike
                  </Button>
                </div>
              </div>
              {allGrinders.filter(g => g.suspended).length > 0 && (
                <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/[0.05] space-y-2">
                  <p className="text-xs font-semibold text-red-400 flex items-center gap-1"><Ban className="w-3 h-3" /> Suspended Grinders</p>
                  {allGrinders.filter(g => g.suspended).map(g => (
                    <div key={g.id} className="flex items-center justify-between gap-2 text-xs p-2 rounded-lg bg-red-500/[0.05]" data-testid={`row-suspended-${g.id}`}>
                      <span className="font-medium truncate">{g.name}</span>
                      <span className="text-red-400 font-bold">${parseFloat(g.outstandingFine || "0").toFixed(2)}</span>
                      <Button size="sm" className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        data-testid={`button-pay-fine-${g.id}`}
                        disabled={finePayMutation.isPending}
                        onClick={() => finePayMutation.mutate(g.id)}>
                        Mark Paid
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(!strikeLogsList || strikeLogsList.length === 0) && <p className="text-muted-foreground text-xs py-3 text-center" data-testid="text-no-strike-logs">No strike logs</p>}
                {(strikeLogsList || []).slice(0, 10).map((log: any) => {
                  const grinder = allGrinders.find(g => g.id === log.grinderId);
                  return (
                    <div key={log.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs" data-testid={`card-strike-${log.id}`}>
                      <Badge className={log.action === "add" ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"} variant="outline">
                        {log.action === "add" ? "+" : "-"}
                      </Badge>
                      <span className="font-medium flex-1 truncate">{grinder?.name || log.grinderId}</span>
                      {parseFloat(log.fineAmount || "0") > 0 && (
                        <Badge className={log.finePaid ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px]" : "bg-red-500/10 text-red-400 border border-red-500/20 text-[9px]"}>
                          ${parseFloat(log.fineAmount).toFixed(0)} {log.finePaid ? "Paid" : "Owed"}
                        </Badge>
                      )}
                      <span className="text-muted-foreground truncate max-w-[100px]">{log.reason}</span>
                      <span className="text-muted-foreground text-[10px]">{new Date(log.createdAt).toLocaleDateString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </FadeInUp>

      {strikeAppeals.length > 0 && (
        <FadeInUp>
          <Card className="border-0 bg-gradient-to-br from-violet-500/[0.08] via-background to-violet-900/[0.04] overflow-hidden relative" data-testid="card-strike-appeals">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-violet-500/[0.04] -translate-y-12 translate-x-12" />
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                  <Gavel className="w-4 h-4 text-violet-400" />
                </div>
                Strike Appeals
                {strikeAppeals.filter((a: any) => a.status === "pending").length > 0 && (
                  <Badge className="bg-violet-500/15 text-violet-400 border border-violet-500/20 ml-auto text-xs animate-pulse">
                    {strikeAppeals.filter((a: any) => a.status === "pending").length} pending
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {strikeAppeals.map((appeal: any) => {
                  const grinder = allGrinders.find((g: any) => g.id === appeal.grinderId);
                  const strikeLog = (strikeLogsList || []).find((l: any) => l.id === appeal.strikeLogId);
                  const isReviewing = appealReviewId === appeal.id;
                  return (
                    <div
                      key={appeal.id}
                      className={`p-3 rounded-xl border ${
                        appeal.status === "pending" ? "bg-violet-500/[0.04] border-violet-500/15" :
                        appeal.status === "approved" ? "bg-emerald-500/[0.04] border-emerald-500/15 opacity-60" :
                        "bg-red-500/[0.04] border-red-500/15 opacity-60"
                      }`}
                      data-testid={`card-appeal-${appeal.id}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold">{grinder?.name || appeal.grinderId}</span>
                            <Badge className={`text-[10px] ${
                              appeal.status === "pending" ? "bg-violet-500/20 text-violet-400 border-violet-500/20" :
                              appeal.status === "approved" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" :
                              "bg-red-500/20 text-red-400 border-red-500/20"
                            }`}>
                              {appeal.status === "pending" ? "Pending" : appeal.status === "approved" ? "Approved" : "Denied"}
                            </Badge>
                          </div>
                          {strikeLog && (
                            <div className="mt-1.5 p-2 rounded-lg bg-red-500/[0.04] border border-red-500/10">
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium text-red-400">Original strike:</span> {strikeLog.reason}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Fine: ${parseFloat(strikeLog.fineAmount || "0").toFixed(2)} — {new Date(strikeLog.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          <div className="mt-1.5">
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">Appeal reason:</span> {appeal.reason}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Submitted {new Date(appeal.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {appeal.reviewNote && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              <span className="font-medium">Staff note:</span> {appeal.reviewNote} — {appeal.reviewedByName}
                            </p>
                          )}
                        </div>
                      </div>
                      {appeal.status === "pending" && (
                        <div className="mt-3 space-y-2">
                          {isReviewing ? (
                            <>
                              <Textarea
                                value={appealReviewNote}
                                onChange={(e) => setAppealReviewNote(e.target.value)}
                                placeholder="Review note (optional for approval, recommended for denial)"
                                className="bg-background/50 border-white/10 min-h-[60px] resize-none text-xs"
                                data-testid={`textarea-appeal-note-${appeal.id}`}
                              />
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  className="text-xs bg-gradient-to-r from-emerald-600 to-emerald-500 text-white gap-1"
                                  disabled={appealReviewMutation.isPending}
                                  onClick={() => appealReviewMutation.mutate({ id: appeal.id, status: "approved", reviewNote: appealReviewNote })}
                                  data-testid={`button-approve-appeal-${appeal.id}`}
                                >
                                  {appealReviewMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                  Approve & Remove Strike
                                </Button>
                                <Button
                                  size="sm"
                                  className="text-xs bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 gap-1"
                                  disabled={appealReviewMutation.isPending}
                                  onClick={() => appealReviewMutation.mutate({ id: appeal.id, status: "denied", reviewNote: appealReviewNote })}
                                  data-testid={`button-deny-appeal-${appeal.id}`}
                                >
                                  {appealReviewMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                                  Deny
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs text-muted-foreground"
                                  onClick={() => { setAppealReviewId(null); setAppealReviewNote(""); }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-violet-500/20 text-violet-400 hover:bg-violet-500/10 gap-1"
                              onClick={() => { setAppealReviewId(appeal.id); setAppealReviewNote(""); }}
                              data-testid={`button-review-appeal-${appeal.id}`}
                            >
                              <Gavel className="w-3 h-3" />
                              Review Appeal
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </FadeInUp>
      )}

      {finePayments.length > 0 && (
        <FadeInUp>
          <Card className="border-0 bg-gradient-to-br from-emerald-500/[0.08] via-background to-emerald-900/[0.04] overflow-hidden relative" data-testid="card-fine-payments-review">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-emerald-500/[0.04] -translate-y-12 translate-x-12" />
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                Fine Payment Submissions
                {finePayments.filter((fp: any) => fp.status === "pending").length > 0 && (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 ml-auto text-xs animate-pulse">
                    {finePayments.filter((fp: any) => fp.status === "pending").length} pending
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {finePayments.map((fp: any) => {
                  const grinder = allGrinders.find((g: any) => g.id === fp.grinderId);
                  const isReviewing = fineReviewId === fp.id;
                  return (
                    <div
                      key={fp.id}
                      className={`p-3 rounded-xl border ${
                        fp.status === "pending" ? "bg-emerald-500/[0.04] border-emerald-500/15" :
                        fp.status === "approved" ? "bg-emerald-500/[0.04] border-emerald-500/15 opacity-60" :
                        "bg-red-500/[0.04] border-red-500/15 opacity-60"
                      }`}
                      data-testid={`card-fine-payment-review-${fp.id}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold">{grinder?.name || fp.grinderId}</span>
                            <Badge className={`text-[10px] ${
                              fp.status === "pending" ? "bg-amber-500/20 text-amber-400 border-amber-500/20" :
                              fp.status === "approved" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" :
                              "bg-red-500/20 text-red-400 border-red-500/20"
                            }`}>
                              {fp.status === "pending" ? "Pending" : fp.status === "approved" ? "Approved" : "Denied"}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] border-white/10">
                              {fp.paymentMethod}
                            </Badge>
                          </div>
                          <div className="mt-1.5 flex items-center gap-3">
                            <p className="text-sm font-bold text-emerald-400">${parseFloat(fp.amount).toFixed(2)}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-6 px-2 text-blue-400 hover:text-blue-300 gap-1"
                              onClick={() => setViewFineProofUrl(fp.proofUrl)}
                              data-testid={`button-view-fine-proof-${fp.id}`}
                            >
                              <Search className="w-3 h-3" />
                              View Proof
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Submitted {new Date(fp.createdAt).toLocaleString()}
                          </p>
                          {fp.reviewNote && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              <span className="font-medium">Staff note:</span> {fp.reviewNote} — {fp.reviewedByName}
                            </p>
                          )}
                        </div>
                      </div>
                      {fp.status === "pending" && (
                        <div className="mt-3 space-y-2">
                          {isReviewing ? (
                            <>
                              <Textarea
                                value={fineReviewNote}
                                onChange={(e) => setFineReviewNote(e.target.value)}
                                placeholder="Review note (optional)"
                                className="bg-background/50 border-white/10 min-h-[60px] resize-none text-xs"
                                data-testid={`textarea-fine-review-note-${fp.id}`}
                              />
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  className="text-xs bg-gradient-to-r from-emerald-600 to-emerald-500 text-white gap-1"
                                  disabled={fineReviewMutation.isPending}
                                  onClick={() => fineReviewMutation.mutate({ id: fp.id, status: "approved", reviewNote: fineReviewNote })}
                                  data-testid={`button-approve-fine-payment-${fp.id}`}
                                >
                                  {fineReviewMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                  Approve & Clear Fine
                                </Button>
                                <Button
                                  size="sm"
                                  className="text-xs bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 gap-1"
                                  disabled={fineReviewMutation.isPending}
                                  onClick={() => fineReviewMutation.mutate({ id: fp.id, status: "denied", reviewNote: fineReviewNote })}
                                  data-testid={`button-deny-fine-payment-${fp.id}`}
                                >
                                  {fineReviewMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                                  Deny
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs text-muted-foreground"
                                  onClick={() => { setFineReviewId(null); setFineReviewNote(""); }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 gap-1"
                              onClick={() => { setFineReviewId(fp.id); setFineReviewNote(""); }}
                              data-testid={`button-review-fine-payment-${fp.id}`}
                            >
                              <Gavel className="w-3 h-3" />
                              Review Payment
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </FadeInUp>
      )}

      <Dialog open={!!viewFineProofUrl} onOpenChange={(open) => { if (!open) setViewFineProofUrl(null); }}>
        <DialogContent className="border-white/10 bg-background/95 backdrop-blur-xl sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Search className="w-4 h-4 text-blue-400" />
              </div>
              Fine Payment Proof
            </DialogTitle>
          </DialogHeader>
          {viewFineProofUrl && (
            <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
              {viewFineProofUrl.endsWith(".pdf") ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">PDF document</p>
                  <a href={viewFineProofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">
                    Open PDF in new tab
                  </a>
                </div>
              ) : (
                <img src={viewFineProofUrl} alt="Payment proof" className="w-full max-h-[70vh] object-contain bg-black/20" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <FadeInUp>
      <Card className="border-0 bg-gradient-to-br from-purple-500/[0.08] via-background to-purple-900/[0.04] overflow-hidden relative" data-testid="card-order-limits">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-purple-500/[0.03] -translate-y-16 translate-x-16" />
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            Grinder Order Limits
            <Badge className="bg-purple-500/15 text-purple-400 border border-purple-500/20 ml-auto text-xs">{pluralize(allGrinders.length, "grinder")}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {allGrinders.map(g => (
              <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] sm:hover:bg-white/[0.05] transition-colors" data-testid={`row-limit-${g.id}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{g.name}</span>
                    {g.suspended && <Badge className="bg-red-500/15 text-red-400 border border-red-500/20 text-[9px]"><Ban className="w-2.5 h-2.5 mr-0.5" />Suspended</Badge>}
                    {!(g as any).rulesAccepted && <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[9px]">Rules Pending</Badge>}
                    {((g as any).roles as string[] | null)?.length ? ((g as any).roles as string[]).map((r: string) => (
                      <Badge key={r} variant="outline" className={`text-[10px] ${
                        r === "Elite Grinder" ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/10" :
                        r === "VC Grinder" ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10" :
                        r === "Event Grinder" ? "border-blue-500/30 text-blue-400 bg-blue-500/10" :
                        r === "International Grinder" ? "border-pink-500/30 text-pink-400 bg-pink-500/10" :
                        r === "Xbox Grinder" ? "border-green-500/30 text-green-400 bg-green-500/10" :
                        r === "PS5 Grinder" ? "border-blue-600/30 text-blue-400 bg-blue-600/10" :
                        "border-purple-500/30 text-purple-400 bg-purple-500/10"
                      }`}>{r}</Badge>
                    )) : (
                      <Badge variant="outline" className="text-[10px] bg-white/[0.03]">{g.category}</Badge>
                    )}
                    {g.tier && g.tier !== "New" && (
                      <Badge variant="outline" className={`text-[9px] ${
                        g.tier === "Diamond" ? "border-cyan-500/30 text-cyan-300 bg-cyan-500/10" :
                        g.tier === "Elite" ? "border-amber-500/30 text-amber-300 bg-amber-500/10" :
                        g.tier === "Gold" ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10" :
                        g.tier === "Silver" ? "border-slate-400/30 text-slate-300 bg-slate-400/10" :
                        g.tier === "Bronze" ? "border-orange-500/30 text-orange-400 bg-orange-500/10" :
                        "border-white/10 text-muted-foreground"
                      }`}>{g.tier}</Badge>
                    )}
                    <Badge className={`text-[10px] border ${
                      (g as any).availabilityStatus === "busy" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" :
                      (g as any).availabilityStatus === "away" ? "bg-orange-500/15 text-orange-400 border-orange-500/20" :
                      (g as any).availabilityStatus === "offline" ? "bg-red-500/15 text-red-400 border-red-500/20" :
                      "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                    }`}>
                      {(g as any).availabilityStatus || "available"}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {g.activeOrders} active / {g.capacity} limit
                    {(g as any).availabilityNote && ` · ${(g as any).availabilityNote}`}
                  </span>
                </div>
                {editLimitGrinderId === g.id ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      className="w-16 text-xs bg-background/50 border-white/10"
                      value={editLimitValue}
                      onChange={(e) => setEditLimitValue(e.target.value)}
                      data-testid={`input-limit-${g.id}`}
                    />
                    <Button size="icon" variant="ghost"
                      data-testid={`button-save-limit-${g.id}`}
                      disabled={!editLimitValue || updateLimitMutation.isPending}
                      onClick={() => updateLimitMutation.mutate({ grinderId: g.id, capacity: parseInt(editLimitValue) })}>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    </Button>
                    <Button size="icon" variant="ghost"
                      onClick={() => { setEditLimitGrinderId(""); setEditLimitValue(""); }}>
                      <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${g.activeOrders >= g.capacity ? "text-red-400" : "text-emerald-400"}`}>{g.capacity}</span>
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground hover:text-purple-400"
                      data-testid={`button-edit-limit-${g.id}`}
                      onClick={() => { setEditLimitGrinderId(g.id); setEditLimitValue(String(g.capacity)); }}>
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </FadeInUp>

      {(isOwner || user?.role === "staff") && (
        <FadeInUp>
        <Card className="border-0 bg-gradient-to-br from-amber-500/[0.06] via-background to-background overflow-hidden relative" data-testid="card-owner-profiles">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-amber-500/[0.03] -translate-y-16 translate-x-16" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              Edit Grinder Profiles
              <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 ml-auto text-xs">{allGrinders.filter(g => !g.isRemoved).length} active · {allGrinders.filter(g => g.isRemoved).length} removed</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {allGrinders.map(g => (
                <div key={g.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${g.isRemoved ? "bg-red-500/[0.03] border-red-500/10 opacity-60" : "bg-white/[0.03] border-white/[0.06] sm:hover:bg-white/[0.05]"}`} data-testid={`row-profile-${g.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-medium ${g.isRemoved ? "line-through text-muted-foreground" : ""}`}>{g.name}</span>
                      {g.isRemoved && <Badge className="bg-red-500/15 text-red-400 border border-red-500/20 text-[10px]">Removed</Badge>}
                      {((g as any).roles as string[] | null)?.length ? ((g as any).roles as string[]).map((r: string) => (
                        <Badge key={r} variant="outline" className={`text-[10px] ${
                          r === "Elite Grinder" ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/10" :
                          r === "VC Grinder" ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10" :
                          r === "Event Grinder" ? "border-blue-500/30 text-blue-400 bg-blue-500/10" :
                          r === "International Grinder" ? "border-pink-500/30 text-pink-400 bg-pink-500/10" :
                          r === "Xbox Grinder" ? "border-green-500/30 text-green-400 bg-green-500/10" :
                          r === "PS5 Grinder" ? "border-blue-600/30 text-blue-400 bg-blue-600/10" :
                          "border-purple-500/30 text-purple-400 bg-purple-500/10"
                        }`}>{r}</Badge>
                      )) : (
                        <Badge variant="outline" className="text-[10px] bg-white/[0.03]">{g.category}</Badge>
                      )}
                      {g.tier && g.tier !== "New" && (
                        <Badge variant="outline" className={`text-[9px] ${
                          g.tier === "Diamond" ? "border-cyan-500/30 text-cyan-300 bg-cyan-500/10" :
                          g.tier === "Elite" ? "border-amber-500/30 text-amber-300 bg-amber-500/10" :
                          g.tier === "Gold" ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10" :
                          g.tier === "Silver" ? "border-slate-400/30 text-slate-300 bg-slate-400/10" :
                          g.tier === "Bronze" ? "border-orange-500/30 text-orange-400 bg-orange-500/10" :
                          "border-white/10 text-muted-foreground"
                        }`}>{g.tier}</Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {pluralize(g.activeOrders, 'order')}/{g.capacity} · {g.completedOrders} completed · {pluralize(g.strikes, 'strike')}
                      </span>
                    </div>
                    {g.isRemoved && g.removedAt && <p className="text-[10px] text-red-400/60 mt-0.5">Removed {new Date(g.removedAt).toLocaleDateString()}</p>}
                    {g.notes && !g.isRemoved && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{g.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    {g.isRemoved ? (
                      <Button size="sm" variant="ghost" className="text-green-400 text-xs hover:bg-green-500/10"
                        data-testid={`button-restore-grinder-${g.id}`}
                        onClick={() => {
                          updateProfileMutation.mutate({ grinderId: g.id, data: { isRemoved: false, removedAt: null, removedBy: null, availabilityStatus: "available" } });
                          toast({ title: `${g.name} has been restored` });
                        }}>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Restore
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" variant="ghost" className="text-amber-400 text-xs hover:bg-amber-500/10"
                          data-testid={`button-edit-profile-${g.id}`}
                          onClick={() => {
                            setEditProfileGrinder(g);
                            setEditProfileName(g.name);
                            const roles = (g as any).roles as string[] | null;
                            setEditProfileRoles(roles && roles.length > 0 ? roles : [g.category || "Grinder"]);
                            setEditProfileCapacity(String(g.capacity));
                            setEditProfileNotes(g.notes || "");
                            setEditProfileTwitch(g.twitchUsername || "");
                            setEditProfileDisplayRole(g.displayRole || "");
                          }}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-400 text-xs hover:text-red-300 hover:bg-red-500/10"
                          data-testid={`button-remove-grinder-${g.id}`}
                          onClick={() => setRemoveGrinder(g)}>
                          <Ban className="w-3 h-3 mr-1" />
                          Remove
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </FadeInUp>
      )}

      <Dialog open={!!editProfileGrinder} onOpenChange={(open) => !open && setEditProfileGrinder(null)}>
        <DialogContent className="border-white/10 bg-background/95 backdrop-blur-xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              Edit Profile: {editProfileGrinder?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Display Name</label>
              <Input value={editProfileName} onChange={(e) => setEditProfileName(e.target.value)} className="bg-background/50 border-white/10" data-testid="input-profile-name" />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Roles (select multiple)</label>
              <div className="flex flex-wrap gap-2">
                {["Grinder", "Elite Grinder", "VC Grinder", "Event Grinder", "International Grinder", "Xbox Grinder", "PS5 Grinder"].map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setEditProfileRoles(prev => {
                      const next = prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role];
                      if (!next.includes(editProfileDisplayRole)) setEditProfileDisplayRole("");
                      return next;
                    })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      editProfileRoles.includes(role)
                        ? (role === "Elite Grinder" ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/10" :
                           role === "VC Grinder" ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10" :
                           role === "Event Grinder" ? "border-blue-500/30 text-blue-400 bg-blue-500/10" :
                           role === "International Grinder" ? "border-pink-500/30 text-pink-400 bg-pink-500/10" :
                           role === "Xbox Grinder" ? "border-green-500/30 text-green-400 bg-green-500/10" :
                           role === "PS5 Grinder" ? "border-blue-600/30 text-blue-400 bg-blue-600/10" :
                           "border-purple-500/30 text-purple-400 bg-purple-500/10") + " ring-1 ring-white/20"
                        : "border-white/[0.06] text-muted-foreground bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                    data-testid={`toggle-admin-role-${role.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {editProfileRoles.length > 1 && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Display Icon</label>
                <div className="flex flex-wrap gap-2">
                  {editProfileRoles.map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setEditProfileDisplayRole(role)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                        (editProfileDisplayRole || editProfileRoles[0]) === role
                          ? "border-primary/50 text-primary bg-primary/10 ring-1 ring-primary/30"
                          : "border-white/[0.06] text-muted-foreground bg-white/[0.02] hover:bg-white/[0.05]"
                      }`}
                      data-testid={`toggle-display-role-${role.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      {categoryIcon(role)}
                      {role}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Choose which role icon appears on the grinder list</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1 block">Tier (auto-calculated)</label>
              <div className="h-9 flex items-center px-3 rounded-md bg-background/50 border border-white/10">
                <Badge variant="outline" className={`text-xs ${
                  editProfileGrinder?.tier === "Diamond" ? "border-cyan-500/30 text-cyan-300 bg-cyan-500/10" :
                  editProfileGrinder?.tier === "Elite" ? "border-amber-500/30 text-amber-300 bg-amber-500/10" :
                  editProfileGrinder?.tier === "Gold" ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10" :
                  editProfileGrinder?.tier === "Silver" ? "border-slate-400/30 text-slate-300 bg-slate-400/10" :
                  editProfileGrinder?.tier === "Bronze" ? "border-orange-500/30 text-orange-400 bg-orange-500/10" :
                  "border-white/10 text-muted-foreground bg-white/[0.04]"
                }`}>{editProfileGrinder?.tier || "New"}</Badge>
                <span className="text-[10px] text-muted-foreground ml-2">Updates automatically based on performance</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Order Limit</label>
                <Input type="number" min="1" max="20" value={editProfileCapacity} onChange={(e) => setEditProfileCapacity(e.target.value)} className="bg-background/50 border-white/10" data-testid="input-profile-capacity" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Twitch Username</label>
                <Input value={editProfileTwitch} onChange={(e) => setEditProfileTwitch(e.target.value)} placeholder="twitch_username" className="bg-background/50 border-white/10" data-testid="input-profile-twitch" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea value={editProfileNotes} onChange={(e) => setEditProfileNotes(e.target.value)} className="bg-background/50 border-white/10 resize-none" data-testid="input-profile-notes" />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-lg shadow-amber-500/20"
              data-testid="button-save-profile"
              disabled={updateProfileMutation.isPending || editProfileRoles.length === 0}
              onClick={() => {
                if (!editProfileGrinder) return;
                if (editProfileRoles.length === 0) {
                  toast({ title: "At least one role required", variant: "destructive" });
                  return;
                }
                const selectedDisplay = editProfileRoles.length > 1 ? (editProfileDisplayRole || editProfileRoles[0]) : null;
                updateProfileMutation.mutate({
                  grinderId: editProfileGrinder.id,
                  data: {
                    name: editProfileName,
                    roles: editProfileRoles,
                    category: editProfileRoles[0],
                    displayRole: selectedDisplay,
                    capacity: parseInt(editProfileCapacity),
                    notes: editProfileNotes || null,
                    twitchUsername: editProfileTwitch.trim() || null,
                  },
                });
              }}
            >
              {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!removeGrinder} onOpenChange={(open) => { if (!open) { setRemoveGrinder(null); setDeleteHistoricalData(false); } }}>
        <DialogContent className="border-red-500/20 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400 font-display">
              <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                <Ban className="w-4 h-4 text-red-400" />
              </div>
              Remove Grinder
            </DialogTitle>
          </DialogHeader>
          {removeGrinder && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Remove <span className="text-foreground font-medium">{removeGrinder.name}</span> from the system? This will revoke their dashboard access immediately.
              </p>

              <div className="space-y-3 rounded-lg border border-border/50 p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Historical Data</p>

                <label className="flex items-start gap-3 p-2.5 rounded-md border border-border/50 cursor-pointer hover:bg-muted/30 transition-colors" data-testid="option-preserve-history">
                  <input type="radio" name="deleteHistory" checked={!deleteHistoricalData} onChange={() => setDeleteHistoricalData(false)}
                    className="mt-0.5 accent-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Preserve historical data</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Keep all revenue, payouts, completed orders, bids, and performance records. The grinder will appear as inactive in reports.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-md border border-red-500/20 cursor-pointer hover:bg-red-500/5 transition-colors" data-testid="option-delete-history">
                  <input type="radio" name="deleteHistory" checked={deleteHistoricalData} onChange={() => setDeleteHistoricalData(true)}
                    className="mt-0.5 accent-red-500" />
                  <div>
                    <p className="text-sm font-medium text-red-400">Delete all historical data</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Permanently erase all records including assignments, payouts, bids, strikes, and earnings. This cannot be undone.</p>
                  </div>
                </label>
              </div>

              {deleteHistoricalData && (
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-300">This will permanently delete all of {removeGrinder.name}'s data including revenue records, payout history, and completed orders. This action cannot be reversed.</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Button
                  className={deleteHistoricalData
                    ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20"
                    : "bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/20"
                  }
                  data-testid="button-confirm-remove"
                  disabled={removeGrinderMutation.isPending}
                  onClick={() => removeGrinderMutation.mutate({ grinderId: removeGrinder.id, deleteHistory: deleteHistoricalData })}>
                  {removeGrinderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
                  {deleteHistoricalData ? "Delete Permanently" : "Remove Access"}
                </Button>
                <Button variant="ghost" onClick={() => { setRemoveGrinder(null); setDeleteHistoricalData(false); }}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <FadeInUp>
        <Card className="border-0 bg-gradient-to-br from-cyan-500/[0.08] via-background to-cyan-900/[0.04] overflow-hidden relative" data-testid="card-grinder-tasks">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-cyan-500/[0.04] -translate-y-12 translate-x-12" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-cyan-400" />
              </div>
              Send Task to Grinder
              {staffTasks.filter((t: any) => t.status === "pending").length > 0 && (
                <Badge className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 ml-auto text-xs">
                  {staffTasks.filter((t: any) => t.status === "pending").length} active
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Grinder</label>
                <Select value={taskGrinderId} onValueChange={setTaskGrinderId}>
                  <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-task-grinder">
                    <SelectValue placeholder="Select grinder" />
                  </SelectTrigger>
                  <SelectContent>
                    {allGrinders.filter((g: any) => !g.removedAt).map((g: any) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
                <Select value={taskPriority} onValueChange={setTaskPriority}>
                  <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Task Title</label>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Upload updated screenshot of progress"
                className="bg-background/50 border-white/10"
                data-testid="input-task-title"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description (optional)</label>
              <Textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Additional details about what needs to be done..."
                className="bg-background/50 border-white/10 min-h-[60px]"
                data-testid="textarea-task-description"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Link to Order (optional)</label>
              <Select value={taskOrderId} onValueChange={setTaskOrderId}>
                <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-task-order">
                  <SelectValue placeholder="No specific order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific order</SelectItem>
                  {allOrders.filter((o: any) => o.status !== "Completed" && o.status !== "Cancelled").map((o: any) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.mgtOrderNumber ? `#${o.mgtOrderNumber}` : o.id} — {o.serviceId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full gap-2 bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/25"
              disabled={!taskGrinderId || !taskTitle.trim() || sendTaskMutation.isPending}
              onClick={() => sendTaskMutation.mutate({
                grinderId: taskGrinderId,
                title: taskTitle.trim(),
                description: taskDescription.trim() || undefined,
                priority: taskPriority,
                orderId: taskOrderId && taskOrderId !== "none" ? taskOrderId : undefined,
              })}
              data-testid="button-send-task"
            >
              {sendTaskMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Task
            </Button>

            {staffTasks.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Recent Tasks</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {staffTasks.slice(0, 15).map((task: any) => {
                    const grinder = allGrinders.find((g: any) => g.id === task.grinderId);
                    return (
                      <div
                        key={task.id}
                        className={`flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs ${task.status === "completed" ? "opacity-50" : ""}`}
                        data-testid={`row-staff-task-${task.id}`}
                      >
                        {task.status === "completed" ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <ClipboardList className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        )}
                        <span className="text-primary font-medium truncate max-w-[120px]">{grinder?.name || task.grinderId}</span>
                        <span className="text-muted-foreground truncate flex-1">{task.title}</span>
                        {task.priority === "urgent" && <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-[10px] px-1.5">Urgent</Badge>}
                        {task.priority === "high" && <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-[10px] px-1.5">High</Badge>}
                        <Badge className={`text-[10px] px-1.5 ${task.status === "completed" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-muted-foreground border-white/10"}`}>
                          {task.status === "completed" ? "Done" : "Pending"}
                        </Badge>
                        {task.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400"
                            onClick={() => deleteTaskMutation.mutate(task.id)}
                            data-testid={`button-delete-task-${task.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeInUp>

      {replacedAssignments.length > 0 && (
        <FadeInUp>
        <Card className="border-0 bg-gradient-to-br from-orange-500/[0.06] via-background to-background overflow-hidden relative" data-testid="card-replacement-tracker">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-orange-500/[0.03] -translate-y-12 translate-x-12" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
                <Repeat className="w-4 h-4 text-orange-400" />
              </div>
              Replacement Tracker
              <Badge className="bg-orange-500/15 text-orange-400 border border-orange-500/20 ml-auto text-xs">{replacedAssignments.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <p className="text-lg font-bold text-orange-400">{replacedAssignments.length}</p>
                <p className="text-[10px] text-muted-foreground">Replacements</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <p className="text-lg font-bold text-amber-400">{replacementRate.toFixed(0)}%</p>
                <p className="text-[10px] text-muted-foreground">Rate</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <p className="text-lg font-bold text-red-400">{formatCurrency(totalOriginalGrinderPay)}</p>
                <p className="text-[10px] text-muted-foreground">Original Pay</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <p className="text-lg font-bold text-blue-400">{formatCurrency(totalReplacementGrinderPay)}</p>
                <p className="text-[10px] text-muted-foreground">Replacement Pay</p>
              </div>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {replacedAssignments.slice(0, 10).map(a => {
                const orig = allGrinders.find(g => g.id === a.originalGrinderId);
                const repl = allGrinders.find(g => g.id === a.grinderId);
                const order = allOrders.find(o => o.id === a.orderId);
                return (
                  <div key={a.id} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs" data-testid={`row-replacement-${a.id}`}>
                    <span className="text-primary font-medium shrink-0">{order?.mgtOrderNumber ? `#${order.mgtOrderNumber}` : a.orderId}</span>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-red-400 truncate">{orig?.name || "?"}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-blue-400 truncate">{repl?.name || "?"}</span>
                    </div>
                    <span className="text-muted-foreground sm:ml-auto truncate">{a.replacementReason || "No reason"}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        </FadeInUp>
      )}

        </TabsContent>

        {isOwner && (
          <TabsContent value="system" className="mt-5 space-y-5 sm:space-y-6">
            <FadeInUp>
              <Card className="border-0 bg-gradient-to-br from-violet-500/[0.08] via-background to-violet-900/[0.04] overflow-hidden relative" data-testid="card-bot-toggle">
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-violet-500/[0.04] -translate-y-12 translate-x-12" />
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-violet-400" />
                    </div>
                    MGT Bot Data Tracking
                    <Badge className={`ml-auto text-xs ${queueConfig?.mgtBotEnabled !== false ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-red-500/15 text-red-400 border border-red-500/20"}`}>
                      {queueConfig?.mgtBotEnabled !== false ? "Active" : "Disabled"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div>
                      <p className="text-sm font-medium">Linked Bot Data Tracking</p>
                      <p className="text-xs text-muted-foreground mt-0.5">When enabled, the MGT Discord bot automatically imports orders, assignments, and financials. When disabled, only manual orders are tracked.</p>
                    </div>
                    <Switch
                      checked={queueConfig?.mgtBotEnabled !== false}
                      onCheckedChange={(checked) => toggleBotMutation.mutate(checked)}
                      disabled={toggleBotMutation.isPending}
                      data-testid="switch-mgt-bot"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground px-1">
                    {queueConfig?.mgtBotEnabled !== false
                      ? "Bot is actively syncing order data from the MGT Discord server."
                      : "Bot sync is disabled. Only manually created orders will appear in the dashboard."}
                  </p>
                </CardContent>
              </Card>
            </FadeInUp>

            <FadeInUp>
              <Card className="border-0 bg-gradient-to-br from-blue-500/[0.08] via-background to-blue-900/[0.04] overflow-hidden relative" data-testid="card-customer-updates">
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-blue-500/[0.04] -translate-y-12 translate-x-12" />
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                    </div>
                    Customer Updates Pipeline
                    <Badge className={`ml-auto text-xs ${queueConfig?.customerUpdatesEnabled !== false ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-red-500/15 text-red-400 border border-red-500/20"}`}>
                      {queueConfig?.customerUpdatesEnabled !== false ? "Active" : "Disabled"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div>
                      <p className="text-sm font-medium">Customer Discord Updates</p>
                      <p className="text-xs text-muted-foreground mt-0.5">When enabled, the Discord bot sends automated updates to customers in their ticket channels about order progress, completion, and grinder activity.</p>
                    </div>
                    <Switch
                      checked={queueConfig?.customerUpdatesEnabled !== false}
                      onCheckedChange={(checked) => toggleCustomerUpdatesMutation.mutate(checked)}
                      disabled={toggleCustomerUpdatesMutation.isPending}
                      data-testid="switch-customer-updates"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground px-1">
                    {queueConfig?.customerUpdatesEnabled !== false
                      ? "Customer updates are active. Customers receive automated messages about their order status."
                      : "Customer updates are disabled. No automated messages will be sent to customers."}
                  </p>
                </CardContent>
              </Card>
            </FadeInUp>

            <FadeInUp>
              <Card className="border-0 bg-gradient-to-br from-pink-500/[0.08] via-background to-purple-900/[0.04] overflow-hidden relative" data-testid="card-holiday-theme">
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-pink-500/[0.04] -translate-y-12 translate-x-12" />
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/15 flex items-center justify-center">
                      <Palette className="w-4 h-4 text-pink-400" />
                    </div>
                    Holiday Theme
                    <Badge className={`ml-auto text-xs ${maintenanceConfig?.holidayTheme && maintenanceConfig.holidayTheme !== "none" ? "bg-pink-500/15 text-pink-400 border border-pink-500/20" : "bg-white/[0.06] text-muted-foreground border border-white/[0.08]"}`}>
                      {maintenanceConfig?.holidayTheme && maintenanceConfig.holidayTheme !== "none"
                        ? HOLIDAY_THEMES.find(t => t.value === maintenanceConfig.holidayTheme)?.label || maintenanceConfig.holidayTheme
                        : "Off"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-3">
                  <p className="text-xs text-muted-foreground">Apply a seasonal dark theme variation for US holidays. This changes the site's background tones and accent colors for all users.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {HOLIDAY_THEMES.map((theme) => {
                      const isActive = (maintenanceConfig?.holidayTheme || "none") === theme.value;
                      return (
                        <button
                          key={theme.value}
                          onClick={() => setHolidayThemeMutation.mutate(theme.value)}
                          disabled={setHolidayThemeMutation.isPending}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isActive
                              ? "border-pink-500/40 bg-pink-500/10 ring-1 ring-pink-500/20"
                              : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                          }`}
                          data-testid={`button-holiday-${theme.value}`}
                        >
                          <div className="flex items-center gap-2">
                            {theme.emoji && <span className="text-lg">{theme.emoji}</span>}
                            <span className={`text-xs font-medium ${isActive ? theme.color : "text-white/70"}`}>
                              {theme.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {maintenanceConfig?.holidayTheme && maintenanceConfig.holidayTheme !== "none" && (
                    <p className="text-[10px] text-muted-foreground px-1">
                      Currently active: {HOLIDAY_THEMES.find(t => t.value === maintenanceConfig.holidayTheme)?.emoji}{" "}
                      {HOLIDAY_THEMES.find(t => t.value === maintenanceConfig.holidayTheme)?.label}. All users will see this theme.
                    </p>
                  )}
                </CardContent>
              </Card>
            </FadeInUp>

            <FadeInUp>
              <Card className="border-0 bg-gradient-to-br from-cyan-500/[0.08] via-background to-cyan-900/[0.04] overflow-hidden relative" data-testid="card-early-access">
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-cyan-500/[0.04] -translate-y-12 translate-x-12" />
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    </div>
                    Elite Grinders Only Access
                    <Badge className={`ml-auto text-xs ${maintenanceConfig?.earlyAccessMode ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"}`}>
                      {maintenanceConfig?.earlyAccessMode ? "Active" : "Off"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div>
                      <p className="text-sm font-medium">Elite Grinders Only Access</p>
                      <p className="text-xs text-muted-foreground mt-0.5">When enabled, only Elite Grinders, Staff, and Owners can access the dashboard. Regular grinders and other roles are denied.</p>
                    </div>
                    <Switch
                      checked={maintenanceConfig?.earlyAccessMode || false}
                      onCheckedChange={(checked) => toggleEarlyAccessMutation.mutate(checked)}
                      disabled={toggleEarlyAccessMutation.isPending}
                      data-testid="switch-early-access"
                    />
                  </div>
                  {maintenanceConfig?.earlyAccessMode && (
                    <p className="text-[10px] text-cyan-400 px-1">
                      Elite access is ON. Only grinders with the Elite Grinder Discord role can log in. Staff and owners bypass this restriction.
                    </p>
                  )}
                </CardContent>
              </Card>
            </FadeInUp>

            <FadeInUp>
              <Card className="border-0 bg-gradient-to-br from-emerald-500/[0.08] via-background to-emerald-900/[0.04] overflow-hidden relative" data-testid="card-platform-management">
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-emerald-500/[0.04] -translate-y-12 translate-x-12" />
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                      <Gamepad2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    Platform Management
                    <Badge className="ml-auto text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      {activePlatforms.length} Active
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Manage the platform options available across all order forms and dropdowns. Add or remove platforms as your services change.
                  </p>
                  <div className="space-y-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex flex-wrap gap-2">
                      {activePlatforms.map((p) => (
                        <div key={p} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm font-medium text-emerald-400" data-testid={`platform-tag-${p}`}>
                          <Gamepad2 className="w-3 h-3" />
                          {p}
                          <button
                            onClick={() => {
                              const updated = activePlatforms.filter(x => x !== p);
                              if (updated.length === 0) { toast({ title: "At least one platform is required", variant: "destructive" }); return; }
                              setEditingPlatforms(updated);
                            }}
                            className="ml-1 hover:text-red-400 transition-colors"
                            data-testid={`button-remove-platform-${p}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newPlatform}
                        onChange={(e) => setNewPlatform(e.target.value)}
                        placeholder="Add new platform..."
                        className="bg-white/[0.04] border-white/[0.08] text-sm flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newPlatform.trim()) {
                            if (activePlatforms.includes(newPlatform.trim())) { toast({ title: "Platform already exists", variant: "destructive" }); return; }
                            setEditingPlatforms([...activePlatforms, newPlatform.trim()]);
                            setNewPlatform("");
                          }
                        }}
                        data-testid="input-new-platform"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                        onClick={() => {
                          if (!newPlatform.trim()) return;
                          if (activePlatforms.includes(newPlatform.trim())) { toast({ title: "Platform already exists", variant: "destructive" }); return; }
                          setEditingPlatforms([...activePlatforms, newPlatform.trim()]);
                          setNewPlatform("");
                        }}
                        data-testid="button-add-platform"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {editingPlatforms && (
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20"
                        onClick={() => updatePlatformsMutation.mutate(editingPlatforms)}
                        disabled={updatePlatformsMutation.isPending}
                        data-testid="button-save-platforms"
                      >
                        {updatePlatformsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        className="border-white/[0.08]"
                        onClick={() => { setEditingPlatforms(null); setNewPlatform(""); }}
                        data-testid="button-cancel-platforms"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </FadeInUp>

            {isImjustmar && (
              <FadeInUp>
                <Card className="border-0 bg-gradient-to-br from-amber-500/[0.08] via-background to-amber-900/[0.04] overflow-hidden relative" data-testid="card-maintenance-mode">
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-amber-500/[0.04] -translate-y-12 translate-x-12" />
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                        <Construction className="w-4 h-4 text-amber-400" />
                      </div>
                      Maintenance Mode
                      <Badge className={`ml-auto text-xs ${maintenanceConfig?.maintenanceMode ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"}`}>
                        {maintenanceConfig?.maintenanceMode ? "On" : "Off"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div>
                        <p className="text-sm font-medium">Site Maintenance Mode</p>
                        <p className="text-xs text-muted-foreground mt-0.5">When enabled, all users except you (imjustmar) will see a maintenance page instead of the dashboard.</p>
                      </div>
                      <Switch
                        checked={maintenanceConfig?.maintenanceMode || false}
                        onCheckedChange={(checked) => toggleMaintenanceMutation.mutate(checked)}
                        disabled={toggleMaintenanceMutation.isPending}
                        data-testid="switch-maintenance-mode"
                      />
                    </div>
                    {maintenanceConfig?.maintenanceMode && (
                      <p className="text-[10px] text-amber-400 px-1">
                        Maintenance mode is ON. All other users are blocked from accessing the site.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </FadeInUp>
            )}

            <FadeInUp>
              <Card className="border-0 bg-gradient-to-br from-primary/[0.08] via-background to-primary/[0.04] overflow-hidden relative" data-testid="card-site-alerts">
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-primary/[0.04] -translate-y-12 translate-x-12" />
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Megaphone className="w-4 h-4 text-primary" />
                    </div>
                    Site Alerts
                    {allSiteAlerts.filter((a: any) => a.enabled).length > 0 && (
                      <Badge className="ml-auto text-xs bg-primary/15 text-primary border border-primary/20">
                        {allSiteAlerts.filter((a: any) => a.enabled).length} Active
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <div className="space-y-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Alert Message</label>
                      <Textarea
                        value={alertMessage}
                        onChange={(e) => setAlertMessage(e.target.value)}
                        placeholder="Type your alert message..."
                        className="bg-white/[0.04] border-white/[0.08] resize-none text-sm"
                        rows={2}
                        data-testid="input-alert-message"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Send To</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                        {alertTargetOptions.map(opt => {
                          const Icon = opt.icon;
                          const isActive = alertTarget === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => { setAlertTarget(opt.value); if (opt.value !== "user") setAlertTargetUserId(""); if (opt.value !== "roles") setAlertTargetRoles([]); }}
                              className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all ${
                                isActive
                                  ? "border-primary/40 bg-primary/10 text-primary"
                                  : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.05]"
                              }`}
                              data-testid={`button-alert-target-${opt.value}`}
                            >
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                              <span className="font-medium truncate">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {alertTarget === "user" && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Select User</label>
                        <Input
                          value={alertUserSearch}
                          onChange={(e) => setAlertUserSearch(e.target.value)}
                          placeholder="Search grinders..."
                          className="bg-white/[0.04] border-white/[0.08] text-sm mb-2"
                          data-testid="input-alert-user-search"
                        />
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {filteredAlertUsers.map(u => (
                            <button
                              key={u.id}
                              onClick={() => { setAlertTargetUserId(u.id); setAlertUserSearch(u.name); }}
                              className={`w-full text-left px-3 py-1.5 rounded text-xs flex items-center gap-2 transition-colors ${
                                alertTargetUserId === u.id
                                  ? "bg-primary/15 text-primary border border-primary/20"
                                  : "hover:bg-white/[0.05] text-muted-foreground"
                              }`}
                              data-testid={`button-alert-user-${u.id}`}
                            >
                              <User className="w-3 h-3 shrink-0" />
                              <span>{u.name}</span>
                              <span className="ml-auto text-[10px] opacity-60">{u.type}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {alertTarget === "roles" && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Select Roles</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {Object.entries(ROLE_LABELS).map(([roleId, label]) => {
                            const isSelected = alertTargetRoles.includes(roleId);
                            return (
                              <button
                                key={roleId}
                                onClick={() => {
                                  if (isSelected) setAlertTargetRoles(alertTargetRoles.filter(r => r !== roleId));
                                  else setAlertTargetRoles([...alertTargetRoles, roleId]);
                                }}
                                className={`text-left px-3 py-1.5 rounded text-xs flex items-center gap-2 transition-colors ${
                                  isSelected
                                    ? "bg-primary/15 text-primary border border-primary/20"
                                    : "hover:bg-white/[0.05] text-muted-foreground border border-white/[0.06]"
                                }`}
                                data-testid={`button-alert-role-${roleId}`}
                              >
                                <ShieldCheck className="w-3 h-3 shrink-0" />
                                <span>{label}</span>
                              </button>
                            );
                          })}
                        </div>
                        {alertTargetRoles.length > 0 && (
                          <p className="text-[10px] text-muted-foreground mt-1.5">{alertTargetRoles.length} role{alertTargetRoles.length !== 1 ? "s" : ""} selected</p>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={() => {
                        const selectedUser = allUsersForAlert.find(u => u.id === alertTargetUserId);
                        createAlertMutation.mutate({
                          message: alertMessage,
                          target: alertTarget,
                          targetUserId: alertTarget === "user" ? alertTargetUserId : undefined,
                          targetUserName: alertTarget === "user" ? (selectedUser?.name || alertUserSearch) : undefined,
                          targetRoles: alertTarget === "roles" ? alertTargetRoles : undefined,
                        });
                      }}
                      disabled={!alertMessage.trim() || (alertTarget === "user" && !alertTargetUserId) || (alertTarget === "roles" && alertTargetRoles.length === 0) || createAlertMutation.isPending}
                      className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20"
                      data-testid="button-send-alert"
                    >
                      {createAlertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                      Publish Alert
                    </Button>
                  </div>

                  {allSiteAlerts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Active & Past Alerts</p>
                      {allSiteAlerts.map((alert: any) => (
                        <div
                          key={alert.id}
                          className={`p-3 rounded-lg border flex items-start gap-3 ${
                            alert.enabled
                              ? "border-primary/20 bg-primary/[0.05]"
                              : "border-white/[0.06] bg-white/[0.02] opacity-60"
                          }`}
                          data-testid={`alert-item-${alert.id}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" data-testid={`text-alert-message-${alert.id}`}>{alert.message}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge className="text-[10px] bg-white/[0.06] border-white/[0.08]">
                                {alert.target === "all" ? "Everyone" : alert.target === "staff" ? "Staff" : alert.target === "grinders" ? "Grinders" : alert.target === "roles" ? (alert.targetRoles?.map((r: string) => ROLE_LABELS[r] || r).join(", ") || "Roles") : alert.targetUserName || "User"}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                by {alert.createdByName} · {new Date(alert.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => toggleAlertMutation.mutate({ id: alert.id, enabled: !alert.enabled })}
                              data-testid={`button-toggle-alert-${alert.id}`}
                            >
                              {alert.enabled ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:text-destructive"
                              onClick={() => deleteAlertMutation.mutate(alert.id)}
                              data-testid={`button-delete-alert-${alert.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-muted-foreground px-1">
                    Alerts appear as a scrolling ticker bar at the bottom of every page. Users can dismiss alerts locally but they'll reappear on refresh until disabled.
                  </p>
                </CardContent>
              </Card>
            </FadeInUp>

            <FadeInUp>
              <ServiceManagement services={allServices} />
            </FadeInUp>
            <FadeInUp>
              <DeletionRequestsPanel />
            </FadeInUp>
            <FadeInUp>
              <ClearDataPanel />
            </FadeInUp>
          </TabsContent>
        )}
      </Tabs>
    </AnimatedPage>
  );
}
