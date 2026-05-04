import type { LeaderboardEntry } from "@/lib/types";

type LeaderboardTableProps = {
  entries: LeaderboardEntry[];
  emptyLabel?: string;
};

function formatTime(ms: number): string {
  const seconds = ms / 1000;
  return `${seconds.toFixed(2)}s`;
}

const ROMAN: Record<number, string> = { 1: "I", 2: "II", 3: "III" };

function rankAccent(rank: number): {
  badge: string;
  text: string;
  glow: string;
  color: string;
} {
  if (rank === 1) {
    return {
      badge:
        "border-brass-bright/80 bg-gradient-to-b from-brass-bright/30 to-brass/10",
      text: "text-brass-bright",
      glow: "shadow-[0_0_24px_-6px_rgba(232,193,129,0.65)]",
      color: "brass",
    };
  }
  if (rank === 2) {
    return {
      badge: "border-foreground/35 bg-foreground/[0.06]",
      text: "text-foreground",
      glow: "",
      color: "silver",
    };
  }
  if (rank === 3) {
    return {
      badge: "border-crimson/40 bg-crimson/10",
      text: "text-crimson-bright",
      glow: "",
      color: "bronze",
    };
  }
  return {
    badge: "border-border-subtle bg-background-deep/40",
    text: "text-muted",
    glow: "",
    color: "muted",
  };
}

export default function LeaderboardTable({
  entries,
  emptyLabel = "No scores yet today.",
}: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="codex storm-display-italic rounded-md p-12 text-center text-sm text-muted">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="codex rim-brass overflow-hidden rounded-md">
      {/* Header — codex ledger row */}
      <div className="grid grid-cols-[4rem_1fr_5rem_5.5rem] items-center gap-3 border-b border-rule/40 bg-paper-3/40 px-5 py-3 sm:grid-cols-[5rem_1fr_6rem_7rem]">
        <span className="eyebrow text-[10px] text-muted">Rank</span>
        <span className="eyebrow text-[10px] text-muted">Player</span>
        <span className="eyebrow text-right text-[10px] text-muted">Score</span>
        <span className="eyebrow text-right text-[10px] text-muted">Time</span>
      </div>

      {/* Rows */}
      <ul className="divide-y divide-rule/30">
        {entries.map((entry, i) => {
          const a = rankAccent(entry.rank);
          const roman = ROMAN[entry.rank];
          return (
            <li
              key={`${entry.rank}-${entry.username}`}
              style={{ ["--i" as string]: i }}
              className="anim-fade-in stagger group grid grid-cols-[4rem_1fr_5rem_5.5rem] items-center gap-3 px-5 py-3.5 transition-colors duration-200 hover:bg-brass/[0.04] sm:grid-cols-[5rem_1fr_6rem_7rem]"
            >
              {/* Rank — roman numeral for top 3, # for rest */}
              <div className="flex items-center">
                <span
                  className={`inline-flex h-9 min-w-[2.5rem] items-center justify-center rounded-sm border px-2 text-[13px] font-bold tabular-nums ${a.badge} ${a.text} ${a.glow} ${
                    roman ? "storm-display" : "storm-mono"
                  }`}
                  style={
                    roman
                      ? { fontVariationSettings: '"opsz" 96, "WONK" 1' }
                      : undefined
                  }
                >
                  {roman ?? `#${entry.rank}`}
                </span>
              </div>

              <div className="min-w-0">
                <p className="storm-display truncate text-[15px] font-semibold tracking-[-0.005em] text-foreground transition-colors group-hover:text-brass-bright">
                  {entry.username}
                </p>
              </div>

              <div className="text-right">
                <span className="storm-mono text-base font-bold tabular-nums text-foreground">
                  {entry.score}
                </span>
              </div>

              <div className="text-right">
                <span className="storm-mono text-xs tabular-nums text-muted">
                  {formatTime(entry.elapsed_ms)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
