import type { ReactNode } from "react";
import {
  BookOpen, CalendarBlank, Check, Clock, Exam, Info,
  NotePencil, Plus, Sparkle, SpinnerGap, Trash, VideoCamera,
  WarningCircle, X, User
} from "@phosphor-icons/react";
import type {
  SessionItemType, SessionStatus, SkillPair, TeacherOption
} from "../../academic-types";
import type { ItemDraft, SessionDraft } from "./CourseSchedule";
import { CONTENT_SUGGESTIONS } from "./ScheduleSetupModal";

interface SessionDrawerProps {
  draft: SessionDraft;
  editingId: string | null;
  drawerMode: "SESSION" | "TEST";
  skillPair: SkillPair;
  teachers: TeacherOption[];
  saving: boolean;
  error: string;
  confirmDelete: boolean;
  shiftFollowing: boolean;
  onClose: () => void;
  onPatchDraft: (patch: Partial<SessionDraft>) => void;
  onApplyRoadmap: () => void;
  onAddItem: (type: SessionItemType) => void;
  onPatchItem: (index: number, patch: Partial<ItemDraft>) => void;
  onRemoveItem: (index: number) => void;
  onSave: () => void;
  onRemoveSession: () => void;
  onSetConfirmDelete: (value: boolean) => void;
  onSetShiftFollowing: (value: boolean) => void;
}

