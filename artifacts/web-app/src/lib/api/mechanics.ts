import { supabase } from "@/lib/supabase";

export interface Mechanic {
  id: string;
  user_id: string;
  vehicle_id: string;
  name: string;
  shop_name: string | null;
  phone: string | null;
  address: string | null;
  hours: string | null;
  notes: string | null;
  created_at: string;
}

export interface MechanicData {
  user_id: string;
  vehicle_id: string;
  name: string;
  shop_name?: string;
  phone?: string;
  address?: string;
  hours?: string;
  notes?: string;
}

export async function getMechanicByVehicleId(vehicleId: string): Promise<Mechanic | null> {
  const { data, error } = await supabase
    .from("mechanics")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createMechanic(data: MechanicData): Promise<Mechanic> {
  const { data: result, error } = await supabase
    .from("mechanics")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function updateMechanic(id: string, data: Partial<MechanicData>): Promise<Mechanic> {
  const { data: result, error } = await supabase
    .from("mechanics")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function deleteMechanic(id: string): Promise<void> {
  const { error } = await supabase
    .from("mechanics")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
