import { useState } from "react";
import { useGrinderData } from "@/hooks/use-grinder-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertOctagon, Shield, Crown, DollarSign, Ban, CheckCircle2,
  AlertTriangle, Loader2, Clock, Info, Scale, Send, XCircle, TrendingUp
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function GrinderStrikes() {
  const {
    grinder, isElite, strikeLogs, strikeAppeals, isLoading,
    eliteGradient, eliteBorder, eliteAccent,
  } = useGrinderData();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [appealDialogOpen, setAppealDialogOpen] = useState(false);
  const [appealStrikeId, setAppealStrikeId] = useState<string | null>(null);
  const [appealReason, setAppealReason] = useState("");

  const ackMutation = useMutation({
    mutationFn: async (strikeId: string) => {
      const res = await apiRequest("POST", `/api/grinder/me/strikes/${strikeId}/ack`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinder/me"] });
      toast({ title: "Strike acknowledged" });
    },
  });

  const appealMutation = useMutation({
    mutationFn: async (data: { strikeLogId: string; reason: string }) => {
      const res = await apiRequest("POST", "/api/grinder/me/strike-appeals", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinder/me"] });
      setAppealDialogOpen(false);
      setAppealStrikeId(null);
      setAppealReason("");
      toast({ title: "Appeal submitted", description: "Staff will review your appeal." });
    },
    onError: (e: any) => toast({ title: "Appeal failed", description: e.message, variant: "destructive" }),
  });

  const openAppealDialog = (strikeId: string) => {
    setAppealStrikeId(strikeId);
    setAppealReason("");
    setAppealDialogOpen(true);
  };

  const submitAppeal = () => {
    if (!appealStrikeId || !appealReason.trim()) return;
    appealMutation.mutate({ strikeLogId: appealStrikeId, reason: appealReason.trim() });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentStrikes = grinder?.strikes || 0;
  const outstandingFine = parseFloat(grinder?.outstandingFine || "0");
  const isSuspended = grinder?.suspended || false;
  const unpaidLogs = strikeLogs.filter((l: any) => l.delta > 0 && !l.finePaid && parseFloat(l.fineAmount || "0") > 0);

  const getAppealForStrike = (strikeLogId: string) => {
    return strikeAppeals.find((a: any) => a.strikeLogId === strikeLogId);
  };

  const canAppeal = (log: any) => {
    if (log.delta <= 0) return false;
    const existing = getAppealForStrike(log.id);
    if (existing && (existing.status === "pending" || existing.status === "approved")) return false;
    return true;
  };

  const pendingAppeals = strikeAppeals.filter((a: any) => a.status === "pending");

  const strikeActions = [
    "Using exploits, glitches, or unauthorized boosting methods",
    "Failing to complete an assigned order within the agreed timeline",
    "Actions resulting in a customer account being banned or suspended",
    "Unresponsive or inadequate communication with staff during an active order",
    "Failing to provide timely progress updates to the customer",
    "Disrespectful or unprofessional behavior toward staff, customers, or other grinders",
    "Violating any terms outlined in the grinder service agreement",
  ];

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <FadeInUp delay={0}>
          <div className="flex items-center gap-3">
            <Shield className={`w-7 h-7 ${isElite ? "text-cyan-400" : "text-red-400"}`} />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight">Strikes & Policy</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Your strike status, fines, appeals, and grinder policy overview
              </p>
            </div>
          </div>
        </FadeInUp>

        <FadeInUp delay={0.05}>
          <Card className={`border-0 bg-gradient-to-br ${currentStrikes > 0 ? "from-red-500/[0.08] via-background to-red-900/[0.04]" : "from-emerald-500/[0.08] via-background to-emerald-900/[0.04]"} overflow-hidden relative`} data-testid="card-strike-status">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/[0.02] -translate-y-12 translate-x-12" />
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${currentStrikes > 0 ? "bg-red-500/15" : "bg-emerald-500/15"} flex items-center justify-center`}>
                  <AlertOctagon className={`w-4 h-4 ${currentStrikes > 0 ? "text-red-400" : "text-emerald-400"}`} />
                </div>
                Your Strike Status
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-full ${i < currentStrikes ? "bg-red-500 shadow-lg shadow-red-500/30" : "bg-white/[0.1]"}`}
                      />
                    ))}
                  </div>
                  <p className="text-2xl font-bold mt-1" data-testid="text-strike-count">{currentStrikes}/3</p>
                  <p className="text-[10px] text-muted-foreground">Active Strikes</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                  <p className={`text-2xl font-bold ${outstandingFine > 0 ? "text-red-400" : "text-emerald-400"}`} data-testid="text-outstanding-fine">
                    ${outstandingFine.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Outstanding Fine</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                  <Badge className={`text-sm px-3 py-1 ${isSuspended ? "bg-red-500/20 text-red-400 border-red-500/20" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"}`} data-testid="badge-suspension-status">
                    {isSuspended ? "Suspended" : "Active"}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-2">Account Status</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                  <p className="text-2xl font-bold text-muted-foreground" data-testid="text-total-strikes-history">{strikeLogs.filter((l: any) => l.delta > 0).length}</p>
                  <p className="text-[10px] text-muted-foreground">Total Strikes Received</p>
                </div>
              </div>

              {isSuspended && outstandingFine > 0 && (
                <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] p-4" data-testid="alert-suspension">
                  <div className="flex items-start gap-3">
                    <Ban className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-300">Account Suspended</p>
                      <p className="text-xs text-red-200/70 mt-1">
                        You have an outstanding fine of <span className="font-bold text-red-300">${outstandingFine.toFixed(2)}</span>. You cannot bid on or receive new orders until this fine is paid. Contact staff to arrange payment, or submit an appeal below if you believe a strike was issued in error.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeInUp>

        {unpaidLogs.length > 0 && (
          <FadeInUp delay={0.08}>
            <Card className="border-0 bg-gradient-to-br from-red-500/[0.06] via-background to-background overflow-hidden relative" data-testid="card-unpaid-fines">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-red-400" />
                  </div>
                  Unpaid Fines
                  <Badge className="bg-red-500/15 text-red-400 border border-red-500/20 ml-auto text-xs">
                    {unpaidLogs.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {unpaidLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-red-500/[0.04] border border-red-500/15"
                    data-testid={`row-unpaid-fine-${log.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{log.reason}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(log.createdAt).toLocaleString()} — Strike #{log.resultingStrikes}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-red-400">${parseFloat(log.fineAmount).toFixed(2)}</p>
                      <p className="text-[10px] text-red-400/60">Contact staff to pay</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </FadeInUp>
        )}

        {strikeAppeals.length > 0 && (
          <FadeInUp delay={0.09}>
            <Card className="border-0 bg-gradient-to-br from-violet-500/[0.06] via-background to-violet-900/[0.03] overflow-hidden relative" data-testid="card-my-appeals">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-violet-500/[0.02] -translate-y-12 translate-x-12" />
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                    <Scale className="w-4 h-4 text-violet-400" />
                  </div>
                  My Appeals
                  {pendingAppeals.length > 0 && (
                    <Badge className="bg-violet-500/15 text-violet-400 border border-violet-500/20 ml-auto text-xs animate-pulse">
                      {pendingAppeals.length} pending
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {strikeAppeals.map((appeal: any) => {
                  const strikeLog = strikeLogs.find((l: any) => l.id === appeal.strikeLogId);
                  return (
                    <div
                      key={appeal.id}
                      className={`p-3 rounded-lg border ${
                        appeal.status === "pending" ? "bg-violet-500/[0.04] border-violet-500/15" :
                        appeal.status === "approved" ? "bg-emerald-500/[0.04] border-emerald-500/15" :
                        "bg-red-500/[0.04] border-red-500/15"
                      }`}
                      data-testid={`card-appeal-${appeal.id}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-[10px] ${
                              appeal.status === "pending" ? "bg-violet-500/20 text-violet-400 border-violet-500/20" :
                              appeal.status === "approved" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" :
                              "bg-red-500/20 text-red-400 border-red-500/20"
                            }`}>
                              {appeal.status === "pending" ? "Pending Review" : appeal.status === "approved" ? "Approved" : "Denied"}
                            </Badge>
                            {strikeLog && (
                              <span className="text-[10px] text-muted-foreground">
                                Strike: {strikeLog.reason?.slice(0, 50)}{strikeLog.reason?.length > 50 ? "..." : ""}
                              </span>
                            )}
                          </div>
                          <p className="text-sm mt-1.5">{appeal.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Submitted {new Date(appeal.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {appeal.status === "pending" && (
                            <Clock className="w-4 h-4 text-violet-400" />
                          )}
                          {appeal.status === "approved" && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          )}
                          {appeal.status === "denied" && (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                      </div>
                      {appeal.reviewNote && (
                        <div className={`mt-2 p-2 rounded-md ${appeal.status === "approved" ? "bg-emerald-500/[0.06]" : "bg-red-500/[0.06]"}`}>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Staff response:</span> {appeal.reviewNote}
                          </p>
                          {appeal.reviewedByName && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              — {appeal.reviewedByName}, {appeal.reviewedAt ? new Date(appeal.reviewedAt).toLocaleString() : ""}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </FadeInUp>
        )}

        <FadeInUp delay={0.1}>
          <Card className="border-0 bg-gradient-to-br from-amber-500/[0.06] via-background to-amber-900/[0.03] overflow-hidden relative" data-testid="card-strike-fines-policy">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-amber-500/[0.03] -translate-y-12 translate-x-12" />
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                Strike Fine Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                If you receive a strike on an order, a fine must be paid before you can resume taking orders.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className={`p-3 rounded-xl border text-center ${currentStrikes >= 1 ? "bg-red-500/10 border-red-500/25" : "bg-white/[0.03] border-white/[0.06]"}`}>
                  <p className="text-xs text-muted-foreground mb-1">Strike 1</p>
                  <p className={`text-xl font-bold ${currentStrikes >= 1 ? "text-red-400" : "text-white/60"}`}>$25</p>
                </div>
                <div className={`p-3 rounded-xl border text-center ${currentStrikes >= 2 ? "bg-red-500/10 border-red-500/25" : "bg-white/[0.03] border-white/[0.06]"}`}>
                  <p className="text-xs text-muted-foreground mb-1">Strike 2</p>
                  <p className={`text-xl font-bold ${currentStrikes >= 2 ? "text-red-400" : "text-white/60"}`}>$50</p>
                </div>
                <div className={`p-3 rounded-xl border text-center ${currentStrikes >= 3 ? "bg-red-500/10 border-red-500/25" : "bg-white/[0.03] border-white/[0.06]"}`}>
                  <p className="text-xs text-muted-foreground mb-1">Strike 3</p>
                  <p className={`text-xl font-bold ${currentStrikes >= 3 ? "text-red-400" : "text-white/60"}`}>$100</p>
                </div>
              </div>
              <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] p-3">
                <p className="text-xs text-amber-200/80 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  Failure to pay fines will result in removal of grinder roles. If you believe a strike was issued in error, you can appeal it from the Strike History section below.
                </p>
              </div>
            </CardContent>
          </Card>
        </FadeInUp>

        <FadeInUp delay={0.12}>
          <Card className={`border-0 bg-gradient-to-br ${eliteGradient} overflow-hidden relative`} data-testid="card-elite-benefits">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/[0.02] -translate-y-12 translate-x-12" />
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-cyan-400" />
                </div>
                Elite Grinder Benefits
                {isElite && (
                  <Badge className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 ml-auto text-xs">
                    You're Elite
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Grinders who earn the Elite role receive real advantages in the system. Consistency = more money + more work.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-7 h-7 rounded-md bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Early Access Window</p>
                    <p className="text-xs text-muted-foreground">Elite grinders get early access to bid on new orders before regular grinders (30 seconds for manual orders, 5 minutes for Discord orders).</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Higher Payout Cuts</p>
                    <p className="text-xs text-muted-foreground">Elite grinders receive better payout percentages on every completed order.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-7 h-7 rounded-md bg-violet-500/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">+15% Queue Boost on Large Orders</p>
                    <p className="text-xs text-muted-foreground">Elite grinders get an automatic 15% boost in the AI queue ranking on high-value orders.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Elite Coaching & Metrics</p>
                    <p className="text-xs text-muted-foreground">Access detailed performance comparisons against elite averages with personalized tips on the Grinder Status page.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeInUp>

        <FadeInUp delay={0.14}>
          <Card className="border-0 bg-gradient-to-br from-red-500/[0.04] via-background to-background overflow-hidden relative" data-testid="card-strike-actions">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-red-500/[0.02] -translate-y-12 translate-x-12" />
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                  <Ban className="w-4 h-4 text-red-400" />
                </div>
                Actions That Result in Strikes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Strikes may be issued for violating the grinder agreement, including but not limited to:
              </p>
              <div className="space-y-1.5">
                {strikeActions.map((action, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    <p className="text-sm text-white/80">{action}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeInUp>

        {strikeLogs.length > 0 && (
          <FadeInUp delay={0.16}>
            <Card className="border-0 bg-gradient-to-br from-background to-background overflow-hidden" data-testid="card-strike-history">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  Strike History
                  <Badge variant="outline" className="ml-auto border-white/10 text-muted-foreground text-xs">
                    {strikeLogs.length} entries
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {strikeLogs.map((log: any) => {
                  const appeal = getAppealForStrike(log.id);
                  return (
                    <div
                      key={log.id}
                      className={`flex items-start justify-between gap-3 p-3 rounded-lg border ${
                        log.delta > 0 ? "bg-red-500/[0.04] border-red-500/15" : "bg-emerald-500/[0.04] border-emerald-500/15"
                      }`}
                      data-testid={`card-strike-history-${log.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`text-[10px] ${log.delta > 0 ? "bg-red-500/20 text-red-400 border-red-500/20" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"}`}>
                            {log.delta > 0 ? `+${log.delta} Strike` : `${log.delta} Strike`}
                          </Badge>
                          {parseFloat(log.fineAmount || "0") > 0 && (
                            <Badge className={`text-[10px] ${log.finePaid ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" : "bg-red-500/20 text-red-400 border-red-500/20"}`}>
                              {log.finePaid ? "Fine Paid" : "Fine Unpaid"}: ${parseFloat(log.fineAmount).toFixed(2)}
                            </Badge>
                          )}
                          {appeal && (
                            <Badge className={`text-[10px] ${
                              appeal.status === "pending" ? "bg-violet-500/20 text-violet-400 border-violet-500/20" :
                              appeal.status === "approved" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" :
                              "bg-red-500/20 text-red-400 border-red-500/20"
                            }`}>
                              <Scale className="w-2.5 h-2.5 mr-0.5" />
                              {appeal.status === "pending" ? "Appeal Pending" : appeal.status === "approved" ? "Appeal Approved" : "Appeal Denied"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm mt-1.5">{log.reason}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.createdAt).toLocaleString()} — Resulting strikes: {log.resultingStrikes}
                        </p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1.5">
                        {log.acknowledgedAt ? (
                          <Badge variant="outline" className="border-white/10 text-muted-foreground text-[10px]">
                            <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Acknowledged
                          </Badge>
                        ) : log.delta > 0 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs h-7"
                            onClick={() => ackMutation.mutate(log.id)}
                            disabled={ackMutation.isPending}
                            data-testid={`button-ack-strike-${log.id}`}
                          >
                            {ackMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Acknowledge"}
                          </Button>
                        ) : null}
                        {canAppeal(log) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-violet-500/20 text-violet-400 hover:bg-violet-500/10 text-xs h-7 gap-1"
                            onClick={() => openAppealDialog(log.id)}
                            data-testid={`button-appeal-strike-${log.id}`}
                          >
                            <Scale className="w-3 h-3" />
                            Appeal
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </FadeInUp>
        )}
      </div>

      <Dialog open={appealDialogOpen} onOpenChange={setAppealDialogOpen}>
        <DialogContent className="border-white/10 bg-background/95 backdrop-blur-xl sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                <Scale className="w-4 h-4 text-violet-400" />
              </div>
              Appeal Strike
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {appealStrikeId && (() => {
              const log = strikeLogs.find((l: any) => l.id === appealStrikeId);
              return log ? (
                <div className="p-3 rounded-xl bg-red-500/[0.04] border border-red-500/15">
                  <p className="text-sm font-medium">{log.reason}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(log.createdAt).toLocaleString()} — Fine: ${parseFloat(log.fineAmount || "0").toFixed(2)}
                  </p>
                </div>
              ) : null;
            })()}

            <div>
              <p className="text-sm font-medium mb-2">Why should this strike be removed?</p>
              <Textarea
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="Explain clearly why you believe this strike was issued in error. Include any relevant context, evidence, or circumstances that support your case..."
                className="bg-background/50 border-white/10 min-h-[120px] resize-none"
                data-testid="textarea-appeal-reason"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Be specific and honest. False or frivolous appeals may count against you.
              </p>
            </div>

            <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] p-3">
              <p className="text-xs text-amber-200/80 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                If approved, the strike will be removed from your record and the associated fine will be waived. Staff will review your appeal and respond within 24-48 hours.
              </p>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => setAppealDialogOpen(false)}
              className="border-white/10"
              data-testid="button-cancel-appeal"
            >
              Cancel
            </Button>
            <Button
              onClick={submitAppeal}
              disabled={!appealReason.trim() || appealMutation.isPending}
              className="gap-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400"
              data-testid="button-submit-appeal"
            >
              {appealMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit Appeal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  );
}
