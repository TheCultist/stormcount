import SurvivalGame from "@/components/game/SurvivalGame";
import { getAffiliateConfig } from "@/lib/affiliate";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Survival Mode",
  description:
    "Survival mode: an endless MTG higher/lower run that ends the moment you guess wrong. How far can you go?",
  openGraph: {
    title: "Survival Mode | Storm Count",
    description:
      "Endless MTG higher/lower — one wrong guess ends your run. How far can you go?",
    url: "https://stormcount.gg/survival",
  },
  twitter: {
    card: "summary_large_image",
    title: "Survival Mode | Storm Count",
    description:
      "Endless MTG higher/lower — one wrong guess ends your run. How far can you go?",
  },
};

export default function SurvivalPage() {
  const affiliateConfig = getAffiliateConfig();
  return <SurvivalGame affiliateConfig={affiliateConfig} />;
}
