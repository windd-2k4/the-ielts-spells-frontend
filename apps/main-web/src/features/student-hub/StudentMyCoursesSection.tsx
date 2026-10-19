"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarBlank,
  CheckCircle,
  Clock,
  GraduationCap,
  Headphones,
  Microphone,
  Target,
  User,
} from "@phosphor-icons/react";
import { CourseCoverMediaImage } from "./courses/CourseCoverMediaImage";

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
  coverImageUrl?: string | null;
  coverImageAltText?: string | null;
}

interface StudentMyCoursesSectionProps {
  courses?: CourseEnrollmentItem[];
  loading?: boolean;
  onSelectCourse?: (courseId: string) => void;
  compact?: boolean;
}

const statusMeta = {
  ACTIVE: { label: "Đang học", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  PENDING: { label: "Chờ xác nhận", className: "bg-amber-50 text-amber-800 border-amber-200" },
  PAUSED: { label: "Bảo lưu", className: "bg-stone-100 text-stone-700 border-stone-200" },
  COMPLETED: { label: "Đã hoàn thành", className: "bg-sky-50 text-sky-700 border-sky-200" },
} as const;

export function StudentMyCoursesSection({
  courses = [],
  loading = false,
  onSelectCourse,
  compact = false,
}: StudentMyCoursesSectionProps) {
  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Đang tải khóa học">
        {[0, 1].map((item) => (
          <div key={item} className={`${compact ? "min-h-[280px]" : "min-h-[300px]"} animate-pulse rounded-[22px] border border-[#E8E0E2] bg-[#F7F4F2]`} />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="rounded-[22px] border border-dashed border-[#DCCFD3] bg-[#FCFAF9] px-6 py-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F3E4E8] text-[#894C5B]">
          <GraduationCap size={26} weight="duotone" />
        </div>
        <h3 className="mt-4 text-base font-bold text-[#292326]">Bạn chưa có khóa học đang theo học</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6F676C]">
          Chọn một chương trình phù hợp ở bên dưới để bắt đầu lộ trình IELTS của bạn.
        </p>
        <a href="#curated-courses" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#894C5B] hover:text-[#6F303E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#894C5B]">
          Xem các khóa học đang mở <ArrowRight size={15} weight="bold" />
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {courses.map((course) => {
        const status = course.status ? statusMeta[course.status] : null;
        const progress = Math.min(100, Math.max(0, course.progressPercent));
        const isSpeakingWriting = course.rawSkillPair === "SPEAKING_WRITING" || course.skillPair.toLowerCase().includes("speaking");

        return (
          <article
            key={course.id}
            id={`course-${course.courseId}`}
            className="group flex flex-col overflow-hidden rounded-[22px] border border-[#E6CDD4] bg-white shadow-[0_8px_24px_rgba(82,49,59,.06)] transition-all duration-200 hover:border-[#D4B0BA] hover:shadow-[0_14px_32px_rgba(94,56,67,.1)] sm:flex-row"
          >
            {/* Visual Cover Panel */}
            <div className={`relative shrink-0 overflow-hidden bg-[#FDF2F4] ${compact ? "h-44 sm:h-auto sm:w-[210px] md:w-[230px]" : "h-52 sm:h-auto sm:w-[260px] md:w-[280px]"}`}>
              <CourseCoverMediaImage
                coverImageUrl={course.coverImageUrl}
                coverImageAltText={course.coverImageAltText}
                courseName={course.courseTitle}
                skillPair={course.rawSkillPair || course.skillPair}
                className="h-full w-full"
                imageClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" aria-hidden="true" />

              {/* Badges on Cover */}
              <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                <span className="rounded-lg border border-white/60 bg-white/95 px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#8F304A] shadow-xs backdrop-blur-xs">
                  {course.courseCode}
                </span>
                {status ? (
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold shadow-xs backdrop-blur-xs ${status.className}`}>
                    {course.status === "ACTIVE" ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> : null}
                    {status.label}
                  </span>
                ) : null}
              </div>

              {/* Bottom skill chip on cover */}
              <div className="absolute inset-x-0 bottom-0 p-3">
                <span className="inline-flex items-center gap-1 rounded-lg border border-white/60 bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#894C5B] shadow-xs backdrop-blur-xs">
                  {isSpeakingWriting ? (
                    <Microphone size={13} weight="bold" />
                  ) : (
                    <Headphones size={13} weight="bold" />
                  )}
                  {course.skillPair}
                </span>
              </div>
            </div>

            {/* Information & Action Cockpit */}
            <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
              <div>
                {/* Header Info */}
                <div className="flex flex-wrap items-center gap-2">
                  {course.level ? (
                    <span className="rounded-md bg-[#F4EFF1] px-2 py-0.5 text-[11px] font-semibold text-[#6F676C]">
                      Cấp độ {course.level}
                    </span>
                  ) : null}
                  {course.targetBand != null ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#FDF0F3] px-2 py-0.5 text-[11px] font-bold text-[#8F304A]">
                      <Target size={12} weight="bold" /> Band {course.targetBand.toFixed(1)}
                    </span>
                  ) : null}
                </div>

                <h3 className="mt-2 font-display text-lg font-extrabold leading-snug tracking-[-0.025em] text-[#211C1E] transition-colors group-hover:text-[#9B465D] sm:text-xl line-clamp-2">
                  {course.courseTitle}
                </h3>

                {/* Progress bar */}
                <div className="mt-3.5 rounded-xl border border-[#F0E6E8] bg-[#FDF9FA] p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-bold text-[#51494C]">
                      <CheckCircle size={15} weight="fill" className="text-[#9B465D]" />
                      Tiến độ học tập
                    </span>
                    <span className="text-right">
                      <strong className="text-sm font-extrabold tabular-nums text-[#963E58]">{progress}%</strong>
                      <span className="ml-1 text-[11px] font-medium text-[#8A7D81]">({course.completedSessions}/{course.totalSessions} buổi)</span>
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#EADDE1]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#8F304A] to-[#C85F78] transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* 3 Stats Grid */}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="flex flex-col justify-between rounded-xl border border-[#EFE7E9] bg-[#FAF5F6] p-2.5">
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-[#7A6F73]">
                      <Clock size={13} className="shrink-0 text-[#9B465D]" /> Buổi học
                    </span>
                    <strong className="mt-1 text-xs font-extrabold text-[#292326] sm:text-[13px]">
                      {course.totalSessions} buổi
                    </strong>
                  </div>

                  <div className="flex flex-col justify-between rounded-xl border border-[#EFE7E9] bg-[#FAF5F6] p-2.5">
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-[#7A6F73]">
                      <CalendarBlank size={13} className="shrink-0 text-[#9B465D]" /> Buổi tiếp
                    </span>
                    <strong className="mt-1 truncate text-xs font-extrabold text-[#8F304A] sm:text-[13px]" title={course.nextSessionText || "Đang cập nhật"}>
                      {course.nextSessionText || "Đang cập nhật"}
                    </strong>
                  </div>

                  <div className="flex flex-col justify-between rounded-xl border border-[#EFE7E9] bg-[#FAF5F6] p-2.5">
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-[#7A6F73]">
                      <User size={13} className="shrink-0 text-[#9B465D]" /> Giảng viên
                    </span>
                    <strong className="mt-1 truncate text-xs font-extrabold text-[#292326] sm:text-[13px]" title={course.teacherName || "Chưa phân công"}>
                      {course.teacherName || "Chưa phân công"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 flex items-center justify-end pt-1">
                <Link
                  href={`/student/courses/${course.courseId}`}
                  onClick={(event) => {
                    if (onSelectCourse) {
                      event.preventDefault();
                      onSelectCourse(course.courseId);
                    }
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#9B465D] px-6 py-2.5 text-xs font-bold text-white shadow-[0_6px_16px_rgba(155,70,93,.22)] transition-all duration-200 hover:bg-[#84384D] hover:shadow-[0_8px_20px_rgba(155,70,93,.3)] active:translate-y-px sm:w-auto sm:text-sm"
                >
                  Tiếp tục học <ArrowRight size={15} weight="bold" />
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
