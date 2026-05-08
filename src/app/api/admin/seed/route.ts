import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { dailySeeds } from "@/lib/db/schema";
import {
  generateDailyCards,
  generateThemedCards,
} from "@/lib/scryfall/seedGenerator";
import { isAdmin } from "@/lib/auth/admin";
import { findThemedDayForDate } from "@/lib/themedDays";

// Long-running on themed days (multiple sequential Scryfall calls).
export const maxDuration = 60;

/** Returns tomorrow's date in UTC as "yyyy-mm-dd". */
function tomorrow(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
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
          message:
            "Seed already exists for this date (pass force:true to regenerate)",
          date: targetDate,
          cardCount: (existing.cards as unknown[]).length,
          themed: existing.themed ?? null,
        },
        { status: 200 },
      );
    }

    // Themed day? Use the themed query path, otherwise the regular bulk pool.
    const theme = await findThemedDayForDate(targetDate);
    const cards = theme
      ? await generateThemedCards(theme.scryfallQuery)
      : await generateDailyCards();

    const themedLabel = theme?.themeName ?? null;
    const themedDescription = theme?.themeDescription ?? null;

    if (existing) {
      await db
        .update(dailySeeds)
        .set({ cards, themed: themedLabel, themedDescription })
        .where(eq(dailySeeds.date, targetDate));
    } else {
      await db.insert(dailySeeds).values({
        id: targetDate,
        date: targetDate,
        cards,
        themed: themedLabel,
        themedDescription,
      });
    }

    return NextResponse.json(
      {
        message: existing ? "Seed regenerated" : "Seed generated",
        date: targetDate,
        cardCount: cards.length,
        themed: themedLabel,
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
 *   { date: string }   // ISO "yyyy-mm-dd"
 *
 * Responses:
 *   200 — seed removed (or no-op if it never existed)
 *   400 — invalid date
 *   401/403 — auth
 */
export async function DELETE(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { date?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const date = typeof body.date === "string" ? body.date : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'date is required, format "yyyy-mm-dd"' },
      { status: 400 },
    );
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
