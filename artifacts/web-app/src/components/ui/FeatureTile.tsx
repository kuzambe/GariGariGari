import { ReactNode, useState } from "react";

interface FeatureTileProps {
  icon: string;
  label: string;
  comingSoon?: boolean;
  onClick?: () => void;
}

export function FeatureTile({ icon, label, comingSoon = false, onClick }: FeatureTileProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={comingSoon ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered && !comingSoon ? "rgba(239,159,39,0.05)" : "#F0EFE9",
        borderRadius: 16,
        padding: "20px 16px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        borderBottom: hovered && !comingSoon ? "3px solid #EF9F27" : "3px solid transparent",
        transition: "all 0.2s",
        cursor: comingSoon ? "default" : "pointer",
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        gap: 8,
        position: "relative" as const,
        overflow: "hidden",
      }}
    >
      {comingSoon && (
        <span
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "#E0DED8",
            color: "#888888",
            fontSize: 9,
            borderRadius: 999,
            padding: "2px 7px",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Coming soon
        </span>
      )}
      <span style={{ fontSize: 28 }}>{icon}</span>
      <span
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: 15,
          color: "#1A1A1A",
        }}
      >
        {label}
      </span>
    </div>
  );
}
