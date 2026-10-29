import {
  CaretDoubleLeft,
  CaretDoubleRight,
  CheckCircle,
  FolderOpen,
  Info,
  ListBullets,
  Question,
  Tag,
} from "@phosphor-icons/react";
import { useCallback, useMemo, useState } from "react";
import type { ReadingQuestionGroupItem, ReadingQuestionItem, ReadingSectionItem } from "./reviewTypes";
import {
  classifyReadingQuestionType,
  cleanInstructionText,
  getCategoryBadgeClass,
  readableCategoryTitle,
} from "./reviewUtils";
import ReadingPassagePanel from "./ReadingPassagePanel";
import QuestionNavigator from "./QuestionNavigator";
import SummaryCompletionReview from "./SummaryCompletionReview";
import MultipleChoiceReview from "./MultipleChoiceReview";
import TrueFalseNotGivenReview from "./TrueFalseNotGivenReview";
import MatchingHeadingsReview from "./MatchingHeadingsReview";
import MatchingReview from "./MatchingReview";
import CompletionReview from "./CompletionReview";
import ShortAnswerReview from "./ShortAnswerReview";
import GenericQuestionReview from "./GenericQuestionReview";

type Props = {
  currentSection: ReadingSectionItem | undefined;
  selectedQuestion: ReadingQuestionItem | null;
  questions: ReadingQuestionItem[];
  sectionsList: ReadingSectionItem[];
  activeSectionTitle: string;
  onSelectQuestionKey: (key: string) => void;
  onSelectSectionTitle: (title: string) => void;
  passageFontSize: number;
  onFontSizeChange: (updater: (prev: number) => number) => void;
};

