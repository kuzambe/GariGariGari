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
  /* Personalization */
  nickname?: string | null;
  paint_name?: string | null;
  paint_code?: string | null;
  license_plate?: string | null;
  mileage?: number | null;
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

/** Merge partial personalization fields into the existing guest session. */
export function updateGuestSession(
  patch: Partial<Omit<GuestSession, "scanned_at" | "is_guest">>,
): GuestSession | null {
  const current = getGuestSession();
  if (!current) return null;
  const next: GuestSession = { ...current, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function clearGuestSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Default display name when the user hasn't set a nickname. */
export function guestDisplayName(g: GuestSession): string {
  if (g.nickname && g.nickname.trim()) return g.nickname.trim();
  const modelLabel = (g.model && g.model.trim()) || "";
  return modelLabel ? `Your ${modelLabel}` : "Your Car";
}

export function guestSessionToVehicle(g: GuestSession): Vehicle {
  return {
    id: "guest-vehicle",
    user_id: "guest",
    nickname: guestDisplayName(g),
    vin: g.vin,
    make: g.make,
    model: g.model,
    year: g.year,
    trim: g.trim,
    engine: g.engine,
    fuel_type: g.fuel_type,
    body_style: g.body_style,
    mileage: g.mileage ?? null,
    license_plate: g.license_plate ?? null,
    country: null,
    mileage_unit: "km",
    paint_name: g.paint_name ?? null,
    paint_code: g.paint_code ?? null,
    created_at: g.scanned_at,
  };
}
