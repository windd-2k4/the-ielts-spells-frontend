import {
  FileAudio, FileCode, FilePdf, Image, MagnifyingGlass, Plus, ShieldCheck, Trash, UploadSimple,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import type { MediaAsset } from "../../library-types";
import type { Page } from "../../academic-types";
import { apiBlob, apiFetch, apiUpload } from "../../lib/api";

export function MediaLibraryWorkspace() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [filterType, setFilterType] = useState<"ALL" | "AUDIO" | "IMAGE" | "PDF" | "DOCUMENT">("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ size: "100", sort: "createdAt,desc" });
      if (filterType !== "ALL") params.set("type", filterType);
      if (query.trim()) params.set("query", query.trim());
      const page = await apiFetch<Page<MediaAsset>>(`/admin/library/media?${params}`);
      setAssets(page.content);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tải kho media");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 250);
    return () => window.clearTimeout(timer);
  }, [filterType, query]);

  async function upload(file: File) {
    const body = new FormData();
    body.append("file", file);
    try {
      setError("");
      await apiUpload<MediaAsset>("/admin/library/media", body);
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tải file lên"); }
  }

  async function openAsset(asset: MediaAsset) {
    try {
      const blob = await apiBlob(asset.fileUrl);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể mở file"); }
  }

  async function removeAsset(asset: MediaAsset) {
    if (!window.confirm(`Xóa file ${asset.filename}?`)) return;
    try {
      await apiFetch<void>(`/admin/library/media/${asset.id}`, { method: "DELETE" });
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể xóa file"); }
  }

  const filteredAssets = assets.filter((a) => {
    if (filterType !== "ALL" && a.mimeType !== filterType) return false;
    if (query.trim() && !a.filename.toLowerCase().includes(query.toLowerCase()) && !a.code.toLowerCase().includes(query.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-[#8f4458]">
            NỘI DUNG ĐÀO TẠO
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl text-[#211A1D]">
            Media Library (Kho Media Dùng Chung)
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#746A6E]">
            Quản lý tập trung các file Audio nghe, hình ảnh biểu đồ, PDF và tài liệu đính kèm. Hiển thị chính xác vị trí file đang được sử dụng.
          </p>
        </div>

        <input ref={fileInput} type="file" className="hidden" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = "";
        }} />
        <button onClick={() => fileInput.current?.click()} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#8f4458] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#743447]">
          <UploadSimple size={18} weight="bold" />
          Tải file Media mới
        </button>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-[18px] border border-[#e3dce2] bg-white p-4 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Tìm theo tên file hoặc mã</span>
          <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#746A6E]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên file media, mã file hoặc tag..."
            className="min-h-[42px] w-full rounded-xl border border-[#e3dce2] bg-white pl-10 pr-4 text-xs focus:border-[#8f4458] focus:outline-none"
          />
        </label>

        <div className="flex items-center gap-2">
          {(["ALL", "AUDIO", "IMAGE", "PDF", "DOCUMENT"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`min-h-[38px] rounded-xl border px-3 text-xs font-bold transition ${
                filterType === t
                  ? "border-[#8f4458] bg-[#f7e7ec] text-[#743447]"
                  : "border-[#e3dce2] bg-white text-[#746A6E] hover:border-[#8f4458]/40"
              }`}
            >
              {t === "ALL" ? "Tất cả file" : t}
            </button>
          ))}
        </div>
      </div>

      {/* MEDIA ASSET CARDS GRID */}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-[#b4232d]">{error}</div>}
      {loading && <div className="rounded-[18px] border border-[#e3dce2] bg-white p-12 text-center text-sm text-[#746A6E]">Đang tải Media Library...</div>}
      {!loading && filteredAssets.length === 0 && <div className="rounded-[18px] border border-dashed border-[#e3dce2] bg-white p-12 text-center text-sm text-[#746A6E]">Chưa có file media phù hợp.</div>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            className="flex flex-col justify-between rounded-[18px] border border-[#e3dce2] bg-white p-5 shadow-sm transition hover:border-[#8f4458]/40"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f7e7ec] text-[#8f4458]">
                  {asset.mimeType === "AUDIO" ? (
                    <FileAudio size={22} weight="duotone" />
                  ) : asset.mimeType === "IMAGE" ? (
                    <Image size={22} weight="duotone" />
                  ) : (
                    <FilePdf size={22} weight="duotone" />
                  )}
                </span>

                <span className="rounded-full bg-[#f1eef4] px-2.5 py-0.5 text-[10px] font-bold text-[#746A6E]">
                  {(asset.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>

              <div className="mt-3">
                <span className="text-xs font-bold text-[#8f4458]">{asset.code}</span>
                <h3 className="mt-1 font-display text-sm font-bold text-[#211A1D] line-clamp-1">
                  {asset.filename}
                </h3>
                <p className="mt-1 text-[11px] text-[#746A6E]">
                  Người tải: {asset.uploadedBy} • {new Date(asset.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </div>

              {/* Usage Locations Section */}
              <div className="mt-4 rounded-xl bg-[#F8F6FA] p-3 border border-[#e3dce2]">
                <span className="text-[10px] font-extrabold uppercase text-[#746A6E]">
                  Đã sử dụng trong ({asset.usedLocations.length} vị trí):
                </span>
                <ul className="mt-1.5 space-y-1">
                  {asset.usedLocations.map((loc) => (
                    <li key={loc.id} className="text-xs font-semibold text-[#8f4458] truncate">
                      • [{loc.type}] {loc.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-[#e3dce2]/60 pt-3">
              <button onClick={() => void openAsset(asset)} className="min-h-[34px] rounded-lg border border-[#e3dce2] px-3 text-xs font-bold text-[#8f4458] hover:bg-[#f7e7ec]">
                Xem / Tải xuống
              </button>
              <button onClick={() => void removeAsset(asset)} className="grid h-8 w-8 place-items-center rounded-lg text-[#b4232d] hover:bg-rose-50">
                <Trash size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