export default function TeacherReadingReviewWorkspace({
  currentSection,
  selectedQuestion,
  questions,
  sectionsList,
  activeSectionTitle,
  onSelectQuestionKey,
  onSelectSectionTitle,
  passageFontSize,
  onFontSizeChange,
}: Props) {
  const [navigatorCollapsed, setNavigatorCollapsed] = useState(false);
  const [targetParagraph, setTargetParagraph] = useState<string | null>(null);

  const visibleQuestions = currentSection?.questions.length ? currentSection.questions : questions;
  const rangeStart = visibleQuestions.length ? Math.min(...visibleQuestions.map(q => q.questionNo)) : 0;
  const rangeEnd = visibleQuestions.length ? Math.max(...visibleQuestions.map(q => q.questionNo)) : 0;
  const rangeLabel = rangeStart && rangeEnd ? `Questions ${rangeStart}–${rangeEnd}` : "—";
  const sectionLabel = currentSection?.title || selectedQuestion?.sectionTitle || "Passage";

  // Group questions by section/group instructions/type
  const questionGroups = useMemo<ReadingQuestionGroupItem[]>(() => {
    const groups: ReadingQuestionGroupItem[] = [];

    for (const q of visibleQuestions) {
      const category = classifyReadingQuestionType(q.questionType, q.prompt, q.groupInstructions);
      const groupKey = `${q.groupTitle ?? ""}::${q.groupInstructions ?? ""}::${category}`;
      const last = groups.at(-1);

      if (last && last.key === groupKey) {
        last.questions.push(q);
        if (q.correct === true) last.correctCount += 1;
        last.totalCount += 1;
        last.rangeEnd = q.questionNo;
        last.rangeLabel = `${last.rangeStart}–${last.rangeEnd}`;
      } else {
        groups.push({
          key: groupKey,
          title: q.groupTitle,
          instructions: q.groupInstructions ?? null,
          questionType: q.questionType,
          category,
          rangeStart: q.questionNo,
          rangeEnd: q.questionNo,
          rangeLabel: `${q.questionNo}`,
          questions: [q],
          correctCount: q.correct === true ? 1 : 0,
          totalCount: 1,
        });
      }
    }

    return groups;
  }, [visibleQuestions]);

  const handleSelectQuestion = useCallback(
    (question: ReadingQuestionItem) => {
      onSelectQuestionKey(question.questionKey);

      // Auto-scroll center panel to question
      const element = document.getElementById(`review-question-${question.questionKey}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      // Check if question refers to a paragraph (e.g. Paragraph B in matching)
      const paragraphMatch = (question.prompt || "").match(/Paragraph\s+([A-G])/i) ||
        (question.prompt || "").match(/Section\s+([A-G])/i);
      if (paragraphMatch) {
        setTargetParagraph(paragraphMatch[1].toUpperCase());
      }
    },
    [onSelectQuestionKey]
  );

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100" aria-label="Không gian làm việc bài thi IELTS Reading">
      {/* Sub-header Context Bar */}
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-2 sm:px-6 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="rounded bg-[#8B3F56]/10 px-2 py-0.5 text-xs font-black uppercase text-[#8B3F56]">
            Reading
          </span>
          <span className="text-slate-300 font-bold">•</span>
          <span className="font-bold text-sm text-slate-800 truncate">
            {sectionLabel}
          </span>
          <span className="text-slate-300 font-bold hidden sm:inline">•</span>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Đọc bài văn và trả lời các {rangeLabel.toLowerCase()}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-bold text-slate-600 tabular-nums">
            {visibleQuestions.length} câu hỏi
          </span>

          <button
            type="button"
            onClick={() => setNavigatorCollapsed(v => !v)}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#8B3F56] border border-slate-200 rounded-lg px-2.5 py-1 transition hover:bg-slate-50"
            title={navigatorCollapsed ? "Mở Navigator câu hỏi" : "Thu gọn Navigator"}
          >
            {navigatorCollapsed ? <CaretDoubleLeft size={13} weight="bold" /> : <CaretDoubleRight size={13} weight="bold" />}
            <span>{navigatorCollapsed ? "Mở Navigator" : "Thu gọn Navigator"}</span>
          </button>
        </div>
      </header>

      {/* 3-Zone Workspace Layout */}
      <div
        className={`grid min-h-0 flex-1 grid-cols-1 overflow-y-auto bg-white lg:overflow-hidden ${
          navigatorCollapsed
            ? "lg:grid-cols-[minmax(380px,46%)_minmax(420px,1fr)_48px]"
            : "lg:grid-cols-[minmax(360px,42%)_minmax(400px,1fr)_260px] xl:grid-cols-[minmax(400px,44%)_minmax(460px,1fr)_288px]"
        }`}
      >
        {/* Zone 1: Left Panel — Reading Passage */}
        <ReadingPassagePanel
          section={currentSection}
          fontSize={passageFontSize}
          onFontSizeChange={onFontSizeChange}
          targetParagraph={targetParagraph}
          onClearTargetParagraph={() => setTargetParagraph(null)}
        />

        {/* Zone 2: Center Panel — Question Review with Type-Specific Components */}
        <div className="flex min-h-[440px] min-w-0 flex-col overflow-hidden bg-[#FBFBFC] lg:min-h-0" aria-label="Chi tiết câu hỏi và đối chiếu đáp án">
          {/* Center Header */}
          <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  {rangeLabel}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Đối chiếu trực quan câu trả lời của học viên với đáp án chuẩn theo cấu trúc đề thi IELTS.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold text-slate-600" aria-label="Chú thích kết quả">
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <span className="size-2 rounded-full bg-emerald-600" /> Đúng
                </span>
                <span className="inline-flex items-center gap-1.5 text-rose-700">
                  <span className="size-2 rounded-full bg-rose-600" /> Sai
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <span className="size-2 rounded-full bg-slate-300" /> Bỏ qua
                </span>
              </div>
            </div>
          </div>

          {/* Center Question Review Groups */}
          <div className="min-h-0 flex-1 scroll-smooth overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 space-y-8">
            {questionGroups.length > 0 ? (
              questionGroups.map(group => {
                const badgeClass = getCategoryBadgeClass(group.category);
                const categoryTitle = readableCategoryTitle(group.category);
                const instructions = cleanInstructionText(group.instructions || "");

                return (
                  <section
                    key={group.key}
                    className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xs"
                    aria-label={`Nhóm câu hỏi ${group.rangeLabel}`}
                  >
                    {/* Question Group Header */}
                    <header className="mb-5 pb-4 border-b border-slate-100">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-slate-900 text-white px-2.5 py-1 text-xs font-black tracking-wide">
                            Questions {group.rangeLabel}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold ${badgeClass}`}>
                            <Tag size={13} weight="bold" />
                            {categoryTitle}
                          </span>
                        </div>

                        <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full tabular-nums">
                          {group.correctCount}/{group.totalCount} câu đúng
                        </span>
                      </div>

                      {group.title && (
                        <h4 className="text-sm sm:text-base font-black text-slate-900 mt-2">
                          {group.title}
                        </h4>
                      )}

                      {instructions && (
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-600 italic">
                          {instructions}
                        </p>
                      )}
                    </header>

                    {/* Question Type Specific Renderer */}
                    {group.category === "SUMMARY_COMPLETION" ? (
                      <SummaryCompletionReview
                        group={group}
                        selectedQuestionKey={selectedQuestion?.questionKey ?? ""}
                        onSelectQuestionKey={onSelectQuestionKey}
                      />
                    ) : group.category === "MULTIPLE_CHOICE" ? (
                      <MultipleChoiceReview
                        group={group}
                        selectedQuestionKey={selectedQuestion?.questionKey ?? ""}
                        onSelectQuestionKey={onSelectQuestionKey}
                      />
                    ) : group.category === "TRUE_FALSE_NOT_GIVEN" || group.category === "YES_NO_NOT_GIVEN" ? (
                      <TrueFalseNotGivenReview
                        group={group}
                        selectedQuestionKey={selectedQuestion?.questionKey ?? ""}
                        onSelectQuestionKey={onSelectQuestionKey}
                      />
                    ) : group.category === "MATCHING_HEADINGS" ? (
                      <MatchingHeadingsReview
                        group={group}
                        selectedQuestionKey={selectedQuestion?.questionKey ?? ""}
                        onSelectQuestionKey={onSelectQuestionKey}
                        onLocateParagraph={(para) => setTargetParagraph(para)}
                      />
                    ) : group.category === "MATCHING_INFO" || group.category === "MATCHING_FEATURES" || group.category === "MATCHING_SENTENCE_ENDINGS" ? (
                      <MatchingReview
                        group={group}
                        selectedQuestionKey={selectedQuestion?.questionKey ?? ""}
                        onSelectQuestionKey={onSelectQuestionKey}
                        onLocateParagraph={(para) => setTargetParagraph(para)}
                      />
                    ) : group.category === "TABLE_COMPLETION" || group.category === "NOTE_COMPLETION" || group.category === "SENTENCE_COMPLETION" ? (
                      <CompletionReview
                        group={group}
                        selectedQuestionKey={selectedQuestion?.questionKey ?? ""}
                        onSelectQuestionKey={onSelectQuestionKey}
                      />
                    ) : group.category === "SHORT_ANSWER" ? (
                      <ShortAnswerReview
                        group={group}
                        selectedQuestionKey={selectedQuestion?.questionKey ?? ""}
                        onSelectQuestionKey={onSelectQuestionKey}
                      />
                    ) : (
                      <GenericQuestionReview
                        group={group}
                        selectedQuestionKey={selectedQuestion?.questionKey ?? ""}
                        onSelectQuestionKey={onSelectQuestionKey}
                      />
                    )}
                  </section>
                );
              })
            ) : (
              <div className="grid h-48 place-items-center text-center text-sm text-slate-500">
                Passage này chưa có dữ liệu câu hỏi.
              </div>
            )}
          </div>
        </div>

        {/* Zone 3: Right Panel — Review Navigator */}
        <QuestionNavigator
          sectionsList={sectionsList}
          allQuestions={questions}
          currentSection={currentSection}
          selectedQuestionKey={selectedQuestion?.questionKey ?? ""}
          onSelectSection={onSelectSectionTitle}
          onSelectQuestion={handleSelectQuestion}
          collapsed={navigatorCollapsed}
          onToggleCollapse={() => setNavigatorCollapsed(v => !v)}
        />
      </div>
    </section>
  );
}
