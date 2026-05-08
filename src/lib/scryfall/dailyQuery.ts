/**
 * Scryfall query for the Daily Challenge card pool.
 *
 * Edit THIS FILE to change the card pool for Daily mode.
 * Scryfall syntax reference: https://scryfall.com/docs/syntax
 *
 * Filters mirror SURVIVAL_SCRYFALL_QUERY — both modes exclude X-cost spells
 * (`-mana:{X}`) and split cards (`-is:split`) so players see the same kind of
 * cards regardless of mode.
 */
export const DAILY_SCRYFALL_QUERY =
  "is:default game:paper -is:funny -is:playtest -is:extras -is:digital -is:split -mana:{X} -t:dungeon -t:land -t:conspiracy not:extra not:token unique:cards";

/** Cards to fetch in one random Scryfall page (max ~175). */
export const DAILY_FETCH_SIZE = 175;
