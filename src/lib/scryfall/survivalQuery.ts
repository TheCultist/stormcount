/**
 * Scryfall query for Survival mode.
 *
 * Edit THIS FILE to change the card pool for Survival mode.
 * The query is passed to the Scryfall search API and used as the bulk-data
 * filter when refreshing the `card_pool` table.
 *
 * Filters mirror DAILY_SCRYFALL_QUERY — both modes exclude X-cost spells
 * (`-mana:{X}`) and split cards (`-is:split`).
 *
 * Scryfall syntax reference: https://scryfall.com/docs/syntax
 */
export const SURVIVAL_SCRYFALL_QUERY =
  "is:default game:paper -is:funny -is:playtest -is:extras -is:digital -is:split -mana:{X} -t:dungeon -t:land -t:conspiracy not:extra not:token unique:cards";

/** How many cards to fetch per batch. */
export const SURVIVAL_BATCH_SIZE = 20;
