import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useStaffData } from "@/hooks/use-staff-data";
import { formatCurrency } from "@/lib/staff-utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, Banknote, CheckCircle, X, CreditCard, Loader2, DollarSign, MessageSquare, TrendingUp, Clock, AlertTriangle, RefreshCw, ThumbsUp } from "lucide-react";
import { BiddingCountdownPanel } from "@/components/bidding-countdown";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import spLogo from "@assets/image_1771930905137.png";

export default function StaffPayouts() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { payoutReqs, grinders, grinderUpdates, analyticsLoading } = useStaffData();

  const payoutMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const reviewedBy = (user as any)?.username || user?.discordUsername || "staff";
      const res = await apiRequest("PATCH", `/api/staff/payout-requests/${id}`, { status, reviewedBy });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/payout-requests"] });
      toast({ title: "Payout request updated" });
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

  const allPayoutReqs = payoutReqs || [];
  const pendingGrinderApproval = allPayoutReqs.filter((p: any) => p.status === "Pending Grinder Approval");
  const disputedPayouts = allPayoutReqs.filter((p: any) => p.status === "Grinder Disputed");
  const pendingPayouts = allPayoutReqs.filter((p: any) => p.status === "Pending");
  const approvedPayouts = allPayoutReqs.filter((p: any) => p.status === "Approved");
  const paidPayouts = allPayoutReqs.filter((p: any) => p.status === "Paid");
  const totalOwed = [...pendingPayouts, ...approvedPayouts].reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const totalPaidOut = paidPayouts.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const allGrinders = grinders || [];

  return (
    <AnimatedPage className="space-y-5 sm:space-y-6" data-testid="page-staff-payouts">
      <FadeInUp>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={spLogo} alt="SP" className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]" />
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-glow" data-testid="text-page-title">
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
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
        <BiddingCountdownPanel variant="compact" />
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
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
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
                      {(p.status === "Approved" || p.status === "Pending") && (
                        <Button size="sm" className="text-xs bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20" data-testid={`button-mark-paid-${p.id}`}
                          disabled={payoutMutation.isPending}
                          onClick={() => payoutMutation.mutate({ id: p.id, status: "Paid" })}>
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
                    {p.paidAt && <span className="text-xs text-muted-foreground ml-auto">{new Date(p.paidAt).toLocaleDateString()}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </FadeInUp>

      {grinderUpdates && grinderUpdates.length > 0 && (
        <FadeInUp>
        <Card className="border-0 bg-gradient-to-br from-blue-500/[0.06] via-background to-background overflow-hidden relative" data-testid="card-grinder-updates">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-blue-500/[0.03] -translate-y-12 translate-x-12" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-blue-400" />
              </div>
              Grinder Order Updates
              <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/20 ml-auto text-xs">{grinderUpdates.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {grinderUpdates.slice(0, 15).map((u: any) => {
                const grinder = allGrinders.find((g: any) => g.id === u.grinderId);
                return (
                  <div key={u.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]" data-testid={`card-grinder-update-${u.id}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-400">{grinder?.name || u.grinderId}</span>
                        <Badge variant="outline" className="text-[10px] bg-white/[0.03]">{u.updateType}</Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{new Date(u.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Order {u.orderId}: {u.message}</p>
                    {u.newDeadline && <p className="text-xs text-yellow-400 mt-1">New deadline: {new Date(u.newDeadline).toLocaleDateString()}</p>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        </FadeInUp>
      )}
    </AnimatedPage>
  );
}
