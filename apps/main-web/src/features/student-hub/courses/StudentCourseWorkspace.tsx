"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import StudentProgressTracker from "./StudentProgressTracker";
import StudentPortfolio from "./StudentPortfolio";
import {
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  Bell,
  BookOpen,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  ChartBar,
  ChatCircleDots,
  Check,
  CheckCircle,
  Clock,
  Exam,
  FileText,
  FolderOpen,
  GraduationCap,
  Headphones,
  House,
  Info,
  Lightning,
  List,
  MagnifyingGlass,
  Microphone,
  NotePencil,
  PencilLine,
  PlayCircle,
  SquaresFour,
  Sparkle,
  User,
  Users,
  VideoCamera,
  Warning,
} from "@phosphor-icons/react";
import type { CourseWorkspaceData } from "../studentPortalApi";
import { apiMediaUrl } from "@/lib/api";
import styles from "./StudentCourseWorkspace.module.css";

interface StudentCourseWorkspaceProps {
  data: CourseWorkspaceData;
}

type WorkspaceTab =
  | "overview"
  | "lessons"
  | "assignments"
  | "portfolio"
  | "schedule"
  | "resources"
  | "discussion"
  | "scores"
  | "members";

type Session = CourseWorkspaceData["sessions"][number];
type Assignment = Session["assignments"][number] & { sessionNo: number; sessionTitle: string };

const TAB_ITEMS: Array<{ id: WorkspaceTab; label: string; icon: typeof House }> = [
  { id: "overview", label: "Tổng quan", icon: House },
  { id: "lessons", label: "Bài học", icon: BookOpen },
  { id: "assignments", label: "Bài tập", icon: NotePencil },
  { id: "portfolio", label: "Portfolio", icon: FileText },
  { id: "schedule", label: "Lịch học", icon: CalendarBlank },
  { id: "resources", label: "Kho học liệu", icon: FolderOpen },
  { id: "discussion", label: "Thảo luận", icon: ChatCircleDots },
  { id: "scores", label: "Điểm số", icon: ChartBar },
  { id: "members", label: "Thành viên", icon: Users },
];

