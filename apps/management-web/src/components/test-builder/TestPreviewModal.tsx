import {
  CheckCircle,
  Desktop,
  DeviceMobile,
  DeviceTablet,
  Eye,
  EyeSlash,
  Highlighter,
  X,
} from "@phosphor-icons/react";
import { useState } from "react";
import type {
  ListeningPartSection,
  PassageSection,
  QuestionCardItem,
  QuestionGroupItem,
  QuestionTypeFormat,
  TestBankItem,
} from "../../library-types";
import { readingQuestionTypeLabels, readingQuestionTypes } from "./readingQuestionGroupConfig";

type Props = {
  test: TestBankItem;
  onClose: () => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isQuestionType(value: unknown): value is QuestionTypeFormat {
  return typeof value === "string" && readingQuestionTypes.includes(value as QuestionTypeFormat);
}

function readPassageSpan(value: unknown): QuestionCardItem["passageSpan"] {
  if (!isRecord(value)) return undefined;
  const start = Number(value.start);
  const end = Number(value.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) return undefined;
  return {
    start,
    end,
    quote: typeof value.quote === "string" ? value.quote : undefined,
  };
}

function readQuestions(value: unknown): QuestionCardItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((question) => ({
    id: typeof question.id === "string" ? question.id : "question",
    number: typeof question.number === "number" ? question.number : 0,
    typeFormat: isQuestionType(question.typeFormat) ? question.typeFormat : "FILL_IN_BLANK",
    prompt: typeof question.prompt === "string" ? question.prompt : "",
    options: Array.isArray(question.options) ? question.options as QuestionCardItem["options"] : [],
    correctAnswers: Array.isArray(question.correctAnswers) ? question.correctAnswers.map(String) : [],
    acceptableAnswers: Array.isArray(question.acceptableAnswers) ? question.acceptableAnswers.map(String) : [],
    explanation: typeof question.explanation === "string" ? question.explanation : "",
    trapAnalysis: typeof question.trapAnalysis === "string" ? question.trapAnalysis : "",
    vocabularyNotes: typeof question.vocabularyNotes === "string" ? question.vocabularyNotes : "",
    teacherNote: typeof question.teacherNote === "string" ? question.teacherNote : "",
    passageSpan: readPassageSpan(question.passageSpan),
    isComplete: Boolean(question.isComplete),
    hasError: Boolean(question.hasError),
    errorMessage: typeof question.errorMessage === "string" ? question.errorMessage : undefined,
  }));
}

function readGroups(value: unknown): QuestionGroupItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((group) => ({
    id: typeof group.id === "string" ? group.id : "group",
    title: typeof group.title === "string" ? group.title : "Questions",
    titleMode: group.titleMode === "CUSTOM" ? "CUSTOM" : "AUTO",
    startQuestionNo: typeof group.startQuestionNo === "number" ? group.startQuestionNo : 0,
    endQuestionNo: typeof group.endQuestionNo === "number" ? group.endQuestionNo : 0,
    typeFormat: isQuestionType(group.typeFormat) ? group.typeFormat : "FILL_IN_BLANK",
    instructions: typeof group.instructions === "string" ? group.instructions : "",
    wordLimitRule: typeof group.wordLimitRule === "string" ? group.wordLimitRule : "",
    answerSource: group.answerSource === "OPTION_BANK" ? "OPTION_BANK" : "PASSAGE",
    requiredAnswerCount: typeof group.requiredAnswerCount === "number" ? group.requiredAnswerCount : undefined,
    sharedOptions: Array.isArray(group.sharedOptions) ? group.sharedOptions as QuestionGroupItem["sharedOptions"] : [],
    allowOptionReused: Boolean(group.allowOptionReused),
    linkedAudioTimestamp: typeof group.linkedAudioTimestamp === "string" ? group.linkedAudioTimestamp : undefined,
    questions: readQuestions(group.questions),
    isCollapsed: Boolean(group.isCollapsed),
  }));
}

