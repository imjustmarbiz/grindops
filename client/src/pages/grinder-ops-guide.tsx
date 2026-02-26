import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft, ChevronRight, LayoutDashboard, Bell, ClipboardList, ShoppingCart,
  FileText, Gavel, Briefcase, BarChart3, Users, Info, Crown, AlertTriangle,
  DollarSign, Star, Calendar, PartyPopper, ScrollText, Sparkles, CheckCircle,
  ArrowRight
} from "lucide-react";

type Slide = {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  iconColor: string;
  sections: {
    heading: string;
    points: string[];
  }[];
  steps?: string[];
  tip?: string;
};

const slides: Slide[] = [
  {
    id: "welcome",
    title: "Grinder Operations Guide",
    subtitle: "Your complete step-by-step walkthrough for every page on the dashboard",
    icon: Sparkles,
    iconColor: "text-yellow-400",
    sections: [
      {
        heading: "What This Guide Covers",
        points: [
          "Every page on your grinder dashboard explained in detail",
          "Step-by-step instructions for common workflows",
          "Tips to improve your queue position and earnings",
          "How to manage orders, bids, payouts, and more",
        ],
      },
      {
        heading: "Key Concepts",
        points: [
          "Orders go through stages: Open > Bidding > Assigned > In Progress > Completed > Paid Out",
          "Your Queue Position determines order priority \u2014 performance matters",
          "Daily checkups may be required for active orders",
          "Elite grinders get priority access and special perks",
          "All data auto-refreshes every 10\u201330 seconds \u2014 no manual reloading needed",
          "Maintenance Mode: if active, the site may be temporarily restricted while staff performs updates",
        ],
      },
    ],
    tip: "Bookmark this guide and refer back whenever you need help with a specific page.",
  },
  {
    id: "overview",
    title: "Overview (Dashboard)",
    subtitle: "Your home base \u2014 see everything at a glance",
    icon: LayoutDashboard,
    iconColor: "text-blue-400",
    sections: [
      {
        heading: "What You'll See",
        points: [
          "Your profile card with avatar, username, and achievement badges",
          "5 KPI cards: Active Orders, Completed, Total Bids, Pending Bids, Order Limit",
          "Bidding countdown timer for any active bid wars",
          "Performance analytics: earnings, win rate, quality score, on-time rate",
          "Recent assignments list with quick links",
          "AI-generated performance tips personalized to you",
        ],
      },
      {
        heading: "Availability Status",
        points: [
          "Set yourself as Available, Busy, Away, or Offline",
          "Staying 'Available' gives you a queue position boost",
          "Add an optional status note (e.g. 'Back at 5pm')",
        ],
      },
    ],
    steps: [
      "Check your KPIs at the top to see your current workload",
      "Review any bidding countdowns for active bid wars",
      "Read your AI tips for improvement suggestions",
      "Set your availability status so staff knows when you're ready",
    ],
    tip: "Accept the Grinder Rules & Guidelines banner if it appears \u2014 you can't bid until you do.",
  },
  {
    id: "notifications",
    title: "Notifications",
    subtitle: "Stay on top of alerts, announcements, and updates",
    icon: Bell,
    iconColor: "text-amber-400",
    sections: [
      {
        heading: "What You'll See",
        points: [
          "All alerts in chronological order (newest first)",
          "New order drops, payout status changes, bid results, system alerts",
          "Unread count badge on the sidebar \u2014 tracks per-user read state",
          "Each notification shows type, severity, timestamp, and a clickable link",
        ],
      },
      {
        heading: "Clickable Navigation",
        points: [
          "Notifications include direct links to the relevant page",
          "Payout notifications link to Payouts (Approved, Paid, Denied, Pending Approval)",
          "Bid result notifications link to My Bids (accepted or denied)",
          "Click any notification to navigate directly and mark it as read",
        ],
      },
    ],
    steps: [
      "Check for any unread notifications (sidebar badge shows count)",
      "Click a notification to navigate directly to the relevant page",
      "Pay special attention to 'warning' severity alerts \u2014 these are urgent",
      "Payout and bid notifications auto-appear when staff takes action",
    ],
    tip: "Notifications auto-refresh every 10 seconds. Click them to jump straight to the relevant page \u2014 no need to navigate manually.",
  },
  {
    id: "todo",
    title: "To-Do List",
    subtitle: "Your action items in one place \u2014 never miss a step",
    icon: ClipboardList,
    iconColor: "text-violet-400",
    sections: [
      {
        heading: "Auto-Generated Tasks",
        points: [
          "Log In: You need to log into your gaming session",
          "Start Order: Click 'Start Order' on your assignment card",
          "Ticket Response: Accept or decline a Discord ticket",
          "Upload Proof: Submit completion video for payout processing",
        ],
      },
      {
        heading: "Staff Custom Tasks",
        points: [
          "Tasks manually created by staff with title, description, and priority",
          "Mark tasks as 'Done' when completed",
          "Completed tasks move to a history section",
        ],
      },
      {
        heading: "Activity Checkpoint Guide",
        points: [
          "Expandable section explaining what each checkpoint type means",
          "Covers: Log In/Off, Start Order, Ticket Response, Video Proof, Daily Updates",
        ],
      },
    ],
    steps: [
      "Open the To-Do List page from the sidebar",
      "Check the 'Action Required' section for any auto-generated tasks",
      "Click 'Go to My Orders' to handle login/start/ticket tasks",
      "Review any staff-assigned custom tasks and complete them",
      "Mark completed tasks as 'Done' using the checkmark button",
    ],
    tip: "Clear your to-do list daily. Pending tasks can affect your reliability score.",
  },
  {
    id: "available-orders",
    title: "Available Orders",
    subtitle: "Browse open orders, check your queue rank, and place bids",
    icon: ShoppingCart,
    iconColor: "text-emerald-400",
    sections: [
      {
        heading: "Queue Standing Card",
        points: [
          "Shows your average rank, best position, eligible orders, and total grinders",
          "Factor breakdown: Margin, Capacity, Fairness, Reliability, Tier, Quality, Risk",
          "Color-coded bars: Green (70%+), Yellow (40-69%), Red (<40%)",
          "Personalized improvement tips based on your current level",
        ],
      },
      {
        heading: "Replacement Orders",
        points: [
          "Emergency/replacement orders appear in a red-highlighted section at top",
          "These get an Emergency Boost (+25%) in queue ranking",
          "Bidding on these can significantly help your stats",
        ],
      },
      {
        heading: "Order Cards",
        points: [
          "Each shows: MGT #, service type, platform, gamertag, due date, complexity, total bids",
          "Status badges: Rush, Emergency, Elite Early Access, Dashboard (Manual)",
          "Bid button opens Discord for regular orders or an in-app dialog for manual orders",
          "Details button shows the full Order Brief with instructions",
        ],
      },
    ],
    steps: [
      "Check the Queue Standing card to understand your current rank",
      "Look at Replacement Orders first \u2014 these are high priority",
      "Use filters to narrow by Service type and Platform",
      "Click 'Details' on an order to read the full brief",
      "Click 'Place Bid' to submit your bid (Discord or in-app)",
      "For manual bids: enter your bid amount, timeline, and start availability",
    ],
    tip: "Bidding lower margins and faster timelines improves your queue position for future orders.",
  },
  {
    id: "grind-repair",
    title: "Order Repair",
    subtitle: "Your one-stop shop for order auditing and corrections",
    icon: FileText,
    iconColor: "text-orange-400",
    sections: [
      {
        heading: "Three Repair Types",
        points: [
          "Fix Existing Order: Update info on an order already in your dashboard (wrong service, due date, amount, etc.)",
          "Claim Missing Order: Add an in-progress order not currently in your dashboard",
          "Add Completed Order: Submit a completed order that's missing from your profile",
        ],
      },
      {
        heading: "Fix Order Fields",
        points: [
          "Order ID (required): The order from your dashboard that needs fixing",
          "Description (required): What's wrong and what the correct info should be",
          "Optional corrections: Service, due date, grinder amount",
          "Proof links and notes to support your request",
        ],
      },
      {
        heading: "Claim / Add Order Fields",
        points: [
          "Ticket Name (required): The Discord ticket channel name",
          "Order ID (optional): If you know it",
          "Service: Select from the dropdown",
          "Proof Links: URLs showing your work",
          "Dates: Due date, start date, completion date (required for Add Completed)",
          "Payout: Your amount, platform (Zelle, PayPal, etc.), and details",
        ],
      },
    ],
    steps: [
      "Navigate to 'Order Repair' in the sidebar",
      "Select the repair type that matches your situation",
      "Fill in the required fields for your chosen type",
      "Add proof links and supporting details",
      "Click 'Submit Repair Request' and wait for staff approval",
    ],
    tip: "The more details you provide (especially proof and exact corrections), the faster staff can approve your request.",
  },
  {
    id: "my-bids",
    title: "My Bids",
    subtitle: "Track all your bid submissions and their outcomes",
    icon: Gavel,
    iconColor: "text-blue-400",
    sections: [
      {
        heading: "What You'll See",
        points: [
          "All bids organized by status: Pending, Accepted, Lost/Denied",
          "Each bid shows: order info, amount, timeline, submission date",
          "Accepted bids link to the order and Discord ticket",
          "Lost bids help you understand competitive pricing",
        ],
      },
      {
        heading: "Editing Bids",
        points: [
          "You can edit Pending bids (amount, timeline, start date)",
          "Click the pencil icon on a pending bid to modify it",
          "Once accepted or denied, bids are locked",
        ],
      },
      {
        heading: "Discord Ticket Linking",
        points: [
          "When a bid is accepted, a prompt appears to link the Discord ticket channel",
          "Enter the Discord channel ID (17\u201320 digit snowflake ID)",
          "This connects the order to its Discord support thread",
          "You can skip and link it later from your assignment card",
        ],
      },
    ],
    steps: [
      "Open 'My Bids' from the sidebar",
      "Use the status filter tabs to find specific bids",
      "For pending bids: click the edit icon to adjust your offer",
      "When a bid is accepted: enter the Discord ticket channel ID when prompted",
      "For accepted bids: click 'Join Ticket' to open the Discord channel",
      "Review lost bids to learn from competitive pricing patterns",
    ],
    tip: "When your bid is accepted, the ticket link prompt appears automatically. Have the Discord channel ID ready for a smooth workflow.",
  },
  {
    id: "my-orders",
    title: "My Orders (Assignments)",
    subtitle: "Manage active work, track progress, and complete orders",
    icon: Briefcase,
    iconColor: "text-purple-400",
    sections: [
      {
        heading: "Assignment Card Actions (In Order)",
        points: [
          "1. Join Ticket \u2014 Open the Discord ticket channel",
          "2. Start Order \u2014 Marks the order as 'In Progress' (requires login first)",
          "3. Log In \u2014 Click when starting a gaming session (shows platform icon)",
          "4. Log Off \u2014 Click when ending a session",
          "5. Submit Update \u2014 Send progress notes to staff",
          "6. Report Issue \u2014 Flag problems with the order",
          "7. View History \u2014 See all checkpoints and activity logs",
          "8. Mark Complete \u2014 Finish the order and upload proof",
        ],
      },
      {
        heading: "Completion Flow",
        points: [
          "Upload video proof showing completed work AND account removal",
          "Select or enter your payout method (Zelle, PayPal, Cash App, etc.)",
          "Save your payout method for future orders",
          "A payout request is automatically created upon completion",
        ],
      },
      {
        heading: "Ticket Acknowledgment",
        points: [
          "When a ticket is created, you'll see Accept/Decline buttons",
          "Accept to confirm you're working the order",
          "Decline requires a reason and creates an issue report",
        ],
      },
    ],
    steps: [
      "Open 'My Orders' from the sidebar",
      "Filter by status: In Progress, Needs Payout, Payout Pending, Paid Out",
      "For a new assignment: Join Ticket > Accept Ticket > Log In > Start Order",
      "While working: submit regular updates and log in/off for each session",
      "When done: click 'Mark Complete', upload proof video, enter payout info",
      "After completion: track your payout status on the Payouts page",
    ],
    tip: "Follow the button order strictly: Ticket > Login > Start > Work > Complete. Skipping steps affects your reliability score.",
  },
  {
    id: "scorecard",
    title: "My Scorecard",
    subtitle: "See your grades, metrics, and performance reports",
    icon: BarChart3,
    iconColor: "text-cyan-400",
    sections: [
      {
        heading: "Overall Grade",
        points: [
          "Letter grade (A-F) based on your quality score",
          "A = 90-100, B = 80-89, C = 70-79, D = 60-69, F = Below 60",
        ],
      },
      {
        heading: "Key Metrics",
        points: [
          "On-Time Rate: Percentage of orders delivered by due date",
          "Completion Rate: Orders finished vs. cancelled",
          "Win Rate: Bids accepted vs. total bids",
          "Daily Update Compliance: Consistency of progress reports",
        ],
      },
      {
        heading: "Reports & Reviews",
        points: [
          "Staff-generated performance reports for each assignment",
          "Order logs showing your update history",
          "Approved customer reviews with star ratings",
        ],
      },
    ],
    steps: [
      "Open 'My Scorecard' from the sidebar",
      "Check your overall letter grade at the top",
      "Review each metric to identify areas for improvement",
      "Read staff reports for specific feedback on past orders",
      "Check customer reviews for external validation",
    ],
    tip: "Focus on improving your weakest metric first. Even small improvements can bump you up a letter grade.",
  },
  {
    id: "queue",
    title: "Queue Position",
    subtitle: "Understand where you stand for incoming orders",
    icon: Users,
    iconColor: "text-indigo-400",
    sections: [
      {
        heading: "Queue Factors (9 Total)",
        points: [
          "Margin: How much profit you leave for the business",
          "Capacity: Available slots for new orders",
          "Tier: Your grinder rank (Elite gets a boost)",
          "Fairness: Time since your last assignment",
          "Reliability: On-time and completion rates",
          "Quality: Average quality rating from staff",
          "New Grinder: Boost for newer members",
          "Risk: Strikes and cancellation history",
          "Emergency Boost: +25% for replacement orders",
        ],
      },
      {
        heading: "Reading Your Position",
        points: [
          "Average Rank: Your typical position across all open orders",
          "Best Position: Your highest rank on any single order",
          "Eligible Orders: How many orders you qualify for",
        ],
      },
    ],
    steps: [
      "Open 'Queue' from the sidebar",
      "Review your standing stats at the top",
      "Examine each factor's score and weight",
      "Read improvement tips for low-scoring factors",
      "Take action on the suggested improvements",
    ],
    tip: "Queue position is a guide, not a guarantee. Staff can override assignments. Focus on being consistently good across all factors.",
  },
  {
    id: "scorecard-guide",
    title: "Scorecard & Queue Info",
    subtitle: "Deep dive into how grading and queue ranking work",
    icon: Info,
    iconColor: "text-teal-400",
    sections: [
      {
        heading: "What This Page Explains",
        points: [
          "Letter grading system (A-F) with score ranges",
          "5 quality score factors with their weights",
          "All 9 AI queue factors with weights, tips, and icons",
          "Boost modifiers: Emergency (+25%), Large Order Elite (+15%)",
          "Disclaimer that queue position is a guide, not a guarantee",
        ],
      },
    ],
    steps: [
      "Open 'Scorecard & Queue Info' from the sidebar",
      "Read through each section to understand how you're evaluated",
      "Note the weight of each factor \u2014 higher weight = more impact",
      "Use the tips to plan your improvement strategy",
    ],
    tip: "This is a reference page. Read it once thoroughly, then revisit when you want to improve a specific factor.",
  },
  {
    id: "status",
    title: "Grinder Status",
    subtitle: "Manage your role, elite progress, and Twitch integration",
    icon: Crown,
    iconColor: "text-yellow-400",
    sections: [
      {
        heading: "Elite Progress",
        points: [
          "Compare your metrics against Elite averages",
          "See a readiness indicator: Ready, Close, Not Yet",
          "Submit a 'Request Elite Status' when you meet thresholds",
          "Track request history with staff decision notes",
        ],
      },
      {
        heading: "Twitch Integration",
        points: [
          "Link your Twitch username so staff can watch your streams",
          "Your stream status shows on staff's Content Multiplayer page",
          "Auto-creates stream_live/stream_offline checkpoints when you go live",
          "Streaming while working can positively impact your profile",
        ],
      },
    ],
    steps: [
      "Open 'Grinder Status' from the sidebar",
      "Review your metrics vs. Elite averages",
      "If metrics look good, click 'Request Elite Status'",
      "To link Twitch: enter your Twitch username and save",
      "Verify your stream shows on the dashboard when live",
    ],
    tip: "Elite grinders get early access to high-value orders and a 15% boost on large orders.",
  },
  {
    id: "strikes",
    title: "Strikes & Policy",
    subtitle: "View disciplinary records, fines, and submit appeals",
    icon: AlertTriangle,
    iconColor: "text-red-400",
    sections: [
      {
        heading: "Strike System",
        points: [
          "Track your active strike count (out of 3 max)",
          "Fine schedule: 1st = $25, 2nd = $50, 3rd+ = $100",
          "3 strikes = account suspension",
          "View outstanding fines and unpaid amounts",
        ],
      },
      {
        heading: "Appeals",
        points: [
          "Submit an appeal with a written reason for any strike",
          "Staff reviews and approves/denies appeals",
          "Approved appeals auto-remove the strike and waive the fine",
          "Track appeal status in 'My Appeals' section",
        ],
      },
      {
        heading: "Policy Rules",
        points: [
          "Actions that cause strikes: missed deadlines, no-shows, quality issues",
          "The fine schedule and escalation process are displayed on this page",
        ],
      },
    ],
    steps: [
      "Open 'Strikes & Policy' from the sidebar",
      "Check your strike count and any outstanding fines",
      "To appeal: click 'Appeal' on a specific strike, write your reason, submit",
      "Monitor the 'My Appeals' section for staff responses",
      "Review the policy section to understand what causes strikes",
    ],
    tip: "Appeals with clear explanations and context are more likely to be approved. Be honest and specific.",
  },
  {
    id: "payouts",
    title: "Payouts",
    subtitle: "Track earnings, approve payouts, and handle disputes",
    icon: DollarSign,
    iconColor: "text-emerald-400",
    sections: [
      {
        heading: "Earnings Overview",
        points: [
          "Total Earned: All-time confirmed payouts",
          "In Pipeline: Pending payouts awaiting processing",
          "Active Earnings: Money from currently active orders",
        ],
      },
      {
        heading: "Payout Workflow",
        points: [
          "1. Complete an order and upload proof",
          "2. Payout request is auto-created",
          "3. You review and approve the payout details",
          "4. Staff processes and sends the payment",
          "5. Status updates to 'Paid'",
        ],
      },
      {
        heading: "Disputes",
        points: [
          "Disagree with payout amount or method? Submit a dispute",
          "Provide your reason and requested adjustment",
          "Staff reviews and resolves the dispute",
        ],
      },
      {
        heading: "Real-Time Notifications",
        points: [
          "You receive a notification when your payout status changes",
          "Statuses tracked: Approved, Paid, Denied, Pending Approval",
          "Notifications link directly to the Payouts page for quick review",
          "Data refreshes every 10 seconds so you always see the latest status",
        ],
      },
    ],
    steps: [
      "Open 'Payouts' from the sidebar",
      "Review your earnings KPIs at the top",
      "Check for any payouts awaiting your approval",
      "Click 'Approve' to confirm correct payout details",
      "If something is wrong: click 'Dispute' and explain the issue",
      "Filter by status to track payment history",
      "Watch for payout notifications \u2014 they link directly here",
    ],
    tip: "Approve payouts quickly. You'll get a notification the moment staff updates your payout status.",
  },
  {
    id: "reviews",
    title: "Reviews",
    subtitle: "Manage customer feedback and generate review access codes",
    icon: Star,
    iconColor: "text-yellow-400",
    sections: [
      {
        heading: "Customer Review Flow",
        points: [
          "1. Generate an 8-character access code (valid 7 days)",
          "2. Share the code + review page link with your customer",
          "3. Customer enters code + their name to request access",
          "4. You approve/deny their request",
          "5. Customer submits their review",
          "6. Staff gives final approval before it goes public",
        ],
      },
      {
        heading: "Direct Submission",
        points: [
          "You can submit a review on behalf of a customer",
          "Include the customer's name, rating, feedback, and proof links",
          "Still requires staff approval before it counts",
        ],
      },
    ],
    steps: [
      "Open 'Reviews' from the sidebar",
      "Click 'Generate Access Code' to create a new code",
      "Copy and send the code + link to your customer",
      "Check the 'Requests' tab for pending customer access requests",
      "Approve valid requests so customers can submit their review",
      "Alternatively: submit a review directly using the form",
    ],
    tip: "Positive customer reviews boost your quality score and improve your queue position.",
  },
  {
    id: "calendar",
    title: "Calendar",
    subtitle: "See your activity history on a visual timeline",
    icon: Calendar,
    iconColor: "text-pink-400",
    sections: [
      {
        heading: "Activity Types (Color-Coded)",
        points: [
          "Assignments: When orders were assigned to you",
          "Completions: When you finished orders",
          "Bids: When you placed bid submissions",
          "Payouts: When payments were processed",
          "Strikes: When disciplinary actions occurred",
          "Staff Alerts: When important announcements were made",
        ],
      },
    ],
    steps: [
      "Open 'Calendar' from the sidebar",
      "Browse months to see your activity patterns",
      "Click on a specific date to see detailed activity for that day",
      "Use the color legend to identify different event types",
    ],
    tip: "Consistent daily activity (logins, updates) shows reliability. Gaps may raise flags with staff.",
  },
  {
    id: "events",
    title: "Events & Promos",
    subtitle: "Stay updated on promotions, in-game events, and bonus opportunities",
    icon: PartyPopper,
    iconColor: "text-orange-400",
    sections: [
      {
        heading: "What You'll See",
        points: [
          "Active promotions with discount percentages or bonuses",
          "In-game events relevant to grinding services",
          "General announcements from staff",
          "Time-sensitive opportunities you can take advantage of",
        ],
      },
    ],
    steps: [
      "Open 'Events & Promos' from the sidebar",
      "Check for any active promotions or bonus opportunities",
      "Note any in-game events that affect grinding strategies",
      "Act quickly on time-limited promotions",
    ],
    tip: "Events like Double XP weekends are great for completing orders faster and boosting your turnaround time.",
  },
  {
    id: "patch-notes",
    title: "Staff Notes",
    subtitle: "Read platform updates, changes, and improvement notes from staff",
    icon: ScrollText,
    iconColor: "text-slate-400",
    sections: [
      {
        heading: "What You'll See",
        points: [
          "Technical updates and platform changes",
          "New feature announcements",
          "Process changes that affect how you work",
          "Each note has a title, date, and formatted description",
        ],
      },
    ],
    steps: [
      "Open 'Staff Notes' from the sidebar",
      "Read the latest notes at the top",
      "Pay attention to any workflow changes that affect you",
    ],
    tip: "Check this page after you notice anything different on the dashboard \u2014 changes are documented here.",
  },
  {
    id: "features",
    title: "Features Guide",
    subtitle: "A comprehensive overview of every dashboard capability",
    icon: Sparkles,
    iconColor: "text-violet-400",
    sections: [
      {
        heading: "What You'll See",
        points: [
          "Descriptions of every page and its purpose",
          "Feature lists for each section of the dashboard",
          "Helpful for onboarding and understanding the full platform",
        ],
      },
    ],
    steps: [
      "Open 'Features' from the sidebar",
      "Browse each page description to learn what's available",
      "Use this as a reference when you're unsure what a page does",
    ],
    tip: "This is your quick-reference guide. Combined with this Operations Guide, you'll know the platform inside out.",
  },
  {
    id: "workflow-summary",
    title: "Daily Workflow Summary",
    subtitle: "The ideal daily routine for a high-performing grinder",
    icon: CheckCircle,
    iconColor: "text-emerald-400",
    sections: [
      {
        heading: "Morning Routine",
        points: [
          "1. Check Notifications for any urgent alerts or new order drops",
          "2. Open To-Do List and clear any pending action items",
          "3. Set your Availability Status to 'Available'",
          "4. Check Available Orders for new opportunities",
        ],
      },
      {
        heading: "While Working",
        points: [
          "5. Log In on your assignment card before starting a session",
          "6. Click Start Order if you haven't already",
          "7. Submit progress Updates regularly",
          "8. Log Off when ending a session",
        ],
      },
      {
        heading: "Completing Orders",
        points: [
          "9. Click Mark Complete when finished",
          "10. Upload video proof (work completed + account removed)",
          "11. Enter payout details and submit",
          "12. Approve the payout request on the Payouts page",
        ],
      },
      {
        heading: "End of Day",
        points: [
          "13. Review your Scorecard for any metric changes",
          "14. Check for new Events & Promos",
          "15. Clear any remaining To-Do items",
        ],
      },
    ],
    tip: "Consistency is king. Following this routine daily will maximize your queue position, earnings, and reputation.",
  },
];

