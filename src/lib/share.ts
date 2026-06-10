/**
 * Score-sharing helpers — single source of truth for the share URL shape,
 * the social-post message, and validation of inbound /share params.
 *
 * Used by three consumers that must stay in sync:
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
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

    return { mode, score, total, date: dateRaw || undefined };
  }

  return { mode, score };
}

/** Relative share-page path, e.g. "/share?mode=daily&score=42&total=50&date=2026-06-10". */
export function buildSharePath(p: SharePayload): string {
  const qs = new URLSearchParams({ mode: p.mode, score: String(p.score) });
  if (p.mode === "daily") {
    if (p.total != null) qs.set("total", String(p.total));
    if (p.date) qs.set("date", p.date);
  }
  return `/share?${qs.toString()}`;
}

/** "42/50" for daily, "42" for survival. */
export function shareScoreLabel(p: SharePayload): string {
  return p.mode === "daily" && p.total != null ? `${p.score}/${p.total}` : `${p.score}`;
}

/** First-person message used as the social post text. */
export function buildShareMessage(p: SharePayload): string {
  if (p.mode === "daily") {
    const dateLabel = p.date ? ` ${p.date}` : "";
    return `⚡ ${BRAND.name} Daily${dateLabel} — I scored ${shareScoreLabel(p)}. Think you can read the storm better?`;
  }
  return `⚡ ${BRAND.name} Survival — ${p.score} spell${p.score === 1 ? "" : "s"} deep before the storm broke. How long can you survive?`;
}

/** Third-person description for the share page's OG metadata. */
export function buildShareDescription(p: SharePayload): string {
  if (p.mode === "daily") {
    const dateLabel = p.date ? ` for ${p.date}` : "";
    return `A fellow mage scored ${shareScoreLabel(p)} on the ${BRAND.name} Daily Challenge${dateLabel}. Think you can read the storm better?`;
  }
  return `A fellow mage survived ${p.score} spell${p.score === 1 ? "" : "s"} deep in ${BRAND.name} Survival. How long can you last?`;
}
