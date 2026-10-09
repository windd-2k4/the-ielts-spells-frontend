import { Image as ImageIcon, SpinnerGap, Trash, UploadSimple } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import type { MediaAsset } from "../../library-types";
import { apiUpload } from "../../lib/api";
import AuthenticatedMediaImage from "../test-builder/AuthenticatedMediaImage";

type Props = {
  imageUrl: string;
  altText: string;
  courseName: string;
  onChange: (imageUrl: string, altText: string) => void;
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export default function CourseCoverImageField({ imageUrl, altText, courseName, onChange }: Props) {
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
      const nextAltText = altText.trim() || `Ảnh minh họa khóa học ${courseName.trim() || "IELTS"}`;
      onChange(asset.fileUrl, nextAltText);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tải ảnh lên.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="sm:col-span-2 rounded-2xl border border-outline-variant/50 bg-surface-container-low/40 p-4" aria-labelledby="course-cover-title">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={event => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = "";
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <ImageIcon size={20} weight="duotone" aria-hidden="true" />
          </span>
          <div>
            <h3 id="course-cover-title" className="text-sm font-bold text-on-surface">Ảnh minh họa khóa học</h3>
            <p className="mt-0.5 text-xs text-on-surface-variant">PNG, JPG hoặc WebP, tối đa 10 MB. Tỉ lệ ngang 16:9 sẽ hiển thị đẹp nhất.</p>
          </div>
        </div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-primary/40 bg-surface px-3.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? <SpinnerGap size={16} className="animate-spin" /> : <UploadSimple size={16} weight="bold" />}
          {uploading ? "Đang tải ảnh..." : imageUrl ? "Thay ảnh" : "Chọn ảnh"}
        </button>
      </div>

      {error && <p role="alert" className="mt-3 rounded-xl border border-error/30 bg-error-container/20 px-3 py-2 text-xs font-semibold text-error">{error}</p>}

      {imageUrl && (
        <div className="mt-4 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="h-32 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface">
            <AuthenticatedMediaImage fileUrl={imageUrl} alt={altText || "Ảnh minh họa khóa học"} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <label htmlFor="course-cover-alt" className="text-xs font-bold text-on-surface">Mô tả ảnh *</label>
            <p className="mt-0.5 text-[11px] leading-5 text-on-surface-variant">Mô tả ngắn nội dung ảnh để hỗ trợ người dùng trình đọc màn hình.</p>
            <input
              id="course-cover-alt"
              required
              maxLength={300}
              value={altText}
              onChange={event => onChange(imageUrl, event.target.value)}
              placeholder="Ví dụ: Học viên luyện kỹ năng Listening trong lớp học"
              className="mt-2 w-full rounded-xl border-outline-variant/60 bg-surface text-sm focus:border-primary focus:ring-primary"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onChange("", "")}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-error transition-colors hover:bg-error-container/20 focus:outline-none focus:ring-2 focus:ring-error/20"
              >
                <Trash size={15} weight="bold" /> Gỡ ảnh
              </button>
              <span className="text-[11px] tabular-nums text-on-surface-variant">{altText.length}/300</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
