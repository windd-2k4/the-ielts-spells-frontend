"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { ReadingAnnotation, ReadingAnswer, ReadingQuestion, ReadingSection, SaveReadingResponseItem, StudentReadingAttempt } from "@ielts/contracts";
import {
  ArrowLeft, ArrowsHorizontal, CaretLeft, CaretRight, CheckCircle, CircleNotch, Clock,
  CornersIn, CornersOut, Eye, Flag, FloppyDisk, NotePencil, PaperPlaneTilt, WarningCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StudentSessionGate } from "@/features/student-auth/StudentSessionGate";
import { ReadingQuestionGroup } from "./ReadingQuestionGroup";
import { ReadingAnnotations } from "./ReadingAnnotations";
import { ReadingStatePanel } from "./ReadingStatePanel";
import { allReadingQuestions, formatDuration, isAnswered, requestMessage } from "./readingFormat";
import {
  isReadingFontScale,
  migrateLegacyReadingFontScale,
  READING_FONT_SCALE_OPTIONS,
  READING_FONT_SCALE_STORAGE_KEY,
  type ReadingFontScale,
} from "./readingFontScale";
import { getReadingAttempt, saveReadingResponses, submitReadingAttempt } from "./readingApi";
import styles from "./ReadingAttemptPlayer.module.css";

type SaveState = "idle" | "saving" | "saved" | "failed";
type ColorTheme = "standard" | "eye-care" | "dark";

type LocalReadingDraft = {
  attemptId: string;
  savedAt: string;
  responses: SaveReadingResponseItem[];
};

function localDraftKey(attemptId: string) {
  return `reading-attempt-draft:${attemptId}`;
}

