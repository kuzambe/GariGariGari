import { useEffect, useRef, useState } from "react";
import {
  ParseResult, DocType, DOC_TYPE_LABELS, formatDate,
} from "@/lib/documentParser";

const C = {
  bg: "#FFFFFF",
  text: "#0D1C0E",
  muted: "#6B7C6D",
  green: "#1F6B2E",
  greenBg: "#E8F5E9",
  border: "#D4DDD5",
  sage: "#F4F7F4",
  greyPill: "#EDEDE8",
  greyPillText: "#6B7C6D",
};

export interface PlannedAction {
  icon: string;        // single-char icon / emoji
  label: string;       // human-readable description shown in "Actions taken"
}

export interface ConfirmedDocument {
  type: DocType;
  fields: Record<string, string>;   // edited values keyed by field key
  actions: PlannedAction[];
}

interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
}

const FIELDS_FOR_TYPE: Record<DocType, FieldDef[]> = {
  mechanic_invoice: [
    { key: "shopName", label: "Shop name", placeholder: "e.g. Joe's Auto" },
    { key: "date",     label: "Service date", placeholder: "YYYY-MM-DD" },
    { key: "amount",   label: "Total ($)", placeholder: "0.00" },
    { key: "services", label: "Services", placeholder: "Oil change, brake pads…" },
  ],
  insurance: [
    { key: "provider",    label: "Provider", placeholder: "e.g. Intact" },
    { key: "policyNumber",label: "Policy #", placeholder: "ABC1234567" },
    { key: "expiryDate",  label: "Expiry date", placeholder: "YYYY-MM-DD" },
    { key: "coverage",    label: "Coverage", placeholder: "Liability, collision…" },
  ],
  registration: [
    { key: "plateNumber", label: "Plate number", placeholder: "ABCD123" },
    { key: "expiryDate",  label: "Expiry date", placeholder: "YYYY-MM-DD" },
    { key: "ownerName",   label: "Registered owner", placeholder: "Full name" },
  ],
  receipt: [
    { key: "merchant", label: "Merchant", placeholder: "e.g. Shell" },
    { key: "date",     label: "Date", placeholder: "YYYY-MM-DD" },
    { key: "amount",   label: "Total ($)", placeholder: "0.00" },
    { key: "category", label: "Category", placeholder: "Fuel / Maintenance / Parts / Other" },
  ],
  unknown: [],
};

/** Build the "actions taken" preview list from current edited values. */
function planActions(type: DocType, v: Record<string, string>): PlannedAction[] {
  const actions: PlannedAction[] = [];
  if (type === "mechanic_invoice") {
    if (v.amount) actions.push({ icon: "$", label: `Expense of $${v.amount} will be logged` });
    if (v.services) actions.push({ icon: "✓", label: `Added to service history${v.shopName ? ` (${v.shopName})` : ""}` });
    if (/oil change/i.test(v.services || "")) {
      actions.push({ icon: "⏰", label: "Reminder: oil change in 6 months / 5,000 km" });
    }
  } else if (type === "insurance") {
    if (v.provider || v.expiryDate) actions.push({ icon: "🛡", label: `Insurance details saved${v.provider ? ` (${v.provider})` : ""}` });
    if (v.expiryDate) {
      actions.push({ icon: "⏰", label: `Reminder 30 days before ${formatDate(v.expiryDate) || v.expiryDate}` });
      actions.push({ icon: "⏰", label: `Reminder 7 days before ${formatDate(v.expiryDate) || v.expiryDate}` });
    }
  } else if (type === "registration") {
    if (v.plateNumber) actions.push({ icon: "🚗", label: `Plate ${v.plateNumber} saved to vehicle profile` });
    if (v.expiryDate) actions.push({ icon: "⏰", label: `Reminder 30 days before ${formatDate(v.expiryDate) || v.expiryDate}` });
  } else if (type === "receipt") {
    if (v.amount) actions.push({ icon: "$", label: `Expense of $${v.amount} (${v.category || "Other"}) will be logged` });
  }
  return actions;
}

interface Props {
  parseResult: ParseResult;
  onConfirm: (result: ConfirmedDocument) => void;
  onClose: () => void;
}

