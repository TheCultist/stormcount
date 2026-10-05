import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and, count, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { dailySeeds, dailyScores } from "@/lib/db/schema";
import { upsertUserFromClerk } from "@/lib/db/users";
import { addDays, isValidIsoDate, todayUtc, utcOffsetDate } from "@/lib/dates";
import { scoreGuesses } from "@/lib/game";
import { REVEAL_DURATION_MS } from "@/lib/constants";
import type { SubmitScoreResponse } from "@/lib/types";

/**
 * A run that starts before 00:00 UTC may finish after it. Yesterday's date is
 * still accepted for this long into the new day.
 */
const MIDNIGHT_GRACE_MS = 60 * 60 * 1000;

/** Longest run we accept (a day); anything beyond is junk input. */
const MAX_ELAPSED_MS = 24 * 60 * 60 * 1000;

function isSubmittableDate(date: string): boolean {
  if (date === todayUtc()) return true;
  const msIntoDay = Date.now() % (24 * 60 * 60 * 1000);
  return date === utcOffsetDate(-1) && msIntoDay < MIDNIGHT_GRACE_MS;
}

/** Consecutive days (ending at `date`) this user has a Daily score for. */
async function dailyStreak(userId: string, date: string): Promise<number> {
  const rows = await db
    .select({ date: dailyScores.date })
    .from(dailyScores)
    .where(and(eq(dailyScores.userId, userId), sql`${dailyScores.date} <= ${date}`))
    .orderBy(desc(dailyScores.date))
    .limit(400);

  let streak = 0;
  let expected = date;
  for (const row of rows) {
    if (row.date !== expected) break;
    streak++;
    expected = addDays(expected, -1);
  }
  return streak;
}

function fail(error: string, status: number) {
  return NextResponse.json<SubmitScoreResponse>({ ok: false, error }, { status });
}

/**
 * POST /api/scores/submit
 *
 * Submits a Daily Challenge score. Requires authentication.
 *
 * Body: SubmitScorePayload
 * Response: SubmitScoreResponse — { ok: true, rank } or { ok: false, error }
 *
 * Server-side validation:
 *   - Only today's challenge is accepted (plus yesterday's for a short grace
 *     window after midnight UTC).
 *   - Replays the guess sequence against the stored card order; the client's
 *     score is ignored.
 *   - `elapsed_ms` is floored at the minimum the client can physically
 *     produce (every guess holds the board for REVEAL_DURATION_MS), so a
 *     forged tiny time can't win the tie-break.
 *   - Enforces one submission per user per day (duplicate → 409).
 */
export async function POST(req: NextRequest): Promise<NextResponse<SubmitScoreResponse>> {
  const { userId } = await auth();
  if (!userId) return fail("Unauthorized", 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON", 400);
  }
  const { date, elapsed_ms, guesses } = body ?? {};

  if (
    !isValidIsoDate(date) ||
    typeof elapsed_ms !== "number" ||
    !Number.isFinite(elapsed_ms) ||
    elapsed_ms < 0 ||
    elapsed_ms > MAX_ELAPSED_MS ||
    !Array.isArray(guesses) ||
    guesses.length === 0 ||
    !guesses.every((g) => g === "higher" || g === "lower")
  ) {
    return fail("Invalid submission", 400);
  }
  if (!isSubmittableDate(date)) {
    return fail("Only today's challenge can be submitted", 400);
  }

  try {
    const seed = await db.query.dailySeeds.findFirst({
      where: eq(dailySeeds.date, date),
      columns: { cards: true },
    });
    if (!seed) return fail("No seed for this date", 404);

    const cards = seed.cards;
    if (guesses.length > cards.length - 1) {
      return fail("Invalid submission", 400);
    }

    // ── Server-side replay: recount correct guesses (same rule as the client) ─
    const verifiedScore = scoreGuesses(cards, guesses).filter(Boolean).length;

    const timeMs = Math.max(
      Math.round(elapsed_ms),
      guesses.length * REVEAL_DURATION_MS,
    );

    await upsertUserFromClerk(userId);

    // ── Insert score (unique constraint prevents duplicates) ──────────────
    const [inserted] = await db
      .insert(dailyScores)
      .values({ id: `${userId}-${date}`, userId, date, score: verifiedScore, timeMs })
      .onConflictDoNothing()
      .returning({ id: dailyScores.id });
    if (!inserted) return fail("Already submitted for today", 409);

    // ── Compute rank: position by (score DESC, time_ms ASC) ──────────────
    const [{ betterCount }] = await db
      .select({ betterCount: count() })
      .from(dailyScores)
      .where(
        and(
          eq(dailyScores.date, date),
          sql`(${dailyScores.score} > ${verifiedScore} OR (${dailyScores.score} = ${verifiedScore} AND ${dailyScores.timeMs} < ${timeMs}))`,
        ),
      );

    return NextResponse.json({
      ok: true,
      rank: Number(betterCount) + 1,
      streak: await dailyStreak(userId, date),
    });
  } catch (err) {
    console.error("[scores/submit] error:", err);
    return fail("Couldn't save your score", 500);
  }
}
