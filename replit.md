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
- **Order Repair System:** Comprehensive order auditing with types for fixing existing orders, claiming missing in-progress orders, and adding completed orders.
- **Twitch Integration:** Grinders can link Twitch accounts for staff viewing and automatic activity checkpoint generation.
- **Completion Video Proof:** Grinders must upload video proof for staff review upon order completion.
- **Audit Logging:** Comprehensive logging of all grinder self-service actions and checkpoint time edits.
- **Grinder Queue Position:** Calculates and displays a grinder's rank using a 9-factor AI queue system, providing personalized tips.
- **Badge Management System:** Dedicated page for staff/owners to manage achievement badges (auto-earned and manual) with a progression system across tiers.
- **Staff and Owner Dashboards:** Specialized dashboards with KPIs, activity logs, and quick-action cards tailored to their roles.
- **Service Management:** Owners can toggle services on/off, affecting visibility in analytics and order creation.
- **Payout Reduction System:** Staff can request payout reductions, requiring owner approval, with reasons and audit trails.
- **Deletion Request Workflow:** Staff can request deletion of various entities, requiring owner approval.
- **Multi-Tier Grinder Roles:** Supports multiple simultaneous grinder roles and progression tiers, displayed with badges and editable via scorecard. Grinders with multiple roles can have a `displayRole` set to control which role's icon is shown across the app (grinder list, queue, dashboard, analytics, overview). Set via Admin > Management > Edit Grinder Profiles.
- **Fine Payment System:** Grinders can submit fine payments with proof for staff review, impacting company profit.
- **Business Wallet System:** Comprehensive financial tracking with company and personal wallet scopes, per-wallet KPIs, order payment linking (staff can only link to own wallets, not company), staff transfer restrictions (personal→own wallets, company, or other staff personal wallets — all pending approval), transfer fee tracking (`transferFee` column on walletTransfers), configurable payout roles/categories, file upload proof attachments on transfers/payouts/order-links, outstanding transfer alerts, wallet notifications (transfer submitted/approved, payout created/approved/rejected/paid), staff can add/remove money on own personal wallets, owners see "Request Transfer" button on staff wallets (not Add/Remove), "Create Payout" is owner-only, and integration with grinder payouts and fine payments. User "davidgrinds" (ID: 872820240139046952) is blocked from Business Performance but has access to Wallets.
- **Combined Admin Page:** Operations and Admin merged into a single page with 3 tabs — Operations (order management, alerts, overrides), Management (elite requests, strikes, limits, profiles, tasks), and System (owner-only: bot toggle, maintenance mode, services, deletion requests, clear data). The `/operations` route redirects to `/admin`.
- **MGT Bot Data Tracking Toggle:** Owners can enable/disable automatic data import from the MGT Discord bot via `queueConfig.mgtBotEnabled` field. Toggle in Admin > System tab.
- **Maintenance Mode:** Owner "imjustmar" can toggle maintenance mode to restrict site access. Stored in `queueConfig.maintenanceMode` and `maintenanceModeSetBy`. Banner shown at top of Admin page when active.
- **Order ID Editing:** Owners can inline-edit the `mgtOrderNumber` for any order directly in the Orders table. The pencil icon appears on hover; staff see static text.
- **Enhanced Grinder Scorecard:** The "My Scorecard" page now includes Tier Progress visualization, Payout Summary (total paid, pending, recent/pending payouts list), Completed Orders history, and a permanently visible Strike & Fine History section (shows "Clean record" when empty). Synthetic order logs use `grinderEarnings` for accurate pay display. Staff-facing scorecard (in Grinder Roster) shows availability status badge, note, last-updated date, and "At Limit" indicator. Roster list has colored availability dots on grinder icons (green=available, amber=busy, orange=away, gray=offline, red=removed).
- **Early Access Mode:** Owners can restrict dashboard access to Elite Grinders only via `queueConfig.earlyAccessMode`. When enabled, regular grinders and users without the Elite Discord role see an "Early Access Only" denied page. Staff and owners bypass this. Enforced both frontend (App.tsx ProtectedRoute/HomeRedirect) and backend (global API middleware returns 403 for non-elite grinders). Toggle in Admin > System tab. API: PATCH /api/config/early-access.
- **Site Alerts System:** Owners can broadcast scrolling ticker-bar alerts that stick to the bottom of every page. Stored in `site_alerts` table with fields: id, message, target (all/staff/grinders/user), targetUserId, targetUserName, enabled, createdBy, createdByName, createdAt. Managed in Admin > System tab. Targeting options: Everyone, Staff Only, Grinders Only, Specific User (with grinder search). Users can dismiss alerts locally. API routes: GET/POST /api/site-alerts, GET /api/site-alerts/all (owner), PATCH/DELETE /api/site-alerts/:id (owner). Component: `SiteAlertTicker` in layout.tsx renders a CSS-animated scrolling marquee with amber/dark theme styling.
- **Discord Customer Service Pipeline:** Full customer-facing update system via the Discord bot. Schema fields: `customerDiscordId` on orders, `customerApproved`/`customerApprovedAt`/`customerApprovalToken` on assignments, `proofUrls` on orderUpdates, `customerUpdatesEnabled` on queueConfig. Backend: `server/discord/customerUpdates.ts` module with `sendCustomerUpdate` and `sendCompletionApprovalRequest` functions. Lifecycle hooks send updates to customer ticket channels on order events (login, logoff, progress, completion, replacement, deadline). Completion flow gates payout on customer approval when `discordTicketChannelId` + `customerDiscordId` are set. Customer slash commands: `/requestupdate`, `/orderstatus`, `/myorders` (public, no staff role). Staff force-approve: `PATCH /api/staff/assignments/:id/force-approve`. Admin toggle: `PATCH /api/config/customer-updates`. Repair flows (claim_missing, add_completed) also trigger customer approval. Frontend: customer Discord ID field in bids ticket dialog, proof URL inputs in grinder update forms, customer approval badges on assignments/payouts, force-approve button, admin toggle in System tab. Documented in staff/grinder ops guides and features page.

- **Interactive Tutorial:** Role-aware guided tour for new users (`client/src/components/interactive-tutorial.tsx`). Auto-launches on first visit (1.5s delay), with separate step flows for grinder vs staff/owner roles. Features: spotlight overlay highlighting real UI elements (sidebar, header, main content), animated demo sequences showing order/bid/assignment workflows, step-by-step navigation with progress bar, focus trap and ARIA modal for accessibility, keyboard navigation (arrows/enter/esc), localStorage-persisted completion state per role, and a floating replay button (bottom-right). Integrated via `layout.tsx`.

## External Dependencies
- **PostgreSQL:** Primary database, managed with Drizzle ORM.
- **Discord API:** Used for OAuth2 authentication, bot interactions, slash commands, and MGT Bot message monitoring.
- **MGT Bot:** An existing Discord bot passively monitored for order and proposal data.
- **OpenAI:** Utilized for AI-driven text rewriting.