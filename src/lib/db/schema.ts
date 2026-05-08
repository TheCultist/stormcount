import {
  pgTable,
  text,
  integer,
  timestamp,
  date,
  unique,
  check,
  boolean,
  json,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { MtgCard } from "@/lib/types";

/**
 * Users — minimal profile synced from Clerk on first score submission.
 * We use Clerk's userId as the primary key to avoid a join on every auth check.
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk userId (e.g. "user_2abc...")
  username: text("username").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Daily seeds — one row per calendar day (UTC).
 * Generated lazily on the first request of the day and reused for all players.
 *
 * Storing full MtgCard objects in JSONB avoids a second Scryfall round-trip
 * on every page load. The array is ordered — index 0 is the opening anchor.
 */
export const dailySeeds = pgTable("daily_seeds", {
  id: text("id").primaryKey(), // ISO date string used directly as PK (e.g. "2026-05-04")
  date: date("date").notNull().unique(),
  cards: json("cards").$type<MtgCard[]>().notNull(),
  themed: text("themed"), // optional label e.g. "Dragons Day"
  // Long-form themed-day blurb shown on the home + daily pages on themed days.
  // Null for regular (non-themed) seeds.
  themedDescription: text("themed_description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Daily scores — one row per (user, date) pair.
 * A unique constraint enforces the one-attempt-per-day rule at the DB layer.
 */
export const dailyScores = pgTable(
  "daily_scores",
  {
    id: text("id").primaryKey(), // `${userId}-${date}` — deterministic, no UUID needed
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    score: integer("score").notNull(), // correct guesses out of 50
    timeMs: integer("time_ms").notNull(), // elapsed milliseconds
    completedAt: timestamp("completed_at").defaultNow().notNull(),
  },
  (t) => [unique("daily_scores_user_date_unique").on(t.userId, t.date)],
);

/**
 * Survival bests — one row per user, updated whenever the user beats their record.
 * We store only the best streak; there is no per-run history for survival.
 */
export const survivalBests = pgTable("survival_bests", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  bestStreak: integer("best_streak").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Card pool — flat list of every card eligible for Storm Count, derived from
 * Scryfall's bulk `oracle_cards` dataset and refreshed on demand by an admin.
 *
 * Used by Survival mode (`ORDER BY random()` per request) instead of hitting
 * the live Scryfall API on every page load. Daily mode reads bulk data
 * directly via the `bulkClient`, so it does not depend on this table.
 */
export const cardPool = pgTable("card_pool", {
  id: text("id").primaryKey(), // Scryfall card UUID
  card: json("card").$type<MtgCard>().notNull(),
  refreshedAt: timestamp("refreshed_at").defaultNow().notNull(),
});

/**
 * Themed days — admin-defined overrides for the daily card pool.
 *
 * On a themed day the daily seed (and optionally Survival cards) come from a
 * custom Scryfall query instead of the regular pool. `year` is either a
 * 4-digit year string for a one-off event or `*` for a recurring yearly theme
 * (e.g. Star Wars Day, Mar10 Day). The unique constraint over (day, month,
 * year) prevents two competing themes from being scheduled on the same date;
 * runtime resolution prefers an explicit-year row over the wildcard if both
 * match.
 */
export const themedDays = pgTable(
  "themed_days",
  {
    id: text("id").primaryKey(),
    themeName: text("theme_name").notNull(),
    themeDescription: text("theme_description").notNull(),
    scryfallQuery: text("scryfall_query").notNull(),
    // true  = only affects Daily mode
    // false = affects Daily AND Survival on that day
    isDaily: boolean("is_daily").notNull().default(true),
    day: integer("day").notNull(), // 1–31
    month: integer("month").notNull(), // 1–12
    year: text("year").notNull(), // "2026" or "*"
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    unique("themed_days_day_month_year").on(t.day, t.month, t.year),
    check("themed_days_year_format", sql`${t.year} = '*' OR ${t.year} ~ '^[0-9]{4}$'`),
    check("themed_days_day_range", sql`${t.day} >= 1 AND ${t.day} <= 31`),
    check("themed_days_month_range", sql`${t.month} >= 1 AND ${t.month} <= 12`),
  ],
);

export type User = typeof users.$inferSelect;
export type DailySeed = typeof dailySeeds.$inferSelect;
export type DailyScore = typeof dailyScores.$inferSelect;
export type SurvivalBest = typeof survivalBests.$inferSelect;
export type CardPoolRow = typeof cardPool.$inferSelect;
export type ThemedDay = typeof themedDays.$inferSelect;
