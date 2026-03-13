import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowUpRight,
  DollarSign,
  Gem,
  Loader2,
  Package,
  Sparkles,
  UserCircle,
} from "lucide-react";
import { Link } from "wouter";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { VIP_TIERS } from "@shared/customer-vip";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

const PANEL =
  "relative overflow-hidden rounded-[28px] border border-black/45 bg-[linear-gradient(180deg,rgba(236,72,153,0.08),rgba(255,255,255,0.02)),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] shadow-[0_18px_60px_rgba(0,0,0,0.34)]";
const HAIRLINE = "border-black/45";

function PrimeStat({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className={`${PANEL} min-h-[138px] sm:min-h-[154px]`}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-300/20 to-transparent" />
      <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-pink-500/26 via-fuchsia-500/14 to-transparent opacity-100" />
      <div className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-pink-500/24 bg-pink-500/14 sm:right-4 sm:top-4 sm:h-12 sm:w-12">
        <Icon className="h-4 w-4 text-pink-300/85 sm:h-5 sm:w-5" />
      </div>
      <div className="relative z-10 flex h-full flex-col justify-between p-4 sm:p-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
            {label}
          </p>
          <p className="mt-3 text-[1.9rem] font-semibold tracking-tight text-white sm:mt-4 sm:text-4xl">
            {value}
          </p>
        </div>
        <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-white/40 sm:mt-5">
          {detail}
        </p>
      </div>
    </div>
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
        <div className={`${PANEL} p-8 text-center text-muted-foreground space-y-2`}>
            <p>Unable to load your customer dashboard.</p>
            {isDev && error && (
              <p className="text-xs text-destructive/80 font-mono break-all">
                {error instanceof Error ? error.message : String(error)}
              </p>
            )}
        </div>
      </AnimatedPage>
    );
  }

  const { lifetimeSpend, orderCount, vipTier, vipTierLabel, vipDiscountPct, perks, recentOrders } = data;
  const tierIdx = VIP_TIERS.findIndex((t) => t.id === vipTier);
  const nextTier = tierIdx >= 0 && tierIdx < VIP_TIERS.length - 1 ? VIP_TIERS[tierIdx + 1] : null;
  const currentTierData = VIP_TIERS.find((t) => t.id === vipTier);
  const spendToNext = nextTier ? Math.max(0, nextTier.threshold - lifetimeSpend) : 0;

  return (
    <AnimatedPage className="space-y-5 pb-6 sm:space-y-6 sm:pb-8">
      <FadeInUp>
        <section className={`${PANEL} p-4 sm:p-7 lg:p-8`}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-300/28 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-[26%] bg-gradient-to-l from-pink-500/18 via-fuchsia-500/9 to-transparent sm:block" />

          <div className="relative z-10 grid gap-5 sm:gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-pink-400/85">
                Customer Dossier
              </p>
              <div className="mt-4 flex flex-col gap-4 sm:mt-5 sm:flex-row sm:items-start sm:gap-5">
                <Avatar className="h-16 w-16 border border-black/45 bg-white/5 shadow-lg sm:h-20 sm:w-20">
                  <AvatarImage src={user?.profileImageUrl} />
                  <AvatarFallback className="bg-white/10 text-xl font-semibold text-white sm:text-2xl">
                    {user?.firstName?.charAt(0)?.toUpperCase() || user?.discordUsername?.charAt(0)?.toUpperCase() || "C"}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-[2rem] font-semibold leading-none tracking-[-0.03em] text-white sm:text-5xl">
                      {(user as any)?.id === "dev-user-customer" ? "DemoCustomer" : user?.firstName || user?.discordUsername || "Customer"}
                    </h1>
                    <Badge className="rounded-full border border-black/45 bg-pink-500/[0.08] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-pink-100">
                      Customer
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full border border-pink-500/20 bg-pink-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-pink-300">
                      {currentTierData?.emoji} {vipTierLabel}
                      {vipDiscountPct > 0 ? ` · ${vipDiscountPct}% Off` : ""}
                    </Badge>
                    <span className="text-xs uppercase tracking-[0.18em] text-white/40">
                      Lifetime Spend {formatCurrency(lifetimeSpend)}
                    </span>
                  </div>

                  <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 sm:mt-5 sm:text-[15px] sm:leading-7">
                    A cleaner look at your account, VIP standing, and completed work. Designed to feel more editorial:
                    spacious, focused, and easy to scan.
                  </p>

                  <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:flex-wrap sm:gap-3">
                    <Link
                      href="/customer/orders"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/60 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-black transition-colors hover:bg-white/90 sm:w-auto"
                    >
                      <Package className="h-3.5 w-3.5" />
                      My Orders
                    </Link>
                    <Link
                      href="/customer/vip-perks"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-pink-400/35 bg-pink-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-pink-400 sm:w-auto"
                    >
                      <Gem className="h-3.5 w-3.5" />
                      VIP Perks
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] border border-black/45 bg-pink-500/[0.11] p-4 sm:p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                  Membership
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  {vipTierLabel}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  {vipDiscountPct > 0 ? `${vipDiscountPct}% discount on qualifying work.` : "Base member tier active."}
                </p>
              </div>

              <div className="rounded-[24px] border border-black/45 bg-pink-500/[0.09] p-4 sm:p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                  Next Milestone
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  {nextTier ? formatCurrency(spendToNext) : "Reached"}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  {nextTier
                    ? `${nextTier.emoji} ${nextTier.label} unlocks at ${formatCurrency(nextTier.threshold)}.`
                    : "You are currently at the highest VIP tier."}
                </p>
              </div>
            </div>
          </div>
        </section>
      </FadeInUp>

      <FadeInUp>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
          <PrimeStat
            label="Lifetime Spend"
            value={formatCurrency(lifetimeSpend)}
            detail="Completed orders"
            icon={DollarSign}
          />
          <PrimeStat
            label="Orders Completed"
            value={String(orderCount)}
            detail="Completed or paid out"
            icon={Package}
          />
          <PrimeStat
            label="VIP Tier"
            value={vipTierLabel}
            detail={vipDiscountPct > 0 ? `${vipDiscountPct}% discount` : "Active member"}
            icon={Gem}
          />
          <PrimeStat
            label={nextTier ? `To ${nextTier.label}` : "Top Tier"}
            value={nextTier ? formatCurrency(spendToNext) : "—"}
            detail={nextTier ? `${formatCurrency(nextTier.threshold)} threshold` : "Top tier reached"}
            icon={ArrowUpRight}
          />
        </div>
      </FadeInUp>

      <FadeInUp>
        <section className={`${PANEL} p-4 sm:p-7`}>
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-pink-500/20 via-fuchsia-500/10 to-transparent md:block" />
          <div className="relative z-10 grid gap-5 sm:gap-6 lg:grid-cols-[0.9fr_minmax(0,1.1fr)]">
            <div className="space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/45 bg-pink-500/10">
                <Sparkles className="h-5 w-5 text-pink-300" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">
                  Membership Program
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                  VIP Perks
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/65">
                  Your current tier determines discounts and unlocks. The system is shown as a clean ladder so you can see
                  exactly where you stand and what comes next.
                </p>
                <div className="mt-5 inline-flex rounded-full border border-pink-500/20 bg-pink-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-pink-300">
                  {currentTierData?.emoji} {vipTierLabel}
                </div>
              </div>
              <div className={`rounded-[24px] border border-black/45 bg-pink-500/[0.09] p-4 sm:p-5`}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                  Active Perks
                </p>
                <p className="mt-4 text-sm leading-7 text-white/72">
                  {perks}
                </p>
                {nextTier && (
                  <div className="mt-5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
                      <span>Progress To {nextTier.label}</span>
                      <span className="text-pink-300">
                        {Math.round(
                          Math.min(
                            100,
                            Math.max(0, ((lifetimeSpend - (currentTierData?.threshold ?? 0)) / (nextTier.threshold - (currentTierData?.threshold ?? 0))) * 100),
                          ),
                        )}
                        %
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-pink-400 via-fuchsia-400 to-white"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, ((lifetimeSpend - (currentTierData?.threshold ?? 0)) / (nextTier.threshold - (currentTierData?.threshold ?? 0))) * 100),
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {VIP_TIERS.map((t, index) => {
                const isCurrent = t.id === vipTier;
                const isUnlocked = index <= tierIdx;
                return (
                  <div
                    key={t.id}
                    className={`rounded-[22px] border p-4 transition-colors ${
                      isCurrent
                        ? "border-pink-400/30 bg-pink-500/[0.14]"
                        : isUnlocked
                        ? "border-black/45 bg-pink-500/[0.06]"
                          : "border-black/45 bg-white/[0.015]"
                    }`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-pink-500/15 bg-pink-500/8 text-xl sm:h-12 sm:w-12 sm:text-2xl">
                        {t.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-white">{t.label}</p>
                          {isCurrent && (
                            <Badge className="rounded-full border border-pink-400/25 bg-pink-500/10 text-[10px] uppercase tracking-[0.18em] text-pink-300">
                              Current
                            </Badge>
                          )}
                          <span className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                            {t.threshold === 0 ? "Free+" : `${formatCurrency(t.threshold)}+`} · {t.discountPct}% off
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-white/68">{t.perks}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </FadeInUp>

      <FadeInUp>
        <section className={`${PANEL} p-4 sm:p-7`}>
          <div className="flex flex-col gap-2 border-b border-black/45 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">
                Recent Activity
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
                Recent Orders
              </h2>
              <p className="mt-1 text-sm text-white/55">
                A concise view of your latest completed work.
              </p>
            </div>
            <Link
              href="/customer/orders"
              className="inline-flex w-full items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-pink-300 transition-colors hover:text-white sm:w-auto sm:justify-start"
            >
              View All Orders
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="pt-5">
            {recentOrders.length === 0 ? (
              <div className="rounded-[22px] border border-black/45 bg-white/[0.02] p-10 text-center text-white/45">
                No completed orders yet
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-0 sm:pr-1">
                {recentOrders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/customer/orders/${o.id}`}
                    className="group grid grid-cols-1 gap-3 rounded-[22px] border border-black/45 bg-pink-500/[0.045] p-4 transition-colors hover:bg-pink-500/[0.08] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-white">
                          Order #{o.mgtOrderNumber ?? o.displayId ?? o.id}
                        </p>
                        <Badge className="rounded-full border border-black/45 bg-pink-500/[0.08] text-[10px] uppercase tracking-[0.18em] text-pink-100/80">
                          {o.status || "Completed"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/38">
                        {o.completedAt ? new Date(o.completedAt).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-semibold text-white">
                        {formatCurrency(Number(o.customerPrice) || 0)}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-pink-300 transition-transform group-hover:translate-x-0.5">
                        Open
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </FadeInUp>
    </AnimatedPage>
  );
}
