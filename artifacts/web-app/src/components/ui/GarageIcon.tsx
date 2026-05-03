interface GarageIconProps {
  stroke?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function GarageIcon({
  stroke = "#1A1A1A",
  width = 28,
  height = 24,
  className = "",
}: GarageIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 28 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="1.5" y="1.5" width="25" height="21" rx="2.5" stroke={stroke} strokeWidth="2" />
      <path d="M5 8.5C9.2 8.3 18.8 8.7 23 8.5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M5 13C9.1 12.85 18.9 13.15 23 13" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M5 17.5C9.3 17.4 18.7 17.6 23 17.5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
