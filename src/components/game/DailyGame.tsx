"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import CardBuyRow from "@/components/affiliate/CardBuyRow";
import ScoreDisplay from "@/components/game/ScoreDisplay";
import ShareScore from "@/components/game/ShareScore";
import VersusArena from "@/components/game/VersusArena";
import { RulesPanel, ThemePanel, ThemeTitle, TieRulePill, type RuleEntry } from "@/components/game/GamePanels";
import { useDailyGame } from "@/hooks/useDailyGame";
import { useGuessHotkeys } from "@/hooks/useGuessHotkeys";
import { ROUTES } from "@/lib/constants";
import type { AffiliateConfig } from "@/lib/affiliate";
import type { MtgCard } from "@/lib/types";

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
] as const satisfies readonly RuleEntry[];

/** Buy links used when no affiliate config is supplied (matches the server default). */
const FALLBACK_BUY_LINKS = { cardTraderShareCode: "thecultist", tcgPlayerPartnerLink: null };

type BuyLinkConfig = Pick<AffiliateConfig, "cardTraderShareCode" | "tcgPlayerPartnerLink">;

// ── DailyCardsPanel ────────────────────────────────────────────────────────

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Zoom modal — shown when a card is clicked in the grid. */
function CardZoomModal({
  card,
  buyLinks,
  onClose,
}: {
  card: MtgCard;
  buyLinks: BuyLinkConfig;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Move focus into the dialog when it opens.
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Escape closes; Tab / Shift+Tab cycle within the dialog.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      const dialog = dialogRef.current;
      if (e.key !== "Tab" || !dialog) return;
      const items = dialog.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const outside = !dialog.contains(active);
      if (e.shiftKey && (active === first || outside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,9,8,0.82)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      {/* Modal card — stop propagation so clicks inside don't close */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={card.name}
        className="codex rim-brass relative flex max-h-[90dvh] w-full max-w-sm flex-col gap-4 overflow-y-auto rounded-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-sm border border-rule/50 bg-background-deep/60 text-[11px] text-foreground/60 transition-colors hover:border-brass/50 hover:text-brass-bright"
        >
          ✕
        </button>

        {/* Card image — full size */}
        <div className="overflow-hidden rounded-[6px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.image_uri}
            alt={card.name}
            width={223}
            height={310}
            className="w-full"
          />
        </div>

        {/* Card name */}
        <p
          className="storm-display text-center text-base font-semibold text-foreground"
          style={{ fontVariationSettings: '"opsz" 96, "SOFT" 30' }}
        >
          {card.name}
        </p>

        {/* Buy buttons */}
        <CardBuyRow cardName={card.name} setName={card.set_name} affiliateConfig={buyLinks} variant="compact" />
      </div>
    </div>
  );
}

/**
 * A single card in the reveal grid — thumbnail, name, and buy buttons.
 * Clicking the image opens the zoom modal.
 */
function DailyCardItem({
  card,
  affiliateConfig,
}: {
  card: MtgCard;
  affiliateConfig: AffiliateConfig | null;
}) {
  const [zoomed, setZoomed] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const buyLinks: BuyLinkConfig = affiliateConfig ?? FALLBACK_BUY_LINKS;

  // Return focus to the thumbnail that opened the modal.
  const closeZoom = useCallback(() => {
    setZoomed(false);
    triggerRef.current?.focus();
  }, []);

  return (
    <>
      <div className="flex flex-col gap-1.5">
        {/* Clickable card image */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setZoomed(true)}
          aria-label={`Zoom ${card.name}`}
          aria-haspopup="dialog"
          aria-expanded={zoomed}
          className="group block overflow-hidden rounded-[4px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.image_uri}
            alt={card.name}
            width={223}
            height={310}
            className="w-full transition-transform duration-200 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </button>

        {/* Card name */}
        <p className="storm-mono truncate text-center text-[9px] uppercase tracking-[0.14em] text-foreground/60">
          {card.name}
        </p>

        {/* Buy buttons */}
        <CardBuyRow cardName={card.name} setName={card.set_name} affiliateConfig={buyLinks} variant="compact" />
      </div>

      {zoomed && <CardZoomModal card={card} buyLinks={buyLinks} onClose={closeZoom} />}
    </>
  );
}

/**
 * Toggle button + expandable card grid for the daily end screen.
 * Replaces the old Scryfall batch links.
 */
function DailyCardsPanel({
  cards,
  affiliateConfig,
  open,
  onToggle,
}: {
  cards: MtgCard[];
  affiliateConfig: AffiliateConfig | null;
  open: boolean;
  onToggle: () => void;
}) {
  if (cards.length === 0) return null;

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="storm-mono flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-foreground/50 transition-colors hover:text-brass-bright"
      >
        <span
          aria-hidden
          className="inline-block transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▼
        </span>
        {open ? "Hide today's cards" : "View today's cards"}
      </button>

      {open && (
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {cards.map((card) => (
            <DailyCardItem key={card.id} card={card} affiliateConfig={affiliateConfig} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── DailyGame ─────────────────────────────────────────────────────────────

export default function DailyGame({
  affiliateConfig = null,
}: {
  affiliateConfig?: AffiliateConfig | null;
}) {
  const [cardsVisible, setCardsVisible] = useState(false);
  const {
    status,
    cards,
    practiceMode,
    scoreUnsaved,
    scoreAutoSaved,
    date,
    themed,
    themedDescription,
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
  useGuessHotkeys(status === "playing" || status === "idle", guess);

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
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-8 px-5 py-20">
        {/* Eyebrow + illuminated theme title */}
        <div className="flex flex-col items-center gap-2.5 text-center">
          <p className="eyebrow flex items-center gap-2.5">
            <span aria-hidden className="h-1 w-1 rotate-45 bg-brass-bright anim-pulse" />
            Daily Challenge
            <span className="text-foreground/40">·</span>
            <span className="storm-mono text-[10px] tracking-[0.22em] text-foreground/65">{date}</span>
          </p>
          {themed && <ThemeTitle>{themed}</ThemeTitle>}
        </div>

        {/* Theme info panel — mirrors the How-to-Play codex panel */}
        {themed && themedDescription && <ThemePanel description={themedDescription} />}

        <RulesPanel rules={RULES} />

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
      <div className={`flex flex-1 flex-col items-center gap-8 px-5 py-20 ${cardsVisible ? "" : "justify-center"}`}>
        <div className="flex w-full max-w-lg flex-col items-center gap-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="eyebrow flex items-center gap-2.5">
            <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-brass" />
            Daily Challenge
            <span className="text-foreground/40">·</span>
            <span className="storm-mono text-[10px] tracking-[0.22em] text-foreground/65">{date}</span>
          </p>
          <h1
            className="storm-display font-extrabold leading-[0.95] text-foreground"
            style={{
              fontSize: "clamp(2.2rem, 8vw, 3.5rem)",
              fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1',
              letterSpacing: "-0.02em",
            }}
          >
            Already played today
          </h1>
          <p className="storm-display-italic text-base leading-relaxed text-foreground/65">
            Come back tomorrow for a fresh challenge.
          </p>
        </div>

        {/* Practice warning */}
        <div className="w-full rounded border border-rule/30 bg-background-deep/60 px-5 py-4">
          <p className="storm-mono text-[12px] leading-relaxed text-foreground/65">
            <span className="mr-2" style={{ color: "var(--brass)" }}>ⓘ</span>
            Playing again is for practice only. Your score will{" "}
            <strong className="font-semibold text-foreground/90">not</strong> be recorded on the leaderboard.
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
          className="storm-mono text-[11px] uppercase tracking-[0.18em] text-foreground/55 transition-colors hover:text-foreground"
        >
          View today&apos;s leaderboard →
        </Link>
        </div>

        {/* Card reveal panel — outside the max-w-lg column so the grid can go full-width */}
        {cards.length > 0 && (
          <div className="mx-auto w-full max-w-6xl">
            <DailyCardsPanel
              cards={cards}
              affiliateConfig={affiliateConfig}
              open={cardsVisible}
              onToggle={() => setCardsVisible((v) => !v)}
            />
          </div>
        )}
      </div>
    );
  }

  // ── done / submitting ─────────────────────────────────────────────────────
  if (status === "done" || status === "submitting") {
    return (
      <div className={`flex flex-1 flex-col gap-10 px-5 py-16 ${cardsVisible ? "items-center" : "items-center justify-center"}`}>
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

            {/* Share — once the run is final, not while submitting */}
            {status === "done" && (
              <ShareScore mode="daily" score={score} totalRounds={totalRounds} date={date} />
            )}

            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              {!practiceMode && !scoreUnsaved ? (
                <Link href={ROUTES.leaderboard} className="btn-primary">
                  See leaderboard
                </Link>
              ) : !scoreUnsaved ? (
                <Link href={ROUTES.leaderboard} className="btn-ghost">
                  Leaderboard
                </Link>
              ) : null}
              <Link href={ROUTES.survival} className="btn-ghost">
                Play Survival
              </Link>
            </div>

          </div>
        </section>

        {/* Card reveal panel — outside the score card so the grid can go full-width */}
        {cards.length > 0 && (
          <div className="mx-auto w-full max-w-6xl">
            <DailyCardsPanel
              cards={cards}
              affiliateConfig={affiliateConfig}
              open={cardsVisible}
              onToggle={() => setCardsVisible((v) => !v)}
            />
          </div>
        )}
      </div>
    );
  }

  // ── playing / idle / revealed ─────────────────────────────────────────────
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-5 py-4 sm:gap-5 sm:px-8 sm:py-5">
      {/* Header */}
      <header className="anim-fade-in flex items-start justify-between gap-4 sm:items-end">
        <div className="flex min-w-0 flex-col gap-2 sm:gap-2.5">
          <p className="eyebrow flex flex-wrap items-center gap-x-2.5 gap-y-1">
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
            className="storm-display text-2xl font-extrabold leading-[0.95] tracking-[-0.02em] text-foreground sm:text-5xl"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
          >
            Higher{" "}
            <span className="storm-display-italic font-semibold text-muted/50">or</span>{" "}
            <span className="text-brass-bright">Lower</span>
          </h1>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
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

      {/* Tie-rule hint + contextual status notice (same flex slot, no extra gap) */}
      <div className="flex flex-col gap-1.5 self-start">
        <TieRulePill />
        {status === "idle" && practiceMode && (
          <p className="storm-mono text-[10px] uppercase tracking-[0.18em] text-foreground/50 anim-fade-in">
            Practice mode · score won&apos;t be recorded
          </p>
        )}
        {status === "idle" && !practiceMode && (
          <p className="storm-mono text-[10px] uppercase tracking-[0.18em] text-foreground/50 anim-fade-in">
            Make your first guess to start the timer
          </p>
        )}
        {(status === "playing" || status === "revealed") && !practiceMode && (
          <p className="storm-mono inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-foreground/45 anim-fade-in">
            <span aria-hidden className="text-[9px]">ⓘ</span>
            Leaving this page will submit your current score
          </p>
        )}
      </div>

      {/* Versus arena — mobile: cards side by side, buttons beneath; lg: row */}
      <VersusArena
        anchor={anchor}
        mystery={mystery}
        isRevealed={isRevealed}
        lastResult={lastResult}
        onGuess={guess}
      />
    </div>
  );
}
