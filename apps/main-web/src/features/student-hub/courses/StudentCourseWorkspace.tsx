"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowsLeftRight,
  BellRinging,
  BookOpen,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  Check,
  CheckCircle,
  Clock,
  ClockCounterClockwise,
  DownloadSimple,
  Exam,
  FilePdf,
  FolderOpen,
  GraduationCap,
  Headphones,
  ListChecks,
  MagnifyingGlass,
  PlayCircle,
  Sparkle,
  UserCircle,
  VideoCamera,
  Warning,
  WarningCircle,
} from "@phosphor-icons/react";
import type { CourseWorkspaceData, StudentPortalEnrollment } from "../studentPortalApi";
import styles from "./StudentCourseWorkspace.module.css";

interface StudentCourseWorkspaceProps {
  data: CourseWorkspaceData;
  enrolledCourses: StudentPortalEnrollment[];
}

export type TabType = "overview" | "schedule" | "history" | "alerts" | "library";
type LibraryFilter = "ALL" | "DOCUMENT" | "AUDIO" | "VIDEO" | "TRANSCRIPT" | "ANSWER_KEY";
type ReportStatus = "ALL" | "COMPLETED" | "IN_PROGRESS";

interface TabDefinition {
  id: TabType;
  label: string;
  icon: typeof Sparkle;
  alias?: string[];
}

interface WorkspaceTask {
  id: string;
  title: string;
  detail: string;
  label: string;
  tone: "primary" | "warning" | "neutral";
  href?: string;
  tab?: TabType;
  checklistKey?: string;
}

const TABS: TabDefinition[] = [
  { id: "overview", label: "Overview", icon: Sparkle, alias: ["next_action"] },
  { id: "schedule", label: "Schedule", icon: CalendarBlank, alias: ["roadmap"] },
  { id: "history", label: "Learning history", icon: ClockCounterClockwise, alias: ["reports"] },
  { id: "alerts", label: "Alerts", icon: BellRinging, alias: ["notifications"] },
  { id: "library", label: "Resources", icon: FolderOpen },
];

const HERO_TABS = TABS.filter((tab) => tab.id !== "alerts");

