"use client";

import {
  ArrowLeft,
  BookmarkSimple,
  Cards,
  MagnifyingGlass,
  Play,
  SpeakerHigh,
  SpinnerGap,
} from "@phosphor-icons/react";
import { useState } from "react";
import {
  CuratedDeckDetail,
  saveCuratedItemToNotebook,
} from "./curatedVocabApi";
import styles from "./CuratedVocab.module.css";

interface CuratedDeckDetailViewProps {
  detail: CuratedDeckDetail;
  onBack: () => void;
  onStartSession: () => void;
  onRefresh: () => Promise<void>;
}

export function CuratedDeckDetailView({
  detail,
  onBack,
  onStartSession,
  onRefresh,
}: CuratedDeckDetailViewProps) {
  const [filterQuery, setFilterQuery] = useState("");
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [savedItemIds, setSavedItemIds] = useState<Set<string>>(() => {
    return new Set(detail.items.filter((it) => it.savedInNotebook).map((it) => it.id));
  });

  const { deck, items } = detail;

  function speak(term: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(term);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  async function handleSaveItem(itemId: string) {
    if (savedItemIds.has(itemId) || savingItemId) return;
    setSavingItemId(itemId);
    try {
      await saveCuratedItemToNotebook(itemId);
      setSavedItemIds((prev) => new Set([...prev, itemId]));
    } catch (err) {
      console.error("Lỗi lưu từ vào sổ từ cá nhân:", err);
    } finally {
      setSavingItemId(null);
    }
  }

  const filteredItems = items.filter((item) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      item.term.toLowerCase().includes(q) ||
      item.meaning.toLowerCase().includes(q) ||
      (item.exampleSentence && item.exampleSentence.toLowerCase().includes(q))
    );
  });

  const percentMastered = deck.totalWords
    ? Math.round((deck.masteredCount / deck.totalWords) * 100)
    : 0;

  return (
    <div className={styles.hubContainer}>
      <header className={styles.detailHeader}>
        <button type="button" className={styles.btnBack} onClick={onBack}>
          <ArrowLeft size={16} weight="bold" />
          Kho từ vựng
        </button>

        <div className={styles.detailHero}>
          <div className={styles.heroLeft}>
            <div className={styles.heroIconBox}>
              <Cards size={28} weight="duotone" />
            </div>
            <div>
              <span
                className={`${styles.deckBadge} ${
                  deck.category === "BASIC"
                    ? styles.badgeBasic
                    : deck.category === "ADVANCED"
                    ? styles.badgeAdvanced
                    : styles.badgeIntensive
                }`}
              >
                {deck.category}
              </span>
              <h1 className={styles.heroTitle}>{deck.name}</h1>
              <p className={styles.heroSubtitle}>
                {deck.totalWords} từ • {deck.category === "BASIC" ? "Basic" : deck.category === "ADVANCED" ? "Advanced" : "Chuyên sâu"}
              </p>
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.progressRingWrap} style={{ width: "64px", height: "64px" }}>
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke="#e5e5ea"
                  strokeWidth="5"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="5"
                  strokeDasharray={163}
                  strokeDashoffset={163 - (163 * percentMastered) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 32 32)"
                />
              </svg>
              <span
                style={{
                  position: "absolute",
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#292528",
                }}
              >
                {deck.masteredCount}/{deck.totalWords}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
              <button type="button" className={styles.btnHeroStudy} onClick={onStartSession}>
                <Play size={18} weight="fill" />
                Học tiếp 10 từ →
              </button>
              <span style={{ fontSize: "12px", color: "#6f676c" }}>
                Mỗi session mình sẽ học 10 từ bạn nhé!
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Search Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox} style={{ width: "100%", maxWidth: "380px" }}>
          <MagnifyingGlass size={16} color="#6f676c" />
          <input
            placeholder="Tìm kiếm từ vựng, định nghĩa hoặc ngữ cảnh..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
        </div>
        <span style={{ fontSize: "13px", color: "#6f676c", fontWeight: 600 }}>
          Hiển thị {filteredItems.length} / {items.length} từ
        </span>
      </div>

      {/* Vocab Table (YouPass style) */}
      <div className={styles.vocabTableContainer}>
        <table className={styles.vocabTable}>
          <thead>
            <tr>
              <th style={{ width: "24%" }}>Từ vựng</th>
              <th style={{ width: "14%" }}>Loại từ</th>
              <th style={{ width: "38%" }}>Nghĩa</th>
              <th style={{ width: "14%" }}>Trạng thái</th>
              <th style={{ width: "10%", textAlign: "right" }}>Sổ từ</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const isSaved = savedItemIds.has(item.id);
              const isSaving = savingItemId === item.id;

              return (
                <tr key={item.id}>
                  <td>
                    <div className={styles.termCell}>
                      <div className={styles.termRow}>
                        <strong className={styles.termWord}>{item.term}</strong>
                        <button
                          type="button"
                          className={styles.btnAudio}
                          onClick={() => speak(item.term)}
                          title="Nghe phát âm"
                        >
                          <SpeakerHigh size={16} />
                        </button>
                      </div>
                      {item.phonetic ? (
                        <span className={styles.phoneticText}>{item.phonetic}</span>
                      ) : null}
                    </div>
                  </td>

                  <td>
                    {item.partOfSpeech ? (
                      <span className={styles.posTag}>{item.partOfSpeech}</span>
                    ) : (
                      <span style={{ color: "#a49a9f" }}>—</span>
                    )}
                  </td>

                  <td>
                    <div className={styles.meaningText}>{item.meaning}</div>
                    {item.exampleSentence ? (
                      <div className={styles.exampleSnippet}>
                        "{item.exampleSentence}"
                      </div>
                    ) : null}
                  </td>

                  <td>
                    {item.masteryStatus === "MASTERED" ? (
                      <span className={`${styles.statusPill} ${styles.statusMastered}`}>
                        Dùng được
                      </span>
                    ) : item.masteryStatus === "FAMILIAR" ? (
                      <span className={`${styles.statusPill} ${styles.statusFamiliar}`}>
                        Xem lại
                      </span>
                    ) : (
                      <span className={`${styles.statusPill} ${styles.statusNotLearned}`}>
                        Chưa thuộc
                      </span>
                    )}
                  </td>

                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      disabled={isSaved || isSaving}
                      className={`${styles.btnSaveNotebook} ${isSaved ? styles.btnSaved : ""}`}
                      onClick={() => void handleSaveItem(item.id)}
                      title={isSaved ? "Đã lưu vào sổ từ cá nhân" : "Lưu vào sổ từ cá nhân"}
                    >
                      {isSaving ? (
                        <SpinnerGap className="animate-spin" size={14} />
                      ) : (
                        <BookmarkSimple size={14} weight={isSaved ? "fill" : "regular"} />
                      )}
                      {isSaved ? "Đã lưu" : "Lưu"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
