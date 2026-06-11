import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useVehicle } from "@/context/VehicleContext";
import { createVehicle } from "@/lib/api/vehicles";
import { GarageIcon } from "@/components/ui/GarageIcon";
import { AmberButton } from "@/components/ui/AmberButton";
import { ZapIcon, CheckIcon, CameraIcon, KeyboardIcon, PencilIcon } from "@/components/ui/icons";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";
import { createWorker } from "tesseract.js";

/* ── Shared input style ─────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#fff",
  border: "1.5px solid #E0DED8",
  borderRadius: 12,
  padding: "14px 16px",
  fontFamily: "'Rajdhani', sans-serif",
  fontSize: 15,
  color: "#1A1A1A",
  outline: "none",
  transition: "border-color 0.15s",
  boxSizing: "border-box",
};

function GariInput({
  type = "text",
  placeholder,
  value,
  onChange,
  maxLength,
}: {
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      maxLength={maxLength}
      style={{
        ...inputStyle,
        borderColor: focused ? "#EF9F27" : "#E0DED8",
        boxShadow: focused ? "0 0 0 3px rgba(239,159,39,0.12)" : "none",
      }}
    />
  );
}

function ProgressDots({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: step >= s ? "#EF9F27" : "#E0DED8",
            transition: "background 0.2s",
          }}
        />
      ))}
    </div>
  );
}

/* ── Nickname input with inline arrow ───────────────────────── */

function NicknameInput({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const active = value.trim().length > 0;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        border: `1.5px solid ${focused ? "#EF9F27" : "#E0DED8"}`,
        borderRadius: 12,
        boxShadow: focused ? "0 0 0 3px rgba(239,159,39,0.12)" : "none",
        background: "#fff",
        transition: "border-color 0.15s, box-shadow 0.15s",
        overflow: "hidden",
      }}
    >
      <input
        type="text"
        placeholder="Blue Thunder, Dad's SUV..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }}
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          padding: "14px 16px",
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 15,
          color: "#1A1A1A",
          minWidth: 0,
        }}
      />
      {/* Enter arrow button */}
      <button
        onMouseDown={(e) => e.preventDefault()} // keep input focused
        onClick={onSubmit}
        disabled={!active}
        style={{
          flexShrink: 0,
          width: 44,
          height: 44,
          margin: "0 6px 0 0",
          borderRadius: 10,
          border: "none",
          background: active ? "#EF9F27" : "#F0EFE9",
          color: active ? "#fff" : "#CCC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: active ? "pointer" : "default",
          transition: "background 0.15s, color 0.15s",
          fontSize: 18,
        }}
        aria-label="Continue"
      >
        →
      </button>
    </div>
  );
}

/* ── VIN camera scanner ─────────────────────────────────────── */

const VIN_RE = /[A-HJ-NPR-Z0-9]{17}/i;

