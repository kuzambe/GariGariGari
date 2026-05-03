import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useVehicle } from "@/context/VehicleContext";
import { getDocumentsByVehicleId, Document, uploadDocument } from "@/lib/api/documents";
import { getExpensesByVehicleId, Expense, addExpense } from "@/lib/api/expenses";
import { Vehicle } from "@/lib/api/vehicles";
import { GarageIcon } from "@/components/ui/GarageIcon";

/* ── DESIGN TOKENS ─────────────────────────────────── */
const C = {
  bg: "#FFFFFF",
  sage: "#F4F7F2",
  text: "#0D1C0E",
  muted: "#6B7C6D",
  green: "#1F6B2E",
  greenLight: "#E8F0E9",
  border: "#D4DDD5",
  success: "#2D9E4A",
  warning: "#E5A020",
  error: "#C0392B",
};

/* ── SCULPTURAL TOY CAR SVG ────────────────────────── */
function SculptedCar() {
  return (
    <svg width="300" height="140" viewBox="0 0 300 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="carShadow" x="-10%" y="-10%" width="130%" height="180%">
          <feDropShadow dx="0" dy="8" stdDeviation="14" floodColor="#000000" floodOpacity="0.08" />
        </filter>
      </defs>
      {/* Body silhouette */}
      <path
        d="M 14 98
           C 6 98 4 88 4 82
           C 4 70 14 62 22 56
           C 28 42 40 22 66 16
           C 84 10 112 8 148 8
           C 182 8 212 12 234 24
           C 254 34 268 52 278 68
           C 286 78 294 88 292 96
           C 291 100 287 102 280 102
           L 252 102
           Q 249 82 232 82 Q 214 82 212 102
           L 100 102
           Q 97 82 80 82 Q 62 82 60 102
           L 14 100 Z"
        fill="#FFFFFF"
        stroke="#D4DDD5"
        strokeWidth="1.5"
        filter="url(#carShadow)"
      />
      {/* Window glass tint */}
      <path
        d="M 74 16 C 96 10 124 8 156 8 C 188 8 216 12 236 24 C 222 32 192 38 156 40 C 118 38 90 32 74 16 Z"
        fill="#EFF4F0"
        opacity="0.55"
      />
      {/* Rear wheel */}
      <circle cx="80" cy="112" r="22" fill="#F4F7F2" stroke="#D4DDD5" strokeWidth="1.5" />
      <circle cx="80" cy="112" r="9" fill="#E8F0E9" stroke="#D4DDD5" strokeWidth="1" />
      <circle cx="80" cy="112" r="3" fill="#C8D5C9" />
      {/* Front wheel */}
      <circle cx="232" cy="112" r="22" fill="#F4F7F2" stroke="#D4DDD5" strokeWidth="1.5" />
      <circle cx="232" cy="112" r="9" fill="#E8F0E9" stroke="#D4DDD5" strokeWidth="1" />
      <circle cx="232" cy="112" r="3" fill="#C8D5C9" />
    </svg>
  );
}

