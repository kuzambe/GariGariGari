import type { Vehicle } from "@/lib/api/vehicles";

const KEY = "gari_guest_session";

export interface GuestSession {
  vin: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
  engine: string | null;
  fuel_type: string | null;
  body_style: string | null;
  scanned_at: string;
  is_guest: true;
  is_manual_entry?: boolean;
}

export type GuestSessionInput = Omit<GuestSession, "scanned_at" | "is_guest">;

export function getGuestSession(): GuestSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestSession;
    if (!parsed || parsed.is_guest !== true) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setGuestSession(input: GuestSessionInput): GuestSession {
  const full: GuestSession = {
    ...input,
    scanned_at: new Date().toISOString(),
    is_guest: true,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(full));
  } catch {
    /* ignore */
  }
  return full;
}

export function clearGuestSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function guestSessionToVehicle(g: GuestSession): Vehicle {
  const modelLabel = (g.model && g.model.trim()) || "Car";
  return {
    id: "guest-vehicle",
    user_id: "guest",
    nickname: `Your ${modelLabel}`,
    vin: g.vin,
    make: g.make,
    model: g.model,
    year: g.year,
    trim: g.trim,
    engine: g.engine,
    fuel_type: g.fuel_type,
    body_style: g.body_style,
    mileage: null,
    license_plate: null,
    country: null,
    mileage_unit: "km",
    paint_name: null,
    paint_code: null,
    created_at: g.scanned_at,
  };
}
