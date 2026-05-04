import { NextResponse } from "next/server";
import type { LeaderboardEntry } from "@/lib/types";

/**
 * GET /api/leaderboard?date=YYYY-MM-DD
 * Returns leaderboard entries for the given date (defaults to today, UTC).
 * Skeleton stub — wired to DB later.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  return NextResponse.json(
    {
      date,
      entries: [] as LeaderboardEntry[],
    },
    { status: 200 },
  );
}
