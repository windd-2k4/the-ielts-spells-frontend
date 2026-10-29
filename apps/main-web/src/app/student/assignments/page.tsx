"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenText, ArrowRight, Clock, CheckCircle, CircleNotch, WarningCircle } from "@phosphor-icons/react";
import { getReadingAssignments, startOrResumeReadingAttempt } from "@/features/reading/readingApi";
import { getWritingAssignments, startOrResumeWritingAssignment } from "@/features/writing/writingApi";
import { getSpeakingAssignments, startOrResumeSpeakingAssignment } from "@/features/speaking/speakingApi";
import type { StudentReadingAssignment } from "@ielts/contracts";
import { StudentEmptyState } from "@/features/student-hub/StudentEmptyState";
import { getStudentPortalOverview, type StudentCourseAssignment } from "@/features/student-hub/studentPortalApi";

type LegacyAssignment = StudentReadingAssignment & {
  kind: "TEST";
  skill: "LISTENING" | "READING" | "WRITING" | "SPEAKING";
};
type CourseAssignment = StudentCourseAssignment & { kind: "COURSE" };
type AssignmentItem = LegacyAssignment | CourseAssignment;

export default function StudentAssignmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [error, setError] = useState("");
  const [startingId, setStartingId] = useState("");

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const [reading, listening, writing, speaking, portal] = await Promise.all([
          getReadingAssignments("reading"),
          getReadingAssignments("listening"),
          getWritingAssignments(),
          getSpeakingAssignments(),
          getStudentPortalOverview(),
        ]);
        if (active) {
          setAssignments([
            ...portal.courseAssignments.map((item) => ({ ...item, kind: "COURSE" as const })),
            ...reading.map((item) => ({ ...item, kind: "TEST" as const, skill: "READING" as const })),
            ...listening.map((item) => ({ ...item, kind: "TEST" as const, skill: "LISTENING" as const })),
            ...writing.map((item) => ({ ...item, kind: "TEST" as const, skill: "WRITING" as const })),
            ...speaking.map((item) => ({ ...item, kind: "TEST" as const, skill: "SPEAKING" as const })),
          ].sort((a, b) => {
            const left = a.kind === "COURSE" ? a.dueAt : a.closesAt ?? a.opensAt;
            const right = b.kind === "COURSE" ? b.dueAt : b.closesAt ?? b.opensAt;
            return (left ?? "9999").localeCompare(right ?? "9999");
          }));
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

  async function openAssignment(item: AssignmentItem) {
    setStartingId(item.assignmentId);
    setError("");
    try {
      if (item.kind === "COURSE") {
        router.push(`/student/courses/${item.courseId}?tab=assignments&activityId=${item.classActivityId}`);
        return;
      }
      if (item.skill === "WRITING") {
        const attempt = await startOrResumeWritingAssignment(item.assignmentId);
        router.push(`/student/writing/attempts/${attempt.attemptId}`);
      } else if (item.skill === "SPEAKING") {
        const attempt = await startOrResumeSpeakingAssignment(item.assignmentId);
        router.push(`/student/speaking/attempts/${attempt.attemptId}`);
      } else {
        const attempt = await startOrResumeReadingAttempt(item.assignmentId, item.skill.toLowerCase());
        router.push(`/student/${item.skill === "LISTENING" ? "listening" : "reading"}/attempts/${attempt.attemptId}`);
      }
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
            const isCourse = item.kind === "COURSE";
            const isSubmitted = isCourse
              ? ["WAITING_REVIEW", "COMPLETED"].includes(item.status)
              : item.attemptsUsed >= item.maxAttempts;
            const isInProgress = isCourse ? item.status === "IN_PROGRESS" : Boolean(item.activeAttemptExpiresAt);
            const needsRevision = isCourse && item.status === "NEEDS_REVISION";
            const deadline = isCourse ? item.dueAt : item.closesAt;
            return (
              <div
                key={`${item.kind}-${item.assignmentId}`}
                className="bg-white rounded-2xl p-5 border border-[#F3E8C4] shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-[#F7E5EA] text-[#894C5B] text-[11px] font-extrabold">
                      IELTS {item.skill === "WRITING" ? "Writing" : item.skill === "SPEAKING" ? "Speaking" : item.skill === "LISTENING" ? "Listening" : "Reading"}
                    </span>
                    <span className="text-xs font-bold text-[#857F7A] flex items-center gap-1">
                      <Clock size={14} />
                      <span>
                        Hạn: {isCourse ? (item.effectiveDueAt ? new Date(item.effectiveDueAt).toLocaleString("vi-VN") : "Không giới hạn") : (deadline ? new Date(deadline).toLocaleDateString("vi-VN") : "Không giới hạn")}
                      </span>
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-[#1E1B18]">{item.title}</h3>
                  {!isCourse && (item.sessionNo || item.sessionTitle) ? <p className="text-xs font-semibold text-[#625B55]">{item.courseName} · {item.sessionTitle || `Session ${item.sessionNo}`}</p> : null}
                  {isCourse ? <p className="text-xs font-semibold text-[#625B55]">{item.courseCode} · {item.courseName}{item.sessionNo ? ` · Session ${item.sessionNo}` : ""}</p> : null}
                  <p className="text-xs text-[#78726A]">
                    Trạng thái:{" "}
                    <strong className="text-[#894C5B]">
                      {needsRevision ? "Cần nộp bản sửa" : isSubmitted ? "Đã nộp bài" : isInProgress ? "Đang làm dở" : "Chưa bắt đầu"}
                    </strong>
                  </p>
                  {isCourse && item.latePolicy ? <p className="text-[11px] font-semibold text-[#857F7A]">{item.latePolicy === "BLOCK" ? "Chặn sau deadline" : item.latePolicy === "ALLOW" ? "Cho nộp sau deadline" : "Nộp sau deadline sẽ đánh dấu muộn"}{item.lateGraceMinutes > 0 ? ` · Grace ${item.lateGraceMinutes} phút` : ""}</p> : null}
                  {isCourse && item.lockReason ? <p className="flex items-center gap-1 text-[11px] font-semibold text-amber-700"><WarningCircle size={14} />{item.lockReason}</p> : null}
                </div>

                <div className="pt-2 border-t border-[#F3E8C4] flex items-center justify-end">
                  <button type="button" disabled={startingId === item.assignmentId || (isSubmitted && !isCourse)}
                    onClick={() => void openAssignment(item)}
                    className="flex min-h-11 items-center gap-1.5 rounded-xl bg-[#894C5B] px-4 py-2 text-xs font-extrabold text-white shadow-xs transition-all hover:bg-[#723c4a] focus:outline-none focus:ring-2 focus:ring-[#C85F78] disabled:cursor-not-allowed disabled:opacity-55">
                    {startingId === item.assignmentId ? (
                      <><CircleNotch size={16} className="animate-spin" /><span>Đang mở bài</span></>
                    ) : isSubmitted && !isCourse ? (
                      <>
                        <CheckCircle size={16} weight="fill" className="text-[#F5C842]" />
                        <span>Đã hết lượt làm</span>
                      </>
                    ) : (
                      <>
                        <span>{needsRevision && isCourse && item.canEdit ? "Mở để sửa bài" : isSubmitted || (isCourse && !item.canSubmit) ? "Xem trạng thái" : isInProgress ? "Tiếp tục làm" : "Làm bài ngay"}</span>
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
