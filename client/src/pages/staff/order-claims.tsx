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
import type { OrderClaimRequest, Service, Grinder } from "@shared/schema";
import { Label } from "@/components/ui/label";
import {
  Wrench, Check, X, FileText, ExternalLink, Clock, Search, Hash, Copy, CalendarDays, Play, CheckCircle, DollarSign, Wallet, Gamepad2, LinkIcon, PlusCircle, AlertTriangle, ChevronDown, ChevronUp, UserPlus
} from "lucide-react";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

function statusBadge(status: string) {
  if (status === "pending") return <Badge className="bg-amber-500/20 text-amber-400 border-0">Pending</Badge>;
  if (status === "approved") return <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-red-500/20 text-red-400 border-0">Rejected</Badge>;
  return <Badge className="border-0">{status}</Badge>;
}

function repairTypeBadge(type: string) {
  if (type === "fix_order") return <Badge className="bg-blue-500/20 text-blue-400 border-0 text-[10px] gap-1"><Wrench className="w-3 h-3" />Fix Order</Badge>;
  if (type === "claim_missing") return <Badge className="bg-violet-500/20 text-violet-400 border-0 text-[10px] gap-1"><Search className="w-3 h-3" />Claim Missing</Badge>;
  if (type === "add_completed") return <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[10px] gap-1"><PlusCircle className="w-3 h-3" />Add Completed</Badge>;
  return <Badge className="border-0 text-[10px]">{type}</Badge>;
}

