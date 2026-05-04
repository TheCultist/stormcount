import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Singleton Drizzle client for Neon's HTTP (serverless) driver.
 * Safe to call at module level — the connection is lazy.
 */
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
