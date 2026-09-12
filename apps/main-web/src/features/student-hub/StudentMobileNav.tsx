"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  BookOpenText,
  PencilSimpleLine,
  ChartLineUp,
  Robot,
  GraduationCap,
  CalendarCheck,
  MapTrifold,
  ClockCounterClockwise,
  UserGear,
  X,
  ArrowLeft,
} from "@phosphor-icons/react";

interface StudentMobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const BOTTOM_NAV_ITEMS = [
  { href: "/student", label: "Tổng quan", icon: <SquaresFour size={20} weight="bold" /> },
  { href: "/student/assignments", label: "Bài tập", icon: <BookOpenText size={20} weight="bold" /> },
  { href: "/student/practice", label: "Luyện đề", icon: <PencilSimpleLine size={20} weight="bold" /> },
  { href: "/student/progress", label: "Tiến độ", icon: <ChartLineUp size={20} weight="bold" /> },
  { href: "/student/ai-tutor", label: "AI Tutor", icon: <Robot size={20} weight="bold" /> },
];

const ALL_NAV_ITEMS = [
  { href: "/student", label: "Tổng quan Hub", icon: <SquaresFour size={20} weight="bold" /> },
  { href: "/student/assignments", label: "Bài tập của tôi", icon: <BookOpenText size={20} weight="bold" /> },
  { href: "/student/practice", label: "Luyện đề 4 kỹ năng", icon: <PencilSimpleLine size={20} weight="bold" /> },
  { href: "/student/courses", label: "Khóa học của tôi", icon: <GraduationCap size={20} weight="bold" /> },
  { href: "/student/schedule", label: "Lịch học", icon: <CalendarCheck size={20} weight="bold" /> },
  { href: "/student/roadmap", label: "Lộ trình học tập", icon: <MapTrifold size={20} weight="bold" /> },
  { href: "/student/progress", label: "Tiến độ IELTS", icon: <ChartLineUp size={20} weight="bold" /> },
  { href: "/student/history", label: "Lịch sử làm bài", icon: <ClockCounterClockwise size={20} weight="bold" /> },
  { href: "/student/ai-tutor", label: "AI Tutor Assistant", icon: <Robot size={20} weight="bold" /> },
  { href: "/student/learning-profile", label: "Hồ sơ học tập", icon: <UserGear size={20} weight="bold" /> },
];

export function StudentMobileNav({ isOpen, onClose }: StudentMobileNavProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={onClose}
        >
          <div
            className="w-72 bg-[#FEFDF5] h-full shadow-2xl p-5 border-r border-[#F3E8C4] flex flex-col justify-between animate-in slide-in-from-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#F3E8C4] pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#894C5B] text-[#F5C842] flex items-center justify-center font-bold text-sm">
                    ✨
                  </div>
                  <span className="font-extrabold text-[#1E1B18] text-base">Student Hub</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-[#FEF9C3] text-[#1E1B18]"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>

              <div className="space-y-1">
                <Link
                  href="/"
                  onClick={onClose}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#894C5B] bg-[#F7E5EA]"
                >
                  <ArrowLeft size={16} weight="bold" />
                  <span>Quay về Trang chủ public</span>
                </Link>
              </div>

              <nav className="space-y-1 pt-2">
                <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#A39B91]">
                  Danh mục chức năng
                </div>
                {ALL_NAV_ITEMS.map((item) => {
                  const isActive =
                    item.href === "/student"
                      ? pathname === "/student"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-[#894C5B] text-white"
                          : "text-[#5C5752] hover:bg-[#FEF9C3] hover:text-[#1E1B18]"
                      }`}
                    >
                      <span className={isActive ? "text-[#F5C842]" : "text-[#894C5B]"}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-[#F3E8C4] text-center text-xs text-[#857F7A]">
              The IELTS Spells © 2026
            </div>
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-[#FEFDF5] border-t border-[#F3E8C4] py-2 px-3 z-40 shadow-lg flex items-center justify-around">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/student"
              ? pathname === "/student"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl text-[10px] font-bold transition-colors ${
                isActive
                  ? "text-[#894C5B]"
                  : "text-[#857F7A] hover:text-[#1E1B18]"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive ? "bg-[#894C5B] text-white shadow-xs" : "bg-transparent"
                }`}
              >
                {item.icon}
              </div>
              <span className="truncate max-w-[64px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
