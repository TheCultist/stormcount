/**
 * Core game rule, shared by the client hooks and the server-side score replay
 * so they can never disagree.
 */
import type { GuessDirection, MtgCard } from "@/lib/types";

/** Ties count as "higher": a mystery card with equal mana value is a correct "higher" guess. */
export function isCorrectGuess(
  anchor: Pick<MtgCard, "cmc">,
  mystery: Pick<MtgCard, "cmc">,
  dir: GuessDirection,
): boolean {
  return dir === "higher" ? mystery.cmc >= anchor.cmc : mystery.cmc < anchor.cmc;
}

/** Per-guess correctness of a Daily run: guess `i` compares card `i` (anchor) with `i + 1`. */
export function scoreGuesses(
  cards: Pick<MtgCard, "cmc">[],
  guesses: GuessDirection[],
): boolean[] {
  return guesses
    .slice(0, Math.max(0, cards.length - 1))
    .map((dir, i) => isCorrectGuess(cards[i], cards[i + 1], dir));
}
