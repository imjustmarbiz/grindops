# Grinder Queue Dashboard

## Overview
The Grinder Queue Dashboard is a full-stack web application and Discord bot designed to manage gaming service queues. Its primary purpose is to optimize service delivery, improve staff efficiency, and enhance the grinder experience by providing tools for order management, performance tracking, and communication. Key capabilities include overseeing grinders, orders, bids, and assignments through both a web interface and Discord commands. A unique feature is the Grinder Bot, which passively monitors an existing MGT Bot in Discord to automatically populate the database with real-time order and proposal data.

## User Preferences
I prefer iterative development with clear communication on major changes. I appreciate detailed explanations, especially for complex architectural decisions. Do not make changes to files related to Discord IDs unless explicitly requested.

## System Architecture
The system employs a modern full-stack architecture. The frontend is built with React, Vite, Tailwind CSS, and shadcn/ui, featuring a professional dark mode theme. The backend is an Express.js application utilizing PostgreSQL with Drizzle ORM for data persistence. Authentication is handled via Discord OAuth2, implementing role-based access control for Staff and Grinders. A discord.js v14 bot runs alongside the web server, sharing the same database.

**UI/UX Decisions:**
- **Dashboards:** Dedicated dashboards for Staff and Grinders, each with a multi-page sidebar navigation for focused functionality. Both dashboards emphasize clear presentation of KPIs, order pipelines, bidding countdowns, and alerts. Grinder dashboard theming adjusts based on role (regular vs. elite).
- **Order Flow:** Comprehensive lifecycle management with distinct visual indicators for statuses like "Need Replacement", "In Progress", "Completed", and "Paid Out".
- **Payout Workflow:** A multi-step confirmation process involving grinder approval, dispute resolution, and staff review.
- **Chat Messaging System:** Integrated group chat and DM functionality between staff and grinders via a slide-out panel, supporting file attachments and @mentions.
- **Notifications:** Lower-third popups with distinct sounds for various event types (e.g., new order, strike).
- **Activity Calendar:** Reusable component for tracking various activities for both staff and grinders.
- **Help Tooltips:** Contextual `HelpTip` components for on-demand explanations across the platform.

**Technical Implementations:**
- **MGT Bot Watcher:** Passively monitors Discord channels for MGT Bot embeds to automatically extract order, grinder, and bid data. On startup, backfills the last 100 messages from both bid war and proposals channels to catch any missed while offline. Edited proposal messages are fully re-processed (data + status) via `handleMessageUpdate`, which also handles bid war channel edits.
- **Role-Based Features:** Supports multi-role grinders, elite priority order access, and staff alert messaging.
- **Performance Management:** Includes an Elite Path Coaching system for personalized tips, a Strike Management System with fines and suspensions, and an Activity Checkpoint System for daily update compliance.
- **Order Management:** Features live bidding countdown timers, staff override assignment capabilities (including replacement logic with profit calculation), manual order creation, and a system for linking Discord tickets to orders.
- **Reporting & Analytics:** Centralized stats recalculation for consistent quality scores, completion rates, win rates, and earnings. Auto-generated performance reports per assignment with grades and staff review. Dedicated pages for Services Overview and Business Performance (owner-only) providing detailed analytics, financial insights, and profitability summaries.
- **Content Management:** Systems for Events & Promotions, Order Briefs (auto-populated and editable), and Dev Patch Notes (AI-rewritten for grinders).
- **Customer Reviews:** Functionality for grinders/staff to submit customer reviews with ratings and proof, subject to staff approval.
- **Order Claim Requests:** Grinders can request to link existing orders to their profile, subject to staff approval.
- **Daily Checkup Controls:** Global and per-order controls for enabling/disabling daily update checks.
- **Twitch Integration:** Grinders can link Twitch accounts, allowing staff to view embedded live streams.
- **Completion Video Proof:** Grinders must upload video proof (order completion + account removal from console) via `/api/grinder/me/upload-proof` when marking an order complete. Stored in `payoutRequests.completionProofUrl`. Staff can view proof links on the Payouts page. Videos stored in `uploads/proofs/` with 100MB limit.
- **Activity Checkpoint Ticket Response:** Accept/Decline ticket buttons disappear after response (tracked via `hasTicketAck` flag from API). Confirmation modal required before submitting. Declined tickets require a reason note.
- **Platform-Specific Icons:** Log In/Log Off buttons on grinder assignment cards show platform logos (Xbox, PS5, Steam, Nintendo Switch) based on the order's platform field. Uses `react-icons/fa6` (FaXbox) and `react-icons/si` (SiPlaystation5, SiSteam, SiNintendoswitch).
- **Start Order Flow:** Grinder assignment cards have button order: Ticket → Start Order → Log In → Log Off → Issue → History. Start Order and Log Off are disabled until Log In is clicked. Log In and Log Off are mutually exclusive (only one enabled at a time based on `isLoggedIn` state from API). Start Order can only be clicked once, then shows "Order Started" badge. Sets `startedAt` on assignment and updates order status to "In Progress". `start_order` checkpoint type validated server-side.
- **Checkpoint Time Editing:** Staff/owners can edit checkpoint timestamps via pencil icon in Reports → Activity Checkpoints tab. Route: `PATCH /api/staff/checkpoints/:id/edit-time`. Creates audit log entry for accountability.

## External Dependencies
- **PostgreSQL:** Primary database for all application data, managed with Drizzle ORM.
- **Discord API:** Used for OAuth2 authentication, Discord bot interactions, slash commands, and real-time monitoring of MGT Bot messages.
- **MGT Bot:** An existing Discord bot that this system passively monitors for order and proposal data.
- **OpenAI:** Utilized for AI-driven rewriting of dev patch notes.

## Key Implementation Details
- **Platform Normalization:** `normalizePlatform()` function in `shared/schema.ts` standardizes platform names: anything with "xbox"/"xb" → "Xbox", anything with "ps"/"playstation" → "PS5", "pc"/"steam"/"epic" → "PC", "switch"/"nintendo" → "Nintendo". Applied server-side on order create/update, in MGT watcher on ingest, and client-side in analytics (services.tsx, business.tsx). Both files import from `@shared/schema` instead of local copies.
- **Daily Checkup Controls:** Owner-only controls in Admin tab. Global toggle via `queueConfig.dailyCheckupsEnabled`, per-order via `orders.skipDailyCheckup`. Routes: `GET /api/daily-checkups/config`, `PATCH /api/daily-checkups/global`, `PATCH /api/daily-checkups/order/:orderId`. The checker in `server/dailyUpdateChecker.ts` respects both flags.
- **Location Field Removed:** Removed from orders UI (form + inline edit). Column remains in DB schema but is unused.