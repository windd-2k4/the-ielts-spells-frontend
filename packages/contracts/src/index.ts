/** Roles issued in the Supabase JWT and accepted by the current application. */
export const userRoles = [
  "admin",
  "admissions",
  "social_media",
  "teacher",
  "student_support",
  "student",
] as const;

export type UserRole = (typeof userRoles)[number];

export const managementRoles = [
  "admin",
  "admissions",
  "social_media",
  "teacher",
  "student_support",
] as const satisfies readonly UserRole[];

export type ManagementRole = (typeof managementRoles)[number];

export interface CourseSummary {
  id: string;
  name: string;
  targetBand: string;
  durationWeeks: number;
}

export interface ProgressSummary {
  completionRate: number;
  overdueTasks: number;
  latestScore?: number;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export type IeltsSkill = "READING" | "LISTENING" | "WRITING" | "SPEAKING";

export type PracticeProgressFilter = "ALL" | "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface PracticeCoverImage {
  fileUrl?: string;
  altText?: string;
}

export interface StudentPracticeCatalogItem {
  testId: string;
  testVersionId: string;
  code: string;
  title: string;
  description: string | null;
  skill: IeltsSkill;
  testType: "FULL_TEST" | "SINGLE_SKILL";
  format: string;
  sectionsCount: number;
  totalItems: number;
  durationMinutes: number;
  tags: string[];
  questionTypes: string[];
  coverImage: PracticeCoverImage;
  publishedAt: string;
  attemptsCount: number;
  activeAttemptId: string | null;
  activeAttemptExpiresAt: string | null;
  lastScore: number | null;
  deliveryReady: boolean;
}

export type ReadingAssignmentMode = "PRACTICE" | "EXAM";

export interface TestAssignment {
  id: string;
  testId: string;
  testVersionId: string;
  testTitle: string;
  versionLabel: string;
  skill: "READING" | "WRITING";
  courseId: string;
  courseName: string;
  mode: ReadingAssignmentMode;
  opensAt: string | null;
  closesAt: string | null;
  maxAttempts: number;
  durationSeconds: number | null;
  showResultAfterSubmit: boolean;
  archivedAt: string | null;
  createdAt: string;
}

export interface CreateTestAssignmentRequest {
  testVersionId: string;
  courseId: string;
  opensAt: string | null;
  closesAt: string | null;
  maxAttempts: number;
  mode: ReadingAssignmentMode;
  durationSeconds: number | null;
  showResultAfterSubmit: boolean;
}

export type ReadingAttemptStatus = "IN_PROGRESS" | "GRADED" | "EXPIRED";

export type ReadingQuestionType =
  | "MULTIPLE_CHOICE"
  | "MULTIPLE_ANSWERS"
  | "TRUE_FALSE_NOT_GIVEN"
  | "YES_NO_NOT_GIVEN"
  | "MATCHING_HEADINGS"
  | "MATCHING_INFORMATION"
  | "MATCHING_FEATURES"
  | "MATCHING_SENTENCE_ENDINGS"
  | "FILL_IN_BLANK"
  | "SHORT_ANSWER"
  | "SENTENCE_COMPLETION"
  | "SUMMARY_COMPLETION"
  | "NOTE_COMPLETION"
  | "TABLE_COMPLETION"
  | "FLOW_CHART_COMPLETION"
  | "DIAGRAM_LABELING";

export interface StudentReadingAssignment {
  assignmentId: string;
  testVersionId: string;
  title: string;
  versionLabel: string;
  courseId: string;
  courseName: string;
  mode: ReadingAssignmentMode;
  opensAt: string | null;
  closesAt: string | null;
  maxAttempts: number;
  attemptsUsed: number;
  durationSeconds: number | null;
  activeAttemptExpiresAt: string | null;
}

export interface StudentReadingCatalogItem {
  testId: string;
  testVersionId: string;
  code: string;
  title: string;
  description: string | null;
  testType: "FULL_TEST" | "SINGLE_SKILL";
  sectionsCount: number;
  totalQuestions: number;
  durationMinutes: number;
  tags: string[];
  publishedAt: string;
  attemptsCount: number;
  activeAttemptId: string | null;
  activeAttemptExpiresAt: string | null;
  lastScore: number | null;
}

