import Image from "next/image";
import Link from "next/link";

type Props = {
  /** Full affiliate tracking URL. If null/empty the banner is suppressed. */
  href: string | null | undefined;
  /** Contextual copy — used as the accessible label/alt for the banner. */
  copy: string;
};

/**
 * CavernHold affiliate banner — renders the CavernHold creative image wrapped
 * in the affiliate tracking link. Crimson accent frame keeps it site-native.
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
      <p className="mb-0.5 px-0.5 text-[9px] uppercase tracking-[0.14em] text-muted/70">
        Advertisement
      </p>

      <div className="relative isolate overflow-hidden rounded-sm transition-colors duration-200">
        <Image
          src="/brand/cavernhold_banner.png"
          alt={`CavernHold — ${copy}`}
          width={2064}
          height={512}
          sizes="(max-width: 640px) 100vw, 56rem"
          className="block h-auto w-full transition-transform duration-300 group-hover:scale-[1.015]"
        />

        {/* Subtle hover wash */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(ellipse at 20% 50%, rgba(200,68,63,0.10), transparent 65%)",
          }}
        />
      </div>
    </Link>
  );
}
