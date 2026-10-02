import { CheckCircle, Image as ImageIcon, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import type { QuestionGroupIllustration } from "../../library-types";
import AiImportCoverImageField from "../test-bank/AiImportCoverImageField";

type Props = {
  value?: QuestionGroupIllustration;
  onChange: (value?: QuestionGroupIllustration) => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function testCoverImageOf(content?: Record<string, unknown>): QuestionGroupIllustration | undefined {
  const value = content?.coverImage;
  if (!isRecord(value)
    || typeof value.assetId !== "string"
    || typeof value.fileUrl !== "string"
    || typeof value.filename !== "string"
    || typeof value.altText !== "string") return undefined;
  return {
    assetId: value.assetId,
    fileUrl: value.fileUrl,
    filename: value.filename,
    altText: value.altText,
    width: typeof value.width === "number" ? value.width : undefined,
    height: typeof value.height === "number" ? value.height : undefined,
  };
}

export function withTestCoverImage(content: Record<string, unknown>, value?: QuestionGroupIllustration) {
  const next = { ...content };
  if (value) next.coverImage = value;
  else delete next.coverImage;
  return next;
}

export default function TestCoverImageControl({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  function close() {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), textarea:not([disabled])"));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="relative inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#DED7DA] bg-white px-3 text-xs font-bold text-[#292528] transition hover:border-[#C85F78] hover:bg-[#F7E5EA] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA]"
      >
        <ImageIcon size={17} aria-hidden="true" />
        Ảnh minh họa
        {value && <CheckCircle size={14} weight="fill" className="text-[#247052]" aria-label="Đã có ảnh" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="test-cover-dialog-title">
          <div ref={dialogRef} className="custom-scrollbar max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[24px] bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-[#DED7DA] p-5 sm:p-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#AD4C64]">Hiển thị toàn đề</p>
                <h2 id="test-cover-dialog-title" className="mt-1 font-display text-xl font-bold text-[#292528]">Ảnh minh họa đề thi</h2>
                <p className="mt-1 text-sm leading-6 text-[#6F676C]">Ảnh này dùng làm thumbnail trong ngân hàng đề và xuất hiện ở đầu màn hình làm bài.</p>
              </div>
              <button ref={closeButtonRef} type="button" onClick={close} aria-label="Đóng ảnh minh họa" className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#DED7DA] text-[#6F676C] transition hover:bg-[#F2ECEE] focus:outline-none focus:ring-2 focus:ring-[#C85F78]"><X size={19} /></button>
            </header>
            <div className="p-5 sm:p-6">
              <AiImportCoverImageField value={value} onChange={onChange} />
            </div>
            <footer className="flex justify-end border-t border-[#DED7DA] p-5">
              <button type="button" onClick={close} disabled={Boolean(value && !value.altText.trim())} className="min-h-11 rounded-xl bg-[#AD4C64] px-5 text-xs font-bold text-white transition hover:bg-[#943B52] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA] disabled:cursor-not-allowed disabled:opacity-50">Hoàn tất</button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
