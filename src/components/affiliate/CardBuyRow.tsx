"use client";

import { buildTcgPlayerLink, buildCardTraderLink } from "@/lib/affiliate";
import type { AffiliateConfig } from "@/lib/affiliate";

type Props = {
  cardName: string;
  affiliateConfig: AffiliateConfig;
};

/**
 * A pair of "Buy" buttons for TCGPlayer and CardTrader, shown after a run ends.
 * Matches the site's dark navy / brass / moonsilver aesthetic.
 */
export default function CardBuyRow({ cardName, affiliateConfig }: Props) {
  const tcgUrl = buildTcgPlayerLink(cardName, affiliateConfig.tcgPlayerPartnerLink);
  const ctUrl = buildCardTraderLink(affiliateConfig.cardTraderShareCode);

  if (!tcgUrl && !ctUrl) return null;

  return (
    <div className="w-full max-w-md">
      {/* Eyebrow label */}
      <p className="eyebrow mb-3 text-center text-[9px] text-muted/70">
        Buy this card
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        {/* TCGPlayer */}
        {tcgUrl ? (
          <a
            href={tcgUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="group relative isolate flex flex-1 items-center justify-between gap-3 overflow-hidden rounded-sm border border-brass/30 bg-paper/60 px-4 py-3 transition-all duration-200 hover:border-brass/60 hover:bg-paper-2"
          >
            {/* hover wash */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 50%, rgba(201,160,90,0.12), transparent 70%)",
              }}
            />
            <span className="flex items-center gap-2.5">
              <TcgPlayerMark />
              <span className="storm-display text-[12px] font-semibold leading-none tracking-[0.04em] text-foreground">
                TCGPlayer
              </span>
            </span>
            <span
              className="storm-mono text-[10px] uppercase tracking-[0.18em] text-brass-bright transition-colors group-hover:text-brass-bright"
            >
              Buy →
            </span>
          </a>
        ) : null}

        {/* CardTrader */}
        {ctUrl ? (
          <a
            href={ctUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="group relative isolate flex flex-1 items-center justify-between gap-3 overflow-hidden rounded-sm border border-moonsilver/25 bg-paper/60 px-4 py-3 transition-all duration-200 hover:border-moonsilver/50 hover:bg-paper-2"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 50%, rgba(182,194,212,0.10), transparent 70%)",
              }}
            />
            <span className="flex items-center gap-2.5">
              <CardTraderMark />
              <span className="storm-display text-[12px] font-semibold leading-none tracking-[0.04em] text-foreground">
                CardTrader
              </span>
            </span>
            <span className="storm-mono text-[10px] uppercase tracking-[0.18em] text-moonsilver transition-colors group-hover:text-moonsilver-bright">
              Buy →
            </span>
          </a>
        ) : null}
      </div>
    </div>
  );
}

/* ── Brand mark glyphs ─────────────────────────────────────────────────────── */

function TcgPlayerMark() {
  return (
    <span
      className="storm-mono flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-[9px] font-extrabold"
      style={{
        background: "rgba(201,160,90,0.15)",
        color: "var(--brass-bright)",
        border: "1px solid rgba(201,160,90,0.35)",
      }}
    >
      T
    </span>
  );
}

function CardTraderMark() {
  return (
    <span
      className="storm-mono flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-[9px] font-extrabold"
      style={{
        background: "rgba(182,194,212,0.10)",
        color: "var(--moonsilver-bright)",
        border: "1px solid rgba(182,194,212,0.28)",
      }}
    >
      C
    </span>
  );
}
