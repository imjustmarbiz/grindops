import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useGrinderData } from "@/hooks/use-grinder-data";
import { apiRequest } from "@/lib/queryClient";
import { PAYOUT_PLATFORMS } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, FileCheck, CheckCircle, Star, Send, CalendarClock,
  MessageSquare, Banknote, TicketCheck, LogIn, LogOut, AlertTriangle, FileText, ExternalLink, ClipboardList, Upload, Video, Play, Tv, Repeat
} from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { HelpTip } from "@/components/help-tip";
import { FaXbox } from "react-icons/fa6";
import { SiPlaystation, SiSteam, SiNintendoswitch } from "react-icons/si";

function PlatformIcon({ platform, className }: { platform: string | null; className?: string }) {
  if (!platform) return <LogIn className={className} />;
  const p = platform.toLowerCase();
  if (p.includes("xbox") || p.includes("xb")) return <FaXbox className={className} />;
  if (p.includes("ps") || p.includes("playstation")) return <SiPlaystation className={className} />;
  if (p.includes("pc") || p.includes("steam") || p.includes("epic")) return <SiSteam className={className} />;
  if (p.includes("switch") || p.includes("nintendo")) return <SiNintendoswitch className={className} />;
  return <LogIn className={className} />;
}

function platformLoginColors(platform: string | null): string {
  if (!platform) return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20";
  const p = platform.toLowerCase();
  if (p.includes("xbox") || p.includes("xb")) return "bg-[#107C10]/10 border-[#107C10]/30 text-[#4CC94C] hover:bg-[#107C10]/20";
  if (p.includes("ps") || p.includes("playstation")) return "bg-[#003087]/10 border-[#003087]/30 text-[#5B8DEF] hover:bg-[#003087]/20";
  if (p.includes("pc") || p.includes("steam") || p.includes("epic")) return "bg-[#1B2838]/10 border-[#66C0F4]/30 text-[#66C0F4] hover:bg-[#1B2838]/20";
  if (p.includes("switch") || p.includes("nintendo")) return "bg-[#E60012]/10 border-[#E60012]/30 text-[#FF4654] hover:bg-[#E60012]/20";
  return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20";
}

function StreamStatusBadge({ twitchUsername, isStreaming }: { twitchUsername?: string | null; isStreaming?: boolean }) {
  if (!twitchUsername) {
    return (
      <Badge className="text-[10px] h-5 gap-1 bg-white/[0.04] text-white/30 border border-white/[0.06]" data-testid="badge-stream-no-link">
        <Tv className="w-3 h-3" /> No Stream Linked
      </Badge>
    );
  }
  if (!isStreaming) {
    return (
      <Badge className="text-[10px] h-5 gap-1 bg-white/[0.04] text-white/40 border border-white/[0.08]" data-testid="badge-stream-offline">
        <Tv className="w-3 h-3" /> Stream Offline
      </Badge>
    );
  }
  return (
    <Badge className="text-[10px] h-5 gap-1 bg-red-500/15 text-red-400 border border-red-500/25" data-testid="badge-stream-live">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
      </span>
      Stream Live
    </Badge>
  );
}

