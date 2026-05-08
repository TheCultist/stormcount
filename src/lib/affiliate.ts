/**
 * Affiliate partner URL helpers for Storm Count.
 *
 * AffiliateConfig is populated server-side (server components / page files)
 * from environment variables, then passed down as props to client components.
 * This module contains no process.env reads — that stays in page-level code.
 */

export type AffiliateConfig = {
  /** Full CavernHold impact.com tracking URL — CAVERNHOLD_AFFILIATE_LINK */
  cavernholdUrl: string | null;
  /** TCGPlayer partner base URL — TCG_PLAYER_PARTNER_LINK */
  tcgPlayerPartnerLink: string | null;
  /** CardTrader share code — NEXT_PUBLIC_CARDTRADER_SHARE_CODE */
  cardTraderShareCode: string;
};

/**
 * Read affiliate config from server-side environment variables.
 * Call only in server components or page files — never in client components.
 */
export function getAffiliateConfig(): AffiliateConfig {
  return {
    cavernholdUrl: process.env.CAVERNHOLD_AFFILIATE_LINK ?? null,
    tcgPlayerPartnerLink: process.env.TCG_PLAYER_PARTNER_LINK ?? null,
    cardTraderShareCode:
      process.env.NEXT_PUBLIC_CARDTRADER_SHARE_CODE ?? "thecultist",
  };
}

// ── TCGPlayer ──────────────────────────────────────────────────────────────

/**
 * Build a TCGPlayer affiliate link for the given card name.
 * Constructs a product search URL and wraps it in the partner tracking link.
 * Returns null if no partner link is configured.
 */
export function buildTcgPlayerLink(
  cardName: string,
  partnerLink: string | null,
): string | null {
  if (!partnerLink) return null;
  const dest = `https://www.tcgplayer.com/search/magic/all?q=${encodeURIComponent(cardName)}&view=grid`;
  return `${partnerLink}?u=${encodeURIComponent(dest)}`;
}

// ── CardTrader ─────────────────────────────────────────────────────────────

/**
 * Formats a string for CardTrader URL slugs: lowercase, hyphens, strips
 * leading articles (A / An / The) and special characters.
 * Ported from findthatcard/lib/cardtrader/links.ts.
 */
export function formatForUrl(text: string): string {
  let cleaned = text.trim();
  const articleMatch = cleaned.match(/^(a|an|the)\s+(.+)$/i);
  if (articleMatch) cleaned = articleMatch[2];

  return cleaned
    .toLowerCase()
    .replace(/'/g, "-")
    .replace(/[":,]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Build a CardTrader affiliate link.
 *
 * When setName is provided, constructs a card-specific URL
 * (`/en/cards/[card-name]-[set-name]`).  Without it — which is the common
 * case in Storm Count since MtgCard doesn't carry set metadata — falls back
 * to the Magic hub page, which still tracks the referral via share_code.
 */
export function buildCardTraderLink(
  cardName: string,
  shareCode: string,
  setName?: string | null,
): string {
  if (setName && cardName) {
    const formattedCard = formatForUrl(cardName);
    let formattedSet = formatForUrl(setName);
    if (formattedSet.endsWith("-commander")) {
      formattedSet = `commander-${formattedSet.replace(/-commander$/, "")}`;
    }
    return `https://www.cardtrader.com/en/cards/${formattedCard}-${formattedSet}?share_code=${encodeURIComponent(shareCode)}`;
  }
  return `https://www.cardtrader.com/en/magic?share_code=${encodeURIComponent(shareCode)}`;
}
