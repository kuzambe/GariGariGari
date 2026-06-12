/* ──────────────────────────────────────────────────────────────
 * Shared post-confirmation actions for parsed documents.
 *
 * Used by BOTH the documents add flow (Dashboard) and the floating
 * scan button so smart-scan routing behaves identically everywhere:
 *   - mechanic invoice → maintenance expense (+ oil-change reminder)
 *   - insurance        → 30-day & 7-day renewal reminders
 *   - registration     → fill missing plate (+ renewal reminder)
 *   - receipt          → categorized expense
 *   - unknown / empty  → no side effects (document is still saved)
 *
 * Pure side effects on success; never throws — returns the count of
 * actions that succeeded so callers can show "N actions taken".
 * ────────────────────────────────────────────────────────────── */

import { addExpense } from "@/lib/api/expenses";
import { updateVehicle } from "@/lib/api/vehicles";
import { saveReminder } from "@/lib/reminders";
import { addDays, formatDate } from "@/lib/documentParser";
import type { ConfirmedDocument } from "@/components/documents/ParsedDocumentSheet";

export interface ParsedActionContext {
  userId: string;
  vehicleId: string;
  /** Current plate on the vehicle, used to decide whether to backfill it. */
  existingPlate?: string | null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function applyParsedActions(
  parsed: ConfirmedDocument,
  ctx: ParsedActionContext,
): Promise<number> {
  if (parsed.skipActions) return 0;

  const f = parsed.fields;
  const { userId, vehicleId } = ctx;
  let actionCount = 0;

  try {
    // Service date in ISO form, used for both expenses and reminders.
    const serviceDateIso = f.date && ISO_DATE.test(f.date) ? f.date : undefined;
    const expenseCreatedAt = serviceDateIso
      ? new Date(`${serviceDateIso}T00:00:00Z`).toISOString()
      : undefined;

    if (parsed.type === "mechanic_invoice") {
      const amount = parseFloat(f.amount || "");
      if (Number.isFinite(amount) && amount > 0) {
        const description = [f.shopName, f.services].filter(Boolean).join(" — ");
        await addExpense({
          user_id: userId,
          vehicle_id: vehicleId,
          type: "maintenance",
          amount,
          description: description || undefined,
          ...(expenseCreatedAt ? { created_at: expenseCreatedAt } : {}),
        });
        actionCount++;
      }
      if (f.services && /oil change/i.test(f.services)) {
        const baseDate = serviceDateIso ?? new Date().toISOString().slice(0, 10);
        const due = addDays(baseDate, 180);
        if (due) {
          saveReminder(vehicleId, { title: "Oil change due (6 months / 5,000 km)", due_date: due, source: "service" });
          actionCount++;
        }
      }
    } else if (parsed.type === "insurance") {
      if (f.expiryDate && ISO_DATE.test(f.expiryDate)) {
        const provider = f.provider || "Insurance";
        const d30 = addDays(f.expiryDate, -30);
        const d7 = addDays(f.expiryDate, -7);
        if (d30) { saveReminder(vehicleId, { title: `Insurance renewal due in 30 days — ${provider}`, due_date: d30, source: "insurance" }); actionCount++; }
        if (d7) { saveReminder(vehicleId, { title: `Insurance expires in 7 days — renew now`, due_date: d7, source: "insurance" }); actionCount++; }
      }
    } else if (parsed.type === "registration") {
      if (f.plateNumber && !ctx.existingPlate) {
        try { await updateVehicle(vehicleId, { license_plate: f.plateNumber }); actionCount++; } catch { /* silent */ }
      }
      if (f.expiryDate && ISO_DATE.test(f.expiryDate)) {
        const d30 = addDays(f.expiryDate, -30);
        if (d30) { saveReminder(vehicleId, { title: `Registration renewal due — ${formatDate(f.expiryDate)}`, due_date: d30, source: "registration" }); actionCount++; }
      }
    } else if (parsed.type === "receipt") {
      const amount = parseFloat(f.amount || "");
      if (Number.isFinite(amount) && amount > 0) {
        await addExpense({
          user_id: userId,
          vehicle_id: vehicleId,
          type: (f.category || "Other").toLowerCase(),
          amount,
          description: f.merchant || undefined,
          ...(expenseCreatedAt ? { created_at: expenseCreatedAt } : {}),
        });
        actionCount++;
      }
    }
  } catch {
    /* never surface raw errors — just count what succeeded */
  }

  return actionCount;
}

/** Map a confirmed parser type to the existing Supabase `documents.type`. */
export function storageTypeForParsed(parsed: ConfirmedDocument): string {
  if (parsed.type === "mechanic_invoice" || parsed.type === "receipt") return "service";
  if (parsed.type === "insurance") return "insurance";
  if (parsed.type === "registration") return "registration";
  return "other";
}
