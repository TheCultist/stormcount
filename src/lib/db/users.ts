import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/**
 * Create or refresh the `users` row for the signed-in Clerk user. Must run
 * before inserting anything that references `users.id` (FK constraint).
 */
export async function upsertUserFromClerk(userId: string): Promise<void> {
  const clerkUser = await currentUser();
  const profile = {
    username: clerkUser?.username ?? clerkUser?.firstName ?? "Planeswalker",
    imageUrl: clerkUser?.imageUrl ?? null,
  };
  await db
    .insert(users)
    .values({ id: userId, ...profile })
    .onConflictDoUpdate({ target: users.id, set: profile });
}
