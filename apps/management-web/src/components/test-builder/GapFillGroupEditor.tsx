import { BracketsCurly, ListBullets, Paragraph, Plus, Table } from "@phosphor-icons/react";
import { useMemo, useRef } from "react";
import type { QuestionCardItem, SharedOptionItem } from "../../library-types";

export type GapFillLayout = "PARAGRAPH" | "LIST" | "TABLE";

const TOKEN_PATTERN = /\[\[(\d+)\]\]/g;

export function gapFillPrompt(template: string, slot: number, fallbackTitle: string) {
  const token = `[[${slot}]]`;
  const line = template.split(/\r?\n/).find((item) => item.includes(token));
  if (line?.trim()) return line.trim().replace(token, "_____");
  return `${fallbackTitle} — ô trống ${slot}`;
}

export function gapFillTemplateFromQuestions(questions: QuestionCardItem[]) {
  return questions.map((question, index) => {
    const prompt = question.prompt.trim();
    const token = `[[${index + 1}]]`;
    if (!prompt) return token;
    return /_{2,}/.test(prompt) ? prompt.replace(/_{2,}/, token) : `${prompt} ${token}`;
  }).join("\n");
}

export function inspectGapFillTemplate(template: string, questionCount: number) {
  const counts = new Map<number, number>();
  for (const match of template.matchAll(TOKEN_PATTERN)) {
    const slot = Number(match[1]);
    counts.set(slot, (counts.get(slot) ?? 0) + 1);
  }
  const missing = Array.from({ length: questionCount }, (_, index) => index + 1).filter((slot) => !counts.has(slot));
  const duplicated = [...counts].filter(([, count]) => count > 1).map(([slot]) => slot);
  const invalid = [...counts.keys()].filter((slot) => slot < 1 || slot > questionCount);
  return { missing, duplicated, invalid };
}

export function normalizeGapFillMarkers(value: string) {
  return value
    .replace(/\[\s*(\d+)\s*\](?!\])/g, "[[$1]]")
    .replace(/\{\s*(\d+)\s*\}/g, "[[$1]]");
}

function templateWithSlots(questionCount: number, layout: GapFillLayout) {
  const slots = Array.from({ length: questionCount }, (_, index) => `[[${index + 1}]]`);
  if (layout === "TABLE") {
    const lines: string[] = [
      "| Course | Details | Cost | Notes |",
      "| --- | --- | --- | --- |",
    ];
    let slotIdx = 0;
    let rowNum = 1;
    while (slotIdx < slots.length) {
      const s1 = slots[slotIdx++] ?? "";
      const s2 = slotIdx < slots.length ? slots[slotIdx++] : "";
      const s3 = slotIdx < slots.length ? slots[slotIdx++] : "";
      lines.push(`| Course ${rowNum++} | • one day<br>• make a small ${s1} | £ ${s2 ? `${s2} (includes materials)` : "120"} | tutor: Lydia ${s3 || "..."} |`);
    }
    return lines.join("\n");
  }
  return layout === "LIST"
    ? slots.map((slot) => `• ${slot}  Nội dung cần hoàn thành`).join("\n")
    : `Nhập nội dung summary tại đây. ${slots.map((slot) => `${slot} __________`).join(" ")}`;
}

function renderTokensInText(text: string, questions: QuestionCardItem[]) {
  const parts: Array<{ text?: string; slot?: number; offset: number }> = [];
  let cursor = 0;
  for (const match of text.matchAll(TOKEN_PATTERN)) {
    if (match.index > cursor) parts.push({ text: text.slice(cursor, match.index), offset: cursor });
    parts.push({ slot: Number(match[1]), offset: match.index });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), offset: cursor });

  return parts.map((part) => {
    if (part.text !== undefined) return <span key={`text-${part.offset}`}>{part.text}</span>;
    const question = questions[Number(part.slot) - 1];
    if (!question) return <span key={`invalid-${part.offset}`} className="font-bold text-[#b4232d]">[[{part.slot}]]</span>;
    return (
      <span key={`slot-${part.offset}`} className="mx-1 inline-flex min-w-[70px] items-center justify-center rounded-md border border-[#8f4458] bg-[#fbf5f7] px-2 py-0.5 text-xs font-bold text-[#8f4458]">
        {question.number}
      </span>
    );
  });
}

