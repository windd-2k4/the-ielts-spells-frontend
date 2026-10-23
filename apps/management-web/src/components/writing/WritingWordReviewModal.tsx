import {
  ArrowClockwise,
  ArrowCounterClockwise,
  Brain,
  ChatCircleDots,
  ChatTeardropText,
  Check,
  CheckCircle,
  CircleNotch,
  ClipboardText,
  Copy,
  FileText,
  FloppyDisk,
  Image as ImageIcon,
  PaperPlaneTilt,
  PencilSimpleLine,
  Scissors,
  SelectionAll,
  Sparkle,
  TextAlignCenter,
  TextAlignJustify,
  TextAlignLeft,
  TextAlignRight,
  TextB,
  TextItalic,
  TextStrikethrough,
  TextUnderline,
  ListBullets,
  ListNumbers,
  Eraser,
  Trash,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { Mark, mergeAttributes, type Editor } from "@tiptap/core";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AuthenticatedMediaImage from "../test-builder/AuthenticatedMediaImage";

const REVIEW_UI_SCALE = 0.9;

export type Criterion = {
  aiBand: number | null;
  teacherBand: number | null;
  aiFeedback: string | null;
  teacherFeedback?: string | null;
};

export type TeacherAnnotation = {
  id: string | null;
  start: number;
  end: number;
  selectedText: string | null;
  replacement: string | null;
  comment: string | null;
  criterion: string | null;
  kind: "COMMENT" | "REPLACE" | "HIGHLIGHT" | null;
  severity: "SUGGESTION" | "ERROR" | "MAJOR" | null;
  color?: string | null;
};

export type WritingEvaluation = {
  id: string;
  studentName: string;
  studentCode: string;
  testTitle: string;
  taskKey: string;
  taskType: string;
  essayText: string;
  attemptOrigin: "ASSIGNMENT" | "SELF_PRACTICE";
  courseCode: string | null;
  courseName: string | null;
  courseSkillPair: string | null;
  status: string;
  teacherStatus: string;
  overallBandAi: number | null;
  overallBandTeacher: number | null;
  criteria: Record<string, Criterion>;
  aiStrengths: string[];
  aiImprovements: string[];
  strengths: string[];
  improvements: string[];
  errorMessage: string | null;
  createdAt: string;
  teacherEditedText: string | null;
  teacherEditedHtml: string | null;
  teacherAnnotations: TeacherAnnotation[];
  teacherRevision: number;
  taskContext: {
    promptHtml?: string;
    imageUrl?: string;
    imageAssetId?: string;
    imageAltText?: string;
  };
};

export type WritingWordReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  evaluation: WritingEvaluation;
  prompt: string;
  editedText: string;
  setEditedText: (value: string) => void;
  editedHtml: string;
  setEditedHtml: (value: string) => void;
  annotations: TeacherAnnotation[];
  setAnnotations: React.Dispatch<React.SetStateAction<TeacherAnnotation[]>>;
  draftStatus: "saved" | "dirty" | "saving" | "error";
  overallBand: string;
  bands: Record<string, string>;
  setBands: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  feedback: Record<string, string>;
  setFeedback: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  strengths: string;
  setStrengths: (value: string) => void;
  improvements: string;
  setImprovements: (value: string) => void;
  gradingDirty: boolean;
  gradingComplete: boolean;
  missingCriteriaCount: number;
  saving: boolean;
  published: boolean;
  onSave: (publish: boolean) => Promise<void>;
};

const writingLabels: Record<string, string> = {
  task_achievement: "Task Achievement",
  task_response: "Task Response",
  coherence_cohesion: "Coherence & Cohesion",
  lexical_resource: "Lexical Resource",
  grammatical_range_accuracy: "Grammar Range & Accuracy",
};

