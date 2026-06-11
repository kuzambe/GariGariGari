import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";
import { AddDocumentSheet } from "@/components/documents/AddDocumentSheet";
import { ScanReceiptFlow } from "@/components/finance/ScanReceiptFlow";
import { uploadDocument } from "@/lib/api/documents";
import { addExpense } from "@/lib/api/expenses";
import { createVehicle, updateVehicle } from "@/lib/api/vehicles";
import { setGuestSession } from "@/lib/guestSession";
import type { ConfirmedDocument } from "@/components/documents/ParsedDocumentSheet";

const ACCENT = "#1F6B2E";
const TEXT = "#0D1C0E";
const MUTED = "#6B7C6D";
const BORDER = "#E8E6E0";
const BASE = import.meta.env.BASE_URL;

type Mode = null | "menu" | "document" | "vin" | "receipt";

interface Props {
  vehicleId: string | null;
  userId: string;
  isGuest: boolean;
  hidden?: boolean;
  onDocumentSaved: () => void;
  onExpenseSaved: () => void;
  onVehicleSaved: () => void;
}

function ScanFrameIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 8 4 4 8 4" />
      <polyline points="16 4 20 4 20 8" />
      <polyline points="20 16 20 20 16 20" />
      <polyline points="8 20 4 20 4 16" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="7" y1="14" x2="17" y2="14" />
    </svg>
  );
}

function BarcodeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="4" y2="18" />
      <line x1="7" y1="6" x2="7" y2="18" />
      <line x1="10" y1="6" x2="10" y2="18" />
      <line x1="13" y1="6" x2="13" y2="18" />
      <line x1="16" y1="6" x2="16" y2="18" />
      <line x1="19" y1="6" x2="19" y2="18" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3v18l3-2 3 2 3-2 3 2 3-2V3z" />
      <path d="M12 8v8" />
      <path d="M14 10h-3a1.5 1.5 0 0 0 0 3h2a1.5 1.5 0 0 1 0 3h-3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

/* ── Toast ─────────────────────────────────────────────────── */
function Toast({ text, color, onDone }: { text: string; color: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: color,
        color: "#FFFFFF",
        padding: "10px 18px",
        borderRadius: 12,
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: 14,
        zIndex: 320,
        boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
      }}
    >
      {text}
    </div>
  );
}

/* ── Inline VIN scan modal ─────────────────────────────────── */
const VIN_RE = /[A-HJ-NPR-Z0-9]{17}/i;
function isValidVin(v: string): boolean {
  const u = v.trim().toUpperCase();
  return u.length === 17 && !/[IOQ]/.test(u) && /^[A-HJ-NPR-Z0-9]{17}$/.test(u);
}

interface VinData {
  make: string;
  model: string;
  year: string;
  trim: string;
  engine: string;
  fuel_type: string;
  body_style: string;
}