function VinScanner({ onDetected }: { onDetected: (vin: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const detectedRef = useRef(false);

  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [cameraErr, setCameraErr] = useState("");
  const [status, setStatus] = useState<"scanning" | "found" | "ocr">("scanning");
  const [foundVin, setFoundVin] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);

  const handleFound = useCallback(
    (vin: string) => {
      if (detectedRef.current) return;
      detectedRef.current = true;
      const upper = vin.toUpperCase();
      setFoundVin(upper);
      setStatus("found");
      navigator.vibrate?.(200);
      onDetected(upper);
    },
    [onDetected]
  );

  useEffect(() => {
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
    readerRef.current = reader;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;

        const track = stream.getVideoTracks()[0];
        const caps = track.getCapabilities?.() as Record<string, unknown>;
        if (caps?.torch) setTorchSupported(true);

        await reader.decodeFromStream(stream, videoRef.current ?? undefined, (result) => {
          if (!result || cancelled || detectedRef.current) return;
          const raw = result.getText().replace(/[^A-HJ-NPR-Z0-9]/gi, "");
          const match = VIN_RE.exec(raw);
          if (match) handleFound(match[0]);
        });
      } catch {
        if (!cancelled) setCameraErr("Camera access denied. Use 'Type' or 'Manual' mode instead.");
      }
    })();

    return () => {
      cancelled = true;
      // Stop camera tracks — this naturally ends decoding
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [handleFound]);

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch { /* not writable */ }
  }

  async function captureAndOcr() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    setOcrLoading(true);
    setStatus("ocr");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    try {
      const worker = await createWorker("eng");
      await worker.setParameters({ tessedit_char_whitelist: "ABCDEFGHJKLMNPRSTUVWXYZ0123456789" });
      const { data } = await worker.recognize(canvas);
      await worker.terminate();
      const text = data.text.replace(/[^A-HJ-NPR-Z0-9]/gi, "");
      const match = VIN_RE.exec(text);
      if (match) handleFound(match[0]);
      else { setStatus("scanning"); setOcrLoading(false); }
    } catch {
      setStatus("scanning");
      setOcrLoading(false);
    }
  }

  if (cameraErr) {
    return (
      <div style={{ background: "#FFF3F3", borderRadius: 12, padding: 16, fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: "#E24B4A", textAlign: "center" }}>
        {cameraErr}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "#111", aspectRatio: "4/3" }}>
        <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "25%", left: "8%", right: "8%", bottom: "25%", border: "2px solid rgba(239,159,39,0.9)", borderRadius: 8, boxShadow: "0 0 0 1000px rgba(0,0,0,0.45)" }} />
          {[
            { top: "25%", left: "8%", borderTop: "3px solid #EF9F27", borderLeft: "3px solid #EF9F27", borderRadius: "4px 0 0 0" },
            { top: "25%", right: "8%", borderTop: "3px solid #EF9F27", borderRight: "3px solid #EF9F27", borderRadius: "0 4px 0 0" },
            { bottom: "25%", left: "8%", borderBottom: "3px solid #EF9F27", borderLeft: "3px solid #EF9F27", borderRadius: "0 0 0 4px" },
            { bottom: "25%", right: "8%", borderBottom: "3px solid #EF9F27", borderRight: "3px solid #EF9F27", borderRadius: "0 0 4px 0" },
          ].map((s, i) => (
            <div key={i} style={{ position: "absolute", width: 20, height: 20, ...s }} />
          ))}
        </div>

        {torchSupported && (
          <button
            onClick={toggleTorch}
            style={{ position: "absolute", top: 12, right: 12, width: 44, height: 44, borderRadius: "50%", background: torchOn ? "#EF9F27" : "rgba(0,0,0,0.55)", border: "1.5px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 2 }}
          >
            <ZapIcon size={20} color="#FFFFFF" strokeWidth={2} />
          </button>
        )}

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 16px", background: "linear-gradient(transparent, rgba(0,0,0,0.6))", fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: status === "found" ? "#EF9F27" : "rgba(255,255,255,0.8)", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {status === "found" ? (
            <>
              <CheckIcon size={14} color="#EF9F27" strokeWidth={2.2} />
              <span>{foundVin}</span>
            </>
          ) : status === "ocr" ? "Reading text…" : "Aim the barcode or VIN label at the box"}
        </div>
      </div>

      {status === "scanning" && !ocrLoading && (
        <button onClick={captureAndOcr} style={{ background: "transparent", border: "1.5px solid #E0DED8", borderRadius: 12, padding: "11px 0", fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: "#888", cursor: "pointer" }}>
          No barcode? Capture &amp; read text
        </button>
      )}
      {ocrLoading && (
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: "#888", textAlign: "center", margin: 0 }}>
          Reading VIN from image…
        </p>
      )}
    </div>
  );
}

/* ── Types ───────────────────────────────────────────────────── */

interface VinData {
  make: string;
  model: string;
  year: string;
  trim: string;
  engine: string;
  fuel_type: string;
  body_style: string;
}

type VinMode = "type" | "scan" | "manual";

interface VehicleSetupProps {
  onSuccess?: (newVehicle: import("@/lib/api/vehicles").Vehicle) => void;
  onCancel?: () => void;
}

/* ── Main component ──────────────────────────────────────────── */

