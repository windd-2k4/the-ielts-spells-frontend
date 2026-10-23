"use client";

import type { SavedWritingResponse, WritingAttemptResult, WritingTask } from "@ielts/contracts";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Check,
  CheckCircle,
  CircleNotch,
  Clock,
  FileText,
  GraduationCap,
  House,
  Lightbulb,
  PencilSimple,
  Sparkle,
  Star,
  TextT,
  WarningCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { StudentSessionGate } from "@/features/student-auth/StudentSessionGate";
import { AuthenticatedDiagramImage } from "@/features/reading/AuthenticatedDiagramImage";
import { getWritingAttemptResult, requestWritingAiEvaluation } from "./writingApi";
import styles from "./WritingResultPage.module.css";

const criterionLabels: Record<string, string> = {
  task_achievement: "Task Achievement",
  task_response: "Task Response",
  coherence_cohesion: "Coherence & Cohesion",
  lexical_resource: "Lexical Resource",
  grammatical_range_accuracy: "Grammar Range & Accuracy",
};

const criterionDescriptions: Record<string, string> = {
  task_achievement: "Hoàn thành yêu cầu đề bài",
  task_response: "Trả lời đúng trọng tâm & lập luận",
  coherence_cohesion: "Tính mạch lạc & liên kết",
  lexical_resource: "Vốn từ vựng & diễn đạt",
  grammatical_range_accuracy: "Ngữ pháp chính xác & đa dạng",
};

export function WritingResultPage({ attemptId }: { attemptId: string }) {
  return (
    <StudentSessionGate>
      <WritingResultContent key={attemptId} attemptId={attemptId} />
    </StudentSessionGate>
  );
}

