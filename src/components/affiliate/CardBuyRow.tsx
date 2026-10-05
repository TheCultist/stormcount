"use client";

import Image from "next/image";
import { buildTcgPlayerLink, buildCardTraderLink } from "@/lib/affiliate";
import type { AffiliateConfig } from "@/lib/affiliate";

type CardBuyRowProps = {
  cardName: string;
  /** Scryfall set name — enables a card-specific CardTrader link when present. */
  setName?: string | null;
  affiliateConfig: Pick<AffiliateConfig, "cardTraderShareCode" | "tcgPlayerPartnerLink">;
  /**
   * "panel"   — codex panel with a "Buy this card" eyebrow (default).
   * "compact" — bare button row for tight spaces (card grids, zoom modal).
   */
  variant?: "panel" | "compact";
};

const VARIANTS = {
  panel: {
    row: "flex gap-2.5",
    link: "group flex flex-1 items-center justify-center rounded-sm border border-rule bg-paper-3 px-4 py-3.5 transition-colors hover:border-brass/60 hover:bg-paper-2",
    logo: { width: 120, height: 24, style: { width: "auto" }, className: "h-5 opacity-90 transition-opacity group-hover:opacity-100" },
    ariaLabel: (_card: string, store: string) => `Buy on ${store}`,
  },
  compact: {
    row: "flex gap-1.5",
    link: "group flex flex-1 items-center justify-center rounded-sm border border-rule/50 bg-paper-3/70 py-2.5 transition-colors hover:border-brass/50 hover:bg-paper-2",
    logo: { width: 96, height: 16, style: undefined, className: "h-3.5 w-auto opacity-75 transition-opacity group-hover:opacity-100" },
    ariaLabel: (card: string, store: string) => `Buy ${card} on ${store}`,
  },
} as const;

/**
 * Buy-this-card row — two buttons with brand SVG logos, one per marketplace.
 * Pattern mirrors FindThatCard's CardCard.tsx button implementation.
 */
export default function CardBuyRow({
  cardName,
  setName,
  affiliateConfig,
  variant = "panel",
}: CardBuyRowProps) {
  const v = VARIANTS[variant];
  const stores = [
    {
      name: "CardTrader",
      logo: "/brand/cardtrader.svg",
      url: buildCardTraderLink(cardName, affiliateConfig.cardTraderShareCode, setName),
    },
    {
      name: "TCGPlayer",
      logo: "/brand/tcgplayer.svg",
      url: buildTcgPlayerLink(cardName, affiliateConfig.tcgPlayerPartnerLink),
    },
  ];

  const row = (
    <div className={v.row}>
      {stores.map(({ name, logo, url }) =>
        url ? (
          <a
            key={name}
            href={url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            aria-label={v.ariaLabel(cardName, name)}
            className={v.link}
          >
            <Image
              src={logo}
              alt={name}
              width={v.logo.width}
              height={v.logo.height}
              style={v.logo.style}
              className={v.logo.className}
              unoptimized
            />
          </a>
        ) : null,
      )}
    </div>
  );

  if (variant === "compact") return row;

  return (
    <div className="codex rim-brass w-full rounded-md px-5 py-4">
      <p className="eyebrow mb-3 text-center text-[9px]">Buy this card</p>
      {row}
    </div>
  );
}
