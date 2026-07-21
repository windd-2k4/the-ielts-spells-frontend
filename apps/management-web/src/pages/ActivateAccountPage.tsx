import { ArrowRight, CheckCircle, SpinnerGap } from "@phosphor-icons/react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AuthShell } from "../auth/AuthShell";
import { FormNotice } from "../auth/FormNotice";
import { PasswordField } from "../auth/PasswordField";
import { apiFetch } from "../lib/api";
import { supabase } from "../lib/supabase";

type Invitation = { email: string; fullName: string; intendedRole: string; expiresAt: string };
export function ActivateAccountPage() {
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [form, setForm] = useState({ fullName: "", phone: "", professionalSummary: "", password: "", confirmPassword: "" });
  const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [submitting, setSubmitting] = useState(false);
  useEffect(() => { void apiFetch<Invitation>("/auth/invitations/current").then(value => { setInvitation(value); setForm(current => ({ ...current, fullName: value.fullName })); }).catch(value => setError(value instanceof Error ? value.message : "Lời mời không hợp lệ")).finally(() => setLoading(false)); }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    if (form.password.length < 8) { setError("Mật khẩu phải có ít nhất 8 ký tự."); return; }
    if (form.password !== form.confirmPassword) { setError("Mật khẩu xác nhận không khớp."); return; }
    setSubmitting(true);
    const { error: passwordError } = await supabase.auth.updateUser({ password: form.password });
    if (passwordError) { setError(passwordError.message); setSubmitting(false); return; }
    try {
      await apiFetch("/auth/invitations/activate", { method: "POST", body: JSON.stringify({ fullName: form.fullName, phone: form.phone, professionalSummary: form.professionalSummary }) });
      await supabase.auth.refreshSession(); navigate("/", { replace: true });
    } catch (value) { setError(value instanceof Error ? value.message : "Không thể kích hoạt tài khoản"); setSubmitting(false); }
  }
  if (loading) return <main className="app-loader"><SpinnerGap className="spin" />Đang kiểm tra lời mời...</main>;
  return <AuthShell><header className="auth-heading compact"><p className="auth-kicker">Kích hoạt tài khoản</p><h1>Hoàn tất hồ sơ</h1><p>Kiểm tra thông tin được cấp và đặt mật khẩu để bắt đầu sử dụng hệ thống.</p></header>{error && <FormNotice kind="error">{error}</FormNotice>}{invitation && <form className="auth-form" onSubmit={submit}>
    <div className="invitation-summary"><CheckCircle weight="fill" /><div><strong>{invitation.email}</strong><span>Vai trò: {invitation.intendedRole}</span></div></div>
    <div className="field-group"><label>Họ và tên</label><input required value={form.fullName} onChange={event => setForm({ ...form, fullName: event.target.value })} /></div>
    <div className="field-group"><label>Số điện thoại</label><input value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} /></div>
    <div className="field-group"><label>Giới thiệu chuyên môn</label><textarea rows={3} value={form.professionalSummary} onChange={event => setForm({ ...form, professionalSummary: event.target.value })} /></div>
    <PasswordField id="new-password" label="Mật khẩu mới" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} autoComplete="new-password" required />
    <PasswordField id="confirm-password" label="Xác nhận mật khẩu" value={form.confirmPassword} onChange={event => setForm({ ...form, confirmPassword: event.target.value })} autoComplete="new-password" required />
    <button className="primary-button" disabled={submitting}>{submitting ? <SpinnerGap className="spin" /> : <ArrowRight />}{submitting ? "Đang kích hoạt..." : "Kích hoạt tài khoản"}</button>
  </form>}</AuthShell>;
}
