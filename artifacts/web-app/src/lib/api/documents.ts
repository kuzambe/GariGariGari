import { supabase } from "@/lib/supabase";

export interface Document {
  id: string;
  user_id: string;
  vehicle_id: string;
  type: string;
  file_url: string;
  created_at: string;
}

const STORAGE_BUCKET = "vehicle-docs";

function extensionFromFile(file: File): string {
  const nameMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
  if (nameMatch) return nameMatch[1].toLowerCase();
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type.startsWith("image/")) return file.type.split("/")[1];
  return "bin";
}

function storagePathFromUrl(fileUrl: string): string | null {
  const marker = `/object/sign/${STORAGE_BUCKET}/`;
  const idx = fileUrl.indexOf(marker);
  if (idx === -1) return null;
  const after = fileUrl.slice(idx + marker.length);
  const qIdx = after.indexOf("?");
  const path = qIdx === -1 ? after : after.slice(0, qIdx);
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
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
  const ext = extensionFromFile(file);
  const fileId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const path = `${userId}/${vehicleId}/${type}/${fileId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  if (signedUrlError) throw signedUrlError;

  const mimeParam = encodeURIComponent(file.type);
  const fileUrl = `${signedUrlData.signedUrl}&_mime=${mimeParam}`;

  const { data: inserted, error } = await supabase
    .from("documents")
    .insert({ user_id: userId, vehicle_id: vehicleId, type, file_url: fileUrl })
    .select()
    .single();

  if (error) {
    // Best-effort cleanup of uploaded file if DB insert failed
    try {
      await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    } catch {
      /* ignore */
    }
    throw error;
  }

  return inserted;
}

export async function deleteDocumentWithFile(doc: Document): Promise<void> {
  const path = storagePathFromUrl(doc.file_url);

  if (path) {
    try {
      await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    } catch {
      /* ignore storage errors so DB row still gets removed */
    }
  }

  const { error: dbError } = await supabase.from("documents").delete().eq("id", doc.id);
  if (dbError) throw dbError;
}

export async function deleteDocument(documentId: string): Promise<void> {
  const { error } = await supabase.from("documents").delete().eq("id", documentId);
  if (error) throw error;
}
