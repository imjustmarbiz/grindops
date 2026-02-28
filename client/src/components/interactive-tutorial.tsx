import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { staffNavItems, grinderNavItems, getFilteredStaffNavItems } from "@/components/layout";
import {
  ChevronRight, ChevronLeft, X, GraduationCap, MousePointerClick, Eye, Zap,
  FileCheck, Gavel, Banknote, LayoutDashboard, Bell, MessageCircle, Brain,
  Crown, Settings, ListOrdered, Users, ClipboardCheck, BarChart3, Rocket,
  CheckCircle2, Play, AlertTriangle, Star, CalendarDays, Tv, Newspaper,
  BookOpen, ScrollText, Wrench, Package, Award, TrendingUp, ClipboardList,
  FileBarChart, Wallet, DollarSign, UserCheck, Calendar, Shield, Upload,
  Sparkles
} from "lucide-react";

type DemoStep = { label: string; icon: any; color: string };

interface PageMeta {
  description: string;
  demoSteps?: DemoStep[];
}

const staffPageDescriptions: Record<string, PageMeta> = {
  "/": {
    description: "Your command center shows real-time financials — total revenue, grinder payouts, company profit, and average order value. The order pipeline tracks every status. Fleet health shows utilization.",
    demoSteps: [
      { label: "Revenue, payouts, profit at a glance", icon: DollarSign, color: "text-green-400" },
      { label: "Order pipeline: Open → Assigned → Done", icon: ListOrdered, color: "text-blue-400" },
      { label: "Fleet utilization ring shows capacity", icon: Users, color: "text-cyan-400" },
      { label: "Active bidding countdown timer", icon: Gavel, color: "text-purple-400" },
    ],
  },
  "/notifications": {
    description: "Your notification hub — bid results, order updates, system alerts, and team announcements all in one feed. Filter by type and mark as read.",
    demoSteps: [
      { label: "New bid submitted on Order #42", icon: Gavel, color: "text-purple-400" },
      { label: "Grinder completed assignment", icon: CheckCircle2, color: "text-emerald-400" },
      { label: "Payout request needs approval", icon: Banknote, color: "text-yellow-400" },
      { label: "Mark all as read in one click", icon: Eye, color: "text-blue-400" },
    ],
  },
  "/todo": {
    description: "Your task dashboard — pending approvals, unreviewed bids, orders needing attention, and administrative duties organized by priority.",
    demoSteps: [
      { label: "3 payout requests pending review", icon: Banknote, color: "text-yellow-400" },
      { label: "2 bids awaiting acceptance", icon: Gavel, color: "text-purple-400" },
      { label: "1 order repair needs resolution", icon: Wrench, color: "text-orange-400" },
      { label: "Check off tasks as you go", icon: CheckCircle2, color: "text-emerald-400" },
    ],
  },
  "/staff-overview": {
    description: "Owner-only view of your entire staff team — activity metrics, actions per day, and individual performance breakdowns for every team member.",
    demoSteps: [
      { label: "Total staff actions today: 47", icon: UserCheck, color: "text-blue-400" },
      { label: "Activity bars show 7-day trends", icon: BarChart3, color: "text-cyan-400" },
      { label: "Staff audit log by action type", icon: ScrollText, color: "text-purple-400" },
      { label: "Compare team member contributions", icon: Users, color: "text-green-400" },
    ],
  },
  "/admin": {
    description: "System configuration hub with 3 tabs — Operations (order management, alerts), Management (elite requests, strikes, profiles), and System (bot, maintenance, services).",
    demoSteps: [
      { label: "Operations: override orders & alerts", icon: Settings, color: "text-blue-400" },
      { label: "Management: strikes, limits, profiles", icon: Shield, color: "text-orange-400" },
      { label: "System: bot toggle, maintenance mode", icon: Wrench, color: "text-red-400" },
      { label: "Service toggles affect entire platform", icon: Package, color: "text-cyan-400" },
    ],
  },
  "/wallets": {
    description: "Financial wallet system — company and personal wallets, transfers between staff, order payment linking, and full transaction history with proof uploads.",
    demoSteps: [
      { label: "Company wallet tracks all revenue", icon: Wallet, color: "text-green-400" },
      { label: "Personal wallets for each staff member", icon: DollarSign, color: "text-blue-400" },
      { label: "Transfer funds with approval workflow", icon: Banknote, color: "text-yellow-400" },
      { label: "Link order payments to wallets", icon: FileCheck, color: "text-cyan-400" },
    ],
  },
  "/business": {
    description: "Owner-only business analytics — monthly revenue trends, profit margins, service performance breakdowns, grinder economics, and financial projections.",
    demoSteps: [
      { label: "Monthly revenue vs. grinder payouts", icon: DollarSign, color: "text-green-400" },
      { label: "Profit margin per service type", icon: BarChart3, color: "text-cyan-400" },
      { label: "Top-earning services ranked", icon: TrendingUp, color: "text-blue-400" },
      { label: "Grinder cost analysis breakdown", icon: Users, color: "text-purple-400" },
    ],
  },
  "/analytics": {
    description: "Deep-dive data visualization — order volume trends, completion rates, growth metrics, and platform engagement over customizable time periods.",
    demoSteps: [
      { label: "Order volume trends over time", icon: BarChart3, color: "text-blue-400" },
      { label: "Completion rate by service type", icon: CheckCircle2, color: "text-emerald-400" },
      { label: "Revenue growth month-over-month", icon: TrendingUp, color: "text-green-400" },
      { label: "Filter by date range and service", icon: CalendarDays, color: "text-cyan-400" },
    ],
  },
  "/services": {
    description: "Manage all gaming services offered — toggle services on/off, set pricing, configure platforms, and control visibility across the system.",
    demoSteps: [
      { label: "Toggle services active or inactive", icon: Package, color: "text-blue-400" },
      { label: "Set base pricing per service", icon: DollarSign, color: "text-green-400" },
      { label: "Configure platform availability", icon: Settings, color: "text-cyan-400" },
      { label: "Disabled services hidden everywhere", icon: Eye, color: "text-orange-400" },
    ],
  },
  "/grinders": {
    description: "Your grinder roster — view all grinders with availability status, performance stats, tier levels, and management tools. Colored dots show who's online.",
    demoSteps: [
      { label: "Green dot = available for orders", icon: CheckCircle2, color: "text-green-400" },
      { label: "View scorecard, bids, and history", icon: ClipboardCheck, color: "text-blue-400" },
      { label: "Manage roles, strikes, and limits", icon: Shield, color: "text-orange-400" },
      { label: "Edit grinder profiles and tiers", icon: Settings, color: "text-cyan-400" },
    ],
  },
  "/tier-progress": {
    description: "Track grinder tier progression — from New to Elite. Review promotions, demotions, and requirements for each tier level.",
    demoSteps: [
      { label: "New → Regular → Veteran → Elite", icon: TrendingUp, color: "text-blue-400" },
      { label: "See requirements for next tier", icon: ClipboardCheck, color: "text-cyan-400" },
      { label: "Manual promote or demote grinders", icon: Crown, color: "text-yellow-400" },
      { label: "Elite perks: priority orders, higher pay", icon: Star, color: "text-purple-400" },
    ],
  },
  "/badges": {
    description: "Achievement badge system — create badges, set auto-earn criteria, manually award badges, and manage the progression tiers for grinder motivation.",
    demoSteps: [
      { label: "Auto-earned: First Order, 10 Completed", icon: Award, color: "text-yellow-400" },
      { label: "Manual awards for exceptional work", icon: Star, color: "text-purple-400" },
      { label: "Bronze → Silver → Gold → Diamond", icon: TrendingUp, color: "text-cyan-400" },
      { label: "Badges display on grinder profiles", icon: Eye, color: "text-blue-400" },
    ],
  },
  "/reports": {
    description: "Generate exportable reports — order summaries, grinder performance, financial breakdowns, and custom date ranges. Export as CSV or PDF.",
    demoSteps: [
      { label: "Select report type and date range", icon: FileBarChart, color: "text-blue-400" },
      { label: "Order completion summary generated", icon: ListOrdered, color: "text-cyan-400" },
      { label: "Grinder earnings breakdown ready", icon: DollarSign, color: "text-green-400" },
      { label: "Export to CSV or PDF download", icon: Upload, color: "text-purple-400" },
    ],
  },
  "/bids": {
    description: "Review all grinder bids — the AI queue ranks by scorecard but you can override. Accept, reject, or let the system auto-assign based on rankings.",
    demoSteps: [
      { label: "Bids arrive from grinders on orders", icon: Gavel, color: "text-purple-400" },
      { label: "AI ranks bids by scorecard & history", icon: Brain, color: "text-cyan-400" },
      { label: "Review top candidates side-by-side", icon: Eye, color: "text-blue-400" },
      { label: "Accept bid — grinder gets notified", icon: CheckCircle2, color: "text-emerald-400" },
    ],
  },
  "/orders": {
    description: "Order management central — create new orders, set prices, assign platforms, track statuses, and manage the full order lifecycle from open to paid out.",
    demoSteps: [
      { label: "Create order: service, platform, price", icon: ListOrdered, color: "text-blue-400" },
      { label: "Open for bidding — grinders compete", icon: Gavel, color: "text-purple-400" },
      { label: "Track: Open → Assigned → In Progress", icon: Eye, color: "text-cyan-400" },
      { label: "Completed → Paid Out — full lifecycle", icon: CheckCircle2, color: "text-emerald-400" },
    ],
  },
  "/assignments": {
    description: "Active assignment tracking — see login status, checkpoints, progress updates, and proof submissions for every assigned order in real-time.",
    demoSteps: [
      { label: "Grinder logs in → status updates live", icon: MousePointerClick, color: "text-yellow-400" },
      { label: "Checkpoint: started, progress, issues", icon: CheckCircle2, color: "text-cyan-400" },
      { label: "Customer approval flow when required", icon: UserCheck, color: "text-blue-400" },
      { label: "Reassign if grinder needs replacement", icon: Users, color: "text-orange-400" },
    ],
  },
  "/order-updates": {
    description: "Real-time feed of all order status updates — login events, progress reports, completion proofs, and customer communications across all active orders.",
    demoSteps: [
      { label: "Live stream of grinder checkpoints", icon: Zap, color: "text-yellow-400" },
      { label: "Proof videos and screenshots posted", icon: Upload, color: "text-blue-400" },
      { label: "Customer update messages tracked", icon: MessageCircle, color: "text-cyan-400" },
      { label: "Filter by order, grinder, or status", icon: Eye, color: "text-purple-400" },
    ],
  },
  "/order-claims": {
    description: "Order repair system — review and resolve repair requests from grinders. Handle missing orders, claim fixes, and add completed orders to the system.",
    demoSteps: [
      { label: "Fix: correct existing order data", icon: Wrench, color: "text-orange-400" },
      { label: "Claim: grinder claims missing order", icon: FileCheck, color: "text-blue-400" },
      { label: "Add: insert completed order manually", icon: ListOrdered, color: "text-cyan-400" },
      { label: "Approve or deny with audit trail", icon: CheckCircle2, color: "text-emerald-400" },
    ],
  },
  "/payouts": {
    description: "Payout processing — review grinder requests, verify amounts, approve payments, and mark as paid. Track payment methods and full payout history.",
    demoSteps: [
      { label: "Grinder requests $85 via Cash App", icon: Banknote, color: "text-green-400" },
      { label: "Verify against completed order value", icon: Eye, color: "text-blue-400" },
      { label: "Approve and process the payment", icon: CheckCircle2, color: "text-emerald-400" },
      { label: "Mark paid — grinder gets notified", icon: DollarSign, color: "text-yellow-400" },
    ],
  },
  "/queue": {
    description: "AI-powered queue system — see how grinder bids are ranked using 9 scoring factors: reliability, speed, quality, specialization, fairness, and more.",
    demoSteps: [
      { label: "9-factor scoring: quality, speed, etc.", icon: Brain, color: "text-cyan-400" },
      { label: "Queue position updates in real-time", icon: TrendingUp, color: "text-blue-400" },
      { label: "Specialization bonuses for top grinders", icon: Star, color: "text-purple-400" },
      { label: "Fairness factor prevents monopoly", icon: Shield, color: "text-green-400" },
    ],
  },
  "/scorecard-guide": {
    description: "Educational resource explaining how the scorecard and queue system work — factor weights, tips for improvement, and how rankings are calculated.",
    demoSteps: [
      { label: "9 scoring factors explained", icon: Brain, color: "text-cyan-400" },
      { label: "How quality score is calculated", icon: Star, color: "text-yellow-400" },
      { label: "Tips to improve your ranking", icon: TrendingUp, color: "text-green-400" },
      { label: "Queue position formula breakdown", icon: BarChart3, color: "text-blue-400" },
    ],
  },
  "/reviews": {
    description: "Customer review management — moderate reviews, view ratings, and manage the review approval workflow. Reviews are linked to specific orders.",
    demoSteps: [
      { label: "Customer submits 5-star review", icon: Star, color: "text-yellow-400" },
      { label: "Auto-linked to order and grinder", icon: FileCheck, color: "text-blue-400" },
      { label: "Moderate: approve or flag reviews", icon: Shield, color: "text-orange-400" },
      { label: "Public reviews build grinder reputation", icon: Eye, color: "text-cyan-400" },
    ],
  },
  "/calendar": {
    description: "Master calendar showing all order deadlines, scheduled events, and important dates across the entire operation.",
    demoSteps: [
      { label: "Order deadlines marked on calendar", icon: CalendarDays, color: "text-blue-400" },
      { label: "Events and promos highlighted", icon: Calendar, color: "text-purple-400" },
      { label: "Click any date for order details", icon: Eye, color: "text-cyan-400" },
      { label: "Never miss a deadline again", icon: CheckCircle2, color: "text-green-400" },
    ],
  },
  "/streams": {
    description: "Monitor grinder Twitch streams — verify active gameplay, track stream hours, and generate automatic activity checkpoints from live sessions.",
    demoSteps: [
      { label: "Grinder goes live on Twitch", icon: Tv, color: "text-purple-400" },
      { label: "Auto-checkpoint: streaming verified", icon: CheckCircle2, color: "text-green-400" },
      { label: "Staff can watch streams in real-time", icon: Eye, color: "text-blue-400" },
      { label: "Stream hours logged for performance", icon: BarChart3, color: "text-cyan-400" },
    ],
  },
  "/events": {
    description: "Event and promo management — schedule double-payout weekends, bonus challenges, community events, and platform-wide announcements.",
    demoSteps: [
      { label: "Create: Double Payout Weekend event", icon: Calendar, color: "text-blue-400" },
      { label: "Set start/end dates and eligibility", icon: CalendarDays, color: "text-cyan-400" },
      { label: "Grinders see events on their dashboard", icon: Eye, color: "text-green-400" },
      { label: "Track participation and impact", icon: BarChart3, color: "text-purple-400" },
    ],
  },
  "/audit-log": {
    description: "Comprehensive system activity log — every action by staff, grinders, and the system is recorded with timestamps, actor details, and change data.",
    demoSteps: [
      { label: "Order #42 status changed by Staff", icon: ListOrdered, color: "text-blue-400" },
      { label: "Grinder role updated by Owner", icon: Shield, color: "text-orange-400" },
      { label: "Payout approved at 2:45 PM", icon: Banknote, color: "text-green-400" },
      { label: "Filter by action type, user, or date", icon: Eye, color: "text-cyan-400" },
    ],
  },
  "/patch-notes": {
    description: "Internal staff notes and platform updates — document changes, share operational updates, and keep the team informed about new features.",
    demoSteps: [
      { label: "New feature release notes posted", icon: Newspaper, color: "text-blue-400" },
      { label: "Bug fixes and improvements listed", icon: Wrench, color: "text-orange-400" },
      { label: "Stay informed about platform changes", icon: Eye, color: "text-cyan-400" },
      { label: "Archive of all past updates", icon: ScrollText, color: "text-purple-400" },
    ],
  },
  "/features": {
    description: "Feature documentation — browse all platform capabilities, understand how systems work, and reference implementation details.",
    demoSteps: [
      { label: "Browse all platform features", icon: BookOpen, color: "text-blue-400" },
      { label: "Detailed descriptions and screenshots", icon: Eye, color: "text-cyan-400" },
      { label: "Learn advanced capabilities", icon: Brain, color: "text-purple-400" },
      { label: "Reference guide for power users", icon: Star, color: "text-yellow-400" },
    ],
  },
  "/staff/ops-guide": {
    description: "Staff operations guide — standard operating procedures, workflow documentation, and best practices for managing the platform day-to-day.",
    demoSteps: [
      { label: "Standard operating procedures", icon: ScrollText, color: "text-blue-400" },
      { label: "Order management best practices", icon: ListOrdered, color: "text-cyan-400" },
      { label: "Grinder communication guidelines", icon: MessageCircle, color: "text-purple-400" },
      { label: "Escalation and dispute resolution", icon: Shield, color: "text-orange-400" },
    ],
  },
};

