import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import type { LeaderboardEntry } from "@/lib/types";

export const metadata = {
  title: "Leaderboard — Storm Count",
};

const DUMMY_ENTRIES: LeaderboardEntry[] = [
  { rank: 1, username: "stormmaster", score: 97, elapsed_ms: 142_300 },
  { rank: 2, username: "mana_curve", score: 91, elapsed_ms: 168_720 },
  { rank: 3, username: "durdler", score: 88, elapsed_ms: 201_450 },
];

export default function LeaderboardPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-5 py-12 sm:px-8 sm:py-16">
      <header className="anim-fade-in flex flex-col gap-3.5">
        <p className="eyebrow flex items-center gap-2.5">
          <span aria-hidden className="h-1 w-1 rotate-45 bg-brass-bright" />
          Daily Leaderboard
          <span className="text-muted/60">·</span>
          <span className="storm-mono text-[10px] tracking-[0.22em] text-muted/80">
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
          Top 100 players. Ranked by score, then by elapsed time.
        </p>
      </header>

      <LeaderboardTable entries={DUMMY_ENTRIES} />
    </div>
  );
}
