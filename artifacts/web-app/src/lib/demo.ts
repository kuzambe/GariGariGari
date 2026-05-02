export const DEMO_KEY = "gari_demo";

export function isDemoMode(): boolean {
  return localStorage.getItem(DEMO_KEY) === "1";
}

export function enableDemo() {
  localStorage.setItem(DEMO_KEY, "1");
}

export function disableDemo() {
  localStorage.removeItem(DEMO_KEY);
}

export const DEMO_USER = {
  id: "demo-user-id",
  email: "demo@gari.app",
  created_at: "2024-01-15T00:00:00.000Z",
  app_metadata: { provider: "email" },
  user_metadata: {},
  aud: "authenticated",
  role: "authenticated",
};

export const DEMO_VEHICLE = {
  id: "demo-vehicle-id",
  user_id: "demo-user-id",
  vin: "1HGCM82633A123456",
  make: "Toyota",
  model: "Camry",
  year: "2021",
  trim: "XSE V6",
  engine: "3.5L 6-cyl",
  fuel_type: "Gasoline",
  body_style: "Sedan",
  mileage: 32400,
  license_plate: "GRI 001",
  created_at: "2024-01-15T00:00:00.000Z",
};
