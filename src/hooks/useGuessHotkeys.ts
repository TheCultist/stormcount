"use client";

import { useEffect, useEffectEvent } from "react";
import type { GuessDirection } from "@/lib/types";

/** Key (lower-cased `KeyboardEvent.key`) → guess. ↑/W = higher, ↓/S = lower. */
const KEY_TO_GUESS: Record<string, GuessDirection> = {
  arrowup: "higher",
  w: "higher",
  arrowdown: "lower",
  s: "lower",
};

/** True when the event originates from a field the user is typing into. */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * Window-level keyboard shortcuts for Higher/Lower guesses.
 *
 * Ignores auto-repeat, any modifier combo (so Ctrl/Cmd+S, Ctrl+W etc. keep
 * their browser meaning and never register a guess), and keystrokes aimed at
 * editable fields.
 */
export function useGuessHotkeys(
  enabled: boolean,
  onGuess: (dir: GuessDirection) => void,
): void {
  const fireGuess = useEffectEvent(onGuess);

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;
      const dir = KEY_TO_GUESS[e.key.toLowerCase()];
      if (!dir) return;
      e.preventDefault();
      fireGuess(dir);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled]);
}
