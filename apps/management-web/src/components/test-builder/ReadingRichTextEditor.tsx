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
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type Props = {
  passageId: string;
  value: string;
  onChange: (html: string) => void;
  editorLabel?: string;
  placeholder?: string;
  minHeight?: number;
  insertHtmlRequest?: { id: number; html: string };
  evidenceSpan?: { start: number; end: number; quote?: string };
  evidenceQuestionNo?: number;
  evidenceFocusRequest?: number;
  captureQuestionNo?: number;
  onEvidenceCaptured?: (evidence: { start: number; end: number; quote: string }) => void;
  onCancelEvidenceCapture?: () => void;
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
  evidenceQuestionNo,
  evidenceFocusRequest,
  captureQuestionNo,
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
  const [pendingEvidence, setPendingEvidence] = useState<{ start: number; end: number; quote: string } | null>(null);

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
    if (!editor || !evidenceSpan || !highlightRegistry || !HighlightConstructor) return undefined;

    const editorText = editor.textContent ?? "";
    let start = evidenceSpan.start;
    let end = evidenceSpan.end;
    if (evidenceSpan.quote && editorText.slice(start, end) !== evidenceSpan.quote) {
      const recoveredStart = editorText.indexOf(evidenceSpan.quote);
      if (recoveredStart >= 0) {
        start = recoveredStart;
        end = recoveredStart + evidenceSpan.quote.length;
      }
    }
    const range = rangeFromTextOffsets(editor, start, end);
    if (!range) return undefined;
    highlightRegistry.set(highlightName, new HighlightConstructor(range));
    if (evidenceFocusRequest) {
      const element = range.startContainer.parentElement;
      window.requestAnimationFrame(() => element?.scrollIntoView({ behavior: "smooth", block: "center" }));
    }
    return () => highlightRegistry.delete(highlightName);
  }, [evidenceFocusRequest, evidenceSpan, passageId]);

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
    const range = selection.getRangeAt(0);
    if (!isRangeInsideEditor(range, editor)) return;
    const rawStart = textOffsetAtNode(editor, range.startContainer, range.startOffset);
    const rawEnd = textOffsetAtNode(editor, range.endContainer, range.endOffset);
    const rawQuote = removeInvisibleWordBreaks(range.toString());
    const leadingWhitespace = rawQuote.length - rawQuote.trimStart().length;
    const trailingWhitespace = rawQuote.length - rawQuote.trimEnd().length;
    const start = rawStart + leadingWhitespace;
    const end = rawEnd - trailingWhitespace;
    const quote = rawQuote.trim();
    if (!quote || end <= start) {
      setPendingEvidence(null);
      return;
    }
    setPendingEvidence({ start, end, quote });
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
              Bôi đoạn văn chứa bằng chứng, sau đó xác nhận vị trí đã chọn.
            </p>
            {pendingEvidence && (
              <p className="mt-1 max-w-2xl truncate text-[11px] font-semibold text-[#743447]">“{pendingEvidence.quote}”</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancelEvidenceCapture}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 text-[11px] font-bold hover:bg-amber-100"
            >
              <X size={14} weight="bold" />
              Hủy
            </button>
            <button
              type="button"
              disabled={!pendingEvidence}
              onClick={() => pendingEvidence && onEvidenceCaptured?.(pendingEvidence)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#8f4458] px-3 text-[11px] font-bold text-white hover:bg-[#743447] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check size={14} weight="bold" />
              Xác nhận vị trí
            </button>
          </div>
        </div>
      )}

      {!captureQuestionNo && evidenceSpan && evidenceQuestionNo && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-[11px] font-semibold text-emerald-900" role="status">
          <Highlighter size={15} weight="bold" />
          Đang hiển thị vị trí bằng chứng của Câu {evidenceQuestionNo}.
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
