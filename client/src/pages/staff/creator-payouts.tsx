import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/staff-utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Banknote, CheckCircle, X, CreditCard, Loader2, DollarSign, Clock, TrendingUp, Filter, Upload, ImageIcon, FileText } from "lucide-react";
import { HelpTip } from "@/components/help-tip";
import { AnimatedPage, FadeInUp } from "@/lib/animations";

export default function StaffCreatorPayouts() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isOwner = user?.role === "owner";

  const { data: payouts = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/staff/creator-payouts"],
    refetchInterval: 30000,
  });

  const { data: wallets = [] } = useQuery<any[]>({ queryKey: ["/api/wallets"] });

  const [markPaidDialog, setMarkPaidDialog] = useState<{ id: string; creator: string; amount: number } | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");
  const [proofUrl, setProofUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCreator, setFilterCreator] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [rejectDialog, setRejectDialog] = useState<{ id: string; creator: string; amount: number } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/staff/creator-payouts/${id}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/creator-payouts"] });
      toast({ title: "Creator payout approved" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to approve", description: err.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await apiRequest("PATCH", `/api/staff/creator-payouts/${id}/reject`, { reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/creator-payouts"] });
      toast({ title: "Creator payout rejected" });
      setRejectDialog(null);
      setRejectReason("");
    },
    onError: (err: any) => {
      toast({ title: "Failed to reject", description: err.message, variant: "destructive" });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async ({ id, walletId, proofUrl: proof }: { id: string; walletId?: string; proofUrl?: string }) => {
      const res = await apiRequest("PATCH", `/api/staff/creator-payouts/${id}/pay`, { walletId, proofUrl: proof });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/creator-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet-summary"] });
      toast({ title: "Creator payout marked as paid" });
      setMarkPaidDialog(null);
      setProofUrl("");
      setSelectedWalletId("");
    },
    onError: (err: any) => {
      toast({ title: "Failed to mark paid", description: err.message, variant: "destructive" });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-creator-payouts">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  const filteredPayouts = payouts.filter((p: any) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterCreator.trim()) {
      if (!(p.recipientName || "").toLowerCase().includes(filterCreator.trim().toLowerCase())) return false;
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

  const pendingPayouts = filteredPayouts.filter((p: any) => p.status === "pending");
  const approvedPayouts = filteredPayouts.filter((p: any) => p.status === "approved");
  const paidPayouts = filteredPayouts.filter((p: any) => p.status === "paid");
  const rejectedPayouts = filteredPayouts.filter((p: any) => p.status === "rejected");

  const totalOwed = [...pendingPayouts, ...approvedPayouts].reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const totalPaidOut = paidPayouts.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

  return (
    <AnimatedPage className="space-y-5 sm:space-y-6" data-testid="page-creator-payouts">
      <FadeInUp>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <DollarSign className="w-7 h-7 text-emerald-400" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight flex items-center gap-2" data-testid="text-page-title">
                Creator Payouts
                <HelpTip text="Creator payouts are commission requests from creators whose codes were used on completed orders. Review, approve, and mark as paid." />
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Review and manage creator commission payouts</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingPayouts.length > 0 && (
              <Badge className="bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 gap-1 animate-pulse">
                <Clock className="w-3 h-3" />
                {pendingPayouts.length} pending
              </Badge>
            )}
            {approvedPayouts.length > 0 && (
              <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/20 gap-1">
                <CheckCircle className="w-3 h-3" />
                {approvedPayouts.length} approved
              </Badge>
            )}
          </div>
        </div>
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Search creator..."
            value={filterCreator}
            onChange={(e) => setFilterCreator(e.target.value)}
            className="w-[200px] bg-background/50 border-white/10"
            data-testid="input-filter-creator"
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
          {(filterStatus !== "all" || filterCreator || filterDateFrom || filterDateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterStatus("all"); setFilterCreator(""); setFilterDateFrom(""); setFilterDateTo(""); }}
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
            { label: "Total Requests", value: String(filteredPayouts.length), icon: TrendingUp, gradient: "from-blue-500/[0.08] via-background to-blue-900/[0.04]", iconBg: "bg-blue-500/15", textColor: "text-blue-400", testId: "text-total-requests" },
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

      <FadeInUp>
        <Card className="border-0 bg-gradient-to-br from-emerald-500/[0.06] via-background to-background overflow-hidden relative" data-testid="card-creator-payout-management">
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
                {[...pendingPayouts, ...approvedPayouts].map((p: any) => (
                  <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] sm:hover:bg-white/[0.05] transition-colors" data-testid={`creator-payout-${p.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{p.recipientName}</span>
                        <span className="text-emerald-400 font-bold text-lg">{formatCurrency(Number(p.amount))}</span>
                        <Badge variant="outline" className={`text-[10px] ${p.status === "approved" ? "text-blue-400 border-blue-500/30 bg-blue-500/10" : "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"}`}>
                          {p.status === "approved" ? "Approved" : "Pending"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1.5">
                        {p.description && (
                          <Badge variant="outline" className="text-[10px] border-white/10 bg-white/[0.03] gap-1">
                            <CreditCard className="w-3 h-3" /> {p.description}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                      {p.status === "pending" && (
                        <>
                          <Button size="sm" className="text-xs bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/20" data-testid={`button-approve-creator-payout-${p.id}`}
                            disabled={approveMutation.isPending}
                            onClick={() => approveMutation.mutate(p.id)}>
                            <CheckCircle className="w-3 h-3 mr-1" /> Approve
                          </Button>
                          <Button size="sm" className="text-xs bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20" data-testid={`button-reject-creator-payout-${p.id}`}
                            onClick={() => setRejectDialog({ id: p.id, creator: p.recipientName, amount: Number(p.amount) })}>
                            <X className="w-3 h-3 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      {p.status === "approved" && isOwner && (
                        <Button size="sm" className="text-xs bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20" data-testid={`button-mark-paid-creator-${p.id}`}
                          onClick={() => setMarkPaidDialog({ id: p.id, creator: p.recipientName, amount: Number(p.amount) })}>
                          <Banknote className="w-3 h-3 mr-1" /> Mark Paid
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm rounded-xl bg-white/[0.02]" data-testid="text-no-pending-creator">
                <Wallet className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No pending creator payouts
              </div>
            )}

            {paidPayouts.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recently Paid ({paidPayouts.length})</p>
                {paidPayouts.slice(0, 10).map((p: any) => (
                  <div key={p.id} className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-sm opacity-70" data-testid={`creator-paid-${p.id}`}>
                    <span className="font-medium">{p.recipientName}</span>
                    <span className="text-emerald-400 font-semibold">{formatCurrency(Number(p.amount))}</span>
                    {p.description && <span className="text-xs text-muted-foreground">via {p.description}</span>}
                    <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px]">Paid</Badge>
                    {p.approvedByName && <span className="text-xs text-muted-foreground">by {p.approvedByName}</span>}
                    {p.proofUrl && (
                      <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] hover:bg-blue-500/20 transition-colors" data-testid={`link-payment-proof-creator-${p.id}`}>
                        <ImageIcon className="w-2.5 h-2.5" /> Proof
                      </a>
                    )}
                    {p.paidAt && <span className="text-xs text-muted-foreground ml-auto">{new Date(p.paidAt).toLocaleDateString()}</span>}
                  </div>
                ))}
              </div>
            )}

            {rejectedPayouts.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rejected ({rejectedPayouts.length})</p>
                {rejectedPayouts.slice(0, 5).map((p: any) => (
                  <div key={p.id} className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-red-500/10 text-sm opacity-50" data-testid={`creator-rejected-${p.id}`}>
                    <span className="font-medium">{p.recipientName}</span>
                    <span className="text-red-400 font-semibold">{formatCurrency(Number(p.amount))}</span>
                    <Badge className="bg-red-500/15 text-red-400 border border-red-500/20 text-[10px]">Rejected</Badge>
                    {p.rejectionReason && <span className="text-xs text-muted-foreground italic">{p.rejectionReason}</span>}
                    {p.rejectedAt && <span className="text-xs text-muted-foreground ml-auto">{new Date(p.rejectedAt).toLocaleDateString()}</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeInUp>

      <Dialog open={!!markPaidDialog} onOpenChange={(open) => { if (!open) { setMarkPaidDialog(null); setProofUrl(""); setSelectedWalletId(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-400" />
              Confirm Creator Payment
            </DialogTitle>
          </DialogHeader>
          {markPaidDialog && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <p className="text-sm">
                  Mark <span className="font-semibold text-white">{markPaidDialog.creator}</span>'s payout of{" "}
                  <span className="text-emerald-400 font-bold">{formatCurrency(markPaidDialog.amount)}</span> as paid?
                </p>
              </div>

              {isOwner && wallets.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Deduct from Wallet (optional)</p>
                  <Select value={selectedWalletId || "none"} onValueChange={v => setSelectedWalletId(v === "none" ? "" : v)}>
                    <SelectTrigger data-testid="select-creator-payout-wallet"><SelectValue placeholder="Select wallet" /></SelectTrigger>
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
                  data-testid="input-creator-payment-proof"
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
                      data-testid="button-remove-creator-proof"
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
                    data-testid="button-upload-creator-proof"
                  >
                    {uploading ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload className="w-3.5 h-3.5" /> Upload screenshot or receipt</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-white/10"
              onClick={() => { setMarkPaidDialog(null); setProofUrl(""); setSelectedWalletId(""); }}
              data-testid="button-cancel-creator-mark-paid"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20 gap-1"
              disabled={markPaidMutation.isPending || uploading}
              onClick={() => {
                if (markPaidDialog) {
                  markPaidMutation.mutate({
                    id: markPaidDialog.id,
                    walletId: selectedWalletId || undefined,
                    proofUrl: proofUrl || undefined,
                  });
                }
              }}
              data-testid="button-confirm-creator-mark-paid"
            >
              {markPaidMutation.isPending ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Processing...</>
              ) : (
                <><CheckCircle className="w-3 h-3" /> Confirm Paid</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectDialog} onOpenChange={(open) => { if (!open) { setRejectDialog(null); setRejectReason(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="w-5 h-5 text-red-400" />
              Reject Creator Payout
            </DialogTitle>
          </DialogHeader>
          {rejectDialog && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <p className="text-sm">
                  Reject <span className="font-semibold text-white">{rejectDialog.creator}</span>'s payout of{" "}
                  <span className="text-red-400 font-bold">{formatCurrency(rejectDialog.amount)}</span>?
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason (optional)</label>
                <Textarea
                  placeholder="Explain why the payout was rejected..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="bg-background/50 border-white/10 min-h-[80px] resize-none"
                  data-testid="input-reject-creator-reason"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-white/10"
              onClick={() => { setRejectDialog(null); setRejectReason(""); }}
              data-testid="button-cancel-reject-creator"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 gap-1"
              disabled={rejectMutation.isPending}
              onClick={() => {
                if (rejectDialog) {
                  rejectMutation.mutate({ id: rejectDialog.id, reason: rejectReason });
                }
              }}
              data-testid="button-confirm-reject-creator"
            >
              {rejectMutation.isPending ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Processing...</>
              ) : (
                <><X className="w-3 h-3" /> Confirm Rejection</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  );
}
