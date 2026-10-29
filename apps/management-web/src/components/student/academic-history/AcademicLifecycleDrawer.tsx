import {
  ArrowsLeftRight,
  CalendarBlank,
  CheckCircle,
  Clock,
  GraduationCap,
  Info,
  PauseCircle,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useMemo, useState, type FormEvent } from "react";
import type { Course, Enrollment } from "../../../academic-types";
import { Drawer } from "../../AdminUi";
import { apiFetch } from "../../../lib/api";
import { formatAcademicDate } from "./academicHistoryUtils";

export type LifecycleDialogState = {
  kind: "reservation" | "transfer";
  enrollment: Enrollment;
} | null;

type Props = {
  dialog: NonNullable<LifecycleDialogState>;
  courses: Course[];
  onClose: () => void;
  onSaved: () => Promise<void>;
};

export default function AcademicLifecycleDrawer({
  dialog,
  courses,
  onClose,
  onSaved,
}: Props) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [targetCourseId, setTargetCourseId] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentCourse = courses.find(c => c.id === dialog.enrollment.courseId);

  // Available destination courses for transfer
  const targets = useMemo(
    () =>
      courses.filter(
        item => item.id !== dialog.enrollment.courseId && ["OPEN", "ACTIVE"].includes(item.status)
      ),
    [courses, dialog.enrollment.courseId]
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const isTransfer = dialog.kind === "transfer";
      await apiFetch(
        `/admin/enrollments/${dialog.enrollment.id}/${isTransfer ? "transfers" : "reservations"}`,
        {
          method: "POST",
          body: JSON.stringify(
            isTransfer
              ? {
                  targetCourseId,
                  reason,
                  feeAdjustment: 0,
                  notes: notes || null,
                }
              : {
                  reason,
                  sessionsConsumed: 0,
                  sessionsRemaining: currentCourse?.totalSessions || 0,
                  creditAmount: 0,
                  expiresOn: expiresOn || null,
                  notes: notes || null,
                }
          ),
        }
      );
      await onSaved();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không thể gửi yêu cầu");
    } finally {
      setSaving(false);
    }
  }

  const isTransfer = dialog.kind === "transfer";

  return (
    <Drawer
      title={isTransfer ? "Tạo yêu cầu chuyển lớp học" : "Tạo yêu cầu bảo lưu kết quả"}
      description="Yêu cầu sẽ được gửi tới cấp quản lý phê duyệt và lưu vết đầy đủ trong nhật ký học vụ."
      onClose={onClose}
    >
      <form onSubmit={submit} className="flex h-full flex-col justify-between space-y-6">
        <div className="space-y-5 flex-1 overflow-y-auto pr-1">
          {/* Current Course Card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Lớp học hiện tại
            </span>
            <div className="flex items-center justify-between gap-2">
              <strong className="font-display text-sm font-black text-slate-900">
                {currentCourse?.name || "Khóa học hiện tại"}
              </strong>
              <span className="font-mono text-xs font-bold text-[#8B3F56] bg-[#8B3F56]/10 px-2 py-0.5 rounded-md">
                {currentCourse?.code || "—"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>Bắt đầu: {formatAcademicDate(dialog.enrollment.startedOn || currentCourse?.startsOn)}</span>
              <span>•</span>
              <span>Quy mô: {currentCourse?.totalSessions || "—"} buổi</span>
            </div>
          </div>

          {/* Transfer Target Course Selection */}
          {isTransfer && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Chọn lớp đích chuyển tới <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={targetCourseId}
                onChange={e => setTargetCourseId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 transition focus:border-[#8B3F56] focus:outline-none focus:ring-2 focus:ring-[#8B3F56]/20"
              >
                <option value="">-- Chọn khóa học đang mở --</option>
                {targets.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.code} — {item.name} ({item.level || "Tiêu chuẩn"})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                Chỉ hiển thị các lớp học đang mở tuyển sinh hoặc đang diễn ra ({targets.length} lớp khả dụng).
              </p>
            </div>
          )}

          {/* Reservation Expiration Date */}
          {!isTransfer && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Hiệu lực bảo lưu đến ngày
              </label>
              <input
                type="date"
                value={expiresOn}
                onChange={e => setExpiresOn(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 transition focus:border-[#8B3F56] focus:outline-none focus:ring-2 focus:ring-[#8B3F56]/20"
              />
              <p className="text-[11px] text-slate-400">
                Theo quy định, thời hạn bảo lưu thông thường là 90 ngày kể từ ngày bảo lưu.
              </p>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Căn cứ &amp; Lý do học vụ <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-800 transition placeholder-slate-400 focus:border-[#8B3F56] focus:outline-none focus:ring-2 focus:ring-[#8B3F56]/20"
              placeholder={
                isTransfer
                  ? "Ví dụ: Học viên đổi lịch công tác / Trình độ vượt cấp cần chuyển sang lớp chuyên sâu hơn..."
                  : "Ví dụ: Học viên xin nghỉ chữa bệnh / Thi học kỳ bận đột xuất, xin bảo lưu 2 tháng..."
              }
            />
          </div>

          {/* Internal Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Ghi chú nội bộ
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-800 transition placeholder-slate-400 focus:border-[#8B3F56] focus:outline-none focus:ring-2 focus:ring-[#8B3F56]/20"
              placeholder="Thông tin thêm cho quản lý phê duyệt..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
              <WarningCircle size={16} className="text-rose-600 shrink-0" weight="fill" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Hủy thao tác
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#8B3F56] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#783549] transition disabled:opacity-50"
          >
            <CheckCircle size={16} weight="bold" />
            <span>{saving ? "Đang gửi yêu cầu..." : "Gửi yêu cầu phê duyệt"}</span>
          </button>
        </div>
      </form>
    </Drawer>
  );
}
