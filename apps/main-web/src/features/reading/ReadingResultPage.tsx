"use client";

import type { ReadingAttemptResult, StudentReadingAttempt } from "@ielts/contracts";
import {
  ArrowLeft, CheckCircle, CircleNotch, Clock, ClockCountdown,
  FileText, ListChecks, Sparkle, Trophy, X, XCircle, ArrowRight, CaretDown,
  MinusCircle, Lightbulb, MagnifyingGlass, MapPin
} from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { getReadingAttempt, getReadingAttemptResult } from "./readingApi";

type QuestionFilter = "ALL" | "CORRECT" | "INCORRECT" | "UNANSWERED";

export function ReadingResultPage({ attemptId }: { attemptId: string }) {
  return <StudentSessionGate><ReadingResultContent attemptId={attemptId} /></StudentSessionGate>;
}

function ReadingResultContent({ attemptId }: { attemptId: string }) {
  const [result, setResult] = useState<ReadingAttemptResult | null>(null);
  const [attempt, setAttempt] = useState<StudentReadingAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<QuestionFilter>("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [res, att] = await Promise.all([
        getReadingAttemptResult(attemptId),
        getReadingAttempt(attemptId).catch(() => null),
      ]);
      setResult(res);
      setAttempt(att);
    } catch (failure) {
      setError(requestMessage(failure));
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    void load();
  }, [load]);

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
      const typeName = typeLabelMap.get(q.questionKey) || "Câu hỏi Reading";
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

  if (loading) {
    return <main className="grid min-h-dvh place-items-center bg-slate-50 px-4" aria-busy="true"><span className="flex items-center gap-3 text-sm font-medium text-slate-500"><CircleNotch size={22} className="animate-spin text-[#8f4458]" aria-hidden="true" />Đang tải kết quả bài làm...</span></main>;
  }

  if (error || !result) {
    return <main className="grid min-h-dvh place-items-center bg-slate-50 px-4"><div className="w-full max-w-xl"><ReadingStatePanel title="Chưa thể xem kết quả" message={error || "Kết quả chưa sẵn sàng."} actionLabel="Thử lại" onAction={() => void load()} tone="error" /><Link href="/student/reading" className="mt-4 inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-bold text-[#8f4458] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]">Quay lại danh sách bài thi Reading</Link></div></main>;
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
    mascotTitle = "Kết quả tuyệt vời! Kỹ năng Reading của bạn rất ấn tượng cùng The IELTS Spells!";
  } else if (percentage >= 50) {
    mascotTitle = "Kết quả tốt! Bình tĩnh cùng luyện tập tiếp với The IELTS Spells nhé!";
  }

  return <div className="min-h-dvh bg-[#f8fafc] text-slate-800">
    <a href="#reading-result" className="student-skip-link">Đến kết quả bài thi Reading</a>

    {/* Clean Top Navigation Bar */}
    <div className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/student/reading" className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Thoát về danh sách đề">
            <X size={18} />
          </Link>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#8f4458]">The IELTS Spells</span>
          <span className="hidden text-slate-300 sm:inline">|</span>
          <span className="hidden truncate text-sm font-semibold text-slate-700 sm:inline max-w-md">{attempt?.title ?? "Kết quả bài Reading"}</span>
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
                  href={`/student/reading/attempts/${attemptId}/explanations#question-${result.questions[0]?.questionKey ?? "overview"}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 py-2 text-xs font-extrabold text-slate-700 transition hover:border-[#8f4458] hover:bg-[#8f4458] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]"
                >
                  Xem giải thích <span className="rounded-full bg-[#8f4458] px-2 py-0.5 text-[10px] font-black uppercase text-white">FREE</span>
                </Link>
              </div>
            </div>

          </div>

          {/* Omitted recommendation section as requested */}

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
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Chi tiết từng câu & Giải thích</h3>
                <p className="text-xs text-slate-500 mt-0.5">Xem chi tiết đáp án chuẩn và lời giải thích từ đội ngũ IELTS Spells</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-bold">
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
              </div>
            </div>

            <div className="space-y-3">
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
                        href={`/student/reading/attempts/${attemptId}/explanations#question-${q.questionKey}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50/80 px-2.5 py-1 text-xs font-bold text-orange-800 transition hover:border-orange-300 hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                        title="Di chuyển tới đoạn bằng chứng được highlight trong bài đọc"
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
                </article>
              ))}

              {filteredQuestions.length === 0 && (
                <div className="py-8 text-center text-sm font-semibold text-slate-500">
                  Không có câu hỏi nào trong mục này.
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* Return to Practice Button */}
      <div className="pt-4 text-center">
        <Link
          href="/student/reading"
          className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#8f4458] px-6 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#743447] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]"
        >
          <ArrowLeft size={18} />
          Về danh sách bài thi Reading
        </Link>
      </div>

    </main>
  </div>;
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
