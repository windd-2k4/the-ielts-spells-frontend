"use client";

import { CircleNotch, WarningCircle } from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useStudentSession } from "./StudentSessionProvider";

export function StudentSessionGate({ children }: { children: ReactNode }) {
  const { session, isConfigured, isLoading } = useStudentSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isConfigured && !isLoading && !session) {
      router.replace(`/student/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isConfigured, isLoading, pathname, router, session]);

  if (!isConfigured) {
    return <SessionNotice
      title="Chưa thể mở cổng học viên"
      message="Ứng dụng chưa có cấu hình Supabase. Hãy thêm các biến NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY rồi khởi động lại."
    />;
  }

  if (isLoading || !session) {
    return <main className="grid min-h-dvh place-items-center bg-[var(--surface-muted)] px-4" aria-busy="true">
      <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm font-medium text-[var(--text-muted)] shadow-[var(--shadow)]">
        <CircleNotch size={20} className="animate-spin text-[var(--brand-pink)]" aria-hidden="true" />
        Đang kiểm tra phiên đăng nhập
      </div>
    </main>;
  }

  return <>{children}</>;
}

function SessionNotice({ title, message }: { title: string; message: string }) {
  return <main className="grid min-h-dvh place-items-center bg-[var(--surface-muted)] px-4">
    <section className="w-full max-w-xl rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-[var(--shadow)]" role="alert">
      <WarningCircle size={32} className="mx-auto text-[var(--danger)]" weight="fill" aria-hidden="true" />
      <h1 className="mt-3 text-xl font-bold text-[var(--text)]">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{message}</p>
    </section>
  </main>;
}
