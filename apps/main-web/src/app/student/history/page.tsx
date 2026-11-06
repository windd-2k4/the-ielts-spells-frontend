"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpenText,
  CaretLeft,
  CaretRight,
  ChartLineUp,
  ClockCounterClockwise,
  FileText,
  Headphones,
  MagnifyingGlass,
  Microphone,
  PencilSimpleLine,
  SquaresFour,
  X,
} from "@phosphor-icons/react";
import {
  getStudentAttemptHistory,
  type StudentPortalAttempt,
} from "@/features/student-hub/studentPortalApi";

type SkillTabId = "ALL" | "WRITING" | "SPEAKING" | "READING" | "LISTENING" | "MOCK_TEST";

interface SkillTab {
  id: SkillTabId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; weight?: "bold" | "regular" | "fill" }>;
  color: string;
}

const SKILL_TABS: SkillTab[] = [
  { id: "ALL", label: "Tất cả", icon: SquaresFour, color: "text-[#64748B]" },
  { id: "WRITING", label: "Writing", icon: PencilSimpleLine, color: "text-[#9A5B22]" },
  { id: "SPEAKING", label: "Speaking", icon: Microphone, color: "text-[#7957A2]" },
  { id: "READING", label: "Reading", icon: BookOpenText, color: "text-[#894C5B]" },
  { id: "LISTENING", label: "Listening", icon: Headphones, color: "text-[#486AA9]" },
  { id: "MOCK_TEST", label: "Mock Test", icon: FileText, color: "text-[#2563EB]" },
];

const PAGE_SIZE = 10;

/** Format elapsed duration between startedAt and submittedAt (e.g. 01:12 or 45:30) */
function formatAttemptDuration(startedAt: string | null, submittedAt: string | null): string {
  if (!startedAt || !submittedAt) return "--";
  const start = new Date(startedAt).getTime();
  const end = new Date(submittedAt).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return "--";
  const diffSec = Math.floor((end - start) / 1000);
  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Format submission timestamp into 2 lines: DD/MM/YY and HH:mm:ss */
function formatSubmitDate(submittedAt: string | null): { date: string; time: string } | null {
  if (!submittedAt) return null;
  const d = new Date(submittedAt);
  if (isNaN(d.getTime())) return null;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return {
    date: `${day}/${month}/${year}`,
    time: `${hours}:${minutes}:${seconds}`,
  };
}

/** Detect test section / task from title */
function detectTask(title: string, skill: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("task 1")) return "Task 1";
  if (lower.includes("task 2")) return "Task 2";
  if (lower.includes("passage 1")) return "Passage 1";
  if (lower.includes("passage 2")) return "Passage 2";
  if (lower.includes("passage 3")) return "Passage 3";
  if (lower.includes("section 1") || lower.includes("part 1")) return "Part 1";
  if (lower.includes("section 2") || lower.includes("part 2")) return "Part 2";
  if (lower.includes("section 3") || lower.includes("part 3")) return "Part 3";
  if (lower.includes("section 4") || lower.includes("part 4")) return "Part 4";
  if (skill.toUpperCase() === "WRITING") return "Task 2";
  return "-";
}

/** Detect test format / question type from title */
function detectFormat(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("discussion")) return "Discussion";
  if (lower.includes("opinion") || lower.includes("agree")) return "Opinion";
  if (lower.includes("problem") || lower.includes("cause") || lower.includes("solution")) return "Problem & Solution";
  if (lower.includes("advantage") || lower.includes("disadvantage")) return "Adv/Disadv";
  if (lower.includes("line graph")) return "Line Graph";
  if (lower.includes("bar chart")) return "Bar Chart";
  if (lower.includes("pie chart")) return "Pie Chart";
  if (lower.includes("process")) return "Process";
  if (lower.includes("map")) return "Map";
  if (lower.includes("table")) return "Table";
  if (lower.includes("academic")) return "Academic";
  if (lower.includes("general")) return "General";
  return "-";
}

/** Link to review attempt result */
function getReviewUrl(attempt: StudentPortalAttempt): string {
  const skill = (attempt.skill || "READING").toUpperCase();
  const skillPath = skill === "WRITING" ? "writing"
    : skill === "SPEAKING" ? "speaking"
      : skill === "LISTENING" ? "listening"
        : "reading";
  if (attempt.submittedAt) {
    return `/student/${skillPath}/attempts/${attempt.attemptId}/result`;
  }
  return `/student/${skillPath}/attempts/${attempt.attemptId}`;
}

