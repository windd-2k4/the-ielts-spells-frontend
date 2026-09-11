import { StudentLoginForm } from "@/features/student-auth/StudentLoginForm";
import { Suspense } from "react";

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