function readPassages(content: Record<string, unknown>): PassageSection[] {
  const rawPassages = content.passages;
  if (Array.isArray(rawPassages)) {
    return rawPassages.filter(isRecord).map((passage, index) => ({
      id: typeof passage.id === "string" ? passage.id : `passage-${index + 1}`,
      passageNo: typeof passage.passageNo === "number" ? passage.passageNo : index + 1,
      title: typeof passage.title === "string" ? passage.title : `Reading Passage ${index + 1}`,
      content: typeof passage.content === "string" ? passage.content : "",
      teacherAnnotations: Array.isArray(passage.teacherAnnotations)
        ? passage.teacherAnnotations as PassageSection["teacherAnnotations"]
        : [],
      questionGroups: readGroups(passage.questionGroups),
    }));
  }

  const legacyGroups = readGroups(content.questionGroups);
  if (legacyGroups.length > 0) {
    return [{
      id: "legacy-passage-1",
      passageNo: 1,
      title: "Reading Passage 1",
      content: "",
      teacherAnnotations: [],
      questionGroups: legacyGroups,
    }];
  }

  return [];
}

function readListeningParts(content: Record<string, unknown>): ListeningPartSection[] {
  if (!Array.isArray(content.parts)) return [];
  return content.parts.filter(isRecord).map((part, index) => ({
    id: typeof part.id === "string" ? part.id : `listening-part-${index + 1}`,
    partNo: typeof part.partNo === "number" ? part.partNo : index + 1,
    title: typeof part.title === "string" ? part.title : `Listening Part ${index + 1}`,
    audioUrl: typeof part.audioUrl === "string" ? part.audioUrl : undefined,
    audioFilename: typeof part.audioFilename === "string" ? part.audioFilename : undefined,
    audioDurationSeconds: typeof part.audioDurationSeconds === "number" ? part.audioDurationSeconds : undefined,
    transcriptHtml: typeof part.transcriptHtml === "string" ? part.transcriptHtml : "",
    questionGroups: readGroups(part.questionGroups),
  }));
}

function renderAnswer(question: QuestionCardItem, group: QuestionGroupItem) {
  if (question.options.length > 0) {
    return question.correctAnswers
      .map((answer) => question.options.find((option) => option.id === answer)?.label ?? answer)
      .join(", ");
  }
  if (group.sharedOptions && group.sharedOptions.length > 0) {
    return question.correctAnswers
      .map((answer) => group.sharedOptions?.find((option) => option.id === answer)?.code ?? answer)
      .join(", ");
  }
  return question.correctAnswers.join(", ");
}

function questionTypeLabel(value: QuestionCardItem["typeFormat"]) {
  return readingQuestionTypeLabels[value];
}

