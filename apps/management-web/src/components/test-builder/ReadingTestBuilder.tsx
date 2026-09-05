import {
  ArrowLeft,
  Check,
  Copy,
  Eye,
  Highlighter,
  Minus,
  NotePencil,
  Plus,
  Question,
  ShieldCheck,
  SpinnerGap,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type {
  PassageSection,
  QuestionCardItem,
  QuestionGroupItem,
  QuestionOption,
  QuestionTypeFormat,
  SharedOptionItem,
  TestBankItem,
  ValidationIssue,
} from "../../library-types";
import { apiFetch } from "../../lib/api";
import KeyboardShortcutsModal from "./KeyboardShortcutsModal";
import PublishValidationModal from "./PublishValidationModal";
import ReadingQuestionGroupDialog, { type ReadingQuestionGroupDraft } from "./ReadingQuestionGroupDialog";
import ReadingRichTextEditor from "./ReadingRichTextEditor";
import {
  createDefaultSharedOptions,
  defaultWordLimit,
  getReadingQuestionTypeDefinition,
  questionTypeUsesQuestionOptions,
  questionTypeUsesSharedOptions,
  questionTypeUsesWordLimit,
  readingQuestionTypeLabels,
  readingQuestionTypes,
} from "./readingQuestionGroupConfig";
import TestPreviewModal from "./TestPreviewModal";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function newSharedOptionId() {
  return newId("shared-option");
}

function defaultOptions(): QuestionOption[] {
  return ["A", "B", "C", "D"].map((label) => ({ id: newId("option"), label, text: "" }));
}

function needsOptions(typeFormat: QuestionTypeFormat) {
  return questionTypeUsesQuestionOptions(typeFormat);
}

function autoGroupTitle(startQuestionNo: number, endQuestionNo: number) {
  return startQuestionNo === endQuestionNo
    ? `Questions ${startQuestionNo}`
    : `Questions ${startQuestionNo}–${endQuestionNo}`;
}

function emptyPassage(passageNo: number): PassageSection {
  return {
    id: newId("passage"),
    passageNo,
    title: `Reading Passage ${passageNo}`,
    content: "",
    teacherAnnotations: [],
    questionGroups: [],
  };
}

function normalizeQuestion(question: QuestionCardItem): QuestionCardItem {
  const hasPrompt = question.prompt.trim().length > 0;
  const hasAnswer = question.correctAnswers.length > 0;
  return {
    ...question,
    options: needsOptions(question.typeFormat) && question.options.length === 0 ? defaultOptions() : question.options,
    isComplete: hasPrompt && hasAnswer,
    hasError: !hasPrompt || !hasAnswer,
    errorMessage: !hasPrompt
      ? "Chưa nhập nội dung câu hỏi."
      : !hasAnswer
      ? "Chưa nhập đáp án đúng."
      : undefined,
  };
}

function createQuestion(number: number, typeFormat: QuestionTypeFormat): QuestionCardItem {
  return normalizeQuestion({
    id: newId("question"),
    number,
    typeFormat,
    prompt: "",
    options: needsOptions(typeFormat) ? defaultOptions() : [],
    correctAnswers: [],
    acceptableAnswers: [],
    explanation: "",
    trapAnalysis: "",
    vocabularyNotes: "",
    teacherNote: "",
    isComplete: false,
    hasError: true,
    errorMessage: "Chưa nhập nội dung câu hỏi.",
  });
}

function createGroup(
  startQuestionNo: number,
  typeFormat: QuestionTypeFormat,
  questionCount = 1,
  draft?: ReadingQuestionGroupDraft,
): QuestionGroupItem {
  const definition = getReadingQuestionTypeDefinition(typeFormat);
  const safeQuestionCount = Math.min(20, Math.max(1, questionCount));
  const endQuestionNo = startQuestionNo + safeQuestionCount - 1;
  const answerSource = draft?.answerSource ?? definition.defaultAnswerSource ?? "PASSAGE";
  const sharedOptions = draft?.sharedOptions
    ?? (questionTypeUsesSharedOptions(typeFormat, answerSource)
      ? createDefaultSharedOptions(typeFormat, () => newId("shared-option"))
      : []);
  return {
    id: newId("group"),
    title: draft?.title || autoGroupTitle(startQuestionNo, endQuestionNo),
    titleMode: draft?.title ? "CUSTOM" : "AUTO",
    startQuestionNo,
    endQuestionNo,
    typeFormat,
    instructions: draft?.instructions || definition.defaultInstructions,
    wordLimitRule: draft?.wordLimitRule ?? defaultWordLimit(typeFormat),
    answerSource,
    requiredAnswerCount: draft?.requiredAnswerCount ?? definition.defaultRequiredAnswerCount,
    sharedOptions,
    allowOptionReused: draft?.allowOptionReused ?? definition.usesSharedOptions ?? false,
    questions: Array.from({ length: safeQuestionCount }, (_, index) => createQuestion(startQuestionNo + index, typeFormat)),
    isCollapsed: false,
  };
}

function toQuestionGroups(value: unknown): QuestionGroupItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((group) => ({
    id: typeof group.id === "string" ? group.id : newId("group"),
    title: typeof group.title === "string" ? group.title : "Questions",
    titleMode: group.titleMode === "CUSTOM"
      || (typeof group.title === "string" && !/^Questions?\s+\d/i.test(group.title))
      ? "CUSTOM"
      : "AUTO",
    startQuestionNo: typeof group.startQuestionNo === "number" ? group.startQuestionNo : 1,
    endQuestionNo: typeof group.endQuestionNo === "number" ? group.endQuestionNo : 1,
    typeFormat: isQuestionType(group.typeFormat) ? group.typeFormat : "FILL_IN_BLANK",
    instructions: typeof group.instructions === "string"
      ? group.instructions
      : getReadingQuestionTypeDefinition(isQuestionType(group.typeFormat) ? group.typeFormat : "FILL_IN_BLANK").defaultInstructions,
    wordLimitRule: typeof group.wordLimitRule === "string" ? group.wordLimitRule : "",
    answerSource: group.answerSource === "OPTION_BANK" ? "OPTION_BANK" : "PASSAGE",
    requiredAnswerCount: typeof group.requiredAnswerCount === "number" ? group.requiredAnswerCount : undefined,
    sharedOptions: Array.isArray(group.sharedOptions) ? group.sharedOptions as SharedOptionItem[] : [],
    allowOptionReused: typeof group.allowOptionReused === "boolean" ? group.allowOptionReused : false,
    linkedAudioTimestamp: typeof group.linkedAudioTimestamp === "string" ? group.linkedAudioTimestamp : undefined,
    questions: Array.isArray(group.questions)
      ? (group.questions as QuestionCardItem[]).map(normalizeQuestion)
      : [],
    isCollapsed: typeof group.isCollapsed === "boolean" ? group.isCollapsed : false,
  }));
}

function isQuestionType(value: unknown): value is QuestionTypeFormat {
  return typeof value === "string" && readingQuestionTypes.includes(value as QuestionTypeFormat);
}

function isFullReadingTest(content: Record<string, unknown>, test?: TestBankItem) {
  return test?.testType === "FULL_TEST" || content.format === "FULL";
}

function selectedSinglePassageNo(content: Record<string, unknown>) {
  const match = typeof content.format === "string" ? /^PASSAGE_([123])$/.exec(content.format) : null;
  return match ? Number(match[1]) : 1;
}

