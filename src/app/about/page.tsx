import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Storm Count — a free Magic: The Gathering mana-value guessing game. Daily challenges, survival runs, and global leaderboards.",
  openGraph: {
    title: `About | ${BRAND.name}`,
    description:
      "About Storm Count — a free MTG higher/lower mana-value guessing game. Daily challenges, survival runs, and leaderboards.",
    url: `https://${BRAND.domain}/about`,
  },
  twitter: {
    card: "summary_large_image",
    title: `About | ${BRAND.name}`,
    description: "About Storm Count — a free MTG higher/lower mana-value guessing game.",
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-5 py-12 sm:px-8 sm:py-16">
      {/* Header */}
      <header className="anim-fade-in flex flex-col gap-3">
        <Link
          href={ROUTES.home}
          className="storm-mono text-[11px] uppercase tracking-[0.2em] text-muted/60 transition-colors hover:text-brass-bright"
        >
          ← Back to game
        </Link>
        <p className="eyebrow">About</p>
        <h1
          className="storm-display text-4xl font-extrabold leading-[0.95] tracking-[-0.02em] text-foreground sm:text-5xl"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
        >
          Storm{" "}
          <span className="storm-display-italic text-brass-bright">Count</span>
        </h1>
        <p className="storm-display-italic max-w-md text-base leading-relaxed text-foreground/65">
          A free Magic: The Gathering guessing game. One card, one question —
          higher or lower?
        </p>
      </header>

      {/* Main card */}
      <section className="codex rim-brass anim-rise-in flex flex-col gap-7 rounded-md p-8">
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-[10px] text-muted">The Game</p>
          <p className="text-sm leading-relaxed text-foreground/80">
            Storm Count shows you two Magic: The Gathering cards. Guess whether
            the mystery card&apos;s converted mana cost is{" "}
            <strong className="text-brass-bright">higher</strong> or{" "}
            <strong className="text-moonsilver-bright">lower</strong> than the
            anchor card. Chain correct guesses to raise your Storm Count.
          </p>
          <ul className="mt-1 space-y-2 text-sm text-foreground/70">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-brass">▸</span>
              <span>
                <strong className="text-foreground/85">Daily Challenge</strong>{" "}
                — a fixed 50-card sequence everyone plays. Score goes on the
                leaderboard.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-moonsilver">▸</span>
              <span>
                <strong className="text-foreground/85">Survival</strong> — an
                endless run that ends the moment you guess wrong.
              </span>
            </li>
          </ul>
        </div>

        <span aria-hidden className="rule-brass" />

        <div className="flex flex-col gap-3">
          <p className="eyebrow text-[10px] text-muted">Card Data</p>
          <p className="text-sm leading-relaxed text-foreground/80">
            All card data and images are fetched from the{" "}
            <a
              href="https://scryfall.com"
              target="_blank"
              rel="noreferrer noopener"
              className="storm-display-italic text-foreground/85 transition-colors hover:text-brass-bright"
            >
              Scryfall
            </a>{" "}
            public API. The card pool is filtered to tournament-legal, paper
            game cards with a defined mana value.
          </p>
        </div>

        <span aria-hidden className="rule-brass" />

        <div className="flex flex-col gap-3">
          <p className="eyebrow text-[10px] text-muted">Disclaimer</p>
          <p className="text-sm leading-relaxed text-foreground/70">
            Storm Count is unofficial fan content, not produced by, endorsed by,
            or affiliated with Wizards of the Coast LLC. Magic: The Gathering®
            is property of Wizards of the Coast. Card names, artwork, and mana
            symbols are © Wizards of the Coast.
          </p>
        </div>
      </section>

      {/* Legal links */}
      <nav
        aria-label="Legal"
        className="anim-fade-in flex items-center gap-6"
      >
        <Link
          href={ROUTES.privacy}
          className="storm-mono text-[11px] uppercase tracking-[0.2em] text-muted/60 transition-colors hover:text-brass-bright"
        >
          Privacy Policy
        </Link>
        <Link
          href={ROUTES.contact}
          className="storm-mono text-[11px] uppercase tracking-[0.2em] text-muted/60 transition-colors hover:text-brass-bright"
        >
          Contact
        </Link>
        <Link
          href={ROUTES.bugReport}
          className="storm-mono text-[11px] uppercase tracking-[0.2em] text-muted/60 transition-colors hover:text-brass-bright"
        >
          Report a Bug
        </Link>
      </nav>
    </div>
  );
}
