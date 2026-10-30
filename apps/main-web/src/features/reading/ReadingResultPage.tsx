"use client";

import type {
  ReadingAttemptResult,
  SaveTestAttemptQuestionReviewRequest,
  StudentReadingAttempt,
  TestAttemptErrorReason,
  TestAttemptQuestionReview,
} from "@ielts/contracts";
import {
  ArrowLeft, CheckCircle, CircleNotch, Clock, ClockCountdown,
  FileText, ListChecks, Sparkle, Trophy, X, XCircle, ArrowRight, CaretDown,
  MinusCircle, Lightbulb, MagnifyingGlass, MapPin
} from "@phosphor-icons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StudentSessionGate } from "@/features/student-auth/StudentSessionGate";
import { ReadingStatePanel } from "./ReadingStatePanel";
import { StudentPageHeader } from "./StudentPageHeader";
import {
  answerValues,
  buildReadingOptionMap,
  formatDateTime,
  formatReadingAnswerList,
  groupQuestionLabel,
  requestMessage,
} from "./readingFormat";
import {
  deleteReadingAttemptReview,
  getReadingAttempt,
  getReadingAttemptResult,
  getReadingAttemptReviews,
  saveReadingAttemptReview,
} from "./readingApi";
import {
  fetchStudentCourseProgress,
  updateStudentProgressChecklist,
  updateStudentProgressSummary,
  type StudentProgressTask,
} from "@/features/student-hub/studentPortalApi";

type QuestionFilter = "ALL" | "CORRECT" | "INCORRECT" | "UNANSWERED";

const ERROR_REASON_OPTIONS: Array<{ value: TestAttemptErrorReason; label: string }> = [
  { value: "UNKNOWN_VOCABULARY", label: "Không biết từ" },
  { value: "LOST_FOCUS", label: "Mất tập trung" },
  { value: "DISTRACTOR", label: "Bị distractor đánh lừa" },
  { value: "SPELLING", label: "Sai spelling" },
  { value: "MISHEARD", label: "Nghe nhầm" },
  { value: "QUESTION_MISUNDERSTOOD", label: "Hiểu sai câu hỏi" },
  { value: "OTHER", label: "Lý do khác" },
];

const REVIEW_REMINDERS_KEY = "student-progress-review-reminders";

function removeScheduledReviewReminder(attemptId: string) {
  try {
    const rows = JSON.parse(window.localStorage.getItem(REVIEW_REMINDERS_KEY) || "[]") as Array<{ id: string }>;
    window.localStorage.setItem(REVIEW_REMINDERS_KEY, JSON.stringify(rows.filter((item) => item.id !== `local-review-${attemptId}`)));
    window.dispatchEvent(new Event("student-review-reminders-changed"));
  } catch {
    // A malformed local reminder must never block saving progress.
  }
}

function scheduleReviewReminder({
  attemptId,
  title,
  skill,
  deadline,
}: {
  attemptId: string;
  title: string;
  skill: "READING" | "LISTENING";
  deadline: string | null;
}) {
  if (!deadline) return;
  const deadlineAt = Date.parse(deadline);
  if (!Number.isFinite(deadlineAt) || deadlineAt <= Date.now()) return;
  try {
    const rows = JSON.parse(window.localStorage.getItem(REVIEW_REMINDERS_KEY) || "[]") as Array<Record<string, unknown>>;
    const notifyAt = new Date(Math.max(Date.now(), deadlineAt - 60 * 60_000)).toISOString();
    const reminder = {
      id: `local-review-${attemptId}`,
      type: "ASSIGNMENT_REVIEW_REMINDER",
      title: "Bạn còn checklist sau bài làm",
      body: `Hoàn tất phân tích “${title}” trước khi bài đóng.`,
      attemptId,
      skill,
      createdAt: notifyAt,
      readAt: null,
      link: `/student/${skill.toLowerCase()}/attempts/${attemptId}/result?review=1`,
      notifyAt,
    };
    window.localStorage.setItem(REVIEW_REMINDERS_KEY, JSON.stringify([...rows.filter((item) => item.id !== reminder.id), reminder]));
    window.dispatchEvent(new Event("student-review-reminders-changed"));
  } catch {
    // The course detail fallback remains available if local storage is blocked.
  }
}

export function ReadingResultPage({
  attemptId,
  skill = "READING",
}: {
  attemptId: string;
  skill?: "READING" | "LISTENING";
}) {
  return (
    <StudentSessionGate>
      <ReadingResultContent attemptId={attemptId} skill={skill} />
    </StudentSessionGate>
  );
}

