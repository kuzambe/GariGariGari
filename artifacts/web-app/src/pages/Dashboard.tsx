import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useVehicle } from "@/context/VehicleContext";
import { getDocumentsByVehicleId, Document, uploadDocument, deleteDocumentWithFile } from "@/lib/api/documents";
import { getExpensesByVehicleId, Expense, addExpense } from "@/lib/api/expenses";
import { Vehicle } from "@/lib/api/vehicles";
import { Mechanic, getMechanicByVehicleId, createMechanic, updateMechanic, deleteMechanic } from "@/lib/api/mechanics";
import { RoadsideAssistance, getRoadsideByUserId, createRoadside, updateRoadside, deleteRoadside } from "@/lib/api/roadsideAssistance";
import { GarageIcon } from "@/components/ui/GarageIcon";
import { LicensePlate, ShuffleText } from "@/components/car/LicensePlate";
import { Odometer } from "@/components/car/Odometer";
import { getManualUrl } from "@/lib/handbookDatabase";
import { AddDocumentSheet } from "@/components/documents/AddDocumentSheet";
import { usePreferences } from "@/context/PreferencesContext";

/* ── DESIGN TOKENS ─────────────────────────────────── */
/* Themeable values use CSS custom properties (switched by data-gari-dark attr).
   Green and status colours stay constant across themes. */
const C = {
  bg:         "var(--gc-bg)",
  sage:       "var(--gc-sage)",
  text:       "var(--gc-text)",
  muted:      "var(--gc-muted)",
  green:      "#1F6B2E",
  greenLight: "var(--gc-greenLight)",
  border:     "var(--gc-border)",
  success:    "#2D9E4A",
  warning:    "#E5A020",
  error:      "#C0392B",
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
      {/* Label above bar */}
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 11,
        color: C.muted,
        margin: 0,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}>
        Car Health
      </p>
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
    </div>
  );
}

/* ── SHORTCUT GRID ─────────────────────────────────── */
type QuickOption = { label: string; route: string; page: number };

const QUICK_OPTIONS: QuickOption[] = [
  { label: "Home",        route: "/",            page: 0 },
  { label: "Documents",   route: "/documents",   page: 1 },
  { label: "Finances",    route: "/finances",    page: 2 },
  { label: "Parts",       route: "/parts",       page: 3 },
  { label: "Diagnostics", route: "/diagnostics", page: 4 },
];

const QUICK_STORAGE_KEY = "gari.quickAccess.v2";

function loadQuickAccess(): QuickOption[] {
  try {
    const raw = localStorage.getItem(QUICK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s) => s && typeof s.label === "string" && typeof s.route === "string" && typeof s.page === "number")
      .map((s) => ({ label: s.label as string, route: s.route as string, page: s.page as number }));
  } catch {
    return [];
  }
}

function ShortcutGrid({ onGoToPage }: { onGoToPage: (p: number) => void }) {
  const [items, setItems] = useState<QuickOption[]>(() => loadQuickAccess());
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(QUICK_STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore quota / disabled storage */ }
  }, [items]);

  function handlePick(opt: QuickOption) {
    setItems((prev) => [...prev, opt]);
    setPickerOpen(false);
  }

  function handleRemove(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  const isEmpty = items.length === 0;

  return (
    <div style={{ padding: "0 20px" }}>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px", textAlign: "center" }}>
        Quick Access
      </p>

      {isEmpty ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "8px 0" }}>
          <button
            onClick={() => setPickerOpen(true)}
            aria-label="Add quick access shortcut"
            style={{
              width: "32%",
              aspectRatio: "1",
              borderRadius: "50%",
              background: "#FFFFFF",
              border: `1.5px solid ${C.border}`,
              boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <span style={{ fontSize: 26, color: C.green, lineHeight: 1, fontWeight: 300 }}>+</span>
          </button>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.muted, margin: 0 }}>
            Add a shortcut
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {items.map((item, i) => (
            <div key={`${item.label}-${i}`} style={{ position: "relative" }}>
              <button
                onClick={() => onGoToPage(item.page)}
                aria-label={`Go to ${item.label}`}
                style={{
                  width: "100%",
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
                <span style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  color: C.text,
                  textAlign: "center",
                  lineHeight: 1.1,
                  padding: "0 6px",
                  letterSpacing: "0.02em",
                }}>
                  {item.label}
                </span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleRemove(i); }}
                aria-label={`Remove ${item.label} shortcut`}
                title="Remove"
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  border: `1.5px solid ${C.border}`,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  color: C.muted,
                  fontSize: 14,
                  lineHeight: 1,
                  zIndex: 2,
                }}
              >
                ×
              </button>
            </div>
          ))}

          {/* Trailing add button */}
          <button
            onClick={() => setPickerOpen(true)}
            aria-label="Add quick access shortcut"
            style={{
              aspectRatio: "1",
              borderRadius: "50%",
              background: "#FFFFFF",
              border: `1.5px dashed ${C.border}`,
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
        </div>
      )}

      {/* Quick-access picker */}
      {pickerOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
          onClick={() => setPickerOpen(false)}
        >
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} />
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
            <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 20px" }} />
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
              Add to quick access
            </p>
            <div style={{ background: C.sage, borderRadius: 14, overflow: "hidden" }}>
              {QUICK_OPTIONS.map((opt, idx) => (
                <button
                  key={opt.label}
                  onClick={() => handlePick(opt)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    padding: "15px 18px",
                    background: "none",
                    border: "none",
                    borderBottom: idx < QUICK_OPTIONS.length - 1 ? `1px solid ${C.border}` : "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.text, flex: 1 }}>{opt.label}</span>
                  <span style={{ color: C.border, fontSize: 18 }}>›</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
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
      <div style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <img
          src={`${BASE}gari-icon-new-nobg.png`}
          alt="Gari"
          className="gari-settings-icon"
          style={{ width: 26, height: 26, objectFit: "contain" }}
        />
      </div>
    </div>
  );
}

/* ── PILL TOGGLE ───────────────────────────────────── */
function PillToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="gari-tap"
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        background: on ? C.green : "var(--gc-border)",
        border: "none",
        padding: 0,
        cursor: "pointer",
        position: "relative",
        flexShrink: 0,
        transition: "background 0.22s ease",
      }}
    >
      <span style={{
        position: "absolute",
        top: 3,
        left: on ? 21 : 3,
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: "#FFFFFF",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        transition: "left 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
        display: "block",
      }} />
    </button>
  );
}

