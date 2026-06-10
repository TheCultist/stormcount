/**
 * Dynamic OG image for shared scores — /share/og?mode=daily&score=42&total=50&date=2026-06-10
 *
 * Lives under /share (NOT /api) on purpose: robots.txt disallows /api/ and
 * social crawlers (Facebook in particular) respect robots.txt when fetching
 * og:image, which would silently break the share card.
 *
 * Visual language mirrors `app/opengraph-image.tsx` — same grid, corner
 * accents, palette, and domain stamp — with the score as the hero.
 */
import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/constants";
import { parseShareParams } from "@/lib/share";

export const runtime = "edge";

const SIZE = { width: 1200, height: 630 };

export async function GET(req: Request) {
  const payload = parseShareParams(
    Object.fromEntries(new URL(req.url).searchParams)
  );
  if (!payload) return new Response("Not found", { status: 404 });

  const isDaily = payload.mode === "daily";
  const modeLabel = isDaily
    ? `Daily Challenge${payload.date ? ` · ${payload.date}` : ""}`
    : "Survival Mode";
  const tagline = isDaily
    ? "Think you can read the storm better?"
    : "How long can you survive?";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0d0c0a 0%, #1a1510 50%, #0d0c0a 100%)",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Decorative grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(180,140,60,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(180,140,60,0.06) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Corner accents */}
        <div style={{ position: "absolute", top: 40, left: 40, width: 40, height: 40, borderTop: "2px solid rgba(180,140,60,0.6)", borderLeft: "2px solid rgba(180,140,60,0.6)" }} />
        <div style={{ position: "absolute", top: 40, right: 40, width: 40, height: 40, borderTop: "2px solid rgba(180,140,60,0.6)", borderRight: "2px solid rgba(180,140,60,0.6)" }} />
        <div style={{ position: "absolute", bottom: 40, left: 40, width: 40, height: 40, borderBottom: "2px solid rgba(180,140,60,0.6)", borderLeft: "2px solid rgba(180,140,60,0.6)" }} />
        <div style={{ position: "absolute", bottom: 40, right: 40, width: 40, height: 40, borderBottom: "2px solid rgba(180,140,60,0.6)", borderRight: "2px solid rgba(180,140,60,0.6)" }} />

        {/* Brand line */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <div style={{ fontSize: 32, display: "flex" }}>⚡</div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-1px", color: "#f2e8d0", display: "flex" }}>
            Storm{" "}
            <span style={{ color: "#c8a84b", fontStyle: "italic", marginLeft: 8 }}>Count</span>
          </div>
        </div>

        {/* Mode stamp */}
        <div
          style={{
            padding: "8px 20px",
            border: "1px solid rgba(200,168,75,0.35)",
            borderRadius: 4,
            color: "rgba(200,168,75,0.85)",
            fontSize: 20,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            display: "flex",
            marginBottom: 24,
          }}
        >
          {modeLabel}
        </div>

        {/* Hero score */}
        <div
          style={{
            fontSize: isDaily ? 168 : 200,
            fontWeight: 800,
            lineHeight: 1,
            color: "#c8a84b",
            display: "flex",
            alignItems: "baseline",
            textShadow: "0 0 60px rgba(200,168,75,0.45)",
          }}
        >
          {payload.score}
          {isDaily && payload.total != null && (
            <span style={{ fontSize: 64, color: "rgba(242,232,208,0.5)", marginLeft: 12 }}>
              / {payload.total}
            </span>
          )}
        </div>

        {/* Score caption */}
        <div
          style={{
            fontSize: 22,
            color: "rgba(242,232,208,0.55)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            display: "flex",
            marginTop: 16,
          }}
        >
          {isDaily ? "Storm count" : "Spells deep"}
        </div>

        {/* Divider */}
        <div style={{ width: 80, height: 2, background: "rgba(200,168,75,0.5)", margin: "28px 0" }} />

        {/* Challenge tagline */}
        <div
          style={{
            fontSize: 30,
            color: "rgba(242,232,208,0.75)",
            fontStyle: "italic",
            letterSpacing: "0.02em",
            display: "flex",
          }}
        >
          {tagline}
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: 44,
            fontSize: 16,
            color: "rgba(242,232,208,0.4)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          {BRAND.domain}
        </div>
      </div>
    ),
    { ...SIZE }
  );
}