/* ── WOODEN TOY CAR SVG ────────────────────────────── */
function WoodenCar() {
  return (
    <svg width="280" height="130" viewBox="0 0 280 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="woodShadow" x="-10%" y="-10%" width="130%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#5C2E00" floodOpacity="0.18" />
        </filter>
      </defs>
      {/* Body */}
      <rect x="8" y="56" width="264" height="50" rx="16" fill="#C8783A" filter="url(#woodShadow)" />
      {/* Body top highlight */}
      <rect x="8" y="56" width="264" height="14" rx="16" fill="#DDA05A" opacity="0.55" />
      {/* Wood grain lines */}
      <line x1="12" y1="68" x2="268" y2="70" stroke="#A85C28" strokeWidth="1" opacity="0.35" />
      <line x1="12" y1="78" x2="268" y2="76" stroke="#A85C28" strokeWidth="1" opacity="0.28" />
      <line x1="12" y1="90" x2="268" y2="88" stroke="#A85C28" strokeWidth="1" opacity="0.22" />
      {/* Door panel line */}
      <line x1="138" y1="58" x2="138" y2="104" stroke="#A85C28" strokeWidth="1.5" opacity="0.4" />
      {/* Cabin */}
      <rect x="50" y="22" width="174" height="38" rx="14" fill="#B46830" />
      {/* Cabin top highlight */}
      <rect x="50" y="22" width="174" height="12" rx="14" fill="#CA8A50" opacity="0.5" />
      {/* Rear window */}
      <rect x="62" y="27" width="44" height="27" rx="7" fill="#A8D4E8" opacity="0.80" />
      {/* Middle window */}
      <rect x="116" y="27" width="44" height="27" rx="7" fill="#A8D4E8" opacity="0.75" />
      {/* Front window */}
      <rect x="170" y="27" width="44" height="27" rx="7" fill="#A8D4E8" opacity="0.80" />
      {/* Rear wheel */}
      <circle cx="68" cy="112" r="22" fill="#2A1500" />
      <circle cx="68" cy="112" r="13" fill="#C8783A" />
      <circle cx="68" cy="112" r="5" fill="#2A1500" />
      <circle cx="68" cy="107" r="2" fill="#DDA05A" opacity="0.6" />
      {/* Front wheel */}
      <circle cx="210" cy="112" r="22" fill="#2A1500" />
      <circle cx="210" cy="112" r="13" fill="#C8783A" />
      <circle cx="210" cy="112" r="5" fill="#2A1500" />
      <circle cx="210" cy="107" r="2" fill="#DDA05A" opacity="0.6" />
    </svg>
  );
}

/* ── HEALTH BAR ────────────────────────────────────── */
function HealthGauge({ pct = 90 }: { pct?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", padding: "0 24px", boxSizing: "border-box" }}>
      {/* Bar track */}
      <div style={{ position: "relative", height: 12, borderRadius: 999, background: C.greenLight, overflow: "hidden" }}>
        {/* Fill */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pct}%`,
            background: C.green,
            borderRadius: 999,
            transition: "width 0.4s ease",
          }}
        />
        {/* 4 dividers (creating 5 segments) */}
        {[20, 40, 60, 80].map((pos) => (
          <div
            key={pos}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${pos}%`,
              width: 2,
              background: "#FFFFFF",
              opacity: 0.6,
            }}
          />
        ))}
      </div>
      {/* Label */}
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 12,
        color: C.muted,
        margin: 0,
        letterSpacing: "0.01em",
      }}>
        Health status : <span style={{ color: C.green, fontWeight: 600 }}>Good</span>
      </p>
    </div>
  );
}

