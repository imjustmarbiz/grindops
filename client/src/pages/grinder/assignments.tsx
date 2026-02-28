import { useState, useRef } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useGrinderData } from "@/hooks/use-grinder-data";
import { apiRequest } from "@/lib/queryClient";
import { PAYOUT_PLATFORMS } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, FileCheck, CheckCircle, Star, Send, CalendarClock, Clock,
  MessageSquare, Banknote, TicketCheck, LogIn, LogOut, AlertTriangle, FileText, ExternalLink, ClipboardList, Upload, Video, Play, Tv, Repeat, BellRing
} from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { FaXbox, FaDiscord } from "react-icons/fa6";
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
  const [ticketConfirm, setTicketConfirm] = useState<{ assignmentId: string; orderId: string; action: "accept" | "decline" } | null>(null);
  const [briefDialog, setBriefDialog] = useState<{ orderId: string; brief: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [proofConfirmed, setProofConfirmed] = useState(false);
  const [completeStep, setCompleteStep] = useState<"form" | "confirm">("form");
  const [staffAlertModal, setStaffAlertModal] = useState<any>(null);
  const [staffAlertMessage, setStaffAlertMessage] = useState("");
  const proofInputRef = useRef<HTMLInputElement>(null);
  const proofVideoRef = useRef<HTMLVideoElement>(null);
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

  const staffAlertMutation = useMutation({
    mutationFn: async (data: { assignmentId: string; orderId: string; message: string }) => {
      const res = await apiRequest("POST", "/api/grinder/me/staff-alert", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Staff notified", description: "Your message has been sent to staff-only channels." });
      setStaffAlertModal(null);
      setStaffAlertMessage("");
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
    { key: "active", label: "In Progress", mobileLabel: "Active", color: "bg-[#5865F2]/15 text-[#5865F2] border-[#5865F2]/20" },
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
            <Card key={a.id} className={`border-0 sm:hover:bg-white/[0.05] transition-all duration-200 ${
              (() => {
                const pr = payoutRequests?.find((p: any) => p.assignmentId === a.id);
                const isPaid = pr && ["Paid", "Completed"].includes(pr.status);
                const isPayoutPending = pr && ["Pending", "Disputed", "Grinder Approved"].includes(pr.status);
                if (isPaid) return "bg-emerald-500/[0.02] border-l-2 border-l-emerald-500/30";
                if (isPayoutPending) return "bg-violet-500/[0.02] border-l-2 border-l-violet-500/30";
                if (a.status === "Completed") return "bg-amber-500/[0.02] border-l-2 border-l-amber-500/30";
                return "bg-white/[0.03]";
              })()
            }`} data-testid={`card-work-assignment-${a.id}`}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-lg sm:text-xl">Order {a.mgtOrderNumber ? `#${a.mgtOrderNumber}` : (a.displayId || a.orderId)}</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(() => {
                          const pr = payoutRequests?.find((p: any) => p.assignmentId === a.id);
                          const isPaid = pr && ["Paid", "Completed"].includes(pr.status);
                          const isPayoutPending = pr && ["Pending", "Disputed", "Grinder Approved"].includes(pr.status);
                          const isCompleted = a.status === "Completed";
                          
                          if (isPaid) return (
                            <Badge className="shrink-0 bg-emerald-500/20 text-emerald-400 border-0" data-testid={`badge-status-${a.id}`}>
                              <Banknote className="w-3 h-3 mr-1" /> Paid Out
                            </Badge>
                          );
                          if (isPayoutPending) return (
                            <Badge className="shrink-0 bg-violet-500/20 text-violet-400 border-violet-500/20" data-testid={`badge-status-${a.id}`}>
                              <Clock className="w-3 h-3 mr-1" /> Payout Pending
                            </Badge>
                          );
                          if (isCompleted) return (
                            <Badge className="shrink-0 bg-amber-500/20 text-amber-400 border-amber-500/20" data-testid={`badge-status-${a.id}`}>
                              <CheckCircle className="w-3 h-3 mr-1" /> Completed
                            </Badge>
                          );
                          return (
                            <Badge className="shrink-0 bg-[#5865F2]/20 text-[#5865F2] border-[#5865F2]/20" data-testid={`badge-status-${a.id}`}>
                              {a.orderStatus || a.status}
                            </Badge>
                          );
                        })()}
                        {a.isRush && <Badge className="border-0 bg-orange-500/20 text-orange-400 text-[10px]">Rush</Badge>}
                        {a.isEmergency && <Badge className="border-0 bg-red-500/20 text-red-400 text-[10px]">Emergency</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-x-3 gap-y-1 mt-1.5 text-xs sm:text-sm text-white/40 flex-wrap">
                      <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> Assigned: {new Date(a.assignedDateTime).toLocaleDateString()}</div>
                      <div className="flex items-center gap-1"><CalendarClock className="w-3 h-3" /> Due: {a.dueDateTime ? new Date(a.dueDateTime).toLocaleDateString() : "TBD"}</div>
                      {a.deliveredDateTime && <div className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Done: {new Date(a.deliveredDateTime).toLocaleDateString()}</div>}
                      {a.grinderEarnings && <div className="text-emerald-400 font-semibold text-sm sm:text-base ml-auto sm:ml-0">${Number(a.grinderEarnings).toFixed(2)}</div>}
                    </div>
                    {(a.serviceName || a.platform || a.gamertag) && (
                      <div className="flex items-center gap-x-3 gap-y-1 mt-2 text-[11px] sm:text-xs text-white/30 flex-wrap">
                        {a.serviceName && <span className="bg-white/5 px-1.5 py-0.5 rounded">{a.serviceName.replace(/\s*[🔥🛠️🏆🃏🏟️🎁🎫➕⚡🎖️🪙]/g, "").trim()}</span>}
                        {a.platform && <span className="flex items-center gap-1"><PlatformIcon platform={a.platform} className="w-3 h-3" /> {a.platform}</span>}
                        {a.gamertag && <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-white/50">{a.gamertag}</span>}
                        {a.complexity && a.complexity > 1 && <span>• Complexity {a.complexity}/5</span>}
                        {a.customerDiscordUsername && (
                          <span className="flex items-center gap-1">
                            • <FaDiscord className="w-3 h-3 text-[#5865F2]" /> <span className="text-[#5865F2] font-medium">@{a.customerDiscordUsername}</span>
                          </span>
                        )}
                        {a.location && <span>• {a.location}</span>}
                      </div>
                    )}
                  </div>
                </div>
                {a.status === "Active" ? (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-1.5">
                      {a.hasTicket && a.ticketChannelId && (
                        <Button size="sm" variant="outline" asChild
                          className="w-full gap-2 text-xs font-semibold bg-[#5865F2]/10 border-[#5865F2]/30 text-[#5865F2] hover:bg-[#5865F2]/20 h-10 active:scale-95 transition-transform"
                          data-testid={`button-join-ticket-${a.id}`}
                          disabled={!a.hasTicketAck}
                        >
                          <a href={a.ticketChannelUrl} target="_blank" rel="noopener noreferrer" title="Join the Discord ticket for this order. The bot provides a permanent link for access.">
                            <FaDiscord className="w-4 h-4" /> Discord Ticket
                          </a>
                        </Button>
                      )}
                      {a.orderBrief && (
                        <Button size="sm" variant="outline"
                          className="w-full gap-2 text-xs font-semibold bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 h-10 active:scale-95 transition-transform"
                          data-testid={`button-view-brief-${a.id}`}
                          disabled={!a.hasTicketAck}
                          onClick={() => setBriefDialog({ orderId: a.orderId, brief: a.orderBrief })}>
                          <ClipboardList className="w-4 h-4" /> View Brief
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <Button size="sm" variant="outline" className="w-full gap-2 text-[10px] sm:text-xs font-semibold h-10 active:scale-95 transition-transform" data-testid={`button-update-${a.id}`}
                        disabled={!a.hasTicketAck}
                        onClick={() => { setUpdateDialog(a); setUpdateType("progress"); setUpdateMessage(""); setNewDeadline(""); setUpdateProofFiles([]); setUpdateProofUrls([]); }}>
                        <MessageSquare className="w-4 h-4" /> Update
                      </Button>
                      <Button size="sm" variant="outline" className="w-full gap-2 text-[10px] sm:text-xs font-semibold h-10 active:scale-95 transition-transform" data-testid={`button-deadline-${a.id}`}
                        disabled={!a.hasTicketAck}
                        onClick={() => { setUpdateDialog(a); setUpdateType("deadline"); setUpdateMessage(""); setNewDeadline(a.dueDateTime ? new Date(a.dueDateTime).toISOString().split("T")[0] : ""); setUpdateProofFiles([]); setUpdateProofUrls([]); }}>
                        <CalendarClock className="w-4 h-4" /> Deadline
                      </Button>
                      <Button size="sm" variant="outline" className="w-full gap-2 text-[10px] sm:text-xs font-semibold h-10 bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 active:scale-95 transition-transform" data-testid={`button-staff-alert-${a.id}`}
                        disabled={!a.hasTicketAck}
                        onClick={() => { setStaffAlertModal(a); setStaffAlertMessage(""); }}>
                        <BellRing className="w-4 h-4" /> Alert Staff
                      </Button>
                    </div>
                    <Button size="sm" variant="outline" className="w-full gap-2 text-sm font-bold bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 h-12 active:scale-95 transition-transform shadow-lg shadow-emerald-500/5 mt-1" data-testid={`button-complete-${a.id}`}
                      disabled={!a.hasTicketAck || !a.hasLoggedIn || !a.hasStarted || !a.hasLoggedOff}
                      title={!a.hasTicketAck ? "Accept order first" : !a.hasLoggedIn ? "Log in first" : !a.hasStarted ? "Start order first" : !a.hasLoggedOff ? "Log off first" : ""}
                      onClick={() => {
                        setCompleteDialog(a);
                        const defaultMethod = payoutMethods?.find((m: any) => m.isDefault) || payoutMethods?.[0];
                        if (defaultMethod) { 
                          setCompletePlatform(defaultMethod.platform); 
                          setCompleteDetails(defaultMethod.details); 
                          setCompleteSaveMethod(false); 
                        } else { 
                          setCompletePlatform(""); 
                          setCompleteDetails(""); 
                          setCompleteSaveMethod(true); 
                        }
                      }}>
                      <CheckCircle className="w-5 h-5" /> Mark Complete
                    </Button>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button size="sm" variant="outline" asChild
                        className="w-full gap-2 text-xs font-semibold bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.06] h-9"
                        data-testid={`button-order-history-${a.id}`}>
                        <Link href="/my-scorecard">
                          <Clock className="w-4 h-4" /> Order History
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline"
                        className="w-full gap-2 text-xs font-semibold bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.06] h-9"
                        data-testid={`button-view-brief-alt-${a.id}`}
                        onClick={() => setBriefDialog({ orderId: a.orderId, brief: a.orderBrief })}>
                        <FileText className="w-4 h-4" /> Brief
                      </Button>
                    </div>
                  </div>
                ) : (
                  (() => {
                    const pr = payoutRequests?.find((p: any) => p.assignmentId === a.id);
                    const isPaid = pr && ["Paid", "Completed"].includes(pr.status);
                    const isPayoutPending = pr && ["Pending", "Disputed", "Grinder Approved"].includes(pr.status);
                    return (
                      <div className="flex flex-col gap-2">
                        {isPaid ? (
                          <div className="p-4 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/15" data-testid={`status-paid-${a.id}`}>
                            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                              <Banknote className="w-5 h-5" />
                              Paid Out
                            </div>
                            <p className="text-xs text-emerald-400/60">Payment has been processed. This order is complete.</p>
                            {pr?.amount && <p className="text-sm font-bold text-emerald-400 mt-2">${Number(pr.amount).toFixed(2)} received</p>}
                          </div>
                        ) : isPayoutPending ? (
                          <div className="p-4 rounded-lg bg-violet-500/[0.06] border border-violet-500/15" data-testid={`status-payout-pending-${a.id}`}>
                            <div className="flex items-center gap-2 text-violet-400 font-semibold mb-1">
                              <Clock className="w-5 h-5 animate-pulse" />
                              Payout Under Review
                            </div>
                            <p className="text-xs text-violet-400/60">Staff is reviewing your payout request. You'll be notified when it's processed.</p>
                            {pr?.amount && <p className="text-sm font-bold text-violet-400 mt-2">${Number(pr.amount).toFixed(2)} requested</p>}
                          </div>
                        ) : (
                          <div className="p-4 rounded-lg bg-amber-500/[0.06] border border-amber-500/15" data-testid={`status-completed-${a.id}`}>
                            <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
                              <CheckCircle className="w-5 h-5" />
                              Order Complete — Awaiting Payout
                            </div>
                            <p className="text-xs text-amber-400/60">This order has been marked complete. Staff will process your payout.</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="flex-1 h-9 gap-2 text-xs bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20" data-testid={`button-staff-alert-done-${a.id}`}
                            onClick={() => { setStaffAlertModal(a); setStaffAlertMessage(""); }}>
                            <BellRing className="w-3 h-3" /> Alert Staff
                          </Button>
                          <Button size="sm" variant="outline" asChild
                            className="flex-1 h-9 gap-2 text-xs bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.06]"
                            data-testid={`button-order-history-done-${a.id}`}>
                            <Link href="/my-scorecard">
                              <Clock className="w-3 h-3" /> Order History
                            </Link>
                          </Button>
                          {a.orderBrief && (
                            <Button size="sm" variant="outline"
                              className="flex-1 h-9 gap-2 text-xs bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.06]"
                              data-testid={`button-view-brief-done-${a.id}`}
                              onClick={() => setBriefDialog({ orderId: a.orderId, brief: a.orderBrief })}>
                              <FileText className="w-3 h-3" /> Brief
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })()
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
                      <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-white/[0.06]">
                        <Button size="sm" variant="outline" className={`gap-1 text-[10px] h-9 px-1 active:scale-95 transition-transform ${platformLoginColors(a.platform)}`} data-testid={`button-login-${a.id}`}
                          disabled={checkpointMutation.isPending || a.isLoggedIn || !a.hasTicketAck || a.ticketAckResponse === "no"}
                          onClick={() => checkpointMutation.mutate({ assignmentId: a.id, orderId: a.orderId, type: "login" })}>
                          <PlatformIcon platform={a.platform} className="w-3 h-3" /> Log In
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 text-[10px] h-9 px-1 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 active:scale-95 transition-transform" data-testid={`button-logoff-${a.id}`}
                          disabled={checkpointMutation.isPending || !a.isLoggedIn || !a.hasTicketAck || a.ticketAckResponse === "no"}
                          onClick={() => checkpointMutation.mutate({ assignmentId: a.id, orderId: a.orderId, type: "logoff" })}>
                          <PlatformIcon platform={a.platform} className="w-3 h-3" /> Log Off
                        </Button>
                        {!a.hasStarted ? (
                          <Button size="sm" variant="outline" className="gap-1 text-[10px] h-9 px-1 bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 active:scale-95 transition-transform" data-testid={`button-start-order-${a.id}`}
                            disabled={checkpointMutation.isPending || !a.hasTicketAck || a.ticketAckResponse === "no"}
                            onClick={() => checkpointMutation.mutate({ assignmentId: a.id, orderId: a.orderId, type: "start_order" })}>
                            <Play className="w-3 h-3" /> Start Order
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="gap-1 text-[10px] h-9 px-1 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 active:scale-95 transition-transform" data-testid={`button-replacement-${a.id}`}
                            disabled={checkpointMutation.isPending || !a.hasTicketAck || a.ticketAckResponse === "no"}
                            onClick={() => setReplacementDialog(a)}>
                            <Repeat className="w-3 h-3" /> Replace Me
                          </Button>
                        )}
                      </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </FadeInUp>

      <Dialog open={!!staffAlertModal} onOpenChange={(open) => !open && setStaffAlertModal(null)}>
        <DialogContent className="border-0 bg-[#0B0F13] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-amber-400" />
              Alert Staff (Internal)
            </DialogTitle>
            <DialogDescription className="text-white/40">
              Send a message to the staff to-do list as a required action. This will NOT be sent to the customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/60">Message to Staff</label>
              <Textarea
                placeholder="Explain the issue or update for staff only..."
                className="bg-white/[0.03] border-white/[0.1] min-h-[120px] resize-none"
                value={staffAlertMessage}
                onChange={(e) => setStaffAlertMessage(e.target.value)}
                data-testid="textarea-staff-alert-message"
              />
            </div>
            <div className="p-3 rounded-lg bg-amber-500/[0.05] border border-amber-500/20 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-[11px] text-amber-400/80 leading-relaxed">
                Use this for internal concerns, password issues, or anything sensitive. 
                This will create a high-priority task on the staff to-do list and send a notification to all staff members. 
                Customers cannot see these alerts.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setStaffAlertModal(null)} data-testid="button-cancel-staff-alert">Cancel</Button>
            <Button 
              className="bg-amber-600 hover:bg-amber-500 text-white gap-2"
              disabled={!staffAlertMessage.trim() || staffAlertMutation.isPending}
              onClick={() => staffAlertMutation.mutate({ 
                assignmentId: staffAlertModal.id, 
                orderId: staffAlertModal.orderId, 
                message: staffAlertMessage.trim() 
              })}
              data-testid="button-send-staff-alert"
            >
              {staffAlertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Staff Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  );
}
