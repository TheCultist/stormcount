/**
 * App-wide constants for Storm Count.
 */

/**
 * Daily Challenge: 51 cards → 50 anchor/mystery pairs → score goes 0–50.
 * The first card is the initial anchor (no guess), so pairs = DAILY_SEED_SIZE - 1.
 */
export const DAILY_SEED_SIZE = 51;

/** Top N players shown on leaderboard. */
export const LEADERBOARD_TOP_N = 100;

/**
 * How long the board holds after each guess before advancing. Also the
 * server's floor for a Daily run's elapsed time (guesses × this).
 */
export const REVEAL_DURATION_MS = 1000;

/** Route constants. */
export const ROUTES = {
  home: "/",
  daily: "/daily",
  survival: "/survival",
  leaderboard: "/leaderboard",
  leaderboardDate: (date: string) => `/leaderboard/${date}`,
  profile: "/profile",
  contact: "/contact",
  bugReport: "/bug-report",
  about: "/about",
  privacy: "/privacy",
  signIn: "/sign-in",
  signUp: "/sign-up",
} as const;

/** Brand copy. */
export const BRAND = {
  name: "Storm Count",
  domain: "stormcount.gg",
  tagline: "How high is your storm count?",
  /**
   * Search-facing title: says what the game is in the words people search
   * for ("MTG", "daily", "mana value", "guessing game"). The tagline only
   * means something to people who already know the site.
   */
  seoTitle: "Storm Count — Daily MTG Mana Value Guessing Game",
  /** One-paragraph site description used as the default meta description and og:description. */
  description:
    "Free daily Magic: The Gathering guessing game — a Wordle-style MTG puzzle. Two cards each round: is the mystery card's mana value higher or lower? New Daily every day, endless Survival, global leaderboards.",
  /** Short description used by PWA manifest and where length is constrained. */
  shortDescription:
    "A free MTG higher/lower mana-value guessing game. Daily challenges, survival mode, and leaderboards.",
  /** BCP-47 locale tag for <html lang>. */
  htmlLang: "en-US",
  /** Open Graph locale (note the underscore). */
  ogLocale: "en_US",
  /** Publisher / author display name (used in metadata + JSON-LD). */
  publisher: "Storm Count",
  /** Primary brand colour — kept in sync with theme-izzet.css. */
  themeColor: "#0d0c0a",
} as const;