/* ── SHORTCUT GRID ─────────────────────────────────── */
function ShortcutGrid() {
  return (
    <div style={{ padding: "0 20px" }}>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px", textAlign: "center" }}>
        Quick Access
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            style={{
              aspectRatio: "1",
              borderRadius: "50%",
              background: "#FFFFFF",
              border: `1.5px solid ${C.border}`,
              boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.12s, box-shadow 0.12s",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.transform = "scale(1.05)";
              el.style.boxShadow = "0 4px 18px rgba(31,107,46,0.13)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.transform = "scale(1)";
              el.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)";
            }}
          >
            <span style={{ fontSize: 26, color: C.green, lineHeight: 1, fontWeight: 300 }}>+</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── PERSISTENT TOP BAR ────────────────────────────── */
const BASE = import.meta.env.BASE_URL as string;

function TopBar({ userEmail, onProfile }: { userEmail?: string; onProfile: () => void }) {
  const initial = userEmail ? userEmail[0].toUpperCase() : "?";
  return (
    <div style={{
      height: 52,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      background: C.bg,
      borderBottom: `1px solid ${C.border}`,
      flexShrink: 0,
      zIndex: 40,
    }}>
      {/* Profile avatar */}
      <button
        onClick={onProfile}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: C.greenLight,
          border: `1.5px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            color: C.green,
            lineHeight: 1,
          }}>
            {initial}
          </span>
        </div>
      </button>

      {/* Gari icon */}
      <img
        src={`${BASE}logo-icon.png`}
        alt="Gari"
        style={{ height: 26, width: "auto", objectFit: "contain" }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = `${BASE}logo.png`; }}
      />
    </div>
  );
}

/* ── SETTINGS SHEET ────────────────────────────────── */
function SettingsSheet({ userEmail, onSignOut, onClose }: { userEmail?: string; onSignOut: () => void; onClose: () => void }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />

      {/* Sheet */}
      <div
        style={{
          position: "relative",
          background: C.bg,
          borderRadius: "22px 22px 0 0",
          padding: "12px 24px 40px",
          maxWidth: 430,
          width: "100%",
          margin: "0 auto",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 24px" }} />

        {/* Account section */}
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>
          Account
        </p>
        <div style={{
          background: C.sage,
          borderRadius: 14,
          padding: "14px 16px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: C.greenLight,
            border: `1.5px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, color: C.green }}>
              {userEmail ? userEmail[0].toUpperCase() : "?"}
            </span>
          </div>
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 14, color: C.text, margin: 0 }}>
              {userEmail ?? "—"}
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.muted, margin: "2px 0 0" }}>
              Gari account
            </p>
          </div>
        </div>

        {/* Settings rows */}
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>
          Settings
        </p>
        <div style={{ background: C.sage, borderRadius: 14, marginBottom: 20, overflow: "hidden" }}>
          {[
            { label: "Notifications", icon: "🔔" },
            { label: "Units & Display", icon: "📏" },
            { label: "Privacy", icon: "🔒" },
          ].map(({ label, icon }, i, arr) => (
            <div key={label} style={{
              display: "flex",
              alignItems: "center",
              padding: "14px 16px",
              borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none",
              cursor: "pointer",
            }}>
              <span style={{ fontSize: 16, marginRight: 12 }}>{icon}</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.text, flex: 1 }}>{label}</span>
              <span style={{ color: C.border, fontSize: 16 }}>›</span>
            </div>
          ))}
        </div>

        {/* Sign out */}
        <button
          onClick={onSignOut}
          style={{
            width: "100%",
            background: "none",
            border: `1.5px solid ${C.border}`,
            borderRadius: 14,
            padding: "14px 16px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: "#C0392B",
            cursor: "pointer",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}

/* ── GREEN BUTTON ──────────────────────────────────── */
function GreenButton({ label, onClick, fullWidth, small }: { label: string; onClick?: () => void; fullWidth?: boolean; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: C.green,
        color: "#fff",
        border: "none",
        borderRadius: 14,
        padding: small ? "8px 16px" : "15px 24px",
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 700,
        fontSize: small ? 14 : 18,
        letterSpacing: "0.04em",
        cursor: "pointer",
        width: fullWidth ? "100%" : "auto",
        transition: "opacity 0.15s",
        minHeight: 44,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
    >
      {label}
    </button>
  );
}

/* ── LOADING SCREEN ────────────────────────────────── */
function LoadingScreen() {
  return (
    <div style={{ height: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ animation: "gari-pulse 1.8s ease-in-out infinite" }}>
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="Gari"
          style={{ height: 40, opacity: 0.5 }}
        />
      </div>
    </div>
  );
}

/* ── DOC CATEGORIES ────────────────────────────────── */
const DOC_CATEGORIES = [
  { label: "Insurance", type: "insurance" },
  { label: "Ownership", type: "ownership" },
  { label: "Registration", type: "registration" },
  { label: "Tint Exemption", type: "tint-exemption" },
  { label: "Driver's License", type: "drivers-license" },
  { label: "Vehicle Handbook", type: "vehicle-handbook" },
];

/* ── EXPENSE CATEGORIES ────────────────────────────── */
const EXPENSE_TYPES = ["Fuel", "Maintenance", "Repairs", "Parts", "Insurance", "Other"];
const SEGMENT_COLORS = ["#1F6B2E", "#2D7A3D", "#3A9650", "#5AB26B", "#85C993", "#B3DDB9"];

/* ── VIN COPY ──────────────────────────────────────── */
function VinCopy({ vin }: { vin: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(vin).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch(() => {
      const el = document.createElement("textarea");
      el.value = vin;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        background: "none",
        border: "none",
        padding: "4px 0 0",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        textAlign: "left",
      }}
    >
      <span style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 11,
        color: copied ? C.green : C.muted,
        letterSpacing: "0.06em",
        transition: "color 0.2s",
      }}>
        {copied ? "Copied!" : `VIN ${vin}`}
      </span>
      {!copied && (
        <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
          <rect x="4" y="1" width="9" height="9" rx="1.5" stroke={C.border} strokeWidth="1.5"/>
          <path d="M1 5v7a1 1 0 001 1h7" stroke={C.border} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )}
    </button>
  );
}

