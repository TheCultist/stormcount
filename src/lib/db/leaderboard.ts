import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dailyScores, users } from "@/lib/db/schema";
import { LEADERBOARD_TOP_N } from "@/lib/constants";
import type { LeaderboardEntry } from "@/lib/types";

/**
 * Fetch the top-N leaderboard for a given UTC date string (yyyy-mm-dd).
 * Ranked by score DESC, then timeMs ASC (faster wins ties).
 */
export async function getLeaderboard(date: string): Promise<LeaderboardEntry[]> {
  const rows = await db
    .select({
      userId: dailyScores.userId,
      score: dailyScores.score,
      timeMs: dailyScores.timeMs,
      username: users.username,
      imageUrl: users.imageUrl,
    })
    .from(dailyScores)
    .innerJoin(users, eq(dailyScores.userId, users.id))
    .where(eq(dailyScores.date, date))
    .orderBy(desc(dailyScores.score), asc(dailyScores.timeMs))
    .limit(LEADERBOARD_TOP_N);

  return rows.map((row, i) => ({
    rank: i + 1,
    userId: row.userId,
    username: row.username,
    imageUrl: row.imageUrl,
    score: row.score,
    elapsed_ms: row.timeMs,
  }));
}
