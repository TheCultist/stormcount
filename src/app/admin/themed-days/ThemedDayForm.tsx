"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type FormStatus =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const INITIAL_VALUES = {
  themeName: "",
  themeDescription: "",
  scryfallQuery: "",
  isDaily: true,
  day: "",
  month: "",
  year: "*",
};

const FIELD_INPUT_CLASS =
  "rounded-md border border-foreground/15 bg-background-soft px-3 py-2 text-sm text-foreground placeholder:text-foreground/35 focus:border-brass-bright/60 focus:outline-none";

const FIELD_LABEL_CLASS =
  "storm-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/65";

/**
 * Themed-day creation form.
 *
 * Submits to `POST /api/admin/themed-days`. On success, calls `router.refresh()`
 * so the list rendered by the parent server component re-runs its DB query.
 *
 * Client-side validation is intentionally minimal — the API route does the
 * authoritative validation (and reports unique-constraint violations as 409).
 */
export default function ThemedDayForm() {
  const router = useRouter();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [status, setStatus] = useState<FormStatus>({ kind: "idle" });

  const setField = <K extends keyof typeof INITIAL_VALUES>(
    key: K,
    value: (typeof INITIAL_VALUES)[K],
  ) => setValues((v) => ({ ...v, [key]: value }));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "submitting" });

    const dayNum = Number(values.day);
    const monthNum = Number(values.month);
    const yearStr = values.year.trim();

    if (!values.themeName.trim()) {
      setStatus({ kind: "error", message: "Theme name is required." });
      return;
    }
    if (!values.themeDescription.trim()) {
      setStatus({ kind: "error", message: "Description is required." });
      return;
    }
    if (!values.scryfallQuery.trim()) {
      setStatus({ kind: "error", message: "Scryfall query is required." });
      return;
    }
    if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 31) {
      setStatus({ kind: "error", message: "Day must be 1–31." });
      return;
    }
    if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
      setStatus({ kind: "error", message: "Month must be 1–12." });
      return;
    }
    if (yearStr !== "*" && !/^[0-9]{4}$/.test(yearStr)) {
      setStatus({
        kind: "error",
        message: 'Year must be a 4-digit year or "*" for any year.',
      });
      return;
    }

    try {
      const res = await fetch("/api/admin/themed-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        let msg = `Server error (${res.status})`;
        try {
          const body = (await res.json()) as { error?: string };
          if (body.error) msg = body.error;
        } catch {
          // Body was not JSON; keep the generic message.
        }
        setStatus({ kind: "error", message: msg });
        return;
      }

      setStatus({ kind: "success", message: "Themed day saved." });
      setValues(INITIAL_VALUES);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setStatus({ kind: "error", message });
    }
  }

  const isSubmitting = status.kind === "submitting";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-md border border-foreground/10 bg-background-soft/40 p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className={FIELD_LABEL_CLASS}>Theme name</span>
          <input
            type="text"
            value={values.themeName}
            onChange={(e) => setField("themeName", e.target.value)}
            placeholder="e.g. Star Wars Day"
            className={FIELD_INPUT_CLASS}
            disabled={isSubmitting}
            required
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className={FIELD_LABEL_CLASS}>Scryfall query</span>
          <input
            type="text"
            value={values.scryfallQuery}
            onChange={(e) => setField("scryfallQuery", e.target.value)}
            placeholder='e.g. otag:lightsaber'
            className={`${FIELD_INPUT_CLASS} storm-mono`}
            disabled={isSubmitting}
            required
          />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className={FIELD_LABEL_CLASS}>Description</span>
        <textarea
          value={values.themeDescription}
          onChange={(e) => setField("themeDescription", e.target.value)}
          placeholder="Shown to players when this theme is active."
          rows={2}
          className={FIELD_INPUT_CLASS}
          disabled={isSubmitting}
          required
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-4">
        <label className="flex flex-col gap-2">
          <span className={FIELD_LABEL_CLASS}>Day</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={values.day}
            onChange={(e) => setField("day", e.target.value)}
            placeholder="1–31"
            className={FIELD_INPUT_CLASS}
            disabled={isSubmitting}
            required
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className={FIELD_LABEL_CLASS}>Month</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={12}
            value={values.month}
            onChange={(e) => setField("month", e.target.value)}
            placeholder="1–12"
            className={FIELD_INPUT_CLASS}
            disabled={isSubmitting}
            required
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className={FIELD_LABEL_CLASS}>Year</span>
          <input
            type="text"
            value={values.year}
            onChange={(e) => setField("year", e.target.value)}
            placeholder='2026 or *'
            className={`${FIELD_INPUT_CLASS} storm-mono`}
            disabled={isSubmitting}
            required
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className={FIELD_LABEL_CLASS}>Mode</span>
          <select
            value={values.isDaily ? "daily" : "survival"}
            onChange={(e) => setField("isDaily", e.target.value === "daily")}
            className={FIELD_INPUT_CLASS}
            disabled={isSubmitting}
          >
            <option value="daily">Daily Only</option>
            <option value="survival">Daily + Survival</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving…" : "Save themed day"}
        </button>

        {status.kind === "error" && (
          <p className="storm-mono text-[11px] uppercase tracking-[0.18em] text-crimson-bright">
            {status.message}
          </p>
        )}
        {status.kind === "success" && (
          <p className="storm-mono text-[11px] uppercase tracking-[0.18em] text-correct-bright">
            {status.message}
          </p>
        )}
      </div>
    </form>
  );
}
