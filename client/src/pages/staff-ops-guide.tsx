import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft, ChevronRight, LayoutDashboard, Wrench, BarChart3, Wallet,
  Settings, Brain, ListOrdered, Users, Gavel, FileCheck, FileBarChart,
  Tv, ScrollText, Calendar, Newspaper, Star, CalendarDays, Package,
  DollarSign, BookOpen, LinkIcon, Sparkles, CheckCircle, ArrowRight,
  Shield, Search, Bell, Target, TrendingUp, AlertTriangle, ClipboardList, Award
} from "lucide-react";

type Slide = {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  iconColor: string;
  ownerOnly?: boolean;
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
    title: "Staff Operations Guide",
    subtitle: "Complete walkthrough of every management page on the dashboard",
    icon: Sparkles,
    iconColor: "text-[#4cadd0]",
    sections: [
      {
        heading: "What This Guide Covers",
        points: [
          "Every staff and owner management page explained in detail",
          "Step-by-step workflows for common tasks",
          "Tips for efficient order management and grinder oversight",
          "Financial tracking, reporting, and analytics guidance",
        ],
      },
      {
        heading: "Key Concepts",
        points: [
          "Orders flow: Open \u2192 Bidding \u2192 Assigned \u2192 In Progress \u2192 Completed \u2192 Paid Out",
          "The AI Queue ranks grinders using 9 weighted factors",
          "Staff can override assignments, create manual orders, and manage payouts",
          "Owner-only pages provide financial insights and business performance data",
        ],
      },
    ],
    tip: "Use keyboard arrow keys or spacebar to navigate slides. Bookmark this page for quick reference.",
  },
  {
    id: "notifications",
    title: "Notifications",
    subtitle: "System alerts, updates, and important messages in one inbox",
    icon: Bell,
    iconColor: "text-amber-400",
    sections: [
      {
        heading: "Notification Inbox",
        points: [
          "View all system notifications in a single, organized feed",
          "Severity-coded alerts: Info (blue), Warning (amber), Success (green), Danger (red)",
          "Unread notifications are highlighted with a bold indicator",
          "Unread count badge shown in the sidebar and header bell icon",
        ],
      },
      {
        heading: "Managing Notifications",
        points: [
          "Click any unread notification to mark it as read",
          "\"Mark All Read\" button clears all unread indicators at once",
          "Notifications include: new orders, system alerts, grinder updates",
          "Auto-refreshes every 10 seconds for real-time awareness",
        ],
      },
    ],
    steps: [
      "Check the notification bell badge for unread count",
      "Open the Notifications page to review all alerts",
      "Click unread notifications to mark them as read",
      "Use 'Mark All Read' when catching up on a backlog",
    ],
    tip: "Check notifications at the start of each shift. The severity badges help you prioritize — handle Danger and Warning alerts first.",
  },
  {
    id: "todo",
    title: "To-Do List",
    subtitle: "Assign and track tasks between staff members and owners",
    icon: ClipboardList,
    iconColor: "text-indigo-400",
    sections: [
      {
        heading: "Task Assignment",
        points: [
          "Create tasks for other staff members or owners",
          "Set priority levels: Normal, High, or Urgent",
          "Optionally link tasks to specific orders for context",
          "Include detailed descriptions for complex tasks",
        ],
      },
      {
        heading: "Task Management",
        points: [
          "\"My Tasks\" shows pending tasks assigned to you, sorted by priority",
          "\"Tasks I Assigned\" shows tasks you've delegated to others",
          "Mark tasks as complete with a single click",
          "Completed tasks are archived in a collapsible section",
          "All task actions are logged in the audit trail",
        ],
      },
    ],
    steps: [
      "Select a staff member or owner from the dropdown",
      "Write a clear task title and optional description",
      "Choose priority (Urgent tasks appear first)",
      "Optionally link to an order ID for context",
      "Submit — the assignee will see it immediately in their To-Do List",
    ],
    tip: "Use Urgent priority sparingly for truly time-sensitive items. High priority is usually sufficient for important tasks.",
  },
  {
    id: "overview",
    title: "Overview (Command Center)",
    subtitle: "Real-time snapshot of business health and the order pipeline",
    icon: LayoutDashboard,
    iconColor: "text-blue-400",
    sections: [
      {
        heading: "Financial Stats",
        points: [
          "Total Revenue: Income from all non-cancelled orders",
          "Grinder Payouts: Total paid or owed to grinders",
          "Company Profit: Revenue minus payouts with margin percentage",
          "Avg Order Value: Average price per order across the system",
        ],
      },
      {
        heading: "Operational Panels",
        points: [
          "Global search bar for orders, grinders, and bids",
          "Bidding countdown panel showing active bid wars",
          "Order Pipeline: visual breakdown by status (Open through Paid Out)",
          "Fleet Health: grinder capacity, utilization rate, availability",
          "Recent Activity: live audit log of system actions",
        ],
      },
    ],
    steps: [
      "Check the financial stats row for daily revenue and profit",
      "Review the order pipeline for bottlenecks (too many in one status)",
      "Check fleet health to see if grinders are available or at capacity",
      "Use the search bar to quickly find specific orders or grinders",
      "Monitor the bidding countdown for any active bid wars",
    ],
    tip: "Fleet Utilization shows what percentage of total capacity is in use. If it's above 85%, consider onboarding more grinders.",
  },
  {
    id: "operations",
    title: "Operations",
    subtitle: "Day-to-day fulfillment tools and manual interventions",
    icon: Wrench,
    iconColor: "text-orange-400",
    sections: [
      {
        heading: "Manual Order Creation",
        points: [
          "Create orders that bypass the standard customer flow",
          "Set service, platform, gamertag, complexity (1-5), and price",
          "Toggle whether the order is visible for grinder bidding",
          "Useful for VIP customers or internal testing",
        ],
      },
      {
        heading: "Staff Override & Alerts",
        points: [
          "Override Assignment: force-assign any grinder to any order",
          "Set custom grinder pay to calculate profit margins on the fly",
          "Staff Alerts: broadcast Info, Success, or Urgent alerts to all grinders",
          "Discord Ticket Linking: connect orders to Discord support channels",
          "Send Tasks: create custom to-do items for specific grinders",
        ],
      },
    ],
    steps: [
      "To create a manual order: fill in the form and click 'Create Order'",
      "To override assign: select an order, pick a grinder, set pay, confirm",
      "To send an alert: choose severity, write message, select audience, send",
      "To link a ticket: enter the order ID and Discord channel name",
      "To send a task: pick a grinder, write the task title/description, submit",
    ],
    tip: "Override assignments skip the queue system entirely. Use sparingly to maintain grinder trust in the AI queue.",
  },
  {
    id: "analytics",
    title: "Analytics",
    subtitle: "Long-term performance trends, efficiency metrics, and insights",
    icon: BarChart3,
    iconColor: "text-emerald-400",
    sections: [
      {
        heading: "Revenue & Performance",
        points: [
          "Revenue Split: visual comparison of Payouts vs. Company Profit",
          "Profit Margin %: percentage of revenue retained",
          "On-Time Rate: fleet-wide deadline compliance",
          "Bid Conversion Rate: percentage of bids that get accepted",
        ],
      },
      {
        heading: "Fleet & Service Analysis",
        points: [
          "Fleet Utilization: individual progress bars for top grinders",
          "Top Earners: leaderboard by total earnings",
          "Service Distribution: which services generate the most revenue",
          "Elite vs. Grinder Metrics: tier-based performance comparison",
        ],
      },
    ],
    steps: [
      "Review the revenue split ring to check profit health",
      "Check bid conversion to see if grinders are pricing competitively",
      "Look at service distribution to identify high-demand services",
      "Compare Elite vs. Grinder metrics for tier evaluation",
      "Monitor fleet utilization to identify overworked or idle grinders",
    ],
    tip: "If bid conversion is low, grinders may be overbidding. Consider setting price guidance on the alerts system.",
  },
  {
    id: "payouts",
    title: "Payouts",
    subtitle: "Financial fulfillment, dispute resolution, and payment tracking",
    icon: Wallet,
    iconColor: "text-green-400",
    sections: [
      {
        heading: "Payout Pipeline",
        points: [
          "Outstanding Liabilities: total unpaid amounts owed to grinders",
          "Multi-step approval: Pending \u2192 Grinder Approved \u2192 Staff Review \u2192 Paid",
          "Completion proof links: view video evidence before marking as paid",
          "Payout method details: Cash App, PayPal, Zelle, etc.",
          "Payment Proof: upload proof (image/PDF) when marking payouts as paid",
        ],
      },
      {
        heading: "Filters & Reductions",
        points: [
          "Filter payouts by status (Pending, Approved, Paid, etc.) and grinder name",
          "Filters apply before categorization — all sections respect active filters",
          "Clear button resets all filters instantly",
          "Payout Reductions: staff can request a reduction (owner must approve)",
          "Owners can apply reductions directly — difference goes to company profit",
        ],
      },
      {
        heading: "Dispute Handling",
        points: [
          "View disputed payouts where grinders request different amounts",
          "See grinder's reason and requested adjustment",
          "Approve the dispute, adjust the amount, or deny with explanation",
          "All dispute actions are audit-logged",
        ],
      },
    ],
    steps: [
      "Use filters to narrow down payouts by status or grinder name",
      "Check outstanding liabilities at the top for total owed",
      "Review payouts in 'Pending' status that need processing",
      "Click the proof link to verify completion before paying",
      "Upload payment proof when marking payouts as paid",
      "Handle any disputes before processing standard payouts",
    ],
    tip: "Use status filters to focus on one category at a time. Always upload payment proof — it creates an accountability trail.",
  },
  {
    id: "admin",
    title: "Admin",
    subtitle: "System controls, elite requests, daily checkups, and task management",
    icon: Settings,
    iconColor: "text-slate-400",
    sections: [
      {
        heading: "Elite Status Management",
        points: [
          "View pending elite status requests from grinders",
          "See grinder performance stats: Win Rate, Quality, Completion, etc.",
          "Approve or deny with decision notes",
          "Approved grinders get elite perks (priority access, queue boost)",
        ],
      },
      {
        heading: "System Controls",
        points: [
          "Global Daily Checkup toggle: enable/disable for all orders",
          "Per-Order Daily Checkup toggle: exempt specific orders",
          "Send Task to Grinder: create custom to-do items with priority levels",
          "Task management: view and delete custom tasks",
        ],
      },
    ],
    steps: [
      "Review any pending elite requests and check their metrics",
      "Approve or deny with a clear decision note",
      "Toggle daily checkups on/off as needed for operational flexibility",
      "Send custom tasks to grinders for specific follow-ups",
    ],
    tip: "When reviewing elite requests, compare the grinder's metrics to the 'Elite Averages' shown. It helps justify your decision.",
  },
  {
    id: "queue",
    title: "AI Queue",
    subtitle: "Real-time AI ranking of grinders for open orders",
    icon: Brain,
    iconColor: "text-purple-400",
    sections: [
      {
        heading: "9-Factor Scoring System",
        points: [
          "Margin: profit the grinder leaves for the business",
          "Capacity: available slots for new orders",
          "Fairness: time since last assignment",
          "Reliability: on-time and completion rates",
          "Tier: grinder rank (Elite gets a boost)",
          "Quality: average quality rating from staff reviews",
          "New Grinder: boost for newer members",
          "Risk: strike and cancellation history",
          "Emergency Boost: +25% for replacement orders",
        ],
      },
      {
        heading: "How It Works",
        points: [
          "Each open order shows a ranked list of eligible grinders",
          "Scores are calculated in real-time based on current data",
          "Staff can use this to inform assignment decisions",
          "The queue is a recommendation \u2014 staff can always override",
        ],
      },
    ],
    steps: [
      "Select an open order to see the ranked grinder list",
      "Review each grinder's factor scores and total rank",
      "Use this data when deciding assignments or override decisions",
      "Check factor weights to understand what drives rankings",
    ],
    tip: "The queue updates in real-time. A grinder's position changes as they complete orders, get strikes, or adjust bids.",
  },
  {
    id: "orders",
    title: "Orders",
    subtitle: "Master data table for all orders with inline editing",
    icon: ListOrdered,
    iconColor: "text-blue-400",
    sections: [
      {
        heading: "Order Management",
        points: [
          "View all orders with sortable columns (MGT #, Service, Platform, etc.)",
          "Inline editing: click to edit prices, due dates, statuses, and more",
          "Filter by status: Open, In Progress, Completed, Paid Out, Cancelled",
          "Search by order ID, gamertag, or ticket name",
        ],
      },
      {
        heading: "Order Details",
        points: [
          "Each row shows: MGT #, service, platform, gamertag, complexity",
          "Financial columns: Customer Price, Bid amount, Company Profit",
          "Assignment info: which grinder, due date, completion date",
          "Status badges with color-coded indicators",
        ],
      },
    ],
    steps: [
      "Use filters to narrow down orders by status or search terms",
      "Click column headers to sort by any field",
      "Click on an order field to edit it inline (price, date, status)",
      "Check profit column to ensure margins are healthy per order",
    ],
    tip: "Sort by 'Due Date' ascending to see which orders need attention soonest.",
  },
  {
    id: "grinders",
    title: "Grinders",
    subtitle: "Roster management, performance tracking, and scorecards",
    icon: Users,
    iconColor: "text-cyan-400",
    sections: [
      {
        heading: "Grinder Roster",
        points: [
          "Full sortable table: Name, Tier, Capacity, Orders, Earnings, Win Rate, Strikes",
          "Click a grinder to view their detailed profile and scorecard",
          "Achievement badges: Veteran, Punctual, Reliable, Streamer",
          "Strike counter (out of 3) with visual indicators",
        ],
      },
      {
        heading: "Scorecard Details",
        points: [
          "Letter grade (A-F) with quality score breakdown",
          "Performance metrics: On-Time Rate, Completion Rate, Win Rate",
          "Order history and assignment timeline",
          "Strike history and fine records",
        ],
      },
    ],
    steps: [
      "Review the roster to check grinder availability and performance",
      "Click column headers to sort (e.g., by Win Rate or Earnings)",
      "Click a grinder name to view their full scorecard",
      "Check strike counts \u2014 3 strikes means automatic suspension",
    ],
    tip: "Sort by 'Last Order' to identify grinders who haven't been assigned recently. They may need attention or re-engagement.",
  },
  {
    id: "bids",
    title: "Bids",
    subtitle: "Review grinder proposals, margins, and bid management",
    icon: Gavel,
    iconColor: "text-amber-400",
    sections: [
      {
        heading: "Bid Review",
        points: [
          "Sortable table: Order, Grinder, Bid Amount, Margin, Timeline, Status",
          "Margin preview: instantly see how much profit each bid generates",
          "Filter by status: Pending, Accepted, Denied, All",
          "Owner override controls for bid decisions",
        ],
      },
    ],
    steps: [
      "Filter to 'Pending' to see bids awaiting your decision",
      "Compare bid amounts and margins across grinders for the same order",
      "Accept the bid that balances margin with grinder reliability",
      "Deny bids with reason notes visible to the grinder",
    ],
    tip: "Always compare margin AND grinder quality score when choosing bids. A slightly lower margin from a top performer is often worth it.",
  },
  {
    id: "assignments",
    title: "Assignments",
    subtitle: "Active worker-order tracking, replacements, and financial details",
    icon: FileCheck,
    iconColor: "text-violet-400",
    sections: [
      {
        heading: "Assignment Tracking",
        points: [
          "Sortable columns: Order, Grinder, Assigned/Due/Delivered dates",
          "Financial details: Order Price, Grinder Pay, Margin, Profit",
          "Quality rating per assignment from staff reviews",
          "Status tracking: Active, Completed, Cancelled",
        ],
      },
      {
        heading: "Replacement Tools",
        points: [
          "Swap grinders on an active order with custom pay splits",
          "Calculate new profit margins with replacement grinder's rate",
          "Replacement orders are flagged as 'Emergency' for queue boost",
        ],
      },
    ],
    steps: [
      "Filter by status to focus on active or overdue assignments",
      "Sort by 'Due' to identify upcoming deadlines",
      "Check quality ratings for recently completed assignments",
      "Use replacement tools if a grinder can't fulfill an order",
    ],
    tip: "Keep an eye on assignments where the due date is approaching but no 'Start Order' checkpoint exists \u2014 the grinder may not have started.",
  },
  {
    id: "reports",
    title: "Reports",
    subtitle: "Performance reports, activity checkpoints, and order updates",
    icon: FileBarChart,
    iconColor: "text-pink-400",
    sections: [
      {
        heading: "Three Report Tabs",
        points: [
          "Performance Reports: staff-generated reports with letter grades and metric snapshots",
          "Activity Checkpoints: log of logins, ticket acks, start orders, and issues",
          "Order Updates: real-time progress messages from grinders",
        ],
      },
      {
        heading: "Checkpoint Management",
        points: [
          "View all checkpoint types: log_in, log_off, start_order, ticket_ack, daily_update",
          "Edit checkpoint timestamps via pencil icon (audit-logged)",
          "Track streaming activity: stream_live and stream_offline checkpoints",
        ],
      },
    ],
    steps: [
      "Check 'Activity Checkpoints' to verify grinder work patterns",
      "Review 'Order Updates' for progress notes on active orders",
      "Generate performance reports after order completion",
      "Edit checkpoint timestamps if corrections are needed (logged for accountability)",
    ],
    tip: "Cross-reference checkpoint logins with Twitch stream times on the Streams page to verify grinders are actually working when they say they are.",
  },
  {
    id: "streams",
    title: "Streams",
    subtitle: "Live supervision of grinder Twitch streams and active orders",
    icon: Tv,
    iconColor: "text-red-400",
    sections: [
      {
        heading: "Stream Monitoring",
        points: [
          "Grid of embedded Twitch players for linked grinders",
          "Live grinders sorted to the top with 'LIVE' overlay",
          "Active orders displayed on each stream card with ticket links",
          "'No active orders' indicator for idle streamers",
        ],
      },
    ],
    steps: [
      "Open the Streams page to see who is currently live",
      "Click on a stream card to watch the embedded Twitch player",
      "Check the active order badges to see what they're working on",
      "Click ticket links to open the Discord channel for that order",
    ],
    tip: "Grinders who stream while working tend to have better accountability. Encourage Twitch linking during onboarding.",
  },
  {
    id: "audit-log",
    title: "Audit Log",
    subtitle: "Forensic log of every system action for accountability",
    icon: ScrollText,
    iconColor: "text-slate-400",
    sections: [
      {
        heading: "What's Logged",
        points: [
          "Every create, update, and delete action in the system",
          "Who performed the action (actor) and when (timestamp)",
          "Entity type and ID: orders, assignments, grinders, payouts, etc.",
          "Detailed change descriptions with before/after values",
        ],
      },
    ],
    steps: [
      "Use filters to narrow by entity type or action",
      "Sort by timestamp (default: newest first)",
      "Search for a specific grinder or order ID",
      "Review change details for dispute resolution or investigations",
    ],
    tip: "The audit log is your source of truth for any disagreements. Reference it when handling disputes or appeals.",
  },
  {
    id: "events",
    title: "Events & Promos",
    subtitle: "Create promotions, in-game events, and announcements for grinders",
    icon: Calendar,
    iconColor: "text-orange-400",
    sections: [
      {
        heading: "Event Types",
        points: [
          "In-Game Events: track game-specific events (Double XP, new seasons, etc.)",
          "Promotions: set discounts and bonus opportunities for grinders",
          "Announcements: general broadcast messages with priority levels",
          "All events are visible to grinders on their Events & Promos page",
        ],
      },
    ],
    steps: [
      "Click 'Create Event' and select the event type",
      "Fill in title, description, dates, and priority level",
      "For promotions: set discount percentage",
      "Publish \u2014 it appears immediately on grinder dashboards",
    ],
    tip: "Tie promotions to real in-game events (like Double XP weekends) for maximum grinder engagement and faster order completion.",
  },
  {
    id: "patch-notes",
    title: "Staff Notes",
    subtitle: "Publish platform updates and system changes for grinders",
    icon: Newspaper,
    iconColor: "text-slate-400",
    sections: [
      {
        heading: "Note Management",
        points: [
          "Write raw text notes about platform updates or process changes",
          "AI Rewrite feature: automatically polishes notes for grinder audience",
          "Published notes appear on grinders' Staff Notes page",
          "Each note shows title, date, and formatted description",
        ],
      },
    ],
    steps: [
      "Click 'Create Note' and write the raw update text",
      "Optionally use AI Rewrite to polish the language",
      "Preview the formatted output before publishing",
      "Publish \u2014 grinders see it immediately on their dashboard",
    ],
    tip: "Post notes after every significant dashboard change. Grinders appreciate being informed about what's new.",
  },
  {
    id: "reviews",
    title: "Reviews",
    subtitle: "Moderate customer reviews and manage access requests",
    icon: Star,
    iconColor: "text-yellow-400",
    sections: [
      {
        heading: "Review Moderation",
        points: [
          "Queue of pending customer reviews awaiting approval",
          "Star ratings, review text, and proof links for verification",
          "Approve or reject reviews \u2014 approved reviews count toward grinder quality",
          "Review Access Requests: manage customer code-based access",
        ],
      },
    ],
    steps: [
      "Check for pending reviews in the moderation queue",
      "Read the review text and verify the star rating seems genuine",
      "Check proof links if provided",
      "Approve legitimate reviews, reject suspicious ones",
      "Monitor access requests from customers using grinder-generated codes",
    ],
    tip: "Approved reviews directly impact grinder quality scores. Be fair but thorough \u2014 fake reviews hurt everyone.",
  },
  {
    id: "order-claims",
    title: "Missing Order Claims",
    subtitle: "Review and approve grinder requests to claim missing orders",
    icon: LinkIcon,
    iconColor: "text-orange-400",
    sections: [
      {
        heading: "Claim Review Process",
        points: [
          "Grinders submit claims for orders not on their profile",
          "Each claim shows: ticket name, order ID, service, proof links, dates",
          "Payout details: grinder amount, platform, payment info",
          "Staff Fill-In panel: add Customer Price, Platform, Gamertag, Service if missing",
        ],
      },
      {
        heading: "Approval Actions",
        points: [
          "Approve: creates or links the order, assignment, and payout request",
          "If no order ID: a new CLM-xxx order is created automatically",
          "If order ID exists: the existing order is updated with claim data",
          "Deny with a decision note explaining the reason",
        ],
      },
    ],
    steps: [
      "Review pending claims from the list",
      "Verify the ticket name matches a real Discord ticket",
      "Fill in any missing fields in the 'Staff Fill-In' panel",
      "Set the customer price (required for new order creation)",
      "Approve or deny with a decision note",
    ],
    tip: "Claims with completion dates and proof links are typically legitimate. Cross-reference ticket names in Discord before approving.",
  },
  {
    id: "calendar",
    title: "Calendar",
    subtitle: "Unified timeline of all operational activity by date",
    icon: CalendarDays,
    iconColor: "text-pink-400",
    sections: [
      {
        heading: "Activity Types Tracked",
        points: [
          "Order creations and completions",
          "Bid submissions and decisions",
          "Grinder assignments and replacements",
          "Payouts processed",
          "Strikes issued",
          "Audit log entries",
        ],
      },
    ],
    steps: [
      "Browse by month to see operational patterns",
      "Click on a specific date to view detailed activity",
      "Use the color legend to distinguish event types",
      "Look for gaps or spikes in activity that need investigation",
    ],
    tip: "The calendar is great for identifying weekly patterns. Use it to plan your busiest days and staff coverage.",
  },
  {
    id: "services",
    title: "Services Overview",
    subtitle: "Category-specific performance analytics by service and platform",
    icon: Package,
    iconColor: "text-teal-400",
    sections: [
      {
        heading: "Service Analytics",
        points: [
          "Revenue breakdown by service type (VC Grinding, Rep Grinding, etc.)",
          "Platform comparison: PlayStation vs. Xbox vs. PC vs. Nintendo",
          "Average price, completion rate, and SLA compliance per service",
          "Identify highest-grossing and most efficient service categories",
        ],
      },
    ],
    steps: [
      "Review revenue by service to identify top performers",
      "Compare platform metrics to see where demand is highest",
      "Check SLA compliance \u2014 low rates indicate delivery issues",
      "Use this data to inform pricing and staffing decisions",
    ],
    tip: "Services with high revenue but low completion rates need attention. Consider adjusting complexity ratings or pricing.",
  },
  {
    id: "business",
    title: "Business Performance",
    subtitle: "High-level financial health dashboard (Owner Only)",
    icon: DollarSign,
    iconColor: "text-[#fd853f]",
    ownerOnly: true,
    sections: [
      {
        heading: "Financial KPIs",
        points: [
          "Total Revenue: all-time and period-specific income",
          "Grinder Costs: total payout obligations",
          "Net Profit: revenue minus costs with trend indicators",
          "Margin Distribution: visual breakdown of profit across orders",
        ],
      },
      {
        heading: "Business Insights",
        points: [
          "Monthly Performance trends with growth indicators",
          "Profitability summaries by service and platform",
          "Cost analysis: where money is going",
          "Revenue forecasting based on current pipeline",
        ],
      },
    ],
    steps: [
      "Check Net Profit and margin trends at the top",
      "Review monthly performance for growth or decline patterns",
      "Analyze cost breakdown to identify where margins are tight",
      "Use service profitability data to adjust pricing strategy",
    ],
    tip: "If net profit is declining while revenue is stable, your grinder pay rates may be too high. Check margin distribution for problem areas.",
  },
  {
    id: "scorecard-guide",
    title: "Scorecard & Queue Info",
    subtitle: "Reference page for the grading and queue ranking systems",
    icon: Brain,
    iconColor: "text-teal-400",
    sections: [
      {
        heading: "What This Page Explains",
        points: [
          "Letter grading system (A-F) with score ranges",
          "5 quality score factors and their weights",
          "All 9 AI queue factors with weights, tips, and icons",
          "Boost modifiers: Emergency (+25%), Large Order Elite (+15%)",
          "Shared page \u2014 also visible to grinders for transparency",
        ],
      },
    ],
    steps: [
      "Review the scoring factors so you can explain them to grinders",
      "Understand the queue weights to make informed override decisions",
      "Reference this page when grinders ask how rankings work",
    ],
    tip: "Sharing this page with new grinders during onboarding helps set clear expectations about performance evaluation.",
  },
  {
    id: "badges",
    title: "Badge Management",
    subtitle: "Award and manage grinder achievement badges",
    icon: Award,
    iconColor: "text-amber-400",
    sections: [
      {
        heading: "Badge Types",
        points: [
          "Staff-Awarded: manually given by staff/owners for recognition",
          "Auto-Earned: automatically granted based on grinder performance milestones",
          "Each badge has a unique visual emblem, label, and description",
          "Badge Catalogue at the bottom shows all available badges with explanations",
        ],
      },
      {
        heading: "Managing Badges",
        points: [
          "Select a grinder from the dropdown to view their current badges",
          "Award new badges using the badge selector and optional note",
          "Remove staff-awarded badges with the hover-to-remove button",
          "Auto-earned badges cannot be manually removed",
          "Badges appear on grinder profiles and overview pages",
        ],
      },
    ],
    steps: [
      "Select a grinder from the dropdown at the top",
      "View their currently awarded badges in the grid",
      "To award: pick a badge from the 'Award New Badge' dropdown",
      "Optionally add a note explaining why the badge was given",
      "Click 'Award' to assign the badge",
      "To remove: hover over a staff-awarded badge and click the red X",
    ],
    tip: "Use badges as positive reinforcement. Recognizing top performers with visible badges motivates the entire team.",
  },
  {
    id: "features",
    title: "Features",
    subtitle: "Directory of all staff pages with descriptions and quick links",
    icon: BookOpen,
    iconColor: "text-violet-400",
    sections: [
      {
        heading: "What You'll Find",
        points: [
          "Descriptions of every management page and its purpose",
          "Quick-access links to jump directly to any page",
          "Useful for onboarding new staff members",
        ],
      },
    ],
    steps: [
      "Open Features from the sidebar for a quick reference",
      "Click any page link to navigate directly",
      "Share this page with new staff for orientation",
    ],
    tip: "Combined with this Operations Guide, the Features page gives new staff everything they need to get started.",
  },
  {
    id: "workflow-summary",
    title: "Daily Staff Workflow",
    subtitle: "The ideal daily routine for efficient operations management",
    icon: CheckCircle,
    iconColor: "text-emerald-400",
    sections: [
      {
        heading: "Morning Check-In",
        points: [
          "1. Open Overview to check financial stats and order pipeline",
          "2. Review fleet health \u2014 are enough grinders available?",
          "3. Check for pending bids that need decisions",
          "4. Review any pending elite requests or order claims",
        ],
      },
      {
        heading: "Active Management",
        points: [
          "5. Monitor the AI Queue for optimal assignment recommendations",
          "6. Handle any override assignments or manual orders",
          "7. Check Reports for checkpoint activity and grinder updates",
          "8. Process pending payouts and resolve disputes",
        ],
      },
      {
        heading: "Quality & Communication",
        points: [
          "9. Review customer reviews in the moderation queue",
          "10. Check Streams to monitor live grinders",
          "11. Send alerts for new opportunities or important updates",
          "12. Publish staff notes for any system or process changes",
        ],
      },
      {
        heading: "End of Day",
        points: [
          "13. Check Analytics for daily performance trends",
          "14. Review the Audit Log for any unusual activity",
          "15. Update Calendar events or promotions as needed",
          "16. (Owner) Review Business Performance for financial health",
        ],
      },
    ],
    tip: "Consistent daily check-ins prevent problems from snowballing. The Overview page is your best starting point every morning.",
  },
];

