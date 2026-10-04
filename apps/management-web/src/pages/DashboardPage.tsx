import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowClockwise,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  CalendarBlank,
  CalendarCheck,
  CaretRight,
  CheckCircle,
  Clock,
  DownloadSimple,
  Info,
  Lightning,
  PencilSimpleLine,
  Receipt,
  TrendUp,
  UserPlus,
  Users,
  VideoCamera,
  WarningCircle,
  WarningOctagon,
} from "@phosphor-icons/react";
import { classStatusLabel } from "../academic-types";
import {
  getAdminDashboard,
  type ActionItem,
  type AdminDashboard,
  type KpiMetric,
  type TrendPoint,
} from "../lib/dashboard-api";

type TrendMetricType = "score" | "attempts" | "attendance";
type SkillFilterType = "ALL" | "READING" | "LISTENING" | "WRITING" | "SPEAKING";

export function DashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [timeRange, setTimeRange] = useState<string>("7d");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  // Trend Chart State
  const [trendMetric, setTrendMetric] = useState<TrendMetricType>("score");
  const [selectedSkill, setSelectedSkill] = useState<SkillFilterType>("ALL");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Last update timestamp
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");

  const load = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      try {
        const data = await getAdminDashboard(timeRange, selectedCourseId || undefined);
        setDashboard(data);
        setLastUpdatedTime(
          new Date(data.updatedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
        );
      } catch (value) {
        setError(value instanceof Error ? value.message : "Không tải được tổng quan vận hành");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [timeRange, selectedCourseId]
  );

  useEffect(() => {
    void load();
  }, [load]);

  // Export report
  const handleExportReport = () => {
    if (!dashboard) return;
    const reportData = {
      exportedAt: new Date().toISOString(),
      timeRange,
      selectedCourseId: selectedCourseId || "ALL",
      kpis: dashboard.kpis,
      actionItems: dashboard.actionItems,
      coursePerformances: dashboard.coursePerformances,
      atRiskStudentsCount: dashboard.atRiskStudents.length,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bao-cao-van-hanh-${timeRange}-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Trend data points
  const trendPoints: TrendPoint[] = useMemo(() => {
    return dashboard?.trend.points ?? [];
  }, [dashboard?.trend.points]);
  const chartPoints = useMemo(
    () => trendPoints.filter((point) => {
      const value = trendPointValue(point, trendMetric, selectedSkill);
      return value !== null && (trendMetric !== "attempts" || value > 0);
    }),
    [selectedSkill, trendMetric, trendPoints]
  );

  useEffect(() => {
    setHoveredPointIndex(null);
  }, [selectedSkill, trendMetric]);

  // Priority badge styling
  const getPriorityStyle = (priority: ActionItem["priority"]) => {
    switch (priority) {
      case "HIGH":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300";
      case "MEDIUM":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300";
      default:
        return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300";
    }
  };

  const getPriorityLabel = (priority: ActionItem["priority"]) => {
    switch (priority) {
      case "HIGH":
        return "Ưu tiên cao";
      case "MEDIUM":
        return "Cần xử lý";
      default:
        return "Theo dõi";
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header & Unified Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary mb-1 block">
            Hệ thống Quản trị EdTech
          </span>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-on-surface">
            Tổng quan vận hành
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Theo dõi thời gian thực về tuyển sinh, chuyên cần, bài tập chờ chấm và lịch đào tạo.
          </p>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Time range selector */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
              calendar_today
            </span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-xl border border-outline-variant/60 bg-surface text-sm font-semibold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm"
              aria-label="Khoảng thời gian"
            >
              <option value="today">Hôm nay</option>
              <option value="7d">7 ngày qua</option>
              <option value="30d">30 ngày qua</option>
              <option value="all">Toàn thời gian</option>
            </select>
          </div>

          {/* Course filter selector */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
              filter_alt
            </span>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-xl border border-outline-variant/60 bg-surface text-sm font-semibold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm max-w-[220px] truncate"
              aria-label="Khóa học"
            >
              <option value="">Tất cả khóa học</option>
              {dashboard?.courseFilterOptions?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Last updated indicator & Refresh button */}
          <div className="flex items-center gap-2 pl-1 border-l border-outline-variant/30">
            {lastUpdatedTime && (
              <span className="text-xs text-on-surface-variant hidden sm:inline">
                Cập nhật lúc <span className="font-semibold text-on-surface">{lastUpdatedTime}</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => void load(true)}
              disabled={refreshing || loading}
              className="p-2 rounded-xl border border-outline-variant/60 bg-surface hover:bg-surface-container-high text-on-surface transition-colors shadow-sm disabled:opacity-50"
              title="Làm mới dữ liệu"
              aria-label="Làm mới dữ liệu"
            >
              <ArrowClockwise
                size={18}
                weight="bold"
                className={refreshing ? "animate-spin text-primary" : ""}
              />
            </button>
            <button
              type="button"
              onClick={handleExportReport}
              disabled={!dashboard}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-outline-variant/60 bg-surface hover:bg-surface-container-high text-on-surface text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
              title="Xuất báo cáo tổng quan"
            >
              <DownloadSimple size={16} weight="bold" />
              <span className="hidden md:inline">Xuất báo cáo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton State */}
      {loading && !dashboard && (
        <div className="space-y-6" aria-label="Đang tải dữ liệu...">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-surface border border-outline-variant/30 animate-pulse"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-96 rounded-2xl bg-surface border border-outline-variant/30 animate-pulse" />
            <div className="h-96 rounded-2xl bg-surface border border-outline-variant/30 animate-pulse" />
          </div>
        </div>
      )}

      {/* Error Retry State */}
      {error && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50/80 dark:bg-rose-950/20 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-rose-800 dark:text-rose-300">
            <WarningCircle size={28} weight="duotone" className="shrink-0 text-rose-600" />
            <div>
              <h4 className="font-bold text-sm">Không thể tải dữ liệu tổng quan</h4>
              <p className="text-xs text-rose-700/80 dark:text-rose-400 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="px-4 py-2 rounded-xl bg-rose-700 text-white font-semibold text-xs hover:bg-rose-800 transition-colors shrink-0"
          >
            Thử lại
          </button>
        </div>
      )}

      {dashboard && (
        <>
          {/* 2. Executive KPIs (5-6 Metric Cards) */}
          <section aria-label="Chỉ số điều hành">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* KPI 1: Active students */}
              <Link
                to={dashboard.kpis.activeStudents.targetRoute}
                title={dashboard.kpis.activeStudents.tooltip}
                className="group p-4 bg-surface rounded-2xl border border-outline-variant/30 shadow-sm hover:border-primary/60 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface-variant">
                    Học viên đang học
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Users size={17} weight="duotone" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl lg:text-3xl font-extrabold text-on-surface tracking-tight">
                    {dashboard.kpis.activeStudents.formattedValue}
                  </div>
                  <MetricChange metric={dashboard.kpis.activeStudents} fallback="Đang ghi danh" />
                </div>
              </Link>

              {/* KPI 2: Pending leads */}
              <Link
                to={dashboard.kpis.pendingLeads.targetRoute}
                title={dashboard.kpis.pendingLeads.tooltip}
                className="group p-4 bg-surface rounded-2xl border border-outline-variant/30 shadow-sm hover:border-primary/60 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface-variant">
                    Tuyển sinh chờ TV
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <UserPlus size={17} weight="duotone" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl lg:text-3xl font-extrabold text-on-surface tracking-tight">
                    {dashboard.kpis.pendingLeads.formattedValue}
                  </div>
                  <MetricChange metric={dashboard.kpis.pendingLeads} fallback="Đang chờ liên hệ" neutral />
                </div>
              </Link>

              {/* KPI 3: Lead conversion rate */}
              <Link
                to={dashboard.kpis.leadConversionRate.targetRoute}
                title={dashboard.kpis.leadConversionRate.tooltip}
                className="group p-4 bg-surface rounded-2xl border border-outline-variant/30 shadow-sm hover:border-primary/60 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface-variant">
                    Tỷ lệ chuyển đổi
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                    <TrendUp size={17} weight="duotone" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl lg:text-3xl font-extrabold text-on-surface tracking-tight">
                    {dashboard.kpis.leadConversionRate.formattedValue}
                  </div>
                  <MetricChange metric={dashboard.kpis.leadConversionRate} fallback="Lead tạo trong kỳ" />
                </div>
              </Link>

              {/* KPI 4: Attendance rate */}
              <Link
                to={dashboard.kpis.averageAttendanceRate.targetRoute}
                title={dashboard.kpis.averageAttendanceRate.tooltip}
                className="group p-4 bg-surface rounded-2xl border border-outline-variant/30 shadow-sm hover:border-primary/60 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface-variant">
                    Chuyên cần TB
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                    <CalendarCheck size={17} weight="duotone" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl lg:text-3xl font-extrabold text-on-surface tracking-tight">
                    {dashboard.kpis.averageAttendanceRate.formattedValue}
                  </div>
                  <MetricChange
                    metric={dashboard.kpis.averageAttendanceRate}
                    fallback={dashboard.kpis.averageAttendanceRate.formattedValue === "—" ? "Chưa có điểm danh" : "Trong kỳ đã chọn"}
                  />
                </div>
              </Link>

              {/* KPI 5: Pending grading */}
              <Link
                to={dashboard.kpis.pendingGradingCount.targetRoute}
                title={dashboard.kpis.pendingGradingCount.tooltip}
                className="group p-4 bg-surface rounded-2xl border border-outline-variant/30 shadow-sm hover:border-primary/60 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface-variant">
                    Bài cần chấm
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                    <PencilSimpleLine size={17} weight="duotone" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl lg:text-3xl font-extrabold text-on-surface tracking-tight">
                    {dashboard.kpis.pendingGradingCount.formattedValue}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-rose-600">
                    <span>Writing / Speaking</span>
                  </div>
                </div>
              </Link>

              {/* KPI 6: Overdue invoices */}
              <Link
                to={dashboard.kpis.overdueInvoicesCount.targetRoute}
                title={dashboard.kpis.overdueInvoicesCount.tooltip}
                className="group p-4 bg-surface rounded-2xl border border-outline-variant/30 shadow-sm hover:border-primary/60 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface-variant">
                    Đơn học phí quá hạn
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <Receipt size={17} weight="duotone" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl lg:text-3xl font-extrabold text-on-surface tracking-tight">
                    {dashboard.kpis.overdueInvoicesCount.formattedValue}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-amber-700">
                    <span>Cần đối soát</span>
                  </div>
                </div>
              </Link>
            </div>
          </section>

          {/* 3. Hero Bento Grid: VIỆC CẦN XỬ LÝ (Nổi bật nhất) + XU HƯỚNG HỌC TẬP */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 7 Columns on Desktop: XU HƯỚNG HỌC TẬP (Interactive Line Chart) */}
            <div className="lg:col-span-7 bg-surface rounded-2xl border border-outline-variant/30 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 font-display">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                      Xu hướng học tập
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Phân tích kết quả làm bài và độ chuyên cần theo thời gian
                    </p>
                  </div>

                  {/* Metric Toggle Tabs */}
                  <div className="flex items-center bg-surface-container rounded-xl p-1 border border-outline-variant/20 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setTrendMetric("score")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        trendMetric === "score"
                          ? "bg-surface text-primary shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      Điểm số
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrendMetric("attempts")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        trendMetric === "attempts"
                          ? "bg-surface text-primary shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      Bài nộp
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrendMetric("attendance")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        trendMetric === "attendance"
                          ? "bg-surface text-primary shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      Chuyên cần
                    </button>
                  </div>
                </div>

                {/* Skill Filter Pills (Active only for score mode) */}
                {trendMetric === "score" && (
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="text-xs font-semibold text-on-surface-variant mr-1">
                      Kỹ năng:
                    </span>
                    {(["ALL", "READING", "LISTENING", "WRITING", "SPEAKING"] as SkillFilterType[]).map(
                      (skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => setSelectedSkill(skill)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                            selectedSkill === skill
                              ? "bg-primary text-white"
                              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                          }`}
                        >
                          {skill === "ALL" ? "Tất cả" : skill}
                        </button>
                      )
                    )}
                    {dashboard.trend.benchmarkTargetScore !== null && (
                      <span className="ml-auto text-xs text-on-surface-variant flex items-center gap-1.5">
                        <span className="w-3 h-0.5 border-t-2 border-dashed border-rose-500 inline-block" />
                        Mục tiêu hồ sơ TB ({dashboard.trend.benchmarkTargetScore.toFixed(1)})
                      </span>
                    )}
                  </div>
                )}

                {/* High-Fidelity Interactive SVG Line Chart */}
                <div className="h-64 w-full relative">
                  {chartPoints.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-on-surface-variant">
                      <Info size={32} weight="duotone" className="mb-2 text-outline" />
                      <p className="text-sm font-semibold">
                        {trendMetric === "attendance" ? "Chưa có dữ liệu điểm danh trong kỳ này" : "Chưa có dữ liệu bài làm trong kỳ này"}
                      </p>
                      <p className="text-xs mt-0.5">
                        {trendMetric === "attendance" ? "Dữ liệu sẽ xuất hiện sau khi khóa học được điểm danh." : "Dữ liệu sẽ xuất hiện khi học viên hoàn thành bài làm."}
                      </p>
                    </div>
                  ) : (
                    <InteractiveLineChart
                      points={chartPoints}
                      metric={trendMetric}
                      skill={selectedSkill}
                      benchmarkScore={dashboard.trend.benchmarkTargetScore}
                      hoveredIndex={hoveredPointIndex}
                      onHover={setHoveredPointIndex}
                    />
                  )}
                </div>
              </div>

              {/* Bottom Chart Footer Legend */}
              <div className="pt-4 mt-2 border-t border-outline-variant/20 flex flex-wrap items-center justify-between text-xs text-on-surface-variant gap-2">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    {trendMetric === "score"
                      ? "Điểm trung bình quy đổi (thang 0–9)"
                      : trendMetric === "attempts"
                      ? "Tổng số lượt nộp bài"
                      : "Tỷ lệ chuyên cần (%)"}
                  </span>
                </div>
                <span>
                  <strong className="text-on-surface">
                    {trendMetric === "attendance"
                      ? `${chartPoints.length} ngày có điểm danh`
                      : `${trendPoints.reduce((acc, p) => acc + p.completedAttempts, 0)} lượt làm bài`}
                  </strong>
                </span>
              </div>
            </div>

            {/* Right 5 Columns on Desktop: VIỆC CẦN XỬ LÝ (Highlighted Area) */}
            <div className="lg:col-span-5 bg-surface rounded-2xl border-2 border-primary/20 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
                      <Lightning size={16} weight="fill" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-on-surface font-display leading-tight">
                        Việc cần xử lý
                      </h3>
                      <p className="text-xs text-on-surface-variant">Sắp xếp theo mức độ ưu tiên</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-primary/10 text-primary">
                    {dashboard.actionItems.length} nhiệm vụ
                  </span>
                </div>

                {/* Action Items List */}
                <div className="space-y-3">
                  {dashboard.actionItems.length === 0 ? (
                    <div className="py-12 text-center text-on-surface-variant flex flex-col items-center">
                      <CheckCircle size={38} weight="duotone" className="text-emerald-500 mb-2" />
                      <p className="text-sm font-bold text-on-surface">Mọi việc đã được xử lý xong!</p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Hiện không có hồ sơ hay bài tập nào tồn đọng.
                      </p>
                    </div>
                  ) : (
                    dashboard.actionItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl border bg-surface-container-lowest/60 hover:bg-surface-container-lowest border-outline-variant/30 hover:border-primary/40 transition-all flex items-start justify-between gap-3 group"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getPriorityStyle(
                                item.priority
                              )}`}
                            >
                              {getPriorityLabel(item.priority)}
                            </span>
                            {item.deadlineNote && (
                              <span className="text-[11px] text-on-surface-variant flex items-center gap-1 font-medium">
                                <Clock size={12} />
                                {item.deadlineNote}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors leading-snug">
                            {item.title}
                          </h4>
                          <p className="text-xs text-on-surface-variant line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                        <Link
                          to={item.ctaRoute}
                          className="shrink-0 mt-1 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                        >
                          <span>{item.ctaLabel}</span>
                          <CaretRight size={13} weight="bold" />
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bottom Quick Help */}
              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
                <span>Cần hỗ trợ vận hành?</span>
                <Link to="/students?tab=leads" className="text-primary font-semibold hover:underline">
                  Quản lý tuyển sinh &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* 4. Second Row: LỊCH VẬN HÀNH 7 NGÀY TỚI + HỌC VIÊN CẦN LƯU Ý */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Lịch vận hành 7 ngày tới (7 Columns) */}
            <div className="lg:col-span-7 bg-surface rounded-2xl border border-outline-variant/30 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <CalendarBlank size={20} weight="duotone" className="text-primary" />
                  <h3 className="text-lg font-bold text-on-surface font-display">
                    Lịch vận hành 7 ngày tới
                  </h3>
                </div>
                <Link to="/courses" className="text-xs font-bold text-primary hover:underline">
                  Quản lý lịch học &rarr;
                </Link>
              </div>

              <div className="space-y-3">
                {dashboard.scheduleEvents.length === 0 ? (
                  <div className="py-8 text-center text-on-surface-variant text-sm">
                    Không có lịch học hoặc khai giảng trong 7 ngày tới.
                  </div>
                ) : (
                  dashboard.scheduleEvents.map((evt) => {
                    const startDate = new Date(evt.startsAt);
                    const dayName = startDate.toLocaleDateString("vi-VN", { weekday: "short" });
                    const dateStr = startDate.toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                    });
                    const timeStr = startDate.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={evt.id}
                        className="p-3.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest/50 hover:border-primary/40 transition-colors flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-14 shrink-0 rounded-xl bg-primary/10 text-primary py-2 px-1 text-center font-bold">
                            <div className="text-[11px] uppercase tracking-wider text-on-surface-variant">
                              {dayName}
                            </div>
                            <div className="text-sm font-extrabold leading-tight">{dateStr}</div>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  evt.eventType === "COURSE_START"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {evt.eventType === "COURSE_START" ? "Khai giảng" : "Buổi học"}
                              </span>
                              <span className="text-xs text-on-surface-variant font-semibold">
                                {timeStr}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-on-surface truncate mt-0.5">
                              {evt.title}
                            </h4>
                            <p className="text-xs text-on-surface-variant truncate">
                              Lớp: <strong className="text-on-surface">{evt.courseCode}</strong>
                              {evt.teacherName && (
                                <span className="ml-2">| GV: {evt.teacherName}</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {evt.locationOrZoom && /^https?:\/\//i.test(evt.locationOrZoom) && (
                          <a
                            href={evt.locationOrZoom}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 p-2 rounded-xl bg-surface border border-outline-variant/40 hover:border-primary text-primary transition-colors"
                            title="Vào phòng Zoom"
                          >
                            <VideoCamera size={18} weight="duotone" />
                          </a>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Học viên cần lưu ý (5 Columns) */}
            <div className="lg:col-span-5 bg-surface rounded-2xl border border-outline-variant/30 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <WarningOctagon size={20} weight="duotone" className="text-amber-600" />
                  <h3 className="text-lg font-bold text-on-surface font-display">
                    Học viên cần lưu ý
                  </h3>
                </div>
                <Link to="/students" className="text-xs font-bold text-primary hover:underline">
                  Xem tất cả &rarr;
                </Link>
              </div>

              <div className="space-y-3">
                {dashboard.atRiskStudents.length === 0 ? (
                  <div className="py-8 text-center text-on-surface-variant text-sm">
                    Tất cả học viên đang duy trì tiến độ học tập tốt.
                  </div>
                ) : (
                  dashboard.atRiskStudents.map((st) => (
                    <div
                      key={`${st.studentId}-${st.courseCode}`}
                      className="p-3.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest/50 hover:border-amber-400 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-700 font-extrabold flex items-center justify-center text-xs shrink-0">
                          {st.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-on-surface truncate">
                            {st.fullName}
                          </h4>
                          <p className="text-xs text-on-surface-variant truncate">
                            Lớp: {st.courseCode} | {st.studentCode}
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            {st.riskReason}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {st.targetBand && (
                          <div className="text-xs font-bold text-primary">
                            Mục tiêu: {st.targetBand}
                          </div>
                        )}
                        <Link
                          to={st.profileRoute}
                          className="mt-1 inline-flex items-center text-xs font-semibold text-primary hover:underline"
                        >
                          Hồ sơ &rarr;
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 5. Bottom Table: HIỆU QUẢ KHÓA HỌC */}
          <section className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-on-surface font-display flex items-center gap-2">
                  <BookOpen size={20} weight="duotone" className="text-primary" />
                  Hiệu quả khóa học & lớp vận hành
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Theo dõi tỷ lệ tuyển sinh, chuyên cần và tiến trình đào tạo từng lớp
                </p>
              </div>
              <Link to="/courses" className="text-xs font-bold text-primary hover:underline">
                Quản lý khóa học &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-outline-variant/30 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    <th className="py-3 px-3">Khóa học / Lớp</th>
                    <th className="py-3 px-3">Sĩ số / Sức chứa</th>
                    <th className="py-3 px-3">Chuyên cần</th>
                    <th className="py-3 px-3">Tiến độ buổi</th>
                    <th className="py-3 px-3">Điểm TB</th>
                    <th className="py-3 px-3">Trạng thái</th>
                    <th className="py-3 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-sm">
                  {dashboard.coursePerformances.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-on-surface-variant text-sm">
                        Chưa có dữ liệu khóa học.
                      </td>
                    </tr>
                  ) : (
                    dashboard.coursePerformances.map((c) => {
                      const fillRate =
                        c.capacity > 0 ? Math.round((c.currentEnrollments / c.capacity) * 100) : 0;

                      return (
                        <tr key={c.courseId} className="hover:bg-surface-container-lowest/70 transition-colors">
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-on-surface">{c.courseName}</div>
                            <div className="text-xs text-on-surface-variant font-mono">
                              {c.courseCode}
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="font-semibold text-on-surface">
                              {c.currentEnrollments} / {c.capacity} học viên
                            </div>
                            <div className="w-24 h-1.5 rounded-full bg-surface-container mt-1 overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${Math.min(100, fillRate)}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                                c.attendanceRate === null
                                  ? "bg-surface-container text-on-surface-variant"
                                  : c.attendanceRate >= 80
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {c.attendanceRate === null ? "Chưa điểm danh" : `${c.attendanceRate}%`}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-semibold text-on-surface">
                              {c.completionProgress}% hoàn thành
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-primary font-mono">
                              {c.averageScore !== null ? c.averageScore.toFixed(1) : "—"}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-surface-container text-on-surface border border-outline-variant/30">
                              {classStatusLabel[c.operationalStatus as keyof typeof classStatusLabel] ??
                                c.operationalStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <Link
                              to={`/courses/${c.courseId}`}
                              className="text-xs font-bold text-primary hover:underline"
                            >
                              Xem lớp &rarr;
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function MetricChange({
  metric,
  fallback,
  neutral = false,
}: {
  metric: KpiMetric;
  fallback: string;
  neutral?: boolean;
}) {
  if (metric.changePercent === null) {
    return <div className="mt-1 text-xs font-semibold text-on-surface-variant">{fallback}</div>;
  }

  const increasing = metric.changePercent > 0;
  const stable = metric.changePercent === 0;
  const Icon = increasing ? ArrowUpRight : ArrowDownRight;
  return (
    <div
      className={`flex items-center gap-1 mt-1 text-xs font-semibold ${
        neutral || stable
          ? "text-on-surface-variant"
          : increasing
          ? "text-emerald-600"
          : "text-rose-600"
      }`}
    >
      {!stable && <Icon size={14} weight="bold" />}
      <span>
        {stable ? "Không đổi so với kỳ trước" : `${Math.abs(metric.changePercent)}% so với kỳ trước`}
      </span>
    </div>
  );
}

function trendPointValue(
  point: TrendPoint,
  metric: TrendMetricType,
  skill: SkillFilterType
): number | null {
  if (metric === "attempts") return point.completedAttempts;
  if (metric === "attendance") return point.attendanceRate;
  if (skill === "READING") return point.readingScore;
  if (skill === "LISTENING") return point.listeningScore;
  if (skill === "WRITING") return point.writingScore;
  if (skill === "SPEAKING") return point.speakingScore;
  return point.averageScore;
}

// Interactive SVG Line Chart Component
interface LineChartProps {
  points: TrendPoint[];
  metric: TrendMetricType;
  skill: SkillFilterType;
  benchmarkScore: number | null;
  hoveredIndex: number | null;
  onHover: (index: number | null) => void;
}

function InteractiveLineChart({
  points,
  metric,
  skill,
  benchmarkScore,
  hoveredIndex,
  onHover,
}: LineChartProps) {
  const width = 640;
  const height = 230;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };

  // Calculate value for a point based on metric and skill
  const getValue = (point: TrendPoint) => trendPointValue(point, metric, skill) ?? 0;

  const values = points.map(getValue);
  const minVal = metric === "attendance" ? 0 : 0;
  const maxVal =
    metric === "attendance"
      ? 100
      : metric === "attempts"
      ? Math.max(10, Math.ceil(Math.max(...values, 5) * 1.2))
      : 9.0;

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (index: number) => {
    if (points.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (points.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    return padding.top + chartHeight - ((clamped - minVal) / (maxVal - minVal)) * chartHeight;
  };

  // Generate path string
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(getValue(p))}`)
    .join(" ");

  // Generate area fill path
  const areaD = `${pathD} L ${getX(points.length - 1)} ${padding.top + chartHeight} L ${getX(
    0
  )} ${padding.top + chartHeight} Z`;

  const benchmarkY = metric === "score" && benchmarkScore !== null ? getY(benchmarkScore) : null;

  return (
    <div className="relative w-full h-full select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        onMouseLeave={() => onHover(null)}
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#894c5b" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#894c5b" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines & Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const yVal = minVal + ratio * (maxVal - minVal);
          const y = getY(yVal);
          const label =
            metric === "attendance"
              ? `${Math.round(yVal)}%`
              : metric === "attempts"
              ? `${Math.round(yVal)}`
              : `${yVal.toFixed(1)}`;

          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#ded7da"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-on-surface-variant font-mono"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Target benchmark dashed line (Only in Score mode) */}
        {benchmarkY !== null && (
          <g>
            <line
              x1={padding.left}
              y1={benchmarkY}
              x2={width - padding.right}
              y2={benchmarkY}
              stroke="#e11d48"
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />
          </g>
        )}

        {/* Area Gradient Fill */}
        <path d={areaD} fill="url(#chartGradient)" />

        {/* Main Trend Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#894c5b"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points & hover triggers */}
        {points.map((p, i) => {
          const x = getX(i);
          const y = getY(getValue(p));
          const isHovered = hoveredIndex === i;

          return (
            <g key={p.dateLabel}>
              {/* Visible circle dot */}
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 6 : 3.5}
                className={`transition-all duration-150 ${
                  isHovered ? "fill-primary stroke-white stroke-2" : "fill-primary"
                }`}
              />

              {/* Large invisible circle for comfortable touch/mouse hover */}
              <circle
                cx={x}
                cy={y}
                r={16}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => onHover(i)}
              />

              {/* X-axis date labels */}
              {(i % Math.ceil(points.length / 6) === 0 || i === points.length - 1) && (
                <text
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  className="text-[10px] fill-on-surface-variant font-semibold"
                >
                  {p.dateLabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div
          className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full bg-on-surface text-surface py-1.5 px-3 rounded-xl shadow-lg text-xs"
          style={{
            left: `${(getX(hoveredIndex) / width) * 100}%`,
            top: `${(getY(getValue(points[hoveredIndex])) / height) * 100 - 8}%`,
          }}
        >
          <div className="font-bold">{points[hoveredIndex].dateLabel}</div>
          <div className="text-[11px] text-surface/80 mt-0.5">
            {metric === "score"
              ? `Điểm TB: ${getValue(points[hoveredIndex]).toFixed(2)}`
              : metric === "attempts"
              ? `${getValue(points[hoveredIndex])} bài nộp`
              : `Chuyên cần: ${getValue(points[hoveredIndex])}%`}
          </div>
          <div className="text-[10px] text-surface/60">
            {points[hoveredIndex].completedAttempts} lượt thi
          </div>
        </div>
      )}
    </div>
  );
}
