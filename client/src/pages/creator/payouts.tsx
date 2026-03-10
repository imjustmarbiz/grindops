import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Banknote, Loader2, CreditCard, Send, Clock, CheckCircle, BarChart3, Wallet, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AnimatedPage, FadeInUp } from "@/lib/animations";

const CARD_GRADIENT = "border-0 bg-gradient-to-br from-emerald-500/[0.08] via-background to-emerald-900/[0.04] overflow-hidden relative shadow-xl shadow-black/20";
const ICON_BG = "bg-emerald-500/15";
const ACCENT_TEXT = "text-emerald-400";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function formatError(e: unknown): string {
  const msg = e && typeof e === "object" && "message" in e ? String((e as Error).message) : "";
  if (msg === "Failed to fetch" || msg.includes("NetworkError"))
    return "Check your connection and try again.";
  const match = msg.match(/^\d+:\s*(\{.*\})$/);
  if (match) {
    try {
      const body = JSON.parse(match[1]);
      if (typeof body?.message === "string") return body.message;
    } catch {}
  }
  return msg || "Something went wrong. Please try again.";
}

type Dashboard = {
  creator: { code: string; displayName: string; payoutMethod?: string | null; payoutDetail?: string | null };
  availableBalance: string;
  creatorPayoutMethods?: string[];
  payoutRequests: Array<{ id: string; amount: string; status: string; createdAt: string; paidAt?: string | null; proofUrl?: string | null }>;
  pendingPayoutDetailRequest?: {
    id: string;
    requestedMethod: string;
    requestedDetail: string;
    status: string;
    createdAt: string;
  } | null;
};

