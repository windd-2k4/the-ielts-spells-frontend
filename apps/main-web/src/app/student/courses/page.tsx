"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  StudentMyCoursesSection,
  type CourseEnrollmentItem,
} from "@/features/student-hub/StudentMyCoursesSection";
import { useStudentPortal } from "@/features/student-hub/StudentPortalProvider";
import {
  fetchSystemCourses,
  type DatabaseCourseItem,
} from "@/features/student-hub/studentPortalApi";
import { formatDateTime, skillPairLabel } from "@/features/student-hub/studentPortalViewModel";
import { StudentCourses3DHero } from "@/features/student-hub/courses/StudentCourses3DHero";
import { StudentCoursesCuratedTrack } from "@/features/student-hub/courses/StudentCoursesCuratedTrack";
import { StudentCoursesCatalogSection } from "@/features/student-hub/courses/StudentCoursesCatalogSection";
import { StudentCoursesSpellsPromise } from "@/features/student-hub/courses/StudentCoursesSpellsPromise";
import { StudentCourseDetailModal } from "@/features/student-hub/courses/StudentCourseDetailModal";

export default function StudentCoursesPage() {
  const { data, loading: portalLoading } = useStudentPortal();
  const [systemCourses, setSystemCourses] = useState<DatabaseCourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<DatabaseCourseItem | null>(null);

  // Fetch real courses from system database
  useEffect(() => {
    let isMounted = true;
    async function loadCourses() {
      setLoadingCourses(true);
      try {
        const courses = await fetchSystemCourses();
        if (isMounted) {
          setSystemCourses(courses);
        }
      } catch (err) {
        console.error("Error loading system courses:", err);
      } finally {
        if (isMounted) {
          setLoadingCourses(false);
        }
      }
    }
    loadCourses();
    return () => {
      isMounted = false;
    };
  }, []);

  // Map enrolled courses from student portal DB overview
  const enrolledCourses: CourseEnrollmentItem[] = useMemo(() => {
    return (data?.enrollments ?? []).map((item) => ({
      id: item.enrollmentId,
      courseId: item.courseId,
      courseTitle: `${item.courseCode} · ${item.courseName}`,
      skillPair: skillPairLabel(item.skillPair),
      teacherName: item.primaryTeacherName || "Chưa phân công",
      progressPercent:
        item.totalSessions > 0
          ? Math.min(100, Math.round((item.completedSessions / item.totalSessions) * 100))
          : 0,
      completedSessions: item.completedSessions,
      totalSessions: item.totalSessions,
      nextSessionText: item.nextSessionAt ? formatDateTime(item.nextSessionAt) : undefined,
      status: item.status,
      href: `#course-${item.courseId}`,
    }));
  }, [data?.enrollments]);

  // Set of codes recommended for current student
  const recommendedCodesSet = useMemo(() => {
    return new Set((data?.recommendedCourses ?? []).map((rc) => rc.code));
  }, [data?.recommendedCourses]);

  // Find if selected course has matching enrollment for current student
  const selectedCourseEnrollment = useMemo(() => {
    if (!selectedCourse || !data?.enrollments) return null;
    const match = data.enrollments.find(
      (e) => e.courseCode === selectedCourse.code || e.courseId === selectedCourse.id,
    );
    if (!match) return null;
    return {
      completedSessions: match.completedSessions,
      totalSessions: match.totalSessions,
      primaryTeacherName: match.primaryTeacherName,
      status: match.status,
    };
  }, [selectedCourse, data?.enrollments]);

  const handleSelectCourse = useCallback((course: DatabaseCourseItem) => {
    setSelectedCourse(course);
  }, []);

  return (
    <div className="relative">
      {/* 3D Grimoire Hero (Scroll-driven & Click-to-open with Brand Burgundy / Plum Night Sky) */}
      <StudentCourses3DHero
        targetBand={data?.profile.targetBand}
        enrolledCount={enrolledCourses.length}
        availableCount={systemCourses.length}
      />

      {/* Main Content Area */}
      <div id="courses-catalog" className="space-y-14 pt-2">
        {/* Curated Track Carousel (Sourced 100% from Database) */}
        <StudentCoursesCuratedTrack
          courses={systemCourses}
          recommendedCodes={recommendedCodesSet}
          onSelectCourse={handleSelectCourse}
        />

        {/* My Enrolled Courses Section (from Database) */}
        {(portalLoading || enrolledCourses.length > 0) && (
          <section id="my-courses" className="space-y-4">
            <header className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#894C5B]">
                Ghi danh và học vụ
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#292528]">
                Khóa học của tôi
              </h2>
              <p className="mt-1 text-sm text-[#6F676C]">
                Theo dõi trạng thái ghi danh, tiến độ buổi học và giáo viên được phân công từ hệ thống quản trị.
              </p>
            </header>
            <StudentMyCoursesSection courses={enrolledCourses} loading={portalLoading} />
          </section>
        )}

        {/* Complete System Courses Catalog & Filters */}
        <StudentCoursesCatalogSection
          courses={systemCourses}
          loading={loadingCourses}
          recommendedCourseCodes={recommendedCodesSet}
          onSelectCourse={handleSelectCourse}
        />

        {/* The IELTS Spells Academic Guarantee */}
        <StudentCoursesSpellsPromise />
      </div>

      {/* Real Course Detail Modal */}
      <StudentCourseDetailModal
        isOpen={Boolean(selectedCourse)}
        onClose={() => setSelectedCourse(null)}
        course={selectedCourse}
        enrolledProgress={selectedCourseEnrollment}
      />
    </div>
  );
}
