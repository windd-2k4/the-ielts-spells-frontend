import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpenText,
  CalendarBlank,
  ChartBar,
  ChartLineUp,
  CheckCircle,
  Clock,
  GraduationCap,
  Headphones,
  Minus,
  Microphone,
  PauseCircle,
  PenNib,
  Sparkle,
  SpinnerGap,
  Target,
  Trophy,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { Course, Enrollment, StudentLearningInsights } from "../../academic-types";
import { date, enrollmentStatusLabel, skillPairLabel } from "../../academic-types";

type Props = {
  insights: StudentLearningInsights | null;
  loading: boolean;
  error: string;
  enrollments: Enrollment[];
  courses: Course[];
  onRetry: () => void;
};

const ALL_SKILLS = ["LISTENING", "READING", "WRITING", "SPEAKING"] as const;

const skillMeta: Record<
  string,
  {
    label: string;
    strokeColor: string;
    bgBadge: string;
    barColor: string;
    icon: ReactNode;
  }
> = {
  LISTENING: {
    label: "Listening",
    strokeColor: "#f59e0b",
    bgBadge: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    barColor: "bg-amber-500",
    icon: <Headphones size={16} weight="duotone" />,
  },
  READING: {
    label: "Reading",
    strokeColor: "#6366f1",
    bgBadge: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    barColor: "bg-indigo-600",
    icon: <BookOpenText size={16} weight="duotone" />,
  },
  WRITING: {
    label: "Writing",
    strokeColor: "#f43f5e",
    bgBadge: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    barColor: "bg-rose-500",
    icon: <PenNib size={16} weight="duotone" />,
  },
  SPEAKING: {
    label: "Speaking",
    strokeColor: "#14b8a6",
    bgBadge: "bg-teal-500/10 text-teal-600 border-teal-500/20",
    barColor: "bg-teal-500",
    icon: <Microphone size={16} weight="duotone" />,
  },
};

export default function StudentProfileLearningOverview({ insights, loading, error, enrollments, courses, onRetry }: Props) {
  if (loading) return <OverviewSkeleton />;

  const currentCourses = enrollments
    .filter(item => ["ACTIVE", "PAUSED", "PENDING"].includes(item.status))
    .map(enrollment => ({ enrollment, course: courses.find(course => course.id === enrollment.courseId) }))
    .sort((a, b) => statusOrder(a.enrollment.status) - statusOrder(b.enrollment.status));

  if (error || !insights) {
    return (
      <section className="profile-enter profile-enter-delay-1 space-y-4" aria-labelledby="learning-journey-title">
        <JourneyHeader />
        <div className="grid gap-4 xl:grid-cols-2">
          <CurrentCourses courses={currentCourses} />
          <div className="grid min-h-64 place-content-center rounded-[22px] border border-dashed border-outline-variant/50 bg-surface p-8 text-center">
            <ChartBar className="mx-auto text-on-surface-variant" size={28} />
            <strong className="mt-3 block">Chưa tải được số liệu học tập</strong>
            <p className="mt-1 max-w-md text-sm text-on-surface-variant">Dữ liệu thời lượng, bài đã hoàn thành và xu hướng kết quả hiện chưa sẵn sàng.</p>
            <button type="button" onClick={onRetry} className="mx-auto mt-4 min-h-10 rounded-xl border border-primary/40 px-4 text-sm font-bold text-primary hover:bg-primary-container/15">
              Thử lại
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="profile-enter profile-enter-delay-1 space-y-4" aria-labelledby="learning-journey-title">
      <JourneyHeader />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] items-stretch">
        <div className="flex flex-col gap-4">
          <StudyTimeCard minutes={insights.summary.totalStudyMinutes ?? 0} inProgress={insights.summary.inProgressAttempts} />
          <CurrentCourses courses={currentCourses} />
        </div>
        <SkillDonut skills={insights.skills} total={insights.summary.completedAttempts} />
      </div>

      <AccuracyTrend attempts={insights.attempts} />
    </section>
  );
}

function JourneyHeader() {
  return (
    <header>
      <h2 id="learning-journey-title" className="font-display text-2xl font-bold tracking-tight">Tổng quan học tập & mục tiêu</h2>
    </header>
  );
}

