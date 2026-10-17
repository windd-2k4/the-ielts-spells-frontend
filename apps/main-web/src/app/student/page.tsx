"use client";

import Link from "next/link";
import {
  ArrowClockwise,
  ArrowRight,
  BookOpenText,
  CalendarBlank,
  CheckCircle,
  Clock,
  Headphones,
  Microphone,
  PenNib,
  WarningCircle,
} from "@phosphor-icons/react";
import { StudentTargetBandControl } from "@/features/student-hub/StudentTargetBandControl";
import { useStudentPortal } from "@/features/student-hub/StudentPortalProvider";
import { StudentStudyPulse } from "@/features/student-hub/StudentStudyPulse";
import { formatBand, formatDateTime, skillPairLabel } from "@/features/student-hub/studentPortalViewModel";
import styles from "@/features/student-hub/StudentLearningOverview.module.css";

const skillCards = [
  { name: "Reading", description: "Bài đọc và đề được giao", href: "/student/reading", icon: BookOpenText, available: true },
  { name: "Listening", description: "Nghe theo band mục tiêu", href: "/student/practice", icon: Headphones, available: false },
  { name: "Writing", description: "Task 1, Task 2 và rubric", href: "/student/practice", icon: PenNib, available: false },
  { name: "Speaking", description: "Chủ đề và tiêu chí chấm", href: "/student/practice", icon: Microphone, available: false },
];

