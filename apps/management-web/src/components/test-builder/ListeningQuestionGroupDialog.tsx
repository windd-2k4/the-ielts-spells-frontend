import { Check, Headphones, X } from "@phosphor-icons/react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { QuestionGroupAnswerSource, QuestionTypeFormat, SharedOptionItem } from "../../library-types";
import {
  createDefaultSharedOptions,
  defaultWordLimit,
  getReadingQuestionTypeDefinition,
  questionTypeUsesSharedOptions,
  questionTypeUsesWordLimit,
} from "./readingQuestionGroupConfig";

export type ListeningQuestionGroupDraft = {
  typeFormat: QuestionTypeFormat;
  title: string;
  questionCount: number;
  instructions: string;
  wordLimitRule: string;
  requiredAnswerCount?: number;
  sharedOptions: SharedOptionItem[];
  allowOptionReused: boolean;
  linkedAudioTimestamp?: string;
  answerSource?: QuestionGroupAnswerSource;
};

type Props = {
  open: boolean;
  partNo: number;
  startQuestionNo: number;
  currentTimestamp: string;
  createId: () => string;
  onClose: () => void;
  onCreate: (draft: ListeningQuestionGroupDraft) => void;
};

const listeningTypes: QuestionTypeFormat[] = [
  "MULTIPLE_CHOICE",
  "MULTIPLE_ANSWERS",
  "MATCHING_FEATURES",
  "FILL_IN_BLANK",
  "NOTE_COMPLETION",
  "TABLE_COMPLETION",
  "FLOW_CHART_COMPLETION",
  "SUMMARY_COMPLETION",
  "SENTENCE_COMPLETION",
  "SHORT_ANSWER",
  "DIAGRAM_LABELING",
];

const listeningInstructions: Partial<Record<QuestionTypeFormat, string>> = {
  MULTIPLE_CHOICE: "Choose the correct letter, A, B or C.",
  MULTIPLE_ANSWERS: "Choose the correct letters.",
  MATCHING_FEATURES: "Match each item with the correct option from the list below.",
  FILL_IN_BLANK: "Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  NOTE_COMPLETION: "Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  TABLE_COMPLETION: "Complete the table below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  FLOW_CHART_COMPLETION: "Complete the flow-chart below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  SUMMARY_COMPLETION: "Complete the summary below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  SENTENCE_COMPLETION: "Complete the sentences below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  SHORT_ANSWER: "Answer the questions below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  DIAGRAM_LABELING: "Label the map below. Write the correct letter, A-H, next to Questions.",
};

function optionsToText(options: SharedOptionItem[]) {
  return options.map((option) => `${option.code}. ${option.text}`).join("\n");
}

function parseOptions(value: string, createId: () => string): SharedOptionItem[] {
  return value.split("\n").map((line) => line.trim()).filter(Boolean).map((line, index) => {
    const match = line.match(/^([A-Za-z0-9ivxlcdmIVXLCDM]+)[.)-]\s*(.*)$/);
    return { id: createId(), code: match?.[1] ?? String.fromCharCode(65 + index), text: match?.[2] ?? line };
  });
}

