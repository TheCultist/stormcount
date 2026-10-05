"use client";

import { useEffect, useState } from "react";
import { BRAND } from "@/lib/constants";
import {
  dismissInstallPrompt,
  finishedRuns,
  isInstallPromptDismissed,
} from "@/lib/engagement";

/** Shown once a browser has finished this many runs (any mode). */
const MIN_FINISHED_RUNS = 3;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Chromium fires `beforeinstallprompt` once, early in the page's life — long
// before an end screen mounts — so capture it at module load. We don't call
// preventDefault: the browser's own install UI keeps working as before.
let installEvent: BeforeInstallPromptEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    installEvent = e as BeforeInstallPromptEvent;
  });
  window.addEventListener("appinstalled", () => {
    installEvent = null;
  });
}

type Variant = "install" | "ios" | "bookmark";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * End-screen nudge for returning players: install the app where the browser
 * supports it, an "Add to Home Screen" hint on iOS, a bookmark hint
 * elsewhere. Appears after a few finished runs, never when already
 * installed, and stays gone once dismissed.
 */
export default function InstallPrompt() {
  const [variant, setVariant] = useState<Variant | null>(null);

  useEffect(() => {
    if (isInstallPromptDismissed() || finishedRuns() < MIN_FINISHED_RUNS || isStandalone()) return;
    if (installEvent) setVariant("install");
    else if (/iPad|iPhone|iPod/.test(navigator.userAgent)) setVariant("ios");
    else setVariant("bookmark");
  }, []);

  if (!variant) return null;

  const close = () => {
    dismissInstallPrompt();
    setVariant(null);
  };

  const install = async () => {
    const event = installEvent;
    if (!event) return close();
    installEvent = null; // a prompt event can only be used once
    await event.prompt().catch(() => {});
    close();
  };

  const message = {
    install: `Install ${BRAND.name} for one-tap access to each day's challenge.`,
    ios: "Tap Share, then “Add to Home Screen” for one-tap access to each day's challenge.",
    bookmark: "Bookmark this page (Ctrl/⌘ + D) to come back for each day's challenge.",
  }[variant];

  return (
    <div
      role="region"
      aria-label="Play every day"
      className="w-full rounded border border-brass/25 bg-paper-2/30 px-4 py-3 text-center"
    >
      <p className="eyebrow text-[9px] text-brass-bright">Play every day</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/80">
        {message} A new Daily drops at 00:00 UTC.
      </p>
      <div className="mt-3 flex items-center justify-center gap-3">
        {variant === "install" && (
          <button type="button" onClick={install} className="btn-primary">
            Install
          </button>
        )}
        <button type="button" onClick={close} className="btn-ghost">
          {variant === "install" ? "Not now" : "Got it"}
        </button>
      </div>
    </div>
  );
}
