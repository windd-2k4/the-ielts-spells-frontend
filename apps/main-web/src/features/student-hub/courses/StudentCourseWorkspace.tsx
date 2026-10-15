"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  ArrowsLeftRight,
  Article,
  CalendarBlank,
  CalendarCheck,
  CaretDown,
  Check,
  CheckCircle,
  Clock,
  DownloadSimple,
  Exam,
  File,
  FileDoc,
  FilePdf,
  FileText,
  FolderOpen,
  GraduationCap,
  Headphones,
  Image as ImageIcon,
  Lightning,
  MagnifyingGlass,
  Paperclip,
  PlayCircle,
  Sparkle,
  Target,
  TrendUp,
  User,
  VideoCamera,
} from "@phosphor-icons/react";
import type { CourseWorkspaceData, StudentPortalEnrollment } from "../studentPortalApi";
import { CourseCoverMediaImage } from "./CourseCoverMediaImage";

interface StudentCourseWorkspaceProps {
  data: CourseWorkspaceData;
  enrolledCourses: StudentPortalEnrollment[];
}

type TabType = "roadmap" | "resources" | "reports";
type ResourceFilterType = "ALL" | "DOCUMENT" | "AUDIO" | "VIDEO" | "KEY";

interface ParsedDateInfo {
  dayName: string;
  dayNum: string;
  monthStr: string;
  timeStr: string;
  fullDateStr: string;
}

