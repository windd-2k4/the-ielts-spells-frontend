"use client";

import type { ReadingAttemptResult } from "@ielts/contracts";
import { CheckCircle, CircleNotch, ClockCountdown, ListChecks, XCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StudentSessionGate } from "@/features/student-auth/StudentSessionGate";
import { ReadingStatePanel } from "./ReadingStatePanel";
import { StudentPageHeader } from "./StudentPageHeader";
import { formatDateTime, requestMessage } from "./readingFormat";
import { getReadingAttemptResult } from "./readingApi";

export function ReadingResultPage({ attemptId }: { attemptId: string }) {
  return <StudentSessionGate><ReadingResultContent attemptId={attemptId} /></StudentSessionGate>;
}

function ReadingResultContent({ attemptId }: { attemptId: string }) {
  const [result, setResult] = useState<ReadingAttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setResult(await getReadingAttemptResult(attemptId));
    } catch (failure) {
      setError(requestMessage(failure));
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <main className="grid min-h-dvh place-items-center bg-[var(--surface-muted)] px-4" aria-busy="true"><span className="flex items-center gap-3 text-sm font-medium text-[var(--text-muted)]"><CircleNotch size={21} className="animate-spin text-[var(--brand-pink)]" aria-hidden="true" />Đang tải kết quả</span></main>;
  }

  if (error || !result) {
    return <main className="grid min-h-dvh place-items-center bg-[var(--surface-muted)] px-4"><div className="w-full max-w-xl"><ReadingStatePanel title="Chưa thể xem kết quả" message={error || "Kết quả chưa sẵn sàng."} actionLabel="Thử lại" onAction={() => void load()} tone="error" /><Link href={`/student/reading/attempts/${attemptId}`} className="mt-4 inline-flex min-h-11 items-center rounded-[var(--radius-sm)] px-3 text-sm font-bold text-[var(--brand-pink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)]">Quay lại bài làm</Link></div></main>;
  }

  const total = result.correctCount + result.incorrectCount + result.unansweredCount;
  const percentage = result.maxScore > 0 && result.autoScore !== null ? Math.round((result.autoScore / result.maxScore) * 100) : null;

  return <div className="min-h-dvh bg-[var(--surface-muted)] text-[var(--text)]">
    <a href="#reading-result" className="student-skip-link">Bỏ qua điều hướng đến kết quả bài Reading</a>
    <StudentPageHeader />
    <main id="reading-result" className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-8">
        <span className={`grid size-12 place-items-center rounded-[var(--radius-sm)] ${result.status === "GRADED" ? "bg-[var(--brand-pink-soft)] text-[var(--brand-pink)]" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"}`}><ClockCountdown size={25} weight="fill" aria-hidden="true" /></span>
        <p className="mt-5 text-sm font-semibold text-[var(--brand-pink)]">Bài Reading đã {result.status === "EXPIRED" ? "hết giờ" : "được nộp"}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{result.resultVisible ? "Kết quả làm bài" : "Bài làm đã được ghi nhận"}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">Nộp lúc: {formatDateTime(result.submittedAt)}. Hạn làm: {formatDateTime(result.expiresAt)}.</p>
      </header>

      {!result.resultVisible ? <section className="mt-6 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-[var(--shadow)]"><ListChecks size={32} className="mx-auto text-[var(--brand-pink)]" weight="fill" aria-hidden="true" /><h2 className="mt-4 text-xl font-bold">Kết quả chi tiết chưa được mở</h2><p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Giáo viên đã chọn không hiển thị điểm và đáp án ngay sau khi nộp. Bài làm của bạn đã được lưu thành công.</p></section> : <>
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Tóm tắt kết quả">
          <ScoreCard label="Điểm tự chấm" value={`${result.autoScore ?? 0}/${result.maxScore}`} detail={percentage === null ? "Chưa có tỷ lệ" : `${percentage}%`} />
          <ScoreCard label="Trả lời đúng" value={String(result.correctCount)} detail={`trên ${total} câu`} tone="success" />
          <ScoreCard label="Chưa đúng" value={String(result.incorrectCount)} detail={`trên ${total} câu`} tone="danger" />
          <ScoreCard label="Chưa trả lời" value={String(result.unansweredCount)} detail={`trên ${total} câu`} />
        </section>
        <section className="mt-6 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-6" aria-labelledby="question-results-title">
          <h2 id="question-results-title" className="text-xl font-bold">Chi tiết từng câu</h2>
          <div className="mt-5 grid gap-3">
            {result.questions.map((question) => <article key={question.questionKey} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold text-[var(--text)]">Câu {question.questionNo}</h3><QuestionStatus correct={question.correct} answered={question.answered} score={question.score} maxScore={question.maxScore} /></div>
              {question.correctAnswers.length > 0 ? <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]"><strong className="text-[var(--text)]">Đáp án:</strong> {question.correctAnswers.join(", ")}</p> : null}
              {question.explanation ? <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]"><strong className="text-[var(--text)]">Giải thích:</strong> {question.explanation}</p> : null}
            </article>)}
          </div>
        </section>
      </>}

      <div className="mt-8"><Link href="/student/reading" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-pink)] px-4 text-sm font-bold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)] focus-visible:ring-offset-2">Về danh sách bài Reading</Link></div>
    </main>
  </div>;
}

function ScoreCard({ label, value, detail, tone = "neutral" }: { label: string; value: string; detail: string; tone?: "neutral" | "success" | "danger" }) {
  const toneClass = tone === "success" ? "text-[var(--success)]" : tone === "danger" ? "text-[var(--danger)]" : "text-[var(--brand-pink)]";
  return <article className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"><p className="text-sm font-semibold text-[var(--text-muted)]">{label}</p><p className={`mt-3 text-3xl font-bold tabular-nums ${toneClass}`}>{value}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{detail}</p></article>;
}

function QuestionStatus({ correct, answered, score, maxScore }: { correct: boolean | null; answered: boolean; score: number; maxScore: number }) {
  if (!answered) {
    return <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-bold text-[var(--text-muted)]">Chưa trả lời</span>;
  }
  if (correct) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-bold text-[var(--success)]"><CheckCircle size={15} weight="fill" aria-hidden="true" />Đúng {score}/{maxScore}</span>;
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-bold text-[var(--danger)]"><XCircle size={15} weight="fill" aria-hidden="true" />Chưa đúng {score}/{maxScore}</span>;
}
