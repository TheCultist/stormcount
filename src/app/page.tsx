import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { BRAND, ROUTES } from "@/lib/constants";
import { pickRandomQuote } from "@/lib/quotes";
import { buildMetadata, buildHowTo, jsonLd } from "@/lib/seo";
import { findThemedDayForDate } from "@/lib/themedDays";

/** Format today's UTC date as "May 8, 2026" */
function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Re-render on every request so the quote actually rotates.
export const dynamic = "force-dynamic";

// Use title.absolute so we get exactly "Storm Count — How high is your storm count?"
// on the home page, bypassing the parent "%s | Storm Count" template.
export const metadata: Metadata = {
  ...buildMetadata({
    path: "/",
    description: BRAND.description,
  }),
  title: {
    absolute: `${BRAND.name} — ${BRAND.tagline}`,
  },
};

const homeHowTo = buildHowTo({
  name: `How to play ${BRAND.name}`,
  description:
    "Storm Count shows you two Magic: The Gathering cards each round. Your job is to guess whether the hidden card's mana value is higher or lower than the revealed anchor card.",
  steps: [
    {
      name: "Look at the anchor card",
      text: "Every round shows one revealed Magic: The Gathering card with its mana value visible.",
    },
    {
      name: "Guess higher or lower",
      text: "Decide whether the hidden mystery card has a higher or lower mana value than the anchor.",
    },
    {
      name: "Reveal and chain",
      text: "If you're right, the mystery card becomes the new anchor and your storm count goes up. If you're wrong in Survival, your run ends.",
    },
    {
      name: "Pick a mode",
      text: "Daily Challenge is a fixed 50-card sequence everyone plays — your score goes on the global leaderboard. Survival is an endless run with one life.",
    },
  ],
});

type ModeCardProps = {
  href: string;
  title: string;
  blurb: string;
  badge: string;
  accent: "brass" | "moonsilver";
  meta: string;
  /** Themed-day label shown under the title when today's run is themed. */
  theme?: string | null;
};

function ModeCard({ href, title, blurb, badge, accent, meta, theme }: ModeCardProps) {
  const isBrass = accent === "brass";

  // Cobalt (#1e70c0) for daily, Ember (#b83828) for survival
  const borderColor = isBrass ? "#1e70c0" : "#b83828";
  const borderColorBright = isBrass ? "#4da8e8" : "#d95a40";
  const bgTint = isBrass
    ? "rgba(30,112,192,0.08)"
    : "rgba(184,56,40,0.08)";

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-lg transition-all duration-300 ease-out hover:-translate-y-1"
      style={{
        background: `linear-gradient(160deg, ${bgTint} 0%, rgba(10,14,26,0.98) 60%)`,
        border: `1.5px solid ${borderColor}`,
        boxShadow: `0 0 0 1px rgba(0,0,0,0.5), 0 12px 40px -16px rgba(0,0,0,0.8), 0 0 28px -8px ${borderColor}30`,
      }}
    >
      {/* Glow pulse on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-400 group-hover:opacity-100"
        style={{ boxShadow: `inset 0 0 0 1.5px ${borderColorBright}60` }}
      />

      <div className="flex flex-1 flex-col gap-5 p-7">
        {/* Header row — badge + meta */}
        <div className="flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em]"
            style={{
              background: isBrass ? "rgba(30,112,192,0.28)" : "rgba(184,56,40,0.28)",
              color: borderColorBright,
              border: `1px solid ${borderColor}80`,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: borderColorBright }}
            />
            {badge}
          </span>
          <span
            className="text-[10px] font-medium uppercase tracking-[0.22em]"
            style={{ color: "var(--foreground-muted)", fontFamily: "var(--font-mono)" }}
          >
            {meta}
          </span>
        </div>

        {/* Title + optional theme subtitle */}
        <div className="flex flex-col gap-1.5">
          <h2
            className="storm-display text-4xl font-bold leading-[1] tracking-[-0.02em] text-foreground transition-colors duration-300 sm:text-5xl"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 20, "WONK" 0' }}
          >
            {title}
          </h2>
          {theme && (
            <p
              className="flex items-center gap-2 text-[11px] font-bold uppercase leading-snug tracking-[0.22em]"
              style={{ color: borderColorBright, fontFamily: "var(--font-mono)" }}
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rotate-45"
                style={{ background: borderColorBright }}
              />
              {theme}
            </p>
          )}
        </div>

        {/* Blurb */}
        <p
          className="storm-display-italic flex-1 text-[14px] leading-relaxed"
          style={{ color: "var(--foreground-muted)" }}
        >
          {blurb}
        </p>

        {/* Enter button */}
        <div className="pt-1">
          <span
            className="inline-flex items-center gap-2.5 rounded px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] transition-all duration-200 group-hover:brightness-115"
            style={{
              background: borderColor,
              color: "#ffffff",
            }}
          >
            Enter
            <span className="transition-transform duration-200 ease-out group-hover:translate-x-0.5">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Decorative background: scattered diamonds + lightning bolt */
function BackgroundDecor() {
  const diamonds = [
    // Left side — cobalt
    { x: "4%",  y: "20%", size: 24, color: "rgba(30,112,192,0.60)",  border: true },
    { x: "6%",  y: "58%", size: 14, color: "rgba(77,168,232,0.35)",  border: true },
    { x: "2%",  y: "80%", size: 32, color: "rgba(30,112,192,0.22)",  border: true },
    { x: "11%", y: "40%", size: 10, color: "rgba(77,168,232,0.55)",  border: false },
    { x: "13%", y: "74%", size: 8,  color: "rgba(30,112,192,0.45)",  border: false },
    // Right side — ember
    { x: "87%", y: "22%", size: 22, color: "rgba(184,56,40,0.55)",   border: true },
    { x: "92%", y: "60%", size: 30, color: "rgba(184,56,40,0.24)",   border: true },
    { x: "82%", y: "44%", size: 12, color: "rgba(217,90,64,0.48)",   border: true },
    { x: "95%", y: "78%", size: 10, color: "rgba(217,90,64,0.38)",   border: false },
    { x: "77%", y: "70%", size: 8,  color: "rgba(184,56,40,0.42)",   border: false },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* Lightning bolt — centered, large, very faint */}
      <svg
        className="absolute"
        style={{
          left: "50%",
          top: "8%",
          transform: "translateX(-50%)",
          width: "min(380px, 55vw)",
          opacity: 0.07,
          filter: "blur(1px)",
        }}
        viewBox="0 0 120 220"
        fill="none"
      >
        <path
          d="M72 4L18 112h44L30 216l76-128H62L72 4z"
          fill="white"
        />
      </svg>

      {/* Scattered diamonds */}
      {diamonds.map((d, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            left: d.x,
            top: d.y,
            width: d.size,
            height: d.size,
            background: d.border ? "transparent" : d.color,
            border: d.border ? `1.5px solid ${d.color}` : "none",
            transform: "rotate(45deg)",
          }}
        />
      ))}
    </div>
  );
}