function normalizePassages(content: Record<string, unknown>, test?: TestBankItem): PassageSection[] {
  const fullTest = isFullReadingTest(content, test);
  const singlePassageNo = selectedSinglePassageNo(content);
  const rawPassages = content.passages;
  if (Array.isArray(rawPassages)) {
    const passages = rawPassages.filter(isRecord).map((passage, index) => ({
      id: typeof passage.id === "string" ? passage.id : newId("passage"),
      passageNo: typeof passage.passageNo === "number" ? passage.passageNo : index + 1,
      title: typeof passage.title === "string" ? passage.title : `Reading Passage ${index + 1}`,
      content: typeof passage.content === "string" ? passage.content : "",
      teacherAnnotations: Array.isArray(passage.teacherAnnotations)
        ? passage.teacherAnnotations as PassageSection["teacherAnnotations"]
        : [],
      questionGroups: toQuestionGroups(passage.questionGroups),
    }));
    if (passages.length > 0) {
      const sorted = passages.sort((a, b) => a.passageNo - b.passageNo);
      if (fullTest) return sorted.slice(0, 3);
      const selected = sorted.find((passage) => passage.passageNo === singlePassageNo) ?? sorted[0];
      return [{ ...selected, passageNo: singlePassageNo }];
    }
  }

  const legacyPassageContent = content.passageContent;
  if (isRecord(legacyPassageContent)) {
    const legacyGroups = toQuestionGroups(content.questionGroups);
    const passages = [1, 2, 3]
      .map((passageNo) => ({
        ...emptyPassage(passageNo),
        content: typeof legacyPassageContent[String(passageNo)] === "string"
          ? legacyPassageContent[String(passageNo)] as string
          : "",
        questionGroups: passageNo === 1 ? legacyGroups : [],
      }))
      .filter((passage) => passage.content || passage.questionGroups.length > 0);
    if (passages.length > 0) {
      if (fullTest) return passages;
      const selected = passages.find((passage) => passage.passageNo === singlePassageNo) ?? passages[0];
      return [{ ...selected, passageNo: singlePassageNo }];
    }
  }

  return fullTest
    ? [emptyPassage(1), emptyPassage(2), emptyPassage(3)]
    : [emptyPassage(singlePassageNo)];
}

function countQuestions(passages: PassageSection[]) {
  return passages.reduce(
    (sum, passage) => sum + passage.questionGroups.reduce((groupSum, group) => groupSum + group.questions.length, 0),
    0,
  );
}

function nextQuestionNumber(passages: PassageSection[]) {
  const max = passages
    .flatMap((passage) => passage.questionGroups)
    .flatMap((group) => group.questions)
    .reduce((currentMax, question) => Math.max(currentMax, question.number), 0);
  return max + 1;
}

function renumberPassageQuestions(passages: PassageSection[]) {
  let nextNumber = 1;
  return passages.map((passage) => ({
    ...passage,
    questionGroups: passage.questionGroups.map((group) => {
      const questions = group.questions.map((question) => ({ ...question, number: nextNumber++ }));
      const startQuestionNo = questions[0]?.number ?? nextNumber;
      const endQuestionNo = questions[questions.length - 1]?.number ?? startQuestionNo;
      return {
        ...group,
        startQuestionNo,
        endQuestionNo,
        title: group.titleMode === "CUSTOM" ? group.title : autoGroupTitle(startQuestionNo, endQuestionNo),
        questions,
      };
    }),
  }));
}

function plainTextFromHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function expectedNavigationCount(test: TestBankItem | null, passages: PassageSection[]) {
  const expected = test?.builderContent?.expectedQuestions;
  if (typeof expected === "number" && expected > 0) return expected;
  if (test?.testType === "FULL_TEST") return 40;
  return Math.max(13, countQuestions(passages));
}

function choiceValues(typeFormat: QuestionTypeFormat) {
  if (typeFormat === "TRUE_FALSE_NOT_GIVEN") return ["TRUE", "FALSE", "NOT_GIVEN"];
  if (typeFormat === "YES_NO_NOT_GIVEN") return ["YES", "NO", "NOT_GIVEN"];
  return [];
}

function answersFromText(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sharedOptionsToText(options?: SharedOptionItem[]) {
  return (options ?? []).map((option) => `${option.code}. ${option.text}`).join("\n");
}

function parseSharedOptions(value: string, existing: SharedOptionItem[] = []): SharedOptionItem[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const match = line.match(/^([A-Za-z0-9ivxlcdmIVXLCDM]+)[.)-]\s*(.*)$/);
      const code = match?.[1] ?? String(index + 1);
      const previous = existing.find((option) => option.code === code) ?? existing[index];
      return {
        id: previous?.id ?? newId("shared-option"),
        code,
        text: match?.[2] ?? line,
      };
    });
}

