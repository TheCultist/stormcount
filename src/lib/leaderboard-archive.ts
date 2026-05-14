/**
 * Shared definition of what counts as a valid, indexable leaderboard archive
 * date. Used by the `/leaderboard/[date]` route, its metadata, and the sitemap
 * so they cannot disagree about which archive URLs are real.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * How far back the archive is exposed for SEO. Older archives still exist in
 * the database but are not surfaced as indexable URLs.
 */
export const ARCHIVE_WINDOW_DAYS = 30;

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function utcOffsetDate(offsetDays: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns the normalised date when the slug is a valid archive entry,
 * otherwise `null`. A slug is valid when it is well-formed, strictly in the
 * past (today is served by `/leaderboard`), and within the archive window.
 */
export function validateArchiveDate(date: string): string | null {
  if (!DATE_RE.test(date)) return null;

  const today = todayUtc();
  if (date >= today) return null;

  const oldest = utcOffsetDate(-ARCHIVE_WINDOW_DAYS);
  if (date < oldest) return null;

  return date;
}

/**
 * The set of archive dates the sitemap should expose. Yesterday back to
 * `ARCHIVE_WINDOW_DAYS` ago, inclusive. Returned in newest-first order.
 */
export function getArchiveDatesForSitemap(): string[] {
  return Array.from({ length: ARCHIVE_WINDOW_DAYS }, (_, i) =>
    utcOffsetDate(-(i + 1)),
  );
}

/**
 * A stable "last modified" timestamp for an archive page. Archive contents are
 * frozen the moment the UTC day rolls over, so we anchor `lastModified` to the
 * end of that UTC day rather than `new Date()`. This keeps sitemap output
 * deterministic across requests and avoids tricking crawlers into re-fetching
 * unchanged historical pages.
 */
export function archiveLastModified(date: string): Date {
  return new Date(`${date}T23:59:59Z`);
}

export function formatArchiveDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
