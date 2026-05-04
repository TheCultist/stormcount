import CardDisplay from "@/components/game/CardDisplay";
import GuessButtons from "@/components/game/GuessButtons";
import ScoreDisplay from "@/components/game/ScoreDisplay";
import { DAILY_SEED_SIZE } from "@/lib/constants";

export const metadata = {
  title: "Daily Challenge — Storm Count",
};

export default function DailyPage() {
  // Skeleton view: static placeholders. Real game state wired in a later pass.
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-5 py-12 sm:px-8 sm:py-16">
      {/* Header */}
      <header className="anim-fade-in flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-2.5">
          <p className="eyebrow flex items-center gap-2.5">
            <span aria-hidden className="h-1 w-1 rotate-45 bg-brass-bright anim-pulse" />
            Daily Challenge
            <span className="text-muted/60">·</span>
            <span className="storm-mono text-[10px] tracking-[0.22em] text-muted/80">
              {today}
            </span>
          </p>
          <h1
            className="storm-display text-4xl font-extrabold leading-[0.95] tracking-[-0.02em] text-foreground sm:text-5xl"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
          >
            Higher{" "}
            <span className="storm-display-italic font-semibold text-muted/50">or</span>{" "}
            <span className="text-brass-bright">Lower</span>
          </h1>
        </div>
        <ScoreDisplay score={0} total={DAILY_SEED_SIZE} />
      </header>

      {/* Tie-rule hint — codex stamp */}
      <p className="storm-mono inline-flex w-fit items-center gap-2.5 self-start border border-rule/40 bg-paper/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-foreground/70">
        <span aria-hidden className="h-1 w-1 rotate-45 bg-moonsilver" />
        Tie rule · equal mv counts as Higher or Equal
      </p>

      {/* Versus arena */}
      <section className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-center lg:gap-12">
        <CardDisplay mode="anchor" />

        <div className="flex flex-col items-center gap-3">
          <span
            aria-hidden
            className="hidden h-16 w-px bg-gradient-to-b from-transparent via-brass/40 to-transparent lg:block"
          />
          {/* "vs" stamp — codex insignia */}
          <span
            className="storm-display relative flex h-12 w-12 items-center justify-center rounded-full border border-brass/50 bg-background-deep/70 text-[11px] font-extrabold uppercase tracking-[0.3em] text-brass-bright"
            style={{ fontVariationSettings: '"opsz" 96, "WONK" 1' }}
          >
            <span
              aria-hidden
              className="absolute inset-[-4px] rounded-full opacity-60 blur-md"
              style={{
                background:
                  "radial-gradient(circle, rgba(232,193,129,0.4), transparent 70%)",
              }}
            />
            <span className="relative">vs</span>
          </span>
          <span
            aria-hidden
            className="hidden h-16 w-px bg-gradient-to-b from-transparent via-moonsilver/40 to-transparent lg:block"
          />
        </div>

        <CardDisplay mode="mystery" />
      </section>

      {/* Action row */}
      <section className="flex justify-center pt-2">
        <GuessButtons />
      </section>
    </div>
  );
}
