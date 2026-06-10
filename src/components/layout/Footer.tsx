import Link from "next/link";
import { BRAND, ROUTES } from "@/lib/constants";


export default function Footer() {
  return (
    <footer className="mt-auto border-t border-rule/60">
      {/* Top hairline highlight */}
      <span
        aria-hidden
        className="pointer-events-none block h-px w-full"
        style={{ background: "var(--grad-rule)" }}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-5 px-5 pt-7 pb-[calc(1.75rem+env(safe-area-inset-bottom))] text-[11px] sm:flex-row sm:px-8 sm:pb-7">
        {/* Colophon — left */}
        <p className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rotate-45 bg-brass/60"
          />
          <span className="storm-display text-[13px] font-bold tracking-tight text-foreground/80">
            {BRAND.name}
          </span>
          <span className="text-muted/60">/</span>
          <span className="storm-mono text-muted/70">{BRAND.domain}</span>
        </p>

        {/* Center attribution */}
        <p className="text-center leading-relaxed text-muted/80">
          Not affiliated with Wizards of the Coast. Card data via{" "}
          <a
            href="https://scryfall.com"
            target="_blank"
            rel="noreferrer noopener"
            className="storm-display-italic text-foreground/85 transition-colors hover:text-brass-bright"
          >
            Scryfall
          </a>
          .
        </p>

        {/* Legal + bug links — right */}
        <nav aria-label="Footer links" className="flex items-center gap-4">
          <Link
            href={ROUTES.about}
            className="storm-mono text-foreground/60 uppercase tracking-[0.18em] transition-colors hover:text-brass-bright"
          >
            About
          </Link>
          <span aria-hidden className="text-rule/40">·</span>
          <Link
            href={ROUTES.privacy}
            className="storm-mono text-foreground/60 uppercase tracking-[0.18em] transition-colors hover:text-brass-bright"
          >
            Privacy
          </Link>
          <span aria-hidden className="text-rule/40">·</span>
          <Link
            href={ROUTES.bugReport}
            className="storm-mono inline-flex items-center gap-2 text-foreground/70 uppercase tracking-[0.2em] transition-colors hover:text-brass-bright"
          >
            Report a bug
            <span aria-hidden className="text-brass">⤴</span>
          </Link>
        </nav>
      </div>
    </footer>
  );
}
