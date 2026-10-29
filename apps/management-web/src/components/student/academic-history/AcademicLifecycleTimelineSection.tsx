import {
  ArrowsLeftRight,
  CaretDown,
  CaretUp,
  CheckCircle,
  Clock,
  GraduationCap,
  PauseCircle,
  XCircle,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import type { Course, Enrollment, Reservation, Transfer } from "../../../academic-types";
import {
  buildAcademicTimeline,
  formatAcademicDate,
  formatTimeAgo,
  type AcademicTimelineEvent,
  type AcademicTimelineEventType,
} from "./academicHistoryUtils";

type Props = {
  enrollments: Enrollment[];
  courses: Course[];
  reservations: Reservation[];
  transfers: Transfer[];
};

export default function AcademicLifecycleTimelineSection({
  enrollments,
  courses,
  reservations,
  transfers,
}: Props) {
  const [filterType, setFilterType] = useState<string>("ALL");
  const [isExpanded, setIsExpanded] = useState(false);

  const timelineEvents = useMemo(() => {
    return buildAcademicTimeline(enrollments, courses, reservations, transfers);
  }, [enrollments, courses, reservations, transfers]);

  const filteredEvents = useMemo(() => {
    if (filterType === "ALL") return timelineEvents;
    if (filterType === "RESERVATION") {
      return timelineEvents.filter(e => e.type.startsWith("RESERVATION"));
    }
    if (filterType === "TRANSFER") {
      return timelineEvents.filter(e => e.type.startsWith("TRANSFER"));
    }
    return timelineEvents;
  }, [timelineEvents, filterType]);

  const getEventIcon = (type: AcademicTimelineEventType) => {
    switch (type) {
      case "ENROLLED":
        return <GraduationCap size={14} weight="fill" className="text-[#8B3F56]" />;
      case "COMPLETED":
        return <CheckCircle size={14} weight="fill" className="text-blue-600" />;
      case "RESERVATION_PENDING":
        return <PauseCircle size={14} weight="fill" className="text-amber-600" />;
      case "RESERVATION_APPROVED":
        return <CheckCircle size={14} weight="fill" className="text-emerald-600" />;
      case "RESERVATION_REJECTED":
        return <XCircle size={14} weight="fill" className="text-rose-600" />;
      case "TRANSFER_PENDING":
        return <ArrowsLeftRight size={14} weight="bold" className="text-purple-600" />;
      case "TRANSFER_APPROVED":
        return <CheckCircle size={14} weight="fill" className="text-emerald-600" />;
      case "TRANSFER_REJECTED":
        return <XCircle size={14} weight="fill" className="text-rose-600" />;
      default:
        return <Clock size={14} weight="fill" className="text-slate-500" />;
    }
  };

  return (
    <section
      aria-label="Nhật ký biến động học vụ"
      className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-3"
    >
      {/* Header with collapse toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2.5 border-b border-slate-100">
        <button
          type="button"
          onClick={() => setIsExpanded(v => !v)}
          className="flex items-center gap-2 text-left group"
        >
          <Clock size={18} className="text-[#8B3F56]" weight="duotone" />
          <h2 className="font-display text-sm sm:text-base font-black text-slate-900 group-hover:text-[#8B3F56] transition">
            Nhật ký biến động học vụ ({timelineEvents.length})
          </h2>
          {isExpanded ? (
            <CaretUp size={14} className="text-slate-400 group-hover:text-slate-600" />
          ) : (
            <CaretDown size={14} className="text-slate-400 group-hover:text-slate-600" />
          )}
        </button>

        {/* Filter buttons if expanded */}
        {isExpanded && (
          <div className="flex items-center gap-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              className={`px-2.5 py-1 rounded-md transition ${
                filterType === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tất cả ({timelineEvents.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("TRANSFER")}
              className={`px-2.5 py-1 rounded-md transition ${
                filterType === "TRANSFER"
                  ? "bg-purple-700 text-white"
                  : "bg-purple-50 text-purple-700 hover:bg-purple-100"
              }`}
            >
              Chuyển lớp ({timelineEvents.filter(e => e.type.startsWith("TRANSFER")).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("RESERVATION")}
              className={`px-2.5 py-1 rounded-md transition ${
                filterType === "RESERVATION"
                  ? "bg-amber-700 text-white"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              Bảo lưu ({timelineEvents.filter(e => e.type.startsWith("RESERVATION")).length})
            </button>
          </div>
        )}
      </div>

      {/* Timeline items list */}
      {isExpanded && (
        <div className="space-y-2 pt-1">
          {filteredEvents.length > 0 ? (
            filteredEvents.map(event => {
              const timeAgo = formatTimeAgo(event.timestamp);

              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 text-xs transition hover:bg-white hover:border-slate-200"
                >
                  {/* Event icon dot */}
                  <div className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-white border border-slate-200 shadow-2xs">
                    {getEventIcon(event.type)}
                  </div>

                  {/* Event text content */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-800">
                          {event.title}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-200/60 px-1.5 py-0.2 rounded">
                          {event.courseCode}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${event.statusClass}`}>
                          {event.statusLabel}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {event.formattedDate} {timeAgo && `• ${timeAgo}`}
                        </span>
                      </div>
                    </div>

                    {/* Target destination or reason */}
                    {event.targetCourseName && (
                      <div className="text-[11px] text-purple-900 font-medium">
                        Lớp đích: <strong>{event.targetCourseName}</strong> ({event.targetCourseCode})
                      </div>
                    )}

                    {event.reason && (
                      <p className="text-[11px] text-slate-600 italic">
                        Lý do: "{event.reason}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-400">
              Không có sự kiện học vụ nào trong bộ lọc này.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
