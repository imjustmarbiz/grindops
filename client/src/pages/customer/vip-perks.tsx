import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Gem, Loader2, Sparkles } from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { VIP_TIERS } from "@shared/customer-vip";

const PANEL =
  "relative overflow-hidden rounded-[28px] border border-black/45 bg-[linear-gradient(180deg,rgba(236,72,153,0.08),rgba(255,255,255,0.02)),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] shadow-[0_18px_60px_rgba(0,0,0,0.34)]";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function CustomerVipPerks() {
  const { data: dashboardData } = useQuery<{ vipTier: string; lifetimeSpend: number }>({
    queryKey: ["/api/customer/dashboard"],
  });
  const currentTierId = dashboardData?.vipTier ?? "member";
  const lifetimeSpend = dashboardData?.lifetimeSpend ?? 0;
  const tierIdx = VIP_TIERS.findIndex((t) => t.id === currentTierId);
  const nextTier = tierIdx >= 0 && tierIdx < VIP_TIERS.length - 1 ? VIP_TIERS[tierIdx + 1] : null;

  return (
    <AnimatedPage className="space-y-5 pb-6 sm:space-y-6 sm:pb-8">
      <FadeInUp>
        <section className={`${PANEL} p-4 sm:p-7 lg:p-8`}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-300/40 to-transparent" />
          <div className="absolute right-0 top-0 hidden h-full w-[38%] bg-gradient-to-l from-pink-500/24 via-fuchsia-500/12 to-transparent sm:block" />
          <div className="relative z-10 grid gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-pink-300/90">
                Membership Ladder
              </p>
              <div className="mt-4 flex items-start gap-3 sm:items-center sm:gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-pink-400/25 bg-pink-500/12 sm:h-14 sm:w-14">
                  <Gem className="h-6 w-6 text-pink-300 sm:h-7 sm:w-7" />
                </div>
                <div>
                  <h1 className="text-[2rem] font-semibold leading-none tracking-[-0.03em] text-white sm:text-5xl">
                    VIP Perks
                  </h1>
                  <p className="mt-1 text-sm text-white/58">
                    Unlock better rewards as your lifetime spend grows.
                  </p>
                </div>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/68 sm:mt-5 sm:text-[15px] sm:leading-7">
                This page turns the VIP system into a clearer, premium membership overview with stronger emphasis on progress, perks, and thresholds.
              </p>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-1">
              <div className="rounded-[22px] border border-black/45 bg-pink-500/[0.14] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Lifetime Spend</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{formatCurrency(lifetimeSpend)}</p>
              </div>
              <div className="rounded-[22px] border border-black/45 bg-black/20 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Active Tier</p>
                <p className="mt-3 text-lg font-semibold text-white">
                  {VIP_TIERS.find((t) => t.id === currentTierId)?.emoji} {VIP_TIERS.find((t) => t.id === currentTierId)?.label ?? "Member"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </FadeInUp>

      <FadeInUp>
        <section className={`${PANEL} p-4 sm:p-7`}>
          <div className="absolute right-0 top-0 hidden h-full w-1/3 bg-gradient-to-l from-pink-500/16 via-fuchsia-500/8 to-transparent md:block" />
          <div className="relative z-10 grid gap-5 sm:gap-6 lg:grid-cols-[0.9fr_minmax(0,1.1fr)]">
            <div className="space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/45 bg-pink-500/10">
                <Sparkles className="h-5 w-5 text-pink-300" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">
                  Benefits Matrix
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                  Tier Benefits
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/65">
                  VIP tiers are based on gross lifetime spend before discounts. The more you spend, the more perks and savings you unlock.
                </p>
                <div className="mt-5 inline-flex rounded-full border border-pink-500/20 bg-pink-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-pink-300">
                  {VIP_TIERS.find((t) => t.id === currentTierId)?.emoji} {VIP_TIERS.find((t) => t.id === currentTierId)?.label ?? "Member"}
                </div>
              </div>

              {nextTier && (
                <div className="rounded-[24px] border border-black/45 bg-black/20 p-4 sm:p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                    Progress To {nextTier.label}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/70">
                    {formatCurrency(lifetimeSpend)} of {formatCurrency(nextTier.threshold)} spent
                  </p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-pink-400 via-fuchsia-400 to-white"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((lifetimeSpend - (VIP_TIERS[tierIdx]?.threshold ?? 0)) / (nextTier.threshold - (VIP_TIERS[tierIdx]?.threshold ?? 0))) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {VIP_TIERS.map((tier) => {
                const isCurrent = tier.id === currentTierId;
                const tierOrder = VIP_TIERS.findIndex((t) => t.id === tier.id);
                const currentOrder = VIP_TIERS.findIndex((t) => t.id === currentTierId);
                const isUnlocked = tierOrder <= currentOrder;
                return (
                  <div
                    key={tier.id}
                    className={`rounded-[22px] border p-4 transition-colors ${
                      isCurrent
                        ? "border-pink-400/30 bg-pink-500/[0.16]"
                        : isUnlocked
                          ? "border-black/45 bg-pink-500/[0.06]"
                          : "border-black/45 bg-white/[0.015]"
                    }`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-pink-500/15 bg-pink-500/8 text-xl sm:h-12 sm:w-12 sm:text-2xl">
                        {tier.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">{tier.label}</p>
                          {isCurrent && (
                            <Badge className="rounded-full border border-pink-400/25 bg-pink-500/10 text-[10px] uppercase tracking-[0.18em] text-pink-300">
                              Current
                            </Badge>
                          )}
                          <span className="text-[11px] uppercase tracking-[0.18em] text-white/42">
                            {tier.threshold === 0 ? "Free+" : formatCurrency(tier.threshold) + "+"} · {tier.discountPct}% discount
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-white/70">
                          {tier.perks}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </FadeInUp>
    </AnimatedPage>
  );
}
