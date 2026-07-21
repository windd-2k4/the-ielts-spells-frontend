import { ArrowRight, CheckCircle, SpinnerGap } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthShell } from "../auth/AuthShell";
import { FormNotice } from "../auth/FormNotice";
import { supabase } from "../lib/supabase";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); const [error, setError] = useState(""); const [sent, setSent] = useState(false); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setError(""); setLoading(true); const { error: value } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/reset-password` }); setLoading(false); if (value) setError(value.message); else setSent(true); }
  return <AuthShell>{sent ? <div className="request-success"><CheckCircle weight="fill" /><p className="auth-kicker">Đã gửi email</p><h1>Kiểm tra hộp thư</h1><p>Mở liên kết đặt lại mật khẩu trong email để tiếp tục.</p><Link className="primary-link" to="/login">Quay lại đăng nhập</Link></div> : <><header className="auth-heading compact"><p className="auth-kicker">Khôi phục truy cập</p><h1>Quên mật khẩu</h1><p>Nhập email đã được quản trị viên cấp để nhận liên kết đặt lại mật khẩu.</p></header>{error && <FormNotice kind="error">{error}</FormNotice>}<form className="auth-form" onSubmit={submit}><div className="field-group"><label>Email</label><input type="email" required value={email} onChange={event => setEmail(event.target.value)} /></div><button className="primary-button" disabled={loading}>{loading ? <SpinnerGap className="spin" /> : <ArrowRight />}{loading ? "Đang gửi..." : "Gửi liên kết"}</button></form><p className="auth-switch"><Link to="/login">Quay lại đăng nhập</Link></p></>}</AuthShell>;
}
