import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { useAuth } from "@/hooks/use-auth";

import {
  Brain, DollarSign, Gauge, Scale, Shield, Crown, Star, Sparkles,
  AlertTriangle, Zap, ChevronDown, ChevronUp, Info, Target, TrendingUp,
  Clock, Ban, RotateCcw, CalendarCheck, Users, ListOrdered, Wrench
} from "lucide-react";
import { Button } from "@/components/ui/button";

const grades = [
  { letter: "A", min: 90, color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/20", desc: "Excellent — top-tier performer" },
  { letter: "B", min: 75, color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/20", desc: "Good — consistent and reliable" },
  { letter: "C", min: 60, color: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-500/20", desc: "Average — room to improve" },
  { letter: "D", min: 40, color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/20", desc: "Below average — needs attention" },
  { letter: "F", min: 0, color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/20", desc: "Poor — significant improvement needed" },
];

const grinderQualityFactors = [
  {
    name: "On-Time Rate",
    weight: "35%",
    icon: Clock,
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    description: "Measures how often you deliver orders on or before the expected deadline. Late deliveries reduce this score significantly.",
    tips: "Communicate early if you need more time. Set realistic expectations when bidding and always aim to deliver ahead of schedule.",
  },
  {
    name: "Speed Factor",
    weight: "20%",
    icon: TrendingUp,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    description: "Measures how fast you complete orders relative to the available time. Orders finished in under 2 days always score 100%. For longer orders, speed is calculated by comparing your actual turnaround against the deadline — finishing in half the available time or less scores 100%, while using 75% or less scores 90%. Each order is scored individually and averaged.",
    tips: "Start orders as soon as they're assigned. Same-day or next-day completions always get a perfect speed score. For longer orders, aim to finish well before the deadline rather than just on time.",
  },
  {
    name: "Strike Penalty",
    weight: "15%",
    icon: Ban,
    color: "text-red-400",
    bg: "bg-red-500/15",
    description: "Each strike reduces your quality score by up to 15 points (capped at 60 point deduction). Strikes come from rule violations or poor conduct.",
    tips: "Follow all platform rules, communicate professionally, and address any staff feedback promptly to avoid strikes.",
  },
  {
    name: "Reassignment Penalty",
    weight: "15%",
    icon: RotateCcw,
    color: "text-orange-400",
    bg: "bg-orange-500/15",
    description: "If orders assigned to you get reassigned to another grinder, this penalty increases. A high reassignment ratio signals reliability concerns.",
    tips: "Only accept orders you can complete. If you can't finish an order, notify staff early rather than going silent.",
  },
  {
    name: "Update Compliance",
    weight: "15%",
    icon: CalendarCheck,
    color: "text-yellow-400",
    bg: "bg-yellow-500/15",
    description: "Measures how consistently you submit daily progress updates on active orders. Missing updates lowers your compliance score.",
    tips: "Submit daily updates on every active order, even if progress is minimal. Consistency is key — it shows you're engaged and accountable.",
  },
];

const staffQualityFactors = [
  {
    name: "On-Time Rate",
    weight: "35%",
    icon: Clock,
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    description: "Tracks what percentage of a grinder's orders are delivered on or before the deadline. This is the single heaviest factor in the quality score. A grinder with a high on-time rate is dependable for time-sensitive orders.",
    staffNote: "When assigning rush or time-critical orders, prioritize grinders with 90%+ on-time rates. A grinder with a low on-time rate may need a conversation about workload management before receiving more assignments.",
  },
  {
    name: "Speed Factor",
    weight: "20%",
    icon: TrendingUp,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    description: "Measures average turnaround speed relative to deadlines. Orders completed in under 2 days always score 100%. For longer orders, finishing in half the allotted time or less earns a perfect score. Each order is scored individually and averaged.",
    staffNote: "Fast grinders are ideal for emergency and replacement orders. Check this metric when you need someone who can deliver quickly rather than just on time.",
  },
  {
    name: "Strike Penalty",
    weight: "15%",
    icon: Ban,
    color: "text-red-400",
    bg: "bg-red-500/15",
    description: "Each active strike deducts up to 15 points from the quality score (capped at 60 total penalty). Strikes are issued by staff for rule violations, poor conduct, or policy breaches.",
    staffNote: "A grinder with active strikes will rank lower automatically. Before assigning high-value orders to a struck grinder, consider whether the issue has been resolved. Use strike history on the scorecard to make informed decisions.",
  },
  {
    name: "Reassignment Penalty",
    weight: "15%",
    icon: RotateCcw,
    color: "text-orange-400",
    bg: "bg-orange-500/15",
    description: "Increases when orders assigned to a grinder are later reassigned to someone else. A high reassignment ratio indicates the grinder may be unreliable or taking on too much work.",
    staffNote: "If a grinder has a high reassignment count, avoid assigning them complex or high-stakes orders. Consider reducing their capacity or having a conversation about only accepting work they can complete.",
  },
  {
    name: "Update Compliance",
    weight: "15%",
    icon: CalendarCheck,
    color: "text-yellow-400",
    bg: "bg-yellow-500/15",
    description: "Tracks whether grinders submit required daily progress updates on active orders. Missing updates lower this score. Grinders with high compliance are communicative and accountable.",
    staffNote: "Low compliance is often the first sign a grinder is going inactive or struggling. Check this score to identify grinders who may need a checkpoint or follow-up before they fall behind.",
  },
];

const grinderQueueFactors = [
  {
    name: "Margin",
    weight: "20%",
    icon: DollarSign,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    description: "Calculated from the difference between the customer price and your bid. Higher profit margins for the business earn a better score. Grinders who bid competitively while maintaining quality get ranked higher.",
    tips: "Bid fairly — you don't need the lowest bid, but extremely high bids reduce your margin score. Find the sweet spot between earning well and being competitive.",
  },
  {
    name: "Capacity",
    weight: "15%",
    icon: Gauge,
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    description: "Compares your current active orders against your maximum capacity. Grinders with more available slots score higher, ensuring work is distributed to those who can handle it.",
    tips: "Keep your capacity setting accurate. Complete orders promptly to free up slots. Don't max out your capacity if you can't handle the workload.",
  },
  {
    name: "Fairness",
    weight: "15%",
    icon: Scale,
    color: "text-purple-400",
    bg: "bg-purple-500/15",
    description: "Tracks how recently you received your last assignment. Grinders who haven't been assigned orders recently get a fairness boost, ensuring everyone gets opportunities.",
    tips: "Stay active and available. The system naturally rotates opportunities — the longer you've waited, the higher your fairness score becomes.",
  },
  {
    name: "Reliability",
    weight: "10%",
    icon: Shield,
    color: "text-indigo-400",
    bg: "bg-indigo-500/15",
    description: "Based on your completion rate — the percentage of assigned orders you successfully finish (excluding cancelled orders). Consistent delivery builds trust.",
    tips: "Complete every order you accept. If you can't finish, communicate early. A high completion rate shows staff they can count on you.",
  },
  {
    name: "Tier",
    weight: "10%",
    icon: Crown,
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    description: "Your grinder tier (Elite, VC, Event, Regular) affects your base score. Higher tiers get a natural advantage, rewarding grinders who've earned elevated status.",
    tips: "Work toward Elite status through consistent high-quality performance. Higher tiers unlock better queue positioning and access to premium orders.",
  },
  {
    name: "Quality",
    weight: "10%",
    icon: Star,
    color: "text-pink-400",
    bg: "bg-pink-500/15",
    description: "Derived from your overall quality score (the same score on your Scorecard). Factors in on-time rate, speed, strikes, reassignments, and update compliance.",
    tips: "Focus on all five quality score components. Your quality score is your reputation — it directly feeds into your queue ranking.",
  },
  {
    name: "New Grinder",
    weight: "10%",
    icon: Sparkles,
    color: "text-cyan-400",
    bg: "bg-cyan-500/15",
    description: "New grinders with fewer than 3 completed orders receive a temporary boost to help them get started. This bonus phases out as you complete more orders.",
    tips: "If you're new, take advantage of this boost by delivering excellent work on your first few orders. First impressions matter for building your reputation.",
  },
  {
    name: "Risk",
    weight: "10% (penalty)",
    icon: AlertTriangle,
    color: "text-orange-400",
    bg: "bg-orange-500/15",
    description: "A penalty factor based on active strikes. Each strike reduces your risk score, pushing you lower in the queue. Three strikes can result in suspension.",
    tips: "Avoid strikes at all costs. Follow platform rules, communicate professionally, and address any issues raised by staff immediately.",
  },
];

const staffQueueFactors = [
  {
    name: "Margin",
    weight: "20%",
    icon: DollarSign,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    description: "Ranks grinders by the profit margin their bid generates relative to the customer price. A grinder who bids $30 on a $50 order yields a 40% margin and scores higher than one who bids $45 (10% margin). This is the heaviest queue factor.",
    staffNote: "The queue automatically favors grinders who leave more profit on the table. When reviewing bids manually, compare the margin column. You can still override the queue if a lower-margin grinder is clearly the better fit for the job.",
  },
  {
    name: "Capacity",
    weight: "15%",
    icon: Gauge,
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    description: "Compares a grinder's current active orders against their maximum capacity setting. A grinder at 1/5 capacity scores much higher than one at 4/5. This ensures work is distributed to grinders who have bandwidth.",
    staffNote: "Check a grinder's active orders before assigning. A high queue rank from capacity means they have open slots, but verify they're actually available and not on break. Adjust capacity settings on the grinder scorecard if they seem inaccurate.",
  },
  {
    name: "Fairness",
    weight: "15%",
    icon: Scale,
    color: "text-purple-400",
    bg: "bg-purple-500/15",
    description: "Tracks how long since a grinder was last assigned an order. The longer they've waited, the higher their fairness score. This prevents the same top grinders from getting all the work while others sit idle.",
    staffNote: "If you notice the same grinders always getting assigned, the fairness factor may not be strong enough to offset their other scores. Consider manually assigning to underutilized grinders to keep the team balanced and prevent burnout.",
  },
  {
    name: "Reliability",
    weight: "10%",
    icon: Shield,
    color: "text-indigo-400",
    bg: "bg-indigo-500/15",
    description: "Based on completion rate — the percentage of assigned orders a grinder successfully finishes. A grinder who completes 19 out of 20 assigned orders has a 95% reliability score. Cancelled orders by staff are excluded from the calculation.",
    staffNote: "Reliability is your trust indicator. For high-value or complex orders, lean toward grinders with 90%+ reliability. A grinder with low reliability who is still active may need a capacity reduction or a direct conversation.",
  },
  {
    name: "Tier",
    weight: "10%",
    icon: Crown,
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    description: "Grinder tier (Elite, Diamond, Gold, Silver, Bronze, New) provides a base score modifier. Elite grinders get the highest base, New grinders the lowest. Tiers are calculated automatically from stats.",
    staffNote: "Tiers reflect long-term performance. An Elite grinder has a proven track record and gets a natural queue advantage. Use tier as a quick shorthand for trustworthiness when making rapid assignment decisions.",
  },
  {
    name: "Quality",
    weight: "10%",
    icon: Star,
    color: "text-pink-400",
    bg: "bg-pink-500/15",
    description: "Directly feeds the grinder's quality score (from their Scorecard) into the queue ranking. A grinder with an 'A' grade (90+) contributes a full 10% here, while an 'F' grade (<40) contributes almost nothing.",
    staffNote: "Quality score is the aggregate of all five scorecard factors. Check the individual breakdown on a grinder's scorecard to understand why their quality score is high or low. A sudden quality drop usually means missed updates or recent strikes.",
  },
  {
    name: "New Grinder Boost",
    weight: "10%",
    icon: Sparkles,
    color: "text-cyan-400",
    bg: "bg-cyan-500/15",
    description: "Grinders with fewer than 3 completed orders get a temporary boost to help them get their first assignments. This phases out completely after 3 completed orders.",
    staffNote: "New grinders appear higher in the queue than their stats alone would justify. This is intentional — they need initial orders to build a track record. Assign simple, low-risk orders to new grinders to get them started safely.",
  },
  {
    name: "Risk Penalty",
    weight: "10% (penalty)",
    icon: AlertTriangle,
    color: "text-orange-400",
    bg: "bg-orange-500/15",
    description: "Active strikes reduce a grinder's queue position. Each strike chips away at this factor. A grinder with 3 strikes is effectively at the bottom of the queue and may be suspended.",
    staffNote: "Struck grinders are deprioritized automatically. If you're considering assigning to a struck grinder despite their low ranking, make sure the strike issue has been addressed first. Suspended grinders cannot be assigned at all.",
  },
];

function CollapsibleSection({ title, icon: Icon, iconColor, iconBg, children, defaultOpen = false }: {
  title: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-visible">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover-elevate rounded-xl transition-colors"
        data-testid={`button-toggle-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <span className="font-semibold text-sm sm:text-base">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0">
          {children}
        </div>
      )}
    </div>
  );
}

export default function ScorecardGuide() {
  const { user } = useAuth();
  const isStaff = (user as any)?.role === "staff" || (user as any)?.role === "owner";

  const qualityFactors = isStaff ? staffQualityFactors : grinderQualityFactors;
  const queueFactors = isStaff ? staffQueueFactors : grinderQueueFactors;

  return (
    <AnimatedPage className="space-y-6" data-testid="scorecard-guide-page">
      <FadeInUp>
        <div className="flex items-center gap-3">
          <Brain className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-scorecard-guide-header">
              {isStaff ? "Scorecard & Queue Manual" : "Scorecard & AI Queue System"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isStaff
                ? "Staff reference for understanding grinder rankings and making informed assignment decisions"
                : "Understanding how performance grades and queue ranking work together"
              }
            </p>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
        <Card className="border-0 bg-gradient-to-br from-primary/[0.08] via-background to-primary/[0.03] overflow-hidden relative" data-testid="card-how-they-work">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/[0.03] -translate-y-16 translate-x-16" />
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              {isStaff ? "How the System Works" : "How They Work Together"}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-3">
            {isStaff ? (
              <>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every grinder has a <span className="text-foreground font-medium">Scorecard</span> that grades their overall performance on a 0-100 scale using five weighted factors: on-time delivery, speed, strikes, reassignments, and update compliance. This generates a letter grade (A through F) visible on their profile.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The <span className="text-foreground font-medium">AI Queue</span> uses a separate <span className="text-foreground font-medium">9-factor weighted scoring system</span> that combines the quality score with real-time factors like capacity, bid margins, fairness, tier, and risk. It produces a ranked list of grinders for each open order, giving you a data-driven recommendation for who should get the work.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The queue is a <span className="text-foreground font-medium">recommendation tool, not a requirement</span>. You can always override it based on your judgment, but understanding each factor helps you make faster, better-informed decisions.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The <span className="text-foreground font-medium">Scorecard</span> grades your overall performance based on five key factors — on-time delivery, speed, strikes, reassignments, and update compliance. These grades feed directly into the <span className="text-foreground font-medium">AI Queue</span>, which ranks all available grinders when an order needs to be assigned.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The queue uses a <span className="text-foreground font-medium">9-factor weighted scoring system</span> that considers not just your quality score, but also your capacity, how recently you were assigned work, your tier, bid margins, and more. The goal is to keep things <span className="text-foreground font-medium">fair</span> while rewarding grinders who consistently deliver quality work and have earned elite status.
                </p>
              </>
            )}
            <div className={`flex items-start gap-2 p-3 rounded-lg ${isStaff ? "bg-blue-500/[0.08] border border-blue-500/[0.12]" : "bg-amber-500/[0.08] border border-amber-500/[0.12]"}`}>
              <Info className={`w-4 h-4 ${isStaff ? "text-blue-400" : "text-amber-400"} mt-0.5 shrink-0`} />
              <p className={`text-xs ${isStaff ? "text-blue-300/80" : "text-amber-300/80"} leading-relaxed`}>
                {isStaff
                  ? <>The queue ranking is a <span className={`font-semibold ${isStaff ? "text-blue-300" : "text-amber-300"}`}>decision-support tool</span>. It handles the data analysis so you can focus on the human factors — specific skills, availability, and context that the algorithm can't see.</>
                  : <>Queue position is a <span className="font-semibold text-amber-300">guide</span> — it helps keep everyone on a fair playing field and rewards better performers, but it doesn't guarantee you will or won't receive any specific order.</>
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </FadeInUp>

      {isStaff && (
        <FadeInUp>
          <Card className="border-0 bg-gradient-to-br from-emerald-500/[0.06] via-background to-blue-500/[0.04] overflow-hidden relative" data-testid="card-staff-quick-ref">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-emerald-400" />
                </div>
                Quick Reference — When to Use What
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">Standard Orders</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Follow the AI Queue ranking. The top-ranked grinder has the best combination of margin, capacity, reliability, and fairness. Accept the queue's suggestion unless you have a specific reason not to.</p>
                </div>
                <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-blue-400">Rush / Time-Sensitive Orders</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Prioritize grinders with high On-Time Rate (35% of quality score) and high Speed Factor. Check their active order count — a fast grinder at full capacity won't be fast on this order.</p>
                </div>
                <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-amber-400">High-Value Orders ($500+)</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Elite grinders get a +15% queue boost on these automatically. Lean toward Diamond/Elite tier grinders with high reliability and quality scores. Margin matters less here — prioritize dependability.</p>
                </div>
                <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-red-400">Replacement / Emergency Orders</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">All grinders get a +25% emergency boost. Speed Factor and Capacity are your key metrics. Assign to the fastest available grinder — the queue already accounts for urgency, but use your judgment on who can actually start immediately.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeInUp>
      )}

      <FadeInUp>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5865F2]/15 flex items-center justify-center">
              <Star className="w-5 h-5 text-[#5865F2]" />
            </div>
            <h2 className="text-lg font-bold" data-testid="text-grading-system-header">
              {isStaff ? "Scorecard Grading System — How Grinders Are Rated" : "Scorecard Grading System"}
            </h2>
          </div>

          <Card className="border-0 bg-white/[0.03] overflow-hidden relative" data-testid="card-letter-grades">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Letter Grades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {grades.map((g) => (
                  <div key={g.letter} className={`flex flex-col items-center p-4 rounded-xl ${g.bg} border ${g.border}`} data-testid={`card-grade-${g.letter}`}>
                    <span className={`text-3xl font-bold ${g.color}`}>{g.letter}</span>
                    <span className="text-xs text-muted-foreground mt-1">{g.min > 0 ? `${g.min}+` : `< 40`}</span>
                    <span className="text-[10px] text-center text-muted-foreground mt-1">{g.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/[0.03] overflow-hidden relative" data-testid="card-quality-breakdown">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quality Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {qualityFactors.map((factor) => (
                <CollapsibleSection
                  key={factor.name}
                  title={`${factor.name} (${factor.weight})`}
                  icon={factor.icon}
                  iconColor={factor.color}
                  iconBg={factor.bg}
                >
                  <div className="space-y-2 ml-12">
                    <p className="text-sm text-muted-foreground leading-relaxed">{factor.description}</p>
                    {"staffNote" in factor && isStaff ? (
                      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/[0.06] border border-blue-500/[0.1]">
                        <Users className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-300/80 leading-relaxed"><span className="font-medium text-blue-300">Staff insight:</span> {(factor as any).staffNote}</p>
                      </div>
                    ) : (
                      "tips" in factor && (
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/[0.1]">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-emerald-300/80 leading-relaxed"><span className="font-medium text-emerald-300">How to improve:</span> {(factor as any).tips}</p>
                        </div>
                      )
                    )}
                  </div>
                </CollapsibleSection>
              ))}
            </CardContent>
          </Card>
        </div>
      </FadeInUp>

      <FadeInUp>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold" data-testid="text-queue-factors-header">
              {isStaff ? "AI Queue — 9 Factor Breakdown (How Grinders Are Ranked)" : "AI Queue — 9 Factor Breakdown"}
            </h2>
          </div>

          <Card className="border-0 bg-white/[0.03] overflow-hidden relative" data-testid="card-queue-factors">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                Weighted Scoring Factors
                <Badge className="bg-primary/15 text-primary border border-primary/20 text-[10px]">WEIGHTED</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {queueFactors.map((factor) => (
                <CollapsibleSection
                  key={factor.name}
                  title={`${factor.name} (${factor.weight})`}
                  icon={factor.icon}
                  iconColor={factor.color}
                  iconBg={factor.bg}
                >
                  <div className="space-y-2 ml-12">
                    <p className="text-sm text-muted-foreground leading-relaxed">{factor.description}</p>
                    {"staffNote" in factor && isStaff ? (
                      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/[0.06] border border-blue-500/[0.1]">
                        <Users className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-300/80 leading-relaxed"><span className="font-medium text-blue-300">Staff insight:</span> {(factor as any).staffNote}</p>
                      </div>
                    ) : (
                      "tips" in factor && (
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/[0.1]">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-emerald-300/80 leading-relaxed"><span className="font-medium text-emerald-300">How to improve:</span> {(factor as any).tips}</p>
                        </div>
                      )
                    )}
                  </div>
                </CollapsibleSection>
              ))}
            </CardContent>
          </Card>
        </div>
      </FadeInUp>

      <FadeInUp>
        <Card className="border-0 bg-gradient-to-br from-amber-500/[0.06] via-background to-cyan-500/[0.04] overflow-hidden relative" data-testid="card-boost-modifiers">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-amber-500/[0.03] -translate-y-12 translate-x-12" />
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              Boost Modifiers
            </CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-3">
            <div className="p-4 rounded-xl border border-amber-500/[0.12] bg-amber-500/[0.05]" data-testid="card-emergency-boost">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/25">+25%</Badge>
                <span className="font-semibold text-sm">Emergency Boost</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isStaff
                  ? "When an order is flagged as a replacement (emergency reassignment), all eligible grinders receive a +25% boost to their final queue score. This ensures replacement orders surface the best available grinders quickly. The boost applies equally — the queue still ranks by the other 9 factors within the boosted scores."
                  : "When an order is a replacement (emergency reassignment), all eligible grinders receive a +25% boost to their final score. This ensures replacement orders get filled quickly by the best available grinders."
                }
              </p>
            </div>
            <div className="p-4 rounded-xl border border-cyan-500/[0.12] bg-cyan-500/[0.05]" data-testid="card-elite-boost">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/25">+15%</Badge>
                <span className="font-semibold text-sm">Large Order Elite Boost</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isStaff
                  ? "Elite grinders receive an additional +15% boost on orders with a customer price of $500 or more. This intentionally prioritizes your most experienced grinders for high-value work where mistakes are costly. Non-elite grinders can still be assigned manually if needed."
                  : "Elite grinders receive an additional +15% boost on orders with a customer price of $500 or more. This rewards top performers with priority access to high-value work."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </FadeInUp>

      <FadeInUp>
        <Card className={`border-0 bg-gradient-to-br ${isStaff ? "from-indigo-500/[0.06] via-background to-emerald-500/[0.04]" : "from-blue-500/[0.06] via-background to-purple-500/[0.04]"} overflow-hidden relative`} data-testid="card-disclaimer">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-blue-500/[0.03] -translate-y-16 translate-x-16" />
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${isStaff ? "bg-indigo-500/15" : "bg-blue-500/15"} flex items-center justify-center`}>
                <Info className={`w-5 h-5 ${isStaff ? "text-indigo-400" : "text-blue-400"}`} />
              </div>
              {isStaff ? "Staff Best Practices" : "Important Disclaimer"}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-3">
              {isStaff ? (
                <>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <Brain className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-staff-bp-trust">
                      <span className="text-foreground font-medium">Trust the queue as your starting point.</span> The AI factors in data you might not have top-of-mind — fairness rotation, capacity, recent activity. Start with the queue's top recommendation, then apply your human judgment.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <Shield className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-staff-bp-override">
                      <span className="text-foreground font-medium">Override when you have context the algorithm doesn't.</span> If you know a grinder is on vacation, has a specific skill set needed, or has a personal relationship with the customer, override confidently. The queue doesn't penalize manual assignments.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <ListOrdered className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-staff-bp-scorecard">
                      <span className="text-foreground font-medium">Use the scorecard to diagnose problems.</span> If a grinder's performance is dropping, open their scorecard to see which specific factor is declining. This tells you whether to issue a warning, adjust capacity, or have a coaching conversation.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <Scale className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-staff-bp-fairness">
                      <span className="text-foreground font-medium">Monitor fairness across the team.</span> If the same grinders keep getting all the work, the fairness factor will eventually correct this, but you can accelerate it by manually assigning to underutilized grinders. A balanced team is a productive team.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/[0.1]">
                    <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-emerald-300/80 leading-relaxed" data-testid="text-staff-bp-summary">
                      The queue handles the math. You handle the context. Together, you make better assignment decisions than either could alone.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <Scale className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-disclaimer-fair">
                      Queue position is a <span className="text-foreground font-medium">guide</span> designed to keep everyone on a fair playing field. It helps distribute work equitably while accounting for performance.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <Crown className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-disclaimer-rewards">
                      The system <span className="text-foreground font-medium">rewards consistent performance</span> and elite status. Better scores lead to better positioning over time.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-disclaimer-no-guarantee">
                      Your position <span className="text-foreground font-medium">does not guarantee</span> you will or will not receive any specific order. Many factors go into the final assignment decision.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <Shield className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-disclaimer-override">
                      Staff may <span className="text-foreground font-medium">override queue suggestions</span> for special circumstances, such as specific skill requirements or time-sensitive orders.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/[0.1]">
                    <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-emerald-300/80 leading-relaxed" data-testid="text-disclaimer-improve">
                      The best way to improve your queue position is to <span className="font-medium text-emerald-300">deliver quality work consistently</span> — stay on time, communicate updates, and complete every order you accept.
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </FadeInUp>
    </AnimatedPage>
  );
}
