import {
  DownloadSimple, FileAudio, FilePdf, FileText, Image, MagnifyingGlass, SpinnerGap, Trash,
  UploadSimple, X,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MediaAsset } from "../../library-types";
import type { Page } from "../../academic-types";
import { apiFetch, apiMediaUrl, apiUpload, revokeMediaUrl } from "../../lib/api";

type MediaType = "ALL" | MediaAsset["mimeType"];

const FILTERS: { value: MediaType; label: string; icon: Icon }[] = [
  { value: "ALL", label: "Tất cả tệp", icon: FileText },
  { value: "IMAGE", label: "Hình ảnh", icon: Image },
  { value: "AUDIO", label: "Âm thanh", icon: FileAudio },
  { value: "PDF", label: "PDF", icon: FilePdf },
  { value: "DOCUMENT", label: "Tài liệu", icon: FileText },
];

function assetIcon(type: MediaAsset["mimeType"]): Icon {
  if (type === "IMAGE") return Image;
  if (type === "AUDIO") return FileAudio;
  if (type === "PDF") return FilePdf;
  return FileText;
}

function readableSize(size: number) {
  if (size < 1_024) return `${size} B`;
  if (size < 1_048_576) return `${Math.round(size / 1_024)} KB`;
  return `${(size / 1_048_576).toFixed(1)} MB`;
}

function MediaThumbnail({ asset }: { asset: MediaAsset }) {
  const [url, setUrl] = useState("");
  const container = useRef<HTMLDivElement>(null);
  const AssetIcon = assetIcon(asset.mimeType);

  useEffect(() => {
    if (asset.mimeType !== "IMAGE") return;
    const node = container.current;
    if (!node) return;
    let active = true; let mediaUrl = "";
    const load = () => void apiMediaUrl(asset.fileUrl).then(value => {
      mediaUrl = value;
      if (active) setUrl(value);
    }).catch(() => undefined);
    if (!("IntersectionObserver" in window)) load();
    else {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); load(); }
      }, { rootMargin: "180px" });
      observer.observe(node);
      return () => { active = false; observer.disconnect(); if (mediaUrl) revokeMediaUrl(mediaUrl); };
    }
    return () => { active = false; if (mediaUrl) revokeMediaUrl(mediaUrl); };
  }, [asset.fileUrl, asset.mimeType]);

  return <div ref={container} className="relative grid h-36 w-full place-items-center overflow-hidden rounded-lg bg-[#f5f1f3]">
    {url ? <img src={url} alt={`Xem trước ${asset.filename}`} className="absolute inset-0 h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]" /> : <AssetIcon size={38} weight="duotone" className="text-[#a76779]" />}
  </div>;
}

