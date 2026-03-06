-- Creates the creator_payout_detail_requests table used for "Request Change (Staff Approval)" on the Creator Payouts page.
-- Run this if you see: relation "creator_payout_detail_requests" does not exist
-- Alternatively, run: npm run db:push

CREATE TABLE IF NOT EXISTS "creator_payout_detail_requests" (
  "id" varchar PRIMARY KEY NOT NULL,
  "creator_id" varchar NOT NULL REFERENCES "creators"("id"),
  "requested_method" text NOT NULL,
  "requested_detail" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "requested_by" varchar NOT NULL,
  "requested_by_name" text NOT NULL,
  "reviewed_by" varchar,
  "reviewed_by_name" text,
  "reviewed_at" timestamp,
  "rejection_reason" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
