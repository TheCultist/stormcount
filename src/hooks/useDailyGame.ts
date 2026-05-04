"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { MtgCard, GuessDirection, GuessResult, SubmitScorePayload } from "@/lib/types";

/**
 * pregame — cards loaded, first play of the day → show rules screen
 * gate    — cards loaded, already played today → show "play again?" gate
 * idle    — game board ready, waiting for first guess
 */
export type DailyStatus =
  | "loading"
  | "pregame"
  | "gate"
  | "idle"
  | "playing"
  | "revealed"
  | "submitting"
  | "done"
  | "error";

const REVEAL_DURATION_MS = 1000;
const PLAYED_KEY = "stormcount_daily_played";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function markPlayed(date: string) {
  try { localStorage.setItem(PLAYED_KEY, date); } catch { /* ignore */ }
}

// ── Deferred score (anonymous play → sign in later) ──────────────────────────

type DeferredScore = {
  date: string;
  score: number;
  elapsed_ms: number;
  guesses: GuessDirection[];
};

const deferredKey = (date: string) => `stormcount_deferred_${date}`;

function saveDeferredScore(s: DeferredScore) {
  try { localStorage.setItem(deferredKey(s.date), JSON.stringify(s)); } catch { /* ignore */ }
}

function loadDeferredScore(date: string): DeferredScore | null {
  try {
    const raw = localStorage.getItem(deferredKey(date));
    return raw ? (JSON.parse(raw) as DeferredScore) : null;
  } catch { return null; }
}

function clearDeferredScore(date: string) {
  try { localStorage.removeItem(deferredKey(date)); } catch { /* ignore */ }
}

// ─────────────────────────────────────────────────────────────────────────────

export interface DailyGameState {
  status: DailyStatus;
  /** True while replaying today's seed for fun — score is never submitted. */
  practiceMode: boolean;
  /**
   * True when the game ended but the score could not be saved because the
   * user is not signed in. The deferred score is preserved in localStorage
   * and will be auto-submitted the next time the user visits /daily while
   * signed in.
   */
  scoreUnsaved: boolean;
  /**
   * True when a deferred (previously anonymous) score was automatically
   * submitted on this page load after the user signed in.
   */
  scoreAutoSaved: boolean;
  date: string;
  themed: string | null;
  anchor: MtgCard | null;
  mystery: MtgCard | null;
  round: number;
  totalRounds: number;
  score: number;
  lastResult: GuessResult | null;
  elapsedMs: number;
  rank: number | null;
  error: string | null;
  /** pregame → idle (normal first play). */
  startGame: () => void;
  /** gate → idle in practice mode (score not submitted). */
  startPractice: () => void;
  guess: (dir: GuessDirection) => void;
}

