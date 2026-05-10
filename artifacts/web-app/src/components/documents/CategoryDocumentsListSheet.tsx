import type { Document } from "@/lib/api/documents";

const C = {
  bg:     "var(--gc-bg)",
  text:   "var(--gc-text)",
  muted:  "var(--gc-muted)",
  border: "var(--gc-border)",
  error:  "#C0392B",
};

interface CategoryDocumentsListSheetProps {
  label: string;
  docs: Document[];
  onClose: () => void;
  onView: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  onAdd: () => void;
}

export function CategoryDocumentsListSheet({
  label,
  docs,
  onClose,
  onView,
  onDelete,
  onAdd,
}: CategoryDocumentsListSheetProps) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 250, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
      <div
        style={{ position: "relative", background: C.bg, borderRadius: "20px 20px 0 0", padding: "12px 24px 32px", maxWidth: 430, width: "100%", margin: "0 auto", boxShadow: "0 -4px 32px rgba(0,0,0,0.12)", maxHeight: "80vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 20, color: C.text, margin: 0 }}>
            {label}
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.muted, margin: 0 }}>
            {docs.length} {docs.length === 1 ? "file" : "files"}
          </p>
        </div>

        <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}`, flex: 1, overflowY: "auto" }}>
          {docs.map((doc, i) => (
            <div
              key={doc.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "14px 16px",
                background: C.bg,
                borderBottom: i < docs.length - 1 ? `1px solid ${C.border}` : "none",
                gap: 12,
              }}
            >
              <button
                onClick={() => onView(doc)}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", minHeight: 44 }}
                aria-label={`View document from ${new Date(doc.created_at).toLocaleDateString()}`}
              >
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 15, color: C.text }}>
                  {label} {docs.length - i}
                </span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.muted }}>
                  Added {new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </button>
              <button
                onClick={() => onDelete(doc)}
                aria-label="Delete document"
                style={{ width: 36, height: 36, borderRadius: 10, background: "none", border: `1px solid ${C.border}`, color: C.error, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={onAdd}
          style={{ marginTop: 16, width: "100%", background: "#1F6B2E", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, cursor: "pointer", minHeight: 44, letterSpacing: "0.04em" }}
        >
          Add another file
        </button>
        <button
          onClick={onClose}
          style={{ display: "block", width: "100%", marginTop: 8, background: "none", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.muted, cursor: "pointer", textAlign: "center", minHeight: 44 }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
