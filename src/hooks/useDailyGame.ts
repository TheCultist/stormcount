"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { MtgCard, GuessDirection, GuessResult, SubmitScorePayload } from "@/lib/types";
import { REVEAL_DURATION_MS } from "@/lib/constants";
import { todayUtc } from "@/lib/dates";
import { isCorrectGuess, scoreGuesses } from "@/lib/game";
import { recordDailyStreak, recordFinishedRun } from "@/lib/engagement";
import { useLeaveGuard } from "./useLeaveGuard";

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

const PLAYED_KEY = "stormcount_daily_played";
const LEAVE_MESSAGE =
  "You're mid-run! If you leave now, your current score will be recorded as your daily result. Leave anyway?";

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
  /** The full ordered card list for the current day's seed. */
  cards: MtgCard[];
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
  themedDescription: string | null;
  anchor: MtgCard | null;
  mystery: MtgCard | null;
  round: number;
  totalRounds: number;
  score: number;
  lastResult: GuessResult | null;
  elapsedMs: number;
  rank: number | null;
  /** Per-guess correctness so far, in order (drives the share grid). */
  results: boolean[];
  /** Consecutive days played, once a ranked run is finished (null otherwise). */
  streak: number | null;
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
  const [themedDescription, setThemedDescription] = useState<string | null>(null);
  const [cards, setCards] = useState<MtgCard[]>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [lastResult, setLastResult] = useState<GuessResult | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [rank, setRank] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [streak, setStreak] = useState<number | null>(null);
  const [scoreUnsaved, setScoreUnsaved] = useState(false);
  const [scoreAutoSaved, setScoreAutoSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** The ranked result has been sent (end of run or leaving mid-run). */
  const submittedRef = useRef(false);
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
          themedDescription: string | null;
          cards: MtgCard[];
          alreadyPlayed: boolean;
        } = await res.json();

        if (cancelled) return;
        setDate(data.date);
        setThemed(data.themed);
        setThemedDescription(data.themedDescription ?? null);
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
              setResults(scoreGuesses(data.cards, deferred.guesses));
              setStreak(recordDailyStreak(data.date));
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
              setResults(scoreGuesses(data.cards, deferred.guesses));
              setStreak(recordDailyStreak(data.date, body.streak));
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

  // Cleanup timers on unmount.
  useEffect(
    () => () => {
      stopTimer();
      if (revealTimeoutRef.current !== null) clearTimeout(revealTimeoutRef.current);
    },
    [stopTimer],
  );

  /**
   * Leaving mid-run records the current score as the daily result (otherwise
   * a bad run could be abandoned and replayed). Fired by the leave guard on a
   * confirmed link click or a real page unload; keepalive lets the request
   * outlive the page.
   */
  const submitOnLeave = useCallback(() => {
    if (submittedRef.current || !startTimeRef.current || guessesRef.current.length === 0) return;
    submittedRef.current = true;
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
    }).catch(() => { /* page is going away — nothing to report to */ });
  }, []);

  useLeaveGuard(
    (status === "playing" || status === "revealed") && !practiceMode,
    LEAVE_MESSAGE,
    submitOnLeave,
  );

  // ── public actions ─────────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    setPracticeMode(false);
    setStatus("idle");
  }, []);

  const startPractice = useCallback(() => {
    // Reset game state for a fresh practice run.
    stopTimer();
    setPracticeMode(true);
    setRound(0);
    setScore(0);
    scoreRef.current = 0;
    guessesRef.current = [];
    setResults([]);
    setStreak(null);
    startTimeRef.current = null;
    setElapsedMs(0);
    setLastResult(null);
    setRank(null);
    setStatus("idle");
  }, [stopTimer]);

  const submitScore = useCallback(
    async (finalScore: number, finalElapsedMs: number, allGuesses: GuessDirection[]) => {
      // Practice mode — skip server submission, jump straight to done.
      if (practiceModeRef.current) {
        setStatus("done");
        return;
      }
      if (submittedRef.current) {
        setStatus("done");
        return;
      }
      submittedRef.current = true;

      setStatus("submitting");
      let notAuthenticated = false;
      let serverStreak: number | undefined;
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
          if (data.ok) {
            setRank(data.rank ?? null);
            serverStreak = data.streak;
          }
        }
      } catch {
        // Non-fatal — game is still over.
      } finally {
        // Signed-in: the server's cross-device count; otherwise this browser's.
        setStreak(recordDailyStreak(date, serverStreak));
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

      // The clock starts on the first guess.
      if (status === "idle") startTimer();

      const currentRound = round;
      const anchor = cards[currentRound];
      const mystery = cards[currentRound + 1];
      if (!anchor || !mystery) return;

      const correct = isCorrectGuess(anchor, mystery, dir);

      const newScore = scoreRef.current + (correct ? 1 : 0);
      scoreRef.current = newScore;
      guessesRef.current = [...guessesRef.current, dir];

      setLastResult(correct ? "correct" : "wrong");
      setScore(newScore);
      setResults((prev) => [...prev, correct]);
      setStatus("revealed");

      const isLastRound = currentRound >= cards.length - 2;

      revealTimeoutRef.current = setTimeout(async () => {
        revealTimeoutRef.current = null;
        if (isLastRound) {
          stopTimer();
          recordFinishedRun();
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
    [status, cards, round, startTimer, stopTimer, submitScore],
  );

  const totalRounds = Math.max(0, cards.length - 1);
  const anchor = cards[round] ?? null;
  const mystery = cards[round + 1] ?? null;

  return {
    status,
    cards,
    practiceMode,
    scoreUnsaved,
    scoreAutoSaved,
    date,
    themed,
    themedDescription,
    anchor,
    mystery,
    round,
    totalRounds,
    score,
    lastResult,
    elapsedMs,
    rank,
    results,
    streak,
    error,
    startGame,
    startPractice,
    guess,
  };
}