function StudyTimeCard({ minutes, inProgress }: { minutes: number; inProgress: number }) {
  return (
    <article className="profile-saas-panel group relative overflow-hidden rounded-[20px] border p-5 md:p-6 transition-all duration-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Thời lượng học đã ghi nhận
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <strong className="font-display text-3xl sm:text-4xl font-black tabular-nums tracking-tight text-primary">
              {studyDuration(minutes)}
            </strong>
          </div>
          <p className="mt-1.5 text-xs text-on-surface-variant/80">
            Tổng hợp từ điểm danh lớp học và hoạt động học có dữ liệu thời gian.
          </p>
        </div>

        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-xs transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
          <Clock size={24} weight="duotone" />
        </div>
      </div>

      <div className="mt-4 pt-3.5 border-t border-outline-variant/20">
        {inProgress > 0 ? (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-300/80 bg-amber-50/80 px-3.5 py-2 text-xs text-amber-900 dark:bg-amber-950/25">
            <div className="flex items-center gap-2 font-medium">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
              <span>
                <strong className="font-bold">{inProgress}</strong> bài đang thực hiện dở
              </span>
            </div>
            <span className="rounded-md bg-amber-200/60 px-2 py-0.5 text-[11px] font-bold text-amber-800">
              Cần hoàn tất
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-3.5 py-2 text-xs text-emerald-800">
            <CheckCircle size={15} weight="fill" className="shrink-0 text-emerald-600" />
            <span className="font-medium">Đã hoàn thành toàn bộ bài tập đã giao</span>
          </div>
        )}
      </div>
    </article>
  );
}

