import { useState } from "react";
import { 
  CalendarBlank, 
  List, 
  Printer, 
  CaretLeft, 
  CaretRight, 
  ArrowsOut, 
  VideoCamera, 
  Exam, 
  BookOpen, 
  Info,
  Clock
} from "@phosphor-icons/react";
import { StatusBadge } from "../AdminUi";

interface CourseScheduleProps {
  totalSessions: number;
  completedSessions: number;
}

type ScheduleType = "ALL" | "CLASS" | "EXAM";
type ViewMode = "LIST" | "CALENDAR";

interface CalendarEvent {
  day: number; // 2 for Monday, 7 for Saturday, 8 for Sunday
  timeSlot: "MORNING" | "AFTERNOON" | "EVENING";
  title: string;
  time: string;
  type: "THEORY" | "PRACTICE" | "ONLINE" | "EXAM" | "SUSPENDED";
  room?: string;
  zoomUrl?: string;
  sessionNumber?: number;
}

export default function CourseSchedule({ totalSessions, completedSessions }: CourseScheduleProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("CALENDAR");
  const [filterType, setFilterType] = useState<ScheduleType>("ALL");
  const [currentDate, setCurrentDate] = useState("03/08/2026");

  // Sample calendar data representing a week
  const calendarEvents: CalendarEvent[] = [
    {
      day: 2,
      timeSlot: "EVENING",
      title: "Session 13: Reading Scanning & Skimming",
      time: "18:30 - 20:30",
      type: "ONLINE",
      zoomUrl: "https://zoom.us/j/123456789",
      sessionNumber: 13,
    },
    {
      day: 3,
      timeSlot: "AFTERNOON",
      title: "Luyện phát âm IPA bổ trợ",
      time: "14:00 - 16:00",
      type: "PRACTICE",
      room: "Phòng Academic 101",
    },
    {
      day: 4,
      timeSlot: "EVENING",
      title: "Session 14: Speaking Part 1 - Extension",
      time: "18:30 - 20:30",
      type: "THEORY",
      room: "Phòng Magic 202",
      sessionNumber: 14,
    },
    {
      day: 6,
      timeSlot: "EVENING",
      title: "Session 15: Listening Part 2 - Map Labeling",
      time: "18:30 - 20:30",
      type: "ONLINE",
      zoomUrl: "https://zoom.us/j/987654321",
      sessionNumber: 15,
    },
    {
      day: 7,
      timeSlot: "MORNING",
      title: "Thi thử Mid-Term Test 4.0+",
      time: "09:00 - 12:00",
      type: "EXAM",
      room: "Hội trường Magic",
    },
    {
      day: 7,
      timeSlot: "EVENING",
      title: "Session học nghỉ lễ (Tạm hoãn)",
      time: "18:30 - 20:30",
      type: "SUSPENDED",
    }
  ];

  const getDayLabel = (day: number) => {
    if (day === 8) return "Chủ nhật";
    return `Thứ ${day}`;
  };

  const getDayDate = (day: number) => {
    // Return mock date string for the week of Aug 3rd, 2026
    const baseDay = 3;
    const offset = day - 2;
    const d = baseDay + offset;
    return `${d < 10 ? "0" + d : d}/08/2026`;
  };

  const getEventClass = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "THEORY":
        return "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200";
      case "PRACTICE":
        return "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200";
      case "ONLINE":
        return "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200";
      case "EXAM":
        return "bg-amber-150 bg-yellow-100 text-amber-900 border-yellow-300 hover:bg-yellow-250";
      case "SUSPENDED":
        return "bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-250 line-through";
    }
  };

  const filteredEvents = calendarEvents.filter(event => {
    if (filterType === "CLASS") return event.type !== "EXAM" && event.type !== "SUSPENDED";
    if (filterType === "EXAM") return event.type === "EXAM";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-outline-variant/40 bg-surface p-4 shadow-sm">
        {/* Toggle List / Calendar */}
        <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-xl border border-outline-variant/20">
          <button
            onClick={() => setViewMode("CALENDAR")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              viewMode === "CALENDAR"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <CalendarBlank size={16} />
            Lịch tuần trực quan
          </button>
          <button
            onClick={() => setViewMode("LIST")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              viewMode === "LIST"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <List size={16} />
            Dạng danh sách
          </button>
        </div>

        {/* Calendar specific tools */}
        {viewMode === "CALENDAR" && (
          <div className="flex flex-wrap items-center gap-4">
            {/* Filter Radios */}
            <div className="flex items-center gap-3 text-xs font-bold text-on-surface-variant">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="schedule-filter"
                  checked={filterType === "ALL"}
                  onChange={() => setFilterType("ALL")}
                  className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                />
                Tất cả
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="schedule-filter"
                  checked={filterType === "CLASS"}
                  onChange={() => setFilterType("CLASS")}
                  className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                />
                Lịch học
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="schedule-filter"
                  checked={filterType === "EXAM"}
                  onChange={() => setFilterType("EXAM")}
                  className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                />
                Lịch thi
              </label>
            </div>

            {/* Date Input Mock */}
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-lg">
                calendar_month
              </span>
              <input
                type="text"
                value={currentDate}
                onChange={e => setCurrentDate(e.target.value)}
                className="pl-9 pr-3 py-1.5 w-32 border border-outline-variant/60 rounded-lg bg-surface text-xs font-bold text-on-surface-variant focus:outline-none focus:border-primary"
              />
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-1">
              <button className="p-1.5 border border-outline-variant/50 hover:bg-surface-container rounded-lg text-xs font-bold">
                Hiện tại
              </button>
              <button className="p-1.5 border border-outline-variant/50 hover:bg-surface-container rounded-lg text-on-surface-variant">
                <CaretLeft size={16} />
              </button>
              <button className="p-1.5 border border-outline-variant/50 hover:bg-surface-container rounded-lg text-on-surface-variant">
                <CaretRight size={16} />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-container-high border border-outline-variant/60 rounded-lg text-xs font-bold"
              >
                <Printer size={14} />
                In lịch
              </button>
              <button className="p-1.5 border border-outline-variant/50 hover:bg-surface-container rounded-lg text-on-surface-variant">
                <ArrowsOut size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid View */}
      {viewMode === "CALENDAR" ? (
        <div className="rounded-2xl border border-outline-variant/40 bg-surface shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse table-fixed">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/40">
                  <th className="w-20 px-3 py-4 text-xs font-bold text-on-surface-variant border-r border-outline-variant/20 uppercase tracking-wider text-center">
                    Ca học
                  </th>
                  {[2, 3, 4, 5, 6, 7, 8].map(day => (
                    <th key={day} className="px-3 py-4 border-r border-outline-variant/20 last:border-r-0 text-center">
                      <p className="text-sm font-extrabold text-on-surface">{getDayLabel(day)}</p>
                      <p className="text-xs text-on-surface-variant font-semibold mt-0.5">{getDayDate(day)}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/25">
                {(["MORNING", "AFTERNOON", "EVENING"] as const).map(slot => (
                  <tr key={slot} className="min-h-[140px] h-[140px]">
                    <td className="px-3 py-4 border-r border-outline-variant/20 font-display font-extrabold text-xs text-on-surface-variant text-center bg-surface-container-low/20">
                      {slot === "MORNING" && "Sáng"}
                      {slot === "AFTERNOON" && "Chiều"}
                      {slot === "EVENING" && "Tối"}
                    </td>
                    {[2, 3, 4, 5, 6, 7, 8].map(day => {
                      const events = filteredEvents.filter(e => e.day === day && e.timeSlot === slot);
                      return (
                        <td key={day} className="p-2 border-r border-outline-variant/20 last:border-r-0 valign-top vertical-top align-top relative bg-grid-pattern">
                          <div className="flex flex-col gap-2 h-full">
                            {events.map((event, i) => (
                              <div
                                key={i}
                                className={`p-2.5 rounded-xl border text-xs shadow-sm cursor-pointer transition-all duration-200 ${getEventClass(
                                  event.type
                                )}`}
                              >
                                <div className="flex items-center justify-between gap-1 font-bold">
                                  <span className="truncate">{event.title}</span>
                                  {event.type === "ONLINE" && <VideoCamera size={14} className="shrink-0 text-blue-600" />}
                                  {event.type === "EXAM" && <Exam size={14} className="shrink-0 text-amber-600" />}
                                </div>
                                <div className="flex items-center gap-1 mt-1 text-[10px] opacity-80 font-semibold">
                                  <Clock size={10} />
                                  <span>{event.time}</span>
                                </div>
                                {event.room && (
                                  <p className="text-[10px] mt-1 font-bold opacity-80 border-t border-current/10 pt-1">
                                    🏢 {event.room}
                                  </p>
                                )}
                                {event.zoomUrl && (
                                  <a
                                    href={event.zoomUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[9px] mt-1.5 px-2 py-0.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
                                  >
                                    Vào Zoom
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legends */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-outline-variant/30 bg-surface-container-low px-5 py-4 text-xs font-semibold text-on-surface-variant">
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-350" />
              Lịch học lý thuyết
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-350" />
              Lịch học thực hành
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-blue-100 border border-blue-350" />
              Lịch học trực tuyến (Zoom)
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-yellow-100 border border-yellow-350" />
              Lịch thi
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-rose-100 border border-rose-350 line-through" />
              Lịch tạm ngưng
            </span>
          </div>
        </div>
      ) : (
        /* List view */
        <div className="rounded-2xl border border-outline-variant/40 bg-surface shadow-sm overflow-hidden">
          <div className="border-b border-outline-variant/30 p-5">
            <h2 className="font-display text-xl font-bold">Thời khóa biểu lớp học (Danh sách)</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Chi tiết các session học của khóa học.</p>
          </div>
          <div className="divide-y divide-outline-variant/25">
            {Array.from({ length: Math.min(totalSessions, 12) }, (_, index) => {
              const done = index < completedSessions;
              return (
                <div key={index} className="grid gap-3 p-4 md:grid-cols-[90px_1fr_180px_130px] md:items-center hover:bg-surface-container-low/20 transition-colors">
                  <div className="text-xs font-bold uppercase tracking-wider text-primary">
                    Session {String(index + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">
                      {index % 2 === 0
                        ? "Reading & Listening: Scanning & Skimming Techniques"
                        : "Speaking & Writing: Forecast Practice & Structure Analysis"}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant flex items-center gap-1">
                      <Info size={14} />
                      Tập trung xây dựng vốn từ vựng và phản xạ làm bài
                    </p>
                  </div>
                  <span className="text-sm text-on-surface-variant font-semibold">
                    Thứ {index % 2 === 0 ? "3" : "5"} · 18:30 đến 20:30
                  </span>
                  <div>
                    <StatusBadge value={done ? "COMPLETED" : "PLANNED"}>
                      {done ? "Đã hoàn thành" : "Sắp diễn ra"}
                    </StatusBadge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
