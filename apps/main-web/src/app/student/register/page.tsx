import type { Metadata } from "next";
import { StudentRegisterForm } from "@/features/student-auth/StudentRegisterForm";

export const metadata: Metadata = {
  title: "Đăng ký học viên | The IELTS Spells",
  description: "Tạo tài khoản học viên để nhận bài và theo dõi tiến độ tại The IELTS Spells.",
};

export default function StudentRegisterPage() {
  return <StudentRegisterForm />;
}
