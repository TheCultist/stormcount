import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import { getLeaderboard } from "@/lib/db/leaderboard";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ date: string }>;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function generateMetadata({ params }: PageProps) {
  const { date } = await params;
  return {
    title: `Leaderboard ${date}`,
    description: `Storm Count daily leaderboard for ${date} — top MTG players ranked by score and speed.`,
    openGraph: {
      title: `Leaderboard ${date} | Storm Count`,
      description: `Storm Count daily leaderboard for ${date} — top MTG players ranked by score and speed.`,
      url: `https://stormcount.gg/leaderboard/${date}`,
    },
  };
}

export default async function HistoricalLeaderboardPage({ params }: PageProps) {
  const { date } = await params;

  // Guard against malformed slugs
  if (!DATE_RE.test(date)) notFound();

  // Don't allow "today" via this route
  const today = new Date().toISOString().slice(0, 10);
  if (date === today) {
    // Redirect to canonical /leaderboard would be cleaner but notFound is fine too
  }

  const { userId } = await auth();
  const entries = await getLeaderboard(date);

  // Format date for display e.g. "May 3, 2026"
  const displayDate = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-5 py-12 sm:px-8 sm:py-16">
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
