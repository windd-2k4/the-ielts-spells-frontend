import { CheckCircle, XCircle, MinusCircle, Info } from "@phosphor-icons/react";
import { useMemo } from "react";
import type { ReadingQuestionGroupItem, ReadingQuestionItem } from "./reviewTypes";
import { getQuestionState, parseMultipleChoiceOptions } from "./reviewUtils";

type Props = {
  group: ReadingQuestionGroupItem;
  selectedQuestionKey: string;
  onSelectQuestionKey: (key: string) => void;
};

export default function MultipleChoiceReview({
  group,
  selectedQuestionKey,
  onSelectQuestionKey,
}: Props) {
  return (
    <div className="space-y-4">
      {group.questions.map(question => (
        <MultipleChoiceItem
          key={question.questionKey}
          question={question}
          isSelected={question.questionKey === selectedQuestionKey}
          onSelect={() => onSelectQuestionKey(question.questionKey)}
        />
      ))}
    </div>
  );
}

function MultipleChoiceItem({
  question,
  isSelected,
  onSelect,
}: {
  question: ReadingQuestionItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const state = getQuestionState(question);

  // Parse prompt and options
  const { stem, options } = useMemo(() => {
    return parseMultipleChoiceOptions(question.prompt || "");
  }, [question.prompt]);

  // Normalized answers
  const studentAnswersNormalized = useMemo(() => {
    return question.studentAnswers.map((a: string) => a.trim().toUpperCase());
  }, [question.studentAnswers]);

  const correctAnswersNormalized = useMemo(() => {
    return question.correctAnswers.map((a: string) => a.trim().toUpperCase());
  }, [question.correctAnswers]);

  // Check if option was selected or is correct
  const isOptionSelected = (code: string, text: string) => {
    return (
      studentAnswersNormalized.includes(code) ||
      studentAnswersNormalized.some((a: string) => a.startsWith(code) || a.toLowerCase() === text.toLowerCase())
    );
  };

  const isOptionCorrect = (code: string, text: string) => {
    return (
      correctAnswersNormalized.includes(code) ||
      correctAnswersNormalized.some((a: string) => a.startsWith(code) || a.toLowerCase() === text.toLowerCase())
    );
  };

  return (
    <article
      id={`review-question-${question.questionKey}`}
      onClick={onSelect}
      className={`scroll-mt-4 rounded-xl border bg-white p-4 sm:p-5 transition cursor-pointer shadow-2xs ${
        isSelected
          ? "border-[#8B3F56] ring-2 ring-[#8B3F56]/20 bg-[#FAF7F8]/30"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span
            className={`grid size-7 place-items-center rounded-full text-xs font-black text-white shrink-0 ${
              state === "correct"
                ? "bg-emerald-600"
                : state === "incorrect"
                ? "bg-rose-600"
                : "bg-slate-400"
            }`}
          >
            {question.questionNo}
          </span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Câu hỏi #{question.questionNo}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {state === "correct" ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
              <CheckCircle size={14} weight="fill" />
              Đúng (1/1)
            </span>
          ) : state === "incorrect" ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
              <XCircle size={14} weight="fill" />
              Sai (0/1)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-500">
              <MinusCircle size={14} weight="fill" />
              Chưa trả lời
            </span>
          )}
        </div>
      </header>

      {/* Question Stem */}
      <div className="mb-4 text-sm font-semibold text-[#1F1F1F] leading-relaxed">
        {stem || question.prompt}
      </div>

      {/* Options List */}
      {options.length > 0 ? (
        <div className="space-y-2" role="group" aria-label={`Các phương án câu ${question.questionNo}`}>
          {options.map(opt => {
            const selected = isOptionSelected(opt.code, opt.text);
            const correct = isOptionCorrect(opt.code, opt.text);

            let styleClass = "border-slate-200 bg-white text-slate-700 hover:bg-slate-50/50";
            let badgeNode = null;

            if (selected && correct) {
              styleClass = "border-emerald-500 bg-emerald-50/90 text-emerald-950 font-medium shadow-2xs";
              badgeNode = (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle size={13} weight="fill" /> Lựa chọn của học viên (Đúng)
                </span>
              );
            } else if (selected && !correct) {
              styleClass = "border-rose-400 bg-rose-50/90 text-rose-950 font-medium shadow-2xs";
              badgeNode = (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                  <XCircle size={13} weight="fill" /> Lựa chọn của học viên (Sai)
                </span>
              );
            } else if (!selected && correct) {
              styleClass = "border-emerald-400 border-dashed bg-emerald-50/50 text-emerald-900 font-medium";
              badgeNode = (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  <CheckCircle size={13} weight="fill" /> Đáp án đúng
                </span>
              );
            }

            return (
              <div
                key={opt.code}
                className={`flex items-start justify-between gap-3 rounded-lg border p-3 text-xs leading-5 transition ${styleClass}`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                      selected && correct
                        ? "bg-emerald-600 text-white"
                        : selected && !correct
                        ? "bg-rose-600 text-white"
                        : correct
                        ? "border border-emerald-500 bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {opt.code}
                  </span>
                  <span className="mt-0.5">{opt.text}</span>
                </div>
                {badgeNode && <div className="shrink-0">{badgeNode}</div>}
              </div>
            );
          })}
        </div>
      ) : (
        /* Fallback when options are not separated into A, B, C, D in prompt */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div
            className={`rounded-lg border p-3 ${
              state === "correct"
                ? "border-emerald-200 bg-emerald-50/70"
                : state === "incorrect"
                ? "border-rose-200 bg-rose-50/70"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Lựa chọn của học viên
            </span>
            <div className="mt-1 flex items-center gap-1.5 font-bold">
              {state === "correct" ? (
                <CheckCircle size={15} weight="fill" className="text-emerald-600 shrink-0" />
              ) : state === "incorrect" ? (
                <XCircle size={15} weight="fill" className="text-rose-600 shrink-0" />
              ) : null}
              <span className={state === "correct" ? "text-emerald-800" : state === "incorrect" ? "text-rose-800" : "text-slate-500 italic"}>
                {question.studentAnswers.length ? question.studentAnswers.join(", ") : "Bỏ qua"}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Đáp án chuẩn
            </span>
            <div className="mt-1 flex items-center gap-1.5 font-bold text-emerald-900">
              <CheckCircle size={15} weight="fill" className="text-emerald-600 shrink-0" />
              <span>{question.correctAnswers.join(", ")}</span>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
