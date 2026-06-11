export interface PaintOption {
  name: string;
  hex: string;
}

/** Preset car paint colors offered in the personalization picker. */
export const PAINT_OPTIONS: PaintOption[] = [
  { name: "White", hex: "#F5F5F2" },
  { name: "Silver", hex: "#C7CCD1" },
  { name: "Gray", hex: "#8A9197" },
  { name: "Black", hex: "#2B2E31" },
  { name: "Red", hex: "#C0392B" },
  { name: "Orange", hex: "#E07B27" },
  { name: "Yellow", hex: "#E8C33C" },
  { name: "Green", hex: "#1F6B2E" },
  { name: "Blue", hex: "#2D6CB5" },
  { name: "Navy", hex: "#26405E" },
  { name: "Brown", hex: "#6B4A2B" },
  { name: "Beige", hex: "#CDBfA3" },
];

export function paintByName(name: string | null | undefined): PaintOption | undefined {
  if (!name) return undefined;
  return PAINT_OPTIONS.find((p) => p.name.toLowerCase() === name.toLowerCase());
}
