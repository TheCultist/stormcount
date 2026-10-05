import type { GuessDirection } from "@/lib/types";

/** Rim/hover accent family used by the guess buttons and tie-rule pill. */
export type GameAccent = "brass" | "moonsilver";

const ACTION_CONFIG: Record<
  GuessDirection,
  { glyph: string; labelFull: string; labelShort: string; kbd: string }
> = {
  higher: { glyph: "▲", labelFull: "Higher or Equal", labelShort: "Higher ≥", kbd: "↑" },
  lower:  { glyph: "▼", labelFull: "Lower",           labelShort: "Lower",    kbd: "↓" },
};

const ACCENT_STYLES: Record<
  GameAccent,
  { rim: string; wash: string; glyph: string; labelHover: string }
> = {
  brass: {
    rim: "rim-brass",
    wash: "radial-gradient(ellipse at center, rgba(232,193,129,0.16), transparent 70%)",
    glyph: "border-brass/40 bg-paper-3/60 text-brass-bright group-hover:border-brass-bright group-hover:text-brass-bright",
    labelHover: "group-hover:text-brass-bright",
  },
  moonsilver: {
    rim: "rim-moonsilver",
    wash: "radial-gradient(ellipse at center, rgba(180,60,40,0.18), transparent 70%)",
    glyph: "border-moonsilver/40 bg-paper-3/60 text-moonsilver-bright group-hover:border-moonsilver-bright group-hover:text-moonsilver-bright",
    labelHover: "group-hover:text-moonsilver-bright",
  },
};

/** Higher / Lower guess button — glyph stamp, responsive label, desktop kbd hint. */
export default function ActionButton({
  direction,
  accent = "brass",
  onClick,
  disabled,
}: {
  direction: GuessDirection;
  accent?: GameAccent;
  onClick: () => void;
  disabled?: boolean;
}) {
  const { glyph, labelFull, labelShort, kbd } = ACTION_CONFIG[direction];
  const styles = ACCENT_STYLES[accent];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={labelFull}
      className={`codex ${styles.rim} group relative isolate flex flex-1 items-center justify-center gap-3 overflow-hidden rounded-md px-4 py-4 transition-all duration-300 ease-out hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40 lg:w-48 lg:flex-none lg:justify-between lg:px-5 lg:py-3`}
    >
      {/* Hover wash */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: styles.wash }}
      />

      {/* Glyph stamp */}
      <span
        aria-hidden
        className={`storm-display flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border text-sm transition-colors duration-300 ${styles.glyph}`}
      >
        {glyph}
      </span>

      {/* Label — short on mobile, full on desktop */}
      <span
        className={`storm-display text-[13px] font-semibold uppercase tracking-[0.14em] text-foreground transition-colors duration-300 lg:flex-1 ${styles.labelHover}`}
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
