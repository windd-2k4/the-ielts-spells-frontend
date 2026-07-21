import { ArrowClockwise, ArrowRight, Lock, PencilSimple, SignOut, SpinnerGap, UserPlus, UsersThree, X } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import { FormNotice } from "../auth/FormNotice";
import { apiFetch } from "../lib/api";

type Invitation = { id: string; email: string; fullName: string; intendedRole: Role; status: string; expiresAt: string };
type Role = "MANAGER" | "TEACHER" | "TEACHING_ASSISTANT" | "ADMISSIONS" | "CMS_EDITOR";
type StaffStatus = "DRAFT" | "INVITED" | "ACTIVE" | "SUSPENDED" | "OFFBOARDED";
type Staff = {
  id: string; authUserId: string | null; fullName: string; email: string; phone: string | null;
  jobTitle: string | null; department: string | null; employmentType: string | null; startDate: string | null;
  role: Role; cvPath: string | null; portfolioUrl: string | null; professionalSummary: string | null;
  internalNotes: string | null; status: StaffStatus; activatedAt: string | null;
};
type Page<T> = { content: T[] };

const roleLabels: Record<Role, string> = {
  MANAGER: "Quản lý", TEACHER: "Giáo viên", TEACHING_ASSISTANT: "Trợ giảng",
  ADMISSIONS: "Tuyển sinh", CMS_EDITOR: "Biên tập nội dung",
};
const statusLabels: Record<StaffStatus, string> = {
  DRAFT: "Bản nháp", INVITED: "Đã gửi lời mời", ACTIVE: "Đang hoạt động",
  SUSPENDED: "Tạm khóa", OFFBOARDED: "Đã nghỉ việc",
};
const emptyInvite = { fullName: "", email: "", phone: "", jobTitle: "", department: "", employmentType: "FULL_TIME", startDate: "", role: "TEACHER" as Role, cvPath: "", portfolioUrl: "", professionalSummary: "", internalNotes: "" };