export function MediaLibraryWorkspace() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [filterType, setFilterType] = useState<MediaType>("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [viewerUrl, setViewerUrl] = useState("");
  const [viewerLoading, setViewerLoading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true); setError("");
    try {
      const page = await apiFetch<Page<MediaAsset>>("/admin/library/media?size=100&sort=createdAt,desc");
      setAssets(page.content);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tải kho media"); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    setViewerUrl("");
    setViewerLoading(false);
    if (!selectedAsset || selectedAsset.mimeType === "DOCUMENT") return;
    let active = true; let url = "";
    setViewerLoading(true);
    void apiMediaUrl(selectedAsset.fileUrl).then(value => {
      url = value;
      if (active) setViewerUrl(value);
    }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Không thể mở tệp"); })
      .finally(() => { if (active) setViewerLoading(false); });
    return () => { active = false; if (url) revokeMediaUrl(url); };
  }, [selectedAsset]);

  useEffect(() => {
    if (!selectedAsset) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setSelectedAsset(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [selectedAsset]);

  async function upload(file: File) {
    const body = new FormData(); body.append("file", file);
    setUploading(true); setError("");
    try { await apiUpload<MediaAsset>("/admin/library/media", body); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tải file lên"); }
    finally { setUploading(false); }
  }

  async function download(asset: MediaAsset) {
    try {
      const url = await apiMediaUrl(asset.fileUrl);
      const link = document.createElement("a"); link.href = url; link.download = asset.filename; link.click();
      window.setTimeout(() => revokeMediaUrl(url), 1_000);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tải tệp"); }
  }

  async function removeAsset(asset: MediaAsset) {
    if (!window.confirm(`Xóa file ${asset.filename}?`)) return;
    try {
      await apiFetch<void>(`/admin/library/media/${asset.id}`, { method: "DELETE" });
      if (selectedAsset?.id === asset.id) setSelectedAsset(null);
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể xóa file"); }
  }

  const filteredAssets = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return assets.filter(asset => (filterType === "ALL" || asset.mimeType === filterType)
      && (!needle || asset.filename.toLowerCase().includes(needle) || asset.code.toLowerCase().includes(needle)
        || asset.tags.some(tag => tag.toLowerCase().includes(needle))));
  }, [assets, filterType, query]);

  const viewerBody = selectedAsset && (viewerLoading ? <SpinnerGap size={28} className="animate-spin text-white/70" />
    : selectedAsset.mimeType === "IMAGE" && viewerUrl ? <img src={viewerUrl} alt={selectedAsset.filename} className="max-h-[76dvh] max-w-[88%] rounded-md object-contain shadow-2xl" />
      : selectedAsset.mimeType === "AUDIO" && viewerUrl ? <div className="w-full max-w-xl rounded-2xl bg-white/10 p-8 text-center"><FileAudio size={54} weight="duotone" className="mx-auto mb-5 text-white/70" /><audio controls autoPlay src={viewerUrl} className="w-full" /></div>
        : selectedAsset.mimeType === "PDF" && viewerUrl ? <iframe src={viewerUrl} title={selectedAsset.filename} className="h-full w-full border-0 bg-white" />
          : <div className="max-w-sm text-center text-white/70"><FileText size={54} weight="duotone" className="mx-auto" /><p className="mt-4 font-bold text-white">Định dạng này cần mở bằng ứng dụng tương ứng</p><button onClick={() => void download(selectedAsset)} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-[#743447]"><DownloadSimple size={17} /> Tải xuống</button></div>);

  return <section className="flex min-h-[68dvh] flex-col gap-4 lg:flex-row">
    <aside className="h-fit rounded-2xl border border-[#e3dce2] bg-white p-3 lg:sticky lg:top-4 lg:basis-1/5 lg:flex-none">
      <div className="flex items-start gap-2 px-1 py-1">
        <div className="min-w-0 flex-1"><h1 className="font-display text-lg font-extrabold tracking-tight text-[#211A1D]">Kho Media</h1><p className="mt-0.5 text-[11px] leading-4 text-[#746A6E]">Tệp dùng chung trong hệ thống</p></div>
        <input ref={fileInput} type="file" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ""; }} />
        <button disabled={uploading} onClick={() => fileInput.current?.click()} aria-label="Tải tệp media mới" title="Tải tệp media mới" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#8f4458] text-white transition hover:bg-[#743447] active:scale-95 disabled:opacity-50">{uploading ? <SpinnerGap size={18} className="animate-spin" /> : <UploadSimple size={18} weight="bold" />}</button>
      </div>

      <label className="relative mt-4 block"><span className="sr-only">Tìm tệp media</span><MagnifyingGlass size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#746A6E]" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm tên, mã, tag..." className="min-h-10 w-full rounded-xl border border-[#e3dce2] bg-[#fdfcfd] pl-9 pr-3 text-xs outline-none focus:border-[#8f4458] focus:ring-2 focus:ring-[#f7e7ec]" /></label>

      <nav className="mt-4 space-y-1" aria-label="Lọc kho media">{FILTERS.map(filter => { const FilterIcon = filter.icon; const count = filter.value === "ALL" ? assets.length : assets.filter(asset => asset.mimeType === filter.value).length; return <button key={filter.value} onClick={() => setFilterType(filter.value)} aria-pressed={filterType === filter.value} className={`flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 text-left text-xs transition ${filterType === filter.value ? "bg-[#f7e7ec] font-bold text-[#8f4458]" : "font-semibold text-[#5f565a] hover:bg-[#faf8fb]"}`}><FilterIcon size={17} weight={filterType === filter.value ? "fill" : "regular"} /><span className="flex-1">{filter.label}</span><span className="tabular-nums text-[10px] text-[#8d8287]">{count}</span></button>; })}</nav>

      <div className="mt-4 border-t border-[#e3dce2] px-2 pt-3 text-[10px] leading-4 text-[#8d8287]">Bấm vào một tệp để xem và thao tác ngay trong hệ thống.</div>
    </aside>

    <main className="min-w-0 flex-1">
      <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-[#211A1D]">{FILTERS.find(filter => filter.value === filterType)?.label}</h2><p className="mt-0.5 text-[11px] text-[#746A6E]">{filteredAssets.length} tệp</p></div><span className="text-[11px] text-[#8d8287]">Mới cập nhật</span></div>
      {error && <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-[#b4232d]">{error}</div>}
      {loading ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{Array.from({ length: 8 }, (_, index) => <div key={index} className="animate-pulse rounded-xl border border-[#e3dce2] bg-white p-2.5"><div className="h-9 rounded bg-[#f1eef4]" /><div className="mt-2 aspect-[16/10] rounded-lg bg-[#f1eef4]" /><div className="mt-2 h-3 w-2/3 rounded bg-[#f1eef4]" /></div>)}</div>
        : filteredAssets.length === 0 ? <div className="rounded-2xl border border-dashed border-[#e3dce2] bg-white p-10 text-center text-sm text-[#746A6E]">Chưa có tệp media phù hợp.</div>
          : <div className="grid grid-cols-2 items-stretch gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{filteredAssets.map(asset => { const AssetIcon = assetIcon(asset.mimeType); return <article key={asset.id} className="group flex h-full min-w-0 flex-col rounded-xl border border-[#e3dce2] bg-white p-2.5 transition duration-200 hover:border-[#b98292] hover:shadow-[0_8px_24px_rgba(82,48,60,0.08)]">
            <div className="mb-2 flex min-h-9 items-center gap-2 px-1"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f7e7ec] text-[#8f4458]"><AssetIcon size={17} weight="duotone" /></span><div className="min-w-0 flex-1"><button onClick={() => setSelectedAsset(asset)} className="block max-w-full truncate text-left text-xs font-bold text-[#211A1D] hover:text-[#8f4458] focus:outline-none focus:underline" title={asset.filename}>{asset.filename}</button><p className="mt-0.5 truncate text-[10px] text-[#746A6E]">{asset.code}</p></div><button onClick={() => void removeAsset(asset)} aria-label={`Xóa ${asset.filename}`} title="Xóa tệp" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#b4232d] opacity-0 transition hover:bg-rose-50 group-hover:opacity-100 focus:opacity-100"><Trash size={15} /></button></div>
            <button onClick={() => setSelectedAsset(asset)} className="block w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f4458]/40" aria-label={`Xem ${asset.filename}`}><MediaThumbnail asset={asset} /></button>
            <div className="mt-auto flex items-center justify-between gap-2 px-1 pt-2 text-[10px] text-[#746A6E]"><span className="truncate">{FILTERS.find(filter => filter.value === asset.mimeType)?.label}</span><span className="shrink-0 tabular-nums">{readableSize(asset.sizeBytes)}</span></div>
            <div className="mt-1 flex items-center justify-between gap-2 px-1 text-[10px] text-[#8d8287]"><span>{asset.usedLocations.length} nơi sử dụng</span><time dateTime={asset.createdAt}>{new Date(asset.createdAt).toLocaleDateString("vi-VN")}</time></div>
          </article>; })}</div>}
    </main>

    {selectedAsset && <div className="fixed inset-0 z-50 bg-[#151314]/90 p-2 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-labelledby="media-viewer-title">
      <section className="mx-auto grid h-full max-h-[94dvh] w-full max-w-[1450px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-2xl bg-[#242122] shadow-2xl">
        <header className="flex min-h-16 items-center gap-3 border-b border-white/10 px-4 text-white"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10"><FileText size={19} weight="duotone" /></span><div className="min-w-0 flex-1"><h2 id="media-viewer-title" className="truncate text-sm font-bold">{selectedAsset.filename}</h2><p className="mt-0.5 truncate text-[11px] text-white/55">{selectedAsset.code} · {readableSize(selectedAsset.sizeBytes)} · {selectedAsset.usedLocations.length} nơi sử dụng</p></div><button onClick={() => void download(selectedAsset)} aria-label={`Tải ${selectedAsset.filename}`} title="Tải xuống" className="grid h-10 w-10 place-items-center rounded-xl text-white/80 hover:bg-white/10 hover:text-white"><DownloadSimple size={19} /></button><button onClick={() => setSelectedAsset(null)} aria-label="Đóng trình xem" className="grid h-10 w-10 place-items-center rounded-xl text-white/80 hover:bg-white/10 hover:text-white"><X size={20} /></button></header>
        <div className="flex min-h-0 flex-col lg:flex-row"><div className="grid min-h-[50dvh] min-w-0 flex-1 place-items-center overflow-auto bg-[#1b191a] p-5">{viewerBody}</div><aside className="max-h-[38dvh] overflow-y-auto border-t border-white/10 bg-white p-4 lg:max-h-none lg:w-72 lg:flex-none lg:border-l lg:border-t-0"><h3 className="text-sm font-bold text-[#211A1D]">Thông tin tệp</h3><dl className="mt-3 space-y-3 text-xs"><div><dt className="text-[#8d8287]">Loại</dt><dd className="mt-0.5 font-semibold text-[#211A1D]">{FILTERS.find(filter => filter.value === selectedAsset.mimeType)?.label}</dd></div><div><dt className="text-[#8d8287]">Người tải</dt><dd className="mt-0.5 font-semibold text-[#211A1D]">{selectedAsset.uploadedBy}</dd></div><div><dt className="text-[#8d8287]">Ngày tải</dt><dd className="mt-0.5 font-semibold text-[#211A1D]">{new Date(selectedAsset.createdAt).toLocaleDateString("vi-VN")}</dd></div></dl><div className="mt-5 border-t border-[#e3dce2] pt-4"><h3 className="text-xs font-bold text-[#211A1D]">Đang sử dụng tại {selectedAsset.usedLocations.length} vị trí</h3>{selectedAsset.usedLocations.length ? <ul className="mt-2 space-y-1.5">{selectedAsset.usedLocations.map(location => <li key={location.id} className="rounded-lg bg-[#f7f5f8] px-3 py-2 text-[11px] font-semibold text-[#743447]">{location.name}<span className="mt-0.5 block text-[9px] font-normal text-[#8d8287]">{location.type}</span></li>)}</ul> : <p className="mt-2 text-[11px] text-[#8d8287]">Chưa được gắn vào nội dung nào.</p>}</div><button onClick={() => void removeAsset(selectedAsset)} className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 text-xs font-bold text-[#b4232d] hover:bg-rose-50"><Trash size={16} /> Xóa tệp</button></aside></div>
      </section>
    </div>}
  </section>;
}
