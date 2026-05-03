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

export async function getMechanicByVehicleId(
  vehicleId: string,
  userId?: string,
): Promise<Mechanic | null> {
  let query = supabase
    .from("mechanics")
    .select("*")
    .eq("vehicle_id", vehicleId);

  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("[mechanics] getMechanicByVehicleId failed", error);
    throw error;
  }
  return data && data.length > 0 ? data[0] : null;
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
