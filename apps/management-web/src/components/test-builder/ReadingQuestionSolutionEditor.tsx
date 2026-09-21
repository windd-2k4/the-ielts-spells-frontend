import {
  Check,
  Eye,
  Highlighter,
  ListBullets,
  NotePencil,
  Plus,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import { useId, useMemo, useState, type ReactNode } from "react";
import type {
  QuestionCardItem,
  ReadingEvidenceMode,
  ReadingEvidenceSpan,
  VisibilityPermission,
} from "../../library-types";

type SolutionTab = "ANSWER" | "SOLUTION" | "EVIDENCE" | "TEACHER_NOTE";

type Props = {
  question: QuestionCardItem;
  answerEditor: ReactNode;
  onQuestionChange: (patch: Partial<QuestionCardItem>) => void;
  onEvidenceSpansChange: (evidenceSpans: ReadingEvidenceSpan[]) => void;
  onRequestEvidenceCapture: (evidenceId?: string) => void;
  onFocusEvidence: (evidence: ReadingEvidenceSpan) => void;
  createEvidenceId: () => string;
};

const tabs: Array<{
  id: SolutionTab;
  label: string;
  description: string;
}> = [
  { id: "ANSWER", label: "Đáp án", description: "Thiết lập đáp án chính xác cho câu hỏi." },
  { id: "SOLUTION", label: "Lời giải", description: "Giải thích cho học viên sau khi làm bài." },
  { id: "EVIDENCE", label: "Bằng chứng", description: "Gắn đoạn Passage để đối chiếu lời giải." },
  { id: "TEACHER_NOTE", label: "Ghi chú", description: "Thông tin nội bộ, không hiển thị cho học viên." },
];

const evidenceModeLabels: Record<ReadingEvidenceMode, string> = {
  DIRECT_QUOTE: "Trích dẫn trực tiếp",
  WHOLE_PARAGRAPH: "Cả đoạn văn",
  NO_DIRECT_EVIDENCE: "Không có trích dẫn trực tiếp",
};

const visibilityOptions: Array<{ value: VisibilityPermission; label: string }> = [
  { value: "STUDENT_AFTER_SUBMIT", label: "Hiện sau khi học viên nộp bài" },
  { value: "STUDENT_AFTER_ASSIGN", label: "Hiện ngay khi được giao bài" },
  { value: "TEACHER_ONLY", label: "Chỉ giáo viên xem" },
];

function legacyEvidence(question: QuestionCardItem): ReadingEvidenceSpan[] {
  if (Array.isArray(question.evidenceSpans) && question.evidenceSpans.length > 0) {
    return question.evidenceSpans;
  }
  if (!question.passageSpan) return [];
  return [{
    id: `legacy-evidence-${question.id}`,
    start: question.passageSpan.start,
    end: question.passageSpan.end,
    quote: question.passageSpan.quote ?? "",
    mode: "DIRECT_QUOTE",
  }];
}

function hasText(value?: string) {
  return Boolean(value?.trim());
}

function hasValidRange(evidence: ReadingEvidenceSpan) {
  return typeof evidence.start === "number"
    && typeof evidence.end === "number"
    && evidence.start >= 0
    && evidence.end > evidence.start;
}

export default function ReadingQuestionSolutionEditor({
  question,
  answerEditor,
  onQuestionChange,
  onEvidenceSpansChange,
  onRequestEvidenceCapture,
  onFocusEvidence,
  createEvidenceId,
}: Props) {
  const [activeTab, setActiveTab] = useState<SolutionTab>("ANSWER");
  const tabListId = useId();
  const evidenceSpans = useMemo(() => legacyEvidence(question), [question]);
  const missingParts = useMemo(() => {
    const parts: string[] = [];
    if (question.correctAnswers.length === 0) parts.push("đáp án");
    if (!hasText(question.explanation)) parts.push("lời giải");
    const hasUsableEvidence = evidenceSpans.some((evidence) => (
      evidence.mode === "NO_DIRECT_EVIDENCE" || (hasValidRange(evidence) && hasText(evidence.quote))
    ));
    if (!hasUsableEvidence) parts.push("bằng chứng");
    return parts;
  }, [evidenceSpans, question.correctAnswers.length, question.explanation]);
  const solutionComplete = missingParts.length === 0;
  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  function updateEvidence(evidenceId: string, patch: Partial<ReadingEvidenceSpan>) {
    if (patch.mode === "NO_DIRECT_EVIDENCE") {
      const current = evidenceSpans.find((evidence) => evidence.id === evidenceId);
      if (current) {
        onEvidenceSpansChange([{
          ...current,
          ...patch,
          start: null,
          end: null,
          quote: "",
        }]);
      }
      return;
    }
    onEvidenceSpansChange(evidenceSpans.map((evidence) => {
      if (evidence.id !== evidenceId) return evidence;
      const next = { ...evidence, ...patch };
      if (next.mode === "NO_DIRECT_EVIDENCE") {
        return { ...next, start: null, end: null, quote: "" };
      }
      return next;
    }));
  }

  function removeEvidence(evidenceId: string) {
    onEvidenceSpansChange(evidenceSpans.filter((evidence) => evidence.id !== evidenceId));
  }

  function addNoDirectEvidence() {
    onEvidenceSpansChange([{
      id: createEvidenceId(),
      start: null,
      end: null,
      quote: "",
      label: "Không có trích dẫn trực tiếp",
      mode: "NO_DIRECT_EVIDENCE",
    }]);
  }

  return (
    <section className="mt-4 border-t border-[#e3dce2]/80 pt-3" aria-label={`Biên soạn lời giải câu ${question.number}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-xs font-extrabold text-[#211A1D]">Biên soạn lời giải</h4>
            <span
              className={`inline-flex min-h-6 items-center gap-1 rounded-lg px-2 text-[10px] font-extrabold ${
                solutionComplete
                  ? "bg-emerald-50 text-[#237653]"
                  : "bg-amber-50 text-[#8a6000]"
              }`}
              role="status"
            >
              {solutionComplete ? <Check size={12} weight="bold" /> : <WarningCircle size={12} weight="bold" />}
              {solutionComplete ? "Đủ 3/3 mục" : `Thiếu ${missingParts.join(", ")}`}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-5 text-[#746A6E]">
            Hoàn thiện đáp án, lời giải và bằng chứng để học viên đối chiếu rõ ràng.
          </p>
        </div>
        <span className="rounded-lg bg-[#f1eef4] px-2.5 py-1.5 text-[10px] font-bold text-[#746A6E]">
          {question.solutionVisibility === "TEACHER_ONLY" ? "Nội bộ" : "Lời giải học viên"}
        </span>
      </div>

      <div className="mt-3 border-b border-[#e3dce2]" role="tablist" aria-label={`Các phần lời giải câu ${question.number}`} id={tabListId}>
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`${tabListId}-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`relative min-h-10 shrink-0 px-3 text-xs font-bold transition focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]/35 ${
                  selected
                    ? "text-[#8f4458]"
                    : "text-[#746A6E] hover:text-[#211A1D]"
                }`}
              >
                {tab.label}
                {selected && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#8f4458]" />}
              </button>
            );
          })}
        </div>
      </div>

      <div id={`${tabListId}-${activeTab}`} role="tabpanel" aria-label={activeTabMeta.label} className="pt-3">
        <p className="mb-3 text-[11px] leading-5 text-[#746A6E]">{activeTabMeta.description}</p>

        {activeTab === "ANSWER" && (
          <div className="rounded-xl bg-[#f8f6fa] p-3">
            {answerEditor}
          </div>
        )}

        {activeTab === "SOLUTION" && (
          <div className="grid gap-3">
            <label>
              <span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Giải thích đáp án</span>
              <textarea
                rows={4}
                value={question.explanation ?? ""}
                onChange={(event) => onQuestionChange({ explanation: event.target.value })}
                className="w-full rounded-xl border border-[#e3dce2] bg-white p-3 text-xs leading-5 text-[#211A1D] outline-none transition placeholder:text-[#9a9095] focus:border-[#8f4458] focus:ring-2 focus:ring-[#8f4458]/15"
                placeholder="Nêu đáp án đúng, từ khóa và mối liên hệ với Passage..."
              />
            </label>

            <label>
              <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-[#746A6E]">
                <ListBullets size={14} weight="bold" />
                Các bước suy luận
              </span>
              <textarea
                rows={3}
                value={(question.reasoningSteps ?? []).join("\n")}
                onChange={(event) => onQuestionChange({
                  reasoningSteps: event.target.value
                    .split("\n")
                    .map((step) => step.trim())
                    .filter(Boolean),
                })}
                className="w-full rounded-xl border border-[#e3dce2] bg-white p-3 text-xs leading-5 text-[#211A1D] outline-none transition placeholder:text-[#9a9095] focus:border-[#8f4458] focus:ring-2 focus:ring-[#8f4458]/15"
                placeholder={"Mỗi dòng là một bước, ví dụ:\nXác định từ khóa trong câu hỏi\nTìm paraphrase trong Passage"}
              />
              <span className="mt-1 block text-[10px] text-[#746A6E]">Mỗi dòng sẽ được lưu thành một bước riêng.</span>
            </label>

            <div className="grid gap-3 lg:grid-cols-2">
              <label>
                <span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Phân tích bẫy đáp án</span>
                <textarea
                  rows={3}
                  value={question.trapAnalysis ?? ""}
                  onChange={(event) => onQuestionChange({ trapAnalysis: event.target.value })}
                  className="w-full rounded-xl border border-[#e3dce2] bg-white p-3 text-xs leading-5 text-[#211A1D] outline-none transition placeholder:text-[#9a9095] focus:border-[#8f4458] focus:ring-2 focus:ring-[#8f4458]/15"
                  placeholder="Vì sao các lựa chọn còn lại không đúng?"
                />
              </label>
              <label>
                <span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Từ vựng và paraphrase</span>
                <textarea
                  rows={3}
                  value={question.vocabularyNotes ?? ""}
                  onChange={(event) => onQuestionChange({ vocabularyNotes: event.target.value })}
                  className="w-full rounded-xl border border-[#e3dce2] bg-white p-3 text-xs leading-5 text-[#211A1D] outline-none transition placeholder:text-[#9a9095] focus:border-[#8f4458] focus:ring-2 focus:ring-[#8f4458]/15"
                  placeholder="Ghi từ khóa, collocation hoặc cách diễn đạt tương đương..."
                />
              </label>
            </div>

            <label className="max-w-md">
              <span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Quyền xem lời giải</span>
              <select
                value={question.solutionVisibility ?? "STUDENT_AFTER_SUBMIT"}
                onChange={(event) => onQuestionChange({ solutionVisibility: event.target.value as VisibilityPermission })}
                className="min-h-10 w-full rounded-xl border border-[#e3dce2] bg-white px-3 text-xs font-semibold text-[#211A1D] outline-none transition focus:border-[#8f4458] focus:ring-2 focus:ring-[#8f4458]/15"
              >
                {visibilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
        )}

        {activeTab === "EVIDENCE" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f8f6fa] p-3">
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f7e7ec] text-[#8f4458]">
                  <Highlighter size={17} weight="bold" />
                </span>
                <div>
                  <p className="text-[11px] font-extrabold text-[#211A1D]">
                    {evidenceSpans.length > 0 ? `${evidenceSpans.length} bằng chứng đã gắn` : "Chưa gắn bằng chứng"}
                  </p>
                  <p className="mt-0.5 max-w-xl text-[11px] leading-5 text-[#746A6E]">
                    Chọn đoạn văn ở Passage, sau đó thêm bằng chứng. Một câu có thể liên kết với nhiều đoạn.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRequestEvidenceCapture()}
                className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#8f4458] px-3 text-xs font-bold text-white transition hover:bg-[#743447] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]/35"
              >
                <Plus size={15} weight="bold" />
                Gắn bằng chứng
              </button>
            </div>

            {evidenceSpans.length === 0 && (
              <button
                type="button"
                onClick={addNoDirectEvidence}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-dashed border-[#d8ced6] bg-white px-3 text-xs font-bold text-[#746A6E] transition hover:border-[#8f4458] hover:bg-[#f8f6fa] hover:text-[#8f4458] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]/35"
              >
                <WarningCircle size={15} />
                Đánh dấu không có trích dẫn trực tiếp
              </button>
            )}

            {evidenceSpans.map((evidence, index) => {
              const noDirectEvidence = evidence.mode === "NO_DIRECT_EVIDENCE";
              const validRange = hasValidRange(evidence);
              return (
                <article key={evidence.id} className="border-b border-[#e3dce2] pb-3 last:border-b-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className={`grid size-7 shrink-0 place-items-center rounded-lg text-[11px] font-extrabold ${
                        noDirectEvidence ? "bg-amber-50 text-[#8a6000]" : "bg-emerald-50 text-[#237653]"
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-[11px] font-extrabold text-[#211A1D]">
                          {noDirectEvidence ? "Không có thông tin trực tiếp trong Passage" : evidence.label?.trim() || `Bằng chứng ${index + 1}`}
                        </p>
                        {!noDirectEvidence && evidence.quote && (
                          <p className="mt-1 max-w-2xl text-xs leading-5 text-[#4f474b]">“{evidence.quote}”</p>
                        )}
                        {!noDirectEvidence && !evidence.quote && (
                          <p className="mt-1 text-[11px] text-[#b4232d]">Đoạn trích chưa hợp lệ. Hãy gắn lại vị trí trong Passage.</p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {!noDirectEvidence && (
                        <button
                          type="button"
                          onClick={() => onFocusEvidence(evidence)}
                          className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#d7e8df] bg-white px-2.5 text-[11px] font-bold text-emerald-800 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]/35"
                        >
                          <Eye size={14} />
                          Xem vị trí
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeEvidence(evidence.id)}
                        className="grid size-9 place-items-center rounded-lg border border-rose-200 bg-white text-[#b4232d] transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]/35"
                        aria-label={`Xóa bằng chứng ${index + 1} của câu ${question.number}`}
                        title="Xóa bằng chứng"
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_190px]">
                    <label>
                      <span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Nhãn hiển thị</span>
                      <input
                        value={evidence.label ?? ""}
                        onChange={(event) => updateEvidence(evidence.id, { label: event.target.value })}
                        className="min-h-10 w-full rounded-xl border border-[#e3dce2] bg-white px-3 text-xs text-[#211A1D] outline-none transition placeholder:text-[#9a9095] focus:border-[#8f4458] focus:ring-2 focus:ring-[#8f4458]/15"
                        placeholder={noDirectEvidence ? "VD: Lý do chọn NOT GIVEN" : "VD: Bằng chứng chính"}
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Kiểu bằng chứng</span>
                      <select
                        value={evidence.mode}
                        onChange={(event) => updateEvidence(evidence.id, { mode: event.target.value as ReadingEvidenceMode })}
                        className="min-h-10 w-full rounded-xl border border-[#e3dce2] bg-white px-3 text-xs font-semibold text-[#211A1D] outline-none transition focus:border-[#8f4458] focus:ring-2 focus:ring-[#8f4458]/15"
                      >
                        {(Object.keys(evidenceModeLabels) as ReadingEvidenceMode[]).map((mode) => (
                          <option key={mode} value={mode}>{evidenceModeLabels[mode]}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {!noDirectEvidence && (
                    <div className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-[11px] ${
                      validRange ? "bg-emerald-50/70 text-emerald-900" : "bg-rose-50 text-[#9f2330]"
                    }`}>
                      <span>{validRange ? "Đã lưu vị trí trong Passage." : "Vị trí không còn hợp lệ hoặc chưa được chọn."}</span>
                      <button
                        type="button"
                        onClick={() => onRequestEvidenceCapture(evidence.id)}
                        className="min-h-8 rounded-lg border border-current/25 bg-white px-2.5 text-[11px] font-bold transition hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f4458]/35"
                      >
                        {validRange ? "Gắn lại" : "Chọn vị trí"}
                      </button>
                    </div>
                  )}

                  {noDirectEvidence && (
                    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-5 text-[#795100]">
                      Dùng cho dạng NOT GIVEN hoặc khi cần giải thích rằng Passage không cung cấp dữ kiện cần thiết. Hãy nêu rõ lý do trong tab Lời giải.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {activeTab === "TEACHER_NOTE" && (
          <div className="grid gap-3 lg:grid-cols-2">
            <label>
              <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-[#746A6E]">
                <NotePencil size={14} weight="bold" />
                Ghi chú nội bộ cho giáo viên
              </span>
              <textarea
                rows={4}
                value={question.teacherNote ?? ""}
                onChange={(event) => onQuestionChange({ teacherNote: event.target.value })}
                className="w-full rounded-xl border border-[#e3dce2] bg-white p-3 text-xs leading-5 text-[#211A1D] outline-none transition placeholder:text-[#9a9095] focus:border-[#8f4458] focus:ring-2 focus:ring-[#8f4458]/15"
                placeholder="Lưu ý khi chữa bài, lỗi thường gặp hoặc cách gợi mở học viên..."
              />
              <span className="mt-1 block text-[10px] text-[#746A6E]">Nội dung này không được đưa vào lời giải của học viên.</span>
            </label>
            <label>
              <span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Liên kết bài học liên quan</span>
              <input
                type="url"
                value={question.relatedLessonUrl ?? ""}
                onChange={(event) => onQuestionChange({ relatedLessonUrl: event.target.value })}
                className="min-h-10 w-full rounded-xl border border-[#e3dce2] bg-white px-3 text-xs text-[#211A1D] outline-none transition placeholder:text-[#9a9095] focus:border-[#8f4458] focus:ring-2 focus:ring-[#8f4458]/15"
                placeholder="https://..."
              />
              <span className="mt-1 block text-[10px] text-[#746A6E]">Có thể dùng để dẫn tới bài học hoặc tài liệu ôn tập sau khi làm bài.</span>
            </label>
          </div>
        )}
      </div>
    </section>
  );
}
