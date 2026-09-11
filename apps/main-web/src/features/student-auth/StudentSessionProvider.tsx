"use client";

import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type StudentSessionContextValue = {
  session: Session | null;
  isConfigured: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<string | undefined>;
  signOut: () => Promise<void>;
};

const StudentSessionContext = createContext<StudentSessionContextValue | undefined>(undefined);

function authErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) {
    return "Email hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Bạn cần xác nhận email trước khi đăng nhập.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Bạn đã thử quá nhiều lần. Vui lòng chờ một chút rồi thử lại.";
  }
  return "Không thể đăng nhập lúc này. Vui lòng thử lại.";
}

export function StudentSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
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
        setIsLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<StudentSessionContextValue>(() => ({
    session,
    isConfigured: isSupabaseConfigured,
    isLoading,
    signIn: async (email, password) => {
      if (!isSupabaseConfigured) {
        return "Chưa cấu hình kết nối đăng nhập cho ứng dụng.";
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? authErrorMessage(error.message) : undefined;
    },
    signOut: async () => {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    },
  }), [isLoading, session]);

  return <StudentSessionContext.Provider value={value}>{children}</StudentSessionContext.Provider>;
}

export function useStudentSession() {
  const context = useContext(StudentSessionContext);
  if (!context) {
    throw new Error("useStudentSession must be used inside StudentSessionProvider");
  }
  return context;
}
