import {
  BookOpenText,
  CalendarBlank,
  ChartBar,
  Clock,
  Headphones,
  Microphone,
  PauseCircle,
  PenNib,
  SpinnerGap,
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

const skillMeta: Record<string, { label: string; color: string; icon: ReactNode }> = {
  LISTENING: { label: "Listening", color: "text-amber-500", icon: <Headphones size={17} /> },
  READING: { label: "Reading", color: "text-indigo-600", icon: <BookOpenText size={17} /> },
  WRITING: { label: "Writing", color: "text-rose-500", icon: <PenNib size={17} /> },
  SPEAKING: { label: "Speaking", color: "text-teal-600", icon: <Microphone size={17} /> },
};

export default function StudentProfileLearningOverview({ insights, loading, error, enrollments, courses, onRetry }: Props) {
  if (loading) return <OverviewSkeleton />;

  const currentCourses = enrollments
    .filter(item => ["ACTIVE", "PAUSED", "PENDING"].includes(item.status))
    .map(enrollment => ({ enrollment, course: courses.find(course => course.id === enrollment.courseId) }))
    .sort((a, b) => statusOrder(a.enrollment.status) - statusOrder(b.enrollment.status));

  if (error || !insights) {
    return (
      <section className="space-y-4" aria-labelledby="learning-journey-title">
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
    <section className="space-y-4" aria-labelledby="learning-journey-title">
      <JourneyHeader />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="space-y-4">
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
    <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <span className="text-[11px] font-black uppercase tracking-[0.1em] text-primary">Hành trình học tập</span>
        <h2 id="learning-journey-title" className="mt-1 font-display text-2xl font-bold">Tổng quan học tập & mục tiêu</h2>
      </div>
      <p className="max-w-xl text-sm leading-6 text-on-surface-variant sm:text-right">
        Dữ liệu tổng hợp từ điểm danh, hoạt động học và các bài làm đã lưu trên hệ thống.
      </p>
    </header>
  );
}

function StudyTimeCard({ minutes, inProgress }: { minutes: number; inProgress: number }) {
  return (
    <article className="overflow-hidden rounded-[22px] border border-emerald-500/35 bg-surface shadow-sm">
      <div className="flex items-start justify-between gap-4 p-5 md:p-6">
        <div>
          <span className="text-sm font-bold text-on-surface-variant">Thời lượng học đã ghi nhận</span>
          <strong className="mt-2 block font-display text-4xl font-extrabold tabular-nums text-emerald-600">{studyDuration(minutes)}</strong>
          <p className="mt-2 text-xs leading-5 text-on-surface-variant">Gồm thời lượng điểm danh và hoạt động học có dữ liệu thời gian.</p>
        </div>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Clock size={25} weight="duotone" />
        </span>
      </div>
      <div className="flex items-center gap-2 border-t border-emerald-500/15 bg-emerald-50/45 px-5 py-3 text-xs text-emerald-900 md:px-6">
        {inProgress > 0 ? <SpinnerGap size={16} /> : <ChartBar size={16} />}
        <span className="font-semibold">{inProgress > 0 ? `${inProgress} bài đang làm dở` : "Không có bài làm dang dở"}</span>
      </div>
    </article>
  );
}

function CurrentCourses({ courses }: { courses: Array<{ enrollment: Enrollment; course: Course | undefined }> }) {
  return (
    <section className="rounded-[22px] border border-outline-variant/35 bg-surface p-5 shadow-sm md:p-6" aria-labelledby="current-course-title">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 id="current-course-title" className="font-display text-lg font-bold">Khóa học đang tham gia</h3>
          <p className="mt-1 text-xs text-on-surface-variant">Các lớp đang học, chờ xác nhận hoặc đang bảo lưu.</p>
        </div>
        <span className="rounded-lg bg-primary-container/25 px-2.5 py-1 text-xs font-black text-primary">{courses.length} khóa</span>
      </div>

      {courses.length ? (
        <div className="mt-4 space-y-3">
          {courses.map(({ enrollment, course }) => (
            <article key={enrollment.id} className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/35 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[11px] font-black uppercase tracking-[0.08em] text-primary">{course?.code ?? "Chưa có mã lớp"}</span>
                  <h4 className="mt-1 truncate font-bold text-on-surface">{course?.name ?? "Khóa học"}</h4>
                </div>
                <CourseStatus status={enrollment.status} />
              </div>
              <div className="mt-3 grid gap-2 text-xs text-on-surface-variant sm:grid-cols-2">
                <span className="flex items-center gap-1.5"><BookOpenText size={15} /> {course ? skillPairLabel[course.skillPair] : "Chưa xác định kỹ năng"}</span>
                <span className="flex items-center gap-1.5"><CalendarBlank size={15} /> {date(enrollment.startedOn ?? course?.startsOn ?? null)}</span>
                {course && <span>{course.totalSessions} buổi học</span>}
                {course?.targetBand != null && <span>Mục tiêu khóa: Band {course.targetBand}</span>}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty text="Học viên chưa có khóa đang học, chờ xác nhận hoặc bảo lưu." />
      )}
    </section>
  );
}

function SkillDonut({ skills, total }: { skills: StudentLearningInsights["skills"]; total: number }) {
  const visible = skills.filter(item => item.attempts > 0);
  let offset = 0;

  return (
    <section className="rounded-[22px] border border-outline-variant/35 bg-surface p-5 shadow-sm md:p-6" aria-labelledby="completed-work-title">
      <div>
        <h3 id="completed-work-title" className="font-display text-lg font-bold">Số bài đã hoàn thành</h3>
        <p className="mt-1 text-xs text-on-surface-variant">Phân bổ theo kỹ năng từ các bài đã nộp hoặc đã chấm.</p>
      </div>

      {total > 0 && visible.length ? (
        <div className="mt-5 grid items-center gap-6 sm:grid-cols-[220px_minmax(0,1fr)]">
          <div className="relative mx-auto h-[210px] w-[210px]">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" role="img" aria-label={`${total} bài đã hoàn thành`}>
              <circle cx="60" cy="60" r="46" fill="none" stroke="currentColor" strokeWidth="16" className="text-surface-container" />
              {visible.map(item => {
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
                    stroke="currentColor"
                    strokeWidth="16"
                    strokeDasharray={`${item.attempts} ${Math.max(total - item.attempts, 0)}`}
                    strokeDashoffset={-currentOffset}
                    className={skillMeta[item.skill]?.color ?? "text-primary"}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 grid place-content-center text-center">
              <span className="text-xs font-bold text-on-surface-variant">Đã hoàn thành</span>
              <strong className="mt-1 text-3xl tabular-nums text-primary">{total}</strong>
              <span className="text-xs text-on-surface-variant">bài</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {visible.map(item => {
              const meta = skillMeta[item.skill] ?? { label: item.skill, color: "text-primary", icon: <BookOpenText size={17} /> };
              return (
                <div key={item.skill} className="flex items-center gap-3 rounded-xl bg-surface-container-low/55 p-3">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface ${meta.color}`}>{meta.icon}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs text-on-surface-variant">{meta.label}</span>
                    <strong className="block tabular-nums">{item.attempts} bài</strong>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-5"><Empty text="Chưa có bài hoàn tất để phân bổ theo kỹ năng." /></div>
      )}
    </section>
  );
}

function AccuracyTrend({ attempts }: { attempts: StudentLearningInsights["attempts"] }) {
  const points = attempts.filter(item => item.accuracy != null).slice(0, 12).reverse();

  return (
    <section className="rounded-[22px] border border-outline-variant/35 bg-surface p-5 shadow-sm md:p-6" aria-labelledby="accuracy-trend-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 id="accuracy-trend-title" className="font-display text-lg font-bold">Xu hướng kết quả gần đây</h3>
          <p className="mt-1 text-xs text-on-surface-variant">Độ chính xác của tối đa 12 bài gần nhất, theo thứ tự thời gian.</p>
        </div>
        {points.length > 0 && <span className="text-xs font-bold text-primary">Mới nhất: {points.at(-1)?.accuracy}%</span>}
      </div>

      {points.length ? (
        <div className="mt-6 overflow-x-auto pb-1">
          <div className="relative min-w-[640px] pl-9">
            <div className="pointer-events-none absolute inset-x-9 top-0 h-48">
              {[100, 75, 50, 25, 0].map(value => (
                <div key={value} className="absolute left-0 right-0 border-t border-dashed border-outline-variant/35" style={{ top: `${100 - value}%` }}>
                  <span className="absolute -left-9 -top-2 text-[10px] tabular-nums text-on-surface-variant">{value}%</span>
                </div>
              ))}
            </div>
            <div className="relative z-10 flex h-48 items-end gap-3">
              {points.map(item => (
                <div key={item.id} className="group flex h-full min-w-9 flex-1 items-end justify-center" title={`${item.title}: ${item.accuracy}%`}>
                  <div className="relative w-full max-w-12 rounded-t-lg bg-primary/75 transition group-hover:bg-primary" style={{ height: `${Math.max(item.accuracy ?? 0, 2)}%` }}>
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold tabular-nums text-on-surface">{item.accuracy}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-3 border-t border-outline-variant/40 pt-2">
              {points.map(item => (
                <time key={item.id} dateTime={item.lastActivityAt} className="min-w-9 flex-1 text-center text-[10px] tabular-nums text-on-surface-variant">
                  {shortDate(item.lastActivityAt)}
                </time>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5"><Empty text="Chưa có bài làm đủ dữ liệu để vẽ xu hướng kết quả." /></div>
      )}
    </section>
  );
}

function CourseStatus({ status }: { status: Enrollment["status"] }) {
  const paused = status === "PAUSED";
  const className = status === "ACTIVE"
    ? "bg-emerald-50 text-emerald-700"
    : paused
      ? "bg-amber-50 text-amber-800"
      : "bg-primary-container/25 text-primary";
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-black ${className}`}>
      {paused && <PauseCircle size={13} />}{enrollmentStatusLabel[status]}
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