/* ── PAGE 1: LANDING ───────────────────────────────── */
function LandingPage({
  vehicle,
  onSignOut,
}: {
  vehicle: Vehicle;
  expenses: Expense[];
  documents: Document[];
  onSignOut: () => void;
}) {
  const yearMakeModel = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");
  const hasNickname = Boolean(vehicle.nickname);
  const title = hasNickname ? vehicle.nickname! : yearMakeModel || "Your car";
  const subtitle = hasNickname ? yearMakeModel : "";

  return (
    <div
      style={{
        width: "100%",
        flexShrink: 0,
        height: "100%",
        overflowY: "auto",
        scrollSnapAlign: "start",
        background: C.bg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header: nickname + logo icon inline */}
      <div style={{ padding: "32px 24px 0" }}>
        <h1
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 32,
            color: C.text,
            lineHeight: 1,
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </h1>

        {/* Year Make Model */}
        {subtitle && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.muted, margin: "5px 0 0", padding: 0 }}>
            {subtitle}
          </p>
        )}

        {/* Mileage */}
        {vehicle.mileage != null && (
          <p style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 26,
            color: C.text,
            margin: "10px 0 0",
            lineHeight: 1,
          }}>
            {vehicle.mileage.toLocaleString()}
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: 14, color: C.muted, marginLeft: 5 }}>
              {vehicle.mileage_unit}
            </span>
          </p>
        )}

        {/* VIN — tap to copy */}
        {vehicle.vin && (
          <VinCopy vin={vehicle.vin} />
        )}
      </div>

      {/* Car image placeholder */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          margin: "24px 24px 16px",
          height: 140,
          borderRadius: 16,
          border: `1.5px dashed ${C.border}`,
          background: C.sage,
          cursor: "pointer",
          gap: 6,
        }}
      >
        <span style={{ fontSize: 32, color: C.border, lineHeight: 1, fontWeight: 200 }}>+</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.muted }}>
          Add image / rendering
        </span>
      </div>

      {/* Health gauge */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
        <HealthGauge pct={90} />
      </div>

      {/* Quick log shortcuts */}
      <ShortcutGrid />

      <div style={{ flex: 1 }} />

      {/* Swipe hint */}
      <p
        style={{
          textAlign: "center",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          color: C.border,
          margin: "0 0 6px",
          letterSpacing: "0.02em",
        }}
      >
        Swipe to explore →
      </p>

    </div>
  );
}

