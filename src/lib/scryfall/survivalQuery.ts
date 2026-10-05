/**
 * Scryfall query for Survival mode.
 *
 * Edit THIS FILE to change the card pool for Survival mode.
 * The query is passed to the Scryfall search API and used as the bulk-data
 * filter when refreshing the `card_pool` table.
 *
 * It is also the base filter for every other pool: the Daily bulk filter in
 * `bulkClient.ts` mirrors it, and themed queries are ANDed with it
 * (`withPoolFilters`) — no X-cost spells (`-mana:{X}`), split cards, lands…
 *
 * Scryfall syntax reference: https://scryfall.com/docs/syntax
 */
export const SURVIVAL_SCRYFALL_QUERY =
  "is:default game:paper has:mana -is:funny -is:playtest -is:extras -is:digital -is:split -mana:{X} -t:dungeon -t:land -t:conspiracy not:extra not:token unique:cards";

/** How many cards to fetch per batch. */
export const SURVIVAL_BATCH_SIZE = 20;
