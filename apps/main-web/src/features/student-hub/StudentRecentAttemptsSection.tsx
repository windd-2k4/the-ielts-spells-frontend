"use client";

import Link from "next/link";
import { ClockCounterClockwise, ArrowRight, Eye } from "@phosphor-icons/react";
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
    <section>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-[#FEF9C3] text-[#894C5B]">
            <ClockCounterClockwise size={16} weight="bold" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-[#1E1B18] font-sans">Hoạt động gần đây</h3>
            <p className="text-[11px] text-[#6F676C]">Lịch sử nộp bài &amp; kết quả thi gần nhất</p>
          </div>
        </div>

        {hasAttempts && (
          <Link
            href="/student/history"
            className="text-xs font-semibold text-[#894C5B] hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Toàn bộ lịch sử</span>
            <ArrowRight size={12} weight="bold" />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-white border border-[#E8E2D5] animate-pulse" />
          ))}
        </div>
      ) : !hasAttempts ? (
        <StudentEmptyState
          icon={<ClockCounterClockwise size={24} weight="bold" className="text-[#894C5B]" />}
          title="Chưa có lượt làm bài nào."
          description="Kết quả chi tiết và điểm số sẽ tự động lưu lại sau khi nộp bài."
          actionLabel="Tự luyện ngay"
          actionHref="/student/practice"
          compact
        />
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E2D5] shadow-2xs divide-y divide-[#E8E2D5] overflow-hidden">
          {attempts.slice(0, 4).map((attempt) => (
            <div
              key={attempt.id}
              className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FFFDF7] transition-colors"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-[#F7E5EA] text-[#894C5B] text-[10px] font-bold">
                    {attempt.skill}
                  </span>
                  <span className="text-[11px] text-[#6F676C]">{attempt.completedDate}</span>
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-[#1E1B18] truncate font-sans">
                  {attempt.testTitle}
                </h4>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-[10px] font-medium text-[#6F676C]">Kết quả</p>
                  <p className="text-xs font-bold text-[#1E1B18]">{attempt.scoreText}</p>
                </div>

                <Link
                  href={attempt.reviewUrl}
                  className="px-3 py-1.5 rounded-lg bg-[#FEF9C3] text-[#1E1B18] font-bold text-xs hover:bg-[#F5C842] transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <Eye size={13} weight="bold" />
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
