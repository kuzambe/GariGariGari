/* Local reminders store (localStorage backed).
 * Keeps the parser feature self-contained — no DB schema change required.
 */

export interface Reminder {
  id: string;
  vehicle_id: string;
  title: string;
  due_date: string;        // ISO yyyy-mm-dd
  source?: string;         // e.g. "insurance", "service"
  created_at: string;
}

const KEY = (vehicleId: string) => `gari_reminders_${vehicleId}`;

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getReminders(vehicleId: string): Reminder[] {
  try {
    const raw = localStorage.getItem(KEY(vehicleId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReminder(vehicleId: string, r: Omit<Reminder, "id" | "vehicle_id" | "created_at">): Reminder {
  const list = getReminders(vehicleId);
  const reminder: Reminder = {
    id: uid(),
    vehicle_id: vehicleId,
    created_at: new Date().toISOString(),
    ...r,
  };
  list.push(reminder);
  try {
    localStorage.setItem(KEY(vehicleId), JSON.stringify(list));
  } catch {
    /* quota / privacy mode — ignore silently */
  }
  return reminder;
}

export function deleteReminder(vehicleId: string, id: string): void {
  const list = getReminders(vehicleId).filter((r) => r.id !== id);
  try {
    localStorage.setItem(KEY(vehicleId), JSON.stringify(list));
  } catch {
    /* ignore */
  }
}
