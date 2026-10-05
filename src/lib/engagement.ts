/**
 * Client-side engagement state (localStorage): the Daily play streak, how
 * many runs this browser has finished, and whether the install prompt was
 * dismissed. Storage can throw (private mode, blocked site data), so every
 * access degrades to "no data" instead of breaking the game.
 */
import { addDays } from "@/lib/dates";

const STREAK_KEY = "stormcount_daily_streak";
const PLAYS_KEY = "stormcount_runs_finished";
const INSTALL_DISMISSED_KEY = "stormcount_install_dismissed";

function read(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function write(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

type StoredStreak = { last: string; count: number };

function readStreak(): StoredStreak | null {
  try {
    const parsed = JSON.parse(read(STREAK_KEY) ?? "null") as StoredStreak | null;
    return parsed && typeof parsed.last === "string" && Number.isInteger(parsed.count) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Record a finished Daily for `date` and return the streak of consecutive
 * days played. Idempotent for the same date. A server-computed streak
 * (signed-in players, counted across devices) wins over the local count.
 */
export function recordDailyStreak(date: string, serverStreak?: number | null): number {
  const prev = readStreak();
  let count: number;
  if (serverStreak != null && serverStreak > 0) count = serverStreak;
  else if (prev?.last === date) count = prev.count;
  else if (prev?.last === addDays(date, -1)) count = prev.count + 1;
  else count = 1;
  write(STREAK_KEY, JSON.stringify({ last: date, count }));
  return count;
}

/** Count one finished run (any mode). Returns the new total. */
export function recordFinishedRun(): number {
  const next = (parseInt(read(PLAYS_KEY) ?? "0", 10) || 0) + 1;
  write(PLAYS_KEY, String(next));
  return next;
}

export function finishedRuns(): number {
  return parseInt(read(PLAYS_KEY) ?? "0", 10) || 0;
}

export function isInstallPromptDismissed(): boolean {
  return read(INSTALL_DISMISSED_KEY) === "1";
}

export function dismissInstallPrompt() {
  write(INSTALL_DISMISSED_KEY, "1");
}
