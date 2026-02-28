# Grinder Queue Dashboard

## Overview
The Grinder Queue Dashboard is a full-stack web application and Discord bot designed to efficiently manage gaming service queues. Its primary goal is to optimize service delivery, improve staff productivity, and enhance the grinder experience. The system offers comprehensive tools for order management, performance monitoring, and communication through both a web interface and Discord. A key component is the Grinder Bot, which passively monitors an existing MGT Bot in Discord to automatically populate the database with real-time order and proposal data. The project aims to provide a robust platform for managing gaming services, improving operational efficiency, and creating a better experience for all users involved, with a vision to streamline operations and enhance market presence in the gaming service industry.

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
- Professional dark mode theme with role-based styling.

**Technical Implementations:**
- **MGT Bot Watcher:** Passively monitors Discord channels for MGT Bot embeds to extract and backfill order, grinder, and bid data.
- **Role-Based Features:** Supports multi-role grinders, elite priority order access, and staff alert messaging with distinct dashboards for Staff and Owners.
- **Performance Management:** Includes Elite Path Coaching, a Strike Management System, and an Activity Checkpoint System.
- **Order Management:** Features live bidding countdowns, staff override capabilities, manual order creation, Discord ticket linking, and automated price setting prompts for priceless orders.
- **Reporting & Analytics:** Centralized stats recalculation for quality scores, completion rates, win rates, and earnings; auto-generated performance reports and detailed business analytics.
- **Order Repair System:** Comprehensive order auditing with types for fixing existing orders, claiming missing in-progress orders, and adding completed orders.
- **Twitch Integration:** Grinders can link Twitch accounts for staff viewing and automatic activity checkpoint generation.
- **Completion Video Proof:** Grinders must upload video proof for staff review upon order completion.
- **Audit Logging:** Comprehensive logging of all grinder self-service actions and checkpoint time edits.
- **Grinder Queue Position:** Calculates and displays a grinder's rank using a 9-factor AI queue system, providing personalized tips.
- **Badge Management System:** Dedicated page for staff/owners to manage achievement badges (auto-earned and manual) with a progression system across tiers. Includes 11 service-specific specialist badges (VC, Rep, Badge, HotZones, Build, Challenge, Card, Event, Bundle, Season, Add-Ons).
- **Staff Performance Card System:** Staff Team cards on the owner's overview page showing each staff member's activity metrics. Clicking a card opens a "Performance Card" dialog with profile, badges (using StaffBadgeGrid with desktop hover tooltips and mobile click-to-expand), performance stats (orders managed, bids reviewed, assignments, payouts), action breakdown, and recent activity log. API: `GET /api/staff/scorecard/:userId`. Dedicated "My Performance" page at `/my-performance` (staffOnly) with profile header, badges, 8 KPI cards, action breakdown chart, recent activity feed, and tasks section.
- **Financial Management:** Includes a Payout Reduction System, Deletion Request Workflow, Fine Payment System, and a comprehensive Business Wallet System with detailed financial tracking, transfer capabilities, and robust notification systems.
- **Admin Functionality:** Combined admin page for operations, management, and system settings, including toggles for MGT Bot data tracking, maintenance mode, order ID editing, and early access mode.
- **Site Alerts System:** Owners can broadcast scrolling ticker-bar alerts with targeting options for various user groups.
- **Discord Customer Service Pipeline:** Full customer-facing update system via the Discord bot, including automated updates on order events, customer approval for payouts, and customer-facing slash commands.
- **User Activity Log:** Owner-only admin page for tracking user sessions, page visits, and actions across the platform with filtering capabilities.
- **Staff Auto To-Do List:** System-generated action items based on order and assignment statuses, grouped by category and sortable by priority, with staff dismissal functionality.
- **Internal Staff Alerts:** Grinders can send internal, staff-only alerts for specific orders without customer notification.
- **Interactive Tutorial:** An auto-discovering guided tour for new users, generating steps from navigation items and supporting rich descriptions and animated demos.

## External Dependencies
- **PostgreSQL:** Primary database.
- **Discord API:** Used for OAuth2 authentication, bot interactions, slash commands, and MGT Bot message monitoring.
- **MGT Bot:** An existing Discord bot passively monitored for order and proposal data.
- **OpenAI:** Utilized for AI-driven text rewriting.
- **Replit Object Storage:** Cloud file storage for all uploaded files (proofs, attachments, etc.).