export default function ListeningQuestionGroupDialog({
  open,
  partNo,
  startQuestionNo,
  currentTimestamp,
  createId,
  onClose,
  onCreate,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [typeFormat, setTypeFormat] = useState<QuestionTypeFormat>("NOTE_COMPLETION");
  const [diagramSubtype, setDiagramSubtype] = useState<"MATCHING" | "COMPLETION">("MATCHING");
  const [title, setTitle] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [instructions, setInstructions] = useState(listeningInstructions.NOTE_COMPLETION ?? "");
  const [wordLimitRule, setWordLimitRule] = useState(defaultWordLimit("NOTE_COMPLETION"));
  const [requiredAnswerCount, setRequiredAnswerCount] = useState(2);
  const [sharedOptionsText, setSharedOptionsText] = useState("");
  const [allowOptionReused, setAllowOptionReused] = useState(false);
  const [linkTimestamp, setLinkTimestamp] = useState(true);
  const [linkedAudioTimestamp, setLinkedAudioTimestamp] = useState(currentTimestamp);

  const safeCount = Math.min(20, Math.max(1, questionCount || 1));
  const endQuestionNo = startQuestionNo + safeCount - 1;

  const effectiveAnswerSource: QuestionGroupAnswerSource =
    typeFormat === "DIAGRAM_LABELING"
      ? diagramSubtype === "MATCHING" ? "OPTION_BANK" : "PASSAGE"
      : "PASSAGE";

  const usesSharedOptions = questionTypeUsesSharedOptions(typeFormat, effectiveAnswerSource);
  const usesWordLimit = questionTypeUsesWordLimit(typeFormat, effectiveAnswerSource);
  const definition = getReadingQuestionTypeDefinition(typeFormat);
  const usableOptions = useMemo(() => sharedOptionsText.split("\n").map((line) => line.trim()).filter(Boolean).length, [sharedOptionsText]);
  const canCreate = instructions.trim() && (!usesSharedOptions || usableOptions >= 2);

  useEffect(() => {
    if (!open) return;
    setTypeFormat("NOTE_COMPLETION");
    setDiagramSubtype("MATCHING");
    setTitle("");
    setQuestionCount(5);
    setLinkTimestamp(true);
    setLinkedAudioTimestamp(currentTimestamp);
  }, [currentTimestamp, open]);

  useEffect(() => {
    if (!open) return;
    if (typeFormat === "DIAGRAM_LABELING") {
      if (diagramSubtype === "MATCHING") {
        setInstructions(`Label the map below. Write the correct letter, A-H, next to Questions ${startQuestionNo}–${endQuestionNo}.`);
        setWordLimitRule("");
        const options = createDefaultSharedOptions("DIAGRAM_LABELING", createId);
        setSharedOptionsText(optionsToText(options));
      } else {
        setInstructions("Label the plan, map or diagram below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.");
        setWordLimitRule("NO MORE THAN TWO WORDS AND/OR A NUMBER");
        setSharedOptionsText("");
      }
    } else {
      setInstructions(listeningInstructions[typeFormat] ?? definition.defaultInstructions);
      setWordLimitRule(defaultWordLimit(typeFormat));
      const options = usesSharedOptions ? createDefaultSharedOptions(typeFormat, createId) : [];
      setSharedOptionsText(optionsToText(options));
    }
    setRequiredAnswerCount(definition.defaultRequiredAnswerCount ?? 2);
    setAllowOptionReused(typeFormat === "MATCHING_FEATURES");
  }, [createId, definition.defaultInstructions, definition.defaultRequiredAnswerCount, diagramSubtype, endQuestionNo, open, startQuestionNo, typeFormat, usesSharedOptions]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreate) return;
    onCreate({
      typeFormat,
      title: title.trim(),
      questionCount: safeCount,
      instructions: instructions.trim(),
      wordLimitRule: usesWordLimit ? wordLimitRule.trim() : "",
      requiredAnswerCount: typeFormat === "MULTIPLE_ANSWERS" ? requiredAnswerCount : undefined,
      sharedOptions: usesSharedOptions ? parseOptions(sharedOptionsText, createId) : [],
      allowOptionReused: usesSharedOptions && allowOptionReused,
      linkedAudioTimestamp: linkTimestamp ? linkedAudioTimestamp : undefined,
      answerSource: effectiveAnswerSource,
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="listening-group-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form ref={formRef} onSubmit={submit} className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[22px] bg-white shadow-2xl">
        <header className="flex shrink-0 items-start justify-between border-b border-[#e3dce2] px-6 py-5">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#8f4458]">Listening Part {partNo}</p>
            <h2 id="listening-group-title" className="mt-1 font-display text-xl font-bold text-[#211A1D]">Tạo Question Group</h2>
            <p className="mt-1 text-sm text-[#746A6E]">Chọn dạng bài, số câu và mốc audio bắt đầu của nhóm.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng hộp thoại" className="grid size-11 place-items-center rounded-xl border border-[#e3dce2] text-[#746A6E] hover:bg-[#f1eef4]"><X size={20} /></button>
        </header>

        <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,.75fr)]">
            <section>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#746A6E]">Dạng câu hỏi Listening</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {listeningTypes.map((type) => {
                  const item = getReadingQuestionTypeDefinition(type);
                  return <button key={type} type="button" aria-pressed={typeFormat === type} onClick={() => setTypeFormat(type)} className={`flex min-h-[72px] items-start gap-3 rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]/35 ${typeFormat === type ? "border-[#8f4458] bg-[#fff8fa]" : "border-[#e3dce2] hover:bg-[#f8f6fa]"}`}>
                    <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border ${typeFormat === type ? "border-[#8f4458] bg-[#8f4458] text-white" : "border-[#cfc5ca] text-transparent"}`}><Check size={13} weight="bold" /></span>
                    <span><strong className="block text-xs text-[#211A1D]">{type === "DIAGRAM_LABELING" ? "Plan / Map / Diagram Labelling" : item.label}</strong><span className="mt-1 block text-[11px] leading-4 text-[#746A6E]">{item.shortLabel}</span></span>
                  </button>;
                })}
              </div>

              {typeFormat === "DIAGRAM_LABELING" && (
                <div className="mt-4 rounded-2xl border-2 border-[#8f4458]/25 bg-[#fff8fa] p-4">
                  <span className="block text-xs font-extrabold uppercase tracking-wide text-[#8f4458]">
                    Chọn phân loại đề Map / Diagram
                  </span>
                  <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setDiagramSubtype("MATCHING")}
                      className={`flex flex-col rounded-xl border p-3 text-left transition ${
                        diagramSubtype === "MATCHING"
                          ? "border-[#8f4458] bg-white shadow-sm ring-2 ring-[#8f4458]/20"
                          : "border-[#e3dce2] bg-white/70 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`grid size-5 place-items-center rounded-full text-xs font-bold ${
                          diagramSubtype === "MATCHING" ? "bg-[#8f4458] text-white" : "border border-[#cfc5ca] text-transparent"
                        }`}>
                          ✓
                        </span>
                        <strong className="text-xs text-[#211A1D]">Nối chữ cái A–H (Radio Grid)</strong>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-4 text-[#746A6E]">
                        Bản đồ có ký hiệu chữ cái A, B, C, D... Học viên tích chọn chữ cái trên bảng ma trận hàng/cột (chuẩn thi CD-IELTS).
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDiagramSubtype("COMPLETION")}
                      className={`flex flex-col rounded-xl border p-3 text-left transition ${
                        diagramSubtype === "COMPLETION"
                          ? "border-[#8f4458] bg-white shadow-sm ring-2 ring-[#8f4458]/20"
                          : "border-[#e3dce2] bg-white/70 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`grid size-5 place-items-center rounded-full text-xs font-bold ${
                          diagramSubtype === "COMPLETION" ? "bg-[#8f4458] text-white" : "border border-[#cfc5ca] text-transparent"
                        }`}>
                          ✓
                        </span>
                        <strong className="text-xs text-[#211A1D]">Điền từ vào bản đồ (Completion)</strong>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-4 text-[#746A6E]">
                        Bản đồ đánh số các vị trí. Học viên nghe và tự gõ từ cần điền vào từng câu theo giới hạn Word limit.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-5 grid gap-4 rounded-2xl border border-[#e3dce2] bg-[#f8f6fa] p-4 md:grid-cols-[minmax(0,1fr)_150px]">
                <label><span className="mb-1.5 block text-[11px] font-bold text-[#746A6E]">Tiêu đề group</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={`Questions ${startQuestionNo}–${endQuestionNo}`} className="min-h-11 w-full rounded-xl border border-[#e3dce2] bg-white px-3.5 text-sm focus:border-[#8f4458] focus:outline-none" /></label>
                <label><span className="mb-1.5 block text-[11px] font-bold text-[#746A6E]">Số câu hỏi</span><input type="number" min={1} max={20} value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))} className="min-h-11 w-full rounded-xl border border-[#e3dce2] bg-white px-3.5 text-sm font-bold focus:border-[#8f4458] focus:outline-none" /><span className="mt-1 block text-[10px] text-[#746A6E]">Câu {startQuestionNo}–{endQuestionNo}</span></label>
              </div>

              <label className="mt-4 block"><span className="mb-1.5 block text-[11px] font-bold text-[#746A6E]">Instructions</span><textarea rows={3} value={instructions} onChange={(event) => setInstructions(event.target.value)} className="w-full rounded-xl border border-[#e3dce2] p-3 text-sm leading-5 focus:border-[#8f4458] focus:outline-none" /></label>
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-[#ead2da] bg-[#fff8fa] p-4"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f7e7ec] text-[#8f4458]"><Headphones size={18} weight="bold" /></span><div><p className="text-xs font-extrabold text-[#743447]">{definition.label}</p><p className="mt-1 text-[11px] leading-5 text-[#746A6E]">Cấu trúc đáp án sẽ được tạo tự động theo dạng bài.</p></div></div></div>

              <fieldset className="rounded-2xl border border-[#e3dce2] p-4"><legend className="px-1 text-[11px] font-bold text-[#746A6E]">Mốc audio</legend><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={linkTimestamp} onChange={(event) => setLinkTimestamp(event.target.checked)} className="accent-[#8f4458]" /> Gắn group với thời gian hiện tại</label>{linkTimestamp && <input value={linkedAudioTimestamp} onChange={(event) => setLinkedAudioTimestamp(event.target.value)} pattern="[0-9]{2}:[0-9]{2}" className="mt-3 min-h-10 w-full rounded-xl border border-[#e3dce2] px-3 text-sm font-bold tabular-nums focus:border-[#8f4458] focus:outline-none" />}</fieldset>

              {usesWordLimit && <label className="block rounded-2xl border border-[#e3dce2] p-4"><span className="mb-1.5 block text-[11px] font-bold text-[#746A6E]">Giới hạn từ</span><input value={wordLimitRule} onChange={(event) => setWordLimitRule(event.target.value)} className="min-h-10 w-full rounded-xl border border-[#e3dce2] px-3 text-xs focus:border-[#8f4458] focus:outline-none" /></label>}
              {typeFormat === "MULTIPLE_ANSWERS" && <label className="block rounded-2xl border border-[#e3dce2] p-4"><span className="mb-1.5 block text-[11px] font-bold text-[#746A6E]">Số đáp án cần chọn</span><input type="number" min={2} max={6} value={requiredAnswerCount} onChange={(event) => setRequiredAnswerCount(Number(event.target.value))} className="min-h-10 w-full rounded-xl border border-[#e3dce2] px-3 text-xs focus:border-[#8f4458] focus:outline-none" /></label>}
              {usesSharedOptions && <div className="rounded-2xl border border-[#e3dce2] p-4"><label><span className="mb-1.5 block text-[11px] font-bold text-[#746A6E]">Option bank, mỗi dòng một lựa chọn</span><textarea rows={6} value={sharedOptionsText} onChange={(event) => setSharedOptionsText(event.target.value)} className="w-full rounded-xl border border-[#e3dce2] p-3 text-xs leading-5 focus:border-[#8f4458] focus:outline-none" placeholder="A. Student Centre" /></label><label className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#746A6E]"><input type="checkbox" checked={allowOptionReused} onChange={(event) => setAllowOptionReused(event.target.checked)} className="accent-[#8f4458]" /> Cho phép dùng lại option</label></div>}
            </aside>
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-between border-t border-[#e3dce2] bg-[#fbf9fb] px-6 py-4"><button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-[#e3dce2] bg-white px-4 text-sm font-bold">Hủy</button><button type="submit" disabled={!canCreate} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#8f4458] px-5 text-sm font-bold text-white hover:bg-[#743447] disabled:cursor-not-allowed disabled:opacity-45"><Check size={17} weight="bold" /> Tạo {safeCount} câu hỏi</button></footer>
      </form>
    </div>
  );
}
