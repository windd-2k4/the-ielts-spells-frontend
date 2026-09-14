"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  CaretDown,
  ChartLineUp,
  Gear,
  GraduationCap,
  House,
  List,
  PencilSimpleLine,
  SignOut,
  SquaresFour,
  Target,
  User,
} from "@phosphor-icons/react";
import { useStudentSession } from "@/features/student-auth/StudentSessionProvider";
import { useStudentPortal } from "@/features/student-hub/StudentPortalProvider";
import styles from "./StudentTopbar.module.css";

interface StudentTopbarProps { onToggleMobileMenu?: () => void; }

const NAV_ITEMS = [
  { href: "/student", label: "Tổng quan", icon: SquaresFour },
  { href: "/student/assignments", label: "Bài tập", icon: BookOpenText },
  { href: "/student/practice", label: "Luyện đề", icon: PencilSimpleLine },
  { href: "/student/courses", label: "Khóa học", icon: GraduationCap },
  { href: "/student/progress", label: "Tiến độ", icon: ChartLineUp },
];

export function StudentTopbar({ onToggleMobileMenu }: StudentTopbarProps) {
  const pathname = usePathname();
  const { session, signOut } = useStudentSession();
  const { data } = useStudentPortal();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const studentName = data?.profile.fullName || session?.user?.user_metadata?.full_name || session?.user?.email?.split("@")[0] || "Học viên";
  const avatarInitial = studentName.charAt(0).toUpperCase();

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Link href="/student" className={styles.brand} aria-label="The IELTS Spells — Góc học tập">
          <img className={styles.logo} src="/logo.jpg" alt="" width={37} height={37} />
          <span className={styles.brandCopy}>
            <strong>The IELTS Spells</strong>
            <small>Learning workspace</small>
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Điều hướng chính của góc học tập">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/student" ? pathname === "/student" : pathname.startsWith(item.href);
            const Icon = item.icon;
            const count = item.href === "/student/assignments" ? data?.metrics.pendingTests : 0;
            return (
              <Link key={item.href} href={item.href} className={styles.navLink} aria-current={active ? "page" : undefined}>
                <Icon size={15} weight={active ? "fill" : "bold"} />
                <span>{item.label}</span>
                {!!count && <span className={styles.count} aria-label={`${count} bài đang chờ`}>{count}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={styles.actions}>
          <Link href="/" className={styles.homeLink} aria-label="Về trang chủ công khai"><House size={17} weight="bold" /></Link>
          {onToggleMobileMenu && (
            <button type="button" className={styles.menuButton} onClick={onToggleMobileMenu} aria-label="Mở menu học tập" aria-haspopup="dialog">
              <List size={19} weight="bold" />
            </button>
          )}
          <div className={styles.account} ref={dropdownRef} onKeyDown={(event) => {
            if (event.key === "Escape") { setDropdownOpen(false); accountButtonRef.current?.focus(); }
          }}>
            <button
              ref={accountButtonRef}
              type="button"
              className={styles.accountButton}
              aria-expanded={dropdownOpen}
              aria-controls="student-account-panel"
              aria-label={`Tài khoản của ${studentName}`}
              onClick={() => setDropdownOpen((value) => !value)}
            >
              <span className={styles.name}>{studentName}</span>
              <span className={styles.avatar}>{avatarInitial}</span>
              <CaretDown className={styles.caret} size={12} weight="bold" />
            </button>

            {dropdownOpen && (
              <div id="student-account-panel" className={styles.dropdown}>
                <div className={styles.accountIdentity}>
                  <small>Tài khoản học viên</small>
                  <strong>{studentName}</strong>
                  <span>{data?.profile.email ?? session?.user?.email}</span>
                </div>
                <div className={styles.menuList}>
                  <Link href="/student/learning-profile" onClick={() => setDropdownOpen(false)} className={styles.menuItem}><User size={17} />Hồ sơ học tập</Link>
                  <Link href="/student/roadmap" onClick={() => setDropdownOpen(false)} className={styles.menuItem}><Target size={17} />Mục tiêu &amp; lộ trình</Link>
                  <Link href="/student/learning-profile" onClick={() => setDropdownOpen(false)} className={styles.menuItem}><Gear size={17} />Cài đặt tài khoản</Link>
                  <button type="button" onClick={() => { setDropdownOpen(false); void signOut(); }} className={`${styles.menuItem} ${styles.signOut}`}><SignOut size={17} />Đăng xuất</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