export function GapFillTemplatePreview({
  heading,
  template,
  questions,
  layout = "PARAGRAPH",
}: {
  heading?: string;
  template: string;
  questions: QuestionCardItem[];
  layout?: GapFillLayout;
}) {
  const parts = useMemo(() => {
    const result: Array<{ text?: string; slot?: number; offset: number }> = [];
    let cursor = 0;
    for (const match of template.matchAll(TOKEN_PATTERN)) {
      if (match.index > cursor) result.push({ text: template.slice(cursor, match.index), offset: cursor });
      result.push({ slot: Number(match[1]), offset: match.index });
      cursor = match.index + match[0].length;
    }
    if (cursor < template.length) result.push({ text: template.slice(cursor), offset: cursor });
    return result;
  }, [template]);
  const isTable = layout === "TABLE" || (template.includes("|") && template.includes("\n"));

  if (isTable) {
    const rawLines = template.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const tableLines = rawLines.filter((l) => l.startsWith("|") || l.includes(" | "));
    if (tableLines.length >= 2) {
      const nonSep = tableLines.filter((l) => !/^[|\s-:]+$/.test(l));
      if (nonSep.length >= 1) {
        const headers = nonSep[0].split("|").map((c) => c.trim()).filter((c, idx, arr) => (idx > 0 && idx < arr.length - 1) || c.length > 0);
        const rows = nonSep.slice(1).map((line) => line.split("|").map((c) => c.trim()).filter((c, idx, arr) => (idx > 0 && idx < arr.length - 1) || c.length > 0));

        return (
          <div>
            {heading?.trim() ? <h5 className="mb-3 text-center text-sm font-extrabold text-[#211A1D]">{heading.trim()}</h5> : null}
            <div className="overflow-x-auto rounded-xl border border-[#e3dce2] bg-white">
              <table className="w-full border-collapse text-left text-xs">
              {headers.length > 0 && (
                <thead className="bg-[#f8f6fa] text-[#746A6E] font-bold">
                  <tr>
                    {headers.map((h, i) => (
                      <th key={i} className="border border-[#e3dce2] px-3 py-2">{renderTokensInText(h, questions)}</th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/50">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="border border-[#e3dce2] px-3 py-2 align-top leading-6">
                        {renderTokensInText(cell, questions)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        );
      }
    }
  }

  return (
    <div className={layout === "LIST" ? "rounded-xl bg-white p-4" : ""}>
      {heading?.trim() ? <h5 className="mb-3 text-center text-sm font-extrabold text-[#211A1D]">{heading.trim()}</h5> : null}
      <div className="whitespace-pre-wrap text-sm leading-7 text-[#211A1D]">
        {parts.map((part) => {
          if (part.text !== undefined) return <span key={`text-${part.offset}`}>{part.text}</span>;
          const question = questions[Number(part.slot) - 1];
          if (!question) return <span key={`invalid-${part.offset}`} className="font-bold text-[#b4232d]">[[{part.slot}]]</span>;
          return (
            <span key={`slot-${part.offset}`} className="mx-1 inline-flex min-w-[112px] items-end gap-1.5 whitespace-nowrap align-baseline">
              <strong className="text-xs tabular-nums text-[#8f4458]">{question.number}</strong>
              <span className="mb-1 inline-block min-w-[80px] border-b-2 border-[#8f4458]" aria-label={`Ô trả lời câu ${question.number}`} />
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function GapFillGroupEditor({
  title,
  heading,
  template,
  layout,
  questions,
  sharedOptions,
  onHeadingChange,
  onTemplateChange,
  onLayoutChange,
  onAnswerChange,
}: {
  title: string;
  heading: string;
  template: string;
  layout: GapFillLayout;
  questions: QuestionCardItem[];
  sharedOptions?: SharedOptionItem[];
  onHeadingChange: (value: string) => void;
  onTemplateChange: (value: string) => void;
  onLayoutChange: (value: GapFillLayout) => void;
  onAnswerChange: (questionId: string, correctAnswers: string[], acceptableAnswers: string[]) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inspection = useMemo(() => inspectGapFillTemplate(template, questions.length), [questions.length, template]);
  const issueCount = inspection.missing.length + inspection.duplicated.length + inspection.invalid.length;

  function insertNextSlot() {
    const next = inspection.missing[0];
    if (next === undefined) return;
    const token = `[[${next}]]`;
    const textarea = textareaRef.current;
    if (!textarea) {
      onTemplateChange(`${template}${template ? " " : ""}${token}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextValue = `${template.slice(0, start)}${token}${template.slice(end)}`;
    onTemplateChange(nextValue);
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    });
  }

  return (
    <section className="rounded-xl border border-[#d8ced6] bg-[#fbf9fb] p-3.5" aria-label="Trình tạo bài điền từ">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BracketsCurly size={19} weight="bold" className="text-[#8f4458]" />
            <h4 className="font-display text-sm font-extrabold">Soạn nội dung có ô trống</h4>
          </div>
          <p className="mt-1 text-[11px] leading-5 text-[#746A6E]">
            Dán toàn bộ nội dung một lần; dùng <strong>[[1]], [[2]]…</strong> để đặt vị trí. Hệ thống tự nhận cả <strong>[1]</strong> và <strong>{`{1}`}</strong>.
          </p>
        </div>
        <div className="flex rounded-xl border border-[#e3dce2] bg-white p-1" aria-label="Kiểu trình bày">
          <button type="button" onClick={() => onLayoutChange("PARAGRAPH")} aria-pressed={layout === "PARAGRAPH"} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[11px] font-bold ${layout === "PARAGRAPH" ? "bg-[#f7e7ec] text-[#743447]" : "text-[#746A6E]"}`}><Paragraph size={15} /> Đoạn văn</button>
          <button type="button" onClick={() => onLayoutChange("LIST")} aria-pressed={layout === "LIST"} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[11px] font-bold ${layout === "LIST" ? "bg-[#f7e7ec] text-[#743447]" : "text-[#746A6E]"}`}><ListBullets size={15} /> Danh sách</button>
          <button type="button" onClick={() => onLayoutChange("TABLE")} aria-pressed={layout === "TABLE"} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[11px] font-bold ${layout === "TABLE" ? "bg-[#f7e7ec] text-[#743447]" : "text-[#746A6E]"}`}><Table size={15} /> Điền bảng</button>
        </div>
      </div>

      <div className="mt-3 grid min-w-0 gap-3">
        <label className="min-w-0">
          <span className="text-[11px] font-bold text-[#746A6E]">
            Tiêu đề hiển thị <span className="font-medium text-[#9A9195]">(không bắt buộc)</span>
          </span>
          <input
            value={heading}
            maxLength={160}
            onChange={(event) => onHeadingChange(event.target.value)}
            placeholder="Ví dụ: Later research on the effect"
            className="mt-1 min-h-10 w-full rounded-xl border border-[#d8ced6] bg-white px-3 text-sm font-bold text-[#211A1D] placeholder:font-normal placeholder:text-[#9A9195] focus:border-[#8f4458] focus:outline-none focus:ring-2 focus:ring-[#8f4458]/10"
          />
        </label>
        <div className="min-w-0">
          <label htmlFor={`gap-template-${questions[0]?.id ?? title}`} className="text-[11px] font-bold text-[#746A6E]">Nội dung đề bài</label>
          <textarea
            ref={textareaRef}
            id={`gap-template-${questions[0]?.id ?? title}`}
            rows={12}
            value={template}
            spellCheck
            lang="en"
            onChange={(event) => onTemplateChange(normalizeGapFillMarkers(event.target.value))}
            placeholder={layout === "TABLE" ? "| Cột 1 | Cột 2 | Cột 3 |\n| --- | --- | --- |\n| Hàng 1 | [[1]] | [[2]] |" : "Ví dụ: Bondi Beach attracts many [[1]] during the holidays..."}
            className="mt-1 min-h-[260px] w-full resize-y rounded-xl border border-[#d8ced6] bg-white p-3 font-mono text-sm leading-6 focus:border-[#8f4458] focus:outline-none focus:ring-2 focus:ring-[#8f4458]/10"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="button" onClick={insertNextSlot} disabled={inspection.missing.length === 0} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#8f4458] bg-white px-3 text-xs font-bold text-[#8f4458] hover:bg-[#f7e7ec] disabled:cursor-not-allowed disabled:border-[#d8ced6] disabled:text-[#9a9195] disabled:hover:bg-white"><Plus size={15} /> {inspection.missing.length === 0 ? "Đã đủ vị trí" : "Chèn ô tiếp theo"}</button>
            <button type="button" onClick={() => onTemplateChange(templateWithSlots(questions.length, layout))} className="min-h-10 rounded-xl border border-[#e3dce2] bg-white px-3 text-xs font-bold text-[#746A6E] hover:bg-[#f1eef4]">Tạo mẫu {layout === "TABLE" ? "bảng" : layout === "LIST" ? "danh sách" : "đoạn"} {questions.length} ô</button>
          </div>
        </div>

        <div className="min-w-0 rounded-xl border border-[#e3dce2] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#746A6E]">Xem trước học viên</span>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${issueCount ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}>{issueCount ? `${issueCount} lỗi vị trí` : `${questions.length}/${questions.length} ô hợp lệ`}</span>
          </div>
          <div className="mt-3 min-h-[150px] overflow-hidden rounded-xl border border-dashed border-[#d8ced6] bg-[#fffdfd] p-4">
            {heading.trim() || template.trim() ? <GapFillTemplatePreview heading={heading} template={template} questions={questions} layout={layout} /> : <p className="text-center text-xs leading-5 text-[#746A6E]">Nội dung xem trước sẽ xuất hiện ở đây sau khi nhập mẫu.</p>}
          </div>
          {issueCount > 0 && (
            <div role="alert" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-900">
              {inspection.missing.length > 0 && <p>Thiếu ô: {inspection.missing.map((slot) => `[[${slot}]]`).join(", ")}</p>}
              {inspection.duplicated.length > 0 && <p>Ô bị lặp: {inspection.duplicated.map((slot) => `[[${slot}]]`).join(", ")}</p>}
              {inspection.invalid.length > 0 && <p>Ô ngoài phạm vi: {inspection.invalid.map((slot) => `[[${slot}]]`).join(", ")}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-[#e3dce2] bg-white">
        <table className="w-full min-w-[660px] border-collapse text-left text-xs">
          <thead className="bg-[#f1eef4] text-[10px] uppercase tracking-wide text-[#746A6E]"><tr><th className="w-28 px-3 py-2.5">Vị trí</th><th className="px-3 py-2.5">Đáp án đúng</th><th className="px-3 py-2.5">Đáp án chấp nhận thêm</th><th className="w-24 px-3 py-2.5">Trạng thái</th></tr></thead>
          <tbody>
            {questions.map((question, index) => {
              const slot = index + 1;
              const present = !inspection.missing.includes(slot);
              return <tr key={question.id} className="border-t border-[#eee8ed]"><td className="px-3 py-2.5 font-bold text-[#8f4458]">[[{slot}]] → Câu {question.number}</td><td className="px-3 py-2.5">{sharedOptions?.length ? <select aria-label={`Đáp án đúng câu ${question.number}`} value={question.correctAnswers[0] ?? ""} onChange={(event) => onAnswerChange(question.id, event.target.value ? [event.target.value] : [], [])} className="min-h-10 w-full rounded-lg border border-[#e3dce2] bg-white px-3 focus:border-[#8f4458] focus:outline-none"><option value="">Chọn đáp án từ Option bank</option>{sharedOptions.map((option) => <option key={option.id} value={option.id}>{option.code}. {option.text || "Chưa nhập nội dung"}</option>)}</select> : <input aria-label={`Đáp án đúng câu ${question.number}`} value={question.correctAnswers.join(", ")} onChange={(event) => onAnswerChange(question.id, event.target.value.split(",").map((item) => item.trim()).filter(Boolean), question.acceptableAnswers ?? [])} placeholder="VD: tourists" className="min-h-10 w-full rounded-lg border border-[#e3dce2] px-3 focus:border-[#8f4458] focus:outline-none" />}</td><td className="px-3 py-2.5">{sharedOptions?.length ? <span className="text-[11px] text-[#746A6E]">Không áp dụng với Option bank</span> : <input aria-label={`Đáp án chấp nhận thêm câu ${question.number}`} value={(question.acceptableAnswers ?? []).join(", ")} onChange={(event) => onAnswerChange(question.id, question.correctAnswers, event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} placeholder="Các biến thể, cách nhau bằng dấu phẩy" className="min-h-10 w-full rounded-lg border border-[#e3dce2] px-3 focus:border-[#8f4458] focus:outline-none" />}</td><td className="px-3 py-2.5"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${present && question.correctAnswers.length ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-[#b4232d]"}`}>{present && question.correctAnswers.length ? "Hoàn tất" : !present ? "Thiếu vị trí" : "Thiếu đáp án"}</span></td></tr>;
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
