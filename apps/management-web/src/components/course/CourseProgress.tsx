import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen, Check, CheckSquare, Clock, Ear, Gear, ImageSquare, LockKey, MagnifyingGlass,
  Microphone, Pencil, Square, Trash, WarningCircle, X,
} from "@phosphor-icons/react";
import { useSearchParams } from "react-router-dom";
import type {
  ActivityAttempt, ActivityChecklistItem, ClassActivityProgress, ClassSession, SkillPair,
} from "../../academic-types";
import { apiFetch, apiMediaUrl, revokeMediaUrl } from "../../lib/api";

interface StudentSummary {
  id: string;
  studentCode: string;
  fullName: string;
}

type Roster = { enrollment: { id: string; courseId: string; studentId: string; status: string }; student: StudentSummary }[];
type SkillType = "LISTENING" | "READING" | "WRITING" | "SPEAKING";
type QueueFilter = "ALL" | "PENDING" | "REVISION";
type ReminderFilter = "ALL" | "NOT_STARTED" | "IN_PROGRESS" | "WAITING_REVIEW" | "REVISION" | "OVERDUE";
type TestAttemptFilter = "ALL" | "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "LOW_SCORE";
type ReviewCriterion = { criterion: string; score: number | null; feedback: string | null; sortOrder: number };
type InlineAnnotation = { id?: string; startOffset: number; endOffset: number; quotedText: string; comment: string; suggestion: string | null; sortOrder: number };
type SubmissionAudioFile = { id: string; promptKey: string; promptTitle: string; sortOrder: number; originalName: string; mimeType: string; sizeBytes: number; url: string };
type AssignmentSubmission = {
  id: string;
  studentId: string;
  studentName: string;
  textContent: string | null;
  status: string;
  score: number | null;
  reviewStatus: string | null;
  reflection: string | null;
  feedback: string | null;
  audioUrl: string | null;
  extensionDueAt: string | null;
  extensionReason: string | null;
  reflectionDueAt: string | null;
  audioFiles: SubmissionAudioFile[];
  criteria: ReviewCriterion[];
  annotations: InlineAnnotation[];
};

type RubricDraft = { criterion: string; label: string; score: string; feedback: string };
type AssignmentContactLog = { id: string; studentId: string; studentName: string; actorId: string; actorName: string; channel: string; action: string; message: string; createdAt: string };
type AssignmentSettingsDraft = {
  opensAt: string;
  dueAt: string;
  allowResubmission: boolean;
  latePolicy: string;
  lateGraceMinutes: string;
  reflectionDueAt: string;
};
type TestAttemptSummary = {
  attemptId: string;
  assignmentId: string;
  testVersionId: string;
  courseId: string;
  sessionId: string | null;
  sessionNo: number | null;
  sessionTitle: string | null;
  studentId: string;
  studentCode: string;
  studentName: string;
  testTitle: string;
  versionLabel: string;
  skill: SkillType;
  attemptNo: number;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  durationSeconds: number;
  score: number | null;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
};
type TestAttemptReview = {
  attempt: TestAttemptSummary;
  attemptHistory: TestAttemptSummary[];
  attemptPayload: {
    status: string;
    startedAt: string;
    expiresAt: string;
    sections: TestAttemptSection[];
    responses: { questionKey: string; answer: Record<string, unknown>; answeredAt: string }[];
  };
  result: {
    submittedAt: string | null;
    autoScore: number | null;
    maxScore: number;
    correctCount: number;
    incorrectCount: number;
    unansweredCount: number;
    questions: TestQuestionResult[];
  } | null;
  reviews: TestAttemptQuestionReview[];
};
type TestAttemptQuestionReview = {
  attemptId: string;
  questionKey: string;
  reasonCode: string;
  note: string | null;
  needsRetry: boolean;
  vocabularyTerm: string | null;
  vocabularyMeaning: string | null;
  reviewedAt: string;
  updatedAt: string;
};
type TestAttemptInsights = {
  questionTypes: { type: string; wrongCount: number; answeredCount: number; reviewedCount: number }[];
  reasons: { reasonCode: string; count: number }[];
  trends: { studentId: string; studentCode: string; studentName: string; testTitle: string; attemptNo: number; score: number | null; maxScore: number; submittedAt: string | null }[];
  pendingReviews: number;
  listeningParts: { partNo: number; title: string; wrongCount: number; answeredCount: number; reviewedCount: number }[];
};
type TestMatrixStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "LOW_SCORE";
type TestMatrixAssignment = { id: string; title: string; versionLabel: string; activity: ClassActivityProgress | null };
type TestMatrixCell = { status: TestMatrixStatus; attempt: TestAttemptSummary | null };
type TestAttemptSection = {
  sectionNo: number;
  title: string;
  contentHtml: string;
  audioUrl?: string;
  audioFilename?: string;
  audioDurationSeconds?: number;
  questionGroups?: { title: string; answerConfig?: Record<string, unknown> }[];
};
type TestQuestionResult = {
  questionKey: string;
  questionNo: number;
  answer: Record<string, unknown>;
  answered: boolean;
  correct: boolean | null;
  score: number;
  maxScore: number;
  correctAnswers: string[];
  explanation: string | null;
  solution?: { explanation: string | null; reasoningSteps: string[]; trapAnalysis: string | null; vocabularyNotes: string | null } | null;
};

const WRITING_RUBRIC = [
  ["TASK_RESPONSE", "Task Achievement / Response"],
  ["COHERENCE_COHESION", "Coherence & Cohesion"],
  ["LEXICAL_RESOURCE", "Lexical Resource"],
  ["GRAMMATICAL_RANGE_ACCURACY", "Grammatical Range & Accuracy"],
] as const;

const SPEAKING_RUBRIC = [
  ["FLUENCY_COHERENCE", "Fluency & Coherence"],
  ["LEXICAL_RESOURCE", "Lexical Resource"],
  ["GRAMMATICAL_RANGE_ACCURACY", "Grammatical Range & Accuracy"],
  ["PRONUNCIATION", "Pronunciation"],
] as const;

const ERROR_REASON_LABELS: Record<string, string> = {
  UNKNOWN_VOCABULARY: "Không biết từ",
  LOST_FOCUS: "Mất tập trung",
  DISTRACTOR: "Bị distractor đánh lừa",
  SPELLING: "Sai spelling",
  MISHEARD: "Nghe nhầm",
  QUESTION_MISUNDERSTOOD: "Hiểu sai câu hỏi",
  OTHER: "Lý do khác",
};

const QUESTION_TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "Multiple choice",
  MULTIPLE_ANSWERS: "Multiple answers",
  MATCHING: "Matching",
  FORM_COMPLETION: "Form completion",
  NOTE_COMPLETION: "Note completion",
  TABLE_COMPLETION: "Table completion",
  SENTENCE_COMPLETION: "Sentence completion",
  SUMMARY_COMPLETION: "Summary completion",
  MAP_LABELING: "Map labeling",
  SHORT_ANSWER: "Short answer",
};

interface CourseProgressProps {
  courseId: string;
  skillPair: SkillPair;
  roster: Roster;
  initialSessions?: ClassSession[];
  onSelectStudent?: (studentId: string) => void;
}

const STANDARD_TASKS = [
  { key: "translation", label: "Dịch bài" },
  { key: "vocabulary", label: "Từ vựng + test" },
  { key: "reread", label: "Đọc hiểu không cần từ vựng" },
] as const;

const REPORT_ROWS = [
  { key: "result", label: "Kết quả" },
  { key: "errors", label: "Phân tích lỗi sai" },
  ...STANDARD_TASKS,
  { key: "duration", label: "Tổng thời gian làm bài" },
  { key: "comprehension", label: "Mức độ thấu hiểu" },
] as const;
type ReportRow = typeof REPORT_ROWS[number];

function formatDuration(seconds: number | null) {
  if (seconds == null) return "—";
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes < 60 ? `${minutes} phút` : `${Math.floor(minutes / 60)}g ${minutes % 60}p`;
}

