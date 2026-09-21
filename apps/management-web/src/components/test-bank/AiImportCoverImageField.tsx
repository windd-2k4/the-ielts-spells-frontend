import { Image as ImageIcon, SpinnerGap, Trash, UploadSimple } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import type { MediaAsset, QuestionGroupIllustration } from "../../library-types";
import { apiUpload } from "../../lib/api";
import AuthenticatedMediaImage from "../test-builder/AuthenticatedMediaImage";

type Props = {
  value?: QuestionGroupIllustration;
  onChange: (value?: QuestionGroupIllustration) => void;
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export default function AiImportCoverImageField({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setError("Chỉ hỗ trợ ảnh PNG, JPG hoặc WebP.");
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
    <section aria-labelledby="cover-image-title" className="rounded-[22px] border border-[#DED7DA] bg-white p-5">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = "";
        }}
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#F7E5EA] text-[#AD4C64]">
            <ImageIcon size={22} weight="duotone" aria-hidden="true" />
          </span>
          <div>
            <h2 id="cover-image-title" className="font-display text-base font-bold text-[#292528]">Ảnh minh họa cho đề</h2>
            <p className="mt-1 max-w-xl text-xs leading-5 text-[#6F676C]">Không bắt buộc. Giai đoạn này giáo viên chủ động chọn ảnh để tránh sai nội dung hoặc bản quyền. Với biểu đồ Writing Task 1, hãy tải ảnh riêng trong Writing Builder.</p>
          </div>
        </div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#AD4C64] bg-white px-4 text-xs font-bold text-[#AD4C64] transition hover:bg-[#F7E5EA] focus:outline-none focus:ring-2 focus:ring-[#C85F78] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? <SpinnerGap size={17} className="animate-spin" /> : <UploadSimple size={17} />}
          {uploading ? "Đang tải ảnh" : value ? "Thay ảnh" : "Tải ảnh lên"}
        </button>
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-[#B42335]">{error}</p>}

      {value && (
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 rounded-2xl bg-[#F7F5F4] p-4">
            <p className="truncate text-xs font-bold text-[#292528]" title={value.filename}>{value.filename}</p>
            <label className="mt-4 block" htmlFor="ai-import-cover-alt">
              <span className="text-xs font-bold text-[#292528]">Mô tả ảnh cho học viên *</span>
              <span className="mt-1 block text-[11px] leading-5 text-[#6F676C]">Mô tả ngắn nội dung nhìn thấy, không ghi đáp án hoặc gợi ý đáp án.</span>
            </label>
            <textarea
              id="ai-import-cover-alt"
              rows={3}
              maxLength={300}
              value={value.altText}
              onChange={(event) => onChange({ ...value, altText: event.target.value })}
              placeholder="Ví dụ: Ảnh vệ tinh một khu vực đồng cỏ với đàn bò ở phía xa"
              className="mt-2 w-full resize-y rounded-xl border border-[#DED7DA] bg-white p-3 text-sm leading-6 text-[#292528] focus:border-[#C85F78] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA]"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <button type="button" onClick={() => onChange(undefined)} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-[#B42335] transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-100">
                <Trash size={16} /> Gỡ khỏi đề
              </button>
              <span className="text-[11px] tabular-nums text-[#6F676C]">{value.altText.length}/300</span>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-[#6F676C]">Gỡ ảnh chỉ tách ảnh khỏi đề; tệp vẫn được giữ trong Thư viện Media.</p>
          </div>
          <AuthenticatedMediaImage fileUrl={value.fileUrl} alt={value.altText || "Ảnh minh họa chưa có mô tả"} className="h-full max-h-64 w-full rounded-2xl border border-[#DED7DA] bg-white object-contain p-2" />
        </div>
      )}
    </section>
  );
}
