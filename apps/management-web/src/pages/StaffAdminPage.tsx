import {
  ArrowClockwise, Briefcase, Calendar, Check, CheckCircle, Clock,
  EnvelopeSimple, Funnel, Image as ImageIcon, Lock, MagnifyingGlass,
  PencilSimple, Phone, Plus, Rows, SignOut, SpinnerGap,
  SquaresFour, Trash, UploadSimple, UserPlus, UsersThree, X,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import { FormNotice } from "../auth/FormNotice";
import { apiFetch, apiUpload } from "../lib/api";

type Invitation = { id: string; email: string; fullName: string; intendedRole: Role; status: string; expiresAt: string };
type Role = "ADMIN" | "TEACHER" | "ADMISSIONS" | "SOCIAL_MEDIA" | "STUDENT_SUPPORT";
type StaffRole = Role;
type StaffStatus = "DRAFT" | "INVITED" | "ACTIVE" | "SUSPENDED" | "OFFBOARDED";
type Staff = {
  id: string;
  authUserId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  avatarPath: string | null;
  jobTitle: string | null;
  department: string | null;
  employmentType: string | null;
  startDate: string | null;
  role: StaffRole;
  cvPath: string | null;
  portfolioUrl: string | null;
  professionalSummary: string | null;
  internalNotes: string | null;
  status: StaffStatus;
  activatedAt: string | null;
};
type Page<T> = { content: T[] };

const roleLabels: Record<StaffRole, string> = {
  ADMIN: "Chủ doanh nghiệp / Quản trị viên",
  TEACHER: "Giáo viên",
  ADMISSIONS: "Tuyển sinh",
  SOCIAL_MEDIA: "Social Media",
  STUDENT_SUPPORT: "Hỗ trợ học viên",
};

const statusLabels: Record<StaffStatus, string> = {
  DRAFT: "Bản nháp",
  INVITED: "Chờ kích hoạt",
  ACTIVE: "Đang làm việc",
  SUSPENDED: "Tạm ngưng",
  OFFBOARDED: "Đã nghỉ việc",
};

const roleBadges: Record<StaffRole, { label: string; bg: string; text: string; border: string }> = {
  ADMIN: {
    label: "Quản trị viên",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  TEACHER: {
    label: "Giáo viên",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  ADMISSIONS: {
    label: "Tuyển sinh",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  SOCIAL_MEDIA: {
    label: "Social Media",
    bg: "bg-pink-50 dark:bg-pink-950/40",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-pink-200 dark:border-pink-800",
  },
  STUDENT_SUPPORT: {
    label: "Hỗ trợ học viên",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
};

const statusBadges: Record<StaffStatus, { label: string; bg: string; text: string; border: string; icon: ReactNode }> = {
  ACTIVE: {
    label: "Đang làm việc",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-800 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: <Briefcase size={12} weight="bold" className="text-emerald-600 dark:text-emerald-400 shrink-0" />,
  },
  INVITED: {
    label: "Chờ kích hoạt",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-800 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    icon: <Clock size={12} weight="bold" className="text-blue-600 dark:text-blue-400 shrink-0" />,
  },
  DRAFT: {
    label: "Bản nháp",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
    icon: <PencilSimple size={12} weight="bold" className="text-slate-500 shrink-0" />,
  },
  SUSPENDED: {
    label: "Tạm ngưng",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-800 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    icon: <Lock size={12} weight="bold" className="text-amber-600 dark:text-amber-400 shrink-0" />,
  },
  OFFBOARDED: {
    label: "Đã nghỉ việc",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-800 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
    icon: <SignOut size={12} weight="bold" className="text-rose-600 dark:text-rose-400 shrink-0" />,
  },
};

const emptyInvite = {
  fullName: "",
  email: "",
  phone: "",
  startDate: "",
  role: "TEACHER" as Role,
  avatarPath: "",
  cvPath: "",
  professionalSummary: "",
  internalNotes: "",
};

type StaffAvatarUpload = { filename: string; avatarPath: string };
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function formatDate(value: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
  } catch {
    return value;
  }
}

export function StaffAdminPage() {
  const { signOut } = useAuth();
  const [invite, setInvite] = useState(emptyInvite);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selected, setSelected] = useState<Staff | null>(null);

  // Filters & UI states
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | StaffRole>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | StaffStatus>("ALL");
  const [activeTab, setActiveTab] = useState<"staff" | "invitations">("staff");
  const [viewMode, setViewMode] = useState<"table" | "cards">(() => {
    if (typeof window === "undefined") return "table";
    return window.localStorage.getItem("staff_admin_view_mode") === "cards" ? "cards" : "table";
  });
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarFilename, setAvatarFilename] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
  }, [avatarPreviewUrl]);

  useEffect(() => {
    try {
      window.localStorage.setItem("staff_admin_view_mode", viewMode);
    } catch {
      // ignore
    }
  }, [viewMode]);

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

  // Statistics
  const activeCount = useMemo(() => staff.filter((s) => s.status === "ACTIVE").length, [staff]);
  const suspendedCount = useMemo(
    () => staff.filter((s) => s.status === "SUSPENDED" || s.status === "OFFBOARDED").length,
    [staff]
  );

  const visibleStaff = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return staff.filter((item) => {
      const matchesQuery =
        !keyword ||
        `${item.fullName} ${item.email} ${item.phone ?? ""}`
          .toLowerCase()
          .includes(keyword);
      const matchesRole = roleFilter === "ALL" || item.role === roleFilter;
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [staff, query, roleFilter, statusFilter]);

  const hasActiveFilters = query.trim() !== "" || roleFilter !== "ALL" || statusFilter !== "ALL";
  const resetFilters = () => {
    setQuery("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
  };

  async function createInvitation(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await apiFetch("/admin/staff/invitations", {
        method: "POST",
        body: JSON.stringify({
          ...invite,
          avatarPath: invite.avatarPath || null,
          cvPath: invite.cvPath.trim() || null,
          startDate: invite.startDate || null,
        }),
      });
      setSuccess(`Đã gửi lời mời thành công đến ${invite.email}.`);
      setInvite(emptyInvite);
      clearInviteAvatar();
      setIsInviteOpen(false);
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không thể gửi lời mời");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    if (!window.confirm("Bạn có chắc chắn muốn thu hồi lời mời này?")) return;
    await runAction(() => apiFetch(`/admin/staff/invitations/${id}/revoke`, { method: "POST" }), "Đã thu hồi lời mời thành công.");
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const body = {
      fullName: selected.fullName,
      phone: selected.phone,
      startDate: selected.startDate,
      cvPath: selected.cvPath,
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

  function clearInviteAvatar() {
    setInvite(current => ({ ...current, avatarPath: "" }));
    setAvatarFilename("");
    setAvatarPreviewUrl(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }

  async function uploadInviteAvatar(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn tệp ảnh PNG, JPG, WebP hoặc GIF.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Ảnh đại diện không được vượt quá 5 MB.");
      return;
    }

    setAvatarPreviewUrl(URL.createObjectURL(file));
    setAvatarFilename(file.name);
    setAvatarUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const uploadedAvatar = await apiUpload<StaffAvatarUpload>("/admin/staff/avatars", body);
      setInvite(current => ({ ...current, avatarPath: uploadedAvatar.avatarPath }));
      setAvatarFilename(uploadedAvatar.filename);
    } catch (value) {
      clearInviteAvatar();
      setError(value instanceof Error ? value.message : "Không thể tải ảnh đại diện lên.");
    } finally {
      setAvatarUploading(false);
    }
  }

  return (
    <main className="space-y-4 sm:space-y-5 pb-12">
      {/* Compact Page Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
            <UsersThree size={20} weight="bold" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg sm:text-xl font-extrabold text-on-background">
                Quản lý nhân sự
              </h1>
              <span className="rounded-full bg-primary-fixed/60 px-2 py-0.5 text-[11px] font-bold tabular-nums text-primary">
                {staff.length} nhân sự
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant font-medium">
              Phân quyền tài khoản &amp; quản lý nhân sự nội bộ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/60 bg-surface px-3 py-1.5 text-xs font-bold text-on-surface shadow-2xs hover:bg-surface-container transition"
            onClick={() => void load()}
            title="Làm mới dữ liệu"
          >
            <ArrowClockwise size={14} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            type="button"
            onClick={() => setIsInviteOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary px-3.5 py-1.5 text-xs font-extrabold shadow-xs active:scale-[.98] transition"
          >
            <UserPlus size={15} weight="bold" />
            <span>Mời nhân sự mới</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-xl border border-error/20 bg-error-container/15 hover:bg-error-container/25 text-error px-2.5 py-1.5 text-xs font-bold transition"
            onClick={() => void signOut()}
            title="Đăng xuất khỏi tài khoản"
          >
            <SignOut size={14} />
            <span className="hidden sm:inline">Đăng xuất</span>
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

      {/* Compact Interactive Stat Chips */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5" aria-label="Thống kê nhân sự">
        <button
          type="button"
          onClick={() => { resetFilters(); setActiveTab("staff"); }}
          className={`flex items-center justify-between rounded-xl border p-2 sm:px-3 sm:py-2 transition shadow-2xs ${
            statusFilter === "ALL" && activeTab === "staff"
              ? "border-primary bg-primary-fixed/25"
              : "border-outline-variant/40 bg-surface hover:border-primary/40 hover:bg-surface-container-low"
          }`}
          title="Xem tất cả nhân sự"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="grid size-6 place-items-center rounded-md bg-primary/10 text-primary shrink-0">
              <UsersThree size={14} weight="bold" />
            </span>
            <span className="truncate text-xs font-bold text-on-surface-variant">Tổng nhân sự</span>
          </div>
          <strong className="font-display text-sm sm:text-base font-black tabular-nums text-on-surface shrink-0 ml-2">
            {staff.length}
          </strong>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter("ACTIVE"); setActiveTab("staff"); }}
          className={`flex items-center justify-between rounded-xl border p-2 sm:px-3 sm:py-2 transition shadow-2xs ${
            statusFilter === "ACTIVE" && activeTab === "staff"
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-outline-variant/40 bg-surface hover:border-emerald-500/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20"
          }`}
          title="Lọc nhân sự đang làm việc"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="grid size-6 place-items-center rounded-md bg-emerald-500/10 text-emerald-600 shrink-0">
              <Briefcase size={14} weight="bold" />
            </span>
            <span className="truncate text-xs font-bold text-on-surface-variant">Đang làm việc</span>
          </div>
          <strong className="font-display text-sm sm:text-base font-black tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
            {activeCount}
          </strong>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("invitations")}
          className={`flex items-center justify-between rounded-xl border p-2 sm:px-3 sm:py-2 transition shadow-2xs ${
            activeTab === "invitations"
              ? "border-blue-500 bg-blue-500/10"
              : "border-outline-variant/40 bg-surface hover:border-blue-500/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/20"
          }`}
          title="Xem lời mời chờ kích hoạt"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="grid size-6 place-items-center rounded-md bg-blue-500/10 text-blue-600 shrink-0">
              <Clock size={14} weight="bold" />
            </span>
            <span className="truncate text-xs font-bold text-on-surface-variant">Chờ kích hoạt</span>
          </div>
          <strong className="font-display text-sm sm:text-base font-black tabular-nums text-blue-600 dark:text-blue-400 shrink-0 ml-2">
            {invitations.length}
          </strong>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter("SUSPENDED"); setActiveTab("staff"); }}
          className={`flex items-center justify-between rounded-xl border p-2 sm:px-3 sm:py-2 transition shadow-2xs ${
            (statusFilter === "SUSPENDED" || statusFilter === "OFFBOARDED") && activeTab === "staff"
              ? "border-amber-500 bg-amber-500/10"
              : "border-outline-variant/40 bg-surface hover:border-amber-500/40 hover:bg-amber-50/30 dark:hover:bg-amber-950/20"
          }`}
          title="Lọc nhân sự tạm ngưng hoặc đã nghỉ việc"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="grid size-6 place-items-center rounded-md bg-amber-500/10 text-amber-600 shrink-0">
              <Lock size={14} weight="bold" />
            </span>
            <span className="truncate text-xs font-bold text-on-surface-variant">Tạm ngưng / Nghỉ</span>
          </div>
          <strong className="font-display text-sm sm:text-base font-black tabular-nums text-amber-600 dark:text-amber-400 shrink-0 ml-2">
            {suspendedCount}
          </strong>
        </button>
      </section>

      {/* Main Content Area */}
      <section className="rounded-2xl border border-outline-variant/40 bg-surface shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-outline-variant/40 px-4 sm:px-6 pt-3 gap-3 bg-surface-container-lowest">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("staff")}
              className={`relative pb-3 text-sm font-extrabold transition ${
                activeTab === "staff"
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>Đội ngũ nhân sự</span>
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                activeTab === "staff"
                  ? "bg-primary-fixed text-primary"
                  : "bg-surface-container text-on-surface-variant"
              }`}>
                {visibleStaff.length}
              </span>
              {activeTab === "staff" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("invitations")}
              className={`relative pb-3 text-sm font-extrabold transition ${
                activeTab === "invitations"
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>Lời mời chờ kích hoạt</span>
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                activeTab === "invitations"
                  ? "bg-primary-fixed text-primary"
                  : "bg-surface-container text-on-surface-variant"
              }`}>
                {invitations.length}
              </span>
              {activeTab === "invitations" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary" />
              )}
            </button>
          </div>

          {activeTab === "staff" && (
            <div className="flex items-center gap-1 pb-3">
              <span className="text-xs font-semibold text-on-surface-variant mr-1 hidden sm:inline">Chế độ xem:</span>
              <div className="flex rounded-lg border border-outline-variant/50 bg-surface p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`flex size-7 items-center justify-center rounded-md transition ${
                    viewMode === "table"
                      ? "bg-primary-fixed/50 text-primary shadow-2xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  title="Dạng bảng chi tiết"
                >
                  <Rows size={15} weight={viewMode === "table" ? "bold" : "regular"} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`flex size-7 items-center justify-center rounded-md transition ${
                    viewMode === "cards"
                      ? "bg-primary-fixed/50 text-primary shadow-2xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  title="Dạng thẻ lưới"
                >
                  <SquaresFour size={15} weight={viewMode === "cards" ? "bold" : "regular"} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Staff Directory */}
        {activeTab === "staff" && (
          <div className="p-4 sm:p-6 space-y-4">
            {/* Filter Toolbar (Bộ lọc nhân sự) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-surface-container-low/40 p-3 rounded-xl border border-outline-variant/40">
              {/* Search input */}
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <MagnifyingGlass
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  type="text"
                  placeholder="Tìm theo tên, email, số điện thoại..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/60 bg-surface pl-10 pr-9 py-2 text-xs font-medium text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                    title="Xóa tìm kiếm"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filters: Role & Status */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Role Filter */}
                <div className="flex items-center gap-1.5 min-w-[170px]">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3 py-2 text-xs font-bold text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                    aria-label="Lọc theo vai trò"
                  >
                    <option value="ALL">Tất cả vai trò ({staff.length})</option>
                    {Object.entries(roleLabels).map(([role, label]) => {
                      const count = staff.filter((s) => s.role === role).length;
                      return (
                        <option key={role} value={role}>
                          {label} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 min-w-[160px]">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3 py-2 text-xs font-bold text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                    aria-label="Lọc theo trạng thái"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    {Object.entries(statusLabels).map(([status, label]) => {
                      const count = staff.filter((s) => s.status === status).length;
                      return (
                        <option key={status} value={status}>
                          {label} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Reset Filters */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 rounded-xl border border-outline-variant/60 bg-surface px-2.5 py-2 text-xs font-bold text-on-surface-variant hover:border-error/50 hover:text-error transition"
                    title="Đặt lại tất cả bộ lọc"
                  >
                    <X size={13} />
                    <span>Xóa bộ lọc</span>
                  </button>
                )}
              </div>
            </div>

            {/* View 1: Table View */}
            {viewMode === "table" ? (
              <div className="overflow-hidden rounded-xl border border-outline-variant/40 bg-surface shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs min-w-[760px]">
                    <thead>
                      <tr className="border-b border-outline-variant/40 bg-surface-container-low/70">
                        <th className="px-5 py-3.5 font-extrabold uppercase tracking-wider text-on-surface-variant text-[11px]">
                          Nhân sự
                        </th>
                        <th className="px-5 py-3.5 font-extrabold uppercase tracking-wider text-on-surface-variant text-[11px]">
                          Liên hệ
                        </th>
                        <th className="px-5 py-3.5 font-extrabold uppercase tracking-wider text-on-surface-variant text-[11px]">
                          Vai trò
                        </th>
                        <th className="px-5 py-3.5 font-extrabold uppercase tracking-wider text-on-surface-variant text-[11px]">
                          Trạng thái
                        </th>
                        <th className="px-5 py-3.5 font-extrabold uppercase tracking-wider text-on-surface-variant text-[11px]">
                          Ngày bắt đầu
                        </th>
                        <th className="px-5 py-3.5 font-extrabold uppercase tracking-wider text-on-surface-variant text-[11px] text-right">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/25">
                      {visibleStaff.map((item) => {
                        const role = roleBadges[item.role] || { label: item.role, bg: "bg-surface-container", text: "text-on-surface", border: "border-outline-variant" };
                        const status = statusBadges[item.status] || { label: item.status, bg: "bg-surface-container", text: "text-on-surface", border: "border-outline-variant", dot: "bg-slate-400" };

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-primary-fixed/15 transition-colors group"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <StaffAvatar name={item.fullName} src={item.avatarPath} status={item.status} size="md" />
                                <div className="min-w-0">
                                  <strong className="block truncate text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                                    {item.fullName}
                                  </strong>
                                  <span className="block truncate text-xs text-on-surface-variant">
                                    {item.email}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-on-surface-variant">
                              {item.phone ? (
                                <span className="inline-flex items-center gap-1.5 font-medium tabular-nums">
                                  <Phone size={13} className="shrink-0 text-primary/70" />
                                  <span>{item.phone}</span>
                                </span>
                              ) : (
                                <span className="italic text-on-surface-variant/50">Chưa có SĐT</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${role.bg} ${role.text} ${role.border}`}
                              >
                                {role.label}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${status.bg} ${status.text} ${status.border}`}
                              >
                                {status.icon}
                                <span>{status.label}</span>
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-on-surface-variant font-medium tabular-nums">
                              {formatDate(item.startDate)}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => setSelected(item)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/60 bg-surface px-3 py-1.5 text-xs font-bold text-on-surface shadow-2xs hover:border-primary hover:text-primary hover:bg-primary-fixed/20 transition"
                              >
                                <PencilSimple size={14} />
                                <span>Chi tiết</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {visibleStaff.length === 0 && (
                  <div className="py-12 text-center space-y-3">
                    <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-surface-container text-on-surface-variant">
                      <UsersThree size={24} />
                    </span>
                    <p className="text-sm font-semibold text-on-surface">Không tìm thấy nhân sự phù hợp.</p>
                    <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                      Thử điều chỉnh lại từ khóa tìm kiếm hoặc bỏ chọn các điều kiện lọc vai trò, trạng thái.
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-on-primary shadow-xs"
                      >
                        <X size={14} />
                        <span>Đặt lại bộ lọc</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* View 2: Grid Cards View */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {visibleStaff.map((item) => {
                  const role = roleBadges[item.role] || { label: item.role, bg: "bg-surface-container", text: "text-on-surface", border: "border-outline-variant" };
                  const status = statusBadges[item.status] || { label: item.status, bg: "bg-surface-container", text: "text-on-surface", border: "border-outline-variant", dot: "bg-slate-400" };

                  return (
                    <article
                      key={item.id}
                      className="flex flex-col justify-between rounded-2xl border border-outline-variant/40 bg-surface p-5 shadow-2xs hover:border-primary/50 hover:shadow-xs transition group"
                    >
                      <div className="space-y-4">
                        {/* Top: Avatar & Name & Role */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <StaffAvatar name={item.fullName} src={item.avatarPath} status={item.status} size="lg" />
                            <div className="min-w-0">
                              <strong className="block truncate text-base font-extrabold text-on-surface group-hover:text-primary transition-colors">
                                {item.fullName}
                              </strong>
                              <span className="block truncate text-xs text-on-surface-variant">
                                {item.email}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${role.bg} ${role.text} ${role.border}`}>
                            {role.label}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${status.bg} ${status.text} ${status.border}`}>
                            {status.icon}
                            <span>{status.label}</span>
                          </span>
                        </div>

                        {/* Info details */}
                        <div className="space-y-1.5 pt-2 border-t border-outline-variant/25 text-xs text-on-surface-variant">
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="shrink-0 text-primary/70" />
                            <span className="truncate tabular-nums font-medium">
                              {item.phone || "Chưa cập nhật SĐT"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="shrink-0 text-primary/70" />
                            <span className="truncate tabular-nums">
                              Bắt đầu: {formatDate(item.startDate)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Action */}
                      <div className="mt-5 pt-3 border-t border-outline-variant/30 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSelected(item)}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-outline-variant/60 bg-surface px-3 py-2 text-xs font-bold text-on-surface shadow-2xs hover:border-primary hover:text-primary hover:bg-primary-fixed/20 transition"
                        >
                          <PencilSimple size={14} />
                          <span>Xem hồ sơ &amp; Chỉnh sửa</span>
                        </button>
                      </div>
                    </article>
                  );
                })}

                {visibleStaff.length === 0 && (
                  <div className="col-span-full py-12 text-center space-y-3">
                    <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-surface-container text-on-surface-variant">
                      <UsersThree size={24} />
                    </span>
                    <p className="text-sm font-semibold text-on-surface">Không tìm thấy nhân sự phù hợp.</p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-on-primary shadow-xs"
                      >
                        <X size={14} />
                        <span>Đặt lại bộ lọc</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Pending Invitations */}
        {activeTab === "invitations" && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-on-surface">Danh sách lời mời chờ kích hoạt</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Các lời mời đã gửi qua email và người nhận chưa hoàn tất kích hoạt tài khoản.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-extrabold text-on-primary shadow-xs hover:bg-primary/90 transition"
              >
                <Plus size={14} weight="bold" />
                <span>Gửi lời mời mới</span>
              </button>
            </div>

            <div className="space-y-3">
              {invitations.length === 0 ? (
                <div className="py-12 text-center space-y-3 rounded-2xl border border-dashed border-outline-variant/60 bg-surface-container-low/30">
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-surface-container text-on-surface-variant">
                    <EnvelopeSimple size={24} />
                  </span>
                  <p className="text-sm font-semibold text-on-surface">Không có lời mời nào đang chờ kích hoạt.</p>
                  <p className="text-xs text-on-surface-variant">Tất cả nhân sự đã kích hoạt tài khoản hoặc lời mời đã hết hạn.</p>
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-primary/50 text-primary px-3.5 py-1.5 text-xs font-bold hover:bg-primary-fixed/20 transition"
                  >
                    <UserPlus size={14} />
                    <span>Mời nhân sự mới ngay</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {invitations.map((item) => {
                    const role = roleBadges[item.intendedRole] || { label: item.intendedRole, bg: "bg-surface-container", text: "text-on-surface", border: "border-outline-variant" };
                    return (
                      <article
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-4 rounded-xl border border-outline-variant/40 bg-surface shadow-2xs hover:border-primary/40 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="grid size-10 place-items-center rounded-xl bg-blue-500/15 text-blue-700 font-extrabold text-sm shrink-0">
                            {(item.fullName.charAt(0) || "U").toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <strong className="block truncate text-sm font-bold text-on-surface">
                              {item.fullName}
                            </strong>
                            <span className="block truncate text-xs text-on-surface-variant">
                              {item.email}
                            </span>
                            <div className="mt-1 flex items-center gap-2">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${role.bg} ${role.text} ${role.border}`}>
                                {role.label}
                              </span>
                              <span className="text-[10px] text-on-surface-variant/80 tabular-nums">
                                Hết hạn: {formatDate(item.expiresAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          title="Thu hồi lời mời này"
                          onClick={() => void revoke(item.id)}
                          className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-error/30 text-error hover:bg-error-container/20 transition"
                        >
                          <Trash size={15} />
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Modal: Mời nhân sự mới (Form đóng mở được) */}
      {isInviteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-modal-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsInviteOpen(false);
          }}
        >
          <div className="relative w-full max-w-2xl rounded-2xl border border-outline-variant/50 bg-surface shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <header className="flex items-center justify-between border-b border-outline-variant/40 px-6 py-4 bg-surface-container-lowest">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <UserPlus size={20} weight="bold" />
                </span>
                <div>
                  <h2 id="invite-modal-title" className="text-base font-extrabold text-on-surface">
                    Mời nhân sự mới
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Tạo hồ sơ và gửi lời mời kích hoạt tài khoản qua email.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="grid size-8 place-items-center rounded-xl border border-outline-variant/60 text-on-surface-variant hover:border-primary hover:text-primary transition"
                title="Đóng modal"
              >
                <X size={16} />
              </button>
            </header>

            {/* Modal Body Form */}
            <form id="invite-staff-form" onSubmit={createInvitation} className="custom-scrollbar flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Họ và tên *">
                    <input
                      required
                      placeholder="Nguyễn Văn A"
                      {...inviteField("fullName")}
                      className="w-full px-3.5 py-2 border border-outline-variant/60 rounded-xl bg-surface text-xs font-medium focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition"
                    />
                  </Field>
                </div>

                <Field label="Email đăng nhập *">
                  <input
                    required
                    type="email"
                    placeholder="nhanvien@ieltsspells.com"
                    {...inviteField("email")}
                    className="w-full px-3.5 py-2 border border-outline-variant/60 rounded-xl bg-surface text-xs font-medium focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition"
                  />
                </Field>

                <Field label="Số điện thoại">
                  <input
                    type="tel"
                    placeholder="0912345678"
                    {...inviteField("phone")}
                    className="w-full px-3.5 py-2 border border-outline-variant/60 rounded-xl bg-surface text-xs font-medium focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition"
                  />
                </Field>

                <Field label="Ngày bắt đầu làm việc">
                  <input
                    type="date"
                    {...inviteField("startDate")}
                    className="w-full px-3.5 py-2 border border-outline-variant/60 rounded-xl bg-surface text-xs font-medium focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition"
                  />
                </Field>

                <Field label="Vai trò trong hệ thống *">
                  <RoleSelect
                    value={invite.role}
                    onChange={(value) => setInvite({ ...invite, role: value })}
                    className="w-full px-3.5 py-2 border border-outline-variant/60 rounded-xl bg-surface text-xs font-bold focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition"
                  />
                </Field>

                {/* Avatar Upload */}
                <div className="sm:col-span-2">
                  <Field label="Ảnh đại diện nhân sự (tùy chọn)">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void uploadInviteAvatar(file);
                        event.target.value = "";
                      }}
                    />
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-outline-variant/70 bg-surface-container-low/30 p-3">
                      {avatarPreviewUrl ? (
                        <img
                          src={avatarPreviewUrl}
                          alt="Xem trước ảnh"
                          className="h-12 w-12 rounded-xl border border-outline-variant/40 object-cover"
                        />
                      ) : (
                        <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                          <ImageIcon size={22} />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-on-surface">
                          {avatarFilename || "Chưa chọn tệp ảnh"}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">PNG, JPG, WebP hoặc GIF · Tối đa 5 MB</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={avatarUploading}
                          onClick={() => avatarInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-primary/50 bg-surface px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary-fixed/20 transition disabled:opacity-50"
                        >
                          {avatarUploading ? <SpinnerGap className="animate-spin" size={14} /> : <UploadSimple size={14} />}
                          <span>{avatarPreviewUrl ? "Đổi ảnh" : "Tải ảnh lên"}</span>
                        </button>
                        {avatarPreviewUrl && !avatarUploading && (
                          <button
                            type="button"
                            onClick={clearInviteAvatar}
                            className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-bold text-error hover:bg-error-container/20 transition"
                          >
                            <X size={14} />
                            <span>Xóa</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field label="Đường dẫn CV / Hồ sơ năng lực (nếu có)">
                    <input
                      type="url"
                      placeholder="https://..."
                      {...inviteField("cvPath")}
                      className="w-full px-3.5 py-2 border border-outline-variant/60 rounded-xl bg-surface text-xs font-medium focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition"
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field label="Thông tin chuyên môn &amp; Kinh nghiệm">
                    <textarea
                      rows={2}
                      placeholder="Kinh nghiệm giảng dạy IELTS, bằng cấp, chứng chỉ..."
                      {...inviteField("professionalSummary")}
                      className="w-full px-3.5 py-2 border border-outline-variant/60 rounded-xl bg-surface text-xs font-medium focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none transition"
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field label="Ghi chú nội bộ (chỉ quản trị viên thấy)">
                    <textarea
                      rows={2}
                      placeholder="Ghi chú về mức lương, ca dạy, hợp đồng..."
                      {...inviteField("internalNotes")}
                      className="w-full px-3.5 py-2 border border-outline-variant/60 rounded-xl bg-surface text-xs font-medium focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none transition"
                    />
                  </Field>
                </div>
              </div>
            </form>

            {/* Modal Footer Actions */}
            <footer className="flex items-center justify-end gap-2.5 border-t border-outline-variant/40 px-6 py-3.5 bg-surface-container-lowest">
              <button
                type="button"
                disabled={busy}
                onClick={() => setIsInviteOpen(false)}
                className="rounded-xl border border-outline-variant/60 bg-surface px-4 py-2 text-xs font-bold text-on-surface hover:bg-surface-container transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="invite-staff-form"
                disabled={busy || avatarUploading}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-extrabold text-on-primary shadow-sm hover:opacity-95 active:scale-[.98] transition disabled:opacity-50"
              >
                {busy ? <SpinnerGap className="animate-spin" size={15} /> : <UserPlus size={15} weight="bold" />}
                <span>{busy ? "Đang gửi lời mời..." : "Tạo hồ sơ và gửi lời mời"}</span>
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Detail & Edit Slide-over Drawer */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <aside className="custom-scrollbar flex h-full w-full max-w-lg flex-col overflow-y-auto bg-surface p-6 shadow-2xl transition-all">
            {/* Drawer Header */}
            <header className="flex items-start justify-between gap-3 border-b border-outline-variant/40 pb-5">
              <div className="flex items-center gap-3">
                <StaffAvatar name={selected.fullName} src={selected.avatarPath} status={selected.status} size="lg" />
                <div>
                  <h2 className="font-display text-lg font-bold text-on-surface">{selected.fullName}</h2>
                  <p className="text-xs text-on-surface-variant">{selected.email}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${roleBadges[selected.role]?.bg} ${roleBadges[selected.role]?.text} ${roleBadges[selected.role]?.border}`}>
                      {roleLabels[selected.role]}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${statusBadges[selected.status]?.bg} ${statusBadges[selected.status]?.text} ${statusBadges[selected.status]?.border}`}>
                      {statusBadges[selected.status]?.icon}
                      <span>{statusLabels[selected.status]}</span>
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="grid size-9 place-items-center rounded-xl border border-outline-variant/60 text-on-surface-variant hover:border-primary hover:text-primary transition"
                title="Đóng bảng chi tiết"
              >
                <X size={17} />
              </button>
            </header>

            {/* Profile Edit Form */}
            <form className="flex-1 space-y-4 py-5" onSubmit={saveProfile}>
              <Field label="Họ và tên">
                <input
                  required
                  {...editField("fullName")}
                  className="px-3.5 py-2 border border-outline-variant/60 rounded-xl bg-surface text-xs font-medium focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition"
                />
              </Field>

              <Field label="Số điện thoại">
                <input
                  type="tel"
                  {...editField("phone")}
                  className="px-3.5 py-2 border border-outline-variant/60 rounded-xl bg-surface text-xs font-medium focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Ngày bắt đầu">
                  <input
                    type="date"
                    {...editField("startDate")}
                    className="px-3.5 py-2 border border-outline-variant/60 rounded-xl bg-surface text-xs font-medium focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition"
                  />
                </Field>

                <Field label="Đường dẫn CV (nếu có)">
                  <input
                    type="url"
                    {...editField("cvPath")}
                    className="px-3.5 py-2 border border-outline-variant/60 rounded-xl bg-surface text-xs font-medium focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition"
                  />
                </Field>
              </div>

              <Field label="Thông tin chuyên môn &amp; Kinh nghiệm">
                <textarea
                  rows={3}
                  {...editField("professionalSummary")}
                  className="px-3.5 py-2 border border-outline-variant/60 rounded-xl bg-surface text-xs font-medium focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none transition"
                />
              </Field>

              <Field label="Ghi chú nội bộ">
                <textarea
                  rows={3}
                  {...editField("internalNotes")}
                  className="px-3.5 py-2 border border-outline-variant/60 rounded-xl bg-surface text-xs font-medium focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none transition"
                />
              </Field>

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-on-primary shadow-xs hover:opacity-95 transition disabled:opacity-50"
              >
                {busy ? "Đang lưu..." : "Lưu thay đổi hồ sơ"}
              </button>
            </form>

            {/* Access Control & Actions */}
            <div className="border-t border-outline-variant/40 pt-5 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-on-surface">
                Phân quyền &amp; Trạng thái tài khoản
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant">Đổi vai trò trong hệ thống</label>
                <RoleSelect
                  value={selected.role}
                  onChange={(value) => void changeRole(value)}
                  disabled={busy}
                  className="w-full px-3.5 py-2 border border-outline-variant/60 rounded-xl bg-surface text-xs font-bold focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none disabled:bg-surface-container transition"
                />
              </div>

              <div className="flex flex-wrap gap-2.5 pt-2">
                {selected.status === "ACTIVE" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void changeStatus("SUSPENDED")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3.5 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition"
                  >
                    <Lock size={15} />
                    <span>Tạm ngưng công tác</span>
                  </button>
                )}

                {selected.status === "SUSPENDED" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void changeStatus("ACTIVE")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition"
                  >
                    <Briefcase size={15} />
                    <span>Kích hoạt lại làm việc</span>
                  </button>
                )}

                {selected.status !== "OFFBOARDED" && selected.authUserId && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void changeStatus("OFFBOARDED")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-error/30 bg-error-container/15 px-3.5 py-2 text-xs font-bold text-error hover:bg-error-container/25 transition"
                  >
                    <SignOut size={15} />
                    <span>Xác nhận thôi việc</span>
                  </button>
                )}
              </div>

              <p className="text-[11px] text-on-surface-variant/80">
                Lưu ý: Thay đổi vai trò hoặc trạng thái sẽ có hiệu lực ngay sau khi nhân sự đăng nhập lại phiên mới.
              </p>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

function StaffAvatar({
  name,
  src,
  status,
  size = "md",
}: {
  name: string;
  src: string | null;
  status?: StaffStatus;
  size?: "sm" | "md" | "lg";
}) {
  const initial = (name.trim().charAt(0) || "U").toUpperCase();
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
  }[size];

  return (
    <div className="relative shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses} rounded-xl object-cover ring-1 ring-outline-variant/30`}
        />
      ) : (
        <span
          className={`grid ${sizeClasses} place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/30 font-extrabold text-primary shadow-2xs`}
        >
          {initial}
        </span>
      )}
    </div>
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
  value: StaffRole;
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
