import {
  CalendarBlank,
  Check,
  Copy,
  DotsThreeVertical,
  Envelope,
  PencilSimple,
  Phone,
  Plus,
  ShieldCheck,
  Target,
  User,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { StudentDetail } from "../../../academic-types";
import { formatAcademicDate } from "./academicHistoryUtils";

type Props = {
  student: StudentDetail;
  onEditProfile: () => void;
};

export default function StudentOverviewSection({ student, onEditProfile }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyCode = async () => {
    if (student.studentCode) {
      await navigator.clipboard.writeText(student.studentCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      setMenuOpen(false);
    }
  };

  return (
    <section
      aria-label="Student Overview"
      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-3.5 shadow-2xs"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Avatar & Horizontal Student Metadata Strip */}
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Avatar initial */}
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#8B3F56] text-base font-black text-white shadow-2xs">
            {student.fullName ? student.fullName.slice(0, 1).toUpperCase() : "H"}
          </div>

          <div className="min-w-0 flex-1">
            {/* Row 1: Name, Code, Status & Target Band */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate max-w-xs sm:max-w-md">
                {student.fullName}
              </h1>

              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold font-mono text-slate-700 border border-slate-200">
                {student.studentCode || "Chưa có mã"}
              </span>

              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold border ${
                  student.active
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <span className={`size-1.5 rounded-full ${student.active ? "bg-emerald-500" : "bg-slate-400"}`} />
                {student.active ? "Đang hoạt động" : "Đã khóa"}
              </span>

              {student.targetBand != null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#8B3F56]/10 px-2.5 py-0.5 text-[11px] font-black text-[#8B3F56] border border-[#8B3F56]/20">
                  <Target size={12} weight="bold" />
                  Mục tiêu: {student.targetBand}
                </span>
              )}
            </div>

            {/* Row 2: Contact info & Join Date inline */}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 font-medium">
              <span className="truncate max-w-[200px]" title={student.email || ""}>
                {student.email || "Chưa có email"}
              </span>
              <span className="text-slate-300">•</span>
              <span>{student.phone || "Chưa có số điện thoại"}</span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="hidden sm:inline">
                Nhập học: {formatAcademicDate(student.joinedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions (Chỉnh sửa hồ sơ, Xếp vào lớp mới, Menu phụ) */}
        <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
          <button
            type="button"
            onClick={onEditProfile}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition active:scale-[0.98]"
          >
            <PencilSimple size={14} weight="bold" />
            <span>Chỉnh sửa hồ sơ</span>
          </button>

          <Link
            to={`/students?tab=enrollments&studentId=${student.id}&action=create`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B3F56] px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#783549] transition active:scale-[0.98]"
          >
            <Plus size={14} weight="bold" />
            <span>Xếp vào lớp mới</span>
          </Link>

          {/* Secondary Actions Kebab Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(v => !v)}
              className="grid size-8 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              title="Thao tác khác"
              aria-expanded={menuOpen}
            >
              <DotsThreeVertical size={16} weight="bold" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-20 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg shadow-slate-200/50 text-xs font-medium">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 text-left transition"
                >
                  {copiedCode ? (
                    <>
                      <Check size={14} weight="bold" className="text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Đã sao chép mã!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Sao chép mã học viên</span>
                    </>
                  )}
                </button>

                <div className="my-1 border-t border-slate-100" />

                <div className="px-3.5 py-1 text-[11px] text-slate-400">
                  ID: {student.id.slice(0, 8)}...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
