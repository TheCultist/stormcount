import { DAILY_SCRYFALL_QUERY } from "./dailyQuery";
import { DAILY_SEED_SIZE } from "@/lib/constants";
import type { ScryfallSearchResponse } from "./types";
import type { MtgCard } from "@/lib/types";

const SCRYFALL_BASE_URL = "https://api.scryfall.com";
const SCRYFALL_USER_AGENT =
  process.env.SCRYFALL_USER_AGENT ?? "stormcount/1.0 (+https://stormcount.gg)";

// Scryfall returns at most 175 cards per page.
const SCRYFALL_PAGE_SIZE = 175;

// /cards/search is rate-limited to 2 req/s (500 ms). We use 600 ms to give
// a small safety margin and be a polite API consumer.
const SCRYFALL_REQUEST_DELAY_MS = 600;

/**
 * Sort orders used to sample from different "dimensions" of the catalog.
 *
 * Scryfall has no order=random, and all results under a single order are
 * sorted deterministically — picking a random page from order=name always
 * yields alphabetically-adjacent cards. We combat this two ways:
 *
 *   1. Seven orthogonal orderings so that no two pages share the same
 *      "neighborhood" structure:
 *        name      → alphabetical
 *        edhrec    → EDHREC popularity rank
 *        released  → set release date
 *        cmc       → converted mana cost
 *        color     → color-identity ordering
 *        usd       → market price
 *        artist    → artist name (completely orthogonal to card name)
 *
 *   2. Two independently-chosen random pages per dimension so that even
 *      within a single ordering we sample from two unrelated positions.
 *
 * 7 dimensions × 2 pages × 175 cards ≈ 2,450 candidates (before dedup).
 * After deduplication and a Fisher-Yates shuffle we slice DAILY_SEED_SIZE.
 * Generation runs once per day, so 15 sequential API calls is fine.
 */
const SORT_DIMENSIONS = [
  "name",
  "edhrec",
  "released",
  "cmc",
  "color",
  "usd",
  "artist",
] as const;

/** How many independently-chosen random pages to fetch per dimension. */
const PAGES_PER_DIMENSION = 2;

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

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Fisher-Yates in-place shuffle (mirrors survival route). */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function scryfallPage(
  page: number,
  order: string = "name",
): Promise<ScryfallSearchResponse> {
  const url = new URL(`${SCRYFALL_BASE_URL}/cards/search`);
  url.searchParams.set("q", `prefer:best ${DAILY_SCRYFALL_QUERY}`);
  url.searchParams.set("unique", "cards");
  url.searchParams.set("order", order);
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
 * Strategy:
 * 1. Fetch order=name page 1 → learn total_cards / total pages (discard cards).
 * 2. For each sort dimension, pick PAGES_PER_DIMENSION independently-chosen
 *    random page numbers and fetch them sequentially. Choosing pages randomly
 *    within a dimension spreads sampling across the full ordering range, and
 *    using seven distinct orderings ensures the final pool spans orthogonal
 *    parts of the catalog (alphabetical, popularity, price, artist, …).
 * 3. Merge all pages, deduplicate by card ID, Fisher-Yates shuffle.
 * 4. Slice to DAILY_SEED_SIZE.
 *
 * The caller is responsible for persisting the result so all players share
 * the same set on a given day.
 */
export async function generateDailyCards(): Promise<MtgCard[]> {
  // Step 1 — page 1 reveals the pool size (we discard its card data).
  const probePage = await scryfallPage(1, "name");
  const maxPage = Math.max(
    1,
    Math.ceil(probePage.total_cards / SCRYFALL_PAGE_SIZE),
  );

  // Step 2 — fetch PAGES_PER_DIMENSION random pages per sort dimension.
  // Each call is separated by SCRYFALL_REQUEST_DELAY_MS to respect the
  // /cards/search hard limit of 2 requests per second.
  const seen = new Set<string>();
  const pool: ScryfallSearchResponse["data"] = [];

  for (const order of SORT_DIMENSIONS) {
    // Pick PAGES_PER_DIMENSION distinct random page numbers within [1, maxPage].
    const chosenPages = new Set<number>();
    while (chosenPages.size < Math.min(PAGES_PER_DIMENSION, maxPage)) {
      chosenPages.add(Math.floor(Math.random() * maxPage) + 1);
    }

    for (const pageNum of chosenPages) {
      await sleep(SCRYFALL_REQUEST_DELAY_MS);
      const pageData = await scryfallPage(pageNum, order);
      for (const card of pageData.data) {
        if (!seen.has(card.id)) {
          seen.add(card.id);
          pool.push(card);
        }
      }
    }
  }

  // Step 3 — shuffle the merged pool.
  const shuffled = shuffle(pool);

  // Step 4 — slice to DAILY_SEED_SIZE.
  const cards = shuffled.slice(0, DAILY_SEED_SIZE).map(toMtgCard);

  const totalFetches = SORT_DIMENSIONS.length * PAGES_PER_DIMENSION;
  if (cards.length < DAILY_SEED_SIZE) {
    throw new Error(
      `Not enough cards from Scryfall: got ${cards.length} across ${totalFetches} page(s) (${SORT_DIMENSIONS.length} dimension(s) × ${PAGES_PER_DIMENSION}), need ${DAILY_SEED_SIZE}`,
    );
  }

  return cards;
}
