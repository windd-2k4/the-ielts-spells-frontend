export type UserRole = "admin" | "cms_editor" | "admissions" | "teacher" | "teaching_assistant" | "student";

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
