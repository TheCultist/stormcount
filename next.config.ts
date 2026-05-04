import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cards.scryfall.io" },
      { protocol: "https", hostname: "img.scryfall.com" },
      { protocol: "https", hostname: "svgs.scryfall.io" },
    ],
    unoptimized: true,
    formats: ["image/webp"],
    deviceSizes: [320, 640, 960, 1280],
    imageSizes: [16, 24, 32, 48, 64, 96, 120, 180],
    minimumCacheTTL: 2678400,
  },
};

export default nextConfig;
