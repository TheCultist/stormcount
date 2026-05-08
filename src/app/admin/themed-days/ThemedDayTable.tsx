"use client";

import { Fragment, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ThemedDay } from "@/lib/db/schema";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const INPUT_CLASS =
  "rounded-md border border-foreground/15 bg-background px-2 py-1.5 text-sm text-foreground placeholder:text-foreground/35 focus:border-brass-bright/60 focus:outline-none";
const MONO_INPUT_CLASS = `${INPUT_CLASS} storm-mono`;
const LABEL_CLASS =
  "storm-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/55";

type RowStatus =
  | { kind: "idle" }
  | { kind: "error"; message: string };

interface EditValues {
  themeName: string;
  themeDescription: string;
  scryfallQuery: string;
  isDaily: boolean;
  day: string;
  month: string;
  year: string;
}

function rowToEditValues(row: ThemedDay): EditValues {
  return {
    themeName: row.themeName,
    themeDescription: row.themeDescription,
    scryfallQuery: row.scryfallQuery,
    isDaily: row.isDaily,
    day: String(row.day),
    month: String(row.month),
    year: row.year,
  };
}

// ── Single-row actions (edit / delete) ────────────────────────────────────────

interface RowActionsProps {
  row: ThemedDay;
  isEditing: boolean;
  onEditOpen: () => void;
  onEditClose: () => void;
}

