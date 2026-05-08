/**
 * Scryfall bulk-data client.
 *
 * Replaces ~15 paginated `/cards/search` calls (rate-limited, ordering bias)
 * with a single download of Scryfall's `oracle_cards` bulk file (~165MB JSON,
 * one entry per Oracle ID).
 *
 * Bulk data is updated daily on Scryfall and is the recommended way to
 * sample uniformly from the entire catalog without hitting the search API
 * rate limit. See https://scryfall.com/docs/api/bulk-data
 *
 * Filters applied here mirror DAILY_SCRYFALL_QUERY / SURVIVAL_SCRYFALL_QUERY
 * but are translated from Scryfall search syntax to plain JS predicates,
 * because bulk data is a flat JSON array — there is no server-side query.
 */
import type {
  ScryfallBulkDataManifest,
  ScryfallCard,
} from "./types";
import type { MtgCard } from "@/lib/types";
import { toMtgCard } from "./cardMapper";

const SCRYFALL_BASE_URL = "https://api.scryfall.com";
const SCRYFALL_USER_AGENT =
  process.env.SCRYFALL_USER_AGENT ?? "stormcount/1.0 (+https://stormcount.gg)";

/** Scryfall layouts considered "extra" (tokens, art series, schemes, …). */
const EXTRA_LAYOUTS = new Set([
  "art_series",
  "double_faced_token",
  "emblem",
  "planar",
  "scheme",
  "token",
  "vanguard",
  "reversible_card",
]);

/**
 * set_type values that Scryfall considers "extras" — supplemental products
 * that aren't standalone booster-legal sets (tokens, memorabilia, minigames).
 * Mirrors -is:extras from the search query.
 */
const EXTRA_SET_TYPES = new Set(["token", "memorabilia", "minigame"]);

/** Type-line substrings that match Scryfall's `t:` filter we want to exclude. */
const EXCLUDED_TYPE_KEYWORDS = ["Land", "Dungeon", "Conspiracy", "Token"];

/**
 * Return the CDN URL for the most recent `oracle_cards` bulk file.
 *
 * `oracle_cards` returns one card per Oracle ID, which already satisfies
 * `unique:cards` from our search queries (no second dedup step needed).
 */
export async function fetchBulkManifestUrl(): Promise<string> {
  const res = await fetch(`${SCRYFALL_BASE_URL}/bulk-data`, {
    headers: { "User-Agent": SCRYFALL_USER_AGENT, Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`Scryfall bulk manifest ${res.status}: ${body}`);
  }

  const manifest = (await res.json()) as ScryfallBulkDataManifest;
  const oracle = manifest.data.find((entry) => entry.type === "oracle_cards");
  if (!oracle) {
    throw new Error('Scryfall bulk manifest missing "oracle_cards" entry');
  }
  return oracle.download_uri;
}

/**
 * Apply the same exclusions as DAILY_SCRYFALL_QUERY / SURVIVAL_SCRYFALL_QUERY
 * to a raw bulk-data card.
 *
 * Conditions (mirrors the Scryfall query strings):
 *   game:paper       — must be playable in paper
 *   is:default       — default printing only (no promos, variations, textless)
 *   -is:funny        — no un-sets AND no acorn-stamped cards in normal sets
 *   -is:playtest     — exclude Mystery Booster / development playtest cards
 *   -is:extras       — exclude token/memorabilia/minigame set types
 *   -is:digital      — no digital-only cards (also covered by game:paper)
 *   -is:split        — no split-layout cards
 *   has:mana         — must have a printed mana cost (excludes Jumpstart front cards)
 *   -mana:{X}        — no X-cost spells
 *   -t:land / -t:dungeon / -t:conspiracy / not:token
 */
function passesPoolFilters(card: ScryfallCard): boolean {
  // game:paper — must be playable in paper.
  if (!card.games?.includes("paper")) return false;

  // is:default — exclude promos, variations, textless.
  if (card.promo) return false;
  if (card.variation) return false;
  if (card.textless) return false;

  // -is:digital — no digital-only cards.
  if (card.digital) return false;

  // -is:funny — set_type "funny" covers Unhinged/Unstable/Unfinity/etc.;
  // security_stamp "acorn" covers joke cards printed in otherwise-legal sets.
  if (card.set_type === "funny") return false;
  if (card.security_stamp === "acorn") return false;

  // -is:playtest — exclude playtest cards.
  // Most playtest sets (unk, cmb2, punk) already fall out via set_type "funny"
  // above; promo playtest sets (pf24, pf25) fall out via promo: true below.
  // mb2 (Mystery Booster 2) is set_type "masters" and has no other
  // distinguishing field in bulk data, so we exclude it by set code.
  if (card.set?.toLowerCase() === "mb2") return false;

  // -is:extras — exclude supplemental product set types.
  if (card.set_type && EXTRA_SET_TYPES.has(card.set_type)) return false;

  // not:extra — exclude tokens, schemes, art series, planar, vanguard, …
  if (card.layout && EXTRA_LAYOUTS.has(card.layout)) return false;

  // -is:split — split layout cards get filtered out for both modes.
  if (card.layout === "split") return false;

  // -t:dungeon / -t:land / -t:conspiracy / not:token (via type_line).
  if (EXCLUDED_TYPE_KEYWORDS.some((kw) => card.type_line?.includes(kw))) {
    return false;
  }

  // has:mana — card must have a printed mana cost.
  // Jumpstart booster-face cards (e.g. "GROSS" from J22) have mana_cost: null
  // and no face mana costs; this is distinct from a {0} mana cost (Ornithopter).
  const hasMana =
    card.mana_cost != null ||
    card.card_faces?.some((face) => face.mana_cost != null);
  if (!hasMana) return false;

  // -mana:{X} — exclude cards whose mana cost contains {X}.
  if (card.mana_cost?.includes("{X}")) return false;
  if (card.card_faces?.some((face) => face.mana_cost?.includes("{X}"))) {
    return false;
  }

  // Need an image to display the card in-game.
  const hasImage =
    card.image_uris?.normal ??
    card.image_uris?.large ??
    card.image_uris?.small ??
    card.card_faces?.[0]?.image_uris?.normal;
  if (!hasImage) return false;

  return true;
}

/**
 * Download the latest `oracle_cards` bulk file, apply pool filters, and
 * return the result as MtgCards ready to insert into `card_pool` or to seed
 * a daily challenge.
 *
 * Memory: the full JSON is ~165MB and is parsed in one pass, then dropped.
 * Vercel's default serverless function memory is 1024MB, well above the
 * working-set peak this incurs (~300MB during JSON.parse).
 */
export async function fetchAndFilterBulkCards(): Promise<MtgCard[]> {
  const downloadUrl = await fetchBulkManifestUrl();

  const res = await fetch(downloadUrl, {
    headers: { "User-Agent": SCRYFALL_USER_AGENT, Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`Scryfall bulk download ${res.status}: ${body}`);
  }

  const cards = (await res.json()) as ScryfallCard[];

  const filtered: MtgCard[] = [];
  for (const card of cards) {
    if (passesPoolFilters(card)) {
      filtered.push(toMtgCard(card));
    }
  }
  return filtered;
}
