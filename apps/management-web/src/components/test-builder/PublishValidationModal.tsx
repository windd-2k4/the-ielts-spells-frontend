import {
  ArrowRight,
  CheckCircle,
  ShieldCheck,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useState } from "react";
import type {
  ListeningPartSection,
  PassageSection,
  QuestionGroupItem,
  QuestionCardItem,
  QuestionTypeFormat,
  TestBankItem,
  ValidationIssue,
} from "../../library-types";
import {
  questionTypeUsesSharedOptions,
  questionTypeUsesWordLimit,
  readingQuestionTypes,
} from "./readingQuestionGroupConfig";

type Props = {
  test: TestBankItem;
  onClose: () => void;
  onPublished: () => Promise<void> | void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isQuestionType(value: unknown): value is QuestionTypeFormat {
  return typeof value === "string" && readingQuestionTypes.includes(value as QuestionTypeFormat);
}

function readPassageSpan(value: unknown): QuestionCardItem["passageSpan"] {
  if (!isRecord(value)) return undefined;
  const start = Number(value.start);
  const end = Number(value.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) return undefined;
  return {
    start,
    end,
    quote: typeof value.quote === "string" ? value.quote : undefined,
  };
}

function readQuestions(value: unknown): QuestionCardItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((question) => ({
    id: typeof question.id === "string" ? question.id : "question",
    number: typeof question.number === "number" ? question.number : 0,
    typeFormat: isQuestionType(question.typeFormat) ? question.typeFormat : "FILL_IN_BLANK",
    prompt: typeof question.prompt === "string" ? question.prompt : "",
    options: Array.isArray(question.options) ? question.options as QuestionCardItem["options"] : [],
    correctAnswers: Array.isArray(question.correctAnswers) ? question.correctAnswers.map(String) : [],
    acceptableAnswers: Array.isArray(question.acceptableAnswers) ? question.acceptableAnswers.map(String) : [],
    explanation: typeof question.explanation === "string" ? question.explanation : "",
    trapAnalysis: typeof question.trapAnalysis === "string" ? question.trapAnalysis : "",
    vocabularyNotes: typeof question.vocabularyNotes === "string" ? question.vocabularyNotes : "",
    teacherNote: typeof question.teacherNote === "string" ? question.teacherNote : "",
    passageSpan: readPassageSpan(question.passageSpan),
    isComplete: Boolean(question.isComplete),
    hasError: Boolean(question.hasError),
    errorMessage: typeof question.errorMessage === "string" ? question.errorMessage : undefined,
  }));
}

function readGroups(value: unknown): QuestionGroupItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((group) => ({
    id: typeof group.id === "string" ? group.id : "group",
    title: typeof group.title === "string" ? group.title : "Questions",
    titleMode: group.titleMode === "CUSTOM" ? "CUSTOM" : "AUTO",
    startQuestionNo: typeof group.startQuestionNo === "number" ? group.startQuestionNo : 0,
    endQuestionNo: typeof group.endQuestionNo === "number" ? group.endQuestionNo : 0,
    typeFormat: isQuestionType(group.typeFormat) ? group.typeFormat : "FILL_IN_BLANK",
    instructions: typeof group.instructions === "string" ? group.instructions : "",
    wordLimitRule: typeof group.wordLimitRule === "string" ? group.wordLimitRule : "",
    answerSource: group.answerSource === "OPTION_BANK" ? "OPTION_BANK" : "PASSAGE",
    requiredAnswerCount: typeof group.requiredAnswerCount === "number" ? group.requiredAnswerCount : undefined,
    sharedOptions: Array.isArray(group.sharedOptions) ? group.sharedOptions as QuestionGroupItem["sharedOptions"] : [],
    allowOptionReused: Boolean(group.allowOptionReused),
    linkedAudioTimestamp: typeof group.linkedAudioTimestamp === "string" ? group.linkedAudioTimestamp : undefined,
    questions: readQuestions(group.questions),
    isCollapsed: Boolean(group.isCollapsed),
  }));
}