function TicketSearch({ ticketName }: { ticketName: string }) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState(ticketName);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{ id: string; name: string; categoryName?: string }[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const doSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/discord/channels/search?q=${encodeURIComponent(searchQuery.trim())}`, { credentials: "include" });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({ title: "Channel ID copied" });
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="Search Discord channels..."
            className="bg-white/[0.03] border-white/10 text-xs pl-8 h-8"
            data-testid="input-ticket-search"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 border-white/10 text-xs gap-1"
          onClick={doSearch}
          disabled={isSearching}
          data-testid="button-ticket-search"
        >
          <Search className="w-3 h-3" />
          {isSearching ? "..." : "Search"}
        </Button>
      </div>
      {hasSearched && (
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] max-h-40 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-xs text-muted-foreground p-3 text-center">No channels found</p>
          ) : (
            results.map(ch => (
              <div
                key={ch.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-white/[0.04] transition-colors text-xs border-b border-white/[0.04] last:border-0"
                data-testid={`channel-result-${ch.id}`}
              >
                <Hash className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="font-medium flex-1 min-w-0 truncate">{ch.name}</span>
                {ch.categoryName && (
                  <span className="text-muted-foreground/60 text-[10px] flex-shrink-0">{ch.categoryName}</span>
                )}
                <code className="text-[10px] text-muted-foreground bg-white/[0.05] px-1.5 py-0.5 rounded font-mono flex-shrink-0">{ch.id}</code>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => copyId(ch.id)}
                  data-testid={`button-copy-channel-${ch.id}`}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

type StaffFields = {
  customerPrice: string;
  platform: string;
  gamertag: string;
  serviceId: string;
  enableDailyCompliance: boolean;
};

function StaffRepairForm({ services, grinders, onSuccess }: { services: Service[]; grinders: Grinder[]; onSuccess: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [repairType, setRepairType] = useState<string>("add_completed");
  const [grinderId, setGrinderId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [ticketName, setTicketName] = useState("");
  const [grinderAmount, setGrinderAmount] = useState("");
  const [customerPrice, setCustomerPrice] = useState("");
  const [platform, setPlatform] = useState("");
  const [gamertag, setGamertag] = useState("");
  const [completedDateTime, setCompletedDateTime] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [payoutDate, setPayoutDate] = useState("");
  const [proofNotes, setProofNotes] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/order-claims/staff", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Repair request created" });
      setGrinderId(""); setServiceId(""); setTicketName(""); setGrinderAmount("");
      setCustomerPrice(""); setPlatform(""); setGamertag(""); setCompletedDateTime("");
      setStartDateTime(""); setDueDate(""); setPayoutDate(""); setProofNotes("");
      onSuccess();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!grinderId) return toast({ title: "Select a grinder", variant: "destructive" });
    if (repairType === "add_completed" && !completedDateTime) return toast({ title: "Completed date is required", variant: "destructive" });
    createMutation.mutate({
      repairType,
      grinderId,
      serviceId: serviceId || undefined,
      ticketName: ticketName || undefined,
      grinderAmount: grinderAmount || undefined,
      customerPrice: customerPrice || undefined,
      platform: platform || undefined,
      gamertag: gamertag || undefined,
      completedDateTime: completedDateTime || undefined,
      startDateTime: startDateTime || undefined,
      dueDate: dueDate || undefined,
      payoutDate: payoutDate || undefined,
      proofNotes: proofNotes || undefined,
    });
  };

  return (
    <Card className="border-0 bg-gradient-to-br from-emerald-500/[0.06] to-emerald-500/[0.02]">
      <CardContent className="p-0">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
          data-testid="button-toggle-staff-repair-form"
        >
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Create Repair Request</span>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[10px]">Staff</Badge>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {open && (
          <div className="px-4 pb-4 space-y-4 border-t border-white/[0.06]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Repair Type</Label>
                <Select value={repairType} onValueChange={setRepairType}>
                  <SelectTrigger className="bg-white/[0.03] border-white/10 text-xs" data-testid="select-staff-repair-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add_completed">Add Completed Order</SelectItem>
                    <SelectItem value="claim_missing">Claim Missing Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Grinder</Label>
                <Select value={grinderId} onValueChange={setGrinderId}>
                  <SelectTrigger className="bg-white/[0.03] border-white/10 text-xs" data-testid="select-staff-repair-grinder">
                    <SelectValue placeholder="Select grinder..." />
                  </SelectTrigger>
                  <SelectContent>
                    {grinders.filter(g => !g.isRemoved).map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name} {g.discordUsername ? `(@${g.discordUsername})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Service</Label>
                <Select value={serviceId} onValueChange={setServiceId}>
                  <SelectTrigger className="bg-white/[0.03] border-white/10 text-xs" data-testid="select-staff-repair-service">
                    <SelectValue placeholder="Select service..." />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Grinder Earnings ($)</Label>
                <Input type="number" step="0.01" min="0" placeholder="0.00" value={grinderAmount} onChange={e => setGrinderAmount(e.target.value)} className="bg-white/[0.03] border-white/10 text-xs" data-testid="input-staff-repair-amount" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Customer Price ($)</Label>
                <Input type="number" step="0.01" min="0" placeholder="0.00" value={customerPrice} onChange={e => setCustomerPrice(e.target.value)} className="bg-white/[0.03] border-white/10 text-xs" data-testid="input-staff-repair-customer-price" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger className="bg-white/[0.03] border-white/10 text-xs" data-testid="select-staff-repair-platform">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Xbox">Xbox</SelectItem>
                    <SelectItem value="PS5">PS5</SelectItem>
                    <SelectItem value="PS4">PS4</SelectItem>
                    <SelectItem value="PC">PC</SelectItem>
                    <SelectItem value="Switch">Switch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Gamertag</Label>
                <Input placeholder="Customer gamertag" value={gamertag} onChange={e => setGamertag(e.target.value)} className="bg-white/[0.03] border-white/10 text-xs" data-testid="input-staff-repair-gamertag" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Ticket Name</Label>
                <Input placeholder="Discord ticket name" value={ticketName} onChange={e => setTicketName(e.target.value)} className="bg-white/[0.03] border-white/10 text-xs" data-testid="input-staff-repair-ticket" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {repairType === "add_completed" && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Completed Date *</Label>
                  <Input type="datetime-local" value={completedDateTime} onChange={e => setCompletedDateTime(e.target.value)} className="bg-white/[0.03] border-white/10 text-xs" data-testid="input-staff-repair-completed" />
                </div>
              )}
              {repairType === "add_completed" && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Payout Date</Label>
                  <Input type="date" value={payoutDate} onChange={e => setPayoutDate(e.target.value)} className="bg-white/[0.03] border-white/10 text-xs" data-testid="input-staff-repair-payout-date" />
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Start Date</Label>
                <Input type="datetime-local" value={startDateTime} onChange={e => setStartDateTime(e.target.value)} className="bg-white/[0.03] border-white/10 text-xs" data-testid="input-staff-repair-start" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Due Date</Label>
                <Input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} className="bg-white/[0.03] border-white/10 text-xs" data-testid="input-staff-repair-due" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Notes</Label>
              <Textarea placeholder="Additional details..." value={proofNotes} onChange={e => setProofNotes(e.target.value)} className="bg-white/[0.03] border-white/10 text-xs min-h-[60px]" data-testid="input-staff-repair-notes" />
            </div>
            <Button onClick={handleSubmit} disabled={createMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 gap-2" data-testid="button-submit-staff-repair">
              <PlusCircle className="w-4 h-4" />
              {createMutation.isPending ? "Creating..." : "Create Repair Request"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function StaffOrderClaims() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  const [staffFields, setStaffFields] = useState<Record<string, StaffFields>>({});

  const { data: services = [] } = useQuery<Service[]>({ queryKey: ["/api/services"], refetchInterval: 30000 });
  const { data: grinders = [] } = useQuery<Grinder[]>({ queryKey: ["/api/grinders"] });

  const queryUrl = filter === "all" ? "/api/order-claims" : `/api/order-claims?status=${filter}`;
  const { data: claims = [], isLoading } = useQuery<OrderClaimRequest[]>({
    queryKey: ["/api/order-claims", filter],
    queryFn: async () => {
      const res = await fetch(queryUrl, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch repairs");
      return res.json();
    },
    refetchInterval: 15000,
  });

  const getStaffField = (claimId: string): StaffFields => staffFields[claimId] || { customerPrice: "", platform: "", gamertag: "", serviceId: "", enableDailyCompliance: false };
  const setStaffField = (claimId: string, field: keyof StaffFields, value: string | boolean) => {
    setStaffFields(prev => ({
      ...prev,
      [claimId]: { ...getStaffField(claimId), [field]: value },
    }));
  };

  const decideMutation = useMutation({
    mutationFn: async ({ id, status, decisionNote, customerPrice, platform, gamertag, serviceId, enableDailyCompliance }: { id: string; status: "approved" | "rejected"; decisionNote?: string; customerPrice?: string; platform?: string; gamertag?: string; serviceId?: string; enableDailyCompliance?: boolean }) => {
      const res = await apiRequest("PATCH", `/api/order-claims/${id}`, { status, decisionNote, customerPrice, platform, gamertag, serviceId, enableDailyCompliance });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/order-claims"] });
      toast({ title: "Repair request updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleDecision = (id: string, status: "approved" | "rejected") => {
    const fields = getStaffField(id);
    decideMutation.mutate({
      id,
      status,
      decisionNote: decisionNotes[id] || undefined,
      customerPrice: fields.customerPrice || undefined,
      platform: fields.platform || undefined,
      gamertag: fields.gamertag || undefined,
      serviceId: fields.serviceId || undefined,
      enableDailyCompliance: fields.enableDailyCompliance || undefined,
    });
  };

  const filters: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ];

  return (
    <AnimatedPage className="space-y-6">
      <FadeInUp>
        <div className="flex items-center gap-3">
          <Wrench className="w-7 h-7 text-amber-400" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight" data-testid="text-grind-repair-title">
              Order Repairs
            </h1>
            <p className="text-sm text-muted-foreground">Review and approve grinder repair requests</p>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
        <StaffRepairForm services={services} grinders={grinders} onSuccess={() => qc.invalidateQueries({ queryKey: ["/api/order-claims"] })} />
      </FadeInUp>

      <FadeInUp>
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map(f => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              className={filter === f.value ? "" : "border-white/10"}
              onClick={() => setFilter(f.value)}
              data-testid={`button-filter-${f.value}`}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </FadeInUp>

      {isLoading ? (
        <FadeInUp>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Card key={i} className="border-0 bg-white/[0.03] animate-pulse h-32" />)}
          </div>
        </FadeInUp>
      ) : claims.length === 0 ? (
        <FadeInUp>
          <Card className="border-0 bg-white/[0.03]">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Wrench className="w-14 h-14 text-white/10 mb-4" />
              <p className="text-white/40 font-medium">No repair requests found</p>
              <p className="text-sm text-white/25 mt-1">
                {filter === "pending" ? "No pending repairs to review" : "No repairs match this filter"}
              </p>
            </CardContent>
          </Card>
        </FadeInUp>
      ) : (
        <FadeInUp>
          <div className="space-y-3">
            {claims.map(claim => {
              const rt = (claim as any).repairType || "claim_missing";
              let fixData: any = {};
              try { fixData = JSON.parse((claim as any).fixFields || "{}"); } catch {}
              return (
                <Card key={claim.id} className="border-0 bg-white/[0.03]" data-testid={`card-repair-${claim.id}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {statusBadge(claim.status)}
                          {repairTypeBadge(rt)}
                          <span className="text-sm text-muted-foreground" data-testid={`text-repair-grinder-${claim.id}`}>
                            Grinder: <span className="text-foreground font-medium">{claim.grinderId}</span>
                          </span>
                          {claim.ticketName && !claim.ticketName.startsWith("fix-") && (
                            <Badge variant="outline" className="border-violet-500/20 text-violet-400 text-[10px] gap-1" data-testid={`badge-ticket-name-${claim.id}`}>
                              <Hash className="w-3 h-3" />
                              {claim.ticketName}
                            </Badge>
                          )}
                          {claim.orderId && (
                            <span className="text-sm text-muted-foreground" data-testid={`text-repair-order-${claim.id}`}>
                              Order: <span className="text-foreground font-medium">{claim.orderId}</span>
                            </span>
                          )}
                          {claim.serviceId && (
                            <Badge variant="outline" className="border-blue-500/20 text-blue-400 text-[10px] gap-1" data-testid={`badge-service-${claim.id}`}>
                              <Gamepad2 className="w-3 h-3" />
                              {services.find(s => s.id === claim.serviceId)?.name || claim.serviceId}
                            </Badge>
                          )}
                        </div>

                        {rt === "fix_order" && fixData.description && (
                          <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
                            <p className="text-xs font-medium text-blue-400 mb-1">Fix Description:</p>
                            <p className="text-sm text-muted-foreground">{fixData.description}</p>
                            {(fixData.serviceId || fixData.dueDate || fixData.grinderAmount) && (
                              <div className="flex items-center gap-3 flex-wrap mt-2 text-xs text-muted-foreground">
                                {fixData.serviceId && (
                                  <span className="flex items-center gap-1">
                                    <Gamepad2 className="w-3 h-3 text-violet-400" />
                                    Service: {services.find(s => s.id === fixData.serviceId)?.name || fixData.serviceId}
                                  </span>
                                )}
                                {fixData.dueDate && (
                                  <span className="flex items-center gap-1">
                                    <CalendarDays className="w-3 h-3 text-orange-400" />
                                    Due: {new Date(fixData.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                  </span>
                                )}
                                {fixData.grinderAmount && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3 text-emerald-400" />
                                    Amount: ${Number(fixData.grinderAmount).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {claim.status === "pending" && rt !== "fix_order" && !claim.ticketName.startsWith("staff-") && (
                          <TicketSearch ticketName={claim.ticketName} />
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
                              <span className="flex items-center gap-1 font-medium text-emerald-400" data-testid={`text-repair-amount-${claim.id}`}>
                                <DollarSign className="w-3 h-3" />
                                ${Number(claim.grinderAmount).toFixed(2)}
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
                          <p className="text-xs text-muted-foreground/70 italic">Decision note: {claim.decisionNote}</p>
                        )}
                      </div>

                      {claim.status === "pending" && (
                        <div className="flex flex-col gap-2 shrink-0 w-full sm:w-72">
                          {rt !== "fix_order" && (
                            <div className="border border-white/[0.06] rounded-lg p-3 bg-white/[0.02] space-y-2">
                              <p className="text-[10px] uppercase tracking-wider text-amber-400 font-medium">Staff Fill-In</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] text-muted-foreground mb-0.5 block">Customer Price</label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="$0.00"
                                    value={getStaffField(claim.id).customerPrice}
                                    onChange={(e) => setStaffField(claim.id, "customerPrice", e.target.value)}
                                    className="bg-white/[0.03] border-white/10 text-xs h-8"
                                    data-testid={`input-staff-price-${claim.id}`}
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-muted-foreground mb-0.5 block">Platform</label>
                                  <Select value={getStaffField(claim.id).platform} onValueChange={(val) => setStaffField(claim.id, "platform", val)}>
                                    <SelectTrigger className="bg-white/[0.03] border-white/10 text-xs h-8" data-testid={`select-staff-platform-${claim.id}`}>
                                      <SelectValue placeholder="Select platform" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Xbox">Xbox</SelectItem>
                                      <SelectItem value="PS5">PS5</SelectItem>
                                      <SelectItem value="PS4">PS4</SelectItem>
                                      <SelectItem value="PC">PC</SelectItem>
                                      <SelectItem value="Switch">Switch</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground mb-0.5 block">Gamertag</label>
                                <Input
                                  placeholder="Customer gamertag"
                                  value={getStaffField(claim.id).gamertag}
                                  onChange={(e) => setStaffField(claim.id, "gamertag", e.target.value)}
                                  className="bg-white/[0.03] border-white/10 text-xs h-8"
                                  data-testid={`input-staff-gamertag-${claim.id}`}
                                />
                              </div>
                              {!claim.serviceId && (
                                <div>
                                  <label className="text-[10px] text-muted-foreground mb-0.5 block">Service</label>
                                  <Select
                                    value={getStaffField(claim.id).serviceId}
                                    onValueChange={(v) => setStaffField(claim.id, "serviceId", v)}
                                  >
                                    <SelectTrigger className="bg-white/[0.03] border-white/10 text-xs h-8" data-testid={`select-staff-service-${claim.id}`}>
                                      <SelectValue placeholder="Select service..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {services.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                          )}
                          {claim.repairType === "claim_missing" && (
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                              <input
                                type="checkbox"
                                id={`compliance-${claim.id}`}
                                checked={getStaffField(claim.id).enableDailyCompliance}
                                onChange={(e) => setStaffField(claim.id, "enableDailyCompliance", e.target.checked)}
                                className="w-4 h-4 rounded accent-primary"
                                data-testid={`checkbox-compliance-${claim.id}`}
                              />
                              <Label htmlFor={`compliance-${claim.id}`} className="text-xs text-white/60 cursor-pointer">
                                Enable daily compliance tracking for this order
                              </Label>
                            </div>
                          )}
                          {claim.repairType === "add_completed" && (
                            <p className="text-[10px] text-white/30 italic">Completed order repairs are automatically exempt from daily compliance tracking.</p>
                          )}
                          <Input
                            placeholder="Decision note (optional)"
                            value={decisionNotes[claim.id] || ""}
                            onChange={(e) => setDecisionNotes(prev => ({ ...prev, [claim.id]: e.target.value }))}
                            className="bg-white/[0.03] border-white/10 text-sm"
                            data-testid={`input-decision-note-${claim.id}`}
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              className="flex-1 gap-1 bg-emerald-600 text-white"
                              onClick={() => handleDecision(claim.id, "approved")}
                              disabled={decideMutation.isPending}
                              data-testid={`button-approve-${claim.id}`}
                            >
                              <Check className="w-4 h-4" /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 gap-1 border-red-500/30 text-red-400"
                              onClick={() => handleDecision(claim.id, "rejected")}
                              disabled={decideMutation.isPending}
                              data-testid={`button-reject-${claim.id}`}
                            >
                              <X className="w-4 h-4" /> Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
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
