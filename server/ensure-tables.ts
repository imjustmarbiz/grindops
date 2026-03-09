import { pool } from "./db";

/** Ensures creator_payout_detail_requests exists (common for older deployments). */
export async function ensureCreatorPayoutDetailRequestsTable(): Promise<void> {
  await pool.query(`
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
    )
  `);
}

/** Adds optional commission_percent to creators if missing (per-creator order commission override). */
export async function ensureCreatorCommissionPercentColumn(): Promise<void> {
  await pool.query(`
    ALTER TABLE creators ADD COLUMN IF NOT EXISTS commission_percent numeric(5,2);
  `);
}

/** Adds quote_discount_percent to creators if missing (migration 0003). */
export async function ensureCreatorQuoteDiscountPercentColumn(): Promise<void> {
  await pool.query(`
    ALTER TABLE creators ADD COLUMN IF NOT EXISTS quote_discount_percent numeric(5,2);
  `);
}

/** Adds quote generator split columns to queue_config if missing (migration 0004). */
export async function ensureQuoteGeneratorSplitColumns(): Promise<void> {
  await pool.query(`
    ALTER TABLE queue_config ADD COLUMN IF NOT EXISTS quote_generator_company_pct numeric NOT NULL DEFAULT 70;
    ALTER TABLE queue_config ADD COLUMN IF NOT EXISTS quote_generator_grinder_pct numeric NOT NULL DEFAULT 30;
  `);
}

/** Adds rep_quote_settings to queue_config if missing (migration 0006). */
export async function ensureRepQuoteSettingsColumn(): Promise<void> {
  await pool.query(`
    ALTER TABLE queue_config ADD COLUMN IF NOT EXISTS rep_quote_settings jsonb;
  `);
}

/** Adds badge_quote_settings to queue_config if missing. */
export async function ensureBadgeQuoteSettingsColumn(): Promise<void> {
  await pool.query(`
    ALTER TABLE queue_config ADD COLUMN IF NOT EXISTS badge_quote_settings jsonb;
  `);
}

/** Adds my_player_type_settings to queue_config if missing (Badge Grinding only). */
export async function ensureMyPlayerTypeSettingsColumn(): Promise<void> {
  await pool.query(`
    ALTER TABLE queue_config ADD COLUMN IF NOT EXISTS my_player_type_settings jsonb;
  `);
}

/** Adds last-edited columns to quotes if missing (migration 0005). */
export async function ensureQuotesLastEditedColumns(): Promise<void> {
  await pool.query(`
    ALTER TABLE quotes ADD COLUMN IF NOT EXISTS updated_by_id varchar;
    ALTER TABLE quotes ADD COLUMN IF NOT EXISTS updated_by_name text;
    ALTER TABLE quotes ADD COLUMN IF NOT EXISTS updated_at timestamp;
  `);
}
