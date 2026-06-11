import { Document } from "@/lib/api/documents";
import type { ComponentType } from "react";
import {
  ShieldIcon, ClipboardIcon, WrenchIcon, CertificateIcon, FileIcon, type IconProps,
} from "@/components/ui/icons";

interface DocumentGridProps {
  documents: Document[];
  onUpload: () => void;
}

const DOC_TYPE_ICONS: Record<string, ComponentType<IconProps>> = {
  insurance: ShieldIcon,
  registration: ClipboardIcon,
  service: WrenchIcon,
  warranty: CertificateIcon,
  other: FileIcon,
};

export function DocumentGrid({ documents, onUpload }: DocumentGridProps) {
  return (
    <div style={{ padding: "0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 20, color: "#1A1A1A" }}>
          Documents
        </span>
        <button
          onClick={onUpload}
          style={{
            background: "#EF9F27",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "8px 16px",
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            letterSpacing: "0.05em",
          }}
        >
          + ADD
        </button>
      </div>
      {documents.length === 0 ? (
        <div
          style={{
            background: "#F0EFE9",
            borderRadius: 16,
            padding: 32,
            textAlign: "center",
          }}
        >
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: "#888888", margin: 0 }}>
            No documents yet. Add your insurance, registration, or service records.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {documents.map((doc) => (
            <a
              key={doc.id}
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#F0EFE9",
                borderRadius: 16,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                textDecoration: "none",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              {(() => {
                const Icon = DOC_TYPE_ICONS[doc.type] ?? FileIcon;
                return <Icon size={24} color="#1F6B2E" />;
              })()}
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: "#1A1A1A", fontWeight: 600 }}>
                {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
              </span>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: "#888888" }}>
                {new Date(doc.created_at).toLocaleDateString()}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
