"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUp,
  BookOpenText,
  CalendarBlank,
  CaretRight,
  ChatCircleDots,
  Check,
  CheckCircle,
  CircleNotch,
  Exam,
  FileText,
  GraduationCap,
  Headphones,
  Image as ImageIcon,
  ListBullets,
  Microphone,
  PencilSimpleLine,
  UploadSimple,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import type { StudentPracticeCatalogItem, StudentReadingAssignment } from "@ielts/contracts";
import { getReadingAssignments, startOrResumeReadingAttempt } from "@/features/reading/readingApi";
import { getWritingAssignments, startOrResumeWritingAssignment } from "@/features/writing/writingApi";
import { getSpeakingAssignments, startOrResumeSpeakingAssignment } from "@/features/speaking/speakingApi";
import {
  getStudentAttemptHistory,
  getStudentPortalOverview,
  uploadStudentProgressEvidence,
  type StudentPortalAttempt,
  type StudentPortalEnrollment,
} from "@/features/student-hub/studentPortalApi";
import { getPracticeCatalog } from "@/features/practice/practiceApi";
import { CourseCoverMediaImage } from "@/features/student-hub/courses/CourseCoverMediaImage";
import { PracticeCoverImage } from "@/features/practice/PracticeCoverImage";

type AssignmentSkill = "READING" | "LISTENING" | "WRITING" | "SPEAKING";
type AssignmentKind = "TEST" | "CUSTOM";
type StatusFilter = "ALL" | "OPEN" | "COMPLETED";
type SkillFilter = "ALL" | AssignmentSkill;
type TypeFilter = "ALL" | AssignmentKind;
type ViewMode = "BANNER" | "COMPACT";

type AssignmentItem = StudentReadingAssignment & {
  skill: AssignmentSkill;
  assignmentKind: AssignmentKind;
};

// Course color accents for top line and badges
const COURSE_ACCENTS = [
  { topLine: "bg-[#1EA896]", badgeText: "text-[#0F6357]", badgeBorder: "border-[#1EA896]/40" },
  { topLine: "bg-[#81485A]", badgeText: "text-[#622D3E]", badgeBorder: "border-[#81485A]/40" },
  { topLine: "bg-[#008EE2]", badgeText: "text-[#005B99]", badgeBorder: "border-[#008EE2]/40" },
  { topLine: "bg-[#2E7D32]", badgeText: "text-[#1B5E20]", badgeBorder: "border-[#2E7D32]/40" },
  { topLine: "bg-[#D97706]", badgeText: "text-[#92400E]", badgeBorder: "border-[#D97706]/40" },
  { topLine: "bg-[#7C3AED]", badgeText: "text-[#5B21B6]", badgeBorder: "border-[#7C3AED]/40" },
  { topLine: "bg-[#E8437E]", badgeText: "text-[#B01752]", badgeBorder: "border-[#E8437E]/40" },
];

function getCourseAccent(courseName: string, index: number) {
  let hash = 0;
  for (let i = 0; i < courseName.length; i++) {
    hash = (hash << 5) - hash + courseName.charCodeAt(i);
    hash |= 0;
  }
  const accentIndex = Math.abs(hash + index) % COURSE_ACCENTS.length;
  return COURSE_ACCENTS[accentIndex];
}

function formatCourseDisplayName(name: string) {
  if (name.includes("_")) {
    return name.replace(/_/g, " · ");
  }
  return name;
}

function isCompleted(item: AssignmentItem) {
  return item.completedAttempt || item.evidenceReplacement;
}

