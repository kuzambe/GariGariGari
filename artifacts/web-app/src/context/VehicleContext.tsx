import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type Vehicle, getAllVehiclesByUserId } from "@/lib/api/vehicles";
import { useAuth } from "@/context/AuthContext";

const ACTIVE_KEY = "gari_active_vehicle_id";

interface VehicleContextType {
  vehicle: Vehicle | null;
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setVehicle: (v: Vehicle) => void;
  switchVehicle: (id: string) => void;
}

const VehicleContext = createContext<VehicleContextType>({
  vehicle: null,
  vehicles: [],
  loading: true,
  error: null,
  refetch: async () => {},
  setVehicle: () => {},
  switchVehicle: () => {},
});

export function VehicleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicle, setVehicleState] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = async () => {
    if (!user) {
      setVehicles([]);
      setVehicleState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const all = await getAllVehiclesByUserId(user.id);
      setVehicles(all);
      const savedId = (() => { try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; } })();
      const active = all.find((v) => v.id === savedId) ?? all[0] ?? null;
      setVehicleState(active);
      if (active) {
        try { localStorage.setItem(ACTIVE_KEY, active.id); } catch {}
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, [user?.id]);

  function setVehicle(v: Vehicle) {
    setVehicleState(v);
    try { localStorage.setItem(ACTIVE_KEY, v.id); } catch {}
  }

  function switchVehicle(id: string) {
    const v = vehicles.find((v) => v.id === id);
    if (v) setVehicle(v);
  }

  return (
    <VehicleContext.Provider value={{ vehicle, vehicles, loading, error, refetch: fetchVehicles, setVehicle, switchVehicle }}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicle() {
  return useContext(VehicleContext);
}
