import { useState } from "react";
import { Check, X, FileCsv, ArrowClockwise, Info } from "@phosphor-icons/react";
import { stableMetric } from "../../lib/stable-metric";

interface StudentSummary {
  id: string;
  studentCode: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarPath: string | null;
  currentBand: number | null;
  targetBand: number | null;
}

interface Enrollment {
  id: string;
  classId: string;
  studentId: string;
  status: string;
}

type Roster = { enrollment: Enrollment; student: StudentSummary }[];

interface CourseAttendanceProps {
  roster: Roster;
  completedSessions: number;
  onSelectStudent?: (studentId: string) => void;
}

export default function CourseAttendance({ roster, completedSessions, onSelectStudent }: CourseAttendanceProps) {
  const sessions = Array.from({ length: Math.min(completedSessions, 8) }, (_, index) => index + 1);
  
  // Local state to simulate attendance toggles
  const [attendanceMap, setAttendanceMap] = useState<Record<string, Record<number, boolean>>>(() => {
    const initialMap: Record<string, Record<number, boolean>> = {};
    roster.forEach(item => {
      initialMap[item.student.id] = {};
      sessions.forEach(session => {
        // Deterministic mock initial value matching the stableMetric logic
        initialMap[item.student.id][session] = stableMetric(item.student.id, session, 0, 10) > 1;
      });
    });
    return initialMap;
  });

  const toggleAttendance = (studentId: string, session: number) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [session]: !prev[studentId]?.[session]
      }
    }));
  };

  const getAttendanceRate = (studentId: string) => {
    const records = attendanceMap[studentId] || {};
    const presentCount = Object.values(records).filter(Boolean).length;
    return sessions.length ? Math.round((presentCount / sessions.length) * 100) : 0;
  };

  const getOverallAttendanceRate = () => {
    let totalPresent = 0;
    let totalRecords = 0;
    Object.values(attendanceMap).forEach(records => {
      Object.values(records).forEach(present => {
        totalRecords++;
        if (present) totalPresent++;
      });
    });
    return totalRecords ? Math.round((totalPresent / totalRecords) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Attendance Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-surface border border-outline-variant/40 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Chuyên cần trung bình</span>
            <strong className="text-2xl font-black text-primary mt-1 block tabular-nums">{getOverallAttendanceRate()}%</strong>
          </div>
          <span className="material-symbols-outlined text-4xl text-primary bg-primary-container/20 p-2 rounded-xl">
            analytics
          </span>
        </div>
        <div className="bg-surface border border-outline-variant/40 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Session đã điểm danh</span>
            <strong className="text-2xl font-black text-on-surface mt-1 block tabular-nums">{sessions.length} session</strong>
          </div>
          <span className="material-symbols-outlined text-4xl text-emerald-700 bg-emerald-50 p-2 rounded-xl">
            check_circle
          </span>
        </div>
        <div className="bg-surface border border-outline-variant/40 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Nguồn dữ liệu</span>
            <strong className="text-sm font-extrabold text-on-surface mt-1.5 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse inline-block" />
              Zoom SDK / Thủ công
            </strong>
          </div>
          <span className="material-symbols-outlined text-4xl text-blue-700 bg-blue-50 p-2 rounded-xl">
            sync
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-outline-variant/40 bg-surface shadow-sm overflow-hidden">
        {/* Table Header Controls */}
        <div className="border-b border-outline-variant/30 p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-extrabold text-on-surface">Bảng điểm danh chi tiết</h2>
            <p className="mt-0.5 text-xs text-on-surface-variant leading-relaxed">
              Dữ liệu được đồng bộ từ thời gian kết nối Zoom. Click vào từng ô để thay đổi thủ công.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 border border-outline-variant/60 hover:bg-surface-container rounded-xl text-xs font-bold text-on-surface-variant transition-colors">
              <ArrowClockwise size={14} />
              Đồng bộ Zoom
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary hover:opacity-90 rounded-xl text-xs font-bold transition-all shadow-sm">
              <FileCsv size={14} />
              Xuất báo cáo
            </button>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/40">
                <th className="sticky left-0 bg-surface-container-low z-10 px-5 py-4 font-bold text-xs uppercase tracking-wider text-on-surface-variant border-r border-outline-variant/20">
                  Học viên
                </th>
                {sessions.map(session => (
                  <th key={session} className="px-3 py-4 text-center text-xs font-bold uppercase tracking-wider text-on-surface-variant border-r border-outline-variant/20">
                    Session {session}
                  </th>
                ))}
                <th className="px-5 py-4 font-bold text-xs uppercase tracking-wider text-on-surface-variant text-center">
                  Tỷ lệ chuyên cần
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/25">
              {roster.map(item => {
                const rate = getAttendanceRate(item.student.id);
                const isWarning = rate < 80;
                
                return (
                  <tr key={item.enrollment.id} className="hover:bg-surface-container-low/20 transition-colors">
                    {/* Sticky Student Name */}
                    <td className="sticky left-0 bg-surface z-10 px-5 py-4 border-r border-outline-variant/20">
                      <div className="min-w-0">
                        <strong 
                          onClick={() => onSelectStudent?.(item.student.id)}
                          className="font-extrabold text-on-surface text-sm block cursor-pointer hover:text-primary hover:underline"
                        >
                          {item.student.fullName}
                        </strong>
                        <span className="text-[10px] font-bold text-on-surface-variant mt-0.5 block">
                          {item.student.studentCode}
                        </span>
                      </div>
                    </td>

                    {/* Sessions Toggles */}
                    {sessions.map(session => {
                      const present = attendanceMap[item.student.id]?.[session] ?? false;
                      const hasZoomTime = stableMetric(item.student.id, session, 0, 100) > 40; // mock data zoom time
                      const zoomDuration = hasZoomTime ? stableMetric(item.student.id, session, 45, 75) : 0;

                      return (
                        <td 
                          key={session} 
                          className="px-2 py-3 text-center border-r border-outline-variant/20 last:border-r-0 cursor-pointer select-none hover:bg-surface-container-low/40 group/cell transition-colors"
                          onClick={() => toggleAttendance(item.student.id, session)}
                        >
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold border transition-all ${
                              present 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 group-hover/cell:bg-emerald-100" 
                                : "bg-rose-50 text-rose-700 border-rose-200 group-hover/cell:bg-rose-100"
                            }`}>
                              {present ? <Check size={14} weight="bold" /> : <X size={14} weight="bold" />}
                            </span>
                            {present && zoomDuration > 0 && (
                              <span className="text-[9px] text-on-surface-variant font-bold tabular-nums opacity-60">
                                {zoomDuration}m Zoom
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Progress Bar for Attendance Rate */}
                    <td className="px-5 py-4 align-middle">
                      <div className="flex flex-col items-center justify-center min-w-[100px]">
                        <span className={`text-xs font-extrabold tabular-nums px-2 py-0.5 rounded-md ${
                          isWarning ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {rate}%
                        </span>
                        <div className="h-1.5 w-24 bg-surface-container rounded-full overflow-hidden mt-1.5">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              isWarning ? "bg-rose-500" : "bg-emerald-500"
                            }`} 
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend / Info footer */}
        <div className="p-4 bg-surface-container-low/30 border-t border-outline-variant/30 flex items-center gap-2 text-xs text-on-surface-variant font-semibold">
          <Info size={16} className="text-primary" />
          <span>Hệ thống tự động đồng bộ kết quả Zoom sau mỗi session. Giáo viên có thể nhấp trực tiếp vào ô trạng thái để điều chỉnh thủ công trong trường hợp mất kết nối.</span>
        </div>
      </div>
    </div>
  );
}