/* ── PAGE 2: DOCUMENTS ─────────────────────────────── */
function DocumentsPage({
  vehicle,
  documents,
  userId,
  onRefresh,
}: {
  vehicle: Vehicle;
  documents: Document[];
  userId: string;
  onRefresh: () => void;
}) {
  const [uploadType, setUploadType] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const getDoc = (type: string) => documents.find((d) => d.type === type);

  async function handleFile(file: File, type: string) {
    setUploading(true);
    try {
      await uploadDocument(file, userId, vehicle.id, type);
      onRefresh();
    } catch {
      // silent
    } finally {
      setUploading(false);
      setUploadType(null);
    }
  }

  return (
    <div
      style={{
        width: "100%",
        flexShrink: 0,
        height: "100%",
        overflowY: "auto",
        scrollSnapAlign: "start",
        background: C.bg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{ padding: "28px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 28, color: C.text, margin: 0 }}>
            Documents
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.muted, margin: "4px 0 0" }}>
            {documents.length} {documents.length === 1 ? "document" : "documents"} stored
          </p>
        </div>
        <button
          onClick={() => { setUploadType("other"); fileRef.current?.click(); }}
          style={{
            background: "none",
            border: `1.5px solid ${C.green}`,
            borderRadius: 999,
            padding: "6px 14px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: C.green,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          + Add
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadType) handleFile(file, uploadType);
          e.target.value = "";
        }}
      />

      {/* Category rows */}
      <div style={{ flex: 1 }}>
        {DOC_CATEGORIES.map((cat, i) => {
          const doc = getDoc(cat.type);
          return (
            <div
              key={cat.type}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0 20px",
                height: 64,
                borderBottom: `1px solid ${C.border}`,
                borderTop: i === 0 ? `1px solid ${C.border}` : "none",
                cursor: "pointer",
                background: C.bg,
                transition: "background 0.15s",
              }}
              onClick={() => {
                if (doc) {
                  setViewUrl(doc.file_url);
                } else {
                  setUploadType(cat.type);
                  fileRef.current?.click();
                }
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = C.sage; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = C.bg; }}
            >
              <span style={{ flex: 1, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, color: C.text }}>
                {cat.label}
              </span>
              {doc ? (
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.muted }}>
                  {new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              ) : (
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  color: C.green,
                  border: `1px solid ${C.green}`,
                  borderRadius: 999,
                  padding: "3px 10px",
                  fontWeight: 500,
                }}>
                  Add
                </span>
              )}
            </div>
          );
        })}
      </div>

      {uploading && (
        <div style={{ textAlign: "center", padding: 20, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.muted }}>
          Uploading…
        </div>
      )}

      {/* Document viewer overlay */}
      {viewUrl && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}
          onClick={() => setViewUrl(null)}
        >
          <img src={viewUrl} alt="Document" style={{ maxWidth: "90%", maxHeight: "80vh", borderRadius: 12, objectFit: "contain" }} onError={() => { window.open(viewUrl, "_blank"); setViewUrl(null); }} />
          <button style={{ color: "#fff", background: "none", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "8px 20px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer" }}>
            Tap to close
          </button>
        </div>
      )}
    </div>
  );
}

