import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { cardPool } from "@/lib/db/schema";
import { fetchAndFilterBulkCards } from "@/lib/scryfall/bulkClient";
import { isAdmin } from "@/lib/auth/admin";

// Bulk download + bulk upsert can take ~30s; opt out of static eval.
export const dynamic = "force-dynamic";
// Vercel default of 10s would time out — bump explicitly.
export const maxDuration = 300;

/**
 * POST /api/admin/refresh-pool
 *
 * Downloads the latest Scryfall `oracle_cards` bulk file, applies the same
 * pool filters used by Daily/Survival, and upserts every eligible card into
 * the `card_pool` table.
 *
 * Survival mode reads from `card_pool` on every request (`ORDER BY random()`),
 * so this endpoint should be re-run periodically (e.g. daily via a cron) to
 * reflect new MTG releases.
 *
 * Auth: Clerk-authenticated user whose userId appears in ADMIN_USER_IDS.
 *
 * Responses:
 *   200 — pool refreshed successfully
 *   401 — not authenticated
 *   403 — authenticated but not an admin
 *   502 — Scryfall download or DB error
 */
export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const startedAt = Date.now();

  try {
    const cards = await fetchAndFilterBulkCards();
    if (cards.length === 0) {
      return NextResponse.json(
        { error: "Bulk data yielded zero eligible cards" },
        { status: 502 },
      );
    }

    // Upsert in chunks — a single 30k-row insert risks payload-size limits
    // on the Neon HTTP driver. 1000 per batch is comfortably under the
    // 16MB driver cap (each row is ~500 bytes serialized).
    //
    // `excluded.card` references the proposed-but-rejected row from each
    // INSERT, giving us a true per-row UPDATE on conflict.
    const BATCH_SIZE = 1000;
    for (let i = 0; i < cards.length; i += BATCH_SIZE) {
      const chunk = cards.slice(i, i + BATCH_SIZE).map((card) => ({
        id: card.id,
        card,
      }));

      await db
        .insert(cardPool)
        .values(chunk)
        .onConflictDoUpdate({
          target: cardPool.id,
          set: {
            card: sql`excluded.card`,
            refreshedAt: sql`now()`,
          },
        });
    }

    return NextResponse.json(
      {
        message: "Card pool refreshed",
        count: cards.length,
        durationMs: Date.now() - startedAt,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[admin/refresh-pool] error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
