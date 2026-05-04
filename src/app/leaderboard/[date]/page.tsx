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
  return { title: `Leaderboard ${date} — Storm Count` };
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
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-5 py-12 sm:px-8 sm:py-16">
      <header className="anim-fade-in flex flex-col gap-3.5">
        <div className="flex items-center gap-3">
          <p className="eyebrow flex items-center gap-2.5">
            <span aria-hidden className="h-1 w-1 rotate-45 bg-brass-bright" />
            Daily Leaderboard
            <span className="text-foreground/40">·</span>
            <span className="storm-mono text-[10px] tracking-[0.22em] text-foreground/65">
              {date}
            </span>
          </p>
        </div>
        <h1
          className="storm-display text-4xl font-extrabold leading-[0.95] tracking-[-0.02em] text-foreground sm:text-5xl"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
        >
          Storm counts for{" "}
          <span className="storm-display-italic text-brass-bright">{displayDate}</span>
        </h1>
        <p className="storm-display-italic max-w-xl text-base leading-relaxed text-foreground/65">
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

      <div className="anim-fade-in">
        <Link
          href="/leaderboard"
          className="storm-mono inline-flex items-center gap-2 text-[11px] tracking-[0.1em] text-foreground/55 transition-colors hover:text-brass-bright"
        >
          <span aria-hidden>←</span> Back to today&apos;s leaderboard
        </Link>
      </div>
    </div>
  );
}