export default function GrinderAssignments() {
  const {
    grinder, isElite, assignments, orderUpdates, payoutRequests, payoutMethods,
    submitUpdateMutation, markCompleteMutation, requestPayoutMutation, toast, queryClient,
  } = useGrinderData();

  const [updateDialog, setUpdateDialog] = useState<any>(null);
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateType, setUpdateType] = useState("progress");
  const [newDeadline, setNewDeadline] = useState("");
  const [updateProofFiles, setUpdateProofFiles] = useState<File[]>([]);
  const [updateProofUrls, setUpdateProofUrls] = useState<string[]>([]);
  const [uploadingUpdateProofs, setUploadingUpdateProofs] = useState(false);
  const [completeDialog, setCompleteDialog] = useState<any>(null);
  const [completePlatform, setCompletePlatform] = useState("");
  const [completeDetails, setCompleteDetails] = useState("");
  const [completeSaveMethod, setCompleteSaveMethod] = useState(true);
  const [payoutDialog, setPayoutDialog] = useState<any>(null);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [payoutPlatform, setPayoutPlatform] = useState("");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [savePayoutMethod, setSavePayoutMethod] = useState(true);
  const [issueDialog, setIssueDialog] = useState<any>(null);
  const [issueNote, setIssueNote] = useState("");
  const [replacementDialog, setReplacementDialog] = useState<any>(null);
  const [replacementReason, setReplacementReason] = useState("");
  const [expandedCheckpoints, setExpandedCheckpoints] = useState<string | null>(null);
  const [joiningTicket, setJoiningTicket] = useState<string | null>(null);
  const [ticketConfirm, setTicketConfirm] = useState<{ assignmentId: string; orderId: string; action: "accept" | "decline" } | null>(null);
  const [briefDialog, setBriefDialog] = useState<{ orderId: string; brief: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const proofInputRef = useRef<HTMLInputElement>(null);
  const updateProofInputRef = useRef<HTMLInputElement>(null);

  const checkpointMutation = useMutation({
    mutationFn: async (data: { assignmentId: string; orderId: string; type: string; response?: string; note?: string }) => {
      const res = await apiRequest("POST", "/api/grinder/me/checkpoints", data);
      return res.json();
    },
    onSuccess: (_: any, vars: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinder/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grinder/me/checkpoints", vars.assignmentId] });
      const typeLabels: Record<string, string> = { ticket_ack: "Ticket accepted", login: "Logged in", logoff: "Logged off", issue: "Issue reported", order_update: "Update submitted", start_order: "Order started" };
      toast({ title: typeLabels[vars.type] || "Checkpoint recorded" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const replacementMutation = useMutation({
    mutationFn: async (data: { assignmentId: string; orderId: string; reason: string }) => {
      const res = await apiRequest("POST", "/api/grinder/me/request-replacement", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinder/me"] });
      toast({ title: "Replacement request sent", description: "Staff will review your request." });
      setReplacementDialog(null);
      setReplacementReason("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (!grinder) return null;

  const filterCounts = {
    all: assignments.length,
    active: assignments.filter((a: any) => a.status === "Active").length,
    completed: assignments.filter((a: any) => a.status === "Completed" && !payoutRequests?.find((p: any) => p.assignmentId === a.id)).length,
    awaiting_payout: assignments.filter((a: any) => {
      const pr = payoutRequests?.find((p: any) => p.assignmentId === a.id);
      return pr && ["Pending", "Disputed", "Grinder Approved"].includes(pr.status);
    }).length,
    paid: assignments.filter((a: any) => {
      const pr = payoutRequests?.find((p: any) => p.assignmentId === a.id);
      return pr && ["Paid", "Completed"].includes(pr.status);
    }).length,
  };

  const filteredAssignments = assignments.filter((a: any) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return a.status === "Active";
    if (statusFilter === "completed") {
      return a.status === "Completed" && !payoutRequests?.find((p: any) => p.assignmentId === a.id);
    }
    if (statusFilter === "awaiting_payout") {
      const pr = payoutRequests?.find((p: any) => p.assignmentId === a.id);
      return pr && ["Pending", "Disputed", "Grinder Approved"].includes(pr.status);
    }
    if (statusFilter === "paid") {
      const pr = payoutRequests?.find((p: any) => p.assignmentId === a.id);
      return pr && ["Paid", "Completed"].includes(pr.status);
    }
    return true;
  });

  const filters = [
    { key: "all", label: "All", mobileLabel: "All", color: "bg-white/[0.06] text-white/60" },
    { key: "active", label: "In Progress", mobileLabel: "Active", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
    { key: "completed", label: "Needs Payout", mobileLabel: "Payout", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
    { key: "awaiting_payout", label: "Payout Pending", mobileLabel: "Pending", color: "bg-violet-500/15 text-violet-400 border-violet-500/20" },
    { key: "paid", label: "Paid Out", mobileLabel: "Paid", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  ];

  return (
    <AnimatedPage className="space-y-4">
      <FadeInUp>
      <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
        <FileCheck className={`w-7 h-7 ${isElite ? "text-cyan-400" : "text-emerald-400"}`} />
        My Orders
        <HelpTip text="Track your active assignments and completed work." />
        <Badge className="border-0 bg-white/[0.06] text-white/60 text-xs">{assignments.length}</Badge>
      </h2>
      <p className="text-sm text-muted-foreground mt-1">Manage your active orders, send updates, and request payouts</p>
      </FadeInUp>
      {assignments.length > 0 && (
        <FadeInUp>
          <div className="flex items-center gap-2 flex-wrap" data-testid="filter-assignment-status">
            {filters.map((f) => {
              const count = filterCounts[f.key as keyof typeof filterCounts];
              const isActive = statusFilter === f.key;
              return (
                <Button
                  key={f.key}
                  size="sm"
                  variant="outline"
                  className={`text-xs h-8 gap-1.5 transition-all ${
                    isActive
                      ? `${f.color} border shadow-sm`
                      : "bg-transparent border-white/[0.06] text-muted-foreground hover:bg-white/[0.04]"
                  }`}
                  onClick={() => setStatusFilter(f.key)}
                  data-testid={`button-filter-${f.key}`}
                >
                  <span className="hidden sm:inline">{f.label}</span>
                  <span className="sm:hidden">{f.mobileLabel}</span>
                  {count > 0 && (
                    <span className={`text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center ${
                      isActive ? "bg-white/10" : "bg-white/[0.06]"
                    }`}>{count}</span>
                  )}
                </Button>
              );
            })}
          </div>
        </FadeInUp>
      )}
      <FadeInUp>
      {assignments.length === 0 ? (
        <Card className="border-0 bg-white/[0.03]">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
              <FileCheck className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white/40">No assignments yet. Win a bid to get your first order!</p>
          </CardContent>
        </Card>
      ) : filteredAssignments.length === 0 ? (
        <Card className="border-0 bg-white/[0.03]">
          <CardContent className="p-8 text-center">
            <p className="text-white/40 text-sm">No assignments match this filter.</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs text-muted-foreground"
              onClick={() => setStatusFilter("all")}
              data-testid="button-clear-filter"
            >
              Show all orders
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((a: any) => (
            <Card key={a.id} className="border-0 bg-white/[0.03] sm:hover:bg-white/[0.05] transition-all duration-200" data-testid={`card-work-assignment-${a.id}`}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base sm:text-lg">Order {a.mgtOrderNumber ? `#${a.mgtOrderNumber}` : a.orderId}</span>
                      <Badge className={`shrink-0 ${
                        (a.orderStatus || a.status) === "Active" ? "bg-emerald-500/20 text-emerald-400 border-0" :
                        (a.orderStatus || a.status) === "Paid Out" ? "bg-cyan-500/20 text-cyan-400 border-0" :
                        (a.orderStatus || a.status) === "Completed" || a.status === "Completed" ? "bg-blue-500/20 text-blue-400 border-0" :
                        "bg-white/[0.06] text-white/40 border-0"
                      }`}>
                        {a.orderStatus || a.status}
                      </Badge>
                      {a.isRush && <Badge className="border-0 bg-orange-500/20 text-orange-400 text-[10px]">Rush</Badge>}
                      {a.isEmergency && <Badge className="border-0 bg-red-500/20 text-red-400 text-[10px]">Emergency</Badge>}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-white/40 flex-wrap">
                      <span>Assigned: {new Date(a.assignedDateTime).toLocaleDateString()}</span>
                      <span>Due: {a.dueDateTime ? new Date(a.dueDateTime).toLocaleDateString() : "TBD"}</span>
                      {a.deliveredDateTime && <span>Done: {new Date(a.deliveredDateTime).toLocaleDateString()}</span>}
                      {a.grinderEarnings && <span className="text-emerald-400 font-medium">${Number(a.grinderEarnings).toFixed(2)}</span>}
                    </div>
                    {(a.serviceName || a.platform || a.gamertag) && (
                      <div className="flex items-center gap-2 sm:gap-3 mt-1.5 text-xs text-white/30 flex-wrap">
                        {a.serviceName && <span>{a.serviceName.replace(/\s*[🔥🛠️🏆🃏🏟️🎁🎫➕⚡🎖️🪙]/g, "").trim()}</span>}
                        {a.platform && <span>• {a.platform}</span>}
                        {a.gamertag && <span>• {a.gamertag}</span>}
                        {a.complexity && a.complexity > 1 && <span>• Complexity {a.complexity}/5</span>}
                        {a.location && <span>• {a.location}</span>}
                      </div>
                    )}
                  </div>
                </div>
                {a.status === "Active" && (
                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2 sm:flex-wrap">
                    {a.hasTicket && (
                      <Button size="sm" variant="outline"
                        className="gap-1 text-[11px] sm:text-xs bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20 h-8"
                        data-testid={`button-join-ticket-${a.id}`}
                        disabled={joiningTicket === a.orderId || !a.hasTicketAck}
                        onClick={async () => {
                          setJoiningTicket(a.orderId);
                          try {
                            const res = await apiRequest("POST", `/api/orders/${a.orderId}/ticket-invite`);
                            const data = await res.json();
                            if (data.inviteUrl) {
                              window.open(data.inviteUrl, '_blank');
                            } else if (data.channelUrl) {
                              window.open(data.channelUrl, '_blank');
                            }
                            toast({ title: "Ticket opened", description: "Opening the Discord ticket channel." });
                          } catch (err: any) {
                            toast({ title: "Could not join ticket", description: err.message || "The bot may not have access to that channel.", variant: "destructive" });
                          } finally {
                            setJoiningTicket(null);
                          }
                        }}
                      >
                        {joiningTicket === a.orderId ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />} Join Ticket
                      </Button>
                    )}
                    {a.orderBrief && (
                      <Button size="sm" variant="outline"
                        className="gap-1 text-[11px] sm:text-xs bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 h-8"
                        data-testid={`button-view-brief-${a.id}`}
                        disabled={!a.hasTicketAck}
                        onClick={() => setBriefDialog({ orderId: a.orderId, brief: a.orderBrief })}>
                        <ClipboardList className="w-3 h-3" /> View Brief
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="gap-1 text-[11px] sm:text-xs h-8" data-testid={`button-update-${a.id}`}
                      disabled={!a.hasTicketAck}
                      onClick={() => { setUpdateDialog(a); setUpdateType("progress"); setUpdateMessage(""); setNewDeadline(""); setUpdateProofFiles([]); setUpdateProofUrls([]); }}>
                      <MessageSquare className="w-3 h-3" /> Update
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-[11px] sm:text-xs h-8" data-testid={`button-deadline-${a.id}`}
                      disabled={!a.hasTicketAck}
                      onClick={() => { setUpdateDialog(a); setUpdateType("deadline"); setUpdateMessage(""); setNewDeadline(""); setUpdateProofFiles([]); setUpdateProofUrls([]); }}>
                      <CalendarClock className="w-3 h-3" /> Deadline
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-[11px] sm:text-xs bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 col-span-2 sm:col-span-1 h-8" data-testid={`button-complete-${a.id}`}
                      disabled={!a.hasTicketAck || !a.hasLoggedIn || !a.hasStarted || !a.hasLoggedOff || !a.hasUpdated}
                      title={!a.hasTicketAck ? "Accept order first" : !a.hasLoggedIn ? "Log in first" : !a.hasStarted ? "Start order first" : !a.hasLoggedOff ? "Log off first" : !a.hasUpdated ? "Submit at least one update first" : ""}
                      onClick={() => {
                        setCompleteDialog(a);
                        const defaultMethod = payoutMethods?.find((m: any) => m.isDefault) || payoutMethods?.[0];
                        if (defaultMethod) { setCompletePlatform(defaultMethod.platform); setCompleteDetails(defaultMethod.details); setCompleteSaveMethod(false); }
                        else { setCompletePlatform(""); setCompleteDetails(""); setCompleteSaveMethod(true); }
                      }}>
                      <CheckCircle className="w-3 h-3" /> Mark Complete
                    </Button>
                  </div>
                )}
                {a.status === "Active" && (
                  <div className="mt-2 pt-2 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-[10px] uppercase tracking-wider text-white/30 font-medium">Activity Checkpoints</p>
                      <StreamStatusBadge twitchUsername={grinder?.twitchUsername} isStreaming={grinder?.isStreaming} />
                    </div>
                    {!a.hasTicketAck && (
                      <div className="p-2.5 rounded-lg bg-amber-500/[0.08] border border-amber-500/20 mb-2">
                        <p className="text-[11px] text-amber-400 mb-2 font-medium">You must accept or decline this order before doing anything else.</p>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7 px-3 bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20" data-testid={`button-ack-yes-${a.id}`}
                            disabled={checkpointMutation.isPending}
                            onClick={() => setTicketConfirm({ assignmentId: a.id, orderId: a.orderId, action: "accept" })}>
                            <TicketCheck className="w-3 h-3" /> Accept Order
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7 px-3 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" data-testid={`button-ack-no-${a.id}`}
                            disabled={checkpointMutation.isPending}
                            onClick={() => setTicketConfirm({ assignmentId: a.id, orderId: a.orderId, action: "decline" })}>
                            <TicketCheck className="w-3 h-3" /> Decline Order
                          </Button>
                        </div>
                      </div>
                    )}
                    {a.hasTicketAck && a.ticketAckResponse === "no" && (
                      <div className="p-2.5 rounded-lg bg-red-500/[0.08] border border-red-500/20 mb-2">
                        <p className="text-[11px] text-red-400 font-medium">You declined this order. It has been sent back for reassignment.</p>
                      </div>
                    )}
                    <div className={`grid grid-cols-3 sm:flex sm:items-center gap-1 sm:gap-1.5 sm:flex-wrap ${!a.hasTicketAck || a.ticketAckResponse === "no" ? "opacity-40 pointer-events-none" : ""}`}>
                      {a.hasTicketAck && a.ticketAckResponse === "yes" && (
                        <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3 mr-1" /> Accepted
                        </Badge>
                      )}
                      <Button size="sm" variant="outline" className={`gap-1 text-[10px] h-7 px-1.5 sm:px-2 ${platformLoginColors(a.platform)}`} data-testid={`button-login-${a.id}`}
                        disabled={checkpointMutation.isPending || a.isLoggedIn || !a.hasTicketAck || a.ticketAckResponse === "no"}
                        onClick={() => checkpointMutation.mutate({ assignmentId: a.id, orderId: a.orderId, type: "login" })}>
                        <PlatformIcon platform={a.platform} className="w-3 h-3" /> Log In
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7 px-1.5 sm:px-2 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" data-testid={`button-logoff-${a.id}`}
                        disabled={checkpointMutation.isPending || !a.isLoggedIn || !a.hasTicketAck || a.ticketAckResponse === "no"}
                        onClick={() => checkpointMutation.mutate({ assignmentId: a.id, orderId: a.orderId, type: "logoff" })}>
                        <PlatformIcon platform={a.platform} className="w-3 h-3" /> <span className="hidden sm:inline">Log</span> Off
                      </Button>
                      {!a.hasStarted ? (
                        <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7 px-1.5 sm:px-2 bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20" data-testid={`button-start-order-${a.id}`}
                          disabled={checkpointMutation.isPending || !a.isLoggedIn || !a.hasTicketAck || a.ticketAckResponse === "no"}
                          onClick={() => checkpointMutation.mutate({ assignmentId: a.id, orderId: a.orderId, type: "start_order" })}>
                          <Play className="w-3 h-3" /> Start
                        </Button>
                      ) : (
                        <Badge className="text-[10px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                          <Play className="w-3 h-3 mr-1" /> Started
                        </Badge>
                      )}
                      <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7 px-1.5 sm:px-2 bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20" data-testid={`button-issue-${a.id}`}
                        disabled={checkpointMutation.isPending || !a.hasTicketAck || a.ticketAckResponse === "no"}
                        onClick={() => { setIssueDialog({ ...a, checkpointType: "issue" }); setIssueNote(""); }}>
                        <AlertTriangle className="w-3 h-3" /> Issue
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7 px-1.5 sm:px-2 bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20" data-testid={`button-request-replacement-${a.id}`}
                        disabled={!a.hasTicketAck || a.ticketAckResponse === "no"}
                        onClick={() => { setReplacementDialog(a); setReplacementReason(""); }}>
                        <Repeat className="w-3 h-3" /> Replace
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7 px-1.5 sm:px-2" data-testid={`button-view-checkpoints-${a.id}`}
                        onClick={() => setExpandedCheckpoints(expandedCheckpoints === a.id ? null : a.id)}>
                        <FileText className="w-3 h-3" /> History
                      </Button>
                    </div>
                    {expandedCheckpoints === a.id && <CheckpointHistory assignmentId={a.id} />}
                  </div>
                )}
                {a.status === "Completed" && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.isOnTime !== null && (
                      <Badge className={`text-[11px] ${a.isOnTime ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                        {a.isOnTime ? "On Time" : "Late"}
                      </Badge>
                    )}
                    {a.qualityRating && (
                      <Badge variant="outline" className="gap-1 text-[11px]">
                        <Star className="w-3 h-3" /> {a.qualityRating}/5
                      </Badge>
                    )}
                    {!payoutRequests?.find((p: any) => p.assignmentId === a.id) && (
                      <Button size="sm" variant="outline" className="gap-1 text-[11px] sm:text-xs bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 ml-auto" data-testid={`button-payout-${a.id}`}
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
                    {payoutRequests?.find((p: any) => p.assignmentId === a.id) && (() => {
                      const pr = payoutRequests.find((p: any) => p.assignmentId === a.id);
                      const isPaid = pr?.status === "Paid";
                      return (
                        <Badge className={`ml-auto ${isPaid ? "bg-amber-600/20 text-amber-400 border border-amber-600/20" : "bg-yellow-500/20 text-yellow-400"}`}>
                          {isPaid ? "Payout Paid" : `Payout ${pr?.status}`}
                        </Badge>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </FadeInUp>

      {orderUpdates && orderUpdates.length > 0 && (
        <FadeInUp>
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
                  {u.proofUrls && Array.isArray(u.proofUrls) && u.proofUrls.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {u.proofUrls.map((url: string, idx: number) => (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                          <Badge variant="outline" className="text-[10px] gap-1 cursor-pointer text-blue-400 border-blue-500/30 hover:bg-blue-500/10" data-testid={`badge-proof-url-${u.id}-${idx}`}>
                            <ExternalLink className="w-2.5 h-2.5" /> Proof {idx + 1}
                          </Badge>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </FadeInUp>
      )}

      <Dialog open={!!updateDialog} onOpenChange={(open) => { if (!open) { setUpdateDialog(null); setUpdateProofUrls([""]); } }}>
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
            {updateType === "progress" && (
              <div>
                <label className="text-sm font-medium mb-1 block">Proof Attachments <span className="text-muted-foreground font-normal">(optional, max 5)</span></label>
                <input
                  ref={updateProofInputRef}
                  type="file"
                  accept="image/*,video/*,.pdf,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.webm"
                  multiple
                  className="hidden"
                  data-testid="input-update-proof-files"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const combined = [...updateProofFiles, ...files].slice(0, 5);
                    setUpdateProofFiles(combined);
                    e.target.value = "";
                  }}
                />
                {updateProofFiles.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {updateProofFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-1.5 rounded bg-white/[0.03] border border-white/[0.06] text-xs">
                        <Upload className="w-3 h-3 text-blue-400 shrink-0" />
                        <span className="truncate flex-1 text-white/60">{file.name}</span>
                        <span className="text-white/30 shrink-0">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                        <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0"
                          data-testid={`button-remove-proof-file-${idx}`}
                          onClick={() => setUpdateProofFiles(updateProofFiles.filter((_, i) => i !== idx))}>
                          <span className="text-muted-foreground text-xs">✕</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <Button type="button" variant="outline" className="w-full gap-2 border-dashed border-white/20 hover:border-white/40 text-xs h-8"
                  data-testid="button-add-proof-files"
                  disabled={updateProofFiles.length >= 5}
                  onClick={() => updateProofInputRef.current?.click()}>
                  <Upload className="w-3 h-3" /> {updateProofFiles.length > 0 ? `Add More (${updateProofFiles.length}/5)` : "Attach Proof Files"}
                </Button>
              </div>
            )}
            <Button className="w-full" data-testid="button-submit-update"
              disabled={!updateMessage || submitUpdateMutation.isPending || uploadingUpdateProofs}
              onClick={async () => {
                let proofUrls: string[] = [];
                if (updateProofFiles.length > 0) {
                  setUploadingUpdateProofs(true);
                  try {
                    const formData = new FormData();
                    updateProofFiles.forEach(f => formData.append("files", f));
                    const uploadRes = await fetch("/api/grinder/me/upload-update-proofs", { method: "POST", body: formData, credentials: "include" });
                    if (!uploadRes.ok) throw new Error("Upload failed");
                    const uploadData = await uploadRes.json();
                    proofUrls = uploadData.urls;
                  } catch (err: any) {
                    toast({ title: "Upload failed", description: err.message, variant: "destructive" });
                    setUploadingUpdateProofs(false);
                    return;
                  }
                  setUploadingUpdateProofs(false);
                }
                submitUpdateMutation.mutate({
                  assignmentId: updateDialog.id,
                  orderId: updateDialog.orderId,
                  updateType,
                  message: updateMessage,
                  newDeadline: newDeadline || undefined,
                  proofUrls: proofUrls.length > 0 ? proofUrls : undefined,
                });
                setUpdateDialog(null);
                setUpdateMessage("");
                setNewDeadline("");
                setUpdateProofFiles([]);
                setUpdateProofUrls([]);
              }}>
              {(submitUpdateMutation.isPending || uploadingUpdateProofs) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              {uploadingUpdateProofs ? "Uploading..." : "Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!completeDialog} onOpenChange={(open) => { if (!open) { setCompleteDialog(null); setCompletePlatform(""); setCompleteDetails(""); setCompleteSaveMethod(true); setProofFile(null); setProofUrl(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Complete Order - {completeDialog?.orderId}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-white/60">Payout Amount</p>
              <p className="text-xl font-bold text-green-400" data-testid="text-complete-amount">
                ${Number(completeDialog?.grinderEarnings || completeDialog?.bidAmount || 0).toFixed(2)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-1">
                <Video className="w-4 h-4 text-blue-400" /> Video Proof *
              </label>
              <p className="text-xs text-muted-foreground mb-2">Upload a video showing the order is complete and the customer's account has been removed from your console.</p>
              <input
                ref={proofInputRef}
                type="file"
                accept="video/*,.mp4,.mov,.webm,.mkv,.avi"
                className="hidden"
                data-testid="input-proof-file"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setProofFile(file);
                  setUploadingProof(true);
                  try {
                    const formData = new FormData();
                    formData.append("video", file);
                    const res = await fetch("/api/grinder/me/upload-proof", { method: "POST", body: formData, credentials: "include" });
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({ error: "Upload failed" }));
                      throw new Error(err.error || err.message || "Upload failed");
                    }
                    const data = await res.json();
                    setProofUrl(data.url);
                    toast({ title: "Video uploaded successfully" });
                  } catch (err: any) {
                    toast({ title: "Upload failed", description: err.message, variant: "destructive" });
                    setProofFile(null);
                    setProofUrl(null);
                  } finally {
                    setUploadingProof(false);
                  }
                }}
              />
              {!proofFile ? (
                <Button type="button" variant="outline" className="w-full gap-2 border-dashed border-white/20 hover:border-white/40" data-testid="button-upload-proof"
                  onClick={() => proofInputRef.current?.click()}>
                  <Upload className="w-4 h-4" /> Select Video File
                </Button>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  {uploadingProof ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
                  ) : proofUrl ? (
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                  ) : null}
                  <span className="text-sm truncate flex-1">{proofFile.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{(proofFile.size / 1024 / 1024).toFixed(1)}MB</span>
                  <button className="text-muted-foreground hover:text-white" data-testid="button-remove-proof" onClick={() => { setProofFile(null); setProofUrl(null); if (proofInputRef.current) proofInputRef.current.value = ""; }}>
                    ✕
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Where should we send your payout? *</label>
              {payoutMethods && payoutMethods.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground mb-1.5">Saved payment methods:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {payoutMethods.map((m: any) => (
                      <Badge
                        key={m.id}
                        variant="outline"
                        className={`cursor-pointer transition-colors text-xs ${completePlatform === m.platform && completeDetails === m.details ? "bg-primary/20 border-primary text-primary" : "border-border/50"}`}
                        onClick={() => { setCompletePlatform(m.platform); setCompleteDetails(m.details); setCompleteSaveMethod(false); }}
                        data-testid={`badge-complete-method-${m.id}`}
                      >
                        {m.platform}: {m.details}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <Select value={completePlatform} onValueChange={(val) => {
                setCompletePlatform(val);
                const saved = payoutMethods?.find((m: any) => m.platform === val);
                if (saved) { setCompleteDetails(saved.details); setCompleteSaveMethod(false); }
                else { setCompleteDetails(""); setCompleteSaveMethod(true); }
              }}>
                <SelectTrigger data-testid="select-complete-platform">
                  <SelectValue placeholder="Select payment platform..." />
                </SelectTrigger>
                <SelectContent>
                  {PAYOUT_PLATFORMS.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {completePlatform && (
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {completePlatform === "Zelle" ? "Email or Phone Number *" :
                   completePlatform === "PayPal" ? "PayPal Email *" :
                   completePlatform === "Apple Pay" ? "Phone Number *" :
                   completePlatform === "Cash App" ? "$Cashtag *" :
                   completePlatform === "Venmo" ? "@Username *" :
                   "Payout Details *"}
                </label>
                <Input
                  value={completeDetails}
                  onChange={(e) => setCompleteDetails(e.target.value)}
                  placeholder={
                    completePlatform === "Zelle" ? "email@example.com or (555) 123-4567" :
                    completePlatform === "PayPal" ? "your@paypal.email" :
                    completePlatform === "Apple Pay" ? "(555) 123-4567" :
                    completePlatform === "Cash App" ? "$YourCashtag" :
                    completePlatform === "Venmo" ? "@YourUsername" :
                    "Enter your payout details"
                  }
                  data-testid="input-complete-details"
                />
              </div>
            )}
            {completePlatform && completeDetails && !payoutMethods?.find((m: any) => m.platform === completePlatform && m.details === completeDetails) && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={completeSaveMethod} onChange={(e) => setCompleteSaveMethod(e.target.checked)} className="rounded" data-testid="checkbox-complete-save-method" />
                Save this payment method for future payouts
              </label>
            )}
            <Button className="w-full bg-green-600 hover:bg-green-700" data-testid="button-confirm-complete"
              disabled={!completePlatform || !completeDetails || !proofUrl || uploadingProof || markCompleteMutation.isPending}
              onClick={() => {
                markCompleteMutation.mutate({
                  assignmentId: completeDialog.id,
                  payoutPlatform: completePlatform,
                  payoutDetails: completeDetails,
                  savePayoutMethod: completeSaveMethod,
                  completionProofUrl: proofUrl!,
                });
                setCompleteDialog(null);
                setCompletePlatform("");
                setCompleteDetails("");
                setCompleteSaveMethod(true);
                setProofFile(null);
                setProofUrl(null);
              }}>
              {markCompleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Complete & Request Payout
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
                setPayoutDialog(null);
                setPayoutAmount("");
                setPayoutNotes("");
                setPayoutPlatform("");
                setPayoutDetails("");
              }}>
              {requestPayoutMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Banknote className="w-4 h-4 mr-2" />}
              Request Payout
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!ticketConfirm} onOpenChange={(open) => !open && setTicketConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {ticketConfirm?.action === "accept" ? (
                <><TicketCheck className="w-5 h-5 text-blue-400" /> Confirm Accept Ticket</>
              ) : (
                <><TicketCheck className="w-5 h-5 text-red-400" /> Confirm Decline Ticket</>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-white/60">
              {ticketConfirm?.action === "accept"
                ? "Are you sure you want to accept this ticket? This action cannot be undone."
                : "Are you sure you want to decline this ticket? You will be asked to provide a reason."}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" data-testid="button-ticket-confirm-cancel"
                onClick={() => setTicketConfirm(null)}>
                Cancel
              </Button>
              <Button
                className={`flex-1 ${ticketConfirm?.action === "accept" ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"}`}
                data-testid="button-ticket-confirm-submit"
                disabled={checkpointMutation.isPending}
                onClick={() => {
                  if (!ticketConfirm) return;
                  if (ticketConfirm.action === "accept") {
                    checkpointMutation.mutate({
                      assignmentId: ticketConfirm.assignmentId,
                      orderId: ticketConfirm.orderId,
                      type: "ticket_ack",
                      response: "yes",
                    });
                    setTicketConfirm(null);
                  } else {
                    const assignmentData = assignments?.find((a: any) => a.id === ticketConfirm.assignmentId);
                    setTicketConfirm(null);
                    if (assignmentData) {
                      setIssueDialog({ ...assignmentData, checkpointType: "ticket_ack_no" });
                      setIssueNote("");
                    }
                  }
                }}>
                {checkpointMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {ticketConfirm?.action === "accept" ? "Accept Ticket" : "Continue to Decline"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!briefDialog} onOpenChange={(open) => !open && setBriefDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-400" /> Order Brief — {briefDialog?.orderId}
            </DialogTitle>
          </DialogHeader>
          <div className="whitespace-pre-wrap text-sm text-white/70 leading-relaxed max-h-[60vh] overflow-y-auto">
            {briefDialog?.brief}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!issueDialog} onOpenChange={(open) => !open && setIssueDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {issueDialog?.checkpointType === "issue" ? (
                <><AlertTriangle className="w-5 h-5 text-yellow-400" /> Report Issue - Order {issueDialog?.orderId}</>
              ) : (
                <><TicketCheck className="w-5 h-5 text-red-400" /> Decline Ticket - Order {issueDialog?.orderId}</>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                {issueDialog?.checkpointType === "issue" ? "Describe the issue *" : "Reason for declining *"}
              </label>
              <Textarea
                value={issueNote}
                onChange={(e) => setIssueNote(e.target.value)}
                placeholder={issueDialog?.checkpointType === "issue" ? "Describe the problem..." : "Reason for declining this ticket..."}
                data-testid="input-issue-note"
              />
            </div>
            <Button className="w-full" data-testid="button-submit-issue"
              disabled={!issueNote || checkpointMutation.isPending}
              onClick={() => {
                if (issueDialog?.checkpointType === "issue") {
                  checkpointMutation.mutate({
                    assignmentId: issueDialog.id,
                    orderId: issueDialog.orderId,
                    type: "issue",
                    note: issueNote,
                  });
                } else {
                  checkpointMutation.mutate({
                    assignmentId: issueDialog.id,
                    orderId: issueDialog.orderId,
                    type: "ticket_ack",
                    response: "no",
                    note: issueNote,
                  });
                }
                setIssueDialog(null);
                setIssueNote("");
              }}>
              {checkpointMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!replacementDialog} onOpenChange={(open) => { if (!open) { setReplacementDialog(null); setReplacementReason(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Repeat className="w-5 h-5 text-orange-400" />
              Request Replacement - Order {replacementDialog?.mgtOrderNumber ? `#${replacementDialog.mgtOrderNumber}` : replacementDialog?.orderId}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-500/[0.08] border border-amber-500/20 space-y-2">
              <p className="text-xs font-medium text-amber-400">Before requesting a replacement, please be aware:</p>
              <ul className="text-[11px] text-amber-300/80 space-y-1 list-disc list-inside">
                <li>This request will be reviewed by staff before any action is taken</li>
                <li>Your status for future order assignments may be affected</li>
                <li>You may or may not be subject to a strike and/or fine depending on the circumstances</li>
                <li>Your payout may be reduced or forfeited depending on the progress made on the order</li>
                <li>If approved, the order will be sent to the emergency open orders queue for reassignment</li>
              </ul>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Reason for replacement request *</label>
              <Textarea
                value={replacementReason}
                onChange={(e) => setReplacementReason(e.target.value)}
                placeholder="Explain why you need a replacement grinder for this order..."
                data-testid="input-replacement-reason"
                rows={3}
              />
            </div>
            <Button className="w-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/20" data-testid="button-submit-replacement"
              disabled={!replacementReason.trim() || replacementMutation.isPending}
              onClick={() => {
                replacementMutation.mutate({
                  assignmentId: replacementDialog.id,
                  orderId: replacementDialog.orderId,
                  reason: replacementReason,
                });
              }}>
              {replacementMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Repeat className="w-4 h-4 mr-2" />}
              Submit Replacement Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  );
}

function CheckpointHistory({ assignmentId }: { assignmentId: string }) {
  const { data: checkpoints, isLoading } = useQuery<any[]>({
    queryKey: ["/api/grinder/me/checkpoints", assignmentId],
    queryFn: async () => {
      const res = await fetch(`/api/grinder/me/checkpoints/${assignmentId}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (isLoading) return <div className="mt-2 text-xs text-white/30">Loading checkpoints...</div>;
  if (!checkpoints || checkpoints.length === 0) return <div className="mt-2 text-xs text-white/30">No checkpoints yet</div>;

  const typeIcons: Record<string, string> = {
    ticket_ack: "🎟️",
    login: "🟢",
    logoff: "🔴",
    issue: "⚠️",
    order_update: "📝",
    missed_update: "❌",
    start_order: "▶️",
    stream_live: "📡",
    stream_offline: "📴",
  };

  return (
    <div className="mt-2 space-y-1" data-testid={`checkpoint-history-${assignmentId}`}>
      {checkpoints.slice(0, 15).map((cp: any) => (
        <div key={cp.id} className="flex items-start gap-2 p-2 rounded bg-white/[0.02] border border-white/[0.04] text-xs">
          <span>{typeIcons[cp.type] || "📋"}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium capitalize">{cp.type.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
              {cp.response && <Badge variant="outline" className="text-[10px] h-4 px-1">{cp.response}</Badge>}
              {cp.resolvedAt && <Badge className="text-[10px] h-4 px-1 bg-emerald-500/20 text-emerald-400 border-0">Resolved</Badge>}
            </div>
            {cp.note && <p className="text-white/40 mt-0.5 truncate">{cp.note}</p>}
            {cp.resolvedNote && <p className="text-emerald-400/60 mt-0.5 truncate">Staff: {cp.resolvedNote}</p>}
          </div>
          <span className="text-white/20 whitespace-nowrap">{new Date(cp.createdAt).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
