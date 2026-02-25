# Grinder Queue Dashboard

## Overview
The Grinder Queue Dashboard is a full-stack web application and Discord bot designed to manage gaming service queues. Its core purpose is to optimize service delivery, enhance staff efficiency, and improve the grinder experience. The system provides comprehensive tools for order management, performance tracking, and communication through both a web interface and Discord. A key feature is the Grinder Bot, which passively monitors an existing MGT Bot in Discord to automatically populate the database with real-time order and proposal data.

## User Preferences
I prefer iterative development with clear communication on major changes. I appreciate detailed explanations, especially for complex architectural decisions. Do not make changes to files related to Discord IDs unless explicitly requested.

## System Architecture
The system employs a modern full-stack architecture. The frontend is built with React, Vite, Tailwind CSS, and shadcn/ui, featuring a professional dark mode theme. The backend is an Express.js application utilizing PostgreSQL with Drizzle ORM for data persistence. Authentication is handled via Discord OAuth2, implementing role-based access control for Staff and Grinders. A discord.js v14 bot runs alongside the web server, sharing the same database.

**UI/UX Decisions:**
- **Dashboards:** Dedicated, multi-page dashboards for Staff and Grinders, emphasizing KPIs, order pipelines, bidding countdowns, alerts, and role-based theming.
- **Order Flow:** Visual lifecycle management for orders with distinct status indicators.
- **Payout Workflow:** A multi-step confirmation process for payouts including approval, dispute resolution, and staff review.
- **Chat Messaging System:** Integrated group chat and DM functionality with file attachments and @mentions.
- **Notifications:** Lower-third popups with distinct sounds for various event types.
- **Activity Calendar:** Reusable component for tracking activities.
- **Help Tooltips:** Contextual `HelpTip` components on grinder pages for on-demand explanations. Removed from staff/owner pages to reduce visual clutter.

**Technical Implementations:**
- **MGT Bot Watcher:** Passively monitors Discord channels for MGT Bot embeds, extracting and backfilling order, grinder, and bid data.
- **Role-Based Features:** Supports multi-role grinders, elite priority order access, and staff alert messaging.
- **Performance Management:** Includes Elite Path Coaching, a Strike Management System, and an Activity Checkpoint System.
- **Order Management:** Features live bidding countdowns, staff override capabilities, manual order creation, and Discord ticket linking.
- **Reporting & Analytics:** Centralized stats recalculation for quality scores, completion rates, win rates, and earnings. Auto-generated performance reports and detailed business analytics.
- **Scorecard & AI Queue Guide:** A combined page explaining the letter grading system, quality score factors, AI queue factors, boost modifiers, and queue position guidance.
- **Features Pages:** Comprehensive overviews of dashboard capabilities for both Staff and Grinders.
- **Content Management:** Systems for Events & Promotions, Order Briefs, and AI-rewritten Dev Patch Notes.
- **Customer Reviews:** A two-step secure system for customers to submit reviews, including a password-protected access mechanism and staff approval workflow.
- **Missing Order Claims:** Grinders can request to link existing orders to their profile, pending staff approval. Staff sidebar label: "Missing Order Claims".
- **Daily Checkup Controls:** Global and per-order controls for enabling/disabling daily update checks.
- **Twitch Integration:** Grinders can link Twitch accounts, enabling staff to view live streams and automatically generate activity checkpoints.
- **Completion Video Proof:** Grinders must upload video proof upon order completion, which staff can review.
- **Activity Checkpoint Ticket Response:** Accept/Decline options with confirmation modals and required reasons for declines.
- **Platform-Specific Icons:** Dynamic display of gaming platform logos on grinder assignment cards.
- **Start Order Flow:** Guided process for grinders to start orders, log in/out, and track order status with corresponding checkpoints.
- **Checkpoint Time Editing:** Staff/owners can edit checkpoint timestamps with audit logging.
- **Grinder Audit Logging:** Comprehensive logging of all grinder self-service actions for accountability.
- **Audit Log Formatting:** Standardized Title Case formatting for all audit log displays.
- **Order To-Do List:** A grinder-specific page combining an activity checkpoints guide with auto-generated and custom staff tasks.
- **Grinder Queue Position:** Calculates and displays a grinder's rank across open orders using a 9-factor AI queue system, providing personalized tips without revealing other grinders' data.
- **Replacement Orders Section:** Emergency/replacement orders are highlighted in a dedicated section on the Available Orders page.
- **Grinder Notifications Page:** Dedicated page for an alerts inbox with unread badge count.
- **Grinder Status Page:** Refocused to contain Elite Status/coaching metrics, requests, and Twitch Integration linking.
- **Strike Appeals System:** Grinders can appeal strikes, which staff can review, approve, or deny, with audit trails.
- **Operations Guides:** Slide-deck-style presentation pages for both Grinders and Staff, providing step-by-step instructions and key feature descriptions.
- **Payment Proof on Mark Paid:** Staff/owners can upload payment proof when marking a payout as paid.
- **Payout Filters:** Staff payouts page includes status and grinder name filters applied before categorization, with a clear button.
- **Badge Management Page:** Dedicated `/badges` page for staff/owners to search grinders and award/remove achievement badges. Both auto-earned and manual staff-awarded badge types. Schema: `grinder_badges` table.
- **Owner Dashboard Upgrade:** Owner overview has a premium hero header with Crown icon and gold accents, plus quick-action cards for Business, Payouts, Admin, and Badges. Owner theme uses darker card backgrounds, red-tinted borders, and gold accent color.
- **Staff Notifications Filters:** Severity and read/unread status filters on the notifications page, with clear button and result count.
- **Payout Reduction System:** Staff can request payout reductions with a reason; if staff submits, owner must approve/deny. Owners can apply reductions directly. Difference goes to company profit (updates `orders.companyProfit` and `assignments.grinderEarnings`). Schema fields on `payoutRequests`: `originalAmount`, `reductionReason`, `reductionRequestedBy`, `reductionRequestedAt`, `reductionStatus` (pending/approved/denied), `reductionApprovedBy`, `reductionApprovedAt`, `reductionDeniedReason`. Routes: `PATCH /api/staff/payout-requests/:id/reduce` (requireStaff), `PATCH /api/staff/payout-requests/:id/reduction-review` (requireOwner). Owner sees "Payout Reductions Pending Approval" section on Payouts page.

## External Dependencies
- **PostgreSQL:** Primary database, managed with Drizzle ORM.
- **Discord API:** Used for OAuth2 authentication, bot interactions, slash commands, and MGT Bot message monitoring.
- **MGT Bot:** An existing Discord bot passively monitored for order and proposal data.
- **OpenAI:** Utilized for AI-driven text rewriting (e.g., dev patch notes).