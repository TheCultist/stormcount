"use client";

import ScoreDisplay from "@/components/game/ScoreDisplay";
import GameOverScreen from "@/components/game/GameOverScreen";
import VersusArena from "@/components/game/VersusArena";
import { RulesPanel, ThemePanel, ThemeTitle, TieRulePill, type RuleEntry } from "@/components/game/GamePanels";
import { useGuessHotkeys } from "@/hooks/useGuessHotkeys";
import { useSurvivalGame } from "@/hooks/useSurvivalGame";
import { ROUTES } from "@/lib/constants";
import type { AffiliateConfig } from "@/lib/affiliate";

// ── Static rules data ─────────────────────────────────────────────────────

const RULES = [
  {
    num: "1",
    heading: "You see two cards",
    body: "One is face-up with its mana value showing — that's your Anchor. The other is face-down. That's your Mystery.",
  },
  {
    num: "2",
    heading: "Does the Mystery cost more or less?",
    body: "Your only job is to decide: is the Mystery card's mana value higher than (or equal to) the Anchor, or lower?",
  },
  {
    num: "3",
    heading: "Ties are fine — guess Higher",
    body: "If both cards share the same mana value, that counts as Higher or Equal. So when in doubt, go Higher.",
  },
  {
    num: "4",
    heading: "Get it wrong and it's over",
    body: "Each correct guess adds to your streak. Miss once and the run ends. No second chances — just try to beat your best.",
  },
] as const satisfies readonly RuleEntry[];

// ── Component ─────────────────────────────────────────────────────────────

export default function SurvivalGame({
  affiliateConfig,
  theme,
}: {
  affiliateConfig?: AffiliateConfig | null;
  /** Today's theme, when it applies to Survival (isDaily=false). */
  theme?: { name: string; description: string } | null;
}) {
  const {
    status,
    anchor,
    mystery,
    streak,
    personalBest,
    lastResult,
    isLoading,
    error,
    scoreUnsaved,
    scoreAutoSaved,
    start,
    guess,
    restart,
  } = useSurvivalGame();

  const isRevealed = status === "revealed";

  // Keyboard shortcuts — ↑/W = higher, ↓/S = lower.
  useGuessHotkeys(status === "playing", guess);

  // ── idle / loading ───────────────────────────────────────────────────────
  if (status === "idle" || isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-10 px-5 py-20">
        {error && (
          <p className="storm-mono text-sm text-red-400">
            {error} — check your connection and try again.
          </p>
        )}

        {/* Confirmation that a deferred score was recorded after signing in */}
        {scoreAutoSaved && (
          <div className="w-full rounded border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 text-center">
            <p className="text-[13px] leading-relaxed text-foreground/80">
              Welcome back! Your earlier run has been recorded to your account.
            </p>
          </div>
        )}

        {/* Theme header + info panel — only on themed days that reach Survival */}
        {theme && (
          <div className="flex w-full flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-2.5 text-center">
              <p className="eyebrow flex items-center gap-2.5">
                <span aria-hidden className="h-1 w-1 rotate-45 bg-brass-bright anim-pulse" />
                Today&apos;s Theme
              </p>
              <ThemeTitle>{theme.name}</ThemeTitle>
            </div>

            <ThemePanel description={theme.description} />
          </div>
        )}

        <RulesPanel rules={RULES} footerTone="muted" />

        {/* Start CTA */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={start}
            disabled={isLoading}
            className="btn-primary px-10 py-4 text-lg disabled:opacity-50"
          >
            {isLoading ? "Shuffling the deck…" : "Start Survival"}
          </button>
          {personalBest > 0 && (
            <p className="storm-mono text-[11px] uppercase tracking-[0.22em] text-muted/70">
              Personal best · {personalBest}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── game over ────────────────────────────────────────────────────────────
  if (status === "gameover") {
    return (
      <div className="flex flex-1 items-start justify-center px-5 py-10 sm:items-center sm:px-8 sm:py-14">
        <GameOverScreen
          score={streak}
          lastCard={mystery}
          affiliateConfig={affiliateConfig ?? null}
          onRestart={restart}
          scoreUnsaved={scoreUnsaved}
          signInRedirect={ROUTES.survival}
        />
      </div>
    );
  }

  // ── playing / revealed ───────────────────────────────────────────────────
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-5 py-4 sm:gap-5 sm:px-8 sm:py-5">
      {/* Header */}
      <header className="anim-fade-in flex items-start justify-between gap-4 sm:items-end">
        <div className="flex min-w-0 flex-col gap-2 sm:gap-2.5">
          <p className="eyebrow flex items-center gap-2.5">
            <span aria-hidden className="h-1 w-1 rotate-45 bg-moonsilver-bright anim-pulse" />
            Survival
            <span className="text-muted/60">·</span>
            <span className="storm-mono text-[10px] tracking-[0.22em] text-muted/80">
              endless
            </span>
          </p>
          <h1
            className="storm-display text-2xl font-extrabold leading-[0.95] tracking-[-0.02em] text-foreground sm:text-5xl"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
          >
            One wrong answer{" "}
            <span className="storm-display-italic font-semibold text-moonsilver-bright">
              ends the run
            </span>
          </h1>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <ScoreDisplay score={streak} label="Streak" />
          {personalBest > 0 && (
            <p className="storm-mono text-[10px] uppercase tracking-[0.2em] text-muted/60">
              best · {personalBest}
            </p>
          )}
        </div>
      </header>

      {/* Tie-rule hint */}
      <TieRulePill accent="moonsilver" className="self-start" />

      <VersusArena
        anchor={anchor}
        mystery={mystery}
        isRevealed={isRevealed}
        lastResult={lastResult}
        onGuess={guess}
        lowerAccent="moonsilver"
      />
    </div>
  );
}
