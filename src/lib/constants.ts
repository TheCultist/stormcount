/**
 * App-wide constants for Storm Count.
 */

/** Scryfall query for the card pool (per design doc §04). */
export const SCRYFALL_POOL_QUERY =
  "prefer:best is:default -t:dungeon -t:land -t:conspiracy -is:unset -mana:{X} not:extra not:token unique:cards game:paper";

/**
 * Daily Challenge: 51 cards → 50 anchor/mystery pairs → score goes 0–50.
 * The first card is the initial anchor (no guess), so pairs = DAILY_SEED_SIZE - 1.
 */
export const DAILY_SEED_SIZE = 51;

/** Top N players shown on leaderboard. */
export const LEADERBOARD_TOP_N = 100;

/** MTG mana colour hex values — mirror globals.css CSS vars. */
export const MANA_COLORS = {
  W: "#f9faf4", // white
  U: "#0e68ab", // blue
  B: "#150b00", // black
  R: "#d3202a", // red
  G: "#00733e", // green
  C: "#9e9e9e", // generic / colourless
} as const;

export type ManaColorKey = keyof typeof MANA_COLORS;

/** Route constants. */
export const ROUTES = {
  home: "/",
  daily: "/daily",
  survival: "/survival",
  leaderboard: "/leaderboard",
  leaderboardDate: (date: string) => `/leaderboard/${date}`,
  profile: "/profile",
  contact: "/contact",
  signIn: "/sign-in",
  signUp: "/sign-up",
} as const;

/** Brand copy. */
export const BRAND = {
  name: "Storm Count",
  domain: "stormcount.gg",
  tagline: "How high is your storm count?",
} as const;
