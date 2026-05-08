import Link from "next/link";

type Props = {
  /** Full affiliate tracking URL. If null/empty the banner is suppressed. */
  href: string | null | undefined;
  /** Complete copy string. The caller is responsible for any interpolation. */
  copy: string;
};

/**
 * CavernHold affiliate banner — site-native, no ad aesthetic.
 * Dark background, crimson accent, hairline border.
 * Renders nothing when href is missing so it degrades gracefully.
 */
export default function CavernHoldBanner({ href, copy }: Props) {
  if (!href) return null;

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group block w-full"
      aria-label={`CavernHold — ${copy}`}
    >
      <div
        className="relative isolate overflow-hidden rounded-sm transition-colors duration-200"
        style={{
          background: "rgba(10,8,14,0.80)",
          border: "1px solid rgba(200,68,63,0.22)",
          borderLeft: "3px solid var(--crimson)",
        }}
      >
        {/* Subtle hover wash */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(ellipse at 20% 50%, rgba(200,68,63,0.09), transparent 65%)",
          }}
        />

        <div className="flex items-center justify-between gap-4 px-5 py-4">
          {/* Copy */}
          <div className="flex flex-col gap-0.5">
            <p
              className="storm-display text-[13px] font-semibold leading-snug text-foreground/90 transition-colors duration-200 group-hover:text-foreground"
              style={{ fontVariationSettings: '"opsz" 96, "SOFT" 20' }}
            >
              {copy}
            </p>
            <p
              className="storm-mono text-[10px] uppercase tracking-[0.22em]"
              style={{ color: "var(--crimson-bright)" }}
            >
              CavernHold
            </p>
          </div>

          {/* Arrow glyph */}
          <span
            aria-hidden
            className="storm-mono shrink-0 text-[11px] font-bold transition-all duration-200 group-hover:translate-x-0.5"
            style={{ color: "var(--crimson)" }}
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
