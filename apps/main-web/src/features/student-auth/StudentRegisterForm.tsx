"use client";

import { ArrowLeft, ArrowRight, CircleNotch, Student } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { StudentAuthShell } from "./StudentAuthShell";
import { StudentFormNotice } from "./StudentFormNotice";
import { StudentPasswordField } from "./StudentPasswordField";
import { StudentSocialButtons } from "./StudentSocialButtons";
import { useStudentSession } from "./StudentSessionProvider";

type FieldErrors = Partial<Record<"fullName" | "email" | "password" | "confirmPassword", string>>;

export function StudentRegisterForm() {
  const { isConfigured, signInWithOAuth, signUp } = useStudentSession();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const nextErrors: FieldErrors = {};
    if (fullName.trim().length < 2) nextErrors.fullName = "Vui lòng nhập họ và tên đầy đủ.";
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = "Vui lòng nhập email hợp lệ.";
    if (password.length < 8) nextErrors.password = "Mật khẩu cần có ít nhất 8 ký tự.";
    if (confirmPassword !== password) nextErrors.confirmPassword = "Mật khẩu xác nhận chưa khớp.";
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!validate()) return;
    setSubmitting(true);
    const result = await signUp(fullName, email.trim(), password);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    if (result.status === "confirmation") {
      window.sessionStorage.setItem("student.pendingConfirmationEmail", email.trim());
      router.replace("/student/login?registered=true");
      return;
    }
    router.replace("/student/reading?welcome=true");
  }

  async function authenticateWith(provider: "google" | "facebook") {
    setError("");
    setSubmitting(true);
    const failure = await signInWithOAuth(provider, "/student/reading?welcome=true");
    if (failure) {
      setError(failure);
      setSubmitting(false);
    }
  }

  return <StudentAuthShell>
    <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-sm font-bold text-[var(--text-muted)] transition hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)]">
      <ArrowLeft size={18} aria-hidden="true" /> Về trang chủ
    </Link>

    <header className="mt-4">
      <div className="grid size-11 place-items-center rounded-xl bg-[var(--brand-pink-soft)] text-[var(--brand-pink)]"><Student size={23} weight="fill" aria-hidden="true" /></div>
      <p className="mt-4 text-sm font-bold text-[var(--brand-pink)]">Tài khoản học viên</p>
      <h1 className="mt-1 font-display text-4xl font-extrabold tracking-[-0.035em] text-[var(--text)] sm:text-[2.65rem]">Bắt đầu học cùng Spells</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Tạo tài khoản để nhận bài và lưu tiến độ học tập của bạn.</p>
    </header>

    {!isConfigured ? <StudentFormNotice kind="error">Ứng dụng chưa có cấu hình Supabase để đăng ký.</StudentFormNotice> : null}
    {error ? <StudentFormNotice kind="error">{error}</StudentFormNotice> : null}

    <StudentSocialButtons disabled={!isConfigured || submitting} onSelect={(provider) => void authenticateWith(provider)} />
    <div className="my-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-[#aaa2a5]"><span className="h-px flex-1 bg-[var(--border)]" /><span>hoặc dùng email</span><span className="h-px flex-1 bg-[var(--border)]" /></div>

    <form className="space-y-3.5" onSubmit={submit} noValidate>
      <div>
        <label htmlFor="register-name" className="mb-1.5 block text-sm font-bold text-[var(--text)]">Họ và tên</label>
        <input id="register-name" type="text" autoComplete="name" maxLength={150} value={fullName} onChange={(event) => setFullName(event.target.value)} required disabled={!isConfigured || submitting} aria-invalid={Boolean(fieldErrors.fullName)} aria-describedby={fieldErrors.fullName ? "register-name-error" : undefined} className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-base text-[var(--text)] outline-none transition focus:border-[var(--brand-pink)] focus:ring-2 focus:ring-[var(--brand-pink-soft)] disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)]" />
        {fieldErrors.fullName ? <p id="register-name-error" className="mt-1.5 text-sm text-[var(--danger)]">{fieldErrors.fullName}</p> : null}
      </div>
      <div>
        <label htmlFor="register-email" className="mb-1.5 block text-sm font-bold text-[var(--text)]">Email</label>
        <input id="register-email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={!isConfigured || submitting} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "register-email-error" : undefined} className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-base text-[var(--text)] outline-none transition focus:border-[var(--brand-pink)] focus:ring-2 focus:ring-[var(--brand-pink-soft)] disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)]" />
        {fieldErrors.email ? <p id="register-email-error" className="mt-1.5 text-sm text-[var(--danger)]">{fieldErrors.email}</p> : null}
      </div>
      <StudentPasswordField id="register-password" label="Mật khẩu" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required disabled={!isConfigured || submitting} error={fieldErrors.password} />
      <StudentPasswordField id="register-confirm-password" label="Xác nhận mật khẩu" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required disabled={!isConfigured || submitting} error={fieldErrors.confirmPassword} />
      <button type="submit" disabled={!isConfigured || submitting} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-pink)] px-4 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(139,76,91,0.18)] transition hover:bg-[#cc7d8c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
        {submitting ? <CircleNotch size={20} className="animate-spin" aria-hidden="true" /> : <ArrowRight size={20} weight="bold" aria-hidden="true" />}
        {submitting ? "Đang tạo tài khoản" : "Tạo tài khoản"}
      </button>
    </form>

    <p className="mt-5 text-center text-sm text-[var(--text-muted)]">Đã có tài khoản? <Link href="/student/login" className="font-extrabold text-[var(--brand-pink)] underline decoration-transparent underline-offset-4 transition hover:decoration-current">Đăng nhập</Link></p>
  </StudentAuthShell>;
}
