"use client";

import Link from "next/link";
import {
  GraduationCap,
  ArrowRight,
  User,
  Clock,
  CalendarBlank,
  CheckCircle,
  BookOpen,
} from "@phosphor-icons/react";
import { StudentEmptyState } from "./StudentEmptyState";

export interface CourseEnrollmentItem {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  description?: string | null;
  level?: string | null;
  skillPair: string;
  rawSkillPair?: string;
  targetBand?: number | null;
  teacherName: string;
  progressPercent: number;
  completedSessions: number;
  totalSessions: number;
  startsOn?: string;
  status?: "PENDING" | "ACTIVE" | "PAUSED" | "COMPLETED";
  nextSessionText?: string;
  href: string;
}

interface StudentMyCoursesSectionProps {
  courses?: CourseEnrollmentItem[];
  loading?: boolean;
  onSelectCourse?: (courseId: string) => void;
}

const ENROLLED_SKILL_IMAGES: Record<string, string> = {
  LISTENING_READING:
    "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1200&auto=format&fit=crop",
  SPEAKING_WRITING:
    "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=1200&auto=format&fit=crop",
  DEFAULT:
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1200&auto=format&fit=crop",
};

export function StudentMyCoursesSection({
  courses = [],
  loading = false,
  onSelectCourse,
}: StudentMyCoursesSectionProps) {
  const statusBadge = (status?: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-700/90 text-white text-[10px] font-bold shadow-xs backdrop-blur-xs">
            Đang học
          </span>
        );
      case "PENDING":
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-600/90 text-white text-[10px] font-bold shadow-xs backdrop-blur-xs">
            Chờ xác nhận
          </span>
        );
      case "PAUSED":
        return (
          <span className="px-2.5 py-1 rounded-full bg-stone-600/90 text-white text-[10px] font-bold shadow-xs backdrop-blur-xs">
            Bảo lưu
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-600/90 text-white text-[10px] font-bold shadow-xs backdrop-blur-xs">
            Đã hoàn thành
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 rounded-3xl bg-white border border-[#E8E2D5] animate-pulse" />
          <div className="h-80 rounded-3xl bg-white border border-[#E8E2D5] animate-pulse" />
        </div>
      ) : courses.length === 0 ? (
        /* Empty state */
        <div className="rounded-3xl border border-dashed border-[#DED7DA] bg-white p-8 sm:p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F7E5EA] text-[#894C5B] flex items-center justify-center mx-auto shadow-2xs">
            <GraduationCap size={32} weight="bold" />
          </div>
          <div>
            <h4 className="text-base font-bold text-[#292528]">
              Bạn chưa đăng ký khóa học nào
            </h4>
            <p className="mt-1 text-xs text-[#6F676C] max-w-md mx-auto">
              Hiện tại tài khoản chưa có ghi danh chính thức. Hãy khám phá các chương trình học nổi bật bên dưới để chọn lộ trình bứt phá Band điểm phù hợp nhất với bạn.
            </p>
          </div>
          <a
            href="#curated-courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#894C5B] text-white text-xs font-bold shadow-2xs hover:bg-[#68303d] transition-all"
          >
            <span>Khám phá khóa học nổi bật</span>
            <ArrowRight size={13} weight="bold" />
          </a>
        </div>
      ) : (
        /* Rich Enrolled Course Cards Grid (Matching reference image) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => {
            const imgUrl =
              (course.rawSkillPair && ENROLLED_SKILL_IMAGES[course.rawSkillPair]) ||
              (course.skillPair.includes("Listening")
                ? ENROLLED_SKILL_IMAGES.LISTENING_READING
                : ENROLLED_SKILL_IMAGES.SPEAKING_WRITING);

            return (
              <div
                key={course.id}
                id={`course-${course.courseId}`}
                className="group relative flex flex-col justify-between rounded-3xl overflow-hidden bg-white border border-[#E8E2D5] shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-[#894C5B]"
              >
                {/* Top Image Banner */}
                <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-stone-900">
                  <img
                    src={imgUrl}
                    alt={course.courseTitle}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#894C5B] text-white text-[11px] font-extrabold uppercase tracking-wider shadow-sm">
                      {course.courseCode}
                    </span>

                    {statusBadge(course.status)}
                  </div>

                  {/* Bottom Overlay on Image */}
                  <div className="absolute bottom-3 left-3.5 right-3.5">
                    <span className="text-[11px] font-bold text-[#FDE047] tracking-wider uppercase drop-shadow-xs">
                      {course.targetBand != null
                        ? `MỤC TIÊU BAND ${course.targetBand.toFixed(1)}`
                        : "LỘ TRÌNH ĐÀO TẠO"}
                    </span>
                    <h3 className="mt-0.5 text-base sm:text-lg font-bold text-white line-clamp-1 drop-shadow-sm font-serif">
                      {course.courseTitle}
                    </h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Skill Pair & Level */}
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#894C5B]">{course.skillPair}</span>
                      {course.level && (
                        <span className="text-[#6F676C] font-semibold">
                          Cấp độ {course.level}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {course.description && (
                      <p className="text-xs text-[#6F676C] leading-relaxed line-clamp-2">
                        {course.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="pt-1 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#6F676C] font-medium flex items-center gap-1.5">
                          <CheckCircle size={14} className="text-[#894C5B]" weight="fill" />
                          <span>Tiến độ học tập:</span>
                        </span>
                        <strong className="text-[#894C5B]">
                          {course.completedSessions}/{course.totalSessions} buổi ({course.progressPercent}%)
                        </strong>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#F5F2EB] border border-[#E8E2D5] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#894C5B] to-[#A86475] transition-all duration-500"
                          style={{ width: `${course.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Meta details */}
                  <div className="pt-3 border-t border-[#F1ECE4] space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs text-[#554B50]">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-[#894C5B]" />
                        <span>{course.totalSessions} buổi học</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <CalendarBlank size={14} className="text-[#894C5B]" />
                        <span>
                          {course.startsOn
                            ? new Date(course.startsOn).toLocaleDateString("vi-VN")
                            : "Lịch đang cập nhật"}
                        </span>
                      </div>

                      {course.teacherName && (
                        <div className="flex items-center gap-1.5 col-span-2 text-xs text-[#6F676C]">
                          <User size={14} className="text-[#894C5B]" />
                          <span>
                            Giảng viên: <strong className="text-[#292528]">{course.teacherName}</strong>
                          </span>
                        </div>
                      )}

                      {course.nextSessionText && (
                        <div className="flex items-center gap-1.5 col-span-2 text-xs text-amber-900 bg-amber-50/70 p-2 rounded-xl border border-amber-200/60 font-medium">
                          <CalendarBlank size={14} className="text-amber-700 shrink-0" />
                          <span>Buổi kế tiếp: {course.nextSessionText}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Button (Matches image design) */}
                    <div className="pt-2">
                      <Link
                        href={`/student/courses/${course.courseId}`}
                        onClick={(e) => {
                          if (onSelectCourse) {
                            e.preventDefault();
                            onSelectCourse(course.courseId);
                          }
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#894C5B] text-white text-xs font-bold shadow-2xs hover:bg-[#68303d] active:scale-98 transition-all"
                      >
                        <span>Xem chi tiết khóa học</span>
                        <ArrowRight size={13} weight="bold" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
