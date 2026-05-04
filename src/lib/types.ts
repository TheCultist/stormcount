/**
 * Game-level types for Storm Count.
 * Raw Scryfall shapes live in @/lib/scryfall/types.
 */

/** Minimal card shape used by the game UI. */
export type MtgCard = {
  id: string;
  name: string;
  cmc: number;
  mana_cost: string;
  type_line: string;
  /** Full card face (frame + mana cost visible). Used for anchor. */
  image_uri: string;
  /** Art crop only — no frame, no mana cost. Used for mystery. */
  art_crop_uri?: string;
};

export type GameMode = "daily" | "survival";

export type GuessDirection = "higher" | "lower";

export type GuessResult = "correct" | "wrong";

export type GameStatus = "idle" | "playing" | "gameover";

export type LeaderboardEntry = {
  rank: number;
  username: string;
  score: number;
  elapsed_ms: number;
};

export type DailySeed = {
  date: string; // ISO yyyy-mm-dd (UTC)
  card_ids: string[]; // ordered, length 100
  themed?: string | null; // e.g. "Dragons Day"
};

export type SubmitScorePayload = {
  date: string; // ISO yyyy-mm-dd (UTC)
  score: number;
  elapsed_ms: number;
  // Client-provided sequence of guesses for server-side validation.
  guesses: GuessDirection[];
};

export type SubmitScoreResponse =
  | { ok: true; rank: number | null }
  | { ok: false; error: string };
