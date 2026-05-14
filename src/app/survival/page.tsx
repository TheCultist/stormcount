import type { Metadata } from "next";
import Script from "next/script";
import SurvivalGame from "@/components/game/SurvivalGame";
import { getAffiliateConfig } from "@/lib/affiliate";
import { BRAND } from "@/lib/constants";
import { buildMetadata, buildVideoGame, buildBreadcrumbList, jsonLd } from "@/lib/seo";

const TITLE = "Survival Mode";
const DESCRIPTION =
  "Survival is endless Storm Count — an unlimited Magic: The Gathering higher/lower run that ends the moment you guess wrong. How far can you go?";

export const metadata: Metadata = buildMetadata({
  path: "/survival",
  title: TITLE,
  description: DESCRIPTION,
});

const jsonLdBlocks = [
  buildVideoGame({
    path: "/survival",
    name: `${BRAND.name} — ${TITLE}`,
    description:
      "Endless Magic: The Gathering higher/lower mode. One wrong guess ends the run. No timer.",
    genre: "Trivia",
  }),
  buildBreadcrumbList([
    { name: "Home", path: "/" },
    { name: TITLE, path: "/survival" },
  ]),
];

export default function SurvivalPage() {
  const affiliateConfig = getAffiliateConfig();
  return (
    <>
      <Script
        id="schema-survival"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(...jsonLdBlocks) }}
      />
      <SurvivalGame affiliateConfig={affiliateConfig} />
    </>
  );
}
