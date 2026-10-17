"use client";

import type { StudentReadingAssignment } from "@ielts/contracts";
import { apiFetch, apiUpload } from "@/lib/api";

export interface StudentCourseItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  level: string | null;
  skillPair: "LISTENING_READING" | "SPEAKING_WRITING";
  targetBand: number | null;
  totalSessions: number | null;
  tuitionAmount: number | null;
  capacity: number | null;
  startsOn: string;
  endsOn: string | null;
  status: "PLANNED" | "OPEN" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  defaultZoomUrl: string | null;
}

export type StudentEnrollmentStatus = "PENDING" | "ACTIVE" | "PAUSED" | "COMPLETED";
export type StudentAttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "GRADED" | "EXPIRED";

export interface StudentPortalProfile {
  id: string;
  studentCode: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarPath: string | null;
  currentBand: number | null;
  targetBand: number | null;
  listeningTarget: number | null;
  readingTarget: number | null;
  writingTarget: number | null;
  speakingTarget: number | null;
  joinedAt: string;
  plannedExamDate: string | null;
  examPlanStatus: "PLANNED" | "NONE" | null;
  learningSetupComplete: boolean;
}

export interface StudentSkillTargets {
  listeningTarget: number;
  readingTarget: number;
  writingTarget: number;
  speakingTarget: number;
}

export interface StudentPortalMetrics {
  assignedTests: number;
  pendingTests: number;
  completedAttempts: number;
  currentStreakDays: number;
  lastActivityAt: string | null;
}

export interface StudentPortalEnrollment {
  enrollmentId: string;
  status: StudentEnrollmentStatus;
  courseId: string;
  courseCode: string;
  courseName: string;
  description: string | null;
  level: string | null;
  skillPair: "LISTENING_READING" | "SPEAKING_WRITING";
  courseTargetBand: number | null;
  startsOn: string;
  endsOn: string | null;
  completedSessions: number;
  totalSessions: number;
  primaryTeacherName: string | null;
  nextSessionAt: string | null;
  plannedExamMonth: string | null;
  actualExamDate: string | null;
  examRegistrationStatus: "NOT_REGISTERED" | "REGISTERED" | "ISSUE";
}

export interface StudentPortalSession {
  sessionId: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  sessionNo: number;
  title: string | null;
  phaseName: string | null;
  startsAt: string;
  endsAt: string;
  status: "SCHEDULED";
  teacherName: string | null;
  zoomUrl: string | null;
}

export interface StudentPortalAttempt {
  attemptId: string;
  assignmentId: string | null;
  title: string;
  skill: "READING" | "LISTENING" | "WRITING" | "SPEAKING" | string;
  status: StudentAttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  maxScore: number;
  correctCount: number | null;
  totalQuestions: number;
}

export interface StudentPortalDailyActivity {
  activityDate: string;
  reading: number;
  listening: number;
  writing: number;
  speaking: number;
  totalAttempts: number;
}

export interface StudentCourseRecommendation {
  courseId: string;
  code: string;
  name: string;
  description: string | null;
  level: string | null;
  skillPair: "LISTENING_READING" | "SPEAKING_WRITING";
  targetBand: number | null;
  startsOn: string;
  endsOn: string | null;
  reason: string;
}

export interface StudentPortalOverview {
  profile: StudentPortalProfile;
  metrics: StudentPortalMetrics;
  enrollments: StudentPortalEnrollment[];
  upcomingSessions: StudentPortalSession[];
  recentAttempts: StudentPortalAttempt[];
  activityCalendar: StudentPortalDailyActivity[];
  readingAssignments: StudentReadingAssignment[];
  recommendedCourses: StudentCourseRecommendation[];
  aiStatus: "DEVELOPMENT" | "AVAILABLE";
}

let pendingOverview: Promise<StudentPortalOverview> | null = null;

export function getStudentPortalOverview() {
  if (pendingOverview) return pendingOverview;
  const request = apiFetch<StudentPortalOverview>("/student/portal/overview").finally(() => {
    if (pendingOverview === request) pendingOverview = null;
  });
  pendingOverview = request;
  return request;
}

export function getStudentPortalActivity(month: string, signal?: AbortSignal) {
  return apiFetch<StudentPortalDailyActivity[]>(
    `/student/portal/activity?month=${encodeURIComponent(month)}`,
    { signal },
  );
}

export function updateStudentTargetBand(targetBand: number, skillTargets: StudentSkillTargets) {
  return apiFetch<{ currentBand: number | null; targetBand: number } & StudentSkillTargets>(
    "/student/portal/target-band",
    {
      method: "PATCH",
      body: JSON.stringify({ targetBand, ...skillTargets }),
    },
  );
}

export function updateStudentExamPlan(noExamPlan: boolean, plannedExamDate: string | null) {
  return apiFetch<{ noExamPlan: boolean; plannedExamDate: string | null; learningSetupComplete: boolean }>(
    "/student/portal/exam-plan",
    {
      method: "PATCH",
      body: JSON.stringify({ noExamPlan, plannedExamDate }),
    },
  );
}

export function fetchStudentCourses() {
  return apiFetch<StudentCourseItem[]>("/student/portal/courses");
}

