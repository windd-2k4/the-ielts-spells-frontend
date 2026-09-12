"use client";

import { useState, useEffect, useRef } from "react";
import { BrandMark } from "@ielts/ui";
import {
  List,
  X,
  PhoneCall,
  Wrench,
  Warning,
  GraduationCap,
  User,
  Gear,
  SignOut,
  CaretDown,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useStudentSession } from "@/features/student-auth/StudentSessionProvider";

interface NavItem {
  id: string;
  label: string;
  isDev?: boolean;
}
const NAV_ITEMS: NavItem[] = [
  { id: "hero", label: "Trang chủ" },
  { id: "about", label: "Giới thiệu" },
  { id: "benefits", label: "Quyền lợi" },
  { id: "courses", label: "Khóa học" },
  { id: "teachers", label: "Giáo viên" },
  { id: "feedback", label: "Feedback" },
  { id: "practice", label: "Luyện đề", isDev: true },
];

export default function Navbar() {
  const { session, signOut } = useStudentSession();
  const [activeSection, setActiveSection] = useState("hero");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Development Popup State
  const [devModalOpen, setDevModalOpen] = useState(false);
  const [devModalFeature, setDevModalFeature] = useState("");

  const studentName = session?.user?.user_metadata?.full_name || session?.user?.email?.split("@")[0] || "Học viên";
  const avatarInitial = studentName.charAt(0).toUpperCase();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Section scroll spy logic for standard section IDs
      const sectionItems = NAV_ITEMS.filter((item) => !item.isDev);
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
    if (item.isDev) {
      setDevModalFeature(item.label);
      setDevModalOpen(true);
      return;
    }
    scrollToSection(item.id);
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
              const isActive = !item.isDev && activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[#F5C842] text-[#1E1B18] font-bold shadow-sm"
                      : "text-[#5C5752] hover:text-[#1E1B18] hover:bg-white/60"
                  }`}
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
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`text-left px-4 py-3 rounded-xl font-medium text-base transition-colors ${
                    !item.isDev && activeSection === item.id
                      ? "bg-[#F5C842] text-[#1E1B18] font-bold"
                      : "text-[#5C5752] hover:bg-[#FEF9C3]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
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

      {/* Feature Under Development Modal */}
      {devModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setDevModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border-2 border-[#F3E8C4] shadow-2xl text-center space-y-5 relative animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Icon Badge */}
            <div className="w-16 h-16 rounded-2xl bg-[#FEF9C3] text-[#894C5B] border-2 border-[#F3E8C4] flex items-center justify-center mx-auto shadow-sm">
              <Wrench size={32} weight="fill" className="text-[#894C5B]" />
            </div>

            {/* Content Text */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F7E5EA] text-[#894C5B] rounded-full text-xs font-extrabold uppercase tracking-wider">
                <Warning size={14} weight="bold" />
                <span>Thông Báo Tính Năng</span>
              </div>
              <h3 className="font-display text-2xl font-extrabold text-[#1E1B18]">
                Chức Năng Đang Phát Triển
              </h3>
              <p className="text-sm text-[#5C5752] leading-relaxed">
                Tính năng <strong className="text-[#894C5B]">"{devModalFeature}"</strong> đang được hệ thống hoàn thiện kỹ lưỡng và sẽ sớm ra mắt trong thời gian tới. Cảm ơn bạn đã quan tâm!
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setDevModalOpen(false)}
              className="w-full py-3 rounded-2xl bg-[#F5C842] text-[#1E1B18] font-extrabold hover:bg-[#E5B520] active:scale-95 transition-all shadow-md text-sm"
            >
              Đã hiểu &amp; Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
}
