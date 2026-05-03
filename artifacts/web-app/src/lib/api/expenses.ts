import { supabase } from "@/lib/supabase";

export interface Expense {
  id: string;
  user_id: string;
  vehicle_id: string;
  type: string;
  amount: number;
  description: string | null;
  receipt_url: string | null;
  created_at: string;
}

export interface CreateExpenseData {
  user_id: string;
  vehicle_id: string;
  type: string;
  amount: number;
  description?: string;
  receipt_url?: string;
}

export async function getExpensesByVehicleId(vehicleId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addExpense(expenseData: CreateExpenseData): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .insert(expenseData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteExpense(expenseId: string): Promise<void> {
  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
  if (error) throw error;
}
