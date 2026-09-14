"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  BookOpenText,
  CalendarCheck,
  ChartLineUp,
  ClockCounterClockwise,
  GraduationCap,
  MapTrifold,
  PencilSimpleLine,
  Robot,
  Sparkle,
  SquaresFour,
  UserGear,
  X,
} from "@phosphor-icons/react";
import styles from "./StudentMobileNav.module.css";

interface StudentMobileNavProps { isOpen: boolean; onClose: () => void; }

const bottomItems = [
  { href: "/student", label: "Tổng quan", icon: SquaresFour },
  { href: "/student/assignments", label: "Bài tập", icon: BookOpenText },
  { href: "/student/practice", label: "Luyện đề", icon: PencilSimpleLine },
  { href: "/student/progress", label: "Tiến độ", icon: ChartLineUp },
  { href: "/student/schedule", label: "Lịch học", icon: CalendarCheck },
];

const groups = [
  { title: "Học tập", items: [
    { href: "/student", label: "Tổng quan", icon: SquaresFour },
    { href: "/student/assignments", label: "Bài tập được giao", icon: BookOpenText },
    { href: "/student/practice", label: "Phòng luyện 4 kỹ năng", icon: PencilSimpleLine },
    { href: "/student/courses", label: "Khóa học của tôi", icon: GraduationCap },
    { href: "/student/schedule", label: "Lịch học", icon: CalendarCheck },
  ] },
  { title: "Hành trình", items: [
    { href: "/student/roadmap", label: "Mục tiêu & lộ trình", icon: MapTrifold },
    { href: "/student/progress", label: "Tiến độ IELTS", icon: ChartLineUp },
    { href: "/student/history", label: "Lịch sử làm bài", icon: ClockCounterClockwise },
  ] },
  { title: "Cá nhân", items: [
    { href: "/student/ai-tutor", label: "AI Tutor · đang phát triển", icon: Robot },
    { href: "/student/learning-profile", label: "Hồ sơ học tập", icon: UserGear },
  ] },
];

function isCurrent(pathname: string, href: string) {
  return href === "/student" ? pathname === "/student" : pathname.startsWith(href);
}

export function StudentMobileNav({ isOpen, onClose }: StudentMobileNavProps) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <dialog ref={dialogRef} className={styles.dialog} aria-label="Menu học tập" onCancel={onClose} onClick={onClose}>
          <div className={styles.drawer} onClick={(event) => event.stopPropagation()}>
            <div className={styles.drawerHead}>
              <span className={styles.drawerBrand}><span className={styles.brandMark}><Sparkle size={17} weight="fill" /></span>Góc học tập</span>
              <button type="button" className={styles.close} aria-label="Đóng menu học tập" onClick={onClose}><X size={19} weight="bold" /></button>
            </div>
            <Link href="/" className={styles.publicLink} onClick={onClose}><ArrowLeft size={15} />Về trang chủ công khai</Link>
            <nav className={styles.groups} aria-label="Tất cả khu vực học tập">
              {groups.map((group) => (
                <div key={group.title}>
                  <p className={styles.groupTitle}>{group.title}</p>
                  <div className={styles.groupLinks}>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isCurrent(pathname, item.href);
                      return <Link key={item.href} href={item.href} className={styles.drawerLink} aria-current={active ? "page" : undefined} onClick={onClose}><Icon size={18} weight={active ? "fill" : "regular"} />{item.label}</Link>;
                    })}
                  </div>
                </div>
              ))}
            </nav>
            <p className={styles.drawerFooter}>The IELTS Spells · Học đúng trọng tâm</p>
          </div>
        </dialog>
      )}

      <nav className={styles.bottomBar} aria-label="Điều hướng nhanh trên điện thoại">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = isCurrent(pathname, item.href);
          return <Link key={item.href} href={item.href} className={styles.bottomLink} aria-current={active ? "page" : undefined}><Icon size={19} weight={active ? "fill" : "regular"} /><span>{item.label}</span></Link>;
        })}
      </nav>
    </>
  );
}
