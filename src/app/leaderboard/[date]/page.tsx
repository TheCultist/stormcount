import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import type { LeaderboardEntry } from "@/lib/types";

type PageProps = {
  params: Promise<{ date: string }>;
};

const DUMMY_ENTRIES: LeaderboardEntry[] = [
  { rank: 1, username: "stormmaster", score: 97, elapsed_ms: 142_300 },
  { rank: 2, username: "mana_curve", score: 91, elapsed_ms: 168_720 },
];

export default async function HistoricalLeaderboardPage({ params }: PageProps) {
  const { date } = await params;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-widest text-gold/80">
          Historical Leaderboard · {date}
        </p>
        <h1 className="storm-display text-3xl font-bold text-foreground">
          Top storm counts for {date}
        </h1>
      </header>

      <LeaderboardTable entries={DUMMY_ENTRIES} />
    </div>
  );
}
