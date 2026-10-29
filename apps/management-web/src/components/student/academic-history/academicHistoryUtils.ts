import type { Course, Enrollment, EnrollmentStatus, Reservation, Transfer } from "../../../academic-types";

/**
 * Format date string safely (handles YYYY-MM-DD, ISO 8601, and nulls)
 */
export function formatAcademicDate(value: string | null | undefined, fallback = "Chưa xác định"): string {
  if (!value) return fallback;
  try {
    const raw = value.includes("T") ? value : `${value}T00:00:00`;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return fallback;
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  } catch {
    return fallback;
  }
}

/**
 * Format datetime string safely
 */
export function formatAcademicDateTime(value: string | null | undefined, fallback = "Chưa xác định"): string {
  if (!value) return fallback;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return fallback;
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return fallback;
  }
}

/**
 * Human-readable relative time (e.g., "3 ngày trước")
 */
export function formatTimeAgo(value: string | null | undefined): string {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    const diffMs = Date.now() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 30) {
      return formatAcademicDate(value);
    }
    if (diffDay > 0) return `${diffDay} ngày trước`;
    if (diffHour > 0) return `${diffHour} giờ trước`;
    if (diffMin > 0) return `${diffMin} phút trước`;
    return "Vừa xong";
  } catch {
    return "";
  }
}

export type EnrollmentStatusMeta = {
  label: string;
  badgeClass: string;
  dotColor: string;
  description: string;
};

export const ENROLLMENT_STATUS_MAP: Record<EnrollmentStatus, EnrollmentStatusMeta> = {
  ACTIVE: {
    label: "Đang học",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dotColor: "bg-emerald-500",
    description: "Học viên đang tham gia lớp học bình thường.",
  },
  COMPLETED: {
    label: "Đã hoàn thành",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    dotColor: "bg-blue-500",
    description: "Học viên đã kết thúc khóa học và hoàn thành chương trình.",
  },
  PAUSED: {
    label: "Đang bảo lưu",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    dotColor: "bg-amber-500",
    description: "Lớp học đang trong thời gian bảo lưu kết quả.",
  },
  PENDING: {
    label: "Chờ xác nhận",
    badgeClass: "bg-orange-50 text-orange-800 border-orange-200",
    dotColor: "bg-orange-500",
    description: "Lượt ghi danh mới chờ xếp lớp hoặc xác nhận học phí.",
  },
  WITHDRAWN: {
    label: "Đã rút khỏi khóa",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
    dotColor: "bg-rose-500",
    description: "Đã hủy hoặc rút khỏi khóa học.",
  },
};

export type AcademicTimelineEventType =
  | "ENROLLED"
  | "COMPLETED"
  | "RESERVATION_PENDING"
  | "RESERVATION_APPROVED"
  | "RESERVATION_REJECTED"
  | "TRANSFER_PENDING"
  | "TRANSFER_APPROVED"
  | "TRANSFER_REJECTED";

export type AcademicTimelineEvent = {
  id: string;
  type: AcademicTimelineEventType;
  title: string;
  timestamp: string;
  formattedDate: string;
  courseName: string;
  courseCode: string;
  targetCourseName?: string;
  targetCourseCode?: string;
  statusLabel: string;
  statusClass: string;
  reason?: string | null;
  notes?: string | null;
  expiresOn?: string | null;
  sessionsConsumed?: number | null;
  sessionsRemaining?: number | null;
};

/**
 * Combine enrollments, reservations, and transfers into an academic lifecycle timeline.
 */
