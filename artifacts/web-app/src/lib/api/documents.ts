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
  const path = `${userId}/${vehicleId}/${type}`;

  const { error: uploadError } = await supabase.storage
    .from("vehicle-docs")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from("vehicle-docs")
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  if (signedUrlError) throw signedUrlError;

  const mimeParam = encodeURIComponent(file.type);
  const fileUrl = `${signedUrlData.signedUrl}&_mime=${mimeParam}`;

  const { data: existing } = await supabase
    .from("documents")
    .select("id")
    .eq("vehicle_id", vehicleId)
    .eq("type", type)
    .single();

  let data: Document;

  if (existing) {
    const { data: updated, error } = await supabase
      .from("documents")
      .update({ file_url: fileUrl, created_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    data = updated;
  } else {
    const { data: inserted, error } = await supabase
      .from("documents")
      .insert({ user_id: userId, vehicle_id: vehicleId, type, file_url: fileUrl })
      .select()
      .single();
    if (error) throw error;
    data = inserted;
  }

  return data;
}

export async function deleteDocumentWithFile(
  documentId: string,
  userId: string,
  vehicleId: string,
  type: string
): Promise<DeleteResult> {
  const path = `${userId}/${vehicleId}/${type}`;
  let storageDeleted = false;

  try {
    const { error: removeError } = await supabase.storage
      .from("vehicle-docs")
      .remove([path]);
    storageDeleted = !removeError;
  } catch {
    storageDeleted = false;
  }

  const { error: dbError } = await supabase.from("documents").delete().eq("id", documentId);
  if (dbError) throw dbError;
}

export async function deleteDocument(documentId: string): Promise<void> {
  const { error } = await supabase.from("documents").delete().eq("id", documentId);
  if (error) throw error;
}
