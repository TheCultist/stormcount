"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ROUTES } from "@/lib/constants";

const CONSENT_KEY = "sc-cookie-consent";

type Consent = "accepted" | "rejected" | null;

function readConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "accepted" || v === "rejected" ? v : null;
  } catch {
    return null;
  }
}

/**
 * Consent banner + the analytics it governs: Vercel Analytics and Speed
 * Insights are only mounted once the visitor has accepted.
 */
export default function CookieBanner() {
  const [consent, setConsent] = useState<Consent>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = readConsent();
    setConsent(stored);
    if (!stored) {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const choose = (value: Exclude<Consent, null>) => {
    try { localStorage.setItem(CONSENT_KEY, value); } catch { /* ignore */ }
    setConsent(value);
    setVisible(false);
  };
  const accept = () => choose("accepted");
  const reject = () => choose("rejected");

  const analytics = consent === "accepted" && (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );

  if (!visible) return analytics;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-rule/60 bg-background-deep/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Brass hairline top */}
      <span
        aria-hidden
        className="pointer-events-none block h-px w-full"
        style={{ background: "var(--grad-rule)" }}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex-1 space-y-1">
          <p className="storm-display text-sm font-semibold text-foreground/90">
            This site uses cookies
          </p>
          <p className="storm-mono text-[11px] leading-relaxed text-muted/80">
            Essential storage keeps the game running. Anonymous analytics (only if accepted)
            help us understand how the game is played — no personal data leaves your browser
            without consent.{" "}
            <Link
              href={ROUTES.privacy}
              className="text-brass/80 underline underline-offset-2 transition-colors hover:text-brass-bright"
            >
              Privacy Policy
            </Link>
          </p>
        </div>

        <div className="flex shrink-0 gap-3">
          <button
            onClick={reject}
            className="storm-mono rounded border border-rule/40 bg-paper px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-foreground/70 transition-colors hover:border-brass/40 hover:text-foreground"
          >
            Reject
          </button>
          <button
            onClick={accept}
            className="storm-mono rounded border border-brass/50 bg-brass/10 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-brass-bright transition-colors hover:bg-brass/20"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
