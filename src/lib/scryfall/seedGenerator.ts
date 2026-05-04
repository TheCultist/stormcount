import { DAILY_SCRYFALL_QUERY } from "./dailyQuery";
import { DAILY_SEED_SIZE } from "@/lib/constants";
import type { ScryfallSearchResponse } from "./types";
import type { MtgCard } from "@/lib/types";

const SCRYFALL_BASE_URL = "https://api.scryfall.com";
const SCRYFALL_USER_AGENT =
  process.env.SCRYFALL_USER_AGENT ?? "stormcount/1.0 (+https://stormcount.gg)";

// Scryfall returns at most 175 cards per page.
const SCRYFALL_PAGE_SIZE = 175;

export function toMtgCard(
  card: ScryfallSearchResponse["data"][number],
): MtgCard {
  const imageUris = card.image_uris ?? card.card_faces?.[0]?.image_uris;
  return {
    id: card.id,
    name: card.name,
    cmc: card.cmc ?? 0,
    type_line: card.type_line,
    image_uri: imageUris?.normal ?? imageUris?.large ?? imageUris?.small ?? "",
    scryfall_uri: card.scryfall_uri,
  };
}

/** Fisher-Yates in-place shuffle (mirrors survival route). */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function scryfallPage(page: number): Promise<ScryfallSearchResponse> {
  const url = new URL(`${SCRYFALL_BASE_URL}/cards/search`);
  url.searchParams.set("q", `prefer:best ${DAILY_SCRYFALL_QUERY}`);
  url.searchParams.set("unique", "cards");
  url.searchParams.set("page", page.toString());

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": SCRYFALL_USER_AGENT, Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`Scryfall ${res.status}: ${body}`);
  }

  return res.json() as Promise<ScryfallSearchResponse>;
}

/**
 * Returns DAILY_SEED_SIZE truly random cards from the daily card pool.
 *
 * Strategy (mirrors the survival route):
 * 1. Fetch page 1 → learn total_cards → compute total pages.
 * 2. Pick a random page, fetch it (reuse page-1 data if selected).
 * 3. Fisher-Yates shuffle the page results.
 * 4. Slice to DAILY_SEED_SIZE.
 *    If the random page was short (last page edge case), fall back to page 1.
 *
 * The caller is responsible for persisting the result so all players share
 * the same set on a given day.
 */
export async function generateDailyCards(): Promise<MtgCard[]> {
  // Step 1 — page 1 reveals the pool size.
  const firstPage = await scryfallPage(1);
  const maxPage = Math.max(
    1,
    Math.ceil(firstPage.total_cards / SCRYFALL_PAGE_SIZE),
  );

  // Step 2 — random page selection; reuse page-1 data if chosen.
  const randomPage = Math.floor(Math.random() * maxPage) + 1;
  const pageData =
    randomPage === 1 ? firstPage : await scryfallPage(randomPage);

  // Step 3 — shuffle and slice.
  const cards = shuffle([...pageData.data])
    .slice(0, DAILY_SEED_SIZE)
    .map(toMtgCard);

  // Step 4 — guard against a short last page; fall back to page 1.
  if (cards.length < DAILY_SEED_SIZE) {
    const fallback = shuffle([...firstPage.data])
      .slice(0, DAILY_SEED_SIZE)
      .map(toMtgCard);

    if (fallback.length < DAILY_SEED_SIZE) {
      throw new Error(
        `Not enough cards from Scryfall: got ${fallback.length}, need ${DAILY_SEED_SIZE}`,
      );
    }

    return fallback;
  }

  return cards;
}
