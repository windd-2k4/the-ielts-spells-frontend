import {
  ArrowLeft, CaretDown, CaretUp, Copy, Eye, FastForward, FileAudio, FloppyDisk,
  Pause, Play, Plus, Rewind, ShieldCheck, SpinnerGap, Trash, UploadSimple, WarningCircle,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type {
  ListeningPartSection, MediaAsset, QuestionCardItem, QuestionGroupItem, QuestionOption,
  QuestionTypeFormat, TestBankItem,
} from "../../library-types";
import { apiBlob, apiFetch, apiUpload } from "../../lib/api";
import ListeningQuestionGroupDialog, { type ListeningQuestionGroupDraft } from "./ListeningQuestionGroupDialog";
import PublishValidationModal from "./PublishValidationModal";
import ReadingRichTextEditor from "./ReadingRichTextEditor";
import {
  questionTypeUsesQuestionOptions, questionTypeUsesSharedOptions, readingQuestionTypeLabels,
} from "./readingQuestionGroupConfig";
import TestPreviewModal from "./TestPreviewModal";

type SaveStatus = "SAVING" | "SAVED" | "ERROR";

function newId(prefix: string) {
  const value = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return `${prefix}-${value}`;
}

function formatTime(seconds: number) {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  return `${Math.floor(safe / 60).toString().padStart(2, "0")}:${Math.floor(safe % 60).toString().padStart(2, "0")}`;
}

function timestampToSeconds(value?: string) {
  const match = value?.match(/^(\d{1,3}):(\d{2})$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
}

function plainText(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function defaultOptions(): QuestionOption[] {
  return ["A", "B", "C", "D"].map((label) => ({ id: newId("option"), label, text: "" }));
}

function normalizeQuestion(question: Partial<QuestionCardItem>, number: number, type: QuestionTypeFormat): QuestionCardItem {
  const prompt = typeof question.prompt === "string" ? question.prompt : "";
  const answers = Array.isArray(question.correctAnswers) ? question.correctAnswers.map(String) : [];
  return {
    id: typeof question.id === "string" ? question.id : newId("question"),
    number: typeof question.number === "number" ? question.number : number,
    typeFormat: question.typeFormat ?? type,
    prompt,
    options: Array.isArray(question.options) ? question.options : [],
    correctAnswers: answers,
    acceptableAnswers: Array.isArray(question.acceptableAnswers) ? question.acceptableAnswers.map(String) : [],
    explanation: typeof question.explanation === "string" ? question.explanation : "",
    teacherNote: typeof question.teacherNote === "string" ? question.teacherNote : "",
    isComplete: Boolean(prompt.trim() && answers.length),
    hasError: !(prompt.trim() && answers.length),
    errorMessage: !prompt.trim() ? "Chưa nhập câu hỏi." : answers.length === 0 ? "Chưa nhập đáp án." : undefined,
  };
}

function createQuestion(number: number, type: QuestionTypeFormat) {
  return normalizeQuestion({
    id: newId("question"), number, typeFormat: type, prompt: "",
    options: questionTypeUsesQuestionOptions(type) ? defaultOptions() : [], correctAnswers: [],
  }, number, type);
}

function normalizeGroups(value: unknown): QuestionGroupItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is QuestionGroupItem => Boolean(item && typeof item === "object")).map((group) => {
    const type = group.typeFormat ?? "NOTE_COMPLETION";
    const start = typeof group.startQuestionNo === "number" ? group.startQuestionNo : 1;
    const questions = Array.isArray(group.questions)
      ? group.questions.map((question, index) => normalizeQuestion(question, start + index, type)) : [];
    return {
      id: group.id || newId("group"), title: group.title || "Questions", titleMode: group.titleMode ?? "AUTO",
      startQuestionNo: start, endQuestionNo: group.endQuestionNo ?? questions.at(-1)?.number ?? start,
      typeFormat: type, instructions: group.instructions ?? "", wordLimitRule: group.wordLimitRule ?? "",
      answerSource: group.answerSource ?? "PASSAGE", requiredAnswerCount: group.requiredAnswerCount,
      sharedOptions: group.sharedOptions ?? [], allowOptionReused: Boolean(group.allowOptionReused),
      linkedAudioTimestamp: group.linkedAudioTimestamp, questions, isCollapsed: Boolean(group.isCollapsed),
    };
  });
}

function emptyPart(partNo: number): ListeningPartSection {
  return { id: newId(`part-${partNo}`), partNo, title: `Listening Part ${partNo}`, transcriptHtml: "", questionGroups: [] };
}

function normalizeParts(content: Record<string, unknown>): ListeningPartSection[] {
  if (Array.isArray(content.parts)) {
    const loaded = content.parts.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item))).map((part, index) => ({
      id: typeof part.id === "string" ? part.id : newId(`part-${index + 1}`),
      partNo: typeof part.partNo === "number" ? part.partNo : index + 1,
      title: typeof part.title === "string" ? part.title : `Listening Part ${index + 1}`,
      audioUrl: typeof part.audioUrl === "string" ? part.audioUrl : undefined,
      audioFilename: typeof part.audioFilename === "string" ? part.audioFilename : undefined,
      audioDurationSeconds: typeof part.audioDurationSeconds === "number" ? part.audioDurationSeconds : undefined,
      transcriptHtml: typeof part.transcriptHtml === "string" ? part.transcriptHtml : "",
      questionGroups: normalizeGroups(part.questionGroups),
    }));
    return [1, 2, 3, 4].map((partNo) => loaded.find((part) => part.partNo === partNo) ?? emptyPart(partNo));
  }
  const legacy = typeof content.transcriptText === "string"
    ? content.transcriptText.split("\n").map((line) => `<p>${line || "<br>"}</p>`).join("") : "";
  return [{
    ...emptyPart(1), transcriptHtml: legacy,
    audioDurationSeconds: typeof content.audioDurationSeconds === "number" ? content.audioDurationSeconds : undefined,
    questionGroups: normalizeGroups(content.questionGroups),
  }, emptyPart(2), emptyPart(3), emptyPart(4)];
}

