import { useState } from "react";
import { usePreferences } from "@/context/PreferencesContext";
import { updateVehicle, deleteVehicle, type Vehicle } from "@/lib/api/vehicles";
import { PAINT_OPTIONS } from "@/lib/paintColors";
import { BellIcon, AlertTriangleIcon } from "@/components/ui/icons";

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
  vehicle?: Vehicle | null;
  isGuest?: boolean;
  onVehicleUpdated?: () => void | Promise<void>;
  onVehicleDeleted?: () => void | Promise<void>;
}

export function SettingsSheet({
  userEmail, onSignOut, onClose, onAddVehicle,
  vehicle, isGuest, onVehicleUpdated, onVehicleDeleted,
}: SettingsSheetProps) {
  const { darkMode, setDarkMode, distanceUnit, setDistanceUnit } = usePreferences();
  const [showUnits, setShowUnits] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEditVehicle, setShowEditVehicle] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const canEditVehicle = !!vehicle && !isGuest && vehicle.id !== "guest-vehicle";

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
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>
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
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 14, color: C.text, margin: 0 }}>{userEmail ?? "—"}</p>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: C.muted, margin: "2px 0 0" }}>Gari account</p>
          </div>
        </div>

        {/* Settings section */}
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>
          Settings
        </p>
        <div style={{ background: C.sage, borderRadius: 14, marginBottom: 20, overflow: "hidden" }}>

          {/* Units & Display — expandable */}
          <div
            onClick={() => setShowUnits((p) => !p)}
            style={{ display: "flex", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid var(--gc-border)`, cursor: "pointer" }}
          >
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: C.text, flex: 1 }}>Units &amp; Display</span>
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
                  <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>
                    Distance unit
                  </p>
                  <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: C.muted, margin: "2px 0 0" }}>
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
                        fontFamily: "'Rajdhani', sans-serif",
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
                  <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>
                    Dark mode
                  </p>
                  <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: C.muted, margin: "2px 0 0" }}>
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
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: C.text, flex: 1 }}>Notifications</span>
            <span style={{ color: C.muted, fontSize: 13 }}>›</span>
          </div>

          {/* Privacy row */}
          <div style={{ display: "flex", alignItems: "center", padding: "14px 16px", cursor: "pointer" }}>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: C.text, flex: 1 }}>Privacy</span>
            <span style={{ color: C.muted, fontSize: 13 }}>›</span>
          </div>
        </div>

        {/* Vehicle section */}
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>
          Vehicle
        </p>
        <div style={{ background: C.sage, borderRadius: 14, marginBottom: 10, overflow: "hidden" }}>
          {/* Edit Vehicle */}
          {canEditVehicle && vehicle && (
            <button
              onClick={() => setShowEditVehicle(true)}
              className="gari-press"
              style={{
                width: "100%", background: "none", border: "none",
                borderBottom: `1px solid var(--gc-border)`,
                padding: "14px 16px", fontFamily: "'Rajdhani', sans-serif",
                fontSize: 14, color: C.text, cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: 10,
              }}
            >
              <span style={{ flex: 1 }}>Edit Vehicle</span>
              <span style={{ color: C.muted, fontSize: 13 }}>›</span>
            </button>
          )}

          {/* Add Vehicle */}
          <button
            onClick={onAddVehicle}
            className="gari-press"
            style={{
              width: "100%", background: "none", border: "none",
              padding: "14px 16px", fontFamily: "'Rajdhani', sans-serif",
              fontSize: 14, color: C.text, cursor: "pointer", textAlign: "left",
              display: "flex", alignItems: "center", gap: 10,
              ...(canEditVehicle ? {} : {}),
            }}
          >
            <span style={{ flex: 1 }}>Add Vehicle</span>
            <span style={{ color: C.muted, fontSize: 13 }}>+</span>
          </button>

          {/* Remove Vehicle */}
          {canEditVehicle && vehicle && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="gari-press"
              style={{
                width: "100%", background: "none", border: "none",
                borderTop: `1px solid var(--gc-border)`,
                padding: "14px 16px", fontFamily: "'Rajdhani', sans-serif",
                fontSize: 14, color: "#C0392B", cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: 10,
              }}
            >
              <span style={{ flex: 1 }}>Remove Vehicle</span>
              <span style={{ color: "#C0392B", opacity: 0.6, fontSize: 13 }}>›</span>
            </button>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={onSignOut}
          className="gari-press"
          style={{
            width: "100%", background: "none", border: `1.5px solid var(--gc-border)`,
            borderRadius: 14, padding: "14px 16px", fontFamily: "'Rajdhani', sans-serif",
            fontSize: 14, color: "#C0392B", cursor: "pointer", textAlign: "left",
            display: "flex", alignItems: "center", gap: 10,
          }}
        >
          <span>Sign out</span>
        </button>
      </div>

      {/* Edit Vehicle overlay */}
      {showEditVehicle && vehicle && (
        <EditVehicleSheet
          vehicle={vehicle}
          onClose={() => setShowEditVehicle(false)}
          onSaved={async () => {
            setShowEditVehicle(false);
            await onVehicleUpdated?.();
          }}
        />
      )}

      {/* Remove Vehicle confirmation */}
      {confirmDelete && vehicle && (
        <ConfirmDeleteVehicle
          vehicleLabel={vehicle.nickname || `${vehicle.year ?? ""} ${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim() || "this vehicle"}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            try {
              await deleteVehicle(vehicle.id);
              setConfirmDelete(false);
              await onVehicleDeleted?.();
            } catch {
              setConfirmDelete(false);
            }
          }}
        />
      )}

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
            <div style={{ marginBottom: 20 }}><BellIcon size={48} color="#6B7C6D" strokeWidth={1.6} /></div>
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
              fontFamily: "'Rajdhani', sans-serif",
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