function parseDate(isoString: string | null | undefined): ParsedDateInfo | null {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return null;

  const days = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  const dayName = days[d.getDay()];
  const dayNum = d.getDate().toString().padStart(2, "0");
  const monthStr = `Tháng ${d.getMonth() + 1}`;
  const timeStr = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  const fullDateStr = `${dayNum}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;

  return { dayName, dayNum, monthStr, timeStr, fullDateStr };
}

function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

interface ResourceFormatMeta {
  type: "pdf" | "audio" | "video" | "key" | "doc" | "image" | "other";
  label: string;
  badgeBg: string;
  badgeText: string;
  iconBg: string;
  iconColor: string;
  iconBorder: string;
}

function getResourceFormatMeta(res: {
  title: string;
  externalUrl: string | null;
  resourceType: string;
  fileRole: string;
}): ResourceFormatMeta {
  const urlOrTitle = (res.externalUrl || res.title).toLowerCase();
  const fileRole = (res.fileRole || "").toUpperCase();
  const resourceType = (res.resourceType || "").toUpperCase();

  // 1. PDF Documents
  if (urlOrTitle.endsWith(".pdf") || resourceType === "DOCUMENT" || fileRole === "MAIN") {
    return {
      type: "pdf",
      label: "PDF Giáo trình",
      badgeBg: "bg-rose-50 border-rose-200",
      badgeText: "text-rose-700",
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
      iconBorder: "border-rose-100",
    };
  }

  // 2. Audio Files
  if (
    urlOrTitle.endsWith(".mp3") ||
    urlOrTitle.endsWith(".wav") ||
    urlOrTitle.endsWith(".m4a") ||
    resourceType === "AUDIO" ||
    fileRole === "AUDIO"
  ) {
    return {
      type: "audio",
      label: "Audio nghe",
      badgeBg: "bg-purple-50 border-purple-200",
      badgeText: "text-purple-700",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      iconBorder: "border-purple-100",
    };
  }

  // 3. Video Files
  if (
    urlOrTitle.endsWith(".mp4") ||
    urlOrTitle.endsWith(".mov") ||
    urlOrTitle.endsWith(".webm") ||
    resourceType === "VIDEO"
  ) {
    return {
      type: "video",
      label: "Video bài giảng",
      badgeBg: "bg-blue-50 border-blue-200",
      badgeText: "text-blue-700",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      iconBorder: "border-blue-100",
    };
  }

  // 4. Answer Key & Transcripts
  if (
    fileRole === "ANSWER_KEY" ||
    fileRole === "TRANSCRIPT" ||
    urlOrTitle.includes("transcript") ||
    urlOrTitle.includes("answer") ||
    urlOrTitle.includes("dap-an")
  ) {
    return {
      type: "key",
      label: fileRole === "TRANSCRIPT" ? "Transcript" : "Đáp án & Giải thích",
      badgeBg: "bg-emerald-50 border-emerald-200",
      badgeText: "text-emerald-700",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      iconBorder: "border-emerald-100",
    };
  }

  // 5. Images
  if (
    urlOrTitle.endsWith(".png") ||
    urlOrTitle.endsWith(".jpg") ||
    urlOrTitle.endsWith(".jpeg") ||
    urlOrTitle.endsWith(".webp") ||
    urlOrTitle.endsWith(".svg")
  ) {
    return {
      type: "image",
      label: "Hình ảnh",
      badgeBg: "bg-sky-50 border-sky-200",
      badgeText: "text-sky-700",
      iconBg: "bg-sky-50",
      iconColor: "text-sky-600",
      iconBorder: "border-sky-100",
    };
  }

  // 6. Word, Slide, Vocabulary
  if (
    urlOrTitle.endsWith(".doc") ||
    urlOrTitle.endsWith(".docx") ||
    urlOrTitle.endsWith(".ppt") ||
    urlOrTitle.endsWith(".pptx") ||
    fileRole === "VOCABULARY" ||
    resourceType === "VOCABULARY"
  ) {
    return {
      type: "doc",
      label: "Tài liệu học tập",
      badgeBg: "bg-amber-50 border-amber-200",
      badgeText: "text-amber-800",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      iconBorder: "border-amber-100",
    };
  }

  // 7. General File
  return {
    type: "other",
    label: "Tệp tin",
    badgeBg: "bg-stone-50 border-stone-200",
    badgeText: "text-stone-700",
    iconBg: "bg-stone-100",
    iconColor: "text-stone-600",
    iconBorder: "border-stone-200",
  };
}

export function StudentCourseWorkspace({ data, enrolledCourses }: StudentCourseWorkspaceProps) {
  const {
    course,
    enrollment,
    nextSession,
    sessions = [],
    resources = [],
    studyLogs = [],
    teacherFeedback = [],
    skills,
    goalProgress,
  } = data;

  const [activeTab, setActiveTab] = useState<TabType>("roadmap");
  const [resourceFilter, setResourceFilter] = useState<ResourceFilterType>("ALL");
  const [resourceSearch, setResourceSearch] = useState("");
  const [showCourseSwitcher, setShowCourseSwitcher] = useState(false);

  const isLR =
    course.skillPair === "LISTENING_READING" ||
    (course.skillPair != null && course.skillPair.toLowerCase().includes("listening"));

  // Identify next upcoming session from backend data
  const scheduledSession = sessions.find(
    (s) => s.status === "SCHEDULED" && s.startsAt && new Date(s.startsAt).getTime() >= Date.now(),
  );
  const activeNextSession = nextSession || scheduledSession || null;
  const nextSessionId = activeNextSession
    ? "sessionId" in activeNextSession
      ? activeNextSession.sessionId
      : activeNextSession.id
    : null;

  const activeZoomUrl = activeNextSession?.zoomUrl || course.defaultZoomUrl;
  const nextSessionDate = parseDate(activeNextSession?.startsAt);
  const nextPrepMaterials =
    activeNextSession && "prepMaterials" in activeNextSession && Array.isArray(activeNextSession.prepMaterials)
      ? activeNextSession.prepMaterials
      : null;

  const completedCount = enrollment.completedSessions || 0;
  const totalCount = enrollment.totalSessions || course.totalSessions || sessions.length || 1;
  const progressPercent = Math.min(100, Math.round((completedCount / totalCount) * 100));

  const teacherName =
    activeNextSession?.teacherName ||
    course.primaryTeacherName ||
    sessions.find((s) => s.teacherName)?.teacherName ||
    null;

  // Group sessions by phase if present
  const sessionPhases = useMemo(() => {
    const groups: { phaseName: string; sessions: typeof sessions }[] = [];
    for (const session of sessions) {
      const name = session.phaseName || "Lộ trình đào tạo";
      let grp = groups.find((g) => g.phaseName === name);
      if (!grp) {
        grp = { phaseName: name, sessions: [] };
        groups.push(grp);
      }
      grp.sessions.push(session);
    }
    return groups;
  }, [sessions]);

  // Filter resources based on search and active filter
  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      const format = getResourceFormatMeta(res);
      const matchType =
        resourceFilter === "ALL" ||
        (resourceFilter === "DOCUMENT" && format.type === "pdf") ||
        (resourceFilter === "AUDIO" && format.type === "audio") ||
        (resourceFilter === "VIDEO" && format.type === "video") ||
        (resourceFilter === "KEY" && format.type === "key");

      const q = resourceSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        res.title.toLowerCase().includes(q) ||
        (res.category && res.category.toLowerCase().includes(q)) ||
        (res.code && res.code.toLowerCase().includes(q));

      return matchType && matchSearch;
    });
  }, [resources, resourceFilter, resourceSearch]);

  const switchableCourses = enrolledCourses.filter(
    (item, idx, list) => list.findIndex((c) => c.courseId === item.courseId) === idx,
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-7 pb-24 text-[#1E1B18]">
      {/* =========================================================================
          KHU VỰC 1: TỔNG QUAN KHÓA HỌC (COURSE OVERVIEW)
         ========================================================================= */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1C1619] via-[#2A1B22] to-[#3B222D] text-white p-6 sm:p-9 shadow-xl border border-white/10">
        {/* Ambient atmospheric lighting orbs */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#E796A9]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-16 w-72 h-72 rounded-full bg-[#F4C430]/10 blur-3xl pointer-events-none" />

        {/* Top Navigation Bar: Breadcrumb & Quick Switcher */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/10 text-xs">
          <Link
            href="/student/courses"
            className="inline-flex items-center gap-1.5 font-semibold text-rose-200/90 hover:text-white transition-colors group"
          >
            <ArrowLeft size={14} weight="bold" className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Khóa học của tôi</span>
            <span className="text-white/30">/</span>
            <span className="font-mono text-rose-200 font-bold">{course.code}</span>
          </Link>

          {switchableCourses.length > 1 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCourseSwitcher(!showCourseSwitcher)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-semibold hover:bg-white/15 transition-colors shadow-2xs"
                aria-expanded={showCourseSwitcher}
                aria-haspopup="true"
              >
                <ArrowsLeftRight size={13} weight="bold" className="text-[#F4C430]" />
                <span>Đổi khóa học ({switchableCourses.length})</span>
                <CaretDown size={11} weight="bold" />
              </button>

              {showCourseSwitcher && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[#251B20] text-white rounded-2xl border border-white/15 shadow-2xl p-2 z-50 space-y-1 backdrop-blur-xl">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#F4C430]">
                    Khóa học đang tham gia
                  </div>
                  {switchableCourses.map((enr) => (
                    <Link
                      key={enr.courseId}
                      href={`/student/courses/${enr.courseId}`}
                      onClick={() => setShowCourseSwitcher(false)}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors ${
                        enr.courseId === course.id
                          ? "bg-[#894C5B] text-white font-bold"
                          : "hover:bg-white/10 text-white/80"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="truncate font-semibold">{enr.courseName}</div>
                        <div className="text-[10px] text-white/50 font-mono">{enr.courseCode}</div>
                      </div>
                      {enr.courseId === course.id && (
                        <Check size={14} weight="bold" className="shrink-0 text-[#F4C430]" />
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hero Content: Left Details & Right Cover Image */}
        <div className="relative z-10 pt-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3.5 flex-1 min-w-0">
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider font-mono">
                {course.code}
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 backdrop-blur-md border border-rose-300/30 text-rose-100 text-xs font-semibold">
                <GraduationCap size={14} weight="duotone" />
                <span>{isLR ? "Listening & Reading" : "Speaking & Writing"}</span>
              </span>

              {course.level && (
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-white/90 text-xs font-medium">
                  Cấp độ: {course.level}
                </span>
              )}

              {course.targetBand != null && (
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#F4C430] text-[#1E171A] text-xs font-extrabold shadow-xs">
                  <Target size={13} weight="bold" />
                  <span>Mục tiêu Band {course.targetBand.toFixed(1)}</span>
                </span>
              )}
            </div>

            {/* Course Title & Description */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {course.name}
              </h1>
              {course.description && (
                <p className="mt-2 text-xs sm:text-sm text-rose-100/75 leading-relaxed max-w-2xl line-clamp-2">
                  {course.description}
                </p>
              )}
            </div>

            {/* Meta Row: Teacher & Duration */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-rose-100/80 pt-0.5">
              <div className="flex items-center gap-1.5">
                <User size={14} weight="bold" className="text-[#F4C430]" />
                <span>
                  Giảng viên: <strong className="text-white font-bold">{teacherName || "Đang cập nhật"}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <CalendarBlank size={14} weight="bold" className="text-[#F4C430]" />
                <span>
                  Thời lượng:{" "}
                  <strong className="text-white font-bold">
                    {sessions.length || course.totalSessions || 0} buổi học
                  </strong>
                </span>
              </div>

              {course.startsOn && (
                <div className="flex items-center gap-1.5 text-rose-200/70">
                  <Clock size={13} />
                  <span>
                    {formatDate(course.startsOn)}
                    {course.endsOn ? ` - ${formatDate(course.endsOn)}` : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Course Progress Bar */}
            <div className="pt-1.5 max-w-md space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-200/75 font-medium">Tiến độ khóa học</span>
                <span className="font-extrabold text-[#F4C430]">
                  {completedCount}/{totalCount} buổi ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#F4C430] to-[#E796A9] transition-all duration-500 shadow-[0_0_10px_rgba(244,196,48,0.5)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right: Course Cover Media Thumbnail */}
          <div className="w-full md:w-64 shrink-0">
            <div className="relative h-36 w-full rounded-2xl overflow-hidden border border-white/20 shadow-xl bg-black/25 group">
              <CourseCoverMediaImage
                coverImageUrl={course.coverImageUrl}
                coverImageAltText={course.coverImageAltText}
                courseName={course.name}
                skillPair={course.skillPair}
                className="w-full h-full"
                imageClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-white">
                <span className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md font-mono font-bold text-rose-200">
                  {course.code}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/25 backdrop-blur-md text-emerald-300 font-bold border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Đang diễn ra
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          KHU VỰC 2: BUỔI HỌC TIẾP THEO (NEXT LESSON CARD)
         ========================================================================= */}
      {activeNextSession && (
        <section
          className="bg-white rounded-2xl border-2 border-[#E8CFD5] p-5 sm:p-6 shadow-xs hover:shadow-sm transition-shadow"
          aria-label="Buổi học tiếp theo"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            {/* Phân khu A & B: Ngày học và Thông tin buổi học */}
            <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
              {/* Phân khu A. Ngày học (Calendar Date Tile) */}
              {nextSessionDate ? (
                <div
                  className="shrink-0 w-20 h-22 sm:w-24 sm:h-24 rounded-2xl bg-[#894C5B] text-white flex flex-col items-center justify-center text-center p-2.5 shadow-md shadow-rose-950/15"
                  aria-label={`Lịch học: ${nextSessionDate.dayName}, ngày ${nextSessionDate.dayNum} ${nextSessionDate.monthStr}`}
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider opacity-90 leading-none">
                    {nextSessionDate.dayName}
                  </span>
                  <span className="text-3xl sm:text-4xl font-black leading-tight my-0.5">
                    {nextSessionDate.dayNum}
                  </span>
                  <span className="text-[10px] font-semibold opacity-90 leading-none">
                    {nextSessionDate.monthStr}
                  </span>
                </div>
              ) : (
                <div className="shrink-0 w-20 h-22 sm:w-24 sm:h-24 rounded-2xl bg-[#894C5B] text-white flex flex-col items-center justify-center text-center p-2.5">
                  <Clock size={28} weight="bold" />
                  <span className="text-[10px] font-semibold mt-1 opacity-90">Chưa xếp giờ</span>
                </div>
              )}

              {/* Phân khu B. Thông tin buổi học */}
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#894C5B] text-white text-[11px] font-bold uppercase font-mono tracking-wider">
                    <Lightning size={12} weight="fill" className="text-[#F4C430]" />
                    Buổi {activeNextSession.sessionNo}
                  </span>
                  <span className="text-xs font-bold text-[#894C5B] bg-[#F7E5EA] px-2.5 py-0.5 rounded-full">
                    Sắp diễn ra
                  </span>
                  {nextSessionDate && (
                    <span className="text-xs text-[#5C5752] flex items-center gap-1 font-medium">
                      <Clock size={13} />
                      <span>
                        {nextSessionDate.timeStr} • {nextSessionDate.fullDateStr}
                      </span>
                    </span>
                  )}
                </div>

                <h2 className="text-base sm:text-lg font-bold text-[#1E1B18] leading-snug truncate">
                  {activeNextSession.title || `Buổi học số ${activeNextSession.sessionNo}`}
                </h2>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5C5752]">
                  <span className="flex items-center gap-1">
                    <User size={13} weight="bold" className="text-[#894C5B]" />
                    <span>
                      Giảng viên:{" "}
                      <strong className="text-[#1E1B18]">
                        {activeNextSession.teacherName || teacherName || "Đang cập nhật"}
                      </strong>
                    </span>
                  </span>
                  {activeNextSession.phaseName && (
                    <span>
                      • Giai đoạn:{" "}
                      <strong className="text-[#1E1B18]">{activeNextSession.phaseName}</strong>
                    </span>
                  )}
                </div>

                {nextPrepMaterials && nextPrepMaterials.length > 0 && (
                  <p className="text-xs text-[#5C5752] pt-0.5 line-clamp-1">
                    <span className="font-semibold text-[#894C5B]">Chuẩn bị:</span>{" "}
                    {nextPrepMaterials.join(", ")}
                  </p>
                )}
              </div>
            </div>

            {/* Phân khu C. Hành động (Action CTA) */}
            {activeZoomUrl && (
              <div className="shrink-0 pt-2 md:pt-0">
                <a
                  href={activeZoomUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#894C5B] hover:bg-[#6D3845] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all shrink-0 w-full md:w-auto"
                >
                  <VideoCamera size={18} weight="fill" />
                  <span>Vào phòng học Zoom</span>
                  <ArrowRight size={14} weight="bold" />
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =========================================================================
          ĐIỀU HƯỚNG TAB CHÍNH (3 TABS SEGMENTED CONTROL)
         ========================================================================= */}
      <nav
        className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-[#E8CFD5] shadow-xs overflow-x-auto"
        aria-label="Các phân khu chức năng khóa học"
      >
        <button
          type="button"
          onClick={() => setActiveTab("roadmap")}
          className={`min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "roadmap"
              ? "bg-[#894C5B] text-white shadow-xs"
              : "bg-transparent text-[#5C5752] hover:text-[#1E1B18] hover:bg-[#FAF8F5]"
          }`}
        >
          <CalendarCheck size={16} weight={activeTab === "roadmap" ? "fill" : "regular"} />
          <span>Lộ trình bài học</span>
          <span
            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
              activeTab === "roadmap" ? "bg-white/20 text-white" : "bg-stone-100 text-[#5C5752]"
            }`}
          >
            {sessions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("resources")}
          className={`min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "resources"
              ? "bg-[#894C5B] text-white shadow-xs"
              : "bg-transparent text-[#5C5752] hover:text-[#1E1B18] hover:bg-[#FAF8F5]"
          }`}
        >
          <FolderOpen size={16} weight={activeTab === "resources" ? "fill" : "regular"} />
          <span>Kho tài liệu</span>
          <span
            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
              activeTab === "resources" ? "bg-white/20 text-white" : "bg-stone-100 text-[#5C5752]"
            }`}
          >
            {resources.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "reports"
              ? "bg-[#894C5B] text-white shadow-xs"
              : "bg-transparent text-[#5C5752] hover:text-[#1E1B18] hover:bg-[#FAF8F5]"
          }`}
        >
          <TrendUp size={16} weight={activeTab === "reports" ? "fill" : "regular"} />
          <span>Kết quả & Nhận xét</span>
          <span
            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
              activeTab === "reports" ? "bg-white/20 text-white" : "bg-stone-100 text-[#5C5752]"
            }`}
          >
            {studyLogs.length}
          </span>
        </button>
      </nav>

      {/* =========================================================================
          KHU VỰC 3: TAB LỘ TRÌNH BÀI HỌC (LEARNING ROADMAP)
         ========================================================================= */}
      {activeTab === "roadmap" && (
        <section className="space-y-7" aria-label="Lộ trình các buổi học">
          {sessionPhases.map((phase) => (
            <div key={phase.phaseName} className="space-y-4">
              {/* Module / Phase Header */}
              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1 rounded-lg bg-[#894C5B] text-white text-xs font-bold uppercase tracking-wider">
                  {phase.phaseName}
                </div>
                <div className="h-px flex-1 bg-[#E8CFD5]" />
                <span className="text-xs text-[#5C5752] font-semibold">
                  {phase.sessions.length} buổi học
                </span>
              </div>

              {/* Sessions List in this Module */}
              <div className="space-y-3.5">
                {phase.sessions.map((session) => {
                  const isCompleted = session.status === "COMPLETED";
                  const isNext = nextSessionId === session.id;
                  const sessionDate = parseDate(session.startsAt);
                  const sessionZoom = session.zoomUrl || (isNext ? course.defaultZoomUrl : null);

                  return (
                    <article
                      key={session.id}
                      className={`rounded-2xl border p-5 transition-all duration-200 ${
                        isNext
                          ? "border-2 border-[#894C5B] bg-[#FFFDF8] ring-2 ring-[#894C5B]/15 shadow-xs"
                          : isCompleted
                          ? "border-[#E8E2D5] bg-white opacity-95 hover:border-[#894C5B]/40"
                          : "border-[#E8E2D5] bg-white hover:border-[#894C5B]/40"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        {/* Session Identity & Title */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-[#894C5B] text-white text-xs font-bold font-mono">
                              Buổi {session.sessionNo}
                            </span>

                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                                <CheckCircle size={13} weight="fill" />
                                <span>Đã hoàn thành</span>
                              </span>
                            ) : isNext ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#F7E5EA] text-[#894C5B] text-xs font-bold border border-[#EAC2CD]">
                                <Sparkle size={12} weight="fill" />
                                <span>Buổi tiếp theo</span>
                              </span>
                            ) : (
                              <span className="text-xs text-[#5C5752] bg-stone-100 px-2 py-0.5 rounded-md font-medium">
                                Sắp diễn ra
                              </span>
                            )}

                            {sessionDate && (
                              <span className="text-xs text-[#5C5752] flex items-center gap-1 font-medium">
                                <Clock size={12} />
                                <span>
                                  {sessionDate.dayName}, {sessionDate.fullDateStr} lúc {sessionDate.timeStr}
                                </span>
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-sm sm:text-base text-[#1E1B18]">
                            {session.title || `Buổi học ${session.sessionNo}`}
                          </h3>

                          {session.content && (
                            <p className="text-xs sm:text-sm text-[#5C5752] leading-relaxed">
                              {session.content}
                            </p>
                          )}
                        </div>

                        {/* Direct Zoom CTA if Scheduled */}
                        {sessionZoom && !isCompleted && (
                          <a
                            href={sessionZoom}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#894C5B] hover:bg-[#6D3845] text-white text-xs font-bold shrink-0 transition-colors shadow-2xs"
                          >
                            <VideoCamera size={14} weight="fill" />
                            <span>Vào Zoom</span>
                          </a>
                        )}
                      </div>

                      {/* Attachments Footer: Materials & Assignments */}
                      {((session.materials && session.materials.length > 0) ||
                        (session.assignments && session.assignments.length > 0)) && (
                        <div className="pt-3 mt-3 border-t border-[#F1ECE4] flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                          {/* Attached Materials */}
                          {session.materials && session.materials.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[#5C5752] font-semibold flex items-center gap-1">
                                <Paperclip size={13} /> Tài liệu:
                              </span>
                              {session.materials.map((m) => (
                                <a
                                  key={m.id}
                                  href={m.externalUrl || "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E8E2D5] text-[#292528] hover:text-[#894C5B] hover:border-[#894C5B] transition-colors"
                                >
                                  <FileText size={13} className="text-[#894C5B]" />
                                  <span className="truncate max-w-[200px] font-medium">{m.title}</span>
                                  <ArrowSquareOut size={11} className="text-[#5C5752]" />
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Attached Assignments */}
                          {session.assignments && session.assignments.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[#5C5752] font-semibold flex items-center gap-1">
                                <Exam size={13} /> Bài tập:
                              </span>
                              {session.assignments.map((a) => (
                                <span
                                  key={a.id}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F7E5EA] border border-[#EAC2CD] text-[#894C5B] font-semibold"
                                >
                                  <span>{a.title}</span>
                                  {a.score != null ? (
                                    <strong className="text-emerald-700 bg-emerald-100/80 px-1 rounded text-[11px]">
                                      {a.score}đ
                                    </strong>
                                  ) : (
                                    <span className="text-[10px] bg-[#894C5B] text-white px-1 rounded">
                                      Chưa làm
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* =========================================================================
          KHU VỰC 4: TAB KHO TÀI LIỆU (COURSE MATERIALS)
         ========================================================================= */}
      {activeTab === "resources" && (
        <section className="space-y-4" aria-label="Kho tài liệu khóa học">
          {/* Header & Controls: Search & Category Filter Chips */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8CFD5] space-y-3.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#1E1B18] flex items-center gap-2">
                  <FolderOpen size={18} weight="bold" className="text-[#894C5B]" />
                  <span>Kho tài liệu học tập</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F7E5EA] text-[#894C5B]">
                    {resources.length} tài liệu
                  </span>
                </h2>
                <p className="text-xs text-[#5C5752] mt-0.5">
                  Tải về giáo trình, audio luyện nghe và tài liệu tham khảo cho các buổi học.
                </p>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-72">
                <MagnifyingGlass
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C5752]"
                />
                <input
                  type="text"
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                  placeholder="Tìm tên giáo trình, audio..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8CFD5] text-xs sm:text-sm text-[#1E1B18] placeholder-[#8C857B] focus:outline-hidden focus:border-[#894C5B] transition-colors"
                />
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold pt-1 border-t border-[#F1ECE4]">
              {[
                { key: "ALL", label: "Tất cả" },
                { key: "DOCUMENT", label: "PDF Giáo trình" },
                { key: "AUDIO", label: "Audio nghe" },
                { key: "VIDEO", label: "Video bài giảng" },
                { key: "KEY", label: "Đáp án & Transcript" },
              ].map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setResourceFilter(chip.key as ResourceFilterType)}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-lg transition-colors ${
                    resourceFilter === chip.key
                      ? "bg-[#894C5B] text-white font-bold shadow-2xs"
                      : "bg-[#FAF8F5] text-[#5C5752] hover:text-[#1E1B18] hover:bg-stone-100"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resources Grid */}
          {filteredResources.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-[#E8CFD5] p-12 text-center space-y-3">
              <FolderOpen size={40} weight="duotone" className="text-[#894C5B] mx-auto" />
              <h3 className="font-bold text-sm text-[#1E1B18]">
                {resourceSearch
                  ? `Không tìm thấy tài liệu phù hợp với từ khóa "${resourceSearch}"`
                  : "Chưa có tài liệu nào trong phân loại này"}
              </h3>
              <p className="text-xs text-[#5C5752] max-w-sm mx-auto">
                {resourceSearch
                  ? "Hãy thử tìm kiếm với từ khóa khác hoặc chuyển sang mục 'Tất cả'."
                  : "Giảng viên chưa tải lên tài liệu cho danh mục này."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredResources.map((res) => {
                const formatMeta = getResourceFormatMeta(res);

                return (
                  <article
                    key={res.id}
                    className="bg-white rounded-2xl border border-[#E8E2D5] p-4 flex items-center justify-between gap-3.5 hover:border-[#894C5B]/40 hover:shadow-xs transition-all group"
                  >
                    {/* Format Icon on Left */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${formatMeta.iconBg} ${formatMeta.iconColor} ${formatMeta.iconBorder}`}
                      title={formatMeta.label}
                    >
                      {formatMeta.type === "pdf" ? (
                        <FilePdf size={24} weight="duotone" />
                      ) : formatMeta.type === "audio" ? (
                        <Headphones size={24} weight="duotone" />
                      ) : formatMeta.type === "video" ? (
                        <VideoCamera size={24} weight="duotone" />
                      ) : formatMeta.type === "key" ? (
                        <Article size={24} weight="duotone" />
                      ) : formatMeta.type === "image" ? (
                        <ImageIcon size={24} weight="duotone" />
                      ) : formatMeta.type === "doc" ? (
                        <FileDoc size={24} weight="duotone" />
                      ) : (
                        <File size={24} weight="duotone" />
                      )}
                    </div>

                    {/* Middle Info: Title, Session & Category */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span
                          className={`font-bold uppercase tracking-wider px-2 py-0.2 rounded border ${formatMeta.badgeBg} ${formatMeta.badgeText}`}
                        >
                          {formatMeta.label}
                        </span>
                        {res.sessionNo && (
                          <span className="text-[#5C5752] font-mono">
                            • Buổi {res.sessionNo}
                          </span>
                        )}
                      </div>

                      <h3
                        className="font-bold text-xs sm:text-sm text-[#1E1B18] line-clamp-2 leading-snug group-hover:text-[#894C5B] transition-colors"
                        title={res.title}
                      >
                        {res.title}
                      </h3>

                      {res.category && (
                        <p className="text-[11px] text-[#5C5752] truncate">{res.category}</p>
                      )}
                    </div>

                    {/* Right: Download / Open Action */}
                    {res.externalUrl ? (
                      <a
                        href={res.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[#FAF8F5] hover:bg-[#894C5B] hover:text-white text-[#894C5B] border border-[#E8CFD5] transition-all shrink-0"
                        title="Tải về hoặc mở tài liệu"
                        aria-label={`Mở hoặc tải về tài liệu ${res.title}`}
                      >
                        <DownloadSimple size={18} weight="bold" />
                      </a>
                    ) : (
                      <span
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-stone-50 text-stone-300 shrink-0"
                        title="Tài liệu chưa có liên kết tải"
                      >
                        <DownloadSimple size={18} />
                      </span>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          KHU VỰC 5: TAB KẾT QUẢ & NHẬN XÉT (RESULTS & FEEDBACK)
         ========================================================================= */}
      {activeTab === "reports" && (
        <section className="space-y-6" aria-label="Báo cáo kết quả và nhận xét">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4.5 rounded-2xl bg-white border border-[#E8CFD5] space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C5752] block">
                Buổi đã hoàn thành
              </span>
              <strong className="text-xl sm:text-2xl font-black text-[#894C5B]">
                {completedCount}/{totalCount}
              </strong>
              <small className="text-[11px] text-[#5C5752] block">{progressPercent}% lộ trình</small>
            </div>

            <div className="p-4.5 rounded-2xl bg-white border border-[#E8CFD5] space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C5752] block">
                Bài tập hoàn thành
              </span>
              <strong className="text-xl sm:text-2xl font-black text-[#894C5B]">
                {studyLogs.length}
              </strong>
              <small className="text-[11px] text-[#5C5752] block">Từ hệ thống luyện đề</small>
            </div>

            <div className="p-4.5 rounded-2xl bg-white border border-[#E8CFD5] space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C5752] block">
                Mục tiêu Band
              </span>
              <strong className="text-xl sm:text-2xl font-black text-emerald-700">
                {course.targetBand ? course.targetBand.toFixed(1) : "--"}
              </strong>
              <small className="text-[11px] text-[#5C5752] block">
                Hiện tại: {skills?.overallBand ? skills.overallBand.toFixed(1) : "Đang đánh giá"}
              </small>
            </div>

            <div className="p-4.5 rounded-2xl bg-white border border-[#E8CFD5] space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C5752] block">
                Chuyên cần
              </span>
              <strong className="text-xl sm:text-2xl font-black text-blue-700">
                {goalProgress?.sessionAttendanceRate != null
                  ? `${goalProgress.sessionAttendanceRate}%`
                  : "100%"}
              </strong>
              <small className="text-[11px] text-[#5C5752] block">Tỷ lệ tham gia buổi học</small>
            </div>
          </div>

          {/* Teacher Review Quote Note */}
          {teacherFeedback.length > 0 && teacherFeedback[0].feedback ? (
            <div className="rounded-2xl bg-[#FAF8F5] border border-[#E8CFD5] p-5 sm:p-6 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-[#894C5B]">
                <User size={16} weight="bold" />
                <span>Nhận xét từ giảng viên {teacherFeedback[0].teacherName}</span>
                {teacherFeedback[0].reviewedAt && (
                  <span className="text-[#5C5752] font-normal">
                    • {new Date(teacherFeedback[0].reviewedAt).toLocaleDateString("vi-VN")}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[#1E1B18] italic leading-relaxed pt-1">
                "{teacherFeedback[0].feedback}"
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white border border-[#E8E2D5] p-6 text-center text-xs text-[#5C5752]">
              Chưa có nhận xét nào từ giảng viên cho khóa học này.
            </div>
          )}

          {/* Practice History Table */}
          <div className="bg-white rounded-2xl border border-[#E8CFD5] p-5 sm:p-6 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#1E1B18] flex items-center gap-1.5">
                <Exam size={16} weight="bold" className="text-[#894C5B]" />
                <span>Nhật ký học tập & Lịch sử làm bài</span>
              </h3>
              <span className="text-xs font-semibold text-[#5C5752]">
                {studyLogs.length} bài đã nộp
              </span>
            </div>

            {studyLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#5C5752]">
                Bạn chưa hoàn thành bài luyện tập nào trong khóa học này.
              </div>
            ) : (
              <div className="divide-y divide-[#F1ECE4]">
                {studyLogs.map((log) => (
                  <div
                    key={log.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-bold text-[#1E1B18] truncate">{log.testTitle}</div>
                      <div className="text-[11px] text-[#5C5752]">
                        {log.skill}
                        {log.completedAt
                          ? ` • ${new Date(log.completedAt).toLocaleDateString("vi-VN")}`
                          : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 pt-1 sm:pt-0">
                      {log.score != null ? (
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                          {log.correctCount != null
                            ? `${log.correctCount}/${log.totalQuestions} câu`
                            : `${log.score}/${log.maxScore}`}
                        </span>
                      ) : null}

                      {log.reviewUrl && (
                        <a
                          href={log.reviewUrl}
                          className="inline-flex items-center gap-1 text-[#894C5B] hover:underline font-semibold"
                        >
                          <span>Xem lại</span>
                          <ArrowSquareOut size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
