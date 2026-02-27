import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 22,
        padding: 72,
        backgroundColor: "#000000",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(16,185,129,0.22), transparent 45%), radial-gradient(circle at 80% 20%, rgba(6,182,212,0.18), transparent 40%)",
        }}
      />

      <div style={{ position: "relative" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 14px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.14)",
            backgroundColor: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.66)",
            fontSize: 16,
          }}
        >
          <span style={{ color: "rgba(16,185,129,0.9)", fontWeight: 700 }}>
            stochi_
          </span>
          <span>Supplement Interaction Audit</span>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          color: "rgba(255,255,255,0.95)",
          fontSize: 62,
          lineHeight: 1.04,
          fontWeight: 650,
          letterSpacing: -1.4,
          maxWidth: 980,
        }}
      >
        See what your stack is doing.
      </div>

      <div
        style={{
          position: "relative",
          color: "rgba(255,255,255,0.55)",
          fontSize: 24,
          maxWidth: 980,
          lineHeight: 1.35,
        }}
      >
        Interactions, timing conflicts, ratio warnings, and next actions.
      </div>
    </div>,
    {
      ...size,
    },
  );
}
