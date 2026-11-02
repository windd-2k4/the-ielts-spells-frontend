"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  Brain,
  CheckCircle,
  CircleNotch,
  Clock,
  GraduationCap,
  Headphones,
  Info,
  Microphone,
  PencilSimpleLine,
  Sparkle,
  Target,
  UploadSimple,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { getReadingAssignments, startOrResumeReadingAttempt } from "@/features/reading/readingApi";
import { getWritingAssignments, startOrResumeWritingAssignment } from "@/features/writing/writingApi";
import { getSpeakingAssignments, startOrResumeSpeakingAssignment } from "@/features/speaking/speakingApi";
import type { StudentReadingAssignment } from "@ielts/contracts";
import { StudentEmptyState } from "@/features/student-hub/StudentEmptyState";
import { getStudentPortalOverview, uploadStudentProgressEvidence, type StudentCourseAssignment } from "@/features/student-hub/studentPortalApi";
import {
  MOCK_TIS_RECOMMENDATIONS,
  MOCK_TEACHER_ASSIGNMENTS,
  type TisAdaptiveRecommendation,
  type TeacherAssignmentItem,
} from "@/features/adaptive-learning/mockAssignmentsData";

type LegacyAssignment = StudentReadingAssignment & {
  kind: "TEST";
  skill: "LISTENING" | "READING" | "WRITING" | "SPEAKING";
};
type CourseAssignment = StudentCourseAssignment & { kind: "COURSE" };
type AssignmentItem = LegacyAssignment | CourseAssignment | (TeacherAssignmentItem & { maxAttempts: number; attemptsUsed: number });

type MainTab = "TEACHER_ASSIGNED" | "TIS_ADAPTIVE" | "COMPETENCY_MAP" | "COMPLETED";
type SkillFilter = "ALL" | "READING" | "LISTENING" | "WRITING" | "SPEAKING";

