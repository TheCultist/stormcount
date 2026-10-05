import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cards.scryfall.io" },
      { protocol: "https", hostname: "img.scryfall.com" },
      { protocol: "https", hostname: "svgs.scryfall.io" },
    ],
    // Card art is served straight from Scryfall's CDN — running tens of
    // thousands of distinct card images through Vercel's optimizer would burn
    // the quota. Static assets in /public are pre-sized instead (the nav uses
    // logo-nav.png, not the 512px logo.png).
    unoptimized: true,
  },
};

export default nextConfig;
