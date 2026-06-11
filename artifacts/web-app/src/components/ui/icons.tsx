import type { CSSProperties } from "react";

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}

function base(size: number, color: string, strokeWidth: number, style?: CSSProperties) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style,
  };
}

export function ShieldIcon({ size = 24, color = "currentColor", strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth, style)}>
      <path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z" />
    </svg>
  );
}

export function ClipboardIcon({ size = 24, color = "currentColor", strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth, style)}>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <rect x="9" y="2.5" width="6" height="3.5" rx="1" />
      <line x1="9" y1="11" x2="15" y2="11" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}

export function WrenchIcon({ size = 24, color = "currentColor", strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth, style)}>
      <path d="M14.5 6.5a3.5 3.5 0 0 0-4.6 4.2L4 16.6 7.4 20l5.9-5.9a3.5 3.5 0 0 0 4.2-4.6l-2.1 2.1-2.1-.7-.7-2.1z" />
    </svg>
  );
}

export function CertificateIcon({ size = 24, color = "currentColor", strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth, style)}>
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13.5L7.5 21l4.5-2.2L16.5 21 15 13.5" />
    </svg>
  );
}

export function FileIcon({ size = 24, color = "currentColor", strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth, style)}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <polyline points="14 3 14 8 19 8" />
      <line x1="8.5" y1="13" x2="15.5" y2="13" />
      <line x1="8.5" y1="16.5" x2="13" y2="16.5" />
    </svg>
  );
}

export function CheckIcon({ size = 24, color = "currentColor", strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth, style)}>
      <polyline points="4 12.5 9.5 18 20 6.5" />
    </svg>
  );
}

export function ClockIcon({ size = 24, color = "currentColor", strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth, style)}>
      <circle cx="12" cy="12" r="8.5" />
      <polyline points="12 7 12 12 16 14" />
    </svg>
  );
}

export function CarIcon({ size = 24, color = "currentColor", strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth, style)}>
      <path d="M4 16v-3l2-5a2 2 0 0 1 1.9-1.3h8.2A2 2 0 0 1 18 8l2 5v3" />
      <path d="M3.5 13h17" />
      <circle cx="7.5" cy="16.5" r="1.8" />
      <circle cx="16.5" cy="16.5" r="1.8" />
    </svg>
  );
}

export function BellIcon({ size = 24, color = "currentColor", strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth, style)}>
      <path d="M18 9a6 6 0 0 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
      <path d="M10.5 20a2 2 0 0 0 3 0" />
    </svg>
  );
}

export function AlertTriangleIcon({ size = 24, color = "currentColor", strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth, style)}>
      <path d="M12 4l9 15.5H3z" />
      <line x1="12" y1="10" x2="12" y2="14.5" />
      <line x1="12" y1="17.5" x2="12" y2="17.6" />
    </svg>
  );
}

export function ZapIcon({ size = 24, color = "currentColor", strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth, style)}>
      <polygon points="13 2 4 14 11 14 10 22 19 10 12 10 13 2" />
    </svg>
  );
}

export function CameraIcon({ size = 24, color = "currentColor", strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth, style)}>
      <path d="M4 8a2 2 0 0 1 2-2h1.5l1.2-1.8h6.6L16.5 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="12.5" r="3.2" />
    </svg>
  );
}

export function KeyboardIcon({ size = 24, color = "currentColor", strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth, style)}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <line x1="7" y1="10" x2="7" y2="10.1" />
      <line x1="11" y1="10" x2="11" y2="10.1" />
      <line x1="15" y1="10" x2="15" y2="10.1" />
      <line x1="8" y1="14" x2="16" y2="14" />
    </svg>
  );
}

export function PencilIcon({ size = 24, color = "currentColor", strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth, style)}>
      <path d="M15.5 5.5l3 3L8 19l-4 1 1-4z" />
      <line x1="13.5" y1="7.5" x2="16.5" y2="10.5" />
    </svg>
  );
}

export function StorefrontIcon({ size = 24, color = "currentColor", strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth, style)}>
      <path d="M4 9l1.2-4h13.6L20 9" />
      <path d="M4 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" />
      <path d="M5 11v8h14v-8" />
      <rect x="9.5" y="14" width="5" height="5" />
    </svg>
  );
}

export function TagIcon({ size = 24, color = "currentColor", strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth, style)}>
      <path d="M4 4h7l9 9-7 7-9-9z" />
      <circle cx="8" cy="8" r="1.4" />
    </svg>
  );
}

export function PackageIcon({ size = 24, color = "currentColor", strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth, style)}>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
      <polyline points="4 7.5 12 12 20 7.5" />
      <line x1="12" y1="12" x2="12" y2="21" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 24, color = "currentColor", strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth, style)}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function CloseIcon({ size = 24, color = "currentColor", strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth, style)}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}
