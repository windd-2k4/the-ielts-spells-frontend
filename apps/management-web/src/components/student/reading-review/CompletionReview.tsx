import { CheckCircle, XCircle, MinusCircle, Table as TableIcon, Note, Info } from "@phosphor-icons/react";
import { useMemo } from "react";
import type { ReadingQuestionGroupItem, ReadingQuestionItem } from "./reviewTypes";
import { getQuestionState, parseGapFillTokens } from "./reviewUtils";

type Props = {
  group: ReadingQuestionGroupItem;
  selectedQuestionKey: string;
  onSelectQuestionKey: (key: string) => void;
};

export default function CompletionReview({
  group,
  selectedQuestionKey,
  onSelectQuestionKey,
}: Props) {
  const isTable = group.category === "TABLE_COMPLETION" || (group.questions[0]?.prompt || "").includes("<table");
  const isNote = group.category === "NOTE_COMPLETION";

  const questionMap = useMemo(() => {
    const map = new Map<number, ReadingQuestionItem>();
    for (const q of group.questions) {
      map.set(q.questionNo, q);
    }
    return map;
  }, [group.questions]);

  return (
    <div className="space-y-4">
      {/* Group Format Indicator */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg">
        {isTable ? (
          <>
            <TableIcon size={16} weight="bold" className="text-indigo-600" />
            <span>Table Completion — Hoàn thành thông tin trong bảng bên dưới</span>
          </>
        ) : isNote ? (
          <>
            <Note size={16} weight="bold" className="text-indigo-600" />
            <span>Note Completion — Điền từ thích hợp vào các ghi chú bên dưới</span>
          </>
        ) : (
          <>
            <Note size={16} weight="bold" className="text-indigo-600" />
            <span>Sentence Completion — Hoàn thành các câu bên dưới</span>
          </>
        )}
      </div>

      {/* Completion Items */}
      <div className="space-y-3">
        {group.questions.map(question => (
          <CompletionItem
            key={question.questionKey}
            question={question}
            isSelected={selectedQuestionKey === question.questionKey}
            onSelect={() => onSelectQuestionKey(question.questionKey)}
          />
        ))}
      </div>
    </div>
  );
}

function CompletionItem({
  question,
  isSelected,
  onSelect,
}: {
  question: ReadingQuestionItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const state = getQuestionState(question);
  const prompt = question.prompt || "";

  // Check if prompt has gap token [[X]]
  const tokens = useMemo(() => {
    return parseGapFillTokens(prompt);
  }, [prompt]);

  const hasTokens = tokens.length > 0 && tokens.some(t => t.type === "blank");

  const studentAnswer = question.studentAnswers.length ? question.studentAnswers.join(", ") : "";
  const correctAnswer = question.correctAnswers.length ? question.correctAnswers.join(" / ") : "";

  // Check if HTML formatted (e.g. table or list)
  const isHtml = /<[a-z][\s\S]*>/i.test(prompt);

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
            Câu #{question.questionNo}
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

      {/* Content with inline blank or structured display */}
      <div className="mb-3">
        {hasTokens ? (
          <p className="text-sm leading-[2.2] text-[#222222]">
            {tokens.map((token, idx) => {
              if (token.type === "text") {
                return <span key={idx}>{token.content}</span>;
              }
              return (
                <span
                  key={idx}
                  className={`inline-flex flex-wrap items-center gap-1 align-middle mx-1 px-2.5 py-0.5 rounded-lg border text-xs font-semibold ${
                    state === "correct"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                      : state === "incorrect"
                      ? "border-rose-300 bg-rose-50 text-rose-900"
                      : "border-slate-300 bg-slate-100 text-slate-600"
                  }`}
                >
                  <span className="font-mono text-[10px] text-slate-500">[{token.questionNo}]</span>
                  {state === "correct" ? (
                    <span className="font-bold flex items-center gap-1 text-emerald-700">
                      {studentAnswer}
                      <CheckCircle size={13} weight="fill" className="text-emerald-600" />
                    </span>
                  ) : state === "incorrect" ? (
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <span className="line-through text-rose-700 font-semibold">{studentAnswer || "Bỏ qua"}</span>
                      <span className="text-slate-400">➔</span>
                      <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                        <CheckCircle size={12} weight="fill" className="text-emerald-600" />
                        {correctAnswer}
                      </span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <span className="italic text-slate-400">Chưa điền</span>
                      <span className="text-slate-400">➔</span>
                      <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                        <CheckCircle size={12} weight="fill" className="text-emerald-600" />
                        {correctAnswer}
                      </span>
                    </span>
                  )}
                </span>
              );
            })}
          </p>
        ) : isHtml ? (
          <div
            className="prose prose-sm max-w-none text-slate-800 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-200 [&_th]:p-2 [&_th]:bg-slate-50 [&_td]:border [&_td]:border-slate-200 [&_td]:p-2"
            dangerouslySetInnerHTML={{ __html: prompt }}
          />
        ) : (
          <p className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">{prompt}</p>
        )}
      </div>

      {/* Answer comparison boxes if not already inlined */}
      {!hasTokens && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
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

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1">
              Đáp án chuẩn:
            </span>
            <div className="flex items-center gap-1.5 font-bold text-emerald-950">
              <CheckCircle size={14} weight="fill" className="text-emerald-600 shrink-0" />
              <span>{correctAnswer}</span>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
