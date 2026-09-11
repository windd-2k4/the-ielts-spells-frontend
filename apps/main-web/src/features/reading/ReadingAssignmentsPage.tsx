"use client";

import type { StudentReadingAssignment } from "@ielts/contracts";
import { BookOpenText, CalendarBlank, CircleNotch, Clock, Play, WarningCircle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { StudentSessionGate } from "@/features/student-auth/StudentSessionGate";
import { ReadingStatePanel } from "./ReadingStatePanel";
import { StudentPageHeader } from "./StudentPageHeader";
import { assignmentAvailability, formatDateTime, formatDuration, requestMessage } from "./readingFormat";
import { getReadingAssignments, startOrResumeReadingAttempt } from "./readingApi";

export function ReadingAssignmentsPage() {
  return <StudentSessionGate><ReadingAssignmentsContent /></StudentSessionGate>;
}

function ReadingAssignmentsContent() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<StudentReadingAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingId, setStartingId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setAssignments(await getReadingAssignments());
    } catch (failure) {
      setError(requestMessage(failure));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function start(assignmentId: string) {
    setStartingId(assignmentId);
    setError("");
    try {
      const attempt = await startOrResumeReadingAttempt(assignmentId);
      router.push(`/student/reading/attempts/${attempt.attemptId}`);
    } catch (failure) {
      setError(requestMessage(failure));
    } finally {
      setStartingId("");
    }
  }

  return <div className="min-h-dvh bg-[var(--surface-muted)] text-[var(--text)]">
    <a href="#reading-assignments" className="student-skip-link">Bỏ qua điều hướng đến danh sách bài Reading</a>
    <StudentPageHeader />
    <main id="reading-assignments" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold text-[var(--brand-pink)]">Không gian học viên</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Bài Reading của bạn</h1>
        <p className="mt-3 text-base leading-7 text-[var(--text-muted)]">Chọn một bài được giao để bắt đầu hoặc tiếp tục. Đáp án sẽ được lưu tự động trong khi làm bài.</p>
      </header>

      {error ? <div className="mt-6 flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--danger)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--danger)]" role="alert"><WarningCircle size={20} className="mt-0.5 shrink-0" weight="fill" aria-hidden="true" />{error}</div> : null}

      {loading ? <section className="mt-8 grid min-h-56 place-items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]" aria-busy="true"><span className="flex items-center gap-3 text-sm font-medium text-[var(--text-muted)]"><CircleNotch size={21} className="animate-spin text-[var(--brand-pink)]" aria-hidden="true" />Đang tải bài được giao</span></section> : null}
      {!loading && error ? <div className="mt-8"><ReadingStatePanel title="Không tải được bài Reading" message={error} actionLabel="Thử lại" onAction={() => void load()} tone="error" /></div> : null}
      {!loading && !error && assignments.length === 0 ? <div className="mt-8"><ReadingStatePanel title="Chưa có bài Reading nào được giao" message="Khi giáo viên giao bài cho khóa học của bạn, bài sẽ xuất hiện tại đây." /></div> : null}
      {!loading && !error && assignments.length > 0 ? <section className="mt-8 grid gap-4 lg:grid-cols-2" aria-label="Danh sách bài Reading">
        {assignments.map((assignment) => <AssignmentCard key={assignment.assignmentId} assignment={assignment} starting={startingId === assignment.assignmentId} onStart={start} />)}
      </section> : null}
    </main>
  </div>;
}

function AssignmentCard({ assignment, starting, onStart }: { assignment: StudentReadingAssignment; starting: boolean; onStart: (id: string) => void }) {
  const state = assignmentAvailability(assignment);
  const resume = Boolean(assignment.activeAttemptExpiresAt);
  return <article className="flex min-h-64 flex-col rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-6">
    <div className="flex items-start justify-between gap-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--brand-pink-soft)] text-[var(--brand-pink)]"><BookOpenText size={23} weight="fill" aria-hidden="true" /></span>
      <span className={`rounded-full px-3 py-1 text-xs font-bold ${state.available ? "bg-[var(--brand-pink-soft)] text-[var(--brand-pink)]" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"}`}>{state.label}</span>
    </div>
    <div className="mt-5 min-w-0">
      <p className="text-sm font-semibold text-[var(--brand-pink)]">{assignment.courseName}</p>
      <h2 className="mt-1 text-xl font-bold leading-7 text-[var(--text)]">{assignment.title}</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Phiên bản {assignment.versionLabel}</p>
    </div>
    <dl className="mt-6 grid gap-3 text-sm text-[var(--text-muted)] sm:grid-cols-2">
      <div className="flex items-center gap-2"><Clock size={18} className="text-[var(--brand-pink)]" aria-hidden="true" /><div><dt className="sr-only">Thời lượng</dt><dd>{assignment.durationSeconds ? formatDuration(assignment.durationSeconds) : "Theo thời lượng đề"}</dd></div></div>
      <div className="flex items-center gap-2"><CalendarBlank size={18} className="text-[var(--brand-pink)]" aria-hidden="true" /><div><dt className="sr-only">Hạn làm</dt><dd>Hạn: {formatDateTime(assignment.closesAt)}</dd></div></div>
      <div className="sm:col-span-2"><dt className="sr-only">Lượt làm</dt><dd>{assignment.attemptsUsed}/{assignment.maxAttempts} lượt đã dùng</dd></div>
    </dl>
    <button type="button" disabled={!state.available || starting} onClick={() => onStart(assignment.assignmentId)} className="mt-auto inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--brand-pink)] px-4 pt-3 text-sm font-bold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)] disabled:text-[var(--text-muted)]">
      {starting ? <CircleNotch size={19} className="animate-spin" aria-hidden="true" /> : <Play size={19} weight="fill" aria-hidden="true" />}
      {starting ? "Đang mở bài" : resume ? "Tiếp tục làm bài" : "Bắt đầu làm bài"}
    </button>
  </article>;
}
