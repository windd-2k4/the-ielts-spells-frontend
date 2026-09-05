import type {
  QuestionGroupAnswerSource,
  QuestionTypeFormat,
  SharedOptionItem,
} from "../../library-types";

export type ReadingQuestionCategory = "CHOICE" | "STATEMENT" | "MATCHING" | "COMPLETION";

export type ReadingQuestionTypeDefinition = {
  type: QuestionTypeFormat;
  label: string;
  shortLabel: string;
  category: ReadingQuestionCategory;
  description: string;
  defaultInstructions: string;
  usesQuestionOptions?: boolean;
  usesSharedOptions?: boolean;
  supportsOptionBank?: boolean;
  usesWordLimit?: boolean;
  defaultAnswerSource?: QuestionGroupAnswerSource;
  defaultRequiredAnswerCount?: number;
};

export const readingQuestionCategories: Array<{
  value: ReadingQuestionCategory;
  label: string;
  description: string;
}> = [
  { value: "CHOICE", label: "Lựa chọn", description: "Một hoặc nhiều đáp án" },
  { value: "STATEMENT", label: "Nhận định", description: "True/False và Yes/No" },
  { value: "MATCHING", label: "Nối thông tin", description: "Heading, đoạn, đặc điểm" },
  { value: "COMPLETION", label: "Hoàn thành", description: "Điền từ, bảng, sơ đồ" },
];

export const readingQuestionTypeDefinitions: ReadingQuestionTypeDefinition[] = [
  {
    type: "MULTIPLE_CHOICE",
    label: "Multiple Choice",
    shortLabel: "Trắc nghiệm một đáp án",
    category: "CHOICE",
    description: "Mỗi câu có một đáp án đúng trong các lựa chọn A, B, C, D.",
    defaultInstructions: "Choose the correct letter, A, B, C or D.",
    usesQuestionOptions: true,
  },
  {
    type: "MULTIPLE_ANSWERS",
    label: "Multiple Answers",
    shortLabel: "Trắc nghiệm nhiều đáp án",
    category: "CHOICE",
    description: "Một yêu cầu có nhiều đáp án đúng; cấu hình số đáp án cần chọn ở cấp group.",
    defaultInstructions: "Choose the correct letters.",
    usesQuestionOptions: true,
    defaultRequiredAnswerCount: 2,
  },
  {
    type: "TRUE_FALSE_NOT_GIVEN",
    label: "True / False / Not Given",
    shortLabel: "Đối chiếu thông tin",
    category: "STATEMENT",
    description: "Đánh giá phát biểu theo thông tin xuất hiện trong passage.",
    defaultInstructions: "Do the following statements agree with the information given in Reading Passage? Write TRUE, FALSE or NOT GIVEN.",
  },
  {
    type: "YES_NO_NOT_GIVEN",
    label: "Yes / No / Not Given",
    shortLabel: "Đối chiếu quan điểm",
    category: "STATEMENT",
    description: "Đánh giá phát biểu theo quan điểm hoặc claims của tác giả.",
    defaultInstructions: "Do the following statements agree with the claims of the writer? Write YES, NO or NOT GIVEN.",
  },
  {
    type: "MATCHING_HEADINGS",
    label: "Matching Headings",
    shortLabel: "Nối tiêu đề với đoạn",
    category: "MATCHING",
    description: "Dùng một ngân hàng heading chung, thường đánh mã i, ii, iii.",
    defaultInstructions: "Choose the correct heading for each paragraph from the list of headings below.",
    usesSharedOptions: true,
  },
  {
    type: "MATCHING_INFORMATION",
    label: "Matching Information",
    shortLabel: "Tìm thông tin trong đoạn",
    category: "MATCHING",
    description: "Nối mỗi thông tin với paragraph A, B, C; có thể tái sử dụng đoạn.",
    defaultInstructions: "Which paragraph contains the following information? Choose the correct letter, A, B, C or D.",
    usesSharedOptions: true,
  },
  {
    type: "MATCHING_FEATURES",
    label: "Matching Features / Classification",
    shortLabel: "Phân loại đặc điểm",
    category: "MATCHING",
    description: "Nối phát biểu với người, tổ chức, nhóm hoặc đặc điểm dùng chung.",
    defaultInstructions: "Match each statement with the correct person, feature or category from the list of options.",
    usesSharedOptions: true,
  },
  {
    type: "MATCHING_SENTENCE_ENDINGS",
    label: "Matching Sentence Endings",
    shortLabel: "Nối vế cuối câu",
    category: "MATCHING",
    description: "Nối phần đầu câu hỏi với danh sách vế kết thúc dùng chung.",
    defaultInstructions: "Complete each sentence with the correct ending from the list below.",
    usesSharedOptions: true,
  },
  {
    type: "FILL_IN_BLANK",
    label: "Gap Filling",
    shortLabel: "Điền vào chỗ trống",
    category: "COMPLETION",
    description: "Dạng điền từ linh hoạt cho notes hoặc đoạn văn ngắn.",
    defaultInstructions: "Complete the notes below. Choose words from the passage for each answer.",
    usesWordLimit: true,
    defaultAnswerSource: "PASSAGE",
  },
  {
    type: "SHORT_ANSWER",
    label: "Short-answer Questions",
    shortLabel: "Trả lời ngắn",
    category: "COMPLETION",
    description: "Học viên nhập câu trả lời ngắn theo giới hạn từ.",
    defaultInstructions: "Answer the questions below. Choose words from the passage for each answer.",
    usesWordLimit: true,
    defaultAnswerSource: "PASSAGE",
  },
  {
    type: "SENTENCE_COMPLETION",
    label: "Sentence Completion",
    shortLabel: "Hoàn thành câu",
    category: "COMPLETION",
    description: "Điền từ lấy từ passage để hoàn thành từng câu.",
    defaultInstructions: "Complete the sentences below. Choose words from the passage for each answer.",
    usesWordLimit: true,
    defaultAnswerSource: "PASSAGE",
  },
  {
    type: "SUMMARY_COMPLETION",
    label: "Summary Completion",
    shortLabel: "Hoàn thành tóm tắt",
    category: "COMPLETION",
    description: "Có thể lấy từ passage hoặc chọn từ ngân hàng từ dùng chung.",
    defaultInstructions: "Complete the summary below. Choose words from the passage for each answer.",
    supportsOptionBank: true,
    usesWordLimit: true,
    defaultAnswerSource: "PASSAGE",
  },
  {
    type: "NOTE_COMPLETION",
    label: "Note Completion",
    shortLabel: "Hoàn thành ghi chú",
    category: "COMPLETION",
    description: "Các câu trống được trình bày theo cấu trúc ghi chú.",
    defaultInstructions: "Complete the notes below. Choose words from the passage for each answer.",
    usesWordLimit: true,
    defaultAnswerSource: "PASSAGE",
  },
  {
    type: "TABLE_COMPLETION",
    label: "Table Completion",
    shortLabel: "Hoàn thành bảng",
    category: "COMPLETION",
    description: "Các câu trống thuộc các ô trong một bảng dữ liệu.",
    defaultInstructions: "Complete the table below. Choose words from the passage for each answer.",
    usesWordLimit: true,
    defaultAnswerSource: "PASSAGE",
  },
  {
    type: "FLOW_CHART_COMPLETION",
    label: "Flow-chart Completion",
    shortLabel: "Hoàn thành lưu đồ",
    category: "COMPLETION",
    description: "Các câu trống mô tả các bước trong một quy trình hoặc lưu đồ.",
    defaultInstructions: "Complete the flow-chart below. Choose words from the passage for each answer.",
    usesWordLimit: true,
    defaultAnswerSource: "PASSAGE",
  },
  {
    type: "DIAGRAM_LABELING",
    label: "Diagram Label Completion",
    shortLabel: "Gắn nhãn sơ đồ",
    category: "COMPLETION",
    description: "Gắn đáp án vào các vị trí được đánh số trên hình hoặc sơ đồ.",
    defaultInstructions: "Label the diagram below. Choose words from the passage for each answer.",
    usesWordLimit: true,
    defaultAnswerSource: "PASSAGE",
  },
];

