import { NextResponse } from "next/server";
import type { SubmitScoreResponse } from "@/lib/types";

/**
 * POST /api/scores/submit
 * Authenticated — submits Daily score + time for leaderboard ranking.
 * Skeleton stub — auth + validation + DB write wired later.
 */
export async function POST(): Promise<NextResponse<SubmitScoreResponse>> {
  return NextResponse.json({ ok: true, rank: null }, { status: 200 });
}
