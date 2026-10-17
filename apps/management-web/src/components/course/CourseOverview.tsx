import {
  ArrowRight,
  CalendarBlank,
  CaretDown,
  CheckCircle,
  Clock,
  TrendUp,
  WarningCircle,
  Notebook,
  ChalkboardTeacher,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import type { AcademicClass, AttendanceRecord, ClassActivityProgress, ClassSession, Course, CourseTeacherAssignment, TeacherOption } from "../../academic-types";
import { useAuth } from "../../auth/AuthContext";
import { apiFetch } from "../../lib/api";

interface StudentSummary {
  id: string;
  studentCode: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarPath: string | null;
  currentBand: number | null;
  targetBand: number | null;
}

interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  status: string;
}

type Roster = { enrollment: Enrollment; student: StudentSummary }[];
type StaffOption = { authUserId: string | null; fullName: string; email: string; role: string; status: string };
type ActiveStudentSupport = StaffOption & { authUserId: string };
type StudentSupportAssignment = { studentSupportId: string };
type Page<T> = { content: T[] };

interface CourseOverviewProps {
  course: Course;
  selectedClass: AcademicClass | null;
  roster: Roster;
  setTab: (tab: any) => void;
  onSelectStudent?: (studentId: string) => void;
}

function ProgressBar({ value, label }: { value: number | null; label: string }) {
  const needsAttention = value != null && value < 65;

  return (
    <div className="rounded-xl bg-surface-container-low/55 p-3 ring-1 ring-inset ring-outline-variant/20">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-on-surface">{label}</span>
        <strong className={`text-sm tabular-nums ${needsAttention ? "text-error" : "text-primary"}`}>{value == null ? "-" : `${value}%`}</strong>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-surface-container-high" aria-label={value == null ? `${label} chưa có dữ liệu` : `${label} ${value}%`}>
        <div className={`h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${needsAttention ? "bg-error" : "bg-primary"}`} style={{ width: `${value ?? 0}%` }} />
        <span className="absolute inset-y-0 left-[80%] w-px bg-on-surface/25" title="Mục tiêu 80%" />
      </div>
    </div>
  );
}

function MetricRing({ value, warning = false }: { value: number | null; warning?: boolean }) {
  const normalized = Math.max(0, Math.min(100, value ?? 0));
  return (
    <span className="relative grid h-14 w-14 shrink-0 place-items-center" aria-hidden="true">
      <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90">
        <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="4" className="text-surface-container-high" />
        <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - normalized} className={warning ? "text-error" : "text-primary"} />
      </svg>
      <strong className={`relative text-xs font-black tabular-nums ${warning ? "text-error" : "text-on-surface"}`}>{value == null ? "-" : `${value}%`}</strong>
    </span>
  );
}

function TrendChart({ values }: { values: Array<{ label: string; value: number }> }) {
  const width = 420;
  const height = 112;
  const points = values.map((item, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - (item.value / 100) * (height - 20) - 10;
    return { ...item, x, y };
  });
  const polyline = points.map((item) => `${item.x},${item.y}`).join(" ");

  return (
    <div className="mt-3">
      {values.length > 1 ? <>
        <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full overflow-visible" role="img" aria-label="Xu hướng kết quả trung bình theo buổi">
          {[25, 50, 75].map((value) => <line key={value} x1="0" x2={width} y1={height - (value / 100) * (height - 20) - 10} y2={height - (value / 100) * (height - 20) - 10} className="stroke-outline-variant/35" strokeDasharray="4 6" />)}
          <polyline points={polyline} fill="none" className="stroke-primary" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((item) => <circle key={item.label} cx={item.x} cy={item.y} r="4" className="fill-surface stroke-primary" strokeWidth="3"><title>{item.label}: {item.value}%</title></circle>)}
        </svg>
        <div className="mt-1 flex justify-between text-[10px] font-semibold text-on-surface-variant"><span>{values[0]?.label}</span><span>{values.at(-1)?.label}</span></div>
      </> : <div className="grid h-28 place-items-center rounded-xl bg-surface-container-low/60 text-xs text-on-surface-variant">Chưa đủ dữ liệu xu hướng</div>}
    </div>
  );
}

function sessionTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default function CourseOverview({
  course,
  selectedClass,
  roster,
  setTab,
  onSelectStudent,
}: CourseOverviewProps) {
  const { roles } = useAuth();
  const [sessions,setSessions]=useState<ClassSession[]>([]);const [attendance,setAttendance]=useState<AttendanceRecord[]>([]);const [progress,setProgress]=useState<ClassActivityProgress[]>([]);
  const [studentSupportOptions, setStudentSupportOptions] = useState<ActiveStudentSupport[]>([]);
  const [assignedSupportIds, setAssignedSupportIds] = useState<string[]>([]);
  const [isLoadingSupport, setIsLoadingSupport] = useState(false);
  const [isSavingSupport, setIsSavingSupport] = useState(false);
  const [studentSupportError, setStudentSupportError] = useState("");
  const [studentSupportSuccess, setStudentSupportSuccess] = useState("");
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
  const [courseTeachers, setCourseTeachers] = useState<CourseTeacherAssignment[]>([]);
  const [primaryTeacherId, setPrimaryTeacherId] = useState("");
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [isSavingTeacher, setIsSavingTeacher] = useState(false);
  const [teacherError, setTeacherError] = useState("");
  const [teacherSuccess, setTeacherSuccess] = useState("");
  const canAssignTeacher = roles.includes("admin");
  const canAssignStudentSupport = roles.includes("admin");
  useEffect(()=>{if(!selectedClass)return;void Promise.all([apiFetch<ClassSession[]>(`/admin/courses/${selectedClass.id}/sessions`),apiFetch<AttendanceRecord[]>(`/admin/courses/${selectedClass.id}/attendance`),apiFetch<ClassActivityProgress[]>(`/admin/courses/${selectedClass.id}/progress`)]).then(([s,a,p])=>{setSessions(s);setAttendance(a);setProgress(p)}).catch(()=>{setSessions([]);setAttendance([]);setProgress([])})},[selectedClass?.id]);
  useEffect(() => {
    if (!selectedClass || !canAssignStudentSupport) {
      setStudentSupportOptions([]);
      setAssignedSupportIds([]);
      return;
    }
    let active = true;
    setIsLoadingSupport(true);
    setStudentSupportError("");
    void Promise.all([
      apiFetch<Page<StaffOption>>("/admin/staff?size=200"),
      apiFetch<StudentSupportAssignment[]>(`/admin/courses/${selectedClass.id}/student-supports`),
    ]).then(([staff, assignments]) => {
      if (!active) return;
      setStudentSupportOptions(staff.content.filter((item): item is ActiveStudentSupport => item.authUserId !== null && item.status === "ACTIVE" && item.role === "STUDENT_SUPPORT"));
      setAssignedSupportIds(assignments.map((item) => item.studentSupportId));
    }).catch((value: unknown) => {
      if (active) setStudentSupportError(value instanceof Error ? value.message : "Không tải được phân công Student Support.");
    }).finally(() => {
      if (active) setIsLoadingSupport(false);
    });
    return () => { active = false; };
  }, [canAssignStudentSupport, selectedClass?.id]);

  useEffect(() => {
    if (!selectedClass || !canAssignTeacher) {
      setTeacherOptions([]);
      setCourseTeachers([]);
      setPrimaryTeacherId("");
      return;
    }
    let active = true;
    setIsLoadingTeachers(true);
    setTeacherError("");
    void Promise.all([
      apiFetch<TeacherOption[]>("/admin/teacher-options"),
      apiFetch<CourseTeacherAssignment[]>(`/admin/courses/${selectedClass.id}/teachers`),
    ]).then(([options, assignments]) => {
      if (!active) return;
      setTeacherOptions(options);
      setCourseTeachers(assignments);
      setPrimaryTeacherId(assignments.find((item) => item.primary)?.teacherId ?? "");
    }).catch((value: unknown) => {
      if (active) setTeacherError(value instanceof Error ? value.message : "Không tải được phân công giáo viên.");
    }).finally(() => {
      if (active) setIsLoadingTeachers(false);
    });
    return () => { active = false; };
  }, [canAssignTeacher, selectedClass?.id]);

  async function savePrimaryTeacher() {
    if (!selectedClass || !primaryTeacherId) return;
    setIsSavingTeacher(true);
    setTeacherError("");
    setTeacherSuccess("");
    try {
      const assignments = await apiFetch<CourseTeacherAssignment[]>(`/admin/courses/${selectedClass.id}/teachers/primary`, {
        method: "PUT",
        body: JSON.stringify({ teacherId: primaryTeacherId }),
      });
      setCourseTeachers(assignments);
      setPrimaryTeacherId(assignments.find((item) => item.primary)?.teacherId ?? primaryTeacherId);
      setTeacherSuccess("Đã cập nhật giáo viên chính của khóa học.");
    } catch (value) {
      setTeacherError(value instanceof Error ? value.message : "Không thể cập nhật giáo viên chính.");
    } finally {
      setIsSavingTeacher(false);
    }
  }

  async function saveStudentSupports() {
    if (!selectedClass) return;
    setIsSavingSupport(true);
    setStudentSupportError("");
    setStudentSupportSuccess("");
    try {
      await apiFetch<StudentSupportAssignment[]>(`/admin/courses/${selectedClass.id}/student-supports`, {
        method: "PUT",
        body: JSON.stringify({ studentSupportIds: assignedSupportIds }),
      });
      setStudentSupportSuccess("Đã cập nhật phân công Student Support cho khóa học.");
    } catch (value) {
      setStudentSupportError(value instanceof Error ? value.message : "Không thể cập nhật phân công Student Support.");
    } finally {
      setIsSavingSupport(false);
    }
  }
  const totalSessions=sessions.length;const completedSessions=sessions.filter(value=>value.status==="COMPLETED").length;
  const skills = course.skillPair === "LISTENING_READING"
    ? ([{ key: "LISTENING", label: "Listening" }, { key: "READING", label: "Reading" }] as const)
    : ([{ key: "SPEAKING", label: "Speaking" }, { key: "WRITING", label: "Writing" }] as const);
  const courseProgress=useMemo(()=>progress.filter(activity=>skills.some(skill=>skill.key===activity.skill)),[progress,skills]);
  const studentRates=useMemo(()=>new Map(roster.map(({student})=>{const relevant=courseProgress.flatMap(activity=>activity.attempts.filter(attempt=>attempt.studentId===student.id));const values=relevant.map(attempt=>attempt.comprehensionPercent??(attempt.score!=null&&attempt.maxScore?Math.round(attempt.score/attempt.maxScore*100):null)).filter((value):value is number=>value!=null);return [student.id,values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):null]})),[courseProgress,roster]);
  const knownRates=[...studentRates.values()].filter((value):value is number=>value!=null);
  const average=knownRates.length?Math.round(knownRates.reduce((a,b)=>a+b,0)/knownRates.length):null;
  const risks = roster.filter(item => {const value=studentRates.get(item.student.id);return value!=null&&value<65});
  
  const markedAttendance = attendance.filter((item) => item.status !== "PENDING");
  const attended = markedAttendance.filter((item) => ["PRESENT", "LATE", "LEFT_EARLY"].includes(item.status)).length;
  const attendanceRate = markedAttendance.length ? Math.round((attended / markedAttendance.length) * 100) : null;
  const recordedSessions = new Set(markedAttendance.map((item) => item.sessionId)).size;
  const nextSession = sessions.filter((item) => item.status === "SCHEDULED" && new Date(item.endsAt).getTime() >= Date.now()).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
  const sessionTrend = useMemo(() => sessions
    .map((session) => {
      const values = courseProgress
        .filter((activity) => activity.sessionId === session.id)
        .flatMap((activity) => activity.attempts)
        .map((attempt) => attempt.comprehensionPercent ?? (attempt.score != null && attempt.maxScore ? Math.round((attempt.score / attempt.maxScore) * 100) : null))
        .filter((value): value is number => value != null);
      return values.length ? { label: `Buổi ${session.sessionNo}`, value: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length), sessionNo: session.sessionNo } : null;
    })
    .filter((item): item is { label: string; value: number; sessionNo: number } => item != null)
    .sort((a, b) => a.sessionNo - b.sessionNo)
    .slice(-6), [courseProgress, sessions]);
  const primaryTeacher = courseTeachers.find((item) => item.primary);
  const assignedSupports = studentSupportOptions.filter((item) => assignedSupportIds.includes(item.authUserId));

  const metrics = [
    { label: "Tiến độ khóa", value: totalSessions ? `${Math.round((completedSessions / totalSessions) * 100)}%` : "-", note: `${completedSessions}/${totalSessions} buổi`, icon: Clock, progress: totalSessions ? Math.round((completedSessions / totalSessions) * 100) : null },
    { label: "Kết quả trung bình", value: average == null ? "-" : `${average}%`, note: `${skills.length} kỹ năng`, icon: TrendUp, progress: average },
    { label: "Chuyên cần", value: attendanceRate == null ? "-" : `${attendanceRate}%`, note: `${recordedSessions} buổi đã ghi nhận`, icon: CheckCircle, progress: attendanceRate },
    { label: "Cần chú ý", value: String(risks.length), note: "Dưới 65%", icon: WarningCircle, progress: null },
  ];

  return (
    <div className="space-y-3 rounded-[20px] bg-surface-container-low/45 p-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section aria-labelledby="course-health-heading">
          <h2 id="course-health-heading" className="sr-only">Tình trạng khóa học</h2>
          <div className="grid h-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((item) => {
              const Icon = item.icon;
              const warning = item.label === "Cần chú ý" && risks.length > 0;
              return <article key={item.label} className={`flex min-h-[104px] items-center gap-3 rounded-2xl bg-surface p-3 shadow-[0_8px_24px_rgba(82,48,60,0.055)] ring-1 ${warning ? "ring-error/25" : "ring-primary/10"}`}>
                {item.progress != null ? <MetricRing value={item.progress} warning={item.progress < 65} /> : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-error-container/30 text-error"><Icon size={22} weight="duotone" /></span>}
                <span className="min-w-0"><span className="block truncate text-xs font-bold text-on-surface-variant">{item.label}</span>{item.progress == null && <strong className="mt-0.5 block font-display text-xl font-black tabular-nums text-error">{item.value}</strong>}<span className="mt-1 block truncate text-[11px] font-medium text-on-surface-variant">{item.note}</span></span>
              </article>;
            })}
          </div>
        </section>

        <aside className="relative overflow-hidden rounded-2xl bg-primary p-4 text-on-primary shadow-[0_12px_28px_rgba(82,48,60,0.18)]" aria-labelledby="next-session-heading">
          <span className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10" />
          <div className="relative flex h-full min-h-[104px] flex-col">
            <div className="flex items-center justify-between gap-3"><h2 id="next-session-heading" className="flex items-center gap-2 text-xs font-bold"><CalendarBlank size={17} weight="duotone" />Buổi tiếp theo</h2><ArrowRight size={16} /></div>
            {nextSession ? <><strong className="mt-3 line-clamp-2 text-sm leading-5">Buổi {nextSession.sessionNo}: {nextSession.title || "Chưa đặt tên"}</strong><span className="mt-1 text-[11px] text-on-primary/75">{sessionTime(nextSession.startsAt)}</span></> : <p className="mt-3 text-sm font-semibold text-on-primary/75">Chưa có lịch sắp tới</p>}
            <button type="button" onClick={() => setTab("schedule")} className="mt-auto self-start rounded-full bg-surface px-3 py-1.5 text-[11px] font-bold text-primary transition hover:bg-primary-container active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface">Mở thời khóa biểu</button>
          </div>
        </aside>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_300px]">
        <section className="rounded-2xl bg-surface p-4 shadow-[0_10px_28px_rgba(82,48,60,0.055)] ring-1 ring-primary/10" aria-labelledby="skill-overview-heading">
          <div className="flex items-center justify-between gap-3">
            <h2 id="skill-overview-heading" className="flex items-center gap-2 font-display text-base font-extrabold"><Notebook size={19} className="text-primary" />Tiến độ học tập</h2>
            <button type="button" onClick={() => setTab("progress")} className="group inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-primary transition hover:bg-primary-container/25 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">Chi tiết <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></button>
          </div>
          <div className="mt-3 grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:divide-x lg:divide-outline-variant/30">
            <div className="space-y-2 lg:pr-4">
              <p className="text-xs font-bold text-on-surface-variant">Theo kỹ năng</p>
              {skills.map((skill) => {
                const attempts=courseProgress.filter(value=>value.skill===skill.key).flatMap(value=>value.attempts);const values=attempts.map(value=>value.comprehensionPercent??(value.score!=null&&value.maxScore?Math.round(value.score/value.maxScore*100):null)).filter((value):value is number=>value!=null);const val=values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):null;
                return <ProgressBar key={skill.key} label={skill.label} value={val} />;
              })}
            </div>
            <div className="lg:pl-4">
              <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold text-on-surface-variant">Kết quả theo buổi</p>{sessionTrend.length > 0 && <strong className="text-xs tabular-nums text-primary">{sessionTrend.at(-1)?.value}% gần nhất</strong>}</div>
              <TrendChart values={sessionTrend} />
            </div>
          </div>
        </section>

        <aside className="rounded-2xl bg-surface p-4 shadow-[0_10px_28px_rgba(82,48,60,0.055)] ring-1 ring-error/15" aria-labelledby="attention-heading">
          <div className="flex items-center justify-between gap-3"><h2 id="attention-heading" className="font-display text-base font-extrabold">Cần chú ý</h2><span className={`grid h-7 min-w-7 place-items-center rounded-lg px-2 text-xs font-black tabular-nums ${risks.length ? "bg-error-container/35 text-error" : "bg-emerald-50 text-emerald-700"}`}>{risks.length}</span></div>
          {risks.length ? <div className="mt-3 space-y-2">
            {risks.slice(0, 3).map((item) => <button type="button" key={item.student.id} onClick={() => onSelectStudent?.(item.student.id)} className="flex min-h-12 w-full items-center gap-2.5 rounded-xl px-2 text-left transition hover:bg-error-container/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-error">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-error-container/30 text-xs font-black text-error">{item.student.fullName.trim().charAt(0).toUpperCase()}</span>
              <span className="min-w-0 flex-1"><strong className="block truncate text-xs">{item.student.fullName}</strong><span className="text-[10px] text-on-surface-variant">Tiến độ học tập</span></span>
              <strong className="text-xs tabular-nums text-error">{studentRates.get(item.student.id)}%</strong>
            </button>)}
          </div> : <div className="mt-3 grid min-h-32 place-items-center rounded-xl bg-surface-container-low/60 text-center"><span><CheckCircle size={24} className="mx-auto text-emerald-600" /><span className="mt-2 block text-xs font-bold">Không có cảnh báo</span></span></div>}
          <button type="button" onClick={() => setTab("progress")} className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-full border border-primary/15 text-xs font-bold text-primary transition hover:bg-primary-container/20 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">Xem tiến độ lớp <ArrowRight size={14} /></button>
        </aside>
      </div>

      {(canAssignTeacher || canAssignStudentSupport) && selectedClass && <details className="group overflow-hidden rounded-[22px] bg-surface shadow-[0_12px_32px_rgba(82,48,60,0.055)] ring-1 ring-primary/10">
        <summary className="flex min-h-[72px] cursor-pointer list-none items-center gap-3 px-4 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-primary/[0.035] [&::-webkit-details-marker]:hidden">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-container/25 text-primary ring-1 ring-primary/10"><ChalkboardTeacher size={22} weight="duotone" /></span>
          <span className="min-w-0 flex-1"><strong className="block text-sm">Nhân sự phụ trách</strong><span className="block truncate text-[11px] text-on-surface-variant">{primaryTeacher?.fullName || "Chưa phân công giáo viên"} · {assignedSupports.length} hỗ trợ</span></span>
          <span className="rounded-full bg-primary-container/20 px-3 py-1.5 text-xs font-bold text-primary">Quản lý</span><CaretDown size={17} className="text-on-surface-variant transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-open:rotate-180" />
        </summary>
        <div className="grid gap-3 border-t border-outline-variant/25 bg-surface-container-low/30 p-4 lg:grid-cols-2">
          {canAssignTeacher && <section className="rounded-2xl bg-surface p-4 ring-1 ring-primary/10" aria-labelledby="teacher-assignment-heading">
            <h3 id="teacher-assignment-heading" className="text-sm font-extrabold">Giáo viên chính</h3>
            {teacherError && <p role="alert" className="mt-3 rounded-lg bg-error-container/25 px-3 py-2 text-xs text-error">{teacherError}</p>}
            {teacherSuccess && <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{teacherSuccess}</p>}
            {isLoadingTeachers ? <p className="mt-3 text-xs text-on-surface-variant">Đang tải...</p> : teacherOptions.length === 0 ? <p className="mt-3 text-xs text-on-surface-variant">Chưa có giáo viên hoạt động.</p> : <div className="mt-3 flex gap-2"><label className="min-w-0 flex-1"><span className="sr-only">Chọn giáo viên chính</span><select value={primaryTeacherId} onChange={(event) => { setPrimaryTeacherId(event.target.value); setTeacherSuccess(""); }} className="min-h-11 w-full rounded-xl border border-outline-variant/60 bg-surface px-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"><option value="">Chọn giáo viên</option>{teacherOptions.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>)}</select></label><button type="button" onClick={() => void savePrimaryTeacher()} disabled={!primaryTeacherId || isSavingTeacher} className="min-h-11 rounded-xl bg-primary px-4 text-xs font-bold text-on-primary disabled:opacity-50">{isSavingTeacher ? "Đang lưu" : "Lưu"}</button></div>}
          </section>}

          {canAssignStudentSupport && <section className="rounded-2xl bg-surface p-4 ring-1 ring-primary/10" aria-labelledby="support-assignment-heading">
            <div className="flex items-center justify-between gap-3"><h3 id="support-assignment-heading" className="text-sm font-extrabold">Student Support</h3><button type="button" onClick={() => void saveStudentSupports()} disabled={isLoadingSupport || isSavingSupport} className="min-h-9 rounded-lg bg-primary px-3 text-xs font-bold text-on-primary disabled:opacity-50">{isSavingSupport ? "Đang lưu" : "Lưu"}</button></div>
            {studentSupportError && <p role="alert" className="mt-3 rounded-lg bg-error-container/25 px-3 py-2 text-xs text-error">{studentSupportError}</p>}
            {studentSupportSuccess && <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{studentSupportSuccess}</p>}
            {isLoadingSupport ? <p className="mt-3 text-xs text-on-surface-variant">Đang tải...</p> : studentSupportOptions.length === 0 ? <p className="mt-3 text-xs text-on-surface-variant">Chưa có nhân sự hỗ trợ.</p> : <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">{studentSupportOptions.map((staff) => { const supportId=staff.authUserId; const checked=assignedSupportIds.includes(supportId); return <label key={supportId} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 ${checked ? "border-primary/45 bg-primary-container/15" : "border-outline-variant/40"}`}><input type="checkbox" checked={checked} onChange={() => setAssignedSupportIds((current) => checked ? current.filter((id) => id !== supportId) : [...current, supportId])} className="h-4 w-4 rounded border-outline accent-primary" /><span className="min-w-0 truncate text-xs font-semibold">{staff.fullName}</span></label>; })}</div>}
          </section>}
        </div>
      </details>}
    </div>
  );
}
