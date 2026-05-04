"use client";

import { useEffect } from "react";
import type { GuessDirection } from "@/lib/types";

type GuessButtonsProps = {
  onGuess?: (direction: GuessDirection) => void;
  disabled?: boolean;
};

/**
 * Two large stamp-style guess buttons. Squared, codex-feel.
 * Keyboard: ↑ / W = higher, ↓ / S = lower.
 */
export default function GuessButtons({ onGuess, disabled }: GuessButtonsProps) {
  const handle = (direction: GuessDirection) => {
    if (disabled) return;
    onGuess?.(direction);
    if (!onGuess) {
      console.log(`[skeleton] guess: ${direction}`);
    }
  };

  useEffect(() => {
    if (disabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") {
        e.preventDefault();
        handle("higher");
      } else if (k === "arrowdown" || k === "s") {
        e.preventDefault();
        handle("lower");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, onGuess]);

  return (
    <div className="flex w-full max-w-2xl flex-col items-stretch gap-3 sm:flex-row">
      <GuessButton
        direction="higher"
        label="Higher or Equal"
        glyph="▲"
        kbd="↑"
        onClick={() => handle("higher")}
        disabled={disabled}
      />
      <GuessButton
        direction="lower"
        label="Lower"
        glyph="▼"
        kbd="↓"
        onClick={() => handle("lower")}
        disabled={disabled}
      />
    </div>
  );
}

type GuessButtonProps = {
  direction: GuessDirection;
  label: string;
  glyph: string;
  kbd: string;
  onClick: () => void;
  disabled?: boolean;
};

function GuessButton({
  label,
  glyph,
  kbd,
  onClick,
  disabled,
}: GuessButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="codex rim-brass group relative isolate flex flex-1 items-center justify-between gap-4 overflow-hidden rounded-md px-7 py-5 text-left transition-all duration-300 ease-out hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40"
      aria-label={label}
    >
      {/* Hover wash */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(232,193,129,0.16), transparent 70%)",
        }}
      />

      <div className="flex items-center gap-4">
        {/* Glyph stamp */}
        <span
          aria-hidden
          className="storm-display flex h-10 w-10 items-center justify-center rounded-sm border border-brass/40 bg-paper-3/60 text-base text-brass-bright transition-colors duration-300 group-hover:border-brass-bright group-hover:text-brass-bright"
        >
          {glyph}
        </span>
        <span
          className="storm-display text-[15px] font-semibold uppercase tracking-[0.18em] text-foreground transition-colors duration-300 group-hover:text-brass-bright"
          style={{ fontVariationSettings: '"opsz" 96, "SOFT" 30' }}
        >
          {label}
        </span>
      </div>

      <kbd
        aria-hidden
        className="storm-mono hidden items-center justify-center rounded-sm border border-rule/60 bg-background-deep/40 px-2 py-1 text-[11px] font-medium text-muted/80 sm:inline-flex"
      >
        {kbd}
      </kbd>
    </button>
  );
}
