# Grinder Queue Dashboard

## Overview
The Grinder Queue Dashboard is a full-stack web application and Discord bot designed to efficiently manage gaming service queues. Its primary goal is to optimize service delivery, improve staff productivity, and enhance the grinder experience. The system offers comprehensive tools for order management, performance monitoring, and communication through both a web interface and Discord. A key component is the Grinder Bot, which passively monitors an existing MGT Bot in Discord to automatically populate the database with real-time order and proposal data. The project aims to provide a robust platform for managing gaming services, improving operational efficiency, and creating a better experience for all users involved.

## User Preferences
I prefer iterative development with clear communication on major changes. I appreciate detailed explanations, especially for complex architectural decisions. Do not make changes to files related to Discord IDs unless explicitly requested.

## System Architecture
The system utilizes a modern full-stack architecture. The frontend is built with React, Vite, Tailwind CSS, and shadcn/ui, featuring a professional dark mode theme. The backend is an Express.js application interacting with PostgreSQL via Drizzle ORM for data persistence. Discord OAuth2 handles authentication, implementing role-based access control for Staff and Grinders. A discord.js v14 bot operates concurrently with the web server, sharing the same database.

**UI/UX Decisions:**
- Dedicated, multi-page dashboards for Staff and Grinders, focusing on KPIs, order pipelines, bidding countdowns, alerts, and role-based theming.
- Visual lifecycle management for orders with distinct status indicators.
- A multi-step confirmation process for payouts, including approval, dispute resolution, and staff review.
- Integrated group chat and DM functionality with file attachments and @mentions.
- Lower-third popups with distinct sounds for various event types, supporting clickable navigation, with a volume slider control (0–100%) persisted in localStorage.
- Reusable component for tracking activities and contextual `HelpTip` components on grinder pages.
- Professional dark mode theme with role-based styling (e.g., owner theme with gold accents).

**Technical Implementations:**
- **MGT Bot Watcher:** Passively monitors Discord channels for MGT Bot embeds to extract and backfill order, grinder, and bid data.
- **Role-Based Features:** Supports multi-role grinders, elite priority order access, and staff alert messaging.
- **Performance Management:** Includes Elite Path Coaching, a Strike Management System, and an Activity Checkpoint System.
- **Order Management:** Features live bidding countdowns, staff override capabilities, manual order creation, Discord ticket linking, and automated price setting prompts for priceless orders.
- **Reporting & Analytics:** Centralized stats recalculation for quality scores, completion rates, win rates, and earnings; auto-generated performance reports and detailed business analytics.
- **Grind Repair System:** Comprehensive order auditing with types for fixing existing orders, claiming missing in-progress orders, and adding completed orders.
- **Twitch Integration:** Grinders can link Twitch accounts for staff viewing and automatic activity checkpoint generation.
- **Completion Video Proof:** Grinders must upload video proof for staff review upon order completion.
- **Audit Logging:** Comprehensive logging of all grinder self-service actions and checkpoint time edits.
- **Grinder Queue Position:** Calculates and displays a grinder's rank using a 9-factor AI queue system, providing personalized tips.
- **Badge Management System:** Dedicated page for staff/owners to manage achievement badges (auto-earned and manual) with a progression system across tiers.
- **Staff and Owner Dashboards:** Specialized dashboards with KPIs, activity logs, and quick-action cards tailored to their roles.
- **Service Management:** Owners can toggle services on/off, affecting visibility in analytics and order creation.
- **Payout Reduction System:** Staff can request payout reductions, requiring owner approval, with reasons and audit trails.
- **Deletion Request Workflow:** Staff can request deletion of various entities, requiring owner approval.
- **Multi-Tier Grinder Roles:** Supports multiple simultaneous grinder roles and progression tiers, displayed with badges and editable via scorecard.
- **Fine Payment System:** Grinders can submit fine payments with proof for staff review, impacting company profit.
- **Business Wallet System:** Comprehensive financial tracking with company and personal wallet scopes, per-wallet KPIs, order payment linking (tracks which wallet received payment and transfer status), staff transfer restrictions (personal→company only, pending approval), configurable payout roles/categories, proof URL support on transfers/payouts, outstanding transfer alerts, and integration with grinder payouts and fine payments. User "davidgrinds" (ID: 872820240139046952) is blocked from accessing Wallets and Business Performance.

## External Dependencies
- **PostgreSQL:** Primary database, managed with Drizzle ORM.
- **Discord API:** Used for OAuth2 authentication, bot interactions, slash commands, and MGT Bot message monitoring.
- **MGT Bot:** An existing Discord bot passively monitored for order and proposal data.
- **OpenAI:** Utilized for AI-driven text rewriting.