import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import * as authSchema from "@shared/models/auth";

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === "production";

const connectionString = isProduction
  ? process.env.DATABASE_URL_PROD
  : process.env.DATABASE_URL_DEV;

if (!connectionString) {
  throw new Error(
    `Database URL not set for ${isProduction ? "production" : "development"}`
  );
}

const pool = new Pool({
  connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

const db = drizzle(pool, {
  schema: { ...schema, ...authSchema },
});

export { pool, db };