/** Link to retry / launch self-practice for this test */
function getRetryUrl(attempt: StudentPortalAttempt): string {
  if (isAssignedAttempt(attempt)) return "/student/assignments";
  const skill = (attempt.skill || "READING").toUpperCase();
  return `/student/practice?skill=${skill}&query=${encodeURIComponent(attempt.title)}`;
}

function isAssignedAttempt(attempt: StudentPortalAttempt): boolean {
  return attempt.attemptOrigin === "ASSIGNMENT" || Boolean(attempt.assignmentId);
}

export default function StudentHistoryPage() {
  const [attempts, setAttempts] = useState<StudentPortalAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeTab, setActiveTab] = useState<SkillTabId>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "COMPLETED" | "IN_PROGRESS">("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let active = true;
    getStudentAttemptHistory()
      .then((items) => {
        if (active) setAttempts(items);
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const rawAttempts = useMemo(() => attempts, [attempts]);

  // Tab count indicators
  const tabCounts = useMemo(() => {
    const counts: Record<SkillTabId, number> = {
      ALL: rawAttempts.length,
      WRITING: 0,
      SPEAKING: 0,
      READING: 0,
      LISTENING: 0,
      MOCK_TEST: 0,
    };
    rawAttempts.forEach((attempt) => {
      const sk = (attempt.skill || "").toUpperCase();
      if (sk === "WRITING") counts.WRITING++;
      else if (sk === "SPEAKING") counts.SPEAKING++;
      else if (sk === "READING") counts.READING++;
      else if (sk === "LISTENING") counts.LISTENING++;

      const titleLower = attempt.title.toLowerCase();
      if (titleLower.includes("mock") || titleLower.includes("full test")) {
        counts.MOCK_TEST++;
      }
    });
    return counts;
  }, [rawAttempts]);

  // Filtered attempts
  const filteredAttempts = useMemo(() => {
    return rawAttempts.filter((attempt) => {
      const sk = (attempt.skill || "").toUpperCase();

      // Tab filter
      if (activeTab === "WRITING" && sk !== "WRITING") return false;
      if (activeTab === "SPEAKING" && sk !== "SPEAKING") return false;
      if (activeTab === "READING" && sk !== "READING") return false;
      if (activeTab === "LISTENING" && sk !== "LISTENING") return false;
      if (activeTab === "MOCK_TEST") {
        const titleLower = attempt.title.toLowerCase();
        if (!titleLower.includes("mock") && !titleLower.includes("full test")) return false;
      }

      // Status filter
      if (statusFilter === "COMPLETED" && (!attempt.submittedAt || attempt.status === "IN_PROGRESS")) {
        return false;
      }
      if (statusFilter === "IN_PROGRESS" && (attempt.submittedAt != null || attempt.status !== "IN_PROGRESS")) {
        return false;
      }

      // Search keyword filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        if (!attempt.title.toLowerCase().includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [rawAttempts, activeTab, statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAttempts.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedAttempts = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredAttempts.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredAttempts, safeCurrentPage]);

  // Handle Tab Change
  const handleTabChange = (tabId: SkillTabId) => {
    setActiveTab(tabId);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FDF0F4] border border-[#F0D5DD] flex items-center justify-center text-[#894C5B] shrink-0 shadow-2xs">
            <ChartLineUp size={18} weight="bold" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#1E1B18] tracking-tight">
              Lịch sử làm bài &amp; Tiến độ
            </h1>
            <p className="text-[11px] text-[#6F676C]">
              Theo dõi và xem lại kết quả các bài thi đã làm trong hệ thống
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl border border-[#E8E2D5] p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Skill Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {SKILL_TABS.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            const count = tabCounts[tab.id];

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[#894C5B] text-white shadow-xs font-bold"
                    : "bg-[#F8F6F7] text-[#64748B] hover:text-[#1E1B18] hover:bg-[#EFECEF] border border-[#F0E8ED]"
                }`}
              >
                <IconComponent
                  size={14}
                  weight={isActive ? "bold" : "regular"}
                  className={isActive ? "text-white" : tab.color}
                />
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-[#EAE4DC] text-[#475569]"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sub-bar: Sub-tab + Search & Status Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#F0E8ED] pb-2.5">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-[#894C5B] border-b-2 border-[#894C5B] pb-2 px-1 -mb-[11px] cursor-default inline-block">
              Theo tên bài
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "ALL" | "COMPLETED" | "IN_PROGRESS");
                setCurrentPage(1);
              }}
              className="text-xs bg-[#F8F6F7] border border-[#E8E2D5] rounded-lg px-2.5 py-1.5 text-[#1E1B18] font-medium outline-hidden hover:border-[#894C5B]/40 focus:border-[#894C5B] focus:bg-white transition-colors cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="COMPLETED">Đã hoàn thành</option>
              <option value="IN_PROGRESS">Đang làm dở</option>
            </select>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm theo tên bài..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-44 sm:w-56 text-xs bg-[#F8F6F7] border border-[#E8E2D5] rounded-lg pl-7.5 pr-7 py-1.5 text-[#1E1B18] placeholder-[#94A3B8] outline-hidden focus:border-[#894C5B] focus:bg-white transition-all"
              />
              <MagnifyingGlass
                size={13}
                weight="bold"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#1E1B18] cursor-pointer"
                >
                  <X size={11} weight="bold" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Attempts Table */}
        <div className="overflow-x-auto rounded-lg border border-[#E8E2D5]">
          <table className="w-full text-left border-collapse min-w-[740px]">
            <thead>
              <tr className="border-b border-[#E8E2D5] bg-[#FAF7F2] text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                <th className="py-2.5 px-3.5">Tên bài</th>
                <th className="py-2.5 px-2 text-center w-[85px]">Task</th>
                <th className="py-2.5 px-2 text-center w-[115px]">Dạng đề</th>
                <th className="py-2.5 px-2 text-center w-[125px]">Thời gian nộp</th>
                <th className="py-2.5 px-2 text-center w-[110px]">Thời lượng</th>
                <th className="py-2.5 px-2 text-center w-[125px]">Kết quả</th>
                <th className="py-2.5 px-3 text-center w-[130px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D5] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#6F676C]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#894C5B] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Đang tải lịch sử làm bài...</span>
                    </div>
                  </td>
                </tr>
              ) : pagedAttempts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <div className="max-w-xs mx-auto space-y-2.5">
                      <p className="text-sm font-semibold text-[#1E1B18]">
                        {loadError ? "Không tải được lịch sử làm bài" : "Không có lượt làm bài nào"}
                      </p>
                      <p className="text-xs text-[#6F676C]">
                        {loadError
                          ? "Vui lòng thử tải lại trang."
                          : searchQuery
                          ? "Không tìm thấy bài thi phù hợp với từ khóa tìm kiếm."
                          : "Lượt làm bài sẽ tự động hiển thị tại đây sau khi bạn hoàn thành bài thi."}
                      </p>
                      {loadError ? (
                        <button
                          type="button"
                          onClick={() => window.location.reload()}
                          className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg bg-[#894C5B] text-white text-xs font-bold hover:bg-[#733E4C] transition-colors shadow-2xs cursor-pointer"
                        >
                          Tải lại
                        </button>
                      ) : (
                        <Link
                          href="/student/practice"
                          className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg bg-[#894C5B] text-white text-xs font-bold hover:bg-[#733E4C] transition-colors shadow-2xs"
                        >
                          Luyện đề ngay
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                pagedAttempts.map((attempt) => {
                  const submitDate = formatSubmitDate(attempt.submittedAt);
                  const duration = formatAttemptDuration(attempt.startedAt, attempt.submittedAt);
                  const task = detectTask(attempt.title, attempt.skill);
                  const format = detectFormat(attempt.title);
                  const reviewUrl = getReviewUrl(attempt);
                  const retryUrl = getRetryUrl(attempt);

                  return (
                    <tr
                      key={attempt.attemptId}
                      className="hover:bg-[#FAF8F9] transition-colors"
                    >
                      {/* Tên bài */}
                      <td className="py-2.5 px-3.5 font-medium text-[#1E1B18]">
                        <div className="space-y-1">
                          <Link
                            href={reviewUrl}
                            className="font-semibold text-xs sm:text-[13px] text-[#1E1B18] hover:text-[#894C5B] transition-colors block line-clamp-1"
                            title={attempt.title}
                          >
                            {attempt.title}
                          </Link>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {activeTab === "ALL" && attempt.skill && (
                              <span className="inline-block text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-[#F4EFEA] text-[#64748B]">
                                {attempt.skill}
                              </span>
                            )}
                            <span
                              className={`inline-block text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                                isAssignedAttempt(attempt)
                                  ? "bg-[#FDF0F4] text-[#894C5B] border border-[#F0D5DD]"
                                  : "bg-[#F8F6F7] text-[#554D50] border border-[#E8DFC9]"
                              }`}
                            >
                              {isAssignedAttempt(attempt) ? "Bài được giao" : "Tự luyện"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Task */}
                      <td className="py-2.5 px-2 text-center text-xs text-[#64748B]">
                        {task === "-" ? <span className="text-[#CBD5E1] font-sans">—</span> : <span className="font-medium text-[#475569]">{task}</span>}
                      </td>

                      {/* Dạng đề */}
                      <td className="py-2.5 px-2 text-center text-xs text-[#64748B]">
                        {format === "-" ? <span className="text-[#CBD5E1] font-sans">—</span> : <span className="font-medium text-[#475569]">{format}</span>}
                      </td>

                      {/* Thời gian nộp bài */}
                      <td className="py-2.5 px-2 text-center text-xs leading-tight">
                        {submitDate ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-xs text-[#1E1B18] block">{submitDate.date}</span>
                            <span className="text-[10px] text-[#94A3B8] font-mono block">{submitDate.time}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#9A5B22] bg-[#FFF8EB] border border-[#F7E1B5] px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#9A5B22] animate-pulse" />
                            Đang làm
                          </span>
                        )}
                      </td>

                      {/* Thời gian làm bài */}
                      <td className="py-2.5 px-2 text-center text-xs font-mono font-medium text-[#64748B]">
                        {duration}
                      </td>

                      {/* Kết quả */}
                      <td className="py-2.5 px-2 text-center">
                        {attempt.status === "IN_PROGRESS" || !attempt.submittedAt ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FFF8EB] text-[#9A5B22] border border-[#F7E1B5]">
                            Đang làm dở
                          </span>
                        ) : attempt.score != null ? (
                          attempt.correctCount != null && attempt.totalQuestions > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-[#EAF7F0] text-[#18794E] border border-[#C5E8D4]">
                              <span className="font-mono">{attempt.correctCount}/{attempt.totalQuestions}</span>
                              <span className="text-[10px] font-medium opacity-80">
                                ({Math.round((attempt.score / Math.max(attempt.maxScore, 1)) * 100)}%)
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-[#FDF0F4] text-[#894C5B] border border-[#F0D5DD]">
                              Band {attempt.score.toFixed(1)}
                            </span>
                          )
                        ) : attempt.status === "SUBMITTED" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F1F5FC] text-[#486AA9] border border-[#CFDAED]">
                            Chờ chấm
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F8F6F7] text-[#64748B] border border-[#E8E2D5]">
                            Đã nộp
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-2.5 text-xs">
                          <Link
                            href={retryUrl}
                            className="text-[#64748B] hover:text-[#1E1B18] hover:underline font-medium transition-colors"
                            title={isAssignedAttempt(attempt) ? "Mở danh sách bài được giao" : "Làm lại bài tự luyện này"}
                          >
                            {isAssignedAttempt(attempt) ? "Bài được giao" : "Làm lại"}
                          </Link>
                          <Link
                            href={reviewUrl}
                            className="text-[#894C5B] hover:text-[#733E4C] hover:underline font-bold transition-colors"
                            title={attempt.submittedAt ? "Xem lại bài làm và đáp án" : "Tiếp tục làm bài"}
                          >
                            {attempt.submittedAt ? "Xem lại" : "Tiếp tục"}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Summary */}
        {filteredAttempts.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs text-[#6F676C]">
            <div>
              Hiển thị{" "}
              <span className="font-semibold text-[#1E1B18]">
                {Math.min(filteredAttempts.length, (safeCurrentPage - 1) * PAGE_SIZE + 1)} -{" "}
                {Math.min(filteredAttempts.length, safeCurrentPage * PAGE_SIZE)}
              </span>{" "}
              trong số <span className="font-semibold text-[#1E1B18]">{filteredAttempts.length}</span> lượt làm
            </div>

            <div className="flex items-center justify-center gap-1 self-center">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="w-7 h-7 rounded-lg border border-[#E8E2D5] flex items-center justify-center text-[#64748B] hover:bg-[#F8F6F7] hover:text-[#1E1B18] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                aria-label="Trang trước"
              >
                <CaretLeft size={13} weight="bold" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    safeCurrentPage === pageNum
                      ? "bg-[#894C5B] text-white shadow-2xs"
                      : "border border-[#E8E2D5] text-[#64748B] hover:bg-[#F8F6F7] hover:text-[#1E1B18]"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="w-7 h-7 rounded-lg border border-[#E8E2D5] flex items-center justify-center text-[#64748B] hover:bg-[#F8F6F7] hover:text-[#1E1B18] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                aria-label="Trang tiếp"
              >
                <CaretRight size={13} weight="bold" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
