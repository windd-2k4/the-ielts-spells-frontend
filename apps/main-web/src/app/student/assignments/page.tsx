"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpenText, ArrowRight, Clock, CheckCircle } from "@phosphor-icons/react";
import { getReadingAssignments } from "@/features/reading/readingApi";
import type { StudentReadingAssignment } from "@ielts/contracts";
import { StudentEmptyState } from "@/features/student-hub/StudentEmptyState";

export default function StudentAssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<StudentReadingAssignment[]>([]);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const data = await getReadingAssignments();
        if (active && Array.isArray(data)) {
          setAssignments(data);
        }
      } catch (err) {
        console.info("Assignments page fetch notice:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadData();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#F3E8C4]">
        <div>
          <h2 className="text-xl font-black text-[#1E1B18] font-display">Bài Tập Của Tôi</h2>
          <p className="text-xs text-[#857F7A]">
            Danh sách toàn bộ bài tập và đề kiểm tra được giảng viên giao cho bạn
          </p>
        </div>
      </div>

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
                  <Link
                    href="/student/reading"
                    className="px-4 py-2 rounded-xl bg-[#894C5B] text-white font-extrabold text-xs hover:bg-[#723c4a] transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    {isSubmitted ? (
                      <>
                        <CheckCircle size={16} weight="fill" className="text-[#F5C842]" />
                        <span>Mở danh sách bài</span>
                      </>
                    ) : (
                      <>
                        <span>{isInProgress ? "Tiếp tục làm" : "Làm bài ngay"}</span>
                        <ArrowRight size={14} weight="bold" />
                      </>
                    )}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
