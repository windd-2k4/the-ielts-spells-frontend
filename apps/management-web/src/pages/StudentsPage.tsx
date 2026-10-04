import {
  ArrowCounterClockwise,
  ArrowRight,
  ArrowsDownUp,
  BookOpen,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  ChalkboardTeacher,
  Check,
  Copy,
  EnvelopeSimple,
  FunnelSimple,
  GraduationCap,
  MagnifyingGlass,
  Phone,
  Target,
  UserCheck,
  UserCircleCheck,
  UserMinus,
  Users,
  WarningCircle,
  X,
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

const lifecycleOptions: Array<{
  value: LifecycleFilter;
  label: string;
  description: string;
  dotColor: string;
}> = [
  { value: "ALL", label: "Tất cả", description: "Toàn bộ hồ sơ học viên", dotColor: "bg-primary" },
  { value: "ACTIVE", label: "Đang học", description: "Có lượt học đang hoạt động", dotColor: "bg-emerald-500" },
  { value: "PENDING", label: "Chờ xác nhận", description: "Ghi danh chưa được kích hoạt", dotColor: "bg-amber-500" },
  { value: "PAUSED", label: "Bảo lưu", description: "Đang tạm dừng khóa học", dotColor: "bg-sky-500" },
  { value: "COMPLETED", label: "Hoàn thành", description: "Đã hoàn tất khóa gần nhất", dotColor: "bg-violet-500" },
  { value: "WITHDRAWN", label: "Đã rút", description: "Đã kết thúc ghi danh", dotColor: "bg-rose-500" },
  { value: "NONE", label: "Chưa ghi danh", description: "Có hồ sơ nhưng chưa xếp lớp", dotColor: "bg-gray-400" },
];

const lifecycleMeta: Record<StudentLifecycleStatus, { label: string; badgeClass: string; dotClass: string }> = {
  ACTIVE: {
    label: "Đang học",
    badgeClass: "border-emerald-200/80 bg-emerald-50/80 text-emerald-800",
    dotClass: "bg-emerald-500",
  },
  PENDING: {
    label: "Chờ xác nhận",
    badgeClass: "border-amber-200/80 bg-amber-50/80 text-amber-800",
    dotClass: "bg-amber-500",
  },
  PAUSED: {
    label: "Đang bảo lưu",
    badgeClass: "border-sky-200/80 bg-sky-50/80 text-sky-800",
    dotClass: "bg-sky-500",
  },
  COMPLETED: {
    label: "Đã hoàn thành",
    badgeClass: "border-violet-200/80 bg-violet-50/80 text-violet-800",
    dotClass: "bg-violet-500",
  },
  WITHDRAWN: {
    label: "Đã rút",
    badgeClass: "border-rose-200/80 bg-rose-50/80 text-rose-800",
    dotClass: "bg-rose-500",
  },
  NONE: {
    label: "Chưa ghi danh",
    badgeClass: "border-outline-variant/40 bg-surface-container text-on-surface-variant",
    dotClass: "bg-gray-400",
  },
};

const datePresets: Array<{ value: DateRangePreset; label: string }> = [
  { value: "ALL", label: "Tất cả thời gian" },
  { value: "30_DAYS", label: "30 ngày gần đây" },
  { value: "90_DAYS", label: "3 tháng gần đây" },
  { value: "180_DAYS", label: "6 tháng gần đây" },
  { value: "THIS_YEAR", label: "Năm nay" },
  { value: "CUSTOM", label: "Tùy chọn khoảng ngày..." },
];

export function StudentsPage({ embedded = false }: { embedded?: boolean }) {
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

  useEffect(() => {
    setPage(0);
  }, [deferredQuery, activityFilter, lifecycleFilter, datePreset, fromDate, toDate, sortOption]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        q: deferredQuery.trim(),
        page: String(page),
        size: String(PAGE_SIZE),
      });
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
    return () => {
      cancelled = true;
    };
  }, [activityFilter, deferredQuery, lifecycleFilter, page, reloadKey]);

  // Client-side date calculation & filtering on current page content
  const rawStudents = pageData?.content ?? [];

  const processedStudents = useMemo(() => {
    let list = [...rawStudents];

    let effectiveFrom = fromDate;
    let effectiveTo = toDate;

    const now = new Date();
    if (datePreset === "30_DAYS") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      effectiveFrom = d.toISOString().split("T")[0];
    } else if (datePreset === "90_DAYS") {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      effectiveFrom = d.toISOString().split("T")[0];
    } else if (datePreset === "180_DAYS") {
      const d = new Date();
      d.setDate(d.getDate() - 180);
      effectiveFrom = d.toISOString().split("T")[0];
    } else if (datePreset === "THIS_YEAR") {
      effectiveFrom = `${now.getFullYear()}-01-01`;
    }

    if (effectiveFrom) {
      list = list.filter(student => (student.joinedAt || "") >= effectiveFrom);
    }
    if (effectiveTo) {
      list = list.filter(student => (student.joinedAt || "") <= effectiveTo);
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

  // Active filters helper
  const hasActiveFilters =
    query.trim() !== "" ||
    activityFilter !== "all" ||
    lifecycleFilter !== "ALL" ||
    datePreset !== "ALL" ||
    fromDate !== "" ||
    toDate !== "" ||
    sortOption !== "JOINED_DESC";

  const resetAllFilters = () => {
    setQuery("");
    setActivityFilter("all");
    setLifecycleFilter("ALL");
    setDatePreset("ALL");
    setFromDate("");
    setToDate("");
    setSortOption("JOINED_DESC");
  };

  const currentLifecycleObj = lifecycleOptions.find(item => item.value === lifecycleFilter);

  return (
    <section className="space-y-6">
      {!embedded && (
        <PageHeader
          eyebrow="Hồ sơ và học vụ"
          title="Quản lý học viên"
          description="Theo dõi toàn bộ hồ sơ học viên, phân loại theo học vụ và quản lý mốc thời gian gia nhập."
        />
      )}

      {/* Overview Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Hồ sơ theo bộ lọc"
          value={total}
          subtitle="Khớp điều kiện tìm kiếm"
          icon={<Users size={22} weight="duotone" />}
          tone="primary"
        />
        <MetricCard
          label="Đang hiển thị"
          value={processedStudents.length}
          subtitle={`Trang ${page + 1} · Tối đa ${PAGE_SIZE}/trang`}
          icon={<ChalkboardTeacher size={22} weight="duotone" />}
          tone="emerald"
        />
        <MetricCard
          label="Thiếu thông tin liên hệ"
          value={missingContact}
          subtitle={missingContact > 0 ? "Chưa có email hoặc SĐT" : "Thông tin đầy đủ 100%"}
          icon={<WarningCircle size={22} weight="duotone" />}
          tone={missingContact > 0 ? "amber" : "neutral"}
        />
      </div>

      {/* Modern Filter & Search Panel */}
      <section className="overflow-hidden rounded-2xl border border-outline-variant/35 bg-surface shadow-xs transition-all">
        {/* Panel Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/25 bg-surface-container-low/40 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FunnelSimple size={18} weight="bold" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-on-surface">Bộ lọc & Tra cứu học viên</h3>
              <p className="text-xs text-on-surface-variant">
                Lọc nhanh theo từ khóa, tiến trình học vụ, thời gian gia nhập và tài khoản
              </p>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-on-primary"
              title="Khôi phục toàn bộ bộ lọc về mặc định"
            >
              <ArrowCounterClockwise size={14} weight="bold" />
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        {/* Primary Controls Row: Search + Status + Date Preset + Sort */}
        <div className="grid gap-3 p-4 md:grid-cols-12 md:p-5">
          {/* Search Box */}
          <div className="md:col-span-5">
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-on-surface-variant">
              Tìm kiếm học viên
            </label>
            <div className="relative flex items-center">
              <MagnifyingGlass
                size={18}
                className="pointer-events-none absolute left-3.5 text-on-surface-variant/70"
              />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Tên, mã học viên, email hoặc SĐT..."
                className="min-h-11 w-full rounded-xl border border-outline-variant/60 bg-surface pl-10 pr-9 text-sm text-on-surface outline-none transition placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full text-on-surface-variant/60 hover:bg-surface-container hover:text-on-surface"
                  title="Xóa từ khóa"
                >
                  <X size={14} weight="bold" />
                </button>
              )}
            </div>
          </div>

          {/* Account Status */}
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-on-surface-variant">
              Tài khoản
            </label>
            <div className="relative">
              <select
                value={activityFilter}
                onChange={event => setActivityFilter(event.target.value as ActivityFilter)}
                className="min-h-11 w-full appearance-none rounded-xl border border-outline-variant/60 bg-surface px-3 py-2 text-sm font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                <option value="all">Tất cả tài khoản</option>
                <option value="true">Đang hoạt động</option>
                <option value="false">Đã khóa</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-on-surface-variant">
                <UserCheck size={16} />
              </div>
            </div>
          </div>

          {/* Date Filter Preset */}
          <div className="md:col-span-3">
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-on-surface-variant">
              Thời gian gia nhập
            </label>
            <div className="relative">
              <select
                value={datePreset}
                onChange={event => {
                  const val = event.target.value as DateRangePreset;
                  setDatePreset(val);
                  if (val !== "CUSTOM") {
                    setFromDate("");
                    setToDate("");
                  }
                }}
                className="min-h-11 w-full appearance-none rounded-xl border border-outline-variant/60 bg-surface px-3 py-2 text-sm font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                {datePresets.map(preset => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-on-surface-variant">
                <CalendarBlank size={16} />
              </div>
            </div>
          </div>

          {/* Sort Option */}
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-on-surface-variant">
              Sắp xếp theo
            </label>
            <div className="relative">
              <select
                value={sortOption}
                onChange={event => setSortOption(event.target.value as SortOption)}
                className="min-h-11 w-full appearance-none rounded-xl border border-outline-variant/60 bg-surface px-3 py-2 text-sm font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                <option value="JOINED_DESC">Mới gia nhập trước</option>
                <option value="JOINED_ASC">Gia nhập lâu trước</option>
                <option value="NAME_ASC">Tên học viên (A-Z)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-on-surface-variant">
                <ArrowsDownUp size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Custom Date Range Sub-Bar (revealed when datePreset === 'CUSTOM') */}
        {datePreset === "CUSTOM" && (
          <div className="border-t border-outline-variant/20 bg-surface-container-low/30 px-4 py-3 md:px-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant">
                <CalendarBlank size={16} className="text-primary" />
                <span>Khoảng ngày cụ thể:</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="rounded-lg border border-outline-variant/60 bg-surface px-3 py-1.5 text-xs font-medium text-on-surface outline-none focus:border-primary"
                  title="Từ ngày gia nhập"
                />
                <span className="text-xs text-on-surface-variant">đến</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="rounded-lg border border-outline-variant/60 bg-surface px-3 py-1.5 text-xs font-medium text-on-surface outline-none focus:border-primary"
                  title="Đến ngày gia nhập"
                />
                {(fromDate || toDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFromDate("");
                      setToDate("");
                    }}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <X size={12} weight="bold" /> Xóa ngày
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lifecycle Status Navigation Tabs */}
        <div className="border-t border-outline-variant/25 bg-surface px-4 py-3 md:px-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant">
              Phân loại theo tiến trình học vụ
            </span>
            <span className="text-xs text-on-surface-variant">
              {currentLifecycleObj?.description}
            </span>
          </div>

          <div
            className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Phân loại học viên theo học vụ"
          >
            {lifecycleOptions.map(option => {
              const active = lifecycleFilter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  title={option.description}
                  onClick={() => setLifecycleFilter(option.value)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    active
                      ? "border-primary bg-primary text-on-primary shadow-xs scale-[1.01]"
                      : "border-outline-variant/40 bg-surface text-on-surface-variant hover:border-primary/40 hover:bg-primary-container/10 hover:text-primary"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full transition-colors ${
                      active ? "bg-white ring-2 ring-white/30" : option.dotColor
                    }`}
                  />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 border-t border-outline-variant/20 bg-surface-container-low/40 px-4 py-2.5 md:px-5">
            <span className="text-[11px] font-bold text-on-surface-variant">Đang lọc theo:</span>
            {query.trim() && (
              <FilterChip label={`Từ khóa: "${query}"`} onClear={() => setQuery("")} />
            )}
            {activityFilter !== "all" && (
              <FilterChip
                label={`Tài khoản: ${activityFilter === "true" ? "Đang hoạt động" : "Đã khóa"}`}
                onClear={() => setActivityFilter("all")}
              />
            )}
            {lifecycleFilter !== "ALL" && (
              <FilterChip
                label={`Học vụ: ${currentLifecycleObj?.label}`}
                onClear={() => setLifecycleFilter("ALL")}
              />
            )}
            {datePreset !== "ALL" && (
              <FilterChip
                label={`Gia nhập: ${datePresets.find(p => p.value === datePreset)?.label}`}
                onClear={() => {
                  setDatePreset("ALL");
                  setFromDate("");
                  setToDate("");
                }}
              />
            )}
            {datePreset === "CUSTOM" && (fromDate || toDate) && (
              <FilterChip
                label={`${fromDate ? `Từ ${fromDate}` : ""} ${toDate ? `Đến ${toDate}` : ""}`}
                onClear={() => {
                  setFromDate("");
                  setToDate("");
                }}
              />
            )}
            {sortOption !== "JOINED_DESC" && (
              <FilterChip
                label={`Sắp xếp: ${
                  sortOption === "JOINED_ASC" ? "Gia nhập lâu trước" : "Tên A-Z"
                }`}
                onClear={() => setSortOption("JOINED_DESC")}
              />
            )}
          </div>
        )}
      </section>

      {/* Loading Skeleton */}
      {loading && <DirectorySkeleton />}

      {/* Error State */}
      {error && (
        <State
          title="Không tải được dữ liệu"
          text={error}
          error
          action={() => setReloadKey(value => value + 1)}
        />
      )}

      {/* Data Table Section */}
      {!loading && !error && (
        <section className="overflow-hidden rounded-2xl border border-outline-variant/35 bg-surface shadow-xs">
          {/* Table Header Bar */}
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/25 bg-surface-container-low/40 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <strong className="text-sm font-bold text-on-surface">
                {total.toLocaleString("vi-VN")} hồ sơ phù hợp
              </strong>
              <span className="text-outline-variant">•</span>
              <span className="text-xs text-on-surface-variant">
                {currentLifecycleObj?.description}
              </span>
            </div>
            <span className="text-xs font-medium text-on-surface-variant">
              Hiển thị {total ? page * PAGE_SIZE + 1 : 0} đến{" "}
              {Math.min((page + 1) * PAGE_SIZE, total)} trên {total}
            </span>
          </header>

          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="bg-surface-container-low/80 text-[11px] font-black uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-5 py-3.5">Học viên</th>
                  <th className="px-5 py-3.5">Thông tin liên hệ</th>
                  <th className="px-5 py-3.5">Ngày gia nhập</th>
                  <th className="px-5 py-3.5">Band điểm</th>
                  <th className="px-5 py-3.5">Tình trạng học vụ</th>
                  <th className="px-5 py-3.5">Lượt học</th>
                  <th className="px-5 py-3.5">Tài khoản</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
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

          {/* Empty State */}
          {!processedStudents.length && (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container text-on-surface-variant">
                <Users size={28} weight="duotone" />
              </div>
              <h4 className="mt-4 text-base font-bold text-on-surface">Không có học viên phù hợp</h4>
              <p className="mx-auto mt-1 max-w-md text-sm text-on-surface-variant">
                Không tìm thấy hồ sơ nào khớp với bộ lọc hiện tại. Hãy thử tìm từ khóa khác hoặc đặt lại bộ lọc.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-xs transition hover:opacity-90"
                >
                  <ArrowCounterClockwise size={15} weight="bold" /> Xóa toàn bộ bộ lọc
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          <Pagination pageData={pageData} page={page} onChange={setPage} />
        </section>
      )}
    </section>
  );
}

function StudentRow({ student }: { student: StudentSummary }) {
  return (
    <tr className="group transition-colors hover:bg-primary-container/[0.05]">
      {/* Học viên */}
      <td className="px-5 py-3.5">
        <StudentIdentity student={student} />
      </td>

      {/* Thông tin liên hệ */}
      <td className="px-5 py-3.5">
        <div className="space-y-1">
          {student.email ? (
            <a
              href={`mailto:${student.email}`}
              className="flex items-center gap-1.5 text-xs font-medium text-on-surface hover:text-primary transition-colors max-w-56 truncate"
              title={student.email}
            >
              <EnvelopeSimple size={14} className="shrink-0 text-primary/70" />
              <span className="truncate">{student.email}</span>
            </a>
          ) : (
            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">
              <WarningCircle size={12} weight="bold" /> Chưa có email
            </span>
          )}

          {student.phone ? (
            <a
              href={`tel:${student.phone}`}
              className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors"
            >
              <Phone size={14} className="shrink-0 text-primary/70" />
              <span>{student.phone}</span>
            </a>
          ) : (
            <span className="block text-[11px] text-amber-700/80 italic">Chưa có số điện thoại</span>
          )}
        </div>
      </td>

      {/* Ngày gia nhập */}
      <td className="px-5 py-3.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface">
          <CalendarBlank size={14} className="shrink-0 text-primary" />
          {date(student.joinedAt)}
        </span>
      </td>

      {/* Band điểm */}
      <td className="px-5 py-3.5">
        <BandScoreProgress current={student.currentBand} target={student.targetBand} />
      </td>

      {/* Tình trạng học vụ */}
      <td className="px-5 py-3.5">
        <LifecycleCell student={student} />
      </td>

      {/* Lượt học */}
      <td className="px-5 py-3.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 text-xs font-bold text-on-surface">
          <GraduationCap size={14} className="text-primary" />
          <span className="tabular-nums">{student.enrollmentCount}</span> khóa
        </span>
      </td>

      {/* Tài khoản */}
      <td className="px-5 py-3.5">
        <ProfileBadge active={student.active} />
      </td>

      {/* Thao tác */}
      <td className="px-5 py-3.5 text-right">
        <Link
          to={`/students/${student.id}`}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary transition-all duration-200 hover:border-primary hover:bg-primary hover:text-on-primary hover:shadow-xs group-hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <span>Mở hồ sơ</span>
          <ArrowRight size={14} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </td>
    </tr>
  );
}

function StudentCard({ student }: { student: StudentSummary }) {
  return (
    <article className="space-y-4 p-5 transition hover:bg-surface-container-low/30">
      <div className="flex items-start justify-between gap-3">
        <StudentIdentity student={student} />
        <ProfileBadge active={student.active} />
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low/40 p-3.5 text-xs">
        <div>
          <span className="block text-[11px] font-semibold text-on-surface-variant">Band điểm</span>
          <div className="mt-1">
            <BandScoreProgress current={student.currentBand} target={student.targetBand} />
          </div>
        </div>

        <div>
          <span className="block text-[11px] font-semibold text-on-surface-variant">Lượt học</span>
          <span className="mt-1 inline-flex items-center gap-1 font-bold text-on-surface">
            <GraduationCap size={14} className="text-primary" /> {student.enrollmentCount} khóa
          </span>
        </div>

        <div>
          <span className="block text-[11px] font-semibold text-on-surface-variant">Ngày gia nhập</span>
          <span className="mt-1 flex items-center gap-1 font-semibold text-on-surface">
            <CalendarBlank size={13} className="text-primary" /> {date(student.joinedAt)}
          </span>
        </div>

        <div>
          <span className="block text-[11px] font-semibold text-on-surface-variant">Học vụ</span>
          <div className="mt-1">
            <LifecycleCell student={student} compact />
          </div>
        </div>
      </div>

      {/* Contact snippet for card */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {student.email && (
          <span className="flex items-center gap-1 text-on-surface-variant">
            <EnvelopeSimple size={13} className="text-primary" /> {student.email}
          </span>
        )}
        {student.phone && (
          <span className="flex items-center gap-1 text-on-surface-variant">
            <Phone size={13} className="text-primary" /> {student.phone}
          </span>
        )}
      </div>

      <Link
        to={`/students/${student.id}`}
        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary transition hover:opacity-90"
      >
        <span>Mở hồ sơ chi tiết</span>
        <ArrowRight size={15} weight="bold" />
      </Link>
    </article>
  );
}

function StudentIdentity({ student }: { student: StudentSummary }) {
  const [copied, setCopied] = useState(false);

  const copyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator?.clipboard) {
      void navigator.clipboard.writeText(student.studentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={student.fullName} src={student.avatarPath} active={student.active} />
      <div className="min-w-0">
        <Link
          to={`/students/${student.id}`}
          className="block truncate font-bold text-on-surface hover:text-primary transition-colors"
        >
          {student.fullName}
        </Link>
        <button
          type="button"
          onClick={copyCode}
          className="group/code mt-0.5 inline-flex items-center gap-1 rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] font-semibold text-on-surface-variant transition hover:bg-primary-container/20 hover:text-primary"
          title="Bấm để sao chép mã học viên"
        >
          <span>{student.studentCode}</span>
          {copied ? (
            <Check size={11} className="text-emerald-600" weight="bold" />
          ) : (
            <Copy size={11} className="opacity-40 group-hover/code:opacity-100" />
          )}
        </button>
      </div>
    </div>
  );
}

function BandScoreProgress({ current, target }: { current: number | null; target: number | null }) {
  return (
    <div className="inline-flex items-center gap-1.5 text-xs">
      <span
        className={`rounded px-1.5 py-0.5 font-bold tabular-nums ${
          current != null ? "bg-surface-container text-on-surface" : "text-outline-variant"
        }`}
      >
        {current != null ? current : "—"}
      </span>
      <ArrowRight size={12} className="text-on-surface-variant/40" />
      <span
        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-black tabular-nums ${
          target != null
            ? "border border-primary/20 bg-primary/10 text-primary"
            : "text-outline-variant"
        }`}
        title={target != null ? `Mục tiêu Band ${target}` : "Chưa đặt mục tiêu"}
      >
        <Target size={12} className="text-primary" />
        {target != null ? target : "—"}
      </span>
    </div>
  );
}

function LifecycleCell({ student, compact = false }: { student: StudentSummary; compact?: boolean }) {
  const meta = lifecycleMeta[student.lifecycleStatus];
  return (
    <div>
      <span
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-xs font-bold ${meta.badgeClass}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
        {meta.label}
      </span>
      {!compact && (
        <span
          className="mt-1 flex max-w-64 items-center gap-1 truncate text-xs text-on-surface-variant"
          title={student.currentCourseName ? `${student.currentCourseName} · ${student.currentCourseCode}` : undefined}
        >
          <BookOpen size={13} className="shrink-0 text-on-surface-variant/60" />
          <span className="truncate">
            {student.currentCourseName
              ? `${student.currentCourseName} · ${student.currentCourseCode}`
              : "Chưa có khóa học"}
          </span>
        </span>
      )}
    </div>
  );
}

function ProfileBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border ${
        active
          ? "border-emerald-200/70 bg-emerald-50 text-emerald-700"
          : "border-outline-variant/40 bg-surface-container text-on-surface-variant"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`}
      />
      {active ? "Hoạt động" : "Đã khóa"}
    </span>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-semibold text-primary">
      <span>{label}</span>
      <button
        type="button"
        onClick={onClear}
        className="rounded hover:bg-primary/10 text-primary/80 hover:text-primary"
      >
        <X size={12} weight="bold" />
      </button>
    </span>
  );
}

function MetricCard({
  label,
  value,
  subtitle,
  icon,
  tone = "primary",
}: {
  label: string;
  value: number;
  subtitle: string;
  icon: ReactNode;
  tone?: "primary" | "emerald" | "amber" | "neutral";
}) {
  const colorMap = {
    primary: {
      bg: "bg-primary/10",
      text: "text-primary",
      border: "hover:border-primary/40",
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "hover:border-emerald-300",
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "hover:border-amber-300",
    },
    neutral: {
      bg: "bg-surface-container",
      text: "text-on-surface-variant",
      border: "hover:border-outline-variant",
    },
  };

  const style = colorMap[tone];

  return (
    <div
      className={`rounded-2xl border border-outline-variant/35 bg-surface p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${style.border}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          {label}
        </span>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.bg} ${style.text}`}>
          {icon}
        </span>
      </div>
      <div className="mt-2">
        <strong className="text-3xl font-extrabold tabular-nums text-on-surface">
          {value.toLocaleString("vi-VN")}
        </strong>
        <p className="mt-1 text-xs text-on-surface-variant">{subtitle}</p>
      </div>
    </div>
  );
}

function Avatar({ name, src, active }: { name: string; src: string | null; active: boolean }) {
  const initial = (name.trim().charAt(0) || "U").toUpperCase();
  return (
    <div className="relative shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-11 w-11 rounded-2xl object-cover ring-1 ring-outline-variant/30"
        />
      ) : (
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/30 font-black text-primary shadow-xs">
          {initial}
        </span>
      )}
      <span
        className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-surface ${
          active ? "bg-emerald-500" : "bg-gray-400"
        }`}
        title={active ? "Tài khoản hoạt động" : "Tài khoản bị khóa"}
      />
    </div>
  );
}

