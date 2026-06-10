import Image from "next/image";
import type { LeaderboardEntry } from "@/lib/types";
import { DAILY_SEED_SIZE } from "@/lib/constants";

const DAILY_MAX_SCORE = DAILY_SEED_SIZE - 1;

// Amber-gold crown color — intentionally hardcoded so it stays amber
// regardless of which Izzet theme variable `--brass` maps to.
const CROWN_AMBER = "#d4902a";
const CROWN_AMBER_BG = "rgba(212, 144, 42, 0.12)";
const CROWN_AMBER_BORDER = "rgba(212, 144, 42, 0.55)";

function CrownIcon({ className, style, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      style={style}
      {...props}
    >
      <path d="M2 13h12v1.5H2V13zm0-1L3 5l3.5 3L8 2l1.5 6L13 5l1 7H2z" />
    </svg>
  );
}

type LeaderboardTableProps = {
  entries: LeaderboardEntry[];
  currentUserId?: string | null;
  emptyLabel?: string;
};

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const CROWN_RANKS = new Set([1, 2, 3]);

/** Row background tint for top-3 entries */
function topRowStyle(rank: number): React.CSSProperties {
  if (rank === 1) return { background: "rgba(212,144,42,0.09)" };
  if (rank === 2) return { background: "rgba(220,230,240,0.05)" };
  if (rank === 3) return { background: "rgba(184,56,40,0.07)" };
  return {};
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
      className="flex shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
      style={{
        width: size,
        height: size,
        background: "rgba(30,112,192,0.18)",
        color: "#4da8e8",
      }}
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
    <div
      className="overflow-hidden rounded-md"
      style={{
        background: "rgba(10,16,28,0.70)",
        border: "1px solid rgba(30,112,192,0.22)",
        borderLeft: "3px solid #1e70c0",
      }}
    >
      {/* Column header */}
      <div
        className="grid grid-cols-[2.75rem_minmax(0,1fr)_4.25rem_3.5rem] items-center gap-2 px-3 py-3 sm:grid-cols-[5.5rem_1fr_6.5rem_7.5rem] sm:gap-3 sm:px-5"
        style={{ borderBottom: "1px solid rgba(220,230,240,0.10)" }}
      >
        <span className="storm-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Rank</span>
        <span className="storm-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Player</span>
        <span className="storm-mono text-right text-[10px] uppercase tracking-[0.22em] text-foreground/40">Score</span>
        <span className="storm-mono text-right text-[10px] uppercase tracking-[0.22em] text-foreground/40">
          Time<span className="hidden sm:inline"> (MM:SS)</span>
        </span>
      </div>

      <ul>
        {entries.map((entry, i) => {
          const isTop = CROWN_RANKS.has(entry.rank);
          const isMe = !!currentUserId && entry.userId === currentUserId;
          const rowPy = isTop ? "py-5" : "py-3";

          return (
            <li
              key={`${entry.rank}-${entry.username}`}
              style={{
                ["--i" as string]: i,
                ...topRowStyle(entry.rank),
                ...(isMe ? { background: "rgba(30,112,192,0.09)" } : {}),
              }}
              className={`anim-fade-in stagger group grid grid-cols-[2.75rem_minmax(0,1fr)_4.25rem_3.5rem] items-center gap-2 px-3 ${rowPy} transition-colors duration-200 hover:brightness-110 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-white/[0.05] sm:grid-cols-[5.5rem_1fr_6.5rem_7.5rem] sm:gap-3 sm:px-5`}
            >
              {/* Rank */}
              <div className="flex items-center gap-2">
                {isTop ? (
                  <>
                    <CrownIcon
                      className="h-4 w-4 shrink-0 sm:h-5 sm:w-5"
                      style={{ color: CROWN_AMBER }}
                      aria-hidden
                    />
                    <span
                      className="storm-display text-lg font-extrabold tabular-nums sm:text-2xl"
                      style={{
                        color: CROWN_AMBER,
                        fontVariationSettings: '"opsz" 96, "WONK" 0',
                      }}
                    >
                      {entry.rank}
                    </span>
                  </>
                ) : (
                  <span
                    className="storm-mono text-sm tabular-nums"
                    style={{ color: "rgba(220,230,240,0.35)" }}
                  >
                    {entry.rank}
                  </span>
                )}
              </div>

              {/* Avatar + username */}
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar username={entry.username} imageUrl={entry.imageUrl} size={isTop ? 34 : 28} />
                <div className="min-w-0">
                  <p
                    className="storm-display truncate font-semibold tracking-[-0.005em] text-foreground"
                    style={{ fontSize: isTop ? "1rem" : "0.875rem" }}
                  >
                    {entry.username}
                  </p>
                  {isMe && (
                    <span
                      className="storm-mono rounded-sm px-1 py-px text-[9px] font-bold uppercase tracking-[0.15em]"
                      style={{
                        background: "rgba(30,112,192,0.18)",
                        color: "#4da8e8",
                      }}
                    >
                      you
                    </span>
                  )}
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <span
                  className="storm-mono tabular-nums font-bold"
                  style={{
                    fontSize: isTop ? "1rem" : "0.85rem",
                    color: isTop ? "#ffffff" : "rgba(220,230,240,0.75)",
                  }}
                >
                  {entry.score}/{DAILY_MAX_SCORE}
                </span>
              </div>

              {/* Time */}
              <div className="text-right">
                <span
                  className="storm-mono tabular-nums"
                  style={{
                    fontSize: isTop ? "0.9rem" : "0.78rem",
                    color: "rgba(220,230,240,0.50)",
                  }}
                >
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
