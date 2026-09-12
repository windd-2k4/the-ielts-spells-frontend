"use client";

import { usePathname } from "next/navigation";
import { StudentHubLayout } from "@/features/student-hub/StudentHubLayout";
import { StudentPortalProvider } from "@/features/student-hub/StudentPortalProvider";

export function StudentHubShellGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAuthPage =
    pathname.startsWith("/student/login") ||
    pathname.startsWith("/student/register") ||
    pathname.startsWith("/student/auth");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <StudentPortalProvider>
      <StudentHubLayout>{children}</StudentHubLayout>
    </StudentPortalProvider>
  );
}
