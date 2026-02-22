# Grinder Queue Dashboard

## Overview
A fullstack web dashboard + Discord bot for managing a gaming services queue system. Staff can manage grinders (workers), orders, bids, and assignments through both a web interface and Discord slash commands. The Grinder Bot passively monitors an existing MGT Bot in Discord to automatically build the database from real order and proposal data.

## Recent Changes
- 2026-02-22: Initial build with Replit Auth, database schema, API routes, and Discord bot integration
- 2026-02-22: Added MGT Bot watcher - monitors bid war channel and bid proposals channel to auto-import orders, grinders, and bids from MGT Bot embeds
- Schema updated with Discord-specific fields (mgtOrderNumber, discordMessageId, platform, gamertag, discordUserId, mgtProposalId, timeline, canStart, qualityScore)
- Removed dummy seed data; database now populated from real MGT Bot activity

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui, dark mode professional theme
- **Backend**: Express.js with PostgreSQL (Drizzle ORM)
- **Auth**: Replit Auth (OpenID Connect)
- **Discord Bot**: discord.js v14, runs alongside the web server sharing the same database
- **MGT Bot Watcher**: Passively monitors MGT Bot (user 1466336342521937930) messages in bid war channel (1467912681670447140) and bid proposals channel (1467929083366084800)

## Key Files
- `shared/schema.ts` - Database tables: services, grinders, orders, bids, assignments, queueConfig
- `shared/routes.ts` - API contract definitions with Zod schemas
- `shared/models/auth.ts` - Auth tables (users, sessions)
- `server/routes.ts` - Express API routes + seed data (services only)
- `server/storage.ts` - Database storage layer with upsert methods for MGT Bot data
- `server/discord/bot.ts` - Discord bot with slash commands + MGT Bot message listeners
- `server/discord/mgtWatcher.ts` - MGT Bot embed parsers and message handlers
- `server/index.ts` - Server entry point (starts both web server and Discord bot)

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
