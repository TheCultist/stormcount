import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { dailySeeds } from "@/lib/db/schema";
import { generateDailyCards } from "@/lib/scryfall/seedGenerator";

/** Returns tomorrow's date in UTC as "yyyy-mm-dd". */
function tomorrow(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Checks if a Clerk userId is listed in the ADMIN_USER_IDS env var. */
function isAdmin(userId: string): boolean {
  const ids =
    process.env.ADMIN_USER_IDS?.split(",")
      .map((id) => id.trim())
      .filter(Boolean) ?? [];
  return ids.includes(userId);
}

/**
 * POST /api/admin/seed
 *
 * Pre-generates (or force-regenerates) the daily seed for a given date.
 * Useful for scheduling seeds ahead of time and for testing.
 *
 * Request body (all optional):
 *   {
 *     date?:  string   // ISO "yyyy-mm-dd", defaults to tomorrow (UTC)
 *     force?: boolean  // if true, overwrites an existing seed for that date
 *   }
 *
 * Auth: Clerk-authenticated user whose userId appears in ADMIN_USER_IDS.
 *
 * Responses:
 *   200 — seed already exists and force was false (no-op)
 *   201 — seed created or regenerated
 *   400 — invalid date format
 *   401 — not authenticated
 *   403 — authenticated but not an admin
 *   502 — Scryfall or DB error
 */
export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { date?: unknown; force?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine — use defaults
  }

  const targetDate =
    typeof body.date === "string" && body.date ? body.date : tomorrow();
  const force = body.force === true;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    return NextResponse.json(
      { error: 'Invalid date format — expected "yyyy-mm-dd"' },
      { status: 400 },
    );
  }

  try {
    const existing = await db.query.dailySeeds.findFirst({
      where: eq(dailySeeds.date, targetDate),
    });

    if (existing && !force) {
      return NextResponse.json(
        {
          message: "Seed already exists for this date (pass force:true to regenerate)",
          date: targetDate,
          cardCount: (existing.cards as unknown[]).length,
          themed: existing.themed ?? null,
        },
        { status: 200 },
      );
    }

    const cards = await generateDailyCards();

    if (existing) {
      // force regenerate — update cards, leave themed label intact
      await db
        .update(dailySeeds)
        .set({ cards })
        .where(eq(dailySeeds.date, targetDate));
    } else {
      await db
        .insert(dailySeeds)
        .values({ id: targetDate, date: targetDate, cards, themed: null });
    }

    return NextResponse.json(
      {
        message: existing ? "Seed regenerated" : "Seed generated",
        date: targetDate,
        cardCount: cards.length,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[admin/seed] error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
