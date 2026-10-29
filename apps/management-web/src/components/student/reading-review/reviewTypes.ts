import type { StudentAttemptDetail } from "../../../academic-types";

export type ReadingQuestionItem = StudentAttemptDetail["questions"][number];

export type ReadingSectionItem = {
  sectionNo: number;
  title: string;
  contentHtml: string;
  questions: ReadingQuestionItem[];
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  total: number;
};

export type ReadingQuestionState = "correct" | "incorrect" | "unanswered" | "pending";

export type ClassifiedQuestionCategory =
  | "SUMMARY_COMPLETION"
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE_NOT_GIVEN"
  | "YES_NO_NOT_GIVEN"
  | "MATCHING_HEADINGS"
  | "MATCHING_INFO"
  | "MATCHING_FEATURES"
  | "MATCHING_SENTENCE_ENDINGS"
  | "TABLE_COMPLETION"
  | "NOTE_COMPLETION"
  | "SENTENCE_COMPLETION"
  | "SHORT_ANSWER"
  | "GENERAL";

export type WordBankOption = {
  code: string;
  text: string;
};

export type ReadingQuestionGroupItem = {
  key: string;
  title: string | null;
  instructions: string | null;
  questionType: string;
  category: ClassifiedQuestionCategory;
  rangeStart: number;
  rangeEnd: number;
  rangeLabel: string;
  questions: ReadingQuestionItem[];
  correctCount: number;
  totalCount: number;
  sharedSummaryText?: string | null;
  wordBank?: WordBankOption[];
};
