import { ScryfallError, ScryfallSearchResponse } from "@/lib/scryfall/types";

const SCRYFALL_BASE_URL = "https://api.scryfall.com";
const SCRYFALL_USER_AGENT =
  process.env.SCRYFALL_USER_AGENT || "stormcount/1.0 (+https://stormcount.gg)";
export const CARDS_PER_PAGE = 60;

// Prepended to every query so Scryfall returns best art printings.
const PREFER_BEST_PREFIX = "prefer:best ";

/**
 * Calculates which Scryfall page to fetch and the offset within that page.
 * Scryfall returns ~175 cards per page; we want 60 per page display-side.
 */
function calculateScryfallPage(ourPage: number): { scryfallPage: number; offset: number } {
  const SCRYFALL_CARDS_PER_PAGE = 175;
  const totalOffset = (ourPage - 1) * CARDS_PER_PAGE;
  const scryfallPage = Math.floor(totalOffset / SCRYFALL_CARDS_PER_PAGE) + 1;
  const offset = totalOffset % SCRYFALL_CARDS_PER_PAGE;
  return { scryfallPage, offset };
}

function buildQueryWithPrefer(query: string): string {
  const trimmed = query.trim();
  const hasPreferBest = /^prefer:best\s+/i.test(trimmed);
  const queryBody = hasPreferBest
    ? trimmed.replace(/^prefer:best\s+/i, "").trim()
    : trimmed;
  return hasPreferBest
    ? `prefer:best ${queryBody}`
    : `${PREFER_BEST_PREFIX}${queryBody}`;
}

/**
 * Executes a Scryfall search.
 * May fetch multiple Scryfall pages if needed to fill our 60-card page.
 */
export async function searchScryfall(
  query: string,
  page: number = 1,
): Promise<{ response: ScryfallSearchResponse; offset: number }> {
  const { scryfallPage, offset } = calculateScryfallPage(page);
  const queryWithPrefer = buildQueryWithPrefer(query);

  const url = new URL(`${SCRYFALL_BASE_URL}/cards/search`);
  url.searchParams.set("q", queryWithPrefer);
  url.searchParams.set("unique", "cards");
  url.searchParams.set("page", scryfallPage.toString());

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": SCRYFALL_USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorData: ScryfallError = await response.json().catch(() => ({
        object: "error" as const,
        code: "unknown",
        status: response.status,
        details: response.statusText,
      }));

      if (response.status === 404) {
        return {
          response: {
            object: "list",
            total_cards: 0,
            has_more: false,
            data: [],
          },
          offset: 0,
        };
      }

      throw new Error(errorData.details || `Scryfall API error: ${response.statusText}`);
    }

    const data: ScryfallSearchResponse = await response.json();

    const cardsAvailable = data.data.length - offset;
    if (cardsAvailable < CARDS_PER_PAGE && data.has_more) {
      const nextPageUrl = new URL(`${SCRYFALL_BASE_URL}/cards/search`);
      nextPageUrl.searchParams.set("q", queryWithPrefer);
      nextPageUrl.searchParams.set("unique", "cards");
      nextPageUrl.searchParams.set("page", (scryfallPage + 1).toString());

      const nextResponse = await fetch(nextPageUrl.toString(), {
        headers: {
          "User-Agent": SCRYFALL_USER_AGENT,
          Accept: "application/json",
        },
      });

      if (nextResponse.ok) {
        const nextData: ScryfallSearchResponse = await nextResponse.json();
        return {
          response: {
            ...data,
            data: [...data.data, ...nextData.data],
          },
          offset,
        };
      }
    }

    return { response: data, offset };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to search Scryfall");
  }
}
