import { CheckCircle, XCircle, MinusCircle, BookmarkSimple, ListBullets } from "@phosphor-icons/react";
import { useMemo } from "react";
import type { ReadingQuestionGroupItem, ReadingQuestionItem } from "./reviewTypes";
import { extractWordBank, getQuestionState, parseGapFillTokens } from "./reviewUtils";

type Props = {
  group: ReadingQuestionGroupItem;
  selectedQuestionKey: string;
  onSelectQuestionKey: (key: string) => void;
};

export default function SummaryCompletionReview({
  group,
  selectedQuestionKey,
  onSelectQuestionKey,
}: Props) {
  // Map questions by question number for quick in-place lookup
  const questionMap = useMemo(() => {
    const map = new Map<number, ReadingQuestionItem>();
    for (const q of group.questions) {
      map.set(q.questionNo, q);
    }
    return map;
  }, [group.questions]);

  // Find the summary template text:
  // Usually, all questions in the group share the summary text in question.prompt, or the first question has the full text.
  const summaryText = useMemo(() => {
    // Check if any question has a prompt with blanks [[X]]
    for (const q of group.questions) {
      if (q.prompt && /\[\[\d+\]\]|\{\d+\}|__\d+__/.test(q.prompt)) {
        return q.prompt;
      }
    }
    // Check group instructions or fallback to combining prompts
    if (group.instructions && /\[\[\d+\]\]|\{\d+\}|__\d+__/.test(group.instructions)) {
      return group.instructions;
    }
    return group.questions[0]?.prompt || "";
  }, [group.instructions, group.questions]);

  // Extract Word Bank if present in instructions or template
  const wordBank = useMemo(() => {
    if (group.wordBank && group.wordBank.length > 0) return group.wordBank;
    const fromInst = extractWordBank(group.instructions || "");
    if (fromInst.length > 0) return fromInst;
    return extractWordBank(summaryText);
  }, [group.instructions, group.wordBank, summaryText]);

  // Tokens of the summary
  const tokens = useMemo(() => {
    return parseGapFillTokens(summaryText);
  }, [summaryText]);

  const hasTokens = tokens.length > 0 && tokens.some(t => t.type === "blank");

  return (
    <div className="space-y-4">
      {/* Word Bank if present */}
      {wordBank.length > 0 && (
        <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/40 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 mb-2.5">
            <ListBullets size={15} weight="bold" />
            <span className="uppercase tracking-wider text-[11px]">Word Bank (Danh sách từ lựa chọn)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {wordBank.map(item => {
              // Check if any question used this word bank code or text
              const usedByStudent = group.questions.some(q =>
                q.studentAnswers.some((a: string) => a.toLowerCase() === item.code.toLowerCase() || a.toLowerCase() === item.text.toLowerCase())
              );
              const isCorrectAnswer = group.questions.some(q =>
                q.correctAnswers.some((a: string) => a.toLowerCase() === item.code.toLowerCase() || a.toLowerCase() === item.text.toLowerCase())
              );

              return (
                <div
                  key={item.code}
                  className={`flex items-start gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition ${
                    isCorrectAnswer
                      ? "border-emerald-300 bg-emerald-50/80 text-emerald-900 font-semibold"
                      : usedByStudent
                      ? "border-rose-300 bg-rose-50/70 text-rose-900 line-through"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <span className="grid size-5 shrink-0 place-items-center rounded bg-slate-100 font-bold text-[11px] text-slate-800">
                    {item.code}
                  </span>
                  <span className="truncate leading-5">{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Continuous Summary Passage with Inline Evaluation Blanks */}
      <div className="rounded-xl border border-slate-200 bg-[#FCFCFD] p-4 sm:p-6 shadow-2xs">
        {hasTokens ? (
          <div className="text-[15px] leading-[2.2] text-[#222222] font-normal selection:bg-[#F3E6EB]">
            {tokens.map((token, idx) => {
              if (token.type === "text") {
                return (
                  <span key={idx} className="whitespace-pre-wrap">
                    {token.content}
                  </span>
                );
              }

              const question = questionMap.get(token.questionNo);
              if (!question) {
                return (
                  <span key={idx} className="inline-block px-2 py-0.5 mx-1 rounded border border-slate-300 bg-slate-100 text-xs text-slate-500 font-mono">
                    [{token.questionNo}]
                  </span>
                );
              }

              const state = getQuestionState(question);
              const isSelected = selectedQuestionKey === question.questionKey;
              const studentAnswer = question.studentAnswers.length ? question.studentAnswers.join(", ") : "";
              const correctAnswer = question.correctAnswers.length ? question.correctAnswers.join(" / ") : "";

              return (
                <span
                  key={idx}
                  id={`review-question-${question.questionKey}`}
                  onClick={() => onSelectQuestionKey(question.questionKey)}
                  className={`inline-flex flex-wrap items-center gap-1.5 align-middle mx-1 px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition select-none ${
                    isSelected
                      ? "ring-2 ring-[#8B3F56] ring-offset-1 shadow-xs"
                      : "hover:shadow-2xs"
                  } ${
                    state === "correct"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                      : state === "incorrect"
                      ? "border-rose-300 bg-rose-50/70 text-rose-900"
                      : "border-slate-300 bg-slate-100 text-slate-600"
                  }`}
                  title={`Câu ${question.questionNo} - Nhấn để xem chi tiết`}
                >
                  {/* Question Number Badge */}
                  <span
                    className={`inline-grid size-5 place-items-center rounded-full text-[11px] font-black text-white shrink-0 ${
                      state === "correct"
                        ? "bg-emerald-600"
                        : state === "incorrect"
                        ? "bg-rose-600"
                        : "bg-slate-400"
                    }`}
                  >
                    {question.questionNo}
                  </span>

                  {/* Student Answer */}
                  {state === "correct" ? (
                    <span className="font-bold flex items-center gap-1">
                      <span>{studentAnswer}</span>
                      <CheckCircle size={14} weight="fill" className="text-emerald-600 shrink-0" />
                    </span>
                  ) : state === "incorrect" ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold line-through text-rose-700 flex items-center gap-0.5">
                        <span>{studentAnswer || "Bỏ qua"}</span>
                        <XCircle size={13} weight="fill" className="text-rose-600 shrink-0" />
                      </span>
                      <span className="text-slate-400 font-bold">➔</span>
                      <span className="font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <CheckCircle size={13} weight="fill" className="text-emerald-600 shrink-0" />
                        <span>{correctAnswer}</span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="italic text-slate-500 font-medium">Chưa trả lời</span>
                      <span className="text-slate-400 font-bold">➔</span>
                      <span className="font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <CheckCircle size={13} weight="fill" className="text-emerald-600 shrink-0" />
                        <span>{correctAnswer}</span>
                      </span>
                    </div>
                  )}
                </span>
              );
            })}
          </div>
        ) : (
          /* Fallback when template string does not have [[X]] tags */
          <div className="space-y-4">
            {group.questions.map(question => {
              const state = getQuestionState(question);
              const isSelected = selectedQuestionKey === question.questionKey;
              return (
                <div
                  key={question.questionKey}
                  id={`review-question-${question.questionKey}`}
                  onClick={() => onSelectQuestionKey(question.questionKey)}
                  className={`rounded-lg border p-3 transition cursor-pointer ${
                    isSelected ? "border-[#8B3F56] bg-[#FAF5F7]" : "border-slate-200 bg-white hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-slate-900">Câu {question.questionNo}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      state === "correct" ? "bg-emerald-100 text-emerald-800" : state === "incorrect" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-600"
                    }`}>
                      {state === "correct" ? "Đúng (1/1)" : state === "incorrect" ? "Sai (0/1)" : "Bỏ qua"}
                    </span>
                  </div>
                  {question.prompt && <p className="text-sm text-slate-700 mb-2 leading-relaxed">{question.prompt}</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="rounded bg-slate-50 p-2 border border-slate-200">
                      <span className="block text-[10px] font-bold uppercase text-slate-500">Học viên:</span>
                      <strong className={state === "correct" ? "text-emerald-700" : "text-rose-700"}>
                        {question.studentAnswers.length ? question.studentAnswers.join(", ") : "Bỏ qua"}
                      </strong>
                    </div>
                    <div className="rounded bg-emerald-50/70 p-2 border border-emerald-200">
                      <span className="block text-[10px] font-bold uppercase text-emerald-800">Đáp án đúng:</span>
                      <strong className="text-emerald-800">{question.correctAnswers.join(" / ")}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Comparison Summary Table for the Summary Group */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="bg-[#FAF7F8] px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <BookmarkSimple size={14} weight="bold" className="text-[#8B3F56]" />
            Bảng đối chiếu đáp án nhóm câu {group.rangeLabel}
          </span>
          <span className="text-xs font-bold text-slate-600">
            {group.correctCount}/{group.totalCount} đúng
          </span>
        </div>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <th className="px-3.5 py-2 w-16">Câu</th>
              <th className="px-3.5 py-2">Câu trả lời học viên</th>
              <th className="px-3.5 py-2">Đáp án chuẩn</th>
              <th className="px-3.5 py-2 text-center w-24">Kết quả</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {group.questions.map(q => {
              const state = getQuestionState(q);
              const isSelected = selectedQuestionKey === q.questionKey;
              return (
                <tr
                  key={q.questionKey}
                  onClick={() => onSelectQuestionKey(q.questionKey)}
                  className={`cursor-pointer transition ${
                    isSelected ? "bg-[#FAF5F7]" : "hover:bg-slate-50/80"
                  }`}
                >
                  <td className="px-3.5 py-2.5 font-black text-slate-800">#{q.questionNo}</td>
                  <td className="px-3.5 py-2.5">
                    {state === "correct" ? (
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle size={13} weight="fill" className="text-emerald-600" />
                        {q.studentAnswers.join(", ")}
                      </span>
                    ) : state === "incorrect" ? (
                      <span className="font-semibold text-rose-700 line-through flex items-center gap-1">
                        <XCircle size={13} weight="fill" className="text-rose-600" />
                        {q.studentAnswers.join(", ") || "Bỏ qua"}
                      </span>
                    ) : (
                      <span className="italic text-slate-400">Bỏ qua</span>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 font-bold text-emerald-800">
                    {q.correctAnswers.join(" / ")}
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    {state === "correct" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        Đúng (1/1)
                      </span>
                    ) : state === "incorrect" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                        Sai (0/1)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[11px]">
                        Bỏ qua
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
