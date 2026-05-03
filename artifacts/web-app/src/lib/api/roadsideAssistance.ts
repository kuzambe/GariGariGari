import { supabase } from "@/lib/supabase";

export interface RoadsideAssistance {
  id: string;
  user_id: string;
  provider_name: string;
  member_number: string | null;
  phone: string | null;
  coverage_notes: string | null;
  created_at: string;
}

export interface RoadsideData {
  user_id: string;
  provider_name: string;
  member_number?: string;
  phone?: string;
  coverage_notes?: string;
}

export async function getRoadsideByUserId(userId: string): Promise<RoadsideAssistance | null> {
  const { data, error } = await supabase
    .from("roadside_assistance")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createRoadside(data: RoadsideData): Promise<RoadsideAssistance> {
  const { data: result, error } = await supabase
    .from("roadside_assistance")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function updateRoadside(
  id: string,
  data: Partial<RoadsideData>
): Promise<RoadsideAssistance> {
  const { data: result, error } = await supabase
    .from("roadside_assistance")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return result;
}
