import { DAILY_SEED_SIZE } from "@/lib/constants";
import type { ScryfallCard } from "./types";
import type { MtgCard } from "@/lib/types";
import { fetchAndFilterBulkCards } from "./bulkClient";
import { shuffle, sleep, toMtgCard } from "./cardMapper";
import {
  SCRYFALL_PAGE_SIZE,
  SCRYFALL_REQUEST_DELAY_MS,
  searchCardsPage,
  withPoolFilters,
} from "./http";

/**
 * For themed-day seeds we still hit the live `/cards/search` endpoint —
 * bulk data does not include community Tagger tags, so themed queries that
 * use `tag:` (e.g. "Star Wars Day") have to go through the search API.
 *
 * Five orthogonal sort orders × two random pages ≈ 1,750 candidates, plenty
 * for a 51-card seed even on niche themes.
 */
const THEMED_SORT_DIMENSIONS = [
  "name",
  "edhrec",
  "released",
  "cmc",
  "artist",
] as const;

const THEMED_PAGES_PER_DIMENSION = 2;

/**
 * Returns DAILY_SEED_SIZE truly random cards from the regular daily pool.
 *
 * Strategy: download Scryfall's `oracle_cards` bulk dataset, apply the
 * shared pool filters, Fisher-Yates shuffle, slice. The bulk download is
 * one HTTP call instead of the previous fifteen paginated search requests,
 * and uniform random sampling eliminates the "alphabetically adjacent"
 * bias of the old multi-dimension approach.
 *
 * The caller is responsible for persisting the result so all players share
 * the same set on a given day.
 */
export async function generateDailyCards(): Promise<MtgCard[]> {
  const pool = await fetchAndFilterBulkCards();

  if (pool.length < DAILY_SEED_SIZE) {
    throw new Error(
      `Bulk data yielded only ${pool.length} eligible cards, need ${DAILY_SEED_SIZE}`,
    );
  }

  return shuffle(pool).slice(0, DAILY_SEED_SIZE);
}

/**
 * Generate a daily seed for a themed day using a custom Scryfall query.
 *
 * Themed queries (e.g. `t:dragon`, `tag:star-wars`) frequently rely on
 * community Tagger tags or other fields not present in bulk data, so we
 * have to use the live search API. Multiple sort dimensions × multiple
 * random pages keep the result diverse even when the query yields a
 * smaller pool than the regular daily. The regular pool filters are applied
 * on top of the themed query.
 *
 * Each Scryfall call is preceded by a 600ms sleep to respect the 2 req/s
 * rate limit.
 */
export async function generateThemedCards(query: string): Promise<MtgCard[]> {
  const filtered = withPoolFilters(query);

  // Probe page 1 to learn the total result count and total pages.
  const probe = await searchCardsPage(filtered, 1, "name");
  if (probe.total_cards < DAILY_SEED_SIZE) {
    throw new Error(
      `Themed query "${query}" matches only ${probe.total_cards} eligible cards, need ${DAILY_SEED_SIZE}`,
    );
  }
  const maxPage = Math.max(
    1,
    Math.ceil(probe.total_cards / SCRYFALL_PAGE_SIZE),
  );

  const seen = new Set<string>();
  const pool: ScryfallCard[] = [];
  const addAll = (cards: ScryfallCard[]) => {
    for (const card of cards) {
      if (!seen.has(card.id)) {
        seen.add(card.id);
        pool.push(card);
      }
    }
  };

  // Seed pool with probe results so the first call isn't wasted.
  addAll(probe.data);

  // A single page already holds the whole result set — no more calls needed.
  if (maxPage > 1) {
    for (const order of THEMED_SORT_DIMENSIONS) {
      const chosenPages = new Set<number>();
      while (chosenPages.size < Math.min(THEMED_PAGES_PER_DIMENSION, maxPage)) {
        chosenPages.add(Math.floor(Math.random() * maxPage) + 1);
      }

      for (const pageNum of chosenPages) {
        await sleep(SCRYFALL_REQUEST_DELAY_MS);
        addAll((await searchCardsPage(filtered, pageNum, order)).data);
      }
    }
  }

  const cards = shuffle(pool).slice(0, DAILY_SEED_SIZE).map(toMtgCard);

  if (cards.length < DAILY_SEED_SIZE) {
    throw new Error(
      `Themed query "${query}" yielded only ${cards.length} cards, need ${DAILY_SEED_SIZE}`,
    );
  }

  return cards;
}