function renumberParts(parts: ListeningPartSection[]) {
  let number = 1;
  return parts.map((part) => ({
    ...part,
    questionGroups: part.questionGroups.map((group) => {
      const start = number;
      const questions = group.questions.map((question) => normalizeQuestion({ ...question, number: number++ }, number - 1, group.typeFormat));
      const end = questions.at(-1)?.number ?? start;
      return { ...group, startQuestionNo: start, endQuestionNo: end, title: group.titleMode === "CUSTOM" ? group.title : `Questions ${start}–${end}`, questions };
    }),
  }));
}

function AnswerEditor({ group, question, onChange }: {
  group: QuestionGroupItem; question: QuestionCardItem; onChange: (value: QuestionCardItem) => void;
}) {
  const update = (patch: Partial<QuestionCardItem>) => onChange(normalizeQuestion({ ...question, ...patch }, question.number, question.typeFormat));
  if (questionTypeUsesSharedOptions(group.typeFormat, group.answerSource) && group.sharedOptions?.length) {
    return <label className="mt-3 block"><span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Đáp án từ Option bank</span><select value={question.correctAnswers[0] ?? ""} onChange={(event) => update({ correctAnswers: event.target.value ? [event.target.value] : [] })} className="min-h-10 w-full rounded-xl border border-[#e3dce2] bg-white px-3 text-xs focus:border-[#8f4458] focus:outline-none"><option value="">Chọn đáp án đúng</option>{group.sharedOptions.map((option) => <option key={option.id} value={option.id}>{option.code}. {option.text}</option>)}</select></label>;
  }
  if (questionTypeUsesQuestionOptions(question.typeFormat)) {
    const multiple = question.typeFormat === "MULTIPLE_ANSWERS";
    return <div className="mt-3 space-y-2"><div className="flex items-center justify-between"><span className="text-[11px] font-bold text-[#746A6E]">Các lựa chọn</span><button type="button" onClick={() => update({ options: [...question.options, { id: newId("option"), label: String.fromCharCode(65 + question.options.length), text: "" }] })} className="text-[11px] font-bold text-[#8f4458]">+ Thêm option</button></div>{question.options.map((option) => <div key={option.id} className="flex items-center gap-2"><input type={multiple ? "checkbox" : "radio"} name={`answer-${question.id}`} checked={question.correctAnswers.includes(option.id)} onChange={(event) => update({ correctAnswers: multiple ? event.target.checked ? [...question.correctAnswers, option.id] : question.correctAnswers.filter((answer) => answer !== option.id) : [option.id] })} className="accent-[#8f4458]" aria-label={`Đáp án ${option.label}`} /><span className="w-5 text-xs font-bold text-[#8f4458]">{option.label}.</span><input value={option.text} onChange={(event) => update({ options: question.options.map((item) => item.id === option.id ? { ...item, text: event.target.value } : item) })} className="min-h-9 flex-1 rounded-xl border border-[#e3dce2] px-3 text-xs focus:border-[#8f4458] focus:outline-none" placeholder={`Option ${option.label}`} /><button type="button" disabled={question.options.length <= 2} onClick={() => update({ options: question.options.filter((item) => item.id !== option.id).map((item, index) => ({ ...item, label: String.fromCharCode(65 + index) })), correctAnswers: question.correctAnswers.filter((answer) => answer !== option.id) })} aria-label={`Xóa option ${option.label}`} className="grid size-9 place-items-center rounded-lg text-[#b4232d] hover:bg-rose-50 disabled:opacity-30"><Trash size={15} /></button></div>)}</div>;
  }
  return <div className="mt-3 grid gap-3 md:grid-cols-2"><label><span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Đáp án đúng</span><input value={question.correctAnswers.join(", ")} onChange={(event) => update({ correctAnswers: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} className="min-h-9 w-full rounded-xl border border-[#e3dce2] px-3 text-xs focus:border-[#8f4458] focus:outline-none" placeholder="Các đáp án cách nhau bằng dấu phẩy" /></label><label><span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Đáp án thay thế</span><input value={(question.acceptableAnswers ?? []).join(", ")} onChange={(event) => update({ acceptableAnswers: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} className="min-h-9 w-full rounded-xl border border-[#e3dce2] px-3 text-xs focus:border-[#8f4458] focus:outline-none" placeholder="Các cách viết vẫn chấp nhận" /></label></div>;
}

export function ListeningTestBuilder() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordRef = useRef<TestBankItem | null>(null);
  const [testRecord, setTestRecord] = useState<TestBankItem | null>(null);
  const [testTitle, setTestTitle] = useState("");
  const [parts, setParts] = useState<ListeningPartSection[]>(() => [1, 2, 3, 4].map(emptyPart));
  const [activePartNo, setActivePartNo] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("SAVED");
  const [lastSavedTime, setLastSavedTime] = useState("—");
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [audioObjectUrl, setAudioObjectUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [timestampRequest, setTimestampRequest] = useState<{ id: number; html: string }>();
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const activePart = parts.find((part) => part.partNo === activePartNo) ?? parts[0];
  const allQuestions = parts.flatMap((part) => part.questionGroups).flatMap((group) => group.questions);
  const nextQuestionNo = Math.max(0, ...allQuestions.map((question) => question.number)) + 1;
  const validationCount = useMemo(() => parts.reduce((sum, part) => sum + (!part.audioUrl ? 1 : 0) + (!plainText(part.transcriptHtml) ? 1 : 0) + part.questionGroups.flatMap((group) => group.questions).reduce((questionSum, question) => questionSum + (!question.prompt.trim() ? 1 : 0) + (!question.correctAnswers.length ? 1 : 0), 0), testTitle.trim() ? 0 : 1), [parts, testTitle]);
  const builderTest = useMemo<TestBankItem | null>(() => testRecord ? { ...testRecord, title: testTitle, sectionsCount: parts.length, totalQuestions: allQuestions.length, builderContent: { ...(testRecord.builderContent ?? {}), format: "FULL", parts } } : null, [allQuestions.length, parts, testRecord, testTitle]);

  useEffect(() => { recordRef.current = testRecord; }, [testRecord]);
  useEffect(() => {
    if (!testId) return;
    setLoaded(false);
    void apiFetch<TestBankItem>(`/admin/test-bank/${testId}`).then((test) => {
      setTestRecord(test); setTestTitle(test.title); setParts(renumberParts(normalizeParts(test.builderContent ?? {})));
      setLastSavedTime(new Date(test.updatedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })); setLoaded(true);
    }).catch((reason) => { setLoadError(reason instanceof Error ? reason.message : "Không thể tải draft Listening."); setLoaded(true); });
  }, [testId]);

  const saveDraft = useCallback(async (silent = false) => {
    const record = recordRef.current;
    if (!testId || !record) return;
    if (!silent) setSaveStatus("SAVING");
    try {
      const saved = await apiFetch<TestBankItem>(`/admin/test-bank/${testId}`, { method: "PUT", body: JSON.stringify({
        title: testTitle, description: null, skill: "LISTENING", testType: record.testType,
        durationMinutes: record.durationMinutes || 40, version: record.version, tags: record.tags,
        builderContent: { ...(record.builderContent ?? {}), format: "FULL", parts },
      }) });
      setTestRecord(saved); setSaveStatus("SAVED"); setLastSavedTime(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
    } catch { setSaveStatus("ERROR"); }
  }, [parts, testId, testTitle]);

  useEffect(() => {
    if (!loaded || !recordRef.current) return undefined;
    const timer = window.setTimeout(() => void saveDraft(true), 1600);
    return () => window.clearTimeout(timer);
  }, [loaded, parts, saveDraft, testTitle]);

  useEffect(() => {
    setCurrentTime(0); setIsPlaying(false); setAudioError("");
    if (!activePart?.audioUrl) { setAudioObjectUrl(""); return undefined; }
    let disposed = false; let url = "";
    void apiBlob(activePart.audioUrl).then((blob) => { if (!disposed) { url = URL.createObjectURL(blob); setAudioObjectUrl(url); } }).catch((reason) => setAudioError(reason instanceof Error ? reason.message : "Không thể tải audio."));
    return () => { disposed = true; if (url) URL.revokeObjectURL(url); };
  }, [activePart?.audioUrl, activePartNo]);
  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = playbackSpeed; }, [playbackSpeed]);

  function updateActivePart(updater: (part: ListeningPartSection) => ListeningPartSection) {
    setParts((current) => current.map((part) => part.partNo === activePartNo ? updater(part) : part));
  }
  function updateGroup(id: string, updater: (group: QuestionGroupItem) => QuestionGroupItem) {
    updateActivePart((part) => ({ ...part, questionGroups: part.questionGroups.map((group) => group.id === id ? updater(group) : group) }));
  }
  function updateQuestion(groupId: string, questionId: string, updater: (question: QuestionCardItem) => QuestionCardItem) {
    updateGroup(groupId, (group) => ({ ...group, questions: group.questions.map((question) => question.id === questionId ? updater(question) : question) }));
  }

  async function uploadAudio(file: File) {
    if (!file.type.startsWith("audio/")) { setAudioError("Vui lòng chọn đúng tệp audio."); return; }
    setUploadingAudio(true); setAudioError("");
    try {
      const form = new FormData(); form.append("file", file);
      const asset = await apiUpload<MediaAsset>("/admin/library/media", form);
      updateActivePart((part) => ({ ...part, audioUrl: asset.fileUrl, audioFilename: asset.filename, audioDurationSeconds: asset.durationSeconds }));
    } catch (reason) { setAudioError(reason instanceof Error ? reason.message : "Không thể tải audio lên."); }
    finally { setUploadingAudio(false); }
  }

  function createGroup(draft: ListeningQuestionGroupDraft) {
    const questions = Array.from({ length: draft.questionCount }, (_, index) => createQuestion(nextQuestionNo + index, draft.typeFormat));
    const end = nextQuestionNo + draft.questionCount - 1;
    const group: QuestionGroupItem = {
      id: newId("listening-group"), title: draft.title || `Questions ${nextQuestionNo}–${end}`, titleMode: draft.title ? "CUSTOM" : "AUTO",
      startQuestionNo: nextQuestionNo, endQuestionNo: end, typeFormat: draft.typeFormat, instructions: draft.instructions,
      wordLimitRule: draft.wordLimitRule, answerSource: "PASSAGE", requiredAnswerCount: draft.requiredAnswerCount,
      sharedOptions: draft.sharedOptions, allowOptionReused: draft.allowOptionReused,
      linkedAudioTimestamp: draft.linkedAudioTimestamp, questions,
    };
    setParts((current) => renumberParts(current.map((part) => part.partNo === activePartNo
      ? { ...part, questionGroups: [...part.questionGroups, group] }
      : part)));
    setShowGroupDialog(false);
  }

  function removeGroup(id: string) {
    if (!window.confirm("Xóa Question Group và toàn bộ câu hỏi bên trong?")) return;
    setParts((current) => renumberParts(current.map((part) => part.partNo === activePartNo ? { ...part, questionGroups: part.questionGroups.filter((group) => group.id !== id) } : part)));
  }
  function duplicateGroup(group: QuestionGroupItem) {
    const copy = { ...group, id: newId("group"), title: `${group.title} (bản sao)`, titleMode: "CUSTOM" as const, questions: group.questions.map((question) => ({ ...question, id: newId("question"), correctAnswers: [], options: question.options.map((option) => ({ ...option, id: newId("option") })) })) };
    setParts((current) => renumberParts(current.map((part) => part.partNo === activePartNo ? { ...part, questionGroups: [...part.questionGroups, copy] } : part)));
  }
  function addQuestion(group: QuestionGroupItem) {
    setParts((current) => renumberParts(current.map((part) => part.partNo === activePartNo ? { ...part, questionGroups: part.questionGroups.map((item) => item.id === group.id ? { ...item, questions: [...item.questions, createQuestion(item.endQuestionNo + 1, item.typeFormat)] } : item) } : part)));
  }
  function removeQuestion(groupId: string, questionId: string) {
    setParts((current) => renumberParts(current.map((part) => part.partNo === activePartNo ? { ...part, questionGroups: part.questionGroups.map((group) => group.id === groupId ? { ...group, questions: group.questions.filter((question) => question.id !== questionId) } : group) } : part)));
  }
  function seekTo(seconds: number) {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(seconds, audioRef.current.duration || seconds)); setCurrentTime(audioRef.current.currentTime);
  }

  if (!loaded) return <div className="grid h-screen place-items-center bg-[#F8F6FA]"><span className="inline-flex items-center gap-2 text-sm font-bold text-[#746A6E]"><SpinnerGap size={20} className="animate-spin" /> Đang tải Listening Builder...</span></div>;
  if (loadError || !activePart) return <div className="grid h-screen place-items-center bg-[#F8F6FA] p-6"><div className="max-w-lg rounded-2xl border border-rose-200 bg-white p-6 text-center"><WarningCircle size={28} className="mx-auto text-[#b4232d]" /><h1 className="mt-3 font-display text-lg font-bold">Không thể mở Listening Builder</h1><p className="mt-2 text-sm text-[#746A6E]">{loadError || "Draft không hợp lệ."}</p><Link to="/test-bank" className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-[#8f4458] px-4 text-sm font-bold text-white">Quay lại</Link></div></div>;

  return <div className="flex h-screen min-w-0 flex-col overflow-hidden bg-[#F8F6FA] text-[#211A1D]">
    <header className="z-30 flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#e3dce2] bg-white px-5 py-2 shadow-sm">
      <div className="flex min-w-0 items-center gap-4"><Link to="/test-bank" className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-[#746A6E] hover:text-[#8f4458]"><ArrowLeft size={16} /> Ngân hàng đề</Link><span className="h-4 w-px bg-[#e3dce2]" /><label className="min-w-0"><span className="sr-only">Tên đề</span><input value={testTitle} onChange={(event) => setTestTitle(event.target.value)} className="min-w-[240px] max-w-[420px] border-b border-transparent font-display text-sm font-bold focus:border-[#8f4458] focus:outline-none" /></label><span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase text-[#746A6E]">{testRecord?.status ?? "DRAFT"}</span></div>
      <div className="flex items-center gap-2"><span className={`hidden text-[11px] font-semibold lg:inline ${saveStatus === "ERROR" ? "text-[#b4232d]" : "text-[#237653]"}`}>{saveStatus === "ERROR" ? "Lưu thất bại" : `Đã lưu ${lastSavedTime}`}</span>{validationCount > 0 && <span className="hidden rounded-full bg-rose-50 px-3 py-1 text-[11px] font-bold text-[#b4232d] xl:inline">{validationCount} mục cần xử lý</span>}<button type="button" onClick={() => void saveDraft()} disabled={saveStatus === "SAVING"} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#e3dce2] px-3.5 text-xs font-bold disabled:opacity-50"><FloppyDisk size={16} /> Lưu nháp</button><button type="button" onClick={() => setShowPreview(true)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#8f4458] px-3.5 text-xs font-bold text-[#8f4458]"><Eye size={16} /> Xem trước</button><button type="button" onClick={() => setShowValidation(true)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#8f4458] px-4 text-xs font-bold text-white"><ShieldCheck size={16} /> Xuất bản</button></div>
    </header>

    <nav className="flex min-h-12 shrink-0 items-center justify-between border-b border-[#e3dce2] bg-[#f1eef4] px-5" aria-label="Các phần Listening"><div className="flex gap-1">{parts.map((part) => { const count = part.questionGroups.reduce((sum, group) => sum + group.questions.length, 0); return <button key={part.id} type="button" onClick={() => setActivePartNo(part.partNo)} aria-current={activePartNo === part.partNo ? "page" : undefined} className={`min-h-10 rounded-t-xl px-5 text-xs font-bold ${activePartNo === part.partNo ? "bg-white text-[#8f4458] shadow-sm" : "text-[#746A6E] hover:bg-[#e3dce2]"}`}>Part {part.partNo}<span className="ml-2 rounded-full bg-black/5 px-1.5 py-0.5 text-[10px]">{count}</span></button>; })}</div><span className="hidden text-xs font-semibold text-[#746A6E] lg:inline">Listening Builder · {allQuestions.length}/40 câu</span></nav>

    <main className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
      <section className="custom-scrollbar min-w-0 overflow-y-auto border-r border-[#e3dce2] bg-white p-5">
        <div className="relative rounded-[18px] border border-[#8f4458]/20 bg-[#fff8fa] p-4 shadow-sm">
          <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadAudio(file); event.target.value = ""; }} />
          <audio ref={audioRef} src={audioObjectUrl || undefined} preload="metadata" onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onLoadedMetadata={(event) => { const duration = event.currentTarget.duration; if (Number.isFinite(duration)) updateActivePart((part) => ({ ...part, audioDurationSeconds: duration })); }} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} />
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#8f4458] text-white"><FileAudio size={20} /></span><div className="min-w-0"><h2 className="font-display text-sm font-bold">Audio Part {activePart.partNo}</h2><p className="truncate text-[11px] text-[#746A6E]">{activePart.audioFilename || "Chưa tải file audio"}</p></div></div><button type="button" disabled={uploadingAudio} onClick={() => fileInputRef.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#e3dce2] bg-white px-3 text-xs font-bold text-[#8f4458] disabled:opacity-50">{uploadingAudio ? <SpinnerGap size={16} className="animate-spin" /> : <UploadSimple size={16} />} {activePart.audioUrl ? "Đổi audio" : "Tải audio"}</button></div>
          {audioError && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-[#b4232d]">{audioError}</p>}
          <div className="mt-4"><input type="range" min={0} max={Math.max(1, activePart.audioDurationSeconds ?? 0)} step={0.1} value={Math.min(currentTime, activePart.audioDurationSeconds ?? currentTime)} onChange={(event) => seekTo(Number(event.target.value))} disabled={!audioObjectUrl} aria-label="Vị trí audio" className="w-full accent-[#8f4458] disabled:opacity-40" /><div className="mt-1 flex justify-between text-[10px] font-bold tabular-nums text-[#746A6E]"><span>{formatTime(currentTime)}</span><span>{formatTime(activePart.audioDurationSeconds ?? 0)}</span></div></div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><button type="button" disabled={!audioObjectUrl} onClick={() => seekTo(currentTime - 5)} aria-label="Tua lùi 5 giây" className="grid size-10 place-items-center rounded-xl border border-[#e3dce2] bg-white disabled:opacity-40"><Rewind size={17} /></button><button type="button" disabled={!audioObjectUrl} onClick={() => { const player = audioRef.current; if (!player) return; if (player.paused) void player.play(); else player.pause(); }} aria-label={isPlaying ? "Tạm dừng" : "Phát"} className="grid size-11 place-items-center rounded-xl bg-[#8f4458] text-white disabled:opacity-40">{isPlaying ? <Pause size={19} /> : <Play size={19} />}</button><button type="button" disabled={!audioObjectUrl} onClick={() => seekTo(currentTime + 5)} aria-label="Tua tới 5 giây" className="grid size-10 place-items-center rounded-xl border border-[#e3dce2] bg-white disabled:opacity-40"><FastForward size={17} /></button></div><div className="flex items-center gap-1.5"><span className="mr-1 text-[11px] font-bold text-[#746A6E]">Tốc độ</span>{[0.8, 1, 1.25, 1.5].map((speed) => <button key={speed} type="button" onClick={() => setPlaybackSpeed(speed)} aria-pressed={playbackSpeed === speed} className={`min-h-9 rounded-lg px-2.5 text-[10px] font-bold ${playbackSpeed === speed ? "bg-[#8f4458] text-white" : "border border-[#e3dce2] bg-white text-[#746A6E]"}`}>{speed}x</button>)}</div></div>
        </div>
        <div className="mt-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-base font-bold">Transcript Editor</h2><p className="mt-1 text-xs text-[#746A6E]">Rich text editor và timestamp tại vị trí con trỏ.</p></div><button type="button" onClick={() => setTimestampRequest({ id: Date.now(), html: `<span style="color:#8f4458;font-weight:700">[${formatTime(currentTime)}]</span>&nbsp;` })} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#8f4458] px-3 text-xs font-bold text-[#8f4458]"><Plus size={15} /> Chèn [{formatTime(currentTime)}]</button></div><ReadingRichTextEditor passageId={activePart.id} value={activePart.transcriptHtml} onChange={(html) => updateActivePart((part) => ({ ...part, transcriptHtml: html }))} editorLabel={`Transcript Part ${activePart.partNo}`} placeholder="Nhập hoặc paste transcript tiếng Anh tại đây..." minHeight={440} insertHtmlRequest={timestampRequest} /></div>
      </section>

      <section id="listening-question-panel" className="custom-scrollbar min-w-0 overflow-y-auto bg-[#F8F6FA] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e3dce2] bg-white p-4 shadow-sm"><div><h2 className="font-display text-base font-bold">Question Groups · Part {activePart.partNo}</h2><p className="mt-1 text-xs text-[#746A6E]">{activePart.questionGroups.length} group · {activePart.questionGroups.reduce((sum, group) => sum + group.questions.length, 0)} câu</p></div><button type="button" onClick={() => setShowGroupDialog(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#8f4458] px-4 text-xs font-bold text-white"><Plus size={17} /> Thêm Question Group</button></div>
        {activePart.questionGroups.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-[#d8ced6] bg-white p-10 text-center"><FileAudio size={30} className="mx-auto text-[#8f4458]" /><h3 className="mt-3 font-display text-base font-bold">Part này chưa có câu hỏi</h3><p className="mt-1 text-sm text-[#746A6E]">Tạo group đầu tiên và chọn đúng dạng bài.</p><button type="button" onClick={() => setShowGroupDialog(true)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#8f4458] px-4 text-sm font-bold text-white"><Plus size={17} /> Tạo group</button></div> : <div className="mt-5 space-y-5">{activePart.questionGroups.map((group) => <article key={group.id} id={group.id} className="rounded-[18px] border border-[#e3dce2] bg-white p-5 shadow-sm">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e3dce2] pb-4"><div className="min-w-0 flex-1"><input value={group.title} onChange={(event) => updateGroup(group.id, (value) => ({ ...value, title: event.target.value, titleMode: "CUSTOM" }))} aria-label="Tên group" className="w-full border-b border-transparent font-display text-sm font-bold text-[#8f4458] focus:border-[#8f4458] focus:outline-none" /><p className="mt-1 text-[11px] font-semibold text-[#746A6E]">{readingQuestionTypeLabels[group.typeFormat]} · Câu {group.startQuestionNo}–{group.endQuestionNo}</p></div><div className="flex items-center gap-1.5">{group.linkedAudioTimestamp && <button type="button" onClick={() => seekTo(timestampToSeconds(group.linkedAudioTimestamp))} className="min-h-9 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-[11px] font-bold tabular-nums text-[#237653]">Phát [{group.linkedAudioTimestamp}]</button>}<button type="button" onClick={() => duplicateGroup(group)} aria-label="Nhân bản group" className="grid size-9 place-items-center rounded-lg border border-[#e3dce2]"><Copy size={15} /></button><button type="button" onClick={() => removeGroup(group.id)} aria-label="Xóa group" className="grid size-9 place-items-center rounded-lg border border-rose-200 text-[#b4232d]"><Trash size={15} /></button><button type="button" onClick={() => updateGroup(group.id, (value) => ({ ...value, isCollapsed: !value.isCollapsed }))} aria-label="Thu gọn group" className="grid size-9 place-items-center rounded-lg border border-[#e3dce2]">{group.isCollapsed ? <CaretDown size={15} /> : <CaretUp size={15} />}</button></div></header>
          {!group.isCollapsed && <><div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_120px]"><label><span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Instructions</span><textarea rows={2} value={group.instructions} onChange={(event) => updateGroup(group.id, (value) => ({ ...value, instructions: event.target.value }))} className="w-full rounded-xl border border-[#e3dce2] p-3 text-xs focus:border-[#8f4458] focus:outline-none" /></label><label><span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Timestamp</span><input value={group.linkedAudioTimestamp ?? ""} onChange={(event) => updateGroup(group.id, (value) => ({ ...value, linkedAudioTimestamp: event.target.value }))} className="min-h-10 w-full rounded-xl border border-[#e3dce2] px-3 text-xs font-bold tabular-nums focus:border-[#8f4458] focus:outline-none" placeholder="00:00" /></label></div>{group.wordLimitRule && <label className="mt-3 block"><span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Word limit</span><input value={group.wordLimitRule} onChange={(event) => updateGroup(group.id, (value) => ({ ...value, wordLimitRule: event.target.value }))} className="min-h-9 w-full rounded-xl border border-[#e3dce2] px-3 text-xs" /></label>}
            {group.sharedOptions && group.sharedOptions.length > 0 && <div className="mt-3 rounded-xl border border-[#e3dce2] bg-[#f8f6fa] p-3"><p className="text-[11px] font-bold text-[#746A6E]">Option bank</p><div className="mt-2 grid gap-2 md:grid-cols-2">{group.sharedOptions.map((option) => <label key={option.id} className="flex items-center gap-2"><span className="w-5 text-xs font-bold text-[#8f4458]">{option.code}.</span><input value={option.text} onChange={(event) => updateGroup(group.id, (value) => ({ ...value, sharedOptions: value.sharedOptions?.map((item) => item.id === option.id ? { ...item, text: event.target.value } : item) }))} className="min-h-9 flex-1 rounded-lg border border-[#e3dce2] px-2.5 text-xs" /></label>)}</div></div>}
            <div className="mt-4 space-y-3">{group.questions.map((question) => <div key={question.id} id={question.id} className={`rounded-xl border p-4 ${question.hasError ? "border-rose-200 bg-rose-50/30" : "border-[#e3dce2]"}`}><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-[#8f4458] text-xs font-bold text-white">{question.number}</span><span className="text-xs font-bold">Câu {question.number}</span>{question.hasError && <span className="text-[10px] font-bold text-[#b4232d]">{question.errorMessage}</span>}</div><button type="button" onClick={() => removeQuestion(group.id, question.id)} aria-label={`Xóa câu ${question.number}`} className="grid size-9 place-items-center rounded-lg text-[#b4232d]"><Trash size={15} /></button></div><label className="mt-3 block"><span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Nội dung câu hỏi</span><textarea rows={2} value={question.prompt} onChange={(event) => updateQuestion(group.id, question.id, (value) => normalizeQuestion({ ...value, prompt: event.target.value }, value.number, value.typeFormat))} className="w-full rounded-xl border border-[#e3dce2] p-3 text-xs focus:border-[#8f4458] focus:outline-none" placeholder="Nhập câu hỏi, form, note hoặc vị trí cần điền..." /></label><AnswerEditor group={group} question={question} onChange={(value) => updateQuestion(group.id, question.id, () => value)} /><div className="mt-3 grid gap-3 border-t border-[#e3dce2] pt-3 md:grid-cols-2"><label><span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Giải thích đáp án</span><textarea rows={2} value={question.explanation ?? ""} onChange={(event) => updateQuestion(group.id, question.id, (value) => ({ ...value, explanation: event.target.value }))} className="w-full rounded-xl border border-[#e3dce2] p-3 text-xs" /></label><label><span className="mb-1 block text-[11px] font-bold text-[#746A6E]">Teacher note</span><textarea rows={2} value={question.teacherNote ?? ""} onChange={(event) => updateQuestion(group.id, question.id, (value) => ({ ...value, teacherNote: event.target.value }))} className="w-full rounded-xl border border-[#e3dce2] p-3 text-xs" /></label></div></div>)}</div><button type="button" onClick={() => addQuestion(group)} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#e3dce2] px-3 text-xs font-bold text-[#8f4458]"><Plus size={15} /> Thêm câu hỏi</button></>}
        </article>)}</div>}
      </section>
    </main>

    <ListeningQuestionGroupDialog open={showGroupDialog} partNo={activePart.partNo} startQuestionNo={nextQuestionNo} currentTimestamp={formatTime(currentTime)} createId={() => newId("shared-option")} onClose={() => setShowGroupDialog(false)} onCreate={createGroup} />
    {showValidation && builderTest && <PublishValidationModal test={builderTest} onClose={() => setShowValidation(false)} onPublished={() => { if (!testId) return; return apiFetch(`/admin/test-bank/${testId}/status`, { method: "PATCH", body: JSON.stringify({ status: "PUBLISHED" }) }).then(() => navigate("/test-bank")); }} />}
    {showPreview && builderTest && <TestPreviewModal test={builderTest} onClose={() => setShowPreview(false)} />}
  </div>;
}
