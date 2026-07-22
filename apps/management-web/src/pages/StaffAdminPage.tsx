import { ArrowClockwise, ArrowRight, Lock, PencilSimple, SignOut, SpinnerGap, UserPlus, UsersThree, X } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import { FormNotice } from "../auth/FormNotice";
import { apiFetch } from "../lib/api";

type Invitation = { id: string; email: string; fullName: string; intendedRole: Role; status: string; expiresAt: string };
type Role = "MANAGER" | "TEACHER" | "TEACHING_ASSISTANT" | "ADMISSIONS" | "CMS_EDITOR";
type StaffStatus = "DRAFT" | "INVITED" | "ACTIVE" | "SUSPENDED" | "OFFBOARDED";
type Staff = {
  id: string;
  authUserId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  department: string | null;
  employmentType: string | null;
  startDate: string | null;
  role: Role;
  cvPath: string | null;
  portfolioUrl: string | null;
  professionalSummary: string | null;
  internalNotes: string | null;
  status: StaffStatus;
  activatedAt: string | null;
};
type Page<T> = { content: T[] };

const roleLabels: Record<Role, string> = {
  MANAGER: "Quản lý",
  TEACHER: "Giáo viên",
  TEACHING_ASSISTANT: "Trợ giảng",
  ADMISSIONS: "Tuyển sinh",
  CMS_EDITOR: "Biên tập nội dung",
};

const statusLabels: Record<StaffStatus, string> = {
  DRAFT: "Bản nháp",
  INVITED: "Đã gửi lời mời",
  ACTIVE: "Đang hoạt động",
  SUSPENDED: "Tạm khóa",
  OFFBOARDED: "Đã nghỉ việc",
};