function readPassages(content: Record<string, unknown>): PassageSection[] {
  const rawPassages = content.passages;
  if (Array.isArray(rawPassages)) {
    return rawPassages.filter(isRecord).map((passage, index) => ({
      id: typeof passage.id === "string" ? passage.id : `passage-${index + 1}`,
      passageNo: typeof passage.passageNo === "number" ? passage.passageNo : index + 1,
      title: typeof passage.title === "string" ? passage.title : `Reading Passage ${index + 1}`,
      content: typeof passage.content === "string" ? passage.content : "",
      teacherAnnotations: Array.isArray(passage.teacherAnnotations)
        ? passage.teacherAnnotations as PassageSection["teacherAnnotations"]
        : [],
      questionGroups: readGroups(passage.questionGroups),
    }));
  }

  const legacyGroups = readGroups(content.questionGroups);
  if (legacyGroups.length > 0) {
    return [{
      id: "legacy-passage-1",
      passageNo: 1,
      title: "Reading Passage 1",
      content: "",
      teacherAnnotations: [],
      questionGroups: legacyGroups,
    }];
  }

  return [];
}

function readListeningParts(content: Record<string, unknown>): ListeningPartSection[] {
  if (!Array.isArray(content.parts)) return [];
  return content.parts.filter(isRecord).map((part, index) => ({
    id: typeof part.id === "string" ? part.id : `listening-part-${index + 1}`,
    partNo: typeof part.partNo === "number" ? part.partNo : index + 1,
    title: typeof part.title === "string" ? part.title : `Listening Part ${index + 1}`,
    audioUrl: typeof part.audioUrl === "string" ? part.audioUrl : undefined,
    audioFilename: typeof part.audioFilename === "string" ? part.audioFilename : undefined,
    audioDurationSeconds: typeof part.audioDurationSeconds === "number" ? part.audioDurationSeconds : undefined,
    transcriptHtml: typeof part.transcriptHtml === "string" ? part.transcriptHtml : "",
    questionGroups: readGroups(part.questionGroups),
  }));
}

function plainTextFromHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function deriveValidationIssues(test: TestBankItem): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const content = test.builderContent ?? {};

  if (!test.title.trim()) {
    issues.push({
      id: "test-title",
      severity: "ERROR",
      sectionTitle: "Thông tin chung",
      message: "Tên đề thi không được để trống.",
      targetId: "reading-builder-title",
    });
  }

  if (!test.durationMinutes || test.durationMinutes <= 0) {
    issues.push({
      id: "duration",
      severity: "ERROR",
      sectionTitle: "Thông tin chung",
      message: "Thời lượng làm bài phải lớn hơn 0 phút.",
      targetId: "test-builder-header",
    });
  }

  if (test.skill === "READING") {
    const passages = readPassages(content);
    const questions = passages.flatMap((passage) => passage.questionGroups).flatMap((group) => group.questions);
    const fullReadingTest = test.testType === "FULL_TEST" || content.format === "FULL";
    if (fullReadingTest && passages.length !== 3) {
      issues.push({
        id: "reading-full-passages",
        severity: "ERROR",
        sectionTitle: "Cấu trúc đề",
        message: "Full Reading cần có đúng 3 passages trước khi xuất bản.",
        targetId: "reading-passage-navigation",
      });
    }
    if (passages.length === 0) {
      issues.push({
        id: "reading-empty",
        severity: "ERROR",
        sectionTitle: "Nội dung Reading",
        message: "Đề Reading chưa có passage nào.",
        targetId: "reading-question-panel",
      });
    }
    if (questions.length === 0) {
      issues.push({
        id: "reading-no-questions",
        severity: "ERROR",
        sectionTitle: "Câu hỏi",
        message: "Đề Reading cần có ít nhất một câu hỏi trước khi xuất bản.",
        targetId: "reading-question-panel",
      });
    }
    passages.forEach((passage) => {
      if (!plainTextFromHtml(passage.content)) {
        issues.push({
          id: `${passage.id}-content`,
          severity: "WARNING",
          sectionTitle: `Passage ${passage.passageNo}`,
          message: "Passage chưa có nội dung bài đọc.",
          targetId: `passage-tab-${passage.id}`,
        });
      }
      if (passage.questionGroups.length === 0) {
        issues.push({
          id: `${passage.id}-groups`,
          severity: "WARNING",
          sectionTitle: `Passage ${passage.passageNo}`,
          message: "Passage chưa có question group.",
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
            sectionTitle: group.title,
            message: "Question group chưa có hướng dẫn.",
            targetId: group.id,
          });
        }
        if (group.questions.length === 0) {
          issues.push({
            id: `${group.id}-questions`,
            severity: "ERROR",
            sectionTitle: group.title || `Passage ${passage.passageNo}`,
            message: "Question group cần có ít nhất một câu hỏi.",
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
            id: `${group.id}-options`,
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
              sectionTitle: group.title,
              questionNo: question.number,
              message: "Chưa nhập nội dung câu hỏi.",
              targetId: question.id,
            });
          }
          if (question.correctAnswers.length === 0) {
            issues.push({
              id: `${question.id}-answer`,
              severity: "ERROR",
              sectionTitle: group.title,
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
  }

  if (test.skill === "LISTENING") {
    const parts = readListeningParts(content);
    const questions = parts.flatMap((part) => part.questionGroups).flatMap((group) => group.questions);
    if (parts.length !== 4) issues.push({ id: "listening-parts", severity: "ERROR", sectionTitle: "Cấu trúc Listening", message: "Full Listening cần có đúng 4 Part.", targetId: "listening-question-panel" });
    if (questions.length !== 40) issues.push({ id: "listening-question-count", severity: "WARNING", sectionTitle: "Cấu trúc Listening", message: `Đề hiện có ${questions.length}/40 câu hỏi.`, targetId: "listening-question-panel" });
    parts.forEach((part) => {
      if (!part.audioUrl) issues.push({ id: `${part.id}-audio`, severity: "ERROR", sectionTitle: `Part ${part.partNo}`, message: "Chưa tải audio cho Part này.", targetId: "listening-question-panel" });
      if (!plainTextFromHtml(part.transcriptHtml)) issues.push({ id: `${part.id}-transcript`, severity: "WARNING", sectionTitle: `Part ${part.partNo}`, message: "Chưa nhập transcript.", targetId: "listening-question-panel" });
      if (part.questionGroups.length === 0) issues.push({ id: `${part.id}-groups`, severity: "ERROR", sectionTitle: `Part ${part.partNo}`, message: "Part chưa có Question Group.", targetId: "listening-question-panel" });
      part.questionGroups.forEach((group) => {
        if (!group.instructions.trim()) issues.push({ id: `${group.id}-instructions`, severity: "WARNING", sectionTitle: group.title, message: "Question Group chưa có instructions.", targetId: group.id });
        group.questions.forEach((question) => {
          if (!question.prompt.trim()) issues.push({ id: `${question.id}-prompt`, severity: "ERROR", sectionTitle: group.title, questionNo: question.number, message: "Chưa nhập nội dung câu hỏi.", targetId: question.id });
          if (question.correctAnswers.length === 0) issues.push({ id: `${question.id}-answer`, severity: "ERROR", sectionTitle: group.title, questionNo: question.number, message: "Chưa nhập đáp án đúng.", targetId: question.id });
        });
      });
    });
    return issues;
  }

  const promptText = typeof content.promptText === "string" ? content.promptText.trim() : "";
  const transcriptText = typeof content.transcriptText === "string" ? content.transcriptText.trim() : "";
  const questionGroups = readGroups(content.questionGroups);
  const questionCount = questionGroups.reduce((sum, group) => sum + group.questions.length, 0);
  if (!promptText && !transcriptText && questionCount === 0 && test.totalQuestions === 0) {
    issues.push({
      id: "empty-test",
      severity: "ERROR",
      sectionTitle: "Nội dung đề",
      message: "Đề chưa có section, task hoặc câu hỏi nào được lưu.",
      targetId: "test-builder-workspace",
    });
  }

  return issues;
}

export default function PublishValidationModal({ test, onClose, onPublished }: Props) {
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const issues = deriveValidationIssues(test);
  const hasBlockingErrors = issues.some((issue) => issue.severity === "ERROR");
  const errorCount = issues.filter((issue) => issue.severity === "ERROR").length;
  const warningCount = issues.filter((issue) => issue.severity === "WARNING").length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl rounded-[22px] bg-white p-6 shadow-2xl space-y-6">
        <div className="flex items-start justify-between border-b border-[#e3dce2] pb-4">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-12 w-12 place-items-center rounded-xl ${
                hasBlockingErrors ? "bg-rose-50 text-[#b4232d]" : "bg-emerald-50 text-[#237653]"
              }`}
            >
              {hasBlockingErrors ? <WarningCircle size={26} /> : <ShieldCheck size={26} />}
            </span>
            <div>
              <h3 className="font-display text-lg font-bold text-[#211A1D]">
                Kiểm tra trước khi xuất bản đề thi
              </h3>
              <p className="text-xs text-[#746A6E]">
                {test.code} • {test.title}
              </p>
            </div>
          </div>

          <button type="button" onClick={onClose} className="rounded-lg p-1 text-[#746A6E] hover:bg-[#f1eef4]">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
            <span className="text-[11px] font-extrabold uppercase text-[#b4232d]">
              Lỗi bắt buộc
            </span>
            <p className="mt-1 text-2xl font-black text-[#b4232d]">{errorCount}</p>
            <p className="mt-0.5 text-[11px] text-[#746A6E]">Phải sửa hết lỗi này mới được xuất bản.</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <span className="text-[11px] font-extrabold uppercase text-[#8a6000]">
              Cảnh báo
            </span>
            <p className="mt-1 text-2xl font-black text-[#8a6000]">{warningCount}</p>
            <p className="mt-0.5 text-[11px] text-[#746A6E]">Có thể xuất bản nhưng nên hoàn thiện.</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-display text-xs font-bold text-[#211A1D] uppercase tracking-wider">
            Danh sách mục cần xử lý
          </h4>

          <div className="custom-scrollbar max-h-56 space-y-2.5 overflow-y-auto">
            {issues.length === 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <CheckCircle size={18} className="mt-0.5 shrink-0 text-[#237653]" />
                <p className="text-xs font-semibold leading-5 text-[#237653]">
                  Draft hiện tại đủ điều kiện cơ bản để xuất bản.
                </p>
              </div>
            )}
            {issues.map((issue) => (
              <div
                key={issue.id}
                className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 ${
                  issue.severity === "ERROR"
                    ? "border-rose-200 bg-rose-50/40"
                    : "border-amber-200 bg-amber-50/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <WarningCircle
                    size={18}
                    className={`mt-0.5 shrink-0 ${
                      issue.severity === "ERROR" ? "text-[#b4232d]" : "text-[#8a6000]"
                    }`}
                  />
                  <div>
                    <span className="text-xs font-bold text-[#211A1D]">
                      [{issue.sectionTitle}] {issue.questionNo ? `Câu ${issue.questionNo}` : ""}
                    </span>
                    <p className="mt-0.5 text-xs text-[#746A6E]">{issue.message}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    const element = document.getElementById(issue.targetId);
                    if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="inline-flex min-h-[32px] shrink-0 items-center gap-1 rounded-lg border border-[#e3dce2] bg-white px-3 text-xs font-bold text-[#8f4458] hover:bg-[#f7e7ec]"
                >
                  Đi tới
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-[#e3dce2] pt-4">
          <p className="text-xs text-[#746A6E]">
            {hasBlockingErrors
              ? "Vui lòng sửa tất cả lỗi bắt buộc để tiếp tục."
              : "Đề thi đủ điều kiện cơ bản để xuất bản lên hệ thống."}
          </p>

          <div className="flex items-center gap-3">
            {publishError && <p className="max-w-52 text-xs font-semibold text-[#b4232d]">{publishError}</p>}
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] rounded-xl border border-[#e3dce2] px-4 text-xs font-bold hover:bg-[#f1eef4]"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={async () => {
                setPublishing(true);
                setPublishError("");
                try {
                  await onPublished();
                } catch (reason) {
                  setPublishError(reason instanceof Error ? reason.message : "Không thể xuất bản đề");
                } finally {
                  setPublishing(false);
                }
              }}
              disabled={hasBlockingErrors || publishing}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#8f4458] px-5 text-xs font-bold text-white shadow-sm hover:bg-[#743447] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShieldCheck size={18} />
              {publishing ? "Đang xuất bản..." : "Xác nhận xuất bản"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
