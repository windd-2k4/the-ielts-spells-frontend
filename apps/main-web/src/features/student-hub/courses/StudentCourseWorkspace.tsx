"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowsLeftRight,
  Bell,
  BookOpen,
  CalendarBlank,
  CaretDown,
  ChartBar,
  ChatCircleDots,
  Check,
  CheckCircle,
  Exam,
  FileText,
  FolderOpen,
  GraduationCap,
  Headphones,
  House,
  Image as ImageIcon,
  Info,
  Lightning,
  LinkSimple,
  Lock,
  NotePencil,
  Play,
  PlayCircle,
  Sparkle,
  Target,
  TrendUp,
  User,
  Users,
  VideoCamera,
  Warning,
} from "@phosphor-icons/react";
import type { CourseWorkspaceData, StudentPortalEnrollment } from "../studentPortalApi";
import styles from "./StudentCourseWorkspace.module.css";

interface StudentCourseWorkspaceProps {
  data: CourseWorkspaceData;
  enrolledCourses: StudentPortalEnrollment[];
}

type WorkspaceTab =
  | "overview"
  | "lessons"
  | "assignments"
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
  { id: "schedule", label: "Thời khóa biểu", icon: CalendarBlank },
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

function scorePercent(score: number | null, maxScore: number | null) {
  if (score == null || maxScore == null || maxScore <= 0) return null;
  return Math.round((score / maxScore) * 100);
}

