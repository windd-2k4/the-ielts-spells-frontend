export type Page<T> = { content: T[]; totalElements: number; totalPages: number; page: number; size: number; first: boolean; last: boolean };

export type SkillPair = "LISTENING_READING" | "SPEAKING_WRITING";
export type CourseStatus = "OPEN" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type ClassStatus = CourseStatus;
export type Course = {
  id: string;
  programId: string | null;
  code: string;
  name: string;
  description: string | null;
  level: string | null;
  skillPair: SkillPair;
  targetBand: number | null;
  totalSessions: number;
  tuitionAmount: number | null;
  capacity: number;
  startsOn: string;
  endsOn: string | null;
  status: CourseStatus;
  defaultZoomUrl: string | null;
  isPublic: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
export type AcademicClass = Course;
export type CourseForm = {
  name: string; description: string; level: string; skillPair: SkillPair;
  targetBand: string; totalSessions: string; tuitionAmount: string; capacity: string;
  startsOn: string; endsOn: string; status: CourseStatus; defaultZoomUrl: string;
  isPublic: boolean; isActive: boolean;
};

export type EnrollmentStatus = "PENDING" | "ACTIVE" | "PAUSED" | "COMPLETED" | "WITHDRAWN";
export type StudentLifecycleStatus = EnrollmentStatus | "NONE";
export type Enrollment = {
  id: string; courseId: string; studentId: string; status: EnrollmentStatus;
  enrolledAt: string; startedOn: string | null; endedOn: string | null; notes: string | null;
  plannedExamMonth: string | null; actualExamDate: string | null;
  examRegistrationStatus: "NOT_REGISTERED" | "REGISTERED" | "ISSUE";
  targetNote: string | null;
};
export type StudentBase = {
  id: string; studentCode: string; fullName: string; email: string | null; phone: string | null;
  avatarPath: string | null; currentBand: number | null; targetBand: number | null;
  active: boolean;
};
export type StudentSummary = StudentBase & {
  lifecycleStatus: StudentLifecycleStatus;
  currentCourseId: string | null; currentCourseCode: string | null; currentCourseName: string | null;
  enrollmentCount: number; joinedAt: string;
};
export type StudentDetail = StudentBase & { dateOfBirth: string | null; address: string | null; emergencyContact: Record<string, unknown>; joinedAt: string; notes: string | null; createdAt: string; updatedAt: string };
export type Reservation = { id: string; enrollmentId: string; status: string; reason: string; sessionsConsumed: number | null; sessionsRemaining: number | null; creditAmount: number | null; expiresOn: string | null; targetCourseId: string | null; requestedAt: string; approvedAt: string | null; notes: string | null };
export type Transfer = { id: string; sourceEnrollmentId: string; targetCourseId: string; targetEnrollmentId: string | null; reservationId: string | null; status: string; reason: string; feeAdjustment: number | null; requestedAt: string; approvedAt: string | null; notes: string | null };
export type SessionStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type SessionItemType = "MATERIAL" | "ASSIGNMENT" | "TEST";
export type CourseSessionItem = {
  id: string; itemType: SessionItemType; title: string; description: string | null;
  sourceAssignmentId: string | null; sourceTestId: string | null;
  sourceResourceId: string | null; sourceExerciseTemplateId: string | null;
  deadlineAt: string | null; displayOrder: number; required: boolean;
  visibility: "STUDENT" | "TEACHER";
};
export type ClassSession = {
  id: string; courseId: string; sessionNo: number; title: string | null;
  startsAt: string; endsAt: string; zoomMeetingId: string | null; zoomUrl: string | null;
  status: SessionStatus; notes: string | null; phaseName: string | null;
  content: string | null; teacherId: string | null; teacherName: string | null;
  items: CourseSessionItem[];
};
export type TeacherOption = { id: string; fullName: string; email: string; role: string };
export type ScheduleTemplateEntry = {
  sessionNo: number; entryType: "SESSION" | "TEST"; phaseName: string | null; contents: string[];
};
export type ScheduleTemplate = {
  id: string; name: string; skillPair: SkillPair; description: string | null;
  entries: ScheduleTemplateEntry[];
};
export type AttendanceStatus = "PENDING" | "PRESENT" | "LATE" | "LEFT_EARLY" | "ABSENT" | "EXCUSED";
export type AttendanceRecord = { id: string; sessionId: string; studentId: string; status: AttendanceStatus; joinedAt: string | null; leftAt: string | null; durationSeconds: number | null; confirmed: boolean; adjustmentReason: string | null };
export type AttendanceSheetStatus = "DRAFT" | "LOCKED";
export type AttendanceSessionSummary = {
  sessionId: string; sessionNo: number; title: string | null; startsAt: string; endsAt: string;
  teacherName: string | null; sheetStatus: AttendanceSheetStatus | null; totalStudents: number;
  markedCount: number; presentCount: number; lateCount: number; leftEarlyCount: number;
  absentCount: number; excusedCount: number; pendingCount: number; attendanceRate: number;
  lockedAt: string | null;
};
export type AttendanceStudentRow = {
  recordId: string; studentId: string; studentCode: string; fullName: string; email: string | null;
  avatarPath: string | null; status: AttendanceStatus; joinedAt: string | null; leftAt: string | null;
  durationSeconds: number | null; source: "MANUAL" | "ZOOM"; note: string | null;
};
export type AttendanceSheet = { session: AttendanceSessionSummary; students: AttendanceStudentRow[] };
export type ActivityAttempt = { id: string; studentId: string; attemptNo: number; source: string; status: string; reviewStatus: string; score: number | null; maxScore: number | null; correctCount: number | null; incorrectCount: number | null; unansweredCount: number | null; durationSeconds: number | null; comprehensionPercent: number | null; errorAnalysis: string | null; improvementPlan: string | null; submittedAt: string | null; completedAt: string | null; late: boolean };
export type ClassActivityProgress = { classActivityId: string; sessionId: string | null; activityId: string; title: string; skill: "LISTENING" | "READING" | "WRITING" | "SPEAKING" | "VOCABULARY" | "GENERAL"; activityType: string; completionMethod: string; opensAt: string | null; dueAt: string | null; required: boolean; attempts: ActivityAttempt[] };

export const courseEmpty: CourseForm = { name: "", description: "", level: "", skillPair: "LISTENING_READING", targetBand: "", totalSessions: "20", tuitionAmount: "", capacity: "20", startsOn: "", endsOn: "", status: "OPEN", defaultZoomUrl: "", isPublic: true, isActive: true };
export const classStatusLabel: Record<CourseStatus, string> = { OPEN: "Chuẩn bị & tuyển sinh", ACTIVE: "Đang học", COMPLETED: "Đã hoàn thành", CANCELLED: "Đã hủy" };
export const skillPairLabel: Record<SkillPair, string> = { LISTENING_READING: "Listening & Reading", SPEAKING_WRITING: "Speaking & Writing" };
export const enrollmentStatusLabel: Record<EnrollmentStatus, string> = { PENDING: "Chờ xác nhận", ACTIVE: "Đang học", PAUSED: "Đang bảo lưu", COMPLETED: "Hoàn thành", WITHDRAWN: "Đã rút" };
export function money(value: number | null) { return value == null ? "Chưa đặt" : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value); }
export function date(value: string | null) { return value ? new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T00:00:00`)) : "Chưa xác định"; }