/* ── SETTINGS SHEET ────────────────────────────────── */
function SettingsSheet({ userEmail, onSignOut, onClose }: { userEmail?: string; onSignOut: () => void; onClose: () => void }) {
  const { darkMode, setDarkMode, distanceUnit, setDistanceUnit } = usePreferences();
  const [showUnits, setShowUnits] = useState(false);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />

      {/* Sheet */}
      <div
        style={{
          position: "relative",
          background: C.bg,
          borderRadius: "22px 22px 0 0",
          padding: "12px 24px 44px",
          maxWidth: 430,
          width: "100%",
          margin: "0 auto",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.18)",
          animation: "gariSlideUp 0.3s cubic-bezier(0.22,1,0.36,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 24px" }} />

        {/* Account section */}
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>
          Account
        </p>
        <div style={{ background: C.sage, borderRadius: 14, padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%", background: C.greenLight,
            border: `1.5px solid var(--gc-border)`, display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0,
          }}>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, color: C.green }}>
              {userEmail ? userEmail[0].toUpperCase() : "?"}
            </span>
          </div>
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 14, color: C.text, margin: 0 }}>{userEmail ?? "—"}</p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.muted, margin: "2px 0 0" }}>Gari account</p>
          </div>
        </div>

        {/* Settings section */}
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>
          Settings
        </p>
        <div style={{ background: C.sage, borderRadius: 14, marginBottom: 20, overflow: "hidden" }}>

          {/* Units & Display — expandable */}
          <div
            onClick={() => setShowUnits((p) => !p)}
            style={{ display: "flex", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid var(--gc-border)`, cursor: "pointer" }}
          >
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.text, flex: 1 }}>Units &amp; Display</span>
            <span style={{
              color: C.muted, fontSize: 13,
              transform: showUnits ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.22s ease",
              display: "inline-block",
            }}>›</span>
          </div>

          {/* Expanded panel */}
          {showUnits && (
            <div style={{ padding: "4px 0 8px", borderBottom: `1px solid var(--gc-border)` }}>

              {/* Distance unit */}
              <div style={{ display: "flex", alignItems: "center", padding: "10px 16px" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: C.text, margin: 0 }}>
                    Distance unit
                  </p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.muted, margin: "2px 0 0" }}>
                    Currently showing in <strong>{distanceUnit}</strong>
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {(["km", "mi"] as const).map((u) => (
                    <button
                      key={u}
                      onClick={(e) => { e.stopPropagation(); setDistanceUnit(u); }}
                      className="gari-press"
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        border: "none",
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                        background: distanceUnit === u ? C.green : "var(--gc-border)",
                        color: distanceUnit === u ? "#fff" : C.text,
                        transition: "all 0.18s ease",
                      }}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dark mode */}
              <div style={{ display: "flex", alignItems: "center", padding: "10px 16px" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: C.text, margin: 0 }}>
                    Dark mode
                  </p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.muted, margin: "2px 0 0" }}>
                    {darkMode ? "On — dark theme active" : "Off — light theme active"}
                  </p>
                </div>
                <PillToggle on={darkMode} onToggle={() => { setDarkMode(!darkMode); }} />
              </div>
            </div>
          )}

          {/* Other rows */}
          {["Notifications", "Privacy"].map((label, i, arr) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", padding: "14px 16px",
              borderBottom: i < arr.length - 1 ? `1px solid var(--gc-border)` : "none",
              cursor: "pointer",
            }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.text, flex: 1 }}>{label}</span>
              <span style={{ color: C.muted, fontSize: 13 }}>›</span>
            </div>
          ))}
        </div>

        {/* Sign out */}
        <button
          onClick={onSignOut}
          className="gari-press"
          style={{
            width: "100%", background: "none", border: `1.5px solid var(--gc-border)`,
            borderRadius: 14, padding: "14px 16px", fontFamily: "'DM Sans', sans-serif",
            fontSize: 14, color: "#C0392B", cursor: "pointer", textAlign: "left",
            display: "flex", alignItems: "center", gap: 10,
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
      <div className="gari-spin" style={{ width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img
          src={`${BASE}gari-icon-new-nobg.png`}
          alt="Gari"
          className="gari-settings-icon"
          style={{ width: 52, height: 52, objectFit: "contain" }}
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
        fontWeight: 700,
        fontSize: 13,
        color: copied ? C.green : C.text,
        letterSpacing: "0.06em",
        transition: "color 0.2s",
      }}>
        {copied ? "Copied!" : (
          <>
            <span style={{ color: C.muted, fontWeight: 500, marginRight: 6 }}>VIN</span>
            {vin}
          </>
        )}
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

/* ── CARGPT DAILY LIMIT HELPERS ─────────────────────── */
const CARGPT_LIMIT = 20;
const CARGPT_LS_KEY = "cargpt_usage";
const CARGPT_HISTORY_KEY = "cargpt_history";
const CARGPT_HISTORY_LIMIT = 10;

function getCarGptHistory(vehicleId: string): CarGptMessage[] {
  try {
    const today = new Date().toISOString().split("T")[0];
    const raw = localStorage.getItem(`${CARGPT_HISTORY_KEY}_${vehicleId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { date: string; messages: CarGptMessage[] };
    if (parsed.date !== today) return [];          // new day — clear
    return parsed.messages ?? [];
  } catch { return []; }
}

function saveCarGptHistory(vehicleId: string, messages: CarGptMessage[]) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const persisted = messages
      .filter((m) => m.role !== "loading")
      .slice(-CARGPT_HISTORY_LIMIT);
    localStorage.setItem(
      `${CARGPT_HISTORY_KEY}_${vehicleId}`,
      JSON.stringify({ date: today, messages: persisted }),
    );
  } catch { /* storage full or unavailable */ }
}

