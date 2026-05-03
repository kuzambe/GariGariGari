import { ButtonHTMLAttributes, ReactNode } from "react";

interface AmberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "filled" | "outline";
  fullWidth?: boolean;
}

export function AmberButton({
  children,
  variant = "filled",
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: AmberButtonProps) {
  const base = [
    "font-rajdhani font-bold text-[18px] tracking-[0.05em] rounded-[12px] px-6 py-4",
    "transition-all duration-150 active:scale-[0.97] cursor-pointer",
    "flex items-center justify-center gap-2",
    fullWidth ? "w-full" : "",
    disabled ? "opacity-50 cursor-not-allowed" : "",
  ].join(" ");

  const styles =
    variant === "filled"
      ? {
          backgroundColor: disabled ? "#EF9F27" : undefined,
          background: "#EF9F27",
          color: "#fff",
          border: "none",
        }
      : {
          background: "transparent",
          color: "#1A1A1A",
          border: "2px solid #1A1A1A",
        };

  return (
    <button
      className={`${base} ${className}`}
      style={styles}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled && variant === "filled") {
          (e.currentTarget as HTMLButtonElement).style.background = "#D48E1F";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && variant === "filled") {
          (e.currentTarget as HTMLButtonElement).style.background = "#EF9F27";
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
}
