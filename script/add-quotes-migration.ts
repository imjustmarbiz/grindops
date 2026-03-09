/**
 * Migration: create quotes table and add quote_id to orders.
 * Run: npx dotenv -e .env -- tsx script/add-quotes-migration.ts
 */
import "dotenv/config";
import pg from "pg";

const connectionString = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL or DATABASE_URL_DEV not set");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });

const statements = [
  `CREATE TABLE IF NOT EXISTS quotes (
    id VARCHAR PRIMARY KEY,
    service_type VARCHAR NOT NULL DEFAULT 'rep_grinding',
    customer_identifier TEXT,
    inputs JSONB NOT NULL,
    results JSONB NOT NULL,
    discord_message TEXT,
    ai_suggestion TEXT,
    created_by_id VARCHAR NOT NULL,
    created_by_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  );`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS quote_id VARCHAR;`,
];

async function main() {
  const client = await pool.connect();
  try {
    for (const sql of statements) {
      await client.query(sql);
      console.log("OK:", sql.slice(0, 60) + "...");
    }
    console.log("Quotes migration completed.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
