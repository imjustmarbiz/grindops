import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useStaffData } from "@/hooks/use-staff-data";
import { formatCurrency } from "@/lib/staff-utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Banknote, CheckCircle, X, CreditCard, Loader2, DollarSign, MessageSquare, TrendingUp, Clock, AlertTriangle, RefreshCw, ThumbsUp, Video, Upload, ImageIcon, FileText, ArrowDownCircle, ShieldAlert, ArrowDown, Filter } from "lucide-react";
import { BiddingCountdownPanel } from "@/components/bidding-countdown";
import { AnimatedPage, FadeInUp } from "@/lib/animations";


export default function StaffPayouts() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { payoutReqs, grinders, grinderUpdates, analyticsLoading, assignments, orders } = useStaffData();

  const [markPaidDialog, setMarkPaidDialog] = useState<{ id: string; grinder: string; amount: number; existingPaidAt?: string } | null>(null);
  const [proofUrl, setProofUrl] = useState<string>("");
  const [paidAtDate, setPaidAtDate] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");
  const isOwner = user?.role === "owner";
  const { data: wallets = [] } = useQuery<any[]>({ queryKey: ["/api/wallets"] });

  const payoutMutation = useMutation({
    mutationFn: async ({ id, status, paymentProofUrl, walletId, paidAt }: { id: string; status: string; paymentProofUrl?: string; walletId?: string; paidAt?: string }) => {
      const reviewedBy = (user as any)?.username || user?.discordUsername || "staff";
      const res = await apiRequest("PATCH", `/api/staff/payout-requests/${id}`, { status, reviewedBy, paymentProofUrl, walletId, paidAt });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/payout-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet-summary"] });
      toast({ title: "Payout request updated" });
      setMarkPaidDialog(null);
      setProofUrl("");
      setSelectedWalletId("");
    },
  });

  const handleProofUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/staff/upload-payment-proof", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setProofUrl(data.url);
      toast({ title: "Proof uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterGrinder, setFilterGrinder] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const [reduceDialog, setReduceDialog] = useState<{ id: string; grinder: string; amount: number; orderId: string } | null>(null);
  const [reduceAmount, setReduceAmount] = useState("");
  const [reduceReason, setReduceReason] = useState("");
  const [denyReductionDialog, setDenyReductionDialog] = useState<string | null>(null);
  const [denyReductionReason, setDenyReductionReason] = useState("");

  const reduceMutation = useMutation({
    mutationFn: async ({ id, newAmount, reason }: { id: string; newAmount: string; reason: string }) => {
      const reviewedBy = (user as any)?.username || user?.discordUsername || "staff";
      const res = await apiRequest("PATCH", `/api/staff/payout-requests/${id}/reduce`, { newAmount, reason, reviewedBy });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/payout-requests"] });
      toast({ title: isOwner ? "Payout reduced" : "Reduction submitted for owner approval" });
      setReduceDialog(null);
      setReduceAmount("");
      setReduceReason("");
    },
    onError: (err: any) => {
      toast({ title: "Failed to reduce payout", description: err.message, variant: "destructive" });
    },
  });

  const reductionReviewMutation = useMutation({
    mutationFn: async ({ id, action, deniedReason }: { id: string; action: string; deniedReason?: string }) => {
      const reviewedBy = (user as any)?.username || user?.discordUsername || "owner";
      const res = await apiRequest("PATCH", `/api/staff/payout-requests/${id}/reduction-review`, { action, reviewedBy, deniedReason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/payout-requests"] });
      toast({ title: "Reduction review complete" });
      setDenyReductionDialog(null);
      setDenyReductionReason("");
    },
    onError: (err: any) => {
      toast({ title: "Failed to review reduction", description: err.message, variant: "destructive" });
    },
  });

  const resolveDisputeMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const reviewedBy = (user as any)?.username || user?.discordUsername || "staff";
      const res = await apiRequest("PATCH", `/api/staff/payout-requests/${id}/resolve-dispute`, { action, reviewedBy });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/payout-requests"] });
      toast({ title: "Dispute resolved" });
    },
  });

  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-payouts">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const allGrinders = grinders || [];
  const rawPayoutReqs = payoutReqs || [];
  const uniqueMethods = Array.from(new Set(rawPayoutReqs.map((p: any) => p.payoutPlatform).filter(Boolean))).sort() as string[];
  const allPayoutReqs = rawPayoutReqs.filter((p: any) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterMethod !== "all" && (p.payoutPlatform || "") !== filterMethod) return false;
    if (filterGrinder.trim()) {
      const grinder = allGrinders.find((g: any) => g.id === p.grinderId);
      const name = (grinder?.name || p.grinderId || "").toLowerCase();
      if (!name.includes(filterGrinder.trim().toLowerCase())) return false;
    }
    if (filterDateFrom) {
      const from = new Date(filterDateFrom);
      from.setHours(0, 0, 0, 0);
      if (new Date(p.createdAt) < from) return false;
    }
    if (filterDateTo) {
      const to = new Date(filterDateTo);
      to.setHours(23, 59, 59, 999);
      if (new Date(p.createdAt) > to) return false;
    }
    return true;
  });
  const pendingGrinderApproval = allPayoutReqs.filter((p: any) => p.status === "Pending Grinder Approval");
  const disputedPayouts = allPayoutReqs.filter((p: any) => p.status === "Grinder Disputed");
  const pendingPayouts = allPayoutReqs.filter((p: any) => p.status === "Pending");
  const approvedPayouts = allPayoutReqs.filter((p: any) => p.status === "Approved");
  const paidPayouts = allPayoutReqs.filter((p: any) => p.status === "Paid");
  const pendingReductions = allPayoutReqs.filter((p: any) => p.reductionStatus === "pending");
  const totalOwed = [...pendingPayouts, ...approvedPayouts].reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const totalPaidOut = paidPayouts.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

  return (
    <AnimatedPage className="space-y-5 sm:space-y-6" data-testid="page-staff-payouts">
      <FadeInUp>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Wallet className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight flex items-center gap-2" data-testid="text-page-title">
                Payout Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Review and manage grinder payout requests</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {disputedPayouts.length > 0 && (
              <Badge className="bg-orange-500/15 text-orange-400 border border-orange-500/20 gap-1 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                {disputedPayouts.length} disputed
              </Badge>
            )}
            {pendingGrinderApproval.length > 0 && (
              <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 gap-1">
                <Clock className="w-3 h-3" />
                {pendingGrinderApproval.length} awaiting grinder
              </Badge>
            )}
            {pendingPayouts.length > 0 && (
              <Badge className="bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 gap-1 animate-pulse">
                <Clock className="w-3 h-3" />
                {pendingPayouts.length} pending review
              </Badge>
            )}
            {pendingReductions.length > 0 && isOwner && (
              <Badge className="bg-red-500/15 text-red-400 border border-red-500/20 gap-1 animate-pulse">
                <ArrowDownCircle className="w-3 h-3" />
                {pendingReductions.length} reduction{pendingReductions.length > 1 ? "s" : ""} awaiting approval
              </Badge>
            )}
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
        <BiddingCountdownPanel variant="compact" />
      </FadeInUp>

      <FadeInUp>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px] bg-background/50 border-white/10" data-testid="select-filter-status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Pending Grinder Approval">Pending Grinder Approval</SelectItem>
              <SelectItem value="Grinder Disputed">Grinder Disputed</SelectItem>
              <SelectItem value="Denied">Denied</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterMethod} onValueChange={setFilterMethod}>
            <SelectTrigger className="w-[200px] bg-background/50 border-white/10" data-testid="select-filter-method">
              <SelectValue placeholder="All Methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              {uniqueMethods.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Search grinder..."
            value={filterGrinder}
            onChange={(e) => setFilterGrinder(e.target.value)}
            className="w-[200px] bg-background/50 border-white/10"
            data-testid="input-filter-grinder"
          />
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-[150px] bg-background/50 border-white/10 text-sm"
              data-testid="input-filter-date-from"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-[150px] bg-background/50 border-white/10 text-sm"
              data-testid="input-filter-date-to"
            />
          </div>
          {(filterStatus !== "all" || filterGrinder || filterMethod !== "all" || filterDateFrom || filterDateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterStatus("all"); setFilterGrinder(""); setFilterMethod("all"); setFilterDateFrom(""); setFilterDateTo(""); }}
              className="text-xs text-muted-foreground gap-1"
              data-testid="button-clear-filters"
            >
              <X className="w-3 h-3" /> Clear
            </Button>
          )}
        </div>
      </FadeInUp>

      <FadeInUp>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Outstanding", value: formatCurrency(totalOwed), icon: Clock, gradient: "from-yellow-500/[0.08] via-background to-yellow-900/[0.04]", iconBg: "bg-yellow-500/15", textColor: "text-yellow-400", testId: "text-total-owed" },
          { label: "Paid Out", value: formatCurrency(totalPaidOut), icon: CheckCircle, gradient: "from-emerald-500/[0.08] via-background to-emerald-900/[0.04]", iconBg: "bg-emerald-500/15", textColor: "text-emerald-400", testId: "text-total-paid" },
          { label: "Total Requests", value: String(allPayoutReqs.length), icon: TrendingUp, gradient: "from-blue-500/[0.08] via-background to-blue-900/[0.04]", iconBg: "bg-blue-500/15", textColor: "text-blue-400", testId: "text-total-requests" },
        ].map(s => (
          <Card key={s.label} className={`border-0 bg-gradient-to-br ${s.gradient} overflow-hidden relative`}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/50">{s.label}</p>
                  <p className={`text-xl sm:text-2xl font-bold ${s.textColor} tracking-tight`} data-testid={s.testId}>{s.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 ${s.textColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      </FadeInUp>

      {disputedPayouts.length > 0 && (
        <FadeInUp>
        <Card className="border-0 bg-gradient-to-br from-orange-500/[0.06] via-background to-background overflow-hidden relative" data-testid="card-disputed-payouts">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-orange-500/[0.03] -translate-y-16 translate-x-16" />
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
              </div>
              Disputed Payouts
              <Badge className="bg-orange-500/15 text-orange-400 border border-orange-500/20 ml-2 text-xs">{disputedPayouts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 relative">
            {disputedPayouts.map((p: any) => {
              const grinder = allGrinders.find((g: any) => g.id === p.grinderId);
              return (
                <div key={p.id} className="p-4 rounded-xl bg-white/[0.03] border border-orange-500/20 space-y-3" data-testid={`disputed-payout-${p.id}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{grinder?.name || p.grinderId}</span>
                        <span className="text-emerald-400 font-bold">{formatCurrency(Number(p.amount))}</span>
                        <Badge className="bg-orange-500/15 text-orange-400 border border-orange-500/20 text-[10px]">Disputed</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">Order {p.orderId}</span>
                    </div>
                  </div>
                  {p.completionProofUrl && (
                    <a href={p.completionProofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/20 transition-colors" data-testid={`link-proof-disputed-${p.id}`}>
                      <Video className="w-3 h-3" /> View Completion Proof
                    </a>
                  )}
                  <div className="p-3 rounded-lg bg-orange-500/[0.06] border border-orange-500/15">
                    <p className="text-xs font-medium text-orange-400 mb-1">Grinder's dispute reason:</p>
                    <p className="text-sm text-white/70">{p.disputeReason}</p>
                    {p.requestedAmount && (
                      <p className="text-xs text-white/50 mt-1.5">Requested amount: <span className="text-emerald-400 font-medium">{formatCurrency(Number(p.requestedAmount))}</span></p>
                    )}
                    {p.requestedPlatform && (
                      <p className="text-xs text-white/50">Requested platform: {p.requestedPlatform}{p.requestedDetails ? ` - ${p.requestedDetails}` : ""}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 gap-1"
                      data-testid={`button-accept-dispute-${p.id}`}
                      disabled={resolveDisputeMutation.isPending}
                      onClick={() => resolveDisputeMutation.mutate({ id: p.id, action: "accept_changes" })}>
                      <ThumbsUp className="w-3 h-3" /> Accept Changes
                    </Button>
                    <Button size="sm" className="text-xs bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/20 gap-1"
                      data-testid={`button-resend-approval-${p.id}`}
                      disabled={resolveDisputeMutation.isPending}
                      onClick={() => resolveDisputeMutation.mutate({ id: p.id, action: "resend" })}>
                      <RefreshCw className="w-3 h-3" /> Resend for Approval
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
        </FadeInUp>
      )}

      {pendingGrinderApproval.length > 0 && (
        <FadeInUp>
        <Card className="border-0 bg-gradient-to-br from-amber-500/[0.06] via-background to-background overflow-hidden relative" data-testid="card-pending-grinder-approval">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-amber-500/[0.03] -translate-y-12 translate-x-12" />
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              Awaiting Grinder Approval
              <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 ml-2 text-xs">{pendingGrinderApproval.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 relative">
            {pendingGrinderApproval.map((p: any) => {
              const grinder = allGrinders.find((g: any) => g.id === p.grinderId);
              return (
                <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]" data-testid={`pending-approval-${p.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{grinder?.name || p.grinderId}</span>
                      <span className="text-emerald-400 font-bold">{formatCurrency(Number(p.amount))}</span>
                      {p.payoutPlatform && <span className="text-xs text-muted-foreground">via {p.payoutPlatform}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">Order {p.orderId} - Waiting for grinder to confirm details</span>
                  </div>
                  <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[10px]">Awaiting Grinder</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
        </FadeInUp>
      )}

      {pendingReductions.length > 0 && isOwner && (
        <FadeInUp>
        <Card className="border-0 bg-gradient-to-br from-red-500/[0.06] via-background to-background overflow-hidden relative" data-testid="card-pending-reductions">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-red-500/[0.03] -translate-y-16 translate-x-16" />
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-red-400" />
              </div>
              Payout Reductions Pending Approval
              <Badge className="bg-red-500/15 text-red-400 border border-red-500/20 ml-2 text-xs">{pendingReductions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 relative">
            {pendingReductions.map((p: any) => {
              const grinder = allGrinders.find((g: any) => g.id === p.grinderId);
              const difference = Number(p.amount) - Number(p.requestedAmount);
              return (
                <div key={p.id} className="p-4 rounded-xl bg-white/[0.03] border border-red-500/20 space-y-3" data-testid={`pending-reduction-${p.id}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{grinder?.name || p.grinderId}</span>
                        <span className="text-white/50 line-through text-sm">{formatCurrency(Number(p.amount))}</span>
                        <ArrowDown className="w-3 h-3 text-red-400" />
                        <span className="text-red-400 font-bold">{formatCurrency(Number(p.requestedAmount))}</span>
                        <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px]">+{formatCurrency(difference)} to profit</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">Order {p.orderId} — Requested by {p.reductionRequestedBy}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/[0.06] border border-red-500/15">
                    <p className="text-xs font-medium text-red-400 mb-1">Reason for reduction:</p>
                    <p className="text-sm text-white/70">{p.reductionReason}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 gap-1"
                      data-testid={`button-approve-reduction-${p.id}`}
                      disabled={reductionReviewMutation.isPending}
                      onClick={() => reductionReviewMutation.mutate({ id: p.id, action: "approve" })}>
                      <CheckCircle className="w-3 h-3" /> Approve Reduction
                    </Button>
                    <Button size="sm" className="text-xs bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 gap-1"
                      data-testid={`button-deny-reduction-${p.id}`}
                      disabled={reductionReviewMutation.isPending}
                      onClick={() => setDenyReductionDialog(p.id)}>
                      <X className="w-3 h-3" /> Deny Reduction
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
        </FadeInUp>
      )}

      <FadeInUp>
      <Card className="border-0 bg-gradient-to-br from-emerald-500/[0.06] via-background to-background overflow-hidden relative" data-testid="card-payout-management">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-emerald-500/[0.03] -translate-y-16 translate-x-16" />
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            Active Payouts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          {[...pendingPayouts, ...approvedPayouts].length > 0 ? (
            <div className="space-y-2">
              {[...pendingPayouts, ...approvedPayouts].map((p: any) => {
                const grinder = allGrinders.find((g: any) => g.id === p.grinderId);
                return (
                  <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] sm:hover:bg-white/[0.05] transition-colors" data-testid={`staff-payout-${p.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{grinder?.name || p.grinderId}</span>
                        <span className="text-emerald-400 font-bold text-lg">{formatCurrency(Number(p.amount))}</span>
                        <Badge variant="outline" className={`text-[10px] ${p.status === "Approved" ? "text-blue-400 border-blue-500/30 bg-blue-500/10" : "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"}`}>{p.status}</Badge>
                        {(() => {
                          const payoutOrder = (orders || []).find((o: any) => o.id === p.orderId);
                          const payoutAssignment = (assignments || []).find((a: any) => a.id === p.assignmentId);
                          if (payoutOrder?.customerDiscordId && payoutOrder?.discordTicketChannelId && payoutAssignment) {
                            if (payoutAssignment.customerApproved) {
                              return (
                                <Badge variant="outline" className="text-[10px] border-green-500/20 text-green-400 bg-green-500/10 gap-0.5" data-testid={`badge-customer-approved-${p.id}`}>
                                  <CheckCircle className="w-2.5 h-2.5" /> Customer Approved
                                </Badge>
                              );
                            }
                            if (payoutAssignment.customerIssueReported) {
                              return (
                                <Badge variant="outline" className="text-[10px] border-red-500/20 text-red-400 bg-red-500/10 gap-0.5" data-testid={`badge-customer-issue-${p.id}`}>
                                  <AlertTriangle className="w-2.5 h-2.5" /> Customer Issue
                                </Badge>
                              );
                            }
                            return (
                              <Badge variant="outline" className="text-[10px] border-amber-500/20 text-amber-400 bg-amber-500/10 gap-0.5" data-testid={`badge-customer-pending-${p.id}`}>
                                <Clock className="w-2.5 h-2.5" /> Awaiting Customer
                              </Badge>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1.5">
                        {p.payoutPlatform && (
                          <Badge variant="outline" className="text-[10px] border-white/10 bg-white/[0.03] gap-1">
                            <CreditCard className="w-3 h-3" /> {p.payoutPlatform}: {p.payoutDetails || "N/A"}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">Order {p.orderId?.slice(0, 10)}</span>
                        <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                      {p.notes && <p className="text-xs text-muted-foreground mt-1 italic">{p.notes}</p>}
                      {p.completionProofUrl && (
                        <a href={p.completionProofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/20 transition-colors" data-testid={`link-proof-${p.id}`}>
                          <Video className="w-3 h-3" /> View Completion Proof
                        </a>
                      )}
                    </div>
                    {p.reductionStatus === "approved" && p.originalAmount && (
                      <div className="flex items-center gap-2 mt-1.5 p-2 rounded-lg bg-red-500/[0.06] border border-red-500/15">
                        <ArrowDown className="w-3 h-3 text-red-400 shrink-0" />
                        <span className="text-[10px] text-red-400">Reduced from {formatCurrency(Number(p.originalAmount))} — {p.reductionReason}</span>
                      </div>
                    )}
                    {p.reductionStatus === "pending" && (
                      <div className="flex items-center gap-2 mt-1.5 p-2 rounded-lg bg-amber-500/[0.06] border border-amber-500/15">
                        <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="text-[10px] text-amber-400">Reduction to {formatCurrency(Number(p.requestedAmount))} pending owner approval — {p.reductionReason}</span>
                      </div>
                    )}
                    {p.reductionStatus === "denied" && (
                      <div className="flex items-center gap-2 mt-1.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <X className="w-3 h-3 text-white/40 shrink-0" />
                        <span className="text-[10px] text-white/40">Reduction denied{p.reductionDeniedReason ? `: ${p.reductionDeniedReason}` : ""}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                      {p.status === "Pending" && (
                        <>
                          <Button size="sm" className="text-xs bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/20" data-testid={`button-approve-payout-${p.id}`}
                            disabled={payoutMutation.isPending}
                            onClick={() => payoutMutation.mutate({ id: p.id, status: "Approved" })}>
                            <CheckCircle className="w-3 h-3 mr-1" /> Approve
                          </Button>
                          <Button size="sm" className="text-xs bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20" data-testid={`button-deny-payout-${p.id}`}
                            disabled={payoutMutation.isPending}
                            onClick={() => payoutMutation.mutate({ id: p.id, status: "Denied" })}>
                            <X className="w-3 h-3 mr-1" /> Deny
                          </Button>
                        </>
                      )}
                      {(p.status === "Approved" || p.status === "Pending") && p.reductionStatus !== "pending" && (
                        <Button size="sm" className="text-xs bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/20" data-testid={`button-reduce-payout-${p.id}`}
                          onClick={() => setReduceDialog({ id: p.id, grinder: grinder?.name || p.grinderId, amount: Number(p.amount), orderId: p.orderId })}>
                          <ArrowDownCircle className="w-3 h-3 mr-1" /> Reduce
                        </Button>
                      )}
                      {(p.status === "Approved" || p.status === "Pending") && (
                        <Button size="sm" className="text-xs bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20" data-testid={`button-mark-paid-${p.id}`}
                          disabled={payoutMutation.isPending}
                          onClick={() => setMarkPaidDialog({ id: p.id, grinder: grinder?.name || p.grinderId, amount: Number(p.amount) })}>
                          <Banknote className="w-3 h-3 mr-1" /> Mark Paid
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm rounded-xl bg-white/[0.02]" data-testid="text-no-pending">
              <Wallet className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No pending payouts
            </div>
          )}

          {paidPayouts.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recently Paid ({paidPayouts.length})</p>
              {paidPayouts.slice(0, 5).map((p: any) => {
                const grinder = allGrinders.find((g: any) => g.id === p.grinderId);
                return (
                  <div key={p.id} className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-sm opacity-70" data-testid={`staff-paid-${p.id}`}>
                    <span className="font-medium">{grinder?.name || p.grinderId}</span>
                    <span className="text-emerald-400 font-semibold">{formatCurrency(Number(p.amount))}</span>
                    {p.payoutPlatform && <span className="text-xs text-muted-foreground">via {p.payoutPlatform}</span>}
                    <span className="text-xs text-muted-foreground">Order {p.orderId}</span>
                    <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px]">Paid</Badge>
                    {p.reviewedBy && <span className="text-xs text-muted-foreground">by {p.reviewedBy}</span>}
                    {p.paymentProofUrl && (
                      <a href={p.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] hover:bg-blue-500/20 transition-colors" data-testid={`link-payment-proof-${p.id}`}>
                        <ImageIcon className="w-2.5 h-2.5" /> Proof
                      </a>
                    )}
                    {p.paidAt && <button className="text-xs text-muted-foreground ml-auto hover:text-blue-400 hover:underline transition-colors cursor-pointer" title="Click to edit payout date" onClick={() => { setMarkPaidDialog({ id: p.id, grinder: grinder?.name || p.grinderId, amount: Number(p.amount), existingPaidAt: p.paidAt }); setPaidAtDate(new Date(p.paidAt).toISOString().split("T")[0]); }} data-testid={`button-edit-paid-date-${p.id}`}>{new Date(p.paidAt).toLocaleDateString()}</button>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </FadeInUp>


      <Dialog open={!!markPaidDialog} onOpenChange={(open) => { if (!open) { setMarkPaidDialog(null); setProofUrl(""); setPaidAtDate(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-400" />
              Confirm Payment
            </DialogTitle>
          </DialogHeader>
          {markPaidDialog && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <p className="text-sm">
                  {markPaidDialog.existingPaidAt ? (
                    <>Edit payout date for <span className="font-semibold text-white">{markPaidDialog.grinder}</span>'s payout of{" "}
                    <span className="text-emerald-400 font-bold">{formatCurrency(markPaidDialog.amount)}</span></>
                  ) : (
                    <>Mark <span className="font-semibold text-white">{markPaidDialog.grinder}</span>'s payout of{" "}
                    <span className="text-emerald-400 font-bold">{formatCurrency(markPaidDialog.amount)}</span> as paid?</>
                  )}
                </p>
              </div>

              {isOwner && wallets.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Deduct from Wallet (optional)</p>
                  <Select value={selectedWalletId || "none"} onValueChange={v => setSelectedWalletId(v === "none" ? "" : v)}>
                    <SelectTrigger data-testid="select-payout-wallet"><SelectValue placeholder="Select wallet" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No wallet deduction</SelectItem>
                      {wallets.filter((w: any) => w.isActive).map((w: any) => (
                        <SelectItem key={w.id} value={w.id}>{w.name} ({formatCurrency(Number(w.balance || 0))})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">If selected, the payout amount will be deducted from this wallet</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment Proof (optional)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleProofUpload(file);
                    e.target.value = "";
                  }}
                  data-testid="input-payment-proof"
                />
                {proofUrl ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    {proofUrl.match(/\.pdf$/i) ? (
                      <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <span className="text-xs text-emerald-400 truncate flex-1">{proofUrl.split("/").pop()}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-white/40 hover:text-white"
                      onClick={() => setProofUrl("")}
                      data-testid="button-remove-proof"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs border-dashed border-white/15 text-muted-foreground hover:text-white hover:border-white/30 gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    data-testid="button-upload-proof"
                  >
                    {uploading ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload className="w-3.5 h-3.5" /> Upload screenshot or receipt</>
                    )}
                  </Button>
                )}
                <p className="text-[10px] text-muted-foreground">Accepts images (JPG, PNG, GIF, WebP) and PDF files up to 25MB</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payout Date (optional)</p>
                <Input
                  type="date"
                  value={paidAtDate}
                  onChange={e => setPaidAtDate(e.target.value)}
                  className="bg-white/[0.03] border-white/10 text-xs"
                  data-testid="input-payout-date"
                />
                <p className="text-[10px] text-muted-foreground">Leave blank to use today's date</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-white/10"
              onClick={() => { setMarkPaidDialog(null); setProofUrl(""); setPaidAtDate(""); }}
              data-testid="button-cancel-mark-paid"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20 gap-1"
              disabled={payoutMutation.isPending || uploading}
              onClick={() => {
                if (markPaidDialog) {
                  payoutMutation.mutate({
                    id: markPaidDialog.id,
                    status: "Paid",
                    paymentProofUrl: proofUrl || undefined,
                    walletId: selectedWalletId || undefined,
                    paidAt: paidAtDate || undefined,
                  });
                }
              }}
              data-testid="button-confirm-mark-paid"
            >
              {payoutMutation.isPending ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Processing...</>
              ) : (
                <><CheckCircle className="w-3 h-3" /> Confirm Paid</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reduceDialog} onOpenChange={(open) => { if (!open) { setReduceDialog(null); setReduceAmount(""); setReduceReason(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownCircle className="w-5 h-5 text-orange-400" />
              Reduce Payout
            </DialogTitle>
          </DialogHeader>
          {reduceDialog && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <p className="text-sm">
                  Reducing <span className="font-semibold text-white">{reduceDialog.grinder}</span>'s payout for order{" "}
                  <span className="text-white/70">{reduceDialog.orderId}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">Current amount: <span className="text-emerald-400 font-semibold">{formatCurrency(reduceDialog.amount)}</span></p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={reduceDialog.amount - 0.01}
                  placeholder="Enter reduced amount"
                  value={reduceAmount}
                  onChange={(e) => setReduceAmount(e.target.value)}
                  className="bg-background/50 border-white/10"
                  data-testid="input-reduce-amount"
                />
                {reduceAmount && Number(reduceAmount) < reduceDialog.amount && Number(reduceAmount) >= 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-red-400">-{formatCurrency(reduceDialog.amount - Number(reduceAmount))}</span>
                    <ArrowDown className="w-3 h-3 text-white/30" />
                    <span className="text-emerald-400">+{formatCurrency(reduceDialog.amount - Number(reduceAmount))} company profit</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason for Reduction</label>
                <Textarea
                  placeholder="Explain why the payout is being reduced..."
                  value={reduceReason}
                  onChange={(e) => setReduceReason(e.target.value)}
                  className="bg-background/50 border-white/10 min-h-[80px] resize-none"
                  data-testid="input-reduce-reason"
                />
              </div>

              {!isOwner && (
                <div className="p-2.5 rounded-lg bg-amber-500/[0.06] border border-amber-500/15">
                  <p className="text-[10px] text-amber-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3 h-3 shrink-0" />
                    This reduction requires owner approval before taking effect.
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-white/10"
              onClick={() => { setReduceDialog(null); setReduceAmount(""); setReduceReason(""); }}
              data-testid="button-cancel-reduce"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/20 gap-1"
              disabled={reduceMutation.isPending || !reduceAmount || !reduceReason || Number(reduceAmount) >= (reduceDialog?.amount || 0) || Number(reduceAmount) < 0}
              onClick={() => {
                if (reduceDialog) {
                  reduceMutation.mutate({ id: reduceDialog.id, newAmount: reduceAmount, reason: reduceReason });
                }
              }}
              data-testid="button-confirm-reduce"
            >
              {reduceMutation.isPending ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Processing...</>
              ) : isOwner ? (
                <><ArrowDownCircle className="w-3 h-3" /> Apply Reduction</>
              ) : (
                <><ArrowDownCircle className="w-3 h-3" /> Submit for Approval</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!denyReductionDialog} onOpenChange={(open) => { if (!open) { setDenyReductionDialog(null); setDenyReductionReason(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="w-5 h-5 text-red-400" />
              Deny Reduction
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason for Denial (optional)</label>
              <Textarea
                placeholder="Explain why the reduction was denied..."
                value={denyReductionReason}
                onChange={(e) => setDenyReductionReason(e.target.value)}
                className="bg-background/50 border-white/10 min-h-[80px] resize-none"
                data-testid="input-deny-reduction-reason"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-white/10"
              onClick={() => { setDenyReductionDialog(null); setDenyReductionReason(""); }}
              data-testid="button-cancel-deny-reduction"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 gap-1"
              disabled={reductionReviewMutation.isPending}
              onClick={() => {
                if (denyReductionDialog) {
                  reductionReviewMutation.mutate({ id: denyReductionDialog, action: "deny", deniedReason: denyReductionReason });
                }
              }}
              data-testid="button-confirm-deny-reduction"
            >
              {reductionReviewMutation.isPending ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Processing...</>
              ) : (
                <><X className="w-3 h-3" /> Confirm Denial</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  );
}
