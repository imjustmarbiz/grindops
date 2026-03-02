import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import * as authSchema from "@shared/models/auth";

const { Pool } = pg;

let pool: pg.Pool | undefined;
let db: ReturnType<typeof drizzle> | undefined;

if (!process.env.DATABASE_URL) {
  console.log("⚠️ No DATABASE_URL found. Running without database (local dev mode).");
} else {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema: { ...schema, ...authSchema } });
}

export { pool, db };