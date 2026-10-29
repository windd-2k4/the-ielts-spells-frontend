"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Cards,
  Check,
  MagnifyingGlass,
  NotePencil,
  PencilSimple,
  Play,
  Plus,
  SpeakerHigh,
  SpinnerGap,
  X,
} from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  addVocabularyCard,
  createVocabularyTopic,
  getVocabularyNotebook,
  SaveVocabularyCardInput,
  updateVocabularyCard,
  updateVocabularyMastery,
  VocabularyCard,
  VocabularyMasteryStatus,
  VocabularyNotebook,
} from "./flashcardApi";
import styles from "./FlashcardNotebook.module.css";

const STATUS_COPY: Record<VocabularyMasteryStatus, string> = {
  NOT_LEARNED: "Chưa thuộc",
  FAMILIAR: "Nhớ sơ sơ",
  MASTERED: "Đã thuộc",
};

export function FlashcardNotebook() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studyTopicId = searchParams.get("study");
  const [notebook, setNotebook] = useState<VocabularyNotebook | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<VocabularyCard | null | undefined>(undefined);
  const [creatingTopic, setCreatingTopic] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const value = await getVocabularyNotebook();
      setNotebook(value);
      setActiveTopicId((current) => current && value.topics.some((topic) => topic.id === current)
        ? current
        : value.topics[0]?.id ?? null);
    } catch (failure) {
      setError(messageOf(failure));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const activeTopic = notebook?.topics.find((topic) => topic.id === activeTopicId) ?? null;
  const visibleCards = useMemo(() => {
    if (!notebook) return [];
    const needle = query.trim().toLocaleLowerCase("vi");
    return notebook.cards.filter((card) =>
      (!activeTopicId || card.topicId === activeTopicId) &&
      (!needle || [card.term, card.meaning, card.exampleSentence, card.note]
        .some((value) => value?.toLocaleLowerCase("vi").includes(needle))));
  }, [activeTopicId, notebook, query]);

  async function saveCard(input: SaveVocabularyCardInput) {
    if (editingCard) await updateVocabularyCard(editingCard.id, input);
    else await addVocabularyCard(input);
    setEditingCard(undefined);
    await load();
  }

  async function saveTopic(name: string) {
    const topic = await createVocabularyTopic(name);
    setCreatingTopic(false);
    await load();
    setActiveTopicId(topic.id);
  }

  function startStudy() {
    if (!activeTopicId || !visibleCards.length) return;
    router.push(`/student/flashcards?study=${activeTopicId}`);
  }

  if (loading) return <PageState icon={<SpinnerGap className={styles.spin} size={28} />} title="Đang mở sổ từ vựng" />;
  if (error || !notebook) return <PageState title="Không thể tải sổ từ vựng" description={error} action={<button type="button" onClick={() => void load()}>Thử lại</button>} />;

  if (studyTopicId) {
    const topic = notebook.topics.find((item) => item.id === studyTopicId);
    const cards = notebook.cards.filter((card) => card.topicId === studyTopicId);
    return <StudyMode
      topicName={topic?.name ?? "Sổ từ vựng"}
      cards={cards}
      onBack={() => router.replace("/student/flashcards")}
      onCardChange={(card) => setNotebook((current) => current ? replaceCard(current, card) : current)}
    />;
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <span className={styles.titleIcon}><Cards size={22} weight="duotone" /></span>
          <div>
            <h1>Sổ từ vựng</h1>
            <p>Lưu từ mới trong lúc luyện đề và ôn lại bằng flashcard.</p>
          </div>
        </div>
        <Summary notebook={notebook} />
      </header>

      <div className={styles.workspace}>
        <aside className={styles.topicRail}>
          <div className={styles.topicHeading}>
            <h2>Chủ đề của tôi</h2>
            <button
              type="button"
              onClick={() => setCreatingTopic(true)}
              aria-label="Tạo chủ đề"
              title="Thêm chủ đề mới"
            >
              <Plus size={16} weight="bold" />
            </button>
          </div>
          <div className={styles.topicList}>
            {notebook.topics.map((topic) => (
              <button
                type="button"
                key={topic.id}
                className={topic.id === activeTopicId ? styles.topicActive : styles.topicButton}
                onClick={() => setActiveTopicId(topic.id)}
              >
                <BookOpen size={18} weight={topic.id === activeTopicId ? "fill" : "regular"} />
                <span><strong>{topic.name}</strong><small>{topic.masteredCount}/{topic.cardCount} đã thuộc</small></span>
              </button>
            ))}
            {!notebook.topics.length && <p className={styles.railEmpty}>Tạo chủ đề đầu tiên để bắt đầu sổ từ.</p>}
          </div>
        </aside>

        <section className={styles.content}>
          <div className={styles.contentHead}>
            <div className={styles.topicTitleGroup}>
              <h2>{activeTopic?.name ?? "Tất cả từ"}</h2>
              <span className={styles.cardCountBadge}>{visibleCards.length} từ vựng</span>
            </div>
          </div>

          <div className={styles.toolbar}>
            <div className={styles.actionGroup}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={startStudy}
                disabled={!visibleCards.length}
              >
                <Play size={16} weight="fill" />
                Học với Flashcards
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setEditingCard(null)}
                disabled={!activeTopicId}
              >
                <Plus size={16} weight="bold" />
                Thêm từ vựng
              </button>
            </div>

            <label className={styles.search}>
              <MagnifyingGlass size={16} aria-hidden="true" />
              <span className={styles.srOnly}>Tìm từ vựng</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm từ, nghĩa hoặc ngữ cảnh..."
              />
              {query ? (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => setQuery("")}
                  aria-label="Xóa tìm kiếm"
                >
                  <X size={14} />
                </button>
              ) : null}
            </label>
          </div>

          {visibleCards.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Trạng thái</th>
                    <th>Từ vựng</th>
                    <th>Nghĩa</th>
                    <th>Ngữ cảnh</th>
                    <th>Ghi chú</th>
                    <th><span className={styles.srOnly}>Thao tác</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCards.map((card) => (
                    <VocabularyRow
                      key={card.id}
                      card={card}
                      onEdit={() => setEditingCard(card)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrap}>
                <Cards size={26} weight="duotone" />
              </div>
              <h3>{query ? "Không tìm thấy từ phù hợp" : "Chủ đề này chưa có từ vựng"}</h3>
              <p>
                {query
                  ? "Thử tìm kiếm với từ khóa ngắn hơn hoặc kiểm tra chính tả."
                  : "Bôi đen một từ trong bài Reading rồi chọn nút Flashcard, hoặc thêm thủ công tại đây."}
              </p>
              {!query && activeTopicId ? (
                <button
                  type="button"
                  className={styles.emptyAddBtn}
                  onClick={() => setEditingCard(null)}
                >
                  <Plus size={16} weight="bold" />
                  Thêm từ đầu tiên
                </button>
              ) : null}
            </div>
          )}
        </section>
      </div>

      {editingCard !== undefined ? <CardDialog
        card={editingCard}
        topics={notebook.topics}
        defaultTopicId={activeTopicId}
        onClose={() => setEditingCard(undefined)}
        onSave={saveCard}
      /> : null}
      {creatingTopic ? <TopicDialog onClose={() => setCreatingTopic(false)} onSave={saveTopic} /> : null}
    </div>
  );
}

