import { CheckCircle, XCircle, MinusCircle, ArrowSquareOut, Info, ListBullets } from "@phosphor-icons/react";
import { useMemo } from "react";
import type { ReadingQuestionGroupItem, ReadingQuestionItem } from "./reviewTypes";
import { extractWordBank, getQuestionState } from "./reviewUtils";

type Props = {
  group: ReadingQuestionGroupItem;
  selectedQuestionKey: string;
  onSelectQuestionKey: (key: string) => void;
  onLocateParagraph?: (paragraphCode: string) => void;
};

export default function MatchingReview({
  group,
  selectedQuestionKey,
  onSelectQuestionKey,
  onLocateParagraph,
}: Props) {
  // Extract options list (e.g. A: Paragraph A, B: Paragraph B or A: Dr. Smith...)
  const featureList = useMemo(() => {
    return extractWordBank(group.instructions || "");
  }, [group.instructions]);

  return (
    <div className="space-y-4">
      {/* List of Features / Categories if detected */}
      {featureList.length > 0 && (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-900 mb-2.5">
            <ListBullets size={15} weight="bold" />
            <span className="uppercase tracking-wider text-[11px]">List of Options / Features</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {featureList.map(item => (
              <div key={item.code} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
                <span className="grid size-5 shrink-0 place-items-center rounded bg-cyan-100 font-bold text-[11px] text-cyan-900">
                  {item.code}
                </span>
                <span className="truncate">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matching Statements list */}
      <div className="space-y-3">
        {group.questions.map(question => {
          const state = getQuestionState(question);
          const isSelected = selectedQuestionKey === question.questionKey;

          // If matching information, the correct answer is usually a paragraph letter e.g. "B"
          const targetParagraph = question.correctAnswers[0]?.trim().toUpperCase();
          const isSingleLetterParagraph = targetParagraph && /^[A-G]$/.test(targetParagraph);

          return (
            <article
              key={question.questionKey}
              id={`review-question-${question.questionKey}`}
              onClick={() => onSelectQuestionKey(question.questionKey)}
              className={`scroll-mt-4 rounded-xl border bg-white p-4 transition cursor-pointer shadow-2xs ${
                isSelected
                  ? "border-[#8B3F56] ring-2 ring-[#8B3F56]/20 bg-[#FAF7F8]/30"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
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
                    Item #{question.questionNo}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isSingleLetterParagraph && onLocateParagraph && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectQuestionKey(question.questionKey);
                        onLocateParagraph(targetParagraph);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8B3F56] hover:bg-[#F3E6EB] px-2 py-0.5 rounded transition"
                      title={`Xem Paragraph ${targetParagraph} trong bài đọc`}
                    >
                      <ArrowSquareOut size={13} weight="bold" />
                      <span>Xem Paragraph {targetParagraph}</span>
                    </button>
                  )}

                  {state === "correct" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                      <CheckCircle size={13} weight="fill" /> Đúng (1/1)
                    </span>
                  ) : state === "incorrect" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                      <XCircle size={13} weight="fill" /> Sai (0/1)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-500">
                      <MinusCircle size={13} weight="fill" /> Bỏ qua
                    </span>
                  )}
                </div>
              </div>

              {/* Statement */}
              <div className="mb-3 text-sm font-semibold text-[#1F1F1F] leading-relaxed">
                {question.prompt}
              </div>

              {/* Side-by-side Pairs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Student Choice */}
                <div
                  className={`rounded-lg border p-2.5 ${
                    state === "correct"
                      ? "border-emerald-200 bg-emerald-50/60"
                      : state === "incorrect"
                      ? "border-rose-200 bg-rose-50/60"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Cặp ghép của học viên:
                  </span>
                  <div className="flex items-center gap-1.5 font-bold">
                    {state === "correct" ? (
                      <CheckCircle size={14} weight="fill" className="text-emerald-600 shrink-0" />
                    ) : state === "incorrect" ? (
                      <XCircle size={14} weight="fill" className="text-rose-600 shrink-0" />
                    ) : null}
                    <span className={state === "correct" ? "text-emerald-900" : state === "incorrect" ? "text-rose-900" : "text-slate-500 italic"}>
                      {question.studentAnswers.length ? question.studentAnswers.join(", ") : "Bỏ qua"}
                    </span>
                  </div>
                </div>

                {/* Correct Choice */}
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1">
                    Cặp ghép chuẩn:
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                    <CheckCircle size={14} weight="fill" className="text-emerald-600 shrink-0" />
                    <span>{question.correctAnswers.join(" / ")}</span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
