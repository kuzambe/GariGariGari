import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";
import { getGuestSession, setGuestSession, clearGuestSession, type GuestSession } from "@/lib/guestSession";
import { useVehicle } from "@/context/VehicleContext";
import { supabase } from "@/lib/supabase";
import { createVehicle } from "@/lib/api/vehicles";

const BASE = import.meta.env.BASE_URL;
const ACCENT = "#1F6B2E";
const TEXT = "#0D1C0E";
const MUTED = "#6B7C6D";
const ERROR = "#C0392B";
const FIELD_BORDER = "#D4DDD5";
const VIN_RE = /[A-HJ-NPR-Z0-9]{17}/i;

type Step = "vin_scan" | "guest_dashboard" | "create_account" | "sign_in";

interface VinData {
  make: string;
  model: string;
  year: string;
  trim: string;
  engine: string;
  fuel_type: string;
  body_style: string;
}

function isValidVin(v: string): boolean {
  const u = v.trim().toUpperCase();
  if (u.length !== 17) return false;
  if (/[IOQ]/.test(u)) return false;
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(u);
}

async function lookupVinNHTSA(vin: string, ms = 8000): Promise<VinData | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(`${BASE}api/vin/${vin}`, { signal: ctrl.signal });
    if (!res.ok) return null;
    const data = (await res.json()) as VinData;
    if (!data.make && !data.model) return null;
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/* ─────────────────────────────────────────────────────────────
 *  WelcomeFlow — owns the entire pre-authentication experience
 * ───────────────────────────────────────────────────────────── */
