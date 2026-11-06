# Roadmap

What I plan to work on next, roughly in this order. It will change as I go.

## Game history

Save every finished run, Daily and Survival, with each guess in it: the two cards, what the player picked and whether it was right. The profile page gets a history where you can open a run and look back at the cards you missed. Anonymous players keep theirs in localStorage. Right now the database only keeps the Daily score and time and the best Survival streak.

## Personal stats

Built on top of the history: accuracy by mana value, card type and color, the cards you miss most often, and a calendar of the days you played.

## Replay past Dailies

Play any past Daily from the leaderboard archive, without it counting for the leaderboard.

## New comparisons

Higher/lower on power, toughness, price or release year, using the same arena as the mana value game.

## Format pools

Survival runs limited to Commander-legal or Standard-legal cards.

## Tests and CI

The only automated check today is `npm run typecheck`. I want tests for the guess logic in `src/lib/game.ts`, the `r=` result string in share links, themed-day priority and daily seed generation, and a GitHub Action that runs them together with the typecheck.
