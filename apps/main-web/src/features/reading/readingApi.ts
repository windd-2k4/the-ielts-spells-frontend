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

const readingPath = "/student/reading";

export function getReadingAssignments() {
  return apiFetch<StudentReadingAssignment[]>(`${readingPath}/assignments`);
}

export function getPublishedReadingTests() {
  return apiFetch<StudentReadingCatalogItem[]>(`${readingPath}/catalog`);
}

export function startOrResumeSelfPractice(testVersionId: string) {
  return apiFetch<StudentReadingAttempt>(`${readingPath}/catalog/${testVersionId}/attempts`, {
    method: "POST",
  });
}

export function startOrResumeReadingAttempt(assignmentId: string) {
  return apiFetch<StudentReadingAttempt>(`${readingPath}/assignments/${assignmentId}/attempts`, {
    method: "POST",
  });
}

export function getReadingAttempt(attemptId: string) {
  return apiFetch<StudentReadingAttempt>(`${readingPath}/attempts/${attemptId}`);
}

export function saveReadingResponses(attemptId: string, request: SaveReadingResponsesRequest) {
  return apiFetch<StudentReadingAttempt>(`${readingPath}/attempts/${attemptId}/responses`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function saveReadingAnnotation(attemptId: string, annotationId: string, request: SaveReadingAnnotationRequest) {
  return apiFetch<ReadingAnnotation>(`${readingPath}/attempts/${attemptId}/annotations/${annotationId}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function deleteReadingAnnotation(attemptId: string, annotationId: string) {
  return apiFetch<void>(`${readingPath}/attempts/${attemptId}/annotations/${annotationId}`, {
    method: "DELETE",
  });
}

export function submitReadingAttempt(attemptId: string) {
  return apiFetch<ReadingAttemptResult>(`${readingPath}/attempts/${attemptId}/submit`, {
    method: "POST",
  });
}

export function getReadingAttemptResult(attemptId: string) {
  return apiFetch<ReadingAttemptResult>(`${readingPath}/attempts/${attemptId}/result`);
}
