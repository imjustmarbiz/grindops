import { useState } from "react";
import { useGrinderData } from "@/hooks/use-grinder-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PAYOUT_PLATFORMS } from "@shared/schema";
import {
  Loader2, Banknote, DollarSign, CheckCircle, AlertCircle, X
} from "lucide-react";

export default function GrinderPayouts() {
  const {
    grinder, isElite, payoutRequests, payoutMethods,
    approvePayoutMutation, disputePayoutMutation,
  } = useGrinderData();

  const [disputeDialog, setDisputeDialog] = useState<any>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeAmount, setDisputeAmount] = useState("");
  const [disputePlatform, setDisputePlatform] = useState("");
  const [disputeDetails, setDisputeDetails] = useState("");

  if (!grinder) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-emerald-500/15"} flex items-center justify-center`}>
          <Banknote className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-emerald-400"}`} />
        </div>
        Payout Requests
      </h2>
      {(!payoutRequests || payoutRequests.length === 0) ? (
        <Card className="border-0 bg-white/[0.03]">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white/40">No payout requests yet. Complete an order and request payout.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {payoutRequests.filter((p: any) => p.status === "Pending Grinder Approval").length > 0 && (
            <Card className={`border ${isElite ? "border-cyan-500/30 bg-cyan-500/[0.06]" : "border-amber-500/30 bg-amber-500/[0.06]"}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className={`w-4 h-4 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
                  <span className={`text-sm font-medium ${isElite ? "text-cyan-300" : "text-amber-300"}`}>
                    {payoutRequests.filter((p: any) => p.status === "Pending Grinder Approval").length} payout(s) need your approval
                  </span>
                </div>
                <p className="text-xs text-white/50">Review the payout details below and confirm they are correct before staff sends payment.</p>
              </CardContent>
            </Card>
          )}
          {payoutRequests.map((p: any) => (
            <Card key={p.id} className={`border-0 bg-white/[0.03] sm:hover:bg-white/[0.05] transition-all duration-200 ${p.status === "Pending Grinder Approval" ? (isElite ? "ring-1 ring-cyan-500/30" : "ring-1 ring-amber-500/30") : ""}`} data-testid={`card-payout-${p.id}`}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">Order {p.orderId}</p>
                    <p className="text-sm text-white/50">
                      Amount: <span className="text-emerald-400 font-medium">${Number(p.amount).toFixed(2)}</span>
                      {p.payoutPlatform && <span className="ml-2">via {p.payoutPlatform}</span>}
                    </p>
                    {p.payoutDetails && <p className="text-xs text-white/40">Details: {p.payoutDetails}</p>}
                    {p.notes && <p className="text-xs text-white/40">{p.notes}</p>}
                    <p className="text-xs text-white/30">{new Date(p.createdAt).toLocaleString()}</p>
                  </div>
                  <Badge className={`border-0 ${
                    p.status === "Paid" ? "bg-emerald-500/20 text-emerald-400" :
                    p.status === "Approved" || p.status === "Pending" ? "bg-blue-500/20 text-blue-400" :
                    p.status === "Denied" ? "bg-red-500/20 text-red-400" :
                    p.status === "Pending Grinder Approval" ? "bg-amber-500/20 text-amber-400" :
                    p.status === "Grinder Disputed" ? "bg-orange-500/20 text-orange-400" :
                    "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {p.status === "Pending Grinder Approval" ? "Needs Your Approval" : p.status === "Grinder Disputed" ? "Disputed" : p.status}
                  </Badge>
                </div>
                {p.status === "Pending Grinder Approval" && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <p className="text-xs text-white/60 mb-3">Please confirm the payout details are correct. If anything needs to change, you can dispute and request adjustments.</p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        data-testid={`button-approve-payout-${p.id}`}
                        disabled={approvePayoutMutation.isPending}
                        onClick={() => approvePayoutMutation.mutate(p.id)}>
                        {approvePayoutMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        Approve Payout
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                        data-testid={`button-dispute-payout-${p.id}`}
                        onClick={() => {
                          setDisputeDialog(p);
                          setDisputeAmount(p.amount?.toString() || "");
                          setDisputePlatform(p.payoutPlatform || "");
                          setDisputeDetails(p.payoutDetails || "");
                        }}>
                        <X className="w-3 h-3" />
                        Dispute
                      </Button>
                    </div>
                  </div>
                )}
                {p.status === "Grinder Disputed" && p.disputeReason && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <p className="text-xs text-orange-400 font-medium mb-1">Your dispute reason:</p>
                    <p className="text-xs text-white/50">{p.disputeReason}</p>
                    {p.requestedAmount && <p className="text-xs text-white/50 mt-1">Requested amount: <span className="text-emerald-400">${Number(p.requestedAmount).toFixed(2)}</span></p>}
                    {p.requestedPlatform && <p className="text-xs text-white/50">Requested method: {p.requestedPlatform}</p>}
                    <p className="text-xs text-white/30 mt-1">Waiting for staff review...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!disputeDialog} onOpenChange={(open) => { if (!open) { setDisputeDialog(null); setDisputeReason(""); setDisputePlatform(""); setDisputeDetails(""); setDisputeAmount(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              Dispute Payout - Order {disputeDialog?.orderId}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <p className="text-sm text-white/60">Current payout details:</p>
              <p className="text-sm">Amount: <span className="text-emerald-400 font-medium">${Number(disputeDialog?.amount || 0).toFixed(2)}</span></p>
              {disputeDialog?.payoutPlatform && <p className="text-sm">Method: {disputeDialog.payoutPlatform}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Reason for Dispute *</label>
              <Textarea value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} placeholder="Explain what needs to change..." data-testid="input-dispute-reason" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Requested Amount ($)</label>
              <Input type="number" value={disputeAmount} onChange={(e) => setDisputeAmount(e.target.value)} data-testid="input-dispute-amount" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Preferred Platform</label>
              <Select value={disputePlatform} onValueChange={setDisputePlatform}>
                <SelectTrigger data-testid="select-dispute-platform">
                  <SelectValue placeholder="Select platform..." />
                </SelectTrigger>
                <SelectContent>
                  {PAYOUT_PLATFORMS.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {disputePlatform && (
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {disputePlatform === "Zelle" ? "Email or Phone Number" :
                   disputePlatform === "PayPal" ? "PayPal Email" :
                   disputePlatform === "Apple Pay" ? "Phone Number" :
                   disputePlatform === "Cash App" ? "$Cashtag" :
                   disputePlatform === "Venmo" ? "@Username" :
                   "Payout Details"}
                </label>
                <Input
                  value={disputeDetails}
                  onChange={(e) => setDisputeDetails(e.target.value)}
                  placeholder={
                    disputePlatform === "Zelle" ? "email@example.com or (555) 123-4567" :
                    disputePlatform === "PayPal" ? "your@paypal.email" :
                    disputePlatform === "Apple Pay" ? "(555) 123-4567" :
                    disputePlatform === "Cash App" ? "$YourCashtag" :
                    disputePlatform === "Venmo" ? "@YourUsername" :
                    "Enter details"
                  }
                  data-testid="input-dispute-details"
                />
              </div>
            )}
            <Button className="w-full bg-orange-600 hover:bg-orange-700" data-testid="button-submit-dispute"
              disabled={!disputeReason || disputePayoutMutation.isPending}
              onClick={() => {
                disputePayoutMutation.mutate({
                  payoutId: disputeDialog.id,
                  data: {
                    disputeReason,
                    requestedAmount: disputeAmount || undefined,
                    requestedPlatform: disputePlatform || undefined,
                    requestedDetails: disputeDetails || undefined,
                  },
                });
                setDisputeDialog(null);
                setDisputeReason("");
                setDisputeAmount("");
                setDisputePlatform("");
                setDisputeDetails("");
              }}>
              {disputePayoutMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
              Submit Dispute
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
