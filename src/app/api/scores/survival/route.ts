import { auth } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { survivalBests } from "@/lib/db/schema";
import { upsertUserFromClerk } from "@/lib/db/users";

/**
 * Sanity cap on a submitted streak. Survival runs are scored client-side, so
 * this can't prove a score is honest; it only keeps junk (floats, 1e308,
 * values that overflow the int4 column) out of the table.
 */
const MAX_STREAK = 10_000;

/**
 * POST /api/scores/survival — record a survival streak; keeps the user's best.
 * Body: { score: number }. Response: { ok: true, best }.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const score: unknown = body?.score;
  if (typeof score !== "number" || !Number.isInteger(score) || score < 0 || score > MAX_STREAK) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }

  try {
    await upsertUserFromClerk(userId);

    // Upsert: insert new row or update only if the incoming score is higher.
    await db
      .insert(survivalBests)
      .values({ userId, bestStreak: score })
      .onConflictDoUpdate({
        target: survivalBests.userId,
        set: {
          bestStreak: sql`GREATEST(${survivalBests.bestStreak}, EXCLUDED.best_streak)`,
          updatedAt: sql`NOW()`,
        },
      });

    const [row] = await db
      .select({ bestStreak: survivalBests.bestStreak })
      .from(survivalBests)
      .where(eq(survivalBests.userId, userId));

    return NextResponse.json({ ok: true, best: row?.bestStreak ?? score });
  } catch (err) {
    console.error("[scores/survival] error:", err);
    return NextResponse.json({ error: "Couldn't save your score" }, { status: 500 });
  }
}
