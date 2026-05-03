import { useEffect, useRef, useState } from "react";

interface OdometerProps {
  value: number;
  unit?: string;
}

export function Odometer({ value, unit }: OdometerProps) {
  const formatted = (value ?? 0).toLocaleString("en-US");
  const chars = formatted.split("");

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        marginTop: 10,
      }}
    >
      <div style={{ display: "inline-flex", gap: 4 }}>
        {chars.map((ch, i) => (
          <OdometerCell key={`${i}-${ch}`} ch={ch} delay={i * 60} />
        ))}
      </div>
      {unit && (
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            fontSize: 14,
            color: "#6B7C6D",
            letterSpacing: "0.04em",
          }}
        >
          {unit}
        </span>
      )}
      <style>{`
        @keyframes odoRoll {
          from { transform: translateY(-60%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function OdometerCell({ ch, delay }: { ch: string; delay: number }) {
  const isDigit = /[0-9]/.test(ch);
  const isSep = ch === "," || ch === ".";

  if (isSep) {
    return (
      <span
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: 26,
          color: "#0D1C0E",
          alignSelf: "flex-end",
          padding: "0 1px",
          lineHeight: 1.2,
        }}
      >
        {ch}
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 22,
        height: 32,
        borderRadius: 6,
        background: "#F4F7F2",
        border: "1px solid #D4DDD5",
        boxShadow: "inset 0 1px 1px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,0.6)",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: 22,
          color: "#0D1C0E",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
          display: "inline-block",
          animation: isDigit ? `odoRoll 0.45s ${delay}ms cubic-bezier(0.22, 0.9, 0.32, 1) both` : undefined,
        }}
      >
        {ch}
      </span>
    </span>
  );
}
