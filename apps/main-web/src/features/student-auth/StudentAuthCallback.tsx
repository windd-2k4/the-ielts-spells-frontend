"use client";

import { ArrowRight, CircleNotch, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { MainWebBackdrop } from "./MainWebBackdrop";
import styles from "./ModernAuth.module.css";
import { useStudentSession } from "./StudentSessionProvider";

function destination(value: string | null) {
  return value?.startsWith("/student/") &&
    !value.startsWith("/student/login") &&
    !value.startsWith("/student/register") &&
    !value.startsWith("/student/auth")
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

      const fullName =
        typeof data.session.user.user_metadata?.full_name === "string"
          ? data.session.user.user_metadata.full_name
          : typeof data.session.user.user_metadata?.name === "string"
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

  return (
    <main className={styles.pageWrapper}>
      {/* 1. Main Web blurred in background */}
      <MainWebBackdrop />

      {/* 2. Frosted glass dark overlay */}
      <div className={styles.backdropOverlay} aria-hidden="true" />

      {/* 3. Top navigation bar */}
      <header className={styles.topNav}>
        <Link href="/" className={styles.backLink}>
          <span>← Về trang chủ</span>
        </Link>
        <Link href="/" className={styles.brandLink}>
          <img src="/logo-spells.png" alt="" className={styles.brandLogo} />
          <span>The IELTS Spells</span>
        </Link>
      </header>

      {/* 4. Perfectly centered single modern card */}
      <div className={styles.singleCardContainer}>
        <div className="flex flex-col items-center text-center">
          {/* Logo with illuminated halo aura */}
          <div className={styles.sideLogoWrapper}>
            <div className={styles.logoAura} aria-hidden="true" />
            <img
              src="/logo-spells.png"
              alt="The IELTS Spells Logo"
              className={styles.sideLogo}
            />
          </div>

          <div className={styles.formBadge} style={{ marginTop: 8 }}>
            <span>Cổng học viên</span>
          </div>

          <h1 className={styles.formTitle} style={{ fontSize: "1.75rem", marginTop: 4 }}>
            {error ? "Chưa thể hoàn tất" : "Đang chuẩn bị tài khoản"}
          </h1>

          <p className={styles.formSubtitle} style={{ marginTop: 8, maxWidth: "340px" }}>
            {error || "Vui lòng chờ trong giây lát. Bạn sẽ được chuyển tới khu vực học tập."}
          </p>

          {!error ? (
            <div className="mt-8 flex flex-col items-center gap-3">
              <CircleNotch size={36} className="animate-spin text-[#b85c72]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#9d9195]">
                Đang đồng bộ dữ liệu học viên...
              </span>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-xl bg-[#fee2e2] px-4 py-2.5 text-xs font-bold text-[#b91c1c]">
                <WarningCircle size={18} weight="fill" />
                <span>{error}</span>
              </div>
              <Link
                href="/student/login"
                className={styles.submitBtn}
                style={{
                  textDecoration: "none",
                  display: "inline-flex",
                  width: "auto",
                  padding: "0 28px",
                }}
              >
                <span>Quay lại đăng nhập</span>
                <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 5. Footer */}
      <footer className={styles.footerText}>
        <span>Cần hỗ trợ? </span>
        <a href="mailto:support@theieltssspells.vn" className={styles.supportLink}>
          Liên hệ trung tâm
        </a>
      </footer>
    </main>
  );
}
