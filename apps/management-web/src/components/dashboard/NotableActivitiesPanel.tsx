import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Bell,
  CaretRight,
  CheckCircle,
  Clock,
  VideoCamera,
} from "@phosphor-icons/react";
import type { ActionItem, AtRiskStudent, ScheduleEvent } from "../../lib/dashboard-api";

type Props = {
  actionItems: ActionItem[];
  scheduleEvents: ScheduleEvent[];
  atRiskStudents: AtRiskStudent[];
};

type FilterCategory = "ALL" | "URGENT" | "SCHEDULE" | "STUDENTS";

export default function NotableActivitiesPanel({
  actionItems,
  scheduleEvents,
  atRiskStudents,
}: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("ALL");

  const urgentItems = useMemo(
    () => actionItems.filter((i) => i.priority === "HIGH"),
    [actionItems]
  );

  const totalCount = actionItems.length + scheduleEvents.length + atRiskStudents.length;

  return (
    <div className="bg-white border border-slate-200 shadow-xs p-5 md:p-6 flex flex-col justify-between h-full">
      {/* 1. Header with Urgent Alert Banner */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-none bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
              <Bell size={16} weight="bold" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                Cảnh báo & Diễn biến cần lưu ý
              </h3>
            </div>
          </div>

          {urgentItems.length > 0 ? (
            <span className="px-2.5 py-0.5 rounded-none text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
              <span className="size-1.5 bg-rose-600 animate-pulse" />
              <span>{urgentItems.length} việc gấp</span>
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-none text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Ổn định
            </span>
          )}
        </div>

        {/* 2. Square Filter Tabs */}
        <div className="mt-3 flex items-center border border-slate-200 bg-slate-50 p-0.5 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveFilter("ALL")}
            className={`px-3 py-1 transition-colors whitespace-nowrap ${
              activeFilter === "ALL"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tất cả ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("URGENT")}
            className={`px-3 py-1 transition-colors whitespace-nowrap ${
              activeFilter === "URGENT"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-rose-700"
            }`}
          >
            Cần xử lý ({actionItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("SCHEDULE")}
            className={`px-3 py-1 transition-colors whitespace-nowrap ${
              activeFilter === "SCHEDULE"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-indigo-700"
            }`}
          >
            Lịch học ({scheduleEvents.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("STUDENTS")}
            className={`px-3 py-1 transition-colors whitespace-nowrap ${
              activeFilter === "STUDENTS"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-amber-700"
            }`}
          >
            Học viên ({atRiskStudents.length})
          </button>
        </div>
      </div>

      {/* 3. Streamlined Activity Feed */}
      <div className="divide-y divide-slate-100 my-3 overflow-y-auto max-h-[300px] select-none pr-0.5">
        {totalCount === 0 ? (
          <div className="py-10 text-center text-slate-500 flex flex-col items-center">
            <CheckCircle size={32} weight="duotone" className="text-emerald-600 mb-1.5" />
            <p className="text-xs font-bold text-slate-900">Mọi việc đã xử lý xong</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Hệ thống đang hoạt động tối ưu.</p>
          </div>
        ) : (
          <>
            {/* ACTION ITEMS */}
            {(activeFilter === "ALL" || activeFilter === "URGENT") &&
              actionItems.map((item) => {
                const isUrgent = item.priority === "HIGH";
                return (
                  <Link
                    key={item.id}
                    to={item.ctaRoute}
                    className={`block py-2.5 px-3 transition-colors border-l-2 group ${
                      isUrgent
                        ? "bg-rose-50/50 hover:bg-rose-50 border-rose-500"
                        : "hover:bg-slate-50 border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide border ${
                              isUrgent
                                ? "bg-rose-100 text-rose-800 border-rose-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {isUrgent ? "GẤP" : "CẦN LƯU Ý"}
                          </span>
                          {item.deadlineNote && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                              <Clock size={11} />
                              {item.deadlineNote}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-slate-700 transition-colors truncate">
                          {item.title}
                        </h4>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-slate-700 group-hover:translate-x-0.5 transition-transform">
                        <span className="hidden sm:inline">{item.ctaLabel}</span>
                        <CaretRight size={13} weight="bold" />
                      </div>
                    </div>
                  </Link>
                );
              })}

            {/* SCHEDULE EVENTS */}
            {(activeFilter === "ALL" || activeFilter === "SCHEDULE") &&
              scheduleEvents.map((evt) => {
                const startDate = new Date(evt.startsAt);
                const dayStr = startDate.toLocaleDateString("vi-VN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                });
                const timeStr = startDate.toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={evt.id}
                    className="py-2.5 px-3 hover:bg-slate-50 transition-colors border-l-2 border-indigo-500 flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {evt.eventType === "COURSE_START" ? "Khai giảng" : "Buổi học"}
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-slate-500">
                          {timeStr} | {dayStr}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {evt.title} <span className="font-mono text-indigo-600">({evt.courseCode})</span>
                      </h4>
                    </div>

                    {evt.locationOrZoom && /^https?:\/\//i.test(evt.locationOrZoom) ? (
                      <a
                        href={evt.locationOrZoom}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-200"
                        title="Vào phòng Zoom"
                      >
                        <VideoCamera size={14} weight="bold" />
                      </a>
                    ) : (
                      <Link
                        to="/courses"
                        className="shrink-0 text-xs font-bold text-indigo-600 flex items-center gap-0.5 hover:underline"
                      >
                        <span>Lịch</span>
                        <CaretRight size={12} weight="bold" />
                      </Link>
                    )}
                  </div>
                );
              })}

            {/* AT RISK STUDENTS */}
            {(activeFilter === "ALL" || activeFilter === "STUDENTS") &&
              atRiskStudents.map((st) => (
                <Link
                  key={`${st.studentId}-${st.courseCode}`}
                  to={st.profileRoute}
                  className="block py-2.5 px-3 hover:bg-slate-50 transition-colors border-l-2 border-amber-500 group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                          CẦN HỖ TRỢ
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Lớp {st.courseCode}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-800 transition-colors truncate">
                        {st.fullName} &bull;{" "}
                        <span className="font-normal text-slate-500">{st.riskReason}</span>
                      </h4>
                    </div>

                    <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-amber-800">
                      <span>Hồ sơ</span>
                      <CaretRight size={12} weight="bold" />
                    </div>
                  </div>
                </Link>
              ))}
          </>
        )}
      </div>

      {/* 4. Footer Link */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="text-[11px]">Tự động đồng bộ</span>
        <Link to="/courses" className="text-slate-900 font-bold hover:underline flex items-center gap-1">
          <span>Xem toàn bộ</span>
          <ArrowUpRight size={13} weight="bold" />
        </Link>
      </div>
    </div>
  );
}
