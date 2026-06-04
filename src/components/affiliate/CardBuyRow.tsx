"use client";

import Image from "next/image";
import { buildTcgPlayerLink, buildCardTraderLink } from "@/lib/affiliate";
import type { AffiliateConfig } from "@/lib/affiliate";

type CardBuyRowProps = {
  cardName: string;
  /** Scryfall set name — enables a card-specific CardTrader link when present. */
  setName?: string | null;
  affiliateConfig: AffiliateConfig;
};

/**
 * Buy-this-card row — two buttons with brand SVG logos, one per marketplace.
 * Pattern mirrors FindThatCard's CardCard.tsx button implementation.
 */
export default function CardBuyRow({
  cardName,
  setName,
  affiliateConfig,
}: CardBuyRowProps) {
  const tcgUrl = buildTcgPlayerLink(
    cardName,
    affiliateConfig.tcgPlayerPartnerLink,
  );
  const ctUrl = buildCardTraderLink(
    cardName,
    affiliateConfig.cardTraderShareCode,
    setName,
  );

  return (
    <div className="codex rim-brass w-full rounded-md px-5 py-4">
      <p className="eyebrow mb-3 text-center text-[9px]">Buy this card</p>

      <div className="flex gap-2.5">
        {/* ── CardTrader ── */}
        <a
          href={ctUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          aria-label="Buy on CardTrader"
          className="group flex flex-1 items-center justify-center rounded-sm border border-rule bg-paper-3 px-4 py-3.5 transition-colors hover:border-brass/60 hover:bg-paper-2"
        >
          <Image
            src="/brand/cardtrader.svg"
            alt="CardTrader"
            width={120}
            height={24}
            style={{ width: "auto" }}
            className="h-5 opacity-90 transition-opacity group-hover:opacity-100"
            unoptimized
          />
        </a>

        {/* ── TCGPlayer ── */}
        {tcgUrl ? (
          <a
            href={tcgUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            aria-label="Buy on TCGPlayer"
            className="group flex flex-1 items-center justify-center rounded-sm border border-rule bg-paper-3 px-4 py-3.5 transition-colors hover:border-brass/60 hover:bg-paper-2"
          >
          <Image
            src="/brand/tcgplayer.svg"
            alt="TCGPlayer"
            width={120}
            height={24}
            style={{ width: "auto" }}
            className="h-5 opacity-90 transition-opacity group-hover:opacity-100"
            unoptimized
          />
          </a>
        ) : null}
      </div>
    </div>
  );
}
