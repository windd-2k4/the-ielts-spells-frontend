import {
  ArrowCounterClockwise, ArrowLeft, ArrowRight, BookOpen, BookOpenText, Books,
  CalendarBlank, CaretDown, CaretRight, ChartLineUp, CheckCircle, Clock,
  DotsThreeVertical, FunnelSimple, GridFour,
  MagnifyingGlass, Microphone, PencilSimple, Plus, Rows, SquaresFour, Target,
  Trash, UsersThree, X,
} from "@phosphor-icons/react";
import { FormEvent, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { ClassSession, Course, CourseForm, Enrollment, Page, StudentSummary } from "../academic-types";
import { classStatusLabel, courseEmpty, date, money, skillPairLabel } from "../academic-types";
import { LoadState, StatusBadge } from "../components/AdminUi";
import { apiFetch } from "../lib/api";
import CourseOverview from "../components/course/CourseOverview";
import CourseSchedule from "../components/course/CourseSchedule";
import CourseStudents from "../components/course/CourseStudents";
import CourseAttendance from "../components/course/CourseAttendance";
import CourseProgress from "../components/course/CourseProgress";
import CourseMatrix from "../components/course/CourseMatrix";
import CourseLibrary from "../components/course/CourseLibrary";
import { CourseEditModal } from "../components/course/CourseEditModal";
import { CourseDeleteModal } from "../components/course/CourseDeleteModal";
import CourseCoverImageField from "../components/course/CourseCoverImageField";
import CourseEnrollmentModal from "../components/enrollment/CourseEnrollmentModal";
import AuthenticatedMediaImage from "../components/test-builder/AuthenticatedMediaImage";
import { useAuth } from "../auth/AuthContext";

type Tab = "overview" | "schedule" | "students" | "attendance" | "progress" | "matrix" | "library";
type CourseStatusFilter = "all" | Course["status"];
type CourseSkillFilter = "all" | Course["skillPair"];

const tabs: { id: Tab; label: string; icon: typeof BookOpenText }[] = [
  { id: "overview", label: "Tổng quan", icon: ChartLineUp },
  { id: "schedule", label: "Thời khóa biểu", icon: CalendarBlank },
  { id: "students", label: "Học viên", icon: UsersThree },
  { id: "attendance", label: "Điểm danh", icon: CheckCircle },
  { id: "progress", label: "Tiến độ kỹ năng", icon: ChartLineUp },
  { id: "matrix", label: "Ma trận hoạt động", icon: GridFour },
  { id: "library", label: "Học liệu", icon: Books },
];

const skillPairPresentation = {
  LISTENING_READING: {
    icon: BookOpen,
    listBorder: "border-l-primary/70",
    cardBorder: "border-primary/45 hover:border-primary/70",
    iconClass: "bg-primary/10 text-primary",
  },
  SPEAKING_WRITING: {
    icon: Microphone,
    listBorder: "border-l-violet-500/70",
    cardBorder: "border-violet-300/80 hover:border-violet-500/70",
    iconClass: "bg-violet-100 text-violet-700",
  },
} satisfies Record<Course["skillPair"], {
  icon: typeof BookOpen;
  listBorder: string;
  cardBorder: string;
  iconClass: string;
}>;

function SkillPairMark({ skillPair, compact = false }: { skillPair: Course["skillPair"]; compact?: boolean }) {
  const presentation = skillPairPresentation[skillPair];
  const Icon = presentation.icon;

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span className={`grid shrink-0 place-items-center rounded-lg ${compact ? "h-5 w-5" : "h-7 w-7"} ${presentation.iconClass}`}>
        <Icon size={compact ? 12 : 15} weight="duotone" />
      </span>
      <span className="truncate">{skillPairLabel[skillPair]}</span>
    </span>
  );
}

function startMonthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
}

