import type { Page } from "./academic-types";

export type LibrarySkill = "LISTENING" | "READING" | "WRITING" | "SPEAKING";
export type TestSkill = "FULL_TEST" | "LISTENING" | "READING" | "WRITING" | "SPEAKING";
export type LibraryScope = "GLOBAL" | "COURSE";
export type ContentLifecycleStatus = "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";
export type LibraryView = "RESOURCES" | "EXERCISES";

export type ResourceSourceType = "FILE_UPLOAD" | "DRIVE_LINK" | "RICH_TEXT";
export type VisibilityPermission = "TEACHER_ONLY" | "STUDENT_AFTER_ASSIGN" | "STUDENT_AFTER_SUBMIT";

export type LearningResource = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  skill: LibrarySkill;
  category: string;
  resourceType: string;
  sourceType: ResourceSourceType;
  scope: LibraryScope;
  courseId: string | null;
  courseName?: string | null;
  externalUrl: string | null;
  richTextContent?: string | null;
  teacherOnly: boolean;
  visibilityPermission: VisibilityPermission;
  tags: string[];
  status: ContentLifecycleStatus;
  usageCount: number;
  referencedCourses?: { id: string; name: string }[];
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  attachmentsCount?: number;
};

export type LearningResourceFile = {
  id: string;
  resourceId: string;
  fileRole: "MAIN" | "KEY" | "TRANSCRIPT" | "VOCAB" | "AUDIO" | "THUMBNAIL" | "ATTACHMENT";
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  fileUrl?: string;
  previewSupported: boolean;
  createdAt: string;
};

