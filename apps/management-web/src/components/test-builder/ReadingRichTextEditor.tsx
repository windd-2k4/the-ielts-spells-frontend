import {
  ArrowClockwise,
  ArrowCounterClockwise,
  CaretDown,
  Check,
  Eraser,
  GlobeHemisphereWest,
  Highlighter,
  ListBullets,
  ListNumbers,
  Paragraph,
  Quotes,
  TextAlignCenter,
  TextAlignJustify,
  TextAlignLeft,
  TextAlignRight,
  TextB,
  TextItalic,
  TextStrikethrough,
  TextUnderline,
  X,
} from "@phosphor-icons/react";
import type {
  ClipboardEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

type Props = {
  passageId: string;
  value: string;
  onChange: (html: string) => void;
  editorLabel?: string;
  placeholder?: string;
  minHeight?: number;
  insertHtmlRequest?: { id: number; html: string };
  /** Legacy single evidence reference. Prefer evidenceSpans for new drafts. */
  evidenceSpan?: ReadingEvidenceAnchor | null;
  /**
   * All evidence references for the question currently in focus.  This remains
   * deliberately structural so the editor can be used before every builder
   * and API contract has been migrated to the richer evidence type.
   */
  evidenceSpans?: ReadingEvidenceAnchor[];
  evidenceQuestionNo?: number;
  evidenceFocusRequest?: number;
  evidenceFocusId?: string | null;
  captureQuestionNo?: number;
  captureEvidenceLabel?: string;
  captureEvidenceMode?: EvidenceMode;
  onEvidenceCaptured?: (evidence: CapturedReadingEvidence) => void;
  onCancelEvidenceCapture?: () => void;
};

type EvidenceMode = "DIRECT_QUOTE" | "WHOLE_PARAGRAPH" | "NO_DIRECT_EVIDENCE";

/** Compatible with legacy `passageSpan` and the published evidence contract. */
type ReadingEvidenceAnchor = {
  id?: string | null;
  start?: number | null;
  end?: number | null;
  quote?: string | null;
  prefix?: string | null;
  suffix?: string | null;
  paragraphKey?: string | null;
  label?: string | null;
  mode?: EvidenceMode | null;
};

type CapturedReadingEvidence = {
  id: string;
  start: number;
  end: number;
  quote: string;
  prefix: string;
  suffix: string;
  paragraphKey: string | null;
  label: string | null;
  mode: EvidenceMode;
};

type EditorCommand =
  | "bold"
  | "italic"
  | "underline"
  | "strikeThrough"
  | "justifyLeft"
  | "justifyCenter"
  | "justifyRight"
  | "justifyFull"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "removeFormat"
  | "undo"
  | "redo";

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

const fontOptions = [
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Times New Roman, serif", label: "Times New Roman" },
  { value: "Outfit, sans-serif", label: "Outfit" },
  { value: "Inter, sans-serif", label: "Inter" },
  { value: "Merriweather, serif", label: "Merriweather" },
  { value: "monospace", label: "Monospace" },
];

const fontSizeOptions = [
  { value: "13px", label: "13px (Nhỏ)" },
  { value: "15px", label: "15px (Chuẩn)" },
  { value: "17px", label: "17px (Vừa)" },
  { value: "20px", label: "20px (Lớn)" },
  { value: "24px", label: "24px (H3)" },
  { value: "28px", label: "28px (H2)" },
];

const highlightOptions = [
  { color: "#fef08a", label: "Vàng" },
  { color: "#bbf7d0", label: "Xanh lá" },
  { color: "#bfdbfe", label: "Xanh dương" },
  { color: "#fbcfe8", label: "Hồng" },
  { color: "#e9d5ff", label: "Tím" },
  { color: "transparent", label: "Xóa màu" },
];

function ToolbarButton({ label, active = false, disabled = false, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      onMouseDown={(event: ReactMouseEvent<HTMLButtonElement>) => event.preventDefault()}
      onClick={onClick}
      className={`grid h-9 w-9 place-items-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]/35 disabled:cursor-not-allowed disabled:opacity-35 ${
        active
          ? "border-[#8f4458]/35 bg-[#f7e7ec] text-[#8f4458]"
          : "border-transparent text-[#40383c] hover:bg-[#f1eef4] hover:text-[#8f4458]"
      }`}
    >
      {children}
    </button>
  );
}

function isRangeInsideEditor(range: Range, editor: HTMLElement) {
  return editor.contains(range.commonAncestorContainer);
}

function normalizeEditorHtml(html: string) {
  const cleaned = removeInvisibleWordBreaks(html);
  const normalized = cleaned.trim();
  return normalized === "<br>" || normalized === "<div><br></div>" ? "" : cleaned;
}

function removeInvisibleWordBreaks(value: string) {
  return value
    .replace(/[\u00AD\u200B\u200C\u200D\u2060\uFEFF]/g, "")
    .replace(/[\u00A0\u202F]/g, " ")
    .replace(/&(?:shy|#173|#x0*ad|ZeroWidthSpace);/gi, "")
    .replace(/&(?:nbsp|#160|#x0*a0);/gi, " ");
}

function cleanTextNodes(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    current.textContent = removeInvisibleWordBreaks(current.textContent ?? "");
    current = walker.nextNode();
  }
}

function textOffsetAtNode(root: HTMLElement, target: Node, targetOffset: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let total = 0;
  let current = walker.nextNode();
  while (current) {
    if (current === target) return total + targetOffset;
    total += current.textContent?.length ?? 0;
    current = walker.nextNode();
  }
  return total;
}

function rangeFromTextOffsets(root: HTMLElement, start: number, end: number) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) return null;
  const range = document.createRange();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let total = 0;
  let startSet = false;
  let current = walker.nextNode();
  while (current) {
    const length = current.textContent?.length ?? 0;
    if (!startSet && start <= total + length) {
      range.setStart(current, Math.max(0, start - total));
      startSet = true;
    }
    if (startSet && end <= total + length) {
      range.setEnd(current, Math.max(0, end - total));
      return range;
    }
    total += length;
    current = walker.nextNode();
  }
  return null;
}

function normalizeEvidenceText(value: string) {
  return removeInvisibleWordBreaks(value)
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

function findAllOccurrences(source: string, value: string) {
  if (!value) return [];
  const matches: number[] = [];
  let cursor = source.indexOf(value);
  while (cursor >= 0) {
    matches.push(cursor);
    cursor = source.indexOf(value, cursor + Math.max(1, value.length));
  }
  return matches;
}

function longestContextMatch(left: string, right: string, fromEnd: boolean) {
  const maxLength = Math.min(left.length, right.length);
  let matchLength = 0;
  for (let length = 1; length <= maxLength; length += 1) {
    const a = fromEnd ? left.slice(-length) : left.slice(0, length);
    const b = fromEnd ? right.slice(-length) : right.slice(0, length);
    if (a !== b) break;
    matchLength = length;
  }
  return matchLength;
}

function resolveEvidenceOffsets(root: HTMLElement, evidence: ReadingEvidenceAnchor) {
  const recordedStart = evidence.start;
  const recordedEnd = evidence.end;
  if (typeof recordedStart !== "number" || typeof recordedEnd !== "number" || recordedEnd <= recordedStart) {
    return null;
  }

  const source = root.textContent ?? "";
  const quote = evidence.quote?.trim() ?? "";
  if (!quote) return { start: recordedStart, end: recordedEnd };

  const offsetQuote = source.slice(recordedStart, recordedEnd);
  if (normalizeEvidenceText(offsetQuote) === normalizeEvidenceText(quote)) {
    return { start: recordedStart, end: recordedEnd };
  }

  const sourceIndex = normalizedTextWithOffsets(source);
  const normalizedQuote = normalizeEvidenceText(quote);
  const normalizedPrefix = normalizeEvidenceText(evidence.prefix ?? "");
  const normalizedSuffix = normalizeEvidenceText(evidence.suffix ?? "");
  const candidates = findAllOccurrences(sourceIndex.normalized, normalizedQuote);
  if (!candidates.length) return null;

  const bestStart = candidates.reduce((best, candidate) => {
    const candidateEnd = candidate + normalizedQuote.length;
    const left = sourceIndex.normalized.slice(Math.max(0, candidate - normalizedPrefix.length), candidate);
    const right = sourceIndex.normalized.slice(candidateEnd, candidateEnd + normalizedSuffix.length);
    const bestEnd = best + normalizedQuote.length;
    const bestLeft = sourceIndex.normalized.slice(Math.max(0, best - normalizedPrefix.length), best);
    const bestRight = sourceIndex.normalized.slice(bestEnd, bestEnd + normalizedSuffix.length);

    const candidateScore = longestContextMatch(left, normalizedPrefix, true) * 3
      + longestContextMatch(right, normalizedSuffix, false) * 3
      - Math.min(Math.abs((sourceIndex.starts[candidate] ?? 0) - recordedStart) / 1000, 2);
    const bestScore = longestContextMatch(bestLeft, normalizedPrefix, true) * 3
      + longestContextMatch(bestRight, normalizedSuffix, false) * 3
      - Math.min(Math.abs((sourceIndex.starts[best] ?? 0) - recordedStart) / 1000, 2);
    return candidateScore > bestScore ? candidate : best;
  });

  const normalizedEnd = bestStart + normalizedQuote.length - 1;
  const start = sourceIndex.starts[bestStart];
  const end = sourceIndex.ends[normalizedEnd];
  return typeof start === "number" && typeof end === "number" && end > start ? { start, end } : null;
}

function paragraphKeyForRange(root: HTMLElement, range: Range) {
  const anchorElement = range.startContainer instanceof Element
    ? range.startContainer
    : range.startContainer.parentElement;
  const directKey = anchorElement?.closest<HTMLElement>("[data-reading-paragraph-key], [data-reading-paragraph-label]");
  const directValue = directKey?.dataset.readingParagraphKey ?? directKey?.dataset.readingParagraphLabel;
  if (directValue) return directValue;

  const start = textOffsetAtNode(root, range.startContainer, range.startOffset);
  let closestKey: string | null = null;
  let closestOffset = -1;
  root.querySelectorAll<HTMLElement>("[data-reading-paragraph-key], [data-reading-paragraph-label]").forEach((label) => {
    const firstText = label.firstChild;
    if (!firstText) return;
    const offset = textOffsetAtNode(root, firstText, 0);
    if (offset <= start && offset >= closestOffset) {
      closestOffset = offset;
      closestKey = label.dataset.readingParagraphKey ?? label.dataset.readingParagraphLabel ?? null;
    }
  });
  return closestKey;
}

function rangeForWholeParagraph(root: HTMLElement, evidence: ReadingEvidenceAnchor) {
  const paragraphKey = evidence.paragraphKey;
  if (!paragraphKey) return null;
  const anchor = Array.from(root.querySelectorAll<HTMLElement>("[data-reading-paragraph-key], [data-reading-paragraph-label]")).find((element) => (
    element.dataset.readingParagraphKey === paragraphKey || element.dataset.readingParagraphLabel === paragraphKey
  ));
  if (!anchor) return null;

  const labelContainer = anchor.closest("p, li, blockquote, div");
  const candidate = labelContainer?.nextElementSibling instanceof HTMLElement
    ? labelContainer.nextElementSibling
    : labelContainer ?? anchor;
  const range = document.createRange();
  range.selectNodeContents(candidate);
  return range;
}

function resolveEvidenceRange(root: HTMLElement, evidence: ReadingEvidenceAnchor) {
  if (evidence.mode === "NO_DIRECT_EVIDENCE") return null;
  const offsets = resolveEvidenceOffsets(root, evidence);
  if (offsets) return rangeFromTextOffsets(root, offsets.start, offsets.end);
  if (evidence.mode === "WHOLE_PARAGRAPH") return rangeForWholeParagraph(root, evidence);
  return null;
}

function createEvidenceId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `evidence-${crypto.randomUUID()}`;
  return `evidence-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function replaceLegacyFontElements(editor: HTMLElement, fontSize?: string) {
  editor.querySelectorAll("font").forEach((fontElement) => {
    const replacement = document.createElement("span");
    const face = fontElement.getAttribute("face");
    if (fontSize && fontElement.getAttribute("size") === "7") replacement.style.fontSize = fontSize;
    if (face) replacement.style.fontFamily = face;
    Array.from(fontElement.attributes).forEach((attribute) => {
      if (attribute.name !== "face" && attribute.name !== "size") {
        replacement.setAttribute(attribute.name, attribute.value);
      }
    });
    replacement.append(...Array.from(fontElement.childNodes));
    fontElement.replaceWith(replacement);
  });
}

function plainTextToHtml(text: string) {
  return removeInvisibleWordBreaks(text)
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>") || "<br>"}</p>`)
    .join("");
}

function sanitizePastedHtml(rawHtml: string) {
  const documentCopy = new DOMParser().parseFromString(rawHtml, "text/html");
  documentCopy.querySelectorAll("script, style, iframe, object, embed, form, input, button, meta, link").forEach((node) => node.remove());
  const allowedTags = new Set([
    "P", "BR", "DIV", "H2", "H3", "H4", "STRONG", "B", "EM", "I", "U", "S",
    "UL", "OL", "LI", "BLOCKQUOTE", "SPAN", "A", "SUB", "SUP",
  ]);

  Array.from(documentCopy.body.querySelectorAll("*")).forEach((element) => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    const originalHref = element.tagName === "A" ? element.getAttribute("href") : null;
    Array.from(element.attributes).forEach((attribute) => element.removeAttribute(attribute.name));
    if (element.tagName === "A") {
      if (originalHref && /^https?:\/\//i.test(originalHref)) {
        element.setAttribute("href", originalHref);
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noreferrer");
      }
    }
  });

  cleanTextNodes(documentCopy.body);

  return documentCopy.body.innerHTML;
}

