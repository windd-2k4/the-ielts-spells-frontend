import {
  ArrowRight,
  CalendarBlank,
  CaretDown,
  CaretLeft,
  CaretRight,
  ChalkboardTeacher,
  Funnel,
  MagnifyingGlass,
  UserCircleCheck,
  UserCircleMinus,
  WarningCircle,
} from "@phosphor-icons/react";
import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Page, StudentLifecycleStatus, StudentSummary } from "../academic-types";
import { date } from "../academic-types";
import { PageHeader } from "../components/AdminUi";
import { apiFetch } from "../lib/api";

const PAGE_SIZE = 15;
type ActivityFilter = "all" | "true" | "false";
type LifecycleFilter = "ALL" | StudentLifecycleStatus;
type DateRangePreset = "ALL" | "30_DAYS" | "90_DAYS" | "180_DAYS" | "THIS_YEAR" | "CUSTOM";
type SortOption = "JOINED_DESC" | "JOINED_ASC" | "NAME_ASC";

const lifecycleOptions: Array<{ value: LifecycleFilter; label: string; description: string }> = [
  { value: "ALL", label: "Tất cả", description: "Toàn bộ hồ sơ học viên" },
  { value: "ACTIVE", label: "Đang học", description: "Có lượt học đang hoạt động" },
  { value: "PENDING", label: "Chờ xác nhận", description: "Ghi danh chưa được kích hoạt" },
  { value: "PAUSED", label: "Bảo lưu", description: "Đang tạm dừng khóa học" },
  { value: "COMPLETED", label: "Hoàn thành", description: "Đã hoàn tất khóa gần nhất" },
  { value: "WITHDRAWN", label: "Đã rút", description: "Đã kết thúc ghi danh" },
  { value: "NONE", label: "Chưa ghi danh", description: "Có hồ sơ nhưng chưa xếp lớp" },
];

const lifecycleMeta: Record<StudentLifecycleStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Đang học", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  PENDING: { label: "Chờ xác nhận", className: "border-amber-200 bg-amber-50 text-amber-800" },
  PAUSED: { label: "Đang bảo lưu", className: "border-sky-200 bg-sky-50 text-sky-700" },
  COMPLETED: { label: "Đã hoàn thành", className: "border-violet-200 bg-violet-50 text-violet-700" },
  WITHDRAWN: { label: "Đã rút", className: "border-rose-200 bg-rose-50 text-rose-700" },
  NONE: { label: "Chưa ghi danh", className: "border-outline-variant/50 bg-surface-container text-on-surface-variant" },
};

const datePresets: Array<{ value: DateRangePreset; label: string }> = [
  { value: "ALL", label: "Tất cả thời gian" },
  { value: "30_DAYS", label: "30 ngày gần đây" },
  { value: "90_DAYS", label: "3 tháng gần đây" },
  { value: "180_DAYS", label: "6 tháng gần đây" },
  { value: "THIS_YEAR", label: "Năm nay" },
  { value: "CUSTOM", label: "Tùy chọn khoảng ngày" },
];

