"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, PlayCircle, Target } from "@phosphor-icons/react";
import type { StudentPortalOverview } from "./studentPortalApi";
import styles from "./StudentOverview.module.css";

interface StudentHeroWelcomeProps {
  data: StudentPortalOverview;
  unsubmittedAttempt?: { id: string; title: string; skill: string } | null;
}

export function StudentHeroWelcome({ data, unsubmittedAttempt }: StudentHeroWelcomeProps) {
  const assignment = data.readingAssignments.find((item) => item.attemptsUsed < item.maxAttempts);
  const needsTarget = data.profile.targetBand == null;
  let action = {
    title: needsTarget ? "Bắt đầu với mục tiêu của bạn" : "Sẵn sàng cho bước học tiếp theo?",
    subtitle: needsTarget ? "Chọn band IELTS mong muốn để định hướng lộ trình và tìm hiểu khóa học phù hợp." : "Xem lộ trình, lịch học và các khóa bạn đang tham gia để chọn bước tiếp theo.",
    label: needsTarget ? "Thiết lập mục tiêu" : "Xem lộ trình của tôi",
    href: needsTarget ? "#learning-goal" : "/student/roadmap",
    tag: "Bước tiếp theo",
    icon: <Target size={18} />,
  };
  if (unsubmittedAttempt) {
    action = { title: unsubmittedAttempt.title, subtitle: `Bài ${unsubmittedAttempt.skill} đang làm dở. Tiếp tục từ phần bạn đã lưu.`, label: "Tiếp tục làm bài", href: `/student/reading/attempts/${unsubmittedAttempt.id}`, tag: "Tiếp tục việc học", icon: <PlayCircle size={18} weight="fill" /> };
  } else if (assignment) {
    action = { title: assignment.title, subtitle: assignment.closesAt ? `Hạn làm bài: ${new Date(assignment.closesAt).toLocaleString("vi-VN", {dateStyle:"short",timeStyle:"short"})}` : `Bài Reading từ khóa ${assignment.courseName}.`, label: "Mở bài được giao", href: "/student/reading", tag: "Bài tập còn lượt làm", icon: <BookOpenText size={18} /> };
  }

  return (
    <section className={styles.focus} aria-labelledby="next-action-title">
      <div className={styles.eyebrow}>{action.icon}<span>{action.tag}</span></div>
      <h3 id="next-action-title">{action.title}</h3>
      <p className={styles.muted}>{action.subtitle}</p>
      <div className={styles.focusFooter}>
        <Link href={action.href} className={styles.primary}>{action.label}<ArrowRight size={16} /></Link>
        <Link href="/student/courses" className={styles.textLink}>Khóa học của tôi</Link>
      </div>
    </section>
  );
}
