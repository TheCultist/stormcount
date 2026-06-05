import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import type { GameMode, MtgCard } from "@/lib/types";
import type { AffiliateConfig } from "@/lib/affiliate";
import CardBuyRow from "@/components/affiliate/CardBuyRow";
import CavernHoldBanner from "@/components/affiliate/CavernHoldBanner";

type GameOverScreenProps = {
  mode: GameMode;
  score: number;
  elapsed_ms?: number;
  onRestart?: () => void;
  /** Survival: the last card revealed — shown with buy links after the run. */
  lastCard?: MtgCard | null;
  /** Affiliate config passed from the server page. Null = suppress monetisation. */
  affiliateConfig?: AffiliateConfig | null;
  /** Run finished while signed out — show a prompt to sign in and record it. */
  scoreUnsaved?: boolean;
  /** Where to return after signing in (so the deferred score auto-submits). */
  signInRedirect?: string;
};

export default function GameOverScreen({
  mode,
  score,
  elapsed_ms,
  onRestart,
  lastCard,
  affiliateConfig,
  scoreUnsaved = false,
  signInRedirect,
}: GameOverScreenProps) {
  const isDaily = mode === "daily";
  const showAffiliate = mode === "survival" && affiliateConfig != null;
  const showCard = showAffiliate && lastCard != null;

  return (
    <section className="relative mx-auto w-full max-w-3xl">
      {/* Warm halo */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 rounded-md opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(232,193,129,0.16), transparent 65%)",
          filter: "blur(32px)",
        }}
      />

      {/* ── Two-column when card is present, single column otherwise ──── */}
      <div
        className={`flex gap-5 ${
          showCard
            ? "flex-col items-start sm:flex-row sm:items-stretch sm:gap-7"
            : "flex-col items-center"
        }`}
      >
        {/* ── Left: Card preview (survival only) ───────────────────────── */}
        {showCard && (
          <div className="w-full sm:w-72 sm:shrink-0">
            <CardPreview card={lastCard} />
          </div>
        )}

        {/* ── Right: Score card + buy row ───────────────────────────────── */}
        <div className={`flex flex-1 flex-col gap-4 ${showCard ? "w-full" : "w-full max-w-md"}`}>

          {/* Score card */}
          <div className="codex rim-brass anim-rise-in flex w-full flex-col items-center gap-5 rounded-md p-7 text-center">
            <p className="eyebrow text-brass-bright">Run complete</p>

            <h2
              className="storm-display text-4xl font-extrabold leading-none tracking-[-0.02em] text-foreground"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
            >
              Game over
            </h2>

            <span aria-hidden className="rule-brass max-w-[8rem]" />

            {/* Score */}
            <div className="flex flex-col items-center gap-1.5">
              <span className="eyebrow text-[10px] text-muted">Storm count</span>
              <span
                className="storm-mono text-6xl font-extrabold tabular-nums text-brass-bright anim-ink-bleed"
                style={{
                  textShadow:
                    "0 0 32px rgba(232,193,129,0.5), 0 0 64px rgba(232,193,129,0.22)",
                }}
              >
                {score}
              </span>
            </div>

            {/* Metadata stamps */}
            <div className="storm-mono flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[10px] uppercase tracking-[0.22em] text-muted">
              <span className="border border-rule/50 bg-background-deep/30 px-2.5 py-1">
                mode · {mode}
              </span>
              {typeof elapsed_ms === "number" ? (
                <span className="border border-rule/50 bg-background-deep/30 px-2.5 py-1">
                  time · {(elapsed_ms / 1000).toFixed(2)}s
                </span>
              ) : null}
              {scoreUnsaved && (
                <span className="border border-crimson/40 bg-crimson/10 px-2.5 py-1 text-crimson-bright">
                  not saved · sign in required
                </span>
              )}
            </div>

            {/* Sign-in prompt when the score couldn't be saved */}
            {scoreUnsaved && (
              <div className="w-full rounded border border-brass/25 bg-paper-2/30 px-4 py-3 text-center">
                <p className="text-[13px] leading-relaxed text-foreground/80">
                  Great run! Sign in to record your score for your account.
                </p>
                <p className="mt-1 text-[11px] text-foreground/50">
                  Your score is preserved — it will be submitted automatically when you return after signing in.
                </p>
                <Link
                  href={`${ROUTES.signIn}?redirect_url=${encodeURIComponent(signInRedirect ?? ROUTES.survival)}`}
                  className="btn-primary mt-3 inline-block"
                >
                  Sign in / Create account
                </Link>
              </div>
            )}

            {/* Actions */}
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              {onRestart ? (
                <button type="button" onClick={onRestart} className="btn-primary">
                  Play again
                </button>
              ) : null}
              <Link
                href={isDaily ? ROUTES.leaderboard : ROUTES.home}
                className="btn-ghost"
              >
                {isDaily ? "Leaderboard" : "Home"}
              </Link>
            </div>
          </div>

          {/* Buy row — survival only */}
          {showAffiliate ? (
            <div
              className="anim-fade-in w-full"
              style={{ animationDelay: "100ms" }}
            >
              <CardBuyRow
                cardName={lastCard!.name}
                setName={lastCard!.set_name}
                affiliateConfig={affiliateConfig}
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* ── CavernHold banner — full width beneath both columns ────────── */}
      {showAffiliate ? (
        <div
          className="anim-fade-in mt-3 w-full"
          style={{ animationDelay: "200ms" }}
        >
          <CavernHoldBanner
            href={affiliateConfig!.cavernholdUrl}
            copy={`${score} spells deep. Your collection deserves a worthy home.`}
          />
        </div>
      ) : null}
    </section>
  );
}

