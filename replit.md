# Grinder Queue Dashboard

## Overview
The Grinder Queue Dashboard is a full-stack web application and Discord bot designed to streamline the management of gaming service queues. It enables staff to oversee grinders (service providers), orders, bids, and assignments through both a web interface and Discord slash commands. A key feature is the Grinder Bot, which passively monitors an existing MGT Bot in Discord to automatically populate the database with real-time order and proposal data. The project aims to optimize service delivery, improve staff efficiency, and enhance the grinder experience by providing tools for order management, performance tracking, and communication.

## User Preferences
I prefer iterative development with clear communication on major changes. I appreciate detailed explanations, especially for complex architectural decisions. Do not make changes to files related to Discord IDs unless explicitly requested.

## System Architecture
The system employs a modern full-stack architecture. The frontend is built with **React, Vite, Tailwind CSS, and shadcn/ui**, featuring a professional dark mode theme. The backend is an **Express.js** application utilizing **PostgreSQL** with **Drizzle ORM** for data persistence. Authentication is handled via **Discord OAuth2**, implementing role-based access control for Staff and Grinders. A **discord.js v14** bot runs alongside the web server, sharing the same database.

**UI/UX Decisions:**
- **Staff Dashboard:** Refactored into six focused pages (Overview, Operations, Analytics, Payouts, Reports, Admin) with sidebar navigation for clarity and ease of use. Key Performance Indicators (KPIs), order pipelines, bidding countdowns, and risk alerts are prominently displayed. Reports page provides performance report review/approval, activity checkpoint monitoring, and order update acknowledgment.
- **Grinder Dashboard:** Refactored into eight focused pages (Overview, Available Orders, My Work, My Bids, Payouts, Scorecard, Status, Guide) with sidebar navigation, mirroring the staff dashboard structure. Uses shared `use-grinder-data` hook for data fetching. Grinders can set availability statuses. Theming adjusts based on role: regular grinders use Discord purple, while elite grinders use cyan for an elevated feel.
- **Order Flow:** Comprehensive lifecycle management including "Need Replacement", "In Progress", "Completed", and "Paid Out" statuses, each with distinct visual indicators.
- **Payout Workflow:** A multi-step payout confirmation process involving grinder approval, dispute resolution, and staff review ensures accurate and fair compensation.

**Technical Implementations:**
- **MGT Bot Watcher:** Passively monitors specific Discord channels for MGT Bot embeds, automatically extracting and storing order, grinder, and bid data.
- **Multi-Role Grinder Support:** Grinders can hold multiple roles, dynamically filtered and displayed across the platform.
- **Elite Path Coaching:** AI analyzes grinder metrics against elite averages to provide actionable improvement tips.
- **Strike Management System:** Allows staff to issue strikes with reasons and fines, leading to temporary suspension and requiring fine payment for reinstatement.
- **Elite Priority Order Access:** Elite grinders receive a 5-minute head start on new order bidding.
- **Staff Alert Messaging:** Staff can send custom, severity-tagged alerts to individual or all grinders.
- **Grinder Rules Acceptance:** Grinders must accept rules before bidding, enforced both in the dashboard and via Discord commands.
- **Live Bidding Countdown Timer:** A 10-minute countdown starts on the first bid, with live updates and Discord notifications, automatically closing bidding upon expiration.
- **Staff Override Assign:** Staff can manually assign grinders to orders, automatically handling bid acceptance and denial, and updating grinder stats.
- **Manual Order Creation:** Staff can create orders directly from the dashboard, with options for public visibility or private assignment.
- **Centralized Stats Recalculation:** `server/recalcStats.ts` provides `recalcGrinderStats()` used by routes.ts, mgtWatcher.ts, and repairSync.ts for consistent quality score (0-100), completion rate, win rate, and earnings calculations. Quality score now includes daily update compliance (15% weight).
- **Activity Checkpoint System:** 5 checkpoint types (Acknowledge Ticket yes/no, Log In/Out, Order Issue, Daily Order Update). Grinders use buttons on active assignments to track activity. Checkpoint history viewable per assignment.
- **Performance Reports:** Auto-generated per assignment with metrics snapshot, checkpoint summary, daily update compliance, and overall grade (A-F). Staff reviews, adds notes, and approves. Grinders see approved reports on their Scorecard page.
- **Daily Update Deadline Checker:** `server/dailyUpdateChecker.ts` runs every 60s, checking at 12:30 AM ET for missed daily updates on active assignments. Creates `missed_update` checkpoints, sends staff alerts, and triggers stats recalculation.
- **Grinder Scorecard:** Dedicated page showing quality score grade, key performance metrics with progress bars, approved performance reports history, and checkpoint activity summary.

## External Dependencies
- **PostgreSQL:** Primary database for all application data, managed with Drizzle ORM.
- **Discord API:** Used for OAuth2 authentication, Discord bot interactions, slash commands, and real-time monitoring of MGT Bot messages.
- **MGT Bot:** An existing Discord bot that this system passively monitors for order and proposal data.

## Recent Changes (Feb 2026)
- **Chat Messaging System:** DM-style messaging between staff and grinders via slide-out ChatDrawer panel. Tables: `message_threads`, `messages`. Routes: `/api/chat/threads`, `/api/chat/threads/:id/messages`.
- **Lower-Third Notification Popups:** Animated toast-like notifications at bottom-right, role-scoped (staff/grinder/all). Table: `notifications`. Routes: `/api/notifications`, `/api/notifications/:id/read`.
- **Notification Triggers:** Auto-created on order creation (grinder scope), strike events (per-user).
- **Twitch Integration:** Grinders link Twitch username from Status page. Staff view embedded live streams on `/streams` (Content Multiplayer page). Field: `grinders.twitch_username`. Routes: `/api/grinders/:id/twitch`, `/api/grinders/live-streams`.
- **Framer Motion Animations:** All 19+ pages use AnimatedPage/FadeInUp stagger animations. SP logo across sidebar, auth, headers.
- **Events & Promos System:** Staff create/edit/delete events (in-game events, promotions with discount %, announcements) with priority, tags, active/inactive toggle. Grinders view active events on dedicated page. Table: `events`. Routes: `/api/events`, `/api/events/:id`. Pages: `/events` (staff), `/grinder/events` (grinder).
- **Order Brief System:** Orders have `orderBrief` (auto-populated from MGT watcher embeds) and `discordBidLink` fields. Staff edit briefs via icon in order table. Grinders click "View Details" button on available orders to see full brief in modal. Fields on `orders` table: `orderBrief`, `discordBidLink`.