"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, Clock, Warning } from "@phosphor-icons/react";
import styles from "./StudentOverview.module.css";

export interface TaskItem {
  id: string;
  title: string;
  type: "assignment" | "session";
  skillPair?: string;
  dueDate?: string;
  isOverdue?: boolean;
  sessionTime?: string;
  statusLabel?: string;
  statusKind?: "not_started" | "in_progress" | "submitted" | "pending_grading" | "graded";
  actionUrl: string;
  actionLabel: string;
}

export function StudentUpcomingTasks({ tasks = [], loading = false }: { tasks?: TaskItem[]; loading?: boolean }) {
  return (
    <section className={styles.panel} aria-labelledby="upcoming-tasks-title">
      <div className={styles.sectionHead}>
        <div><h3 id="upcoming-tasks-title">Bài tập được giao</h3><p>Các bài còn lượt làm trong khóa học</p></div>
        <Link href="/student/assignments" className={styles.textLink}>Xem tất cả<ArrowRight size={14} /></Link>
      </div>
      {loading ? <div className={styles.skeleton} aria-label="Đang tải bài tập" /> : tasks.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}><BookOpenText size={22} /></span>
          <div><h4>Chưa có bài tập cần làm</h4><p>Bài được giáo viên giao sẽ xuất hiện tại đây. Bạn có thể xem các bài đã nhận trong danh sách bài tập.</p></div>
        </div>
      ) : (
        <ul className={styles.taskList}>
          {tasks.map((task) => (
            <li key={task.id} className={styles.task}>
              <div className={styles.taskInfo}>
                <div className={styles.taskMeta}>
                  {task.statusLabel && <span>{task.statusLabel}</span>}
                  {task.isOverdue ? <span className={styles.overdue}><Warning size={14} />Đã quá hạn</span> : task.dueDate && <span><Clock size={14} />{task.dueDate}</span>}
                  {task.sessionTime && <span><Clock size={14} />{task.sessionTime}</span>}
                </div>
                <h4>{task.title}</h4>
                {task.skillPair && <p className={styles.muted}>{task.skillPair}</p>}
              </div>
              <Link href={task.actionUrl} className={styles.taskAction}>{task.actionLabel}<ArrowRight size={14} /></Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