export default function CreatorPayouts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: dashboard, isLoading, isError, error } = useQuery<Dashboard>({ queryKey: ["/api/creator/dashboard"] });
  const creator = dashboard?.creator;
  const [payoutMethod, setPayoutMethod] = useState(creator?.payoutMethod ?? "paypal");
  const [payoutDetail, setPayoutDetail] = useState(creator?.payoutDetail ?? "");
  const [requestAmount, setRequestAmount] = useState("");
  const hasSyncedPayoutFromServer = useRef(false);

  const methodLabels: Record<string, string> = { paypal: "PayPal", zelle: "Zelle", applepay: "Apple Pay", venmo: "Venmo", cashapp: "Cash App" };
  const detailPlaceholders: Record<string, string> = {
    paypal: "PayPal email",
    zelle: "Email or phone",
    applepay: "Email or phone",
    venmo: "@username",
    cashapp: "$cashtag",
  };

  // Sync payout details from server when dashboard loads
  useEffect(() => {
    if (creator?.payoutMethod && creator?.payoutDetail) {
      if (!hasSyncedPayoutFromServer.current) {
        setPayoutMethod(creator.payoutMethod);
        setPayoutDetail(creator.payoutDetail);
        hasSyncedPayoutFromServer.current = true;
      }
    } else {
      hasSyncedPayoutFromServer.current = false;
    }
  }, [creator?.payoutMethod, creator?.payoutDetail]);

  const updatePayoutMutation = useMutation({
    mutationFn: async (payload: { payoutMethod: string; payoutDetail: string }) => {
      const res = await apiRequest("PATCH", "/api/creator/me", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/creator/me"] });
      hasSyncedPayoutFromServer.current = true; // keep form in sync with server
      toast({ title: "Payout details saved" });
    },
    onError: (e: any) => toast({ title: "Failed to save", description: formatError(e), variant: "destructive" }),
  });

  const requestPayoutMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("POST", "/api/creator/request-payout", { amount });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/creator/payouts"] });
      toast({ title: "Payout requested" });
      setRequestAmount("");
    },
    onError: (e: any) => toast({ title: "Request failed", description: formatError(e), variant: "destructive" }),
  });

  const requestDetailChangeMutation = useMutation({
    mutationFn: async (payload: { payoutMethod: string; payoutDetail: string }) => {
      const res = await apiRequest("POST", "/api/creator/request-payout-detail-change", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/dashboard"] });
      toast({ title: "Change requested", description: "Staff will review and update your payout details when approved." });
    },
    onError: (e: any) => toast({ title: "Request failed", description: formatError(e), variant: "destructive" }),
  });

  const payouts = dashboard?.payoutRequests ?? [];
  const availableBalance = Number(dashboard?.availableBalance ?? 0);
  const allowedMethods = dashboard?.creatorPayoutMethods ?? ["paypal"];
  const hasPayoutDetails = !!(creator?.payoutMethod && creator?.payoutDetail);
  const pendingDetailRequest = dashboard?.pendingPayoutDetailRequest ?? null;
  const canRequest = hasPayoutDetails && availableBalance > 0;
  const effectiveRequestAmount = requestAmount.trim() !== "" ? parseFloat(requestAmount) : availableBalance;
  const isRequestAmountValid = !Number.isNaN(effectiveRequestAmount) && effectiveRequestAmount > 0 && effectiveRequestAmount <= availableBalance;

  const paid = payouts.filter((p: any) => p.status === "paid");
  const pending = payouts.filter((p: any) => ["pending", "approved"].includes((p.status || "").toLowerCase()));
  const totalPaid = paid.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  const savePayoutDetails = () => {
    const detail = payoutDetail.trim();
    if (!detail) {
      toast({ title: "Enter your payout details", variant: "destructive" });
      return;
    }
    if (["paypal", "zelle", "applepay"].includes(payoutMethod)) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(detail)) {
        toast({ title: "Enter a valid email address", variant: "destructive" });
        return;
      }
    }
    updatePayoutMutation.mutate({ payoutMethod, payoutDetail: detail });
  };

  const requestDetailChange = () => {
    const detail = payoutDetail.trim();
    if (!detail) {
      toast({ title: "Enter your payout details", variant: "destructive" });
      return;
    }
    if (["paypal", "zelle", "applepay"].includes(payoutMethod)) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(detail)) {
        toast({ title: "Enter a valid email address", variant: "destructive" });
        return;
      }
    }
    requestDetailChangeMutation.mutate({ payoutMethod, payoutDetail: detail });
  };

  const submitRequestPayout = () => {
    if (!canRequest || !isRequestAmountValid) return;
    requestPayoutMutation.mutate(effectiveRequestAmount);
  };

  if (isLoading) {
    return (
      <AnimatedPage className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </AnimatedPage>
    );
  }

  if (isError) {
    return (
      <AnimatedPage className="space-y-3 sm:space-y-6">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          <p className="font-medium">Couldn’t load payouts</p>
          <p className="text-sm mt-1 opacity-90">{formatError(error)}</p>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="space-y-6">
      {/* Overview hero */}
      <FadeInUp>
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-green-950/30 p-5 sm:p-6">
          <div
            className="absolute top-0 right-0 w-64 h-64 -translate-y-12 translate-x-8 rounded-full overflow-hidden [mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)] [mask-size:100%_100%] [mask-position:center]"
          >
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 flex items-center justify-center opacity-30">
              <Banknote className="w-32 h-32 text-emerald-400" />
            </div>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0">
                <Banknote className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display tracking-tight text-white">
                  Payouts
                </h1>
                <p className="text-sm text-white/80 mt-0.5">
                  Manage your payout details and request earnings from your creator code.
                </p>
                <p className="text-xs text-white/50 mt-1 italic">
                  One early payout per month, or on the 15th. Contact support with questions.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {pending.length > 0 && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {pending.length} pending
                </Badge>
              )}
              {hasPayoutDetails && availableBalance > 0 && pending.length === 0 && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  Balance ready
                </Badge>
              )}
            </div>
          </div>
        </div>
      </FadeInUp>

      {/* Summary metric cards */}
      <FadeInUp>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-0 overflow-hidden relative bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-amber-400/80">Available balance</p>
                  <p className="text-xl sm:text-2xl font-bold text-amber-400 tracking-tight mt-0.5">{formatCurrency(availableBalance)}</p>
                  <p className="text-[10px] text-white/40 mt-1">Ready to request</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 overflow-hidden relative bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-400/80">Paid out</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-400 tracking-tight mt-0.5">{formatCurrency(totalPaid)}</p>
                  <p className="text-[10px] text-white/40 mt-1">{paid.length === 0 ? "No payouts yet" : paid.length === 1 ? "1 payout" : `${paid.length} payouts`}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 overflow-hidden relative bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-blue-400/80">Total requests</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-400 tracking-tight mt-0.5">{payouts.length}</p>
                  <p className="text-[10px] text-white/40 mt-1">All time</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeInUp>

      {/* Payout Details + Request Payout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
      {allowedMethods.length > 0 && (
        <FadeInUp className="h-full">
          <Card className={`${CARD_GRADIENT} h-full flex flex-col`}>
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-emerald-500/[0.04] -translate-y-10 translate-x-10" />
            <CardHeader className="pb-2 relative p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${ICON_BG} flex items-center justify-center`}>
                  <CreditCard className={`w-4 h-4 ${ACCENT_TEXT}`} />
                </div>
                Payout Details
              </h2>
              <p className="text-xs text-white/60">
                {hasPayoutDetails
                  ? <>Your {methodLabels[creator?.payoutMethod ?? ""] ?? creator?.payoutMethod ?? "payout"} details are saved. To change them, use <strong>Request Change</strong> below (staff approval).</>
                  : "Add your payout details below. Choose your method and enter the required info. Request Change appears after saving if you need staff to update it later."}
              </p>
            </CardHeader>
            <CardContent className="relative flex flex-col gap-2 flex-1 p-4 sm:p-6 pt-0 md:flex-row md:flex-wrap md:items-end md:gap-3">
              <Select value={allowedMethods.includes(payoutMethod) ? payoutMethod : allowedMethods[0]} onValueChange={(v) => { setPayoutMethod(v); setPayoutDetail(""); }}>
                <SelectTrigger className="w-full sm:max-w-[160px] bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  {allowedMethods.map((m) => (
                    <SelectItem key={m} value={m}>{methodLabels[m] ?? m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type={["paypal", "zelle", "applepay"].includes(payoutMethod) ? "email" : "text"}
                placeholder={detailPlaceholders[payoutMethod] ?? "Details"}
                value={payoutDetail}
                onChange={(e) => setPayoutDetail(e.target.value)}
                className="w-full sm:max-w-xs md:min-w-[200px] bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
              <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={savePayoutDetails}
                  disabled={updatePayoutMutation.isPending}
                  className="w-full sm:w-auto border-emerald-500/30 bg-emerald-500/15 hover:bg-emerald-500/25 text-white shrink-0"
                >
                  {updatePayoutMutation.isPending ? "Saving…" : (creator?.payoutMethod === payoutMethod && creator?.payoutDetail && payoutDetail.trim() === creator.payoutDetail ? "Saved" : "Save")}
                </Button>
                {hasPayoutDetails && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={requestDetailChange}
                  disabled={!!pendingDetailRequest || requestDetailChangeMutation.isPending || (creator?.payoutMethod === payoutMethod && creator?.payoutDetail && payoutDetail.trim() === creator.payoutDetail)}
                  className="w-full sm:w-auto border-white/20 bg-white/10 hover:bg-white/20 text-white shrink-0"
                >
                  {requestDetailChangeMutation.isPending ? "Requesting…" : "Request Change (Staff Approval)"}
                </Button>
                )}
              </div>
              {pendingDetailRequest && (
                <p className="text-sm text-amber-200/90 w-full mt-1">
                  You have a pending request to change payout to <strong>{methodLabels[pendingDetailRequest.requestedMethod] ?? pendingDetailRequest.requestedMethod}: {pendingDetailRequest.requestedDetail}</strong>. Staff will review and update your profile when approved.
                </p>
              )}
            </CardContent>
          </Card>
        </FadeInUp>
      )}

      {/* Request Payout — always visible so creators see how to request */}
      <FadeInUp className="h-full">
        <Card className={`${CARD_GRADIENT} h-full flex flex-col`}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-emerald-500/[0.04] -translate-y-10 translate-x-10" />
          <CardHeader className="pb-2 relative p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg ${ICON_BG} flex items-center justify-center`}>
                <Send className={`w-4 h-4 ${ACCENT_TEXT}`} />
              </div>
              Request Payout
            </h2>
            <p className="text-xs text-white/60">
              {hasPayoutDetails
                ? (availableBalance > 0
                  ? `Available: ${formatCurrency(availableBalance)}. Request all or enter an amount below.`
                  : "When you have a balance from orders placed with your code, you can request a payout here. Complete orders with your creator code to earn commission.")
                : "Request a payout here once you have a balance from your code."}
            </p>
          </CardHeader>
          <CardContent className="relative flex flex-col sm:flex-row gap-2 p-4 sm:p-6 pt-0">
            <Input
              type="number"
              min={0}
              step={0.01}
              max={availableBalance}
              placeholder={formatCurrency(availableBalance)}
              value={requestAmount}
              onChange={(e) => setRequestAmount(e.target.value)}
              className="w-full sm:max-w-xs md:min-w-[180px] bg-white/5 border-white/10 text-white placeholder:text-white/40"
              disabled={!hasPayoutDetails || availableBalance <= 0}
            />
            <Button
              size="sm"
              onClick={submitRequestPayout}
              disabled={!hasPayoutDetails || availableBalance <= 0 || !isRequestAmountValid || requestPayoutMutation.isPending}
              className="w-full sm:w-auto border-emerald-500/30 bg-emerald-500/15 hover:bg-emerald-500/25 text-white shrink-0"
            >
              {requestPayoutMutation.isPending ? "Requesting…" : "Request Payout"}
            </Button>
          </CardContent>
        </Card>
      </FadeInUp>
      </div>

      {/* Pending requests section */}
      {pending.length > 0 && (
        <FadeInUp>
          <Card className="border-white/[0.06] bg-white/[0.02] border-amber-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Pending requests
                <Badge className="ml-1 bg-amber-500/20 text-amber-400 border-amber-500/30">{pending.length}</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">Awaiting staff processing. You’ll be notified when paid.</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {pending.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <div>
                    <span className="font-medium text-emerald-400">{formatCurrency(Number(p.amount || 0))}</span>
                    <p className="text-xs text-white/50 mt-0.5">Requested — waiting for staff</p>
                  </div>
                  <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400 capitalize">{p.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeInUp>
      )}

      {/* Payout history */}
      <FadeInUp>
        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              Payout History
            </CardTitle>
            <p className="text-sm text-muted-foreground">All your payout requests and status.</p>
          </CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                  <Wallet className="w-6 h-6 text-white/40" />
                </div>
                <p className="text-sm text-white/70">No payouts yet</p>
                <p className="text-xs text-white/50 mt-1">When staff processes your requests, they’ll appear here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {payouts.map((p: any) => {
                  const isPaid = (p.status || "").toLowerCase() === "paid";
                  return (
                    <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg border ${isPaid ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/[0.04] border-white/10"}`} data-testid={`payout-row-${p.id}`}>
                      <div className="flex flex-col gap-0.5">
                        <span className={`font-medium ${isPaid ? "text-emerald-400" : "text-white/90"}`}>{formatCurrency(Number(p.amount || 0))}</span>
                        <div className="flex items-center gap-2">
                          {p.paidAt && (
                            <span className="text-xs text-white/30">Paid {new Date(p.paidAt).toLocaleDateString()}</span>
                          )}
                          {!p.paidAt && p.createdAt && (
                            <span className="text-xs text-white/30">Requested {new Date(p.createdAt).toLocaleDateString()}</span>
                          )}
                          {isPaid && p.proofUrl && (
                            <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors" data-testid={`link-receipt-${p.id}`}>
                              <ExternalLink className="w-3 h-3" />
                              Receipt
                            </a>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-xs capitalize ${isPaid ? "border-emerald-500/30 text-emerald-400" : "border-white/20 text-white/80"}`}>{p.status}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeInUp>
    </AnimatedPage>
  );
}
