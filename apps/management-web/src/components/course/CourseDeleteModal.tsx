import { useState } from "react";
import {
  Archive,
  ArrowCounterClockwise,
  ShieldWarning,
  Trash,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import type { Course } from "../../academic-types";
import { apiFetch } from "../../lib/api";

interface CourseDeleteModalProps {
  course: Course;
  enrollmentsCount?: number;
  open: boolean;
  onClose: () => void;
  onSuccess: (action: "deactivated" | "restored" | "deleted") => Promise<void>;
}

export function CourseDeleteModal({
  course,
  enrollmentsCount = 0,
  open,
  onClose,
  onSuccess,
}: CourseDeleteModalProps) {
  const [activeTab, setActiveTab] = useState<"soft" | "permanent">("soft");
  const [confirmCode, setConfirmCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const canHardDelete = enrollmentsCount === 0;

  async function handleSoftToggle() {
    setLoading(true);
    setError("");
    try {
      if (course.isActive) {
        // Soft delete / Deactivate
        await apiFetch(`/admin/courses/${course.id}`, { method: "DELETE" });
        await onSuccess("deactivated");
      } else {
        // Restore
        await apiFetch(`/admin/courses/${course.id}/restore`, { method: "PUT" });
        await onSuccess("restored");
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thao tác thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  async function handleHardDelete() {
    if (confirmCode.trim() !== course.code) {
      setError(`Vui lòng nhập chính xác mã khóa học "${course.code}" để xác nhận xóa.`);
      return;
    }

    setLoading(true);
    setError("");
    try {
      await apiFetch(`/admin/courses/${course.id}/permanent`, { method: "DELETE" });
      await onSuccess("deleted");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa vĩnh viễn khóa học.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-on-background/45 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-delete-dialog-title"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-t-2xl bg-surface p-6 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-outline-variant/30 pb-4">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-10 w-10 place-items-center rounded-xl ${
                course.isActive ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"
              }`}
            >
              {course.isActive ? <Archive size={22} weight="bold" /> : <ArrowCounterClockwise size={22} weight="bold" />}
            </span>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-outline">
                {course.code}
              </span>
              <h2 id="course-delete-dialog-title" className="font-display text-xl font-bold text-on-surface">
                {course.isActive ? "Quản lý ngừng hoạt động & Xóa" : "Quản lý khóa học lưu trữ"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="grid h-9 w-9 place-items-center rounded-xl border border-outline-variant/50 text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-error/30 bg-error-container/20 p-3 text-sm font-semibold text-error">
            <WarningCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab selection between Soft and Hard delete */}
        <div className="mt-5 flex rounded-xl bg-surface-container-low p-1 border border-outline-variant/40">
          <button
            type="button"
            onClick={() => { setActiveTab("soft"); setError(""); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "soft"
                ? "bg-surface text-on-surface shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {course.isActive ? "1. Ngừng hoạt động (Khuyến nghị)" : "1. Khôi phục hoạt động"}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("permanent"); setError(""); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "permanent"
                ? "bg-error/10 text-error shadow-sm font-extrabold"
                : "text-on-surface-variant hover:text-error"
            }`}
          >
            2. Xóa vĩnh viễn
          </button>
        </div>

        {/* TAB 1: SOFT DEACTIVATE / RESTORE */}
        {activeTab === "soft" && (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-on-surface">
              <div className="flex items-center gap-2 font-bold text-amber-700">
                <ShieldWarning size={20} />
                <span>{course.isActive ? "Lưu trữ an toàn dữ liệu" : "Kích hoạt lại khóa học"}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
                {course.isActive ? (
                  <>
                    Khi ngừng hoạt động, khóa học <strong>{course.name}</strong> sẽ bị ẩn khỏi danh sách điều hành và
                    không nhận tuyển sinh mới. <strong>Toàn bộ thông tin học viên, lịch học, điểm danh và bài tập vẫn được bảo lưu 100%</strong>.
                  </>
                ) : (
                  <>
                    Khóa học <strong>{course.name}</strong> hiện đang ngừng hoạt động. Bạn có thể khôi phục lại để khóa học tiếp tục xuất hiện trong danh sách quản lý.
                  </>
                )}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="min-h-11 rounded-xl border border-outline-variant/60 px-5 text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSoftToggle}
                disabled={loading}
                className={`min-h-11 rounded-xl px-5 text-sm font-bold text-white transition-all disabled:opacity-50 ${
                  course.isActive
                    ? "bg-amber-600 hover:bg-amber-700 shadow-sm"
                    : "bg-primary hover:bg-on-primary-container shadow-sm"
                }`}
              >
                {loading
                  ? "Đang xử lý..."
                  : course.isActive
                  ? "Xác nhận ngừng hoạt động"
                  : "Khôi phục hoạt động"}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: HARD PERMANENT DELETE */}
        {activeTab === "permanent" && (
          <div className="mt-5 space-y-4">
            {!canHardDelete ? (
              <div className="rounded-xl border border-error/30 bg-error-container/15 p-4 text-sm">
                <strong className="block font-bold text-error flex items-center gap-1.5">
                  <WarningCircle size={18} /> Không thể xóa vĩnh viễn khóa học này
                </strong>
                <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
                  Khóa học hiện đang có <strong>{enrollmentsCount} học viên</strong> đã ghi danh trong hệ thống. Để bảo vệ
                  toàn vẹn học bạ, điểm danh và tiến độ của học viên, hệ thống không cho phép xóa sạch bản ghi khỏi cơ sở dữ liệu.
                </p>
                <div className="mt-3 text-xs font-semibold text-primary">
                  👉 Vui lòng chuyển sang tab <strong>"1. Ngừng hoạt động"</strong> để lưu trữ an toàn.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-error/30 bg-error-container/15 p-4 text-xs text-on-surface-variant leading-relaxed">
                  <strong className="block text-sm font-bold text-error mb-1">
                    Cảnh báo: Hành động này KHÔNG THỂ hoàn tác!
                  </strong>
                  Khóa học <strong>{course.name} ({course.code})</strong> là khóa học trống (chưa có học viên ghi danh).
                  Hành động này sẽ xóa hoàn toàn khóa học và mọi lịch học dự kiến khỏi hệ thống.
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                    Để xác nhận, vui lòng nhập chính xác mã khóa học:{" "}
                    <code className="rounded bg-surface-container-high px-1.5 py-0.5 text-error font-mono font-bold">
                      {course.code}
                    </code>
                  </label>
                  <input
                    type="text"
                    value={confirmCode}
                    onChange={(e) => setConfirmCode(e.target.value)}
                    placeholder={`Nhập ${course.code}`}
                    className="min-h-11 w-full rounded-xl border border-outline-variant/60 bg-surface px-3.5 text-sm font-mono focus:border-error focus:ring-error"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="min-h-11 rounded-xl border border-outline-variant/60 px-5 text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleHardDelete}
                    disabled={loading || confirmCode.trim() !== course.code}
                    className="min-h-11 inline-flex items-center gap-2 rounded-xl bg-error px-5 text-sm font-bold text-white hover:bg-red-700 transition-all disabled:opacity-40"
                  >
                    <Trash size={16} weight="bold" />
                    <span>{loading ? "Đang xóa..." : "Xóa vĩnh viễn khóa học"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
