import { GarageIcon } from "@/components/ui/GarageIcon";
import { Vehicle } from "@/lib/api/vehicles";

interface HeaderProps {
  vehicle: Vehicle;
}

export function Header({ vehicle }: HeaderProps) {
  return (
    <div
      style={{
        padding: "20px 20px 0",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: 28,
          color: "#1A1A1A",
          lineHeight: 1,
        }}
      >
        {vehicle.nickname}
      </span>
      <GarageIcon width={24} height={20} stroke="#1A1A1A" />
    </div>
  );
}
