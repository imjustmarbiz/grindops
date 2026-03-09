import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Banknote, Star, ArrowLeft, LayoutDashboard } from "lucide-react";
import { Link, useParams } from "wouter";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { Button } from "@/components/ui/button";
import { CREATOR_BADGE_COMPONENTS, type CreatorBadgeId } from "@/components/creator-achievement-badges";

type Dashboard = {
  creator: { code: string; displayName: string };
  commissionPercent: number;
  availableBalance: string;
  totalEarned: string;
  ordersWithCodeCount: number;
  totalOrdersCount: number;
  paidOut: string;
  recentOrders: Array<{ id: string; displayId?: string | null; customerPrice: string; completedAt?: string | null }>;
  payoutRequests: Array<{ id: string; amount: string; status: string; createdAt: string }>;
  badges?: Array<{ badgeId: string; [key: string]: unknown }>;
};

function formatCurrency(s: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(s));
}

export default function StaffCreatorProfile() {
  const params = useParams<{ id: string }>();
  const creatorId = params?.id ?? "";
  const { data, isLoading, error } = useQuery<Dashboard>({
    queryKey: [`/api/staff/creators/${creatorId}/dashboard`],
    enabled: !!creatorId,
  });

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
          <CardContent className="p-8">
            <p className="text-center text-muted-foreground mb-4">Creator not found or unable to load.</p>
            <Link href="/admin">
              <Button variant="outline" size="sm" className="border-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
          </CardContent>
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

  return (
    <AnimatedPage className="space-y-6">
      <FadeInUp>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Admin
              </Button>
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Creators
              </Button>
            </Link>
          </div>
          <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <LayoutDashboard className="w-3 h-3 mr-1" />
            Staff view
          </Badge>
        </div>
      </FadeInUp>

      <FadeInUp>
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-green-950/30 p-5 sm:p-6">
          <div className="absolute top-0 right-0 w-48 h-48 -translate-y-8 translate-x-8 rounded-full bg-emerald-500/10 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_30%,transparent_70%)]" />
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-emerald-400">{creator.displayName}</h1>
            <p className="text-sm text-white/70 mt-0.5 font-mono">{creator.code}</p>
            <p className="text-xs text-white/50 mt-2">
              Commission: {commissionPercent}% · Orders with code: {ordersWithCodeCount} of {totalOrdersCount} total
            </p>
          </div>
        </div>
      </FadeInUp>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FadeInUp delay={0.02}>
          <Card className="border-0 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/10 overflow-hidden relative">
            <CardContent className="p-4 relative z-10">
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/70">Available balance</p>
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(availableBalance)}</p>
            </CardContent>
          </Card>
        </FadeInUp>
        <FadeInUp delay={0.04}>
          <Card className="border-0 bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent border border-blue-500/10 overflow-hidden relative">
            <CardContent className="p-4 relative z-10">
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/70">Total earned</p>
              <p className="text-xl font-bold text-blue-400">{formatCurrency(totalEarned)}</p>
            </CardContent>
          </Card>
        </FadeInUp>
        <FadeInUp delay={0.06}>
          <Card className="border-0 bg-gradient-to-br from-cyan-500/15 via-cyan-500/5 to-transparent border border-cyan-500/10 overflow-hidden relative">
            <CardContent className="p-4 relative z-10">
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/70">Paid out</p>
              <p className="text-xl font-bold text-cyan-400">{formatCurrency(paidOut)}</p>
            </CardContent>
          </Card>
        </FadeInUp>
        <FadeInUp delay={0.08}>
          <Card className="border-0 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/10 overflow-hidden relative">
            <CardContent className="p-4 relative z-10">
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/70">Orders with code</p>
              <p className="text-xl font-bold text-amber-400">{ordersWithCodeCount}</p>
            </CardContent>
          </Card>
        </FadeInUp>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FadeInUp>
          <Card className="border border-white/10 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                Recent orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet with this creator code.</p>
              ) : (
                <ul className="space-y-2">
                  {recentOrders.slice(0, 5).map((o) => (
                    <li key={o.id} className="flex justify-between items-center text-sm py-1.5 border-b border-white/5 last:border-0">
                      <span className="font-mono text-muted-foreground">{o.displayId ?? o.id}</span>
                      <span className="text-emerald-400">{formatCurrency(o.customerPrice)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </FadeInUp>
        <FadeInUp>
          <Card className="border border-white/10 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Banknote className="w-4 h-4 text-blue-400" />
                Payout requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payoutRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payout requests yet.</p>
              ) : (
                <ul className="space-y-2">
                  {payoutRequests.slice(0, 5).map((p) => (
                    <li key={p.id} className="flex justify-between items-center text-sm py-1.5 border-b border-white/5 last:border-0">
                      <span className={p.status === "paid" ? "text-cyan-400" : "text-amber-400"}>{formatCurrency(p.amount)}</span>
                      <Badge variant="outline" className="text-[10px] border-white/20">{p.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </FadeInUp>
      </div>

      {badgeIds.length > 0 && (
        <FadeInUp>
          <Card className="border border-white/10 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                Badges ({badgeIds.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {badgeIds.map((id) => {
                  const Comp = CREATOR_BADGE_COMPONENTS[id as CreatorBadgeId];
                  return Comp ? <Comp key={id} size="sm" /> : null;
                })}
              </div>
            </CardContent>
          </Card>
        </FadeInUp>
      )}

      <FadeInUp>
        <p className="text-xs text-muted-foreground">
          Staff view of this creator profile. Manage commission %, quote discount %, and badges in Admin → Creators. If linked to a user, they can use the Creator dashboard at /creator.
        </p>
      </FadeInUp>
    </AnimatedPage>
  );
}
