import type {
  StudentSupportCourse,
  StudentSupportCourseProgress,
  StudentSupportStudent,
} from "@ielts/contracts";
import { ChartLineUp, GraduationCap, SpinnerGap, Users, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

type Page<T> = { content: T[]; totalElements: number };

function averageProgress(
  studentId: string,
  activities: StudentSupportCourseProgress[],
): number | null {
  const values = activities.flatMap((activity) => activity.attempts)
    .filter((attempt) => attempt.studentId === studentId)
    .map((attempt) => attempt.comprehensionPercent
      ?? (attempt.score !== null && attempt.maxScore ? Math.round((attempt.score / attempt.maxScore) * 100) : null))
    .filter((value): value is number => value !== null);
  return values.length === 0 ? null : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function CourseStatus({ status }: { status: StudentSupportCourse["status"] }) {
  const label = {
    OPEN: "Đang tuyển sinh",
    ACTIVE: "Đang học",
    COMPLETED: "Đã hoàn thành",
    CANCELLED: "Đã hủy",
  }[status];
  return <span className="rounded-full bg-primary-container/20 px-2.5 py-1 text-xs font-bold text-primary">{label}</span>;
}

export function StudentSupportCoursesPage() {
  const [courses, setCourses] = useState<StudentSupportCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentSupportStudent[]>([]);
  const [progress, setProgress] = useState<StudentSupportCourseProgress[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void apiFetch<StudentSupportCourse[]>("/student-support/courses")
      .then((data) => {
        if (!active) return;
        setCourses(data);
        setSelectedCourseId((current) => current ?? data[0]?.id ?? null);
      })
      .catch((value: unknown) => {
        if (active) setError(value instanceof Error ? value.message : "Không tải được khóa học được phân công.");
      })
      .finally(() => {
        if (active) setIsLoadingCourses(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCourseId) {
      setStudents([]);
      setProgress([]);
      return;
    }
    let active = true;
    setIsLoadingDetail(true);
    setError("");
    void Promise.all([
      apiFetch<Page<StudentSupportStudent>>(`/student-support/courses/${selectedCourseId}/students?size=100`),
      apiFetch<StudentSupportCourseProgress[]>(`/student-support/courses/${selectedCourseId}/progress`),
    ])
      .then(([studentPage, activityProgress]) => {
        if (!active) return;
        setStudents(studentPage.content);
        setProgress(activityProgress);
      })
      .catch((value: unknown) => {
        if (active) setError(value instanceof Error ? value.message : "Không tải được dữ liệu hỗ trợ học viên.");
      })
      .finally(() => {
        if (active) setIsLoadingDetail(false);
      });
    return () => {
      active = false;
    };
  }, [selectedCourseId]);

  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? null;
  const learnerProgress = useMemo(() => new Map(students.map((student) => [
    student.studentId,
    averageProgress(student.studentId, progress),
  ])), [progress, students]);
  const atRisk = students.filter((student) => {
    const score = learnerProgress.get(student.studentId);
    return score !== undefined && score !== null && score < 65;
  });

  if (isLoadingCourses) {
    return <div className="app-loader" role="status"><SpinnerGap className="spin" />Đang tải các khóa được phân công...</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="auth-kicker">HỖ TRỢ HỌC VIÊN</p>
          <h1 className="font-display text-3xl font-extrabold text-on-surface">Khóa học được phân công</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Theo dõi tiến độ và liên hệ hỗ trợ học viên trong phạm vi khóa học của bạn.</p>
        </div>
      </header>

      {error && <p role="alert" className="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">{error}</p>}

      {courses.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-outline-variant bg-surface p-10 text-center">
          <GraduationCap size={36} className="mx-auto text-primary" />
          <h2 className="mt-3 font-display text-xl font-bold">Chưa có khóa học được phân công</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Quản trị viên cần phân công bạn vào một khóa học trước khi dữ liệu học viên xuất hiện ở đây.</p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => setSelectedCourseId(course.id)}
                aria-pressed={course.id === selectedCourseId}
                className={`rounded-2xl border p-5 text-left transition ${course.id === selectedCourseId
                  ? "border-primary bg-primary-container/15 shadow-sm"
                  : "border-outline-variant/60 bg-surface hover:border-primary/40"}`}
              >
                <div className="flex items-start justify-between gap-3"><span className="text-xs font-extrabold text-primary">{course.code}</span><CourseStatus status={course.status} /></div>
                <h2 className="mt-3 font-display text-lg font-bold text-on-surface">{course.name}</h2>
                <p className="mt-1 text-sm text-on-surface-variant">{course.skillPair === "LISTENING_READING" ? "Listening & Reading" : "Speaking & Writing"} · Band mục tiêu {course.targetBand ?? "—"}</p>
              </button>
            ))}
          </section>

          {selectedCourse && (
            <section className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="font-display text-2xl font-extrabold">{selectedCourse.name}</h2><p className="text-sm text-on-surface-variant">Dữ liệu chỉ thuộc khóa học này.</p></div>
                {isLoadingDetail && <span className="inline-flex items-center gap-2 text-sm text-on-surface-variant"><SpinnerGap className="spin" />Đang đồng bộ</span>}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <article className="rounded-2xl border border-outline-variant/50 bg-surface p-5"><Users size={22} className="text-primary" /><p className="mt-3 text-2xl font-extrabold">{students.length}</p><p className="text-sm text-on-surface-variant">Học viên trong khóa</p></article>
                <article className="rounded-2xl border border-outline-variant/50 bg-surface p-5"><ChartLineUp size={22} className="text-primary" /><p className="mt-3 text-2xl font-extrabold">{progress.length}</p><p className="text-sm text-on-surface-variant">Hoạt động đã công bố</p></article>
                <article className="rounded-2xl border border-outline-variant/50 bg-surface p-5"><WarningCircle size={22} className="text-error" /><p className="mt-3 text-2xl font-extrabold">{atRisk.length}</p><p className="text-sm text-on-surface-variant">Cần ưu tiên hỗ trợ</p></article>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-outline-variant/50 bg-surface">
                <table className="min-w-full text-left text-sm"><thead className="bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant"><tr><th className="px-5 py-3">Học viên</th><th className="px-5 py-3">Liên hệ</th><th className="px-5 py-3">Ghi danh</th><th className="px-5 py-3">Tiến độ</th></tr></thead><tbody>{students.map((student) => {
                  const score = learnerProgress.get(student.studentId);
                  return <tr key={student.studentId} className="border-t border-outline-variant/35"><td className="px-5 py-4"><strong className="block text-on-surface">{student.fullName}</strong><span className="text-xs text-on-surface-variant">{student.studentCode} · Band {student.currentBand ?? "—"} → {student.targetBand ?? "—"}</span></td><td className="px-5 py-4 text-on-surface-variant">{student.phone ?? student.email ?? "Chưa có thông tin"}</td><td className="px-5 py-4"><span className="font-semibold">{student.enrollmentStatus}</span></td><td className="px-5 py-4"><span className={`font-extrabold ${score !== null && score !== undefined && score < 65 ? "text-error" : "text-primary"}`}>{score === null || score === undefined ? "Chưa có bài làm" : `${score}%`}</span></td></tr>;
                })}</tbody></table>
                {!isLoadingDetail && students.length === 0 && <p className="px-5 py-8 text-center text-sm text-on-surface-variant">Khóa học chưa có học viên ghi danh.</p>}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
