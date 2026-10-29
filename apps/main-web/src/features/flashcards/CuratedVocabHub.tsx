"use client";

import {
  Cards,
  MagnifyingGlass,
  Play,
  SpinnerGap,
  Sparkle,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import {
  CuratedDeckDetail,
  CuratedDeckSummary,
  CuratedStudySession,
  DeckCategory,
  getCuratedDeckDetail,
  getCuratedDecks,
  startCuratedStudySession,
} from "./curatedVocabApi";
import { CuratedDeckDetailView } from "./CuratedDeckDetailView";
import { CuratedStudySessionPlayer } from "./CuratedStudySessionPlayer";
import styles from "./CuratedVocab.module.css";

export function CuratedVocabHub() {
  const [decks, setDecks] = useState<CuratedDeckSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<DeckCategory | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Navigation states within Curated Hub
  const [activeDeckDetail, setActiveDeckDetail] = useState<CuratedDeckDetail | null>(null);
  const [activeSession, setActiveSession] = useState<CuratedStudySession | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  async function loadDecks() {
    setLoading(true);
    setError("");
    try {
      const data = await getCuratedDecks();
      setDecks(data);
    } catch (err: any) {
      setError(err?.message || "Không thể tải danh sách bộ từ vựng tuyển chọn");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDecks();
  }, []);

  async function handleOpenDeck(deckId: string) {
    setLoadingAction(deckId);
    try {
      const detail = await getCuratedDeckDetail(deckId);
      setActiveDeckDetail(detail);
    } catch (err: any) {
      alert("Không thể tải chi tiết bộ từ: " + (err?.message || "Lỗi mạng"));
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleStartSession(deckId: string) {
    setLoadingAction(deckId);
    try {
      const session = await startCuratedStudySession(deckId);
      setActiveSession(session);
    } catch (err: any) {
      alert("Không thể khởi tạo session: " + (err?.message || "Lỗi mạng"));
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleRefreshCurrentDeck() {
    if (!activeDeckDetail) return;
    try {
      const detail = await getCuratedDeckDetail(activeDeckDetail.deck.id);
      setActiveDeckDetail(detail);
      void loadDecks();
    } catch (e) {}
  }

  // Active Session Player
  if (activeSession) {
    return (
      <CuratedStudySessionPlayer
        deckId={activeSession.deckId}
        deckName={activeSession.deckName}
        items={activeSession.items}
        onBack={() => {
          setActiveSession(null);
          void loadDecks();
          if (activeDeckDetail) {
            void handleRefreshCurrentDeck();
          }
        }}
        onSessionComplete={() => {
          void handleStartSession(activeSession.deckId);
        }}
      />
    );
  }

  // Active Deck Detail View
  if (activeDeckDetail) {
    return (
      <CuratedDeckDetailView
        detail={activeDeckDetail}
        onBack={() => {
          setActiveDeckDetail(null);
          void loadDecks();
        }}
        onStartSession={() => void handleStartSession(activeDeckDetail.deck.id)}
        onRefresh={handleRefreshCurrentDeck}
      />
    );
  }

  const filteredDecks = decks.filter((deck) => {
    const matchCategory =
      selectedCategory === "ALL" || deck.category === selectedCategory;
    const matchSearch =
      !searchQuery.trim() ||
      deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className={styles.hubContainer}>
      {/* Category Pills & Search */}
      <div className={styles.toolbar}>
        <div className={styles.categoryFilters}>
          <button
            type="button"
            className={`${styles.filterPill} ${
              selectedCategory === "ALL" ? styles.filterPillActive : ""
            }`}
            onClick={() => setSelectedCategory("ALL")}
          >
            Tất cả bộ từ ({decks.length})
          </button>

          <button
            type="button"
            className={`${styles.filterPill} ${
              selectedCategory === "BASIC" ? styles.filterPillActive : ""
            }`}
            onClick={() => setSelectedCategory("BASIC")}
          >
            Basic (Cơ bản)
          </button>

          <button
            type="button"
            className={`${styles.filterPill} ${
              selectedCategory === "ADVANCED" ? styles.filterPillActive : ""
            }`}
            onClick={() => setSelectedCategory("ADVANCED")}
          >
            Advanced (Nâng cao)
          </button>

          <button
            type="button"
            className={`${styles.filterPill} ${
              selectedCategory === "INTENSIVE" ? styles.filterPillActive : ""
            }`}
            onClick={() => setSelectedCategory("INTENSIVE")}
          >
            Khóa chuyên sâu
          </button>
        </div>

        <div className={styles.searchBox}>
          <MagnifyingGlass size={16} color="#6f676c" />
          <input
            placeholder="Tìm theo chủ đề, từ khóa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#6f676c" }}>
          <SpinnerGap className="animate-spin" size={32} style={{ margin: "0 auto 12px" }} />
          <p>Đang tải kho từ vựng tuyển chọn...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#b91c1c" }}>
          <p>{error}</p>
          <button type="button" className={styles.btnView} onClick={() => void loadDecks()}>
            Thử lại
          </button>
        </div>
      ) : filteredDecks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#6f676c" }}>
          <p>Không tìm thấy bộ từ nào phù hợp với bộ lọc.</p>
        </div>
      ) : (
        <div className={styles.decksGrid}>
          {filteredDecks.map((deck) => {
            const isLoading = loadingAction === deck.id;
            const masteredPercent = deck.totalWords
              ? Math.round((deck.masteredCount / deck.totalWords) * 100)
              : 0;

            return (
              <div key={deck.id} className={styles.deckCard}>
                <div>
                  <div className={styles.deckCardTop}>
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
                    <span style={{ fontSize: "12px", color: "#8c8288", fontWeight: 600 }}>
                      {deck.totalWords} từ
                    </span>
                  </div>

                  <h3 className={styles.deckTitle}>{deck.name}</h3>
                  <p className={styles.deckDesc}>{deck.description}</p>
                </div>

                {/* Progress bar info */}
                <div className={styles.deckProgressBlock}>
                  <div className={styles.progressRingWrap}>
                    <svg width="44" height="44" viewBox="0 0 44 44">
                      <circle
                        cx="22"
                        cy="22"
                        r="18"
                        fill="none"
                        stroke="#e5e5ea"
                        strokeWidth="4"
                      />
                      <circle
                        cx="22"
                        cy="22"
                        r="18"
                        fill="none"
                        stroke="#c85f78"
                        strokeWidth="4"
                        strokeDasharray={113}
                        strokeDashoffset={113 - (113 * masteredPercent) / 100}
                        strokeLinecap="round"
                        transform="rotate(-90 22 22)"
                      />
                    </svg>
                    <span
                      style={{
                        position: "absolute",
                        fontSize: "11px",
                        fontWeight: 800,
                        color: "#292528",
                      }}
                    >
                      {masteredPercent}%
                    </span>
                  </div>

                  <div className={styles.progressDetails}>
                    <span className={styles.progressDetailTitle}>
                      {deck.masteredCount} / {deck.totalWords} từ dùng được
                    </span>
                    <span className={styles.progressDetailSub}>
                      {deck.familiarCount} từ cần xem lại • {deck.notLearnedCount} từ mới
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className={styles.deckActions}>
                  <button
                    type="button"
                    disabled={isLoading}
                    className={styles.btnStudy}
                    onClick={() => void handleStartSession(deck.id)}
                  >
                    {isLoading ? (
                      <SpinnerGap className="animate-spin" size={16} />
                    ) : (
                      <>
                        <Play size={15} weight="fill" />
                        Học tiếp 10 từ →
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    className={styles.btnView}
                    onClick={() => void handleOpenDeck(deck.id)}
                  >
                    Xem từ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
