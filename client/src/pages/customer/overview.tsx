import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import {
  DollarSign, Package, Gem, UserCircle, Loader2, ArrowUpRight,
} from "lucide-react";
import { Link } from "wouter";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { VIP_TIERS } from "@shared/customer-vip";

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
  borderAccent,
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconBg: string;
  textColor: string;
  borderAccent?: string;
}) {
  return (
    <Card className={`${gradient} border-0 overflow-hidden relative sm:hover:scale-[1.02] transition-transform duration-300 border ${borderAccent || BORDER}`}>
      <div className="absolute top-0 right-0 w-32 h-32 -translate-y-4 translate-x-4 rounded-full overflow-hidden [mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)]">
        <div className={`absolute inset-0 rounded-full ${iconBg} flex items-center justify-center opacity-30`}>
          <Icon className={`w-16 h-16 ${textColor}`} />
        </div>
      </div>
      <CardContent className="p-4 relative z-10">
        <p className="text-[10px] font-medium uppercase tracking-wider text-white/80">{label}</p>
        <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${textColor} tracking-tight truncate`}>{value}</p>
        <p className="text-[10px] text-white/40">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

type DashboardData = {
  lifetimeSpend: number;
  orderCount: number;
  vipTier: string;
  vipTierLabel: string;
  vipDiscountPct: number;
  perks: string;
  recentOrders: Array<{
    id: string;
    mgtOrderNumber?: number | null;
    displayId?: string | null;
    customerPrice: string;
    status?: string;
    completedAt?: string | null;
    serviceId?: string | null;
  }>;
};

export default function CustomerOverview() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/customer/dashboard"],
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
      </div>
    );
  }

  if (error || !data) {
    const isDev = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname.endsWith(".replit.dev"));
    return (
      <AnimatedPage>
        <Card className="border border-border bg-card/80">
          <CardContent className="p-8 text-center text-muted-foreground space-y-2">
            <p>Unable to load your customer dashboard.</p>
            {isDev && error && (
              <p className="text-xs text-destructive/80 font-mono break-all">
                {error instanceof Error ? error.message : String(error)}
              </p>
            )}
          </CardContent>
        </Card>
      </AnimatedPage>
    );
  }

  const { lifetimeSpend, orderCount, vipTier, vipTierLabel, vipDiscountPct, perks, recentOrders } = data;
  const tierIdx = VIP_TIERS.findIndex((t) => t.id === vipTier);
  const nextTier = tierIdx >= 0 && tierIdx < VIP_TIERS.length - 1 ? VIP_TIERS[tierIdx + 1] : null;
  const currentTierData = VIP_TIERS.find((t) => t.id === vipTier);
  const spendToNext = nextTier ? Math.max(0, nextTier.threshold - lifetimeSpend) : 0;

  return (
    <AnimatedPage className="space-y-6">
      <FadeInUp>
        <div className="relative overflow-hidden rounded-2xl border border-pink-500/20 bg-gradient-to-r from-pink-950/40 via-purple-900/20 to-purple-950/30 p-5 sm:p-6">
          <div
            className="absolute top-0 right-0 w-64 h-64 -translate-y-12 translate-x-8 rounded-full overflow-hidden [mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)] [mask-size:100%_100%] [mask-position:center]"
          >
            <div className="absolute inset-0 rounded-full bg-pink-500/20 flex items-center justify-center opacity-30">
              <UserCircle className="w-32 h-32 text-pink-400" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <Avatar className="h-14 w-14 sm:h-20 sm:w-20 border-2 border-pink-500/40 shadow-lg shrink-0">
                <AvatarImage src={user?.profileImageUrl} />
                <AvatarFallback className="bg-pink-500/20 text-pink-400 text-2xl font-bold">
                  {user?.firstName?.charAt(0)?.toUpperCase() || user?.discordUsername?.charAt(0)?.toUpperCase() || "C"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h1 className="text-xl sm:text-3xl font-bold font-display tracking-tight text-white">
                    {(user as any)?.id === "dev-user-customer" ? "DemoCustomer" : user?.firstName || user?.discordUsername || "Customer"}
                  </h1>
                  <Badge className="gap-1 bg-pink-500/20 text-pink-400 border-pink-500/30">
                    <UserCircle className="w-3.5 h-3.5" />
                    Customer
                  </Badge>
                  <Badge
                    className={`${
                      currentTierData?.id === "platinum" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                      currentTierData?.id === "gold" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                      currentTierData?.id === "silver" ? "bg-slate-500/20 text-slate-300 border-slate-500/30" :
                      currentTierData?.id === "bronze" ? "bg-amber-700/20 text-amber-600 border-amber-700/30" :
                      "bg-white/10 text-white/70 border-white/20"
                    }`}
                  >
                    {currentTierData?.emoji} {vipTierLabel}
                    {vipDiscountPct > 0 && ` · ${vipDiscountPct}% off`}
                  </Badge>
                </div>
                <p className="text-sm mt-1 font-medium text-pink-400/80">
                  Your personalized customer profile
                </p>
                <p className="text-xs text-white/60 mt-1">
                  Lifetime spend: {formatCurrency(lifetimeSpend)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <Link
                    href="/customer/orders"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-pink-500/15 text-pink-400 hover:bg-pink-500/25 border border-pink-500/20 transition-colors"
                  >
                    <Package className="w-3.5 h-3.5" />
                    My Orders
                  </Link>
                  <Link
                    href="/customer/vip-perks"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white/10 text-white/90 hover:bg-white/15 border border-white/10 transition-colors"
                  >
                    <Gem className="w-3.5 h-3.5" />
                    VIP Perks
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Lifetime Spend"
            value={formatCurrency(lifetimeSpend)}
            subtitle="Total from completed orders"
            icon={DollarSign}
            gradient="bg-gradient-to-br from-pink-500/15 via-pink-500/5 to-transparent"
            iconBg="bg-pink-500/20"
            textColor={ACCENT_PINK}
            borderAccent="border-pink-500/25"
          />
          <StatCard
            label="Orders Completed"
            value={String(orderCount)}
            subtitle="Completed or paid out"
            icon={Package}
            gradient="bg-gradient-to-br from-purple-500/15 via-purple-500/5 to-transparent"
            iconBg="bg-purple-500/20"
            textColor={ACCENT_PURPLE}
            borderAccent="border-purple-500/25"
          />
          <StatCard
            label="VIP Tier"
            value={vipTierLabel}
            subtitle={vipDiscountPct > 0 ? `${vipDiscountPct}% discount` : "Member"}
            icon={Gem}
            gradient="bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-transparent"
            iconBg="bg-purple-500/20"
            textColor={ACCENT_PURPLE}
            borderAccent="border-purple-500/25"
          />
          <StatCard
            label={nextTier ? `To ${nextTier.label}` : "Top Tier"}
            value={nextTier ? formatCurrency(spendToNext) : "—"}
            subtitle={nextTier ? `${formatCurrency(nextTier.threshold)} threshold` : "You've reached the top"}
            icon={ArrowUpRight}
            gradient="bg-gradient-to-br from-purple-500/15 via-pink-500/5 to-transparent"
            iconBg="bg-pink-500/20"
            textColor={ACCENT_PINK}
            borderAccent="border-pink-500/25"
          />
        </div>
      </FadeInUp>

      <FadeInUp>
        <Card className={`border-0 overflow-hidden relative ${GRADIENT} border ${BORDER} shadow-xl shadow-pink-500/5`}>
          <div className="absolute top-0 right-0 w-48 h-48 -translate-y-12 translate-x-12 rounded-full bg-gradient-to-br from-pink-500/10 to-purple-500/10 [mask-image:linear-gradient(to_bottom,transparent,black_70%)]" />
          <CardHeader className="relative pb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center border border-pink-500/30 shadow-inner">
                <Gem className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-white tracking-tight">
                  Your VIP Perks
                </CardTitle>
                <p className="text-sm text-pink-400/90 mt-0.5 font-medium">
                  {currentTierData?.emoji} {vipTierLabel}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed max-w-2xl">
              {perks}
            </p>
          </CardHeader>
          <CardContent className="relative space-y-3 pt-2">
            {VIP_TIERS.map((t) => {
              const isCurrent = t.id === vipTier;
              const isUnlocked = (VIP_TIERS.findIndex((x) => x.id === t.id)) <= tierIdx;
              const tierStyles = isCurrent
                ? "border-pink-500/50 bg-gradient-to-br from-pink-500/15 to-purple-500/10 shadow-lg shadow-pink-500/10 ring-1 ring-pink-500/30"
                : isUnlocked
                ? "border-white/15 bg-white/[0.04] hover:bg-white/[0.06]"
                : "border-white/[0.08] bg-white/[0.02] opacity-70";
              const progressToNext = isCurrent && nextTier
                ? Math.min(100, Math.max(0, ((lifetimeSpend - t.threshold) / (nextTier.threshold - t.threshold)) * 100))
                : null;
              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-xl border transition-all duration-200 ${tierStyles}`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-2xl shrink-0 leading-none">{t.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white">{t.label}</p>
                        {isCurrent && (
                          <Badge className="text-[10px] border-pink-500/40 bg-pink-500/20 text-pink-400">
                            Current tier
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {t.threshold === 0 ? "Free+" : formatCurrency(t.threshold) + "+"} · {t.discountPct}% off
                        </span>
                      </div>
                      <p className="text-sm text-white/70 mt-1.5 leading-relaxed">
                        {t.perks}
                      </p>
                      {progressToNext !== null && (
                        <div className="mt-3 space-y-1.5">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progress to {nextTier?.emoji} {nextTier?.label}</span>
                            <span className="text-pink-400 font-medium">{Math.round(progressToNext)}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500 ease-out"
                              style={{ width: `${progressToNext}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {formatCurrency(lifetimeSpend)} of {formatCurrency(nextTier?.threshold ?? 0)} spent
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </FadeInUp>

      <FadeInUp>
        <Card className={`border-0 overflow-hidden ${GRADIENT} border ${BORDER}`}>
          <CardHeader>
            <CardTitle className="text-pink-400">Recent Orders</CardTitle>
            <p className="text-xs text-muted-foreground">Your completed orders</p>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No completed orders yet</p>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {recentOrders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/customer/orders/${o.id}`}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                  >
                    <div>
                      <p className="font-medium">Order #{o.mgtOrderNumber ?? o.displayId ?? o.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.completedAt ? new Date(o.completedAt).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <p className="font-semibold text-pink-400">{formatCurrency(Number(o.customerPrice) || 0)}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeInUp>
    </AnimatedPage>
  );
}
