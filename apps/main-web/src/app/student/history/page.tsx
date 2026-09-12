"use client";

import { useStudentPortal } from "@/features/student-hub/StudentPortalProvider";
import { StudentRecentAttemptsSection, type RecentAttemptItem } from "@/features/student-hub/StudentRecentAttemptsSection";
import { formatDateTime } from "@/features/student-hub/studentPortalViewModel";

export default function StudentHistoryPage() {
  const { data, loading } = useStudentPortal();
  const attempts: RecentAttemptItem[] = (data?.recentAttempts ?? []).map((attempt) => ({
    id: attempt.attemptId,
    testTitle: attempt.title,
    skill: "IELTS Reading",
    completedDate: formatDateTime(attempt.submittedAt ?? attempt.startedAt),
    scoreText: attempt.submittedAt && attempt.score != null
      ? `${attempt.correctCount ?? 0}/${attempt.totalQuestions} câu · ${Math.round((attempt.score / Math.max(attempt.maxScore, 1)) * 100)}%`
      : "Đang làm dở",
    reviewUrl: attempt.submittedAt
      ? `/student/reading/attempts/${attempt.attemptId}/result`
      : `/student/reading/attempts/${attempt.attemptId}`,
  }));

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#894C5B]">Nhật ký học tập</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#292528]">Lịch sử làm bài</h2>
        <p className="mt-2 text-sm leading-6 text-[#6F676C]">Mở lại đúng lượt làm và phiên bản đề đã nộp. Hệ thống không tự tạo điểm hoặc Band.</p>
      </header>
      <StudentRecentAttemptsSection attempts={attempts} loading={loading} />
    </div>
  );
}