/* ── Edit Vehicle sheet ──────────────────────────────────── */
function EditVehicleSheet({
  vehicle, onClose, onSaved,
}: {
  vehicle: Vehicle;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [form, setForm] = useState({
    nickname: vehicle.nickname ?? "",
    make: vehicle.make ?? "",
    model: vehicle.model ?? "",
    year: vehicle.year != null ? String(vehicle.year) : "",
    trim: vehicle.trim ?? "",
    license_plate: vehicle.license_plate ?? "",
    mileage: vehicle.mileage != null ? String(vehicle.mileage) : "",
    vin: vehicle.vin ?? "",
  });
  const [paintName, setPaintName] = useState<string | null>(vehicle.paint_name ?? null);
  const [paintHex, setPaintHex] = useState<string | null>(vehicle.paint_code ?? null);
  const isCustomPaint = !!paintName && !PAINT_OPTIONS.some((p) => p.name === paintName);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSave() {
    if (!form.nickname.trim()) { setErr("Nickname can't be empty."); return; }
    setSaving(true); setErr(null);
    try {
      await updateVehicle(vehicle.id, {
        nickname: form.nickname.trim(),
        make: form.make.trim() || null,
        model: form.model.trim() || null,
        year: form.year.trim() ? (parseInt(form.year.trim(), 10) || null) : null,
        trim: form.trim.trim() || null,
        license_plate: form.license_plate.trim() || null,
        mileage: form.mileage.trim() ? (parseInt(form.mileage.trim(), 10) || null) : null,
        vin: form.vin.trim() ? form.vin.trim().toUpperCase() : null,
        paint_name: paintName,
        paint_code: paintHex,
      });
      await onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't save changes.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "var(--gc-bg)",
    border: `1.5px solid var(--gc-border)`, borderRadius: 12,
    padding: "12px 14px", fontFamily: "'Rajdhani', sans-serif",
    fontSize: 15, color: C.text, outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: C.muted,
    margin: "0 0 4px", letterSpacing: "0.04em",
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 230, background: "rgba(0,0,0,0.55)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.bg, borderRadius: "22px 22px 0 0", padding: "12px 24px 32px", maxWidth: 430, width: "100%", margin: "0 auto", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 -4px 32px rgba(0,0,0,0.25)" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 22, color: C.text, margin: 0, flex: 1 }}>Edit Vehicle</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 4 }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <p style={labelStyle}>Nickname</p>
            <input style={inputStyle} value={form.nickname} onChange={(e) => set("nickname", e.target.value)} placeholder="Your Camry" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <p style={labelStyle}>Make</p>
              <input style={inputStyle} value={form.make} onChange={(e) => set("make", e.target.value)} placeholder="Toyota" />
            </div>
            <div>
              <p style={labelStyle}>Model</p>
              <input style={inputStyle} value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="Camry" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <p style={labelStyle}>Year</p>
              <input style={inputStyle} type="number" inputMode="numeric" value={form.year} onChange={(e) => set("year", e.target.value)} placeholder="2020" />
            </div>
            <div>
              <p style={labelStyle}>Trim</p>
              <input style={inputStyle} value={form.trim} onChange={(e) => set("trim", e.target.value)} placeholder="LE" />
            </div>
          </div>
          <div>
            <p style={labelStyle}>Color{paintName ? ` · ${paintName}` : ""}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {PAINT_OPTIONS.map((p) => {
                const selected = paintName === p.name;
                return (
                  <button
                    key={p.name}
                    type="button"
                    aria-label={p.name}
                    onClick={() => {
                      setPaintName(selected ? null : p.name);
                      setPaintHex(selected ? null : p.hex);
                    }}
                    style={{
                      width: 30, height: 30, borderRadius: "50%", background: p.hex, cursor: "pointer", padding: 0,
                      border: selected ? `2.5px solid ${C.green}` : `1.5px solid var(--gc-border)`,
                      boxShadow: selected ? "0 0 0 2px var(--gc-bg) inset" : "none",
                    }}
                  />
                );
              })}
              {/* Custom color */}
              <label
                aria-label="Custom color"
                title="Custom color"
                style={{
                  position: "relative", width: 30, height: 30, borderRadius: "50%", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isCustomPaint && paintHex ? paintHex : "conic-gradient(from 0deg, #C0392B, #E8C33C, #1F6B2E, #2D6CB5, #6B4A2B, #C0392B)",
                  border: isCustomPaint ? `2.5px solid ${C.green}` : `1.5px solid var(--gc-border)`,
                  boxShadow: isCustomPaint ? "0 0 0 2px var(--gc-bg) inset" : "none",
                }}
              >
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, color: "#FFFFFF", lineHeight: 1, textShadow: "0 0 2px rgba(0,0,0,0.4)" }}>+</span>
                <input
                  type="color"
                  value={paintHex ?? "#1F6B2E"}
                  onChange={(e) => { setPaintName("Custom"); setPaintHex(e.target.value); }}
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%", padding: 0, border: "none" }}
                />
              </label>
            </div>
          </div>
          <div>
            <p style={labelStyle}>License plate</p>
            <input style={inputStyle} value={form.license_plate} onChange={(e) => set("license_plate", e.target.value)} placeholder="ABC-1234" />
          </div>
          <div>
            <p style={labelStyle}>Mileage</p>
            <input style={inputStyle} type="number" inputMode="numeric" value={form.mileage} onChange={(e) => set("mileage", e.target.value)} placeholder="0" />
          </div>
          <div>
            <p style={labelStyle}>VIN</p>
            <input style={{ ...inputStyle, textTransform: "uppercase", letterSpacing: "0.04em" }} maxLength={17} value={form.vin} onChange={(e) => set("vin", e.target.value.toUpperCase())} placeholder="17-character VIN" />
          </div>

          {err && (
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: "#C0392B", margin: 0 }}>{err}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              marginTop: 6, height: 52, borderRadius: 14, border: "none",
              background: C.green, color: "#fff", cursor: saving ? "default" : "pointer",
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18,
              letterSpacing: "0.04em", opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "SAVING…" : "SAVE CHANGES"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Confirm Remove Vehicle ──────────────────────────── */