export interface StudentCourseSessionItem {
  id: string;
  courseId: string;
  sessionNo: number;
  title: string | null;
  startsAt: string | null;
  endsAt: string | null;
  zoomUrl: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  phaseName: string | null;
  teacherName: string | null;
}

export function fetchStudentCourseSessions(courseId: string) {
  return apiFetch<StudentCourseSessionItem[]>(`/student/portal/courses/${courseId}/sessions`);
}

export interface CourseWorkspaceData {
  course: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    level: string | null;
    skillPair: "LISTENING_READING" | "SPEAKING_WRITING";
    targetBand: number | null;
    totalSessions: number | null;
    tuitionAmount: number | null;
    capacity: number | null;
    startsOn: string;
    endsOn: string | null;
    status: string;
    defaultZoomUrl: string | null;
    primaryTeacherName: string | null;
  };
  enrollment: {
    enrollmentId: string;
    status: string;
    completedSessions: number;
    totalSessions: number;
    plannedExamMonth: string | null;
    actualExamDate: string | null;
    examRegistrationStatus: string;
  };
  nextAction: {
    actionType: string;
    title: string;
    description: string;
    deadline: string | null;
    priority: "HIGH" | "MEDIUM" | "LOW";
    ctaLabel: string;
    ctaUrl: string;
    contextBadge: string;
  };
  nextSession: {
    sessionId: string;
    sessionNo: number;
    title: string | null;
    phaseName: string | null;
    startsAt: string | null;
    endsAt: string | null;
    teacherName: string | null;
    zoomUrl: string | null;
    prepMaterials: string[];
    prerequisiteTasks: string[];
  } | null;
  sessions: {
    id: string;
    sessionNo: number;
    title: string | null;
    phaseName: string | null;
    content: string | null;
    startsAt: string | null;
    endsAt: string | null;
    status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
    teacherName: string | null;
    zoomUrl: string | null;
    hasTest: boolean;
    itemCount: number;
    materials: {
      id: string;
      title: string;
      resourceType: string;
      fileRole: string;
      externalUrl: string | null;
    }[];
    assignments: {
      id: string;
      title: string;
      status: string;
      score: number | null;
      maxScore: number | null;
    }[];
  }[];
  resources: {
    id: string;
    code: string;
    title: string;
    skill: string;
    resourceType: string;
    fileRole: string;
    externalUrl: string | null;
    category: string | null;
    sessionNo: number | null;
  }[];
  skills: {
    overallBand: number | null;
    targetBand: number | null;
    readingAccuracy: number | null;
    listeningAccuracy: number | null;
    writingBandScore: number | null;
    speakingBandScore: number | null;
    totalCompletedTests: number;
    totalQuestionsAnswered: number;
  };
  studyLogs: {
    id: string;
    testTitle: string;
    skill: string;
    completedAt: string | null;
    score: number | null;
    maxScore: number | null;
    correctCount: number | null;
    totalQuestions: number | null;
    source: string;
    platform: string;
    reviewUrl: string;
  }[];
  weaknesses: {
    questionType: string;
    errorCount: number;
    recommendation: string;
    skill: string;
  }[];
  goalProgress: {
    weeklyCompletedCount: number;
    weeklyTarget: number;
    onTimeRate: number;
    sessionAttendanceRate: number;
    currentStreakDays: number;
  };
  teacherFeedback: {
    id: string;
    teacherName: string;
    reviewedAt: string;
    status: string;
    verifiedScore: number | null;
    feedback: string | null;
    isRevisionRequired: boolean;
    priority: string;
    isRead: boolean;
  }[];
}

export function fetchStudentCourseWorkspace(courseId: string) {
  return apiFetch<CourseWorkspaceData>(`/student/portal/courses/${courseId}/workspace`);
}

export interface StudentProgressTask {
  classActivityId: string;
  sessionId: string;
  sessionNo: number;
  sessionTitle: string;
  activityId: string;
  title: string;
  skill: string;
  completionMethod: string;
  attemptId: string | null;
  source: string | null;
  status: string | null;
  score: number | null;
  maxScore: number | null;
  durationSeconds: number | null;
  comprehensionPercent: number | null;
  errorAnalysis: string | null;
  evidenceCount: number;
  checklist: { id: string; label: string; description: string | null; required: boolean; completed: boolean }[];
}

export function fetchStudentCourseProgress(courseId: string) {
  return apiFetch<StudentProgressTask[]>(`/student/portal/courses/${courseId}/progress`);
}

export function uploadStudentProgressEvidence(courseId: string, classActivityId: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  return apiUpload(`/student/portal/courses/${courseId}/activities/${classActivityId}/evidence`, body);
}

export function updateStudentProgressChecklist(
  courseId: string,
  attemptId: string,
  checklistItemId: string,
  completed: boolean,
) {
  return apiFetch<void>(`/student/portal/courses/${courseId}/progress/${attemptId}/checklist/${checklistItemId}`, {
    method: "PATCH",
    body: JSON.stringify({ completed }),
  });
}

export function updateStudentProgressSummary(
  courseId: string,
  attemptId: string,
  durationSeconds: number | null,
  comprehensionPercent: number | null,
) {
  return apiFetch<void>(`/student/portal/courses/${courseId}/progress/${attemptId}/summary`, {
    method: "PATCH",
    body: JSON.stringify({ durationSeconds, comprehensionPercent }),
  });
}


