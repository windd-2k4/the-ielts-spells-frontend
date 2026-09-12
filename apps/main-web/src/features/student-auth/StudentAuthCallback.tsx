"use client";

import { ArrowRight, CircleNotch, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { StudentAuthShell } from "./StudentAuthShell";
import { useStudentSession } from "./StudentSessionProvider";

function destination(value: string | null) {
  return value?.startsWith("/student/")
    && !value.startsWith("/student/login")
    && !value.startsWith("/student/register")
    && !value.startsWith("/student/auth")
    ? value
    : "/student/reading";
}

export function StudentAuthCallback() {
  const { completeOnboarding } = useStudentSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = destination(searchParams.get("next"));
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function completeAuth() {
      if (searchParams.get("error")) {
        setError("Đăng nhập qua tài khoản liên kết chưa hoàn tất. Vui lòng thử lại.");
        return;
      }
      const code = searchParams.get("code");
      let { data } = await supabase.auth.getSession();
      if (!data.session && code) {
        const exchange = await supabase.auth.exchangeCodeForSession(code);
        if (exchange.error) {
          if (mounted) setError("Liên kết xác thực không hợp lệ hoặc đã hết hạn.");
          return;
        }
        data = exchange.data;
      }
      if (!data.session) {
        if (mounted) setError("Không tìm thấy phiên đăng nhập. Vui lòng thử lại.");
        return;
      }

      const fullName = typeof data.session.user.user_metadata.full_name === "string"
        ? data.session.user.user_metadata.full_name
        : typeof data.session.user.user_metadata.name === "string"
          ? data.session.user.user_metadata.name
          : undefined;
      const failure = await completeOnboarding(fullName);
      if (!mounted) return;
      if (failure) {
        await supabase.auth.signOut();
        setError(failure);
        return;
      }
      router.replace(next);
    }
    void completeAuth();
    return () => {
      mounted = false;
    };
  }, [completeOnboarding, next, router, searchParams]);

  return <StudentAuthShell>
    <div className="py-16 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--brand-pink-soft)] text-[var(--brand-pink)]">
        {error ? <WarningCircle size={28} weight="fill" aria-hidden="true" /> : <CircleNotch size={28} className="animate-spin" aria-hidden="true" />}
      </div>
      <p className="mt-6 text-sm font-bold text-[var(--brand-pink)]">Cổng học viên</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-[var(--text)]">{error ? "Chưa thể hoàn tất" : "Đang chuẩn bị tài khoản"}</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{error || "Vui lòng chờ trong giây lát. Bạn sẽ được chuyển tới khu vực học tập."}</p>
      {error ? <Link href="/student/login" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--brand-pink)] px-5 text-sm font-extrabold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)] focus-visible:ring-offset-2">Quay lại đăng nhập <ArrowRight size={19} weight="bold" aria-hidden="true" /></Link> : null}
    </div>
  </StudentAuthShell>;
}
