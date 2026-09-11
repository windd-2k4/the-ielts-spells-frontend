import { Image as ImageIcon, SpinnerGap, Trash, UploadSimple } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import type { MediaAsset, QuestionGroupIllustration } from "../../library-types";
import { apiUpload } from "../../lib/api";
import AuthenticatedMediaImage from "./AuthenticatedMediaImage";

type Props = {
  value?: QuestionGroupIllustration;
  onChange: (value?: QuestionGroupIllustration) => void;
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export default function QuestionGroupIllustrationField({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn đúng tệp ảnh.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Ảnh không được vượt quá 10 MB.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const asset = await apiUpload<MediaAsset>("/admin/library/media", body);
      if (asset.mimeType !== "IMAGE") throw new Error("Tệp tải lên không được nhận diện là hình ảnh.");
      onChange({
        assetId: asset.id,
        fileUrl: asset.fileUrl,
        filename: asset.filename,
        altText: value?.altText ?? "",
        width: asset.dimensions?.width,
        height: asset.dimensions?.height,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tải ảnh lên.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-xl border border-[#e3dce2] bg-white p-3" aria-label="Ảnh hoặc sơ đồ của Question Group">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = "";
        }}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f7e7ec] text-[#8f4458]">
            <ImageIcon size={18} weight="duotone" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h4 className="text-[11px] font-extrabold text-[#211A1D]">Ảnh hoặc sơ đồ của Question Group</h4>
            <p className="mt-0.5 text-[11px] leading-5 text-[#746A6E]">Dùng chung cho toàn bộ câu trong group. Hỗ trợ PNG, JPG, WebP hoặc GIF, tối đa 10 MB.</p>
          </div>
        </div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#8f4458] bg-white px-3 text-xs font-bold text-[#8f4458] hover:bg-[#f7e7ec] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? <SpinnerGap size={16} className="animate-spin" /> : <UploadSimple size={16} />}
          {value ? "Thay ảnh" : "Tải ảnh lên"}
        </button>
      </div>

      {error && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-[#b4232d]">{error}</p>}

      {value && (
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="min-w-0 rounded-xl border border-[#e3dce2] bg-[#f8f6fa] p-3">
            <p className="truncate text-xs font-bold text-[#211A1D]" title={value.filename}>{value.filename}</p>
            <label className="mt-3 block">
              <span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Mô tả ảnh cho học viên *</span>
              <textarea
                rows={3}
                value={value.altText}
                onChange={(event) => onChange({ ...value, altText: event.target.value })}
                placeholder="VD: Sơ đồ quy trình vận hành Marketing Information System"
                className="w-full resize-y rounded-xl border border-[#e3dce2] bg-white p-3 text-xs leading-5 focus:border-[#8f4458] focus:outline-none focus:ring-2 focus:ring-[#8f4458]/10"
              />
            </label>
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 text-[11px] font-bold text-[#b4232d] hover:bg-rose-50"
            >
              <Trash size={14} /> Gỡ khỏi group
            </button>
          </div>
          <AuthenticatedMediaImage
            fileUrl={value.fileUrl}
            alt={value.altText || "Ảnh minh họa câu hỏi chưa có mô tả"}
            className="h-auto max-h-64 w-full rounded-xl border border-[#e3dce2] bg-white object-contain p-2"
          />
        </div>
      )}
    </section>
  );
}
