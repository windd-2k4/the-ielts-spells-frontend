import { X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import type { Course } from "../../academic-types";
import type {
  ContentLifecycleStatus, LearningResource, LibraryItem, LibraryScope, LibrarySkill, LibraryView, ResourceSourceType, VisibilityPermission,
} from "../../library-types";
import { isResource } from "../../library-types";
import { apiFetch, apiUpload } from "../../lib/api";
import { CATEGORIES, SKILLS } from "./library-config";

type Props = {
  open: boolean;
  view: LibraryView;
  skill: LibrarySkill;
  item: LibraryItem | null;
  courseId?: string;
  courses: Course[];
  onClose: () => void;
  onSaved: () => Promise<void>;
};

export default function LibraryItemModal({
  open, view, skill: initialSkill, item, courseId: defaultCourseId, courses, onClose, onSaved,
}: Props) {
  const [skill, setSkill] = useState<LibrarySkill>(initialSkill);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [scope, setScope] = useState<LibraryScope>(defaultCourseId ? "COURSE" : "GLOBAL");
  const [selectedCourseId, setSelectedCourseId] = useState(defaultCourseId ?? "");
  const [sourceType, setSourceType] = useState<ResourceSourceType>("FILE_UPLOAD");
  const [externalUrl, setExternalUrl] = useState("");
  const [richTextContent, setRichTextContent] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [visibilityPermission, setVisibilityPermission] = useState<VisibilityPermission>("STUDENT_AFTER_ASSIGN");
  const [teacherOnly, setTeacherOnly] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSkill(initialSkill);
    const catOptions = CATEGORIES[initialSkill];
    setCategory(catOptions[0]?.value ?? "PRACTICE_SET");
  }, [initialSkill]);

  useEffect(() => {
    if (!item) {
      setTitle("");
      setScope(defaultCourseId ? "COURSE" : "GLOBAL");
      setSelectedCourseId(defaultCourseId ?? "");
      setSourceType("FILE_UPLOAD");
      setExternalUrl("");
      setRichTextContent("");
      setDescription("");
      setTagsInput("");
      setVisibilityPermission("STUDENT_AFTER_ASSIGN");
      setTeacherOnly(false);
      setSelectedFile(null);
      setError("");
      return;
    }

    setTitle(item.title);
    setSelectedFile(null);
    setSkill(item.skill);
    setCategory(item.category);
    setScope(item.scope);
    setSelectedCourseId(item.courseId ?? "");

    if (isResource(item)) {
      setSourceType(item.sourceType || (item.externalUrl ? "DRIVE_LINK" : "FILE_UPLOAD"));
      setExternalUrl(item.externalUrl ?? "");
      setRichTextContent(item.richTextContent ?? "");
      setDescription(item.description ?? "");
      setTagsInput((item.tags || []).join(", "));
      setVisibilityPermission(item.visibilityPermission || "STUDENT_AFTER_ASSIGN");
      setTeacherOnly(item.teacherOnly);
    } else {
      setDescription(item.instructions ?? "");
    }
  }, [defaultCourseId, item]);

  if (!open) return null;

  async function handleSave(targetStatus: ContentLifecycleStatus) {
    if (!title.trim()) {
      setError("Vui lòng nhập tên học liệu.");
      return;
    }
    if (scope === "COURSE" && !selectedCourseId) {
      setError("Vui lòng chọn khóa học cho học liệu có phạm vi riêng.");
      return;
    }
    if (view === "RESOURCES" && sourceType === "DRIVE_LINK" && !externalUrl.trim()) {
      setError("Vui lòng nhập đường dẫn Google Drive hoặc website.");
      return;
    }
    if (view === "RESOURCES" && sourceType === "FILE_UPLOAD" && !item && !selectedFile) {
      setError("Vui lòng chọn tệp chính cần tải lên.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const endpoint = view === "RESOURCES" ? "resources" : "exercises";
      const path = item ? `/admin/library/${endpoint}/${item.id}` : `/admin/library/${endpoint}`;
      const method = item ? "PUT" : "POST";
      const common = {
        title: title.trim(),
        skill,
        category,
        scope,
        courseId: scope === "COURSE" ? selectedCourseId : null,
        status: targetStatus,
      };
      const payload = view === "RESOURCES"
        ? {
            ...common,
            description: sourceType === "RICH_TEXT"
              ? [description.trim(), richTextContent.trim()].filter(Boolean).join("\n\n")
              : description.trim() || null,
            resourceType: sourceType === "FILE_UPLOAD" ? "FILE" : sourceType === "DRIVE_LINK" ? "LINK" : "ARTICLE",
            externalUrl: sourceType === "DRIVE_LINK" ? externalUrl.trim() : null,
            teacherOnly: teacherOnly || visibilityPermission === "TEACHER_ONLY",
          }
        : {
            ...common,
            instructions: description.trim() || null,
            exerciseType: "PRACTICE",
            completionMode: "MANUAL",
            sourceUrl: sourceType === "DRIVE_LINK" ? externalUrl.trim() : null,
            durationMinutes: null,
            maxScore: null,
            attemptLimit: null,
            requiresTeacherReview: true,
            content: richTextContent.trim() ? { richText: richTextContent.trim(), tags: tagsInput.split(",").map(tag => tag.trim()).filter(Boolean) } : {},
            answerKey: {},
          };
      const saved = await apiFetch<LibraryItem>(path, {
        method,
        body: JSON.stringify(payload),
      });
      if (view === "RESOURCES" && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("fileRole", "MAIN");
        await apiUpload(`/admin/library/resources/${saved.id}/files`, formData);
      }
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu học liệu.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[20px] bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <header className="flex items-center justify-between border-b border-[#e3dce2] px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[#211A1D]">
              {item ? "Chỉnh sửa học liệu" : "Thêm học liệu mới"}
            </h2>
            <p className="text-xs text-[#746A6E]">
              {view === "RESOURCES" ? "Kho tài liệu giảng dạy" : "Kho bài tập mẫu"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-[#746A6E] hover:bg-[#f1eef4]"
          >
            <X size={20} />
          </button>
        </header>

        {/* Modal Form Body */}
        <form className="custom-scrollbar flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-[#b4232d]">
              {error}
            </p>
          )}

          {/* Tên học liệu */}
          <div>
            <label className="block text-xs font-bold text-[#211A1D] mb-1.5">
              Tên học liệu <span className="text-[#b4232d]">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Reading Passage 1 - Matching Headings Practice..."
              className="min-h-[44px] w-full rounded-xl border border-[#e3dce2] px-3.5 text-sm focus:border-[#8f4458] focus:outline-none"
            />
          </div>

          {/* Kỹ năng & Nhóm nội dung */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#211A1D] mb-1.5">Kỹ năng</label>
              <select
                value={skill}
                onChange={(e) => setSkill(e.target.value as LibrarySkill)}
                className="min-h-[44px] w-full rounded-xl border border-[#e3dce2] px-3 text-sm focus:border-[#8f4458] focus:outline-none"
              >
                {SKILLS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#211A1D] mb-1.5">Nhóm nội dung</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[#e3dce2] px-3 text-sm focus:border-[#8f4458] focus:outline-none"
              >
                {(CATEGORIES[skill] || []).map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Phạm vi sử dụng */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#211A1D] mb-1.5">Phạm vi</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as LibraryScope)}
                disabled={!!defaultCourseId}
                className="min-h-[44px] w-full rounded-xl border border-[#e3dce2] px-3 text-sm focus:border-[#8f4458] focus:outline-none disabled:bg-[#f1eef4]"
              >
                <option value="GLOBAL">Dùng chung (Toàn hệ thống)</option>
                <option value="COURSE">Riêng khóa học</option>
              </select>
            </div>

            {scope === "COURSE" && (
              <div>
                <label className="block text-xs font-bold text-[#211A1D] mb-1.5">Chọn Khóa học</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  disabled={!!defaultCourseId}
                  className="min-h-[44px] w-full rounded-xl border border-[#e3dce2] px-3 text-sm focus:border-[#8f4458] focus:outline-none"
                >
                  <option value="">-- Chọn khóa học --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Nguồn học liệu */}
          <div>
            <label className="block text-xs font-bold text-[#211A1D] mb-1.5">Nguồn học liệu</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSourceType("FILE_UPLOAD")}
                className={`min-h-[40px] rounded-xl border text-xs font-bold transition ${
                  sourceType === "FILE_UPLOAD"
                    ? "border-[#8f4458] bg-[#f7e7ec] text-[#743447]"
                    : "border-[#e3dce2] bg-white text-[#746A6E]"
                }`}
              >
                Tải file lên
              </button>
              <button
                type="button"
                onClick={() => setSourceType("DRIVE_LINK")}
                className={`min-h-[40px] rounded-xl border text-xs font-bold transition ${
                  sourceType === "DRIVE_LINK"
                    ? "border-[#8f4458] bg-[#f7e7ec] text-[#743447]"
                    : "border-[#e3dce2] bg-white text-[#746A6E]"
                }`}
              >
                Link Google Drive/Web
              </button>
              <button
                type="button"
                onClick={() => setSourceType("RICH_TEXT")}
                className={`min-h-[40px] rounded-xl border text-xs font-bold transition ${
                  sourceType === "RICH_TEXT"
                    ? "border-[#8f4458] bg-[#f7e7ec] text-[#743447]"
                    : "border-[#e3dce2] bg-white text-[#746A6E]"
                }`}
              >
                Bài viết Rich Text
              </button>
            </div>
          </div>

          {sourceType === "DRIVE_LINK" && (
            <div>
              <label className="block text-xs font-bold text-[#211A1D] mb-1.5">Đường dẫn đính kèm</label>
              <input
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="min-h-[44px] w-full rounded-xl border border-[#e3dce2] px-3 text-sm focus:border-[#8f4458] focus:outline-none"
              />
            </div>
          )}

          {sourceType === "RICH_TEXT" && (
            <div>
              <label className="block text-xs font-bold text-[#211A1D] mb-1.5">Nội dung bài viết</label>
              <textarea
                rows={4}
                value={richTextContent}
                onChange={(e) => setRichTextContent(e.target.value)}
                placeholder="Nhập nội dung rich text bài giảng hoặc lý thuyết..."
                className="w-full rounded-xl border border-[#e3dce2] p-3 text-sm focus:border-[#8f4458] focus:outline-none"
              />
            </div>
          )}

          {sourceType === "FILE_UPLOAD" && (
            <label className="block cursor-pointer rounded-xl border border-dashed border-[#e3dce2] bg-[#F8F6FA] p-6 text-center hover:border-[#8f4458]">
              <input
                type="file"
                className="sr-only"
                accept=".pdf,.doc,.docx,.mp3,.wav,.m4a,.png,.jpg,.jpeg"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              />
              <p className="text-xs font-bold text-[#211A1D]">
                {selectedFile ? selectedFile.name : item ? "Chọn tệp mới để bổ sung" : "Bấm để chọn tệp tải lên"}
              </p>
              <p className="mt-1 text-[11px] text-[#746A6E]">Hỗ trợ PDF, Audio MP3, DOCX, PNG (Tối đa 50MB)</p>
            </label>
          )}

          {/* Quyền hiển thị */}
          <div>
            <label className="block text-xs font-bold text-[#211A1D] mb-1.5">Quyền xem</label>
            <select
              value={visibilityPermission}
              onChange={(e) => setVisibilityPermission(e.target.value as VisibilityPermission)}
              className="min-h-[44px] w-full rounded-xl border border-[#e3dce2] px-3 text-sm focus:border-[#8f4458] focus:outline-none"
            >
              <option value="TEACHER_ONLY">Chỉ giáo viên mới được thấy</option>
              <option value="STUDENT_AFTER_ASSIGN">Học viên được thấy sau khi được giao bài</option>
              <option value="STUDENT_AFTER_SUBMIT">Học viên được thấy sau khi đã nộp bài</option>
            </select>
          </div>

          {/* Tags & Mô tả */}
          <div>
            <label className="block text-xs font-bold text-[#211A1D] mb-1.5">Thẻ phân loại (Tags)</label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="VD: Listening, Section 1, Band 6.5 (phân tách bởi dấu phẩy)"
              className="min-h-[44px] w-full rounded-xl border border-[#e3dce2] px-3.5 text-sm focus:border-[#8f4458] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#211A1D] mb-1.5">Mô tả / Ghi chú</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú thêm về học liệu..."
              className="w-full rounded-xl border border-[#e3dce2] p-3 text-sm focus:border-[#8f4458] focus:outline-none"
            />
          </div>
        </form>

        {/* Modal Sticky Footer Actions */}
        <footer className="flex items-center justify-end gap-3 border-t border-[#e3dce2] bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl border border-[#e3dce2] px-4 text-xs font-bold text-[#211A1D]"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSave("DRAFT")}
            className="min-h-[44px] rounded-xl border border-[#8f4458] px-4 text-xs font-bold text-[#8f4458] hover:bg-[#f7e7ec]"
          >
            Lưu nháp
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSave("PUBLISHED")}
            className="min-h-[44px] rounded-xl bg-[#8f4458] px-5 text-xs font-bold text-white shadow-sm hover:bg-[#743447]"
          >
            {submitting ? "Đang lưu..." : "Gửi duyệt / Xuất bản"}
          </button>
        </footer>
      </div>
    </div>
  );
}
