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
      {/* Soft halo behind card — warm or cool */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-3 -z-10 rounded-md opacity-60"
        style={{
          background: isMystery
            ? "radial-gradient(ellipse at 50% 30%, rgba(182,194,212,0.18), transparent 65%)"
            : "radial-gradient(ellipse at 50% 30%, rgba(232,193,129,0.20), transparent 65%)",
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

          {/* Mana-cost orb — circular, MTG-pip-inspired */}
          <ManaOrb isMystery={isMystery} cmc={card?.cmc} />
        </header>

        {/* Art window — slightly inset, hairline frame */}
        <div className="px-3">
          <div
            className="relative aspect-[5/7] w-full overflow-hidden rounded-sm"
            style={{
              border: "1px solid rgba(201, 160, 90, 0.18)",
              boxShadow: "0 1px 0 rgba(237,228,207,0.04) inset, 0 8px 16px -10px rgba(0,0,0,0.6) inset",
            }}
            onContextMenu={isMystery ? (e) => e.preventDefault() : undefined}
          >
            {/* Art backdrop fallback */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, #2a221a 0%, #1c1610 50%, #100c08 100%)",
              }}
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

        {/* Type-line bar — narrow strip, MTG-card-frame echo */}
        <div className="mt-3 flex items-center justify-between gap-3 border-y border-rule/50 bg-paper-3/40 px-4 py-2">
          <p className="storm-mono truncate text-[10px] uppercase tracking-[0.18em] text-foreground/70">
            {card?.type_line ?? "—"}
          </p>
          <span
            aria-hidden
            className={`h-1 w-1 rotate-45 ${
              isMystery ? "bg-moonsilver/70" : "bg-brass/70"
            }`}
          />
        </div>

        {/* Collector-info footer — hint of MTG card metadata row */}
        <footer className="flex items-center justify-between px-4 py-2.5">
          <span className="storm-mono text-[9px] uppercase tracking-[0.22em] text-muted/60">
            {isMystery ? "—  /  ???" : `mv  /  ${card?.cmc ?? "—"}`}
          </span>
          <span className="storm-display-italic text-[10px] text-muted/60">
            stormcount
          </span>
        </footer>
      </article>
    </div>
  );
}

/**
 * Mana-cost orb — circular pip echoing MTG mana symbols.
 * Anchor: solid brass with engraved CMC numeral.
 * Mystery: moonsilver ring with shimmering ??? legend.
 */
function ManaOrb({ isMystery, cmc }: { isMystery: boolean; cmc?: number }) {
  return (
    <div
      className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
      aria-label={isMystery ? "Hidden mana value" : `Mana value ${cmc ?? "—"}`}
    >
      {/* Outer halo */}
      <span
        aria-hidden
        className="absolute inset-[-6px] rounded-full opacity-70 blur-md"
        style={{
          background: isMystery
            ? "radial-gradient(circle, rgba(182,194,212,0.4), transparent 70%)"
            : "radial-gradient(circle, rgba(232,193,129,0.5), transparent 70%)",
        }}
      />

      {/* Pip body */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background: isMystery
            ? "radial-gradient(circle at 35% 30%, #dbe2ec, #5a6a82 80%)"
            : "radial-gradient(circle at 35% 30%, #e8c181, #7a5d2c 80%)",
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.35) inset, 0 -1px 0 rgba(0,0,0,0.4) inset, 0 4px 8px -2px rgba(0,0,0,0.6)",
        }}
      />

      {/* Numeral / sigil */}
      {isMystery ? (
        <span className="storm-mono relative text-[11px] font-bold tracking-tight text-background-deep">
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(7,6,12,0.4) 0%, rgba(7,6,12,1) 50%, rgba(7,6,12,0.4) 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2.4s linear infinite",
            }}
          >
            ???
          </span>
        </span>
      ) : (
        <span
          className="storm-display relative text-base font-extrabold leading-none text-background-deep"
          style={{ fontVariationSettings: '"opsz" 96, "WONK" 0' }}
        >
          {cmc ?? "—"}
        </span>
      )}
    </div>
  );
}
