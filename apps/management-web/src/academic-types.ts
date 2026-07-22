export type Page<T> = { content: T[]; totalElements: number; totalPages: number; number: number; size: number };

export type Course = { id: string; code: string; name: string; description: string | null; level: string | null; targetBand: number | null; totalSessions: number | null; tuitionAmount: number | null; isPublic: boolean; isActive: boolean; createdAt: string; updatedAt: string };
export type CourseForm = { code: string; name: string; description: string; level: string; targetBand: string; totalSessions: string; tuitionAmount: string; isPublic: boolean; isActive: boolean };
export type ClassStatus = "PLANNED" | "ENROLLING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type AcademicClass = { id: string; courseId: string; code: string; name: string; capacity: number; startsOn: string; endsOn: string | null; status: ClassStatus; defaultZoomUrl: string | null; createdAt: string; updatedAt: string };
export type ClassForm = { courseId: string; code: string; name: string; capacity: string; startsOn: string; endsOn: string; status: ClassStatus; defaultZoomUrl: string };

export type EnrollmentStatus = "PENDING" | "ACTIVE" | "PAUSED" | "COMPLETED" | "WITHDRAWN";
export type Enrollment = { id: string; classId: string; studentId: string; status: EnrollmentStatus; enrolledAt: string; startedOn: string | null; endedOn: string | null; notes: string | null };
export type StudentSummary = { id: string; studentCode: string; fullName: string; email: string | null; phone: string | null; avatarPath: string | null; currentBand: number | null; targetBand: number | null };
export type StudentDetail = StudentSummary & { dateOfBirth: string | null; address: string | null; emergencyContact: Record<string, unknown>; joinedAt: string; notes: string | null; active: boolean; createdAt: string; updatedAt: string };
export type Reservation = { id: string; enrollmentId: string; status: string; reason: string; sessionsConsumed: number | null; sessionsRemaining: number | null; creditAmount: number | null; expiresOn: string | null; targetClassId: string | null; requestedAt: string; approvedAt: string | null; notes: string | null };
export type Transfer = { id: string; sourceEnrollmentId: string; targetClassId: string; targetEnrollmentId: string | null; reservationId: string | null; status: string; reason: string; feeAdjustment: number | null; requestedAt: string; approvedAt: string | null; notes: string | null };

export const courseEmpty: CourseForm = { code: "", name: "", description: "", level: "", targetBand: "", totalSessions: "", tuitionAmount: "", isPublic: true, isActive: true };
export const classEmpty: ClassForm = { courseId: "", code: "", name: "", capacity: "20", startsOn: "", endsOn: "", status: "PLANNED", defaultZoomUrl: "" };
export const classStatusLabel: Record<ClassStatus, string> = { PLANNED: "Lên kế hoạch", ENROLLING: "Đang tuyển sinh", IN_PROGRESS: "Đang học", COMPLETED: "Đã hoàn thành", CANCELLED: "Đã hủy" };
export const enrollmentStatusLabel: Record<EnrollmentStatus, string> = { PENDING: "Chờ xác nhận", ACTIVE: "Đang học", PAUSED: "Đang bảo lưu", COMPLETED: "Hoàn thành", WITHDRAWN: "Đã rút" };
export function money(value: number | null) { return value == null ? "Chưa đặt" : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value); }
export function date(value: string | null) { return value ? new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T00:00:00`)) : "Chưa xác định"; }
