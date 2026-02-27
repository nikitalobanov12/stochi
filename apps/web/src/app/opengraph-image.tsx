import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#000000",
        padding: 64,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(16,185,129,0.18), transparent 45%), radial-gradient(circle at 80% 30%, rgba(6,182,212,0.16), transparent 40%), radial-gradient(circle at 30% 90%, rgba(255,255,255,0.06), transparent 35%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.14,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      <div style={{ position: "relative", display: "flex", gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background:
              "linear-gradient(135deg, rgba(16,185,129,0.45), rgba(6,182,212,0.35))",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: "rgba(255,255,255,0.92)",
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: -0.4,
            }}
          >
            stochi_
          </div>
          <div style={{ color: "rgba(255,255,255,0.48)", fontSize: 16 }}>
            Balance your chemistry
          </div>
        </div>
      </div>

      <div style={{ position: "relative", maxWidth: 980 }}>
        <div
          style={{
            color: "rgba(255,255,255,0.94)",
            fontSize: 56,
            lineHeight: 1.05,
            fontWeight: 650,
            letterSpacing: -1.2,
          }}
        >
          Run a stack audit.
          <br />
          Get interaction + timing + ratio fixes.
        </div>
        <div
          style={{
            marginTop: 18,
            color: "rgba(255,255,255,0.52)",
            fontSize: 22,
            lineHeight: 1.35,
          }}
        >
          Turn supplement chaos into a clean protocol with clear next actions.
        </div>
      </div>

      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          color: "rgba(255,255,255,0.42)",
          fontSize: 16,
        }}
      >
        <div>Not medical advice.</div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ color: "rgba(16,185,129,0.9)" }}>89k+</div>
          <div>interaction pairs</div>
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
