import { useState, useDeferredValue, useMemo } from "react";
import { MagnifyingGlass, Envelope, Phone, Eye, Robot } from "@phosphor-icons/react";
import { StatusBadge } from "../AdminUi";

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

interface CourseStudentsProps {
  roster: Roster;
  onSelectStudent: (studentId: string) => void;
}

export default function CourseStudents({ roster, onSelectStudent }: CourseStudentsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);

  const filteredRoster = useMemo(() => {
    return roster.filter(item => {
      const text = `${item.student.fullName} ${item.student.studentCode} ${item.student.email || ""} ${item.student.phone || ""}`.toLowerCase();
      return text.includes(deferredQuery.trim().toLowerCase());
    });
  }, [roster, deferredQuery]);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/40 bg-surface p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm học viên bằng tên, mã, email..."
            className="w-full pl-10 pr-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-on-surface-variant transition-all"
          />
        </div>
        <div className="text-xs font-bold text-on-surface-variant ml-auto">
          Hiển thị {filteredRoster.length} học viên
        </div>
      </div>

      {/* Grid listing */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredRoster.map(item => {
          const current = item.student.currentBand || 0;
          const target = item.student.targetBand || 0;
          const percentToTarget = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
          
          return (
            <div 
              key={item.enrollment.id}
              className="group bg-surface border border-outline-variant/40 hover:border-primary/40 rounded-2xl p-5 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between"
            >
              <div className="flex items-start gap-4">
                {/* Avatar with Initials */}
                <div className="w-12 h-12 rounded-full bg-primary-container/20 text-primary border border-primary/10 flex items-center justify-center font-display font-black text-lg shrink-0">
                  {item.student.fullName.charAt(0)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-extrabold text-base text-on-surface truncate group-hover:text-primary transition-colors">
                      {item.student.fullName}
                    </h3>
                    <span className="text-xs font-bold bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">
                      {item.student.studentCode}
                    </span>
                  </div>

                  {/* Contacts */}
                  <div className="mt-2 space-y-1 text-xs text-on-surface-variant font-semibold">
                    {item.student.email && (
                      <p className="flex items-center gap-1.5 truncate">
                        <Envelope size={14} />
                        {item.student.email}
                      </p>
                    )}
                    {item.student.phone && (
                      <p className="flex items-center gap-1.5 truncate">
                        <Phone size={14} />
                        {item.student.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Band & Progress */}
              <div className="mt-4 pt-4 border-t border-outline-variant/20 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Trình độ</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <strong className="text-lg font-black text-primary">{current.toFixed(1)}</strong>
                    <span className="text-xs text-on-surface-variant">/ {target.toFixed(1)} Band</span>
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <div className="flex items-center justify-between text-[10px] font-bold text-on-surface-variant mb-1">
                    <span>Đạt mục tiêu</span>
                    <span>{percentToTarget}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-container overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${percentToTarget}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                <StatusBadge value={item.enrollment.status}>
                  {item.enrollment.status === "ACTIVE" ? "Đang học" : "Tạm dừng"}
                </StatusBadge>

                <div className="flex items-center gap-2">
                  <button 
                    title="Phân tích AI"
                    className="p-2 border border-primary/20 hover:bg-primary-container/10 text-primary rounded-lg transition-colors"
                  >
                    <Robot size={16} />
                  </button>
                  <button 
                    onClick={() => onSelectStudent(item.student.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant/60 hover:bg-surface-container rounded-lg text-xs font-bold text-on-surface-variant"
                  >
                    <Eye size={14} />
                    Học bạ
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRoster.length === 0 && (
        <div className="bg-surface border border-outline-variant/40 p-8 rounded-2xl text-center text-on-surface-variant text-sm font-semibold">
          Không tìm thấy học viên nào phù hợp với từ khóa tìm kiếm.
        </div>
      )}
    </div>
  );
}
