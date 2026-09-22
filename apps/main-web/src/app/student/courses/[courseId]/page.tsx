"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Article,
  BookmarkSimple,
  CalendarBlank,
  CalendarCheck,
  ChalkboardTeacher,
  Check,
  CheckCircle,
  Clock,
  DotsThree,
  GraduationCap,
  MagnifyingGlass,
  MapPin,
  Moon,
  Info,
  Bell,
  ShieldCheck,
  Users,
  VideoCamera,
} from "@phosphor-icons/react";
import { useStudentPortal } from "@/features/student-hub/StudentPortalProvider";
import {
  fetchSystemCourses,
  fetchCourseSessions,
  type DatabaseCourseItem,
  type StudentPortalEnrollment,
  type ClassSessionItem,
} from "@/features/student-hub/studentPortalApi";
import { skillPairLabel } from "@/features/student-hub/studentPortalViewModel";
import styles from "./StudentCourseDetailPage.module.css";

export default function StudentCourseDetailPage() {
  const params = useParams();
  const rawCourseId = params?.courseId as string;

  const { data, loading: portalLoading } = useStudentPortal();
  const [systemCourses, setSystemCourses] = useState<DatabaseCourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Real class sessions from database
  const [sessions, setSessions] = useState<ClassSessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Search query for sessions
  const [searchQuery, setSearchQuery] = useState("");

  // Expandable full curriculum toggle
  const [showFullCurriculum, setShowFullCurriculum] = useState(false);

  // Load all system courses
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoadingCourses(true);
      try {
        const list = await fetchSystemCourses();
        if (isMounted) setSystemCourses(list);
      } catch (err) {
        console.error("Error loading system courses:", err);
      } finally {
        if (isMounted) setLoadingCourses(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Match student's enrollment
  const enrollment: StudentPortalEnrollment | null = useMemo(() => {
    if (!data?.enrollments || !rawCourseId) return null;
    return (
      data.enrollments.find(
        (e) =>
          e.courseId === rawCourseId ||
          e.courseCode.toLowerCase() === rawCourseId.toLowerCase(),
      ) ?? null
    );
  }, [data?.enrollments, rawCourseId]);

  // Match system course details
  const course: DatabaseCourseItem | null = useMemo(() => {
    const found = systemCourses.find(
      (c) =>
        c.id === rawCourseId ||
        c.code.toLowerCase() === rawCourseId.toLowerCase(),
    );
    if (found) return found;
    if (enrollment) {
      return {
        id: enrollment.courseId,
        code: enrollment.courseCode,
        name: enrollment.courseName,
        description: enrollment.description,
        level: enrollment.level,
        skillPair: enrollment.skillPair,
        targetBand: enrollment.courseTargetBand,
        totalSessions: enrollment.totalSessions,
        tuitionAmount: null,
        capacity: 24,
        startsOn: enrollment.startsOn,
        endsOn: enrollment.endsOn,
        status: enrollment.status === "ACTIVE" ? "ACTIVE" : "OPEN",
        defaultZoomUrl: null,
        isPublic: true,
        isActive: true,
      };
    }
    return null;
  }, [systemCourses, rawCourseId, enrollment]);

  // Load real sessions from backend for this course
  useEffect(() => {
    let isMounted = true;
    if (!course?.id) return;

    async function loadSessions() {
      setLoadingSessions(true);
      try {
        const sessionList = await fetchCourseSessions(course!.id);
        if (isMounted) setSessions(sessionList);
      } catch (err) {
        console.warn("Could not load course sessions:", err);
      } finally {
        if (isMounted) setLoadingSessions(false);
      }
    }
    loadSessions();
    return () => {
      isMounted = false;
    };
  }, [course?.id]);

  // Real reading assignments for this course
  const courseAssignments = useMemo(() => {
    if (!data?.readingAssignments || !course?.id) return [];
    return data.readingAssignments.filter((a) => a.courseId === course.id);
  }, [data?.readingAssignments, course?.id]);

  // Real upcoming session for this course
  const upcomingSession = useMemo(() => {
    if (!course?.id) return null;
    const portalUpcoming = (data?.upcomingSessions || []).find(
      (s) => s.courseId === course.id,
    );
    if (portalUpcoming) return portalUpcoming;

    const nextInList = sessions.find((s) => s.status === "SCHEDULED");
    if (nextInList) {
      return {
        sessionId: nextInList.id,
        courseId: nextInList.courseId,
        courseCode: course.code,
        courseName: course.name,
        sessionNo: nextInList.sessionNo,
        title: nextInList.title,
        phaseName: nextInList.phaseName,
        startsAt: nextInList.startsAt || "",
        endsAt: nextInList.endsAt || "",
        status: "SCHEDULED" as const,
        teacherName: nextInList.teacherName || enrollment?.primaryTeacherName || null,
        zoomUrl: nextInList.zoomUrl || course.defaultZoomUrl,
      };
    }
    return null;
  }, [data?.upcomingSessions, course, sessions, enrollment]);

  // Group real sessions by Phase / Module
  const phaseGroups = useMemo(() => {
    if (!sessions.length) return [];
    const map = new Map<string, ClassSessionItem[]>();
    sessions.forEach((s) => {
      const phase = s.phaseName?.trim() || "Lộ trình đào tạo toàn diện";
      if (!map.has(phase)) map.set(phase, []);
      map.get(phase)!.push(s);
    });
    return Array.from(map.entries()).map(([phaseName, phaseSessions]) => ({
      phaseName,
      sessions: phaseSessions.sort((a, b) => a.sessionNo - b.sessionNo),
    }));
  }, [sessions]);

  // Real metrics
  const totalSessions =
    course?.totalSessions ||
    enrollment?.totalSessions ||
    sessions.length ||
    0;
  const completedSessions =
    enrollment?.completedSessions ||
    sessions.filter((s) => s.status === "COMPLETED").length ||
    0;
  const progressPercent =
    totalSessions > 0
      ? Math.min(100, Math.round((completedSessions / totalSessions) * 100))
      : 0;

  const targetBand =
    course?.targetBand ??
    enrollment?.courseTargetBand ??
    data?.profile?.targetBand ??
    null;
  const teacherName =
    enrollment?.primaryTeacherName || upcomingSession?.teacherName || null;
  const zoomUrl = upcomingSession?.zoomUrl || course?.defaultZoomUrl || null;

  // Filtered sessions for Schedule preview (next 3 scheduled or recent)
  const scheduledPreview = useMemo(() => {
    const upcomingList = sessions.filter((s) => s.status === "SCHEDULED");
    if (upcomingList.length > 0) return upcomingList.slice(0, 3);
    return sessions.slice(0, 3);
  }, [sessions]);

  // Format today's date in Lumina style (e.g. Tuesday, September 22, 2026)
  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }, []);

  if (loadingCourses || portalLoading) {
    return (
      <div className={styles.viewportWrapper}>
        <div className={styles.dashboardContainer}>
          <div className="h-8 w-48 bg-stone-200/80 rounded animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 bg-white rounded-2xl animate-pulse" />
            <div className="h-64 bg-stone-900 rounded-2xl animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={styles.viewportWrapper}>
        <div className="max-w-md mx-auto py-20 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white text-[#894C5B] shadow-card flex items-center justify-center mx-auto">
            <GraduationCap size={28} weight="duotone" />
          </div>
          <h2 className="text-xl font-bold text-[#1B2559]">Không tìm thấy khóa học</h2>
          <p className="text-sm text-[#A3AED0]">
            Khóa học này không tồn tại hoặc tài khoản học viên của bạn chưa được cấp quyền truy cập.
          </p>
          <Link
            href="/student/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B1437] text-white text-xs font-bold hover:bg-[#894C5B] transition-colors"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Quay lại danh sách khóa học</span>
          </Link>
        </div>
      </div>
    );
  }

  const courseDisplayName = course.name.replace(/^IELTS\s*/i, "");

  return (
    <div className={styles.viewportWrapper}>
      <div className={styles.dashboardContainer}>
        {/* ==========================================================================
            HEADER: Breadcrumb & Lumina Search / Utility Capsule
            ========================================================================== */}
        <header className={styles.headerBar}>
          <div className={styles.headerLeft}>
            <div className={styles.breadcrumb}>
              <Link href="/student/courses" className={styles.breadcrumbLink}>
                Khóa học
              </Link>
              <span>/</span>
              <span className={styles.breadcrumbCurrent}>{course.code}</span>
            </div>
            <h1 className={styles.headerTitle}>
              <em>IELTS</em>
              {courseDisplayName}
            </h1>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.utilityCapsule}>
              <div className={styles.searchInputWrapper}>
                <MagnifyingGlass size={16} weight="bold" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài học..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button
                type="button"
                className={styles.utilityIconBtn}
                title="Thông báo khóa học"
                aria-label="Thông báo"
              >
                <Bell size={18} weight="bold" />
                <span className={styles.notificationDot} />
              </button>

              <button
                type="button"
                className={styles.utilityIconBtn}
                title="Thông tin khóa học"
                aria-label="Thông tin"
                onClick={() => setShowFullCurriculum(!showFullCurriculum)}
              >
                <Info size={18} weight="bold" />
              </button>

              <Link
                href="/student/courses"
                className="text-xs font-bold text-[#894C5B] px-3 py-1.5 rounded-full bg-[#894C5B]/10 hover:bg-[#894C5B]/20 transition-colors"
              >
                Danh mục
              </Link>
            </div>
          </div>
        </header>

        {/* ==========================================================================
            ROW 1: GREETING & PAYROLL CARDS (COCKPIT & TARGET CARD)
            ========================================================================== */}
        <section className={styles.rowOne} aria-label="Tổng quan điều hành buổi học">
          {/* Left Card: Greeting & Live Classroom Cockpit (Span 2) */}
          <div className={styles.greetingCard}>
            <div className={styles.greetingMain}>
              <div className={styles.onlineBadgeRow}>
                <span className={styles.onlineBadge}>
                  <i aria-hidden="true" />
                  {upcomingSession ? "Buổi học tiếp theo" : "Đang cập nhật lịch"}
                </span>
                <span className={styles.currentDateText}>{todayFormatted}</span>
              </div>

              <h2 className={styles.greetingHeading}>
                {upcomingSession
                  ? `Buổi ${upcomingSession.sessionNo}: ${upcomingSession.title || "Lớp học trực tuyến"}`
                  : `Khóa học ${course.name}`}
              </h2>

              <p className={styles.greetingSubtext}>
                Chương trình đào tạo {skillPairLabel(course.skillPair)} · Giảng viên:{" "}
                <strong className="text-[#1B2559]">{teacherName || "Ban Giảng huấn IELTS Spells"}</strong> ·{" "}
                Đã hoàn thành {completedSessions}/{totalSessions > 0 ? totalSessions : "–"} buổi học.
              </p>

              <div className={styles.greetingButtonRow}>
                {zoomUrl ? (
                  <a
                    href={zoomUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.primaryNavyBtn}
                  >
                    <VideoCamera size={18} weight="fill" />
                    <span>Vào lớp Zoom ngay</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowFullCurriculum(true)}
                    className={styles.primaryNavyBtn}
                  >
                    <CalendarBlank size={18} weight="bold" />
                    <span>Xem lịch học chi tiết</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowFullCurriculum(!showFullCurriculum)}
                  className={styles.secondaryWhiteBtn}
                >
                  <ShieldCheck size={18} weight="bold" className="text-[#894C5B]" />
                  <span>Cam kết chuẩn đầu ra</span>
                </button>
              </div>
            </div>

            {/* Circular Punch-Out Visual in Lumina Card */}
            <div className={styles.punchVisualContainer} aria-hidden="true">
              <div className={styles.punchBlurBlob} />
              <div className={styles.punchCircleButton}>
                <Clock size={28} weight="duotone" className={styles.punchIcon} />
                <span className={styles.punchLabel}>GIỜ HỌC</span>
                <span className={styles.punchTimer}>
                  {upcomingSession?.startsAt
                    ? new Intl.DateTimeFormat("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(upcomingSession.startsAt))
                    : "19:30"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Card: Dark Contrast Target Band & Guarantee (Span 1) */}
          <div className={styles.payrollCard}>
            <div className={styles.payrollCardBlob} />

            <div>
              <div className={styles.payrollTop}>
                <span className={styles.payrollLabel}>MỤC TIÊU · CHUẨN ĐẦU RA</span>
                <GraduationCap size={22} weight="duotone" className={styles.payrollCardIcon} />
              </div>

              <div className={styles.payrollAmount}>
                Band {targetBand != null ? targetBand.toFixed(1) : "7.0+"}
              </div>

              {/* Mini Bar Chart showing learning milestone progress */}
              <div className={styles.miniChartContainer} aria-label="Tiến độ lộ trình">
                <div className={styles.miniBar} style={{ height: "40%" }} title="Khởi động" />
                <div className={styles.miniBar} style={{ height: "55%" }} title="Nền tảng" />
                <div className={styles.miniBar} style={{ height: "70%" }} title="Phương pháp" />
                <div className={styles.miniBar} style={{ height: "48%" }} title="Luyện đề" />
                <div
                  className={`${styles.miniBar} ${styles.miniBarActive}`}
                  style={{ height: "90%" }}
                  title="Hiện tại: Đang tăng tốc"
                />
                <div className={styles.miniBar} style={{ height: "65%" }} title="Về đích" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFullCurriculum(true)}
              className={styles.payrollActionBtn}
            >
              <ShieldCheck size={16} weight="bold" />
              <span>Chính sách cam kết & Học bù</span>
            </button>
          </div>
        </section>

        {/* ==========================================================================
            ROW 2: QUICK STATS (4-COLUMN GRID)
            ========================================================================== */}
        <section className={styles.quickStatsGrid} aria-label="Chỉ số học vụ trọng yếu">
          {/* Stat 1: Thời lượng khóa */}
          <div className={styles.statCard}>
            <div className={`${styles.statIconCircle} ${styles.statIconBlue}`}>
              <Clock size={24} weight="duotone" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Thời lượng khóa</span>
              <span className={styles.statValue}>
                {totalSessions > 0 ? `${totalSessions} buổi` : "Linh hoạt"}
              </span>
            </div>
          </div>

          {/* Stat 2: Chuyên cần */}
          <div className={styles.statCard}>
            <div className={`${styles.statIconCircle} ${styles.statIconOrange}`}>
              <CheckCircle size={24} weight="duotone" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Tỷ lệ chuyên cần</span>
              <span className={styles.statValue}>{progressPercent}%</span>
            </div>
          </div>

          {/* Stat 3: Sĩ số lớp */}
          <div className={styles.statCard}>
            <div className={`${styles.statIconCircle} ${styles.statIconPurple}`}>
              <Users size={24} weight="duotone" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Sĩ số tối đa</span>
              <span className={styles.statValue}>
                {course.capacity ? `${course.capacity} HV` : "24 học viên"}
              </span>
            </div>
          </div>

          {/* Stat 4: Nhiệm vụ */}
          <div className={styles.statCard}>
            <div className={`${styles.statIconCircle} ${styles.statIconCyan}`}>
              <Article size={24} weight="duotone" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Nhiệm vụ khóa</span>
              <span className={styles.statValue}>
                {courseAssignments.length} bài tập
              </span>
            </div>
          </div>
        </section>

        {/* ==========================================================================
            ROW 3: DETAILS CARDS (3-COLUMN GRID: LOCATION, SCHEDULE, PRIORITY TASKS)
            ========================================================================== */}
        <section className={styles.detailsGrid} aria-label="Chi tiết hoạt động khóa học">
          {/* Detail Card 1: Work Location & Room Details */}
          <div className={styles.detailCard}>
            <div className={styles.detailCardHeader}>
              <h3 className={styles.detailCardHeading}>Địa điểm & Phòng học</h3>
              <DotsThree size={24} weight="bold" className="text-[#A3AED0]" />
            </div>

            <div className={styles.locationNestedBlock}>
              <div className={styles.locationInfo}>
                <div className={styles.locationPinCircle}>
                  <MapPin size={20} weight="fill" />
                </div>
                <div>
                  <div className={styles.locationName}>
                    {zoomUrl ? "Phòng học Zoom trực tuyến" : "Cơ sở The IELTS Spells"}
                  </div>
                  <div className={styles.locationCity}>
                    {zoomUrl ? "Lớp trực tuyến bản quyền" : "Phòng học học thuật chuyên sâu"}
                  </div>
                </div>
              </div>
              <span className={styles.locationBadge}>Phòng chính</span>
            </div>

            <div className={styles.timeLogList}>
              <div className={styles.timeLogRow}>
                <span className={styles.timeLogLabel}>
                  <Clock size={16} /> Giờ vào lớp
                </span>
                <span className={styles.timeLogVal}>
                  {upcomingSession?.startsAt
                    ? new Intl.DateTimeFormat("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(upcomingSession.startsAt))
                    : "19:30 PM"}
                </span>
              </div>

              <div className={styles.timeLogRow}>
                <span className={styles.timeLogLabel}>
                  <Clock size={16} /> Giờ tan lớp
                </span>
                <span className={styles.timeLogVal}>
                  {upcomingSession?.endsAt
                    ? new Intl.DateTimeFormat("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(upcomingSession.endsAt))
                    : "21:00 PM"}
                </span>
              </div>
            </div>

            <div className={styles.overtimeStatusRow}>
              <span>Tiến độ học vụ tuần</span>
              <span className={styles.overtimeStatusBadge}>Đúng kế hoạch đào tạo</span>
            </div>
          </div>

          {/* Detail Card 2: Schedule Timeline */}
          <div className={styles.detailCard}>
            <div className={styles.detailCardHeader}>
              <h3 className={styles.detailCardHeading}>Lịch học tiếp theo</h3>
              <button
                type="button"
                onClick={() => setShowFullCurriculum(true)}
                className={styles.detailCardAction}
              >
                Xem tất cả
              </button>
            </div>

            <div className={styles.scheduleList}>
              {scheduledPreview.length > 0 ? (
                scheduledPreview.map((item, index) => {
                  const dateObj = item.startsAt ? new Date(item.startsAt) : new Date();
                  const monthStr = `TH ${dateObj.getMonth() + 1}`;
                  const dayStr = dateObj.getDate().toString().padStart(2, "0");
                  const colorClass =
                    index === 0
                      ? styles.dateNavy
                      : index === 1
                      ? styles.datePurple
                      : styles.dateOrange;

                  return (
                    <div key={item.id} className={styles.scheduleItem}>
                      <div className={`${styles.scheduleDateSquare} ${colorClass}`}>
                        <span className={styles.dateMonth}>{monthStr}</span>
                        <span className={styles.dateDay}>{dayStr}</span>
                      </div>

                      <div className={styles.scheduleBody}>
                        <h4 className={styles.scheduleTitle}>
                          {item.title || `Buổi học ${item.sessionNo}`}
                        </h4>
                        <div className={styles.scheduleMeta}>
                          <VideoCamera size={14} />
                          <span>
                            {item.startsAt
                              ? new Intl.DateTimeFormat("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }).format(dateObj)
                              : "19:30"}
                            {item.phaseName ? ` · ${item.phaseName}` : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-[#A3AED0]">
                  Thời khóa biểu đang được đồng bộ
                </div>
              )}
            </div>
          </div>

          {/* Detail Card 3: Priority Tasks / Homework Checklist */}
          <div className={styles.detailCard}>
            <div className={styles.detailCardHeader}>
              <h3 className={styles.detailCardHeading}>Nhiệm vụ cần nộp</h3>
              <Link
                href="/student/practice?skill=READING"
                className={styles.detailCardAction}
              >
                Khu luyện đề →
              </Link>
            </div>

            <div className={styles.taskList}>
              {courseAssignments.length > 0 ? (
                courseAssignments.slice(0, 3).map((assignment) => {
                  const isDone =
                    assignment.attemptsUsed > 0 &&
                    (assignment.maxAttempts > 0
                      ? assignment.attemptsUsed >= assignment.maxAttempts
                      : true);
                  const isUrgent =
                    !isDone &&
                    assignment.closesAt &&
                    new Date(assignment.closesAt).getTime() - Date.now() <
                      3 * 24 * 60 * 60 * 1000;

                  return (
                    <div
                      key={assignment.assignmentId}
                      className={`${styles.taskItem} ${
                        isDone ? styles.taskCompleted : ""
                      }`}
                    >
                      <Link
                        href="/student/practice?skill=READING"
                        className={styles.taskCheckboxWrap}
                      >
                        <div className={styles.customCheckbox}>
                          {isDone && <Check size={12} weight="bold" />}
                        </div>
                        <div className={styles.taskTextStack}>
                          <div className={styles.taskTitle}>
                            {assignment.title}
                          </div>
                          <div className={styles.taskSub}>
                            {isDone
                              ? "Đã hoàn thành"
                              : assignment.closesAt
                              ? `Hạn nộp: ${new Intl.DateTimeFormat("vi-VN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                }).format(new Date(assignment.closesAt))}`
                              : "Chưa có hạn nộp"}
                          </div>
                        </div>
                      </Link>

                      {isUrgent && <span className={styles.priorityRedDot} title="Sắp hết hạn" />}
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-[#A3AED0]">
                  Chưa có bài tập nào cần nộp
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ==========================================================================
            FULL CURRICULUM & POLICIES (ACCORDION / DRAWER)
            ========================================================================== */}
        {showFullCurriculum && (
          <section className={styles.fullCurriculumSection} aria-label="Toàn bộ chương trình đào tạo">
            <div className={styles.sectionHeaderRow}>
              <h3 className={styles.sectionTitle}>Chương trình đào tạo chi tiết ({sessions.length} buổi học)</h3>
              <button
                type="button"
                onClick={() => setShowFullCurriculum(false)}
                className="text-xs font-bold text-[#A3AED0] hover:text-[#1B2559]"
              >
                Thu gọn ✕
              </button>
            </div>

            <div className={styles.curriculumPhaseGrid}>
              {phaseGroups.map((group) => (
                <div key={group.phaseName} className={styles.curriculumPhaseCard}>
                  <div className={styles.curriculumPhaseTitle}>
                    <BookmarkSimple size={18} className="text-[#894C5B]" weight="fill" />
                    <span>{group.phaseName}</span>
                  </div>

                  <div className="space-y-2">
                    {group.sessions.map((s) => (
                      <div key={s.id} className={styles.curriculumSessionRow}>
                        <span className="font-semibold text-[#1B2559]">
                          Buổi #{s.sessionNo}: {s.title || "Bài học"}
                        </span>
                        <span className="text-[11px] text-[#A3AED0]">
                          {s.startsAt
                            ? new Intl.DateTimeFormat("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                              }).format(new Date(s.startsAt))
                            : "Đang xếp"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Output Guarantee Notice */}
            <div className="pt-4 border-t border-[#F4F7FE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#707EAE]">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#05CD99]" weight="fill" />
                <span>
                  <strong>Cam kết chuẩn đầu ra:</strong> Yêu cầu tham gia tối thiểu 90% số buổi học và hoàn thành 80% bài tập về nhà.
                </span>
              </div>
              <span className="font-mono text-[#894C5B] font-bold">THE IELTS SPELLS ACADEMIC STANDARD</span>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
