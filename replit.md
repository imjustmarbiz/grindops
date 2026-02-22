# Grinder Queue Dashboard

## Overview
A fullstack web dashboard + Discord bot for managing a gaming services queue system. Staff can manage grinders (workers), orders, bids, and assignments through both a web interface and Discord slash commands. The Grinder Bot passively monitors an existing MGT Bot in Discord to automatically build the database from real order and proposal data.

## Recent Changes
- 2026-02-22: Refactored staff dashboard into 5 focused pages with sidebar navigation
  - Overview: KPIs, search, order pipeline, bidding countdown, recent activity, risk alerts
  - Operations: Create manual order, staff override assign, alert composer
  - Analytics: Revenue split, fleet utilization, bid conversion, top earners, service distribution, elite vs grinder
  - Payouts: Payout management, payout requests, grinder order updates
  - Admin: Elite requests, strike management, order limits, owner profile editing, replacement tracker
  - Shared useStaffData hook for efficient data fetching across pages
  - New staff-utils.tsx with reusable chart/display components (AnimatedRing, MiniBar, PipelineStep)
- 2026-02-22: Initial build with database schema, API routes, and Discord bot integration
- 2026-02-22: Added MGT Bot watcher - monitors bid war channel and bid proposals channel to auto-import orders, grinders, and bids from MGT Bot embeds
- Schema updated with Discord-specific fields (mgtOrderNumber, discordMessageId, platform, gamertag, discordUserId, mgtProposalId, timeline, canStart, qualityScore)
- Removed dummy seed data; database now populated from real MGT Bot activity
- 2026-02-22: Replaced Replit Auth with Discord OAuth2 authentication
  - Staff role (1466369178729578663) gets full dashboard access
  - Grinder role (1466369179648004224) sees personal profile only (no prices/profits/company analytics)
  - All sensitive API endpoints protected with requireStaff middleware
  - OAuth2 flow includes CSRF state parameter protection
  - Grinder personal endpoint at /api/grinder/me strips sensitive data
- 2026-02-22: Added onboarding preview + dashboard guides
  - Grinders with no profile see rich onboarding page: welcome hero, 4-step getting started guide, 9 dashboard feature preview cards, CTA to Discord
  - Grinder dashboard has "Guide" tab with 8-step usage instructions and 6 tips for success
  - Staff dashboard has "How to Use the Command Center" card with 10-step guide and pro tip
- 2026-02-22: Enhanced grinder dashboard with order viewing, bidding, updates, payouts, AI coaching
- 2026-02-22: Added Elite Path Coaching system
  - AI compares grinder metrics vs elite grinder averages, gives actionable tips
  - Grinders can request elite status; staff reviews/approves from dashboard
  - Elite vs Regular grinder performance comparison on staff dashboard
- 2026-02-22: Added Strike Management system with Fine Enforcement
  - Staff can add/remove strikes with reasons from dashboard
  - Strike logs with full history, grinder notifications
  - Grinders see strike status/history in their dashboard with acknowledge flow
  - Strike fines: Strike 1=$25, Strike 2=$50, Strike 3=$100
  - Grinders are suspended when they receive a strike; must pay fines before resuming orders
  - Suspended grinders cannot place bids or be assigned orders
  - Staff can mark fines as paid from dashboard, which lifts suspension
  - Fine amounts shown on strike log entries (paid/unpaid status)
  - Suspension banner on grinder dashboard with fine policy info
- 2026-02-22: Added Elite Priority Order Access
  - Elite grinders get 5-minute head start to see and bid on new orders
  - Regular grinders see orders after the 5-minute priority window
  - "Elite Early Access" badge on priority-window orders in grinder dashboard
  - Backend enforcement: non-elite bid attempts during priority window return 403
- 2026-02-22: Added Staff Alert Messaging system
  - Staff can send custom alerts to all grinders or individual grinders
  - Severity levels: info, warning, success, danger
  - Grinders see alerts inbox with read/unread tracking
- 2026-02-22: Added Grinder Rules & Guidelines acceptance system
  - Grinders must accept rules before placing any bids (dashboard or Discord)
  - Rules accepted via "I Accept the Rules" button on grinder dashboard
  - Grinder Bot also watches for MGT Bot embeds confirming rules acceptance and auto-updates database
  - Amber banner on grinder dashboard when rules not accepted with full rules display
  - "Rules Pending" badge on staff dashboard grinder list
  - Backend enforcement: POST /api/grinder/me/bids returns 403 if rules not accepted
  - Discord /placebid command also checks rules acceptance
- New DB tables: elite_requests, staff_alerts, strike_logs
- 2026-02-22: Added Live Bidding Countdown Timer system
  - 10-minute countdown starts when first bid is placed on an order
  - Live countdown clock on both staff and grinder dashboards
  - Discord notifications at: order open, first bid, 5 min, 2 min, 1 min
  - Auto-closes bidding when timer expires (status: "Bidding Closed")
  - Inline countdown badges on order cards in grinder dashboard
  - Server-side scheduler checks every 15 seconds for timer milestones
- 2026-02-22: Added Staff Override Assign feature
  - Staff can manually assign any grinder to an Open or Bidding Closed order
  - Syncs everything: order status → Assigned, creates assignment, closes bidding timer
  - Auto-accepts grinder's bid if they had one, denies all other pending bids
  - Updates grinder stats (activeOrders, totalOrders, lastAssigned)
  - Creates audit log with staff_override_assign action
  - Shows existing bids on selected order, auto-fills bid amount when selecting a grinder with existing bid
  - Live margin calculation preview before assigning