export default function ReadingRichTextEditor({
  passageId,
  value,
  onChange,
  editorLabel = "Nội dung Reading Passage",
  placeholder = "Paste hoặc nhập nội dung Reading Passage tại đây...",
  minHeight = 600,
  insertHtmlRequest,
  evidenceSpan,
  evidenceSpans,
  evidenceQuestionNo,
  evidenceFocusRequest,
  evidenceFocusId,
  captureQuestionNo,
  captureEvidenceLabel,
  captureEvidenceMode,
  onEvidenceCaptured,
  onCancelEvidenceCapture,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const handledInsertRequestRef = useRef<number | null>(null);
  const [selectedFont, setSelectedFont] = useState("Georgia, serif");
  const [selectedFontSize, setSelectedFontSize] = useState("17px");
  const [activeCommands, setActiveCommands] = useState<Set<string>>(new Set());
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showParagraphLabels, setShowParagraphLabels] = useState(false);
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);
  const [pendingEvidence, setPendingEvidence] = useState<CapturedReadingEvidence | null>(null);
  const displayedEvidence = useMemo(
    () => evidenceSpans?.length ? evidenceSpans : evidenceSpan ? [evidenceSpan] : [],
    [evidenceSpan, evidenceSpans],
  );

  const syncContent = useCallback(() => {
    if (!editorRef.current) return;
    onChange(normalizeEditorHtml(editorRef.current.innerHTML));
  }, [onChange]);

  const rememberSelection = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!isRangeInsideEditor(range, editor)) return;
    savedRangeRef.current = range.cloneRange();

    const commands = [
      "bold", "italic", "underline", "strikeThrough", "justifyLeft", "justifyCenter",
      "justifyRight", "justifyFull", "insertUnorderedList", "insertOrderedList",
    ];
    setActiveCommands(new Set(commands.filter((command) => {
      try {
        return document.queryCommandState(command);
      } catch {
        return false;
      }
    })));

    const anchorElement = selection.anchorNode instanceof Element
      ? selection.anchorNode
      : selection.anchorNode?.parentElement;
    if (anchorElement && editor.contains(anchorElement)) {
      const computedStyle = window.getComputedStyle(anchorElement);
      const font = fontOptions.find((option) => {
        const primaryFamily = option.value.split(",")[0].replace(/["']/g, "").trim().toLowerCase();
        return computedStyle.fontFamily.toLowerCase().includes(primaryFamily);
      });
      const size = fontSizeOptions.find((option) => option.value === computedStyle.fontSize);
      if (font) setSelectedFont(font.value);
      if (size) setSelectedFontSize(size.value);
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return false;
    editor.focus();
    const selection = window.getSelection();
    if (!selection || !savedRangeRef.current) return false;
    selection.removeAllRanges();
    selection.addRange(savedRangeRef.current);
    return true;
  }, []);

  const runCommand = useCallback((command: EditorCommand, commandValue?: string) => {
    restoreSelection();
    document.execCommand(command, false, commandValue);
    rememberSelection();
    syncContent();
  }, [rememberSelection, restoreSelection, syncContent]);

  const applyFontFamily = useCallback((fontFamily: string) => {
    setSelectedFont(fontFamily);
    restoreSelection();
    document.execCommand("fontName", false, fontFamily);
    if (editorRef.current) replaceLegacyFontElements(editorRef.current);
    rememberSelection();
    syncContent();
  }, [rememberSelection, restoreSelection, syncContent]);

  const applyFontSize = useCallback((fontSize: string) => {
    setSelectedFontSize(fontSize);
    restoreSelection();
    document.execCommand("fontSize", false, "7");
    if (editorRef.current) replaceLegacyFontElements(editorRef.current, fontSize);
    rememberSelection();
    syncContent();
  }, [rememberSelection, restoreSelection, syncContent]);

  const insertHtml = useCallback((html: string) => {
    const restored = restoreSelection();
    if (!restored && editorRef.current) {
      editorRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    document.execCommand("insertHTML", false, html);
    rememberSelection();
    syncContent();
  }, [rememberSelection, restoreSelection, syncContent]);

  useEffect(() => {
    if (!insertHtmlRequest || handledInsertRequestRef.current === insertHtmlRequest.id) return;
    handledInsertRequestRef.current = insertHtmlRequest.id;
    insertHtml(insertHtmlRequest.html);
  }, [insertHtml, insertHtmlRequest]);

  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;
    const normalizedValue = removeInvisibleWordBreaks(value);
    if (editor.innerHTML !== normalizedValue) editor.innerHTML = normalizedValue;
  }, [passageId, value]);

  useEffect(() => {
    const handleSelectionChange = () => rememberSelection();
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [rememberSelection]);

  useEffect(() => {
    setPendingEvidence(null);
  }, [captureQuestionNo]);

  useEffect(() => {
    const editor = editorRef.current;
    const highlightRegistry = (CSS as unknown as {
      highlights?: { set: (name: string, value: unknown) => void; delete: (name: string) => void };
    }).highlights;
    const HighlightConstructor = (window as unknown as {
      Highlight?: new (...ranges: Range[]) => unknown;
    }).Highlight;
    const highlightName = "reading-answer-evidence";
    highlightRegistry?.delete(highlightName);
    if (!editor || !displayedEvidence.length || !highlightRegistry || !HighlightConstructor) return undefined;

    const resolved = displayedEvidence
      .map((evidence) => ({ evidence, range: resolveEvidenceRange(editor, evidence) }))
      .filter((item): item is { evidence: ReadingEvidenceAnchor; range: Range } => Boolean(item.range));
    if (!resolved.length) return undefined;

    // CSS Highlight API decorates the live editor without replacing DOM nodes or
    // collapsing the teacher's active text selection.
    highlightRegistry.set(highlightName, new HighlightConstructor(...resolved.map((item) => item.range)));
    if (evidenceFocusRequest) {
      const requested = evidenceFocusId
        ? resolved.find((item) => item.evidence.id === evidenceFocusId)
        : resolved[0];
      const element = requested?.range.startContainer.parentElement;
      window.requestAnimationFrame(() => element?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" }));
    }
    return () => highlightRegistry.delete(highlightName);
  }, [displayedEvidence, evidenceFocusId, evidenceFocusRequest, passageId, value]);

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const html = event.clipboardData.getData("text/html");
    const content = html
      ? sanitizePastedHtml(html)
      : plainTextToHtml(event.clipboardData.getData("text/plain"));
    insertHtml(content);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!(event.ctrlKey || event.metaKey) || !event.shiftKey) return;
    if (event.key === "7") {
      event.preventDefault();
      runCommand("insertOrderedList");
    }
    if (event.key === "8") {
      event.preventDefault();
      runCommand("insertUnorderedList");
    }
  }

  function handleMouseUp() {
    rememberSelection();
    if (!captureQuestionNo) return;
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setPendingEvidence(null);
      return;
    }
    let range = selection.getRangeAt(0);
    if (!isRangeInsideEditor(range, editor)) return;

    const mode: EvidenceMode = captureEvidenceMode === "WHOLE_PARAGRAPH"
      ? "WHOLE_PARAGRAPH"
      : "DIRECT_QUOTE";
    if (mode === "WHOLE_PARAGRAPH") {
      const anchorElement = range.startContainer instanceof Element
        ? range.startContainer
        : range.startContainer.parentElement;
      const paragraph = anchorElement?.closest("p, li, blockquote");
      if (paragraph && editor.contains(paragraph)) {
        const paragraphRange = document.createRange();
        paragraphRange.selectNodeContents(paragraph);
        range = paragraphRange;
      }
    }

    const rawStart = textOffsetAtNode(editor, range.startContainer, range.startOffset);
    const rawEnd = textOffsetAtNode(editor, range.endContainer, range.endOffset);
    const rawQuote = range.toString();
    const leadingWhitespace = rawQuote.length - rawQuote.trimStart().length;
    const trailingWhitespace = rawQuote.length - rawQuote.trimEnd().length;
    const start = rawStart + leadingWhitespace;
    const end = rawEnd - trailingWhitespace;
    const quote = rawQuote.trim();
    if (!quote || end <= start) {
      setPendingEvidence(null);
      return;
    }
    const editorText = editor.textContent ?? "";
    const contextLength = 56;
    setPendingEvidence({
      id: createEvidenceId(),
      start,
      end,
      quote,
      prefix: editorText.slice(Math.max(0, start - contextLength), start),
      suffix: editorText.slice(end, end + contextLength),
      paragraphKey: paragraphKeyForRange(editor, range),
      label: captureEvidenceLabel?.trim() || null,
      mode,
    });
  }

  return (
    <div className="min-w-0 space-y-3 overflow-x-hidden">
      <div
        role="toolbar"
        aria-label="Công cụ định dạng nội dung passage"
        className="sticky top-0 z-20 rounded-2xl border border-[#e3dce2] bg-white p-3 shadow-md"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <label className="sr-only" htmlFor={`passage-font-${passageId}`}>Phông chữ</label>
          <select
            id={`passage-font-${passageId}`}
            value={selectedFont}
            onMouseDown={rememberSelection}
            onChange={(event) => applyFontFamily(event.target.value)}
            className="h-9 max-w-[170px] rounded-lg border border-[#e3dce2] bg-[#F8F6FA] px-2 text-[11px] font-bold text-[#211A1D] focus:border-[#8f4458] focus:outline-none"
            title="Phông chữ"
          >
            {fontOptions.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
          </select>

          <label className="sr-only" htmlFor={`passage-font-size-${passageId}`}>Cỡ chữ</label>
          <select
            id={`passage-font-size-${passageId}`}
            value={selectedFontSize}
            onMouseDown={rememberSelection}
            onChange={(event) => applyFontSize(event.target.value)}
            className="h-9 max-w-[145px] rounded-lg border border-[#e3dce2] bg-[#F8F6FA] px-2 text-[11px] font-bold text-[#211A1D] focus:border-[#8f4458] focus:outline-none"
            title="Cỡ chữ"
          >
            {fontSizeOptions.map((size) => <option key={size.value} value={size.value}>{size.label}</option>)}
          </select>

          <span className="mx-1 h-5 w-px bg-[#e3dce2]" />
          <ToolbarButton label="In đậm (Ctrl+B)" active={activeCommands.has("bold")} onClick={() => runCommand("bold")}><TextB size={17} weight="bold" /></ToolbarButton>
          <ToolbarButton label="In nghiêng (Ctrl+I)" active={activeCommands.has("italic")} onClick={() => runCommand("italic")}><TextItalic size={17} weight="bold" /></ToolbarButton>
          <ToolbarButton label="Gạch chân (Ctrl+U)" active={activeCommands.has("underline")} onClick={() => runCommand("underline")}><TextUnderline size={17} weight="bold" /></ToolbarButton>
          <ToolbarButton label="Gạch ngang" active={activeCommands.has("strikeThrough")} onClick={() => runCommand("strikeThrough")}><TextStrikethrough size={17} weight="bold" /></ToolbarButton>

          <span className="mx-1 h-5 w-px bg-[#e3dce2]" />
          <ToolbarButton label="Căn trái" active={activeCommands.has("justifyLeft")} onClick={() => runCommand("justifyLeft")}><TextAlignLeft size={17} weight="bold" /></ToolbarButton>
          <ToolbarButton label="Căn giữa" active={activeCommands.has("justifyCenter")} onClick={() => runCommand("justifyCenter")}><TextAlignCenter size={17} weight="bold" /></ToolbarButton>
          <ToolbarButton label="Căn phải" active={activeCommands.has("justifyRight")} onClick={() => runCommand("justifyRight")}><TextAlignRight size={17} weight="bold" /></ToolbarButton>
          <ToolbarButton label="Căn đều hai bên" active={activeCommands.has("justifyFull")} onClick={() => runCommand("justifyFull")}><TextAlignJustify size={17} weight="bold" /></ToolbarButton>

          <span className="mx-1 h-5 w-px bg-[#e3dce2]" />
          <ToolbarButton label="Danh sách dấu chấm (Ctrl+Shift+8)" active={activeCommands.has("insertUnorderedList")} onClick={() => runCommand("insertUnorderedList")}><ListBullets size={17} weight="bold" /></ToolbarButton>
          <ToolbarButton label="Danh sách đánh số (Ctrl+Shift+7)" active={activeCommands.has("insertOrderedList")} onClick={() => runCommand("insertOrderedList")}><ListNumbers size={17} weight="bold" /></ToolbarButton>

          <span className="mx-1 h-5 w-px bg-[#e3dce2]" />
          <div className="relative">
            <button
              type="button"
              aria-expanded={showHighlightPicker}
              aria-haspopup="menu"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setShowHighlightPicker((current) => !current)}
              className="flex h-9 items-center gap-1 rounded-lg border border-transparent px-2 text-[#8f4458] transition hover:bg-[#f7e7ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]/35"
              title="Tô màu phần văn bản đã chọn"
            >
              <Highlighter size={17} weight="bold" />
              <CaretDown size={10} weight="bold" />
            </button>
            {showHighlightPicker && (
              <div role="menu" className="absolute left-0 top-full z-30 mt-1 flex items-center gap-1.5 rounded-xl border border-[#e3dce2] bg-white p-2 shadow-xl">
                {highlightOptions.map((highlight) => (
                  <button
                    key={highlight.color}
                    type="button"
                    role="menuitem"
                    aria-label={highlight.label}
                    title={highlight.label}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      restoreSelection();
                      document.execCommand("hiliteColor", false, highlight.color);
                      syncContent();
                      setShowHighlightPicker(false);
                    }}
                    style={{ backgroundColor: highlight.color === "transparent" ? "#ffffff" : highlight.color }}
                    className="h-8 w-8 rounded-lg border border-stone-300 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]/35"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              aria-expanded={showParagraphLabels}
              aria-haspopup="menu"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setShowParagraphLabels((current) => !current)}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-[#f7e7ec] px-2.5 text-xs font-bold text-[#8f4458] transition hover:bg-[#ead2da] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]/35"
              title="Chèn nhãn đoạn IELTS"
            >
              <Paragraph size={15} weight="bold" />
              <span>Đoạn A, B, C</span>
              <CaretDown size={10} weight="bold" />
            </button>
            {showParagraphLabels && (
              <div role="menu" className="absolute left-0 top-full z-30 mt-1 grid w-48 grid-cols-4 gap-1.5 rounded-xl border border-[#e3dce2] bg-white p-2.5 shadow-xl">
                {["A", "B", "C", "D", "E", "F", "G", "H"].map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    role="menuitem"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      insertHtml(`<p><strong data-reading-paragraph-label="${letter}" style="display:inline-block;padding:2px 8px;border:1px solid #e3dce2;border-radius:6px;background:#f7e7ec;color:#8f4458;letter-spacing:.08em">Paragraph ${letter}</strong></p><p><br></p>`);
                      setShowParagraphLabels(false);
                    }}
                    className="min-h-9 rounded-lg border border-[#e3dce2] bg-[#f8f6fa] text-xs font-extrabold text-[#8f4458] transition hover:bg-[#f7e7ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]/35"
                  >
                    {letter}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => insertHtml('<aside data-reading-callout="true" style="margin:16px 0;padding:14px 16px;border-left:4px solid #8f4458;border-radius:8px;background:#f7e7ec;color:#292528"><strong style="display:block;margin-bottom:4px;color:#8f4458">Lưu ý cho thí sinh</strong><p>Nhập nội dung lưu ý hoặc chú thích tại đây...</p></aside><p><br></p>')}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e3dce2] bg-[#F8F6FA] px-2.5 text-[11px] font-bold text-[#211A1D] transition hover:bg-[#f1eef4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]/35"
            title="Chèn khung chú thích cho thí sinh"
          >
            <Quotes size={15} weight="bold" />
            <span>Khung chú thích</span>
          </button>

          <span className="mx-1 h-5 w-px bg-[#e3dce2]" />
          <button
            type="button"
            aria-pressed={spellCheckEnabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setSpellCheckEnabled((current) => !current)}
            className={`flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]/35 ${
              spellCheckEnabled
                ? "border-[#8f4458]/30 bg-[#f7e7ec] text-[#8f4458]"
                : "border-[#e3dce2] bg-white text-[#746A6E] hover:bg-[#f1eef4]"
            }`}
            title={spellCheckEnabled ? "Đang kiểm tra chính tả theo English (UK)" : "Bật kiểm tra chính tả English (UK)"}
          >
            <GlobeHemisphereWest size={15} weight="bold" />
            <span>English {spellCheckEnabled ? "ON" : "OFF"}</span>
          </button>

          <span className="mx-1 h-5 w-px bg-[#e3dce2]" />
          <ToolbarButton label="Xóa định dạng" onClick={() => runCommand("removeFormat")}><Eraser size={17} weight="bold" /></ToolbarButton>
          <ToolbarButton label="Hoàn tác (Ctrl+Z)" onClick={() => runCommand("undo")}><ArrowCounterClockwise size={17} weight="bold" /></ToolbarButton>
          <ToolbarButton label="Làm lại (Ctrl+Y)" onClick={() => runCommand("redo")}><ArrowClockwise size={17} weight="bold" /></ToolbarButton>
        </div>
      </div>

      {captureQuestionNo && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm" role="status">
          <div className="min-w-0">
            <p className="text-xs font-extrabold">Đang gắn vị trí đáp án cho Câu {captureQuestionNo}</p>
            <p className="mt-0.5 text-[11px] leading-5 text-amber-900/80">
              {captureEvidenceMode === "WHOLE_PARAGRAPH"
                ? "Bôi một phần trong đoạn cần đối chiếu. Hệ thống sẽ lưu cả đoạn văn đó."
                : "Bôi đoạn văn chứa bằng chứng, sau đó xác nhận vị trí đã chọn."}
            </p>
            {pendingEvidence && (
              <p className="mt-1 max-w-2xl truncate text-[11px] font-semibold text-[#743447]">
                {pendingEvidence.mode === "WHOLE_PARAGRAPH" ? "Đoạn văn: " : "Trích dẫn: "}“{pendingEvidence.quote}”
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={onCancelEvidenceCapture}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 text-[11px] font-bold hover:bg-amber-100"
            >
              <X size={14} weight="bold" />
              Hủy
            </button>
            <button
              type="button"
              disabled={!pendingEvidence}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pendingEvidence && onEvidenceCaptured?.(pendingEvidence)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#8f4458] px-3 text-[11px] font-bold text-white hover:bg-[#743447] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check size={14} weight="bold" />
              Xác nhận vị trí
            </button>
          </div>
        </div>
      )}

      {!captureQuestionNo && displayedEvidence.length > 0 && evidenceQuestionNo && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-[11px] font-semibold text-emerald-900" role="status">
          <Highlighter size={15} weight="bold" />
          Đang hiển thị {displayedEvidence.length > 1 ? `${displayedEvidence.length} vị trí bằng chứng` : "vị trí bằng chứng"} của Câu {evidenceQuestionNo}.
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={editorLabel}
        aria-multiline="true"
        lang="en-GB"
        data-placeholder={placeholder}
        spellCheck={spellCheckEnabled}
        autoCorrect="off"
        autoCapitalize="sentences"
        onFocus={rememberSelection}
        onKeyUp={rememberSelection}
        onMouseUp={handleMouseUp}
        onInput={syncContent}
        onBlur={syncContent}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        style={{
          fontFamily: "Georgia, serif",
          fontSize: "17px",
          boxSizing: "border-box",
          maxWidth: "100%",
          overflowWrap: "anywhere",
          wordBreak: "normal",
          hyphens: "none",
          minHeight,
        }}
        className="reading-passage-editor prose w-full min-w-0 max-w-full overflow-x-hidden whitespace-normal rounded-2xl border border-stone-300 bg-white p-6 leading-[1.75] text-[#211A1D] outline-none shadow-sm empty:before:pointer-events-none empty:before:text-[#9a9095] empty:before:content-[attr(data-placeholder)] focus:border-[#8f4458] focus:ring-2 focus:ring-[#8f4458]/10 [&_a]:text-[#8f4458] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-[#c85f78] [&_blockquote]:pl-4 [&_ol]:list-decimal [&_ul]:list-disc"
      />
    </div>
  );
}
