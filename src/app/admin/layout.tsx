import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/auth/admin";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// Admin pages must always re-check auth on the server.
export const dynamic = "force-dynamic";

const NAV_LINKS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/admin/themed-days", label: "Themed Days" },
  { href: "/admin/schedule", label: "Schedule" },
  { href: "/admin/card-pool", label: "Card Pool" },
];

/**
 * Admin layout — gates the entire `/admin/*` subtree behind the `is_admin`
 * flag on the `users` table and renders the persistent admin nav.
 *
 * Auth flow:
 *   - Unauthenticated  → redirect to /sign-in?redirect_url=/admin/...
 *   - Authenticated, not admin → redirect home
 *   - Admin → render children with nav
 *
 * Note: every admin API route ALSO performs its own isAdmin check; this
 * layout is defence in depth, not the only line of defence.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/admin/themed-days");
  }

  if (!(await isAdmin(userId))) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-10 sm:px-8 sm:py-12">
      <header className="flex flex-col gap-3 border-b border-foreground/10 pb-6">
        <p className="eyebrow flex items-center gap-2.5">
          <span aria-hidden className="h-1 w-1 rotate-45 bg-brass-bright" />
          Admin
        </p>
        <h1
          className="storm-display text-3xl font-extrabold leading-[0.95] tracking-[-0.02em] text-foreground sm:text-4xl"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
        >
          Storm Count Control Room
        </h1>
        <nav aria-label="Admin sections" className="mt-2 flex flex-wrap gap-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="storm-mono rounded-md border border-foreground/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/80 transition-colors hover:border-brass-bright/60 hover:text-brass-bright"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <section className="flex flex-1 flex-col gap-6">{children}</section>
    </div>
  );
}