export default function StudentDashboardPage() {
  const { data, loading, error, refresh } = useStudentPortal();

  if (loading && !data) return <DashboardSkeleton />;
  if (error && !data) return <DashboardError message={error} onRetry={() => void refresh()} />;
  if (!data) return null;

  const pendingAssignments = data.readingAssignments.filter((item) => item.attemptsUsed < item.maxAttempts);
  const nextSession = data.upcomingSessions[0];
  const activeEnrollment = data.enrollments.find((item) => item.status === "ACTIVE") ?? data.enrollments[0];
  const recommendation = data.recommendedCourses[0];
  const sessionEnrollment = nextSession ? data.enrollments.find((item) => item.courseId === nextSession.courseId) : null;
  const scheduleSkillPair = sessionEnrollment?.skillPair ?? activeEnrollment?.skillPair;
  const courseProgress = activeEnrollment && activeEnrollment.totalSessions > 0
    ? Math.min(100, Math.round((activeEnrollment.completedSessions / activeEnrollment.totalSessions) * 100))
    : 0;

  return (
    <div className={styles.overview}>
      {error && (
        <div role="status" className={styles.notice}>
          <span>{error} Dữ liệu hiển thị có thể chưa được cập nhật.</span>
          <button type="button" disabled={loading} onClick={() => void refresh()} className={styles.textLink}>
            <ArrowClockwise size={16} />{loading ? "Đang cập nhật…" : "Tải lại"}
          </button>
        </div>
      )}

      <StudentStudyPulse data={data} />

      <section aria-labelledby="today-title">
        <div className={styles.sectionHead}>
          <div><h2 id="today-title">Today&apos;s focus</h2><p>Chỉ những việc thực sự cần sự chú ý của bạn.</p></div>
          <Link href="/student/assignments" className={styles.textLink}>Tất cả bài tập<ArrowRight size={14} /></Link>
        </div>
        <div className={styles.todayGrid}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}><h3><BookOpenText size={19} weight="duotone" /> Priority tasks</h3><span>{pendingAssignments.length} bài</span></div>
            {pendingAssignments.length ? (
              <div className={styles.taskList}>
                {pendingAssignments.slice(0, 3).map((item) => (
                  <div key={item.assignmentId} className={styles.taskRow}>
                    <span className={styles.taskIcon}><BookOpenText size={19} weight="duotone" /></span>
                    <span className={styles.taskCopy}>
                      <strong>{item.title}</strong>
                      <span>{item.courseName} · {item.closesAt ? `Hạn ${new Date(item.closesAt).toLocaleDateString("vi-VN")}` : "Không giới hạn thời gian"}</span>
                    </span>
                    <Link href="/student/reading" className={styles.rowAction}>{item.activeAttemptExpiresAt ? "Tiếp tục" : "Mở bài"}<ArrowRight size={13} /></Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}><CheckCircle size={23} weight="duotone" /></span>
                <strong>Bạn đã xử lý hết bài được giao.</strong>
                <p>Khi giáo viên giao bài mới, nhiệm vụ sẽ xuất hiện tại đây.</p>
              </div>
            )}
          </div>

          <aside className={styles.focusColumn} aria-label="Lịch học và gợi ý">
            {nextSession ? (
              <article className={styles.sessionCard}>
                <div className={styles.focusTop}><p className={styles.sessionTop}><span><CalendarBlank size={17} weight="duotone" /></span> Upcoming class</p><CourseTrackBadge skillPair={scheduleSkillPair} /></div>
                <strong>{nextSession.title || nextSession.courseName}</strong>
                <p>{formatDateTime(nextSession.startsAt)}{nextSession.teacherName ? ` · ${nextSession.teacherName}` : ""}</p>
                <Link href="/student/schedule" className={styles.textLink}>Mở thời khóa biểu<ArrowRight size={13} /></Link>
              </article>
            ) : (
              <article className={styles.sessionCard}>
                <div className={styles.focusTop}><p className={styles.sessionTop}><span><CalendarBlank size={17} weight="duotone" /></span> Class schedule</p><CourseTrackBadge skillPair={scheduleSkillPair} /></div>
                <strong>Chưa có buổi học sắp tới</strong>
                <p>Lịch mới sẽ tự động xuất hiện sau khi bạn được xếp lớp.</p>
                <Link href="/student/schedule" className={styles.textLink}>Xem thời khóa biểu<ArrowRight size={13} /></Link>
              </article>
            )}
            <article className={styles.focusCard}>
              <div className={styles.focusTop}><small>{recommendation ? "Recommended path" : "Self practice"}</small><CourseTrackBadge skillPair={recommendation?.skillPair} inverted /></div>
              <strong>{recommendation?.name ?? "Giữ nhịp bằng một bài Reading ngắn"}</strong>
              <p>{recommendation?.reason ?? "Chọn bài phù hợp thời gian bạn có và tiếp tục tích lũy dữ liệu học tập."}</p>
              <Link href={recommendation ? "/student/courses" : "/student/practice"} className={styles.textLink}>{recommendation ? "Xem khóa học" : "Chọn bài luyện"}<ArrowRight size={13} /></Link>
            </article>
          </aside>
        </div>
      </section>

      <section aria-labelledby="skills-title">
        <div className={styles.sectionHead}>
          <div><h2 id="skills-title">Skill practice hub</h2><p>Đi thẳng vào kỹ năng bạn muốn cải thiện.</p></div>
          <Link href="/student/practice" className={styles.textLink}>Mở phòng luyện<ArrowRight size={14} /></Link>
        </div>
        <div className={styles.skills}>
          {skillCards.map((skill) => {
            const Icon = skill.icon;
            return (
              <Link key={skill.name} href={skill.href} className={styles.skill} aria-label={`${skill.name}: ${skill.available ? "sẵn sàng" : "đang phát triển"}`}>
                <span className={styles.skillIcon}><Icon size={20} weight="duotone" /></span>
                <span className={styles.skillLabel}><strong>{skill.name}</strong><span>{skill.available ? "Sẵn sàng" : "Sắp có"}</span></span>
                <p>{skill.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className={styles.learningGrid} aria-label="Khóa học và mục tiêu">
        <article className={styles.courseCard}>
          <p className={styles.cardKicker}>My learning journey</p>
          {activeEnrollment ? (
            <>
              <h3>{activeEnrollment.courseName}</h3>
              <p className={styles.courseMeta}><span>{activeEnrollment.courseCode}</span><span>{skillPairLabel(activeEnrollment.skillPair)}</span><span>{activeEnrollment.primaryTeacherName || "Chưa phân công giáo viên"}</span></p>
              <div className={styles.progressLabel}><span>Tiến độ buổi học</span><strong>{activeEnrollment.completedSessions}/{activeEnrollment.totalSessions || 0}</strong></div>
              <div className={styles.progressTrack} role="progressbar" aria-label="Tiến độ khóa học" aria-valuemin={0} aria-valuemax={100} aria-valuenow={courseProgress}><span style={{ width: `${courseProgress}%` }} /></div>
              <div className={styles.courseFooter}><span className={styles.courseMeta}>{activeEnrollment.nextSessionAt ? `Tiếp theo: ${formatDateTime(activeEnrollment.nextSessionAt)}` : "Chưa có lịch tiếp theo"}</span><Link href="/student/courses" className={styles.textLink}>Chi tiết khóa học<ArrowRight size={13} /></Link></div>
            </>
          ) : (
            <>
              <h3>Bạn chưa ghi danh khóa học</h3>
              <p className={styles.courseMeta}>Khóa phù hợp sẽ được lấy trực tiếp từ dữ liệu tuyển sinh và mục tiêu band của bạn.</p>
              <div className={styles.courseFooter}><Link href="/student/courses" className={styles.textLink}>Khám phá khóa học<ArrowRight size={13} /></Link></div>
            </>
          )}
        </article>

        <article id="learning-goal" className={styles.targetCard} tabIndex={-1}>
          <div className={styles.targetHeadline}>
            <div><p className={styles.cardKicker}>Your IELTS target</p><h3>Band IELTS mong muốn</h3></div>
            <strong className={styles.band}>{data.profile.targetBand == null ? "—" : formatBand(data.profile.targetBand)}</strong>
          </div>
          <StudentTargetBandControl compact />
          <Link href="/student/roadmap" className={styles.textLink}>Xem lộ trình chi tiết<ArrowRight size={13} /></Link>
        </article>
      </section>

      {data.recentAttempts.length > 0 && (
        <section className={styles.activityPanel} aria-labelledby="activity-title">
          <div className={styles.panelHeader}><h3 id="activity-title"><Clock size={18} /> Recent activity</h3><Link href="/student/history" className={styles.textLink}>Xem lịch sử<ArrowRight size={13} /></Link></div>
          <div className={styles.activityList}>
            {data.recentAttempts.slice(0, 3).map((attempt) => (
              <Link key={attempt.attemptId} href={attempt.submittedAt ? `/student/reading/attempts/${attempt.attemptId}/result` : `/student/reading/attempts/${attempt.attemptId}`} className={styles.activity}>
                <small>{attempt.submittedAt ? "Đã hoàn thành" : "Đang làm dở"}</small>
                <strong>{attempt.title}</strong>
                <span>{formatDateTime(attempt.submittedAt ?? attempt.startedAt)}{attempt.submittedAt && attempt.score != null ? ` · ${Math.round((attempt.score / Math.max(attempt.maxScore, 1)) * 100)}%` : ""}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CourseTrackBadge({ skillPair, inverted = false }: { skillPair?: "LISTENING_READING" | "SPEAKING_WRITING"; inverted?: boolean }) {
  if (!skillPair) return null;
  const listeningReading = skillPair === "LISTENING_READING";
  return <span className={styles.trackBadge} data-inverted={inverted || undefined} title={listeningReading ? "Khóa Listening & Reading" : "Khóa Speaking & Writing"}><b>{listeningReading ? "LR" : "SW"}</b><span>{listeningReading ? "Listening & Reading" : "Speaking & Writing"}</span></span>;
}

function DashboardSkeleton() {
  return <div className={styles.overview} aria-busy="true" aria-label="Đang tải dữ liệu học tập"><div className={styles.skeleton} /><div className={styles.skeleton} /></div>;
}

function DashboardError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={styles.errorState}>
      <div><WarningCircle size={40} className="mx-auto text-[#934c5e]" weight="duotone" /><h2>Không tải được góc học tập</h2><p>{message}</p><button type="button" onClick={onRetry} className={styles.retry}><ArrowClockwise size={17} />Thử lại</button></div>
    </div>
  );
}
