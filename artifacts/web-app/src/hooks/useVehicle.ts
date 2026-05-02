import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export interface Vehicle {
  id: string;
  user_id: string;
  vin: string;
  make: string;
  model: string;
  year: string;
  trim: string;
  engine: string;
  fuel_type: string;
  body_style: string;
  mileage: number;
  license_plate: string;
  created_at: string;
}

export function useVehicle() {
  const { user } = useAuth();

  return useQuery<Vehicle | null>({
    queryKey: ["vehicle", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        if (error.code === "42P01") return null; // table doesn't exist yet
        throw error;
      }
      return data;
    },
  });
}
