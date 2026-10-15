"use client";

import { useState } from "react";
import {
  BookmarkSimple,
  MagnifyingGlass,
  Sparkle,
  SpinnerGap,
  Translate,
} from "@phosphor-icons/react";
import type { SpeakingVocabLookupResponse } from "@ielts/contracts";
import { lookupSpeakingVocab } from "./speakingApi";
import styles from "./SpeakingAttemptPlayer.module.css";

interface ChatLookupItem {
  id: string;
  query: string;
  direction: "EN_VI" | "VI_EN";
  timestamp: string;
  result?: SpeakingVocabLookupResponse;
  loading?: boolean;
  error?: string;
}

export function SpeakingVocabPanel() {
  const [direction, setDirection] = useState<"EN_VI" | "VI_EN">("VI_EN");
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<ChatLookupItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery || cleanQuery.length > 50 || isSubmitting) return;

    const itemId = `lookup-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newItem: ChatLookupItem = {
      id: itemId,
      query: cleanQuery,
      direction,
      timestamp,
      loading: true,
    };

    setHistory((prev) => [...prev, newItem]);
    setQuery("");
    setIsSubmitting(true);

    try {
      const response = await lookupSpeakingVocab({
        query: cleanQuery,
        direction,
      });

      setHistory((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, loading: false, result: response }
            : item
        )
      );
    } catch (err) {
      setHistory((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                loading: false,
                error:
                  err instanceof Error ? err.message : "Không thể tra cứu từ vựng lúc này",
              }
            : item
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.vocabContainer}>
      {/* Direction selector pills */}
      <div className={styles.directionToggleContainer}>
        <button
          type="button"
          onClick={() => setDirection("VI_EN")}
          className={`${styles.directionPill} ${
            direction === "VI_EN" ? styles.directionPillActive : ""
          }`}
        >
          <Translate size={14} />
          <span>Tra Việt - Anh</span>
        </button>
        <button
          type="button"
          onClick={() => setDirection("EN_VI")}
          className={`${styles.directionPill} ${
            direction === "EN_VI" ? styles.directionPillActive : ""
          }`}
        >
          <Translate size={14} />
          <span>Tra Anh - Việt</span>
        </button>
      </div>

      {/* Input box */}
      <form onSubmit={handleSearch} className={styles.vocabInputForm}>
        <div className={styles.vocabInputWrapper}>
          <input
            type="text"
            value={query}
            maxLength={50}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              direction === "VI_EN"
                ? "Nhập từ tiếng Việt cần nói (vd: thường xuyên, hào hứng)..."
                : "Nhập từ tiếng Anh cần tra (vd: on a regular basis)..."
            }
            className={styles.vocabInput}
          />
          <button
            type="submit"
            disabled={!query.trim() || isSubmitting}
            className={styles.vocabSubmitButton}
            aria-label="Tra cứu bằng AI"
          >
            {isSubmitting ? (
              <SpinnerGap size={18} className="animate-spin" />
            ) : (
              <MagnifyingGlass size={18} />
            )}
          </button>
        </div>
        <div className={styles.vocabInputMeta}>
          <span>{query.length}/50 ký tự</span>
          <span className={styles.vocabAiHint}>
            <Sparkle size={12} weight="fill" /> Dịch &amp; gợi ý ngữ cảnh bằng AI
          </span>
        </div>
      </form>

      {/* Conversation History / Results */}
      <div className={styles.vocabHistoryList}>
        {history.length === 0 ? (
          <div className={styles.vocabEmptyState}>
            <div className={styles.vocabEmptyIconWrapper}>
              <Translate size={28} />
            </div>
            <p className={styles.vocabEmptyTitle}>Tra từ vựng 2 chiều thông minh</p>
            <p className={styles.vocabEmptyText}>
              Gặp ý tưởng tiếng Việt mà chưa biết dùng từ tiếng Anh nào trong IELTS Speaking? Hãy
              nhập từ vào ô bên trên để AI gợi ý cụm từ tự nhiên và câu ví dụ thực tế!
            </p>
          </div>
        ) : (
          history.map((item) => (
            <div key={item.id} className={styles.vocabHistoryItem}>
              {/* User bubble on right */}
              <div className={styles.userBubbleWrapper}>
                <div className={styles.userBubble}>
                  <span className={styles.userBubbleText}>{item.query}</span>
                  <span className={styles.userBubbleBadge}>
                    {item.direction === "VI_EN" ? "Việt → Anh" : "Anh → Việt"}
                  </span>
                </div>
              </div>

              {/* AI result card on left */}
              <div className={styles.aiResultWrapper}>
                {item.loading && (
                  <div className={styles.aiLoadingCard}>
                    <SpinnerGap size={18} className="animate-spin text-[#AD4C64]" />
                    <span>AI đang tra cứu từ vựng và tạo câu ví dụ...</span>
                  </div>
                )}

                {item.error && (
                  <div className={styles.aiErrorCard}>
                    <span>{item.error}</span>
                  </div>
                )}

                {item.result && (
                  <div className={styles.aiResultCard}>
                    {/* Main Translation */}
                    <div className={styles.aiResultMainRow}>
                      <div>
                        <div className={styles.aiResultMainWord}>
                          {item.result.mainTranslation}
                        </div>
                        {item.result.phonetic && (
                          <div className={styles.aiResultPhonetic}>
                            {item.result.phonetic}
                            {item.result.partOfSpeech && (
                              <span className={styles.aiResultPartOfSpeech}>
                                • {item.result.partOfSpeech}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        className={styles.saveVocabButton}
                        title="Lưu từ vựng (tính năng sắp ra mắt)"
                        onClick={() => {
                          alert(`Đã ghi nhớ từ vựng "${item.result?.mainTranslation}" vào sổ tay luyện thi!`);
                        }}
                      >
                        <BookmarkSimple size={14} />
                        <span>Lưu từ</span>
                      </button>
                    </div>

                    {/* Synonyms / Related phrases */}
                    {item.result.synonyms && item.result.synonyms.length > 0 && (
                      <div className={styles.synonymsSection}>
                        <div className={styles.synonymsLabel}>Cụm từ tương đương:</div>
                        <div className={styles.synonymsTags}>
                          {item.result.synonyms.map((syn, sIdx) => (
                            <span key={sIdx} className={styles.synonymTag}>
                              {syn}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Example sentences */}
                    {item.result.examples && item.result.examples.length > 0 && (
                      <div className={styles.examplesSection}>
                        <div className={styles.examplesLabel}>Gợi ý đặt câu IELTS:</div>
                        <div className={styles.examplesList}>
                          {item.result.examples.map((ex, exIdx) => (
                            <div key={exIdx} className={styles.exampleItem}>
                              <p className={styles.exampleEnglish}>
                                &ldquo;{ex.english}&rdquo;
                              </p>
                              {ex.vietnamese && (
                                <p className={styles.exampleVietnamese}>
                                  → {ex.vietnamese}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