/* ── PAGE 3: FINANCES ──────────────────────────────── */
function FinancesPage({
  vehicle,
  expenses,
  userId,
  onRefresh,
}: {
  vehicle: Vehicle;
  expenses: Expense[];
  userId: string;
  onRefresh: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [expType, setExpType] = useState("Fuel");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);

  // Segmented bar
  const byType: Record<string, number> = {};
  EXPENSE_TYPES.forEach((t) => { byType[t] = 0; });
  monthExpenses.forEach((e) => {
    const key = EXPENSE_TYPES.find((t) => t.toLowerCase() === e.type.toLowerCase()) ?? "Other";
    byType[key] = (byType[key] || 0) + e.amount;
  });

  async function handleAdd() {
    if (!amount || isNaN(parseFloat(amount))) return;
    setSaving(true);
    try {
      await addExpense({ user_id: userId, vehicle_id: vehicle.id, type: expType.toLowerCase(), amount: parseFloat(amount), description: desc });
      onRefresh();
      setShowModal(false);
      setAmount("");
      setDesc("");
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        width: "100%",
        flexShrink: 0,
        height: "100%",
        overflowY: "auto",
        scrollSnapAlign: "start",
        background: C.bg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "28px 20px 0", flex: 1, display: "flex", flexDirection: "column" }}>
        <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 28, color: C.text, margin: "0 0 20px" }}>
          Finances
        </h1>

        {/* Monthly total */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.muted, margin: "0 0 4px" }}>
            Total this month
          </p>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 40, color: C.text, lineHeight: 1 }}>
            ${monthTotal.toFixed(2)}
          </span>
        </div>

        {/* Spending bar */}
        {monthTotal > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 8 }}>
              {EXPENSE_TYPES.map((t, i) => {
                const pct = monthTotal > 0 ? (byType[t] / monthTotal) * 100 : 0;
                if (pct === 0) return null;
                return (
                  <div key={t} style={{ width: `${pct}%`, background: SEGMENT_COLORS[i], transition: "width 0.3s" }} />
                );
              })}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 8 }}>
              {EXPENSE_TYPES.map((t, i) => byType[t] > 0 && (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: SEGMENT_COLORS[i] }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.muted }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expense list */}
        <div style={{ flex: 1 }}>
          {expenses.length === 0 ? (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.muted, textAlign: "center", marginTop: 40 }}>
              No expenses yet.
            </p>
          ) : (
            expenses.map((exp, i) => (
              <div
                key={exp.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "14px 0",
                  borderBottom: `1px solid ${C.border}`,
                  background: i % 2 === 0 ? C.bg : C.sage,
                  paddingLeft: 4,
                  paddingRight: 4,
                }}
              >
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.muted, width: 60, flexShrink: 0 }}>
                  {new Date(exp.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.text }}>
                  {exp.description || exp.type.charAt(0).toUpperCase() + exp.type.slice(1)}
                </span>
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, color: C.green }}>
                  ${exp.amount.toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Add Expense button */}
        <div style={{ padding: "16px 0 24px" }}>
          <GreenButton label="Add Expense" fullWidth onClick={() => setShowModal(true)} />
        </div>
      </div>

      {/* Add expense modal */}
      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{ background: C.bg, borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 430 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 22, color: C.text, marginBottom: 16 }}>
              Add Expense
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {EXPENSE_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setExpType(t)}
                  style={{
                    background: expType === t ? C.green : C.greenLight,
                    color: expType === t ? "#fff" : C.text,
                    border: "none",
                    borderRadius: 999,
                    padding: "6px 14px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              {[
                { val: amount, set: setAmount, ph: "Amount", type: "number" },
                { val: desc, set: setDesc, ph: "Description (optional)", type: "text" },
              ].map(({ val, set, ph, type }) => (
                <input
                  key={ph}
                  type={type}
                  placeholder={ph}
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  style={{
                    width: "100%",
                    background: C.sage,
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 12,
                    padding: "13px 16px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 15,
                    color: C.text,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              ))}
            </div>
            <GreenButton label={saving ? "Saving…" : "Add Expense"} fullWidth onClick={handleAdd} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── PAGE 4: PARTS ─────────────────────────────────── */
function PartsPage({ vehicle }: { vehicle: Vehicle }) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = ["All", "Engine", "Brakes", "Suspension", "Electrical", "Body"];

  return (
    <div
      style={{
        width: "100%",
        flexShrink: 0,
        height: "100%",
        overflowY: "auto",
        scrollSnapAlign: "start",
        background: C.bg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "28px 20px 0" }}>
        <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 28, color: C.text, margin: "0 0 4px" }}>
          Parts
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.muted, margin: "0 0 20px" }}>
          {vehicle.make && vehicle.model ? `Sourced for your ${vehicle.make} ${vehicle.model}` : "Source parts for your vehicle"}
        </p>

        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.border, marginBottom: 16 }}>
          Parts sourcing coming soon
        </p>

        {/* Search */}
        <input
          placeholder="Search parts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            background: C.sage,
            border: `1.5px solid ${C.border}`,
            borderRadius: 12,
            padding: "12px 16px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15,
            color: C.text,
            outline: "none",
            boxSizing: "border-box",
            marginBottom: 16,
          }}
        />

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 24 }}>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                background: activeFilter === f ? C.green : C.greenLight,
                color: activeFilter === f ? "#fff" : C.muted,
                border: "none",
                borderRadius: 999,
                padding: "6px 14px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Empty state */}
        <div style={{ background: C.sage, borderRadius: 16, padding: "40px 24px", textAlign: "center" }}>
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 22, color: C.text, margin: "0 0 8px" }}>
            Coming Soon
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.muted, margin: 0 }}>
            We're building a parts marketplace tailored to your {vehicle.make ?? "vehicle"}. You'll be able to browse, compare, and order directly from here.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── PAGE 5: DIAGNOSTICS ───────────────────────────── */