export default function VehicleSetup({ onSuccess, onCancel }: VehicleSetupProps = {}) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { refetch } = useVehicle();

  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState("");

  const [vinMode, setVinMode] = useState<VinMode>("type");
  const [vin, setVin] = useState("");
  const [vinData, setVinData] = useState<VinData | null>(null);
  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState("");
  const [manual, setManual] = useState({ make: "", model: "", year: "", trim: "" });

  const [mileage, setMileage] = useState("");
  const [plate, setPlate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

  async function lookupVin() {
    const cleaned = vin.trim().toUpperCase();
    if (cleaned.length !== 17) { setVinError("VIN must be exactly 17 characters."); return; }
    if (/[IOQ]/i.test(cleaned)) { setVinError("VIN cannot contain the letters I, O, or Q."); return; }
    if (!VIN_REGEX.test(cleaned)) { setVinError("Invalid VIN format."); return; }
    setVinError("");
    setVinLoading(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/vin/${cleaned}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setVinError(body.error ?? "Could not look up VIN.");
        setVinMode("manual");
        return;
      }
      setVinData(await res.json());
    } catch {
      setVinError("Could not reach VIN service. Enter manually.");
      setVinMode("manual");
    } finally {
      setVinLoading(false);
    }
  }

  function handleScanDetected(scannedVin: string) {
    setVin(scannedVin);
    setVinError("");
    (async () => {
      setVinLoading(true);
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}api/vin/${scannedVin}`);
        if (res.ok) setVinData(await res.json());
      } catch { /* ignore */ }
      finally { setVinLoading(false); }
    })();
  }

  async function handleFinish() {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      const carData = vinData ?? (vinMode === "manual"
        ? { make: manual.make, model: manual.model, year: manual.year, trim: manual.trim, engine: "", fuel_type: "", body_style: "" }
        : { make: "", model: "", year: "", trim: "", engine: "", fuel_type: "", body_style: "" });

      const created = await createVehicle({
        user_id: user.id,
        nickname,
        vin: vin.trim().toUpperCase() || undefined,
        make: carData.make || undefined,
        model: carData.model || undefined,
        year: carData.year ? parseInt(String(carData.year)) : undefined,
        trim: carData.trim || undefined,
        engine: carData.engine || undefined,
        fuel_type: carData.fuel_type || undefined,
        body_style: carData.body_style || undefined,
        mileage: mileage ? parseInt(mileage) : undefined,
        license_plate: plate || undefined,
        mileage_unit: "km",
      });
      await refetch();
      if (onSuccess) onSuccess(created);
      else navigate("/dashboard");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err
        ? String((err as { message: string }).message)
        : typeof err === "string" ? err : "Failed to save vehicle. Please try again.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  /* ─────────────────────────────────────────────────────────── */
  /* Layout: fixed-height shell so the button is ALWAYS visible  */
  /* even when the mobile keyboard is open.                      */
  /*   • outer div  → 100dvh (shrinks with keyboard)            */
  /*   • header     → brand + back + dots, never scrolls        */
  /*   • content    → flex:1, overflowY:auto, scrolls           */
  /*   • footer     → pinned Next/Finish button, never scrolls  */
  /* ─────────────────────────────────────────────────────────── */

  /* Per-step derived values */
  const canGoNext1 = nickname.trim().length > 0;

  const footer1 = (
    <AmberButton fullWidth onClick={() => setStep(2)} disabled={!canGoNext1}>
      NEXT →
    </AmberButton>
  );

  const footer2 = (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <AmberButton fullWidth onClick={() => setStep(3)}>
        {vinData ? "CONFIRM & NEXT →" : "NEXT →"}
      </AmberButton>
      {!vinData && (
        <p style={{ textAlign: "center", fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: "#BBB", margin: 0, cursor: "pointer" }}
          onClick={() => setStep(3)}>
          Skip — add details later
        </p>
      )}
    </div>
  );

  const footer3 = (
    <div style={{ display: "flex", gap: 12 }}>
      <button
        onClick={() => setStep(2)}
        style={{ flex: 1, background: "transparent", border: "2px solid #1A1A1A", borderRadius: 12, padding: "14px", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, color: "#1A1A1A", cursor: "pointer", letterSpacing: "0.05em" }}
      >
        ← BACK
      </button>
      <div style={{ flex: 1 }}>
        <AmberButton fullWidth onClick={handleFinish} disabled={saving}>
          {saving ? "SAVING…" : "FINISH"}
        </AmberButton>
      </div>
    </div>
  );

  const footerContent = step === 1 ? footer1 : step === 2 ? footer2 : footer3;

  return (
    <div style={{
      /* 100dvh shrinks when the keyboard opens on mobile */
      height: "100dvh",
      /* fallback for browsers without dvh support */
      minHeight: "-webkit-fill-available",
      display: "flex",
      flexDirection: "column",
      background: "#FAFAF8",
      overflow: "hidden",
    }}>

      {/* ── Header (never scrolls) ── */}
      <div style={{ padding: "28px 24px 0", flexShrink: 0 }}>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{ background: "none", border: "none", padding: "0 0 12px", cursor: "pointer", fontFamily: "'Rajdhani', sans-serif", fontSize: 15, color: "#888", display: "flex", alignItems: "center", gap: 6 }}
          >
            ← Back
          </button>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <GarageIcon width={24} height={20} stroke="#1A1A1A" />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 28, color: "#1A1A1A", lineHeight: 1 }}>GARI</span>
        </div>
        <ProgressDots step={step} />
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 24px 8px", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>

        {/* Step 1 — Nickname */}
        {step === 1 && (
          <div key="s1" className="gari-mount">
            <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 32, color: "#1A1A1A", marginBottom: 8, lineHeight: 1.1 }}>
              What do you call your car?
            </h1>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: "#888", marginBottom: 24 }}>
              This is how Gari will refer to your vehicle.
            </p>
            {/* Input with inline enter arrow */}
            <NicknameInput
              value={nickname}
              onChange={setNickname}
              onSubmit={() => { if (nickname.trim()) setStep(2); }}
            />
          </div>
        )}

        {/* Step 2 — Identify car */}
        {step === 2 && (
          <div key="s2" className="gari-mount">
            <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 30, color: "#1A1A1A", marginBottom: 6, lineHeight: 1.1 }}>
              Identify your car
            </h1>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: "#888", marginBottom: 16 }}>
              Scan the VIN barcode, type it, or enter details manually.
            </p>

            {!vinData && (
              <div style={{ display: "flex", gap: 6, marginBottom: 18, background: "#F0EFE9", borderRadius: 12, padding: 4 }}>
                {(["scan", "type", "manual"] as VinMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setVinMode(m); setVinError(""); }}
                    style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "none", background: vinMode === m ? "#fff" : "transparent", fontFamily: "'Rajdhani', sans-serif", fontWeight: vinMode === m ? 600 : 400, fontSize: 13, color: vinMode === m ? "#1A1A1A" : "#888", cursor: "pointer", boxShadow: vinMode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s", textTransform: "capitalize", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    {m === "scan" ? <CameraIcon size={16} color={vinMode === m ? "#1F6B2E" : "#888"} /> : m === "type" ? <KeyboardIcon size={16} color={vinMode === m ? "#1F6B2E" : "#888"} /> : <PencilIcon size={16} color={vinMode === m ? "#1F6B2E" : "#888"} />}
                    <span style={{ textTransform: "capitalize" }}>{m}</span>
                  </button>
                ))}
              </div>
            )}

            {vinMode === "scan" && !vinData && (
              <div>
                <VinScanner onDetected={handleScanDetected} />
                {vinLoading && <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: "#888", textAlign: "center", marginTop: 10 }}>Looking up VIN…</p>}
              </div>
            )}

            {vinMode === "type" && !vinData && (
              <div>
                <div style={{ position: "relative" }}>
                  <GariInput
                    placeholder="17-character VIN"
                    value={vin}
                    onChange={(v) => { setVin(v.toUpperCase()); setVinError(""); }}
                    maxLength={17}
                  />
                  <span style={{ position: "absolute", right: 14, bottom: 14, fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: vin.length === 17 ? "#EF9F27" : "#888", fontWeight: vin.length === 17 ? 600 : 400 }}>
                    {vin.length}/17
                  </span>
                </div>
                {vinError && <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: "#E24B4A", marginTop: 8 }}>{vinError}</p>}
                <div style={{ marginTop: 12 }}>
                  <AmberButton fullWidth onClick={lookupVin} disabled={vinLoading || vin.length !== 17}>
                    {vinLoading ? "LOOKING UP…" : "LOOK UP VIN"}
                  </AmberButton>
                </div>
              </div>
            )}

            {vinMode === "manual" && !vinData && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { key: "make", placeholder: "Make (e.g. Toyota)" },
                  { key: "model", placeholder: "Model (e.g. Corolla)" },
                  { key: "year", placeholder: "Year (e.g. 2020)" },
                  { key: "trim", placeholder: "Trim (optional)" },
                ].map(({ key, placeholder }) => (
                  <GariInput key={key} placeholder={placeholder} value={manual[key as keyof typeof manual]} onChange={(v) => setManual({ ...manual, [key]: v })} />
                ))}
              </div>
            )}

            {vinData && (
              <div style={{ background: "#F0EFE9", borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 13, color: "#888", letterSpacing: "0.05em" }}>VIN DECODED</span>
                  <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: "#EF9F27", cursor: "pointer" }} onClick={() => { setVinData(null); setVin(""); setVinMode("manual"); }}>
                    Not right? Edit
                  </span>
                </div>
                {[["Make", vinData.make], ["Model", vinData.model], ["Year", vinData.year], ["Trim", vinData.trim], ["Engine", vinData.engine], ["Fuel Type", vinData.fuel_type], ["Body Style", vinData.body_style]]
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid #E0DED8" }}>
                      <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: "#888" }}>{label}</span>
                      <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 15, color: "#1A1A1A", fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Details */}
        {step === 3 && (
          <div key="s3" className="gari-mount">
            <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 32, color: "#1A1A1A", marginBottom: 8, lineHeight: 1.1 }}>
              Last few details
            </h1>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: "#888", marginBottom: 24 }}>
              Both optional — you can add these later.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <GariInput type="number" placeholder="Current mileage (optional)" value={mileage} onChange={setMileage} />
              <GariInput placeholder="License plate (optional)" value={plate} onChange={setPlate} />
            </div>
            {error && <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: "#E24B4A", marginTop: 12 }}>{error}</p>}
          </div>
        )}
      </div>

      {/* ── Pinned footer — ALWAYS visible ── */}
      <div style={{
        padding: "12px 24px",
        paddingBottom: "max(20px, env(safe-area-inset-bottom))",
        flexShrink: 0,
        background: "#FAFAF8",
        borderTop: "1px solid #F0EFE9",
      }}>
        {footerContent}
      </div>
    </div>
  );
}
