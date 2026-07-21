import { ArrowRight, SpinnerGap } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthShell } from "../auth/AuthShell";
import { FormNotice } from "../auth/FormNotice";
import { PasswordField } from "../auth/PasswordField";
import { getAuthErrorMessage } from "../auth/authErrors";
import { isSupabaseConfigured, setRememberSession, shouldRememberSession, supabase } from "../lib/supabase";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remember, setRemember] = useState(shouldRememberSession);
  const registered = new URLSearchParams(location.search).get("registered") === "true";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!isSupabaseConfigured) {
      setError("Chưa cấu hình kết nối Supabase cho ứng dụng.");
      return;
    }

    setIsSubmitting(true);
    setRememberSession(remember);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(getAuthErrorMessage(authError.message));
      setIsSubmitting(false);
      return;
    }
    navigate("/", { replace: true });
  }

  return (
    <AuthShell>
      <header className="auth-heading">
        <p className="auth-kicker">Chào mừng trở lại</p>
        <h1>Đăng nhập</h1>
        <p>Tiếp tục lộ trình học tập hoặc quản lý lớp học của bạn.</p>
      </header>

      {registered && <FormNotice kind="success">Tài khoản đã được tạo. Hãy kiểm tra email để xác nhận trước khi đăng nhập.</FormNotice>}
      {error && <FormNotice kind="error">{error}</FormNotice>}
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field-group">
          <label htmlFor="login-email">Email</label>
          <input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="ban@example.com" required />
        </div>
        <PasswordField id="login-password" label="Mật khẩu" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
        <div className="form-options">
          <label className="checkbox-label"><input type="checkbox" checked={remember} onChange={(event) => { setRemember(event.target.checked); setRememberSession(event.target.checked); }} /> <span>Ghi nhớ đăng nhập</span></label>
          <Link to="/forgot-password">Quên mật khẩu?</Link>
        </div>
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <SpinnerGap className="spin" /> : <ArrowRight weight="bold" />}
          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <p className="auth-switch">Tài khoản quản trị chỉ được cấp qua lời mời của quản trị viên.</p>
    </AuthShell>
  );
}
