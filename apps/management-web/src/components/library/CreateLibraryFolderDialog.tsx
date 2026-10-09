import { Folder, GraduationCap, Plus, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import type { Course } from "../../academic-types";
import type { LibraryFolder } from "../../library-types";
import { apiFetch } from "../../lib/api";

type Props = {
  open: boolean;
  courses: Course[];
  onClose: () => void;
  onCreated: (folder: LibraryFolder) => void;
};

export default function CreateLibraryFolderDialog({ open, courses, onClose, onCreated }: Props) {
  const [mode, setMode] = useState<"COURSE" | "CUSTOM">("COURSE");
  const [courseId, setCourseId] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const selectedCourse = useMemo(() => courses.find(course => course.id === courseId), [courseId, courses]);

  useEffect(() => {
    if (!open) return;
    setMode("COURSE");
    setCourseId(courses[0]?.id ?? "");
    setName("");
    setError("");
  }, [courses, open]);

  if (!open) return null;

  async function createFolder() {
    const folderName = mode === "COURSE"
      ? selectedCourse ? `${selectedCourse.code} · ${selectedCourse.name}` : ""
      : name.trim();
    if (!folderName || (mode === "COURSE" && !courseId)) {
      setError(mode === "COURSE" ? "Vui lòng chọn khóa học." : "Vui lòng nhập tên thư mục.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const folder = await apiFetch<LibraryFolder>("/admin/library/folders", {
        method: "POST",
        body: JSON.stringify({ name: folderName, courseId: mode === "COURSE" ? courseId : null }),
      });
      onCreated(folder);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tạo thư mục.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="create-library-folder-title">
      <section className="w-full max-w-lg overflow-hidden rounded-[22px] border border-outline-variant/40 bg-surface shadow-2xl">
        <header className="flex items-center justify-between border-b border-outline-variant/35 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Folder size={21} weight="duotone" /></span>
            <div><h2 id="create-library-folder-title" className="font-display text-lg font-bold text-on-surface">Tạo thư mục</h2><p className="text-xs text-on-surface-variant">Sắp xếp học liệu theo khóa hoặc theo nhu cầu riêng.</p></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="grid h-9 w-9 place-items-center rounded-xl text-on-surface-variant hover:bg-surface-container"><X size={18} /></button>
        </header>

        <div className="space-y-4 p-5">
          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">{error}</p>}
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Loại thư mục">
            <button type="button" aria-pressed={mode === "COURSE"} onClick={() => setMode("COURSE")} className={`flex min-h-20 items-center gap-3 rounded-xl border p-3 text-left transition ${mode === "COURSE" ? "border-primary bg-primary/5 text-primary" : "border-outline-variant/50 hover:border-primary/40"}`}><GraduationCap size={22} weight="duotone"/><span><strong className="block text-sm">Theo khóa học</strong><span className="text-[11px] text-on-surface-variant">Chọn khóa có sẵn</span></span></button>
            <button type="button" aria-pressed={mode === "CUSTOM"} onClick={() => setMode("CUSTOM")} className={`flex min-h-20 items-center gap-3 rounded-xl border p-3 text-left transition ${mode === "CUSTOM" ? "border-primary bg-primary/5 text-primary" : "border-outline-variant/50 hover:border-primary/40"}`}><Folder size={22} weight="duotone"/><span><strong className="block text-sm">Thư mục mới</strong><span className="text-[11px] text-on-surface-variant">Tự đặt tên thư mục</span></span></button>
          </div>

          {mode === "COURSE" ? <label className="block"><span className="mb-1.5 block text-xs font-bold text-on-surface">Khóa học</span><select value={courseId} onChange={event => setCourseId(event.target.value)} className="min-h-11 w-full rounded-xl border border-outline-variant/60 bg-surface px-3 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"><option value="">Chọn khóa học</option>{courses.map(course => <option key={course.id} value={course.id}>{course.code} · {course.name}</option>)}</select><span className="mt-1.5 block text-[11px] text-on-surface-variant">Tên thư mục được tạo tự động theo khóa học.</span></label> : <label className="block"><span className="mb-1.5 block text-xs font-bold text-on-surface">Tên thư mục</span><input autoFocus value={name} maxLength={120} onChange={event => setName(event.target.value)} onKeyDown={event => { if (event.key === "Enter") void createFolder(); }} placeholder="Ví dụ: Tài liệu giáo viên, Bộ đề tháng 10..." className="min-h-11 w-full rounded-xl border border-outline-variant/60 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>}
        </div>

        <footer className="flex justify-end gap-2 border-t border-outline-variant/35 px-5 py-4"><button type="button" onClick={onClose} className="min-h-10 rounded-xl border border-outline-variant/50 px-4 text-xs font-bold hover:bg-surface-container">Hủy</button><button type="button" disabled={submitting} onClick={() => void createFolder()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-on-primary hover:bg-primary/90 disabled:opacity-50"><Plus size={16} weight="bold"/>{submitting ? "Đang tạo..." : "Tạo thư mục"}</button></footer>
      </section>
    </div>
  );
}
