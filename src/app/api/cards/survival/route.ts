import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import {
  SURVIVAL_SCRYFALL_QUERY,
  SURVIVAL_BATCH_SIZE,
} from "@/lib/scryfall/survivalQuery";
import type { ScryfallCard } from "@/lib/scryfall/types";
import type { MtgCard } from "@/lib/types";
import { db } from "@/lib/db";
import { cardPool } from "@/lib/db/schema";
import { findThemedDayForDate } from "@/lib/themedDays";
import { shuffle, sleep, toMtgCard } from "@/lib/scryfall/cardMapper";
import {
  SCRYFALL_PAGE_SIZE,
  SCRYFALL_REQUEST_DELAY_MS,
  searchCardsPage,
  withPoolFilters,
} from "@/lib/scryfall/http";
import { todayUtc } from "@/lib/dates";

// Never cache — every request must return fresh random cards.
export const dynamic = "force-dynamic";

/** Upper bound on `exclude` ids honoured per request (the client sends ≤60). */
const MAX_EXCLUDED = 100;

// Probe + two orders × one random page → ≤3 throttled calls per pool build.
const LIVE_SORT_DIMENSIONS = ["name", "edhrec"] as const;

/**
 * Live Scryfall candidate pool — used on themed survival days (the pool has to
 * come from a custom query: community Tagger tags etc., not in bulk) and as
 * the fallback when `card_pool` is empty. `query` must already include the
 * pool filters.
 *
 * The pool is cached per instance per (query, day) so every batch request of
 * every player doesn't cost three throttled Scryfall calls.
 */
let livePoolCache: { key: string; pool: Promise<MtgCard[]> } | null = null;

function getLivePool(query: string): Promise<MtgCard[]> {
  const key = `${todayUtc()}|${query}`;
  if (livePoolCache?.key !== key) {
    const pool = collectLivePool(query);
    livePoolCache = { key, pool };
    // Don't cache failures — the next request retries.
    pool.catch(() => {
      if (livePoolCache?.pool === pool) livePoolCache = null;
    });
  }
  return livePoolCache.pool;
}

async function collectLivePool(query: string): Promise<MtgCard[]> {
  const probe = await searchCardsPage(query, 1, "name");
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

  addAll(probe.data);
  if (maxPage > 1) {
    for (const order of LIVE_SORT_DIMENSIONS) {
      await sleep(SCRYFALL_REQUEST_DELAY_MS);
      const randomPage = Math.floor(Math.random() * maxPage) + 1;
      addAll((await searchCardsPage(query, randomPage, order)).data);
    }
  }
  return pool.map(toMtgCard);
}

async function fetchLiveSurvivalCards(
  query: string,
  excluded: Set<string>,
): Promise<MtgCard[]> {
  const pool = await getLivePool(query);
  return shuffle(pool.filter((c) => !excluded.has(c.id))).slice(
    0,
    SURVIVAL_BATCH_SIZE,
  );
}

/**
 * Fetch a random batch from the local card_pool table (the normal path).
 *
 * Postgres `ORDER BY random()` is fine here — the table is small (~30k rows)
 * and the query runs in low single-digit ms. We over-fetch so excluded IDs
 * don't shrink the result below the requested batch size.
 */
async function fetchPoolSurvivalCards(
  excluded: Set<string>,
): Promise<MtgCard[]> {
  const rows = await db
    .select({ card: cardPool.card })
    .from(cardPool)
    .orderBy(sql`random()`)
    .limit(SURVIVAL_BATCH_SIZE + excluded.size + 10);

  return rows
    .map((r) => r.card)
    .filter((c) => !excluded.has(c.id))
    .slice(0, SURVIVAL_BATCH_SIZE);
}

/**
 * GET /api/cards/survival
 *
 * Returns SURVIVAL_BATCH_SIZE truly random cards for survival mode.
 *
 * Resolution order:
 *   1. If today is a themed day with `is_daily=false`, fetch from the
 *      themed Scryfall query (live API, throttled).
 *   2. Otherwise sample `SURVIVAL_BATCH_SIZE` rows from `card_pool` via
 *      `ORDER BY random()` — fast, no external API, no rate limits.
 *   3. If `card_pool` is empty (pool not yet refreshed), fall back to a
 *      live Scryfall query so the game still works.
 *
 * Query params:
 *   exclude — comma-separated card IDs to skip (recently seen cards).
 */
export async function GET(req: NextRequest) {
  const excludeParam = req.nextUrl.searchParams.get("exclude") ?? "";
  const excluded = new Set(
    excludeParam ? excludeParam.split(",").slice(0, MAX_EXCLUDED) : [],
  );

  try {
    // Step 1 — themed survival day?
    const theme = await findThemedDayForDate(todayUtc());
    if (theme && !theme.isDaily) {
      const cards = await fetchLiveSurvivalCards(
        withPoolFilters(theme.scryfallQuery),
        excluded,
      );
      return NextResponse.json({ cards, themed: theme.themeName });
    }

    // Step 2 — pull from card_pool.
    let cards = await fetchPoolSurvivalCards(excluded);

    // Step 3 — fallback if pool is empty.
    if (cards.length === 0) {
      console.warn(
        "[survival] card_pool is empty — falling back to live Scryfall. " +
          "Run POST /api/admin/refresh-pool to populate.",
      );
      cards = await fetchLiveSurvivalCards(SURVIVAL_SCRYFALL_QUERY, excluded);
    }

    return NextResponse.json({ cards });
  } catch (err) {
    console.error("[survival] error:", err);
    return NextResponse.json({ error: "Couldn't load cards" }, { status: 502 });
  }
}
