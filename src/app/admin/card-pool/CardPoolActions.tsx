"use client";

import { useState } from "react";

type Status =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "success"; count: number; durationMs: number }
  | { kind: "error"; message: string };

/**
 * Refresh-pool button for the admin Card Pool page.
 *
 * Calls POST /api/admin/refresh-pool (can take up to ~60s on a cold Neon
 * connection), then displays the result inline. The parent server component
 * does not need to reload because pool stats are only decorative — any
 * subsequent navigation will show the updated counts.
 */
export default function CardPoolActions() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleRefresh() {
    setStatus({ kind: "pending" });
    try {
      const res = await fetch("/api/admin/refresh-pool", { method: "POST" });

      if (!res.ok) {
        let msg = `Server error (${res.status})`;
        try {
          const data = (await res.json()) as { error?: string };
          if (data.error) msg = data.error;
        } catch {
          // non-JSON body — keep the generic message
        }
        setStatus({ kind: "error", message: msg });
        return;
      }

      const data = (await res.json()) as { count?: number; durationMs?: number };
      setStatus({
        kind: "success",
        count: data.count ?? 0,
        durationMs: data.durationMs ?? 0,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setStatus({ kind: "error", message });
    }
  }

  const busy = status.kind === "pending";

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleRefresh}
        disabled={busy}
        className="storm-mono w-fit rounded-md border border-brass-bright/60 bg-brass/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brass-bright transition-colors hover:bg-brass/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Refreshing…" : "Refresh card pool"}
      </button>

      {busy && (
        <p className="storm-mono text-[11px] uppercase tracking-[0.18em] text-foreground/55">
          Downloading bulk data from Scryfall — this can take up to 60 seconds…
        </p>
      )}

      {status.kind === "success" && (
        <p className="storm-mono text-[11px] uppercase tracking-[0.18em] text-correct-bright">
          Pool refreshed — {status.count.toLocaleString()} cards in{" "}
          {(status.durationMs / 1000).toFixed(1)}s
        </p>
      )}

      {status.kind === "error" && (
        <p className="storm-mono text-[11px] uppercase tracking-[0.18em] text-crimson-bright">
          {status.message}
        </p>
      )}
    </div>
  );
}
