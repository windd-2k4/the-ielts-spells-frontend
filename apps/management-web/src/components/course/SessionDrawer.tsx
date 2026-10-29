import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarBlank,
  Check,
  Clock,
  Exam,
  FolderOpen,
  Info,
  NotePencil,
  Plus,
  Sparkle,
  SpinnerGap,
  Trash,
  User,
  VideoCamera,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import type { SessionStatus, SkillPair, TeacherOption } from "../../academic-types";
import type { ItemDraft, SessionDraft } from "./CourseSchedule";
import { CONTENT_SUGGESTIONS } from "./ScheduleSetupModal";

interface SessionDrawerProps {
  draft: SessionDraft;
  editingId: string | null;
  drawerMode: "SESSION" | "TEST";
  skillPair: SkillPair;
  teachers: TeacherOption[];
  canAssignTeacher: boolean;
  primaryTeacherId: string;
  saving: boolean;
  error: string;
  confirmDelete: boolean;
  shiftFollowing: boolean;
  onClose: () => void;
  onPatchDraft: (patch: Partial<SessionDraft>) => void;
  onApplyRoadmap: () => void;
  onOpenLibrary: (kind?: "ALL" | "MATERIAL" | "TEST") => void;
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
  canAssignTeacher,
  primaryTeacherId,
  saving,
  error,
  confirmDelete,
  shiftFollowing,
  onClose,
  onPatchDraft,
  onApplyRoadmap,
  onOpenLibrary,
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

