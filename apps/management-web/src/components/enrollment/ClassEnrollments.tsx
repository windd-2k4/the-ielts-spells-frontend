import { NotePencil, MagnifyingGlass, Funnel, Eye } from "@phosphor-icons/react";
import type { AcademicClass, Enrollment } from "../../academic-types";
import { enrollmentStatusLabel } from "../../academic-types";
import { StatusBadge } from "../AdminUi";

interface ClassEnrollmentsProps {
  items: Enrollment[];
  classes: AcademicClass[];
  query: string;
  setQuery: (query: string) => void;
  classId: string;
  setClassId: (classId: string) => void;
  onEdit: (item: Enrollment) => void;
  onSelectStudent: (studentId: string) => void;
}

export default function ClassEnrollments({
  items,
  classes,
  query,
  setQuery,
  classId,
  setClassId,
  onEdit,
  onSelectStudent
}: ClassEnrollmentsProps) {

  const getClassName = (id: string) => {
    const value = classes.find(item => item.id === id);
    return value ? `${value.name} (${value.code})` : "Lớp không xác định";
  };

  const getStudentMockName = (studentId: string) => {
    // Return friendly readable names for demonstration instead of raw UUIDs
    const mockNames: Record<string, string> = {
      "student-1": "Nguyễn Minh Anh",
      "student-2": "Lê Thu Thảo",
      "student-3": "Trần Việt Hoàng",
      "student-4": "Nguyễn Việt Bách",
      "student-5": "Bùi Huyền",
      "student-6": "Xuân Mai",
    };
    return mockNames[studentId] || `Học viên (${studentId.slice(0, 6)})`;
  };

  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-surface p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={18} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Tìm theo mã học sinh hoặc ghi chú..."
            className="w-full pl-10 pr-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-on-surface-variant transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Funnel size={16} className="text-on-surface-variant" />
          <select
            value={classId}
            onChange={event => setClassId(event.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-outline-variant/60 rounded-xl bg-surface text-xs font-bold text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
          >
            <option value="all">Tất cả lớp học</option>
            {classes.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid listing Table */}
      <div className="bg-surface rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm min-w-[850px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/40">
                <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4">Học viên</th>
                <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4">Lớp học</th>
                <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4">Ngày ghi danh</th>
                <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4">Trạng thái</th>
                <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4">Ghi chú</th>
                <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4 w-32 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/25">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-surface-container-low/20 transition-colors">
                  <td className="px-6 py-4">
                    <strong className="text-on-surface text-sm block font-bold">
                      {getStudentMockName(item.studentId)}
                    </strong>
                    <span className="text-[10px] text-on-surface-variant mt-0.5 block font-mono">
                      {item.studentId}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-on-surface font-semibold">
                    {getClassName(item.classId)}
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant font-semibold tabular-nums">
                    {new Date(item.enrolledAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge value={item.status}>{enrollmentStatusLabel[item.status]}</StatusBadge>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant max-w-[240px] truncate font-medium">
                    {item.notes || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        title="Xem học bạ chi tiết"
                        onClick={() => onSelectStudent(item.studentId)}
                        className="px-2.5 py-1.5 border border-primary/20 hover:bg-primary-container/10 text-primary rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Eye size={14} />
                        Học bạ
                      </button>
                      <button
                        title="Cập nhật ghi danh"
                        onClick={() => onEdit(item)}
                        className="p-1.5 border border-outline-variant hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors"
                      >
                        <NotePencil size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
