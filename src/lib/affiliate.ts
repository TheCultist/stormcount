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

/**
 * Build a CardTrader affiliate link.
 * Without a set name we link to the Magic hub with the share code — the
 * share code tracks the referral regardless of landing page.
 */
export function buildCardTraderLink(shareCode: string): string {
  return `https://www.cardtrader.com/en/magic?share_code=${encodeURIComponent(shareCode)}`;
}
