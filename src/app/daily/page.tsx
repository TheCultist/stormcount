import type { Metadata } from "next";
import Script from "next/script";
import DailyGame from "@/components/game/DailyGame";
import { getAffiliateConfig } from "@/lib/affiliate";
import { BRAND } from "@/lib/constants";
import { buildMetadata, buildVideoGame, buildBreadcrumbList, jsonLd } from "@/lib/seo";

const TITLE = "Daily Challenge";
const DESCRIPTION =
  "Play today's Storm Count daily challenge — a fixed 50-card Magic: The Gathering sequence. Guess higher or lower on mana value and compete on the global leaderboard.";

export const metadata: Metadata = buildMetadata({
  path: "/daily",
  title: TITLE,
  description: DESCRIPTION,
});

const jsonLdBlocks = [
  buildVideoGame({
    path: "/daily",
    name: `${BRAND.name} — ${TITLE}`,
    description:
      "Fixed 50-card daily Magic: The Gathering higher/lower run. Same cards for every player, scored on the global leaderboard.",
    genre: "Trivia",
  }),
  buildBreadcrumbList([
    { name: "Home", path: "/" },
    { name: TITLE, path: "/daily" },
  ]),
];

export default function DailyPage() {
  const affiliateConfig = getAffiliateConfig();
  return (
    <>
      <Script
        id="schema-daily"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(...jsonLdBlocks) }}
      />
      <DailyGame affiliateConfig={affiliateConfig} />
    </>
  );
}