const grinderPageDescriptions: Record<string, PageMeta> = {
  "/": {
    description: "Your personal dashboard — quick stats, active assignments, performance analytics, badges, and availability controls. Everything at a glance.",
    demoSteps: [
      { label: "Active orders, completed, pending bids", icon: LayoutDashboard, color: "text-blue-400" },
      { label: "Toggle availability: Online/Busy/Away", icon: CheckCircle2, color: "text-green-400" },
      { label: "Total earned and win rate tracked", icon: DollarSign, color: "text-emerald-400" },
      { label: "Quality score progress bar updates", icon: BarChart3, color: "text-cyan-400" },
    ],
  },
  "/grinder/notifications": {
    description: "Your notification feed — bid results, assignment updates, deadline changes, team announcements, and staff messages. Sound alerts for important events.",
    demoSteps: [
      { label: "Your bid on Order #42 was accepted!", icon: CheckCircle2, color: "text-emerald-400" },
      { label: "New order available matching your skills", icon: Zap, color: "text-yellow-400" },
      { label: "Deadline extended by 24 hours", icon: CalendarDays, color: "text-blue-400" },
      { label: "Staff announcement: bonus weekend!", icon: Bell, color: "text-purple-400" },
    ],
  },
  "/grinder/todo": {
    description: "Your action items — orders needing attention, bids to submit, proofs to upload, and tasks assigned by staff. Stay on top of your work.",
    demoSteps: [
      { label: "Start Order #42 — assigned yesterday", icon: Play, color: "text-cyan-400" },
      { label: "Upload proof for completed order", icon: Upload, color: "text-blue-400" },
      { label: "Submit bid before timer expires", icon: Gavel, color: "text-purple-400" },
      { label: "Check off tasks as you complete them", icon: CheckCircle2, color: "text-emerald-400" },
    ],
  },
  "/grinder/orders": {
    description: "Browse available orders — each shows service, platform, price, and deadline. Orders are sorted by priority. Place bids on the ones you want.",
    demoSteps: [
      { label: "New order drops into the queue", icon: Zap, color: "text-yellow-400" },
      { label: "Service: Ranked Boost — $85.00", icon: ListOrdered, color: "text-blue-400" },
      { label: "Platform: PlayStation — Due in 3 days", icon: Play, color: "text-cyan-400" },
      { label: "Click to place your bid amount", icon: Gavel, color: "text-purple-400" },
    ],
  },
  "/grinder/assignments": {
    description: "Your active work — assigned orders with login buttons, status checkpoints, timeline, and proof submission. Follow the flow: Log In → Start → Complete.",
    demoSteps: [
      { label: "Order assigned — click to accept", icon: FileCheck, color: "text-blue-400" },
      { label: "Log into the customer's account", icon: MousePointerClick, color: "text-yellow-400" },
      { label: "Start Order — begin the work", icon: Play, color: "text-cyan-400" },
      { label: "Mark Complete — upload proof video", icon: CheckCircle2, color: "text-emerald-400" },
    ],
  },
  "/grinder/order-claims": {
    description: "Order repairs — report issues with your orders, request data corrections, or claim missing orders that weren't tracked by the system.",
    demoSteps: [
      { label: "Report: order data needs correction", icon: Wrench, color: "text-orange-400" },
      { label: "Claim: completed order not in system", icon: FileCheck, color: "text-blue-400" },
      { label: "Provide evidence and details", icon: Upload, color: "text-cyan-400" },
      { label: "Staff reviews and approves/denies", icon: Shield, color: "text-green-400" },
    ],
  },
  "/grinder/bids": {
    description: "Track all your bids — see which are pending, accepted, or rejected. View bid amounts, order details, and AI queue ranking for each bid.",
    demoSteps: [
      { label: "You submit your bid amount", icon: Gavel, color: "text-purple-400" },
      { label: "AI Queue scores your bid...", icon: Brain, color: "text-cyan-400" },
      { label: "Your scorecard boosts priority", icon: ClipboardCheck, color: "text-green-400" },
      { label: "Bid accepted! Order assigned to you", icon: CheckCircle2, color: "text-emerald-400" },
    ],
  },
  "/grinder/scorecard": {
    description: "Your performance metrics — quality, speed, reliability, communication scores. Includes tier progress, payout summary, completed orders, and strike history.",
    demoSteps: [
      { label: "Quality Score: 92% — Excellent", icon: Star, color: "text-yellow-400" },
      { label: "Reliability: 15/15 on-time deliveries", icon: CheckCircle2, color: "text-emerald-400" },
      { label: "Speed: avg 1.2 days per order", icon: Zap, color: "text-cyan-400" },
      { label: "Tier Progress: 80% to Veteran", icon: TrendingUp, color: "text-blue-400" },
    ],
  },
  "/grinder/queue": {
    description: "See your queue position — the 9-factor AI system explains exactly why you're ranked where you are, with personalized tips to improve your position.",
    demoSteps: [
      { label: "Your queue position: #3 of 12", icon: Brain, color: "text-cyan-400" },
      { label: "Strength: high reliability score", icon: CheckCircle2, color: "text-green-400" },
      { label: "Tip: bid on PS5 orders for bonus", icon: Star, color: "text-yellow-400" },
      { label: "Fairness boost: not assigned recently", icon: Shield, color: "text-blue-400" },
    ],
  },
  "/scorecard-guide": {
    description: "Learn how the scorecard and queue system work — factor weights, scoring breakdown, tips for improvement, and how rankings determine order assignments.",
    demoSteps: [
      { label: "9 scoring factors explained", icon: Brain, color: "text-cyan-400" },
      { label: "How quality score is calculated", icon: Star, color: "text-yellow-400" },
      { label: "Tips to improve your ranking", icon: TrendingUp, color: "text-green-400" },
      { label: "Queue position formula breakdown", icon: BarChart3, color: "text-blue-400" },
    ],
  },
  "/grinder/status": {
    description: "Your tier progression — from New to Elite. See requirements for the next level, perks you've unlocked, and what you need to achieve to rank up.",
    demoSteps: [
      { label: "Current: Regular Grinder tier", icon: Crown, color: "text-blue-400" },
      { label: "Next: Veteran — need 25 orders", icon: TrendingUp, color: "text-cyan-400" },
      { label: "Elite perks: priority queue, +10% pay", icon: Star, color: "text-yellow-400" },
      { label: "Track progress toward each requirement", icon: BarChart3, color: "text-green-400" },
    ],
  },
  "/grinder/strikes": {
    description: "Your compliance record — view any strikes, fines, and policy violations. Appeal strikes, submit fine payment proofs, and understand the policy rules.",
    demoSteps: [
      { label: "Clean record: no active strikes", icon: Shield, color: "text-green-400" },
      { label: "Strike for late delivery → appeal it", icon: AlertTriangle, color: "text-orange-400" },
      { label: "Fine issued → submit payment proof", icon: Upload, color: "text-blue-400" },
      { label: "Policy guide explains all rules", icon: BookOpen, color: "text-cyan-400" },
    ],
  },
  "/grinder/payouts": {
    description: "Your earnings hub — request payouts via Zelle, PayPal, Cash App, and more. Track pending and completed payments with full history.",
    demoSteps: [
      { label: "Total earned: $1,250 this month", icon: DollarSign, color: "text-emerald-400" },
      { label: "Request payout: $200 via Cash App", icon: Banknote, color: "text-green-400" },
      { label: "Staff reviews and approves request", icon: UserCheck, color: "text-blue-400" },
      { label: "Paid! Funds sent to your account", icon: CheckCircle2, color: "text-yellow-400" },
    ],
  },
  "/grinder/reviews": {
    description: "Your customer reviews — see ratings and feedback from customers. Generate access codes for customers to leave reviews, and approve reviews before they go public.",
    demoSteps: [
      { label: "Customer leaves 5-star review", icon: Star, color: "text-yellow-400" },
      { label: "Generate review access code", icon: Shield, color: "text-blue-400" },
      { label: "Approve or flag before public", icon: Eye, color: "text-cyan-400" },
      { label: "Reviews boost your queue ranking", icon: TrendingUp, color: "text-green-400" },
    ],
  },
  "/grinder/calendar": {
    description: "Your schedule — order deadlines, completed assignments, upcoming milestones, and event dates. Never miss a deadline.",
    demoSteps: [
      { label: "Your deadlines highlighted on calendar", icon: CalendarDays, color: "text-blue-400" },
      { label: "Completed orders show as checkmarks", icon: CheckCircle2, color: "text-green-400" },
      { label: "Upcoming events and promos shown", icon: Calendar, color: "text-purple-400" },
      { label: "Plan your work week at a glance", icon: Eye, color: "text-cyan-400" },
    ],
  },
  "/grinder/events": {
    description: "Community events and promos — double-payout weekends, bonus challenges, and platform-wide competitions. Participate to earn extra rewards.",
    demoSteps: [
      { label: "Double Payout Weekend: Fri-Sun", icon: Calendar, color: "text-blue-400" },
      { label: "Speed Challenge: fastest completion", icon: Zap, color: "text-yellow-400" },
      { label: "Participate to earn bonus rewards", icon: Star, color: "text-purple-400" },
      { label: "Leaderboard tracks top performers", icon: TrendingUp, color: "text-cyan-400" },
    ],
  },
  "/grinder/patch-notes": {
    description: "Platform updates — read about new features, bug fixes, and changes that affect your workflow. Stay informed about what's new.",
    demoSteps: [
      { label: "Latest platform updates posted", icon: Newspaper, color: "text-blue-400" },
      { label: "New features and improvements", icon: Star, color: "text-yellow-400" },
      { label: "Bug fixes that affect your workflow", icon: Wrench, color: "text-orange-400" },
      { label: "Stay ahead of platform changes", icon: Eye, color: "text-cyan-400" },
    ],
  },
  "/grinder/guide": {
    description: "Your platform guide — understand all features, learn workflows, and reference documentation. Essential reading for new grinders.",
    demoSteps: [
      { label: "How to place bids and win orders", icon: Gavel, color: "text-purple-400" },
      { label: "Understanding your scorecard", icon: ClipboardCheck, color: "text-blue-400" },
      { label: "Payout process explained step-by-step", icon: Banknote, color: "text-green-400" },
      { label: "Tips for ranking up faster", icon: TrendingUp, color: "text-cyan-400" },
    ],
  },
  "/grinder/ops-guide": {
    description: "Operations guide — step-by-step procedures for handling orders, bids, checkpoints, and payouts. Your handbook for working efficiently.",
    demoSteps: [
      { label: "Step 1: Accept order assignment", icon: FileCheck, color: "text-blue-400" },
      { label: "Step 2: Log in and start work", icon: MousePointerClick, color: "text-yellow-400" },
      { label: "Step 3: Complete and upload proof", icon: Upload, color: "text-cyan-400" },
      { label: "Step 4: Request payout", icon: Banknote, color: "text-green-400" },
    ],
  },
};

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  targetSelector?: string;
  targetArea?: "sidebar" | "header" | "main" | "full";
  demoSteps?: DemoStep[];
  position?: "center" | "right" | "bottom";
}

