"use client";

import type { ReadingAnswer, ReadingQuestion, ReadingSection, SaveReadingResponseItem, StudentReadingAttempt } from "@ielts/contracts";
import { ArrowLeft, CheckCircle, CircleNotch, Clock, FloppyDisk, ListNumbers, PaperPlaneTilt, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StudentSessionGate } from "@/features/student-auth/StudentSessionGate";
import { ReadingQuestionGroup } from "./ReadingQuestionGroup";
import { ReadingStatePanel } from "./ReadingStatePanel";
import { allReadingQuestions, formatDuration, isAnswered, requestMessage } from "./readingFormat";
import { getReadingAttempt, saveReadingResponses, submitReadingAttempt } from "./readingApi";

type SaveState = "idle" | "saving" | "saved" | "failed";

export function ReadingAttemptPlayer({ attemptId }: { attemptId: string }) {
  return <StudentSessionGate><ReadingAttemptContent attemptId={attemptId} /></StudentSessionGate>;
}

function ReadingAttemptContent({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<StudentReadingAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, ReadingAnswer>>({});
  const [activeSectionKey, setActiveSectionKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [pendingCount, setPendingCount] = useState(0);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [now, setNow] = useState(Date.now());
  const pendingRef = useRef(new Map<string, SaveReadingResponseItem>());
  const revisionsRef = useRef(new Map<string, number>());
  const saveTimerRef = useRef<number | undefined>(undefined);
  const savePromiseRef = useRef<Promise<boolean> | null>(null);
  const flushRef = useRef<() => Promise<boolean>>(async () => true);
  const autoSubmitTriedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const value = await getReadingAttempt(attemptId);
      if (value.status !== "IN_PROGRESS") {
        router.replace(`/student/reading/attempts/${attemptId}/result`);
        return;
      }
      setAttempt(value);
      setActiveSectionKey(value.sections[0]?.key ?? "");
      const stored = Object.fromEntries(value.responses.map((response) => [response.questionKey, response.answer]));
      setAnswers(stored);
      revisionsRef.current = new Map(value.responses.map((response) => [response.questionKey, response.clientRevision]));
      pendingRef.current.clear();
      setPendingCount(0);
      setSaveState("idle");
    } catch (failure) {
      setLoadError(requestMessage(failure));
    } finally {
      setLoading(false);
    }
  }, [attemptId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const flushPending = useCallback(async () => {
    if (savePromiseRef.current) {
      return savePromiseRef.current;
    }
    if (pendingRef.current.size === 0) {
      return true;
    }

    const snapshot: SaveReadingResponseItem[] = Array.from(pendingRef.current.values()).slice(0, 50);
    const task = (async () => {
      setSaveState("saving");
      setSaveError("");
      try {
        const savedAttempt = await saveReadingResponses(attemptId, { responses: snapshot });
        for (const item of snapshot) {
          if (pendingRef.current.get(item.questionKey)?.clientRevision === item.clientRevision) {
            pendingRef.current.delete(item.questionKey);
          }
        }
        setAttempt(savedAttempt);
        setPendingCount(pendingRef.current.size);
        setSaveState(pendingRef.current.size === 0 ? "saved" : "idle");
        return true;
      } catch (failure) {
        for (const item of snapshot) {
          const current = pendingRef.current.get(item.questionKey);
          if (!current || current.clientRevision <= item.clientRevision) {
            pendingRef.current.set(item.questionKey, item);
          }
        }
        setPendingCount(pendingRef.current.size);
        setSaveError(requestMessage(failure));
        setSaveState("failed");
        return false;
      } finally {
        savePromiseRef.current = null;
        if (pendingRef.current.size > 0) {
          window.clearTimeout(saveTimerRef.current);
          saveTimerRef.current = window.setTimeout(() => {
            void flushRef.current();
          }, 1200);
        }
      }
    })();
    savePromiseRef.current = task;
    return task;
  }, [attemptId]);

  useEffect(() => {
    flushRef.current = flushPending;
  }, [flushPending]);

  useEffect(() => () => window.clearTimeout(saveTimerRef.current), []);

  const scheduleSave = useCallback(() => {
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void flushRef.current();
    }, 900);
  }, []);

  const updateAnswer = useCallback((questionKey: string, answer: ReadingAnswer) => {
    const nextRevision = (revisionsRef.current.get(questionKey) ?? 0) + 1;
    revisionsRef.current.set(questionKey, nextRevision);
    pendingRef.current.set(questionKey, { questionKey, answer, clientRevision: nextRevision });
    setPendingCount(pendingRef.current.size);
    setSaveState("idle");
    setSaveError("");
    setAnswers((current) => ({ ...current, [questionKey]: answer }));
    scheduleSave();
  }, [scheduleSave]);

  const remainingSeconds = attempt ? Math.max(0, Math.floor((Date.parse(attempt.expiresAt) - now) / 1000)) : 0;

  useEffect(() => {
    if (!attempt || remainingSeconds === 0) {
      return undefined;
    }
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [attempt, remainingSeconds]);

  const submit = useCallback(async (automatic: boolean) => {
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setSaveError("");
    const saved = await flushRef.current();
    if (!saved && !automatic) {
      setSaveError("Không thể lưu hết đáp án trước khi nộp. Vui lòng thử lưu lại.");
      setIsSubmitting(false);
      return;
    }
    try {
      await submitReadingAttempt(attemptId);
      router.replace(`/student/reading/attempts/${attemptId}/result`);
    } catch (failure) {
      setSaveError(requestMessage(failure));
      setIsSubmitting(false);
    }
  }, [attemptId, isSubmitting, router]);

  useEffect(() => {
    if (attempt && remainingSeconds === 0 && !autoSubmitTriedRef.current) {
      autoSubmitTriedRef.current = true;
      void submit(true);
    }
  }, [attempt, remainingSeconds, submit]);

  const questions = useMemo(() => attempt ? allReadingQuestions(attempt.sections) : [], [attempt]);
  const answeredCount = useMemo(() => questions.filter(({ question }) => isAnswered(answers[question.key])).length, [answers, questions]);
  const activeSection = attempt?.sections.find((section) => section.key === activeSectionKey) ?? attempt?.sections[0];

  function goToQuestion(section: ReadingSection, question: ReadingQuestion) {
    setActiveSectionKey(section.key);
    window.setTimeout(() => {
      document.getElementById(`reading-question-${question.key}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }

  if (loading) {
    return <main className="grid min-h-dvh place-items-center bg-[var(--surface-muted)] px-4" aria-busy="true"><span className="flex items-center gap-3 text-sm font-medium text-[var(--text-muted)]"><CircleNotch size={21} className="animate-spin text-[var(--brand-pink)]" aria-hidden="true" />Đang tải bài Reading</span></main>;
  }

  if (loadError || !attempt || !activeSection) {
    return <main className="grid min-h-dvh place-items-center bg-[var(--surface-muted)] px-4"><div className="w-full max-w-xl"><ReadingStatePanel title="Không thể mở bài Reading" message={loadError || "Bài Reading không có nội dung để hiển thị."} actionLabel="Thử lại" onAction={() => void load()} tone="error" /></div></main>;
  }

  return <div className="min-h-dvh bg-[var(--surface-muted)] text-[var(--text)]">
    <a href="#reading-attempt" className="student-skip-link">Bỏ qua điều hướng đến nội dung bài Reading</a>
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <Link href="/student/reading" className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] px-2 text-sm font-semibold text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)]"><ArrowLeft size={18} aria-hidden="true" />Danh sách bài</Link>
        <div className={`flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border px-3 font-mono text-lg font-bold tabular-nums ${remainingSeconds <= 300 ? "border-[var(--danger)] bg-[var(--surface)] text-[var(--danger)]" : "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text)]"}`} role="timer" aria-label={`Thời gian còn lại ${formatDuration(remainingSeconds)}`}><Clock size={19} aria-hidden="true" />{formatDuration(remainingSeconds)}</div>
        <button type="button" onClick={() => setShowSubmitConfirmation(true)} disabled={isSubmitting} className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--brand-pink)] px-4 text-sm font-bold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"><PaperPlaneTilt size={18} aria-hidden="true" />Nộp bài</button>
      </div>
    </header>
    <main id="reading-attempt" className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <header className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-6">
            <p className="text-sm font-semibold text-[var(--brand-pink)]">Reading</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">{attempt.title}</h1>
            {attempt.description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">{attempt.description}</p> : null}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--text-muted)]">
              <span>{answeredCount}/{questions.length} câu đã trả lời</span>
              <SaveStatus state={saveState} pendingCount={pendingCount} />
              <button type="button" onClick={() => void flushRef.current()} disabled={saveState === "saving" || pendingCount === 0} className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] px-3 font-semibold text-[var(--brand-pink)] transition hover:bg-[var(--brand-pink-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)] disabled:cursor-not-allowed disabled:text-[var(--text-muted)]"><FloppyDisk size={18} aria-hidden="true" />Lưu ngay</button>
            </div>
            {saveError ? <p className="mt-4 flex items-start gap-2 rounded-[var(--radius-sm)] border border-[var(--danger)] bg-[var(--surface-muted)] p-3 text-sm leading-6 text-[var(--danger)]" role="alert"><WarningCircle size={18} className="mt-0.5 shrink-0" weight="fill" aria-hidden="true" />{saveError}</p> : null}
          </header>

          {showSubmitConfirmation ? <section className="mt-5 rounded-[var(--radius-md)] border border-[var(--brand-pink)] bg-[var(--brand-pink-soft)] p-5" aria-labelledby="submit-confirmation-title">
            <h2 id="submit-confirmation-title" className="text-lg font-bold text-[var(--text)]">Bạn muốn nộp bài?</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Bạn đã trả lời {answeredCount}/{questions.length} câu. Sau khi nộp, bạn không thể sửa đáp án.</p>
            <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => void submit(false)} disabled={isSubmitting} className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--brand-pink)] px-4 text-sm font-bold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? <CircleNotch size={18} className="animate-spin" aria-hidden="true" /> : <PaperPlaneTilt size={18} aria-hidden="true" />}{isSubmitting ? "Đang nộp bài" : "Xác nhận nộp bài"}</button><button type="button" onClick={() => setShowSubmitConfirmation(false)} disabled={isSubmitting} className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-bold text-[var(--text)] transition hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)] disabled:cursor-not-allowed disabled:opacity-60">Tiếp tục làm bài</button></div>
          </section> : null}

          <nav className="mt-5 flex gap-2 overflow-x-auto border-b border-[var(--border)] pb-3" aria-label="Chọn passage">
            {attempt.sections.map((section) => <button key={section.key} type="button" onClick={() => setActiveSectionKey(section.key)} aria-current={section.key === activeSection.key ? "page" : undefined} className={`min-h-11 shrink-0 rounded-[var(--radius-sm)] px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)] ${section.key === activeSection.key ? "bg-[var(--brand-pink)] text-white" : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--brand-pink)]"}`}>Passage {section.sectionNo}</button>)}
          </nav>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <article className="reading-passage rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-6">
              <p className="text-sm font-semibold text-[var(--brand-pink)]">Reading Passage {activeSection.sectionNo}</p>
              <h2 className="mt-1 text-2xl font-bold text-[var(--text)]">{activeSection.title}</h2>
              {activeSection.contentHtml ? <div className="mt-6" dangerouslySetInnerHTML={{ __html: activeSection.contentHtml }} /> : <p className="mt-6 rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-4 text-sm leading-6 text-[var(--text-muted)]">Passage này chưa có nội dung.</p>}
            </article>
            <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-6" aria-label={`Câu hỏi của passage ${activeSection.sectionNo}`}>
              <div className="space-y-8">{activeSection.questionGroups.map((group) => <ReadingQuestionGroup key={group.key} group={group} answers={answers} onAnswer={updateAnswer} />)}</div>
            </section>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)]" aria-label="Điều hướng câu hỏi">
            <p className="flex items-center gap-2 text-sm font-bold text-[var(--text)]"><ListNumbers size={20} className="text-[var(--brand-pink)]" aria-hidden="true" />Câu hỏi</p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Đã trả lời: {answeredCount}/{questions.length}</p>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {questions.map(({ section, question }) => <button key={question.key} type="button" onClick={() => goToQuestion(section, question)} className={`grid min-h-11 place-items-center rounded-[var(--radius-sm)] border text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)] ${isAnswered(answers[question.key]) ? "border-[var(--brand-pink)] bg-[var(--brand-pink-soft)] text-[var(--brand-pink)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--brand-pink)]"}`} aria-label={`Đi đến câu ${question.number}${isAnswered(answers[question.key]) ? ", đã trả lời" : ", chưa trả lời"}`}>{question.number}</button>)}
            </div>
          </nav>
        </aside>
      </div>
    </main>
  </div>;
}

function SaveStatus({ state, pendingCount }: { state: SaveState; pendingCount: number }) {
  if (state === "saving") {
    return <span className="inline-flex items-center gap-2"><CircleNotch size={16} className="animate-spin text-[var(--brand-pink)]" aria-hidden="true" />Đang lưu</span>;
  }
  if (state === "saved") {
    return <span className="inline-flex items-center gap-2 text-[var(--success)]"><CheckCircle size={16} weight="fill" aria-hidden="true" />Đã lưu</span>;
  }
  if (pendingCount > 0) {
    return <span className="inline-flex items-center gap-2"><Clock size={16} className="text-[var(--brand-pink)]" aria-hidden="true" />Sẽ tự lưu</span>;
  }
  return <span>Đáp án được tự động lưu</span>;
}
