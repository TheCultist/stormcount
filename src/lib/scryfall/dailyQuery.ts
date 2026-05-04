/**
 * Scryfall query for the Daily Challenge card pool.
 *
 * Edit THIS FILE to change the card pool for Daily mode.
 * Scryfall syntax reference: https://scryfall.com/docs/syntax
 */
export const DAILY_SCRYFALL_QUERY =
  "is:default -t:dungeon -t:land -t:conspiracy -is:unset -mana:{X} not:extra not:token unique:cards game:paper";

/** Cards to fetch in one random Scryfall page (max ~175). */
export const DAILY_FETCH_SIZE = 175;
