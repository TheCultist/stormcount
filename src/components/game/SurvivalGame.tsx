"use client";

import { useEffect } from "react";
import CardDisplay from "@/components/game/CardDisplay";
import ScoreDisplay from "@/components/game/ScoreDisplay";
import GameOverScreen from "@/components/game/GameOverScreen";
import { useSurvivalGame } from "@/hooks/useSurvivalGame";
import type { GuessDirection } from "@/lib/types";
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
] as const;

const SHORTCUTS = [
  { kbd: "↑ / W", label: "Higher or Equal" },
  { kbd: "↓ / S", label: "Lower" },
] as const;

// ── Component ─────────────────────────────────────────────────────────────

export default function SurvivalGame({
  affiliateConfig,
}: {
  affiliateConfig?: AffiliateConfig | null;
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
    start,
    guess,
    restart,
  } = useSurvivalGame();

  const isRevealed = status === "revealed";

  // Keyboard shortcuts — ↑/W = higher, ↓/S = lower.
  useEffect(() => {
    if (status !== "playing") return;
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") {
        e.preventDefault();
        guess("higher");
      } else if (k === "arrowdown" || k === "s") {
        e.preventDefault();
        guess("lower");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [status, guess]);

  // ── idle / loading ───────────────────────────────────────────────────────
  if (status === "idle" || isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-10 px-5 py-20">
        {error && (
          <p className="storm-mono text-sm text-red-400">
            {error} — check your connection and try again.
          </p>
        )}

        {/* Rules panel */}
        <article className="codex rim-brass anim-rise-in w-full rounded-md">
          {/* Panel header */}
          <header className="flex items-center gap-3 px-5 pt-5 pb-4">
            <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-brass-bright" />
            <p className="eyebrow text-[9px]">How to Play</p>
          </header>

          <span aria-hidden className="rule-brass mx-5 block h-px" />

          {/* Rule rows */}
          <ol className="flex flex-col gap-0 px-5 py-4">
            {RULES.map(({ num, heading, body }) => (
              <li key={num} className="flex gap-4 py-3 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-rule/30">
                <span
                  className="storm-display mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-brass/40 bg-paper-3/60 text-[10px] font-bold text-brass-bright"
                  aria-hidden
                >
                  {num}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span
                    className="storm-display text-[13px] font-semibold leading-snug text-foreground"
                    style={{ fontVariationSettings: '"opsz" 96, "SOFT" 30' }}
                  >
                    {heading}
                  </span>
                  <span className="storm-mono text-[11px] leading-relaxed text-foreground-muted">
                    {body}
                  </span>
                </div>
              </li>
            ))}
          </ol>

          <span aria-hidden className="rule-brass mx-5 block h-px" />

          {/* Keyboard shortcuts */}
          <footer className="flex items-center justify-between gap-4 px-5 py-4">
            <p className="storm-mono text-[9px] uppercase tracking-[0.22em] text-muted/70">
              Keyboard
            </p>
            <div className="flex items-center gap-4">
              {SHORTCUTS.map(({ kbd, label }) => (
                <span key={kbd} className="flex items-center gap-1.5">
                  <kbd className="storm-mono inline-flex items-center justify-center rounded-sm border border-rule/60 bg-background-deep/50 px-1.5 py-0.5 text-[10px] font-medium text-muted/80">
                    {kbd}
                  </kbd>
                  <span className="storm-mono text-[10px] text-foreground/60">{label}</span>
                </span>
              ))}
            </div>
          </footer>
        </article>

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
      <div className="flex flex-1 items-center justify-center py-16">
        <GameOverScreen
          mode="survival"
          score={streak}
          lastCard={mystery}
          affiliateConfig={affiliateConfig ?? null}
          onRestart={restart}
        />
      </div>
    );
  }

  // ── playing / revealed ───────────────────────────────────────────────────
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-5 py-4 sm:gap-5 sm:px-8 sm:py-5">
      {/* Header */}
      <header className="anim-fade-in flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-2.5">
          <p className="eyebrow flex items-center gap-2.5">
            <span aria-hidden className="h-1 w-1 rotate-45 bg-moonsilver-bright anim-pulse" />
            Survival
            <span className="text-muted/60">·</span>
            <span className="storm-mono text-[10px] tracking-[0.22em] text-muted/80">
              endless
            </span>
          </p>
          <h1
            className="storm-display text-4xl font-extrabold leading-[0.95] tracking-[-0.02em] text-foreground sm:text-5xl"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
          >
            One wrong answer{" "}
            <span className="storm-display-italic font-semibold text-moonsilver-bright">
              ends the run
            </span>
          </h1>
        </div>

        <div className="flex flex-col items-end gap-2">
          <ScoreDisplay score={streak} label="Streak" />
          {personalBest > 0 && (
            <p className="storm-mono text-[10px] uppercase tracking-[0.2em] text-muted/60">
              best · {personalBest}
            </p>
          )}
        </div>
      </header>

      {/* Tie-rule hint */}
      <p className="storm-mono inline-flex w-fit items-center gap-2.5 self-start border border-rule/40 bg-paper/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-foreground/70">
        <span aria-hidden className="h-1 w-1 rotate-45 bg-moonsilver" />
        Tie rule · equal mv counts as Higher or Equal
      </p>

      {/*
       * Versus arena + action buttons.
       *
       * Mobile  (flex-col): Anchor → [Higher | Lower row] → Mystery
       * Desktop (lg:flex-row): Anchor | [▲Higher / vs / ▼Lower col] | Mystery
       */}
      <section className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-center lg:gap-8">
        <CardDisplay card={anchor} mode="anchor" />

        {/* Connector column — houses action buttons on both breakpoints */}
        <div className="flex w-full flex-row gap-3 lg:w-auto lg:flex-col lg:items-center lg:gap-2">
          <ActionButton
            direction="higher"
            onClick={() => guess("higher")}
            disabled={isRevealed}
          />

          {/* vs badge + decorative lines — desktop only */}
          <div className="hidden lg:flex lg:flex-col lg:items-center lg:gap-1.5">
            <span
              aria-hidden
              className="h-8 w-px bg-gradient-to-b from-transparent via-brass/40 to-transparent"
            />
            <span
              className="storm-display relative flex h-12 w-12 items-center justify-center rounded-full border border-brass/50 bg-background-deep/70 text-[11px] font-extrabold uppercase tracking-[0.3em] text-brass-bright"
              style={{ fontVariationSettings: '"opsz" 96, "WONK" 1' }}
            >
              <span
                aria-hidden
                className="absolute inset-[-4px] rounded-full opacity-60 blur-md"
                style={{
                  background:
                    "radial-gradient(circle, rgba(232,193,129,0.4), transparent 70%)",
                }}
              />
              <span className="relative">vs</span>
            </span>
            <span
              aria-hidden
              className="h-8 w-px bg-gradient-to-b from-transparent via-moonsilver/40 to-transparent"
            />
          </div>

          <ActionButton
            direction="lower"
            onClick={() => guess("lower")}
            disabled={isRevealed}
          />
        </div>

        <CardDisplay
          card={mystery}
          mode={isRevealed ? "anchor" : "mystery"}
          result={isRevealed ? lastResult : null}
        />
      </section>
    </div>
  );
}