function buildTutorialSteps(
  navItems: typeof staffNavItems,
  pageDescriptions: Record<string, PageMeta>,
  isStaff: boolean
): TutorialStep[] {
  const steps: TutorialStep[] = [];

  steps.push({
    id: "welcome",
    title: isStaff ? "Welcome to GrindOps Command Center" : "Welcome to GrindOps",
    description: isStaff
      ? "Your centralized dashboard for managing the entire gaming service operation. This tour will walk you through every tool at your disposal. Use arrow keys or the buttons to navigate."
      : "Your command center for managing gaming service orders. This quick tour will show you how everything works so you can start earning right away. Use arrow keys or buttons to navigate.",
    icon: isStaff ? Crown : Sparkles,
    targetArea: "full",
    position: "center",
  });

  steps.push({
    id: "sidebar-nav",
    title: "Navigation Sidebar",
    description: "This is your navigation hub. Every page in the system is accessible from here. Click the menu icon to collapse it on mobile. New pages added to the sidebar will automatically appear in this tutorial.",
    icon: LayoutDashboard,
    targetSelector: "[data-sidebar]",
    targetArea: "sidebar",
    position: "right",
  });

  for (const item of navItems) {
    const meta = pageDescriptions[item.url];

    steps.push({
      id: `page-${item.url}`,
      title: item.title,
      description: meta?.description || `The ${item.title} page — explore this section to learn more about its features and capabilities.`,
      icon: item.icon,
      targetSelector: `[data-nav-url="${item.url}"]`,
      targetArea: "sidebar",
      position: "right",
      demoSteps: meta?.demoSteps,
    });
  }

  steps.push({
    id: "notifications-header",
    title: "Quick Notifications",
    description: "The bell icon in the header shows a quick preview of your latest notifications. Tap it for instant access without leaving your current page.",
    icon: Bell,
    targetSelector: '[data-testid="button-notifications"]',
    targetArea: "header",
    position: "bottom",
    demoSteps: [
      { label: "Unread count badge appears on bell", icon: Bell, color: "text-yellow-400" },
      { label: "Click to expand notification panel", icon: Eye, color: "text-blue-400" },
      { label: "Quick-read without leaving your page", icon: CheckCircle2, color: "text-green-400" },
      { label: "Sound alerts for urgent notifications", icon: Zap, color: "text-purple-400" },
    ],
  });

  steps.push({
    id: "chat-header",
    title: "Team Chat",
    description: "Use the chat icon to communicate with " + (isStaff ? "grinders and other staff" : "staff") + " directly. Ask questions, report issues, or discuss orders — all within the dashboard.",
    icon: MessageCircle,
    targetSelector: '[data-testid="button-open-chat"]',
    targetArea: "header",
    position: "bottom",
    demoSteps: [
      { label: "Open chat drawer from any page", icon: MessageCircle, color: "text-blue-400" },
      { label: "Direct messages and group threads", icon: Users, color: "text-cyan-400" },
      { label: "File attachments and @mentions", icon: Upload, color: "text-purple-400" },
      { label: "Unread indicator on chat icon", icon: Bell, color: "text-yellow-400" },
    ],
  });

  steps.push({
    id: "complete",
    title: isStaff ? "You're All Set!" : "You're Ready to Grind!",
    description: isStaff
      ? "You've seen every tool in your arsenal. Dive into the Command Center and start managing operations. Check the Operations Guide for detailed workflows!"
      : "That covers every page! Check Available Orders to find your first job, or explore the Operations Guide for detailed tips. Good luck out there!",
    icon: Rocket,
    targetArea: "full",
    position: "center",
  });

  return steps;
}