export default function WelcomeFlow() {
  const [, navigate] = useLocation();
  const { refetch: refetchVehicle } = useVehicle();
  // Always start at vin_scan when arriving at /welcome (signed out flow).
  const [step, setStep] = useState<Step>("vin_scan");

  // Per spec: never let user get stuck. Reset step if guest session is cleared mid-flow.
  useEffect(() => {
    if (step === "guest_dashboard" && !getGuestSession()) {
      setStep("vin_scan");
    }
  }, [step]);

  return (
    <>
      {step === "vin_scan" && (
        <VinScanStep
          onComplete={async (p) => {
            setGuestSession({
              vin: p.vin,
              make: p.make,
              model: p.model,
              year: p.year,
              trim: p.trim,
              engine: p.engine,
              fuel_type: p.fuel_type,
              body_style: p.body_style,
              is_manual_entry: p.isManualEntry,
            });
            await refetchVehicle();
            setStep("guest_dashboard");
          }}
          topLeftAction={{ label: "Skip", onClick: () => setStep("create_account") }}
          topRightAction={{ label: "Sign in", onClick: () => setStep("sign_in") }}
        />
      )}
      {step === "guest_dashboard" && (
        <GuestDashboardStep
          onCreateAccount={() => setStep("create_account")}
          onSignIn={() => setStep("sign_in")}
          onRescan={() => { clearGuestSession(); setStep("vin_scan"); }}
        />
      )}
      {step === "create_account" && (
        <AccountStep
          mode="signup"
          onDone={() => navigate("/dashboard")}
          onBack={() => setStep(getGuestSession() ? "guest_dashboard" : "vin_scan")}
          onSwitch={() => setStep("sign_in")}
        />
      )}
      {step === "sign_in" && (
        <AccountStep
          mode="signin"
          onDone={() => navigate("/dashboard")}
          onBack={() => setStep(getGuestSession() ? "guest_dashboard" : "vin_scan")}
          onSwitch={() => setStep("create_account")}
        />
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
 *  STEP 1: VIN scan — exported so Dashboard "Add Vehicle" can reuse it
 * ───────────────────────────────────────────────────────────── */
export interface VinScanCompletePayload {
  vin: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
  engine: string | null;
  fuel_type: string | null;
  body_style: string | null;
  isManualEntry: boolean;
}

interface CornerAction { label: string; onClick: () => void }

export function VinScanStep({
  onComplete, topLeftAction, topRightAction,
}: {
  onComplete: (payload: VinScanCompletePayload) => Promise<void> | void;
  topLeftAction?: CornerAction;
  topRightAction?: CornerAction;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectedRef = useRef(false);

  const [permissionDenied, setPermissionDenied] = useState(false);
  const [showManualVinInput, setShowManualVinInput] = useState(false);
  const [manualVin, setManualVin] = useState("");
  const [stage, setStage] = useState<"camera" | "lookup" | "manual-vehicle">("camera");
  const [manualVehicle, setManualVehicle] = useState({ make: "", model: "", year: "", trim: "" });
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [vinForLookup, setVinForLookup] = useState<string>("");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const proceedWithVin = useCallback(async (rawVin: string) => {
    const vin = rawVin.toUpperCase();
    if (!isValidVin(vin)) {
      setLookupError("That doesn't look like a valid VIN.");
      return;
    }
    detectedRef.current = true;
    stopCamera();
    setVinForLookup(vin);
    setStage("lookup");
    navigator.vibrate?.(80);
    const data = await lookupVinNHTSA(vin, 8000);
    if (!data) {
      setLookupError("Couldn't identify this VIN");
      setManualVehicle({ make: "", model: "", year: "", trim: "" });
      setStage("manual-vehicle");
      return;
    }
    await onComplete({
      vin,
      make: data.make || null,
      model: data.model || null,
      year: data.year ? parseInt(String(data.year)) || null : null,
      trim: data.trim || null,
      engine: data.engine || null,
      fuel_type: data.fuel_type || null,
      body_style: data.body_style || null,
      isManualEntry: false,
    });
  }, [stopCamera, onComplete]);

  // Start camera + barcode reader
  useEffect(() => {
    if (stage !== "camera" || permissionDenied) return;
    let cancelled = false;
    const hints = new Map<DecodeHintType, unknown>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_39, BarcodeFormat.CODE_128,
      BarcodeFormat.DATA_MATRIX, BarcodeFormat.QR_CODE,
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
          if (m) proceedWithVin(m[0]);
        });
      } catch {
        if (!cancelled) setPermissionDenied(true);
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [stage, permissionDenied, proceedWithVin]);

  // Cleanup on unmount — guarantees camera light goes off when leaving step.
  useEffect(() => () => stopCamera(), [stopCamera]);

  async function handleManualVehicleSave() {
    const make = manualVehicle.make.trim();
    const model = manualVehicle.model.trim();
    if (!make || !model) return;
    await onComplete({
      vin: vinForLookup || null,
      make,
      model,
      year: manualVehicle.year.trim() ? parseInt(manualVehicle.year.trim()) || null : null,
      trim: manualVehicle.trim.trim() || null,
      engine: null,
      fuel_type: null,
      body_style: null,
      isManualEntry: true,
    });
  }

  // ── Loading overlay (NHTSA lookup) ──
  if (stage === "lookup") {
    return (
      <div style={fullDark}>
        <div className="gari-spin" style={{ width: 64, height: 64 }}>
          <img src={`${BASE}gari-icon-new-nobg.png`} alt="Gari" style={{ width: 64, height: 64, objectFit: "contain" }} />
        </div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#FFFFFF", margin: "18px 0 0" }}>
          Looking up your vehicle…
        </p>
      </div>
    );
  }

  // ── NHTSA failed — manual vehicle entry ──
  if (stage === "manual-vehicle") {
    const canSave = manualVehicle.make.trim() && manualVehicle.model.trim();
    return (
      <div style={{ position: "fixed", inset: 0, background: "#FAFAF8", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 16, zIndex: 100, overflowY: "auto" }}>
        <Wordmark dark />
        <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 24, color: TEXT, margin: 0 }}>
          {lookupError || "Add your car details"}
        </h2>
        {vinForLookup && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED, margin: 0, letterSpacing: "0.04em" }}>
            VIN {vinForLookup}
          </p>
        )}
        {(["make", "model", "year", "trim"] as const).map((k) => (
          <input
            key={k}
            type="text"
            placeholder={k === "year" ? "Year (e.g. 2020)" : k === "trim" ? "Trim (optional)" : k === "make" ? "Make (e.g. Toyota)" : "Model (e.g. Camry)"}
            value={manualVehicle[k]}
            onChange={(e) => setManualVehicle((p) => ({ ...p, [k]: e.target.value }))}
            style={whiteInput}
          />
        ))}
        <button onClick={handleManualVehicleSave} disabled={!canSave} style={{ ...primaryBtn, opacity: canSave ? 1 : 0.6 }}>
          CONTINUE
        </button>
        {topLeftAction && (
          <button onClick={topLeftAction.onClick} style={textLink}>{topLeftAction.label}</button>
        )}
      </div>
    );
  }

  // ── Camera permission denied ──
  if (permissionDenied) {
    return (
      <div style={{ ...fullDark, padding: 32, gap: 16 }}>
        <img src={`${BASE}gari-icon-new-nobg.png`} alt="Gari" style={{ height: 56 }} />
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#FFFFFF", textAlign: "center", maxWidth: 280, margin: 0 }}>
          Camera access needed to scan your VIN
        </p>
        <button onClick={() => setShowManualVinInput(true)} style={primaryBtn}>
          ENTER VIN MANUALLY
        </button>
        {topRightAction && (
          <button onClick={topRightAction.onClick} style={{ ...textLink, color: "rgba(255,255,255,0.7)" }}>{topRightAction.label} instead</button>
        )}
        {topLeftAction && (
          <button onClick={topLeftAction.onClick} style={{ ...textLink, color: "rgba(255,255,255,0.55)" }}>{topLeftAction.label}</button>
        )}
        {showManualVinInput && (
          <ManualVinOverlay
            value={manualVin}
            onChange={setManualVin}
            onSubmit={() => proceedWithVin(manualVin)}
            onClose={() => setShowManualVinInput(false)}
            error={lookupError}
          />
        )}
      </div>
    );
  }

  // ── Default: live camera scanning ──
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000", overflow: "hidden", zIndex: 100 }}>
      <video ref={videoRef} playsInline muted autoPlay style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />

      {/* Top center — Gari wordmark, 60px from top */}
      <div style={{ position: "absolute", top: 60, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, pointerEvents: "none", zIndex: 2 }}>
        <img src={`${BASE}gari-icon-new-nobg.png`} alt="" style={{ height: 36 }} />
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 28, color: "#FFFFFF", letterSpacing: "0.04em" }}>GARI</span>
      </div>

      {/* Top left — Skip */}
      {topLeftAction && (
        <button onClick={() => { stopCamera(); topLeftAction.onClick(); }} style={cornerLink("left")}>{topLeftAction.label}</button>
      )}
      {/* Top right — Sign in */}
      {topRightAction && (
        <button onClick={() => { stopCamera(); topRightAction.onClick(); }} style={cornerLink("right")}>{topRightAction.label}</button>
      )}

      {/* Center scanning frame */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 320, maxWidth: "85vw", height: 80, border: "2px solid #FFFFFF", borderRadius: 10, boxSizing: "border-box", overflow: "hidden", pointerEvents: "none" }}>
        {/* Animated green scan line */}
        <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: ACCENT, opacity: 0.8, animation: "gari-vin-scanline 1.5s linear infinite" }} />
        {/* Four corner L-accents */}
        <CornerL pos="tl" />
        <CornerL pos="tr" />
        <CornerL pos="bl" />
        <CornerL pos="br" />
      </div>

      {/* Instructions below frame */}
      <div style={{ position: "absolute", left: 0, right: 0, top: "calc(50% + 70px)", textAlign: "center", padding: "0 24px", pointerEvents: "none" }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.7)", margin: "0 0 6px" }}>
          Point at the VIN sticker on your door frame
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0 }}>
          17-character code · Usually driver's side door jamb
        </p>
      </div>

      {/* Bottom buttons */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "20px 20px 32px", display: "flex", flexDirection: "column", gap: 10, background: "linear-gradient(transparent, rgba(0,0,0,0.55))" }}>
        <button onClick={() => { /* zxing already scanning */ }} style={primaryBtn}>SCAN BARCODE</button>
        <button onClick={() => setShowManualVinInput(true)} style={{ background: "transparent", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: "8px 0" }}>
          Enter VIN manually
        </button>
      </div>

      {showManualVinInput && (
        <ManualVinOverlay
          value={manualVin}
          onChange={setManualVin}
          onSubmit={() => proceedWithVin(manualVin)}
          onClose={() => setShowManualVinInput(false)}
          error={lookupError}
        />
      )}

      <style>{`
        @keyframes gari-vin-scanline {
          0%   { top: 0;     opacity: 0.2; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { top: 76px;  opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}

function CornerL({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const size = 20;
  const thick = 3;
  const offset = -1; // sit just inside the white border
  const top = pos.startsWith("t") ? offset : undefined;
  const bottom = pos.startsWith("b") ? offset : undefined;
  const left = pos.endsWith("l") ? offset : undefined;
  const right = pos.endsWith("r") ? offset : undefined;
  return (
    <>
      {/* horizontal arm */}
      <div style={{ position: "absolute", top, bottom, left, right, width: size, height: thick, background: ACCENT }} />
      {/* vertical arm */}
      <div style={{ position: "absolute", top, bottom, left, right, width: thick, height: size, background: ACCENT }} />
    </>
  );
}

function ManualVinOverlay({
  value, onChange, onSubmit, onClose, error,
}: {
  value: string; onChange: (v: string) => void; onSubmit: () => void; onClose: () => void; error: string | null;
}) {
  const cleaned = value.toUpperCase();
  const valid = isValidVin(cleaned);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#FAFAF8", borderRadius: 16, padding: 24, width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 14 }}>
        <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 22, color: TEXT, margin: 0 }}>Enter your VIN</h3>
        <div style={{ position: "relative" }}>
          <input
            type="text" value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            placeholder="17-character VIN" maxLength={17} autoFocus
            style={{ ...whiteInput, paddingRight: 56, letterSpacing: "0.05em", textTransform: "uppercase", border: `1.5px solid ${valid ? ACCENT : FIELD_BORDER}` }}
          />
          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: cleaned.length === 17 ? ACCENT : MUTED, fontWeight: cleaned.length === 17 ? 600 : 400 }}>
            {cleaned.length}/17
          </span>
        </div>
        {error && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: ERROR, margin: 0 }}>{error}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ ...secondaryBtn, flex: 1 }}>Cancel</button>
          <button onClick={onSubmit} disabled={!valid} style={{ ...primaryBtn, flex: 1, opacity: valid ? 1 : 0.6 }}>CONFIRM</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 *  STEP 2: Guest dashboard
 * ───────────────────────────────────────────────────────────── */
function SculptedCar() {
  return (
    <svg width="280" height="130" viewBox="0 0 300 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="welcomeCarShadow" x="-10%" y="-10%" width="130%" height="180%">
          <feDropShadow dx="0" dy="8" stdDeviation="14" floodColor="#000000" floodOpacity="0.08" />
        </filter>
      </defs>
      <path d="M 14 98 C 6 98 4 88 4 82 C 4 70 14 62 22 56 C 28 42 40 22 66 16 C 84 10 112 8 148 8 C 182 8 212 12 234 24 C 254 34 268 52 278 68 C 286 78 294 88 292 96 C 291 100 287 102 280 102 L 252 102 Q 249 82 232 82 Q 214 82 212 102 L 100 102 Q 97 82 80 82 Q 62 82 60 102 L 14 100 Z"
        fill="#FFFFFF" stroke="#D4DDD5" strokeWidth="1.5" filter="url(#welcomeCarShadow)" />
      <path d="M 74 16 C 96 10 124 8 156 8 C 188 8 216 12 236 24 C 222 32 192 38 156 40 C 118 38 90 32 74 16 Z" fill="#EFF4F0" opacity="0.55" />
      <circle cx="80" cy="112" r="22" fill="#F4F7F2" stroke="#D4DDD5" strokeWidth="1.5" />
      <circle cx="80" cy="112" r="9" fill="#E8F0E9" stroke="#D4DDD5" strokeWidth="1" />
      <circle cx="80" cy="112" r="3" fill="#C8D5C9" />
      <circle cx="232" cy="112" r="22" fill="#F4F7F2" stroke="#D4DDD5" strokeWidth="1.5" />
      <circle cx="232" cy="112" r="9" fill="#E8F0E9" stroke="#D4DDD5" strokeWidth="1" />
      <circle cx="232" cy="112" r="3" fill="#C8D5C9" />
    </svg>
  );
}

function HealthGaugeMini({ pct = 60 }: { pct?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", padding: "0 24px", boxSizing: "border-box" }}>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: MUTED, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>Car Health</p>
      <div style={{ position: "relative", height: 12, borderRadius: 999, background: "#E8F0E9", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: ACCENT, borderRadius: 999, transition: "width 0.4s ease" }} />
        {[20, 40, 60, 80].map((pos) => (
          <div key={pos} style={{ position: "absolute", top: 0, bottom: 0, left: `${pos}%`, width: 2, background: "#FFFFFF", opacity: 0.6 }} />
        ))}
      </div>
    </div>
  );
}

function GuestDashboardStep({
  onCreateAccount, onSignIn, onRescan,
}: {
  onCreateAccount: () => void;
  onSignIn: () => void;
  onRescan: () => void;
}) {
  const guest = getGuestSession();
  if (!guest) return null;
  const yearMakeModel = [guest.year, guest.make, guest.model].filter(Boolean).join(" ") || "Your Car";
  const nickname = `Your ${guest.model || "Car"}`;
  const yearStr = guest.year ? String(guest.year) : "Not set";
  const makeStr = guest.make || "Not set";

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8", display: "flex", flexDirection: "column", padding: "20px 0 32px", boxSizing: "border-box" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 12px" }}>
        <button onClick={onRescan} aria-label="Back" style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase" }}>Guest Garage</span>
        <span style={{ width: 22 }} />
      </div>

      {/* Vehicle name */}
      <div style={{ textAlign: "center", padding: "8px 24px 4px" }}>
        <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 28, color: TEXT, margin: 0 }}>{nickname}</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED, margin: "4px 0 0" }}>{yearMakeModel}</p>
      </div>

      {/* Car SVG */}
      <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 12px" }}>
        <SculptedCar />
      </div>

      {/* Health gauge at 60 */}
      <HealthGaugeMini pct={60} />

      {/* Stat pills */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", padding: "18px 24px 6px" }}>
        <StatPill label="Year" value={yearStr} />
        <StatPill label="Make" value={makeStr} />
        <StatPill label="Mileage" value="Not set" />
      </div>

      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED, textAlign: "center", margin: "12px 24px 0" }}>
        Scan documents and receipts to build your garage.
      </p>

      {/* Save your garage card */}
      <div style={{ background: ACCENT, borderRadius: 16, padding: 20, margin: "20px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 20, color: "#FFFFFF", margin: 0 }}>
          Save your garage
        </h3>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.85)", margin: 0, lineHeight: 1.4 }}>
          Create a free account to keep your vehicle data, documents, and history.
        </p>
        <button onClick={onCreateAccount} style={{ background: "#FFFFFF", color: ACCENT, border: "none", borderRadius: 12, padding: 14, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, cursor: "pointer", marginTop: 4 }}>
          Create Free Account
        </button>
        <button onClick={onSignIn} style={{ background: "none", border: "none", padding: "6px 0", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.65)", cursor: "pointer" }}>
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "#FFFFFF", border: `1px solid ${FIELD_BORDER}`, borderRadius: 14, padding: "8px 14px", minWidth: 80, textAlign: "center" }}>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: MUTED, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
      <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 14, color: TEXT, margin: "2px 0 0" }}>{value}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 *  STEPS 3 & 4: Create account / Sign in
 * ───────────────────────────────────────────────────────────── */
function AccountStep({
  mode, onDone, onBack, onSwitch,
}: {
  mode: "signup" | "signin";
  onDone: () => void;
  onBack: () => void;
  onSwitch: () => void;
}) {
  const [guest, setGuest] = useState<GuestSession | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);
  const [confirmErr, setConfirmErr] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(false);

  useEffect(() => { setGuest(getGuestSession()); }, []);

  const passwordsMatch = !confirm || password === confirm;
  const isSignup = mode === "signup";
  const submitDisabled = isSignup
    ? !email.trim() || password.length < 8 || !passwordsMatch || !confirm
    : !email.trim() || !password;

  async function transferGuest(userId: string, g: GuestSession) {
    const modelLabel = (g.model && g.model.trim()) || "Car";
    try {
      await createVehicle({
        user_id: userId,
        nickname: `Your ${modelLabel}`,
        vin: g.vin ?? undefined,
        make: g.make ?? undefined,
        model: g.model ?? undefined,
        year: g.year ?? undefined,
        trim: g.trim ?? undefined,
        engine: g.engine ?? undefined,
        fuel_type: g.fuel_type ?? undefined,
        body_style: g.body_style ?? undefined,
        mileage_unit: "km",
      });
      clearGuestSession();
    } catch {
      // Per spec: NEVER delete guest session on failure. Leave it for retry.
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setEmailErr(null); setPasswordErr(null); setConfirmErr(null); setFormErr(null);

    if (isSignup) {
      if (password.length < 8) { setPasswordErr("Password must be at least 8 characters."); return; }
      if (password !== confirm) { setConfirmErr("Passwords don't match"); return; }
      setSubmitting(true);
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) {
        setSubmitting(false);
        const msg = error.message.toLowerCase();
        if (msg.includes("already registered") || msg.includes("user already")) {
          setEmailErr("This email is already registered. Sign in instead?");
        } else if (msg.includes("password")) {
          setPasswordErr("Password must be at least 8 characters.");
        } else if (msg.includes("network") || msg.includes("fetch")) {
          setFormErr("Connection failed. Please check your internet and try again.");
        } else { setFormErr(error.message); }
        return;
      }
      const newId = data.user?.id;
      if (newId && guest) await transferGuest(newId, guest);
      setSubmitting(false);
      if (data.session) {
        setToast(true);
        setTimeout(onDone, 2000);
      } else {
        setFormErr("Almost there — check your inbox to confirm your email.");
      }
      return;
    }

    // SIGN IN
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid login") || msg.includes("invalid_credentials") || msg.includes("invalid password")) {
        setPasswordErr("Incorrect password. Please try again.");
      } else if (msg.includes("network") || msg.includes("fetch")) {
        setFormErr("Connection failed. Please check your internet and try again.");
      } else if (msg.includes("email not confirmed")) {
        setFormErr("Please confirm your email first — check your inbox.");
      } else { setFormErr(error.message); }
      return;
    }
    onDone();
  }

  const yearMakeModel = guest ? [guest.year, guest.make, guest.model].filter(Boolean).join(" ") : "";

  return (
    <div className="gari-mount" style={{ minHeight: "100vh", background: "#FAFAF8", padding: "20px 24px 32px", position: "relative", display: "flex", flexDirection: "column" }}>
      {toast && (
        <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: ACCENT, color: "#FFFFFF", padding: "10px 18px", borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 14, zIndex: 300, boxShadow: "0 4px 12px rgba(0,0,0,0.18)" }}>
          Your garage is saved!
        </div>
      )}

      {/* Back arrow top left */}
      <button onClick={onBack} aria-label="Back" style={{ background: "none", border: "none", cursor: "pointer", padding: 6, alignSelf: "flex-start", marginBottom: 8 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Logo */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginBottom: 24 }}>
        <img src={`${BASE}gari-icon-new-nobg.png`} alt="Gari" style={{ height: 40 }} />
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 36, color: TEXT, letterSpacing: "0.03em", lineHeight: 1 }}>GARI</span>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED, margin: "4px 0 0", textAlign: "center" }}>
          {isSignup ? "Create your free account to save your garage." : "Welcome back. Sign in to your garage."}
        </p>
      </div>

      {/* Vehicle summary on signup */}
      {isSignup && guest && (
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED, margin: "0 0 8px" }}>
            We'll save this vehicle to your account:
          </p>
          <div style={{ background: "#F4F7F2", borderRadius: 12, padding: "12px 16px" }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, color: TEXT, margin: 0 }}>
              Your {guest.model || "Car"}
            </p>
            {yearMakeModel && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED, margin: "2px 0 0" }}>{yearMakeModel}</p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" style={whiteInput} />
        {emailErr && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: ERROR, margin: "-6px 0 0" }}>
            {emailErr}{" "}
            {emailErr.includes("registered") && (
              <button type="button" onClick={onSwitch} style={{ background: "none", border: "none", color: ACCENT, cursor: "pointer", padding: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 12, textDecoration: "underline" }}>Sign in</button>
            )}
          </p>
        )}
        <input type="password" placeholder={isSignup ? "Create a password" : "Password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isSignup ? "new-password" : "current-password"} style={whiteInput} />
        {passwordErr && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: ERROR, margin: "-6px 0 0" }}>{passwordErr}</p>}
        {isSignup && (
          <>
            <input type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" style={whiteInput} />
            {(confirmErr || (!passwordsMatch && confirm)) && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: ERROR, margin: "-6px 0 0" }}>{confirmErr ?? "Passwords don't match"}</p>
            )}
          </>
        )}
        {formErr && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: formErr.startsWith("Almost") ? ACCENT : ERROR, margin: "4px 0 0" }}>{formErr}</p>
        )}
        <button type="submit" disabled={submitting || submitDisabled} style={{ ...primaryBtn, marginTop: 8, opacity: (submitting || submitDisabled) ? 0.6 : 1, cursor: (submitting || submitDisabled) ? "default" : "pointer" }}>
          {submitting ? (isSignup ? "CREATING ACCOUNT…" : "SIGNING IN…") : (isSignup ? "CREATE ACCOUNT" : "SIGN IN")}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: 20, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED }}>
        {isSignup ? "Already have an account? " : "Don't have an account? "}
        <button type="button" onClick={onSwitch} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: 0, textDecoration: "underline", textUnderlineOffset: 2 }}>
          {isSignup ? "Sign in" : "Create one"}
        </button>
      </p>
    </div>
  );
}

/* ── Shared bits ──────────────────────────────────────── */
function Wordmark({ dark }: { dark?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <img src={`${BASE}gari-icon-new-nobg.png`} alt="" style={{ height: 32 }} />
      <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 24, color: dark ? TEXT : "#FFFFFF", letterSpacing: "0.04em" }}>GARI</span>
    </div>
  );
}

const fullDark: React.CSSProperties = {
  position: "fixed", inset: 0, background: "#0A0F0B", display: "flex",
  flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 100,
};

const whiteInput: React.CSSProperties = {
  width: "100%", background: "#FFFFFF", border: `1.5px solid ${FIELD_BORDER}`,
  borderRadius: 12, padding: "14px 16px", fontFamily: "'DM Sans', sans-serif",
  fontSize: 15, color: TEXT, outline: "none", boxShadow: "none", boxSizing: "border-box",
};

const primaryBtn: React.CSSProperties = {
  background: ACCENT, color: "#FFFFFF", border: "none", borderRadius: 14,
  height: 54, padding: "0 28px",
  fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18,
  cursor: "pointer", letterSpacing: "0.04em",
};

const secondaryBtn: React.CSSProperties = {
  background: "transparent", color: MUTED, border: `1.5px solid ${FIELD_BORDER}`,
  borderRadius: 12, padding: "12px 16px", fontFamily: "'DM Sans', sans-serif",
  fontSize: 15, cursor: "pointer",
};

const textLink: React.CSSProperties = {
  background: "none", border: "none", fontFamily: "'DM Sans', sans-serif",
  fontSize: 13, color: MUTED, cursor: "pointer", padding: "8px 0",
};

function cornerLink(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute", top: 28, [side]: 18, background: "none", border: "none",
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.5)",
    cursor: "pointer", padding: 6, zIndex: 3,
  } as React.CSSProperties;
}
