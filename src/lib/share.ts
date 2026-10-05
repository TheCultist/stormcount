/**
 * Score-sharing helpers — single source of truth for the share URL shape,
 * the social-post message, and validation of inbound /share params.
 *
 * Used by consumers that must stay in sync:
 *  - `ShareScore.tsx` (builds the outbound share links)
 *  - `app/share/page.tsx` (landing page + OG metadata)
 *  - `app/share/og/route.tsx` (dynamic OG image)
 */
import { BRAND } from "@/lib/constants";
import type { GameMode } from "@/lib/types";

export type SharePayload = {
  mode: GameMode;
  score: number;
  /** Daily only: total pairs played — renders the score as "x/y". */
  total?: number;
  /** Daily only: challenge date (YYYY-MM-DD). */
  date?: string;
  /** Daily only: per-guess correctness, in order — the 🟩/🟥 grid. */
  results?: boolean[];
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Date of Daily #1 — the first seed ever generated. */
export const DAILY_EPOCH = "2026-05-08";

const DAY_MS = 24 * 60 * 60 * 1000;

/** "Storm Count #151"-style puzzle number for a Daily date, or null if before the epoch. */
export function dailyPuzzleNumber(date: string): number | null {
  if (!DATE_RE.test(date)) return null;
  const n = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${DAILY_EPOCH}T00:00:00Z`)) / DAY_MS) + 1;
  return n >= 1 ? n : null;
}

const GRID_ROW = 10;

/** Spoiler-free result grid: one 🟩/🟥 per guess, rows of ten. */
export function buildResultGrid(results: boolean[]): string {
  const rows: string[] = [];
  for (let i = 0; i < results.length; i += GRID_ROW) {
    rows.push(results.slice(i, i + GRID_ROW).map((ok) => (ok ? "🟩" : "🟥")).join(""));
  }
  return rows.join("\n");
}

/**
 * Validate raw searchParams into a SharePayload, or null if anything is off.
 * Params arrive from arbitrary URLs, so everything is treated as hostile:
 * strict numeric formats, score bounded by total (daily) or a sane cap.
 */
export function parseShareParams(sp: {
  [key: string]: string | string[] | undefined;
}): SharePayload | null {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const mode = one(sp.mode);
  if (mode !== "daily" && mode !== "survival") return null;

  const scoreRaw = one(sp.score);
  if (!scoreRaw || !/^\d{1,4}$/.test(scoreRaw)) return null;
  const score = parseInt(scoreRaw, 10);

  if (mode === "daily") {
    const totalRaw = one(sp.total);
    if (totalRaw && !/^\d{1,3}$/.test(totalRaw)) return null;
    const total = totalRaw ? parseInt(totalRaw, 10) : 50;
    if (total < 1 || score > total) return null;

    const dateRaw = one(sp.date);
    if (dateRaw && !DATE_RE.test(dateRaw)) return null;

    // Optional result bits: must be consistent with the score and total.
    let results: boolean[] | undefined;
    const resultsRaw = one(sp.r);
    if (resultsRaw) {
      if (!/^[01]{1,100}$/.test(resultsRaw) || resultsRaw.length !== total) return null;
      results = [...resultsRaw].map((c) => c === "1");
      if (results.filter(Boolean).length !== score) return null;
    }

    return { mode, score, total, date: dateRaw || undefined, results };
  }

  return { mode, score };
}

/** Relative share-page path, e.g. "/share?mode=daily&score=42&total=50&date=2026-06-10". */
export function buildSharePath(p: SharePayload): string {
  const qs = new URLSearchParams({ mode: p.mode, score: String(p.score) });
  if (p.mode === "daily") {
    if (p.total != null) qs.set("total", String(p.total));
    if (p.date) qs.set("date", p.date);
    if (p.results?.length) qs.set("r", p.results.map((ok) => (ok ? "1" : "0")).join(""));
  }
  return `/share?${qs.toString()}`;
}

/**
 * Absolute share URL tagged with UTM params, so analytics can tell which
 * platform a visit came from. `source` is the platform ("x", "reddit", "copy"…).
 */
export function buildShareUrl(p: SharePayload, source: string): string {
  const utm = new URLSearchParams({
    utm_source: source,
    utm_medium: "social",
    utm_campaign: "share",
  });
  return `https://${BRAND.domain}${buildSharePath(p)}&${utm.toString()}`;
}

/** "42/50" for daily, "42" for survival. */
export function shareScoreLabel(p: SharePayload): string {
  return p.mode === "daily" && p.total != null ? `${p.score}/${p.total}` : `${p.score}`;
}

/** "Storm Count #151" (or "Storm Count Daily 2026-…" before the epoch / without a date). */
function dailyHeading(p: SharePayload): string {
  const n = p.date ? dailyPuzzleNumber(p.date) : null;
  if (n) return `${BRAND.name} #${n}`;
  return `${BRAND.name} Daily${p.date ? ` ${p.date}` : ""}`;
}

/**
 * Social post text. Daily posts are Wordle-style: a heading line plus the
 * 🟩/🟥 grid, which reads at a glance when pasted into a chat and spoils
 * nothing. `singleLine` is for targets that can't take newlines (Reddit titles).
 */
export function buildShareMessage(
  p: SharePayload,
  { streak = 0, singleLine = false }: { streak?: number; singleLine?: boolean } = {},
): string {
  if (p.mode === "daily") {
    const streakLabel = streak >= 2 ? ` · 🔥 ${streak}-day streak` : "";
    const heading = `⚡ ${dailyHeading(p)} — ${shareScoreLabel(p)}${streakLabel}`;
    if (singleLine || !p.results?.length) {
      return `${heading}. Think you can read the storm better?`;
    }
    return `${heading}\n${buildResultGrid(p.results)}`;
  }
  return `⚡ ${BRAND.name} Survival — ${p.score} spell${p.score === 1 ? "" : "s"} deep before the storm broke. How long can you survive?`;
}

/** Third-person description for the share page's OG metadata. */
export function buildShareDescription(p: SharePayload): string {
  if (p.mode === "daily") {
    const n = p.date ? dailyPuzzleNumber(p.date) : null;
    const dateLabel = n ? ` #${n}` : p.date ? ` for ${p.date}` : "";
    return `A fellow mage scored ${shareScoreLabel(p)} on the ${BRAND.name} Daily Challenge${dateLabel}. Think you can read the storm better?`;
  }
  return `A fellow mage survived ${p.score} spell${p.score === 1 ? "" : "s"} deep in ${BRAND.name} Survival. How long can you last?`;
}
