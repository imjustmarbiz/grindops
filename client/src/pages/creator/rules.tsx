import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText, FileText, Shield, Banknote, MessageCircle, Info } from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { HelpTip } from "@/components/help-tip";

const RULES_VISITED_KEY = "grindops-creator-rules-visited";

const CARD_GRADIENT = "border-0 bg-gradient-to-br from-emerald-500/[0.08] via-background to-emerald-900/[0.04] overflow-hidden relative shadow-xl shadow-black/20";

export default function CreatorRules() {
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(RULES_VISITED_KEY, "true");
  }, []);

  return (
    <AnimatedPage className="space-y-6">
      {/* Hero — same style as Notifications / Promote */}
      <FadeInUp>
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-green-950/30 p-5 sm:p-6">
          <div
            className="absolute top-0 right-0 w-64 h-64 -translate-y-12 translate-x-8 rounded-full overflow-hidden [mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)] [mask-size:100%_100%] [mask-position:center]"
          >
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 flex items-center justify-center opacity-30">
              <ScrollText className="w-32 h-32 text-emerald-400" />
            </div>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0">
                <ScrollText className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display tracking-tight text-white">
                    Rules & Policy
                  </h1>
                  <HelpTip text="Share only your assigned creator code. Payouts are at staff discretion—typically one per month. Link your socials in Promote for attribution." />
                </div>
                <p className="text-sm text-white/80 mt-0.5">
                  Creator Program terms, conduct, payouts, and contact.
                </p>
              </div>
            </div>
          </div>
        </div>
      </FadeInUp>

      {/* Creator Program */}
      <FadeInUp>
        <Card className={CARD_GRADIENT} data-testid="card-creator-program">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/[0.02] -translate-y-12 translate-x-12" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <FileText className="w-4 h-4 text-emerald-400" />
              </div>
              Creator Program
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <p className="text-sm text-white/80">
              You receive a unique referral code. When customers use your code at checkout, you earn commission. Staff track referrals and issue payouts from the Admin panel.
            </p>
          </CardContent>
        </Card>
      </FadeInUp>

      {/* Conduct */}
      <FadeInUp>
        <Card className={CARD_GRADIENT} data-testid="card-conduct">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/[0.02] -translate-y-12 translate-x-12" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              Conduct
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 relative">
            <p className="text-xs text-muted-foreground mb-2">
              Follow these rules to stay in good standing.
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <p className="text-sm text-white/80">Share only your assigned creator code. Do not impersonate other creators or the brand.</p>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <p className="text-sm text-white/80">Do not make false or misleading claims about the service to drive referrals.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeInUp>

      {/* Payouts */}
      <FadeInUp>
        <Card className="border-0 bg-gradient-to-br from-amber-500/[0.06] via-background to-amber-900/[0.03] overflow-hidden relative shadow-xl shadow-black/20" data-testid="card-payouts">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-amber-500/[0.03] -translate-y-12 translate-x-12" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Banknote className="w-4 h-4 text-amber-400" />
              </div>
              Payouts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Commission from orders placed with your code is paid by staff. Request payouts from the Payouts page once you have payout details on file.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <p className="text-xs text-muted-foreground mb-1">Frequency</p>
                <p className="text-base font-bold text-amber-400">One per month</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <p className="text-xs text-muted-foreground mb-1">Timing</p>
                <p className="text-base font-bold text-white/90">Staff discretion</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <p className="text-xs text-muted-foreground mb-1">Request</p>
                <p className="text-base font-bold text-white/90">From Payouts page</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeInUp>

      {/* Socials & Contact */}
      <FadeInUp>
        <Card className="border-0 bg-gradient-to-br from-blue-500/[0.06] via-background to-blue-900/[0.03] overflow-hidden relative shadow-xl shadow-black/20" data-testid="card-socials-contact">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/[0.02] -translate-y-12 translate-x-12" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-blue-400" />
              </div>
              Socials & Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Linked socials (YouTube, Twitch, TikTok, Instagram, X) are visible to staff in Admin for attribution. Add or edit them on the Promote page.
            </p>
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] p-3">
              <p className="text-xs text-amber-200/80 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                Questions? Contact staff in Discord.
              </p>
            </div>
          </CardContent>
        </Card>
      </FadeInUp>
    </AnimatedPage>
  );
}
