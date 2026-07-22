import {
  ArrowLeft,
  BookOpenText,
  CalendarBlank,
  CaretRight,
  ChartLineUp,
  CheckCircle,
  Clock,
  GridFour,
  MagnifyingGlass,
  Plus,
  UsersThree,
} from "@phosphor-icons/react";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { AcademicClass, Course, Enrollment, Page, StudentSummary } from "../academic-types";
import { classStatusLabel, date } from "../academic-types";
import { LoadState, StatusBadge } from "../components/AdminUi";
import { apiFetch } from "../lib/api";

import CourseOverview from "../components/course/CourseOverview";
import CourseSchedule from "../components/course/CourseSchedule";
import CourseStudents from "../components/course/CourseStudents";
import CourseAttendance from "../components/course/CourseAttendance";
import CourseProgress from "../components/course/CourseProgress";
import CourseMatrix from "../components/course/CourseMatrix";
import StudentProfileDetail from "../components/enrollment/StudentProfileDetail";

type Tab = "overview" | "schedule" | "students" | "attendance" | "progress" | "matrix";

const tabs: { id: Tab; label: string; icon: typeof BookOpenText }[] = [
  { id: "overview", label: "Tổng quan", icon: ChartLineUp },
  { id: "schedule", label: "Thời khóa biểu", icon: CalendarBlank },
  { id: "students", label: "Học viên", icon: UsersThree },
  { id: "attendance", label: "Điểm danh", icon: CheckCircle },
  { id: "progress", label: "Tiến độ 4 kỹ năng", icon: ChartLineUp },
  { id: "matrix", label: "Ma trận hoạt động", icon: GridFour },
];