export function ParsedDocumentSheet({ parseResult, onConfirm, onClose }: Props) {
  const { type, fields } = parseResult;
  const isUnknown = type === "unknown";
  const fieldDefs = FIELDS_FOR_TYPE[type];

  // Seed editable values from the parser
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const f of fieldDefs) {
      const raw = (fields as Record<string, unknown>)[f.key];
      if (raw === undefined || raw === null) { v[f.key] = ""; continue; }
      v[f.key] = Array.isArray(raw) ? (raw as string[]).join(", ") : String(raw);
    }
    return v;
  });
  const [visible, setVisible] = useState(false);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  function update(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  const actions = planActions(type, values);

  function handleConfirm() {
    setSaving(true);
    onConfirm({ type, fields: values, actions });
  }

  function handleEditDetails() {
    firstInputRef.current?.focus();
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 320,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={() => { if (!saving) onClose(); }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 460,
          background: C.bg,
          borderRadius: "22px 22px 0 0",
          padding: "12px 22px 32px",
          maxHeight: "92vh",
          overflowY: "auto",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.28s ease",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.18)",
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 38, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 16px" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 22, color: C.text, margin: 0, flex: 1 }}>
            {isUnknown ? "Document Saved" : "Confirm Details"}
          </h2>
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500,
            padding: "5px 11px", borderRadius: 999,
            background: isUnknown ? C.greyPill : C.greenBg,
            color: isUnknown ? C.greyPillText : C.green,
            border: `1px solid ${isUnknown ? C.border : "transparent"}`,
            whiteSpace: "nowrap",
          }}>
            {DOC_TYPE_LABELS[type]}
          </span>
        </div>

        {isUnknown ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.muted, margin: "12px 0 22px", lineHeight: 1.55 }}>
            We couldn't identify this document type. It has been saved to your documents.
          </p>
        ) : (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.muted, margin: "0 0 18px" }}>
            Tap any field to correct it before saving.
          </p>
        )}

        {/* Editable fields */}
        {!isUnknown && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
            {fieldDefs.map((f, i) => (
              <div key={f.key}>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                  color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em",
                  margin: "0 0 4px",
                }}>
                  {f.label}
                </p>
                <input
                  ref={i === 0 ? firstInputRef : undefined}
                  type="text"
                  value={values[f.key] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => update(f.key, e.target.value)}
                  style={{
                    width: "100%",
                    background: C.sage,
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 10,
                    padding: "12px 14px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 15,
                    color: C.text,
                    outline: "none",
                    boxSizing: "border-box",
                    minHeight: 44,
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Actions taken preview */}
        {!isUnknown && actions.length > 0 && (
          <div style={{
            background: C.sage, borderRadius: 12,
            border: `1px solid ${C.border}`, padding: "12px 14px",
            marginBottom: 20,
          }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 11,
              color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em",
              margin: "0 0 8px",
            }}>
              Actions on save
            </p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {actions.map((a, idx) => (
                <li key={idx} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: "50%", background: "#fff",
                    border: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, color: C.green, flexShrink: 0,
                  }}>
                    {a.icon}
                  </span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.text, lineHeight: 1.4 }}>
                    {a.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Buttons */}
        <button
          onClick={handleConfirm}
          disabled={saving}
          style={{
            width: "100%",
            background: C.green, color: "#fff",
            border: "none", borderRadius: 12,
            padding: "14px",
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16,
            letterSpacing: "0.02em",
            cursor: saving ? "default" : "pointer",
            minHeight: 48,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving…" : isUnknown ? "Done" : "Confirm and Save"}
        </button>

        {!isUnknown && (
          <button
            onClick={handleEditDetails}
            disabled={saving}
            style={{
              display: "block", width: "100%", marginTop: 10,
              background: "none", border: "none",
              fontFamily: "'DM Sans', sans-serif", fontSize: 14,
              color: C.muted, cursor: saving ? "default" : "pointer",
              textAlign: "center", minHeight: 36,
            }}
          >
            Edit Details
          </button>
        )}
      </div>
    </div>
  );
}
