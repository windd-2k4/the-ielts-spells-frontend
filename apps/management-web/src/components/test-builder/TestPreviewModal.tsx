import {
  ArrowRight, CheckCircle, Desktop, DeviceMobile, DeviceTablet, Eye, EyeSlash,
  ArrowCounterClockwise, Headphones, Highlighter, Lightbulb, ListNumbers, Microphone, SpeakerHigh,
  SpinnerGap, Stop, Timer, WarningCircle, X, XCircle,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ListeningPartSection, PassageSection, QuestionCardItem, QuestionGroupItem,
  QuestionTypeFormat, SpeakingHintStep, SpeakingPartSection, SpeakingQuestionItem,
  TestBankItem, WritingTaskSection,
} from "../../library-types";
import { apiBlob } from "../../lib/api";
import AuthenticatedMediaImage from "./AuthenticatedMediaImage";
import {
  questionTypeUsesGapTemplate, questionTypeUsesQuestionOptions, questionTypeUsesSharedOptions,
  readingQuestionTypeLabels, readingQuestionTypes,
} from "./readingQuestionGroupConfig";

type Props = { test: TestBankItem; onClose: () => void };
type PreviewMode = "TAKE" | "REVIEW";
type Device = "DESKTOP" | "TABLET" | "MOBILE";
type ResponseMap = Record<string, string[]>;
type WritingResponseMap = Record<string, Record<string, string>>;

const GAP_TOKEN = /\[\[(\d+)\]\]/g;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isQuestionType(value: unknown): value is QuestionTypeFormat {
  return typeof value === "string" && readingQuestionTypes.includes(value as QuestionTypeFormat);
}

function readGroupIllustration(value: unknown): QuestionGroupItem["illustration"] {
  if (!isRecord(value) || typeof value.assetId !== "string" || typeof value.fileUrl !== "string" || typeof value.filename !== "string") return undefined;
  return {
    assetId: value.assetId,
    fileUrl: value.fileUrl,
    filename: value.filename,
    altText: typeof value.altText === "string" ? value.altText : "",
    width: typeof value.width === "number" ? value.width : undefined,
    height: typeof value.height === "number" ? value.height : undefined,
  };
}

function readPassageSpan(value: unknown): QuestionCardItem["passageSpan"] {
  if (!isRecord(value)) return undefined;
  const start = Number(value.start);
  const end = Number(value.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) return undefined;
  return { start, end, quote: typeof value.quote === "string" ? value.quote : undefined };
}

