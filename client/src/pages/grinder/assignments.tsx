import { useState } from "react";
import { useGrinderData } from "@/hooks/use-grinder-data";
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
  MessageSquare, Banknote
} from "lucide-react";

export default function GrinderAssignments() {
  const {
    grinder, isElite, assignments, orderUpdates, payoutRequests, payoutMethods,
    submitUpdateMutation, markCompleteMutation, requestPayoutMutation,
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

  if (!grinder) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-emerald-500/15"} flex items-center justify-center`}>
          <FileCheck className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-emerald-400"}`} />
        </div>
        My Assignments
        <Badge className="border-0 bg-white/[0.06] text-white/60 text-xs">{assignments.length}</Badge>
      </h2>
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

      {orderUpdates && orderUpdates.length > 0 && (
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
    </div>
  );
}
