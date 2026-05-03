import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Vehicle, getVehicleByUserId } from "@/lib/api/vehicles";
import { useAuth } from "@/context/AuthContext";

interface VehicleContextType {
  vehicle: Vehicle | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const VehicleContext = createContext<VehicleContextType>({
  vehicle: null,
  loading: true,
  error: null,
  refetch: () => {},
});

export function VehicleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicle = async () => {
    if (!user) {
      setVehicle(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getVehicleByUserId(user.id);
      setVehicle(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vehicle");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicle();
  }, [user]);

  return (
    <VehicleContext.Provider value={{ vehicle, loading, error, refetch: fetchVehicle }}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicle() {
  return useContext(VehicleContext);
}
