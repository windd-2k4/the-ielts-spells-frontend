import { CheckCircle, XCircle, MinusCircle, Info } from "@phosphor-icons/react";
import { useMemo } from "react";
import type { ReadingQuestionGroupItem, ReadingQuestionItem } from "./reviewTypes";
import { getQuestionState } from "./reviewUtils";

type Props = {
  group: ReadingQuestionGroupItem;
  selectedQuestionKey: string;
  onSelectQuestionKey: (key: string) => void;
};

export default function TrueFalseNotGivenReview({
  group,
  selectedQuestionKey,
  onSelectQuestionKey,
}: Props) {
  const isYesNo = group.category === "YES_NO_NOT_GIVEN" || (group.instructions || "").toUpperCase().includes("YES");

  const optionList = isYesNo
    ? ["YES", "NO", "NOT GIVEN"]
    : ["TRUE", "FALSE", "NOT GIVEN"];

  return (
    <div className="space-y-4">
      {group.questions.map(question => (
        <TFNGItem
          key={question.questionKey}
          question={question}
          optionList={optionList}
          isSelected={question.questionKey === selectedQuestionKey}
          onSelect={() => onSelectQuestionKey(question.questionKey)}
        />
      ))}
    </div>
  );
}

function TFNGItem({
  question,
  optionList,
  isSelected,
  onSelect,
}: {
  question: ReadingQuestionItem;
  optionList: string[];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const state = getQuestionState(question);

  const studentAns = useMemo(() => {
    return (question.studentAnswers[0] || "").trim().toUpperCase();
  }, [question.studentAnswers]);

  const correctAns = useMemo(() => {
    return (question.correctAnswers[0] || "").trim().toUpperCase();
  }, [question.correctAnswers]);

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
            Statement #{question.questionNo}
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

      {/* Statement prompt */}
      <div className="mb-4 text-sm font-semibold text-[#1F1F1F] leading-relaxed">
        {question.prompt}
      </div>

      {/* 3 Comparative Chips: TRUE / FALSE / NOT GIVEN */}
      <div className="grid grid-cols-3 gap-2.5 mb-3" role="group" aria-label={`Đáp án câu ${question.questionNo}`}>
        {optionList.map(opt => {
          const isSelectedByStudent = studentAns === opt;
          const isCorrect = correctAns === opt;

          let cardStyle = "border-slate-200 bg-slate-50/50 text-slate-600";
          let badge = null;

          if (isSelectedByStudent && isCorrect) {
            cardStyle = "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-2xs";
            badge = (
              <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                <CheckCircle size={12} weight="fill" /> Học viên chọn (Đúng)
              </span>
            );
          } else if (isSelectedByStudent && !isCorrect) {
            cardStyle = "border-rose-400 bg-rose-50 text-rose-950 font-bold shadow-2xs";
            badge = (
              <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                <XCircle size={12} weight="fill" /> Học viên chọn (Sai)
              </span>
            );
          } else if (!isSelectedByStudent && isCorrect) {
            cardStyle = "border-emerald-400 border-dashed bg-emerald-50/60 text-emerald-900 font-bold";
            badge = (
              <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                <CheckCircle size={12} weight="fill" /> Đáp án đúng
              </span>
            );
          }

          return (
            <div
              key={opt}
              className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition ${cardStyle}`}
            >
              <span className="text-xs font-black tracking-wide">{opt}</span>
              {badge}
            </div>
          );
        })}
      </div>

      {/* Side-by-side Answer Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div
          className={`rounded-lg border px-3 py-2 flex items-center justify-between ${
            state === "correct"
              ? "border-emerald-200 bg-emerald-50/50 text-emerald-900"
              : state === "incorrect"
              ? "border-rose-200 bg-rose-50/50 text-rose-900"
              : "border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Học viên nộp:
          </span>
          <span className="font-bold flex items-center gap-1">
            {state === "correct" ? (
              <CheckCircle size={14} weight="fill" className="text-emerald-600" />
            ) : state === "incorrect" ? (
              <XCircle size={14} weight="fill" className="text-rose-600" />
            ) : null}
            <span>{studentAns || "Bỏ qua"}</span>
          </span>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2 text-emerald-950 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            Đáp án chuẩn:
          </span>
          <span className="font-bold flex items-center gap-1 text-emerald-800">
            <CheckCircle size={14} weight="fill" className="text-emerald-600" />
            <span>{correctAns}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
