"use client";

import { useRef, useState, useEffect } from "react";
import {
  CaretLeft,
  CaretRight,
  Sparkle,
  ArrowRight,
  Clock,
  GraduationCap,
  CalendarBlank,
  CurrencyCircleDollar,
} from "@phosphor-icons/react";
import type { DatabaseCourseItem } from "../studentPortalApi";

// High-fidelity academic image mapping for courses
const SKILL_IMAGES: Record<string, string> = {
  LISTENING_READING:
    "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1200&auto=format&fit=crop",
  SPEAKING_WRITING:
    "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=1200&auto=format&fit=crop",
  DEFAULT:
    "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=1200&auto=format&fit=crop",
};

interface StudentCoursesCuratedTrackProps {
  courses: DatabaseCourseItem[];
  recommendedCodes?: Set<string>;
  onSelectCourse: (course: DatabaseCourseItem) => void;
}

export function StudentCoursesCuratedTrack({
  courses,
  recommendedCodes = new Set(),
  onSelectCourse,
}: StudentCoursesCuratedTrackProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setScrollPercentage(0);
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const percent = Math.min(100, Math.max(0, (el.scrollLeft / maxScroll) * 100));
    setScrollPercentage(percent);
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < maxScroll - 10);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [courses]);

  const scrollByAmount = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const amount = direction === "left" ? -420 : 420;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  if (courses.length === 0) {
    return (
      <section className="mb-14 space-y-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F7E5EA] border border-[#EAC2CD] text-[#894C5B] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkle size={13} weight="fill" className="text-[#894C5B]" />
            <span>Lộ Trình Gợi Ý</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292528] tracking-tight font-serif">
            Khóa Học Nổi Bật Trong Hệ Thống
          </h2>
        </div>

        <div className="rounded-3xl border border-dashed border-[#E8E2D5] bg-white p-8 text-center space-y-2">
          <Sparkle size={26} className="mx-auto text-[#894C5B]" weight="fill" />
          <h3 className="text-sm sm:text-base font-bold text-[#292528]">
            Bạn đã ghi danh tất cả các khóa học hiện có trong hệ thống
          </h3>
          <p className="text-xs text-[#6F676C] max-w-md mx-auto">
            Không còn khóa học mới nào bạn chưa tham gia. Hãy tập trung học thật tốt và theo dõi tiến độ ở phần Khóa học của tôi bên trên nhé!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-14 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F7E5EA] border border-[#EAC2CD] text-[#894C5B] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkle size={13} weight="fill" className="text-[#894C5B]" />
            <span>Lộ Trình Gợi Ý</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292528] tracking-tight font-serif">
            Khóa Học Nổi Bật Trong Hệ Thống
          </h2>
          <p className="mt-1 text-sm text-[#6F676C]">
            Khám phá các khóa học gợi ý phù hợp để tiếp tục bứt phá mục tiêu (chỉ hiển thị khóa học bạn chưa tham gia).
          </p>
        </div>

        {/* Scroll Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByAmount("left")}
            disabled={!canScrollLeft}
            aria-label="Cuộn sang trái"
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
              canScrollLeft
                ? "bg-white border-[#CBD5E1] text-[#292528] shadow-xs hover:border-[#894C5B] hover:text-[#894C5B]"
                : "bg-[#F7F5F1] border-transparent text-[#CBD5E1] cursor-not-allowed"
            }`}
          >
            <CaretLeft size={18} weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount("right")}
            disabled={!canScrollRight}
            aria-label="Cuộn sang phải"
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
              canScrollRight
                ? "bg-white border-[#CBD5E1] text-[#292528] shadow-xs hover:border-[#894C5B] hover:text-[#894C5B]"
                : "bg-[#F7F5F1] border-transparent text-[#CBD5E1] cursor-not-allowed"
            }`}
          >
            <CaretRight size={18} weight="bold" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {courses.map((course) => {
          const isRecommended = recommendedCodes.has(course.code);
          const imgUrl = SKILL_IMAGES[course.skillPair] || SKILL_IMAGES.DEFAULT;
          const formattedTuition =
            course.tuitionAmount != null
              ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                  course.tuitionAmount,
                )
              : null;

          return (
            <div
              key={course.id}
              className="group relative flex-none w-[320px] sm:w-[380px] snap-start rounded-3xl overflow-hidden bg-white border border-[#E8E2D5] shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-[#894C5B]"
            >
              {/* Card Image Banner */}
              <div className="relative h-48 w-full overflow-hidden bg-stone-900">
                <img
                  src={imgUrl}
                  alt={course.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-[#894C5B] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                    {course.code}
                  </span>

                  {isRecommended && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FEF9C3] text-[#894C5B] text-[10px] font-bold shadow-sm">
                      <Sparkle size={11} weight="fill" />
                      <span>Được cố vấn gợi ý</span>
                    </span>
                  )}
                </div>

                {/* Bottom Overlay Info on Image */}
                <div className="absolute bottom-3 left-3.5 right-3.5">
                  <span className="text-[11px] font-bold text-amber-300 tracking-wide uppercase">
                    {course.targetBand != null ? `Mục tiêu Band ${course.targetBand.toFixed(1)}` : "Linh hoạt"}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white line-clamp-1">
                    {course.name}
                  </h3>
                </div>
              </div>

              {/* Card Body Info */}
              <div className="p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#894C5B] font-bold">
                    <span>
                      {course.skillPair === "LISTENING_READING"
                        ? "Listening & Reading"
                        : "Speaking & Writing"}
                    </span>
                    {course.level && (
                      <span className="text-stone-600 font-medium">Cấp độ {course.level}</span>
                    )}
                  </div>

                  {course.description && (
                    <p className="mt-2 text-xs text-[#6F676C] leading-relaxed line-clamp-2">
                      {course.description}
                    </p>
                  )}
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-2 text-xs text-[#554B50] pt-3 border-t border-[#F1ECE4]">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-[#894C5B]" />
                    <span>{course.totalSessions ? `${course.totalSessions} buổi` : "Chưa cập nhật"}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <CalendarBlank size={14} className="text-[#894C5B]" />
                    <span>
                      {course.startsOn
                        ? new Date(course.startsOn).toLocaleDateString("vi-VN")
                        : "Linh hoạt"}
                    </span>
                  </div>

                  {formattedTuition && (
                    <div className="flex items-center gap-1.5 col-span-2 text-emerald-700 font-semibold">
                      <CurrencyCircleDollar size={15} />
                      <span>{formattedTuition}</span>
                    </div>
                  )}
                </div>

                {/* Slide-up Action Button */}
                <button
                  type="button"
                  onClick={() => onSelectCourse(course)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#894C5B] text-white text-xs font-bold shadow-2xs hover:bg-[#68303d] active:scale-98 transition-all"
                >
                  <span>Xem chi tiết khóa học</span>
                  <ArrowRight size={13} weight="bold" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Track Scroll Progress Indicator */}
      <div className="w-full max-w-xs mx-auto h-1 rounded-full bg-[#E8E2D5] overflow-hidden">
        <div
          className="h-full bg-[#894C5B] rounded-full transition-all duration-150"
          style={{ width: `${Math.max(15, scrollPercentage)}%` }}
        />
      </div>
    </section>
  );
}
