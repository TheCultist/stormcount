import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { ROUTES } from "@/lib/constants";
import ContactFormClient from "@/components/forms/ContactFormClient";
import { buildMetadata, buildBreadcrumbList, jsonLd } from "@/lib/seo";

const TITLE = "Report a Bug";
const DESCRIPTION =
  "Spotted a wrong mana value, a broken run, or another glitch in Storm Count? Send a bug report — steps to reproduce help us fix it fast.";

export const metadata: Metadata = buildMetadata({
  path: "/bug-report",
  title: TITLE,
  description: DESCRIPTION,
});

const bugReportJsonLd = buildBreadcrumbList([
  { name: "Home", path: "/" },
  { name: "Report a Bug", path: "/bug-report" },
]);

const fieldClass =
  "border border-rule/30 bg-background-deep/60 px-4 py-3 text-sm text-foreground placeholder:text-muted/60 transition-colors duration-200 focus:border-brass-bright focus:outline-none focus:ring-1 focus:ring-brass/40 storm-mono";

function BugTypeField() {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="eyebrow text-[10px] text-muted">Bug type</span>
      <select
        name="bugType"
        required
        className={fieldClass}
        defaultValue=""
      >
        <option value="" disabled>
          Select a category…
        </option>
        <option value="wrong-mana-value">Wrong mana value displayed</option>
        <option value="broken-run">Broken Daily / Survival run</option>
        <option value="leaderboard">Leaderboard / score issue</option>
        <option value="ui-visual">UI or visual glitch</option>
        <option value="auth">Sign-in / account problem</option>
        <option value="other">Other</option>
      </select>
    </label>
  );
}

export default function BugReportPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-5 py-12 sm:px-8 sm:py-16">
      <Script
        id="schema-bug-report"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(bugReportJsonLd) }}
      />
      <header className="anim-fade-in flex flex-col gap-3">
        <p className="eyebrow">Bug Report</p>
        <h1
          className="storm-display text-4xl font-extrabold leading-[0.95] tracking-[-0.02em] text-foreground sm:text-5xl"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
        >
          Report a{" "}
          <span className="storm-display-italic text-brass-bright">bug</span>
        </h1>
        <p className="storm-display-italic max-w-md text-base leading-relaxed text-foreground/65">
          Spot a wrong mana value or a broken run? Let us know — steps to
          reproduce help a lot.
        </p>
      </header>

      <ContactFormClient
        action="/api/bug-report"
        messagePlaceholder="What broke? Include: what you expected, what happened, and which card or date if relevant."
        extraFields={<BugTypeField />}
        submitLabel="Submit report"
      />

      <p className="anim-fade-in storm-mono text-[11px] text-muted/50">
        General question?{" "}
        <Link
          href={ROUTES.contact}
          className="text-brass/70 underline underline-offset-2 transition-colors hover:text-brass-bright"
        >
          Use the contact form instead
        </Link>
        .
      </p>
    </div>
  );
}