type IssueStatus = "overdue" | "due-soon" | "good";

const MAINTENANCE_ITEMS: { label: string; status: IssueStatus }[] = [
  { label: "Oil Change", status: "good" },
  { label: "Tire Rotation", status: "due-soon" },
  { label: "Brake Inspection", status: "good" },
  { label: "Battery Check", status: "good" },
];

const STATUS_COLOR: Record<IssueStatus, string> = {
  overdue: C.error,
  "due-soon": "#E5A020",
  good: "#2D9E4A",
};
const STATUS_LABEL: Record<IssueStatus, string> = {
  overdue: "Overdue",
  "due-soon": "Due soon",
  good: "Good",
};

function DiagnosticsPage({ vehicle }: { vehicle: Vehicle }) {
  const [issues, setIssues] = useState<{ id: number; text: string; date: string; resolved: boolean }[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [issueText, setIssueText] = useState("");

  function addIssue() {
    if (!issueText.trim()) return;
    setIssues((prev) => [{ id: Date.now(), text: issueText.trim(), date: new Date().toLocaleDateString(), resolved: false }, ...prev]);
    setIssueText("");
    setShowAdd(false);
  }

  const ongoing = issues.filter((i) => !i.resolved);
  const resolved = issues.filter((i) => i.resolved);

  return (
    <div
      style={{
        width: "100%",
        flexShrink: 0,
        height: "100%",
        overflowY: "auto",
        scrollSnapAlign: "start",
        background: C.bg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "28px 20px 0", flex: 1, display: "flex", flexDirection: "column" }}>
        <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 28, color: C.text, margin: "0 0 4px" }}>
          Diagnostics
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.muted, margin: "0 0 24px" }}>
          OBD-II live diagnostics coming soon. Log issues manually for now.
        </p>

        {/* Maintenance reminders */}
        <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, color: C.text, margin: "0 0 12px" }}>
          Maintenance
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 28, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          {MAINTENANCE_ITEMS.map((item, i) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "14px 16px",
                background: i % 2 === 0 ? C.bg : C.sage,
                borderBottom: i < MAINTENANCE_ITEMS.length - 1 ? `1px solid ${C.border}` : "none",
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR[item.status], marginRight: 12, flexShrink: 0 }} />
              <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.text }}>{item.label}</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: STATUS_COLOR[item.status], fontWeight: 500 }}>
                {STATUS_LABEL[item.status]}
              </span>
            </div>
          ))}
        </div>

        {/* Issue log */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, color: C.text, margin: 0 }}>
            Issue Log
          </h2>
          <button
            onClick={() => setShowAdd(true)}
            style={{ background: C.green, color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer" }}
          >
            + Add
          </button>
        </div>

        {/* Ongoing */}
        {ongoing.length > 0 && (
          <>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Ongoing</p>
            {ongoing.map((issue) => (
              <div key={issue.id} style={{ display: "flex", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.error, marginRight: 12, flexShrink: 0 }} />
                <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.text }}>{issue.text}</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.muted, marginRight: 8 }}>{issue.date}</span>
                <button
                  onClick={() => setIssues((prev) => prev.map((i) => i.id === issue.id ? { ...i, resolved: true } : i))}
                  style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 8px", fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.muted, cursor: "pointer" }}
                >
                  Resolve
                </button>
              </div>
            ))}
          </>
        )}

        {/* Resolved */}
        {resolved.length > 0 && (
          <>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "16px 0 8px" }}>Resolved</p>
            {resolved.map((issue) => (
              <div key={issue.id} style={{ display: "flex", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.border}`, opacity: 0.6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2D9E4A", marginRight: 12, flexShrink: 0 }} />
                <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.text }}>{issue.text}</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.muted }}>{issue.date}</span>
              </div>
            ))}
          </>
        )}

        {ongoing.length === 0 && resolved.length === 0 && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.muted, textAlign: "center", marginTop: 20 }}>
            No issues logged. Tap + Add if something needs attention.
          </p>
        )}
      </div>

      {/* Add issue modal */}
      {showAdd && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setShowAdd(false)}
        >
          <div
            style={{ background: C.bg, borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 430 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 22, color: C.text, marginBottom: 16 }}>
              Log Issue
            </h2>
            <input
              placeholder="Describe the issue…"
              value={issueText}
              onChange={(e) => setIssueText(e.target.value)}
              style={{
                width: "100%",
                background: C.sage,
                border: `1.5px solid ${C.border}`,
                borderRadius: 12,
                padding: "13px 16px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                color: C.text,
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 16,
              }}
            />
            <GreenButton label="Add Issue" fullWidth onClick={addIssue} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── MAIN DASHBOARD ────────────────────────────────── */
export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, signOut } = useAuth();
  const { vehicle, loading } = useVehicle();
  const [currentPage, setCurrentPage] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (!loading && !vehicle) navigate("/setup");
  }, [loading, vehicle]);

  useEffect(() => {
    if (vehicle) {
      getDocumentsByVehicleId(vehicle.id).then(setDocuments).catch(() => {});
      getExpensesByVehicleId(vehicle.id).then(setExpenses).catch(() => {});
    }
  }, [vehicle]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const page = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth);
    setCurrentPage(page);
  };

  const goToPage = (p: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ left: p * scrollRef.current.clientWidth, behavior: "smooth" });
  };

  async function handleSignOut() {
    await signOut();
    navigate("/auth");
  }

  function refreshDocs() {
    if (vehicle) getDocumentsByVehicleId(vehicle.id).then(setDocuments).catch(() => {});
  }
  function refreshExpenses() {
    if (vehicle) getExpensesByVehicleId(vehicle.id).then(setExpenses).catch(() => {});
  }

  if (loading || !vehicle) return <LoadingScreen />;

  const PAGE_LABELS = ["Home", "Documents", "Finances", "Parts", "Diagnostics"];

  return (
    <div style={{ height: "100vh", background: C.bg, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      {/* Floating top-right controls */}
      <div style={{
        position: "absolute",
        top: 32,
        right: 20,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 6,
        pointerEvents: "auto",
      }}>
        {/* Settings icon → opens settings */}
        <button
          onClick={() => setShowSettings(true)}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          <img
            src={`${BASE}settings-icon.png`}
            alt="Settings"
            style={{ height: 28, width: "auto", objectFit: "contain" }}
          />
        </button>

        {/* Profile avatar */}
        <button
          onClick={() => setShowSettings(true)}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
        >
          <div style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: C.greenLight,
            border: `1.5px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <span style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: C.green,
              lineHeight: 1,
            }}>
              {user?.email ? user.email[0].toUpperCase() : "?"}
            </span>
          </div>
        </button>
      </div>

      {/* Swipe container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          display: "flex",
          overflowX: "scroll",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        } as React.CSSProperties}
      >
        <LandingPage vehicle={vehicle} expenses={expenses} documents={documents} onSignOut={handleSignOut} />
        <DocumentsPage vehicle={vehicle} documents={documents} userId={user?.id ?? ""} onRefresh={refreshDocs} />
        <FinancesPage vehicle={vehicle} expenses={expenses} userId={user?.id ?? ""} onRefresh={refreshExpenses} />
        <PartsPage vehicle={vehicle} />
        <DiagnosticsPage vehicle={vehicle} />
      </div>

      {/* Settings sheet */}
      {showSettings && (
        <SettingsSheet
          userEmail={user?.email}
          onSignOut={handleSignOut}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Page dot indicators */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "10px 0 20px",
          background: C.bg,
          borderTop: `1px solid ${C.border}`,
        }}
      >
        {PAGE_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => goToPage(i)}
            title={label}
            style={{
              background: "none",
              border: "none",
              padding: "4px 2px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: i === currentPage ? 22 : 6,
                height: 6,
                borderRadius: 3,
                background: i === currentPage ? C.green : C.border,
                transition: "all 0.25s ease",
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
