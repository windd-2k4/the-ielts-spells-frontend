import { SpinnerGap } from "@phosphor-icons/react";
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
      <div className="auth-form-header">
        <h1 className="auth-form-title">Đăng nhập tài khoản</h1>
        <p className="auth-form-subtitle">
          Đăng nhập bằng tài khoản quản trị viên hoặc giáo viên để truy cập hệ thống.
        </p>
      </div>

      {registered && (
        <FormNotice kind="success">
          Tài khoản đã được tạo. Hãy kiểm tra email để xác nhận trước khi đăng nhập.
        </FormNotice>
      )}
      {error && <FormNotice kind="error">{error}</FormNotice>}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field-group">
          <label htmlFor="login-email">
            Email công việc <span className="field-required">*</span>
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="Nhập email của bạn (ví dụ: nhansu@theieltsspells.vn)"
            required
          />
        </div>

        <PasswordField
          id="login-password"
          label="Mật khẩu"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          placeholder="Nhập mật khẩu của bạn"
        />

        <div className="form-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => {
                setRemember(event.target.checked);
                setRememberSession(event.target.checked);
              }}
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>
          <Link to="/forgot-password" className="forgot-link">
            Quên mật khẩu?
          </Link>
        </div>

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <SpinnerGap className="spin" size={18} /> : null}
          <span>{isSubmitting ? "Đang đăng nhập..." : "ĐĂNG NHẬP"}</span>
        </button>
      </form>

      <div className="auth-bottom-notes">
        <p className="auth-switch-note">
          Tài khoản nội bộ được cấp và phân quyền bởi Ban Quản Trị.
        </p>
        <div className="auth-links-row">
          <Link to="/forgot-password">Quên mật khẩu?</Link>
          <span className="dot-divider">•</span>
          <a href="mailto:support@theieltsspells.vn">Hỗ trợ kỹ thuật</a>
        </div>
      </div>
    </AuthShell>
  );
}
