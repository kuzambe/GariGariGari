import { createClient } from "@supabase/supabase-js";

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string) ?? "";
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? "";

// Normalise: strip any path segments (e.g. /rest/v1, /auth/v1), trailing slashes, and whitespace
// so the user can paste any Supabase URL and we'll extract the project root automatically
function normaliseSupabaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  try {
    const parsed = new URL(trimmed);
    // Keep only origin (scheme + host), drop any path
    return parsed.origin;
  } catch {
    return trimmed;
  }
}

const supabaseUrl = normaliseSupabaseUrl(rawUrl);

export type ConfigError = { field: string; message: string };

export function getConfigErrors(): ConfigError[] {
  const errors: ConfigError[] = [];

  if (!supabaseUrl) {
    errors.push({ field: "VITE_SUPABASE_URL", message: "Missing — not set in Secrets." });
  } else if (!supabaseUrl.startsWith("https://")) {
    errors.push({
      field: "VITE_SUPABASE_URL",
      message: `Must start with https://  (got: "${supabaseUrl.slice(0, 40)}")`,
    });
  } else if (!supabaseUrl.includes(".supabase.co")) {
    errors.push({
      field: "VITE_SUPABASE_URL",
      message: `Doesn't look like a Supabase URL. Expected: https://xxxx.supabase.co`,
    });
  } else {
    // Catch URLs with extra path segments like /rest/v1 or /auth/v1
    try {
      const parsed = new URL(supabaseUrl);
      if (parsed.pathname && parsed.pathname !== "/") {
        errors.push({
          field: "VITE_SUPABASE_URL",
          message: `Should be just the project root — no extra path. Got: "${supabaseUrl}". Expected: "https://${parsed.host}"`,
        });
      }
    } catch {
      // already caught above
    }
  }

  if (!supabaseAnonKey) {
    errors.push({ field: "VITE_SUPABASE_ANON_KEY", message: "Missing — not set in Secrets." });
  } else if (!supabaseAnonKey.startsWith("eyJ")) {
    errors.push({
      field: "VITE_SUPABASE_ANON_KEY",
      message: "Doesn't look like a valid anon key (should start with eyJ…).",
    });
  }

  return errors;
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);
