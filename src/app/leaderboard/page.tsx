import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import { getLeaderboard } from "@/lib/db/leaderboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Leaderboard — Storm Count",
};

export default async function LeaderboardPage() {
  const today = new Date().toISOString().slice(0, 10);
  const { userId } = await auth();

  const entries = await getLeaderboard(today);

  // Build a list of past 6 days for the archive nav (excluding today)
  const pastDates = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (i + 1));
    return d.toISOString().slice(0, 10);
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-5 py-12 sm:px-8 sm:py-16">
      <header className="anim-fade-in flex flex-col gap-3.5">
        <p className="eyebrow flex items-center gap-2.5">
          <span aria-hidden className="h-1 w-1 rotate-45 bg-brass-bright" />
          Daily Leaderboard
          <span className="text-foreground/40">·</span>
          <span className="storm-mono text-[10px] tracking-[0.22em] text-foreground/65">
            {today}
          </span>
        </p>
        <h1
          className="storm-display text-4xl font-extrabold leading-[0.95] tracking-[-0.02em] text-foreground sm:text-5xl"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
        >
          Today&apos;s top{" "}
          <span className="storm-display-italic text-brass-bright">storm counts</span>
        </h1>
        <p className="storm-display-italic max-w-xl text-base leading-relaxed text-foreground/65">
          Top {entries.length > 0 ? entries.length : "100"} players · ranked by score,
          then by elapsed time.
        </p>
      </header>

      <LeaderboardTable
        entries={entries}
        currentUserId={userId}
        emptyLabel="No scores yet today — be the first to play!"
      />

      {/* Archive nav */}
      <section className="anim-fade-in flex flex-col gap-3">
        <p className="eyebrow text-[10px] text-foreground/50">Past challenges</p>
        <div className="flex flex-wrap gap-2">
          {pastDates.map((d) => (
            <Link
              key={d}
              href={`/leaderboard/${d}`}
              className="storm-mono rounded border border-rule/50 bg-paper-2/40 px-3 py-1.5 text-[11px] tracking-[0.1em] text-foreground/60 transition-colors hover:border-brass/50 hover:text-brass-bright"
            >
              {d}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
