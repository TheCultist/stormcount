import { NextRequest, NextResponse } from "next/server";
import { SURVIVAL_SCRYFALL_QUERY, SURVIVAL_BATCH_SIZE } from "@/lib/scryfall/survivalQuery";
import type { ScryfallCard, ScryfallSearchResponse } from "@/lib/scryfall/types";
import type { MtgCard } from "@/lib/types";

// Never cache — every request must return fresh random cards.
export const dynamic = "force-dynamic";

const SCRYFALL_BASE_URL = "https://api.scryfall.com";
const SCRYFALL_USER_AGENT =
  process.env.SCRYFALL_USER_AGENT || "stormcount/1.0 (+https://stormcount.gg)";

// Scryfall returns ~175 cards per page.
const SCRYFALL_PAGE_SIZE = 175;

/**
 * Sort orders used to sample from different "dimensions" of the catalog.
 *
 * Each order sorts the 15k-card pool completely differently, so a random
 * page from order=name and a random page from order=edhrec are drawn from
 * entirely independent parts of the card space — giving genuine variety.
 * Two dimensions keeps survival at 3 total API calls (1 probe + 2 samples),
 * which is well within Scryfall's 2 req/sec rate limit.
 */
const SORT_DIMENSIONS = ["name", "edhrec"] as const;

function toMtgCard(card: ScryfallCard): MtgCard {
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

/** Fisher-Yates in-place shuffle. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function scryfallSearch(
  page: number,
  order: string = "name",
): Promise<ScryfallSearchResponse> {
  const url = new URL(`${SCRYFALL_BASE_URL}/cards/search`);
  url.searchParams.set("q", `prefer:best ${SURVIVAL_SCRYFALL_QUERY}`);
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
 * GET /api/cards/survival
 *
 * Returns SURVIVAL_BATCH_SIZE truly random cards from the survival pool.
 *
 * Strategy:
 *  1. Fetch page 1 → learn total_cards → compute total pages.
 *  2. Pick a random page, fetch it (reuse page-1 data if lucky).
 *  3. Fisher-Yates shuffle the page results.
 *  4. Filter excluded IDs, slice to batch size, map to MtgCard.
 *
 * Query params:
 *   exclude — comma-separated card IDs to skip (recently seen cards).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const excludeParam = searchParams.get("exclude") ?? "";
  const excluded = new Set(excludeParam ? excludeParam.split(",") : []);

  try {
    // Step 1 — probe page 1 to discover total pool size (discard card data).
    const probePage = await scryfallSearch(1, "name");
    const maxPage = Math.max(
      1,
      Math.ceil(probePage.total_cards / SCRYFALL_PAGE_SIZE),
    );

    // Step 2 — fetch one random page per sort dimension sequentially.
    // Different orderings produce completely independent card neighborhoods,
    // so the merged pool spans multiple parts of the catalog.
    const seen = new Set<string>();
    const pool: ScryfallCard[] = [];

    for (const order of SORT_DIMENSIONS) {
      const randomPage = Math.floor(Math.random() * maxPage) + 1;
      const pageData = await scryfallSearch(randomPage, order);
      for (const card of pageData.data) {
        if (!seen.has(card.id)) {
          seen.add(card.id);
          pool.push(card);
        }
      }
    }

    // Step 3 — shuffle, filter excluded, slice.
    const shuffled = shuffle(pool);
    const cards: MtgCard[] = shuffled
      .filter((c) => !excluded.has(c.id))
      .slice(0, SURVIVAL_BATCH_SIZE)
      .map(toMtgCard);

    return NextResponse.json({ cards });
  } catch (err) {
    console.error("[survival] error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