export const readingQuestionTypes = readingQuestionTypeDefinitions.map((definition) => definition.type);

export const readingQuestionTypeLabels = Object.fromEntries(
  readingQuestionTypeDefinitions.map((definition) => [definition.type, definition.label]),
) as Record<QuestionTypeFormat, string>;

export function getReadingQuestionTypeDefinition(type: QuestionTypeFormat) {
  return readingQuestionTypeDefinitions.find((definition) => definition.type === type)
    ?? readingQuestionTypeDefinitions[0];
}

export function questionTypeUsesQuestionOptions(type: QuestionTypeFormat) {
  return Boolean(getReadingQuestionTypeDefinition(type).usesQuestionOptions);
}

export function questionTypeUsesSharedOptions(type: QuestionTypeFormat, answerSource?: QuestionGroupAnswerSource) {
  const definition = getReadingQuestionTypeDefinition(type);
  return Boolean(definition.usesSharedOptions || (definition.supportsOptionBank && answerSource === "OPTION_BANK"));
}

export function questionTypeUsesWordLimit(type: QuestionTypeFormat, answerSource?: QuestionGroupAnswerSource) {
  const definition = getReadingQuestionTypeDefinition(type);
  return Boolean(definition.usesWordLimit && answerSource !== "OPTION_BANK");
}

export function createDefaultSharedOptions(type: QuestionTypeFormat, createId: () => string): SharedOptionItem[] {
  if (type === "MATCHING_HEADINGS") {
    return ["i", "ii", "iii", "iv", "v", "vi"].map((code) => ({ id: createId(), code, text: "" }));
  }
  if (type === "MATCHING_INFORMATION") {
    return ["A", "B", "C", "D", "E"].map((code) => ({ id: createId(), code, text: `Paragraph ${code}` }));
  }
  return ["A", "B", "C", "D"].map((code) => ({ id: createId(), code, text: "" }));
}

export function defaultWordLimit(type: QuestionTypeFormat) {
  return questionTypeUsesWordLimit(type) ? "NO MORE THAN TWO WORDS AND/OR A NUMBER" : "";
}