function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const deferredQuery = useDeferredValue(query);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [coursePage, classPage] = await Promise.all([
        apiFetch<Page<Course>>("/admin/courses?size=100"),
        apiFetch<Page<AcademicClass>>("/admin/classes?size=100"),
      ]);
      setCourses(coursePage.content);
      setClasses(classPage.content);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không tải được dữ liệu khóa học");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => courses.filter(course => {
    const ownedClasses = classes.filter(item => item.courseId === course.id);
    const matchesText = `${course.code} ${course.name} ${course.level ?? ""} ${ownedClasses.map(item => item.code).join(" ")}`
      .toLowerCase().includes(deferredQuery.trim().toLowerCase());
    const matchesStatus = status === "all" || ownedClasses.some(item => item.status === status);
    return matchesText && matchesStatus;
  }), [classes, courses, deferredQuery, status]);

  const activeClasses = classes.filter(item => item.status === "IN_PROGRESS").length;
  const enrollingClasses = classes.filter(item => item.status === "ENROLLING").length;

  return (
    <section className="mx-auto max-w-[1480px] space-y-6">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-primary">Tổ chức đào tạo</span>
          <h1 className="font-display text-3xl font-bold tracking-tight text-on-background md:text-4xl">Khóa học và lớp học</h1>
          <p className="mt-2 max-w-2xl text-on-surface-variant">Quản lý chương trình, các lớp đang vận hành và toàn bộ tiến độ học tập trong một không gian.</p>
        </div>
        <Link to="/enrollments" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary transition-colors hover:bg-on-primary-container focus:outline-none focus:ring-4 focus:ring-primary/20">
          <Plus size={18} weight="bold" /> Ghi danh học viên
        </Link>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Chương trình", courses.length, "Đang được cấu hình"],
          ["Lớp đang học", activeClasses, "Cần theo dõi hằng ngày"],
          ["Lớp đang tuyển", enrollingClasses, "Sẵn sàng ghi danh"],
        ].map(([label, value, note]) => (
          <div key={label} className="rounded-2xl border border-outline-variant/40 bg-surface p-5">
            <p className="text-sm font-semibold text-on-surface-variant">{label}</p>
            <p className="mt-2 font-display text-3xl font-bold tabular-nums text-on-surface">{value}</p>
            <p className="mt-1 text-xs text-on-surface-variant">{note}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant/40 bg-surface p-4 md:flex-row md:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Tìm khóa học hoặc lớp</span>
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" size={19} />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm theo tên, mã khóa hoặc mã lớp" className="min-h-11 w-full rounded-xl border-outline-variant/60 bg-surface pl-11 text-sm focus:border-primary focus:ring-primary" />
        </label>
        <label className="flex items-center gap-3 text-sm font-semibold text-on-surface-variant">
          Trạng thái lớp
          <select value={status} onChange={event => setStatus(event.target.value)} className="min-h-11 rounded-xl border-outline-variant/60 bg-surface pr-9 text-sm focus:border-primary focus:ring-primary">
            <option value="all">Tất cả</option>
            <option value="ENROLLING">Đang tuyển sinh</option>
            <option value="IN_PROGRESS">Đang học</option>
            <option value="PLANNED">Lên kế hoạch</option>
            <option value="COMPLETED">Đã hoàn thành</option>
          </select>
        </label>
      </div>

      <LoadState loading={loading} error={error} empty={!visible.length} onRetry={() => void load()} />

      {!loading && !error && visible.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-2">
          {visible.map(course => {
            const ownedClasses = classes.filter(item => item.courseId === course.id);
            const current = ownedClasses.find(item => item.status === "IN_PROGRESS") ?? ownedClasses[0];
            return (
              <Link key={course.id} to={`/courses/${course.id}${current ? `?classId=${current.id}` : ""}`} className="group rounded-2xl border border-outline-variant/40 bg-surface p-5 transition-colors hover:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/20">
                <div className="flex items-start justify-between gap-5">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-primary-container/20 px-2.5 py-1 text-xs font-bold text-primary">{course.code}</span>
                      <span className="text-xs font-semibold text-on-surface-variant">{course.level || "Chưa đặt trình độ"}</span>
                    </div>
                    <h2 className="font-display text-xl font-bold text-on-surface group-hover:text-primary">{course.name}</h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-on-surface-variant">{course.description || "Chương trình chưa có mô tả."}</p>
                  </div>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-outline-variant/50 text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary"><CaretRight size={20} /></span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-outline-variant/30 pt-4 text-sm">
                  <div><span className="block text-xs text-on-surface-variant">Lớp học</span><strong className="mt-1 block tabular-nums">{ownedClasses.length}</strong></div>
                  <div><span className="block text-xs text-on-surface-variant">Số session</span><strong className="mt-1 block tabular-nums">{course.totalSessions ?? "Chưa đặt"}</strong></div>
                  <div><span className="block text-xs text-on-surface-variant">Band mục tiêu</span><strong className="mt-1 block tabular-nums">{course.targetBand ?? "Chưa đặt"}</strong></div>
                </div>
                {current && <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-surface-container-low px-3.5 py-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-on-surface">{current.name}</p><p className="mt-0.5 text-xs text-on-surface-variant">{current.code} · {date(current.startsOn)}</p></div><StatusBadge value={current.status}>{classStatusLabel[current.status]}</StatusBadge></div>}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Workspace() {
  const { courseId = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") as Tab | null;
  const activeTab: Tab = tabs.some(tab => tab.id === requestedTab) ? requestedTab! : "overview";
  const [course, setCourse] = useState<Course | null>(null);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(searchParams.get("classId") || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [courseData, classPage, studentPage] = await Promise.all([
        apiFetch<Course>(`/admin/courses/${courseId}`),
        apiFetch<Page<AcademicClass>>(`/admin/classes?courseId=${courseId}&size=100`),
        apiFetch<Page<StudentSummary>>("/admin/students?size=100"),
      ]);
      const owned = classPage.content.filter(item => item.courseId === courseId);
      setCourse(courseData); setClasses(owned); setStudents(studentPage.content);
      const chosen = selectedClassId && owned.some(item => item.id === selectedClassId) ? selectedClassId : owned[0]?.id ?? "";
      setSelectedClassId(chosen);
      if (chosen) {
        const enrollmentPage = await apiFetch<Page<Enrollment>>(`/admin/enrollments?classId=${chosen}&size=100`);
        setEnrollments(enrollmentPage.content);
      }
    } catch (value) { setError(value instanceof Error ? value.message : "Không tải được không gian khóa học"); }
    finally { setLoading(false); }
  }, [courseId, selectedClassId]);

  useEffect(() => { void load(); }, [load]);

  const selectedClass = classes.find(item => item.id === selectedClassId) ?? null;
  const roster = enrollments.map(enrollment => ({ enrollment, student: students.find(item => item.id === enrollment.studentId) })).filter(item => item.student);
  const totalSessions = course?.totalSessions ?? 20;
  const completedSessions = selectedClass?.status === "COMPLETED" ? totalSessions : Math.min(totalSessions, Math.max(1, Math.round(totalSessions * 0.55)));

  function setTab(tab: Tab) {
    const next = new URLSearchParams(searchParams); next.set("tab", tab); if (selectedClassId) next.set("classId", selectedClassId); setSearchParams(next);
  }
  async function changeClass(value: string) {
    setSelectedClassId(value); const next = new URLSearchParams(searchParams); next.set("classId", value); setSearchParams(next);
    try { const page = await apiFetch<Page<Enrollment>>(`/admin/enrollments?classId=${value}&size=100`); setEnrollments(page.content); } catch { setEnrollments([]); }
  }

  if (loading) return <div className="mx-auto max-w-[1480px]"><LoadState loading error="" empty={false} onRetry={() => void load()} /></div>;
  if (error || !course) return <div className="mx-auto max-w-[1480px]"><LoadState loading={false} error={error || "Không tìm thấy khóa học"} empty={false} onRetry={() => void load()} /></div>;

  return (
    <section className="mx-auto max-w-[1480px] space-y-5">
      <button onClick={() => navigate("/courses")} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-on-surface-variant hover:text-primary focus:outline-none focus:ring-4 focus:ring-primary/20"><ArrowLeft size={18} /> Quay lại danh sách khóa học</button>
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-lg bg-primary-container/20 px-2.5 py-1 text-xs font-bold text-primary">{course.code}</span><span className="text-xs font-semibold text-on-surface-variant">{course.level || "Chưa đặt trình độ"}</span></div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-on-background md:text-4xl">{course.name}</h1>
          <p className="mt-2 max-w-3xl text-on-surface-variant">{course.description || "Theo dõi vận hành, học viên và chất lượng đào tạo theo từng lớp."}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {selectedClassId && <Link to={`/enrollments?classId=${selectedClassId}&action=create`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary transition-colors hover:bg-on-primary-container focus:outline-none focus:ring-4 focus:ring-primary/20"><Plus size={18} weight="bold" /> Thêm học viên vào lớp</Link>}
          <label className="flex min-w-[280px] flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Lớp đang xem<select value={selectedClassId} onChange={event => void changeClass(event.target.value)} className="min-h-11 rounded-xl border-outline-variant/60 bg-surface text-sm font-semibold normal-case tracking-normal focus:border-primary focus:ring-primary">{classes.map(item => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}</select></label>
        </div>
      </header>

      {selectedClass && <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-outline-variant/40 bg-surface px-5 py-4 text-sm"><StatusBadge value={selectedClass.status}>{classStatusLabel[selectedClass.status]}</StatusBadge><span className="flex items-center gap-2 text-on-surface-variant"><CalendarBlank size={17} /> {date(selectedClass.startsOn)} đến {date(selectedClass.endsOn)}</span><span className="flex items-center gap-2 text-on-surface-variant"><UsersThree size={17} /> {roster.length}/{selectedClass.capacity} học viên</span><span className="flex items-center gap-2 text-on-surface-variant"><Clock size={17} /> {completedSessions}/{totalSessions} session</span></div>}

      <nav aria-label="Nội dung khóa học" className="overflow-x-auto border-b border-outline-variant/50"><div className="flex min-w-max gap-1">{tabs.map(tab => { const Icon = tab.icon; return <button key={tab.id} onClick={() => setTab(tab.id)} className={`inline-flex min-h-12 items-center gap-2 border-b-2 px-4 text-sm font-bold transition-colors focus:outline-none focus:ring-4 focus:ring-primary/20 ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}><Icon size={18} />{tab.label}</button>; })}</div></nav>

      {activeTab === "overview" && <CourseOverview course={course} selectedClass={selectedClass} roster={roster as any} completedSessions={completedSessions} totalSessions={totalSessions} setTab={setTab} onSelectStudent={setSelectedStudentId} />}
      {activeTab === "schedule" && <CourseSchedule totalSessions={totalSessions} completedSessions={completedSessions} />}
      {activeTab === "students" && <CourseStudents roster={roster as any} onSelectStudent={setSelectedStudentId} />}
      {activeTab === "attendance" && <CourseAttendance roster={roster as any} completedSessions={completedSessions} onSelectStudent={setSelectedStudentId} />}
      {activeTab === "progress" && <CourseProgress roster={roster as any} onSelectStudent={setSelectedStudentId} />}
      {activeTab === "matrix" && <CourseMatrix roster={roster as any} completedSessions={completedSessions} />}

      {/* Student detailed profile drawer */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-50 bg-on-background/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-5xl bg-surface h-full shadow-2xl overflow-y-auto p-6 relative">
            <StudentProfileDetail
              studentId={selectedStudentId}
              onClose={() => setSelectedStudentId(null)}
            />
          </div>
        </div>
      )}
    </section>
  );
}

export function CourseManagementPage() {
  const { courseId } = useParams();
  return courseId ? <Workspace /> : <CourseList />;
}