export interface ReadingAnswer {
  value?: string;
  values?: string[];
}

export interface ReadingQuestionOption {
  key: string;
  code: string | null;
  text: string;
}

export interface ReadingQuestion {
  key: string;
  number: number;
  typeFormat: ReadingQuestionType;
  prompt: string;
  maxScore: number;
  options: ReadingQuestionOption[];
}

export interface ReadingQuestionGroup {
  key: string;
  title: string;
  typeFormat: ReadingQuestionType;
  instructions: string | null;
  answerConfig: Record<string, unknown>;
  sharedOptions: ReadingQuestionOption[];
  questions: ReadingQuestion[];
}

export interface ReadingSection {
  key: string;
  sectionNo: number;
  title: string;
  contentHtml: string | null;
  questionGroups: ReadingQuestionGroup[];
  audioUrl?: string | null;
  audioFilename?: string | null;
  audioDurationSeconds?: number | null;
}

export interface SavedReadingResponse {
  questionKey: string;
  answer: ReadingAnswer;
  clientRevision: number;
  answeredAt: string;
}

export type ReadingAnnotationType = "HIGHLIGHT" | "NOTE" | "UNDERLINE" | "STRIKETHROUGH";
export type ReadingAnnotationColor = "YELLOW" | "GREEN" | "PINK" | "CYAN" | "RED" | "INK";

