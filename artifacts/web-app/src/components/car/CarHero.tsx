import { CarSilhouette } from "./CarSilhouette";

export function CarHero() {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: 20,
        marginBottom: 8,
        paddingBottom: 16,
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 300,
          height: 200,
          background: "radial-gradient(circle, rgba(239,159,39,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* Car SVG */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <CarSilhouette />
      </div>
      {/* Ground shadow */}
      <div
        style={{
          width: 260,
          height: 12,
          background: "radial-gradient(ellipse, rgba(0,0,0,0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          marginTop: -8,
        }}
      />
    </div>
  );
}
