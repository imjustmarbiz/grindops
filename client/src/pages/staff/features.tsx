import { Card, CardContent } from "@/components/ui/card";
import { HelpTip } from "@/components/help-tip";
import { 
  BookOpen, LayoutDashboard, Wrench, BarChart3, Wallet, Settings, Brain, 
  ListOrdered, Users, Gavel, FileCheck, FileBarChart, Tv, ScrollText, 
  Calendar, Newspaper, Star, LinkIcon, CalendarDays, Package, DollarSign 
} from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Overview",
    description: "Real-time dashboard with KPIs, order pipeline status, fleet health metrics, and a recent activity feed. Get an at-a-glance view of everything happening across your operation."
  },
  {
    icon: Wrench,
    title: "Operations",
    description: "Day-to-day order management hub. Quickly assign orders, change statuses, manage grinder workflows, and handle urgent operational tasks all from one place."
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Performance trends and insights over time. Track completion rates, grinder efficiency charts, turnaround times, and identify patterns to optimize your operation."
  },
  {
    icon: Wallet,
    title: "Payouts",
    description: "Process grinder payouts with multi-step approval workflows. Handle disputes, view complete payment history, and manage payout schedules efficiently."
  },
  {
    icon: Settings,
    title: "Admin",
    description: "System configuration center. Adjust AI queue weights, manage daily checkup controls, toggle global settings, and fine-tune how the platform operates."
  },
  {
    icon: Brain,
    title: "AI Queue",
    description: "View AI-ranked grinder suggestions for each order based on 9-factor scoring. Manage the emergency queue, review factor breakdowns, and override suggestions when needed."
  },
  {
    icon: ListOrdered,
    title: "Orders",
    description: "Full order management table. Create new orders, edit pricing, assign grinders, track status changes, and toggle between rush and standard processing."
  },
  {
    icon: Users,
    title: "Grinders",
    description: "Manage your grinder roster. View and edit profiles, adjust capacity limits, update tier levels, issue strikes, and handle suspensions."
  },
  {
    icon: Gavel,
    title: "Bids",
    description: "Review incoming bids from grinders. Accept, deny, or send counter-offers. View complete bid history and manage the bidding process for open orders."
  },
  {
    icon: FileCheck,
    title: "Assignments",
    description: "Track all active and completed assignments. Monitor pay splits, margin percentages, reassignment history, and ensure work is progressing on schedule."
  },
  {
    icon: FileBarChart,
    title: "Reports",
    description: "Generate performance reports and activity checkpoints. Add staff notes, track grinder accountability, and document important operational decisions."
  },
  {
    icon: Tv,
    title: "Streams",
    description: "View grinder Twitch streams with embedded live players. Monitor who is streaming, check stream status, and engage with your grinding team in real time."
  },
  {
    icon: ScrollText,
    title: "Audit Log",
    description: "Full audit trail of every system action for complete accountability. Track who did what, when, and why across all operations and admin changes."
  },
  {
    icon: Calendar,
    title: "Events & Promos",
    description: "Create and manage events and promotional campaigns for grinders. Schedule special events, set up bonus structures, and drive engagement."
  },
  {
    icon: Newspaper,
    title: "Patch Notes",
    description: "Publish development patch notes that get AI-rewritten for the grinder audience. Keep your team informed about platform updates and new features."
  },
  {
    icon: Star,
    title: "Reviews",
    description: "Approve or reject customer reviews submitted by grinders. Maintain quality control over feedback and ensure only legitimate reviews are published."
  },
  {
    icon: LinkIcon,
    title: "Order Claims",
    description: "Approve or reject grinder requests to link existing orders to their profiles. Verify claims and maintain accurate order attribution records."
  },
  {
    icon: CalendarDays,
    title: "Calendar",
    description: "Activity calendar tracking events, deadlines, and milestones across the entire platform. Stay organized with a visual timeline of everything happening."
  },
  {
    icon: Package,
    title: "Services",
    description: "Service type analytics showing volume, revenue, and completion rates broken down by service category. Identify your top-performing service lines."
  },
  {
    icon: DollarSign,
    title: "Business (Owner Only)",
    description: "Financial overview with revenue tracking, cost analysis, margin calculations, and profitability metrics. The complete picture of your business performance."
  },
];

export default function StaffFeatures() {
  return (
    <div className="space-y-8" data-testid="page-staff-features">
      <div className="flex items-center gap-3 flex-wrap">
        <BookOpen className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-features-title">Staff Dashboard Features</h1>
          <p className="text-muted-foreground text-sm mt-1">
            A complete overview of every page available in your staff dashboard.
          </p>
        </div>
        <HelpTip text="This page lists all the tools and pages available to staff members. Use the sidebar to navigate to any of these features." />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => (
          <Card key={feature.title} className="bg-card/60 border-border/50" data-testid={`card-feature-${feature.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm" data-testid={`text-feature-title-${feature.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{feature.title}</h3>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed" data-testid={`text-feature-desc-${feature.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}