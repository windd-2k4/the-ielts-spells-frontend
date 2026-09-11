import { BracketsCurly, ListBullets, Paragraph, Plus } from "@phosphor-icons/react";
import { useMemo, useRef } from "react";
import type { QuestionCardItem } from "../../library-types";

type GapFillLayout = "PARAGRAPH" | "LIST";

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

function templateWithSlots(questionCount: number, layout: GapFillLayout) {
  const slots = Array.from({ length: questionCount }, (_, index) => `[[${index + 1}]]`);
  return layout === "LIST"
    ? slots.map((slot) => `• ${slot}  Nội dung cần hoàn thành`).join("\n")
    : `Nhập nội dung summary tại đây. ${slots.map((slot) => `${slot} __________`).join(" ")}`;
}

export function GapFillTemplatePreview({
  template,
  questions,
  layout = "PARAGRAPH",
}: {
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

  return (
    <div className={`whitespace-pre-wrap text-sm leading-7 text-[#211A1D] ${layout === "LIST" ? "rounded-xl bg-white p-4" : ""}`}>
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
  );
}

export default function GapFillGroupEditor({
  title,
  template,
  layout,
  questions,
  onTemplateChange,
  onLayoutChange,
  onAnswerChange,
}: {
  title: string;
  template: string;
  layout: GapFillLayout;
  questions: QuestionCardItem[];
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
    <section className="rounded-2xl border border-[#d8ced6] bg-[#fbf9fb] p-4" aria-label="Trình tạo bài điền từ">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BracketsCurly size={19} weight="bold" className="text-[#8f4458]" />
            <h4 className="font-display text-sm font-extrabold">Soạn nội dung có ô trống</h4>
          </div>
          <p className="mt-1 text-[11px] leading-5 text-[#746A6E]">
            Paste toàn bộ Summary, Note hoặc Form một lần; dùng <strong>[[1]], [[2]]…</strong> để đặt vị trí trả lời.
          </p>
        </div>
        <div className="flex rounded-xl border border-[#e3dce2] bg-white p-1" aria-label="Kiểu trình bày">
          <button type="button" onClick={() => onLayoutChange("PARAGRAPH")} aria-pressed={layout === "PARAGRAPH"} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[11px] font-bold ${layout === "PARAGRAPH" ? "bg-[#f7e7ec] text-[#743447]" : "text-[#746A6E]"}`}><Paragraph size={15} /> Đoạn văn</button>
          <button type="button" onClick={() => onLayoutChange("LIST")} aria-pressed={layout === "LIST"} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[11px] font-bold ${layout === "LIST" ? "bg-[#f7e7ec] text-[#743447]" : "text-[#746A6E]"}`}><ListBullets size={15} /> Danh sách</button>
        </div>
      </div>

      <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor={`gap-template-${questions[0]?.id ?? title}`} className="text-[11px] font-bold text-[#746A6E]">Nội dung đề bài</label>
          <textarea
            ref={textareaRef}
            id={`gap-template-${questions[0]?.id ?? title}`}
            rows={9}
            value={template}
            spellCheck
            lang="en"
            onChange={(event) => onTemplateChange(event.target.value)}
            placeholder="Ví dụ: Bondi Beach attracts many [[1]] during the holidays..."
            className="mt-1 w-full resize-y rounded-xl border border-[#d8ced6] bg-white p-3 text-sm leading-6 focus:border-[#8f4458] focus:outline-none focus:ring-2 focus:ring-[#8f4458]/10"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="button" onClick={insertNextSlot} disabled={inspection.missing.length === 0} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#8f4458] bg-white px-3 text-xs font-bold text-[#8f4458] hover:bg-[#f7e7ec] disabled:cursor-not-allowed disabled:border-[#d8ced6] disabled:text-[#9a9195] disabled:hover:bg-white"><Plus size={15} /> {inspection.missing.length === 0 ? "Đã đủ vị trí" : "Chèn ô tiếp theo"}</button>
            <button type="button" onClick={() => onTemplateChange(templateWithSlots(questions.length, layout))} className="min-h-10 rounded-xl border border-[#e3dce2] bg-white px-3 text-xs font-bold text-[#746A6E] hover:bg-[#f1eef4]">Tạo mẫu {questions.length} ô</button>
          </div>
        </div>

        <div className="min-w-0 rounded-xl border border-[#e3dce2] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#746A6E]">Xem trước học viên</span>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${issueCount ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}>{issueCount ? `${issueCount} lỗi vị trí` : `${questions.length}/${questions.length} ô hợp lệ`}</span>
          </div>
          <div className="mt-3 min-h-[176px] overflow-hidden rounded-xl border border-dashed border-[#d8ced6] bg-[#fffdfd] p-4">
            {template.trim() ? <GapFillTemplatePreview template={template} questions={questions} layout={layout} /> : <p className="text-center text-xs leading-5 text-[#746A6E]">Nội dung xem trước sẽ xuất hiện ở đây sau khi nhập mẫu.</p>}
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
              return <tr key={question.id} className="border-t border-[#eee8ed]"><td className="px-3 py-2.5 font-bold text-[#8f4458]">[[{slot}]] → Câu {question.number}</td><td className="px-3 py-2.5"><input aria-label={`Đáp án đúng câu ${question.number}`} value={question.correctAnswers.join(", ")} onChange={(event) => onAnswerChange(question.id, event.target.value.split(",").map((item) => item.trim()).filter(Boolean), question.acceptableAnswers ?? [])} placeholder="VD: tourists" className="min-h-10 w-full rounded-lg border border-[#e3dce2] px-3 focus:border-[#8f4458] focus:outline-none" /></td><td className="px-3 py-2.5"><input aria-label={`Đáp án chấp nhận thêm câu ${question.number}`} value={(question.acceptableAnswers ?? []).join(", ")} onChange={(event) => onAnswerChange(question.id, question.correctAnswers, event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} placeholder="Các biến thể, cách nhau bằng dấu phẩy" className="min-h-10 w-full rounded-lg border border-[#e3dce2] px-3 focus:border-[#8f4458] focus:outline-none" /></td><td className="px-3 py-2.5"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${present && question.correctAnswers.length ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-[#b4232d]"}`}>{present && question.correctAnswers.length ? "Hoàn tất" : !present ? "Thiếu vị trí" : "Thiếu đáp án"}</span></td></tr>;
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
