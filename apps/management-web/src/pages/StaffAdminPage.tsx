import {
  ArrowClockwise, ArrowCounterClockwise, Briefcase, Calendar, CaretDown, Check,
  Clock, Copy, DotsThreeVertical, EnvelopeSimple, FunnelSimple, GraduationCap,
  Image as ImageIcon, Lock, LockOpen, MagnifyingGlass, PencilSimple, Phone, Plus,
  Rows, ShieldCheck, SignOut, SpinnerGap, SquaresFour, Trash, UploadSimple,
  User, UserPlus, UsersThree, X,
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
  ADMIN: "Quản trị viên hệ thống",
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
  OFFBOARDED: "Đã thôi việc",
};

const roleConfig: Record<StaffRole, { label: string; badgeClass: string; icon: ReactNode }> = {
  ADMIN: {
    label: "Quản trị viên",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50",
    icon: <ShieldCheck size={13} weight="bold" className="shrink-0 text-purple-600 dark:text-purple-400" />,
  },
  TEACHER: {
    label: "Giáo viên",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50",
    icon: <GraduationCap size={13} weight="bold" className="shrink-0 text-emerald-600 dark:text-emerald-400" />,
  },
  ADMISSIONS: {
    label: "Tuyển sinh",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50",
    icon: <UsersThree size={13} weight="bold" className="shrink-0 text-blue-600 dark:text-blue-400" />,
  },
  SOCIAL_MEDIA: {
    label: "Social Media",
    badgeClass: "bg-pink-50 text-pink-700 border-pink-200/80 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800/50",
    icon: <Briefcase size={13} weight="bold" className="shrink-0 text-pink-600 dark:text-pink-400" />,
  },
  STUDENT_SUPPORT: {
    label: "Hỗ trợ học viên",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50",
    icon: <Clock size={13} weight="bold" className="shrink-0 text-amber-600 dark:text-amber-400" />,
  },
};

