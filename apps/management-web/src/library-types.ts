import type { Page } from "./academic-types";

export type LibrarySkill = "LISTENING" | "READING" | "WRITING" | "SPEAKING";
export type LibraryScope = "GLOBAL" | "COURSE";
export type LibraryStatus = "ACTIVE" | "ARCHIVED";
export type LibraryView = "RESOURCES" | "EXERCISES";

export type LearningResource = {
  id: string; code: string; title: string; description: string | null;
  skill: LibrarySkill; category: string; resourceType: string;
  scope: LibraryScope; courseId: string | null; externalUrl: string | null;
  teacherOnly: boolean; status: LibraryStatus; createdBy: string;
  createdAt: string; updatedAt: string;
};

export type LearningResourceFile = {
  id: string; resourceId: string; fileRole: string; originalFilename: string;
  mimeType: string; sizeBytes: number; previewSupported: boolean; createdAt: string;
};

export type ExerciseTemplate = {
  id: string; code: string; title: string; instructions: string | null;
  skill: LibrarySkill; category: string; exerciseType: string;
  completionMode: string; scope: LibraryScope; courseId: string | null;
  sourceUrl: string | null; durationMinutes: number | null; maxScore: number | null;
  attemptLimit: number | null; requiresTeacherReview: boolean;
  content: Record<string, unknown>; answerKey: Record<string, unknown>;
  status: LibraryStatus; createdBy: string; createdAt: string; updatedAt: string;
};

export type LibraryItem = LearningResource | ExerciseTemplate;
export type LibraryPage<T> = Page<T>;

export function isResource(item: LibraryItem): item is LearningResource {
  return "resourceType" in item;
}
