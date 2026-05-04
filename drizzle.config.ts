import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js uses .env.local; dotenv/config only loads .env by default.
dotenv.config({ path: ".env.local" });

export default defineConfig({
  out: "./drizzle",
  schema: "./src/lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    // Use the unpooled URL for migrations — PgBouncer doesn't support DDL.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!,
  },
});
