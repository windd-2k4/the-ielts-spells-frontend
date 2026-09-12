import { StudentHubShellGuard } from "@/features/student-hub/StudentHubShellGuard";

export default function StudentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <StudentHubShellGuard>{children}</StudentHubShellGuard>;
}
