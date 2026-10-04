"use client";

import { ApiClientError } from "@ielts/api-client";
import { ArrowLeft, ArrowRight, CheckCircle, CircleNotch, Key } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { StudentAuthShell } from "./StudentAuthShell";
import { StudentFormNotice } from "./StudentFormNotice";
import { StudentPasswordField } from "./StudentPasswordField";

type Verification = {
  valid: boolean;
  customerName: string;
  customerEmail: string;
  courseId?: string;
  courseTitle: string;
  message: string;
};

type ActivationResult = {
  success: boolean;
  message: string;
  email: string;
  redirectUrl: string;
};

function errorMessage(error: unknown) {
  if (error instanceof ApiClientError) return error.message;
  return "Không thể xử lý liên kết kích hoạt lúc này. Vui lòng thử lại.";
}

export function StudentActivationForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token")?.trim() || "";
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<ActivationResult | null>(null);

  useEffect(() => {
    let active = true;
    if (!token) {
      setVerification({ valid: false, customerName: "", customerEmail: "", courseTitle: "", message: "Liên kết kích hoạt thiếu mã xác thực." });
      setLoading(false);
      return;
    }
    apiFetch<Verification>(`/auth/verify-activation-token?token=${encodeURIComponent(token)}`)
      .then((result) => {
        if (active) setVerification(result);
      })
      .catch((reason) => {
        if (active) setError(errorMessage(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Mật khẩu cần có ít nhất 8 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận chưa khớp.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiFetch<ActivationResult>("/auth/activate-account", {
        method: "POST",
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      setSuccess(result);
      if (isSupabaseConfigured) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: result.email, password });
        if (!signInError) {
          router.replace(result.redirectUrl || "/student/courses");
          return;
        }
      }
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setSubmitting(false);
    }
  }

  return <StudentAuthShell>
    <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-sm font-bold text-[var(--text-muted)] transition hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)]">
      <ArrowLeft size={18} aria-hidden="true" /> Về trang chủ
    </Link>

    <header className="mt-4">
      <div className="grid size-11 place-items-center rounded-xl bg-[var(--brand-pink-soft)] text-[var(--brand-pink)]"><Key size={23} weight="fill" aria-hidden="true" /></div>
      <p className="mt-4 text-sm font-bold text-[var(--brand-pink)]">Thanh toán đã được xác nhận</p>
      <h1 className="mt-1 font-display text-4xl font-extrabold tracking-[-0.035em] text-[var(--text)]">Kích hoạt tài khoản</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Tạo mật khẩu để mở quyền học cho khóa bạn đã thanh toán.</p>
    </header>

    {loading ? <div className="mt-6 flex items-center gap-3 text-sm font-semibold text-[var(--text-muted)]"><CircleNotch size={20} className="animate-spin" /> Đang kiểm tra liên kết...</div> : null}
    {error ? <StudentFormNotice kind="error">{error}</StudentFormNotice> : null}

    {!loading && verification && !verification.valid ? <StudentFormNotice kind="error">{verification.message}</StudentFormNotice> : null}

    {!loading && verification?.valid && !success ? <>
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm leading-6">
        <p className="font-extrabold text-[var(--text)]">{verification.customerName}</p>
        <p className="text-[var(--text-muted)]">{verification.customerEmail}</p>
        <p className="mt-2 text-[var(--text-muted)]">Khóa học: <strong className="text-[var(--text)]">{verification.courseTitle}</strong></p>
        <span className="mt-3 inline-flex rounded-full bg-[#fff4dc] px-3 py-1 text-xs font-extrabold text-[#956214]">Chờ kích hoạt</span>
      </div>

      <form className="mt-5 space-y-3.5" onSubmit={submit} noValidate>
        <StudentPasswordField id="activation-password" label="Mật khẩu mới" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required disabled={submitting} />
        <StudentPasswordField id="activation-confirm-password" label="Xác nhận mật khẩu" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required disabled={submitting} />
        <button type="submit" disabled={submitting} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-pink)] px-4 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(139,76,91,0.18)] transition hover:bg-[#cc7d8c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? <CircleNotch size={20} className="animate-spin" aria-hidden="true" /> : <ArrowRight size={20} weight="bold" aria-hidden="true" />}
          {submitting ? "Đang kích hoạt" : "Kích hoạt và vào học"}
        </button>
      </form>
    </> : null}

    {success ? <div className="mt-6 text-center">
      <CheckCircle size={48} weight="fill" className="mx-auto text-[#2b8a68]" aria-hidden="true" />
      <h2 className="mt-3 text-xl font-extrabold text-[var(--text)]">Tài khoản đã được kích hoạt</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{success.message}</p>
      <Link href="/student/login" className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--brand-pink)] px-4 text-sm font-extrabold text-white">Đăng nhập để vào học</Link>
    </div> : null}
  </StudentAuthShell>;
}
