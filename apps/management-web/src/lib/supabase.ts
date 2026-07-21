import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Capture this before createClient consumes and clears the implicit-flow hash.
export const isInvitationCallback = new URLSearchParams(
  window.location.hash.replace(/^#/, ""),
).get("type") === "invite";

const REMEMBER_KEY = "ielts-spells-remember-session";

export function shouldRememberSession() {
  return localStorage.getItem(REMEMBER_KEY) !== "false";
}

export function setRememberSession(remember: boolean) {
  localStorage.setItem(REMEMBER_KEY, String(remember));
  const source = remember ? sessionStorage : localStorage;
  const target = remember ? localStorage : sessionStorage;
  for (let index = source.length - 1; index >= 0; index -= 1) {
    const key = source.key(index);
    if (key?.startsWith("sb-") && key.endsWith("-auth-token")) {
      const value = source.getItem(key);
      if (value !== null) target.setItem(key, value);
      source.removeItem(key);
    }
  }
}

const authStorage = {
  getItem: (key: string) => (shouldRememberSession() ? localStorage : sessionStorage).getItem(key),
  setItem(key: string, value: string) {
    const target = shouldRememberSession() ? localStorage : sessionStorage;
    const other = shouldRememberSession() ? sessionStorage : localStorage;
    target.setItem(key, value);
    other.removeItem(key);
  },
  removeItem(key: string) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      persistSession: true,
      storage: authStorage,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