const criterionColorMap: Record<string, { bg: string; text: string; border: string; highlight: string }> = {
  task_achievement: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", highlight: "#fef08a" },
  task_response: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", highlight: "#fef08a" },
  coherence_cohesion: { bg: "bg-sky-100", text: "text-sky-800", border: "border-sky-300", highlight: "#bae6fd" },
  lexical_resource: { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300", highlight: "#bbf7d0" },
  grammatical_range_accuracy: { bg: "bg-rose-100", text: "text-rose-800", border: "border-rose-300", highlight: "#fecdd3" },
};

const criterionMeta: Record<string, {
  name: string;
  shortName: string;
  desc: string;
  color: string;
  activeTabClass: string;
  borderClass: string;
  bgLightClass: string;
  textClass: string;
}> = {
  task_achievement: {
    name: "Task Achievement",
    shortName: "Task",
    desc: "Độ hoàn thành yêu cầu đề bài Task 1, số liệu và xu hướng chính",
    color: "#d97706",
    activeTabClass: "bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-400/50",
    borderClass: "border-amber-300",
    bgLightClass: "bg-amber-50/70",
    textClass: "text-amber-800",
  },
  task_response: {
    name: "Task Response",
    shortName: "Task",
    desc: "Trả lời đầy đủ câu hỏi Task 2, luận điểm và lập luận chặt chẽ",
    color: "#d97706",
    activeTabClass: "bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-400/50",
    borderClass: "border-amber-300",
    bgLightClass: "bg-amber-50/70",
    textClass: "text-amber-800",
  },
  coherence_cohesion: {
    name: "Coherence & Cohesion",
    shortName: "C&C",
    desc: "Bố cục mạch lạc, phân đoạn hợp lý và sử dụng liên từ tự nhiên",
    color: "#0284c7",
    activeTabClass: "bg-gradient-to-b from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/25 ring-2 ring-sky-400/50",
    borderClass: "border-sky-300",
    bgLightClass: "bg-sky-50/70",
    textClass: "text-sky-800",
  },
  lexical_resource: {
    name: "Lexical Resource",
    shortName: "Lexical",
    desc: "Vốn từ vựng học thuật, độ chuẩn xác ngữ cảnh, collocations và chính tả",
    color: "#059669",
    activeTabClass: "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/50",
    borderClass: "border-emerald-300",
    bgLightClass: "bg-emerald-50/70",
    textClass: "text-emerald-800",
  },
  grammatical_range_accuracy: {
    name: "Grammar Range & Accuracy",
    shortName: "Grammar",
    desc: "Độ đa dạng các cấu trúc câu phức/ghép và độ chính xác ngữ pháp",
    color: "#7c3aed",
    activeTabClass: "bg-gradient-to-b from-violet-500 to-violet-600 text-white shadow-md shadow-violet-500/25 ring-2 ring-violet-400/50",
    borderClass: "border-violet-300",
    bgLightClass: "bg-violet-50/70",
    textClass: "text-violet-800",
  },
};

const bandOptions = ["4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"];

const TeacherAnnotationMark = Mark.create({
  name: "teacherAnnotation",
  priority: 1_000,
  inclusive: false,
  addAttributes() {
    return {
      annotationId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-annotation-id"),
        renderHTML: (attributes) => attributes.annotationId
          ? { "data-annotation-id": attributes.annotationId }
          : {},
      },
      color: {
        default: "#fef08a",
        parseHTML: (element) => element.style.backgroundColor || "#fef08a",
        renderHTML: (attributes) => ({
          style: `background-color: ${attributes.color}; border-radius: 2px; padding: 0 1px`,
        }),
      },
    };
  },
  parseHTML() {
    return [
      { tag: "span[data-annotation-id]" },
      { tag: "mark[data-annotation-id]" },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

export function WritingWordReviewModal({
  isOpen,
  onClose,
  evaluation,
  prompt,
  editedText,
  setEditedText,
  editedHtml,
  setEditedHtml,
  annotations,
  setAnnotations,
  draftStatus,
  overallBand,
  bands,
  setBands,
  feedback,
  setFeedback,
  strengths,
  setStrengths,
  improvements,
  setImprovements,
  gradingDirty,
  gradingComplete,
  missingCriteriaCount,
  saving,
  published,
  onSave,
}: WritingWordReviewModalProps) {
  const [activeRibbonTab, setActiveRibbonTab] = useState<"home" | "review" | "grading" | "view">("home");
  const [showGradingPanel, setShowGradingPanel] = useState(false);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [showPromptDrawer, setShowPromptDrawer] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [fontFamily, setFontFamily] = useState("Calibri");
  const [fontSize, setFontSize] = useState("16");
  const [fontColor, setFontColor] = useState("#1e293b");
  const [highlightColor, setHighlightColor] = useState("#fef08a");

  // Criteria & Feedback Horizontal Tabs
  const [activeCriterionTab, setActiveCriterionTab] = useState<string>(
    evaluation.taskType === "task_2" ? "task_response" : "task_achievement"
  );
  const [activeFeedbackTab, setActiveFeedbackTab] = useState<"strengths" | "improvements">("strengths");

  // Selection & Annotation Modal state
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [annotationKind, setAnnotationKind] = useState<TeacherAnnotation["kind"]>("COMMENT");
  const [annotationCriterion, setAnnotationCriterion] = useState<string>(
    evaluation.taskType === "task_2" ? "task_response" : "task_achievement"
  );
  const [annotationSeverity, setAnnotationSeverity] = useState<TeacherAnnotation["severity"]>("SUGGESTION");
  const [annotationComment, setAnnotationComment] = useState("");
  const [annotationReplacement, setAnnotationReplacement] = useState("");
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);

  // Confirmation modals
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const selectedEditorRangeRef = useRef<{ from: number; to: number } | null>(null);
  const editedTextRef = useRef(editedText);
  const annotationsRef = useRef(annotations);
  const selectionUpdateRef = useRef<(editor: Editor) => void>(() => undefined);
  editedTextRef.current = editedText;
  annotationsRef.current = annotations;

  const criterionKeys = useMemo(
    () => [
      evaluation.taskType === "task_2" ? "task_response" : "task_achievement",
      "coherence_cohesion",
      "lexical_resource",
      "grammatical_range_accuracy",
    ],
    [evaluation.taskType]
  );
  const hasSavedGrading = evaluation.overallBandTeacher != null
    && criterionKeys.every((key) => evaluation.criteria[key]?.teacherBand != null);

  const syncEditorContent = useCallback((currentEditor: Editor) => {
    const fullText = editorPlainText(currentEditor);
    const fullHtml = persistableEditorHtml(currentEditor.getHTML());
    const currentAnnotations = annotationsRef.current;
    const rebasedAnnotations = rebaseAnnotations(editedTextRef.current, fullText, currentAnnotations);
    editedTextRef.current = fullText;
    if (rebasedAnnotations !== currentAnnotations) {
      annotationsRef.current = rebasedAnnotations;
      setAnnotations(rebasedAnnotations);
    }
    setEditedText(fullText);
    setEditedHtml(fullHtml);
  }, [setAnnotations, setEditedHtml, setEditedText]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, code: false, codeBlock: false, horizontalRule: false, link: false }),
      TextStyleKit,
      TextAlign.configure({ types: ["paragraph"] }),
      TeacherAnnotationMark,
    ],
    content: renderEditorHtml(editedText, editedHtml, annotations),
    editorProps: {
      attributes: {
        class: "min-h-[580px] rounded-sm text-slate-800 outline-none selection:bg-amber-200 selection:text-slate-900",
        "aria-label": "Soạn thảo bài viết của học viên tương tự Word",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor: currentEditor }) => syncEditorContent(currentEditor),
    onSelectionUpdate: ({ editor: currentEditor }) => selectionUpdateRef.current(currentEditor),
  }, [evaluation.id]);

  const captureEditorSelection = useCallback((currentEditor = editor) => {
    if (!currentEditor || currentEditor.state.selection.empty) {
      setSelectedText("");
      setSelectionRange(null);
      selectedEditorRangeRef.current = null;
      return false;
    }
    const { from, to } = currentEditor.state.selection;
    const value = normalizeEditorText(currentEditor.state.doc.textBetween(from, to, "\n", "\n"));
    const start = normalizeEditorText(currentEditor.state.doc.textBetween(0, from, "\n", "\n")).length;
    const end = start + value.length;
    if (!value || end <= start) return false;
    selectedEditorRangeRef.current = { from, to };
    setSelectedText(value);
    setSelectionRange({ start, end });
    const textStyle = currentEditor.getAttributes("textStyle");
    if (typeof textStyle.fontFamily === "string") setFontFamily(textStyle.fontFamily);
    if (typeof textStyle.fontSize === "string") setFontSize(textStyle.fontSize.replace("px", ""));
    if (typeof textStyle.color === "string") setFontColor(textStyle.color);
    if (typeof textStyle.backgroundColor === "string") setHighlightColor(textStyle.backgroundColor);
    return true;
  }, [editor]);
  selectionUpdateRef.current = (currentEditor) => captureEditorSelection(currentEditor);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const incomingHtml = editedHtml.trim() || plainTextToEditorHtml(editedText);
    if (persistableEditorHtml(editor.getHTML()) !== incomingHtml) {
      editor.commands.setContent(renderEditorHtml(editedText, editedHtml, annotationsRef.current), { emitUpdate: false });
    }
  }, [editor, editedHtml, editedText]);

  const executeHistoryCommand = (command: "undo" | "redo") => {
    if (!editor) return;
    if (command === "undo") editor.chain().focus().undo().run();
    else editor.chain().focus().redo().run();
  };

  const executeFormatCommand = (command: string, value?: string) => {
    if (!editor) return;
    switch (command) {
      case "bold": editor.chain().focus().toggleBold().run(); break;
      case "italic": editor.chain().focus().toggleItalic().run(); break;
      case "underline": editor.chain().focus().toggleUnderline().run(); break;
      case "strikeThrough": editor.chain().focus().toggleStrike().run(); break;
      case "fontName": if (value) editor.chain().focus().setFontFamily(value).run(); break;
      case "justifyLeft": editor.chain().focus().setTextAlign("left").run(); break;
      case "justifyCenter": editor.chain().focus().setTextAlign("center").run(); break;
      case "justifyRight": editor.chain().focus().setTextAlign("right").run(); break;
      case "justifyFull": editor.chain().focus().setTextAlign("justify").run(); break;
      case "insertUnorderedList": editor.chain().focus().toggleBulletList().run(); break;
      case "insertOrderedList": editor.chain().focus().toggleOrderedList().run(); break;
      case "removeFormat": editor.chain().focus().unsetAllMarks().run(); break;
    }
    captureEditorSelection(editor);
  };

  const applyColor = (kind: "text" | "highlight", value: string) => {
    if (!editor) return;
    if (kind === "text") editor.chain().focus().setColor(value).run();
    else editor.chain().focus().setBackgroundColor(value).run();
    captureEditorSelection(editor);
  };

  const applyFontSize = (value: string) => {
    setFontSize(value);
    editor?.chain().focus().setFontSize(`${value}px`).run();
    captureEditorSelection(editor);
  };

  const refreshEditorAnnotations = (values: TeacherAnnotation[]) => {
    if (!editor) return;
    const text = editorPlainText(editor);
    const html = persistableEditorHtml(editor.getHTML());
    editor.commands.setContent(renderEditorHtml(text, html, values), { emitUpdate: false });
  };

  const toggleCommentsPanel = () => {
    setShowCommentsPanel((current) => {
      const next = !current;
      if (next) setShowGradingPanel(false);
      return next;
    });
  };

  const toggleGradingPanel = () => {
    setShowGradingPanel((current) => {
      const next = !current;
      if (next) setShowCommentsPanel(false);
      return next;
    });
  };

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("click", close);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [contextMenu]);

  const handleEditorContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    captureEditorSelection(editor);
    const viewportWidth = window.innerWidth / REVIEW_UI_SCALE;
    const viewportHeight = window.innerHeight / REVIEW_UI_SCALE;
    setContextMenu({
      x: Math.max(8, Math.min(event.clientX / REVIEW_UI_SCALE, viewportWidth - 244)),
      y: Math.max(8, Math.min(event.clientY / REVIEW_UI_SCALE, viewportHeight - 330)),
    });
  };

  const copySelection = async (cut: boolean) => {
    if (!selectedText) return;
    try {
      await navigator.clipboard.writeText(selectedText);
    } catch {
      return;
    }
    if (cut) editor?.chain().focus().deleteSelection().run();
    if (cut) clearEditorSelectionState();
    setContextMenu(null);
  };

  const pastePlainText = async () => {
    if (!editor) return;
    try {
      const text = await navigator.clipboard.readText();
      editor.chain().focus().insertContent(text).run();
    } catch {
      editor.commands.focus();
    } finally {
      setContextMenu(null);
    }
  };

  const selectAllEditorText = () => {
    if (!editor) return;
    editor.chain().focus().selectAll().run();
    captureEditorSelection(editor);
    setContextMenu(null);
  };

  const deleteSelection = () => {
    if (!editor || editor.state.selection.empty) return;
    editor.chain().focus().deleteSelection().run();
    clearEditorSelectionState();
    setContextMenu(null);
  };

  function clearEditorSelectionState() {
    setSelectedText("");
    setSelectionRange(null);
    selectedEditorRangeRef.current = null;
  }

  // Open Annotation creator
  const openNewAnnotation = (kind: TeacherAnnotation["kind"] = "COMMENT") => {
    setAnnotationKind(kind);
    setAnnotationComment("");
    setAnnotationReplacement("");
    setEditingAnnotationId(null);
    setShowAnnotationModal(true);
  };

  // Save or Update Annotation
  const handleSaveAnnotation = () => {
    if (!selectedText.trim() && !editingAnnotationId) return;

    if (editingAnnotationId) {
      const next = annotationsRef.current.map((item) =>
        item.id === editingAnnotationId
          ? {
              ...item,
              kind: annotationKind,
              criterion: annotationCriterion || null,
              severity: annotationSeverity,
              comment: annotationComment.trim() || null,
              replacement: annotationKind === "REPLACE" ? annotationReplacement.trim() || null : null,
            }
          : item
      );
      annotationsRef.current = next;
      setAnnotations(next);
      refreshEditorAnnotations(next);
    } else {
      // Create new annotation
      const annotationId = crypto.randomUUID();
      const newAnnotation: TeacherAnnotation = {
        id: annotationId,
        start: selectionRange?.start ?? 0,
        end: selectionRange?.end ?? selectedText.length,
        selectedText: selectedText,
        replacement: annotationKind === "REPLACE" ? annotationReplacement.trim() || null : null,
        comment: annotationComment.trim() || null,
        criterion: annotationCriterion || null,
        kind: annotationKind,
        severity: annotationSeverity,
      };

      setAnnotations((current) => {
        const next = [...current, newAnnotation];
        annotationsRef.current = next;
        return next;
      });
      const editorRange = selectedEditorRangeRef.current;
      if (editor && editorRange) {
        const color = annotationKind === "REPLACE"
          ? "#fecdd3"
          : criterionColorMap[annotationCriterion]?.highlight ?? "#fef08a";
        editor.chain()
          .focus()
          .setTextSelection(editorRange)
          .setMark("teacherAnnotation", { annotationId, color })
          .run();
      }
    }

    setShowAnnotationModal(false);
    setEditingAnnotationId(null);
    setActiveRibbonTab("review");
    setShowCommentsPanel(true);
    setShowGradingPanel(false);
    clearEditorSelectionState();
  };

  // Delete annotation
  const handleDeleteAnnotation = (id: string | null) => {
    if (!id) return;
    const next = annotationsRef.current.filter((item) => item.id !== id);
    annotationsRef.current = next;
    setAnnotations(next);
    refreshEditorAnnotations(next);
  };

  // Reset to original student text
  const handleResetToOriginal = () => {
    setEditedText(evaluation.essayText);
    setEditedHtml(plainTextToEditorHtml(evaluation.essayText));
    setAnnotations([]);
    annotationsRef.current = [];
    editedTextRef.current = evaluation.essayText;
    editor?.commands.setContent(plainTextToEditorHtml(evaluation.essayText), { emitUpdate: false });
    setShowResetConfirm(false);
  };

  // Live word and char count
  const wordCount = useMemo(() => {
    return editedText.trim() ? editedText.trim().split(/\s+/).length : 0;
  }, [editedText]);

  const charCount = editedText.length;

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Trình soạn thảo và chấm bài Word cho giáo viên"
      className="fixed inset-0 z-50 flex flex-col bg-[#eef1f5] text-slate-800 antialiased"
      style={{
        transform: `scale(${REVIEW_UI_SCALE})`,
        transformOrigin: "top left",
        width: `${100 / REVIEW_UI_SCALE}%`,
        height: `${100 / REVIEW_UI_SCALE}%`,
      }}
    >
      {/* 1. TOP WINDOW BAR (Office 365 Blue Title Bar) */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#0f4b9c] bg-[#185abd] px-4 text-white shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          {/* Word document icon */}
          <div className="flex items-center gap-1.5 rounded bg-white/15 px-2.5 py-1 text-xs font-black tracking-wide text-white">
            <span className="flex size-5 items-center justify-center rounded-sm bg-white font-serif font-black text-[#185abd]">
              W
            </span>
            <span className="hidden sm:inline">WORD REVIEW</span>
          </div>

          <div className="h-4 w-px bg-white/25" />

          {/* Student & Essay info */}
          <div className="flex min-w-0 items-center gap-2 text-xs">
            <span className="max-w-40 truncate font-bold text-white/90">{evaluation.studentName}</span>
            <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/80">
              {evaluation.studentCode}
            </span>
            <span className="hidden text-white/70 md:inline">·</span>
            <span className="hidden max-w-[200px] truncate text-white/80 md:inline">
              {evaluation.testTitle}
            </span>
          </div>
        </div>

        {/* Center: Live Stats */}
        <div className="hidden items-center gap-4 text-xs font-semibold text-white/90 lg:flex">
          <span className="flex items-center gap-1.5 rounded-full bg-black/15 px-3 py-1">
            <FileText size={14} className="text-sky-200" />
            <strong>{wordCount}</strong> từ ({charCount} ký tự)
          </span>
          <span className="flex items-center gap-1.5" aria-live="polite">
            {draftStatus === "saving" ? (
              <span className="flex items-center gap-1 text-sky-200">
                <CircleNotch size={14} className="animate-spin" /> Nội dung đang lưu…
              </span>
            ) : draftStatus === "dirty" ? (
              <span className="flex items-center gap-1 text-amber-200">
                <WarningCircle size={14} /> Nội dung chưa lưu
              </span>
            ) : draftStatus === "error" ? (
              <span className="flex items-center gap-1 text-rose-300">
                <WarningCircle size={14} /> Lỗi lưu nội dung
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-200">
                <Check size={14} weight="bold" /> Nội dung đã lưu
              </span>
            )}
          </span>
          <span className={`flex items-center gap-1 ${gradingDirty ? "text-amber-200" : published || hasSavedGrading ? "text-emerald-200" : "text-white/65"}`} aria-live="polite">
            {gradingDirty ? <WarningCircle size={14} /> : hasSavedGrading || published ? <Check size={14} weight="bold" /> : null}
            {gradingDirty ? "Điểm chưa lưu" : published ? "Điểm đã công bố" : hasSavedGrading ? "Điểm đã lưu" : "Chưa lưu điểm"}
          </span>
        </div>

        {/* Right action controls */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Exit / Close */}
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-content-center rounded-lg text-white/80 hover:bg-white/20 hover:text-white transition"
            title="Đóng trình soạn thảo"
          >
            <X size={18} weight="bold" />
          </button>
        </div>
      </header>

      {/* 2. EDITOR ACTION BAR */}
      <div className="shrink-0 border-b border-slate-300 bg-white shadow-sm">
        <div className="flex items-end gap-1 border-b border-slate-200 bg-slate-50 px-4 pt-1" role="tablist" aria-label="Thanh ribbon">
          {([
            { key: "home", label: "Trang chủ" },
            { key: "review", label: `Nhận xét (${annotations.length})` },
            { key: "grading", label: "Chấm điểm" },
            { key: "view", label: "Xem" },
          ] as const).map((tab) => {
            const active = activeRibbonTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setActiveRibbonTab(tab.key);
                  if (tab.key === "home") { setShowCommentsPanel(false); setShowGradingPanel(false); }
                  if (tab.key === "review") { setShowCommentsPanel(annotations.length > 0); setShowGradingPanel(false); }
                  if (tab.key === "grading") { setShowGradingPanel(true); setShowCommentsPanel(false); }
                  if (tab.key === "view") { setShowCommentsPanel(false); setShowGradingPanel(false); }
                }}
                className={`h-8 rounded-t-md border-x border-t px-3 text-xs font-bold transition ${
                  active
                    ? "-mb-px border-slate-300 bg-white text-[#185abd]"
                    : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-x-2 overflow-x-auto whitespace-nowrap px-4 py-1.5 text-slate-700">
            <>
              <div className="flex items-center gap-0.5 border-r border-slate-200 pr-2">
                <RibbonIconButton label="Hoàn tác" shortcut="Ctrl+Z" onClick={() => executeHistoryCommand("undo")}><ArrowCounterClockwise size={16} /></RibbonIconButton>
                <RibbonIconButton label="Làm lại" shortcut="Ctrl+Y" onClick={() => executeHistoryCommand("redo")}><ArrowClockwise size={16} /></RibbonIconButton>
              </div>
              <div className="flex items-center gap-0.5 border-r border-slate-200 pr-2">
                <RibbonIconButton label="Cắt" shortcut="Ctrl+X" disabled={!selectedText} onClick={() => void copySelection(true)}><Scissors size={16} /></RibbonIconButton>
                <RibbonIconButton label="Sao chép" shortcut="Ctrl+C" disabled={!selectedText} onClick={() => void copySelection(false)}><Copy size={16} /></RibbonIconButton>
                <RibbonIconButton label="Dán văn bản" shortcut="Ctrl+V" onClick={() => void pastePlainText()}><ClipboardText size={16} /></RibbonIconButton>
                <RibbonIconButton label="Chọn tất cả" shortcut="Ctrl+A" onClick={selectAllEditorText}><SelectionAll size={16} /></RibbonIconButton>
              </div>
              <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
                <select
                  aria-label="Phông chữ"
                  value={fontFamily}
                  onChange={(event) => { setFontFamily(event.target.value); executeFormatCommand("fontName", event.target.value); }}
                  className="h-8 w-28 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold"
                >
                  <option value="Calibri">Calibri</option>
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times New Roman</option>
                </select>
                <select
                  aria-label="Cỡ chữ"
                  value={fontSize}
                  onChange={(event) => applyFontSize(event.target.value)}
                  className="h-8 w-16 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold"
                >
                  {[12, 14, 16, 18, 20, 24].map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                <RibbonIconButton label="Đậm" shortcut="Ctrl+B" onClick={() => executeFormatCommand("bold")}><TextB size={17} /></RibbonIconButton>
                <RibbonIconButton label="Nghiêng" shortcut="Ctrl+I" onClick={() => executeFormatCommand("italic")}><TextItalic size={17} /></RibbonIconButton>
                <RibbonIconButton label="Gạch chân" shortcut="Ctrl+U" onClick={() => executeFormatCommand("underline")}><TextUnderline size={17} /></RibbonIconButton>
                <RibbonIconButton label="Gạch ngang" onClick={() => executeFormatCommand("strikeThrough")}><TextStrikethrough size={17} /></RibbonIconButton>
                <div className="flex h-8 overflow-hidden rounded-md border border-slate-200 bg-white" title="Màu chữ">
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => applyColor("text", fontColor)}
                    aria-label="Áp dụng màu chữ"
                    className="relative grid w-7 place-items-center hover:bg-slate-100"
                  >
                    <span className="text-sm font-black" style={{ color: fontColor }}>A</span>
                    <span className="absolute bottom-1 h-0.5 w-4" style={{ backgroundColor: fontColor }} />
                  </button>
                  <label className="relative w-3 cursor-pointer border-l border-slate-200 bg-slate-50" title="Chọn màu chữ">
                    <input
                      type="color"
                      aria-label="Chọn màu chữ"
                      value={fontColor}
                      onChange={(event) => {
                        setFontColor(event.target.value);
                        applyColor("text", event.target.value);
                      }}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </label>
                </div>
                <div className="flex h-8 overflow-hidden rounded-md border border-slate-200 bg-white" title="Màu tô sáng">
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => applyColor("highlight", highlightColor)}
                    aria-label="Áp dụng màu tô sáng"
                    className="grid w-8 place-items-center hover:bg-slate-100"
                  >
                    <span className="rounded px-1 text-xs font-black" style={{ backgroundColor: highlightColor }}>ab</span>
                  </button>
                  <label className="relative w-3 cursor-pointer border-l border-slate-200 bg-slate-50" title="Chọn màu tô sáng">
                    <input
                      type="color"
                      aria-label="Chọn màu tô sáng"
                      value={highlightColor}
                      onChange={(event) => {
                        setHighlightColor(event.target.value);
                        applyColor("highlight", event.target.value);
                      }}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-0.5 border-r border-slate-200 pr-2">
                <RibbonIconButton label="Căn trái" onClick={() => executeFormatCommand("justifyLeft")}><TextAlignLeft size={17} /></RibbonIconButton>
                <RibbonIconButton label="Căn giữa" onClick={() => executeFormatCommand("justifyCenter")}><TextAlignCenter size={17} /></RibbonIconButton>
                <RibbonIconButton label="Căn phải" onClick={() => executeFormatCommand("justifyRight")}><TextAlignRight size={17} /></RibbonIconButton>
                <RibbonIconButton label="Căn đều" onClick={() => executeFormatCommand("justifyFull")}><TextAlignJustify size={17} /></RibbonIconButton>
                <RibbonIconButton label="Danh sách chấm" onClick={() => executeFormatCommand("insertUnorderedList")}><ListBullets size={17} /></RibbonIconButton>
                <RibbonIconButton label="Danh sách số" onClick={() => executeFormatCommand("insertOrderedList")}><ListNumbers size={17} /></RibbonIconButton>
                <RibbonIconButton label="Xóa định dạng" onClick={() => executeFormatCommand("removeFormat")}><Eraser size={17} /></RibbonIconButton>
              </div>
              <button type="button" onClick={() => setShowResetConfirm(true)} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700">
                <ArrowCounterClockwise size={15} /> Khôi phục bản gốc
              </button>
            </>
          {activeRibbonTab === "review" ? (
            <>
              <button type="button" disabled={!selectedText.trim()} onClick={() => openNewAnnotation("COMMENT")} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 text-xs font-bold text-amber-700 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40">
                <ChatTeardropText size={16} weight="bold" /> Gắn nhận xét
              </button>
              <button type="button" disabled={!selectedText.trim()} onClick={() => openNewAnnotation("REPLACE")} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40">
                <PencilSimpleLine size={16} weight="bold" /> Đề xuất sửa
              </button>
              <button type="button" onClick={toggleCommentsPanel} aria-pressed={showCommentsPanel} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50">
                <ChatCircleDots size={16} /> {showCommentsPanel ? "Ẩn danh sách" : "Hiện danh sách"}
              </button>
              <span className="ml-auto text-[11px] font-medium text-slate-500">Bôi chọn nội dung trước khi nhận xét.</span>
            </>
          ) : activeRibbonTab === "grading" ? (
            <>
              <button type="button" onClick={toggleGradingPanel} aria-pressed={showGradingPanel} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#185abd]/10 px-3 text-xs font-bold text-[#185abd] hover:bg-[#185abd]/15">
                <Brain size={16} /> {showGradingPanel ? "Ẩn bảng điểm" : "Mở bảng điểm"}
              </button>
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${gradingComplete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {gradingComplete ? "Đủ 4/4 tiêu chí" : `Còn thiếu ${missingCriteriaCount}/4 tiêu chí`}
              </span>
              <span className="ml-auto text-[11px] font-medium text-slate-500">Lưu và công bố tại cuối bảng điểm.</span>
            </>
          ) : activeRibbonTab === "view" ? (
            <>
              <button type="button" onClick={() => setShowPromptDrawer((current) => !current)} aria-pressed={showPromptDrawer} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50">
                <ImageIcon size={16} /> {showPromptDrawer ? "Thu gọn đề bài" : "Mở đề bài"}
              </button>
              {[90, 100, 110].map((value) => (
                <button key={value} type="button" onClick={() => setZoomLevel(value)} className={`h-8 rounded-md px-2 text-xs font-bold ${zoomLevel === value ? "bg-[#185abd] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{value}%</button>
              ))}
              <span className="ml-auto text-[11px] font-medium text-slate-500">Công cụ xem tài liệu.</span>
            </>
          ) : <span className="ml-auto text-[11px] font-medium text-emerald-700">Định dạng được tự lưu cùng nội dung.</span>}
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: DOCUMENT CANVAS + MARGIN COMMENTS + GRADING SIDEBAR */}
      <div className="relative flex flex-1 min-h-0 overflow-hidden">
        {showPromptDrawer ? (
          <aside className="flex w-[clamp(260px,18vw,320px)] shrink-0 flex-col border-r border-slate-300 bg-white">
            <header className="flex h-11 shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-4">
              <div className="flex min-w-0 items-center gap-2">
                <span className="rounded bg-[#185abd] px-2 py-0.5 text-[10px] font-black text-white">TASK</span>
                <strong className="truncate text-xs text-slate-800">Đề bài &amp; biểu đồ</strong>
              </div>
              <button
                type="button"
                onClick={() => setShowPromptDrawer(false)}
                className="grid size-7 place-content-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                aria-label="Thu gọn đề bài"
                title="Thu gọn đề bài"
              >
                <X size={15} />
              </button>
            </header>
            <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
              <section>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Nội dung đề bài</span>
                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium italic leading-relaxed text-slate-800">
                  {prompt}
                </div>
              </section>
              {evaluation.taskContext.imageUrl ? (
                <section>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Biểu đồ / sơ đồ Task 1</span>
                  <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                    <AuthenticatedMediaImage
                      fileUrl={evaluation.taskContext.imageUrl}
                      alt={evaluation.taskContext.imageAltText || "Biểu đồ IELTS Writing"}
                      className="mx-auto max-h-[390px] w-auto object-contain"
                    />
                  </div>
                </section>
              ) : null}
            </div>
          </aside>
        ) : (
          <button
            type="button"
            onClick={() => setShowPromptDrawer(true)}
            className="flex w-10 shrink-0 flex-col items-center gap-2 border-r border-slate-300 bg-white py-3 text-[#185abd] hover:bg-sky-50"
            aria-label="Mở đề bài"
            title="Mở đề bài"
          >
            <ImageIcon size={17} />
            <span className="text-[10px] font-black [writing-mode:vertical-rl]">ĐỀ BÀI</span>
          </button>
        )}
        {/* Left / Center Document Paper Area */}
        <main
          className="custom-scrollbar min-w-0 flex-1 overflow-y-auto px-4 py-8"
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease",
          }}
        >
          {/* Word Ruler */}
          <div className="mx-auto mb-3 max-w-[840px]">
            <div className="relative flex h-5 w-full items-center rounded border border-slate-300 bg-slate-200 px-12 text-[9px] font-mono font-semibold text-slate-500 select-none shadow-inner">
              <div className="flex w-full justify-between">
                {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18].map((cm) => (
                  <span key={cm} className="relative">
                    | {cm}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* A4 Sheet Paper Container */}
          <div className="mx-auto max-w-[840px] rounded-sm border border-slate-300 bg-white p-12 sm:p-16 shadow-[0_10px_35px_rgba(0,0,0,0.12)]">
            {/* Document Header Line (Like Word Header) */}
            <header className="mb-8 border-b-2 border-slate-200 pb-4 text-xs select-none">
              <div className="flex items-center justify-between text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                <span>THE IELTS SPELLS · ASSESSMENT &amp; CORRECTION</span>
                <span>IELTS WRITING {evaluation.taskType === "task_2" ? "TASK 2" : "TASK 1"}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h1 className="text-base font-extrabold text-slate-900">{evaluation.studentName}</h1>
                  <p className="text-slate-500 text-[11px]">
                    Mã học viên: <strong className="text-slate-700">{evaluation.studentCode}</strong> · Đề:{" "}
                    <span className="italic">{evaluation.testTitle}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-md bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700 border border-amber-200">
                    Bản sửa trực tiếp của Giáo viên
                  </span>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Ngày nộp: {new Date(evaluation.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
            </header>

            {/* Tiptap / ProseMirror document surface */}
            <div
              onContextMenu={handleEditorContextMenu}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.altKey && event.key.toLowerCase() === "m") {
                  event.preventDefault();
                  if (captureEditorSelection(editor)) {
                    setActiveRibbonTab("review");
                    setShowCommentsPanel(true);
                    setShowGradingPanel(false);
                    openNewAnnotation("COMMENT");
                  }
                }
              }}
              style={{
                fontFamily: "Calibri, Arial, sans-serif",
                fontSize: "16px",
                lineHeight: "1.65",
              }}
              className="rounded-sm [&_.ProseMirror]:min-h-[580px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:focus-visible:ring-2 [&_.ProseMirror]:focus-visible:ring-[#185abd]/35 [&_.ProseMirror_p]:m-0 [&_.ProseMirror_p+p]:mt-3 [&_.ProseMirror_ul]:mb-3 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-7 [&_.ProseMirror_ol]:mb-3 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-7 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-slate-300 [&_.ProseMirror_blockquote]:pl-4"
            >
              <EditorContent editor={editor} />
            </div>

            {/* Document Footer (Word footer) */}
            <footer className="mt-16 border-t border-slate-200 pt-4 text-center text-xs text-slate-400 select-none">
              <p className="text-[11px]">
                Trang 1 / 1 · IELTS Spells Writing Evaluation Studio · Giáo viên chấm và phê duyệt
              </p>
            </footer>
          </div>
        </main>

        {/* MARGIN COMMENTS PANEL */}
        {showCommentsPanel && (
        <aside className="flex w-[clamp(260px,20vw,320px)] shrink-0 flex-col border-l border-slate-300 bg-white shadow-sm">
          <div className="flex h-11 items-center justify-between border-b border-slate-200 px-4 bg-slate-50 select-none">
            <span className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
              <ChatTeardropText size={16} className="text-[#185abd]" />
              Nhận xét bên lề ({annotations.length})
            </span>
            <button
              type="button"
              onClick={() => setShowCommentsPanel(false)}
              className="grid size-7 place-content-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              aria-label="Đóng danh sách nhận xét"
              title="Đóng danh sách nhận xét"
            >
              <X size={15} />
            </button>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto p-3 space-y-3">
            {annotations.length === 0 ? (
              <div className="py-12 px-4 text-center text-slate-400">
                <ChatCircleDots size={36} className="mx-auto mb-2 opacity-40 text-[#185abd]" />
                <p className="text-xs font-semibold">Chưa có nhận xét nào trong bài</p>
                <p className="mt-1 text-[11px] leading-relaxed">
                  Bôi đen bất kỳ từ hoặc câu nào trong trang giấy, sau đó bấm <strong>Gắn nhận xét</strong> hoặc{" "}
                  <strong>Đề xuất sửa</strong> để tạo bản ghi chú.
                </p>
              </div>
            ) : (
              annotations.map((item, idx) => {
                const colorConfig =
                  item.criterion && criterionColorMap[item.criterion]
                    ? criterionColorMap[item.criterion]
                    : { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" };

                const isSelected = activeAnnotationId === item.id;

                return (
                  <article
                    key={item.id ?? `${idx}-${item.start}`}
                    onClick={() => setActiveAnnotationId(item.id)}
                    className={`group relative rounded-xl border p-3 text-xs transition shadow-sm ${
                      isSelected
                        ? "border-[#185abd] ring-2 ring-[#185abd]/25 bg-sky-50/40"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow"
                    }`}
                  >
                    {/* Header: Author + Criterion */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="size-5 rounded-full bg-[#185abd] text-white flex items-center justify-center font-bold text-[10px]">
                          GV
                        </span>
                        <span className="font-bold text-slate-800 text-[11px]">Giáo viên</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {item.criterion && (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold ${colorConfig.bg} ${colorConfig.text}`}
                          >
                            {writingLabels[item.criterion] ?? item.criterion}
                          </span>
                        )}
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                            item.severity === "MAJOR"
                              ? "bg-rose-100 text-rose-700"
                              : item.severity === "ERROR"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {item.severity === "MAJOR" ? "Lỗi nặng" : item.severity === "ERROR" ? "Lỗi" : "Gợi ý"}
                        </span>
                      </div>
                    </div>

                    {/* Quoted Text */}
                    <p className="rounded bg-slate-50 border-l-2 border-[#185abd] px-2 py-1 text-[11px] italic text-slate-600 line-clamp-2">
                      “{item.selectedText}”
                    </p>

                    {/* Comment text */}
                    {item.comment && (
                      <p className="mt-2 text-slate-800 leading-relaxed font-medium">{item.comment}</p>
                    )}

                    {/* Proposed Replacement */}
                    {item.replacement && (
                      <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-emerald-800">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                          Đề xuất thay thế:
                        </span>
                        <p className="font-semibold text-xs mt-0.5">{item.replacement}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-2.5 flex items-center justify-end border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAnnotationId(item.id);
                            setSelectedText(item.selectedText ?? "");
                            setAnnotationKind(item.kind ?? "COMMENT");
                            setAnnotationCriterion(item.criterion ?? "");
                            setAnnotationSeverity(item.severity ?? "SUGGESTION");
                            setAnnotationComment(item.comment ?? "");
                            setAnnotationReplacement(item.replacement ?? "");
                            setShowAnnotationModal(true);
                          }}
                          className="font-bold text-slate-600 hover:text-[#185abd] transition"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAnnotation(item.id);
                          }}
                          className="font-bold text-rose-600 hover:text-rose-700 transition"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </aside>
        )}

        {/* IELTS GRADING SIDEBAR (Collapsible Drawer on the Right) */}
        {showGradingPanel && (
          <aside className="z-10 flex w-[clamp(320px,24vw,384px)] shrink-0 select-none flex-col border-l border-slate-300 bg-slate-50 shadow-xl">
            <header className="flex h-11 items-center justify-between border-b border-slate-200 px-4 bg-white">
              <span className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wide">
                <Brain size={17} className="text-[#185abd]" />
                Bảng chấm điểm IELTS
              </span>
              <button
                type="button"
                onClick={() => setShowGradingPanel(false)}
                className="grid size-7 place-content-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={15} />
              </button>
            </header>

            <div className="custom-scrollbar flex-1 overflow-y-auto p-4 space-y-4">
              {/* Overall Band Big Card */}
              <div className="rounded-2xl border border-[#185abd]/30 bg-gradient-to-br from-[#185abd] to-[#0f3c7a] p-4 text-white shadow-md">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-200">
                  OVERALL BAND (GIÁO VIÊN)
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <strong className="font-serif text-4xl font-black">{overallBand || "0.0"}</strong>
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">
                    Tự tính từ 4 tiêu chí
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-white/80">
                  Làm tròn đến 0.5 theo quy tắc chính thức của IELTS.
                </p>
                {evaluation.overallBandAi != null && (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-black/20 px-3 py-1.5 text-xs">
                    <span className="flex items-center gap-1.5 text-white/80 font-medium">
                      <Sparkle size={14} className="text-amber-300" /> AI Band đề xuất:
                    </span>
                    <strong className="font-bold text-amber-300">{evaluation.overallBandAi.toFixed(1)}</strong>
                  </div>
                )}
              </div>

              {/* 4 IELTS Criteria Horizontal Tabs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Bốn tiêu chí chấm IELTS
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Click tab để chọn tiêu chí
                  </span>
                </div>

                {/* Horizontal Tab Navigation */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/80 rounded-xl" role="tablist">
                  {criterionKeys.map((key) => {
                    const meta = criterionMeta[key] ?? {
                      name: key,
                      shortName: key,
                      desc: "",
                      color: "#64748b",
                      activeTabClass: "bg-slate-700 text-white",
                      borderClass: "border-slate-300",
                      bgLightClass: "bg-slate-50",
                      textClass: "text-slate-800",
                    };
                    const isSelected = activeCriterionTab === key;
                    const currentBand = bands[key] ?? "";
                    const isGraded = currentBand.trim() !== "";

                    return (
                      <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setActiveCriterionTab(key)}
                        className={`relative flex flex-col items-center justify-center rounded-lg py-2 px-1 text-center transition-all duration-150 ${
                          isSelected
                            ? `${meta.activeTabClass} scale-[1.03]`
                            : "bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-xs"
                        }`}
                      >
                        <span className="text-[11px] font-black tracking-tight">{meta.shortName}</span>
                        <span
                          className={`mt-1 inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                            isSelected
                              ? "bg-black/20 text-white"
                              : isGraded
                              ? "bg-slate-100 text-slate-800 font-bold"
                              : "text-slate-400"
                          }`}
                        >
                          {isGraded ? currentBand : "-"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Criterion Card */}
                {(() => {
                  const activeKey = activeCriterionTab;
                  const activeMeta = criterionMeta[activeKey] ?? {
                    name: writingLabels[activeKey] ?? activeKey,
                    shortName: activeKey,
                    desc: "",
                    color: "#185abd",
                    activeTabClass: "bg-[#185abd] text-white",
                    borderClass: "border-slate-300",
                    bgLightClass: "bg-white",
                    textClass: "text-slate-800",
                  };
                  const currentBand = bands[activeKey] ?? "";
                  const aiBand = evaluation.criteria[activeKey]?.aiBand;
                  const activeIdx = criterionKeys.indexOf(activeKey);

                  return (
                    <div className={`rounded-xl border ${activeMeta.borderClass} ${activeMeta.bgLightClass} p-3.5 shadow-sm transition-all`}>
                      {/* Title & AI suggestion chip */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full" style={{ backgroundColor: activeMeta.color }} />
                            <h4 className="text-xs font-black text-slate-900">{activeMeta.name}</h4>
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-500 leading-tight">{activeMeta.desc}</p>
                        </div>

                        {aiBand != null ? (
                          <button
                            type="button"
                            onClick={() => setBands((curr) => ({ ...curr, [activeKey]: aiBand.toFixed(1) }))}
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-[10px] font-black text-amber-800 hover:bg-amber-500/20 transition active:scale-95"
                            title="Bấm để dùng điểm AI gợi ý"
                          >
                            <Sparkle size={12} className="text-amber-600" />
                            <span>AI: {aiBand.toFixed(1)}</span>
                          </button>
                        ) : null}
                      </div>

                      {/* Quick Band Buttons Row */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1.5">
                          <span>Chọn điểm Band:</span>
                          {currentBand ? (
                            <span className="font-black text-xs" style={{ color: activeMeta.color }}>
                              Band {currentBand}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal italic">Chưa chọn</span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {bandOptions.map((b) => {
                            const isBandSelected = currentBand === b;
                            return (
                              <button
                                key={b}
                                type="button"
                                onClick={() => setBands((curr) => ({ ...curr, [activeKey]: b }))}
                                className={`min-w-8 h-7 px-1.5 rounded-md text-[11px] font-black transition-all ${
                                  isBandSelected
                                    ? `${activeMeta.activeTabClass} scale-105`
                                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                                }`}
                              >
                                {b}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Criterion Feedback Textarea */}
                      <div className="mt-3">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Nhận xét riêng cho {activeMeta.name}:
                        </label>
                        <textarea
                          rows={3}
                          value={feedback[activeKey] ?? ""}
                          onChange={(e) => setFeedback((curr) => ({ ...curr, [activeKey]: e.target.value }))}
                          placeholder={`Nhập nhận xét cụ thể cho ${activeMeta.name} (ưu điểm, lỗi cần khắc phục)…`}
                          className="w-full rounded-lg border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#185abd] focus:ring-1 focus:ring-[#185abd]"
                        />
                      </div>

                      {/* Next / Previous Criterion Quick Stepper */}
                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                        <button
                          type="button"
                          disabled={activeIdx === 0}
                          onClick={() => setActiveCriterionTab(criterionKeys[activeIdx - 1])}
                          className="hover:text-slate-900 font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ← Tiêu chí trước
                        </button>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Tiêu chí {activeIdx + 1} / {criterionKeys.length}
                        </span>
                        <button
                          type="button"
                          disabled={activeIdx === criterionKeys.length - 1}
                          onClick={() => setActiveCriterionTab(criterionKeys[activeIdx + 1])}
                          className="hover:text-slate-900 font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Tiêu chí tiếp →
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Overall Feedback Sub-tabs: Strengths & Improvements */}
              <div className="pt-2">
                <div className="flex gap-1 p-1 bg-slate-200/80 rounded-xl mb-2" role="tablist">
                  <button
                    type="button"
                    onClick={() => setActiveFeedbackTab("strengths")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                      activeFeedbackTab === "strengths"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-white/80 text-slate-600 hover:bg-white"
                    }`}
                  >
                    <Check size={14} weight="bold" />
                    <span>Điểm mạnh ({strengths.split('\n').filter(Boolean).length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFeedbackTab("improvements")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                      activeFeedbackTab === "improvements"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "bg-white/80 text-slate-600 hover:bg-white"
                    }`}
                  >
                    <WarningCircle size={14} weight="bold" />
                    <span>Cần cải thiện ({improvements.split('\n').filter(Boolean).length})</span>
                  </button>
                </div>

                {activeFeedbackTab === "strengths" ? (
                  <div>
                    <textarea
                      rows={3}
                      value={strengths}
                      onChange={(e) => setStrengths(e.target.value)}
                      placeholder="Ghi nhận những điểm tốt của học viên (mỗi ý một dòng)…"
                      className="w-full rounded-xl border-emerald-200 bg-emerald-50/40 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                ) : (
                  <div>
                    <textarea
                      rows={3}
                      value={improvements}
                      onChange={(e) => setImprovements(e.target.value)}
                      placeholder="Chỉ ra các điểm cần khắc phục và phương hướng luyện tập (mỗi ý một dòng)…"
                      className="w-full rounded-xl border-amber-200 bg-amber-50/40 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>

              {!gradingComplete ? (
                <div role="status" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <WarningCircle size={16} className="mt-0.5 shrink-0" weight="fill" />
                  <span>
                    Còn thiếu <strong>{missingCriteriaCount}/4 tiêu chí</strong>. Nhập đủ điểm để lưu hoặc công bố.
                  </span>
                </div>
              ) : gradingDirty ? (
                <div role="status" className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
                  <FloppyDisk size={16} className="shrink-0" />
                  Điểm chấm đã thay đổi và chưa được lưu.
                </div>
              ) : null}
            </div>

            {/* Sidebar Footer */}
            <div className="border-t border-slate-200 bg-white p-3 space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving || published || !gradingComplete}
                  onClick={() => void onSave(false)}
                  title={gradingComplete ? "Lưu điểm và nhận xét" : `Còn thiếu ${missingCriteriaCount} tiêu chí`}
                  className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#185abd] bg-white text-xs font-bold text-[#185abd] hover:bg-sky-50 transition disabled:opacity-50"
                >
                  <FloppyDisk size={15} />
                  Lưu bản chấm
                </button>
                <button
                  type="button"
                  disabled={saving || !gradingComplete}
                  onClick={() => setShowPublishConfirm(true)}
                  title={gradingComplete ? "Công bố kết quả chấm" : `Còn thiếu ${missingCriteriaCount} tiêu chí`}
                  className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-sm disabled:opacity-50"
                >
                  <PaperPlaneTilt size={15} weight="fill" />
                  Công bố
                </button>
              </div>
            </div>
          </aside>
        )}

      </div>

      {/* 4. WORD STATUS BAR (Bottom status like MS Word) */}
      <footer className="flex h-7 shrink-0 items-center justify-between border-t border-slate-300 bg-slate-100 px-4 text-[11px] font-medium text-slate-600 select-none">
        <div className="flex items-center gap-4">
          <span>Trang 1 / 1</span>
          <span>{wordCount} từ</span>
          <span>{charCount} ký tự</span>
          <span>Tiếng Anh (IELTS Academic)</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">
            Trạng thái: <strong>{published ? "Đã công bố" : "Bản nháp giáo viên"}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
              className="hover:text-slate-900 font-bold px-1"
            >
              -
            </button>
            <span className="tabular-nums font-mono">{zoomLevel}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              className="hover:text-slate-900 font-bold px-1"
            >
              +
            </button>
          </div>
        </div>
      </footer>

      {contextMenu ? (
        <div
          role="menu"
          aria-label="Lệnh chỉnh sửa bài viết"
          className="fixed z-[70] w-60 overflow-hidden rounded-lg border border-slate-200 bg-white py-1.5 shadow-2xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onContextMenu={(event) => event.preventDefault()}
        >
          <ContextMenuItem icon={<Scissors size={16} />} label="Cắt" shortcut="Ctrl+X" disabled={!selectedText} onClick={() => void copySelection(true)} />
          <ContextMenuItem icon={<Copy size={16} />} label="Sao chép" shortcut="Ctrl+C" disabled={!selectedText} onClick={() => void copySelection(false)} />
          <ContextMenuItem icon={<ClipboardText size={16} />} label="Dán văn bản thuần" shortcut="Ctrl+V" onClick={() => void pastePlainText()} />
          <ContextMenuItem icon={<SelectionAll size={16} />} label="Chọn tất cả" shortcut="Ctrl+A" onClick={selectAllEditorText} />
          <div className="my-1 border-t border-slate-200" />
          <ContextMenuItem icon={<ArrowCounterClockwise size={16} />} label="Hoàn tác" shortcut="Ctrl+Z" onClick={() => executeHistoryCommand("undo")} />
          <ContextMenuItem icon={<Trash size={16} />} label="Xóa đoạn đã chọn" disabled={!selectedText} onClick={deleteSelection} />
          <div className="my-1 border-t border-slate-200" />
          <ContextMenuItem icon={<TextB size={16} />} label="In đậm" shortcut="Ctrl+B" onClick={() => { executeFormatCommand("bold"); setContextMenu(null); }} />
          <ContextMenuItem icon={<TextItalic size={16} />} label="In nghiêng" shortcut="Ctrl+I" onClick={() => { executeFormatCommand("italic"); setContextMenu(null); }} />
          <ContextMenuItem icon={<TextUnderline size={16} />} label="Gạch chân" shortcut="Ctrl+U" onClick={() => { executeFormatCommand("underline"); setContextMenu(null); }} />
          <div className="my-1 border-t border-slate-200" />
          <ContextMenuItem
            icon={<ChatTeardropText size={16} />}
            label="Gắn nhận xét"
            shortcut="Ctrl+Alt+M"
            disabled={!selectedText}
            onClick={() => {
              setActiveRibbonTab("review");
              setShowCommentsPanel(true);
              setShowGradingPanel(false);
              setContextMenu(null);
              openNewAnnotation("COMMENT");
            }}
          />
          <ContextMenuItem
            icon={<PencilSimpleLine size={16} />}
            label="Đề xuất sửa"
            disabled={!selectedText}
            onClick={() => {
              setActiveRibbonTab("review");
              setShowCommentsPanel(true);
              setShowGradingPanel(false);
              setContextMenu(null);
              openNewAnnotation("REPLACE");
            }}
          />
        </div>
      ) : null}

      {/* 5. MODAL: CREATE / EDIT ANNOTATION DIALOG */}
      {showAnnotationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-[#185abd]/10 text-[#185abd]">
                  <ChatTeardropText size={18} weight="bold" />
                </span>
                <strong className="text-sm font-extrabold text-slate-800">
                  {editingAnnotationId ? "Chỉnh sửa nhận xét" : "Thêm nhận xét / Đề xuất sửa"}
                </strong>
              </div>
              <button
                type="button"
                onClick={() => setShowAnnotationModal(false)}
                className="grid size-7 place-content-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quoted selected text */}
            <div className="mt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Đoạn văn bản đã chọn:
              </span>
              <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs italic font-medium text-slate-700">
                “{selectedText}”
              </p>
            </div>

            {/* Kind, Criterion, Severity */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-bold text-slate-700">
                Loại thao tác
                <select
                  value={annotationKind ?? "COMMENT"}
                  onChange={(e) => setAnnotationKind(e.target.value as TeacherAnnotation["kind"])}
                  className="mt-1 h-9 w-full rounded-lg border-slate-200 bg-white text-xs font-semibold focus:border-[#185abd] focus:ring-1 focus:ring-[#185abd]"
                >
                  <option value="COMMENT">Ghi chú / Nhận xét</option>
                  <option value="REPLACE">Đề xuất thay thế</option>
                  <option value="HIGHLIGHT">Chỉ đánh dấu</option>
                </select>
              </label>

              <label className="text-xs font-bold text-slate-700">
                Tiêu chí IELTS
                <select
                  value={annotationCriterion}
                  onChange={(e) => setAnnotationCriterion(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border-slate-200 bg-white text-xs font-semibold focus:border-[#185abd] focus:ring-1 focus:ring-[#185abd]"
                >
                  <option value="">Chung (Không chọn)</option>
                  {criterionKeys.map((key) => (
                    <option key={key} value={key}>
                      {writingLabels[key] ?? key}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-bold text-slate-700">
                Mức độ
                <select
                  value={annotationSeverity ?? "SUGGESTION"}
                  onChange={(e) => setAnnotationSeverity(e.target.value as TeacherAnnotation["severity"])}
                  className="mt-1 h-9 w-full rounded-lg border-slate-200 bg-white text-xs font-semibold focus:border-[#185abd] focus:ring-1 focus:ring-[#185abd]"
                >
                  <option value="SUGGESTION">Gợi ý</option>
                  <option value="ERROR">Lỗi</option>
                  <option value="MAJOR">Lỗi nghiêm trọng</option>
                </select>
              </label>
            </div>

            {/* Replacement input if kind is REPLACE */}
            {annotationKind === "REPLACE" && (
              <div className="mt-3">
                <label className="block text-xs font-bold text-slate-700">
                  Nội dung đề xuất thay thế <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={annotationReplacement}
                  onChange={(e) => setAnnotationReplacement(e.target.value)}
                  placeholder="Nhập từ hoặc câu viết đúng…"
                  className="mt-1 h-9 w-full rounded-lg border-slate-200 bg-white text-xs text-slate-800 focus:border-[#185abd] focus:ring-1 focus:ring-[#185abd]"
                />
              </div>
            )}

            {/* Comment textarea */}
            <div className="mt-3">
              <label className="block text-xs font-bold text-slate-700">
                Nhận xét chi tiết cho học viên
              </label>
              <textarea
                rows={3}
                value={annotationComment}
                onChange={(e) => setAnnotationComment(e.target.value)}
                placeholder="Giải thích lỗi sai, hướng diễn đạt tự nhiên hơn hoặc lời khen…"
                className="mt-1 w-full rounded-lg border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#185abd] focus:ring-1 focus:ring-[#185abd]"
              />
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowAnnotationModal(false)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveAnnotation}
                className="h-9 rounded-lg bg-[#185abd] px-4 text-xs font-bold text-white hover:bg-[#124996] transition shadow-sm"
              >
                Lưu nhận xét
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: RESET CONFIRMATION */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <WarningCircle size={28} />
              <strong className="text-sm font-extrabold text-slate-900">Khôi phục bài gốc?</strong>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Toàn bộ bài viết sẽ trở về nguyên bản học viên đã nộp. Các chỉnh sửa chữ và ghi chú hiện tại sẽ bị xóa.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleResetToOriginal}
                className="h-9 rounded-lg bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-700"
              >
                Xác nhận khôi phục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: PUBLISH CONFIRMATION */}
      {showPublishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle size={28} />
              <strong className="text-sm font-extrabold text-slate-900">Công bố kết quả chấm?</strong>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Sau khi công bố, học viên sẽ nhận được thông báo và xem được toàn bộ bản sửa Word, các ghi chú đánh dấu
              và điểm số 4 tiêu chí của giáo viên.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPublishConfirm(false)}
                className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600"
              >
                Để sau
              </button>
              <button
                type="button"
                disabled={saving || !gradingComplete}
                onClick={async () => {
                  setShowPublishConfirm(false);
                  await onSave(true);
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <CircleNotch size={14} className="animate-spin" /> : <PaperPlaneTilt size={14} />}
                Xác nhận công bố
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RibbonIconButton({
  children,
  label,
  shortcut,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
      className="grid size-8 place-content-center rounded text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function ContextMenuItem({
  icon,
  label,
  shortcut,
  disabled = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="flex min-h-9 w-full items-center gap-3 px-3 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
    >
      <span className="flex size-5 shrink-0 items-center justify-center text-slate-500">{icon}</span>
      <span className="flex-1">{label}</span>
      {shortcut ? <span className="text-[10px] text-slate-400">{shortcut}</span> : null}
    </button>
  );
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeLineBreaks(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ");
}

function normalizeEditorText(value: string) {
  return normalizeLineBreaks(value);
}

function textOffsetAt(root: HTMLElement, node: Node, offset: number) {
  const range = document.createRange();
  range.selectNodeContents(root);
  try {
    range.setEnd(node, offset);
  } catch {
    return -1;
  }

  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;left:-100000px;top:0;visibility:hidden;white-space:pre-wrap";
  probe.append(range.cloneContents());
  document.body.append(probe);
  const length = normalizeLineBreaks(probe.innerText).length;
  probe.remove();
  return length;
}

function rebaseAnnotations(
  previousText: string,
  nextText: string,
  values: TeacherAnnotation[]
) {
  if (previousText === nextText || values.length === 0) return values;

  let prefix = 0;
  while (
    prefix < previousText.length &&
    prefix < nextText.length &&
    previousText[prefix] === nextText[prefix]
  ) {
    prefix += 1;
  }

  let suffix = 0;
  while (
    suffix < previousText.length - prefix &&
    suffix < nextText.length - prefix &&
    previousText[previousText.length - 1 - suffix] === nextText[nextText.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  const previousChangeEnd = previousText.length - suffix;
  const nextChangeEnd = nextText.length - suffix;
  const delta = nextText.length - previousText.length;

  const rebased = values.flatMap((item) => {
    const start = item.start <= prefix
      ? item.start
      : item.start >= previousChangeEnd
        ? item.start + delta
        : prefix;
    const end = item.end <= prefix
      ? item.end
      : item.end >= previousChangeEnd
        ? item.end + delta
        : nextChangeEnd;
    const safeStart = Math.max(0, Math.min(start, nextText.length));
    const safeEnd = Math.max(safeStart, Math.min(end, nextText.length));
    if (safeEnd <= safeStart) return [];
    return [{
      ...item,
      start: safeStart,
      end: safeEnd,
      selectedText: nextText.slice(safeStart, safeEnd),
    }];
  });

  return rebased;
}

function plainTextToEditorHtml(text: string) {
  const normalized = normalizeLineBreaks(text).trim();
  if (!normalized) return "<p></p>";
  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.split("\n").map(escapeHtml).join("<br>")}</p>`)
    .join("");
}

function editorPlainText(editor: Editor) {
  const blocks: string[] = [];
  editor.state.doc.forEach((block) => {
    blocks.push(block.textBetween(0, block.content.size, "\n", "\n"));
  });
  return normalizeEditorText(blocks.join("\n\n"));
}

function persistableEditorHtml(html: string) {
  if (typeof document === "undefined") return html.trim();
  const root = document.createElement("div");
  root.innerHTML = html;
  root.querySelectorAll("[data-annotation-id]").forEach((mark) => mark.replaceWith(...Array.from(mark.childNodes)));
  return root.innerHTML.trim();
}

function renderEditorHtml(text: string, richHtml: string, values: TeacherAnnotation[]) {
  const source = richHtml.trim() || plainTextToEditorHtml(text);
  if (typeof document === "undefined") return source;

  const root = document.createElement("div");
  root.innerHTML = source;
  root.querySelectorAll("p, div").forEach((block) => {
    if (!block.textContent?.trim() && !block.querySelector("[data-annotation-id]")) block.remove();
  });
  if (!root.textContent?.trim()) root.innerHTML = "<p></p>";
  if (values.length === 0) return root.innerHTML;
  const valid = [...values]
    .filter((item) => item.start >= 0 && item.end > item.start && item.end <= text.length)
    .sort((left, right) => right.start - left.start || right.end - left.end);

  for (const item of valid) {
    const start = findEditorDomPoint(root, item.start);
    const end = findEditorDomPoint(root, item.end);
    if (!start || !end) continue;
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    if (range.collapsed) continue;
    const color = item.kind === "REPLACE"
      ? "#fecdd3"
      : criterionColorMap[item.criterion ?? ""]?.highlight ?? "#fef08a";
    const mark = document.createElement("span");
    mark.dataset.annotationId = item.id ?? "";
    mark.style.backgroundColor = color;
    mark.style.borderRadius = "2px";
    mark.style.padding = "0 1px";
    try {
      range.surroundContents(mark);
    } catch {
      const fragment = range.extractContents();
      mark.append(fragment);
      range.insertNode(mark);
    }
  }

  return root.innerHTML;
}

function findEditorDomPoint(root: HTMLElement, targetOffset: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const parent = node.parentElement;
    if (parent?.closest("[data-annotation-id]")) {
      node = walker.nextNode();
      continue;
    }
    const start = textOffsetAt(root, node, 0);
    const end = textOffsetAt(root, node, node.textContent?.length ?? 0);
    if (targetOffset >= start && targetOffset <= end) {
      return { node, offset: Math.max(0, Math.min(targetOffset - start, node.textContent?.length ?? 0)) };
    }
    node = walker.nextNode();
  }
  return null;
}
