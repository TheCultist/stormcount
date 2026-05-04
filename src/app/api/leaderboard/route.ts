import { NextResponse } from "next/server";
import { eq, desc, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { dailyScores, users } from "@/lib/db/schema";
import { LEADERBOARD_TOP_N } from "@/lib/constants";
import type { LeaderboardEntry } from "@/lib/types";

// Cache for 60 seconds — leaderboard is updated infrequently relative to reads.
export const revalidate = 60;

/**
 * GET /api/leaderboard?date=YYYY-MM-DD
 *
 * Returns the top LEADERBOARD_TOP_N entries for the given date (defaults to today UTC).
 * Sorted by score descending, then elapsed time ascending (faster wins ties).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  try {
    const rows = await db
      .select({
        username: users.username,
        imageUrl: users.imageUrl,
        score: dailyScores.score,
        timeMs: dailyScores.timeMs,
      })
      .from(dailyScores)
      .innerJoin(users, eq(dailyScores.userId, users.id))
      .where(eq(dailyScores.date, date))
      .orderBy(desc(dailyScores.score), asc(dailyScores.timeMs))
      .limit(LEADERBOARD_TOP_N);

    const entries: LeaderboardEntry[] = rows.map((row, i) => ({
      rank: i + 1,
      username: row.username,
      score: row.score,
      elapsed_ms: row.timeMs,
    }));

    return NextResponse.json({ date, entries });
  } catch (err) {
    console.error("[leaderboard] error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
