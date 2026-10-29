import type {
  ReadingAttemptResult,
  ReadingAnnotation,
  SaveReadingAnnotationRequest,
  SaveReadingResponsesRequest,
  StudentReadingAssignment,
  StudentReadingAttempt,
  StudentReadingCatalogItem,
  SaveTestAttemptQuestionReviewRequest,
  TestAttemptQuestionReview,
} from "@ielts/contracts";
import { ApiClientError } from "@ielts/api-client";
import { apiFetch, apiKeepalivePost } from "@/lib/api";

let timerControlAvailable = true;
const pendingPauses = new Map<string, Promise<void>>();

function timerControlMissing(error: unknown) {
  return error instanceof ApiClientError
    && (error.status === 404 || error.message.includes("No static resource"));
}

function resolvePath(skill?: string) {
  return skill && skill.toLowerCase() === "listening" ? "/student/listening" : "/student/reading";
}

export function getReadingAssignments(skill: string = "reading") {
  return apiFetch<StudentReadingAssignment[]>(`${resolvePath(skill)}/assignments`);
}

export function getPublishedReadingTests() {
  return apiFetch<StudentReadingCatalogItem[]>("/student/reading/catalog");
}

export function startOrResumeSelfPractice(testVersionId: string, skill: string = "reading", restart = false) {
  return apiFetch<StudentReadingAttempt>(`${resolvePath(skill)}/catalog/${testVersionId}/attempts${restart ? "?restart=true" : ""}`, {
    method: "POST",
  });
}

export function startOrResumeReadingAttempt(assignmentId: string, skill: string = "reading") {
  return apiFetch<StudentReadingAttempt>(`${resolvePath(skill)}/assignments/${assignmentId}/attempts`, {
    method: "POST",
  });
}

export function getReadingAttempt(attemptId: string, skill: string = "reading") {
  return apiFetch<StudentReadingAttempt>(`${resolvePath(skill)}/attempts/${attemptId}`);
}

export async function resumeReadingAttempt(attemptId: string, skill: string = "reading") {
  if (!timerControlAvailable) return getReadingAttempt(attemptId, skill);
  await pendingPauses.get(`${resolvePath(skill)}:${attemptId}`);
  try {
    return await apiFetch<StudentReadingAttempt>(`${resolvePath(skill)}/attempts/${attemptId}/resume`, { method: "POST" });
  } catch (error) {
    if (!timerControlMissing(error)) throw error;
    timerControlAvailable = false;
    return getReadingAttempt(attemptId, skill);
  }
}

export async function pauseReadingAttempt(attemptId: string, skill: string = "reading") {
  if (!timerControlAvailable) return;
  const path = resolvePath(skill);
  const key = `${path}:${attemptId}`;
  const inFlight = pendingPauses.get(key);
  if (inFlight) return inFlight;

  const request = apiKeepalivePost(`${path}/attempts/${attemptId}/pause`)
    .catch((error) => {
      if (!timerControlMissing(error)) throw error;
      timerControlAvailable = false;
    })
    .finally(() => {
      if (pendingPauses.get(key) === request) pendingPauses.delete(key);
    });
  pendingPauses.set(key, request);
  return request;
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

export function getReadingAttemptReviews(attemptId: string, skill: string = "reading") {
  return apiFetch<TestAttemptQuestionReview[]>(`${resolvePath(skill)}/attempts/${attemptId}/reviews`);
}

export function saveReadingAttemptReview(
  attemptId: string,
  questionKey: string,
  request: SaveTestAttemptQuestionReviewRequest,
  skill: string = "reading",
) {
  return apiFetch<TestAttemptQuestionReview>(
    `${resolvePath(skill)}/attempts/${attemptId}/reviews/${encodeURIComponent(questionKey)}`,
    { method: "PUT", body: JSON.stringify(request) },
  );
}

export function deleteReadingAttemptReview(attemptId: string, questionKey: string, skill: string = "reading") {
  return apiFetch<void>(`${resolvePath(skill)}/attempts/${attemptId}/reviews/${encodeURIComponent(questionKey)}`, {
    method: "DELETE",
  });
}
