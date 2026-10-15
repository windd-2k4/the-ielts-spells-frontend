"use client";

import { useState, useEffect, useRef } from "react";
import { BrandMark } from "@ielts/ui";
import {
  List,
  X,
  PhoneCall,
  GraduationCap,
  User,
  Gear,
  SignOut,
  CaretDown,
  ArrowRight,
  CheckCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useStudentSession } from "@/features/student-auth/StudentSessionProvider";

interface NavItem {
  id: string;
  label: string;
  href?: string;
}
const NAV_ITEMS: NavItem[] = [
  { id: "hero", label: "Trang chủ" },
  { id: "about", label: "Giới thiệu" },
  { id: "benefits", label: "Quyền lợi" },
  { id: "courses", label: "Khóa học" },
  { id: "teachers", label: "Giáo viên" },
  { id: "feedback", label: "Feedback" },
  { id: "practice", label: "Luyện đề", href: "/student/practice" },
];

export default function Navbar() {
  const { session, signOut } = useStudentSession();
  const [activeSection, setActiveSection] = useState("hero");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [practiceLoginOpen, setPracticeLoginOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const studentName = session?.user?.user_metadata?.full_name || session?.user?.email?.split("@")[0] || "Học viên";
  const avatarInitial = studentName.charAt(0).toUpperCase();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Section scroll spy logic for standard section IDs
      const sectionItems = NAV_ITEMS.filter((item) => !item.href);
      const sections = sectionItems.map((item) => document.getElementById(item.id));
      const scrollPosition = window.scrollY + 120;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sectionItems[i].id);
          break;
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!practiceLoginOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPracticeLoginOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [practiceLoginOpen]);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const handleNavClick = (item: NavItem) => {
    setMobileMenuOpen(false);
    scrollToSection(item.id);
  };

  const requestPracticeLogin = () => {
    setMobileMenuOpen(false);
    setPracticeLoginOpen(true);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "glass-header shadow-sm py-3" : "bg-transparent py-5"
        }`}
      >
        <div className="lp-container flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("hero");
            }}
            className="flex items-center gap-2.5 group text-xl font-bold tracking-tight whitespace-nowrap shrink-0"
          >
            <img
              src="/logo.jpg"
              alt="The IELTS Spells Logo"
              className="w-10 h-10 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform shrink-0 border border-[#F3E8C4]"
            />
            <BrandMark />
          </a>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#FFFDF0]/90 p-1.5 rounded-full border border-[#F3E8C4] backdrop-blur-md shrink-0">
            {NAV_ITEMS.map((item) => {
              const isActive = !item.href && activeSection === item.id;
              const className = `px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[#F5C842] text-[#1E1B18] font-bold shadow-sm"
                  : "text-[#5C5752] hover:text-[#1E1B18] hover:bg-white/60"
              }`;

              if (item.href) {
                return item.id === "practice" && !session ? (
                  <button key={item.id} type="button" onClick={requestPracticeLogin} className={className}>
                    {item.label}
                  </button>
                ) : (
                  <Link key={item.id} href={item.href} className={className}>
                    {item.label}
                  </Link>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={className}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* CTA & User Profile Section */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {session ? (
              <>
                {/* Góc Học Tập CTA Button */}
                <Link
                  href="/student"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-extrabold bg-[#894C5B] text-white hover:bg-[#723c4a] shadow-md hover:shadow-lg active:scale-95 transition-all whitespace-nowrap"
                >
                  <GraduationCap size={18} weight="fill" className="text-[#F5C842]" />
                  <span>Góc học tập</span>
                </Link>

                {/* User Avatar & Dropdown Menu */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-[#FEF9C3] hover:bg-[#FDF3A7] border border-[#F3E8C4] transition-colors"
                  >
                    <span className="text-xs font-bold text-[#1E1B18] max-w-[100px] truncate">
                      {studentName}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-[#894C5B] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {avatarInitial}
                    </div>
                    <CaretDown size={14} weight="bold" className="text-[#5C5752]" />
                  </button>

                  {/* Dropdown Card */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#F3E8C4] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-2.5 border-b border-[#F3E8C4]">
                        <p className="text-xs text-[#857F7A]">Tài khoản học viên</p>
                        <p className="text-sm font-bold text-[#1E1B18] truncate">{studentName}</p>
                        <p className="text-xs text-[#857F7A] truncate">{session.user.email}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/student"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-[#1E1B18] hover:bg-[#FEF9C3] transition-colors"
                        >
                          <GraduationCap size={18} className="text-[#894C5B]" />
                          <span>Góc học tập</span>
                        </Link>
                        <Link
                          href="/student/learning-profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-[#5C5752] hover:bg-[#FEF9C3] hover:text-[#1E1B18] transition-colors"
                        >
                          <User size={18} className="text-[#857F7A]" />
                          <span>Hồ sơ học tập</span>
                        </Link>
                        <Link
                          href="/student/learning-profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-[#5C5752] hover:bg-[#FEF9C3] hover:text-[#1E1B18] transition-colors"
                        >
                          <Gear size={18} className="text-[#857F7A]" />
                          <span>Cài đặt</span>
                        </Link>
                      </div>

                      <div className="border-t border-[#F3E8C4] pt-1 mt-1">
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            void signOut();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-[#C84B31] hover:bg-[#FCE8E6] transition-colors"
                        >
                          <SignOut size={18} />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/student/login"
                  className="px-4 py-2.5 rounded-full text-sm font-semibold text-[#894C5B] hover:bg-[#F7E5EA] transition-colors whitespace-nowrap"
                >
                  Đăng nhập
                </Link>
                <button
                  onClick={() => scrollToSection("consultation")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-[#F5C842] text-[#1E1B18] hover:bg-[#E5B520] shadow-md hover:shadow-lg active:scale-95 transition-all whitespace-nowrap"
                >
                  <PhoneCall size={16} weight="bold" />
                  <span>Tư vấn miễn phí</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-[#FEF9C3] text-[#1E1B18] border border-[#F3E8C4] hover:bg-[#F5C842] transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
          </button>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-[73px] bg-[#FEFDF5] border-b border-[#F3E8C4] shadow-xl p-6 transition-all animate-in fade-in slide-in-from-top-4">
            <div className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => {
                const className = `text-left px-4 py-3 rounded-xl font-medium text-base transition-colors ${
                  !item.href && activeSection === item.id
                    ? "bg-[#F5C842] text-[#1E1B18] font-bold"
                    : "text-[#5C5752] hover:bg-[#FEF9C3]"
                }`;

                return item.href && item.id === "practice" && !session ? (
                  <button
                    key={item.id}
                    type="button"
                    onClick={requestPracticeLogin}
                    className={className}
                  >
                    {item.label}
                  </button>
                ) : item.href ? (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={className}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item)}
                    className={className}
                  >
                    {item.label}
                  </button>
                );
              })}
              <div className="pt-4 border-t border-[#F3E8C4] flex flex-col gap-3">
                {session ? (
                  <>
                    <Link
                      href="/student"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center py-3 rounded-xl font-extrabold text-white bg-[#894C5B] shadow-md flex items-center justify-center gap-2"
                    >
                      <GraduationCap size={20} weight="fill" className="text-[#F5C842]" />
                      <span>Vào Góc học tập</span>
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        void signOut();
                      }}
                      className="w-full text-center py-2.5 rounded-xl font-bold text-[#C84B31] bg-[#FCE8E6]"
                    >
                      Đăng xuất ({studentName})
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/student/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center py-3 rounded-xl font-semibold text-[#894C5B] bg-[#F7E5EA]"
                    >
                      Đăng nhập học viên
                    </Link>
                    <button
                      onClick={() => scrollToSection("consultation")}
                      className="w-full text-center py-3 rounded-xl font-bold bg-[#F5C842] text-[#1E1B18] shadow-md"
                    >
                      Nhận tư vấn lộ trình miễn phí
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {practiceLoginOpen && (
        <div
          className="practice-login-backdrop fixed inset-0 z-[100] grid place-items-center bg-[#2C271D]/45 p-4 backdrop-blur-md"
          onClick={() => setPracticeLoginOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="practice-login-title"
            aria-describedby="practice-login-description"
            className="practice-login-panel relative isolate w-full max-w-[460px] overflow-hidden rounded-[28px] border border-[#E9CD67] bg-[#FFFDF5] p-7 text-center shadow-[0_30px_90px_rgba(92,72,18,0.24)] sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div aria-hidden="true" className="absolute -right-16 -top-20 -z-10 size-52 rounded-full bg-[#F8D85A]/35 blur-2xl" />
            <div aria-hidden="true" className="absolute -bottom-20 -left-16 -z-10 size-48 rounded-full bg-[#FFF0A8]/60 blur-2xl" />

            <button
              type="button"
              aria-label="Đóng thông báo"
              onClick={() => setPracticeLoginOpen(false)}
              className="absolute right-4 top-4 grid size-10 place-items-center rounded-full border border-[#E9DDAF] bg-white/75 text-[#6B6043] backdrop-blur transition duration-300 hover:rotate-90 hover:border-[#D6B94A] hover:bg-white hover:text-[#332B18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C79A16] focus-visible:ring-offset-2"
            >
              <X size={20} weight="bold" />
            </button>

            <div className="practice-login-icon relative mx-auto grid size-[72px] place-items-center rounded-[22px] border border-[#E6C952] bg-[#F9DC67] text-[#57410B] shadow-[0_12px_28px_rgba(192,145,12,0.22)]">
              <span aria-hidden="true" className="absolute inset-1 rounded-[17px] border border-white/55" />
              <GraduationCap size={34} weight="duotone" />
            </div>

            <h2 id="practice-login-title" className="practice-login-copy mt-6 text-[28px] font-extrabold tracking-[-0.035em] text-[#2B261B]">
              Đăng nhập để luyện đề
            </h2>
            <p id="practice-login-description" className="practice-login-copy mx-auto mt-2 max-w-sm text-[15px] leading-6 text-[#6E654D]">
              Bạn cần đăng nhập tài khoản học viên để lưu tiến độ, kết quả và xem lại đáp án.
            </p>

            <div className="practice-login-copy mt-5 flex items-center justify-center gap-2 rounded-2xl border border-[#EEE0A8] bg-[#FFF8D9]/80 px-4 py-3 text-sm font-semibold text-[#62531F]">
              <CheckCircle size={19} weight="fill" className="shrink-0 text-[#A77C08]" />
              Tiến độ luyện tập luôn được lưu lại
            </div>

            <div className="practice-login-actions mt-6 grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
              <button
                type="button"
                onClick={() => setPracticeLoginOpen(false)}
                className="min-h-12 rounded-2xl border border-[#DDD0A2] bg-white/70 px-5 text-sm font-bold text-[#5D5339] transition duration-300 hover:-translate-y-0.5 hover:border-[#C6A83C] hover:bg-white active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C79A16] focus-visible:ring-offset-2"
              >
                Để sau
              </button>
              <Link
                href="/student/login?next=%2Fstudent%2Fpractice"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#D9B72F] bg-[#F5CD43] px-5 text-sm font-extrabold text-[#2E2715] shadow-[0_10px_24px_rgba(191,143,5,0.22)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#F8D75B] hover:shadow-[0_14px_30px_rgba(191,143,5,0.28)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A77C08] focus-visible:ring-offset-2"
              >
                Đăng nhập ngay
                <ArrowRight size={18} weight="bold" className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </section>
        </div>
      )}

    </>
  );
}