function ieltsBand(attempt: TestAttemptSummary) {
  if (attempt.maxScore !== 40) return null;
  const score = attempt.correctCount;
  const listening = attempt.skill === "LISTENING";
  if (score >= 39) return 9;
  if (score >= 37) return 8.5;
  if (score >= 35) return 8;
  if (score >= (listening ? 32 : 33)) return 7.5;
  if (score >= 30) return 7;
  if (score >= (listening ? 26 : 27)) return 6.5;
  if (score >= 23) return 6;
  if (score >= (listening ? 18 : 19)) return 5.5;
  if (score >= (listening ? 16 : 15)) return 5;
  if (score >= 13) return 4.5;
  if (score >= 10) return 4;
  if (score >= 8) return 3.5;
  if (score >= 6) return 3;
  if (score >= 4) return 2.5;
  return 2;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

function testMatrixStatus(attempt: TestAttemptSummary | null): TestMatrixStatus {
  if (!attempt) return "NOT_STARTED";
  if (attempt.status === "IN_PROGRESS") return "IN_PROGRESS";
  if (attempt.score != null && attempt.maxScore > 0 && attempt.score / attempt.maxScore < 0.6) return "LOW_SCORE";
  return "SUBMITTED";
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadCsv(filename: string, rows: unknown[][]) {
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function sectionTimestamps(section: TestAttemptSection) {
  return Array.from(new Set((section.questionGroups ?? [])
    .map((group) => group.answerConfig?.linkedAudioTimestamp)
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)));
}

function dateTimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isoDateTime(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function latestAttempt(activity: ClassActivityProgress, studentId: string) {
  return activity.attempts
    .filter((attempt) => attempt.studentId === studentId)
    .sort((left, right) => right.attemptNo - left.attemptNo)[0];
}

function matchesReminderFilter(activity: ClassActivityProgress, studentId: string, filter: ReminderFilter) {
  const attempt = latestAttempt(activity, studentId);
  if (filter === "ALL") return true;
  if (filter === "NOT_STARTED") return !attempt;
  if (filter === "IN_PROGRESS") return attempt?.status === "IN_PROGRESS";
  if (filter === "WAITING_REVIEW") return attempt?.status === "WAITING_REVIEW" || attempt?.reviewStatus === "PENDING";
  if (filter === "REVISION") return attempt?.status === "NEEDS_REVISION"
    || attempt?.reviewStatus === "REVISION_REQUESTED" || attempt?.reviewStatus === "REJECTED";
  return Boolean(activity.dueAt && new Date(activity.dueAt).getTime() < Date.now()
    && (!attempt || !["COMPLETED", "SUBMITTED", "WAITING_REVIEW"].includes(attempt.status)));
}

function isExerciseComplete(attempt?: ActivityAttempt) {
  return Boolean(attempt && (
    attempt.completedAt || attempt.submittedAt || attempt.evidence?.length ||
    ["SUBMITTED", "WAITING_REVIEW", "NEEDS_REVISION", "COMPLETED"].includes(attempt.status)
  ));
}

function hasQueueStatus(activity: ClassActivityProgress, filter: Exclude<QueueFilter, "ALL">) {
  return activity.attempts.some((attempt) => attempt.status !== "IN_PROGRESS" && filter === "PENDING"
    ? attempt.reviewStatus === "PENDING"
    : attempt.status !== "IN_PROGRESS" && (attempt.reviewStatus === "REVISION_REQUESTED" || attempt.reviewStatus === "REJECTED"));
}

function audioTimestampSeconds(value: string) {
  const match = value.trim().match(/^(\d{1,3}):(\d{2})$/);
  if (match) return Number(match[1]) * 60 + Number(match[2]);
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function SubmissionAudio({ url, timestamps = [] }: { url: string; timestamps?: string[] }) {
  const [source, setSource] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    let active = true;
    let resolved = "";
    setSource("");
    void apiMediaUrl(url).then((value) => {
      resolved = value;
      if (active) setSource(value);
      else revokeMediaUrl(value);
    }).catch(() => undefined);
    return () => {
      active = false;
      if (resolved) revokeMediaUrl(resolved);
    };
  }, [url]);
  return source ? <div><audio ref={audioRef} controls preload="metadata" src={source} className="mt-2 h-9 w-full">Trình duyệt không hỗ trợ audio.</audio>{timestamps.length ? <div className="mt-2 flex flex-wrap gap-1.5"><span className="self-center text-[10px] font-bold text-on-surface-variant">Timestamp:</span>{timestamps.map((timestamp) => <button key={timestamp} type="button" onClick={() => { if (audioRef.current) audioRef.current.currentTime = audioTimestampSeconds(timestamp); }} className="rounded-full border border-primary/25 bg-primary-container/15 px-2 py-1 text-[10px] font-extrabold text-primary hover:bg-primary-container/30">{timestamp}</button>)}</div> : null}</div> : <p className="mt-2 text-xs text-on-surface-variant">Đang tải audio…</p>;
}

function taskKey(label: string) {
  const normalized = label.toLocaleLowerCase("vi");
  if (normalized.includes("dịch")) return "translation";
  if (normalized.includes("từ vựng")) return "vocabulary";
  if (normalized.includes("không cần từ") || normalized.includes("đọc hiểu")) return "reread";
  return null;
}

function checklistFor(activity: ClassActivityProgress) {
  const resolved = new Map<string, ActivityChecklistItem>();
  (activity.checklistItems ?? []).forEach((item) => {
    const key = taskKey(item.label);
    if (key && !resolved.has(key)) resolved.set(key, item);
  });
  return resolved;
}

function TaskState({ activity, attempt, task }: {
  activity: ClassActivityProgress;
  attempt?: ActivityAttempt;
  task: typeof STANDARD_TASKS[number];
}) {
  const item = checklistFor(activity).get(task.key);
  const complete = item
    ? attempt?.checklistResults?.some((result) => result.checklistItemId === item.id && result.completed)
    : false;
  const unlocked = isExerciseComplete(attempt);

  if (!unlocked) {
    return <span className="inline-flex text-on-surface-variant/65" role="img" aria-label="Đã khóa" title="Học viên cần hoàn thành đề hoặc gửi minh chứng trước"><LockKey size={16} /></span>;
  }
  if (complete) {
    return <span className="inline-flex text-emerald-700" role="img" aria-label="Đã tích" title="Đã hoàn thành"><CheckSquare size={18} weight="fill" /></span>;
  }
  return <span className="inline-flex text-on-surface-variant" role="img" aria-label="Chưa tích" title="Chưa hoàn thành"><Square size={18} /></span>;
}

function StudentMetric({ activity, studentId, row }: {
  activity: ClassActivityProgress;
  studentId: string;
  row: ReportRow;
}) {
  const attempt = latestAttempt(activity, studentId);
  if (row.key === "result") {
    if (!isExerciseComplete(attempt)) return <span className="text-on-surface-variant">Chưa hoàn thành</span>;
    const score = attempt?.score == null ? "Chưa chấm" : attempt.maxScore ? `${attempt.score}/${attempt.maxScore}` : String(attempt.score);
    return <span className="inline-flex rounded-full bg-primary-container/25 px-2.5 py-1 font-extrabold text-primary">{score}</span>;
  }
  if (row.key === "errors") {
    return <span className={attempt?.errorAnalysis ? "font-semibold text-on-surface" : "text-on-surface-variant"}>{attempt?.errorAnalysis || "Chưa có phân tích"}</span>;
  }
  const task = STANDARD_TASKS.find((item) => item.key === row.key);
  if (task) return <TaskState activity={activity} attempt={attempt} task={task} />;
  if (row.key === "duration") {
    return <span className="inline-flex items-center gap-1 font-bold tabular-nums"><Clock size={14} className="text-on-surface-variant" />{formatDuration(attempt?.durationSeconds ?? null)}</span>;
  }
  if (attempt?.comprehensionPercent == null) return <span className="text-on-surface-variant">—</span>;
  return <div className="mx-auto w-24"><strong className="text-xs tabular-nums">{attempt.comprehensionPercent}%</strong><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-container-high"><div className="h-full rounded-full bg-primary" style={{ width: `${attempt.comprehensionPercent}%` }} /></div></div>;
}

function TestAttemptMatrix({
  assignments,
  rows,
  onReminder,
  onViewAttempt,
}: {
  assignments: TestMatrixAssignment[];
  rows: Array<{ student: StudentSummary; cells: TestMatrixCell[] }>;
  onReminder: (assignment: TestMatrixAssignment, studentIds: string[]) => void;
  onViewAttempt: (student: StudentSummary, attempt: TestAttemptSummary) => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-primary/20 bg-primary-container/10" aria-label="Ma trận học viên và bài tập">
      <div className="border-b border-primary/15 px-4 py-3"><strong className="text-sm">Ma trận học viên × bài tập</strong><p className="mt-0.5 text-xs text-on-surface-variant">Mỗi ô lấy attempt mới nhất của học viên trong session đang chọn.</p></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-xs">
        <thead className="bg-surface/60 text-[11px] font-extrabold text-on-surface-variant">
          <tr>
            <th className="px-4 py-2.5">Học viên</th>
            {assignments.map((assignment, index) => <th key={assignment.id} className="min-w-44 px-4 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <span>{assignment.title}</span>
                <button type="button" onClick={() => onReminder(assignment, rows.filter((row) => ["NOT_STARTED", "IN_PROGRESS"].includes(row.cells[index]?.status || "")).map((row) => row.student.id))} className="shrink-0 text-[10px] font-extrabold text-primary hover:underline">Nhắc</button>
              </div>
              <span className="mt-0.5 block text-[10px] font-normal text-on-surface-variant">{assignment.versionLabel}</span>
            </th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-primary/10">
          {rows.map((row) => <tr key={row.student.id} className="hover:bg-surface/55">
            <td className="px-4 py-3"><strong className="block">{row.student.fullName}</strong><span className="text-[11px] text-on-surface-variant">{row.student.studentCode}</span></td>
            {row.cells.map((cell, index) => <td key={assignments[index].id} className="px-4 py-3">
              {cell.attempt ? <button type="button" onClick={() => onViewAttempt(row.student, cell.attempt!)} className={`block w-full rounded-lg border px-2 py-2 text-left ${cell.status === "LOW_SCORE" ? "border-rose-200 bg-rose-50 text-rose-800" : cell.status === "IN_PROGRESS" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
                <strong className="block text-[11px]">{cell.status === "IN_PROGRESS" ? "Đang làm" : cell.status === "LOW_SCORE" ? "Điểm thấp" : "Đã nộp"}</strong>
                <span className="mt-1 block text-[10px]">Attempt {cell.attempt.attemptNo} · {cell.attempt.score == null ? "Chưa chấm" : `${cell.attempt.score}/${cell.attempt.maxScore}`}</span>
              </button> : <span className="block rounded-lg border border-dashed border-outline-variant/50 px-2 py-2 text-[11px] font-bold text-on-surface-variant">Chưa làm</span>}
            </td>)}
          </tr>)}
          {!rows.length ? <tr><td colSpan={assignments.length + 1} className="px-4 py-5 text-center text-xs text-on-surface-variant">Không có học viên phù hợp bộ lọc.</td></tr> : null}
        </tbody>
        </table>
      </div>
    </section>
  );
}

export default function CourseProgress({ courseId, skillPair, roster, initialSessions, onSelectStudent }: CourseProgressProps) {
  const skillTabs = skillPair === "LISTENING_READING"
    ? ([{ id: "LISTENING", label: "Listening", icon: Ear }, { id: "READING", label: "Reading", icon: BookOpen }] as const)
    : ([{ id: "SPEAKING", label: "Speaking", icon: Microphone }, { id: "WRITING", label: "Writing", icon: Pencil }] as const);
  const [searchParams] = useSearchParams();
  const requestedSkill = searchParams.get("skill")?.toUpperCase() as SkillType | null;
  const requestedSessionId = searchParams.get("sessionId");
  const deepLinkActivityId = searchParams.get("activityId");
  const deepLinkStudentId = searchParams.get("studentId");
  const [selectedSkill, setSelectedSkill] = useState<SkillType>(() =>
    requestedSkill && skillTabs.some(tab => tab.id === requestedSkill) ? requestedSkill : skillTabs[0].id);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [progress, setProgress] = useState<ClassActivityProgress[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [studentQuery, setStudentQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reviewTarget, setReviewTarget] = useState<{ activity: ClassActivityProgress; studentId: string; studentName: string } | null>(null);
  const [reviewSubmission, setReviewSubmission] = useState<AssignmentSubmission | null>(null);
  const [reviewStatus, setReviewStatus] = useState("VERIFIED");
  const [reviewScore, setReviewScore] = useState("");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [extensionDueAt, setExtensionDueAt] = useState("");
  const [extensionReason, setExtensionReason] = useState("");
  const [reflectionDueAt, setReflectionDueAt] = useState("");
  const [rubric, setRubric] = useState<RubricDraft[]>([]);
  const [annotations, setAnnotations] = useState<InlineAnnotation[]>([]);
  const [annotationDraft, setAnnotationDraft] = useState<InlineAnnotation | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("ALL");
  const [newLatePolicy, setNewLatePolicy] = useState("MARK_LATE");
  const [newLateGraceMinutes, setNewLateGraceMinutes] = useState("0");
  const reviewTextRef = useRef<HTMLDivElement>(null);
  const deepLinkHandled = useRef(false);
  const [reminderTarget, setReminderTarget] = useState<ClassActivityProgress | null>(null);
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderFilter, setReminderFilter] = useState<ReminderFilter>("NOT_STARTED");
  const [reminderRecipients, setReminderRecipients] = useState<string[]>([]);
  const [reminderSaving, setReminderSaving] = useState(false);
  const [contactLogs, setContactLogs] = useState<AssignmentContactLog[]>([]);
  const [studentExtensionTarget, setStudentExtensionTarget] = useState<{ activity: ClassActivityProgress; studentId: string; studentName: string } | null>(null);
  const [studentExtensionDraft, setStudentExtensionDraft] = useState({ extensionDueAt: "", reason: "" });
  const [studentExtensionLoading, setStudentExtensionLoading] = useState(false);
  const [studentExtensionSaving, setStudentExtensionSaving] = useState(false);
  const [settingsTarget, setSettingsTarget] = useState<ClassActivityProgress | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<AssignmentSettingsDraft | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [testAttempts, setTestAttempts] = useState<TestAttemptSummary[]>([]);
  const [testInsights, setTestInsights] = useState<TestAttemptInsights | null>(null);
  const [testAttemptFilter, setTestAttemptFilter] = useState<TestAttemptFilter>("ALL");
  const [testReminderTarget, setTestReminderTarget] = useState<{ assignmentId: string; title: string; studentIds: string[] } | null>(null);
  const [testReminderMessage, setTestReminderMessage] = useState("");
  const [testReminderSaving, setTestReminderSaving] = useState(false);
  const [testViewerStudent, setTestViewerStudent] = useState<StudentSummary | null>(null);
  const [testViewerDetail, setTestViewerDetail] = useState<TestAttemptReview | null>(null);
  const [testViewerLoading, setTestViewerLoading] = useState(false);
  const [testViewerDetailLoading, setTestViewerDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const request = initialSessions?.length
      ? Promise.resolve(initialSessions)
      : apiFetch<ClassSession[]>(`/admin/courses/${courseId}/sessions`);
    void request.then((classSessions) => {
      if (cancelled) return;
      setSessions(classSessions);
      setSelectedSessionId((current) => current && classSessions.some(session => session.id === current)
        ? current
        : classSessions.find(session => session.id === requestedSessionId)?.id || classSessions[0]?.id || "");
    }).catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : "Không thể tải danh sách session.");
    });
    return () => { cancelled = true; };
  }, [courseId, initialSessions]);

  useEffect(() => {
    if (!selectedSessionId) {
      setProgress([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    const query = new URLSearchParams({ sessionId: selectedSessionId, skill: selectedSkill });
    void apiFetch<ClassActivityProgress[]>(`/admin/courses/${courseId}/progress?${query}`)
      .then(value => { if (!cancelled) setProgress(value); })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Không thể tải báo cáo tiến độ.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [courseId, selectedSessionId, selectedSkill]);

  useEffect(() => {
    if (!selectedSessionId) {
      setTestAttempts([]);
      setTestInsights(null);
      return;
    }
    let cancelled = false;
    setTestViewerLoading(true);
    const query = new URLSearchParams({ sessionId: selectedSessionId, skill: selectedSkill });
    void Promise.all([
      apiFetch<TestAttemptSummary[]>(`/admin/courses/${courseId}/test-attempts?${query}`),
      apiFetch<TestAttemptInsights>(`/admin/courses/${courseId}/test-attempts/insights?${query}`),
    ])
      .then(([attempts, insights]) => {
        if (cancelled) return;
        setTestAttempts(attempts);
        setTestInsights(insights);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Không thể tải lịch sử làm đề.");
      })
      .finally(() => { if (!cancelled) setTestViewerLoading(false); });
    return () => { cancelled = true; };
  }, [courseId, selectedSessionId, selectedSkill]);

  useEffect(() => setSelectedSkill(current => skillTabs.some(tab => tab.id === current) ? current : skillTabs[0].id), [skillPair]);

  async function loadTestAttemptDetail(summary: TestAttemptSummary) {
    setTestViewerDetailLoading(true);
    try {
      setTestViewerDetail(await apiFetch<TestAttemptReview>(`/admin/courses/${courseId}/test-attempts/${summary.attemptId}`));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tải chi tiết bài làm.");
    } finally {
      setTestViewerDetailLoading(false);
    }
  }

  function openTestViewer(student: StudentSummary) {
    const attempts = testAttempts.filter((item) => item.studentId === student.id);
    setTestViewerStudent(student);
    setTestViewerDetail(null);
    if (attempts[0]) void loadTestAttemptDetail(attempts[0]);
  }

  function openTestViewerAttempt(student: StudentSummary, attempt: TestAttemptSummary) {
    setTestViewerStudent(student);
    setTestViewerDetail(null);
    void loadTestAttemptDetail(attempt);
  }

  function openTestReminder(assignment: TestMatrixAssignment, studentIds: string[]) {
    if (!studentIds.length) return;
    setTestReminderTarget({ assignmentId: assignment.id, title: assignment.title, studentIds });
    setTestReminderMessage(`Nhắc bạn hoàn thành bài “${assignment.title}” và nộp bài trên hệ thống.`);
  }

  async function sendTestReminder() {
    if (!testReminderTarget) return;
    setTestReminderSaving(true);
    setError("");
    try {
      const result = await apiFetch<{ recipients: number; notificationsCreated: number }>(
        `/admin/courses/${courseId}/test-attempts/reminders`,
        {
          method: "POST",
          body: JSON.stringify({
            testAssignmentId: testReminderTarget.assignmentId,
            studentIds: testReminderTarget.studentIds,
            message: testReminderMessage.trim() || null,
          }),
        },
      );
      setNotice(`Đã gửi nhắc ${result.recipients} học viên (${result.notificationsCreated} thông báo trong app).`);
      setTestReminderTarget(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể gửi reminder cho test assignment.");
    } finally {
      setTestReminderSaving(false);
    }
  }

  function answerLabel(answer: Record<string, unknown>) {
    const values = Object.values(answer).filter((value) => value != null && value !== "");
    return values.length ? values.map((value) => typeof value === "string" ? value : JSON.stringify(value)).join(", ") : "Bỏ trống";
  }

  async function createAssignment(activity: ClassActivityProgress) {
    try {
      const created = await apiFetch<{ id: string }>(`/admin/courses/${courseId}/activities/${activity.classActivityId}/assignment`, {
        method: "POST",
        body: JSON.stringify({
          title: activity.title,
          description: `Hoàn thành hoạt động ${activity.title} và nộp bài trên hệ thống.`,
          assignmentType: activity.skill.toLowerCase(),
          opensAt: activity.opensAt,
          dueAt: activity.dueAt,
          maxScore: ["WRITING", "SPEAKING"].includes(activity.skill) ? 9 : 100,
          allowResubmission: true,
          latePolicy: newLatePolicy,
          lateGraceMinutes: Number(newLateGraceMinutes) || 0,
        }),
      });
      setProgress(current => current.map(item => item.classActivityId === activity.classActivityId ? { ...item, assignmentId: created.id } : item));
      setNotice(`Đã tạo assignment cho “${activity.title}”.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tạo assignment.");
    }
  }

  async function openAssignmentSettings(activity: ClassActivityProgress) {
    if (!activity.assignmentId) return;
    setSettingsTarget(activity);
    setSettingsDraft(null);
    setSettingsLoading(true);
    try {
      const assignment = await apiFetch<{
        opensAt: string | null;
        dueAt: string | null;
        allowResubmission: boolean;
        latePolicy: string;
        lateGraceMinutes: number;
        reflectionDueAt: string | null;
      }>(`/admin/courses/${courseId}/activities/${activity.classActivityId}/assignment`);
      setSettingsDraft({
        opensAt: dateTimeLocal(assignment.opensAt),
        dueAt: dateTimeLocal(assignment.dueAt),
        allowResubmission: assignment.allowResubmission,
        latePolicy: assignment.latePolicy,
        lateGraceMinutes: String(assignment.lateGraceMinutes),
        reflectionDueAt: dateTimeLocal(assignment.reflectionDueAt),
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tải cấu hình assignment.");
      setSettingsTarget(null);
    } finally {
      setSettingsLoading(false);
    }
  }

  async function saveAssignmentSettings() {
    if (!settingsTarget || !settingsDraft) return;
    setSettingsSaving(true);
    setError("");
    try {
      await apiFetch(`/admin/courses/${courseId}/activities/${settingsTarget.classActivityId}/assignment`, {
        method: "PATCH",
        body: JSON.stringify({
          opensAt: isoDateTime(settingsDraft.opensAt),
          dueAt: isoDateTime(settingsDraft.dueAt),
          allowResubmission: settingsDraft.allowResubmission,
          latePolicy: settingsDraft.latePolicy,
          lateGraceMinutes: Number(settingsDraft.lateGraceMinutes) || 0,
          reflectionDueAt: isoDateTime(settingsDraft.reflectionDueAt),
        }),
      });
      setSettingsTarget(null);
      setNotice("Đã cập nhật cấu hình assignment.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể cập nhật assignment.");
    } finally {
      setSettingsSaving(false);
    }
  }

  async function openReminder(activity: ClassActivityProgress) {
    setReminderTarget(activity);
    setReminderFilter("NOT_STARTED");
    setReminderRecipients(roster.filter(({ student }) => matchesReminderFilter(activity, student.id, "NOT_STARTED")).map(({ student }) => student.id));
    setReminderMessage(`Nhắc bạn hoàn thành bài “${activity.title}” và nộp bài trên hệ thống.`);
    try {
      setContactLogs(await apiFetch<AssignmentContactLog[]>(`/admin/courses/${courseId}/activities/${activity.classActivityId}/contact-logs`));
    } catch {
      setContactLogs([]);
    }
  }

  function changeReminderFilter(filter: ReminderFilter) {
    setReminderFilter(filter);
    if (!reminderTarget) return;
    setReminderRecipients(roster.filter(({ student }) => matchesReminderFilter(reminderTarget, student.id, filter)).map(({ student }) => student.id));
  }

  function toggleReminderRecipient(studentId: string) {
    setReminderRecipients((current) => current.includes(studentId)
      ? current.filter((id) => id !== studentId)
      : [...current, studentId]);
  }

  async function sendReminder() {
    if (!reminderTarget) return;
    setReminderSaving(true);
    setError("");
    try {
      const result = await apiFetch<{ recipients: number; notificationsCreated: number; contactLogsCreated: number }>(
        `/admin/courses/${courseId}/activities/${reminderTarget.classActivityId}/reminders`,
        {
          method: "POST",
          body: JSON.stringify({
            studentIds: reminderRecipients,
            message: reminderMessage.trim() || null,
            channel: "IN_APP",
            sendNotification: true,
          }),
        },
      );
      setNotice(`Đã gửi nhắc ${result.recipients} học viên và ghi ${result.contactLogsCreated} liên lạc.`);
      setContactLogs(await apiFetch<AssignmentContactLog[]>(`/admin/courses/${courseId}/activities/${reminderTarget.classActivityId}/contact-logs`));
      setReminderTarget(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể gửi reminder.");
    } finally {
      setReminderSaving(false);
    }
  }

  async function openStudentExtension(activity: ClassActivityProgress, studentId: string, studentName: string) {
    if (!activity.assignmentId) return;
    setStudentExtensionTarget({ activity, studentId, studentName });
    setStudentExtensionDraft({ extensionDueAt: "", reason: "" });
    setStudentExtensionLoading(true);
    try {
      const extension = await apiFetch<{ extensionDueAt: string | null; reason: string | null }>(
        `/admin/courses/${courseId}/activities/${activity.classActivityId}/assignment/students/${studentId}/extension`,
      );
      setStudentExtensionDraft({ extensionDueAt: dateTimeLocal(extension.extensionDueAt), reason: extension.reason ?? "" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tải extension của học viên.");
      setStudentExtensionTarget(null);
    } finally {
      setStudentExtensionLoading(false);
    }
  }

  async function saveStudentExtension() {
    if (!studentExtensionTarget || !studentExtensionDraft.extensionDueAt) return;
    setStudentExtensionSaving(true);
    try {
      await apiFetch(
        `/admin/courses/${courseId}/activities/${studentExtensionTarget.activity.classActivityId}/assignment/students/${studentExtensionTarget.studentId}/extension`,
        {
          method: "PATCH",
          body: JSON.stringify({
            extensionDueAt: isoDateTime(studentExtensionDraft.extensionDueAt),
            reason: studentExtensionDraft.reason.trim() || null,
          }),
        },
      );
      setStudentExtensionTarget(null);
      setNotice(`Đã cấp extension cho ${studentExtensionTarget.studentName}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể cấp extension cho học viên.");
    } finally {
      setStudentExtensionSaving(false);
    }
  }

  async function openReview(activity: ClassActivityProgress, studentId: string, studentName: string) {
    setReviewTarget({ activity, studentId, studentName });
    setReviewSubmission(null);
    setReviewLoading(true);
    try {
      const submissions = await apiFetch<AssignmentSubmission[]>(`/admin/courses/${courseId}/activities/${activity.classActivityId}/submissions`);
      const latest = submissions.find(item => item.studentId === studentId) ?? null;
      setReviewSubmission(latest);
      setReviewStatus(latest?.reviewStatus === "REVISION_REQUESTED" ? "REVISION_REQUESTED" : "VERIFIED");
      setReviewScore(latest?.score == null ? "" : String(latest.score));
      setReviewFeedback(latest?.feedback ?? "");
      setExtensionDueAt(dateTimeLocal(latest?.extensionDueAt));
      setExtensionReason(latest?.extensionReason ?? "");
      setReflectionDueAt(dateTimeLocal(latest?.reflectionDueAt));
      const rubricDefinition = activity.skill === "SPEAKING"
        ? SPEAKING_RUBRIC
        : activity.skill === "WRITING" ? WRITING_RUBRIC : [];
      setRubric(rubricDefinition.map(([criterion, label]) => {
        const stored = latest?.criteria?.find((item) => item.criterion === criterion);
        return { criterion, label, score: stored?.score == null ? "" : String(stored.score), feedback: stored?.feedback ?? "" };
      }));
      setAnnotations(latest?.annotations ?? []);
      setAnnotationDraft(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tải bài nộp.");
    } finally {
      setReviewLoading(false);
    }
  }

  useEffect(() => {
    if (deepLinkHandled.current || !deepLinkActivityId || !deepLinkStudentId || loading) return;
    const activity = progress.find(item => item.classActivityId === deepLinkActivityId);
    const student = roster.find(item => item.student.id === deepLinkStudentId)?.student;
    if (!activity || !student) return;
    deepLinkHandled.current = true;
    void openReview(activity, student.id, student.fullName);
  }, [deepLinkActivityId, deepLinkStudentId, loading, progress, roster]);

  useEffect(() => {
    if (!settingsTarget) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettingsTarget(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [settingsTarget]);

  async function saveReview() {
    if (!reviewTarget || !reviewSubmission) return;
    setReviewSaving(true);
    try {
      await apiFetch(`/admin/courses/${courseId}/activities/${reviewTarget.activity.classActivityId}/submissions/${reviewSubmission.id}/feedback`, {
        method: "PATCH",
        body: JSON.stringify({
          status: reviewStatus,
          score: reviewScore === "" ? null : Number(reviewScore),
          feedback: reviewFeedback.trim() || null,
          privateNote: null,
          adjustmentReason: null,
          reflectionDueAt: isoDateTime(reflectionDueAt),
          criteria: rubric.map((item, index) => ({
            criterion: item.criterion,
            score: item.score === "" ? null : Number(item.score),
            feedback: item.feedback.trim() || null,
            sortOrder: index,
          })),
          annotations: annotations.map((item, index) => ({
            startOffset: item.startOffset,
            endOffset: item.endOffset,
            quotedText: item.quotedText,
            comment: item.comment,
            suggestion: item.suggestion?.trim() || null,
            sortOrder: index,
          })),
        }),
      });
      setReviewTarget(null);
      setNotice("Đã lưu feedback cho học viên.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu feedback.");
    } finally {
      setReviewSaving(false);
    }
  }

  async function saveExtension() {
    if (!reviewTarget || !reviewSubmission || !extensionDueAt) return;
    setReviewSaving(true);
    try {
      const updated = await apiFetch<AssignmentSubmission>(
        `/admin/courses/${courseId}/activities/${reviewTarget.activity.classActivityId}/submissions/${reviewSubmission.id}/extension`,
        {
          method: "PATCH",
          body: JSON.stringify({ extensionDueAt: isoDateTime(extensionDueAt), reason: extensionReason.trim() || null }),
        },
      );
      setReviewSubmission(updated);
      setNotice("Đã cấp extension cho submission.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể cấp extension.");
    } finally {
      setReviewSaving(false);
    }
  }

  function captureWritingSelection() {
    const container = reviewTextRef.current;
    const selection = window.getSelection();
    if (!container || !selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    if (!container.contains(range.commonAncestorContainer)) return;
    const before = range.cloneRange();
    before.selectNodeContents(container);
    before.setEnd(range.startContainer, range.startOffset);
    const startOffset = before.toString().length;
    const quotedText = range.toString();
    const endOffset = startOffset + quotedText.length;
    if (!quotedText.trim() || annotations.some((item) => startOffset < item.endOffset && endOffset > item.startOffset)) return;
    setAnnotationDraft({ startOffset, endOffset, quotedText, comment: "", suggestion: null, sortOrder: annotations.length });
  }

  function addAnnotation() {
    if (!annotationDraft?.comment.trim()) return;
    setAnnotations((current) => [...current, { ...annotationDraft, comment: annotationDraft.comment.trim() }]
      .sort((left, right) => left.startOffset - right.startOffset));
    setAnnotationDraft(null);
    window.getSelection()?.removeAllRanges();
  }

  function annotatedText(text: string) {
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    annotations.forEach((annotation, index) => {
      if (annotation.startOffset > cursor) parts.push(text.slice(cursor, annotation.startOffset));
      parts.push(<mark key={`${annotation.startOffset}-${index}`} className="rounded bg-amber-200/80 px-0.5 text-on-surface" title={annotation.comment}>{text.slice(annotation.startOffset, annotation.endOffset)}</mark>);
      cursor = annotation.endOffset;
    });
    if (cursor < text.length) parts.push(text.slice(cursor));
    return parts;
  }

  const selectedSession = sessions.find((session) => session.id === selectedSessionId);
  const activities = useMemo(() => progress.filter((activity) => (
    activity.skill === selectedSkill && activity.sessionId === selectedSessionId
  )), [progress, selectedSessionId, selectedSkill]);
  const visibleActivities = useMemo(() => queueFilter === "ALL"
    ? activities
    : activities.filter((activity) => hasQueueStatus(activity, queueFilter)), [activities, queueFilter]);
  const pendingQueueCount = activities.filter((activity) => hasQueueStatus(activity, "PENDING")).length;
  const revisionQueueCount = activities.filter((activity) => hasQueueStatus(activity, "REVISION")).length;
  const filteredRoster = useMemo(() => {
    const query = studentQuery.trim().toLocaleLowerCase("vi");
    return query ? roster.filter(({ student }) => `${student.fullName} ${student.studentCode}`.toLocaleLowerCase("vi").includes(query)) : roster;
  }, [roster, studentQuery]);
  const completedCells = activities.reduce((sum, activity) => sum + activity.attempts.filter(isExerciseComplete).length, 0);
  const totalCells = Math.max(1, activities.length * roster.length);
  const testMatrixAssignments = useMemo<TestMatrixAssignment[]>(() => {
    const resolved = new Map<string, TestMatrixAssignment>();
    activities.forEach((activity) => {
      if (activity.testAssignmentId) {
        resolved.set(activity.testAssignmentId, {
          id: activity.testAssignmentId,
          title: activity.title,
          versionLabel: "",
          activity,
        });
      }
    });
    testAttempts.forEach((attempt) => {
      const current = resolved.get(attempt.assignmentId);
      resolved.set(attempt.assignmentId, {
        id: attempt.assignmentId,
        title: current?.title || attempt.testTitle,
        versionLabel: attempt.versionLabel,
        activity: current?.activity || null,
      });
    });
    return Array.from(resolved.values()).sort((left, right) => left.title.localeCompare(right.title, "vi"));
  }, [activities, testAttempts]);
  const testMatrixRows = useMemo(() => {
    const latest = new Map<string, TestAttemptSummary>();
    testAttempts.forEach((attempt) => {
      const key = `${attempt.studentId}:${attempt.assignmentId}`;
      const current = latest.get(key);
      if (!current || attempt.attemptNo > current.attemptNo) latest.set(key, attempt);
    });
    return filteredRoster.map(({ student }) => ({
      student,
      cells: testMatrixAssignments.map((assignment) => {
        const attempt = latest.get(`${student.id}:${assignment.id}`) || null;
        return { status: testMatrixStatus(attempt), attempt };
      }),
    }));
  }, [filteredRoster, testAttempts, testMatrixAssignments]);
  const filteredTestMatrixRows = useMemo(() => testAttemptFilter === "ALL"
    ? testMatrixRows
    : testMatrixRows.filter((row) => row.cells.some((cell) => cell.status === testAttemptFilter)),
  [testAttemptFilter, testMatrixRows]);
  const attemptComparisons = useMemo(() => {
    const grouped = new Map<string, { studentName: string; studentCode: string; testTitle: string; first: TestAttemptSummary | null; second: TestAttemptSummary | null }>();
    testInsights?.trends.forEach((trend) => {
      const key = `${trend.studentId}:${trend.testTitle}`;
      const current = grouped.get(key) || { studentName: trend.studentName, studentCode: trend.studentCode, testTitle: trend.testTitle, first: null, second: null };
      const attempt = testAttempts.find((item) => item.studentId === trend.studentId && item.testTitle === trend.testTitle && item.attemptNo === trend.attemptNo) || {
        attemptId: `${trend.studentId}-${trend.testTitle}-${trend.attemptNo}`,
        assignmentId: "",
        testVersionId: "",
        courseId,
        sessionId: selectedSessionId,
        sessionNo: null,
        sessionTitle: null,
        studentId: trend.studentId,
        studentCode: trend.studentCode,
        studentName: trend.studentName,
        testTitle: trend.testTitle,
        versionLabel: "",
        skill: selectedSkill,
        attemptNo: trend.attemptNo,
        status: "SUBMITTED",
        startedAt: trend.submittedAt || "",
        submittedAt: trend.submittedAt,
        durationSeconds: 0,
        score: trend.score,
        maxScore: trend.maxScore,
        correctCount: 0,
        incorrectCount: 0,
        unansweredCount: 0,
      } satisfies TestAttemptSummary;
      if (trend.attemptNo === 1) current.first = attempt;
      if (trend.attemptNo === 2) current.second = attempt;
      grouped.set(key, current);
    });
    return Array.from(grouped.values()).filter((row) => row.first || row.second);
  }, [courseId, selectedSessionId, selectedSkill, testAttempts, testInsights]);

  function exportTestProgress() {
    const rows: unknown[][] = [["Mã học viên", "Học viên", ...testMatrixAssignments.map((assignment) => assignment.title)]];
    filteredTestMatrixRows.forEach((row) => rows.push([
      row.student.studentCode,
      row.student.fullName,
      ...row.cells.map((cell) => cell.attempt
        ? `${cell.status}; Attempt ${cell.attempt.attemptNo}; ${cell.attempt.score ?? "—"}/${cell.attempt.maxScore}`
        : "Chưa làm"),
    ]));
    rows.push([]);
    rows.push(["Chi tiết attempt", "Mã học viên", "Học viên", "Đề", "Attempt", "Trạng thái", "Điểm", "Điểm tối đa", "Nộp lúc"]);
    testAttempts.forEach((attempt) => rows.push([
      "Attempt", attempt.studentCode, attempt.studentName, attempt.testTitle, attempt.attemptNo,
      attempt.status, attempt.score ?? "", attempt.maxScore, attempt.submittedAt || "",
    ]));
    downloadCsv(`course-progress-${selectedSkill.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  return (
    <div className="space-y-3">
      <section className="flex flex-wrap items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface px-3 py-2.5 shadow-xs" aria-label="Bộ lọc báo cáo tiến độ">
        <div className="flex rounded-lg bg-surface-container-low p-1">
          {skillTabs.map((tab) => {
            const Icon = tab.icon;
            return <button key={tab.id} type="button" onClick={() => setSelectedSkill(tab.id)} aria-pressed={selectedSkill === tab.id} className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-bold transition-colors ${selectedSkill === tab.id ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:bg-surface"}`}><Icon size={16} />{tab.label}</button>;
          })}
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <label className="relative block">
            <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input type="search" value={studentQuery} onChange={(event) => setStudentQuery(event.target.value)} placeholder="Tìm học viên" aria-label="Tìm học viên theo tên hoặc mã" className="h-9 w-52 rounded-lg border border-outline-variant/50 bg-surface pl-9 pr-3 text-xs font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/70 focus:border-primary focus:ring-1 focus:ring-primary" />
          </label>
          <div className="flex items-center gap-2 rounded-lg bg-primary-container/15 px-3 py-2 text-xs font-bold text-primary" title="Số bài học viên đã hoàn thành hoặc đã nộp minh chứng">
            <Check size={15} weight="bold" /> {Math.round((completedCells / totalCells) * 100)}% hoàn thành
          </div>
        </div>
      </section>

      {error ? <div role="alert" className="flex items-center gap-2 rounded-xl border border-error/25 bg-error-container/30 px-4 py-3 text-sm font-semibold text-error"><WarningCircle size={18} />{error}</div> : null}
      {notice ? <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</div> : null}

      <section className="flex flex-wrap items-center gap-2 rounded-xl border border-outline-variant/35 bg-surface px-3 py-2 shadow-xs" aria-label="Công cụ xử lý session">
        <strong className="mr-1 text-xs">Hiển thị trên bảng</strong>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lọc hoạt động cần xử lý">
          {([["ALL", "Tất cả", activities.length], ["PENDING", "Chờ chấm", pendingQueueCount], ["REVISION", "Cần sửa", revisionQueueCount]] as const).map(([value, label, count]) => <button key={value} type="button" aria-pressed={queueFilter === value} onClick={() => setQueueFilter(value)} className={"inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold transition " + (queueFilter === value ? "border-primary bg-primary text-on-primary" : "border-outline-variant/50 text-on-surface-variant hover:border-primary/40 hover:text-primary")}>{label}<span className={queueFilter === value ? "rounded-md bg-white/20 px-1.5" : "rounded-md bg-surface-container-low px-1.5"}>{count}</span></button>)}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2"><label className="text-[11px] font-bold text-on-surface-variant">Nộp muộn<select value={newLatePolicy} onChange={(event) => setNewLatePolicy(event.target.value)} className="ml-1.5 h-8 rounded-lg border border-outline-variant/50 bg-surface px-2 text-[11px] font-bold text-on-surface"><option value="MARK_LATE">Cho nộp, đánh dấu muộn</option><option value="ALLOW">Cho nộp không phạt</option><option value="BLOCK">Chặn sau deadline</option></select></label><label className="text-[11px] font-bold text-on-surface-variant">Gia hạn<input type="number" min="0" max="10080" value={newLateGraceMinutes} onChange={(event) => setNewLateGraceMinutes(event.target.value)} className="ml-1.5 h-8 w-16 rounded-lg border border-outline-variant/50 bg-surface px-2 text-[11px] font-bold text-on-surface" /><span className="ml-1">phút</span></label></div>
      </section>

      <section className="overflow-hidden rounded-xl border border-outline-variant/40 bg-surface shadow-xs" aria-label="Bảng tiến độ học viên theo session">
        <div className="overflow-x-auto">
          <table className="w-max min-w-full table-fixed border-collapse text-left text-xs">
            <colgroup>
              <col className="w-24" />
              <col className="w-44" />
              <col className="w-36" />
              {filteredRoster.map(({ student }) => <col key={student.id} className="w-48" />)}
            </colgroup>
            <thead className="bg-surface-container-low text-[11px] font-extrabold text-on-surface-variant">
              <tr className="border-b border-outline-variant/40">
                <th colSpan={3} className="sticky left-0 z-30 border-r border-outline-variant/35 bg-surface-container-low p-1.5">
                  <select aria-label="Chọn session báo cáo" value={selectedSessionId} onChange={(event) => setSelectedSessionId(event.target.value)} className="h-11 w-full cursor-pointer rounded-lg border border-primary/25 bg-surface px-3 text-xs font-extrabold text-on-surface shadow-sm focus:border-primary focus:ring-primary">
                    {sessions.map((session) => <option key={session.id} value={session.id}>Session {session.sessionNo} · {session.title || "Chưa đặt tên"}</option>)}
                  </select>
                </th>
                {filteredRoster.map(({ student }) => <th key={student.id} className="border-r border-outline-variant/25 px-2 py-2 text-center">
                  <button type="button" onClick={() => onSelectStudent?.(student.id)} className="font-extrabold text-on-surface hover:text-primary hover:underline">{student.fullName}</button>
                  {testAttempts.some((attempt) => attempt.studentId === student.id) ? <button type="button" onClick={() => openTestViewer(student)} className="mt-1 block w-full text-[10px] font-extrabold text-primary hover:underline">Xem bài làm ({testAttempts.filter((attempt) => attempt.studentId === student.id).length})</button> : null}
                </th>)}
              </tr>
            </thead>
            {!loading && filteredRoster.length > 0 && visibleActivities.map((activity) => {
              const scheduleValue = activity.dueAt || selectedSession?.startsAt;
              const completed = activity.attempts.filter(isExerciseComplete).length;
              const evidence = activity.attempts.reduce((sum, attempt) => sum + (attempt.evidence?.length || 0), 0);
              return <tbody key={activity.classActivityId} className="border-b-2 border-outline-variant/45">
                {REPORT_ROWS.map((row, rowIndex) => <tr key={row.key} className="border-b border-outline-variant/20 align-middle hover:bg-surface-container-low/35">
                  {rowIndex === 0 ? <th rowSpan={REPORT_ROWS.length} scope="rowgroup" className="sticky left-0 z-20 border-r border-outline-variant/35 bg-surface px-2 py-2 align-top">
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-primary">{activity.dueAt ? "Deadline" : "Ngày học"}</span>
                    <time className="mt-1 block font-bold leading-5 text-on-surface">{formatDateTime(scheduleValue)}</time>
                  </th> : null}
                  {rowIndex === 0 ? <th rowSpan={REPORT_ROWS.length} scope="rowgroup" className="sticky left-24 z-20 border-r border-outline-variant/35 bg-surface px-2 py-2 align-top">
                    <div className="flex items-start gap-2"><BookOpen size={17} className="mt-0.5 shrink-0 text-primary" /><div><strong className="block leading-5 text-on-surface">{activity.title}</strong><span className="mt-1 block text-[10px] font-semibold text-on-surface-variant">{completed}/{roster.length} hoàn thành</span>{evidence ? <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-primary"><ImageSquare size={13} />{evidence} minh chứng</span> : null}<div className="mt-2 flex flex-wrap gap-1.5"><button type="button" onClick={() => activity.assignmentId ? void openAssignmentSettings(activity) : void createAssignment(activity)} className="inline-flex items-center gap-1 rounded-lg border border-primary/30 px-2 py-1 text-[10px] font-extrabold text-primary hover:bg-primary/10">{activity.assignmentId ? <><Gear size={12} />Cấu hình</> : "Tạo assignment"}</button>{activity.assignmentId ? <button type="button" onClick={() => void openReminder(activity)} className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-extrabold text-amber-800 hover:bg-amber-100">Nhắc cả lớp</button> : null}</div></div></div>
                  </th> : null}
                  <th scope="row" className="sticky left-[17rem] z-20 border-r border-outline-variant/35 bg-surface px-2 py-2 text-[11px] font-bold leading-4 text-on-surface">{row.label}</th>
                  {filteredRoster.map(({ student }) => { const attempt = latestAttempt(activity, student.id); return <td key={student.id} className="border-r border-outline-variant/20 px-2 py-2 text-center leading-5 text-on-surface"><StudentMetric activity={activity} studentId={student.id} row={row} />{rowIndex === 0 && activity.assignmentId ? <div className="mt-2 flex flex-wrap justify-center gap-1"><button type="button" onClick={() => void openStudentExtension(activity, student.id, student.fullName)} className="text-[10px] font-extrabold text-amber-700 hover:underline">Gia hạn</button>{attempt && attempt.status !== "IN_PROGRESS" ? <button type="button" onClick={() => void openReview(activity, student.id, student.fullName)} className="text-[10px] font-extrabold text-primary hover:underline">Feedback / sửa bài</button> : null}</div> : null}</td>; })}
                </tr>)}
              </tbody>;
            })}
            {!loading && (!visibleActivities.length || !filteredRoster.length) ? <tbody><tr><td colSpan={Math.max(3, filteredRoster.length + 3)} className="px-6 py-14 text-center text-sm text-on-surface-variant">{!activities.length ? "Session này chưa có bài được xuất bản cho kỹ năng đã chọn." : queueFilter !== "ALL" ? "Không có hoạt động phù hợp với hàng đợi đã chọn." : roster.length ? "Không tìm thấy học viên phù hợp." : "Khóa học chưa có học viên."}</td></tr></tbody> : null}
            {loading ? <tbody><tr><td colSpan={Math.max(3, filteredRoster.length + 3)} className="px-6 py-14 text-center text-sm text-on-surface-variant">Đang tải báo cáo tiến độ…</td></tr></tbody> : null}
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-primary/20 bg-primary-container/10 shadow-xs" aria-label="Lịch sử làm đề">
        <div className="flex items-center justify-between gap-3 border-b border-primary/15 px-4 py-3">
          <div><strong className="text-sm">Lịch sử làm đề trong session</strong><p className="mt-0.5 text-xs text-on-surface-variant">Đọc trực tiếp từ test_attempts · test_attempt_responses; mỗi lần làm được giữ riêng.</p></div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="text-xs font-bold text-primary">{testViewerLoading ? "Đang tải…" : `${testAttempts.length} lượt`}</span>
            <button type="button" onClick={exportTestProgress} disabled={!testMatrixAssignments.length} className="rounded-lg border border-primary/30 bg-surface px-3 py-2 text-[11px] font-extrabold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50">Xuất Excel/CSV</button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-b border-primary/15 px-4 py-2.5" role="group" aria-label="Lọc ma trận làm đề">
          {([['ALL', 'Tất cả'], ['NOT_STARTED', 'Chưa làm'], ['IN_PROGRESS', 'Đang làm'], ['SUBMITTED', 'Đã nộp'], ['LOW_SCORE', 'Điểm thấp']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={testAttemptFilter === value} onClick={() => setTestAttemptFilter(value)} className={`rounded-full border px-3 py-1.5 text-[11px] font-extrabold transition ${testAttemptFilter === value ? "border-primary bg-primary text-on-primary" : "border-primary/25 text-primary hover:bg-primary/10"}`}>{label}</button>)}
          <span className="ml-auto text-[11px] font-semibold text-on-surface-variant">{filteredTestMatrixRows.length}/{testMatrixRows.length} học viên</span>
        </div>
        {testAttempts.length ? <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-surface/60 text-[11px] font-extrabold text-on-surface-variant"><tr><th className="px-4 py-2.5">Học viên</th><th className="px-4 py-2.5">Đề / phiên bản</th><th className="px-4 py-2.5">Lần làm</th><th className="px-4 py-2.5">Kết quả</th><th className="px-4 py-2.5">Thời gian</th><th className="px-4 py-2.5 text-right">Xem bài làm</th></tr></thead><tbody className="divide-y divide-primary/10">{testAttempts.map((attempt) => <tr key={attempt.attemptId} className="hover:bg-surface/55"><td className="px-4 py-3"><strong className="block">{attempt.studentName}</strong><span className="text-[11px] text-on-surface-variant">{attempt.studentCode}</span></td><td className="px-4 py-3"><strong className="block">{attempt.testTitle}</strong><span className="text-[11px] text-primary">{attempt.versionLabel}</span></td><td className="px-4 py-3">Attempt {attempt.attemptNo}<span className="ml-1 text-on-surface-variant">· {attempt.status}</span></td><td className="px-4 py-3 font-bold">{attempt.score == null ? "Chưa chấm" : `${attempt.score}/${attempt.maxScore}`}<span className="ml-1 text-[11px] font-normal text-on-surface-variant">· {attempt.correctCount} đúng{ieltsBand(attempt) == null ? "" : ` · Band ${ieltsBand(attempt)!.toFixed(1)}`}</span></td><td className="px-4 py-3 text-on-surface-variant">{formatDuration(attempt.durationSeconds)}</td><td className="px-4 py-3 text-right"><button type="button" onClick={() => openTestViewer(roster.find(({ student }) => student.id === attempt.studentId)?.student || { id: attempt.studentId, studentCode: attempt.studentCode, fullName: attempt.studentName })} className="rounded-lg bg-primary px-3 py-2 text-[11px] font-extrabold text-on-primary hover:opacity-90">Xem bài làm</button></td></tr>)}</tbody></table></div> : <p className="px-4 py-5 text-xs text-on-surface-variant">Chưa có lượt làm đề nào trong session và kỹ năng này.</p>}
      </section>

      {testMatrixAssignments.length ? <TestAttemptMatrix assignments={testMatrixAssignments} rows={filteredTestMatrixRows} onReminder={openTestReminder} onViewAttempt={openTestViewerAttempt} /> : null}
      {testInsights ? <section className="overflow-hidden rounded-xl border border-outline-variant/40 bg-surface shadow-xs" aria-label="Tổng hợp học từ lỗi sai">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 px-4 py-3">
          <div><strong className="text-sm">Tổng hợp học từ lỗi sai</strong><p className="mt-0.5 text-xs text-on-surface-variant">Dữ liệu lấy từ review theo từng câu, không tạo bản sao điểm hay evidence.</p></div>
          <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${testInsights.pendingReviews ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800"}`}>{testInsights.pendingReviews} câu chưa review</span>
        </div>
        <div className="grid gap-4 p-4 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="overflow-hidden rounded-xl border border-outline-variant/30">
            <div className="border-b border-outline-variant/25 px-3 py-2.5"><h3 className="text-xs font-extrabold uppercase tracking-wide text-on-surface-variant">Dạng câu thường sai</h3></div>
            {testInsights.questionTypes.length ? <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-surface-container-low text-[10px] font-extrabold text-on-surface-variant"><tr><th className="px-3 py-2">Dạng câu</th><th className="px-3 py-2 text-center">Sai</th><th className="px-3 py-2 text-center">Đã trả lời</th><th className="px-3 py-2 text-center">Đã review</th></tr></thead><tbody className="divide-y divide-outline-variant/20">{testInsights.questionTypes.map((row) => <tr key={row.type}><td className="px-3 py-2.5 font-bold">{QUESTION_TYPE_LABELS[row.type] || row.type}</td><td className="px-3 py-2.5 text-center font-extrabold text-rose-700">{row.wrongCount}</td><td className="px-3 py-2.5 text-center">{row.answeredCount}</td><td className="px-3 py-2.5 text-center text-primary">{row.reviewedCount}</td></tr>)}</tbody></table></div> : <p className="px-3 py-4 text-xs text-on-surface-variant">Chưa có dữ liệu câu hỏi.</p>}
          </section>
          <section className="rounded-xl border border-outline-variant/30 p-3"><h3 className="text-xs font-extrabold uppercase tracking-wide text-on-surface-variant">Lý do sai phổ biến</h3>{testInsights.reasons.length ? <div className="mt-3 flex flex-wrap gap-2">{testInsights.reasons.map((row) => <span key={row.reasonCode} className="rounded-full border border-primary/20 bg-primary-container/15 px-3 py-1.5 text-xs font-bold text-primary">{ERROR_REASON_LABELS[row.reasonCode] || row.reasonCode} · {row.count}</span>)}</div> : <p className="mt-3 text-xs text-on-surface-variant">Chưa có review để tổng hợp lý do.</p>}</section>
        </div>
        <section className="border-t border-outline-variant/30 px-4 py-3"><h3 className="text-xs font-extrabold uppercase tracking-wide text-on-surface-variant">Điểm thay đổi qua các attempt</h3>{testInsights.trends.length ? <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="bg-surface-container-low text-[10px] font-extrabold text-on-surface-variant"><tr><th className="px-3 py-2">Học viên</th><th className="px-3 py-2">Đề</th><th className="px-3 py-2 text-center">Attempt</th><th className="px-3 py-2">Điểm</th><th className="px-3 py-2">Nộp lúc</th></tr></thead><tbody className="divide-y divide-outline-variant/20">{testInsights.trends.map((row) => <tr key={`${row.studentId}-${row.testTitle}-${row.attemptNo}`}><td className="px-3 py-2.5"><strong className="block">{row.studentName}</strong><span className="text-[10px] text-on-surface-variant">{row.studentCode}</span></td><td className="px-3 py-2.5 font-semibold">{row.testTitle}</td><td className="px-3 py-2.5 text-center font-bold">#{row.attemptNo}</td><td className="px-3 py-2.5 font-extrabold text-primary">{row.score == null ? "Chưa chấm" : `${row.score}/${row.maxScore}`}</td><td className="px-3 py-2.5 text-on-surface-variant">{formatDateTime(row.submittedAt)}</td></tr>)}</tbody></table></div> : <p className="mt-3 text-xs text-on-surface-variant">Chưa có attempt đã nộp.</p>}</section>
      </section> : null}
      {testInsights?.listeningParts.length ? <section className="rounded-xl border border-outline-variant/40 bg-surface p-4 shadow-xs" aria-label="Thống kê Listening Part"><h3 className="text-xs font-extrabold uppercase tracking-wide text-on-surface-variant">Thống kê theo Listening Part</h3><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead className="bg-surface-container-low text-[10px] font-extrabold text-on-surface-variant"><tr><th className="px-3 py-2">Part</th><th className="px-3 py-2">Sai</th><th className="px-3 py-2">Đã trả lời</th><th className="px-3 py-2">Đã review</th></tr></thead><tbody className="divide-y divide-outline-variant/20">{testInsights.listeningParts.map((part) => <tr key={part.partNo}><td className="px-3 py-2.5 font-bold">Part {part.partNo} · {part.title}</td><td className="px-3 py-2.5 font-extrabold text-rose-700">{part.wrongCount}</td><td className="px-3 py-2.5">{part.answeredCount}</td><td className="px-3 py-2.5 text-primary">{part.reviewedCount}</td></tr>)}</tbody></table></div></section> : null}
      {attemptComparisons.length ? <section className="rounded-xl border border-outline-variant/40 bg-surface p-4 shadow-xs" aria-label="So sánh Attempt 1 và Attempt 2"><h3 className="text-xs font-extrabold uppercase tracking-wide text-on-surface-variant">So sánh Attempt 1 → Attempt 2</h3><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="bg-surface-container-low text-[10px] font-extrabold text-on-surface-variant"><tr><th className="px-3 py-2">Học viên</th><th className="px-3 py-2">Đề</th><th className="px-3 py-2">Attempt 1</th><th className="px-3 py-2">Attempt 2</th><th className="px-3 py-2">Thay đổi</th></tr></thead><tbody className="divide-y divide-outline-variant/20">{attemptComparisons.map((row) => { const first = row.first?.score; const second = row.second?.score; const delta = first != null && second != null ? second - first : null; return <tr key={`${row.studentCode}-${row.testTitle}`}><td className="px-3 py-2.5"><strong className="block">{row.studentName}</strong><span className="text-[10px] text-on-surface-variant">{row.studentCode}</span></td><td className="px-3 py-2.5 font-semibold">{row.testTitle}</td><td className="px-3 py-2.5">{row.first?.score == null ? "—" : `${row.first.score}/${row.first.maxScore}`}</td><td className="px-3 py-2.5">{row.second?.score == null ? "—" : `${row.second.score}/${row.second.maxScore}`}</td><td className={`px-3 py-2.5 font-extrabold ${delta == null ? "text-on-surface-variant" : delta >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{delta == null ? "Chưa đủ 2 lần" : `${delta > 0 ? "+" : ""}${delta}`}</td></tr>; })}</tbody></table></div></section> : null}

      {reviewTarget ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-label="Feedback assignment">
        <section className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-outline-variant/40 bg-surface p-5 shadow-2xl">
          <header className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-wider text-primary">Feedback assignment</p><h2 className="mt-1 font-display text-xl font-extrabold">{reviewTarget.studentName}</h2><p className="mt-1 text-sm text-on-surface-variant">{reviewTarget.activity.title}</p></div><button type="button" onClick={() => setReviewTarget(null)} aria-label="Đóng"><X size={20} /></button></header>
          {reviewLoading ? <p className="py-10 text-center text-sm text-on-surface-variant">Đang tải bài nộp…</p> : !reviewSubmission ? <p className="py-10 text-center text-sm text-on-surface-variant">Học viên chưa có submission cho assignment này.</p> : <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,.8fr)]">
            <div className="space-y-4">
              {reviewSubmission.audioFiles?.length ? <section className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-4"><h3 className="text-sm font-extrabold">Nhóm audio Speaking · {reviewSubmission.audioFiles.length} phần</h3><div className="mt-3 grid gap-3">{reviewSubmission.audioFiles.map((audio, index) => <div key={audio.id} className="rounded-lg border border-outline-variant/35 bg-surface p-3"><div className="flex items-center justify-between gap-3"><strong className="text-xs">{audio.promptTitle || `Bài nói ${index + 1}`}</strong><span className="text-[10px] text-on-surface-variant">{audio.originalName}</span></div><SubmissionAudio url={audio.url} /></div>)}</div></section> : reviewSubmission.audioUrl ? <SubmissionAudio url={reviewSubmission.audioUrl} /> : null}
              <section>
                <div className="mb-2 flex items-center justify-between gap-3"><h3 className="text-sm font-extrabold">Bài nộp của học viên</h3>{reviewTarget.activity.skill === "WRITING" && reviewSubmission.textContent ? <span className="text-xs text-on-surface-variant">Bôi chọn một đoạn để thêm inline comment.</span> : null}</div>
                <div ref={reviewTextRef} onMouseUp={captureWritingSelection} className="max-h-[48vh] overflow-y-auto whitespace-pre-wrap rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 text-sm leading-7">{reviewSubmission.textContent ? annotatedText(reviewSubmission.textContent) : "Học viên không nộp nội dung text."}</div>
              </section>
              {annotationDraft ? <section className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4"><div><strong className="text-sm">Inline comment mới</strong><blockquote className="mt-1 border-l-2 border-amber-500 pl-3 text-xs italic text-slate-700">“{annotationDraft.quotedText}”</blockquote></div><label className="block text-xs font-bold">Nhận xét<textarea rows={2} autoFocus value={annotationDraft.comment} onChange={(event) => setAnnotationDraft({ ...annotationDraft, comment: event.target.value })} className="mt-1 w-full rounded-lg border-amber-300 bg-white" /></label><label className="block text-xs font-bold">Gợi ý sửa<textarea rows={2} value={annotationDraft.suggestion ?? ""} onChange={(event) => setAnnotationDraft({ ...annotationDraft, suggestion: event.target.value })} className="mt-1 w-full rounded-lg border-amber-300 bg-white" /></label><div className="flex justify-end gap-2"><button type="button" className="rounded-lg px-3 py-2 text-xs font-bold" onClick={() => setAnnotationDraft(null)}>Bỏ chọn</button><button type="button" disabled={!annotationDraft.comment.trim()} className="rounded-lg bg-amber-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50" onClick={addAnnotation}>Thêm nhận xét</button></div></section> : null}
              {annotations.length ? <section className="space-y-2"><h3 className="text-sm font-extrabold">Inline comments · {annotations.length}</h3>{annotations.map((annotation, index) => <div key={`${annotation.startOffset}-${index}`} className="rounded-xl border border-outline-variant/40 p-3 text-xs"><div className="flex items-start justify-between gap-3"><div><blockquote className="font-semibold text-on-surface">“{annotation.quotedText}”</blockquote><p className="mt-1 text-on-surface-variant">{annotation.comment}</p>{annotation.suggestion ? <p className="mt-1 text-emerald-700">Gợi ý: {annotation.suggestion}</p> : null}</div><button type="button" className="text-error" aria-label="Xóa inline comment" onClick={() => setAnnotations((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash size={16} /></button></div></div>)}</section> : null}
              {reviewSubmission.reflection ? <div className="rounded-xl border border-primary/20 bg-primary-container/10 p-4 text-sm"><strong>Reflection của học viên</strong><p className="mt-1 whitespace-pre-wrap">{reviewSubmission.reflection}</p></div> : null}
            </div>
            <aside className="space-y-4 lg:border-l lg:border-outline-variant/35 lg:pl-5">
              <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold">Kết quả<select value={reviewStatus} onChange={event => setReviewStatus(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-lg border-outline-variant/60 bg-surface"><option value="VERIFIED">Đạt / hoàn tất</option><option value="REVISION_REQUESTED">Yêu cầu sửa lại</option><option value="REJECTED">Từ chối</option></select></label><label className="text-sm font-bold">{["WRITING", "SPEAKING"].includes(reviewTarget.activity.skill) ? "Overall band" : "Điểm tổng"}<input type="number" min="0" max={["WRITING", "SPEAKING"].includes(reviewTarget.activity.skill) ? 9 : 100} step={["WRITING", "SPEAKING"].includes(reviewTarget.activity.skill) ? 0.5 : 1} value={reviewScore} onChange={event => setReviewScore(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-lg border-outline-variant/60 bg-surface" /></label></div>
              {rubric.length ? <section><div className="flex items-center justify-between"><h3 className="text-sm font-extrabold">Rubric {reviewTarget.activity.skill === "SPEAKING" ? "Speaking" : "Writing"}</h3><span className="text-xs text-on-surface-variant">Band 0–9</span></div><div className="mt-2 grid gap-2">{rubric.map((item, index) => <div key={item.criterion} className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-3"><div className="flex items-center gap-3"><strong className="flex-1 text-xs">{item.label}</strong><input aria-label={`Điểm ${item.label}`} type="number" min="0" max="9" step="0.5" value={item.score} onChange={(event) => setRubric((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, score: event.target.value } : entry))} className="h-9 w-20 rounded-lg border-outline-variant/60 bg-surface text-center text-sm font-extrabold" /></div><textarea rows={2} aria-label={`Nhận xét ${item.label}`} value={item.feedback} onChange={(event) => setRubric((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, feedback: event.target.value } : entry))} className="mt-2 w-full rounded-lg border-outline-variant/60 bg-surface text-xs" placeholder="Nhận xét theo tiêu chí…" /></div>)}</div></section> : null}
              <section className="space-y-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-3"><h3 className="text-sm font-extrabold">Theo dõi deadline</h3><label className="block text-xs font-bold">Extension deadline<input type="datetime-local" value={extensionDueAt} onChange={(event) => setExtensionDueAt(event.target.value)} className="mt-1 w-full rounded-lg border-outline-variant/60 bg-surface" /></label><label className="block text-xs font-bold">Lý do extension<input value={extensionReason} onChange={(event) => setExtensionReason(event.target.value)} className="mt-1 w-full rounded-lg border-outline-variant/60 bg-surface" placeholder="Ví dụ: học viên ốm / có lý do chính đáng" /></label><button type="button" disabled={reviewSaving || !extensionDueAt} onClick={() => void saveExtension()} className="min-h-9 rounded-lg border border-primary/35 px-3 text-xs font-bold text-primary disabled:opacity-50">Cấp / cập nhật extension</button><label className="block text-xs font-bold">Deadline reflection<input type="datetime-local" value={reflectionDueAt} onChange={(event) => setReflectionDueAt(event.target.value)} className="mt-1 w-full rounded-lg border-outline-variant/60 bg-surface" /></label></section>
              <label className="block text-sm font-bold">Nhận xét tổng hợp<textarea rows={5} value={reviewFeedback} onChange={event => setReviewFeedback(event.target.value)} className="mt-1.5 w-full rounded-xl border-outline-variant/60 bg-surface" placeholder="Nêu điểm tốt, lỗi cần sửa và hành động tiếp theo…" /></label>
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setReviewTarget(null)} className="min-h-10 rounded-lg border border-outline-variant/60 px-4 text-sm font-bold">Hủy</button><button type="button" disabled={reviewSaving} onClick={() => void saveReview()} className="min-h-10 rounded-lg bg-primary px-4 text-sm font-bold text-on-primary disabled:opacity-50">{reviewSaving ? "Đang lưu…" : "Lưu review"}</button></div>
            </aside>
          </div>}
        </section>
      </div> : null}
      {testViewerStudent ? <div className="fixed inset-0 z-[55] grid place-items-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-label="Xem bài làm Listening Reading">
        <section className="max-h-[94vh] w-full max-w-7xl overflow-y-auto rounded-2xl border border-outline-variant/40 bg-surface p-5 shadow-2xl">
          <header className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-wider text-primary">Teacher Attempt Viewer · {selectedSkill}</p><h2 className="mt-1 font-display text-xl font-extrabold">{testViewerStudent.fullName}</h2><p className="mt-1 text-sm text-on-surface-variant">Xem trực tiếp các lần làm, đáp án từng câu, kết quả và transcript/audio của phiên bản đã giao.</p></div><button type="button" onClick={() => { setTestViewerStudent(null); setTestViewerDetail(null); }} aria-label="Đóng"><X size={20} /></button></header>
          {!testViewerDetail && testViewerDetailLoading ? <p className="py-10 text-center text-sm text-on-surface-variant">Đang tải chi tiết bài làm…</p> : !testViewerDetail ? <p className="py-10 text-center text-sm text-on-surface-variant">Học viên chưa có bài làm.</p> : <div className="mt-5 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="space-y-3"><section className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-3"><h3 className="text-xs font-extrabold uppercase tracking-wide text-on-surface-variant">Lịch sử lần làm</h3><div className="mt-2 space-y-2">{testViewerDetail.attemptHistory.map((item) => <button key={item.attemptId} type="button" onClick={() => void loadTestAttemptDetail(item)} className={`w-full rounded-lg border p-3 text-left text-xs ${item.attemptId === testViewerDetail.attempt.attemptId ? "border-primary bg-primary-fixed/35" : "border-outline-variant/35 bg-surface hover:border-primary/40"}`}><strong className="block">{item.testTitle}</strong><span className="mt-1 block text-on-surface-variant">Attempt {item.attemptNo} · {item.status}</span><span className="mt-1 block font-bold text-primary">{item.score == null ? "Chưa có điểm" : `${item.score}/${item.maxScore}`}</span><span className="mt-1 block text-[10px] text-on-surface-variant">{formatDateTime(item.submittedAt || item.startedAt)}</span></button>)}</div></section></aside>
            <div className="min-w-0 space-y-5"><section className="grid gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 sm:grid-cols-2 xl:grid-cols-5"><div><span className="block text-[11px] font-bold text-on-surface-variant">Đề / phiên bản</span><strong className="mt-1 block text-sm">{testViewerDetail.attempt.testTitle}</strong><span className="text-xs text-primary">{testViewerDetail.attempt.versionLabel}</span></div><div><span className="block text-[11px] font-bold text-on-surface-variant">Kết quả</span><strong className="mt-1 block text-sm">{testViewerDetail.result ? `${testViewerDetail.result.autoScore ?? testViewerDetail.attempt.score ?? 0}/${testViewerDetail.result.maxScore}` : testViewerDetail.attempt.status}</strong><span className="text-xs text-on-surface-variant">{testViewerDetail.attempt.correctCount} đúng · {testViewerDetail.attempt.incorrectCount} sai · {testViewerDetail.attempt.unansweredCount} bỏ trống{ieltsBand(testViewerDetail.attempt) == null ? "" : ` · Band ${ieltsBand(testViewerDetail.attempt)!.toFixed(1)}`}</span></div><div><span className="block text-[11px] font-bold text-on-surface-variant">Thời gian làm</span><strong className="mt-1 block text-sm">{formatDuration(testViewerDetail.attempt.durationSeconds)}</strong><span className="text-xs text-on-surface-variant">Bắt đầu {formatDateTime(testViewerDetail.attempt.startedAt)}</span></div><div><span className="block text-[11px] font-bold text-on-surface-variant">Nộp bài</span><strong className="mt-1 block text-sm">{formatDateTime(testViewerDetail.attempt.submittedAt)}</strong></div><div><span className="block text-[11px] font-bold text-on-surface-variant">Session</span><strong className="mt-1 block text-sm">{testViewerDetail.attempt.sessionNo == null ? "—" : `Session ${testViewerDetail.attempt.sessionNo}`}</strong><span className="text-xs text-on-surface-variant">{testViewerDetail.attempt.sessionTitle || ""}</span></div></section>
              {testViewerDetail.result?.questions?.length ? <section className="overflow-hidden rounded-xl border border-outline-variant/40"><div className="border-b border-outline-variant/35 px-4 py-3"><h3 className="text-sm font-extrabold">Đáp án từng câu</h3><p className="mt-1 text-xs text-on-surface-variant">Đáp án được đọc từ test_attempt_responses và chấm theo đúng test version đã giao.</p></div><div className="divide-y divide-outline-variant/25">{testViewerDetail.result.questions.map((question) => <div key={question.questionKey} className="grid gap-3 px-4 py-3 md:grid-cols-[52px_150px_120px_minmax(0,1fr)] md:items-start"><strong className="text-sm">#{question.questionNo}</strong><span className="text-xs"><span className="block text-[10px] font-bold uppercase text-on-surface-variant">Học viên</span><strong className={question.correct === true ? "text-emerald-700" : question.correct === false ? "text-rose-700" : "text-on-surface"}>{answerLabel(question.answer)}</strong></span><span className="text-xs"><span className="block text-[10px] font-bold uppercase text-on-surface-variant">Trạng thái</span><strong>{question.correct === true ? "Đúng" : question.correct === false ? "Sai" : question.answered ? "Chưa xác định" : "Bỏ trống"}</strong><span className="block text-on-surface-variant">{question.score}/{question.maxScore}</span></span><div className="text-xs"><span className="block text-[10px] font-bold uppercase text-on-surface-variant">Đáp án đúng / explanation</span><span className="block font-semibold">{question.correctAnswers.length ? question.correctAnswers.join(", ") : "—"}</span>{question.explanation || question.solution?.explanation ? <p className="mt-1 whitespace-pre-wrap text-on-surface-variant">{question.explanation || question.solution?.explanation}</p> : null}</div></div>)}</div></section> : <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><strong>Bài đang làm dở</strong><div className="mt-2 grid gap-2">{testViewerDetail.attemptPayload.responses.map((response) => <div key={response.questionKey} className="flex justify-between gap-3 text-xs"><span>{response.questionKey}</span><strong>{answerLabel(response.answer)}</strong></div>)}</div></section>}
              {testViewerDetail.attemptPayload.sections.map((section) => <section key={`${section.sectionNo}-${section.title}`} className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-extrabold">Section {section.sectionNo} · {section.title}</h3><p className="mt-1 text-[11px] text-on-surface-variant">Transcript / nội dung phiên bản đã giao</p></div>{section.audioUrl ? <span className="text-[11px] font-bold text-primary">{section.audioFilename || "Audio Listening"}</span> : null}</div>{section.audioUrl ? <SubmissionAudio url={section.audioUrl} timestamps={sectionTimestamps(section)} /> : null}{section.contentHtml ? <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-outline-variant/30 bg-surface p-3 text-xs leading-6" dangerouslySetInnerHTML={{ __html: section.contentHtml }} /> : <p className="mt-3 text-xs text-on-surface-variant">Không có transcript text cho section này.</p>}</section>)}
            </div>
          </div>}
        </section>
      </div> : null}
      {settingsTarget ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-label="Cấu hình assignment">
        <section className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-outline-variant/40 bg-surface p-5 shadow-2xl">
          <header className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-wider text-primary">Assignment settings</p><h2 className="mt-1 font-display text-xl font-extrabold">{settingsTarget.title}</h2><p className="mt-1 text-sm text-on-surface-variant">Điều chỉnh deadline và cách xử lý bài nộp của hoạt động này.</p></div><button type="button" onClick={() => setSettingsTarget(null)} aria-label="Đóng"><X size={20} /></button></header>
          {settingsLoading || !settingsDraft ? <p className="py-10 text-center text-sm text-on-surface-variant">Đang tải cấu hình…</p> : <div className="mt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold">Mở từ<input type="datetime-local" value={settingsDraft.opensAt} onChange={event => setSettingsDraft(current => current && { ...current, opensAt: event.target.value })} className="mt-1.5 min-h-10 w-full rounded-lg border-outline-variant/60 bg-surface" /></label><label className="text-sm font-bold">Deadline nộp<input type="datetime-local" value={settingsDraft.dueAt} onChange={event => setSettingsDraft(current => current && { ...current, dueAt: event.target.value })} className="mt-1.5 min-h-10 w-full rounded-lg border-outline-variant/60 bg-surface" /></label></div>
            <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold">Late policy<select value={settingsDraft.latePolicy} onChange={event => setSettingsDraft(current => current && { ...current, latePolicy: event.target.value })} className="mt-1.5 min-h-10 w-full rounded-lg border-outline-variant/60 bg-surface"><option value="MARK_LATE">Cho nộp, đánh dấu muộn</option><option value="ALLOW">Cho nộp không phạt</option><option value="BLOCK">Chặn sau deadline</option></select></label><label className="text-sm font-bold">Grace phút<input type="number" min="0" max="10080" value={settingsDraft.lateGraceMinutes} onChange={event => setSettingsDraft(current => current && { ...current, lateGraceMinutes: event.target.value })} className="mt-1.5 min-h-10 w-full rounded-lg border-outline-variant/60 bg-surface" /></label></div>
            <label className="flex min-h-10 items-center gap-2 text-sm font-bold"><input type="checkbox" checked={settingsDraft.allowResubmission} onChange={event => setSettingsDraft(current => current && { ...current, allowResubmission: event.target.checked })} /> Cho phép học viên nộp bản revision</label>
            <label className="block text-sm font-bold">Deadline reflection<input type="datetime-local" value={settingsDraft.reflectionDueAt} onChange={event => setSettingsDraft(current => current && { ...current, reflectionDueAt: event.target.value })} className="mt-1.5 min-h-10 w-full rounded-lg border-outline-variant/60 bg-surface" /><small className="mt-1 block font-normal text-on-surface-variant">Để trống nếu không yêu cầu reflection.</small></label>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setSettingsTarget(null)} className="min-h-10 rounded-lg border border-outline-variant/60 px-4 text-sm font-bold">Hủy</button><button type="button" disabled={settingsSaving} onClick={() => void saveAssignmentSettings()} className="min-h-10 rounded-lg bg-primary px-4 text-sm font-bold text-on-primary disabled:opacity-50">{settingsSaving ? "Đang lưu…" : "Lưu cấu hình"}</button></div>
          </div>}
        </section>
      </div> : null}
      {studentExtensionTarget ? <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-label="Cấp extension cho học viên"><section className="w-full max-w-lg rounded-2xl border border-outline-variant/40 bg-surface p-5 shadow-2xl"><header className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-wider text-primary">Extension theo học viên</p><h2 className="mt-1 font-display text-xl font-extrabold">{studentExtensionTarget.studentName}</h2><p className="mt-1 text-sm text-on-surface-variant">Áp dụng cho assignment “{studentExtensionTarget.activity.title}”, kể cả khi học viên chưa tạo submission.</p></div><button type="button" onClick={() => setStudentExtensionTarget(null)} aria-label="Đóng"><X size={20} /></button></header>{studentExtensionLoading ? <p className="py-10 text-center text-sm text-on-surface-variant">Đang tải deadline riêng…</p> : <div className="mt-5 space-y-4"><label className="block text-sm font-bold">Deadline hiệu lực<input type="datetime-local" value={studentExtensionDraft.extensionDueAt} onChange={(event) => setStudentExtensionDraft(current => ({ ...current, extensionDueAt: event.target.value }))} className="mt-1.5 min-h-10 w-full rounded-lg border-outline-variant/60 bg-surface" /></label><label className="block text-sm font-bold">Lý do<input value={studentExtensionDraft.reason} onChange={(event) => setStudentExtensionDraft(current => ({ ...current, reason: event.target.value }))} className="mt-1.5 min-h-10 w-full rounded-lg border-outline-variant/60 bg-surface" placeholder="Ví dụ: lý do sức khỏe / lịch học" /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setStudentExtensionTarget(null)} className="min-h-10 rounded-lg border border-outline-variant/60 px-4 text-sm font-bold">Hủy</button><button type="button" disabled={studentExtensionSaving || !studentExtensionDraft.extensionDueAt} onClick={() => void saveStudentExtension()} className="min-h-10 rounded-lg bg-primary px-4 text-sm font-bold text-on-primary disabled:opacity-50">{studentExtensionSaving ? "Đang lưu…" : "Lưu extension"}</button></div></div>}</section></div> : null}
      {testReminderTarget ? <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-label="Nhắc học viên làm test"><section className="w-full max-w-lg rounded-2xl border border-outline-variant/40 bg-surface p-5 shadow-2xl"><header className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-wider text-primary">Nhắc làm test</p><h2 className="mt-1 font-display text-xl font-extrabold">{testReminderTarget.title}</h2><p className="mt-1 text-sm text-on-surface-variant">Đang chọn {testReminderTarget.studentIds.length} học viên chưa nộp bài.</p></div><button type="button" onClick={() => setTestReminderTarget(null)} aria-label="Đóng"><X size={20} /></button></header><label className="mt-5 block text-sm font-bold">Nội dung nhắc<textarea rows={4} value={testReminderMessage} onChange={(event) => setTestReminderMessage(event.target.value)} className="mt-1.5 w-full rounded-xl border-outline-variant/60 bg-surface" /></label><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setTestReminderTarget(null)} className="min-h-10 rounded-lg border border-outline-variant/60 px-4 text-sm font-bold">Hủy</button><button type="button" disabled={testReminderSaving} onClick={() => void sendTestReminder()} className="min-h-10 rounded-lg bg-primary px-4 text-sm font-bold text-on-primary disabled:opacity-50">{testReminderSaving ? "Đang gửi…" : "Gửi nhắc"}</button></div></section></div> : null}
      {reminderTarget ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-label="Nhắc học viên"><section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-outline-variant/40 bg-surface p-5 shadow-2xl"><header className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-wider text-primary">Bulk reminder</p><h2 className="mt-1 font-display text-xl font-extrabold">{reminderTarget.title}</h2><p className="mt-1 text-sm text-on-surface-variant">Chọn theo trạng thái rồi bỏ/chọn từng học viên. Đang chọn {reminderRecipients.length}/{roster.length}.</p></div><button type="button" onClick={() => setReminderTarget(null)} aria-label="Đóng"><X size={20} /></button></header><div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"><label className="text-sm font-bold">Nhóm trạng thái<select value={reminderFilter} onChange={(event) => changeReminderFilter(event.target.value as ReminderFilter)} className="mt-1.5 min-h-10 w-full rounded-lg border-outline-variant/60 bg-surface"><option value="NOT_STARTED">Chưa bắt đầu</option><option value="IN_PROGRESS">Đang làm</option><option value="WAITING_REVIEW">Chờ chấm</option><option value="REVISION">Cần sửa</option><option value="OVERDUE">Đang quá hạn</option><option value="ALL">Tất cả active</option></select></label><label className="flex min-h-10 items-end gap-2 pb-1 text-xs font-bold"><input type="checkbox" checked={roster.filter(({ student }) => matchesReminderFilter(reminderTarget, student.id, reminderFilter)).length > 0 && roster.filter(({ student }) => matchesReminderFilter(reminderTarget, student.id, reminderFilter)).every(({ student }) => reminderRecipients.includes(student.id))} onChange={(event) => { const ids = roster.filter(({ student }) => matchesReminderFilter(reminderTarget, student.id, reminderFilter)).map(({ student }) => student.id); setReminderRecipients(current => event.target.checked ? Array.from(new Set([...current, ...ids])) : current.filter(id => !ids.includes(id))); }} /> Chọn cả nhóm</label></div><div className="mt-3 max-h-52 overflow-y-auto rounded-xl border border-outline-variant/40 bg-surface-container-low p-2">{roster.filter(({ student }) => matchesReminderFilter(reminderTarget, student.id, reminderFilter)).map(({ student }) => <label key={student.id} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-surface"><input type="checkbox" checked={reminderRecipients.includes(student.id)} onChange={() => toggleReminderRecipient(student.id)} /><span>{student.fullName}</span></label>)}{!roster.some(({ student }) => matchesReminderFilter(reminderTarget, student.id, reminderFilter)) ? <p className="px-2 py-3 text-xs text-on-surface-variant">Không có học viên trong nhóm trạng thái này.</p> : null}</div><label className="mt-5 block text-sm font-bold">Nội dung nhắc<textarea rows={4} value={reminderMessage} onChange={(event) => setReminderMessage(event.target.value)} className="mt-1.5 w-full rounded-xl border-outline-variant/60 bg-surface" /></label>{contactLogs.length ? <section className="mt-4 space-y-2"><h3 className="text-sm font-extrabold">Lịch sử gần đây · {contactLogs.length}</h3>{contactLogs.slice(0, 5).map((log) => <div key={log.id} className="rounded-lg border border-outline-variant/35 bg-surface-container-low p-3 text-xs"><div className="flex justify-between gap-3"><strong>{log.studentName}</strong><time>{formatDateTime(log.createdAt)}</time></div><p className="mt-1 text-on-surface-variant">{log.message}</p></div>)}</section> : <p className="mt-4 text-xs text-on-surface-variant">Chưa có lịch sử liên lạc cho hoạt động này.</p>}<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setReminderTarget(null)} className="min-h-10 rounded-lg border border-outline-variant/60 px-4 text-sm font-bold">Hủy</button><button type="button" disabled={reminderSaving || !reminderRecipients.length} onClick={() => void sendReminder()} className="min-h-10 rounded-lg bg-primary px-4 text-sm font-bold text-on-primary disabled:opacity-50">{reminderSaving ? "Đang gửi…" : `Gửi nhắc ${reminderRecipients.length} học viên`}</button></div></section></div> : null}
    </div>
  );
}
