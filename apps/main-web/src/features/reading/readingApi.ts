import type {
  ReadingAttemptResult,
  SaveReadingResponsesRequest,
  StudentReadingAssignment,
  StudentReadingAttempt,
} from "@ielts/contracts";
import { apiFetch } from "@/lib/api";

const readingPath = "/student/reading";

export function getReadingAssignments() {
  return apiFetch<StudentReadingAssignment[]>(`${readingPath}/assignments`);
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

export function submitReadingAttempt(attemptId: string) {
  return apiFetch<ReadingAttemptResult>(`${readingPath}/attempts/${attemptId}/submit`, {
    method: "POST",
  });
}

export function getReadingAttemptResult(attemptId: string) {
  return apiFetch<ReadingAttemptResult>(`${readingPath}/attempts/${attemptId}/result`);
}