function Summary({ notebook }: { notebook: VocabularyNotebook }) {
  const entries = [
    ["Tổng số từ", notebook.summary.total, styles.dotTotal],
    ["Chưa thuộc", notebook.summary.notLearned, styles.dotNeutral],
    ["Nhớ sơ sơ", notebook.summary.familiar, styles.dotFamiliar],
    ["Đã thuộc", notebook.summary.mastered, styles.dotMastered],
  ] as const;
  return (
    <div className={styles.summary}>
      {entries.map(([label, value, dot]) => (
        <div key={label} className={styles.summaryItem}>
          <span className={dot} />
          <div className={styles.summaryText}>
            <span className={styles.summaryLabel}>{label}</span>
            <strong className={styles.summaryValue}>{value}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

function VocabularyRow({ card, onEdit }: { card: VocabularyCard; onEdit: () => void }) {
  return <tr>
    <td><span className={`${styles.status} ${styles[`status${card.masteryStatus}`]}`}>{STATUS_COPY[card.masteryStatus]}</span></td>
    <td><div className={styles.term}><strong>{card.term}</strong><button type="button" onClick={() => speak(card.term)} aria-label={`Nghe từ ${card.term}`}><SpeakerHigh size={17} /></button>{card.partOfSpeech ? <small>{card.partOfSpeech}</small> : null}</div></td>
    <td>{card.meaning || <span className={styles.missing}>Chưa bổ sung</span>}</td>
    <td className={styles.context}>{card.exampleSentence || <span className={styles.missing}>Chưa có ngữ cảnh</span>}</td>
    <td>{card.note || <span className={styles.missing}>—</span>}</td>
    <td><button type="button" className={styles.editButton} onClick={onEdit} aria-label={`Sửa từ ${card.term}`}><PencilSimple size={17} /></button></td>
  </tr>;
}

function StudyMode({ topicName, cards, onBack, onCardChange }: {
  topicName: string;
  cards: VocabularyCard[];
  onBack: () => void;
  onCardChange: (card: VocabularyCard) => void;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const card = cards[index];

  useEffect(() => { setIndex(0); setFlipped(false); }, [topicName]);

  async function setMastery(status: VocabularyMasteryStatus) {
    if (!card || saving) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateVocabularyMastery(card.id, status);
      onCardChange(updated);
      setIndex((current) => cards.length ? (current + 1) % cards.length : 0);
      setFlipped(false);
    } catch (failure) {
      setError(messageOf(failure));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).matches("input, textarea, select, button")) return;
      if (event.code === "Space") { event.preventDefault(); setFlipped((value) => !value); }
      if (event.key === "ArrowLeft") { setIndex((value) => (value - 1 + cards.length) % cards.length); setFlipped(false); }
      if (event.key === "ArrowRight") { setIndex((value) => (value + 1) % cards.length); setFlipped(false); }
      if (event.key === "1") void setMastery("NOT_LEARNED");
      if (event.key === "2") void setMastery("FAMILIAR");
      if (event.key === "3") void setMastery("MASTERED");
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [card, cards.length, saving]);

  if (!card) return <PageState title="Chủ đề chưa có flashcard" description="Thêm ít nhất một từ trước khi bắt đầu học." action={<button type="button" onClick={onBack}>Quay lại sổ từ</button>} />;
  const move = (step: number) => { setIndex((value) => (value + step + cards.length) % cards.length); setFlipped(false); };

  return <div className={styles.studyPage}>
    <header className={styles.studyHead}>
      <button type="button" onClick={onBack}><ArrowLeft size={19} />{topicName}</button>
      <div className={styles.progress}><strong>{index + 1} / {cards.length}</strong><span><i style={{ width: `${((index + 1) / cards.length) * 100}%` }} /></span></div>
      <span />
    </header>

    <div className={styles.studyStage}>
      <button type="button" className={styles.arrowButton} onClick={() => move(-1)} aria-label="Thẻ trước"><ArrowLeft size={24} /></button>
      <button type="button" className={`${styles.flashcard} ${flipped ? styles.flashcardFlipped : ""}`} onClick={() => setFlipped((value) => !value)} aria-label={flipped ? "Ẩn nghĩa của từ" : "Xem nghĩa của từ"}>
        {!flipped ? <div className={styles.cardFront}>
          <span>Mặt trước</span>
          <h1>{card.term}</h1>
          {card.partOfSpeech ? <p>{card.partOfSpeech}</p> : null}
          <span className={styles.audioBadge} onClick={(event) => { event.stopPropagation(); speak(card.term); }}><SpeakerHigh size={21} /></span>
          <small>Nhấn Space hoặc chạm vào thẻ để xem nghĩa</small>
        </div> : <div className={styles.cardBack}>
          <div className={styles.cardWord}><div><span>{card.partOfSpeech || "Từ vựng"}</span><h1>{card.term}</h1></div><span className={styles.audioBadge} onClick={(event) => { event.stopPropagation(); speak(card.term); }}><SpeakerHigh size={21} /></span></div>
          <dl>
            <div><dt>Nghĩa</dt><dd>{card.meaning || "Chưa bổ sung nghĩa cho từ này."}</dd></div>
            <div><dt>Ngữ cảnh</dt><dd>{card.exampleSentence || "Chưa có câu ngữ cảnh."}</dd></div>
            {card.note ? <div><dt>Ghi chú</dt><dd>{card.note}</dd></div> : null}
          </dl>
          {card.sourceLabel ? <p className={styles.source}><BookOpen size={16} />{card.sourceLabel}</p> : null}
        </div>}
      </button>
      <button type="button" className={styles.arrowButton} onClick={() => move(1)} aria-label="Thẻ sau"><ArrowRight size={24} /></button>
    </div>

    <p className={styles.flipHint}>Nhấn Space để lật thẻ</p>
    {error ? <p className={styles.studyError} role="alert">{error}</p> : null}
    <div className={styles.masteryActions}>
      <button type="button" onClick={() => void setMastery("NOT_LEARNED")} disabled={saving}><kbd>1</kbd>Chưa thuộc</button>
      <button type="button" onClick={() => void setMastery("FAMILIAR")} disabled={saving}><kbd>2</kbd>Nhớ sơ sơ</button>
      <button type="button" className={styles.masteredButton} onClick={() => void setMastery("MASTERED")} disabled={saving}><kbd>3</kbd>{saving ? "Đang lưu" : "Đã thuộc"}</button>
    </div>
  </div>;
}

function CardDialog({ card, topics, defaultTopicId, onClose, onSave }: {
  card: VocabularyCard | null;
  topics: VocabularyNotebook["topics"];
  defaultTopicId: string | null;
  onClose: () => void;
  onSave: (input: SaveVocabularyCardInput) => Promise<void>;
}) {
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<SaveVocabularyCardInput>({
    topicId: card?.topicId ?? defaultTopicId,
    term: card?.term ?? "",
    meaning: card?.meaning ?? "",
    exampleSentence: card?.exampleSentence ?? "",
    partOfSpeech: card?.partOfSpeech ?? "",
    note: card?.note ?? "",
    sourceLabel: card?.sourceLabel ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { firstInputRef.current?.focus(); }, []);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try { await onSave(form); } catch (failure) { setError(messageOf(failure)); setSaving(false); }
  }

  return <div className={styles.modalBackdrop} onMouseDown={onClose}>
    <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="card-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
      <header><div><span>{card ? "CHỈNH SỬA FLASHCARD" : "FLASHCARD MỚI"}</span><h2 id="card-dialog-title">{card ? card.term : "Thêm từ vựng"}</h2></div><button type="button" onClick={onClose} aria-label="Đóng"><X size={20} /></button></header>
      <form onSubmit={submit}>
        <div className={styles.formGrid}>
          <label>Chủ đề<select value={form.topicId ?? ""} onChange={(event) => setForm({ ...form, topicId: event.target.value })} required>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label>
          <label>Từ loại<input value={form.partOfSpeech ?? ""} onChange={(event) => setForm({ ...form, partOfSpeech: event.target.value })} maxLength={80} placeholder="noun, verb, adjective..." /></label>
        </div>
        <label>Từ hoặc cụm từ<input ref={firstInputRef} value={form.term} onChange={(event) => setForm({ ...form, term: event.target.value })} maxLength={200} required /></label>
        <label>Nghĩa tiếng Việt<textarea value={form.meaning ?? ""} onChange={(event) => setForm({ ...form, meaning: event.target.value })} maxLength={1000} rows={2} placeholder="Nhập nghĩa ngắn gọn, dễ nhớ" /></label>
        <label>Ngữ cảnh<textarea value={form.exampleSentence ?? ""} onChange={(event) => setForm({ ...form, exampleSentence: event.target.value })} maxLength={2000} rows={3} placeholder="Câu chứa từ trong bài đọc hoặc ví dụ của bạn" /></label>
        <label>Ghi chú<input value={form.note ?? ""} onChange={(event) => setForm({ ...form, note: event.target.value })} maxLength={2000} placeholder="Collocation, cách dùng hoặc mẹo nhớ" /></label>
        {error ? <p className={styles.formError} role="alert">{error}</p> : null}
        <footer><button type="button" onClick={onClose}>Hủy</button><button type="submit" className={styles.primaryButton} disabled={saving || !form.term.trim()}>{saving ? <SpinnerGap className={styles.spin} size={17} /> : <Check size={17} />}Lưu flashcard</button></footer>
      </form>
    </section>
  </div>;
}

function TopicDialog({ onClose, onSave }: { onClose: () => void; onSave: (name: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try { await onSave(name); } catch (failure) { setError(messageOf(failure)); setSaving(false); }
  }
  return <div className={styles.modalBackdrop} onMouseDown={onClose}><section className={`${styles.modal} ${styles.topicModal}`} role="dialog" aria-modal="true" aria-labelledby="topic-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
    <header><div><span>CHỦ ĐỀ MỚI</span><h2 id="topic-dialog-title">Nhóm từ cần học</h2></div><button type="button" onClick={onClose} aria-label="Đóng"><X size={20} /></button></header>
    <form onSubmit={submit}><label>Tên chủ đề<input autoFocus value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Ví dụ: Environment" required /></label>{error ? <p className={styles.formError}>{error}</p> : null}<footer><button type="button" onClick={onClose}>Hủy</button><button type="submit" className={styles.primaryButton} disabled={saving || !name.trim()}>{saving ? <SpinnerGap className={styles.spin} size={17} /> : <Plus size={17} />}Tạo chủ đề</button></footer></form>
  </section></div>;
}

function PageState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return <div className={styles.pageState}>{icon}<h1>{title}</h1>{description ? <p>{description}</p> : null}{action}</div>;
}

function replaceCard(notebook: VocabularyNotebook, replacement: VocabularyCard): VocabularyNotebook {
  const cards = notebook.cards.map((card) => card.id === replacement.id ? replacement : card);
  const familiar = cards.filter((card) => card.masteryStatus === "FAMILIAR").length;
  const mastered = cards.filter((card) => card.masteryStatus === "MASTERED").length;
  return {
    ...notebook,
    cards,
    summary: { total: cards.length, familiar, mastered, notLearned: cards.length - familiar - mastered },
    topics: notebook.topics.map((topic) => ({
      ...topic,
      masteredCount: cards.filter((card) => card.topicId === topic.id && card.masteryStatus === "MASTERED").length,
    })),
  };
}

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-GB";
  window.speechSynthesis.speak(utterance);
}

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : "Không thể hoàn tất yêu cầu. Vui lòng thử lại.";
}
