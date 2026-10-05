import type { ReactNode } from "react";
import type { GameAccent } from "@/components/game/ActionButton";

export type RuleEntry = {
  readonly num: string;
  readonly heading: string;
  readonly body: string;
};

const SHORTCUTS = [
  { kbd: "↑ / W", label: "Higher or Equal" },
  { kbd: "↓ / S", label: "Lower" },
] as const;

/** Brass-rimmed codex article with a diamond-marked eyebrow header. */
function CodexPanel({ eyebrow, children }: { eyebrow: ReactNode; children: ReactNode }) {
  return (
    <article className="codex rim-brass anim-rise-in w-full rounded-md">
      <header className="flex items-center gap-3 px-5 pt-5 pb-4">
        <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-brass-bright" />
        <p className="eyebrow text-[9px]">{eyebrow}</p>
      </header>
      <span aria-hidden className="rule-brass mx-5 block h-px" />
      {children}
    </article>
  );
}

/** Illuminated theme name shown above the theme panel. */
export function ThemeTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      className="text-2xl font-bold uppercase leading-tight tracking-[0.14em] text-brass-bright sm:text-3xl"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {children}
    </h2>
  );
}

/** "About Today's Theme" panel shown on themed days. */
export function ThemePanel({ description }: { description: string }) {
  return (
    <CodexPanel eyebrow={<>About Today&apos;s Theme</>}>
      <p className="storm-display-italic px-5 py-4 text-[15px] leading-relaxed text-foreground/85">
        {description}
      </p>
    </CodexPanel>
  );
}

const FOOTER_TONES = {
  bright: { heading: "text-foreground/55", label: "text-foreground/70" },
  muted: { heading: "text-muted/70", label: "text-foreground/60" },
} as const;

/** "How to Play" panel — numbered rules plus keyboard shortcut footer. */
export function RulesPanel({
  rules,
  footerTone = "bright",
}: {
  rules: readonly RuleEntry[];
  /** Contrast of the keyboard footer text. */
  footerTone?: keyof typeof FOOTER_TONES;
}) {
  const tone = FOOTER_TONES[footerTone];
  return (
    <CodexPanel eyebrow="How to Play">
      <ol className="flex flex-col gap-0 px-5 py-4">
        {rules.map(({ num, heading, body }) => (
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
        <p className={`storm-mono text-[9px] uppercase tracking-[0.22em] ${tone.heading}`}>Keyboard</p>
        <div className="flex items-center gap-4">
          {SHORTCUTS.map(({ kbd, label }) => (
            <span key={kbd} className="flex items-center gap-1.5">
              <kbd className="storm-mono inline-flex items-center justify-center rounded-sm border border-rule/60 bg-background-deep/50 px-1.5 py-0.5 text-[10px] font-medium text-muted/80">
                {kbd}
              </kbd>
              <span className={`storm-mono text-[10px] ${tone.label}`}>{label}</span>
            </span>
          ))}
        </div>
      </footer>
    </CodexPanel>
  );
}

const TIE_PILL_ACCENTS: Record<GameAccent, { dot: string; text: string }> = {
  brass: { dot: "bg-brass-bright", text: "text-foreground/80" },
  moonsilver: { dot: "bg-moonsilver", text: "text-foreground/70" },
};

/** Reminder that equal mana values count as Higher or Equal. */
export function TieRulePill({
  accent = "brass",
  className = "",
}: {
  accent?: GameAccent;
  className?: string;
}) {
  const { dot, text } = TIE_PILL_ACCENTS[accent];
  return (
    <p
      className={`storm-mono inline-flex w-fit items-center gap-2.5 border border-rule/40 bg-paper/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] ${text} ${className}`.trimEnd()}
    >
      <span aria-hidden className={`h-1 w-1 rotate-45 ${dot}`} />
      Tie rule · equal mv counts as Higher or Equal
    </p>
  );
}
