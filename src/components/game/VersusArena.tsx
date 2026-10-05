import CardDisplay from "@/components/game/CardDisplay";
import ActionButton, { type GameAccent } from "@/components/game/ActionButton";
import type { GuessDirection, GuessResult, MtgCard } from "@/lib/types";

/** Decorative "vs" medallion with vertical rules — desktop only. */
function VsBadge() {
  return (
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
  );
}

/**
 * Versus arena + action buttons.
 *
 * Mobile  (grid): Anchor | Mystery side by side → [Higher | Lower row]
 * Desktop (lg:flex-row): Anchor | [▲Higher / vs / ▼Lower col] | Mystery
 */
export default function VersusArena({
  anchor,
  mystery,
  isRevealed,
  lastResult,
  onGuess,
  lowerAccent = "brass",
}: {
  anchor: MtgCard | null;
  mystery: MtgCard | null;
  isRevealed: boolean;
  lastResult: GuessResult | null;
  onGuess: (dir: GuessDirection) => void;
  /** Accent of the Lower button (Higher is always brass). */
  lowerAccent?: GameAccent;
}) {
  return (
    <section className="grid grid-cols-2 items-start justify-items-center gap-3 lg:flex lg:items-center lg:justify-center lg:gap-8">
      <CardDisplay card={anchor} mode="anchor" />

      {/* Connector column — houses action buttons on both breakpoints.
          order-2 sends it below both cards in the mobile grid. */}
      <div className="order-2 col-span-2 flex w-full flex-row gap-3 lg:order-none lg:w-auto lg:flex-col lg:items-center lg:gap-2">
        <ActionButton direction="higher" onClick={() => onGuess("higher")} disabled={isRevealed} />
        <VsBadge />
        <ActionButton
          direction="lower"
          accent={lowerAccent}
          onClick={() => onGuess("lower")}
          disabled={isRevealed}
        />
      </div>

      <CardDisplay
        card={mystery}
        mode={isRevealed ? "anchor" : "mystery"}
        result={isRevealed ? lastResult : null}
      />
    </section>
  );
}
