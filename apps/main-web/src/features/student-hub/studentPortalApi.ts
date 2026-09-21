"use client";

import type { StudentReadingAssignment } from "@ielts/contracts";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export interface DatabaseCourseItem {
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
  isPublic: boolean;
  isActive: boolean;
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

export async function fetchSystemCourses(): Promise<DatabaseCourseItem[]> {
  try {
    const { data, error } = await supabase
      .from("courses")
      .select(
        "id, code, name, description, level, skill_pair, target_band, total_sessions, tuition_amount, capacity, starts_on, ends_on, status, is_public, is_active"
      )
      .eq("is_public", true)
      .eq("is_active", true)
      .order("starts_on", { ascending: true });

    if (error || !data) {
      console.warn("fetchSystemCourses warning:", error?.message);
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      description: item.description ?? null,
      level: item.level ?? null,
      skillPair: item.skill_pair,
      targetBand: item.target_band != null ? Number(item.target_band) : null,
      totalSessions: item.total_sessions != null ? Number(item.total_sessions) : null,
      tuitionAmount: item.tuition_amount != null ? Number(item.tuition_amount) : null,
      capacity: item.capacity != null ? Number(item.capacity) : null,
      startsOn: item.starts_on,
      endsOn: item.ends_on ?? null,
      status: item.status,
      isPublic: item.is_public,
      isActive: item.is_active,
    }));
  } catch (err) {
    console.error("fetchSystemCourses error:", err);
    return [];
  }
}

