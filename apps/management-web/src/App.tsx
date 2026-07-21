import { SignOut, SpinnerGap } from "@phosphor-icons/react";
import { useState } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ActivateAccountPage } from "./pages/ActivateAccountPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { LoginPage } from "./pages/LoginPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { StaffAdminPage } from "./pages/StaffAdminPage";
import { isInvitationCallback } from "./lib/supabase";

function Loader() { return <div className="app-loader" role="status"><span className="loader-ring" />Đang tải hệ thống...</div>; }
function RequireSession() { const { session, isLoading } = useAuth(); if (isLoading) return <Loader />; return session ? <Outlet /> : <Navigate to="/login" replace />; }
function RequireAdmin() {
  const { roles, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (roles.includes("admin")) return <Outlet />;
  if (isInvitationCallback) return <Navigate to="/activate-account" replace />;

  async function handleSignOut() {
    if (isSigningOut) return;
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
    <h1>Tài khoản chưa được kích hoạt</h1>
    <p>Web quản trị chỉ dành cho nhân sự đã nhận và hoàn tất lời mời. Nếu tài khoản đã được kích hoạt, hãy đăng xuất rồi đăng nhập lại.</p>
    <button className="secondary-button pending-signout" type="button" onClick={handleSignOut} disabled={isSigningOut}>
      {isSigningOut ? <SpinnerGap className="spin" size={20} /> : <SignOut size={20} />}
      {isSigningOut ? "Đang đăng xuất..." : "Đăng xuất"}
    </button>
  </main>;
}

export default function App() {
  return <AuthProvider><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
    <Route path="/auth/callback" element={<AuthCallbackPage />} />
    <Route element={<RequireSession />}>
      <Route path="/activate-account" element={<ActivateAccountPage />} />
      <Route element={<RequireAdmin />}><Route path="/" element={<StaffAdminPage />} /></Route>
    </Route>
    <Route path="/register" element={<Navigate to="/login" replace />} />
    <Route path="/request-access" element={<Navigate to="/login" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></AuthProvider>;
}
