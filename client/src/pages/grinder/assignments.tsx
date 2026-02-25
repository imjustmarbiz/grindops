import { useState } from "react";
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
  MessageSquare, Banknote, TicketCheck, LogIn, LogOut, AlertTriangle, FileText, ExternalLink
} from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { HelpTip } from "@/components/help-tip";

export default function GrinderAssignments() {
  const {
    grinder, isElite, assignments, orderUpdates, payoutRequests, payoutMethods,
    submitUpdateMutation, markCompleteMutation, requestPayoutMutation, toast, queryClient,
  } = useGrinderData();

  const [updateDialog, setUpdateDialog] = useState<any>(null);
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateType, setUpdateType] = useState("progress");
  const [newDeadline, setNewDeadline] = useState("");
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
  const [expandedCheckpoints, setExpandedCheckpoints] = useState<string | null>(null);
  const [joiningTicket, setJoiningTicket] = useState<string | null>(null);

  const checkpointMutation = useMutation({
    mutationFn: async (data: { assignmentId: string; orderId: string; type: string; response?: string; note?: string }) => {
      const res = await apiRequest("POST", "/api/grinder/me/checkpoints", data);
      return res.json();
    },
    onSuccess: (_: any, vars: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinder/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grinder/me/checkpoints", vars.assignmentId] });
      const typeLabels: Record<string, string> = { ticket_ack: "Ticket accepted", login: "Logged in", logoff: "Logged off", issue: "Issue reported", order_update: "Update submitted" };
      toast({ title: typeLabels[vars.type] || "Checkpoint recorded" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (!grinder) return null;

  return (
    <AnimatedPage className="space-y-4">
      <FadeInUp>
      <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-emerald-500/15"} flex items-center justify-center`}>
          <FileCheck className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-emerald-400"}`} />
        </div>
        My Assignments
        <HelpTip text="Track your active assignments and completed work." />
        <Badge className="border-0 bg-white/[0.06] text-white/60 text-xs">{assignments.length}</Badge>
      </h2>
      </FadeInUp>
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
      ) : (
        <div className="space-y-4">
          {assignments.map((a: any) => (
            <Card key={a.id} className="border-0 bg-white/[0.03] sm:hover:bg-white/[0.05] transition-all duration-200" data-testid={`card-work-assignment-${a.id}`}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <span className="font-bold text-lg">Order {a.orderId}</span>
                    <div className="flex items-center gap-3 mt-1 text-sm text-white/40 flex-wrap">
                      <span>Assigned: {new Date(a.assignedDateTime).toLocaleDateString()}</span>
                      <span>Due: {a.dueDateTime ? new Date(a.dueDateTime).toLocaleDateString() : "TBD"}</span>
                      {a.deliveredDateTime && <span>Completed: {new Date(a.deliveredDateTime).toLocaleDateString()}</span>}
                      {a.grinderEarnings && <span className="text-emerald-400 font-medium">${Number(a.grinderEarnings).toFixed(2)}</span>}
                    </div>
                  </div>
                  <Badge className={a.status === "Active" ? "bg-emerald-500/20 text-emerald-400 border-0" : a.status === "Completed" ? "bg-blue-500/20 text-blue-400 border-0" : "bg-white/[0.06] text-white/40 border-0"}>
                    {a.status}
                  </Badge>
                </div>
                {a.status === "Active" && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.hasTicket && (
                      <Button size="sm" variant="outline"
                        className="gap-1 text-xs bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                        data-testid={`button-join-ticket-${a.id}`}
                        disabled={joiningTicket === a.orderId}
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
                    <Button size="sm" variant="outline" className="gap-1 text-xs" data-testid={`button-update-${a.id}`}
                      onClick={() => { setUpdateDialog(a); setUpdateType("progress"); setUpdateMessage(""); setNewDeadline(""); }}>
                      <MessageSquare className="w-3 h-3" /> Submit Update
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-xs" data-testid={`button-deadline-${a.id}`}
                      onClick={() => { setUpdateDialog(a); setUpdateType("deadline"); setUpdateMessage(""); setNewDeadline(""); }}>
                      <CalendarClock className="w-3 h-3" /> Update Deadline
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-xs bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20" data-testid={`button-complete-${a.id}`}
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
                    <p className="text-[10px] uppercase tracking-wider text-white/30 font-medium mb-1.5">Activity Checkpoints</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7 px-2 bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20" data-testid={`button-ack-yes-${a.id}`}
                        disabled={checkpointMutation.isPending}
                        onClick={() => checkpointMutation.mutate({ assignmentId: a.id, orderId: a.orderId, type: "ticket_ack", response: "yes" })}>
                        <TicketCheck className="w-3 h-3" /> Accept Ticket
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7 px-2 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" data-testid={`button-ack-no-${a.id}`}
                        disabled={checkpointMutation.isPending}
                        onClick={() => { setIssueDialog({ ...a, checkpointType: "ticket_ack_no" }); setIssueNote(""); }}>
                        <TicketCheck className="w-3 h-3" /> Decline Ticket
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7 px-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" data-testid={`button-login-${a.id}`}
                        disabled={checkpointMutation.isPending}
                        onClick={() => checkpointMutation.mutate({ assignmentId: a.id, orderId: a.orderId, type: "login" })}>
                        <LogIn className="w-3 h-3" /> Log In
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7 px-2 bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20" data-testid={`button-logoff-${a.id}`}
                        disabled={checkpointMutation.isPending}
                        onClick={() => checkpointMutation.mutate({ assignmentId: a.id, orderId: a.orderId, type: "logoff" })}>
                        <LogOut className="w-3 h-3" /> Log Off
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7 px-2 bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20" data-testid={`button-issue-${a.id}`}
                        disabled={checkpointMutation.isPending}
                        onClick={() => { setIssueDialog({ ...a, checkpointType: "issue" }); setIssueNote(""); }}>
                        <AlertTriangle className="w-3 h-3" /> Issue
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7 px-2" data-testid={`button-view-checkpoints-${a.id}`}
                        onClick={() => setExpandedCheckpoints(expandedCheckpoints === a.id ? null : a.id)}>
                        <FileText className="w-3 h-3" /> History
                      </Button>
                    </div>
                    {expandedCheckpoints === a.id && <CheckpointHistory assignmentId={a.id} />}
                  </div>
                )}
                {a.status === "Completed" && (
                  <div className="flex items-center gap-2">
                    {a.isOnTime !== null && (
                      <Badge className={a.isOnTime ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                        {a.isOnTime ? "On Time" : "Late"}
                      </Badge>
                    )}
                    {a.qualityRating && (
                      <Badge variant="outline" className="gap-1">
                        <Star className="w-3 h-3" /> {a.qualityRating}/5
                      </Badge>
                    )}
                    {!payoutRequests?.find((p: any) => p.assignmentId === a.id) && (
                      <Button size="sm" variant="outline" className="gap-1 text-xs bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 ml-auto" data-testid={`button-payout-${a.id}`}
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
                    {payoutRequests?.find((p: any) => p.assignmentId === a.id) && (
                      <Badge className="ml-auto bg-yellow-500/20 text-yellow-400">
                        Payout {payoutRequests.find((p: any) => p.assignmentId === a.id)?.status}
                      </Badge>
                    )}
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </FadeInUp>
      )}

      <Dialog open={!!updateDialog} onOpenChange={(open) => !open && setUpdateDialog(null)}>
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
            <Button className="w-full" data-testid="button-submit-update"
              disabled={!updateMessage || submitUpdateMutation.isPending}
              onClick={() => {
                submitUpdateMutation.mutate({
                  assignmentId: updateDialog.id,
                  orderId: updateDialog.orderId,
                  updateType,
                  message: updateMessage,
                  newDeadline: newDeadline || undefined,
                });
                setUpdateDialog(null);
                setUpdateMessage("");
                setNewDeadline("");
              }}>
              {submitUpdateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!completeDialog} onOpenChange={(open) => { if (!open) { setCompleteDialog(null); setCompletePlatform(""); setCompleteDetails(""); setCompleteSaveMethod(true); } }}>
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
              disabled={!completePlatform || !completeDetails || markCompleteMutation.isPending}
              onClick={() => {
                markCompleteMutation.mutate({
                  assignmentId: completeDialog.id,
                  payoutPlatform: completePlatform,
                  payoutDetails: completeDetails,
                  savePayoutMethod: completeSaveMethod,
                });
                setCompleteDialog(null);
                setCompletePlatform("");
                setCompleteDetails("");
                setCompleteSaveMethod(true);
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
  };

  return (
    <div className="mt-2 space-y-1" data-testid={`checkpoint-history-${assignmentId}`}>
      {checkpoints.slice(0, 15).map((cp: any) => (
        <div key={cp.id} className="flex items-start gap-2 p-2 rounded bg-white/[0.02] border border-white/[0.04] text-xs">
          <span>{typeIcons[cp.type] || "📋"}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium capitalize">{cp.type.replace(/_/g, " ")}</span>
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
