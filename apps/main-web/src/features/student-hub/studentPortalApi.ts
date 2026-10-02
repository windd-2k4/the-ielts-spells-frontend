"use client";

import type { StudentReadingAssignment } from "@ielts/contracts";
import { apiFetch } from "@/lib/api";

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
  joinedAt: string;
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
  skill: "READING";
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

export function updateStudentTargetBand(targetBand: number) {
  return apiFetch<{ currentBand: number | null; targetBand: number }>(
    "/student/portal/target-band",
    {
      method: "PATCH",
      body: JSON.stringify({ targetBand }),
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
    startsAt: string | null;
    endsAt: string | null;
    status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
    teacherName: string | null;
    zoomUrl: string | null;
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


