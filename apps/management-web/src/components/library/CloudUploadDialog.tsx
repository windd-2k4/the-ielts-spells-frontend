import { File, Link, Trash, UploadSimple, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import type { LearningResource, LearningResourceType, LibraryFolder, LibrarySkill } from "../../library-types";
import { apiFetch, apiUpload } from "../../lib/api";
import { CATEGORIES } from "./library-config";

type Props = {
  open: boolean;
  folders: LibraryFolder[];
  folderId?: string;
  courseId?: string;
  skill?: LibrarySkill | "GENERAL";
  onClose: () => void;
  onSaved: () => Promise<void>;
};

function resourceType(file: File): LearningResourceType {
  const value = `${file.type} ${file.name}`.toLowerCase();
  if (/audio|\.mp3|\.wav|\.m4a|\.ogg/.test(value)) return "AUDIO";
  if (/video|\.mp4|\.mov|\.webm/.test(value)) return "VIDEO";
  return "DOCUMENT";
}

function displayName(filename: string) {
  return filename.replace(/\.[^.]+$/, "") || filename;
}

export default function CloudUploadDialog({ open, folders, folderId, courseId, skill = "GENERAL", onClose, onSaved }: Props) {
  const [source, setSource] = useState<"FILES" | "LINK">("FILES");
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState(folderId ?? "");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const selectedFolder = useMemo(() => folders.find(folder => folder.id === selectedFolderId), [folders, selectedFolderId]);

  useEffect(() => {
    if (!open) return;
    setSource("FILES");
    setFiles([]);
    setSelectedFolderId(folderId ?? "");
    setLinkTitle("");
    setLinkUrl("");
    setError("");
  }, [folderId, open]);

  if (!open) return null;

  const common = {
    description: null,
    skill,
    category: skill === "GENERAL" ? "GENERAL" : CATEGORIES[skill][0]?.value ?? "PRACTICE_SET",
    scope: courseId || selectedFolder?.courseId ? "COURSE" : "GLOBAL",
    courseId: courseId ?? selectedFolder?.courseId ?? null,
    folderId: selectedFolderId || null,
    teacherOnly: false,
    status: "PUBLISHED",
  };

  async function save() {
    if (source === "FILES" && files.length === 0) return setError("Chọn ít nhất một tệp để tải lên.");
    if (source === "LINK" && !linkUrl.trim()) return setError("Nhập liên kết Google Drive hoặc website.");
    setSubmitting(true);
    setError("");
    try {
      if (source === "FILES") {
        for (const file of files) {
          const saved = await apiFetch<LearningResource>("/admin/library/resources", {
            method: "POST",
            body: JSON.stringify({ ...common, title: displayName(file.name), resourceType: resourceType(file), externalUrl: null }),
          });
          const data = new FormData();
          data.append("file", file);
          data.append("fileRole", "MAIN");
          await apiUpload(`/admin/library/resources/${saved.id}/files`, data);
        }
      } else {
        let title = linkTitle.trim();
        if (!title) {
          try { title = new URL(linkUrl.trim()).hostname.replace(/^www\./, ""); }
          catch { title = "Liên kết tài liệu"; }
        }
        await apiFetch("/admin/library/resources", {
          method: "POST",
          body: JSON.stringify({ ...common, title, resourceType: "DRIVE_LINK", externalUrl: linkUrl.trim() }),
        });
      }
      await onSaved();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu tài liệu.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="cloud-upload-title">
      <section className="flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-[22px] bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#e3dce2] px-5 py-4">
          <div><h2 id="cloud-upload-title" className="font-display text-lg font-bold text-[#211A1D]">Thêm vào kho học liệu</h2><p className="text-xs text-[#746A6E]">Tải tệp lên hệ thống hoặc lưu liên kết Google Drive.</p></div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="grid h-9 w-9 place-items-center rounded-xl text-[#746A6E] hover:bg-[#f1eef4]"><X size={19} /></button>
        </header>

        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-5">
          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-[#b4232d]">{error}</p>}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#f1eef4] p-1" role="tablist" aria-label="Nguồn tài liệu">
            <button type="button" onClick={() => setSource("FILES")} aria-selected={source === "FILES"} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg text-xs font-bold ${source === "FILES" ? "bg-white text-[#8f4458] shadow-sm" : "text-[#746A6E]"}`}><UploadSimple size={17} />Tải tệp</button>
            <button type="button" onClick={() => setSource("LINK")} aria-selected={source === "LINK"} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg text-xs font-bold ${source === "LINK" ? "bg-white text-[#8f4458] shadow-sm" : "text-[#746A6E]"}`}><Link size={17} />Liên kết Drive/Web</button>
          </div>

          {source === "FILES" ? (
            <div className="space-y-3">
              <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d9cbd1] bg-[#fdfafb] px-5 text-center transition hover:border-[#8f4458] hover:bg-[#f9eef2]">
                <UploadSimple size={32} weight="duotone" className="text-[#8f4458]" />
                <strong className="mt-2 text-sm text-[#211A1D]">Chọn một hoặc nhiều tệp</strong>
                <span className="mt-1 text-[11px] text-[#746A6E]">PDF, Word, PowerPoint, ảnh, âm thanh hoặc video</span>
                <input type="file" multiple className="sr-only" onChange={event => setFiles(Array.from(event.target.files ?? []))} />
              </label>
              {files.length > 0 && <div className="space-y-1.5"><p className="text-xs font-bold text-[#211A1D]">Đã chọn {files.length} tệp</p>{files.map((file, index) => <div key={`${file.name}-${file.lastModified}`} className="flex items-center gap-3 rounded-xl bg-[#f7f5f8] px-3 py-2"><File size={18} className="shrink-0 text-[#8f4458]" /><span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#211A1D]">{file.name}</span><span className="shrink-0 text-[10px] text-[#746A6E]">{Math.max(1, Math.round(file.size / 1024))} KB</span><button type="button" onClick={() => setFiles(current => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Bỏ ${file.name}`} className="grid h-8 w-8 place-items-center rounded-lg text-[#b4232d] hover:bg-rose-50"><Trash size={15} /></button></div>)}</div>}
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#211A1D]">Liên kết Google Drive hoặc website</span><input value={linkUrl} onChange={event => setLinkUrl(event.target.value)} placeholder="https://drive.google.com/..." className="min-h-11 w-full rounded-xl border border-[#e3dce2] px-3 text-sm outline-none focus:border-[#8f4458] focus:ring-2 focus:ring-[#f7e7ec]" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#211A1D]">Tên hiển thị <span className="font-normal text-[#746A6E]">(không bắt buộc)</span></span><input value={linkTitle} onChange={event => setLinkTitle(event.target.value)} placeholder="Ví dụ: Bộ đề Reading tháng 10" className="min-h-11 w-full rounded-xl border border-[#e3dce2] px-3 text-sm outline-none focus:border-[#8f4458] focus:ring-2 focus:ring-[#f7e7ec]" /></label>
            </div>
          )}

          {folders.length > 0 && <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#211A1D]">Lưu vào thư mục <span className="font-normal text-[#746A6E]">(không bắt buộc)</span></span><select value={selectedFolderId} onChange={event => setSelectedFolderId(event.target.value)} className="min-h-11 w-full rounded-xl border border-[#e3dce2] bg-white px-3 text-sm outline-none focus:border-[#8f4458]"><option value="">Kho dùng chung</option>{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-[#e3dce2] bg-white px-5 py-4"><span className="hidden text-[11px] text-[#746A6E] sm:block">Tài liệu được lưu và hiển thị ngay trong kho.</span><div className="ml-auto flex gap-2"><button type="button" onClick={onClose} className="min-h-10 rounded-xl px-4 text-xs font-bold text-[#746A6E] hover:bg-[#f1eef4]">Hủy</button><button type="button" disabled={submitting} onClick={() => void save()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#8f4458] px-4 text-xs font-bold text-white hover:bg-[#743447] disabled:opacity-50"><UploadSimple size={16} />{submitting ? "Đang lưu..." : source === "FILES" ? `Tải ${files.length || ""} tệp lên` : "Lưu liên kết"}</button></div></footer>
      </section>
    </div>
  );
}
