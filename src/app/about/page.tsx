import type { Metadata } from "next";
import Image from "next/image";
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

const socialLinkClass =
  "inline-flex items-center justify-center rounded-full border border-brass/30 bg-surface/40 px-5 py-2 text-sm font-medium text-foreground/85 transition-colors hover:border-brass-bright/60 hover:text-brass-bright";

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

      {/* Creator & other projects */}
      <section className="codex rim-brass anim-rise-in flex flex-col gap-7 rounded-md p-8">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
          <div className="shrink-0 rounded-full border border-brass/30 bg-surface p-1.5">
            <Image
              src="/brand/cardboard-cultist.png"
              alt="Cardboard Cultist logo"
              width={160}
              height={160}
              className="h-24 w-24 rounded-full object-cover sm:h-28 sm:w-28"
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="eyebrow text-[10px] text-muted">Made by</p>
            <h2 className="storm-display text-2xl font-bold leading-none tracking-[-0.01em] text-foreground">
              Cardboard{" "}
              <span className="storm-display-italic text-brass-bright">
                Cultist
              </span>
            </h2>
            <p className="text-sm leading-relaxed text-foreground/75">
              Storm Count is a personal project by Cardboard Cultist, an MTG
              content creator focused on Commander, card discovery, and Magic
              memes.
            </p>
          </div>
        </div>

        <span aria-hidden className="rule-brass" />

        {/* Socials */}
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-[10px] text-muted">Follow</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="https://www.instagram.com/card_cultist/"
              target="_blank"
              rel="noreferrer noopener"
              className={socialLinkClass}
            >
              Instagram
            </a>
            <a
              href="https://www.tiktok.com/@cardboardcultist"
              target="_blank"
              rel="noreferrer noopener"
              className={socialLinkClass}
            >
              TikTok
            </a>
            <a
              href="https://www.youtube.com/@card_cultist"
              target="_blank"
              rel="noreferrer noopener"
              className={socialLinkClass}
            >
              YouTube
            </a>
          </div>
        </div>

        <span aria-hidden className="rule-brass" />

        {/* Sister project */}
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-[10px] text-muted">Sister Project</p>
          <a
            href="https://www.findthatcard.net"
            target="_blank"
            rel="noreferrer noopener"
            className="group flex items-center justify-between gap-4 rounded-md border border-brass/25 bg-surface/40 px-5 py-4 transition-colors hover:border-brass-bright/60"
          >
            <span className="flex flex-col gap-1">
              <span className="storm-display text-lg font-bold text-foreground transition-colors group-hover:text-brass-bright">
                Find That Card
              </span>
              <span className="text-xs leading-relaxed text-foreground/65">
                Free MTG card search that turns natural language into Scryfall
                queries.
              </span>
            </span>
            <span className="storm-mono shrink-0 text-[11px] uppercase tracking-[0.2em] text-muted/70 transition-colors group-hover:text-brass-bright">
              findthatcard.net →
            </span>
          </a>
        </div>
      </section>

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
