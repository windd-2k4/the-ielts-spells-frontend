import {
  DownloadSimple, FileArrowUp, FileAudio, FileDoc, FileImage, FilePdf, FilePpt, FileText,
  FileVideo, FileXls, FileZip, Minus, Plus, SlidersHorizontal, SpinnerGap, Trash, X,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import type { LearningResource, LearningResourceFile } from "../../library-types";
import { apiFetch, apiMediaUrl, apiUpload, revokeMediaUrl } from "../../lib/api";

type Props = { resource: LearningResource | null; onClose: () => void; };

const FILE_ROLES = [
  ["MAIN", "Tệp chính"], ["ANSWER_KEY", "Đáp án / key"], ["TRANSCRIPT", "Transcript"],
  ["VOCABULARY", "Vocabulary"], ["AUDIO", "Audio"], ["SUPPORTING", "Tệp bổ sung"],
];

const ZOOM_CLASSES = ["max-h-full max-w-full", "w-full max-w-none", "w-[125%] max-w-none", "w-[150%] max-w-none", "w-[200%] max-w-none"];
const ZOOM_LABELS = ["Vừa", "100%", "125%", "150%", "200%"];

function readableSize(size: number) {
  if (size < 1_024) return `${size} B`;
  if (size < 1_048_576) return `${Math.round(size / 1_024)} KB`;
  return `${(size / 1_048_576).toFixed(1)} MB`;
}

function fileRoleLabel(value: string) { return FILE_ROLES.find(([key]) => key === value)?.[1] ?? value; }

function fileIcon(file: LearningResourceFile): Icon {
  const mime = file.mimeType.toLowerCase();
  const filename = file.originalFilename.toLowerCase();
  if (mime.startsWith("audio/")) return FileAudio;
  if (mime.startsWith("video/")) return FileVideo;
  if (mime.startsWith("image/")) return FileImage;
  if (mime === "application/pdf" || filename.endsWith(".pdf")) return FilePdf;
  if (/\.(doc|docx)$/.test(filename)) return FileDoc;
  if (/\.(ppt|pptx)$/.test(filename)) return FilePpt;
  if (/\.(xls|xlsx|csv)$/.test(filename)) return FileXls;
  if (/\.(zip|rar|7z)$/.test(filename)) return FileZip;
  return FileText;
}

function preferredFile(files: LearningResourceFile[]) {
  return files.find(file => file.fileRole === "THUMBNAIL")
    ?? files.find(file => file.fileRole === "MAIN")
    ?? files.find(file => file.previewSupported)
    ?? files[0]
    ?? null;
}

export default function ResourceFilesDialog({ resource, onClose }: Props) {
  const [files, setFiles] = useState<LearningResourceFile[]>([]);
  const [activeFile, setActiveFile] = useState<LearningResourceFile | null>(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [fileRole, setFileRole] = useState("MAIN");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [error, setError] = useState("");
  const resourceId = resource?.id;

  async function load(preferredId?: string) {
    if (!resourceId) return;
    setLoading(true); setError("");
    try {
      const nextFiles = await apiFetch<LearningResourceFile[]>(`/admin/library/resources/${resourceId}/files`);
      setFiles(nextFiles);
      setActiveFile(nextFiles.find(file => file.id === preferredId) ?? preferredFile(nextFiles));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không tải được tệp đính kèm."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!resourceId) return;
    setFiles([]); setActiveFile(null); setManageOpen(false); setZoomIndex(0); setError("");
    void load(resource?.previewFile?.id);
  }, [resourceId]);

  useEffect(() => {
    setMediaUrl(""); setZoomIndex(0);
    if (!activeFile?.previewSupported) { setPreviewLoading(false); return; }
    let active = true; let nextUrl = "";
    setPreviewLoading(true);
    void apiMediaUrl(`/admin/library/files/${activeFile.id}/content`)
      .then(url => { nextUrl = url; if (active) setMediaUrl(url); })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Không thể mở tệp."); })
      .finally(() => { if (active) setPreviewLoading(false); });
    return () => { active = false; if (nextUrl) revokeMediaUrl(nextUrl); };
  }, [activeFile?.id, activeFile?.previewSupported]);

  useEffect(() => {
    if (!resource) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, resource]);

  if (!resource || !resourceId) return null;

  async function upload() {
    if (!selectedFile) { setError("Vui lòng chọn tệp cần tải lên."); return; }
    setUploading(true); setError("");
    try {
      const form = new FormData();
      form.append("file", selectedFile); form.append("fileRole", fileRole);
      const uploaded = await apiUpload<LearningResourceFile>(`/admin/library/resources/${resourceId}/files`, form);
      setSelectedFile(null); await load(uploaded.id);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tải tệp lên."); }
    finally { setUploading(false); }
  }

  async function download(file: LearningResourceFile) {
    try {
      const url = await apiMediaUrl(`/admin/library/files/${file.id}/content`);
      const link = document.createElement("a"); link.href = url; link.download = file.originalFilename; link.click();
      window.setTimeout(() => revokeMediaUrl(url), 1_000);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tải tệp."); }
  }

  async function remove(file: LearningResourceFile) {
    if (!window.confirm(`Xóa tệp “${file.originalFilename}”?`)) return;
    try { await apiFetch(`/admin/library/resources/${resourceId}/files/${file.id}`, { method: "DELETE" }); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể xóa tệp."); }
  }

  const mimeType = activeFile?.mimeType.toLowerCase() ?? "";
  const ActiveIcon = activeFile ? fileIcon(activeFile) : FileText;
  const previewBody = !activeFile ? (
    <div className="text-center text-white/65"><FileText size={46} className="mx-auto" /><p className="mt-3 text-sm font-semibold">Chưa có tệp để xem</p></div>
  ) : previewLoading ? (
    <div className="inline-flex items-center gap-2 text-sm font-semibold text-white/70"><SpinnerGap size={22} className="animate-spin" /> Đang mở tài liệu...</div>
  ) : !activeFile.previewSupported || !mediaUrl ? (
    <div className="max-w-sm text-center text-white/75"><ActiveIcon size={54} weight="duotone" className="mx-auto" /><p className="mt-4 font-bold text-white">Không thể xem trực tiếp định dạng này</p><p className="mt-2 text-sm leading-6">Tải tệp xuống để mở bằng ứng dụng phù hợp.</p><button onClick={() => void download(activeFile)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#743447]"><DownloadSimple size={18} /> Tải xuống</button></div>
  ) : mimeType.startsWith("image/") ? (
    <div className={`flex h-full w-full overflow-auto p-5 ${zoomIndex === 0 ? "items-center justify-center" : "items-start justify-start"}`}><img src={mediaUrl} alt={activeFile.originalFilename} className={`${ZOOM_CLASSES[zoomIndex]} h-auto rounded-md object-contain shadow-2xl transition-[width] duration-200`} /></div>
  ) : mimeType.startsWith("audio/") ? (
    <div className="w-full max-w-xl rounded-2xl bg-white/10 p-8"><ActiveIcon size={56} weight="duotone" className="mx-auto mb-6 text-white/70" /><audio controls autoPlay src={mediaUrl} className="w-full" /></div>
  ) : mimeType.startsWith("video/") ? (
    <video controls autoPlay src={mediaUrl} className="max-h-full max-w-full rounded-lg shadow-2xl" />
  ) : (
    <iframe title={activeFile.originalFilename} src={mediaUrl} className="h-full w-full border-0 bg-white" />
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#151314]/90 p-2 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-labelledby="resource-viewer-title">
      <section className="mx-auto grid h-full max-h-[94dvh] w-full max-w-[1500px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-2xl bg-[#242122] shadow-2xl">
        <header className="flex min-h-16 items-center gap-3 border-b border-white/10 px-4 text-white sm:px-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-white/80"><ActiveIcon size={19} weight="duotone" /></span>
          <div className="min-w-0 flex-1"><h2 id="resource-viewer-title" className="truncate text-sm font-bold">{activeFile?.originalFilename ?? resource.title}</h2><p className="mt-0.5 truncate text-[11px] text-white/55">{resource.code} · {activeFile ? `${readableSize(activeFile.sizeBytes)} · ${fileRoleLabel(activeFile.fileRole)}` : "Chưa có tệp"}</p></div>
          {activeFile && mimeType.startsWith("image/") && mediaUrl && <div className="hidden items-center rounded-xl bg-white/10 sm:flex"><button onClick={() => setZoomIndex(value => Math.max(0, value - 1))} disabled={zoomIndex === 0} aria-label="Thu nhỏ" className="grid h-10 w-10 place-items-center disabled:opacity-30"><Minus size={17} /></button><span className="min-w-14 text-center text-xs font-bold">{ZOOM_LABELS[zoomIndex]}</span><button onClick={() => setZoomIndex(value => Math.min(ZOOM_CLASSES.length - 1, value + 1))} disabled={zoomIndex === ZOOM_CLASSES.length - 1} aria-label="Phóng to" className="grid h-10 w-10 place-items-center disabled:opacity-30"><Plus size={17} /></button></div>}
          {activeFile && <button onClick={() => void download(activeFile)} title="Tải xuống" aria-label={`Tải ${activeFile.originalFilename}`} className="grid h-10 w-10 place-items-center rounded-xl text-white/80 hover:bg-white/10 hover:text-white"><DownloadSimple size={19} /></button>}
          <button onClick={() => setManageOpen(value => !value)} title="Quản lý tệp" aria-label="Quản lý tệp" className={`grid h-10 w-10 place-items-center rounded-xl hover:bg-white/10 ${manageOpen ? "bg-white text-[#743447]" : "text-white/80"}`}><SlidersHorizontal size={19} /></button>
          <button onClick={onClose} aria-label="Đóng trình xem" className="grid h-10 w-10 place-items-center rounded-xl text-white/80 hover:bg-white/10 hover:text-white"><X size={20} /></button>
        </header>

        <div className={`grid min-h-0 ${manageOpen ? "lg:grid-cols-[minmax(0,1fr)_330px]" : "grid-cols-1"}`}>
          <main className="grid min-h-[50dvh] min-w-0 place-items-center overflow-hidden bg-[#1b191a]">{previewBody}</main>
          {manageOpen && <aside className="max-h-[42dvh] overflow-y-auto border-t border-[#e3dce2] bg-white p-4 text-[#211A1D] lg:max-h-none lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between"><div><h3 className="text-sm font-bold">Tệp trong học liệu</h3><p className="mt-0.5 text-[11px] text-[#746A6E]">{files.length} tệp · bấm để chuyển xem</p></div><button onClick={() => setManageOpen(false)} aria-label="Đóng quản lý tệp" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-[#f7e7ec]"><X size={17} /></button></div>
            {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-[#b4232d]">{error}</p>}
            {loading ? <div className="grid min-h-24 place-items-center"><SpinnerGap className="animate-spin text-[#8f4458]" /></div> : <div className="mt-3 space-y-1.5">{files.map(file => { const FileIcon = fileIcon(file); const selected = activeFile?.id === file.id; return <div key={file.id} className={`group flex items-center gap-2 rounded-xl p-2 ${selected ? "bg-[#f7e7ec]" : "hover:bg-[#faf8fb]"}`}><button onClick={() => setActiveFile(file)} className="flex min-w-0 flex-1 items-center gap-2 text-left"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${selected ? "bg-white text-[#8f4458]" : "bg-[#f1eef4] text-[#746A6E]"}`}><FileIcon size={18} weight="duotone" /></span><span className="min-w-0"><span className="block truncate text-xs font-bold">{file.originalFilename}</span><span className="mt-0.5 block text-[10px] text-[#746A6E]">{readableSize(file.sizeBytes)} · {fileRoleLabel(file.fileRole)}</span></span></button><button onClick={() => void remove(file)} title="Xóa tệp" aria-label={`Xóa ${file.originalFilename}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#b4232d] opacity-70 hover:bg-rose-50 hover:opacity-100"><Trash size={16} /></button></div>; })}</div>}
            <div className="mt-5 border-t border-[#e3dce2] pt-4"><h4 className="text-xs font-bold">Tải thêm tệp</h4><label className="mt-2 block cursor-pointer rounded-xl border border-dashed border-[#cfaeb8] bg-[#fff9fb] px-3 py-4 text-center text-xs font-semibold text-[#743447]"><FileArrowUp size={22} className="mx-auto mb-1.5" />{selectedFile?.name ?? "Chọn tệp từ máy"}<input type="file" onChange={event => setSelectedFile(event.target.files?.[0] ?? null)} className="sr-only" /></label><div className="mt-2 flex gap-2"><select value={fileRole} onChange={event => setFileRole(event.target.value)} aria-label="Vai trò của tệp" className="min-h-10 min-w-0 flex-1 rounded-xl border-[#e3dce2] bg-white text-xs focus:border-[#8f4458] focus:ring-[#8f4458]">{FILE_ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button disabled={!selectedFile || uploading} onClick={() => void upload()} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#8f4458] px-3 text-xs font-bold text-white disabled:opacity-40">{uploading ? <SpinnerGap className="animate-spin" /> : <FileArrowUp size={16} />} Tải lên</button></div></div>
          </aside>}
        </div>
      </section>
    </div>
  );
}
