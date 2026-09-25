import { ApiClientError } from "@ielts/api-client";
import type {
  StudentPortalEnrollment,
  StudentPortalOverview,
} from "./studentPortalApi";
import type { RoadmapMilestoneItem } from "./StudentRoadmapMilestones";

export function studentPortalErrorMessage(error: unknown, fallback = "Không thể tải dữ liệu học tập. Vui lòng thử lại.") {
  if (error instanceof ApiClientError) {
    if (error.status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (error.status === 403) return "Tài khoản chưa có quyền truy cập dữ liệu này.";
    return error.message;
  }
  return fallback;
}

export function formatBand(value: number | null) {
  return value == null ? "Chưa xác định" : value.toFixed(1);
}

export function skillPairLabel(value: StudentPortalEnrollment["skillPair"]) {
  return value === "LISTENING_READING" ? "Listening & Reading" : "Speaking & Writing";
}

export function enrollmentStatusLabel(value: StudentPortalEnrollment["status"]) {
  const labels: Record<StudentPortalEnrollment["status"], string> = {
    ACTIVE: "Đang học",
    PENDING: "Chờ xác nhận",
    PAUSED: "Bảo lưu",
    COMPLETED: "Đã hoàn thành",
  };
  return labels[value];
}

export function formatDateTime(value: string | null, includeTime = true) {
  if (!value) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

export function buildStudentRoadmap(data: StudentPortalOverview): RoadmapMilestoneItem[] {
  const hasTarget = data.profile.targetBand != null;
  const hasAssessment = data.profile.currentBand != null || data.metrics.completedAttempts > 0;
  const activeEnrollment = data.enrollments.find((item) => item.status === "ACTIVE");
  const pendingEnrollment = data.enrollments.find((item) => item.status === "PENDING");

  return [
    {
      id: "target",
      title: "Đặt mục tiêu",
      status: hasTarget ? "completed" : "current",
      description: hasTarget ? `IELTS ${formatBand(data.profile.targetBand)}` : "Chọn Band mong muốn",
    },
    {
      id: "assessment",
      title: "Đánh giá đầu vào",
      status: hasAssessment ? "completed" : hasTarget ? "current" : "upcoming",
      description: data.profile.currentBand != null
        ? `Band hiện tại ${formatBand(data.profile.currentBand)}`
        : data.metrics.completedAttempts > 0
          ? "Đã có dữ liệu Reading"
          : "Cần bài đánh giá năng lực",
    },
    {
      id: "course",
      title: activeEnrollment?.courseName ?? pendingEnrollment?.courseName ?? "Chọn khóa phù hợp",
      status: activeEnrollment ? "current" : hasAssessment ? "current" : "upcoming",
      description: activeEnrollment
        ? `Đang học ${skillPairLabel(activeEnrollment.skillPair)}`
        : pendingEnrollment
          ? "Đang chờ trung tâm xác nhận"
          : "Dựa trên Band và kỹ năng cần cải thiện",
    },
    {
      id: "practice",
      title: "Luyện tập đều đặn",
      status: activeEnrollment && data.metrics.completedAttempts > 0 ? "current" : "upcoming",
      description: data.metrics.currentStreakDays > 0
        ? `Chuỗi học ${data.metrics.currentStreakDays} ngày`
        : "Hoàn thành bài được giao",
    },
    {
      id: "goal",
      title: hasTarget ? `Mục tiêu IELTS ${formatBand(data.profile.targetBand)}` : "Hoàn thành mục tiêu",
      status: "upcoming",
      description: "Đánh giá lại và điều chỉnh lộ trình",
    },
  ];
}