export default function GrinderOpsGuide() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = slides[currentSlide];
  const SlideIcon = slide.icon;

  const goNext = useCallback(() => setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1)), []);
  const goPrev = useCallback(() => setCurrentSlide(prev => Math.max(prev - 1, 0)), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2.5 sm:px-6 sm:py-4 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white" data-testid="text-ops-guide-title">Grinder Operations Guide</h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground">Step-by-step walkthrough for every page</p>
        </div>
        <Badge variant="outline" className="border-white/10 text-muted-foreground text-[10px] sm:text-xs shrink-0 ml-2">
          {currentSlide + 1} / {slides.length}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl mx-auto">
          <Card className="border-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] shadow-2xl shadow-black/40 overflow-hidden" data-testid={`slide-${slide.id}`}>
            <div className={`h-1 sm:h-1.5 bg-gradient-to-r ${currentSlide === 0 ? "from-yellow-500 via-amber-500 to-orange-500" : currentSlide === slides.length - 1 ? "from-emerald-500 via-green-500 to-teal-500" : "from-blue-500 via-purple-500 to-violet-500"}`} />

            <CardContent className="p-4 sm:p-6 lg:p-10 space-y-4 sm:space-y-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <SlideIcon className={`w-5 h-5 sm:w-7 sm:h-7 ${slide.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white" data-testid="text-slide-title">{slide.title}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">{slide.subtitle}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {slide.sections.map((section, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg sm:rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-5 space-y-2 sm:space-y-3 ${slide.sections.length === 1 ? "md:col-span-2" : ""}`}
                  >
                    <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white/70">{section.heading}</h3>
                    <ul className="space-y-1.5 sm:space-y-2">
                      {section.points.map((point, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2 sm:gap-2.5 text-xs sm:text-sm text-white/80">
                          <span className="mt-1.5 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white/30 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {slide.steps && (
                <div className="rounded-lg sm:rounded-xl border border-blue-500/15 bg-blue-500/[0.04] p-3 sm:p-5 space-y-2 sm:space-y-3">
                  <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Step-by-Step
                  </h3>
                  <ol className="space-y-1.5 sm:space-y-2">
                    {slide.steps.map((step, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-white/80">
                        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-500/20 text-blue-400 text-[10px] sm:text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {sIdx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {slide.tip && (
                <div className="rounded-lg sm:rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-amber-400 mb-0.5 sm:mb-1">Pro Tip</p>
                    <p className="text-xs sm:text-sm text-white/80">{slide.tip}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="px-3 py-2.5 sm:px-6 sm:py-4 border-t border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 sm:gap-2 border-white/10 text-white/70 hover:text-white text-xs sm:text-sm px-2 sm:px-4"
            onClick={goPrev}
            disabled={currentSlide === 0}
            data-testid="button-prev-slide"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Previous</span><span className="sm:hidden">Prev</span>
          </Button>

          <div className="hidden md:flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? "bg-white w-6" : "bg-white/20 hover:bg-white/40"}`}
                data-testid={`dot-slide-${idx}`}
              />
            ))}
          </div>

          <span className="md:hidden text-[10px] text-white/40">{currentSlide + 1}/{slides.length}</span>

          <Button
            size="sm"
            className="gap-1 sm:gap-2 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm px-2 sm:px-4"
            onClick={goNext}
            disabled={currentSlide === slides.length - 1}
            data-testid="button-next-slide"
          >
            Next <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>

      <div className="hidden sm:block px-3 sm:px-6 py-2 sm:py-3 border-t border-white/[0.04] bg-white/[0.01]">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-1 sm:gap-1.5 justify-center">
            {slides.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md transition-all ${idx === currentSlide ? "bg-white/15 text-white font-medium" : "text-white/30 hover:text-white/60 hover:bg-white/[0.05]"}`}
                data-testid={`nav-slide-${s.id}`}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
