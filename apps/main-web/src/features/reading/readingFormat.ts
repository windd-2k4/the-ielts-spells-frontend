import { createContext, useContext } from "react";
import type { ReadingAnswer, ReadingQuestion, ReadingQuestionGroup, ReadingSection, StudentReadingAssignment } from "@ielts/contracts";
import { ApiClientError } from "@ielts/api-client";

export function formatDuration(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;
  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "Không giới hạn";
  }
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function answerValues(answer: ReadingAnswer | undefined) {
  if (!answer) {
    return [];
  }
  if (Array.isArray(answer.values)) {
    return answer.values.filter((value) => value.trim().length > 0);
  }
  return answer.value?.trim() ? [answer.value] : [];
}

export function isAnswered(answer: ReadingAnswer | undefined) {
  return answerValues(answer).length > 0;
}

export function allReadingQuestions(sections: ReadingSection[]) {
  return sections.flatMap((section) => section.questionGroups.flatMap((group) => group.questions.map((question) => ({
    section,
    group,
    question,
  }))));
}

export function groupQuestionLabel(group: ReadingQuestionGroup) {
  const labels: Record<ReadingQuestionGroup["typeFormat"], string> = {
    MULTIPLE_CHOICE: "Trắc nghiệm một đáp án",
    MULTIPLE_ANSWERS: "Trắc nghiệm nhiều đáp án",
    TRUE_FALSE_NOT_GIVEN: "Đúng, sai, không có thông tin",
    YES_NO_NOT_GIVEN: "Có, không, không có thông tin",
    MATCHING_HEADINGS: "Nối tiêu đề",
    MATCHING_INFORMATION: "Nối thông tin",
    MATCHING_FEATURES: "Nối đặc điểm",
    MATCHING_SENTENCE_ENDINGS: "Nối vế câu",
    FILL_IN_BLANK: "Điền vào chỗ trống",
    SHORT_ANSWER: "Trả lời ngắn",
    SENTENCE_COMPLETION: "Hoàn thành câu",
    SUMMARY_COMPLETION: "Hoàn thành tóm tắt",
    NOTE_COMPLETION: "Hoàn thành ghi chú",
    TABLE_COMPLETION: "Hoàn thành bảng",
    FLOW_CHART_COMPLETION: "Hoàn thành lưu đồ",
    DIAGRAM_LABELING: "Gắn nhãn sơ đồ",
  };
  return labels[group.typeFormat];
}

export function questionOptions(question: ReadingQuestion, group: ReadingQuestionGroup) {
  if (question.options.length > 0) {
    return question.options;
  }
  if (group.sharedOptions.length > 0) {
    return group.sharedOptions;
  }
  if (question.typeFormat === "TRUE_FALSE_NOT_GIVEN") {
    return ["TRUE", "FALSE", "NOT GIVEN"].map((value) => ({ key: value, code: value, text: value }));
  }
  if (question.typeFormat === "YES_NO_NOT_GIVEN") {
    return ["YES", "NO", "NOT GIVEN"].map((value) => ({ key: value, code: value, text: value }));
  }
  return [];
}

export function optionLabel(code: string | null | undefined, text: string | null | undefined) {
  const normalizedCode = code?.trim();
  const normalizedText = text?.trim() ?? "";
  if (!normalizedCode) {
    return normalizedText;
  }
  if (!normalizedText || normalizedCode.toLowerCase() === normalizedText.toLowerCase()) {
    return normalizedCode;
  }
  const codePrefixes = [
    normalizedCode + ".",
    normalizedCode + ")",
    normalizedCode + ":",
    normalizedCode + " -",
    normalizedCode + " ",
  ];
  if (codePrefixes.some((prefix) => normalizedText.startsWith(prefix))) {
    return normalizedText;
  }
  return `${normalizedCode}. ${normalizedText}`;
}

export type ReadingOptionMap = Map<string, { code: string | null; text: string }>;

export function buildReadingOptionMap(
  sections: ReadingSection[] | undefined | null
): ReadingOptionMap {
  const map: ReadingOptionMap = new Map();
  if (!sections) return map;
  for (const section of sections) {
    for (const group of section.questionGroups ?? []) {
      for (const opt of group.sharedOptions ?? []) {
        if (opt.key) map.set(opt.key, opt);
      }
      for (const question of group.questions ?? []) {
        for (const opt of question.options ?? []) {
          if (opt.key) map.set(opt.key, opt);
        }
      }
    }
  }
  return map;
}

export const ReadingOptionMapContext = createContext<ReadingOptionMap | null>(null);

export function useReadingOptionMap(): ReadingOptionMap | null {
  return useContext(ReadingOptionMapContext);
}

export function formatReadingAnswerValue(
  value: string | undefined | null,
  optionMap?: ReadingOptionMap | null
): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (optionMap && optionMap.has(trimmed)) {
    const opt = optionMap.get(trimmed)!;
    return optionLabel(opt.code, opt.text);
  }
  return trimmed;
}

export function formatReadingAnswerList(
  values: string[] | undefined | null,
  optionMap?: ReadingOptionMap | null,
  separator = ", "
): string {
  if (!values || values.length === 0) return "";
  return values
    .map((val) => formatReadingAnswerValue(val, optionMap))
    .filter(Boolean)
    .join(separator);
}

export function assignmentAvailability(assignment: StudentReadingAssignment, now = Date.now()) {
  const openAt = assignment.opensAt ? Date.parse(assignment.opensAt) : undefined;
  const closeAt = assignment.closesAt ? Date.parse(assignment.closesAt) : undefined;
  if (openAt && now < openAt) {
    return { available: false, label: "Chưa mở" };
  }
  if (closeAt && now >= closeAt) {
    return { available: false, label: "Đã đóng" };
  }
  if (assignment.attemptsUsed >= assignment.maxAttempts) {
    return { available: false, label: "Đã hết lượt" };
  }
  return { available: true, label: assignment.activeAttemptExpiresAt ? "Đang làm" : "Sẵn sàng" };
}

export function requestMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.status === 401) {
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    }
    if (error.status === 403) {
      return "Tài khoản này chưa có quyền học viên hoặc không có ghi danh đang hoạt động.";
    }
    return error.message;
  }
  return "Không thể kết nối đến hệ thống lúc này. Vui lòng kiểm tra mạng và thử lại.";
}