export function useDailyGame(): DailyGameState {
  const [status, setStatus] = useState<DailyStatus>("loading");
  const [practiceMode, setPracticeMode] = useState(false);
  const [date, setDate] = useState(todayUtc());
  const [themed, setThemed] = useState<string | null>(null);
  const [cards, setCards] = useState<MtgCard[]>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [lastResult, setLastResult] = useState<GuessResult | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [rank, setRank] = useState<number | null>(null);
  const [scoreUnsaved, setScoreUnsaved] = useState(false);
  const [scoreAutoSaved, setScoreAutoSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const guessesRef = useRef<GuessDirection[]>([]);
  const scoreRef = useRef(0);
  const dateRef = useRef(date);
  dateRef.current = date;
  const practiceModeRef = useRef(practiceMode);
  practiceModeRef.current = practiceMode;

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - (startTimeRef.current ?? Date.now()));
    }, 250);
  }, []);

  /**
   * Load the daily seed. If the user hasn't played yet:
   *   1. Check for a deferred (anonymous) score from a previous session.
   *   2. If found, try to submit it immediately. This succeeds if the user is
   *      now signed in. On 401 (still not signed in) we show the done screen
   *      again so they can sign in when ready.
   *   3. If no deferred score, show the normal pregame rules screen.
   */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cards/daily");
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data: {
          date: string;
          themed: string | null;
          cards: MtgCard[];
          alreadyPlayed: boolean;
        } = await res.json();

        if (cancelled) return;
        setDate(data.date);
        setThemed(data.themed);
        setCards(data.cards);

        if (data.alreadyPlayed) {
          setStatus("gate");
          return;
        }

        // Check for a deferred anonymous score saved from a previous session.
        const deferred = loadDeferredScore(data.date);
        if (deferred) {
          try {
            const submitRes = await fetch("/api/scores/submit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                date: deferred.date,
                score: deferred.score,
                elapsed_ms: deferred.elapsed_ms,
                guesses: deferred.guesses,
              } satisfies SubmitScorePayload),
            });

            if (submitRes.status === 401 || submitRes.status === 403) {
              // Still not signed in — restore the done screen with the unsaved flag
              // so they can see the sign-in prompt again.
              if (cancelled) return;
              setScore(deferred.score);
              setElapsedMs(deferred.elapsed_ms);
              setScoreUnsaved(true);
              setStatus("done");
              return;
            }

            if (submitRes.status === 409) {
              // Already in the DB somehow — clean up and treat as played.
              clearDeferredScore(data.date);
              markPlayed(data.date);
              if (cancelled) return;
              setScore(deferred.score);
              setElapsedMs(deferred.elapsed_ms);
              setStatus("gate");
              return;
            }

            const body = await submitRes.json();
            if (body.ok) {
              // 🎉 Deferred score submitted successfully after sign-in.
              clearDeferredScore(data.date);
              markPlayed(data.date);
              if (cancelled) return;
              setScore(deferred.score);
              setElapsedMs(deferred.elapsed_ms);
              setRank(body.rank ?? null);
              setScoreAutoSaved(true);
              setStatus("done");
              return;
            }
          } catch {
            // Network error during deferred submit — fall through to pregame.
          }
        }

        setStatus("pregame");
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to load daily challenge.";
        setError(msg);
        setStatus("error");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Start timer on first guess.
  useEffect(() => {
    if (status === "playing" && startTimeRef.current === null) {
      startTimer();
    }
  }, [status, startTimer]);

  // Cleanup timer on unmount.
  useEffect(() => () => stopTimer(), [stopTimer]);

  /**
   * Warn before tab close / refresh while a real run is in progress.
   * Sets e.returnValue to trigger the browser's native "Leave site?" dialog.
   * Does NOT submit here — submission only happens in the pagehide handler
   * below, which fires only if the user actually confirms leaving.
   */
  useEffect(() => {
    const inProgress = status === "playing" || status === "revealed";
    if (!inProgress || practiceModeRef.current) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [status]);

  /**
   * Auto-submit when the page is actually unloading (user confirmed leaving,
   * or navigated away via a Link). pagehide fires only on confirmed unload —
   * unlike beforeunload it does NOT fire when the user clicks "Stay".
   * keepalive keeps the request alive after the page is gone.
   */
  useEffect(() => {
    const inProgress = status === "playing" || status === "revealed";
    if (!inProgress) return;

    const onPageHide = () => {
      if (practiceModeRef.current) return;
      if (!startTimeRef.current || guessesRef.current.length === 0) return;

      const payload: SubmitScorePayload = {
        date: dateRef.current,
        score: scoreRef.current,
        elapsed_ms: Date.now() - startTimeRef.current,
        guesses: guessesRef.current,
      };
      fetch("/api/scores/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    };

    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [status]);

  /**
   * Intercept internal Next.js navigation (Link clicks) while a real run is
   * in progress. Runs in the capture phase so we can cancel before Next.js's
   * router picks up the event.
   *
   * NOTE: Next.js Link clicks are SPA transitions — the page never truly
   * unloads, so `pagehide` does NOT fire for these. We must submit the score
   * here directly when the user confirms leaving.
   */
  useEffect(() => {
    const inProgress = status === "playing" || status === "revealed";

    const onLinkClick = (e: MouseEvent) => {
      if (!inProgress || practiceModeRef.current) return;

      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href") ?? "";
      // Only block same-origin / relative links (internal navigation).
      if (!href || href.startsWith("http") || href.startsWith("//")) return;

      const confirmed = window.confirm(
        "You're mid-run! If you leave now, your current score will be recorded as your daily result. Leave anyway?",
      );
      if (!confirmed) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // User confirmed — submit the score now, before the SPA transition
      // removes this page. pagehide won't fire for client-side navigation so
      // we must do it here with keepalive so the request outlives the page.
      if (startTimeRef.current) {
        const payload: SubmitScorePayload = {
          date: dateRef.current,
          score: scoreRef.current,
          elapsed_ms: Date.now() - startTimeRef.current,
          guesses: guessesRef.current,
        };
        fetch("/api/scores/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      }
      // Navigation proceeds naturally after the fetch is fired.
    };

    document.addEventListener("click", onLinkClick, true);
    return () => document.removeEventListener("click", onLinkClick, true);
  }, [status]);

  // ── public actions ─────────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    setPracticeMode(false);
    setStatus("idle");
  }, []);

  const startPractice = useCallback(() => {
    // Reset game state for a fresh practice run.
    setPracticeMode(true);
    setRound(0);
    setScore(0);
    scoreRef.current = 0;
    guessesRef.current = [];
    startTimeRef.current = null;
    setElapsedMs(0);
    setLastResult(null);
    setRank(null);
    setStatus("idle");
  }, []);

  const submitScore = useCallback(
    async (finalScore: number, finalElapsedMs: number, allGuesses: GuessDirection[]) => {
      // Practice mode — skip server submission, jump straight to done.
      if (practiceModeRef.current) {
        setStatus("done");
        return;
      }

      setStatus("submitting");
      let notAuthenticated = false;
      try {
        const payload: SubmitScorePayload = {
          date,
          score: finalScore,
          elapsed_ms: finalElapsedMs,
          guesses: allGuesses,
        };
        const res = await fetch("/api/scores/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.status === 401 || res.status === 403) {
          // Not signed in — save the result for auto-submission after sign-in.
          saveDeferredScore({ date, score: finalScore, elapsed_ms: finalElapsedMs, guesses: allGuesses });
          notAuthenticated = true;
        } else {
          const data = await res.json();
          if (data.ok) setRank(data.rank ?? null);
        }
      } catch {
        // Non-fatal — game is still over.
      } finally {
        if (notAuthenticated) {
          setScoreUnsaved(true);
        } else {
          markPlayed(date);
        }
        setStatus("done");
      }
    },
    [date],
  );

  const guess = useCallback(
    (dir: GuessDirection) => {
      if (status !== "playing" && status !== "idle") return;
      if (cards.length < 2) return;

      if (status === "idle") setStatus("playing");

      const currentRound = round;
      const anchor = cards[currentRound];
      const mystery = cards[currentRound + 1];
      if (!anchor || !mystery) return;

      const correct =
        dir === "higher" ? mystery.cmc >= anchor.cmc : mystery.cmc < anchor.cmc;

      const newScore = scoreRef.current + (correct ? 1 : 0);
      scoreRef.current = newScore;
      guessesRef.current = [...guessesRef.current, dir];

      setLastResult(correct ? "correct" : "wrong");
      setScore(newScore);
      setStatus("revealed");

      const isLastRound = currentRound >= cards.length - 2;

      setTimeout(async () => {
        if (isLastRound) {
          stopTimer();
          const finalElapsed = startTimeRef.current
            ? Date.now() - startTimeRef.current
            : 0;
          setElapsedMs(finalElapsed);
          await submitScore(newScore, finalElapsed, guessesRef.current);
          return;
        }
        setRound(currentRound + 1);
        setLastResult(null);
        setStatus("playing");
      }, REVEAL_DURATION_MS);
    },
    [status, cards, round, stopTimer, submitScore],
  );

  const totalRounds = Math.max(0, cards.length - 1);
  const anchor = cards[round] ?? null;
  const mystery = cards[round + 1] ?? null;

  return {
    status,
    practiceMode,
    scoreUnsaved,
    scoreAutoSaved,
    date,
    themed,
    anchor,
    mystery,
    round,
    totalRounds,
    score,
    lastResult,
    elapsedMs,
    rank,
    error,
    startGame,
    startPractice,
    guess,
  };
}