export default function StaffOpsGuide() {
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
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white" data-testid="text-staff-ops-guide-title">Staff Operations Guide</h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground">Complete management walkthrough for staff & owners</p>
        </div>
        <Badge variant="outline" className="border-white/10 text-muted-foreground text-[10px] sm:text-xs shrink-0 ml-2">
          {currentSlide + 1} / {slides.length}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl mx-auto">
          <Card className="border-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] shadow-2xl shadow-black/40 overflow-hidden" data-testid={`staff-slide-${slide.id}`}>
            <div className={`h-1 sm:h-1.5 bg-gradient-to-r ${currentSlide === 0 ? "from-[#4cadd0] via-[#4cadd0] to-blue-500" : currentSlide === slides.length - 1 ? "from-emerald-500 via-green-500 to-teal-500" : slide.ownerOnly ? "from-[#fd853f] via-orange-500 to-amber-500" : "from-[#4cadd0] via-blue-500 to-violet-500"}`} />

            <CardContent className="p-4 sm:p-6 lg:p-10 space-y-4 sm:space-y-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <SlideIcon className={`w-5 h-5 sm:w-7 sm:h-7 ${slide.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white" data-testid="text-staff-slide-title">{slide.title}</h2>
                    {slide.ownerOnly && (
                      <Badge className="bg-[#fd853f]/20 text-[#fd853f] border-[#fd853f]/30 text-[10px]">Owner Only</Badge>
                    )}
                  </div>
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
                <div className="rounded-lg sm:rounded-xl border border-[#4cadd0]/15 bg-[#4cadd0]/[0.04] p-3 sm:p-5 space-y-2 sm:space-y-3">
                  <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#4cadd0] flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Step-by-Step
                  </h3>
                  <ol className="space-y-1.5 sm:space-y-2">
                    {slide.steps.map((step, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-white/80">
                        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#4cadd0]/20 text-[#4cadd0] text-[10px] sm:text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
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
            data-testid="button-staff-prev-slide"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Previous</span><span className="sm:hidden">Prev</span>
          </Button>

          <div className="hidden md:flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? "bg-white w-6" : "bg-white/20 hover:bg-white/40"}`}
                data-testid={`staff-dot-slide-${idx}`}
              />
            ))}
          </div>

          <span className="md:hidden text-[10px] text-white/40">{currentSlide + 1}/{slides.length}</span>

          <Button
            size="sm"
            className="gap-1 sm:gap-2 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm px-2 sm:px-4"
            onClick={goNext}
            disabled={currentSlide === slides.length - 1}
            data-testid="button-staff-next-slide"
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
                data-testid={`staff-nav-slide-${s.id}`}
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
