"use client";

import { ArrowLeft, CircleNotch, LockKey, SignIn, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useStudentSession } from "./StudentSessionProvider";

function destination(value: string | null) {
  return value?.startsWith("/student/") ? value : "/student/reading";
}

export function StudentLoginForm() {
  const { isConfigured, isLoading, session, signIn } = useStudentSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = destination(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && session) {
      router.replace(next);
    }
  }, [isLoading, next, router, session]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const failure = await signIn(email, password);
    setSubmitting(false);
    if (failure) {
      setError(failure);
    }
  }

  return <main className="grid min-h-dvh bg-[var(--surface-muted)] px-4 py-8 sm:px-6">
    <section className="mx-auto flex w-full max-w-md flex-col self-center rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-8">
      <Link href="/" className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold text-[var(--text-muted)] transition hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)] focus-visible:ring-offset-2">
        <ArrowLeft size={18} aria-hidden="true" />
        Về trang chủ
      </Link>
      <div className="mt-8 grid size-12 place-items-center rounded-[var(--radius-sm)] bg-[var(--brand-pink-soft)] text-[var(--brand-pink)]">
        <LockKey size={24} weight="fill" aria-hidden="true" />
      </div>
      <p className="mt-5 text-sm font-semibold text-[var(--brand-pink)]">Cổng học viên</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--text)]">Làm bài Reading</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">Đăng nhập bằng tài khoản học viên để mở bài được giao và tiếp tục bài đang làm.</p>

      {!isConfigured ? <p className="mt-6 rounded-[var(--radius-sm)] border border-[var(--danger)] bg-[var(--surface-muted)] p-4 text-sm leading-6 text-[var(--danger)]" role="alert">Ứng dụng chưa có cấu hình Supabase để đăng nhập.</p> : null}
      {error ? <p className="mt-6 flex items-start gap-2 rounded-[var(--radius-sm)] border border-[var(--danger)] bg-[var(--surface-muted)] p-4 text-sm leading-6 text-[var(--danger)]" role="alert"><WarningCircle size={19} className="mt-0.5 shrink-0" weight="fill" aria-hidden="true" />{error}</p> : null}

      <form className="mt-6 space-y-5" onSubmit={submit}>
        <div>
          <label htmlFor="student-email" className="mb-2 block text-sm font-semibold text-[var(--text)]">Email</label>
          <input id="student-email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={!isConfigured || submitting} className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-base text-[var(--text)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-pink)] focus:ring-2 focus:ring-[var(--brand-pink-soft)] disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)]" />
        </div>
        <div>
          <label htmlFor="student-password" className="mb-2 block text-sm font-semibold text-[var(--text)]">Mật khẩu</label>
          <input id="student-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={!isConfigured || submitting} className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-base text-[var(--text)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-pink)] focus:ring-2 focus:ring-[var(--brand-pink-soft)] disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)]" />
        </div>
        <button type="submit" disabled={!isConfigured || submitting} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--brand-pink)] px-4 text-sm font-bold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? <CircleNotch size={19} className="animate-spin" aria-hidden="true" /> : <SignIn size={19} aria-hidden="true" />}
          {submitting ? "Đang đăng nhập" : "Đăng nhập"}
        </button>
      </form>
    </section>
  </main>;
}
