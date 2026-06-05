"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { MtgCard, GuessDirection } from "@/lib/types";

export type SurvivalStatus = "idle" | "playing" | "revealed" | "gameover";
export type GuessResult = "correct" | "wrong";

/** Local display PB — always written, shown even when signed out. */
const PB_STORAGE_KEY = "stormcount_survival_pb";
/** Pending submission for anonymous players — cleared once synced to DB. */
const DEFERRED_KEY = "stormcount_survival_deferred";
const LOW_WATER_MARK = 3;
const REVEAL_DURATION_MS = 1000;

// ── local-storage helpers ──────────────────────────────────────────────────

function readPB(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(PB_STORAGE_KEY) ?? "0", 10) || 0;
}

function writePB(score: number): number {
  const prev = readPB();
  const next = Math.max(prev, score);
  localStorage.setItem(PB_STORAGE_KEY, next.toString());
  return next;
}

function readDeferred(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(DEFERRED_KEY);
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

function writeDeferred(score: number) {
  try { localStorage.setItem(DEFERRED_KEY, String(score)); } catch { /* ignore */ }
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
  // Cap exclude list length to avoid huge URLs.
  const excludeParam =
    exclude.length > 0 ? `?exclude=${exclude.slice(0, 60).join(",")}` : "";
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
  const isFetchingRef = useRef(false);

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
  useEffect(() => {
    const isActive = status === "playing" || status === "revealed";

    // ── browser unload (close tab, refresh, external URL) ──────────────────
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    if (isActive) {
      window.addEventListener("beforeunload", onBeforeUnload);
    }

    // ── internal Next.js navigation (Link clicks) ───────────────────────────
    // Intercept in capture phase — runs before Next.js's router onClick.
    // stopPropagation() prevents the event from reaching the bubble phase,
    // which is where Next.js attaches its router.push() handler.
    const onLinkClick = (e: MouseEvent) => {
      if (!isActive) return;

      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href") ?? "";
      // Only block same-origin / relative links (internal navigation).
      if (href.startsWith("http") || href.startsWith("//") || !href) return;

      const confirmed = window.confirm(
        "Your run is still active. Leave and lose your current streak?",
      );
      if (!confirmed) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("click", onLinkClick, true);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onLinkClick, true);
    };
  }, [status]);

  // ── internal: fill the queue ─────────────────────────────────────────────

  const fillQueue = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const exclude = Array.from(seenIdsRef.current);
      const cards = await fetchSurvivalBatch(exclude);
      const fresh = cards.filter((c) => !seenIdsRef.current.has(c.id));
      fresh.forEach((c) => seenIdsRef.current.add(c.id));
      queueRef.current = [...queueRef.current, ...fresh];
    } catch (err) {
      console.error("[useSurvivalGame] fillQueue error:", err);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // ── internal: pop next card from queue ──────────────────────────────────

  const popQueue = useCallback(async (): Promise<MtgCard | null> => {
    // If queue is empty, wait for in-flight fetch or trigger one.
    if (queueRef.current.length === 0) {
      if (!isFetchingRef.current) {
        await fillQueue();
      } else {
        // Poll until fetch completes.
        await new Promise<void>((resolve) => {
          const interval = setInterval(() => {
            if (!isFetchingRef.current || queueRef.current.length > 0) {
              clearInterval(interval);
              resolve();
            }
          }, 100);
        });
      }
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
    isFetchingRef.current = false;

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

      const correct =
        dir === "higher"
          ? currentMystery.cmc >= anchor.cmc
          : currentMystery.cmc < anchor.cmc;

      setLastResult(correct ? "correct" : "wrong");
      setStatus("revealed");

      if (!correct) {
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

        setTimeout(() => setStatus("gameover"), REVEAL_DURATION_MS);
        return;
      }

      // Correct — advance.
      const newStreak = currentStreak + 1;
      setStreak(newStreak);

      // Background-fetch if queue is running low.
      if (queueRef.current.length <= LOW_WATER_MARK && !isFetchingRef.current) {
        fillQueue();
      }

      setTimeout(async () => {
        const nextCard = await popQueue();
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
