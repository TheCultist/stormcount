import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import { getLeaderboard } from "@/lib/db/leaderboard";
import { buildMetadata, buildBreadcrumbList, jsonLd } from "@/lib/seo";
import {
  formatArchiveDate,
  validateArchiveDate,
} from "@/lib/leaderboard-archive";

export const dynamic = "force-dynamic";

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
  return buildMetadata({
    path: `/leaderboard/${valid}`,
    title: `Leaderboard — ${display}`,
    description: `Storm Count daily leaderboard for ${display}. Top Magic: The Gathering players ranked by score and speed.`,
  });
}

export default async function HistoricalLeaderboardPage({ params }: PageProps) {
  const { date } = await params;

  // Centralised validation keeps the page, its metadata, and the sitemap
  // aligned on what counts as a real archive URL — no soft-404s.
  const valid = validateArchiveDate(date);
  if (!valid) notFound();

  const { userId } = await auth();
  const entries = await getLeaderboard(valid);
  const displayDate = formatArchiveDate(valid);

  const archiveJsonLd = buildBreadcrumbList([
    { name: "Home", path: "/" },
    { name: "Daily Leaderboard", path: "/leaderboard" },
    { name: displayDate, path: `/leaderboard/${valid}` },
  ]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-5 py-12 sm:px-8 sm:py-16">
      <Script
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
          {displayDate}
        </div>

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
