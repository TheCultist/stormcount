import Image from "next/image";
import type { MtgCard } from "@/lib/types";

type CardDisplayProps = {
  card?: MtgCard | null;
  /**
   * "anchor"  = fully revealed (mana value visible).
   * "mystery" = same card content, only the mana value (CMC) is hidden.
   */
  mode: "anchor" | "mystery";
  /** Overlay tint shown briefly after a guess. */
  result?: "correct" | "wrong" | null;
};

/**
 * Codex card panel — visually echoes a Magic card frame:
 *  - Title bar (name + CMC pill)
 *  - Art window
 *  - Type-line bar
 *  - Collector-info footer
 * Both modes show name, art, and type. Only the CMC pill differs.
 * Rim accent (brass vs moonsilver) signals which side is which.
 */
export default function CardDisplay({ card, mode, result }: CardDisplayProps) {
  const isMystery = mode === "mystery";
  const accentRim = result === "correct"
    ? "rim-brass"
    : result === "wrong"
    ? "rim-moonsilver"
    : isMystery ? "rim-moonsilver" : "rim-brass";

  return (
    <div className="relative w-full max-w-sm">
      {/* Soft halo behind card — theme-aware via CSS vars */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-3 -z-10 rounded-md opacity-60"
        style={{
          background: isMystery
            ? "var(--grad-card-bg-mystery)"
            : "var(--grad-card-bg-anchor)",
          filter: "blur(28px)",
        }}
      />

      <article
        className={`codex anim-rise-in ${accentRim} flex flex-col rounded-md`}
      >
        {/* Title bar — name + CMC pill */}
        <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
          <div className="min-w-0 flex-1">
            <p
              className={`eyebrow text-[9px] ${
                isMystery ? "text-moonsilver" : "text-brass"
              }`}
            >
              {isMystery ? "Mystery" : "Anchor"}
            </p>
            <h3
              className="storm-display mt-0.5 truncate text-[18px] font-semibold leading-tight tracking-[-0.005em] text-foreground"
              style={{ fontVariationSettings: '"opsz" 96, "SOFT" 30' }}
            >
              {card?.name ?? "—"}
            </h3>
          </div>

          {/* Mana-value badge — flat chip, no gradient */}
          <ManaBadge isMystery={isMystery} cmc={card?.cmc} />
        </header>

        {/* Art window — slightly inset, hairline frame */}
        <div className="px-3">
          <div
            className="relative aspect-[5/7] w-full overflow-hidden rounded-sm"
            style={{
              border: "1px solid var(--border-art-window)",
              boxShadow: "0 1px 0 rgba(237,228,207,0.04) inset, 0 8px 16px -10px rgba(0,0,0,0.6) inset",
            }}
            onContextMenu={isMystery ? (e) => e.preventDefault() : undefined}
          >
            {/* Art backdrop fallback */}
            <div
              className="absolute inset-0"
              style={{ background: "var(--bg-art-fallback)" }}
            />
            {card?.image_uri ? (
              isMystery ? (
                /*
                 * Mystery: shift the image upward so the card's title bar
                 * (name + mana cost strip, ~top 9%) slides above the
                 * overflow:hidden boundary and is clipped out of view.
                 * The inner div is 10% taller than the container; object-cover
                 * scales the image to fill it, removing the top strip cleanly.
                 */
                <div className="absolute inset-0">
                  <div className="absolute -top-[12%] bottom-0 left-0 right-0">
                    <Image
                      src={card.image_uri}
                      alt={card.name}
                      fill
                      sizes="(max-width: 640px) 80vw, 384px"
                      className="object-cover object-top"
                      draggable={false}
                      style={{ pointerEvents: "none" }}
                    />
                  </div>
                </div>
              ) : (
                <Image
                  src={card.image_uri}
                  alt={card.name}
                  fill
                  sizes="(max-width: 640px) 80vw, 384px"
                  className="object-cover"
                  priority
                />
              )
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="storm-display-italic text-[11px] text-muted/50">
                  loading…
                </span>
              </div>
            )}

            {/* Result overlay */}
            {result && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                style={{
                  background:
                    result === "correct"
                      ? "rgba(74,222,128,0.25)"
                      : "rgba(248,113,113,0.30)",
                }}
              />
            )}
          </div>
        </div>

        {/* bottom padding so art doesn't butt up against the rim */}
        <div className="pb-3" />
      </article>
    </div>
  );
}

/**
 * Mana-value badge — flat rectangular chip, no gradient, no halo.
 * Anchor: solid brass/cobalt, shows the CMC numeral.
 * Mystery: solid moonsilver/ember, shows "?" until revealed.
 */
function ManaBadge({ isMystery, cmc }: { isMystery: boolean; cmc?: number }) {
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
        isMystery ? "bg-moonsilver" : "bg-brass"
      }`}
      aria-label={isMystery ? "Hidden mana value" : `Mana value ${cmc ?? "—"}`}
    >
      {isMystery ? (
        <span className="storm-mono text-[13px] font-bold leading-none text-white/80">?</span>
      ) : (
        <span
          className="storm-display text-base font-extrabold leading-none text-white"
          style={{ fontVariationSettings: '"opsz" 96, "WONK" 0' }}
        >
          {cmc ?? "—"}
        </span>
      )}
    </div>
  );
}
