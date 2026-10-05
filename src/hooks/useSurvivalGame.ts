"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { MtgCard, GuessDirection, GuessResult } from "@/lib/types";
import { REVEAL_DURATION_MS } from "@/lib/constants";
import { isCorrectGuess } from "@/lib/game";
import { recordFinishedRun } from "@/lib/engagement";
import { useLeaveGuard } from "./useLeaveGuard";

export type SurvivalStatus = "idle" | "playing" | "revealed" | "gameover";

/** Local display PB — always written, shown even when signed out. */
const PB_STORAGE_KEY = "stormcount_survival_pb";
/** Pending submission for anonymous players — cleared once synced to DB. */
const DEFERRED_KEY = "stormcount_survival_deferred";
const LOW_WATER_MARK = 3;
/** Most-recent seen card ids sent as `exclude` (keeps the URL short). */
const MAX_EXCLUDE = 60;

// ── local-storage helpers ──────────────────────────────────────────────────

// Storage can throw (private mode, blocked site data) — never let it break a run.

function readPB(): number {
  try {
    return parseInt(localStorage.getItem(PB_STORAGE_KEY) ?? "0", 10) || 0;
  } catch { return 0; }
}

function writePB(score: number): number {
  const next = Math.max(readPB(), score);
  try { localStorage.setItem(PB_STORAGE_KEY, next.toString()); } catch { /* ignore */ }
  return next;
}

function readDeferred(): number | null {
  try {
    const raw = localStorage.getItem(DEFERRED_KEY);
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? null : n;
  } catch { return null; }
}

/** Keeps the best pending score — a later, worse anonymous run must not replace it. */
function writeDeferred(score: number) {
  const best = Math.max(readDeferred() ?? 0, score);
  try { localStorage.setItem(DEFERRED_KEY, String(best)); } catch { /* ignore */ }
}

function clearDeferred() {
  try { localStorage.removeItem(DEFERRED_KEY); } catch { /* ignore */ }
}

