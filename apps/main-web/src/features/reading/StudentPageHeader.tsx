"use client";

import { BookOpenText, House, SignOut } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStudentSession } from "@/features/student-auth/StudentSessionProvider";

export function StudentPageHeader() {
  const { session, signOut } = useStudentSession();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function leave() {
    setSigningOut(true);
    await signOut();
    router.replace("/student/login");
  }

  return <header className="border-b border-[var(--border)] bg-[var(--surface)]">
    <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <Link href="/student/reading" className="inline-flex min-h-11 items-center gap-2 font-bold tracking-tight text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)] focus-visible:ring-offset-2">
        <span className="grid size-9 place-items-center rounded-[var(--radius-sm)] bg-[var(--brand-pink-soft)] text-[var(--brand-pink)]"><BookOpenText size={21} weight="fill" aria-hidden="true" /></span>
        <span>The IELTS Spells</span>
      </Link>
      <nav className="flex items-center gap-1.5" aria-label="Điều hướng học viên">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm font-semibold text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)]">
          <House size={18} aria-hidden="true" />
          <span className="hidden sm:inline">Trang chủ</span>
        </Link>
        <button type="button" onClick={() => void leave()} disabled={signingOut} className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm font-semibold text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)] disabled:cursor-not-allowed disabled:opacity-60" aria-label="Đăng xuất">
          <SignOut size={18} aria-hidden="true" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </nav>
    </div>
    <div className="mx-auto max-w-7xl px-4 pb-3 text-xs text-[var(--text-muted)] sm:px-6 lg:px-8">{session?.user.email}</div>
  </header>;
}
