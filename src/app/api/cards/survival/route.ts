import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import {
  SURVIVAL_SCRYFALL_QUERY,
  SURVIVAL_BATCH_SIZE,
} from "@/lib/scryfall/survivalQuery";
import type {
  ScryfallCard,
  ScryfallSearchResponse,
} from "@/lib/scryfall/types";
import type { MtgCard } from "@/lib/types";
import { db } from "@/lib/db";
import { cardPool } from "@/lib/db/schema";
import { findThemedDayForDate } from "@/lib/themedDays";
import { shuffle, toMtgCard } from "@/lib/scryfall/cardMapper";

// Never cache — every request must return fresh random cards.
export const dynamic = "force-dynamic";

const SCRYFALL_BASE_URL = "https://api.scryfall.com";
const SCRYFALL_USER_AGENT =
  process.env.SCRYFALL_USER_AGENT ?? "stormcount/1.0 (+https://stormcount.gg)";

const SCRYFALL_PAGE_SIZE = 175;

// Two orders × one random page each → 3 sequential calls (within 2 req/s).
const THEMED_SORT_DIMENSIONS = ["name", "edhrec"] as const;

/**
 * Live Scryfall search — used only on themed survival days where the pool
 * has to come from a custom query (community Tagger tags etc., not in bulk).
 */
async function scryfallSearchPage(
  query: string,
  page: number,
  order: string,
): Promise<ScryfallSearchResponse> {
  const url = new URL(`${SCRYFALL_BASE_URL}/cards/search`);
  url.searchParams.set("q", `prefer:best ${query}`);
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
 * Themed-survival fetch — re-implements the multi-order live search used
 * before the bulk migration, but with the themed query string instead of
 * the static SURVIVAL_SCRYFALL_QUERY.
 */
async function fetchThemedSurvivalCards(
  query: string,
  excluded: Set<string>,
): Promise<MtgCard[]> {
  const probe = await scryfallSearchPage(query, 1, "name");
  const maxPage = Math.max(
    1,
    Math.ceil(probe.total_cards / SCRYFALL_PAGE_SIZE),
  );

  const seen = new Set<string>();
  const pool: ScryfallCard[] = [];

  for (const order of THEMED_SORT_DIMENSIONS) {
    const randomPage = Math.floor(Math.random() * maxPage) + 1;
    const pageData = await scryfallSearchPage(query, randomPage, order);
    for (const card of pageData.data) {
      if (!seen.has(card.id)) {
        seen.add(card.id);
        pool.push(card);
      }
    }
  }

  return shuffle(pool)
    .filter((c) => !excluded.has(c.id))
    .slice(0, SURVIVAL_BATCH_SIZE)
    .map(toMtgCard);
}

/**
 * Fetch a random batch from the local card_pool table (the normal path).
 *
 * Postgres `ORDER BY random()` is fine here — the table is small (~30k rows)
 * and the query runs in low single-digit ms with the index on `id` already
 * present. We over-fetch slightly so excluded IDs don't shrink the result
 * below the requested batch size in the common case.
 */
async function fetchPoolSurvivalCards(
  excluded: Set<string>,
): Promise<MtgCard[]> {
  const overFetch = Math.min(
    SURVIVAL_BATCH_SIZE + excluded.size + 10,
    200,
  );

  const rows = await db
    .select({ id: cardPool.id, card: cardPool.card })
    .from(cardPool)
    .orderBy(sql`random()`)
    .limit(overFetch);

  return rows
    .map((r) => r.card)
    .filter((c) => !excluded.has(c.id))
    .slice(0, SURVIVAL_BATCH_SIZE);
}

/**
 * Fallback live search when card_pool is empty (admin hasn't refreshed yet).
 * Mirrors the old behaviour so the game still works on first deploy.
 */
async function fetchLiveSurvivalCards(
  excluded: Set<string>,
): Promise<MtgCard[]> {
  return fetchThemedSurvivalCards(SURVIVAL_SCRYFALL_QUERY, excluded);
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
  const { searchParams } = new URL(req.url);
  const excludeParam = searchParams.get("exclude") ?? "";
  const excluded = new Set(excludeParam ? excludeParam.split(",") : []);

  const today = new Date().toISOString().slice(0, 10);

  try {
    // Step 1 — themed survival day?
    const theme = await findThemedDayForDate(today);
    if (theme && !theme.isDaily) {
      const cards = await fetchThemedSurvivalCards(
        theme.scryfallQuery,
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
      cards = await fetchLiveSurvivalCards(excluded);
    }

    return NextResponse.json({ cards });
  } catch (err) {
    console.error("[survival] error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