export function StudentsPage() {
  const [pageData, setPageData] = useState<Page<StudentSummary> | null>(null);
  const [query, setQuery] = useState("");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [lifecycleFilter, setLifecycleFilter] = useState<LifecycleFilter>("ALL");
  const [datePreset, setDatePreset] = useState<DateRangePreset>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("JOINED_DESC");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => setPage(0), [deferredQuery, activityFilter, lifecycleFilter, datePreset, fromDate, toDate, sortOption]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ q: deferredQuery.trim(), page: String(page), size: String(PAGE_SIZE) });
      if (activityFilter !== "all") params.set("active", activityFilter);
      if (lifecycleFilter !== "ALL") params.set("lifecycle", lifecycleFilter);

      try {
        const directory = await apiFetch<Page<StudentSummary>>(`/admin/students?${params.toString()}`);
        if (!cancelled) setPageData(directory);
      } catch (value) {
        if (!cancelled) setError(value instanceof Error ? value.message : "Không tải được danh sách học viên");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [activityFilter, deferredQuery, lifecycleFilter, page, reloadKey]);

  // Client-side date calculation & filtering on current page content
  const rawStudents = pageData?.content ?? [];

  const processedStudents = useMemo(() => {
    let list = [...rawStudents];

    // Calculate preset date range if selected
    let effectiveFrom = fromDate;
    let effectiveTo = toDate;

    const now = new Date();
    if (datePreset === "30_DAYS") {
      const d = new Date(); d.setDate(d.getDate() - 30);
      effectiveFrom = d.toISOString().split("T")[0];
    } else if (datePreset === "90_DAYS") {
      const d = new Date(); d.setDate(d.getDate() - 90);
      effectiveFrom = d.toISOString().split("T")[0];
    } else if (datePreset === "180_DAYS") {
      const d = new Date(); d.setDate(d.getDate() - 180);
      effectiveFrom = d.toISOString().split("T")[0];
    } else if (datePreset === "THIS_YEAR") {
      effectiveFrom = `${now.getFullYear()}-01-01`;
    }

    if (effectiveFrom) {
      list = list.filter(student => student.joinedAt >= effectiveFrom);
    }
    if (effectiveTo) {
      list = list.filter(student => student.joinedAt <= effectiveTo);
    }

    // Apply sorting
    list.sort((a, b) => {
      if (sortOption === "JOINED_DESC") return (b.joinedAt || "").localeCompare(a.joinedAt || "");
      if (sortOption === "JOINED_ASC") return (a.joinedAt || "").localeCompare(b.joinedAt || "");
      if (sortOption === "NAME_ASC") return a.fullName.localeCompare(b.fullName, "vi");
      return 0;
    });

    return list;
  }, [rawStudents, datePreset, fromDate, toDate, sortOption]);

  const total = pageData?.totalElements ?? 0;
  const missingContact = processedStudents.filter(student => !student.email || !student.phone).length;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Hồ sơ và học vụ"
        title="Quản lý học viên"
        description="Theo dõi toàn bộ hồ sơ học viên, phân loại theo học vụ và quản lý mốc thời gian gia nhập."
      />

      {/* Overview Metrics Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Hồ sơ theo bộ lọc" value={total} icon={<UserCircleCheck size={23} />} />
        <Metric label="Đang hiển thị" value={processedStudents.length} icon={<ChalkboardTeacher size={23} />} tone="primary" />
        <Metric label="Thiếu thông tin liên hệ" value={missingContact} icon={<WarningCircle size={23} />} tone={missingContact ? "warning" : "default"} />
      </div>

      {/* Filter and Search Panel */}
      <section className="overflow-hidden rounded-[22px] border border-outline-variant/35 bg-surface shadow-sm">
        {/* Main Search & Activity Filter */}
        <div className="border-b border-outline-variant/25 p-4 md:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="relative block flex-1">
              <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.08em] text-primary">Tìm nhanh học viên</span>
              <MagnifyingGlass className="absolute bottom-3.5 left-4 text-on-surface-variant" size={20} />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Tên, mã học viên, email hoặc số điện thoại..."
                className="min-h-12 w-full rounded-xl border border-outline-variant/60 bg-surface py-3 pl-12 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </label>

            <label className="block min-w-48">
              <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.08em] text-primary">Trạng thái tài khoản</span>
              <select
                value={activityFilter}
                onChange={event => setActivityFilter(event.target.value as ActivityFilter)}
                className="min-h-12 w-full rounded-xl border border-outline-variant/60 bg-surface px-3 py-3 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                <option value="all">Tất cả tài khoản</option>
                <option value="true">Đang hoạt động</option>
                <option value="false">Đã khóa</option>
              </select>
            </label>

            <label className="block min-w-48">
              <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.08em] text-primary">Sắp xếp theo</span>
              <select
                value={sortOption}
                onChange={event => setSortOption(event.target.value as SortOption)}
                className="min-h-12 w-full rounded-xl border border-outline-variant/60 bg-surface px-3 py-3 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                <option value="JOINED_DESC">Mới gia nhập trước</option>
                <option value="JOINED_ASC">Gia nhập lâu hơn trước</option>
                <option value="NAME_ASC">Tên học viên (A-Z)</option>
              </select>
            </label>
          </div>
        </div>

        {/* Date Range Filtering (Phân chia theo ngày tháng vào học) */}
        <div className="border-b border-outline-variant/25 bg-surface-container-low/30 p-4 md:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
              <CalendarBlank size={18} className="text-primary" />
              <span>Phân chia theo thời gian gia nhập:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {datePresets.map(preset => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    setDatePreset(preset.value);
                    if (preset.value !== "CUSTOM") {
                      setFromDate("");
                      setToDate("");
                    }
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    datePreset === preset.value
                      ? "bg-primary text-on-primary shadow-xs"
                      : "bg-surface border border-outline-variant/40 text-on-surface-variant hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {datePreset === "CUSTOM" && (
              <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="rounded-lg border border-outline-variant/60 bg-surface px-2.5 py-1 text-xs outline-none focus:border-primary"
                  title="Từ ngày gia nhập"
                />
                <span className="text-xs text-on-surface-variant">đến</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="rounded-lg border border-outline-variant/60 bg-surface px-2.5 py-1 text-xs outline-none focus:border-primary"
                  title="Đến ngày gia nhập"
                />
              </div>
            )}
          </div>
        </div>

        {/* Lifecycle Status Tabs */}
        <div className="overflow-x-auto px-4 py-3 md:px-5">
          <div className="flex min-w-max gap-2" role="tablist" aria-label="Phân loại học viên theo học vụ">
            {lifecycleOptions.map(option => (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={lifecycleFilter === option.value}
                title={option.description}
                onClick={() => setLifecycleFilter(option.value)}
                className={`min-h-10 rounded-xl border px-3.5 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  lifecycleFilter === option.value
                    ? "border-primary bg-primary text-on-primary shadow-sm"
                    : "border-outline-variant/45 bg-surface text-on-surface-variant hover:border-primary/40 hover:bg-primary-container/10 hover:text-primary"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading && <DirectorySkeleton />}
      {error && <State title="Không tải được dữ liệu" text={error} error action={() => setReloadKey(value => value + 1)} />}

      {!loading && !error && (
        <section className="overflow-hidden rounded-[22px] border border-outline-variant/35 bg-surface shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/25 bg-surface-container-low/40 px-5 py-3.5">
            <div>
              <strong className="text-sm text-on-surface">{total.toLocaleString("vi-VN")} hồ sơ phù hợp</strong>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                {lifecycleOptions.find(item => item.value === lifecycleFilter)?.description}
              </p>
            </div>
            <span className="text-xs text-on-surface-variant">
              Hiển thị {total ? page * PAGE_SIZE + 1 : 0} đến {Math.min((page + 1) * PAGE_SIZE, total)} trên {total}
            </span>
          </header>

          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="bg-surface-container-low text-[11px] font-black uppercase tracking-[0.07em] text-on-surface-variant">
                <tr>
                  <th className="px-5 py-4">Học viên</th>
                  <th className="px-5 py-4">Liên hệ</th>
                  <th className="px-5 py-4">Ngày gia nhập</th>
                  <th className="px-5 py-4">Band hiện tại → mục tiêu</th>
                  <th className="px-5 py-4">Tình trạng học vụ</th>
                  <th className="px-5 py-4">Lượt học</th>
                  <th className="px-5 py-4">Tài khoản</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {processedStudents.map(student => (
                  <StudentRow key={student.id} student={student} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="divide-y divide-outline-variant/20 lg:hidden">
            {processedStudents.map(student => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>

          {!processedStudents.length && (
            <State title="Không có học viên phù hợp" text="Hãy thay đổi từ khóa, khoảng ngày gia nhập hoặc chọn một phân loại học vụ khác." />
          )}

          <Pagination pageData={pageData} page={page} onChange={setPage} />
        </section>
      )}
    </section>
  );
}

function StudentRow({ student }: { student: StudentSummary }) {
  return (
    <tr className="group transition-colors hover:bg-primary-container/[0.06]">
      <td className="px-5 py-4"><StudentIdentity student={student} /></td>
      <td className="px-5 py-4">
        <span className={`block max-w-56 truncate ${student.email ? "text-on-surface" : "text-amber-700 font-semibold"}`}>
          {student.email ?? "Chưa có email"}
        </span>
        <span className={`mt-1 block text-xs ${student.phone ? "text-on-surface-variant" : "text-amber-700"}`}>
          {student.phone ?? "Chưa có số điện thoại"}
        </span>
      </td>
      <td className="px-5 py-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface">
          <CalendarBlank size={15} className="text-primary shrink-0" />
          {date(student.joinedAt)}
        </span>
      </td>
      <td className="px-5 py-4 font-bold tabular-nums">
        {student.currentBand ?? "Chưa có"}
        <span className="mx-2 text-on-surface-variant">→</span>
        {student.targetBand ?? "Chưa đặt"}
      </td>
      <td className="px-5 py-4"><LifecycleCell student={student} /></td>
      <td className="px-5 py-4">
        <strong className="tabular-nums">{student.enrollmentCount}</strong>
        <span className="ml-1 text-xs text-on-surface-variant">lượt</span>
      </td>
      <td className="px-5 py-4"><ProfileBadge active={student.active} /></td>
      <td className="px-5 py-4 text-right">
        <Link
          to={`/students/${student.id}`}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold text-primary transition hover:bg-primary-container/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          Mở hồ sơ <ArrowRight size={16} />
        </Link>
      </td>
    </tr>
  );
}

function StudentCard({ student }: { student: StudentSummary }) {
  return (
    <article className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <StudentIdentity student={student} />
        <ProfileBadge active={student.active} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="block text-xs text-on-surface-variant">Học vụ</span>
          <LifecycleCell student={student} />
        </div>
        <div>
          <span className="block text-xs text-on-surface-variant">Band điểm</span>
          <strong className="mt-1 block">
            {student.currentBand ?? "—"} → {student.targetBand ?? "—"}
          </strong>
        </div>
        <div>
          <span className="block text-xs text-on-surface-variant">Ngày gia nhập</span>
          <span className="mt-1 flex items-center gap-1 text-xs font-bold text-on-surface">
            <CalendarBlank size={14} className="text-primary" /> {date(student.joinedAt)}
          </span>
        </div>
        <div>
          <span className="block text-xs text-on-surface-variant">Lượt học</span>
          <strong className="mt-1 block">{student.enrollmentCount} lượt</strong>
        </div>
      </div>
      <Link
        to={`/students/${student.id}`}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-bold text-on-primary"
      >
        Mở hồ sơ chi tiết <ArrowRight size={17} />
      </Link>
    </article>
  );
}

function StudentIdentity({ student }: { student: StudentSummary }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={student.fullName} src={student.avatarPath} />
      <div className="min-w-0">
        <strong className="block truncate text-on-surface">{student.fullName}</strong>
        <span className="font-mono text-xs text-on-surface-variant">{student.studentCode}</span>
      </div>
    </div>
  );
}

function LifecycleCell({ student }: { student: StudentSummary }) {
  const meta = lifecycleMeta[student.lifecycleStatus];
  return (
    <div>
      <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-black ${meta.className}`}>
        {meta.label}
      </span>
      <span className="mt-1.5 block max-w-64 truncate text-xs text-on-surface-variant">
        {student.currentCourseName ? `${student.currentCourseName} · ${student.currentCourseCode}` : "Chưa có khóa học"}
      </span>
    </div>
  );
}

function ProfileBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-black ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-surface-container text-on-surface-variant"
      }`}
    >
      {active ? <UserCircleCheck size={14} /> : <UserCircleMinus size={14} />}
      {active ? "Hoạt động" : "Đã khóa"}
    </span>
  );
}

function Pagination({ pageData, page, onChange }: { pageData: Page<StudentSummary> | null; page: number; onChange: (page: number) => void }) {
  if (!pageData || pageData.totalPages <= 1) return null;
  const candidates = [0, page - 1, page, page + 1, pageData.totalPages - 1].filter(value => value >= 0 && value < pageData.totalPages);
  const pages = [...new Set(candidates)].sort((a, b) => a - b);
  return (
    <footer className="flex flex-col items-center justify-between gap-3 border-t border-outline-variant/25 px-5 py-4 sm:flex-row">
      <span className="text-xs text-on-surface-variant">Trang {page + 1} trên {pageData.totalPages}</span>
      <div className="flex items-center gap-1.5">
        <PageButton label="Trang trước" disabled={pageData.first} onClick={() => onChange(Math.max(0, page - 1))}>
          <CaretLeft size={17} />
        </PageButton>
        {pages.map((value, index) => (
          <span key={value} className="flex items-center gap-1.5">
            {index > 0 && value - pages[index - 1] > 1 && <span className="px-1 text-on-surface-variant">…</span>}
            <button
              onClick={() => onChange(value)}
              aria-current={value === page ? "page" : undefined}
              className={`grid h-10 min-w-10 place-items-center rounded-xl border px-2 text-sm font-bold ${
                value === page ? "border-primary bg-primary text-on-primary" : "border-outline-variant/50 hover:border-primary/40 hover:text-primary"
              }`}
            >
              {value + 1}
            </button>
          </span>
        ))}
        <PageButton label="Trang sau" disabled={pageData.last} onClick={() => onChange(page + 1)}>
          <CaretRight size={17} />
        </PageButton>
      </div>
    </footer>
  );
}

function PageButton({ children, label, disabled, onClick }: { children: ReactNode; label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-xl border border-outline-variant/50 transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function Metric({ label, value, icon, tone = "default" }: { label: string; value: number; icon: ReactNode; tone?: "default" | "primary" | "warning" }) {
  const color = tone === "primary" ? "text-primary" : tone === "warning" ? "text-amber-700" : "text-on-surface";
  return (
    <div className="rounded-[18px] border border-outline-variant/35 bg-surface p-5 shadow-sm">
      <div className={`mb-4 flex items-center justify-between ${color}`}>
        <span className="text-sm font-semibold text-on-surface-variant">{label}</span>
        {icon}
      </div>
      <strong className="text-3xl tabular-nums text-on-surface">{value.toLocaleString("vi-VN")}</strong>
    </div>
  );
}

function Avatar({ name, src }: { name: string; src: string | null }) {
  return src ? (
    <img src={src} alt="" className="h-11 w-11 rounded-xl object-cover" />
  ) : (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-container/35 font-black text-primary">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function DirectorySkeleton() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-outline-variant/35 bg-surface p-5">
      <div className="space-y-3">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-xl bg-surface-container-low" />
        ))}
      </div>
    </div>
  );
}

function State({ title, text, error, action }: { title: string; text: string; error?: boolean; action?: () => void }) {
  return (
    <div className={`p-10 text-center ${error ? "border border-error/30 bg-error-container/10 text-error" : "text-on-surface-variant"}`}>
      <strong className="block text-base text-on-surface">{title}</strong>
      <p className="mx-auto mt-2 max-w-lg text-sm">{text}</p>
      {action && (
        <button onClick={action} className="mt-4 min-h-10 rounded-xl border border-current px-4 py-2 text-sm font-bold">
          Thử lại
        </button>
      )}
    </div>
  );
}
