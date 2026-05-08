import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { themedDays } from "@/lib/db/schema";
import ThemedDayForm from "./ThemedDayForm";
import ThemedDayTable from "./ThemedDayTable";

// Auth is enforced by `app/admin/layout.tsx`; this page just queries the DB.
export const dynamic = "force-dynamic";

/**
 * Admin → Themed Days
 *
 * Lists every themed-day definition and exposes a form to create new ones.
 * Existing rows can be edited or deleted inline via ThemedDayTable.
 */
export default async function ThemedDaysAdminPage() {
  const rows = await db
    .select()
    .from(themedDays)
    .orderBy(
      asc(themedDays.month),
      asc(themedDays.day),
      asc(themedDays.year),
    );

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h2 className="storm-display text-2xl font-bold tracking-[-0.01em]">
          Define a themed day
        </h2>
        <p className="text-sm text-foreground/65">
          A themed day overrides the regular daily card pool with a custom
          Scryfall query. Use <code className="storm-mono">*</code> for the
          year to make it recur every year (e.g. Star Wars Day, Christmas).
        </p>
        <ThemedDayForm />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="storm-display text-2xl font-bold tracking-[-0.01em]">
          Configured themes ({rows.length})
        </h2>
        <ThemedDayTable rows={rows} />
      </section>
    </div>
  );
}
