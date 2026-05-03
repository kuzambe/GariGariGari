interface AlertStripProps {
  message: string;
  onAction?: () => void;
}

export function AlertStrip({ message, onAction }: AlertStripProps) {
  return (
    <div
      style={{
        background: "rgba(239,159,39,0.08)",
        borderLeft: "3px solid #EF9F27",
        borderRadius: 12,
        margin: "16px 20px",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#EF9F27",
          flexShrink: 0,
          animation: "pulse 2s infinite",
        }}
      />
      <span
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          color: "#1A1A1A",
          flex: 1,
        }}
      >
        {message}
      </span>
      <span
        onClick={onAction}
        style={{ color: "#EF9F27", cursor: onAction ? "pointer" : "default", fontSize: 16 }}
      >
        →
      </span>
    </div>
  );
}