const emptyInvite = {
  fullName: "",
  email: "",
  phone: "",
  jobTitle: "",
  department: "",
  employmentType: "FULL_TIME",
  startDate: "",
  role: "TEACHER" as Role,
  cvPath: "",
  portfolioUrl: "",
  professionalSummary: "",
  internalNotes: "",
};

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
      setSelected(current => (current ? staffPage.content.find(item => item.id === current.id) ?? null : null));
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không tải được dữ liệu nhân sự");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleStaff = useMemo(() => {
    return staff.filter(item => {
      const keyword = query.trim().toLowerCase();
      const matchesQuery =
        !keyword ||
        `${item.fullName} ${item.email} ${item.jobTitle ?? ""} ${item.department ?? ""}`
          .toLowerCase()
          .includes(keyword);
      return matchesQuery && (statusFilter === "ALL" || item.status === statusFilter);
    });
  }, [staff, query, statusFilter]);

  async function createInvitation(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await apiFetch("/admin/staff/invitations", {
        method: "POST",
        body: JSON.stringify({ ...invite, startDate: invite.startDate || null }),
      });
      setSuccess(`Đã gửi lời mời đến ${invite.email}.`);
      setInvite(emptyInvite);
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không thể gửi lời mời");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    if (!window.confirm("Thu hồi lời mời này?")) return;
    await runAction(() => apiFetch(`/admin/staff/invitations/${id}/revoke`, { method: "POST" }), "Đã thu hồi lời mời.");
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const body = {
      fullName: selected.fullName,
      phone: selected.phone,
      jobTitle: selected.jobTitle,
      department: selected.department,
      employmentType: selected.employmentType,
      startDate: selected.startDate,
      cvPath: selected.cvPath,
      portfolioUrl: selected.portfolioUrl,
      professionalSummary: selected.professionalSummary,
      internalNotes: selected.internalNotes,
    };
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
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await action();
      setSuccess(message);
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không thể xử lý yêu cầu");
    } finally {
      setBusy(false);
    }
  }

  const inviteField = (key: keyof typeof invite) => ({
    value: invite[key],
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setInvite({ ...invite, [key]: event.target.value }),
  });

  const editField = (key: keyof Staff) => ({
    value: selected?.[key] ?? "",
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setSelected(current => (current ? { ...current, [key]: event.target.value || null } : current)),
  });

  return (
    <main className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary mb-1 block">
            Identity &amp; Access
          </span>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-on-background">
            Quản lý nhân sự
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
            Hồ sơ, lời mời, vai trò và trạng thái truy cập trong một nơi.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
          <button
            className="inline-flex items-center gap-2 bg-surface hover:bg-surface-container-high border border-outline-variant/60 text-on-surface px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            onClick={() => void load()}
          >
            <ArrowClockwise size={16} />
            Làm mới
          </button>
          <button
            className="inline-flex items-center gap-2 bg-error-container/20 hover:bg-error-container/30 border border-error/20 text-error px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            onClick={() => void signOut()}
          >
            <SignOut size={16} />
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Notices */}
      {(error || success) && (
        <div className="space-y-2">
          {error && <FormNotice kind="error">{error}</FormNotice>}
          {success && <FormNotice kind="success">{success}</FormNotice>}
        </div>
      )}

      {/* Grid columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 bg-surface rounded-2xl border border-outline-variant/30 p-6 space-y-6">
          <div className="flex items-start gap-3">
            <UserPlus size={24} className="text-primary shrink-0" />
            <div>
              <h2 className="font-display text-lg font-bold text-on-surface">Mời nhân sự mới</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Admin tạo trước hồ sơ và vai trò từ thông tin tuyển dụng.</p>
            </div>
          </div>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={createInvitation}>
            <div className="md:col-span-2">
              <Field label="Họ và tên">
                <input
                  required
                  {...inviteField("fullName")}
                  className="w-full px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                />
              </Field>
            </div>
            <Field label="Email">
              <input
                required
                type="email"
                {...inviteField("email")}
                className="w-full px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </Field>
            <Field label="Số điện thoại">
              <input
                {...inviteField("phone")}
                className="w-full px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </Field>
            <Field label="Chức danh">
              <input
                {...inviteField("jobTitle")}
                className="w-full px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </Field>
            <Field label="Phòng ban">
              <input
                {...inviteField("department")}
                className="w-full px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </Field>
            <Field label="Loại hợp đồng">
              <select
                {...inviteField("employmentType")}
                className="w-full px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              >
                <option value="FULL_TIME">Toàn thời gian</option>
                <option value="PART_TIME">Bán thời gian</option>
                <option value="CONTRACT">Hợp đồng</option>
              </select>
            </Field>
            <Field label="Ngày bắt đầu">
              <input
                type="date"
                {...inviteField("startDate")}
                className="w-full px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Vai trò">
                <RoleSelect
                  value={invite.role}
                  onChange={value => setInvite({ ...invite, role: value })}
                  className="w-full px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                />
              </Field>
            </div>
            <Field label="Đường dẫn CV">
              <input
                {...inviteField("cvPath")}
                className="w-full px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Portfolio">
                <input
                  type="url"
                  {...inviteField("portfolioUrl")}
                  className="w-full px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Thông tin chuyên môn">
                <textarea
                  rows={3}
                  {...inviteField("professionalSummary")}
                  className="w-full px-4 py-2.5 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none transition-all"
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Ghi chú nội bộ">
                <textarea
                  rows={3}
                  {...inviteField("internalNotes")}
                  className="w-full px-4 py-2.5 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none transition-all"
                />
              </Field>
            </div>
            <div className="md:col-span-2 pt-2">
              <button
                className="w-full px-5 py-3 bg-primary hover:opacity-95 text-on-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                disabled={busy}
              >
                {busy ? <SpinnerGap className="spin" size={16} /> : <ArrowRight size={16} />}
                {busy ? "Đang xử lý..." : "Tạo hồ sơ và gửi lời mời"}
              </button>
            </div>
          </form>
        </section>

        <section className="bg-surface rounded-2xl border border-outline-variant/30 p-6 space-y-6">
          <div className="flex items-start gap-3">
            <UserPlus size={24} className="text-primary shrink-0" />
            <div>
              <h2 className="font-display text-lg font-bold text-on-surface">Chờ kích hoạt</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">{invitations.length} lời mời còn hiệu lực.</p>
            </div>
          </div>

          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
            {invitations.length === 0 ? (
              <div className="text-center py-8 text-sm text-on-surface-variant bg-surface-container-low/40 rounded-xl">
                Chưa có lời mời đang chờ.
              </div>
            ) : (
              invitations.map(item => (
                <article
                  className="flex justify-between items-center p-4 border border-outline-variant/20 rounded-xl bg-surface-container-low/50 hover:bg-surface-container-low transition-colors"
                  key={item.id}
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <strong className="text-sm font-semibold text-on-surface block truncate">{item.fullName}</strong>
                    <span className="text-xs text-on-surface-variant block truncate">{item.email}</span>
                    <small className="text-[10px] text-primary bg-primary-container/20 border border-primary/20 px-2 py-0.5 rounded-full inline-block mt-2 font-semibold">
                      {roleLabels[item.intendedRole]} · Hết hạn {new Date(item.expiresAt).toLocaleDateString("vi-VN")}
                    </small>
                  </div>
                  <button
                    title="Thu hồi lời mời"
                    onClick={() => void revoke(item.id)}
                    className="w-9 h-9 flex items-center justify-center border border-error/30 rounded-xl hover:bg-error-container/20 text-error transition-colors shrink-0"
                  >
                    <X size={16} />
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <UsersThree size={24} className="text-primary shrink-0" />
            <div>
              <h2 className="font-display text-lg font-bold text-on-surface">Danh sách nhân sự</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Hiển thị {visibleStaff.length}/{staff.length} hồ sơ nhân viên.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full md:w-auto">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-lg">search</span>
              <input
                aria-label="Tìm nhân sự"
                placeholder="Tìm tên, email, chức danh..."
                value={query}
                onChange={event => setQuery(event.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}
              className="px-3 py-2 border border-outline-variant/60 rounded-xl bg-surface text-label-md font-label-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-on-surface-variant transition-all"
            >
              <option value="ALL">Tất cả trạng thái</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Directory Table */}
        <div className="border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm min-w-[760px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/30">
                  <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4">Nhân sự</th>
                  <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4">Vai trò</th>
                  <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4">Phòng ban</th>
                  <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4">Trạng thái</th>
                  <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4 w-28" />
                </tr>
              </thead>
              <tbody>
                {visibleStaff.map(item => (
                  <tr key={item.id} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="px-6 py-4 border-t border-outline-variant/20">
                      <strong className="text-on-surface block text-sm font-semibold">{item.fullName}</strong>
                      <span className="text-xs text-on-surface-variant mt-0.5 block">{item.email}</span>
                    </td>
                    <td className="px-6 py-4 border-t border-outline-variant/20 text-on-surface font-medium">
                      {roleLabels[item.role]}
                    </td>
                    <td className="px-6 py-4 border-t border-outline-variant/20 text-on-surface-variant">
                      {item.department || "—"}
                    </td>
                    <td className="px-6 py-4 border-t border-outline-variant/20">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                          item.status === "ACTIVE"
                            ? "bg-primary-container/20 text-primary border-primary/20"
                            : item.status === "SUSPENDED" || item.status === "OFFBOARDED"
                            ? "bg-error-container/20 text-error border-error/20"
                            : "bg-surface-container text-on-surface-variant border-outline-variant/50"
                        }`}
                      >
                        {statusLabels[item.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-t border-outline-variant/20">
                      <button
                        className="inline-flex items-center gap-1.5 border border-outline-variant/60 hover:bg-surface-container text-on-surface px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                        onClick={() => setSelected(item)}
                      >
                        <PencilSimple size={14} />
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visibleStaff.length === 0 && (
            <div className="text-center py-10 text-on-surface-variant">
              Không tìm thấy nhân sự phù hợp.
            </div>
          )}
        </div>
      </section>

      {/* Detail Drawer */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-on-background/40 backdrop-blur-sm flex justify-end"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <aside className="bg-surface w-full max-w-lg h-full p-6 md:p-8 shadow-2xl flex flex-col overflow-y-auto transform transition-transform duration-300 ease-out">
            <header className="flex justify-between items-start gap-4 mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Hồ sơ nhân sự</p>
                <h2 className="font-display text-xl md:text-2xl font-bold text-on-surface">{selected.fullName}</h2>
                <span className="text-sm text-on-surface-variant block mt-0.5">{selected.email}</span>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-10 h-10 flex items-center justify-center border border-outline-variant/60 rounded-xl bg-surface hover:bg-surface-container text-on-surface transition-colors"
              >
                <X size={18} />
              </button>
            </header>

            <form className="space-y-4 flex-1" onSubmit={saveProfile}>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Họ và tên</label>
                <input
                  required
                  {...editField("fullName")}
                  className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Số điện thoại</label>
                  <input
                    {...editField("phone")}
                    className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Chức danh</label>
                  <input
                    {...editField("jobTitle")}
                    className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Phòng ban</label>
                  <input
                    {...editField("department")}
                    className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Loại hợp đồng</label>
                  <input
                    {...editField("employmentType")}
                    className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Ngày bắt đầu</label>
                  <input
                    type="date"
                    {...editField("startDate")}
                    className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Đường dẫn CV</label>
                  <input
                    {...editField("cvPath")}
                    className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Portfolio</label>
                <input
                  {...editField("portfolioUrl")}
                  className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Thông tin chuyên môn</label>
                <textarea
                  rows={3}
                  {...editField("professionalSummary")}
                  className="px-4 py-2.5 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Ghi chú nội bộ</label>
                <textarea
                  rows={3}
                  {...editField("internalNotes")}
                  className="px-4 py-2.5 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none transition-all"
                />
              </div>

              <button
                className="w-full px-5 py-2.5 bg-primary hover:opacity-95 text-on-primary rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                disabled={busy}
              >
                Lưu hồ sơ
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-outline-variant/30 space-y-4">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Quyền truy cập</h3>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Vai trò</label>
                <RoleSelect
                  value={selected.role}
                  onChange={value => void changeRole(value)}
                  disabled={busy}
                  className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none disabled:bg-surface-container transition-all"
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                {selected.status === "ACTIVE" && (
                  <button
                    disabled={busy}
                    onClick={() => void changeStatus("SUSPENDED")}
                    className="inline-flex items-center gap-1.5 border border-outline-variant/60 hover:bg-error-container/10 hover:text-error hover:border-error/20 text-on-surface px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <Lock size={16} />
                    Tạm khóa
                  </button>
                )}
                {selected.status === "SUSPENDED" && (
                  <button
                    disabled={busy}
                    onClick={() => void changeStatus("ACTIVE")}
                    className="inline-flex items-center gap-1.5 bg-primary-container/20 text-primary border border-primary/20 hover:opacity-90 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Mở khóa
                  </button>
                )}
                {selected.status !== "OFFBOARDED" && selected.authUserId && (
                  <button
                    disabled={busy}
                    onClick={() => void changeStatus("OFFBOARDED")}
                    className="inline-flex items-center gap-1.5 border border-error/20 text-error bg-error-container/10 hover:bg-error-container/20 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Cho nghỉ việc
                  </button>
                )}
              </div>
              <p className="text-xs text-on-surface-variant font-caption">
                Thay đổi vai trò chỉ xuất hiện trong JWT sau khi người dùng đăng nhập lại hoặc làm mới token.
              </p>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function RoleSelect({
  value,
  onChange,
  disabled = false,
  className = "",
}: {
  value: Role;
  onChange: (value: Role) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={event => onChange(event.target.value as Role)}
      className={
        className ||
        "w-full px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
      }
    >
      {Object.entries(roleLabels).map(([role, label]) => (
        <option key={role} value={role}>
          {label}
        </option>
      ))}
    </select>
  );
}
