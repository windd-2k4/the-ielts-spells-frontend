import type { Metadata } from "next";
import { Suspense } from "react";
import { StudentRegisterForm } from "@/features/student-auth/StudentRegisterForm";

export const metadata: Metadata = {
  title: "Đăng ký học viên | The IELTS Spells",
  description: "Tạo tài khoản học viên để nhận bài và theo dõi tiến độ tại The IELTS Spells.",
};

function StudentRegisterFallback() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#1e191b] px-4">
      <p className="text-sm font-semibold text-[#dfced3]">Đang mở cổng đăng ký học viên...</p>
    </main>
  );
}

export default function StudentRegisterPage() {
  return (
    <Suspense fallback={<StudentRegisterFallback />}>
      <StudentRegisterForm />
    </Suspense>
  );
}
