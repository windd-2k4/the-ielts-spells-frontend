import {
  CaretDoubleLeft,
  CaretDoubleRight,
  CheckCircle,
  ClockCounterClockwise,
  ListBullets,
  MinusCircle,
  XCircle,
} from "@phosphor-icons/react";
import type { ReadingQuestionItem, ReadingSectionItem } from "./reviewTypes";
import { getQuestionState } from "./reviewUtils";

type Props = {
  sectionsList: ReadingSectionItem[];
  allQuestions: ReadingQuestionItem[];
  currentSection: ReadingSectionItem | undefined;
  selectedQuestionKey: string;
  onSelectSection: (sectionTitle: string) => void;
  onSelectQuestion: (question: ReadingQuestionItem) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export default function QuestionNavigator({
  sectionsList,
  allQuestions,
  currentSection,
  selectedQuestionKey,
  onSelectSection,
  onSelectQuestion,
  collapsed,
  onToggleCollapse,
}: Props) {
  const totalQuestions = allQuestions.length || 1;
  const correctCount = allQuestions.filter(q => q.correct === true).length;
  const incorrectCount = allQuestions.filter(q => q.correct === false).length;
  const unansweredCount = allQuestions.filter(q => !q.studentAnswers || q.studentAnswers.length === 0).length;
  const correctPct = Math.round((correctCount / totalQuestions) * 100);

  if (collapsed) {
    return (
      <aside className="border-l border-slate-200 bg-white p-2 flex flex-col items-center justify-between shrink-0 shadow-2xs">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:border-[#8B3F56] hover:text-[#8B3F56] hover:bg-[#F3E6EB] transition shadow-2xs"
          title="Mở rộng Navigator câu hỏi"
        >
          <CaretDoubleLeft size={16} weight="bold" />
        </button>

        <div className="py-4 writing-vertical-rl text-[11px] font-black uppercase tracking-widest text-slate-400 select-none">
          Navigator ({correctCount}/{totalQuestions})
        </div>

        <div className="flex flex-col items-center gap-1.5 text-[11px] font-bold">
          <span className="text-emerald-700">{correctCount}✓</span>
          <span className="text-rose-700">{incorrectCount}✗</span>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="flex min-h-0 w-64 lg:w-72 flex-col overflow-hidden border-t border-slate-200 bg-[#FCFDFD] lg:border-l lg:border-t-0 shrink-0 select-none"
      aria-label="Điều hướng và tiến độ bài làm"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3.5 py-2.5">
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider">
          <ListBullets size={15} weight="bold" className="text-[#8B3F56]" />
          <span>Điều hướng câu hỏi</span>
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="grid size-7 place-items-center rounded-md border border-slate-200 text-slate-500 hover:text-[#8B3F56] hover:border-[#8B3F56] hover:bg-[#F3E6EB] transition"
          title="Thu gọn sidebar (phóng to không gian đọc)"
        >
          <CaretDoubleRight size={14} weight="bold" />
        </button>
      </div>

      {/* Mini Progress Card */}
      <div className="border-b border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-bold text-slate-600">Độ chính xác toàn bài</span>
          <span className="font-black text-slate-900 tabular-nums">{correctCount}/{totalQuestions} ({correctPct}%)</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${(correctCount / totalQuestions) * 100}%` }}
          />
          <div
            className="h-full bg-rose-500 transition-all duration-300"
            style={{ width: `${(incorrectCount / totalQuestions) * 100}%` }}
          />
          <div
            className="h-full bg-slate-300 transition-all duration-300"
            style={{ width: `${(unansweredCount / totalQuestions) * 100}%` }}
          />
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold text-slate-600">
          <span className="flex items-center gap-1 text-emerald-700">
            <span className="size-2 rounded-full bg-emerald-500" />
            {correctCount} Đúng
          </span>
          <span className="flex items-center gap-1 text-rose-700">
            <span className="size-2 rounded-full bg-rose-500" />
            {incorrectCount} Sai
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <span className="size-2 rounded-full bg-slate-300" />
            {unansweredCount} Bỏ qua
          </span>
        </div>
      </div>

      {/* Passages Accordion / Question Number Matrix */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-4">
        {sectionsList.map(sec => {
          const isActive = currentSection?.title === sec.title;
          const secCorrect = sec.questions.filter(q => q.correct === true).length;
          const secTotal = sec.questions.length || 1;
          const secPct = Math.round((secCorrect / secTotal) * 100);

          return (
            <div
              key={sec.title}
              className={`rounded-xl border transition ${
                isActive
                  ? "border-[#8B3F56]/40 bg-white shadow-2xs"
                  : "border-slate-200 bg-white/70 hover:bg-white"
              }`}
            >
              {/* Passage Tab Header */}
              <button
                type="button"
                onClick={() => {
                  onSelectSection(sec.title);
                  if (sec.questions.length) onSelectQuestion(sec.questions[0]);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left transition rounded-t-xl ${
                  isActive ? "bg-[#F3E6EB]/50 text-[#8B3F56]" : "text-slate-800 hover:bg-slate-50"
                }`}
              >
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider block">
                    Passage {sec.sectionNo}
                  </span>
                  <span className="text-xs font-bold truncate block max-w-[170px]">
                    {sec.title}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black tabular-nums block">
                    {secCorrect}/{secTotal}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {secPct}%
                  </span>
                </div>
              </button>

              {/* Question Pills Matrix */}
              <div className="p-2.5 border-t border-slate-100 grid grid-cols-5 gap-1.5">
                {sec.questions.map(q => {
                  const state = getQuestionState(q);
                  const isSelected = selectedQuestionKey === q.questionKey;

                  let pillStyle = "bg-slate-100 text-slate-700 border-slate-200";
                  if (state === "correct") {
                    pillStyle = "bg-emerald-600 text-white border-emerald-700 shadow-2xs";
                  } else if (state === "incorrect") {
                    pillStyle = "bg-rose-600 text-white border-rose-700 shadow-2xs";
                  } else if (state === "pending") {
                    pillStyle = "bg-blue-600 text-white border-blue-700 shadow-2xs";
                  }

                  return (
                    <button
                      key={q.questionKey}
                      type="button"
                      onClick={() => {
                        onSelectSection(sec.title);
                        onSelectQuestion(q);
                      }}
                      className={`relative grid h-8 place-items-center rounded-lg border text-xs font-black tabular-nums transition focus-visible:outline-none ${pillStyle} ${
                        isSelected
                          ? "ring-2 ring-[#8B3F56] ring-offset-2 scale-105 z-10"
                          : "hover:opacity-90 hover:scale-[1.02]"
                      }`}
                      title={`Câu ${q.questionNo}: ${
                        state === "correct"
                          ? "Đúng"
                          : state === "incorrect"
                          ? "Sai"
                          : "Chưa trả lời"
                      }`}
                    >
                      {q.questionNo}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend Footer */}
      <div className="border-t border-slate-200 bg-white p-2.5 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1 font-semibold">
          <span className="size-2.5 rounded-full bg-emerald-600" /> Đúng
        </span>
        <span className="flex items-center gap-1 font-semibold">
          <span className="size-2.5 rounded-full bg-rose-600" /> Sai
        </span>
        <span className="flex items-center gap-1 font-semibold">
          <span className="size-2.5 rounded-full bg-slate-200 border border-slate-300" /> Bỏ qua
        </span>
      </div>
    </aside>
  );
}