const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function formatDate(value: string | null | undefined) {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function formatTime(value: string | null | undefined) {
  if (!value) return "Chưa xếp giờ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa xếp giờ";
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

function startOfWeek(value: Date) {
  const date = new Date(value);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value: Date, amount: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

function isSameDay(first: Date, second: Date) {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

function formatWeekRange(start: Date) {
  const end = addDays(start, 6);
  const startText = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(start);
  const endText = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(end);
  return `${startText} – ${endText}`;
}

function scorePercent(score: number | null, maxScore: number | null) {
  if (score == null || maxScore == null || maxScore <= 0) return null;
  return Math.round((score / maxScore) * 100);
}

function isCompleteStatus(status: string) {
  return ["COMPLETED", "SUBMITTED", "GRADED", "DONE", "WAITING_REVIEW"].includes(status.toUpperCase());
}

function SmartLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  if (/^https?:\/\//i.test(href)) {
    return <a href={href} target="_blank" rel="noreferrer" className={className}>{children}</a>;
  }
  return <Link href={href} className={className}>{children}</Link>;
}

function PanelHeader({
  icon,
  title,
  count,
  action,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className={styles.panelHeader}>
      <div className={styles.panelTitle}>
        <span className={styles.panelTitleIcon}>{icon}</span>
        <h2>{title}</h2>
        {count != null && count > 0 ? <span className={styles.countBadge}>{count}</span> : null}
      </div>
      {action && onAction ? (
        <button type="button" className={styles.textAction} onClick={onAction}>
          {action}<ArrowRight size={14} weight="bold" />
        </button>
      ) : null}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className={styles.emptyState}><CheckCircle size={22} weight="duotone" /><span>{children}</span></div>;
}

export function StudentCourseWorkspace({ data }: StudentCourseWorkspaceProps) {
  const {
    course,
    enrollment,
    goalProgress,
    nextAction,
    nextSession,
    sessions = [],
    resources = [],
    studyLogs = [],
    teacherFeedback = [],
  } = data;
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const requestedTab = searchParams.get("tab");
  const focusActivityId = searchParams.get("activityId");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() => (
    TAB_ITEMS.some((item) => item.id === requestedTab)
      && (requestedTab !== "portfolio" || course.skillPair === "SPEAKING_WRITING")
      ? requestedTab as WorkspaceTab : "overview"
  ));
  const visibleTabItems = TAB_ITEMS.filter((item) => item.id !== "portfolio" || course.skillPair === "SPEAKING_WRITING");

  const now = Date.now();
  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => {
      const left = a.startsAt ? new Date(a.startsAt).getTime() : Number.MAX_SAFE_INTEGER;
      const right = b.startsAt ? new Date(b.startsAt).getTime() : Number.MAX_SAFE_INTEGER;
      return left - right;
    }),
    [sessions],
  );
  const upcomingSessions = sortedSessions.filter((session) =>
    session.status !== "CANCELLED" && session.startsAt && new Date(session.startsAt).getTime() >= now,
  );
  const scheduledSession = upcomingSessions[0] ?? sessions.find((session) => session.status === "SCHEDULED") ?? null;
  const activeNextSession = nextSession ?? scheduledSession;
  const activeZoomUrl = activeNextSession?.zoomUrl || course.defaultZoomUrl;
  const completedCount = enrollment.completedSessions || 0;
  const totalCount = enrollment.totalSessions || course.totalSessions || sessions.length || 1;
  const progressPercent = Math.min(100, Math.round((completedCount / totalCount) * 100));
  const teacherName = activeNextSession?.teacherName || course.primaryTeacherName || sessions.find((item) => item.teacherName)?.teacherName || "Đang cập nhật";
  const assignments: Assignment[] = sessions.flatMap((session) => session.assignments.map((assignment) => ({
    ...assignment,
    sessionNo: session.sessionNo,
    sessionTitle: session.title || `Buổi ${session.sessionNo}`,
  })));
  const pendingAssignments = assignments.filter((assignment) => !isCompleteStatus(assignment.status));
  const courseStudyLogs = studyLogs.filter((log) => course.skillPair === "SPEAKING_WRITING"
    ? ["SPEAKING", "WRITING"].includes(log.skill)
    : ["LISTENING", "READING"].includes(log.skill));
  const scopedNextAction = nextAction && (course.skillPair === "SPEAKING_WRITING"
    ? !/\/(reading|listening)\//i.test(nextAction.ctaUrl)
    : !/\/(writing|speaking)\//i.test(nextAction.ctaUrl)) ? nextAction : null;
  const lowScoreLog = courseStudyLogs.find((log) => {
    const percent = scorePercent(log.score, log.maxScore);
    return percent != null && percent < 60;
  });
  const calendarDays = useMemo(() => {
    const anchor = activeNextSession?.startsAt ? new Date(activeNextSession.startsAt) : new Date();
    const start = new Date(anchor);
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
    return Array.from({ length: 7 }, (_, index) => {
      const value = new Date(start);
      value.setDate(start.getDate() + index);
      return value;
    });
  }, [activeNextSession?.startsAt]);

  function openTab(tab: WorkspaceTab) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    window.requestAnimationFrame(() => document.getElementById("course-workspace-content")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div className={styles.workspace}>
      <header className={styles.courseToolbar} aria-labelledby="course-title">
        <div className={styles.courseIdentity}>
          <Link href="/student/courses" className={styles.courseBack} aria-label="Quay lại khóa học của tôi">
            <ArrowLeft size={17} weight="bold" />
          </Link>
          <div>
            <span>{course.code} · {course.skillPair === "SPEAKING_WRITING" ? "Speaking & Writing" : "Listening & Reading"}</span>
            <strong id="course-title">{course.name}</strong>
          </div>
        </div>
        <nav className={styles.navTabsContainer} aria-label="Điều hướng khóa học">
          {visibleTabItems.map((item) => {
            const Icon = item.icon;
            const badge = item.id === "assignments" ? pendingAssignments.length : item.id === "resources" ? resources.length : 0;
            return (
              <button type="button" key={item.id} className={`${styles.navTabBtn} ${activeTab === item.id ? styles.navTabActive : ""}`} onClick={() => openTab(item.id)} aria-current={activeTab === item.id ? "page" : undefined}>
                <Icon size={17} weight={activeTab === item.id ? "fill" : "regular"} />
                <span>{item.label}</span>
                {badge > 0 ? <span className={styles.tabBadge}>{badge}</span> : null}
              </button>
            );
          })}
        </nav>
        <div className={styles.compactProgress} aria-label={`Tiến độ khóa học ${progressPercent}%`}><span style={{ width: `${progressPercent}%` }} /></div>
      </header>

      <section id="course-workspace-content" className={styles.moduleContent} aria-label="Nội dung khóa học">
        {activeTab === "overview" ? (
          <OverviewDashboard
            course={course}
            enrollment={enrollment}
            goalProgress={goalProgress}
            nextAction={scopedNextAction}
            activeNextSession={activeNextSession}
            activeZoomUrl={activeZoomUrl}
            sessions={sortedSessions}
            upcomingSessions={upcomingSessions}
            calendarDays={calendarDays}
            pendingAssignments={pendingAssignments}
            lowScoreLog={lowScoreLog}
            progressPercent={progressPercent}
            completedCount={completedCount}
            totalCount={totalCount}
            onOpenTab={openTab}
          />
        ) : (
          <DetailPanel
            courseId={course.id}
            activeTab={activeTab}
            sessions={sortedSessions}
            resources={resources}
            studyLogs={courseStudyLogs}
            teacherFeedback={teacherFeedback}
            teacherName={teacherName}
            capacity={course.capacity}
            focusActivityId={focusActivityId}
          />
        )}
      </section>
    </div>
  );
}

function OverviewDashboard({
  course,
  enrollment,
  goalProgress,
  nextAction,
  activeNextSession,
  activeZoomUrl,
  sessions,
  upcomingSessions,
  calendarDays,
  pendingAssignments,
  lowScoreLog,
  progressPercent,
  completedCount,
  totalCount,
  onOpenTab,
}: {
  course: CourseWorkspaceData["course"];
  enrollment: CourseWorkspaceData["enrollment"];
  goalProgress: CourseWorkspaceData["goalProgress"];
  nextAction: CourseWorkspaceData["nextAction"] | null;
  activeNextSession: CourseWorkspaceData["nextSession"] | Session | null;
  activeZoomUrl: string | null;
  sessions: Session[];
  upcomingSessions: Session[];
  calendarDays: Date[];
  pendingAssignments: Assignment[];
  lowScoreLog: CourseWorkspaceData["studyLogs"][number] | undefined;
  progressPercent: number;
  completedCount: number;
  totalCount: number;
  onOpenTab: (tab: WorkspaceTab) => void;
}) {
  const inProgressItems = [
    nextAction?.title ? {
      title: nextAction.title,
      description: nextAction.description,
      meta: nextAction.deadline ? `Hạn ${formatDate(nextAction.deadline)}` : "Theo lộ trình khóa học",
      href: nextAction.ctaUrl,
      label: nextAction.ctaLabel || "Thực hiện",
      icon: FileText,
      badge: nextAction.contextBadge || "VIỆC CẦN LÀM",
      context: nextAction.actionType === "UPCOMING_SESSION" ? "Buổi học trực tuyến" : "Trong khóa học này",
      tab: (["ASSIGNMENT_DUE", "REVISION_REQUIRED"].includes(nextAction.actionType)
        ? "assignments"
        : nextAction.actionType === "UPCOMING_SESSION" ? "schedule" : "lessons") as WorkspaceTab,
    } : null,
    activeNextSession ? {
      title: activeNextSession.title || `Buổi học ${activeNextSession.sessionNo}`,
      description: "Chuẩn bị tài liệu và tham gia đúng giờ theo lịch của khóa học.",
      meta: `${formatTime(activeNextSession.startsAt)} · ${formatDate(activeNextSession.startsAt)}`,
      href: activeZoomUrl || "#course-workspace-content",
      label: activeZoomUrl ? "Vào học" : "Xem lịch",
      icon: PlayCircle,
      badge: "BUỔI HỌC SẮP TỚI",
      context: activeZoomUrl ? "Online · Zoom" : "Lịch học",
      tab: "schedule" as WorkspaceTab,
    } : null,
    pendingAssignments[0] ? {
      title: pendingAssignments[0].title,
      description: `Bài tập ${pendingAssignments[0].status === "NEEDS_REVISION" ? "đang cần chỉnh sửa" : "đang chờ bạn hoàn thành"}.`,
      meta: pendingAssignments[0].sessionTitle,
      href: "#course-workspace-content",
      label: "Xem bài",
      icon: Exam,
      badge: "BÀI ĐƯỢC GIAO",
      context: pendingAssignments[0].status,
      tab: "assignments" as WorkspaceTab,
    } : null,
  ].filter(Boolean) as Array<{ title: string; description: string; meta: string; href: string; label: string; icon: typeof House; badge: string; context: string; tab: WorkspaceTab }>;

  const featuredItem = inProgressItems[0] ?? null;
  const FeaturedIcon = featuredItem?.icon || PlayCircle;
  const weekStart = new Date(calendarDays[0]);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000);
  const weekSessions = sessions.filter((session) => {
    if (!session.startsAt) return false;
    const startsAt = new Date(session.startsAt).getTime();
    return startsAt >= weekStart.getTime() && startsAt < weekEnd.getTime();
  });
  const displayedSessions = (weekSessions.length ? weekSessions : upcomingSessions).slice(0, 4);
  const learnedDays = new Set(
    weekSessions
      .filter((session) => session.status === "COMPLETED" && session.startsAt)
      .map((session) => new Date(session.startsAt as string).toDateString()),
  ).size;
  const weeklyTarget = Math.max(goalProgress.weeklyTarget || weekSessions.length, 1);
  const weeklyCompleted = Math.min(goalProgress.weeklyCompletedCount, weeklyTarget);
  const weeklyPercent = Math.min(100, Math.round((weeklyCompleted / weeklyTarget) * 100));

  const startsOn = new Date(course.startsOn);
  const endsOn = course.endsOn ? new Date(course.endsOn) : null;
  const validStart = !Number.isNaN(startsOn.getTime());
  const validEnd = endsOn && !Number.isNaN(endsOn.getTime());
  const totalWeeks = validStart && validEnd
    ? Math.max(1, Math.ceil((endsOn.getTime() - startsOn.getTime() + 86_400_000) / (7 * 86_400_000)))
    : Math.max(1, Math.ceil(totalCount / 2));
  const roadmapAnchor = activeNextSession?.startsAt ? new Date(activeNextSession.startsAt) : new Date();
  const currentWeek = validStart
    ? Math.min(totalWeeks, Math.max(1, Math.floor((roadmapAnchor.getTime() - startsOn.getTime()) / (7 * 86_400_000)) + 1))
    : Math.min(totalWeeks, Math.max(1, completedCount + 1));
  const roadmapStart = Math.floor((currentWeek - 1) / 7) * 7 + 1;
  const roadmapWeeks = Array.from({ length: Math.min(7, totalWeeks - roadmapStart + 1) }, (_, index) => roadmapStart + index);
  const examMonth = enrollment.plannedExamMonth
    ? enrollment.plannedExamMonth.split("-").reverse().join("/")
    : "Chưa đặt";
  const attentionCount = (pendingAssignments.length ? 1 : 0) + (lowScoreLog ? 1 : 0) + (progressPercent < 50 ? 1 : 0);

  return (
    <div className={`${styles.dashboard} ${styles.studyPlan}`}>
      <section className={styles.actionCenter}>
        <h2 className={styles.welcomeTitle}>Tuần học hiện tại <span>{formatDate(weekStart.toISOString())} – {formatDate(new Date(weekEnd.getTime() - 86_400_000).toISOString())}</span></h2>
        <div className={styles.weekSummary}>
          <div className={styles.weekProgress} style={{ "--progress": `${weeklyPercent * 3.6}deg` } as React.CSSProperties}><span>{weeklyPercent}%</span></div>
          <div className={styles.weekCopy}>
            <div><strong>Tuần {currentWeek}</strong><span>{weeklyCompleted}/{weeklyTarget} mục tiêu</span></div>
            <p><b>{weeklyCompleted}/{weeklyTarget}</b> hoạt động đã hoàn thành</p>
          </div>
          <div className={styles.studyDays}>
            <p>Bạn đã học <strong>{learnedDays}/7 ngày</strong> trong tuần</p>
            <div>{calendarDays.map((day) => {
              const isActive = activeNextSession?.startsAt && new Date(activeNextSession.startsAt).toDateString() === day.toDateString();
              return <span key={day.toISOString()} className={isActive ? styles.studyDayActive : undefined}>{DAY_NAMES[day.getDay()]}</span>;
            })}</div>
          </div>
        </div>

        <div className={styles.nextLessonBlock}>
          <div className={styles.sectionHeading}><h2>Việc cần làm tiếp theo</h2><button type="button" onClick={() => onOpenTab(featuredItem?.tab || "lessons")} aria-label="Mở danh sách liên quan"><ArrowRight size={16} weight="bold" /></button></div>
          {featuredItem ? (
            <article className={styles.nextLessonCard}>
              <span className={styles.lessonTypeIcon}><FeaturedIcon size={23} weight="duotone" /></span>
              <div className={styles.nextLessonCopy}>
                <span>{featuredItem.badge}</span>
                <strong>{featuredItem.title}</strong>
                <p>{featuredItem.description}</p>
                {featuredItem.href.startsWith("#")
                  ? <button type="button" className={styles.startLessonButton} onClick={() => onOpenTab(featuredItem.tab)}>{featuredItem.label}<ArrowRight size={14} weight="bold" /></button>
                  : <SmartLink href={featuredItem.href} className={styles.startLessonButton}>{featuredItem.label}<ArrowRight size={14} weight="bold" /></SmartLink>}
              </div>
              <div className={styles.lessonTime}><span>{featuredItem.meta}</span><small>{featuredItem.context}</small></div>
              <Sparkle className={styles.nextLessonGlyph} size={58} weight="duotone" aria-hidden="true" />
            </article>
          ) : <EmptyState>Bạn đã hoàn thành các nội dung hiện tại.</EmptyState>}
        </div>
      </section>

      <div className={styles.twoColGrid}>
        <div className={`${styles.dashboardMain} ${styles.mainColumn}`}>
          <section className={`${styles.panel} ${styles.weekLessonsPanel}`}>
            <PanelHeader icon={<BookOpen size={19} weight="duotone" />} title="Bài học trong tuần" action="Xem tất cả" onAction={() => onOpenTab("lessons")} />
            <div className={styles.sessionList}>
              {displayedSessions.map((session, index) => (
                <article className={`${styles.sessionItem} ${index === 0 ? styles.sessionItemActive : ""}`} key={session.id}>
                  <div className={styles.sessionSummary}>
                    <span className={styles.rowIcon}><PlayCircle size={19} weight="duotone" /></span>
                    <div className={styles.rowCopy}><strong>Buổi {session.sessionNo}: {session.title || "Nội dung đang cập nhật"}</strong><small>{formatTime(session.startsAt)} · {formatDate(session.startsAt)} · {session.zoomUrl ? "Online · Zoom" : session.phaseName || "Lịch học"}</small></div>
                    {session.zoomUrl ? <SmartLink href={session.zoomUrl} className={styles.sessionAction}>Vào học</SmartLink> : <span className={styles.sessionStatus}>{session.status === "COMPLETED" ? "Đã học" : "Sắp diễn ra"}</span>}
                  </div>
                </article>
              ))}
              {!displayedSessions.length ? <EmptyState>Chưa có bài học trong tuần này.</EmptyState> : null}
            </div>
          </section>

          {pendingAssignments.length ? (
            <section className={styles.panel}>
              <PanelHeader icon={<Exam size={19} weight="duotone" />} title="Bài tập cần hoàn thành" count={pendingAssignments.length} action="Xem tất cả" onAction={() => onOpenTab("assignments")} />
              <div className={styles.assignmentList}>{pendingAssignments.slice(0, 2).map((assignment) => (
                <div className={styles.assignmentRow} key={assignment.id}><span className={styles.rowIcon}><FileText size={19} weight="duotone" /></span><div className={styles.rowCopy}><strong>{assignment.title}</strong><small>Buổi {assignment.sessionNo} · {assignment.status}</small></div><button type="button" onClick={() => onOpenTab("assignments")}>Xem bài</button></div>
              ))}</div>
            </section>
          ) : null}
        </div>

        <aside className={`${styles.dashboardSide} ${styles.sideColumn}`}>
          <section className={styles.roadmapPanel}>
            <div className={styles.roadmapTopline}><h2>Lộ trình {totalWeeks} tuần</h2><button type="button" className={styles.roadmapLink} onClick={() => onOpenTab("lessons")}>Xem chi tiết</button></div>
            <div className={styles.roadmapCard}>
              <div className={styles.roadmapCaption}><strong>Tuần {roadmapStart}–{roadmapStart + roadmapWeeks.length - 1}</strong><span>Đang học tuần {currentWeek}</span></div>
              <div className={styles.roadmapBars}>{roadmapWeeks.map((week) => (
                <div key={week} className={`${styles.roadmapWeek} ${week < currentWeek ? styles.roadmapWeekDone : ""} ${week === currentWeek ? styles.roadmapWeekActive : ""}`}><span style={{ height: `${week === currentWeek ? 82 : week < currentWeek ? 68 : 52}px` }} /><small>W{week}</small></div>
              ))}</div>
              <div className={styles.roadmapMetrics}><div><span>Tuần hiện tại</span><strong>{currentWeek}/{totalWeeks}</strong></div><div><span>Lịch thi dự kiến</span><strong>{examMonth}</strong></div><div><span>Band mục tiêu</span><strong>{course.targetBand ?? "--"}</strong></div></div>
            </div>
          </section>

          <section className={`${styles.panel} ${styles.courseProgressCard}`}>
            <PanelHeader icon={<ChartBar size={19} weight="duotone" />} title="Tiến độ khóa học" action="Xem chi tiết" onAction={() => onOpenTab("scores")} />
            <div className={styles.courseProgressContent}><div className={styles.weekProgress} style={{ "--progress": `${progressPercent * 3.6}deg` } as React.CSSProperties}><span>{progressPercent}%</span></div><div><small>Đã hoàn thành</small><strong>{completedCount}/{totalCount} buổi học</strong><span>Chuỗi học hiện tại: {goalProgress.currentStreakDays} ngày</span></div></div>
          </section>

          <section className={`${styles.panel} ${styles.noticePanel}`}>
            <PanelHeader icon={<Bell size={19} weight="duotone" />} title="Cần chú ý" count={attentionCount} action="Xem điểm" onAction={() => onOpenTab("scores")} />
            <div className={styles.alertList}>
              {pendingAssignments.length ? <button type="button" className={`${styles.alertRow} ${styles.alertDanger}`} onClick={() => onOpenTab("assignments")}><Warning size={21} weight="fill" /><span><strong>Còn {pendingAssignments.length} bài tập chưa hoàn thành</strong><small>Hoàn thành để theo kịp lộ trình.</small></span><ArrowRight size={15} weight="bold" /></button> : null}
              {lowScoreLog ? <button type="button" className={`${styles.alertRow} ${styles.alertWarning}`} onClick={() => onOpenTab("scores")}><Lightning size={21} weight="fill" /><span><strong>Một bài kiểm tra cần ôn lại</strong><small>{lowScoreLog.testTitle}: {scorePercent(lowScoreLog.score, lowScoreLog.maxScore)}%.</small></span><ArrowRight size={15} weight="bold" /></button> : null}
              {progressPercent < 50 ? <div className={`${styles.alertRow} ${styles.alertInfo}`}><Info size={21} weight="fill" /><span><strong>Tiến độ hiện tại {progressPercent}%</strong><small>Hãy ưu tiên bài học tiếp theo.</small></span></div> : null}
              {!attentionCount ? <EmptyState>Tiến độ học tập đang ổn định.</EmptyState> : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

type ResourceFilter = "ALL" | "LISTENING" | "READING" | "WRITING" | "SPEAKING";

const resourceFilterLabels: Record<ResourceFilter, string> = {
  ALL: "Tất cả",
  LISTENING: "Listening",
  READING: "Reading",
  WRITING: "Writing",
  SPEAKING: "Speaking",
};

const resourceCategoryLabels: Record<string, string> = {
  ANSWER_KEY: "Đáp án & giải thích",
  AUDIO: "Audio",
  DOCUMENT: "Tài liệu",
  DRIVE_LINK: "Liên kết",
  HOMEWORK: "Bài tập về nhà",
  IN_CLASS: "Bài tập trên lớp",
  METHOD: "Phương pháp",
  PROMPT_BANK: "Kho đề",
  SAMPLE: "Bài mẫu",
  SAMPLE_ANSWER: "Bài mẫu",
  TEACHER_NOTE: "Ghi chú giáo viên",
  THEORY: "Lý thuyết",
  TOPIC_BANK: "Topic bank",
  VOCABULARY: "Vocabulary",
  VOCABULARY_IDEAS: "Từ vựng & ý tưởng",
  VIDEO: "Video",
};

function resourceTypeMeta(resourceType: string) {
  switch (resourceType) {
    case "AUDIO":
      return { label: "Audio", icon: Headphones, tone: styles.resourceToneAudio };
    case "VIDEO":
      return { label: "Video", icon: PlayCircle, tone: styles.resourceToneVideo };
    case "DRIVE_LINK":
      return { label: "Liên kết", icon: ArrowSquareOut, tone: styles.resourceToneLink };
    case "TEACHER_NOTE":
      return { label: "Ghi chú giáo viên", icon: NotePencil, tone: styles.resourceToneNote };
    case "ANSWER_KEY":
      return { label: "Đáp án", icon: CheckCircle, tone: styles.resourceToneAnswer };
    case "VOCABULARY":
      return { label: "Từ vựng", icon: BookOpen, tone: styles.resourceToneVocabulary };
    default:
      return { label: "Tài liệu", icon: FileText, tone: styles.resourceToneDocument };
  }
}

function resourceSkillIcon(skill: string) {
  switch (skill) {
    case "LISTENING": return Headphones;
    case "WRITING": return PencilLine;
    case "SPEAKING": return Microphone;
    default: return BookOpen;
  }
}

function resourceCategoryLabel(category: string | null, resourceType: string) {
  return resourceCategoryLabels[category || ""] || resourceCategoryLabels[resourceType] || "Học liệu";
}

function ResourceOpenButton({ href }: { href: string }) {
  const [opening, setOpening] = useState(false);
  const [failed, setFailed] = useState(false);

  async function openResource() {
    if (opening) return;
    setOpening(true);
    setFailed(false);
    const popup = window.open("about:blank", "_blank", "noopener,noreferrer");
    try {
      const resolvedUrl = await apiMediaUrl(href);
      if (popup) popup.location.href = resolvedUrl;
      else window.location.href = resolvedUrl;
    } catch {
      popup?.close();
      setFailed(true);
    } finally {
      setOpening(false);
    }
  }

  return (
    <button type="button" className={styles.resourceOpenButton} onClick={() => void openResource()} disabled={opening}>
      {failed ? "Thử lại" : opening ? "Đang mở" : "Mở tài liệu"}
      {!opening && !failed ? <ArrowSquareOut size={14} weight="bold" /> : null}
    </button>
  );
}

function ResourceLibrary({
  resources,
}: {
  resources: CourseWorkspaceData["resources"];
}) {
  const [query, setQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState<ResourceFilter>("ALL");
  const [sourceFilter, setSourceFilter] = useState<"ALL" | "LINKS" | "FILES">("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");

  const availableSkills = useMemo(
    () => (Object.keys(resourceFilterLabels) as ResourceFilter[]).filter((skill) => skill === "ALL" || resources.some((resource) => resource.skill === skill)),
    [resources],
  );
  const visibleResources = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return resources.filter((resource) => {
      const matchesSkill = skillFilter === "ALL" || resource.skill === skillFilter;
      const matchesSource = sourceFilter === "ALL" || (sourceFilter === "LINKS" ? Boolean(resource.externalUrl) : !resource.externalUrl);
      const matchesQuery = !normalizedQuery || [resource.title, resource.code, resource.category, resource.resourceType, resource.skill]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedQuery));
      return matchesSkill && matchesSource && matchesQuery;
    });
  }, [query, resources, skillFilter, sourceFilter]);

  return (
    <div className={styles.resourceLibrary}>
      <div className={styles.resourceToolbar}>
        <label className={styles.resourceSearch}>
          <MagnifyingGlass size={18} weight="bold" />
          <span className="sr-only">Tìm trong kho học liệu</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên, mã hoặc chủ đề..." />
        </label>
        <span className={styles.resourceResultCount}>{visibleResources.length}/{resources.length} tài liệu</span>
        <div className={styles.resourceViewToggle} role="group" aria-label="Chế độ hiển thị học liệu">
          <button type="button" onClick={() => setViewMode("LIST")} aria-pressed={viewMode === "LIST"} title="Danh sách"><List size={17} weight="bold" /></button>
          <button type="button" onClick={() => setViewMode("GRID")} aria-pressed={viewMode === "GRID"} title="Dạng lưới"><SquaresFour size={17} weight="bold" /></button>
        </div>
      </div>

      <div className={styles.resourceLibraryBody}>
        <aside className={styles.resourceFilters} aria-label="Bộ lọc học liệu">
          <div className={styles.resourceFilterHeading}><span>Bộ lọc</span><span>{resources.length}</span></div>
          <div className={styles.resourceFilterSection}>
            <small>KỸ NĂNG</small>
            {availableSkills.map((filter) => (
              <button key={filter} type="button" className={skillFilter === filter ? styles.resourceFilterActive : undefined} onClick={() => setSkillFilter(filter)} aria-pressed={skillFilter === filter}>
                {filter === "ALL" ? <FolderOpen size={17} weight={skillFilter === filter ? "fill" : "regular"} /> : (() => { const Icon = resourceSkillIcon(filter); return <Icon size={17} weight={skillFilter === filter ? "fill" : "regular"} />; })()}
                <span>{resourceFilterLabels[filter]}</span>
                <em>{filter === "ALL" ? resources.length : resources.filter((resource) => resource.skill === filter).length}</em>
              </button>
            ))}
          </div>
          <div className={styles.resourceFilterSection}>
            <small>NGUỒN</small>
            {(["ALL", "FILES", "LINKS"] as const).map((filter) => (
              <button key={filter} type="button" className={sourceFilter === filter ? styles.resourceFilterActive : undefined} onClick={() => setSourceFilter(filter)} aria-pressed={sourceFilter === filter}>
                {filter === "LINKS" ? <ArrowSquareOut size={17} /> : <FileText size={17} />}
                <span>{filter === "ALL" ? "Tất cả" : filter === "LINKS" ? "Liên kết" : "Tệp học liệu"}</span>
                <em>{filter === "ALL" ? resources.length : resources.filter((resource) => filter === "LINKS" ? Boolean(resource.externalUrl) : !resource.externalUrl).length}</em>
              </button>
            ))}
          </div>
        </aside>

        <div className={styles.resourceResults}>
          {visibleResources.length ? (
            <div className={`${styles.resourceCardGrid} ${viewMode === "LIST" ? styles.resourceCardList : ""}`}>
              {visibleResources.map((resource) => {
                const meta = resourceTypeMeta(resource.resourceType);
                const TypeIcon = meta.icon;
                const SkillIcon = resourceSkillIcon(resource.skill);
                return (
                  <article className={styles.libraryResourceCard} key={resource.id}>
                    <div className={styles.libraryResourceTopline}>
                      <span className={`${styles.libraryResourceType} ${meta.tone}`}><TypeIcon size={16} weight="duotone" /> {meta.label}</span>
                      <span className={styles.libraryResourceCode}>{resource.code}</span>
                    </div>
                    <div className={styles.libraryResourcePreview}>
                      <span className={meta.tone}><TypeIcon size={34} weight="duotone" /></span>
                      <strong>{resource.title}</strong>
                      <small>{resourceCategoryLabel(resource.category, resource.resourceType)}</small>
                    </div>
                    <div className={styles.libraryResourceMeta}>
                      <span><SkillIcon size={15} weight="duotone" /> {resourceFilterLabels[resource.skill as ResourceFilter] || resource.skill}</span>
                      <span>{resource.sessionNo ? `Buổi ${resource.sessionNo}` : "Tài liệu khóa học"}</span>
                    </div>
                    <div className={styles.libraryResourceFooter}>
                      {resource.externalUrl ? <ResourceOpenButton href={resource.externalUrl} /> : <span className={styles.resourceUnavailable}>Chưa có liên kết</span>}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.resourceEmptyState}>
              <MagnifyingGlass size={30} weight="duotone" />
              <strong>{resources.length ? "Không tìm thấy học liệu phù hợp" : "Chưa có học liệu được gắn"}</strong>
              <span>{resources.length ? "Thử đổi từ khóa hoặc bộ lọc." : "Giáo viên chưa gắn tài liệu vào các buổi học của khóa này."}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailPanel({
  courseId,
  activeTab,
  sessions,
  resources,
  studyLogs,
  teacherFeedback,
  teacherName,
  capacity,
  focusActivityId,
}: {
  courseId: string;
  activeTab: Exclude<WorkspaceTab, "overview">;
  sessions: Session[];
  resources: CourseWorkspaceData["resources"];
  studyLogs: CourseWorkspaceData["studyLogs"];
  teacherFeedback: CourseWorkspaceData["teacherFeedback"];
  teacherName: string;
  capacity: number | null;
  focusActivityId: string | null;
}) {
  const title = TAB_ITEMS.find((item) => item.id === activeTab)?.label || "Chi tiết";
  return (
    <section className={`${styles.detailPanel} ${activeTab === "resources" ? styles.resourceDetailPanel : ""} ${activeTab === "schedule" ? styles.scheduleDetailPanel : ""}`}>
      {activeTab !== "resources" && activeTab !== "schedule" ? <div className={styles.detailHeading}><div><span><Sparkle size={18} weight="fill" /></span><div><h2>{title}</h2><p>Thông tin được đồng bộ trực tiếp từ khóa học.</p></div></div></div> : null}
      {activeTab === "lessons" ? (
        <div className={styles.detailList}>
          {sessions.map((session) => <div className={styles.detailRow} key={session.id}><span className={session.status === "COMPLETED" ? styles.detailDone : undefined}>{session.status === "COMPLETED" ? <Check size={16} weight="bold" /> : session.sessionNo}</span><div><strong>Buổi {session.sessionNo}: {session.title || "Nội dung đang cập nhật"}</strong><small>{formatDate(session.startsAt)} · {formatTime(session.startsAt)} · {session.phaseName || "Lộ trình đào tạo"}</small></div><em>{session.status === "COMPLETED" ? "Đã học" : session.status === "CANCELLED" ? "Đã hủy" : "Sắp học"}</em></div>)}
          {!sessions.length ? <EmptyState>Chưa có bài học.</EmptyState> : null}
        </div>
      ) : null}
      {activeTab === "assignments" ? (
        <StudentProgressTracker courseId={courseId} focusActivityId={focusActivityId} />
      ) : null}
      {activeTab === "portfolio" ? <StudentPortfolio courseId={courseId} /> : null}
      {activeTab === "schedule" ? (
        <CourseScheduleTimetable sessions={sessions} />
      ) : null}
      {activeTab === "resources" ? (
        <ResourceLibrary resources={resources} />
      ) : null}
      {activeTab === "discussion" ? (
        <div className={styles.detailList}>
          {teacherFeedback.map((feedback) => <div className={styles.feedbackRow} key={feedback.id}><span><User size={18} weight="duotone" /></span><div><strong>{feedback.teacherName}</strong><small>{formatDate(feedback.reviewedAt)} · {feedback.status}</small><p>{feedback.feedback || "Giáo viên chưa để lại nội dung nhận xét."}</p></div></div>)}
          {!teacherFeedback.length ? <EmptyState>Chưa có trao đổi hoặc nhận xét mới.</EmptyState> : null}
        </div>
      ) : null}
      {activeTab === "scores" ? (
        <div className={styles.detailList}>
          {studyLogs.map((log) => {
            const resultSuffix = log.reviewUrl?.endsWith("/result") ? "/result" : "";
            const attemptUrl = ["WRITING", "SPEAKING"].includes(log.skill)
              ? `/student/${log.skill.toLowerCase()}/attempts/${log.id}${resultSuffix}`
              : log.reviewUrl;
            return <div className={styles.detailRow} key={log.id}><span><ChartBar size={17} weight="duotone" /></span><div><strong>{log.testTitle}</strong><small>{log.skill} · {formatDate(log.completedAt)} · {log.platform}</small></div>{attemptUrl ? <SmartLink href={attemptUrl}>{log.score ?? "--"}/{log.maxScore ?? "--"}</SmartLink> : <em>{log.score ?? "--"}/{log.maxScore ?? "--"}</em>}</div>;
          })}
          {!studyLogs.length ? <EmptyState>Chưa có kết quả học tập.</EmptyState> : null}
        </div>
      ) : null}
      {activeTab === "members" ? (
        <div className={styles.memberGrid}>
          <div><span><GraduationCap size={22} weight="duotone" /></span><small>Giảng viên phụ trách</small><strong>{teacherName}</strong></div>
          <div><span><Users size={22} weight="duotone" /></span><small>Quy mô lớp</small><strong>Tối đa {capacity || "--"} học viên</strong></div>
        </div>
      ) : null}
    </section>
  );
}

const SCHEDULE_SLOTS = [
  { id: "morning", label: "Sáng", from: 0, to: 12 },
  { id: "afternoon", label: "Chiều", from: 12, to: 18 },
  { id: "evening", label: "Tối", from: 18, to: 24 },
] as const;

function CourseScheduleTimetable({ sessions }: { sessions: Session[] }) {
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const weekStart = useMemo(() => startOfWeek(weekAnchor), [weekAnchor]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);
  const visibleSessions = useMemo(() => sessions.filter((session) => {
    if (!session.startsAt) return false;
    const start = new Date(session.startsAt);
    return !Number.isNaN(start.getTime()) && start >= weekStart && start < weekEnd;
  }), [sessions, weekEnd, weekStart]);
  const today = new Date();

  return (
    <div className={styles.scheduleWorkspace}>
      <div className={styles.scheduleToolbar}>
        <div className={styles.scheduleToolbarTitle}>
          <span><CalendarBlank size={17} weight="duotone" /></span>
          <div><strong>Thời khóa biểu tuần</strong><small>Chế độ chỉ xem</small></div>
        </div>
        <div className={styles.scheduleWeekControls} aria-label="Điều hướng tuần">
          <button type="button" aria-label="Tuần trước" title="Tuần trước" onClick={() => setWeekAnchor((value) => addDays(value, -7))}><CaretLeft size={16} weight="bold" /></button>
          <button type="button" onClick={() => setWeekAnchor(new Date())}>Hôm nay</button>
          <button type="button" aria-label="Tuần sau" title="Tuần sau" onClick={() => setWeekAnchor((value) => addDays(value, 7))}><CaretRight size={16} weight="bold" /></button>
        </div>
        <strong className={styles.scheduleWeekRange}>{formatWeekRange(weekStart)}</strong>
      </div>

      <div className={styles.scheduleCalendarScroll}>
        <div className={styles.scheduleCalendar}>
          <div className={`${styles.scheduleCell} ${styles.scheduleCorner}`}>Ca học</div>
          {days.map((day, index) => (
            <div className={`${styles.scheduleCell} ${styles.scheduleDayHeader} ${isSameDay(day, today) ? styles.scheduleToday : ""}`} key={day.toISOString()}>
              <strong>{index === 6 ? "Chủ nhật" : `Thứ ${index + 2}`}</strong>
              <span>{new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(day)}</span>
            </div>
          ))}

          {SCHEDULE_SLOTS.map((slot) => {
            const slotHasSessions = visibleSessions.some((session) => {
              if (!session.startsAt) return false;
              const start = new Date(session.startsAt);
              return start.getHours() >= slot.from && start.getHours() < slot.to;
            });
            const rowSize = slotHasSessions ? styles.scheduleSlotExpanded : styles.scheduleSlotCompact;
            return (
            <div className={styles.scheduleRow} key={slot.id}>
              <div className={`${styles.scheduleCell} ${styles.scheduleSlotLabel} ${rowSize}`}>{slot.label}</div>
              {days.map((day) => {
                const cellSessions = visibleSessions.filter((session) => {
                  if (!session.startsAt) return false;
                  const start = new Date(session.startsAt);
                  return isSameDay(start, day) && start.getHours() >= slot.from && start.getHours() < slot.to;
                });
                return (
                  <div className={`${styles.scheduleCell} ${styles.scheduleSlotCell} ${rowSize}`} key={`${slot.id}-${day.toISOString()}`}>
                    {cellSessions.map((session) => <StudentSessionCard session={session} key={session.id} />)}
                  </div>
                );
              })}
            </div>
            );
          })}
        </div>
      </div>

      <div className={styles.scheduleLegend}>
        <span><i className={styles.legendOnline} />Học trực tuyến (Zoom)</span>
        <span><i className={styles.legendTest} />Có bài test</span>
        <span><i className={styles.legendCancelled} />Đã hủy</span>
        {!visibleSessions.length ? <em>Tuần này chưa có buổi học.</em> : null}
      </div>
    </div>
  );
}

function StudentSessionCard({ session }: { session: Session }) {
  const hasTest = session.hasTest || session.assignments.length > 0;
  const isCancelled = session.status === "CANCELLED";
  const tone = isCancelled ? styles.scheduleSessionCancelled : hasTest ? styles.scheduleSessionTest : session.zoomUrl ? styles.scheduleSessionOnline : "";

  return (
    <article className={`${styles.scheduleSessionCard} ${tone}`}>
      <div className={styles.scheduleSessionMeta}>
        <span>Buổi {String(session.sessionNo).padStart(2, "0")}</span>
        {hasTest ? <Exam size={15} weight="fill" /> : session.zoomUrl ? <VideoCamera size={15} weight="fill" /> : <BookOpen size={15} weight="fill" />}
      </div>
      <strong>{session.title || `Buổi học ${session.sessionNo}`}</strong>
      {session.content ? <p>{session.content.split("\n").filter(Boolean).slice(0, 2).join(" · ")}</p> : null}
      <div className={styles.scheduleSessionDetails}>
        <span><Clock size={12} />{formatTime(session.startsAt)}–{formatTime(session.endsAt)}</span>
        <span>GV: {session.teacherName || "Chưa phân công"}</span>
      </div>
      {isCancelled ? <em>Đã hủy</em> : session.zoomUrl ? <SmartLink href={session.zoomUrl} className={styles.scheduleJoinLink}><VideoCamera size={13} weight="fill" /> Vào học</SmartLink> : null}
    </article>
  );
}