  const [activeTab, setActiveTab] = useState<"SCHEDULE" | "CONTENT">("SCHEDULE");

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const titleText = isEditing
    ? isTest
      ? "Chỉnh sửa mini test"
      : `Chỉnh sửa buổi học #${draft.sessionNo.padStart(2, "0")}`
    : isTest
      ? "Thêm mini test mới"
      : "Thêm buổi học mới";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex flex-col w-full max-w-3xl lg:max-w-4xl max-h-[90vh] rounded-2xl border border-outline-variant/30 bg-surface shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Accent Line */}
        <div className={`h-1.5 w-full ${isTest ? "bg-amber-500" : "bg-primary"}`} />

        {/* Modal Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-outline-variant/20 bg-surface/95 px-5 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isTest
                  ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                  : "bg-primary/10 text-primary dark:bg-primary/20"
              }`}
            >
              {isTest ? <Exam size={22} weight="duotone" /> : <BookOpen size={22} weight="duotone" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg sm:text-xl font-extrabold text-on-surface">
                  {titleText}
                </h2>
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                    isTest
                      ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300"
                      : "bg-primary/15 text-primary"
                  }`}
                >
                  {isTest ? "Mini Test" : isEditing ? `Session ${draft.sessionNo}` : "Buổi học mới"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isTest && (
              <button
                type="button"
                onClick={onApplyRoadmap}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 transition"
                title="Tự động điền tên buổi và nội dung mẫu theo số thứ tự buổi"
              >
                <Sparkle size={14} weight="fill" className="text-amber-500" />
                Áp dụng lộ trình mẫu
              </button>
            )}

            <button
              type="button"
              aria-label="Đóng"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant/40 text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-outline-variant/20 bg-surface-container-lowest/60 px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("SCHEDULE")}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              activeTab === "SCHEDULE"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <CalendarBlank size={16} weight={activeTab === "SCHEDULE" ? "bold" : "regular"} />
            <span>{isTest ? "1. Lịch thi & Phân công" : "1. Lịch học & Phòng học"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CONTENT")}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              activeTab === "CONTENT"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <NotePencil size={16} weight={activeTab === "CONTENT" ? "bold" : "regular"} />
            <span>{isTest ? "2. Đề thi & Học liệu" : "2. Giáo án & Học liệu"}</span>
            {draft.items.length > 0 && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-black text-primary">
                {draft.items.length}
              </span>
            )}
          </button>

          {!isTest && (
            <div className="ml-auto sm:hidden">
              <button
                type="button"
                onClick={onApplyRoadmap}
                className="flex items-center gap-1 rounded-lg border border-primary/30 px-2 py-1 text-[11px] font-bold text-primary"
              >
                <Sparkle size={12} weight="fill" className="text-amber-500" />
                Lộ trình mẫu
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {/* Global Error Banner */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-rose-900 shadow-xs dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
              <WarningCircle className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" size={18} weight="fill" />
              <div className="text-xs font-semibold leading-relaxed">{error}</div>
            </div>
          )}

          {/* TAB 1: SCHEDULE & CLASSROOM */}
          {activeTab === "SCHEDULE" && (
            <div className="space-y-4">
              {/* Basic Session Info */}
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold text-on-surface">
                  <Info size={16} className="text-primary" weight="bold" />
                  <span>Thông tin cơ bản</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {!isTest ? (
                    <>
                      <Field label="Buổi số">
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

                      <Field label="Giai đoạn học tập">
                        <input
                          type="text"
                          value={draft.phaseName}
                          onChange={(e) => onPatchDraft({ phaseName: e.target.value })}
                          placeholder="Ví dụ: Giai đoạn 1"
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Tên hiển thị">
                        <input
                          type="text"
                          readOnly
                          value={`Session ${draft.sessionNo || "-"}`}
                          className={`${inputClass} bg-surface-container-low/70 font-bold text-on-surface-variant cursor-not-allowed`}
                        />
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field label="Tên bài kiểm tra *" wide>
                        <input
                          type="text"
                          value={draft.title}
                          onChange={(e) => onPatchDraft({ title: e.target.value })}
                          placeholder="Nhập tên mini test..."
                          className={`${inputClass} font-bold`}
                        />
                      </Field>

                      <Field label="Giai đoạn">
                        <input
                          type="text"
                          value={draft.phaseName}
                          onChange={(e) => onPatchDraft({ phaseName: e.target.value })}
                          placeholder="Ví dụ: Giai đoạn 1"
                          className={inputClass}
                        />
                      </Field>
                    </>
                  )}
                </div>
              </div>

              {/* Schedule & Time */}
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                    <CalendarBlank size={16} className="text-primary" weight="bold" />
                    <span>Thời gian học</span>
                  </div>
                  {duration && (
                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-extrabold text-primary">
                      <Clock size={13} weight="bold" />
                      Thời lượng: {duration}
                    </span>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
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
                </div>
              </div>

              {/* Teacher & Status */}
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold text-on-surface">
                  <User size={16} className="text-primary" weight="bold" />
                  <span>Phân công giảng dạy & Trạng thái</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Giáo viên phụ trách">
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-3 text-on-surface-variant/60" />
                      <select
                        value={draft.teacherId}
                        onChange={(e) => onPatchDraft({ teacherId: e.target.value })}
                        disabled={!canAssignTeacher}
                        className={`${inputClass} pl-9 font-medium`}
                      >
                        <option value="">Chưa phân công</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.fullName} ({teacher.email})
                            {teacher.id === primaryTeacherId ? " - Giáo viên chính" : " - Dạy thay"}
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
                      <option value="SCHEDULED">Đã lên lịch</option>
                      <option value="COMPLETED">Đã hoàn thành</option>
                      <option value="CANCELLED">Đã hủy</option>
                    </select>
                  </Field>
                </div>
              </div>

              {/* Online Classroom (Zoom) & Internal Notes */}
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold text-on-surface">
                  <VideoCamera size={16} className="text-primary" weight="bold" />
                  <span>Phòng học trực tuyến & Ghi chú</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Đường dẫn Zoom (Zoom URL)">
                    <div className="relative">
                      <VideoCamera size={16} className="absolute left-3 top-3 text-blue-600" />
                      <input
                        type="url"
                        value={draft.zoomUrl}
                        onChange={(e) => onPatchDraft({ zoomUrl: e.target.value })}
                        placeholder="https://zoom.us/j/123456789"
                        className={`${inputClass} pl-9`}
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
                      placeholder="Lưu ý riêng cho giáo viên hoặc quản trị..."
                      className={inputClass}
                    />
                  </Field>

                  {/* Shift following schedule option when editing */}
                  {isEditing && (
                    <div className="sm:col-span-2 rounded-xl border border-amber-200/70 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={shiftFollowing}
                          onChange={(e) => onSetShiftFollowing(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500 accent-amber-600"
                        />
                        <div>
                          <strong className="block text-xs font-bold text-amber-950 dark:text-amber-200">
                            Dời các buổi phía sau khi đổi lịch
                          </strong>
                          <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                            Tự động tịnh tiến các buổi tiếp theo theo lịch tuần nếu buổi này bị dời ngày.
                          </span>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LESSON CONTENT & MATERIALS */}
          {activeTab === "CONTENT" && (
            <div className="space-y-4">
              {/* Teaching Content Focus */}
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                    <BookOpen size={16} className="text-primary" weight="bold" />
                    <span>Nội dung / Trọng tâm bài học</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Active Chips */}
                  <div className="flex flex-wrap gap-1.5 min-h-[38px] rounded-xl border border-outline-variant/30 bg-surface-container-low/40 p-2.5">
                    {contentChips.length === 0 ? (
                      <span className="text-xs text-on-surface-variant/60 italic py-1 px-1">
                        Chưa chọn nội dung nào. Chọn gợi ý nhanh bên dưới hoặc tự nhập.
                      </span>
                    ) : (
                      contentChips.map((item: string) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-bold text-primary shadow-xs"
                        >
                          {item}
                          <button
                            type="button"
                            onClick={() =>
                              onPatchDraft({
                                content: contentChips.filter((v: string) => v !== item).join("\n"),
                              })
                            }
                            aria-label={`Bỏ nội dung ${item}`}
                            className="rounded-full p-0.5 hover:bg-primary/20 transition cursor-pointer"
                          >
                            <X size={12} weight="bold" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Quick Select Suggestions */}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
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
                        className={`${inputClass} text-xs font-medium cursor-pointer`}
                      >
                        <option value="">+ Chọn nhanh từ ngân hàng gợi ý...</option>
                        {CONTENT_SUGGESTIONS[skillPair].map((suggestion) => (
                          <option key={suggestion} value={suggestion}>
                            {suggestion}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="text-xs text-on-surface-variant/70 flex items-center">
                      <span>Hoặc nhập tự do bên dưới (mỗi ý một dòng)</span>
                    </div>
                  </div>

                  {/* Manual multiline */}
                  <textarea
                    rows={2}
                    value={draft.content}
                    onChange={(e) => onPatchDraft({ content: e.target.value })}
                    placeholder="Ví dụ: Listening: Multiple Choice&#10;Reading: Matching Headings"
                    className={`${inputClass} text-xs`}
                  />
                </div>
              </div>

              {/* Attached Materials & Exercises */}
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                    <NotePencil size={16} className="text-primary" weight="bold" />
                    <span>Học liệu & Bài tập buổi học ({draft.items.length})</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenLibrary("TEST")}
                      className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition cursor-pointer dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-700/50"
                      title="Chọn đề thi từ Ngân hàng đề làm bài tập buổi học"
                    >
                      <Exam size={14} weight="bold" />
                      + Giao bài từ Ngân hàng đề
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenLibrary("MATERIAL")}
                      className="flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-50 px-2.5 py-1.5 text-xs font-bold text-sky-900 hover:bg-sky-100 transition cursor-pointer dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-700/50"
                      title="Chọn tài liệu tham khảo từ Kho học liệu"
                    >
                      <FolderOpen size={14} weight="bold" />
                      + Đính kèm từ Kho học liệu
                    </button>
                  </div>
                </div>

                {draft.items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-outline-variant/60 py-6 px-4 text-center">
                    <FolderOpen size={30} className="mx-auto text-outline/50 mb-1.5" />
                    <p className="text-xs font-bold text-on-surface">
                      Chưa có bài tập hoặc tài liệu nào cho buổi này
                    </p>
                    <p className="text-[11px] text-on-surface-variant/70 mt-0.5">
                      Khóa học {skillPair === "LISTENING_READING" ? "Listening & Reading (LR)" : "Speaking & Writing (WS)"} · Hệ thống sẽ tự động lọc đề thi và tài liệu phù hợp.
                    </p>

                    <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenLibrary("TEST")}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition cursor-pointer shadow-2xs"
                      >
                        <Exam size={13} weight="bold" />
                        Giao bài từ Ngân hàng đề
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenLibrary("MATERIAL")}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-surface border border-outline-variant/60 px-3 py-1.5 text-xs font-bold text-on-surface hover:bg-surface-container transition cursor-pointer"
                      >
                        <FolderOpen size={13} weight="bold" />
                        Đính kèm từ Kho học liệu
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* SECTION 1: HOMEWORK ASSIGNMENTS FROM TEST BANK */}
                    {draft.items.some(item => item.itemType !== "MATERIAL") && (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                          <Exam size={14} weight="bold" />
                          <span>
                            Bài tập về nhà / Đề luyện tập ({draft.items.filter(item => item.itemType !== "MATERIAL").length})
                          </span>
                        </div>

                        {draft.items.map((item: ItemDraft, index: number) => {
                          if (item.itemType === "MATERIAL") return null;

                          return (
                            <div
                              key={item.id ?? index}
                              className="rounded-xl border border-amber-300/60 bg-amber-50/30 p-3.5 transition hover:border-amber-400 dark:border-amber-800/50 dark:bg-amber-950/20"
                            >
                              <div className="mb-2.5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300">
                                    {item.itemType === "TEST" ? "BÀI KIỂM TRA" : "BÀI TẬP VỀ NHÀ"} #{String(index + 1).padStart(2, "0")}
                                  </span>
                                  {item.sourceTestId && (
                                    <span className="text-[10px] font-bold text-amber-800/80 dark:text-amber-300/80">
                                      Từ Ngân hàng đề
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  aria-label="Xóa bài"
                                  onClick={() => onRemoveItem(index)}
                                  className="rounded-lg p-1 text-rose-600 hover:bg-rose-50 transition cursor-pointer dark:hover:bg-rose-950/30"
                                >
                                  <Trash size={15} weight="bold" />
                                </button>
                              </div>

                              <div className="grid gap-2.5 sm:grid-cols-2">
                                <Field label="Tên bài tập *">
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => onPatchItem(index, { title: e.target.value })}
                                    placeholder="Tên bài..."
                                    className={`${inputClass} font-semibold text-xs`}
                                  />
                                </Field>

                                <Field label="Hạn nộp (Deadline) *">
                                  <input
                                    type="datetime-local"
                                    value={item.deadlineAt}
                                    onChange={(e) => onPatchItem(index, { deadlineAt: e.target.value })}
                                    className={`${inputClass} font-semibold text-xs`}
                                  />
                                </Field>

                                <Field label="Hướng dẫn / Yêu cầu làm bài" wide>
                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => onPatchItem(index, { description: e.target.value })}
                                    placeholder="Hướng dẫn làm bài hoặc dặn dò cho học viên..."
                                    className={`${inputClass} text-xs`}
                                  />
                                </Field>

                                <div className="flex items-center gap-4 sm:col-span-2 pt-1 text-xs">
                                  <label className="flex items-center gap-1.5 cursor-pointer font-bold select-none text-on-surface">
                                    <input
                                      type="checkbox"
                                      checked={item.required}
                                      onChange={(e) => onPatchItem(index, { required: e.target.checked })}
                                      className="rounded border-outline text-primary focus:ring-primary accent-primary"
                                    />
                                    Bắt buộc hoàn thành
                                  </label>

                                  <div className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                                    <span>Hiển thị:</span>
                                    <select
                                      value={item.visibility}
                                      onChange={(e) =>
                                        onPatchItem(index, { visibility: e.target.value as "STUDENT" | "TEACHER" })
                                      }
                                      className="rounded-lg border border-outline-variant/40 bg-surface px-2 py-1 text-xs text-on-surface"
                                    >
                                      <option value="STUDENT">Học viên & Giáo viên</option>
                                      <option value="TEACHER">Chỉ Giáo viên</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* SECTION 2: LEARNING MATERIALS FROM LEARNING RESOURCE */}
                    {draft.items.some(item => item.itemType === "MATERIAL") && (
                      <div className="space-y-2.5 pt-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                          <FolderOpen size={14} weight="bold" />
                          <span>
                            Tài liệu học tập ({draft.items.filter(item => item.itemType === "MATERIAL").length})
                          </span>
                        </div>

                        {draft.items.map((item: ItemDraft, index: number) => {
                          if (item.itemType !== "MATERIAL") return null;

                          return (
                            <div
                              key={item.id ?? index}
                              className="rounded-xl border border-sky-300/60 bg-sky-50/30 p-3.5 transition hover:border-sky-400 dark:border-sky-800/50 dark:bg-sky-950/20"
                            >
                              <div className="mb-2.5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-300">
                                    TÀI LIỆU HỌC TẬP #{String(index + 1).padStart(2, "0")}
                                  </span>
                                  {item.sourceResourceId && (
                                    <span className="text-[10px] font-bold text-sky-800/80 dark:text-sky-300/80">
                                      Từ Kho học liệu
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  aria-label="Xóa tài liệu"
                                  onClick={() => onRemoveItem(index)}
                                  className="rounded-lg p-1 text-rose-600 hover:bg-rose-50 transition cursor-pointer dark:hover:bg-rose-950/30"
                                >
                                  <Trash size={15} weight="bold" />
                                </button>
                              </div>

                              <div className="grid gap-2.5 sm:grid-cols-2">
                                <Field label="Tên tài liệu *">
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => onPatchItem(index, { title: e.target.value })}
                                    placeholder="Tên tài liệu..."
                                    className={`${inputClass} font-semibold text-xs`}
                                  />
                                </Field>

                                <Field label="Ngày nhắc đọc / hiển thị (không bắt buộc)">
                                  <input
                                    type="datetime-local"
                                    value={item.deadlineAt}
                                    onChange={(e) => onPatchItem(index, { deadlineAt: e.target.value })}
                                    className={`${inputClass} font-semibold text-xs`}
                                  />
                                </Field>

                                <Field label="Mô tả / Lưu ý" wide>
                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => onPatchItem(index, { description: e.target.value })}
                                    placeholder="Ghi chú hướng dẫn đọc tài liệu cho học viên..."
                                    className={`${inputClass} text-xs`}
                                  />
                                </Field>

                                <div className="flex items-center gap-4 sm:col-span-2 pt-1 text-xs">
                                  <div className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                                    <span>Đối tượng xem:</span>
                                    <select
                                      value={item.visibility}
                                      onChange={(e) =>
                                        onPatchItem(index, { visibility: e.target.value as "STUDENT" | "TEACHER" })
                                      }
                                      className="rounded-lg border border-outline-variant/40 bg-surface px-2 py-1 text-xs text-on-surface"
                                    >
                                      <option value="STUDENT">Học viên & Giáo viên</option>
                                      <option value="TEACHER">Chỉ Giáo viên</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Sticky Footer */}
        <footer className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/20 bg-surface/95 px-5 py-3 backdrop-blur-md">
          <div>
            {isEditing &&
              (confirmDelete ? (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-1 dark:bg-rose-950/40 dark:border-rose-900/50">
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-300 pl-2">
                    Xác nhận xóa?
                  </span>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void onRemoveSession()}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-rose-700 transition cursor-pointer"
                  >
                    Xóa ngay
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetConfirmDelete(false)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onSetConfirmDelete(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-xs font-extrabold text-rose-600 hover:bg-rose-50 transition cursor-pointer dark:border-rose-900/40 dark:hover:bg-rose-950/30"
                >
                  <Trash size={15} weight="bold" />
                  Xóa {isTest ? "mini test" : "buổi học"}
                </button>
              ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-outline-variant/50 px-4 py-2 text-xs sm:text-sm font-bold text-on-surface-variant hover:bg-surface-container transition cursor-pointer"
            >
              Hủy
            </button>

            {/* Next / Previous Tab helpers for convenience */}
            {activeTab === "SCHEDULE" ? (
              <button
                type="button"
                onClick={() => setActiveTab("CONTENT")}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/60 px-3.5 py-2 text-xs font-bold text-on-surface hover:bg-surface-container transition cursor-pointer"
              >
                <span>Nội dung & Học liệu</span>
                <ArrowRight size={13} weight="bold" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab("SCHEDULE")}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/60 px-3.5 py-2 text-xs font-bold text-on-surface hover:bg-surface-container transition cursor-pointer"
              >
                <ArrowLeft size={13} weight="bold" />
                <span>Lịch học</span>
              </button>
            )}

            <button
              type="button"
              disabled={saving}
              onClick={() => void onSave()}
              className={`flex min-w-32 items-center justify-center gap-1.5 rounded-xl px-5 py-2 text-xs sm:text-sm font-extrabold text-white transition hover:brightness-95 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm ${
                isTest ? "bg-amber-600 hover:bg-amber-700" : "bg-primary hover:bg-primary/90"
              }`}
            >
              {saving ? <SpinnerGap className="animate-spin" size={16} /> : <Check size={16} weight="bold" />}
              <span>
                {saving
                  ? "Đang lưu..."
                  : isTest
                    ? isEditing
                      ? "Cập nhật Mini Test"
                      : "Tạo Mini Test"
                    : isEditing
                      ? "Cập nhật Buổi học"
                      : "Tạo Buổi học"}
              </span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-outline-variant/50 bg-surface px-3 py-2 text-xs sm:text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-surface-container-lowest";

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      {children}
    </label>
  );
}
