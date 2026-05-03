import { useRef, useState } from "react";
import { DocumentScanner } from "./DocumentScanner";

const C = {
  bg: "#FFFFFF",
  text: "#0D1C0E",
  muted: "#6B7C6D",
  green: "#1F6B2E",
  border: "#D4DDD5",
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;

interface AddDocumentSheetProps {
  categoryLabel: string;
  onClose: () => void;
  onFileSelected: (file: File) => void;
  onError: (message: string) => void;
}

type SheetMode = "menu" | "scanner" | "camera-capture";

function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 7 4"/>
      <polyline points="17 4 20 4 20 7"/>
      <polyline points="20 17 20 20 17 20"/>
      <polyline points="7 20 4 20 4 17"/>
      <line x1="4" y1="12" x2="20" y2="12"/>
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}

export function AddDocumentSheet({ categoryLabel, onClose, onFileSelected, onError }: AddDocumentSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mode, setMode] = useState<SheetMode>("menu");

  function handleFile(file: File) {
    if (file.size > MAX_FILE_BYTES) {
      onClose();
      onError("File is too large. Maximum size is 10 MB.");
      return;
    }
    onFileSelected(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    handleFile(file);
  }

  async function handleSnapPhoto() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setMode("camera-capture");
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      onClose();
      onError("Camera access denied. Please allow camera access in your device settings.");
    }
  }

  function handleCapturePhoto() {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    streamRef.current?.getTracks().forEach((t) => t.stop());

    canvas.toBlob((blob) => {
      if (!blob) {
        setMode("menu");
        return;
      }
      handleFile(new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  }

  function handleScannerCapture(file: File) {
    handleFile(file);
  }

  if (mode === "scanner") {
    return (
      <DocumentScanner
        onCapture={handleScannerCapture}
        onClose={() => setMode("menu")}
        onError={(msg) => { setMode("menu"); onError(msg); }}
      />
    );
  }

  if (mode === "camera-capture") {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 300, display: "flex", flexDirection: "column" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ flex: 1, width: "100%", objectFit: "cover" }}
        />
        <button
          onClick={() => { streamRef.current?.getTracks().forEach((t) => t.stop()); setMode("menu"); }}
          style={{ position: "absolute", top: 52, left: 20, width: 44, height: 44, background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          ✕
        </button>
        <button
          onClick={handleCapturePhoto}
          style={{ position: "absolute", bottom: 64, left: "50%", transform: "translateX(-50%)", width: 72, height: 72, borderRadius: "50%", background: "#fff", border: "4px solid rgba(255,255,255,0.4)", cursor: "pointer", boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}
        />
      </div>
    );
  }

  const OPTIONS = [
    {
      icon: <CameraIcon />,
      title: "Snap a Photo",
      subtitle: "Open camera and capture document",
      onClick: handleSnapPhoto,
    },
    {
      icon: <ScanIcon />,
      title: "Scan Document",
      subtitle: "Auto-detect edges and correct perspective",
      onClick: () => setMode("scanner"),
    },
    {
      icon: <LibraryIcon />,
      title: "Choose from Library",
      subtitle: "Pick a photo or PDF from your files",
      onClick: () => fileInputRef.current?.click(),
    },
  ];

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 250, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />

      <div
        style={{
          position: "relative",
          background: C.bg,
          borderRadius: "20px 20px 0 0",
          padding: "12px 24px 48px",
          maxWidth: 430,
          width: "100%",
          margin: "0 auto",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 20px" }} />

        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 20, color: C.text, margin: "0 0 20px" }}>
          {categoryLabel}
        </p>

        <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}` }}>
          {OPTIONS.map((opt, i) => (
            <button
              key={opt.title}
              onClick={opt.onClick}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 18px",
                background: C.bg,
                border: "none",
                borderBottom: i < OPTIONS.length - 1 ? `1px solid ${C.border}` : "none",
                cursor: "pointer",
                textAlign: "left",
                minHeight: 44,
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {opt.icon}
              </div>
              <div>
                <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, color: C.text, margin: 0 }}>
                  {opt.title}
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.muted, margin: "2px 0 0" }}>
                  {opt.subtitle}
                </p>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{ display: "block", width: "100%", marginTop: 20, background: "none", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.muted, cursor: "pointer", textAlign: "center", minHeight: 44 }}
        >
          Cancel
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          style={{ display: "none" }}
          onChange={handleFileInput}
        />
      </div>
    </div>
  );
}