function ConfirmDeleteVehicle({
  vehicleLabel, onCancel, onConfirm,
}: {
  vehicleLabel: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, zIndex: 240, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.bg, borderRadius: 18, padding: 24, width: "100%", maxWidth: 380, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(192,57,43,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
          <AlertTriangleIcon size={24} color="#C0392B" strokeWidth={2} />
        </div>
        <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 22, color: C.text, margin: "0 0 8px" }}>
          Remove this vehicle?
        </h3>
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: C.muted, lineHeight: 1.55, margin: "0 0 8px" }}>
          You're about to permanently remove <strong style={{ color: C.text }}>{vehicleLabel}</strong> from your garage.
        </p>
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: "#C0392B", lineHeight: 1.55, margin: "0 0 20px" }}>
          All documents, expenses, and history tied to this vehicle will be lost. This can't be undone.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={busy}
            style={{
              flex: 1, height: 48, borderRadius: 12,
              border: `1.5px solid var(--gc-border)`, background: "none",
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 14,
              color: C.text, cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } }}
            disabled={busy}
            style={{
              flex: 1, height: 48, borderRadius: 12, border: "none",
              background: "#C0392B", color: "#fff", cursor: busy ? "default" : "pointer",
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 14,
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "Removing…" : "Remove vehicle"}
          </button>
        </div>
      </div>
    </div>
  );
}
