import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gem, Loader2 } from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { VIP_TIERS } from "@shared/customer-vip";

const GRADIENT = "bg-gradient-to-br from-pink-500/15 via-purple-500/10 to-transparent";
const BORDER = "border-pink-500/20 border-purple-500/20";

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
    <AnimatedPage className="space-y-6">
      <FadeInUp>
        <div className={`relative overflow-hidden rounded-2xl border ${BORDER} p-5 sm:p-6 ${GRADIENT}`}>
          <div className="absolute top-0 right-0 w-64 h-64 -translate-y-12 translate-x-8 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 [mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)]" />
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center border border-pink-500/30">
                <Gem className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold font-display tracking-tight text-white">
                  VIP Perks & Benefits
                </h1>
                <p className="text-sm text-white/60 mt-0.5">
                  Unlock rewards as you spend more with us
                </p>
                <p className="text-xs text-pink-400/80 mt-2">
                  Your lifetime spend: {formatCurrency(lifetimeSpend)}
                </p>
              </div>
            </div>
          </div>
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
                  Tier Benefits
                </CardTitle>
                <p className="text-sm text-pink-400/90 mt-0.5">
                  {VIP_TIERS.find((t) => t.id === currentTierId)?.emoji} {VIP_TIERS.find((t) => t.id === currentTierId)?.label ?? "Member"}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed max-w-2xl">
              VIP tiers are based on gross lifetime spend (before discounts). Spend more to unlock higher tiers.
            </p>
          </CardHeader>
          <CardContent className="relative space-y-3 pt-2">
            {VIP_TIERS.map((tier) => {
              const isCurrent = tier.id === currentTierId;
              const tierOrder = VIP_TIERS.findIndex((t) => t.id === tier.id);
              const currentOrder = VIP_TIERS.findIndex((t) => t.id === currentTierId);
              const isUnlocked = tierOrder <= currentOrder;
              const progressToNext = isCurrent && nextTier
                ? Math.min(100, Math.max(0, ((lifetimeSpend - tier.threshold) / (nextTier.threshold - tier.threshold)) * 100))
                : null;
              return (
                <div
                  key={tier.id}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    isCurrent ? "border-pink-500/50 bg-gradient-to-br from-pink-500/15 to-purple-500/10 shadow-lg shadow-pink-500/10 ring-1 ring-pink-500/30" :
                    isUnlocked ? "border-white/15 bg-white/[0.04] hover:bg-white/[0.06]" :
                    "border-white/[0.08] bg-white/[0.02] opacity-70"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-2xl shrink-0 leading-none">{tier.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white flex items-center gap-2">
                          {tier.label}
                          {isCurrent && <Badge className="text-[10px] border-pink-500/40 bg-pink-500/20 text-pink-400">Current tier</Badge>}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {tier.threshold === 0 ? "Free+" : formatCurrency(tier.threshold) + "+"} · {tier.discountPct}% discount
                        </span>
                      </div>
                      <p className="text-sm text-white/70 mt-1.5 leading-relaxed">
                        {tier.perks}
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
    </AnimatedPage>
  );
}
