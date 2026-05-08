import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/constants";

export const runtime = "edge";
export const alt = `${BRAND.name} — ${BRAND.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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

        {/* Lightning bolt icon */}
        <div style={{ fontSize: 72, marginBottom: 24, display: "flex" }}>⚡</div>

        {/* Title */}
        <div
          style={{
            fontSize: 88,
            fontWeight: 800,
            letterSpacing: "-2px",
            lineHeight: 1,
            color: "#f2e8d0",
            marginBottom: 8,
            display: "flex",
          }}
        >
          Storm{" "}
          <span style={{ color: "#c8a84b", fontStyle: "italic", marginLeft: 16 }}>
            Count
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 80, height: 2, background: "rgba(200,168,75,0.5)", margin: "20px 0" }} />

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "rgba(242,232,208,0.65)",
            fontStyle: "italic",
            letterSpacing: "0.02em",
            display: "flex",
          }}
        >
          How high is your storm count?
        </div>

        {/* Bottom badges */}
        <div
          style={{
            position: "absolute",
            bottom: 56,
            display: "flex",
            gap: 24,
            alignItems: "center",
          }}
        >
          {["Daily Challenge", "Survival Mode", "Leaderboards"].map((label) => (
            <div
              key={label}
              style={{
                padding: "6px 16px",
                border: "1px solid rgba(200,168,75,0.35)",
                borderRadius: 4,
                color: "rgba(200,168,75,0.75)",
                fontSize: 14,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                display: "flex",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            top: 48,
            right: 100,
            fontSize: 14,
            color: "rgba(242,232,208,0.35)",
            letterSpacing: "0.1em",
            display: "flex",
          }}
        >
          {BRAND.domain}
        </div>
      </div>
    ),
    { ...size }
  );
}
