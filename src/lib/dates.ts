/**
 * UTC calendar-date helpers. Every date in Storm Count (daily seeds, scores,
 * themed days, leaderboard archives) is an ISO `yyyy-mm-dd` string in UTC.
 */

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Today's date in UTC as `yyyy-mm-dd`. */
export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/** The UTC date `offsetDays` from today (negative = past) as `yyyy-mm-dd`. */
export function utcOffsetDate(offsetDays: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** `iso` shifted by `days` (negative = earlier), as `yyyy-mm-dd`. */
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Number of days in a month (1–12), leap-year aware. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * True when `value` is a well-formed AND real calendar date — rejects
 * `2026-02-30`, which matches the shape but makes Postgres throw.
 */
export function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const m = value.match(ISO_DATE_RE);
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}
