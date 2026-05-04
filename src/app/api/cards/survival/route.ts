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

async function scryfallSearch(page: number): Promise<ScryfallSearchResponse> {
  const url = new URL(`${SCRYFALL_BASE_URL}/cards/search`);
  url.searchParams.set("q", `prefer:best ${SURVIVAL_SCRYFALL_QUERY}`);
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
    // Step 1 — fetch page 1 to discover total pool size.
    const firstPage = await scryfallSearch(1);
    const totalCards = firstPage.total_cards;
    const maxPage = Math.max(1, Math.ceil(totalCards / SCRYFALL_PAGE_SIZE));

    // Step 2 — pick a random page and fetch it (skip extra call if page 1 chosen).
    const randomPage = Math.floor(Math.random() * maxPage) + 1;
    const pageData =
      randomPage === 1 ? firstPage : await scryfallSearch(randomPage);

    // Step 3 — shuffle, filter, slice.
    const shuffled = shuffle([...pageData.data]);
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
