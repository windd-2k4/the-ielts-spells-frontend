"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CaretDown,
  User,
  Gear,
  SignOut,
  House,
  GraduationCap,
  List,
} from "@phosphor-icons/react";
import { useStudentSession } from "@/features/student-auth/StudentSessionProvider";
import { useStudentPortal } from "@/features/student-hub/StudentPortalProvider";

interface StudentTopbarProps {
  onToggleMobileMenu?: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  "/student": "Góc Học Tập - Tổng Quan",
  "/student/assignments": "Bài Tập Của Tôi",
  "/student/practice": "Luyện Đề 4 Kỹ Năng",
  "/student/courses": "Khóa Học Của Tôi",
  "/student/schedule": "Lịch Học & Thời Khóa Biểu",
  "/student/roadmap": "Lộ Trình Học Tập",
  "/student/progress": "Tiến Độ IELTS & Chẩn Đoán",
  "/student/history": "Lịch Sử Làm Bài",
  "/student/ai-tutor": "AI Tutor Assistant",
  "/student/learning-profile": "Hồ Sơ Học Tập",
};

export function StudentTopbar({ onToggleMobileMenu }: StudentTopbarProps) {
  const pathname = usePathname();
  const { session, signOut } = useStudentSession();
  const { data } = useStudentPortal();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const studentName =
    data?.profile.fullName ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split("@")[0] ||
    "Học viên";
  const avatarInitial = studentName.charAt(0).toUpperCase();

  const pageTitle = PAGE_TITLES[pathname] || "Góc Học Tập";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-[#FEFDF5]/90 backdrop-blur-md border-b border-[#F3E8C4] py-3.5 px-4 sm:px-6 sticky top-0 z-30 flex items-center justify-between gap-4">
      {/* Left: Mobile Trigger & Clear Page Title */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-[#FEF9C3] text-[#1E1B18] border border-[#F3E8C4] hover:bg-[#F5C842] transition-colors"
            aria-label="Toggle Navigation"
          >
            <List size={22} weight="bold" />
          </button>
        )}

        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#857F7A] font-medium">
            <Link href="/" className="hover:text-[#1E1B18] transition-colors flex items-center gap-1">
              <House size={13} />
              <span>Trang chủ</span>
            </Link>
            <span>/</span>
            <span className="font-semibold text-[#894C5B]">Góc học tập</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#1E1B18] tracking-tight font-sans">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Right Actions: Public Link, Notifications, User Menu */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Back to Public Home CTA */}
        <Link
          href="/"
          className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-[#894C5B] bg-[#F7E5EA] hover:bg-[#f0d4dc] transition-colors border border-[#F0C4CE]/50"
        >
          <House size={14} weight="bold" />
          <span>Về trang chủ</span>
        </Link>

        {/* Notifications Icon Button */}
        <button
          disabled
          className="p-2.5 rounded-full bg-white border border-[#E8E2D5] text-[#9A9296] relative shadow-2xs cursor-not-allowed"
          title="Thông báo đang được phát triển"
          aria-label="Thông báo đang được phát triển"
        >
          <Bell size={18} weight="bold" />
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 pl-3 rounded-full bg-[#FEF9C3] hover:bg-[#FDF3A7] border border-[#F3E8C4] transition-colors shadow-2xs"
          >
            <span className="hidden sm:inline-block text-xs font-semibold text-[#1E1B18] max-w-[120px] truncate">
              {studentName}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#894C5B] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {avatarInitial}
            </div>
            <CaretDown size={14} weight="bold" className="text-[#5C5752]" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-[#F3E8C4] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-3 border-b border-[#F3E8C4] bg-[#FFFDF7]">
                <p className="text-xs text-[#857F7A]">Tài khoản học viên</p>
                <p className="text-sm font-bold text-[#1E1B18] truncate">{studentName}</p>
                <p className="text-xs text-[#857F7A] truncate">{data?.profile.email ?? session?.user?.email}</p>
              </div>

              <div className="py-1">
                <Link
                  href="/student"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#1E1B18] hover:bg-[#FEF9C3] transition-colors"
                >
                  <GraduationCap size={18} className="text-[#894C5B]" />
                  <span>Tổng quan Hub</span>
                </Link>
                <Link
                  href="/student/learning-profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#5C5752] hover:bg-[#FEF9C3] hover:text-[#1E1B18] transition-colors"
                >
                  <User size={18} className="text-[#857F7A]" />
                  <span>Hồ sơ học tập</span>
                </Link>
                <Link
                  href="/student/learning-profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#5C5752] hover:bg-[#FEF9C3] hover:text-[#1E1B18] transition-colors"
                >
                  <Gear size={18} className="text-[#857F7A]" />
                  <span>Cài đặt tài khoản</span>
                </Link>
              </div>

              <div className="border-t border-[#F3E8C4] pt-1 mt-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    void signOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-[#C84B31] hover:bg-[#FCE8E6] transition-colors text-left"
                >
                  <SignOut size={18} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
