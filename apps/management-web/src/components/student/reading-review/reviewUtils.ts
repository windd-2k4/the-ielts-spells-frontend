import type { ClassifiedQuestionCategory, ReadingQuestionItem, ReadingQuestionState, WordBankOption } from "./reviewTypes";

export function getQuestionState(question: ReadingQuestionItem): ReadingQuestionState {
  if (question.correct === true) return "correct";
  if (question.correct === false) return "incorrect";
  if (!question.studentAnswers || question.studentAnswers.length === 0) return "unanswered";
  return "pending";
}

export function classifyReadingQuestionType(
  typeFormat: string,
  prompt?: string | null,
  instructions?: string | null
): ClassifiedQuestionCategory {
  const upperType = (typeFormat || "").toUpperCase();
  const lowerPrompt = (prompt || "").toLowerCase();
  const lowerInst = (instructions || "").toLowerCase();

  if (upperType.includes("SUMMARY") || lowerInst.includes("complete the summary") || lowerPrompt.includes("complete the summary")) {
    return "SUMMARY_COMPLETION";
  }
  if (upperType.includes("TRUE_FALSE") || lowerInst.includes("true/false/not given") || (lowerInst.includes("true") && lowerInst.includes("not given"))) {
    return "TRUE_FALSE_NOT_GIVEN";
  }
  if (upperType.includes("YES_NO") || lowerInst.includes("yes/no/not given") || (lowerInst.includes("yes") && lowerInst.includes("not given"))) {
    return "YES_NO_NOT_GIVEN";
  }
  if (upperType.includes("MATCHING_HEAD") || lowerInst.includes("heading") || lowerInst.includes("choose the correct heading")) {
    return "MATCHING_HEADINGS";
  }
  if (upperType.includes("MATCHING_INFO") || lowerInst.includes("which paragraph contains") || lowerInst.includes("information")) {
    return "MATCHING_INFO";
  }
  if (upperType.includes("MATCHING_FEATURE") || upperType.includes("CLASSIFICATION") || lowerInst.includes("match each statement with the correct")) {
    return "MATCHING_FEATURES";
  }
  if (upperType.includes("MATCHING_SENTENCE") || lowerInst.includes("complete each sentence with the correct ending")) {
    return "MATCHING_SENTENCE_ENDINGS";
  }
  if (upperType.includes("TABLE") || lowerInst.includes("complete the table") || lowerPrompt.includes("<table") || /\|\s*---\s*\|/.test(lowerPrompt)) {
    return "TABLE_COMPLETION";
  }
  if (upperType.includes("NOTE") || lowerInst.includes("complete the notes")) {
    return "NOTE_COMPLETION";
  }
  if (upperType.includes("SENTENCE_COMPLETION") || lowerInst.includes("complete the sentences")) {
    return "SENTENCE_COMPLETION";
  }
  if (upperType.includes("MULTIPLE") || upperType.includes("CHOICE")) {
    return "MULTIPLE_CHOICE";
  }
  if (upperType.includes("SHORT_ANSWER") || lowerInst.includes("short answer") || lowerInst.includes("answer the questions below")) {
    return "SHORT_ANSWER";
  }
  if (upperType.includes("FILL") || upperType.includes("BLANK") || upperType.includes("GAP")) {
    return "SUMMARY_COMPLETION";
  }

  // Check prompt patterns
  if (/\[\[\d+\]\]/.test(prompt || "")) {
    return "SUMMARY_COMPLETION";
  }

  return "GENERAL";
}

export function readableCategoryTitle(category: ClassifiedQuestionCategory): string {
  switch (category) {
    case "SUMMARY_COMPLETION":
      return "Tóm tắt (Summary Completion)";
    case "MULTIPLE_CHOICE":
      return "Trắc nghiệm (Multiple Choice)";
    case "TRUE_FALSE_NOT_GIVEN":
      return "True / False / Not Given";
    case "YES_NO_NOT_GIVEN":
      return "Yes / No / Not Given";
    case "MATCHING_HEADINGS":
      return "Nối tiêu đề (Matching Headings)";
    case "MATCHING_INFO":
      return "Nối thông tin (Matching Information)";
    case "MATCHING_FEATURES":
      return "Nối đặc điểm (Matching Features)";
    case "MATCHING_SENTENCE_ENDINGS":
      return "Nối đuôi câu (Sentence Endings)";
    case "TABLE_COMPLETION":
      return "Hoàn thành bảng (Table Completion)";
    case "NOTE_COMPLETION":
      return "Hoàn thành ghi chú (Note Completion)";
    case "SENTENCE_COMPLETION":
      return "Hoàn thành câu (Sentence Completion)";
    case "SHORT_ANSWER":
      return "Trả lời ngắn (Short Answer)";
    default:
      return "Câu hỏi IELTS";
  }
}

