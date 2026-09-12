"use client";

import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiClientError } from "@ielts/api-client";
import { apiFetch } from "@/lib/api";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type OAuthProvider = "google" | "facebook";

type SignUpResult = {
  status?: "confirmation" | "signed-in";
  error?: string;
};

type StudentSessionContextValue = {
  session: Session | null;
  isConfigured: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<string | undefined>;
  signUp: (fullName: string, email: string, password: string) => Promise<SignUpResult>;
  signInWithOAuth: (provider: OAuthProvider, next?: string) => Promise<string | undefined>;
  completeOnboarding: (fullName?: string) => Promise<string | undefined>;
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
  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return "Email này đã được sử dụng. Bạn có thể chuyển sang đăng nhập.";
  }
  if (normalized.includes("password")) {
    return "Mật khẩu chưa đáp ứng yêu cầu bảo mật. Vui lòng chọn mật khẩu khác.";
  }
  return "Không thể xác thực tài khoản lúc này. Vui lòng thử lại.";
}

function onboardingErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.status === 409 || error.status === 422) return error.message;
    if (error.status === 401) return "Phiên đăng nhập chưa hợp lệ. Vui lòng đăng nhập lại.";
  }
  return "Không thể hoàn tất hồ sơ học viên. Vui lòng thử lại hoặc liên hệ trung tâm.";
}

function safeStudentDestination(value?: string) {
  return value?.startsWith("/student/") && !value.startsWith("/student/login")
    ? value
    : "/student";
}

async function completeStudentOnboarding(fullName?: string) {
  try {
    await apiFetch("/auth/student/onboarding", {
      method: "POST",
      body: JSON.stringify({ fullName: fullName?.trim() || null }),
    });
    const { error } = await supabase.auth.refreshSession();
    return error ? authErrorMessage(error.message) : undefined;
  } catch (error) {
    return onboardingErrorMessage(error);
  }
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

  const value = useMemo<StudentSessionContextValue>(() => {
    return {
      session,
      isConfigured: isSupabaseConfigured,
      isLoading,
      completeOnboarding: completeStudentOnboarding,
      signIn: async (email, password) => {
        if (!isSupabaseConfigured) {
          return "Chưa cấu hình kết nối đăng nhập cho ứng dụng.";
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return authErrorMessage(error.message);

        const onboardingError = await completeStudentOnboarding(
          typeof data.user.user_metadata.full_name === "string"
            ? data.user.user_metadata.full_name
            : undefined,
        );
        if (onboardingError) {
          await supabase.auth.signOut();
          return onboardingError;
        }
        return undefined;
      },
      signUp: async (fullName, email, password) => {
        if (!isSupabaseConfigured) {
          return { error: "Chưa cấu hình kết nối đăng ký cho ứng dụng." };
        }
        const callbackUrl = `${window.location.origin}/student/auth/callback`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callbackUrl,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) return { error: authErrorMessage(error.message) };
        if (!data.session) return { status: "confirmation" };

        const onboardingError = await completeStudentOnboarding(fullName);
        if (onboardingError) {
          await supabase.auth.signOut();
          return { error: onboardingError };
        }
        return { status: "signed-in" };
      },
      signInWithOAuth: async (provider, next) => {
        if (!isSupabaseConfigured) {
          return "Chưa cấu hình kết nối đăng nhập cho ứng dụng.";
        }
        const callbackUrl = new URL("/student/auth/callback", window.location.origin);
        callbackUrl.searchParams.set("next", safeStudentDestination(next));
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo: callbackUrl.toString() },
        });
        return error ? authErrorMessage(error.message) : undefined;
      },
      signOut: async () => {
        if (isSupabaseConfigured) {
          await supabase.auth.signOut();
        }
      },
    };
  }, [isLoading, session]);

  return <StudentSessionContext.Provider value={value}>{children}</StudentSessionContext.Provider>;
}

export function useStudentSession() {
  const context = useContext(StudentSessionContext);
  if (!context) {
    throw new Error("useStudentSession must be used inside StudentSessionProvider");
  }
  return context;
}
