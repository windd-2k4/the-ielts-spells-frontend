"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Cards,
  BookOpenText,
  CaretDown,
  ChartLineUp,
  ClipboardText,
  Moon,
  Sun,
  Gear,
  GraduationCap,
  List,
  Microphone,
  PencilSimpleLine,
  SignOut,
  Sparkle,
  SquaresFour,
  Target,
  User,
} from "@phosphor-icons/react";
import { useStudentSession } from "@/features/student-auth/StudentSessionProvider";
import { useStudentPortal } from "@/features/student-hub/StudentPortalProvider";
import { useStudentNotifications } from "@/features/student-hub/StudentNotificationProvider";
import { NotificationDropdown } from "@/features/student-hub/NotificationDropdown";
import { useTheme } from "@/features/theme/ThemeContext";
import { getStudentCoursesHref } from "./studentCourseNav";
import styles from "./StudentTopbar.module.css";

interface StudentTopbarProps { onToggleMobileMenu?: () => void; }

const NAV_ITEMS = [
  { href: "/student", label: "Tổng quan", icon: SquaresFour },
  { href: "/student/placement-test", label: "Test đầu vào", icon: ClipboardText },
  { href: "/student/assignments", label: "Bài tập", icon: BookOpenText },
  { href: "/student/practice", label: "Luyện đề", icon: PencilSimpleLine },
  { href: "/student/flashcards", label: "Sổ từ", icon: Cards },
  { href: "/student/courses", label: "Khóa học", icon: GraduationCap },
  { href: "/student/history", label: "Tiến độ", icon: ChartLineUp },
];

const AI_EXAMINER_ENABLED = process.env.NEXT_PUBLIC_AI_SPEAKING_EXAMINER_ENABLED === "true";

