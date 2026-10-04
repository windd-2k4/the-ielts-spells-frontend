import type { Metadata } from "next";
import { Suspense } from "react";
import { StudentActivationForm } from "@/features/student-auth/StudentActivationForm";

export const metadata: Metadata = {
  title: "Kích hoạt tài khoản | The IELTS Spells",
  description: "Kích hoạt tài khoản học viên sau khi thanh toán học phí.",
};

export default function StudentActivationPage() {
  return <Suspense fallback={<main className="grid min-h-dvh place-items-center bg-[var(--surface-muted)] px-4"><p className="text-sm font-semibold text-[var(--text-muted)]">Đang mở liên kết kích hoạt...</p></main>}>
    <StudentActivationForm />
  </Suspense>;
}
