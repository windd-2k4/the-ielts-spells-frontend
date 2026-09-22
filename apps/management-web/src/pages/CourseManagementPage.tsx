import {
  ArrowCounterClockwise, ArrowLeft, BookOpenText, Books, CalendarBlank,
  CaretRight, ChartLineUp, CheckCircle, Clock, DotsThreeVertical, GridFour,
  MagnifyingGlass, PencilSimple, Plus, Trash, UsersThree, X,
} from "@phosphor-icons/react";
import { FormEvent, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { ClassSession, Course, CourseForm, Enrollment, Page, StudentSummary } from "../academic-types";
import { classStatusLabel, courseEmpty, date, skillPairLabel } from "../academic-types";
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
import StudentProfileDetail from "../components/enrollment/StudentProfileDetail";
import CourseEnrollmentModal from "../components/enrollment/CourseEnrollmentModal";

type Tab = "overview" | "schedule" | "students" | "attendance" | "progress" | "matrix" | "library";
const tabs: { id: Tab; label: string; icon: typeof BookOpenText }[] = [
  { id: "overview", label: "Tổng quan", icon: ChartLineUp },
  { id: "schedule", label: "Thời khóa biểu", icon: CalendarBlank },
  { id: "students", label: "Học viên", icon: UsersThree },
  { id: "attendance", label: "Điểm danh", icon: CheckCircle },
  { id: "progress", label: "Tiến độ kỹ năng", icon: ChartLineUp },
  { id: "matrix", label: "Ma trận hoạt động", icon: GridFour },
  { id: "library", label: "Học liệu", icon: Books },
];

function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [activityFilter, setActivityFilter] = useState<"active" | "inactive" | "all">("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [openMenuCourseId, setOpenMenuCourseId] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      let url = "/admin/courses?size=100";
      if (activityFilter === "active") url = "/admin/courses?active=true&size=100";
      else if (activityFilter === "inactive") url = "/admin/courses?active=false&size=100";
      setCourses((await apiFetch<Page<Course>>(url)).content);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không tải được dữ liệu khóa học");
    } finally {
      setLoading(false);
    }
  }, [activityFilter]);

  useEffect(() => { void load(); }, [load]);

  // Close card action dropdown when clicking anywhere outside
  useEffect(() => {
    const handleWindowClick = () => setOpenMenuCourseId(null);
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

  const visible = useMemo(() => courses.filter(course => {
    const matchesText = `${course.code} ${course.name} ${course.level ?? ""} ${skillPairLabel[course.skillPair]}`.toLowerCase().includes(deferredQuery.trim().toLowerCase());
    return matchesText && (status === "all" || course.status === status);
  }), [courses, deferredQuery, status]);

  const active = courses.filter(item => item.status === "ACTIVE").length;
  const enrolling = courses.filter(item => item.status === "OPEN").length;

  return (
    <section className="mx-auto max-w-[1480px] space-y-6">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-primary">Tổ chức đào tạo</span>
          <h1 className="font-display text-3xl font-bold tracking-tight text-on-background md:text-4xl">Quản lý khóa học</h1>
          <p className="mt-2 max-w-2xl text-on-surface-variant">Mỗi khóa học là một nhóm học thực tế, có lịch, giáo viên, học viên và một cặp kỹ năng cố định.</p>
        </div>
        <button onClick={() => setDialogOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary transition-colors hover:bg-on-primary-container focus:outline-none focus:ring-4 focus:ring-primary/20 shadow-sm">
          <Plus size={18} weight="bold" /> Tạo khóa học
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Tổng khóa học", courses.length, activityFilter === "inactive" ? "Đã ngừng hoạt động / lưu trữ" : "Đang quản lý"],
          ["Đang học", active, "Cần theo dõi hằng ngày"],
          ["Đang tuyển", enrolling, "Sẵn sàng ghi danh"],
        ].map(([label, value, note]) => (
          <div key={label} className="rounded-2xl border border-outline-variant/40 bg-surface p-5 shadow-sm">
            <p className="text-sm font-semibold text-on-surface-variant">{label}</p>
            <p className="mt-2 font-display text-3xl font-bold tabular-nums text-on-surface">{value}</p>
            <p className="mt-1 text-xs text-on-surface-variant">{note}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant/40 bg-surface p-4 md:flex-row md:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Tìm khóa học</span>
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" size={19} />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm theo tên, mã hoặc cặp kỹ năng" className="min-h-11 w-full rounded-xl border-outline-variant/60 bg-surface pl-11 text-sm focus:border-primary focus:ring-primary" />
        </label>

        <div className="flex items-center gap-2">
          {/* Lọc hoạt động */}
          <select
            aria-label="Lọc trạng thái hoạt động"
            value={activityFilter}
            onChange={event => setActivityFilter(event.target.value as any)}
            className="min-h-11 rounded-xl border-outline-variant/60 bg-surface pr-9 text-sm focus:border-primary focus:ring-primary font-semibold"
          >
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã ngừng hoạt động</option>
            <option value="all">Tất cả (cả lưu trữ)</option>
          </select>

          {/* Lọc trạng thái đào tạo */}
          <select
            aria-label="Lọc trạng thái đào tạo"
            value={status}
            onChange={event => setStatus(event.target.value)}
            className="min-h-11 rounded-xl border-outline-variant/60 bg-surface pr-9 text-sm focus:border-primary focus:ring-primary"
          >
            <option value="all">Tất cả tiến độ</option>
            <option value="OPEN">Chuẩn bị & tuyển sinh</option>
            <option value="ACTIVE">Đang học</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
      </div>

      <LoadState loading={loading} error={error} empty={!visible.length} onRetry={() => void load()} />

      {!loading && !error && visible.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-2">
          {visible.map(course => (
            <div
              key={course.id}
              className="group relative rounded-2xl border border-outline-variant/40 bg-surface p-5 transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <Link to={`/courses/${course.id}`} className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-primary-container/20 px-2.5 py-1 text-xs font-bold text-primary">
                      {course.code}
                    </span>
                    <StatusBadge value={course.status}>{classStatusLabel[course.status]}</StatusBadge>
                    {!course.isActive && (
                      <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-700">
                        Đã ngừng HĐ
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-xl font-bold text-on-surface group-hover:text-primary transition-colors">
                    {course.name}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-on-surface-variant">
                    {course.description || "Chưa có mô tả."}
                  </p>
                </Link>

                {/* 3-DOTS ACTION DROPDOWN & ARROW */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenMenuCourseId(openMenuCourseId === course.id ? null : course.id);
                      }}
                      title="Tùy chọn thao tác"
                      className="grid h-10 w-10 place-items-center rounded-xl border border-outline-variant/40 bg-surface text-on-surface-variant hover:border-primary/50 hover:text-primary hover:bg-surface-container-high transition-colors shadow-sm"
                    >
                      <DotsThreeVertical size={20} weight="bold" />
                    </button>

                    {openMenuCourseId === course.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-12 z-30 w-52 rounded-xl border border-outline-variant/50 bg-surface p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-100"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenMenuCourseId(null);
                            setEditingCourse(course);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors"
                        >
                          <PencilSimple size={16} weight="bold" />
                          <span>Chỉnh sửa thông tin</span>
                        </button>
                        <div className="my-1 border-t border-outline-variant/30" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenMenuCourseId(null);
                            setDeletingCourse(course);
                          }}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-bold transition-colors ${
                            course.isActive
                              ? "text-error hover:bg-error-container/20"
                              : "text-primary hover:bg-primary-container/20"
                          }`}
                        >
                          {course.isActive ? (
                            <>
                              <Trash size={16} weight="bold" />
                              <span>Ngừng hoạt động / Xóa</span>
                            </>
                          ) : (
                            <>
                              <ArrowCounterClockwise size={16} weight="bold" />
                              <span>Khôi phục / Quản lý</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/courses/${course.id}`}
                    title="Mở không gian làm việc"
                    className="grid h-10 w-10 place-items-center rounded-xl border border-outline-variant/50 text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors"
                  >
                    <CaretRight size={18} />
                  </Link>
                </div>
              </div>

              <Link to={`/courses/${course.id}`} className="mt-5 grid grid-cols-3 gap-3 border-t border-outline-variant/30 pt-4 text-sm block">
                <div>
                  <span className="block text-xs text-on-surface-variant">Kỹ năng</span>
                  <strong className="mt-1 block">{skillPairLabel[course.skillPair]}</strong>
                </div>
                <div>
                  <span className="block text-xs text-on-surface-variant">Sĩ số</span>
                  <strong className="mt-1 block tabular-nums">{course.capacity}</strong>
                </div>
                <div>
                  <span className="block text-xs text-on-surface-variant">Khai giảng</span>
                  <strong className="mt-1 block">{date(course.startsOn)}</strong>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {dialogOpen && (
        <CourseDialog onClose={() => setDialogOpen(false)} onSaved={async () => { setDialogOpen(false); await load(); }} />
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
    setSaving(true);
    setError("");
    try {
      await apiFetch("/admin/courses", {
        method: "POST",
        body: JSON.stringify({
          programId: null,
          name: form.name,
          description: form.description || null,
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
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
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

  if (loading) return <LoadState loading error="" empty={false} onRetry={() => void load()} />;
  if (error || !course) return <LoadState loading={false} error={error || "Không tìm thấy khóa học"} empty={false} onRetry={() => void load()} />;

  const completed = sessions.filter(item => item.status === "COMPLETED").length;

  return (
    <section className="mx-auto max-w-[1480px] space-y-5">
      <button onClick={() => navigate("/courses")} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
        <ArrowLeft size={18} /> Quay lại danh sách
      </button>

      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-primary-container/20 px-2.5 py-1 text-xs font-bold text-primary">
              {course.code}
            </span>
            <StatusBadge value={course.status}>{classStatusLabel[course.status]}</StatusBadge>
            <span className="text-xs font-bold text-on-surface-variant">{skillPairLabel[course.skillPair]}</span>
            {!course.isActive && (
              <span className="rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                Đã ngừng hoạt động
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{course.name}</h1>
          <p className="mt-2 max-w-3xl text-on-surface-variant">
            {course.description || "Theo dõi lịch học, học viên và chất lượng đào tạo trong một không gian thống nhất."}
          </p>
        </div>

        {/* HEADER ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant/60 bg-surface px-4 py-2.5 text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors shadow-sm"
          >
            <PencilSimple size={18} weight="bold" />
            <span>Chỉnh sửa</span>
          </button>

          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors shadow-sm ${
              course.isActive
                ? "border-outline-variant/60 bg-surface text-on-surface-variant hover:text-error hover:border-error/40 hover:bg-error-container/10"
                : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
            }`}
          >
            {course.isActive ? <Trash size={18} /> : <ArrowCounterClockwise size={18} />}
            <span>{course.isActive ? "Ngừng hoạt động / Xóa" : "Khôi phục khóa học"}</span>
          </button>

          <button
            type="button"
            onClick={() => setEnrollmentOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary transition-colors hover:bg-on-primary-container focus:outline-none focus:ring-4 focus:ring-primary/20 shadow-sm"
          >
            <Plus size={18} weight="bold" /> Ghi danh học viên
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-outline-variant/40 bg-surface px-5 py-4 text-sm shadow-sm">
        <span className="flex items-center gap-2 text-on-surface-variant">
          <CalendarBlank size={17} />
          {date(course.startsOn)} đến {date(course.endsOn)}
        </span>
        <span className="flex items-center gap-2 text-on-surface-variant">
          <UsersThree size={17} />
          {roster.length}/{course.capacity} học viên
        </span>
        <span className="flex items-center gap-2 text-on-surface-variant">
          <Clock size={17} />
          {completed}/{sessions.length} session
        </span>
      </div>

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

      {activeTab === "overview" && <CourseOverview course={course} selectedClass={course} roster={roster} setTab={setTab} onSelectStudent={setSelectedStudentId} />}
      {activeTab === "schedule" && <CourseSchedule courseId={course.id} skillPair={course.skillPair} />}
      {activeTab === "students" && <CourseStudents courseId={course.id} skillPair={course.skillPair} roster={roster} onSelectStudent={setSelectedStudentId} onRosterChanged={load} />}
      {activeTab === "attendance" && <CourseAttendance courseId={course.id} roster={roster} onSelectStudent={setSelectedStudentId} />}
      {activeTab === "progress" && <CourseProgress courseId={course.id} roster={roster} onSelectStudent={setSelectedStudentId} />}
      {activeTab === "matrix" && <CourseMatrix courseId={course.id} roster={roster} />}
      {activeTab === "library" && <CourseLibrary courseId={course.id} />}
      {selectedStudentId && <StudentProfileDetail studentId={selectedStudentId} onClose={() => setSelectedStudentId(null)} />}

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

