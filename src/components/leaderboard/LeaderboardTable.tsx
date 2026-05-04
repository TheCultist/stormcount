import Image from "next/image";
import type { LeaderboardEntry } from "@/lib/types";

type LeaderboardTableProps = {
  entries: LeaderboardEntry[];
  currentUserId?: string | null;
  emptyLabel?: string;
};

function formatTime(ms: number): string {
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60);
  const s = (totalSec % 60).toFixed(2);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

const ROMAN: Record<number, string> = { 1: "I", 2: "II", 3: "III" };

function rankAccent(rank: number): {
  badge: string;
  text: string;
  glow: string;
} {
  if (rank === 1) {
    return {
      badge: "border-brass-bright/80 bg-gradient-to-b from-brass-bright/30 to-brass/10",
      text: "text-brass-bright",
      glow: "shadow-[0_0_24px_-6px_rgba(232,193,129,0.65)]",
    };
  }
  if (rank === 2) {
    return {
      badge: "border-foreground/35 bg-foreground/[0.06]",
      text: "text-foreground",
      glow: "",
    };
  }
  if (rank === 3) {
    return {
      badge: "border-crimson/40 bg-crimson/10",
      text: "text-crimson-bright",
      glow: "",
    };
  }
  return {
    badge: "border-border-subtle bg-background-deep/40",
    text: "text-muted",
    glow: "",
  };
}

function Avatar({
  username,
  imageUrl,
  size = 32,
}: {
  username: string;
  imageUrl?: string | null;
  size?: number;
}) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={username}
        width={size}
        height={size}
        className="rounded-full object-cover"
        unoptimized
      />
    );
  }
  const initial = username.slice(0, 1).toUpperCase();
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-brass/20 text-[11px] font-bold text-brass-bright"
      style={{ width: size, height: size }}
    >
      {initial}
    </div>
  );
}

export default function LeaderboardTable({
  entries,
  currentUserId,
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
      {/* Header row */}
      <div className="grid grid-cols-[4rem_1fr_5rem_5.5rem] items-center gap-3 border-b border-rule/40 bg-paper-3/40 px-5 py-3 sm:grid-cols-[5rem_1fr_6rem_7rem]">
        <span className="eyebrow text-[10px] text-muted">Rank</span>
        <span className="eyebrow text-[10px] text-muted">Player</span>
        <span className="eyebrow text-right text-[10px] text-muted">Score</span>
        <span className="eyebrow text-right text-[10px] text-muted">Time</span>
      </div>

      <ul className="divide-y divide-rule/30">
        {entries.map((entry, i) => {
          const a = rankAccent(entry.rank);
          const roman = ROMAN[entry.rank];
          const isMe = !!currentUserId && entry.userId === currentUserId;

          return (
            <li
              key={`${entry.rank}-${entry.username}`}
              style={{ ["--i" as string]: i }}
              className={`anim-fade-in stagger group grid grid-cols-[4rem_1fr_5rem_5.5rem] items-center gap-3 px-5 py-3.5 transition-colors duration-200 sm:grid-cols-[5rem_1fr_6rem_7rem] ${
                isMe
                  ? "bg-brass/[0.07] hover:bg-brass/[0.10]"
                  : "hover:bg-brass/[0.04]"
              }`}
            >
              {/* Rank badge */}
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

              {/* Avatar + username */}
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar username={entry.username} imageUrl={entry.imageUrl} size={30} />
                <div className="min-w-0">
                  <p className="storm-display truncate text-[15px] font-semibold tracking-[-0.005em] text-foreground transition-colors group-hover:text-brass-bright">
                    {entry.username}
                  </p>
                  {isMe && (
                    <span className="storm-mono rounded-sm bg-brass/20 px-1 py-px text-[9px] font-bold uppercase tracking-[0.15em] text-brass-bright">
                      you
                    </span>
                  )}
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <span className="storm-mono text-base font-bold tabular-nums text-foreground">
                  {entry.score}
                </span>
              </div>

              {/* Time */}
              <div className="text-right">
                <span className="storm-mono text-xs tabular-nums text-foreground/65">
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
