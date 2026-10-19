"use client";

import {
  ArrowRight,
  CalendarBlank,
  Clock,
  Compass,
  Headphones,
  Microphone,
  Sparkle,
  Target,
} from "@phosphor-icons/react";
import type { StudentCourseItem } from "../studentPortalApi";
import { CourseCoverMediaImage } from "./CourseCoverMediaImage";

interface StudentCoursesCuratedTrackProps {
  courses: StudentCourseItem[];
  recommendedCodes?: Set<string>;
  onSelectCourse: (course: StudentCourseItem) => void;
  loading?: boolean;
  variant?: "grid" | "compact-grid";
}

function formatTuition(amount: number | null) {
  return amount == null
    ? "Liên hệ tư vấn"
    : new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(amount);
}

export function StudentCoursesCuratedTrack({
  courses,
  recommendedCodes = new Set(),
  onSelectCourse,
  loading = false,
  variant = "grid",
}: StudentCoursesCuratedTrackProps) {
  if (loading) {
    return (
      <div className={variant === "compact-grid" ? "grid gap-3.5 sm:grid-cols-2" : "grid gap-5 md:grid-cols-2 xl:grid-cols-3"} aria-busy="true" aria-label="Đang tải chương trình">
        {(variant === "compact-grid" ? [0, 1] : [0, 1, 2]).map((item) => (
          <div key={item} className={`${variant === "compact-grid" ? "min-h-[290px]" : "min-h-[360px]"} animate-pulse rounded-[20px] border border-[#E8E0E2] bg-[#F7F4F2]`} />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="rounded-[22px] border border-dashed border-[#DCCFD3] bg-[#FCFAF9] px-6 py-9 text-center">
        <Compass size={28} weight="duotone" className="mx-auto text-[#894C5B]" />
        <h3 className="mt-3 text-base font-bold text-[#292326]">Bạn đã tham gia tất cả khóa học hiện có</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6F676C]">
          Các chương trình mới sẽ xuất hiện tại đây khi trung tâm mở thêm lộ trình phù hợp.
        </p>
      </div>
    );
  }

  if (variant === "compact-grid") {
    return (
      <div className="grid gap-3.5 sm:grid-cols-2">
        {courses.map((course) => {
          const recommended = recommendedCodes.has(course.code);
          const isSpeakingWriting =
            course.skillPair === "SPEAKING_WRITING" ||
            course.skillPair.toLowerCase().includes("speaking");
          const skillLabel = isSpeakingWriting
            ? "Speaking & Writing"
            : "Listening & Reading";

          return (
            <button
              key={course.id}
              type="button"
              onClick={() => onSelectCourse(course)}
              className="group flex min-h-[290px] w-full flex-col overflow-hidden rounded-[20px] border border-[#E6DDDF] bg-white text-left shadow-[0_4px_18px_rgba(55,39,45,.04)] transition-all duration-200 hover:-translate-y-1 hover:border-[#D4B0BA] hover:shadow-[0_12px_28px_rgba(94,56,67,.09)] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#894C5B]"
              aria-label={`Xem khóa học ${course.name}`}
            >
              {/* Cover Image */}
              <div className="relative h-32 w-full shrink-0 overflow-hidden bg-[#FDF2F4] sm:h-36">
                <CourseCoverMediaImage
                  coverImageUrl={course.coverImageUrl}
                  coverImageAltText={course.coverImageAltText}
                  courseName={course.name}
                  skillPair={course.skillPair}
                  className="h-full w-full"
                  imageClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" aria-hidden="true" />

                {/* Floating Badges */}
                <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
                  <span className="rounded-lg border border-white/60 bg-white/95 px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#8F304A] shadow-xs backdrop-blur-xs">
                    {course.code}
                  </span>
                  {recommended ? (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-[#F3DE9C] bg-[#FFF8E6]/95 px-2 py-0.5 text-[10px] font-bold text-[#8C6212] shadow-xs backdrop-blur-xs">
                      <Sparkle size={11} weight="fill" /> Gợi ý
                    </span>
                  ) : course.targetBand != null ? (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-white/60 bg-white/95 px-2 py-0.5 text-[10px] font-bold text-[#8F304A] shadow-xs backdrop-blur-xs">
                      <Target size={11} weight="bold" /> Band {course.targetBand.toFixed(1)}
                    </span>
                  ) : null}
                </div>

                {/* Bottom skill badge */}
                <div className="absolute inset-x-0 bottom-0 p-2.5">
                  <span className="inline-flex items-center gap-1 rounded-lg border border-white/60 bg-white/95 px-2 py-0.5 text-[10px] font-bold text-[#894C5B] shadow-xs backdrop-blur-xs">
                    {isSpeakingWriting ? (
                      <Microphone size={12} weight="bold" />
                    ) : (
                      <Headphones size={12} weight="bold" />
                    )}
                    {skillLabel}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="flex w-full flex-1 flex-col justify-between p-3.5 sm:p-4">
                <div>
                  <h3 className="line-clamp-2 min-h-[2.5rem] font-display text-[14px] font-extrabold leading-snug tracking-[-0.02em] text-[#251F21] transition-colors group-hover:text-[#9B465D] sm:text-[15px]">
                    {course.name}
                  </h3>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#6F676C]">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={13} className="shrink-0 text-[#9B465D]" />
                      {course.totalSessions ? `${course.totalSessions} buổi` : "Linh hoạt"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarBlank size={13} className="shrink-0 text-[#9B465D]" />
                      {course.startsOn ? new Date(course.startsOn).toLocaleDateString("vi-VN") : "Đang cập nhật"}
                    </span>
                  </div>
                </div>

                {/* Footer with Tuition & CTA */}
                <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-[#F2ECEE] pt-2.5">
                  <div className="min-w-0">
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-[#8A7D81]">Học phí</span>
                    <strong className="block truncate text-sm font-extrabold text-[#167A42] sm:text-[15px]">
                      {formatTuition(course.tuitionAmount)}
                    </strong>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#FDF2F4] px-2.5 py-1.5 text-xs font-bold text-[#9B465D] transition-all duration-200 group-hover:bg-[#9B465D] group-hover:text-white group-hover:shadow-xs">
                    Xem lớp <ArrowRight size={13} weight="bold" />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {courses.map((course) => {
        const recommended = recommendedCodes.has(course.code);
        const isSpeakingWriting =
          course.skillPair === "SPEAKING_WRITING" ||
          course.skillPair.toLowerCase().includes("speaking");
        const skillLabel = isSpeakingWriting
          ? "Speaking & Writing"
          : "Listening & Reading";

        return (
          <article
            key={course.id}
            className="group flex min-h-[380px] flex-col overflow-hidden rounded-[22px] border border-[#E6DDDF] bg-white shadow-[0_6px_24px_rgba(55,39,45,.04)] transition-all duration-200 hover:-translate-y-1 hover:border-[#D4B0BA] hover:shadow-[0_16px_36px_rgba(94,56,67,.1)]"
          >
            <div className="relative h-44 overflow-hidden bg-[#FDF2F4]">
              <CourseCoverMediaImage
                coverImageUrl={course.coverImageUrl}
                coverImageAltText={course.coverImageAltText}
                courseName={course.name}
                skillPair={course.skillPair}
                className="h-full w-full"
                imageClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" aria-hidden="true" />
              <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3.5">
                <span className="rounded-lg border border-white/60 bg-white/95 px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#8F304A] shadow-xs backdrop-blur-xs">
                  {course.code}
                </span>
                {recommended ? (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-[#F3DE9C] bg-[#FFF8E6]/95 px-2.5 py-1 text-[11px] font-bold text-[#8C6212] shadow-xs backdrop-blur-xs">
                    <Sparkle size={12} weight="fill" /> Cố vấn gợi ý
                  </span>
                ) : null}
              </div>

              <div className="absolute inset-x-0 bottom-0 p-3.5">
                <span className="inline-flex items-center gap-1 rounded-lg border border-white/60 bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#894C5B] shadow-xs backdrop-blur-xs">
                  {isSpeakingWriting ? <Microphone size={13} weight="bold" /> : <Headphones size={13} weight="bold" />}
                  {skillLabel}
                </span>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between p-5">
              <div>
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

                <h3 className="mt-2 line-clamp-2 min-h-12 font-display text-lg font-extrabold leading-snug tracking-[-0.025em] text-[#251F21] transition-colors group-hover:text-[#9B465D]">
                  {course.name}
                </h3>

                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[#F2ECEE] pt-3.5 text-xs">
                  <div className="flex items-center gap-2 text-[#6F676C]">
                    <Clock size={15} className="shrink-0 text-[#9B465D]" />
                    <span><strong className="block text-[#292326]">{course.totalSessions ? `${course.totalSessions} buổi học` : "Linh hoạt"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-[#6F676C]">
                    <CalendarBlank size={15} className="shrink-0 text-[#9B465D]" />
                    <span><span className="block text-[10px] text-[#8A7D81]">Khai giảng</span><strong className="block text-[#292326]">{course.startsOn ? new Date(course.startsOn).toLocaleDateString("vi-VN") : "Đang cập nhật"}</strong></span>
                  </div>
                </dl>
              </div>

              <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-[#E8F3EC] bg-[#F4FAF6] px-4 py-3">
                <div>
                  <span className="block text-[10px] font-bold tracking-wide text-[#28804D]">HỌC PHÍ KHÓA HỌC</span>
                  <strong className="mt-0.5 block text-base font-extrabold tracking-[-0.02em] text-[#167A42]">{formatTuition(course.tuitionAmount)}</strong>
                  <span className="block text-[10px] text-[#4E735D]">{course.capacity ? `Tối đa ${course.capacity} học viên` : "Lớp tiêu chuẩn"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectCourse(course)}
                  aria-label={`Xem khóa học ${course.name}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#9B465D] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all duration-200 hover:bg-[#84384D] hover:shadow-sm active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#894C5B]"
                >
                  Xem chi tiết <ArrowRight size={14} weight="bold" />
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
