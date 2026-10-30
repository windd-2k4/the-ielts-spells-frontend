"use client";

import {
  ArrowLeft,
  ArrowRight,
  ArrowCounterClockwise,
  BookmarkSimple,
  Check,
  CheckCircle,
  Lightbulb,
  Play,
  SpeakerHigh,
  Trophy,
  WarningCircle,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CuratedExerciseJson,
  CuratedVocabItem,
  SentenceChunk,
  SentenceExercise,
  saveCuratedItemToNotebook,
  updateCuratedItemProgress,
} from "./curatedVocabApi";
import styles from "./CuratedVocab.module.css";

interface CuratedStudySessionPlayerProps {
  deckId: string;
  deckName: string;
  items: CuratedVocabItem[];
  onBack: () => void;
  onSessionComplete: () => void;
}

type SubStep = "flashcard" | "dictation" | "translate" | "write_own";

interface MistakeToken {
  token: string;
  explanation: string;
}

export function CuratedStudySessionPlayer({
  deckId,
  deckName,
  items,
  onBack,
  onSessionComplete,
}: CuratedStudySessionPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [subStep, setSubStep] = useState<SubStep>("flashcard");
  const [flipped, setFlipped] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    return new Set(items.filter((item) => item.savedInNotebook).map((item) => item.id));
  });

  // Stage 1.2: Chép chính tả (Dictation drill)
  const [drillInput, setDrillInput] = useState("");
  const [drillChecked, setDrillChecked] = useState(false);
  const [drillIsCorrect, setDrillIsCorrect] = useState(false);
  const [hintCount, setHintCount] = useState(0);

  // Stage 2: Dịch câu có sẵn
  const [translateInput, setTranslateInput] = useState("");
  const [translateChecked, setTranslateChecked] = useState(false);
  const [isHardMode, setIsHardMode] = useState(false);
  const [hoveredChunkIndex, setHoveredChunkIndex] = useState<number | null>(null);
  const [activeMistakeIndex, setActiveMistakeIndex] = useState<number | null>(null);

  // Stage 3: Viết câu của bạn
  const [writeOwnInput, setWriteOwnInput] = useState("");
  const [writeOwnChecked, setWriteOwnChecked] = useState(false);
  const [writeOwnPassed, setWriteOwnPassed] = useState(false);
  const [showIdeaHint, setShowIdeaHint] = useState(false);

  // Session completion
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedWordIds, setCompletedWordIds] = useState<Set<string>>(new Set());

  const currentItem = items[currentIndex];
  const drillInputRef = useRef<HTMLInputElement>(null);
  const translateInputRef = useRef<HTMLTextAreaElement>(null);
  const writeOwnInputRef = useRef<HTMLTextAreaElement>(null);

  // Pronunciation
  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.88;
    window.speechSynthesis.speak(utterance);
  }

  // Parse collocations array
  const collocations = useMemo<string[]>(() => {
    if (!currentItem?.collocationsJson) return [];
    try {
      const parsed = JSON.parse(currentItem.collocationsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [currentItem]);

  // Parse exercise JSON
  const exerciseData = useMemo<CuratedExerciseJson | null>(() => {
    if (!currentItem?.exerciseJson) return null;
    try {
      return JSON.parse(currentItem.exerciseJson);
    } catch {
      return null;
    }
  }, [currentItem]);

  // Current translation exercise (easy or hard)
  const activeTranslateExercise = useMemo<SentenceExercise>(() => {
    if (isHardMode && exerciseData?.cwh) {
      return exerciseData.cwh;
    }
    if (exerciseData?.cwe) {
      return exerciseData.cwe;
    }
    // Fallback if no exerciseJson
    return {
      vi: currentItem?.exampleSentenceVi
        ? currentItem.exampleSentenceVi.replace(/<[^>]*>?/gm, "")
        : `Luyện tập với từ ${currentItem?.term || ""}`,
      en: currentItem?.exampleSentence || currentItem?.term || "",
      ck: [
        {
          vi: currentItem?.meaning || "",
          en: currentItem?.term || "",
        },
      ],
    };
  }, [exerciseData, isHardMode, currentItem]);

  // Step 3 hint exercise
  const activeWriteOwnHint = useMemo<SentenceExercise | null>(() => {
    return exerciseData?.w3e || exerciseData?.w3h || null;
  }, [exerciseData]);

  // Bookmark toggle
  async function handleSaveToNotebook(itemId: string) {
    if (bookmarkedIds.has(itemId)) return;
    try {
      await saveCuratedItemToNotebook(itemId);
      setBookmarkedIds((prev) => new Set([...prev, itemId]));
    } catch (err) {
      console.error("Lỗi lưu từ vào sổ cá nhân:", err);
    }
  }

  // Reset states when moving to next word
  function resetForNextWord() {
    setSubStep("flashcard");
    setFlipped(false);
    // Dictation reset
    setDrillInput("");
    setDrillChecked(false);
    setDrillIsCorrect(false);
    setHintCount(0);
    // Translation reset
    setTranslateInput("");
    setTranslateChecked(false);
    setIsHardMode(false);
    setHoveredChunkIndex(null);
    setActiveMistakeIndex(null);
    // Write own reset
    setWriteOwnInput("");
    setWriteOwnChecked(false);
    setWriteOwnPassed(false);
    setShowIdeaHint(false);
  }

  // Finish current word & advance
  async function finishCurrentWord(isMastered: boolean = true) {
    if (!currentItem) return;
    try {
      await updateCuratedItemProgress(
        deckId,
        currentItem.id,
        isMastered ? "MASTERED" : "FAMILIAR"
      );
      setCompletedWordIds((prev) => new Set([...prev, currentItem.id]));
    } catch (err) {
      console.error("Lỗi cập nhật tiến độ:", err);
    }

    if (currentIndex + 1 < items.length) {
      setCurrentIndex((prev) => prev + 1);
      resetForNextWord();
    } else {
      setIsCompleted(true);
    }
  }

  // Skip word ("Đã biết, bỏ qua từ này →")
  function handleSkipKnown() {
    void finishCurrentWord(true);
  }

  // ─────────────────────────────────────────────────────────────
  // STAGE TRANSITIONS
  // ─────────────────────────────────────────────────────────────

  // From Flashcard to Dictation
  function handleProceedToDictation() {
    setSubStep("dictation");
    setDrillInput("");
    setDrillChecked(false);
    setDrillIsCorrect(false);
    setHintCount(0);
    setTimeout(() => {
      if (currentItem) speak(currentItem.term);
      drillInputRef.current?.focus();
    }, 200);
  }

  // Check dictation
  function handleCheckDrill() {
    if (!currentItem || !drillInput.trim()) return;
    const cleanUser = drillInput.trim().toLowerCase();
    const cleanTarget = currentItem.term.trim().toLowerCase();

    const isMatch = cleanUser === cleanTarget;
    setDrillChecked(true);
    setDrillIsCorrect(isMatch);

    if (isMatch) {
      speak(currentItem.term);
    }
  }

  // Dictation hint (0/3)
  function handleGiveHint() {
    if (!currentItem || hintCount >= 3) return;
    setHintCount((prev) => prev + 1);
    const target = currentItem.term.trim();
    if (hintCount === 0) {
      setDrillInput(target.slice(0, 1));
    } else if (hintCount === 1) {
      setDrillInput(target.slice(0, Math.min(3, target.length)));
    } else {
      setDrillInput(target);
    }
    drillInputRef.current?.focus();
  }

  // From Dictation success to Translation (Step 2)
  function handleProceedToTranslate() {
    setSubStep("translate");
    setTranslateInput("");
    setTranslateChecked(false);
    setActiveMistakeIndex(null);
    setTimeout(() => {
      translateInputRef.current?.focus();
    }, 200);
  }

  // Check Step 2 Translation
  function handleCheckTranslation() {
    if (!translateInput.trim()) return;
    setTranslateChecked(true);
    setActiveMistakeIndex(null);
  }

  // Reset Step 2 Translation ("Viết lại")
  function handleRewriteTranslation() {
    setTranslateChecked(false);
    setActiveMistakeIndex(null);
    setTimeout(() => {
      translateInputRef.current?.focus();
    }, 150);
  }

  // From Step 2 to Step 3 (Viết câu của bạn)
  function handleProceedToWriteOwn() {
    setSubStep("write_own");
    setWriteOwnInput("");
    setWriteOwnChecked(false);
    setWriteOwnPassed(false);
    setShowIdeaHint(false);
    setTimeout(() => {
      writeOwnInputRef.current?.focus();
    }, 200);
  }

  // Check Step 3 Write Own
  function handleCheckWriteOwn() {
    if (!writeOwnInput.trim() || !currentItem) return;
    const cleanText = writeOwnInput.toLowerCase();
    const termClean = currentItem.term.toLowerCase();

    // Check if sentence includes the target term or chunk
    const hasTargetWord = cleanText.includes(termClean);
    setWriteOwnChecked(true);
    setWriteOwnPassed(hasTargetWord);

    if (hasTargetWord) {
      // Mark as mastered in database
      void updateCuratedItemProgress(deckId, currentItem.id, "MASTERED");
      setCompletedWordIds((prev) => new Set([...prev, currentItem.id]));
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PARSING & FEEDBACK HELPERS FOR STEP 2
  // ─────────────────────────────────────────────────────────────

  // Analyze user's translation vs model answer
  const translationAnalysis = useMemo(() => {
    if (!translateChecked || !translateInput.trim()) {
      return {
        mistakes: [] as MistakeToken[],
        cleanModel: activeTranslateExercise.en,
        correctedUser: activeTranslateExercise.en,
      };
    }

    const userText = translateInput.trim();
    const modelText = activeTranslateExercise.en.trim();
    const term = currentItem.term.toLowerCase();
    const userLower = userText.toLowerCase();
    const mistakes: MistakeToken[] = [];

    // 1. Check if user used wrong part of speech / form of the target word
    if (!userLower.includes(term)) {
      // Find words in userText that resemble the term (e.g. benefits vs beneficial)
      const words = userText.split(/\s+/);
      const similar = words.find((w) => {
        const cleanW = w.toLowerCase().replace(/[^a-z]/g, "");
        return cleanW.startsWith(term.slice(0, 4)) || term.startsWith(cleanW.slice(0, 4));
      });
      if (similar) {
        mistakes.push({
          token: similar,
          explanation: `- Dùng tính từ '${currentItem.term}' thay vì '${similar}' sau động từ 'to be'.`,
        });
      } else {
        mistakes.push({
          token: currentItem.term,
          explanation: `- Nhớ sử dụng từ trọng tâm '${currentItem.term}' trong câu.`,
        });
      }
    }

    // 2. Check for preposition mistakes (e.g., beneficial for vs beneficial to)
    if (currentItem.chunk && currentItem.chunk.includes(" to ") && userLower.includes(" for ")) {
      mistakes.push({
        token: "for",
        explanation: `- Dùng giới từ 'to' theo cấu trúc '${currentItem.chunk}'.`,
      });
    }

    // 3. Check for common collocations e.g. "do exercise" instead of "exercise"
    if (userLower.includes("do exercise")) {
      mistakes.push({
        token: "do exercise",
        explanation: `- Dùng 'exercise' (danh từ/động từ) trực tiếp thay vì 'do exercise'.`,
      });
    }

    // If no specific grammar rule caught, but strings don't match, identify divergent words
    if (mistakes.length === 0 && userLower.replace(/[^a-z0-9]/g, "") !== modelText.toLowerCase().replace(/[^a-z0-9]/g, "")) {
      const modelWords = new Set(modelText.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z0-9]/g, "")));
      const userWords = userText.split(/\s+/);
      for (const w of userWords) {
        const clean = w.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (clean.length > 2 && !modelWords.has(clean) && mistakes.length < 3) {
          mistakes.push({
            token: w,
            explanation: `- Xem lại từ '${w}' để câu tự nhiên và chuẩn cấu trúc hơn.`,
          });
        }
      }
    }

    // Corrected sentence: start from model or clean user
    let corrected = modelText;

    return {
      mistakes,
      cleanModel: modelText,
      correctedUser: corrected,
    };
  }, [translateChecked, translateInput, activeTranslateExercise, currentItem]);

  // Keyboard shortcut support
  useEffect(() => {
    if (isCompleted) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const isInput = (e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA";

      if (e.code === "Space" && subStep === "flashcard" && !isInput) {
        e.preventDefault();
        setFlipped((prev) => !prev);
      }

      if (e.key === "Enter" && !e.shiftKey) {
        if (subStep === "dictation" && drillChecked && drillIsCorrect) {
          e.preventDefault();
          handleProceedToTranslate();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [subStep, drillChecked, drillIsCorrect, isCompleted]);

  if (!items.length) {
    return (
      <div className={styles.celebrationPage}>
        <h3>Bộ từ chưa có từ vựng để bắt đầu</h3>
        <button type="button" className={styles.btnStudy} onClick={onBack}>
          Quay lại danh sách
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CELEBRATION / SUMMARY SCREEN
  // ─────────────────────────────────────────────────────────────
  if (isCompleted) {
    return (
      <div className={styles.celebrationPage}>
        <div className={styles.celebrationIcon}>
          <Trophy size={42} weight="duotone" />
        </div>
        <h2 className={styles.celebrationTitle}>Hoàn thành Session 10 từ!</h2>
        <p className={styles.celebrationDesc}>
          Bạn vừa hoàn thành trọn vẹn cả 3 bước (Hiểu nghĩa, Dịch câu, Viết câu) cho session từ vựng{" "}
          <strong>{deckName}</strong>. Hãy duy trì đều đặn để tự tin bứt phá điểm IELTS nhé!
        </p>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statVal} style={{ color: "#15803d" }}>
              {completedWordIds.size}
            </span>
            <span className={styles.statLbl}>Từ đã học</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statVal} style={{ color: "#c85f78" }}>
              {items.length}
            </span>
            <span className={styles.statLbl}>Mục tiêu session</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statVal} style={{ color: "#ea580c" }}>
              100%
            </span>
            <span className={styles.statLbl}>Tỷ lệ hoàn thành</span>
          </div>
        </div>

        <div className={styles.celebrationActions}>
          <button
            type="button"
            className={styles.btnOrangeCheck}
            style={{ justifyContent: "center", padding: "14px 28px", fontSize: "16px" }}
            onClick={() => onSessionComplete()}
          >
            <Play size={18} weight="fill" />
            Học tiếp 10 từ khác →
          </button>
          <button type="button" className={styles.btnOutlineRewrite} onClick={onBack}>
            <ArrowLeft size={16} />
            Quay lại danh sách bộ từ
          </button>
        </div>
      </div>
    );
  }

  const isBookmarked = bookmarkedIds.has(currentItem.id);
  const currentStepperStep = subStep === "flashcard" || subStep === "dictation" ? 1 : subStep === "translate" ? 2 : 3;

  return (
    <div className={styles.sessionPlayerPage}>
      {/* TOP NAVIGATION BAR */}
      <div className={styles.sessionTopNav}>
        <button type="button" className={styles.btnBackToDeck} onClick={onBack}>
          <ArrowLeft size={16} weight="bold" />
          Về bộ từ
        </button>

        <button type="button" className={styles.btnSkipKnown} onClick={handleSkipKnown}>
          Đã biết, bỏ qua từ này →
        </button>
      </div>

      {/* 2-COLUMN GRID */}
      <div className={styles.sessionGrid}>
        {/* LEFT SIDEBAR */}
        <aside className={styles.sessionSidebar}>
          {/* Card 1: Progress Dashes */}
          <div className={styles.sidebarCard}>
            <h3 className={styles.sidebarTitle}>
              Từ {currentIndex + 1} / {items.length}
            </h3>
            <div className={styles.dashBar}>
              {Array.from({ length: items.length }).map((_, idx) => (
                <div
                  key={idx}
                  className={`${styles.dash} ${
                    idx < currentIndex
                      ? styles.dashDone
                      : idx === currentIndex
                      ? styles.dashActive
                      : ""
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Card 2: 3-Step Stepper (Matching YouPass) */}
          <div className={styles.sidebarCard}>
            <div className={styles.stepperList}>
              {/* Step 1: Hiểu nghĩa */}
              <div
                className={`${styles.stepItem} ${
                  currentStepperStep === 1
                    ? styles.stepItemActive
                    : currentStepperStep > 1
                    ? styles.stepItemDone
                    : ""
                }`}
              >
                <span className={styles.stepBadge}>
                  {currentStepperStep > 1 ? <Check size={14} weight="bold" /> : 1}
                </span>
                <span>Hiểu nghĩa</span>
              </div>

              {/* Step 2: Dịch câu có sẵn */}
              <div
                className={`${styles.stepItem} ${
                  currentStepperStep === 2
                    ? styles.stepItemActive
                    : currentStepperStep > 2
                    ? styles.stepItemDone
                    : ""
                }`}
              >
                <span className={styles.stepBadge}>
                  {currentStepperStep > 2 ? <Check size={14} weight="bold" /> : 2}
                </span>
                <span>Dịch câu có sẵn</span>
              </div>

              {/* Step 3: Viết câu của bạn */}
              <div
                className={`${styles.stepItem} ${
                  currentStepperStep === 3 ? styles.stepItemActive : ""
                }`}
              >
                <span className={styles.stepBadge}>3</span>
                <span>Viết câu của bạn</span>
              </div>
            </div>
          </div>

          {/* Card 3: Mini Deck Widget */}
          <div className={styles.sidebarCard}>
            <div className={styles.miniDeckWidget}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#e6f4ea",
                  color: "#137333",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "11px",
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {completedWordIds.size}/{items.length}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <strong style={{ fontSize: "13px", color: "#292528" }}>{deckName}</strong>
                <span style={{ fontSize: "11.5px", color: "#6f676c" }}>
                  {completedWordIds.size}/{items.length} từ dùng được
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN AREA */}
        <main className={styles.mainCardSection}>
          {/* ──────────────────────────────────────────────────
              STAGE 1.1: FLASHCARD (HIỂU NGHĨA)
              ────────────────────────────────────────────────── */}
          {subStep === "flashcard" && (
            <>
              <div className={styles.flashcard} onClick={() => setFlipped((prev) => !prev)}>
                {!flipped ? (
                  /* FRONT */
                  <div className={styles.flashcardWordHead}>
                    <h1 className={styles.bigWord}>{currentItem.term}</h1>
                    <div className={styles.wordMetaRow}>
                      <button
                        type="button"
                        className={styles.btnAudioRound}
                        onClick={(e) => {
                          e.stopPropagation();
                          speak(currentItem.term);
                        }}
                        title="Nghe phát âm"
                      >
                        <SpeakerHigh size={20} weight="fill" />
                      </button>
                      {currentItem.phonetic ? (
                        <span className={styles.phoneticText}>{currentItem.phonetic}</span>
                      ) : null}
                      {currentItem.partOfSpeech ? (
                        <span className={styles.posTag}>{currentItem.partOfSpeech}</span>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  /* BACK */
                  <div style={{ margin: "auto 0" }}>
                    <div className={styles.backWordSmall}>{currentItem.term}</div>
                    <h2 className={styles.backMeaningBig}>{currentItem.meaning}</h2>

                    {currentItem.exampleSentence ? (
                      <div className={styles.exampleBoxBilingual}>
                        <div className={styles.exEn}>{currentItem.exampleSentence}</div>
                        {currentItem.exampleSentenceVi ? (
                          <div className={styles.exVi}>
                            {currentItem.exampleSentenceVi.replace(/<[^>]*>?/gm, "")}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )}

                <div className={styles.cardFlipHint}>
                  Chạm hoặc ấn <strong>Space</strong> để lật thẻ
                </div>
              </div>

              {/* DETAILS BELOW CARD (Công thức, Collocation, Hiểu sâu & Họ từ) */}
              {flipped && (
                <div className={styles.detailSections}>
                  {currentItem.chunk ? (
                    <div className={styles.sectionBlock}>
                      <span className={styles.sectionHeader}>Công thức</span>
                      <div className={styles.chunkFormula}>{currentItem.chunk}</div>
                    </div>
                  ) : null}

                  {collocations.length > 0 ? (
                    <div className={styles.sectionBlock}>
                      <span className={styles.sectionHeader}>Collocation</span>
                      <div className={styles.collocWrap}>
                        {collocations.map((col, idx) => (
                          <span key={idx} className={styles.collocPill}>
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {currentItem.tip ? (
                    <div
                      className={styles.tipContainer}
                      dangerouslySetInnerHTML={{ __html: currentItem.tip }}
                    />
                  ) : null}
                </div>
              )}

              {/* Bottom Right: Nút "Luyện từ →" */}
              <div className={styles.bottomBarRight}>
                <button
                  type="button"
                  className={styles.btnOrangeCheck}
                  onClick={handleProceedToDictation}
                >
                  Luyện từ →
                </button>
              </div>
            </>
          )}

          {/* ──────────────────────────────────────────────────
              STAGE 1.2: CHÉP CHÍNH TẢ (DICTATION DRILL - Image 1)
              ────────────────────────────────────────────────── */}
          {subStep === "dictation" && (
            <div className={styles.drillContainer}>
              <span className={styles.stageTitleTag}>CHÉP CHÍNH TẢ</span>

              <div className={styles.drillCard}>
                <div className={styles.drillMetaRow}>
                  {currentItem.partOfSpeech ? (
                    <span className={styles.posTag}>{currentItem.partOfSpeech}</span>
                  ) : null}
                  <span className={styles.drillMeaning}>{currentItem.meaning}</span>
                </div>

                <p className={styles.drillPrompt}>Nghe rồi gõ lại đúng từ bạn vừa nghe.</p>

                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className={styles.btnListenBig}
                    onClick={() => speak(currentItem.term)}
                  >
                    <SpeakerHigh size={20} weight="fill" />
                    Nghe lại
                  </button>

                  {drillChecked && drillIsCorrect ? (
                    <span
                      style={{
                        fontSize: "20px",
                        fontWeight: 800,
                        color: "#16a34a",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {currentItem.term}
                    </span>
                  ) : null}
                </div>

                {/* Input box */}
                {!(drillChecked && drillIsCorrect) && (
                  <div className={styles.drillInputWrap}>
                    <input
                      ref={drillInputRef}
                      className={`${styles.drillInput} ${
                        drillChecked
                          ? drillIsCorrect
                            ? styles.drillInputCorrect
                            : styles.drillInputIncorrect
                          : ""
                      }`}
                      placeholder="Gõ từ bạn nghe được..."
                      value={drillInput}
                      onChange={(e) => {
                        setDrillInput(e.target.value);
                        if (drillChecked) setDrillChecked(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCheckDrill();
                        }
                      }}
                    />

                    <button
                      type="button"
                      className={styles.btnHint}
                      onClick={handleGiveHint}
                      disabled={hintCount >= 3}
                    >
                      Gợi ý thêm ({hintCount}/3)
                    </button>
                  </div>
                )}

                {drillChecked && !drillIsCorrect && (
                  <div className={`${styles.drillFeedbackBox} ${styles.feedbackIncorrect}`}>
                    <WarningCircle size={20} weight="fill" />
                    <span>Chưa chính xác, hãy nghe lại hoặc dùng gợi ý nhé!</span>
                  </div>
                )}

                {/* Action button if not yet correct */}
                {!(drillChecked && drillIsCorrect) && (
                  <div className={styles.bottomBarRight}>
                    <button
                      type="button"
                      disabled={!drillInput.trim()}
                      className={styles.btnOrangeCheck}
                      onClick={handleCheckDrill}
                    >
                      Kiểm tra
                    </button>
                  </div>
                )}
              </div>

              {/* BOTTOM FIXED GREEN SUCCESS BANNER (Matching Image 1) */}
              {drillChecked && drillIsCorrect && (
                <div className={styles.fixedSuccessBanner}>
                  <div className={styles.bannerLeft}>
                    <button
                      type="button"
                      className={styles.bannerSpeakerBtn}
                      onClick={() => speak(currentItem.term)}
                      title="Nghe lại phát âm"
                    >
                      <SpeakerHigh size={24} weight="fill" />
                    </button>

                    <div className={styles.bannerTextCol}>
                      <div className={styles.bannerTitleRow}>
                        CHÍNH XÁC
                        <span className={styles.bannerTitleWord}>
                          {currentItem.term} ({currentItem.partOfSpeech || "Từ vựng"})
                        </span>
                      </div>
                      <div className={styles.bannerMeaningRow}>
                        Nghĩa: {currentItem.meaning}
                      </div>
                      {currentItem.exampleSentence ? (
                        <div className={styles.bannerExampleRow}>
                          Ví dụ: {currentItem.exampleSentence}
                        </div>
                      ) : null}
                      {currentItem.exampleSentenceVi ? (
                        <div className={styles.bannerExampleVi}>
                          {currentItem.exampleSentenceVi.replace(/<[^>]*>?/gm, "")}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className={styles.bannerRight}>
                    <button
                      type="button"
                      className={styles.bannerBtnNext}
                      onClick={handleProceedToTranslate}
                    >
                      Viết câu →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────
              STAGE 2: DỊCH CÂU CÓ SẴN (Images 2, 3, 4)
              ────────────────────────────────────────────────── */}
          {subStep === "translate" && (
            <div className={styles.workflowStageContainer}>
              <span className={styles.stageTitleTag}>DỊCH CÂU CÓ SẴN</span>

              {/* Word Header */}
              <div className={styles.stageHeaderSection}>
                <div className={styles.stageWordRow}>
                  <strong className={styles.stageWordText}>{currentItem.term}</strong>
                  {currentItem.partOfSpeech ? (
                    <span className={styles.posTag}>{currentItem.partOfSpeech}</span>
                  ) : null}
                  <span className={styles.stageMeaningText}>{currentItem.meaning}</span>
                </div>

                <button
                  type="button"
                  className={`${styles.stageBookmarkBtn} ${
                    isBookmarked ? styles.stageBookmarkBtnActive : ""
                  }`}
                  onClick={() => handleSaveToNotebook(currentItem.id)}
                  title={isBookmarked ? "Đã lưu vào sổ tay" : "Lưu vào sổ từ"}
                >
                  <BookmarkSimple size={16} weight={isBookmarked ? "fill" : "bold"} />
                  {isBookmarked ? "Đã lưu" : "Lưu vào sổ"}
                </button>
              </div>

              {/* Sub-Card: Vietnamese sentence prompt with hoverable chunks */}
              <div className={styles.promptBoxTranslate}>
                <span className={styles.promptBoxLabel}>DỊCH CÂU NÀY SANG TIẾNG ANH</span>

                <div className={styles.promptViSentence}>
                  {activeTranslateExercise.ck && activeTranslateExercise.ck.length > 0 ? (
                    activeTranslateExercise.ck.map((chunk, idx) => {
                      const isTargetChunk =
                        chunk.en.toLowerCase().includes(currentItem.term.toLowerCase()) ||
                        chunk.vi.toLowerCase().includes(currentItem.meaning.toLowerCase()) ||
                        (currentItem.chunk &&
                          currentItem.chunk.toLowerCase().includes(chunk.en.toLowerCase()));

                      return (
                        <span
                          key={idx}
                          className={`${styles.interactiveChunk} ${
                            isTargetChunk ? styles.interactiveChunkHighlighted : ""
                          }`}
                          onMouseEnter={() => setHoveredChunkIndex(idx)}
                          onMouseLeave={() => setHoveredChunkIndex(null)}
                          onClick={() => setHoveredChunkIndex(hoveredChunkIndex === idx ? null : idx)}
                        >
                          {chunk.vi}{" "}
                          {hoveredChunkIndex === idx && (
                            <span className={styles.chunkHoverTooltip}>{chunk.en}</span>
                          )}
                        </span>
                      );
                    })
                  ) : (
                    <span>{activeTranslateExercise.vi}</span>
                  )}
                </div>

                {!translateChecked && (
                  <div className={styles.promptHelperCaption}>
                    <Lightbulb size={16} weight="fill" />
                    <span>Rê chuột vào từng cụm để xem gợi ý tiếng Anh</span>
                  </div>
                )}

                {/* Show Model Answer after check */}
                {translateChecked && (
                  <div className={styles.modelAnswerBox}>
                    <div className={styles.modelAnswerLabel}>ĐÁP ÁN</div>
                    <div className={styles.modelAnswerText}>
                      {activeTranslateExercise.en.split(new RegExp(`(${currentItem.term})`, "gi")).map((p, i) =>
                        p.toLowerCase() === currentItem.term.toLowerCase() ? (
                          <strong key={i}>{p}</strong>
                        ) : (
                          p
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle hard / easy mode before checking */}
              {!translateChecked && exerciseData?.cwh && (
                <button
                  type="button"
                  className={styles.difficultyToggleBtn}
                  onClick={() => setIsHardMode((prev) => !prev)}
                >
                  {isHardMode ? "← Viết câu dễ hơn" : "Viết câu khó hơn →"}
                </button>
              )}

              {/* Textarea or Feedback Review */}
              {!translateChecked ? (
                <>
                  <textarea
                    ref={translateInputRef}
                    className={styles.workflowTextarea}
                    placeholder="Dịch câu sang tiếng Anh..."
                    value={translateInput}
                    onChange={(e) => setTranslateInput(e.target.value)}
                    rows={3}
                  />

                  <div className={styles.bottomBarRight}>
                    <button
                      type="button"
                      disabled={!translateInput.trim()}
                      className={styles.btnOrangeCheck}
                      onClick={handleCheckTranslation}
                    >
                      Kiểm tra
                    </button>
                  </div>
                </>
              ) : (
                /* REVIEW MODE (Matching Images 3 & 4) */
                <>
                  {/* Alert bar */}
                  <div className={styles.feedbackAlertYellow}>
                    <Lightbulb size={20} weight="fill" />
                    <span>
                      {translationAnalysis.mistakes.length > 0
                        ? `Mình soát thấy ${translationAnalysis.mistakes.length} chỗ cần chỉnh - sửa lại cho bạn nè.`
                        : "Câu của bạn rất chuẩn xác! Tuyệt vời!"}
                    </span>
                  </div>

                  {/* Review Card: CÂU CỦA BẠN with dashed mistakes + MÌNH SỬA LẠI */}
                  <div className={styles.userSentenceReviewCard}>
                    <div>
                      <div className={styles.reviewSectionLabel}>CÂU CỦA BẠN</div>
                      <div className={styles.userSentenceDashedLine}>
                        {translateInput.split(/\s+/).map((word, wIdx) => {
                          const cleanW = word.toLowerCase().replace(/[^a-z0-9]/g, "");
                          const mistake = translationAnalysis.mistakes.find(
                            (m) =>
                              m.token.toLowerCase() === word.toLowerCase() ||
                              m.token.toLowerCase().includes(cleanW)
                          );

                          if (mistake) {
                            return (
                              <span
                                key={wIdx}
                                className={styles.dashedMistakeItem}
                                onClick={() =>
                                  setActiveMistakeIndex(activeMistakeIndex === wIdx ? null : wIdx)
                                }
                                onMouseEnter={() => setActiveMistakeIndex(wIdx)}
                                onMouseLeave={() => setActiveMistakeIndex(null)}
                              >
                                {word}{" "}
                                {activeMistakeIndex === wIdx && (
                                  <span className={styles.mistakeTooltipBox}>
                                    {mistake.explanation}
                                  </span>
                                )}
                              </span>
                            );
                          }
                          return <span key={wIdx}>{word} </span>;
                        })}
                      </div>
                      {translationAnalysis.mistakes.length > 0 && (
                        <span style={{ fontSize: "12.5px", color: "#6b7280", marginTop: "4px", display: "block" }}>
                          {translationAnalysis.mistakes.length} chỗ cần chỉnh - chạm vào chỗ gạch nét đứt để xem giải thích
                        </span>
                      )}
                    </div>

                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #e5e7eb" }}>
                      <div className={styles.reviewSectionLabel}>MÌNH SỬA LẠI</div>
                      <div className={styles.correctedSentenceText}>
                        {translationAnalysis.correctedUser
                          .split(new RegExp(`(${currentItem.term})`, "gi"))
                          .map((p, i) =>
                            p.toLowerCase() === currentItem.term.toLowerCase() ? (
                              <strong key={i}>{p}</strong>
                            ) : (
                              p
                            )
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Row: Viết lại (outline) | Viết câu của bạn → (orange) */}
                  <div className={styles.bottomActionRowWorkflow}>
                    <button
                      type="button"
                      className={styles.btnOutlineRewrite}
                      onClick={handleRewriteTranslation}
                    >
                      <ArrowCounterClockwise size={16} />
                      Viết lại
                    </button>

                    <button
                      type="button"
                      className={styles.btnOrangeCheck}
                      onClick={handleProceedToWriteOwn}
                    >
                      Viết câu của bạn →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────
              STAGE 3: VIẾT CÂU CỦA BẠN (Image 5)
              ────────────────────────────────────────────────── */}
          {subStep === "write_own" && (
            <div className={styles.workflowStageContainer}>
              <span className={styles.stageTitleTag}>VIẾT CÂU CỦA BẠN</span>

              {/* Word Header */}
              <div className={styles.stageHeaderSection}>
                <div className={styles.stageWordRow}>
                  <strong className={styles.stageWordText}>{currentItem.term}</strong>
                  {currentItem.partOfSpeech ? (
                    <span className={styles.posTag}>{currentItem.partOfSpeech}</span>
                  ) : null}
                  <span className={styles.stageMeaningText}>{currentItem.meaning}</span>
                </div>

                <button
                  type="button"
                  className={`${styles.stageBookmarkBtn} ${
                    isBookmarked ? styles.stageBookmarkBtnActive : ""
                  }`}
                  onClick={() => handleSaveToNotebook(currentItem.id)}
                  title={isBookmarked ? "Đã lưu vào sổ tay" : "Lưu vào sổ từ"}
                >
                  <BookmarkSimple size={16} weight={isBookmarked ? "fill" : "bold"} />
                  {isBookmarked ? "Đã lưu" : "Lưu vào sổ"}
                </button>
              </div>

              {/* Sub-Box 1: ĐẾN LƯỢT BẠN */}
              <div className={styles.boxYourTurn}>
                <span className={styles.boxYourTurnLabel}>ĐẾN LƯỢT BẠN</span>
                <span className={styles.boxYourTurnTitle}>
                  Viết một câu tiếng Anh của riêng bạn với từ này.
                </span>
              </div>

              {/* Sub-Box 2: DÙNG CỤM */}
              {currentItem.chunk ? (
                <div className={styles.boxUseChunk}>
                  <span className={styles.boxUseChunkLabel}>DÙNG CỤM</span>
                  <span className={styles.boxUseChunkFormula}>{currentItem.chunk}</span>
                </div>
              ) : null}

              {/* Textarea */}
              <textarea
                ref={writeOwnInputRef}
                className={styles.workflowTextarea}
                placeholder="Viết một câu tiếng Anh..."
                value={writeOwnInput}
                onChange={(e) => {
                  setWriteOwnInput(e.target.value);
                  if (writeOwnChecked) setWriteOwnChecked(false);
                }}
                rows={3}
              />

              {/* Optional Vietnamese Hint Drawer */}
              {showIdeaHint && activeWriteOwnHint && (
                <div className={styles.ideaDrawer}>
                  <strong>Gợi ý câu:</strong> {activeWriteOwnHint.vi.replace(/<[^>]*>?/gm, "")}
                  <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.9 }}>
                    Cấu trúc tham khảo: <em>{activeWriteOwnHint.en}</em>
                  </div>
                </div>
              )}

              {/* Feedback Alert after check */}
              {writeOwnChecked && (
                <div
                  className={`${styles.drillFeedbackBox} ${
                    writeOwnPassed ? styles.feedbackCorrect : styles.feedbackIncorrect
                  }`}
                >
                  {writeOwnPassed ? (
                    <>
                      <CheckCircle size={22} weight="fill" />
                      <div>
                        <strong>Rất tốt!</strong> Bạn đã sử dụng thành công từ "
                        <strong>{currentItem.term}</strong>" trong câu của mình.
                        {activeWriteOwnHint && (
                          <div style={{ fontSize: "13px", marginTop: "3px", fontWeight: 500 }}>
                            Câu mẫu thêm: <em>{activeWriteOwnHint.en}</em>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <WarningCircle size={22} weight="fill" />
                      <span>
                        Đừng quên sử dụng từ "{currentItem.term}" hoặc cụm từ gợi ý trong câu
                        của bạn nhé!
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Bottom Action Row */}
              <div className={styles.bottomActionRowWorkflow}>
                <button
                  type="button"
                  className={styles.btnHintIdea}
                  onClick={() => setShowIdeaHint((prev) => !prev)}
                >
                  <Lightbulb size={18} weight="fill" style={{ color: "#ea580c" }} />
                  Bí ý? Gợi ý câu tiếng Việt
                </button>

                {writeOwnChecked && writeOwnPassed ? (
                  <button
                    type="button"
                    className={styles.btnOrangeCheck}
                    onClick={() => void finishCurrentWord(true)}
                  >
                    {currentIndex + 1 < items.length ? "Từ tiếp theo →" : "Hoàn thành session 🎉"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!writeOwnInput.trim()}
                    className={styles.btnOrangeCheck}
                    onClick={handleCheckWriteOwn}
                  >
                    Kiểm tra
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