function ReadingResultContent({
  attemptId,
  skill = "READING",
}: {
  attemptId: string;
  skill?: "READING" | "LISTENING";
}) {
  const skillPath = skill.toLowerCase();
  const skillLabel = skill === "LISTENING" ? "Listening" : "Reading";
  const searchParams = useSearchParams();
  const fromPlacement = searchParams.get("from") === "placement";

  const [result, setResult] = useState<ReadingAttemptResult | null>(null);
  const [attempt, setAttempt] = useState<StudentReadingAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<QuestionFilter>("ALL");
  const [reviews, setReviews] = useState<Record<string, TestAttemptQuestionReview>>({});
  const [progressTask, setProgressTask] = useState<StudentProgressTask | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressSaving, setProgressSaving] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [comprehension, setComprehension] = useState("0");
  const [errorAnalysis, setErrorAnalysis] = useState("");
  const [checklistValues, setChecklistValues] = useState<Record<string, boolean>>({});
  const [showQuestionDetails, setShowQuestionDetails] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const progressModalPrompted = useRef(false);
  const isAssignedAttempt = attempt?.attemptOrigin === "ASSIGNMENT" || Boolean(attempt?.assignmentId);
  const catalogUrl = isAssignedAttempt
    ? "/student/assignments"
    : `/student/practice?skill=${skill}`;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [res, att, reviewRows] = await Promise.all([
        getReadingAttemptResult(attemptId, skillPath),
        getReadingAttempt(attemptId, skillPath).catch(() => null),
        getReadingAttemptReviews(attemptId, skillPath).catch(() => []),
      ]);
      setResult(res);
      setAttempt(att);
      setReviews(Object.fromEntries(reviewRows.map((review) => [review.questionKey, review])));
    } catch (failure) {
      setError(requestMessage(failure));
    } finally {
      setLoading(false);
    }
  }, [attemptId, skillPath]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!attempt?.courseId || !attempt.classActivityId) {
      setProgressTask(null);
      return;
    }
    let active = true;
    setProgressLoading(true);
    void fetchStudentCourseProgress(attempt.courseId)
      .then((tasks) => {
        if (!active) return;
        const task = tasks.find((item) => item.classActivityId === attempt.classActivityId) ?? null;
        setProgressTask(task);
        setComprehension(task?.comprehensionPercent == null ? "0" : String(task.comprehensionPercent));
        setErrorAnalysis(task?.errorAnalysis ?? "");
        setChecklistValues(Object.fromEntries((task?.checklist ?? []).map((item) => [item.id, item.completed])));
      })
      .catch(() => {
        if (active) setProgressTask(null);
      })
      .finally(() => {
        if (active) setProgressLoading(false);
      });
    return () => { active = false; };
  }, [attempt?.classActivityId, attempt?.courseId]);

  async function saveProgressSummary() {
    if (!attempt?.courseId || !progressTask?.attemptId) return false;
    setProgressSaving(true);
    setProgressMessage("");
    try {
      await Promise.all([
        updateStudentProgressSummary(
          attempt.courseId,
          progressTask.attemptId,
          null,
          Number(comprehension),
          errorAnalysis.trim() || null,
        ),
        ...progressTask.checklist.map((item) => updateStudentProgressChecklist(
          attempt.courseId!,
          progressTask.attemptId!,
          item.id,
          Boolean(checklistValues[item.id]),
        )),
      ]);
      setProgressTask((current) => current ? {
        ...current,
        comprehensionPercent: Number(comprehension),
        errorAnalysis: errorAnalysis.trim() || null,
        checklist: current.checklist.map((item) => ({ ...item, completed: Boolean(checklistValues[item.id]) })),
      } : current);
      window.localStorage.removeItem(`post-attempt-review-deferred:${attemptId}`);
      removeScheduledReviewReminder(attemptId);
      setProgressMessage("Đã lưu báo cáo sau bài làm.");
      setShowProgressModal(false);
      return true;
    } catch (failure) {
      setProgressMessage(requestMessage(failure));
      return false;
    } finally {
      setProgressSaving(false);
    }
  }

  const optionMap = useMemo(() => buildReadingOptionMap(attempt?.sections), [attempt]);

  const typeBreakdown = useMemo(() => {
    if (!result) return [];
    const map = new Map<string, { typeName: string; total: number; correct: number; incorrect: number; unanswered: number }>();

    const typeLabelMap = new Map<string, string>();
    if (attempt) {
      for (const section of attempt.sections) {
        for (const group of section.questionGroups) {
          const label = groupQuestionLabel(group);
          for (const q of group.questions) {
            typeLabelMap.set(q.key, label);
          }
        }
      }
    }

    for (const q of result.questions) {
      const fallbackLabel = skill === "LISTENING" ? "Listening Questions" : "Reading Questions";
      const typeName = typeLabelMap.get(q.questionKey) || fallbackLabel;
      const current = map.get(typeName) || { typeName, total: 0, correct: 0, incorrect: 0, unanswered: 0 };
      current.total += 1;
      if (!q.answered) {
        current.unanswered += 1;
      } else if (q.correct) {
        current.correct += 1;
      } else {
        current.incorrect += 1;
      }
      map.set(typeName, current);
    }

    return Array.from(map.values());
  }, [attempt, result]);

  useEffect(() => {
    if (!result || !progressTask || errorAnalysis.trim()) return;
    const weakestType = [...typeBreakdown]
      .sort((left, right) => (right.incorrect + right.unanswered) - (left.incorrect + left.unanswered))[0];
    const summary = [
      `Hệ thống ghi nhận ${result.incorrectCount} câu sai và ${result.unansweredCount} câu bỏ trống.`,
      weakestType && weakestType.incorrect + weakestType.unanswered > 0
        ? `Nhóm cần ưu tiên luyện lại: ${weakestType.typeName} (${weakestType.incorrect + weakestType.unanswered}/${weakestType.total} câu chưa đạt).`
        : "Chưa phát hiện nhóm câu hỏi cần ưu tiên.",
      "Hãy kiểm tra lại nguyên nhân và chọn bước tự học phù hợp trước lần làm tiếp theo.",
    ].join(" ");
    setErrorAnalysis(summary);
  }, [errorAnalysis, progressTask, result, typeBreakdown]);

  useEffect(() => {
    if (progressModalPrompted.current || !result?.resultVisible || !isAssignedAttempt || !progressTask?.attemptId) return;
    const requiredDone = progressTask.checklist.filter((item) => item.required).every((item) => item.completed);
    const reportDone = requiredDone && Boolean(progressTask.errorAnalysis?.trim());
    const deferred = window.localStorage.getItem(`post-attempt-review-deferred:${attemptId}`) === "1";
    if (searchParams.get("review") === "1" || (!reportDone && !deferred)) {
      progressModalPrompted.current = true;
      setShowProgressModal(true);
    }
  }, [attemptId, isAssignedAttempt, progressTask, result?.resultVisible, searchParams]);

  function deferProgressReview() {
    window.localStorage.setItem(`post-attempt-review-deferred:${attemptId}`, "1");
    scheduleReviewReminder({
      attemptId,
      title: attempt?.title ?? `Bài ${skillLabel}`,
      skill,
      deadline: progressTask?.effectiveDueAt ?? null,
    });
    setShowProgressModal(false);
  }

  if (loading) {
    return <main className="grid min-h-dvh place-items-center bg-slate-50 px-4" aria-busy="true"><span className="flex items-center gap-3 text-sm font-medium text-slate-500"><CircleNotch size={22} className="animate-spin text-[#8f4458]" aria-hidden="true" />Đang tải kết quả bài làm...</span></main>;
  }

  if (error || !result) {
    return <main className="grid min-h-dvh place-items-center bg-slate-50 px-4"><div className="w-full max-w-xl"><ReadingStatePanel title="Chưa thể xem kết quả" message={error || "Kết quả chưa sẵn sàng."} actionLabel="Thử lại" onAction={() => void load()} tone="error" /><Link href={catalogUrl} className="mt-4 inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-bold text-[#8f4458] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]">Quay lại danh sách bài thi {skillLabel}</Link></div></main>;
  }

  const totalQuestions = result.correctCount + result.incorrectCount + result.unansweredCount;
  const timeTaken = formatDurationTime(attempt?.startedAt, result.submittedAt);

  const filteredQuestions = result.questions.filter((q) => {
    if (filter === "CORRECT") return q.correct === true;
    if (filter === "INCORRECT") return q.answered && q.correct === false;
    if (filter === "UNANSWERED") return !q.answered;
    return true;
  });

  const percentage = totalQuestions > 0 ? Math.round((result.correctCount / totalQuestions) * 100) : 0;

  let mascotTitle = "Hơi khó bạn nhỉ, bình tĩnh cùng luyện tập với The IELTS Spells nha!";
  if (percentage === 100) {
    mascotTitle = "Xuất sắc tuyệt đối! Bạn đã chinh phục trọn vẹn bài thi cùng The IELTS Spells!";
  } else if (percentage >= 80) {
    mascotTitle = `Kết quả tuyệt vời! Kỹ năng ${skillLabel} của bạn rất ấn tượng cùng The IELTS Spells!`;
  } else if (percentage >= 50) {
    mascotTitle = "Kết quả tốt! Bình tĩnh cùng luyện tập tiếp với The IELTS Spells nhé!";
  }

  return <div className="min-h-dvh bg-[#f8fafc] text-slate-800">
    <a href="#test-result" className="student-skip-link">Đến kết quả bài thi {skillLabel}</a>

    {/* Clean Top Navigation Bar */}
    <div className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href={catalogUrl} className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Thoát về danh sách đề">
            <X size={18} />
          </Link>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#8f4458]">The IELTS Spells</span>
          <span className="hidden text-slate-300 sm:inline">|</span>
          <span className="hidden truncate text-sm font-semibold text-slate-700 sm:inline max-w-md">{attempt?.title ?? `Kết quả bài ${skillLabel}`}</span>
          {attempt ? <span className="hidden rounded-full bg-[#F7E5EA] px-2 py-1 text-[10px] font-bold text-[#894C5B] md:inline">{isAssignedAttempt ? "Bài được giao" : "Tự luyện"}</span> : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Nộp lúc: {formatDateTime(result.submittedAt)}</span>
        </div>
      </div>
    </div>

    <main id="reading-result" className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">

      {!result.resultVisible ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ListChecks size={36} className="mx-auto text-[#8f4458]" weight="fill" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-bold text-slate-900">Bài làm đã được ghi nhận</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-600">Giáo viên đã chọn không hiển thị đáp án chi tiết ngay sau khi nộp. Kết quả bài làm của bạn đã được lưu thành công trên hệ thống.</p>
        </section>
      ) : (
        <>
          {/* Top 2 Main Cards (Side by Side) */}
          <div className="grid gap-6 sm:grid-cols-2">

            {/* Left Card: Motivational Mascot Card */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#eadca5] bg-[#fff7d9] p-7 text-[#4d3f21] shadow-md">
              <div className="relative z-10 space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f3e4a8] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#6d571a]">
                  <Sparkle size={14} weight="fill" /> The IELTS Spells
                </span>
                <h2 className="text-xl font-extrabold leading-snug tracking-tight text-[#433519] sm:text-2xl">
                  {mascotTitle}
                </h2>
              </div>

              <div className="relative z-10 mt-6 flex items-center justify-between border-t border-[#e6d99d] pt-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-12 place-items-center rounded-xl bg-[#f0d56c] text-[#6b5312]">
                    <Trophy size={26} weight="fill" />
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-[#786532]">Kết quả đạt được</span>
                    <strong className="text-lg font-black tracking-tight text-[#433519]">{result.correctCount}/{totalQuestions} câu đúng ({percentage}%)</strong>
                  </div>
                </div>
              </div>

              {/* Decorative Circle Background Pattern */}
              <div className="pointer-events-none absolute -right-12 -bottom-12 size-48 rounded-full bg-white/5 blur-2xl" />
            </div>

            {/* Right Card: Summary Donut Chart & Statistics */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-lg">Kết quả làm bài</h3>
                {timeTaken ? (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <Clock size={15} className="text-[#8f4458]" />
                    <span>Thời gian làm bài: <strong className="font-bold text-slate-800">{timeTaken}</strong></span>
                  </div>
                ) : null}
              </div>

              <div className="my-4 flex flex-col items-center justify-center gap-6 sm:flex-row sm:justify-around">
                {/* SVG Donut Chart */}
                <DonutChart correct={result.correctCount} incorrect={result.incorrectCount} unanswered={result.unansweredCount} />

                {/* Donut Legend */}
                <div className="space-y-2.5 text-sm font-semibold">
                  <div className="flex items-center gap-2.5">
                    <span className="size-3 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">Đúng:</span>
                    <strong className="font-bold text-slate-900">{result.correctCount} câu</strong>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="size-3 rounded-full bg-rose-500" />
                    <span className="text-slate-600">Sai:</span>
                    <strong className="font-bold text-slate-900">{result.incorrectCount} câu</strong>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="size-3 rounded-full bg-slate-300" />
                    <span className="text-slate-600">Bỏ qua:</span>
                    <strong className="font-bold text-slate-900">{result.unansweredCount} câu</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center">
                <Link
                  href={`/student/${skillPath}/attempts/${attemptId}/explanations#question-${result.questions[0]?.questionKey ?? "overview"}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 py-2 text-xs font-extrabold text-slate-700 transition hover:border-[#8f4458] hover:bg-[#8f4458] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]"
                >
                  Xem giải thích <span className="rounded-full bg-[#8f4458] px-2 py-0.5 text-[10px] font-black uppercase text-white">FREE</span>
                </Link>
              </div>
            </div>

          </div>

          {isAssignedAttempt && (progressLoading || progressTask) ? (
            <section className="relative overflow-hidden rounded-2xl border border-[#E8D5DC] bg-white p-5 shadow-[0_12px_32px_rgba(136,68,88,0.08)]" aria-label="Báo cáo sau bài làm">
              <span className="absolute inset-y-0 left-0 w-1.5 bg-[#D96E91]" aria-hidden="true" />
              <div className="flex flex-wrap items-center justify-between gap-5 pl-2">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#FFE9F0] text-[#B7476B]"><ListChecks size={24} weight="fill" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-slate-950">Báo cáo sau lần làm này</h3>
                      {progressTask ? <span className="rounded-full bg-[#EEF8F4] px-2.5 py-1 text-[11px] font-extrabold text-[#16715A]">{progressTask.checklist.filter((item) => checklistValues[item.id]).length}/{progressTask.checklist.length} mục</span> : null}
                    </div>
                    {progressTask ? <div className="mt-2 h-1.5 max-w-sm overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-[#D96E91] transition-all" style={{ width: `${progressTask.checklist.length ? Math.round((progressTask.checklist.filter((item) => checklistValues[item.id]).length / progressTask.checklist.length) * 100) : 0}%` }} /></div> : null}
                    {progressMessage ? <p role="status" className="mt-2 text-xs font-bold text-[#A33F60]">{progressMessage}</p> : null}
                  </div>
                </div>
                <button type="button" disabled={progressLoading || !progressTask} onClick={() => setShowProgressModal(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#B7476B] px-5 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(183,71,107,0.22)] transition hover:bg-[#A33F60] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7476B] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-55">
                  {progressLoading ? <CircleNotch size={17} className="animate-spin" /> : <ListChecks size={17} weight="bold" />} {progressLoading ? "Đang chuẩn bị…" : "Mở báo cáo"}
                </button>
              </div>
            </section>
          ) : null}

          {/* Detailed Question Type Breakdown Table ("Bảng dữ liệu chi tiết") */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-extrabold text-slate-900">Bảng dữ liệu chi tiết</h3>

            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-extrabold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">Loại câu hỏi</th>
                    <th scope="col" className="px-4 py-3.5 text-center">Số câu hỏi</th>
                    <th scope="col" className="px-4 py-3.5 text-center bg-emerald-500/10 text-emerald-700">Đúng</th>
                    <th scope="col" className="px-4 py-3.5 text-center">Sai</th>
                    <th scope="col" className="px-4 py-3.5 text-center">Bỏ qua</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                  {typeBreakdown.map((row, index) => (
                    <tr key={index} className="transition hover:bg-slate-50/60">
                      <td className="px-5 py-4 font-bold text-slate-900">{row.typeName}</td>
                      <td className="px-4 py-4 text-center font-semibold text-slate-600">{row.total}</td>
                      <td className="px-4 py-4 text-center font-bold text-emerald-600 bg-emerald-50/40">{row.correct}</td>
                      <td className="px-4 py-4 text-center font-bold text-rose-500">{row.incorrect}</td>
                      <td className="px-4 py-4 text-center font-bold text-slate-400">{row.unanswered}</td>
                    </tr>
                  ))}
                  {typeBreakdown.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-slate-400">Không có dữ liệu loại câu hỏi.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Detailed Question Review List with Explanations */}
          <section id="detailed-explanations" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-[#EEF6FF] text-[#3976B8]"><Lightbulb size={20} weight="fill" /></span>
                <div><h3 className="text-lg font-extrabold text-slate-900">Đáp án & phân tích từng câu</h3><span className="text-xs font-bold text-slate-400">{totalQuestions} câu</span></div>
              </div>

              {/* Filter Tabs */}
              {showQuestionDetails ? <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFilter("ALL")}
                  className={`rounded-lg px-3 py-1.5 transition ${filter === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Tất cả ({totalQuestions})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("CORRECT")}
                  className={`rounded-lg px-3 py-1.5 transition ${filter === "CORRECT" ? "bg-emerald-500 text-white shadow-sm" : "text-emerald-700 hover:bg-emerald-50"}`}
                >
                  <CheckCircle size={14} weight="fill" aria-hidden="true" /> Đúng ({result.correctCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("INCORRECT")}
                  className={`rounded-lg px-3 py-1.5 transition ${filter === "INCORRECT" ? "bg-rose-500 text-white shadow-sm" : "text-rose-600 hover:bg-rose-50"}`}
                >
                  <XCircle size={14} weight="fill" aria-hidden="true" /> Sai ({result.incorrectCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("UNANSWERED")}
                  className={`rounded-lg px-3 py-1.5 transition ${filter === "UNANSWERED" ? "bg-slate-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  <MinusCircle size={14} weight="fill" aria-hidden="true" /> Bỏ qua ({result.unansweredCount})
                </button>
              </div> : <button type="button" onClick={() => setShowQuestionDetails(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#BCD8F3] bg-[#F4F9FF] px-4 text-sm font-extrabold text-[#27679F] transition hover:bg-[#EAF4FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A8CC8]">
                <CaretDown size={16} weight="bold" /> Xem chi tiết
              </button>}
            </div>

            {showQuestionDetails ? <div className="space-y-3">
              <button type="button" onClick={() => setShowQuestionDetails(false)} className="text-xs font-bold text-slate-500 hover:text-[#894C5B]">Ẩn danh sách câu hỏi</button>
              {filteredQuestions.map((q) => (
                <article key={q.questionKey} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-extrabold text-slate-900 text-base">Câu {q.questionNo}</h4>
                    <QuestionStatusBadge correct={q.correct} answered={q.answered} score={q.score} maxScore={q.maxScore} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      {q.correctAnswers.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700 shrink-0">Đáp án chuẩn:</span>
                          <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                            {formatReadingAnswerList(q.correctAnswers, optionMap)}
                          </span>
                        </div>
                      ) : null}

                      {!q.correct && q.answered ? (() => {
                        const studentResp = attempt?.responses.find((r) => r.questionKey === q.questionKey);
                        const studentVals = answerValues(studentResp?.answer);
                        if (studentVals.length === 0) return null;
                        return (
                          <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 font-medium">
                            <span>Bạn chọn:</span>
                            <span className="font-bold">{formatReadingAnswerList(studentVals, optionMap)}</span>
                          </div>
                        );
                      })() : null}
                    </div>

                    {(Array.isArray(q.evidenceSpans) && q.evidenceSpans.length > 0) || q.evidenceSpan ? (
                      <Link
                        href={`/student/${skillPath}/attempts/${attemptId}/explanations#question-${q.questionKey}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50/80 px-2.5 py-1 text-xs font-bold text-orange-800 transition hover:border-orange-300 hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                        title="Di chuyển tới đoạn bằng chứng được highlight trong bài"
                      >
                        <MagnifyingGlass size={13} weight="bold" />
                        <span>Xem vị trí</span>
                      </Link>
                    ) : null}
                  </div>

                  {q.explanation && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-700">
                      <strong className="mb-1 flex items-center gap-1.5 font-bold text-slate-900"><Lightbulb size={15} weight="fill" aria-hidden="true" /> Lời giải chi tiết:</strong>
                      <p className="whitespace-pre-wrap">{q.explanation}</p>
                    </div>
                  )}

                  {(!q.answered || q.correct === false) ? (
                    <MistakeReviewForm
                      attemptId={attemptId}
                      questionKey={q.questionKey}
                      skill={skillPath}
                      initialReview={reviews[q.questionKey]}
                      onSaved={(review) => setReviews((current) => ({ ...current, [review.questionKey]: review }))}
                      onDeleted={() => setReviews((current) => {
                        const next = { ...current };
                        delete next[q.questionKey];
                        return next;
                      })}
                    />
                  ) : null}
                </article>
              ))}

              {filteredQuestions.length === 0 && (
                <div className="py-8 text-center text-sm font-semibold text-slate-500">
                  Không có câu hỏi nào trong mục này.
                </div>
              )}
            </div> : null}
          </section>
        </>
      )}

      {/* Return Buttons */}
      <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
        {fromPlacement && (
          <Link
            href="/student/placement-test/mocktest"
            className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#FF6B00] px-6 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#E65A00]"
          >
            <ArrowLeft size={18} weight="bold" />
            Tiếp tục bài Test đầu vào
          </Link>
        )}
        <Link
          href={catalogUrl}
          className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#8f4458] px-6 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#743447] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]"
        >
          <ArrowLeft size={18} />
          Về danh sách bài thi {skillLabel}
        </Link>
      </div>

    </main>
    {showProgressModal && progressTask ? <PostAttemptReviewModal
      task={progressTask}
      title={attempt?.title ?? `Bài ${skillLabel}`}
      correctCount={result.correctCount}
      incorrectCount={result.incorrectCount}
      unansweredCount={result.unansweredCount}
      typeBreakdown={typeBreakdown}
      comprehension={comprehension}
      errorAnalysis={errorAnalysis}
      checklistValues={checklistValues}
      saving={progressSaving}
      message={progressMessage}
      practiceUrl={catalogUrl}
      onComprehensionChange={setComprehension}
      onErrorAnalysisChange={setErrorAnalysis}
      onChecklistChange={(id, completed) => setChecklistValues((current) => ({ ...current, [id]: completed }))}
      onSave={saveProgressSummary}
      onDefer={deferProgressReview}
    /> : null}
  </div>;
}

