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
