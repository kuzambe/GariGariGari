import { useState, useRef, useEffect } from "react";
import { addExpense } from "@/lib/api/expenses";
import { CloseIcon } from "@/components/ui/icons";

const C = {
  bg:         "var(--gc-bg)",
  sage:       "var(--gc-sage)",
  text:       "var(--gc-text)",
  muted:      "var(--gc-muted)",
  green:      "#1F6B2E",
  greenLight: "var(--gc-greenLight)",
  border:     "var(--gc-border)",
};

const EXPENSE_TYPES = ["Fuel", "Maintenance", "Repairs", "Parts", "Insurance", "Other"];

type ScanStage = "camera" | "processing" | "confirm" | "denied";

interface ScanReceiptFlowProps {
  userId: string;
  vehicleId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function ScanReceiptFlow({ userId, vehicleId, onClose, onSaved }: ScanReceiptFlowProps) {
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
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 15,
    color: C.text,
    outline: "none",
    boxSizing: "border-box",
    minHeight: 44,
  };

  if (stage === "denied") {
    return (
      <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, gap: 16 }}>
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 1.6 }}>
          Camera access is needed to scan receipts. Please allow camera access in your device settings.
        </p>
        <button onClick={onClose} style={{ background: C.green, color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontFamily: "'Rajdhani', sans-serif", fontSize: 15, cursor: "pointer", minHeight: 44 }}>
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
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: "#fff", marginTop: 14, textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}>
              Position your receipt within the frame.
            </p>
          </div>
          {/* Close */}
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 52, left: 20, width: 44, height: 44, background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <CloseIcon size={20} color="#fff" strokeWidth={2} />
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
              <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: "#fff" }}>Reading receipt…</p>
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
              <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: C.muted, margin: "0 0 16px", lineHeight: 1.5, background: C.sage, borderRadius: 8, padding: "10px 12px" }}>
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
                  <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>{label}</p>
                  <input type={type} value={val} placeholder={ph} onChange={(e) => set(e.target.value)} style={inputStyle} />
                </div>
              ))}
            </div>

            {/* Expense type */}
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Type</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {EXPENSE_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setExpType(t)}
                  style={{ background: expType === t ? C.green : C.greenLight, color: expType === t ? "#fff" : C.text, border: "none", borderRadius: 999, padding: "7px 16px", fontFamily: "'Rajdhani', sans-serif", fontSize: 13, cursor: "pointer", minHeight: 44 }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Notes */}
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Notes</p>
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