function getDurationText(startsAt: string, endsAt: string): string | null {
  if (!startsAt || !endsAt) return null;
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return null;
  const diffMinutes = Math.round((end - start) / (1000 * 60));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h${minutes < 10 ? "0" : ""}${minutes}p`;
  if (hours > 0) return `${hours}h00`;
  return `${minutes} phút`;
}

export default function SessionDrawer({
  draft,
  editingId,
  drawerMode,
  skillPair,
  teachers,
  saving,
  error,
  confirmDelete,
  shiftFollowing,
  onClose,
  onPatchDraft,
  onApplyRoadmap,
  onAddItem,
  onPatchItem,
  onRemoveItem,
  onSave,
  onRemoveSession,
  onSetConfirmDelete,
  onSetShiftFollowing,
}: SessionDrawerProps) {
  const isTest = drawerMode === "TEST";
  const isEditing = Boolean(editingId);
  const duration = getDurationText(draft.startsAt, draft.endsAt);
  const contentChips = draft.content.split("\n").filter(Boolean);

  const titleText = isEditing
    ? (isTest ? "Chỉnh sửa mini test" : `Chỉnh sửa buổi học #${draft.sessionNo.padStart(2, "0")}`)
    : (isTest ? "Thêm mini test mới" : "Thêm buổi học mới");

  const subtitleText = isTest
    ? "Cấu hình mốc kiểm tra độc lập và đặt deadline đánh giá"
    : "Lên lịch học, phân công giảng dạy và giao bài tập kèm theo";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-sm transition-opacity duration-200"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <aside className="relative flex h-full w-full max-w-2xl flex-col border-l border-outline-variant/30 bg-surface shadow-2xl transition-transform duration-300 sm:max-w-3xl">
        {/* Visual Top Accent Line */}
        <div
          className={`h-1.5 w-full ${
            isTest
              ? "bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500"
              : "bg-gradient-to-r from-primary via-indigo-600 to-violet-600"
          }`}
        />

        {/* Drawer Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-outline-variant/30 bg-surface/95 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                isTest
                  ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                  : "bg-primary/10 text-primary dark:bg-primary/20"
              }`}
            >
              {isTest ? <Exam size={24} weight="duotone" /> : <BookOpen size={24} weight="duotone" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                    isTest
                      ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300"
                      : "bg-primary/15 text-primary"
                  }`}
                >
                  {isTest ? "Mini Test" : "Lịch học"}
                </span>
                {isEditing && (
                  <span className="rounded bg-surface-container-high px-1.5 py-0.5 text-[10px] font-semibold text-on-surface-variant">
                    {isTest ? draft.title || "Mini Test" : `Session ${draft.sessionNo}`}
                  </span>
                )}
              </div>
              <h2 className="font-display text-xl font-extrabold text-on-surface">{titleText}</h2>
              <p className="text-xs text-on-surface-variant">{subtitleText}</p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant/40 text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
          >
            <X size={18} weight="bold" />
          </button>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Global Error Banner */}
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-rose-900 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
              <WarningCircle className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" size={20} weight="fill" />
              <div className="text-sm font-semibold leading-relaxed">{error}</div>
            </div>
          )}

          {/* Header Mode Banner */}
          <div
            className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${
              isTest
                ? "border-amber-300/70 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent text-amber-950 dark:border-amber-700/50 dark:text-amber-100"
                : "border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent text-on-surface"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    isTest ? "bg-amber-500 text-white" : "bg-primary text-on-primary"
                  }`}
                >
                  {isTest ? <Exam size={18} weight="bold" /> : <BookOpen size={18} weight="bold" />}
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider opacity-70">Phân loại</p>
                  <p className="text-sm font-black">
                    {isTest ? "Mini test đánh giá độc lập" : "Buổi học chính thức trong khóa"}
                  </p>
                </div>
              </div>

              {!isTest && (
                <button
                  type="button"
                  onClick={onApplyRoadmap}
                  className="flex items-center gap-1.5 rounded-xl border border-primary/40 bg-surface px-3 py-2 text-xs font-bold text-primary shadow-sm hover:bg-primary/10 transition"
                >
                  <Sparkle size={16} weight="fill" className="text-amber-500" />
                  Áp dụng lộ trình mẫu
                </button>
              )}

              {isEditing && (
                <span className="text-[11px] font-semibold text-on-surface-variant/80">
                  🔒 Loại lịch cố định sau khi tạo
                </span>
              )}
            </div>
          </div>

          {/* Section 1: Basic Information Card */}
          <Card title="1. Thông tin chung" icon={<Info size={18} weight="bold" className="text-primary" />}>
            <div className="grid gap-4 sm:grid-cols-2">
              {!isTest && (
                <Field label="Số thứ tự buổi">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-black text-primary">#</span>
                    <input
                      type="number"
                      min={1}
                      value={draft.sessionNo}
                      onChange={(e) => onPatchDraft({ sessionNo: e.target.value })}
                      className={`${inputClass} pl-7 font-bold`}
                      placeholder="1"
                    />
                  </div>
                </Field>
              )}

              <Field label="Giai đoạn học tập">
                <input
                  type="text"
                  value={draft.phaseName}
                  onChange={(e) => onPatchDraft({ phaseName: e.target.value })}
                  placeholder="Ví dụ: Giai đoạn 1 · Nắm vững chiến thuật"
                  className={inputClass}
                />
              </Field>

              <Field label={isTest ? "Tên mini test *" : "Tên hiển thị buổi học"} wide>
                {isTest ? (
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(e) => onPatchDraft({ title: e.target.value })}
                    placeholder="Nhập tên mini test..."
                    className={`${inputClass} font-bold`}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`Session ${draft.sessionNo || "-"}`}
                      className={`${inputClass} bg-surface-container-low/70 font-bold text-on-surface-variant cursor-not-allowed`}
                    />
                    <span className="shrink-0 text-xs font-semibold text-on-surface-variant/70">
                      (Tự động)
                    </span>
                  </div>
                )}
              </Field>
            </div>
          </Card>

          {/* Section 2: Schedule & Instructor */}
          <Card
            title="2. Thời gian & Phân công"
            icon={<CalendarBlank size={18} weight="bold" className="text-primary" />}
            headerBadge={
              duration && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-extrabold text-primary">
                  <Clock size={14} weight="bold" />
                  Thời lượng: {duration}
                </span>
              )
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Thời gian bắt đầu *">
                <input
                  type="datetime-local"
                  value={draft.startsAt}
                  onChange={(e) => onPatchDraft({ startsAt: e.target.value })}
                  className={`${inputClass} font-semibold`}
                />
              </Field>

              <Field label="Thời gian kết thúc *">
                <input
                  type="datetime-local"
                  value={draft.endsAt}
                  onChange={(e) => onPatchDraft({ endsAt: e.target.value })}
                  className={`${inputClass} font-semibold`}
                />
              </Field>

              <Field label="Giáo viên phụ trách">
                <div className="relative">
                  <User size={18} className="absolute left-3 top-3 text-on-surface-variant/60" />
                  <select
                    value={draft.teacherId}
                    onChange={(e) => onPatchDraft({ teacherId: e.target.value })}
                    className={`${inputClass} pl-10`}
                  >
                    <option value="">-- Chưa phân công --</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.fullName} ({teacher.email})
                      </option>
                    ))}
                  </select>
                </div>
              </Field>

              <Field label="Trạng thái buổi học">
                <select
                  value={draft.status}
                  onChange={(e) => onPatchDraft({ status: e.target.value as SessionStatus })}
                  className={`${inputClass} font-semibold`}
                >
                  <option value="SCHEDULED">📅 Đã lên lịch (SCHEDULED)</option>
                  <option value="COMPLETED">✅ Đã hoàn thành (COMPLETED)</option>
                  <option value="CANCELLED">❌ Đã hủy (CANCELLED)</option>
                </select>
              </Field>
            </div>
          </Card>

          {/* Section 3: Teaching Content */}
          <Card title="3. Nội dung bài học" icon={<BookOpen size={18} weight="bold" className="text-primary" />}>
            <div className="space-y-3">
              {/* Content Chips */}
              <div className="flex flex-wrap gap-2 min-h-[38px] rounded-xl border border-outline-variant/30 bg-surface-container-low/30 p-2.5">
                {contentChips.length === 0 ? (
                  <span className="text-xs font-medium text-on-surface-variant/60 italic py-1 px-1">
                    Chưa chọn nội dung nào. Vui lòng chọn gợi ý hoặc nhập tự do phía dưới.
                  </span>
                ) : (
                  contentChips.map((item: string) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-bold text-primary shadow-xs"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() =>
                          onPatchDraft({
                            content: contentChips.filter((v: string) => v !== item).join("\n"),
                          })
                        }
                        className="rounded-full p-0.5 hover:bg-primary/20 transition"
                      >
                        <X size={12} weight="bold" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Suggestions dropdown */}
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value && !contentChips.includes(e.target.value)) {
                      onPatchDraft({
                        content: [...contentChips, e.target.value].join("\n"),
                      });
                    }
                    e.target.value = "";
                  }}
                  className={inputClass}
                >
                  <option value="">+ Chọn nhanh nội dung từ ngân hàng gợi ý...</option>
                  {CONTENT_SUGGESTIONS[skillPair].map((suggestion) => (
                    <option key={suggestion} value={suggestion}>
                      {suggestion}
                    </option>
                  ))}
                </select>
              </div>

              {/* Multiline input */}
              <Field label="Hoặc tự nhập nội dung (mỗi ý trên một dòng)">
                <textarea
                  rows={2}
                  value={draft.content}
                  onChange={(e) => onPatchDraft({ content: e.target.value })}
                  placeholder="Ví dụ: Listening: Multiple Choice&#10;Reading: Matching Headings"
                  className={inputClass}
                />
              </Field>
            </div>
          </Card>

          {/* Section 4: Zoom & Additional Details */}
          <Card title="4. Phòng Zoom & Ghi chú" icon={<VideoCamera size={18} weight="bold" className="text-primary" />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Đường dẫn Zoom (Zoom URL)">
                <div className="relative">
                  <VideoCamera size={18} className="absolute left-3 top-3 text-blue-600" />
                  <input
                    type="url"
                    value={draft.zoomUrl}
                    onChange={(e) => onPatchDraft({ zoomUrl: e.target.value })}
                    placeholder="https://zoom.us/j/123456789"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </Field>

              <Field label="Zoom Meeting ID">
                <input
                  type="text"
                  value={draft.zoomMeetingId}
                  onChange={(e) => onPatchDraft({ zoomMeetingId: e.target.value })}
                  placeholder="Ví dụ: 890 1234 5678"
                  className={inputClass}
                />
              </Field>

              <Field label="Ghi chú nội bộ" wide>
                <input
                  type="text"
                  value={draft.notes}
                  onChange={(e) => onPatchDraft({ notes: e.target.value })}
                  placeholder="Ghi chú riêng cho giáo viên hoặc tư vấn..."
                  className={inputClass}
                />
              </Field>

              {/* Shift following schedule option when editing */}
              {isEditing && (
                <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={shiftFollowing}
                      onChange={(e) => onSetShiftFollowing(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500 accent-amber-600"
                    />
                    <div>
                      <strong className="block text-sm font-bold text-amber-950 dark:text-amber-200">
                        ⚡ Dời dây chuyền các session phía sau khi đổi lịch
                      </strong>
                      <span className="mt-0.5 block text-xs text-amber-800 dark:text-amber-300/80">
                        Tự động tịnh tiến các buổi chưa diễn ra sang buổi học kế tiếp theo lịch tuần.
                      </span>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </Card>

          {/* Section 5: Assignments & Mini Tests Inside Session */}
          <Card
            title={isTest ? "5. Đơn vị kiểm tra" : "5. Bài tập đính kèm buổi học"}
            icon={isTest ? <Exam size={18} weight="bold" className="text-amber-600" /> : <NotePencil size={18} weight="bold" className="text-primary" />}
            headerBadge={
              !isTest && (
                <button
                  type="button"
                  disabled={draft.items.length >= 10}
                  onClick={() => onAddItem("ASSIGNMENT")}
                  className="flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/30 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 disabled:opacity-40 transition"
                >
                  <Plus size={14} weight="bold" />
                  Thêm bài tập
                </button>
              )
            }
          >
            <div className="space-y-3">
              {draft.items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-outline-variant/60 py-8 px-4 text-center">
                  <NotePencil size={32} className="mx-auto text-outline/40 mb-2" />
                  <p className="text-sm font-semibold text-on-surface-variant">
                    {isTest ? "Bài test độc lập chưa có mô tả đính kèm." : "Chưa có bài tập nào cho buổi học này."}
                  </p>
                  <p className="text-xs text-on-surface-variant/70 mt-0.5">
                    {isTest
                      ? "Bạn có thể để mặc định hoặc nhập yêu cầu kiểm tra chi tiết."
                      : "Thêm tối đa 10 bài tập với deadline tự động (mặc định sau 2 ngày)."}
                  </p>
                </div>
              ) : (
                draft.items.map((item: ItemDraft, index: number) => (
                  <div
                    key={item.id ?? index}
                    className="relative rounded-2xl border border-outline-variant/40 bg-surface-container-low/40 p-4 transition-all hover:border-outline-variant/70"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${
                          item.itemType === "TEST"
                            ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {item.itemType === "TEST" ? "BÀI TEST" : "BÀI TẬP"} #{String(index + 1).padStart(2, "0")}
                      </span>

                      <button
                        type="button"
                        aria-label="Xóa bài"
                        onClick={() => onRemoveItem(index)}
                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition dark:hover:bg-rose-950/30"
                      >
                        <Trash size={16} weight="bold" />
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Tên bài tập / bài test *">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => onPatchItem(index, { title: e.target.value })}
                          placeholder="Tên bài..."
                          className={`${inputClass} font-semibold`}
                        />
                      </Field>

                      <Field label="Hạn nộp (Deadline)">
                        <input
                          type="datetime-local"
                          value={item.deadlineAt}
                          onChange={(e) => onPatchItem(index, { deadlineAt: e.target.value })}
                          className={`${inputClass} font-semibold`}
                        />
                      </Field>

                      <Field label="Mô tả / Yêu cầu chi tiết" wide>
                        <textarea
                          rows={2}
                          value={item.description}
                          onChange={(e) => onPatchItem(index, { description: e.target.value })}
                          placeholder="Mô tả bài tập, yêu cầu về file nộp hoặc lưu ý cho học viên..."
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Footer Actions */}
        <footer className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/30 bg-surface/95 px-6 py-4 backdrop-blur-md">
          <div>
            {isEditing &&
              (confirmDelete ? (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-1.5 dark:bg-rose-950/40 dark:border-rose-900/50">
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-300 pl-2">
                    Xác nhận xóa?
                  </span>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void onRemoveSession()}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-rose-700 transition"
                  >
                    Xóa ngay
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetConfirmDelete(false)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onSetConfirmDelete(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-3.5 py-2 text-xs font-extrabold text-rose-600 hover:bg-rose-50 transition dark:border-rose-900/40 dark:hover:bg-rose-950/30"
                >
                  <Trash size={16} weight="bold" />
                  Xóa {isTest ? "mini test" : "buổi học"}
                </button>
              ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-outline-variant/50 px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container transition"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void onSave()}
              className={`flex min-w-36 items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:brightness-105 active:scale-[0.98] disabled:opacity-50 ${
                isTest
                  ? "bg-gradient-to-r from-amber-500 to-orange-600"
                  : "bg-gradient-to-r from-primary via-indigo-600 to-violet-600"
              }`}
            >
              {saving ? (
                <SpinnerGap className="animate-spin" size={18} />
              ) : (
                <Check size={18} weight="bold" />
              )}
              {saving ? "Đang lưu..." : isTest ? (isEditing ? "Cập nhật Mini Test" : "Tạo Mini Test") : (isEditing ? "Cập nhật Buổi học" : "Tạo Buổi học")}
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-outline-variant/50 bg-surface px-3.5 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-surface-container-lowest";

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      {children}
    </label>
  );
}

function Card({
  title,
  icon,
  headerBadge,
  children,
}: {
  title: string;
  icon: ReactNode;
  headerBadge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest/80 p-5 shadow-xs transition-all hover:border-outline-variant/60">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-display text-base font-extrabold text-on-surface">{title}</h3>
        </div>
        {headerBadge}
      </div>
      {children}
    </section>
  );
}
