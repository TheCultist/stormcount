import DailyGame from "@/components/game/DailyGame";
import { getAffiliateConfig } from "@/lib/affiliate";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Challenge",
  description:
    "Play today's Storm Count daily challenge — a fixed 50-card MTG sequence. Guess higher or lower on mana value and compete on the global leaderboard.",
  openGraph: {
    title: "Daily Challenge | Storm Count",
    description:
      "A fixed 50-card MTG sequence. Guess higher or lower, post your score on the global leaderboard.",
    url: "https://stormcount.gg/daily",
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Challenge | Storm Count",
    description:
      "A fixed 50-card MTG sequence. Guess higher or lower, post your score on the global leaderboard.",
  },
};

export default function DailyPage() {
  const affiliateConfig = getAffiliateConfig();
  return <DailyGame affiliateConfig={affiliateConfig} />;
}
