/**
 * Run with: npx dotenv -e .env -- tsx script/run-creator-badges-migration.ts
 * Or: tsx script/run-creator-badges-migration.ts (if .env is loaded)
 */
import "dotenv/config";
import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbUrl = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("DATABASE_URL or DATABASE_URL_DEV not set in .env");
  process.exit(1);
}

const sql = readFileSync(
  join(__dirname, "..", "migrations", "0002_creator_badges.sql"),
  "utf-8"
);
// Run only the CREATE TABLE statement (skip comments and empty lines)
const statements = sql
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.startsWith("CREATE TABLE"));

async function main() {
  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();
    for (const stmt of statements) {
      await client.query(stmt + ";");
      console.log("[migration] Executed:", stmt.slice(0, 50) + "...");
    }
    console.log("[migration] creator_badges table created successfully.");
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e.code === "42P07") {
      console.log("[migration] creator_badges table already exists.");
    } else {
      console.error("[migration] Error:", e.message);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

main();
