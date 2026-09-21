"use client";

import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
import type { ReadingAnnotation, ReadingAnnotationColor, ReadingAnnotationType, SaveReadingAnnotationRequest } from "@ielts/contracts";
import { Check, Highlighter, NotePencil, PencilSimpleLine, Plus, SpinnerGap, Trash, WarningCircle, X } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deleteReadingAnnotation, saveReadingAnnotation } from "./readingApi";
import { requestMessage } from "./readingFormat";
import styles from "./ReadingAnnotations.module.css";

interface TextAnchor {
  startOffset: number;
  endOffset: number;
  selectedText: string;
  prefix: string;
  suffix: string;
}

interface ToolbarPosition {
  left: number;
  top: number;
}

interface ReadingAnnotationsProps {
  attemptId: string;
  sectionKey: string;
  html: string;
  contentClassName: string;
  annotations: ReadingAnnotation[];
  notesOpen: boolean;
  onNotesOpenChange: (open: boolean) => void;
  onAnnotationsChange: (annotations: ReadingAnnotation[]) => void;
}

const CONTEXT_LENGTH = 80;
const TOOLBAR_HALF_WIDTH = 210;

export function ReadingAnnotations({
  attemptId,
  sectionKey,
  html,
  contentClassName,
  annotations,
  notesOpen,
  onNotesOpenChange,
  onAnnotationsChange,
}: ReadingAnnotationsProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const noteInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [anchor, setAnchor] = useState<TextAnchor | null>(null);
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const sectionAnnotations = useMemo(
    () => annotations.filter((annotation) => annotation.sectionKey === sectionKey),
    [annotations, sectionKey],
  );

  useEffect(() => {
    setAnchor(null);
    setToolbarPosition(null);
    setNoteDraft("");
    setSelectedAnnotationId(null);
    setError("");
  }, [sectionKey]);

  useEffect(() => {
    if (notesOpen && anchor) window.setTimeout(() => noteInputRef.current?.focus(), 0);
  }, [anchor, notesOpen]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (toolbarPosition) {
        setToolbarPosition(null);
        setAnchor(null);
      } else if (notesOpen) {
        onNotesOpenChange(false);
      }
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [notesOpen, onNotesOpenChange, toolbarPosition]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    root.innerHTML = html;

    [...sectionAnnotations]
      .sort((left, right) => right.startOffset - left.startOffset)
      .forEach((annotation) => applyAnnotationMark(root, annotation));
  }, [html, sectionAnnotations]);

  const detectSelection = useCallback(() => {
    window.setTimeout(() => {
      const root = contentRef.current;
      const selection = window.getSelection();
      if (!root || !selection || selection.rangeCount === 0 || selection.isCollapsed) return;
      const range = selection.getRangeAt(0);
      if (!root.contains(range.commonAncestorContainer)) return;

      const text = root.textContent ?? "";
      const startRange = document.createRange();
      startRange.selectNodeContents(root);
      startRange.setEnd(range.startContainer, range.startOffset);
      const endRange = document.createRange();
      endRange.selectNodeContents(root);
      endRange.setEnd(range.endContainer, range.endOffset);
      const startOffset = startRange.toString().length;
      const endOffset = endRange.toString().length;
      const selectedText = text.slice(startOffset, endOffset);
      if (!selectedText.trim() || endOffset <= startOffset || selectedText.length > 5000) return;

      const rect = range.getBoundingClientRect();
      setAnchor({
        startOffset,
        endOffset,
        selectedText,
        prefix: text.slice(Math.max(0, startOffset - CONTEXT_LENGTH), startOffset),
        suffix: text.slice(endOffset, endOffset + CONTEXT_LENGTH),
      });
      setToolbarPosition({
        left: Math.min(window.innerWidth - TOOLBAR_HALF_WIDTH, Math.max(TOOLBAR_HALF_WIDTH, rect.left + rect.width / 2)),
        top: Math.max(64, rect.top - 12),
      });
      setError("");
    }, 0);
  }, []);

  function clearSelection() {
    window.getSelection()?.removeAllRanges();
    setToolbarPosition(null);
  }

  function overlapsExisting(candidate: TextAnchor) {
    return sectionAnnotations.some((annotation) =>
      candidate.startOffset < annotation.endOffset && candidate.endOffset > annotation.startOffset);
  }

  async function persistAnnotation(type: ReadingAnnotationType, color: ReadingAnnotationColor, note: string | null) {
    if (!anchor || saving) return;
    if (overlapsExisting(anchor)) {
      setError("Đoạn này đã có định dạng hoặc ghi chú. Hãy chọn một đoạn khác.");
      clearSelection();
      return;
    }
    setSaving(true);
    setError("");
    const annotationId = crypto.randomUUID();
    const pendingAnchor = anchor;
    const pendingNote = noteDraft;
    const request: SaveReadingAnnotationRequest = { sectionKey, type, color, ...pendingAnchor, note };
    const timestamp = new Date().toISOString();
    const optimistic: ReadingAnnotation = {
      id: annotationId,
      ...request,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    onAnnotationsChange([...annotations, optimistic]);
    setAnchor(null);
    clearSelection();
    try {
      const saved = await saveReadingAnnotation(attemptId, annotationId, request);
      onAnnotationsChange([...annotations, saved]);
      setNoteDraft("");
      setSelectedAnnotationId(saved.id);
      if (type === "NOTE") onNotesOpenChange(true);
    } catch (failure) {
      onAnnotationsChange(annotations);
      if (type === "NOTE") {
        setAnchor(pendingAnchor);
        setNoteDraft(pendingNote);
        onNotesOpenChange(true);
      }
      setError(requestMessage(failure));
    } finally {
      setSaving(false);
    }
  }

  async function removeAnnotation(annotationId: string) {
    if (deletingId) return;
    setDeletingId(annotationId);
    setError("");
    try {
      await deleteReadingAnnotation(attemptId, annotationId);
      onAnnotationsChange(annotations.filter((annotation) => annotation.id !== annotationId));
      if (selectedAnnotationId === annotationId) setSelectedAnnotationId(null);
      setConfirmDeleteId(null);
    } catch (failure) {
      setError(requestMessage(failure));
    } finally {
      setDeletingId(null);
    }
  }

  function beginNote() {
    clearSelection();
    setNoteDraft("");
    setSelectedAnnotationId(null);
    onNotesOpenChange(true);
  }

  function dismissSelection() {
    setAnchor(null);
    clearSelection();
  }

  function openAnnotationList() {
    dismissSelection();
    onNotesOpenChange(true);
  }

  function onContentClick(event: ReactMouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const mark = target.closest<HTMLElement>("mark[data-reading-annotation]");
    if (!mark) return;
    setSelectedAnnotationId(mark.dataset.readingAnnotation ?? null);
    setAnchor(null);
    setToolbarPosition(null);
    onNotesOpenChange(true);
  }

  function onContentKeyUp(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.shiftKey || event.key === "ContextMenu") detectSelection();
  }

  function focusAnnotation(annotationId: string) {
    const mark = contentRef.current?.querySelector<HTMLElement>(`mark[data-reading-annotation="${annotationId}"]`);
    mark?.scrollIntoView({ behavior: "smooth", block: "center" });
    mark?.focus({ preventScroll: true });
    setSelectedAnnotationId(annotationId);
  }

  return <>
    <div
      ref={contentRef}
      className={contentClassName}
      onMouseUp={detectSelection}
      onTouchEnd={detectSelection}
      onKeyUp={onContentKeyUp}
      onClick={onContentClick}
    />

    {toolbarPosition && anchor ? <div
      className={styles.selectionToolbar}
      style={{ left: toolbarPosition.left, top: toolbarPosition.top }}
      role="toolbar"
      aria-label="Công cụ cho đoạn văn đã chọn"
      onMouseDown={(event) => event.preventDefault()}
    >
      <button type="button" className={styles.toolButton} onClick={dismissSelection} disabled={saving} aria-label="Bỏ chọn đoạn văn" title="Bỏ chọn">
        <Trash size={18} weight="fill" aria-hidden="true" />
      </button>
      <button type="button" className={styles.toolButton} onClick={beginNote} disabled={saving} aria-label="Thêm ghi chú cho đoạn đã chọn" title="Thêm ghi chú">
        <PencilSimpleLine size={19} weight="bold" aria-hidden="true" />
      </button>
      <span className={styles.toolDivider} aria-hidden="true" />
      <ColorTool color="CYAN" label="Tô xanh dương" disabled={saving} onSelect={(color) => void persistAnnotation("HIGHLIGHT", color, null)} />
      <ColorTool color="PINK" label="Tô hồng" disabled={saving} onSelect={(color) => void persistAnnotation("HIGHLIGHT", color, null)} />
      <ColorTool color="GREEN" label="Tô xanh lá" disabled={saving} onSelect={(color) => void persistAnnotation("HIGHLIGHT", color, null)} />
      <ColorTool color="YELLOW" label="Tô vàng" disabled={saving} onSelect={(color) => void persistAnnotation("HIGHLIGHT", color, null)} />
      <button type="button" className={styles.textToolButton} onClick={() => void persistAnnotation("UNDERLINE", "RED", null)} disabled={saving} aria-label="Gạch chân đoạn đã chọn" title="Gạch chân">
        <span className={styles.underlineGlyph}>abc</span>
      </button>
      <button type="button" className={styles.textToolButton} onClick={() => void persistAnnotation("STRIKETHROUGH", "INK", null)} disabled={saving} aria-label="Gạch ngang đoạn đã chọn" title="Gạch ngang">
        <span className={styles.strikeGlyph}>abc</span>
      </button>
      <button type="button" className={styles.toolButton} onClick={openAnnotationList} disabled={saving} aria-label="Mở danh sách ghi chú" title="Mở danh sách ghi chú">
        {saving ? <SpinnerGap size={18} className={styles.spin} aria-hidden="true" /> : <Plus size={19} weight="bold" aria-hidden="true" />}
      </button>
    </div> : null}

    {error && !notesOpen ? <div className={styles.annotationToast} role="alert">
      <WarningCircle size={19} weight="fill" aria-hidden="true" />
      <span>{error}</span>
      <button type="button" onClick={() => setError("")} aria-label="Đóng thông báo"><X size={17} /></button>
    </div> : null}

    {notesOpen ? <>
      <button type="button" className={styles.drawerBackdrop} onClick={() => onNotesOpenChange(false)} aria-label="Đóng ngăn ghi chú" />
      <aside className={styles.notesDrawer} aria-label="Ghi chú và đoạn tô sáng">
        <header className={styles.drawerHeader}>
          <div>
            <span>CÔNG CỤ ĐỌC</span>
            <h2>Ghi chú &amp; tô sáng</h2>
          </div>
          <button type="button" onClick={() => onNotesOpenChange(false)} aria-label="Đóng ghi chú"><X size={21} /></button>
        </header>

        <div className={styles.drawerBody}>
          {error ? <div className={styles.annotationError} role="alert">{error}</div> : null}

          {anchor ? <section className={styles.noteComposer} aria-labelledby="new-note-title">
            <div className={styles.composerLabel}><NotePencil size={18} aria-hidden="true" /><strong id="new-note-title">Ghi chú mới</strong></div>
            <blockquote>{anchor.selectedText.trim()}</blockquote>
            <label htmlFor="reading-note-draft">Nội dung ghi chú</label>
            <textarea
              ref={noteInputRef}
              id="reading-note-draft"
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Ví dụ: Ý chính của đoạn, từ khóa cần đối chiếu..."
            />
            <div className={styles.composerFooter}>
              <span>{noteDraft.length}/2000</span>
              <button type="button" onClick={() => { setAnchor(null); setNoteDraft(""); }} disabled={saving}>Hủy</button>
              <button type="button" onClick={() => void persistAnnotation("NOTE", "YELLOW", noteDraft.trim())} disabled={saving || !noteDraft.trim()}>
                {saving ? <SpinnerGap size={17} className={styles.spin} /> : <Check size={17} />}
                Lưu ghi chú
              </button>
            </div>
          </section> : null}

          <div className={styles.annotationListHeading}>
            <strong>Passage hiện tại</strong>
            <span>{sectionAnnotations.length} mục</span>
          </div>

          {sectionAnnotations.length === 0 && !anchor ? <div className={styles.emptyNotes}>
            <Highlighter size={28} weight="duotone" aria-hidden="true" />
            <strong>Chưa có ghi chú</strong>
            <p>Bôi đen một đoạn trong bài đọc, sau đó chọn Ghi chú hoặc Tô sáng.</p>
          </div> : null}

          <div className={styles.annotationList}>
            {sectionAnnotations.map((annotation) => <article key={annotation.id} className={`${styles.annotationCard} ${selectedAnnotationId === annotation.id ? styles.annotationCardActive : ""}`}>
              <button type="button" className={styles.annotationSummary} onClick={() => focusAnnotation(annotation.id)}>
                <span className={`${styles.colorSwatch} ${colorClass(annotation.color)}`} aria-hidden="true" />
                <span>{annotationLabel(annotation.type)}</span>
              </button>
              <blockquote>{annotation.selectedText.trim()}</blockquote>
              {annotation.note ? <p>{annotation.note}</p> : null}
              <div className={styles.annotationActions}>
                {confirmDeleteId === annotation.id ? <>
                  <span>Xóa mục này?</span>
                  <button type="button" onClick={() => setConfirmDeleteId(null)} disabled={deletingId === annotation.id}>Giữ lại</button>
                  <button type="button" className={styles.deleteConfirm} onClick={() => void removeAnnotation(annotation.id)} disabled={deletingId === annotation.id}>
                    {deletingId === annotation.id ? <SpinnerGap size={15} className={styles.spin} /> : null} Xóa
                  </button>
                </> : <button type="button" onClick={() => setConfirmDeleteId(annotation.id)}><Trash size={16} />Xóa</button>}
              </div>
            </article>)}
          </div>
        </div>
      </aside>
    </> : null}
  </>;
}

