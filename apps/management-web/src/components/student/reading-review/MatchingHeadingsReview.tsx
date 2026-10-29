import { CheckCircle, XCircle, MinusCircle, ListNumbers, ArrowSquareOut, Info } from "@phosphor-icons/react";
import { useMemo } from "react";
import type { ReadingQuestionGroupItem, ReadingQuestionItem } from "./reviewTypes";
import { extractHeadingsList, getQuestionState } from "./reviewUtils";

type Props = {
  group: ReadingQuestionGroupItem;
  selectedQuestionKey: string;
  onSelectQuestionKey: (key: string) => void;
  onLocateParagraph?: (paragraphCode: string) => void;
};

export default function MatchingHeadingsReview({
  group,
  selectedQuestionKey,
  onSelectQuestionKey,
  onLocateParagraph,
}: Props) {
  // Extract Headings list from group instructions, sharedOptions, or prompts
  const headingsList = useMemo(() => {
    const list = extractHeadingsList(group.instructions || "");
    if (list.length > 0) return list;

    // Try extracting from all question prompts if concatenated
    for (const q of group.questions) {
      const qList = extractHeadingsList(q.prompt || "");
      if (qList.length >= 3) return qList;
    }

    return [];
  }, [group.instructions, group.questions]);

  // Helper map for heading text
  const headingTextMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of headingsList) {
      map.set(h.code.toLowerCase(), h.text);
    }
    return map;
  }, [headingsList]);

  return (
    <div className="space-y-4">
      {/* List of Headings Reference Card */}
      {headingsList.length > 0 && (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-4 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-900 mb-3">
            <ListNumbers size={16} weight="bold" />
            <span className="uppercase tracking-wider text-[11px]">List of Headings (Danh sách các tiêu đề)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {headingsList.map(item => {
              // Check if any question has this heading as correct answer or student answer
              const isCorrectFor = group.questions.find(q =>
                q.correctAnswers.some((a: string) => a.toLowerCase().trim() === item.code || a.toLowerCase().includes(item.code))
              );
              const isUsedByStudent = group.questions.find(q =>
                q.studentAnswers.some((a: string) => a.toLowerCase().trim() === item.code || a.toLowerCase().includes(item.code))
              );

              return (
                <div
                  key={item.code}
                  className={`flex items-start gap-2.5 rounded-lg border p-2.5 transition ${
                    isCorrectFor
                      ? "border-emerald-300 bg-emerald-50/70 text-emerald-950 font-medium"
                      : isUsedByStudent
                      ? "border-slate-300 bg-white text-slate-700"
                      : "border-slate-200 bg-white/80 text-slate-600"
                  }`}
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded bg-cyan-100/70 font-mono font-bold text-[11px] text-cyan-900">
                    {item.code}
                  </span>
                  <div className="min-w-0">
                    <span className="leading-snug block">{item.text}</span>
                    {isCorrectFor && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                        ✓ Đáp án của Câu #{isCorrectFor.questionNo}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Paragraph Items to Match */}
      <div className="space-y-3">
        {group.questions.map(question => {
          const state = getQuestionState(question);
          const isSelected = selectedQuestionKey === question.questionKey;

          // Detect target paragraph from prompt (e.g. "Paragraph A" or "Section B")
          const paragraphMatch = (question.prompt || "").match(/Paragraph\s+([A-G])/i) ||
            (question.prompt || "").match(/Section\s+([A-G])/i) ||
            (question.prompt || "").match(/\b([A-G])\b/);

          const paragraphCode = paragraphMatch ? paragraphMatch[1].toUpperCase() : null;

          const studentAnsCode = (question.studentAnswers[0] || "").toLowerCase().trim();
          const correctAnsCode = (question.correctAnswers[0] || "").toLowerCase().trim();

          const studentHeadingText = headingTextMap.get(studentAnsCode) || question.studentAnswers[0] || "Bỏ qua";
          const correctHeadingText = headingTextMap.get(correctAnsCode) || question.correctAnswers.join(" / ");

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
                  <span className="text-xs font-bold text-slate-800">
                    {paragraphCode ? `Paragraph ${paragraphCode}` : question.prompt || `Câu #${question.questionNo}`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {paragraphCode && onLocateParagraph && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectQuestionKey(question.questionKey);
                        onLocateParagraph(paragraphCode);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8B3F56] hover:bg-[#F3E6EB] px-2 py-1 rounded transition"
                      title={`Cuộn bài đọc đến Paragraph ${paragraphCode}`}
                    >
                      <ArrowSquareOut size={13} weight="bold" />
                      <span>Xem Paragraph {paragraphCode}</span>
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

              {/* Headings Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Student Heading */}
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
                    Heading học viên chọn:
                  </span>
                  <div className="flex items-start gap-1.5 font-bold">
                    {state === "correct" ? (
                      <CheckCircle size={15} weight="fill" className="text-emerald-600 shrink-0 mt-0.5" />
                    ) : state === "incorrect" ? (
                      <XCircle size={15} weight="fill" className="text-rose-600 shrink-0 mt-0.5" />
                    ) : null}
                    <span className={state === "correct" ? "text-emerald-900" : state === "incorrect" ? "text-rose-900" : "text-slate-500 italic"}>
                      {studentHeadingText}
                    </span>
                  </div>
                </div>

                {/* Correct Heading */}
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1">
                    Heading chính xác:
                  </span>
                  <div className="flex items-start gap-1.5 font-bold text-emerald-950">
                    <CheckCircle size={15} weight="fill" className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>{correctHeadingText}</span>
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
