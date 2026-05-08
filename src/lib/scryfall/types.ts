// Scryfall API response types
// Copied from findthatcard (commerce-shaped types trimmed out).

export interface ScryfallImageUris {
  small?: string;
  normal?: string;
  large?: string;
  png?: string;
  art_crop?: string;
  border_crop?: string;
}

export interface ScryfallCardFace {
  name: string;
  mana_cost?: string;
  type_line?: string;
  oracle_text?: string;
  image_uris?: ScryfallImageUris;
}

export interface ScryfallRelatedCard {
  id: string;
  name: string;
  type: string;
  uri: string;
}

export interface ScryfallCard {
  id: string;
  name: string;
  mana_cost?: string;
  cmc?: number;
  type_line: string;
  oracle_text?: string;
  image_uris?: ScryfallImageUris;
  card_faces?: ScryfallCardFace[];
  scryfall_uri: string;
  set_name?: string;
  set?: string;
  set_type?: string;
  oracle_id?: string;
  digital?: boolean;
  collector_number?: string;
  all_parts?: ScryfallRelatedCard[];
  // Fields present on bulk-data card objects (used by bulkClient filters).
  layout?: string;
  games?: string[];
  promo?: boolean;
  reprint?: boolean;
  variation?: boolean;
  textless?: boolean;
  border_color?: string;
  rarity?: string;
  // "acorn" on non-un-set cards that are still joke/silver-border equivalent.
  security_stamp?: string;
}

/**
 * Entry in the Scryfall /bulk-data manifest response.
 *
 * Documented at https://scryfall.com/docs/api/bulk-data — only the fields we
 * actually consume are typed.
 */
export interface ScryfallBulkDataEntry {
  type: string; // "oracle_cards" | "default_cards" | "all_cards" | ...
  name: string;
  description: string;
  download_uri: string;
  updated_at: string;
  size: number;
  content_type: string;
  content_encoding: string;
}

export interface ScryfallBulkDataManifest {
  object: "list";
  has_more: boolean;
  data: ScryfallBulkDataEntry[];
}

export interface ScryfallSearchResponse {
  object: "list";
  total_cards: number;
  has_more: boolean;
  data: ScryfallCard[];
}

export interface ScryfallError {
  object: "error";
  code: string;
  status: number;
  details: string;
}
