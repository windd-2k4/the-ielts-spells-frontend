/**
 * Shared utility for active course navigation in Student Hub.
 * Manages the current active course ID and resolves the direct course workspace URL.
 */

export const STUDENT_LAST_COURSE_STORAGE_KEY = "student_last_course_id";

export interface CourseIdentifiable {
  courseId: string;
  status?: string;
}

export function getActiveCourseId<T extends CourseIdentifiable>(
  enrollments: T[] | undefined | null
): string | null {
  if (!enrollments || enrollments.length === 0) return null;

  if (typeof window !== "undefined") {
    try {
      const storedId = localStorage.getItem(STUDENT_LAST_COURSE_STORAGE_KEY);
      if (storedId) {
        const found = enrollments.find((e) => e.courseId === storedId);
        if (found) return found.courseId;
      }
    } catch {
      // Ignore storage errors in private browsing/sandbox
    }
  }

  const activeEnrollment = enrollments.find((e) => e.status === "ACTIVE");
  return activeEnrollment ? activeEnrollment.courseId : enrollments[0].courseId;
}

export function setActiveCourseId(courseId: string): void {
  if (typeof window === "undefined" || !courseId) return;
  try {
    localStorage.setItem(STUDENT_LAST_COURSE_STORAGE_KEY, courseId);
  } catch {
    // Ignore storage errors
  }
}

export function getStudentCoursesHref<T extends CourseIdentifiable>(
  enrollments: T[] | undefined | null
): string {
  const activeId = getActiveCourseId(enrollments);
  return activeId ? `/student/courses/${activeId}` : "/student/courses";
}