function CourseList() {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const canManageCourses = roles.includes("admin");
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CourseStatusFilter>("all");
  const [skillPair, setSkillPair] = useState<CourseSkillFilter>("all");
  const [startMonth, setStartMonth] = useState("");
  const [targetBand, setTargetBand] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">(() => {
    return (localStorage.getItem("course_view_mode") as "list" | "grid") || "grid";
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [openMenuCourseId, setOpenMenuCourseId] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [coursePage, enrollmentPage] = await Promise.all([
        apiFetch<Page<Course>>(canManageCourses ? "/admin/courses?active=true&size=100" : "/admin/courses/assigned?active=true&size=100"),
        canManageCourses
          // ponytail: one bulk read avoids N+1 requests; add a backend aggregate endpoint beyond 2,000 enrollments.
          ? apiFetch<Page<Enrollment>>("/admin/enrollments?size=2000")
          : Promise.resolve(null),
      ]);
      const counts = enrollmentPage?.content.reduce<Record<string, number>>((values, enrollment) => {
        if (enrollment.status === "PENDING" || enrollment.status === "ACTIVE") {
          values[enrollment.courseId] = (values[enrollment.courseId] ?? 0) + 1;
        }
        return values;
      }, {}) ?? {};
      setCourses(coursePage.content);
      setEnrollmentCounts(counts);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không tải được dữ liệu khóa học");
    } finally {
      setLoading(false);
    }
  }, [canManageCourses]);

  useEffect(() => {
    void load();
  }, [load]);

  // Close card action dropdown when clicking anywhere outside
  useEffect(() => {
    const handleWindowClick = () => setOpenMenuCourseId(null);
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

  const handleSetViewMode = (mode: "list" | "grid") => {
    setViewMode(mode);
    localStorage.setItem("course_view_mode", mode);
  };

  const visible = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLocaleLowerCase("vi");
    const filtered = courses.filter(course => {
      const searchableText = [
        course.code,
        course.name,
        course.description,
        course.level,
        skillPairLabel[course.skillPair],
        course.targetBand ? `Band ${course.targetBand}` : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("vi");

      const matchQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
      const matchStatus = status === "all" || course.status === status;
      const matchSkill = skillPair === "all" || course.skillPair === skillPair;
      const matchStartMonth = !startMonth || course.startsOn?.slice(0, 7) === startMonth;
      const matchBand = targetBand === "all" || (course.targetBand != null && String(course.targetBand) === targetBand);

      return matchQuery && matchStatus && matchSkill && matchStartMonth && matchBand;
    });

    return filtered.sort((left, right) => (left.startsOn || "").localeCompare(right.startsOn || ""));
  }, [courses, deferredQuery, skillPair, startMonth, status, targetBand]);

  const listeningReadingCount = courses.filter(item => item.skillPair === "LISTENING_READING").length;
  const speakingWritingCount = courses.filter(item => item.skillPair === "SPEAKING_WRITING").length;
  const activeFilterCount =
    (status !== "all" ? 1 : 0) +
    (skillPair !== "all" ? 1 : 0) +
    (Boolean(startMonth) ? 1 : 0) +
    (targetBand !== "all" ? 1 : 0);
  const hasActiveFilters = Boolean(query.trim()) || activeFilterCount > 0;

  const resetFilters = () => {
    setQuery("");
    setStatus("all");
    setSkillPair("all");
    setStartMonth("");
    setTargetBand("all");
  };

  return (
    <section className="mx-auto max-w-[1500px] space-y-4 pb-8">
      <header className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface shadow-xs">
        {/* Top Header Row */}
        <div className="flex flex-col gap-3 px-4 py-3 md:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
              <BookOpen size={22} weight="duotone" />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-xl font-extrabold tracking-tight text-on-background md:text-2xl">
                Quản lý khóa học
              </h1>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap lg:justify-end">
            {/* 1 thanh search nhỏ */}
            <div className="relative w-full sm:w-56 md:w-64 lg:w-72">
              <label htmlFor="course-search" className="sr-only">Tìm khóa học</label>
              <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70" size={16} />
              <input
                id="course-search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Tìm theo tên, mã, trình độ..."
                className="h-10 w-full rounded-xl border border-outline-variant/70 bg-surface pl-9 pr-8 text-xs font-medium text-on-surface outline-none transition placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Xóa từ khóa"
                  className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
                >
                  <X size={12} weight="bold" />
                </button>
              )}
            </div>

            {/* Nút Bộ lọc SePay style (Super Search) */}
            <button
              type="button"
              aria-expanded={isFilterOpen}
              onClick={() => setIsFilterOpen(prev => !prev)}
              className={`flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition duration-150 ${
                isFilterOpen || activeFilterCount > 0
                  ? "border-primary bg-primary/10 text-primary shadow-2xs"
                  : "border-outline-variant/70 bg-surface text-on-surface-variant hover:border-primary/50 hover:bg-surface-container-low hover:text-on-surface"
              }`}
              title="Bộ lọc nâng cao (Super Search)"
            >
              <FunnelSimple size={16} weight={isFilterOpen || activeFilterCount > 0 ? "fill" : "bold"} />
              <span>Bộ lọc</span>
              {activeFilterCount > 0 && (
                <span className="flex size-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-white">
                  {activeFilterCount}
                </span>
              )}
              <CaretDown size={12} weight="bold" className={`transition-transform duration-200 ${isFilterOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Tạo khóa học mới */}
            {canManageCourses && (
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-primary px-3.5 text-xs font-bold text-on-primary shadow-xs transition duration-200 hover:opacity-90 active:scale-[0.98]"
              >
                <Plus size={16} weight="bold" />
                <span>Tạo khóa học mới</span>
              </button>
            )}
          </div>
        </div>

        {/* Super Filter Panel (SePay style) */}
        {isFilterOpen && (
          <div className="border-t border-outline-variant/40 bg-surface-container-low/40 px-4 py-3.5 md:px-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Field 1: Trạng thái */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Trạng thái
                </label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={event => setStatus(event.target.value as CourseStatusFilter)}
                    className="h-10 w-full appearance-none rounded-xl border border-outline-variant/70 bg-surface pl-3 pr-8 text-xs font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="OPEN">Đang tuyển sinh</option>
                    <option value="ACTIVE">Đang học</option>
                    <option value="COMPLETED">Đã hoàn thành</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                  <CaretDown size={14} weight="bold" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                </div>
              </div>

              {/* Field 2: Nhóm kỹ năng */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Nhóm kỹ năng
                </label>
                <div className="relative">
                  <select
                    value={skillPair}
                    onChange={event => setSkillPair(event.target.value as CourseSkillFilter)}
                    className="h-10 w-full appearance-none rounded-xl border border-outline-variant/70 bg-surface pl-3 pr-8 text-xs font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  >
                    <option value="all">Tất cả kỹ năng ({courses.length})</option>
                    <option value="LISTENING_READING">Listening &amp; Reading ({listeningReadingCount})</option>
                    <option value="SPEAKING_WRITING">Speaking &amp; Writing ({speakingWritingCount})</option>
                  </select>
                  <CaretDown size={14} weight="bold" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                </div>
              </div>

              {/* Field 3: Tháng khai giảng */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Tháng khai giảng
                </label>
                <div className="relative flex h-10 items-center rounded-xl border border-outline-variant/70 bg-surface px-3 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                  <CalendarBlank size={16} weight="bold" className="mr-2 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-on-surface">
                    {startMonth ? startMonthLabel(startMonth) : "Tất cả các tháng"}
                  </span>
                  <input
                    type="month"
                    value={startMonth}
                    onChange={event => setStartMonth(event.target.value)}
                    onClick={event => event.currentTarget.showPicker?.()}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label="Chọn tháng khai giảng"
                  />
                  {startMonth ? (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setStartMonth("");
                      }}
                      className="relative z-10 grid size-5 place-items-center rounded text-on-surface-variant hover:text-primary"
                      title="Xóa tháng khai giảng"
                    >
                      <X size={12} weight="bold" />
                    </button>
                  ) : (
                    <CaretDown size={14} weight="bold" className="pointer-events-none shrink-0 text-on-surface-variant" />
                  )}
                </div>
              </div>

              {/* Field 4: Mục tiêu Band */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Mục tiêu Band
                </label>
                <div className="relative">
                  <select
                    value={targetBand}
                    onChange={event => setTargetBand(event.target.value)}
                    className="h-10 w-full appearance-none rounded-xl border border-outline-variant/70 bg-surface pl-3 pr-8 text-xs font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  >
                    <option value="all">Tất cả mục tiêu</option>
                    <option value="5.0">Band 5.0</option>
                    <option value="5.5">Band 5.5</option>
                    <option value="6.0">Band 6.0</option>
                    <option value="6.5">Band 6.5</option>
                    <option value="7.0">Band 7.0</option>
                    <option value="7.5">Band 7.5</option>
                    <option value="8.0">Band 8.0+</option>
                  </select>
                  <CaretDown size={14} weight="bold" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                </div>
              </div>
            </div>

            {/* Panel Footer: Summary count + Reset & Close */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/30 pt-2.5">
              <span className="text-xs font-semibold text-on-surface-variant">
                Tìm thấy <strong className="font-bold text-primary">{visible.length}</strong> / {courses.length} khóa học phù hợp
              </span>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-bold text-primary transition hover:bg-primary hover:text-on-primary"
                  >
                    <ArrowCounterClockwise size={13} weight="bold" />
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
          <div className="flex flex-wrap items-center gap-1.5 border-t border-outline-variant/30 bg-surface px-4 py-2 text-xs">
            <span className="mr-1 text-[11px] font-bold text-on-surface-variant">Đang lọc:</span>
            {query.trim() && (
              <span className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/5 px-2 py-0.5 text-[11px] font-bold text-primary">
                <span>Từ khóa: "{query.trim()}"</span>
                <button type="button" onClick={() => setQuery("")} className="hover:text-error" title="Bỏ từ khóa">
                  <X size={11} weight="bold" />
                </button>
              </span>
            )}
            {status !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/5 px-2 py-0.5 text-[11px] font-bold text-primary">
                <span>Trạng thái: {classStatusLabel[status]}</span>
                <button type="button" onClick={() => setStatus("all")} className="hover:text-error" title="Bỏ lọc trạng thái">
                  <X size={11} weight="bold" />
                </button>
              </span>
            )}
            {skillPair !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/5 px-2 py-0.5 text-[11px] font-bold text-primary">
                <span>Kỹ năng: {skillPairLabel[skillPair]}</span>
                <button type="button" onClick={() => setSkillPair("all")} className="hover:text-error" title="Bỏ lọc kỹ năng">
                  <X size={11} weight="bold" />
                </button>
              </span>
            )}
            {startMonth && (
              <span className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/5 px-2 py-0.5 text-[11px] font-bold text-primary">
                <span>Khai giảng: {startMonthLabel(startMonth)}</span>
                <button type="button" onClick={() => setStartMonth("")} className="hover:text-error" title="Bỏ lọc tháng">
                  <X size={11} weight="bold" />
                </button>
              </span>
            )}
            {targetBand !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/5 px-2 py-0.5 text-[11px] font-bold text-primary">
                <span>Band: {targetBand}</span>
                <button type="button" onClick={() => setTargetBand("all")} className="hover:text-error" title="Bỏ lọc band">
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
      </header>

      <LoadState loading={loading} error={error} empty={false} onRetry={() => void load()} />

      {/* Main Course Content Section */}
      {!loading && !error && visible.length > 0 && (
        <section aria-label="Danh sách khóa học" className="rounded-2xl border border-outline-variant/35 bg-surface shadow-xs">
          {/* Header Toolbar: Results Count + View Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 bg-surface-container-low/30 px-4 py-2.5">
            <p className="text-sm font-bold text-on-surface">
              {visible.length} <span className="font-medium text-on-surface-variant">khóa học phù hợp</span>
            </p>

            {/* View Mode Switcher: Grid vs List */}
            <div className="flex items-center gap-1 rounded-xl border border-outline-variant/40 bg-surface-container-low/60 p-1">
              <button
                type="button"
                onClick={() => handleSetViewMode("list")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === "list"
                    ? "bg-surface text-primary shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                title="Xem danh sách dạng thẳng"
              >
                <Rows size={16} weight="bold" />
                <span className="hidden sm:inline">Dạng thẳng</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetViewMode("grid")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === "grid"
                    ? "bg-surface text-primary shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                title="Xem danh sách dạng lưới"
              >
                <SquaresFour size={16} weight="bold" />
                <span className="hidden sm:inline">Dạng lưới</span>
              </button>
            </div>
          </div>

          {/* DẠNG THẲNG (LIST VIEW) */}
          {viewMode === "list" && (
            <div>
              <div className="hidden grid-cols-[minmax(0,2fr)_minmax(140px,1fr)_100px_130px_130px_160px] gap-4 border-b border-outline-variant/35 bg-surface-container-low/80 px-5 py-3 text-[11px] font-black uppercase tracking-wider text-on-surface-variant lg:grid">
                <span>Khóa học</span>
                <span>Kỹ năng &amp; Trình độ</span>
                <span>Học viên / sĩ số</span>
                <span>Khai giảng</span>
                <span>Học phí</span>
                <span className="text-right">Thao tác</span>
              </div>
              <div className="divide-y divide-outline-variant/20">
                {visible.map(course => (
                  <article
                    key={course.id}
                    role="link"
                    tabIndex={0}
                    aria-label={`Mở khóa học ${course.name}`}
                    onClick={() => navigate(`/courses/${course.id}`)}
                    onKeyDown={event => {
                      if (
                        event.target === event.currentTarget &&
                        (event.key === "Enter" || event.key === " ")
                      ) {
                        event.preventDefault();
                        navigate(`/courses/${course.id}`);
                      }
                    }}
                    className={`group relative grid cursor-pointer gap-4 border-l-4 px-4 py-4 transition-colors hover:bg-surface-container-low/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 md:px-5 lg:grid-cols-[minmax(0,2fr)_minmax(140px,1fr)_100px_130px_130px_160px] lg:items-center ${skillPairPresentation[course.skillPair].listBorder}`}
                  >
                    {/* Course Identity */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-primary-container/20 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                          {course.code}
                        </span>
                        <StatusBadge value={course.status}>
                          {classStatusLabel[course.status]}
                        </StatusBadge>
                        {!course.isActive && (
                          <span className="rounded-md bg-error-container/20 px-2 py-0.5 text-xs font-bold text-error">
                            Đã ngừng
                          </span>
                        )}
                        {course.targetBand && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-surface-container px-2 py-0.5 text-[11px] font-bold text-on-surface">
                            <Target size={12} className="text-primary" /> Band {course.targetBand}
                          </span>
                        )}
                      </div>
                      <Link
                        to={`/courses/${course.id}`}
                        className="mt-1.5 block truncate font-display text-base font-bold text-on-surface transition-colors group-hover:text-primary"
                      >
                        {course.name}
                      </Link>
                      <p className="mt-0.5 line-clamp-1 text-xs text-on-surface-variant">
                        {course.description || "Chưa có mô tả khóa học."}
                      </p>
                    </div>

                    {/* Skill & Level */}
                    <div>
                      <span className="mb-1 block text-xs text-on-surface-variant lg:hidden font-semibold">
                        Kỹ năng:
                      </span>
                      <strong className="block text-xs font-semibold text-on-surface">
                        <SkillPairMark skillPair={course.skillPair} />
                      </strong>
                      {course.level && (
                        <span className="mt-0.5 inline-block text-[11px] text-on-surface-variant font-medium">
                          {course.level}
                        </span>
                      )}
                    </div>

                    {/* Capacity */}
                    <div>
                      <span className="mb-1 block text-xs text-on-surface-variant lg:hidden font-semibold">
                        Học viên / sĩ số:
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums text-on-surface">
                        <UsersThree size={14} className="text-primary" /> {enrollmentCounts[course.id] ?? 0}/{course.capacity}
                      </span>
                    </div>

                    {/* Starts On */}
                    <div>
                      <span className="mb-1 block text-xs text-on-surface-variant lg:hidden font-semibold">
                        Khai giảng:
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums text-on-surface">
                        <CalendarBlank size={14} className="text-primary" /> {date(course.startsOn)}
                      </span>
                    </div>

                    {/* Tuition Amount */}
                    <div>
                      <span className="mb-1 block text-xs text-on-surface-variant lg:hidden font-semibold">
                        Học phí:
                      </span>
                      <span className="text-xs font-bold text-on-surface tabular-nums">
                        {money(course.tuitionAmount)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2">
                      {canManageCourses && <div className="relative">
                        <button
                          type="button"
                          onClick={event => {
                            event.preventDefault();
                            event.stopPropagation();
                            setOpenMenuCourseId(openMenuCourseId === course.id ? null : course.id);
                          }}
                          aria-label={`Thao tác với khóa học ${course.name}`}
                          aria-expanded={openMenuCourseId === course.id}
                          className="grid h-9 w-9 place-items-center rounded-xl border border-outline-variant/50 bg-surface text-on-surface-variant transition-colors hover:border-primary/50 hover:bg-surface-container hover:text-primary"
                        >
                          <DotsThreeVertical size={18} weight="bold" />
                        </button>

                        {openMenuCourseId === course.id && (
                          <div
                            onClick={event => event.stopPropagation()}
                            className="absolute right-0 top-11 z-30 w-52 rounded-xl border border-outline-variant/40 bg-surface p-1.5 shadow-xl"
                          >
                            <button
                              type="button"
                              onClick={event => {
                                event.preventDefault();
                                event.stopPropagation();
                                setOpenMenuCourseId(null);
                                setEditingCourse(course);
                              }}
                              className="flex min-h-9 w-full items-center gap-2 rounded-lg px-3 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container"
                            >
                              <PencilSimple size={15} weight="bold" /> Chỉnh sửa thông tin
                            </button>
                            <div className="my-1 border-t border-outline-variant/30" />
                            <button
                              type="button"
                              onClick={event => {
                                event.preventDefault();
                                event.stopPropagation();
                                setOpenMenuCourseId(null);
                                setDeletingCourse(course);
                              }}
                              className={`flex min-h-9 w-full items-center gap-2 rounded-lg px-3 text-xs font-bold transition-colors ${
                                course.isActive
                                  ? "text-error hover:bg-error-container/20"
                                  : "text-primary hover:bg-primary-container/20"
                              }`}
                            >
                              {course.isActive ? (
                                <Trash size={15} weight="bold" />
                              ) : (
                                <ArrowCounterClockwise size={15} weight="bold" />
                              )}
                              {course.isActive ? "Ngừng hoạt động" : "Khôi phục khóa học"}
                            </button>
                          </div>
                        )}
                      </div>}

                      <Link
                        to={`/courses/${course.id}`}
                        className="inline-flex min-h-9 items-center justify-center gap-1 rounded-xl bg-primary/10 px-3 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-on-primary"
                      >
                        Chi tiết <CaretRight size={14} weight="bold" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* DẠNG LƯỚI (GRID VIEW) - 4 thẻ 1 hàng, ảnh vuông vức chuẩn tỉ lệ */}
          {viewMode === "grid" && (
            <div className="p-3.5 sm:p-4 md:p-5">
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
                {visible.map(course => (
                  <article
                    key={course.id}
                    role="link"
                    tabIndex={0}
                    aria-label={`Mở khóa học ${course.name}`}
                    onClick={() => navigate(`/courses/${course.id}`)}
                    onKeyDown={event => {
                      if (
                        event.target === event.currentTarget &&
                        (event.key === "Enter" || event.key === " ")
                      ) {
                        event.preventDefault();
                        navigate(`/courses/${course.id}`);
                      }
                    }}
                    className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-surface shadow-xs transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${skillPairPresentation[course.skillPair].cardBorder}`}
                  >
                    {/* Ảnh khóa học vuông vức tỉ lệ 4:3 đẹp và chuẩn hơn */}
                    <div className={`relative aspect-[4/3] w-full overflow-hidden ${course.skillPair === "LISTENING_READING" ? "bg-primary-container/20" : "bg-violet-100/70"}`}>
                      {course.coverImageUrl ? (
                        <AuthenticatedMediaImage
                          fileUrl={course.coverImageUrl}
                          alt={course.coverImageAltText || `Ảnh minh họa khóa học ${course.name}`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="relative flex h-full items-center justify-center overflow-hidden">
                          <span className={`absolute -right-8 -top-12 h-36 w-36 rounded-full border-[24px] opacity-35 ${course.skillPair === "LISTENING_READING" ? "border-primary/20" : "border-violet-400/20"}`} />
                          <span className={`absolute -bottom-12 -left-8 h-28 w-28 rounded-full opacity-50 ${course.skillPair === "LISTENING_READING" ? "bg-primary/10" : "bg-violet-300/20"}`} />
                          <div className="relative flex flex-col items-center gap-1.5 text-center">
                            <span className={`grid h-10 w-10 place-items-center rounded-xl bg-surface/85 shadow-sm ${course.skillPair === "LISTENING_READING" ? "text-primary" : "text-violet-700"}`}>
                              {course.skillPair === "LISTENING_READING" ? (
                                <BookOpen size={22} weight="duotone" aria-hidden="true" />
                              ) : (
                                <Microphone size={22} weight="duotone" aria-hidden="true" />
                              )}
                            </span>
                            <span className="text-[11px] font-bold text-on-surface-variant">{skillPairLabel[course.skillPair]}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Thân thẻ nhỏ gọn */}
                    <div className="flex flex-1 flex-col p-3 sm:p-3.5">
                      <div>
                        {/* Top Badges & Actions */}
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="rounded-md bg-primary-container/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                              {course.code}
                            </span>
                            <StatusBadge value={course.status}>
                              {classStatusLabel[course.status]}
                            </StatusBadge>
                            {!course.isActive && (
                              <span className="rounded-md bg-error-container/20 px-1.5 py-0.5 text-[10px] font-bold text-error">
                                Đã ngừng
                              </span>
                            )}
                          </div>

                          {/* Dropdown Menu */}
                          {canManageCourses && (
                            <div className="relative shrink-0">
                              <button
                                type="button"
                                onClick={event => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  setOpenMenuCourseId(openMenuCourseId === course.id ? null : course.id);
                                }}
                                aria-label={`Thao tác với khóa học ${course.name}`}
                                className="grid h-7 w-7 place-items-center rounded-lg border border-outline-variant/40 text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
                              >
                                <DotsThreeVertical size={15} weight="bold" />
                              </button>

                              {openMenuCourseId === course.id && (
                                <div
                                  onClick={event => event.stopPropagation()}
                                  className="absolute right-0 top-9 z-30 w-48 rounded-xl border border-outline-variant/40 bg-surface p-1.5 shadow-xl"
                                >
                                  <button
                                    type="button"
                                    onClick={event => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      setOpenMenuCourseId(null);
                                      setEditingCourse(course);
                                    }}
                                    className="flex min-h-8 w-full items-center gap-2 rounded-lg px-2.5 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container"
                                  >
                                    <PencilSimple size={14} weight="bold" /> Chỉnh sửa thông tin
                                  </button>
                                  <div className="my-1 border-t border-outline-variant/30" />
                                  <button
                                    type="button"
                                    onClick={event => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      setOpenMenuCourseId(null);
                                      setDeletingCourse(course);
                                    }}
                                    className={`flex min-h-8 w-full items-center gap-2 rounded-lg px-2.5 text-xs font-bold transition-colors ${
                                      course.isActive
                                        ? "text-error hover:bg-error-container/20"
                                        : "text-primary hover:bg-primary-container/20"
                                    }`}
                                  >
                                    {course.isActive ? (
                                      <Trash size={14} weight="bold" />
                                    ) : (
                                      <ArrowCounterClockwise size={14} weight="bold" />
                                    )}
                                    {course.isActive ? "Ngừng hoạt động" : "Khôi phục khóa học"}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Course Title & Description */}
                        <Link
                          to={`/courses/${course.id}`}
                          className="mt-2 block font-display text-sm font-bold leading-snug text-on-surface transition-colors line-clamp-2 group-hover:text-primary"
                        >
                          {course.name}
                        </Link>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-on-surface-variant line-clamp-1">
                          {course.description || "Chưa có mô tả khóa học."}
                        </p>

                        {/* Meta Information Grid */}
                        <div className="mt-2.5 grid grid-cols-2 gap-1.5 rounded-xl bg-surface-container-low/55 p-2 text-[11px]">
                          <div className="flex items-center gap-1 min-w-0 font-semibold text-on-surface">
                            <SkillPairMark skillPair={course.skillPair} compact />
                          </div>
                          <div className="flex items-center gap-1 min-w-0 font-semibold text-on-surface">
                            <CalendarBlank size={13} className="shrink-0 text-primary" />
                            <span className="truncate">{date(course.startsOn)}</span>
                          </div>
                          <div className="flex items-center gap-1 min-w-0 font-semibold text-on-surface">
                            <UsersThree size={13} className="shrink-0 text-primary" />
                            <span className="tabular-nums truncate">{enrollmentCounts[course.id] ?? 0}/{course.capacity} HV</span>
                          </div>
                          <div className="flex items-center gap-1 min-w-0 font-semibold text-on-surface">
                            {course.targetBand ? (
                              <>
                                <Target size={13} className="shrink-0 text-primary" />
                                <span className="truncate">Band {course.targetBand}</span>
                              </>
                            ) : (
                              <>
                                <Clock size={13} className="shrink-0 text-primary" />
                                <span className="truncate">{course.totalSessions} buổi</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Fee & Action */}
                      <div className="mt-3 flex items-center justify-between border-t border-outline-variant/20 pt-2.5">
                        <div>
                          <span className="block text-[9px] font-bold uppercase text-on-surface-variant">Học phí</span>
                          <strong className="text-xs font-bold text-on-surface">
                            {money(course.tuitionAmount)}
                          </strong>
                        </div>

                        <Link
                          to={`/courses/${course.id}`}
                          className="inline-flex h-8 items-center gap-1 rounded-xl bg-primary/10 px-2.5 text-[11px] font-bold text-primary transition-colors hover:bg-primary hover:text-on-primary"
                        >
                          Chi tiết <CaretRight size={13} weight="bold" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Empty State */}
      {!loading && !error && visible.length === 0 && (
        <section className="rounded-2xl border border-dashed border-outline-variant/70 bg-surface-container-low px-6 py-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <MagnifyingGlass size={24} weight="bold" />
          </span>
          <h2 className="mt-4 font-display text-lg font-bold text-on-surface">
            {courses.length ? "Không tìm thấy khóa học phù hợp" : "Chưa có khóa học trong nhóm này"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
            {courses.length
              ? "Hãy thử từ khóa khác hoặc đặt lại bộ lọc để xem toàn bộ danh sách."
              : "Tạo khóa học đầu tiên để bắt đầu quản lý lịch học và học viên."}
          </p>
          {courses.length > 0 ? (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/30 bg-surface px-4 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-on-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
            >
              <ArrowCounterClockwise size={17} weight="bold" /> Đặt lại bộ lọc
            </button>
          ) : canManageCourses ? (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary transition-colors hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-primary/15"
            >
              <Plus size={17} weight="bold" /> Tạo khóa học
            </button>
          ) : null}
        </section>
      )}

      {/* Course Modals */}
      {dialogOpen && (
        <CourseDialog
          onClose={() => setDialogOpen(false)}
          onSaved={async () => {
            setDialogOpen(false);
            await load();
          }}
        />
      )}

      {editingCourse && (
        <CourseEditModal
          course={editingCourse}
          open={Boolean(editingCourse)}
          onClose={() => setEditingCourse(null)}
          onSaved={async () => {
            setEditingCourse(null);
            await load();
          }}
        />
      )}

      {deletingCourse && (
        <CourseDeleteModal
          course={deletingCourse}
          open={Boolean(deletingCourse)}
          onClose={() => setDeletingCourse(null)}
          onSuccess={async () => {
            setDeletingCourse(null);
            await load();
          }}
        />
      )}
    </section>
  );
}

function CourseDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState<CourseForm>(courseEmpty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const field = (key: keyof CourseForm) => (value: string | boolean) => setForm(current => ({ ...current, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (form.coverImageUrl && !form.coverImageAltText.trim()) {
      setError("Vui lòng thêm mô tả thay thế cho ảnh minh họa khóa học.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await apiFetch("/admin/courses", {
        method: "POST",
        body: JSON.stringify({
          programId: null,
          name: form.name,
          description: form.description || null,
          coverImageUrl: form.coverImageUrl || null,
          coverImageAltText: form.coverImageUrl ? form.coverImageAltText.trim() : null,
          level: form.level || null,
          skillPair: form.skillPair,
          targetBand: form.targetBand ? Number(form.targetBand) : null,
          totalSessions: Number(form.totalSessions),
          tuitionAmount: form.tuitionAmount ? Number(form.tuitionAmount) : null,
          capacity: Number(form.capacity),
          startsOn: form.startsOn,
          status: form.status,
          defaultZoomUrl: form.defaultZoomUrl || null,
          isPublic: form.isPublic,
        }),
      });
      await onSaved();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không tạo được khóa học");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-on-background/45 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="course-dialog-title">
      <form onSubmit={submit} className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-surface p-6 shadow-2xl sm:rounded-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Khóa học mới</p>
            <h2 id="course-dialog-title" className="mt-1 font-display text-2xl font-bold">Thiết lập khóa học</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="grid h-11 w-11 place-items-center rounded-xl border border-outline-variant/50">
            <X size={20} />
          </button>
        </div>
        {error && <p className="mb-4 rounded-xl bg-error-container/20 p-3 text-sm font-semibold text-error">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <CourseCoverImageField
            imageUrl={form.coverImageUrl}
            altText={form.coverImageAltText}
            courseName={form.name}
            onChange={(coverImageUrl, coverImageAltText) => setForm(current => ({
              ...current,
              coverImageUrl,
              coverImageAltText,
            }))}
          />
          <Field label="Tên khóa học"><input required value={form.name} onChange={e => field("name")(e.target.value)} /></Field>
          <div className="rounded-xl border border-dashed border-primary/35 bg-primary-container/10 px-4 py-3 text-sm text-on-surface-variant">
            <span className="block text-xs font-bold uppercase tracking-wider text-primary">Mã khóa học</span>
            <span className="mt-1 block">Hệ thống tự sinh khi tạo, ví dụ <strong>SW-2607-001</strong>.</span>
          </div>
          <Field label="Cặp kỹ năng">
            <select value={form.skillPair} onChange={e => field("skillPair")(e.target.value)}>
              <option value="LISTENING_READING">Listening & Reading</option>
              <option value="SPEAKING_WRITING">Speaking & Writing</option>
            </select>
          </Field>
          <Field label="Trạng thái">
            <select value={form.status} onChange={e => field("status")(e.target.value)}>
              {Object.entries(classStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label="Ngày bắt đầu"><input required type="date" value={form.startsOn} onChange={e => field("startsOn")(e.target.value)} /></Field>
          <p className="sm:col-span-2 -mt-2 text-xs text-on-surface-variant">Ngày kết thúc được cập nhật tự động theo session cuối cùng.</p>
          <Field label="Số session"><input required min="1" type="number" value={form.totalSessions} onChange={e => field("totalSessions")(e.target.value)} /></Field>
          <Field label="Sĩ số tối đa"><input required min="1" type="number" value={form.capacity} onChange={e => field("capacity")(e.target.value)} /></Field>
          <Field label="Band mục tiêu"><input min="0" max="9" step="0.5" type="number" value={form.targetBand} onChange={e => field("targetBand")(e.target.value)} /></Field>
          <Field label="Học phí"><input min="0" type="number" value={form.tuitionAmount} onChange={e => field("tuitionAmount")(e.target.value)} /></Field>
          <Field label="Link Zoom mặc định"><input value={form.defaultZoomUrl} onChange={e => field("defaultZoomUrl")(e.target.value)} /></Field>
          <Field label="Trình độ"><input value={form.level} onChange={e => field("level")(e.target.value)} /></Field>
          <label className="sm:col-span-2 text-sm font-bold text-on-surface-variant">
            Mô tả
            <textarea rows={3} value={form.description} onChange={e => field("description")(e.target.value)} className="mt-1.5 w-full rounded-xl border-outline-variant/60 bg-surface focus:border-primary focus:ring-primary" />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-outline-variant/60 px-5 text-sm font-bold">Hủy</button>
          <button disabled={saving} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary disabled:opacity-60">{saving ? "Đang tạo..." : "Tạo khóa học"}</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <label className="text-sm font-bold text-on-surface-variant">
      {label}
      <span className="mt-1.5 block [&>input]:w-full [&>input]:rounded-xl [&>input]:border-outline-variant/60 [&>input]:bg-surface [&>input]:focus:border-primary [&>input]:focus:ring-primary [&>select]:w-full [&>select]:rounded-xl [&>select]:border-outline-variant/60 [&>select]:bg-surface [&>select]:focus:border-primary [&>select]:focus:ring-primary">
        {children}
      </span>
    </label>
  );
}

function Workspace() {
  const { courseId = "" } = useParams();
  const navigate = useNavigate();
  const { roles } = useAuth();
  const canManageCourse = roles.includes("admin");
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") as Tab | null;
  const activeTab: Tab = tabs.some(tab => tab.id === requestedTab) ? requestedTab! : "overview";
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrollmentOpen, setEnrollmentOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [courseData, enrollmentPage, studentPage] = await Promise.all([
        apiFetch<Course>(`/admin/courses/${courseId}`),
        apiFetch<Page<Enrollment>>(`/admin/enrollments?courseId=${courseId}&size=100`),
        apiFetch<Page<StudentSummary>>(`/admin/courses/${courseId}/students?size=100`),
      ]);
      setCourse(courseData);
      setEnrollments(enrollmentPage.content);
      setStudents(studentPage.content);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không tải được khóa học");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (activeTab !== "overview") return;
    let cancelled = false;
    void apiFetch<ClassSession[]>(`/admin/courses/${courseId}/sessions`)
      .then(value => { if (!cancelled) setSessions(value); })
      .catch(() => { if (!cancelled) setSessions([]); });
    return () => { cancelled = true; };
  }, [activeTab, courseId]);

  const roster = enrollments
    .map(enrollment => ({ enrollment, student: students.find(item => item.id === enrollment.studentId) }))
    .filter((item): item is { enrollment: Enrollment; student: StudentSummary } => Boolean(item.student));

  function setTab(tab: Tab) {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next);
  }

  function openStudentProfile(studentId: string) {
    navigate(`/students/${studentId}`);
  }

  if (loading) return <LoadState loading error="" empty={false} onRetry={() => void load()} />;
  if (error || !course) return <LoadState loading={false} error={error || "Không tìm thấy khóa học"} empty={false} onRetry={() => void load()} />;

  const completed = sessions.filter(item => item.status === "COMPLETED").length;
  const sessionCount = sessions.length || course.totalSessions;

  return (
    <section className="mx-auto max-w-[1480px] space-y-2">
      <header className="rounded-xl border border-outline-variant/40 bg-surface px-2 py-1.5 shadow-xs md:px-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/courses")}
              aria-label="Quay lại danh sách khóa học"
              title="Quay lại danh sách khóa học"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <ArrowLeft size={17} weight="bold" />
            </button>

            <div className="flex min-w-0 items-center gap-1.5">
              <h1 className="truncate font-display text-[17px] font-bold tracking-tight text-on-surface" title={course.name}>
                {course.name}
              </h1>
              <span
                role="img"
                aria-label={`Trạng thái: ${classStatusLabel[course.status]}`}
                title={classStatusLabel[course.status]}
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                  course.status === "ACTIVE" ? "text-emerald-600" :
                  course.status === "OPEN" ? "text-amber-600" :
                  course.status === "COMPLETED" ? "text-primary" : "text-error"
                }`}
              >
                {course.status === "CANCELLED" ? <X size={16} weight="bold" /> : course.status === "OPEN" ? <Target size={16} weight="fill" /> : <CheckCircle size={16} weight="fill" />}
              </span>
              <div className="hidden shrink-0 items-center text-xs font-bold tabular-nums text-on-surface-variant sm:flex">
                <span aria-label={`Bắt đầu: ${date(course.startsOn)}; kết thúc theo session cuối`} title="Thời gian khóa học" className="hidden h-8 items-center gap-1 rounded-lg px-1.5 hover:bg-surface-container-high hover:text-primary lg:flex">
                  <CalendarBlank size={16} />
                  {date(course.startsOn)}–{course.endsOn ? date(course.endsOn) : "Theo session cuối"}
                </span>
                <span aria-label={`Sĩ số: ${roster.length} trên ${course.capacity} học viên`} title="Sĩ số học viên" className="flex h-8 items-center gap-1 rounded-lg px-1.5 hover:bg-surface-container-high hover:text-primary">
                  <UsersThree size={16} />
                  {roster.length}/{course.capacity}
                </span>
                <span aria-label={`Tiến độ: ${sessions.length ? `${completed} trên ${sessions.length}` : `chưa tải trên ${course.totalSessions}`} buổi`} title="Tiến độ buổi học" className="hidden h-8 items-center gap-1 rounded-lg px-1.5 hover:bg-surface-container-high hover:text-primary md:flex">
                  <Clock size={16} />
                  {sessions.length ? `${completed}/${sessionCount}` : `—/${sessionCount}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {canManageCourse && <button
              type="button"
              onClick={() => setEnrollmentOpen(true)}
              aria-label="Ghi danh học viên"
              title="Ghi danh học viên"
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-on-primary transition-colors hover:bg-on-primary-container focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <Plus size={16} weight="bold" /> Ghi danh
            </button>}

            {canManageCourse && <details className="group relative">
              <summary
                aria-label="Thêm thao tác khóa học"
                title="Thêm thao tác"
                className="grid h-8 w-8 cursor-pointer list-none place-items-center rounded-lg border border-outline-variant/60 text-on-surface-variant transition-colors hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/30 [&::-webkit-details-marker]:hidden"
              >
                <DotsThreeVertical size={18} weight="bold" />
              </summary>
              <div className="absolute right-0 top-10 z-30 w-52 overflow-hidden rounded-xl border border-outline-variant/50 bg-surface p-1.5 shadow-xl">
                <button
                  type="button"
                  onClick={(event) => {
                    event.currentTarget.closest("details")?.removeAttribute("open");
                    setEditOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-on-surface hover:bg-surface-container-high"
                >
                  <PencilSimple size={17} /> Chỉnh sửa khóa học
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.currentTarget.closest("details")?.removeAttribute("open");
                    setDeleteOpen(true);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold ${course.isActive ? "text-error hover:bg-error-container/10" : "text-primary hover:bg-primary/10"}`}
                >
                  {course.isActive ? <Trash size={17} /> : <ArrowCounterClockwise size={17} />}
                  {course.isActive ? "Ngừng hoặc xóa" : "Khôi phục khóa học"}
                </button>
              </div>
            </details>}
          </div>
        </div>
      </header>

      <nav aria-label="Chức năng khóa học" className="flex gap-0.5 overflow-x-auto border-b border-outline-variant/40">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 border-b-2 px-3 text-[13px] font-bold transition-colors ${
                activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {activeTab === "overview" && <CourseOverview course={course} selectedClass={course} roster={roster} setTab={setTab} onSelectStudent={canManageCourse ? openStudentProfile : undefined} />}
      {activeTab === "schedule" && <CourseSchedule courseId={course.id} skillPair={course.skillPair} initialSessions={sessions.length ? sessions : undefined} />}
      {activeTab === "students" && <CourseStudents courseId={course.id} skillPair={course.skillPair} roster={roster} onSelectStudent={canManageCourse ? openStudentProfile : undefined} onRosterChanged={load} />}
      {activeTab === "attendance" && <CourseAttendance courseId={course.id} roster={roster} onSelectStudent={canManageCourse ? openStudentProfile : undefined} onEnrollmentUpdated={updated => setEnrollments(current => current.map(item => item.id === updated.id ? updated : item))} />}
      {activeTab === "progress" && <CourseProgress courseId={course.id} courseCode={course.code} courseName={course.name} skillPair={course.skillPair} roster={roster} initialSessions={sessions.length ? sessions : undefined} onSelectStudent={canManageCourse ? openStudentProfile : undefined} />}
      {activeTab === "matrix" && <CourseMatrix courseId={course.id} roster={roster} />}
      {activeTab === "library" && <CourseLibrary courseId={course.id} />}

      {canManageCourse && <CourseEnrollmentModal course={course} enrollments={enrollments} open={enrollmentOpen} onClose={() => setEnrollmentOpen(false)} onSaved={load} />}

      {canManageCourse && <CourseEditModal
        course={course}
        currentEnrollmentsCount={roster.length}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={load}
      />}

      {canManageCourse && <CourseDeleteModal
        course={course}
        enrollmentsCount={roster.length}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onSuccess={async (action) => {
          if (action === "deleted") {
            navigate("/courses");
          } else {
            await load();
          }
        }}
      />}
    </section>
  );
}

export function CourseManagementPage() {
  return useParams().courseId ? <Workspace /> : <CourseList />;
}

