"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SquaresFour, BookOpenText, PencilSimpleLine, GraduationCap, CalendarCheck, MapTrifold, ChartLineUp, ClockCounterClockwise, Robot, ArrowLeft, ChatCircle } from "@phosphor-icons/react";
import { useStudentPortal } from "./StudentPortalProvider";
import styles from "./StudentHubLayout.module.css";

const groups = [
  { title: "Không gian học tập", items: [
    { href: "/student", label: "Tổng quan", icon: SquaresFour },
    { href: "/student/assignments", label: "Bài tập", icon: BookOpenText },
    { href: "/student/practice", label: "Luyện đề", icon: PencilSimpleLine },
    { href: "/student/courses", label: "Khóa học của tôi", icon: GraduationCap },
    { href: "/student/schedule", label: "Lịch học", icon: CalendarCheck },
  ] },
  { title: "Hành trình của bạn", items: [
    { href: "/student/roadmap", label: "Mục tiêu & lộ trình", icon: MapTrifold },
    { href: "/student/progress", label: "Tiến độ IELTS", icon: ChartLineUp },
    { href: "/student/history", label: "Lịch sử làm bài", icon: ClockCounterClockwise },
  ] },
  { title: "Công cụ hỗ trợ", items: [
    { href: "/student/ai-tutor", label: "AI Tutor", icon: Robot },
  ] },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const { data } = useStudentPortal();
  return (
    <aside className={styles.sidebar}>
      <Link href="/" className={styles.brand}>
        <img src="/logo.jpg" alt="" width={34} height={34} />
        <span><strong>The IELTS Spells</strong><small>Không gian học tập</small></span>
      </Link>
      <nav className={styles.nav} aria-label="Điều hướng góc học tập">
        {groups.map((group) => (
          <div key={group.title} className={styles.navGroup}>
            <h2>{group.title}</h2>
            {group.items.map((item) => {
              const active = item.href === "/student" ? pathname === "/student" || pathname === "/student/dashboard" : pathname.startsWith(item.href);
              const Icon = item.icon;
              const count = item.href === "/student/assignments" ? data?.metrics.pendingTests : item.href === "/student/courses" ? data?.enrollments.length : 0;
              return <Link key={item.href} href={item.href} className={styles.navLink} aria-current={active ? "page" : undefined}>
                <Icon size={19} weight={active ? "fill" : "regular"} /><span>{item.label}</span>
                {!!count && <span className={styles.badge}>{count}</span>}
                {item.href === "/student/ai-tutor" && <span className={styles.badge}>Đang phát triển</span>}
              </Link>;
            })}
          </div>
        ))}
      </nav>
      <div className={styles.support}>
        <Link href="/#consultation"><ChatCircle size={18} />Liên hệ cố vấn</Link>
        <Link href="/"><ArrowLeft size={16} />Về trang chủ</Link>
      </div>
    </aside>
  );
}
