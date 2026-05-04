import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import type { GameMode } from "@/lib/types";

type GameOverScreenProps = {
  mode: GameMode;
  score: number;
  elapsed_ms?: number;
  onRestart?: () => void;
};

export default function GameOverScreen({
  mode,
  score,
  elapsed_ms,
  onRestart,
}: GameOverScreenProps) {
  const isDaily = mode === "daily";
  return (
    <section className="relative mx-auto w-full max-w-md">
      {/* Warm halo */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-md opacity-80"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(232,193,129,0.18), transparent 65%)",
          filter: "blur(28px)",
        }}
      />

      <div className="codex rim-brass anim-rise-in flex flex-col items-center gap-6 rounded-md p-10 text-center">
        <p className="eyebrow text-brass-bright">Run complete</p>

        <h2
          className="storm-display text-4xl font-extrabold leading-none tracking-[-0.02em] text-foreground"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
        >
          Game over
        </h2>

        <span aria-hidden className="rule-brass max-w-[8rem]" />

        {/* Score */}
        <div className="my-2 flex flex-col items-center gap-2">
          <span className="eyebrow text-[10px] text-muted">Storm count</span>
          <span
            className="storm-mono text-7xl font-extrabold tabular-nums text-brass-bright anim-ink-bleed"
            style={{
              textShadow:
                "0 0 32px rgba(232,193,129,0.5), 0 0 64px rgba(232,193,129,0.22)",
            }}
          >
            {score}
          </span>
        </div>

        {/* Stamp metadata */}
        <div className="storm-mono flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[10px] uppercase tracking-[0.22em] text-muted">
          <span className="border border-rule/50 bg-background-deep/30 px-2.5 py-1">
            mode · {mode}
          </span>
          {typeof elapsed_ms === "number" ? (
            <span className="border border-rule/50 bg-background-deep/30 px-2.5 py-1">
              time · {(elapsed_ms / 1000).toFixed(2)}s
            </span>
          ) : null}
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          {onRestart ? (
            <button type="button" onClick={onRestart} className="btn-primary">
              Play again
            </button>
          ) : null}
          <Link
            href={isDaily ? ROUTES.leaderboard : ROUTES.home}
            className="btn-ghost"
          >
            {isDaily ? "Leaderboard" : "Home"}
          </Link>
        </div>
      </div>
    </section>
  );
}
