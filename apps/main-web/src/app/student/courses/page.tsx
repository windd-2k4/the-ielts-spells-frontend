"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  StudentMyCoursesSection,
  type CourseEnrollmentItem,
} from "@/features/student-hub/StudentMyCoursesSection";
import { useStudentPortal } from "@/features/student-hub/StudentPortalProvider";
import {
  fetchStudentCourses,
  type StudentCourseItem,
} from "@/features/student-hub/studentPortalApi";
import { formatDateTime, skillPairLabel, studentPortalErrorMessage } from "@/features/student-hub/studentPortalViewModel";
import { StudentCourses3DHero } from "@/features/student-hub/courses/StudentCourses3DHero";
import { StudentCoursesCuratedTrack } from "@/features/student-hub/courses/StudentCoursesCuratedTrack";
import { ArrowClockwise, GraduationCap, WarningCircle } from "@phosphor-icons/react";

export default function StudentCoursesPage() {
  const router = useRouter();
  const { data, loading: portalLoading } = useStudentPortal();
  const [systemCourses, setSystemCourses] = useState<StudentCourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    setLoadingCourses(true);
    setCoursesError(null);
    try {
      setSystemCourses(await fetchStudentCourses());
    } catch (error) {
      setCoursesError(studentPortalErrorMessage(error, "Không thể tải danh sách khóa học. Vui lòng thử lại."));
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  // Map enrolled courses from student portal DB overview
  const enrolledCourses: CourseEnrollmentItem[] = useMemo(() => {
    return (data?.enrollments ?? []).map((item) => ({
      id: item.enrollmentId,
      courseId: item.courseId,
      courseCode: item.courseCode,
      courseTitle: item.courseName,
      description: item.description,
      level: item.level,
      skillPair: skillPairLabel(item.skillPair),
      rawSkillPair: item.skillPair,
      targetBand: item.courseTargetBand,
      teacherName: item.primaryTeacherName || "Chưa phân công",
      progressPercent:
        item.totalSessions > 0
          ? Math.min(100, Math.round((item.completedSessions / item.totalSessions) * 100))
          : 0,
      completedSessions: item.completedSessions,
      totalSessions: item.totalSessions,
      startsOn: item.startsOn,
      nextSessionText: item.nextSessionAt ? formatDateTime(item.nextSessionAt) : undefined,
      status: item.status,
      href: `#course-${item.courseId}`,
    }));
  }, [data?.enrollments]);

  // Set of enrolled course IDs and codes to filter out from suggestions
  const enrolledCourseIds = useMemo(() => {
    return new Set((data?.enrollments ?? []).map((e) => e.courseId));
  }, [data?.enrollments]);

  const enrolledCourseCodes = useMemo(() => {
    return new Set((data?.enrollments ?? []).map((e) => e.courseCode));
  }, [data?.enrollments]);

  // Only suggest courses that the student has NOT enrolled in yet
  const unenrolledCourses: StudentCourseItem[] = useMemo(() => {
    return systemCourses.filter(
      (course) =>
        !enrolledCourseIds.has(course.id) &&
        !enrolledCourseCodes.has(course.code)
    );
  }, [systemCourses, enrolledCourseIds, enrolledCourseCodes]);

  // Set of codes recommended for current student
  const recommendedCodesSet = useMemo(() => {
    return new Set((data?.recommendedCourses ?? []).map((rc) => rc.code));
  }, [data?.recommendedCourses]);

  const handleSelectCourse = useCallback((course: StudentCourseItem) => {
    router.push(`/student/courses/${course.id}`);
  }, [router]);

  const handleSelectEnrolledCourseId = useCallback(
    (courseId: string) => {
      router.push(`/student/courses/${courseId}`);
    },
    [router],
  );

  return (
    <div className="relative">
      {/* 3D Grimoire Hero (Scroll-driven & Click-to-open with Brand Burgundy / Plum Night Sky) */}
      <StudentCourses3DHero
        targetBand={data?.profile.targetBand}
        enrolledCount={enrolledCourses.length}
        availableCount={unenrolledCourses.length}
      />

      {/* Main Content Area */}
      <div id="courses-catalog" className="space-y-16 pt-2">
        {coursesError && (
          <div role="alert" className="flex items-center justify-between gap-4 rounded-2xl border border-[#EAC2CD] bg-[#FFF7F9] p-4 text-sm text-[#6F303E]">
            <span className="flex items-center gap-2"><WarningCircle size={20} weight="fill" />{coursesError}</span>
            <button type="button" disabled={loadingCourses} onClick={() => void loadCourses()} className="inline-flex shrink-0 items-center gap-2 font-bold text-[#894C5B]">
              <ArrowClockwise size={16} />{loadingCourses ? "Đang tải" : "Thử lại"}
            </button>
          </div>
        )}
        {/* SECTION 1: KHÓA HỌC CỦA TÔI */}
        <section id="my-courses" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F7E5EA] border border-[#EAC2CD] text-[#894C5B] text-xs font-bold uppercase tracking-wider mb-2">
                <GraduationCap size={14} weight="fill" className="text-[#894C5B]" />
                <span>Ghi danh & Học vụ</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1B18]">
                Khóa Học Của Tôi
              </h2>
              <p className="mt-1 text-sm text-[#6F676C]">
                Theo dõi tiến độ buổi học, lịch học sắp tới và giáo viên được phân công chính thức từ hệ thống.
              </p>
            </div>
          </div>

          <StudentMyCoursesSection
            courses={enrolledCourses}
            loading={portalLoading}
            onSelectCourse={handleSelectEnrolledCourseId}
          />
        </section>

        {/* SECTION 2: KHÓA HỌC NỔI BẬT TRONG HỆ THỐNG (Chỉ hiển thị các khóa học chưa tham gia) */}
        {(!coursesError || systemCourses.length > 0) && (
          <div id="curated-courses">
            <StudentCoursesCuratedTrack
              courses={unenrolledCourses}
              recommendedCodes={recommendedCodesSet}
              onSelectCourse={handleSelectCourse}
            />
          </div>
        )}
      </div>
    </div>
  );
}
