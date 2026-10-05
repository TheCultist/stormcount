import type { MetadataRoute } from "next";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { dailySeeds } from "@/lib/db/schema";
import { BRAND } from "@/lib/constants";
import {
  archiveLastModified,
  getArchiveDatesForSitemap,
} from "@/lib/leaderboard-archive";

const base = `https://${BRAND.domain}`;

// Archive URLs are a rolling 30-day window — regenerate daily, or the build-time
// list drifts into 404s and misses recent days.
export const revalidate = 86400;

/**
 * Archive dates that actually have content. A day nobody played (before the
 * seed cron existed) has no seed and no scores — listing it would hand
 * crawlers an empty page. A DB failure degrades to "no archive URLs" rather
 * than failing the sitemap.
 */
async function seededArchiveDates(): Promise<string[]> {
  const candidates = getArchiveDatesForSitemap();
  try {
    const rows = await db
      .select({ date: dailySeeds.date })
      .from(dailySeeds)
      .where(inArray(dailySeeds.date, candidates));
    const seeded = new Set(rows.map((r) => r.date));
    return candidates.filter((d) => seeded.has(d));
  } catch (err) {
    console.error("[sitemap] archive lookup failed:", err);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const leaderboardArchiveUrls: MetadataRoute.Sitemap = (await seededArchiveDates()).map(
    (date) => ({
      url: `${base}/leaderboard/${date}`,
      // Frozen at end of UTC day so crawlers see a stable lastModified and
      // don't re-fetch historical pages every time the sitemap regenerates.
      lastModified: archiveLastModified(date),
      changeFrequency: "yearly",
      priority: 0.4,
    }),
  );

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/daily`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/survival`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/leaderboard`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    ...leaderboardArchiveUrls,
    {
      url: `${base}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${base}/bug-report`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
