import { NextResponse } from "next/server";
import type { ScryfallCard } from "@/lib/scryfall/types";

/**
 * GET /api/cards/daily
 * Returns today's 100-card seeded list for the Daily Challenge.
 * Skeleton stub — wired to DB/Scryfall later.
 */
export async function GET() {
  const today = new Date().toISOString().slice(0, 10);

  return NextResponse.json(
    {
      date: today,
      themed: null as string | null,
      cards: [] as ScryfallCard[],
    },
    { status: 200 },
  );
}
