"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "izzet" | "izzet-light";

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem("sc-theme") as Theme | null;
    if (stored === "izzet" || stored === "izzet-light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "izzet"
      : "izzet-light";
  } catch {
    return "izzet";
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with dark to match the FOUC-prevention script default.
  // Corrected to actual preference on first effect run.
  const [theme, setTheme] = useState<Theme>("izzet");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const resolved = getInitialTheme();
    setTheme(resolved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("sc-theme", theme);
    } catch {
      // private browsing — ignore
    }
  }, [theme, mounted]);

  const toggle = () =>
    setTheme((t) => (t === "izzet" ? "izzet-light" : "izzet"));

  return (
    <ThemeContext.Provider
      value={{ theme, isDark: theme === "izzet", toggle }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

/** Inline script injected into <head> before React hydrates.
 *  Prevents flash of wrong theme on page load. */
export const themeScript = `(function(){try{var s=localStorage.getItem('sc-theme');if(s==='izzet'||s==='izzet-light'){document.documentElement.dataset.theme=s;return;}var d=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=d?'izzet':'izzet-light';}catch(e){document.documentElement.dataset.theme='izzet';}})();`;
