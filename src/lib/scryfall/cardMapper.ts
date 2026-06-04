/**
 * Converts a raw Scryfall card object (from /cards/search OR bulk data) into
 * the trimmed `MtgCard` shape we persist in the DB and ship to the client.
 *
 * Lives in its own file to avoid a circular import between `seedGenerator`
 * (which uses bulk data) and `bulkClient` (which produces MtgCards).
 */
import type { ScryfallCard } from "./types";
import type { MtgCard } from "@/lib/types";

export function toMtgCard(card: ScryfallCard): MtgCard {
  const imageUris = card.image_uris ?? card.card_faces?.[0]?.image_uris;
  return {
    id: card.id,
    name: card.name,
    cmc: card.cmc ?? 0,
    type_line: card.type_line,
    image_uri: imageUris?.normal ?? imageUris?.large ?? imageUris?.small ?? "",
    scryfall_uri: card.scryfall_uri,
    set_name: card.set_name ?? "",
  };
}

/** Fisher-Yates in-place shuffle. */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