function readQuestions(value: unknown): QuestionCardItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((question, index) => ({
    id: typeof question.id === "string" ? question.id : `preview-question-${index + 1}`,
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
  return value.filter(isRecord).map((group, index) => ({
    id: typeof group.id === "string" ? group.id : `preview-group-${index + 1}`,
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
    gapFillTemplate: typeof group.gapFillTemplate === "string" ? group.gapFillTemplate : undefined,
    gapFillLayout: group.gapFillLayout === "LIST" ? "LIST" : "PARAGRAPH",
    illustration: readGroupIllustration(group.illustration),
    linkedAudioTimestamp: typeof group.linkedAudioTimestamp === "string" ? group.linkedAudioTimestamp : undefined,
    questions: readQuestions(group.questions),
    isCollapsed: false,
  }));
}

function readPassages(content: Record<string, unknown>): PassageSection[] {
  if (Array.isArray(content.passages)) {
    return content.passages.filter(isRecord).map((passage, index) => ({
      id: typeof passage.id === "string" ? passage.id : `passage-${index + 1}`,
      passageNo: typeof passage.passageNo === "number" ? passage.passageNo : index + 1,
      title: typeof passage.title === "string" ? passage.title : `Reading Passage ${index + 1}`,
      content: typeof passage.content === "string" ? passage.content : "",
      teacherAnnotations: [],
      questionGroups: readGroups(passage.questionGroups),
    }));
  }
  const questionGroups = readGroups(content.questionGroups);
  return questionGroups.length ? [{ id: "legacy-passage", passageNo: 1, title: "Reading Passage 1", content: "", teacherAnnotations: [], questionGroups }] : [];
}

function readListeningParts(content: Record<string, unknown>): ListeningPartSection[] {
  if (!Array.isArray(content.parts)) return [];
  return content.parts.filter(isRecord).map((part, index) => ({
    id: typeof part.id === "string" ? part.id : `part-${index + 1}`,
    partNo: typeof part.partNo === "number" ? part.partNo : index + 1,
    title: typeof part.title === "string" ? part.title : `Listening Part ${index + 1}`,
    audioUrl: typeof part.audioUrl === "string" ? part.audioUrl : undefined,
    audioFilename: typeof part.audioFilename === "string" ? part.audioFilename : undefined,
    audioDurationSeconds: typeof part.audioDurationSeconds === "number" ? part.audioDurationSeconds : undefined,
    transcriptHtml: typeof part.transcriptHtml === "string" ? part.transcriptHtml : "",
    questionGroups: readGroups(part.questionGroups),
  }));
}

function readWritingTasks(content: Record<string, unknown>): WritingTaskSection[] {
  if (!Array.isArray(content.tasks)) {
    const promptHtml = typeof content.promptText === "string" ? content.promptText : "";
    if (!promptHtml.trim()) return [];
    const taskNo: 1 | 2 = content.sectionsPreset === "TASK_2" || content.format === "TASK_2" ? 2 : 1;
    return [{
      id: `legacy-writing-task-${taskNo}`,
      taskNo,
      title: `Writing Task ${taskNo}`,
      promptHtml,
      suggestedTimeMinutes: typeof content.timeMinutes === "number" ? content.timeMinutes : taskNo === 1 ? 20 : 40,
      minWords: typeof content.minWords === "number" ? content.minWords : taskNo === 1 ? 150 : 250,
      responseMode: "STRUCTURED",
      rubric: { taskAchievementWeight: 25, coherenceCohesionWeight: 25, lexicalResourceWeight: 25, grammaticalAccuracyWeight: 25 },
      sampleBand8Answer: typeof content.sampleAnswer === "string" ? content.sampleAnswer : "",
      enableAiAssessment: false,
    }];
  }
  return content.tasks.filter(isRecord).map((task, index) => {
    const taskNo: 1 | 2 = task.taskNo === 2 || index === 1 ? 2 : 1;
    const rubric = isRecord(task.rubric) ? task.rubric : {};
    return {
      id: typeof task.id === "string" ? task.id : `preview-writing-task-${taskNo}`,
      taskNo,
      title: typeof task.title === "string" ? task.title : `Writing Task ${taskNo}`,
      promptHtml: typeof task.promptHtml === "string" ? task.promptHtml : "",
      imageUrl: typeof task.imageUrl === "string" ? task.imageUrl : undefined,
      imageAssetId: typeof task.imageAssetId === "string" ? task.imageAssetId : undefined,
      imageFilename: typeof task.imageFilename === "string" ? task.imageFilename : undefined,
      imageAltText: typeof task.imageAltText === "string" ? task.imageAltText : undefined,
      suggestedTimeMinutes: typeof task.suggestedTimeMinutes === "number" ? task.suggestedTimeMinutes : taskNo === 1 ? 20 : 40,
      minWords: typeof task.minWords === "number" ? task.minWords : taskNo === 1 ? 150 : 250,
      responseMode: task.responseMode === "FREEFORM" ? "FREEFORM" : "STRUCTURED",
      rubric: {
        taskAchievementWeight: typeof rubric.taskAchievementWeight === "number" ? rubric.taskAchievementWeight : 25,
        coherenceCohesionWeight: typeof rubric.coherenceCohesionWeight === "number" ? rubric.coherenceCohesionWeight : 25,
        lexicalResourceWeight: typeof rubric.lexicalResourceWeight === "number" ? rubric.lexicalResourceWeight : 25,
        grammaticalAccuracyWeight: typeof rubric.grammaticalAccuracyWeight === "number" ? rubric.grammaticalAccuracyWeight : 25,
        notes: typeof rubric.notes === "string" ? rubric.notes : "",
      },
      sampleBand8Answer: typeof task.sampleBand8Answer === "string" ? task.sampleBand8Answer : "",
      teacherNotes: typeof task.teacherNotes === "string" ? task.teacherNotes : "",
      enableAiAssessment: Boolean(task.enableAiAssessment),
    };
  });
}

function readSpeakingParts(content: Record<string, unknown>): SpeakingPartSection[] {
  if (!Array.isArray(content.parts)) return [];
  return content.parts.filter(isRecord).map((part, index) => {
    const partNo = part.partNo === 2 ? 2 : part.partNo === 3 ? 3 : 1;
    const rawQuestions = Array.isArray(part.questions) ? part.questions.filter(isRecord) : [];
    const questions: SpeakingQuestionItem[] = rawQuestions.map((question, questionIndex) => ({
      id: typeof question.id === "string" ? question.id : `speaking-question-${index}-${questionIndex}`,
      promptText: typeof question.promptText === "string" ? question.promptText : "",
      hintsEnabled: question.hintsEnabled !== false,
      hintSteps: Array.isArray(question.hintSteps) ? question.hintSteps.filter(isRecord).map((step, stepIndex) => ({
        id: typeof step.id === "string" ? step.id : `speaking-step-${stepIndex}`,
        title: typeof step.title === "string" ? step.title : `Bước ${stepIndex + 1}`,
        instruction: typeof step.instruction === "string" ? step.instruction : "",
        options: Array.isArray(step.options) ? step.options.filter(isRecord).map((option, optionIndex) => ({
          id: typeof option.id === "string" ? option.id : `speaking-option-${optionIndex}`,
          label: typeof option.label === "string" ? option.label : "",
          phrase: typeof option.phrase === "string" ? option.phrase : "",
        })) : [],
      })) : [],
      sampleResponseText: typeof question.sampleResponseText === "string" ? question.sampleResponseText : "",
      teacherNotes: typeof question.teacherNotes === "string" ? question.teacherNotes : "",
    }));
    return {
      id: typeof part.id === "string" ? part.id : `speaking-part-${index + 1}`,
      partNo,
      topicTitle: typeof part.topicTitle === "string" ? part.topicTitle : "",
      cueCardPromptHtml: typeof part.cueCardPromptHtml === "string" ? part.cueCardPromptHtml : "",
      cueCardBullets: Array.isArray(part.cueCardBullets) ? part.cueCardBullets.map(String) : [],
      hintsEnabled: part.hintsEnabled !== false,
      hintSteps: Array.isArray(part.hintSteps) ? part.hintSteps.filter(isRecord).map((step, stepIndex) => ({
        id: typeof step.id === "string" ? step.id : `speaking-part-step-${stepIndex}`,
        title: typeof step.title === "string" ? step.title : `Bước ${stepIndex + 1}`,
        instruction: typeof step.instruction === "string" ? step.instruction : "",
        options: Array.isArray(step.options) ? step.options.filter(isRecord).map((option, optionIndex) => ({
          id: typeof option.id === "string" ? option.id : `speaking-part-option-${optionIndex}`,
          label: typeof option.label === "string" ? option.label : "",
          phrase: typeof option.phrase === "string" ? option.phrase : "",
        })) : [],
      })) : [],
      preparationTimeSeconds: typeof part.preparationTimeSeconds === "number" ? part.preparationTimeSeconds : 0,
      answerTimeSeconds: typeof part.answerTimeSeconds === "number" ? part.answerTimeSeconds : 30,
      followUpQuestions: Array.isArray(part.followUpQuestions) ? part.followUpQuestions.map(String) : [],
      questions,
      sampleResponseText: typeof part.sampleResponseText === "string" ? part.sampleResponseText : "",
      recordingConfig: { allowReRecord: true, maxAttempts: 3 },
      rubric: { fluencyCoherenceWeight: 25, lexicalResourceWeight: 25, grammaticalAccuracyWeight: 25, pronunciationWeight: 25 },
    };
  });
}

function normalized(value: string) {
  return value.trim().toLocaleLowerCase("en").replace(/\s+/g, " ");
}

function isCorrect(question: QuestionCardItem, response: string[]) {
  if (!response.length) return false;
  if (questionTypeUsesQuestionOptions(question.typeFormat)) {
    const actual = [...response].sort();
    const expected = [...question.correctAnswers].sort();
    return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
  }
  const accepted = [...question.correctAnswers, ...(question.acceptableAnswers ?? [])].map(normalized);
  return response.every((value) => accepted.includes(normalized(value)));
}

function answerLabel(question: QuestionCardItem, group: QuestionGroupItem) {
  const options = question.options.length ? question.options : group.sharedOptions ?? [];
  return question.correctAnswers.map((answer) => {
    const option = options.find((item) => item.id === answer);
    return option ? `${"label" in option ? option.label : option.code}. ${option.text}` : answer;
  }).join(", ");
}

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function scrollToQuestion(questionId: string) {
  document.getElementById(`preview-question-${questionId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function ReviewFeedback({ question, group, response, showAnswer, showExplanation }: {
  question: QuestionCardItem;
  group: QuestionGroupItem;
  response: string[];
  showAnswer: boolean;
  showExplanation: boolean;
}) {
  const correct = isCorrect(question, response);
  return <div className="mt-3 space-y-2">
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${correct ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-[#B42335]"}`}>
      {correct ? <CheckCircle size={16} weight="fill" /> : <XCircle size={16} weight="fill" />}
      {correct ? "Trả lời đúng" : response.length ? "Câu trả lời chưa đúng" : "Chưa trả lời"}
    </div>
    {showAnswer && <p className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-emerald-800"><strong>Đáp án:</strong> {answerLabel(question, group) || "Chưa thiết lập"}</p>}
    {showExplanation && question.explanation && <p className="rounded-lg border border-[#DED7DA] bg-white px-3 py-2 text-xs leading-5 text-[#6F676C]"><strong className="text-[#292528]">Giải thích:</strong> {question.explanation}</p>}
    {showExplanation && question.passageSpan?.quote && <p className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs leading-5 text-emerald-900"><Highlighter size={15} className="mt-0.5 shrink-0" /><span><strong>Vị trí đối chiếu:</strong> “{question.passageSpan.quote}”</span></p>}
  </div>;
}

function QuestionInput({ question, group, response, disabled, onChange }: {
  question: QuestionCardItem;
  group: QuestionGroupItem;
  response: string[];
  disabled: boolean;
  onChange: (value: string[]) => void;
}) {
  const shared = questionTypeUsesSharedOptions(group.typeFormat, group.answerSource) ? group.sharedOptions ?? [] : [];
  if (shared.length) {
    return <label className="mt-3 block"><span className="sr-only">Trả lời câu {question.number}</span><select disabled={disabled} value={response[0] ?? ""} onChange={(event) => onChange(event.target.value ? [event.target.value] : [])} className="min-h-11 w-full rounded-xl border border-[#DED7DA] bg-white px-3 text-sm focus:border-[#C85F78] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA] disabled:bg-[#F2ECEE]"><option value="">Chọn đáp án</option>{shared.map((option) => <option key={option.id} value={option.id}>{option.code}. {option.text}</option>)}</select></label>;
  }
  const fixedOptions = question.typeFormat === "TRUE_FALSE_NOT_GIVEN"
    ? ["TRUE", "FALSE", "NOT GIVEN"]
    : question.typeFormat === "YES_NO_NOT_GIVEN" ? ["YES", "NO", "NOT GIVEN"] : [];
  const options = question.options.length
    ? question.options.map((option) => ({ id: option.id, label: `${option.label}. ${option.text}` }))
    : fixedOptions.map((value) => ({ id: value, label: value }));
  if (options.length) {
    const multiple = question.typeFormat === "MULTIPLE_ANSWERS";
    return <fieldset className="mt-3 grid gap-2"><legend className="sr-only">Các lựa chọn câu {question.number}</legend>{options.map((option) => {
      const checked = response.includes(option.id);
      return <label key={option.id} className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${checked ? "border-[#C85F78] bg-[#F7E5EA]" : "border-[#DED7DA] bg-white hover:border-[#C85F78]/60"} ${disabled ? "cursor-default" : ""}`}><input type={multiple ? "checkbox" : "radio"} name={`preview-answer-${question.id}`} checked={checked} disabled={disabled} onChange={(event) => onChange(multiple ? event.target.checked ? [...response, option.id] : response.filter((item) => item !== option.id) : [option.id])} className="mt-0.5 accent-[#C85F78]" /><span>{option.label}</span></label>;
    })}</fieldset>;
  }
  return <label className="mt-3 block"><span className="sr-only">Trả lời câu {question.number}</span><input disabled={disabled} value={response[0] ?? ""} onChange={(event) => onChange(event.target.value ? [event.target.value] : [])} placeholder="Nhập câu trả lời" autoComplete="off" spellCheck={false} className="min-h-11 w-full rounded-xl border border-[#DED7DA] bg-white px-3 text-sm focus:border-[#C85F78] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA] disabled:bg-[#F2ECEE]" /></label>;
}

function GapTemplate({ group, responses, review, showAnswers, showExplanations, onAnswer }: {
  group: QuestionGroupItem;
  responses: ResponseMap;
  review: boolean;
  showAnswers: boolean;
  showExplanations: boolean;
  onAnswer: (questionId: string, value: string[]) => void;
}) {
  const template = group.gapFillTemplate ?? "";
  const parts: Array<{ text?: string; slot?: number; offset: number }> = [];
  let cursor = 0;
  for (const match of template.matchAll(GAP_TOKEN)) {
    if (match.index > cursor) parts.push({ text: template.slice(cursor, match.index), offset: cursor });
    parts.push({ slot: Number(match[1]), offset: match.index });
    cursor = match.index + match[0].length;
  }
  if (cursor < template.length) parts.push({ text: template.slice(cursor), offset: cursor });
  return <div className="mt-4 rounded-2xl border border-[#DED7DA] bg-[#FFFCFC] p-4 sm:p-5">
    <div className="whitespace-pre-wrap text-[15px] leading-9 text-[#292528]">{parts.map((part) => {
      if (part.text !== undefined) return <span key={`text-${part.offset}`}>{part.text}</span>;
      const question = group.questions[Number(part.slot) - 1];
      if (!question) return <strong key={`missing-${part.offset}`} className="text-[#B42335]">[[{part.slot}]]</strong>;
      return <span key={`gap-${part.offset}`} id={`preview-question-${question.id}`} className="mx-1 inline-flex items-center gap-1 align-middle"><strong className="text-xs tabular-nums text-[#AD4C64]">{question.number}</strong><input aria-label={`Trả lời câu ${question.number}`} disabled={review} value={responses[question.id]?.[0] ?? ""} onChange={(event) => onAnswer(question.id, event.target.value ? [event.target.value] : [])} autoComplete="off" spellCheck={false} className="h-9 w-32 rounded-lg border border-[#C85F78] bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F7E5EA] disabled:bg-[#F2ECEE]" /></span>;
    })}</div>
    {review && <div className="mt-5 grid gap-3 border-t border-[#DED7DA] pt-4">{group.questions.map((question) => <div key={question.id}><p className="text-xs font-bold text-[#292528]">Câu {question.number}: {responses[question.id]?.[0] || "Chưa trả lời"}</p><ReviewFeedback question={question} group={group} response={responses[question.id] ?? []} showAnswer={showAnswers} showExplanation={showExplanations} /></div>)}</div>}
  </div>;
}

function QuestionGroup({ group, responses, review, showAnswers, showExplanations, onAnswer }: {
  group: QuestionGroupItem;
  responses: ResponseMap;
  review: boolean;
  showAnswers: boolean;
  showExplanations: boolean;
  onAnswer: (questionId: string, value: string[]) => void;
}) {
  const hasGapTemplate = questionTypeUsesGapTemplate(group.typeFormat, group.answerSource) && Boolean(group.gapFillTemplate?.trim());
  return <section className="border-b border-[#DED7DA] pb-7 last:border-0">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-display text-base font-bold text-[#292528]">{group.title}</h3><p className="mt-1 max-w-3xl text-sm leading-6 text-[#6F676C]">{group.instructions || "Chưa có hướng dẫn."}</p>{group.wordLimitRule && <p className="mt-1 text-xs font-bold text-[#AD4C64]">{group.wordLimitRule}</p>}</div><span className="rounded-lg bg-[#F2ECEE] px-2.5 py-1 text-[10px] font-bold text-[#6F676C]">{readingQuestionTypeLabels[group.typeFormat]}</span></div>
    {group.sharedOptions?.length ? <div className="mt-4 grid gap-2 rounded-xl bg-[#F2ECEE] p-4 sm:grid-cols-2">{group.sharedOptions.map((option) => <p key={option.id} className="text-sm"><strong className="text-[#AD4C64]">{option.code}.</strong> {option.text}</p>)}</div> : null}
    {group.illustration && <figure className="mt-4"><AuthenticatedMediaImage fileUrl={group.illustration.fileUrl} alt={group.illustration.altText} className="mx-auto max-h-[520px] max-w-full rounded-xl object-contain" />{group.illustration.altText && <figcaption className="mt-2 text-center text-xs text-[#6F676C]">{group.illustration.altText}</figcaption>}</figure>}
    {hasGapTemplate ? <GapTemplate group={group} responses={responses} review={review} showAnswers={showAnswers} showExplanations={showExplanations} onAnswer={onAnswer} /> : <div className="mt-4 space-y-4">{group.questions.map((question) => <article key={question.id} id={`preview-question-${question.id}`} className="rounded-2xl bg-[#F7F5F4] p-4"><div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#AD4C64] text-xs font-bold text-white">{question.number}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold leading-6 text-[#292528]">{question.prompt || "Câu hỏi chưa có nội dung."}</p><QuestionInput question={question} group={group} response={responses[question.id] ?? []} disabled={review} onChange={(value) => onAnswer(question.id, value)} />{review && <ReviewFeedback question={question} group={group} response={responses[question.id] ?? []} showAnswer={showAnswers} showExplanation={showExplanations} />}</div></div></article>)}</div>}
  </section>;
}

function QuestionNavigator({ questions, responses, activeId, onSelect }: { questions: QuestionCardItem[]; responses: ResponseMap; activeId?: string; onSelect: (question: QuestionCardItem) => void }) {
  return <nav aria-label="Điều hướng câu hỏi" className="border-t border-[#DED7DA] bg-white p-3 lg:border-l lg:border-t-0"><p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#6F676C]"><ListNumbers size={15} /> Câu hỏi</p><div className="flex flex-wrap gap-1.5 lg:grid lg:grid-cols-2">{questions.map((question) => <button key={question.id} type="button" onClick={() => onSelect(question)} aria-label={`Đi tới câu ${question.number}${responses[question.id]?.length ? ", đã trả lời" : ""}`} className={`grid size-9 place-items-center rounded-lg border text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-[#C85F78] ${activeId === question.id ? "border-[#AD4C64] bg-[#AD4C64] text-white" : responses[question.id]?.length ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-[#DED7DA] bg-white text-[#6F676C] hover:border-[#C85F78]"}`}>{question.number}</button>)}</div></nav>;
}

function AuthenticatedAudio({ fileUrl, filename }: { fileUrl?: string; filename?: string }) {
  const [objectUrl, setObjectUrl] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!fileUrl) return undefined;
    let active = true;
    let url = "";
    setObjectUrl("");
    setFailed(false);
    void apiBlob(fileUrl).then((blob) => { if (active) { url = URL.createObjectURL(blob); setObjectUrl(url); } }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [fileUrl]);
  if (!fileUrl) return <p className="rounded-xl border border-dashed border-[#DED7DA] p-4 text-sm text-[#6F676C]">Part này chưa có audio.</p>;
  if (failed) return <p role="alert" className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-[#B42335]"><WarningCircle size={18} /> Không thể tải audio từ hệ thống.</p>;
  if (!objectUrl) return <p className="flex items-center gap-2 rounded-xl bg-[#F2ECEE] p-4 text-sm text-[#6F676C]"><SpinnerGap size={18} className="animate-spin" /> Đang tải {filename || "audio"}...</p>;
  return <audio controls preload="metadata" src={objectUrl} className="w-full" aria-label={filename || "Audio bài thi"} />;
}

function ReadingPreview({ test, responses, review, showAnswers, showExplanations, onAnswer }: { test: TestBankItem; responses: ResponseMap; review: boolean; showAnswers: boolean; showExplanations: boolean; onAnswer: (id: string, value: string[]) => void }) {
  const passages = useMemo(() => readPassages(test.builderContent ?? {}), [test.builderContent]);
  const [activeId, setActiveId] = useState(passages[0]?.id ?? "");
  const [activeQuestionId, setActiveQuestionId] = useState<string>();
  const passage = passages.find((item) => item.id === activeId) ?? passages[0];
  if (!passage) return <EmptyPreview skill="Reading" />;
  const questions = passage.questionGroups.flatMap((group) => group.questions);
  function selectQuestion(question: QuestionCardItem) { setActiveQuestionId(question.id); scrollToQuestion(question.id); }
  return <div className="flex min-h-0 flex-1 flex-col"><nav aria-label="Passage" className="flex shrink-0 gap-1 overflow-x-auto border-b border-[#DED7DA] bg-[#F2ECEE] px-3 pt-2">{passages.map((item) => <button key={item.id} type="button" onClick={() => setActiveId(item.id)} aria-current={item.id === passage.id ? "page" : undefined} className={`min-h-10 shrink-0 rounded-t-xl px-4 text-xs font-bold ${item.id === passage.id ? "bg-white text-[#AD4C64]" : "text-[#6F676C]"}`}>Passage {item.passageNo}</button>)}</nav><div className="min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_88px] lg:overflow-hidden"><section className="p-5 lg:overflow-y-auto lg:border-r lg:border-[#DED7DA]"><p className="text-xs font-bold uppercase tracking-wide text-[#AD4C64]">Reading Passage {passage.passageNo}</p><h2 className="mt-1 font-display text-xl font-bold text-[#292528]">{passage.title}</h2>{passage.content ? <div className="prose mt-5 max-w-none text-[15px] leading-7 text-[#292528]" dangerouslySetInnerHTML={{ __html: passage.content }} /> : <p className="mt-5 rounded-xl border border-dashed border-[#DED7DA] p-4 text-sm text-[#6F676C]">Passage chưa có nội dung.</p>}</section><section className="space-y-7 p-5 lg:overflow-y-auto">{passage.questionGroups.length ? passage.questionGroups.map((group) => <QuestionGroup key={group.id} group={group} responses={responses} review={review} showAnswers={showAnswers} showExplanations={showExplanations} onAnswer={onAnswer} />) : <p className="rounded-xl border border-dashed border-[#DED7DA] p-4 text-sm text-[#6F676C]">Passage chưa có câu hỏi.</p>}</section><QuestionNavigator questions={questions} responses={responses} activeId={activeQuestionId} onSelect={selectQuestion} /></div></div>;
}

function ListeningPreview({ test, responses, review, showAnswers, showExplanations, onAnswer }: { test: TestBankItem; responses: ResponseMap; review: boolean; showAnswers: boolean; showExplanations: boolean; onAnswer: (id: string, value: string[]) => void }) {
  const parts = useMemo(() => readListeningParts(test.builderContent ?? {}), [test.builderContent]);
  const [activeNo, setActiveNo] = useState(parts[0]?.partNo ?? 1);
  const [activeQuestionId, setActiveQuestionId] = useState<string>();
  const part = parts.find((item) => item.partNo === activeNo) ?? parts[0];
  if (!part) return <EmptyPreview skill="Listening" />;
  const questions = part.questionGroups.flatMap((group) => group.questions);
  function selectQuestion(question: QuestionCardItem) { setActiveQuestionId(question.id); scrollToQuestion(question.id); }
  return <div className="flex min-h-0 flex-1 flex-col"><nav aria-label="Part" className="flex shrink-0 gap-1 overflow-x-auto border-b border-[#DED7DA] bg-[#F2ECEE] px-3 pt-2">{parts.map((item) => <button key={item.id} type="button" onClick={() => setActiveNo(item.partNo)} aria-current={item.partNo === part.partNo ? "page" : undefined} className={`min-h-10 shrink-0 rounded-t-xl px-4 text-xs font-bold ${item.partNo === part.partNo ? "bg-white text-[#AD4C64]" : "text-[#6F676C]"}`}>Part {item.partNo}</button>)}</nav><div className="min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)_88px] lg:overflow-hidden"><aside className="space-y-4 p-5 lg:overflow-y-auto lg:border-r lg:border-[#DED7DA]"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#F7E5EA] text-[#AD4C64]"><Headphones size={21} /></span><div><p className="text-xs font-bold uppercase tracking-wide text-[#AD4C64]">Listening Part {part.partNo}</p><h2 className="font-display text-lg font-bold text-[#292528]">{part.title}</h2></div></div><AuthenticatedAudio fileUrl={part.audioUrl} filename={part.audioFilename} />{review && part.transcriptHtml && <details className="rounded-xl border border-[#DED7DA] bg-[#F7F5F4] p-4"><summary className="cursor-pointer text-sm font-bold text-[#AD4C64]">Transcript và lời giải</summary><div className="prose mt-4 max-w-none text-sm leading-6" dangerouslySetInnerHTML={{ __html: part.transcriptHtml }} /></details>}<p className="text-xs leading-5 text-[#6F676C]">Trong chế độ làm bài, transcript được ẩn đúng như giao diện thi thật.</p></aside><section className="space-y-7 p-5 lg:overflow-y-auto">{part.questionGroups.length ? part.questionGroups.map((group) => <QuestionGroup key={group.id} group={group} responses={responses} review={review} showAnswers={showAnswers} showExplanations={showExplanations} onAnswer={onAnswer} />) : <p className="rounded-xl border border-dashed border-[#DED7DA] p-4 text-sm text-[#6F676C]">Part chưa có câu hỏi.</p>}</section><QuestionNavigator questions={questions} responses={responses} activeId={activeQuestionId} onSelect={selectQuestion} /></div></div>;
}

function writingSectionLabels(task: WritingTaskSection) {
  if (task.responseMode === "FREEFORM") return ["Bài viết"];
  return task.taskNo === 1
    ? ["Introduction", "Overview", "Body 1", "Body 2"]
    : ["Introduction", "Body 1", "Body 2", "Conclusion"];
}

function WritingPreview({ test, responses, review, showAnswers, onChange }: {
  test: TestBankItem;
  responses: WritingResponseMap;
  review: boolean;
  showAnswers: boolean;
  onChange: (taskId: string, section: string, value: string) => void;
}) {
  const tasks = useMemo(() => readWritingTasks(test.builderContent ?? {}), [test.builderContent]);
  const [activeId, setActiveId] = useState(tasks[0]?.id ?? "");
  const task = tasks.find((item) => item.id === activeId) ?? tasks[0];
  if (!task) return <EmptyPreview skill="Writing" />;
  const sections = writingSectionLabels(task);
  const taskResponses = responses[task.id] ?? {};
  const wordCount = Object.values(taskResponses).join(" ").trim().split(/\s+/).filter(Boolean).length;
  return <div className="flex min-h-0 flex-1 flex-col">
    {tasks.length > 1 && <nav aria-label="Writing Task" className="flex shrink-0 gap-1 border-b border-[#DED7DA] bg-[#F2ECEE] px-3 pt-2">{tasks.map((item) => <button key={item.id} type="button" onClick={() => setActiveId(item.id)} aria-current={item.id === task.id ? "page" : undefined} className={`min-h-10 rounded-t-xl px-4 text-xs font-bold ${item.id === task.id ? "bg-white text-[#AD4C64]" : "text-[#6F676C]"}`}>Task {item.taskNo}</button>)}</nav>}
    <div className="min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)] lg:overflow-hidden">
      <section className="space-y-5 p-5 lg:overflow-y-auto lg:border-r lg:border-[#DED7DA]">
        <div><p className="text-xs font-bold uppercase tracking-wide text-[#AD4C64]">Writing Task {task.taskNo}</p><h2 className="mt-1 font-display text-xl font-bold text-[#292528]">{task.title}</h2><p className="mt-1 text-xs text-[#6F676C]">Tối thiểu {task.minWords} từ • Gợi ý {task.suggestedTimeMinutes} phút</p></div>
        {task.imageUrl && <AuthenticatedMediaImage fileUrl={task.imageUrl} alt={task.imageAltText || "Ảnh minh họa đề Writing"} className="max-h-[520px] w-full rounded-xl bg-[#F7F5F4] object-contain p-2" />}
        {task.promptHtml ? <div className="prose max-w-none text-sm leading-7 text-[#292528]" dangerouslySetInnerHTML={{ __html: task.promptHtml }} /> : <p className="rounded-xl border border-dashed border-[#DED7DA] p-4 text-sm text-[#6F676C]">Task chưa có đề bài.</p>}
      </section>
      <section className="flex min-h-0 flex-col bg-[#F7F5F4] lg:overflow-y-auto">
        <div className="sticky top-0 z-10 flex min-h-12 items-center justify-between border-b border-[#DED7DA] bg-white px-5"><p className="text-sm font-bold">Bài làm của học viên</p><p className={`text-xs font-bold tabular-nums ${wordCount >= task.minWords ? "text-[#247052]" : "text-[#6F676C]"}`}>{wordCount}/{task.minWords} từ</p></div>
        <div className="space-y-4 p-5">{sections.map((section) => <label key={section} className="block"><span className="mb-1.5 block text-sm font-bold text-[#292528]">{section}</span><textarea value={taskResponses[section] ?? ""} disabled={review} onChange={(event) => onChange(task.id, section, event.target.value)} rows={task.responseMode === "FREEFORM" ? 18 : 5} placeholder="Nhập phần viết của bạn ở đây" spellCheck lang="en" className="w-full resize-y rounded-xl border border-[#DED7DA] bg-white p-4 text-[15px] leading-7 text-[#292528] focus:border-[#C85F78] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA] disabled:bg-white" /></label>)}
          {review && <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${wordCount >= task.minWords ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-[#B42335]"}`}>{wordCount >= task.minWords ? "Bài viết đã đạt số từ tối thiểu." : `Bài viết còn thiếu ${Math.max(0, task.minWords - wordCount)} từ.`}</div>}
          {review && showAnswers && task.sampleBand8Answer && <details className="rounded-xl border border-[#DED7DA] bg-white p-4"><summary className="cursor-pointer text-sm font-bold text-[#AD4C64]">Xem bài mẫu tham khảo</summary><div className="prose mt-4 max-w-none text-sm leading-7" dangerouslySetInnerHTML={{ __html: task.sampleBand8Answer }} /></details>}
        </div>
      </section>
    </div>
  </div>;
}

function SpeakingRecorder({ maxSeconds }: { maxSeconds: number }) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState("");
  const [error, setError] = useState("");

  function releaseStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setRecording(false);
  }

  async function startRecording() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Trình duyệt này không hỗ trợ ghi âm.");
      return;
    }
    try {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(""); setSeconds(0);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        releaseStream();
      };
      recorder.start(); setRecording(true);
      timerRef.current = window.setInterval(() => setSeconds((current) => {
        const next = current + 1;
        if (next >= maxSeconds) window.setTimeout(stopRecording, 0);
        return next;
      }), 1000);
    } catch (reason) {
      releaseStream();
      setError(reason instanceof Error ? reason.message : "Không thể truy cập microphone.");
    }
  }

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    releaseStream();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  return <div className="text-center"><button type="button" onClick={recording ? stopRecording : () => void startRecording()} className={`inline-flex min-h-12 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white transition focus:outline-none focus:ring-2 focus:ring-[#C85F78] focus:ring-offset-2 ${recording ? "bg-[#B42335]" : "bg-[#AD4C64] hover:bg-[#943B52]"}`}>{recording ? <Stop size={19} weight="fill" /> : <Microphone size={19} />}{recording ? `Dừng ghi âm ${formatDuration(seconds)}` : "Bắt đầu ghi âm"}</button>{audioUrl && <div className="mt-3 flex flex-wrap items-center justify-center gap-2"><audio controls src={audioUrl} className="h-10 max-w-full" /><button type="button" onClick={() => { URL.revokeObjectURL(audioUrl); setAudioUrl(""); setSeconds(0); }} className="inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-xs font-bold text-[#AD4C64]"><ArrowCounterClockwise size={15} /> Ghi lại</button></div>}{error && <p role="alert" className="mt-2 text-xs font-semibold text-[#B42335]">{error}</p>}</div>;
}

function HintWorkflow({ steps }: { steps: SpeakingHintStep[] }) {
  const [activeStep, setActiveStep] = useState(0);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const available = steps.filter((step) => step.instruction.trim() || step.options.some((option) => option.label.trim() || option.phrase.trim()));
  if (!available.length) return <div className="rounded-2xl bg-[#F2ECEE] p-5 text-sm leading-6 text-[#6F676C]"><Lightbulb size={22} className="mb-2 text-[#AD4C64]" />Giáo viên đã bật gợi ý nhưng chưa nhập nội dung.</div>;
  const step = available[Math.min(activeStep, available.length - 1)];
  const complete = activeStep >= available.length;
  return <div className="space-y-4"><div className="flex items-center gap-3"><strong className="text-xs tabular-nums">{Math.min(activeStep, available.length)}/{available.length} bước</strong><div className="grid flex-1 grid-flow-col gap-2">{available.map((item, index) => <span key={item.id} className={`h-1.5 rounded-full ${index < activeStep ? "bg-[#247052]" : index === activeStep && !complete ? "bg-[#C85F78]" : "bg-[#DED7DA]"}`} />)}</div>{activeStep > 0 && <button type="button" onClick={() => { setActiveStep(0); setChoices({}); }} className="inline-flex min-h-10 items-center gap-1 rounded-xl px-2 text-xs font-bold text-[#6F676C]"><ArrowCounterClockwise size={14} /> Chọn lại</button>}</div>{!complete ? <section className="rounded-2xl border border-[#C85F78] p-4"><h3 className="font-display text-base font-bold text-[#AD4C64]">{step.title}</h3>{step.instruction && <p className="mt-2 text-sm leading-6">{step.instruction}</p>}<p className="mt-3 text-xs text-[#6F676C]">Chọn ý của bạn:</p><div className="mt-2 space-y-2">{step.options.map((option, index) => <button key={option.id} type="button" onClick={() => { setChoices((current) => ({ ...current, [step.id]: option.phrase || option.label })); setActiveStep((current) => current + 1); }} className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-[#DED7DA] px-3 text-left transition hover:border-[#C85F78] hover:bg-[#F7E5EA] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA]"><strong className="text-sm text-[#AD4C64]">{String.fromCharCode(65 + index)}.</strong><span className="min-w-0"><span className="block text-sm font-semibold">{option.label || "Chưa nhập ý gợi ý"}</span>{option.phrase && <span className="mt-0.5 block text-xs text-[#AD4C64]">{option.phrase}</span>}</span></button>)}{step.options.length === 0 && <button type="button" onClick={() => setActiveStep((current) => current + 1)} className="min-h-11 rounded-xl bg-[#AD4C64] px-4 text-xs font-bold text-white">Tiếp tục</button>}</div></section> : <><div className="space-y-3">{available.map((item) => choices[item.id] ? <p key={item.id} className="grid grid-cols-[88px_1fr] gap-3 text-sm leading-6"><span className="rounded-lg bg-[#F7E5EA] px-2 py-1 text-center text-xs font-bold text-[#AD4C64]">{item.title}</span><span>{choices[item.id]}</span></p> : null)}</div><div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-center text-sm font-bold text-emerald-800"><CheckCircle size={20} className="mx-auto mb-2" />Câu trả lời gợi ý đã hoàn chỉnh</div></>}</div>;
}

function SpeakingPreview({ test }: { test: TestBankItem }) {
  const parts = useMemo(() => readSpeakingParts(test.builderContent ?? {}), [test.builderContent]);
  const [activePartId, setActivePartId] = useState(parts[0]?.id ?? "");
  const activePart = parts.find((part) => part.id === activePartId) ?? parts[0];
  const questions = useMemo<SpeakingQuestionItem[]>(() => {
    if (!activePart) return [];
    if (activePart.partNo === 2) return [{
      id: `${activePart.id}-cue-card`,
      promptText: activePart.cueCardPromptHtml,
      hintsEnabled: activePart.hintsEnabled !== false,
      hintSteps: activePart.hintSteps ?? [],
      sampleResponseText: activePart.sampleResponseText,
    }];
    return activePart.questions ?? [];
  }, [activePart]);
  const [activeQuestionId, setActiveQuestionId] = useState(questions[0]?.id ?? "");
  const question = questions.find((item) => item.id === activeQuestionId) ?? questions[0];
  useEffect(() => { setActiveQuestionId(questions[0]?.id ?? ""); }, [activePartId, questions]);
  if (!activePart || !question) return <EmptyPreview skill="Speaking" />;
  function speakPrompt() {
    if (!("speechSynthesis" in window) || !question.promptText.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question.promptText);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }
  return <div className="flex min-h-0 flex-1 flex-col bg-[#F7F5F4]">
    <nav aria-label="Speaking parts" className="flex shrink-0 gap-1 overflow-x-auto border-b border-[#DED7DA] bg-white px-4 pt-2">{parts.map((part) => <button key={part.id} type="button" onClick={() => setActivePartId(part.id)} className={`min-h-10 rounded-t-xl px-4 text-xs font-bold ${part.id === activePart.id ? "bg-[#F2ECEE] text-[#AD4C64]" : "text-[#6F676C]"}`}>Part {part.partNo}</button>)}</nav>
    <div className={`grid min-h-0 flex-1 ${question.hintsEnabled ? "lg:grid-cols-[minmax(0,1fr)_430px]" : "grid-cols-1"}`}><section className="flex min-h-[520px] min-w-0 flex-col items-center justify-center gap-8 overflow-y-auto bg-white p-6 text-center lg:p-10"><div className="w-full max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#AD4C64]">{activePart.topicTitle || `Speaking Part ${activePart.partNo}`}</p>{activePart.partNo === 2 ? <article className="mx-auto mt-5 max-w-2xl rounded-[22px] border border-[#DED7DA] bg-[#F7F5F4] p-6 text-left"><p className="text-xs font-bold text-[#AD4C64]">You have {Math.max(0, activePart.preparationTimeSeconds)} seconds to prepare</p><div className="mt-4 flex items-start gap-3"><button type="button" onClick={speakPrompt} aria-label="Nghe cue card" className="grid size-11 shrink-0 place-items-center rounded-full border border-[#DED7DA] bg-white text-[#AD4C64] focus:outline-none focus:ring-2 focus:ring-[#C85F78]"><SpeakerHigh size={21} /></button><h2 className="font-display text-xl font-bold leading-8 text-[#292528]">{question.promptText}</h2></div>{activePart.cueCardBullets?.length ? <div className="mt-5"><p className="text-sm font-bold">You should say:</p><ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-[#292528]">{activePart.cueCardBullets.map((bullet, index) => <li key={`${activePart.id}-preview-bullet-${index}`}>{bullet || "Chưa nhập nội dung"}</li>)}</ul></div> : null}</article> : <div className="mt-5 flex items-center justify-center gap-3"><button type="button" onClick={speakPrompt} aria-label="Nghe câu hỏi" className="grid size-11 shrink-0 place-items-center rounded-full border border-[#DED7DA] text-[#AD4C64] focus:outline-none focus:ring-2 focus:ring-[#C85F78]"><SpeakerHigh size={21} /></button><h2 className="font-display text-2xl font-bold leading-snug text-[#292528]">{question.promptText}</h2></div>}</div><SpeakingRecorder maxSeconds={Math.max(10, activePart.answerTimeSeconds)} />{questions.length > 1 && <div className="flex max-w-2xl flex-wrap justify-center gap-2">{questions.map((item, index) => <button key={item.id} type="button" onClick={() => setActiveQuestionId(item.id)} aria-label={`Mở câu ${index + 1}`} className={`grid size-10 place-items-center rounded-xl border text-xs font-bold ${item.id === question.id ? "border-[#C85F78] bg-[#F7E5EA] text-[#AD4C64]" : "border-[#DED7DA]"}`}>{index + 1}</button>)}</div>}</section>{question.hintsEnabled && <aside className="min-h-0 overflow-y-auto border-l border-[#DED7DA] bg-white p-5 lg:p-6"><div className="mb-5 flex items-center gap-2"><Lightbulb size={20} className="text-[#AD4C64]" /><h2 className="font-display text-lg font-bold">Gợi ý từng bước</h2></div><HintWorkflow key={question.id} steps={question.hintSteps} />{question.sampleResponseText && <details className="mt-5 rounded-xl border border-[#DED7DA] p-4"><summary className="cursor-pointer text-sm font-bold text-[#AD4C64]">Bài nói mẫu</summary><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#292528]">{question.sampleResponseText}</p></details>}</aside>}</div>
  </div>;
}

function EmptyPreview({ skill }: { skill: string }) {
  return <div className="grid flex-1 place-items-center p-8 text-center"><div><WarningCircle size={30} className="mx-auto text-[#AD4C64]" /><h2 className="mt-3 font-display text-lg font-bold">Chưa thể xem trước {skill}</h2><p className="mt-1 text-sm text-[#6F676C]">Draft chưa có nội dung hoặc câu hỏi hợp lệ.</p></div></div>;
}

function GenericPreview({ test }: { test: TestBankItem }) {
  const content = test.builderContent ?? {};
  const prompt = typeof content.promptText === "string" ? content.promptText : typeof content.transcriptText === "string" ? content.transcriptText : "";
  return <div className="flex-1 overflow-y-auto p-6"><h2 className="font-display text-xl font-bold">{test.title}</h2>{prompt ? <p className="mt-5 whitespace-pre-wrap text-sm leading-7">{prompt}</p> : <EmptyPreview skill={test.skill} />}</div>;
}

export default function TestPreviewModal({ test, onClose }: Props) {
  const [device, setDevice] = useState<Device>("DESKTOP");
  const [mode, setMode] = useState<PreviewMode>("TAKE");
  const [showAnswers, setShowAnswers] = useState(true);
  const [showExplanations, setShowExplanations] = useState(true);
  const [responses, setResponses] = useState<ResponseMap>({});
  const [writingResponses, setWritingResponses] = useState<WritingResponseMap>({});
  const [remainingSeconds, setRemainingSeconds] = useState(Math.max(0, test.durationMinutes * 60));
  const allQuestions = useMemo(() => test.skill === "READING"
    ? readPassages(test.builderContent ?? {}).flatMap((passage) => passage.questionGroups).flatMap((group) => group.questions)
    : test.skill === "LISTENING"
      ? readListeningParts(test.builderContent ?? {}).flatMap((part) => part.questionGroups).flatMap((group) => group.questions)
      : [], [test]);
  const answeredCount = allQuestions.filter((question) => responses[question.id]?.some((answer) => answer.trim())).length;
  const writingTasks = useMemo(() => test.skill === "WRITING" ? readWritingTasks(test.builderContent ?? {}) : [], [test]);
  const answeredWritingTasks = writingTasks.filter((task) => Object.values(writingResponses[task.id] ?? {}).some((answer) => answer.trim())).length;
  const speakingQuestionCount = useMemo(() => test.skill === "SPEAKING" ? readSpeakingParts(test.builderContent ?? {}).reduce((sum, part) => sum + (part.partNo === 2 ? (part.cueCardPromptHtml.trim() ? 1 : 0) : part.questions?.length ?? 0), 0) : 0, [test]);
  const previewItemCount = test.skill === "WRITING" ? writingTasks.length : test.skill === "SPEAKING" ? speakingQuestionCount : allQuestions.length;
  const previewAnsweredCount = test.skill === "WRITING" ? answeredWritingTasks : answeredCount;
  const review = mode === "REVIEW";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) { if (event.key === "Escape") onClose(); }
    window.addEventListener("keydown", handleKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", handleKeyDown); };
  }, [onClose]);

  useEffect(() => {
    if (mode !== "TAKE" || remainingSeconds <= 0) return undefined;
    const timer = window.setInterval(() => setRemainingSeconds((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [mode, remainingSeconds]);

  useEffect(() => { if (remainingSeconds === 0 && mode === "TAKE") setMode("REVIEW"); }, [mode, remainingSeconds]);

  function updateAnswer(questionId: string, value: string[]) {
    setResponses((current) => ({ ...current, [questionId]: value }));
  }

  function updateWritingAnswer(taskId: string, section: string, value: string) {
    setWritingResponses((current) => ({ ...current, [taskId]: { ...(current[taskId] ?? {}), [section]: value } }));
  }

  return <div className="fixed inset-0 z-50 flex min-h-0 flex-col bg-[#181518]/90 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="preview-title">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl sm:px-5"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-[#AD4C64]">Bản xem trước học viên</p><div className="flex flex-wrap items-center gap-2"><h1 id="preview-title" className="truncate font-display text-sm font-bold text-[#292528]">{test.title}</h1><span className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800">{test.skill} · {previewItemCount} {test.skill === "WRITING" ? "task" : "câu"}</span></div><p className="mt-0.5 text-[10px] text-[#6F676C]">Dữ liệu từ draft hiện tại · không tạo lượt làm bài</p></div><div className="flex flex-wrap items-center gap-2"><div className="hidden rounded-xl bg-[#F2ECEE] p-1 sm:flex">{([{ value: "DESKTOP", icon: Desktop, label: "Desktop" }, { value: "TABLET", icon: DeviceTablet, label: "Tablet" }, { value: "MOBILE", icon: DeviceMobile, label: "Mobile" }] as const).map(({ value, icon: Icon, label }) => <button key={value} type="button" onClick={() => setDevice(value)} aria-label={label} aria-pressed={device === value} className={`grid size-9 place-items-center rounded-lg transition focus:outline-none focus:ring-2 focus:ring-[#C85F78] ${device === value ? "bg-white text-[#AD4C64] shadow-sm" : "text-[#6F676C]"}`}><Icon size={18} /></button>)}</div><div className="flex rounded-xl border border-[#DED7DA] bg-white p-1"><button type="button" onClick={() => setMode("TAKE")} aria-pressed={!review} className={`min-h-9 rounded-lg px-3 text-xs font-bold ${!review ? "bg-[#AD4C64] text-white" : "text-[#6F676C]"}`}>Làm bài</button><button type="button" onClick={() => setMode("REVIEW")} aria-pressed={review} className={`min-h-9 rounded-lg px-3 text-xs font-bold ${review ? "bg-[#AD4C64] text-white" : "text-[#6F676C]"}`}>Xem lại</button></div>{review && <div className="hidden items-center gap-3 border-l border-[#DED7DA] pl-3 md:flex"><label className="flex items-center gap-1.5 text-xs font-semibold text-[#6F676C]"><input type="checkbox" checked={showAnswers} onChange={(event) => setShowAnswers(event.target.checked)} className="accent-[#C85F78]" />{showAnswers ? <Eye size={15} /> : <EyeSlash size={15} />} {test.skill === "WRITING" ? "Bài mẫu" : "Đáp án"}</label>{test.skill !== "WRITING" && <label className="flex items-center gap-1.5 text-xs font-semibold text-[#6F676C]"><input type="checkbox" checked={showExplanations} onChange={(event) => setShowExplanations(event.target.checked)} className="accent-[#C85F78]" />Giải thích</label>}</div>}<button type="button" onClick={onClose} aria-label="Đóng xem trước" className="grid size-10 place-items-center rounded-xl bg-[#F2ECEE] text-[#292528] transition hover:bg-rose-50 hover:text-[#B42335] focus:outline-none focus:ring-2 focus:ring-[#C85F78]"><X size={20} /></button></div></header>
    <main className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-2 sm:p-4"><div className={`flex min-h-0 flex-col overflow-hidden bg-white shadow-2xl transition-[width,height] duration-200 ${device === "DESKTOP" ? "preview-desktop rounded-[20px]" : device === "TABLET" ? "preview-tablet" : "preview-mobile"}`}><div className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-[#DED7DA] bg-white px-4"><div className="min-w-0"><p className="truncate font-display text-sm font-bold text-[#AD4C64]">{test.title}</p><p className="text-[10px] text-[#6F676C]">{test.skill === "SPEAKING" ? `${previewItemCount} câu luyện nói` : `${previewAnsweredCount}/${previewItemCount} ${test.skill === "WRITING" ? "task đã làm" : "câu đã trả lời"}`}</p></div><div className="flex items-center gap-3"><span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold tabular-nums ${remainingSeconds <= 300 ? "bg-rose-50 text-[#B42335]" : "bg-[#F2ECEE] text-[#292528]"}`}><Timer size={15} /> {formatDuration(remainingSeconds)}</span>{!review && test.skill !== "SPEAKING" && <button type="button" onClick={() => setMode("REVIEW")} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#AD4C64] px-3 text-xs font-bold text-white transition hover:bg-[#943b52] focus:outline-none focus:ring-2 focus:ring-[#C85F78]"><span className="hidden sm:inline">Nộp bài xem trước</span><ArrowRight size={16} /></button>}</div></div>{test.skill === "READING" ? <ReadingPreview test={test} responses={responses} review={review} showAnswers={showAnswers} showExplanations={showExplanations} onAnswer={updateAnswer} /> : test.skill === "LISTENING" ? <ListeningPreview test={test} responses={responses} review={review} showAnswers={showAnswers} showExplanations={showExplanations} onAnswer={updateAnswer} /> : test.skill === "WRITING" ? <WritingPreview test={test} responses={writingResponses} review={review} showAnswers={showAnswers} onChange={updateWritingAnswer} /> : test.skill === "SPEAKING" ? <SpeakingPreview test={test} /> : <GenericPreview test={test} />}</div></main>
  </div>;
}
