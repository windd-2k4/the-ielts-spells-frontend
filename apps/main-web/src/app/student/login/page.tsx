import { StudentLoginForm } from "@/features/student-auth/StudentLoginForm";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Đăng nhập học viên | The IELTS Spells",
  description: "Đăng nhập để làm bài và theo dõi tiến độ học tập tại The IELTS Spells.",
};

function StudentLoginFallback() {
  return <main className="grid min-h-dvh place-items-center bg-[var(--surface-muted)] px-4">
    <p className="text-sm font-semibold text-[var(--text-muted)]">Đang mở cổng học viên...</p>
  </main>;
}

export default function StudentLoginPage() {
  return <Suspense fallback={<StudentLoginFallback />}>
    <StudentLoginForm />
  </Suspense>;
}
