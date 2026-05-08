/**
 * Game-level types for Storm Count.
 * Raw Scryfall shapes live in @/lib/scryfall/types.
 */

/** Minimal card shape used by the game UI and persisted in daily_seeds. */
export type MtgCard = {
  id: string;
  name: string;
  cmc: number;
  type_line: string;
  /** Full card image (normal size). Used for both anchor and mystery display. */
  image_uri: string;
  /** Canonical Scryfall page URL — stored for future deep-link use. */
  scryfall_uri: string;
};

export type GameMode = "daily" | "survival";

export type GuessDirection = "higher" | "lower";

export type GuessResult = "correct" | "wrong";

export type GameStatus = "idle" | "playing" | "gameover";

export type LeaderboardEntry = {
  rank: number;
  userId?: string;
  username: string;
  imageUrl?: string | null;
  score: number;
  elapsed_ms: number;
};

export type DailySeed = {
  date: string; // ISO yyyy-mm-dd (UTC)
  card_ids: string[]; // ordered, length 100
  themed?: string | null; // e.g. "Dragons Day"
  themedDescription?: string | null; // long-form blurb for themed days
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
