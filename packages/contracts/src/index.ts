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

export type ReadingAssignmentMode = "PRACTICE" | "EXAM";

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

export interface ReadingAnswer {
  value?: string;
  values?: string[];
}

export interface ReadingQuestionOption {
  key: string;
  code: string;
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
}

export interface SavedReadingResponse {
  questionKey: string;
  answer: ReadingAnswer;
  clientRevision: number;
  answeredAt: string;
}

export interface StudentReadingAttempt {
  attemptId: string;
  assignmentId: string;
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

export interface ReadingQuestionResult {
  questionKey: string;
  questionNo: number;
  answered: boolean;
  correct: boolean | null;
  score: number;
  maxScore: number;
  correctAnswers: string[];
  explanation: string | null;
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
