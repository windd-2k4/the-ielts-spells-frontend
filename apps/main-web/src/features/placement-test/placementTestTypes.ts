export type PlacementTestStatus = "NOT_STARTED" | "SURVEY" | "IN_PROGRESS" | "GRADING" | "COMPLETED";

export interface PlacementSurveyData {
  targetBand: number;
  examDate?: string;
  studyHoursPerWeek: number;
}

export interface SkillDetailedAnalysisItem {
  criterion: string;
  badge?: "Sai nhiều nhất" | "Sai khá nhiều" | string;
  score?: number;
  detailedFeedback: string;
}

export interface SkillReportSection {
  skill: "READING" | "LISTENING" | "WRITING_T1" | "WRITING_T2" | "SPEAKING";
  band: number;
  overallComment: string;
  criteriaAnalysis: SkillDetailedAnalysisItem[];
  knowledgeToLearn: Array<{
    title: string;
    description: string;
  }>;
}

export interface DetailedPlacementReport {
  reading: SkillReportSection;
  listening: SkillReportSection;
  writingTask1: SkillReportSection;
  writingTask2: SkillReportSection;
  speaking: SkillReportSection;
}

export interface StudentPlacementTestRecord {
  id: string;
  studentId: string;
  status: PlacementTestStatus;
  targetBand: number;
  examDate?: string;
  studyHoursPerWeek: number;
  readingAttemptId?: string | null;
  listeningAttemptId?: string | null;
  writingT1AttemptId?: string | null;
  writingT2AttemptId?: string | null;
  speakingAttemptId?: string | null;
  estimatedOverallBand?: number | null;
  estimatedReadingBand?: number | null;
  estimatedListeningBand?: number | null;
  estimatedWritingBand?: number | null;
  estimatedSpeakingBand?: number | null;
  detailedReport?: DetailedPlacementReport | null;
  startedAt: string;
  completedAt?: string | null;
}

export const FIXED_PLACEMENT_TESTS = {
  READING: {
    testId: "0dee147f-bbdf-483f-a399-2642c452ac92",
    versionId: "838a5f5d-3c18-42ab-bd9f-53aa0c879604",
    title: "Reading",
    durationMinutes: 60,
    totalQuestions: 40,
    skillType: "READING" as const,
  },
  LISTENING: {
    testId: "51c30e86-2bfe-4dbd-9bd1-132a623368bb",
    versionId: "f93eed49-78d6-4230-a088-bc007edee6fb",
    title: "Listening",
    durationMinutes: 27,
    totalQuestions: 40,
    skillType: "LISTENING" as const,
  },
  WRITING_T1: {
    testId: "e4fac1e4-e6c6-4709-9656-a3018445e792",
    versionId: "51607221-130b-42c9-bf8b-8ddbc0f1cc56",
    title: "Writing Task 1",
    durationMinutes: 20,
    totalQuestions: 1,
    skillType: "WRITING" as const,
  },
  WRITING_T2: {
    testId: "9c01125f-2517-4991-af55-9443fe7f0d47",
    versionId: "6f647982-e37e-4d5b-8199-00cbcc8467d4",
    title: "Writing Task 2",
    durationMinutes: 40,
    totalQuestions: 1,
    skillType: "WRITING" as const,
  },
  SPEAKING: {
    testId: "a1111111-2222-3333-4444-555555555555",
    versionId: "48cc9b26-ee76-445c-a6a5-4a770ed92a15",
    title: "Speaking",
    durationMinutes: 13,
    totalQuestions: 17,
    skillType: "SPEAKING" as const,
  },
};
