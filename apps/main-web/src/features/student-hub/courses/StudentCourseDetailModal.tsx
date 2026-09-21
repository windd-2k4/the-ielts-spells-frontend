"use client";

import {
  X,
  GraduationCap,
  CalendarBlank,
  Clock,
  CurrencyCircleDollar,
  Users,
  Target,
  ArrowRight,
  Info,
  CheckCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import type { DatabaseCourseItem } from "../studentPortalApi";

interface StudentCourseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: DatabaseCourseItem | null;
  enrolledProgress?: {
    completedSessions: number;
    totalSessions: number;
    primaryTeacherName?: string | null;
    status?: string;
  } | null;
}

export function StudentCourseDetailModal({
  isOpen,
  onClose,
  course,
  enrolledProgress,
}: StudentCourseDetailModalProps) {
  if (!isOpen || !course) return null;

  const skillPairLabel =
    course.skillPair === "LISTENING_READING"
      ? "Listening & Reading"
      : "Speaking & Writing";

  const formattedTuition =
    course.tuitionAmount != null
      ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
          course.tuitionAmount,
        )
      : "Liên hệ tư vấn";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#fdfbf7] p-6 sm:p-8 shadow-2xl border border-[#E8E2D5] space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#E8E2D5] pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-[#F7E5EA] px-2.5 py-0.5 text-[11px] font-bold text-[#894C5B] uppercase tracking-wider">
                {course.code}
              </span>
              {course.targetBand != null && (
                <span className="rounded-full bg-[#FEF9C3] px-2.5 py-0.5 text-[11px] font-bold text-[#894C5B]">
                  Band {course.targetBand.toFixed(1)}
                </span>
              )}
              {course.level && (
                <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-700">
                  {course.level}
                </span>
              )}
            </div>
            <h3 className="mt-2 text-xl sm:text-2xl font-black text-[#1E1B18] font-sans">
              {course.name}
            </h3>
            <p className="mt-1 text-xs text-[#894C5B] font-semibold">
              Kỹ năng trọng tâm: {skillPairLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid w-8 h-8 place-items-center rounded-full border border-[#CBD5E1] text-[#64748B] hover:bg-stone-200 hover:text-[#0F172A] transition-all"
            aria-label="Đóng"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Enrollment Progress if already enrolled */}
        {enrolledProgress && (
          <div className="rounded-2xl bg-[#FEF9C3]/50 border border-[#F4C430]/40 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#894C5B]">
              <span className="flex items-center gap-1.5">
                <CheckCircle size={16} weight="fill" />
                <span>Bạn đã ghi danh khóa học này</span>
              </span>
              <span>
                {enrolledProgress.completedSessions}/{enrolledProgress.totalSessions} buổi hoàn thành
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
              <div
                className="h-full bg-[#894C5B] rounded-full transition-all"
                style={{
                  width: `${
                    enrolledProgress.totalSessions > 0
                      ? Math.min(100, Math.round((enrolledProgress.completedSessions / enrolledProgress.totalSessions) * 100))
                      : 0
                  }%`,
                }}
              />
            </div>
            {enrolledProgress.primaryTeacherName && (
              <p className="text-[11px] text-[#6F676C]">
                Giảng viên phụ trách: <strong>{enrolledProgress.primaryTeacherName}</strong>
              </p>
            )}
          </div>
        )}

        {/* Real Course Attributes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-white border border-[#E8E2D5] text-xs">
          <div>
            <span className="text-[#8C857B] block">Thời lượng:</span>
            <strong className="text-[#1E1B18] flex items-center gap-1 mt-0.5">
              <Clock size={14} className="text-[#894C5B]" />
              {course.totalSessions ? `${course.totalSessions} buổi học` : "Chưa cập nhật"}
            </strong>
          </div>

          <div>
            <span className="text-[#8C857B] block">Học phí:</span>
            <strong className="text-[#1E1B18] flex items-center gap-1 mt-0.5">
              <CurrencyCircleDollar size={14} className="text-emerald-700" />
              {formattedTuition}
            </strong>
          </div>

          <div>
            <span className="text-[#8C857B] block">Sĩ số tối đa:</span>
            <strong className="text-[#1E1B18] flex items-center gap-1 mt-0.5">
              <Users size={14} className="text-[#894C5B]" />
              {course.capacity ? `${course.capacity} học viên` : "Chưa đặt"}
            </strong>
          </div>

          <div>
            <span className="text-[#8C857B] block">Ngày khai giảng:</span>
            <strong className="text-[#1E1B18] flex items-center gap-1 mt-0.5">
              <CalendarBlank size={14} className="text-[#894C5B]" />
              {course.startsOn ? new Date(course.startsOn).toLocaleDateString("vi-VN") : "Linh hoạt"}
            </strong>
          </div>

          <div>
            <span className="text-[#8C857B] block">Dự kiến kết thúc:</span>
            <strong className="text-[#1E1B18] flex items-center gap-1 mt-0.5">
              <CalendarBlank size={14} className="text-[#894C5B]" />
              {course.endsOn ? new Date(course.endsOn).toLocaleDateString("vi-VN") : "Theo tiến độ"}
            </strong>
          </div>

          <div>
            <span className="text-[#8C857B] block">Trạng thái:</span>
            <strong className="text-[#1E1B18] flex items-center gap-1 mt-0.5">
              <GraduationCap size={14} className="text-[#894C5B]" />
              {course.status === "ACTIVE"
                ? "Đang diễn ra"
                : course.status === "OPEN"
                  ? "Đang mở tuyển sinh"
                  : course.status}
            </strong>
          </div>
        </div>

        {/* Real Description from Database */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#894C5B]">
            Mô Tả Khóa Học
          </h4>
          <p className="text-xs sm:text-sm text-[#475569] leading-relaxed bg-white p-4 rounded-2xl border border-[#E8E2D5]">
            {course.description || "Chưa có mô tả chi tiết từ phòng học vụ cho khóa học này."}
          </p>
        </div>

        {/* Academic Note */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-900">
          <Info size={16} className="shrink-0 text-amber-700 mt-0.5" />
          <span>
            Lịch học chi tiết từng buổi và giáo trình học phần sẽ được giảng viên và phòng học vụ đồng bộ trực tiếp lên tài khoản học viên trước ngày khai giảng.
          </span>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E8E2D5]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#CBD5E1] px-4 py-2.5 text-xs font-bold text-[#475569] hover:bg-stone-100"
          >
            Đóng
          </button>
          <Link
            href="/#consultation"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl bg-[#894C5B] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#68303d] shadow-sm transition-all"
          >
            <span>Nhận Tư Vấn Xếp Lớp</span>
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </div>
    </div>
  );
}
