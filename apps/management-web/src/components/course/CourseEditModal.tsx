import { FormEvent, useState, useEffect } from "react";
import { Lock, WarningCircle, X } from "@phosphor-icons/react";
import type { Course, CourseForm } from "../../academic-types";
import { classStatusLabel, skillPairLabel } from "../../academic-types";
import { apiFetch } from "../../lib/api";

interface CourseEditModalProps {
  course: Course;
  currentEnrollmentsCount?: number;
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export function CourseEditModal({
  course,
  currentEnrollmentsCount = 0,
  open,
  onClose,
  onSaved,
}: CourseEditModalProps) {
  const [form, setForm] = useState<CourseForm>({
    name: course.name,
    description: course.description ?? "",
    level: course.level ?? "",
    skillPair: course.skillPair,
    targetBand: course.targetBand != null ? String(course.targetBand) : "",
    totalSessions: String(course.totalSessions),
    tuitionAmount: course.tuitionAmount != null ? String(course.tuitionAmount) : "",
    capacity: String(course.capacity),
    startsOn: course.startsOn,
    endsOn: course.endsOn ?? "",
    status: course.status,
    defaultZoomUrl: course.defaultZoomUrl ?? "",
    isPublic: course.isPublic,
    isActive: course.isActive,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      name: course.name,
      description: course.description ?? "",
      level: course.level ?? "",
      skillPair: course.skillPair,
      targetBand: course.targetBand != null ? String(course.targetBand) : "",
      totalSessions: String(course.totalSessions),
      tuitionAmount: course.tuitionAmount != null ? String(course.tuitionAmount) : "",
      capacity: String(course.capacity),
      startsOn: course.startsOn,
      endsOn: course.endsOn ?? "",
      status: course.status,
      defaultZoomUrl: course.defaultZoomUrl ?? "",
      isPublic: course.isPublic,
      isActive: course.isActive,
    });
    setError("");
  }, [course]);

  if (!open) return null;

  const field = (key: keyof CourseForm) => (value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    // Frontend validation: endsOn >= startsOn
    if (form.endsOn && form.endsOn < form.startsOn) {
      setError("Ngày kết thúc không được trước ngày bắt đầu.");
      return;
    }

    // Frontend validation: capacity >= current enrollment count
    const newCapacity = Number(form.capacity);
    if (currentEnrollmentsCount > 0 && newCapacity < currentEnrollmentsCount) {
      setError(
        `Sĩ số tối đa (${newCapacity}) không thể nhỏ hơn số học viên đang theo học (${currentEnrollmentsCount} học viên).`
      );
      return;
    }

    setSaving(true);
    try {
      await apiFetch<Course>(`/admin/courses/${course.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description ? form.description.trim() : null,
          level: form.level ? form.level.trim() : null,
          skillPair: form.skillPair,
          targetBand: form.targetBand ? Number(form.targetBand) : null,
          totalSessions: Number(form.totalSessions),
          tuitionAmount: form.tuitionAmount ? Number(form.tuitionAmount) : null,
          capacity: newCapacity,
          startsOn: form.startsOn,
          endsOn: form.endsOn || null,
          status: form.status,
          defaultZoomUrl: form.defaultZoomUrl ? form.defaultZoomUrl.trim() : null,
          isPublic: form.isPublic,
          isActive: form.isActive,
        }),
      });

      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật khóa học. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-on-background/45 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-edit-dialog-title"
    >
      <form
        onSubmit={handleSubmit}
        className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-surface p-6 shadow-2xl sm:rounded-2xl"
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-primary-container/30 px-2 py-0.5 text-xs font-extrabold uppercase tracking-wider text-primary">
                {course.code}
              </span>
              <span className="text-xs text-on-surface-variant">Cập nhật thông tin</span>
            </div>
            <h2 id="course-edit-dialog-title" className="mt-1 font-display text-2xl font-bold text-on-surface">
              Chỉnh sửa khóa học
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="grid h-10 w-10 place-items-center rounded-xl border border-outline-variant/50 text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-error/30 bg-error-container/20 p-3.5 text-sm font-semibold text-error">
            <WarningCircle size={20} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Tên khóa học */}
          <Field label="Tên khóa học *">
            <input
              required
              value={form.name}
              onChange={(e) => field("name")(e.target.value)}
              placeholder="VD: IELTS Master Speaking & Writing"
            />
          </Field>

          {/* Mã khóa học - Read-only */}
          <div>
            <label className="text-sm font-bold text-on-surface-variant">
              Mã khóa học <span className="text-xs font-normal text-outline">(Cố định)</span>
            </label>
            <div className="mt-1.5 flex min-h-11 items-center justify-between rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 text-sm font-semibold text-on-surface-variant">
              <span>{course.code}</span>
              <span className="inline-flex items-center gap-1 text-xs text-outline">
                <Lock size={14} /> Không thể đổi
              </span>
            </div>
          </div>

          {/* Cặp kỹ năng - Read-only */}
          <div>
            <label className="text-sm font-bold text-on-surface-variant">
              Cặp kỹ năng <span className="text-xs font-normal text-outline">(Cố định)</span>
            </label>
            <div className="mt-1.5 flex min-h-11 items-center justify-between rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 text-sm font-semibold text-on-surface-variant">
              <span>{skillPairLabel[course.skillPair]}</span>
              <span className="inline-flex items-center gap-1 text-xs text-outline">
                <Lock size={14} /> Theo học liệu
              </span>
            </div>
          </div>

          {/* Trạng thái lớp học */}
          <Field label="Trạng thái đào tạo *">
            <select
              value={form.status}
              onChange={(e) => field("status")(e.target.value as any)}
            >
              {Object.entries(classStatusLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          {/* Ngày bắt đầu */}
          <Field label="Ngày bắt đầu *">
            <input
              required
              type="date"
              value={form.startsOn}
              onChange={(e) => field("startsOn")(e.target.value)}
            />
          </Field>

          {/* Ngày kết thúc */}
          <Field label="Ngày kết thúc dự kiến">
            <input
              type="date"
              value={form.endsOn}
              onChange={(e) => field("endsOn")(e.target.value)}
            />
          </Field>

          {/* Số session */}
          <Field label="Tổng số buổi học (sessions) *">
            <input
              required
              min="1"
              type="number"
              value={form.totalSessions}
              onChange={(e) => field("totalSessions")(e.target.value)}
            />
          </Field>

          {/* Sĩ số tối đa */}
          <div>
            <label className="text-sm font-bold text-on-surface-variant">
              Sĩ số tối đa *{" "}
              {currentEnrollmentsCount > 0 && (
                <span className="text-xs font-normal text-primary">
                  (Hiện có {currentEnrollmentsCount} học viên)
                </span>
              )}
            </label>
            <span className="mt-1.5 block [&>input]:w-full [&>input]:rounded-xl [&>input]:border-outline-variant/60 [&>input]:bg-surface [&>input]:focus:border-primary [&>input]:focus:ring-primary">
              <input
                required
                min={Math.max(1, currentEnrollmentsCount)}
                type="number"
                value={form.capacity}
                onChange={(e) => field("capacity")(e.target.value)}
              />
            </span>
          </div>

          {/* Band mục tiêu */}
          <Field label="Band mục tiêu (0.0 - 9.0)">
            <input
              min="0"
              max="9"
              step="0.5"
              type="number"
              placeholder="VD: 6.5 hoặc 7.0"
              value={form.targetBand}
              onChange={(e) => field("targetBand")(e.target.value)}
            />
          </Field>

          {/* Học phí */}
          <Field label="Học phí (VND)">
            <input
              min="0"
              type="number"
              placeholder="VD: 6500000"
              value={form.tuitionAmount}
              onChange={(e) => field("tuitionAmount")(e.target.value)}
            />
          </Field>

          {/* Link Zoom mặc định */}
          <Field label="Link phòng học trực tuyến (Zoom / Meet)">
            <input
              type="url"
              placeholder="https://zoom.us/j/..."
              value={form.defaultZoomUrl}
              onChange={(e) => field("defaultZoomUrl")(e.target.value)}
            />
          </Field>

          {/* Trình độ */}
          <Field label="Trình độ khuyến nghị">
            <input
              placeholder="VD: Foundation, Intermediate, Band 6.5+"
              value={form.level}
              onChange={(e) => field("level")(e.target.value)}
            />
          </Field>

          {/* Hiển thị công khai */}
          <div className="sm:col-span-2 flex items-center justify-between rounded-xl border border-outline-variant/40 bg-surface-container-low/50 p-4">
            <div>
              <strong className="block text-sm font-bold text-on-surface">Hiển thị tuyển sinh công khai</strong>
              <span className="text-xs text-on-surface-variant">
                Cho phép học viên nhìn thấy khóa học này trên hệ thống Student Hub và danh mục gợi ý.
              </span>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => field("isPublic")(e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-outline-variant/60 peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
          </div>

          {/* Mô tả */}
          <label className="sm:col-span-2 text-sm font-bold text-on-surface-variant">
            Mô tả chi tiết khóa học
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => field("description")(e.target.value)}
              placeholder="Thông tin giới thiệu, định hướng nội dung và tài liệu giảng dạy..."
              className="mt-1.5 w-full rounded-xl border-outline-variant/60 bg-surface focus:border-primary focus:ring-primary text-sm p-3"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-outline-variant/30 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-h-11 rounded-xl border border-outline-variant/60 px-5 text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="min-h-11 rounded-xl bg-primary px-6 text-sm font-bold text-on-primary hover:bg-on-primary-container transition-colors disabled:opacity-60"
          >
            {saving ? "Đang lưu thay đổi..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <label className="text-sm font-bold text-on-surface-variant">
      {label}
      <span className="mt-1.5 block [&>input]:w-full [&>input]:rounded-xl [&>input]:border-outline-variant/60 [&>input]:bg-surface [&>input]:focus:border-primary [&>input]:focus:ring-primary [&>select]:w-full [&>select]:rounded-xl [&>select]:border-outline-variant/60 [&>select]:bg-surface [&>select]:focus:border-primary [&>select]:focus:ring-primary">
        {children}
      </span>
    </label>
  );
}