export type ExerciseTemplate = {
  id: string;
  code: string;
  title: string;
  instructions: string | null;
  skill: LibrarySkill;
  category: string;
  exerciseType: string;
  completionMode: string;
  scope: LibraryScope;
  courseId: string | null;
  courseName?: string | null;
  sourceUrl: string | null;
  durationMinutes: number | null;
  maxScore: number | null;
  attemptLimit: number | null;
  requiresTeacherReview: boolean;
  content: Record<string, unknown>;
  answerKey: Record<string, unknown>;
  status: ContentLifecycleStatus;
  usageCount: number;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type LibraryItem = LearningResource | ExerciseTemplate;
export type LibraryPage<T> = Page<T>;

export function isResource(item: LibraryItem): item is LearningResource {
  return "resourceType" in item || "sourceType" in item;
}

// ================= TEST BANK & BUILDER TYPES =================

export type TestPurpose = "PLACEMENT" | "PRACTICE" | "PROGRESS" | "MOCK_TEST";
export type TestType = "FULL_TEST" | "SINGLE_SKILL";
export type QuestionTypeFormat =
  | "MULTIPLE_CHOICE"
  | "MULTIPLE_ANSWERS"
  | "FILL_IN_BLANK"
  | "TRUE_FALSE_NOT_GIVEN"
  | "YES_NO_NOT_GIVEN"
  | "MATCHING_HEADINGS"
  | "MATCHING_INFORMATION"
  | "MATCHING_FEATURES"
  | "SENTENCE_COMPLETION"
  | "SUMMARY_COMPLETION"
  | "DIAGRAM_LABELING";

export type QuestionOption = {
  id: string;
  label: string; // A, B, C, D...
  text: string;
};

export type QuestionCardItem = {
  id: string;
  number: number;
  typeFormat: QuestionTypeFormat;
  prompt: string;
  options: QuestionOption[];
  correctAnswers: string[]; // option id, text answer, or matching target
  acceptableAnswers?: string[];
  passageSpan?: { start: number; end: number };
  explanation?: string;
  trapAnalysis?: string;
  vocabularyNotes?: string;
  relatedLessonUrl?: string;
  teacherNote?: string;
  solutionVisibility?: VisibilityPermission;
  isComplete: boolean;
  hasError: boolean;
  errorMessage?: string;
};

export type SharedOptionItem = {
  id: string;
  code: string; // e.g. i, ii, iii, iv or A, B, C
  text: string;
};

export type QuestionGroupItem = {
  id: string;
  title: string;
  startQuestionNo: number;
  endQuestionNo: number;
  typeFormat: QuestionTypeFormat;
  instructions: string;
  wordLimitRule?: string; // e.g. "NO MORE THAN TWO WORDS AND/OR A NUMBER"
  sharedOptions?: SharedOptionItem[];
  allowOptionReused?: boolean;
  linkedAudioTimestamp?: string; // "02:15"
  questions: QuestionCardItem[];
  isCollapsed?: boolean;
};

export type PassageSection = {
  id: string;
  passageNo: number; // 1, 2, 3
  title: string;
  content: string; // Rich Text HTML
  teacherAnnotations?: { id: string; text: string; note: string; color: string }[];
  questionGroups: QuestionGroupItem[];
};

export type ListeningPartSection = {
  id: string;
  partNo: number; // 1, 2, 3, 4
  title: string;
  audioUrl?: string;
  audioFilename?: string;
  audioDurationSeconds?: number;
  transcriptHtml: string;
  questionGroups: QuestionGroupItem[];
};

export type IELTSWritingRubric = {
  taskAchievementWeight: number;
  coherenceCohesionWeight: number;
  lexicalResourceWeight: number;
  grammaticalAccuracyWeight: number;
  notes?: string;
};

export type WritingTaskSection = {
  id: string;
  taskNo: 1 | 2;
  title: string;
  promptHtml: string;
  imageUrl?: string;
  suggestedTimeMinutes: number;
  minWords: number; // 150 for Task 1, 250 for Task 2
  rubric: IELTSWritingRubric;
  sampleBand8Answer?: string;
  vocabularySuggestions?: string[];
  teacherNotes?: string;
  enableAiAssessment?: boolean;
};

export type IELTSSpeakingRubric = {
  fluencyCoherenceWeight: number;
  lexicalResourceWeight: number;
  grammaticalAccuracyWeight: number;
  pronunciationWeight: number;
  notes?: string;
};

export type SpeakingPartSection = {
  id: string;
  partNo: 1 | 2 | 3;
  topicTitle: string;
  cueCardPromptHtml: string;
  preparationTimeSeconds: number; // e.g. 60
  answerTimeSeconds: number; // e.g. 120
  followUpQuestions: string[];
  sampleResponseText?: string;
  sampleAudioUrl?: string;
  recordingConfig?: { allowReRecord: boolean; maxAttempts: number };
  rubric: IELTSSpeakingRubric;
  teacherNotes?: string;
};

export type TestBankItem = {
  id: string;
  code: string;
  title: string;
  purpose: TestPurpose;
  skill: TestSkill;
  testType: TestType;
  difficulty: string; // e.g., "Band 6.0-6.5"
  sectionsCount: number;
  totalQuestions: number;
  durationMinutes: number;
  version: string; // e.g. "v1.0"
  status: ContentLifecycleStatus;
  passages?: PassageSection[];
  listeningParts?: ListeningPartSection[];
  writingTasks?: WritingTaskSection[];
  speakingParts?: SpeakingPartSection[];
  tags: string[];
  referencedCoursesCount: number;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  builderContent?: Record<string, unknown>;
};

export type ValidationIssue = {
  id: string;
  severity: "ERROR" | "WARNING";
  sectionTitle: string;
  questionNo?: number;
  message: string;
  targetId: string;
};

export type MediaAsset = {
  id: string;
  code: string;
  filename: string;
  mimeType: "AUDIO" | "IMAGE" | "PDF" | "DOCUMENT";
  fileUrl: string;
  sizeBytes: number;
  durationSeconds?: number;
  dimensions?: { width: number; height: number };
  tags: string[];
  usedLocations: { type: "TEST" | "MATERIAL" | "LESSON"; name: string; id: string }[];
  uploadedBy: string;
  createdAt: string;
};

export type BulkImportRow = {
  rowIndex: number;
  code: string;
  title: string;
  skill: string;
  category: string;
  status: "VALID" | "ERROR";
  errorMessage?: string;
};
