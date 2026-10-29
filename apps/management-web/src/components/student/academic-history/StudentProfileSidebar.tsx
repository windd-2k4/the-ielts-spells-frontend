import {
  CalendarBlank,
  Certificate,
  ChatCircleDots,
  IdentificationCard,
  PencilSimple,
} from "@phosphor-icons/react";
import { useState } from "react";
import type { Enrollment, StudentDetail } from "../../../academic-types";
import { formatAcademicDate } from "./academicHistoryUtils";

type Props = {
  student: StudentDetail;
  enrollments: Enrollment[];
  onEditProfile: () => void;
};

export default function StudentProfileSidebar({ student, enrollments, onEditProfile }: Props) {
  const [notesExpanded, setNotesExpanded] = useState(false);

  // Find any enrollment with exam plan information
  const examEnrollment = enrollments.find(
    e => e.plannedExamMonth || e.actualExamDate || e.examRegistrationStatus !== "NOT_REGISTERED"
  );

  const emergency = student.emergencyContact as
    | { name?: string; relationship?: string; phone?: string }
    | undefined;

  const notesText = student.notes || "";
  const isNotesLong = notesText.length > 120;
  const displayedNotes = isNotesLong && !notesExpanded ? `${notesText.slice(0, 120)}...` : notesText;

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white shadow-2xs divide-y divide-slate-100">
      {/* SECTION 4: HỒ SƠ CÁ NHÂN */}
      <section aria-label="Thông tin hồ sơ cá nhân" className="p-4 space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <IdentificationCard size={15} className="text-[#8B3F56]" weight="duotone" />
            Hồ sơ cá nhân
          </h3>
          <button
            type="button"
            onClick={onEditProfile}
            className="text-[11px] font-semibold text-[#8B3F56] hover:underline inline-flex items-center gap-1"
          >
            <PencilSimple size={12} weight="bold" /> Sửa
          </button>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 font-medium text-[11px]">Ngày nhập học</span>
            <span className="font-semibold text-slate-800 text-right">
              {formatAcademicDate(student.joinedAt)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 font-medium text-[11px]">Ngày sinh</span>
            <span className="font-semibold text-slate-800 text-right">
              {formatAcademicDate(student.dateOfBirth, "Chưa cập nhật")}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 font-medium text-[11px]">Điện thoại</span>
            <span className="font-semibold text-slate-800 text-right">
              {student.phone || <span className="text-slate-400 font-normal">Chưa cập nhật</span>}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 font-medium text-[11px]">Email</span>
            <span
              className="font-semibold text-slate-800 text-right truncate max-w-[170px]"
              title={student.email || ""}
            >
              {student.email || <span className="text-slate-400 font-normal">Chưa cập nhật</span>}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 font-medium text-[11px]">Địa chỉ</span>
            <span className="font-semibold text-slate-800 text-right truncate max-w-[170px]" title={student.address || ""}>
              {student.address || <span className="text-slate-400 font-normal">Chưa cập nhật</span>}
            </span>
          </div>

          {emergency?.name && (
            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-slate-400 font-medium text-[11px]">Khẩn cấp</span>
              <span className="font-semibold text-slate-800 text-right text-[11px]">
                {emergency.name} {emergency.phone && `(${emergency.phone})`}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 5: MỤC TIÊU & KẾ HOẠCH IELTS */}
      <section aria-label="Mục tiêu & Kế hoạch IELTS" className="p-4 space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Certificate size={15} className="text-[#8B3F56]" weight="duotone" />
            Mục tiêu &amp; Kế hoạch IELTS
          </h3>
        </div>

        {/* Minimal Band Goal Strip */}
        <div className="rounded-lg bg-[#FAF7F8] px-3 py-2 border border-[#8B3F56]/15 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Mục tiêu
            </span>
            <strong className="text-base font-bold text-[#8B3F56]">
              Band {student.targetBand != null ? student.targetBand : "5.5"}
            </strong>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 block">Hiện tại</span>
            <span className="text-xs font-bold text-slate-700">
              {student.currentBand != null ? `Band ${student.currentBand}` : "Chưa test"}
            </span>
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 font-medium text-[11px]">Tháng dự kiến thi</span>
            <strong className="text-slate-800 font-semibold">
              {examEnrollment?.plannedExamMonth || "Chưa lên lịch"}
            </strong>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 font-medium text-[11px]">Ngày thi chính thức</span>
            <strong className="text-slate-800 font-semibold">
              {formatAcademicDate(examEnrollment?.actualExamDate, "Chưa xác định")}
            </strong>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 font-medium text-[11px]">Đăng ký IDP / BC</span>
            <span
              className={`font-semibold px-2 py-0.2 rounded text-[10px] ${
                examEnrollment?.examRegistrationStatus === "REGISTERED"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : examEnrollment?.examRegistrationStatus === "ISSUE"
                  ? "bg-rose-50 text-rose-800 border border-rose-200"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {examEnrollment?.examRegistrationStatus === "REGISTERED"
                ? "Đã đăng ký"
                : examEnrollment?.examRegistrationStatus === "ISSUE"
                ? "Cần hỗ trợ"
                : "Chưa đăng ký"}
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 6: GHI CHÚ HỌC VỤ NỘI BỘ */}
      <section aria-label="Ghi chú học vụ nội bộ" className="p-4 space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <ChatCircleDots size={15} className="text-[#8B3F56]" weight="duotone" />
            Ghi chú nội bộ
          </h3>
          <button
            type="button"
            onClick={onEditProfile}
            className="text-[11px] font-semibold text-[#8B3F56] hover:underline"
          >
            Sửa
          </button>
        </div>

        {notesText ? (
          <div className="space-y-1">
            <p className="rounded-lg bg-slate-50/70 p-2 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-100">
              {displayedNotes}
            </p>
            {isNotesLong && (
              <button
                type="button"
                onClick={() => setNotesExpanded(v => !v)}
                className="text-[11px] font-bold text-slate-500 hover:text-[#8B3F56] transition"
              >
                {notesExpanded ? "Thu gọn" : "Xem toàn bộ"}
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-1">
            Chưa có ghi chú nội bộ.
          </p>
        )}
      </section>
    </aside>
  );
}
