import { useEffect, useRef, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const randChar = () => CHARS[Math.floor(Math.random() * CHARS.length)];

interface LicensePlateProps {
  plate: string;
  tickMs?: number;
  lockStepMs?: number;
}

export function LicensePlate({
  plate,
  tickMs = 45,
  lockStepMs = 70,
}: LicensePlateProps) {
  const target = (plate || "").toUpperCase();
  const [display, setDisplay] = useState(() =>
    target.split("").map((c) => (c === " " ? " " : randChar())).join(""),
  );
  const animatedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!target) {
      setDisplay("");
      animatedFor.current = "";
      return;
    }
    if (animatedFor.current === target) return;
    animatedFor.current = target;

    let lockedCount = 0;
    const startedAt = Date.now();

    const tick = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      lockedCount = Math.min(target.length, Math.floor(elapsed / lockStepMs));
      const next = target
        .split("")
        .map((ch, i) => {
          if (ch === " ") return " ";
          if (i < lockedCount) return ch;
          return randChar();
        })
        .join("");
      setDisplay(next);
      if (lockedCount >= target.length) {
        window.clearInterval(tick);
        setDisplay(target);
      }
    }, tickMs);

    return () => window.clearInterval(tick);
  }, [target, tickMs, lockStepMs]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "24px 24px 16px",
        height: 140,
        borderRadius: 16,
        background: "#F4F7F2",
        border: "1.5px solid #D4DDD5",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        animation: "lpFadeIn 0.4s ease both",
      }}
    >
      <span
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: 56,
          color: "#0D1C0E",
          letterSpacing: "0.08em",
          lineHeight: 1,
          textAlign: "center",
          padding: "0 12px",
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        {display || "—"}
      </span>
      <style>{`@keyframes lpFadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}
