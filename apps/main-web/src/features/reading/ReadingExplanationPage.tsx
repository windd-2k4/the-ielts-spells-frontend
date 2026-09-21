"use client";

import type { ReadingAnswer, ReadingQuestion, ReadingQuestionGroup, ReadingQuestionResult, ReadingSection, StudentReadingAttempt } from "@ielts/contracts";
import {
  ArrowDown, ArrowLeft, ArrowSquareOut, ChatCircleDots, Check, CheckCircle, CircleNotch, Eye, Highlighter,
  Info, Lightbulb, ListBullets, MapPin, MinusCircle, Moon, Sparkle, Sun, TreeStructure, X, XCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { StudentSessionGate } from "@/features/student-auth/StudentSessionGate";
import { getReadingAttempt, getReadingAttemptResult } from "./readingApi";
import {
  isReadingFontScale,
  migrateLegacyReadingFontScale,
  READING_FONT_SCALE_OPTIONS,
  READING_FONT_SCALE_STORAGE_KEY,
  type ReadingFontScale,
} from "./readingFontScale";
import {
  allReadingQuestions, answerValues, groupQuestionLabel,
  optionLabel, questionOptions, requestMessage,
} from "./readingFormat";
import { ReadingStatePanel } from "./ReadingStatePanel";
import styles from "./ReadingExplanationPage.module.css";

type ColorTheme = "standard" | "sepia" | "dark";

export function ReadingExplanationPage({ attemptId }: { attemptId: string }) {
  return (
    <StudentSessionGate>
      <ReadingExplanationContent attemptId={attemptId} />
    </StudentSessionGate>
  );
}

function ReadingExplanationContent({ attemptId }: { attemptId: string }) {
  const [attempt, setAttempt] = useState<StudentReadingAttempt | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof getReadingAttemptResult>> | null>(null);
  const [selectedKey, setSelectedKey] = useState("");
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [focusedEvidenceId, setFocusedEvidenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Appearance controls
  const [fontScale, setFontScale] = useState<ReadingFontScale>("standard");
  const [colorTheme, setColorTheme] = useState<ColorTheme>("standard");

  const passageRef = useRef<HTMLDivElement | null>(null);
  const passagePaneRef = useRef<HTMLElement | null>(null);
  const answersPaneRef = useRef<HTMLElement | null>(null);

  // Load font & theme preferences
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedFont = localStorage.getItem(READING_FONT_SCALE_STORAGE_KEY);
    if (isReadingFontScale(savedFont)) {
      setFontScale(savedFont);
    } else {
      const legacyFont = localStorage.getItem("ielts_exam_font_scale");
      const migratedFont = migrateLegacyReadingFontScale(legacyFont);
      setFontScale(migratedFont);
      localStorage.setItem(READING_FONT_SCALE_STORAGE_KEY, migratedFont);
    }
    const savedTheme = localStorage.getItem("ielts_exam_color_theme") as ColorTheme | null;
    if (savedTheme && ["standard", "sepia", "dark"].includes(savedTheme)) setColorTheme(savedTheme);
  }, []);

  const changeFontScale = (scale: ReadingFontScale) => {
    setFontScale(scale);
    if (typeof window !== "undefined") localStorage.setItem(READING_FONT_SCALE_STORAGE_KEY, scale);
  };

  const changeColorTheme = (theme: ColorTheme) => {
    setColorTheme(theme);
    if (typeof window !== "undefined") localStorage.setItem("ielts_exam_color_theme", theme);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextAttempt, nextResult] = await Promise.all([
        getReadingAttempt(attemptId),
        getReadingAttemptResult(attemptId),
      ]);
      setAttempt(nextAttempt);
      setResult(nextResult);

      const hashKey = typeof window !== "undefined" ? window.location.hash.replace(/^#question-/, "") : "";
      const initialKey = hashKey && nextResult.questions.some((q) => q.questionKey === hashKey)
        ? hashKey
        : nextResult.questions[0]?.questionKey ?? "";
      setSelectedKey(initialKey);

      if (nextAttempt && initialKey) {
        const foundSecIdx = nextAttempt.sections.findIndex((sec) =>
          sec.questionGroups.some((grp) => grp.questions.some((q) => q.key === initialKey))
        );
        if (foundSecIdx >= 0) setActiveSectionIndex(foundSecIdx);
      }
    } catch (failure) {
      setError(requestMessage(failure));
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => { void load(); }, [load]);

  const questionItems = useMemo(() => attempt ? allReadingQuestions(attempt.sections) : [], [attempt]);
  const questionByKey = useMemo(() => new Map(questionItems.map((item) => [item.question.key, item])), [questionItems]);
  const resultByKey = useMemo(() => new Map((result?.questions ?? []).map((q) => [q.questionKey, q])), [result]);

  const selectedResult = resultByKey.get(selectedKey) ?? result?.questions[0] ?? null;
  const selectedMeta = selectedResult ? questionByKey.get(selectedResult.questionKey) : undefined;
  const activeSection = attempt?.sections[activeSectionIndex] ?? selectedMeta?.section ?? attempt?.sections[0];
  const selectedEvidenceSpans = evidenceSpansForResult(selectedResult);

  // Keep the selected question and every authored evidence reference in view without
  // recentering the whole page. The passage HTML is rebuilt before marks are applied,
  // so the document remains pristine when teachers update an explanation.
  useEffect(() => {
    const root = passageRef.current;
    if (!root || !activeSection) return;

    root.innerHTML = activeSection.contentHtml ?? "";
    const evidenceMarks = markEvidenceSpans(root, evidenceSpansForResult(selectedResult));
    const focusedEvidence = focusedEvidenceId
      ? evidenceMarks.find((item) => item.id === focusedEvidenceId)
      : evidenceMarks[0];
    const passagePane = passagePaneRef.current;
    const mark = focusedEvidence?.marks[0];
    if (mark && passagePane) {
      window.setTimeout(() => scrollInsidePane(passagePane, mark), 50);
    }

    if (selectedKey) {
      const cardEl = document.getElementById(`question-card-${selectedKey}`);
      const answersPane = answersPaneRef.current;
      if (cardEl && answersPane) {
        window.setTimeout(() => scrollInsidePane(answersPane, cardEl), 50);
      }
    }
  }, [activeSection, focusedEvidenceId, selectedResult, selectedKey]);

  function selectQuestion(questionKey: string) {
    setSelectedKey(questionKey);
    setFocusedEvidenceId(null);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#question-${questionKey}`);
    }

    // Auto switch passage tab if question belongs to another section
    if (attempt) {
      const secIdx = attempt.sections.findIndex((sec) =>
        sec.questionGroups.some((grp) => grp.questions.some((q) => q.key === questionKey))
      );
      if (secIdx >= 0 && secIdx !== activeSectionIndex) {
        setActiveSectionIndex(secIdx);
      }
    }
  }

  if (loading) {
    return (
      <main className={styles.statePage} aria-busy="true">
        <span className="flex items-center gap-3 text-sm font-semibold text-slate-500">
          <CircleNotch size={22} className="animate-spin text-[#8f4458]" aria-hidden="true" />
          Đang chuẩn bị phần giải thích chi tiết...
        </span>
      </main>
    );
  }

  if (error || !attempt || !result) {
    return (
      <main className={styles.statePage}>
        <div className="w-full max-w-xl">
          <ReadingStatePanel title="Chưa thể mở phần giải thích" message={error || "Kết quả giải thích chưa sẵn sàng."} actionLabel="Thử lại" onAction={() => void load()} tone="error" />
          <Link href={`/student/reading/attempts/${attemptId}/result`} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-[#8f4458]">
            <ArrowLeft size={17} /> Quay lại kết quả
          </Link>
        </div>
      </main>
    );
  }

  if (!result.resultVisible) {
    return (
      <main className={styles.statePage}>
        <div className="w-full max-w-xl">
          <ReadingStatePanel title="Giải thích chưa được mở" message="Giáo viên chưa bật đáp án và lời giải chi tiết cho bài này." />
          <Link href={`/student/reading/attempts/${attemptId}/result`} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-[#8f4458]">
            <ArrowLeft size={17} /> Quay lại kết quả
          </Link>
        </div>
      </main>
    );
  }

  const totalQuestions = result.correctCount + result.incorrectCount + result.unansweredCount;
  const percentage = totalQuestions > 0 ? Math.round((result.correctCount / totalQuestions) * 100) : 0;
  const activeQuestions = activeSection ? allReadingQuestions([activeSection]) : [];

  const activeFontScale = READING_FONT_SCALE_OPTIONS.find((option) => option.value === fontScale) ?? READING_FONT_SCALE_OPTIONS[0];
  const reviewStyle = {
    "--review-content-size": `${activeFontScale.pixels}px`,
    "--review-content-line-height": activeFontScale.lineHeight,
  } as CSSProperties;
  const themeClass = colorTheme === "sepia" ? styles.themeSepia : colorTheme === "dark" ? styles.themeDark : styles.themeStandard;

  return (
    <div className={styles.shell}>
      <a href="#reading-explanations" className="student-skip-link">Đến phần giải thích</a>

      {/* Compact review toolbar */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <Link href={`/student/reading/attempts/${attemptId}/result`} className={styles.backButton} aria-label="Thoát về trang kết quả">
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <p className={styles.eyebrow}>Xem đáp án chi tiết</p>
            <h1 className={styles.title}>{attempt.title}</h1>
          </div>
        </div>

        {/* Passage Navigation Tabs */}
        {attempt.sections.length > 1 ? (
          <nav className={styles.passageTabs} aria-label="Chọn bài đọc">
            {attempt.sections.map((sec, idx) => (
              <button
                key={sec.sectionNo ?? idx}
                type="button"
                className={`${styles.passageTab} ${idx === activeSectionIndex ? styles.passageTabActive : ""}`}
                onClick={() => setActiveSectionIndex(idx)}
              >
                Passage {sec.sectionNo ?? idx + 1}
              </button>
            ))}
          </nav>
        ) : null}

        {/* Top Right Controls & Score */}
        <div className={styles.headerMeta}>
          <div className={styles.fontScalePill} role="group" aria-label="Cỡ chữ phần đáp án" title="Tùy chỉnh cỡ chữ">
            {READING_FONT_SCALE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.fontScaleButton} ${fontScale === option.value ? styles.fontScaleButtonActive : ""}`}
                onClick={() => changeFontScale(option.value)}
                aria-pressed={fontScale === option.value}
                aria-label={`Cỡ chữ ${option.label}, ${option.pixels} pixel`}
                title={`${option.label}: ${option.pixels} px`}
              >
                {option.glyph}
              </button>
            ))}
          </div>

          <div className={styles.controlPill} title="Chế độ màu hiển thị">
            <button type="button" className={`${styles.controlButton} ${colorTheme === "standard" ? styles.controlButtonActive : ""}`} onClick={() => changeColorTheme("standard")} aria-label="Chuẩn">
              <Sun size={14} />
            </button>
            <button type="button" className={`${styles.controlButton} ${colorTheme === "sepia" ? styles.controlButtonActive : ""}`} onClick={() => changeColorTheme("sepia")} aria-label="Giấy Sepia">
              <Eye size={14} />
            </button>
            <button type="button" className={`${styles.controlButton} ${colorTheme === "dark" ? styles.controlButtonActive : ""}`} onClick={() => changeColorTheme("dark")} aria-label="Ban đêm">
              <Moon size={14} />
            </button>
          </div>

          <span className={styles.score}>
            {result.correctCount}/{totalQuestions} câu đúng ({percentage}%)
          </span>
        </div>
      </header>

      {/* Sub Info Bar */}
      <div className={styles.sectionBar}>
        <div className={styles.sectionLabel}>
          <span>READING</span>
          <strong>Passage {activeSection?.sectionNo ?? activeSectionIndex + 1}: {activeSection?.title ?? "Bài đọc"}</strong>
        </div>
        <p className={styles.sectionHint}>
          <Info size={15} weight="fill" aria-hidden="true" />
          Chọn “Xem giải thích” để đối chiếu vị trí trong bài đọc.
        </p>
        <span className={styles.sectionCount}>{activeQuestions.length} câu hỏi</span>
      </div>

      {/* Main Split Screen Workspace */}
      <main id="reading-explanations" className={styles.workspace} style={reviewStyle}>
        
        {/* Left Pane: Reading Passage */}
        <article ref={passagePaneRef} className={`${styles.passagePane} ${themeClass}`} aria-label={`Passage ${activeSection?.sectionNo ?? 1}`}>
          <div className={styles.paneInner}>
            <p className={styles.passageKicker}>Reading Passage {activeSection?.sectionNo ?? activeSectionIndex + 1}</p>
            <h2 className={styles.passageTitle}>{activeSection?.title ?? "Reading Passage"}</h2>

            {/* Compact evidence summary stays visible above the passage. */}
            {selectedResult && selectedEvidenceSpans.length > 0 ? (
              <div className={styles.evidenceCard}>
                <MapPin size={18} weight="fill" aria-hidden="true" />
                <div>
                  <strong>Vị trí đối chiếu · Câu {selectedResult.questionNo}</strong>
                  <blockquote>
                    {selectedEvidenceSpans[0].quote
                      ? `“${selectedEvidenceSpans[0].quote}”`
                      : selectedEvidenceSpans[0].label || "Giáo viên không dùng trích dẫn trực tiếp cho câu này."}
                    {selectedEvidenceSpans.length > 1 ? ` · +${selectedEvidenceSpans.length - 1} vị trí khác` : ""}
                  </blockquote>
                </div>
              </div>
            ) : null}

            <div ref={passageRef} className={styles.passageContent} />
          </div>
        </article>

        {/* Right Pane: compact question review with inline explanations */}
        <aside ref={answersPaneRef} className={styles.answersPane} aria-label="Danh sách câu hỏi và lời giải">
          <div className={styles.paneInner}>
            <div className={styles.answersInner}>
              
              {/* Question Groups */}
              {activeSection?.questionGroups.map((group) => {
                const isTable = group.typeFormat === "TABLE_COMPLETION";
                const isFlowChart = group.typeFormat === "FLOW_CHART_COMPLETION";
                const isDiagram = group.typeFormat === "DIAGRAM_LABELING";
                const isShortAnswer = group.typeFormat === "SHORT_ANSWER";
                const isGapFill =
                  Boolean(group.answerConfig?.gapFillTemplate) ||
                  group.typeFormat === "SUMMARY_COMPLETION" ||
                  group.typeFormat === "NOTE_COMPLETION" ||
                  group.typeFormat === "SENTENCE_COMPLETION" ||
                  group.typeFormat === "FILL_IN_BLANK";

                if (isTable) {
                  const selectedQuestionInGroup = group.questions.find((q) => q.key === selectedKey);
                  const selectedResultInGroup = selectedQuestionInGroup ? resultByKey.get(selectedQuestionInGroup.key) : undefined;
                  const selectedStudentResp = selectedQuestionInGroup
                    ? attempt.responses.find((r) => r.questionKey === selectedQuestionInGroup.key)
                    : undefined;
                  const selectedStudentAnswerText = answerValues(selectedStudentResp?.answer).join(", ");

                  return (
                    <section key={group.key} className={styles.questionGroup}>
                      <div className={styles.groupHeading}>
                        <span className={styles.groupEyebrow}>{groupQuestionLabel(group)}</span>
                        <h3 className={styles.groupTitle}>{group.title}</h3>
                        {group.instructions ? <p className={styles.groupInstructions}>{group.instructions}</p> : null}
                      </div>

                      <TableReviewCard
                        group={group}
                        resultByKey={resultByKey}
                        attemptResponses={attempt.responses}
                        selectedKey={selectedKey}
                        onSelectQuestion={selectQuestion}
                      />

                      {selectedQuestionInGroup && selectedResultInGroup ? (
                        <QuestionExplanationPanel
                          result={selectedResultInGroup}
                          studentAnswerText={selectedStudentAnswerText}
                          focusedEvidenceId={focusedEvidenceId}
                          onFocusEvidence={setFocusedEvidenceId}
                        />
                      ) : null}
                    </section>
                  );
                }

                if (isFlowChart) {
                  const selectedQuestionInGroup = group.questions.find((q) => q.key === selectedKey);
                  const selectedResultInGroup = selectedQuestionInGroup ? resultByKey.get(selectedQuestionInGroup.key) : undefined;
                  const selectedStudentResp = selectedQuestionInGroup
                    ? attempt.responses.find((r) => r.questionKey === selectedQuestionInGroup.key)
                    : undefined;
                  const selectedStudentAnswerText = answerValues(selectedStudentResp?.answer).join(", ");

                  return (
                    <section key={group.key} className={styles.questionGroup}>
                      <div className={styles.groupHeading}>
                        <span className={styles.groupEyebrow}>{groupQuestionLabel(group)}</span>
                        <h3 className={styles.groupTitle}>{group.title}</h3>
                        {group.instructions ? <p className={styles.groupInstructions}>{group.instructions}</p> : null}
                      </div>

                      <FlowChartReviewCard
                        group={group}
                        resultByKey={resultByKey}
                        attemptResponses={attempt.responses}
                        selectedKey={selectedKey}
                        onSelectQuestion={selectQuestion}
                      />

                      {selectedQuestionInGroup && selectedResultInGroup ? (
                        <QuestionExplanationPanel
                          result={selectedResultInGroup}
                          studentAnswerText={selectedStudentAnswerText}
                          focusedEvidenceId={focusedEvidenceId}
                          onFocusEvidence={setFocusedEvidenceId}
                        />
                      ) : null}
                    </section>
                  );
                }

                if (isDiagram) {
                  const selectedQuestionInGroup = group.questions.find((q) => q.key === selectedKey);
                  const selectedResultInGroup = selectedQuestionInGroup ? resultByKey.get(selectedQuestionInGroup.key) : undefined;
                  const selectedStudentResp = selectedQuestionInGroup
                    ? attempt.responses.find((r) => r.questionKey === selectedQuestionInGroup.key)
                    : undefined;
                  const selectedStudentAnswerText = answerValues(selectedStudentResp?.answer).join(", ");

                  return (
                    <section key={group.key} className={styles.questionGroup}>
                      <div className={styles.groupHeading}>
                        <span className={styles.groupEyebrow}>{groupQuestionLabel(group)}</span>
                        <h3 className={styles.groupTitle}>{group.title}</h3>
                        {group.instructions ? <p className={styles.groupInstructions}>{group.instructions}</p> : null}
                      </div>

                      <DiagramReviewCard
                        group={group}
                        resultByKey={resultByKey}
                        attemptResponses={attempt.responses}
                        selectedKey={selectedKey}
                        onSelectQuestion={selectQuestion}
                      />

                      {selectedQuestionInGroup && selectedResultInGroup ? (
                        <QuestionExplanationPanel
                          result={selectedResultInGroup}
                          studentAnswerText={selectedStudentAnswerText}
                          focusedEvidenceId={focusedEvidenceId}
                          onFocusEvidence={setFocusedEvidenceId}
                        />
                      ) : null}
                    </section>
                  );
                }

                if (isShortAnswer) {
                  return (
                    <section key={group.key} className={styles.questionGroup}>
                      <div className={styles.groupHeading}>
                        <span className={styles.groupEyebrow}>{groupQuestionLabel(group)}</span>
                        <h3 className={styles.groupTitle}>{group.title}</h3>
                        {group.instructions ? <p className={styles.groupInstructions}>{group.instructions}</p> : null}
                      </div>

                      <div className={styles.questionList}>
                        {group.questions.map((question) => {
                          const qResult = resultByKey.get(question.key);
                          const studentResp = attempt.responses.find((r) => r.questionKey === question.key);
                          const studentAnswerText = answerValues(studentResp?.answer).join(", ");
                          const isSelected = question.key === selectedKey;

                          return (
                            <Fragment key={question.key}>
                              <ShortAnswerReviewCard
                                question={question}
                                group={group}
                                qResult={qResult}
                                studentAnswerText={studentAnswerText}
                                isSelected={isSelected}
                                onSelect={() => selectQuestion(question.key)}
                              />

                              {isSelected && qResult ? (
                                <QuestionExplanationPanel
                                  result={qResult}
                                  studentAnswerText={studentAnswerText}
                                  focusedEvidenceId={focusedEvidenceId}
                                  onFocusEvidence={setFocusedEvidenceId}
                                />
                              ) : null}
                            </Fragment>
                          );
                        })}
                      </div>
                    </section>
                  );
                }

                if (isGapFill) {
                  const selectedQuestionInGroup = group.questions.find((q) => q.key === selectedKey);
                  const selectedResultInGroup = selectedQuestionInGroup ? resultByKey.get(selectedQuestionInGroup.key) : undefined;
                  const selectedStudentResp = selectedQuestionInGroup
                    ? attempt.responses.find((r) => r.questionKey === selectedQuestionInGroup.key)
                    : undefined;
                  const selectedStudentAnswerText = answerValues(selectedStudentResp?.answer).join(", ");

                  return (
                    <section key={group.key} className={styles.questionGroup}>
                      <div className={styles.groupHeading}>
                        <span className={styles.groupEyebrow}>{groupQuestionLabel(group)}</span>
                        <h3 className={styles.groupTitle}>{group.title}</h3>
                        {group.instructions ? <p className={styles.groupInstructions}>{group.instructions}</p> : null}
                      </div>

                      {group.sharedOptions.length > 0 ? (
                        <div className={styles.sharedOptions}>
                          <p><ListBullets size={16} /> Danh sách lựa chọn chung:</p>
                          <ul>
                            {group.sharedOptions.map((opt) => (
                              <li key={opt.key}>{optionLabel(opt.code, opt.text)}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <GapFillReviewCard
                        group={group}
                        resultByKey={resultByKey}
                        attemptResponses={attempt.responses}
                        selectedKey={selectedKey}
                        onSelectQuestion={selectQuestion}
                      />

                      {selectedQuestionInGroup && selectedResultInGroup ? (
                        <QuestionExplanationPanel
                          result={selectedResultInGroup}
                          studentAnswerText={selectedStudentAnswerText}
                          focusedEvidenceId={focusedEvidenceId}
                          onFocusEvidence={setFocusedEvidenceId}
                        />
                      ) : null}
                    </section>
                  );
                }

                return (
                  <section key={group.key} className={styles.questionGroup}>
                    <div className={styles.groupHeading}>
                      <span className={styles.groupEyebrow}>{groupQuestionLabel(group)}</span>
                      <h3 className={styles.groupTitle}>{group.title}</h3>
                      {group.instructions ? <p className={styles.groupInstructions}>{group.instructions}</p> : null}
                    </div>

                    {group.sharedOptions.length > 0 ? (
                      <div className={styles.sharedOptions}>
                        <p><ListBullets size={16} /> Danh sách lựa chọn chung:</p>
                        <ul>
                          {group.sharedOptions.map((opt) => (
                            <li key={opt.key}>{optionLabel(opt.code, opt.text)}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div className={styles.questionList}>
                      {group.questions.map((question) => {
                        const qResult = resultByKey.get(question.key);
                        const studentResp = attempt.responses.find((r) => r.questionKey === question.key);
                        const studentAnswerText = answerValues(studentResp?.answer).join(", ");
                        const isSelected = question.key === selectedKey;

                        return (
                          <Fragment key={question.key}>
                            <QuestionReviewCard
                              question={question}
                              group={group}
                              qResult={qResult}
                              studentAnswerText={studentAnswerText}
                              isSelected={isSelected}
                              onSelect={() => selectQuestion(question.key)}
                            />

                            {isSelected && qResult ? (
                              <QuestionExplanationPanel
                                result={qResult}
                                studentAnswerText={studentAnswerText}
                                focusedEvidenceId={focusedEvidenceId}
                                onFocusEvidence={setFocusedEvidenceId}
                              />
                            ) : null}
                          </Fragment>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </aside>
      </main>

      {/* Footer Palette Bar */}
      <footer className={styles.footer}>
        <nav className={styles.questionNav} aria-label="Bảng câu hỏi nhanh">
          {result.questions.map((q) => {
            const isSelected = q.questionKey === selectedKey;
            const btnClass = isSelected
              ? styles.paletteBtnActive
              : q.correct
              ? styles.paletteBtnCorrect
              : q.answered
              ? styles.paletteBtnIncorrect
              : styles.paletteBtnUnanswered;

            return (
              <button
                key={q.questionKey}
                type="button"
                className={`${styles.paletteBtn} ${btnClass}`}
                onClick={() => selectQuestion(q.questionKey)}
                title={`Câu ${q.questionNo}: ${q.correct ? "Đúng" : q.answered ? "Sai" : "Chưa trả lời"}`}
              >
                {q.questionNo}
              </button>
            );
          })}
        </nav>

        <Link href={`/student/reading/attempts/${attemptId}/result`} className={styles.resultLink}>
          <ArrowLeft size={16} />
          <span>Về kết quả bài làm</span>
        </Link>
      </footer>
    </div>
  );
}

function QuestionReviewCard({
  question,
  group,
  qResult,
  studentAnswerText,
  isSelected,
  onSelect,
}: {
  question: ReadingQuestion;
  group: ReadingQuestionGroup;
  qResult: ReadingQuestionResult | undefined;
  studentAnswerText: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isCorrect = qResult?.correct === true;
  const isUnanswered = !qResult?.answered;
  const isIncorrect = qResult?.answered && !qResult?.correct;
  const options = questionOptions(question, group);

  const isMatching =
    group.typeFormat === "MATCHING_HEADINGS" ||
    group.typeFormat === "MATCHING_INFORMATION" ||
    group.typeFormat === "MATCHING_FEATURES" ||
    group.typeFormat === "MATCHING_SENTENCE_ENDINGS";

  const isTFNG =
    group.typeFormat === "TRUE_FALSE_NOT_GIVEN" ||
    group.typeFormat === "YES_NO_NOT_GIVEN";

  const isMC =
    group.typeFormat === "MULTIPLE_CHOICE" ||
    group.typeFormat === "MULTIPLE_ANSWERS";

  const badgeClass = isCorrect
    ? styles.badgeCorrect
    : isIncorrect
    ? styles.badgeIncorrect
    : styles.badgeUnanswered;

  const statusPillClass = isCorrect
    ? styles.statusCorrect
    : isIncorrect
    ? styles.statusIncorrect
    : styles.statusUnanswered;

  // 1 & 2: True/False/Not Given & Yes/No/Not Given
  if (isTFNG) {
    const tfngOptions =
      group.typeFormat === "TRUE_FALSE_NOT_GIVEN"
        ? ["TRUE", "FALSE", "NOT GIVEN"]
        : ["YES", "NO", "NOT GIVEN"];

    return (
      <article
        id={`question-card-${question.key}`}
        className={`${styles.questionCard} ${isSelected ? styles.questionCardActive : ""}`}
        onClick={onSelect}
      >
        <div className={styles.questionTopline}>
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <span className={styles.circleQuestionBadge}>{question.number}</span>
            <p className={styles.questionPrompt}>{question.prompt || `Câu hỏi ${question.number}`}</p>
          </div>
          <div className={styles.questionActions}>
            <span className={`${styles.statusPill} ${statusPillClass}`}>
              {isCorrect ? (
                <><CheckCircle size={14} weight="fill" /> Đúng</>
              ) : isIncorrect ? (
                <><XCircle size={14} weight="fill" /> Sai</>
              ) : (
                <><MinusCircle size={14} weight="fill" /> Bỏ qua</>
              )}
            </span>
            <button
              type="button"
              className={`${styles.explanationButton} ${isSelected ? styles.explanationButtonActive : ""}`}
              onClick={onSelect}
              aria-expanded={isSelected}
              aria-controls={`question-explanation-${question.key}`}
            >
              <ChatCircleDots size={16} weight={isSelected ? "fill" : "regular"} aria-hidden="true" />
              <span>{isSelected ? "Đang xem" : "Xem giải thích"}</span>
            </button>
          </div>
        </div>

        <div className={styles.radioOptionsListReview}>
          {tfngOptions.map((opt) => {
            const isStudentSelected = studentAnswerText === opt;
            const isOptionCorrect = qResult?.correctAnswers.includes(opt);

            let rowClass = styles.radioRowReview;
            if (isStudentSelected && isOptionCorrect) {
              rowClass = `${styles.radioRowReview} ${styles.radioRowReviewCorrect}`;
            } else if (isStudentSelected && !isOptionCorrect) {
              rowClass = `${styles.radioRowReview} ${styles.radioRowReviewIncorrect}`;
            } else if (isOptionCorrect && (isIncorrect || isUnanswered)) {
              rowClass = `${styles.radioRowReview} ${styles.radioRowReviewIsCorrect}`;
            }

            return (
              <div key={opt} className={rowClass}>
                <span className={`${styles.radioCircle} ${isStudentSelected ? styles.radioCircleChecked : ""}`} />
                <span className="flex-1">{opt}</span>
                {isStudentSelected && isOptionCorrect ? (
                  <Check size={16} className="text-emerald-600 font-bold" />
                ) : isStudentSelected && !isOptionCorrect ? (
                  <X size={16} className="text-rose-600 font-bold" />
                ) : isOptionCorrect && (isIncorrect || isUnanswered) ? (
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Đáp án chuẩn</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </article>
    );
  }

  // 3: Multiple Choice
  if (isMC && options.length > 0) {
    return (
      <article
        id={`question-card-${question.key}`}
        className={`${styles.questionCard} ${isSelected ? styles.questionCardActive : ""}`}
        onClick={onSelect}
      >
        <div className={styles.questionTopline}>
          <div className="flex items-baseline gap-2 flex-1 min-w-0">
            <strong className="text-base font-extrabold text-slate-900">{question.number}</strong>
            <p className={styles.questionPrompt}>{question.prompt || `Câu hỏi ${question.number}`}</p>
          </div>
          <div className={styles.questionActions}>
            <span className={`${styles.statusPill} ${statusPillClass}`}>
              {isCorrect ? (
                <><CheckCircle size={14} weight="fill" /> Đúng</>
              ) : isIncorrect ? (
                <><XCircle size={14} weight="fill" /> Sai</>
              ) : (
                <><MinusCircle size={14} weight="fill" /> Bỏ qua</>
              )}
            </span>
            <button
              type="button"
              className={`${styles.explanationButton} ${isSelected ? styles.explanationButtonActive : ""}`}
              onClick={onSelect}
              aria-expanded={isSelected}
              aria-controls={`question-explanation-${question.key}`}
            >
              <ChatCircleDots size={16} weight={isSelected ? "fill" : "regular"} aria-hidden="true" />
              <span>{isSelected ? "Đang xem" : "Xem giải thích"}</span>
            </button>
          </div>
        </div>

        <div className={styles.radioOptionsListReview}>
          {options.map((option) => {
            const isStudentSelected =
              studentAnswerText.split(", ").includes(option.key) ||
              studentAnswerText === option.code;
            const isOptionCorrect =
              qResult?.correctAnswers.includes(option.key) ||
              qResult?.correctAnswers.includes(option.code ?? "");

            let rowClass = styles.radioRowReview;
            if (isStudentSelected && isOptionCorrect) {
              rowClass = `${styles.radioRowReview} ${styles.radioRowReviewCorrect}`;
            } else if (isStudentSelected && !isOptionCorrect) {
              rowClass = `${styles.radioRowReview} ${styles.radioRowReviewIncorrect}`;
            } else if (isOptionCorrect && (isIncorrect || isUnanswered)) {
              rowClass = `${styles.radioRowReview} ${styles.radioRowReviewIsCorrect}`;
            }

            const isMultipleAnswers = group.typeFormat === "MULTIPLE_ANSWERS";

            return (
              <div key={option.key} className={rowClass}>
                {isMultipleAnswers ? (
                  <span
                    className={`${styles.mcReviewCheckbox} ${
                      isStudentSelected ? styles.mcReviewCheckboxChecked : ""
                    }`}
                  >
                    {isStudentSelected ? <Check size={12} weight="bold" /> : null}
                  </span>
                ) : (
                  <span className={`${styles.radioCircle} ${isStudentSelected ? styles.radioCircleChecked : ""}`} />
                )}
                <span className="flex-1">{optionLabel(option.code, option.text)}</span>
                {isStudentSelected && isOptionCorrect ? (
                  <Check size={16} className="text-emerald-600 font-bold" />
                ) : isStudentSelected && !isOptionCorrect ? (
                  <X size={16} className="text-rose-600 font-bold" />
                ) : isOptionCorrect && (isIncorrect || isUnanswered) ? (
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Đáp án chuẩn</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </article>
    );
  }

  // 4 & 5: Matching Headings, Information, Sentence Endings
  if (isMatching) {
    const bankOptions =
      group.sharedOptions.length > 0
        ? group.sharedOptions
        : group.questions.flatMap((q) => q.options);
    const matchedOption = bankOptions.find((o) => o.key === studentAnswerText || o.code === studentAnswerText);
    const displayLabel = matchedOption ? optionLabel(matchedOption.code, matchedOption.text) : studentAnswerText;

    return (
      <article
        id={`question-card-${question.key}`}
        className={`${styles.questionCard} ${isSelected ? styles.questionCardActive : ""}`}
        onClick={onSelect}
      >
        <div className={styles.questionTopline}>
          <span className={`${styles.questionBadge} ${badgeClass}`}>
            {question.number}
          </span>
          <div className={styles.questionActions}>
            <span className={`${styles.statusPill} ${statusPillClass}`}>
              {isCorrect ? (
                <><CheckCircle size={14} weight="fill" /> Đúng</>
              ) : isIncorrect ? (
                <><XCircle size={14} weight="fill" /> Sai</>
              ) : (
                <><MinusCircle size={14} weight="fill" /> Bỏ qua</>
              )}
            </span>
            <button
              type="button"
              className={`${styles.explanationButton} ${isSelected ? styles.explanationButtonActive : ""}`}
              onClick={onSelect}
              aria-expanded={isSelected}
              aria-controls={`question-explanation-${question.key}`}
            >
              <ChatCircleDots size={16} weight={isSelected ? "fill" : "regular"} aria-hidden="true" />
              <span>{isSelected ? "Đang xem" : "Xem giải thích"}</span>
            </button>
          </div>
        </div>

        <p className={styles.questionPrompt}>{question.prompt || `Câu hỏi ${question.number}`}</p>

        <div className={styles.matchingReviewRow}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500">Học viên chọn:</span>
            <div className={`${styles.matchingSlotReview} ${
              isCorrect
                ? styles.matchingSlotReviewCorrect
                : isIncorrect
                ? styles.matchingSlotReviewIncorrect
                : styles.matchingSlotReviewUnanswered
            }`}>
              {isCorrect ? (
                <CheckCircle size={14} weight="fill" />
              ) : isIncorrect ? (
                <XCircle size={14} weight="fill" />
              ) : (
                <MinusCircle size={14} weight="fill" />
              )}
              <span>{displayLabel || `[ Ô ${question.number} - Bỏ qua ]`}</span>
            </div>
          </div>

          {(isIncorrect || isUnanswered) && qResult?.correctAnswers.length ? (
            <div className={styles.matchingCorrectCallout}>
              <span>💡 Đáp án chuẩn:</span>
              <strong>{qResult.correctAnswers.join(", ")}</strong>
            </div>
          ) : null}
        </div>
      </article>
    );
  }

  // Default / Fill in blanks
  return (
    <article
      id={`question-card-${question.key}`}
      className={`${styles.questionCard} ${isSelected ? styles.questionCardActive : ""}`}
      onClick={onSelect}
    >
      <div className={styles.questionTopline}>
        <span className={`${styles.questionBadge} ${badgeClass}`}>
          {question.number}
        </span>
        <div className={styles.questionActions}>
          <span className={`${styles.statusPill} ${statusPillClass}`}>
            {isCorrect ? (
              <><CheckCircle size={14} weight="fill" /> Đúng</>
            ) : isIncorrect ? (
              <><XCircle size={14} weight="fill" /> Sai</>
            ) : (
              <><MinusCircle size={14} weight="fill" /> Bỏ qua</>
            )}
          </span>
          <button
            type="button"
            className={`${styles.explanationButton} ${isSelected ? styles.explanationButtonActive : ""}`}
            onClick={onSelect}
            aria-expanded={isSelected}
            aria-controls={`question-explanation-${question.key}`}
          >
            <ChatCircleDots size={16} weight={isSelected ? "fill" : "regular"} aria-hidden="true" />
            <span>{isSelected ? "Đang xem" : "Xem giải thích"}</span>
          </button>
        </div>
      </div>

      <p className={styles.questionPrompt}>{question.prompt || `Câu hỏi ${question.number}`}</p>

      {/* Fill-in-blank / Short answer response display */}
      <div className={styles.responseBox}>
        <div className={`${styles.userAnswerRow} ${
          isCorrect ? styles.userAnswerCorrect : isIncorrect ? styles.userAnswerIncorrect : styles.userAnswerUnanswered
        }`}>
          <span>Bạn trả lời:</span>
          <strong>{studentAnswerText || "Bỏ qua (Chưa điền)"}</strong>
        </div>
        {(isIncorrect || isUnanswered) && qResult?.correctAnswers.length ? (
          <div className={styles.correctAnswerRow}>
            <span>Đáp án chuẩn:</span>
            <strong>{qResult.correctAnswers.join(", ")}</strong>
          </div>
        ) : null}
      </div>
    </article>
  );
}

// ========================================================
// Gap-Filling / Summary / Note Review Card (CD-IELTS Standard)
// ========================================================
function GapInlineReviewSlot({
  question,
  qResult,
  studentAnswerText,
  isSelected,
  onSelect,
}: {
  question: ReadingQuestion;
  qResult: ReadingQuestionResult | undefined;
  studentAnswerText: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isCorrect = qResult?.correct === true;
  const isUnanswered = !qResult?.answered;
  const isIncorrect = qResult?.answered && !qResult?.correct;

  return (
    <span
      id={`question-card-${question.key}`}
      className={styles.gapInlineReviewSlot}
      onClick={onSelect}
    >
      <span
        className={`${styles.gapInlineReviewPill} ${
          isCorrect
            ? styles.gapInlineReviewCorrect
            : isIncorrect
            ? styles.gapInlineReviewIncorrect
            : styles.gapInlineReviewUnanswered
        } ${isSelected ? styles.gapInlineReviewPillActive : ""}`}
        title={`Câu ${question.number}: ${isCorrect ? "Đúng" : isIncorrect ? "Sai" : "Chưa trả lời"} - Bấm xem giải thích`}
      >
        <span className={styles.gapInlineNumber}>{question.number}</span>
        {isCorrect ? (
          <>
            <span className={styles.gapInlineAnswerText}>{studentAnswerText}</span>
            <Check size={14} weight="bold" />
          </>
        ) : isIncorrect ? (
          <>
            <span className={styles.gapInlineAnswerText}>{studentAnswerText || "[ Bỏ trống ]"}</span>
            <X size={14} weight="bold" />
          </>
        ) : (
          <span className={styles.gapInlineAnswerText}>[ Bỏ qua ]</span>
        )}
      </span>

      {(isIncorrect || isUnanswered) && qResult?.correctAnswers && qResult.correctAnswers.length > 0 ? (
        <span className={styles.gapInlineCorrectTag} title="Đáp án chuẩn">
          <Lightbulb size={12} weight="fill" />
          <span>{qResult.correctAnswers.join(" / ")}</span>
        </span>
      ) : null}
    </span>
  );
}

function parseLineTokensReview(line: string): Array<{ type: "text"; text: string } | { type: "slot"; questionNo: number }> {
  const tokens: Array<{ type: "text"; text: string } | { type: "slot"; questionNo: number }> = [];
  const regex = /\[\[(\d+)\]\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", text: line.substring(lastIndex, match.index) });
    }
    tokens.push({ type: "slot", questionNo: parseInt(match[1], 10) });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    tokens.push({ type: "text", text: line.substring(lastIndex) });
  }

  return tokens;
}

function GapFillReviewCard({
  group,
  resultByKey,
  attemptResponses,
  selectedKey,
  onSelectQuestion,
}: {
  group: ReadingQuestionGroup;
  resultByKey: Map<string, ReadingQuestionResult>;
  attemptResponses: Array<{ questionKey: string; answer?: ReadingAnswer }>;
  selectedKey: string;
  onSelectQuestion: (questionKey: string) => void;
}) {
  const rawTemplate =
    typeof group.answerConfig?.gapFillTemplate === "string"
      ? group.answerConfig.gapFillTemplate.trim()
      : "";

  const questionByNumber = useMemo(() => {
    const map = new Map<number, ReadingQuestion>();
    group.questions.forEach((q) => {
      map.set(q.number, q);
    });
    return map;
  }, [group.questions]);

  const templateLines = useMemo(() => {
    if (!rawTemplate) return [];
    return rawTemplate.split(/\r?\n/);
  }, [rawTemplate]);

  return (
    <div className={styles.gapFillReviewCard}>
      {group.title && rawTemplate ? (
        <h4 className={styles.gapFillReviewTitle}>{group.title}</h4>
      ) : null}

      <div className={styles.gapFillReviewBody}>
        {rawTemplate ? (
          templateLines.map((line, lineIdx) => {
            const trimmed = line.trim();
            if (!trimmed) {
              return <div key={lineIdx} style={{ height: "8px" }} />;
            }

            const isHeading =
              (trimmed.startsWith("#") ||
                (trimmed.endsWith(":") && !trimmed.includes("[[") && trimmed.length < 60)) &&
              !trimmed.startsWith("•") &&
              !trimmed.startsWith("-");

            if (isHeading) {
              const headingText = trimmed.replace(/^#+\s*/, "");
              return (
                <div key={lineIdx} className={styles.gapFillReviewHeading}>
                  {headingText}
                </div>
              );
            }

            const tokens = parseLineTokensReview(line);
            return (
              <div key={lineIdx} className={styles.gapFillReviewLine}>
                {tokens.map((token, tokenIdx) => {
                  if (token.type === "text") {
                    return <span key={tokenIdx}>{token.text}</span>;
                  }
                  const q =
                    questionByNumber.get(token.questionNo) ??
                    group.questions[token.questionNo - 1];
                  if (!q) {
                    return <span key={tokenIdx}>[[{token.questionNo}]]</span>;
                  }
                  const qResult = resultByKey.get(q.key);
                  const studentResp = attemptResponses.find((r) => r.questionKey === q.key);
                  const studentAnswerText = answerValues(studentResp?.answer).join(", ");
                  const isSelected = selectedKey === q.key;

                  return (
                    <GapInlineReviewSlot
                      key={q.key}
                      question={q}
                      qResult={qResult}
                      studentAnswerText={studentAnswerText}
                      isSelected={isSelected}
                      onSelect={() => onSelectQuestion(q.key)}
                    />
                  );
                })}
              </div>
            );
          })
        ) : (
          group.questions.map((question) => {
            const qResult = resultByKey.get(question.key);
            const studentResp = attemptResponses.find((r) => r.questionKey === question.key);
            const studentAnswerText = answerValues(studentResp?.answer).join(", ");
            const isSelected = selectedKey === question.key;

            const prompt = question.prompt || "";
            const hasUnderscores = /_{2,}/.test(prompt);
            const hasTokens = /\[\[\d+\]\]/.test(prompt);

            if (hasTokens) {
              const tokens = parseLineTokensReview(prompt);
              return (
                <div key={question.key} className={styles.gapFillReviewLine}>
                  {tokens.map((token, tokenIdx) => {
                    if (token.type === "text") {
                      return <span key={tokenIdx}>{token.text}</span>;
                    }
                    const q = questionByNumber.get(token.questionNo) ?? question;
                    const slotResult = resultByKey.get(q.key);
                    const slotResp = attemptResponses.find((r) => r.questionKey === q.key);
                    const slotAnswerText = answerValues(slotResp?.answer).join(", ");
                    return (
                      <GapInlineReviewSlot
                        key={q.key}
                        question={q}
                        qResult={slotResult}
                        studentAnswerText={slotAnswerText}
                        isSelected={selectedKey === q.key}
                        onSelect={() => onSelectQuestion(q.key)}
                      />
                    );
                  })}
                </div>
              );
            }

            if (hasUnderscores) {
              const parts = prompt.split(/_{2,}/);
              return (
                <div key={question.key} className={styles.gapFillReviewLine}>
                  {parts.map((part, pIdx) => (
                    <Fragment key={pIdx}>
                      <span>{part}</span>
                      {pIdx < parts.length - 1 ? (
                        <GapInlineReviewSlot
                          question={question}
                          qResult={qResult}
                          studentAnswerText={studentAnswerText}
                          isSelected={isSelected}
                          onSelect={() => onSelectQuestion(question.key)}
                        />
                      ) : null}
                    </Fragment>
                  ))}
                </div>
              );
            }

            return (
              <div key={question.key} className={styles.gapFillReviewLine}>
                <strong style={{ marginRight: 6 }}>{question.number}.</strong>
                <span>{prompt} </span>
                <GapInlineReviewSlot
                  question={question}
                  qResult={qResult}
                  studentAnswerText={studentAnswerText}
                  isSelected={isSelected}
                  onSelect={() => onSelectQuestion(question.key)}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ========================================================
// 7: Table Completion Review Card (CD-IELTS Standard)
// ========================================================
function TableReviewCard({
  group,
  resultByKey,
  attemptResponses,
  selectedKey,
  onSelectQuestion,
}: {
  group: ReadingQuestionGroup;
  resultByKey: Map<string, ReadingQuestionResult>;
  attemptResponses: Array<{ questionKey: string; answer?: ReadingAnswer }>;
  selectedKey: string;
  onSelectQuestion: (questionKey: string) => void;
}) {
  const rawTemplate =
    typeof group.answerConfig?.gapFillTemplate === "string"
      ? group.answerConfig.gapFillTemplate.trim()
      : "";

  const questionByNumber = useMemo(() => {
    const map = new Map<number, ReadingQuestion>();
    group.questions.forEach((q) => map.set(q.number, q));
    return map;
  }, [group.questions]);

  const parsedTable = useMemo(() => {
    if (!rawTemplate || !rawTemplate.includes("|")) return null;
    const lines = rawTemplate.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const tableLines = lines.filter((l) => l.startsWith("|") || l.includes(" | "));
    if (tableLines.length < 2) return null;

    const nonSeparator = tableLines.filter((l) => !/^[|\s-:]+$/.test(l));
    if (nonSeparator.length < 1) return null;

    const headers = nonSeparator[0]
      .split("|")
      .map((c) => c.trim())
      .filter((c, idx, arr) => (idx > 0 && idx < arr.length - 1) || c.length > 0);

    const rows = nonSeparator.slice(1).map((line) => {
      return line
        .split("|")
        .map((c) => c.trim())
        .filter((c, idx, arr) => (idx > 0 && idx < arr.length - 1) || c.length > 0);
    });

    return { headers, rows };
  }, [rawTemplate]);

  return (
    <div className={styles.tableReviewWrapper}>
      {parsedTable ? (
        <table className={styles.cdIeltsTableReview}>
          {parsedTable.headers.length > 0 ? (
            <thead>
              <tr>
                {parsedTable.headers.map((h, hIdx) => (
                  <th key={hIdx}>{h}</th>
                ))}
              </tr>
            </thead>
          ) : null}
          <tbody>
            {parsedTable.rows.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => {
                  const tokens = parseLineTokensReview(cell);
                  return (
                    <td key={cIdx}>
                      {tokens.map((token, tIdx) => {
                        if (token.type === "text") {
                          return <span key={tIdx}>{token.text}</span>;
                        }
                        const q =
                          questionByNumber.get(token.questionNo) ??
                          group.questions[token.questionNo - 1];
                        if (!q) return <span key={tIdx}>[[{token.questionNo}]]</span>;
                        const qResult = resultByKey.get(q.key);
                        const studentResp = attemptResponses.find((r) => r.questionKey === q.key);
                        const studentAnswerText = answerValues(studentResp?.answer).join(", ");
                        const isSelected = selectedKey === q.key;

                        return (
                          <GapInlineReviewSlot
                            key={q.key}
                            question={q}
                            qResult={qResult}
                            studentAnswerText={studentAnswerText}
                            isSelected={isSelected}
                            onSelect={() => onSelectQuestion(q.key)}
                          />
                        );
                      })}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table className={styles.cdIeltsTableReview}>
          <thead>
            <tr>
              <th style={{ width: "80px" }}>Số câu</th>
              <th>Nội dung thông tin</th>
              <th style={{ width: "240px" }}>Kết quả điền khuyết</th>
            </tr>
          </thead>
          <tbody>
            {group.questions.map((question) => {
              const prompt = question.prompt || "";
              const qResult = resultByKey.get(question.key);
              const studentResp = attemptResponses.find((r) => r.questionKey === question.key);
              const studentAnswerText = answerValues(studentResp?.answer).join(", ");
              const isSelected = selectedKey === question.key;

              return (
                <tr key={question.key}>
                  <td>
                    <strong>{question.number}</strong>
                  </td>
                  <td>{prompt.replace(/_{2,}/g, "...")}</td>
                  <td>
                    <GapInlineReviewSlot
                      question={question}
                      qResult={qResult}
                      studentAnswerText={studentAnswerText}
                      isSelected={isSelected}
                      onSelect={() => onSelectQuestion(question.key)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ========================================================
// 8: Flow-Chart Review Card (CD-IELTS Standard)
// ========================================================
function FlowChartReviewCard({
  group,
  resultByKey,
  attemptResponses,
  selectedKey,
  onSelectQuestion,
}: {
  group: ReadingQuestionGroup;
  resultByKey: Map<string, ReadingQuestionResult>;
  attemptResponses: Array<{ questionKey: string; answer?: ReadingAnswer }>;
  selectedKey: string;
  onSelectQuestion: (questionKey: string) => void;
}) {
  const rawTemplate =
    typeof group.answerConfig?.gapFillTemplate === "string"
      ? group.answerConfig.gapFillTemplate.trim()
      : "";

  const questionByNumber = useMemo(() => {
    const map = new Map<number, ReadingQuestion>();
    group.questions.forEach((q) => map.set(q.number, q));
    return map;
  }, [group.questions]);

  const steps = useMemo<Array<{ stepNo: number; title?: string; body: string; question?: ReadingQuestion }>>(() => {
    if (rawTemplate) {
      const rawChunks = rawTemplate.split(/\r?\n\r?\n/).map((c) => c.trim()).filter(Boolean);
      if (rawChunks.length > 1) {
        return rawChunks.map((chunk, idx) => {
          const lines = chunk.split(/\r?\n/);
          const firstLine = lines[0].trim();
          const isTitle = (firstLine.startsWith("#") || firstLine.endsWith(":")) && lines.length > 1;
          const title = isTitle ? firstLine.replace(/^#+\s*/, "").replace(/:$/, "") : undefined;
          const body = isTitle ? lines.slice(1).join(" ") : chunk;
          return { stepNo: idx + 1, title, body };
        });
      }
      const lines = rawTemplate.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      return lines.map((line, idx) => ({
        stepNo: idx + 1,
        title: undefined,
        body: line,
      }));
    }

    return group.questions.map((q, idx) => ({
      stepNo: idx + 1,
      title: `Giai đoạn ${idx + 1}`,
      body: q.prompt || "",
      question: q,
    }));
  }, [rawTemplate, group.questions]);

  return (
    <div className={styles.flowChartReviewContainer}>
      {steps.map((step, idx) => (
        <Fragment key={idx}>
          <div className={styles.flowStepReviewCard}>
            <div className={styles.flowStepReviewHeader}>
              <span className={styles.flowStepReviewBadge}>Bước {step.stepNo}</span>
              {step.title ? <h5 className={styles.flowStepReviewTitle}>{step.title}</h5> : null}
            </div>
            <div className={styles.flowStepReviewContent}>
              {step.body.includes("[[") ? (
                parseLineTokensReview(step.body).map((token, tIdx) => {
                  if (token.type === "text") return <span key={tIdx}>{token.text}</span>;
                  const q =
                    questionByNumber.get(token.questionNo) ??
                    group.questions[token.questionNo - 1];
                  if (!q) return <span key={tIdx}>[[{token.questionNo}]]</span>;
                  const qResult = resultByKey.get(q.key);
                  const studentResp = attemptResponses.find((r) => r.questionKey === q.key);
                  const studentAnswerText = answerValues(studentResp?.answer).join(", ");
                  const isSelected = selectedKey === q.key;

                  return (
                    <GapInlineReviewSlot
                      key={q.key}
                      question={q}
                      qResult={qResult}
                      studentAnswerText={studentAnswerText}
                      isSelected={isSelected}
                      onSelect={() => onSelectQuestion(q.key)}
                    />
                  );
                })
              ) : step.question ? (
                <>
                  <span>{step.body.replace(/_{2,}/g, "")} </span>
                  {(() => {
                    const qResult = resultByKey.get(step.question.key);
                    const studentResp = attemptResponses.find((r) => r.questionKey === step.question!.key);
                    const studentAnswerText = answerValues(studentResp?.answer).join(", ");
                    const isSelected = selectedKey === step.question.key;
                    return (
                      <GapInlineReviewSlot
                        question={step.question}
                        qResult={qResult}
                        studentAnswerText={studentAnswerText}
                        isSelected={isSelected}
                        onSelect={() => onSelectQuestion(step.question!.key)}
                      />
                    );
                  })()}
                </>
              ) : (
                <span>{step.body}</span>
              )}
            </div>
          </div>

          {idx < steps.length - 1 ? (
            <div className={styles.flowStepReviewArrow}>
              <ArrowDown size={20} weight="bold" />
            </div>
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}

// ========================================================
// 9: Diagram Labeling Review Card (CD-IELTS Standard)
// ========================================================
function DiagramReviewCard({
  group,
  resultByKey,
  attemptResponses,
  selectedKey,
  onSelectQuestion,
}: {
  group: ReadingQuestionGroup;
  resultByKey: Map<string, ReadingQuestionResult>;
  attemptResponses: Array<{ questionKey: string; answer?: ReadingAnswer }>;
  selectedKey: string;
  onSelectQuestion: (questionKey: string) => void;
}) {
  const imageUrl =
    typeof group.answerConfig?.imageUrl === "string"
      ? group.answerConfig.imageUrl
      : typeof group.answerConfig?.diagramUrl === "string"
      ? group.answerConfig.diagramUrl
      : undefined;

  return (
    <div className={styles.diagramReviewCard}>
      {imageUrl ? (
        <div className={styles.diagramReviewImageWrapper}>
          <img src={imageUrl} alt={group.title} className={styles.diagramReviewImage} />
        </div>
      ) : (
        <div className={styles.diagramReviewImageWrapper}>
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-slate-500">
            <TreeStructure size={36} className="text-slate-400" />
            <span className="text-xs font-semibold">Sơ đồ gắn nhãn các vị trí được đánh số</span>
          </div>
        </div>
      )}

      <div className={styles.diagramReviewLabelsList}>
        {group.questions.map((question) => {
          const prompt = question.prompt || `Vị trí ${question.number}`;
          const qResult = resultByKey.get(question.key);
          const studentResp = attemptResponses.find((r) => r.questionKey === question.key);
          const studentAnswerText = answerValues(studentResp?.answer).join(", ");
          const isSelected = selectedKey === question.key;

          return (
            <div
              key={question.key}
              id={`question-card-${question.key}`}
              className={styles.diagramReviewLabelRow}
              onClick={() => onSelectQuestion(question.key)}
            >
              <span className={styles.diagramReviewLabelIndex}>{question.number}</span>
              <span className={styles.diagramReviewLabelPrompt}>{prompt.replace(/_{2,}/g, "")}</span>
              <GapInlineReviewSlot
                question={question}
                qResult={qResult}
                studentAnswerText={studentAnswerText}
                isSelected={isSelected}
                onSelect={() => onSelectQuestion(question.key)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ========================================================
// 10: Short Answer Review Card (CD-IELTS Standard)
// ========================================================
function ShortAnswerReviewCard({
  question,
  group,
  qResult,
  studentAnswerText,
  isSelected,
  onSelect,
}: {
  question: ReadingQuestion;
  group: ReadingQuestionGroup;
  qResult: ReadingQuestionResult | undefined;
  studentAnswerText: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isCorrect = qResult?.correct === true;
  const isUnanswered = !qResult?.answered;
  const isIncorrect = qResult?.answered && !qResult?.correct;

  const statusPillClass = isCorrect
    ? styles.statusCorrect
    : isIncorrect
    ? styles.statusIncorrect
    : styles.statusUnanswered;

  return (
    <article
      id={`question-card-${question.key}`}
      className={`${styles.questionCard} ${isSelected ? styles.questionCardActive : ""}`}
      onClick={onSelect}
    >
      <div className={styles.questionTopline}>
        <div className="flex items-baseline gap-2 flex-1 min-w-0">
          <strong className="text-base font-extrabold text-slate-900">{question.number}</strong>
          <p className={styles.questionPrompt}>{question.prompt || `Câu hỏi ${question.number}`}</p>
        </div>
        <div className={styles.questionActions}>
          <span className={`${styles.statusPill} ${statusPillClass}`}>
            {isCorrect ? (
              <><CheckCircle size={14} weight="fill" /> Đúng</>
            ) : isIncorrect ? (
              <><XCircle size={14} weight="fill" /> Sai</>
            ) : (
              <><MinusCircle size={14} weight="fill" /> Bỏ qua</>
            )}
          </span>
          <button
            type="button"
            className={`${styles.explanationButton} ${isSelected ? styles.explanationButtonActive : ""}`}
            onClick={onSelect}
            aria-expanded={isSelected}
            aria-controls={`question-explanation-${question.key}`}
          >
            <ChatCircleDots size={16} weight={isSelected ? "fill" : "regular"} aria-hidden="true" />
            <span>{isSelected ? "Đang xem" : "Xem giải thích"}</span>
          </button>
        </div>
      </div>

      <div className={styles.responseBox}>
        <div
          className={`${styles.userAnswerRow} ${
            isCorrect
              ? styles.userAnswerCorrect
              : isIncorrect
              ? styles.userAnswerIncorrect
              : styles.userAnswerUnanswered
          }`}
        >
          <span>Bạn trả lời:</span>
          <strong>{studentAnswerText || "Bỏ qua (Chưa điền)"}</strong>
        </div>
        {(isIncorrect || isUnanswered) && qResult?.correctAnswers?.length ? (
          <div className={styles.correctAnswerRow}>
            <span>Đáp án chuẩn:</span>
            <strong>{qResult.correctAnswers.join(" / ")}</strong>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function QuestionExplanationPanel({
  result,
  studentAnswerText,
  focusedEvidenceId,
  onFocusEvidence,
}: {
  result: ReadingQuestionResult;
  studentAnswerText: string;
  focusedEvidenceId: string | null;
  onFocusEvidence: (evidenceId: string) => void;
}) {
  const solution = result.solution ?? null;
  const explanation = solution?.explanation ?? result.explanation;
  const reasoningSteps = solution?.reasoningSteps?.filter((step) => step.trim()) ?? [];
  const evidenceSpans = evidenceSpansForResult(result);
  const relatedLessonUrl = safeHttpUrl(solution?.relatedLessonUrl);

  return (
    <section
      id={`question-explanation-${result.questionKey}`}
      className={styles.explanationPanel}
      aria-live="polite"
    >
      <div className={styles.explanationHeader}>
        <div>
          <span className={styles.explanationEyebrow}>Phân tích đáp án</span>
          <h3 className={styles.explanationTitle}>
            <Sparkle size={17} weight="fill" aria-hidden="true" />
            Giải thích câu {result.questionNo}
          </h3>
        </div>
        {evidenceSpans.length > 0 ? (
          <span className={styles.evidenceStatus}>
            <Highlighter size={15} aria-hidden="true" />
            {evidenceSpans.length > 1 ? `${evidenceSpans.length} vị trí đối chiếu` : "Đã đánh dấu trong bài"}
          </span>
        ) : null}
      </div>

      <div className={styles.explanationMeta}>
        <span className={styles.pillCorrect}>
          <span>Đáp án đúng</span>
          <strong>{result.correctAnswers.join(", ") || "—"}</strong>
        </span>
        <span className={`${styles.pillUser} ${
          !result.answered
            ? styles.pillUserEmpty
            : result.correct
            ? styles.pillUserCorrect
            : styles.pillUserIncorrect
        }`}>
          <span>Bạn đã chọn</span>
          <strong>{studentAnswerText || "Bỏ qua"}</strong>
        </span>
      </div>

      {explanation ? (
        <div className={styles.explanationText}>{explanation}</div>
      ) : (
        <p className={styles.explanationEmpty}>Câu này chưa có lời giải chi tiết từ hệ thống.</p>
      )}

      {reasoningSteps.length > 0 ? (
        <section className={styles.solutionSection} aria-labelledby={`reasoning-${result.questionKey}`}>
          <h4 id={`reasoning-${result.questionKey}`} className={styles.solutionSectionTitle}>
            <ListBullets size={16} weight="bold" aria-hidden="true" />
            Cách suy luận
          </h4>
          <ol className={styles.reasoningSteps}>
            {reasoningSteps.map((step, index) => <li key={`${result.questionKey}-step-${index}`}>{step}</li>)}
          </ol>
        </section>
      ) : null}

      {solution?.trapAnalysis ? (
        <section className={`${styles.solutionSection} ${styles.trapSection}`} aria-labelledby={`trap-${result.questionKey}`}>
          <h4 id={`trap-${result.questionKey}`} className={styles.solutionSectionTitle}>
            <Info size={16} weight="fill" aria-hidden="true" />
            Điểm dễ nhầm
          </h4>
          <p>{solution.trapAnalysis}</p>
        </section>
      ) : null}

      {solution?.vocabularyNotes ? (
        <section className={`${styles.solutionSection} ${styles.vocabularySection}`} aria-labelledby={`vocabulary-${result.questionKey}`}>
          <h4 id={`vocabulary-${result.questionKey}`} className={styles.solutionSectionTitle}>
            <Sparkle size={16} weight="fill" aria-hidden="true" />
            Từ khóa và paraphrase
          </h4>
          <p>{solution.vocabularyNotes}</p>
        </section>
      ) : null}

      {evidenceSpans.length > 0 ? (
        <section className={styles.evidenceList} aria-labelledby={`evidence-${result.questionKey}`}>
          <h4 id={`evidence-${result.questionKey}`} className={styles.solutionSectionTitle}>
            <MapPin size={16} weight="fill" aria-hidden="true" />
            Vị trí đối chiếu
          </h4>
          <ul>
            {evidenceSpans.map((evidence, index) => {
              const evidenceId = evidenceIdentifier(evidence, index);
              const mode = evidence.mode ?? (evidence.quote ? "DIRECT_QUOTE" : "NO_DIRECT_EVIDENCE");
              const canFocus = mode !== "NO_DIRECT_EVIDENCE" && Boolean(evidence.quote || evidence.paragraphKey);
              const label = evidence.label || (mode === "WHOLE_PARAGRAPH" ? "Đoạn văn liên quan" : mode === "NO_DIRECT_EVIDENCE" ? "Không có trích dẫn trực tiếp" : "Trích dẫn trong Passage");
              return (
                <li key={evidenceId}>
                  <button
                    type="button"
                    className={`${styles.evidenceListButton} ${focusedEvidenceId === evidenceId ? styles.evidenceListButtonActive : ""}`}
                    disabled={!canFocus}
                    onClick={() => onFocusEvidence(evidenceId)}
                    aria-current={focusedEvidenceId === evidenceId ? "true" : undefined}
                  >
                    <span className={styles.evidenceListIndex}>{index + 1}</span>
                    <span className={styles.evidenceListCopy}>
                      <strong>{label}</strong>
                      <span>{evidence.quote ? `“${evidence.quote}”` : "Giáo viên giải thích dựa trên việc không có thông tin trực tiếp trong Passage."}</span>
                    </span>
                    {canFocus ? <MapPin size={15} weight="fill" aria-hidden="true" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {relatedLessonUrl ? (
        <a
          className={styles.relatedLessonLink}
          href={relatedLessonUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>
            <strong>Ôn lại bài liên quan</strong>
            <small> Mở tài liệu giáo viên gợi ý</small>
          </span>
          <ArrowSquareOut size={17} weight="bold" aria-hidden="true" />
        </a>
      ) : null}
    </section>
  );
}

type EvidenceForView = {
  id?: string | null;
  start?: number | null;
  end?: number | null;
  quote?: string | null;
  prefix?: string | null;
  suffix?: string | null;
  paragraphKey?: string | null;
  label?: string | null;
  mode?: "DIRECT_QUOTE" | "WHOLE_PARAGRAPH" | "NO_DIRECT_EVIDENCE" | null;
};

type EvidenceMarkGroup = { id: string; marks: HTMLElement[] };

function evidenceIdentifier(evidence: EvidenceForView, index: number) {
  return evidence.id || `evidence-${evidence.start ?? "none"}-${evidence.end ?? "none"}-${index}`;
}

function safeHttpUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function evidenceSpansForResult(result: ReadingQuestionResult | null | undefined): EvidenceForView[] {
  if (!result) return [];
  const current = Array.isArray(result.evidenceSpans) ? result.evidenceSpans : [];
  const legacy = result.evidenceSpan ? [result.evidenceSpan] : [];
  const unique = new Map<string, EvidenceForView>();
  [...current, ...legacy].forEach((evidence, index) => {
    const key = evidence.id || `${evidence.start ?? "none"}:${evidence.end ?? "none"}:${evidence.quote ?? ""}:${index}`;
    if (!unique.has(key)) unique.set(key, evidence);
  });
  return [...unique.values()];
}

function normalizeEvidenceText(value: string) {
  return value
    .replace(/[\u00AD\u200B\u200C\u200D\u2060\uFEFF]/g, "")
    .replace(/[\u00A0\u202F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();
}

function normalizedTextWithOffsets(value: string) {
  let normalized = "";
  const starts: number[] = [];
  const ends: number[] = [];
  let whitespaceOpen = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (/^[\u00AD\u200B\u200C\u200D\u2060\uFEFF]$/.test(char)) continue;
    if (/\s|\u00A0|\u202F/u.test(char)) {
      if (normalized && !whitespaceOpen) {
        normalized += " ";
        starts.push(index);
        ends.push(index + 1);
        whitespaceOpen = true;
      } else if (whitespaceOpen && ends.length) {
        ends[ends.length - 1] = index + 1;
      }
      continue;
    }
    normalized += char.toLocaleLowerCase();
    starts.push(index);
    ends.push(index + 1);
    whitespaceOpen = false;
  }

  if (normalized.endsWith(" ")) {
    normalized = normalized.slice(0, -1);
    starts.pop();
    ends.pop();
  }
  return { normalized, starts, ends };
}

function longestContextMatch(left: string, right: string, fromEnd: boolean) {
  const maximum = Math.min(left.length, right.length);
  let length = 0;
  for (let index = 1; index <= maximum; index += 1) {
    const first = fromEnd ? left.slice(-index) : left.slice(0, index);
    const second = fromEnd ? right.slice(-index) : right.slice(0, index);
    if (first !== second) break;
    length = index;
  }
  return length;
}

function resolveEvidenceOffsets(text: string, evidence: EvidenceForView) {
  if (typeof evidence.start !== "number" || typeof evidence.end !== "number" || evidence.start < 0 || evidence.end <= evidence.start) {
    return null;
  }
  const quote = evidence.quote?.trim() ?? "";
  if (!quote) return { start: evidence.start, end: evidence.end };
  if (normalizeEvidenceText(text.slice(evidence.start, evidence.end)) === normalizeEvidenceText(quote)) {
    return { start: evidence.start, end: evidence.end };
  }

  const source = normalizedTextWithOffsets(text);
  const normalizedQuote = normalizeEvidenceText(quote);
  if (!normalizedQuote) return null;
  const candidates: number[] = [];
  let cursor = source.normalized.indexOf(normalizedQuote);
  while (cursor >= 0) {
    candidates.push(cursor);
    cursor = source.normalized.indexOf(normalizedQuote, cursor + Math.max(1, normalizedQuote.length));
  }
  if (!candidates.length) return null;

  const prefix = normalizeEvidenceText(evidence.prefix ?? "");
  const suffix = normalizeEvidenceText(evidence.suffix ?? "");
  const best = candidates.reduce((bestStart, candidate) => {
    const score = (start: number) => {
      const end = start + normalizedQuote.length;
      const before = source.normalized.slice(Math.max(0, start - prefix.length), start);
      const after = source.normalized.slice(end, end + suffix.length);
      return longestContextMatch(before, prefix, true) * 3
        + longestContextMatch(after, suffix, false) * 3
        - Math.min(Math.abs((source.starts[start] ?? 0) - evidence.start!) / 1000, 2);
    };
    return score(candidate) > score(bestStart) ? candidate : bestStart;
  });

  const start = source.starts[best];
  const end = source.ends[best + normalizedQuote.length - 1];
  return typeof start === "number" && typeof end === "number" && end > start ? { start, end } : null;
}

function textOffsetAtNode(root: HTMLElement, target: Node, targetOffset: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let total = 0;
  let node = walker.nextNode();
  while (node) {
    if (node === target) return total + targetOffset;
    total += node.textContent?.length ?? 0;
    node = walker.nextNode();
  }
  return total;
}

function wholeParagraphOffsets(root: HTMLElement, evidence: EvidenceForView) {
  if (!evidence.paragraphKey) return null;
  const label = Array.from(root.querySelectorAll<HTMLElement>("[data-reading-paragraph-key], [data-reading-paragraph-label]")).find((element) => (
    element.dataset.readingParagraphKey === evidence.paragraphKey || element.dataset.readingParagraphLabel === evidence.paragraphKey
  ));
  if (!label) return null;
  const labelContainer = label.closest("p, li, blockquote, div");
  const paragraph = labelContainer?.nextElementSibling instanceof HTMLElement
    ? labelContainer.nextElementSibling
    : labelContainer ?? label;
  const range = document.createRange();
  range.selectNodeContents(paragraph);
  const start = textOffsetAtNode(root, range.startContainer, range.startOffset);
  const end = textOffsetAtNode(root, range.endContainer, range.endOffset);
  return end > start ? { start, end } : null;
}

function mergeEvidenceIntervals(intervals: Array<{ start: number; end: number; ids: string[] }>) {
  return [...intervals]
    .sort((first, second) => first.start - second.start || first.end - second.end)
    .reduce<Array<{ start: number; end: number; ids: string[] }>>((merged, interval) => {
      const previous = merged[merged.length - 1];
      if (previous && interval.start <= previous.end) {
        previous.end = Math.max(previous.end, interval.end);
        previous.ids.push(...interval.ids.filter((id) => !previous.ids.includes(id)));
      } else {
        merged.push({ ...interval });
      }
      return merged;
    }, []);
}

function wrapEvidenceInterval(root: HTMLElement, start: number, end: number) {
  const nodes: Array<{ node: Text; start: number; end: number }> = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let current = walker.nextNode() as Text | null;
  while (current) {
    const nodeStart = offset;
    offset += current.data.length;
    nodes.push({ node: current, start: nodeStart, end: offset });
    current = walker.nextNode() as Text | null;
  }

  const marks: HTMLElement[] = [];
  nodes.reverse().forEach(({ node, start: nodeStart, end: nodeEnd }) => {
    const segmentStart = Math.max(start, nodeStart) - nodeStart;
    const segmentEnd = Math.min(end, nodeEnd) - nodeStart;
    if (segmentEnd <= segmentStart || !node.parentNode) return;

    let selected = node;
    if (segmentStart > 0) selected = node.splitText(segmentStart);
    if (segmentEnd - segmentStart < selected.data.length) selected.splitText(segmentEnd - segmentStart);
    const mark = document.createElement("mark");
    mark.className = styles.evidenceMark;
    mark.setAttribute("data-evidence-mark", "true");
    selected.parentNode?.replaceChild(mark, selected);
    mark.appendChild(selected);
    marks.unshift(mark);
  });
  return marks;
}

function markEvidenceSpans(root: HTMLElement, evidenceSpans: EvidenceForView[]): EvidenceMarkGroup[] {
  root.querySelectorAll("mark[data-evidence-mark='true']").forEach((mark) => {
    mark.replaceWith(...Array.from(mark.childNodes));
  });
  root.normalize();

  const text = root.textContent ?? "";
  const intervals = evidenceSpans.flatMap((evidence, index) => {
    if (evidence.mode === "NO_DIRECT_EVIDENCE") return [];
    const id = evidenceIdentifier(evidence, index);
    const offsets = resolveEvidenceOffsets(text, evidence)
      ?? (evidence.mode === "WHOLE_PARAGRAPH" ? wholeParagraphOffsets(root, evidence) : null);
    return offsets ? [{ ...offsets, ids: [id] }] : [];
  });
  const marksById = new Map<string, HTMLElement[]>();
  mergeEvidenceIntervals(intervals).reverse().forEach((interval) => {
    const marks = wrapEvidenceInterval(root, interval.start, interval.end);
    interval.ids.forEach((id) => marksById.set(id, marks));
  });
  return evidenceSpans.map((evidence, index) => ({
    id: evidenceIdentifier(evidence, index),
    marks: marksById.get(evidenceIdentifier(evidence, index)) ?? [],
  }));
}

function scrollInsidePane(pane: HTMLElement, target: HTMLElement) {
  const paneRect = pane.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const topPadding = 18;
  const bottomPadding = 28;

  if (targetRect.top < paneRect.top + topPadding) {
    pane.scrollTo({
      top: Math.max(0, pane.scrollTop + targetRect.top - paneRect.top - topPadding),
      behavior: "smooth",
    });
    return;
  }

  if (targetRect.bottom > paneRect.bottom - bottomPadding) {
    pane.scrollTo({
      top: pane.scrollTop + targetRect.bottom - paneRect.bottom + bottomPadding,
      behavior: "smooth",
    });
  }
}
