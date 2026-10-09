import {
  ArrowCounterClockwise, ArrowLeft, ArrowRight, BookOpen, BookOpenText, Books,
  ArrowsDownUp, CalendarBlank, CaretDown, CaretRight, ChartLineUp, CheckCircle, Clock,
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

type Tab = "overview" | "schedule" | "students" | "attendance" | "progress" | "matrix" | "library";
type CourseActivityFilter = "active" | "inactive" | "all";
type CourseStatusFilter = "all" | Course["status"];
type CourseSkillFilter = "all" | Course["skillPair"];
type CourseCapacityFilter = "all" | "small" | "medium" | "large";
type CourseSort =
  | "starts-asc"
  | "starts-desc"
  | "name-asc"
  | "name-desc"
  | "capacity-desc"
  | "capacity-asc"
  | "tuition-desc"
  | "tuition-asc";

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

function SkillPairMark({ skillPair }: { skillPair: Course["skillPair"] }) {
  const presentation = skillPairPresentation[skillPair];
  const Icon = presentation.icon;

  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${presentation.iconClass}`}>
        <Icon size={15} weight="duotone" />
      </span>
      <span className="truncate">{skillPairLabel[skillPair]}</span>
    </span>
  );
}

function CourseList() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CourseStatusFilter>("all");
  const [skillPair, setSkillPair] = useState<CourseSkillFilter>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [capacityFilter, setCapacityFilter] = useState<CourseCapacityFilter>("all");
  const [sort, setSort] = useState<CourseSort>("starts-asc");
  const [activityFilter, setActivityFilter] = useState<CourseActivityFilter>("active");
  const [viewMode, setViewMode] = useState<"list" | "grid">(() => {
    return (localStorage.getItem("course_view_mode") as "list" | "grid") || "grid";
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [openMenuCourseId, setOpenMenuCourseId] = useState<string | null>(null);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let url = "/admin/courses?size=100";
      if (activityFilter === "active") url = "/admin/courses?active=true&size=100";
      else if (activityFilter === "inactive") url = "/admin/courses?active=false&size=100";
      const [coursePage, enrollmentPage] = await Promise.all([
        apiFetch<Page<Course>>(url),
        // ponytail: one bulk read avoids N+1 requests; add a backend aggregate endpoint beyond 2,000 enrollments.
        apiFetch<Page<Enrollment>>("/admin/enrollments?size=2000"),
      ]);
      const counts = enrollmentPage.content.reduce<Record<string, number>>((values, enrollment) => {
        if (enrollment.status === "PENDING" || enrollment.status === "ACTIVE") {
          values[enrollment.courseId] = (values[enrollment.courseId] ?? 0) + 1;
        }
        return values;
      }, {});
      setCourses(coursePage.content);
      setEnrollmentCounts(counts);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không tải được dữ liệu khóa học");
    } finally {
      setLoading(false);
    }
  }, [activityFilter]);

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

  // Distinct levels dynamically extracted from real loaded courses
  const distinctLevels = useMemo(() => {
    const set = new Set<string>();
    courses.forEach(c => {
      if (c.level && c.level.trim()) set.add(c.level.trim());
    });
    return Array.from(set).sort();
  }, [courses]);

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
      const matchLevel = levelFilter === "all" || (course.level && course.level.trim() === levelFilter);
      const matchCapacity =
        capacityFilter === "all" ||
        (capacityFilter === "small" && course.capacity < 15) ||
        (capacityFilter === "medium" && course.capacity >= 15 && course.capacity <= 25) ||
        (capacityFilter === "large" && course.capacity > 25);

      return matchQuery && matchStatus && matchSkill && matchLevel && matchCapacity;
    });

    return filtered.sort((left, right) => {
      if (sort === "starts-desc") return (right.startsOn || "").localeCompare(left.startsOn || "");
      if (sort === "name-asc") return left.name.localeCompare(right.name, "vi");
      if (sort === "name-desc") return right.name.localeCompare(left.name, "vi");
      if (sort === "capacity-desc") return right.capacity - left.capacity;
      if (sort === "capacity-asc") return left.capacity - right.capacity;
      if (sort === "tuition-desc") return (right.tuitionAmount ?? 0) - (left.tuitionAmount ?? 0);
      if (sort === "tuition-asc") return (left.tuitionAmount ?? 0) - (right.tuitionAmount ?? 0);
      return (left.startsOn || "").localeCompare(right.startsOn || "");
    });
  }, [courses, deferredQuery, skillPair, levelFilter, capacityFilter, sort, status]);

  const active = courses.filter(item => item.status === "ACTIVE").length;
  const enrolling = courses.filter(item => item.status === "OPEN").length;
  const completed = courses.filter(item => item.status === "COMPLETED").length;
  const cancelled = courses.filter(item => item.status === "CANCELLED").length;
  const activeAdvancedFilterCount = [
    activityFilter !== "active",
    skillPair !== "all",
    levelFilter !== "all",
    capacityFilter !== "all",
  ].filter(Boolean).length;

  const hasActiveFilters =
    Boolean(query.trim()) ||
    activityFilter !== "active" ||
    status !== "all" ||
    skillPair !== "all" ||
    levelFilter !== "all" ||
    capacityFilter !== "all" ||
    sort !== "starts-asc";

  const resetFilters = () => {
    setQuery("");
    setActivityFilter("active");
    setStatus("all");
    setSkillPair("all");
    setLevelFilter("all");
    setCapacityFilter("all");
    setSort("starts-asc");
  };

  return (
    <section className="mx-auto max-w-[1500px] space-y-4 pb-8">
      <header className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface shadow-xs">
        <div className="flex flex-col gap-3 px-4 py-3 md:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3 lg:w-[260px] lg:shrink-0 xl:w-[300px]">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
              <BookOpen size={24} weight="duotone" />
            </span>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-on-background md:text-[28px]">
              Quản lý khóa học
            </h1>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 lg:min-w-0 lg:flex-1 lg:flex-nowrap lg:justify-end">
            <div className="relative w-full sm:flex-1 lg:w-48 lg:shrink-0 lg:flex-none xl:w-64">
              <label htmlFor="course-search" className="sr-only">Tìm khóa học</label>
              <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/70" size={18} />
              <input
                id="course-search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Tìm theo tên, mã, trình độ hoặc kỹ năng..."
                className="min-h-11 w-full rounded-xl border border-outline-variant/60 bg-surface pl-10 pr-9 text-sm text-on-surface outline-none transition placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Xóa từ khóa"
                  className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                >
                  <X size={14} weight="bold" />
                </button>
              )}
            </div>

          <button
            type="button"
            aria-expanded={advancedFiltersOpen}
            aria-controls="course-advanced-filters"
            onClick={() => setAdvancedFiltersOpen(value => !value)}
            className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-3.5 text-sm font-bold transition-colors ${
              advancedFiltersOpen || activeAdvancedFilterCount > 0
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-outline-variant/60 bg-surface text-on-surface hover:border-primary/40 hover:text-primary"
            }`}
          >
            <FunnelSimple size={17} weight="bold" />
            Bộ lọc
            {activeAdvancedFilterCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-md bg-primary px-1 text-[10px] text-on-primary">
                {activeAdvancedFilterCount}
              </span>
            )}
          </button>

          <label className="group flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-outline-variant/60 bg-surface px-2 transition hover:border-primary/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary">
              <ArrowsDownUp size={16} weight="bold" />
            </span>
            <span className="hidden text-[11px] font-semibold text-on-surface-variant xl:inline">Sắp xếp:</span>
            <span className="relative">
              <select
                aria-label="Sắp xếp khóa học"
                value={sort}
                onChange={event => setSort(event.target.value as CourseSort)}
                className="min-w-0 max-w-[180px] appearance-none border-0 bg-transparent bg-none py-2 pl-0 pr-7 text-sm font-bold text-on-surface outline-none focus:ring-0"
              >
                <option value="starts-asc">Khai giảng gần nhất</option>
                <option value="starts-desc">Khai giảng xa nhất</option>
                <option value="name-asc">Tên khóa học (A-Z)</option>
                <option value="name-desc">Tên khóa học (Z-A)</option>
                <option value="capacity-desc">Sĩ số giảm dần</option>
                <option value="capacity-asc">Sĩ số tăng dần</option>
                <option value="tuition-desc">Học phí cao nhất</option>
                <option value="tuition-asc">Học phí thấp nhất</option>
              </select>
              <CaretDown size={14} weight="bold" className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-on-surface-variant transition group-hover:text-primary" />
            </span>
          </label>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 text-xs font-bold text-primary transition hover:bg-primary hover:text-on-primary"
            >
              <ArrowCounterClockwise size={14} weight="bold" /> Đặt lại bộ lọc
            </button>
          )}

          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-4 text-sm font-bold text-on-primary shadow-xs transition duration-200 hover:opacity-90 active:scale-[0.98]"
          >
            <Plus size={18} weight="bold" /> Tạo khóa học mới
          </button>
          </div>
        </div>

        {/* Status Summary Tabs */}
        <div className="border-t border-outline-variant/25 bg-surface-container-low/20 px-3 py-2">
          <div className="flex items-center gap-3">
            <span className="hidden shrink-0 text-[11px] font-bold text-on-surface-variant md:inline">Trạng thái</span>
            <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div
                className="inline-flex min-w-max items-center gap-1 rounded-xl bg-surface-container-low p-1"
                role="tablist"
                aria-label="Lọc theo trạng thái khóa học"
              >
                {[
                  { value: "all" as CourseStatusFilter, label: "Tất cả", count: courses.length, dot: "bg-primary" },
                  { value: "OPEN" as CourseStatusFilter, label: "Đang tuyển sinh", count: enrolling, dot: "bg-amber-500" },
                  { value: "ACTIVE" as CourseStatusFilter, label: "Đang học", count: active, dot: "bg-emerald-500" },
                  { value: "COMPLETED" as CourseStatusFilter, label: "Đã hoàn thành", count: completed, dot: "bg-violet-500" },
                  { value: "CANCELLED" as CourseStatusFilter, label: "Đã hủy", count: cancelled, dot: "bg-rose-500" },
                ].map(tab => {
                  const isActive = status === tab.value;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setStatus(tab.value)}
                      className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 active:scale-[0.98] ${
                        isActive
                          ? "border-primary/20 bg-surface text-primary shadow-xs"
                          : "border-transparent text-on-surface-variant hover:bg-surface/70 hover:text-on-surface"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${tab.dot} ${isActive ? "ring-4 ring-current/10" : ""}`} aria-hidden="true" />
                      <span>{tab.label}</span>
                      <span className={`min-w-5 rounded-md px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums ${
                        isActive ? "bg-primary/10 text-primary" : "bg-surface-container-high/80 text-on-surface-variant"
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {advancedFiltersOpen && (
          <div id="course-advanced-filters" className="grid gap-3 border-t border-outline-variant/25 bg-surface-container-low/30 p-3 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <label htmlFor="course-activity-filter" className="mb-1 block text-xs font-bold text-on-surface-variant">Hoạt động</label>
              <select
                id="course-activity-filter"
                value={activityFilter}
                onChange={event => setActivityFilter(event.target.value as CourseActivityFilter)}
                className="min-h-11 w-full rounded-xl border border-outline-variant/60 bg-surface px-3 text-sm font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Đã ngừng hoạt động</option>
                <option value="all">Tất cả khóa học</option>
              </select>
            </div>

            <div>
              <label htmlFor="course-skill-filter" className="mb-1 block text-xs font-bold text-on-surface-variant">Cặp kỹ năng</label>
              <select
                id="course-skill-filter"
                value={skillPair}
                onChange={event => setSkillPair(event.target.value as CourseSkillFilter)}
                className="min-h-11 w-full rounded-xl border border-outline-variant/60 bg-surface px-3 text-sm font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                <option value="all">Tất cả kỹ năng</option>
                <option value="LISTENING_READING">Listening & Reading</option>
                <option value="SPEAKING_WRITING">Speaking & Writing</option>
              </select>
            </div>

            <div>
              <label htmlFor="course-level-filter" className="mb-1 block text-xs font-bold text-on-surface-variant">Trình độ</label>
              <select
                id="course-level-filter"
                value={levelFilter}
                onChange={event => setLevelFilter(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-outline-variant/60 bg-surface px-3 text-sm font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                <option value="all">Tất cả trình độ</option>
                {distinctLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="course-capacity-filter" className="mb-1 block text-xs font-bold text-on-surface-variant">Quy mô sĩ số</label>
              <select
                id="course-capacity-filter"
                value={capacityFilter}
                onChange={event => setCapacityFilter(event.target.value as CourseCapacityFilter)}
                className="min-h-11 w-full rounded-xl border border-outline-variant/60 bg-surface px-3 text-sm font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                <option value="all">Tất cả quy mô</option>
                <option value="small">Lớp nhỏ (&lt; 15)</option>
                <option value="medium">Lớp chuẩn (15 - 25)</option>
                <option value="large">Lớp lớn (&gt; 25)</option>
              </select>
            </div>
          </div>
        )}

        {/* Active Advanced Filter Chips */}
        {activeAdvancedFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-outline-variant/20 px-3 py-2">
            <span className="text-[11px] font-bold text-on-surface-variant">Đang lọc:</span>
            {activityFilter !== "active" && (
              <FilterChip
                label={`Hoạt động: ${activityFilter === "inactive" ? "Đã ngừng" : "Tất cả"}`}
                onClear={() => setActivityFilter("active")}
              />
            )}
            {skillPair !== "all" && (
              <FilterChip label={`Kỹ năng: ${skillPairLabel[skillPair]}`} onClear={() => setSkillPair("all")} />
            )}
            {levelFilter !== "all" && (
              <FilterChip label={`Trình độ: ${levelFilter}`} onClear={() => setLevelFilter("all")} />
            )}
            {capacityFilter !== "all" && (
              <FilterChip
                label={`Sĩ số: ${capacityFilter === "small" ? "< 15" : capacityFilter === "medium" ? "15 - 25" : "> 25"}`}
                onClear={() => setCapacityFilter("all")}
              />
            )}
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
                      <div className="relative">
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
                      </div>

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

          {/* DẠNG LƯỚI (GRID VIEW) */}
          {viewMode === "grid" && (
            <div className="p-4 md:p-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                    className={`group relative flex cursor-pointer flex-col rounded-2xl border bg-surface shadow-xs transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${skillPairPresentation[course.skillPair].cardBorder}`}
                  >
                    <div className={`relative h-36 overflow-hidden rounded-t-[15px] ${course.skillPair === "LISTENING_READING" ? "bg-primary-container/20" : "bg-violet-100/70"}`}>
                      {course.coverImageUrl ? (
                        <AuthenticatedMediaImage
                          fileUrl={course.coverImageUrl}
                          alt={course.coverImageAltText || `Ảnh minh họa khóa học ${course.name}`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025]"
                        />
                      ) : (
                        <div className="relative flex h-full items-center justify-center overflow-hidden">
                          <span className={`absolute -right-8 -top-12 h-36 w-36 rounded-full border-[24px] opacity-35 ${course.skillPair === "LISTENING_READING" ? "border-primary/20" : "border-violet-400/20"}`} />
                          <span className={`absolute -bottom-12 -left-8 h-28 w-28 rounded-full opacity-50 ${course.skillPair === "LISTENING_READING" ? "bg-primary/10" : "bg-violet-300/20"}`} />
                          <div className="relative flex flex-col items-center gap-2 text-center">
                            <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-surface/85 shadow-sm ${course.skillPair === "LISTENING_READING" ? "text-primary" : "text-violet-700"}`}>
                              {course.skillPair === "LISTENING_READING" ? (
                                <BookOpen size={26} weight="duotone" aria-hidden="true" />
                              ) : (
                                <Microphone size={26} weight="duotone" aria-hidden="true" />
                              )}
                            </span>
                            <span className="text-xs font-bold text-on-surface-variant">{skillPairLabel[course.skillPair]}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                    <div>
                      {/* Top Badges & Actions */}
                      <div className="flex items-start justify-between gap-2">
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
                        </div>

                        {/* Dropdown Menu */}
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={event => {
                              event.preventDefault();
                              event.stopPropagation();
                              setOpenMenuCourseId(openMenuCourseId === course.id ? null : course.id);
                            }}
                            aria-label={`Thao tác với khóa học ${course.name}`}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-outline-variant/40 text-on-surface-variant hover:border-primary/40 hover:text-primary"
                          >
                            <DotsThreeVertical size={16} weight="bold" />
                          </button>

                          {openMenuCourseId === course.id && (
                            <div
                              onClick={event => event.stopPropagation()}
                              className="absolute right-0 top-10 z-30 w-52 rounded-xl border border-outline-variant/40 bg-surface p-1.5 shadow-xl"
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
                        </div>
                      </div>

                      {/* Course Title & Description */}
                      <Link
                        to={`/courses/${course.id}`}
                        className="mt-3 block font-display text-base font-bold text-on-surface transition-colors group-hover:text-primary line-clamp-2"
                      >
                        {course.name}
                      </Link>
                      <p className="mt-1 text-xs text-on-surface-variant line-clamp-2">
                        {course.description || "Chưa có mô tả khóa học."}
                      </p>

                      {/* Meta Information Grid */}
                      <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-xl bg-surface-container-low/55 p-3 text-xs">
                        <div className="flex items-center gap-1.5 text-on-surface font-semibold">
                          <SkillPairMark skillPair={course.skillPair} />
                        </div>
                        <div className="flex items-center gap-1.5 text-on-surface font-semibold">
                          <CalendarBlank size={14} className="text-primary shrink-0" />
                          <span className="truncate">{date(course.startsOn)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-on-surface font-semibold">
                          <UsersThree size={14} className="text-primary shrink-0" />
                          <span className="tabular-nums">{enrollmentCounts[course.id] ?? 0}/{course.capacity} học viên</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-on-surface font-semibold">
                          {course.targetBand ? (
                            <>
                              <Target size={14} className="text-primary shrink-0" />
                              <span>Band {course.targetBand}</span>
                            </>
                          ) : (
                            <>
                              <Clock size={14} className="text-primary shrink-0" />
                              <span>{course.totalSessions} buổi</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Fee & Action */}
                    <div className="mt-4 flex items-center justify-between border-t border-outline-variant/20 pt-3">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-on-surface-variant">Học phí</span>
                        <strong className="text-xs font-bold text-on-surface">
                          {money(course.tuitionAmount)}
                        </strong>
                      </div>

                      <Link
                        to={`/courses/${course.id}`}
                        className="inline-flex min-h-9 items-center gap-1 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-on-primary"
                      >
                        Chi tiết <CaretRight size={14} weight="bold" />
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
              : activityFilter === "inactive"
                ? "Chưa có khóa học nào đã ngừng hoạt động."
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
          ) : activityFilter !== "inactive" ? (
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

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-semibold text-primary">
      <span>{label}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label={`Xóa bộ lọc ${label}`}
        className="rounded text-primary/80 hover:text-primary hover:bg-primary/10"
      >
        <X size={12} weight="bold" />
      </button>
    </span>
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
          endsOn: form.endsOn || null,
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
          <Field label="Ngày kết thúc"><input type="date" value={form.endsOn} onChange={e => field("endsOn")(e.target.value)} /></Field>
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
      const [courseData, enrollmentPage, studentPage, sessionItems] = await Promise.all([
        apiFetch<Course>(`/admin/courses/${courseId}`),
        apiFetch<Page<Enrollment>>(`/admin/enrollments?courseId=${courseId}&size=100`),
        apiFetch<Page<StudentSummary>>("/admin/students?size=100"),
        apiFetch<ClassSession[]>(`/admin/courses/${courseId}/sessions`),
      ]);
      setCourse(courseData);
      setEnrollments(enrollmentPage.content);
      setStudents(studentPage.content);
      setSessions(sessionItems);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không tải được khóa học");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { void load(); }, [load]);

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

  return (
    <section className="mx-auto max-w-[1480px] space-y-3">
      <header className="rounded-2xl border border-outline-variant/40 bg-surface px-3 py-2.5 shadow-xs md:px-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-start gap-2.5">
            <button
              type="button"
              onClick={() => navigate("/courses")}
              aria-label="Quay lại danh sách khóa học"
              title="Quay lại danh sách khóa học"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <ArrowLeft size={18} weight="bold" />
            </button>

            <div className="min-w-0 pt-0.5">
              <h1 className="truncate font-display text-xl font-bold tracking-tight text-on-surface md:text-2xl" title={course.name}>
                {course.name}
              </h1>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-on-surface-variant">
                <span className="rounded-md bg-primary-container/20 px-2 py-0.5 font-mono text-[11px] font-bold text-primary">
                  {course.code}
                </span>
                <StatusBadge value={course.status}>{classStatusLabel[course.status]}</StatusBadge>
                {!course.isActive && (
                  <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                    Đã ngừng
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  {course.skillPair === "LISTENING_READING" ? <BookOpen size={15} /> : <Microphone size={15} />}
                  {skillPairLabel[course.skillPair]}
                </span>
                <span className="hidden items-center gap-1.5 sm:flex">
                  <CalendarBlank size={15} /> {date(course.startsOn)} đến {date(course.endsOn)}
                </span>
                <span className="flex items-center gap-1.5 tabular-nums">
                  <UsersThree size={15} /> {roster.length}/{course.capacity} học viên
                </span>
                <span className="hidden items-center gap-1.5 tabular-nums sm:flex">
                  <Clock size={15} /> {completed}/{sessions.length} session
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:shrink-0">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            aria-label="Chỉnh sửa khóa học"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant/60 bg-surface px-3.5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <PencilSimple size={18} weight="bold" />
            <span className="hidden sm:inline">Chỉnh sửa</span>
          </button>

          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            aria-label={course.isActive ? "Ngừng hoạt động hoặc xóa khóa học" : "Khôi phục khóa học"}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3.5 text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              course.isActive
                ? "border-outline-variant/60 bg-surface text-on-surface-variant hover:text-error hover:border-error/40 hover:bg-error-container/10"
                : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
            }`}
          >
            {course.isActive ? <Trash size={18} /> : <ArrowCounterClockwise size={18} />}
            <span className="hidden sm:inline">{course.isActive ? "Ngừng / Xóa" : "Khôi phục"}</span>
          </button>

          <button
            type="button"
            onClick={() => setEnrollmentOpen(true)}
            aria-label="Ghi danh học viên"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary transition-colors hover:bg-on-primary-container focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <Plus size={18} weight="bold" /> <span className="hidden sm:inline">Ghi danh</span>
          </button>
        </div>
        </div>
      </header>

      <nav aria-label="Chức năng khóa học" className="flex gap-1 overflow-x-auto border-b border-outline-variant/40">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-bold transition-colors ${
                activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {activeTab === "overview" && <CourseOverview course={course} selectedClass={course} roster={roster} setTab={setTab} onSelectStudent={openStudentProfile} />}
      {activeTab === "schedule" && <CourseSchedule courseId={course.id} skillPair={course.skillPair} />}
      {activeTab === "students" && <CourseStudents courseId={course.id} skillPair={course.skillPair} roster={roster} onSelectStudent={openStudentProfile} onRosterChanged={load} />}
      {activeTab === "attendance" && <CourseAttendance courseId={course.id} roster={roster} onSelectStudent={openStudentProfile} />}
      {activeTab === "progress" && <CourseProgress courseId={course.id} skillPair={course.skillPair} roster={roster} onSelectStudent={openStudentProfile} />}
      {activeTab === "matrix" && <CourseMatrix courseId={course.id} roster={roster} />}
      {activeTab === "library" && <CourseLibrary courseId={course.id} />}

      <CourseEnrollmentModal course={course} enrollments={enrollments} open={enrollmentOpen} onClose={() => setEnrollmentOpen(false)} onSaved={load} />

      <CourseEditModal
        course={course}
        currentEnrollmentsCount={roster.length}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={load}
      />

      <CourseDeleteModal
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
      />
    </section>
  );
}

export function CourseManagementPage() {
  return useParams().courseId ? <Workspace /> : <CourseList />;
}

