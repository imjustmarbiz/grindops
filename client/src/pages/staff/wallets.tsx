import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/staff-utils";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { HelpTip } from "@/components/help-tip";
import { WALLET_TYPES, TRANSACTION_CATEGORIES, DEFAULT_PAYOUT_CATEGORIES, DEFAULT_PAYOUT_ROLES } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet, CreditCard, Smartphone, Globe, Plus, ArrowUpRight, ArrowDownRight,
  ArrowLeftRight, DollarSign, TrendingUp, TrendingDown, Clock, Loader2,
  CheckCircle, X, Filter, Send, Ban, Building2, User, AlertTriangle,
  Link as LinkIcon, Upload, Search, BarChart3, Eye
} from "lucide-react";

function walletIcon(type: string) {
  const lower = type.toLowerCase();
  if (lower.includes("bank") || lower.includes("chase")) return <CreditCard className="w-4 h-4" />;
  if (lower.includes("paypal") || lower.includes("venmo") || lower.includes("cash") || lower.includes("zelle")) return <Smartphone className="w-4 h-4" />;
  if (lower.includes("crypto")) return <Globe className="w-4 h-4" />;
  return <Wallet className="w-4 h-4" />;
}

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "completed" || s === "paid" || s === "approved" || s === "transferred" || s === "not_needed") return <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 capitalize">{status.replace(/_/g, " ")}</Badge>;
  if (s === "pending" || s === "pending_transfer") return <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 capitalize">{status.replace(/_/g, " ")}</Badge>;
  if (s === "rejected" || s === "denied") return <Badge className="bg-red-500/15 text-red-400 border border-red-500/20 capitalize">{status.replace(/_/g, " ")}</Badge>;
  return <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/20 capitalize">{status.replace(/_/g, " ")}</Badge>;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function titleCase(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

const ALL_KEYS = [["/api/wallets"], ["/api/wallet-transactions"], ["/api/business-payouts"], ["/api/wallet-transfers"], ["/api/wallet-summary"], ["/api/order-payment-links"], ["/api/wallet-config"]];

