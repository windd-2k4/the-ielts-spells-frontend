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
  Play,
  Sparkle,
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

  const firstName = data.profile.fullName.trim().split(/\s+/).at(-1) || "bạn";
  const activeAttempt = data.recentAttempts.find((attempt) => attempt.status === "IN_PROGRESS");
  const pendingAssignments = data.readingAssignments.filter((item) => item.attemptsUsed < item.maxAttempts);
  const nextSession = data.upcomingSessions[0];
  const activeEnrollment = data.enrollments.find((item) => item.status === "ACTIVE") ?? data.enrollments[0];
  const recommendation = data.recommendedCourses[0];
  const courseProgress = activeEnrollment && activeEnrollment.totalSessions > 0
    ? Math.min(100, Math.round((activeEnrollment.completedSessions / activeEnrollment.totalSessions) * 100))
    : 0;

  const primaryAction = activeAttempt
    ? { label: "Tiếp tục bài đang làm", href: `/student/reading/attempts/${activeAttempt.attemptId}`, title: activeAttempt.title, copy: "Bài làm của bạn vẫn được lưu. Quay lại đúng vị trí đang dừng để hoàn thành." }
    : pendingAssignments[0]
      ? { label: "Mở bài được giao", href: "/student/reading", title: pendingAssignments[0].title, copy: "Một bài tập đang chờ bạn. Hoàn thành bài để cập nhật tiến độ học tập." }
      : nextSession
        ? { label: "Xem lịch học", href: "/student/schedule", title: nextSession.title || nextSession.courseName, copy: "Buổi học tiếp theo đã có trong lịch. Kiểm tra thời gian và thông tin lớp trước khi bắt đầu." }
        : { label: "Bắt đầu tự luyện", href: "/student/practice", title: "Chọn một kỹ năng và học theo nhịp của bạn", copy: "Hiện không có bài bắt buộc. Bạn có thể luyện Reading hoặc khám phá các kỹ năng sắp ra mắt." };

  return (
    <div className={styles.overview}>
      <header className={styles.masthead}>
        <div>
          <p className={styles.eyebrow}>Không gian học tập cá nhân</p>
          <h1 className={styles.title}>Chào {firstName}, hôm nay mình <em>học gì?</em></h1>
        </div>
        <time className={styles.date} dateTime={new Date().toISOString().slice(0, 10)}>
          {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}
        </time>
      </header>

      {error && (
        <div role="status" className={styles.notice}>
          <span>{error} Dữ liệu hiển thị có thể chưa được cập nhật.</span>
          <button type="button" disabled={loading} onClick={() => void refresh()} className={styles.textLink}>
            <ArrowClockwise size={16} />{loading ? "Đang cập nhật…" : "Tải lại"}
          </button>
        </div>
      )}

      <section className={styles.hero} aria-labelledby="next-action-title">
        <div className={styles.heroContent}>
          <div>
            <p className={styles.heroKicker}><Sparkle size={13} weight="fill" /> Việc nên làm tiếp theo</p>
            <h2 id="next-action-title" className={styles.heroTitle}>{primaryAction.title}</h2>
            <p className={styles.heroText}>{primaryAction.copy}</p>
            <Link href={primaryAction.href} className={styles.heroAction}>
              <Play size={17} weight="fill" />{primaryAction.label}<ArrowRight size={16} weight="bold" />
            </Link>
          </div>
          <div className={styles.heroMeta}>
            <span><BookOpenText size={14} />{pendingAssignments.length} bài đang chờ</span>
            <span><CheckCircle size={14} />{data.metrics.completedAttempts} lượt đã hoàn thành</span>
            {data.metrics.currentStreakDays > 0 && <span><Sparkle size={14} />Chuỗi {data.metrics.currentStreakDays} ngày</span>}
          </div>
        </div>
        <div
          className={styles.orbit}
          tabIndex={0}
          aria-label={data.profile.targetBand == null
            ? "Chưa thiết lập band mục tiêu. Di chuột hoặc nhấn Tab để xem sơ đồ bốn kỹ năng."
            : `Band mục tiêu ${formatBand(data.profile.targetBand)}. Di chuột hoặc nhấn Tab để xem sơ đồ bốn kỹ năng.`}
        >
          <svg className={styles.orbitSvg} viewBox="0 0 520 380" fill="none" aria-hidden="true">
            <path d="M-35 319C89 244 147 325 246 235C337 153 319 78 554 42" stroke="rgba(241,203,212,.56)" strokeWidth="1.4" />
            <path d="M-10 350C110 282 178 353 284 270C385 191 377 113 561 81" stroke="rgba(255,255,255,.13)" strokeWidth="1" strokeDasharray="5 9" />
            <circle cx="92" cy="284" r="5" fill="#F1CBD4" />
            <circle cx="448" cy="74" r="4" fill="#F1CBD4" />
          </svg>
          <div className={styles.targetDisc}>
            <span className={styles.targetValue}>
              <small>Band mục tiêu</small>
              <strong>{data.profile.targetBand == null ? "—" : formatBand(data.profile.targetBand)}</strong>
              <span>{data.profile.currentBand == null ? "Chưa có band hiện tại" : `Từ band ${formatBand(data.profile.currentBand)}`}</span>
            </span>
          </div>
          <SkillRadar targetBand={data.profile.targetBand} currentBand={data.profile.currentBand} />
          <p className={styles.radarHint}>Di chuột để xem 4 kỹ năng</p>
          <p className={styles.orbitLabel}>{activeEnrollment ? `Đang học · ${activeEnrollment.courseCode}` : "Lộ trình sẽ rõ hơn sau khi bạn đặt mục tiêu và có kết quả đầu vào."}</p>
        </div>
      </section>

      <StudentStudyPulse data={data} />

      <section aria-labelledby="today-title">
        <div className={styles.sectionHead}>
          <div><h2 id="today-title">Nhịp học hôm nay</h2><p>Chỉ những việc thực sự cần sự chú ý của bạn.</p></div>
          <Link href="/student/assignments" className={styles.textLink}>Tất cả bài tập<ArrowRight size={14} /></Link>
        </div>
        <div className={styles.todayGrid}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}><h3><BookOpenText size={19} weight="duotone" /> Bài tập cần làm</h3><span>{pendingAssignments.length} bài</span></div>
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
                <p className={styles.sessionTop}><CalendarBlank size={16} /> Buổi học tiếp theo</p>
                <strong>{nextSession.title || nextSession.courseName}</strong>
                <p>{formatDateTime(nextSession.startsAt)}{nextSession.teacherName ? ` · ${nextSession.teacherName}` : ""}</p>
                <Link href="/student/schedule" className={styles.textLink}>Mở thời khóa biểu<ArrowRight size={13} /></Link>
              </article>
            ) : (
              <article className={styles.sessionCard}>
                <p className={styles.sessionTop}><CalendarBlank size={16} /> Lịch học</p>
                <strong>Chưa có buổi học sắp tới</strong>
                <p>Lịch mới sẽ tự động xuất hiện sau khi bạn được xếp lớp.</p>
                <Link href="/student/schedule" className={styles.textLink}>Xem thời khóa biểu<ArrowRight size={13} /></Link>
              </article>
            )}
            <article className={styles.focusCard}>
              <small>{recommendation ? "Gợi ý từ lộ trình" : "Tự luyện"}</small>
              <strong>{recommendation?.name ?? "Giữ nhịp bằng một bài Reading ngắn"}</strong>
              <p>{recommendation?.reason ?? "Chọn bài phù hợp thời gian bạn có và tiếp tục tích lũy dữ liệu học tập."}</p>
              <Link href={recommendation ? "/student/courses" : "/student/practice"} className={styles.textLink}>{recommendation ? "Xem khóa học" : "Chọn bài luyện"}<ArrowRight size={13} /></Link>
            </article>
          </aside>
        </div>
      </section>

      <section aria-labelledby="skills-title">
        <div className={styles.sectionHead}>
          <div><h2 id="skills-title">Phòng luyện 4 kỹ năng</h2><p>Đi thẳng vào kỹ năng bạn muốn cải thiện.</p></div>
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
          <p className={styles.cardKicker}>Khóa học của tôi</p>
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
            <div><p className={styles.cardKicker}>Điểm đến của bạn</p><h3>Band IELTS mong muốn</h3></div>
            <strong className={styles.band}>{data.profile.targetBand == null ? "—" : formatBand(data.profile.targetBand)}</strong>
          </div>
          <StudentTargetBandControl compact />
          <Link href="/student/roadmap" className={styles.textLink}>Xem lộ trình chi tiết<ArrowRight size={13} /></Link>
        </article>
      </section>

      {data.recentAttempts.length > 0 && (
        <section className={styles.activityPanel} aria-labelledby="activity-title">
          <div className={styles.panelHeader}><h3 id="activity-title"><Clock size={18} /> Hoạt động gần đây</h3><Link href="/student/history" className={styles.textLink}>Xem lịch sử<ArrowRight size={13} /></Link></div>
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

function SkillRadar({ targetBand, currentBand }: { targetBand: number | null; currentBand: number | null }) {
  const targetPoints = targetBand == null ? null : radarPoints(targetBand);
  const targetLabel = targetBand == null ? "Chưa đặt mục tiêu" : `Mục tiêu ${formatBand(targetBand)}`;
  const currentLabel = currentBand == null ? "Chưa có kết quả đầu vào" : `Band tổng quan ${formatBand(currentBand)}`;

  return (
    <div className={styles.skillRadar} role="img" aria-label={`Sơ đồ mục tiêu bốn kỹ năng. ${targetLabel}. ${currentLabel}.`}>
      <div className={styles.radarHeading}>
        <span>Bức tranh 4 kỹ năng</span>
        <strong>{targetLabel}</strong>
      </div>
      <div className={styles.radarChart}>
        <svg viewBox="0 0 360 320" fill="none" aria-hidden="true">
          <g className={styles.radarGrid}>
            <path d="M180 132L208 160L180 188L152 160Z" />
            <path d="M180 104L236 160L180 216L124 160Z" />
            <path d="M180 76L264 160L180 244L96 160Z" />
            <path d="M180 48L292 160L180 272L68 160Z" />
          </g>
          <g className={styles.radarAxes}>
            <path d="M180 48V272" />
            <path d="M68 160H292" />
          </g>
          {targetPoints && (
            <g className={styles.radarResult}>
              <polygon points={targetPoints.polygon} />
              {targetPoints.nodes.map((node, index) => <circle key={index} cx={node.x} cy={node.y} r="4.5" />)}
            </g>
          )}
          <circle className={styles.radarCenter} cx="180" cy="160" r="3.5" />
        </svg>
        <span className={`${styles.radarSkill} ${styles.radarReading}`}>Reading</span>
        <span className={`${styles.radarSkill} ${styles.radarListening}`}>Listening</span>
        <span className={`${styles.radarSkill} ${styles.radarWriting}`}>Writing</span>
        <span className={`${styles.radarSkill} ${styles.radarSpeaking}`}>Speaking</span>
      </div>
      <p className={styles.radarFoot}>{currentLabel}</p>
    </div>
  );
}

function radarPoints(band: number) {
  const center = 180;
  const radius = 112 * Math.max(0, Math.min(9, band)) / 9;
  const nodes = [
    { x: center, y: center - radius },
    { x: center + radius, y: center },
    { x: center, y: center + radius },
    { x: center - radius, y: center },
  ];

  return {
    nodes,
    polygon: nodes.map((node) => `${node.x},${node.y}`).join(" "),
  };
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
