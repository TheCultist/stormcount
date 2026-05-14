import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { ROUTES } from "@/lib/constants";
import {
  buildMetadata,
  buildBreadcrumbList,
  buildFaqPage,
  jsonLd,
} from "@/lib/seo";

const TITLE = "About Storm Count";
const DESCRIPTION =
  "Learn about Storm Count — a free Magic: The Gathering mana-value guessing game. Daily challenges, survival runs, global leaderboards, and how the card data is sourced from Scryfall.";

export const metadata: Metadata = buildMetadata({
  path: "/about",
  title: TITLE,
  description: DESCRIPTION,
});

const aboutJsonLd = [
  buildBreadcrumbList([
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
  ]),
  buildFaqPage([
    {
      question: "What is Storm Count?",
      answer:
        "Storm Count is a free, browser-based Magic: The Gathering guessing game. Each round you see two MTG cards and guess whether the mystery card's mana value is higher or lower than the anchor card.",
    },
    {
      question: "How do I play Storm Count?",
      answer:
        "Compare the two cards shown on screen and click 'Higher' or 'Lower' based on the mystery card's mana value. Chain correct guesses to raise your Storm Count. You can play the fixed Daily Challenge or the endless Survival mode.",
    },
    {
      question: "What is the difference between Daily and Survival mode?",
      answer:
        "Daily Challenge is a fixed 50-card sequence that resets every UTC midnight — everyone plays the same cards and competes on the daily leaderboard. Survival is an endless run that ends the moment you guess wrong.",
    },
    {
      question: "Where does the card data come from?",
      answer:
        "All card data and images come from the public Scryfall API. The card pool is filtered to tournament-legal, paper Magic: The Gathering cards with a defined mana value.",
    },
    {
      question: "Is Storm Count affiliated with Wizards of the Coast?",
      answer:
        "No. Storm Count is unofficial fan content and is not produced by, endorsed by, or affiliated with Wizards of the Coast LLC. Magic: The Gathering is a trademark of Wizards of the Coast.",
    },
    {
      question: "Is Storm Count free to play?",
      answer:
        "Yes. Storm Count is completely free to play. You can play anonymously or sign in to save your scores and appear on the leaderboard.",
    },
  ]),
];

export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-5 py-12 sm:px-8 sm:py-16">
      <Script
        id="schema-about"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(...aboutJsonLd) }}
      />
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
