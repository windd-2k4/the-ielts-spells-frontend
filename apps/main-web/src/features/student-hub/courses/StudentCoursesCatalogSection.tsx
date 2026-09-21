"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  MagnifyingGlass,
  GraduationCap,
  CalendarBlank,
  Clock,
  CurrencyCircleDollar,
  ArrowRight,
  Sparkle,
  BookOpen,
} from "@phosphor-icons/react";
import type { DatabaseCourseItem } from "../studentPortalApi";

interface StudentCoursesCatalogSectionProps {
  courses: DatabaseCourseItem[];
  loading?: boolean;
  recommendedCourseCodes?: Set<string>;
  onSelectCourse: (course: DatabaseCourseItem) => void;
}

export function StudentCoursesCatalogSection({
  courses,
  loading = false,
  recommendedCourseCodes = new Set(),
  onSelectCourse,
}: StudentCoursesCatalogSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkillPair, setSelectedSkillPair] = useState<string>("ALL");

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // Filter by skill pair
      if (selectedSkillPair !== "ALL" && course.skillPair !== selectedSkillPair) {
        return false;
      }

      // Filter by search query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesCode = course.code.toLowerCase().includes(query);
        const matchesName = course.name.toLowerCase().includes(query);
        const matchesDesc = (course.description || "").toLowerCase().includes(query);
        if (!matchesCode && !matchesName && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [courses, selectedSkillPair, searchTerm]);

  return (
    <section id="all-courses" className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#894C5B]">
            <BookOpen size={14} weight="bold" />
            <span>Chương trình đào tạo</span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#292528]">
            Khóa học đang mở từ hệ thống
          </h2>
          <p className="mt-1 text-sm text-[#6F676C]">
            Các khóa học được quản lý và mở tuyển sinh chính thức từ hệ thống The IELTS Spells.
          </p>
        </div>

        {/* Filter Tabs by Skill Pair */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-[#E8E2D5] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSelectedSkillPair("ALL")}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              selectedSkillPair === "ALL"
                ? "bg-[#894C5B] text-white shadow-2xs"
                : "text-[#6F676C] hover:text-[#292528]"
            }`}
          >
            Tất cả kỹ năng ({courses.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedSkillPair("LISTENING_READING")}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              selectedSkillPair === "LISTENING_READING"
                ? "bg-[#894C5B] text-white shadow-2xs"
                : "text-[#6F676C] hover:text-[#292528]"
            }`}
          >
            Listening & Reading
          </button>
          <button
            type="button"
            onClick={() => setSelectedSkillPair("SPEAKING_WRITING")}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              selectedSkillPair === "SPEAKING_WRITING"
                ? "bg-[#894C5B] text-white shadow-2xs"
                : "text-[#6F676C] hover:text-[#292528]"
            }`}
          >
            Speaking & Writing
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <MagnifyingGlass
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C857B]"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo mã hoặc tên khóa học..."
          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white border border-[#E8E2D5] focus:outline-none focus:border-[#894C5B] focus:ring-1 focus:ring-[#894C5B] text-[#292528] placeholder-[#8C857B]"
        />
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="h-44 rounded-2xl bg-white border border-[#E8E2D5] animate-pulse" />
          <div className="h-44 rounded-2xl bg-white border border-[#E8E2D5] animate-pulse" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E8E2D5] bg-white p-8 text-center">
          <GraduationCap size={32} className="mx-auto text-[#894C5B]" weight="duotone" />
          <p className="mt-3 text-sm font-bold text-[#292528]">
            {searchTerm.trim() ? "Không tìm thấy khóa học phù hợp" : "Chưa có khóa học công khai nào"}
          </p>
          <p className="mt-1 text-xs text-[#6F676C]">
            Vui lòng thử lại với từ khóa khác hoặc liên hệ bộ phận học vụ để được tư vấn lớp mới.
          </p>
        </div>
      ) : (
        /* Real Course Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCourses.map((course) => {
            const isRecommended = recommendedCourseCodes.has(course.code);
            const formattedTuition =
              course.tuitionAmount != null
                ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                    course.tuitionAmount,
                  )
                : null;

            return (
              <article
                key={course.id}
                className="flex flex-col justify-between rounded-2xl border border-[#E8E2D5] bg-white p-6 transition-all hover:border-[#894C5B] hover:shadow-sm"
              >
                <div>
                  {/* Card Badges */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#F7E5EA] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#894C5B]">
                        {course.code}
                      </span>
                      {isRecommended && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF9C3] px-2.5 py-1 text-[11px] font-bold text-[#894C5B]">
                          <Sparkle size={11} weight="fill" />
                          <span>Gợi ý cho bạn</span>
                        </span>
                      )}
                    </div>

                    {course.targetBand != null && (
                      <span className="text-xs font-bold text-[#894C5B] bg-[#FEF9C3]/50 px-2.5 py-0.5 rounded-full border border-[#F4C430]/30">
                        Mục tiêu Band {course.targetBand.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Course Title & Skill Pair */}
                  <h3 className="mt-3 text-base font-bold text-[#292528] leading-snug">
                    {course.name}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-[#6F676C]">
                    {course.skillPair === "LISTENING_READING"
                      ? "Listening & Reading"
                      : "Speaking & Writing"}{" "}
                    {course.level ? `· Cấp độ ${course.level}` : ""}
                  </p>

                  {/* Real Description */}
                  {course.description && (
                    <p className="mt-3 text-xs text-[#6F676C] leading-relaxed line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  {/* Real Meta Info */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-[#554B50] pt-3 border-t border-[#F5F2EB]">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-[#894C5B]" />
                      <span>{course.totalSessions ? `${course.totalSessions} buổi học` : "Chưa cập nhật"}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <CalendarBlank size={14} className="text-[#894C5B]" />
                      <span>
                        Khai giảng:{" "}
                        {course.startsOn
                          ? new Date(course.startsOn).toLocaleDateString("vi-VN")
                          : "Linh hoạt"}
                      </span>
                    </div>

                    {formattedTuition && (
                      <div className="flex items-center gap-1.5 col-span-2 text-emerald-700 font-semibold">
                        <CurrencyCircleDollar size={15} />
                        <span>Học phí: {formattedTuition}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-[#F5F2EB]">
                  <button
                    type="button"
                    onClick={() => onSelectCourse(course)}
                    className="rounded-xl border border-[#CBD5E1] px-4 py-2 text-xs font-bold text-[#475569] hover:bg-[#F8FAFC] hover:border-[#894C5B] transition-all"
                  >
                    Xem chi tiết
                  </button>

                  <Link
                    href="/#consultation"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#894C5B] px-4 py-2 text-xs font-bold text-white hover:bg-[#68303d] shadow-2xs transition-all"
                  >
                    <span>Nhận tư vấn</span>
                    <ArrowRight size={13} weight="bold" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
