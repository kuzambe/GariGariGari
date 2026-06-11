import { useEffect, useRef, useState } from "react";
import { CloseIcon } from "@/components/ui/icons";

const C = {
  green: "#1F6B2E",
  text: "#0D1C0E",
  muted: "#6B7C6D",
  bg: "#FFFFFF",
  border: "#D4DDD5",
};

interface DocumentScannerProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

type ScanStage = "loading" | "camera" | "preview" | "denied";

declare global {
  interface Window {
    cv: unknown;
    Module: { onRuntimeInitialized?: () => void };
  }
}

function isCvReady(): boolean {
  return typeof window.cv !== "undefined" && window.cv !== null;
}

function loadOpenCV(): Promise<void> {
  if (isCvReady()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[data-opencv]')) {
      const poll = setInterval(() => {
        if (isCvReady()) { clearInterval(poll); resolve(); }
      }, 100);
      return;
    }
    window.Module = { onRuntimeInitialized: resolve };
    const script = document.createElement("script");
    script.src = `${import.meta.env.BASE_URL}opencv.js`;
    script.async = true;
    script.setAttribute("data-opencv", "1");
    script.onerror = () => reject(new Error("Failed to load OpenCV"));
    document.head.appendChild(script);
  });
}

export function DocumentScanner({ onCapture, onClose }: DocumentScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const scannerRef = useRef<InstanceType<typeof import("jscanify/client").default> | null>(null);

  const [stage, setStage] = useState<ScanStage>("loading");
  const [edgesDetected, setEdgesDetected] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [fallbackToast, setFallbackToast] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      loadOpenCV()
        .then(() => import("jscanify/client"))
        .then((mod) => {
          if (cancelled) return;
          scannerRef.current = new mod.default();
        })
        .catch(() => {});

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setStage("camera");
      } catch {
        if (!cancelled) setStage("denied");
      }
    }

    init();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  useEffect(() => {
    if (stage !== "camera" || !scannerRef.current) return;

    function detectEdges() {
      if (!videoRef.current || stage !== "camera") return;
      const video = videoRef.current;
      if (video.readyState < 2 || video.videoWidth === 0) {
        animFrameRef.current = requestAnimationFrame(detectEdges);
        return;
      }

      let detected = false;
      try {
        const scanner = scannerRef.current;
        if (scanner) {
          const tmpCanvas = document.createElement("canvas");
          const scale = 0.3;
          tmpCanvas.width = Math.floor(video.videoWidth * scale);
          tmpCanvas.height = Math.floor(video.videoHeight * scale);
          tmpCanvas.getContext("2d")!.drawImage(video, 0, 0, tmpCanvas.width, tmpCanvas.height);
          const probe = scanner.extractPaper(tmpCanvas, 10, 14);
          detected = probe !== null;
        }
      } catch {
        detected = false;
      }

      setEdgesDetected(detected);
      animFrameRef.current = requestAnimationFrame(detectEdges);
    }

    const timer = setTimeout(() => {
      animFrameRef.current = requestAnimationFrame(detectEdges);
    }, 800);

    return () => {
      clearTimeout(timer);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [stage]);

  function capture() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d")!.drawImage(video, 0, 0);

    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    let resultCanvas: HTMLCanvasElement = canvas;
    let usedFallback = true;

    try {
      const scanner = scannerRef.current;
      if (scanner) {
        const extracted = scanner.extractPaper(canvas, 900, 1200);
        if (extracted) {
          const enhCtx = extracted.getContext("2d")!;
          const imgData = enhCtx.getImageData(0, 0, extracted.width, extracted.height);
          const d = imgData.data;
          for (let i = 0; i < d.length; i += 4) {
            const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            const enhanced = Math.min(255, Math.max(0, (gray - 128) * 1.25 + 148));
            d[i] = d[i + 1] = d[i + 2] = enhanced;
          }
          enhCtx.putImageData(imgData, 0, 0);
          resultCanvas = extracted;
          usedFallback = false;
        }
      }
    } catch {
      usedFallback = true;
    }

    if (usedFallback) {
      setFallbackToast(true);
      setTimeout(() => setFallbackToast(false), 3000);
    }

    resultCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setCapturedBlob(blob);
      setStage("preview");
    }, "image/jpeg", 0.92);
  }

  function handleRetake() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCapturedBlob(null);
    setEdgesDetected(false);
    setStage("loading");

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setStage("camera");
      })
      .catch(() => {
        onClose();
        onError("Camera access denied. Please allow camera access in your device settings.");
      });
  }

  function handleUseScan() {
    if (!capturedBlob) return;
    const file = new File([capturedBlob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" });
    onCapture(file);
  }

  if (stage === "denied") {
    return (
      <div style={{
        position: "fixed", inset: 0, background: C.bg, zIndex: 300,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 32, gap: 20,
      }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FEE8E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        </div>
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 20, color: C.text, margin: 0, textAlign: "center" }}>
          Camera Access Denied
        </p>
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 1.6, margin: 0, maxWidth: 280 }}>
          Camera access is needed to scan documents. Please allow camera access in your device settings, then try again.
        </p>
        <a
          href="app-settings:"
          style={{
            fontFamily: "'Rajdhani', sans-serif", fontSize: 15, color: C.green,
            textDecoration: "none", border: `1.5px solid ${C.green}`, borderRadius: 12,
            padding: "13px 28px", textAlign: "center", minHeight: 44,
            display: "flex", alignItems: "center",
          }}
        >
          Open Settings
        </a>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", fontFamily: "'Rajdhani', sans-serif", fontSize: 15, color: C.muted, cursor: "pointer", minHeight: 44 }}
        >
          Go Back
        </button>
      </div>
    );
  }

  if (stage === "loading") {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "#000", zIndex: 300,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20,
      }}>
        <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "scanSpin 0.9s linear infinite" }} />
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.7)", margin: 0 }}>Initialising scanner…</p>
        <style>{`@keyframes scanSpin { to { transform: rotate(360deg); } }`}</style>
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 52, left: 20, width: 44, height: 44, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <CloseIcon size={20} color="#fff" strokeWidth={2} />
        </button>
      </div>
    );
  }


  if (stage === "preview" && previewUrl) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 300, display: "flex", flexDirection: "column" }}>
        <img src={previewUrl} alt="Scanned document" style={{ flex: 1, width: "100%", objectFit: "contain" }} />
        <div style={{ display: "flex", gap: 12, padding: "20px 24px 40px", background: "rgba(0,0,0,0.85)" }}>
          <button
            onClick={handleRetake}
            style={{ flex: 1, background: "none", border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: 14, padding: "14px", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 17, color: "#fff", cursor: "pointer", minHeight: 44 }}
          >
            Retake
          </button>
          <button
            onClick={handleUseScan}
            style={{ flex: 2, background: C.green, border: "none", borderRadius: 14, padding: "14px", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 17, color: "#fff", cursor: "pointer", minHeight: 44 }}
          >
            Use This Scan
          </button>
        </div>
        {fallbackToast && (
          <div style={{ position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.75)", color: "#fff", fontFamily: "'Rajdhani', sans-serif", fontSize: 13, padding: "10px 18px", borderRadius: 10, whiteSpace: "nowrap", zIndex: 400 }}>
            Couldn't detect edges — photo saved as-is.
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 300 }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: "#fff", marginBottom: 16, textShadow: "0 1px 4px rgba(0,0,0,0.7)", textAlign: "center" }}>
          {edgesDetected ? "Document detected — tap the shutter" : "Align document within the frame"}
        </p>
        <div
          style={{
            width: "72%",
            aspectRatio: "0.707",
            border: `2.5px solid ${edgesDetected ? "#4CAF50" : "rgba(255,255,255,0.9)"}`,
            borderRadius: 8,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
            transition: "border-color 0.3s",
          }}
        />
      </div>

      <button
        onClick={onClose}
        style={{ position: "absolute", top: 52, left: 20, width: 44, height: 44, background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}
      >
        <CloseIcon size={20} color="#fff" strokeWidth={2} />
      </button>

      <button
        onClick={capture}
        style={{ position: "absolute", bottom: 64, left: "50%", transform: "translateX(-50%)", width: 72, height: 72, borderRadius: "50%", background: "#fff", border: "4px solid rgba(255,255,255,0.4)", cursor: "pointer", boxShadow: "0 4px 24px rgba(0,0,0,0.5)", zIndex: 10 }}
      />

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
