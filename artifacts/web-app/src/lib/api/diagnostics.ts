import { supabase } from "@/lib/supabase";

export interface DiagnosticIssue {
  id: string;
  user_id: string;
  vehicle_id: string;
  type: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  date_noticed: string | null;
  date_resolved: string | null;
  created_at: string;
}

export interface CreateDiagnosticIssueData {
  user_id: string;
  vehicle_id: string;
  type?: string;
  title: string;
  description?: string;
  severity?: string;
  status?: string;
  date_noticed?: string;
}

export async function getDiagnosticIssuesByVehicleId(vehicleId: string): Promise<DiagnosticIssue[]> {
  const { data, error } = await supabase
    .from("diagnostics")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createDiagnosticIssue(issueData: CreateDiagnosticIssueData): Promise<DiagnosticIssue> {
  const { data, error } = await supabase
    .from("diagnostics")
    .insert(issueData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function resolveDiagnosticIssue(id: string): Promise<DiagnosticIssue> {
  const { data, error } = await supabase
    .from("diagnostics")
    .update({
      status: "resolved",
      date_resolved: new Date().toISOString().slice(0, 10),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDiagnosticIssue(id: string): Promise<void> {
  const { error } = await supabase.from("diagnostics").delete().eq("id", id);
  if (error) throw error;
}
