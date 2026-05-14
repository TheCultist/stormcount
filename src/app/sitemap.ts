import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/constants";
import {
  archiveLastModified,
  getArchiveDatesForSitemap,
} from "@/lib/leaderboard-archive";

const base = `https://${BRAND.domain}`;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const leaderboardArchiveUrls: MetadataRoute.Sitemap = getArchiveDatesForSitemap().map(
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
