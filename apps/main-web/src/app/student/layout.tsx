import { StudentSessionProvider } from "@/features/student-auth/StudentSessionProvider";

export default function StudentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <StudentSessionProvider>{children}</StudentSessionProvider>;
}
