import { ArrowSquareOut, FileArrowUp, SpinnerGap, X } from "@phosphor-icons/react";
import { type FormEvent, useEffect, useState } from "react";
import type { Course } from "../../academic-types";
import type { ExerciseTemplate, LearningResource, LibrarySkill, LibraryView } from "../../library-types";
import { apiFetch, apiUpload } from "../../lib/api";
import { CATEGORIES, RESOURCE_TYPES } from "./library-config";

type EditableItem = LearningResource | ExerciseTemplate;
type Props = {
  open: boolean; view: LibraryView; skill: LibrarySkill; item?: EditableItem | null;
  courseId?: string; courses: Course[]; onClose: () => void; onSaved: () => Promise<void>;
};

const fieldClass = "mt-1.5 min-h-11 w-full rounded-xl border-outline-variant/60 bg-surface text-sm focus:border-primary focus:ring-primary";

export default function LibraryItemModal({ open, view, skill, item, courseId, courses, onClose, onSaved }: Props) {
  const isExercise = view === "EXERCISES";
  const existingExercise = item && "exerciseType" in item ? item : null;
  const existingResource = item && "resourceType" in item ? item : null;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[skill][0]?.value ?? "OTHER");
  const [scope, setScope] = useState<"GLOBAL" | "COURSE">(courseId ? "COURSE" : "GLOBAL");
  const [selectedCourseId, setSelectedCourseId] = useState(courseId ?? "");
  const [url, setUrl] = useState("");
  const [sourceMode, setSourceMode] = useState<"LINK" | "UPLOAD" | "NONE">("LINK");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resourceType, setResourceType] = useState("DRIVE_LINK");
  const [teacherOnly, setTeacherOnly] = useState(false);
  const [exerciseType, setExerciseType] = useState("PRACTICE");
  const [completionMode, setCompletionMode] = useState("ONLINE");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [attemptLimit, setAttemptLimit] = useState("1");
  const [requiresReview, setRequiresReview] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(item?.title ?? "");
    setDescription(existingResource?.description ?? existingExercise?.instructions ?? "");
    setCategory(item?.category ?? CATEGORIES[skill][0]?.value ?? "OTHER");
    setScope(courseId ? "COURSE" : item?.scope ?? "GLOBAL");
    setSelectedCourseId(courseId ?? item?.courseId ?? "");
    setUrl(existingResource?.externalUrl ?? existingExercise?.sourceUrl ?? "");
    setSourceMode(existingResource?.externalUrl ? "LINK" : "NONE");
    setSelectedFile(null);
    setResourceType(existingResource?.resourceType ?? "DRIVE_LINK");
    setTeacherOnly(existingResource?.teacherOnly ?? false);
    setExerciseType(existingExercise?.exerciseType ?? "PRACTICE");
    setCompletionMode(existingExercise?.completionMode ?? "ONLINE");
    setDurationMinutes(existingExercise?.durationMinutes?.toString() ?? "");
    setMaxScore(existingExercise?.maxScore?.toString() ?? "");
    setAttemptLimit(existingExercise?.attemptLimit?.toString() ?? "1");
    setRequiresReview(existingExercise?.requiresTeacherReview ?? true);
    setError("");
  }, [courseId, existingExercise, existingResource, item, open, skill]);

  if (!open) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) { setError("Vui lòng nhập tên học liệu."); return; }
    if (scope === "COURSE" && !selectedCourseId) { setError("Vui lòng chọn khóa học sở hữu học liệu."); return; }
    if (!isExercise && sourceMode === "LINK" && !url.trim()) { setError("Vui lòng nhập đường dẫn Drive hoặc web."); return; }
    if (!isExercise && sourceMode === "UPLOAD" && !selectedFile) { setError("Vui lòng chọn tệp cần tải lên."); return; }
    setSaving(true); setError("");
    try {
      const endpoint = `/admin/library/${isExercise ? "exercises" : "resources"}${item ? `/${item.id}` : ""}`;
      const common = {
        title: title.trim(), skill, category, scope,
        courseId: scope === "COURSE" ? selectedCourseId : null,
        status: !isExercise && sourceMode === "NONE" ? "DRAFT" : "PUBLISHED",
      };
      const body = isExercise ? {
        ...common, instructions: description.trim() || null, exerciseType, completionMode,
        sourceUrl: url.trim() || null, durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        maxScore: maxScore ? Number(maxScore) : null, attemptLimit: attemptLimit ? Number(attemptLimit) : null,
        requiresTeacherReview: requiresReview, content: {}, answerKey: {},
      } : {
        ...common, description: description.trim() || null, resourceType,
        externalUrl: sourceMode === "LINK" ? url.trim() : null, teacherOnly,
      };
      const saved = await apiFetch<LearningResource | ExerciseTemplate>(endpoint, { method: item ? "PUT" : "POST", body: JSON.stringify(body) });
      if (!isExercise && sourceMode === "UPLOAD" && selectedFile) {
        const form = new FormData();
        form.append("file", selectedFile);
        form.append("fileRole", "MAIN");
        await apiUpload(`/admin/library/resources/${saved.id}/files`, form);
      }
      await onSaved(); onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu học liệu.");
    } finally { setSaving(false); }
  }

  return <div className="fixed inset-0 z-50 grid place-items-center bg-on-background/45 p-4" role="dialog" aria-modal="true" aria-labelledby="library-modal-title" onMouseDown={event => event.currentTarget === event.target && onClose()}>
    <form noValidate onSubmit={submit} className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-[22px] border border-outline-variant/50 bg-surface shadow-2xl">
      <header className="sticky top-0 z-10 flex items-start justify-between border-b border-outline-variant/40 bg-surface/95 px-6 py-5 backdrop-blur">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{isExercise ? "Kho bài tập mẫu" : "Kho tài liệu"} · {skill}</p><h2 id="library-modal-title" className="mt-1 font-display text-2xl font-bold">{item ? "Chỉnh sửa học liệu" : "Thêm học liệu mới"}</h2><p className="mt-1 text-sm text-on-surface-variant">Mã được hệ thống tự sinh và không thay đổi.</p></div>
        <button type="button" onClick={onClose} aria-label="Đóng" className="grid h-11 w-11 place-items-center rounded-xl border border-outline-variant/50 hover:bg-surface-container"><X size={20}/></button>
      </header>
      <div className="space-y-5 p-6">
        {error && <p role="alert" className="rounded-xl border border-error/25 bg-error-container/20 px-4 py-3 text-sm font-semibold text-error">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold sm:col-span-2">Tên học liệu *<input required value={title} onChange={event=>setTitle(event.target.value)} className={fieldClass} placeholder={isExercise ? "Ví dụ: Listening Practice Test 01" : "Ví dụ: Teacher note · Session 01"}/></label>
          <label className="text-sm font-bold">Nhóm nội dung<select value={category} onChange={event=>setCategory(event.target.value)} className={fieldClass}>{CATEGORIES[skill].map(value=><option key={value.value} value={value.value}>{value.label}</option>)}</select></label>
          {isExercise ? <label className="text-sm font-bold">Loại bài<select value={exerciseType} onChange={event=>setExerciseType(event.target.value)} className={fieldClass}><option value="PRACTICE">Bài luyện tập</option><option value="HOMEWORK">Bài về nhà</option><option value="MOCK_TEST">Đề mock test</option><option value="VOCABULARY">Bài kiểm tra từ vựng</option></select></label> : <label className="text-sm font-bold">Loại tài liệu<select value={resourceType} onChange={event=>setResourceType(event.target.value)} className={fieldClass}>{RESOURCE_TYPES.map(value=><option key={value.value} value={value.value}>{value.label}</option>)}</select></label>}
          <label className="text-sm font-bold">Phạm vi<select disabled={Boolean(courseId)} value={scope} onChange={event=>setScope(event.target.value as "GLOBAL"|"COURSE")} className={fieldClass}><option value="GLOBAL">Dùng chung toàn hệ thống</option><option value="COURSE">Riêng một khóa học</option></select></label>
          <label className="text-sm font-bold">Khóa học<select disabled={scope !== "COURSE" || Boolean(courseId)} value={selectedCourseId} onChange={event=>setSelectedCourseId(event.target.value)} className={fieldClass}><option value="">Chọn khóa học</option>{courseId && <option value={courseId}>Khóa học hiện tại</option>}{courses.filter(value=>value.id !== courseId).map(value=><option key={value.id} value={value.id}>{value.code} · {value.name}</option>)}</select></label>
          {!isExercise && <div className="sm:col-span-2"><p className="text-sm font-bold">Nguồn học liệu</p><div className="mt-1.5 grid gap-2 sm:grid-cols-3">
            {([ ["UPLOAD", "Tải tệp lên"], ["LINK", "Google Drive / web"], ["NONE", "Chỉ tạo mục"] ] as const).map(([value, label]) => <button key={value} type="button" onClick={()=>setSourceMode(value)} className={`min-h-11 rounded-xl border px-3 text-left text-sm font-bold transition ${sourceMode === value ? "border-primary bg-primary-container/20 text-primary" : "border-outline-variant/60 hover:border-primary/50"}`}>{label}</button>)}
          </div></div>}
          {!isExercise && sourceMode === "UPLOAD" && <label className="text-sm font-bold sm:col-span-2">Tệp chính *<span className="mt-1.5 flex min-h-11 items-center gap-3 rounded-xl border border-dashed border-primary/50 bg-primary-container/10 px-4 text-sm font-semibold text-primary"><FileArrowUp size={20}/><input required type="file" onChange={event=>setSelectedFile(event.target.files?.[0] ?? null)} className="block w-full text-sm text-on-surface-variant file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-on-primary"/></span><small className="mt-1 block text-on-surface-variant">Tối đa 50 MB. Sau khi tạo, bạn có thể thêm key, transcript, vocab hoặc audio trong phần tệp đính kèm.</small></label>}
          {(isExercise || sourceMode === "LINK") && <label className="text-sm font-bold sm:col-span-2">Đường dẫn Drive / tài liệu {isExercise ? "" : "*"}<div className="relative"><input type="url" required={!isExercise && sourceMode === "LINK"} value={url} onChange={event=>setUrl(event.target.value)} className={`${fieldClass} pr-12`} placeholder="https://drive.google.com/..."/>{url && <a href={url} target="_blank" rel="noreferrer" aria-label="Mở đường dẫn" className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-primary"><ArrowSquareOut size={20}/></a>}</div></label>}
          {isExercise && <><label className="text-sm font-bold">Cách hoàn thành<select value={completionMode} onChange={event=>setCompletionMode(event.target.value)} className={fieldClass}><option value="ONLINE">Làm trên web</option><option value="UPLOAD">Nộp file</option><option value="MANUAL">Tự làm / GV xác nhận</option></select></label><label className="text-sm font-bold">Thời lượng gợi ý (phút)<input type="number" min="1" value={durationMinutes} onChange={event=>setDurationMinutes(event.target.value)} className={fieldClass}/></label><label className="text-sm font-bold">Điểm tối đa<input type="number" min="0.01" step="0.5" value={maxScore} onChange={event=>setMaxScore(event.target.value)} className={fieldClass}/></label><label className="text-sm font-bold">Số lần làm<input type="number" min="1" value={attemptLimit} onChange={event=>setAttemptLimit(event.target.value)} className={fieldClass}/></label></>}
          <label className="text-sm font-bold sm:col-span-2">{isExercise ? "Hướng dẫn làm bài" : "Mô tả"}<textarea rows={3} value={description} onChange={event=>setDescription(event.target.value)} className={fieldClass} placeholder="Ghi rõ nội dung, cách sử dụng hoặc lưu ý cho giáo viên..."/></label>
        </div>
        <label className="flex items-start gap-3 rounded-xl border border-outline-variant/50 p-4"><input type="checkbox" checked={isExercise ? requiresReview : teacherOnly} onChange={event=>isExercise ? setRequiresReview(event.target.checked) : setTeacherOnly(event.target.checked)} className="mt-1 rounded border-outline text-primary focus:ring-primary"/><span><strong className="block text-sm">{isExercise ? "Giáo viên cần duyệt kết quả" : "Chỉ giáo viên được xem"}</strong><small className="mt-1 block text-on-surface-variant">{isExercise ? "Phù hợp Writing, Speaking hoặc bài nộp file." : "Dùng cho teacher note, key nội bộ và tài liệu hướng dẫn giảng dạy."}</small></span></label>
      </div>
      <footer className="sticky bottom-0 flex justify-end gap-3 border-t border-outline-variant/40 bg-surface/95 px-6 py-4 backdrop-blur"><button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-outline-variant/60 px-5 text-sm font-bold">Hủy</button><button disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary disabled:opacity-60">{saving&&<SpinnerGap className="animate-spin"/>}{saving?"Đang lưu...":"Lưu học liệu"}</button></footer>
    </form>
  </div>;
}
