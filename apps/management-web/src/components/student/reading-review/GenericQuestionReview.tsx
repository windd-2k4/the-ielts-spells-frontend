import { CheckCircle, XCircle, MinusCircle, Info } from "@phosphor-icons/react";
import type { ReadingQuestionGroupItem } from "./reviewTypes";
import { getQuestionState } from "./reviewUtils";

type Props = {
  group: ReadingQuestionGroupItem;
  selectedQuestionKey: string;
  onSelectQuestionKey: (key: string) => void;
};

export default function GenericQuestionReview({
  group,
  selectedQuestionKey,
  onSelectQuestionKey,
}: Props) {
  return (
    <div className="space-y-4">
      {group.questions.map(question => {
        const state = getQuestionState(question);
        const isSelected = selectedQuestionKey === question.questionKey;
        const studentAnswer = question.studentAnswers.length ? question.studentAnswers.join(", ") : "";
        const correctAnswer = question.correctAnswers.length ? question.correctAnswers.join(" / ") : "";

        return (
          <article
            key={question.questionKey}
            id={`review-question-${question.questionKey}`}
            onClick={() => onSelectQuestionKey(question.questionKey)}
            className={`scroll-mt-4 rounded-xl border bg-white p-4 sm:p-5 transition cursor-pointer shadow-2xs ${
              isSelected
                ? "border-[#8B3F56] ring-2 ring-[#8B3F56]/20 bg-[#FAF7F8]/30"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <header className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
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
                <span className="text-xs font-bold text-slate-700">
                  Câu hỏi #{question.questionNo}
                </span>
              </div>

              <div className="flex items-center gap-2">
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
            </header>

            {question.prompt && (
              <div className="mb-3 text-sm font-semibold text-[#1F1F1F] leading-relaxed">
                {question.prompt}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div
                className={`rounded-lg border p-3 ${
                  state === "correct"
                    ? "border-emerald-200 bg-emerald-50/60"
                    : state === "incorrect"
                    ? "border-rose-200 bg-rose-50/60"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Câu trả lời của học viên:
                </span>
                <div className="flex items-center gap-1.5 font-bold">
                  {state === "correct" ? (
                    <CheckCircle size={14} weight="fill" className="text-emerald-600 shrink-0" />
                  ) : state === "incorrect" ? (
                    <XCircle size={14} weight="fill" className="text-rose-600 shrink-0" />
                  ) : null}
                  <span className={state === "correct" ? "text-emerald-900" : state === "incorrect" ? "text-rose-900" : "text-slate-500 italic"}>
                    {studentAnswer || "Bỏ qua"}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1">
                  Đáp án chuẩn:
                </span>
                <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                  <CheckCircle size={14} weight="fill" className="text-emerald-600 shrink-0" />
                  <span>{correctAnswer}</span>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