function WritingResultContent({ attemptId }: { attemptId: string }) {
  const searchParams = useSearchParams();
  const fromPlacement = searchParams.get("from") === "placement";
  const [result, setResult] = useState<WritingAttemptResult | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("essay");
  const [requesting, setRequesting] = useState(false);
  const [actionError, setActionError] = useState("");

  const pending = result?.evaluations.some((item) => ["QUEUED", "PROCESSING"].includes(item.aiStatus)) ?? false;

  const resultTabs = [
    { id: "essay", label: "Bài viết của bạn", icon: FileText, tag: null },
    { id: "tis", label: "TIS sửa bài", icon: Sparkle, tag: "AI" },
    { id: "teacher", label: "Giáo viên chấm bài", icon: GraduationCap, tag: null },
    { id: "sample", label: "Bài sample từ TIS", icon: BookOpenText, tag: "Band 8+" },
  ];

  useEffect(() => {
    let cancelled = false;
    void getWritingAttemptResult(attemptId)
      .then((value) => {
        if (!cancelled) setResult(value);
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Không thể tải kết quả Writing.");
      });
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  useEffect(() => {
    if (!pending) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function refresh() {
      try {
        const value = await getWritingAttemptResult(attemptId);
        if (!cancelled) {
          setResult(value);
          setActionError("");
        }
      } catch {
        if (!cancelled) setActionError("Chưa thể cập nhật trạng thái. Hệ thống sẽ tự thử lại.");
      }
      if (!cancelled) timer = setTimeout(refresh, 5000);
    }

    timer = setTimeout(refresh, 5000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [attemptId, pending]);

  async function requestAi() {
    if (requesting) return;
    setRequesting(true);
    setActionError("");
    try {
      await requestWritingAiEvaluation(attemptId);
      setResult(await getWritingAttemptResult(attemptId));
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Không thể gửi yêu cầu chấm.");
    } finally {
      setRequesting(false);
    }
  }

  if (error) {
    return (
      <main className={styles.state}>
        <WarningCircle size={38} color="#B91C1C" weight="fill" />
        <strong>Không thể tải bài đã nộp</strong>
        <p>{error}</p>
        <Link href="/student/practice?skill=WRITING">
          <ArrowLeft size={16} weight="bold" /> Quay lại danh mục Writing
        </Link>
      </main>
    );
  }

  if (!result) {
    return (
      <main className={styles.state}>
        <CircleNotch size={32} className={styles.spin} />
        <span>Đang tải kết quả bài thi IELTS Writing...</span>
      </main>
    );
  }

  const totalWords = result.responses.reduce((total, response) => total + response.wordCount, 0);
  const submittedAt = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(result.submittedAt));

  return (
    <div className={styles.page}>
      {/* ================= TOPBAR ================= */}
      <nav className={styles.topbar} aria-label="Điều hướng kết quả Writing">
        {fromPlacement ? (
          <Link
            href="/student/placement-test/mocktest"
            className={styles.backLink}
            style={{ color: "#FF6B00", fontWeight: 700 }}
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Quay lại bài Test đầu vào</span>
          </Link>
        ) : (
          <Link href="/student/practice?skill=WRITING" className={styles.backLink}>
            <ArrowLeft size={16} weight="bold" />
            <span>Danh mục Writing</span>
          </Link>
        )}

        <div className={styles.topbarTitle}>
          <span>IELTS Writing</span>
          <strong>Kết quả bài nộp Writing</strong>
        </div>

        <div className={styles.topbarActions}>
          {fromPlacement ? (
            <Link
              href="/student/placement-test/mocktest"
              className={styles.primaryLink}
              style={{ background: "#FF6B00", borderColor: "#FF6B00", color: "#FFFFFF" }}
            >
              <ArrowLeft size={16} weight="bold" />
              <span>Tiếp tục Test đầu vào</span>
            </Link>
          ) : null}
          <Link href="/student" className={styles.homeLink}>
            <House size={16} weight="bold" />
            <span>Trang học viên</span>
          </Link>
          <Link href="/student/practice?skill=WRITING" className={styles.primaryLink}>
            <PencilSimple size={16} weight="bold" />
            <span>Luyện bài khác</span>
          </Link>
        </div>
      </nav>

      {/* ================= CONTENT ================= */}
      <main className={styles.content}>
        {/* HERO BANNER (BORDERLESS & COMPACT) */}
        <header className={styles.hero}>
          <div className={styles.heroLeft}>
            <div className={styles.successIcon}>
              <CheckCircle size={20} weight="fill" />
            </div>

            <div className={styles.heroText}>
              <div className={styles.titleRow}>
                <h1>Bài Writing đã được lưu</h1>
                <span className={styles.eyebrowBadge}>
                  <CheckCircle size={12} weight="fill" />
                  Đã nộp thành công
                </span>
              </div>
              <p>Xem lại bài viết, nhờ TIS sửa bài hoặc theo dõi nhận xét của giáo viên.</p>
            </div>
          </div>

          <dl className={styles.summary}>
            <div className={styles.summaryItem}>
              <dt>
                <FileText size={11} weight="bold" />
                <span>Số task</span>
              </dt>
              <dd>{result.tasks.length} task</dd>
            </div>
            <div className={styles.summaryItem}>
              <dt>
                <TextT size={11} weight="bold" />
                <span>Tổng số từ</span>
              </dt>
              <dd>{totalWords} từ</dd>
            </div>
            <div className={styles.summaryItem}>
              <dt>
                <Clock size={11} weight="bold" />
                <span>Thời gian nộp</span>
              </dt>
              <dd>{submittedAt}</dd>
            </div>
          </dl>
        </header>

        {/* FULL OVERALL BAND SCORE (IF EVALUATED) */}
        {result.overallBandAi != null || result.overallBandTeacher != null ? (
          <section className={styles.fullScore} aria-label="Band tổng toàn bài Writing">
            <div className={styles.fullScoreMeta}>
              <span>Band điểm tổng toàn bài</span>
              <h2>Quy chuẩn tính điểm toàn bài Writing</h2>
              <p>Công thức IELTS: Task 2 được tính trọng số gấp đôi Task 1 và làm tròn theo thang band chuẩn.</p>
            </div>
            <div className={styles.fullScoreValues}>
              {result.overallBandAi != null ? (
                <div className={styles.scoreCard} data-source="ai">
                  <small>
                    <Sparkle size={12} weight="fill" /> TIS AI
                  </small>
                  <strong>{result.overallBandAi.toFixed(1)}</strong>
                </div>
              ) : null}
              {result.overallBandTeacher != null ? (
                <div className={styles.scoreCard} data-source="teacher">
                  <small>
                    <Star size={12} weight="fill" /> Giáo viên
                  </small>
                  <strong>{result.overallBandTeacher.toFixed(1)}</strong>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* TASK NAVIGATION PILLS */}
        {result.tasks.length > 1 ? (
          <nav className={styles.taskNav} aria-label="Chọn task để xem lại">
            {result.tasks.map((task) => (
              <a key={task.taskKey} href={`#task-${task.taskNo}`}>
                Writing Task {task.taskNo}
              </a>
            ))}
          </nav>
        ) : null}

        {/* BORDERLESS MODERN RESULT TABS */}
        <div className={styles.resultTabs} role="tablist" aria-label="Kết quả Writing">
          {resultTabs.map(({ id, label, icon: TabIcon, tag }, index) => {
            const isSelected = tab === id;
            return (
              <button
                key={id}
                id={`writing-tab-${id}`}
                role="tab"
                type="button"
                aria-selected={isSelected}
                aria-controls="writing-tab-panel"
                className={`${styles.tabButton} ${isSelected ? styles.tabButtonActive : ""}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setTab(id)}
                onKeyDown={(event) => {
                  const next =
                    event.key === "ArrowRight"
                      ? (index + 1) % 4
                      : event.key === "ArrowLeft"
                        ? (index + 3) % 4
                        : event.key === "Home"
                          ? 0
                          : event.key === "End"
                            ? 3
                            : null;
                  if (next != null) {
                    event.preventDefault();
                    setTab(resultTabs[next].id);
                    document.getElementById(`writing-tab-${resultTabs[next].id}`)?.focus();
                  }
                }}
              >
                <TabIcon weight={isSelected ? "fill" : "bold"} className={styles.tabIcon} />
                <span>{label}</span>
                {id === "tis" && pending ? (
                  <CircleNotch className={styles.spin} size={15} />
                ) : id === "tis" && result.overallBandAi != null ? (
                  <span className={styles.tabBandBadge}>Band {result.overallBandAi.toFixed(1)}</span>
                ) : id === "teacher" && result.overallBandTeacher != null ? (
                  <span className={styles.tabBandBadge}>Band {result.overallBandTeacher.toFixed(1)}</span>
                ) : tag ? (
                  <span className={styles.tabPillTag}>{tag}</span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT PANEL */}
        <div id="writing-tab-panel" role="tabpanel" aria-labelledby={`writing-tab-${tab}`} tabIndex={0}>
          {actionError ? (
            <section className={styles.notice} role="alert">
              <WarningCircle size={20} weight="fill" />
              <div>
                <strong>Lưu ý</strong>
                <p>{actionError}</p>
              </div>
            </section>
          ) : null}

          {/* TAB: TIS AI EVALUATION STATES */}
          {tab === "tis" && pending ? (
            <section className={styles.waiting} role="status">
              <div className={styles.waitingIconWrapper}>
                <CircleNotch size={30} className={styles.spin} />
              </div>
              <h2>TIS đang đọc và đánh giá bài viết của bạn</h2>
              <p>
                Trợ lý AI đang chấm điểm chi tiết theo 4 tiêu chí chuẩn IELTS. Bạn có thể chuyển sang luyện tập các kỹ
                năng khác trong thời gian chờ:
              </p>
              <div className={styles.waitingActions}>
                <Link href="/student/practice?skill=READING">
                  Luyện đề Reading <ArrowRight size={14} weight="bold" />
                </Link>
                <Link href="/student/practice?skill=LISTENING">
                  Luyện đề Listening <ArrowRight size={14} weight="bold" />
                </Link>
                <Link href="/student">
                  Về góc học tập <ArrowRight size={14} weight="bold" />
                </Link>
              </div>
            </section>
          ) : null}

          {tab === "tis" && !result.resultVisible ? (
            <p className={styles.emptyMessage}>Kết quả TIS sẽ hiển thị khi khóa học mở kết quả.</p>
          ) : null}

          {tab === "tis" &&
          result.resultVisible &&
          !pending &&
          result.evaluations.some((item) => item.aiStatus === "NOT_ELIGIBLE") ? (
            <section className={styles.ctaBox}>
              <div className={styles.ctaIcon}>
                <Sparkle size={26} weight="fill" />
              </div>
              <div className={styles.ctaContent}>
                <h2>{result.aiEligible ? "Nhận phân tích & sửa bài chi tiết từ TIS" : "Bạn chưa có lượt sửa bài khả dụng"}</h2>
                <p>
                  {result.aiEligible
                    ? "TIS sử dụng AI đánh giá theo chuẩn 4 tiêu chí IELTS, phân tích điểm mạnh, lỗi ngữ pháp và đề xuất cách cải thiện diễn đạt."
                    : "Liên hệ giáo viên để được cấp thêm ngân sách AI. Toàn bộ bài viết của bạn đã được lưu trữ an toàn."}
                </p>
              </div>
              {result.aiEligible ? (
                <button
                  type="button"
                  className={styles.ctaButton}
                  disabled={requesting}
                  onClick={() => void requestAi()}
                >
                  {requesting ? <CircleNotch size={16} className={styles.spin} /> : <Sparkle size={16} weight="fill" />}
                  <span>{requesting ? "Đang gửi bài..." : "Nhờ TIS sửa bài ngay"}</span>
                </button>
              ) : null}
            </section>
          ) : null}

          {/* TASKS LIST */}
          <div className={styles.tasks}>
            {result.tasks.map((task) => {
              const response = result.responses.find((item) => item.taskKey === task.taskKey);
              const evaluation = result.evaluations.find((item) => item.taskKey === task.taskKey);
              const wordCount = response?.wordCount ?? 0;

              let wordStatus: "met" | "warn" | "empty" = "empty";
              if (wordCount >= task.minWords) {
                wordStatus = "met";
              } else if (wordCount > 0) {
                wordStatus = "warn";
              }

              if (tab === "tis" && evaluation && evaluation.overallBandAi == null && evaluation.aiStatus !== "FAILED") {
                return null;
              }

              return (
                <article key={task.taskKey} id={`task-${task.taskNo}`} className={styles.card}>
                  {/* CARD HEADER */}
                  <header className={styles.cardHeader}>
                    <div className={styles.cardMeta}>
                      <div className={styles.cardBadgeGroup}>
                        <span className={styles.taskBadge}>Task {task.taskNo}</span>
                        <span className={styles.metaTimePill}>
                          <Clock size={12} weight="bold" /> {task.suggestedTimeMinutes} phút gợi ý
                        </span>
                        <span className={styles.metaWordTargetPill}>
                          <FileText size={12} weight="bold" /> Tối thiểu {task.minWords} từ
                        </span>
                      </div>
                      <h2 className={styles.taskTitle}>{task.title}</h2>
                    </div>

                    <div className={styles.cardStatus}>
                      <span className={styles.wordCountPill} data-status={wordStatus}>
                        {wordStatus === "met" ? (
                          <CheckCircle size={15} weight="fill" />
                        ) : wordStatus === "warn" ? (
                          <WarningCircle size={15} weight="fill" />
                        ) : (
                          <FileText size={15} weight="bold" />
                        )}
                        <span>
                          {wordCount} / {task.minWords} từ {wordStatus === "met" ? "(Đạt chuẩn)" : ""}
                        </span>
                      </span>
                    </div>
                  </header>

                  {/* TAB 1: ESSAY & PROMPT VIEW (RESIZABLE SPLIT VIEW) */}
                  {tab === "essay" ? (
                    <ResizableSplitView
                      prompt={<PromptContent task={task} />}
                      response={<ResponseContent response={response} minWords={task.minWords} />}
                    />
                  ) : null}

                  {/* TAB 2: TIS AI FEEDBACK */}
                  {tab === "tis" && evaluation?.overallBandAi != null ? (
                    <FeedbackSection
                      title="TIS nhận xét & chấm điểm"
                      icon="ai"
                      overall={evaluation.overallBandAi}
                      criteria={evaluation.aiCriterionBands}
                      strengths={evaluation.aiStrengths}
                      improvements={evaluation.aiImprovements}
                    />
                  ) : null}

                  {tab === "tis" && evaluation?.aiStatus === "FAILED" ? (
                    <section className={styles.notice}>
                      <WarningCircle size={22} weight="fill" />
                      <div>
                        <strong>TIS chưa thể hoàn tất bài chấm</strong>
                        <p>Bài vẫn được lưu trữ. Vui lòng liên hệ giáo viên để được hỗ trợ chấm lại.</p>
                      </div>
                    </section>
                  ) : null}

                  {tab === "tis" && !evaluation ? (
                    <p className={styles.emptyMessage}>Task này chưa có nội dung để chấm.</p>
                  ) : null}

                  {/* TAB 3: TEACHER EVALUATION */}
                  {tab === "teacher" ? (
                    evaluation?.teacherStatus === "PUBLISHED" && evaluation.overallBandTeacher != null ? (
                      <>
                        <FeedbackSection
                          title="Đánh giá từ giáo viên"
                          icon="teacher"
                          overall={evaluation.overallBandTeacher}
                          criteria={evaluation.teacherCriterionBands}
                          strengths={evaluation.teacherStrengths}
                          improvements={evaluation.teacherImprovements}
                        />
                        <TeacherCorrection
                          original={response?.text ?? ""}
                          edited={evaluation.teacherEditedText}
                          editedHtml={evaluation.teacherEditedHtml}
                          annotations={evaluation.teacherAnnotations}
                        />
                      </>
                    ) : (
                      <section className={styles.notice}>
                        <Clock size={22} weight="fill" />
                        <div>
                          <strong>
                            {result.attemptOrigin === "ASSIGNMENT"
                              ? "Bài viết đang chờ giáo viên chấm"
                              : "Nhận đánh giá trực tiếp từ giáo viên"}
                          </strong>
                          <p>
                            {result.attemptOrigin === "ASSIGNMENT"
                              ? "Điểm số và nhận xét chi tiết sẽ hiển thị ngay khi giáo viên công bố kết quả."
                              : "Tham gia khóa học Writing & Speaking để được giáo viên chấm và sửa bài trực tiếp."}
                          </p>
                          {result.attemptOrigin === "SELF_PRACTICE" ? (
                            <Link href="/student/courses">
                              Khám phá các khóa học <ArrowRight size={13} weight="bold" />
                            </Link>
                          ) : null}
                        </div>
                      </section>
                    )
                  ) : null}

                  {/* TAB 4: SAMPLE ANSWER */}
                  {tab === "sample" ? (
                    task.sampleBand8Answer ? (
                      <section className={styles.sampleAnswer}>
                        <div className={styles.sampleAnswerHeader}>
                          <span>
                            <Star size={13} weight="fill" /> Bài mẫu Band 8.0+ chuẩn IELTS
                          </span>
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: task.sampleBand8Answer }} />
                      </section>
                    ) : (
                      <p className={styles.emptyMessage}>
                        {result.resultVisible
                          ? "TIS chưa có bài sample cho đề bài này."
                          : "Bài sample sẽ hiển thị khi khóa học mở kết quả."}
                      </p>
                    )
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ==========================================================================
   RESIZABLE SPLIT VIEW COMPONENT (DRAGGABLE DIVIDER)
   ========================================================================== */

function ResizableSplitView({
  prompt,
  response,
}: {
  prompt: React.ReactNode;
  response: React.ReactNode;
}) {
  const [splitRatio, setSplitRatio] = useState(44);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const startDragging = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = ((clientX - rect.left) / rect.width) * 100;
      setSplitRatio(Math.min(70, Math.max(28, newRatio)));
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      onMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        onMove(e.touches[0].clientX);
      }
    };

    const stopDragging = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopDragging);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", stopDragging);

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", stopDragging);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", stopDragging);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging]);

  const resetSplit = useCallback(() => {
    setSplitRatio(44);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`${styles.taskLayout} ${isDragging ? styles.isDragging : ""}`}
      style={{
        gridTemplateColumns: `${splitRatio}% 14px minmax(0, 1fr)`,
      }}
    >
      <div className={styles.promptColumn}>{prompt}</div>

      <div
        role="separator"
        tabIndex={0}
        aria-valuenow={Math.round(splitRatio)}
        aria-valuemin={28}
        aria-valuemax={70}
        aria-label="Kéo thanh giữa để chỉnh độ rộng giữa đề bài và bài làm"
        title="Kéo sang trái/phải để chỉnh độ rộng 2 bên. Nhấp đúp để đặt lại."
        className={`${styles.divider} ${isDragging ? styles.dividerActive : ""}`}
        onMouseDown={startDragging}
        onTouchStart={startDragging}
        onDoubleClick={resetSplit}
      >
        <div className={styles.dividerLine} />
        <div className={styles.dividerGrip} />
      </div>

      <div className={styles.responseColumn}>{response}</div>
    </div>
  );
}

/* ==========================================================================
   PROMPT CONTENT
   ========================================================================== */

function PromptContent({ task }: { task: WritingTask }) {
  return (
    <div className={styles.promptPanel}>
      <div className={styles.promptHeader}>
        <BookOpenText size={16} weight="bold" />
        <h3>Đề bài</h3>
        <span className={styles.promptBadge}>Task {task.taskNo}</span>
      </div>

      <div className={styles.promptHtml} dangerouslySetInnerHTML={{ __html: task.promptHtml }} />

      {task.imageUrl ? (
        <div className={styles.diagramWrapper}>
          <AuthenticatedDiagramImage
            src={task.imageUrl}
            alt={task.imageAltText ?? `Writing Task ${task.taskNo}`}
            className={styles.resultImage}
            fallbackText="Không thể tải ảnh minh họa đề Writing."
          />
        </div>
      ) : null}
    </div>
  );
}

/* ==========================================================================
   RESPONSE CONTENT
   ========================================================================== */

function ResponseContent({
  response,
  minWords,
}: {
  response: SavedWritingResponse | undefined;
  minWords: number;
}) {
  const wordCount = response?.wordCount ?? 0;
  const essayParagraphs = response?.text
    ? response.text.split(/\r?\n+/).map((paragraph) => paragraph.trim()).filter(Boolean)
    : [];

  return (
    <div className={styles.responsePanel}>
      <div className={styles.responseHeading}>
        <div className={styles.responseHeadingLeft}>
          <PencilSimple size={16} weight="bold" />
          <h3>Bài làm của bạn</h3>
        </div>
        <span className={styles.responseWordPill}>{wordCount} từ</span>
      </div>

      <div className={styles.essayScrollArea}>
        {essayParagraphs.length ? (
          <div className={styles.essay}>
            {essayParagraphs.map((paragraph, index) => (
              <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <div className={styles.emptyEssayState}>
            <div className={styles.emptyIconCircle}>
              <PencilSimple size={24} weight="bold" />
            </div>
            <strong>Chưa có nội dung cho task này</strong>
            <p>
              Bài thi được nộp mà chưa có văn bản bài làm. Bạn có thể đọc lại đề bài bên trái hoặc xem bài mẫu Band 8+ từ
              TIS ở tab bên trên.
            </p>
          </div>
        )}
      </div>

      <footer className={styles.responseFooter}>
        <span>
          Tổng số: <strong>{wordCount} từ</strong>
        </span>
        <span>
          Mục tiêu đề bài: <strong>Tối thiểu {minWords} từ</strong>
        </span>
      </footer>
    </div>
  );
}

/* ==========================================================================
   TEACHER CORRECTION & FEEDBACK SUBCOMPONENTS
   ========================================================================== */

function TeacherCorrection({
  original,
  edited,
  editedHtml,
  annotations,
}: {
  original: string;
  edited: string | null;
  editedHtml: string | null;
  annotations: WritingAttemptResult["evaluations"][number]["teacherAnnotations"];
}) {
  const [view, setView] = useState<"compare" | "edited">("compare");
  if (!edited && !editedHtml && !annotations.length) return null;
  const corrected = edited ?? original;

  return (
    <section className={styles.teacherCorrection}>
      <div className={styles.correctionHeader}>
        <div>
          <h3>Bản sửa chi tiết của giáo viên</h3>
          <p>Giáo viên đã sửa trực tiếp trên bài viết của bạn và để lại các ghi chú.</p>
        </div>
        <div className={styles.correctionTabs}>
          <button type="button" aria-pressed={view === "compare"} onClick={() => setView("compare")}>
            Đối chiếu song song
          </button>
          <button type="button" aria-pressed={view === "edited"} onClick={() => setView("edited")}>
            Bản đã sửa hoàn chỉnh
          </button>
        </div>
      </div>

      {view === "compare" ? (
        <div className={styles.correctionGrid}>
          <div>
            <span>Bản gốc của bạn</span>
            <p>{original}</p>
          </div>
          <div>
            <span>Bản giáo viên sửa</span>
            {editedHtml ? <div className={styles.correctedRichText} dangerouslySetInnerHTML={{ __html: editedHtml }} /> : <p>{corrected}</p>}
          </div>
        </div>
      ) : (
        editedHtml
          ? <div className={`${styles.correctedText} ${styles.correctedRichText}`} dangerouslySetInnerHTML={{ __html: editedHtml }} />
          : <div className={styles.correctedText}>{corrected}</div>
      )}

      {annotations.length ? (
        <div className={styles.annotationList}>
          <strong>Ghi chú & nhận xét chi tiết</strong>
          {annotations.map((item) => (
            <article key={item.id ?? `${item.start}-${item.end}`}>
              <span>{item.criterion ? criterionLabels[item.criterion] ?? item.criterion : "Nhận xét chung"}</span>
              <p>“{item.selectedText}”</p>
              {item.comment ? <div className={styles.annotationComment}>{item.comment}</div> : null}
              {item.replacement ? <em>Đề xuất sửa: {item.replacement}</em> : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function FeedbackSection({
  title,
  icon,
  overall,
  criteria,
  strengths,
  improvements,
}: {
  title: string;
  icon: "ai" | "teacher";
  overall: number;
  criteria: Record<string, number>;
  strengths: string[];
  improvements: string[];
}) {
  return (
    <section className={styles.feedback} data-source={icon}>
      <div className={styles.feedbackHeader}>
        <div className={styles.feedbackTitle}>
          {icon === "ai" ? <Sparkle weight="fill" /> : <Star weight="fill" />}
          <span>{title}</span>
        </div>
        <div className={styles.feedbackBandPill}>
          <span>Band tổng:</span>
          <strong>{overall.toFixed(1)}</strong>
        </div>
      </div>

      <div className={styles.criteriaGrid}>
        {Object.entries(criteria).map(([key, value]) => (
          <div key={key} className={styles.criterionCard} data-criterion={key}>
            <div className={styles.criterionInfo}>
              <strong className={styles.criterionName}>{criterionLabels[key] ?? key}</strong>
              <span className={styles.criterionDesc}>{criterionDescriptions[key] ?? "Tiêu chí chấm điểm"}</span>
            </div>
            <div className={styles.criterionScore}>{value.toFixed(1)}</div>
          </div>
        ))}
      </div>

      <div className={styles.feedbackColumns}>
        {strengths.length ? (
          <div className={styles.strengthsBox}>
            <div className={styles.boxHeader}>
              <CheckCircle size={16} weight="fill" />
              <span>Điểm mạnh cần phát huy</span>
            </div>
            <ul className={styles.feedbackList}>
              {strengths.map((item) => (
                <li key={item}>
                  <Check size={14} weight="bold" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {improvements.length ? (
          <div className={styles.improvementsBox}>
            <div className={styles.boxHeader}>
              <Lightbulb size={16} weight="fill" />
              <span>Điểm cần cải thiện & khắc phục</span>
            </div>
            <ul className={styles.feedbackList}>
              {improvements.map((item) => (
                <li key={item}>
                  <ArrowRight size={13} weight="bold" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
