import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import { db } from "@/lib/db";
import { dailySeeds } from "@/lib/db/schema";
import { getLeaderboard } from "@/lib/db/leaderboard";
import { dailyPuzzleNumber } from "@/lib/share";
import type { MtgCard } from "@/lib/types";
import { buildMetadata, buildBreadcrumbList, jsonLd } from "@/lib/seo";
import {
  formatArchiveDate,
  validateArchiveDate,
} from "@/lib/leaderboard-archive";

export const dynamic = "force-dynamic";

/**
 * The day's seed (cards + theme). Past days only — the archive never shows
 * today's cards. `cache` dedupes the lookup between metadata and page.
 */
const getArchivedSeed = cache(async (date: string) =>
  db.query.dailySeeds.findFirst({
    where: eq(dailySeeds.date, date),
    columns: { cards: true, themed: true },
  }),
);

/** Scryfall's ~146px "small" rendition of a card image URL (same CDN path). */
function smallImage(uri: string): string {
  return uri.replace("/normal/", "/small/");
}

function archiveHeading(date: string): string {
  const n = dailyPuzzleNumber(date);
  return n ? `Daily #${n}` : "Daily";
}

type PageProps = {
  params: Promise<{ date: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { date } = await params;
  const valid = validateArchiveDate(date);

  if (!valid) {
    return buildMetadata({
      path: `/leaderboard/${date}`,
      title: "Leaderboard archive",
      description: "This Storm Count leaderboard archive is not available.",
      noindex: true,
    });
  }

  const display = formatArchiveDate(valid);
  const seed = await getArchivedSeed(valid);
  const sample = seed?.cards.slice(0, 3).map((c) => c.name).join(", ");
  return buildMetadata({
    path: `/leaderboard/${valid}`,
    title: `${archiveHeading(valid)} — Cards & Leaderboard, ${display}`,
    description: sample
      ? `All ${seed!.cards.length} Magic: The Gathering cards from Storm Count ${archiveHeading(valid)} (${display}) — ${sample} and more — with their mana values and the day's leaderboard.`
      : `Storm Count daily leaderboard for ${display}. Top Magic: The Gathering players ranked by score and speed.`,
    // No seed = nobody played that day: an empty page, not worth indexing.
    noindex: !seed,
  });
}

export default async function HistoricalLeaderboardPage({ params }: PageProps) {
  const { date } = await params;

  // Centralised validation keeps the page, its metadata, and the sitemap
  // aligned on what counts as a real archive URL — no soft-404s.
  const valid = validateArchiveDate(date);
  if (!valid) notFound();

  const { userId } = await auth();
  const [entries, seed] = await Promise.all([getLeaderboard(valid), getArchivedSeed(valid)]);
  const displayDate = formatArchiveDate(valid);

  const archiveJsonLd = buildBreadcrumbList([
    { name: "Home", path: "/" },
    { name: "Daily Leaderboard", path: "/leaderboard" },
    { name: displayDate, path: `/leaderboard/${valid}` },
  ]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-5 py-12 sm:px-8 sm:py-16">
      <script
        id="schema-leaderboard-archive"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(archiveJsonLd) }}
      />
      {/* Header — matches the same style as /leaderboard */}
      <header className="anim-fade-in flex flex-col items-center gap-4 text-center">
        <p className="storm-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: "rgba(220,230,240,0.45)" }}>
          Archive
        </p>
        <h1
          className="storm-display font-extrabold uppercase text-foreground"
          style={{
            fontSize: "clamp(2rem, 7vw, 3.8rem)",
            fontVariationSettings: '"opsz" 144, "SOFT" 10, "WONK" 0',
            letterSpacing: "0.06em",
          }}
        >
          Daily Leaderboard
        </h1>

        {/* Active date badge */}
        <div
          className="storm-mono rounded px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.16em]"
          style={{ background: "#1e70c0", color: "#ffffff" }}
        >
          {archiveHeading(valid)} · {displayDate}
        </div>
        {seed?.themed && (
          <p className="storm-display-italic text-sm text-brass-bright">{seed.themed}</p>
        )}

        <p
          className="storm-mono text-[11px]"
          style={{ color: "rgba(220,230,240,0.40)" }}
        >
          {entries.length > 0
            ? `${entries.length} player${entries.length === 1 ? "" : "s"} completed this challenge.`
            : "No scores recorded for this date."}
        </p>
      </header>

      <LeaderboardTable
        entries={entries}
        currentUserId={userId}
        emptyLabel={`No scores recorded for ${displayDate}.`}
      />

      {seed && seed.cards.length > 0 && <ArchivedCards cards={seed.cards} />}

      {/* Back link + tagline */}
      <div className="flex flex-col items-center gap-3">
        <Link
          href="/leaderboard"
          className="storm-mono inline-flex items-center gap-2 text-[11px] tracking-[0.1em] transition-colors"
          style={{ color: "rgba(220,230,240,0.45)" }}
        >
          <span aria-hidden>←</span> Back to today&apos;s leaderboard
        </Link>
        <p
          className="text-center text-[11px] uppercase tracking-[0.32em]"
          style={{ color: "rgba(220,230,240,0.20)", fontFamily: "var(--font-mono)" }}
        >
          How high is your Storm Count?
        </p>
      </div>
    </div>
  );
}

/** The day's full card sequence — the answer key, now that the day is over. */
function ArchivedCards({ cards }: { cards: MtgCard[] }) {
  return (
    <section aria-labelledby="archived-cards" className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <h2
          id="archived-cards"
          className="storm-display text-xl font-bold tracking-[-0.01em] text-foreground"
        >
          The {cards.length} cards
        </h2>
        <p className="storm-mono text-[11px] text-foreground/50">
          In play order — card 1 is the opening anchor. Each guess compared a card with the next.
        </p>
      </div>
      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <li
            key={`${card.id}-${i}`}
            className="flex items-center gap-3 rounded border border-rule/30 bg-background-deep/40 p-2"
          >
            <span className="storm-mono w-6 shrink-0 text-right text-[10px] text-foreground/40">
              {i + 1}
            </span>
            {card.image_uri && (
              <Image
                src={smallImage(card.image_uri)}
                alt=""
                width={36}
                height={50}
                loading="lazy"
                className="h-[50px] w-9 shrink-0 rounded-[3px] object-cover"
              />
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <a
                href={card.scryfall_uri}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-[13px] text-foreground/90 hover:text-brass-bright"
              >
                {card.name}
              </a>
              <span className="truncate text-[11px] text-foreground/45">{card.type_line}</span>
            </div>
            <span
              className="storm-mono shrink-0 rounded border border-brass/30 px-2 py-0.5 text-[11px] tabular-nums text-brass-bright"
              title="Mana value"
            >
              MV {card.cmc}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
