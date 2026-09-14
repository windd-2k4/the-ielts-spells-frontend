import Link from "next/link";
import { ArrowRight, CalendarBlank, VideoCamera } from "@phosphor-icons/react";
import type { StudentPortalSession } from "./studentPortalApi";
import styles from "./StudentOverview.module.css";

export function StudentSchedulePreview({ sessions }: { sessions: StudentPortalSession[] }) {
  const session = sessions[0];
  const startsAt = session ? new Date(session.startsAt) : null;
  return (
    <section className={styles.panel}>
      <div className={styles.sectionHead}>
        <h3>Buổi học tiếp theo</h3>
        <Link href="/student/schedule" className={styles.textLink} aria-label="Xem lịch học đầy đủ"><ArrowRight size={18} /></Link>
      </div>
      {session && startsAt ? <>
        <div className={styles.sessionDate}>
          <div className={styles.dateTile}><strong>{startsAt.getDate()}</strong><span>Tháng {startsAt.getMonth() + 1}</span></div>
          <div><p className={styles.muted}>{startsAt.toLocaleDateString("vi-VN", {weekday:"long"})}</p><strong>{startsAt.toLocaleTimeString("vi-VN", {hour:"2-digit",minute:"2-digit"})}</strong></div>
        </div>
        <h4 className={styles.sessionTitle}>{session.title || `${session.courseName} · Buổi ${session.sessionNo}`}</h4>
        <p className={styles.muted}>{session.courseCode} · {session.teacherName || "Chưa phân công giáo viên"}</p>
        {session.zoomUrl && <a href={session.zoomUrl} target="_blank" rel="noreferrer" className={styles.textLink}><VideoCamera size={17} />Vào phòng học</a>}
      </> : <div className={styles.empty}>
        <CalendarBlank size={25} className="shrink-0 text-[#894C5B]" />
        <div><h4>Chưa có lịch học sắp tới</h4><p>Lịch sẽ xuất hiện khi khóa học của bạn có buổi học được lên lịch.</p></div>
      </div>}
    </section>
  );
}
