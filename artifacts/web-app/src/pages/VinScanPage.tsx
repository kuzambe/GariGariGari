import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";
import { setGuestSession } from "@/lib/guestSession";
import { useVehicle } from "@/context/VehicleContext";

const BASE = import.meta.env.BASE_URL;
const ACCENT = "#1F6B2E";
const VIN_RE = /[A-HJ-NPR-Z0-9]{17}/i;

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
  const upper = v.trim().toUpperCase();
  if (upper.length !== 17) return false;
  if (/[IOQ]/.test(upper)) return false;
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(upper);
}

async function lookupVinWithTimeout(vin: string, ms = 8000): Promise<VinData | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(`${BASE}api/vin/${vin}`, { signal: ctrl.signal });
    if (!res.ok) return null;
    return (await res.json()) as VinData;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export default function VinScanPage() {
  const [, navigate] = useLocation();
  const { refetch: refetchVehicle } = useVehicle();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const detectedRef = useRef(false);

  const [scanning, setScanning] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualVin, setManualVin] = useState("");
  const [loadingVin, setLoadingVin] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [manualVehicle, setManualVehicle] = useState<{ make: string; model: string; year: string; trim: string } | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const proceedWithVin = useCallback(
    async (rawVin: string) => {
      const vin = rawVin.toUpperCase();
      if (!isValidVin(vin)) {
        setLookupError("That doesn't look like a valid VIN.");
        return;
      }
      detectedRef.current = true;
      setScanning(false);
      setLoadingVin(true);
      stopCamera();
      navigator.vibrate?.(80);
      const data = await lookupVinWithTimeout(vin, 8000);
      if (!data) {
        setLoadingVin(false);
        setLookupError("Couldn't look up this VIN. You can add your car details manually.");
        setManualVehicle({ make: "", model: "", year: "", trim: "" });
        setShowManualInput(false);
        return;
      }
      setGuestSession({
        vin,
        make: data.make || null,
        model: data.model || null,
        year: data.year ? parseInt(String(data.year)) || null : null,
        trim: data.trim || null,
        engine: data.engine || null,
        fuel_type: data.fuel_type || null,
        body_style: data.body_style || null,
      });
      await refetchVehicle();
      navigate("/dashboard");
    },
    [navigate, stopCamera, refetchVehicle]
  );

  // Start camera on mount
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
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        await reader.decodeFromStream(stream, videoRef.current ?? undefined, (result) => {
          if (!result || cancelled || detectedRef.current) return;
          const raw = result.getText().replace(/[^A-HJ-NPR-Z0-9]/gi, "");
          const match = VIN_RE.exec(raw);
          if (match) proceedWithVin(match[0]);
        });
      } catch {
        if (!cancelled) {
          setPermissionDenied(true);
          setScanning(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [proceedWithVin]);

  function handleSkip() {
    stopCamera();
    navigate("/auth");
  }

  function handleManualSubmit() {
    const cleaned = manualVin.trim().toUpperCase();
    if (!isValidVin(cleaned)) {
      setLookupError("VIN must be 17 characters and cannot include I, O, or Q.");
      return;
    }
    setLookupError(null);
    proceedWithVin(cleaned);
  }

  async function handleManualVehicleSave() {
    if (!manualVehicle) return;
    setGuestSession({
      vin: manualVin.trim().toUpperCase() || null,
      make: manualVehicle.make.trim() || null,
      model: manualVehicle.model.trim() || null,
      year: manualVehicle.year.trim() ? parseInt(manualVehicle.year.trim()) || null : null,
      trim: manualVehicle.trim.trim() || null,
      engine: null,
      fuel_type: null,
      body_style: null,
    });
    await refetchVehicle();
    navigate("/dashboard");
  }

  // ── Render: loading state ────────────────────────────────────
  if (loadingVin) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#0A0F0B",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          zIndex: 100,
        }}
      >
        <div className="gari-spin" style={{ width: 64, height: 64 }}>
          <img
            src={`${BASE}gari-icon-new-nobg.png`}
            alt="Gari"
            style={{ width: 64, height: 64, objectFit: "contain" }}
          />
        </div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#FFFFFF", margin: 0 }}>
          Looking up your vehicle…
        </p>
      </div>
    );
  }

  // ── Render: NHTSA failed → manual vehicle entry ──────────────
  if (manualVehicle) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#FAFAF8",
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          zIndex: 100,
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <img src={`${BASE}gari-icon-new-nobg.png`} alt="Gari" style={{ height: 32 }} />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 24, color: "#0D1C0E" }}>
            GARI
          </span>
        </div>
        <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 24, color: "#0D1C0E", margin: 0 }}>
          Add your car details
        </h2>
        {lookupError && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6B7C6D", margin: 0 }}>
            {lookupError}
          </p>
        )}
        {[
          { key: "make" as const, ph: "Make (e.g. Toyota)" },
          { key: "model" as const, ph: "Model (e.g. Camry)" },
          { key: "year" as const, ph: "Year (e.g. 2020)" },
          { key: "trim" as const, ph: "Trim (optional)" },
        ].map((f) => (
          <input
            key={f.key}
            type="text"
            placeholder={f.ph}
            value={manualVehicle[f.key]}
            onChange={(e) => setManualVehicle((prev) => prev ? { ...prev, [f.key]: e.target.value } : prev)}
            style={{
              background: "#fff",
              border: "1.5px solid #D4DDD5",
              borderRadius: 12,
              padding: "14px 16px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              color: "#0D1C0E",
              outline: "none",
              boxShadow: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        ))}
        <button
          onClick={handleManualVehicleSave}
          disabled={!manualVehicle.make.trim() || !manualVehicle.model.trim()}
          style={{
            background: ACCENT,
            color: "#FFFFFF",
            border: "none",
            borderRadius: 12,
            padding: "14px",
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            cursor: "pointer",
            opacity: !manualVehicle.make.trim() || !manualVehicle.model.trim() ? 0.6 : 1,
            marginTop: 8,
          }}
        >
          CONTINUE
        </button>
        <button
          onClick={handleSkip}
          style={{
            background: "none",
            border: "none",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: "#6B7C6D",
            cursor: "pointer",
            padding: "8px 0",
          }}
        >
          Skip — sign up directly
        </button>
      </div>
    );
  }

  // ── Render: camera permission denied fallback ────────────────
  if (permissionDenied) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#FAFAF8",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 32,
          zIndex: 100,
        }}
      >
        <img src={`${BASE}gari-icon-new-nobg.png`} alt="Gari" style={{ height: 56 }} />
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: "#6B7C6D",
            textAlign: "center",
            maxWidth: 280,
            margin: 0,
          }}
        >
          Camera access is needed to scan your VIN
        </p>
        <button
          onClick={() => setShowManualInput(true)}
          style={{
            background: ACCENT,
            color: "#FFFFFF",
            border: "none",
            borderRadius: 12,
            padding: "14px 28px",
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          ENTER VIN MANUALLY
        </button>
        <button
          onClick={handleSkip}
          style={{
            background: "none",
            border: "none",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: "#6B7C6D",
            cursor: "pointer",
            opacity: 0.7,
          }}
        >
          Skip
        </button>

        {showManualInput && (
          <ManualVinOverlay
            value={manualVin}
            onChange={setManualVin}
            onSubmit={handleManualSubmit}
            onClose={() => setShowManualInput(false)}
            error={lookupError}
          />
        )}
      </div>
    );
  }

  // ── Render: main camera scan view ────────────────────────────
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        overflow: "hidden",
        zIndex: 100,
      }}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* Dark overlay with cutout */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 320,
            maxWidth: "85vw",
            height: 80,
            borderRadius: 10,
            background: "transparent",
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,255,255,0.4) inset",
            overflow: "hidden",
          }}
        >
          {/* Animated scanning line */}
          {scanning && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: 2,
                background: "#1F6B2E",
                boxShadow: "0 0 6px rgba(31,107,46,0.8)",
                animation: "gari-vin-scan 1.5s ease-in-out infinite",
              }}
            />
          )}
        </div>
      </div>

      {/* Top branding */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "20px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          background: "linear-gradient(rgba(0,0,0,0.45), transparent)",
        }}
      >
        <img src={`${BASE}gari-icon-new-nobg.png`} alt="Gari" style={{ height: 36 }} />
        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 28,
            color: "#FFFFFF",
            letterSpacing: "0.04em",
          }}
        >
          GARI
        </span>
      </div>

      {/* Skip top right */}
      <button
        onClick={handleSkip}
        style={{
          position: "absolute",
          top: 28,
          right: 18,
          background: "none",
          border: "none",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          color: "rgba(255,255,255,0.5)",
          cursor: "pointer",
          padding: 6,
        }}
      >
        Skip
      </button>

      {/* Instructions below cutout */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "calc(50% + 70px)",
          padding: "0 24px",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: "rgba(255,255,255,0.6)",
            margin: "0 0 12px",
          }}
        >
          Point your camera at the VIN sticker on your door jamb or dashboard
        </p>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: "rgba(255,255,255,0.45)",
            margin: 0,
          }}
        >
          The VIN is a 17-character code
        </p>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: "rgba(255,255,255,0.45)",
            margin: 0,
          }}
        >
          Usually found on the driver's side door frame
        </p>
      </div>

      {/* Bottom buttons */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "20px 20px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          background: "linear-gradient(transparent, rgba(0,0,0,0.55))",
        }}
      >
        <button
          onClick={() => {
            // Already barcode scanning automatically; tapping focuses user expectations.
            // No-op visually but here for spec compliance.
          }}
          style={{
            background: ACCENT,
            color: "#FFFFFF",
            border: "none",
            borderRadius: 14,
            height: 54,
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            cursor: "pointer",
            width: "100%",
            letterSpacing: "0.04em",
          }}
        >
          SCAN BARCODE
        </button>
        <button
          onClick={() => setShowManualInput(true)}
          style={{
            background: "none",
            border: "none",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: "rgba(255,255,255,0.7)",
            cursor: "pointer",
            padding: "8px 0",
          }}
        >
          Enter VIN manually
        </button>
      </div>

      {showManualInput && (
        <ManualVinOverlay
          value={manualVin}
          onChange={setManualVin}
          onSubmit={handleManualSubmit}
          onClose={() => setShowManualInput(false)}
          error={lookupError}
        />
      )}

      {/* Inline keyframes for scan line */}
      <style>{`
        @keyframes gari-vin-scan {
          0%   { top: 0; opacity: 0.2; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { top: 100%; opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}

function ManualVinOverlay({
  value,
  onChange,
  onSubmit,
  onClose,
  error,
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
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FAFAF8",
          borderRadius: 16,
          padding: 24,
          width: "100%",
          maxWidth: 380,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <h3
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 22,
            color: "#0D1C0E",
            margin: 0,
          }}
        >
          Enter your VIN
        </h3>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            placeholder="17-character VIN"
            maxLength={17}
            autoFocus
            style={{
              width: "100%",
              background: "#fff",
              border: `1.5px solid ${valid ? ACCENT : "#D4DDD5"}`,
              borderRadius: 12,
              padding: "14px 56px 14px 16px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              letterSpacing: "0.05em",
              color: "#0D1C0E",
              outline: "none",
              boxShadow: "none",
              boxSizing: "border-box",
              textTransform: "uppercase",
            }}
          />
          <span
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: cleaned.length === 17 ? ACCENT : "#6B7C6D",
              fontWeight: cleaned.length === 17 ? 600 : 400,
            }}
          >
            {cleaned.length}/17
          </span>
        </div>
        {error && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#C0392B", margin: 0 }}>
            {error}
          </p>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: "transparent",
              border: "1.5px solid #D4DDD5",
              borderRadius: 12,
              padding: "12px 16px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              color: "#6B7C6D",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!valid}
            style={{
              flex: 1,
              background: valid ? ACCENT : "#A8B5A8",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 12,
              padding: "12px 16px",
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: 16,
              cursor: valid ? "pointer" : "default",
              opacity: valid ? 1 : 0.6,
            }}
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
}
