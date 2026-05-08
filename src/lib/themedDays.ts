/**
 * Themed-day resolver — finds the themed_days row (if any) that applies to
 * a given calendar date.
 *
 * Resolution rules:
 *   1. Match (day, month, year) exactly — explicit-year overrides win.
 *   2. Otherwise match (day, month, year='*') — recurring yearly themes.
 *   3. Otherwise return null — regular pool applies.
 *
 * Centralised here so daily route, survival route, and admin seed route all
 * resolve themes identically.
 */
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { themedDays, type ThemedDay } from "@/lib/db/schema";

/** Parse an ISO `yyyy-mm-dd` date string into UTC components. */
export function parseIsoDate(iso: string): {
  day: number;
  month: number;
  year: string;
} {
  // We deliberately parse the components from the string instead of using
  // `new Date(iso)` to avoid timezone drift — `iso` is always UTC by contract.
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error(`Invalid ISO date: ${iso}`);
  return {
    year: m[1],
    month: parseInt(m[2], 10),
    day: parseInt(m[3], 10),
  };
}

/**
 * Returns the themed_days row that applies to `isoDate` (UTC `yyyy-mm-dd`),
 * or `null` if the date has no theme. Explicit-year rows override wildcard
 * (`year='*'`) rows for the same day/month.
 */
export async function findThemedDayForDate(
  isoDate: string,
): Promise<ThemedDay | null> {
  const { day, month, year } = parseIsoDate(isoDate);

  // One round-trip: fetch both candidates (exact + wildcard), pick exact if
  // present.
  const candidates = await db
    .select()
    .from(themedDays)
    .where(
      and(
        eq(themedDays.day, day),
        eq(themedDays.month, month),
        inArray(themedDays.year, [year, "*"]),
      ),
    );

  if (candidates.length === 0) return null;
  return candidates.find((c) => c.year === year) ?? candidates[0];
}
