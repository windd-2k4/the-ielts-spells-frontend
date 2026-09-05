import {
  Check,
  ListBullets,
  ListNumbers,
  SlidersHorizontal,
  X,
} from "@phosphor-icons/react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  QuestionGroupAnswerSource,
  QuestionTypeFormat,
  SharedOptionItem,
} from "../../library-types";
import {
  createDefaultSharedOptions,
  defaultWordLimit,
  getReadingQuestionTypeDefinition,
  questionTypeUsesSharedOptions,
  questionTypeUsesWordLimit,
  readingQuestionCategories,
  readingQuestionTypeDefinitions,
  type ReadingQuestionCategory,
} from "./readingQuestionGroupConfig";

export type ReadingQuestionGroupDraft = {
  typeFormat: QuestionTypeFormat;
  title: string;
  questionCount: number;
  instructions: string;
  wordLimitRule: string;
  answerSource: QuestionGroupAnswerSource;
  requiredAnswerCount?: number;
  sharedOptions: SharedOptionItem[];
  allowOptionReused: boolean;
};

type Props = {
  open: boolean;
  startQuestionNo: number;
  createId: () => string;
  onClose: () => void;
  onCreate: (draft: ReadingQuestionGroupDraft) => void;
};

function optionsToText(options: SharedOptionItem[]) {
  return options.map((option) => `${option.code}. ${option.text}`).join("\n");
}

function parseOptions(value: string, createId: () => string): SharedOptionItem[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const match = line.match(/^([A-Za-z0-9ivxlcdmIVXLCDM]+)[.)-]\s*(.*)$/);
      return {
        id: createId(),
        code: match?.[1] ?? String(index + 1),
        text: match?.[2] ?? line,
      };
    });
}

