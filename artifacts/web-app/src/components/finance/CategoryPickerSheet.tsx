import type { ComponentType } from "react";
import {
  ShieldIcon,
  CertificateIcon,
  ClipboardIcon,
  SunIcon,
  IdCardIcon,
  BookIcon,
  type IconProps,
} from "@/components/ui/icons";

const C = {
  bg:     "var(--gc-bg)",
  text:   "var(--gc-text)",
  muted:  "var(--gc-muted)",
  green:  "#1F6B2E",
  border: "var(--gc-border)",
};

export const DOC_CATEGORIES: {
  label: string;
  type: string;
  icon: ComponentType<IconProps>;
}[] = [
  { label: "Insurance", type: "insurance", icon: ShieldIcon },
  { label: "Ownership", type: "ownership", icon: CertificateIcon },
  { label: "Registration", type: "registration", icon: ClipboardIcon },
  { label: "Tint Exemption", type: "tint-exemption", icon: SunIcon },
  { label: "Driver's License", type: "drivers-license", icon: IdCardIcon },
  { label: "Vehicle Handbook", type: "vehicle-handbook", icon: BookIcon },
];

interface CategoryPickerSheetProps {
  onSelect: (type: string, label: string) => void;
  onClose: () => void;
}

export function CategoryPickerSheet({ onSelect, onClose }: CategoryPickerSheetProps) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 250, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
      <div
        style={{ position: "relative", background: C.bg, borderRadius: "20px 20px 0 0", padding: "12px 24px 48px", maxWidth: 430, width: "100%", margin: "0 auto", boxShadow: "0 -4px 32px rgba(0,0,0,0.12)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 20px" }} />
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 20, color: C.text, margin: "0 0 16px" }}>
          Select Category
        </p>
        <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}` }}>
          {DOC_CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.type}
                onClick={() => onSelect(cat.type, cat.label)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px 18px",
                  background: C.bg,
                  border: "none",
                  borderBottom: i < DOC_CATEGORIES.length - 1 ? `1px solid ${C.border}` : "none",
                  cursor: "pointer",
                  textAlign: "left",
                  minHeight: 44,
                }}
              >
                <Icon size={22} color={C.green} strokeWidth={1.8} />
                <span style={{ flex: 1, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, color: C.text }}>{cat.label}</span>
                <span style={{ color: C.border, fontSize: 18 }}>›</span>
              </button>
            );
          })}
        </div>
        <button
          onClick={onClose}
          style={{ display: "block", width: "100%", marginTop: 20, background: "none", border: "none", fontFamily: "'Rajdhani', sans-serif", fontSize: 15, color: C.muted, cursor: "pointer", textAlign: "center", minHeight: 44 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
