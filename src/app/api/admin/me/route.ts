import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/me → { isAdmin } for the current session.
 *
 * Lets the NavBar show its Admin link without the root layout running an
 * auth + DB lookup on every page render. Purely cosmetic: every admin page
 * and API route enforces `isAdmin` itself.
 */
export async function GET() {
  const { userId } = await auth();
  return NextResponse.json(
    { isAdmin: await isAdmin(userId) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
