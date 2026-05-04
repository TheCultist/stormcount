import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { dailySeeds, dailyScores } from "@/lib/db/schema";
import { generateDailyCards } from "@/lib/scryfall/seedGenerator";

// Response is per-user (alreadyPlayed field), so no route-level cache.
export const dynamic = "force-dynamic";

/**
 * GET /api/cards/daily
 *
 * Returns today's seeded 100-card list plus whether the authenticated user
 * has already submitted a score today (checked against daily_scores in the DB).
 *
 * The seed is generated lazily on the first request of the day (UTC) and
 * stored in the database.  All subsequent requests — even concurrent ones —
 * return the same stored seed, guaranteeing every player sees identical cards.
 *
 * Race-condition safety: if two requests arrive simultaneously on a new day,
 * both may call Scryfall.  onConflictDoNothing() ensures only the first insert
 * wins; the loser re-fetches the winner's row.
 */
export async function GET() {
  const today = new Date().toISOString().slice(0, 10); // "yyyy-mm-dd" UTC

  // Optional auth — unauthenticated users always get alreadyPlayed: false.
  const { userId } = await auth();

  try {
    // ── Resolve today's seed ───────────────────────────────────────────────

    let seedDate: string;
    let themed: string | null;
    let cards: unknown;

    const existing = await db.query.dailySeeds.findFirst({
      where: eq(dailySeeds.date, today),
    });

    if (existing) {
      seedDate = existing.date;
      themed = existing.themed ?? null;
      cards = existing.cards;
    } else {
      // First request of the day — generate and persist.
      const generated = await generateDailyCards();

      const [inserted] = await db
        .insert(dailySeeds)
        .values({ id: today, date: today, cards: generated, themed: null })
        .onConflictDoNothing()
        .returning();

      if (!inserted) {
        // Another concurrent request won the insert race — fetch the canonical seed.
        const canonical = await db.query.dailySeeds.findFirst({
          where: eq(dailySeeds.date, today),
        });
        seedDate = canonical!.date;
        themed = canonical!.themed ?? null;
        cards = canonical!.cards;
      } else {
        seedDate = today;
        themed = null;
        cards = generated;
      }
    }

    // ── Check whether this user has already submitted today ────────────────

    let alreadyPlayed = false;
    if (userId) {
      const score = await db.query.dailyScores.findFirst({
        where: and(
          eq(dailyScores.userId, userId),
          eq(dailyScores.date, today),
        ),
        columns: { id: true },
      });
      alreadyPlayed = score != null;
    }

    return NextResponse.json({ date: seedDate, themed, cards, alreadyPlayed });
  } catch (err) {
    console.error("[daily] error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
