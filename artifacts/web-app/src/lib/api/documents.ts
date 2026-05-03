import { supabase } from "@/lib/supabase";

export interface Document {
  id: string;
  user_id: string;
  vehicle_id: string;
  type: string;
  file_url: string;
  created_at: string;
}

export async function getDocumentsByVehicleId(vehicleId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function uploadDocument(
  file: File,
  userId: string,
  vehicleId: string,
  type: string
): Promise<Document> {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${vehicleId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("vehicle-docs")
    .upload(path, file);

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from("vehicle-docs").getPublicUrl(path);

  const { data, error } = await supabase
    .from("documents")
    .insert({ user_id: userId, vehicle_id: vehicleId, type, file_url: urlData.publicUrl })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDocument(documentId: string): Promise<void> {
  const { error } = await supabase.from("documents").delete().eq("id", documentId);
  if (error) throw error;
}
