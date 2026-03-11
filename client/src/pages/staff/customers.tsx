import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import {
  Loader2, DollarSign, Users, Search, ArrowUpRight, Gem, Crown,
  TrendingUp, Package, Sparkles, UserCircle,
} from "lucide-react";
import { VIP_TIERS, getVipTierForSpend } from "@shared/customer-vip";

const ACCENT_PINK = "text-pink-400";
const ACCENT_PURPLE = "text-purple-400";
const GRADIENT = "bg-gradient-to-br from-pink-500/15 via-purple-500/10 to-transparent";
const BORDER = "border-pink-500/20 border-purple-500/20";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
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
      className={`${gradient} border-0 overflow-hidden relative group sm:hover:scale-[1.02] transition-transform duration-300 ${onClick ? "cursor-pointer" : ""} border ${BORDER}`}
      onClick={onClick}
      {...(onClick ? { role: "button", tabIndex: 0, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } } } : {})}
    >
      <div className="absolute top-0 right-0 w-32 h-32 -translate-y-4 translate-x-4 rounded-full overflow-hidden [mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)]">
        <div className={`absolute inset-0 rounded-full ${iconBg} flex items-center justify-center opacity-30`}>
          <Icon className={`w-16 h-16 ${textColor}`} />
        </div>
      </div>
      <CardContent className="p-4 relative z-10">
        <p className="text-[10px] font-medium uppercase tracking-wider text-white/80">{label}</p>
        <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${textColor} tracking-tight truncate`}>{value}</p>
        <p className="text-[10px] text-white/40">{subtitle}</p>
        {linkLabel && onClick && (
          <div className={`mt-2 pt-2 border-t border-white/[0.06] flex items-center gap-1.5 text-[10px] font-medium ${textColor} opacity-70 group-hover:opacity-100`}>
            {linkLabel}
            <ArrowUpRight className="w-3 h-3" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function StaffCustomers() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const { data, isLoading, error } = useQuery<{
    customers: Array<{
      discordId: string;
      displayName: string;
      username?: string;
      lifetimeSpend: number;
      orderCount: number;
      vipTier: string;
      vipTierLabel: string;
      vipDiscountPct: number;
    }>;
    totalCustomers: number;
    byTier: Record<string, number>;
    totalLifetimeRevenue: number;
  }>({ queryKey: ["/api/staff/customers"], refetchInterval: 30000 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
      </div>
    );
  }

  const customers = data?.customers ?? [];
  const totalLifetimeRevenue = data?.totalLifetimeRevenue ?? 0;
  const byTier = data?.byTier ?? { member: 0, bronze: 0, silver: 0, gold: 0, platinum: 0 };

  const filtered = searchQuery.trim()
    ? customers.filter((c) =>
        c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.discordId.includes(searchQuery)
      )
    : customers;

  const platinum = byTier.platinum || 0;
  const gold = byTier.gold || 0;
  const silver = byTier.silver || 0;
  const bronze = byTier.bronze || 0;
  const member = byTier.member || 0;
  const vipCount = platinum + gold + silver + bronze;

  return (
    <AnimatedPage className="space-y-6">
      <FadeInUp>
        <div className={`relative overflow-hidden rounded-2xl border ${BORDER} p-5 sm:p-6 ${GRADIENT}`}>
          <div className="absolute top-0 right-0 w-64 h-64 -translate-y-12 translate-x-8 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 [mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)]" />
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center border border-pink-500/30">
                <UserCircle className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold font-display tracking-tight text-white">
                  Customers
                </h1>
                <p className="text-sm text-white/60 mt-0.5">
                  Customer VIP tiers & lifetime spend
                </p>
              </div>
            </div>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Total Customers"
            value={String(customers.length)}
            subtitle="With completed orders"
            icon={Users}
            gradient="bg-gradient-to-br from-pink-500/15 via-pink-500/5 to-transparent"
            iconBg="bg-pink-500/20"
            textColor={ACCENT_PINK}
          />
          <StatCard
            label="Lifetime Revenue"
            value={formatCurrency(totalLifetimeRevenue)}
            subtitle="From customers"
            icon={DollarSign}
            gradient="bg-gradient-to-br from-purple-500/15 via-purple-500/5 to-transparent"
            iconBg="bg-purple-500/20"
            textColor={ACCENT_PURPLE}
          />
          <StatCard
            label="VIP Customers"
            value={String(vipCount)}
            subtitle="Bronze and above"
            icon={Gem}
            gradient="bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-transparent"
            iconBg="bg-purple-500/20"
            textColor={ACCENT_PURPLE}
          />
          <StatCard
            label="Top Tier"
            value={platinum > 0 ? `${platinum} Platinum` : gold > 0 ? `${gold} Gold` : silver > 0 ? `${silver} Silver` : bronze > 0 ? `${bronze} Bronze` : "—"}
            subtitle="Highest VIP tier"
            icon={Crown}
            gradient="bg-gradient-to-br from-purple-500/15 via-pink-500/5 to-transparent"
            iconBg="bg-pink-500/20"
            textColor={ACCENT_PINK}
          />
        </div>
      </FadeInUp>

      <FadeInUp>
        <Card className={`border-0 overflow-hidden ${GRADIENT} border ${BORDER}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pink-400">
              <Gem className="w-5 h-5" />
              VIP Tier Perks
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Unlock exclusive benefits by spending more with us! VIP tiers are based on gross lifetime spend (before discounts).
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {VIP_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`p-4 rounded-xl border ${
                  tier.id === "platinum" ? "border-purple-500/30 bg-purple-500/10" :
                  tier.id === "gold" ? "border-amber-500/20 bg-amber-500/5" :
                  tier.id === "silver" ? "border-slate-400/20 bg-slate-500/5" :
                  tier.id === "bronze" ? "border-amber-700/20 bg-amber-900/10" :
                  "border-white/10 bg-white/[0.02]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white flex items-center gap-2">
                      <span>{tier.emoji}</span>
                      {tier.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      💰 Threshold: {tier.threshold === 0 ? "Free+" : formatCurrency(tier.threshold) + "+"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      🎁 Discount: {tier.discountPct}% OFF
                    </p>
                    <p className="text-xs text-white/70 mt-1">
                      📋 {tier.perks}
                    </p>
                  </div>
                  {tier.id !== "member" && (
                    <Badge variant="outline" className="shrink-0 border-pink-500/30 text-pink-400">
                      {(byTier as Record<string, number>)[tier.id] ?? 0} customers
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </FadeInUp>

      <FadeInUp>
        <Card className={`border-0 overflow-hidden ${GRADIENT} border ${BORDER}`}>
          <CardHeader>
            <CardTitle className="text-pink-400">Customer List</CardTitle>
            <p className="text-xs text-muted-foreground">Customers with completed or paid-out orders. VIP tier computed from lifetime spend.</p>
            <div className="relative pt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground mt-1" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or Discord ID..."
                className="pl-9 bg-white/[0.04] border-white/10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No customers found</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filtered.map((c) => {
                  const tier = getVipTierForSpend(c.lifetimeSpend);
                  return (
                    <div
                      key={c.discordId}
                      className="flex items-center justify-between gap-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={undefined} />
                          <AvatarFallback className="bg-pink-500/20 text-pink-400 text-sm">
                            {c.displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{c.displayName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {c.orderCount} order{c.orderCount !== 1 ? "s" : ""} · {formatCurrency(c.lifetimeSpend)} lifetime
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={`shrink-0 ${
                          tier.id === "platinum" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                          tier.id === "gold" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                          tier.id === "silver" ? "bg-slate-500/20 text-slate-300 border-slate-500/30" :
                          tier.id === "bronze" ? "bg-amber-700/20 text-amber-600 border-amber-700/30" :
                          "bg-white/10 text-white/70 border-white/20"
                        }`}
                      >
                        {tier.emoji} {tier.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeInUp>
    </AnimatedPage>
  );
}
