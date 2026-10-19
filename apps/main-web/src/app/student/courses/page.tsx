"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
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
import { StudentCoursesCuratedTrack } from "@/features/student-hub/courses/StudentCoursesCuratedTrack";
import { ArrowClockwise, BookOpenText, CaretDown, CaretUp, Compass, GraduationCap, Sparkle, Target, WarningCircle } from "@phosphor-icons/react";

export default function StudentCoursesPage() {
  const router = useRouter();
  const { data, loading: portalLoading } = useStudentPortal();
  const [systemCourses, setSystemCourses] = useState<StudentCourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [showAllCourses, setShowAllCourses] = useState(false);

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
      coverImageUrl: item.coverImageUrl,
      coverImageAltText: item.coverImageAltText,
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

  const visibleCourses = showAllCourses ? unenrolledCourses : unenrolledCourses.slice(0, 2);

  return (
    <main id="courses-catalog" className="space-y-5 pb-10">
      <header className="relative overflow-hidden rounded-[20px] border border-[#E8D8DC] bg-[#FBF3F5] px-5 py-3 sm:px-6 lg:py-3.5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_15%,rgba(255,255,255,.96),transparent_28%),radial-gradient(circle_at_8%_100%,rgba(238,208,216,.42),transparent_34%)]" aria-hidden="true" />
        <div className="relative grid items-center gap-3 lg:grid-cols-[minmax(0,1.08fr)_minmax(220px,.62fr)_minmax(330px,.9fr)]">
          <div>
            <p className="text-[10px] font-bold tracking-[0.15em] text-[#894C5B]">KHÔNG GIAN KHÓA HỌC</p>
            <h1 className="mt-1.5 max-w-xl text-balance font-display text-2xl font-extrabold leading-[1.04] tracking-[-0.04em] text-[#211C1E] sm:text-[27px]">
              Học đúng lộ trình,<br />tiến gần hơn tới <span className="text-[#9B465D]">band mục tiêu.</span>
            </h1>
            <p className="mt-2 max-w-xl text-[11px] leading-4 text-[#756B70]">
              Xem tiến độ lớp đang học hoặc khám phá chương trình phù hợp với mục tiêu IELTS của bạn.
            </p>
          </div>

          <div className="relative hidden h-24 overflow-hidden rounded-[16px] lg:block">
            <Image src="/images/courses-learning-hero.png" alt="Học viên luyện thi IELTS trên máy tính" fill priority className="object-cover object-center" sizes="(min-width: 1024px) 28vw, 0px" />
          </div>

          <dl className="grid grid-cols-3 divide-x divide-[#E4D5D9] rounded-[16px] border border-white/90 bg-white/80 px-1 py-2.5 shadow-[0_8px_20px_rgba(87,53,63,.06)] backdrop-blur-sm">
            <div className="px-3">
              <dt className="flex items-center gap-1 text-[10px] font-semibold text-[#756B70]"><GraduationCap size={14} className="text-[#9B465D]" />Đang học</dt>
              <dd className="mt-1 text-xl font-extrabold tabular-nums text-[#8F304A]">{enrolledCourses.length}</dd>
              <span className="text-[9px] text-[#847A7E]">khóa học</span>
            </div>
            <div className="px-3">
              <dt className="flex items-center gap-1 text-[10px] font-semibold text-[#756B70]"><Compass size={14} className="text-[#9B465D]" />Có thể chọn</dt>
              <dd className="mt-1 text-xl font-extrabold tabular-nums text-[#8F304A]">{loadingCourses ? "-" : unenrolledCourses.length}</dd>
              <span className="text-[9px] text-[#847A7E]">khóa học</span>
            </div>
            <div className="px-3">
              <dt className="flex items-center gap-1 text-[10px] font-semibold text-[#756B70]"><Target size={14} className="text-[#9B465D]" />Mục tiêu</dt>
              <dd className="mt-1 text-xl font-extrabold tabular-nums text-[#8F304A]">{data?.profile.targetBand?.toFixed(1) ?? "-"}</dd>
              <span className="text-[9px] text-[#847A7E]">IELTS Overall</span>
            </div>
          </dl>
        </div>
      </header>

      <div>
        {coursesError && (
          <div role="alert" className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-[#EAC2CD] bg-[#FFF7F9] p-4 text-sm text-[#6F303E]">
            <span className="flex items-center gap-2"><WarningCircle size={20} weight="fill" />{coursesError}</span>
            <button type="button" disabled={loadingCourses} onClick={() => void loadCourses()} className="inline-flex shrink-0 items-center gap-2 font-bold text-[#894C5B]">
              <ArrowClockwise size={16} />{loadingCourses ? "Đang tải" : "Thử lại"}
            </button>
          </div>
        )}
        <div className="grid gap-7 lg:gap-8 xl:grid-cols-2 items-start">
          <section id="my-courses" className="min-w-0 space-y-4">
            <div className="flex min-h-12 items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#9B465D] text-white shadow-[0_4px_14px_rgba(155,70,93,.2)]">
                  <BookOpenText size={20} weight="duotone" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-extrabold tracking-[-0.025em] text-[#211C1E] sm:text-[23px]">
                    Khóa học <span className="text-[#9B465D]">của tôi</span>
                  </h2>
                  <p className="mt-0.5 text-xs leading-5 text-[#756B70] sm:text-[13px]">
                    Tiếp tục khóa học, xem lịch gần nhất và theo dõi tiến độ để hoàn thành mục tiêu.
                  </p>
                </div>
              </div>
              {!portalLoading && enrolledCourses.length > 1 ? (
                <span className="shrink-0 rounded-full border border-[#F0E6E9] bg-[#FAF5F7] px-2.5 py-1 text-xs font-bold text-[#8F304A]">
                  {enrolledCourses.length} khóa học
                </span>
              ) : null}
            </div>

            <StudentMyCoursesSection
              courses={enrolledCourses}
              loading={portalLoading}
              onSelectCourse={handleSelectEnrolledCourseId}
              compact
            />
          </section>

          {(!coursesError || systemCourses.length > 0) && (
            <section id="curated-courses" className="min-w-0 space-y-4 xl:border-l xl:border-[#ECE4E7] xl:pl-8">
              <div className="flex min-h-12 items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#9B465D] text-white shadow-[0_4px_14px_rgba(155,70,93,.2)]">
                    <Sparkle size={20} weight="fill" />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-extrabold tracking-[-0.025em] text-[#211C1E] sm:text-[23px]">
                      Danh sách <span className="text-[#9B465D]">khóa học</span>
                    </h2>
                    <p className="mt-0.5 text-xs leading-5 text-[#756B70] sm:text-[13px]">
                      Khám phá các khóa học phù hợp để tiếp tục bứt phá mục tiêu IELTS của bạn.
                    </p>
                  </div>
                </div>
                {unenrolledCourses.length > 2 ? (
                  <button
                    type="button"
                    onClick={() => setShowAllCourses((current) => !current)}
                    className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#DCC8CD] bg-white px-3.5 text-xs font-bold text-[#894C5B] transition hover:border-[#B98290] hover:bg-[#FBF3F5] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#894C5B] sm:text-sm"
                    aria-expanded={showAllCourses}
                  >
                    {showAllCourses ? "Thu gọn" : `Xem tất cả (${unenrolledCourses.length})`}
                    {showAllCourses ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
                  </button>
                ) : null}
              </div>
              <StudentCoursesCuratedTrack
                courses={visibleCourses}
                recommendedCodes={recommendedCodesSet}
                onSelectCourse={handleSelectCourse}
                loading={loadingCourses}
                variant="compact-grid"
              />
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
