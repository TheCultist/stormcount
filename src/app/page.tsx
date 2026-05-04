import Link from "next/link";
import { BRAND, ROUTES } from "@/lib/constants";
import { pickRandomQuote } from "@/lib/quotes";

// Re-render on every request so the quote actually rotates.
export const dynamic = "force-dynamic";

type ModeCardProps = {
  href: string;
  title: string;
  blurb: string;
  badge: string;
  accent: "brass" | "moonsilver";
  meta: string;
  romanIndex: string;
  index: number;
};

function ModeCard({
  href,
  title,
  blurb,
  badge,
  accent,
  meta,
  romanIndex,
  index,
}: ModeCardProps) {
  const isBrass = accent === "brass";
  const accentText = isBrass ? "text-brass-bright" : "text-moonsilver-bright";
  const dotBg = isBrass ? "bg-brass-bright" : "bg-moonsilver-bright";

  return (
    <Link
      href={href}
      style={{ ["--i" as string]: index }}
      className={`codex anim-rise-in stagger ${
        isBrass ? "rim-brass" : "rim-moonsilver"
      } group relative isolate flex flex-col gap-6 overflow-hidden rounded-md p-8 transition-transform duration-500 ease-out hover:-translate-y-1`}
    >
      {/* Roman numeral watermark in corner — codex feel */}
      <span
        aria-hidden
        className="storm-display pointer-events-none absolute -right-3 -top-2 select-none text-[9rem] font-extrabold leading-none text-foreground/[0.035] transition-colors duration-500 group-hover:text-foreground/[0.06]"
      >
        {romanIndex}
      </span>

      {/* Hover wash */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px"
        style={{
          background: isBrass
            ? "var(--grad-card-wash-primary)"
            : "var(--grad-card-wash-secondary)",
        }}
      />

      {/* Header row — badge + meta */}
      <div className="relative flex items-center justify-between">
        <span className="eyebrow inline-flex items-center gap-2">
          <span className={`h-1 w-1 rotate-45 ${dotBg} anim-pulse`} />
          {badge}
        </span>
        <span className="storm-mono text-[10px] uppercase tracking-[0.22em] text-muted/70">
          {meta}
        </span>
      </div>

      {/* Title — Fraunces with optical size for display */}
      <h2
        className={`storm-display relative text-4xl font-bold leading-[0.95] tracking-[-0.015em] text-foreground transition-colors duration-300 sm:text-5xl ${
          isBrass
            ? "group-hover:text-brass-bright"
            : "group-hover:text-moonsilver-bright"
        }`}
        style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30, "WONK" 0' }}
      >
        {title}
      </h2>

      {/* Hairline rule */}
      <span aria-hidden className="rule-brass" />

      {/* Blurb */}
      <p className="storm-display-italic relative max-w-md text-[15px] leading-relaxed text-foreground/70">
        {blurb}
      </p>

      {/* Footer row — enter cue */}
      <div className="relative mt-1 flex items-center justify-between">
        <span className={`eyebrow ${accentText}`}>Enter</span>
        <span
          aria-hidden
          className={`storm-display text-2xl ${accentText} transition-transform duration-300 ease-out group-hover:translate-x-1`}
        >
          →
        </span>
      </div>
    </Link>
  );
}

export default function Home() {
  const quote = pickRandomQuote();
  // Split brand name to apply drop cap on first letter
  const [firstLetter, ...rest] = BRAND.name.split("");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-stretch justify-center gap-16 px-5 py-16 sm:px-8 sm:py-24">
      {/* Hero */}
      <header className="anim-fade-in flex flex-col items-center gap-7 text-center">
        {/* Rotating MTG quote eyebrow */}
        <div className="rule-bookend max-w-lg">
          <span className="eyebrow text-brass">
            {quote}
          </span>
        </div>

        {/* Title — illuminated drop cap on first letter */}
        <h1 className="anim-ink-bleed relative inline-flex items-baseline justify-center">
          <span
            className="storm-display relative leading-[0.85] tracking-[-0.025em] text-foreground"
            style={{
              fontSize: "clamp(3.5rem, 12vw, 8rem)",
              fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1',
            }}
          >
            <span
              className="storm-display align-baseline text-brass-bright"
              style={{
                fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1',
                textShadow:
                  "var(--shadow-dropcap)",
              }}
            >
              {firstLetter}
            </span>
            {rest.join("")}
          </span>
        </h1>

        {/* Tagline */}
        <p
          className="storm-display-italic whitespace-nowrap text-base leading-relaxed text-foreground/75 sm:text-lg"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
        >
          Guess whether the hidden card&apos;s mana value beats the revealed one.
        </p>
      </header>

      {/* Mode cards */}
      <section className="grid gap-7 md:grid-cols-2">
        <ModeCard
          href={ROUTES.daily}
          badge="Daily"
          title="Daily Challenge"
          blurb="One seeded 50-card run per day. Race the clock, climb the leaderboard, prove your curve."
          accent="brass"
          meta="50 cards · seeded"
          romanIndex="I"
          index={0}
        />
        <ModeCard
          href={ROUTES.survival}
          badge="Survival"
          title="Survival"
          blurb="Endless mode. No timer, no limit. One wrong answer ends the run. How high is your storm count?"
          accent="moonsilver"
          meta="∞ endless"
          romanIndex="II"
          index={1}
        />
      </section>

      {/* Decorative footer line */}
      <div className="storm-mono flex items-center justify-center gap-3 text-[12px] uppercase tracking-[0.28em] text-muted/80">
        <span aria-hidden className="h-px w-8 bg-gradient-to-r from-transparent to-rule/50" />
        <span>How high is your Storm Count?</span>
        <span aria-hidden className="h-px w-8 bg-gradient-to-l from-transparent to-rule/50" />
      </div>

    </div>
  );
}
