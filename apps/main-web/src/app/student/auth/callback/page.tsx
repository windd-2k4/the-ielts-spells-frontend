import type { Metadata } from "next";
import { Suspense } from "react";
import { StudentAuthCallback } from "@/features/student-auth/StudentAuthCallback";

export const metadata: Metadata = {
  title: "Đang xác thực | The IELTS Spells",
};

export default function StudentAuthCallbackPage() {
  return <Suspense fallback={<main className="grid min-h-dvh place-items-center bg-[var(--surface)] text-sm font-bold text-[var(--text-muted)]">Đang xác thực tài khoản...</main>}>
    <StudentAuthCallback />
  </Suspense>;
}
