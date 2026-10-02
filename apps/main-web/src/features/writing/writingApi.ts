import type {
  SaveWritingResponseItem,
  StudentWritingAssignment,
  StudentWritingAttempt,
  WritingAttemptResult,
} from "@ielts/contracts";
import { apiFetch } from "@/lib/api";

const writingPath = "/student/writing";

export function getWritingAssignments() {
  return apiFetch<StudentWritingAssignment[]>(`${writingPath}/assignments`);
}

export function startOrResumeWritingSelfPractice(testVersionId: string) {
  return apiFetch<StudentWritingAttempt>(`${writingPath}/catalog/${testVersionId}/attempts`, { method: "POST" });
}

export function startOrResumeWritingAssignment(assignmentId: string) {
  return apiFetch<StudentWritingAttempt>(`${writingPath}/assignments/${assignmentId}/attempts`, { method: "POST" });
}

export function getWritingAttempt(attemptId: string) {
  return apiFetch<StudentWritingAttempt>(`${writingPath}/attempts/${attemptId}`);
}

export function saveWritingResponses(attemptId: string, responses: SaveWritingResponseItem[]) {
  return apiFetch<StudentWritingAttempt>(`${writingPath}/attempts/${attemptId}/responses`, {
    method: "PUT",
    body: JSON.stringify({ responses }),
  });
}

export function submitWritingAttempt(attemptId: string) {
  return apiFetch<WritingAttemptResult>(`${writingPath}/attempts/${attemptId}/submit`, { method: "POST" });
}

export function getWritingAttemptResult(attemptId: string) {
  return apiFetch<WritingAttemptResult>(`${writingPath}/attempts/${attemptId}/result`);
}
