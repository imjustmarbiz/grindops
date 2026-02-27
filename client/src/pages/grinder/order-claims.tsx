import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { OrderClaimRequest, Service } from "@shared/schema";
import {
  Wrench, Send, FileText, ExternalLink, Clock, CalendarDays, Play, CheckCircle, DollarSign, Wallet, Gamepad2, PlusCircle, Search, AlertTriangle, LinkIcon
} from "lucide-react";

type RepairType = "fix_order" | "claim_missing" | "add_completed";

function statusBadge(status: string) {
  if (status === "pending") return <Badge className="bg-amber-500/20 text-amber-400 border-0">Pending</Badge>;
  if (status === "approved") return <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-red-500/20 text-red-400 border-0">Rejected</Badge>;
  return <Badge className="border-0">{status}</Badge>;
}

function repairTypeBadge(type: string) {
  if (type === "fix_order") return <Badge className="bg-blue-500/20 text-blue-400 border-0 text-[10px]">Fix Order</Badge>;
  if (type === "claim_missing") return <Badge className="bg-violet-500/20 text-violet-400 border-0 text-[10px]">Claim Missing</Badge>;
  if (type === "add_completed") return <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[10px]">Add Completed</Badge>;
  return <Badge className="border-0 text-[10px]">{type}</Badge>;
}

