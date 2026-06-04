import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { themedDays } from "@/lib/db/schema";
import { isAdmin } from "@/lib/auth/admin";
import { randomUUID } from "node:crypto";

// Admin-only routes — never cache.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/themed-days
 *
 * Lists every themed-day definition. Sorted by month then day so the admin
 * UI can group recurring (year=*) and explicit-year entries naturally.
 *
 * Auth: admin only (`users.is_admin = true`).
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rows = await db
      .select()
      .from(themedDays)
      .orderBy(asc(themedDays.month), asc(themedDays.day), asc(themedDays.year));
    return NextResponse.json({ themedDays: rows });
  } catch (err) {
    console.error("[admin/themed-days GET] error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

interface ThemedDayBody {
  themeName?: unknown;
  themeDescription?: unknown;
  scryfallQuery?: unknown;
  isDaily?: unknown;
  day?: unknown;
  month?: unknown;
  year?: unknown;
}

/**
 * POST /api/admin/themed-days
 *
 * Creates a themed-day definition. Returns 409 if (day, month, year) already
 * exists — the unique constraint guarantees at most one theme per date slot.
 *
 * Body (all required):
 *   themeName:        string  — short label, e.g. "Star Wars Day"
 *   themeDescription: string  — long-form blurb shown on home + daily pages
 *   scryfallQuery:    string  — query passed to /cards/search
 *   isDaily:          boolean — true = Daily only; false = Daily AND Survival
 *   day:              number  — 1–31
 *   month:            number  — 1–12
 *   year:             string  — "2026" or "*"
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: ThemedDayBody;
  try {
    body = (await req.json()) as ThemedDayBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ── Validate ───────────────────────────────────────────────────────────
  const themeName =
    typeof body.themeName === "string" ? body.themeName.trim() : "";
  const themeDescription =
    typeof body.themeDescription === "string"
      ? body.themeDescription.trim()
      : "";
  const scryfallQuery =
    typeof body.scryfallQuery === "string" ? body.scryfallQuery.trim() : "";
  const isDaily =
    typeof body.isDaily === "boolean" ? body.isDaily : true;
  const day = typeof body.day === "number" ? body.day : NaN;
  const month = typeof body.month === "number" ? body.month : NaN;
  const year = typeof body.year === "string" ? body.year.trim() : "";

  if (!themeName || !themeDescription || !scryfallQuery) {
    return NextResponse.json(
      { error: "themeName, themeDescription, scryfallQuery are required" },
      { status: 400 },
    );
  }
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return NextResponse.json(
      { error: "day must be an integer in [1, 31]" },
      { status: 400 },
    );
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json(
      { error: "month must be an integer in [1, 12]" },
      { status: 400 },
    );
  }
  if (year !== "*" && !/^\d{4}$/.test(year)) {
    return NextResponse.json(
      { error: 'year must be "*" or a 4-digit string' },
      { status: 400 },
    );
  }

  // ── Insert ─────────────────────────────────────────────────────────────
  try {
    const [inserted] = await db
      .insert(themedDays)
      .values({
        id: randomUUID(),
        themeName,
        themeDescription,
        scryfallQuery,
        isDaily,
        day,
        month,
        year,
      })
      .returning();
    return NextResponse.json({ themedDay: inserted }, { status: 201 });
  } catch (err) {
    // Postgres 23505 = unique_violation
    const code = (err as { code?: string })?.code;
    if (code === "23505") {
      return NextResponse.json(
        { error: "A themed day already exists for this day/month/year" },
        { status: 409 },
      );
    }
    console.error("[admin/themed-days POST] error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

interface PatchBody {
  id?: unknown;
  themeName?: unknown;
  themeDescription?: unknown;
  scryfallQuery?: unknown;
  isDaily?: unknown;
  day?: unknown;
  month?: unknown;
  year?: unknown;
}

/**
 * PATCH /api/admin/themed-days
 *
 * Updates an existing themed-day definition. The `id` field is required;
 * all other fields are optional — only provided fields are updated.
 */
export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Build partial update — only include fields that were sent.
  const patch: Record<string, unknown> = {};

  if (body.themeName !== undefined) {
    const v = typeof body.themeName === "string" ? body.themeName.trim() : "";
    if (!v) return NextResponse.json({ error: "themeName cannot be empty" }, { status: 400 });
    patch.themeName = v;
  }
  if (body.themeDescription !== undefined) {
    const v = typeof body.themeDescription === "string" ? body.themeDescription.trim() : "";
    if (!v) return NextResponse.json({ error: "themeDescription cannot be empty" }, { status: 400 });
    patch.themeDescription = v;
  }
  if (body.scryfallQuery !== undefined) {
    const v = typeof body.scryfallQuery === "string" ? body.scryfallQuery.trim() : "";
    if (!v) return NextResponse.json({ error: "scryfallQuery cannot be empty" }, { status: 400 });
    patch.scryfallQuery = v;
  }
  if (body.isDaily !== undefined) {
    if (typeof body.isDaily !== "boolean") {
      return NextResponse.json({ error: "isDaily must be a boolean" }, { status: 400 });
    }
    patch.isDaily = body.isDaily;
  }
  if (body.day !== undefined) {
    const v = typeof body.day === "number" ? body.day : NaN;
    if (!Number.isInteger(v) || v < 1 || v > 31) {
      return NextResponse.json({ error: "day must be an integer in [1, 31]" }, { status: 400 });
    }
    patch.day = v;
  }
  if (body.month !== undefined) {
    const v = typeof body.month === "number" ? body.month : NaN;
    if (!Number.isInteger(v) || v < 1 || v > 12) {
      return NextResponse.json({ error: "month must be an integer in [1, 12]" }, { status: 400 });
    }
    patch.month = v;
  }
  if (body.year !== undefined) {
    const v = typeof body.year === "string" ? body.year.trim() : "";
    if (v !== "*" && !/^\d{4}$/.test(v)) {
      return NextResponse.json({ error: 'year must be "*" or a 4-digit string' }, { status: 400 });
    }
    patch.year = v;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const [updated] = await db
      .update(themedDays)
      .set(patch)
      .where(eq(themedDays.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Themed day not found" }, { status: 404 });
    }
    return NextResponse.json({ themedDay: updated });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "23505") {
      return NextResponse.json(
        { error: "A themed day already exists for this day/month/year" },
        { status: 409 },
      );
    }
    console.error("[admin/themed-days PATCH] error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/themed-days
 *
 * Permanently deletes a themed-day definition by id.
 *
 * Body: { id: string }
 */
export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { id?: unknown };
  try {
    body = (await req.json()) as { id?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const [deleted] = await db
      .delete(themedDays)
      .where(eq(themedDays.id, id))
      .returning({ id: themedDays.id });

    if (!deleted) {
      return NextResponse.json({ error: "Themed day not found" }, { status: 404 });
    }
    return NextResponse.json({ deleted: deleted.id });
  } catch (err) {
    console.error("[admin/themed-days DELETE] error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