function AnswerEditor({
  question,
  sharedOptions,
  requiredAnswerCount,
  onChange,
}: {
  question: QuestionCardItem;
  sharedOptions?: SharedOptionItem[];
  requiredAnswerCount?: number;
  onChange: (question: QuestionCardItem) => void;
}) {
  const fixedChoices = choiceValues(question.typeFormat);

  if (fixedChoices.length > 0) {
    return (
      <div className="mt-3">
        <label className="mb-1 block text-[11px] font-bold text-[#746A6E]">Đáp án đúng</label>
        <div className="flex flex-wrap gap-2">
          {fixedChoices.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => onChange(normalizeQuestion({ ...question, correctAnswers: [choice] }))}
              className={`min-h-[34px] rounded-xl border px-3 text-xs font-bold transition ${
                question.correctAnswers.includes(choice)
                  ? "border-[#237653] bg-emerald-50 text-[#237653]"
                  : "border-[#e3dce2] bg-white text-[#746A6E] hover:bg-[#f8f6fa]"
              }`}
            >
              {choice.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (sharedOptions && sharedOptions.length > 0) {
    return (
      <div className="mt-3">
        <span className="mb-1.5 block text-[11px] font-bold text-[#746A6E]">Đáp án từ Option bank</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {sharedOptions.map((option) => {
            const checked = question.correctAnswers.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange(normalizeQuestion({ ...question, correctAnswers: [option.id] }))}
                className={`flex min-h-10 items-center gap-2 rounded-xl border px-3 text-left text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]/35 ${
                  checked
                    ? "border-[#237653] bg-emerald-50 text-[#18563e]"
                    : "border-[#e3dce2] bg-white text-[#211A1D] hover:bg-[#f8f6fa]"
                }`}
              >
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-bold ${
                  checked ? "border-[#237653] bg-[#237653] text-white" : "border-[#cfc5ca] text-[#746A6E]"
                }`}>
                  {option.code}
                </span>
                <span>{option.text || "Chưa nhập nội dung option"}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (needsOptions(question.typeFormat)) {
    const multiple = question.typeFormat === "MULTIPLE_ANSWERS";
    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-[11px] font-bold text-[#746A6E]">
            Các lựa chọn
            {multiple && requiredAnswerCount ? ` • Chọn ${requiredAnswerCount} đáp án đúng` : ""}
          </label>
          <button
            type="button"
            onClick={() => {
              const nextLabel = String.fromCharCode(65 + question.options.length);
              onChange(normalizeQuestion({
                ...question,
                options: [...question.options, { id: newId("option"), label: nextLabel, text: "" }],
              }));
            }}
            className="text-[11px] font-bold text-[#8f4458] hover:underline"
          >
            + Thêm option
          </button>
        </div>
        {question.options.map((option) => {
          const checked = question.correctAnswers.includes(option.id);
          return (
            <div key={option.id} className="flex items-center gap-2">
              <input
                type={multiple ? "checkbox" : "radio"}
                name={`correct-${question.id}`}
                checked={checked}
                onChange={(event) => {
                  const correctAnswers = multiple
                    ? event.target.checked
                      ? [...question.correctAnswers, option.id]
                      : question.correctAnswers.filter((id) => id !== option.id)
                    : [option.id];
                  onChange(normalizeQuestion({ ...question, correctAnswers }));
                }}
                className="accent-[#8f4458]"
              />
              <span className="w-5 text-xs font-bold text-[#8f4458]">{option.label}.</span>
              <input
                value={option.text}
                onChange={(event) => {
                  onChange(normalizeQuestion({
                    ...question,
                    options: question.options.map((current) => (
                      current.id === option.id ? { ...current, text: event.target.value } : current
                    )),
                  }));
                }}
                className="min-h-[34px] flex-1 rounded-xl border border-[#e3dce2] px-3 text-xs focus:border-[#8f4458] focus:outline-none"
                placeholder={`Nội dung option ${option.label}`}
              />
              <button
                type="button"
                disabled={question.options.length <= 2}
                onClick={() => onChange(normalizeQuestion({
                  ...question,
                  options: question.options
                    .filter((current) => current.id !== option.id)
                    .map((current, index) => ({ ...current, label: String.fromCharCode(65 + index) })),
                  correctAnswers: question.correctAnswers.filter((answer) => answer !== option.id),
                }))}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[#b4232d] hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label={`Xóa lựa chọn ${option.label}`}
                title="Xóa lựa chọn"
              >
                <Trash size={14} />
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-3 grid gap-3 md:grid-cols-2">
      <label>
        <span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Đáp án đúng</span>
        <input
          value={question.correctAnswers.join(", ")}
          onChange={(event) => onChange(normalizeQuestion({ ...question, correctAnswers: answersFromText(event.target.value) }))}
          placeholder="Nhập đáp án, cách nhau bằng dấu phẩy"
          className="min-h-[36px] w-full rounded-xl border border-[#e3dce2] px-3 text-xs focus:border-[#8f4458] focus:outline-none"
        />
      </label>
      <label>
        <span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Đáp án thay thế</span>
        <input
          value={(question.acceptableAnswers ?? []).join(", ")}
          onChange={(event) => onChange(normalizeQuestion({ ...question, acceptableAnswers: answersFromText(event.target.value) }))}
          placeholder="Các đáp án vẫn được chấp nhận"
          className="min-h-[36px] w-full rounded-xl border border-[#e3dce2] px-3 text-xs focus:border-[#8f4458] focus:outline-none"
        />
      </label>
    </div>
  );
}

export function ReadingTestBuilder() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const testRecordRef = useRef<TestBankItem | null>(null);
  const splitWorkspaceRef = useRef<HTMLDivElement>(null);
  const [testRecord, setTestRecord] = useState<TestBankItem | null>(null);
  const [testTitle, setTestTitle] = useState("");
  const [passages, setPassages] = useState<PassageSection[]>([emptyPassage(1)]);
  const [activePassageId, setActivePassageId] = useState("");
  const [leftWidth, setLeftWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"SAVING" | "SAVED" | "ERROR">("SAVED");
  const [lastSavedTime, setLastSavedTime] = useState("—");
  const [selectedQuestionNo, setSelectedQuestionNo] = useState(1);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showQuestionGroupDialog, setShowQuestionGroupDialog] = useState(false);
  const [evidenceCaptureTarget, setEvidenceCaptureTarget] = useState<{
    groupId: string;
    questionId: string;
    questionNo: number;
  } | null>(null);
  const [evidenceFocusRequest, setEvidenceFocusRequest] = useState(0);

  const activePassage = passages.find((passage) => passage.id === activePassageId) ?? passages[0] ?? emptyPassage(1);
  const selectedQuestion = activePassage.questionGroups
    .flatMap((group) => group.questions)
    .find((question) => question.number === selectedQuestionNo);

  // Calculate real passage statistics dynamically
  const passageStats = useMemo(() => {
    const rawText = (activePassage.content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const words = rawText ? rawText.split(/\s+/).filter(Boolean).length : 0;
    const chars = rawText.length;
    const paragraphMatches = (activePassage.content || "").match(/<p[^>]*>/gi);
    const paragraphs = paragraphMatches ? paragraphMatches.length : (rawText ? rawText.split(/\n\s*\n/).length : 0);
    const readingTimeMins = Math.ceil(words / 200);

    return { words, chars, paragraphs, readingTimeMins };
  }, [activePassage.content]);

  useEffect(() => {
    testRecordRef.current = testRecord;
  }, [testRecord]);

  useEffect(() => {
    setEvidenceCaptureTarget(null);
  }, [activePassageId]);

  useEffect(() => {
    if (!testId) return;
    setLoaded(false);
    void apiFetch<TestBankItem>(`/admin/test-bank/${testId}`)
      .then((test) => {
        const normalized = normalizePassages(test.builderContent ?? {}, test);
        setTestRecord(test);
        setTestTitle(test.title);
        setPassages(normalized);
        setActivePassageId(normalized[0]?.id ?? "");
        setSelectedQuestionNo(normalized[0]?.questionGroups[0]?.questions[0]?.number ?? 1);
        setLoaded(true);
        setSaveStatus("SAVED");
        setLastSavedTime(new Date(test.updatedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
      })
      .catch(() => {
        setSaveStatus("ERROR");
      });
  }, [testId]);

  const totalQuestions = countQuestions(passages);
  const navigationCount = expectedNavigationCount(testRecord, passages);
  const fullReadingTest = isFullReadingTest(testRecord?.builderContent ?? {}, testRecord ?? undefined);

  const draftTest = useMemo<TestBankItem | null>(() => {
    if (!testRecord) return null;
    return {
      ...testRecord,
      title: testTitle,
      sectionsCount: passages.length,
      totalQuestions,
      builderContent: {
        ...(testRecord.builderContent ?? {}),
        format: testRecord.builderContent?.format ?? (testRecord.testType === "FULL_TEST" ? "FULL" : `PASSAGE_${activePassage.passageNo}`),
        passages,
      },
    };
  }, [activePassage.passageNo, passages, testRecord, testTitle, totalQuestions]);

  const validationIssues = useMemo<ValidationIssue[]>(() => {
    const issues: ValidationIssue[] = [];
    if (fullReadingTest && passages.length !== 3) {
      issues.push({
        id: "full-reading-passages",
        severity: "ERROR",
        sectionTitle: "Cấu trúc đề",
        message: "Full Reading cần có đúng 3 passages trước khi xuất bản.",
        targetId: "reading-passage-navigation",
      });
    }
    if (!testTitle.trim()) {
      issues.push({
        id: "title-empty",
        severity: "ERROR",
        sectionTitle: "Thông tin chung",
        message: "Tên đề thi không được để trống.",
        targetId: "reading-builder-title",
      });
    }
    if (totalQuestions === 0) {
      issues.push({
        id: "questions-empty",
        severity: "ERROR",
        sectionTitle: "Câu hỏi",
        message: "Đề Reading cần có ít nhất một câu hỏi trước khi xuất bản.",
        targetId: "reading-question-panel",
      });
    }
    passages.forEach((passage) => {
      if (!plainTextFromHtml(passage.content)) {
        issues.push({
          id: `passage-${passage.id}-empty`,
          severity: "WARNING",
          sectionTitle: `Passage ${passage.passageNo}`,
          message: "Passage chưa có nội dung bài đọc.",
          targetId: `passage-tab-${passage.id}`,
        });
      }
      passage.questionGroups.forEach((group) => {
        if (!group.title.trim()) {
          issues.push({
            id: `${group.id}-title`,
            severity: "ERROR",
            sectionTitle: `Passage ${passage.passageNo}`,
            message: "Question group chưa có tiêu đề.",
            targetId: group.id,
          });
        }
        if (!group.instructions.trim()) {
          issues.push({
            id: `${group.id}-instructions`,
            severity: "WARNING",
            sectionTitle: group.title || `Passage ${passage.passageNo}`,
            message: "Question group chưa có hướng dẫn cho học viên.",
            targetId: group.id,
          });
        }
        if (questionTypeUsesWordLimit(group.typeFormat, group.answerSource) && !group.wordLimitRule?.trim()) {
          issues.push({
            id: `${group.id}-word-limit`,
            severity: "ERROR",
            sectionTitle: group.title,
            message: "Dạng Completion hoặc Short Answer cần có giới hạn từ.",
            targetId: group.id,
          });
        }
        if (questionTypeUsesSharedOptions(group.typeFormat, group.answerSource)
          && !(group.sharedOptions?.some((option) => option.code.trim() && option.text.trim()))) {
          issues.push({
            id: `${group.id}-option-bank`,
            severity: "ERROR",
            sectionTitle: group.title,
            message: "Dạng bài này cần có Option bank dùng chung.",
            targetId: group.id,
          });
        }
        group.questions.forEach((question) => {
          if (!question.prompt.trim()) {
            issues.push({
              id: `${question.id}-prompt`,
              severity: "ERROR",
              sectionTitle: `Passage ${passage.passageNo}`,
              questionNo: question.number,
              message: "Chưa nhập nội dung câu hỏi.",
              targetId: question.id,
            });
          }
          if (question.correctAnswers.length === 0) {
            issues.push({
              id: `${question.id}-answer`,
              severity: "ERROR",
              sectionTitle: `Passage ${passage.passageNo}`,
              questionNo: question.number,
              message: "Chưa nhập đáp án đúng.",
              targetId: question.id,
            });
          }
          if (group.typeFormat === "MULTIPLE_ANSWERS"
            && question.correctAnswers.length !== (group.requiredAnswerCount ?? 2)) {
            issues.push({
              id: `${question.id}-answer-count`,
              severity: "ERROR",
              sectionTitle: group.title,
              questionNo: question.number,
              message: `Cần chọn đúng ${group.requiredAnswerCount ?? 2} đáp án.`,
              targetId: question.id,
            });
          }
        });
      });
    });
    return issues;
  }, [fullReadingTest, passages, testTitle, totalQuestions]);

  const saveDraft = useCallback(async (nextPassages = passages, nextTitle = testTitle) => {
    const record = testRecordRef.current;
    if (!record || !testId) return null;
    setSaveStatus("SAVING");
    try {
      const saved = await apiFetch<TestBankItem>(`/admin/test-bank/${testId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: nextTitle.trim() || record.title,
          description: null,
          skill: "READING",
          testType: record.testType,
          durationMinutes: record.durationMinutes || 60,
          version: record.version,
          tags: record.tags,
          builderContent: {
            ...(record.builderContent ?? {}),
            format: record.builderContent?.format ?? (record.testType === "FULL_TEST" ? "FULL" : `PASSAGE_${nextPassages[0]?.passageNo ?? 1}`),
            passages: nextPassages,
          },
        }),
      });
      setTestRecord(saved);
      setSaveStatus("SAVED");
      setLastSavedTime(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
      return saved;
    } catch {
      setSaveStatus("ERROR");
      return null;
    }
  }, [passages, testId, testTitle]);

  useEffect(() => {
    if (!loaded || !testRecordRef.current) return undefined;
    setSaveStatus("SAVING");
    const timeout = window.setTimeout(() => {
      void saveDraft();
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [loaded, passages, saveDraft, testTitle]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveDraft();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setShowPreviewModal(true);
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        addQuestionToActiveGroup();
      }
      if (event.key === "?") {
        event.preventDefault();
        setShowShortcutsModal(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  useEffect(() => {
    if (!isResizing) return undefined;
    const handleMouseMove = (event: MouseEvent) => {
      const workspace = splitWorkspaceRef.current;
      if (!workspace) return;
      const bounds = workspace.getBoundingClientRect();
      const relativeX = event.clientX - bounds.left;
      const nextWidth = Math.min(Math.max((relativeX / bounds.width) * 100, 34), 66);
      setLeftWidth(nextWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  function setAllPassages(updater: (current: PassageSection[]) => PassageSection[]) {
    setPassages((current) => updater(current));
  }

  function updateActivePassage(patch: Partial<PassageSection>) {
    setAllPassages((current) => current.map((passage) => (
      passage.id === activePassage.id ? { ...passage, ...patch } : passage
    )));
  }

  function updateGroup(groupId: string, updater: (group: QuestionGroupItem) => QuestionGroupItem) {
    setAllPassages((current) => current.map((passage) => (
      passage.id !== activePassage.id
        ? passage
        : {
            ...passage,
            questionGroups: passage.questionGroups.map((group) => (
              group.id === groupId ? updater(group) : group
            )),
          }
    )));
  }

  function updateQuestion(groupId: string, questionId: string, updater: (question: QuestionCardItem) => QuestionCardItem) {
    updateGroup(groupId, (group) => ({
      ...group,
      questions: group.questions.map((question) => (
        question.id === questionId ? normalizeQuestion(updater(question)) : question
      )),
    }));
  }

  function addQuestionGroup(typeFormat: QuestionTypeFormat = "FILL_IN_BLANK") {
    const nextNo = nextQuestionNumber(passages);
    setAllPassages((current) => current.map((passage) => (
      passage.id === activePassage.id
        ? { ...passage, questionGroups: [...passage.questionGroups, createGroup(nextNo, typeFormat)] }
        : passage
    )));
    setSelectedQuestionNo(nextNo);
  }

  function createQuestionGroupFromDraft(draft: ReadingQuestionGroupDraft) {
    const nextNo = nextQuestionNumber(passages);
    const group = createGroup(nextNo, draft.typeFormat, draft.questionCount, draft);
    setAllPassages((current) => current.map((passage) => (
      passage.id === activePassage.id
        ? { ...passage, questionGroups: [...passage.questionGroups, group] }
        : passage
    )));
    setSelectedQuestionNo(nextNo);
    setShowQuestionGroupDialog(false);
  }

  function changeGroupType(groupId: string, typeFormat: QuestionTypeFormat) {
    const definition = getReadingQuestionTypeDefinition(typeFormat);
    const answerSource = definition.defaultAnswerSource ?? "PASSAGE";
    updateGroup(groupId, (current) => ({
      ...current,
      typeFormat,
      instructions: definition.defaultInstructions,
      wordLimitRule: defaultWordLimit(typeFormat),
      answerSource,
      requiredAnswerCount: definition.defaultRequiredAnswerCount,
      sharedOptions: questionTypeUsesSharedOptions(typeFormat, answerSource)
        ? createDefaultSharedOptions(typeFormat, () => newId("shared-option"))
        : [],
      allowOptionReused: Boolean(definition.usesSharedOptions),
      questions: current.questions.map((question) => normalizeQuestion({
        ...question,
        typeFormat,
        options: needsOptions(typeFormat) ? defaultOptions() : [],
        correctAnswers: [],
      })),
    }));
  }

  function addQuestionToGroup(groupId: string) {
    const questionId = newId("question");
    setAllPassages((current) => renumberPassageQuestions(current.map((passage) => (
      passage.id !== activePassage.id
        ? passage
        : {
            ...passage,
            questionGroups: passage.questionGroups.map((group) => (
              group.id === groupId
                ? {
                    ...group,
                    questions: [
                      ...group.questions,
                      { ...createQuestion(0, group.typeFormat), id: questionId },
                    ],
                  }
                : group
            )),
          }
    ))));
    window.setTimeout(() => {
      document.getElementById(questionId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }

  function addQuestionToActiveGroup() {
    const group = activePassage.questionGroups[0];
    if (group) addQuestionToGroup(group.id);
    else addQuestionGroup();
  }

  function deleteGroup(groupId: string) {
    const group = activePassage.questionGroups.find((item) => item.id === groupId);
    const hasEnteredData = group?.questions.some((question) => (
      question.prompt.trim() || question.correctAnswers.length > 0 || question.explanation?.trim()
    ));
    if (hasEnteredData && !window.confirm(
      `Xóa “${group?.title}” sẽ xóa toàn bộ ${group?.questions.length} câu và đáp án trong group. Bạn có muốn tiếp tục?`,
    )) return;
    setAllPassages((current) => renumberPassageQuestions(current.map((passage) => (
      passage.id === activePassage.id
        ? { ...passage, questionGroups: passage.questionGroups.filter((group) => group.id !== groupId) }
        : passage
    ))));
  }

  function deleteQuestion(groupId: string, questionId: string) {
    const question = activePassage.questionGroups
      .find((group) => group.id === groupId)
      ?.questions.find((item) => item.id === questionId);
    const hasEnteredData = Boolean(question?.prompt.trim()
      || question?.correctAnswers.length
      || question?.explanation?.trim());
    if (hasEnteredData && !window.confirm(
      `Câu ${question?.number} đã có dữ liệu. Bạn có muốn xóa câu này?`,
    )) return;
    setAllPassages((current) => renumberPassageQuestions(current.map((passage) => (
      passage.id !== activePassage.id
        ? passage
        : {
            ...passage,
            questionGroups: passage.questionGroups.map((group) => (
              group.id === groupId
                ? { ...group, questions: group.questions.filter((question) => question.id !== questionId) }
                : group
            )),
          }
    ))));
  }

  function updateGroupQuestionCount(groupId: string, requestedCount: number) {
    const safeCount = Math.min(20, Math.max(1, requestedCount || 1));
    setAllPassages((current) => renumberPassageQuestions(current.map((passage) => (
      passage.id !== activePassage.id
        ? passage
        : {
            ...passage,
            questionGroups: passage.questionGroups.map((group) => {
              if (group.id !== groupId) return group;
              if (safeCount <= group.questions.length) {
                return { ...group, questions: group.questions.slice(0, safeCount) };
              }
              const additions = Array.from(
                { length: safeCount - group.questions.length },
                () => createQuestion(0, group.typeFormat),
              );
              return { ...group, questions: [...group.questions, ...additions] };
            }),
          }
    ))));
  }

  function requestGroupQuestionCount(group: QuestionGroupItem, requestedCount: number) {
    const safeCount = Math.min(20, Math.max(1, requestedCount || 1));
    const removedQuestions = group.questions.slice(safeCount);
    const removesEnteredData = removedQuestions.some((question) => (
      question.prompt.trim() || question.correctAnswers.length > 0 || question.explanation?.trim()
    ));
    if (removesEnteredData && !window.confirm(
      `Giảm còn ${safeCount} câu sẽ xóa ${removedQuestions.length} câu cuối cùng cùng dữ liệu đã nhập. Bạn có muốn tiếp tục?`,
    )) return;
    updateGroupQuestionCount(group.id, safeCount);
  }

  function duplicateGroup(group: QuestionGroupItem) {
    const sharedOptionIdMap = new Map<string, string>();
    const sharedOptions = (group.sharedOptions ?? []).map((option) => {
      const nextId = newId("shared-option");
      sharedOptionIdMap.set(option.id, nextId);
      return { ...option, id: nextId };
    });
    const clonedQuestions = group.questions.map((question) => {
      const optionIdMap = new Map<string, string>();
      const options = question.options.map((option) => {
        const nextId = newId("option");
        optionIdMap.set(option.id, nextId);
        return { ...option, id: nextId };
      });
      return {
        ...question,
        id: newId("question"),
        number: 0,
        options,
        correctAnswers: question.correctAnswers.map((answer) => (
          optionIdMap.get(answer) ?? sharedOptionIdMap.get(answer) ?? answer
        )),
      };
    });
    setAllPassages((current) => renumberPassageQuestions(current.map((passage) => (
      passage.id === activePassage.id
        ? {
            ...passage,
            questionGroups: [
              ...passage.questionGroups,
              {
                ...group,
                id: newId("group"),
                title: group.titleMode === "CUSTOM" ? `${group.title} (bản sao)` : group.title,
                sharedOptions,
                questions: clonedQuestions,
              },
            ],
          }
        : passage
    ))));
  }

  function renumberQuestions() {
    setAllPassages(renumberPassageQuestions);
  }

  function addPassage() {
    if (!fullReadingTest || passages.length >= 3) return;
    const usedPassageNumbers = new Set(passages.map((passage) => passage.passageNo));
    const nextPassageNo = [1, 2, 3].find((passageNo) => !usedPassageNumbers.has(passageNo)) ?? passages.length + 1;
    const passage = emptyPassage(nextPassageNo);
    setPassages((current) => [...current, passage].sort((a, b) => a.passageNo - b.passageNo));
    setActivePassageId(passage.id);
  }

  function removeActivePassage() {
    if (!fullReadingTest || passages.length <= 1) return;
    const hasEnteredData = Boolean(
      plainTextFromHtml(activePassage.content)
      || activePassage.title.trim() !== `Reading Passage ${activePassage.passageNo}`
      || activePassage.questionGroups.length > 0,
    );
    if (hasEnteredData && !window.confirm(
      `Xóa Passage ${activePassage.passageNo} sẽ xóa toàn bộ nội dung và câu hỏi trong passage này. Bạn có muốn tiếp tục?`,
    )) return;

    const activeIndex = passages.findIndex((passage) => passage.id === activePassage.id);
    const remaining = renumberPassageQuestions(
      passages
        .filter((passage) => passage.id !== activePassage.id)
        .map((passage, index) => ({ ...passage, passageNo: index + 1 })),
    );
    const nextActive = remaining[Math.min(Math.max(activeIndex, 0), remaining.length - 1)];
    setPassages(remaining);
    setActivePassageId(nextActive?.id ?? "");
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F8F6FA] text-[#211A1D]">
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-[#e3dce2] bg-white px-5 shadow-sm">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            to="/test-bank"
            className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-[#746A6E] hover:text-[#8f4458]"
          >
            <ArrowLeft size={16} />
            <span>Ngân hàng đề</span>
          </Link>
          <span className="h-4 w-px bg-[#e3dce2]" />
          <input
            id="reading-builder-title"
            value={testTitle}
            onChange={(event) => setTestTitle(event.target.value)}
            placeholder="Tên đề Reading"
            className="min-w-[220px] flex-1 border-b border-transparent bg-transparent font-display text-sm font-bold text-[#211A1D] focus:border-[#8f4458] focus:outline-none lg:min-w-[420px]"
          />
          <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-[#746A6E]">
            {testRecord?.status ?? "DRAFT"}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-1.5 text-xs text-[#746A6E] md:flex">
            {saveStatus === "SAVING" ? (
              <span className="flex items-center gap-1 text-[#8a6000]">
                <SpinnerGap size={14} className="animate-spin" />
                Đang lưu...
              </span>
            ) : saveStatus === "SAVED" ? (
              <span className="flex items-center gap-1 text-[#237653]">
                <Check size={14} />
                Đã lưu lúc {lastSavedTime}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[#b4232d]">
                <WarningCircle size={14} />
                Lỗi lưu
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowValidationModal(true)}
            className={`flex min-h-[34px] items-center gap-1.5 rounded-full px-3 text-xs font-bold transition ${
              validationIssues.some((issue) => issue.severity === "ERROR")
                ? "bg-rose-50 text-[#b4232d] hover:bg-rose-100"
                : "bg-emerald-50 text-[#237653]"
            }`}
          >
            <WarningCircle size={14} />
            <span>{validationIssues.length} mục cần xử lý</span>
          </button>

          <button
            type="button"
            onClick={() => setShowShortcutsModal(true)}
            className="grid h-9 w-9 place-items-center rounded-xl border border-[#e3dce2] bg-white text-[#746A6E] hover:bg-[#f1eef4]"
            title="Phím tắt"
          >
            <Question size={18} />
          </button>

          <button
            type="button"
            onClick={() => void saveDraft()}
            disabled={!loaded || saveStatus === "SAVING"}
            className="min-h-[38px] rounded-xl border border-[#e3dce2] px-3.5 text-xs font-bold text-[#211A1D] hover:bg-[#f1eef4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Lưu nháp
          </button>

          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            disabled={!draftTest}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#8f4458] px-3.5 text-xs font-bold text-[#8f4458] hover:bg-[#f7e7ec] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Eye size={16} />
            Xem trước
          </button>

          <button
            type="button"
            onClick={() => setShowValidationModal(true)}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#8f4458] px-4 text-xs font-bold text-white shadow-sm hover:bg-[#743447]"
          >
            <ShieldCheck size={16} />
            Xuất bản
          </button>
        </div>
      </header>

      <nav id="reading-passage-navigation" className="flex h-11 shrink-0 items-center justify-between border-b border-[#e3dce2] bg-[#f1eef4] px-5">
        <div className="flex gap-1">
          {passages.map((passage) => (
            <button
              id={`passage-tab-${passage.id}`}
              key={passage.id}
              type="button"
              onClick={() => setActivePassageId(passage.id)}
              className={`min-h-[36px] rounded-t-xl px-5 text-xs font-bold transition ${
                activePassage.id === passage.id
                  ? "bg-white text-[#8f4458] shadow-sm"
                  : "text-[#746A6E] hover:bg-[#e3dce2]"
              }`}
            >
              Passage {passage.passageNo}
            </button>
          ))}
          {fullReadingTest && (
            <div className="ml-2 flex items-center gap-1 border-l border-[#d8ced6] pl-3">
              <span className="mr-1 text-[11px] font-bold text-[#746A6E]">{passages.length}/3</span>
              <button
                type="button"
                onClick={removeActivePassage}
                disabled={passages.length <= 1}
                aria-label={`Xóa Passage ${activePassage.passageNo}`}
                title="Xóa passage đang chọn"
                className="inline-flex size-9 items-center justify-center rounded-lg border border-[#d8ced6] bg-white text-[#746A6E] transition hover:border-[#8f4458] hover:text-[#8f4458] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus size={15} weight="bold" />
              </button>
              <button
                type="button"
                onClick={addPassage}
                disabled={passages.length >= 3}
                aria-label="Thêm passage"
                title="Thêm passage"
                className="inline-flex size-9 items-center justify-center rounded-lg bg-[#8f4458] text-white transition hover:bg-[#743447] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={15} weight="bold" />
              </button>
            </div>
          )}
        </div>

        <span className="hidden text-xs font-semibold text-[#746A6E] md:inline">
          Reading Builder • {fullReadingTest ? `Full Test · ${passages.length}/3 passage` : `Bài lẻ · Passage ${activePassage.passageNo}`} • {totalQuestions}/{navigationCount} câu
        </span>
      </nav>

      <div className="relative flex flex-1 overflow-hidden">
        <div ref={splitWorkspaceRef} className="relative flex min-w-0 flex-1 overflow-hidden">
        <section
          style={{ flexBasis: `calc(${leftWidth}% - 5px)` }}
          className="custom-scrollbar min-w-0 shrink-0 overflow-x-hidden overflow-y-auto border-r border-[#e3dce2] bg-white p-5 2xl:p-6"
        >
          <div className="mb-3 grid gap-3 rounded-2xl border border-[#e3dce2] bg-white p-3 shadow-sm md:grid-cols-[140px_minmax(0,1fr)]">
            <label>
              <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wider text-[#746A6E]">Số passage</span>
              <input
                type="number"
                value={activePassage.passageNo}
                min={1}
                max={3}
                onChange={(event) => updateActivePassage({ passageNo: Number(event.target.value) })}
                className="min-h-[40px] w-full rounded-xl border border-[#e3dce2] bg-[#F8F6FA] px-3 text-xs font-bold focus:border-[#8f4458] focus:bg-white focus:outline-none"
              />
            </label>
            <label>
              <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wider text-[#746A6E]">Tiêu đề passage</span>
              <input
                value={activePassage.title}
                onChange={(event) => updateActivePassage({ title: event.target.value })}
                className="min-h-[40px] w-full rounded-xl border border-[#e3dce2] bg-[#F8F6FA] px-3.5 text-xs font-bold focus:border-[#8f4458] focus:bg-white focus:outline-none"
                placeholder="VD: The History of Tea and Trade in Asia"
              />
            </label>
          </div>

          {/* Live Passage Analytics Bar */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#F8F6FA] px-3.5 py-2 border border-[#e3dce2] text-[11px] font-bold text-[#746A6E]">
            <div className="flex items-center gap-4">
              <span className="text-[#8f4458] font-extrabold">{passageStats.words} từ</span>
              <span>{passageStats.chars} ký tự</span>
              <span>{passageStats.paragraphs} đoạn văn</span>
              <span>~{passageStats.readingTimeMins} phút đọc</span>
            </div>
            <span className="text-[10px] text-[#746A6E]/80">Mục tiêu IELTS chuẩn: 700 - 900 từ / passage</span>
          </div>

          <ReadingRichTextEditor
            key={activePassage.id}
            passageId={activePassage.id}
            value={activePassage.content}
            onChange={(content) => updateActivePassage({ content })}
            evidenceSpan={selectedQuestion?.passageSpan}
            evidenceQuestionNo={selectedQuestion?.number}
            evidenceFocusRequest={evidenceFocusRequest}
            captureQuestionNo={evidenceCaptureTarget?.questionNo}
            onCancelEvidenceCapture={() => setEvidenceCaptureTarget(null)}
            onEvidenceCaptured={(evidence) => {
              if (!evidenceCaptureTarget) return;
              updateQuestion(evidenceCaptureTarget.groupId, evidenceCaptureTarget.questionId, (question) => ({
                ...question,
                passageSpan: evidence,
              }));
              setSelectedQuestionNo(evidenceCaptureTarget.questionNo);
              setEvidenceCaptureTarget(null);
              setEvidenceFocusRequest((current) => current + 1);
            }}
          />
        </section>

        <div
          onMouseDown={() => setIsResizing(true)}
          onDoubleClick={() => setLeftWidth(50)}
          className={`split-resizer ${isResizing ? "is-dragging" : ""}`}
          title="Kéo để chỉnh độ rộng hai bên"
        >
          <div className="split-resizer-handle" />
        </div>

        <section
          id="reading-question-panel"
          style={{ flexBasis: `calc(${100 - leftWidth}% - 5px)` }}
          className="custom-scrollbar flex min-w-0 shrink-0 flex-col gap-5 overflow-y-auto bg-[#F8F6FA] p-5 2xl:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e3dce2] bg-white p-3.5 shadow-sm">
            <div>
              <span className="font-display text-sm font-bold text-[#211A1D]">
                Question Groups ({activePassage.questionGroups.length})
              </span>
              <p className="mt-0.5 text-[11px] text-[#746A6E]">Mỗi group tương ứng một dạng bài IELTS Reading.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={renumberQuestions}
                className="min-h-[36px] rounded-xl border border-[#e3dce2] px-3 text-xs font-bold text-[#211A1D] hover:bg-[#f1eef4]"
              >
                Đánh số lại
              </button>
              <button
                type="button"
                onClick={() => setShowQuestionGroupDialog(true)}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#8f4458] px-3.5 text-xs font-bold text-white hover:bg-[#743447]"
              >
                <Plus size={16} />
                Thêm Question Group
              </button>
            </div>
          </div>

          {activePassage.questionGroups.length === 0 && (
            <div className="rounded-[18px] border border-dashed border-[#e3dce2] bg-white p-8 text-center">
              <NotePencil size={32} className="mx-auto text-[#8f4458]" />
              <h3 className="mt-3 font-display text-base font-extrabold text-[#211A1D]">Passage này chưa có câu hỏi</h3>
              <p className="mt-1 text-sm text-[#746A6E]">Tạo group đầu tiên để nhập câu hỏi và đáp án.</p>
              <button
                type="button"
                onClick={() => setShowQuestionGroupDialog(true)}
                className="mt-4 inline-flex min-h-[38px] items-center gap-2 rounded-xl bg-[#8f4458] px-4 text-xs font-bold text-white hover:bg-[#743447]"
              >
                <Plus size={16} />
                Tạo group
              </button>
            </div>
          )}

          {activePassage.questionGroups.map((group) => {
            const groupDefinition = getReadingQuestionTypeDefinition(group.typeFormat);
            const usesSharedOptions = questionTypeUsesSharedOptions(group.typeFormat, group.answerSource);
            const usesWordLimit = questionTypeUsesWordLimit(group.typeFormat, group.answerSource);
            return (
            <article id={group.id} key={group.id} className="rounded-[18px] border border-[#e3dce2] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e3dce2] pb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={group.title}
                      aria-label="Tiêu đề Question Group"
                      onChange={(event) => updateGroup(group.id, (current) => ({
                        ...current,
                        title: event.target.value || autoGroupTitle(current.startQuestionNo, current.endQuestionNo),
                        titleMode: event.target.value ? "CUSTOM" : "AUTO",
                      }))}
                      className="min-h-10 min-w-0 flex-1 rounded-xl border border-[#e3dce2] px-3 text-xs font-extrabold text-[#743447] focus:border-[#8f4458] focus:outline-none focus:ring-2 focus:ring-[#8f4458]/10 sm:min-w-[220px]"
                    />
                    <select
                      value={group.typeFormat}
                      aria-label="Dạng bài của Question Group"
                      onChange={(event) => changeGroupType(group.id, event.target.value as QuestionTypeFormat)}
                      className="min-h-10 w-full min-w-0 rounded-xl border border-[#e3dce2] bg-white px-3 text-xs font-bold text-[#211A1D] focus:border-[#8f4458] focus:outline-none focus:ring-2 focus:ring-[#8f4458]/10 sm:w-auto sm:max-w-[240px]"
                    >
                      {readingQuestionTypes.map((type) => (
                        <option key={type} value={type}>{readingQuestionTypeLabels[type]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-[#746A6E]">
                    <span className="rounded-full bg-[#f7e7ec] px-2.5 py-1 text-[#8f4458]">
                      Câu {group.startQuestionNo}–{group.endQuestionNo}
                    </span>
                    <span>{groupDefinition.description}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => duplicateGroup(group)}
                    className="rounded-lg p-1.5 text-[#746A6E] hover:bg-[#f1eef4]"
                    title="Nhân bản group"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteGroup(group.id)}
                    className="rounded-lg p-1.5 text-[#b4232d] hover:bg-rose-50"
                    title="Xóa group"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div className="grid gap-3 rounded-xl border border-[#e3dce2] bg-[#f8f6fa] p-3 sm:grid-cols-[160px_minmax(0,1fr)]">
                  <label>
                    <span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Số lượng câu hỏi</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={group.questions.length}
                      onChange={(event) => requestGroupQuestionCount(group, Number(event.target.value) || 1)}
                      className="min-h-10 w-full rounded-xl border border-[#e3dce2] bg-white px-3 text-xs font-bold focus:border-[#8f4458] focus:outline-none"
                    />
                  </label>
                  {group.typeFormat === "MULTIPLE_ANSWERS" ? (
                    <label>
                      <span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Số đáp án đúng cần chọn mỗi câu</span>
                      <input
                        type="number"
                        min={2}
                        max={6}
                        value={group.requiredAnswerCount ?? 2}
                        onChange={(event) => updateGroup(group.id, (current) => ({
                          ...current,
                          requiredAnswerCount: Math.min(6, Math.max(2, Number(event.target.value) || 2)),
                        }))}
                        className="min-h-10 w-full rounded-xl border border-[#e3dce2] bg-white px-3 text-xs font-bold focus:border-[#8f4458] focus:outline-none"
                      />
                    </label>
                  ) : (
                    <div className="flex items-center rounded-xl px-2 text-[11px] leading-5 text-[#746A6E]">
                      Thay đổi số lượng sẽ tạo thêm hoặc bỏ các card cuối nhóm, sau đó tự đánh số lại toàn bộ đề.
                    </div>
                  )}
                </div>

                <label>
                  <span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Instructions</span>
                  <textarea
                    rows={2}
                    value={group.instructions}
                    onChange={(event) => updateGroup(group.id, (current) => ({ ...current, instructions: event.target.value }))}
                    className="w-full rounded-xl border border-[#e3dce2] p-3 text-xs focus:border-[#8f4458] focus:outline-none"
                  />
                </label>

                {groupDefinition.supportsOptionBank && (
                  <fieldset className="rounded-xl border border-[#e3dce2] p-3">
                    <legend className="px-1 text-[11px] font-bold text-[#746A6E]">Nguồn đáp án cho Summary</legend>
                    <div className="flex flex-wrap gap-2">
                      {(["PASSAGE", "OPTION_BANK"] as const).map((source) => (
                        <button
                          key={source}
                          type="button"
                          onClick={() => updateGroup(group.id, (current) => ({
                            ...current,
                            answerSource: source,
                            wordLimitRule: source === "PASSAGE" ? (current.wordLimitRule || defaultWordLimit(current.typeFormat)) : "",
                            sharedOptions: source === "OPTION_BANK" && !(current.sharedOptions?.length)
                              ? createDefaultSharedOptions(current.typeFormat, () => newId("shared-option"))
                              : current.sharedOptions,
                            questions: current.questions.map((question) => normalizeQuestion({ ...question, correctAnswers: [] })),
                          }))}
                          className={`min-h-9 rounded-xl border px-3 text-xs font-bold ${
                            group.answerSource === source
                              ? "border-[#8f4458] bg-[#f7e7ec] text-[#743447]"
                              : "border-[#e3dce2] text-[#746A6E] hover:bg-[#f8f6fa]"
                          }`}
                        >
                          {source === "PASSAGE" ? "Lấy từ passage" : "Chọn từ Option bank"}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}

                {usesWordLimit && (
                  <label>
                    <span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Word limit rule</span>
                    <input
                      value={group.wordLimitRule}
                      onChange={(event) => updateGroup(group.id, (current) => ({ ...current, wordLimitRule: event.target.value }))}
                      className="min-h-[36px] w-full rounded-xl border border-[#e3dce2] px-3 text-xs focus:border-[#8f4458] focus:outline-none"
                    />
                  </label>
                )}

                {usesSharedOptions && (
                  <div className="rounded-xl border border-[#e3dce2] p-3">
                    <label>
                    <span className="mb-1 block text-[11px] font-bold text-[#746A6E]">
                      Option bank dùng chung • mỗi dòng một lựa chọn
                    </span>
                    <textarea
                      rows={4}
                      value={sharedOptionsToText(group.sharedOptions)}
                      onChange={(event) => updateGroup(group.id, (current) => {
                        const sharedOptions = parseSharedOptions(event.target.value, current.sharedOptions);
                        const optionIds = new Set(sharedOptions.map((option) => option.id));
                        return {
                          ...current,
                          sharedOptions,
                          questions: current.questions.map((question) => normalizeQuestion({
                            ...question,
                            correctAnswers: question.correctAnswers.filter((answer) => optionIds.has(answer)),
                          })),
                        };
                      })}
                      placeholder={"i. Heading one\nii. Heading two\nA. Person A"}
                      className="w-full rounded-xl border border-[#e3dce2] p-3 text-xs focus:border-[#8f4458] focus:outline-none"
                    />
                    </label>
                    <label className="mt-2 flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#f8f6fa] px-3 text-[11px] font-semibold text-[#746A6E]">
                      <input
                        type="checkbox"
                        checked={Boolean(group.allowOptionReused)}
                        onChange={(event) => updateGroup(group.id, (current) => ({
                          ...current,
                          allowOptionReused: event.target.checked,
                        }))}
                        className="accent-[#8f4458]"
                      />
                      Cho phép một option được dùng cho nhiều câu
                    </label>
                  </div>
                )}

                <div className="space-y-3">
                  {group.questions.map((question) => (
                    <div
                      key={question.id}
                      id={question.id}
                      onClick={() => setSelectedQuestionNo(question.number)}
                      className={`rounded-xl border p-4 transition ${
                        question.hasError
                          ? "border-rose-200 bg-rose-50/30"
                          : selectedQuestionNo === question.number
                          ? "border-[#8f4458] bg-white ring-2 ring-[#8f4458]/20"
                          : "border-[#e3dce2] bg-white"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e3dce2]/70 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#8f4458] text-xs font-bold text-white">
                            {question.number}
                          </span>
                          <span className="text-xs font-bold text-[#211A1D]">Câu hỏi {question.number}</span>
                          {question.hasError && (
                            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-[#b4232d]">
                              {question.errorMessage}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-[#f1eef4] px-2.5 py-1.5 text-[10px] font-bold text-[#746A6E]">
                            {readingQuestionTypeLabels[group.typeFormat]}
                          </span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteQuestion(group.id, question.id);
                            }}
                            className="rounded-lg p-1.5 text-[#b4232d] hover:bg-rose-50"
                            title="Xóa câu hỏi"
                          >
                            <Trash size={15} />
                          </button>
                        </div>
                      </div>

                      <label className="mt-3 block">
                        <span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Nội dung câu hỏi</span>
                        <textarea
                          rows={2}
                          value={question.prompt}
                          onChange={(event) => updateQuestion(group.id, question.id, (current) => ({ ...current, prompt: event.target.value }))}
                          className="w-full rounded-xl border border-[#e3dce2] p-3 text-xs focus:border-[#8f4458] focus:outline-none"
                          placeholder="Nhập câu hỏi hoặc câu cần điền..."
                        />
                      </label>

                      <AnswerEditor
                        question={question}
                        sharedOptions={usesSharedOptions ? group.sharedOptions : undefined}
                        requiredAnswerCount={group.requiredAnswerCount}
                        onChange={(nextQuestion) => updateQuestion(group.id, question.id, () => nextQuestion)}
                      />

                      <div className={`mt-4 rounded-xl border p-3 ${
                        question.passageSpan
                          ? "border-emerald-200 bg-emerald-50/70"
                          : "border-dashed border-[#d8ced6] bg-[#f8f6fa]"
                      }`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-2.5">
                            <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${
                              question.passageSpan ? "bg-emerald-100 text-emerald-700" : "bg-[#f7e7ec] text-[#8f4458]"
                            }`}>
                              <Highlighter size={17} weight="bold" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-[11px] font-extrabold text-[#211A1D]">
                                {question.passageSpan ? "Đã gắn vị trí bằng chứng" : "Highlight vị trí đáp án"}
                              </p>
                              <p className="mt-0.5 max-h-10 overflow-hidden text-[11px] leading-5 text-[#746A6E]">
                                {question.passageSpan?.quote
                                  ? `“${question.passageSpan.quote}”`
                                  : "Bôi đoạn văn trong Passage dùng để đối chiếu câu trả lời."}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            {question.passageSpan && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedQuestionNo(question.number);
                                  setEvidenceFocusRequest((current) => current + 1);
                                }}
                                className="min-h-9 rounded-lg border border-emerald-300 bg-white px-3 text-[11px] font-bold text-emerald-800 hover:bg-emerald-50"
                              >
                                Xem vị trí
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedQuestionNo(question.number);
                                setEvidenceCaptureTarget({
                                  groupId: group.id,
                                  questionId: question.id,
                                  questionNo: question.number,
                                });
                              }}
                              className="min-h-9 rounded-lg bg-[#8f4458] px-3 text-[11px] font-bold text-white hover:bg-[#743447]"
                            >
                              {question.passageSpan ? "Gắn lại" : "Gắn vị trí"}
                            </button>
                            {question.passageSpan && (
                              <button
                                type="button"
                                aria-label={`Xóa vị trí bằng chứng của câu ${question.number}`}
                                title="Xóa vị trí đã gắn"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  updateQuestion(group.id, question.id, (current) => ({
                                    ...current,
                                    passageSpan: undefined,
                                  }));
                                }}
                                className="grid size-9 place-items-center rounded-lg border border-rose-200 bg-white text-[#b4232d] hover:bg-rose-50"
                              >
                                <Trash size={15} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 border-t border-[#e3dce2]/70 pt-3 md:grid-cols-2">
                        <label>
                          <span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Giải thích đáp án</span>
                          <textarea
                            rows={2}
                            value={question.explanation ?? ""}
                            onChange={(event) => updateQuestion(group.id, question.id, (current) => ({ ...current, explanation: event.target.value }))}
                            className="w-full rounded-xl border border-[#e3dce2] p-3 text-xs focus:border-[#8f4458] focus:outline-none"
                            placeholder="Phân tích key, paraphrase, vị trí thông tin..."
                          />
                        </label>
                        <label>
                          <span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Teacher note nội bộ</span>
                          <textarea
                            rows={2}
                            value={question.teacherNote ?? ""}
                            onChange={(event) => updateQuestion(group.id, question.id, (current) => ({ ...current, teacherNote: event.target.value }))}
                            className="w-full rounded-xl border border-[#e3dce2] p-3 text-xs focus:border-[#8f4458] focus:outline-none"
                            placeholder="Lưu ý khi giảng, bẫy thường gặp..."
                          />
                        </label>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addQuestionToGroup(group.id)}
                    className="inline-flex min-h-[36px] items-center gap-2 rounded-xl border border-[#e3dce2] bg-white px-3 text-xs font-bold text-[#8f4458] hover:bg-[#f7e7ec]"
                  >
                    <Plus size={15} />
                    Thêm câu hỏi trong group
                  </button>
                </div>
              </div>
            </article>
            );
          })}
        </section>
        </div>

        <aside className="hidden w-56 shrink-0 border-l border-[#e3dce2] bg-white p-4 xl:block">
          <div className="flex items-center justify-between border-b border-[#e3dce2] pb-2">
            <span className="font-display text-xs font-bold text-[#211A1D]">Question Navigator</span>
            <span className="text-[10px] font-extrabold text-[#746A6E]">1–{navigationCount}</span>
          </div>

          <div className="q-nav-grid mt-4">
            {Array.from({ length: navigationCount }, (_, index) => index + 1).map((no) => {
              const question = passages.flatMap((passage) => passage.questionGroups).flatMap((group) => group.questions).find((item) => item.number === no);
              const completed = question?.isComplete && !question?.hasError;
              const hasError = question?.hasError;
              const active = selectedQuestionNo === no;

              return (
                <button
                  key={no}
                  type="button"
                  onClick={() => {
                    setSelectedQuestionNo(no);
                    if (question) document.getElementById(question.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className={`q-nav-btn ${completed ? "is-completed" : ""} ${hasError ? "has-error" : ""} ${active ? "is-active" : ""}`}
                >
                  {no}
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-1.5 border-t border-[#e3dce2] pt-3 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded border border-[#a3d5c1] bg-[#e4f3ed]" />
              <span className="font-semibold text-[#237653]">Đã hoàn thiện</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded border border-[#f2aeb1] bg-[#fbe8e9]" />
              <span className="font-semibold text-[#b4232d]">Cần sửa</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded border border-[#8f4458] bg-[#f7e7ec]" />
              <span className="font-semibold text-[#8f4458]">Đang chọn</span>
            </div>
          </div>
        </aside>
      </div>

      <ReadingQuestionGroupDialog
        open={showQuestionGroupDialog}
        startQuestionNo={nextQuestionNumber(passages)}
        createId={newSharedOptionId}
        onClose={() => setShowQuestionGroupDialog(false)}
        onCreate={createQuestionGroupFromDraft}
      />

      {showValidationModal && draftTest && (
        <PublishValidationModal
          test={draftTest}
          onClose={() => setShowValidationModal(false)}
          onPublished={async () => {
            if (!testId) return;
            await saveDraft();
            await apiFetch(`/admin/test-bank/${testId}/status`, {
              method: "PATCH",
              body: JSON.stringify({ status: "PUBLISHED" }),
            });
            setShowValidationModal(false);
            navigate("/test-bank");
          }}
        />
      )}

      {showPreviewModal && draftTest && (
        <TestPreviewModal test={draftTest} onClose={() => setShowPreviewModal(false)} />
      )}

      {showShortcutsModal && (
        <KeyboardShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}
    </div>
  );
}
