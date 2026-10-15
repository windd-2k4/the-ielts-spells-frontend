"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  CaretLeft,
  CaretRight,
  Sparkle,
  ArrowRight,
  Clock,
  CalendarBlank,
  CurrencyCircleDollar,
  Target,
  GraduationCap,
  Users,
} from "@phosphor-icons/react";
import type { StudentCourseItem } from "../studentPortalApi";
import { CourseCoverMediaImage } from "./CourseCoverMediaImage";

interface StudentCoursesCuratedTrackProps {
  courses: StudentCourseItem[];
  recommendedCodes?: Set<string>;
  onSelectCourse: (course: StudentCourseItem) => void;
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
  const [activeCourseIndex, setActiveCourseIndex] = useState(0);

  // Mouse drag & wheel interaction refs
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const didDragRef = useRef(false);
  const lastWheelTimeRef = useRef(0);

  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setScrollPercentage(0);
      setCanScrollLeft(false);
      setCanScrollRight(false);
      setActiveCourseIndex(0);
      return;
    }
    const percent = Math.min(100, Math.max(0, (el.scrollLeft / maxScroll) * 100));
    setScrollPercentage(percent);
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < maxScroll - 10);

    // Calculate approximate active card index
    const approxIndex = Math.round(el.scrollLeft / 384);
    setActiveCourseIndex(Math.max(0, Math.min(courses.length - 1, approxIndex)));
  }, [courses.length]);

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
  }, [updateScrollState]);

  // Horizontal mouse wheel gliding feature:
  // When cursor is inside the track and wheel is scrolled, glides horizontally to next/prev card
  // When hitting edges, allows natural vertical page scrolling so the user never gets stuck.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // If user is doing horizontal swipe on trackpad, let browser handle naturally
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 1) return;

      const isScrollingDown = e.deltaY > 0;
      const isScrollingUp = e.deltaY < 0;

      // Allow natural vertical page scroll at boundaries
      if (isScrollingUp && el.scrollLeft <= 4) return;
      if (isScrollingDown && el.scrollLeft >= maxScroll - 4) return;

      // Intercept wheel to glide horizontally
      e.preventDefault();

      const now = Date.now();
      if (now - lastWheelTimeRef.current < 110) return;
      lastWheelTimeRef.current = now;

      const cardStep = 384; // Card width (360px) + gap (24px)
      const step = isScrollingDown ? cardStep : -cardStep;

      el.scrollBy({
        left: step,
        behavior: "smooth",
      });
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [courses]);

  // Mouse Drag-to-Scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isMouseDownRef.current = true;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
    didDragRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.4;
    if (Math.abs(walk) > 6) {
      didDragRef.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isMouseDownRef.current = false;
  };

  const scrollByAmount = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const amount = direction === "left" ? -384 : 384;
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
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1B18]">
            Khóa Học Nổi Bật Trong Hệ Thống
          </h2>
        </div>

        <div className="rounded-3xl border border-dashed border-[#E8E2D5] bg-white p-8 sm:p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F7E5EA] text-[#894C5B] flex items-center justify-center mx-auto shadow-2xs">
            <Sparkle size={24} weight="fill" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-[#292528]">
            Bạn đã ghi danh tất cả các khóa học hiện có trong hệ thống
          </h3>
          <p className="text-xs text-[#6F676C] max-w-md mx-auto leading-relaxed">
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
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1B18]">
            Khóa Học Nổi Bật Trong Hệ Thống
          </h2>
          <p className="mt-1 text-sm text-[#6F676C]">
            Khám phá các khóa học gợi ý phù hợp để tiếp tục bứt phá mục tiêu (chỉ hiển thị khóa học bạn chưa tham gia).
          </p>
        </div>

        {/* Scroll Controls & Helper Hint */}
        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-[#6F676C] bg-[#F5F2EB] px-2.5 py-1 rounded-full border border-[#E8E2D5]">
            <span>Lăn chuột để lướt</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollByAmount("left")}
              disabled={!canScrollLeft}
              aria-label="Cuộn sang trái"
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                canScrollLeft
                  ? "bg-white border-[#CBD5E1] text-[#292528] shadow-xs hover:border-[#894C5B] hover:text-[#894C5B] hover:scale-105 active:scale-95"
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
                  ? "bg-white border-[#CBD5E1] text-[#292528] shadow-xs hover:border-[#894C5B] hover:text-[#894C5B] hover:scale-105 active:scale-95"
                  : "bg-[#F7F5F1] border-transparent text-[#CBD5E1] cursor-not-allowed"
              }`}
            >
              <CaretRight size={18} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel Track with Drag and Wheel Gliding */}
      <div
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none cursor-grab active:cursor-grabbing"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {courses.map((course) => {
          const isRecommended = recommendedCodes.has(course.code);
          const isLR = course.skillPair === "LISTENING_READING";

          const formattedTuition =
            course.tuitionAmount != null
              ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                  course.tuitionAmount,
                )
              : null;

          return (
            <div
              key={course.id}
              onClick={() => {
                if (!didDragRef.current) {
                  onSelectCourse(course);
                }
              }}
              className="group relative flex-none w-[320px] sm:w-[380px] snap-start rounded-3xl overflow-hidden bg-white border border-[#E8E2D5] shadow-xs transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#C98A98] hover:shadow-[0_20px_40px_-12px_rgba(137,76,91,0.18),0_8px_16px_-6px_rgba(30,27,24,0.04)] flex flex-col justify-between"
            >
              {/* Top Banner: Real Image or Skill Placeholder */}
              <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-stone-100">
                <CourseCoverMediaImage
                  coverImageUrl={course.coverImageUrl}
                  coverImageAltText={course.coverImageAltText}
                  courseName={course.name}
                  skillPair={course.skillPair}
                  className="w-full h-full"
                  imageClassName="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Top Badges */}
                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 z-10">
                  <span className="px-3 py-1 rounded-full bg-[#894C5B]/90 backdrop-blur-md text-white text-[11px] font-extrabold uppercase tracking-wider shadow-sm border border-white/20">
                    {course.code}
                  </span>

                  {isRecommended ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-300 to-amber-400 text-stone-900 text-[11px] font-extrabold shadow-sm">
                      <Sparkle size={12} weight="fill" />
                      <span>Cố vấn gợi ý</span>
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 space-y-4">
                <div>
                  {/* Skill pair, Level & Target Band */}
                  <div className="flex flex-wrap items-center justify-between text-xs font-bold gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg ${
                          isLR
                            ? "bg-[#F7E5EA] text-[#894C5B]"
                            : "bg-[#F1E8FC] text-[#5E3F86]"
                        }`}
                      >
                        {isLR ? "Listening & Reading" : "Speaking & Writing"}
                      </span>
                      {course.level && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F5F2EB] text-[#6F676C] font-semibold">
                          Cấp độ {course.level}
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#FAF8F5] text-[#894C5B] text-[11px] font-bold border border-[#E8E2D5]">
                      <Target size={12} weight="bold" />
                      <span>
                        {course.targetBand != null ? `Band ${course.targetBand.toFixed(1)}` : "Lộ trình bứt phá"}
                      </span>
                    </span>
                  </div>

                  {/* Course Title */}
                  <h3 className="mt-3 font-display text-base sm:text-lg font-bold text-[#1E1B18] line-clamp-2 leading-snug group-hover:text-[#894C5B] transition-colors">
                    {course.name}
                  </h3>

                  {/* Description */}
                  <p className="mt-2 text-xs text-[#554B50] leading-relaxed line-clamp-2 min-h-[36px]">
                    {course.description || "Khóa học bám sát định dạng bài thi IELTS với hệ thống bài giảng và bài tập chuẩn khảo thí."}
                  </p>
                </div>

                {/* Meta details */}
                <div className="pt-3.5 border-t border-[#F1ECE4] space-y-2.5">
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#554B50]">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-[#894C5B] shrink-0" weight="bold" />
                      <span>{course.totalSessions ? `${course.totalSessions} buổi học` : "Linh hoạt"}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <CalendarBlank size={14} className="text-[#894C5B] shrink-0" weight="bold" />
                      <span>
                        {course.startsOn
                          ? `Khai giảng: ${new Date(course.startsOn).toLocaleDateString("vi-VN")}`
                          : "Khai giảng linh hoạt"}
                      </span>
                    </div>
                  </div>

                  {/* Tuition Price Highlight Tag */}
                  <div className="p-3 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#DCFCE7] flex items-center justify-center text-[#15803D] shrink-0">
                        <CurrencyCircleDollar size={18} weight="fill" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-[#16A34A] tracking-wider">Học phí khóa học</span>
                        <span className="text-xs font-semibold text-[#15803D]">
                          {course.capacity ? `Tối đa ${course.capacity} học viên` : "Lớp tiêu chuẩn"}
                        </span>
                      </div>
                    </div>
                    <strong className="text-sm sm:text-base font-extrabold text-[#15803D] tracking-tight">
                      {formattedTuition ?? "Liên hệ tư vấn"}
                    </strong>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#894C5B] text-white text-xs font-bold transition-all duration-200 group-hover:bg-[#6F303E] active:scale-[0.98] shadow-xs group-hover:shadow-md"
                >
                  <span>Xem chi tiết khóa học</span>
                  <ArrowRight size={14} weight="bold" className="transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Track Scroll Progress Indicator */}
      <div className="flex items-center justify-between max-w-sm mx-auto gap-4">
        <span className="text-[11px] font-semibold text-[#6F676C]">
          Khóa {activeCourseIndex + 1} / {courses.length}
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-[#E8E2D5] overflow-hidden">
          <div
            className="h-full bg-[#894C5B] rounded-full transition-all duration-150"
            style={{ width: `${Math.max(15, scrollPercentage)}%` }}
          />
        </div>
      </div>
    </section>
  );
}