export function getCategoryBadgeClass(category: ClassifiedQuestionCategory): string {
  switch (category) {
    case "SUMMARY_COMPLETION":
    case "NOTE_COMPLETION":
    case "SENTENCE_COMPLETION":
    case "TABLE_COMPLETION":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "MULTIPLE_CHOICE":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "TRUE_FALSE_NOT_GIVEN":
    case "YES_NO_NOT_GIVEN":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "MATCHING_HEADINGS":
    case "MATCHING_INFO":
    case "MATCHING_FEATURES":
    case "MATCHING_SENTENCE_ENDINGS":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";
    case "SHORT_ANSWER":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export type BlankToken =
  | { type: "text"; content: string }
  | { type: "blank"; questionNo: number; raw: string };

/**
 * Parses a template containing blanks like [[22]], {22}, __22__, etc. into text segments and blanks.
 */
export function parseGapFillTokens(text: string): BlankToken[] {
  if (!text) return [];

  const regex = /\[\[(\d+)\]\]|\{(\d+)\}|__(\d+)__|\[blank-(\d+)\]/gi;
  const tokens: BlankToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }
    const qNoStr = match[1] || match[2] || match[3] || match[4];
    const qNo = parseInt(qNoStr, 10);
    tokens.push({
      type: "blank",
      questionNo: qNo,
      raw: match[0],
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  return tokens;
}

/**
 * Extracts multiple choice options from a prompt string if they were concatenated as lines.
 * e.g.:
 * "Why did the research team choose the island?
 * A. Because of its climate
 * B. Because of its location
 * C. Because of the native species
 * D. Because of local regulations"
 */
export function parseMultipleChoiceOptions(prompt: string): {
  stem: string;
  options: Array<{ code: string; text: string }>;
} {
  if (!prompt) return { stem: "", options: [] };

  // Split lines
  const lines = prompt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const options: Array<{ code: string; text: string }> = [];
  const stemLines: string[] = [];

  const optionRegex = /^([A-H])[\.\:\)\-]\s*(.*)$/i;

  for (const line of lines) {
    const match = line.match(optionRegex);
    if (match) {
      options.push({
        code: match[1].toUpperCase(),
        text: match[2].trim(),
      });
    } else {
      stemLines.push(line);
    }
  }

  // Only consider it valid multiple choice options if at least 2 options (A, B) were detected
  if (options.length >= 2) {
    return {
      stem: stemLines.join("\n"),
      options,
    };
  }

  return { stem: prompt, options: [] };
}

/**
 * Extracts Word Bank list if present in group instructions or prompt.
 * e.g. "A heavy fuel oil    B coal    C petrol    D diesel..."
 */
export function extractWordBank(text: string): WordBankOption[] {
  if (!text) return [];

  const wordBank: WordBankOption[] = [];
  // Match patterns like "A  word", "B  word"
  const regex = /\b([A-H])[\.\:\s]+([a-zA-Z0-9\s\-',/]{2,35})(?=\s+[A-H][\.\:\s]|$)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const code = match[1].toUpperCase();
    const optText = match[2].trim();
    if (optText && !wordBank.some(item => item.code === code)) {
      wordBank.push({ code, text: optText });
    }
  }

  return wordBank.length >= 3 ? wordBank : [];
}

/**
 * Extracts roman numeral headings from instructions or prompt text if formatted as List of Headings.
 */
export function extractHeadingsList(text: string): Array<{ code: string; text: string }> {
  if (!text) return [];

  const headings: Array<{ code: string; text: string }> = [];
  // Roman numerals i, ii, iii, iv, v, vi, vii, viii, ix, x, xi, xii
  const regex = /(?:^|\n)\s*(i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)[\.\:\)\-]\s*([^\n]+)/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const code = match[1].toLowerCase();
    const headingText = match[2].trim();
    if (headingText && !headings.some(h => h.code === code)) {
      headings.push({ code, text: headingText });
    }
  }

  return headings;
}

export function cleanInstructionText(text: string): string {
  if (!text) return "";
  // Strip duplicate question range prefixes if present like "Questions 14-18 "
  return text.replace(/^Questions?\s+\d+[\s–-]+\d+[\s.:-]*/i, "").trim();
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "00:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function estimateIeltsBand(correctCount: number, maxScore: number = 40): string {
  if (maxScore !== 40) {
    if (maxScore <= 0) return "—";
    const ratio = correctCount / maxScore;
    const band = Math.round((ratio * 8 + 1) * 2) / 2;
    return `Band ${band.toFixed(1)}`;
  }
  if (correctCount >= 39) return "Band 9.0";
  if (correctCount >= 37) return "Band 8.5";
  if (correctCount >= 35) return "Band 8.0";
  if (correctCount >= 33) return "Band 7.5";
  if (correctCount >= 30) return "Band 7.0";
  if (correctCount >= 27) return "Band 6.5";
  if (correctCount >= 23) return "Band 6.0";
  if (correctCount >= 19) return "Band 5.5";
  if (correctCount >= 15) return "Band 5.0";
  if (correctCount >= 13) return "Band 4.5";
  if (correctCount >= 10) return "Band 4.0";
  if (correctCount >= 8) return "Band 3.5";
  if (correctCount >= 6) return "Band 3.0";
  if (correctCount >= 4) return "Band 2.5";
  if (correctCount >= 2) return "Band 2.0";
  return "Band 1.0";
}
