import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import {
  DollarSign,
  TrendingUp,
  Package,
  Banknote,
  Star,
  Copy,
  Check,
  Megaphone,
  ScrollText,
  Search,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard as copyText } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CreatorBadgeGrid } from "@/components/creator-badge-grid";
import { CREATOR_BADGE_COMPONENTS, type CreatorBadgeId } from "@/components/creator-achievement-badges";

const ACCENT_TEXT = "text-emerald-400";

function serviceTypeLabel(st?: string | null): string {
  if (!st) return "";
  const map: Record<string, string> = {
    rep_grinding: "Rep Grinding",
    badge_grinding: "Badge Grinding",
    boosting: "Boosting",
    account_builds: "Account Builds",
  };
  return map[st] || st.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type Dashboard = {
  creator: { code: string; displayName: string };
  commissionPercent: number;
  availableBalance: string;
  totalEarned: string;
  ordersWithCodeCount: number;
  totalOrdersCount: number;
  paidOut: string;
  recentOrders: Array<{ id: string; displayId?: string | null; customerPrice: string; commission?: string; serviceType?: string | null; completedAt?: string | null }>;
  payoutRequests: Array<{ id: string; amount: string; status: string; createdAt: string; paidAt?: string | null; proofUrl?: string | null }>;
  badges?: Array<{ badgeId: string; [key: string]: unknown }>;
};

function formatCurrency(s: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(s));
}

