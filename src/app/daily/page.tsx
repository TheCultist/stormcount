import type { Metadata } from "next";
import DailyGame from "@/components/game/DailyGame";
import { getAffiliateConfig } from "@/lib/affiliate";
import { BRAND } from "@/lib/constants";
import { buildMetadata, buildVideoGame, buildBreadcrumbList, jsonLd } from "@/lib/seo";

const TITLE = "Daily MTG Challenge — Guess the Mana Value";
const DESCRIPTION =
  "Today's Storm Count Daily: the same 50 Magic: The Gathering cards for everyone. Guess higher or lower on mana value, share your result grid, and climb the global leaderboard.";

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
    { name: "Daily Challenge", path: "/daily" },
  ]),
];

export default function DailyPage() {
  const affiliateConfig = getAffiliateConfig();
  return (
    <>
      <script
        id="schema-daily"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(...jsonLdBlocks) }}
      />
      <DailyGame affiliateConfig={affiliateConfig} />
    </>
  );
}
