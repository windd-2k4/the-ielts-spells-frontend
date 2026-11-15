import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowClockwise,
  ArrowUpRight,
  BookOpenText,
  ChalkboardTeacher,
  CheckCircle,
  Exam,
  Files,
  Gauge,
  NotePencil,
  Users,
  WarningCircle,
} from "@phosphor-icons/react";
import SystemAnalyticsCharts from "../components/dashboard/SystemAnalyticsCharts";
import {
  getAdminDashboard,
  getContentHubDashboard,
  type AdminDashboard,
  type ContentHubDashboard,
} from "../lib/dashboard-api";

export function DashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [contentHub, setContentHub] = useState<ContentHubDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [contentError, setContentError] = useState(false);
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const load = useCallback(async (manual = false) => {
    manual ? setRefreshing(true) : setLoading(true);
    setError("");
    setContentError(false);

    try {
      const [dashboardResult, contentResult] = await Promise.all([
        getAdminDashboard(timeRange, selectedCourseId || undefined),
        getContentHubDashboard().catch(() => null),
      ]);
      setDashboard(dashboardResult);
      setContentHub(contentResult);
      setContentError(contentResult === null);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không tải được dữ liệu tổng quan");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCourseId, timeRange]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalAttempts = useMemo(
    () => dashboard?.trend.points.reduce((sum, point) => sum + point.completedAttempts, 0) ?? 0,
    [dashboard?.trend.points],
  );
  const updatedAt = dashboard
    ? new Date(dashboard.updatedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className="min-h-full bg-[#F8F6FA] p-4 text-on-surface lg:h-full lg:min-h-0">
      <div className="mx-auto flex min-h-full max-w-[1680px] flex-col gap-3 lg:h-full lg:min-h-0">
        <header className="flex shrink-0 flex-col gap-3 border-b border-outline-variant/60 pb-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-on-surface">
              Tổng quan học thuật
            </h1>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              Theo dõi học viên, lớp học, bài làm và kho học liệu từ dữ liệu hệ thống.
              {updatedAt ? ` Cập nhật lúc ${updatedAt}.` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="dashboard-range">Khoảng thời gian</label>
            <select
              id="dashboard-range"
              value={timeRange}
              onChange={(event) => setTimeRange(event.target.value)}
              className="h-10 rounded-md border-outline-variant bg-surface px-3 text-xs font-semibold text-on-surface focus:border-primary focus:ring-primary/20"
            >
              <option value="7d">7 ngày qua</option>
              <option value="30d">30 ngày qua</option>
              <option value="all">Toàn thời gian</option>
            </select>

            <label className="sr-only" htmlFor="dashboard-course">Khóa học</label>
            <select
              id="dashboard-course"
              value={selectedCourseId}
              onChange={(event) => setSelectedCourseId(event.target.value)}
              className="h-10 min-w-48 rounded-md border-outline-variant bg-surface px-3 text-xs font-semibold text-on-surface focus:border-primary focus:ring-primary/20"
            >
              <option value="">Tất cả khóa học</option>
              {dashboard?.courseFilterOptions.map((course) => (
                <option key={course.id} value={course.id}>{course.code} · {course.name}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void load(true)}
              disabled={loading || refreshing}
              className="grid size-10 place-items-center rounded-md border border-outline-variant bg-surface text-primary transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50"
              aria-label="Làm mới dữ liệu"
              title="Làm mới dữ liệu"
            >
              <ArrowClockwise aria-hidden="true" size={19} weight="bold" className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        {loading && !dashboard && <DashboardSkeleton />}

        {error && (
          <div className="flex items-center justify-between gap-4 rounded-md border border-error/30 bg-error-container/30 p-4 text-sm text-error" role="alert">
            <span className="flex items-center gap-2 font-semibold">
              <WarningCircle aria-hidden="true" size={20} weight="bold" />
              {error}
            </span>
            <button type="button" onClick={() => void load()} className="font-bold underline underline-offset-4">
              Thử lại
            </button>
          </div>
        )}

        {dashboard && (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <section aria-label="Chỉ số học thuật chính" className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                icon={Users}
                label="Học viên đang học"
                value={dashboard.kpis.activeStudents.formattedValue}
                note="Ghi danh đang hoạt động"
                to="/students"
              />
              <MetricCard
                icon={ChalkboardTeacher}
                label="Lớp đang vận hành"
                value={`${dashboard.activeCourses}/${dashboard.totalCourses}`}
                note={`${dashboard.openCourses} lớp đang mở hoặc hoạt động`}
                to="/courses"
              />
              <MetricCard
                icon={Gauge}
                label="Chuyên cần trung bình"
                value={dashboard.kpis.averageAttendanceRate.formattedValue}
                note={dashboard.kpis.averageAttendanceRate.tooltip}
                to="/courses"
              />
              <MetricCard
                icon={NotePencil}
                label="Bài đang chờ chấm"
                value={dashboard.kpis.pendingGradingCount.formattedValue}
                note="Writing và Speaking cần xử lý"
                to="/writing-evaluations"
                emphasis={dashboard.kpis.pendingGradingCount.value > 0}
              />
            </section>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-12">
              <div className="min-h-0 lg:col-span-8">
                <SystemAnalyticsCharts
                  trendPoints={dashboard.trend.points}
                  benchmarkScore={dashboard.trend.benchmarkTargetScore}
                  totalAttempts={totalAttempts}
                />
              </div>
              <AcademicInventory
                data={contentHub?.summary ?? null}
                unavailable={contentError}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type MetricIcon = typeof Users;

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  to,
  emphasis = false,
}: {
  icon: MetricIcon;
  label: string;
  value: string;
  note: string;
  to: string;
  emphasis?: boolean;
}) {
  return (
    <Link
      to={to}
      className="group flex min-h-[92px] items-start gap-3 rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3.5 shadow-[0_8px_22px_rgba(91,49,63,0.04)] transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon aria-hidden="true" size={19} weight="bold" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-on-surface-variant">{label}</span>
        <span className={`mt-1 block text-xl font-extrabold tabular-nums tracking-tight ${emphasis ? "text-primary" : "text-on-surface"}`}>
          {value}
        </span>
        <span className="mt-1 line-clamp-1 block text-[11px] leading-4 text-on-surface-variant">{note}</span>
      </span>
      <ArrowUpRight aria-hidden="true" size={16} className="text-outline transition-colors group-hover:text-primary" />
    </Link>
  );
}

function AcademicInventory({
  data,
  unavailable,
}: {
  data: ContentHubDashboard["summary"] | null;
  unavailable: boolean;
}) {
  const segments = data ? [
    { label: "Tài liệu", value: data.resources, icon: BookOpenText, color: "#894C5B" },
    { label: "Đề thi", value: data.tests, icon: Exam, color: "#C85F78" },
    { label: "Tệp media", value: data.media, icon: Files, color: "#D6C2C4" },
  ] : [];
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  let offset = 0;

  return (
    <section className="flex min-h-[360px] flex-col rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-[0_8px_22px_rgba(91,49,63,0.04)] lg:col-span-4 lg:min-h-0">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-outline-variant/40 pb-3">
        <div>
          <h2 className="font-display text-base font-bold text-on-surface">Cơ cấu học liệu</h2>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">Nội dung học thuật đang lưu trên hệ thống</p>
        </div>
        <Link to="/library" className="text-xs font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
          Xem kho
        </Link>
      </div>

      {unavailable ? (
        <div className="grid flex-1 place-items-center text-center">
          <div>
            <WarningCircle aria-hidden="true" size={26} className="mx-auto text-outline" />
            <p className="mt-2 text-sm font-bold text-on-surface">Không tải được kho học liệu</p>
            <p className="mt-1 text-xs text-on-surface-variant">Các chỉ số khác vẫn được cập nhật bình thường.</p>
          </div>
        </div>
      ) : data ? (
        <div className="flex min-h-0 flex-1 flex-col justify-between pt-2">
          <div className="mx-auto grid min-h-0 flex-1 place-items-center">
            <div className="relative aspect-square w-36">
              <svg viewBox="0 0 100 100" className="size-full -rotate-90" role="img" aria-label={`Tổng ${total} mục học liệu`}>
                <circle cx="50" cy="50" r="39" fill="none" stroke="#F2ECEE" strokeWidth="13" />
                {total > 0 && segments.map((segment) => {
                  const percentage = segment.value / total * 100;
                  const currentOffset = offset;
                  offset += percentage;
                  return (
                    <circle
                      key={segment.label}
                      cx="50"
                      cy="50"
                      r="39"
                      fill="none"
                      pathLength="100"
                      stroke={segment.color}
                      strokeWidth="13"
                      strokeDasharray={`${percentage} ${100 - percentage}`}
                      strokeDashoffset={-currentOffset}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 grid place-content-center text-center">
                <strong className="text-3xl font-extrabold tabular-nums text-on-surface">{total}</strong>
                <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">Nội dung</span>
              </div>
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-3 gap-2 border-t border-outline-variant/40 pt-3">
            {segments.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="min-w-0">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-on-surface-variant">
                  <Icon aria-hidden="true" size={13} style={{ color }} />
                  <span className="truncate">{label}</span>
                </span>
                <strong className="mt-1 block text-base font-extrabold tabular-nums text-on-surface">{value}</strong>
              </div>
            ))}
          </div>

          <div className="mt-3 grid shrink-0 grid-cols-2 divide-x divide-outline-variant/50 rounded-md bg-surface-container-low py-2.5">
            <div className="px-3">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-on-surface-variant">
                <CheckCircle aria-hidden="true" size={14} className="text-primary" /> Đang sử dụng
              </span>
              <strong className="mt-0.5 block text-sm font-extrabold tabular-nums text-on-surface">{data.inUse}</strong>
            </div>
            <div className="px-3">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-on-surface-variant">
                <WarningCircle aria-hidden="true" size={14} className="text-primary" /> Chờ rà soát
              </span>
              <strong className="mt-0.5 block text-sm font-extrabold tabular-nums text-on-surface">{data.awaitingReview}</strong>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 animate-pulse bg-surface-container-low" aria-label="Đang tải kho học liệu" />
      )}
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3" aria-label="Đang tải dữ liệu dashboard">
      <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-[92px] animate-pulse rounded-lg bg-surface-container" />)}
      </div>
      <div className="min-h-80 flex-1 animate-pulse rounded-lg bg-surface-container" />
    </div>
  );
}
