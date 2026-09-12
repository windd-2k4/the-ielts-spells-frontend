"use client";

import Link from "next/link";
import { ClockCounterClockwise, ArrowRight, Eye, Sparkle } from "@phosphor-icons/react";
import { StudentEmptyState } from "./StudentEmptyState";

export interface RecentAttemptItem {
  id: string;
  testTitle: string;
  skill: string;
  completedDate: string;
  scoreText: string;
  bandText?: string;
  reviewUrl: string;
}

interface StudentRecentAttemptsSectionProps {
  attempts?: RecentAttemptItem[];
  loading?: boolean;
}

export function StudentRecentAttemptsSection({
  attempts = [],
  loading = false,
}: StudentRecentAttemptsSectionProps) {
  const hasAttempts = attempts.length > 0;

  return (
    <section className="mb-8">
      {/* Section Title */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#FEF9C3] text-[#1E1B18] flex items-center justify-center font-bold">
            <ClockCounterClockwise size={20} weight="bold" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#1E1B18]">Hoạt Động Gần Đây</h3>
            <p className="text-xs text-[#857F7A]">Lịch sử nộp bài &amp; kết quả thi gần nhất</p>
          </div>
        </div>

        {hasAttempts && (
          <Link
            href="/student/history"
            className="text-xs font-bold text-[#894C5B] hover:underline flex items-center gap-1"
          >
            <span>Xem toàn bộ lịch sử</span>
            <ArrowRight size={12} weight="bold" />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="h-40 rounded-2xl bg-[#FEF9C3]/50 border border-[#F3E8C4] animate-pulse" />
      ) : !hasAttempts ? (
        /* Empty State when student has no completed test attempt */
        <StudentEmptyState
          icon={<ClockCounterClockwise size={32} weight="duotone" className="text-[#894C5B]" />}
          title="Bạn chưa thực hiện bài luyện tập nào."
          description="Lịch sử làm bài và điểm số chi tiết của bạn sẽ được tự động lưu lại tại đây sau khi nộp bài."
          actionLabel="Làm bài luyện tập ngay"
          actionHref="/student/practice"
          compact
        />
      ) : (
        /* List of recent attempt cards */
        <div className="bg-white rounded-2xl border border-[#F3E8C4] shadow-xs divide-y divide-[#F3E8C4] overflow-hidden">
          {attempts.slice(0, 5).map((attempt) => (
            <div
              key={attempt.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FFFDF7] transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F7E5EA] text-[#894C5B] text-[11px] font-extrabold">
                    {attempt.skill}
                  </span>
                  <span className="text-xs text-[#857F7A]">{attempt.completedDate}</span>
                </div>
                <h4 className="font-bold text-sm text-[#1E1B18] line-clamp-1">
                  {attempt.testTitle}
                </h4>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-[#857F7A]">Kết quả</p>
                  <div className="flex items-center gap-1.5 font-black text-sm text-[#1E1B18]">
                    <span>{attempt.scoreText}</span>
                    {attempt.bandText && (
                      <span className="px-2 py-0.5 rounded-md bg-[#FEF9C3] text-[#894C5B] text-xs font-black inline-flex items-center gap-1">
                        <Sparkle size={10} weight="fill" className="text-[#F5C842]" />
                        <span>{attempt.bandText}</span>
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href={attempt.reviewUrl}
                  className="px-3.5 py-2 rounded-xl bg-[#FEF9C3] text-[#1E1B18] font-extrabold text-xs hover:bg-[#F5C842] transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Eye size={14} weight="bold" />
                  <span>Xem lại</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
