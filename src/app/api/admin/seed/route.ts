import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { dailySeeds } from "@/lib/db/schema";
import { isAdmin } from "@/lib/auth/admin";
import { isValidIsoDate, todayUtc, utcOffsetDate } from "@/lib/dates";
import { getOrCreateDailySeed, regenerateDailySeed } from "@/lib/dailySeed";

// Long-running on themed days (multiple sequential Scryfall calls).
export const maxDuration = 60;

const LOCKED_MESSAGE =
  "Seeds for today or earlier are locked — players have already seen those cards and scores reference them";

async function requireAdmin(): Promise<NextResponse | null> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/**
 * POST /api/admin/seed
 *
 * Pre-generates (or force-regenerates) the daily seed for a given date.
 * Useful for scheduling seeds ahead of time and for testing.
 *
 * If the target date matches a themed_days row, the seed is generated using
 * the themed Scryfall query (live API) instead of the regular bulk pool, and
 * the row's themeName + themeDescription are persisted alongside the cards.
 *
 * Request body (all optional):
 *   {
 *     date?:  string   // ISO "yyyy-mm-dd", defaults to tomorrow (UTC)
 *     force?: boolean  // if true, overwrites an existing seed (future dates only)
 *   }
 *
 * Auth: Clerk-authenticated user whose `users.is_admin` is true.
 *
 * Responses:
 *   200 — seed already exists and force was false (no-op)
 *   201 — seed created or regenerated
 *   400 — invalid date
 *   401 — not authenticated
 *   403 — authenticated but not an admin
 *   409 — force-regenerating a seed for today or earlier
 *   502 — Scryfall or DB error
 */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: { date?: unknown; force?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine — use defaults
  }

  const targetDate =
    typeof body.date === "string" && body.date ? body.date : utcOffsetDate(1);
  const force = body.force === true;

  if (!isValidIsoDate(targetDate)) {
    return NextResponse.json(
      { error: 'Invalid date — expected a real "yyyy-mm-dd" date' },
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
          message:
            "Seed already exists for this date (pass force:true to regenerate)",
          date: targetDate,
          cardCount: existing.cards.length,
          themed: existing.themed ?? null,
        },
        { status: 200 },
      );
    }

    if (existing && targetDate <= todayUtc()) {
      return NextResponse.json({ error: LOCKED_MESSAGE }, { status: 409 });
    }

    const seed = existing
      ? await regenerateDailySeed(targetDate)
      : await getOrCreateDailySeed(targetDate);

    return NextResponse.json(
      {
        message: existing ? "Seed regenerated" : "Seed generated",
        date: targetDate,
        cardCount: seed.cards.length,
        themed: seed.themed ?? null,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[admin/seed] error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

/**
 * DELETE /api/admin/seed
 *
 * Removes a daily_seeds row by date. Used by the admin Schedule page to
 * undo an accidental Generate-Now click before the day arrives.
 *
 * Body:
 *   { date: string }   // ISO "yyyy-mm-dd", must be in the future
 *
 * Responses:
 *   200 — seed removed (or no-op if it never existed)
 *   400 — invalid date
 *   401/403 — auth
 *   409 — date is today or earlier
 */
export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: { date?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const date = body.date;
  if (!isValidIsoDate(date)) {
    return NextResponse.json(
      { error: 'date is required, format "yyyy-mm-dd"' },
      { status: 400 },
    );
  }
  if (date <= todayUtc()) {
    return NextResponse.json({ error: LOCKED_MESSAGE }, { status: 409 });
  }

  try {
    await db.delete(dailySeeds).where(eq(dailySeeds.date, date));
    return NextResponse.json({ message: "Seed removed", date });
  } catch (err) {
    console.error("[admin/seed DELETE] error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
