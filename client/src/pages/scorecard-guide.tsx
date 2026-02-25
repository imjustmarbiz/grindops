import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { HelpTip } from "@/components/help-tip";
import {
  Brain, DollarSign, Gauge, Scale, Shield, Crown, Star, Sparkles,
  AlertTriangle, Zap, ChevronDown, ChevronUp, Info, Target, TrendingUp,
  Clock, Ban, RotateCcw, CalendarCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

const grades = [
  { letter: "A", min: 90, color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/20", desc: "Excellent — top-tier performer" },
  { letter: "B", min: 75, color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/20", desc: "Good — consistent and reliable" },
  { letter: "C", min: 60, color: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-500/20", desc: "Average — room to improve" },
  { letter: "D", min: 40, color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/20", desc: "Below average — needs attention" },
  { letter: "F", min: 0, color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/20", desc: "Poor — significant improvement needed" },
];

const qualityFactors = [
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
    description: "Tracks your average turnaround time from assignment to delivery. Faster completion earns a higher score (2 days or less = 100%).",
    tips: "Start working on orders as soon as they're assigned. Prioritize active orders and avoid taking on more than you can handle.",
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

const queueFactors = [
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
  return (
    <AnimatedPage className="space-y-6" data-testid="scorecard-guide-page">
      <FadeInUp>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-scorecard-guide-header">
              Scorecard & AI Queue System
              <HelpTip text="Learn how the grading system and AI queue work together to rank grinders for order assignments." />
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Understanding how performance grades and queue ranking work together</p>
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
              How They Work Together
            </CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              The <span className="text-foreground font-medium">Scorecard</span> grades your overall performance based on five key factors — on-time delivery, speed, strikes, reassignments, and update compliance. These grades feed directly into the <span className="text-foreground font-medium">AI Queue</span>, which ranks all available grinders when an order needs to be assigned.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The queue uses a <span className="text-foreground font-medium">9-factor weighted scoring system</span> that considers not just your quality score, but also your capacity, how recently you were assigned work, your tier, bid margins, and more. The goal is to keep things <span className="text-foreground font-medium">fair</span> while rewarding grinders who consistently deliver quality work and have earned elite status.
            </p>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/[0.08] border border-amber-500/[0.12]">
              <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-300/80 leading-relaxed">
                Queue position is a <span className="font-semibold text-amber-300">guide</span> — it helps keep everyone on a fair playing field and rewards better performers, but it doesn't guarantee you will or won't receive any specific order.
              </p>
            </div>
          </CardContent>
        </Card>
      </FadeInUp>

      <FadeInUp>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5865F2]/15 flex items-center justify-center">
              <Star className="w-5 h-5 text-[#5865F2]" />
            </div>
            <h2 className="text-lg font-bold" data-testid="text-grading-system-header">Scorecard Grading System</h2>
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
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/[0.1]">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-emerald-300/80 leading-relaxed"><span className="font-medium text-emerald-300">How to improve:</span> {factor.tips}</p>
                    </div>
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
            <h2 className="text-lg font-bold" data-testid="text-queue-factors-header">AI Queue — 9 Factor Breakdown</h2>
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
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/[0.1]">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-emerald-300/80 leading-relaxed"><span className="font-medium text-emerald-300">How to improve:</span> {factor.tips}</p>
                    </div>
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
                When an order is a replacement (emergency reassignment), all eligible grinders receive a +25% boost to their final score. This ensures replacement orders get filled quickly by the best available grinders.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-cyan-500/[0.12] bg-cyan-500/[0.05]" data-testid="card-elite-boost">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/25">+15%</Badge>
                <span className="font-semibold text-sm">Large Order Elite Boost</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Elite grinders receive an additional +15% boost on orders with a customer price of $500 or more. This rewards top performers with priority access to high-value work.
              </p>
            </div>
          </CardContent>
        </Card>
      </FadeInUp>

      <FadeInUp>
        <Card className="border-0 bg-gradient-to-br from-blue-500/[0.06] via-background to-purple-500/[0.04] overflow-hidden relative" data-testid="card-disclaimer">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-blue-500/[0.03] -translate-y-16 translate-x-16" />
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-400" />
              </div>
              Important Disclaimer
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-3">
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
            </div>
          </CardContent>
        </Card>
      </FadeInUp>
    </AnimatedPage>
  );
}