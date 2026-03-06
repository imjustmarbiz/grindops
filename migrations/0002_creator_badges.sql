-- Creates the creator_badges table for the Creator badge system.
-- Run this if you see: relation "creator_badges" does not exist
-- Alternatively, run: npm run db:push

CREATE TABLE IF NOT EXISTS "creator_badges" (
  "id" varchar PRIMARY KEY NOT NULL,
  "creator_id" varchar NOT NULL REFERENCES "creators"("id"),
  "badge_id" varchar NOT NULL,
  "awarded_by" varchar,
  "awarded_by_name" text,
  "note" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
