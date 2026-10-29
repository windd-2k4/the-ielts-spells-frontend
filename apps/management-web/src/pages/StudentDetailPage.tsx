import { ArrowLeft, CalendarBlank, ChartLineUp, UserCircle } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Course, Enrollment, Page, Reservation, StudentDetail, StudentLearningInsights as LearningInsights, Transfer } from "../academic-types";
import { apiFetch } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import StudentProfileDetail from "../components/enrollment/StudentProfileDetail";
import StudentLearningInsights from "../components/student/StudentLearningInsights";
import AcademicHistoryView from "../components/student/academic-history/AcademicHistoryView";

export function StudentDetailPage() {
  const { studentId = "" } = useParams();
  const { roles } = useAuth();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [insights, setInsights] = useState<LearningInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState("");

  // Tab layout state
  const [activeTab, setActiveTab] = useState<"profile" | "learning" | "history">("profile");

  const loadInsights = useCallback(async () => {
    setInsightsLoading(true);
    setInsightsError("");
    try {
      setInsights(await apiFetch<LearningInsights>(`/admin/students/${studentId}/learning-insights`));
    } catch (value) {
      setInsightsError(value instanceof Error ? value.message : "Không tải được dữ liệu học tập");
    } finally {
      setInsightsLoading(false);
    }
  }, [studentId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [profile, enrollmentPage, coursePage] = await Promise.all([
        apiFetch<StudentDetail>(`/admin/students/${studentId}`),
        apiFetch<Page<Enrollment>>(`/admin/enrollments?studentId=${studentId}&size=100`),
        apiFetch<Page<Course>>("/admin/courses?size=100"),
      ]);
      const lifecycle = await Promise.all(
        enrollmentPage.content.flatMap(enrollment => [
          apiFetch<Reservation[]>(`/admin/enrollments/${enrollment.id}/reservations`).catch(() => []),
          apiFetch<Transfer[]>(`/admin/enrollments/${enrollment.id}/transfers`).catch(() => []),
        ])
      );
      setStudent(profile);
      setEnrollments(enrollmentPage.content);
      setCourses(coursePage.content);
      setReservations(lifecycle.filter((_, index) => index % 2 === 0).flat() as Reservation[]);
      setTransfers(lifecycle.filter((_, index) => index % 2 === 1).flat() as Transfer[]);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không tải được hồ sơ học viên");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void load();
    void loadInsights();
  }, [load, loadInsights]);

  const canApprove = roles.includes("admin");

  if (loading) return <State text="Đang tải hồ sơ học viên..." />;
  if (error || !student) return <State text={error || "Không tìm thấy học viên"} error />;

  return (
    <section className="mx-auto w-full max-w-[1440px] space-y-4">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          to="/students"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          <ArrowLeft size={18} /> Quay lại danh sách học viên
        </Link>
        <span className="hidden h-5 w-px bg-outline-variant/60 lg:block" aria-hidden="true" />
        <strong className="hidden max-w-48 truncate text-sm text-on-surface lg:block">{student.fullName}</strong>
        <nav className="flex min-w-0 flex-1 overflow-x-auto rounded-2xl border border-outline-variant/40 bg-surface p-1 no-scrollbar">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 ${
              activeTab === "profile"
                ? "bg-[#F3E6EB] text-[#8B3F56] shadow-[inset_0_-2px_0_#8B3F56]"
                : "text-on-surface-variant hover:text-primary hover:bg-primary-container/10"
            }`}
          >
            <UserCircle size={18} /> Tổng quan học viên
          </button>
          <button
            onClick={() => setActiveTab("learning")}
            className={`flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 ${
              activeTab === "learning"
                ? "bg-[#F3E6EB] text-[#8B3F56] shadow-[inset_0_-2px_0_#8B3F56]"
                : "text-on-surface-variant hover:text-primary hover:bg-primary-container/10"
            }`}
          >
            <ChartLineUp size={18} /> Kết quả &amp; lỗi thường gặp
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 ${
              activeTab === "history"
                ? "bg-[#F3E6EB] text-[#8B3F56] shadow-[inset_0_-2px_0_#8B3F56]"
                : "text-on-surface-variant hover:text-primary hover:bg-primary-container/10"
            }`}
          >
            <CalendarBlank size={18} /> Lịch sử học vụ &amp; Khóa học
            {enrollments.length > 0 && (
              <span
                className={`ml-1 px-2 py-0.5 text-xs rounded-full font-black ${
                  activeTab === "history" ? "bg-white text-[#8B3F56]" : "bg-primary-container/30 text-primary"
                }`}
              >
                {enrollments.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content 1: Overview & Skill Radar Profile */}
      {activeTab === "profile" && (
        <StudentProfileDetail
          studentId={studentId}
          insights={insights}
          insightsLoading={insightsLoading}
          insightsError={insightsError}
          enrollments={enrollments}
          courses={courses}
          onRetryInsights={() => void loadInsights()}
        />
      )}

      {/* Tab Content 2: Learning Insights & Test Results */}
      {activeTab === "learning" && (
        <StudentLearningInsights
          studentId={studentId}
          data={insights}
          loading={insightsLoading}
          error={insightsError}
          onRetry={() => void loadInsights()}
        />
      )}

      {/* Tab Content 3: Academic History, Courses & Lifecycle Audit Trail */}
      {activeTab === "history" && (
        <AcademicHistoryView
          student={student}
          enrollments={enrollments}
          courses={courses}
          reservations={reservations}
          transfers={transfers}
          canApprove={canApprove}
          onApprove={async (res, trf) => {
            await approve(res, trf, load, setError);
          }}
          onReject={async (res, trf) => {
            await reject(res, trf, load, setError);
          }}
          onReload={load}
        />
      )}
    </section>
  );
}

async function approve(
  reservation: Reservation | undefined,
  transfer: Transfer | undefined,
  reload: () => Promise<void>,
  setError: (v: string) => void
) {
  try {
    if (reservation) await apiFetch(`/admin/enrollments/reservations/${reservation.id}/approve`, { method: "PATCH" });
    else if (transfer) await apiFetch(`/admin/enrollments/transfers/${transfer.id}/approve`, { method: "PATCH" });
    await reload();
  } catch (value) {
    setError(value instanceof Error ? value.message : "Không thể duyệt yêu cầu");
  }
}

async function reject(
  reservation: Reservation | undefined,
  transfer: Transfer | undefined,
  reload: () => Promise<void>,
  setError: (v: string) => void
) {
  try {
    if (reservation) await apiFetch(`/admin/enrollments/reservations/${reservation.id}/reject`, { method: "PATCH" });
    else if (transfer) await apiFetch(`/admin/enrollments/transfers/${transfer.id}/reject`, { method: "PATCH" });
    await reload();
  } catch (value) {
    setError(value instanceof Error ? value.message : "Không thể từ chối yêu cầu");
  }
}

function State({ text, error }: { text: string; error?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-10 text-center ${
        error
          ? "border-error/30 bg-error-container/10 text-error"
          : "border-outline-variant/30 text-on-surface-variant"
      }`}
    >
      {text}
    </div>
  );
}
