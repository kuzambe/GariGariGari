import { getConfigErrors } from "@/lib/supabase";
import { AlertTriangle } from "lucide-react";

export function SupabaseConfigAlert() {
  const errors = getConfigErrors();
  if (errors.length === 0) return null;

  return (
    <div className="w-full rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-2">
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle size={15} />
        <p className="text-xs font-semibold">Supabase configuration error</p>
      </div>
      <ul className="space-y-1">
        {errors.map((e) => (
          <li key={e.field} className="text-xs text-destructive/80">
            <span className="font-mono font-semibold">{e.field}</span>: {e.message}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground">
        Go to your Supabase project → <strong>Project Settings → API</strong> and copy the{" "}
        <strong>Project URL</strong> and <strong>anon public</strong> key, then update your Replit
        Secrets.
      </p>
    </div>
  );
}
