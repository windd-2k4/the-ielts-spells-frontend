import {
  DownloadSimple, Eye, FileArrowUp, FileText, SpinnerGap, Trash, X,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import type { LearningResource, LearningResourceFile } from "../../library-types";
import { apiBlob, apiFetch, apiUpload } from "../../lib/api";

type Props = { resource: LearningResource | null; onClose: () => void; };

const FILE_ROLES = [
  ["MAIN", "Tệp chính"], ["ANSWER_KEY", "Đáp án / key"], ["TRANSCRIPT", "Transcript"],
  ["VOCABULARY", "Vocabulary"], ["AUDIO", "Audio"], ["SUPPORTING", "Tệp bổ sung"],
];

function readableSize(size: number) {
  if (size < 1_024) return `${size} B`;
  if (size < 1_048_576) return `${Math.round(size / 1_024)} KB`;
  return `${(size / 1_048_576).toFixed(1)} MB`;
}

function fileRoleLabel(value: string) { return FILE_ROLES.find(([key]) => key === value)?.[1] ?? value; }

export default function ResourceFilesDialog({ resource, onClose }: Props) {
  const [files, setFiles] = useState<LearningResourceFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileRole, setFileRole] = useState("MAIN");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ file: LearningResourceFile; url: string } | null>(null);
  const [error, setError] = useState("");

  async function load() {
    if (!resource) return;
    setLoading(true); setError("");
    try { setFiles(await apiFetch<LearningResourceFile[]>(`/admin/library/resources/${resource.id}/files`)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không tải được tệp đính kèm."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [resource?.id]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);
  const resourceId = resource?.id;
  if (!resource || !resourceId) return null;

  async function upload() {
    if (!selectedFile) { setError("Vui lòng chọn tệp cần tải lên."); return; }
    setUploading(true); setError("");
    try {
      const form = new FormData();
      form.append("file", selectedFile); form.append("fileRole", fileRole);
      await apiUpload(`/admin/library/resources/${resourceId}/files`, form);
      setSelectedFile(null); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tải tệp lên."); }
    finally { setUploading(false); }
  }

  async function openPreview(file: LearningResourceFile, forceDownload = false) {
    try {
      const blob = await apiBlob(`/admin/library/files/${file.id}/content`);
      const url = URL.createObjectURL(blob);
      if (forceDownload || !file.previewSupported) {
        const link = document.createElement("a"); link.href = url; link.download = file.originalFilename; link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
        return;
      }
      if (preview) URL.revokeObjectURL(preview.url);
      setPreview({file, url});
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể mở tệp."); }
  }

  async function remove(file: LearningResourceFile) {
    if (!window.confirm(`Xóa tệp “${file.originalFilename}”?`)) return;
    try { await apiFetch(`/admin/library/resources/${resourceId}/files/${file.id}`, {method: "DELETE"}); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể xóa tệp."); }
  }

  const previewBody = preview && (preview.file.mimeType.startsWith("image/")
    ? <img src={preview.url} alt={preview.file.originalFilename} className="max-h-[65dvh] max-w-full rounded-lg object-contain"/>
    : preview.file.mimeType.startsWith("audio/")
      ? <audio controls autoPlay src={preview.url} className="w-full"/>
      : preview.file.mimeType.startsWith("video/")
        ? <video controls src={preview.url} className="max-h-[65dvh] max-w-full rounded-lg"/>
        : <iframe title={preview.file.originalFilename} src={preview.url} className="h-[65dvh] w-full rounded-lg border border-outline-variant/50 bg-white"/>);

  return <div className="fixed inset-0 z-50 grid place-items-center bg-on-background/45 p-4" role="dialog" aria-modal="true" aria-labelledby="resource-files-title" onMouseDown={event => event.currentTarget === event.target && onClose()}>
    <section className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-[22px] border border-outline-variant/50 bg-surface shadow-2xl">
      <header className="sticky top-0 z-10 flex items-start justify-between border-b border-outline-variant/40 bg-surface/95 px-6 py-5 backdrop-blur"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Tệp đính kèm · {resource.code}</p><h2 id="resource-files-title" className="mt-1 font-display text-2xl font-bold">{resource.title}</h2><p className="mt-1 text-sm text-on-surface-variant">Tệp được lưu private; mở xem cần đăng nhập và quyền phù hợp.</p></div><button onClick={onClose} aria-label="Đóng" className="grid h-11 w-11 place-items-center rounded-xl border border-outline-variant/50 hover:bg-surface-container"><X size={20}/></button></header>
      <div className="space-y-5 p-6">
        {error && <p role="alert" className="rounded-xl border border-error/25 bg-error-container/20 px-4 py-3 text-sm font-semibold text-error">{error}</p>}
        <section className="rounded-2xl border border-dashed border-primary/45 bg-primary-container/10 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 text-sm font-bold">Chọn tệp<input type="file" onChange={event=>setSelectedFile(event.target.files?.[0] ?? null)} className="mt-1.5 block w-full text-sm text-on-surface-variant file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:font-bold file:text-on-primary"/></label><label className="text-sm font-bold">Vai trò<select value={fileRole} onChange={event=>setFileRole(event.target.value)} className="mt-1.5 min-h-10 rounded-xl border-outline-variant/60 bg-surface text-sm focus:border-primary focus:ring-primary">{FILE_ROLES.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><button disabled={uploading} onClick={()=>void upload()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary disabled:opacity-60">{uploading?<SpinnerGap className="animate-spin"/>:<FileArrowUp size={18}/>}Tải lên</button></div><p className="mt-3 text-xs leading-5 text-on-surface-variant">Hỗ trợ xem nhanh PDF, ảnh, audio, video và văn bản. DOCX, PPTX, ZIP vẫn tải xuống để giữ định dạng gốc.</p></section>
        {loading ? <div className="grid min-h-32 place-items-center"><span className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant"><SpinnerGap className="animate-spin"/>Đang tải tệp...</span></div> : files.length === 0 ? <div className="rounded-2xl border border-dashed border-outline-variant/70 p-8 text-center"><FileText size={30} className="mx-auto text-outline"/><p className="mt-3 font-bold">Chưa có tệp được tải lên</p><p className="mt-1 text-sm text-on-surface-variant">Bạn vẫn có thể sử dụng liên kết Drive ở học liệu này.</p></div> : <div className="divide-y divide-outline-variant/35 rounded-2xl border border-outline-variant/45">{files.map(file=><div key={file.id} className="flex flex-wrap items-center gap-3 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-container/20 text-primary"><FileText size={20}/></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{file.originalFilename}</p><p className="mt-1 text-xs text-on-surface-variant">{fileRoleLabel(file.fileRole)} · {readableSize(file.sizeBytes)} · {new Date(file.createdAt).toLocaleDateString("vi-VN")}</p></div>{file.previewSupported&&<button onClick={()=>void openPreview(file)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-outline-variant/60 px-3 text-xs font-bold text-primary"><Eye size={17}/>Xem</button>}<button onClick={()=>void openPreview(file, true)} aria-label={`Tải ${file.originalFilename}`} className="grid h-10 w-10 place-items-center rounded-xl border border-outline-variant/60 text-primary"><DownloadSimple size={18}/></button><button onClick={()=>void remove(file)} aria-label={`Xóa ${file.originalFilename}`} className="grid h-10 w-10 place-items-center rounded-xl border border-error/30 text-error"><Trash size={18}/></button></div>)}</div>}
      </div>
    </section>
    {preview && <div className="fixed inset-0 z-[60] grid place-items-center bg-on-background/70 p-4" role="dialog" aria-modal="true" aria-label={`Xem ${preview.file.originalFilename}`}><div className="max-h-[92dvh] w-full max-w-5xl overflow-auto rounded-[22px] bg-surface p-4 shadow-2xl"><div className="mb-3 flex items-center justify-between gap-3"><p className="truncate text-sm font-bold">{preview.file.originalFilename}</p><button onClick={()=>{URL.revokeObjectURL(preview.url);setPreview(null)}} aria-label="Đóng xem trước" className="grid h-10 w-10 place-items-center rounded-xl border border-outline-variant/50"><X size={18}/></button></div><div className="grid min-h-48 place-items-center">{previewBody}</div></div></div>}
  </div>;
}
