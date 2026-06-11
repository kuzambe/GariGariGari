import { useState } from "react";
import { uploadDocument } from "@/lib/api/documents";
import { AmberButton } from "@/components/ui/AmberButton";

interface UploadDocumentModalProps {
  userId: string;
  vehicleId: string;
  onClose: () => void;
  onUploaded: () => void;
}

const DOC_TYPES = ["insurance", "registration", "service", "warranty", "other"];

export function UploadDocumentModal({ userId, vehicleId, onClose, onUploaded }: UploadDocumentModalProps) {
  const [type, setType] = useState("insurance");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload() {
    if (!file) { setError("Please select a file."); return; }
    setLoading(true);
    setError("");
    try {
      await uploadDocument(file, userId, vehicleId, type);
      onUploaded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FAFAF8",
          borderRadius: "20px 20px 0 0",
          padding: 24,
          width: "100%",
          maxWidth: 430,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 22, color: "#1A1A1A", marginBottom: 20 }}>
          Add Document
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {DOC_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                background: type === t ? "#EF9F27" : "#F0EFE9",
                color: type === t ? "#fff" : "#1A1A1A",
                border: "none",
                borderRadius: 999,
                padding: "6px 14px",
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 13,
                cursor: "pointer",
                fontWeight: type === t ? 500 : 400,
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          style={{
            width: "100%",
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 14,
            color: "#1A1A1A",
            marginBottom: 16,
          }}
        />
        {error && (
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: "#E24B4A", marginBottom: 12 }}>{error}</p>
        )}
        <AmberButton fullWidth onClick={handleUpload} disabled={loading}>
          {loading ? "UPLOADING..." : "UPLOAD"}
        </AmberButton>
      </div>
    </div>
  );
}
