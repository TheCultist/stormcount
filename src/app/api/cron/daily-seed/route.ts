import { NextResponse } from "next/server";
import { getOrCreateDailySeed } from "@/lib/dailySeed";
import { utcOffsetDate } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/daily-seed — invoked by Vercel Cron (see `vercel.json`).
 *
 * Pre-generates tomorrow's seed so the first visitor after 00:00 UTC doesn't
 * pay for the ~24MB bulk download (and a burst of concurrent first visitors
 * doesn't each pay for it). Idempotent: an existing seed is left untouched.
 * Today's lazy generation in `/api/cards/daily` remains the fallback.
 *
 * Auth: Vercel sends `Authorization: Bearer $CRON_SECRET` when the env var
 * is set. Without CRON_SECRET configured the route refuses to run.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = utcOffsetDate(1);
  try {
    const seed = await getOrCreateDailySeed(date);
    return NextResponse.json({
      date,
      cardCount: seed.cards.length,
      themed: seed.themed ?? null,
    });
  } catch (err) {
    console.error("[cron/daily-seed] error:", err);
    return NextResponse.json({ error: "Seed generation failed" }, { status: 502 });
  }
}
