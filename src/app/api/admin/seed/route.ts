import { NextResponse } from "next/server";

/**
 * POST /api/admin/seed
 * Admin-only — sets override seed for a date (themed days).
 * Skeleton stub — auth + DB write wired later.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 },
  );
}
