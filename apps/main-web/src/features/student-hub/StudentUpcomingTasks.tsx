"use client";

import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle,
  Clock,
  PencilSimpleLine,
  VideoCamera,
  ArrowRight,
} from "@phosphor-icons/react";
import { StudentEmptyState } from "./StudentEmptyState";

interface TaskItem {
  id: string;
  title: string;
  type: "assignment" | "session";
  skillPair?: string;
  dueDate?: string;
  sessionTime?: string;
  actionUrl: string;
  actionLabel: string;
}

interface StudentUpcomingTasksProps {
  tasks?: TaskItem[];
  loading?: boolean;
}

export function StudentUpcomingTasks({ tasks = [], loading = false }: StudentUpcomingTasksProps) {
  return (
    <section className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#F7E5EA] text-[#894C5B] flex items-center justify-center font-bold shadow-2xs">
            <CheckCircle size={18} weight="fill" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1E1B18] font-sans">Việc Cần Làm</h3>
            <p className="text-xs text-[#857F7A]">Bài tập sắp hết hạn &amp; các buổi học tiếp theo</p>
          </div>
        </div>

        <Link
          href="/student/assignments"
          className="text-xs font-semibold text-[#894C5B] hover:underline flex items-center gap-1"
        >
          <span>Xem tất cả bài tập</span>
          <ArrowRight size={12} weight="bold" />
        </Link>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-[#FEF9C3]/40 border border-[#F3E8C4] animate-pulse"
            />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        /* Friendly Empty State */
        <StudentEmptyState
          icon={<CheckCircle size={32} weight="duotone" className="text-[#894C5B]" />}
          title="Bạn đã hoàn thành tất cả bài được giao! 🎉"
          description="Hiện tại không có bài tập hay lịch học nào sắp hết hạn. Bạn có thể tự chọn một đề luyện tập tự do trong ngân hàng đề."
          actionLabel="Khám phá kho đề luyện tập"
          actionHref="/student/practice"
          compact
        />
      ) : (
        /* Tasks Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-2xl p-5 border border-[#E8E2D5] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group hover:border-[#F3E8C4]"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      task.type === "assignment"
                        ? "bg-[#F7E5EA] text-[#894C5B]"
                        : "bg-[#FEF9C3] text-[#1E1B18]"
                    }`}
                  >
                    {task.type === "assignment" ? (
                      <>
                        <PencilSimpleLine size={12} weight="bold" />
                        <span>Bài tập</span>
                      </>
                    ) : (
                      <>
                        <VideoCamera size={12} weight="bold" />
                        <span>Buổi học</span>
                      </>
                    )}
                  </span>

                  {task.dueDate && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-[#C84B31]">
                      <Clock size={12} />
                      <span>Hạn: {task.dueDate}</span>
                    </span>
                  )}

                  {task.sessionTime && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-[#5C5752]">
                      <CalendarCheck size={12} />
                      <span>{task.sessionTime}</span>
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-sm sm:text-base text-[#1E1B18] group-hover:text-[#894C5B] transition-colors leading-snug line-clamp-2">
                  {task.title}
                </h4>

                {task.skillPair && (
                  <p className="text-xs text-[#857F7A]">Chủ đề: {task.skillPair}</p>
                )}
              </div>

              <Link
                href={task.actionUrl}
                className="w-full py-2.5 rounded-xl bg-[#FEF9C3] text-[#1E1B18] font-bold text-xs hover:bg-[#F5C842] transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <span>{task.actionLabel}</span>
                <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
