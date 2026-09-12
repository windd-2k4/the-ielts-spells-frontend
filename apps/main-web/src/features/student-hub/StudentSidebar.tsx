"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@ielts/ui";
import {
  SquaresFour,
  BookOpenText,
  PencilSimpleLine,
  GraduationCap,
  CalendarCheck,
  MapTrifold,
  ChartLineUp,
  ClockCounterClockwise,
  Robot,
  UserGear,
  ArrowLeft,
  Sparkle,
} from "@phosphor-icons/react";

interface NavMenuItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const MENU_ITEMS: NavMenuItem[] = [
  {
    href: "/student",
    label: "Tổng quan Hub",
    icon: <SquaresFour size={20} weight="duotone" />,
  },
  {
    href: "/student/assignments",
    label: "Bài tập của tôi",
    icon: <BookOpenText size={20} weight="duotone" />,
  },
  {
    href: "/student/practice",
    label: "Luyện đề 4 kỹ năng",
    icon: <PencilSimpleLine size={20} weight="duotone" />,
  },
  {
    href: "/student/courses",
    label: "Khóa học của tôi",
    icon: <GraduationCap size={20} weight="duotone" />,
  },
  {
    href: "/student/schedule",
    label: "Lịch học",
    icon: <CalendarCheck size={20} weight="duotone" />,
  },
  {
    href: "/student/roadmap",
    label: "Lộ trình học tập",
    icon: <MapTrifold size={20} weight="duotone" />,
  },
  {
    href: "/student/progress",
    label: "Tiến độ IELTS",
    icon: <ChartLineUp size={20} weight="duotone" />,
  },
  {
    href: "/student/history",
    label: "Lịch sử làm bài",
    icon: <ClockCounterClockwise size={20} weight="duotone" />,
  },
  {
    href: "/student/ai-tutor",
    label: "AI Tutor",
    icon: <Robot size={20} weight="duotone" />,
    badge: "Sắp ra mắt",
  },
  {
    href: "/student/learning-profile",
    label: "Hồ sơ học tập",
    icon: <UserGear size={20} weight="duotone" />,
  },
];

export function StudentSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-[#FEFDF5] border-r border-[#F3E8C4] min-h-screen sticky top-0 h-screen overflow-y-auto">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#F3E8C4] flex items-center justify-between bg-white/50 backdrop-blur-xs">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo.jpg"
            alt="The IELTS Spells"
            className="w-9 h-9 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform border border-[#F3E8C4]"
          />
          <BrandMark />
        </Link>
      </div>

      {/* Back to Public Site Link */}
      <div className="px-3.5 pt-3 pb-1">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#857F7A] hover:text-[#1E1B18] hover:bg-[#FEF9C3] transition-colors"
        >
          <ArrowLeft size={14} weight="bold" />
          <span>Về trang chủ công khai</span>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3.5 py-2 space-y-1">
        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#A39B91]">
          Góc học tập cá nhân
        </div>

        {MENU_ITEMS.map((item) => {
          const isActive =
            item.href === "/student"
              ? pathname === "/student" || pathname === "/student/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isActive
                  ? "bg-[#894C5B] text-white shadow-md shadow-[#894C5B]/15"
                  : "text-[#5C5752] hover:bg-[#FEF9C3] hover:text-[#1E1B18]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? "text-[#F5C842]" : "text-[#894C5B]"}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isActive
                      ? "bg-[#F5C842] text-[#1E1B18]"
                      : "bg-[#F7E5EA] text-[#894C5B]"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Inspiring Footer Support Banner */}
      <div className="p-4 m-3 rounded-2xl bg-gradient-to-br from-[#FEF9C3] to-[#FDF3A7] border border-[#F3E8C4] text-center space-y-2 relative overflow-hidden shadow-xs">
        <div className="w-8 h-8 rounded-full bg-[#894C5B] text-[#F5C842] font-bold text-sm flex items-center justify-center mx-auto shadow-2xs">
          <Sparkle size={16} weight="fill" />
        </div>
        <p className="text-xs font-bold text-[#1E1B18]">Cần trợ giúp học tập?</p>
        <p className="text-[11px] text-[#78726A] leading-relaxed">
          Đội ngũ IELTS Spells luôn sẵn sàng cố vấn cho bạn.
        </p>
        <Link
          href="/#consultation"
          className="inline-block text-[11px] font-bold text-[#894C5B] hover:underline"
        >
          Liên hệ đội ngũ hỗ trợ
        </Link>
      </div>
    </aside>
  );
}
