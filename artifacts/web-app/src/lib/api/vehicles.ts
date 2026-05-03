import { supabase } from "@/lib/supabase";

export interface Vehicle {
  id: string;
  user_id: string;
  nickname: string;
  vin: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
  engine: string | null;
  fuel_type: string | null;
  body_style: string | null;
  mileage: number | null;
  license_plate: string | null;
  country: string | null;
  mileage_unit: "km" | "mi";
  paint_name: string | null;
  paint_code: string | null;
  created_at: string;
}

export interface CreateVehicleData {
  user_id: string;
  nickname: string;
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  trim?: string;
  engine?: string;
  fuel_type?: string;
  body_style?: string;
  mileage?: number;
  license_plate?: string;
  country?: string;
  mileage_unit?: "km" | "mi";
  paint_name?: string;
  paint_code?: string;
}

export async function getVehicleByUserId(userId: string): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createVehicle(vehicleData: CreateVehicleData): Promise<Vehicle> {
  const { data, error } = await supabase
    .from("vehicles")
    .insert(vehicleData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVehicle(vehicleId: string, updates: Partial<Vehicle>): Promise<Vehicle> {
  const { data, error } = await supabase
    .from("vehicles")
    .update(updates)
    .eq("id", vehicleId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
