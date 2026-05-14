import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/constants";

/**
 * PWA web manifest. Lets browsers and search engines treat Storm Count as an
 * installable app and provides high-quality icons for results pages.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.name,
    description: BRAND.shortDescription,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: BRAND.themeColor,
    theme_color: BRAND.themeColor,
    categories: ["games", "entertainment", "trivia"],
    lang: BRAND.htmlLang,
    icons: [
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
