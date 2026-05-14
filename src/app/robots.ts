import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  const base = `https://${BRAND.domain}`;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Personal areas (/profile), auth flows (/sign-in, /sign-up), API
        // endpoints, and the admin console should never be crawled.
        disallow: [
          "/api/",
          "/admin/",
          "/profile",
          "/profile/",
          "/sign-in",
          "/sign-in/",
          "/sign-up",
          "/sign-up/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
