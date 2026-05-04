/**
 * Scryfall query for Survival mode.
 *
 * Edit THIS FILE to change the card pool for Survival mode.
 * The query is passed to the Scryfall search API with `order=random`.
 *
 * Scryfall syntax reference: https://scryfall.com/docs/syntax
 */
export const SURVIVAL_SCRYFALL_QUERY =
  "is:default -t:dungeon -t:land -t:conspiracy -is:unset -is:split not:extra not:token unique:cards game:paper";

/** How many cards to fetch per batch. */
export const SURVIVAL_BATCH_SIZE = 20;
