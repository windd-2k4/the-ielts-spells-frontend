import type {
  SaveWritingResponseItem,
  StudentWritingAssignment,
  StudentWritingAttempt,
  WritingAttemptResult,
} from "@ielts/contracts";
import { ApiClientError } from "@ielts/api-client";
import { apiFetch } from "@/lib/api";

const writingPath = "/student/writing";
let timerControlAvailable = true;

function timerControlMissing(error: unknown) {
  return error instanceof ApiClientError
    && (error.status === 404 || error.message.includes("No static resource"));
}

export function getWritingAssignments() {
  return apiFetch<StudentWritingAssignment[]>(`${writingPath}/assignments`);
}

export function startOrResumeWritingSelfPractice(testVersionId: string, restart = false) {
  return apiFetch<StudentWritingAttempt>(`${writingPath}/catalog/${testVersionId}/attempts${restart ? "?restart=true" : ""}`, { method: "POST" });
}

export function startOrResumeWritingAssignment(assignmentId: string) {
  return apiFetch<StudentWritingAttempt>(`${writingPath}/assignments/${assignmentId}/attempts`, { method: "POST" });
}

export function getWritingAttempt(attemptId: string) {
  return apiFetch<StudentWritingAttempt>(`${writingPath}/attempts/${attemptId}`);
}

export async function resumeWritingAttempt(attemptId: string) {
  if (!timerControlAvailable) return getWritingAttempt(attemptId);
  try {
    return await apiFetch<StudentWritingAttempt>(`${writingPath}/attempts/${attemptId}/resume`, { method: "POST" });
  } catch (error) {
    if (!timerControlMissing(error)) throw error;
    timerControlAvailable = false;
    return getWritingAttempt(attemptId);
  }
}

export async function pauseWritingAttempt(attemptId: string) {
  if (!timerControlAvailable) return;
  try {
    await apiFetch<void>(`${writingPath}/attempts/${attemptId}/pause`, { method: "POST", keepalive: true });
  } catch (error) {
    if (!timerControlMissing(error)) throw error;
    timerControlAvailable = false;
  }
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