function isCompleteStatus(status: string) {
  return ["COMPLETED", "SUBMITTED", "GRADED", "DONE"].includes(status.toUpperCase());
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

export function StudentCourseWorkspace({ data, enrolledCourses }: StudentCourseWorkspaceProps) {
  const {
    course,
    enrollment,
    nextAction,
    nextSession,
    sessions = [],
    resources = [],
    studyLogs = [],
    teacherFeedback = [],
    skills,
  } = data;
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [showCourseSwitcher, setShowCourseSwitcher] = useState(false);

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
  const isLR = course.skillPair === "LISTENING_READING";
  const skillCards = isLR
    ? [
        { label: "Listening", value: skills.listeningAccuracy, icon: Headphones },
        { label: "Reading", value: skills.readingAccuracy, icon: BookOpen },
      ]
    : [
        { label: "Speaking", value: skills.speakingBandScore, icon: ChatCircleDots },
        { label: "Writing", value: skills.writingBandScore, icon: NotePencil },
      ];
  const assignments: Assignment[] = sessions.flatMap((session) => session.assignments.map((assignment) => ({
    ...assignment,
    sessionNo: session.sessionNo,
    sessionTitle: session.title || `Buổi ${session.sessionNo}`,
  })));
  const pendingAssignments = assignments.filter((assignment) => !isCompleteStatus(assignment.status));
  const lowScoreLog = studyLogs.find((log) => {
    const percent = scorePercent(log.score, log.maxScore);
    return percent != null && percent < 60;
  });
  const switchableCourses = enrolledCourses.filter((item, index, list) => list.findIndex((candidate) => candidate.courseId === item.courseId) === index);
  const sessionPhases = useMemo(() => {
    const phases = new Map<string, Session[]>();
    for (const session of sortedSessions) {
      const phase = session.phaseName || "Lộ trình đào tạo";
      phases.set(phase, [...(phases.get(phase) || []), session]);
    }
    return Array.from(phases.entries()).map(([name, items]) => ({ name, sessions: items }));
  }, [sortedSessions]);
  const resourceGroups = useMemo(() => {
    const count = (predicate: (item: CourseWorkspaceData["resources"][number]) => boolean) => resources.filter(predicate).length;
    const text = (item: CourseWorkspaceData["resources"][number]) => `${item.title} ${item.category || ""} ${item.resourceType} ${item.fileRole}`.toLowerCase();
    return [
      { label: "Tài liệu bài giảng", count: count((item) => /document|pdf|main/.test(text(item))), icon: FolderOpen, tone: "amber" },
      { label: "Đề thi mẫu", count: count((item) => /test|exam|đề/.test(text(item))), icon: Exam, tone: "violet" },
      { label: "Audio & Script", count: count((item) => /audio|transcript|mp3|wav/.test(text(item))), icon: Headphones, tone: "rose" },
      { label: "Tài liệu bổ trợ", count: count((item) => /support|extra|supplement/.test(text(item))), icon: LinkSimple, tone: "blue" },
      { label: "Video bài học", count: count((item) => /video|mp4|youtube/.test(text(item))), icon: VideoCamera, tone: "blue" },
      { label: "Vocabulary List", count: count((item) => /vocab|word/.test(text(item))), icon: BookOpen, tone: "violet" },
      { label: "Mindmap & Notes", count: count((item) => /image|mindmap|note|png|jpg/.test(text(item))), icon: ImageIcon, tone: "green" },
      { label: "Tài liệu khác", count: resources.length, icon: FileText, tone: "slate" },
    ];
  }, [resources]);
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
    window.requestAnimationFrame(() => document.getElementById("course-workspace-content")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div className={styles.workspace}>
      <section className={styles.hero} aria-labelledby="course-title">
        <div className={styles.heroMain}>
          <div className={styles.heroCopy}>
            <div className={styles.breadcrumbRow}>
              <Link href="/student/courses">Khóa học của tôi</Link><span>/</span><strong>{course.name}</strong>
            </div>
            <div className={styles.badgeRow}>
              <span className={styles.codeBadge}>{course.code}</span>
              <span className={styles.statusBadge}>Đang học</span>
              {switchableCourses.length > 1 ? (
                <div className={styles.switcher}>
                  <button type="button" onClick={() => setShowCourseSwitcher((value) => !value)} aria-expanded={showCourseSwitcher}>
                    <ArrowsLeftRight size={13} weight="bold" />Đổi khóa học<CaretDown size={12} weight="bold" />
                  </button>
                  {showCourseSwitcher ? (
                    <div className={styles.switcherMenu}>
                      {switchableCourses.map((item) => (
                        <Link key={item.courseId} href={`/student/courses/${item.courseId}`} onClick={() => setShowCourseSwitcher(false)}>
                          <span><strong>{item.courseName}</strong><small>{item.courseCode}</small></span>
                          {item.courseId === course.id ? <Check size={14} weight="bold" /> : null}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            <h1 id="course-title">{course.name}</h1>
            <p>{course.description || "Theo dõi lộ trình, lịch học và học liệu của khóa học tại một nơi."}</p>
            <div className={styles.heroMeta}>
              <span><CalendarBlank size={16} weight="bold" />{formatDate(course.startsOn)} - {formatDate(course.endsOn)}</span>
              <span><Users size={16} weight="bold" />Tối đa {course.capacity || "--"} học viên</span>
              <span><Target size={16} weight="bold" />Band mục tiêu {course.targetBand?.toFixed(1) || "--"}</span>
              <span><User size={16} weight="bold" />Giáo viên: {teacherName}</span>
            </div>
          </div>
          <div className={styles.heroArt} aria-hidden="true">
            <Image src="/images/courses-learning-hero.png" alt="" fill sizes="(max-width: 900px) 100vw, 430px" className={styles.heroArtImage} priority />
          </div>
        </div>

        <aside className={styles.progressCard} aria-label="Tiến độ khóa học">
          {activeZoomUrl ? (
            <SmartLink href={activeZoomUrl} className={styles.continueButton}><Play size={15} weight="fill" /><span>Tiếp tục học</span><ArrowRight size={15} weight="bold" /></SmartLink>
          ) : (
            <button type="button" className={styles.continueButton} onClick={() => openTab("lessons")}><Play size={15} weight="fill" /><span>Xem bài học</span><ArrowRight size={15} weight="bold" /></button>
          )}
          <div className={styles.progressHead}><strong>Tiến độ khóa học</strong><span>{completedCount}/{totalCount} buổi</span></div>
          <div className={styles.progressLine} aria-label={`Đã hoàn thành ${progressPercent}%`}><span style={{ width: `${progressPercent}%` }} /></div>
          <b className={styles.progressValue}>{progressPercent}%</b>
          <div className={styles.skillGrid}>
            {skillCards.map((skill) => {
              const SkillIcon = skill.icon;
              return (
                <div className={styles.skillCard} key={skill.label}>
                  <span><SkillIcon size={22} weight="duotone" /></span>
                  <div><small>{skill.label}</small><strong>{skill.value == null ? "Chưa có" : `${Math.round(skill.value)}${isLR ? "%" : ""}`}</strong><em>Tiến độ kỹ năng</em></div>
                </div>
              );
            })}
          </div>
        </aside>
      </section>

      <nav className={styles.tabs} aria-label="Điều hướng khóa học">
        {TAB_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button type="button" key={item.id} className={activeTab === item.id ? styles.tabActive : undefined} onClick={() => openTab(item.id)} aria-current={activeTab === item.id ? "page" : undefined}>
              <Icon size={17} weight={activeTab === item.id ? "fill" : "regular"} /><span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div id="course-workspace-content">
        {activeTab === "overview" ? (
          <OverviewDashboard
            nextAction={nextAction}
            activeNextSession={activeNextSession}
            activeZoomUrl={activeZoomUrl}
            upcomingSessions={upcomingSessions}
            calendarDays={calendarDays}
            pendingAssignments={pendingAssignments}
            assignments={assignments}
            lowScoreLog={lowScoreLog}
            progressPercent={progressPercent}
            resourceGroups={resourceGroups}
            resourcesCount={resources.length}
            sessionPhases={sessionPhases}
            completedCount={completedCount}
            totalCount={totalCount}
            onOpenTab={openTab}
          />
        ) : (
          <DetailPanel
            activeTab={activeTab}
            sessions={sortedSessions}
            assignments={assignments}
            resources={resources}
            studyLogs={studyLogs}
            teacherFeedback={teacherFeedback}
            teacherName={teacherName}
            capacity={course.capacity}
            upcomingSessions={upcomingSessions}
          />
        )}
      </div>
    </div>
  );
}

function OverviewDashboard({
  nextAction,
  activeNextSession,
  activeZoomUrl,
  upcomingSessions,
  calendarDays,
  pendingAssignments,
  assignments,
  lowScoreLog,
  progressPercent,
  resourceGroups,
  resourcesCount,
  sessionPhases,
  completedCount,
  totalCount,
  onOpenTab,
}: {
  nextAction: CourseWorkspaceData["nextAction"];
  activeNextSession: CourseWorkspaceData["nextSession"] | Session | null;
  activeZoomUrl: string | null;
  upcomingSessions: Session[];
  calendarDays: Date[];
  pendingAssignments: Assignment[];
  assignments: Assignment[];
  lowScoreLog: CourseWorkspaceData["studyLogs"][number] | undefined;
  progressPercent: number;
  resourceGroups: Array<{ label: string; count: number; icon: typeof House; tone: string }>;
  resourcesCount: number;
  sessionPhases: Array<{ name: string; sessions: Session[] }>;
  completedCount: number;
  totalCount: number;
  onOpenTab: (tab: WorkspaceTab) => void;
}) {
  const inProgressItems = [
    nextAction?.title ? {
      title: nextAction.title,
      meta: nextAction.deadline ? `Hạn: ${formatDate(nextAction.deadline)}` : nextAction.description,
      href: nextAction.ctaUrl,
      label: nextAction.ctaLabel || "Thực hiện",
      icon: FileText,
    } : null,
    activeNextSession ? {
      title: activeNextSession.title || `Buổi học ${activeNextSession.sessionNo}`,
      meta: `${formatTime(activeNextSession.startsAt)} · ${formatDate(activeNextSession.startsAt)}`,
      href: activeZoomUrl || "#course-workspace-content",
      label: activeZoomUrl ? "Vào học" : "Xem lịch",
      icon: PlayCircle,
    } : null,
    pendingAssignments[0] ? {
      title: pendingAssignments[0].title,
      meta: `${pendingAssignments[0].sessionTitle} · ${pendingAssignments[0].status}`,
      href: "#course-workspace-content",
      label: "Xem bài",
      icon: Exam,
    } : null,
  ].filter(Boolean) as Array<{ title: string; meta: string; href: string; label: string; icon: typeof House }>;

  return (
    <div className={styles.dashboard}>
      <section className={styles.panel}>
        <PanelHeader icon={<FileText size={19} weight="duotone" />} title="Việc đang dở" count={inProgressItems.length} action="Xem tất cả" onAction={() => onOpenTab("lessons")} />
        <div className={styles.actionList}>
          {inProgressItems.length ? inProgressItems.slice(0, 3).map((item, index) => {
            const ItemIcon = item.icon;
            return (
              <div className={styles.actionRow} key={`${item.title}-${index}`}>
                <span className={styles.rowIcon}><ItemIcon size={20} weight="duotone" /></span>
                <div className={styles.rowCopy}><strong>{item.title}</strong><small>{item.meta}</small></div>
                {item.href.startsWith("#") ? <button type="button" onClick={() => onOpenTab(index === 2 ? "assignments" : "lessons")}>{item.label}</button> : <SmartLink href={item.href}>{item.label}</SmartLink>}
              </div>
            );
          }) : <EmptyState>Không có việc đang dở.</EmptyState>}
        </div>
      </section>

      <section className={styles.panel}>
        <PanelHeader icon={<Bell size={19} weight="duotone" />} title="Cảnh báo học vụ" count={(pendingAssignments.length ? 1 : 0) + (lowScoreLog ? 1 : 0) + (progressPercent < 50 ? 1 : 0)} action="Xem tất cả" onAction={() => onOpenTab("scores")} />
        <div className={styles.alertList}>
          {pendingAssignments.length ? (
            <button type="button" className={`${styles.alertRow} ${styles.alertDanger}`} onClick={() => onOpenTab("assignments")}>
              <Warning size={23} weight="fill" /><span><strong>Còn {pendingAssignments.length} bài tập chưa hoàn thành</strong><small>Hoàn thành để không ảnh hưởng tiến độ khóa học.</small></span><ArrowRight size={15} weight="bold" />
            </button>
          ) : null}
          {lowScoreLog ? (
            <button type="button" className={`${styles.alertRow} ${styles.alertWarning}`} onClick={() => onOpenTab("scores")}>
              <Lightning size={23} weight="fill" /><span><strong>Điểm bài kiểm tra cần cải thiện</strong><small>{lowScoreLog.testTitle}: {scorePercent(lowScoreLog.score, lowScoreLog.maxScore)}%.</small></span><ArrowRight size={15} weight="bold" />
            </button>
          ) : null}
          {progressPercent < 50 ? <div className={`${styles.alertRow} ${styles.alertInfo}`}><Info size={23} weight="fill" /><span><strong>Cần cải thiện tiến độ</strong><small>Tiến độ hiện tại là {progressPercent}%.</small></span></div> : null}
          {!pendingAssignments.length && !lowScoreLog && progressPercent >= 50 ? <EmptyState>Tiến độ học tập đang ổn định.</EmptyState> : null}
        </div>
      </section>

      <section className={styles.panel}>
        <PanelHeader icon={<CalendarBlank size={19} weight="duotone" />} title="Thời khóa biểu" action="Xem tất cả" onAction={() => onOpenTab("schedule")} />
        <div className={styles.weekStrip}>
          {calendarDays.map((day) => {
            const isActive = activeNextSession?.startsAt && new Date(activeNextSession.startsAt).toDateString() === day.toDateString();
            return <span key={day.toISOString()} className={isActive ? styles.dayActive : undefined}><small>{DAY_NAMES[day.getDay()]}</small><strong>{day.getDate()}</strong></span>;
          })}
        </div>
        <div className={styles.timeline}>
          {upcomingSessions.slice(0, 3).map((session, index) => (
            <div className={styles.timelineRow} key={session.id}>
              <time>{formatTime(session.startsAt)}</time><span className={index === 0 ? styles.timelineHot : undefined} />
              <div><strong>Buổi {session.sessionNo}: {session.title || "Nội dung đang cập nhật"}</strong><small>{session.zoomUrl ? "Online · Zoom" : `${formatDate(session.startsAt)} · Lịch học`}</small></div>
            </div>
          ))}
          {!upcomingSessions.length ? <EmptyState>Chưa có buổi học sắp tới.</EmptyState> : null}
        </div>
      </section>

      <section className={styles.panel}>
        <PanelHeader icon={<Exam size={19} weight="duotone" />} title="Bài tập" action="Xem tất cả" onAction={() => onOpenTab("assignments")} />
        <div className={styles.segmented}><span className={styles.segmentActive}>Chưa xong ({pendingAssignments.length})</span><span>Đã xong ({assignments.length - pendingAssignments.length})</span></div>
        <div className={styles.assignmentList}>
          {pendingAssignments.slice(0, 2).map((assignment) => (
            <div className={styles.assignmentRow} key={assignment.id}>
              <span className={styles.rowIcon}><FileText size={19} weight="duotone" /></span>
              <div className={styles.rowCopy}><strong>{assignment.title}</strong><small>Buổi {assignment.sessionNo} · {assignment.status}</small></div>
              <button type="button" onClick={() => onOpenTab("assignments")}>Xem bài</button>
            </div>
          ))}
          {!pendingAssignments.length ? <EmptyState>Bạn đã hoàn thành các bài tập hiện có.</EmptyState> : null}
        </div>
      </section>

      <section className={styles.panel}>
        <PanelHeader icon={<FolderOpen size={19} weight="duotone" />} title="Kho học liệu" action="Xem tất cả" onAction={() => onOpenTab("resources")} />
        <div className={styles.resourceGrid}>
          {resourceGroups.map((group) => {
            const ResourceIcon = group.icon;
            return (
              <button type="button" onClick={() => onOpenTab("resources")} key={group.label}>
                <span data-tone={group.tone}><ResourceIcon size={22} weight="duotone" /></span><strong>{group.label}</strong><small>{group.label === "Tài liệu khác" ? resourcesCount : group.count} tài liệu</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.panel}>
        <PanelHeader icon={<TrendUp size={19} weight="duotone" />} title="Lộ trình học" action="Xem chi tiết" onAction={() => onOpenTab("lessons")} />
        <div className={styles.pathList}>
          {sessionPhases.slice(0, 4).map((phase, index) => {
            const phaseCompleted = phase.sessions.filter((session) => session.status === "COMPLETED").length;
            const previousDone = index === 0 || sessionPhases[index - 1].sessions.every((session) => session.status === "COMPLETED");
            const isCurrent = phaseCompleted < phase.sessions.length && previousDone;
            return (
              <div className={styles.pathRow} key={phase.name}>
                <span className={phaseCompleted === phase.sessions.length ? styles.pathDone : isCurrent ? styles.pathCurrent : undefined}>{phaseCompleted === phase.sessions.length ? <Check size={14} weight="bold" /> : index + 1}</span>
                <div><strong>{phase.name}</strong><small>{phaseCompleted}/{phase.sessions.length} buổi</small></div>
                {isCurrent ? <em>Đang học</em> : index > 0 ? <Lock size={14} /> : null}
              </div>
            );
          })}
          {!sessionPhases.length ? <EmptyState>Lộ trình đang được cập nhật.</EmptyState> : null}
        </div>
        <div className={styles.pathSummary}><span style={{ width: `${Math.min(100, Math.round((completedCount / Math.max(totalCount, 1)) * 100))}%` }} /></div>
      </section>
    </div>
  );
}

function DetailPanel({
  activeTab,
  sessions,
  assignments,
  resources,
  studyLogs,
  teacherFeedback,
  teacherName,
  capacity,
  upcomingSessions,
}: {
  activeTab: Exclude<WorkspaceTab, "overview">;
  sessions: Session[];
  assignments: Assignment[];
  resources: CourseWorkspaceData["resources"];
  studyLogs: CourseWorkspaceData["studyLogs"];
  teacherFeedback: CourseWorkspaceData["teacherFeedback"];
  teacherName: string;
  capacity: number | null;
  upcomingSessions: Session[];
}) {
  const title = TAB_ITEMS.find((item) => item.id === activeTab)?.label || "Chi tiết";
  return (
    <section className={styles.detailPanel}>
      <div className={styles.detailHeading}><div><span><Sparkle size={18} weight="fill" /></span><div><h2>{title}</h2><p>Thông tin được đồng bộ trực tiếp từ khóa học.</p></div></div></div>
      {activeTab === "lessons" ? (
        <div className={styles.detailList}>
          {sessions.map((session) => <div className={styles.detailRow} key={session.id}><span className={session.status === "COMPLETED" ? styles.detailDone : undefined}>{session.status === "COMPLETED" ? <Check size={16} weight="bold" /> : session.sessionNo}</span><div><strong>Buổi {session.sessionNo}: {session.title || "Nội dung đang cập nhật"}</strong><small>{formatDate(session.startsAt)} · {formatTime(session.startsAt)} · {session.phaseName || "Lộ trình đào tạo"}</small></div><em>{session.status === "COMPLETED" ? "Đã học" : session.status === "CANCELLED" ? "Đã hủy" : "Sắp học"}</em></div>)}
          {!sessions.length ? <EmptyState>Chưa có bài học.</EmptyState> : null}
        </div>
      ) : null}
      {activeTab === "assignments" ? (
        <div className={styles.detailList}>
          {assignments.map((assignment) => <div className={styles.detailRow} key={assignment.id}><span className={isCompleteStatus(assignment.status) ? styles.detailDone : undefined}><Exam size={17} weight="duotone" /></span><div><strong>{assignment.title}</strong><small>Buổi {assignment.sessionNo} · {assignment.sessionTitle}</small></div><em>{assignment.score == null ? assignment.status : `${assignment.score}/${assignment.maxScore || "--"}`}</em></div>)}
          {!assignments.length ? <EmptyState>Chưa có bài tập được giao.</EmptyState> : null}
        </div>
      ) : null}
      {activeTab === "schedule" ? (
        <div className={styles.detailList}>
          {upcomingSessions.map((session) => <div className={styles.detailRow} key={session.id}><span><CalendarBlank size={17} weight="duotone" /></span><div><strong>Buổi {session.sessionNo}: {session.title || "Nội dung đang cập nhật"}</strong><small>{formatDate(session.startsAt)} · {formatTime(session.startsAt)} · {session.teacherName || "Chưa phân công"}</small></div>{session.zoomUrl ? <SmartLink href={session.zoomUrl}>Vào học</SmartLink> : <em>Sắp diễn ra</em>}</div>)}
          {!upcomingSessions.length ? <EmptyState>Chưa có lịch học sắp tới.</EmptyState> : null}
        </div>
      ) : null}
      {activeTab === "resources" ? (
        <div className={styles.detailGrid}>
          {resources.map((resource) => <div className={styles.resourceCard} key={resource.id}><span><FileText size={22} weight="duotone" /></span><div><small>{resource.category || resource.resourceType}</small><strong>{resource.title}</strong><em>{resource.code}</em></div>{resource.externalUrl ? <SmartLink href={resource.externalUrl}><ArrowRight size={15} weight="bold" /></SmartLink> : null}</div>)}
          {!resources.length ? <EmptyState>Kho học liệu đang được cập nhật.</EmptyState> : null}
        </div>
      ) : null}
      {activeTab === "discussion" ? (
        <div className={styles.detailList}>
          {teacherFeedback.map((feedback) => <div className={styles.feedbackRow} key={feedback.id}><span><User size={18} weight="duotone" /></span><div><strong>{feedback.teacherName}</strong><small>{formatDate(feedback.reviewedAt)} · {feedback.status}</small><p>{feedback.feedback || "Giáo viên chưa để lại nội dung nhận xét."}</p></div></div>)}
          {!teacherFeedback.length ? <EmptyState>Chưa có trao đổi hoặc nhận xét mới.</EmptyState> : null}
        </div>
      ) : null}
      {activeTab === "scores" ? (
        <div className={styles.detailList}>
          {studyLogs.map((log) => <div className={styles.detailRow} key={log.id}><span><ChartBar size={17} weight="duotone" /></span><div><strong>{log.testTitle}</strong><small>{log.skill} · {formatDate(log.completedAt)} · {log.platform}</small></div>{log.reviewUrl ? <SmartLink href={log.reviewUrl}>{log.score ?? "--"}/{log.maxScore ?? "--"}</SmartLink> : <em>{log.score ?? "--"}/{log.maxScore ?? "--"}</em>}</div>)}
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
