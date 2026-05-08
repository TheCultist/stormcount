import Image from "next/image";
import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, max, count, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { dailyScores, survivalBests } from "@/lib/db/schema";
import { ROUTES } from "@/lib/constants";
import CavernHoldBanner from "@/components/affiliate/CavernHoldBanner";

export const metadata = {
  title: "Profile — Storm Count",
};

const CAVERNHOLD_URL = process.env.CAVERNHOLD_AFFILIATE_LINK ?? null;

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtTime(ms: number): string {
  const s = ms / 1000;
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(2);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  index,
}: {
  label: string;
  value: string;
  index: number;
}) {
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

// ── not-signed-in fallback ────────────────────────────────────────────────────

function SignedOut() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-5 py-12 sm:px-8 sm:py-16">
      <header className="anim-fade-in flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="codex rim-brass flex h-20 w-20 items-center justify-center rounded-full">
          <span
            className="storm-display text-3xl text-brass-bright"
            style={{ fontVariationSettings: '"opsz" 96, "WONK" 1' }}
          >
            ?
          </span>
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
            Sign in with Discord or Google to track stats and appear on the leaderboard.
          </p>
        </div>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {["Daily best", "Best rank", "Days played", "Survival best"].map(
          (label, i) => (
            <StatTile key={label} label={label} value="—" index={i} />
          ),
        )}
      </section>
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default async function ProfilePage() {
  const { userId } = await auth();

  if (!userId) return <SignedOut />;

  // Fetch Clerk profile and DB stats in parallel.
  const [clerkUser, [statsRow], recentRuns, bestRankResult, [survivalRow]] = await Promise.all([
    currentUser(),
    db
      .select({
        best: max(dailyScores.score),
        played: count(dailyScores.id),
      })
      .from(dailyScores)
      .where(eq(dailyScores.userId, userId)),
    db
      .select({
        date: dailyScores.date,
        score: dailyScores.score,
        timeMs: dailyScores.timeMs,
      })
      .from(dailyScores)
      .where(eq(dailyScores.userId, userId))
      .orderBy(desc(dailyScores.date))
      .limit(10),
    // Best leaderboard position ever — computed via window function.
    // Ranks all players per day (score DESC, time ASC), then finds the user's best.
    db.execute(
      sql`
        SELECT MIN(rk)::int AS best_rank
        FROM (
          SELECT
            user_id,
            RANK() OVER (PARTITION BY date ORDER BY score DESC, time_ms ASC) AS rk
          FROM daily_scores
        ) ranked
        WHERE user_id = ${userId}
      `,
    ),
    db
      .select({ bestStreak: survivalBests.bestStreak })
      .from(survivalBests)
      .where(eq(survivalBests.userId, userId)),
  ]);

  const displayName =
    clerkUser?.username ?? clerkUser?.firstName ?? "Planeswalker";
  const avatarUrl = clerkUser?.imageUrl ?? null;

  const best = statsRow?.best;
  const played = statsRow?.played ?? 0;
  const bestRank = (bestRankResult.rows[0]?.best_rank as number | null) ?? null;
  const survivalBest = survivalRow?.bestStreak ?? null;

  // Max possible score per day = 50 (51 cards → 50 pairs).
  const MAX_DAILY = 50;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-5 py-12 sm:px-8 sm:py-16">
      {/* Identity row */}
      <header className="anim-fade-in flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="relative shrink-0">
          <span
            aria-hidden
            className="absolute -inset-2 rounded-full opacity-70 blur-lg"
            style={{
              background:
                "radial-gradient(circle, rgba(232,193,129,0.35), transparent 65%)",
            }}
          />
          <div className="codex rim-brass relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <span
                className="storm-display text-3xl text-brass-bright"
                style={{ fontVariationSettings: '"opsz" 96, "WONK" 1' }}
              >
                {displayName[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="eyebrow">Account</p>
          <h1
            className="storm-display text-4xl font-extrabold leading-[0.95] tracking-[-0.02em] text-foreground sm:text-5xl"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
          >
            {displayName}
          </h1>
          {played === 0 && (
            <p className="storm-display-italic max-w-md text-base leading-relaxed text-foreground/55">
              No games played yet — start with today&apos;s{" "}
              <Link href={ROUTES.daily} className="text-brass-bright underline-offset-4 hover:underline">
                Daily Challenge
              </Link>
              .
            </p>
          )}
        </div>
      </header>

      {/* Stats grid */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Daily best"
          value={best != null ? `${best} / ${MAX_DAILY}` : "—"}
          index={0}
        />
        <StatTile
          label="Best rank"
          value={bestRank != null ? `#${bestRank}` : "—"}
          index={1}
        />
        <StatTile
          label="Days played"
          value={played > 0 ? String(played) : "—"}
          index={2}
        />
        <StatTile
          label="Survival best"
          value={survivalBest != null ? String(survivalBest) : "—"}
          index={3}
        />
      </section>

      {/* CavernHold banner */}
      <CavernHoldBanner
        href={CAVERNHOLD_URL}
        copy="Your decks are worth protecting. CavernHold keeps them ready."
      />

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
            last {recentRuns.length}
          </span>
        </div>
        <span aria-hidden className="rule-brass" />

        {recentRuns.length === 0 ? (
          <div className="border border-rule/30 bg-background-deep/40 px-5 py-10 text-center">
            <p className="storm-display-italic text-sm text-muted">
              History will appear here once you&apos;ve played.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-rule/20">
            {recentRuns.map((run) => {
              const pct = Math.round((run.score / MAX_DAILY) * 100);
              const isPerfect = run.score === MAX_DAILY;
              return (
                <div
                  key={run.date}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  {/* Date */}
                  <Link
                    href={ROUTES.leaderboardDate(run.date)}
                    className="storm-mono text-[11px] uppercase tracking-[0.18em] text-muted/70 transition-colors hover:text-brass-bright"
                  >
                    {run.date}
                  </Link>

                  {/* Score bar */}
                  <div className="flex flex-1 items-center gap-3">
                    <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-background-deep">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-brass/60 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Score + time */}
                  <div className="flex items-center gap-3">
                    <span
                      className={[
                        "storm-mono text-sm font-bold tabular-nums",
                        isPerfect ? "text-brass-bright" : "text-foreground",
                      ].join(" ")}
                    >
                      {run.score}
                      <span className="text-[10px] font-normal text-muted/60">
                        /{MAX_DAILY}
                      </span>
                    </span>
                    <span className="storm-mono text-[10px] text-muted/50">
                      {fmtTime(run.timeMs)}
                    </span>
                    {isPerfect && (
                      <span className="storm-mono text-[9px] uppercase tracking-[0.2em] text-brass-bright">
                        perfect
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
