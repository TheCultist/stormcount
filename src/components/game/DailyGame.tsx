"use client";

import { useEffect } from "react";
import Link from "next/link";
import CardDisplay from "@/components/game/CardDisplay";
import ScoreDisplay from "@/components/game/ScoreDisplay";
import { useDailyGame } from "@/hooks/useDailyGame";
import { ROUTES } from "@/lib/constants";
import type { GuessDirection } from "@/lib/types";

// ── helpers ────────────────────────────────────────────────────────────────

function formatTime(ms: number): string {
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60);
  const s = (totalSec % 60).toFixed(2);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ── Rules data (daily-specific) ────────────────────────────────────────────

const RULES = [
  {
    num: "1",
    heading: "You see two cards",
    body: "One is face-up with its mana value visible — that's your Anchor. The other is hidden. That's your Mystery card.",
  },
  {
    num: "2",
    heading: "Higher, Equal, or Lower?",
    body: "Decide if the Mystery card's mana value is higher than (or equal to) the Anchor — or strictly lower.",
  },
  {
    num: "3",
    heading: "Ties count as Higher",
    body: "If both cards share the same mana value, that's Higher or Equal. When in doubt, go Higher.",
  },
  {
    num: "4",
    heading: "50 pairs — no elimination",
    body: "Unlike Survival, wrong answers don't end your run. You play all 50 pairs and your score is how many you got right.",
  },
] as const;

const SHORTCUTS = [
  { kbd: "↑ / W", label: "Higher or Equal" },
  { kbd: "↓ / S", label: "Lower" },
] as const;

// ── ActionButton ───────────────────────────────────────────────────────────

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
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={labelFull}
      className="codex rim-brass group relative isolate flex flex-1 items-center justify-center gap-3 overflow-hidden rounded-md px-4 py-4 transition-all duration-300 ease-out hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40 lg:w-48 lg:flex-none lg:justify-between lg:px-5 lg:py-3"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(ellipse at center, rgba(232,193,129,0.16), transparent 70%)" }}
      />
      <span
        aria-hidden
        className="storm-display flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-brass/40 bg-paper-3/60 text-sm text-brass-bright transition-colors duration-300 group-hover:border-brass-bright group-hover:text-brass-bright"
      >
        {glyph}
      </span>
      <span
        className="storm-display text-[13px] font-semibold uppercase tracking-[0.14em] text-foreground transition-colors duration-300 group-hover:text-brass-bright lg:flex-1"
        style={{ fontVariationSettings: '"opsz" 96, "SOFT" 30' }}
      >
        <span className="lg:hidden">{labelShort}</span>
        <span className="hidden lg:inline">{labelFull}</span>
      </span>
      <kbd
        aria-hidden
        className="storm-mono hidden items-center justify-center rounded-sm border border-rule/60 bg-background-deep/40 px-1.5 py-0.5 text-[10px] font-medium text-muted/80 lg:inline-flex"
      >
        {kbd}
      </kbd>
    </button>
  );
}

// ── RulesPanel (shared by pregame + gate) ──────────────────────────────────

