import { useGrinderData } from "@/hooks/use-grinder-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen, LayoutDashboard, Zap, FileCheck, Gavel, Banknote, ClipboardCheck, Brain,
  Bell, Calendar, Newspaper, Star, LinkIcon, CalendarDays, Lightbulb, TrendingUp,
  CalendarClock, Send, ArrowUpCircle, Crown, ChevronRight
} from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { Link } from "wouter";

const featureItems = [
  {
    icon: LayoutDashboard,
    title: "Overview",
    desc: "Your personal dashboard showing active orders, performance metrics, alerts, and an earnings summary. Get a quick snapshot of everything happening with your account at a glance.",
    url: "/",
  },
  {
    icon: Zap,
    title: "Available Orders",
    desc: "Browse all open orders available for bidding. View countdowns, replacement orders, and your current queue standing. Place bids directly from this page when new work drops.",
    url: "/grinder/orders",
  },
  {
    icon: FileCheck,
    title: "My Work",
    desc: "Track your active assignments, send progress updates to staff, log in and out of sessions, report issues, and upload completion proof when you finish an order.",
    url: "/grinder/assignments",
  },
  {
    icon: Gavel,
    title: "My Bids",
    desc: "View your complete bid history including pending, accepted, and denied bids. Edit active bids before the countdown expires to stay competitive.",
    url: "/grinder/bids",
  },
  {
    icon: Banknote,
    title: "Payouts",
    desc: "Request payouts for completed work, view your full payment history, manage payout methods, and dispute or approve amounts if something doesn't look right.",
    url: "/grinder/payouts",
  },
  {
    icon: ClipboardCheck,
    title: "My Scorecard",
    desc: "Your performance profile showing quality score, letter grade, completion rate, customer reviews, and staff reports. Track how you're doing over time.",
    url: "/grinder/scorecard",
  },
  {
    icon: Brain,
    title: "Queue",
    desc: "See where you rank in the AI queue across all open orders. View your factor breakdown, improvement tips, and boost modifiers without revealing other grinders.",
    url: "/grinder/queue",
  },
  {
    icon: Brain,
    title: "Scorecard & Queue Info",
    desc: "Understand how your scorecard grades feed into the AI queue ranking system. Learn the 9 factors that determine your queue position and how to improve.",
    url: "/scorecard-guide",
    isLink: true,
  },
  {
    icon: Bell,
    title: "Status",
    desc: "View alerts from staff, review your strike history, acknowledge new strikes, and manage your availability settings so staff knows when you're ready to work.",
    url: "/grinder/status",
  },
  {
    icon: Calendar,
    title: "Events & Promos",
    desc: "Stay up to date with current events and promotions. Special events can offer bonus earnings, priority assignments, or other incentives for participating grinders.",
    url: "/grinder/events",
  },
  {
    icon: Newspaper,
    title: "Staff Notes",
    desc: "Read the latest platform updates and changes. Stay informed about new features, bug fixes, and improvements that affect how you use the dashboard.",
    url: "/grinder/patch-notes",
  },
  {
    icon: Star,
    title: "Submit Review",
    desc: "Submit customer reviews with ratings and proof screenshots. Reviews help build trust with the platform and can positively impact your scorecard.",
    url: "/grinder/reviews",
  },
  {
    icon: LinkIcon,
    title: "Claim Order",
    desc: "Request to link an existing order to your profile if it wasn't automatically assigned. Staff will review and approve valid claims.",
    url: "/grinder/order-claims",
  },
  {
    icon: CalendarDays,
    title: "Calendar",
    desc: "Your personal activity calendar showing completed orders, upcoming deadlines, events, and other important dates across the platform.",
    url: "/grinder/calendar",
  },
];

const quickTips = [
  { icon: TrendingUp, tip: "Maintain a high completion rate to build your reputation and win more bids." },
  { icon: CalendarClock, tip: "Submit realistic timelines. Missing deadlines can result in strikes." },
  { icon: Send, tip: "Send regular progress updates on active orders to keep staff informed." },
  { icon: Star, tip: "Quality matters. Consistently great work is the fastest path to Elite status." },
  { icon: Zap, tip: "Bid quickly when new orders drop. The 10-minute countdown starts with the first bid." },
  { icon: ArrowUpCircle, tip: "Keep your availability status updated so you get considered for direct assignments." },
  { icon: Crown, tip: "Elite grinders get a higher order limit (5 vs 3), priority queue boosts, and a special theme." },
  { icon: Brain, tip: "Your queue position is influenced by 9 factors. Focus on reliability and quality to climb the ranks." },
];

export default function GrinderGuide() {
  const { grinder, isElite, eliteAccent, eliteGradient, eliteBorder } = useGrinderData();

  if (!grinder) return null;

  return (
    <AnimatedPage className="space-y-6">
      <FadeInUp>
        <Card className="border-0 bg-white/[0.03] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/[0.02] -translate-y-10 translate-x-10" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${eliteGradient} flex items-center justify-center`}>
                <BookOpen className={`w-5 h-5 ${eliteAccent}`} />
              </div>
              Dashboard Features
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Everything you can do from your grinder dashboard. Tap any card to navigate directly to that page.
            </p>
          </CardHeader>
        </Card>
      </FadeInUp>

      <FadeInUp>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featureItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} href={item.url}>
                <Card
                  className="border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/[0.12] active:scale-[0.98] cursor-pointer transition-all duration-200 h-full group"
                  data-testid={`feature-card-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${eliteGradient} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4.5 h-4.5 ${eliteAccent}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1 flex items-center gap-1">
                          {item.title}
                          <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all duration-200" />
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </FadeInUp>

      <FadeInUp>
        <Card className="border-0 bg-white/[0.03] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-amber-500/15"} flex items-center justify-center`}>
                <Lightbulb className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
              </div>
              Quick Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickTips.map(({ icon: TipIcon, tip }, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]" data-testid={`tip-${i}`}>
                  <TipIcon className={`w-4 h-4 mt-0.5 ${eliteAccent} flex-shrink-0`} />
                  <p className="text-xs text-muted-foreground">{tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </FadeInUp>
    </AnimatedPage>
  );
}