export function StaffAdminPage() {
  const { signOut } = useAuth();
  const [invite, setInvite] = useState(emptyInvite);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selected, setSelected] = useState<Staff | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | StaffStatus>("ALL");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [staffPage, invitationPage] = await Promise.all([
        apiFetch<Page<Staff>>("/admin/staff?size=100&sort=createdAt,desc"),
        apiFetch<Page<Invitation>>("/admin/staff/invitations?status=PENDING&size=50"),
      ]);
      setStaff(staffPage.content);
      setInvitations(invitationPage.content);
      setSelected(current => current ? staffPage.content.find(item => item.id === current.id) ?? null : null);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không tải được dữ liệu nhân sự");
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const visibleStaff = useMemo(() => staff.filter(item => {
    const keyword = query.trim().toLowerCase();
    const matchesQuery = !keyword || `${item.fullName} ${item.email} ${item.jobTitle ?? ""} ${item.department ?? ""}`.toLowerCase().includes(keyword);
    return matchesQuery && (statusFilter === "ALL" || item.status === statusFilter);
  }), [staff, query, statusFilter]);

  async function createInvitation(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try {
      await apiFetch("/admin/staff/invitations", { method: "POST", body: JSON.stringify({ ...invite, startDate: invite.startDate || null }) });
      setSuccess(`Đã gửi lời mời đến ${invite.email}.`); setInvite(emptyInvite); await load();
    } catch (value) { setError(value instanceof Error ? value.message : "Không thể gửi lời mời"); }
    finally { setBusy(false); }
  }

  async function revoke(id: string) {
    if (!window.confirm("Thu hồi lời mời này?")) return;
    await runAction(() => apiFetch(`/admin/staff/invitations/${id}/revoke`, { method: "POST" }), "Đã thu hồi lời mời.");
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const body = { fullName: selected.fullName, phone: selected.phone, jobTitle: selected.jobTitle, department: selected.department, employmentType: selected.employmentType, startDate: selected.startDate, cvPath: selected.cvPath, portfolioUrl: selected.portfolioUrl, professionalSummary: selected.professionalSummary, internalNotes: selected.internalNotes };
    await runAction(() => apiFetch(`/admin/staff/${selected.id}`, { method: "PATCH", body: JSON.stringify(body) }), "Đã cập nhật hồ sơ.");
  }

  async function changeRole(role: Role) {
    if (!selected) return;
    await runAction(() => apiFetch(`/admin/staff/${selected.id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }), "Đã cập nhật vai trò.");
  }

  async function changeStatus(status: "ACTIVE" | "SUSPENDED" | "OFFBOARDED") {
    if (!selected) return;
    const message = status === "ACTIVE" ? "mở khóa" : status === "SUSPENDED" ? "tạm khóa" : "cho nghỉ việc";
    if (!window.confirm(`Xác nhận ${message} tài khoản ${selected.fullName}?`)) return;
    await runAction(() => apiFetch(`/admin/staff/${selected.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }), `Đã ${message} tài khoản.`);
  }

  async function runAction(action: () => Promise<unknown>, message: string) {
    setBusy(true); setError(""); setSuccess("");
    try { await action(); setSuccess(message); await load(); }
    catch (value) { setError(value instanceof Error ? value.message : "Không thể xử lý yêu cầu"); }
    finally { setBusy(false); }
  }

  const inviteField = (key: keyof typeof invite) => ({ value: invite[key], onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setInvite({ ...invite, [key]: event.target.value }) });
  const editField = (key: keyof Staff) => ({ value: selected?.[key] ?? "", onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setSelected(current => current ? { ...current, [key]: event.target.value || null } : current) });

  return <main className="staff-page">
    <header className="approval-header staff-header"><div><p className="auth-kicker">Identity &amp; Access</p><h1>Quản lý nhân sự</h1><p>Hồ sơ, lời mời, vai trò và trạng thái truy cập trong một nơi.</p></div><div className="header-actions"><button className="secondary-button" onClick={() => void load()}><ArrowClockwise />Làm mới</button><button className="secondary-button" onClick={() => void signOut()}><SignOut />Đăng xuất</button></div></header>
    <div className="staff-feedback">{error && <FormNotice kind="error">{error}</FormNotice>}{success && <FormNotice kind="success">{success}</FormNotice>}</div>

    <div className="staff-grid">
      <section className="staff-form-panel"><div className="section-heading"><UserPlus /><div><h2>Mời nhân sự mới</h2><p>Admin tạo trước hồ sơ và vai trò từ thông tin tuyển dụng.</p></div></div>
        <form className="staff-form" onSubmit={createInvitation}>
          <Field label="Họ và tên" wide><input required {...inviteField("fullName")} /></Field>
          <Field label="Email"><input required type="email" {...inviteField("email")} /></Field><Field label="Số điện thoại"><input {...inviteField("phone")} /></Field>
          <Field label="Chức danh"><input {...inviteField("jobTitle")} /></Field><Field label="Phòng ban"><input {...inviteField("department")} /></Field>
          <Field label="Loại hợp đồng"><select {...inviteField("employmentType")}><option value="FULL_TIME">Toàn thời gian</option><option value="PART_TIME">Bán thời gian</option><option value="CONTRACT">Hợp đồng</option></select></Field>
          <Field label="Ngày bắt đầu"><input type="date" {...inviteField("startDate")} /></Field><Field label="Vai trò"><RoleSelect value={invite.role} onChange={value => setInvite({ ...invite, role: value })} /></Field>
          <Field label="Đường dẫn CV"><input {...inviteField("cvPath")} /></Field><Field label="Portfolio" wide><input type="url" {...inviteField("portfolioUrl")} /></Field>
          <Field label="Thông tin chuyên môn" wide><textarea rows={3} {...inviteField("professionalSummary")} /></Field><Field label="Ghi chú nội bộ" wide><textarea rows={3} {...inviteField("internalNotes")} /></Field>
          <button className="primary-button span-2" disabled={busy}>{busy ? <SpinnerGap className="spin" /> : <ArrowRight />}{busy ? "Đang xử lý..." : "Tạo hồ sơ và gửi lời mời"}</button>
        </form>
      </section>
      <section className="invitation-panel"><div className="section-heading"><UserPlus /><div><h2>Chờ kích hoạt</h2><p>{invitations.length} lời mời còn hiệu lực.</p></div></div>
        <div className="invitation-list">{invitations.length === 0 ? <Empty text="Chưa có lời mời đang chờ." /> : invitations.map(item => <article className="invitation-row" key={item.id}><div><strong>{item.fullName}</strong><span>{item.email}</span><small>{roleLabels[item.intendedRole]} · Hết hạn {new Date(item.expiresAt).toLocaleString("vi-VN")}</small></div><button className="icon-danger" title="Thu hồi lời mời" onClick={() => void revoke(item.id)}><X /></button></article>)}</div>
      </section>
    </div>

    <section className="staff-directory"><div className="directory-toolbar"><div className="section-heading"><UsersThree /><div><h2>Danh sách nhân sự</h2><p>{visibleStaff.length}/{staff.length} hồ sơ</p></div></div><div className="directory-filters"><input aria-label="Tìm nhân sự" placeholder="Tìm tên, email, chức danh..." value={query} onChange={event => setQuery(event.target.value)} /><select value={statusFilter} onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}><option value="ALL">Tất cả trạng thái</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div>
      <div className="staff-table-wrap"><table className="staff-table"><thead><tr><th>Nhân sự</th><th>Vai trò</th><th>Phòng ban</th><th>Trạng thái</th><th /></tr></thead><tbody>{visibleStaff.map(item => <tr key={item.id}><td><strong>{item.fullName}</strong><span>{item.email}</span></td><td>{roleLabels[item.role]}</td><td>{item.department || "—"}</td><td><span className={`status-pill status-${item.status.toLowerCase()}`}>{statusLabels[item.status]}</span></td><td><button className="table-action" onClick={() => setSelected(item)}><PencilSimple />Chi tiết</button></td></tr>)}</tbody></table>{visibleStaff.length === 0 && <Empty text="Không tìm thấy nhân sự phù hợp." />}</div>
    </section>

    {selected && <div className="staff-drawer-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null); }}><aside className="staff-drawer" aria-label="Chi tiết nhân sự"><header><div><p className="auth-kicker">Hồ sơ nhân sự</p><h2>{selected.fullName}</h2><span>{selected.email}</span></div><button className="drawer-close" onClick={() => setSelected(null)}><X /></button></header>
      <form className="staff-form" onSubmit={saveProfile}><Field label="Họ và tên" wide><input required {...editField("fullName")} /></Field><Field label="Số điện thoại"><input {...editField("phone")} /></Field><Field label="Chức danh"><input {...editField("jobTitle")} /></Field><Field label="Phòng ban"><input {...editField("department")} /></Field><Field label="Loại hợp đồng"><input {...editField("employmentType")} /></Field><Field label="Ngày bắt đầu"><input type="date" {...editField("startDate")} /></Field><Field label="CV"><input {...editField("cvPath")} /></Field><Field label="Portfolio" wide><input {...editField("portfolioUrl")} /></Field><Field label="Thông tin chuyên môn" wide><textarea rows={3} {...editField("professionalSummary")} /></Field><Field label="Ghi chú nội bộ" wide><textarea rows={3} {...editField("internalNotes")} /></Field><button className="primary-button span-2" disabled={busy}>Lưu hồ sơ</button></form>
      <div className="access-control"><h3>Quyền truy cập</h3><label>Vai trò<RoleSelect value={selected.role} onChange={value => void changeRole(value)} disabled={busy} /></label><div className="status-actions">{selected.status === "ACTIVE" && <button className="reject-button" disabled={busy} onClick={() => void changeStatus("SUSPENDED")}><Lock />Tạm khóa</button>}{selected.status === "SUSPENDED" && <button className="approve-button" disabled={busy} onClick={() => void changeStatus("ACTIVE")}>Mở khóa</button>}{selected.status !== "OFFBOARDED" && selected.authUserId && <button className="reject-button" disabled={busy} onClick={() => void changeStatus("OFFBOARDED")}>Cho nghỉ việc</button>}</div><p>Thay đổi role chỉ xuất hiện trong JWT sau khi người dùng đăng nhập lại hoặc refresh token.</p></div>
    </aside></div>}
  </main>;
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: ReactNode }) { return <div className={`field-group${wide ? " span-2" : ""}`}><label>{label}</label>{children}</div>; }
function RoleSelect({ value, onChange, disabled = false }: { value: Role; onChange: (value: Role) => void; disabled?: boolean }) { return <select value={value} disabled={disabled} onChange={event => onChange(event.target.value as Role)}>{Object.entries(roleLabels).map(([role, label]) => <option key={role} value={role}>{label}</option>)}</select>; }
function Empty({ text }: { text: string }) { return <div className="empty-state"><UsersThree /><h3>Không có dữ liệu</h3><p>{text}</p></div>; }
