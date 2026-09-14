"use client";

import Link from "next/link";
import { GraduationCap, ArrowRight, User } from "@phosphor-icons/react";
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
    <section>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-[#FEF9C3] text-[#894C5B]">
            <GraduationCap size={16} weight="bold" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-[#1E1B18] font-sans">Khóa học của tôi</h3>
            <p className="text-[11px] text-[#6F676C]">Các khóa học bạn đã ghi danh chính thức</p>
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
        <div className="h-32 rounded-xl bg-white border border-[#E8E2D5] animate-pulse" />
      ) : courses.length === 0 ? (
        <StudentEmptyState
          icon={<GraduationCap size={24} weight="bold" className="text-[#894C5B]" />}
          title="Bạn chưa đăng ký khóa học nào."
          description="Hiện tại tài khoản chưa có ghi danh chính thức. Bạn có thể tìm hiểu thêm các khóa học Listening + Reading hoặc Speaking + Writing đang mở tuyển sinh."
          actionLabel="Khám phá khóa học"
          actionHref="/#courses"
          compact
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {courses.map((course) => (
            <div
              key={course.id}
              id={`course-${course.courseId}`}
              className="bg-white rounded-xl p-4 border border-[#E8E2D5] shadow-2xs hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-[#F7E5EA] text-[#894C5B] text-[10px] font-bold">
                    {course.skillPair}
                  </span>
                  {course.status && (
                    <span className="text-[11px] font-semibold text-[#6F676C]">
                      {course.status === "ACTIVE" ? "Đang học" : course.status === "PENDING" ? "Chờ duyệt" : course.status === "PAUSED" ? "Bảo lưu" : "Hoàn thành"}
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-xs sm:text-sm text-[#1E1B18] truncate font-sans">
                  {course.courseTitle}
                </h4>

                <div className="flex items-center gap-1.5 text-xs text-[#6F676C]">
                  <User size={13} className="text-[#894C5B]" />
                  <span>GV: <strong className="font-semibold text-[#1E1B18]">{course.teacherName}</strong></span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1 pt-0.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-[#6F676C]">Tiến độ học tập</span>
                    <span className="text-[#894C5B] font-bold">{course.progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#F7F5F4] border border-[#E8E2D5] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#894C5B] transition-all duration-500"
                      style={{ width: `${course.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E8E2D5] flex items-center justify-between gap-2">
                <span className="text-[11px] text-[#6F676C] truncate">
                  {course.nextSessionText ? `Lịch kế: ${course.nextSessionText}` : `${course.completedSessions}/${course.totalSessions} buổi`}
                </span>

                <Link
                  href={course.href}
                  className="px-3 py-1.5 rounded-lg bg-[#894C5B] text-white font-bold text-xs hover:bg-[#753E4B] transition-all flex items-center gap-1 shrink-0 shadow-2xs"
                >
                  <span>Chi tiết</span>
                  <ArrowRight size={12} weight="bold" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