function DemoAnimation({ demoSteps }: { demoSteps: DemoStep[] }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    setFrame(0);
    const interval = setInterval(() => {
      setFrame(f => f + 1);
    }, 1200);
    return () => clearInterval(interval);
  }, [demoSteps]);

  const currentFrame = frame % demoSteps.length;

  return (
    <div className="mt-3 space-y-1.5" aria-live="polite">
      {demoSteps.map((step, i) => {
        const isActive = i === currentFrame;
        const isPast = i < currentFrame;
        const Icon = step.icon;
        return (
          <div
            key={i}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-500 ${
              isActive
                ? "bg-white/10 border border-white/20 scale-[1.02]"
                : isPast
                ? "bg-white/[0.03] opacity-50"
                : "bg-white/[0.02] opacity-30"
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
              isActive ? "bg-white/15 scale-110" : "bg-white/5"
            }`}>
              {isPast ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Icon className={`w-3.5 h-3.5 ${isActive ? step.color : "text-white/30"}`} />
              )}
            </div>
            <span className={`text-xs transition-all duration-500 ${
              isActive ? "text-white font-medium" : isPast ? "text-white/40 line-through" : "text-white/30"
            }`}>
              {step.label}
            </span>
            {isActive && (
              <div className="ml-auto flex gap-0.5" aria-hidden="true">
                <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SpotlightOverlay({ targetSelector, targetArea }: { targetSelector?: string; targetArea?: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (targetSelector) {
      const el = document.querySelector(targetSelector);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect(r);
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        setRect(null);
      }
    } else {
      setRect(null);
    }
  }, [targetSelector]);

  const resolvedArea = targetSelector && !rect ? "full" : targetArea;

  if (resolvedArea === "full" || (!targetSelector && !targetArea)) {
    return <div className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm transition-all duration-500" aria-hidden="true" />;
  }

  if (!rect && resolvedArea === "sidebar") {
    return (
      <div className="fixed inset-0 z-[9998]" aria-hidden="true">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="absolute top-0 left-0 w-[var(--sidebar-width,18rem)] h-full" style={{ background: "transparent", boxShadow: "0 0 0 9999px rgba(0,0,0,0.7)" }} />
      </div>
    );
  }

  if (!rect && resolvedArea === "header") {
    return (
      <div className="fixed inset-0 z-[9998]" aria-hidden="true">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="absolute top-0 right-0 w-40 h-16" style={{ background: "transparent", boxShadow: "0 0 0 9999px rgba(0,0,0,0.7)" }} />
      </div>
    );
  }

  if (!rect && resolvedArea === "main") {
    return <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-[2px] transition-all duration-500" aria-hidden="true" />;
  }

  if (!rect) {
    return <div className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm" aria-hidden="true" />;
  }

  const padding = 8;
  return (
    <div className="fixed inset-0 z-[9998]" aria-hidden="true">
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={rect.x - padding}
              y={rect.y - padding}
              width={rect.width + padding * 2}
              height={rect.height + padding * 2}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#spotlight-mask)" />
        <rect
          x={rect.x - padding}
          y={rect.y - padding}
          width={rect.width + padding * 2}
          height={rect.height + padding * 2}
          rx="8"
          fill="none"
          stroke="hsl(262, 83%, 58%)"
          strokeWidth="2"
          className="animate-pulse"
        />
      </svg>
    </div>
  );
}

export function InteractiveTutorial() {
  const { user } = useAuth();
  const isStaff = user?.role === "staff" || user?.role === "owner";
  const dialogRef = useRef<HTMLDivElement>(null);

  const userId = (user as any)?.discordId || user?.id || "";
  const isOwner = user?.role === "owner";

  const steps = useMemo(
    () => buildTutorialSteps(
      isStaff ? getFilteredStaffNavItems(isOwner, userId) : grinderNavItems,
      isStaff ? staffPageDescriptions : grinderPageDescriptions,
      isStaff
    ),
    [isStaff, isOwner, userId]
  );

  const storageKey = `grindops-tutorial-${isStaff ? "staff" : "grinder"}-v2-completed`;
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      setHasSeenTutorial(false);
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const nextBtn = dialogRef.current.querySelector<HTMLElement>('[data-testid="button-tutorial-next"]');
      nextBtn?.focus();
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setCurrentStep(0);
    localStorage.setItem(storageKey, "true");
    setHasSeenTutorial(true);
  }, [storageKey]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleClose();
    }
  }, [currentStep, steps.length, handleClose]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  }, [currentStep]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); handleNext(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); handlePrev(); }
    if (e.key === "Escape") { e.preventDefault(); handleClose(); }

    if (e.key === "Tab" && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [isOpen, handleNext, handlePrev, handleClose]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const step = steps[currentStep];
  const StepIcon = step?.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  if (!isOpen) {
    return (
      <button
        onClick={() => { setIsOpen(true); setCurrentStep(0); }}
        className="fixed bottom-20 right-4 z-[100] group"
        data-testid="button-start-tutorial"
        aria-label={hasSeenTutorial ? "Replay Tutorial" : "Start Tutorial"}
      >
        <div className={`w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/25 transition-all hover:scale-110 ${!hasSeenTutorial ? "animate-bounce" : ""}`}>
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <span className="absolute right-14 top-1/2 -translate-y-1/2 bg-card border border-border px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl" aria-hidden="true">
          {hasSeenTutorial ? "Replay Tutorial" : "Start Tutorial"}
        </span>
      </button>
    );
  }

  const positionClass =
    step.position === "center" || step.targetArea === "full"
      ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      : step.targetArea === "sidebar"
      ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:left-[calc(var(--sidebar-width,18rem)+1rem)] md:translate-x-0"
      : step.targetArea === "header"
      ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:top-20 md:right-4 md:left-auto md:translate-x-0 md:translate-y-0"
      : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";

  return (
    <>
      <SpotlightOverlay targetSelector={step.targetSelector} targetArea={step.targetArea} />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        aria-describedby="tutorial-desc"
        className={`fixed z-[9999] ${positionClass}`}
      >
        <div className="w-[400px] max-w-[90vw] bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="h-1 bg-muted" aria-hidden="true">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center" aria-hidden="true">
                  <StepIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 id="tutorial-title" className="font-display font-bold text-base leading-tight">{step.title}</h3>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 mt-0.5 border-primary/30 text-primary">
                    Step {currentStep + 1} of {steps.length}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                data-testid="button-close-tutorial"
                aria-label="Close tutorial"
                className="w-7 h-7"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <p id="tutorial-desc" className="text-sm text-muted-foreground leading-relaxed mb-3">
              {step.description}
            </p>

            {step.demoSteps && step.demoSteps.length > 0 && (
              <DemoAnimation demoSteps={step.demoSteps} />
            )}

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
              <div className="flex gap-0.5 max-w-[140px] flex-wrap" aria-label={`Step ${currentStep + 1} of ${steps.length}`} role="tablist">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={i === currentStep}
                    aria-label={`Go to step ${i + 1}`}
                    onClick={() => setCurrentStep(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep ? "bg-primary w-4" : i < currentStep ? "bg-primary/40 w-1.5" : "bg-white/10 w-1.5"
                    }`}
                    data-testid={`tutorial-dot-${i}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {!isFirst && (
                  <Button size="sm" variant="ghost" onClick={handlePrev} data-testid="button-tutorial-prev">
                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                  </Button>
                )}
                {isFirst && (
                  <Button size="sm" variant="ghost" onClick={handleClose} data-testid="button-tutorial-skip" className="text-muted-foreground">
                    Skip Tour
                  </Button>
                )}
                <Button size="sm" onClick={handleNext} data-testid="button-tutorial-next">
                  {isLast ? "Get Started" : "Next"}
                  {isLast ? <Rocket className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="px-5 pb-3" aria-hidden="true">
            <p className="text-[10px] text-muted-foreground/60 text-center">
              Use arrow keys to navigate · Press Esc to close
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