function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  gradient,
  iconBg,
  textColor,
  onClick,
  linkLabel,
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconBg: string;
  textColor: string;
  onClick?: () => void;
  linkLabel?: string;
}) {
  return (
    <Card
      className={`${gradient} border-0 overflow-hidden relative group sm:hover:scale-[1.02] transition-transform duration-300 ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      {...(onClick ? { role: "button", tabIndex: 0, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } } } : {})}
    >
      <div 
        className="absolute top-0 right-0 w-32 h-32 -translate-y-4 translate-x-4 rounded-full overflow-hidden [mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)] [mask-size:100%_100%] [mask-position:center]"
      >
        <div className={`absolute inset-0 rounded-full ${iconBg} flex items-center justify-center opacity-30`}>
          <Icon className={`w-16 h-16 ${textColor}`} />
        </div>
      </div>
      <CardContent className="p-4 relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5 min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-white">{label}</p>
            <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${textColor} tracking-tight truncate`}>{value}</p>
            <p className="text-[10px] text-white/40">{subtitle}</p>
          </div>
        </div>
        {linkLabel && onClick && (
          <div className={`mt-2 pt-2 border-t border-white/[0.06] flex items-center gap-1.5 text-[10px] font-medium ${textColor} opacity-70 group-hover:opacity-100 transition-opacity`}>
            {linkLabel}
            <ArrowUpRight className="w-3 h-3" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CreatorOverview() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const { data, isLoading, error } = useQuery<Dashboard>({ queryKey: ["/api/creator/dashboard"] });

  if (isLoading) {
    return (
      <AnimatedPage className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin w-10 h-10 border-2 border-white/20 border-t-white/60 rounded-full" />
      </AnimatedPage>
    );
  }

  if (error || !data) {
    return (
      <AnimatedPage>
        <Card className="border border-border bg-card/80">
          <CardContent className="p-8 text-center text-muted-foreground">Unable to load creator dashboard.</CardContent>
        </Card>
      </AnimatedPage>
    );
  }

  const {
    creator,
    commissionPercent,
    availableBalance,
    totalEarned,
    ordersWithCodeCount,
    totalOrdersCount,
    paidOut,
    recentOrders,
    payoutRequests,
    badges = [],
  } = data;
  const badgeIds = (badges ?? [])
    .map((b) => b.badgeId)
    .filter((id): id is CreatorBadgeId => typeof id === "string" && id in CREATOR_BADGE_COMPONENTS);
  const paidPayouts = payoutRequests.filter((p) => p.status === "paid");
  const pendingPayouts = payoutRequests.filter((p) => p.status !== "paid" && p.status !== "cancelled");

  const q = searchQuery.trim().toLowerCase();
  const filteredRecentOrders = q
    ? recentOrders.filter(
        (o) =>
          (o.displayId ?? "").toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          formatCurrency(o.customerPrice).toLowerCase().includes(q) ||
          serviceTypeLabel(o.serviceType).toLowerCase().includes(q)
      )
    : recentOrders;
  const filteredPayoutRequests = q
    ? payoutRequests.filter(
        (p) =>
          formatCurrency(p.amount).toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
      )
    : payoutRequests;

  const pipelineData = [
    { label: "Orders with code", count: ordersWithCodeCount, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", ring: "bg-emerald-500" },
    { label: "Pending payout", count: pendingPayouts.length, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", ring: "bg-amber-500" },
    { label: "Paid out", count: paidPayouts.length, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", ring: "bg-cyan-500" },
  ];
  const totalPipeline = ordersWithCodeCount + pendingPayouts.length + paidPayouts.length;

  return (
    <AnimatedPage className="space-y-6">
      {/* Hero / Command Center banner */}
      <FadeInUp>
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-green-950/30 p-5 sm:p-6">
          <div
            className="absolute top-0 right-0 w-64 h-64 -translate-y-12 translate-x-8 rounded-full overflow-hidden [mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)] [mask-size:100%_100%] [mask-position:center]"
          >
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 flex items-center justify-center opacity-30">
              <Star className="w-32 h-32 text-emerald-400" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <Avatar className="h-14 w-14 sm:h-20 sm:w-20 border-2 border-emerald-500/40 shadow-lg">
                {user?.profileImageUrl && (
                  <AvatarImage src={user.profileImageUrl} alt={creator.displayName} />
                )}
                <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-2xl font-bold">
                  {creator.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h1 className="text-xl sm:text-3xl font-bold font-display tracking-tight text-white">
                    {creator.displayName}
                  </h1>
                  <Badge className="gap-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    <Star className="w-3.5 h-3.5" />
                    Creator
                  </Badge>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">Live</span>
                  </div>
                </div>
                <p className="text-sm mt-1 font-medium text-emerald-400/80">
                  Service Plug Creator Program — {commissionPercent}% commission
                </p>
                <p className="text-xs text-white/60 mt-1">
                  Your code <strong className="font-mono text-white">{creator.code}</strong> — share at checkout to earn.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <Link
                    href="/creator/payouts"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20 transition-colors"
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    Payouts
                  </Link>
                  <Link
                    href="/creator/promote"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white/10 text-white/90 hover:bg-white/15 border border-white/10 transition-colors"
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                    Promote
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeInUp>

      {/* Creator Badges */}
      <FadeInUp>
        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-emerald-400" />
              Your Badges
            </CardTitle>
            <p className="text-xs text-muted-foreground">Earned and assigned creator badges. Tap or hover for details.</p>
          </CardHeader>
          <CardContent>
            <CreatorBadgeGrid badgeIds={badgeIds} testIdPrefix="creator" />
          </CardContent>
        </Card>
      </FadeInUp>

      {/* Search */}
      <FadeInUp>
        <div className="relative flex items-center gap-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your code, orders..."
            className="pl-10 pr-10 h-11 bg-white/[0.03] border-white/10 rounded-xl focus:border-emerald-500/50 transition-colors"
          />
          {searchQuery.trim() && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery("")}
            >
              Clear
            </Button>
          )}
        </div>
      </FadeInUp>

      {/* KPI Stat cards */}
      <FadeInUp>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Available Balance"
            value={formatCurrency(availableBalance)}
            subtitle={Number(availableBalance) > 0 ? "Ready to request" : "Earn from orders with your code"}
            icon={DollarSign}
            gradient="bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent"
            iconBg="bg-emerald-500/20"
            textColor="text-emerald-400"
            onClick={() => navigate("/creator/payouts")}
            linkLabel="Request payout"
          />
          <StatCard
            label="Total Earned"
            value={formatCurrency(totalEarned)}
            subtitle="From completed orders"
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent"
            iconBg="bg-blue-500/20"
            textColor="text-blue-400"
            onClick={() => navigate("/creator/payouts")}
            linkLabel="View earnings"
          />
          <StatCard
            label="Orders with Code"
            value={String(ordersWithCodeCount)}
            subtitle={`Of ${totalOrdersCount} total`}
            icon={Package}
            gradient="bg-gradient-to-br from-purple-500/15 via-purple-500/5 to-transparent"
            iconBg="bg-purple-500/20"
            textColor="text-purple-400"
            onClick={() => navigate("/creator/payouts")}
            linkLabel="Payouts"
          />
          <StatCard
            label="Paid Out"
            value={formatCurrency(paidOut)}
            subtitle={paidPayouts.length === 0 ? "All caught up" : `${paidPayouts.length} payout(s)`}
            icon={Banknote}
            gradient="bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent"
            iconBg="bg-amber-500/20"
            textColor="text-amber-400"
            onClick={() => navigate("/creator/payouts")}
            linkLabel="Payout history"
          />
        </div>
      </FadeInUp>

      {/* Quick actions */}
      <FadeInUp>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/creator/promote" className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-900/5 border border-emerald-500/15 hover:border-emerald-500/30 transition-all group">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Megaphone className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Promote</p>
              <p className="text-[10px] text-muted-foreground">Share your code</p>
            </div>
          </Link>
          <Link href="/creator/payouts" className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-900/5 border border-blue-500/15 hover:border-blue-500/30 transition-all group">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Banknote className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Payouts</p>
              <p className="text-[10px] text-muted-foreground">Balance & history</p>
            </div>
          </Link>
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-900/5 border border-purple-500/15">
            <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <Copy className="w-4 h-4 text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">Your Code</p>
              <p className="text-[10px] text-muted-foreground font-mono truncate">{creator.code}</p>
            </div>
          </div>
          <Link href="/creator/rules" className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-900/5 border border-amber-500/15 hover:border-amber-500/30 transition-all group">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ScrollText className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Rules & Policy</p>
              <p className="text-[10px] text-muted-foreground">Guidelines</p>
            </div>
          </Link>
        </div>
      </FadeInUp>

      {/* Earnings pipeline */}
      <FadeInUp>
        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Earnings Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="w-full rounded-full bg-white/5 overflow-hidden flex h-2">
              {pipelineData.map((p, i) => (
                <div key={p.label} className={`${p.ring} transition-all duration-700`} style={{ width: totalPipeline > 0 ? `${(p.count / Math.max(totalPipeline, 1)) * 100}%` : "0%" }} title={p.label} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {pipelineData.map((p) => (
                <div key={p.label} className={`flex flex-col items-center p-3 rounded-xl border ${p.border} ${p.bg}`}>
                  <span className={`text-2xl font-bold ${p.color}`}>{p.count}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5 text-center">{p.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </FadeInUp>

      {/* Recent orders + Payout requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FadeInUp>
          <Card className="border-white/[0.06] bg-white/[0.02] h-full flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 flex-1">
              {filteredRecentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {q ? "No orders match your search." : "No completed orders linked to your code yet."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {filteredRecentOrders.map((o) => (
                    <li key={o.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.04] border border-white/10" data-testid={`order-row-${o.id}`}>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-mono text-white/90">{o.displayId || o.id}</span>
                        <div className="flex items-center gap-2">
                          {o.serviceType && (
                            <span className="text-xs text-white/40">{serviceTypeLabel(o.serviceType)}</span>
                          )}
                          {o.completedAt && (
                            <span className="text-xs text-white/30">{new Date(o.completedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className={`text-sm font-medium ${ACCENT_TEXT}`}>{formatCurrency(o.commission || "0")}</span>
                        <span className="text-xs text-white/30">of {formatCurrency(o.customerPrice)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/creator/payouts" className={`text-xs font-medium inline-block hover:underline text-emerald-400`}>
                View all earnings →
              </Link>
            </CardContent>
          </Card>
        </FadeInUp>

        <FadeInUp>
          <Card className="border-white/[0.06] bg-white/[0.02] h-full flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                Payout Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 flex-1">
              {filteredPayoutRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {q ? "No payout requests match your search." : "No payout requests yet."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {filteredPayoutRequests.slice(0, 5).map((p) => (
                    <li key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.04] border border-white/10">
                      <span className="text-sm font-medium text-white/90">{formatCurrency(p.amount)}</span>
                      <span className="text-xs capitalize text-white/50">{p.status}</span>
                    </li>
                  ))}
                </ul>
              )}
              {Number(availableBalance) > 0 && (
                <Link href="/creator/payouts" className="inline-flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium mt-2 border border-emerald-500/30 bg-emerald-500/15 hover:bg-emerald-500/25 text-white transition-colors">
                  Request payout →
                </Link>
              )}
            </CardContent>
          </Card>
        </FadeInUp>
      </div>

      {/* Your Code - full width */}
      <FadeInUp>
        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Copy className="w-5 h-5 text-emerald-400" />
              Your Code
            </CardTitle>
            <p className="text-xs text-muted-foreground">Share at checkout for commission.</p>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <code className="text-lg sm:text-xl font-bold font-mono text-white bg-white/5 px-3 py-2 rounded-lg border border-white/10 break-all flex-1">
              {creator.code}
            </code>
            <Button
              size="sm"
              variant="outline"
              className={
                codeCopied
                  ? "shrink-0 bg-white text-black border-white hover:bg-white hover:text-black"
                  : "shrink-0 !border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
              }
              onClick={() => {
                copyText(creator.code).then((ok) => {
                  if (ok) {
                    setCodeCopied(true);
                    window.setTimeout(() => setCodeCopied(false), 2500);
                  } else {
                    toast({ title: "Copy failed", description: "Try again or copy manually", variant: "destructive" });
                  }
                });
              }}
            >
              {codeCopied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Code Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </FadeInUp>
    </AnimatedPage>
  );
}