function RulesPanel() {
  return (
    <article className="codex rim-brass anim-rise-in w-full rounded-md">
      <header className="flex items-center gap-3 px-5 pt-5 pb-4">
        <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-brass-bright" />
        <p className="eyebrow text-[9px]">How to Play</p>
      </header>
      <span aria-hidden className="rule-brass mx-5 block h-px" />
      <ol className="flex flex-col gap-0 px-5 py-4">
        {RULES.map(({ num, heading, body }) => (
          <li
            key={num}
            className="flex gap-4 py-3 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-rule/30"
          >
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
      <footer className="flex items-center justify-between gap-4 px-5 py-4">
        <p className="storm-mono text-[9px] uppercase tracking-[0.22em] text-foreground/55">Keyboard</p>
        <div className="flex items-center gap-4">
          {SHORTCUTS.map(({ kbd, label }) => (
            <span key={kbd} className="flex items-center gap-1.5">
              <kbd className="storm-mono inline-flex items-center justify-center rounded-sm border border-rule/60 bg-background-deep/50 px-1.5 py-0.5 text-[10px] font-medium text-muted/80">
                {kbd}
              </kbd>
              <span className="storm-mono text-[10px] text-foreground/70">{label}</span>
            </span>
          ))}
        </div>
      </footer>
    </article>
  );
}

// ── DailyGame ─────────────────────────────────────────────────────────────

export default function DailyGame() {
  const {
    status,
    practiceMode,
    scoreUnsaved,
    scoreAutoSaved,
    date,
    themed,
    anchor,
    mystery,
    round,
    totalRounds,
    score,
    lastResult,
    elapsedMs,
    rank,
    error,
    startGame,
    startPractice,
    guess,
  } = useDailyGame();

  const isRevealed = status === "revealed";

  // Keyboard shortcuts — only active while playing.
  useEffect(() => {
    if (status !== "playing" && status !== "idle") return;
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") { e.preventDefault(); guess("higher"); }
      else if (k === "arrowdown" || k === "s") { e.preventDefault(); guess("lower"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [status, guess]);

  // ── loading ───────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <p className="storm-mono text-sm uppercase tracking-[0.22em] text-muted/70 anim-pulse">
          Drawing today&apos;s hand…
        </p>
      </div>
    );
  }

  // ── error ─────────────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="codex rim-brass flex flex-col items-center gap-4 rounded-md p-10 text-center">
          <p className="eyebrow text-red-400">Connection error</p>
          <p className="storm-mono text-sm text-foreground-muted">{error}</p>
          <button type="button" onClick={() => window.location.reload()} className="btn-primary mt-2">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── pregame — first play of the day: show rules ───────────────────────────
  if (status === "pregame") {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-10 px-5 py-20">
        {/* Date + theme badge */}
        <div className="flex flex-col items-center gap-2">
          <p className="eyebrow flex items-center gap-2.5">
            <span aria-hidden className="h-1 w-1 rotate-45 bg-brass-bright anim-pulse" />
            Daily Challenge
            <span className="text-foreground/40">·</span>
            <span className="storm-mono text-[10px] tracking-[0.22em] text-foreground/65">{date}</span>
            {themed && (
              <>
                <span className="text-foreground/40">·</span>
                <span className="storm-mono text-[10px] tracking-[0.18em] text-brass-bright/80">{themed}</span>
              </>
            )}
          </p>
        </div>

        <RulesPanel />

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={startGame}
            className="btn-primary px-10 py-4 text-lg"
          >
            Start Daily Challenge
          </button>
          <p className="storm-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">
            Score locks in when you finish or leave the page
          </p>
        </div>
      </div>
    );
  }

  // ── gate — already played today ───────────────────────────────────────────
  if (status === "gate") {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-8 px-5 py-20">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="eyebrow flex items-center gap-2.5">
            <span aria-hidden className="h-1 w-1 rotate-45 bg-brass-bright" />
            Daily Challenge
            <span className="text-foreground/40">·</span>
            <span className="storm-mono text-[10px] tracking-[0.22em] text-foreground/65">{date}</span>
          </p>
          <h1
            className="storm-display text-4xl font-extrabold leading-[0.95] tracking-[-0.02em] text-foreground"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
          >
            Already played today
          </h1>
          <p className="storm-display-italic text-base leading-relaxed text-foreground/70">
            Come back tomorrow for a fresh challenge.
          </p>
        </div>

        {/* Practice warning */}
        <div className="w-full rounded-md border border-rule/40 bg-background-deep/50 px-5 py-4">
          <p className="storm-mono text-[11px] leading-relaxed text-foreground/60">
            <span className="mr-2 text-brass-bright">ⓘ</span>
            Playing again is for practice only. Your score will{" "}
            <span className="text-foreground/90">not</span> be recorded on the leaderboard.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={startPractice}
            className="btn-primary flex-1"
          >
            Play for Practice
          </button>
          <Link href={ROUTES.survival} className="btn-ghost flex-1 text-center">
            Play Survival
          </Link>
        </div>

        {/* Leaderboard link */}
        <Link
          href={ROUTES.leaderboard}
          className="storm-mono text-[11px] uppercase tracking-[0.2em] text-foreground/55 underline-offset-4 hover:text-brass-bright hover:underline transition-colors"
        >
          View today&apos;s leaderboard →
        </Link>
      </div>
    );
  }

  // ── done / submitting ─────────────────────────────────────────────────────
  if (status === "done" || status === "submitting") {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <section className="relative mx-auto w-full max-w-md">
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-6 -z-10 rounded-md opacity-80"
            style={{
              background: "radial-gradient(ellipse at 50% 30%, rgba(232,193,129,0.18), transparent 65%)",
              filter: "blur(28px)",
            }}
          />
          <div className="codex rim-brass anim-rise-in flex flex-col items-center gap-6 rounded-md p-10 text-center">
            <p className="eyebrow text-brass-bright">
              {practiceMode ? "Practice complete" : scoreAutoSaved ? "Score saved" : "Daily complete"}
            </p>
            <h2
              className="storm-display text-4xl font-extrabold leading-none tracking-[-0.02em] text-foreground"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
            >
              {status === "submitting" ? "Submitting…" : "Storm counted"}
            </h2>

            <span aria-hidden className="rule-brass max-w-[8rem]" />

            <div className="my-2 flex flex-col items-center gap-2">
              <span className="eyebrow text-[10px] text-muted">Score</span>
              <span
                className="storm-mono text-7xl font-extrabold tabular-nums text-brass-bright anim-ink-bleed"
                style={{ textShadow: "0 0 32px rgba(232,193,129,0.5), 0 0 64px rgba(232,193,129,0.22)" }}
              >
                {score}
              </span>
              <span className="storm-mono text-[11px] text-foreground/60">/ {totalRounds}</span>
            </div>

            <div className="storm-mono flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[10px] uppercase tracking-[0.22em] text-muted">
              <span className="border border-rule/50 bg-background-deep/30 px-2.5 py-1">{date}</span>
              {elapsedMs > 0 && (
                <span className="border border-rule/50 bg-background-deep/30 px-2.5 py-1">
                  {formatTime(elapsedMs)}
                </span>
              )}
              {rank !== null && !practiceMode && !scoreUnsaved && (
                <span className="border border-brass/40 bg-background-deep/30 px-2.5 py-1 text-brass-bright">
                  rank #{rank}
                </span>
              )}
              {practiceMode && (
                <span className="border border-rule/40 bg-background-deep/30 px-2.5 py-1 text-foreground/50">
                  practice · not recorded
                </span>
              )}
              {scoreAutoSaved && (
                <span className="border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-emerald-400">
                  score saved ✓
                </span>
              )}
              {scoreUnsaved && (
                <span className="border border-crimson/40 bg-crimson/10 px-2.5 py-1 text-crimson-bright">
                  not saved · sign in required
                </span>
              )}
            </div>

            {/* Auto-saved confirmation banner */}
            {scoreAutoSaved && (
              <div className="w-full rounded border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 text-center">
                <p className="text-[13px] leading-relaxed text-foreground/80">
                  Welcome back! Your score from earlier has been saved to the leaderboard.
                </p>
              </div>
            )}

            {/* Sign-in prompt when the score couldn't be saved */}
            {scoreUnsaved && (
              <div className="w-full rounded border border-brass/25 bg-paper-2/30 px-4 py-3 text-center">
                <p className="text-[13px] leading-relaxed text-foreground/80">
                  Great run! Sign in to save your score to the leaderboard.
                </p>
                <p className="mt-1 text-[11px] text-foreground/50">
                  Your score is preserved — it will be submitted automatically when you return after signing in.
                </p>
                <Link
                  href={`${ROUTES.signIn}?redirect_url=/daily`}
                  className="btn-primary mt-3 inline-block"
                >
                  Sign in / Create account
                </Link>
              </div>
            )}

            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              {!practiceMode && !scoreUnsaved ? (
                <Link href={date ? ROUTES.leaderboardDate(date) : ROUTES.leaderboard} className="btn-primary">
                  See leaderboard
                </Link>
              ) : !scoreUnsaved ? (
                <Link href={date ? ROUTES.leaderboardDate(date) : ROUTES.leaderboard} className="btn-ghost">
                  Leaderboard
                </Link>
              ) : null}
              <Link href={ROUTES.survival} className="btn-ghost">
                Play Survival
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ── playing / idle / revealed ─────────────────────────────────────────────
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-5 py-12 sm:px-8 sm:py-16">
      {/* Header */}
      <header className="anim-fade-in flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-2.5">
          <p className="eyebrow flex items-center gap-2.5">
            <span aria-hidden className="h-1 w-1 rotate-45 bg-brass-bright anim-pulse" />
            {practiceMode ? (
              <span className="text-foreground/60">Practice</span>
            ) : (
              "Daily Challenge"
            )}
            <span className="text-foreground/40">·</span>
            <span className="storm-mono text-[10px] tracking-[0.22em] text-foreground/65">{date}</span>
            {themed && (
              <>
                <span className="text-foreground/40">·</span>
                <span className="storm-mono text-[10px] tracking-[0.18em] text-brass-bright/80">{themed}</span>
              </>
            )}
          </p>
          <h1
            className="storm-display text-4xl font-extrabold leading-[0.95] tracking-[-0.02em] text-foreground sm:text-5xl"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
          >
            Higher{" "}
            <span className="storm-display-italic font-semibold text-muted/50">or</span>{" "}
            <span className="text-brass-bright">Lower</span>
          </h1>
        </div>

        <div className="flex flex-col items-end gap-2">
          <ScoreDisplay score={score} total={totalRounds} />
          <p className="storm-mono text-[10px] uppercase tracking-[0.2em] text-foreground/65">
            round {round + 1} of {totalRounds}
          </p>
          {(status === "playing" || status === "revealed") && (
            <p className="storm-mono text-[13px] tabular-nums text-foreground/80">
              {formatTime(elapsedMs)}
            </p>
          )}
        </div>
      </header>

      {/* Tie-rule hint */}
      <p className="storm-mono inline-flex w-fit items-center gap-2.5 self-start border border-rule/40 bg-paper/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-foreground/80">
        <span aria-hidden className="h-1 w-1 rotate-45 bg-brass-bright" />
        Tie rule · equal mv counts as Higher or Equal
      </p>

      {/* Versus arena */}
      <section className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-center lg:gap-8">
        <CardDisplay card={anchor} mode="anchor" />

        <div className="flex w-full flex-row gap-3 lg:w-auto lg:flex-col lg:items-center lg:gap-2">
          <ActionButton direction="higher" onClick={() => guess("higher")} disabled={isRevealed} />

          <div className="hidden lg:flex lg:flex-col lg:items-center lg:gap-1.5">
            <span aria-hidden className="h-8 w-px bg-gradient-to-b from-transparent via-brass/40 to-transparent" />
            <span
              className="storm-display relative flex h-12 w-12 items-center justify-center rounded-full border border-brass/50 bg-background-deep/70 text-[11px] font-extrabold uppercase tracking-[0.3em] text-brass-bright"
              style={{ fontVariationSettings: '"opsz" 96, "WONK" 1' }}
            >
              <span
                aria-hidden
                className="absolute inset-[-4px] rounded-full opacity-60 blur-md"
                style={{ background: "radial-gradient(circle, rgba(232,193,129,0.4), transparent 70%)" }}
              />
              <span className="relative">vs</span>
            </span>
            <span aria-hidden className="h-8 w-px bg-gradient-to-b from-transparent via-moonsilver/40 to-transparent" />
          </div>

          <ActionButton direction="lower" onClick={() => guess("lower")} disabled={isRevealed} />
        </div>

        <CardDisplay
          card={mystery}
          mode={isRevealed ? "anchor" : "mystery"}
          result={isRevealed ? lastResult : null}
        />
      </section>

      {/* First-guess prompt (idle state) */}
      {status === "idle" && (
        <p className="storm-mono text-center text-[11px] uppercase tracking-[0.22em] text-foreground/60 anim-fade-in">
          {practiceMode
            ? "Practice mode · score won't be recorded"
            : "Make your first guess to start the timer"}
        </p>
      )}

      {/* Auto-submit notice */}
      {(status === "playing" || status === "revealed") && !practiceMode && (
        <p className="storm-mono mx-auto flex w-fit items-center gap-2 text-center text-[10px] uppercase tracking-[0.18em] text-foreground/50 anim-fade-in">
          <span aria-hidden className="text-[9px]">ⓘ</span>
          Leaving this page will submit your current score
        </p>
      )}
    </div>
  );
}
