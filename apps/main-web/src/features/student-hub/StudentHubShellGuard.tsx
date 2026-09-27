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

  // The test player, result and explanation views are focused workspaces. They
  // own a compact toolbar, so the learning-hub navigation must not wrap them.
  const isExamWorkspacePage =
    /^\/student\/(?:reading|listening)\/attempts\/[^/]+(?:\/(?:result|explanations))?$/.test(pathname);

  if (isAuthPage || isExamWorkspacePage) {
    return <>{children}</>;
  }

  return (
    <StudentPortalProvider>
      <StudentHubLayout>{children}</StudentHubLayout>
    </StudentPortalProvider>
  );
}