// ── ActionButton ─────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<
  GuessDirection,
  { glyph: string; labelFull: string; labelShort: string; kbd: string }
> = {
  higher: { glyph: "▲", labelFull: "Higher or Equal", labelShort: "Higher ≥", kbd: "↑" },
  lower:  { glyph: "▼", labelFull: "Lower",           labelShort: "Lower",    kbd: "↓" },
};

function ActionButton({
  direction,
  onClick,
  disabled,
}: {
  direction: GuessDirection;
  onClick: () => void;
  disabled?: boolean;
}) {
  const { glyph, labelFull, labelShort, kbd } = ACTION_CONFIG[direction];
  const isLower = direction === "lower";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={labelFull}
      className={`codex ${isLower ? "rim-moonsilver" : "rim-brass"} group relative isolate flex flex-1 items-center justify-center gap-3 overflow-hidden rounded-md px-4 py-4 transition-all duration-300 ease-out hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40 lg:w-48 lg:flex-none lg:justify-between lg:px-5 lg:py-3`}
    >
      {/* Hover wash */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: isLower
            ? "radial-gradient(ellipse at center, rgba(180,60,40,0.18), transparent 70%)"
            : "radial-gradient(ellipse at center, rgba(232,193,129,0.16), transparent 70%)",
        }}
      />

      {/* Glyph stamp */}
      <span
        aria-hidden
        className={`storm-display flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border text-sm transition-colors duration-300 ${
          isLower
            ? "border-moonsilver/40 bg-paper-3/60 text-moonsilver-bright group-hover:border-moonsilver-bright group-hover:text-moonsilver-bright"
            : "border-brass/40 bg-paper-3/60 text-brass-bright group-hover:border-brass-bright group-hover:text-brass-bright"
        }`}
      >
        {glyph}
      </span>

      {/* Label — short on mobile, full on desktop */}
      <span
        className={`storm-display text-[13px] font-semibold uppercase tracking-[0.14em] text-foreground transition-colors duration-300 lg:flex-1 ${
          isLower ? "group-hover:text-moonsilver-bright" : "group-hover:text-brass-bright"
        }`}
        style={{ fontVariationSettings: '"opsz" 96, "SOFT" 30' }}
      >
        <span className="lg:hidden">{labelShort}</span>
        <span className="hidden lg:inline">{labelFull}</span>
      </span>

      {/* Keyboard hint — desktop only */}
      <kbd
        aria-hidden
        className="storm-mono hidden items-center justify-center rounded-sm border border-rule/60 bg-background-deep/40 px-1.5 py-0.5 text-[10px] font-medium text-muted/80 lg:inline-flex"
      >
        {kbd}
      </kbd>
    </button>
  );
}
