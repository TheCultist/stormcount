/**
 * Admin gating helper.
 *
 * Admin status is read from the `ADMIN_USER_IDS` env var — a
 * comma-separated list of Clerk userIds. There is no DB-backed role table:
 * keeping admins in env makes provisioning easy and prevents privilege
 * escalation via DB writes.
 *
 * Usage:
 *   const { userId } = await auth();
 *   if (!userId) return new Response("Unauthorized", { status: 401 });
 *   if (!isAdmin(userId)) return new Response("Forbidden", { status: 403 });
 */
export function isAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false;
  const ids =
    process.env.ADMIN_USER_IDS?.split(",")
      .map((id) => id.trim())
      .filter(Boolean) ?? [];
  return ids.includes(userId);
}