function formatDueTime(closesAt: string | null) {
  if (!closesAt) return "NO DUE DATE";
  const due = new Date(closesAt);
  return `DUE: ${due.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
}

function getSkillMeta(skill: AssignmentSkill) {
  switch (skill) {
    case "READING":
      return { icon: BookOpenText, label: "READING ASSIGNMENT", color: "text-[#1EA896]" };
    case "LISTENING":
      return { icon: Headphones, label: "LISTENING ASSIGNMENT", color: "text-[#008EE2]" };
    case "WRITING":
      return { icon: PencilSimpleLine, label: "WRITING ASSIGNMENT", color: "text-[#E8437E]" };
    case "SPEAKING":
      return { icon: ChatCircleDots, label: "SPEAKING DISCUSSION", color: "text-[#7C3AED]" };
  }
}

interface CourseInfo {
  coverImageUrl?: string | null;
  coverImageAltText?: string | null;
  skillPair?: string | null;
}

interface CourseGroup {
  courseId: string;
  courseName: string;
  accent: typeof COURSE_ACCENTS[0];
  courseInfo?: CourseInfo;
  activeItems: AssignmentItem[];
  completedItems: AssignmentItem[];
}

interface DateBucket {
  key: string;
  title: string;
  subtitle: string;
  order: number;
  courseGroups: CourseGroup[];
}

export default function StudentAssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [coursesInfoMap, setCoursesInfoMap] = useState<Map<string, CourseInfo>>(new Map());
  const [attemptsMap, setAttemptsMap] = useState<Map<string, StudentPortalAttempt>>(new Map());
  const [catalogMap, setCatalogMap] = useState<Map<string, StudentPracticeCatalogItem>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [startingId, setStartingId] = useState("");
  const [uploadingId, setUploadingId] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [skillFilter, setSkillFilter] = useState<SkillFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("BANNER");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [
          reading,
          listening,
          writing,
          speaking,
          overview,
          attempts,
          readingCatalog,
          listeningCatalog,
          writingCatalog,
          speakingCatalog,
        ] = await Promise.all([
          getReadingAssignments("reading").catch(() => []),
          getReadingAssignments("listening").catch(() => []),
          getWritingAssignments().catch(() => []),
          getSpeakingAssignments().catch(() => []),
          getStudentPortalOverview().catch(() => null),
          getStudentAttemptHistory().catch(() => []),
          getPracticeCatalog({ skill: "READING", size: 48 }).catch(() => null),
          getPracticeCatalog({ skill: "LISTENING", size: 48 }).catch(() => null),
          getPracticeCatalog({ skill: "WRITING", size: 48 }).catch(() => null),
          getPracticeCatalog({ skill: "SPEAKING", size: 48 }).catch(() => null),
        ]);
        if (!active) return;

        // 1. Build assignments list
        setAssignments([
          ...reading.map((item) => ({ ...item, skill: "READING" as const, assignmentKind: "TEST" as const })),
          ...listening.map((item) => ({ ...item, skill: "LISTENING" as const, assignmentKind: "TEST" as const })),
          ...writing.map((item) => ({ ...item, skill: "WRITING" as const, assignmentKind: "TEST" as const })),
          ...speaking.map((item) => ({ ...item, skill: "SPEAKING" as const, assignmentKind: "TEST" as const })),
        ]);

        // 2. Build real course cover info map
        const nextCourseMap = new Map<string, CourseInfo>();
        if (overview?.enrollments) {
          for (const enroll of overview.enrollments) {
            const info: CourseInfo = {
              coverImageUrl: enroll.coverImageUrl,
              coverImageAltText: enroll.coverImageAltText,
              skillPair: enroll.skillPair,
            };
            nextCourseMap.set(enroll.courseId, info);
            nextCourseMap.set(enroll.courseName, info);
            nextCourseMap.set(enroll.courseCode, info);
          }
        }
        setCoursesInfoMap(nextCourseMap);

        // 3. Build real attempts & results map
        const nextAttemptsMap = new Map<string, StudentPortalAttempt>();
        for (const att of attempts) {
          if (att.assignmentId) {
            nextAttemptsMap.set(att.assignmentId, att);
          }
          if (att.title) {
            nextAttemptsMap.set(`title:${att.title.trim().toLowerCase()}`, att);
          }
        }
        if (overview?.recentAttempts) {
          for (const att of overview.recentAttempts) {
            if (att.assignmentId && !nextAttemptsMap.has(att.assignmentId)) {
              nextAttemptsMap.set(att.assignmentId, att);
            }
          }
        }
        setAttemptsMap(nextAttemptsMap);

        // 4. Build practice test catalog map for test cover images & real question counts
        const nextCatalogMap = new Map<string, StudentPracticeCatalogItem>();
        const catalogs = [readingCatalog, listeningCatalog, writingCatalog, speakingCatalog];
        for (const cat of catalogs) {
          if (cat?.content) {
            for (const catItem of cat.content) {
              nextCatalogMap.set(catItem.testVersionId, catItem);
              nextCatalogMap.set(catItem.testId, catItem);
            }
          }
        }
        setCatalogMap(nextCatalogMap);
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "Không tải được danh sách bài tập.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const courses = useMemo(
    () => Array.from(new Set(assignments.map((item) => item.courseName))).sort(),
    [assignments]
  );
  const openCount = assignments.filter((item) => !isCompleted(item)).length;
  const urgentCount = assignments.filter((item) => {
    if (isCompleted(item) || !item.closesAt) return false;
    const rem = new Date(item.closesAt).getTime() - Date.now();
    return rem <= 86_400_000;
  }).length;
  const completedCount = assignments.filter(isCompleted).length;

  const visibleAssignments = useMemo(() => {
    return assignments
      .filter((item) => {
        if (statusFilter === "OPEN") return !isCompleted(item);
        if (statusFilter === "COMPLETED") return isCompleted(item);
        return true;
      })
      .filter((item) => skillFilter === "ALL" || item.skill === skillFilter)
      .filter((item) => typeFilter === "ALL" || item.assignmentKind === typeFilter)
      .filter((item) => courseFilter === "ALL" || item.courseName === courseFilter);
  }, [assignments, courseFilter, skillFilter, statusFilter, typeFilter]);

  // Group by Date & Course
  const dateBuckets = useMemo(() => {
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const tomorrowMidnight = todayMidnight + 86_400_000;
    const dayAfterTomorrowMidnight = tomorrowMidnight + 86_400_000;

    const bucketMap = new Map<
      string,
      {
        title: string;
        subtitle: string;
        order: number;
        items: AssignmentItem[];
      }
    >();

    const todayFormatted = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    bucketMap.set("TODAY", {
      title: "TODAY",
      subtitle: todayFormatted,
      order: 1,
      items: [],
    });

    const tomorrowDate = new Date(now.getTime() + 86_400_000);
    const tomorrowFormatted = tomorrowDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    for (const item of visibleAssignments) {
      if (!item.closesAt) {
        if (!bucketMap.has("NO_DUE_DATE")) {
          bucketMap.set("NO_DUE_DATE", {
            title: "BÀI TẬP TỰ HỌC",
            subtitle: "Không giới hạn deadline · Tiến độ tự do",
            order: 999_999_999,
            items: [],
          });
        }
        bucketMap.get("NO_DUE_DATE")!.items.push(item);
        continue;
      }

      const due = new Date(item.closesAt);
      const dueTime = due.getTime();

      // Check overdue unfinished
      if (dueTime < now.getTime() && !isCompleted(item)) {
        if (!bucketMap.has("OVERDUE")) {
          bucketMap.set("OVERDUE", {
            title: "OVERDUE · QUÁ HẠN",
            subtitle: "Bài tập cần ưu tiên hoàn thành ngay",
            order: 0,
            items: [],
          });
        }
        bucketMap.get("OVERDUE")!.items.push(item);
      } else if (dueTime >= todayMidnight && dueTime < tomorrowMidnight) {
        bucketMap.get("TODAY")!.items.push(item);
      } else if (dueTime >= tomorrowMidnight && dueTime < dayAfterTomorrowMidnight) {
        if (!bucketMap.has("TOMORROW")) {
          bucketMap.set("TOMORROW", {
            title: "TOMORROW",
            subtitle: tomorrowFormatted,
            order: 2,
            items: [],
          });
        }
        bucketMap.get("TOMORROW")!.items.push(item);
      } else if (dueTime >= dayAfterTomorrowMidnight) {
        const key = due.toISOString().split("T")[0];
        if (!bucketMap.has(key)) {
          bucketMap.set(key, {
            title: due.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase(),
            subtitle: due.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
            order: dueTime,
            items: [],
          });
        }
        bucketMap.get(key)!.items.push(item);
      } else {
        if (!bucketMap.has("COMPLETED_PAST")) {
          bucketMap.set("COMPLETED_PAST", {
            title: "COMPLETED ACTIVITIES",
            subtitle: "Lịch sử bài tập đã hoàn thành",
            order: 999_999_990,
            items: [],
          });
        }
        bucketMap.get("COMPLETED_PAST")!.items.push(item);
      }
    }

    const result: DateBucket[] = [];
    bucketMap.forEach((val, key) => {
      if (val.items.length === 0 && key !== "TODAY") return;

      const courseMap = new Map<string, { active: AssignmentItem[]; completed: AssignmentItem[] }>();
      for (const item of val.items) {
        if (!courseMap.has(item.courseName)) {
          courseMap.set(item.courseName, { active: [], completed: [] });
        }
        if (isCompleted(item)) {
          courseMap.get(item.courseName)!.completed.push(item);
        } else {
          courseMap.get(item.courseName)!.active.push(item);
        }
      }

      const courseGroups: CourseGroup[] = [];
      let idx = 0;
      courseMap.forEach((entry, courseName) => {
        const courseId = entry.active[0]?.courseId || entry.completed[0]?.courseId || "";
        const courseInfo = coursesInfoMap.get(courseId) || coursesInfoMap.get(courseName);

        courseGroups.push({
          courseId,
          courseName,
          accent: getCourseAccent(courseName, idx++),
          courseInfo,
          activeItems: entry.active,
          completedItems: entry.completed,
        });
      });

      result.push({
        key,
        title: val.title,
        subtitle: val.subtitle,
        order: val.order,
        courseGroups,
      });
    });

    result.sort((a, b) => a.order - b.order);
    return result;
  }, [coursesInfoMap, visibleAssignments]);

  function toggleCompletedGroup(groupKey: string) {
    setExpandedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  }

  function getAttemptForItem(item: AssignmentItem) {
    return attemptsMap.get(item.assignmentId) || attemptsMap.get(`title:${item.title.trim().toLowerCase()}`);
  }

  function renderRealResultOrMetric(item: AssignmentItem) {
    const attempt = getAttemptForItem(item);
    const catalogItem = catalogMap.get(item.testVersionId);

    if (isCompleted(item)) {
      if (attempt) {
        // Correct questions out of total questions
        if (attempt.totalQuestions > 0 && attempt.correctCount != null) {
          return (
            <div>
              <div className="text-sm font-bold text-[#1E7250] dark:text-[#6EE7B7]">
                {attempt.correctCount}/{attempt.totalQuestions} câu
              </div>
              {attempt.score != null ? (
                <div className="text-[11px] font-semibold text-[#6E7B87] dark:text-[#BEB2BC]">
                  Band {attempt.score.toFixed(1)}
                </div>
              ) : (
                <div className="text-[11px] text-[#73818C] dark:text-[#91858F]">
                  {item.evidenceReplacement ? "Minh chứng" : "Đã hoàn thành"}
                </div>
              )}
            </div>
          );
        }

        // Score / Band format
        if (attempt.score != null) {
          return (
            <div>
              <div className="text-sm font-bold text-[#1E7250] dark:text-[#6EE7B7]">
                Band {attempt.score.toFixed(1)}
              </div>
              <div className="text-[11px] text-[#73818C] dark:text-[#91858F]">
                Thang điểm {attempt.maxScore || 9.0}
              </div>
            </div>
          );
        }

        if (attempt.status === "SUBMITTED") {
          return (
            <div>
              <div className="text-xs font-bold text-[#355B82] dark:text-[#93C5FD]">
                Đã nộp bài
              </div>
              <div className="text-[11px] text-[#73818C] dark:text-[#91858F]">
                {attempt.totalQuestions > 0 ? `${attempt.totalQuestions} câu` : "Chờ chấm điểm"}
              </div>
            </div>
          );
        }
      }

      if (item.evidenceReplacement) {
        return (
          <div>
            <div className="text-xs font-bold text-[#1E7250] dark:text-[#6EE7B7]">
              Đã nộp minh chứng
            </div>
            <div className="text-[11px] text-[#73818C] dark:text-[#91858F]">
              Hoàn thành theo lớp
            </div>
          </div>
        );
      }

      return (
        <div>
          <div className="text-xs font-bold text-[#1E7250] dark:text-[#6EE7B7]">
            Đã hoàn thành
          </div>
          <div className="text-[11px] text-[#73818C] dark:text-[#91858F]">
            Đã nộp bài
          </div>
        </div>
      );
    }

    // If NOT completed: Real test question count / duration, NOT fake pts
    return (
      <div>
        <div className="text-sm font-semibold text-[#505D68] dark:text-[#F5F0F3]">
          {catalogItem?.totalItems ? `${catalogItem.totalItems} câu` : item.durationSeconds ? `${Math.round(item.durationSeconds / 60)} phút` : "40 câu"}
        </div>
        <div className="text-xs text-[#73818C] dark:text-[#BEB2BC]">
          {formatDueTime(item.closesAt)}
        </div>
      </div>
    );
  }

  async function openAssignment(item: AssignmentItem) {
    setStartingId(item.assignmentId);
    setError("");
    try {
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
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể mở đề này.");
    } finally {
      setStartingId("");
    }
  }

  async function uploadEvidence(item: AssignmentItem, file: File) {
    if (!item.classActivityId) {
      setError("Bài tập chưa được liên kết với tiến độ lớp. Vui lòng báo giáo viên kiểm tra lại.");
      return;
    }
    setUploadingId(item.assignmentId);
    setError("");
    setNotice("");
    try {
      await uploadStudentProgressEvidence(item.courseId, item.classActivityId, file);
      setNotice(`Đã nộp minh chứng cho “${item.title}”.`);
      router.push(`/student/courses/${item.courseId}?tab=assignments&activityId=${item.classActivityId}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể nộp minh chứng.");
    } finally {
      setUploadingId("");
    }
  }

  function openProgress(item: AssignmentItem) {
    if (item.classActivityId) {
      router.push(`/student/courses/${item.courseId}?tab=assignments&activityId=${item.classActivityId}`);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1240px] space-y-6 pb-20">
      {/* Top Canvas LMS Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE1E5] dark:border-[#403640] pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-1.5 rounded-sm bg-[#BD4F70] hover:bg-[#A83E5E] dark:bg-[#BE4F74] dark:hover:bg-[#A83E5E] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition active:translate-y-px"
          >
            <span>NEW ACTIVITY</span>
            <ArrowUp size={13} weight="bold" />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-[#5F6D7A] dark:text-[#BEB2BC]">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-[#BD4F70] dark:bg-[#E17A9B]" />
              {openCount} cần làm
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-[#EE3B3B]" />
              {urgentCount} gấp
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-[#27AE60]" />
              {completedCount} đã xong
            </span>
          </div>
        </div>

        {/* Filters and View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status switch */}
          <div className="flex rounded border border-[#DCE1E5] dark:border-[#403640] bg-white dark:bg-[#221E24] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`rounded px-2.5 py-1 font-semibold transition ${
                statusFilter === "ALL" ? "bg-[#BD4F70] text-white dark:bg-[#BE4F74]" : "text-[#556470] hover:text-[#222] dark:text-[#BEB2BC] dark:hover:text-[#F5F0F3]"
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("OPEN")}
              className={`rounded px-2.5 py-1 font-semibold transition ${
                statusFilter === "OPEN" ? "bg-[#BD4F70] text-white dark:bg-[#BE4F74]" : "text-[#556470] hover:text-[#222] dark:text-[#BEB2BC] dark:hover:text-[#F5F0F3]"
              }`}
            >
              Cần làm ({openCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("COMPLETED")}
              className={`rounded px-2.5 py-1 font-semibold transition ${
                statusFilter === "COMPLETED" ? "bg-[#BD4F70] text-white dark:bg-[#BE4F74]" : "text-[#556470] hover:text-[#222] dark:text-[#BEB2BC] dark:hover:text-[#F5F0F3]"
              }`}
            >
              Đã xong ({completedCount})
            </button>
          </div>

          {/* View Mode Toggle: Banner vs Compact */}
          <div className="flex rounded border border-[#DCE1E5] dark:border-[#403640] bg-white dark:bg-[#221E24] p-0.5 text-xs" title="Kiểu hiển thị thẻ khóa học">
            <button
              type="button"
              onClick={() => setViewMode("BANNER")}
              className={`inline-flex items-center gap-1 rounded px-2 py-1 font-semibold transition ${
                viewMode === "BANNER" ? "bg-[#BD4F70] text-white dark:bg-[#BE4F74]" : "text-[#556470] hover:text-[#222] dark:text-[#BEB2BC] dark:hover:text-[#F5F0F3]"
              }`}
            >
              <ImageIcon size={13} weight="bold" />
              <span className="hidden md:inline">Ảnh bìa</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("COMPACT")}
              className={`inline-flex items-center gap-1 rounded px-2 py-1 font-semibold transition ${
                viewMode === "COMPACT" ? "bg-[#BD4F70] text-white dark:bg-[#BE4F74]" : "text-[#556470] hover:text-[#222] dark:text-[#BEB2BC] dark:hover:text-[#F5F0F3]"
              }`}
            >
              <ListBullets size={13} weight="bold" />
              <span className="hidden md:inline">Tối giản</span>
            </button>
          </div>

          {/* Course filter select */}
          <div className="relative">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              aria-label="Lọc theo khóa học"
              className="h-7 rounded border border-[#DCE1E5] dark:border-[#403640] bg-white dark:bg-[#221E24] px-2 pr-6 text-xs font-medium text-[#4B5660] dark:text-[#F5F0F3] focus:border-[#E17A9B] focus:outline-hidden"
            >
              <option value="ALL">Tất cả khóa học</option>
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>

          {/* Skill filter select */}
          <div className="relative">
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value as SkillFilter)}
              aria-label="Lọc theo kỹ năng"
              className="h-7 rounded border border-[#DCE1E5] dark:border-[#403640] bg-white dark:bg-[#221E24] px-2 pr-6 text-xs font-medium text-[#4B5660] dark:text-[#F5F0F3] focus:border-[#E17A9B] focus:outline-hidden"
            >
              <option value="ALL">Tất cả kỹ năng</option>
              <option value="READING">Reading</option>
              <option value="LISTENING">Listening</option>
              <option value="WRITING">Writing</option>
              <option value="SPEAKING">Speaking</option>
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <div role="alert" className="flex items-start gap-2 rounded border border-[#E7BDB8] bg-[#FFF3F1] px-4 py-2.5 text-xs font-medium text-[#913F36]">
          <WarningCircle size={16} weight="fill" className="mt-0.5 shrink-0" />
          {error}
        </div>
      ) : null}

      {notice ? (
        <div role="status" className="flex items-start justify-between gap-3 rounded border border-[#BCDCCF] bg-[#F0FAF5] px-4 py-2.5 text-xs font-medium text-[#28654F]">
          <span className="flex items-center gap-2">
            <CheckCircle size={16} weight="fill" />
            {notice}
          </span>
          <button type="button" onClick={() => setNotice("")} className="grid size-5 place-items-center rounded hover:bg-[#DDEFE6]">
            <X size={12} />
          </button>
        </div>
      ) : null}

      {/* Main Agenda Content */}
      {loading ? (
        <div className="space-y-6" aria-label="Đang tải lịch bài tập">
          {[1, 2].map((group) => (
            <div key={group} className="space-y-3">
              <div className="h-4 w-32 animate-pulse rounded bg-[#E4E8EC] dark:bg-[#2C2630]" />
              <div className="h-28 animate-pulse rounded-md border border-[#DCE1E5] dark:border-[#403640] bg-white dark:bg-[#221E24]" />
            </div>
          ))}
        </div>
      ) : dateBuckets.length === 0 ? (
        <div className="grid min-h-60 place-items-center rounded-md border border-dashed border-[#CFD6DC] dark:border-[#403640] bg-white dark:bg-[#221E24] px-6 text-center">
          <div>
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#F0F3F6] dark:bg-[#392630] text-[#BD4F70] dark:text-[#E17A9B]">
              <CalendarBlank size={24} />
            </span>
            <h3 className="mt-3 text-sm font-bold text-[#2D3B45] dark:text-[#F5F0F3]">Không có bài tập phù hợp</h3>
            <p className="mt-1 text-xs text-[#6F7D8A] dark:text-[#BEB2BC]">Hãy thử thay đổi bộ lọc khóa học hoặc kỹ năng ở trên.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {dateBuckets.map((dateBucket) => {
            return (
              <section key={dateBucket.key} className="space-y-3" aria-labelledby={`heading-${dateBucket.key}`}>
                {/* Date Header: e.g. TODAY / Tuesday, January 22 */}
                <div className="border-b border-[#E7EBEF] dark:border-[#403640] pb-1.5">
                  <h2
                    id={`heading-${dateBucket.key}`}
                    className={`text-base font-extrabold uppercase tracking-wide ${
                      dateBucket.key === "OVERDUE" ? "text-[#D32F2F] dark:text-[#F87171]" : "text-[#2D3B45] dark:text-[#F5F0F3]"
                    }`}
                  >
                    {dateBucket.title}
                  </h2>
                  <p className="text-xs text-[#6C7A87] dark:text-[#BEB2BC]">{dateBucket.subtitle}</p>
                </div>

                {/* Course Groups under this date */}
                {dateBucket.courseGroups.length === 0 ? (
                  <div className="rounded-md border border-[#E2E6EA] dark:border-[#403640] bg-[#FCFDFE] dark:bg-[#221E24] p-4 text-xs text-[#7A8895] dark:text-[#BEB2BC]">
                    Không có hoạt động nào được giao vào thời điểm này.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {dateBucket.courseGroups.map((courseGroup) => {
                      const groupKey = `${dateBucket.key}-${courseGroup.courseName}`;
                      const isExpanded = Boolean(expandedGroups[groupKey]);
                      const hasActive = courseGroup.activeItems.length > 0;
                      const hasCompleted = courseGroup.completedItems.length > 0;
                      const courseInfo = courseGroup.courseInfo;

                      return (
                        <div
                          key={courseGroup.courseName}
                          className="group/card overflow-hidden rounded-md border border-[#DCE1E5] dark:border-[#403640] bg-white dark:bg-[#221E24] shadow-2xs transition hover:border-[#CAD2D8] dark:hover:border-[#E17A9B]"
                        >
                          {/* Top colored accent line (Canvas course color) */}
                          <div className={`h-[3px] w-full ${courseGroup.accent.topLine}`} />

                          {/* OPTION 1: COMPACT VIEW (Sleek minimalist header banner) */}
                          {viewMode === "COMPACT" ? (
                            <div className="flex items-center justify-between border-b border-[#EEF1F4] dark:border-[#403640] bg-[#F8FAFC] dark:bg-[#28212A] px-4 py-2">
                              <div className="flex items-center gap-2">
                                <span className={`size-2.5 rounded-full ${courseGroup.accent.topLine}`} />
                                <span className={`text-xs font-black uppercase tracking-wider ${courseGroup.accent.badgeText}`}>
                                  {formatCourseDisplayName(courseGroup.courseName)}
                                </span>
                                <span className="text-[11px] text-[#71808D] dark:text-[#BEB2BC]">· Khóa học</span>
                              </div>
                              <span className="text-[11px] font-semibold text-[#71808D] dark:text-[#BEB2BC]">
                                {courseGroup.activeItems.length} cần làm · {courseGroup.completedItems.length} xong
                              </span>
                            </div>
                          ) : null}

                          <div className="flex flex-col md:flex-row md:items-stretch">
                            {/* OPTION 2: BANNER VIEW (Real course cover image using CourseCoverMediaImage) */}
                            {viewMode === "BANNER" ? (
                              <div className="relative flex w-full md:w-48 shrink-0 items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-[#E4E8EC] dark:border-[#403640] p-3 min-h-[76px] bg-[#FAF8F7] dark:bg-[#28212A]">
                                {/* Real Course Cover Illustration or IELTS Spells official skill placeholder */}
                                <CourseCoverMediaImage
                                  coverImageUrl={courseInfo?.coverImageUrl}
                                  coverImageAltText={courseInfo?.coverImageAltText}
                                  courseName={courseGroup.courseName}
                                  skillPair={courseInfo?.skillPair}
                                  className="absolute inset-0 size-full"
                                  imageClassName="size-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                                />

                                {/* Subtle scrim overlay */}
                                <div className="absolute inset-0 bg-black/25 backdrop-blur-[0.5px]" />

                                {/* Centered Refined Label Badge */}
                                <div className="relative z-10 mx-auto max-w-[92%] rounded border border-white/50 dark:border-[#403640] bg-white/95 dark:bg-[#221E24]/90 px-2.5 py-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.18)] backdrop-blur-xs">
                                  <span
                                    className="block text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-center line-clamp-2 text-[#2D3B45] dark:text-[#F5F0F3]"
                                    title={courseGroup.courseName}
                                  >
                                    {formatCourseDisplayName(courseGroup.courseName)}
                                  </span>
                                </div>
                              </div>
                            ) : null}

                            {/* Right: Assignments List */}
                            <div className="flex-1 divide-y divide-[#EEF0F2] dark:divide-[#2C2630]">
                              {/* Active Unfinished Items */}
                              {hasActive ? (
                                courseGroup.activeItems.map((item) => {
                                  const inProgress = Boolean(item.activeAttemptExpiresAt);
                                  const isUrgent =
                                    item.closesAt &&
                                    new Date(item.closesAt).getTime() - Date.now() <= 86_400_000 &&
                                    new Date(item.closesAt).getTime() > Date.now();
                                  const isOverdue =
                                    item.closesAt && new Date(item.closesAt).getTime() < Date.now();
                                  const { icon: ActivityIcon, color: iconColor } = getSkillMeta(item.skill);
                                  const catalogItem = catalogMap.get(item.testVersionId);
                                  const testCoverUrl = catalogItem?.coverImage?.fileUrl;
                                  const testCoverAlt = catalogItem?.coverImage?.altText || item.title;

                                  return (
                                    <div
                                      key={item.assignmentId}
                                      className="group flex flex-wrap items-center justify-between gap-3 p-3 sm:p-3.5 sm:flex-nowrap hover:bg-[#F9FAFC] dark:hover:bg-[#2C2630] transition duration-150"
                                    >
                                      {/* Left: Blue dot + Checkbox + Real Test Illustration + Course Tag + Title + Badges */}
                                      <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
                                        {/* Blue indicator dot (active activity) */}
                                        <span className="size-2 shrink-0 rounded-full bg-[#BD4F70] dark:bg-[#E17A9B]" />

                                        {/* Rounded square checkbox */}
                                        <button
                                          type="button"
                                          onClick={() => void openAssignment(item)}
                                          title={inProgress ? "Tiếp tục làm bài" : "Bắt đầu làm bài"}
                                          className="size-5 shrink-0 rounded border-2 border-[#BAC3C9] bg-white dark:border-[#403640] dark:bg-[#2C2630] transition hover:border-[#BD4F70] dark:hover:border-[#E17A9B] flex items-center justify-center cursor-pointer"
                                        />

                                        {/* Real Test Illustration Cover */}
                                        {testCoverUrl ? (
                                          <div className="size-11 shrink-0 overflow-hidden rounded-md border border-[#DCE1E5] dark:border-[#403640] bg-[#F4F6F8] dark:bg-[#1B171C]">
                                            <PracticeCoverImage
                                              fileUrl={testCoverUrl}
                                              alt={testCoverAlt}
                                              className="size-full object-cover"
                                            />
                                          </div>
                                        ) : (
                                          <div className={`grid size-11 shrink-0 place-items-center rounded-md border border-[#E3E8EC] ${
                                            item.skill === "READING" || item.skill === "LISTENING"
                                              ? "bg-[#FDF3F5] text-[#81485A] dark:bg-[#392630] dark:text-[#E17A9B]"
                                              : "bg-[#F3EFF8] text-[#704E75] dark:bg-[#2E2436] dark:text-[#D8B4FE]"
                                          }`}>
                                            <ActivityIcon size={20} weight="regular" />
                                          </div>
                                        )}

                                        {/* Text info */}
                                        <div className="min-w-0 flex-1">
                                          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#6D7B87] dark:text-[#91858F]">
                                            {formatCourseDisplayName(courseGroup.courseName)} {item.skill} ASSIGNMENT
                                          </div>
                                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                            <button
                                              type="button"
                                              onClick={() => void openAssignment(item)}
                                              className="text-left text-sm font-semibold text-[#2D3B45] hover:text-[#BD4F70] dark:text-[#F5F0F3] dark:hover:text-[#E17A9B] hover:underline transition truncate max-w-xl"
                                            >
                                              {item.title}
                                            </button>

                                            {/* Status Badge like MISSING / URGENT / IN PROGRESS */}
                                            {isOverdue ? (
                                              <span className="rounded-full border border-[#EE3B3B] dark:border-[#F87171] dark:bg-[#391E24] px-2 py-0.2 text-[10px] font-bold uppercase tracking-wide text-[#EE3B3B] dark:text-[#F87171]">
                                                MISSING
                                              </span>
                                            ) : isUrgent ? (
                                              <span className="rounded-full border border-[#F57C00] dark:border-[#FB923C] dark:bg-[#34241B] px-2 py-0.2 text-[10px] font-bold uppercase tracking-wide text-[#F57C00] dark:text-[#FB923C]">
                                                URGENT
                                              </span>
                                            ) : inProgress ? (
                                              <span className="rounded-full border border-[#BD4F70] dark:border-[#E17A9B] dark:bg-[#392630] px-2 py-0.2 text-[10px] font-bold uppercase tracking-wide text-[#BD4F70] dark:text-[#E17A9B]">
                                                IN PROGRESS
                                              </span>
                                            ) : null}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Right: REAL result / questions count & Actions */}
                                      <div className="flex shrink-0 items-center gap-3 sm:gap-4 text-right">
                                        {renderRealResultOrMetric(item)}

                                        <div className="flex items-center gap-1.5">
                                          {/* Evidence Upload */}
                                          <label
                                            title="Nộp ảnh minh chứng"
                                            className={`inline-flex h-8 cursor-pointer items-center gap-1 rounded border border-[#D1D7DC] bg-white dark:border-[#403640] dark:bg-[#2C2630] px-2.5 text-xs font-semibold text-[#4A5560] dark:text-[#BEB2BC] shadow-2xs hover:bg-[#F2F4F7] dark:hover:bg-[#342B35] transition ${
                                              uploadingId === item.assignmentId || !item.classActivityId
                                                ? "pointer-events-none opacity-50"
                                                : ""
                                            }`}
                                          >
                                            {uploadingId === item.assignmentId ? (
                                              <CircleNotch size={13} className="animate-spin" />
                                            ) : (
                                              <UploadSimple size={13} />
                                            )}
                                            <span className="hidden sm:inline">Minh chứng</span>
                                            <input
                                              hidden
                                              type="file"
                                              accept="image/png,image/jpeg,image/webp"
                                              disabled={uploadingId === item.assignmentId || !item.classActivityId}
                                              onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) void uploadEvidence(item, file);
                                                e.target.value = "";
                                              }}
                                            />
                                          </label>

                                          {/* Primary action */}
                                          <button
                                            type="button"
                                            disabled={startingId === item.assignmentId}
                                            onClick={() => void openAssignment(item)}
                                            className="inline-flex h-8 items-center gap-1 rounded bg-[#BD4F70] dark:bg-[#BE4F74] px-3 text-xs font-bold text-white shadow-2xs hover:bg-[#A83E5E] dark:hover:bg-[#D65D86] active:translate-y-px transition disabled:opacity-60"
                                          >
                                            {startingId === item.assignmentId ? (
                                              <>
                                                <CircleNotch size={13} className="animate-spin" />
                                                <span>Mở...</span>
                                              </>
                                            ) : (
                                              <>
                                                <span>{inProgress ? "Tiếp tục" : "Làm bài"}</span>
                                                <ArrowRight size={13} weight="bold" />
                                              </>
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : null}

                              {/* Completed Items Collapsible Accordion (Canvas List View feature) */}
                              {hasCompleted ? (
                                <>
                                  <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => toggleCompletedGroup(groupKey)}
                                    className="flex items-center justify-between bg-[#FAFBFC] dark:bg-[#28212A] px-4 py-2 text-xs text-[#52606D] dark:text-[#BEB2BC] hover:bg-[#F2F4F7] dark:hover:bg-[#2C2630] cursor-pointer transition select-none"
                                  >
                                    <div className="flex items-center gap-1.5 font-medium text-[#BD4F70] dark:text-[#E17A9B]">
                                      <CaretRight
                                        size={13}
                                        weight="bold"
                                        className={`transition-transform duration-200 ${
                                          isExpanded ? "rotate-90" : ""
                                        }`}
                                      />
                                      <span>
                                        {isExpanded
                                          ? `Ẩn ${courseGroup.completedItems.length} bài đã hoàn thành`
                                          : `Show ${courseGroup.completedItems.length} completed item${
                                              courseGroup.completedItems.length > 1 ? "s" : ""
                                            }`}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="rounded-full border border-[#BAC3CB] dark:border-[#403640] dark:bg-[#221E24] px-2.5 py-0.5 text-[10px] font-semibold uppercase text-[#556470] dark:text-[#91858F]">
                                        SUBMITTED
                                      </span>
                                    </div>
                                  </div>

                                  {isExpanded ? (
                                    <div className="divide-y divide-[#EEF0F2] dark:divide-[#2C2630] bg-[#FCFDFE] dark:bg-[#221E24]">
                                      {courseGroup.completedItems.map((item) => {
                                        const { icon: ActivityIcon, color: iconColor } = getSkillMeta(item.skill);
                                        const catalogItem = catalogMap.get(item.testVersionId);
                                        const testCoverUrl = catalogItem?.coverImage?.fileUrl;
                                        const testCoverAlt = catalogItem?.coverImage?.altText || item.title;

                                        return (
                                          <div
                                            key={item.assignmentId}
                                            className="flex flex-wrap items-center justify-between gap-3 p-3.5 pl-6 sm:flex-nowrap bg-[#FAFBFD]/60 dark:bg-[#221E24] hover:bg-[#F4F6F9] dark:hover:bg-[#2C2630] transition"
                                          >
                                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                              {/* Checked Green Checkbox */}
                                              <div className="size-5 shrink-0 rounded border-2 border-[#27AE60] bg-[#27AE60] dark:border-[#10B981] dark:bg-[#10B981]/20 dark:text-[#34D399] flex items-center justify-center text-white">
                                                <Check size={12} weight="bold" />
                                              </div>

                                              {/* Real Test Illustration Cover */}
                                              {testCoverUrl ? (
                                                <div className="size-11 shrink-0 overflow-hidden rounded-md border border-[#DCE1E5] dark:border-[#403640] bg-[#F4F6F8] dark:bg-[#1B171C]">
                                                  <PracticeCoverImage
                                                    fileUrl={testCoverUrl}
                                                    alt={testCoverAlt}
                                                    className="size-full object-cover"
                                                  />
                                                </div>
                                              ) : (
                                                <div className={`grid size-11 shrink-0 place-items-center rounded-md border border-[#E3E8EC] opacity-80 ${
                                                  item.skill === "READING" || item.skill === "LISTENING"
                                                    ? "bg-[#FDF3F5] text-[#81485A]"
                                                    : "bg-[#F3EFF8] text-[#704E75]"
                                                }`}>
                                                  <ActivityIcon size={20} weight="regular" />
                                                </div>
                                              )}

                                              <div className="min-w-0 flex-1">
                                                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#8A95A0] dark:text-[#91858F]">
                                                  {formatCourseDisplayName(courseGroup.courseName)} {item.skill}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                  <span className="text-sm font-medium text-[#5F6D7A] dark:text-[#91858F] line-through truncate max-w-xl">
                                                    {item.title}
                                                  </span>
                                                  <span className="rounded-full border border-[#BAC3CB] dark:border-[#403640] dark:bg-[#2C2630] px-2 py-0.2 text-[10px] font-semibold text-[#5F6D7A] dark:text-[#BEB2BC]">
                                                    {item.evidenceReplacement ? "MINH CHỨNG" : "ĐÃ NỘP"}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>

                                            {/* REAL Test Result (Score / correct questions) */}
                                            <div className="flex shrink-0 items-center gap-3 text-right">
                                              {renderRealResultOrMetric(item)}

                                              <button
                                                type="button"
                                                disabled={!item.classActivityId}
                                                onClick={() => openProgress(item)}
                                                className="inline-flex h-7 items-center gap-1 rounded border border-[#C6CFD6] bg-white dark:border-[#403640] dark:bg-[#2C2630] px-2.5 text-xs font-semibold text-[#434E57] dark:text-[#BEB2BC] hover:bg-[#EEF1F5] dark:hover:bg-[#342B35] transition disabled:opacity-50"
                                              >
                                                Xem bài
                                                <ArrowRight size={11} />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : null}
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
