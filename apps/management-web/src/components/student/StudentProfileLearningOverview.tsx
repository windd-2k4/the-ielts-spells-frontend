import {
  BookOpenText,
  CalendarBlank,
  ChartBar,
  Clock,
  GraduationCap,
  Headphones,
  Microphone,
  PauseCircle,
  PenNib,
  Target,
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
    icon: ReactNode;
  }
> = {
  LISTENING: {
    label: "Listening",
    icon: <Headphones size={16} weight="duotone" />,
  },
  READING: {
    label: "Reading",
    icon: <BookOpenText size={16} weight="duotone" />,
  },
  WRITING: {
    label: "Writing",
    icon: <PenNib size={16} weight="duotone" />,
  },
  SPEAKING: {
    label: "Speaking",
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
          <div className="grid min-h-40 place-content-center rounded-[20px] border border-dashed border-outline-variant/50 bg-surface p-5 text-center">
            <ChartBar className="mx-auto text-on-surface-variant" size={28} />
            <strong className="mt-3 block">Chưa tải được số liệu học tập</strong>
            <p className="mt-1 max-w-md text-sm text-on-surface-variant">Dữ liệu học tập hiện chưa sẵn sàng.</p>
            <button type="button" onClick={onRetry} className="mx-auto mt-4 min-h-10 rounded-xl border border-primary/40 px-4 text-sm font-bold text-primary hover:bg-primary-container/15">
              Thử lại
            </button>
          </div>
          <CurrentCourses courses={currentCourses} />
        </div>
      </section>
    );
  }

  return (
    <section className="profile-enter profile-enter-delay-1 space-y-4" aria-labelledby="learning-journey-title">
      <JourneyHeader supportLevel={insights.summary.supportLevel} />
      <SummaryStrip summary={insights.summary} />

      <SkillTrends insights={insights} onRetry={onRetry} />
      <CurrentCourses courses={currentCourses} />
    </section>
  );
}

