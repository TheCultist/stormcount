import { NextResponse } from "next/server";
import type { ScryfallCard } from "@/lib/scryfall/types";

/**
 * GET /api/cards/next
 * Returns a random card for Survival mode.
 * Skeleton stub — wired to Scryfall proxy later.
 */
export async function GET() {
  return NextResponse.json(
    {
      card: null as ScryfallCard | null,
    },
    { status: 200 },
  );
}