async function submitSurvivalScore(score: number): Promise<{ ok: boolean; best?: number; status: number }> {
  try {
    const res = await fetch("/api/scores/survival", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score }),
    });
    if (!res.ok) return { ok: false, status: res.status };
    const data = await res.json();
    return { ok: true, best: data.best, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

// ── Scryfall fetch ─────────────────────────────────────────────────────────

async function fetchSurvivalBatch(exclude: string[]): Promise<MtgCard[]> {
  // Only the most recent ids — those are the ones a repeat would be noticed for.
  const excludeParam =
    exclude.length > 0 ? `?exclude=${exclude.slice(-MAX_EXCLUDE).join(",")}` : "";
  const res = await fetch(`/api/cards/survival${excludeParam}`);
  if (!res.ok) throw new Error(`Survival API error: ${res.status}`);
  const data: { cards: MtgCard[] } = await res.json();
  return data.cards;
}

// ── hook ───────────────────────────────────────────────────────────────────

export function useSurvivalGame() {
  const [status, setStatus] = useState<SurvivalStatus>("idle");
  const [anchor, setAnchor] = useState<MtgCard | null>(null);
  const [mystery, setMystery] = useState<MtgCard | null>(null);
  const [streak, setStreak] = useState(0);
  const [personalBest, setPersonalBest] = useState(0);
  const [lastResult, setLastResult] = useState<GuessResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Run ended while signed out — score is deferred, awaiting sign-in. */
  const [scoreUnsaved, setScoreUnsaved] = useState(false);
  /** A deferred score was auto-submitted after the player signed in. */
  const [scoreAutoSaved, setScoreAutoSaved] = useState(false);

  // Mutable refs — safe to access inside async callbacks / timeouts.
  const queueRef = useRef<MtgCard[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  /** In-flight queue refill, shared by everyone waiting for cards. */
  const fetchRef = useRef<Promise<void> | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (revealTimeoutRef.current !== null) clearTimeout(revealTimeoutRef.current);
  }, []);

  // Load local PB on mount, then try to flush any deferred anonymous score.
  useEffect(() => {
    setPersonalBest(readPB());

    const deferred = readDeferred();
    if (deferred == null) return;

    // Try to sync the pending score now that the user may have signed in.
    submitSurvivalScore(deferred).then((result) => {
      if (result.ok) {
        clearDeferred();
        setScoreAutoSaved(true);
        // Update display PB if the server reports a higher value.
        if (result.best != null) {
          setPersonalBest((prev) => Math.max(prev, result.best!));
        }
      }
      // If 401/403: still not signed in — leave deferred in localStorage.
    });
  }, []);

  // Warn before tab close / refresh / internal navigation while a run is active.
  useLeaveGuard(
    status === "playing" || status === "revealed",
    "Your run is still active. Leave and lose your current streak?",
  );

  // ── internal: fill the queue ─────────────────────────────────────────────

  const fillQueue = useCallback((): Promise<void> => {
    if (fetchRef.current) return fetchRef.current;
    const pending = (async () => {
      try {
        const exclude = Array.from(seenIdsRef.current);
        const cards = await fetchSurvivalBatch(exclude);
        const fresh = cards.filter((c) => !seenIdsRef.current.has(c.id));
        fresh.forEach((c) => seenIdsRef.current.add(c.id));
        queueRef.current = [...queueRef.current, ...fresh];
      } catch (err) {
        console.error("[useSurvivalGame] fillQueue error:", err);
      }
    })().finally(() => {
      // A restart may have replaced the in-flight refill — don't clobber it.
      if (fetchRef.current === pending) fetchRef.current = null;
    });
    fetchRef.current = pending;
    return pending;
  }, []);

  // ── internal: pop next card from queue ──────────────────────────────────

  /** Next card, refilling (with one retry) when empty; null if none could be loaded. */
  const popQueue = useCallback(async (): Promise<MtgCard | null> => {
    for (let attempt = 0; attempt < 2 && queueRef.current.length === 0; attempt++) {
      await fillQueue();
    }
    const next = queueRef.current[0] ?? null;
    if (next) queueRef.current = queueRef.current.slice(1);
    return next;
  }, [fillQueue]);

  // ── start / restart ──────────────────────────────────────────────────────

  const start = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStatus("idle");
    setLastResult(null);
    setStreak(0);
    setScoreUnsaved(false);
    setScoreAutoSaved(false);

    // Reset mutable state.
    queueRef.current = [];
    seenIdsRef.current = new Set();
    fetchRef.current = null;

    try {
      await fillQueue();

      const firstAnchor = await popQueue();
      const firstMystery = await popQueue();

      if (!firstAnchor || !firstMystery) {
        throw new Error("Not enough cards returned from the API.");
      }

      setAnchor(firstAnchor);
      setMystery(firstMystery);
      setStatus("playing");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [fillQueue, popQueue]);

  // ── guess ────────────────────────────────────────────────────────────────

  const guess = useCallback(
    async (dir: GuessDirection) => {
      if (status !== "playing" || !anchor || !mystery) return;

      // Capture current values — safe in setTimeout closure.
      const currentMystery = mystery;
      const currentStreak = streak;

      const correct = isCorrectGuess(anchor, currentMystery, dir);

      setLastResult(correct ? "correct" : "wrong");
      setStatus("revealed");

      if (!correct) {
        recordFinishedRun();
        const newPB = writePB(currentStreak);
        setPersonalBest(newPB);

        // Try to persist the score to the DB.
        submitSurvivalScore(currentStreak).then((result) => {
          if (result.status === 401 || result.status === 403) {
            // Not signed in — save as deferred so we submit after login,
            // and flag the end screen to show the sign-in prompt.
            writeDeferred(currentStreak);
            setScoreUnsaved(true);
          }
          // On success: DB now holds the best. On other errors: localStorage
          // still has the PB for display, and next run will re-attempt.
        });

        revealTimeoutRef.current = setTimeout(() => setStatus("gameover"), REVEAL_DURATION_MS);
        return;
      }

      // Correct — advance.
      const newStreak = currentStreak + 1;
      setStreak(newStreak);

      // Background-fetch if queue is running low.
      if (queueRef.current.length <= LOW_WATER_MARK) {
        fillQueue();
      }

      revealTimeoutRef.current = setTimeout(async () => {
        const nextCard = await popQueue();
        if (!nextCard) {
          // Without this the board sat on a null mystery card forever.
          setPersonalBest(writePB(newStreak));
          setError("Couldn't load the next card");
          setStatus("idle");
          return;
        }
        setAnchor(currentMystery);
        setMystery(nextCard);
        setLastResult(null);
        setStatus("playing");
      }, REVEAL_DURATION_MS);
    },
    [status, anchor, mystery, streak, fillQueue, popQueue],
  );

  // ── restart ──────────────────────────────────────────────────────────────

  const restart = useCallback(() => {
    start();
  }, [start]);

  return {
    status,
    anchor,
    mystery,
    streak,
    personalBest,
    lastResult,
    isLoading,
    error,
    scoreUnsaved,
    scoreAutoSaved,
    start,
    guess,
    restart,
  };
}
