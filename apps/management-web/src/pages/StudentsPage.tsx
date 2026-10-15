import {
  ArrowCounterClockwise,
  ArrowRight,
  BookOpen,
  CalendarBlank,
  CaretDown,
  CaretLeft,
  CaretRight,
  ChalkboardTeacher,
  EnvelopeSimple,
  FunnelSimple,
  GraduationCap,
  IdentificationCard,
  MagnifyingGlass,
  Phone,
  Target,
  Users,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Page, StudentLifecycleStatus, StudentSummary } from "../academic-types";
import { date } from "../academic-types";
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
    <section className="space-y-2.5">
      {!embedded && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/25 text-primary shadow-2xs ring-1 ring-primary/20">
              <GraduationCap size={18} weight="duotone" />
            </span>
            <h1 className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-on-surface">
              Tuyển sinh &amp; học viên
            </h1>
          </div>
        </div>
      )}

      {/* Streamlined Filter & Search Toolbar */}
      <section className="space-y-2 rounded-xl border border-outline-variant/35 bg-surface p-2">
        {/* Row 1: Search + Dropdown Filters + Reset */}
        <div className="flex flex-col gap-1.5 md:flex-row md:items-center">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <MagnifyingGlass
              size={16}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/70"
            />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              aria-label="Tìm kiếm học viên"
              placeholder="Tìm theo tên học viên, mã HV, email, SĐT..."
              className="h-8 w-full rounded-lg border border-outline-variant/60 bg-surface pl-8 pr-8 text-xs text-on-surface outline-none transition placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-full text-on-surface-variant/60 hover:text-on-surface"
                title="Xóa từ khóa"
              >
                <X size={12} weight="bold" />
              </button>
            )}
          </div>

          {/* Controls Group */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Account Status */}
            <div className="relative min-w-[126px]">
              <select
                value={activityFilter}
                onChange={event => setActivityFilter(event.target.value as ActivityFilter)}
                className="h-8 w-full appearance-none rounded-lg border border-outline-variant/60 bg-surface pl-2.5 pr-7 text-xs font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
              >
                <option value="all">Tất cả tài khoản</option>
                <option value="true">Đang hoạt động</option>
                <option value="false">Đã khóa</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-on-surface-variant/70">
                <CaretDown size={13} weight="bold" />
              </div>
            </div>

            {/* Date Preset */}
            <div className="relative min-w-[132px]">
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
                className="h-8 w-full appearance-none rounded-lg border border-outline-variant/60 bg-surface pl-2.5 pr-7 text-xs font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
              >
                {datePresets.map(preset => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-on-surface-variant/70">
                <CaretDown size={13} weight="bold" />
              </div>
            </div>

            {/* Sort Option */}
            <div className="relative min-w-[144px]">
              <select
                value={sortOption}
                onChange={event => setSortOption(event.target.value as SortOption)}
                className="h-8 w-full appearance-none rounded-lg border border-outline-variant/60 bg-surface pl-2.5 pr-7 text-xs font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
              >
                <option value="JOINED_DESC">Mới gia nhập trước</option>
                <option value="JOINED_ASC">Gia nhập lâu trước</option>
                <option value="NAME_ASC">Tên học viên (A-Z)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-on-surface-variant/70">
                <CaretDown size={13} weight="bold" />
              </div>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-primary/25 bg-primary/5 px-2.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-on-primary"
                title="Khôi phục toàn bộ bộ lọc về mặc định"
              >
                <ArrowCounterClockwise size={13} weight="bold" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Range if CUSTOM */}
        {datePreset === "CUSTOM" && (
          <div className="flex flex-wrap items-center gap-2 border-t border-outline-variant/20 pt-2 text-xs">
            <span className="font-semibold text-on-surface-variant">Khoảng ngày:</span>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="rounded-lg border border-outline-variant/60 bg-surface px-2.5 py-1 text-xs text-on-surface outline-none focus:border-primary"
            />
            <span className="text-on-surface-variant">đến</span>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="rounded-lg border border-outline-variant/60 bg-surface px-2.5 py-1 text-xs text-on-surface outline-none focus:border-primary"
            />
            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
              >
                <X size={12} weight="bold" /> Xóa ngày
              </button>
            )}
          </div>
        )}

        {/* Row 2: Lifecycle Status Filter Tabs */}
        <div className="flex items-center gap-2 border-t border-outline-variant/20 pt-1.5">
          <div
            className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
                  className={`inline-flex min-h-7 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-xs font-bold transition-all ${
                    active
                      ? "border-primary bg-primary text-on-primary shadow-2xs"
                      : "border-outline-variant/35 bg-surface text-on-surface-variant hover:border-primary/40 hover:bg-primary-container/10 hover:text-primary"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      active ? "bg-white" : option.dotColor
                    }`}
                  />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-outline-variant/20 pt-2">
            <span className="text-[11px] font-bold text-on-surface-variant">Đang lọc:</span>
            {query.trim() && (
              <FilterChip label={`"${query}"`} onClear={() => setQuery("")} />
            )}
            {activityFilter !== "all" && (
              <FilterChip
                label={activityFilter === "true" ? "Đang hoạt động" : "Đã khóa"}
                onClear={() => setActivityFilter("all")}
              />
            )}
            {lifecycleFilter !== "ALL" && (
              <FilterChip
                label={currentLifecycleObj?.label || ""}
                onClear={() => setLifecycleFilter("ALL")}
              />
            )}
            {datePreset !== "ALL" && (
              <FilterChip
                label={datePresets.find(p => p.value === datePreset)?.label || ""}
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
                label={sortOption === "JOINED_ASC" ? "Cũ nhất" : "A-Z"}
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
        <section className="overflow-hidden rounded-xl border border-outline-variant/40 bg-surface shadow-xs">
          {/* Table Header Bar */}
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/30 bg-surface px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-sm font-extrabold text-on-surface">
                {total.toLocaleString("vi-VN")} hồ sơ học viên
              </strong>
              {missingContact > 0 && (
                <span
                  className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200/60 px-2 py-0.5 text-xs font-semibold text-amber-800"
                  title="Có học viên trong danh sách chưa đủ email hoặc số điện thoại"
                >
                  <WarningCircle size={13} weight="bold" />
                  {missingContact} chưa đủ SĐT/Email
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium tabular-nums text-on-surface-variant">
              {total ? page * PAGE_SIZE + 1 : 0}–{Math.min((page + 1) * PAGE_SIZE, total)} / {total} hồ sơ
            </span>
          </header>

          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[960px] table-fixed text-left text-sm">
              <caption className="sr-only">Danh sách hồ sơ học viên và tình trạng học tập</caption>
              <colgroup>
                <col className="w-[21%]" />
                <col className="w-[25%]" />
                <col className="w-[13%]" />
                <col className="w-[12%]" />
                <col className="w-[22%]" />
                <col className="w-[7%]" />
              </colgroup>
              <thead className="border-b border-outline-variant/30 bg-surface-container-low/70 text-[11px] font-bold text-on-surface-variant">
                <tr>
                  <th scope="col" className="whitespace-nowrap px-4 py-2.5">Học viên</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-2.5">Liên hệ</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-2.5">Gia nhập</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-2.5">Band hiện tại → mục tiêu</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-2.5">Học vụ &amp; khóa học</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-2.5 text-right">Chi tiết</th>
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
    <tr className="group align-middle transition-colors even:bg-surface-container-low/[0.16] hover:bg-primary-container/[0.08]">
      {/* Học viên */}
      <td className="px-4 py-3">
        <StudentIdentity student={student} />
      </td>

      {/* Thông tin liên hệ */}
      <td className="px-4 py-3">
        {student.email || student.phone ? (
          <div className="space-y-0.5">
            {student.email && (
              <a
                href={`mailto:${student.email}`}
                className="flex max-w-full items-center gap-1.5 text-xs font-medium text-on-surface transition-colors hover:text-primary"
                title={student.email}
              >
                <EnvelopeSimple size={13} className="shrink-0 text-primary/70" />
                <span className="truncate">{student.email}</span>
              </a>
            )}
            {student.phone && (
              <a
                href={`tel:${student.phone}`}
                className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors"
              >
                <Phone size={13} className="shrink-0 text-primary/70" />
                <span>{student.phone}</span>
              </a>
            )}
          </div>
        ) : (
          <span className="text-[11px] font-medium italic text-on-surface-variant/60">Chưa có thông tin liên hệ</span>
        )}
      </td>

      {/* Ngày gia nhập */}
      <td className="whitespace-nowrap px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface">
          <CalendarBlank size={14} className="shrink-0 text-primary/70" />
          {date(student.joinedAt)}
        </span>
      </td>

      {/* Band điểm */}
      <td className="px-4 py-3">
        <BandScoreProgress current={student.currentBand} target={student.targetBand} />
      </td>

      {/* Tình trạng học vụ (gộp lượt học) */}
      <td className="px-4 py-3">
        <LifecycleCell student={student} />
      </td>

      {/* Thao tác */}
      <td className="whitespace-nowrap px-4 py-3 text-right">
        <Link
          to={`/students/${student.id}`}
          title="Mở hồ sơ học viên"
          aria-label={`Mở hồ sơ của ${student.fullName}`}
          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-primary/25 bg-primary/5 px-2.5 text-[11px] font-bold text-primary transition-all duration-150 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-on-primary hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <IdentificationCard size={17} weight="duotone" />
          <span>Hồ sơ</span>
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
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={student.fullName} src={student.avatarPath} active={student.active} />
      <div className="min-w-0 leading-tight">
        <Link
          to={`/students/${student.id}`}
          className="block truncate font-bold text-sm text-on-surface hover:text-primary transition-colors"
          title={`Mã HV: ${student.studentCode}`}
        >
          {student.fullName}
        </Link>
        <span className="mt-1 block truncate font-mono text-[10px] font-semibold tracking-tight text-on-surface-variant/75">
          {student.studentCode}
        </span>
      </div>
    </div>
  );
}

function BandScoreProgress({ current, target }: { current: number | null; target: number | null }) {
  if (current == null && target == null) {
    return <span className="text-xs text-on-surface-variant/40 font-medium">—</span>;
  }

  return (
    <div className="inline-flex items-center gap-1.5 text-xs">
      <span
        className={`rounded px-1.5 py-0.5 font-bold tabular-nums ${
          current != null ? "bg-surface-container text-on-surface" : "text-outline-variant"
        }`}
        title={current != null ? `Band hiện tại: ${current}` : "Chưa có Band hiện tại"}
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
  const moreCount = Math.max(0, student.enrollmentCount - 1);

  return (
    <div>
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-xs font-bold ${meta.badgeClass}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
          {meta.label}
        </span>
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant"
          title={`Học viên đã tham gia ${student.enrollmentCount} khóa học`}
        >
          <GraduationCap size={13} className="text-primary/70" />
          <span className="tabular-nums font-bold text-on-surface">{student.enrollmentCount}</span> khóa
        </span>
      </div>
      {!compact && (
        <div className="mt-1 flex items-center gap-1.5">
          {student.currentCourseName ? (
            <>
              <Link
                to={`/students/${student.id}`}
                className="group/course flex max-w-[200px] items-center gap-1 truncate text-xs text-on-surface-variant hover:text-primary transition-colors"
                title={`Khóa hiện tại/gần nhất: ${student.currentCourseName} · ${student.currentCourseCode}`}
              >
                <BookOpen size={12} className="shrink-0 text-on-surface-variant/60 group-hover/course:text-primary" />
                <span className="truncate">
                  {student.currentCourseName}
                </span>
              </Link>
              {moreCount > 0 && (
                <Link
                  to={`/students/${student.id}`}
                  className="inline-flex shrink-0 items-center rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary transition hover:bg-primary hover:text-on-primary"
                  title={`Khóa hiển thị là khóa gần nhất. Học viên có thêm ${moreCount} khóa khác. Bấm để xem chi tiết toàn bộ trong hồ sơ.`}
                >
                  +{moreCount} khác
                </Link>
              )}
            </>
          ) : student.enrollmentCount > 0 ? (
            <Link
              to={`/students/${student.id}`}
              className="text-xs text-primary hover:underline font-medium"
              title="Bấm để xem danh sách khóa học"
            >
              Xem {student.enrollmentCount} khóa học
            </Link>
          ) : (
            <span className="text-xs text-on-surface-variant/40 font-medium">—</span>
          )}
        </div>
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

function Avatar({ name, src, active }: { name: string; src: string | null; active: boolean }) {
  const initial = (name.trim().charAt(0) || "U").toUpperCase();
  return (
    <div className="relative shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-10 w-10 rounded-xl object-cover ring-1 ring-outline-variant/30"
        />
      ) : (
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/30 font-black text-sm text-primary shadow-xs">
          {initial}
        </span>
      )}
      <span
        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-surface ${
          active ? "bg-emerald-500" : "bg-rose-500"
        }`}
        title={active ? "Tài khoản: Đang hoạt động" : "Tài khoản: Đã khóa"}
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
