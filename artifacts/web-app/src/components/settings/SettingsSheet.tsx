import { useState } from "react";
import { usePreferences } from "@/context/PreferencesContext";

const C = {
  bg:         "var(--gc-bg)",
  sage:       "var(--gc-sage)",
  text:       "var(--gc-text)",
  muted:      "var(--gc-muted)",
  green:      "#1F6B2E",
  greenLight: "var(--gc-greenLight)",
  border:     "var(--gc-border)",
};

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

interface SettingsSheetProps {
  userEmail?: string;
  onSignOut: () => void;
  onClose: () => void;
  onAddVehicle: () => void;
}

export function SettingsSheet({ userEmail, onSignOut, onClose, onAddVehicle }: SettingsSheetProps) {
  const { darkMode, setDarkMode, distanceUnit, setDistanceUnit } = usePreferences();
  const [showUnits, setShowUnits] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

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
                <PillToggle on={darkMode} onToggle={() => setDarkMode(!darkMode)} />
              </div>
            </div>
          )}

          {/* Notifications row */}
          <div
            onClick={() => setShowNotifications(true)}
            style={{ display: "flex", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid var(--gc-border)`, cursor: "pointer" }}
          >
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.text, flex: 1 }}>Notifications</span>
            <span style={{ color: C.muted, fontSize: 13 }}>›</span>
          </div>

          {/* Privacy row */}
          <div style={{ display: "flex", alignItems: "center", padding: "14px 16px", cursor: "pointer" }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.text, flex: 1 }}>Privacy</span>
            <span style={{ color: C.muted, fontSize: 13 }}>›</span>
          </div>
        </div>

        {/* Add Vehicle */}
        <button
          onClick={onAddVehicle}
          className="gari-press"
          style={{
            width: "100%", background: "none", border: `1.5px solid var(--gc-border)`,
            borderRadius: 14, padding: "14px 16px", fontFamily: "'DM Sans', sans-serif",
            fontSize: 14, color: C.text, cursor: "pointer", textAlign: "left",
            display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
          }}
        >
          <span style={{ flex: 1 }}>Add Vehicle</span>
          <span style={{ color: C.muted, fontSize: 13 }}>+</span>
        </button>

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

      {/* Notifications full-screen overlay */}
      {showNotifications && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 210,
            background: C.bg,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "40px 32px",
            animation: "gariFadeIn 0.25s ease",
          }}
        >
          <div
            style={{
              animation: "gariLogoFloat 3s ease-in-out infinite",
              textAlign: "center",
              maxWidth: 300,
              marginBottom: 48,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 20 }}>🔔</div>
            <p style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: 22,
              color: C.text,
              margin: "0 0 12px",
              lineHeight: 1.25,
            }}>
              Chill out buddy
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              color: C.muted,
              margin: 0,
              lineHeight: 1.6,
            }}>
              Why are you so eager for notifications? We've just started to make this. Appreciate the love though!
            </p>
          </div>
          <button
            onClick={() => setShowNotifications(false)}
            style={{
              background: "none",
              border: `1.5px solid var(--gc-border)`,
              borderRadius: 14,
              padding: "14px 40px",
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: 16,
              color: C.text,
              cursor: "pointer",
              letterSpacing: "0.05em",
            }}
          >
            GO BACK
          </button>
        </div>
      )}
    </div>
  );
}