export default function ReadingQuestionGroupDialog({
  open,
  startQuestionNo,
  createId,
  onClose,
  onCreate,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<ReadingQuestionCategory>("CHOICE");
  const [typeFormat, setTypeFormat] = useState<QuestionTypeFormat>("MULTIPLE_CHOICE");
  const [title, setTitle] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [instructions, setInstructions] = useState("");
  const [wordLimitRule, setWordLimitRule] = useState("");
  const [answerSource, setAnswerSource] = useState<QuestionGroupAnswerSource>("PASSAGE");
  const [requiredAnswerCount, setRequiredAnswerCount] = useState(2);
  const [sharedOptionsText, setSharedOptionsText] = useState("");
  const [allowOptionReused, setAllowOptionReused] = useState(false);

  const definition = getReadingQuestionTypeDefinition(typeFormat);
  const safeQuestionCount = Math.min(20, Math.max(1, questionCount || 1));
  const endQuestionNo = startQuestionNo + safeQuestionCount - 1;
  const visibleTypes = useMemo(
    () => readingQuestionTypeDefinitions.filter((item) => item.category === category),
    [category],
  );
  const usesSharedOptions = questionTypeUsesSharedOptions(typeFormat, answerSource);
  const usesWordLimit = questionTypeUsesWordLimit(typeFormat, answerSource);
  const usableSharedOptionCount = sharedOptionsText
    .split("\n")
    .map((line) => line.replace(/^([A-Za-z0-9ivxlcdmIVXLCDM]+)[.)-]\s*/, "").trim())
    .filter(Boolean).length;
  const canCreate = Boolean(instructions.trim()) && (!usesSharedOptions || usableSharedOptionCount >= 2);

  useEffect(() => {
    if (!open) return;
    setCategory("CHOICE");
    setTypeFormat("MULTIPLE_CHOICE");
    setTitle("");
    setQuestionCount(5);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => titleRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !formRef.current) return;
      const focusable = Array.from(formRef.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])",
      ));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return;
    const nextDefinition = getReadingQuestionTypeDefinition(typeFormat);
    setInstructions(nextDefinition.defaultInstructions);
    setWordLimitRule(defaultWordLimit(typeFormat));
    setAnswerSource(nextDefinition.defaultAnswerSource ?? "PASSAGE");
    setRequiredAnswerCount(nextDefinition.defaultRequiredAnswerCount ?? 2);
    setAllowOptionReused(typeFormat !== "MATCHING_SENTENCE_ENDINGS");
    const defaults = nextDefinition.usesSharedOptions
      ? createDefaultSharedOptions(typeFormat, createId)
      : [];
    setSharedOptionsText(optionsToText(defaults));
  }, [createId, open, typeFormat]);

  if (!open) return null;

  function selectType(nextType: QuestionTypeFormat) {
    setTypeFormat(nextType);
    setTitle("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const safeCount = safeQuestionCount;
    onCreate({
      typeFormat,
      title: title.trim(),
      questionCount: safeCount,
      instructions: instructions.trim(),
      wordLimitRule: usesWordLimit ? wordLimitRule.trim() : "",
      answerSource,
      requiredAnswerCount: typeFormat === "MULTIPLE_ANSWERS" ? requiredAnswerCount : undefined,
      sharedOptions: usesSharedOptions ? parseOptions(sharedOptionsText, createId) : [],
      allowOptionReused: usesSharedOptions && allowOptionReused,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reading-group-dialog-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[22px] bg-white shadow-2xl"
      >
        <header className="flex shrink-0 items-start justify-between border-b border-[#e3dce2] px-6 py-5">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#8f4458]">Reading Test Builder</p>
            <h2 id="reading-group-dialog-title" className="mt-1 font-display text-xl font-bold text-[#211A1D]">
              Tạo Question Group
            </h2>
            <p className="mt-1 text-sm text-[#746A6E]">
              Chọn đúng dạng bài để hệ thống tạo cấu trúc câu hỏi và đáp án phù hợp.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-xl border border-[#e3dce2] text-[#746A6E] transition hover:bg-[#f1eef4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]/35"
            aria-label="Đóng hộp thoại"
          >
            <X size={20} />
          </button>
        </header>

        <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(290px,.7fr)]">
            <section>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#746A6E]">1. Chọn dạng bài</h3>
              <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4" role="tablist" aria-label="Nhóm dạng câu hỏi">
                {readingQuestionCategories.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    role="tab"
                    aria-selected={category === item.value}
                    onClick={() => {
                      setCategory(item.value);
                      const firstType = readingQuestionTypeDefinitions.find((definitionItem) => definitionItem.category === item.value);
                      if (firstType) selectType(firstType.type);
                    }}
                    className={`min-h-14 rounded-xl border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]/35 ${
                      category === item.value
                        ? "border-[#8f4458] bg-[#f7e7ec] text-[#743447]"
                        : "border-[#e3dce2] bg-white text-[#746A6E] hover:bg-[#f8f6fa]"
                    }`}
                  >
                    <span className="block text-xs font-extrabold">{item.label}</span>
                    <span className="mt-0.5 block text-[10px] leading-4">{item.description}</span>
                  </button>
                ))}
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {visibleTypes.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => selectType(item.type)}
                    className={`flex min-h-[76px] items-start gap-3 rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]/35 ${
                      typeFormat === item.type
                        ? "border-[#8f4458] bg-[#fff8fa] shadow-sm"
                        : "border-[#e3dce2] bg-white hover:border-[#caaab4] hover:bg-[#fbf9fb]"
                    }`}
                    aria-pressed={typeFormat === item.type}
                  >
                    <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                      typeFormat === item.type ? "border-[#8f4458] bg-[#8f4458] text-white" : "border-[#cfc5ca] text-transparent"
                    }`}>
                      <Check size={13} weight="bold" />
                    </span>
                    <span>
                      <strong className="block text-xs text-[#211A1D]">{item.label}</strong>
                      <span className="mt-1 block text-[11px] leading-4 text-[#746A6E]">{item.shortLabel}</span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-5 grid gap-4 rounded-2xl border border-[#e3dce2] bg-[#f8f6fa] p-4 md:grid-cols-[minmax(0,1fr)_150px]">
                <label>
                  <span className="mb-1.5 block text-[11px] font-bold text-[#746A6E]">Tiêu đề Question Group</span>
                  <input
                    ref={titleRef}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={`Để trống để dùng Questions ${startQuestionNo}–${endQuestionNo}`}
                    className="min-h-11 w-full rounded-xl border border-[#e3dce2] bg-white px-3.5 text-sm focus:border-[#8f4458] focus:outline-none focus:ring-2 focus:ring-[#8f4458]/10"
                  />
                  <span className="mt-1 block text-[10px] text-[#746A6E]">Có thể đặt tên theo nội dung, ví dụ “Vitamin classification”.</span>
                </label>
                <label>
                  <span className="mb-1.5 block text-[11px] font-bold text-[#746A6E]">Số lượng câu hỏi</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={questionCount}
                    onChange={(event) => setQuestionCount(Math.min(20, Math.max(1, Number(event.target.value) || 1)))}
                    className="min-h-11 w-full rounded-xl border border-[#e3dce2] bg-white px-3.5 text-sm font-bold focus:border-[#8f4458] focus:outline-none focus:ring-2 focus:ring-[#8f4458]/10"
                  />
                  <span className="mt-1 block text-[10px] text-[#746A6E]">Câu {startQuestionNo} đến {endQuestionNo}</span>
                </label>
              </div>

              <label className="mt-4 block">
                <span className="mb-1.5 block text-[11px] font-bold text-[#746A6E]">Instructions hiển thị cho học viên</span>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                  className="w-full rounded-xl border border-[#e3dce2] p-3 text-sm leading-5 focus:border-[#8f4458] focus:outline-none focus:ring-2 focus:ring-[#8f4458]/10"
                />
              </label>
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-[#ead2da] bg-[#fff8fa] p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f7e7ec] text-[#8f4458]">
                    <SlidersHorizontal size={18} weight="bold" />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold text-[#743447]">{definition.label}</p>
                    <p className="mt-1 text-[11px] leading-5 text-[#746A6E]">{definition.description}</p>
                  </div>
                </div>
              </div>

              {definition.supportsOptionBank && (
                <fieldset className="rounded-2xl border border-[#e3dce2] p-4">
                  <legend className="px-1 text-[11px] font-bold text-[#746A6E]">Nguồn đáp án</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {(["PASSAGE", "OPTION_BANK"] as QuestionGroupAnswerSource[]).map((source) => (
                      <button
                        key={source}
                        type="button"
                        onClick={() => {
                          setAnswerSource(source);
                          if (source === "OPTION_BANK" && !sharedOptionsText.trim()) {
                            setSharedOptionsText(optionsToText(createDefaultSharedOptions(typeFormat, createId)));
                          }
                        }}
                        className={`min-h-10 rounded-xl border px-2 text-[11px] font-bold ${
                          answerSource === source
                            ? "border-[#8f4458] bg-[#f7e7ec] text-[#743447]"
                            : "border-[#e3dce2] text-[#746A6E]"
                        }`}
                      >
                        {source === "PASSAGE" ? "Từ passage" : "Option bank"}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {usesWordLimit && (
                <label className="block rounded-2xl border border-[#e3dce2] p-4">
                  <span className="mb-1.5 block text-[11px] font-bold text-[#746A6E]">Giới hạn từ</span>
                  <input
                    value={wordLimitRule}
                    onChange={(event) => setWordLimitRule(event.target.value)}
                    className="min-h-10 w-full rounded-xl border border-[#e3dce2] px-3 text-xs focus:border-[#8f4458] focus:outline-none"
                  />
                </label>
              )}

              {typeFormat === "MULTIPLE_ANSWERS" && (
                <label className="block rounded-2xl border border-[#e3dce2] p-4">
                  <span className="mb-1.5 block text-[11px] font-bold text-[#746A6E]">Số đáp án cần chọn mỗi câu</span>
                  <input
                    type="number"
                    min={2}
                    max={6}
                    value={requiredAnswerCount}
                    onChange={(event) => setRequiredAnswerCount(Number(event.target.value))}
                    className="min-h-10 w-full rounded-xl border border-[#e3dce2] px-3 text-xs focus:border-[#8f4458] focus:outline-none"
                  />
                </label>
              )}

              {usesSharedOptions && (
                <div className="rounded-2xl border border-[#e3dce2] p-4">
                  <label>
                    <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-[#746A6E]">
                      <ListBullets size={14} /> Option bank dùng chung
                    </span>
                    <textarea
                      rows={7}
                      value={sharedOptionsText}
                      onChange={(event) => setSharedOptionsText(event.target.value)}
                      placeholder={"A. Option one\nB. Option two"}
                      className="w-full rounded-xl border border-[#e3dce2] p-3 font-mono text-[11px] leading-5 focus:border-[#8f4458] focus:outline-none"
                    />
                    {usableSharedOptionCount < 2 && (
                      <span className="mt-1.5 block text-[10px] font-semibold text-[#b4232d]">
                        Nhập ít nhất hai option có nội dung trước khi tạo group.
                      </span>
                    )}
                  </label>
                  <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#f8f6fa] px-3 text-[11px] font-semibold text-[#746A6E]">
                    <input
                      type="checkbox"
                      checked={allowOptionReused}
                      onChange={(event) => setAllowOptionReused(event.target.checked)}
                      className="accent-[#8f4458]"
                    />
                    Một option có thể dùng cho nhiều câu
                  </label>
                </div>
              )}

              <div className="rounded-2xl border border-[#e3dce2] bg-[#f8f6fa] p-4">
                <p className="flex items-center gap-2 text-[11px] font-extrabold text-[#211A1D]">
                  <ListNumbers size={15} /> Cấu trúc sẽ tạo
                </p>
                <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 text-[11px]">
                  <dt className="text-[#746A6E]">Dạng bài</dt><dd className="font-bold text-[#211A1D]">{definition.label}</dd>
                  <dt className="text-[#746A6E]">Khoảng câu</dt><dd className="font-bold text-[#211A1D]">{startQuestionNo}–{endQuestionNo}</dd>
                  <dt className="text-[#746A6E]">Số card</dt><dd className="font-bold text-[#211A1D]">{safeQuestionCount}</dd>
                </dl>
              </div>
            </aside>
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-[#e3dce2] bg-white px-6 py-4">
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl px-4 text-sm font-bold text-[#746A6E] hover:bg-[#f1eef4]">
            Hủy
          </button>
          <button
            type="submit"
            disabled={!canCreate}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#8f4458] px-5 text-sm font-bold text-white transition hover:bg-[#743447] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]/35 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Check size={17} weight="bold" /> Tạo {safeQuestionCount} câu hỏi
          </button>
        </footer>
      </form>
    </div>
  );
}
