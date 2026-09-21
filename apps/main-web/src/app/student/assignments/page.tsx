"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenText, ArrowRight, Clock, CheckCircle, CircleNotch, WarningCircle } from "@phosphor-icons/react";
import { getReadingAssignments, startOrResumeReadingAttempt } from "@/features/reading/readingApi";
import type { StudentReadingAssignment } from "@ielts/contracts";
import { StudentEmptyState } from "@/features/student-hub/StudentEmptyState";

export default function StudentAssignmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<StudentReadingAssignment[]>([]);
  const [error, setError] = useState("");
  const [startingId, setStartingId] = useState("");

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const data = await getReadingAssignments();
        if (active && Array.isArray(data)) {
          setAssignments(data);
        }
      } catch (failure) {
        if (active) setError(failure instanceof Error ? failure.message : "Không tải được danh sách bài tập.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadData();
    return () => {
      active = false;
    };
  }, []);

  async function openAssignment(assignmentId: string) {
    setStartingId(assignmentId);
    setError("");
    try {
      const attempt = await startOrResumeReadingAttempt(assignmentId);
      router.push(`/student/reading/attempts/${attempt.attemptId}`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Không thể mở bài tập này.");
    } finally {
      setStartingId("");
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#F3E8C4]">
        <div>
          <h2 className="text-xl font-black text-[#1E1B18] font-display">Bài tập của tôi</h2>
          <p className="text-xs text-[#857F7A]">
            Danh sách toàn bộ bài tập và đề kiểm tra được giảng viên giao cho bạn
          </p>
        </div>
      </div>

      {error ? (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          <WarningCircle size={20} weight="fill" className="mt-0.5 shrink-0" />{error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-[#FEF9C3]/50 border border-[#F3E8C4] animate-pulse" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <StudentEmptyState
          icon={<BookOpenText size={32} weight="duotone" className="text-[#894C5B]" />}
          title="Hiện tại bạn không có bài tập nào cần làm."
          description="Tất cả các bài tập được giao đã hoàn thành. Hãy quay lại sau khi giảng viên tạo thêm nhiệm vụ mới hoặc tự luyện tập tự do."
          actionLabel="Đến khu vực Luyện đề"
          actionHref="/student/practice"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((item) => {
            const isSubmitted = item.attemptsUsed >= item.maxAttempts;
            const isInProgress = Boolean(item.activeAttemptExpiresAt);
            return (
              <div
                key={item.assignmentId}
                className="bg-white rounded-2xl p-5 border border-[#F3E8C4] shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-[#F7E5EA] text-[#894C5B] text-[11px] font-extrabold">
                      IELTS Reading
                    </span>
                    <span className="text-xs font-bold text-[#857F7A] flex items-center gap-1">
                      <Clock size={14} />
                      <span>
                        Hạn: {item.closesAt ? new Date(item.closesAt).toLocaleDateString("vi-VN") : "Không giới hạn"}
                      </span>
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-[#1E1B18]">{item.title}</h3>
                  <p className="text-xs text-[#78726A]">
                    Trạng thái:{" "}
                    <strong className="text-[#894C5B]">
                      {isSubmitted ? "Đã nộp bài" : isInProgress ? "Đang làm dở" : "Chưa bắt đầu"}
                    </strong>
                  </p>
                </div>

                <div className="pt-2 border-t border-[#F3E8C4] flex items-center justify-end">
                  <button type="button" disabled={startingId === item.assignmentId || isSubmitted}
                    onClick={() => void openAssignment(item.assignmentId)}
                    className="flex min-h-11 items-center gap-1.5 rounded-xl bg-[#894C5B] px-4 py-2 text-xs font-extrabold text-white shadow-xs transition-all hover:bg-[#723c4a] focus:outline-none focus:ring-2 focus:ring-[#C85F78] disabled:cursor-not-allowed disabled:opacity-55">
                    {startingId === item.assignmentId ? (
                      <><CircleNotch size={16} className="animate-spin" /><span>Đang mở bài</span></>
                    ) : isSubmitted ? (
                      <>
                        <CheckCircle size={16} weight="fill" className="text-[#F5C842]" />
                        <span>Đã hết lượt làm</span>
                      </>
                    ) : (
                      <>
                        <span>{isInProgress ? "Tiếp tục làm" : "Làm bài ngay"}</span>
                        <ArrowRight size={14} weight="bold" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
