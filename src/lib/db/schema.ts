import { pgTable, text, integer, timestamp, date, unique, json } from "drizzle-orm/pg-core";
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

export type User = typeof users.$inferSelect;
export type DailySeed = typeof dailySeeds.$inferSelect;
export type DailyScore = typeof dailyScores.$inferSelect;
export type SurvivalBest = typeof survivalBests.$inferSelect;
