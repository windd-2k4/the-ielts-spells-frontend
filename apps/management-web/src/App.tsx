import { SignOut, SpinnerGap } from "@phosphor-icons/react";
import { useState } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { isInvitationCallback } from "./lib/supabase";
import { AdminShell } from "./layout/AdminShell";
import { ActivateAccountPage } from "./pages/ActivateAccountPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { CourseManagementPage } from "./pages/CourseManagementPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EnrollmentsPage } from "./pages/EnrollmentsPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { LoginPage } from "./pages/LoginPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { StaffAdminPage } from "./pages/StaffAdminPage";
import { StudentsPage } from "./pages/StudentsPage";
import { StudentDetailPage } from "./pages/StudentDetailPage";
import "./admin.css";

function Loader() { return <div className="app-loader" role="status"><span className="loader-ring" />Đang tải hệ thống...</div>; }
function RequireSession() { const { session, isLoading } = useAuth(); if (isLoading) return <Loader />; return session ? <Outlet /> : <Navigate to="/login" replace />; }
function RequireRoles({ any }: { any: string[] }) {
  const { roles, signOut } = useAuth(); const [isSigningOut, setIsSigningOut] = useState(false);
  if (any.some(role => roles.includes(role))) return <Outlet />;
  if (isInvitationCallback) return <Navigate to="/activate-account" replace />;
  async function handleSignOut() { setIsSigningOut(true); try { await signOut(); } finally { setIsSigningOut(false); } }
  return <main className="pending-page"><img src="/brand/the-ielts-spells-logo.png" alt="The IELTS Spells" /><p className="auth-kicker">Không có quyền truy cập</p><h1>Tài khoản chưa được cấp quyền</h1><p>Web quản trị chỉ dành cho nhân sự đã hoàn tất lời mời và có vai trò phù hợp.</p><button className="secondary-button pending-signout" onClick={() => void handleSignOut()} disabled={isSigningOut}>{isSigningOut ? <SpinnerGap className="spin" /> : <SignOut />}{isSigningOut ? "Đang đăng xuất..." : "Đăng xuất"}</button></main>;
}

export default function App() {
  return <AuthProvider><Routes>
    <Route path="/login" element={<LoginPage />} /><Route path="/forgot-password" element={<ForgotPasswordPage />} /><Route path="/auth/reset-password" element={<ResetPasswordPage />} /><Route path="/auth/callback" element={<AuthCallbackPage />} />
    <Route element={<RequireSession />}><Route path="/activate-account" element={<ActivateAccountPage />} />
      <Route element={<RequireRoles any={["admin", "manager", "admissions"]} />}><Route element={<AdminShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route element={<RequireRoles any={["admin", "manager"]} />}><Route path="/dashboard" element={<DashboardPage />} /><Route path="/courses" element={<CourseManagementPage />} /><Route path="/courses/:courseId" element={<CourseManagementPage />} /><Route path="/classes" element={<Navigate to="/courses" replace />} /></Route>
        <Route element={<RequireRoles any={["admin", "manager", "admissions"]} />}><Route path="/students" element={<StudentsPage />} /><Route path="/students/:studentId" element={<StudentDetailPage />} /><Route path="/enrollments" element={<EnrollmentsPage />} /></Route>
        <Route element={<RequireRoles any={["admin"]} />}><Route path="/staff" element={<StaffAdminPage />} /></Route>
      </Route></Route>
    </Route>
    <Route path="/register" element={<Navigate to="/login" replace />} /><Route path="/request-access" element={<Navigate to="/login" replace />} /><Route path="*" element={<Navigate to="/" replace />} />
  </Routes></AuthProvider>;
}
