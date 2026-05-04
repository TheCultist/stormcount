import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, survivalBests } from "@/lib/db/schema";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const score = typeof body?.score === "number" ? body.score : null;
  if (score == null || score < 0) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }

  // Ensure the user row exists (first-time players).
  const clerkUser = await currentUser();
  await db
    .insert(users)
    .values({
      id: userId,
      username: clerkUser?.username ?? clerkUser?.firstName ?? "Planeswalker",
      imageUrl: clerkUser?.imageUrl ?? null,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        username: clerkUser?.username ?? clerkUser?.firstName ?? "Planeswalker",
        imageUrl: clerkUser?.imageUrl ?? null,
      },
    });

  // Upsert: insert new row or update only if the incoming score is higher.
  await db
    .insert(survivalBests)
    .values({ userId, bestStreak: score })
    .onConflictDoUpdate({
      target: survivalBests.userId,
      set: {
        bestStreak: sql`GREATEST(${survivalBests.bestStreak}, EXCLUDED.best_streak)`,
        updatedAt: sql`NOW()`,
      },
    });

  const [row] = await db
    .select({ bestStreak: survivalBests.bestStreak })
    .from(survivalBests)
    .where(eq(survivalBests.userId, userId));

  return NextResponse.json({ ok: true, best: row?.bestStreak ?? score });
}
