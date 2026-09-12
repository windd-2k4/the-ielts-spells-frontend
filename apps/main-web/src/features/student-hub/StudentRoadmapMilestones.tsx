"use client";

import Link from "next/link";
import {
  MapTrifold,
  CheckCircle,
  Circle,
  Record,
  Flag,
  ArrowRight,
} from "@phosphor-icons/react";
import { StudentEmptyState } from "./StudentEmptyState";

export interface RoadmapMilestoneItem {
  id: string;
  title: string;
  status: "completed" | "current" | "upcoming";
  description?: string;
}

interface StudentRoadmapMilestonesProps {
  milestones?: RoadmapMilestoneItem[];
  loading?: boolean;
}

export function StudentRoadmapMilestones({
  milestones = [],
  loading = false,
}: StudentRoadmapMilestonesProps) {
  const hasRoadmap = milestones.length > 0;

  return (
    <section className="mb-8">
      {/* Section Title */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#F7E5EA] text-[#894C5B] flex items-center justify-center font-bold">
            <MapTrifold size={20} weight="fill" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#1E1B18]">Lộ Trình Học Tập</h3>
            <p className="text-xs text-[#857F7A]">Các cột mốc chuyển giao năng lực cá nhân</p>
          </div>
        </div>

        {hasRoadmap && (
          <Link
            href="/student/roadmap"
            className="text-xs font-bold text-[#894C5B] hover:underline flex items-center gap-1"
          >
            <span>Xem chi tiết lộ trình</span>
            <ArrowRight size={12} weight="bold" />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="h-40 rounded-2xl bg-[#FEF9C3]/50 border border-[#F3E8C4] animate-pulse" />
      ) : !hasRoadmap ? (
        /* Empty State when student doesn't have a configured roadmap */
        <StudentEmptyState
          icon={<MapTrifold size={32} weight="duotone" className="text-[#894C5B]" />}
          title="Chưa có lộ trình học tập"
          description="Bạn chưa đăng ký thiết lập lộ trình cá nhân hóa. Hãy liên hệ cố vấn học thuật để xây dựng lộ trình đạt mốc Band mong muốn."
          actionLabel="Xây dựng lộ trình học tập"
          actionHref="/#consultation"
          compact
        />
      ) : (
        /* Timeline / Milestone Horizontal View */
        <div className="bg-white rounded-2xl p-6 border border-[#F3E8C4] shadow-xs overflow-x-auto">
          <div className="min-w-[600px] flex items-start justify-between relative">
            {/* Connecting Progress Line */}
            <div className="absolute top-5 left-8 right-8 h-1 bg-[#E5DFD3] z-0" />

            {milestones.map((item, index) => {
              const isCompleted = item.status === "completed";
              const isCurrent = item.status === "current";
              const isLast = index === milestones.length - 1;

              return (
                <div
                  key={item.id}
                  className="relative z-10 flex flex-col items-center text-center space-y-2 max-w-[110px]"
                >
                  {/* Status Circle Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-transform hover:scale-110 shadow-xs ${
                      isCompleted
                        ? "bg-[#894C5B] text-[#F5C842]"
                        : isCurrent
                        ? "bg-[#F5C842] text-[#1E1B18] ring-4 ring-[#FEF9C3]"
                        : isLast
                        ? "bg-[#1E1B18] text-white"
                        : "bg-white text-[#A39B91] border-2 border-[#E5DFD3]"
                    }`}
                  >
                    {isCompleted && <CheckCircle size={22} weight="fill" />}
                    {isCurrent && <Record size={22} weight="fill" className="animate-pulse" />}
                    {!isCompleted && !isCurrent && isLast && <Flag size={20} weight="fill" />}
                    {!isCompleted && !isCurrent && !isLast && <Circle size={20} />}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <p
                      className={`text-xs font-bold leading-tight ${
                        isCurrent
                          ? "text-[#894C5B] font-extrabold"
                          : isCompleted
                          ? "text-[#1E1B18]"
                          : "text-[#857F7A]"
                      }`}
                    >
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-[10px] text-[#A39B91] mt-0.5">{item.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
