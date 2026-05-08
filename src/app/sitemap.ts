import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/constants";

const base = `https://${BRAND.domain}`;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Generate past 7 days for leaderboard archive URLs
  const pastDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    return d.toISOString().slice(0, 10);
  });

  const leaderboardArchiveUrls: MetadataRoute.Sitemap = pastDates.map((date) => ({
    url: `${base}/leaderboard/${date}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.5,
  }));

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
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.2,
    },
  ];
}
