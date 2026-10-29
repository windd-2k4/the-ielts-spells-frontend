import { BookOpenText, TextT } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef } from "react";
import type { ReadingSectionItem } from "./reviewTypes";

type Props = {
  section: ReadingSectionItem | undefined;
  fontSize: number;
  onFontSizeChange: (updater: (prev: number) => number) => void;
  targetParagraph: string | null;
  onClearTargetParagraph?: () => void;
};

export default function ReadingPassagePanel({
  section,
  fontSize,
  onFontSizeChange,
  targetParagraph,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Enhance HTML to insert paragraph anchor IDs e.g. id="passage-para-A"
  const { processedHtml, detectedParagraphs } = useMemo(() => {
    if (!section?.contentHtml) return { processedHtml: "", detectedParagraphs: [] };

    const raw = section.contentHtml;
    const foundParagraphs: string[] = [];

    // Replace paragraph markers like <p><strong>A.</strong> or <p><strong>A</strong> or <strong>Paragraph A</strong>
    const enhanced = raw.replace(
      /(<p[^>]*>)?\s*<strong>\s*(?:Paragraph\s+)?([A-H])(?:\.|\:|\s)\s*<\/strong>/gi,
      (match, pTag, letter) => {
        const upper = letter.toUpperCase();
        if (!foundParagraphs.includes(upper)) foundParagraphs.push(upper);
        const prefix = pTag || "";
        return `${prefix}<span id="passage-para-${upper}" class="scroll-mt-14 inline-block mr-2 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-900 font-black text-xs">Paragraph ${upper}</span>`;
      }
    );

    // Also detect any Paragraph A, B headings like <h3>Paragraph A</h3>
    const enhanced2 = enhanced.replace(
      /<h[2-4][^>]*>\s*(?:Paragraph\s+)?([A-H])\b/gi,
      (match, letter) => {
        const upper = letter.toUpperCase();
        if (!foundParagraphs.includes(upper)) foundParagraphs.push(upper);
        return `<span id="passage-para-${upper}" class="scroll-mt-14"></span>${match}`;
      }
    );

    return {
      processedHtml: enhanced2,
      detectedParagraphs: foundParagraphs.sort(),
    };
  }, [section?.contentHtml]);

  // Scroll to target paragraph when targetParagraph changes
  useEffect(() => {
    if (!targetParagraph || !containerRef.current) return;
    const cleanCode = targetParagraph.trim().toUpperCase();
    const targetEl = document.getElementById(`passage-para-${cleanCode}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });

      // Find parent block to highlight temporarily
      const parentPara = targetEl.closest("p") || targetEl.parentElement;
      if (parentPara) {
        parentPara.classList.add("bg-amber-100/60", "transition-colors", "duration-700", "rounded-lg", "p-2");
        const timer = setTimeout(() => {
          parentPara.classList.remove("bg-amber-100/60");
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [targetParagraph]);

  const scrollToPara = (code: string) => {
    const el = document.getElementById(`passage-para-${code}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const parentPara = el.closest("p") || el.parentElement;
      if (parentPara) {
        parentPara.classList.add("bg-amber-100/60", "transition-colors", "duration-700", "rounded-lg", "p-2");
        setTimeout(() => parentPara.classList.remove("bg-amber-100/60"), 2500);
      }
    }
  };

  return (
    <article
      className="flex min-h-[440px] flex-col overflow-hidden bg-white lg:min-h-0 border-b border-slate-200 lg:border-b-0 lg:border-r"
      aria-label="Nội dung bài đọc"
    >
      {/* Passage Panel Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 sm:px-6">
        <div className="min-w-0">
          <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-[#8B3F56]">
            Reading passage {section?.sectionNo ?? 1}
          </span>
          <h2 className="mt-0.5 truncate text-sm font-black text-slate-900">
            {section?.title || `Passage ${section?.sectionNo ?? 1}`}
          </h2>
        </div>

        {/* Font Size Adjuster */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 shadow-2xs" role="group" aria-label="Cỡ chữ bài đọc">
          <button
            type="button"
            onClick={() => onFontSizeChange(p => Math.max(13, p - 1))}
            className="grid size-8 place-items-center text-xs font-bold text-slate-600 transition hover:bg-white hover:text-slate-900 focus-visible:outline-none"
            title="Giảm cỡ chữ (A-)"
          >
            A-
          </button>
          <span className="border-x border-slate-200 px-2 text-[11px] font-bold tabular-nums text-slate-700">
            {fontSize}px
          </span>
          <button
            type="button"
            onClick={() => onFontSizeChange(p => Math.min(22, p + 1))}
            className="grid size-8 place-items-center text-xs font-bold text-slate-600 transition hover:bg-white hover:text-slate-900 focus-visible:outline-none"
            title="Tăng cỡ chữ (A+)"
          >
            A+
          </button>
        </div>
      </div>

      {/* Paragraph Quick Jumper Bar */}
      {detectedParagraphs.length > 0 && (
        <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-slate-100 bg-[#FCFDFD] px-4 py-1.5 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Đoạn:
          </span>
          <div className="flex items-center gap-1">
            {detectedParagraphs.map(code => (
              <button
                key={code}
                type="button"
                onClick={() => scrollToPara(code)}
                className={`grid size-6 place-items-center rounded text-xs font-bold transition ${
                  targetParagraph?.toUpperCase() === code
                    ? "bg-[#8B3F56] text-white shadow-2xs"
                    : "bg-slate-100 text-slate-700 hover:bg-[#F3E6EB] hover:text-[#8B3F56]"
                }`}
                title={`Nhảy tới Paragraph ${code}`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reading Passage Body */}
      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 lg:px-9 lg:py-8 select-text"
      >
        {processedHtml ? (
          <div
            className="prose prose-slate mx-auto max-w-[74ch] font-serif text-[#1F1F1F] leading-[1.8] [&_h1]:font-sans [&_h1]:text-2xl [&_h1]:font-black [&_h2]:font-sans [&_h2]:text-xl [&_h2]:font-bold [&_h3]:font-sans [&_h3]:text-base [&_h3]:font-bold [&_p]:mb-5 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:p-2 [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 selection:bg-[#F3E6EB]"
            style={{ fontSize: `${fontSize}px` }}
            dangerouslySetInnerHTML={{ __html: processedHtml }}
          />
        ) : (
          <div className="mx-auto max-w-sm rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center mt-12">
            <BookOpenText className="mx-auto text-[#8B3F56]" size={32} weight="duotone" />
            <p className="mt-3 text-sm font-bold text-slate-800">Chưa có nội dung Passage</p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Passage được lấy từ đề thi chính thức đã lưu trữ.
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
