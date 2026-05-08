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
};

function ModeCard({ href, title, blurb, badge, accent, meta }: ModeCardProps) {
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

        {/* Title */}
        <h2
          className="storm-display text-4xl font-bold leading-[1] tracking-[-0.02em] text-foreground transition-colors duration-300 sm:text-5xl"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 20, "WONK" 0' }}
        >
          {title}
        </h2>

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

export default function Home() {
  const quote = pickRandomQuote();

  return (
    <div className="relative flex w-full flex-1 flex-col">
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
            badge="Daily"
            title="Daily Challenge"
            blurb="One seeded 50-card run per day. Race the clock, climb the leaderboard, prove your curve."
            accent="brass"
            meta="50 cards · seeded"
          />
          <ModeCard
            href={ROUTES.survival}
            badge="Survival"
            title="Survival"
            blurb="Endless mode. No timer, no limit. One wrong answer ends the run. How high is your storm count?"
            accent="moonsilver"
            meta="Endless"
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