function VinScanModal({
  vehicleId,
  userId,
  isGuest,
  onClose,
  onSaved,
}: {
  vehicleId: string | null;
  userId: string;
  isGuest: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectedRef = useRef(false);

  const [stage, setStage] = useState<"camera" | "lookup" | "result" | "denied" | "manual-entry">("camera");
  const [showManualVinInput, setShowManualVinInput] = useState(false);
  const [vin, setVin] = useState("");
  const [manualVin, setManualVin] = useState("");
  const [vinData, setVinData] = useState<VinData | null>(null);
  const [vinErr, setVinErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [manualVehicle, setManualVehicle] = useState({ make: "", model: "", year: "", trim: "" });

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const lookupVin = useCallback(async (rawVin: string) => {
    const v = rawVin.toUpperCase();
    if (!isValidVin(v)) {
      setVinErr("That doesn't look like a valid VIN.");
      return;
    }
    detectedRef.current = true;
    stopCamera();
    setVin(v);
    setStage("lookup");
    navigator.vibrate?.(80);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(`${BASE}api/vin/${v}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error("not ok");
      const data = (await res.json()) as VinData;
      setVinData(data);
      setStage("result");
    } catch {
      setVinErr("Vehicle not found in database");
      setStage("manual-entry");
    } finally {
      clearTimeout(t);
    }
  }, [stopCamera]);

  // Start camera
  useEffect(() => {
    if (stage !== "camera") return;
    let cancelled = false;

    const hints = new Map<DecodeHintType, unknown>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_128,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.QR_CODE,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserMultiFormatReader(hints);

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        await reader.decodeFromStream(stream, videoRef.current ?? undefined, (result) => {
          if (!result || cancelled || detectedRef.current) return;
          const raw = result.getText().replace(/[^A-HJ-NPR-Z0-9]/gi, "");
          const m = VIN_RE.exec(raw);
          if (m) lookupVin(m[0]);
        });
      } catch {
        if (!cancelled) setStage("denied");
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [stage, lookupVin]);

  async function commitVehicle(replace: boolean) {
    setSaving(true);
    const make = vinData?.make ?? manualVehicle.make;
    const model = vinData?.model ?? manualVehicle.model;
    const year = vinData?.year ? parseInt(String(vinData.year)) || undefined : (manualVehicle.year ? parseInt(manualVehicle.year) || undefined : undefined);
    try {
      if (isGuest) {
        setGuestSession({
          vin,
          make: make || null,
          model: model || null,
          year: year ?? null,
          trim: vinData?.trim || manualVehicle.trim || null,
          engine: vinData?.engine || null,
          fuel_type: vinData?.fuel_type || null,
          body_style: vinData?.body_style || null,
        });
      } else if (replace && vehicleId) {
        await updateVehicle(vehicleId, {
          vin,
          make: make || null,
          model: model || null,
          year: year ?? null,
          trim: vinData?.trim || manualVehicle.trim || null,
          engine: vinData?.engine || null,
          fuel_type: vinData?.fuel_type || null,
          body_style: vinData?.body_style || null,
        });
      } else {
        await createVehicle({
          user_id: userId,
          nickname: `Your ${model || "Car"}`,
          vin,
          make: make || undefined,
          model: model || undefined,
          year,
          trim: vinData?.trim || manualVehicle.trim || undefined,
          engine: vinData?.engine || undefined,
          fuel_type: vinData?.fuel_type || undefined,
          body_style: vinData?.body_style || undefined,
          mileage_unit: "km",
        });
      }
      onSaved();
      onClose();
    } catch {
      setVinErr("Couldn't save the vehicle. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Render lookup stage ──
  if (stage === "lookup") {
    return (
      <div style={overlayStyles.fullDark}>
        <div className="gari-spin" style={{ width: 56, height: 56 }}>
          <img src={`${BASE}gari-icon-new-nobg.png`} alt="Gari" style={{ width: 56, height: 56 }} />
        </div>
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: "#FFFFFF", marginTop: 14 }}>
          Looking up vehicle…
        </p>
      </div>
    );
  }

  // ── Render result confirmation ──
  if (stage === "result" && vinData) {
    const yearMakeModel = [vinData.year, vinData.make, vinData.model].filter(Boolean).join(" ");
    const hasExistingVehicle = !!vehicleId && !isGuest;
    return (
      <div style={overlayStyles.modalDim}>
        <div style={overlayStyles.card}>
          <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 22, color: TEXT, margin: 0 }}>
            We found your car
          </h3>
          <div style={{ background: "#F4F7F2", borderRadius: 12, padding: 14 }}>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 15, color: TEXT, margin: 0 }}>
              {yearMakeModel || "Vehicle"}
            </p>
            {vinData.trim && (
              <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: MUTED, margin: "2px 0 0" }}>
                {vinData.trim}
              </p>
            )}
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: MUTED, margin: "6px 0 0", letterSpacing: "0.04em" }}>
              VIN {vin}
            </p>
          </div>
          {hasExistingVehicle ? (
            <>
              <button onClick={() => commitVehicle(false)} disabled={saving} style={btnStyles.primary}>
                {saving ? "SAVING…" : "ADD AS NEW VEHICLE"}
              </button>
              <button onClick={() => commitVehicle(true)} disabled={saving} style={btnStyles.secondary}>
                Update current vehicle VIN
              </button>
            </>
          ) : (
            <button onClick={() => commitVehicle(false)} disabled={saving} style={btnStyles.primary}>
              {saving ? "SAVING…" : "ADD TO MY GARAGE"}
            </button>
          )}
          {isGuest && (
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: MUTED, margin: 0, textAlign: "center" }}>
              This will be saved to your account when you sign up.
            </p>
          )}
          {vinErr && (
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: "#C0392B", margin: 0 }}>{vinErr}</p>
          )}
          <button onClick={onClose} style={btnStyles.ghost}>Cancel</button>
        </div>
      </div>
    );
  }

  // ── Render manual vehicle entry (NHTSA failed) ──
  if (stage === "manual-entry") {
    const canSave = manualVehicle.make.trim() && manualVehicle.model.trim();
    return (
      <div style={overlayStyles.modalDim}>
        <div style={overlayStyles.card}>
          <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 22, color: TEXT, margin: 0 }}>
            Vehicle not found in database
          </h3>
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: MUTED, margin: 0 }}>
            Add the basics manually — VIN <strong>{vin || "—"}</strong>
          </p>
          {(["make", "model", "year", "trim"] as const).map((k) => (
            <input
              key={k}
              type="text"
              placeholder={k === "year" ? "Year (e.g. 2020)" : k === "trim" ? "Trim (optional)" : k === "make" ? "Make (e.g. Toyota)" : "Model (e.g. Camry)"}
              value={manualVehicle[k]}
              onChange={(e) => setManualVehicle((p) => ({ ...p, [k]: e.target.value }))}
              style={inputStyle}
            />
          ))}
          <button onClick={() => commitVehicle(false)} disabled={!canSave || saving} style={{ ...btnStyles.primary, opacity: !canSave || saving ? 0.6 : 1 }}>
            {saving ? "SAVING…" : "ADD VEHICLE"}
          </button>
          <button onClick={onClose} style={btnStyles.ghost}>Cancel</button>
        </div>
      </div>
    );
  }

  // ── Render denied state ──
  if (stage === "denied") {
    return (
      <div style={overlayStyles.modalDim}>
        <div style={overlayStyles.card}>
          <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 20, color: TEXT, margin: 0 }}>
            Camera access needed
          </h3>
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: MUTED, margin: 0 }}>
            Enable the camera to scan your VIN, or enter it manually below.
          </p>
          <button onClick={() => setShowManualVinInput(true)} style={btnStyles.primary}>
            ENTER VIN MANUALLY
          </button>
          <button onClick={onClose} style={btnStyles.ghost}>Cancel</button>
        </div>
        {showManualVinInput && (
          <ManualVinOverlay
            value={manualVin}
            onChange={setManualVin}
            onSubmit={() => lookupVin(manualVin)}
            onClose={() => setShowManualVinInput(false)}
            error={vinErr}
          />
        )}
      </div>
    );
  }

  // ── Render camera scanning (default) ──
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 250 }}>
      <video ref={videoRef} playsInline muted autoPlay style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <div style={{ position: "relative", width: 320, maxWidth: "85vw", height: 80, borderRadius: 10, boxShadow: "0 0 0 9999px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,255,255,0.4) inset", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: ACCENT, boxShadow: `0 0 6px ${ACCENT}cc`, animation: "gari-vin-scan 1.5s ease-in-out infinite" }} />
        </div>
      </div>

      {/* Close X */}
      <button onClick={() => { stopCamera(); onClose(); }} style={{ position: "absolute", top: 16, left: 16, width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 2 }}>
        <CloseIcon />
      </button>

      {/* Bottom hint */}
      <p style={{ position: "absolute", left: 0, right: 0, bottom: 138, textAlign: "center", padding: "0 24px", fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.6)", margin: 0, pointerEvents: "none" }}>
        Point at VIN barcode on door frame or dashboard
      </p>

      {/* Bottom buttons */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "20px 20px 32px", display: "flex", flexDirection: "column", gap: 10, background: "linear-gradient(transparent, rgba(0,0,0,0.55))" }}>
        <button onClick={() => { /* already scanning */ }} style={{ background: "#FFFFFF", color: ACCENT, border: "none", borderRadius: 12, height: 50, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, cursor: "pointer", letterSpacing: "0.04em" }}>
          SCAN BARCODE
        </button>
        <button onClick={() => setShowManualVinInput(true)} style={{ background: "none", border: "none", fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.6)", cursor: "pointer", padding: "6px 0" }}>
          Enter manually
        </button>
      </div>

      {showManualVinInput && (
        <ManualVinOverlay
          value={manualVin}
          onChange={setManualVin}
          onSubmit={() => lookupVin(manualVin)}
          onClose={() => setShowManualVinInput(false)}
          error={vinErr}
        />
      )}
    </div>
  );
}

function ManualVinOverlay({
  value, onChange, onSubmit, onClose, error,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  error: string | null;
}) {
  const cleaned = value.toUpperCase();
  const valid = isValidVin(cleaned);
  return (
    <div style={overlayStyles.modalDim} onClick={onClose}>
      <div style={overlayStyles.card} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 22, color: TEXT, margin: 0 }}>
          Enter your VIN
        </h3>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder="17-character VIN"
          maxLength={17}
          autoFocus
          style={{ ...inputStyle, letterSpacing: "0.05em", textTransform: "uppercase" }}
        />
        {error && <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: "#C0392B", margin: 0 }}>{error}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ ...btnStyles.ghost, flex: 1 }}>Cancel</button>
          <button onClick={onSubmit} disabled={!valid} style={{ ...btnStyles.primary, flex: 1, opacity: valid ? 1 : 0.6 }}>
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyles = {
  fullDark: {
    position: "fixed", inset: 0, background: "#0A0F0B", zIndex: 250,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  } as React.CSSProperties,
  modalDim: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 260,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
  } as React.CSSProperties,
  card: {
    background: "#FAFAF8", borderRadius: 16, padding: 24, width: "100%", maxWidth: 380,
    display: "flex", flexDirection: "column", gap: 12,
  } as React.CSSProperties,
};

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#FFFFFF", border: "1.5px solid #D4DDD5", borderRadius: 12,
  padding: "12px 16px", fontFamily: "'Rajdhani', sans-serif", fontSize: 15, color: TEXT,
  outline: "none", boxShadow: "none", boxSizing: "border-box",
};

const btnStyles = {
  primary: {
    background: ACCENT, color: "#FFFFFF", border: "none", borderRadius: 12,
    padding: "13px 16px", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16,
    cursor: "pointer", letterSpacing: "0.04em",
  } as React.CSSProperties,
  secondary: {
    background: "transparent", color: ACCENT, border: `1.5px solid ${ACCENT}`, borderRadius: 12,
    padding: "12px 16px", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 14,
    cursor: "pointer",
  } as React.CSSProperties,
  ghost: {
    background: "transparent", color: MUTED, border: "none",
    padding: "10px 16px", fontFamily: "'Rajdhani', sans-serif", fontSize: 14,
    cursor: "pointer",
  } as React.CSSProperties,
};

/* ── Floating button + options sheet ───────────────────────── */
export default function FloatingScanButton({
  vehicleId, userId, isGuest, hidden,
  onDocumentSaved, onExpenseSaved, onVehicleSaved,
}: Props) {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<Mode>(null);
  const [pressed, setPressed] = useState(false);
  const [toast, setToast] = useState<{ text: string; color: string } | null>(null);

  function close() { setMode(null); }

  async function handleDocumentConfirmed(file: File, parsed?: ConfirmedDocument) {
    if (isGuest) {
      setMode(null);
      setToast({ text: "Sign up to save documents to your garage", color: ACCENT });
      setTimeout(() => navigate("/auth"), 1100);
      return;
    }
    if (!vehicleId) {
      setMode(null);
      setToast({ text: "Add a vehicle before saving documents", color: "#C0392B" });
      return;
    }
    let storageType = "other";
    if (parsed) {
      if (parsed.type === "mechanic_invoice" || parsed.type === "receipt") storageType = "service";
      else if (parsed.type === "insurance") storageType = "insurance";
      else if (parsed.type === "registration") storageType = "registration";
    }
    try {
      await uploadDocument(file, userId, vehicleId, storageType);
      // Apply parsed actions: create expense for mechanic_invoice / receipt with amount
      let extras = 0;
      if (parsed && !parsed.skipActions && (parsed.type === "mechanic_invoice" || parsed.type === "receipt")) {
        const totalRaw = parsed.fields.total ?? parsed.fields.amount;
        const amount = totalRaw ? parseFloat(String(totalRaw).replace(/[^0-9.]/g, "")) : NaN;
        if (!Number.isNaN(amount) && amount > 0) {
          try {
            await addExpense({
              user_id: userId,
              vehicle_id: vehicleId,
              type: parsed.type === "mechanic_invoice" ? "maintenance" : (parsed.fields.category || "other").toLowerCase(),
              amount,
              description: parsed.fields.shopName || parsed.fields.merchant || undefined,
            });
            extras++;
            onExpenseSaved();
          } catch { /* ignore */ }
        }
      }
      onDocumentSaved();
      setMode(null);
      const docLabel = parsed?.type ? parsed.type.replace(/_/g, " ") : "Document";
      const niceLabel = docLabel.charAt(0).toUpperCase() + docLabel.slice(1);
      setToast({
        text: extras > 0 ? `${niceLabel} saved · ${extras} action taken` : `${niceLabel} saved`,
        color: ACCENT,
      });
    } catch (err) {
      setMode(null);
      const msg = err instanceof Error ? err.message : "Upload failed";
      setToast({ text: msg, color: "#C0392B" });
    }
  }

  function handleReceiptSaved() {
    onExpenseSaved();
    setMode(null);
    setToast({ text: "Receipt saved", color: ACCENT });
  }

  return (
    <>
      {/* Floating button */}
      {!hidden && mode === null && (
        <button
          aria-label="Quick scan"
          onClick={() => setMode("menu")}
          onTouchStart={() => setPressed(true)}
          onTouchEnd={() => setPressed(false)}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          onMouseLeave={() => setPressed(false)}
          style={{
            position: "fixed",
            bottom: 88,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: ACCENT,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 150,
            transform: pressed ? "scale(0.92)" : "scale(1)",
            transition: "transform 0.1s ease",
            animation: "gari-fab-breathe 2s ease-in-out infinite, gari-fab-rise 0.4s 0.6s both",
          }}
        >
          <ScanFrameIcon />
        </button>
      )}

      {/* Options sheet */}
      {mode === "menu" && (
        <>
          <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 180 }} />
          <div
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              background: "#FFFFFF",
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              maxHeight: "70vh",
              zIndex: 190,
              display: "flex",
              flexDirection: "column",
              animation: "gari-sheet-up 0.25s cubic-bezier(0.22, 1, 0.36, 1) both",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 6px" }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: "#D4DDD5" }} />
            </div>
            <ScanRow
              icon={<DocIcon />}
              title="Smart Document Scan"
              subtitle="Invoices, insurance, receipts, registration — we'll sort it automatically"
              onClick={() => setMode("document")}
              borderBottom
            />
            <ScanRow
              icon={<BarcodeIcon />}
              title="Scan VIN"
              subtitle="Add a new vehicle or look up any car instantly"
              onClick={() => setMode("vin")}
              borderBottom
            />
            <ScanRow
              icon={<ReceiptIcon />}
              title="Scan Receipt"
              subtitle="Log fuel and maintenance spending instantly"
              onClick={() => setMode("receipt")}
            />
            <button
              onClick={close}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "16px 0",
                fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: MUTED,
                textAlign: "center",
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {/* Document scan flow — reuses AddDocumentSheet */}
      {mode === "document" && (
        <AddDocumentSheet
          categoryLabel="Smart Scan"
          enableParser
          onClose={close}
          onFileSelected={handleDocumentConfirmed}
          onError={(msg) => { close(); setToast({ text: msg, color: "#C0392B" }); }}
        />
      )}

      {/* VIN scan flow */}
      {mode === "vin" && (
        <VinScanModal
          vehicleId={vehicleId}
          userId={userId}
          isGuest={isGuest}
          onClose={close}
          onSaved={() => {
            onVehicleSaved();
            setToast({ text: "Vehicle saved", color: ACCENT });
          }}
        />
      )}

      {/* Receipt scan flow */}
      {mode === "receipt" && (
        isGuest || !vehicleId ? (
          <div style={overlayStyles.modalDim}>
            <div style={overlayStyles.card}>
              <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 22, color: TEXT, margin: 0 }}>
                {isGuest ? "Sign up to save receipts" : "Add a vehicle first"}
              </h3>
              <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: MUTED, margin: 0 }}>
                {isGuest
                  ? "Create a free account so we can keep your fuel and maintenance receipts in your garage."
                  : "Save your vehicle before logging receipts."}
              </p>
              {isGuest ? (
                <button onClick={() => { close(); navigate("/auth"); }} style={btnStyles.primary}>
                  SIGN UP
                </button>
              ) : null}
              <button onClick={close} style={btnStyles.ghost}>Cancel</button>
            </div>
          </div>
        ) : (
          <ScanReceiptFlow
            userId={userId}
            vehicleId={vehicleId}
            onClose={close}
            onSaved={handleReceiptSaved}
          />
        )
      )}

      {/* Toast */}
      {toast && <Toast text={toast.text} color={toast.color} onDone={() => setToast(null)} />}

      {/* Inline keyframes */}
      <style>{`
        @keyframes gari-vin-scan {
          0%   { top: 0;     opacity: 0.2; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { top: 100%;  opacity: 0.2; }
        }
        @keyframes gari-fab-breathe {
          0%, 100% { box-shadow: 0 4px 20px rgba(31,107,46,0.35); }
          50%      { box-shadow: 0 4px 28px rgba(31,107,46,0.55); }
        }
        @keyframes gari-fab-rise {
          from { transform: translateY(80px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes gari-sheet-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0);    }
        }
      `}</style>
    </>
  );
}

function ScanRow({
  icon, title, subtitle, onClick, borderBottom,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  borderBottom?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        height: 72, padding: "0 20px",
        background: "none", border: "none", cursor: "pointer",
        borderBottom: borderBottom ? `1px solid ${BORDER}` : "none",
        textAlign: "left", width: "100%",
      }}
    >
      <div style={{ flexShrink: 0, width: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, color: TEXT, margin: 0, lineHeight: 1.1 }}>
          {title}
        </p>
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: MUTED, margin: "3px 0 0", lineHeight: 1.3 }}>
          {subtitle}
        </p>
      </div>
    </button>
  );
}