export default function GrinderOrderClaims() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: grinderProfile } = useQuery<any>({ queryKey: ["/api/grinder/me"], refetchInterval: 30000 });
  const isElite = grinderProfile?.isElite || (user as any)?.discordRoles?.includes?.("1466370965016412316");

  const [repairType, setRepairType] = useState<RepairType>("fix_order");
  const [orderId, setOrderId] = useState("");
  const [ticketName, setTicketName] = useState("");
  const [proofLinks, setProofLinks] = useState("");
  const [proofNotes, setProofNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [completedDateTime, setCompletedDateTime] = useState("");
  const [grinderAmount, setGrinderAmount] = useState("");
  const [payoutPlatform, setPayoutPlatform] = useState("");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [fixDescription, setFixDescription] = useState("");
  const [fixDueDate, setFixDueDate] = useState("");
  const [fixGrinderAmount, setFixGrinderAmount] = useState("");
  const [fixServiceId, setFixServiceId] = useState("");

  const { data: services = [] } = useQuery<Service[]>({ queryKey: ["/api/services"], refetchInterval: 30000 });
  const { data: claims = [], isLoading } = useQuery<OrderClaimRequest[]>({
    queryKey: ["/api/order-claims"],
    refetchInterval: 15000,
  });

  const resetForm = () => {
    setOrderId(""); setTicketName(""); setProofLinks(""); setProofNotes("");
    setDueDate(""); setStartDateTime(""); setCompletedDateTime("");
    setGrinderAmount(""); setPayoutPlatform(""); setPayoutDetails("");
    setServiceId(""); setFixDescription(""); setFixDueDate("");
    setFixGrinderAmount(""); setFixServiceId("");
  };

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/order-claims", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/order-claims"] });
      toast({ title: "Repair request submitted successfully" });
      resetForm();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (repairType === "fix_order") {
      if (!orderId.trim()) {
        toast({ title: "Please enter the Order ID", variant: "destructive" });
        return;
      }
      if (!fixDescription.trim()) {
        toast({ title: "Please describe what needs to be fixed", variant: "destructive" });
        return;
      }
      const fixFields: any = { description: fixDescription.trim() };
      if (fixDueDate) fixFields.dueDate = fixDueDate;
      if (fixGrinderAmount) fixFields.grinderAmount = fixGrinderAmount;
      if (fixServiceId) fixFields.serviceId = fixServiceId;
      submitMutation.mutate({
        repairType: "fix_order",
        orderId: orderId.trim(),
        ticketName: `fix-${orderId.trim()}`,
        fixFields: JSON.stringify(fixFields),
        proofLinks: proofLinks ? proofLinks.split(",").map(l => l.trim()).filter(Boolean) : [],
        proofNotes: proofNotes.trim() || undefined,
        grinderAmount: fixGrinderAmount || undefined,
      });
    } else {
      if (!ticketName.trim()) {
        toast({ title: "Please enter a Ticket Name", variant: "destructive" });
        return;
      }
      if (repairType === "add_completed" && !completedDateTime) {
        toast({ title: "Completed date is required for completed orders", variant: "destructive" });
        return;
      }
      const links = proofLinks.split(",").map(l => l.trim()).filter(Boolean);
      submitMutation.mutate({
        repairType,
        orderId: orderId.trim() || undefined,
        ticketName: ticketName.trim(),
        serviceId: serviceId || undefined,
        proofLinks: links,
        proofNotes: proofNotes.trim() || undefined,
        dueDate: dueDate || undefined,
        startDateTime: startDateTime || undefined,
        completedDateTime: completedDateTime || undefined,
        grinderAmount: grinderAmount || undefined,
        payoutPlatform: payoutPlatform || undefined,
        payoutDetails: payoutDetails || undefined,
      });
    }
  };

  const repairTypes = [
    { value: "fix_order" as RepairType, label: "Fix Existing Order", icon: Wrench, desc: "Update info on an order in your dashboard", color: "blue" },
    { value: "claim_missing" as RepairType, label: "Claim Missing Order", icon: Search, desc: "Add an in-progress order not in your dashboard", color: "violet" },
    { value: "add_completed" as RepairType, label: "Add Completed Order", icon: PlusCircle, desc: "Add a completed order not in your dashboard", color: "emerald" },
  ];

  const accentColor = isElite ? "cyan" : "amber";

  return (
    <AnimatedPage className="space-y-6">
      <FadeInUp>
        <div className="flex items-center gap-3">
          <Wrench className={`w-7 h-7 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight" data-testid="text-grind-repair-title">Order Repairs</h2>
            <p className="text-sm text-muted-foreground">Fix orders, claim missing work, or add completed orders to your profile</p>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
        <Card className="border-0 bg-white/[0.03]">
          <CardContent className="p-5 space-y-4">
            <h3 className={`text-sm font-medium uppercase tracking-wider ${isElite ? "text-cyan-400" : "text-amber-400"}`}>
              Select Repair Type
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {repairTypes.map(rt => (
                <button
                  key={rt.value}
                  onClick={() => { setRepairType(rt.value); resetForm(); }}
                  className={`text-left p-4 rounded-lg border transition-all ${
                    repairType === rt.value
                      ? `border-${rt.color}-500/40 bg-${rt.color}-500/10`
                      : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                  data-testid={`button-repair-type-${rt.value}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <rt.icon className={`w-4 h-4 ${repairType === rt.value ? `text-${rt.color}-400` : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${repairType === rt.value ? "text-foreground" : "text-muted-foreground"}`}>{rt.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{rt.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </FadeInUp>

      <FadeInUp>
        <Card className="border-0 bg-white/[0.03]">
          <CardContent className="p-5 space-y-4">
            <h3 className={`text-sm font-medium uppercase tracking-wider flex items-center gap-2 ${isElite ? "text-cyan-400" : "text-amber-400"}`}>
              {repairType === "fix_order" && <><Wrench className="w-4 h-4" /> Fix Order Details</>}
              {repairType === "claim_missing" && <><Search className="w-4 h-4" /> Claim Missing Order</>}
              {repairType === "add_completed" && <><PlusCircle className="w-4 h-4" /> Add Completed Order</>}
            </h3>

            {repairType === "fix_order" && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Order ID <span className="text-red-400">*</span></label>
                  <Input
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="Enter the Order ID from your dashboard"
                    className="bg-white/[0.03] border-white/10"
                    data-testid="input-fix-order-id"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Must be an order currently assigned to you</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">What needs to be fixed? <span className="text-red-400">*</span></label>
                  <Textarea
                    value={fixDescription}
                    onChange={(e) => setFixDescription(e.target.value)}
                    placeholder="Describe what's wrong and what the correct info should be (e.g., wrong due date, incorrect service type, payout amount is off)"
                    className="bg-white/[0.03] border-white/10 min-h-[80px]"
                    data-testid="input-fix-description"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 flex items-center gap-1.5">
                      <Gamepad2 className="w-3.5 h-3.5 text-violet-400" />
                      Correct Service
                    </label>
                    <Select value={fixServiceId} onValueChange={setFixServiceId}>
                      <SelectTrigger className="bg-white/[0.03] border-white/10" data-testid="select-fix-service">
                        <SelectValue placeholder="Only if wrong..." />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-orange-400" />
                      Correct Due Date
                    </label>
                    <Input
                      type="datetime-local"
                      value={fixDueDate}
                      onChange={(e) => setFixDueDate(e.target.value)}
                      className="bg-white/[0.03] border-white/10"
                      data-testid="input-fix-due-date"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      Correct Grinder Amount
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={fixGrinderAmount}
                      onChange={(e) => setFixGrinderAmount(e.target.value)}
                      placeholder="Only if wrong..."
                      className="bg-white/[0.03] border-white/10"
                      data-testid="input-fix-grinder-amount"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Proof Links <span className="text-muted-foreground font-normal">(comma separated, optional)</span></label>
                  <Input
                    value={proofLinks}
                    onChange={(e) => setProofLinks(e.target.value)}
                    placeholder="https://link1.com, https://link2.com"
                    className="bg-white/[0.03] border-white/10"
                    data-testid="input-fix-proof-links"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Additional Notes</label>
                  <Textarea
                    value={proofNotes}
                    onChange={(e) => setProofNotes(e.target.value)}
                    placeholder="Any additional context for staff..."
                    className="bg-white/[0.03] border-white/10 min-h-[60px]"
                    data-testid="input-fix-notes"
                  />
                </div>
              </>
            )}

            {(repairType === "claim_missing" || repairType === "add_completed") && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Ticket Name <span className="text-red-400">*</span></label>
                  <Input
                    value={ticketName}
                    onChange={(e) => setTicketName(e.target.value)}
                    placeholder="e.g. ticket-12345 or the Discord channel name"
                    className="bg-white/[0.03] border-white/10"
                    data-testid="input-claim-ticket-name"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Enter the ticket name so staff can find and link it</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Order ID <span className="text-muted-foreground font-normal">(optional)</span></label>
                    <Input
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="Enter the order ID if known"
                      className="bg-white/[0.03] border-white/10"
                      data-testid="input-claim-order-id"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 flex items-center gap-1.5">
                      <Gamepad2 className="w-3.5 h-3.5 text-violet-400" />
                      Service
                    </label>
                    <Select value={serviceId} onValueChange={setServiceId}>
                      <SelectTrigger className="bg-white/[0.03] border-white/10" data-testid="select-claim-service">
                        <SelectValue placeholder="Select service..." />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Proof Links <span className="text-muted-foreground font-normal">(comma separated)</span></label>
                  <Input
                    value={proofLinks}
                    onChange={(e) => setProofLinks(e.target.value)}
                    placeholder="https://link1.com, https://link2.com"
                    className="bg-white/[0.03] border-white/10"
                    data-testid="input-claim-proof-links"
                  />
                </div>
                <div className={`grid grid-cols-1 gap-3 ${repairType === "add_completed" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                  <div>
                    <label className="text-sm font-medium mb-1 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-orange-400" />
                      Due Date
                    </label>
                    <Input
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="bg-white/[0.03] border-white/10"
                      data-testid="input-claim-due-date"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 text-blue-400" />
                      Start Date/Time
                    </label>
                    <Input
                      type="datetime-local"
                      value={startDateTime}
                      onChange={(e) => setStartDateTime(e.target.value)}
                      className="bg-white/[0.03] border-white/10"
                      data-testid="input-claim-start-date"
                    />
                  </div>
                  {repairType === "add_completed" && (
                    <div>
                      <label className="text-sm font-medium mb-1 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        Completed Date/Time <span className="text-red-400">*</span>
                      </label>
                      <Input
                        type="datetime-local"
                        value={completedDateTime}
                        onChange={(e) => setCompletedDateTime(e.target.value)}
                        className="bg-white/[0.03] border-white/10"
                        data-testid="input-claim-completed-date"
                      />
                    </div>
                  )}
                </div>
                <div className="border-t border-white/[0.06] pt-4">
                  <h4 className={`text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isElite ? "text-cyan-400" : "text-amber-400"}`}>
                    <Wallet className="w-3.5 h-3.5" /> Payout Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        Grinder Amount
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={grinderAmount}
                        onChange={(e) => setGrinderAmount(e.target.value)}
                        placeholder="0.00"
                        className="bg-white/[0.03] border-white/10"
                        data-testid="input-claim-grinder-amount"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Payout Platform</label>
                      <Select value={payoutPlatform} onValueChange={setPayoutPlatform}>
                        <SelectTrigger className="bg-white/[0.03] border-white/10" data-testid="select-claim-payout-platform">
                          <SelectValue placeholder="Select platform..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Zelle">Zelle</SelectItem>
                          <SelectItem value="PayPal">PayPal</SelectItem>
                          <SelectItem value="Apple Pay">Apple Pay</SelectItem>
                          <SelectItem value="Cash App">Cash App</SelectItem>
                          <SelectItem value="Venmo">Venmo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Payout Details</label>
                      <Input
                        value={payoutDetails}
                        onChange={(e) => setPayoutDetails(e.target.value)}
                        placeholder="e.g. $cashtag, email, phone"
                        className="bg-white/[0.03] border-white/10"
                        data-testid="input-claim-payout-details"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Proof Notes</label>
                  <Textarea
                    value={proofNotes}
                    onChange={(e) => setProofNotes(e.target.value)}
                    placeholder="Describe the proof or additional context..."
                    className="bg-white/[0.03] border-white/10 min-h-[80px]"
                    data-testid="input-claim-proof-notes"
                  />
                </div>
              </>
            )}

            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className={`w-full gap-2 ${isElite ? "bg-gradient-to-r from-cyan-600 to-cyan-500" : "bg-gradient-to-r from-primary to-primary/80"} text-white`}
              data-testid="button-submit-repair"
            >
              <Send className="w-4 h-4" />
              {submitMutation.isPending ? "Submitting..." : "Submit Repair Request"}
            </Button>
          </CardContent>
        </Card>
      </FadeInUp>

      <FadeInUp>
        <h3 className={`text-sm font-medium uppercase tracking-wider flex items-center gap-2 ${isElite ? "text-cyan-400" : "text-amber-400"}`}>
          <FileText className="w-4 h-4" /> Your Repair Requests
        </h3>
      </FadeInUp>

      {isLoading ? (
        <FadeInUp>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Card key={i} className="border-0 bg-white/[0.03] animate-pulse h-24" />)}
          </div>
        </FadeInUp>
      ) : claims.length === 0 ? (
        <FadeInUp>
          <Card className="border-0 bg-white/[0.03]">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Wrench className={`w-14 h-14 mb-4 ${isElite ? "text-cyan-400/20" : "text-white/10"}`} />
              <p className="text-white/40 font-medium">No repair requests submitted yet</p>
              <p className="text-sm text-white/25 mt-1">Use the form above to submit your first repair request</p>
            </CardContent>
          </Card>
        </FadeInUp>
      ) : (
        <FadeInUp>
          <div className="space-y-3">
            {claims.map(claim => {
              let fixData: any = {};
              try { fixData = JSON.parse((claim as any).fixFields || "{}"); } catch {}
              return (
                <Card key={claim.id} className="border-0 bg-white/[0.03]" data-testid={`card-repair-${claim.id}`}>
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {statusBadge(claim.status)}
                      {repairTypeBadge((claim as any).repairType || "claim_missing")}
                      {claim.orderId && (
                        <span className="text-sm text-muted-foreground" data-testid={`text-repair-order-${claim.id}`}>
                          Order: <span className="text-foreground font-medium">{claim.orderId}</span>
                        </span>
                      )}
                      {claim.ticketName && !claim.ticketName.startsWith("fix-") && (
                        <span className="text-sm text-muted-foreground" data-testid={`text-repair-ticket-${claim.id}`}>
                          Ticket: <span className="text-foreground font-medium">{claim.ticketName}</span>
                        </span>
                      )}
                      {claim.serviceId && (
                        <Badge variant="outline" className="border-violet-500/20 text-violet-400 text-[10px] gap-1" data-testid={`badge-service-${claim.id}`}>
                          <Gamepad2 className="w-3 h-3" />
                          {services.find(s => s.id === claim.serviceId)?.name || claim.serviceId}
                        </Badge>
                      )}
                    </div>

                    {(claim as any).repairType === "fix_order" && fixData.description && (
                      <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-400 mb-1">Fix Description:</p>
                        <p className="text-sm text-muted-foreground">{fixData.description}</p>
                      </div>
                    )}

                    {(claim.proofLinks || []).length > 0 && (
                      <div className="flex items-start gap-2 flex-wrap">
                        <LinkIcon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex flex-col gap-1">
                          {(claim.proofLinks || []).map((link, idx) => (
                            <a
                              key={idx}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 underline"
                              data-testid={`link-proof-${claim.id}-${idx}`}
                            >
                              {link} <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {claim.proofNotes && (
                      <p className="text-sm text-muted-foreground" data-testid={`text-proof-notes-${claim.id}`}>
                        {claim.proofNotes}
                      </p>
                    )}

                    {(claim.dueDate || claim.startDateTime || claim.completedDateTime) && (
                      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                        {claim.dueDate && (
                          <span className="flex items-center gap-1" data-testid={`text-repair-due-${claim.id}`}>
                            <CalendarDays className="w-3 h-3 text-orange-400" />
                            Due: {new Date(claim.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </span>
                        )}
                        {claim.startDateTime && (
                          <span className="flex items-center gap-1" data-testid={`text-repair-start-${claim.id}`}>
                            <Play className="w-3 h-3 text-blue-400" />
                            Started: {new Date(claim.startDateTime).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </span>
                        )}
                        {claim.completedDateTime && (
                          <span className="flex items-center gap-1" data-testid={`text-repair-completed-${claim.id}`}>
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            Completed: {new Date(claim.completedDateTime).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                    )}

                    {(claim.grinderAmount || claim.payoutPlatform || claim.payoutDetails) && (
                      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                        {claim.grinderAmount && (
                          <span className="flex items-center gap-1" data-testid={`text-repair-amount-${claim.id}`}>
                            <DollarSign className="w-3 h-3 text-emerald-400" />
                            Amount: ${Number(claim.grinderAmount).toFixed(2)}
                          </span>
                        )}
                        {claim.payoutPlatform && (
                          <span className="flex items-center gap-1" data-testid={`text-repair-payout-platform-${claim.id}`}>
                            <Wallet className="w-3 h-3 text-violet-400" />
                            {claim.payoutPlatform}
                          </span>
                        )}
                        {claim.payoutDetails && (
                          <span className="text-muted-foreground/70" data-testid={`text-repair-payout-details-${claim.id}`}>
                            {claim.payoutDetails}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span data-testid={`text-repair-date-${claim.id}`}>
                        {new Date(claim.requestedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>

                    {claim.decisionNote && (
                      <p className="text-xs text-muted-foreground/70 italic">Staff note: {claim.decisionNote}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </FadeInUp>
      )}
    </AnimatedPage>
  );
}