function colorClass(color: ReadingAnnotationColor) {
  if (color === "CYAN") return styles.swatchCyan;
  if (color === "GREEN") return styles.swatchGreen;
  if (color === "PINK") return styles.swatchPink;
  if (color === "RED") return styles.swatchRed;
  if (color === "INK") return styles.swatchInk;
  return styles.swatchYellow;
}

function annotationLabel(type: ReadingAnnotationType) {
  if (type === "NOTE") return "Ghi chú";
  if (type === "UNDERLINE") return "Đã gạch chân";
  if (type === "STRIKETHROUGH") return "Đã gạch ngang";
  return "Đã tô sáng";
}

function ColorTool({
  color,
  label,
  disabled,
  onSelect,
}: {
  color: ReadingAnnotationColor;
  label: string;
  disabled: boolean;
  onSelect: (color: ReadingAnnotationColor) => void;
}) {
  return <button
    type="button"
    className={styles.colorToolButton}
    onClick={() => onSelect(color)}
    disabled={disabled}
    aria-label={label}
    title={label}
  ><span className={`${styles.toolbarSwatch} ${colorClass(color)}`} aria-hidden="true" /></button>;
}

function applyAnnotationMark(root: HTMLElement, annotation: ReadingAnnotation) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const segments: Array<{ node: Text; start: number; end: number }> = [];
  let position = 0;
  let current = walker.nextNode() as Text | null;
  while (current) {
    const nextPosition = position + current.data.length;
    const segmentStart = Math.max(annotation.startOffset, position);
    const segmentEnd = Math.min(annotation.endOffset, nextPosition);
    if (segmentStart < segmentEnd) {
      segments.push({ node: current, start: segmentStart - position, end: segmentEnd - position });
    }
    position = nextPosition;
    if (position >= annotation.endOffset) break;
    current = walker.nextNode() as Text | null;
  }

  segments.reverse().forEach((segment) => {
    const range = document.createRange();
    range.setStart(segment.node, segment.start);
    range.setEnd(segment.node, segment.end);
    const mark = document.createElement("mark");
    mark.dataset.readingAnnotation = annotation.id;
    mark.dataset.annotationType = annotation.type;
    mark.className = `${styles.annotationMark} ${colorClass(annotation.color)}`;
    mark.tabIndex = 0;
    mark.setAttribute("role", "button");
    const excerpt = annotation.selectedText.trim().slice(0, 120);
    mark.setAttribute("aria-label", `${annotationLabel(annotation.type)}: ${excerpt}`);
    try {
      range.surroundContents(mark);
    } catch {
      // Ignore one stale text segment without affecting the immutable passage.
    }
  });
}
