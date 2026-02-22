import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useStaffData } from "@/hooks/use-staff-data";
import { formatCurrency } from "@/lib/staff-utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, Banknote, CheckCircle, X, CreditCard, Loader2, DollarSign, MessageSquare } from "lucide-react";

export default function StaffPayouts() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { payoutReqs, grinders, grinderUpdates, analyticsLoading } = useStaffData();

  const payoutMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const reviewedBy = user?.username || user?.discordUsername || "staff";
      const res = await apiRequest("PATCH", `/api/staff/payout-requests/${id}`, { status, reviewedBy });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/payout-requests"] });
      toast({ title: "Payout request updated" });
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
  const pendingPayouts = allPayoutReqs.filter((p: any) => p.status === "Pending");
  const approvedPayouts = allPayoutReqs.filter((p: any) => p.status === "Approved");
  const paidPayouts = allPayoutReqs.filter((p: any) => p.status === "Paid");
  const totalOwed = [...pendingPayouts, ...approvedPayouts].reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const totalPaidOut = paidPayouts.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const allGrinders = grinders || [];

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="page-staff-payouts">
      <div>
        <h1 className="text-xl sm:text-3xl font-display font-bold" data-testid="text-page-title">
          Payout Management
        </h1>
        <p className="text-muted-foreground mt-1">Review and manage grinder payout requests</p>
      </div>

      <Card className="border-green-500/20" data-testid="card-payout-management">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="w-5 h-5 text-green-400" />
            Payout Management
            {pendingPayouts.length > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-400 ml-2">{pendingPayouts.length} pending</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
              <p className="text-xl font-bold text-yellow-400" data-testid="text-total-owed">{formatCurrency(totalOwed)}</p>
              <p className="text-[10px] text-muted-foreground">Outstanding</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
              <p className="text-xl font-bold text-green-400" data-testid="text-total-paid">{formatCurrency(totalPaidOut)}</p>
              <p className="text-[10px] text-muted-foreground">Paid Out</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
              <p className="text-xl font-bold text-blue-400" data-testid="text-total-requests">{allPayoutReqs.length}</p>
              <p className="text-[10px] text-muted-foreground">Total Requests</p>
            </div>
          </div>

          {[...pendingPayouts, ...approvedPayouts].length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Payouts</p>
              {[...pendingPayouts, ...approvedPayouts].map((p: any) => {
                const grinder = allGrinders.find((g: any) => g.id === p.grinderId);
                return (
                  <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/5" data-testid={`staff-payout-${p.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{grinder?.name || p.grinderId}</span>
                        <span className="text-green-400 font-bold">{formatCurrency(Number(p.amount))}</span>
                        <Badge variant="outline" className={`text-[10px] ${p.status === "Approved" ? "text-blue-400 border-blue-500/30" : "text-yellow-400 border-yellow-500/30"}`}>{p.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        {p.payoutPlatform && (
                          <Badge variant="outline" className="text-[10px] border-border/50 gap-1">
                            <CreditCard className="w-3 h-3" /> {p.payoutPlatform}: {p.payoutDetails || "N/A"}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">Order {p.orderId?.slice(0, 10)}</span>
                        <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                      {p.notes && <p className="text-xs text-muted-foreground mt-1">{p.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {p.status === "Pending" && (
                        <>
                          <Button size="sm" variant="outline" className="text-xs bg-blue-500/10 border-blue-500/30 text-blue-400" data-testid={`button-approve-payout-${p.id}`}
                            disabled={payoutMutation.isPending}
                            onClick={() => payoutMutation.mutate({ id: p.id, status: "Approved" })}>
                            <CheckCircle className="w-3 h-3 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs bg-red-500/10 border-red-500/30 text-red-400" data-testid={`button-deny-payout-${p.id}`}
                            disabled={payoutMutation.isPending}
                            onClick={() => payoutMutation.mutate({ id: p.id, status: "Denied" })}>
                            <X className="w-3 h-3 mr-1" /> Deny
                          </Button>
                        </>
                      )}
                      {(p.status === "Approved" || p.status === "Pending") && (
                        <Button size="sm" className="text-xs bg-green-600" data-testid={`button-mark-paid-${p.id}`}
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
            <p className="text-sm text-muted-foreground text-center py-2" data-testid="text-no-pending">No pending payouts.</p>
          )}

          {paidPayouts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recently Paid ({paidPayouts.length})</p>
              {paidPayouts.slice(0, 5).map((p: any) => {
                const grinder = allGrinders.find((g: any) => g.id === p.grinderId);
                return (
                  <div key={p.id} className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-white/5 opacity-70 text-sm" data-testid={`staff-paid-${p.id}`}>
                    <span className="font-medium">{grinder?.name || p.grinderId}</span>
                    <span className="text-green-400">{formatCurrency(Number(p.amount))}</span>
                    {p.payoutPlatform && <span className="text-xs text-muted-foreground">via {p.payoutPlatform}</span>}
                    <span className="text-xs text-muted-foreground">Order {p.orderId}</span>
                    <Badge className="bg-green-500/20 text-green-400 text-[10px]">Paid</Badge>
                    {p.reviewedBy && <span className="text-xs text-muted-foreground">by {p.reviewedBy}</span>}
                    {p.paidAt && <span className="text-xs text-muted-foreground ml-auto">{new Date(p.paidAt).toLocaleDateString()}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {grinderUpdates && grinderUpdates.length > 0 && (
        <Card className="border-blue-500/20" data-testid="card-grinder-updates">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              Grinder Order Updates
              <Badge className="bg-blue-500/20 text-blue-400 ml-auto">{grinderUpdates.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {grinderUpdates.slice(0, 15).map((u: any) => {
                const grinder = allGrinders.find((g: any) => g.id === u.grinderId);
                return (
                  <div key={u.id} className="p-3 rounded-lg bg-white/5 border border-white/10" data-testid={`card-grinder-update-${u.id}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-400">{grinder?.name || u.grinderId}</span>
                        <Badge variant="outline" className="text-[10px]">{u.updateType}</Badge>
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
      )}
    </div>
  );
}