function readLocalDraft(attemptId: string): LocalReadingDraft | null {
  try {
    const raw = localStorage.getItem(localDraftKey(attemptId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalReadingDraft>;
    if (parsed.attemptId !== attemptId || !Array.isArray(parsed.responses)) return null;
    const responses = parsed.responses.filter((item): item is SaveReadingResponseItem => Boolean(
      item && typeof item === "object" && typeof item.questionKey === "string"
      && typeof item.clientRevision === "number" && item.answer && typeof item.answer === "object"
    ));
    return responses.length ? { attemptId, savedAt: parsed.savedAt ?? new Date().toISOString(), responses } : null;
  } catch {
    return null;
  }
}

function writeLocalDraft(attemptId: string, responses: SaveReadingResponseItem[]) {
  try {
    if (!responses.length) {
      localStorage.removeItem(localDraftKey(attemptId));
      return;
    }
    const draft: LocalReadingDraft = { attemptId, savedAt: new Date().toISOString(), responses };
    localStorage.setItem(localDraftKey(attemptId), JSON.stringify(draft));
  } catch {
    // localStorage may be unavailable in private browsing; server autosave remains the source of truth.
  }
}

function clearLocalDraft(attemptId: string) {
  try { localStorage.removeItem(localDraftKey(attemptId)); } catch {}
}

export function ReadingAttemptPlayer({ attemptId }: { attemptId: string }) {
  return <StudentSessionGate><ReadingAttemptContent attemptId={attemptId} /></StudentSessionGate>;
}

function ReadingAttemptContent({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<StudentReadingAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, ReadingAnswer>>({});
  const [activeSectionKey, setActiveSectionKey] = useState("");
  const [activeQuestionKey, setActiveQuestionKey] = useState("");
  const [flaggedKeys, setFlaggedKeys] = useState<Set<string>>(new Set());
  const [fontScale, setFontScale] = useState<ReadingFontScale>("standard");
  const [colorTheme, setColorTheme] = useState<ColorTheme>("standard");
  const [annotations, setAnnotations] = useState<ReadingAnnotation[]>([]);
  const [notesOpen, setNotesOpen] = useState(false);

  useEffect(() => {
    try {
      const savedScale = localStorage.getItem(READING_FONT_SCALE_STORAGE_KEY);
      if (isReadingFontScale(savedScale)) {
        setFontScale(savedScale);
      } else {
        const legacyScale = localStorage.getItem("ielts_exam_font_scale");
        const migratedScale = migrateLegacyReadingFontScale(legacyScale);
        setFontScale(migratedScale);
        localStorage.setItem(READING_FONT_SCALE_STORAGE_KEY, migratedScale);
      }
      const savedTheme = localStorage.getItem("ielts_exam_color_theme") as ColorTheme | null;
      if (savedTheme && ["standard", "eye-care", "dark"].includes(savedTheme)) setColorTheme(savedTheme);
    } catch {}
  }, []);

  function changeFontScale(scale: ReadingFontScale) {
    setFontScale(scale);
    try { localStorage.setItem(READING_FONT_SCALE_STORAGE_KEY, scale); } catch {}
  }

  function cycleTheme() {
    setColorTheme((current) => {
      const next = current === "standard" ? "eye-care" : current === "eye-care" ? "dark" : "standard";
      try { localStorage.setItem("ielts_exam_color_theme", next); } catch {}
      return next;
    });
  }
  const [leftPanePercent, setLeftPanePercent] = useState(50);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [pendingCount, setPendingCount] = useState(0);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [now, setNow] = useState(Date.now());
  const pendingRef = useRef(new Map<string, SaveReadingResponseItem>());
  const revisionsRef = useRef(new Map<string, number>());
  const saveTimerRef = useRef<number | undefined>(undefined);
  const savePromiseRef = useRef<Promise<boolean> | null>(null);
  const flushRef = useRef<() => Promise<boolean>>(async () => true);
  const autoSubmitTriedRef = useRef(false);
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const value = await getReadingAttempt(attemptId);
      if (value.status !== "IN_PROGRESS") {
        clearLocalDraft(attemptId);
        router.replace(`/student/reading/attempts/${attemptId}/result`);
        return;
      }
      const firstQuestion = allReadingQuestions(value.sections)[0]?.question.key ?? "";
      const localDraft = readLocalDraft(attemptId);
      const serverResponses = new Map(value.responses.map((response) => [response.questionKey, response]));
      const localResponses = localDraft?.responses.filter((response) => {
        const serverResponse = serverResponses.get(response.questionKey);
        return !serverResponse || response.clientRevision > serverResponse.clientRevision;
      }) ?? [];
      const mergedAnswers = Object.fromEntries(value.responses.map((response) => [response.questionKey, response.answer]));
      for (const response of localResponses) mergedAnswers[response.questionKey] = response.answer;

      setAttempt(value);
      setActiveSectionKey(value.sections[0]?.key ?? "");
      setActiveQuestionKey(firstQuestion);
      setAnswers(mergedAnswers);
      setAnnotations(value.annotations ?? []);
      revisionsRef.current = new Map(value.responses.map((response) => [response.questionKey, response.clientRevision]));
      pendingRef.current = new Map(localResponses.map((response) => [response.questionKey, response]));
      for (const response of localResponses) revisionsRef.current.set(response.questionKey, response.clientRevision);
      setPendingCount(localResponses.length);
      setSaveState("idle");
      if (localResponses.length) {
        setSaveError("Có đáp án chưa đồng bộ từ lần trước. Hệ thống sẽ tự lưu lại.");
        window.setTimeout(() => { void flushRef.current(); }, 0);
      }
    } catch (failure) {
      setLoadError(requestMessage(failure));
    } finally {
      setLoading(false);
    }
  }, [attemptId, router]);

  useEffect(() => { setIsOnline(navigator.onLine); }, []);
  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      if (pendingRef.current.size > 0) void flushRef.current();
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);
  useEffect(() => { void load(); }, [load]);

  const flushPending = useCallback(async () => {
    if (savePromiseRef.current) return savePromiseRef.current;
    if (pendingRef.current.size === 0) return true;
    const snapshot = Array.from(pendingRef.current.values()).slice(0, 50);
    const task = (async () => {
      setSaveState("saving");
      setSaveError("");
      try {
        const savedAttempt = await saveReadingResponses(attemptId, { responses: snapshot });
        for (const item of snapshot) {
          if (pendingRef.current.get(item.questionKey)?.clientRevision === item.clientRevision) pendingRef.current.delete(item.questionKey);
        }
        writeLocalDraft(attemptId, Array.from(pendingRef.current.values()));
        setAttempt(savedAttempt);
        setPendingCount(pendingRef.current.size);
        setSaveState(pendingRef.current.size === 0 ? "saved" : "idle");
        return true;
      } catch (failure) {
        for (const item of snapshot) {
          const current = pendingRef.current.get(item.questionKey);
          if (!current || current.clientRevision <= item.clientRevision) pendingRef.current.set(item.questionKey, item);
        }
        setPendingCount(pendingRef.current.size);
        writeLocalDraft(attemptId, Array.from(pendingRef.current.values()));
        setSaveError(requestMessage(failure));
        setSaveState("failed");
        return false;
      } finally {
        savePromiseRef.current = null;
        if (pendingRef.current.size > 0) {
          window.clearTimeout(saveTimerRef.current);
          saveTimerRef.current = window.setTimeout(() => { void flushRef.current(); }, 1200);
        }
      }
    })();
    savePromiseRef.current = task;
    return task;
  }, [attemptId]);

  useEffect(() => { flushRef.current = flushPending; }, [flushPending]);
  useEffect(() => () => window.clearTimeout(saveTimerRef.current), []);
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (pendingRef.current.size > 0) event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);
  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const updateAnswer = useCallback((questionKey: string, answer: ReadingAnswer) => {
    const nextRevision = (revisionsRef.current.get(questionKey) ?? 0) + 1;
    revisionsRef.current.set(questionKey, nextRevision);
    pendingRef.current.set(questionKey, { questionKey, answer, clientRevision: nextRevision });
    writeLocalDraft(attemptId, Array.from(pendingRef.current.values()));
    setPendingCount(pendingRef.current.size);
    setSaveState("idle");
    setSaveError("");
    setAnswers((current) => ({ ...current, [questionKey]: answer }));
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => { void flushRef.current(); }, 900);
  }, [attemptId]);

  const remainingSeconds = attempt ? Math.max(0, Math.floor((Date.parse(attempt.expiresAt) - now) / 1000)) : 0;
  useEffect(() => {
    if (!attempt || remainingSeconds === 0) return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [attempt, remainingSeconds]);

  const submit = useCallback(async (automatic: boolean) => {
    if (isSubmitting) return;
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
      clearLocalDraft(attemptId);
      pendingRef.current.clear();
      setPendingCount(0);
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
  const locatedQuestionIndex = questions.findIndex(({ question }) => question.key === activeQuestionKey);
  const activeQuestionIndex = locatedQuestionIndex >= 0 ? locatedQuestionIndex : 0;
  const currentQuestion = questions[activeQuestionIndex];

  function selectSection(section: ReadingSection) {
    setActiveSectionKey(section.key);
    const firstQuestion = section.questionGroups.flatMap((group) => group.questions)[0];
    if (firstQuestion) setActiveQuestionKey(firstQuestion.key);
  }

  function goToQuestion(section: ReadingSection, question: ReadingQuestion) {
    setActiveSectionKey(section.key);
    setActiveQuestionKey(question.key);
    window.setTimeout(() => document.getElementById(`reading-question-${question.key}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  }

  function moveQuestion(offset: number) {
    const next = questions[Math.min(questions.length - 1, Math.max(0, activeQuestionIndex + offset))];
    if (next) goToQuestion(next.section, next.question);
  }

  function toggleFlag(questionKey: string) {
    setFlaggedKeys((current) => {
      const next = new Set(current);
      if (next.has(questionKey)) next.delete(questionKey); else next.add(questionKey);
      return next;
    });
  }

  function startDividerDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const bounds = workspaceRef.current?.getBoundingClientRect();
    if (!bounds) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const update = (clientX: number) => setLeftPanePercent(Math.min(68, Math.max(32, ((clientX - bounds.left) / bounds.width) * 100)));
    update(event.clientX);
    const onMove = (moveEvent: PointerEvent) => update(moveEvent.clientX);
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  }

  if (loading) {
    return <main className={styles.statePage} aria-busy="true"><span><CircleNotch size={21} className={styles.spin} aria-hidden="true" />Đang chuẩn bị phòng thi Reading</span></main>;
  }
  if (loadError || !attempt || !activeSection) {
    return <main className={styles.statePage}><div><ReadingStatePanel title="Không thể mở bài Reading" message={loadError || "Bài Reading không có nội dung để hiển thị."} actionLabel="Thử lại" onAction={() => void load()} tone="error" /></div></main>;
  }

  const activeFontScale = READING_FONT_SCALE_OPTIONS.find((option) => option.value === fontScale) ?? READING_FONT_SCALE_OPTIONS[0];
  const examStyle = {
    "--exam-content-size": `${activeFontScale.pixels}px`,
    "--exam-content-line-height": activeFontScale.lineHeight,
  } as CSSProperties;
  const workspaceStyle = { "--left-pane": `${leftPanePercent}%` } as CSSProperties;
  const fontClass = fontScale === "standard" ? styles.fontStandard : fontScale === "large" ? styles.fontLarge : styles.fontExtraLarge;
  const themeClass = colorTheme === "eye-care" ? styles.themeEyeCare : colorTheme === "dark" ? styles.themeDark : styles.themeStandard;
  const themeLabel = colorTheme === "eye-care" ? "Chế độ Bảo vệ mắt (Giấy vàng dịu)" : colorTheme === "dark" ? "Chế độ Ban đêm (Tối)" : "Chế độ Chuẩn (Nền trắng)";
  const themeShortLabel = colorTheme === "eye-care" ? "Bảo vệ mắt" : colorTheme === "dark" ? "Chế độ tối" : "Màu chuẩn";

  const activeSectionQuestions = activeSection.questionGroups.flatMap((group) => group.questions);
  const firstQ = activeSectionQuestions[0]?.number;
  const lastQ = activeSectionQuestions[activeSectionQuestions.length - 1]?.number;
  const questionRangeText = firstQ && lastQ ? `câu ${firstQ}–${lastQ}` : "các câu hỏi";

  return <div className={`${styles.examShell} ${fontClass} ${themeClass}`} style={examStyle}>
    <a href="#reading-workspace" className="student-skip-link">Đến nội dung bài thi</a>
    <header className={styles.examHeader}>
      <div className={styles.brandBlock}>
        <Link href="/student/reading" className={styles.exitButton} aria-label="Thoát về danh sách đề"><ArrowLeft size={20} aria-hidden="true" /></Link>
        <img src="/logo.jpg" width={38} height={38} alt="" />
        <div><strong>The IELTS Spells</strong><span>{attempt.title}</span></div>
      </div>
      <div className={styles.headerStatus}>
        <SaveStatus state={saveState} pendingCount={pendingCount} isOnline={isOnline} />
        <button type="button" onClick={() => void flushRef.current()} disabled={saveState === "saving" || pendingCount === 0} className={styles.iconButton} aria-label="Lưu đáp án ngay"><FloppyDisk size={19} aria-hidden="true" /></button>
      </div>
      <div className={styles.headerActions}>
        <div className={styles.fontControls} role="group" aria-label="Cỡ chữ nội dung bài thi">
          {READING_FONT_SCALE_OPTIONS.map((option) => <button key={option.value} type="button" onClick={() => changeFontScale(option.value)} aria-pressed={fontScale === option.value} aria-label={`Cỡ chữ ${option.label}, ${option.pixels} pixel`} title={`${option.label}: ${option.pixels} px (${option.points} pt)`}><span className={styles.fontGlyph} data-size={option.value} aria-hidden="true">{option.glyph}</span></button>)}
        </div>
        <span className="sr-only" aria-live="polite">Cỡ chữ {activeFontScale.label}, {activeFontScale.pixels} pixel</span>
        <button type="button" onClick={cycleTheme} className={`${styles.themeButton} ${colorTheme !== "standard" ? styles.themeButtonActive : ""}`} title={`Chuyển chế độ màn hình: ${themeLabel}`} aria-label={themeLabel}>
          <Eye size={18} aria-hidden="true" />
          <span>{themeShortLabel}</span>
        </button>
        <button type="button" onClick={() => setNotesOpen(true)} className={`${styles.notesButton} ${notesOpen ? styles.notesButtonActive : ""}`} aria-expanded={notesOpen} aria-label={`Mở ghi chú và tô sáng, ${annotations.length} mục`}>
          <NotePencil size={18} aria-hidden="true" />
          <span>Ghi chú</span>
          {annotations.length > 0 ? <strong>{annotations.length}</strong> : null}
        </button>
        <button type="button" onClick={() => void toggleFullscreen()} className={styles.iconButton} aria-label={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}>{isFullscreen ? <CornersIn size={20} /> : <CornersOut size={20} />}</button>
        <div className={`${styles.timer} ${remainingSeconds <= 300 ? styles.timerWarning : ""}`} role="timer" aria-label={`Thời gian còn lại ${formatDuration(remainingSeconds)}`}><Clock size={19} aria-hidden="true" /><span>{formatDuration(remainingSeconds)}</span><small>còn lại</small></div>
        <button type="button" onClick={() => setShowSubmitConfirmation(true)} disabled={isSubmitting} className={styles.submitButton}><PaperPlaneTilt size={18} aria-hidden="true" />Nộp bài</button>
      </div>
    </header>

    <section className={styles.sectionBar}>
      <div><span>READING</span><strong>Passage {activeSection.sectionNo}</strong></div>
      <p>Đọc bài văn và trả lời {questionRangeText} trong phần này.</p>
      <span>{answeredCount}/{questions.length} câu đã trả lời</span>
    </section>

    {saveError ? <div className={styles.saveError} role="alert"><WarningCircle size={18} weight="fill" aria-hidden="true" />{saveError}<button type="button" onClick={() => void flushRef.current()}>Thử lưu lại</button></div> : null}

    <main id="reading-workspace" ref={workspaceRef} className={styles.workspace} style={workspaceStyle}>
      <article className={`${styles.passagePane} ${fontClass}`} aria-label={`Reading Passage ${activeSection.sectionNo}`}>
        <div className={styles.paneInner}>
          <p className={styles.passageKicker}>Reading Passage {activeSection.sectionNo}</p>
          <h1>{activeSection.title}</h1>
          {activeSection.contentHtml ? <ReadingAnnotations
            attemptId={attemptId}
            sectionKey={activeSection.key}
            html={activeSection.contentHtml}
            contentClassName={styles.passageContent}
            annotations={annotations}
            notesOpen={notesOpen}
            onNotesOpenChange={setNotesOpen}
            onAnnotationsChange={setAnnotations}
          /> : <p className={styles.emptyPassage}>Passage này chưa có nội dung.</p>}
        </div>
      </article>

      <button type="button" className={styles.divider} onPointerDown={startDividerDrag} aria-label="Kéo để thay đổi độ rộng bài đọc và câu hỏi"><ArrowsHorizontal size={18} aria-hidden="true" /></button>

      <section className={`${styles.questionsPane} ${fontClass}`} aria-label={`Câu hỏi passage ${activeSection.sectionNo}`}>
        <div className={styles.paneInner}>
          {activeSection.questionGroups.map((group) => <ReadingQuestionGroup key={group.key} group={group} answers={answers} onAnswer={updateAnswer} activeQuestionKey={activeQuestionKey} flaggedKeys={flaggedKeys} onQuestionFocus={setActiveQuestionKey} onToggleFlag={toggleFlag} />)}
        </div>
      </section>
    </main>

    <footer className={styles.examFooter}>
      <nav className={styles.sectionTabs} aria-label="Chọn passage">
        {attempt.sections.map((section) => {
          const sectionQuestions = section.questionGroups.flatMap((group) => group.questions);
          return <button key={section.key} type="button" onClick={() => selectSection(section)} aria-current={section.key === activeSection.key ? "page" : undefined}><strong>Part {section.sectionNo}</strong><span>{sectionQuestions.filter((question) => isAnswered(answers[question.key])).length}/{sectionQuestions.length}</span></button>;
        })}
      </nav>
      <nav className={styles.questionNav} aria-label="Điều hướng câu hỏi">
        {questions.map(({ section, question }) => {
          const answered = isAnswered(answers[question.key]);
          const active = question.key === activeQuestionKey;
          const flagged = flaggedKeys.has(question.key);
          return <button key={question.key} type="button" onClick={() => goToQuestion(section, question)} className={`${answered ? styles.answered : ""} ${active ? styles.active : ""} ${flagged ? styles.flagged : ""}`} aria-current={active ? "step" : undefined} aria-label={`Câu ${question.number}, ${answered ? "đã trả lời" : "chưa trả lời"}${flagged ? ", đã đánh dấu" : ""}`}>{question.number}{flagged ? <Flag size={10} weight="fill" aria-hidden="true" /> : null}</button>;
        })}
      </nav>
      <div className={styles.nextControls}><button type="button" onClick={() => moveQuestion(-1)} disabled={activeQuestionIndex <= 0} aria-label="Câu trước"><CaretLeft size={22} /></button><span>Câu {currentQuestion?.question.number ?? "–"}</span><button type="button" onClick={() => moveQuestion(1)} disabled={activeQuestionIndex >= questions.length - 1} aria-label="Câu tiếp theo"><CaretRight size={22} /></button></div>
    </footer>

    {showSubmitConfirmation ? <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSubmitting) setShowSubmitConfirmation(false); }}>
      <section className={styles.submitDialog} role="dialog" aria-modal="true" aria-labelledby="submit-confirmation-title">
        <span className={styles.dialogIcon}><PaperPlaneTilt size={25} weight="fill" aria-hidden="true" /></span>
        <p className={styles.eyebrow}>Xác nhận nộp bài</p>
        <h2 id="submit-confirmation-title">Bạn đã hoàn thành bài thi?</h2>
        <p>Bạn đã trả lời <strong>{answeredCount}/{questions.length}</strong> câu và còn <strong>{formatDuration(remainingSeconds)}</strong>. Sau khi nộp, đáp án không thể chỉnh sửa.</p>
        {flaggedKeys.size > 0 ? <div className={styles.flagNotice}><Flag size={18} weight="fill" aria-hidden="true" />Bạn còn {flaggedKeys.size} câu đã đánh dấu cần kiểm tra.</div> : null}
        <div className={styles.dialogActions}><button type="button" onClick={() => setShowSubmitConfirmation(false)} disabled={isSubmitting}>Tiếp tục kiểm tra</button><button type="button" onClick={() => void submit(false)} disabled={isSubmitting}>{isSubmitting ? <CircleNotch size={18} className={styles.spin} /> : <PaperPlaneTilt size={18} />}{isSubmitting ? "Đang nộp" : "Nộp bài"}</button></div>
      </section>
    </div> : null}
  </div>;
}

function SaveStatus({ state, pendingCount, isOnline }: { state: SaveState; pendingCount: number; isOnline: boolean }) {
  if (!isOnline) return <span className={`${styles.saveStatus} ${styles.failed}`}><WarningCircle size={16} weight="fill" aria-hidden="true" />Ngoại tuyến · giữ cục bộ</span>;
  if (state === "saving") return <span className={styles.saveStatus}><CircleNotch size={16} className={styles.spin} aria-hidden="true" />Đang lưu</span>;
  if (state === "saved") return <span className={`${styles.saveStatus} ${styles.saved}`}><CheckCircle size={16} weight="fill" aria-hidden="true" />Đã lưu</span>;
  if (state === "failed") return <span className={`${styles.saveStatus} ${styles.failed}`}><WarningCircle size={16} weight="fill" aria-hidden="true" />Lỗi lưu</span>;
  if (pendingCount > 0) return <span className={styles.saveStatus}><Clock size={16} aria-hidden="true" />Sẽ tự lưu</span>;
  return <span className={styles.saveStatus}><CheckCircle size={16} aria-hidden="true" />Tự động lưu</span>;
}
