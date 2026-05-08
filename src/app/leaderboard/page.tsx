import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import { getLeaderboard } from "@/lib/db/leaderboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Leaderboard",
  description:
    "Today's Storm Count daily leaderboard — see the top MTG players ranked by score and speed.",
  openGraph: {
    title: "Daily Leaderboard | Storm Count",
    description: "Top MTG players ranked by score and speed. Can you crack the top 100?",
    url: "https://stormcount.gg/leaderboard",
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Leaderboard | Storm Count",
    description: "Top MTG players ranked by score and speed. Can you crack the top 100?",
  },
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

  // Format dates as "APR 15" style
  const formatDateTab = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00Z");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-5 py-12 sm:px-8 sm:py-16">
      {/* Page title */}
      <header className="anim-fade-in flex flex-col items-center gap-6 text-center">
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

        {/* Date tab bar — single dark bar, active is cobalt pill */}
        <nav
          className="flex w-full max-w-2xl flex-wrap items-center gap-0 overflow-hidden rounded-md"
          aria-label="Date navigation"
          style={{
            background: "rgba(10,16,28,0.65)",
            border: "1px solid rgba(30,112,192,0.20)",
          }}
        >
          {/* Today (active pill) */}
          <span
            className="storm-mono px-5 py-3 text-[11px] font-bold uppercase tracking-[0.14em]"
            style={{
              background: "#1e70c0",
              color: "#ffffff",
              borderRight: "1px solid rgba(30,112,192,0.30)",
            }}
          >
            {formatDateTab(today)} <span className="opacity-60 text-[9px]">(UTC)</span>
          </span>

          {/* Past dates — plain text tabs with dividers */}
          {pastDates.map((d) => (
            <Link
              key={d}
              href={`/leaderboard/${d}`}
              className="storm-mono flex-1 px-4 py-3 text-center text-[11px] font-medium uppercase tracking-[0.12em] transition-colors duration-150 hover:bg-white/[0.04]"
              style={{
                color: "rgba(220,230,240,0.50)",
                borderRight: "1px solid rgba(220,230,240,0.07)",
                minWidth: "4rem",
              }}
            >
              {formatDateTab(d)}
            </Link>
          ))}
        </nav>
      </header>

      <LeaderboardTable
        entries={entries}
        currentUserId={userId}
        emptyLabel="No scores yet today — be the first to play!"
      />

      {/* Footer tagline */}
      <p
        className="text-center text-[11px] uppercase tracking-[0.32em]"
        style={{ color: "rgba(220,230,240,0.25)", fontFamily: "var(--font-mono)" }}
      >
        How high is your Storm Count?
      </p>
    </div>
  );
}