function normalizeTab(value: string | null): TabType {
  if (!value) return "overview";
  return TABS.find((tab) => tab.id === value || tab.alias?.includes(value))?.id ?? "overview";
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

function formatDate(value: string | null | undefined, includeYear = true) {
  if (!value) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(new Date(value));
}

function formatTime(value: string | null | undefined) {
  if (!value) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function dayKey(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function scoreText(score: number | null, maxScore: number | null) {
  if (score == null) return "Chưa chấm";
  const cleanScore = Number.isInteger(score) ? String(score) : score.toFixed(1);
  if (maxScore == null) return cleanScore;
  const cleanMax = Number.isInteger(maxScore) ? String(maxScore) : maxScore.toFixed(1);
  return `${cleanScore}/${cleanMax}`;
}

function cleanScoreCopy(value: string) {
  return value.replace(/(\d+)\.00/g, "$1");
}

const SCHEDULE_SLOTS = [
  { key: "MORNING", label: "Sáng", from: 0, to: 12 },
  { key: "AFTERNOON", label: "Chiều", from: 12, to: 18 },
  { key: "EVENING", label: "Tối", from: 18, to: 24 },
] as const;

function startOfWeek(value: Date) {
  const result = new Date(value);
  const day = result.getDay();
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  return result;
}

function addDays(value: Date, days: number) {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}

function countdown(startsAt: string | null | undefined, now: number) {
  if (!startsAt) return null;
  const difference = new Date(startsAt).getTime() - now;
  if (difference <= 0) return null;
  const hours = Math.floor(difference / 3_600_000);
  const minutes = Math.floor((difference % 3_600_000) / 60_000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} ngày ${hours % 24} giờ`;
  return hours > 0 ? `${hours} giờ ${minutes} phút` : `${minutes} phút`;
}

export function StudentCourseWorkspace({ data, enrolledCourses }: StudentCourseWorkspaceProps) {
  const {
    course,
    nextAction,
    nextSession,
    sessions,
    resources,
    skills,
    studyLogs,
    weaknesses,
    goalProgress,
    teacherFeedback,
  } = data;

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isModulePage, setIsModulePage] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>("ALL");
  const [librarySessionFilter, setLibrarySessionFilter] = useState("ALL");
  const [historySearch, setHistorySearch] = useState("");
  const [reportSkill, setReportSkill] = useState("ALL");
  const [reportStatus, setReportStatus] = useState<ReportStatus>("ALL");
  const [reportPage, setReportPage] = useState(1);
  const [reportPageSize, setReportPageSize] = useState(10);
  const [now, setNow] = useState(() => Date.now());
  const [scheduleWeekAnchor, setScheduleWeekAnchor] = useState(() => new Date());
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const syncTab = () => {
      const tab = new URLSearchParams(window.location.search).get("tab");
      setActiveTab(normalizeTab(tab));
      setIsModulePage(Boolean(tab));
    };
    syncTab();
    window.addEventListener("popstate", syncTab);
    return () => window.removeEventListener("popstate", syncTab);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const selectTab = (tab: TabType) => {
    setActiveTab(tab);
    setIsModulePage(true);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scheduledSession = sessions.find(
    (session) => session.status === "SCHEDULED" && session.startsAt && new Date(session.startsAt).getTime() >= now,
  );
  const nextCourseSession = nextSession || scheduledSession || null;
  const isClassToday = dayKey(nextCourseSession?.startsAt) === dayKey(new Date(now).toISOString());
  const classCountdown = countdown(nextCourseSession?.startsAt, now);
  const teacherName =
    nextSession?.teacherName || course.primaryTeacherName || sessions.find((session) => session.teacherName)?.teacherName || null;
  const zoomUrl = nextSession?.zoomUrl || scheduledSession?.zoomUrl || course.defaultZoomUrl;

  const upcomingSessions = useMemo(
    () =>
      sessions
        .filter((session) => session.status === "SCHEDULED" && session.startsAt && new Date(session.startsAt).getTime() >= now)
        .sort((a, b) => new Date(a.startsAt || 0).getTime() - new Date(b.startsAt || 0).getTime()),
    [sessions, now],
  );

  const activeAlerts = useMemo(() => {
    const alerts: {
      id: string;
      type: "DANGER" | "WARNING" | "INFO";
      title: string;
      body: string;
      actionLabel?: string;
      actionUrl?: string;
      tabRedirect?: TabType;
      createdAt?: string;
    }[] = [];

    teacherFeedback.filter((item) => item.isRevisionRequired).forEach((item) => {
      alerts.push({
        id: `revision-${item.id}`,
        type: "DANGER",
        title: `${item.teacherName} yêu cầu sửa lại bài`,
        body: item.feedback || "Bài làm cần được bổ sung trước khi hoàn thiện.",
        actionLabel: "Xem nhận xét",
        tabRedirect: "history",
        createdAt: item.reviewedAt,
      });
    });

    weaknesses.forEach((weakness, index) => {
      alerts.push({
        id: `weakness-${index}`,
        type: "WARNING",
        title: `${weakness.questionType} cần luyện thêm`,
        body: `${weakness.recommendation} Đã ghi nhận ${weakness.errorCount} lỗi gần đây trong ${weakness.skill}.`,
        actionLabel: "Bắt đầu luyện",
        actionUrl: nextAction.ctaUrl || undefined,
      });
    });

    if (goalProgress.sessionAttendanceRate < 80) {
      alerts.push({
        id: "attendance-low",
        type: "WARNING",
        title: "Chuyên cần đang dưới mức 80%",
        body: `Tỷ lệ hiện tại là ${goalProgress.sessionAttendanceRate}%. Hãy kiểm tra các buổi học tiếp theo.`,
        actionLabel: "Xem thời khóa biểu",
        tabRedirect: "schedule",
      });
    }

    if (goalProgress.weeklyCompletedCount < goalProgress.weeklyTarget) {
      const remaining = goalProgress.weeklyTarget - goalProgress.weeklyCompletedCount;
      alerts.push({
        id: "weekly-goal",
        type: "INFO",
        title: `Còn ${remaining} bài để đạt mục tiêu tuần`,
        body: `Bạn đã hoàn thành ${goalProgress.weeklyCompletedCount}/${goalProgress.weeklyTarget} bài.`,
        actionLabel: "Làm bài tiếp",
        actionUrl: nextAction.ctaUrl || undefined,
      });
    }

    return alerts;
  }, [goalProgress, nextAction.ctaUrl, teacherFeedback, weaknesses]);

  const workspaceTasks = useMemo<WorkspaceTask[]>(() => {
    const tasks: WorkspaceTask[] = [];

    teacherFeedback.filter((item) => item.isRevisionRequired).forEach((item) => {
      tasks.push({
        id: `feedback-${item.id}`,
        title: "Chỉnh sửa bài theo nhận xét",
        detail: `${item.teacherName} đã gửi phản hồi ${formatDate(item.reviewedAt, false)}.`,
        label: "Cần sửa",
        tone: "warning",
        tab: "alerts",
      });
    });

    if (nextAction.title) {
      tasks.push({
        id: "next-action",
        title: nextAction.title,
        detail: cleanScoreCopy(nextAction.description || "Tiếp tục nội dung đang học."),
        label: nextAction.deadline ? `Hạn ${formatDate(nextAction.deadline, false)}` : "Ưu tiên",
        tone: nextAction.priority === "HIGH" ? "warning" : "primary",
        href: nextAction.ctaUrl || undefined,
        tab: nextAction.ctaUrl ? undefined : "overview",
      });
    }

    studyLogs.filter((log) => !log.completedAt).slice(0, 3).forEach((log) => {
      tasks.push({
        id: `attempt-${log.id}`,
        title: log.testTitle,
        detail: `${log.skill} | Bài đang làm`,
        label: "Đang làm",
        tone: "primary",
        href: log.reviewUrl,
      });
    });

    nextSession?.prerequisiteTasks.forEach((task, index) => {
      tasks.push({
        id: `prep-${index}`,
        title: task,
        detail: `Chuẩn bị trước buổi ${nextSession.sessionNo}.`,
        label: checkedTasks[task] ? "Đã xong" : "Chuẩn bị",
        tone: checkedTasks[task] ? "neutral" : "primary",
        checklistKey: task,
      });
    });

    return tasks;
  }, [checkedTasks, nextAction, nextSession, studyLogs, teacherFeedback]);

  const skillMetrics = [
    { label: "Reading", value: skills.readingAccuracy, display: skills.readingAccuracy == null ? null : `${Math.round(skills.readingAccuracy)}%` },
    { label: "Listening", value: skills.listeningAccuracy, display: skills.listeningAccuracy == null ? null : `${Math.round(skills.listeningAccuracy)}%` },
    {
      label: "Writing",
      value: skills.writingBandScore == null ? null : clamp((skills.writingBandScore / 9) * 100),
      display: skills.writingBandScore == null ? null : `Band ${skills.writingBandScore}`,
    },
    {
      label: "Speaking",
      value: skills.speakingBandScore == null ? null : clamp((skills.speakingBandScore / 9) * 100),
      display: skills.speakingBandScore == null ? null : `Band ${skills.speakingBandScore}`,
    },
  ];

  const filteredResources = useMemo(
    () =>
      resources.filter((resource) => {
        const query = librarySearch.trim().toLocaleLowerCase("vi");
        const searchable = `${resource.title} ${resource.code} ${resource.skill}`.toLocaleLowerCase("vi");
        const kind = `${resource.resourceType} ${resource.fileRole}`.toUpperCase();
        return (
          (!query || searchable.includes(query)) &&
          (libraryFilter === "ALL" || kind.includes(libraryFilter)) &&
          (librarySessionFilter === "ALL" ||
            (librarySessionFilter === "GENERAL" && resource.sessionNo == null) ||
            resource.sessionNo === Number(librarySessionFilter))
        );
      }),
    [libraryFilter, librarySearch, librarySessionFilter, resources],
  );

  const completedLogs = useMemo(() => studyLogs.filter((log) => Boolean(log.completedAt)), [studyLogs]);
  const totalCorrect = completedLogs.reduce((sum, log) => sum + (log.correctCount || 0), 0);
  const totalQuestions = completedLogs.reduce((sum, log) => sum + (log.totalQuestions || 0), 0);
  const accuracy = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : null;
  const scoredLogs = completedLogs.filter((log) => log.score != null && log.maxScore);
  const averageScore = scoredLogs.length
    ? Math.round(scoredLogs.reduce((sum, log) => sum + ((log.score || 0) / (log.maxScore || 1)) * 100, 0) / scoredLogs.length)
    : null;

  const filteredStudyLogs = useMemo(
    () =>
      studyLogs.filter((log) => {
        const matchesQuery = !historySearch.trim() || log.testTitle.toLocaleLowerCase("vi").includes(historySearch.trim().toLocaleLowerCase("vi"));
        const matchesSkill = reportSkill === "ALL" || log.skill === reportSkill;
        const matchesStatus = reportStatus === "ALL" || (reportStatus === "COMPLETED" ? Boolean(log.completedAt) : !log.completedAt);
        return matchesQuery && matchesSkill && matchesStatus;
      }),
    [historySearch, reportSkill, reportStatus, studyLogs],
  );
  const reportPageCount = Math.max(1, Math.ceil(filteredStudyLogs.length / reportPageSize));
  const safeReportPage = Math.min(reportPage, reportPageCount);
  const visibleStudyLogs = filteredStudyLogs.slice((safeReportPage - 1) * reportPageSize, safeReportPage * reportPageSize);

  useEffect(() => {
    setReportPage(1);
  }, [historySearch, reportPageSize, reportSkill, reportStatus]);

  const scheduleWeekStart = useMemo(() => startOfWeek(scheduleWeekAnchor), [scheduleWeekAnchor]);
  const scheduleDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(scheduleWeekStart, index)),
    [scheduleWeekStart],
  );
  const scheduleWeekEnd = scheduleDays[6];
  const scheduledSessionsThisWeek = sessions.filter((session) => {
    if (!session.startsAt) return false;
    const start = new Date(session.startsAt);
    return start >= scheduleWeekStart && start < addDays(scheduleWeekStart, 7);
  });

  const tabBadges: Partial<Record<TabType, number>> = {
    schedule: upcomingSessions.length || sessions.length,
    history: completedLogs.length,
    alerts: activeAlerts.length,
    library: resources.length,
  };
  const activeTabDefinition = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];
  const ActiveTabIcon = activeTabDefinition.icon;
  const switchableCourses = enrolledCourses.filter(
    (enrollment, index, list) => list.findIndex((item) => item.courseId === enrollment.courseId) === index,
  );

  const renderResource = (resource: CourseWorkspaceData["resources"][number]) => {
    const kind = `${resource.resourceType} ${resource.fileRole}`.toUpperCase();
    const ResourceIcon = kind.includes("AUDIO") ? Headphones : kind.includes("VIDEO") ? VideoCamera : FilePdf;
    return (
      <article key={resource.id} className={styles.resourceItem}>
        <span className={styles.resourceIcon}><ResourceIcon size={20} weight="duotone" /></span>
        <div>
          <strong>{resource.title}</strong>
          <small>{resource.skill} | {resource.sessionNo ? `Buổi ${resource.sessionNo}` : "Tài liệu chung"}</small>
        </div>
        {resource.externalUrl ? (
          <a href={resource.externalUrl} target="_blank" rel="noreferrer" aria-label={`Mở ${resource.title}`}>
            <DownloadSimple size={17} weight="bold" />
          </a>
        ) : <span className={styles.mutedValue}>Nội bộ</span>}
      </article>
    );
  };

  return (
    <div className={`${styles.workspaceRoot} ${isModulePage ? styles.modulePageRoot : ""}`} data-course-journey>
      <div className={styles.workspaceShell}>
        {!isModulePage ? <div className={styles.taskStage}>
          <aside className={styles.taskPanel} aria-label="Danh sách việc cần làm">
          <div className={styles.taskPanelHeader}>
            <h2>Việc cần làm</h2>
            <span className={styles.taskCount}>{workspaceTasks.length}</span>
          </div>

          <div className={styles.taskList}>
            {workspaceTasks.length ? workspaceTasks.map((task) => {
              const content = (
                <>
                  <span className={`${styles.taskMark} ${styles[`taskMark_${task.tone}`]}`}>
                    {task.checklistKey && checkedTasks[task.checklistKey] ? <Check size={15} weight="bold" /> : <ListChecks size={17} />}
                  </span>
                  <span className={styles.taskCopy}>
                    <strong>{task.title}</strong>
                  </span>
                  <span className={`${styles.taskLabel} ${styles[`taskLabel_${task.tone}`]}`}>{task.label}</span>
                </>
              );

              if (task.checklistKey) {
                const key = task.checklistKey;
                return (
                  <button
                    type="button"
                    key={task.id}
                    className={styles.taskRow}
                    onClick={() => setCheckedTasks((current) => ({ ...current, [key]: !current[key] }))}
                    aria-pressed={Boolean(checkedTasks[key])}
                  >
                    {content}
                  </button>
                );
              }
              if (task.href) return <a key={task.id} href={task.href} className={styles.taskRow}>{content}</a>;
              return (
                <button type="button" key={task.id} className={styles.taskRow} onClick={() => selectTab(task.tab || "overview")}>
                  {content}
                </button>
              );
            }) : (
              <div className={styles.taskEmpty}>
                <CheckCircle size={30} weight="duotone" />
                <strong>Không có việc tồn đọng</strong>
                <span>Nhiệm vụ mới sẽ xuất hiện tại đây khi được giao.</span>
              </div>
            )}
          </div>
          </aside>
        </div> : null}

        <section className={styles.coursePanel}>
          {isModulePage ? (
            <header className={`${styles.modulePageHeader} ${activeTab === "schedule" ? styles.schedulePageHeader : ""}`}>
              <Link
                href={`/student/courses/${course.id}`}
                className={styles.moduleBackLink}
                onClick={() => {
                  setActiveTab("overview");
                  setIsModulePage(false);
                }}
              >
                <ArrowLeft size={17} weight="bold" /> Course workspace
              </Link>
              <div className={styles.modulePageTitle}>
                <span><ActiveTabIcon size={21} weight="duotone" /></span>
                <div><small>{course.name}</small><h1>{activeTabDefinition.label}</h1></div>
              </div>
            </header>
          ) : <><header className={styles.courseHeader}>
            <div className={styles.courseHero}>
              <div className={styles.courseHeroCopy}>
                <span className={styles.skillPair}><GraduationCap size={16} weight="duotone" /> {course.skillPair === "LISTENING_READING" ? "Listening & Reading" : "Speaking & Writing"}</span>
                <div className={styles.courseTitleRow}>
                  <h1>{course.name}</h1>
                  {switchableCourses.length > 1 ? (
                    <details className={styles.courseSwitcher}>
                      <summary aria-label="Chuyển sang khóa học khác" title="Chuyển khóa học">
                        <ArrowsLeftRight size={19} weight="bold" />
                      </summary>
                      <div className={styles.courseSwitcherMenu}>
                        <span>My courses</span>
                        {switchableCourses.map((enrollment) => (
                          <Link
                            href={`/student/courses/${enrollment.courseId}`}
                            key={enrollment.enrollmentId}
                            aria-current={enrollment.courseId === course.id ? "page" : undefined}
                          >
                            <strong>{enrollment.courseName}</strong>
                            <small>{enrollment.skillPair === "LISTENING_READING" ? "Listening & Reading" : "Speaking & Writing"}</small>
                            {enrollment.courseId === course.id ? <Check size={15} weight="bold" /> : <ArrowRight size={15} />}
                          </Link>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </div>
                <div className={styles.courseActions}>
                  {isClassToday && zoomUrl ? (
                    <a href={zoomUrl} target="_blank" rel="noreferrer" className={styles.primaryButton}><VideoCamera size={18} weight="fill" /> Vào lớp ngay</a>
                  ) : nextAction.ctaUrl ? (
                    <a href={nextAction.ctaUrl} className={styles.primaryButton}><PlayCircle size={18} weight="fill" /> {nextAction.ctaLabel || "Tiếp tục học"}</a>
                  ) : (
                    <button type="button" className={styles.primaryButton} onClick={() => selectTab("schedule")}><CalendarBlank size={18} /> Xem lịch học</button>
                  )}
                  {classCountdown ? <span className={styles.classCountdown}><Clock size={16} /> Còn {classCountdown}</span> : null}
                  {activeAlerts.length ? (
                    <button type="button" className={styles.alertShortcut} onClick={() => selectTab("alerts")}>
                      <BellRinging size={17} /> {activeAlerts.length} cảnh báo
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          <nav className={styles.moduleNav} aria-label="Các mục của khóa học">
            {HERO_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} type="button" onClick={() => selectTab(tab.id)}>
                  <Icon size={18} weight="regular" />
                  <span>{tab.label}</span>
                  {tabBadges[tab.id] ? <small>{tabBadges[tab.id]}</small> : null}
                </button>
              );
            })}
          </nav>
          </>}

          {isModulePage ? <main className={`${styles.moduleContent} ${activeTab === "schedule" ? styles.scheduleModuleContent : ""}`} key={activeTab}>
            {activeTab === "overview" ? (
              <div className={styles.overviewGrid}>
                <section className={styles.featurePanel}>
                  <div className={styles.panelHeading}>
                    <div><span>Tiếp theo</span><h2>{isClassToday ? "Buổi học hôm nay" : "Ưu tiên hiện tại"}</h2></div>
                    {nextAction.priority === "HIGH" ? <strong className={styles.warningBadge}>Ưu tiên cao</strong> : null}
                  </div>
                  <h3>{isClassToday ? `Vào lớp lúc ${formatTime(nextCourseSession?.startsAt)}` : nextAction.title || "Tiếp tục lộ trình học"}</h3>
                  <p>{isClassToday ? `Buổi ${nextCourseSession?.sessionNo}: ${nextCourseSession?.title || "Nội dung đang cập nhật"}.` : cleanScoreCopy(nextAction.description || "Hoàn thành nội dung tiếp theo trong lộ trình.")}</p>
                  {nextAction.deadline ? <span className={styles.inlineMeta}><Clock size={15} /> Hạn hoàn thành {formatDate(nextAction.deadline)}</span> : null}
                </section>

                <section className={styles.activityPanel}>
                  <div className={styles.panelHeading}><div><span>Activity</span><h2>Bài làm gần đây</h2></div><button type="button" onClick={() => selectTab("history")}>Xem tất cả <ArrowRight size={14} /></button></div>
                  {studyLogs.length ? <div className={styles.activityList}>{studyLogs.slice(0, 4).map((log) => (
                    <Link href={log.reviewUrl} key={log.id}>
                      <span><strong>{log.testTitle}</strong><small>{log.skill} | {log.completedAt ? formatDateTime(log.completedAt) : "Đang làm"}</small></span>
                      <b>{scoreText(log.score, log.maxScore)}</b>
                    </Link>
                  ))}</div> : <p className={styles.emptyState}>Chưa có bài làm nào được ghi nhận.</p>}
                </section>

                <section className={styles.skillsPanel}>
                  <div className={styles.panelHeading}><div><span>Skill snapshot</span><h2>Năng lực hiện tại</h2></div></div>
                  <div className={styles.skillList}>{skillMetrics.map((skill) => (
                    <div key={skill.label} className={styles.skillRow}>
                      <span>{skill.label}</span><strong>{skill.display || "Chưa có dữ liệu"}</strong>
                      <i aria-hidden="true"><em style={{ width: `${skill.value == null ? 0 : clamp(skill.value)}%` }} /></i>
                    </div>
                  ))}</div>
                </section>

                <section className={styles.feedbackPanel}>
                  <div className={styles.panelHeading}><div><span>Teacher feedback</span><h2>Nhận xét mới nhất</h2></div></div>
                  {teacherFeedback[0] ? (
                    <blockquote>
                      <p>{teacherFeedback[0].feedback || "Giảng viên đã cập nhật kết quả bài làm."}</p>
                      <footer><UserCircle size={18} /> {teacherFeedback[0].teacherName} | {formatDate(teacherFeedback[0].reviewedAt)}</footer>
                    </blockquote>
                  ) : <p className={styles.emptyState}>Chưa có phản hồi mới trong khóa học này.</p>}
                </section>
              </div>
            ) : null}

            {activeTab === "schedule" ? (
              <section className={styles.contentSection}>
                {sessions.length ? (
                  <div className={styles.scheduleBoard} aria-label="Thời khóa biểu tuần, chế độ chỉ xem">
                    <div className={styles.scheduleBoardMeta}>
                      <div className={styles.scheduleWeekNavigation}>
                        <button type="button" onClick={() => setScheduleWeekAnchor((value) => addDays(value, -7))} aria-label="Xem tuần trước"><CaretLeft size={16} weight="bold" /></button>
                        <strong>{formatDate(scheduleWeekStart.toISOString())} - {formatDate(scheduleWeekEnd.toISOString())}</strong>
                        <button type="button" onClick={() => setScheduleWeekAnchor((value) => addDays(value, 7))} aria-label="Xem tuần sau"><CaretRight size={16} weight="bold" /></button>
                      </div>
                      <span>{scheduledSessionsThisWeek.length} buổi trong tuần</span>
                    </div>
                    <div className={styles.scheduleScroll}>
                      <table className={styles.scheduleGrid}>
                        <thead><tr><th>Ca học</th>{scheduleDays.map((day, index) => <th key={day.toISOString()}><strong>{index === 6 ? "Chủ nhật" : `Thứ ${index + 2}`}</strong><span>{formatDate(day.toISOString(), false)}</span></th>)}</tr></thead>
                        <tbody>{SCHEDULE_SLOTS.map((slot) => <tr key={slot.key}>
                          <th scope="row">{slot.label}</th>
                          {scheduleDays.map((day) => {
                            const values = scheduledSessionsThisWeek.filter((session) => {
                              if (!session.startsAt) return false;
                              const start = new Date(session.startsAt);
                              return start.toDateString() === day.toDateString() && start.getHours() >= slot.from && start.getHours() < slot.to;
                            });
                            return <td key={day.toISOString()}>{values.map((session) => {
                              const content = (session.content || "").split("\n").map((item) => item.trim()).filter(Boolean);
                              const tone = session.status === "CANCELLED" ? "cancelled" : session.hasTest ? "test" : session.zoomUrl ? "online" : "classroom";
                              return <article key={session.id} className={`${styles.scheduleSession} ${styles[`scheduleSession_${tone}`]}`}>
                                <div><span>{session.hasTest ? "Mini test" : `Buổi ${String(session.sessionNo).padStart(2, "0")}`}</span>{session.hasTest ? <Exam size={15} weight="fill" /> : session.zoomUrl ? <VideoCamera size={15} weight="fill" /> : <BookOpen size={15} weight="fill" />}</div>
                                <strong>{session.hasTest ? session.title || "Mini Test" : `Session ${session.sessionNo}`}</strong>
                                {content.length ? <p>{content.slice(0, 2).join(" · ")}</p> : session.phaseName ? <p>{session.phaseName}</p> : null}
                                <dl>
                                  <div><dt><Clock size={11} /></dt><dd>{formatTime(session.startsAt)} - {formatTime(session.endsAt)}</dd></div>
                                  <div><dt>GV</dt><dd>{session.teacherName || teacherName || "Chưa phân công"}</dd></div>
                                  <div><dt>{session.zoomUrl ? <VideoCamera size={11} /> : <BookOpen size={11} />}</dt><dd>{session.zoomUrl ? "Có Zoom" : "Tại lớp"}{session.itemCount ? ` · ${session.itemCount} học liệu/bài tập` : ""}</dd></div>
                                </dl>
                              </article>;
                            })}</td>;
                          })}
                        </tr>)}</tbody>
                      </table>
                    </div>
                    <div className={styles.scheduleLegend}><span><i className={styles.legendOnline} />Học trực tuyến (Zoom)</span><span><i className={styles.legendTest} />Có bài test</span><span><i className={styles.legendCancelled} />Đã hủy</span></div>
                  </div>
                ) : <div className={styles.emptyStateBox}><CalendarBlank size={30} weight="duotone" /><strong>Lịch học đang được cập nhật</strong><span>Các buổi học sẽ xuất hiện khi trung tâm hoàn tất xếp lịch.</span></div>}
              </section>
            ) : null}

            {activeTab === "history" ? (
              <section className={styles.contentSection}>
                <div className={styles.contentHeader}><div><span>Learning record</span><h2>Lịch sử học tập</h2><p>Theo dõi bài đã làm và kết quả được ghi nhận trong khóa.</p></div></div>
                <div className={styles.metricStrip}>
                  <div><span>Bài hoàn tất</span><strong>{completedLogs.length}</strong></div>
                  <div><span>Độ chính xác</span><strong>{accuracy == null ? "Chưa có" : `${accuracy}%`}</strong></div>
                  <div><span>Điểm TB quy đổi</span><strong>{averageScore == null ? "Chưa có" : `${averageScore}%`}</strong></div>
                  <div><span>Chuyên cần</span><strong>{goalProgress.sessionAttendanceRate}%</strong></div>
                </div>
                <div className={styles.toolbar}>
                  <label><MagnifyingGlass size={17} /><input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Tìm tên bài làm" aria-label="Tìm tên bài làm" /></label>
                  <select value={reportSkill} onChange={(event) => setReportSkill(event.target.value)} aria-label="Lọc theo kỹ năng"><option value="ALL">Tất cả kỹ năng</option><option value="READING">Reading</option><option value="LISTENING">Listening</option><option value="WRITING">Writing</option><option value="SPEAKING">Speaking</option></select>
                  <select value={reportStatus} onChange={(event) => setReportStatus(event.target.value as ReportStatus)} aria-label="Lọc theo trạng thái"><option value="ALL">Tất cả trạng thái</option><option value="COMPLETED">Đã hoàn thành</option><option value="IN_PROGRESS">Đang làm</option></select>
                </div>
                {visibleStudyLogs.length ? <>
                  <div className={styles.tableWrap}><table><thead><tr><th>Bài làm</th><th>Thời gian</th><th>Kết quả</th><th>Trạng thái</th><th /></tr></thead><tbody>{visibleStudyLogs.map((log) => (
                    <tr key={log.id}><td><strong>{log.testTitle}</strong><small>{log.skill} | {log.platform}</small></td><td>{log.completedAt ? formatDateTime(log.completedAt) : "Đang làm"}</td><td><b>{scoreText(log.score, log.maxScore)}</b></td><td><span className={styles.statusBadge}>{log.completedAt ? "Đã hoàn thành" : "Đang làm"}</span></td><td><Link href={log.reviewUrl}>Xem lại <ArrowRight size={13} /></Link></td></tr>
                  ))}</tbody></table></div>
                  <div className={styles.pagination}><span>Hiển thị {(safeReportPage - 1) * reportPageSize + 1}-{Math.min(safeReportPage * reportPageSize, filteredStudyLogs.length)} / {filteredStudyLogs.length}</span><div><button type="button" disabled={safeReportPage === 1} onClick={() => setReportPage((page) => Math.max(1, page - 1))}><CaretLeft size={16} /></button>{Array.from({ length: reportPageCount }, (_, index) => index + 1).map((page) => <button type="button" key={page} onClick={() => setReportPage(page)} aria-current={page === safeReportPage ? "page" : undefined}>{page}</button>)}<button type="button" disabled={safeReportPage === reportPageCount} onClick={() => setReportPage((page) => Math.min(reportPageCount, page + 1))}><CaretRight size={16} /></button></div><select value={reportPageSize} onChange={(event) => setReportPageSize(Number(event.target.value))} aria-label="Số dòng mỗi trang"><option value={10}>10 / trang</option><option value={20}>20 / trang</option><option value={50}>50 / trang</option></select></div>
                </> : <div className={styles.emptyStateBox}><BookOpen size={30} weight="duotone" /><strong>Không có bài làm phù hợp</strong><span>Hãy thay đổi từ khóa hoặc bộ lọc.</span></div>}
              </section>
            ) : null}

            {activeTab === "alerts" ? (
              <section className={styles.contentSection}>
                <div className={styles.contentHeader}><div><span>Learning alerts</span><h2>Cảnh báo học tập</h2><p>Các vấn đề cần xử lý dựa trên dữ liệu lớp và phản hồi giảng viên.</p></div><strong className={styles.alertCount}>{activeAlerts.length} mục</strong></div>
                {activeAlerts.length ? <div className={styles.alertList}>{activeAlerts.map((alert) => (
                  <article key={alert.id} className={`${styles.alertItem} ${styles[`alert_${alert.type.toLowerCase()}`]}`}>
                    <span>{alert.type === "DANGER" ? <Warning size={20} weight="fill" /> : <WarningCircle size={20} weight="duotone" />}</span>
                    <div><small>{alert.type === "DANGER" ? "Cần xử lý" : alert.type === "WARNING" ? "Cần lưu ý" : "Nhắc nhở"}</small><h3>{alert.title}</h3><p>{alert.body}</p>{alert.createdAt ? <time>{formatDate(alert.createdAt)}</time> : null}</div>
                    {alert.actionUrl ? <a href={alert.actionUrl}>{alert.actionLabel || "Xử lý"} <ArrowRight size={14} /></a> : alert.tabRedirect ? <button type="button" onClick={() => selectTab(alert.tabRedirect!)}>{alert.actionLabel || "Xem chi tiết"} <ArrowRight size={14} /></button> : null}
                  </article>
                ))}</div> : <div className={styles.emptyStateBox}><CheckCircle size={30} weight="duotone" /><strong>Không có cảnh báo tồn đọng</strong><span>Tiến độ hiện tại không có vấn đề cần xử lý.</span></div>}
              </section>
            ) : null}

            {activeTab === "library" ? (
              <section className={styles.contentSection}>
                <div className={styles.contentHeader}><div><span>Course resources</span><h2>Kho học liệu</h2><p>Tài liệu được xuất bản riêng cho khóa học này.</p></div></div>
                <div className={styles.toolbar}>
                  <label><MagnifyingGlass size={17} /><input value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} placeholder="Tìm tên, mã hoặc kỹ năng" aria-label="Tìm học liệu" /></label>
                  <select value={librarySessionFilter} onChange={(event) => setLibrarySessionFilter(event.target.value)} aria-label="Lọc theo buổi"><option value="ALL">Tất cả các buổi</option><option value="GENERAL">Tài liệu chung</option>{sessions.map((session) => <option key={session.id} value={session.sessionNo}>Buổi {session.sessionNo}</option>)}</select>
                </div>
                <div className={styles.filterChips}>{([{ id: "ALL", label: "Tất cả" }, { id: "DOCUMENT", label: "Tài liệu" }, { id: "AUDIO", label: "Audio" }, { id: "VIDEO", label: "Video" }, { id: "TRANSCRIPT", label: "Transcript" }, { id: "ANSWER_KEY", label: "Đáp án" }] as { id: LibraryFilter; label: string }[]).map((filter) => <button type="button" key={filter.id} onClick={() => setLibraryFilter(filter.id)} aria-pressed={libraryFilter === filter.id}>{filter.label}</button>)}</div>
                {filteredResources.length ? <div className={styles.resourceList}>{filteredResources.map(renderResource)}</div> : <div className={styles.emptyStateBox}><FolderOpen size={30} weight="duotone" /><strong>Không có học liệu phù hợp</strong><span>Hãy thay đổi từ khóa hoặc bộ lọc.</span></div>}
              </section>
            ) : null}
          </main> : null}
        </section>
      </div>
    </div>
  );
}
