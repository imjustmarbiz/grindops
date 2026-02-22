# Grinder Queue Dashboard

## Overview
A fullstack web dashboard + Discord bot for managing a gaming services queue system. Staff can manage grinders (workers), orders, bids, and assignments through both a web interface and Discord slash commands.

## Recent Changes
- 2026-02-22: Initial build with Replit Auth, database schema, API routes, and Discord bot integration
- Discord bot connects and registers global slash commands

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui, dark mode professional theme
- **Backend**: Express.js with PostgreSQL (Drizzle ORM)
- **Auth**: Replit Auth (OpenID Connect)
- **Discord Bot**: discord.js v14, runs alongside the web server sharing the same database

## Key Files
- `shared/schema.ts` - Database tables: services, grinders, orders, bids, assignments, queueConfig
- `shared/routes.ts` - API contract definitions with Zod schemas
- `shared/models/auth.ts` - Auth tables (users, sessions)
- `server/routes.ts` - Express API routes + seed data
- `server/storage.ts` - Database storage layer (DatabaseStorage)
- `server/discord/bot.ts` - Discord bot with slash commands
- `server/index.ts` - Server entry point (starts both web server and Discord bot)

## Discord Bot Commands
- `/queue` - View top priority queue items
- `/dashboard` - View dashboard stats
- `/orders` - View open orders
- `/grinders` - View all grinders
- `/bids` - View pending bids
- `/assignments` - View active assignments
- `/neworder` - Create a new order
- `/placebid` - Place a bid on an order
- `/assign` - Assign a grinder to an order

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption secret
- `DISCORD_BOT_TOKEN` - Discord bot token