function JourneyHeader({ supportLevel }: { supportLevel?: StudentLearningInsights["summary"]["supportLevel"] }) {
  const support = supportLevel && {
    NEEDS_ATTENTION: { label: "Cần ưu tiên hỗ trợ", style: "bg-error-container/40 text-error" },
    WATCH: { label: "Cần theo dõi", style: "bg-primary-container/20 text-primary" },
    ON_TRACK: { label: "Tiến độ ổn định", style: "bg-emerald-50 text-emerald-700" },
    NOT_ENOUGH_DATA: { label: "Chưa đủ dữ liệu", style: "bg-surface-container-low text-on-surface-variant" },
  }[supportLevel];
  return (
    <header className="flex flex-wrap items-center justify-between gap-2">
      <h2 id="learning-journey-title" className="font-display text-lg font-bold tracking-tight">Tổng quan học tập</h2>
      {support && <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${support.style}`}>{support.label}</span>}
    </header>
  );
}

function SummaryStrip({ summary }: { summary: StudentLearningInsights["summary"] }) {
  const items = [
    { label: "Thời lượng ghi nhận", value: studyDuration(summary.totalStudyMinutes) },
    { label: "Bài hoàn thành", value: summary.completedAttempts.toLocaleString("vi-VN") },
    { label: "Bài đang làm", value: summary.inProgressAttempts.toLocaleString("vi-VN") },
    { label: "Hoạt động gần nhất", value: summary.lastActivityAt ? new Intl.DateTimeFormat("vi-VN").format(new Date(summary.lastActivityAt)) : "Chưa có" },
  ];
  return (
    <dl className="profile-saas-panel grid grid-cols-2 overflow-hidden rounded-[18px] border lg:grid-cols-4">
      {items.map((item, index) => (
        <div key={item.label} className={`min-w-0 px-4 py-2.5 ${index % 2 ? "border-l border-outline-variant/25" : ""} ${index >= 2 ? "border-t border-outline-variant/25 lg:border-t-0" : ""} ${index > 0 ? "lg:border-l" : ""}`}>
          <dt className="text-xs font-medium text-on-surface-variant">{item.label}</dt>
          <dd className="mt-0.5 font-display text-lg font-bold tabular-nums tracking-tight text-on-surface">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function CurrentCourses({ courses }: { courses: Array<{ enrollment: Enrollment; course: Course | undefined }> }) {
  return (
    <section className="profile-saas-panel rounded-[20px] border p-4 md:p-5" aria-labelledby="current-course-title">
      <div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 id="current-course-title" className="font-display text-lg font-bold text-on-surface">
              Khóa học đang tham gia
            </h3>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              Đang học, chờ xác nhận hoặc bảo lưu.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary-container/15 px-2.5 py-1 text-xs font-semibold text-primary">
            <GraduationCap size={14} weight="bold" />
            <span>{courses.length} khóa</span>
          </span>
        </div>

        {courses.length ? (
          <div className="mt-3 divide-y divide-outline-variant/30 border-t border-outline-variant/30">
            {courses.map(({ enrollment, course }) => (
              <article
                key={enrollment.id}
                className="py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-semibold text-primary">
                    {course?.code ?? "Chưa có mã lớp"}
                  </span>
                  <CourseStatus status={enrollment.status} />
                </div>

                <h4
                  className="mt-1 text-sm font-semibold text-on-surface"
                  title={course?.name}
                >
                  {course?.name ?? "Khóa học"}
                </h4>

                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-on-surface-variant">
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
                  <div className="flex items-center gap-1.5">
                    <Target size={14} className="shrink-0 text-primary/70" />
                    <span>{course?.targetBand != null ? `Mục tiêu khóa: Band ${course.targetBand}` : "Chưa đặt mục tiêu khóa"}</span>
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

function SkillTrends({ insights, onRetry }: { insights: StudentLearningInsights; onRetry: () => void }) {
  const monthly = Array.isArray(insights.monthlyCompletedAttempts) ? insights.monthlyCompletedAttempts : null;
  const series = ALL_SKILLS.map(skill => ({
    skill,
    points: monthly?.filter(item => item.skill === skill).sort((a, b) => a.month.localeCompare(b.month)) ?? [],
  }));
  const available = series.filter(item => item.points.some(point => point.completedAttempts > 0));
  const missing = series.filter(item => item.points.every(point => point.completedAttempts === 0));
  const maxCount = Math.max(1, ...(monthly?.map(item => item.completedAttempts) ?? []));
  const axisMax = Math.max(2, Math.ceil(maxCount / 2) * 2);

  return (
    <section aria-labelledby="skill-trends-title">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id="skill-trends-title" className="font-display text-base font-bold text-on-surface">Số bài đã làm theo tháng</h3>
        <p className="text-xs text-on-surface-variant">6 tháng gần nhất · bài đã nộp, được chấm hoặc hết hạn</p>
      </div>
      {!monthly ? (
        <div className="rounded-xl border border-dashed border-outline-variant/50 p-4 text-sm text-on-surface-variant" role="alert">
          Chưa tải được thống kê theo tháng.
          <button type="button" onClick={onRetry} className="ml-2 min-h-10 font-semibold text-primary underline underline-offset-2">Thử lại</button>
        </div>
      ) : available.length ? (
        <div className={`grid gap-3 ${available.length > 1 ? "xl:grid-cols-2" : ""}`}>
          {available.map(({ skill, points }) => {
            const meta = skillMeta[skill];
            const total = points.reduce((sum, point) => sum + point.completedAttempts, 0);
            return (
              <article key={skill} className="profile-saas-panel min-w-0 rounded-[18px] border px-4 py-3" aria-label={meta.label}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary-container/20 text-primary" aria-hidden="true">{meta.icon}</span>
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">{meta.label}</h4>
                      <p className="text-xs text-on-surface-variant">6 tháng: {total} bài</p>
                    </div>
                  </div>
                  <span className="text-right text-xs text-on-surface-variant">Tháng này <strong className="ml-1 text-sm tabular-nums text-primary">{points.at(-1)?.completedAttempts ?? 0} bài</strong></span>
                </div>
                <div
                  className="relative mb-2 mt-6 ml-8 h-28 border-b border-outline-variant/60"
                  role="img"
                  aria-label={`${meta.label}, số bài đã làm từng tháng: ${points.map(item => `${item.month}: ${item.completedAttempts} bài`).join("; ")}`}
                >
                  {[axisMax, axisMax / 2, 0].map(value => (
                    <div key={value} className="absolute inset-x-0 border-t border-dashed border-outline-variant/40" style={{ bottom: `${value / axisMax * 100}%` }} aria-hidden="true">
                      <span className="absolute -left-8 -top-2 text-[11px] tabular-nums text-on-surface-variant">{value}</span>
                    </div>
                  ))}
                  <div className="absolute inset-0 flex gap-1 px-1.5" aria-hidden="true">
                    {points.map((item, index) => (
                      <div key={item.month} className="relative h-full min-w-0 flex-1">
                        <div
                          className={`absolute bottom-0 left-1/2 w-full max-w-9 -translate-x-1/2 rounded-t-sm ${index === points.length - 1 ? "bg-primary" : "bg-primary/55"}`}
                          style={{ height: `${item.completedAttempts / axisMax * 100}%` }}
                          title={`Tháng ${monthLabel(item.month)}: ${item.completedAttempts} bài`}
                        />
                        <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold tabular-nums text-on-surface" style={{ bottom: `calc(${item.completedAttempts / axisMax * 100}% + 3px)` }}>{item.completedAttempts}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="ml-8 flex gap-1 px-1.5 text-[11px] tabular-nums text-on-surface-variant" aria-hidden="true">
                  {points.map(item => <span key={item.month} className="min-w-0 flex-1 text-center">{monthLabel(item.month)}</span>)}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <Empty text="Chưa có bài hoàn tất trong 6 tháng gần nhất." />
      )}
      {monthly && missing.length > 0 && available.length > 0 && (
        <p className="mt-2 text-xs text-on-surface-variant">Chưa có bài trong 6 tháng gần nhất: {missing.map(item => skillMeta[item.skill].label).join(", ")}.</p>
      )}
    </section>
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
      <div className="h-7 w-44 max-w-full animate-pulse rounded-lg bg-surface-container-low" />
      <div className="h-16 animate-pulse rounded-[18px] bg-surface-container-low" />
      <div className="grid gap-3 xl:grid-cols-2">
        <div className="h-52 animate-pulse rounded-[18px] bg-surface-container-low" />
        <div className="h-52 animate-pulse rounded-[18px] bg-surface-container-low" />
      </div>
      <div className="h-28 animate-pulse rounded-[18px] bg-surface-container-low" />
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

function monthLabel(month: string) {
  return `${month.slice(5, 7)}/${month.slice(2, 4)}`;
}

function statusOrder(status: Enrollment["status"]) {
  if (status === "ACTIVE") return 0;
  if (status === "PENDING") return 1;
  return 2;
}
