import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, dailySeeds, dailyScores } from "@/lib/db/schema";
import type { SubmitScorePayload, SubmitScoreResponse } from "@/lib/types";

/**
 * POST /api/scores/submit
 *
 * Submits a Daily Challenge score. Requires authentication.
 *
 * Body: SubmitScorePayload
 * Response: SubmitScoreResponse — { ok: true, rank } or { ok: false, error }
 *
 * Server-side validation:
 *   - Verifies the seed for the given date exists in the DB.
 *   - Replays the guess sequence against the stored card order.
 *   - Enforces one submission per user per day (duplicate → 409).
 */
export async function POST(req: NextRequest): Promise<NextResponse<SubmitScoreResponse>> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: SubmitScorePayload;
  try {
    body = (await req.json()) as SubmitScorePayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { date, score: _clientScore, elapsed_ms, guesses } = body;

  if (!date || typeof elapsed_ms !== "number" || !Array.isArray(guesses)) {
    return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
  }

  try {
    // ── Resolve today's seed ──────────────────────────────────────────────
    const seed = await db.query.dailySeeds.findFirst({
      where: eq(dailySeeds.date, date),
    });
    if (!seed) {
      return NextResponse.json({ ok: false, error: "No seed for this date" }, { status: 404 });
    }

    // ── Server-side replay: recount correct guesses ───────────────────────
    const cards = seed.cards;
    let verifiedScore = 0;
    for (let i = 0; i < guesses.length && i < cards.length - 1; i++) {
      const anchor = cards[i];
      const mystery = cards[i + 1];
      const correct =
        guesses[i] === "higher"
          ? mystery.cmc >= anchor.cmc
          : mystery.cmc < anchor.cmc;
      if (correct) verifiedScore++;
    }

    // ── Upsert user record from Clerk ─────────────────────────────────────
    // Must happen before score insert to satisfy the FK constraint.
    const clerkUser = await currentUser();
    await db
      .insert(users)
      .values({
        id: userId,
        username: clerkUser?.username ?? clerkUser?.firstName ?? "Planeswalker",
        imageUrl: clerkUser?.imageUrl ?? null,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          username: clerkUser?.username ?? clerkUser?.firstName ?? "Planeswalker",
          imageUrl: clerkUser?.imageUrl ?? null,
        },
      });

    // ── Insert score (unique constraint prevents duplicates) ──────────────
    const scoreId = `${userId}-${date}`;
    try {
      await db.insert(dailyScores).values({
        id: scoreId,
        userId,
        date,
        score: verifiedScore,
        timeMs: elapsed_ms,
      });
    } catch (insertErr) {
      const msg = insertErr instanceof Error ? insertErr.message : "";
      if (msg.includes("unique") || msg.includes("duplicate")) {
        return NextResponse.json({ ok: false, error: "Already submitted for today" }, { status: 409 });
      }
      throw insertErr;
    }

    // ── Compute rank: position by (score DESC, time_ms ASC) ──────────────
    const [{ betterCount }] = await db
      .select({
        betterCount: count(),
      })
      .from(dailyScores)
      .where(
        and(
          eq(dailyScores.date, date),
          sql`(${dailyScores.score} > ${verifiedScore} OR (${dailyScores.score} = ${verifiedScore} AND ${dailyScores.timeMs} < ${elapsed_ms}))`,
        ),
      );

    const rank = Number(betterCount) + 1;

    return NextResponse.json({ ok: true, rank });
  } catch (err) {
    console.error("[scores/submit] error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
