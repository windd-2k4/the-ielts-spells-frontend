"use client";

import Link from "next/link";
import {
  ArrowClockwise,
  ArrowRight,
  BookOpenText,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  CaretRight as ArrowCaret,
  CheckCircle,
  FileText,
  Headphones,
  Microphone,
  PencilLine,
  Sparkle,
  Target,
  Video,
  WarningCircle,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { StudentTargetBandControl } from "@/features/student-hub/StudentTargetBandControl";
import { useStudentPortal } from "@/features/student-hub/StudentPortalProvider";
import { useStudentSession } from "@/features/student-auth/StudentSessionProvider";
import {
  getStudentPortalActivity,
  type StudentPortalDailyActivity,
} from "@/features/student-hub/studentPortalApi";
import { formatBand, formatDateTime } from "@/features/student-hub/studentPortalViewModel";
import { PlacementTestBanner } from "@/features/placement-test/PlacementTestBanner";
import styles from "@/features/student-hub/StudentLearningOverview.module.css";

const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date: Date) {
  const day = (date.getDay() + 6) % 7;
  return addDays(new Date(date.getFullYear(), date.getMonth(), date.getDate()), -day);
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day || 1);
}

function formatDuration(seconds: number) {
  if (seconds <= 0) return "0m";
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h${minutes ? `${minutes}m` : ""}` : `${minutes}m`;
}

function ActivityCountCell({ value }: { value: number }) {
  const intensityClass = value >= 4
    ? styles.activityCellStrong
    : value >= 2
      ? styles.activityCellMedium
      : value === 1
        ? styles.activityCellLight
        : "";

  return (
    <td className={intensityClass || undefined}>
      {value || <span className={styles.activityEmptyDash}>—</span>}
    </td>
  );
}

export default function StudentDashboardPage() {
  const { session } = useStudentSession();
  const { data, loading, error, refresh } = useStudentPortal();

  const today = new Date();
  const [selectedMonthDate, setSelectedMonthDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [activity, setActivity] = useState<StudentPortalDailyActivity[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Sync initial activity data from portal overview
  useEffect(() => {
    if (data?.activityCalendar) {
      setActivity(data.activityCalendar);
    }
  }, [data?.activityCalendar]);

  // Fetch the visible month plus its neighbours so boundary weeks stay complete.
  useEffect(() => {
    const controller = new AbortController();
    const monthDates = [-1, 0, 1].map((offset) => (
      new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth() + offset, 1)
    ));
    const requestedMonths = monthDates.map(monthKey);

    void Promise.all(requestedMonths.map((month) => getStudentPortalActivity(month, controller.signal)))
      .then((pages) => {
        setActivity((current) => [
          ...current.filter((item) => !requestedMonths.some((month) => item.activityDate.startsWith(month))),
          ...pages.flat(),
        ]);
      })
      .catch(() => {
        // keep existing activity on error
      });

    return () => controller.abort();
  }, [selectedMonthDate]);

  if (loading && !data) return <DashboardSkeleton />;
  if (error && !data) return <DashboardError message={error} onRetry={() => void refresh()} />;
  if (!data) return null;

  const studentName = data.profile.fullName || session?.user?.user_metadata?.full_name || "Học viên";
  const pendingAssignments = data.readingAssignments.filter((item) => item.attemptsUsed < item.maxAttempts);
  const pendingCourseAssignments = data.courseAssignments.filter((item) => !["COMPLETED", "WAITING_REVIEW"].includes(item.status));
  const pendingAssignmentCount = pendingAssignments.length + pendingCourseAssignments.length;
  const nextCourseAssignment = pendingCourseAssignments[0];
  const nextSession = data.upcomingSessions[0];
  const activeEnrollment = data.enrollments.find((item) => item.status === "ACTIVE") ?? data.enrollments[0];
  const scheduleSkillPair = nextSession
    ? data.enrollments.find((item) => item.courseId === nextSession.courseId)?.skillPair
    : activeEnrollment?.skillPair;

  // Real Band Scores - NO FAKE DATA
  const targetBand = data.profile.targetBand;
  const currentBand = data.profile.currentBand;
  const readingTarget = data.profile.readingTarget;
  const listeningTarget = data.profile.listeningTarget;
  const writingTarget = data.profile.writingTarget;
  const speakingTarget = data.profile.speakingTarget;

  // Calendar dates
  const activityByDate = new Map(activity.map((item) => [item.activityDate, item]));
  const monthStart = new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth(), 1);
  const calendarStart = startOfWeek(monthStart);
  const daysInMonth = new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth() + 1, 0).getDate();
  const monthStartOffset = (monthStart.getDay() + 6) % 7;
  const calendarDayCount = Math.ceil((monthStartOffset + daysInMonth) / 7) * 7;
  const calendarDays = Array.from({ length: calendarDayCount }, (_, index) => addDays(calendarStart, index));

  // YouPass-style weekly summary anchored to the selected calendar day.
  const selectedWeekStart = startOfWeek(selectedDate);
  const weekItems = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(selectedWeekStart, index);
    return { date, activity: activityByDate.get(dateKey(date)) };
  });
  const weeklyTotals = weekItems.reduce((total, item) => ({
    reading: total.reading + (item.activity?.reading ?? 0),
    listening: total.listening + (item.activity?.listening ?? 0),
    writing: total.writing + (item.activity?.writing ?? 0),
    speaking: total.speaking + (item.activity?.speaking ?? 0),
    durationSeconds: total.durationSeconds + (item.activity?.durationSeconds ?? 0),
  }), { reading: 0, listening: 0, writing: 0, speaking: 0, durationSeconds: 0 });

  // Real course progress percentage
  const courseProgress = activeEnrollment && activeEnrollment.totalSessions > 0
    ? Math.min(100, Math.round((activeEnrollment.completedSessions / activeEnrollment.totalSessions) * 100))
    : 0;

  // Real Exam info - NO FAKE DATES
  const examEnrollment = data.enrollments.find((item) => item.actualExamDate)
    ?? data.enrollments.find((item) => item.plannedExamMonth);
  const rawExamDate = examEnrollment?.actualExamDate ?? (data.profile.examPlanStatus === "PLANNED" ? data.profile.plannedExamDate : null);
  const examDateObject = rawExamDate ? parseLocalDate(rawExamDate) : null;
  const daysRemaining = examDateObject
    ? Math.max(0, Math.ceil((examDateObject.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86_400_000))
    : null;

  function moveMonth(offset: number) {
    const nextMonth = new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth() + offset, 1);
    const nextDay = Math.min(selectedDate.getDate(), new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate());
    setSelectedMonthDate(nextMonth);
    setSelectedDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextDay));
  }

  function selectCalendarDate(date: Date) {
    setSelectedDate(date);
    if (date.getMonth() !== selectedMonthDate.getMonth() || date.getFullYear() !== selectedMonthDate.getFullYear()) {
      setSelectedMonthDate(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }

  return (
    <div className={styles.overview}>
      <PlacementTestBanner />

      {error && (
        <div role="status" className={styles.notice}>
          <span>{error} Dữ liệu hiển thị có thể chưa được cập nhật.</span>
          <button type="button" disabled={loading} onClick={() => void refresh()} className={styles.textLink}>
            <ArrowClockwise size={15} />{loading ? "Đang cập nhật…" : "Tải lại"}
          </button>
        </div>
      )}

      {/* Main 2-Column Dashboard Grid */}
      <div className={styles.dashboardGrid}>
        {/* LEFT / MAIN COLUMN */}
        <div className={styles.mainColumn}>
          {/* Top Hero Banner: "Xin chào, Đức Võ!" - Matching Image 5 */}
          <section className={styles.heroBanner} aria-label="Lời chào học viên">
            <div className={styles.heroLeft}>
              <div className={styles.heroGreetingRow}>
                <div className={styles.heroGreetingIcon}>
                  <Target size={20} weight="bold" />
                </div>
                <h1 className={styles.heroTitle}>Xin chào, {studentName}!</h1>
              </div>
              <p className={styles.heroSubtitle}>
                Hãy tiếp tục hành trình chinh phục IELTS của bạn nhé!
              </p>
              <Link href={nextCourseAssignment ? `/student/courses/${nextCourseAssignment.courseId}?tab=assignments` : pendingAssignments.length > 0 ? "/student/reading" : "/student/practice"} className={styles.heroActionBtn}>
                {nextCourseAssignment ? "Mở bài được giao →" : "Tiếp tục học tập →"}
              </Link>
            </div>

            {/* Design Book Artwork - Matching Image 3 Directly */}
            <div className={styles.heroIllustration} aria-hidden="true">
              <img
                src="/images/hero-book-design.png"
                alt=""
                className={styles.heroBookImg}
              />
            </div>
          </section>

          {/* 5 Score Cards Row - NO FAKE DATA */}
          <div className={styles.scoreCardsRow}>
            {/* Card 1: Tổng quan */}
            <div className={styles.scoreCardOverview}>
              <div className={styles.scoreCardHeader}>
                <div className={styles.scoreCardHeaderLeft}>
                  <span className={`${styles.scoreCardIcon} ${styles.scoreCardIconOverview}`}>
                    <Target size={14} weight="bold" />
                  </span>
                  <span className={styles.scoreCardTitleOverview}>Tổng quan</span>
                </div>
                <div className={styles.scoreCardStars}>
                  <Sparkle size={12} weight="fill" />
                  <Sparkle size={10} weight="fill" />
                </div>
              </div>
              <div className={styles.scoreCardBottom}>
                <span className={styles.scoreCardValueOverview}>
                  {currentBand != null ? formatBand(currentBand) : (targetBand != null ? formatBand(targetBand) : "—")}
                </span>
                {/* No fake difference comparison */}
                {targetBand != null && currentBand != null && (
                  <span className={styles.scoreCardGoalMeta}>Mục tiêu: {formatBand(targetBand)}</span>
                )}
              </div>
            </div>

            {/* Card 2: Reading */}
            <div className={styles.scoreCardSkill}>
              <div className={styles.scoreCardHeader}>
                <div className={styles.scoreCardHeaderLeft}>
                  <span className={`${styles.scoreCardIcon} ${styles.scoreCardIconSkill}`}>
                    <BookOpenText size={14} weight="bold" />
                  </span>
                  <span className={styles.scoreCardTitleSkill}>Reading</span>
                </div>
              </div>
              <div className={styles.scoreCardBottom}>
                <span className={styles.scoreCardValueSkill}>
                  {readingTarget != null ? formatBand(readingTarget) : "—"}
                </span>
                {/* Clean, no fake delta */}
              </div>
            </div>

            {/* Card 3: Listening */}
            <div className={styles.scoreCardSkill}>
              <div className={styles.scoreCardHeader}>
                <div className={styles.scoreCardHeaderLeft}>
                  <span className={`${styles.scoreCardIcon} ${styles.scoreCardIconSkill}`}>
                    <Headphones size={14} weight="bold" />
                  </span>
                  <span className={styles.scoreCardTitleSkill}>Listening</span>
                </div>
              </div>
              <div className={styles.scoreCardBottom}>
                <span className={styles.scoreCardValueSkill}>
                  {listeningTarget != null ? formatBand(listeningTarget) : "—"}
                </span>
                {/* Clean, no fake delta */}
              </div>
            </div>

            {/* Card 4: Writing */}
            <div className={styles.scoreCardSkill}>
              <div className={styles.scoreCardHeader}>
                <div className={styles.scoreCardHeaderLeft}>
                  <span className={`${styles.scoreCardIcon} ${styles.scoreCardIconSkill}`}>
                    <PencilLine size={14} weight="bold" />
                  </span>
                  <span className={styles.scoreCardTitleSkill}>Writing</span>
                </div>
              </div>
              <div className={styles.scoreCardBottom}>
                <span className={styles.scoreCardValueSkill}>
                  {writingTarget != null ? formatBand(writingTarget) : "—"}
                </span>
                {/* Clean, no fake delta */}
              </div>
            </div>

            {/* Card 5: Speaking */}
            <div className={styles.scoreCardSkill}>
              <div className={styles.scoreCardHeader}>
                <div className={styles.scoreCardHeaderLeft}>
                  <span className={`${styles.scoreCardIcon} ${styles.scoreCardIconSkill}`}>
                    <Microphone size={14} weight="bold" />
                  </span>
                  <span className={styles.scoreCardTitleSkill}>Speaking</span>
                </div>
              </div>
              <div className={styles.scoreCardBottom}>
                <span className={styles.scoreCardValueSkill}>
                  {speakingTarget != null ? formatBand(speakingTarget) : "—"}
                </span>
                {/* Clean, no fake delta */}
              </div>
            </div>
          </div>

          {/* YouPass-style diligence calendar and selected-week activity */}
          <div className={styles.middleActivityGrid}>
            <div className={styles.calendarCard}>
              <div className={styles.calendarHeader}>
                <div className={styles.calendarHeaderTitle}>
                  <div className={styles.calendarIconBox}>
                    <CalendarBlank size={16} weight="bold" />
                  </div>
                  <div className={styles.calendarHeaderCopy}>
                    <span>Biểu đồ “chăm chỉ” của bạn</span>
                    <small>Bấm vào một ngày để xem thống kê của tuần tương ứng.</small>
                  </div>
                </div>
                <div className={styles.calendarControls}>
                  <span className={styles.submissionLegend}><i />Có nộp bài</span>
                  <div className={styles.monthNavigator}>
                    <button
                      type="button"
                      className={styles.monthNavBtn}
                      onClick={() => moveMonth(-1)}
                      aria-label="Tháng trước"
                    >
                      <CaretLeft size={12} weight="bold" />
                    </button>
                    <span className={styles.monthNavText}>
                      Tháng {selectedMonthDate.getMonth() + 1}, {selectedMonthDate.getFullYear()}
                    </span>
                    <button
                      type="button"
                      className={styles.monthNavBtn}
                      onClick={() => moveMonth(1)}
                      aria-label="Tháng sau"
                    >
                      <CaretRight size={12} weight="bold" />
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.calendarWeekdays}>
                {weekdays.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className={styles.calendarDaysGrid}>
                {calendarDays.map((date) => {
                  const key = dateKey(date);
                  const dayNum = date.getDate();
                  const isCurrentMonth = date.getMonth() === selectedMonthDate.getMonth();
                  const isToday = key === dateKey(today);
                  const isSelected = key === dateKey(selectedDate);
                  const act = activityByDate.get(key);
                  const hasAttempts = (act?.totalAttempts ?? 0) > 0;
                  const hasSession = nextSession && dateKey(new Date(nextSession.startsAt)) === key;

                  let cellClass = styles.calDayCell;
                  if (!isCurrentMonth) cellClass += ` ${styles.calDayCellOutside}`;
                  if (isSelected) cellClass += ` ${styles.calDayCellSelected}`;

                  return (
                    <button
                      key={key}
                      type="button"
                      className={cellClass}
                      title={`${key}: ${act?.totalAttempts ?? 0} bài đã nộp`}
                      aria-label={`${date.toLocaleDateString("vi-VN")}, ${act?.totalAttempts ?? 0} bài đã nộp`}
                      aria-pressed={isSelected}
                      onClick={() => selectCalendarDate(date)}
                    >
                      <span className={`${styles.calDayNumber} ${hasAttempts ? styles.calDayNumberActive : ""}`}>
                        {dayNum}
                      </span>
                      <div className={styles.calDayDots}>
                        {isToday && <span className={styles.calDotToday} />}
                        {hasSession && <span className={styles.calDotSession} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.activityCard}>
              <div className={styles.activityCardHeader}>
                <span className={styles.activityCardTitle}>Thống kê số bài đã làm trong tuần</span>
                <Link href="/student/history" className={styles.activityCardLink}>
                  Xem tất cả →
                </Link>
              </div>
              <p className={styles.activityCardSubtitle}>Dữ liệu từ những bài đã nộp thành công.</p>

              <div className={styles.activityTableWrapper}>
                <table className={styles.activityTable}>
                  <thead>
                    <tr>
                      <th>NGÀY</th>
                      <th aria-label="Reading" title="Reading">
                        <BookOpenText className={styles.activitySkillIcon} size={17} weight="bold" aria-hidden="true" />
                      </th>
                      <th aria-label="Listening" title="Listening">
                        <Headphones className={styles.activitySkillIcon} size={17} weight="bold" aria-hidden="true" />
                      </th>
                      <th aria-label="Writing" title="Writing">
                        <PencilLine className={styles.activitySkillIcon} size={17} weight="bold" aria-hidden="true" />
                      </th>
                      <th aria-label="Speaking" title="Speaking">
                        <Microphone className={styles.activitySkillIcon} size={17} weight="bold" aria-hidden="true" />
                      </th>
                      <th>THỜI GIAN<br />HỌC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weekItems.map(({ date, activity: item }) => (
                      <tr key={dateKey(date)}>
                        <td>{date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</td>
                        <ActivityCountCell value={item?.reading ?? 0} />
                        <ActivityCountCell value={item?.listening ?? 0} />
                        <ActivityCountCell value={item?.writing ?? 0} />
                        <ActivityCountCell value={item?.speaking ?? 0} />
                        <td className={styles.activityDuration}>{formatDuration(item?.durationSeconds ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className={styles.activityTotalRow}>
                      <td>Tổng</td>
                      <td>{weeklyTotals.reading}</td>
                      <td>{weeklyTotals.listening}</td>
                      <td>{weeklyTotals.writing}</td>
                      <td>{weeklyTotals.speaking}</td>
                      <td>{formatDuration(weeklyTotals.durationSeconds)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Today's Focus Priority Tasks */}
          <section aria-labelledby="today-title">
            <div className={styles.sectionHead}>
              <div className={styles.sectionHeadLeft}>
                <div className={styles.sectionHeadIcon}>
                  <Target size={16} weight="bold" />
                </div>
                <div className={styles.sectionHeadTitles}>
                  <h2 id="today-title">Today&apos;s focus</h2>
                  <p>Chỉ những việc thực sự cần sự chú ý của bạn.</p>
                </div>
              </div>
              <Link href="/student/assignments" className={styles.textLink}>
                Tất cả bài tập →
              </Link>
            </div>

            <div className={styles.todayGrid} style={{ marginTop: "12px" }}>
              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <h3>
                    <BookOpenText size={16} weight="bold" /> Priority tasks
                  </h3>
                  <span>{pendingAssignmentCount} bài</span>
                </div>
                {pendingAssignmentCount ? (
                  <div className={styles.taskList}>
                    {pendingAssignments.slice(0, 3).map((item) => (
                      <div key={item.assignmentId} className={styles.taskRow}>
                        <span className={styles.taskIcon}>
                          <BookOpenText size={17} weight="bold" />
                        </span>
                        <span className={styles.taskCopy}>
                          <strong>{item.title}</strong>
                          <span>
                            {item.courseName} · {item.closesAt ? `Hạn ${new Date(item.closesAt).toLocaleDateString("vi-VN")}` : "Không giới hạn thời gian"}
                          </span>
                        </span>
                        <Link href="/student/reading" className={styles.rowAction}>
                          {item.activeAttemptExpiresAt ? "Tiếp tục" : "Mở bài"}
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    ))}
                    {pendingCourseAssignments.slice(0, 3).map((item) => (
                      <div key={item.assignmentId} className={styles.taskRow}>
                        <span className={styles.taskIcon}><BookOpenText size={17} weight="bold" /></span>
                        <span className={styles.taskCopy}>
                          <strong>{item.title}</strong>
                          <span>{item.courseName} · {item.sessionTitle || (item.sessionNo ? `Buổi ${item.sessionNo}` : "Assignment khóa học")}{item.dueAt ? ` · Hạn ${new Date(item.dueAt).toLocaleDateString("vi-VN")}` : ""}</span>
                        </span>
                        <Link href={`/student/courses/${item.courseId}?tab=assignments`} className={styles.rowAction}>
                          {item.status === "NEEDS_REVISION" ? "Nộp bản sửa" : "Mở bài"}
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.empty}>
                    <span className={styles.emptyIcon}>
                      <CheckCircle size={20} weight="bold" />
                    </span>
                    <strong>Bạn đã xử lý hết bài được giao.</strong>
                    <p>Khi giáo viên giao bài mới, nhiệm vụ sẽ xuất hiện tại đây.</p>
                  </div>
                )}
              </div>

              <aside className={styles.focusColumn} aria-label="Lịch học và gợi ý">
                {nextSession ? (
                  <article className={styles.sessionCard}>
                    <div className={styles.focusTop}>
                      <p className={styles.sessionTop}>
                        <span><CalendarBlank size={14} weight="bold" /></span> Upcoming class
                      </p>
                      <CourseTrackBadge skillPair={scheduleSkillPair} />
                    </div>
                    <strong>{nextSession.title || nextSession.courseName}</strong>
                    <p>
                      {formatDateTime(nextSession.startsAt)}
                      {nextSession.teacherName ? ` · ${nextSession.teacherName}` : ""}
                    </p>
                    <Link href="/student/schedule">
                      Mở thời khóa biểu →
                    </Link>
                  </article>
                ) : (
                  <article className={styles.sessionCard}>
                    <div className={styles.focusTop}>
                      <p className={styles.sessionTop}>
                        <span><CalendarBlank size={14} weight="bold" /></span> Class schedule
                      </p>
                      <CourseTrackBadge skillPair={scheduleSkillPair} />
                    </div>
                    <strong>Chưa có buổi học sắp tới</strong>
                    <p>Lịch mới sẽ tự động xuất hiện sau khi bạn được xếp lớp.</p>
                    <Link href="/student/schedule">
                      Xem thời khóa biểu →
                    </Link>
                  </article>
                )}
              </aside>
            </div>
          </section>
        </div>

        {/* RIGHT / SIDEBAR COLUMN */}
        <aside className={styles.sidebarColumn} aria-label="Thông tin mục tiêu và học liệu">
          {/* Widget 1: Mục tiêu của bạn - REAL PROGRESS */}
          <div className={styles.goalWidget}>
            <div className={styles.goalHeader}>
              <div className={styles.goalHeaderTitle}>
                <Target size={16} weight="bold" />
                <span>Mục tiêu của bạn</span>
              </div>
              <button
                type="button"
                className={styles.goalPillBtn}
                onClick={() => setShowGoalModal((prev) => !prev)}
              >
                {showGoalModal ? "Đóng" : "Xem chi tiết"}
              </button>
            </div>

            {showGoalModal && (
              <div style={{ marginBottom: "14px", padding: "10px", background: "#FAF7F9", borderRadius: "10px" }}>
                <StudentTargetBandControl compact id="sidebar-target-control" />
              </div>
            )}

            <div className={styles.goalContent}>
              <div className={styles.gaugeWrapper}>
                <svg className={styles.gaugeSvg} viewBox="0 0 70 70">
                  <circle
                    cx="35"
                    cy="35"
                    r="28"
                    stroke="#F8EFF2"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="35"
                    cy="35"
                    r="28"
                    stroke="#BD4F70"
                    strokeWidth="6"
                    strokeDasharray={2 * Math.PI * 28}
                    strokeDashoffset={(2 * Math.PI * 28) * (1 - courseProgress / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className={styles.gaugeCenter}>
                  <span className={styles.gaugePercent}>{courseProgress}%</span>
                  <span className={styles.gaugeLabel}>Hoàn thành</span>
                </div>
              </div>

              <div className={styles.goalTextGroup}>
                <p className={styles.goalTextTitle}>
                  {targetBand != null ? `Đạt band ${formatBand(targetBand)} IELTS` : "Chưa đặt band mục tiêu"}
                </p>
                <p className={styles.goalTextDesc}>
                  {courseProgress > 0 ? `Còn ${100 - courseProgress}% để chạm đích` : "Bắt đầu học để ghi nhận tiến độ"}
                </p>
              </div>
            </div>

            <div className={styles.goalProgressBar}>
              <div className={styles.goalProgressFill} style={{ width: `${courseProgress}%` }} />
            </div>
          </div>

          {/* Widget 2: Kỳ thi IELTS gần nhất - REAL EXAM DATE */}
          <div className={styles.examWidget}>
            <div className={styles.examHeader}>
              <div className={styles.examHeaderLeft}>
                <div className={styles.examIconBox}>
                  <CalendarBlank size={17} weight="bold" />
                </div>
                <div className={styles.examInfoTexts}>
                  <span className={styles.examHeaderTitle}>Kỳ thi IELTS gần nhất</span>
                  <span className={styles.examDateText}>
                    {examDateObject
                      ? `Tháng ${examDateObject.getMonth() + 1}, ${examDateObject.getFullYear()}`
                      : "Chưa có dự định"}
                  </span>
                  <span className={styles.examDaysText}>
                    {daysRemaining != null ? `Còn ${daysRemaining} ngày` : "Cập nhật ngày thi"}
                  </span>
                </div>
              </div>
              <Link href="/student/roadmap" className={styles.examPlanBtn}>
                Xem kế hoạch →
              </Link>
            </div>
            <div className={styles.examSparkles}>
              <Sparkle size={16} weight="fill" />
            </div>
          </div>

          {/* Widget 3: Roadmap Banner Promo - Vector Crisp & 100% Matching Design */}
          <Link
            href="/student/roadmap"
            className={styles.roadmapPromoWidget}
            aria-label="Cùng nhau chinh phục Band 7.0! - Xem lộ trình học tập"
          >
            {/* Left Content */}
            <div className={styles.roadmapPromoContent}>
              <div className={styles.promoStarsRow}>
                {/* 3D Puffy Star SVG */}
                <svg className={styles.promoStarPuffy} viewBox="0 0 24 24" fill="none">
                  <defs>
                    <linearGradient id="puffyStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#E594AB" />
                      <stop offset="50%" stopColor="#C95B7E" />
                      <stop offset="100%" stopColor="#9C304F" />
                    </linearGradient>
                    <filter id="puffyStarShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#BD4F70" floodOpacity="0.32" />
                    </filter>
                  </defs>
                  {/* Rounded puffy 5-point star */}
                  <path
                    d="M 12 2 C 12.8 2, 13.5 6, 14.8 7.8 C 16.5 7.8, 20.5 8.2, 21.2 9 C 21.8 9.8, 18.5 12.8, 17.5 14.2 C 18 16, 19.5 20, 18.8 20.8 C 18 21.5, 14.5 19, 12 18 C 9.5 19, 6 21.5, 5.2 20.8 C 4.5 20, 6 16, 6.5 14.2 C 5.5 12.8, 2.2 9.8, 2.8 9 C 3.5 8.2, 7.5 7.8, 9.2 7.8 C 10.5 6, 11.2 2, 12 2 Z"
                    fill="url(#puffyStarGrad)"
                    filter="url(#puffyStarShadow)"
                  />
                  <ellipse cx="12" cy="7" rx="3.5" ry="2" fill="#FFFFFF" opacity="0.35" />
                </svg>

                {/* Outlined Star */}
                <svg className={styles.promoStarOutline} viewBox="0 0 24 24" fill="none">
                  <path
                    d="M 12 2.5 L 14.7 8.5 L 21.5 9.1 L 16.4 13.7 L 17.9 20.4 L 12 16.8 L 6.1 20.4 L 7.6 13.7 L 2.5 9.1 L 9.3 8.5 Z"
                    stroke="#BD4F70"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className={styles.promoTextGroup}>
                <span className={styles.promoTitleLine1}>Cùng nhau chinh phục</span>
                <span className={styles.promoTitleLine2}>Band 7.0!</span>
                <p className={styles.promoSubtitle}>
                  Mỗi ngày học một chút,<br />bạn sẽ thấy sự thay đổi lớn!
                </p>
              </div>

              <div className={styles.promoActionBtn}>
                <span>Xem lộ trình học tập</span>
                <ArrowRight size={12} weight="bold" />
              </div>
            </div>

            {/* Design Mountain Artwork - Matching Image 4 Directly */}
            <div className={styles.promoMountainWrap} aria-hidden="true">
              <img
                src="/images/achievement-mountain-design.png"
                alt=""
                className={styles.promoMountainImg}
              />
            </div>
          </Link>

          {/* Widget 4: Featured Materials */}
          <div className={styles.materialsWidget}>
            <div className={styles.materialsHeader}>
              <div className={styles.materialsHeaderTitle}>
                <div className={styles.materialHeaderIcon}>
                  <BookOpenText size={15} weight="bold" />
                </div>
                <span>Học liệu nổi bật</span>
              </div>
              <Link href="/student/practice" className={styles.materialsHeaderLink}>
                Xem tất cả →
              </Link>
            </div>

            <div className={styles.materialsList}>
              <Link href="/student/practice" className={styles.materialItem}>
                <div className={styles.materialItemLeft}>
                  <div className={styles.materialIconBox}>
                    <FileText size={16} weight="bold" />
                  </div>
                  <div className={styles.materialInfo}>
                    <span className={styles.materialTitle}>Bộ từ vựng chủ đề Education</span>
                    <span className={styles.materialMeta}>PDF · 25 trang</span>
                  </div>
                </div>
                <ArrowCaret size={13} className={styles.materialArrow} />
              </Link>

              <Link href="/student/reading" className={styles.materialItem}>
                <div className={styles.materialItemLeft}>
                  <div className={styles.materialIconBox}>
                    <Video size={16} weight="bold" />
                  </div>
                  <div className={styles.materialInfo}>
                    <span className={styles.materialTitle}>Chiến lược làm bài Reading</span>
                    <span className={styles.materialMeta}>Video · 12 phút</span>
                  </div>
                </div>
                <ArrowCaret size={13} className={styles.materialArrow} />
              </Link>

              <Link href="/student/practice" className={styles.materialItem}>
                <div className={styles.materialItemLeft}>
                  <div className={styles.materialIconBox}>
                    <FileText size={16} weight="bold" />
                  </div>
                  <div className={styles.materialInfo}>
                    <span className={styles.materialTitle}>Mẫu bài Writing Task 2</span>
                    <span className={styles.materialMeta}>PDF · 18 trang</span>
                  </div>
                </div>
                <ArrowCaret size={13} className={styles.materialArrow} />
              </Link>
            </div>
          </div>

          {/* Widget 5: Continue Lesson - REAL ASSIGNMENT TITLE */}
          <Link href={pendingAssignments.length > 0 ? "/student/reading" : "/student/practice"} className={styles.continueLessonWidget}>
            <div className={styles.continueLessonLeft}>
              <div className={styles.continueBadge}>
                {pendingAssignments.length > 0 ? "Bài 1" : "IELTS"}
              </div>
              <span className={styles.continueTitle}>
                {pendingAssignments.length > 0 ? `Tiếp tục: ${pendingAssignments[0].title}` : "Luyện tập kỹ năng mới"}
              </span>
            </div>
            <ArrowCaret size={14} className={styles.materialArrow} />
          </Link>
        </aside>
      </div>
    </div>
  );
}

function CourseTrackBadge({
  skillPair,
  inverted = false,
}: {
  skillPair?: "LISTENING_READING" | "SPEAKING_WRITING";
  inverted?: boolean;
}) {
  if (!skillPair) return null;
  const listeningReading = skillPair === "LISTENING_READING";
  return (
    <span
      className={styles.trackBadge}
      data-inverted={inverted || undefined}
      title={listeningReading ? "Khóa Listening & Reading" : "Khóa Speaking & Writing"}
    >
      <b>{listeningReading ? "LR" : "SW"}</b>
      <span>{listeningReading ? "Listening & Reading" : "Speaking & Writing"}</span>
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className={styles.overview} aria-busy="true" aria-label="Đang tải dữ liệu học tập">
      <div className={styles.skeleton} />
      <div className={styles.skeleton} />
    </div>
  );
}

function DashboardError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={styles.errorState}>
      <div>
        <WarningCircle size={36} className="mx-auto text-[#BD4F70]" weight="duotone" />
        <h2>Không tải được góc học tập</h2>
        <p>{message}</p>
        <button type="button" onClick={onRetry} className={styles.retry}>
          <ArrowClockwise size={15} /> Thử lại
        </button>
      </div>
    </div>
  );
}
