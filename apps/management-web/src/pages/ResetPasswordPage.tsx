import { ArrowRight, SpinnerGap } from "@phosphor-icons/react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AuthShell } from "../auth/AuthShell";
import { FormNotice } from "../auth/FormNotice";
import { PasswordField } from "../auth/PasswordField";
import { supabase } from "../lib/supabase";

export function ResetPasswordPage() {
  const navigate = useNavigate(); const [ready, setReady] = useState(false); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  useEffect(() => { const code = new URLSearchParams(window.location.search).get("code"); const task = code ? supabase.auth.exchangeCodeForSession(code) : supabase.auth.getSession(); void task.then(({ error: value }) => { if (value) setError("Liên kết không hợp lệ hoặc đã hết hạn."); else setReady(true); }); }, []);
  async function submit(event: FormEvent) { event.preventDefault(); setError(""); if (password.length < 8) { setError("Mật khẩu phải có ít nhất 8 ký tự."); return; } if (password !== confirm) { setError("Mật khẩu xác nhận không khớp."); return; } setLoading(true); const { error: value } = await supabase.auth.updateUser({ password }); if (value) { setError(value.message); setLoading(false); } else navigate("/", { replace: true }); }
  return <AuthShell><header className="auth-heading compact"><p className="auth-kicker">Bảo mật tài khoản</p><h1>Đặt mật khẩu mới</h1><p>Mật khẩu cần có ít nhất 8 ký tự và chỉ bạn được biết.</p></header>{error && <FormNotice kind="error">{error}</FormNotice>}{ready && <form className="auth-form" onSubmit={submit}><PasswordField id="reset-password" label="Mật khẩu mới" value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" required /><PasswordField id="reset-confirm" label="Xác nhận mật khẩu" value={confirm} onChange={event => setConfirm(event.target.value)} autoComplete="new-password" required /><button className="primary-button" disabled={loading}>{loading ? <SpinnerGap className="spin" /> : <ArrowRight />}{loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}</button></form>}</AuthShell>;
}