function ReadingPreview({
  test,
  showAnswers,
  showExplanations,
}: {
  test: TestBankItem;
  showAnswers: boolean;
  showExplanations: boolean;
}) {
  const passages = readPassages(test.builderContent ?? {});

  if (passages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#e3dce2] bg-[#f8f6fa] p-8 text-center">
        <h4 className="font-display text-base font-bold text-[#211A1D]">Draft này chưa có nội dung Reading</h4>
        <p className="mt-1 text-sm text-[#746A6E]">Hãy quay lại Builder để thêm passage và câu hỏi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {passages.map((passage) => (
        <section key={passage.id} className="rounded-xl border border-[#e3dce2] bg-white p-4">
          <div className="rounded-xl border border-[#ead2da] bg-[#f7e7ec]/40 p-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8f4458]">
              Reading Passage {passage.passageNo}
            </span>
            <h4 className="mt-1 font-display text-base font-bold text-[#743447]">{passage.title}</h4>
            {passage.content ? (
              <div
                className="prose mt-3 max-w-none text-xs leading-6 text-[#211A1D]"
                dangerouslySetInnerHTML={{ __html: passage.content }}
              />
            ) : (
              <p className="mt-3 rounded-lg border border-dashed border-[#e3dce2] bg-white p-3 text-xs text-[#746A6E]">
                Passage này chưa có nội dung bài đọc.
              </p>
            )}
          </div>

          <div className="mt-4 space-y-4">
            {passage.questionGroups.length === 0 && (
              <p className="rounded-lg border border-dashed border-[#e3dce2] p-3 text-xs text-[#746A6E]">
                Passage này chưa có question group.
              </p>
            )}
            {passage.questionGroups.map((group) => (
              <div key={group.id} className="rounded-xl border border-[#e3dce2] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e3dce2] pb-3">
                  <div>
                    <h5 className="font-display text-sm font-bold text-[#211A1D]">{group.title}</h5>
                    <p className="mt-1 text-xs leading-5 text-[#746A6E]">{group.instructions || "Chưa có hướng dẫn."}</p>
                  </div>
                  <span className="rounded-full bg-[#f1eef4] px-2.5 py-0.5 text-[10px] font-bold text-[#746A6E]">
                    {questionTypeLabel(group.typeFormat)}
                  </span>
                </div>

                {group.sharedOptions && group.sharedOptions.length > 0 && (
                  <div className="mt-3 rounded-lg bg-[#f8f6fa] p-3">
                    <p className="text-[11px] font-bold text-[#746A6E]">Option bank</p>
                    <div className="mt-2 grid gap-1 text-xs text-[#211A1D] md:grid-cols-2">
                      {group.sharedOptions.map((option) => (
                        <span key={option.id}><strong>{option.code}.</strong> {option.text}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  {group.questions.map((question) => (
                    <article key={question.id} className="rounded-xl border border-[#e3dce2] bg-[#fbf9fb] p-3">
                      <div className="flex items-start gap-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#8f4458] text-xs font-bold text-white">
                          {question.number}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold leading-5 text-[#211A1D]">{question.prompt || "Chưa nhập nội dung câu hỏi."}</p>
                          {question.options.length > 0 && (
                            <div className="mt-2 grid gap-2">
                              {question.options.map((option) => {
                                const correct = question.correctAnswers.includes(option.id);
                                return (
                                  <span
                                    key={option.id}
                                    className={`rounded-lg border px-3 py-2 text-xs ${
                                      showAnswers && correct
                                        ? "border-emerald-300 bg-emerald-50 text-[#237653]"
                                        : "border-[#e3dce2] bg-white text-[#211A1D]"
                                    }`}
                                  >
                                    <strong>{option.label}.</strong> {option.text || "Chưa nhập option"}
                                    {showAnswers && correct && <CheckCircle size={14} className="ml-2 inline" />}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          {showAnswers && (
                            <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-[#237653]">
                              Đáp án: {renderAnswer(question, group) || "Chưa có đáp án"}
                            </p>
                          )}
                          {showExplanations && question.explanation && (
                            <p className="mt-2 rounded-lg border border-[#e3dce2] bg-white px-3 py-2 text-xs leading-5 text-[#746A6E]">
                              <strong className="text-[#211A1D]">Giải thích:</strong> {question.explanation}
                            </p>
                          )}
                          {showExplanations && question.passageSpan?.quote && (
                            <div className="mt-2 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-5 text-[#18563e]">
                              <Highlighter size={15} weight="bold" className="mt-0.5 shrink-0" aria-hidden="true" />
                              <p className="min-w-0">
                                <strong>Vị trí đối chiếu:</strong> “{question.passageSpan.quote}”
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function GenericPreview({ test }: { test: TestBankItem }) {
  const content = test.builderContent ?? {};
  const promptText = typeof content.promptText === "string" ? content.promptText : "";
  const transcriptText = typeof content.transcriptText === "string" ? content.transcriptText : "";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#e3dce2] bg-[#f7e7ec]/30 p-4">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8f4458]">
          {test.skill}
        </span>
        <h4 className="mt-1 font-display text-base font-bold text-[#743447]">{test.title}</h4>
      </div>
      <div className="rounded-xl border border-[#e3dce2] bg-white p-4">
        <p className="whitespace-pre-wrap text-sm leading-6 text-[#211A1D]">
          {promptText || transcriptText || "Draft này chưa có nội dung preview chi tiết."}
        </p>
      </div>
    </div>
  );
}

function ListeningPreview({ test, showAnswers, showExplanations }: {
  test: TestBankItem; showAnswers: boolean; showExplanations: boolean;
}) {
  const parts = readListeningParts(test.builderContent ?? {});
  if (parts.length === 0) return <div className="rounded-xl border border-dashed border-[#e3dce2] p-8 text-center text-sm text-[#746A6E]">Draft này chưa có nội dung Listening.</div>;
  return <div className="space-y-6">{parts.map((part) => <section key={part.id} className="rounded-xl border border-[#e3dce2] bg-white p-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ead2da] bg-[#fff8fa] p-4"><div><span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8f4458]">Listening Part {part.partNo}</span><h4 className="mt-1 font-display text-base font-bold text-[#743447]">{part.title}</h4></div><span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#746A6E]">{part.audioFilename || "Chưa có audio"}</span></div>
    {showExplanations && part.transcriptHtml && <details className="mt-3 rounded-xl border border-[#e3dce2] bg-[#f8f6fa] p-3"><summary className="cursor-pointer text-xs font-bold text-[#8f4458]">Xem transcript</summary><div className="prose mt-3 max-w-none text-xs leading-6" dangerouslySetInnerHTML={{ __html: part.transcriptHtml }} /></details>}
    <div className="mt-4 space-y-4">{part.questionGroups.map((group) => <div key={group.id} className="rounded-xl border border-[#e3dce2] p-4"><div className="border-b border-[#e3dce2] pb-3"><h5 className="text-sm font-bold">{group.title}</h5><p className="mt-1 text-xs leading-5 text-[#746A6E]">{group.instructions}</p></div><div className="mt-3 space-y-3">{group.questions.map((question) => <article key={question.id} className="rounded-xl bg-[#fbf9fb] p-3"><div className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#8f4458] text-xs font-bold text-white">{question.number}</span><div className="min-w-0 flex-1"><p className="text-xs font-bold leading-5">{question.prompt || "Chưa nhập câu hỏi."}</p>{question.options.length > 0 && <div className="mt-2 grid gap-2">{question.options.map((option) => <span key={option.id} className={`rounded-lg border px-3 py-2 text-xs ${showAnswers && question.correctAnswers.includes(option.id) ? "border-emerald-300 bg-emerald-50 text-[#237653]" : "border-[#e3dce2] bg-white"}`}><strong>{option.label}.</strong> {option.text}</span>)}</div>}{showAnswers && <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-[#237653]">Đáp án: {renderAnswer(question, group) || "Chưa có đáp án"}</p>}{showExplanations && question.explanation && <p className="mt-2 rounded-lg border border-[#e3dce2] bg-white px-3 py-2 text-xs leading-5 text-[#746A6E]"><strong className="text-[#211A1D]">Giải thích:</strong> {question.explanation}</p>}</div></div></article>)}</div></div>)}</div>
  </section>)}</div>;
}

export default function TestPreviewModal({ test, onClose }: Props) {
  const [device, setDevice] = useState<"DESKTOP" | "TABLET" | "MOBILE">("DESKTOP");
  const [mode, setMode] = useState<"TAKE" | "REVIEW">("TAKE");
  const [showAnswers, setShowAnswers] = useState(true);
  const [showExplanations, setShowExplanations] = useState(true);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <header className="flex shrink-0 items-center justify-between rounded-xl bg-white px-6 py-3 shadow-lg">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8f4458]">
              CHẾ ĐỘ XEM TRƯỚC GIẢ LẬP HỌC VIÊN
            </span>
            <h3 className="font-display text-sm font-bold text-[#211A1D]">{test.title}</h3>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-[#237653]">
            {test.skill} • {test.durationMinutes} phút
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-xl bg-[#f1eef4] p-1">
            <button
              type="button"
              onClick={() => setDevice("DESKTOP")}
              className={`rounded-lg p-1.5 text-xs font-bold transition ${
                device === "DESKTOP" ? "bg-white text-[#8f4458] shadow-sm" : "text-[#746A6E]"
              }`}
              title="Desktop"
            >
              <Desktop size={18} />
            </button>
            <button
              type="button"
              onClick={() => setDevice("TABLET")}
              className={`rounded-lg p-1.5 text-xs font-bold transition ${
                device === "TABLET" ? "bg-white text-[#8f4458] shadow-sm" : "text-[#746A6E]"
              }`}
              title="Tablet"
            >
              <DeviceTablet size={18} />
            </button>
            <button
              type="button"
              onClick={() => setDevice("MOBILE")}
              className={`rounded-lg p-1.5 text-xs font-bold transition ${
                device === "MOBILE" ? "bg-white text-[#8f4458] shadow-sm" : "text-[#746A6E]"
              }`}
              title="Mobile"
            >
              <DeviceMobile size={18} />
            </button>
          </div>

          <div className="flex items-center rounded-xl border border-[#e3dce2] bg-white p-1">
            <button
              type="button"
              onClick={() => setMode("TAKE")}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                mode === "TAKE" ? "bg-[#8f4458] text-white" : "text-[#746A6E]"
              }`}
            >
              Làm bài
            </button>
            <button
              type="button"
              onClick={() => setMode("REVIEW")}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                mode === "REVIEW" ? "bg-[#8f4458] text-white" : "text-[#746A6E]"
              }`}
            >
              Xem lại
            </button>
          </div>

          <div className="flex items-center gap-3 border-l border-[#e3dce2] pl-3">
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#746A6E]">
              <input
                type="checkbox"
                checked={showAnswers}
                onChange={(event) => setShowAnswers(event.target.checked)}
                className="accent-[#8f4458]"
              />
              {showAnswers ? <Eye size={15} /> : <EyeSlash size={15} />}
              Đáp án
            </label>

            <label className="flex items-center gap-1.5 text-xs font-bold text-[#746A6E]">
              <input
                type="checkbox"
                checked={showExplanations}
                onChange={(event) => setShowExplanations(event.target.checked)}
                className="accent-[#8f4458]"
              />
              Giải thích
            </label>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl bg-[#f1eef4] text-[#211A1D] hover:bg-rose-50 hover:text-[#b4232d]"
            aria-label="Đóng preview"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      <main className="custom-scrollbar flex flex-1 items-center justify-center overflow-auto p-4">
        <div
          className={`flex flex-col overflow-hidden bg-white shadow-2xl transition-all duration-300 ${
            device === "DESKTOP"
              ? "preview-desktop rounded-[20px]"
              : device === "TABLET"
              ? "preview-tablet"
              : "preview-mobile"
          }`}
        >
          <div className="flex items-center justify-between border-b border-[#e3dce2] bg-[#F8F6FA] px-6 py-3">
            <span className="font-display text-sm font-bold text-[#8f4458]">The IELTS Spells Student Exam</span>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-[#b4232d]">
              Thời gian: {test.durationMinutes} phút
            </span>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
            {test.skill === "READING" ? (
              <ReadingPreview test={test} showAnswers={showAnswers || mode === "REVIEW"} showExplanations={showExplanations || mode === "REVIEW"} />
            ) : test.skill === "LISTENING" ? (
              <ListeningPreview test={test} showAnswers={showAnswers || mode === "REVIEW"} showExplanations={showExplanations || mode === "REVIEW"} />
            ) : (
              <GenericPreview test={test} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