export function buildAcademicTimeline(
  enrollments: Enrollment[],
  courses: Course[],
  reservations: Reservation[],
  transfers: Transfer[]
): AcademicTimelineEvent[] {
  const events: AcademicTimelineEvent[] = [];
  const courseMap = new Map(courses.map(c => [c.id, c]));

  // 1. Enrollment events
  for (const enr of enrollments) {
    const course = courseMap.get(enr.courseId);
    const courseName = course?.name ?? "Khóa học";
    const courseCode = course?.code ?? "—";
    const dateStr = enr.startedOn || enr.enrolledAt;

    events.push({
      id: `enr-${enr.id}`,
      type: "ENROLLED",
      title: `Ghi danh khóa học: ${courseName}`,
      timestamp: dateStr || new Date().toISOString(),
      formattedDate: formatAcademicDate(dateStr),
      courseName,
      courseCode,
      statusLabel: ENROLLMENT_STATUS_MAP[enr.status]?.label ?? enr.status,
      statusClass: ENROLLMENT_STATUS_MAP[enr.status]?.badgeClass ?? "bg-slate-100 text-slate-700",
      notes: enr.notes,
    });

    // If completed
    if (enr.status === "COMPLETED" && enr.endedOn) {
      events.push({
        id: `comp-${enr.id}`,
        type: "COMPLETED",
        title: `Hoàn thành khóa học: ${courseName}`,
        timestamp: enr.endedOn,
        formattedDate: formatAcademicDate(enr.endedOn),
        courseName,
        courseCode,
        statusLabel: "Hoàn thành",
        statusClass: "bg-blue-50 text-blue-800 border-blue-200",
        notes: enr.attendanceNote || enr.notes,
      });
    }
  }

  // 2. Reservation events
  for (const res of reservations) {
    const enr = enrollments.find(e => e.id === res.enrollmentId);
    const course = enr ? courseMap.get(enr.courseId) : undefined;
    const courseName = course?.name ?? "Khóa học";
    const courseCode = course?.code ?? "—";

    if (res.status === "PENDING") {
      events.push({
        id: `res-pend-${res.id}`,
        type: "RESERVATION_PENDING",
        title: `Yêu cầu bảo lưu: ${courseName}`,
        timestamp: res.requestedAt || new Date().toISOString(),
        formattedDate: formatAcademicDate(res.requestedAt),
        courseName,
        courseCode,
        statusLabel: "Chờ phê duyệt",
        statusClass: "bg-amber-50 text-amber-800 border-amber-200",
        reason: res.reason,
        notes: res.notes,
        expiresOn: res.expiresOn,
        sessionsConsumed: res.sessionsConsumed,
        sessionsRemaining: res.sessionsRemaining,
      });
    } else if (res.status === "APPROVED") {
      events.push({
        id: `res-appr-${res.id}`,
        type: "RESERVATION_APPROVED",
        title: `Đã duyệt bảo lưu: ${courseName}`,
        timestamp: res.approvedAt || res.requestedAt || new Date().toISOString(),
        formattedDate: formatAcademicDate(res.approvedAt || res.requestedAt),
        courseName,
        courseCode,
        statusLabel: "Đã duyệt",
        statusClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
        reason: res.reason,
        notes: res.notes,
        expiresOn: res.expiresOn,
        sessionsRemaining: res.sessionsRemaining,
      });
    } else if (res.status === "REJECTED") {
      events.push({
        id: `res-rej-${res.id}`,
        type: "RESERVATION_REJECTED",
        title: `Từ chối bảo lưu: ${courseName}`,
        timestamp: res.approvedAt || res.requestedAt || new Date().toISOString(),
        formattedDate: formatAcademicDate(res.approvedAt || res.requestedAt),
        courseName,
        courseCode,
        statusLabel: "Đã từ chối",
        statusClass: "bg-rose-50 text-rose-800 border-rose-200",
        reason: res.reason,
        notes: res.notes,
      });
    }
  }

  // 3. Transfer events
  for (const trf of transfers) {
    const srcEnr = enrollments.find(e => e.id === trf.sourceEnrollmentId);
    const srcCourse = srcEnr ? courseMap.get(srcEnr.courseId) : undefined;
    const tgtCourse = courseMap.get(trf.targetCourseId);

    const courseName = srcCourse?.name ?? "Lớp gốc";
    const courseCode = srcCourse?.code ?? "—";
    const targetCourseName = tgtCourse?.name ?? "Lớp đích";
    const targetCourseCode = tgtCourse?.code ?? "—";

    if (trf.status === "PENDING") {
      events.push({
        id: `trf-pend-${trf.id}`,
        type: "TRANSFER_PENDING",
        title: `Yêu cầu chuyển lớp sang ${targetCourseName}`,
        timestamp: trf.requestedAt || new Date().toISOString(),
        formattedDate: formatAcademicDate(trf.requestedAt),
        courseName,
        courseCode,
        targetCourseName,
        targetCourseCode,
        statusLabel: "Chờ phê duyệt",
        statusClass: "bg-amber-50 text-amber-800 border-amber-200",
        reason: trf.reason,
        notes: trf.notes,
      });
    } else if (trf.status === "APPROVED") {
      events.push({
        id: `trf-appr-${trf.id}`,
        type: "TRANSFER_APPROVED",
        title: `Đã chuyển lớp: ${courseCode} → ${targetCourseCode}`,
        timestamp: trf.approvedAt || trf.requestedAt || new Date().toISOString(),
        formattedDate: formatAcademicDate(trf.approvedAt || trf.requestedAt),
        courseName,
        courseCode,
        targetCourseName,
        targetCourseCode,
        statusLabel: "Đã chuyển thành công",
        statusClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
        reason: trf.reason,
        notes: trf.notes,
      });
    } else if (trf.status === "REJECTED") {
      events.push({
        id: `trf-rej-${trf.id}`,
        type: "TRANSFER_REJECTED",
        title: `Từ chối chuyển lớp: ${courseCode} → ${targetCourseCode}`,
        timestamp: trf.approvedAt || trf.requestedAt || new Date().toISOString(),
        formattedDate: formatAcademicDate(trf.approvedAt || trf.requestedAt),
        courseName,
        courseCode,
        targetCourseName,
        targetCourseCode,
        statusLabel: "Đã từ chối",
        statusClass: "bg-rose-50 text-rose-800 border-rose-200",
        reason: trf.reason,
        notes: trf.notes,
      });
    }
  }

  // Sort descending by timestamp
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
