import {
  ArrowClockwise,
  ArrowRight,
  BookOpenText,
  Clock,
  NotePencil,
  UsersThree,
  WarningCircle,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { skillPairLabel } from "../academic-types";
import {
  getTeacherDashboard,
  type TeacherDashboard,
  type TeacherEvaluationQueueItem,
} from "../lib/dashboard-api";

type QueueFilter = "ALL" | "PENDING" | "REVISION";

function dateTime(value: string | null) {
  if (!value) return "Chưa có lịch";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusLabel(value: string) {
  return value === "REVISION_REQUESTED" || value === "REJECTED"
    ? "Cần học viên sửa"
    : "Chờ giáo viên chấm";
}

function queueMatches(item: TeacherEvaluationQueueItem, filter: QueueFilter) {
  if (filter === "PENDING") return item.reviewStatus === "PENDING";
  return filter === "REVISION"
    ? item.reviewStatus === "REVISION_REQUESTED" || item.reviewStatus === "REJECTED"
    : true;
}

export function TeacherDashboardPage() {
  const [dashboard, setDashboard] = useState<TeacherDashboard | null>(null);
  const [filter, setFilter] = useState<QueueFilter>("ALL");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (manual = false) => {
    manual ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      setDashboard(await getTeacherDashboard());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không tải được bảng điều khiển giáo viên.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const queue = useMemo(
    () => dashboard?.evaluationQueue.filter((item) => (courseFilter === "ALL" || item.courseId === courseFilter) && queueMatches(item, filter)) ?? [],
    [courseFilter, dashboard, filter],
  );

  if (loading && !dashboard) {
    return <div className="mx-auto max-w-[1480px] space-y-4" aria-label="Đang tải bảng điều khiển"><div className="h-28 animate-pulse rounded-2xl bg-surface" /><div className="h-72 animate-pulse rounded-2xl bg-surface" /></div>;
  }

  return (
    <section className="mx-auto max-w-[1480px] space-y-5 pb-12">
      <header className="flex flex-col gap-4 border-b border-outline-variant/30 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Teacher Console</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-on-surface">Chào {dashboard?.teacherName || "giáo viên"}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Tập trung vào lớp đang dạy và những bài cần phản hồi tiếp theo.</p>
        </div>
        <button type="button" onClick={() => void load(true)} disabled={refreshing} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-outline-variant/60 bg-surface px-4 text-sm font-bold text-on-surface transition hover:border-primary/50 hover:text-primary disabled:opacity-50 lg:self-auto" aria-label="Làm mới bảng điều khiển">
          <ArrowClockwise size={17} weight="bold" className={refreshing ? "animate-spin" : ""} /> Làm mới
        </button>
      </header>

      {error ? <div role="alert" className="flex items-center gap-3 rounded-xl border border-error/25 bg-error-container/25 px-4 py-3 text-sm font-semibold text-error"><WarningCircle size={19} />{error}<button type="button" onClick={() => void load()} className="ml-auto underline">Thử lại</button></div> : null}

      {dashboard ? <>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Chỉ số lớp học">
          <Metric label="Lớp đang phụ trách" value={dashboard.courses.length} note="Theo phân công hiện tại" icon={BookOpenText} />
          <Metric label="Học viên đang học" value={dashboard.courses.reduce((sum, item) => sum + item.activeStudents, 0)} note="Tổng trên các lớp" icon={UsersThree} />
          <Metric label="Chờ chấm" value={dashboard.pendingCount} note="Cần xử lý trước" icon={NotePencil} tone="warning" />
          <Metric label="Đang chờ sửa" value={dashboard.revisionCount} note="Theo dõi bản nộp lại" icon={WarningCircle} tone="danger" />
        </section>

        <section className="rounded-2xl border border-outline-variant/35 bg-surface shadow-sm" aria-labelledby="teacher-courses-heading">
          <div className="flex flex-col gap-2 border-b border-outline-variant/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 id="teacher-courses-heading" className="font-display text-lg font-extrabold">Lớp của tôi</h2><p className="text-xs text-on-surface-variant">Mở thẳng tiến độ lớp để giao bài, phản hồi hoặc xem từng học viên.</p></div>
            <span className="text-xs font-bold text-on-surface-variant">{dashboard.courses.length} lớp</span>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {dashboard.courses.map((course) => (
              <Link key={course.courseId} to={"/courses/" + course.courseId + "?tab=progress"} className="group rounded-xl border border-outline-variant/45 p-4 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary/40">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">{course.courseCode}</span><h3 className="mt-1 truncate font-display text-base font-extrabold">{course.courseName}</h3></div><ArrowRight size={18} className="shrink-0 text-primary transition-transform group-hover:translate-x-0.5" /></div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-on-surface-variant"><span className="rounded-full bg-primary-container/20 px-2 py-1 text-primary">{skillPairLabel[course.skillPair as keyof typeof skillPairLabel] || course.skillPair}</span><span>{course.activeStudents} học viên</span><span>{course.completionPercent}% tiến độ</span></div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs"><span className="rounded-lg bg-amber-50 px-2.5 py-2 font-bold text-amber-800">Chờ chấm <strong>{course.pendingReviews}</strong></span><span className="rounded-lg bg-rose-50 px-2.5 py-2 font-bold text-rose-800">Cần sửa <strong>{course.revisionRequests}</strong></span></div>
                <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant"><Clock size={14} /> Buổi tới: {dateTime(course.nextSessionAt)}</p>
              </Link>
            ))}
            {!dashboard.courses.length ? <Empty text="Chưa có lớp được phân công." /> : null}
          </div>
        </section>

        <section className="rounded-2xl border border-outline-variant/35 bg-surface shadow-sm" aria-labelledby="evaluation-queue-heading">
          <div className="flex flex-col gap-3 border-b border-outline-variant/30 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div><h2 id="evaluation-queue-heading" className="font-display text-lg font-extrabold">Evaluation Queue</h2><p className="text-xs text-on-surface-variant">Hàng đợi theo các lớp bạn đang phụ trách.</p></div>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Lọc hàng đợi chấm bài">
              <label className="sr-only" htmlFor="teacher-queue-course">Lọc theo lớp</label>
              <select id="teacher-queue-course" value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="min-h-10 rounded-lg border border-outline-variant/50 bg-surface px-3 text-xs font-bold text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                <option value="ALL">Tất cả lớp</option>
                {dashboard.courses.map((course) => <option key={course.courseId} value={course.courseId}>{course.courseCode}</option>)}
              </select>
              {([["ALL", "Tất cả"], ["PENDING", "Chờ chấm"], ["REVISION", "Cần sửa"]] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={"min-h-10 rounded-lg border px-3 text-xs font-bold transition " + (filter === value ? "border-primary bg-primary text-on-primary" : "border-outline-variant/50 text-on-surface-variant hover:border-primary/40 hover:text-primary")}>{label}</button>)}
            </div>
          </div>
          {queue.length ? <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-surface-container-low text-[11px] font-extrabold uppercase tracking-wide text-on-surface-variant"><tr><th className="px-4 py-3">Học viên</th><th className="px-4 py-3">Lớp / hoạt động</th><th className="px-4 py-3">Session</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-outline-variant/25">{queue.map((item) => <tr key={item.itemId} className="transition hover:bg-surface-container-low/50"><td className="px-4 py-3"><strong className="block">{item.studentName}</strong><span className="text-xs text-on-surface-variant">Attempt {item.attemptNo}{item.late ? " · Nộp muộn" : ""}</span></td><td className="px-4 py-3"><strong className="block">{item.courseCode}</strong><span className="text-xs text-on-surface-variant">{item.activityTitle} · {item.skill}</span></td><td className="px-4 py-3 text-xs text-on-surface-variant">{item.sessionNo == null ? "Bài test" : <>Buổi {item.sessionNo}<br />{item.sessionTitle}</>}</td><td className="px-4 py-3"><span className={"inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold " + (item.reviewStatus === "PENDING" ? "bg-amber-50 text-amber-800" : "bg-rose-50 text-rose-800")}>{statusLabel(item.reviewStatus)}</span></td><td className="px-4 py-3 text-right"><Link to={item.courseRoute} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-on-primary transition hover:opacity-90">{item.itemType === "ASSIGNMENT" ? "Mở Course Progress" : `Mở ${item.skill} queue`} <ArrowRight size={14} /></Link></td></tr>)}</tbody></table></div> : <Empty text={filter === "ALL" ? "Hàng đợi hiện đã được xử lý hết." : "Không có mục phù hợp với bộ lọc."} />}
        </section>
      </> : null}
    </section>
  );
}

function Metric({ label, value, note, icon: Icon, tone = "primary" }: { label: string; value: number; note: string; icon: typeof BookOpenText; tone?: "primary" | "warning" | "danger" }) {
  const styles = tone === "danger" ? "bg-rose-50 text-rose-700" : tone === "warning" ? "bg-amber-50 text-amber-700" : "bg-primary-container/20 text-primary";
  return <article className="rounded-2xl border border-outline-variant/35 bg-surface p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-on-surface-variant">{label}</span><span className={"grid h-9 w-9 place-items-center rounded-xl " + styles}><Icon size={18} weight="duotone" /></span></div><strong className="mt-3 block font-display text-3xl font-black tabular-nums text-on-surface">{value}</strong><span className="mt-1 block text-[11px] font-semibold text-on-surface-variant">{note}</span></article>;
}

function Empty({ text }: { text: string }) {
  return <div className="col-span-full grid min-h-32 place-items-center rounded-xl bg-surface-container-low px-4 text-center text-sm font-semibold text-on-surface-variant">{text}</div>;
}