function RowActions({ row, isEditing, onEditOpen, onEditClose }: RowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false); // confirmation step
  const [status, setStatus] = useState<RowStatus>({ kind: "idle" });

  async function handleDelete() {
    setStatus({ kind: "idle" });
    try {
      const res = await fetch("/api/admin/themed-days", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setStatus({ kind: "error", message: data.error ?? `Server error (${res.status})` });
        setDeleting(false);
        return;
      }
      startTransition(() => router.refresh());
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Unknown error" });
      setDeleting(false);
    }
  }

  const busy = isPending;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={isEditing ? onEditClose : onEditOpen}
          disabled={busy}
          className="storm-mono rounded-md border border-foreground/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/85 transition-colors hover:border-brass-bright/60 hover:text-brass-bright disabled:opacity-50"
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>

        {deleting ? (
          <>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="storm-mono rounded-md border border-crimson-bright bg-crimson/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-crimson-bright transition-colors hover:bg-crimson/30 disabled:opacity-50"
            >
              {busy ? "Deleting…" : "Confirm delete"}
            </button>
            <button
              type="button"
              onClick={() => setDeleting(false)}
              disabled={busy}
              className="storm-mono rounded-md border border-foreground/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/60 transition-colors hover:text-foreground/85 disabled:opacity-50"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => { setDeleting(true); setStatus({ kind: "idle" }); }}
            disabled={busy || isEditing}
            className="storm-mono rounded-md border border-crimson/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-crimson-bright transition-colors hover:border-crimson-bright hover:bg-crimson/10 disabled:opacity-50"
          >
            Delete
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

// ── Inline edit form (spans full row width) ───────────────────────────────────

interface EditFormProps {
  row: ThemedDay;
  onClose: () => void;
}

function EditForm({ row, onClose }: EditFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<EditValues>(rowToEditValues(row));
  const [status, setStatus] = useState<RowStatus>({ kind: "idle" });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof EditValues>(k: K, v: EditValues[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dayNum = Number(values.day);
    const monthNum = Number(values.month);
    const yearStr = values.year.trim();

    if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 31) {
      setStatus({ kind: "error", message: "Day must be 1–31." });
      return;
    }
    if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
      setStatus({ kind: "error", message: "Month must be 1–12." });
      return;
    }
    if (yearStr !== "*" && !/^[0-9]{4}$/.test(yearStr)) {
      setStatus({ kind: "error", message: 'Year must be a 4-digit year or "*".' });
      return;
    }

    setSaving(true);
    setStatus({ kind: "idle" });

    try {
      const res = await fetch("/api/admin/themed-days", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          themeName: values.themeName.trim(),
          themeDescription: values.themeDescription.trim(),
          scryfallQuery: values.scryfallQuery.trim(),
          isDaily: values.isDaily,
          day: dayNum,
          month: monthNum,
          year: yearStr,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setStatus({ kind: "error", message: data.error ?? `Server error (${res.status})` });
        return;
      }

      onClose();
      router.refresh();
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 border-t border-brass-bright/20 bg-brass/5 px-4 py-4"
    >
      <p className="storm-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brass-bright/70">
        Editing: {row.themeName}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Theme name</span>
          <input
            type="text"
            value={values.themeName}
            onChange={(e) => set("themeName", e.target.value)}
            className={INPUT_CLASS}
            disabled={saving}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Scryfall query</span>
          <input
            type="text"
            value={values.scryfallQuery}
            onChange={(e) => set("scryfallQuery", e.target.value)}
            className={MONO_INPUT_CLASS}
            disabled={saving}
            required
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Description</span>
        <textarea
          value={values.themeDescription}
          onChange={(e) => set("themeDescription", e.target.value)}
          rows={2}
          className={INPUT_CLASS}
          disabled={saving}
          required
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Day</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={values.day}
            onChange={(e) => set("day", e.target.value)}
            className={INPUT_CLASS}
            disabled={saving}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Month</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={12}
            value={values.month}
            onChange={(e) => set("month", e.target.value)}
            className={INPUT_CLASS}
            disabled={saving}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Year</span>
          <input
            type="text"
            value={values.year}
            onChange={(e) => set("year", e.target.value)}
            className={MONO_INPUT_CLASS}
            disabled={saving}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Mode</span>
          <select
            value={values.isDaily ? "daily" : "both"}
            onChange={(e) => set("isDaily", e.target.value === "daily")}
            className={INPUT_CLASS}
            disabled={saving}
          >
            <option value="daily">Daily only</option>
            <option value="both">Daily + Survival</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="storm-mono rounded-md border border-brass-bright/60 bg-brass/15 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-brass-bright transition-colors hover:bg-brass/25 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="storm-mono text-[11px] uppercase tracking-[0.18em] text-foreground/50 hover:text-foreground/80 disabled:opacity-50"
        >
          Cancel
        </button>
        {status.kind === "error" && (
          <p className="storm-mono text-[10px] uppercase tracking-[0.18em] text-crimson-bright">
            {status.message}
          </p>
        )}
      </div>
    </form>
  );
}

// ── Main table component ──────────────────────────────────────────────────────

export default function ThemedDayTable({ rows }: { rows: ThemedDay[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-foreground/55">
        No themes configured yet. Add one above.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-foreground/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-foreground/5">
          <tr>
            <th className="storm-mono px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70">
              Theme
            </th>
            <th className="storm-mono px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70">
              Date
            </th>
            <th className="storm-mono px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70">
              Mode
            </th>
            <th className="storm-mono px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70">
              Query
            </th>
            <th className="storm-mono px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isEditing = editingId === row.id;
            return (
              <Fragment key={row.id}>
                <tr className="border-t border-foreground/10 align-top">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{row.themeName}</div>
                    <div className="mt-1 max-w-md text-xs text-foreground/60">
                      {row.themeDescription}
                    </div>
                  </td>
                  <td className="storm-mono px-4 py-3 text-[12px] text-foreground/80">
                    {row.day} {MONTH_NAMES[row.month - 1]} {row.year}
                  </td>
                  <td className="storm-mono px-4 py-3 text-[12px] text-foreground/80">
                    {row.isDaily ? "Daily only" : "Daily + Survival"}
                  </td>
                  <td className="storm-mono px-4 py-3 text-[12px] text-foreground/80">
                    <code>{row.scryfallQuery}</code>
                  </td>
                  <td className="px-4 py-3">
                    <RowActions
                      row={row}
                      isEditing={isEditing}
                      onEditOpen={() => setEditingId(row.id)}
                      onEditClose={() => setEditingId(null)}
                    />
                  </td>
                </tr>
                {isEditing && (
                  <tr className="border-t border-brass-bright/20">
                    <td colSpan={5} className="p-0">
                      <EditForm
                        row={row}
                        onClose={() => setEditingId(null)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
