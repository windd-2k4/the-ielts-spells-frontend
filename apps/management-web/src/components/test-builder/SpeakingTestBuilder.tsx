import {
  ArrowDown, ArrowLeft, ArrowUp, CheckCircle, Copy, Eye, FloppyDisk,
  Lightbulb, Microphone, Plus, ShieldCheck, SpinnerGap, Trash, WarningCircle,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import type {
  IELTSSpeakingRubric, SpeakingHintOption, SpeakingHintStep,
  SpeakingPartSection, SpeakingQuestionItem, TestBankItem,
} from "../../library-types";
import { apiFetch } from "../../lib/api";
import PublishValidationModal from "./PublishValidationModal";
import TestPreviewModal from "./TestPreviewModal";

const DEFAULT_RUBRIC: IELTSSpeakingRubric = {
  fluencyCoherenceWeight: 25,
  lexicalResourceWeight: 25,
  grammaticalAccuracyWeight: 25,
  pronunciationWeight: 25,
};

const HINT_TITLES = ["Trả lời", "Lý do", "Ví dụ", "Kết luận"];

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptyHintStep(title: string): SpeakingHintStep {
  return { id: newId("speaking-hint"), title, instruction: "", options: [] };
}

function emptyQuestion(): SpeakingQuestionItem {
  return {
    id: newId("speaking-question"),
    promptText: "",
    hintsEnabled: true,
    hintSteps: HINT_TITLES.map(emptyHintStep),
    sampleResponseText: "",
    teacherNotes: "",
  };
}

function emptyPart(partNo: 1 | 2 | 3): SpeakingPartSection {
  return {
    id: newId("speaking-part"),
    partNo,
    topicTitle: "",
    cueCardPromptHtml: "",
    cueCardBullets: [],
    hintsEnabled: true,
    hintSteps: partNo === 2 ? HINT_TITLES.map(emptyHintStep) : [],
    preparationTimeSeconds: partNo === 2 ? 60 : 0,
    answerTimeSeconds: partNo === 2 ? 120 : 30,
    followUpQuestions: [],
    questions: partNo === 1 || partNo === 3 ? [emptyQuestion()] : [],
    recordingConfig: { allowReRecord: true, maxAttempts: 3 },
    rubric: DEFAULT_RUBRIC,
    teacherNotes: "",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeOptions(value: unknown): SpeakingHintOption[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((item) => ({
    id: typeof item.id === "string" ? item.id : newId("speaking-option"),
    label: typeof item.label === "string" ? item.label : "",
    phrase: typeof item.phrase === "string" ? item.phrase : "",
  }));
}

function normalizeSteps(value: unknown): SpeakingHintStep[] {
  const saved = Array.isArray(value) ? value.filter(isRecord) : [];
  return HINT_TITLES.map((title, index) => {
    const item = saved[index];
    return {
      id: typeof item?.id === "string" ? item.id : newId("speaking-hint"),
      title: typeof item?.title === "string" ? item.title : title,
      instruction: typeof item?.instruction === "string" ? item.instruction : "",
      options: normalizeOptions(item?.options),
    };
  });
}

function normalizeQuestions(value: unknown, legacyPrompt = ""): SpeakingQuestionItem[] {
  if (!Array.isArray(value) || value.length === 0) {
    const question = emptyQuestion();
    return [{ ...question, promptText: legacyPrompt }];
  }
  return value.filter(isRecord).map((item) => ({
    id: typeof item.id === "string" ? item.id : newId("speaking-question"),
    promptText: typeof item.promptText === "string" ? item.promptText : "",
    hintsEnabled: item.hintsEnabled !== false,
    hintSteps: normalizeSteps(item.hintSteps),
    sampleResponseText: typeof item.sampleResponseText === "string" ? item.sampleResponseText : "",
    teacherNotes: typeof item.teacherNotes === "string" ? item.teacherNotes : "",
  }));
}

function normalizeParts(test: TestBankItem): SpeakingPartSection[] {
  const content = test.builderContent ?? {};
  if (Array.isArray(content.parts) && content.parts.length) {
    return content.parts.filter(isRecord).map((item, index) => {
      const partNo = item.partNo === 2 ? 2 : item.partNo === 3 ? 3 : (Math.min(index + 1, 3) as 1 | 2 | 3);
      const fallback = emptyPart(partNo);
      const recording = isRecord(item.recordingConfig) ? item.recordingConfig : {};
      return {
        ...fallback,
        id: typeof item.id === "string" ? item.id : fallback.id,
        topicTitle: typeof item.topicTitle === "string" ? item.topicTitle : "",
        cueCardPromptHtml: typeof item.cueCardPromptHtml === "string" ? item.cueCardPromptHtml : "",
        cueCardBullets: Array.isArray(item.cueCardBullets) ? item.cueCardBullets.map(String) : [],
        hintsEnabled: item.hintsEnabled !== false,
        hintSteps: partNo === 2 ? normalizeSteps(item.hintSteps) : [],
        preparationTimeSeconds: typeof item.preparationTimeSeconds === "number" ? item.preparationTimeSeconds : fallback.preparationTimeSeconds,
        answerTimeSeconds: typeof item.answerTimeSeconds === "number" ? item.answerTimeSeconds : fallback.answerTimeSeconds,
        followUpQuestions: Array.isArray(item.followUpQuestions) ? item.followUpQuestions.map(String) : [],
        questions: partNo === 1 || partNo === 3
          ? normalizeQuestions(item.questions, partNo === 3 && typeof item.cueCardPromptHtml === "string" ? item.cueCardPromptHtml : "")
          : [],
        sampleResponseText: typeof item.sampleResponseText === "string" ? item.sampleResponseText : "",
        recordingConfig: {
          allowReRecord: recording.allowReRecord !== false,
          maxAttempts: typeof recording.maxAttempts === "number" ? recording.maxAttempts : 3,
        },
        rubric: DEFAULT_RUBRIC,
        teacherNotes: typeof item.teacherNotes === "string" ? item.teacherNotes : "",
      };
    });
  }
  const preset = typeof content.sectionsPreset === "string" ? content.sectionsPreset : "PART_1";
  const numbers: Array<1 | 2 | 3> = preset === "FULL" ? [1, 2, 3] : [preset === "PART_2" ? 2 : preset === "PART_3" ? 3 : 1];
  return numbers.map((partNo) => {
    const part = emptyPart(partNo);
    return partNo === 1
      ? { ...part, questions: normalizeQuestions(undefined, typeof content.promptText === "string" ? content.promptText : "") }
      : part;
  });
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
  return <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-7 w-12 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-[#C85F78] focus:ring-offset-2 ${checked ? "bg-[#AD4C64]" : "bg-[#BDB3B8]"}`} aria-label={label}><span className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} /></button>;
}

function HintStepsEditor({ steps, onChange }: { steps: SpeakingHintStep[]; onChange: (steps: SpeakingHintStep[]) => void }) {
  function updateStep(next: SpeakingHintStep) {
    onChange(steps.map((step) => step.id === next.id ? next : step));
  }
  return <div className="space-y-4">{steps.map((step, stepIndex) => <section key={step.id} className="rounded-2xl border border-[#DED7DA] p-4"><div className="flex items-center gap-2"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#F7E5EA] text-xs font-bold text-[#AD4C64]">{stepIndex + 1}</span><input value={step.title} onChange={(event) => updateStep({ ...step, title: event.target.value })} aria-label={`Tên bước gợi ý ${stepIndex + 1}`} className="min-w-0 flex-1 border-b border-transparent text-sm font-bold focus:border-[#C85F78] focus:outline-none" /></div><textarea value={step.instruction} onChange={(event) => updateStep({ ...step, instruction: event.target.value })} rows={2} className="mt-3 w-full resize-y rounded-xl border border-[#DED7DA] p-3 text-xs leading-5 focus:border-[#C85F78] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA]" placeholder="Hướng dẫn học viên phát triển ý ở bước này..." /><div className="mt-3 space-y-2">{step.options.map((option, optionIndex) => <div key={option.id} className="grid grid-cols-[28px_minmax(0,1fr)_minmax(0,1fr)_36px] gap-2"><span className="pt-3 text-center text-xs font-bold text-[#AD4C64]">{String.fromCharCode(65 + optionIndex)}</span><input value={option.label} onChange={(event) => updateStep({ ...step, options: step.options.map((item) => item.id === option.id ? { ...item, label: event.target.value } : item) })} aria-label={`Ý gợi ý ${optionIndex + 1}`} className="min-h-10 rounded-xl border border-[#DED7DA] px-3 text-xs focus:border-[#C85F78] focus:outline-none" placeholder="Ý gợi ý tiếng Việt" /><input value={option.phrase} onChange={(event) => updateStep({ ...step, options: step.options.map((item) => item.id === option.id ? { ...item, phrase: event.target.value } : item) })} aria-label={`Cụm từ tiếng Anh ${optionIndex + 1}`} className="min-h-10 rounded-xl border border-[#DED7DA] px-3 text-xs focus:border-[#C85F78] focus:outline-none" placeholder="Cụm từ tiếng Anh" /><button type="button" onClick={() => updateStep({ ...step, options: step.options.filter((item) => item.id !== option.id) })} aria-label="Xóa lựa chọn" className="grid size-10 place-items-center rounded-xl text-[#B42335] transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-100"><Trash size={15} /></button></div>)}</div><button type="button" onClick={() => updateStep({ ...step, options: [...step.options, { id: newId("speaking-option"), label: "", phrase: "" }] })} className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-[#AD4C64] transition hover:bg-[#F7E5EA] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA]"><Plus size={15} /> Thêm lựa chọn</button></section>)}</div>;
}

function PartTwoBuilder({ part, onChange }: { part: SpeakingPartSection; onChange: (part: SpeakingPartSection) => void }) {
  const bullets = part.cueCardBullets ?? [];
  const steps = part.hintSteps?.length ? part.hintSteps : HINT_TITLES.map(emptyHintStep);
  return <main className="grid min-h-0 flex-1 overflow-y-auto xl:grid-cols-[minmax(0,1.15fr)_minmax(400px,0.85fr)] xl:overflow-hidden"><section className="space-y-6 p-5 lg:p-7 xl:overflow-y-auto xl:border-r xl:border-[#DED7DA]"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#AD4C64]">Speaking Part 2</p><h1 className="mt-1 font-display text-2xl font-bold tracking-tight">Cue card và long turn</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6F676C]">Soạn một chủ đề để học viên chuẩn bị trong thời gian giới hạn, sau đó nói liên tục theo các ý gợi mở.</p></div><section className="rounded-[22px] bg-white p-5 shadow-[0_18px_45px_rgba(105,76,87,0.08)]"><label className="block text-xs font-semibold text-[#6F676C]">Tên chủ đề<input value={part.topicTitle} onChange={(event) => onChange({ ...part, topicTitle: event.target.value })} className="mt-1.5 min-h-12 w-full rounded-xl border border-[#DED7DA] px-4 text-base font-bold focus:border-[#C85F78] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA]" placeholder="Ví dụ: Describe a memorable journey" /></label><label className="mt-4 block text-xs font-semibold text-[#6F676C]">Đề bài chính<textarea value={part.cueCardPromptHtml} onChange={(event) => onChange({ ...part, cueCardPromptHtml: event.target.value })} rows={4} lang="en" spellCheck className="mt-1.5 w-full resize-y rounded-xl border border-[#DED7DA] p-4 text-base leading-7 focus:border-[#C85F78] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA]" placeholder="Describe a person, place, object or experience..." /></label><div className="mt-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-bold">Các ý You should say</h2><p className="mt-1 text-xs text-[#6F676C]">Mỗi dòng là một bullet trên cue card của học viên.</p></div><button type="button" onClick={() => onChange({ ...part, cueCardBullets: [...bullets, ""] })} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#F7E5EA] px-3 text-xs font-bold text-[#AD4C64]"><Plus size={15} /> Thêm ý</button></div><div className="mt-3 space-y-2">{bullets.map((bullet, index) => <div key={`${part.id}-bullet-${index}`} className="grid grid-cols-[30px_minmax(0,1fr)_40px] gap-2"><span className="pt-3 text-center text-xs font-bold text-[#AD4C64]">{index + 1}</span><input value={bullet} onChange={(event) => onChange({ ...part, cueCardBullets: bullets.map((item, itemIndex) => itemIndex === index ? event.target.value : item) })} aria-label={`Ý cue card ${index + 1}`} className="min-h-11 rounded-xl border border-[#DED7DA] px-3 text-sm focus:border-[#C85F78] focus:outline-none" placeholder="Nhập một ý học viên cần trình bày..." /><button type="button" onClick={() => onChange({ ...part, cueCardBullets: bullets.filter((_, itemIndex) => itemIndex !== index) })} aria-label={`Xóa ý ${index + 1}`} className="grid size-10 place-items-center rounded-xl text-[#B42335] hover:bg-rose-50"><Trash size={16} /></button></div>)}</div></div></section><section className="grid gap-4 rounded-[22px] bg-white p-5 sm:grid-cols-3"><label className="text-xs font-semibold text-[#6F676C]">Chuẩn bị (giây)<input type="number" min={0} max={300} value={part.preparationTimeSeconds} onChange={(event) => onChange({ ...part, preparationTimeSeconds: Number(event.target.value) || 0 })} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#DED7DA] px-3 text-sm" /></label><label className="text-xs font-semibold text-[#6F676C]">Trả lời (giây)<input type="number" min={30} max={600} value={part.answerTimeSeconds} onChange={(event) => onChange({ ...part, answerTimeSeconds: Number(event.target.value) || 120 })} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#DED7DA] px-3 text-sm" /></label><label className="text-xs font-semibold text-[#6F676C]">Số lần ghi tối đa<input type="number" min={1} max={10} value={part.recordingConfig?.maxAttempts ?? 3} onChange={(event) => onChange({ ...part, recordingConfig: { allowReRecord: part.recordingConfig?.allowReRecord !== false, maxAttempts: Number(event.target.value) || 1 } })} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#DED7DA] px-3 text-sm" /></label></section><label className="block text-xs font-semibold text-[#6F676C]">Bài mẫu tham khảo<textarea value={part.sampleResponseText ?? ""} onChange={(event) => onChange({ ...part, sampleResponseText: event.target.value })} rows={7} lang="en" spellCheck className="mt-1.5 w-full resize-y rounded-2xl border border-[#DED7DA] bg-white p-4 text-sm leading-7 focus:border-[#C85F78] focus:outline-none" placeholder="Nhập bài nói mẫu, chỉ hiển thị trong chế độ xem lại..." /></label></section><aside className="space-y-5 bg-white p-5 lg:p-7 xl:overflow-y-auto"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#AD4C64]">Gợi ý Part 2</p><h2 className="mt-1 text-lg font-bold">Phát triển long turn</h2><p className="mt-1 text-xs leading-5 text-[#6F676C]">Bật hoặc tắt toàn bộ hướng dẫn cho cue card này.</p></div><Toggle checked={part.hintsEnabled !== false} label="Bật hoặc tắt gợi ý Part 2" onChange={(hintsEnabled) => onChange({ ...part, hintsEnabled })} /></div>{part.hintsEnabled !== false ? <HintStepsEditor steps={steps} onChange={(hintSteps) => onChange({ ...part, hintSteps })} /> : <div className="rounded-2xl bg-[#F2ECEE] p-5 text-sm leading-6 text-[#6F676C]"><Lightbulb size={22} className="mb-2 text-[#AD4C64]" />Học viên chỉ thấy cue card, thời gian chuẩn bị và nút ghi âm.</div>}</aside></main>;
}

function PartThreeBuilder({ part, activeQuestionId, onActiveQuestionId, onChange }: { part: SpeakingPartSection; activeQuestionId: string; onActiveQuestionId: (id: string) => void; onChange: (part: SpeakingPartSection) => void }) {
  const questions = part.questions ?? [];
  const question = questions.find((item) => item.id === activeQuestionId) ?? questions[0];
  function updateQuestion(next: SpeakingQuestionItem) { onChange({ ...part, questions: questions.map((item) => item.id === next.id ? next : item) }); }
  function addQuestion() { const next = emptyQuestion(); onChange({ ...part, questions: [...questions, next] }); onActiveQuestionId(next.id); }
  return <main className="grid min-h-0 flex-1 overflow-y-auto xl:grid-cols-[320px_minmax(0,1fr)_minmax(390px,0.9fr)] xl:overflow-hidden"><aside className="space-y-4 border-r border-[#DED7DA] bg-white p-5 xl:overflow-y-auto"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#AD4C64]">Speaking Part 3</p><label className="mt-3 block text-xs font-semibold text-[#6F676C]">Chủ đề thảo luận<input value={part.topicTitle} onChange={(event) => onChange({ ...part, topicTitle: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#DED7DA] px-3 text-sm focus:border-[#C85F78] focus:outline-none" placeholder="Ví dụ: Tourism and local culture" /></label></div><div className="flex items-center justify-between"><h2 className="text-sm font-bold">Câu hỏi thảo luận</h2><button type="button" onClick={addQuestion} aria-label="Thêm câu hỏi Part 3" className="grid size-10 place-items-center rounded-xl bg-[#F7E5EA] text-[#AD4C64]"><Plus size={18} /></button></div><div className="space-y-2">{questions.map((item, index) => <button key={item.id} type="button" onClick={() => onActiveQuestionId(item.id)} className={`w-full rounded-xl border p-3 text-left transition ${item.id === question?.id ? "border-[#C85F78] bg-[#F7E5EA]" : "border-[#DED7DA] hover:border-[#C85F78]/60"}`}><span className="text-[10px] font-bold text-[#AD4C64]">CÂU {index + 1}</span><span className="mt-1 block line-clamp-2 text-xs font-semibold">{item.promptText || "Chưa nhập câu hỏi"}</span><span className={`mt-2 inline-flex items-center gap-1 text-[10px] font-bold ${item.hintsEnabled ? "text-[#247052]" : "text-[#6F676C]"}`}><Lightbulb size={13} /> {item.hintsEnabled ? "Có gợi ý" : "Đã tắt gợi ý"}</span></button>)}</div></aside><section className="space-y-5 p-5 lg:p-7 xl:overflow-y-auto">{question ? <><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#AD4C64]">Câu hỏi đang chọn</p><textarea value={question.promptText} onChange={(event) => updateQuestion({ ...question, promptText: event.target.value })} rows={5} lang="en" spellCheck className="mt-2 w-full resize-y rounded-2xl border border-[#DED7DA] bg-white p-4 text-lg font-semibold leading-7 focus:border-[#C85F78] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA]" placeholder="Nhập câu hỏi thảo luận mở bằng tiếng Anh..." /></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { const copy = { ...question, id: newId("speaking-question"), hintSteps: question.hintSteps.map((step) => ({ ...step, id: newId("speaking-hint"), options: step.options.map((option) => ({ ...option, id: newId("speaking-option") })) })) }; onChange({ ...part, questions: [...questions, copy] }); onActiveQuestionId(copy.id); }} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#DED7DA] px-3 text-xs font-bold"><Copy size={16} /> Nhân bản</button><button type="button" disabled={questions.length === 1} onClick={() => { const next = questions.filter((item) => item.id !== question.id); onChange({ ...part, questions: next }); onActiveQuestionId(next[0]?.id ?? ""); }} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-[#B42335] disabled:opacity-40"><Trash size={16} /> Xóa</button>{[-1, 1].map((direction) => <button key={direction} type="button" onClick={() => { const index = questions.findIndex((item) => item.id === question.id); onChange({ ...part, questions: moveItem(questions, index, direction as -1 | 1) }); }} aria-label={direction === -1 ? "Đưa câu hỏi lên" : "Đưa câu hỏi xuống"} className="grid size-10 place-items-center rounded-xl border border-[#DED7DA]">{direction === -1 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}</button>)}</div><section className="rounded-[22px] bg-white p-5"><h2 className="text-base font-bold">Cấu hình trả lời</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-[#6F676C]">Thời gian tối đa mỗi câu (giây)<input type="number" min={20} max={300} value={part.answerTimeSeconds} onChange={(event) => onChange({ ...part, answerTimeSeconds: Number(event.target.value) || 60 })} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#DED7DA] px-3 text-sm" /></label><label className="text-xs font-semibold text-[#6F676C]">Số lần ghi tối đa<input type="number" min={1} max={10} value={part.recordingConfig?.maxAttempts ?? 3} onChange={(event) => onChange({ ...part, recordingConfig: { allowReRecord: part.recordingConfig?.allowReRecord !== false, maxAttempts: Number(event.target.value) || 1 } })} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#DED7DA] px-3 text-sm" /></label></div></section><label className="block text-xs font-semibold text-[#6F676C]">Bài mẫu cho câu này<textarea value={question.sampleResponseText ?? ""} onChange={(event) => updateQuestion({ ...question, sampleResponseText: event.target.value })} rows={6} lang="en" spellCheck className="mt-1.5 w-full resize-y rounded-xl border border-[#DED7DA] p-4 text-sm leading-7" placeholder="Nhập câu trả lời mẫu tham khảo..." /></label></> : <div className="rounded-2xl border border-dashed border-[#DED7DA] p-8 text-center"><p className="text-sm text-[#6F676C]">Chưa có câu hỏi thảo luận.</p><button type="button" onClick={addQuestion} className="mt-4 rounded-xl bg-[#AD4C64] px-4 py-3 text-xs font-bold text-white">Tạo câu hỏi đầu tiên</button></div>}</section><aside className="space-y-5 border-l border-[#DED7DA] bg-white p-5 lg:p-7 xl:overflow-y-auto">{question && <><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#AD4C64]">Gợi ý Part 3</p><h2 className="mt-1 text-lg font-bold">Phát triển thảo luận</h2><p className="mt-1 text-xs leading-5 text-[#6F676C]">Cấu hình riêng cho câu hỏi đang chọn.</p></div><Toggle checked={question.hintsEnabled} label="Bật hoặc tắt gợi ý câu Part 3" onChange={(hintsEnabled) => updateQuestion({ ...question, hintsEnabled })} /></div>{question.hintsEnabled ? <HintStepsEditor steps={question.hintSteps} onChange={(hintSteps) => updateQuestion({ ...question, hintSteps })} /> : <div className="rounded-2xl bg-[#F2ECEE] p-5 text-sm leading-6 text-[#6F676C]"><Lightbulb size={22} className="mb-2 text-[#AD4C64]" />Học viên chỉ thấy câu hỏi thảo luận và nút ghi âm.</div>}</>}</aside></main>;
}

export default function SpeakingTestBuilder() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const { roles } = useAuth();
  const [test, setTest] = useState<TestBankItem | null>(null);
  const [title, setTitle] = useState("");
  const [parts, setParts] = useState<SpeakingPartSection[]>([]);
  const [activePartId, setActivePartId] = useState("");
  const [activeQuestionId, setActiveQuestionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (!testId) { setError("Không tìm thấy mã đề Speaking."); setLoading(false); return; }
    let active = true;
    void apiFetch<TestBankItem>(`/admin/test-bank/${testId}`)
      .then((record) => {
        if (!active) return;
        const normalized = normalizeParts(record);
        setTest(record); setTitle(record.title); setParts(normalized);
        setActivePartId(normalized[0]?.id ?? "");
        setActiveQuestionId(normalized[0]?.questions?.[0]?.id ?? "");
      })
      .catch((reason: Error) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [testId]);

  const activePart = parts.find((part) => part.id === activePartId) ?? parts[0];
  const questions = activePart?.questions ?? [];
  const activeQuestion = questions.find((question) => question.id === activeQuestionId) ?? questions[0];
  const totalQuestions = parts.reduce((sum, part) => sum + (part.partNo === 2 ? (part.cueCardPromptHtml.trim() ? 1 : 0) : part.questions?.length ?? 0), 0);
  const durationMinutes = Math.max(1, Math.ceil(parts.reduce((sum, part) => sum + Math.max(0, part.preparationTimeSeconds) + Math.max(0, part.answerTimeSeconds) * Math.max(1, part.questions?.length ?? part.followUpQuestions.length), 0) / 60));
  const draftTest = useMemo<TestBankItem | null>(() => test ? ({
    ...test, title, sectionsCount: parts.length, totalQuestions, durationMinutes,
    builderContent: { ...(test.builderContent ?? {}), format: parts.length === 3 ? "FULL" : `PART_${parts[0]?.partNo ?? 1}`, sectionsPreset: parts.length === 3 ? "FULL" : `PART_${parts[0]?.partNo ?? 1}`, parts },
  }) : null, [durationMinutes, parts, test, title, totalQuestions]);
  const canPublish = roles.includes("admin");
  const workflowStatus = canPublish ? "PUBLISHED" : "IN_REVIEW";
  const workflowLabel = canPublish ? "Xuất bản" : "Gửi duyệt";

  function updatePart(next: SpeakingPartSection) {
    setParts((current) => current.map((part) => part.id === next.id ? next : part));
  }
  function updateQuestion(next: SpeakingQuestionItem) {
    if (!activePart) return;
    updatePart({ ...activePart, questions: questions.map((question) => question.id === next.id ? next : question) });
  }
  function addQuestion() {
    if (!activePart) return;
    const question = emptyQuestion();
    updatePart({ ...activePart, questions: [...questions, question] });
    setActiveQuestionId(question.id);
  }
  async function saveDraft() {
    if (saving || !testId || !test || test.status !== "DRAFT" || !draftTest) return null;
    setSaving(true); setError("");
    try {
      const saved = await apiFetch<TestBankItem>(`/admin/test-bank/${testId}`, { method: "PUT", body: JSON.stringify({ title, description: null, skill: "SPEAKING", testType: test.testType, durationMinutes, version: test.version, tags: test.tags, draftRevision: test.draftRevision, builderContent: draftTest.builderContent }) });
      setTest(saved); setLastSavedAt(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })); return saved;
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể lưu đề Speaking."); return null; }
    finally { setSaving(false); }
  }

  useEffect(() => {
    if (loading || !test || test.status !== "DRAFT") return undefined;
    const timeout = window.setTimeout(() => { void saveDraft(); }, 1600);
    return () => window.clearTimeout(timeout);
  }, [loading, parts, title]);

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#F7F5F4]"><p className="flex items-center gap-2 text-sm font-semibold text-[#6F676C]"><SpinnerGap size={20} className="animate-spin" /> Đang tải đề Speaking...</p></div>;
  if (!test || !activePart || !draftTest) return <div className="grid min-h-screen place-items-center bg-[#F7F5F4] p-6 text-center"><div><WarningCircle size={32} className="mx-auto text-[#B42335]" /><h1 className="mt-3 text-xl font-bold">Không thể mở Speaking Builder</h1><p className="mt-2 text-sm text-[#6F676C]">{error || "Đề chưa có cấu hình hợp lệ."}</p><Link to="/test-bank" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#AD4C64] px-4 text-sm font-bold text-white">Quay lại ngân hàng đề</Link></div></div>;

  if (test.status !== "DRAFT") return <div className="grid min-h-screen place-items-center bg-[#F7F5F4] p-6 text-center"><div className="max-w-md rounded-2xl border border-[#DED7DA] bg-white p-7 shadow-sm"><WarningCircle size={32} className="mx-auto text-[#AD4C64]" /><h1 className="mt-3 text-xl font-bold">Đề không ở chế độ soạn thảo</h1><p className="mt-2 text-sm leading-6 text-[#6F676C]">Đề đang chờ duyệt hoặc đã xuất bản. Hãy quay lại ngân hàng đề để xem trước hoặc tạo bản chỉnh sửa.</p><Link to="/test-bank" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#AD4C64] px-4 text-sm font-bold text-white">Quay lại ngân hàng đề</Link></div></div>;

  return <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-[#F7F5F4] text-[#292528]">
    <header className="z-30 flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#DED7DA] bg-white px-4 py-2 lg:px-6">
      <div className="flex min-w-0 items-center gap-3"><Link to="/test-bank" aria-label="Quay lại ngân hàng đề" className="grid size-11 shrink-0 place-items-center rounded-xl text-[#6F676C] hover:bg-[#F2ECEE] focus:outline-none focus:ring-2 focus:ring-[#C85F78]"><ArrowLeft size={19} /></Link><div className="min-w-0"><input value={title} onChange={(event) => setTitle(event.target.value)} aria-label="Tên đề Speaking" className="w-full min-w-0 border-b border-transparent bg-transparent text-base font-bold focus:border-[#C85F78] focus:outline-none sm:min-w-80" /><p className="text-[11px] text-[#6F676C]">Speaking Builder • {parts.length === 3 ? "Full test" : `Part ${activePart.partNo}`} • {totalQuestions} câu</p></div></div>
      <div className="flex items-center gap-2">{lastSavedAt && <span className="hidden items-center gap-1 text-[11px] font-semibold text-[#247052] xl:flex"><CheckCircle size={15} /> Đã lưu {lastSavedAt}</span>}<button type="button" onClick={() => void saveDraft()} disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#DED7DA] px-3 text-xs font-bold disabled:opacity-50"><FloppyDisk size={17} />{saving ? "Đang lưu" : "Lưu nháp"}</button><button type="button" onClick={() => setShowPreview(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#AD4C64] px-3 text-xs font-bold text-[#AD4C64]"><Eye size={17} /> Xem trước</button><button type="button" onClick={() => { void saveDraft().then((saved) => { if (saved) setShowValidation(true); }); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#AD4C64] px-4 text-xs font-bold text-white"><ShieldCheck size={17} /> {workflowLabel}</button></div>
    </header>
    <nav aria-label="Các phần Speaking" className="flex h-12 shrink-0 items-end gap-1 overflow-x-auto border-b border-[#DED7DA] bg-[#F2ECEE] px-5">{parts.map((part) => <button key={part.id} type="button" onClick={() => { setActivePartId(part.id); setActiveQuestionId(part.questions?.[0]?.id ?? ""); }} aria-current={part.id === activePart.id ? "page" : undefined} className={`min-h-10 rounded-t-xl px-5 text-xs font-bold ${part.id === activePart.id ? "bg-white text-[#AD4C64]" : "text-[#6F676C]"}`}>Part {part.partNo}</button>)}</nav>
    {error && <div role="alert" className="flex shrink-0 items-center gap-2 border-b border-rose-200 bg-rose-50 px-5 py-2 text-xs font-semibold text-[#B42335]"><WarningCircle size={16} />{error}</div>}
    {activePart.partNo === 1 ? <main className="grid min-h-0 flex-1 overflow-y-auto xl:grid-cols-[320px_minmax(0,1fr)_minmax(380px,0.9fr)] xl:overflow-hidden">
      <aside className="space-y-4 border-r border-[#DED7DA] bg-white p-5 xl:overflow-y-auto"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#AD4C64]">Speaking Part 1</p><label className="mt-3 block text-xs font-semibold text-[#6F676C]">Chủ đề<input value={activePart.topicTitle} onChange={(event) => updatePart({ ...activePart, topicTitle: event.target.value })} placeholder="Ví dụ: Work and study" className="mt-1.5 min-h-11 w-full rounded-xl border border-[#DED7DA] px-3 text-sm focus:border-[#C85F78] focus:outline-none" /></label></div><div className="flex items-center justify-between"><h2 className="text-sm font-bold">Danh sách câu hỏi</h2><button type="button" onClick={addQuestion} className="grid size-10 place-items-center rounded-xl bg-[#F7E5EA] text-[#AD4C64]" aria-label="Thêm câu hỏi"><Plus size={18} /></button></div><div className="space-y-2">{questions.map((question, index) => <button key={question.id} type="button" onClick={() => setActiveQuestionId(question.id)} className={`w-full rounded-xl border p-3 text-left ${question.id === activeQuestion?.id ? "border-[#C85F78] bg-[#F7E5EA]" : "border-[#DED7DA]"}`}><span className="text-[10px] font-bold text-[#AD4C64]">CÂU {index + 1}</span><span className="mt-1 block line-clamp-2 text-xs font-semibold">{question.promptText || "Chưa nhập câu hỏi"}</span><span className={`mt-2 inline-flex items-center gap-1 text-[10px] font-bold ${question.hintsEnabled ? "text-[#247052]" : "text-[#6F676C]"}`}><Lightbulb size={13} /> {question.hintsEnabled ? "Có gợi ý" : "Đã tắt gợi ý"}</span></button>)}</div></aside>
      <section className="space-y-5 p-5 lg:p-7 xl:overflow-y-auto">{activeQuestion ? <><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#AD4C64]">Câu hỏi đang chọn</p><textarea value={activeQuestion.promptText} onChange={(event) => updateQuestion({ ...activeQuestion, promptText: event.target.value })} rows={4} lang="en" spellCheck className="mt-2 w-full resize-y rounded-2xl border border-[#DED7DA] bg-white p-4 text-lg font-semibold leading-7 focus:border-[#C85F78] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA]" placeholder="Nhập câu hỏi Speaking Part 1 bằng tiếng Anh..." /></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { const copy = { ...activeQuestion, id: newId("speaking-question"), hintSteps: activeQuestion.hintSteps.map((step) => ({ ...step, id: newId("speaking-hint"), options: step.options.map((option) => ({ ...option, id: newId("speaking-option") })) })) }; updatePart({ ...activePart, questions: [...questions, copy] }); setActiveQuestionId(copy.id); }} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#DED7DA] px-3 text-xs font-bold"><Copy size={16} /> Nhân bản</button><button type="button" disabled={questions.length === 1} onClick={() => { const next = questions.filter((item) => item.id !== activeQuestion.id); updatePart({ ...activePart, questions: next }); setActiveQuestionId(next[0]?.id ?? ""); }} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-[#B42335] disabled:opacity-40"><Trash size={16} /> Xóa</button>{[-1, 1].map((direction) => <button key={direction} type="button" aria-label={direction === -1 ? "Đưa câu hỏi lên" : "Đưa câu hỏi xuống"} onClick={() => { const index = questions.findIndex((item) => item.id === activeQuestion.id); updatePart({ ...activePart, questions: moveItem(questions, index, direction as -1 | 1) }); }} className="grid size-10 place-items-center rounded-xl border border-[#DED7DA]">{direction === -1 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}</button>)}</div><section className="rounded-[22px] bg-white p-5 shadow-[0_18px_45px_rgba(105,76,87,0.08)]"><h2 className="text-base font-bold">Cấu hình ghi âm</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-[#6F676C]">Thời gian trả lời tối đa (giây)<input type="number" min={10} max={300} value={activePart.answerTimeSeconds} onChange={(event) => updatePart({ ...activePart, answerTimeSeconds: Number(event.target.value) || 30 })} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#DED7DA] px-3 text-sm" /></label><label className="text-xs font-semibold text-[#6F676C]">Số lần ghi tối đa<input type="number" min={1} max={10} value={activePart.recordingConfig?.maxAttempts ?? 3} onChange={(event) => updatePart({ ...activePart, recordingConfig: { allowReRecord: activePart.recordingConfig?.allowReRecord !== false, maxAttempts: Number(event.target.value) || 1 } })} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#DED7DA] px-3 text-sm" /></label></div></section><label className="block text-xs font-semibold text-[#6F676C]">Ghi chú nội bộ<textarea value={activeQuestion.teacherNotes ?? ""} onChange={(event) => updateQuestion({ ...activeQuestion, teacherNotes: event.target.value })} rows={3} className="mt-1.5 w-full rounded-xl border border-[#DED7DA] p-3 text-sm" placeholder="Lưu ý cho giáo viên, không hiển thị với học viên..." /></label></> : <div className="rounded-2xl border border-dashed border-[#DED7DA] p-8 text-center"><p className="text-sm text-[#6F676C]">Chưa có câu hỏi.</p><button type="button" onClick={addQuestion} className="mt-4 rounded-xl bg-[#AD4C64] px-4 py-3 text-xs font-bold text-white">Tạo câu hỏi đầu tiên</button></div>}</section>
      <aside className="space-y-5 border-l border-[#DED7DA] bg-white p-5 lg:p-7 xl:overflow-y-auto">{activeQuestion && <><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#AD4C64]">Gợi ý từng bước</p><h2 className="mt-1 text-lg font-bold">Cấu trúc câu trả lời</h2><p className="mt-1 text-xs leading-5 text-[#6F676C]">Chỉ xuất hiện với câu này khi công tắc được bật.</p></div><Toggle checked={activeQuestion.hintsEnabled} label="Bật hoặc tắt gợi ý cho câu hỏi" onChange={(hintsEnabled) => updateQuestion({ ...activeQuestion, hintsEnabled })} /></div>{activeQuestion.hintsEnabled ? <div className="space-y-4">{activeQuestion.hintSteps.map((step, stepIndex) => <section key={step.id} className="rounded-2xl border border-[#DED7DA] p-4"><div className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-lg bg-[#F7E5EA] text-xs font-bold text-[#AD4C64]">{stepIndex + 1}</span><input value={step.title} onChange={(event) => updateQuestion({ ...activeQuestion, hintSteps: activeQuestion.hintSteps.map((item) => item.id === step.id ? { ...item, title: event.target.value } : item) })} aria-label={`Tên bước gợi ý ${stepIndex + 1}`} className="min-w-0 flex-1 border-b border-transparent text-sm font-bold focus:border-[#C85F78] focus:outline-none" /></div><textarea value={step.instruction} onChange={(event) => updateQuestion({ ...activeQuestion, hintSteps: activeQuestion.hintSteps.map((item) => item.id === step.id ? { ...item, instruction: event.target.value } : item) })} rows={2} className="mt-3 w-full rounded-xl border border-[#DED7DA] p-3 text-xs" placeholder="Hướng dẫn học viên chọn ý cho bước này..." /><div className="mt-3 space-y-2">{step.options.map((option, optionIndex) => <div key={option.id} className="grid grid-cols-[28px_minmax(0,1fr)_minmax(0,1fr)_36px] gap-2"><span className="pt-3 text-center text-xs font-bold text-[#AD4C64]">{String.fromCharCode(65 + optionIndex)}</span><input value={option.label} onChange={(event) => updateQuestion({ ...activeQuestion, hintSteps: activeQuestion.hintSteps.map((item) => item.id === step.id ? { ...item, options: item.options.map((entry) => entry.id === option.id ? { ...entry, label: event.target.value } : entry) } : item) })} aria-label={`Ý gợi ý ${optionIndex + 1}`} className="min-h-10 rounded-xl border border-[#DED7DA] px-3 text-xs" placeholder="Ý gợi ý tiếng Việt" /><input value={option.phrase} onChange={(event) => updateQuestion({ ...activeQuestion, hintSteps: activeQuestion.hintSteps.map((item) => item.id === step.id ? { ...item, options: item.options.map((entry) => entry.id === option.id ? { ...entry, phrase: event.target.value } : entry) } : item) })} aria-label={`Cụm từ tiếng Anh ${optionIndex + 1}`} className="min-h-10 rounded-xl border border-[#DED7DA] px-3 text-xs" placeholder="Cụm từ tiếng Anh" /><button type="button" aria-label="Xóa lựa chọn" onClick={() => updateQuestion({ ...activeQuestion, hintSteps: activeQuestion.hintSteps.map((item) => item.id === step.id ? { ...item, options: item.options.filter((entry) => entry.id !== option.id) } : item) })} className="grid size-10 place-items-center rounded-xl text-[#B42335]"><Trash size={15} /></button></div>)}</div><button type="button" onClick={() => updateQuestion({ ...activeQuestion, hintSteps: activeQuestion.hintSteps.map((item) => item.id === step.id ? { ...item, options: [...item.options, { id: newId("speaking-option"), label: "", phrase: "" }] } : item) })} className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-[#AD4C64]"><Plus size={15} /> Thêm lựa chọn</button></section>)}</div> : <div className="rounded-2xl bg-[#F2ECEE] p-5 text-sm leading-6 text-[#6F676C]"><Lightbulb size={22} className="mb-2 text-[#AD4C64]" />Học viên sẽ chỉ thấy câu hỏi và nút ghi âm. Không hiển thị vùng gợi ý hay tra từ vựng.</div>}</>}</aside>
    </main> : activePart.partNo === 2
      ? <PartTwoBuilder part={activePart} onChange={updatePart} />
      : <PartThreeBuilder part={activePart} activeQuestionId={activeQuestionId} onActiveQuestionId={setActiveQuestionId} onChange={updatePart} />}
    {showPreview && <TestPreviewModal test={draftTest} onClose={() => setShowPreview(false)} />}
    {showValidation && <PublishValidationModal test={draftTest} actionLabel={`Xác nhận ${workflowLabel.toLowerCase()}`} onClose={() => setShowValidation(false)} onPublished={async () => { const saved = await saveDraft(); if (!saved || !testId) return; await apiFetch(`/admin/test-bank/${testId}/status`, { method: "PATCH", body: JSON.stringify({ status: workflowStatus, draftRevision: saved.draftRevision }) }); navigate("/test-bank"); }} />}
  </div>;
}