export interface ReadingAnnotation {
  id: string;
  sectionKey: string;
  type: ReadingAnnotationType;
  color: ReadingAnnotationColor;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  prefix: string;
  suffix: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveReadingAnnotationRequest {
  sectionKey: string;
  type: ReadingAnnotationType;
  color: ReadingAnnotationColor;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  prefix: string;
  suffix: string;
  note: string | null;
}

export interface StudentReadingAttempt {
  attemptId: string;
  assignmentId: string | null;
  testVersionId: string;
  status: ReadingAttemptStatus;
  startedAt: string;
  expiresAt: string;
  remainingSeconds: number;
  title: string;
  description: string | null;
  allowResultAfterSubmit: boolean;
  sections: ReadingSection[];
  responses: SavedReadingResponse[];
  annotations: ReadingAnnotation[];
  autoScore: number | null;
  finalScore: number | null;
}

export interface SaveReadingResponseItem {
  questionKey: string;
  answer: ReadingAnswer;
  clientRevision: number;
}

export interface SaveReadingResponsesRequest {
  responses: SaveReadingResponseItem[];
}

export type WritingAttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";

export interface WritingTask {
  taskKey: string;
  taskNo: number;
  title: string;
  promptHtml: string;
  imageUrl: string | null;
  imageAltText: string | null;
  minWords: number;
  suggestedTimeMinutes: number;
  responseMode: "FREEFORM" | "STRUCTURED";
  sampleBand8Answer: string | null;
}

export interface SavedWritingResponse {
  taskKey: string;
  text: string;
  wordCount: number;
  clientRevision: number;
  answeredAt: string;
}

export interface StudentWritingAttempt {
  attemptId: string;
  assignmentId: string | null;
  testVersionId: string;
  status: WritingAttemptStatus;
  startedAt: string;
  expiresAt: string;
  remainingSeconds: number;
  title: string;
  description: string | null;
  allowResultAfterSubmit: boolean;
  tasks: WritingTask[];
  responses: SavedWritingResponse[];
}

export interface SaveWritingResponseItem {
  taskKey: string;
  text: string;
  clientRevision: number;
}

export interface StudentWritingAssignment extends StudentReadingAssignment {}

export interface WritingEvaluationResult {
  taskKey: string;
  aiStatus: "AI_COMPLETED" | "NOT_ELIGIBLE" | "QUEUED" | "PROCESSING" | "FAILED";
  aiErrorMessage: string | null;
  overallBandAi: number | null;
  aiCriterionBands: Record<string, number>;
  aiStrengths: string[];
  aiImprovements: string[];
  aiCompletedAt: string | null;
  teacherStatus: "AVAILABLE" | "REVIEWED" | "PUBLISHED";
  overallBandTeacher: number | null;
  teacherCriterionBands: Record<string, number>;
  teacherStrengths: string[];
  teacherImprovements: string[];
  teacherPublishedAt: string | null;
  teacherEditedText: string | null;
  teacherEditedHtml: string | null;
  teacherAnnotations: WritingTeacherAnnotation[];
}

export interface WritingTeacherAnnotation {
  id: string | null;
  start: number;
  end: number;
  selectedText: string | null;
  replacement: string | null;
  comment: string | null;
  criterion: string | null;
  kind: "COMMENT" | "REPLACE" | "HIGHLIGHT" | null;
  severity: "SUGGESTION" | "ERROR" | "MAJOR" | null;
}

export interface WritingAttemptResult {
  attemptId: string;
  status: WritingAttemptStatus;
  submittedAt: string;
  resultVisible: boolean;
  attemptOrigin: "ASSIGNMENT" | "SELF_PRACTICE";
  aiEligible: boolean;
  /** Full Writing band: (Task 1 + 2 × Task 2) / 3, rounded to the nearest half band. */
  overallBandAi: number | null;
  /** Available only after the teacher scores for both tasks are published. */
  overallBandTeacher: number | null;
  tasks: WritingTask[];
  responses: SavedWritingResponse[];
  evaluations: WritingEvaluationResult[];
}

export interface ReadingQuestionResult {
  questionKey: string;
  questionNo: number;
  answered: boolean;
  correct: boolean | null;
  score: number;
  maxScore: number;
  correctAnswers: string[];
  explanation: string | null;
  /**
   * Structured solution content. `explanation` remains available so that
   * published versions created before this field can still be rendered.
   */
  solution: ReadingQuestionSolution | null;
  /** All passage references authored for this question, in author order. */
  evidenceSpans: ReadingEvidenceSpan[];
  /** @deprecated Use `evidenceSpans`; retained for previously published tests. */
  evidenceSpan: ReadingEvidenceSpan | null;
}

export type ReadingEvidenceMode = "DIRECT_QUOTE" | "WHOLE_PARAGRAPH" | "NO_DIRECT_EVIDENCE";

export interface ReadingEvidenceSpan {
  id: string | null;
  /** Null when the teacher deliberately records that no passage quote applies. */
  start: number | null;
  /** Null when the teacher deliberately records that no passage quote applies. */
  end: number | null;
  quote: string | null;
  prefix: string | null;
  suffix: string | null;
  paragraphKey: string | null;
  label: string | null;
  mode: ReadingEvidenceMode;
}

export interface ReadingQuestionSolution {
  explanation: string | null;
  reasoningSteps: string[];
  trapAnalysis: string | null;
  vocabularyNotes: string | null;
  /** Optional published follow-up resource selected by the teacher. */
  relatedLessonUrl: string | null;
}

export interface ReadingAttemptResult {
  attemptId: string;
  status: Exclude<ReadingAttemptStatus, "IN_PROGRESS">;
  submittedAt: string | null;
  expiresAt: string;
  autoScore: number | null;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  resultVisible: boolean;
  questions: ReadingQuestionResult[];
}

export type PublishStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: Record<string, unknown>;
  seoMetadata: Record<string, unknown>;
  status: PublishStatus;
  publishedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CmsPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: Record<string, unknown>;
  coverPath: string | null;
  tags: string[];
  status: PublishStatus;
  publishedAt: string | null;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CmsBanner {
  id: string;
  title: string;
  subtitle: string | null;
  mediaPath: string | null;
  targetUrl: string | null;
  position: string;
  displayOrder: number;
  startsAt: string | null;
  endsAt: string | null;
  status: PublishStatus;
  campaignId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  source: string | null;
  medium: string | null;
  campaignCode: string | null;
  startsAt: string | null;
  endsAt: string | null;
  budget: number | null;
  active: boolean;
  createdBy: string | null;
  createdAt: string;
}

export interface StudentSupportCourse {
  id: string;
  code: string;
  name: string;
  level: string | null;
  skillPair: "LISTENING_READING" | "SPEAKING_WRITING";
  targetBand: number | null;
  capacity: number;
  startsOn: string;
  endsOn: string | null;
  status: "OPEN" | "ACTIVE" | "COMPLETED" | "CANCELLED";
}

export interface StudentSupportStudent {
  studentId: string;
  studentCode: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarPath: string | null;
  currentBand: number | null;
  targetBand: number | null;
  enrollmentStatus: "PENDING" | "ACTIVE" | "PAUSED" | "COMPLETED" | "WITHDRAWN";
  startedOn: string | null;
  plannedExamMonth: string | null;
  examRegistrationStatus: string | null;
}

export interface StudentSupportActivityAttempt {
  id: string;
  studentId: string;
  score: number | null;
  maxScore: number | null;
  comprehensionPercent: number | null;
  completedAt: string | null;
}

export interface StudentSupportCourseProgress {
  classActivityId: string;
  title: string;
  skill: string;
  dueAt: string | null;
  required: boolean;
  attempts: StudentSupportActivityAttempt[];
}

// ================= SPEAKING TEST CONTRACTS =================

export interface SpeakingHintOption {
  id: string;
  label: string;
  phrase: string;
  fullSentence?: string;
}

export interface SpeakingHintStep {
  id: string;
  title: string;
  instruction: string;
  options: SpeakingHintOption[];
}

export interface SpeakingQuestion {
  id: string;
  questionKey: string;
  questionNo: number;
  promptText: string;
  audioUrl?: string | null;
  hintsEnabled: boolean;
  hintSteps: SpeakingHintStep[];
  sampleResponseText?: string | null;
  answerTimeSeconds?: number | null;
}

export interface SpeakingPart {
  id: string;
  partNo: number;
  topicTitle: string;
  cueCardPromptHtml?: string | null;
  cueCardBullets?: string[];
  audioUrl?: string | null;
  hintsEnabled: boolean;
  hintSteps?: SpeakingHintStep[];
  preparationTimeSeconds: number;
  answerTimeSeconds: number;
  followUpQuestions?: string[];
  questions: SpeakingQuestion[];
  sampleResponseText?: string | null;
}

export interface SpeakingSavedResponse {
  questionKey: string;
  audioUrl?: string | null;
  transcript?: string | null;
  hintChoices?: Record<string, string>;
  clientRevision: number;
  answeredAt?: string | null;
}

export interface StudentSpeakingAttempt {
  attemptId: string;
  testVersionId: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  remainingSeconds: number;
  pausedRemainingSeconds: number | null;
  isPaused: boolean;
  status: string;
  startedAt: string;
  expiresAt: string;
  allowResultAfterSubmit: boolean;
  parts: SpeakingPart[];
  responses: SpeakingSavedResponse[];
}

export interface SaveSpeakingResponseItem {
  questionKey: string;
  audioUrl?: string | null;
  transcript?: string | null;
  hintChoices?: Record<string, string>;
  clientRevision: number;
}

export interface SpeakingEvaluationResult {
  questionKey: string;
  status: string;
  overallBand: number | null;
  fluencyBand: number | null;
  lexicalBand: number | null;
  grammarBand: number | null;
  pronunciationBand: number | null;
  criteriaFeedback: Record<string, string>;
  strengths: string[];
  improvements: string[];
  evaluatedAt: string;
  teacherStatus: "AVAILABLE" | "REVIEWED" | "PUBLISHED";
  overallBandTeacher: number | null;
  fluencyBandTeacher: number | null;
  lexicalBandTeacher: number | null;
  grammarBandTeacher: number | null;
  pronunciationBandTeacher: number | null;
  teacherCriteriaFeedback: Record<string, string>;
  teacherFeedback: string | null;
  teacherStrengths: string[];
  teacherImprovements: string[];
  teacherPublishedAt: string | null;
}

export interface SpeakingAttemptResult {
  attemptId: string;
  status: string;
  submittedAt: string | null;
  resultVisible: boolean;
  aiEligible: boolean;
  parts: SpeakingPart[];
  responses: SpeakingSavedResponse[];
  evaluations: SpeakingEvaluationResult[];
}

export interface SpeakingVocabLookupRequest {
  query: string;
  direction: "EN_VI" | "VI_EN";
}

export interface SpeakingVocabExample {
  english: string;
  vietnamese: string;
}

export interface SpeakingVocabLookupResponse {
  query: string;
  direction: string;
  mainTranslation: string;
  phonetic: string;
  partOfSpeech: string;
  synonyms: string[];
  examples: SpeakingVocabExample[];
}
