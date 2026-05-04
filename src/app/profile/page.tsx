export const metadata = {
  title: "Profile — Storm Count",
};

type StatTileProps = {
  label: string;
  value: string;
  index: number;
};

function StatTile({ label, value, index }: StatTileProps) {
  return (
    <div
      style={{ ["--i" as string]: index }}
      className="codex rim-brass anim-rise-in stagger flex flex-col gap-2 rounded-md p-5"
    >
      <span className="eyebrow text-[10px] text-muted">{label}</span>
      <span
        className="storm-mono text-3xl font-bold tabular-nums text-brass-bright"
        style={{ textShadow: "0 0 16px rgba(232,193,129,0.3)" }}
      >
        {value}
      </span>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-5 py-12 sm:px-8 sm:py-16">
      {/* Identity row */}
      <header className="anim-fade-in flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="relative">
          <span
            aria-hidden
            className="absolute -inset-2 rounded-full opacity-70 blur-lg"
            style={{
              background:
                "radial-gradient(circle, rgba(232,193,129,0.35), transparent 65%)",
            }}
          />
          <div className="codex rim-brass relative flex h-20 w-20 items-center justify-center rounded-full">
            <span
              className="storm-display text-3xl text-brass-bright"
              style={{ fontVariationSettings: '"opsz" 96, "WONK" 1' }}
            >
              ?
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="eyebrow">Account</p>
          <h1
            className="storm-display text-4xl font-extrabold leading-[0.95] tracking-[-0.02em] text-foreground sm:text-5xl"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
          >
            Not signed in
          </h1>
          <p className="storm-display-italic max-w-md text-base leading-relaxed text-foreground/65">
            Sign in with Discord or Google to track stats and appear on the
            leaderboard.
          </p>
        </div>
      </header>

      {/* Stats grid */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Daily best" value="—" index={0} />
        <StatTile label="Survival best" value="—" index={1} />
        <StatTile label="Games played" value="—" index={2} />
        <StatTile label="Avg. score" value="—" index={3} />
      </section>

      {/* Recent runs */}
      <section className="codex rim-brass flex flex-col gap-4 rounded-md p-7">
        <div className="flex items-center justify-between">
          <h2
            className="storm-display text-2xl font-bold tracking-[-0.01em] text-foreground"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}
          >
            Recent runs
          </h2>
          <span className="storm-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            last 10
          </span>
        </div>
        <span aria-hidden className="rule-brass" />
        <div className="border border-rule/30 bg-background-deep/40 px-5 py-10 text-center">
          <p className="storm-display-italic text-sm text-muted">
            History will appear here once you&apos;ve played.
          </p>
        </div>
      </section>
    </div>
  );
}