function PostAttemptReviewModal({
  task,
  title,
  correctCount,
  incorrectCount,
  unansweredCount,
  typeBreakdown,
  comprehension,
  errorAnalysis,
  checklistValues,
  saving,
  message,
  practiceUrl,
  onComprehensionChange,
  onErrorAnalysisChange,
  onChecklistChange,
  onSave,
  onDefer,
}: {
  task: StudentProgressTask;
  title: string;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  typeBreakdown: Array<{ typeName: string; total: number; correct: number; incorrect: number; unanswered: number }>;
  comprehension: string;
  errorAnalysis: string;
  checklistValues: Record<string, boolean>;
  saving: boolean;
  message: string;
  practiceUrl: string;
  onComprehensionChange: (value: string) => void;
  onErrorAnalysisChange: (value: string) => void;
  onChecklistChange: (id: string, completed: boolean) => void;
  onSave: () => Promise<boolean>;
  onDefer: () => void;
}) {
  const total = correctCount + incorrectCount + unansweredCount;
  const percentage = total ? Math.round((correctCount / total) * 100) : 0;
  const weakGroups = typeBreakdown
    .filter((item) => item.incorrect + item.unanswered > 0)
    .sort((left, right) => (right.incorrect + right.unanswered) - (left.incorrect + left.unanswered))
    .slice(0, 3);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDefer();
    };
    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onDefer]);

  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#172033]/35 p-3 backdrop-blur-[3px] sm:p-6" role="presentation">
    <section role="dialog" aria-modal="true" aria-labelledby="post-attempt-review-title" className="flex h-[560px] min-h-0 max-h-[calc(100%-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-[#DDE7F0] bg-[#F7FAFD] shadow-[0_28px_80px_rgba(31,41,55,0.22)] [@media(max-height:760px)]:h-[420px]">
      <header className="flex items-start justify-between gap-4 border-b border-[#E8EEF4] bg-white px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="inline-flex rounded-full bg-[#FFEAF1] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#A83F62]">Sau lần làm này</p>
          <h2 id="post-attempt-review-title" className="mt-1 truncate text-xl font-extrabold text-slate-950">Nhìn lại nhanh trước khi luyện tiếp</h2>
          <p className="mt-1 truncate text-sm text-slate-500">{title}</p>
        </div>
        <button type="button" onClick={onDefer} aria-label="Đóng và hoàn thành sau" className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#DDE7F0] bg-[#F8FBFF] text-slate-500 transition hover:border-[#B8D5EE] hover:bg-[#EDF6FF] hover:text-[#27679F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A8CC8]"><X size={19} /></button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-[#F0CDDA] bg-[#FFF7FA] p-5">
              <div className="flex items-end justify-between gap-4">
                <div><span className="text-xs font-extrabold uppercase tracking-wide text-[#9A5C70]">Kết quả lần này</span><strong className="mt-1 block text-4xl font-black tracking-tight text-[#9F3E60]">{correctCount}<span className="text-2xl text-[#C68A9D]">/{total}</span></strong></div>
                <span className="rounded-full border border-[#F0CDDA] bg-white px-3 py-1.5 text-sm font-extrabold text-[#A83F62] shadow-sm">{percentage}%</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-[#EAF9F3] px-2 py-3 text-center"><strong className="block text-lg text-[#14745A]">{correctCount}</strong><span className="text-[11px] font-bold text-[#438C78]">Đúng</span></div>
                <div className="rounded-xl bg-[#FFF0F2] px-2 py-3 text-center"><strong className="block text-lg text-[#C4455C]">{incorrectCount}</strong><span className="text-[11px] font-bold text-[#B86673]">Sai</span></div>
                <div className="rounded-xl bg-[#FFF7E8] px-2 py-3 text-center"><strong className="block text-lg text-[#A86B13]">{unansweredCount}</strong><span className="text-[11px] font-bold text-[#A88145]">Bỏ trống</span></div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#CFE4F5] bg-[#F5FAFF] p-4">
              <div className="flex items-center gap-2 text-[#3976B8]"><Sparkle size={18} weight="fill" /><h3 className="text-sm font-extrabold text-slate-900">Nhóm cần xem lại</h3></div>
              {weakGroups.length ? <div className="mt-3 grid gap-2">{weakGroups.map((group) => <div key={group.typeName} className="flex items-center justify-between gap-3 rounded-xl border border-[#DCEBF7] bg-white px-3 py-2.5 text-sm shadow-sm"><span className="min-w-0 truncate font-semibold text-slate-700">{group.typeName}</span><strong className="shrink-0 rounded-full bg-[#E9F4FF] px-2.5 py-1 text-xs text-[#27679F]">{group.incorrect + group.unanswered}/{group.total}</strong></div>)}</div> : <p className="mt-3 text-sm font-semibold text-[#3976B8]">Không có nhóm câu nổi bật.</p>}
            </section>

            <section className="rounded-2xl border border-[#CFE9DF] bg-[#F3FBF7] p-4">
              <div className="flex items-center justify-between gap-3"><label htmlFor="review-comprehension" className="text-sm font-extrabold text-slate-900">Mức độ thấu hiểu</label><strong className="text-xl text-[#16715A]">{comprehension}%</strong></div>
              <input id="review-comprehension" type="range" min="0" max="100" step="5" value={comprehension} onChange={(event) => onComprehensionChange(event.target.value)} className="mt-3 w-full accent-[#25A47C]" />
              <div className="mt-1 flex justify-between text-[10px] font-bold text-[#6E9A8D]"><span>Cần luyện lại</span><span>Đã nắm chắc</span></div>
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-2xl border border-[#E9D5DD] bg-white p-4 shadow-[0_8px_24px_rgba(136,68,88,0.06)]">
              <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-extrabold text-slate-900">Checklist sau bài làm</h3><span className="inline-flex items-center gap-1 rounded-full bg-[#FFEAF1] px-2.5 py-1 text-xs font-extrabold text-[#A83F62]"><ListChecks size={14} weight="fill" /> {task.checklist.filter((item) => checklistValues[item.id]).length}/{task.checklist.length}</span></div>
              <div className="mt-3 grid gap-2">{task.checklist.map((item) => <label key={item.id} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition ${checklistValues[item.id] ? "border-[#9BD9C4] bg-[#EEFBF6]" : "border-[#E4EAF0] bg-[#FAFCFE] hover:border-[#E0B9C7] hover:bg-[#FFF8FA]"}`}><input type="checkbox" checked={Boolean(checklistValues[item.id])} onChange={(event) => onChecklistChange(item.id, event.target.checked)} className="size-4 shrink-0 accent-[#25A47C]" /><span className="flex min-w-0 flex-1 items-center justify-between gap-2 text-sm font-semibold leading-5 text-slate-700"><span>{item.label}</span>{item.required ? <small className="shrink-0 rounded-full bg-[#FFF0F3] px-2 py-0.5 text-[10px] font-extrabold text-[#B7476B]">Bắt buộc</small> : null}</span></label>)}</div>
            </section>

            <section className="rounded-2xl border border-[#F0DFC0] bg-[#FFFCF5] p-4">
              <label htmlFor="review-error-analysis" className="text-sm font-extrabold text-slate-900">Kết luận cho lần luyện tiếp theo</label>
              <textarea id="review-error-analysis" rows={5} value={errorAnalysis} onChange={(event) => onErrorAnalysisChange(event.target.value)} className="mt-3 w-full resize-y rounded-xl border border-[#E9D7B8] bg-white px-3 py-2.5 text-sm leading-6 text-slate-700 outline-none transition focus:border-[#C38A34] focus:ring-2 focus:ring-[#F3DDAF]" />
            </section>
            {message ? <p role="status" className="rounded-xl border border-[#CFE9DF] bg-[#F0FBF6] px-3 py-2 text-xs font-bold text-[#16715A]">{message}</p> : null}
          </div>
        </div>
      </div>

      <footer className="flex flex-col-reverse gap-2 border-t border-[#E5EDF4] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href={practiceUrl} onClick={onDefer} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#CFE1F1] bg-[#F5FAFF] px-4 text-sm font-extrabold text-[#27679F] transition hover:bg-[#EAF4FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A8CC8]">Để sau, luyện lại <ArrowRight size={16} /></Link>
        <button type="button" disabled={saving || !task.attemptId} onClick={() => void onSave()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#B7476B] px-5 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(183,71,107,0.22)] transition hover:bg-[#A33F60] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7476B] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-55">{saving ? <CircleNotch size={17} className="animate-spin" /> : <CheckCircle size={17} weight="fill" />}{saving ? "Đang lưu…" : "Lưu vào tiến độ"}</button>
      </footer>
    </section>
  </div>;
}

function MistakeReviewForm({
  attemptId,
  questionKey,
  skill,
  initialReview,
  onSaved,
  onDeleted,
}: {
  attemptId: string;
  questionKey: string;
  skill: string;
  initialReview?: TestAttemptQuestionReview;
  onSaved: (review: TestAttemptQuestionReview) => void;
  onDeleted: () => void;
}) {
  const [reasonCode, setReasonCode] = useState<TestAttemptErrorReason>(initialReview?.reasonCode ?? "UNKNOWN_VOCABULARY");
  const [note, setNote] = useState(initialReview?.note ?? "");
  const [needsRetry, setNeedsRetry] = useState(initialReview?.needsRetry ?? false);
  const [vocabularyTerm, setVocabularyTerm] = useState(initialReview?.vocabularyTerm ?? "");
  const [vocabularyMeaning, setVocabularyMeaning] = useState(initialReview?.vocabularyMeaning ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const save = async () => {
    setSaving(true);
    setMessage("");
    const request: SaveTestAttemptQuestionReviewRequest = {
      reasonCode,
      note: note.trim() || null,
      needsRetry,
      vocabularyTerm: vocabularyTerm.trim() || null,
      vocabularyMeaning: vocabularyMeaning.trim() || null,
    };
    try {
      const saved = await saveReadingAttemptReview(attemptId, questionKey, request, skill);
      onSaved(saved);
      setMessage("Đã lưu");
    } catch (failure) {
      setMessage(requestMessage(failure));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    setMessage("");
    try {
      await deleteReadingAttemptReview(attemptId, questionKey, skill);
      onDeleted();
      setMessage("Đã bỏ review");
    } catch (failure) {
      setMessage(requestMessage(failure));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-extrabold text-amber-950">Học từ lỗi sai</p>
          <p className="mt-0.5 text-xs text-amber-900/70">Ghi lại một lý do ngắn để lần sau biết cần sửa gì.</p>
        </div>
        {message ? <span className="text-xs font-bold text-amber-900">{message}</span> : null}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold text-slate-700">
          Lý do sai
          <select
            value={reasonCode}
            onChange={(event) => setReasonCode(event.target.value as TestAttemptErrorReason)}
            className="mt-1.5 min-h-10 w-full rounded-lg border border-amber-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
          >
            {ERROR_REASON_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label className="flex items-end gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700">
          <input type="checkbox" checked={needsRetry} onChange={(event) => setNeedsRetry(event.target.checked)} className="size-4 accent-[#8f4458]" />
          Cần làm lại câu này
        </label>
      </div>

      <label className="mt-3 block text-xs font-bold text-slate-700">
        Ghi chú cá nhân
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="Ví dụ: nghe thấy từ đúng nhưng bị distractor ở câu sau..."
          className="mt-1.5 w-full resize-y rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
        />
      </label>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold text-slate-700">
          Từ mới (nếu có)
          <input value={vocabularyTerm} onChange={(event) => setVocabularyTerm(event.target.value)} maxLength={200} className="mt-1.5 min-h-10 w-full rounded-lg border border-amber-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" placeholder="Từ / cụm từ" />
        </label>
        <label className="text-xs font-bold text-slate-700">
          Nghĩa / cách nhớ
          <input value={vocabularyMeaning} onChange={(event) => setVocabularyMeaning(event.target.value)} maxLength={500} className="mt-1.5 min-h-10 w-full rounded-lg border border-amber-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" placeholder="Nghĩa hoặc ghi chú nhớ" />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={saving} onClick={() => void save()} className="min-h-9 rounded-lg bg-[#8f4458] px-4 text-xs font-extrabold text-white transition hover:bg-[#743447] disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? "Đang lưu..." : initialReview ? "Cập nhật review" : "Lưu review"}
        </button>
        {initialReview ? <button type="button" disabled={saving} onClick={() => void remove()} className="min-h-9 rounded-lg border border-amber-300 bg-white px-4 text-xs font-extrabold text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60">Bỏ review</button> : null}
      </div>
    </div>
  );
}

/** SVG Donut Chart Component */
function DonutChart({ correct, incorrect, unanswered }: { correct: number; incorrect: number; unanswered: number }) {
  const total = Math.max(1, correct + incorrect + unanswered);
  const size = 160;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const correctArc = (correct / total) * circumference;
  const incorrectArc = (incorrect / total) * circumference;
  const unansweredArc = (unanswered / total) * circumference;

  const correctOffset = 0;
  const incorrectOffset = -correctArc;
  const unansweredOffset = -(correctArc + incorrectArc);

  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
        {/* Background base circle */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        {/* Unanswered arc */}
        {unanswered > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth={strokeWidth}
            strokeDasharray={`${unansweredArc} ${circumference - unansweredArc}`}
            strokeDashoffset={unansweredOffset}
          />
        )}
        {/* Incorrect arc */}
        {incorrect > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#ef4444"
            strokeWidth={strokeWidth}
            strokeDasharray={`${incorrectArc} ${circumference - incorrectArc}`}
            strokeDashoffset={incorrectOffset}
          />
        )}
        {/* Correct arc */}
        {correct > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#22c55e"
            strokeWidth={strokeWidth}
            strokeDasharray={`${correctArc} ${circumference - correctArc}`}
            strokeDashoffset={correctOffset}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-black text-slate-900 tracking-tight">{correct}/{total}</span>
        <span className="text-[11px] font-bold text-slate-500">câu đúng</span>
      </div>
    </div>
  );
}

/** Formats duration between startedAt and submittedAt */
function formatDurationTime(startedAt?: string | null, submittedAt?: string | null) {
  if (!startedAt || !submittedAt) return null;
  const start = Date.parse(startedAt);
  const end = Date.parse(submittedAt);
  if (isNaN(start) || isNaN(end) || end <= start) return null;
  const seconds = Math.floor((end - start) / 1000);
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/** Status Badge for Questions */
function QuestionStatusBadge({ correct, answered, score, maxScore }: { correct: boolean | null; answered: boolean; score: number; maxScore: number }) {
  if (!answered) {
    return <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-extrabold text-slate-600">⚪ Chưa trả lời</span>;
  }
  if (correct) {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-700"><CheckCircle size={15} weight="fill" /> Đúng ({score}/{maxScore})</span>;
  }
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-extrabold text-rose-700"><XCircle size={15} weight="fill" /> Chưa đúng ({score}/{maxScore})</span>;
}
