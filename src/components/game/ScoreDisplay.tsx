type ScoreDisplayProps = {
  score: number;
  label?: string;
  total?: number; // optional — e.g. 100 for Daily
};

export default function ScoreDisplay({
  score,
  label = "Storm count",
  total,
}: ScoreDisplayProps) {
  const hasTotal = typeof total === "number" && total > 0;
  const pct = hasTotal ? Math.min(100, (score / total!) * 100) : 0;

  return (
    <div className="codex rim-brass flex min-w-[8.5rem] flex-col gap-2 rounded-md px-4 py-2.5 sm:min-w-[12rem] sm:gap-2.5 sm:px-5 sm:py-3.5">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <span className="eyebrow text-[10px] text-muted">{label}</span>
        <div className="flex items-baseline gap-1">
          <span
            className="storm-mono text-xl font-bold tabular-nums text-brass-bright sm:text-2xl"
            style={{
              textShadow: "0 0 16px rgba(232,193,129,0.35)",
            }}
          >
            {score}
          </span>
          {hasTotal ? (
            <span className="storm-mono text-sm tabular-nums text-muted/70">
              / {total}
            </span>
          ) : null}
        </div>
      </div>

      {hasTotal ? (
        <div className="relative h-[3px] w-full overflow-hidden bg-background-deep/60">
          <span
            className="absolute inset-y-0 left-0 transition-[width] duration-500 ease-out"
            style={{
              width: `${pct}%`,
              background:
                "linear-gradient(90deg, var(--brass-deep), var(--brass-bright))",
              boxShadow: "0 0 12px rgba(232,193,129,0.55)",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
