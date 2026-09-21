import { SignOut, SpinnerGap } from "@phosphor-icons/react";
import type { UserRole } from "@ielts/contracts";
import { lazy, Suspense, useState } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { isInvitationCallback } from "./lib/supabase";
import { AdminShell } from "./layout/AdminShell";
import { hasAnyRole, managementHome, managementPortalRoles } from "./auth/roles";
import "./admin.css";

const ActivateAccountPage = lazy(() => import("./pages/ActivateAccountPage")
  .then((module) => ({ default: module.ActivateAccountPage })));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage")
  .then((module) => ({ default: module.AuthCallbackPage })));
const CourseManagementPage = lazy(() => import("./pages/CourseManagementPage")
  .then((module) => ({ default: module.CourseManagementPage })));
const DashboardPage = lazy(() => import("./pages/DashboardPage")
  .then((module) => ({ default: module.DashboardPage })));
const EnrollmentsPage = lazy(() => import("./pages/EnrollmentsPage")
  .then((module) => ({ default: module.EnrollmentsPage })));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage")
  .then((module) => ({ default: module.ForgotPasswordPage })));
const LoginPage = lazy(() => import("./pages/LoginPage")
  .then((module) => ({ default: module.LoginPage })));
const LearningLibraryPage = lazy(() => import("./pages/LearningLibraryPage")
  .then((module) => ({ default: module.LearningLibraryPage })));
const TestBankPage = lazy(() => import("./pages/TestBankPage")
  .then((module) => ({ default: module.TestBankPage })));
const TestAssignmentsPage = lazy(() => import("./pages/TestAssignmentsPage")
  .then((module) => ({ default: module.TestAssignmentsPage })));
const AiTestImportPage = lazy(() => import("./pages/AiTestImportPage")
  .then((module) => ({ default: module.AiTestImportPage })));
const CrawlHubPage = lazy(() => import("./pages/CrawlHubPage")
  .then((module) => ({ default: module.CrawlHubPage })));
const TestBuilderPage = lazy(() => import("./pages/TestBuilderPage")
  .then((module) => ({ default: module.TestBuilderPage })));
const MediaLibraryPage = lazy(() => import("./pages/MediaLibraryPage")
  .then((module) => ({ default: module.MediaLibraryPage })));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage")
  .then((module) => ({ default: module.ResetPasswordPage })));
const StaffAdminPage = lazy(() => import("./pages/StaffAdminPage")
  .then((module) => ({ default: module.StaffAdminPage })));
const StudentsPage = lazy(() => import("./pages/StudentsPage")
  .then((module) => ({ default: module.StudentsPage })));
const StudentDetailPage = lazy(() => import("./pages/StudentDetailPage")
  .then((module) => ({ default: module.StudentDetailPage })));
const StudentSupportCoursesPage = lazy(() => import("./pages/StudentSupportCoursesPage")
  .then((module) => ({ default: module.StudentSupportCoursesPage })));
const CmsContentPage = lazy(() => import("./pages/CmsContentPage")
  .then((module) => ({ default: module.CmsContentPage })));

function Loader() {
  return <div className="app-loader" role="status">
    <span className="loader-ring" />
    Đang tải hệ thống...
  </div>;
}

function RequireSession() {
  const { session, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  return session ? <Outlet /> : <Navigate to="/login" replace />;
}

function RequireRoles({ any }: { any: readonly UserRole[] }) {
  const { roles, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  if (hasAnyRole(roles, any)) return <Outlet />;
  if (isInvitationCallback) return <Navigate to="/activate-account" replace />;

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  return <main className="pending-page">
    <img src="/brand/the-ielts-spells-logo.png" alt="The IELTS Spells" />
    <p className="auth-kicker">Không có quyền truy cập</p>
    <h1>Tài khoản chưa được cấp quyền</h1>
    <p>Web quản trị chỉ dành cho nhân sự đã hoàn tất lời mời và có vai trò phù hợp.</p>
    <button
      className="secondary-button pending-signout"
      onClick={() => void handleSignOut()}
      disabled={isSigningOut}
    >
      {isSigningOut ? <SpinnerGap className="spin" /> : <SignOut />}
      {isSigningOut ? "Đang đăng xuất..." : "Đăng xuất"}
    </button>
  </main>;
}

function HomeRedirect() {
  const { roles } = useAuth();
  return <Navigate to={managementHome(roles)} replace />;
}

export default function App() {
  return <AuthProvider>
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route element={<RequireSession />}>
          <Route path="/activate-account" element={<ActivateAccountPage />} />
          <Route element={<RequireRoles any={managementPortalRoles} />}>
            <Route element={<AdminShell />}>
              <Route index element={<HomeRedirect />} />
              <Route element={<RequireRoles any={["admin"]} />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/courses" element={<CourseManagementPage />} />
                <Route path="/courses/:courseId" element={<CourseManagementPage />} />
                <Route path="/classes" element={<Navigate to="/courses" replace />} />
                <Route path="/test-assignments" element={<TestAssignmentsPage />} />
              </Route>
              <Route element={<RequireRoles any={["admin", "teacher"]} />}>
                <Route path="/library" element={<LearningLibraryPage />} />
                <Route path="/test-bank" element={<TestBankPage />} />
                <Route path="/test-bank/import-ai" element={<AiTestImportPage />} />
                <Route path="/test-bank/crawl-hub" element={<CrawlHubPage />} />
                <Route path="/test-builder/:skill/:testId" element={<TestBuilderPage />} />
                <Route path="/media" element={<MediaLibraryPage />} />
              </Route>
              <Route element={<RequireRoles any={["admin", "admissions"]} />}>
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/students/:studentId" element={<StudentDetailPage />} />
                <Route path="/enrollments" element={<EnrollmentsPage />} />
              </Route>
              <Route element={<RequireRoles any={["admin"]} />}>
                <Route path="/staff" element={<StaffAdminPage />} />
              </Route>
              <Route element={<RequireRoles any={["student_support"]} />}>
                <Route path="/support/courses" element={<StudentSupportCoursesPage />} />
              </Route>
              <Route element={<RequireRoles any={["admin", "social_media"]} />}>
                <Route path="/cms" element={<CmsContentPage />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/request-access" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </AuthProvider>;
}
