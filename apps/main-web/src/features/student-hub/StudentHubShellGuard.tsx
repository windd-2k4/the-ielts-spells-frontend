"use client";

import { usePathname } from "next/navigation";
import { StudentHubLayout } from "@/features/student-hub/StudentHubLayout";
import { StudentPortalProvider } from "@/features/student-hub/StudentPortalProvider";
import { WritingEvaluationNotifier } from "./WritingEvaluationNotifier";

export function StudentHubShellGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAuthPage =
    pathname.startsWith("/student/login") ||
    pathname.startsWith("/student/register") ||
    pathname.startsWith("/student/activate") ||
    pathname.startsWith("/student/auth");

  // The test player, result and explanation views are focused workspaces. They
  // own a compact toolbar, so the learning-hub navigation must not wrap them.
  const isExamWorkspacePage =
    /^\/student\/(?:reading|listening|writing)\/attempts\/[^/]+(?:\/(?:result|explanations))?$/.test(pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }
  if (isExamWorkspacePage) return <>{children}<WritingEvaluationNotifier/></>;

  return (
    <StudentPortalProvider>
      <StudentHubLayout>{children}</StudentHubLayout>
      <WritingEvaluationNotifier/>
    </StudentPortalProvider>
  );
}
