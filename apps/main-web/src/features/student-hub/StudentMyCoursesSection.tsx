"use client";

import Link from "next/link";
import { GraduationCap, ArrowRight, User, Calendar } from "@phosphor-icons/react";
import { StudentEmptyState } from "./StudentEmptyState";

export interface CourseEnrollmentItem {
  id: string;
  courseId: string;
  courseTitle: string;
  skillPair: string;
  teacherName: string;
  progressPercent: number;
  completedSessions: number;
  totalSessions: number;
  status?: "PENDING" | "ACTIVE" | "PAUSED" | "COMPLETED";
  nextSessionText?: string;
  href: string;
}

interface StudentMyCoursesSectionProps {
  courses?: CourseEnrollmentItem[];
  loading?: boolean;
}

export function StudentMyCoursesSection({
  courses = [],
  loading = false,
}: StudentMyCoursesSectionProps) {
  return (
    <section className="mb-8">
      {/* Section Title */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FEF9C3] text-[#1E1B18] flex items-center justify-center font-bold shadow-2xs border border-[#F3E8C4]">
            <GraduationCap size={20} weight="fill" className="text-[#894C5B]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1E1B18] font-sans">Khóa Học Của Tôi</h3>
            <p className="text-xs text-[#857F7A]">Các khóa học bạn đã ghi danh chính thức</p>
          </div>
        </div>

        {courses.length > 0 && (
          <Link
            href="/student/courses"
            className="text-xs font-semibold text-[#894C5B] hover:underline flex items-center gap-1"
          >
            <span>Tất cả khóa học</span>
            <ArrowRight size={12} weight="bold" />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="h-44 rounded-2xl bg-[#FEF9C3]/40 border border-[#F3E8C4] animate-pulse" />
      ) : courses.length === 0 ? (
        /* Empty state when student has no enrolled course */
        <StudentEmptyState
          icon={<GraduationCap size={32} weight="duotone" className="text-[#894C5B]" />}
          title="Bạn chưa tham gia khóa học nào."
          description="Hiện tại tài khoản chưa được gán vào khóa học chính thức. Bạn có thể tìm hiểu thêm danh sách khóa học mở tuyển sinh hoặc liên hệ tư vấn để xếp lớp."
          actionLabel="Khám phá các khóa học"
          actionHref="/#courses"
          compact
        />
      ) : (
        /* Enrolled Courses Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              id={`course-${course.courseId}`}
              className="bg-white rounded-2xl p-6 border border-[#E8E2D5] shadow-2xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between hover:border-[#F3E8C4]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-[#F7E5EA] text-[#894C5B] text-xs font-bold uppercase tracking-wider">
                    {course.skillPair}
                  </span>
                  {course.status ? (
                    <span className="text-xs font-semibold text-[#5C5752]">{course.status === "ACTIVE" ? "Đang học" : course.status === "PENDING" ? "Chờ xác nhận" : course.status === "PAUSED" ? "Bảo lưu" : "Đã hoàn thành"}</span>
                  ) : null}
                </div>

                <h4 className="font-bold text-base text-[#1E1B18] line-clamp-1 font-sans">
                  {course.courseTitle}
                </h4>

                <div className="flex items-center gap-2 text-xs text-[#5C5752]">
                  <User size={14} className="text-[#894C5B]" />
                  <span>Giảng viên: <strong className="font-semibold text-[#1E1B18]">{course.teacherName}</strong></span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#857F7A]">Tiến độ học tập</span>
                    <span className="text-[#894C5B] font-bold">{course.progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#FEF9C3] border border-[#F3E8C4] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#894C5B] transition-all duration-500"
                      style={{ width: `${course.progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#857F7A] text-right">
                    Đã hoàn thành {course.completedSessions}/{course.totalSessions} buổi
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#F3E8C4]/60 flex items-center justify-between gap-3">
                {course.nextSessionText ? (
                  <div className="flex items-center gap-1.5 text-xs text-[#5C5752]">
                    <Calendar size={14} className="text-[#894C5B]" />
                    <span>Lịch kế: <strong className="font-semibold text-[#1E1B18]">{course.nextSessionText}</strong></span>
                  </div>
                ) : (
                  <span className="text-xs text-[#857F7A]">Chưa có lịch buổi kế</span>
                )}

                <Link
                  href={course.href}
                  className="px-4 py-2 rounded-xl bg-[#894C5B] text-white font-bold text-xs hover:bg-[#723c4a] transition-all flex items-center gap-1.5 shadow-2xs shrink-0"
                >
                  <span>Vào khóa học</span>
                  <ArrowRight size={14} weight="bold" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
