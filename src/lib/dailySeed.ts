/**
 * Daily seed service — the one place that decides which cards a date gets.
 * Used by the public daily route (lazy), the cron route (pre-generation) and
 * the admin seed route (forced regeneration of future dates).
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dailySeeds, type DailySeed } from "@/lib/db/schema";
import {
  generateDailyCards,
  generateThemedCards,
} from "@/lib/scryfall/seedGenerator";
import { findThemedDayForDate } from "@/lib/themedDays";

type SeedContent = Pick<DailySeed, "cards" | "themed" | "themedDescription">;

/**
 * Build (but don't persist) the seed content for `date`. A themed day whose
 * query fails (typo, too few matches, Scryfall outage) falls back to the
 * regular pool — otherwise the Daily would be down for everyone all day,
 * retrying the broken query on every page load.
 */
async function buildSeed(date: string): Promise<SeedContent> {
  const theme = await findThemedDayForDate(date);
  if (theme) {
    try {
      return {
        cards: await generateThemedCards(theme.scryfallQuery),
        themed: theme.themeName,
        themedDescription: theme.themeDescription,
      };
    } catch (err) {
      console.error(
        `[dailySeed] themed generation failed for ${date} ("${theme.themeName}"), using regular pool:`,
        err,
      );
    }
  }
  return { cards: await generateDailyCards(), themed: null, themedDescription: null };
}

/** In-flight generations, so concurrent first requests on one instance share the work. */
const pending = new Map<string, Promise<DailySeed>>();

/**
 * Return the stored seed for `date`, generating and persisting it first if
 * needed. Concurrent callers across instances may both generate, but
 * `onConflictDoNothing` keeps the first insert and the loser reads it back,
 * so every player sees the same cards.
 */
export async function getOrCreateDailySeed(date: string): Promise<DailySeed> {
  const existing = await db.query.dailySeeds.findFirst({
    where: eq(dailySeeds.date, date),
  });
  if (existing) return existing;

  let promise = pending.get(date);
  if (!promise) {
    promise = (async () => {
      const content = await buildSeed(date);
      const [inserted] = await db
        .insert(dailySeeds)
        .values({ id: date, date, ...content })
        .onConflictDoNothing()
        .returning();
      if (inserted) return inserted;

      const canonical = await db.query.dailySeeds.findFirst({
        where: eq(dailySeeds.date, date),
      });
      if (!canonical) throw new Error(`Seed for ${date} vanished after insert conflict`);
      return canonical;
    })().finally(() => pending.delete(date));
    pending.set(date, promise);
  }
  return promise;
}

/**
 * Generate fresh content for `date` and overwrite any stored seed. Callers
 * must only use this for dates nobody has played yet.
 */
export async function regenerateDailySeed(date: string): Promise<DailySeed> {
  const content = await buildSeed(date);
  const [row] = await db
    .insert(dailySeeds)
    .values({ id: date, date, ...content })
    .onConflictDoUpdate({ target: dailySeeds.id, set: content })
    .returning();
  return row;
}
