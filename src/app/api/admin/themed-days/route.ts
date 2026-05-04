import { NextResponse } from "next/server";

/**
 * GET /api/admin/themed-days   -> list scheduled themed days
 * POST /api/admin/themed-days  -> create a themed day
 * Admin-only. Skeleton stubs — auth + DB wired later.
 */
export async function GET() {
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 },
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 },
  );
}