// ── Card preview ─────────────────────────────────────────────────────────────

/**
 * Compact card panel for the game-over screen.
 * Shows the card image, name, type line, and CMC — no game-specific state.
 */
function CardPreview({ card }: { card: MtgCard }) {
  return (
    // On sm+: h-full works because items-stretch gives the flex item a computed height.
    // On mobile: natural flow, image falls back to aspect-ratio sizing.
    <div className="relative sm:h-full">
      {/* Soft art-window halo */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-3 -z-10 rounded-md opacity-50"
        style={{
          background: "var(--grad-card-bg-anchor)",
          filter: "blur(24px)",
        }}
      />

      <article className="codex rim-brass anim-rise-in flex flex-col overflow-hidden rounded-md sm:h-full">
        {/* Name + CMC header */}
        <header className="flex shrink-0 items-center justify-between gap-2 px-3 pb-2 pt-3">
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-[8px] text-brass">Final card</p>
            <h3
              className="storm-display mt-0.5 truncate text-[13px] font-semibold leading-tight text-foreground"
              style={{ fontVariationSettings: '"opsz" 96, "SOFT" 30' }}
            >
              {card.name}
            </h3>
            {card.type_line ? (
              <p className="storm-mono mt-0.5 truncate text-[9px] uppercase tracking-[0.16em] text-muted/70">
                {card.type_line}
              </p>
            ) : null}
          </div>
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brass"
            aria-label={`Mana value ${card.cmc}`}
          >
            <span
              className="storm-display text-sm font-extrabold leading-none text-white"
              style={{ fontVariationSettings: '"opsz" 96, "WONK" 0' }}
            >
              {card.cmc}
            </span>
          </div>
        </header>

        {/*
          Art window.
          Mobile  → aspect-[5/7]: natural card proportions, always visible.
          Desktop → sm:aspect-auto sm:flex-1: fills remaining height of the
                    stretched flex item, keeping perfect alignment with the
                    right column.
        */}
        <div
          className="relative mx-2 mb-2 aspect-[5/7] overflow-hidden rounded-sm sm:aspect-auto sm:min-h-0 sm:flex-1"
          style={{
            border: "1px solid var(--border-art-window)",
            boxShadow:
              "0 1px 0 rgba(237,228,207,0.04) inset, 0 8px 16px -10px rgba(0,0,0,0.6) inset",
          }}
        >
          <div
            className="absolute inset-0"
            style={{ background: "var(--bg-art-fallback)" }}
          />
          {card.image_uri ? (
              <Image
              src={card.image_uri}
              alt={card.name}
              fill
              sizes="(max-width: 640px) 90vw, 288px"
              className="object-contain"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="storm-display-italic text-[11px] text-muted/50">
                —
              </span>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