const statusConfig: Record<StaffStatus, { label: string; dot: string; badgeClass: string }> = {
  ACTIVE: {
    label: "Đang làm việc",
    dot: "bg-emerald-500 ring-2 ring-emerald-500/20",
    badgeClass: "bg-emerald-50/80 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/50",
  },
  INVITED: {
    label: "Chờ kích hoạt",
    dot: "bg-blue-500 ring-2 ring-blue-500/20",
    badgeClass: "bg-blue-50/80 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/50",
  },
  DRAFT: {
    label: "Bản nháp",
    dot: "bg-slate-400 ring-2 ring-slate-400/20",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/50",
  },
  SUSPENDED: {
    label: "Tạm ngưng",
    dot: "bg-amber-500 ring-2 ring-amber-500/20",
    badgeClass: "bg-amber-50/80 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/50",
  },
  OFFBOARDED: {
    label: "Đã thôi việc",
    dot: "bg-rose-500 ring-2 ring-rose-500/20",
    badgeClass: "bg-rose-50/80 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/50",
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
  const [invite, setInvite] = useState(emptyInvite);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selected, setSelected] = useState<Staff | null>(null);

  // Filters & UI states
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | StaffRole>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | StaffStatus>("ALL");
  const [sortOption, setSortOption] = useState<"DEFAULT" | "NAME_ASC" | "DATE_DESC" | "DATE_ASC">("DEFAULT");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"staff" | "invitations">("staff");
  const [viewMode, setViewMode] = useState<"table" | "cards">(() => {
    if (typeof window === "undefined") return "table";
    return window.localStorage.getItem("staff_admin_view_mode") === "cards" ? "cards" : "table";
  });
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  const copyToClipboard = (e: React.MouseEvent, text: string, key: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

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

  const activeCount = useMemo(() => staff.filter((s) => s.status === "ACTIVE").length, [staff]);

  const visibleStaff = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const result = staff.filter((item) => {
      const matchesQuery =
        !keyword ||
        `${item.fullName} ${item.email} ${item.phone ?? ""}`
          .toLowerCase()
          .includes(keyword);
      const matchesRole = roleFilter === "ALL" || item.role === roleFilter;
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });

    if (sortOption === "NAME_ASC") {
      result.sort((a, b) => a.fullName.localeCompare(b.fullName, "vi"));
    } else if (sortOption === "DATE_DESC") {
      result.sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));
    } else if (sortOption === "DATE_ASC") {
      result.sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
    }

    return result;
  }, [staff, query, roleFilter, statusFilter, sortOption]);

  const activeFilterCount =
    (roleFilter !== "ALL" ? 1 : 0) +
    (statusFilter !== "ALL" ? 1 : 0) +
    (sortOption !== "DEFAULT" ? 1 : 0);
  const hasActiveFilters = Boolean(query.trim()) || activeFilterCount > 0;

  const resetFilters = () => {
    setQuery("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setSortOption("DEFAULT");
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

  async function toggleStaffStatus(item: Staff, e: React.MouseEvent) {
    e.stopPropagation();
    if (item.status === "ACTIVE") {
      if (!window.confirm(`Xác nhận tạm ngưng công tác nhân sự "${item.fullName}"?`)) return;
      await runAction(() => apiFetch(`/admin/staff/${item.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "SUSPENDED" }) }), `Đã tạm ngưng tài khoản ${item.fullName}.`);
    } else if (item.status === "SUSPENDED") {
      if (!window.confirm(`Kích hoạt lại làm việc cho nhân sự "${item.fullName}"?`)) return;
      await runAction(() => apiFetch(`/admin/staff/${item.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "ACTIVE" }) }), `Đã kích hoạt lại tài khoản ${item.fullName}.`);
    }
  }

  async function changeStatus(status: "ACTIVE" | "SUSPENDED" | "OFFBOARDED") {
    if (!selected) return;
    const message = status === "ACTIVE" ? "kích hoạt lại" : status === "SUSPENDED" ? "tạm ngưng" : "cho thôi việc";
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
    <main className="space-y-4 pb-12">
      {/* Workspace Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-outline-variant/30 pb-3.5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/25 text-primary shadow-2xs ring-1 ring-primary/20 shrink-0">
            <UsersThree size={22} weight="duotone" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl sm:text-2xl font-extrabold text-on-background tracking-tight">
                Quản lý nhân sự
              </h1>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold tabular-nums text-primary">
                {staff.length} nhân sự
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">
              Phân quyền tài khoản, vai trò nhiệm vụ và trạng thái làm việc nội bộ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-outline-variant/70 bg-surface px-3.5 text-xs font-bold text-on-surface shadow-2xs hover:bg-surface-container hover:border-primary/40 transition active:scale-[0.98]"
            onClick={() => void load()}
            title="Làm mới dữ liệu nhân sự"
          >
            <ArrowClockwise size={15} weight="bold" />
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            onClick={() => setIsInviteOpen(true)}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary hover:bg-primary/90 text-on-primary px-4 text-xs font-bold shadow-xs active:scale-[0.98] transition"
          >
            <UserPlus size={16} weight="bold" />
            <span>Mời nhân sự mới</span>
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

      {/* Main Container */}
      <section className="rounded-2xl border border-outline-variant/40 bg-surface shadow-xs overflow-hidden">
        {/* Navigation Tabs Bar */}
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
                      ? "bg-primary-fixed/50 text-primary shadow-2xs font-bold"
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
                      ? "bg-primary-fixed/50 text-primary shadow-2xs font-bold"
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
          <div className="p-4 sm:p-5 space-y-3.5">
            {/* Filter Toolbar */}
            <div className="overflow-hidden rounded-xl border border-outline-variant/35 bg-surface shadow-xs">
              {/* Main Toolbar Row */}
              <div className="flex flex-col gap-2 p-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-md md:max-w-lg">
                  <MagnifyingGlass
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70"
                  />
                  <input
                    type="text"
                    placeholder="Tìm theo tên nhân sự, email, số điện thoại..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-9 w-full rounded-xl border border-outline-variant/70 bg-surface pl-9 pr-8 text-xs font-medium text-on-surface outline-none transition placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 grid size-5 place-items-center rounded-md text-on-surface-variant/60 hover:text-on-surface"
                      title="Xóa tìm kiếm"
                    >
                      <X size={12} weight="bold" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Super Filter Toggle */}
                  <button
                    type="button"
                    aria-expanded={isFilterOpen}
                    onClick={() => setIsFilterOpen((prev) => !prev)}
                    className={`flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition duration-150 ${
                      isFilterOpen || activeFilterCount > 0
                        ? "border-primary bg-primary/10 text-primary shadow-2xs"
                        : "border-outline-variant/70 bg-surface text-on-surface-variant hover:border-primary/50 hover:bg-surface-container-low hover:text-on-surface"
                    }`}
                    title="Bộ lọc nâng cao"
                  >
                    <FunnelSimple size={14} weight={isFilterOpen || activeFilterCount > 0 ? "fill" : "bold"} />
                    <span>Bộ lọc</span>
                    {activeFilterCount > 0 && (
                      <span className="flex size-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-white">
                        {activeFilterCount}
                      </span>
                    )}
                    <CaretDown size={11} weight="bold" className={`transition-transform duration-200 ${isFilterOpen ? "rotate-180" : ""}`} />
                  </button>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl border border-primary/20 bg-primary/5 px-2.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-on-primary"
                      title="Đặt lại toàn bộ bộ lọc"
                    >
                      <ArrowCounterClockwise size={13} weight="bold" />
                      <span className="hidden sm:inline">Đặt lại</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible Super Filter Panel */}
              {isFilterOpen && (
                <div className="border-t border-outline-variant/35 bg-surface-container-low/40 p-3 sm:p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {/* Role Filter */}
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                        Vai trò / Phân quyền
                      </label>
                      <div className="relative">
                        <select
                          value={roleFilter}
                          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
                          className="h-9 w-full appearance-none rounded-xl border border-outline-variant/70 bg-surface pl-3 pr-8 text-xs font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
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
                        <CaretDown size={14} weight="bold" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                        Trạng thái làm việc
                      </label>
                      <div className="relative">
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                          className="h-9 w-full appearance-none rounded-xl border border-outline-variant/70 bg-surface pl-3 pr-8 text-xs font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
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
                        <CaretDown size={14} weight="bold" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      </div>
                    </div>

                    {/* Sort Option */}
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                        Sắp xếp theo
                      </label>
                      <div className="relative">
                        <select
                          value={sortOption}
                          onChange={(e) => setSortOption(e.target.value as typeof sortOption)}
                          className="h-9 w-full appearance-none rounded-xl border border-outline-variant/70 bg-surface pl-3 pr-8 text-xs font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                        >
                          <option value="DEFAULT">Mặc định (Mới nhất)</option>
                          <option value="NAME_ASC">Tên nhân sự (A-Z)</option>
                          <option value="DATE_DESC">Ngày bắt đầu (Mới nhất)</option>
                          <option value="DATE_ASC">Ngày bắt đầu (Cũ nhất)</option>
                        </select>
                        <CaretDown size={14} weight="bold" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      </div>
                    </div>
                  </div>

                  {/* Panel Footer */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/30 pt-2">
                    <span className="text-xs font-semibold text-on-surface-variant">
                      Tìm thấy <strong className="font-bold text-primary">{visibleStaff.length}</strong> / {staff.length} nhân sự
                    </span>
                    <div className="flex items-center gap-2">
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-bold text-primary transition hover:bg-primary hover:text-on-primary"
                        >
                          <ArrowCounterClockwise size={12} weight="bold" />
                          <span>Đặt lại bộ lọc</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsFilterOpen(false)}
                        className="rounded-lg px-2.5 py-1 text-xs font-bold text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
                      >
                        Thu gọn
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Filter Chips */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-1.5 border-t border-outline-variant/30 bg-surface px-3 py-1.5 text-xs">
                  <span className="mr-1 text-[11px] font-bold text-on-surface-variant">Đang lọc:</span>
                  {query.trim() && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/5 px-2 py-0.5 text-[11px] font-bold text-primary">
                      <span>"{query.trim()}"</span>
                      <button type="button" onClick={() => setQuery("")} className="hover:text-error" title="Xóa từ khóa">
                        <X size={11} weight="bold" />
                      </button>
                    </span>
                  )}
                  {roleFilter !== "ALL" && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/5 px-2 py-0.5 text-[11px] font-bold text-primary">
                      <span>{roleConfig[roleFilter]?.label || roleFilter}</span>
                      <button type="button" onClick={() => setRoleFilter("ALL")} className="hover:text-error" title="Bỏ lọc vai trò">
                        <X size={11} weight="bold" />
                      </button>
                    </span>
                  )}
                  {statusFilter !== "ALL" && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/5 px-2 py-0.5 text-[11px] font-bold text-primary">
                      <span>{statusConfig[statusFilter]?.label || statusFilter}</span>
                      <button type="button" onClick={() => setStatusFilter("ALL")} className="hover:text-error" title="Bỏ lọc trạng thái">
                        <X size={11} weight="bold" />
                      </button>
                    </span>
                  )}
                  {sortOption !== "DEFAULT" && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/5 px-2 py-0.5 text-[11px] font-bold text-primary">
                      <span>{sortOption === "NAME_ASC" ? "Tên A-Z" : sortOption === "DATE_DESC" ? "Bắt đầu mới nhất" : "Bắt đầu cũ nhất"}</span>
                      <button type="button" onClick={() => setSortOption("DEFAULT")} className="hover:text-error" title="Bỏ sắp xếp">
                        <X size={11} weight="bold" />
                      </button>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="ml-1 text-[11px] font-bold text-on-surface-variant transition hover:text-error hover:underline"
                  >
                    Xóa tất cả
                  </button>
                </div>
              )}
            </div>

            {/* View Mode 1: Table View (Enterprise Standard) */}
            {viewMode === "table" ? (
              <div className="overflow-hidden rounded-xl border border-outline-variant/40 bg-surface shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs min-w-[820px]">
                    <thead>
                      <tr className="border-b border-outline-variant/40 bg-surface-container-low/70">
                        <th className="px-5 py-3 font-extrabold uppercase tracking-wider text-on-surface-variant text-[11px]">
                          Nhân sự
                        </th>
                        <th className="px-5 py-3 font-extrabold uppercase tracking-wider text-on-surface-variant text-[11px]">
                          Vai trò &amp; Quyền hạn
                        </th>
                        <th className="px-5 py-3 font-extrabold uppercase tracking-wider text-on-surface-variant text-[11px]">
                          Trạng thái
                        </th>
                        <th className="px-5 py-3 font-extrabold uppercase tracking-wider text-on-surface-variant text-[11px]">
                          Số điện thoại
                        </th>
                        <th className="px-5 py-3 font-extrabold uppercase tracking-wider text-on-surface-variant text-[11px]">
                          Ngày bắt đầu
                        </th>
                        <th className="px-5 py-3 font-extrabold uppercase tracking-wider text-on-surface-variant text-[11px] text-right">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {visibleStaff.map((item) => {
                        const role = roleConfig[item.role] || {
                          label: item.role,
                          badgeClass: "bg-surface-container text-on-surface border-outline-variant",
                          icon: <User size={13} />,
                        };
                        const status = statusConfig[item.status] || {
                          label: item.status,
                          dot: "bg-slate-400",
                          badgeClass: "bg-surface-container text-on-surface border-outline-variant",
                        };

                        return (
                          <tr
                            key={item.id}
                            onClick={() => setSelected(item)}
                            className="hover:bg-primary-fixed/10 dark:hover:bg-primary/5 transition-colors cursor-pointer group"
                          >
                            {/* Staff Member Info */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <StaffAvatar name={item.fullName} src={item.avatarPath} status={item.status} size="md" />
                                <div className="min-w-0">
                                  <span className="block truncate text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                                    {item.fullName}
                                  </span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="truncate text-xs text-on-surface-variant">
                                      {item.email}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => copyToClipboard(e, item.email, `email-${item.id}`)}
                                      className="grid size-4 place-items-center text-on-surface-variant/40 hover:text-primary transition"
                                      title="Sao chép email"
                                    >
                                      {copiedKey === `email-${item.id}` ? (
                                        <Check size={11} weight="bold" className="text-emerald-600" />
                                      ) : (
                                        <Copy size={11} />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Role */}
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${role.badgeClass}`}
                              >
                                {role.icon}
                                <span>{role.label}</span>
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-bold border ${status.badgeClass}`}
                              >
                                <span className={`size-2 rounded-full ${status.dot}`} />
                                <span>{status.label}</span>
                              </span>
                            </td>

                            {/* Contact Phone */}
                            <td className="px-5 py-3.5">
                              {item.phone ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold tabular-nums text-on-surface">
                                    <Phone size={13} className="shrink-0 text-primary/70" />
                                    <span>{item.phone}</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => copyToClipboard(e, item.phone ?? "", `phone-${item.id}`)}
                                    className="grid size-4 place-items-center text-on-surface-variant/40 hover:text-primary transition"
                                    title="Sao chép số điện thoại"
                                  >
                                    {copiedKey === `phone-${item.id}` ? (
                                      <Check size={11} weight="bold" className="text-emerald-600" />
                                    ) : (
                                      <Copy size={11} />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-on-surface-variant/50">—</span>
                              )}
                            </td>

                            {/* Start Date */}
                            <td className="px-5 py-3.5 text-on-surface-variant font-medium tabular-nums text-xs">
                              {formatDate(item.startDate)}
                            </td>

                            {/* Quick Actions */}
                            <td className="px-5 py-3.5 text-right">
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                {/* Quick lock/unlock toggle */}
                                {item.status === "ACTIVE" && (
                                  <button
                                    type="button"
                                    onClick={(e) => void toggleStaffStatus(item, e)}
                                    className="grid size-8 place-items-center rounded-lg border border-outline-variant/60 bg-surface text-on-surface-variant hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition shadow-2xs"
                                    title="Tạm ngưng công tác"
                                  >
                                    <Lock size={14} />
                                  </button>
                                )}
                                {item.status === "SUSPENDED" && (
                                  <button
                                    type="button"
                                    onClick={(e) => void toggleStaffStatus(item, e)}
                                    className="grid size-8 place-items-center rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition shadow-2xs"
                                    title="Kích hoạt lại làm việc"
                                  >
                                    <LockOpen size={14} />
                                  </button>
                                )}

                                {/* Open drawer button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelected(item);
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/70 bg-surface px-2.5 py-1.5 text-xs font-bold text-on-surface shadow-2xs hover:border-primary hover:text-primary hover:bg-primary-fixed/20 transition"
                                >
                                  <PencilSimple size={13} />
                                  <span>Chi tiết</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer Summary */}
                <div className="flex flex-wrap items-center justify-between border-t border-outline-variant/30 bg-surface-container-low/40 px-5 py-2.5 text-xs text-on-surface-variant font-medium">
                  <span>
                    Hiển thị <strong className="font-bold text-on-surface">{visibleStaff.length}</strong> / {staff.length} nhân sự
                    {activeCount > 0 && ` (${activeCount} đang làm việc)`}
                  </span>
                  <span className="text-[11px] text-on-surface-variant/70 hidden sm:inline">
                    Nhấp vào bất kỳ hàng nào để xem &amp; chỉnh sửa hồ sơ chi tiết
                  </span>
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
              /* View Mode 2: Grid Cards View */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-3.5">
                {visibleStaff.map((item) => {
                  const role = roleConfig[item.role] || {
                    label: item.role,
                    badgeClass: "bg-surface-container text-on-surface border-outline-variant",
                    icon: <User size={13} />,
                  };
                  const status = statusConfig[item.status] || {
                    label: item.status,
                    dot: "bg-slate-400",
                    badgeClass: "bg-surface-container text-on-surface border-outline-variant",
                  };

                  return (
                    <article
                      key={item.id}
                      onClick={() => setSelected(item)}
                      className="flex flex-col justify-between rounded-2xl border border-outline-variant/40 bg-surface p-4 shadow-2xs hover:border-primary/50 hover:shadow-xs transition group cursor-pointer"
                    >
                      <div className="space-y-3">
                        {/* Header: Avatar & Name */}
                        <div className="flex items-center gap-3">
                          <StaffAvatar name={item.fullName} src={item.avatarPath} status={item.status} size="lg" />
                          <div className="min-w-0 flex-1">
                            <strong className="block truncate text-sm font-extrabold text-on-surface group-hover:text-primary transition-colors">
                              {item.fullName}
                            </strong>
                            <span className="block truncate text-xs text-on-surface-variant">
                              {item.email}
                            </span>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${role.badgeClass}`}>
                            {role.icon}
                            <span>{role.label}</span>
                          </span>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${status.badgeClass}`}>
                            <span className={`size-1.5 rounded-full ${status.dot}`} />
                            <span>{status.label}</span>
                          </span>
                        </div>

                        {/* Details */}
                        <div className="space-y-1 pt-2 border-t border-outline-variant/25 text-xs text-on-surface-variant">
                          <div className="flex items-center gap-2">
                            <Phone size={13} className="shrink-0 text-primary/70" />
                            <span className="truncate tabular-nums font-medium">
                              {item.phone || "Chưa có SĐT"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={13} className="shrink-0 text-primary/70" />
                            <span className="truncate tabular-nums">
                              Bắt đầu: {formatDate(item.startDate)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action */}
                      <div className="mt-4 pt-2.5 border-t border-outline-variant/30 flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(item);
                          }}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-outline-variant/60 bg-surface px-3 py-1.5 text-xs font-bold text-on-surface shadow-2xs hover:border-primary hover:text-primary hover:bg-primary-fixed/20 transition"
                        >
                          <PencilSimple size={13} />
                          <span>Chi tiết hồ sơ</span>
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
          <div className="p-4 sm:p-5 space-y-4">
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
                    const role = roleConfig[item.intendedRole] || {
                      label: item.intendedRole,
                      badgeClass: "bg-surface-container text-on-surface border-outline-variant",
                      icon: <User size={13} />,
                    };
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
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${role.badgeClass}`}>
                                {role.icon}
                                <span>{role.label}</span>
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

      {/* Modal: Mời nhân sự mới */}
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
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${roleConfig[selected.role]?.badgeClass}`}>
                      {roleConfig[selected.role]?.icon}
                      <span>{roleLabels[selected.role]}</span>
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${statusConfig[selected.status]?.badgeClass}`}>
                      <span className={`size-1.5 rounded-full ${statusConfig[selected.status]?.dot}`} />
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
    lg: "h-12 w-12 text-base",
  }[size];

  return (
    <div className="relative shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses} rounded-xl object-cover ring-1 ring-outline-variant/60 shadow-2xs`}
        />
      ) : (
        <span
          className={`grid ${sizeClasses} place-items-center rounded-xl bg-primary/10 font-black text-primary ring-1 ring-primary/20 shadow-2xs`}
        >
          {initial}
        </span>
      )}
      {status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-surface ${
            size === "sm" ? "size-2.5" : size === "md" ? "size-3" : "size-3.5"
          } ${
            status === "ACTIVE"
              ? "bg-emerald-500"
              : status === "INVITED"
              ? "bg-blue-500"
              : status === "SUSPENDED"
              ? "bg-amber-500"
              : status === "OFFBOARDED"
              ? "bg-rose-500"
              : "bg-slate-400"
          }`}
          title={statusLabels[status]}
        />
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
