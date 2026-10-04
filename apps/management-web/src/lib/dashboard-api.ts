import type { Course } from "../academic-types";
import { apiFetch } from "./api";

export type KpiMetric = {
  value: number;
  formattedValue: string;
  previousValue: number | null;
  changePercent: number | null;
  changeType: "INCREASE" | "DECREASE" | "STABLE";
  tooltip: string;
  targetRoute: string;
};

export type ExecutiveKpis = {
  activeStudents: KpiMetric;
  pendingLeads: KpiMetric;
  leadConversionRate: KpiMetric;
  averageAttendanceRate: KpiMetric;
  pendingGradingCount: KpiMetric;
  overdueInvoicesCount: KpiMetric;
};

export type ActionItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  count: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  deadlineNote: string;
  ctaLabel: string;
  ctaRoute: string;
};

export type TrendPoint = {
  dateLabel: string;
  date: string;
  averageScore: number | null;
  completedAttempts: number;
  attendanceRate: number | null;
  readingScore: number | null;
  listeningScore: number | null;
  writingScore: number | null;
  speakingScore: number | null;
};

export type LearningTrend = {
  points: TrendPoint[];
  benchmarkTargetScore: number | null;
};

export type AtRiskStudent = {
  studentId: string;
  studentCode: string;
  fullName: string;
  courseName: string;
  courseCode: string;
  riskReason: string;
  riskLevel: "HIGH" | "MEDIUM";
  currentBand: number | null;
  targetBand: number | null;
  missedSessions: number;
  pendingAssignments: number;
  profileRoute: string;
};

export type ScheduleEvent = {
  id: string;
  eventType: "COURSE_START" | "CLASS_SESSION" | "TEST_DEADLINE";
  title: string;
  courseName: string;
  courseCode: string;
  startsAt: string;
  endsAt: string | null;
  teacherName: string | null;
  locationOrZoom: string | null;
  statusBadge: string;
};

export type CoursePerformance = {
  courseId: string;
  courseCode: string;
  courseName: string;
  currentEnrollments: number;
  capacity: number;
  attendanceRate: number | null;
  completionProgress: number;
  averageScore: number | null;
  atRiskCount: number;
  operationalStatus: string;
};

export type CourseOption = {
  id: string;
  code: string;
  name: string;
};

export type AdminDashboard = {
  activeEnrollments: number;
  openCourses: number;
  activeCourses: number;
  totalCourses: number;
  upcomingCourses: Array<{
    id: string;
    code: string;
    name: string;
    capacity: number;
    startsOn: string;
    status: Course["status"];
  }>;
  kpis: ExecutiveKpis;
  actionItems: ActionItem[];
  trend: LearningTrend;
  atRiskStudents: AtRiskStudent[];
  scheduleEvents: ScheduleEvent[];
  coursePerformances: CoursePerformance[];
  courseFilterOptions: CourseOption[];
  updatedAt: string;
};

export type ContentHubDashboard = {
  summary: {
    resources: number;
    tests: number;
    media: number;
    awaitingReview: number;
    inUse: number;
  };
  recentResources: Array<{
    id: string;
    code: string;
    title: string;
    description: string | null;
    skill: string;
    updatedAt: string;
  }>;
  draftTests: Array<{
    id: string;
    code: string;
    title: string;
    skill: string;
    totalQuestions: number;
    updatedAt: string;
  }>;
};

const pending = new Map<string, Promise<unknown>>();

function deduplicatedGet<T>(path: string): Promise<T> {
  const existing = pending.get(path) as Promise<T> | undefined;
  if (existing) return existing;

  const request = apiFetch<T>(path).finally(() => {
    if (pending.get(path) === request) pending.delete(path);
  });
  pending.set(path, request);
  return request;
}

export function getAdminDashboard(timeRange = "7d", courseId?: string) {
  const params = new URLSearchParams();
  if (timeRange) params.set("timeRange", timeRange);
  if (courseId) params.set("courseId", courseId);
  const query = params.toString();
  return deduplicatedGet<AdminDashboard>(`/admin/dashboard${query ? `?${query}` : ""}`);
}

export function getContentHubDashboard() {
  return deduplicatedGet<ContentHubDashboard>("/admin/library/dashboard");
}