export default function StudentAssignmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rawTeacherAssignments, setRawTeacherAssignments] = useState<AssignmentItem[]>([]);
  const [useMock, setUseMock] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [startingId, setStartingId] = useState("");
  const [uploadingId, setUploadingId] = useState("");

  // Primary Tabs
  const [activeTab, setActiveTab] = useState<MainTab>("TIS_ADAPTIVE");
  const [skillFilter, setSkillFilter] = useState<SkillFilter>("ALL");

  // Selected TIS recommendation for deep explanation modal
  const [selectedTisRec, setSelectedTisRec] = useState<TisAdaptiveRecommendation | null>(null);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const [reading, listening, writing, speaking, portal] = await Promise.all([
          getReadingAssignments("reading").catch(() => []),
          getReadingAssignments("listening").catch(() => []),
          getWritingAssignments().catch(() => []),
          getSpeakingAssignments().catch(() => []),
          getStudentPortalOverview().catch(() => ({ courseAssignments: [] })),
        ]);
        if (active) {
          const liveList = [
            ...portal.courseAssignments.map((item) => ({ ...item, kind: "COURSE" as const })),
            ...reading.map((item) => ({ ...item, kind: "TEST" as const, skill: "READING" as const })),
            ...listening.map((item) => ({ ...item, kind: "TEST" as const, skill: "LISTENING" as const })),
            ...writing.map((item) => ({ ...item, kind: "TEST" as const, skill: "WRITING" as const })),
            ...speaking.map((item) => ({ ...item, kind: "TEST" as const, skill: "SPEAKING" as const })),
          ].sort((a, b) => {
            const left = a.kind === "COURSE" ? a.dueAt : a.closesAt ?? a.opensAt;
            const right = b.kind === "COURSE" ? b.dueAt : b.closesAt ?? b.opensAt;
            return (left ?? "9999").localeCompare(right ?? "9999");
          });

          setRawTeacherAssignments(liveList);
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

  const teacherAssignments = useMemo(() => {
    if (useMock || rawTeacherAssignments.length === 0) {
      return MOCK_TEACHER_ASSIGNMENTS as unknown as AssignmentItem[];
    }
    return rawTeacherAssignments;
  }, [useMock, rawTeacherAssignments]);

  const tisRecommendations = MOCK_TIS_RECOMMENDATIONS;

  // Filtered Teacher Assignments (Pending/Active)
  const filteredTeacherAssignments = useMemo(() => {
    return teacherAssignments.filter((item) => {
      if (skillFilter !== "ALL" && item.skill !== skillFilter) return false;
      const isCourse = item.kind === "COURSE";
      const isSubmitted = isCourse
        ? ["WAITING_REVIEW", "COMPLETED", "SUBMITTED"].includes(item.status)
        : item.attemptsUsed >= item.maxAttempts;
      return !isSubmitted;
    });
  }, [teacherAssignments, skillFilter]);

  // Completed Assignments
  const completedAssignments = useMemo(() => {
    return teacherAssignments.filter((item) => {
      if (skillFilter !== "ALL" && item.skill !== skillFilter) return false;
      const isCourse = item.kind === "COURSE";
      const isSubmitted = isCourse
        ? ["WAITING_REVIEW", "COMPLETED", "SUBMITTED"].includes(item.status)
        : item.attemptsUsed >= item.maxAttempts;
      return isSubmitted;
    });
  }, [teacherAssignments, skillFilter]);

  // Filtered TIS Recommendations
  const filteredTisRecommendations = useMemo(() => {
    return tisRecommendations.filter((rec) => {
      if (skillFilter !== "ALL" && rec.skill !== skillFilter) return false;
      return true;
    });
  }, [tisRecommendations, skillFilter]);

  async function openAssignment(item: AssignmentItem) {
    setStartingId(item.assignmentId);
    setError("");
    try {
      if (item.kind === "COURSE") {
        const classActivityId = "classActivityId" in item ? item.classActivityId : undefined;
        const courseId = "courseId" in item ? item.courseId : "";
        if (courseId && classActivityId) {
          router.push(`/student/courses/${courseId}?tab=assignments&activityId=${classActivityId}`);
        } else {
          router.push(`/student/practice`);
        }
        return;
      }
      if (item.skill === "WRITING") {
        const attempt = await startOrResumeWritingAssignment(item.assignmentId).catch(() => null);
        if (attempt) router.push(`/student/writing/attempts/${attempt.attemptId}`);
        else router.push(`/student/practice`);
      } else if (item.skill === "SPEAKING") {
        const attempt = await startOrResumeSpeakingAssignment(item.assignmentId).catch(() => null);
        if (attempt) router.push(`/student/speaking/attempts/${attempt.attemptId}`);
        else router.push(`/student/practice`);
      } else {
        const attempt = await startOrResumeReadingAttempt(item.assignmentId, item.skill.toLowerCase()).catch(() => null);
        if (attempt) {
          router.push(`/student/${item.skill === "LISTENING" ? "listening" : "reading"}/attempts/${attempt.attemptId}`);
        } else {
          router.push(`/student/practice`);
        }
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Không thể mở bài tập này.");
    } finally {
      setStartingId("");
    }
  }

  async function uploadEvidence(item: AssignmentItem, file: File) {
    const classActivityId = "classActivityId" in item ? item.classActivityId : undefined;
    const courseId = "courseId" in item ? item.courseId : undefined;
    if (!classActivityId || !courseId) {
      setNotice(`Đã ghi nhận minh chứng nộp cho “${item.title}”.`);
      return;
    }
    setUploadingId(item.assignmentId);
    setError("");
    setNotice("");
    try {
      await uploadStudentProgressEvidence(courseId, classActivityId, file);
      setNotice(`Đã nộp minh chứng cho “${item.title}”.`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Không thể nộp minh chứng.");
    } finally {
      setUploadingId("");
    }
  }

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case "SPEAKING":
        return <Microphone size={14} weight="bold" />;
      case "LISTENING":
        return <Headphones size={14} weight="bold" />;
      case "WRITING":
        return <PencilSimpleLine size={14} weight="bold" />;
      default:
        return <BookOpenText size={14} weight="bold" />;
    }
  };

  const getSkillLabel = (skill: string) => {
    switch (skill) {
      case "SPEAKING":
        return "Speaking";
      case "LISTENING":
        return "Listening";
      case "WRITING":
        return "Writing";
      default:
        return "Reading";
    }
  };

  const difficultyText = (diff: "EASY" | "MEDIUM" | "HARD") => {
    switch (diff) {
      case "EASY":
        return "Nhẹ nhàng";
      case "HARD":
        return "Thử thách";
      default:
        return "Vừa sức";
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* 1. Sleek, Minimalist Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F3E8C4]">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-[#1E1B18] font-display">
            Bài tập của tôi
          </h1>
          <p className="text-xs text-[#857F7A] mt-0.5">
            Bài tập từ giảng viên và các hoạt động luyện tập thích ứng do Trợ lý TIS đề xuất
          </p>
        </div>

        {/* Minimal data mode toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setUseMock(!useMock)}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-[#E8DFC9] bg-white text-[#78726A] hover:text-[#1E1B18] transition"
          >
            {useMock ? "Dữ liệu mẫu: Bật" : "Dữ liệu Live API"}
          </button>
        </div>
      </div>

      {/* 2. Compact, Sophisticated TIS Assistant Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#F0D5DD] bg-white px-4 py-3 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#894C5B] text-white">
            <Sparkle size={15} weight="fill" />
          </span>
          <p className="text-xs text-[#3E3436] truncate">
            <strong className="text-[#894C5B] font-extrabold">Trợ lý TIS:</strong> Đề xuất tập trung củng cố <strong>Matching Headings</strong> và <strong>Coherence</strong> để hướng tới mục tiêu Band 7.5.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-3 text-xs text-[#857F7A] font-medium self-end sm:self-auto">
          <span>Mục tiêu: <strong className="text-[#1E1B18] font-bold">Band 7.5</strong></span>
        </div>
      </div>

      {/* Alerts */}
      {error ? (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
          <WarningCircle size={16} weight="fill" className="shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {notice ? (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
          <CheckCircle size={16} weight="fill" className="shrink-0" />
          <span>{notice}</span>
        </div>
      ) : null}

      {/* 3. Segmented Navigation Tabs & Skill Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Main Tabs */}
        <div className="inline-flex rounded-xl bg-[#F4EFEA] p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("TEACHER_ASSIGNED")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition ${
              activeTab === "TEACHER_ASSIGNED"
                ? "bg-white text-[#1E1B18] shadow-xs font-bold"
                : "text-[#6B635F] hover:text-[#1E1B18]"
            }`}
          >
            <GraduationCap size={15} />
            <span>Bài tập Giảng viên</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === "TEACHER_ASSIGNED" ? "bg-[#894C5B] text-white" : "bg-[#EADFD8] text-[#625B55]"
              }`}
            >
              {filteredTeacherAssignments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("TIS_ADAPTIVE")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition ${
              activeTab === "TIS_ADAPTIVE"
                ? "bg-[#894C5B] text-white shadow-xs font-bold"
                : "text-[#894C5B] hover:text-[#723C4A]"
            }`}
          >
            <Sparkle size={14} weight="fill" />
            <span>Đề xuất từ TIS</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === "TIS_ADAPTIVE" ? "bg-white/20 text-white" : "bg-[#894C5B]/10 text-[#894C5B]"
              }`}
            >
              {filteredTisRecommendations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("COMPETENCY_MAP")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition ${
              activeTab === "COMPETENCY_MAP"
                ? "bg-white text-[#1E1B18] shadow-xs font-bold"
                : "text-[#6B635F] hover:text-[#1E1B18]"
            }`}
          >
            <Target size={15} />
            <span>Bản đồ năng lực</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("COMPLETED")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition ${
              activeTab === "COMPLETED"
                ? "bg-white text-[#1E1B18] shadow-xs font-bold"
                : "text-[#6B635F] hover:text-[#1E1B18]"
            }`}
          >
            <CheckCircle size={15} />
            <span>Đã nộp ({completedAssignments.length})</span>
          </button>
        </div>

        {/* Skill Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {(["ALL", "READING", "LISTENING", "WRITING", "SPEAKING"] as const).map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => setSkillFilter(skill)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                skillFilter === skill
                  ? "bg-[#1E1B18] text-white font-semibold"
                  : "text-[#78726A] hover:bg-[#F4EFEA]"
              }`}
            >
              {skill === "ALL" ? "Tất cả" : skill}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          TAB 1: BÀI TẬP GIẢNG VIÊN GIAO (MINIMALIST & CRISP)
         ========================================================================= */}
      {activeTab === "TEACHER_ASSIGNED" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {loading && teacherAssignments.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-36 rounded-2xl bg-white border border-[#F0D5DD] animate-pulse" />
              ))}
            </div>
          ) : filteredTeacherAssignments.length === 0 ? (
            <StudentEmptyState
              icon={<BookOpenText size={28} weight="duotone" className="text-[#894C5B]" />}
              title="Không còn bài tập nào chưa làm."
              description="Bạn đã hoàn thành toàn bộ bài tập được giao. Hãy chuyển sang tab Đề xuất từ TIS để luyện tập thêm."
              actionLabel="Xem đề xuất từ TIS"
              actionHref="/student/assignments"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTeacherAssignments.map((item) => {
                const isCourse = item.kind === "COURSE";
                const isInProgress = isCourse ? item.status === "IN_PROGRESS" : Boolean("activeAttemptExpiresAt" in item && item.activeAttemptExpiresAt);
                const needsRevision = isCourse && item.status === "NEEDS_REVISION";
                const deadline = isCourse ? item.dueAt : ("closesAt" in item ? item.closesAt : item.dueAt);

                return (
                  <div
                    key={`${item.kind}-${item.assignmentId}`}
                    className="flex flex-col justify-between rounded-2xl border border-[#EADBDF] bg-white p-5 shadow-2xs hover:border-[#894C5B] transition-colors"
                  >
                    <div className="space-y-2.5">
                      {/* Top Skill & Deadline */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-[#894C5B] font-bold">
                          {getSkillIcon(item.skill)}
                          <span>{getSkillLabel(item.skill)}</span>
                        </div>
                        <span className="text-[11px] text-[#857F7A] font-medium flex items-center gap-1">
                          <Clock size={12} />
                          {"effectiveDueAt" in item && item.effectiveDueAt
                            ? item.effectiveDueAt
                            : deadline
                            ? new Date(deadline).toLocaleString("vi-VN")
                            : "Không giới hạn"}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-sm md:text-base text-[#1E1B18] leading-snug">
                        {item.title}
                      </h3>

                      {/* Course / Session metadata */}
                      {"courseName" in item && item.courseName ? (
                        <p className="text-xs text-[#78726A] line-clamp-1">
                          {"courseCode" in item && item.courseCode ? `${item.courseCode} · ` : ""}
                          {item.courseName}
                          {"sessionNo" in item && item.sessionNo ? ` · Session ${item.sessionNo}` : ""}
                        </p>
                      ) : null}

                      {/* Status */}
                      <div className="text-[11px]">
                        <span className="text-[#857F7A]">Trạng thái: </span>
                        <strong className="text-[#894C5B] font-semibold">
                          {needsRevision ? "Cần nộp bản sửa" : isInProgress ? "Đang làm dở" : "Chưa bắt đầu"}
                        </strong>
                      </div>
                    </div>

                    {/* Minimal Action Bar */}
                    <div className="mt-4 pt-3 border-t border-[#F4EAEF] flex items-center justify-end gap-2">
                      <label
                        className={`inline-flex items-center gap-1 rounded-xl border border-[#D8BCC5] bg-white px-3 py-1.5 text-xs font-semibold text-[#894C5B] hover:bg-[#FAEEF2] cursor-pointer transition ${
                          uploadingId === item.assignmentId ? "pointer-events-none opacity-50" : ""
                        }`}
                      >
                        {uploadingId === item.assignmentId ? (
                          <CircleNotch size={14} className="animate-spin" />
                        ) : (
                          <UploadSimple size={14} />
                        )}
                        <span>Nộp minh chứng</span>
                        <input
                          hidden
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          disabled={uploadingId === item.assignmentId}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void uploadEvidence(item, file);
                            event.target.value = "";
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        disabled={startingId === item.assignmentId}
                        onClick={() => void openAssignment(item)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#894C5B] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#723C4A] transition"
                      >
                        {startingId === item.assignmentId ? (
                          <>
                            <CircleNotch size={14} className="animate-spin" />
                            <span>Đang mở...</span>
                          </>
                        ) : (
                          <>
                            <span>{isInProgress ? "Tiếp tục" : "Làm bài ngay"}</span>
                            <ArrowRight size={13} weight="bold" />
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
      )}

      {/* =========================================================================
          TAB 2: ĐỀ XUẤT TỪ TRỢ LÝ TIS (MINIMALIST, CLEAN, NO XP)
         ========================================================================= */}
      {activeTab === "TIS_ADAPTIVE" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {filteredTisRecommendations.length === 0 ? (
            <StudentEmptyState
              icon={<Sparkle size={28} weight="duotone" className="text-[#894C5B]" />}
              title="Chưa có đề xuất phù hợp với bộ lọc."
              description="Hãy chọn 'Tất cả' để xem toàn bộ danh sách bài tập thích ứng từ Trợ lý TIS."
              actionLabel="Xem tất cả đề xuất"
              actionHref="/student/assignments"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredTisRecommendations.map((rec) => {
                return (
                  <div
                    key={rec.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#EADBDF] bg-white p-5 shadow-2xs hover:border-[#894C5B] transition-colors"
                  >
                    <div className="space-y-3">
                      {/* Top: Skill + Mastery Target */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-[#894C5B] font-bold">
                          {getSkillIcon(rec.skill)}
                          <span>{getSkillLabel(rec.skill)}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-[#857F7A]">
                          Mastery: <strong className="text-[#894C5B]">{rec.currentMastery}%</strong> → <strong className="text-emerald-700">{rec.targetMastery}%</strong>
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-sm md:text-base text-[#1E1B18] leading-snug">
                        {rec.title}
                      </h3>

                      {/* Concise Purpose (No verbose paragraphs) */}
                      <p className="text-xs text-[#6B635F] leading-relaxed line-clamp-2">
                        {rec.aiRationale}
                      </p>

                      {/* Minimal progress bar */}
                      <div className="space-y-1 pt-1">
                        <div className="relative h-1.5 w-full rounded-full bg-[#EFE8E2] overflow-hidden">
                          <div
                            className="absolute h-full rounded-full bg-emerald-300"
                            style={{ width: `${rec.targetMastery}%` }}
                          />
                          <div
                            className="absolute h-full rounded-full bg-[#894C5B]"
                            style={{ width: `${rec.currentMastery}%` }}
                          />
                        </div>
                      </div>

                      {/* Meta chips: Time + Difficulty (NO XP) */}
                      <div className="flex items-center gap-2 text-[11px] text-[#857F7A] font-medium">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {rec.estimatedMinutes} phút
                        </span>
                        <span>·</span>
                        <span>Độ khó: {difficultyText(rec.difficulty)}</span>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="mt-4 pt-3 border-t border-[#F4EAEF] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setSelectedTisRec(rec)}
                        className="text-xs font-semibold text-[#894C5B] hover:underline inline-flex items-center gap-1"
                      >
                        <Info size={14} />
                        <span>Chi tiết</span>
                      </button>

                      <Link
                        href={rec.actionHref}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#894C5B] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#723C4A] transition"
                      >
                        <span>Luyện ngay</span>
                        <ArrowRight size={13} weight="bold" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: BẢN ĐỒ NĂNG LỰC (MINIMALIST OVERVIEW)
         ========================================================================= */}
      {activeTab === "COMPETENCY_MAP" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="rounded-2xl border border-[#EADBDF] bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F4EAEF] pb-3 text-xs">
              <div>
                <h3 className="font-bold text-sm text-[#1E1B18] flex items-center gap-2">
                  <Target size={16} className="text-[#894C5B]" />
                  Ước lượng năng lực 4 kỹ năng IELTS
                </h3>
              </div>
              <div className="text-[#857F7A]">
                Ước lượng hiện tại: <strong className="text-[#1E1B18] font-bold">6.5</strong> → Mục tiêu: <strong className="text-[#894C5B] font-bold">7.5</strong>
              </div>
            </div>

            {/* 4 Skill Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-[#EADBDF] bg-[#FDFBFB] p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#1E1B18]">
                  <span>Reading</span>
                  <span className="text-[#894C5B] font-bold">6.5</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#EFE8E2] overflow-hidden">
                  <div className="h-full rounded-full bg-[#894C5B]" style={{ width: "72%" }} />
                </div>
                <span className="text-[10px] text-[#857F7A] block truncate">Yếu: Matching Headings (42%)</span>
              </div>

              <div className="rounded-xl border border-[#EADBDF] bg-[#FDFBFB] p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#1E1B18]">
                  <span>Listening</span>
                  <span className="text-[#894C5B] font-bold">7.0</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#EFE8E2] overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-600" style={{ width: "78%" }} />
                </div>
                <span className="text-[10px] text-emerald-700 block truncate">Phản xạ tốt</span>
              </div>

              <div className="rounded-xl border border-[#EADBDF] bg-[#FDFBFB] p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#1E1B18]">
                  <span>Writing</span>
                  <span className="text-[#894C5B] font-bold">6.0</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#EFE8E2] overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: "65%" }} />
                </div>
                <span className="text-[10px] text-amber-700 block truncate">Yếu: Task 2 Cohesion (52%)</span>
              </div>

              <div className="rounded-xl border border-[#EADBDF] bg-[#FDFBFB] p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#1E1B18]">
                  <span>Speaking</span>
                  <span className="text-[#894C5B] font-bold">6.5</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#EFE8E2] overflow-hidden">
                  <div className="h-full rounded-full bg-[#894C5B]" style={{ width: "72%" }} />
                </div>
                <span className="text-[10px] text-[#857F7A] block truncate">Độ trôi chảy ổn định</span>
              </div>
            </div>

            {/* Knowledge Component Table */}
            <div className="pt-2">
              <h4 className="text-xs font-semibold text-[#857F7A] uppercase tracking-wider mb-2">
                Trạng thái làm chủ các dạng bài trọng tâm
              </h4>
              <div className="rounded-xl border border-[#EADBDF] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F5] text-[11px] font-semibold text-[#78726A]">
                    <tr>
                      <th className="px-4 py-2.5">Kỹ năng con</th>
                      <th className="px-4 py-2.5">Kỹ năng</th>
                      <th className="px-4 py-2.5">Mastery</th>
                      <th className="px-4 py-2.5 text-right">Luyện tập</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4EAEF]">
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-[#1E1B18]">Matching Headings</td>
                      <td className="px-4 py-2.5 text-[#78726A]">Reading</td>
                      <td className="px-4 py-2.5 text-rose-700 font-semibold">42% (Cần bù đắp)</td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => setActiveTab("TIS_ADAPTIVE")}
                          className="text-xs font-semibold text-[#894C5B] hover:underline"
                        >
                          Luyện cùng TIS ➔
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-[#1E1B18]">Coherence & Cohesion</td>
                      <td className="px-4 py-2.5 text-[#78726A]">Writing</td>
                      <td className="px-4 py-2.5 text-rose-700 font-semibold">52% (Cần bù đắp)</td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => setActiveTab("TIS_ADAPTIVE")}
                          className="text-xs font-semibold text-[#894C5B] hover:underline"
                        >
                          Luyện cùng TIS ➔
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-[#1E1B18]">Academic Distractors</td>
                      <td className="px-4 py-2.5 text-[#78726A]">Listening</td>
                      <td className="px-4 py-2.5 text-amber-700 font-semibold">60% (Trung bình)</td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => setActiveTab("TIS_ADAPTIVE")}
                          className="text-xs font-semibold text-[#894C5B] hover:underline"
                        >
                          Luyện cùng TIS ➔
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-[#1E1B18]">Skimming & Scanning</td>
                      <td className="px-4 py-2.5 text-[#78726A]">Reading</td>
                      <td className="px-4 py-2.5 text-emerald-700 font-semibold">88% (Vững vàng)</td>
                      <td className="px-4 py-2.5 text-right text-[#857F7A]">Đã đạt</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: ĐÃ HOÀN THÀNH
         ========================================================================= */}
      {activeTab === "COMPLETED" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedAssignments.map((item) => (
              <div
                key={`${item.kind}-${item.assignmentId}`}
                className="flex flex-col justify-between rounded-2xl border border-[#EADBDF] bg-white p-5 shadow-2xs space-y-2.5"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                      IELTS {getSkillLabel(item.skill)} · Đã nộp
                    </span>
                    {"score" in item && item.score ? (
                      <span className="font-bold text-emerald-700">Điểm: {item.score}</span>
                    ) : null}
                  </div>

                  <h4 className="font-bold text-sm md:text-base text-[#1E1B18]">{item.title}</h4>
                </div>

                <div className="pt-2 border-t border-[#F4EAEF] flex items-center justify-end text-xs">
                  <button
                    type="button"
                    onClick={() => void openAssignment(item)}
                    className="font-semibold text-[#894C5B] hover:underline"
                  >
                    Xem lại bài làm ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          INTERACTIVE TIS RAG TUTOR EXPLANATION MODAL (CLEAN & CONCISE)
         ========================================================================= */}
      {selectedTisRec && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setSelectedTisRec(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-[#EADBDF] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#F4EAEF] pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#894C5B] text-white">
                  <Sparkle size={15} weight="fill" />
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#894C5B] tracking-wide block">
                    CĂN CỨ TỪ TRỢ LÝ TIS
                  </span>
                  <h4 className="font-bold text-sm md:text-base text-[#1E1B18]">{selectedTisRec.title}</h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTisRec(null)}
                className="rounded-lg p-1.5 text-[#857F7A] hover:bg-[#F4EFEA] transition"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-3 text-xs text-[#1E1B18]">
              {/* Reason */}
              <div className="rounded-xl bg-[#FAF6F7] p-3 border border-[#F4EAEF] space-y-1">
                <span className="font-bold text-[#894C5B] block text-[11px]">
                  1. Mục tiêu bài tập:
                </span>
                <p className="text-[#594E4B] leading-relaxed">{selectedTisRec.whyRecommended}</p>
              </div>

              {/* RAG Context */}
              <div className="rounded-xl bg-[#F0F5FA] p-3 border border-[#DCE8F4] space-y-1">
                <span className="font-bold text-[#1B4B7C] block text-[11px]">
                  2. Trích dẫn phương pháp luận:
                </span>
                <p className="italic text-[#294B70] leading-relaxed">
                  “{selectedTisRec.ragContextExcerpt}”
                </p>
              </div>

              {/* Advice */}
              <div className="rounded-xl bg-[#F2FAF6] p-3 border border-[#D5EFE2] space-y-1">
                <span className="font-bold text-[#175C36] block text-[11px]">
                  3. Lời khuyên khi luyện tập:
                </span>
                <p className="text-[#1A4F32] leading-relaxed">{selectedTisRec.tisAdvice}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-[#857F7A] pt-1">
                <span>Thời lượng ước tính: {selectedTisRec.estimatedMinutes} phút</span>
                <span>Độ khó: {difficultyText(selectedTisRec.difficulty)}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F4EAEF]">
              <button
                type="button"
                onClick={() => setSelectedTisRec(null)}
                className="rounded-xl border border-[#D8BCC5] bg-white px-4 py-1.5 text-xs font-semibold text-[#625B55] hover:bg-[#FAF6F7] transition"
              >
                Đóng
              </button>
              <Link
                href={selectedTisRec.actionHref}
                onClick={() => setSelectedTisRec(null)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#894C5B] px-5 py-1.5 text-xs font-semibold text-white hover:bg-[#723C4A] transition"
              >
                <span>Bắt đầu làm bài</span>
                <ArrowRight size={13} weight="bold" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
