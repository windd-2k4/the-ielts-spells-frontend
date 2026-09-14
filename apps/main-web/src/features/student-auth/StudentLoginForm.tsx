"use client";

import { ArrowClockwise, ArrowLeft, ArrowRight, CircleNotch, LockKey } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { StudentAuthShell } from "./StudentAuthShell";
import { StudentFormNotice } from "./StudentFormNotice";
import { StudentPasswordField } from "./StudentPasswordField";
import { StudentSocialButtons } from "./StudentSocialButtons";
import { useStudentSession } from "./StudentSessionProvider";

type FieldErrors = Partial<Record<"email" | "password", string>>;

function destination(value: string | null) {
  return value?.startsWith("/student/")
    && !value.startsWith("/student/login")
    && !value.startsWith("/student/register")
    && !value.startsWith("/student/auth")
    ? value
    : "/student";
}

export function StudentLoginForm() {
  const { completeOnboarding, isConfigured, isLoading, resendSignupConfirmation, session, signIn, signInWithOAuth } = useStudentSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = destination(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [resendNotice, setResendNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const authActionStarted = useRef(false);
  const registered = searchParams.get("registered") === "true";

  useEffect(() => {
    if (!registered) return;
    const pendingEmail = window.sessionStorage.getItem("student.pendingConfirmationEmail");
    if (pendingEmail) setEmail(pendingEmail);
  }, [registered]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (isLoading || !session || authActionStarted.current) return;
    authActionStarted.current = true;
    setSubmitting(true);
    const fullName = typeof session.user.user_metadata.full_name === "string"
      ? session.user.user_metadata.full_name
      : undefined;
    void completeOnboarding(fullName).then((failure) => {
      if (failure) {
        setError(failure);
        setSubmitting(false);
        authActionStarted.current = false;
        return;
      }
      router.replace(next);
    });
  }, [completeOnboarding, isLoading, next, router, session]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const nextErrors: FieldErrors = {};
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = "Vui lòng nhập email hợp lệ.";
    if (!password) nextErrors.password = "Vui lòng nhập mật khẩu.";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    authActionStarted.current = true;
    setSubmitting(true);
    const failure = await signIn(email.trim(), password);
    if (failure) {
      setError(failure);
      setSubmitting(false);
      authActionStarted.current = false;
      return;
    }
    router.replace(next);
  }

  async function authenticateWith(provider: "google" | "facebook") {
    setError("");
    authActionStarted.current = true;
    setSubmitting(true);
    const failure = await signInWithOAuth(provider, next);
    if (failure) {
      setError(failure);
      setSubmitting(false);
      authActionStarted.current = false;
    }
  }

  async function resendConfirmation() {
    setError("");
    setResendNotice("");
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setFieldErrors((current) => ({ ...current, email: "Nhập email đã đăng ký để gửi lại thư xác nhận." }));
      return;
    }
    setResending(true);
    const failure = await resendSignupConfirmation(email.trim());
    setResending(false);
    if (failure) {
      setError(failure);
      return;
    }
    window.sessionStorage.setItem("student.pendingConfirmationEmail", email.trim());
    setResendNotice("Đã yêu cầu gửi lại. Hãy kiểm tra cả Hộp thư đến và Thư rác.");
    setResendCooldown(60);
  }

  return <StudentAuthShell compact>
    <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-sm font-bold text-[var(--text-muted)] transition hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)]">
      <ArrowLeft size={18} aria-hidden="true" /> Về trang chủ
    </Link>

    <header className="mt-2">
      <div className="grid size-10 place-items-center rounded-xl bg-[var(--brand-pink-soft)] text-[var(--brand-pink)]"><LockKey size={20} weight="fill" aria-hidden="true" /></div>
      <p className="mt-3 text-sm font-bold text-[var(--brand-pink)]">Cổng học viên</p>
      <h1 className="mt-0.5 font-display text-[2rem] font-extrabold leading-tight tracking-[-0.035em] text-[var(--text)] sm:text-[2.35rem]">Chào mừng trở lại</h1>
      <p className="mt-1.5 text-sm leading-5 text-[var(--text-muted)]">Đăng nhập để mở bài được giao và tiếp tục đúng vị trí bạn đã dừng.</p>
    </header>

    {registered ? <StudentFormNotice compact kind="success">Đăng ký đã được ghi nhận. Hãy xác nhận email trước khi đăng nhập.</StudentFormNotice> : null}
    {resendNotice ? <StudentFormNotice compact kind="success">{resendNotice}</StudentFormNotice> : null}
    {!isConfigured ? <StudentFormNotice compact kind="error">Ứng dụng chưa có cấu hình Supabase để đăng nhập.</StudentFormNotice> : null}
    {error ? <StudentFormNotice compact kind="error">{error}</StudentFormNotice> : null}

    <StudentSocialButtons compact disabled={!isConfigured || submitting} onSelect={(provider) => void authenticateWith(provider)} />
    <div className="my-3 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-[#aaa2a5]"><span className="h-px flex-1 bg-[var(--border)]" /><span>hoặc dùng email</span><span className="h-px flex-1 bg-[var(--border)]" /></div>

    <form className="space-y-3" onSubmit={submit} noValidate>
      <div>
        <label htmlFor="student-email" className="mb-1.5 block text-sm font-bold text-[var(--text)]">Email</label>
        <input id="student-email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => { setEmail(event.target.value); setResendNotice(""); }} placeholder="ban@example.com" required disabled={!isConfigured || submitting} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "student-email-error" : undefined} className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-base text-[var(--text)] outline-none transition placeholder:text-[#aaa2a5] focus:border-[var(--brand-pink)] focus:ring-2 focus:ring-[var(--brand-pink-soft)] disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)]" />
        {fieldErrors.email ? <p id="student-email-error" className="mt-1.5 text-sm text-[var(--danger)]">{fieldErrors.email}</p> : null}
        <button
          type="button"
          onClick={() => void resendConfirmation()}
          disabled={!isConfigured || submitting || resending || resendCooldown > 0}
          className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg text-xs font-bold text-[var(--brand-pink)] transition hover:underline disabled:cursor-not-allowed disabled:text-[#9d9699] disabled:no-underline"
        >
          {resending ? <CircleNotch size={15} className="animate-spin" aria-hidden="true" /> : <ArrowClockwise size={15} weight="bold" aria-hidden="true" />}
          {resending ? "Đang gửi" : resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : "Gửi lại email xác nhận"}
        </button>
      </div>
      <StudentPasswordField compact id="student-password" label="Mật khẩu" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required disabled={!isConfigured || submitting} error={fieldErrors.password} />
      <button type="submit" disabled={!isConfigured || submitting} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-pink)] px-4 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(139,76,91,0.18)] transition hover:-translate-y-px hover:bg-[#ad4c64] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
        {submitting ? <CircleNotch size={20} className="animate-spin" aria-hidden="true" /> : <ArrowRight size={20} weight="bold" aria-hidden="true" />}
        {submitting ? "Đang đăng nhập" : "Đăng nhập"}
      </button>
    </form>

    <p className="mt-4 text-center text-sm text-[var(--text-muted)]">Chưa có tài khoản? <Link href="/student/register" className="font-extrabold text-[var(--brand-pink)] underline decoration-transparent underline-offset-4 transition hover:decoration-current">Đăng ký học viên</Link></p>
  </StudentAuthShell>;
}