export function StudentTopbar({ onToggleMobileMenu }: StudentTopbarProps) {
  const pathname = usePathname();
  const { session, signOut } = useStudentSession();
  const { data } = useStudentPortal();
  const { unreadCount } = useStudentNotifications();
  const { theme, toggleTheme } = useTheme();
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [practiceMenuOpen, setPracticeMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const scrollSentinelRef = useRef<HTMLDivElement>(null);
  const brandMenuRef = useRef<HTMLDivElement>(null);
  const brandButtonRef = useRef<HTMLButtonElement>(null);
  const practiceMenuRef = useRef<HTMLDivElement>(null);
  const practiceLinkRef = useRef<HTMLAnchorElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const studentName = data?.profile.fullName || session?.user?.user_metadata?.full_name || session?.user?.email?.split("@")[0] || "Học viên";
  const avatarInitials = studentName
    .trim()
    .split(/\s+/)
    .map((w: string) => w[0]?.toUpperCase())
    .filter(Boolean)
    .slice(-2)
    .join("") || "DV";

  const coursesHref = getStudentCoursesHref(data?.enrollments);

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      if (brandMenuRef.current && !brandMenuRef.current.contains(event.target as Node)) setBrandMenuOpen(false);
      if (practiceMenuRef.current && !practiceMenuRef.current.contains(event.target as Node)) setPracticeMenuOpen(false);
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, []);

  useEffect(() => {
    const sentinel = scrollSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setIsCompact(!entry.isIntersecting));
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={scrollSentinelRef} className={styles.scrollSentinel} aria-hidden="true" />
      <header className={`${styles.header} ${isCompact ? styles.headerCompact : ""}`}>
        <div className={styles.bar}>
          <div
            ref={brandMenuRef}
            className={`${styles.brandMenu} ${brandMenuOpen ? styles.brandMenuOpen : ""}`}
            onMouseEnter={() => setBrandMenuOpen(true)}
            onMouseLeave={() => setBrandMenuOpen(false)}
            onKeyDown={(event) => {
              if (event.key === "Escape") { setBrandMenuOpen(false); brandButtonRef.current?.focus(); }
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node)) setBrandMenuOpen(false);
            }}
          >
            <button
              ref={brandButtonRef}
              type="button"
              className={styles.brand}
              aria-label="Mở điều hướng The IELTS Spells"
              aria-haspopup="menu"
              aria-expanded={brandMenuOpen}
              aria-controls="student-brand-menu"
              onClick={() => setBrandMenuOpen(true)}
            >
              <img className={styles.logo} src="/logo.jpg" alt="" width={40} height={40} />
              <span className={styles.brandCopy}>
                <strong>The IELTS Spells</strong>
                <small>Learning workspace</small>
              </span>
              <CaretDown className={styles.brandCaret} size={12} weight="bold" />
            </button>
            {brandMenuOpen && (
              <nav id="student-brand-menu" className={styles.brandDropdown} aria-label="Điều hướng The IELTS Spells">
                <Link href="/student" className={styles.brandDropdownItem}>
                  <SquaresFour size={17} weight="bold" />
                  Homepage góc học tập
                </Link>
                <Link href="/" className={styles.brandDropdownItem}>
                  <Sparkle size={17} weight="bold" />
                  Landing page
                </Link>
              </nav>
            )}
          </div>

          <nav className={styles.nav} aria-label="Điều hướng chính của góc học tập">
            {NAV_ITEMS.map((item) => {
              const active = item.href === "/student" ? pathname === "/student" : pathname.startsWith(item.href);
              const targetHref = item.href === "/student/courses" ? coursesHref : item.href;
              const Icon = item.icon;
              const count = item.href === "/student/assignments"
                ? (data?.metrics.pendingTests ?? 0) + (data?.metrics.pendingCourseAssignments ?? 0)
                : 0;
              if (item.href === "/student/practice" && AI_EXAMINER_ENABLED) {
                return (
                  <div
                    key={item.href}
                    ref={practiceMenuRef}
                    className={`${styles.navMenu} ${practiceMenuOpen ? styles.navMenuOpen : ""}`}
                    onMouseEnter={() => setPracticeMenuOpen(true)}
                    onMouseLeave={() => setPracticeMenuOpen(false)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") { setPracticeMenuOpen(false); practiceLinkRef.current?.focus(); }
                      if (event.key === "ArrowDown" && !practiceMenuOpen) {
                        event.preventDefault();
                        setPracticeMenuOpen(true);
                      }
                    }}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node)) setPracticeMenuOpen(false);
                    }}
                  >
                    <Link
                      ref={practiceLinkRef}
                      href="/student/practice"
                      className={styles.navLink}
                      aria-current={active ? "page" : undefined}
                      aria-haspopup="menu"
                      aria-expanded={practiceMenuOpen}
                      aria-controls="student-practice-menu"
                      onClick={() => setPracticeMenuOpen(false)}
                    >
                      <Icon size={15} weight={active ? "fill" : "bold"} />
                      <span>{item.label}</span>
                      <CaretDown className={styles.navCaret} size={11} weight="bold" />
                    </Link>
                    {practiceMenuOpen ? (
                      <div id="student-practice-menu" className={styles.practiceDropdown} role="menu">
                        <Link href="/student/practice" className={styles.practiceDropdownItem} role="menuitem" onClick={() => setPracticeMenuOpen(false)}>
                          <PencilSimpleLine size={18} weight="duotone" />
                          <span><strong>Thư viện luyện đề</strong><small>Reading, Listening, Writing và Speaking</small></span>
                        </Link>
                        <Link href="/student/practice?skill=SPEAKING&type=FULL_TEST&experience=AI_EXAMINER" className={styles.practiceDropdownItem} role="menuitem" onClick={() => setPracticeMenuOpen(false)}>
                          <Microphone size={18} weight="duotone" />
                          <span><strong>AI Speaking Examiner</strong><small>Phỏng vấn IELTS bằng giọng nói</small></span>
                        </Link>
                      </div>
                    ) : null}
                  </div>
                );
              }
              return (
                <Link key={item.href} href={targetHref} className={styles.navLink} aria-current={active ? "page" : undefined}>
                  <Icon size={15} weight={active ? "fill" : "bold"} />
                  <span>{item.label}</span>
                  {!!count && <span className={styles.count} aria-label={`${count} bài đang chờ`}>{count}</span>}
                </Link>
              );
            })}
          </nav>

          <div className={styles.actions}>
            <div className={styles.notificationWrapper}>
              <button
                ref={bellButtonRef}
                type="button"
                className={styles.iconActionBtn}
                aria-expanded={notificationOpen}
                aria-haspopup="dialog"
                aria-label={`Thông báo ${unreadCount > 0 ? `(${unreadCount} mới)` : ""}`}
                onClick={() => setNotificationOpen((prev) => !prev)}
              >
                <Bell size={17} weight={notificationOpen || unreadCount > 0 ? "fill" : "bold"} />
                {unreadCount > 0 && (
                  <span className={styles.bellBadge}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              <NotificationDropdown
                isOpen={notificationOpen}
                onClose={() => setNotificationOpen(false)}
                anchorRef={bellButtonRef}
              />
            </div>
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
                <span className={styles.avatar}>
                  {data?.profile.avatarPath ? (
                    <img
                      src={data.profile.avatarPath}
                      alt={`Ảnh đại diện của ${studentName}`}
                      className={styles.avatarImage}
                    />
                  ) : avatarInitials}
                </span>
                <span className={styles.name}>{studentName}</span>
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
                    <Link href="/student/settings" onClick={() => setDropdownOpen(false)} className={styles.menuItem}><Gear size={17} />Cài đặt tài khoản</Link>
                    <button
                      type="button"
                      onClick={() => toggleTheme()}
                      className={styles.menuItem}
                      aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
                    >
                      {theme === "dark" ? (
                        <>
                          <Sun size={17} weight="bold" className={`${styles.themeIcon} ${styles.themeIconLight}`} />
                          <span>Giao diện sáng</span>
                        </>
                      ) : (
                        <>
                          <Moon size={17} weight="bold" className={`${styles.themeIcon} ${styles.themeIconDark}`} />
                          <span>Giao diện tối</span>
                        </>
                      )}
                    </button>
                    <button type="button" onClick={() => { setDropdownOpen(false); void signOut(); }} className={`${styles.menuItem} ${styles.signOut}`}><SignOut size={17} />Đăng xuất</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
