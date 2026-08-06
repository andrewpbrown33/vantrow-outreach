import { ImageResponse } from "next/og";
import { brand } from "@vantrow/brand";

/** Default OG/social card: N-monogram mark + brand name + tagline on the
 *  brand primary. Interim identity until the Phase-2 design pass. */

export const alt = `${brand.name} — ${brand.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  const c = brand.colors.light;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: `linear-gradient(135deg, ${c.primaryDark} 0%, ${c.primary} 100%)`,
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* N mark: bar, diagonal, bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", height: "84px" }}>
          <div
            style={{
              width: "16px",
              height: "76px",
              background: "rgba(255,255,255,0.9)",
              borderRadius: "8px",
            }}
          />
          <div
            style={{
              width: "16px",
              height: "76px",
              background: c.accent,
              borderRadius: "8px",
              transform: "rotate(28deg)",
            }}
          />
          <div
            style={{
              width: "16px",
              height: "76px",
              background: "rgba(255,255,255,0.9)",
              borderRadius: "8px",
            }}
          />
        </div>
        <div style={{ marginTop: "44px", fontSize: "96px", fontWeight: 700, letterSpacing: "-2px" }}>
          {brand.name}
        </div>
        <div style={{ marginTop: "16px", fontSize: "40px", color: "rgba(255,255,255,0.85)" }}>
          {brand.tagline}
        </div>
        <div style={{ marginTop: "40px", fontSize: "26px", color: "rgba(255,255,255,0.6)" }}>
          {`${brand.endorsement} · ${brand.domain}`}
        </div>
      </div>
    ),
    size,
  );
}
