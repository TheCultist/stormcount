import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/**
 * Admin gating helper.
 *
 * Admin status is stored as the `is_admin` boolean column on the `users`
 * table. There is no in-app promotion flow: flipping the flag is done
 * manually via SQL / Drizzle Studio, e.g.
 *
 *   UPDATE users SET is_admin = true WHERE id = 'user_2abc...';
 *
 * Returns `false` for missing users (e.g. a freshly-signed-in account that
 * has never submitted a score and therefore has no `users` row yet).
 *
 * Usage:
 *   const { userId } = await auth();
 *   if (!userId) return new Response("Unauthorized", { status: 401 });
 *   if (!(await isAdmin(userId))) return new Response("Forbidden", { status: 403 });
 */
export async function isAdmin(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  const row = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { isAdmin: true },
  });
  return row?.isAdmin ?? false;
}
