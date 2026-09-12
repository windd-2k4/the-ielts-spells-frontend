"use client";

import { StudentCourseRecommendations } from "@/features/student-hub/StudentCourseRecommendations";
import { StudentMyCoursesSection, type CourseEnrollmentItem } from "@/features/student-hub/StudentMyCoursesSection";
import { useStudentPortal } from "@/features/student-hub/StudentPortalProvider";
import { formatDateTime, skillPairLabel } from "@/features/student-hub/studentPortalViewModel";

export default function StudentCoursesPage() {
  const { data, loading } = useStudentPortal();
  const courses: CourseEnrollmentItem[] = (data?.enrollments ?? []).map((item) => ({
    id: item.enrollmentId,
    courseId: item.courseId,
    courseTitle: `${item.courseCode} · ${item.courseName}`,
    skillPair: skillPairLabel(item.skillPair),
    teacherName: item.primaryTeacherName || "Chưa phân công",
    progressPercent: item.totalSessions > 0 ? Math.min(100, Math.round((item.completedSessions / item.totalSessions) * 100)) : 0,
    completedSessions: item.completedSessions,
    totalSessions: item.totalSessions,
    nextSessionText: item.nextSessionAt ? formatDateTime(item.nextSessionAt) : undefined,
    status: item.status,
    href: `#course-${item.courseId}`,
  }));

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#894C5B]">Ghi danh và học vụ</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#292528]">Khóa học của tôi</h2>
        <p className="mt-2 text-sm leading-6 text-[#6F676C]">Theo dõi trạng thái ghi danh, tiến độ buổi học và giáo viên được phân công từ hệ thống quản trị.</p>
      </header>
      <StudentMyCoursesSection courses={courses} loading={loading} />
      {data && <StudentCourseRecommendations courses={data.recommendedCourses} hasTarget={data.profile.targetBand != null} />}
    </div>
  );
}
