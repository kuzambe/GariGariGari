import { CSSProperties, useEffect, useRef, useState } from "react";

const ALNUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const DIGITS = "0123456789";
const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

type Charset = "alnum" | "digits" | "letters";

function getCharset(c: Charset, ch: string): string {
  if (c === "digits") return DIGITS;
  if (c === "letters") return ch >= "a" && ch <= "z" ? ALPHA.slice(26) : ALPHA.slice(0, 26);
  return ALNUM;
}

const randFrom = (s: string) => s[Math.floor(Math.random() * s.length)];

interface ShuffleTextProps {
  text: string;
  charset?: Charset;
  tickMs?: number;
  durationMs?: number;
  style?: CSSProperties;
  as?: "span" | "p" | "div";
}

export function ShuffleText({
  text,
  charset = "alnum",
  tickMs = 45,
  durationMs = 1000,
  style,
  as = "span",
}: ShuffleTextProps) {
  const target = text || "";
  const [display, setDisplay] = useState(() =>
    target.split("").map((c) => (/\s|[^\w]/.test(c) ? c : randFrom(getCharset(charset, c)))).join(""),
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

    const lockStepMs = Math.max(20, durationMs / Math.max(1, target.length));
    const startedAt = Date.now();
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const lockedCount = Math.min(target.length, Math.floor(elapsed / lockStepMs));
      const next = target
        .split("")
        .map((ch, i) => {
          if (/\s|[^\w]/.test(ch)) return ch;
          if (i < lockedCount) return ch;
          return randFrom(getCharset(charset, ch));
        })
        .join("");
      setDisplay(next);
      if (lockedCount >= target.length) {
        window.clearInterval(tick);
        setDisplay(target);
      }
    }, tickMs);

    return () => window.clearInterval(tick);
  }, [target, charset, tickMs, durationMs]);

  const Tag = as as "span";
  return <Tag style={{ fontVariantNumeric: "tabular-nums", ...style }}>{display || "\u00A0"}</Tag>;
}

interface LicensePlateProps {
  plate: string;
  tickMs?: number;
  durationMs?: number;
}

export function LicensePlate({
  plate,
  tickMs = 45,
  durationMs = 1000,
}: LicensePlateProps) {
  const target = (plate || "").toUpperCase();

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
      {target ? (
        <ShuffleText
          text={target}
          charset="alnum"
          tickMs={tickMs}
          durationMs={durationMs}
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 56,
            color: "#0D1C0E",
            letterSpacing: "0.08em",
            lineHeight: 1,
            textAlign: "center",
            padding: "0 12px",
            whiteSpace: "nowrap",
          }}
        />
      ) : (
        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 56,
            color: "#0D1C0E",
            lineHeight: 1,
          }}
        >
          —
        </span>
      )}
      <style>{`@keyframes lpFadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}
