"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CaretDown,
  CaretUp,
  CheckCircle,
  Clock,
  House,
  Lock,
  Pause,
  PencilSimple,
  Play,
  Sparkle,
  SpinnerGap,
  WarningCircle,
} from "@phosphor-icons/react";
import type { SpeakingAttemptResult } from "@ielts/contracts";
import { StudentSessionGate } from "@/features/student-auth/StudentSessionGate";
import { getSpeakingAttemptResult } from "./speakingApi";
import styles from "./SpeakingResultPage.module.css";

export function SpeakingResultPage({ attemptId }: { attemptId: string }) {
  return (
    <StudentSessionGate>
      <SpeakingResultContent attemptId={attemptId} />
    </StudentSessionGate>
  );
}

function SpeakingResultContent({ attemptId }: { attemptId: string }) {
  const [result, setResult] = useState<SpeakingAttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audio Playback
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Accordion open/close state for Parts
  const [openParts, setOpenParts] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
  });

  // Right Tab (IELTS 4 Assessment Criteria)
  const [activeTab, setActiveTab] = useState<"PRONUNCIATION" | "GRAMMAR" | "VOCAB" | "FLUENCY">("PRONUNCIATION");

  useEffect(() => {
    let active = true;
    void getSpeakingAttemptResult(attemptId)
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Không thể tải kết quả bài nói");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (audioRef.current) audioRef.current.pause();
    };
  }, [attemptId]);

  function toggleAudio(key: string, url: string) {
    if (playingKey === key && audioRef.current) {
      audioRef.current.pause();
      setPlayingKey(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingKey(key);
    audio.onended = () => setPlayingKey(null);
    audio.onerror = () => setPlayingKey(null);
    void audio.play().catch(() => setPlayingKey(null));
  }

  function formatSubmissionTime(dateStr?: string | null) {
    if (!dateStr) {
      const now = new Date();
      return `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")} - ${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${now.getFullYear()}`;
    }
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")} - ${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingState}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <SpinnerGap size={36} weight="bold" className={styles.spinIcon} />
            <span>Đang tổng hợp kết quả bài thi IELTS Speaking...</span>
          </div>
        </div>
      </main>
    );
  }

  if (error || !result) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingState}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <WarningCircle size={40} color="#B91C1C" weight="fill" />
            <strong style={{ fontSize: 16 }}>{error || "Không tìm thấy dữ liệu bài thi"}</strong>
            <Link href="/student/practice?skill=SPEAKING" className={styles.backLink}>
              Quay lại danh mục Speaking
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Calculate statistics
  let totalQuestions = 0;
  let answeredQuestions = 0;
  result.parts.forEach((p) => {
    totalQuestions += p.questions.length;
    p.questions.forEach((q) => {
      const res = result.responses.find((r) => r.questionKey === q.questionKey);
      if (res?.audioUrl || res?.transcript) answeredQuestions++;
    });
  });

  return (
    <div className={styles.page}>
      {/* ================= TOPBAR ================= */}
      <nav className={styles.topbar} aria-label="Điều hướng kết quả Speaking">
        <Link href="/student/practice?skill=SPEAKING" className={styles.backLink}>
          <ArrowLeft size={16} weight="bold" />
          <span>Danh mục Speaking</span>
        </Link>

        <div className={styles.topbarTitle}>
          <span>IELTS Speaking</span>
          <strong>Kết quả bài thi tự luyện</strong>
        </div>

        <div className={styles.topbarActions}>
          <Link href="/student" className={styles.homeLink}>
            <House size={16} weight="bold" />
            <span>Trang học viên</span>
          </Link>
          <Link href="/student/practice?skill=SPEAKING" className={styles.primaryLink}>
            <PencilSimple size={16} weight="bold" />
            <span>Luyện đề khác</span>
          </Link>
        </div>
      </nav>

      {/* ================= CONTENT ================= */}
      <main className={styles.content}>
        {/* HERO SECTION */}
        <header className={styles.hero}>
          <div className={styles.successIcon}>
            <CheckCircle size={32} weight="fill" />
          </div>

          <div>
            <span className={styles.eyebrow}>Đã nộp thành công</span>
            <h1>Speaking Test 1 - Full test</h1>
            <p>
              Bài nói của bạn đã được hệ thống The IELTS Spells ghi nhận và lưu trữ an toàn. Bạn có thể nghe
              lại các đoạn ghi âm và đọc lại bản ghi chép bên dưới.
            </p>
          </div>

          <dl className={styles.summaryMetrics}>
            <div>
              <dt>Số phần</dt>
              <dd>{result.parts.length}/3 Part</dd>
            </div>
            <div>
              <dt>Câu đã trả lời</dt>
              <dd>{answeredQuestions}/{totalQuestions} câu</dd>
            </div>
            <div>
              <dt>Thời gian nộp</dt>
              <dd>{formatSubmissionTime(result.submittedAt)}</dd>
            </div>
          </dl>
        </header>

        {/* 2-COLUMN MAIN WORKSPACE */}
        <div className={styles.mainGrid}>
          {/* ================= LEFT COLUMN: RECORDINGS & TRANSCRIPTS ================= */}
          <section>
            {result.parts.map((part) => {
              const isOpen = openParts[part.partNo] ?? true;
              return (
                <article key={part.id} className={styles.partAccordionCard}>
                  {/* Accordion Header */}
                  <button
                    type="button"
                    onClick={() =>
                      setOpenParts((prev) => ({
                        ...prev,
                        [part.partNo]: !isOpen,
                      }))
                    }
                    className={styles.partAccordionHeader}
                    aria-expanded={isOpen}
                  >
                    <div className={styles.partAccordionTitleGroup}>
                      <span className={styles.partPill}>Part {part.partNo}</span>
                      <strong className={styles.partName}>
                        {part.topicTitle || (part.partNo === 2 ? "Cue Card Topic" : `Part ${part.partNo}`)}
                      </strong>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)" }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>
                        {part.questions.length} {part.partNo === 2 ? "chủ đề" : "câu hỏi"}
                      </span>
                      {isOpen ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
                    </div>
                  </button>

                  {/* Accordion Body */}
                  {isOpen && (
                    <div className={styles.questionList}>
                      {part.questions.map((q) => {
                        const saved = result.responses.find((r) => r.questionKey === q.questionKey);
                        const isPlaying = playingKey === q.questionKey;

                        return (
                          <div key={q.id} className={styles.questionItem}>
                            <div className={styles.questionItemHeader}>
                              <h3 className={styles.questionPromptText}>
                                {q.promptText || part.topicTitle}
                              </h3>

                              {saved?.audioUrl && (
                                <button
                                  type="button"
                                  onClick={() => toggleAudio(q.questionKey, saved.audioUrl!)}
                                  className={styles.audioPillBtn}
                                  title="Nghe lại bài nói"
                                >
                                  {isPlaying ? (
                                    <Pause size={13} weight="fill" />
                                  ) : (
                                    <Play size={13} weight="fill" />
                                  )}
                                  <span>Nghe âm thanh</span>
                                </button>
                              )}
                            </div>

                            {/* Cue Card bullets if Part 2 */}
                            {part.partNo === 2 && part.cueCardBullets && part.cueCardBullets.length > 0 && (
                              <ul style={{ listStyle: "disc", paddingLeft: 20, fontSize: 13, color: "var(--muted)", margin: "4px 0" }}>
                                {part.cueCardBullets.map((bullet, idx) => (
                                  <li key={idx}>{bullet}</li>
                                ))}
                              </ul>
                            )}

                            {/* Transcript box */}
                            <p className={styles.transcriptBox}>
                              "{saved?.transcript || "(Chưa nhận diện được nội dung bản ghi chép)"}"
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </section>

          {/* ================= RIGHT COLUMN: THE IELTS SPELLS AI EXAMINER ================= */}
          <aside className={styles.aiCard}>
            <div className={styles.aiCardHeader}>
              <div className={styles.aiIconWrapper}>
                <Sparkle size={20} weight="fill" />
              </div>
              <div className={styles.aiTitleGroup}>
                <span>AI Tutor & Evaluation</span>
                <strong>The IELTS Spells AI Examiner</strong>
              </div>
            </div>

            {/* Criteria Tabs */}
            <div className={styles.criteriaTabs} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "PRONUNCIATION"}
                onClick={() => setActiveTab("PRONUNCIATION")}
                className={`${styles.criteriaTabBtn} ${
                  activeTab === "PRONUNCIATION" ? styles.criteriaTabBtnActive : ""
                }`}
              >
                <span className={styles.dotPronunciation} />
                <span>Phát âm</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "GRAMMAR"}
                onClick={() => setActiveTab("GRAMMAR")}
                className={`${styles.criteriaTabBtn} ${
                  activeTab === "GRAMMAR" ? styles.criteriaTabBtnActive : ""
                }`}
              >
                <span className={styles.dotGrammar} />
                <span>Ngữ pháp</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "VOCAB"}
                onClick={() => setActiveTab("VOCAB")}
                className={`${styles.criteriaTabBtn} ${
                  activeTab === "VOCAB" ? styles.criteriaTabBtnActive : ""
                }`}
              >
                <span className={styles.dotLexical} />
                <span>Từ vựng</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "FLUENCY"}
                onClick={() => setActiveTab("FLUENCY")}
                className={`${styles.criteriaTabBtn} ${
                  activeTab === "FLUENCY" ? styles.criteriaTabBtnActive : ""
                }`}
              >
                <span className={styles.dotFluency} />
                <span>Độ trôi chảy</span>
              </button>
            </div>

            {/* AI Evaluation Box */}
            <div className={styles.aiEvaluationBox}>
              <div className={styles.aiLockCircle}>
                <Lock size={22} weight="bold" />
              </div>

              <h3>Chấm điểm chi tiết 4 tiêu chí IELTS</h3>
              <p>
                Hệ thống AI của The IELTS Spells đang hoàn thiện module phân tích chuyên sâu cho từng tiêu chí:
                Phát âm chuẩn IPA, Độ trôi chảy (Fluency), Vốn từ vựng (Lexical Resource) và Độ chính xác ngữ
                pháp (Grammar Range & Accuracy).
              </p>

              <button
                type="button"
                onClick={() =>
                  alert(
                    "Tính năng chấm điểm tự động bằng The IELTS Spells AI Examiner sẽ được kích hoạt ở bản cập nhật tiếp theo!"
                  )
                }
                className={styles.aiUpgradeBtn}
              >
                <Sparkle size={15} weight="fill" />
                <span>Kích hoạt đánh giá AI</span>
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
