"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  GraduationCap,
  ArrowRight,
  User,
  Clock,
  CalendarBlank,
  CheckCircle,
  BookOpen,
  Target,
  Sparkle,
  CaretLeft,
  CaretRight,
  ChartLineUp,
} from "@phosphor-icons/react";

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
}

import { CourseCoverMediaImage } from "./courses/CourseCoverMediaImage";

export function StudentMyCoursesSection({
  courses = [],
  loading = false,
  onSelectCourse,
}: StudentMyCoursesSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollPercentage, setScrollPercentage] = useState(0);

  // Drag and wheel interaction refs for carousel mode (when courses >= 3)
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
      return;
    }
    const percent = Math.min(100, Math.max(0, (el.scrollLeft / maxScroll) * 100));
    setScrollPercentage(percent);
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < maxScroll - 10);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || courses.length < 3) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [courses.length, updateScrollState]);

  // Horizontal mouse wheel gliding feature for my courses (when >= 3)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || courses.length < 3) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 1) return;

      const isScrollingDown = e.deltaY > 0;
      const isScrollingUp = e.deltaY < 0;

      // Allow natural vertical page scroll at boundaries
      if (isScrollingUp && el.scrollLeft <= 4) return;
      if (isScrollingDown && el.scrollLeft >= maxScroll - 4) return;

      e.preventDefault();

      const now = Date.now();
      if (now - lastWheelTimeRef.current < 110) return;
      lastWheelTimeRef.current = now;

      const cardStep = 384;
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
  }, [courses.length]);

  // Mouse Drag handlers
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

  const statusBadge = (status?: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/95 text-white text-[11px] font-extrabold shadow-sm backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            <span>Đang học</span>
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-600/95 text-white text-[11px] font-extrabold shadow-sm backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-200" />
            <span>Chờ xác nhận</span>
          </span>
        );
      case "PAUSED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-600/95 text-white text-[11px] font-extrabold shadow-sm backdrop-blur-md">
            <span>Bảo lưu</span>
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/95 text-white text-[11px] font-extrabold shadow-sm backdrop-blur-md">
            <CheckCircle size={12} weight="bold" />
            <span>Đã hoàn thành</span>
          </span>
        );
      default:
        return null;
    }
  };

  // Renders individual standard course card (used for 2-column grid and >= 3 carousel)
  const renderStandardCard = (course: CourseEnrollmentItem, isCarousel = false) => {
    const isLR =
      course.rawSkillPair === "LISTENING_READING" ||
      course.skillPair.toLowerCase().includes("listening");

    return (
      <div
        key={course.id}
        id={`course-${course.courseId}`}
        onClick={() => {
          if (!didDragRef.current && onSelectCourse) {
            onSelectCourse(course.courseId);
          }
        }}
        className={`group relative flex flex-col justify-between rounded-3xl overflow-hidden bg-white border border-[#E8E2D5] shadow-xs transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#C98A98] hover:shadow-[0_20px_40px_-12px_rgba(137,76,91,0.18),0_8px_16px_-6px_rgba(30,27,24,0.04)] cursor-pointer select-none ${
          isCarousel ? "flex-none w-[320px] sm:w-[380px] snap-start" : "w-full"
        }`}
      >
        {/* Top Banner: Real Image or Skill Placeholder */}
        <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-stone-100">
          <CourseCoverMediaImage
            coverImageUrl={course.coverImageUrl}
            coverImageAltText={course.coverImageAltText}
            courseName={course.courseTitle}
            skillPair={course.rawSkillPair || course.skillPair}
            className="w-full h-full"
            imageClassName="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />

          {/* Top Badges */}
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 z-10">
            <span className="px-3 py-1 rounded-full bg-[#894C5B]/90 backdrop-blur-md text-white text-[11px] font-extrabold uppercase tracking-wider shadow-sm border border-white/20">
              {course.courseCode}
            </span>

            {statusBadge(course.status)}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Skill Pair, Level & Target Band */}
            <div className="flex flex-wrap items-center justify-between text-xs font-bold gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg ${
                    isLR
                      ? "bg-[#F7E5EA] text-[#894C5B]"
                      : "bg-[#F1E8FC] text-[#5E3F86]"
                  }`}
                >
                  {course.skillPair}
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
                  {course.targetBand != null ? `Band ${course.targetBand.toFixed(1)}` : "Lộ trình đào tạo"}
                </span>
              </span>
            </div>

            {/* Course Title */}
            <h3 className="font-display text-base sm:text-lg font-bold text-[#1E1B18] line-clamp-2 leading-snug group-hover:text-[#894C5B] transition-colors">
              {course.courseTitle}
            </h3>

            {/* Description */}
            {course.description && (
              <p className="text-xs text-[#554B50] leading-relaxed line-clamp-2 min-h-[36px]">
                {course.description}
              </p>
            )}

            {/* Progress Bar Widget */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6F676C] font-medium flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-[#894C5B]" weight="fill" />
                  <span>Tiến độ học tập:</span>
                </span>
                <strong className="text-sm font-extrabold text-[#894C5B]">
                  {course.completedSessions}/{course.totalSessions} buổi ({course.progressPercent}%)
                </strong>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#F5F2EB] border border-[#E8E2D5] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#894C5B] to-[#B76E79] transition-all duration-500"
                  style={{ width: `${course.progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Meta details */}
          <div className="pt-3.5 border-t border-[#F1ECE4] space-y-2.5">
            <div className="grid grid-cols-2 gap-2 text-xs text-[#554B50]">
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-[#894C5B] shrink-0" weight="bold" />
                <span>{course.totalSessions} buổi học</span>
              </div>

              <div className="flex items-center gap-1.5">
                <CalendarBlank size={14} className="text-[#894C5B] shrink-0" weight="bold" />
                <span>
                  {course.startsOn
                    ? new Date(course.startsOn).toLocaleDateString("vi-VN")
                    : "Lịch đang cập nhật"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 col-span-2 text-xs text-[#6F676C]">
                <User size={14} className="text-[#894C5B] shrink-0" weight="bold" />
                <span>
                  Giảng viên: <strong className="text-[#292528]">{course.teacherName || "Đang phân công"}</strong>
                </span>
              </div>
            </div>

            {/* Next session notification pill */}
            {course.nextSessionText ? (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-[#FFFBEB] to-[#FEF3C7]/60 border border-[#FDE68A] flex items-center gap-2.5 text-xs text-amber-950">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-800 shrink-0">
                  <CalendarBlank size={15} weight="bold" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Buổi kế tiếp</span>
                  <strong className="text-xs truncate">{course.nextSessionText}</strong>
                </div>
              </div>
            ) : null}

            {/* Action Button */}
            <div className="pt-1">
              <Link
                href={`/student/courses/${course.courseId}`}
                onClick={(e) => {
                  if (onSelectCourse) {
                    e.preventDefault();
                    onSelectCourse(course.courseId);
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#894C5B] text-white text-xs font-bold transition-all duration-200 group-hover:bg-[#6F303E] active:scale-[0.98] shadow-xs group-hover:shadow-md"
              >
                <span>Xem chi tiết khóa học</span>
                <ArrowRight size={14} weight="bold" className="transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Featured widescreen cockpit layout when student has exactly 1 course (solves empty right side)
  const renderSingleFeaturedCourse = (course: CourseEnrollmentItem) => {
    const isLR =
      course.rawSkillPair === "LISTENING_READING" ||
      course.skillPair.toLowerCase().includes("listening");
    const remainingSessions = Math.max(0, course.totalSessions - course.completedSessions);
    const hasCover = Boolean(course.coverImageUrl);

    return (
      <div
        id={`course-${course.courseId}`}
        className="group relative w-full rounded-3xl overflow-hidden bg-white border border-[#E8E2D5] shadow-xs transition-all duration-300 ease-out hover:border-[#C98A98] hover:shadow-[0_20px_40px_-12px_rgba(137,76,91,0.16),0_8px_16px_-6px_rgba(30,27,24,0.04)]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
          {/* Left Column: Visual Banner & Identity (5 cols on lg) */}
          <div
            className={`lg:col-span-5 relative flex flex-col justify-between overflow-hidden p-6 sm:p-7 min-h-[280px] lg:min-h-full ${
              hasCover ? "bg-stone-900" : isLR ? "bg-[#FDF2F4]" : "bg-[#F6EEFD]"
            }`}
          >
            <CourseCoverMediaImage
              coverImageUrl={course.coverImageUrl}
              coverImageAltText={course.coverImageAltText}
              courseName={course.courseTitle}
              skillPair={course.rawSkillPair || course.skillPair}
              className="absolute inset-0 w-full h-full"
              imageClassName="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {hasCover ? (
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-900/60 to-stone-900/30" />
            ) : null}

            {/* Top Row Badges */}
            <div className="relative z-10 flex items-center justify-between gap-2">
              <span
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-sm border ${
                  hasCover
                    ? "bg-[#894C5B]/90 backdrop-blur-md text-white border-white/20"
                    : "bg-[#894C5B] text-white border-transparent"
                }`}
              >
                {course.courseCode}
              </span>

              {statusBadge(course.status)}
            </div>

            {/* Bottom Content on Visual Banner */}
            <div className="relative z-10 pt-16">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border mb-2.5 ${
                  hasCover
                    ? "bg-black/45 backdrop-blur-xs text-[#FDE047] border-white/10"
                    : "bg-white/80 text-[#894C5B] border-[#E8E2D5]"
                }`}
              >
                <Target size={13} weight="bold" />
                <span>
                  {course.targetBand != null ? `MỤC TIÊU BAND ${course.targetBand.toFixed(1)}` : "LỘ TRÌNH ĐÀO TẠO"}
                </span>
              </div>

              <h3
                className={`font-display text-xl sm:text-2xl font-bold leading-snug ${
                  hasCover ? "text-white drop-shadow-md" : "text-[#1E1B18]"
                }`}
              >
                {course.courseTitle}
              </h3>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    isLR
                      ? hasCover
                        ? "bg-[#F7E5EA]/90 text-[#894C5B] backdrop-blur-xs"
                        : "bg-[#F7E5EA] text-[#894C5B]"
                      : hasCover
                        ? "bg-[#F1E8FC]/90 text-[#5E3F86] backdrop-blur-xs"
                        : "bg-[#F1E8FC] text-[#5E3F86]"
                  }`}
                >
                  {course.skillPair}
                </span>

                {course.level && (
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                      hasCover
                        ? "bg-white/20 backdrop-blur-xs text-white border-white/10"
                        : "bg-white/80 text-[#6F676C] border-[#E8E2D5]"
                    }`}
                  >
                    Cấp độ {course.level}
                  </span>
                )}
              </div>

              {/* Teacher Info */}
              <div
                className={`mt-4 pt-3.5 border-t flex items-center gap-3 text-xs ${
                  hasCover ? "border-white/20 text-white" : "border-[#E8E2D5] text-[#292528]"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                    hasCover
                      ? "bg-white/20 text-white"
                      : "bg-white text-[#894C5B] shadow-2xs border border-[#E8E2D5]"
                  }`}
                >
                  <User size={15} weight="bold" />
                </div>
                <div>
                  <span
                    className={`text-[10px] block uppercase font-bold tracking-wider ${
                      hasCover ? "text-stone-300" : "text-[#6F676C]"
                    }`}
                  >
                    Giảng viên phụ trách
                  </span>
                  <strong
                    className={`text-xs font-bold ${hasCover ? "text-white" : "text-[#1E1B18]"}`}
                  >
                    {course.teacherName || "Đang phân công chính thức"}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Learning Cockpit & Action Controls (7 cols on lg) */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-white space-y-6">
            <div className="space-y-5">
              {/* Cockpit Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#F1ECE4]">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-[#894C5B]">
                    Tiến Độ & Kế Hoạch Học Tập
                  </h4>
                  <p className="text-xs text-[#6F676C] mt-0.5">
                    Hệ thống tự động đồng bộ điểm danh, buổi học và tài liệu trực tuyến.
                  </p>
                </div>
              </div>

              {/* Progress Tracker Card */}
              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#292528] flex items-center gap-1.5">
                    <CheckCircle size={16} className="text-[#894C5B]" weight="fill" />
                    <span>Tiến độ hoàn thành lộ trình:</span>
                  </span>
                  <strong className="text-sm font-extrabold text-[#894C5B]">
                    {course.completedSessions} / {course.totalSessions} buổi ({course.progressPercent}%)
                  </strong>
                </div>

                <div className="w-full h-3 rounded-full bg-white border border-[#E8E2D5] overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#894C5B] to-[#B76E79] transition-all duration-700"
                    style={{ width: `${course.progressPercent}%` }}
                  />
                </div>

                <p className="text-xs text-[#6F676C] font-medium flex items-center gap-1.5">
                  <ChartLineUp size={14} className="text-[#894C5B]" />
                  <span>
                    {remainingSessions > 0
                      ? `Bạn còn ${remainingSessions} buổi học nữa để hoàn thành mục tiêu khóa học!`
                      : "Chúc mừng! Bạn đã hoàn thành toàn bộ các buổi học theo lộ trình."}
                  </span>
                </p>
              </div>

              {/* Next Session Card */}
              {course.nextSessionText ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FFFBEB] to-[#FEF3C7]/60 border border-[#FDE68A] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-800 shrink-0">
                      <CalendarBlank size={20} weight="fill" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                        Buổi học kế tiếp
                      </span>
                      <strong className="text-sm sm:text-base font-extrabold text-amber-950">
                        {course.nextSessionText}
                      </strong>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-900 text-xs font-bold border border-amber-500/30">
                    <Clock size={13} weight="bold" />
                    <span>Đúng lịch</span>
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F2EB] flex items-center justify-center text-[#894C5B] shrink-0">
                    <CalendarBlank size={20} weight="bold" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F676C] block">
                      Lịch học tiếp theo
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-[#292528]">
                      Lịch học chi tiết đang được cập nhật từ hệ thống
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] text-center">
                  <span className="text-[10px] text-[#6F676C] font-semibold uppercase block">Thời lượng</span>
                  <strong className="text-xs sm:text-sm text-[#292528] font-bold mt-0.5 block">
                    {course.totalSessions} buổi
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] text-center">
                  <span className="text-[10px] text-[#6F676C] font-semibold uppercase block">Khai giảng</span>
                  <strong className="text-xs sm:text-sm text-[#292528] font-bold mt-0.5 block truncate">
                    {course.startsOn ? new Date(course.startsOn).toLocaleDateString("vi-VN") : "Đang cập nhật"}
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] text-center">
                  <span className="text-[10px] text-[#6F676C] font-semibold uppercase block">Cấp độ</span>
                  <strong className="text-xs sm:text-sm text-[#894C5B] font-bold mt-0.5 block truncate">
                    {course.level || "Tiêu chuẩn"}
                  </strong>
                </div>
              </div>
            </div>

            {/* CTA Action Button */}
            <div className="pt-2">
              <Link
                href={`/student/courses/${course.courseId}`}
                onClick={(e) => {
                  if (onSelectCourse) {
                    e.preventDefault();
                    onSelectCourse(course.courseId);
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-[#894C5B] text-white text-sm font-bold transition-all duration-200 hover:bg-[#6F303E] active:scale-[0.98] shadow-sm hover:shadow-md group/btn"
              >
                <span>Vào không gian học tập & Xem chi tiết khóa học</span>
                <ArrowRight size={16} weight="bold" className="transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Loading Skeleton */}
      {loading ? (
        <div className="w-full rounded-3xl bg-white border border-[#E8E2D5] p-8 space-y-6 animate-pulse">
          <div className="h-44 rounded-2xl bg-stone-200" />
          <div className="space-y-3">
            <div className="h-6 w-1/3 rounded-lg bg-stone-200" />
            <div className="h-4 w-2/3 rounded-lg bg-stone-100" />
          </div>
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
            <p className="mt-1 text-xs text-[#6F676C] max-w-md mx-auto leading-relaxed">
              Hiện tại tài khoản chưa có ghi danh chính thức. Hãy khám phá các chương trình học nổi bật bên dưới để chọn lộ trình bứt phá Band điểm phù hợp nhất với bạn.
            </p>
          </div>
          <a
            href="#curated-courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#894C5B] text-white text-xs font-bold shadow-2xs hover:bg-[#6F303E] transition-all"
          >
            <span>Khám phá khóa học nổi bật</span>
            <ArrowRight size={13} weight="bold" />
          </a>
        </div>
      ) : courses.length === 1 ? (
        /* Exactly 1 course: Render widescreen featured cockpit layout */
        renderSingleFeaturedCourse(courses[0])
      ) : courses.length === 2 ? (
        /* Exactly 2 courses: Render balanced dual-column grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => renderStandardCard(course, false))}
        </div>
      ) : (
        /* 3 or more courses: Render horizontal track with mouse wheel gliding */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6F676C] bg-[#F5F2EB] px-2.5 py-1 rounded-full border border-[#E8E2D5]">
              <span>Lăn chuột hoặc kéo để lướt khóa học ({courses.length})</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollByAmount("left")}
                disabled={!canScrollLeft}
                aria-label="Cuộn sang trái"
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                  canScrollLeft
                    ? "bg-white border-[#CBD5E1] text-[#292528] shadow-xs hover:border-[#894C5B] hover:text-[#894C5B]"
                    : "bg-[#F7F5F1] border-transparent text-[#CBD5E1] cursor-not-allowed"
                }`}
              >
                <CaretLeft size={16} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => scrollByAmount("right")}
                disabled={!canScrollRight}
                aria-label="Cuộn sang phải"
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                  canScrollRight
                    ? "bg-white border-[#CBD5E1] text-[#292528] shadow-xs hover:border-[#894C5B] hover:text-[#894C5B]"
                    : "bg-[#F7F5F1] border-transparent text-[#CBD5E1] cursor-not-allowed"
                }`}
              >
                <CaretRight size={16} weight="bold" />
              </button>
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none cursor-grab active:cursor-grabbing"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {courses.map((course) => renderStandardCard(course, true))}
          </div>

          <div className="w-full max-w-xs mx-auto h-1.5 rounded-full bg-[#E8E2D5] overflow-hidden">
            <div
              className="h-full bg-[#894C5B] rounded-full transition-all duration-150"
              style={{ width: `${Math.max(15, scrollPercentage)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
