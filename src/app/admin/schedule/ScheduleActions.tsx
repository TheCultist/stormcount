"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ActionStatus =
  | { kind: "idle" }
  | { kind: "error"; message: string };

interface Props {
  date: string; // "yyyy-mm-dd"
  hasSeed: boolean;
}

/**
 * Per-row action panel for the admin schedule page.
 *
 * Hits `POST /api/admin/seed` with `{ date, force }` to (re)generate, and
 * `DELETE /api/admin/seed` with `{ date }` to drop. After each successful
 * mutation we call `router.refresh()` so the parent server component re-runs
 * its DB queries and the row's status flips immediately.
 */
export default function ScheduleActions({ date, hasSeed }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [status, setStatus] = useState<ActionStatus>({ kind: "idle" });

  async function callSeed(
    method: "POST" | "DELETE",
    body: Record<string, unknown>,
    label: string,
  ) {
    setPendingAction(label);
    setStatus({ kind: "idle" });
    try {
      const res = await fetch("/api/admin/seed", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let msg = `Server error (${res.status})`;
        try {
          const data = (await res.json()) as { error?: string };
          if (data.error) msg = data.error;
        } catch {
          // body wasn't JSON; keep the generic message
        }
        setStatus({ kind: "error", message: msg });
        return;
      }

      // Server reads its data fresh thanks to `force-dynamic` on the page.
      startTransition(() => router.refresh());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setStatus({ kind: "error", message });
    } finally {
      setPendingAction(null);
    }
  }

  const generate = () =>
    callSeed("POST", { date, force: false }, "generate");
  const regenerate = () =>
    callSeed("POST", { date, force: true }, "regenerate");
  const remove = () =>
    callSeed("DELETE", { date }, "remove");

  const busy = pendingAction !== null || isPending;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {hasSeed ? (
          <>
            <button
              type="button"
              onClick={regenerate}
              disabled={busy}
              className="storm-mono rounded-md border border-foreground/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/85 transition-colors hover:border-brass-bright/60 hover:text-brass-bright disabled:opacity-50"
            >
              {pendingAction === "regenerate"
                ? "Regenerating…"
                : "Regenerate"}
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="storm-mono rounded-md border border-crimson/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-crimson-bright transition-colors hover:border-crimson-bright hover:bg-crimson/10 disabled:opacity-50"
            >
              {pendingAction === "remove" ? "Removing…" : "Remove seed"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={generate}
            disabled={busy}
            className="storm-mono rounded-md border border-brass-bright/60 bg-brass/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brass-bright transition-colors hover:bg-brass/25 disabled:opacity-50"
          >
            {pendingAction === "generate" ? "Generating…" : "Generate now"}
          </button>
        )}
      </div>
      {status.kind === "error" && (
        <p className="storm-mono text-[10px] uppercase tracking-[0.18em] text-crimson-bright">
          {status.message}
        </p>
      )}
    </div>
  );
}
