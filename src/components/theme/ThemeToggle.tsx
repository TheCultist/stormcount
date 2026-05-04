"use client";

import { useTheme } from "@/components/theme/ThemeProvider";

export function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="group relative flex h-8 w-8 items-center justify-center rounded-sm border border-border-strong/60 text-foreground/60 transition-colors duration-200 hover:border-border-strong hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {/* Sun — shown in dark mode (click → go light) */}
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className={`absolute h-3.5 w-3.5 transition-all duration-300 ${
          isDark
            ? "scale-100 opacity-100"
            : "scale-50 rotate-90 opacity-0"
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <circle cx="8" cy="8" r="2.8" />
        <line x1="8" y1="1" x2="8" y2="2.5" />
        <line x1="8" y1="13.5" x2="8" y2="15" />
        <line x1="1" y1="8" x2="2.5" y2="8" />
        <line x1="13.5" y1="8" x2="15" y2="8" />
        <line x1="3.05" y1="3.05" x2="4.1" y2="4.1" />
        <line x1="11.9" y1="11.9" x2="12.95" y2="12.95" />
        <line x1="12.95" y1="3.05" x2="11.9" y2="4.1" />
        <line x1="4.1" y1="11.9" x2="3.05" y2="12.95" />
      </svg>

      {/* Moon — shown in light mode (click → go dark) */}
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className={`absolute h-3.5 w-3.5 transition-all duration-300 ${
          isDark
            ? "scale-50 -rotate-90 opacity-0"
            : "scale-100 opacity-100"
        }`}
        fill="currentColor"
      >
        <path d="M8.5 2a6.5 6.5 0 1 0 5.5 9.94A5.5 5.5 0 0 1 8.5 2z" />
      </svg>
    </button>
  );
}
