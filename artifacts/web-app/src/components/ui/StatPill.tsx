interface StatPillProps {
  value: string;
  label: string;
  valueColor?: string;
}

export function StatPill({ value, label, valueColor = "#1A1A1A" }: StatPillProps) {
  return (
    <div
      className="flex flex-col items-center gap-0.5 flex-shrink-0"
      style={{
        background: "#F0EFE9",
        borderRadius: 999,
        padding: "8px 20px",
      }}
    >
      <span
        className="text-sm font-medium leading-tight"
        style={{ color: valueColor, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 14 }}
      >
        {value}
      </span>
      <span
        className="uppercase tracking-wider"
        style={{ color: "#888888", fontFamily: "'DM Sans', sans-serif", fontSize: 11 }}
      >
        {label}
      </span>
    </div>
  );
}
