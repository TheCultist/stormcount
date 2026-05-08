import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { dailySeeds, themedDays, type ThemedDay } from "@/lib/db/schema";
import ScheduleActions from "./ScheduleActions";

// Always re-query — admins expect "Generate now" to flip the row's status.
export const dynamic = "force-dynamic";

const HORIZON_DAYS = 365;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Occurrence {
  row: ThemedDay;
  date: string; // "yyyy-mm-dd"
}

/**
 * Resolve which themed-day row will fire on each upcoming UTC date.
 *
 * Mirrors the runtime priority used by `findThemedDayForDate`: an explicit
 * `(day, month, year)` row beats a wildcard `(day, month, "*")` row for
 * that specific year. We walk forward day-by-day for HORIZON_DAYS and stop
 * recording further occurrences for a row once we've seen its first one.
 */
function computeUpcomingOccurrences(
  rows: ThemedDay[],
  todayUtc: Date,
): Occurrence[] {
  type Bucket = {
    explicit: Map<string, ThemedDay>;
    wildcard?: ThemedDay;
  };

  const byDayMonth = new Map<string, Bucket>();
  for (const r of rows) {
    const key = `${r.day}-${r.month}`;
    let bucket = byDayMonth.get(key);
    if (!bucket) {
      bucket = { explicit: new Map() };
      byDayMonth.set(key, bucket);
    }
    if (r.year === "*") bucket.wildcard = r;
    else bucket.explicit.set(r.year, r);
  }

  const seen = new Set<string>();
  const occurrences: Occurrence[] = [];

  // Clone to avoid mutating the caller's Date.
  const cursor = new Date(todayUtc);
  const horizon = new Date(todayUtc);
  horizon.setUTCDate(horizon.getUTCDate() + HORIZON_DAYS);

  while (cursor.getTime() <= horizon.getTime()) {
    const day = cursor.getUTCDate();
    const month = cursor.getUTCMonth() + 1;
    const year = cursor.getUTCFullYear().toString();

    const bucket = byDayMonth.get(`${day}-${month}`);
    if (bucket) {
      const winner = bucket.explicit.get(year) ?? bucket.wildcard;
      if (winner && !seen.has(winner.id)) {
        seen.add(winner.id);
        occurrences.push({
          row: winner,
          date: cursor.toISOString().slice(0, 10),
        });
      }
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  occurrences.sort((a, b) => a.date.localeCompare(b.date));
  return occurrences;
}

function formatPretty(iso: string): string {
  // iso is "yyyy-mm-dd" — parse without timezone slippage.
  const [y, m, d] = iso.split("-").map(Number);
  const monthName = MONTH_NAMES[(m ?? 1) - 1];
  return `${monthName} ${d}, ${y}`;
}

/**
 * Admin → Schedule
 *
 * Lists every themed day's next upcoming occurrence within the next year and
 * shows whether a `daily_seeds` row already exists for that date. From here,
 * admins can pre-generate a seed (Generate now), wipe a mistakenly-generated
 * one (Remove seed), or force-regenerate to pick fresh cards (Regenerate).
 *
 * Non-themed daily seeds are not listed — they're created on demand by the
 * regular `/api/cards/daily` route the first time a player visits that day.
 */
export default async function AdminSchedulePage() {
  // Today at 00:00 UTC — same anchor used by /api/cards/daily.
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const rows = await db.select().from(themedDays);
  const occurrences = computeUpcomingOccurrences(rows, today);

  const seededDates = new Set<string>();
  if (occurrences.length > 0) {
    const seedRows = await db
      .select({ date: dailySeeds.date })
      .from(dailySeeds)
      .where(inArray(dailySeeds.date, occurrences.map((o) => o.date)));
    for (const r of seedRows) seededDates.add(r.date);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="storm-display text-2xl font-bold tracking-[-0.01em]">
          Upcoming themed days
        </h2>
        <p className="text-sm text-foreground/65">
          The next occurrence of every configured theme within{" "}
          {HORIZON_DAYS} days. Pre-generate seeds here so the live API call on
          the actual day completes instantly.
        </p>
      </div>

      {occurrences.length === 0 ? (
        <p className="rounded-md border border-foreground/10 bg-background-soft/40 p-5 text-sm text-foreground/55">
          No themed days configured. Add one on the{" "}
          <a
            href="/admin/themed-days"
            className="text-brass-bright underline-offset-4 hover:underline"
          >
            Themed Days
          </a>{" "}
          page.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-foreground/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-foreground/5">
              <tr>
                <th className="storm-mono px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70">
                  Theme
                </th>
                <th className="storm-mono px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70">
                  Date
                </th>
                <th className="storm-mono px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70">
                  Status
                </th>
                <th className="storm-mono px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {occurrences.map(({ row, date }) => {
                const hasSeed = seededDates.has(date);
                return (
                  <tr
                    key={row.id}
                    className="border-t border-foreground/10 align-top"
                  >
                    <td className="px-4 py-4">
                      <div className="font-semibold">{row.themeName}</div>
                      <div className="mt-1 max-w-md text-xs text-foreground/60">
                        {row.themeDescription}
                      </div>
                      <div className="storm-mono mt-2 text-[10px] uppercase tracking-[0.18em] text-foreground/45">
                        {row.isDaily ? "Daily only" : "Daily + Survival"}{" "}
                        · <code>{row.scryfallQuery}</code>
                      </div>
                    </td>
                    <td className="storm-mono px-4 py-4 text-[12px] text-foreground/80">
                      {formatPretty(date)}
                    </td>
                    <td className="px-4 py-4">
                      {hasSeed ? (
                        <span className="storm-mono inline-block rounded border border-correct-bright/40 bg-correct/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-correct-bright">
                          Seed ready
                        </span>
                      ) : (
                        <span className="storm-mono inline-block rounded border border-foreground/20 bg-foreground/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/60">
                          No seed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <ScheduleActions date={date} hasSeed={hasSeed} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
