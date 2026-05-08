import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { cardPool } from "@/lib/db/schema";
import CardPoolActions from "./CardPoolActions";

export const dynamic = "force-dynamic";

/**
 * Admin → Card Pool
 *
 * Shows the current size of the `card_pool` table and the last time it was
 * refreshed, then exposes a button to trigger a fresh bulk download from
 * Scryfall. Survival mode reads from this table on every request, so the
 * pool should be refreshed whenever a new MTG set is released.
 */
export default async function CardPoolAdminPage() {
  const [stats] = await db
    .select({
      count: sql<number>`count(*)::int`,
      lastRefreshed: sql<string | null>`max(refreshed_at)`,
    })
    .from(cardPool);

  const count = stats?.count ?? 0;
  const lastRefreshed = stats?.lastRefreshed ?? null;

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h2 className="storm-display text-2xl font-bold tracking-[-0.01em]">
          Card pool
        </h2>
        <p className="text-sm text-foreground/65">
          The card pool is a pre-filtered snapshot of Scryfall&apos;s{" "}
          <code className="storm-mono">oracle_cards</code> bulk dataset. Survival
          mode draws from this table on every request — refresh it after new MTG
          sets are released so players see the latest cards.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1 rounded-md border border-foreground/10 bg-foreground/5 px-5 py-4">
            <span className="storm-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/50">
              Cards in pool
            </span>
            <span className="storm-display text-3xl font-bold tabular-nums tracking-tight">
              {count === 0 ? (
                <span className="text-foreground/40">—</span>
              ) : (
                count.toLocaleString()
              )}
            </span>
          </div>

          <div className="flex flex-col gap-1 rounded-md border border-foreground/10 bg-foreground/5 px-5 py-4">
            <span className="storm-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/50">
              Last refreshed
            </span>
            <span className="text-sm font-medium">
              {lastRefreshed ? (
                formatDate(lastRefreshed)
              ) : (
                <span className="text-foreground/40">Never</span>
              )}
            </span>
          </div>
        </div>

        {count === 0 && (
          <p className="rounded-md border border-brass-bright/20 bg-brass/10 px-4 py-3 text-sm text-brass-bright/90">
            The pool is empty. Survival mode will fall back to live Scryfall
            searches until the pool is refreshed.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="storm-display text-2xl font-bold tracking-[-0.01em]">
          Refresh pool
        </h2>
        <p className="text-sm text-foreground/65">
          Downloads the latest bulk data from Scryfall, applies the standard
          pool filters, and upserts all eligible cards. Takes roughly 30–60
          seconds. Safe to run at any time — Survival requests in flight will
          continue reading the old rows until the upsert completes.
        </p>
        <CardPoolActions />
      </section>
    </div>
  );
}