function getCarGptUsage(): { date: string; count: number } {
  try {
    const raw = localStorage.getItem(CARGPT_LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { date: "", count: 0 };
}

function incrementCarGptUsage(): number {
  const today = new Date().toISOString().split("T")[0];
  const usage = getCarGptUsage();
  const count = usage.date === today ? usage.count + 1 : 1;
  localStorage.setItem(CARGPT_LS_KEY, JSON.stringify({ date: today, count }));
  return count;
}

function getRemainingCarGptQuestions(): number {
  const today = new Date().toISOString().split("T")[0];
  const usage = getCarGptUsage();
  if (usage.date !== today) return CARGPT_LIMIT;
  return Math.max(0, CARGPT_LIMIT - usage.count);
}

/* ── THREE-DOT LOADING INDICATOR ────────────────────── */
function CarGptTyping() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "10px 14px" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#1F6B2E",
            animation: "cargptPulse 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes cargptPulse {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

/* ── PAGE 1: LANDING ───────────────────────────────── */
interface CarGptMessage {
  role: "user" | "model" | "loading";
  text: string;
}

function LandingPage({
  vehicle,
  userId,
  onSignOut,
  onGoToPage,
  onOpenSettings,
}: {
  vehicle: Vehicle;
  userId: string;
  expenses: Expense[];
  documents: Document[];
  onSignOut: () => void;
  onGoToPage: (p: number) => void;
  onOpenSettings: () => void;
}) {
  const { distanceUnit } = usePreferences();
  const [carGptInput, setCarGptInput] = useState("");
  // hydratedVehicleRef tracks which vehicle's history is currently in state.
  // Initialized synchronously so the save guard is accurate from the first render.
  const hydratedVehicleRef = useRef(vehicle.id);
  const [carGptMessages, setCarGptMessages] = useState<CarGptMessage[]>(() => {
    hydratedVehicleRef.current = vehicle.id;
    return getCarGptHistory(vehicle.id);
  });
  const [carGptLoading, setCarGptLoading] = useState(false);
  const [carGptOpen, setCarGptOpen] = useState(false);
  const [carGptRemaining, setCarGptRemaining] = useState(() => getRemainingCarGptQuestions());
  const carGptBottomRef = useRef<HTMLDivElement>(null);

  // ── Mechanic state ──────────────────────────────────────────────────────────
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [mechSheetOpen, setMechSheetOpen] = useState(false);
  const [mechMode, setMechMode] = useState<"add" | "view" | "edit">("add");
  const [mechName, setMechName] = useState("");
  const [mechShop, setMechShop] = useState("");
  const [mechPhone, setMechPhone] = useState("");
  const [mechAddress, setMechAddress] = useState("");
  const [mechHours, setMechHours] = useState("");
  const [mechNotes, setMechNotes] = useState("");
  const [mechSaving, setMechSaving] = useState(false);
  const [mechDeleting, setMechDeleting] = useState(false);
  const [mechConfirmDelete, setMechConfirmDelete] = useState(false);

  // ── Roadside state ──────────────────────────────────────────────────────────
  const [roadside, setRoadside] = useState<RoadsideAssistance | null>(null);
  const [roadSheetOpen, setRoadSheetOpen] = useState(false);
  const [roadMode, setRoadMode] = useState<"add" | "view" | "edit">("add");
  const [roadProvider, setRoadProvider] = useState("");
  const [roadMember, setRoadMember] = useState("");
  const [roadPhone, setRoadPhone] = useState("");
  const [roadCoverage, setRoadCoverage] = useState("");
  const [roadSaving, setRoadSaving] = useState(false);
  const [roadDeleting, setRoadDeleting] = useState(false);
  const [roadConfirmDelete, setRoadConfirmDelete] = useState(false);
  const [memberCopied, setMemberCopied] = useState(false);

  // ── Shared contact toast ────────────────────────────────────────────────────
  const [contactToast, setContactToast] = useState<string | null>(null);

  // Load mechanic + roadside on mount / vehicle change
  useEffect(() => {
    getMechanicByVehicleId(vehicle.id, userId).then(setMechanic).catch((err) => {
      console.error("[dashboard] load mechanic failed", err);
      setMechanic(null);
    });
    getRoadsideByUserId(userId).then(setRoadside).catch((err) => {
      console.error("[dashboard] load roadside failed", err);
      setRoadside(null);
    });
  }, [vehicle.id, userId]);

  function showContactToast(msg: string) {
    setContactToast(msg);
    setTimeout(() => setContactToast(null), 2500);
  }

  function toTelHref(phone: string): string {
    const stripped = phone.replace(/[^\d+]/g, "");
    if (stripped.startsWith("+")) return "tel:+" + stripped.slice(1).replace(/\+/g, "");
    return "tel:" + stripped.replace(/\+/g, "");
  }

  function openMechSheet() {
    if (!mechanic) {
      setMechName(""); setMechShop(""); setMechPhone("");
      setMechAddress(""); setMechHours(""); setMechNotes("");
      setMechMode("add");
    } else {
      setMechMode("view");
    }
    setMechConfirmDelete(false);
    setMechSheetOpen(true);
  }

  function startMechEdit() {
    setMechName(mechanic?.name ?? "");
    setMechShop(mechanic?.shop_name ?? "");
    setMechPhone(mechanic?.phone ?? "");
    setMechAddress(mechanic?.address ?? "");
    setMechHours(mechanic?.hours ?? "");
    setMechNotes(mechanic?.notes ?? "");
    setMechMode("edit");
  }

  async function handleSaveMech() {
    if (!mechName.trim()) return;
    setMechSaving(true);
    try {
      const payload = {
        user_id: userId,
        vehicle_id: vehicle.id,
        name: mechName.trim(),
        shop_name: mechShop.trim() || undefined,
        phone: mechPhone.trim() || undefined,
        address: mechAddress.trim() || undefined,
        hours: mechHours.trim() || undefined,
        notes: mechNotes.trim() || undefined,
      };
      const saved = mechanic
        ? await updateMechanic(mechanic.id, payload)
        : await createMechanic(payload);
      setMechanic(saved);
      setMechSheetOpen(false);
      showContactToast("Mechanic saved");
    } catch {
      showContactToast("Failed to save mechanic. Please try again.");
    } finally {
      setMechSaving(false);
    }
  }

  async function handleDeleteMech() {
    if (!mechanic) return;
    setMechDeleting(true);
    try {
      await deleteMechanic(mechanic.id);
      setMechanic(null);
      setMechConfirmDelete(false);
      setMechSheetOpen(false);
      showContactToast("Mechanic removed");
    } catch {
      showContactToast("Failed to remove mechanic. Please try again.");
    } finally {
      setMechDeleting(false);
    }
  }

  function openRoadSheet() {
    if (!roadside) {
      setRoadProvider(""); setRoadMember(""); setRoadPhone(""); setRoadCoverage("");
      setRoadMode("add");
    } else {
      setRoadMode("view");
    }
    setRoadConfirmDelete(false);
    setRoadSheetOpen(true);
  }

  function startRoadEdit() {
    setRoadProvider(roadside?.provider_name ?? "");
    setRoadMember(roadside?.member_number ?? "");
    setRoadPhone(roadside?.phone ?? "");
    setRoadCoverage(roadside?.coverage_notes ?? "");
    setRoadMode("edit");
  }

  async function handleSaveRoad() {
    if (!roadProvider.trim()) return;
    setRoadSaving(true);
    try {
      const payload = {
        user_id: userId,
        provider_name: roadProvider.trim(),
        member_number: roadMember.trim() || undefined,
        phone: roadPhone.trim() || undefined,
        coverage_notes: roadCoverage.trim() || undefined,
      };
      const saved = roadside
        ? await updateRoadside(roadside.id, payload)
        : await createRoadside(payload);
      setRoadside(saved);
      setRoadSheetOpen(false);
      showContactToast("Roadside Assistance saved");
    } catch {
      showContactToast("Failed to save. Please try again.");
    } finally {
      setRoadSaving(false);
    }
  }

  async function handleDeleteRoad() {
    if (!roadside) return;
    setRoadDeleting(true);
    try {
      await deleteRoadside(roadside.id);
      setRoadside(null);
      setRoadConfirmDelete(false);
      setRoadSheetOpen(false);
      showContactToast("Roadside Assistance removed");
    } catch {
      showContactToast("Failed to remove. Please try again.");
    } finally {
      setRoadDeleting(false);
    }
  }

  // Save effect runs BEFORE the hydration effect so that on a vehicle.id change,
  // the guard below prevents the previous vehicle's messages from being written
  // under the new vehicle's key (hydratedVehicleRef is still the old id at that point).
  useEffect(() => {
    if (hydratedVehicleRef.current !== vehicle.id) return;
    saveCarGptHistory(vehicle.id, carGptMessages);
  }, [carGptMessages, vehicle.id]);

  // Reload history when vehicle changes (runs after save effect, safe).
  useEffect(() => {
    hydratedVehicleRef.current = vehicle.id;
    setCarGptMessages(getCarGptHistory(vehicle.id));
  }, [vehicle.id]);

  // Keep counter fresh and clear history on day rollover.
  useEffect(() => {
    function refresh() {
      setCarGptRemaining(getRemainingCarGptQuestions());
      // getCarGptHistory returns [] when the stored date ≠ today (day rollover).
      if (getCarGptHistory(vehicle.id).length === 0) {
        setCarGptMessages([]);
      }
    }
    document.addEventListener("visibilitychange", refresh);
    const timer = setInterval(refresh, 60_000);
    return () => { document.removeEventListener("visibilitychange", refresh); clearInterval(timer); };
  }, [vehicle.id]);

  useEffect(() => {
    carGptBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [carGptMessages]);

  async function handleCarGptSubmit() {
    const message = carGptInput.trim();
    if (!message || carGptLoading) return;

    if (getRemainingCarGptQuestions() <= 0) {
      setCarGptMessages((prev) => [
        ...prev,
        { role: "user", text: message },
        { role: "model", text: "You've used all your CarGPT questions for today. Come back tomorrow." },
      ]);
      setCarGptInput("");
      return;
    }

    incrementCarGptUsage();
    setCarGptRemaining(getRemainingCarGptQuestions());

    const history: { role: "user" | "model"; text: string }[] = carGptMessages
      .filter((m) => m.role !== "loading")
      .slice(-6)
      .map((m) => ({ role: m.role as "user" | "model", text: m.text }));

    setCarGptMessages((prev) => [...prev, { role: "user", text: message }, { role: "loading", text: "" }]);
    setCarGptInput("");
    setCarGptLoading(true);

    try {
      const [expenses, documents] = await Promise.all([
        vehicle.id ? getExpensesByVehicleId(vehicle.id) : Promise.resolve([]),
        vehicle.id ? getDocumentsByVehicleId(vehicle.id) : Promise.resolve([]),
      ]);

      const base = import.meta.env.BASE_URL as string;
      const apiBase = base.replace(/\/$/, "");
      const response = await fetch(`${apiBase}/api/cargpt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleContext: {
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            trim: vehicle.trim,
            engine: vehicle.engine,
            fuel_type: vehicle.fuel_type,
            mileage: vehicle.mileage,
            mileage_unit: vehicle.mileage_unit,
            expenses: expenses.slice(0, 20),
            documents: documents.slice(0, 10),
          },
          userMessage: message,
          history,
        }),
      });

      const data = await response.json() as { text?: string; error?: string };
      const replyText = response.status === 429
        ? "You've used all your CarGPT questions for today. Come back tomorrow."
        : (data.text || data.error || "CarGPT is unavailable right now. Try again in a moment.");

      setCarGptMessages((prev) =>
        prev.map((m, i) => (i === prev.length - 1 && m.role === "loading" ? { role: "model", text: replyText } : m))
      );
    } catch {
      setCarGptMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1 && m.role === "loading"
            ? { role: "model", text: "CarGPT is unavailable right now. Try again in a moment." }
            : m
        )
      );
    } finally {
      setCarGptLoading(false);
    }
  }

  const make = vehicle.make ? vehicle.make.charAt(0).toUpperCase() + vehicle.make.slice(1).toLowerCase() : "";
  const yearMakeModel = [vehicle.year, make, vehicle.model].filter(Boolean).join(" ");
  const title = vehicle.nickname?.trim() || "Your car";
  const subtitle = yearMakeModel;

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
      <div style={{ padding: "28px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 42, color: C.text, margin: 0 }}>
            <ShuffleText text={title} charset="letters" />
          </h1>
          <button onClick={onOpenSettings} className="gari-logo-bob gari-tap" style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
            <img src={`${BASE}gari-icon-new-nobg.png`} alt="Settings" className="gari-settings-icon" style={{ height: 26, width: "auto", display: "block" }} />
          </button>
        </div>

        {/* Year Make Model */}
        {subtitle && (
          <p style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 26,
            color: C.text,
            margin: "8px 0 0",
            padding: 0,
            lineHeight: 1.1,
          }}>
            {subtitle}
          </p>
        )}


        {/* Mileage — odometer */}
        {vehicle.mileage != null && (
          <Odometer
            value={distanceUnit === "mi" ? Math.round(vehicle.mileage * 0.621371) : vehicle.mileage}
            unit={distanceUnit === "mi" ? "mi" : (vehicle.mileage_unit ?? "km")}
          />
        )}

        {/* VIN — tap to copy */}
        {vehicle.vin && (
          <VinCopy vin={vehicle.vin} />
        )}
      </div>

      {/* License plate */}
      <LicensePlate plate={vehicle.license_plate || ""} />

      {/* Health gauge */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
        <HealthGauge pct={90} />
      </div>

      {/* Quick log shortcuts */}
      <ShortcutGrid onGoToPage={onGoToPage} />

      {/* Car-GPT — collapsed tile (opens chat sheet) */}
      <div style={{ padding: "24px 20px 0" }}>
        <button
          onClick={() => setCarGptOpen(true)}
          style={{
            width: "100%",
            background: C.sage,
            border: `1.5px solid ${C.border}`,
            borderRadius: 14,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 15, color: C.text, margin: 0 }}>
              Car-GPT
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.muted, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {carGptMessages.length > 0
                ? "Continue chat"
                : `Ask anything about ${title}`}
            </p>
          </div>
          <span style={{ color: C.border, fontSize: 18, lineHeight: 1 }}>›</span>
        </button>
      </div>

      {/* Car-GPT chat sheet */}
      {carGptOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
          onClick={() => setCarGptOpen(false)}
        >
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
          <div
            style={{
              position: "relative", background: "#FFFFFF", borderRadius: "22px 22px 0 0",
              padding: "12px 20px 24px", maxWidth: 430, width: "100%", margin: "0 auto",
              boxShadow: "0 -4px 32px rgba(0,0,0,0.12)", maxHeight: "85vh",
              display: "flex", flexDirection: "column",
              animation: "gariSlideUp 0.3s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 16px" }} />

            {/* Header row with title + close */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, color: C.text, margin: 0 }}>
                Car-GPT
              </p>
              <button
                onClick={() => setCarGptOpen(false)}
                aria-label="Close chat"
                style={{
                  background: "none", border: "none", padding: 4, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.muted,
                }}
              >
                Close
              </button>
            </div>

            {/* Conversation */}
            <div
              style={{
                flex: 1,
                minHeight: 200,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 10,
                paddingRight: 2,
              }}
            >
              {carGptMessages.length === 0 ? (
                <p style={{ textAlign: "center", color: C.muted, fontFamily: "'DM Sans', sans-serif", fontSize: 13, margin: "auto 0" }}>
                  Ask anything about {title}.
                </p>
              ) : (
                carGptMessages.map((msg, i) => {
                  const isUser = msg.role === "user";
                  const isLoading = msg.role === "loading";
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: isUser ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "80%",
                          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          background: isUser ? "#1F6B2E" : C.sage,
                          color: isUser ? "#FFFFFF" : "#0D1C0E",
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 13,
                          lineHeight: 1.5,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                        }}
                      >
                        {isLoading ? (
                          <CarGptTyping />
                        ) : (
                          <div style={{ padding: "10px 14px", whiteSpace: "pre-wrap" }}>{msg.text}</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={carGptBottomRef} />
            </div>

            {/* Input row */}
            <div style={{ position: "relative" }}>
              <input
                placeholder={carGptRemaining === 0 ? "Daily limit reached. Come back tomorrow." : `Any questions regarding ${title}...`}
                value={carGptInput}
                onChange={(e) => setCarGptInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCarGptSubmit(); }}
                disabled={carGptLoading || carGptRemaining === 0}
                autoFocus
                style={{
                  width: "100%",
                  background: C.sage,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 12,
                  padding: "12px 44px 12px 16px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  color: C.text,
                  outline: "none",
                  boxSizing: "border-box",
                  opacity: carGptLoading || carGptRemaining === 0 ? 0.5 : 1,
                }}
              />
              <button
                onClick={handleCarGptSubmit}
                disabled={carGptLoading || !carGptInput.trim() || carGptRemaining === 0}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: carGptInput.trim() && !carGptLoading && carGptRemaining > 0 ? "#1F6B2E" : "transparent",
                  border: "none",
                  borderRadius: 8,
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: carGptInput.trim() && !carGptLoading && carGptRemaining > 0 ? "pointer" : "default",
                  transition: "background 0.2s",
                  padding: 0,
                }}
              >
                <span style={{ fontSize: 16, color: carGptInput.trim() && !carGptLoading && carGptRemaining > 0 ? "#FFFFFF" : C.muted, lineHeight: 1 }}>↑</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roadside + Mechanic */}
      <div style={{ padding: "16px 20px 0", display: "flex", gap: 12 }}>
        <button
          onClick={openRoadSheet}
          style={{ flex: 1, background: C.sage, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 6, cursor: "pointer", textAlign: "left" }}
        >
          <span style={{ fontSize: 20, color: C.green, fontWeight: 300, lineHeight: 1 }}>{roadside ? "›" : "+"}</span>
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 15, color: C.text, margin: 0 }}>
            {roadside ? roadside.provider_name : "Roadside Assistance"}
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.muted, margin: 0 }}>
            {roadside ? (roadside.phone ?? "Tap to view") : "Add plan and coverage"}
          </p>
        </button>
        <button
          onClick={openMechSheet}
          style={{ flex: 1, background: C.sage, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 6, cursor: "pointer", textAlign: "left" }}
        >
          <span style={{ fontSize: 20, color: C.green, fontWeight: 300, lineHeight: 1 }}>{mechanic ? "›" : "+"}</span>
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 15, color: C.text, margin: 0 }}>
            {mechanic ? (mechanic.shop_name || mechanic.name) : "Mechanic"}
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.muted, margin: 0 }}>
            {mechanic ? (mechanic.phone ?? "Tap to view") : "Add regular mechanic info"}
          </p>
        </button>
      </div>

      <div style={{ flex: 1 }} />

      {/* Shared keyframe for both bottom sheets */}
      <style>{`@keyframes gariSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

      {/* ── Mechanic Bottom Sheet ─────────────────────── */}
      {mechSheetOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
          onClick={() => setMechSheetOpen(false)}
        >
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
          <div
            style={{ position: "relative", background: "#FFFFFF", borderRadius: "22px 22px 0 0", padding: "12px 24px 48px", maxWidth: 430, width: "100%", margin: "0 auto", boxShadow: "0 -4px 32px rgba(0,0,0,0.12)", maxHeight: "90vh", overflowY: "auto", animation: "gariSlideUp 0.3s ease" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#D4DDD5", margin: "0 auto 24px" }} />

            {mechMode === "view" && mechanic ? (
              <>
                <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 24, color: "#0D1C0E", margin: "0 0 4px" }}>{mechanic.name}</h2>
                {mechanic.shop_name && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#6B7C6D", margin: "0 0 8px" }}>{mechanic.shop_name}</p>}
                {mechanic.phone && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7C6D", margin: "0 0 6px" }}>{mechanic.phone}</p>}
                {mechanic.address && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7C6D", margin: "0 0 6px" }}>{mechanic.address}</p>}
                {mechanic.hours && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6B7C6D", margin: "0 0 6px" }}>{mechanic.hours}</p>}
                {mechanic.notes && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6B7C6D", margin: "0 0 16px" }}>{mechanic.notes}</p>}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
                  {mechanic.phone && (
                    <a href={toTelHref(mechanic.phone)} style={{ display: "block", textAlign: "center", background: "#1F6B2E", color: "#fff", borderRadius: 14, padding: "15px 24px", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "0.04em", textDecoration: "none", boxSizing: "border-box" }}>
                      Call {mechanic.phone}
                    </a>
                  )}
                  <button onClick={startMechEdit} style={{ width: "100%", background: "none", border: "1.5px solid #1F6B2E", borderRadius: 14, padding: "12px 24px", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, color: "#1F6B2E", cursor: "pointer", letterSpacing: "0.04em" }}>
                    Edit
                  </button>
                  <button onClick={() => { setMechConfirmDelete(false); setMechSheetOpen(false); }} style={{ background: "none", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7C6D", cursor: "pointer", padding: "8px 0" }}>
                    Cancel
                  </button>
                  {!mechConfirmDelete ? (
                    <button onClick={() => setMechConfirmDelete(true)} style={{ background: "none", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#C0392B", cursor: "pointer", padding: "4px 0", textDecoration: "underline" }}>
                      Remove mechanic
                    </button>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px", background: "#FBEAE7", borderRadius: 12 }}>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#0D1C0E", margin: 0, textAlign: "center" }}>
                        Remove this mechanic? This cannot be undone.
                      </p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setMechConfirmDelete(false)} disabled={mechDeleting} style={{ flex: 1, background: "none", border: "1.5px solid #6B7C6D", borderRadius: 10, padding: "10px", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7C6D", cursor: mechDeleting ? "default" : "pointer" }}>
                          Cancel
                        </button>
                        <button onClick={handleDeleteMech} disabled={mechDeleting} style={{ flex: 1, background: "#C0392B", border: "none", borderRadius: 10, padding: "10px", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#fff", cursor: mechDeleting ? "default" : "pointer", opacity: mechDeleting ? 0.7 : 1 }}>
                          {mechDeleting ? "Removing…" : "Remove"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 20, color: "#0D1C0E", margin: "0 0 20px" }}>
                  {mechMode === "edit" ? "Edit Mechanic" : "Add Your Mechanic"}
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                  {([ { label: "Mechanic Name *", val: mechName, set: setMechName, ph: "e.g. Mike Johnson" },
                    { label: "Shop Name", val: mechShop, set: setMechShop, ph: "e.g. Mike's Auto" },
                    { label: "Phone Number", val: mechPhone, set: setMechPhone, ph: "e.g. (555) 123-4567", type: "tel" },
                    { label: "Address", val: mechAddress, set: setMechAddress, ph: "Shop address" },
                    { label: "Hours", val: mechHours, set: setMechHours, ph: "e.g. Mon–Fri 8am–6pm" },
                    { label: "Notes", val: mechNotes, set: setMechNotes, ph: "Any notes…" },
                  ] as { label: string; val: string; set: (v: string) => void; ph: string; type?: string }[]).map(({ label, val, set, ph, type }) => (
                    <div key={label}>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7C6D", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>{label}</p>
                      <input type={type ?? "text"} value={val} placeholder={ph} onChange={(e) => set(e.target.value)} style={{ width: "100%", background: "#F4F7F2", border: "1.5px solid #D4DDD5", borderRadius: 12, padding: "13px 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#0D1C0E", outline: "none", boxSizing: "border-box" }} />
                    </div>
                  ))}
                </div>
                <button onClick={handleSaveMech} disabled={mechSaving || !mechName.trim()} style={{ width: "100%", background: "#1F6B2E", color: "#fff", border: "none", borderRadius: 14, padding: "15px 24px", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "0.04em", cursor: mechSaving || !mechName.trim() ? "default" : "pointer", opacity: mechSaving || !mechName.trim() ? 0.7 : 1, transition: "opacity 0.15s", marginBottom: 12 }}>
                  {mechSaving ? "Saving…" : "Save"}
                </button>
                <button onClick={() => mechMode === "edit" ? setMechMode("view") : setMechSheetOpen(false)} style={{ background: "none", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7C6D", cursor: "pointer", width: "100%", padding: "8px 0" }}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Roadside Assistance Bottom Sheet ─────────── */}
      {roadSheetOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
          onClick={() => setRoadSheetOpen(false)}
        >
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
          <div
            style={{ position: "relative", background: "#FFFFFF", borderRadius: "22px 22px 0 0", padding: "12px 24px 48px", maxWidth: 430, width: "100%", margin: "0 auto", boxShadow: "0 -4px 32px rgba(0,0,0,0.12)", maxHeight: "90vh", overflowY: "auto", animation: "gariSlideUp 0.3s ease" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#D4DDD5", margin: "0 auto 24px" }} />

            {roadMode === "view" && roadside ? (
              <>
                <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 24, color: "#0D1C0E", margin: "0 0 12px" }}>{roadside.provider_name}</h2>
                {roadside.member_number && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7C6D", margin: 0 }}>Member # {roadside.member_number}</p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(roadside!.member_number!).then(() => { setMemberCopied(true); setTimeout(() => setMemberCopied(false), 1800); }).catch(() => {}); }}
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}
                      title="Copy member number"
                    >
                      {memberCopied
                        ? <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#1F6B2E" }}>Copied!</span>
                        : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4" y="1" width="9" height="9" rx="1.5" stroke="#6B7C6D" strokeWidth="1.5"/><path d="M1 5v7a1 1 0 001 1h7" stroke="#6B7C6D" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      }
                    </button>
                  </div>
                )}
                {roadside.phone && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7C6D", margin: "0 0 8px" }}>{roadside.phone}</p>}
                {roadside.coverage_notes && (
                  <div style={{ marginBottom: 8 }}>
                    {roadside.coverage_notes.split(/[\n,]/).map((n) => n.trim()).filter(Boolean).map((n, i) => (
                      <p key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6B7C6D", margin: "0 0 4px" }}>• {n}</p>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
                  {roadside.phone && (
                    <a href={toTelHref(roadside.phone)} style={{ display: "block", textAlign: "center", background: "#C0392B", color: "#fff", borderRadius: 14, padding: "15px 24px", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "0.04em", textDecoration: "none", boxSizing: "border-box" }}>
                      Call {roadside.phone}
                    </a>
                  )}
                  <button onClick={startRoadEdit} style={{ width: "100%", background: "none", border: "1.5px solid #1F6B2E", borderRadius: 14, padding: "12px 24px", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, color: "#1F6B2E", cursor: "pointer", letterSpacing: "0.04em" }}>
                    Edit
                  </button>
                  <button onClick={() => { setRoadConfirmDelete(false); setRoadSheetOpen(false); }} style={{ background: "none", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7C6D", cursor: "pointer", padding: "8px 0" }}>
                    Cancel
                  </button>
                  {!roadConfirmDelete ? (
                    <button onClick={() => setRoadConfirmDelete(true)} style={{ background: "none", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#C0392B", cursor: "pointer", padding: "4px 0", textDecoration: "underline" }}>
                      Remove roadside assistance
                    </button>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px", background: "#FBEAE7", borderRadius: 12 }}>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#0D1C0E", margin: 0, textAlign: "center" }}>
                        Remove this roadside assistance plan? This cannot be undone.
                      </p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setRoadConfirmDelete(false)} disabled={roadDeleting} style={{ flex: 1, background: "none", border: "1.5px solid #6B7C6D", borderRadius: 10, padding: "10px", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7C6D", cursor: roadDeleting ? "default" : "pointer" }}>
                          Cancel
                        </button>
                        <button onClick={handleDeleteRoad} disabled={roadDeleting} style={{ flex: 1, background: "#C0392B", border: "none", borderRadius: 10, padding: "10px", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#fff", cursor: roadDeleting ? "default" : "pointer", opacity: roadDeleting ? 0.7 : 1 }}>
                          {roadDeleting ? "Removing…" : "Remove"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 20, color: "#0D1C0E", margin: "0 0 20px" }}>
                  {roadMode === "edit" ? "Edit Roadside Assistance" : "Add Roadside Assistance"}
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                  {([ { label: "Provider Name *", val: roadProvider, set: setRoadProvider, ph: "e.g. CAA, AMA, AAA" },
                    { label: "Member Number", val: roadMember, set: setRoadMember, ph: "Your membership number" },
                    { label: "Phone Number", val: roadPhone, set: setRoadPhone, ph: "Emergency phone number", type: "tel" },
                    { label: "Coverage Notes", val: roadCoverage, set: setRoadCoverage, ph: "e.g. Towing up to 200km, battery boost, flat tire" },
                  ] as { label: string; val: string; set: (v: string) => void; ph: string; type?: string }[]).map(({ label, val, set, ph, type }) => (
                    <div key={label}>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7C6D", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>{label}</p>
                      <input type={type ?? "text"} value={val} placeholder={ph} onChange={(e) => set(e.target.value)} style={{ width: "100%", background: "#F4F7F2", border: "1.5px solid #D4DDD5", borderRadius: 12, padding: "13px 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#0D1C0E", outline: "none", boxSizing: "border-box" }} />
                    </div>
                  ))}
                </div>
                <button onClick={handleSaveRoad} disabled={roadSaving || !roadProvider.trim()} style={{ width: "100%", background: "#1F6B2E", color: "#fff", border: "none", borderRadius: 14, padding: "15px 24px", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "0.04em", cursor: roadSaving || !roadProvider.trim() ? "default" : "pointer", opacity: roadSaving || !roadProvider.trim() ? 0.7 : 1, transition: "opacity 0.15s", marginBottom: 12 }}>
                  {roadSaving ? "Saving…" : "Save"}
                </button>
                <button onClick={() => roadMode === "edit" ? setRoadMode("view") : setRoadSheetOpen(false)} style={{ background: "none", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7C6D", cursor: "pointer", width: "100%", padding: "8px 0" }}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Contact save toast */}
      {contactToast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", background: "#1F6B2E", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, padding: "12px 24px", borderRadius: 12, zIndex: 300, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", whiteSpace: "nowrap" }}>
          {contactToast}
        </div>
      )}

    </div>
  );
}

/* ── PULSE SKELETON ────────────────────────────────── */
function DocRowSkeleton({ i }: { i: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        height: 64,
        borderBottom: `1px solid ${C.border}`,
        borderTop: i === 0 ? `1px solid ${C.border}` : "none",
      }}
    >
      <div style={{ flex: 1, height: 14, borderRadius: 6, background: C.border, maxWidth: 160, animation: "docSkeletonPulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
      <div style={{ height: 26, width: 50, borderRadius: 8, background: C.border, animation: "docSkeletonPulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.1 + 0.2}s` }} />
      <style>{`@keyframes docSkeletonPulse { 0%,100%{opacity:0.45} 50%{opacity:0.9} }`}</style>
    </div>
  );
}

/* ── TOAST ─────────────────────────────────────────── */
function DocToast({ message, color }: { message: string; color: string }) {
  return (
    <div style={{
      position: "fixed",
      top: 24,
      left: "50%",
      transform: "translateX(-50%)",
      background: color,
      color: "#fff",
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 14,
      fontWeight: 500,
      padding: "12px 24px",
      borderRadius: 12,
      zIndex: 500,
      boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      whiteSpace: "nowrap",
      pointerEvents: "none",
    }}>
      {message}
    </div>
  );
}

/* ── CATEGORY PICKER SHEET ─────────────────────────── */
function CategoryDocumentsListSheet({
  label,
  docs,
  onClose,
  onView,
  onDelete,
  onAdd,
}: {
  label: string;
  docs: Document[];
  onClose: () => void;
  onView: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  onAdd: () => void;
}) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 250, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
      <div
        style={{ position: "relative", background: C.bg, borderRadius: "20px 20px 0 0", padding: "12px 24px 32px", maxWidth: 430, width: "100%", margin: "0 auto", boxShadow: "0 -4px 32px rgba(0,0,0,0.12)", maxHeight: "80vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 20, color: C.text, margin: 0 }}>
            {label}
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.muted, margin: 0 }}>
            {docs.length} {docs.length === 1 ? "file" : "files"}
          </p>
        </div>

        <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}`, flex: 1, overflowY: "auto" }}>
          {docs.map((doc, i) => (
            <div
              key={doc.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "14px 16px",
                background: C.bg,
                borderBottom: i < docs.length - 1 ? `1px solid ${C.border}` : "none",
                gap: 12,
              }}
            >
              <button
                onClick={() => onView(doc)}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", minHeight: 44 }}
                aria-label={`View document from ${new Date(doc.created_at).toLocaleDateString()}`}
              >
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 15, color: C.text }}>
                  {label} {docs.length - i}
                </span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.muted }}>
                  Added {new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </button>
              <button
                onClick={() => onDelete(doc)}
                aria-label="Delete document"
                style={{ width: 36, height: 36, borderRadius: 10, background: "none", border: `1px solid ${C.border}`, color: C.error, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={onAdd}
          style={{ marginTop: 16, width: "100%", background: C.green, color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, cursor: "pointer", minHeight: 44, letterSpacing: "0.04em" }}
        >
          Add another file
        </button>
        <button
          onClick={onClose}
          style={{ display: "block", width: "100%", marginTop: 8, background: "none", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.muted, cursor: "pointer", textAlign: "center", minHeight: 44 }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

function CategoryPickerSheet({ onSelect, onClose }: { onSelect: (type: string, label: string) => void; onClose: () => void }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 250, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
      <div
        style={{ position: "relative", background: C.bg, borderRadius: "20px 20px 0 0", padding: "12px 24px 48px", maxWidth: 430, width: "100%", margin: "0 auto", boxShadow: "0 -4px 32px rgba(0,0,0,0.12)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 20px" }} />
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 20, color: C.text, margin: "0 0 16px" }}>
          Select Category
        </p>
        <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}` }}>
          {DOC_CATEGORIES.map((cat, i) => (
            <button
              key={cat.type}
              onClick={() => onSelect(cat.type, cat.label)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 18px",
                background: C.bg,
                border: "none",
                borderBottom: i < DOC_CATEGORIES.length - 1 ? `1px solid ${C.border}` : "none",
                cursor: "pointer",
                textAlign: "left",
                minHeight: 44,
              }}
            >
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, color: C.text }}>{cat.label}</span>
              <span style={{ color: C.border, fontSize: 18 }}>›</span>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{ display: "block", width: "100%", marginTop: 20, background: "none", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.muted, cursor: "pointer", textAlign: "center", minHeight: 44 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── PAGE 2: DOCUMENTS ─────────────────────────────── */
function DocumentsPage({
  vehicle,
  documents,
  userId,
  onRefresh,
  onOpenSettings,
  docsLoading,
}: {
  vehicle: Vehicle;
  documents: Document[];
  userId: string;
  onRefresh: () => void;
  onOpenSettings: () => void;
  docsLoading: boolean;
}) {
  const [sheetType, setSheetType] = useState<string | null>(null);
  const [sheetLabel, setSheetLabel] = useState<string>("");
  const [sheetReplacing, setSheetReplacing] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [listType, setListType] = useState<string | null>(null);
  const [listLabel, setListLabel] = useState<string>("");
  const [viewDoc, setViewDoc] = useState<Document | null>(null);
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);
  const [scale, setScale] = useState(1);
  const lastTouchDist = useRef<number | null>(null);

  const getDocs = useCallback(
    (type: string) => documents.filter((d) => d.type === type),
    [documents]
  );

  function openSheet(type: string, label: string, replacing = false) {
    setSheetType(type);
    setSheetLabel(label);
    setSheetReplacing(replacing);
  }

  function openList(type: string, label: string) {
    setListType(type);
    setListLabel(label);
  }

  function showToast(message: string, color: string) {
    setToast({ message, color });
    setTimeout(() => setToast(null), 2000);
  }

  async function handleFileSelected(file: File, type: string, replacing: boolean) {
    const replacingDoc = replacing ? viewDoc : null;
    setSheetType(null);
    setUploadingType(type);
    try {
      await uploadDocument(file, userId, vehicle.id, type);
      if (replacingDoc) {
        try {
          await deleteDocumentWithFile(replacingDoc);
        } catch {
          /* leave older copy in place if cleanup fails */
        }
      }
      onRefresh();
      showToast(replacing ? "Document updated" : "Document saved", C.success);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      if (msg.toLowerCase().includes("size") || msg.toLowerCase().includes("large")) {
        showToast("File is too large (max 10 MB)", C.error);
      } else {
        showToast("Upload failed. Please try again.", C.error);
      }
    } finally {
      setUploadingType(null);
    }
  }

  async function handleDelete() {
    const target = confirmDeleteDoc;
    if (!target) return;
    setDeleting(true);
    try {
      await deleteDocumentWithFile(target);
      setConfirmDeleteDoc(null);
      if (viewDoc?.id === target.id) setViewDoc(null);
      onRefresh();
      showToast("Document deleted", C.muted);
    } catch (err) {
      showToast("Delete failed. Please try again.", C.error);
    } finally {
      setDeleting(false);
    }
  }

  function handleReplace() {
    if (!viewDoc) return;
    const cat = DOC_CATEGORIES.find((c) => c.type === viewDoc.type);
    const label = cat?.label ?? viewDoc.type;
    openSheet(viewDoc.type, label, true);
  }

  const isPdf = (doc: Document) => {
    const url = doc.file_url.toLowerCase();
    return url.includes(".pdf") || url.includes("pdf");
  };

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / lastTouchDist.current;
      setScale((prev) => Math.min(5, Math.max(1, prev * ratio)));
      lastTouchDist.current = dist;
    }
  }

  function handleTouchEnd() {
    lastTouchDist.current = null;
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
      <div style={{ padding: "28px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 28, color: C.text, margin: 0 }}>
            Documents
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={() => setShowCategoryPicker(true)}
              style={{ background: "none", border: "none", padding: 4, cursor: "pointer", display: "flex", alignItems: "center" }}
              aria-label="Add document"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            <button onClick={onOpenSettings} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
              <img src={`${BASE}gari-icon-new-nobg.png`} alt="Settings" className="gari-settings-icon" style={{ height: 26, width: "auto", display: "block" }} />
            </button>
          </div>
        </div>
      </div>

      {/* Category rows */}
      <div style={{ flex: 1 }}>
        {DOC_CATEGORIES.map((cat, i) => {
          const docs = getDocs(cat.type);
          const latest = docs[0];
          const count = docs.length;
          const isUploading = uploadingType === cat.type;

          if (docsLoading) return <DocRowSkeleton key={cat.type} i={i} />;

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
                cursor: isUploading ? "default" : "pointer",
                background: C.bg,
                transition: "background 0.15s",
              }}
              onClick={() => {
                if (isUploading) return;
                if (cat.type === "vehicle-handbook") {
                  const url = getManualUrl(vehicle.year, vehicle.make, vehicle.model);
                  window.open(url, "_blank", "noopener,noreferrer");
                  return;
                }
                if (count > 0) {
                  openList(cat.type, cat.label);
                } else {
                  openSheet(cat.type, cat.label);
                }
              }}
              onMouseEnter={(e) => { if (!isUploading) (e.currentTarget as HTMLDivElement).style.background = C.sage; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = C.bg; }}
            >
              <span style={{ flex: 1, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, color: C.text }}>
                {cat.label}
              </span>

              {isUploading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 16, height: 16, border: `2px solid ${C.border}`, borderTopColor: C.green, borderRadius: "50%", animation: "docSpin 0.8s linear infinite" }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.muted }}>Uploading…</span>
                  <style>{`@keyframes docSpin { to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : latest ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {count > 1 && (
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.green,
                      background: C.greenLight,
                      borderRadius: 999,
                      padding: "3px 9px",
                      letterSpacing: "0.02em",
                    }}>
                      {count} files
                    </span>
                  )}
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.muted }}>
                    {new Date(latest.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              ) : (
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  color: C.green,
                  border: `1.5px solid ${C.green}`,
                  borderRadius: 8,
                  padding: "4px 12px",
                  fontWeight: 500,
                }}>
                  {cat.type === "vehicle-handbook" ? "View" : "Add"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Category picker (from global +) */}
      {showCategoryPicker && (
        <CategoryPickerSheet
          onSelect={(type, label) => { setShowCategoryPicker(false); openSheet(type, label); }}
          onClose={() => setShowCategoryPicker(false)}
        />
      )}

      {/* Add document sheet */}
      {sheetType && (
        <AddDocumentSheet
          categoryLabel={sheetLabel}
          onClose={() => setSheetType(null)}
          onFileSelected={(file) => handleFileSelected(file, sheetType, sheetReplacing)}
          onError={(msg) => { setSheetType(null); showToast(msg, C.error); }}
        />
      )}

      {/* Category documents list sheet */}
      {listType && (
        <CategoryDocumentsListSheet
          label={listLabel}
          docs={getDocs(listType)}
          onClose={() => setListType(null)}
          onView={(doc) => { setScale(1); setListType(null); setViewDoc(doc); }}
          onDelete={(doc) => setConfirmDeleteDoc(doc)}
          onAdd={() => {
            const type = listType;
            const label = listLabel;
            setListType(null);
            openSheet(type, label);
          }}
        />
      )}

      {/* Full-screen document viewer */}
      {viewDoc && !confirmDeleteDoc && (
        <div
          style={{ position: "fixed", inset: 0, background: "#000", zIndex: 200, display: "flex", flexDirection: "column", touchAction: "pinch-zoom" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {isPdf(viewDoc) ? (
            <iframe
              src={viewDoc.file_url}
              style={{ flex: 1, border: "none", background: "#fff" }}
              title="Document"
            />
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <img
                src={viewDoc.file_url}
                alt="Document"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  transform: `scale(${scale})`,
                  transformOrigin: "center center",
                  transition: lastTouchDist.current !== null ? "none" : "transform 0.1s",
                }}
                onError={() => { window.open(viewDoc.file_url, "_blank"); setViewDoc(null); }}
              />
            </div>
          )}

          {/* Close button */}
          <button
            onClick={() => setViewDoc(null)}
            style={{ position: "absolute", top: 52, left: 20, width: 44, height: 44, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}
          >
            ✕
          </button>

          {/* Action buttons */}
          <div style={{ position: "absolute", top: 52, right: 20, display: "flex", gap: 10, zIndex: 10 }}>
            <button
              onClick={handleReplace}
              style={{ width: 44, height: 44, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              aria-label="Replace document"
              title="Replace"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
                <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
              </svg>
            </button>
            <button
              onClick={() => viewDoc && setConfirmDeleteDoc(viewDoc)}
              style={{ width: 44, height: 44, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              aria-label="Delete document"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {confirmDeleteDoc && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setConfirmDeleteDoc(null)}
        >
          <div
            style={{ background: C.bg, borderRadius: 20, padding: 28, maxWidth: 360, width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 20, color: C.text, margin: "0 0 10px" }}>
              Delete this document?
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.muted, margin: "0 0 24px", lineHeight: 1.5 }}>
              This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setConfirmDeleteDoc(null)}
                style={{ flex: 1, background: "none", border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "13px", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, color: C.text, cursor: "pointer", minHeight: 44 }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ flex: 1, background: C.error, border: "none", borderRadius: 12, padding: "13px", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, color: "#fff", cursor: "pointer", minHeight: 44, opacity: deleting ? 0.7 : 1 }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <DocToast message={toast.message} color={toast.color} />}
    </div>
  );
}

/* ── SCAN RECEIPT FLOW ──────────────────────────────── */
type ScanStage = "camera" | "processing" | "confirm" | "denied";

function ScanReceiptFlow({
  userId,
  vehicleId,
  onClose,
  onSaved,
}: {
  userId: string;
  vehicleId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stage, setStage] = useState<ScanStage>("camera");
  const [ocrError, setOcrError] = useState(false);
  const [merchant, setMerchant] = useState("");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [expType, setExpType] = useState("Fuel");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch(() => { if (active) setStage("denied"); });
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (stage === "confirm") requestAnimationFrame(() => setConfirmVisible(true));
  }, [stage]);

  async function capture() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setStage("processing");
    setOcrError(false);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const { data: { text } } = await worker.recognize(canvas);
      await worker.terminate();
      if (text.trim()) {
        parseOcr(text);
      } else {
        setOcrError(true);
      }
    } catch {
      setOcrError(true);
    }
    setStage("confirm");
  }

  function parseOcr(text: string) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    setMerchant(lines[0] ?? "");
    const dateMatch = text.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+ \d{1,2},? \d{4})\b/i);
    setDate(dateMatch ? dateMatch[0] : "");
    const totalMatches = [...text.matchAll(/(?:grand\s+)?total[^\d$]*[$]?\s*([\d,]+\.?\d{0,2})/gi)];
    if (totalMatches.length) {
      setAmount(totalMatches[totalMatches.length - 1][1].replace(",", ""));
    } else {
      const allAmounts = [...text.matchAll(/\$?([\d]+\.[\d]{2})/g)].map((m) => parseFloat(m[1]));
      if (allAmounts.length) setAmount(String(Math.max(...allAmounts)));
    }
  }

  async function handleSave() {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed)) return;
    setSaving(true);
    try {
      await addExpense({
        user_id: userId,
        vehicle_id: vehicleId,
        type: expType.toLowerCase(),
        amount: parsed,
        description: [merchant, notes].filter(Boolean).join(" — "),
      });
      onSaved();
      onClose();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: C.sage,
    border: `1.5px solid ${C.border}`,
    borderRadius: 10,
    padding: "12px 14px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    color: C.text,
    outline: "none",
    boxSizing: "border-box",
    minHeight: 44,
  };

  if (stage === "denied") {
    return (
      <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, gap: 16 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 1.6 }}>
          Camera access is needed to scan receipts. Please allow camera access in your device settings.
        </p>
        <button onClick={onClose} style={{ background: C.green, color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontFamily: "'DM Sans', sans-serif", fontSize: 15, cursor: "pointer", minHeight: 44 }}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "#000" }}>
      {/* Camera / processing view */}
      {(stage === "camera" || stage === "processing") && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          {/* Dim + frame overlay */}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{
              width: "72%",
              aspectRatio: "0.6",
              border: "2px solid rgba(255,255,255,0.9)",
              borderRadius: 12,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
            }} />
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#fff", marginTop: 14, textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}>
              Position your receipt within the frame.
            </p>
          </div>
          {/* Close */}
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 52, left: 20, width: 44, height: 44, background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✕
          </button>
          {/* Capture / spinner */}
          {stage === "camera" ? (
            <button
              onClick={capture}
              style={{ position: "absolute", bottom: 64, left: "50%", transform: "translateX(-50%)", width: 72, height: 72, borderRadius: "50%", background: "#fff", border: "4px solid rgba(255,255,255,0.4)", cursor: "pointer", boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}
            />
          ) : (
            <div style={{ position: "absolute", bottom: 64, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div className="scan-spin" style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} />
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#fff" }}>Reading receipt…</p>
            </div>
          )}
        </>
      )}

      {/* Hidden capture canvas */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Confirmation sheet */}
      {stage === "confirm" && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end" }}>
          <div style={{
            width: "100%",
            background: C.bg,
            borderRadius: "22px 22px 0 0",
            padding: "24px 24px 48px",
            maxHeight: "90vh",
            overflowY: "auto",
            transform: confirmVisible ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.3s ease",
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 20px" }} />
            <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 20, color: C.text, margin: "0 0 12px" }}>
              Confirm Receipt
            </h2>
            {ocrError && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.muted, margin: "0 0 16px", lineHeight: 1.5, background: C.sage, borderRadius: 8, padding: "10px 12px" }}>
                Couldn't read this receipt clearly. Please fill in the details manually.
              </p>
            )}

            {/* Editable fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              {([
                { label: "Merchant", val: merchant, set: setMerchant, ph: "Merchant name", type: "text" },
                { label: "Date", val: date, set: setDate, ph: "e.g. 01/15/2025", type: "text" },
                { label: "Amount ($)", val: amount, set: setAmount, ph: "0.00", type: "number" },
              ] as { label: string; val: string; set: (v: string) => void; ph: string; type: string }[]).map(({ label, val, set, ph, type }) => (
                <div key={label}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>{label}</p>
                  <input type={type} value={val} placeholder={ph} onChange={(e) => set(e.target.value)} style={inputStyle} />
                </div>
              ))}
            </div>

            {/* Expense type */}
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Type</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {EXPENSE_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setExpType(t)}
                  style={{ background: expType === t ? C.green : C.greenLight, color: expType === t ? "#fff" : C.text, border: "none", borderRadius: 999, padding: "7px 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer", minHeight: 44 }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Notes */}
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Notes</p>
            <input
              placeholder="Add a note..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ ...inputStyle, marginBottom: 24 }}
            />

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={onClose}
                style={{ flex: 1, background: "none", border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "14px", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 17, color: C.text, cursor: "pointer", minHeight: 44 }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ flex: 2, background: C.green, border: "none", borderRadius: 14, padding: "14px", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 17, color: "#fff", cursor: "pointer", minHeight: 44, opacity: saving ? 0.7 : 1, transition: "opacity 0.15s" }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
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
  onOpenSettings,
}: {
  vehicle: Vehicle;
  expenses: Expense[];
  userId: string;
  onRefresh: () => void;
  onOpenSettings: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [expType, setExpType] = useState("Fuel");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  function handleReceiptSaved() {
    onRefresh();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }

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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 28, color: C.text, margin: 0 }}>
            Finances
          </h1>
          <button onClick={onOpenSettings} className="gari-logo-bob gari-tap" style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
            <img src={`${BASE}gari-icon-new-nobg.png`} alt="Settings" className="gari-settings-icon" style={{ height: 26, width: "auto", display: "block" }} />
          </button>
        </div>

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

        {/* Add Expense + Scan Receipt buttons */}
        <div style={{ padding: "16px 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          <GreenButton label="Add Expense" fullWidth onClick={() => setShowModal(true)} />
          <button
            onClick={() => setShowScanner(true)}
            style={{
              width: "100%",
              background: "none",
              border: `1.5px solid ${C.green}`,
              borderRadius: 14,
              padding: "14px 24px",
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: "0.04em",
              color: C.green,
              cursor: "pointer",
              minHeight: 44,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.7"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >
            Scan Receipt
          </button>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: C.muted,
            margin: "2px 4px 0",
            lineHeight: 1.5,
          }}>
            Scan gas receipts and invoices to automatically be scanned and uploaded into Gari's Finances and Documents tracking.
          </p>
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

      {/* Receipt scanner */}
      {showScanner && (
        <ScanReceiptFlow
          userId={userId}
          vehicleId={vehicle.id}
          onClose={() => setShowScanner(false)}
          onSaved={handleReceiptSaved}
        />
      )}

      {/* Success toast */}
      {showToast && (
        <div style={{
          position: "fixed",
          top: 24,
          left: "50%",
          transform: "translateX(-50%)",
          background: C.green,
          color: "#fff",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          fontWeight: 500,
          padding: "12px 24px",
          borderRadius: 12,
          zIndex: 300,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          whiteSpace: "nowrap",
        }}>
          Expense saved
        </div>
      )}
    </div>
  );
}

/* ── PAGE 4: PARTS ─────────────────────────────────── */
function PartsPage({ vehicle, onOpenSettings }: { vehicle: Vehicle; onOpenSettings: () => void }) {
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 28, color: C.text, margin: 0 }}>
            Parts
          </h1>
          <button onClick={onOpenSettings} className="gari-logo-bob gari-tap" style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
            <img src={`${BASE}gari-icon-new-nobg.png`} alt="Settings" className="gari-settings-icon" style={{ height: 26, width: "auto", display: "block" }} />
          </button>
        </div>
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

function DiagnosticsPage({ vehicle, onOpenSettings }: { vehicle: Vehicle; onOpenSettings: () => void }) {
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 28, color: C.text, margin: 0 }}>
            Diagnostics
          </h1>
          <button onClick={onOpenSettings} className="gari-logo-bob gari-tap" style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
            <img src={`${BASE}gari-icon-new-nobg.png`} alt="Settings" className="gari-settings-icon" style={{ height: 26, width: "auto", display: "block" }} />
          </button>
        </div>
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
  const [isSwiping, setIsSwiping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const swipeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !vehicle) navigate("/setup");
  }, [loading, vehicle]);

  useEffect(() => {
    if (vehicle) {
      setDocsLoading(true);
      getDocumentsByVehicleId(vehicle.id)
        .then(setDocuments)
        .catch(() => {})
        .finally(() => setDocsLoading(false));
      getExpensesByVehicleId(vehicle.id).then(setExpenses).catch(() => {});
    }
  }, [vehicle]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const page = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth);
    setCurrentPage(page);
    setIsSwiping(true);
    if (swipeTimer.current) clearTimeout(swipeTimer.current);
    swipeTimer.current = setTimeout(() => setIsSwiping(false), 300);
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
    if (vehicle) {
      getDocumentsByVehicleId(vehicle.id).then(setDocuments).catch(() => {});
    }
  }
  function refreshExpenses() {
    if (vehicle) getExpensesByVehicleId(vehicle.id).then(setExpenses).catch(() => {});
  }

  if (loading || !vehicle) return <LoadingScreen />;

  const PAGE_LABELS = ["Home", "Documents", "Finances", "Parts", "Diagnostics"];

  return (
    <div className="gari-mount-soft" style={{ height: "100vh", background: C.bg, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>

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
        <LandingPage vehicle={vehicle} expenses={expenses} documents={documents} userId={user?.id ?? ""} onSignOut={handleSignOut} onGoToPage={goToPage} onOpenSettings={() => setShowSettings(true)} />
        <DocumentsPage vehicle={vehicle} documents={documents} userId={user?.id ?? ""} onRefresh={refreshDocs} onOpenSettings={() => setShowSettings(true)} docsLoading={docsLoading} />
        <FinancesPage vehicle={vehicle} expenses={expenses} userId={user?.id ?? ""} onRefresh={refreshExpenses} onOpenSettings={() => setShowSettings(true)} />
        <PartsPage vehicle={vehicle} onOpenSettings={() => setShowSettings(true)} />
        <DiagnosticsPage vehicle={vehicle} onOpenSettings={() => setShowSettings(true)} />
      </div>

      {/* Settings sheet */}
      {showSettings && (
        <SettingsSheet
          userEmail={user?.email}
          onSignOut={handleSignOut}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Page indicator — sliding capsule with active label */}
      <div
        style={{
          position: "relative",
          padding: "14px 0 22px",
          background: C.bg,
        }}
      >
        {/* Active page label */}
        <div
          key={currentPage}
          style={{
            textAlign: "center",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: C.muted,
            marginBottom: 8,
            opacity: isSwiping ? 0.35 : 1,
            transition: "opacity 0.22s ease",
            animation: !isSwiping ? "gariFadeIn 0.35s ease both" : undefined,
          }}
        >
          {PAGE_LABELS[currentPage]}
        </div>

        {/* Dot row */}
        <div style={{ position: "relative", width: 5 * 28, height: 12, margin: "0 auto" }}>
          {/* Sliding active capsule */}
          <div
            style={{
              position: "absolute",
              top: 3,
              left: currentPage * 28 + 3,
              width: 22,
              height: 6,
              borderRadius: 3,
              background: `linear-gradient(90deg, ${C.green} 0%, #2E8B3E 100%)`,
              boxShadow: `0 2px 10px ${C.green}55, 0 0 0 1px ${C.green}25`,
              transition: "left 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
              pointerEvents: "none",
            }}
          />
          {PAGE_LABELS.map((label, i) => (
            <button
              key={i}
              onClick={() => goToPage(i)}
              title={label}
              className="gari-tap"
              style={{
                position: "absolute",
                top: 0,
                left: i * 28,
                width: 28,
                height: 12,
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: i === currentPage ? "transparent" : C.border,
                  transition: "background 0.25s ease",
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
