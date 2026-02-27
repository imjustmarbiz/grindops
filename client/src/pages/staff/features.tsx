import { Card, CardContent } from "@/components/ui/card";

import { 
  BookOpen, LayoutDashboard, BarChart3, Wallet, Settings, Brain, 
  ListOrdered, Users, Gavel, FileCheck, FileBarChart, Tv, ScrollText, 
  Calendar, Newspaper, Star, LinkIcon, CalendarDays, Package, DollarSign, ChevronRight,
  MessageSquare
} from "lucide-react";
import { Link } from "wouter";

const features = [
  {
    icon: LayoutDashboard,
    title: "Overview",
    description: "Real-time dashboard with KPIs, order pipeline status, fleet health metrics, and a recent activity feed. Get an at-a-glance view of everything happening across your operation.",
    url: "/",
  },
  {
    icon: Settings,
    title: "Admin",
    description: "Unified command center combining Operations and System settings. Manage orders, assign grinders, handle alerts, review elite requests, manage strikes, toggle bot tracking, and control maintenance mode — all organized into Operations, Management, and System tabs.",
    url: "/admin",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Performance trends and insights over time. Track completion rates, grinder efficiency charts, turnaround times, and identify patterns to optimize your operation.",
    url: "/analytics",
  },
  {
    icon: Wallet,
    title: "Business Wallet",
    description: "Full wallet management system with personal and company wallets. Transfer funds between wallets, request payouts, track transaction history, and manage staff-to-staff transfers with owner approval workflows.",
    url: "/wallets",
  },
  {
    icon: DollarSign,
    title: "Grinder Payouts",
    description: "Process grinder payouts with multi-step approval workflows. Filter by status, grinder name, or date range. Grinders are automatically notified on status changes. Handle disputes and upload payment proof.",
    url: "/payouts",
  },
  {
    icon: Brain,
    title: "AI Queue",
    description: "View AI-ranked grinder suggestions for each order based on 9-factor scoring. Manage the emergency queue, review factor breakdowns, and override suggestions when needed.",
    url: "/queue",
  },
  {
    icon: ListOrdered,
    title: "Orders",
    description: "Full order management table. Create new orders, edit pricing, assign grinders, track status changes, and toggle between rush and standard processing.",
    url: "/orders",
  },
  {
    icon: Users,
    title: "Grinders",
    description: "Manage your grinder roster. View and edit profiles, adjust capacity limits, update tier levels, issue strikes, and handle suspensions.",
    url: "/grinders",
  },
  {
    icon: Gavel,
    title: "Bids",
    description: "Review incoming bids from grinders. Accept, deny, or send counter-offers. Accepted bids prompt grinders to link a Discord ticket channel. Grinders are notified of bid decisions instantly.",
    url: "/bids",
  },
  {
    icon: FileCheck,
    title: "Orders Assigned",
    description: "Track all active and completed assignments. Monitor pay splits, margin percentages, reassignment history, and ensure work is progressing on schedule.",
    url: "/assignments",
  },
  {
    icon: LinkIcon,
    title: "Order Repairs",
    description: "Review and approve grinder repair requests: fix existing orders, claim missing in-progress orders, or add completed orders to their profiles.",
    url: "/order-claims",
  },
  {
    icon: FileBarChart,
    title: "Reports",
    description: "Generate performance reports and activity checkpoints. Add staff notes, track grinder accountability, and document important operational decisions.",
    url: "/reports",
  },
  {
    icon: Tv,
    title: "Streams",
    description: "View grinder Twitch streams with embedded live players. Monitor who is streaming, check stream status, and engage with your grinding team in real time.",
    url: "/streams",
  },
  {
    icon: ScrollText,
    title: "Audit Log",
    description: "Full audit trail of every system action for complete accountability. Track who did what, when, and why across all operations and admin changes.",
    url: "/audit-log",
  },
  {
    icon: Calendar,
    title: "Events & Promos",
    description: "Create and manage events and promotional campaigns for grinders. Schedule special events, set up bonus structures, and drive engagement.",
    url: "/events",
  },
  {
    icon: Newspaper,
    title: "Staff Notes",
    description: "Publish staff notes that get AI-rewritten for the grinder audience. Keep your team informed about platform updates and new features.",
    url: "/patch-notes",
  },
  {
    icon: Star,
    title: "Customer Reviews",
    description: "Approve or reject customer reviews submitted by grinders. Maintain quality control over feedback and ensure only legitimate reviews are published.",
    url: "/reviews",
  },
  {
    icon: CalendarDays,
    title: "Calendar",
    description: "Activity calendar tracking events, deadlines, and milestones across the entire platform. Stay organized with a visual timeline of everything happening.",
    url: "/calendar",
  },
  {
    icon: Package,
    title: "Services",
    description: "Service type analytics showing volume, revenue, and completion rates broken down by service category. Identify your top-performing service lines.",
    url: "/services",
  },
  {
    icon: DollarSign,
    title: "Business (Owner Only)",
    description: "Financial overview with revenue tracking, cost analysis, margin calculations, and profitability metrics. The complete picture of your business performance.",
    url: "/business",
  },
  {
    icon: MessageSquare,
    title: "Discord Customer Service Pipeline",
    description: "Automated customer communication system via Discord. Link customer Discord IDs during manual order creation or ticket setup to enable full lifecycle updates — login/logoff notifications, daily progress reports with proof URLs, completion alerts, and grinder replacement notices. Customers approve completed work through Discord before payouts are created. Slash commands (/requestupdate, /orderstatus, /myorders) let customers check status anytime. Force-approve available for unresponsive customers. Toggle the entire pipeline on/off in Admin > System settings.",
    url: "/admin",
  },
  {
    icon: ScrollText,
    title: "Operations Guide",
    description: "A comprehensive slide-deck walkthrough of every staff and owner page. Step-by-step instructions, key features, and pro tips for the entire dashboard.",
    url: "/staff/ops-guide",
  },
  {
    icon: Brain,
    title: "Scorecard & Queue Info",
    description: "Reference page explaining the letter grading system (A-F), 5 quality score factors, all 9 AI queue factors with weights and tips, and boost modifiers.",
    url: "/scorecard-guide",
  },
];

export default function StaffFeatures() {
  return (
    <div className="space-y-8" data-testid="page-staff-features">
      <div className="flex items-center gap-3 flex-wrap">
        <BookOpen className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight" data-testid="text-features-title">Staff Dashboard Features</h1>
          <p className="text-muted-foreground text-sm mt-1">
            A complete overview of every page available in your staff dashboard. Tap any card to navigate there.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => (
          <Link key={feature.title} href={feature.url}>
            <Card className="border border-border/50 bg-card/60 hover:bg-card/90 hover:border-border active:scale-[0.98] cursor-pointer transition-all duration-200 h-full group" data-testid={`card-feature-${feature.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary/10">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm flex items-center gap-1" data-testid={`text-feature-title-${feature.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                    {feature.title}
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/70 group-hover:translate-x-0.5 transition-all duration-200" />
                  </h3>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed" data-testid={`text-feature-desc-${feature.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
