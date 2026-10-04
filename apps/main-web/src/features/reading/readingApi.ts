import type {
  ReadingAttemptResult,
  ReadingAnnotation,
  SaveReadingAnnotationRequest,
  SaveReadingResponsesRequest,
  StudentReadingAssignment,
  StudentReadingAttempt,
  StudentReadingCatalogItem,
} from "@ielts/contracts";
import { apiFetch } from "@/lib/api";

function resolvePath(skill?: string) {
  return skill && skill.toLowerCase() === "listening" ? "/student/listening" : "/student/reading";
}

export function getReadingAssignments() {
  return apiFetch<StudentReadingAssignment[]>("/student/reading/assignments");
}

export function getPublishedReadingTests() {
  return apiFetch<StudentReadingCatalogItem[]>("/student/reading/catalog");
}

export function startOrResumeSelfPractice(testVersionId: string, skill: string = "reading", restart = false) {
  return apiFetch<StudentReadingAttempt>(`${resolvePath(skill)}/catalog/${testVersionId}/attempts${restart ? "?restart=true" : ""}`, {
    method: "POST",
  });
}

export function startOrResumeReadingAttempt(assignmentId: string) {
  return apiFetch<StudentReadingAttempt>(`/student/reading/assignments/${assignmentId}/attempts`, {
    method: "POST",
  });
}

export function getReadingAttempt(attemptId: string, skill: string = "reading") {
  return apiFetch<StudentReadingAttempt>(`${resolvePath(skill)}/attempts/${attemptId}`);
}

export function saveReadingResponses(attemptId: string, request: SaveReadingResponsesRequest, skill: string = "reading") {
  return apiFetch<StudentReadingAttempt>(`${resolvePath(skill)}/attempts/${attemptId}/responses`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function saveReadingAnnotation(attemptId: string, annotationId: string, request: SaveReadingAnnotationRequest, skill: string = "reading") {
  return apiFetch<ReadingAnnotation>(`${resolvePath(skill)}/attempts/${attemptId}/annotations/${annotationId}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function deleteReadingAnnotation(attemptId: string, annotationId: string, skill: string = "reading") {
  return apiFetch<void>(`${resolvePath(skill)}/attempts/${attemptId}/annotations/${annotationId}`, {
    method: "DELETE",
  });
}

export function submitReadingAttempt(attemptId: string, skill: string = "reading") {
  return apiFetch<ReadingAttemptResult>(`${resolvePath(skill)}/attempts/${attemptId}/submit`, {
    method: "POST",
  });
}

export function getReadingAttemptResult(attemptId: string, skill: string = "reading") {
  return apiFetch<ReadingAttemptResult>(`${resolvePath(skill)}/attempts/${attemptId}/result`);
}