export default async function Home() {
  const quote = pickRandomQuote();

  // Resolve today's themed day (if any) so the mode cards can advertise it.
  // A DB hiccup here must never break the landing page, so failures degrade
  // gracefully to "no theme".
  let theme: Awaited<ReturnType<typeof findThemedDayForDate>> = null;
  try {
    theme = await findThemedDayForDate(new Date().toISOString().slice(0, 10));
  } catch (err) {
    console.error("[home] themed-day lookup failed:", err);
  }
  const dailyTheme = theme?.themeName ?? null;
  // Survival is only themed when the theme explicitly applies to it (isDaily=false).
  const survivalTheme = theme && !theme.isDaily ? theme.themeName : null;

  return (
    <div className="relative flex w-full flex-1 flex-col">
      <Script
        id="schema-howto"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(homeHowTo) }}
      />
      <BackgroundDecor />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-stretch justify-center gap-8 px-5 py-8 sm:gap-10 sm:px-8 sm:py-12">
        {/* Hero */}
        <header className="flex flex-col items-center gap-5 text-center">
          {/* Quote eyebrow — Izzet blue/red rule bookend */}
          <div className="flex w-full max-w-md items-center gap-3">
            <span
              aria-hidden
              className="h-px flex-1"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(30,112,192,0.55) 60%, rgba(184,56,40,0.35) 85%, transparent)",
              }}
            />
            <span
              className="storm-display-italic shrink-0 text-center text-[15px] leading-snug"
              style={{ color: "var(--foreground-muted)" }}
            >
              {quote}
            </span>
            <span
              aria-hidden
              className="h-px flex-1"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(184,56,40,0.35) 15%, rgba(30,112,192,0.55) 40%, transparent)",
              }}
            />
          </div>

          <h1
            className="storm-display font-bold leading-[1] tracking-[-0.03em] text-foreground"
            style={{
              fontSize: "clamp(3rem, 10vw, 6rem)",
              fontVariationSettings: '"opsz" 144, "SOFT" 20, "WONK" 0',
            }}
          >
            {BRAND.name}
          </h1>
          <p
            className="storm-display-italic text-base leading-relaxed sm:text-lg"
            style={{
              color: "var(--foreground-muted)",
              fontVariationSettings: '"opsz" 144, "SOFT" 40',
            }}
          >
            Guess whether the hidden card&apos;s mana value beats the revealed one.
          </p>
        </header>

        {/* Mode cards */}
        <section className="grid gap-6 md:grid-cols-2">
          <ModeCard
            href={ROUTES.daily}
            badge={todayLabel()}
            title="Daily Challenge"
            blurb="One seeded 50-card run per day. Race the clock, climb the leaderboard, prove your curve."
            accent="brass"
            meta="50 cards · seeded"
            theme={dailyTheme}
          />
          <ModeCard
            href={ROUTES.survival}
            badge="One life"
            title="Survival"
            blurb="Endless mode. No timer, no limit. One wrong answer ends the run. How high is your storm count?"
            accent="moonsilver"
            meta="Endless"
            theme={survivalTheme}
          />
        </section>

        {/* Footer tagline */}
        <p
          className="text-center text-[11px] uppercase tracking-[0.32em]"
          style={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}
        >
          How high is your Storm Count?
        </p>
      </div>
    </div>
  );
}
