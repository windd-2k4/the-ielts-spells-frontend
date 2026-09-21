import {
  ArrowRight,
  CheckCircle,
  ShieldCheck,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import type {
  ListeningPartSection,
  PassageSection,
  QuestionGroupItem,
  QuestionCardItem,
  ReadingEvidenceSpan,
  QuestionTypeFormat,
  TestBankItem,
  TestValidationResult,
  ValidationIssue,
} from "../../library-types";
import { apiFetch } from "../../lib/api";
import {
  questionTypeUsesGapTemplate,
  questionTypeUsesSharedOptions,
  questionTypeUsesWordLimit,
  readingQuestionTypes,
} from "./readingQuestionGroupConfig";
import { inspectGapFillTemplate } from "./GapFillGroupEditor";

type Props = {
  test: TestBankItem;
  onClose: () => void;
  onPublished: () => Promise<void> | void;
  /** Teachers submit a valid draft for review; moderators can publish it. */
  actionLabel?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isQuestionType(value: unknown): value is QuestionTypeFormat {
  return typeof value === "string" && readingQuestionTypes.includes(value as QuestionTypeFormat);
}

function readGroupIllustration(value: unknown): QuestionGroupItem["illustration"] {
  if (!isRecord(value)
    || typeof value.assetId !== "string"
    || typeof value.fileUrl !== "string"
    || typeof value.filename !== "string") return undefined;
  return {
    assetId: value.assetId,
    fileUrl: value.fileUrl,
    filename: value.filename,
    altText: typeof value.altText === "string" ? value.altText : "",
    width: typeof value.width === "number" ? value.width : undefined,
    height: typeof value.height === "number" ? value.height : undefined,
  };
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

function readEvidenceSpans(value: unknown, legacyValue: unknown, questionId: string): ReadingEvidenceSpan[] {
  const legacy = readPassageSpan(legacyValue);
  const sources: Record<string, unknown>[] = Array.isArray(value)
    ? value.filter(isRecord)
    : legacy
    ? [{ start: legacy.start, end: legacy.end, quote: legacy.quote }]
    : [];
  return sources.map((source, index) => {
    const mode = source.mode === "WHOLE_PARAGRAPH"
      ? "WHOLE_PARAGRAPH"
      : source.mode === "NO_DIRECT_EVIDENCE"
      ? "NO_DIRECT_EVIDENCE"
      : "DIRECT_QUOTE";
    const start = typeof source.start === "number" && Number.isFinite(source.start) ? source.start : null;
    const end = typeof source.end === "number" && Number.isFinite(source.end) ? source.end : null;
    return {
      id: typeof source.id === "string" && source.id.trim() ? source.id : `validation-evidence-${questionId}-${index + 1}`,
      start: mode === "NO_DIRECT_EVIDENCE" ? null : start,
      end: mode === "NO_DIRECT_EVIDENCE" ? null : end,
      quote: mode === "NO_DIRECT_EVIDENCE" ? "" : typeof source.quote === "string" ? source.quote : "",
      prefix: typeof source.prefix === "string" ? source.prefix : undefined,
      suffix: typeof source.suffix === "string" ? source.suffix : undefined,
      paragraphKey: typeof source.paragraphKey === "string" ? source.paragraphKey : undefined,
      label: typeof source.label === "string" ? source.label : undefined,
      mode,
    } satisfies ReadingEvidenceSpan;
  });
}

function readQuestions(value: unknown): QuestionCardItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((question, index) => {
    const id = typeof question.id === "string" ? question.id : `question-${index + 1}`;
    return {
    id,
    number: typeof question.number === "number" ? question.number : 0,
    typeFormat: isQuestionType(question.typeFormat) ? question.typeFormat : "FILL_IN_BLANK",
    prompt: typeof question.prompt === "string" ? question.prompt : "",
    options: Array.isArray(question.options) ? question.options as QuestionCardItem["options"] : [],
    correctAnswers: Array.isArray(question.correctAnswers) ? question.correctAnswers.map(String) : [],
    acceptableAnswers: Array.isArray(question.acceptableAnswers) ? question.acceptableAnswers.map(String) : [],
    explanation: typeof question.explanation === "string" ? question.explanation : "",
    reasoningSteps: Array.isArray(question.reasoningSteps)
      ? question.reasoningSteps.filter((step): step is string => typeof step === "string")
      : [],
    trapAnalysis: typeof question.trapAnalysis === "string" ? question.trapAnalysis : "",
    vocabularyNotes: typeof question.vocabularyNotes === "string" ? question.vocabularyNotes : "",
    teacherNote: typeof question.teacherNote === "string" ? question.teacherNote : "",
    passageSpan: readPassageSpan(question.passageSpan),
    evidenceSpans: readEvidenceSpans(question.evidenceSpans, question.passageSpan, id),
    isComplete: Boolean(question.isComplete),
    hasError: Boolean(question.hasError),
    errorMessage: typeof question.errorMessage === "string" ? question.errorMessage : undefined,
    };
  });
}

function evidenceSpansForQuestion(question: QuestionCardItem): ReadingEvidenceSpan[] {
  if (Array.isArray(question.evidenceSpans) && question.evidenceSpans.length > 0) return question.evidenceSpans;
  if (!question.passageSpan) return [];
  return [{
    id: `legacy-evidence-${question.id}`,
    start: question.passageSpan.start,
    end: question.passageSpan.end,
    quote: question.passageSpan.quote ?? "",
    mode: "DIRECT_QUOTE",
  }];
}

function hasEvidenceRange(evidence: ReadingEvidenceSpan) {
  return typeof evidence.start === "number"
    && typeof evidence.end === "number"
    && evidence.start >= 0
    && evidence.end > evidence.start;
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
    gapFillTemplate: typeof group.gapFillTemplate === "string" ? group.gapFillTemplate : undefined,
    gapFillLayout: group.gapFillLayout === "LIST" ? "LIST" : "PARAGRAPH",
    illustration: readGroupIllustration(group.illustration),
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
        if (group.illustration && !group.illustration.altText.trim()) {
          issues.push({
            id: `${group.id}-illustration-alt`,
            severity: "ERROR",
            sectionTitle: group.title,
            message: "Ảnh hoặc sơ đồ cần có mô tả để học viên và trình đọc màn hình hiểu nội dung.",
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
        if (questionTypeUsesGapTemplate(group.typeFormat, group.answerSource)) {
          const templateIssues = inspectGapFillTemplate(group.gapFillTemplate ?? "", group.questions.length);
          if (group.gapFillTemplate !== undefined && (!group.gapFillTemplate.trim() || templateIssues.missing.length || templateIssues.duplicated.length || templateIssues.invalid.length)) {
            issues.push({
              id: `${group.id}-gap-template`,
              severity: "ERROR",
              sectionTitle: group.title,
              message: "Mẫu Gap filling phải có đúng một vị trí [[n]] cho mỗi câu hỏi.",
              targetId: group.id,
            });
          }
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
          const questionEvidence = evidenceSpansForQuestion(question);
          const hasNoDirectEvidence = questionEvidence.some((evidence) => evidence.mode === "NO_DIRECT_EVIDENCE");
          if (!question.explanation?.trim()) {
            issues.push({
              id: `${question.id}-solution`,
              severity: hasNoDirectEvidence ? "ERROR" : "WARNING",
              sectionTitle: group.title,
              questionNo: question.number,
              message: hasNoDirectEvidence
                ? "Khi không có trích dẫn trực tiếp, cần giải thích rõ lý do trong lời giải."
                : "Câu hỏi chưa có lời giải cho học viên.",
              targetId: question.id,
            });
          }
          if (questionEvidence.length === 0) {
            issues.push({
              id: `${question.id}-evidence-empty`,
              severity: "WARNING",
              sectionTitle: group.title,
              questionNo: question.number,
              message: "Chưa gắn bằng chứng trong Passage.",
              targetId: question.id,
            });
          }
          questionEvidence.forEach((evidence) => {
            if (evidence.mode !== "NO_DIRECT_EVIDENCE" && !hasEvidenceRange(evidence)) {
              issues.push({
                id: `${question.id}-evidence-${evidence.id}-range`,
                severity: "ERROR",
                sectionTitle: group.title,
                questionNo: question.number,
                message: "Một bằng chứng có vị trí không hợp lệ. Hãy gắn lại đoạn Passage.",
                targetId: question.id,
              });
            }
            if (evidence.mode !== "NO_DIRECT_EVIDENCE" && !evidence.quote.trim()) {
              issues.push({
                id: `${question.id}-evidence-${evidence.id}-quote`,
                severity: "ERROR",
                sectionTitle: group.title,
                questionNo: question.number,
                message: "Một bằng chứng chưa có đoạn trích. Hãy gắn lại vị trí trong Passage.",
                targetId: question.id,
              });
            }
          });
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
        if (questionTypeUsesGapTemplate(group.typeFormat, group.answerSource)) {
          const templateIssues = inspectGapFillTemplate(group.gapFillTemplate ?? "", group.questions.length);
          if (group.gapFillTemplate !== undefined && (!group.gapFillTemplate.trim() || templateIssues.missing.length || templateIssues.duplicated.length || templateIssues.invalid.length)) {
            issues.push({ id: `${group.id}-gap-template`, severity: "ERROR", sectionTitle: group.title, message: "Mẫu Gap filling phải có đúng một vị trí [[n]] cho mỗi câu hỏi.", targetId: group.id });
          }
        }
        group.questions.forEach((question) => {
          if (!question.prompt.trim()) issues.push({ id: `${question.id}-prompt`, severity: "ERROR", sectionTitle: group.title, questionNo: question.number, message: "Chưa nhập nội dung câu hỏi.", targetId: question.id });
          if (question.correctAnswers.length === 0) issues.push({ id: `${question.id}-answer`, severity: "ERROR", sectionTitle: group.title, questionNo: question.number, message: "Chưa nhập đáp án đúng.", targetId: question.id });
        });
      });
    });
    return issues;
  }

  if (test.skill === "WRITING" && Array.isArray(content.tasks)) {
    const tasks = content.tasks.filter(isRecord);
    if (tasks.length === 0) issues.push({ id: "writing-tasks", severity: "ERROR", sectionTitle: "Cấu trúc Writing", message: "Đề chưa có Writing Task.", targetId: "test-builder-workspace" });
    tasks.forEach((task, index) => {
      const taskNo = task.taskNo === 2 ? 2 : 1;
      const promptHtml = typeof task.promptHtml === "string" ? task.promptHtml : "";
      const minWords = typeof task.minWords === "number" ? task.minWords : 0;
      const timeMinutes = typeof task.suggestedTimeMinutes === "number" ? task.suggestedTimeMinutes : 0;
      if (!plainTextFromHtml(promptHtml)) issues.push({ id: `writing-${index}-prompt`, severity: "ERROR", sectionTitle: `Writing Task ${taskNo}`, message: "Chưa nhập đề bài.", targetId: "test-builder-workspace" });
      if (minWords <= 0) issues.push({ id: `writing-${index}-words`, severity: "ERROR", sectionTitle: `Writing Task ${taskNo}`, message: "Số từ tối thiểu phải lớn hơn 0.", targetId: "test-builder-workspace" });
      if (timeMinutes <= 0) issues.push({ id: `writing-${index}-time`, severity: "ERROR", sectionTitle: `Writing Task ${taskNo}`, message: "Thời gian gợi ý phải lớn hơn 0.", targetId: "test-builder-workspace" });
      if (taskNo === 1 && !task.imageUrl) issues.push({ id: `writing-${index}-image`, severity: "WARNING", sectionTitle: "Writing Task 1", message: "Task 1 chưa có hình minh họa. Có thể bỏ qua nếu đề chỉ dùng nội dung văn bản.", targetId: "test-builder-workspace" });
    });
    return issues;
  }

  if (test.skill === "SPEAKING") {
    const parts = Array.isArray(content.parts) ? content.parts.filter(isRecord) : [];
    if (parts.length === 0) issues.push({ id: "speaking-parts", severity: "ERROR", sectionTitle: "Cấu trúc Speaking", message: "Đề chưa có Speaking Part.", targetId: "test-builder-workspace" });
    parts.forEach((part, partIndex) => {
      const partNo = part.partNo === 2 ? 2 : part.partNo === 3 ? 3 : 1;
      if (typeof part.topicTitle !== "string" || !part.topicTitle.trim()) issues.push({ id: `speaking-${partIndex}-topic`, severity: "WARNING", sectionTitle: `Speaking Part ${partNo}`, message: "Chưa nhập tên chủ đề.", targetId: "test-builder-workspace" });
      if (partNo === 1 || partNo === 3) {
        const questions = Array.isArray(part.questions) ? part.questions.filter(isRecord) : [];
        if (questions.length === 0) issues.push({ id: `speaking-${partIndex}-questions`, severity: "ERROR", sectionTitle: `Speaking Part ${partNo}`, message: `Part ${partNo} cần có ít nhất một câu hỏi.`, targetId: "test-builder-workspace" });
        questions.forEach((question, questionIndex) => {
          if (typeof question.promptText !== "string" || !question.promptText.trim()) issues.push({ id: `speaking-${partIndex}-${questionIndex}-prompt`, severity: "ERROR", sectionTitle: `Speaking Part ${partNo}`, questionNo: questionIndex + 1, message: "Chưa nhập nội dung câu hỏi.", targetId: question.id as string || "test-builder-workspace" });
          if (question.hintsEnabled !== false) {
            const steps = Array.isArray(question.hintSteps) ? question.hintSteps.filter(isRecord) : [];
            if (!steps.some((step) => typeof step.instruction === "string" && step.instruction.trim() || Array.isArray(step.options) && step.options.length > 0)) issues.push({ id: `speaking-${partIndex}-${questionIndex}-hints`, severity: "WARNING", sectionTitle: `Speaking Part ${partNo}`, questionNo: questionIndex + 1, message: "Gợi ý đang bật nhưng chưa có nội dung.", targetId: question.id as string || "test-builder-workspace" });
          }
        });
      } else {
        if (typeof part.cueCardPromptHtml !== "string" || !part.cueCardPromptHtml.trim()) issues.push({ id: `speaking-${partIndex}-content`, severity: "ERROR", sectionTitle: "Speaking Part 2", message: "Chưa nhập đề bài cue card.", targetId: "test-builder-workspace" });
        const bullets = Array.isArray(part.cueCardBullets) ? part.cueCardBullets.map(String).filter((item) => item.trim()) : [];
        if (bullets.length === 0) issues.push({ id: `speaking-${partIndex}-bullets`, severity: "WARNING", sectionTitle: "Speaking Part 2", message: "Cue card chưa có ý You should say.", targetId: "test-builder-workspace" });
        if (part.hintsEnabled !== false) {
          const steps = Array.isArray(part.hintSteps) ? part.hintSteps.filter(isRecord) : [];
          if (!steps.some((step) => typeof step.instruction === "string" && step.instruction.trim() || Array.isArray(step.options) && step.options.length > 0)) issues.push({ id: `speaking-${partIndex}-hints`, severity: "WARNING", sectionTitle: "Speaking Part 2", message: "Gợi ý đang bật nhưng chưa có nội dung.", targetId: "test-builder-workspace" });
        }
      }
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

export default function PublishValidationModal({ test, onClose, onPublished, actionLabel = "Xác nhận xuất bản" }: Props) {
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [serverValidation, setServerValidation] = useState<TestValidationResult | null>(null);
  const [loadingValidation, setLoadingValidation] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingValidation(true);
    setPublishError("");
    void apiFetch<TestValidationResult>(`/admin/test-bank/${test.id}/validation`)
      .then((result) => { if (active) setServerValidation(result); })
      .catch((reason) => {
        if (active) setPublishError(reason instanceof Error ? reason.message : "Không thể kiểm tra dữ liệu đề trên hệ thống.");
      })
      .finally(() => { if (active) setLoadingValidation(false); });
    return () => { active = false; };
  }, [test.id, test.draftRevision]);

  const issues = serverValidation?.issues ?? deriveValidationIssues(test);
  const hasBlockingErrors = issues.some((issue) => issue.severity === "ERROR");
  const errorCount = issues.filter((issue) => issue.severity === "ERROR").length;
  const warningCount = issues.filter((issue) => issue.severity === "WARNING").length;
  const submittingForReview = actionLabel.toLocaleLowerCase("vi-VN").includes("gửi duyệt");
  const actionVerb = submittingForReview ? "gửi duyệt" : "xuất bản";

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
                Kiểm tra trước khi {actionVerb} đề thi
              </h3>
              <p className="text-xs text-[#746A6E]">
                {test.code} • {test.title}
              </p>
              {loadingValidation && <p className="mt-1 text-[11px] font-semibold text-[#746A6E]">Đang kiểm tra dữ liệu trên hệ thống...</p>}
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
            <p className="mt-0.5 text-[11px] text-[#746A6E]">Phải sửa hết lỗi này mới được {actionVerb}.</p>
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
              : `Đề thi đủ điều kiện cơ bản để ${actionVerb} lên hệ thống.`}
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
              disabled={hasBlockingErrors || publishing || loadingValidation || Boolean(publishError && !serverValidation)}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#8f4458] px-5 text-xs font-bold text-white shadow-sm hover:bg-[#743447] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShieldCheck size={18} />
              {publishing ? "Đang xử lý..." : actionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
