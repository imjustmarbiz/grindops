import pg from "pg";
import "dotenv/config";

const connectionString =
  process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL or DATABASE_URL_DEV not set");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
try {
  await pool.query(
    "ALTER TABLE queue_config ADD COLUMN IF NOT EXISTS bid_war_notifications_enabled boolean NOT NULL DEFAULT true"
  );
  console.log("Added bid_war_notifications_enabled column to queue_config");
} catch (err: any) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
