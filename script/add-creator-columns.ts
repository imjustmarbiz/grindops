/**
 * One-off migration: add creator_code to orders and creator_commission_percent to queue_config.
 * Run with: npx dotenv -e .env -- tsx script/add-creator-columns.ts
 * Or ensure .env is loaded and: tsx script/add-creator-columns.ts
 */
import "dotenv/config";
import pg from "pg";

const connectionString =
  process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL or DATABASE_URL_DEV not set");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });

const statements = [
  `ALTER TABLE queue_config ADD COLUMN IF NOT EXISTS creator_commission_percent NUMERIC NOT NULL DEFAULT '10';`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS creator_code VARCHAR;`,
  `ALTER TABLE creators ADD COLUMN IF NOT EXISTS payout_method TEXT;`,
  `ALTER TABLE creators ADD COLUMN IF NOT EXISTS payout_detail TEXT;`,
  `ALTER TABLE queue_config ADD COLUMN IF NOT EXISTS creator_payout_methods JSONB DEFAULT '["paypal"]';`,
  `UPDATE queue_config SET creator_payout_methods = '["paypal"]' WHERE creator_payout_methods IS NULL;`,
];

async function main() {
  const client = await pool.connect();
  try {
    for (const sql of statements) {
      await client.query(sql);
      console.log("OK:", sql.split("ADD COLUMN")[1]?.split(" ")[1] || sql.slice(0, 50));
    }
    console.log("Creator columns added successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