- 2026-02-22: Updated order limits and terminology
  - Grinder role default order limit: 3 (was 5)
  - Elite Grinder role default order limit: 5 (was 3)
  - Renamed "capacity" → "order limit" across all dashboards and Discord bot
  - Staff can override individual grinder order limits from dashboard
- 2026-02-22: Added Staff Dashboard Search feature
  - Global search bar filters orders, grinders, and bids inline
  - Search by order number, gamertag, platform, grinder name, Discord username, bid amount, status
  - Up to 10 results shown per category with clear button
- 2026-02-22: Added Staff Payout Management section
  - Outstanding/Paid Out/Total Requests summary cards
  - Active payouts list with Approve/Deny/Mark Paid actions
  - Shows payout platform and details for each request
  - Recently paid payouts list with timestamps
- 2026-02-22: Added Manual Order Creation system
  - Staff can create orders directly from dashboard with service, price, platform, gamertag, due date, complexity
  - Toggle: "Send to Grinders" (visible for bidding) vs "Manual Assign Only" (staff assigns privately)
  - Manual orders flagged with `isManual=true`, private orders have `visibleToGrinders=false`
  - Grinders can place bids on manual orders from their dashboard (opens bid dialog instead of Discord)
  - Dashboard-placed bids go through POST /api/grinder/me/bids endpoint
  - Orders display "Dashboard" badge for manual orders, distinction between Discord and dashboard order flows
- 2026-02-22: Enhanced grinder dashboard with availability, theming, and name fixes
  - Grinders can set availability status (available, busy, away, offline) with optional note
  - Staff dashboard shows grinder availability status and notes
  - Auto-fix grinder name from Discord display name when it's "Unknown"
  - Badge shows "Grinder" or "Elite Grinder" role label
  - Regular grinder dashboard uses Discord purple (#5865F2) theme
  - Elite grinder dashboard uses cyan (#00ffff) theme for elevated feel

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui, dark mode professional theme
- **Backend**: Express.js with PostgreSQL (Drizzle ORM)
- **Auth**: Discord OAuth2 with role-based access (Staff vs Grinder)
- **Discord Bot**: discord.js v14, runs alongside the web server sharing the same database
- **MGT Bot Watcher**: Passively monitors MGT Bot (user 1466336342521937930) messages in bid war channel (1467912681670447140) and bid proposals channel (1467929083366084800)

## Auth & Access Control
- Discord OAuth2 login at /api/auth/discord/login
- Bot checks user's guild roles after OAuth2 callback
- Owner role (1466369177043599514) → full dashboard + profile editing + bid override
- Staff role (1466369178729578663) → full dashboard, all API endpoints, can accept/deny bids
- Grinder role (1466369179648004224) → personal profile page only, /api/grinder/me endpoint
- No role → access denied page
- All sensitive endpoints (orders, bids, assignments, analytics, audit logs, config, queue) require staff or owner role
- Owner-only endpoints: PATCH /api/bids/:id/override (bid acceptance override)
- Staff+Owner endpoints: PATCH /api/bids/:id/status (accept/deny bids from dashboard)
- Session stored in PostgreSQL with connect-pg-simple

## Key Files
- `shared/schema.ts` - Database tables: services, grinders, orders, bids, assignments, queueConfig
- `shared/routes.ts` - API contract definitions with Zod schemas
- `shared/models/auth.ts` - Auth tables (users, sessions) with Discord fields
- `server/routes.ts` - Express API routes with role-based middleware + seed data
- `server/storage.ts` - Database storage layer with upsert methods for MGT Bot data
- `server/discord/auth.ts` - Discord OAuth2 flow, session management, role middleware
- `server/discord/bot.ts` - Discord bot with slash commands + MGT Bot message listeners
- `server/discord/mgtWatcher.ts` - MGT Bot embed parsers and message handlers
- `server/index.ts` - Server entry point (starts both web server and Discord bot)
- `client/src/pages/grinder-profile.tsx` - Grinder personal dashboard (no sensitive data)
- `server/discord/biddingTimer.ts` - Bidding countdown scheduler + Discord notifications
- `client/src/components/bidding-countdown.tsx` - Live countdown UI components

## Discord Integration
### MGT Bot Monitoring
- Watches bid war channel (1467912681670447140) for new order embeds from MGT Bot
- Watches bid proposals channel (1467929083366084800) for proposal embeds
- Monitors message updates for Accept/Deny/Counter status changes on proposals
- Auto-creates grinder profiles when new grinders submit bids
- Auto-creates assignments when bids are accepted

### Grinder Bot Slash Commands
- `/queue` - View top priority queue items
- `/dashboard` - View dashboard stats
- `/orders` - View open orders
- `/grinders` - View all grinders
- `/bids` - View pending bids
- `/assignments` - View active assignments
- `/neworder` - Create a new order
- `/placebid` - Place a bid on an order
- `/assign` - Assign a grinder to an order

## Discord IDs
- MGT Bot user: 1466336342521937930
- Bid War channel: 1467912681670447140
- Bid Proposals channel: 1467929083366084800
- Grinders role: 1466369179648004224
- Staff role: 1466369178729578663

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption secret
- `DISCORD_BOT_TOKEN` - Discord bot token
- `DISCORD_CLIENT_ID` - Discord OAuth2 client ID
- `DISCORD_CLIENT_SECRET` - Discord OAuth2 client secret
