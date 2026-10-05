/**
 * Shared Scryfall HTTP plumbing: base URL, User-Agent, timeouts and the one
 * `/cards/search` page fetcher used by themed seeds and themed survival.
 *
 * Scryfall etiquette: send a descriptive User-Agent + Accept header, and keep
 * `/cards/search` under 2 req/s (callers throttle with SCRYFALL_REQUEST_DELAY_MS).
 */
import type { ScryfallSearchResponse } from "./types";
import { SURVIVAL_SCRYFALL_QUERY } from "./survivalQuery";

export const SCRYFALL_BASE_URL = "https://api.scryfall.com";

export const SCRYFALL_USER_AGENT =
  process.env.SCRYFALL_USER_AGENT || "stormcount/1.0 (+https://stormcount.gg)";

/** Scryfall returns at most 175 cards per search page. */
export const SCRYFALL_PAGE_SIZE = 175;

/** `/cards/search` is limited to 2 req/s; 600ms leaves a safety margin. */
export const SCRYFALL_REQUEST_DELAY_MS = 600;

const API_TIMEOUT_MS = 15_000;

/** `fetch` with Scryfall headers, no caching and a hard timeout. */
export function scryfallFetch(
  url: string,
  { accept = "application/json", timeoutMs = API_TIMEOUT_MS } = {},
): Promise<Response> {
  return fetch(url, {
    headers: { "User-Agent": SCRYFALL_USER_AGENT, Accept: accept },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
}

/**
 * Scryfall display keywords. They are rejected inside parentheses ("Display
 * options may not be specified inside parentheses"), so `withPoolFilters`
 * hoists them out of the grouped admin query.
 */
const DISPLAY_OPTION_RE = /(?:^|\s)(?:order|unique|prefer|direction|display):\S+/gi;

/**
 * Restrict an arbitrary (admin-authored) query to cards that are playable in
 * Storm Count — no lands, X-spells, tokens, etc. Without this a themed query
 * like `t:dragon` happily returns X-cost dragons and Dragon lands. The query
 * is parenthesised so a top-level `or` can't escape the filters.
 */
export function withPoolFilters(query: string): string {
  const displayOptions = (query.match(DISPLAY_OPTION_RE) ?? []).map((o) => o.trim());
  const filters = query.replace(DISPLAY_OPTION_RE, " ").trim();
  return [`(${filters})`, SURVIVAL_SCRYFALL_QUERY, ...displayOptions].join(" ");
}

/** One page of `/cards/search` (best-art printing, one entry per card). */
export async function searchCardsPage(
  query: string,
  page: number,
  order: string = "name",
): Promise<ScryfallSearchResponse> {
  const url = new URL(`${SCRYFALL_BASE_URL}/cards/search`);
  url.searchParams.set("q", `prefer:best ${query}`);
  url.searchParams.set("unique", "cards");
  url.searchParams.set("order", order);
  url.searchParams.set("page", page.toString());

  const res = await scryfallFetch(url.toString());
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`Scryfall ${res.status}: ${body}`);
  }
  return res.json() as Promise<ScryfallSearchResponse>;
}

/**
 * How many playable cards an (admin-authored) query matches once the pool
 * filters are applied: a number, `0` for no matches, or `null` when Scryfall
 * couldn't answer (outage/timeout). Throws with Scryfall's explanation when
 * the query itself is invalid.
 */
export async function countPoolMatches(query: string): Promise<number | null> {
  const url = new URL(`${SCRYFALL_BASE_URL}/cards/search`);
  url.searchParams.set("q", withPoolFilters(query));
  url.searchParams.set("unique", "cards");

  let res: Response;
  try {
    res = await scryfallFetch(url.toString());
  } catch {
    return null;
  }
  if (res.ok) return ((await res.json()) as ScryfallSearchResponse).total_cards;
  if (res.status === 404) return 0;
  if (res.status === 400) {
    const err = (await res.json().catch(() => null)) as { details?: string } | null;
    throw new Error(err?.details ?? "Scryfall rejected the query");
  }
  return null;
}
