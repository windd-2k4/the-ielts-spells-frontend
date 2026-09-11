import type { Session } from "@supabase/supabase-js";
import type { UserRole } from "@ielts/contracts";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { isUserRole } from "./roles";

type AuthContextValue = {
  session: Session | null;
  roles: UserRole[];
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setRoles(readRoles(data.session));
        setIsLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setRoles(readRoles(nextSession));
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session, roles,
    isLoading,
    signOut: async () => {
      await supabase.auth.signOut();
    },
  }), [session, roles, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function readRoles(session: Session | null): UserRole[] {
  if (!session) return [];
  try {
    const encodedPayload = session.access_token.split(".")[1];
    const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded));
    const claim = payload.user_roles ?? payload.user_role;

    if (Array.isArray(claim)) {
      return normalizeRoles(claim);
    }
    if (typeof claim === "string" && claim.trim()) {
      return normalizeRoles(claim.split(","));
    }
    return [];
  } catch { return []; }
}

function normalizeRoles(values: unknown[]): UserRole[] {
  return [...new Set(values
    .map(String)
    .map((role) => role.trim().toLowerCase())
    .filter(isUserRole))];
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
