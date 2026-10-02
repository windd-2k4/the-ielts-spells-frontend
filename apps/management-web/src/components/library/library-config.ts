import type { LearningResourceType, LibrarySkill } from "../../library-types";

export const SKILLS: { id: LibrarySkill; label: string; note: string }[] = [
  { id: "LISTENING", label: "Listening", note: "Audio, bộ đề, key, vocab và phương pháp nghe" },
  { id: "READING", label: "Reading", note: "Bộ đề, cách làm, key, vocab và teacher note" },
  { id: "WRITING", label: "Writing", note: "Lý thuyết, đề bài, bài mẫu và teacher note" },
  { id: "SPEAKING", label: "Speaking", note: "Topic bank, audio, bài mẫu và teacher note" },
];

export const CATEGORIES: Record<LibrarySkill, { value: string; label: string }[]> = {
  LISTENING: [
    ["PRACTICE_SET", "Bộ đề"], ["ANSWER_KEY", "Key & transcript"],
    ["VOCABULARY", "Vocabulary"], ["IN_CLASS", "Bài tập trên lớp"],
    ["HOMEWORK", "Bài tập về nhà"], ["AUDIO", "Audio"],
    ["METHOD", "Phương pháp luyện nghe"], ["TEACHER_NOTE", "Teacher note"],
  ].map(([value, label]) => ({ value, label })),
  READING: [
    ["PRACTICE_SET", "Bộ đề"], ["ANSWER_KEY", "Key & giải thích"],
    ["VOCABULARY", "Vocabulary"], ["IN_CLASS", "Bài tập trên lớp"],
    ["HOMEWORK", "Bài tập về nhà"], ["METHOD", "Cách làm"],
    ["TEACHER_NOTE", "Teacher note"],
  ].map(([value, label]) => ({ value, label })),
  WRITING: [
    ["THEORY", "Lý thuyết"], ["PROMPT_BANK", "Kho đề"],
    ["SAMPLE", "Bài mẫu"], ["IN_CLASS", "Bài tập trên lớp"],
    ["HOMEWORK", "Bài tập về nhà"], ["VOCABULARY_IDEAS", "Từ vựng & ý tưởng"],
    ["TEACHER_NOTE", "Teacher note"],
  ].map(([value, label]) => ({ value, label })),
  SPEAKING: [
    ["THEORY", "Lý thuyết & phương pháp"], ["TOPIC_BANK", "Topic bank"],
    ["SAMPLE_ANSWER", "Sample answer"], ["PRONUNCIATION_AUDIO", "Audio phát âm"],
    ["IN_CLASS", "Bài tập trên lớp"], ["HOMEWORK", "Bài tập về nhà"],
    ["TEACHER_NOTE", "Teacher note"],
  ].map(([value, label]) => ({ value, label })),
};

export const RESOURCE_TYPES = [
  ["DRIVE_LINK", "Google Drive / Docs"], ["DOCUMENT", "Tài liệu"],
  ["AUDIO", "Audio"], ["VIDEO", "Video"], ["TEACHER_NOTE", "Teacher note"],
  ["ANSWER_KEY", "Answer key"], ["VOCABULARY", "Vocabulary"],
].map(([value, label]) => ({ value, label }));

export const RESOURCE_TYPE_LABELS: Record<LearningResourceType, string> = {
  DOCUMENT: "Tài liệu",
  AUDIO: "Audio",
  VIDEO: "Video",
  DRIVE_LINK: "Liên kết",
  TEACHER_NOTE: "Ghi chú giáo viên",
  ANSWER_KEY: "Đáp án",
  VOCABULARY: "Từ vựng",
};

export const SKILL_LABELS: Record<LibrarySkill, string> = Object.fromEntries(
  SKILLS.map(skill => [skill.id, skill.label]),
) as Record<LibrarySkill, string>;

export const ALL_CATEGORIES = Array.from(
  new Map(
    Object.values(CATEGORIES)
      .flat()
      .map(category => [category.value, category.label]),
  ),
).map(([value, label]) => ({ value, label }));

export function categoryLabel(skill: LibrarySkill | string, value: string) {
  const options = CATEGORIES[skill as LibrarySkill] ?? Object.values(CATEGORIES).flat();
  return options.find(item => item.value === value)?.label ?? value;
}