function Pagination({
  pageData,
  page,
  onChange,
}: {
  pageData: Page<StudentSummary> | null;
  page: number;
  onChange: (page: number) => void;
}) {
  if (!pageData || pageData.totalPages <= 1) return null;
  const candidates = [0, page - 1, page, page + 1, pageData.totalPages - 1].filter(
    value => value >= 0 && value < pageData.totalPages
  );
  const pages = [...new Set(candidates)].sort((a, b) => a - b);
  return (
    <footer className="flex flex-col items-center justify-between gap-3 border-t border-outline-variant/25 bg-surface-container-low/20 px-5 py-3.5 sm:flex-row">
      <span className="text-xs font-medium text-on-surface-variant">
        Trang <strong className="text-on-surface">{page + 1}</strong> trên {pageData.totalPages}
      </span>
      <div className="flex items-center gap-1.5">
        <PageButton
          label="Trang trước"
          disabled={pageData.first}
          onClick={() => onChange(Math.max(0, page - 1))}
        >
          <CaretLeft size={16} weight="bold" />
        </PageButton>
        {pages.map((value, index) => (
          <span key={value} className="flex items-center gap-1.5">
            {index > 0 && value - pages[index - 1] > 1 && (
              <span className="px-1 text-xs text-on-surface-variant">…</span>
            )}
            <button
              onClick={() => onChange(value)}
              aria-current={value === page ? "page" : undefined}
              className={`grid h-9 min-w-9 place-items-center rounded-xl border px-2 text-xs font-bold transition-all ${
                value === page
                  ? "border-primary bg-primary text-on-primary shadow-xs"
                  : "border-outline-variant/40 bg-surface text-on-surface-variant hover:border-primary/40 hover:text-primary"
              }`}
            >
              {value + 1}
            </button>
          </span>
        ))}
        <PageButton
          label="Trang sau"
          disabled={pageData.last}
          onClick={() => onChange(page + 1)}
        >
          <CaretRight size={16} weight="bold" />
        </PageButton>
      </div>
    </footer>
  );
}

function PageButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-xl border border-outline-variant/40 bg-surface transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function DirectorySkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant/35 bg-surface p-5 shadow-xs">
      <div className="space-y-3">
        <div className="h-10 w-full animate-pulse rounded-xl bg-surface-container-low" />
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-xl bg-surface-container-low/70" />
        ))}
      </div>
    </div>
  );
}

function State({
  title,
  text,
  error,
  action,
}: {
  title: string;
  text: string;
  error?: boolean;
  action?: () => void;
}) {
  return (
    <div
      className={`rounded-2xl p-8 text-center ${
        error
          ? "border border-error/30 bg-error-container/10 text-error"
          : "border border-outline-variant/30 bg-surface text-on-surface-variant"
      }`}
    >
      <strong className="block text-base font-bold text-on-surface">{title}</strong>
      <p className="mx-auto mt-2 max-w-lg text-sm text-on-surface-variant">{text}</p>
      {action && (
        <button
          onClick={action}
          className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-current px-4 py-2 text-xs font-bold transition hover:bg-surface-container"
        >
          <ArrowCounterClockwise size={15} weight="bold" /> Thử lại
        </button>
      )}
    </div>
  );
}