function CurrentCourses({ courses }: { courses: Array<{ enrollment: Enrollment; course: Course | undefined }> }) {
  return (
    <section className="profile-saas-panel flex-1 flex flex-col justify-between rounded-[20px] border p-5 md:p-6 transition-all duration-300 hover:shadow-md" aria-labelledby="current-course-title">
      <div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 id="current-course-title" className="font-display text-lg font-bold text-on-surface">
              Khóa học đang tham gia
            </h3>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              Các lớp đang học, chờ xác nhận hoặc đang bảo lưu.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <GraduationCap size={14} weight="bold" />
            <span>{courses.length} khóa</span>
          </span>
        </div>

        {courses.length ? (
          <div className="mt-4 space-y-3">
            {courses.map(({ enrollment, course }) => (
              <article
                key={enrollment.id}
                className="group relative overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-low/30 p-4 transition-all duration-300 hover:border-primary/30 hover:bg-surface hover:shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 font-mono text-[11px] font-bold text-primary">
                    {course?.code ?? "Chưa có mã lớp"}
                  </span>
                  <CourseStatus status={enrollment.status} />
                </div>

                <h4
                  className="mt-2 truncate text-sm font-bold text-on-surface transition-colors group-hover:text-primary"
                  title={course?.name}
                >
                  {course?.name ?? "Khóa học"}
                </h4>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-on-surface-variant">
                  <div className="flex items-center gap-1.5 truncate">
                    <BookOpenText size={14} className="shrink-0 text-primary/70" />
                    <span className="truncate">{course ? skillPairLabel[course.skillPair] : "Chưa xác định"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarBlank size={14} className="shrink-0 text-primary/70" />
                    <span>{date(enrollment.startedOn ?? course?.startsOn ?? null)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="shrink-0 text-primary/70" />
                    <span>{course ? `${course.totalSessions} buổi học` : "—"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-primary">
                    <Target size={14} className="shrink-0 text-primary" />
                    <span>{course?.targetBand != null ? `Mục tiêu: Band ${course.targetBand}` : "Chưa đặt"}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <Empty text="Học viên chưa có khóa đang học, chờ xác nhận hoặc bảo lưu." />
          </div>
        )}
      </div>
    </section>
  );
}

function SkillDonut({ skills, total }: { skills: StudentLearningInsights["skills"]; total: number }) {
  const allSkillData = ALL_SKILLS.map(skillKey => {
    const found = skills.find(s => s.skill === skillKey);
    const attempts = found?.attempts ?? 0;
    const percent = total > 0 ? Math.round((attempts / total) * 100) : 0;
    return {
      skill: skillKey,
      attempts,
      percent,
      accuracy: found?.accuracy ?? null,
      meta: skillMeta[skillKey],
    };
  });

  const visibleSegments = allSkillData.filter(item => item.attempts > 0);
  let offset = 0;

  const topSkill = visibleSegments.length
    ? [...visibleSegments].sort((a, b) => b.attempts - a.attempts)[0]
    : null;

  return (
    <section
      className="profile-saas-panel flex h-full flex-col justify-between rounded-[20px] border p-5 md:p-6 transition-all duration-300 hover:shadow-md"
      aria-labelledby="completed-work-title"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="completed-work-title" className="font-display text-lg font-bold text-on-surface">
              Số bài đã hoàn thành
            </h3>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              Phân bổ theo kỹ năng từ các bài đã nộp hoặc đã chấm.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
            {total} bài tổng
          </span>
        </div>

        {total > 0 && visibleSegments.length ? (
          <div className="mt-5 grid items-center gap-6 lg:grid-cols-[190px_minmax(0,1fr)]">
            <div className="relative mx-auto h-[190px] w-[190px] shrink-0">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" role="img" aria-label={`${total} bài đã hoàn thành`}>
                <circle
                  cx="60"
                  cy="60"
                  r="46"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="14"
                  className="text-surface-container"
                />
                {visibleSegments.map(item => {
                  const currentOffset = offset;
                  offset += item.attempts;
                  return (
                    <circle
                      key={item.skill}
                      cx="60"
                      cy="60"
                      r="46"
                      fill="none"
                      pathLength={total}
                      stroke={item.meta.strokeColor}
                      strokeWidth={14}
                      strokeDasharray={`${item.attempts} ${Math.max(total - item.attempts, 0)}`}
                      strokeDashoffset={-currentOffset}
                      className="profile-ring-segment transition-all duration-500"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 grid place-content-center text-center pointer-events-none">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Đã hoàn thành
                </span>
                <strong className="mt-0.5 font-display text-3xl font-black tabular-nums tracking-tight text-on-surface">
                  {total}
                </strong>
                <span className="text-[11px] font-medium text-on-surface-variant">bài tập</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {allSkillData.map(item => {
                const isZero = item.attempts === 0;
                return (
                  <div
                    key={item.skill}
                    className={`group relative rounded-xl border p-2.5 transition-all duration-200 ${
                      isZero
                        ? "border-outline-variant/20 bg-surface-container-low/20 opacity-50 hover:opacity-80"
                        : "border-outline-variant/30 bg-surface-container-low/40 hover:border-primary/20 hover:bg-surface hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border ${item.meta.bgBadge}`}>
                          {item.meta.icon}
                        </span>
                        <span className="truncate text-xs font-bold text-on-surface">
                          {item.meta.label}
                        </span>
                      </div>
                      <span className="shrink-0 text-[11px] font-black tabular-nums text-on-surface-variant">
                        {item.percent}%
                      </span>
                    </div>

                    <div className="mt-2 flex items-baseline justify-between">
                      <strong className="text-sm font-black tabular-nums text-on-surface">
                        {item.attempts} <span className="text-[11px] font-normal text-on-surface-variant">bài</span>
                      </strong>
                      {item.accuracy != null && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded" title="Độ chính xác">
                          {item.accuracy}%
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-container">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${item.meta.barColor}`}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <Empty text="Chưa có bài hoàn tất để phân bổ theo kỹ năng." />
          </div>
        )}
      </div>

      {topSkill && topSkill.attempts > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-primary/15 bg-primary-container/10 px-3.5 py-2 text-xs text-on-surface-variant">
          <div className="flex items-center gap-1.5">
            <Sparkle size={14} className="shrink-0 text-primary" weight="fill" />
            <span>
              Kỹ năng luyện nhiều nhất: <strong className="font-bold text-on-surface">{topSkill.meta.label}</strong> ({topSkill.attempts} bài · {topSkill.percent}%)
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
            IELTS Target
          </span>
        </div>
      )}
    </section>
  );
}

function AccuracyTrend({ attempts }: { attempts: StudentLearningInsights["attempts"] }) {
  const points = attempts.filter(item => item.accuracy != null).slice(0, 12).reverse();
  const latest = points.at(-1);
  const previous = points.at(-2);
  const change = latest && previous ? (latest.accuracy ?? 0) - (previous.accuracy ?? 0) : null;
  const average = points.length
    ? Math.round(points.reduce((total, item) => total + (item.accuracy ?? 0), 0) / points.length)
    : 0;
  const best = points.reduce<(typeof points)[number] | undefined>((current, item) =>
    !current || (item.accuracy ?? 0) > (current.accuracy ?? 0) ? item : current, undefined);

  const chart = { width: 1000, height: 250, left: 52, right: 24, top: 28, bottom: 38 };
  const plotWidth = chart.width - chart.left - chart.right;
  const plotHeight = chart.height - chart.top - chart.bottom;
  const chartBottom = chart.top + plotHeight;
  const coordinates = points.map((item, index) => ({
    item,
    x: points.length === 1 ? chart.left + plotWidth / 2 : chart.left + (index / (points.length - 1)) * plotWidth,
    y: chart.top + (100 - (item.accuracy ?? 0)) / 100 * plotHeight,
  }));
  const linePoints = coordinates.map(point => `${point.x},${point.y}`).join(" ");
  const areaPoints = coordinates.length > 1
    ? `${coordinates[0].x},${chartBottom} ${linePoints} ${coordinates.at(-1)?.x},${chartBottom}`
    : "";

  return (
    <section className="profile-saas-panel profile-enter profile-enter-delay-2 overflow-hidden rounded-[20px] border" aria-labelledby="accuracy-trend-title">
      <div className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-center sm:justify-between md:px-6 md:pt-6">
        <div>
          <h3 id="accuracy-trend-title" className="font-display text-lg font-bold">Xu hướng kết quả gần đây</h3>
          <p className="mt-1 text-xs leading-5 text-on-surface-variant">Theo dõi độ chính xác của tối đa 12 bài gần nhất theo thời gian.</p>
        </div>
        {points.length > 0 && (
          <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-primary/15 bg-primary-container/15 px-3 py-2 text-xs font-bold text-primary">
            <ChartLineUp size={16} weight="duotone" />
            {points.length} điểm dữ liệu
          </span>
        )}
      </div>

      {points.length ? (
        <>
          <div className="mt-5 grid border-y border-primary/10 bg-surface-container-low/25 sm:grid-cols-3 sm:divide-x sm:divide-primary/10">
            <TrendMetric
              icon={<Target size={19} weight="duotone" />}
              label="Kết quả mới nhất"
              value={`${latest?.accuracy ?? 0}%`}
              detail={change == null ? "Chưa đủ dữ liệu so sánh" : change === 0 ? "Không đổi so với bài trước" : `${change > 0 ? "+" : ""}${change}% so với bài trước`}
              change={change}
            />
            <TrendMetric icon={<ChartLineUp size={19} weight="duotone" />} label="Độ chính xác trung bình" value={`${average}%`} detail={`Từ ${points.length} bài có dữ liệu`} />
            <TrendMetric icon={<Trophy size={19} weight="duotone" />} label="Kết quả tốt nhất" value={`${best?.accuracy ?? 0}%`} detail={best?.title ?? "Chưa có dữ liệu"} />
          </div>

          <div className="overflow-x-auto px-3 pb-4 pt-5 md:px-5 md:pb-5">
            <div className="min-w-[720px]">
              <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="block h-auto w-full" role="img" aria-labelledby="accuracy-chart-title accuracy-chart-desc">
                <title id="accuracy-chart-title">Biểu đồ xu hướng độ chính xác</title>
                <desc id="accuracy-chart-desc">{points.map(item => `${shortDate(item.lastActivityAt)}: ${item.accuracy}%`).join(", ")}</desc>
                <defs>
                  <linearGradient id="accuracy-trend-area" x1="0" y1="0" x2="0" y2="1" className="text-primary">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {[100, 75, 50, 25, 0].map(value => {
                  const y = chart.top + (100 - value) / 100 * plotHeight;
                  return (
                    <g key={value}>
                      <line x1={chart.left} x2={chart.width - chart.right} y1={y} y2={y} className="stroke-outline-variant/35" strokeDasharray="4 7" />
                      <text x={chart.left - 12} y={y + 4} textAnchor="end" className="fill-on-surface-variant text-[11px] tabular-nums">{value}%</text>
                    </g>
                  );
                })}

                {areaPoints && <polygon points={areaPoints} fill="url(#accuracy-trend-area)" className="profile-trend-area text-primary" />}
                {coordinates.length > 1 && (
                  <polyline points={linePoints} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="profile-trend-line text-primary" />
                )}

                {coordinates.map(({ item, x, y }, index) => {
                  const isLatest = index === coordinates.length - 1;
                  return (
                    <g key={item.id} className="group cursor-default">
                      <title>{`${item.title}: ${item.accuracy}%`}</title>
                      {isLatest && <circle cx={x} cy={y} r="12" className="fill-primary/10 stroke-primary/20" strokeWidth="2" />}
                      <circle cx={x} cy={y} r={isLatest ? 6 : 5} className="profile-trend-point fill-surface stroke-primary transition-[r,fill] duration-200 group-hover:fill-primary" strokeWidth="3" />
                      <text x={x} y={Math.max(y - 14, 13)} textAnchor="middle" className="fill-on-surface text-[11px] font-bold tabular-nums">{item.accuracy}%</text>
                      <text x={x} y={chart.height - 10} textAnchor="middle" className="fill-on-surface-variant text-[11px] tabular-nums">{shortDate(item.lastActivityAt)}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </>
      ) : (
        <div className="p-5 md:p-6"><Empty text="Chưa có bài làm đủ dữ liệu để vẽ xu hướng kết quả." /></div>
      )}
    </section>
  );
}

function TrendMetric({ icon, label, value, detail, change }: { icon: ReactNode; label: string; value: string; detail: string; change?: number | null }) {
  const ChangeIcon = change == null || change === 0 ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;
  const changeColor = change == null || change === 0 ? "text-on-surface-variant" : change > 0 ? "text-emerald-700" : "text-rose-700";

  return (
    <div className="flex min-w-0 items-start gap-3 px-5 py-4 sm:px-6">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-container/20 text-primary">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold text-on-surface-variant">{label}</span>
        <strong className="mt-0.5 block text-xl tabular-nums text-on-surface">{value}</strong>
        <span className={`mt-1 flex min-w-0 items-center gap-1 text-[11px] ${change === undefined ? "text-on-surface-variant" : changeColor}`}>
          {change !== undefined && <ChangeIcon size={13} weight="bold" />}
          <span className="truncate" title={detail}>{detail}</span>
        </span>
      </span>
    </div>
  );
}

function CourseStatus({ status }: { status: Enrollment["status"] }) {
  const meta: Record<string, { label: string; badgeClass: string; dot: string }> = {
    ACTIVE: { label: "Đang học", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/70", dot: "bg-emerald-500" },
    PENDING: { label: "Chờ xác nhận", badgeClass: "bg-amber-50 text-amber-800 border-amber-200/70", dot: "bg-amber-500" },
    PAUSED: { label: "Đang bảo lưu", badgeClass: "bg-sky-50 text-sky-800 border-sky-200/70", dot: "bg-sky-500" },
    COMPLETED: { label: "Hoàn thành", badgeClass: "bg-violet-50 text-violet-800 border-violet-200/70", dot: "bg-violet-500" },
    WITHDRAWN: { label: "Đã rút", badgeClass: "bg-rose-50 text-rose-800 border-rose-200/70", dot: "bg-rose-500" },
  };
  const config = meta[status] ?? {
    label: enrollmentStatusLabel[status],
    badgeClass: "bg-surface-container text-on-surface border-outline-variant/30",
    dot: "bg-gray-400",
  };
  const paused = status === "PAUSED";

  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${config.badgeClass}`}>
      {paused ? <PauseCircle size={13} /> : <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />}
      {config.label}
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-low/25 p-5 text-center text-sm text-on-surface-variant">{text}</div>;
}

function OverviewSkeleton() {
  return (
    <div className="space-y-4" aria-label="Đang tải tổng quan học tập">
      <div className="h-14 w-80 max-w-full animate-pulse rounded-xl bg-surface-container-low" />
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-[22px] bg-surface-container-low" />
        <div className="h-80 animate-pulse rounded-[22px] bg-surface-container-low" />
      </div>
      <div className="h-72 animate-pulse rounded-[22px] bg-surface-container-low" />
    </div>
  );
}

function studyDuration(minutes: number) {
  if (minutes <= 0) return "0 phút";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder} phút`;
  return remainder === 0 ? `${hours} giờ` : `${hours} giờ ${remainder} phút`;
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(value));
}

function statusOrder(status: Enrollment["status"]) {
  if (status === "ACTIVE") return 0;
  if (status === "PENDING") return 1;
  return 2;
}
