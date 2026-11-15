import type {
  SaveSpeakingResponseItem,
  SpeakingAudioUpload,
  SpeakingAttemptResult,
  SpeakingExaminerSession,
  SpeakingExaminerTurnSubmission,
  SpeakingExamPartTwoReadyRequest,
  AbortSpeakingExamSessionRequest,
  SubmitSpeakingExaminerTurnRequest,
  SpeakingVocabLookupRequest,
  SpeakingVocabLookupResponse,
  StudentSpeakingAttempt,
  StudentWritingAssignment,
} from "@ielts/contracts";
import { ApiClientError } from "@ielts/api-client";
import { apiFetch, apiKeepalivePost, apiUpload } from "@/lib/api";

const speakingPath = "/student/speaking";
let timerControlAvailable = true;
const pendingPauses = new Map<string, Promise<void>>();

function timerControlMissing(error: unknown) {
  return error instanceof ApiClientError
    && (error.status === 404 || error.message.includes("No static resource"));
}

export function getSpeakingAssignments() {
  return apiFetch<StudentWritingAssignment[]>(`${speakingPath}/assignments`);
}

export function startOrResumeSpeakingSelfPractice(testVersionId: string, restart = false) {
  return apiFetch<StudentSpeakingAttempt>(`${speakingPath}/catalog/${testVersionId}/attempts${restart ? "?restart=true" : ""}`, { method: "POST" });
}

export function startOrResumeSpeakingAssignment(assignmentId: string) {
  return apiFetch<StudentSpeakingAttempt>(`${speakingPath}/assignments/${assignmentId}/attempts`, { method: "POST" });
}

export function getSpeakingAttempt(attemptId: string) {
  return apiFetch<StudentSpeakingAttempt>(`${speakingPath}/attempts/${attemptId}`);
}

export async function resumeSpeakingAttempt(attemptId: string) {
  if (!timerControlAvailable) return getSpeakingAttempt(attemptId);
  await pendingPauses.get(attemptId);
  try {
    return await apiFetch<StudentSpeakingAttempt>(`${speakingPath}/attempts/${attemptId}/resume`, { method: "POST" });
  } catch (error) {
    if (!timerControlMissing(error)) throw error;
    timerControlAvailable = false;
    return getSpeakingAttempt(attemptId);
  }
}

export async function pauseSpeakingAttempt(attemptId: string) {
  if (!timerControlAvailable) return;
  const inFlight = pendingPauses.get(attemptId);
  if (inFlight) return inFlight;

  const request = apiKeepalivePost(`${speakingPath}/attempts/${attemptId}/pause`)
    .catch((error) => {
      if (!timerControlMissing(error)) throw error;
      timerControlAvailable = false;
    })
    .finally(() => {
      if (pendingPauses.get(attemptId) === request) pendingPauses.delete(attemptId);
    });
  pendingPauses.set(attemptId, request);
  return request;
}

export function saveSpeakingResponses(attemptId: string, responses: SaveSpeakingResponseItem[]) {
  return apiFetch<StudentSpeakingAttempt>(`${speakingPath}/attempts/${attemptId}/responses`, {
    method: "PUT",
    body: JSON.stringify({ responses }),
  });
}

export function uploadSpeakingAudio(attemptId: string, questionKey: string, blob: Blob) {
  const body = new FormData();
  body.append("questionKey", questionKey);
  body.append("file", blob, "speaking-response.webm");
  return apiUpload<SpeakingAudioUpload>(`${speakingPath}/attempts/${attemptId}/audio`, body);
}

export function createOrResumeSpeakingExaminerSession(attemptId: string) {
  return apiFetch<SpeakingExaminerSession>(`${speakingPath}/attempts/${attemptId}/exam-session`, { method: "POST" });
}

export function getSpeakingExaminerSession(sessionId: string) {
  return apiFetch<SpeakingExaminerSession>(`${speakingPath}/exam-sessions/${sessionId}`);
}

export function submitSpeakingExaminerTurn(sessionId: string, request: SubmitSpeakingExaminerTurnRequest) {
  return apiFetch<SpeakingExaminerTurnSubmission>(`${speakingPath}/exam-sessions/${sessionId}/turns`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function markSpeakingExamPartTwoReady(sessionId: string, request: SpeakingExamPartTwoReadyRequest) {
  return apiFetch<SpeakingExaminerSession>(`${speakingPath}/exam-sessions/${sessionId}/part-2/ready`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function abortSpeakingExamSession(sessionId: string, request: AbortSpeakingExamSessionRequest) {
  return apiFetch<SpeakingExaminerSession>(`${speakingPath}/exam-sessions/${sessionId}/abort`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function requestSpeakingAiEvaluation(attemptId: string) {
  return apiFetch<{ queuedCount: number }>(`${speakingPath}/attempts/${attemptId}/ai-evaluation`, {
    method: "POST",
  });
}

export function submitSpeakingAttempt(attemptId: string) {
  return apiFetch<SpeakingAttemptResult>(`${speakingPath}/attempts/${attemptId}/submit`, { method: "POST" });
}

export function getSpeakingAttemptResult(attemptId: string) {
  return apiFetch<SpeakingAttemptResult>(`${speakingPath}/attempts/${attemptId}/result`);
}

export function lookupSpeakingVocab(payload: SpeakingVocabLookupRequest) {
  return apiFetch<SpeakingVocabLookupResponse>(`${speakingPath}/vocab-lookup`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