export default function StaffWallets() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const WALLET_RESTRICTED_IDS = ["872820240139046952"];
  const myDiscordId = (user as any)?.discordId || user?.id || "";
  const isOwner = user?.role === "owner" && !WALLET_RESTRICTED_IDS.includes(myDiscordId);

  const [activeTab, setActiveTab] = useState("transactions");
  const [createWalletOpen, setCreateWalletOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState<any>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [markPaidOpen, setMarkPaidOpen] = useState<any>(null);
  const [linkOrderOpen, setLinkOrderOpen] = useState(false);

  const [walletForm, setWalletForm] = useState({ name: "", type: "PayPal", accountIdentifier: "", startingBalance: "0", notes: "", scope: isOwner ? "company" : "personal" });
  const [adjustForm, setAdjustForm] = useState({ amount: "", type: "deposit", description: "", category: "misc" });
  const [transferForm, setTransferForm] = useState({ fromWalletId: "", toWalletId: "", amount: "", description: "", relatedOrderId: "", proofUrl: "", transferFee: "" });
  const [payoutForm, setPayoutForm] = useState({ recipientName: "", recipientRole: "", category: "", amount: "", description: "", walletId: "", orderId: "", proofUrl: "", customRecipient: false });
  const [markPaidWalletId, setMarkPaidWalletId] = useState("");
  const [linkForm, setLinkForm] = useState({ orderId: "", receivedByWalletId: "", amount: "", proofUrl: "", notes: "" });
  const [uploadingProof, setUploadingProof] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");

  const [txFilters, setTxFilters] = useState({ walletId: "", category: "", type: "", startDate: "", endDate: "" });
  const [payoutFilters, setPayoutFilters] = useState({ status: "", category: "", recipientRole: "", startDate: "", endDate: "" });

  const txParams = new URLSearchParams();
  if (txFilters.walletId) txParams.set("walletId", txFilters.walletId);
  if (txFilters.category) txParams.set("category", txFilters.category);
  if (txFilters.type) txParams.set("type", txFilters.type);
  if (txFilters.startDate) txParams.set("startDate", txFilters.startDate);
  if (txFilters.endDate) txParams.set("endDate", txFilters.endDate);

  const payoutParams = new URLSearchParams();
  if (payoutFilters.status) payoutParams.set("status", payoutFilters.status);
  if (payoutFilters.category) payoutParams.set("category", payoutFilters.category);
  if (payoutFilters.recipientRole) payoutParams.set("recipientRole", payoutFilters.recipientRole);
  if (payoutFilters.startDate) payoutParams.set("startDate", payoutFilters.startDate);
  if (payoutFilters.endDate) payoutParams.set("endDate", payoutFilters.endDate);

  const { data: wallets = [], isLoading: walletsLoading } = useQuery<any[]>({ queryKey: ["/api/wallets"] });
  const { data: summary } = useQuery<any>({ queryKey: ["/api/wallet-summary"] });
  const { data: transactions = [] } = useQuery<any[]>({ queryKey: ["/api/wallet-transactions", txParams.toString()], queryFn: async () => { const r = await fetch(`/api/wallet-transactions?${txParams}`, { credentials: "include" }); if (!r.ok) throw new Error("Failed"); return r.json(); } });
  const { data: payouts = [] } = useQuery<any[]>({ queryKey: ["/api/business-payouts", payoutParams.toString()], queryFn: async () => { const r = await fetch(`/api/business-payouts?${payoutParams}`, { credentials: "include" }); if (!r.ok) throw new Error("Failed"); return r.json(); } });
  const { data: transfers = [] } = useQuery<any[]>({ queryKey: ["/api/wallet-transfers"] });
  const { data: orders = [] } = useQuery<any[]>({ queryKey: ["/api/orders"] });
  const { data: paymentLinks = [] } = useQuery<any[]>({ queryKey: ["/api/order-payment-links"] });
  const { data: walletConfig } = useQuery<any>({ queryKey: ["/api/wallet-config"] });
  const recipientRoleParam = payoutForm.recipientRole;
  const { data: payoutRecipients = [] } = useQuery<any[]>({ queryKey: [`/api/wallet/payout-recipients?role=${encodeURIComponent(recipientRoleParam || "")}`], enabled: !!recipientRoleParam && isOwner });

  const customRoles: string[] = walletConfig?.customRoles || [];
  const customCategories: string[] = walletConfig?.customCategories || [];
  const allRoles = [...DEFAULT_PAYOUT_ROLES, ...customRoles.filter(r => !DEFAULT_PAYOUT_ROLES.includes(r as any))];
  const allCategories = [...DEFAULT_PAYOUT_CATEGORIES, ...customCategories.filter(c => !DEFAULT_PAYOUT_CATEGORIES.includes(c as any))];

  function invalidateAll() { ALL_KEYS.forEach(k => queryClient.invalidateQueries({ queryKey: k })); }

  const companyWallets = useMemo(() => wallets.filter((w: any) => w.scope === "company"), [wallets]);
  const personalWallets = useMemo(() => wallets.filter((w: any) => w.scope === "personal"), [wallets]);
  const myWallets = useMemo(() => personalWallets.filter((w: any) => w.ownerDiscordId === myDiscordId), [personalWallets, myDiscordId]);

  const pendingTransferCount = useMemo(() => {
    if (!isOwner) {
      return paymentLinks.filter((l: any) => l.transferStatus === "pending_transfer" && myWallets.some((w: any) => w.id === l.receivedByWalletId)).length;
    }
    return paymentLinks.filter((l: any) => l.transferStatus === "pending_transfer").length;
  }, [paymentLinks, myWallets, isOwner]);

  const walletsWithPendingLinks = useMemo(() => {
    const set = new Set<string>();
    paymentLinks.filter((l: any) => l.transferStatus === "pending_transfer").forEach((l: any) => set.add(l.receivedByWalletId));
    return set;
  }, [paymentLinks]);

  const filteredOrders = useMemo(() => {
    if (!orderSearch) return orders.slice(0, 20);
    const q = orderSearch.toLowerCase();
    return orders.filter((o: any) => {
      const num = o.mgtOrderNumber?.toString() || "";
      const id = o.id?.toLowerCase() || "";
      const service = o.serviceId?.toLowerCase() || "";
      return num.includes(q) || id.includes(q) || service.includes(q);
    }).slice(0, 20);
  }, [orders, orderSearch]);

  const createWalletMut = useMutation({
    mutationFn: async (data: any) => { const r = await apiRequest("POST", "/api/wallets", data); return r.json(); },
    onSuccess: () => { invalidateAll(); setCreateWalletOpen(false); setWalletForm({ name: "", type: "PayPal", accountIdentifier: "", startingBalance: "0", notes: "", scope: isOwner ? "company" : "personal" }); toast({ title: "Wallet created" }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const adjustMut = useMutation({
    mutationFn: async ({ id, ...data }: any) => { const r = await apiRequest("POST", `/api/wallets/${id}/adjust`, data); return r.json(); },
    onSuccess: () => { invalidateAll(); setAdjustOpen(null); setAdjustForm({ amount: "", type: "deposit", description: "", category: "misc" }); toast({ title: "Balance adjusted" }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const transferMut = useMutation({
    mutationFn: async (data: any) => { const r = await apiRequest("POST", "/api/wallets/transfer", data); return r.json(); },
    onSuccess: () => { invalidateAll(); setTransferOpen(false); setTransferForm({ fromWalletId: "", toWalletId: "", amount: "", description: "", relatedOrderId: "", proofUrl: "", transferFee: "" }); toast({ title: "Transfer submitted" }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  async function uploadProofFile(file: File): Promise<string> {
    setUploadingProof(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/staff/upload-payment-proof", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      return data.url;
    } finally {
      setUploadingProof(false);
    }
  }

  const createPayoutMut = useMutation({
    mutationFn: async (data: any) => { const r = await apiRequest("POST", "/api/business-payouts", data); return r.json(); },
    onSuccess: () => { invalidateAll(); setPayoutOpen(false); setPayoutForm({ recipientName: "", recipientRole: "", category: "", amount: "", description: "", walletId: "", orderId: "", proofUrl: "", customRecipient: false }); toast({ title: "Payout created" }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const approvePayoutMut = useMutation({
    mutationFn: async (id: string) => { const r = await apiRequest("PATCH", `/api/business-payouts/${id}/approve`); return r.json(); },
    onSuccess: () => { invalidateAll(); toast({ title: "Payout approved" }); },
  });

  const rejectPayoutMut = useMutation({
    mutationFn: async (id: string) => { const r = await apiRequest("PATCH", `/api/business-payouts/${id}/reject`); return r.json(); },
    onSuccess: () => { invalidateAll(); toast({ title: "Payout rejected" }); },
  });

  const markPaidMut = useMutation({
    mutationFn: async ({ id, walletId }: { id: string; walletId: string }) => { const r = await apiRequest("PATCH", `/api/business-payouts/${id}/pay`, { walletId }); return r.json(); },
    onSuccess: () => { invalidateAll(); setMarkPaidOpen(null); setMarkPaidWalletId(""); toast({ title: "Marked as paid" }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const approveTransferMut = useMutation({
    mutationFn: async (id: string) => { const r = await apiRequest("PATCH", `/api/wallets/transfers/${id}/approve`); return r.json(); },
    onSuccess: () => { invalidateAll(); toast({ title: "Transfer approved" }); },
  });

  const linkOrderMut = useMutation({
    mutationFn: async (data: any) => { const r = await apiRequest("POST", "/api/order-payment-links", data); return r.json(); },
    onSuccess: () => { invalidateAll(); setLinkOrderOpen(false); setLinkForm({ orderId: "", receivedByWalletId: "", amount: "", proofUrl: "", notes: "" }); toast({ title: "Order payment linked" }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  if (walletsLoading) {
    return <div className="flex items-center justify-center h-64" data-testid="loading-wallets"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const walletsMap = new Map(wallets.map((w: any) => [w.id, w]));
  const staffTransferFromWallets = isOwner ? wallets : myWallets;
  const staffTransferToWallets = isOwner ? wallets.filter((w: any) => w.id !== transferForm.fromWalletId) : wallets.filter((w: any) => w.id !== transferForm.fromWalletId);
  const linkableWallets = isOwner ? wallets : myWallets;

  return (
    <AnimatedPage className="space-y-5" data-testid="page-wallets">
      <FadeInUp>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Wallet className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight" data-testid="text-page-title">
                {isOwner ? "Business Wallet" : "My Wallet"}
                <HelpTip text={isOwner ? "Tracks all company revenue, grinder payouts, and staff balances. Add transactions to log payments, expenses, or adjustments. Each staff member has their own sub-wallet." : "Shows what you owe the business and what the business owes you. Log transactions as you collect payments or receive payouts."} />
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isOwner ? "Track business finances across all wallets" : "Track finances you owe to the business and your payouts from the business"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => { setTransferForm({ fromWalletId: myWallets[0]?.id || "", toWalletId: "", amount: "", description: "", relatedOrderId: "", proofUrl: "", transferFee: "" }); setTransferOpen(true); }} data-testid="button-open-transfer"><ArrowLeftRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />Transfer</Button>
            {isOwner && <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => setPayoutOpen(true)} data-testid="button-open-payout"><Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />Payout</Button>}
            <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => setLinkOrderOpen(true)} data-testid="button-link-order"><LinkIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /><span className="hidden sm:inline">Link </span>Payment</Button>
            <Button size="sm" className="text-xs sm:text-sm" onClick={() => { setWalletForm({ name: "", type: "PayPal", accountIdentifier: "", startingBalance: "0", notes: "", scope: isOwner ? "company" : "personal" }); setCreateWalletOpen(true); }} data-testid="button-add-wallet"><Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /><span className="hidden sm:inline">Add </span>Wallet</Button>
          </div>
        </div>
      </FadeInUp>

      {summary && (
        <FadeInUp>
          <div className={`grid gap-4 ${isOwner ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" : "grid-cols-2 sm:grid-cols-4"}`}>
            {[
              { label: isOwner ? "Company Balance" : "Your Balance", value: formatCurrency(Number(summary.totalBalance || 0)), icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/15", testId: "text-total-balance" },
              { label: "Total In", value: formatCurrency(Number(summary.totalDeposits || 0)), icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/15", testId: "text-total-in" },
              { label: "Total Out", value: formatCurrency(Number(summary.totalWithdrawals || 0)), icon: TrendingDown, color: "text-red-400", bg: "bg-red-500/15", testId: "text-total-out" },
              { label: "Pending Payouts", value: formatCurrency(Number(summary.pendingPayouts || 0)), icon: Clock, color: "text-amber-400", bg: "bg-amber-500/15", testId: "text-pending-payouts" },
              ...(isOwner ? [
                { label: "Staff Holding", value: formatCurrency(Number(summary.staffHolding || 0)), icon: User, color: "text-blue-400", bg: "bg-blue-500/15", testId: "text-staff-holding" },
                { label: "Pending", value: formatCurrency(Number(summary.pendingTransfers || 0)), icon: ArrowLeftRight, color: "text-purple-400", bg: "bg-purple-500/15", testId: "text-pending-transfers" },
              ] : []),
            ].map(s => (
              <Card key={s.label} className="border-0 bg-white/[0.03]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">{s.label}</p>
                      <p className={`text-lg sm:text-xl font-bold ${s.color} tracking-tight`} data-testid={s.testId}>{s.value}</p>
                    </div>
                    <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                      <s.icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </FadeInUp>
      )}

      {pendingTransferCount > 0 && (
        <FadeInUp>
          <Card className="border border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Outstanding Transfers</p>
                <p className="text-xs text-muted-foreground">{pendingTransferCount} order payment{pendingTransferCount > 1 ? "s" : ""} received in personal wallet{pendingTransferCount > 1 ? "s" : ""} — transfer to company wallet required</p>
              </div>
              <Button size="sm" variant="outline" className="ml-auto shrink-0" onClick={() => setActiveTab("order-payments")} data-testid="button-view-outstanding">
                View
              </Button>
            </CardContent>
          </Card>
        </FadeInUp>
      )}

      {isOwner && companyWallets.length > 0 && (
        <FadeInUp>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Company Wallets</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companyWallets.map((w: any) => {
                const stats = summary?.perWalletStats?.find((s: any) => s.walletId === w.id);
                return (
                  <Card key={w.id} className="border-0 bg-white/[0.03]" data-testid={`card-wallet-${w.id}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">{walletIcon(w.type)}</div>
                          <div className="min-w-0">
                            <p className="font-medium truncate" data-testid={`text-wallet-name-${w.id}`}>{w.name}</p>
                            <p className="text-[10px] text-muted-foreground">Company</p>
                          </div>
                        </div>
                        <Badge className="shrink-0">{w.type}</Badge>
                      </div>
                      <p className="text-xl font-bold text-emerald-400" data-testid={`text-wallet-balance-${w.id}`}>{formatCurrency(Number(w.balance || 0))}</p>
                      {stats && (
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06]">
                          <div><p className="text-[10px] text-muted-foreground">In</p><p className="text-xs font-medium text-green-400">{formatCurrency(stats.totalIn)}</p></div>
                          <div><p className="text-[10px] text-muted-foreground">Out</p><p className="text-xs font-medium text-red-400">{formatCurrency(stats.totalOut)}</p></div>
                          <div><p className="text-[10px] text-muted-foreground">Txns</p><p className="text-xs font-medium">{stats.txCount}</p></div>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setAdjustOpen(w); setAdjustForm({ amount: "", type: "deposit", description: "", category: "misc" }); }} data-testid={`button-add-money-${w.id}`}>
                          <ArrowUpRight className="w-3 h-3 mr-1" />Add
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setAdjustOpen(w); setAdjustForm({ amount: "", type: "withdrawal", description: "", category: "misc" }); }} data-testid={`button-remove-money-${w.id}`}>
                          <ArrowDownRight className="w-3 h-3 mr-1" />Remove
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setTransferForm({ fromWalletId: w.id, toWalletId: "", amount: "", description: "", relatedOrderId: "", proofUrl: "", transferFee: "" }); setTransferOpen(true); }} data-testid={`button-transfer-${w.id}`}>
                          <ArrowLeftRight className="w-3 h-3 mr-1" />Transfer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </FadeInUp>
      )}

      {(isOwner ? personalWallets.length > 0 : myWallets.length > 0) && (
        <FadeInUp>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {isOwner ? "Staff Personal Wallets" : "Your Payment Methods"}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(isOwner ? personalWallets : myWallets).map((w: any) => {
                const stats = summary?.perWalletStats?.find((s: any) => s.walletId === w.id);
                return (
                  <Card key={w.id} className={`border-0 bg-white/[0.03] ${!isOwner ? "" : (walletsWithPendingLinks.has(w.id) ? "ring-1 ring-amber-500/30" : "")}`} data-testid={`card-wallet-${w.id}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">{walletIcon(w.type)}</div>
                          <div className="min-w-0">
                            <p className="font-medium truncate" data-testid={`text-wallet-name-${w.id}`}>{w.name}</p>
                            <p className="text-[10px] text-muted-foreground">{w.ownerName || "Personal"}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="shrink-0">{w.type}</Badge>
                      </div>
                      <p className={`text-xl font-bold ${walletsWithPendingLinks.has(w.id) ? "text-amber-400" : "text-emerald-400"}`} data-testid={`text-wallet-balance-${w.id}`}>
                        {formatCurrency(Number(w.balance || 0))}
                      </p>
                      {walletsWithPendingLinks.has(w.id) && !isOwner && (
                        <p className="text-[10px] text-amber-400/80">Pending order payments — transfer to company required</p>
                      )}
                      {isOwner && walletsWithPendingLinks.has(w.id) && (
                        <p className="text-[10px] text-amber-400/80">Pending order payments — {w.ownerName || "staff"}</p>
                      )}
                      {stats && (
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06]">
                          <div><p className="text-[10px] text-muted-foreground">In</p><p className="text-xs font-medium text-green-400">{formatCurrency(stats.totalIn)}</p></div>
                          <div><p className="text-[10px] text-muted-foreground">Out</p><p className="text-xs font-medium text-red-400">{formatCurrency(stats.totalOut)}</p></div>
                          <div><p className="text-[10px] text-muted-foreground">Txns</p><p className="text-xs font-medium">{stats.txCount}</p></div>
                        </div>
                      )}
                      {!isOwner && walletsWithPendingLinks.has(w.id) && (
                        <Button size="sm" variant="outline" className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10" onClick={() => { setTransferForm({ fromWalletId: w.id, toWalletId: companyWallets[0]?.id || "", amount: String(Number(w.balance || 0)), description: "", relatedOrderId: "", proofUrl: "", transferFee: "" }); setTransferOpen(true); }} data-testid={`button-transfer-to-company-${w.id}`}>
                          <ArrowLeftRight className="w-3 h-3 mr-1" />Transfer to Company
                        </Button>
                      )}
                      {isOwner && walletsWithPendingLinks.has(w.id) && (
                        <Button size="sm" variant="outline" className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10" onClick={() => { setTransferForm({ fromWalletId: w.id, toWalletId: companyWallets[0]?.id || "", amount: String(Number(w.balance || 0)), description: `Transfer from ${w.ownerName || "staff"}`, relatedOrderId: "", proofUrl: "", transferFee: "" }); setTransferOpen(true); }} data-testid={`button-request-transfer-${w.id}`}>
                          <Send className="w-3 h-3 mr-1" />Request Transfer
                        </Button>
                      )}
                      {!isOwner && (
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setAdjustOpen(w); setAdjustForm({ amount: "", type: "deposit", description: "", category: "misc" }); }} data-testid={`button-add-money-${w.id}`}>
                            <ArrowUpRight className="w-3 h-3 mr-1" />Add
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setAdjustOpen(w); setAdjustForm({ amount: "", type: "withdrawal", description: "", category: "misc" }); }} data-testid={`button-remove-money-${w.id}`}>
                            <ArrowDownRight className="w-3 h-3 mr-1" />Remove
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </FadeInUp>
      )}

      {summary?.perWalletStats?.length > 0 && isOwner && (
        <FadeInUp>
          <Card className="border-0 bg-white/[0.03]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Wallet KPIs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 md:hidden">
                {summary.perWalletStats.map((s: any) => (
                  <div key={s.walletId} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <Badge variant="outline" className="text-[10px] shrink-0">{s.type}</Badge>
                        <Badge className={`text-[10px] shrink-0 ${s.scope === "company" ? "bg-primary/15 text-primary" : "bg-blue-500/15 text-blue-400"}`}>{titleCase(s.scope)}</Badge>
                      </div>
                      <p className="text-sm font-bold text-emerald-400 shrink-0">{formatCurrency(s.balance)}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/[0.06]">
                      <div><p className="text-[10px] text-muted-foreground">In</p><p className="text-xs font-medium text-green-400">{formatCurrency(s.totalIn)}</p></div>
                      <div><p className="text-[10px] text-muted-foreground">Out</p><p className="text-xs font-medium text-red-400">{formatCurrency(s.totalOut)}</p></div>
                      <div><p className="text-[10px] text-muted-foreground">Net</p><p className={`text-xs font-medium ${s.totalIn - s.totalOut >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCurrency(s.totalIn - s.totalOut)}</p></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="overflow-auto hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right">Total In</TableHead>
                      <TableHead className="text-right">Total Out</TableHead>
                      <TableHead className="text-right">Net Flow</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.perWalletStats.map((s: any) => (
                      <TableRow key={s.walletId}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell><Badge variant="outline">{s.type}</Badge></TableCell>
                        <TableCell><Badge className={s.scope === "company" ? "bg-primary/15 text-primary" : "bg-blue-500/15 text-blue-400"}>{titleCase(s.scope)}</Badge></TableCell>
                        <TableCell className="text-right font-medium text-emerald-400">{formatCurrency(s.balance)}</TableCell>
                        <TableCell className="text-right text-green-400">{formatCurrency(s.totalIn)}</TableCell>
                        <TableCell className="text-right text-red-400">{formatCurrency(s.totalOut)}</TableCell>
                        <TableCell className={`text-right font-medium ${s.totalIn - s.totalOut >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCurrency(s.totalIn - s.totalOut)}</TableCell>
                        <TableCell className="text-right">{s.txCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </FadeInUp>
      )}

      <FadeInUp>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto -mx-1 px-1">
            <TabsList className="w-full sm:w-auto" data-testid="tabs-wallet">
              <TabsTrigger value="transactions" data-testid="tab-transactions" className="text-xs sm:text-sm">Txns</TabsTrigger>
              <TabsTrigger value="payouts" data-testid="tab-payouts" className="text-xs sm:text-sm">Payouts</TabsTrigger>
              <TabsTrigger value="transfers" data-testid="tab-transfers" className="text-xs sm:text-sm">Transfers</TabsTrigger>
              <TabsTrigger value="order-payments" data-testid="tab-order-payments" className="relative text-xs sm:text-sm">
                Payments
                {pendingTransferCount > 0 && <span className="ml-1 w-4 h-4 rounded-full bg-amber-500/80 text-[10px] text-white inline-flex items-center justify-center">{pendingTransferCount}</span>}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="transactions" className="space-y-4 mt-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
              <Select value={txFilters.walletId || "all"} onValueChange={v => setTxFilters(f => ({ ...f, walletId: v === "all" ? "" : v }))}>
                <SelectTrigger className="w-[140px] sm:w-[180px] text-xs sm:text-sm" data-testid="select-tx-wallet"><SelectValue placeholder="All Wallets" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wallets</SelectItem>
                  {wallets.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={txFilters.category || "all"} onValueChange={v => setTxFilters(f => ({ ...f, category: v === "all" ? "" : v }))}>
                <SelectTrigger className="w-[130px] sm:w-[160px] text-xs sm:text-sm" data-testid="select-tx-category"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {TRANSACTION_CATEGORIES.map(c => <SelectItem key={c} value={c}>{titleCase(c)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={txFilters.type || "all"} onValueChange={v => setTxFilters(f => ({ ...f, type: v === "all" ? "" : v }))}>
                <SelectTrigger className="w-[130px] sm:w-[160px] text-xs sm:text-sm" data-testid="select-tx-type"><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {["deposit", "withdrawal", "transfer_in", "transfer_out", "grinder_payout", "business_payout", "fine_received", "order_income", "adjustment"].map(t => <SelectItem key={t} value={t}>{titleCase(t)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="date" value={txFilters.startDate} onChange={e => setTxFilters(f => ({ ...f, startDate: e.target.value }))} className="w-[130px] sm:w-[150px] text-xs sm:text-sm" data-testid="input-tx-start-date" />
              <Input type="date" value={txFilters.endDate} onChange={e => setTxFilters(f => ({ ...f, endDate: e.target.value }))} className="w-[130px] sm:w-[150px] text-xs sm:text-sm" data-testid="input-tx-end-date" />
              {(txFilters.walletId || txFilters.category || txFilters.type || txFilters.startDate || txFilters.endDate) && (
                <Button variant="ghost" size="sm" onClick={() => setTxFilters({ walletId: "", category: "", type: "", startDate: "", endDate: "" })} data-testid="button-clear-tx-filters">
                  <X className="w-3 h-3 mr-1" />Clear
                </Button>
              )}
            </div>
            <div className="space-y-2 md:hidden">
              {transactions.length === 0 && <p className="text-center text-muted-foreground py-8">No transactions found</p>}
              {transactions.map((tx: any) => {
                const isPositive = ["deposit", "transfer_in", "order_income", "fine_received"].includes(tx.type);
                return (
                  <div key={tx.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-2" data-testid={`card-txn-mobile-${tx.id}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${isPositive ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
                          {isPositive ? <ArrowUpRight className={`w-3.5 h-3.5 text-emerald-400`} /> : <ArrowDownRight className={`w-3.5 h-3.5 text-red-400`} />}
                        </div>
                        <div className="min-w-0">
                          <Badge className="text-[10px] capitalize">{titleCase(tx.type || "")}</Badge>
                        </div>
                      </div>
                      <p className={`text-sm font-bold ${isPositive ? "text-emerald-400" : "text-red-400"}`} data-testid={`text-tx-amount-mobile-${tx.id}`}>
                        {isPositive ? "+" : "-"}{formatCurrency(Math.abs(Number(tx.amount || 0)))}
                      </p>
                    </div>
                    {tx.description && <p className="text-xs text-muted-foreground truncate">{tx.description}</p>}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                      <span>{fmtDate(tx.createdAt)}</span>
                      <span>{walletsMap.get(tx.walletId)?.name || tx.walletId}</span>
                      {tx.category && <span className="capitalize">{titleCase(tx.category)}</span>}
                      {tx.relatedOrderId && <span>Order: {tx.relatedOrderId}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="rounded-lg border border-white/[0.06] overflow-auto hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Date</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Wallet</TableHead>
                    <TableHead className="text-xs sm:text-sm">Type</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden md:table-cell">Category</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Amount</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm hidden md:table-cell">Balance</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Description</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No transactions found</TableCell></TableRow>}
                  {transactions.map((tx: any) => {
                    const isPositive = ["deposit", "transfer_in", "order_income", "fine_received"].includes(tx.type);
                    return (
                      <TableRow key={tx.id} data-testid={`row-tx-${tx.id}`}>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">{fmtDate(tx.createdAt)}</TableCell>
                        <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{walletsMap.get(tx.walletId)?.name || tx.walletId}</TableCell>
                        <TableCell><Badge className="text-[10px] sm:text-xs capitalize">{titleCase(tx.type || "")}</Badge></TableCell>
                        <TableCell className="text-xs sm:text-sm text-muted-foreground capitalize hidden md:table-cell">{titleCase(tx.category || "")}</TableCell>
                        <TableCell className={`text-right text-xs sm:text-sm font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`} data-testid={`text-tx-amount-${tx.id}`}>
                          {isPositive ? "+" : "-"}{formatCurrency(Math.abs(Number(tx.amount || 0)))}
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm hidden md:table-cell">{formatCurrency(Number(tx.balanceAfter || 0))}</TableCell>
                        <TableCell className="text-xs sm:text-sm text-muted-foreground max-w-[200px] truncate hidden lg:table-cell">{tx.description || "—"}</TableCell>
                        <TableCell className="text-xs sm:text-sm text-muted-foreground hidden lg:table-cell">{tx.relatedOrderId || "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="payouts" className="space-y-4 mt-4">
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
              <Select value={payoutFilters.status || "all"} onValueChange={v => setPayoutFilters(f => ({ ...f, status: v === "all" ? "" : v }))}>
                <SelectTrigger className="w-[130px] sm:w-[160px] text-xs sm:text-sm" data-testid="select-payout-status"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {["pending", "approved", "paid", "rejected"].map(s => <SelectItem key={s} value={s}>{titleCase(s)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={payoutFilters.category || "all"} onValueChange={v => setPayoutFilters(f => ({ ...f, category: v === "all" ? "" : v }))}>
                <SelectTrigger className="w-[130px] sm:w-[160px] text-xs sm:text-sm" data-testid="select-payout-category"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={payoutFilters.recipientRole || "all"} onValueChange={v => setPayoutFilters(f => ({ ...f, recipientRole: v === "all" ? "" : v }))}>
                <SelectTrigger className="w-[130px] sm:w-[160px] text-xs sm:text-sm" data-testid="select-payout-role"><SelectValue placeholder="All Roles" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {allRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="date" value={payoutFilters.startDate} onChange={e => setPayoutFilters(f => ({ ...f, startDate: e.target.value }))} className="w-[130px] sm:w-[150px] text-xs sm:text-sm" data-testid="input-payout-start-date" />
              <Input type="date" value={payoutFilters.endDate} onChange={e => setPayoutFilters(f => ({ ...f, endDate: e.target.value }))} className="w-[130px] sm:w-[150px] text-xs sm:text-sm" data-testid="input-payout-end-date" />
              {(payoutFilters.status || payoutFilters.category || payoutFilters.recipientRole || payoutFilters.startDate || payoutFilters.endDate) && (
                <Button variant="ghost" size="sm" onClick={() => setPayoutFilters({ status: "", category: "", recipientRole: "", startDate: "", endDate: "" })} data-testid="button-clear-payout-filters">
                  <X className="w-3 h-3 mr-1" />Clear
                </Button>
              )}
            </div>
            <div className="space-y-2 md:hidden">
              {payouts.length === 0 && <p className="text-center text-muted-foreground py-8">No payouts found</p>}
              {payouts.map((p: any) => (
                <div key={p.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-2" data-testid={`card-txn-mobile-${p.id}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.recipientName}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <Badge className="text-[10px] capitalize">{p.recipientRole}</Badge>
                        {statusBadge(p.status)}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-red-400 shrink-0" data-testid={`text-payout-amount-mobile-${p.id}`}>{formatCurrency(Number(p.amount || 0))}</p>
                  </div>
                  {p.description && <p className="text-xs text-muted-foreground truncate">{p.description}</p>}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                    <span>{fmtDate(p.createdAt)}</span>
                    {p.category && <span className="capitalize">{p.category}</span>}
                    {p.walletId && <span>{walletsMap.get(p.walletId)?.name || p.walletId}</span>}
                    {p.proofUrl && <a href={p.proofUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline" data-testid={`link-payout-proof-mobile-${p.id}`}><Eye className="w-3 h-3 inline mr-0.5" />Proof</a>}
                  </div>
                  {isOwner && (p.status === "pending" || p.status === "approved") && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {p.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => approvePayoutMut.mutate(p.id)} disabled={approvePayoutMut.isPending} data-testid={`button-approve-payout-mobile-${p.id}`}>
                            <CheckCircle className="w-3 h-3 mr-1" />Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => rejectPayoutMut.mutate(p.id)} disabled={rejectPayoutMut.isPending} data-testid={`button-reject-payout-mobile-${p.id}`}>
                            <Ban className="w-3 h-3 mr-1" />Reject
                          </Button>
                        </>
                      )}
                      {p.status === "approved" && (
                        <Button size="sm" variant="outline" onClick={() => { setMarkPaidOpen(p); setMarkPaidWalletId(""); }} data-testid={`button-mark-paid-mobile-${p.id}`}>
                          <DollarSign className="w-3 h-3 mr-1" />Mark Paid
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-white/[0.06] overflow-auto hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Date</TableHead>
                    <TableHead className="text-xs sm:text-sm">Recipient</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Role</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden md:table-cell">Category</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Amount</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Wallet</TableHead>
                    <TableHead className="text-xs sm:text-sm">Status</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Order</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden md:table-cell">Proof</TableHead>
                    {isOwner && <TableHead className="text-xs sm:text-sm">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.length === 0 && <TableRow><TableCell colSpan={isOwner ? 10 : 9} className="text-center text-muted-foreground py-8">No payouts found</TableCell></TableRow>}
                  {payouts.map((p: any) => (
                    <TableRow key={p.id} data-testid={`row-payout-${p.id}`}>
                      <TableCell className="text-xs sm:text-sm whitespace-nowrap">{fmtDate(p.createdAt)}</TableCell>
                      <TableCell className="text-xs sm:text-sm font-medium">{p.recipientName}</TableCell>
                      <TableCell className="hidden sm:table-cell"><Badge className="text-[10px] sm:text-xs capitalize">{p.recipientRole}</Badge></TableCell>
                      <TableCell className="text-xs sm:text-sm text-muted-foreground capitalize hidden md:table-cell">{p.category}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm font-medium text-red-400" data-testid={`text-payout-amount-${p.id}`}>{formatCurrency(Number(p.amount || 0))}</TableCell>
                      <TableCell className="text-xs sm:text-sm text-muted-foreground hidden lg:table-cell">{p.walletId ? (walletsMap.get(p.walletId)?.name || p.walletId) : "—"}</TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                      <TableCell className="text-xs sm:text-sm text-muted-foreground hidden lg:table-cell">{p.orderId || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">{p.proofUrl ? <a href={p.proofUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs"><Eye className="w-3 h-3 inline mr-1" />View</a> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                      {isOwner && (
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {p.status === "pending" && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => approvePayoutMut.mutate(p.id)} disabled={approvePayoutMut.isPending} data-testid={`button-approve-payout-${p.id}`}>
                                  <CheckCircle className="w-3 h-3 mr-1" />Approve
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => rejectPayoutMut.mutate(p.id)} disabled={rejectPayoutMut.isPending} data-testid={`button-reject-payout-${p.id}`}>
                                  <Ban className="w-3 h-3 mr-1" />Reject
                                </Button>
                              </>
                            )}
                            {p.status === "approved" && (
                              <Button size="sm" variant="outline" onClick={() => { setMarkPaidOpen(p); setMarkPaidWalletId(""); }} data-testid={`button-mark-paid-${p.id}`}>
                                <DollarSign className="w-3 h-3 mr-1" />Mark Paid
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="transfers" className="space-y-4 mt-4">
            <div className="space-y-2 md:hidden">
              {transfers.length === 0 && <p className="text-center text-muted-foreground py-8">No transfers found</p>}
              {transfers.map((t: any) => (
                <div key={t.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-2" data-testid={`card-txn-mobile-${t.id}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-blue-500/15 flex items-center justify-center shrink-0">
                        <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs truncate">{walletsMap.get(t.fromWalletId)?.name || t.fromWalletId}</p>
                        <p className="text-[10px] text-muted-foreground truncate">to {walletsMap.get(t.toWalletId)?.name || t.toWalletId}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-blue-400 shrink-0" data-testid={`text-transfer-amount-mobile-${t.id}`}>{formatCurrency(Number(t.amount || 0))}</p>
                  </div>
                  {t.description && <p className="text-xs text-muted-foreground truncate">{t.description}</p>}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                    <span>{fmtDate(t.createdAt)}</span>
                    {statusBadge(t.status)}
                    {Number(t.transferFee || 0) > 0 && <span>Fee: {formatCurrency(Number(t.transferFee))}</span>}
                    {t.performedByName && <span>By: {t.performedByName}</span>}
                    {t.proofUrl && <a href={t.proofUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline" data-testid={`link-transfer-proof-mobile-${t.id}`}><Eye className="w-3 h-3 inline mr-0.5" />Proof</a>}
                  </div>
                  {isOwner && t.status === "pending" && (
                    <div className="pt-1">
                      <Button size="sm" variant="outline" onClick={() => approveTransferMut.mutate(t.id)} disabled={approveTransferMut.isPending} data-testid={`button-approve-transfer-mobile-${t.id}`}>
                        <CheckCircle className="w-3 h-3 mr-1" />Approve
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-white/[0.06] overflow-auto hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Date</TableHead>
                    <TableHead className="text-xs sm:text-sm">From</TableHead>
                    <TableHead className="text-xs sm:text-sm">To</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Amount</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm hidden md:table-cell">Fee</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Description</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Order</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden md:table-cell">Proof</TableHead>
                    <TableHead className="text-xs sm:text-sm">Status</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden sm:table-cell">By</TableHead>
                    {isOwner && <TableHead className="text-xs sm:text-sm">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.length === 0 && <TableRow><TableCell colSpan={isOwner ? 11 : 10} className="text-center text-muted-foreground py-8">No transfers found</TableCell></TableRow>}
                  {transfers.map((t: any) => (
                    <TableRow key={t.id} data-testid={`row-transfer-${t.id}`}>
                      <TableCell className="text-xs sm:text-sm whitespace-nowrap">{fmtDate(t.createdAt)}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{walletsMap.get(t.fromWalletId)?.name || t.fromWalletId}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{walletsMap.get(t.toWalletId)?.name || t.toWalletId}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm font-medium text-blue-400" data-testid={`text-transfer-amount-${t.id}`}>{formatCurrency(Number(t.amount || 0))}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm text-muted-foreground hidden md:table-cell">{Number(t.transferFee || 0) > 0 ? formatCurrency(Number(t.transferFee)) : "—"}</TableCell>
                      <TableCell className="text-xs sm:text-sm text-muted-foreground max-w-[200px] truncate hidden lg:table-cell">{t.description || "—"}</TableCell>
                      <TableCell className="text-xs sm:text-sm text-muted-foreground hidden lg:table-cell">{t.relatedOrderId || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">{t.proofUrl ? <a href={t.proofUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs"><Eye className="w-3 h-3 inline mr-1" />View</a> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                      <TableCell>{statusBadge(t.status)}</TableCell>
                      <TableCell className="text-xs sm:text-sm text-muted-foreground hidden sm:table-cell">{t.performedByName || "—"}</TableCell>
                      {isOwner && (
                        <TableCell>
                          {t.status === "pending" && (
                            <Button size="sm" variant="outline" onClick={() => approveTransferMut.mutate(t.id)} disabled={approveTransferMut.isPending} data-testid={`button-approve-transfer-${t.id}`}>
                              <CheckCircle className="w-3 h-3 mr-1" />Approve
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="order-payments" className="space-y-4 mt-4">
            <div className="space-y-2 md:hidden">
              {paymentLinks.length === 0 && <p className="text-center text-muted-foreground py-8">No order payments linked yet</p>}
              {paymentLinks.map((l: any) => (
                <div key={l.id} className={`rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-2 ${l.transferStatus === "pending_transfer" ? "border-amber-500/20" : ""}`} data-testid={`card-txn-mobile-${l.id}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Order: {l.orderId}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{walletsMap.get(l.receivedByWalletId)?.name || l.receivedByWalletId}</p>
                    </div>
                    <p className="text-sm font-bold text-emerald-400 shrink-0">{formatCurrency(Number(l.amount || 0))}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                    <span>{fmtDate(l.createdAt)}</span>
                    {statusBadge(l.transferStatus)}
                    {l.createdByName && <span>By: {l.createdByName}</span>}
                    {l.proofUrl && <a href={l.proofUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline" data-testid={`link-opl-proof-mobile-${l.id}`}><Eye className="w-3 h-3 inline mr-0.5" />Proof</a>}
                  </div>
                  {l.notes && <p className="text-xs text-muted-foreground truncate">{l.notes}</p>}
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-white/[0.06] overflow-auto hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Date</TableHead>
                    <TableHead className="text-xs sm:text-sm">Order</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Received By</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Amount</TableHead>
                    <TableHead className="text-xs sm:text-sm">Status</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden md:table-cell">Proof</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Notes</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden md:table-cell">Created By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentLinks.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No order payments linked yet</TableCell></TableRow>}
                  {paymentLinks.map((l: any) => (
                    <TableRow key={l.id} data-testid={`row-opl-${l.id}`} className={l.transferStatus === "pending_transfer" ? "bg-amber-500/5" : ""}>
                      <TableCell className="text-xs sm:text-sm whitespace-nowrap">{fmtDate(l.createdAt)}</TableCell>
                      <TableCell className="text-xs sm:text-sm font-medium">{l.orderId}</TableCell>
                      <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{walletsMap.get(l.receivedByWalletId)?.name || l.receivedByWalletId}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm font-medium text-emerald-400">{formatCurrency(Number(l.amount || 0))}</TableCell>
                      <TableCell>{statusBadge(l.transferStatus)}</TableCell>
                      <TableCell className="hidden md:table-cell">{l.proofUrl ? <a href={l.proofUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs"><Eye className="w-3 h-3 inline mr-1" />View</a> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                      <TableCell className="text-xs sm:text-sm text-muted-foreground max-w-[150px] truncate hidden lg:table-cell">{l.notes || "—"}</TableCell>
                      <TableCell className="text-xs sm:text-sm text-muted-foreground hidden md:table-cell">{l.createdByName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </FadeInUp>

      <Dialog open={createWalletOpen} onOpenChange={setCreateWalletOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Wallet</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {isOwner && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Scope</label>
                <Select value={walletForm.scope} onValueChange={v => setWalletForm(f => ({ ...f, scope: v }))}>
                  <SelectTrigger data-testid="select-wallet-scope"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">Company Wallet</SelectItem>
                    <SelectItem value="personal">Personal Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name</label>
              <Input value={walletForm.name} onChange={e => setWalletForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Main PayPal" data-testid="input-wallet-name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Type</label>
              <Select value={walletForm.type} onValueChange={v => setWalletForm(f => ({ ...f, type: v }))}>
                <SelectTrigger data-testid="select-wallet-type"><SelectValue /></SelectTrigger>
                <SelectContent>{WALLET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Account Identifier</label>
              <Input value={walletForm.accountIdentifier} onChange={e => setWalletForm(f => ({ ...f, accountIdentifier: e.target.value }))} placeholder="Email, account number, etc." data-testid="input-wallet-identifier" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Starting Balance</label>
              <Input type="number" value={walletForm.startingBalance} onChange={e => setWalletForm(f => ({ ...f, startingBalance: e.target.value }))} data-testid="input-wallet-balance" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Notes</label>
              <Textarea value={walletForm.notes} onChange={e => setWalletForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" data-testid="input-wallet-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateWalletOpen(false)} data-testid="button-cancel-wallet">Cancel</Button>
            <Button onClick={() => createWalletMut.mutate(walletForm)} disabled={!walletForm.name || createWalletMut.isPending} data-testid="button-submit-wallet">
              {createWalletMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!adjustOpen} onOpenChange={v => !v && setAdjustOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust Balance — {adjustOpen?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Type</label>
              <Select value={adjustForm.type} onValueChange={v => setAdjustForm(f => ({ ...f, type: v }))}>
                <SelectTrigger data-testid="select-adjust-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount</label>
              <Input type="number" value={adjustForm.amount} onChange={e => setAdjustForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" data-testid="input-adjust-amount" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <Select value={adjustForm.category} onValueChange={v => setAdjustForm(f => ({ ...f, category: v }))}>
                <SelectTrigger data-testid="select-adjust-category"><SelectValue /></SelectTrigger>
                <SelectContent>{TRANSACTION_CATEGORIES.map(c => <SelectItem key={c} value={c}>{titleCase(c)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <Input value={adjustForm.description} onChange={e => setAdjustForm(f => ({ ...f, description: e.target.value }))} placeholder="Reason for adjustment" data-testid="input-adjust-description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(null)} data-testid="button-cancel-adjust">Cancel</Button>
            <Button onClick={() => adjustMut.mutate({ id: adjustOpen?.id, ...adjustForm })} disabled={!adjustForm.amount || adjustMut.isPending} data-testid="button-submit-adjust">
              {adjustMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}{adjustForm.type === "deposit" ? "Add Money" : "Remove Money"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isOwner ? "Transfer Between Wallets" : "Transfer Funds"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">From Wallet</label>
              <Select value={transferForm.fromWalletId} onValueChange={v => setTransferForm(f => ({ ...f, fromWalletId: v }))}>
                <SelectTrigger data-testid="select-transfer-from"><SelectValue placeholder="Select wallet" /></SelectTrigger>
                <SelectContent>{staffTransferFromWallets.filter((w: any) => w.id !== transferForm.toWalletId).map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name} ({formatCurrency(Number(w.balance || 0))})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">To Wallet</label>
              <Select value={transferForm.toWalletId} onValueChange={v => setTransferForm(f => ({ ...f, toWalletId: v }))}>
                <SelectTrigger data-testid="select-transfer-to"><SelectValue placeholder="Select wallet" /></SelectTrigger>
                <SelectContent>{staffTransferToWallets.filter((w: any) => w.id !== transferForm.fromWalletId).map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name}{w.scope === "company" ? " (Company)" : ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Amount</label>
                <Input type="number" value={transferForm.amount} onChange={e => setTransferForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" data-testid="input-transfer-amount" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Transfer Fee</label>
                <Input type="number" value={transferForm.transferFee} onChange={e => setTransferForm(f => ({ ...f, transferFee: e.target.value }))} placeholder="0.00" data-testid="input-transfer-fee" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Linked Order (Optional)</label>
              <Select value={transferForm.relatedOrderId || "none"} onValueChange={v => setTransferForm(f => ({ ...f, relatedOrderId: v === "none" ? "" : v }))}>
                <SelectTrigger data-testid="select-transfer-order"><SelectValue placeholder="No order linked" /></SelectTrigger>
                <SelectContent>
                  <div className="p-2"><Input placeholder="Search orders..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="h-8" data-testid="input-search-orders" /></div>
                  <SelectItem value="none">No Order Linked</SelectItem>
                  {filteredOrders.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.mgtOrderNumber ? `#${o.mgtOrderNumber}` : o.id} — {formatCurrency(Number(o.customerPrice || 0))}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <Input value={transferForm.description} onChange={e => setTransferForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" data-testid="input-transfer-description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOpen(false)} data-testid="button-cancel-transfer">Cancel</Button>
            <Button onClick={() => transferMut.mutate(transferForm)} disabled={!transferForm.fromWalletId || !transferForm.toWalletId || !transferForm.amount || transferMut.isPending} data-testid="button-submit-transfer">
              {transferMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Business Payout</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Role</label>
                <Select value={payoutForm.recipientRole || "none"} onValueChange={v => setPayoutForm(f => ({ ...f, recipientRole: v === "none" ? "" : v, recipientName: "", customRecipient: false }))}>
                  <SelectTrigger data-testid="select-payout-role-input"><SelectValue placeholder="Select Role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select Role</SelectItem>
                    {allRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Category</label>
                <Select value={payoutForm.category || "none"} onValueChange={v => setPayoutForm(f => ({ ...f, category: v === "none" ? "" : v }))}>
                  <SelectTrigger data-testid="select-payout-category-input"><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select Category</SelectItem>
                    {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Recipient</label>
              {!payoutForm.customRecipient && payoutRecipients.length > 0 ? (
                <Select value={payoutForm.recipientName || "none"} onValueChange={v => { if (v === "__custom__") { setPayoutForm(f => ({ ...f, recipientName: "", customRecipient: true })); } else { setPayoutForm(f => ({ ...f, recipientName: v === "none" ? "" : v })); } }}>
                  <SelectTrigger data-testid="select-payout-recipient"><SelectValue placeholder="Select Recipient" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select Recipient</SelectItem>
                    {payoutRecipients.map((r: any, i: number) => <SelectItem key={`${r.name}-${i}`} value={r.name}>{r.name}{r.discordId ? " (Discord)" : ""}</SelectItem>)}
                    <SelectItem value="__custom__">Enter Custom Name...</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2">
                  <Input value={payoutForm.recipientName} onChange={e => setPayoutForm(f => ({ ...f, recipientName: e.target.value }))} placeholder={payoutForm.recipientRole ? "Enter name" : "Select a role first"} data-testid="input-payout-recipient" className="flex-1" />
                  {payoutForm.customRecipient && payoutRecipients.length > 0 && (
                    <Button type="button" size="sm" variant="ghost" className="shrink-0 text-xs text-muted-foreground" onClick={() => setPayoutForm(f => ({ ...f, recipientName: "", customRecipient: false }))} data-testid="button-back-to-dropdown">List</Button>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount</label>
              <Input type="number" value={payoutForm.amount} onChange={e => setPayoutForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" data-testid="input-payout-amount" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={payoutForm.description} onChange={e => setPayoutForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this payout for?" data-testid="input-payout-description" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Wallet (Optional)</label>
                <Select value={payoutForm.walletId || "none"} onValueChange={v => setPayoutForm(f => ({ ...f, walletId: v === "none" ? "" : v }))}>
                  <SelectTrigger data-testid="select-payout-wallet-input"><SelectValue placeholder="Select Wallet" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {wallets.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Order (Optional)</label>
                <Select value={payoutForm.orderId || "none"} onValueChange={v => setPayoutForm(f => ({ ...f, orderId: v === "none" ? "" : v }))}>
                  <SelectTrigger data-testid="select-payout-order-input"><SelectValue placeholder="No Order" /></SelectTrigger>
                  <SelectContent>
                    <div className="p-2"><Input placeholder="Search orders..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="h-8" /></div>
                    <SelectItem value="none">No Order</SelectItem>
                    {filteredOrders.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.mgtOrderNumber ? `#${o.mgtOrderNumber}` : o.id}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Proof (Optional)</label>
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/*,.pdf" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { const url = await uploadProofFile(f); setPayoutForm(prev => ({ ...prev, proofUrl: url })); toast({ title: "Proof uploaded" }); } catch { toast({ title: "Upload failed", variant: "destructive" }); } } }} data-testid="input-payout-proof" />
                {uploadingProof && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
              {payoutForm.proofUrl && <p className="text-xs text-emerald-400">Uploaded</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutOpen(false)} data-testid="button-cancel-payout">Cancel</Button>
            <Button onClick={() => createPayoutMut.mutate(payoutForm)} disabled={!payoutForm.recipientName || !payoutForm.amount || !payoutForm.recipientRole || !payoutForm.category || createPayoutMut.isPending} data-testid="button-submit-payout">
              {createPayoutMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Create Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!markPaidOpen} onOpenChange={v => !v && setMarkPaidOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark Payout as Paid</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Paying <span className="text-foreground font-medium">{markPaidOpen?.recipientName}</span> — <span className="text-red-400 font-bold">{formatCurrency(Number(markPaidOpen?.amount || 0))}</span>
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Pay from Wallet</label>
              <Select value={markPaidWalletId} onValueChange={setMarkPaidWalletId}>
                <SelectTrigger data-testid="select-mark-paid-wallet"><SelectValue placeholder="Select wallet" /></SelectTrigger>
                <SelectContent>{companyWallets.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name} ({formatCurrency(Number(w.balance || 0))})</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidOpen(null)} data-testid="button-cancel-mark-paid">Cancel</Button>
            <Button onClick={() => markPaidMut.mutate({ id: markPaidOpen?.id, walletId: markPaidWalletId })} disabled={!markPaidWalletId || markPaidMut.isPending} data-testid="button-submit-mark-paid">
              {markPaidMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={linkOrderOpen} onOpenChange={setLinkOrderOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Link Order Payment to Wallet</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Order</label>
              <Select value={linkForm.orderId || "none"} onValueChange={v => { setLinkForm(f => ({ ...f, orderId: v === "none" ? "" : v })); const o = orders.find((o: any) => o.id === v); if (o?.customerPrice) setLinkForm(f => ({ ...f, amount: o.customerPrice })); }}>
                <SelectTrigger data-testid="select-link-order"><SelectValue placeholder="Select Order" /></SelectTrigger>
                <SelectContent>
                  <div className="p-2"><Input placeholder="Search orders..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="h-8" data-testid="input-search-link-orders" /></div>
                  <SelectItem value="none">Select Order</SelectItem>
                  {filteredOrders.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.mgtOrderNumber ? `#${o.mgtOrderNumber}` : o.id} — {o.serviceId} — {formatCurrency(Number(o.customerPrice || 0))}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Received By Wallet</label>
              <Select value={linkForm.receivedByWalletId || "none"} onValueChange={v => setLinkForm(f => ({ ...f, receivedByWalletId: v === "none" ? "" : v }))}>
                <SelectTrigger data-testid="select-link-wallet"><SelectValue placeholder="Which wallet received the payment?" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select Wallet</SelectItem>
                  {linkableWallets.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name} {w.scope === "personal" ? `(${w.ownerName || "Personal"})` : "(Company)"}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount</label>
              <Input type="number" value={linkForm.amount} onChange={e => setLinkForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" data-testid="input-link-amount" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Proof (Optional)</label>
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/*,.pdf" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { const url = await uploadProofFile(f); setLinkForm(prev => ({ ...prev, proofUrl: url })); toast({ title: "Proof uploaded" }); } catch { toast({ title: "Upload failed", variant: "destructive" }); } } }} data-testid="input-link-proof" />
                {uploadingProof && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
              {linkForm.proofUrl && <p className="text-xs text-emerald-400">Uploaded</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Input value={linkForm.notes} onChange={e => setLinkForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" data-testid="input-link-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkOrderOpen(false)} data-testid="button-cancel-link">Cancel</Button>
            <Button onClick={() => linkOrderMut.mutate(linkForm)} disabled={!linkForm.orderId || !linkForm.receivedByWalletId || !linkForm.amount || linkOrderMut.isPending} data-testid="button-submit-link">
              {linkOrderMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Link Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  );
}
