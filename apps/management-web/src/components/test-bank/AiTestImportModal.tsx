import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  CaretDown,
  Check,
  CheckCircle,
  Eye,
  FileText,
  Headphones,
  Info,
  Microphone,
  PencilSimpleLine,
  ShieldCheck,
  Sparkle,
  SpinnerGap,
  UploadSimple,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";
import type { QuestionGroupIllustration, TestBankItem, TestSkill } from "../../library-types";
import TestPreviewModal from "../test-builder/TestPreviewModal";
import AiImportCoverImageField from "./AiImportCoverImageField";
import AiImportStructurePreview from "./AiImportStructurePreview";

type Props = {
  onClose: () => void;
  onSuccess: (createdTest: TestBankItem) => void;
};

type Step = "SOURCE" | "GUIDANCE" | "REVIEW" | "FINISH";
type AuthoringSkill = "READING" | "LISTENING" | "WRITING" | "SPEAKING";
type AiParserProvider = "AUTO" | "NVIDIA" | "GEMINI" | "OFFLINE_REGEX";

type AiParseResponse = {
  title: string;
  description: string;
  skill: TestSkill;
  testType: "FULL_TEST" | "SINGLE_SKILL";
  durationMinutes: number;
  suggestedTags: string[];
  builderContent: Record<string, unknown>;
  questionCount: number;
  warnings: string[];
};

const STEP_ORDER: Step[] = ["SOURCE", "GUIDANCE", "REVIEW", "FINISH"];
const STEP_LABELS: Record<Step, string> = {
  SOURCE: "Nội dung đề",
  GUIDANCE: "Lưu ý cho AI",
  REVIEW: "Kiểm tra cấu trúc",
  FINISH: "Hoàn tất",
};
const SKILLS: Array<{ value: AuthoringSkill; label: string; description: string; icon: typeof BookOpenText }> = [
  { value: "READING", label: "Reading", description: "Bài đọc và nhóm câu hỏi", icon: BookOpenText },
  { value: "LISTENING", label: "Listening", description: "Các phần nghe và transcript", icon: Headphones },
  { value: "WRITING", label: "Writing", description: "Task 1, Task 2 hoặc cả hai", icon: PencilSimpleLine },
  { value: "SPEAKING", label: "Speaking", description: "Part 1, Part 2 và Part 3", icon: Microphone },
];
const PROVIDERS: Array<{ value: AiParserProvider; label: string; description: string }> = [
  { value: "AUTO", label: "Tự động (khuyên dùng)", description: "Tự chọn dịch vụ phù hợp và chuyển sang phương án dự phòng khi cần." },
  { value: "NVIDIA", label: "NVIDIA NIM", description: "Chỉ dùng mô hình NVIDIA đã cấu hình." },
  { value: "GEMINI", label: "Gemini", description: "Chỉ dùng Gemini đã cấu hình." },
  { value: "OFFLINE_REGEX", label: "Bộ phân tách offline", description: "Không gọi AI; phù hợp với văn bản đã có cấu trúc rõ." },
];
const GUIDANCE_SUGGESTIONS = [
  "Giữ nguyên số thứ tự câu hỏi.",
  "Đáp án nằm ở cuối tài liệu.",
  "Không đưa phần giải thích đáp án vào nội dung đề.",
];

function defaultFormat(skill: AuthoringSkill) {
  if (skill === "LISTENING") return "SECTION_1";
  if (skill === "WRITING") return "TASK_1";
  if (skill === "SPEAKING") return "PART_1";
  return "PASSAGE_1";
}

function formatOptions(skill: AuthoringSkill) {
  if (skill === "LISTENING") return [
    ["SECTION_1", "Section 1"], ["SECTION_2", "Section 2"], ["SECTION_3", "Section 3"], ["SECTION_4", "Section 4"], ["FULL", "Full test · 4 sections"],
  ];
  if (skill === "WRITING") return [["TASK_1", "Task 1"], ["TASK_2", "Task 2"], ["FULL", "Full test · Task 1 + 2"]];
  if (skill === "SPEAKING") return [["PART_1", "Part 1"], ["PART_2", "Part 2"], ["PART_3", "Part 3"], ["FULL", "Full test · Part 1–3"]];
  return [["PASSAGE_1", "Passage 1"], ["PASSAGE_2", "Passage 2"], ["PASSAGE_3", "Passage 3"], ["FULL", "Full test · 3 passages"]];
}

function sectionCount(content: Record<string, unknown>) {
  if (Array.isArray(content.passages)) return content.passages.length;
  if (Array.isArray(content.parts)) return content.parts.length;
  if (Array.isArray(content.tasks)) return content.tasks.length;
  return 1;
}

function scrollFlowToTop() {
  document.getElementById("admin-content")?.scrollTo({ top: 0, behavior: "smooth" });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function AiTestImportModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>("SOURCE");
  const [skill, setSkill] = useState<AuthoringSkill>("READING");
  const [provider, setProvider] = useState<AiParserProvider>("AUTO");
  const [testFormat, setTestFormat] = useState("PASSAGE_1");
  const [titleHint, setTitleHint] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [teacherInstructions, setTeacherInstructions] = useState("");
  const [rawText, setRawText] = useState("");
  const [inputTab, setInputTab] = useState<"TEXT" | "FILE">("TEXT");
  const [fileName, setFileName] = useState("");
  const [readingFile, setReadingFile] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showVisualPreview, setShowVisualPreview] = useState(false);
  const [error, setError] = useState("");
  const [parseResult, setParseResult] = useState<AiParseResponse | null>(null);
  const [coverImage, setCoverImage] = useState<QuestionGroupIllustration>();

  const currentStepIndex = STEP_ORDER.indexOf(step);
  const builderContent = useMemo<Record<string, unknown>>(() => {
    if (!parseResult) return {};
    return {
      ...parseResult.builderContent,
      ...(coverImage ? { coverImage } : {}),
      aiImportMetadata: {
        ...(teacherInstructions.trim() ? { teacherInstructions: teacherInstructions.trim() } : {}),
        ...(sourceUrl.trim() ? { sourceUrl: sourceUrl.trim() } : {}),
        provider,
      },
    };
  }, [coverImage, parseResult, provider, sourceUrl, teacherInstructions]);

  const previewTestItem = useMemo<TestBankItem | null>(() => parseResult ? {
    id: "temp-preview-id",
    code: "PREVIEW",
    title: parseResult.title,
    skill: parseResult.skill,
    testType: parseResult.testType,
    sectionsCount: sectionCount(builderContent),
    totalQuestions: parseResult.questionCount,
    durationMinutes: parseResult.durationMinutes,
    version: "v1.0",
    status: "DRAFT",
    tags: parseResult.suggestedTags,
    referencedCoursesCount: 0,
    createdBy: "AI_IMPORT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    builderContent,
    draftRevision: 1,
  } : null, [builderContent, parseResult]);

  async function readFile(file: File) {
    if (file.size > 20 * 1024 * 1024) {
      setError("Tệp nhập không được vượt quá 20 MB.");
      return;
    }
    const extension = file.name.toLowerCase();
    if (!(file.type === "application/pdf" || extension.endsWith(".pdf") || /\.(txt|json|md)$/.test(extension))) {
      setError("Chỉ hỗ trợ PDF, TXT, JSON hoặc Markdown.");
      return;
    }
    setFileName(file.name);
    setReadingFile(true);
    setError("");
    try {
      const isPdf = file.type === "application/pdf" || extension.endsWith(".pdf");
      const text = isPdf
        ? await import("./pdfTextExtractor").then(({ extractPdfText }) => extractPdfText(file))
        : await file.text();
      if (!text.trim()) throw new Error(isPdf ? "PDF không có lớp văn bản. Hãy OCR tệp scan rồi thử lại." : "Tệp không có nội dung văn bản.");
      setRawText(text);
    } catch (reason) {
      setRawText("");
      setError(reason instanceof Error ? reason.message : "Không thể đọc nội dung tệp.");
    } finally {
      setReadingFile(false);
    }
  }

  function goToGuidance() {
    if (!rawText.trim()) {
      setError("Hãy dán nội dung đề hoặc tải một tệp trước khi tiếp tục.");
      return;
    }
    setError("");
    setStep("GUIDANCE");
    scrollFlowToTop();
  }

  function closeFlow() {
    const hasUnsavedWork = Boolean(rawText.trim() || teacherInstructions.trim() || parseResult || coverImage);
    if (hasUnsavedWork && !window.confirm("Nội dung nhập chưa được lưu. Bạn có chắc muốn rời khỏi màn hình này?")) return;
    onClose();
  }

  function openPreview() {
    if (coverImage && !coverImage.altText.trim()) {
      setError("Hãy thêm mô tả cho ảnh minh họa trước khi mở bản xem trước.");
      return;
    }
    setError("");
    setShowVisualPreview(true);
  }

  async function runAiParse() {
    if (!rawText.trim()) return;
    setParsing(true);
    setError("");
    try {
      const response = await apiFetch<AiParseResponse>("/admin/test-bank/ai-parse", {
        method: "POST",
        body: JSON.stringify({
          rawText: rawText.trim(),
          skill,
          testFormat,
          titleHint: titleHint.trim() || undefined,
          sourceUrl: sourceUrl.trim() || undefined,
          provider,
          teacherInstructions: teacherInstructions.trim() || undefined,
        }),
      });
      setParseResult(response);
      setStep("REVIEW");
      scrollFlowToTop();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể phân tích nội dung đề.");
    } finally {
      setParsing(false);
    }
  }

  async function createDraft() {
    if (!parseResult) return;
    if (coverImage && !coverImage.altText.trim()) {
      setError("Hãy thêm mô tả cho ảnh minh họa trước khi tạo bản nháp.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const created = await apiFetch<TestBankItem>("/admin/test-bank", {
        method: "POST",
        body: JSON.stringify({
          title: parseResult.title.trim(),
          description: parseResult.description,
          skill: parseResult.skill,
          testType: parseResult.testType,
          durationMinutes: parseResult.durationMinutes,
          version: "v1.0",
          tags: parseResult.suggestedTags,
          builderContent,
        }),
      });
      onSuccess(created);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tạo đề thi nháp.");
      setCreating(false);
    }
  }

  function addGuidance(value: string) {
    setTeacherInstructions((current) => {
      if (current.includes(value)) return current;
      const next = current.trim() ? `${current.trim()}\n${value}` : value;
      return next.slice(0, 2000);
    });
  }

  return (
    <div className="min-h-screen bg-[#F7F5F4] text-[#292528]">
      <header className="sticky top-0 z-30 border-b border-[#DED7DA] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={closeFlow} aria-label="Quay lại ngân hàng đề" className="grid size-11 shrink-0 place-items-center rounded-xl text-[#6F676C] transition hover:bg-[#F2ECEE] hover:text-[#AD4C64] focus:outline-none focus:ring-2 focus:ring-[#C85F78]">
              <ArrowLeft size={20} />
            </button>
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#F7E5EA] text-[#AD4C64]"><Sparkle size={22} weight="duotone" /></span>
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-bold">Nhập đề bằng AI</h1>
              <p className="hidden text-xs text-[#6F676C] sm:block">Tạo bản nháp từ văn bản hoặc PDF, sau đó kiểm tra trước khi lưu.</p>
            </div>
          </div>
          <button type="button" onClick={closeFlow} className="hidden min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-bold text-[#6F676C] transition hover:bg-[#F2ECEE] sm:inline-flex"><X size={17} /> Hủy nhập</button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <nav aria-label="Tiến trình nhập đề" className="mb-6 overflow-x-auto">
          <ol className="grid grid-cols-4 rounded-2xl border border-[#DED7DA] bg-white p-2">
            {STEP_ORDER.map((item, index) => {
              const active = item === step;
              const complete = index < currentStepIndex;
              return (
                <li key={item} aria-label={`Bước ${index + 1}: ${STEP_LABELS[item]}`} aria-current={active ? "step" : undefined} className={`flex min-h-12 items-center justify-center gap-3 rounded-xl px-2 sm:justify-start sm:px-3 ${active ? "bg-[#F7E5EA]" : ""}`}>
                  <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${complete ? "bg-[#247052] text-white" : active ? "bg-[#AD4C64] text-white" : "bg-[#F2ECEE] text-[#6F676C]"}`}>{complete ? <Check size={15} weight="bold" /> : index + 1}</span>
                  <span className={`hidden text-xs font-bold sm:inline ${active ? "text-[#AD4C64]" : "text-[#6F676C]"}`}>{STEP_LABELS[item]}</span>
                </li>
              );
            })}
          </ol>
        </nav>

        {error && <div role="alert" className="mb-5 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-[#B42335]"><WarningCircle size={20} className="mt-0.5 shrink-0" /><span>{error}</span></div>}

        {step === "SOURCE" && (
          <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
            <aside className="h-fit rounded-[22px] border border-[#DED7DA] bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#AD4C64]">Bước 1</p>
              <h2 className="mt-1 font-display text-xl font-bold">Đề này thuộc kỹ năng nào?</h2>
              <p className="mt-2 text-sm leading-6 text-[#6F676C]">Chọn đúng kỹ năng và phạm vi để AI nhận diện cấu trúc phù hợp.</p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                {SKILLS.map(({ value, label, description, icon: Icon }) => (
                  <button key={value} type="button" aria-pressed={skill === value} onClick={() => { setSkill(value); setTestFormat(defaultFormat(value)); }} className={`flex min-h-16 items-center gap-3 rounded-xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[#C85F78] ${skill === value ? "border-[#C85F78] bg-[#F7E5EA]" : "border-[#DED7DA] hover:bg-[#F7F5F4]"}`}>
                    <Icon size={21} className={skill === value ? "text-[#AD4C64]" : "text-[#6F676C]"} />
                    <span><span className="block text-sm font-bold">{label}</span><span className="mt-0.5 block text-[11px] text-[#6F676C]">{description}</span></span>
                  </button>
                ))}
              </div>
              <label htmlFor="ai-import-format" className="mt-5 block text-xs font-bold">Phạm vi đề</label>
              <select id="ai-import-format" value={testFormat} onChange={(event) => setTestFormat(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-[#DED7DA] bg-white px-3 text-sm focus:border-[#C85F78] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA]">
                {formatOptions(skill).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </aside>

            <section className="rounded-[22px] border border-[#DED7DA] bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="font-display text-xl font-bold">Thêm nội dung đề gốc</h2><p className="mt-1 text-sm text-[#6F676C]">Dán văn bản hoặc tải PDF có lớp văn bản.</p></div>
                {rawText && <span className="rounded-lg bg-[#F2ECEE] px-2.5 py-1.5 text-[11px] font-semibold text-[#6F676C]">{rawText.length.toLocaleString("vi-VN")} ký tự</span>}
              </div>
              <div className="mt-5 flex gap-1 border-b border-[#DED7DA]" role="tablist" aria-label="Cách thêm nội dung">
                <button type="button" role="tab" aria-selected={inputTab === "TEXT"} onClick={() => setInputTab("TEXT")} className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-xs font-bold ${inputTab === "TEXT" ? "border-[#AD4C64] text-[#AD4C64]" : "border-transparent text-[#6F676C]"}`}><FileText size={17} /> Dán văn bản</button>
                <button type="button" role="tab" aria-selected={inputTab === "FILE"} onClick={() => setInputTab("FILE")} className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-xs font-bold ${inputTab === "FILE" ? "border-[#AD4C64] text-[#AD4C64]" : "border-transparent text-[#6F676C]"}`}><UploadSimple size={17} /> Tải tệp</button>
              </div>
              {inputTab === "TEXT" ? (
                <div className="mt-4">
                  <label htmlFor="ai-import-raw-text" className="sr-only">Nội dung đề gốc</label>
                  <textarea id="ai-import-raw-text" rows={18} value={rawText} onChange={(event) => setRawText(event.target.value)} placeholder="Dán bài đọc, hướng dẫn, câu hỏi và đáp án vào đây..." className="w-full resize-y rounded-2xl border border-[#DED7DA] bg-[#FCFBFB] p-4 font-mono text-sm leading-6 focus:border-[#C85F78] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA]" />
                </div>
              ) : (
                <label
                  className={`mt-4 flex min-h-[330px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${dragging ? "border-[#C85F78] bg-[#F7E5EA]" : "border-[#CFC6CA] bg-[#FCFBFB] hover:bg-[#F7F5F4]"}`}
                  onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
                  onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) void readFile(file); }}
                >
                  {readingFile ? <SpinnerGap size={36} className="animate-spin text-[#AD4C64]" /> : <UploadSimple size={38} className="text-[#AD4C64]" />}
                  <span className="mt-4 text-sm font-bold">{readingFile ? "Đang đọc nội dung tệp" : "Thả tệp vào đây hoặc bấm để chọn"}</span>
                  <span className="mt-2 text-xs text-[#6F676C]">PDF, TXT, JSON, Markdown · tối đa 20 MB</span>
                  <input type="file" accept=".pdf,.txt,.json,.md" className="sr-only" disabled={readingFile} onChange={(event) => { const file = event.target.files?.[0]; if (file) void readFile(file); event.target.value = ""; }} />
                  {fileName && rawText && !readingFile && <span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-[#247052]"><CheckCircle size={17} /> {fileName}</span>}
                </label>
              )}
              <footer className="mt-5 flex justify-end"><button type="button" onClick={goToGuidance} disabled={readingFile} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#AD4C64] px-5 text-sm font-bold text-white transition hover:bg-[#943B52] focus:outline-none focus:ring-2 focus:ring-[#C85F78] focus:ring-offset-2 disabled:opacity-50">Tiếp tục <ArrowRight size={18} /></button></footer>
            </section>
          </div>
        )}

        {step === "GUIDANCE" && (
          <div className="mx-auto max-w-4xl rounded-[22px] border border-[#DED7DA] bg-white p-5 sm:p-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#AD4C64]">Bước 2</p>
            <h2 className="mt-1 font-display text-2xl font-bold">Có điều gì AI cần lưu ý?</h2>
            <p className="mt-2 text-sm leading-6 text-[#6F676C]">Phần này không bắt buộc. Dùng khi tài liệu có đáp án riêng, số câu đặc biệt hoặc bố cục dễ nhầm.</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block"><span className="text-xs font-bold">Tên đề gợi ý</span><input value={titleHint} onChange={(event) => setTitleHint(event.target.value)} placeholder="Ví dụ: Cambridge IELTS 18 · Test 1" className="mt-2 min-h-11 w-full rounded-xl border border-[#DED7DA] px-3 text-sm focus:border-[#C85F78] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA]" /></label>
              <label className="block"><span className="text-xs font-bold">URL nguồn tham chiếu</span><input type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://..." className="mt-2 min-h-11 w-full rounded-xl border border-[#DED7DA] px-3 text-sm focus:border-[#C85F78] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA]" /></label>
            </div>
            <label htmlFor="teacher-instructions" className="mt-6 block text-xs font-bold">Hướng dẫn thêm cho AI <span className="font-medium text-[#6F676C]">(không bắt buộc)</span></label>
            <textarea id="teacher-instructions" rows={7} maxLength={2000} value={teacherInstructions} onChange={(event) => setTeacherInstructions(event.target.value)} placeholder="Ví dụ: Câu 1–6 là Matching Headings. Đáp án bắt đầu sau dòng ANSWER KEY..." className="mt-2 w-full resize-y rounded-2xl border border-[#DED7DA] bg-[#FCFBFB] p-4 text-sm leading-6 focus:border-[#C85F78] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA]" />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2">{GUIDANCE_SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => addGuidance(suggestion)} className="min-h-11 rounded-xl border border-[#DED7DA] bg-white px-3 text-[11px] font-semibold text-[#6F676C] transition hover:border-[#C85F78] hover:text-[#AD4C64]">+ {suggestion}</button>)}</div><span className="text-[11px] tabular-nums text-[#6F676C]">{teacherInstructions.length}/2.000</span></div>
            <div className="mt-5 flex gap-2 rounded-xl bg-[#F2ECEE] p-3 text-xs leading-5 text-[#6F676C]"><Info size={18} className="mt-0.5 shrink-0 text-[#AD4C64]" /><p>AI dùng lưu ý để hiểu bố cục, nhưng vẫn phải giữ nguyên nội dung và tuân theo cấu trúc đề của hệ thống.</p></div>
            <details className="mt-5 rounded-2xl border border-[#DED7DA] p-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-xs font-bold text-[#292528]">Tùy chọn nâng cao: bộ máy phân tích <CaretDown size={17} /></summary>
              <fieldset className="mt-3 grid gap-2 sm:grid-cols-2"><legend className="sr-only">Chọn bộ máy phân tích</legend>{PROVIDERS.map((item) => <label key={item.value} className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${provider === item.value ? "border-[#C85F78] bg-[#F7E5EA]" : "border-[#DED7DA]"}`}><input type="radio" name="provider" value={item.value} checked={provider === item.value} onChange={() => setProvider(item.value)} className="mt-1 accent-[#AD4C64]" /><span><span className="block text-xs font-bold">{item.label}</span><span className="mt-1 block text-[11px] leading-5 text-[#6F676C]">{item.description}</span></span></label>)}</fieldset>
            </details>
            <footer className="mt-7 flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={() => setStep("SOURCE")} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-[#6F676C] hover:bg-[#F2ECEE]"><ArrowLeft size={18} /> Quay lại</button><button type="button" onClick={() => void runAiParse()} disabled={parsing} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#AD4C64] px-5 text-sm font-bold text-white transition hover:bg-[#943B52] focus:outline-none focus:ring-2 focus:ring-[#C85F78] focus:ring-offset-2 disabled:opacity-60">{parsing ? <SpinnerGap size={18} className="animate-spin" /> : <Sparkle size={18} />} {parsing ? "AI đang phân tích" : "Phân tích nội dung"}</button></footer>
          </div>
        )}

        {step === "REVIEW" && parseResult && (
          <div className="mx-auto max-w-5xl space-y-5">
            <section className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><CheckCircle size={23} className="mt-0.5 shrink-0 text-[#247052]" /><div><h2 className="font-display text-lg font-bold text-emerald-950">Đã phân tích xong</h2><p className="mt-1 text-sm leading-6 text-emerald-900/80">Hãy kiểm tra cấu trúc bên dưới. Bạn có thể quay lại để bổ sung lưu ý và phân tích lại.</p></div></div><span className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#247052]">{parseResult.questionCount} câu hỏi</span></div></section>
            {parseResult.warnings.length > 0 && <section className="rounded-[22px] border border-amber-200 bg-amber-50 p-5"><div className="flex items-center gap-2 text-sm font-bold text-amber-950"><WarningCircle size={20} /> Điểm cần kiểm tra</div><ul className="mt-3 space-y-2 pl-6 text-xs leading-5 text-amber-900">{parseResult.warnings.map((warning) => <li key={warning} className="list-disc">{warning}</li>)}</ul></section>}
            <section className="rounded-[22px] border border-[#DED7DA] bg-white p-5"><label htmlFor="parsed-test-title" className="text-xs font-bold">Tên đề thi</label><input id="parsed-test-title" value={parseResult.title} onChange={(event) => setParseResult((current) => current ? { ...current, title: event.target.value } : current)} className="mt-2 min-h-11 w-full rounded-xl border border-[#DED7DA] px-3 text-sm font-semibold focus:border-[#C85F78] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA]" /></section>
            <AiImportStructurePreview skill={parseResult.skill} builderContent={parseResult.builderContent} questionCount={parseResult.questionCount} />
            <details className="rounded-[22px] border border-[#DED7DA] bg-white p-4"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-xs font-bold">Dữ liệu kỹ thuật <CaretDown size={17} /></summary><pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-[#211E20] p-4 text-[11px] leading-5 text-emerald-300">{JSON.stringify(parseResult.builderContent, null, 2)}</pre></details>
            <footer className="flex flex-wrap items-center justify-between gap-3 pb-3"><button type="button" onClick={() => setStep("GUIDANCE")} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-[#6F676C] hover:bg-[#F2ECEE]"><ArrowLeft size={18} /> Bổ sung lưu ý</button><button type="button" onClick={() => { setError(""); setStep("FINISH"); scrollFlowToTop(); }} disabled={!parseResult.title.trim()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#AD4C64] px-5 text-sm font-bold text-white hover:bg-[#943B52] disabled:opacity-50">Tiếp tục <ArrowRight size={18} /></button></footer>
          </div>
        )}

        {step === "FINISH" && parseResult && (
          <div className="mx-auto max-w-5xl space-y-5">
            <section className="rounded-[22px] border border-[#DED7DA] bg-white p-5 sm:p-6"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#AD4C64]">Bước 4</p><h2 className="mt-1 font-display text-2xl font-bold">Hoàn tất bản nháp</h2><p className="mt-2 text-sm leading-6 text-[#6F676C]">Bạn có thể thêm ảnh minh họa, xem đề như học viên, rồi tạo bản nháp để tiếp tục chỉnh sửa trong Test Builder.</p><dl className="mt-5 grid gap-3 rounded-2xl bg-[#F7F5F4] p-4 sm:grid-cols-3"><div><dt className="text-[11px] font-bold text-[#6F676C]">Tên đề</dt><dd className="mt-1 text-sm font-bold">{parseResult.title}</dd></div><div><dt className="text-[11px] font-bold text-[#6F676C]">Cấu trúc</dt><dd className="mt-1 text-sm font-bold">{sectionCount(builderContent)} phần · {parseResult.questionCount} câu</dd></div><div><dt className="text-[11px] font-bold text-[#6F676C]">Trạng thái sau khi lưu</dt><dd className="mt-1 text-sm font-bold text-[#AD4C64]">Bản nháp</dd></div></dl></section>
            <AiImportCoverImageField value={coverImage} onChange={(value) => { setCoverImage(value); setError(""); }} />
            <section className="rounded-[22px] border border-[#DED7DA] bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-display text-base font-bold">Kiểm tra lần cuối</h2><p className="mt-1 text-xs leading-5 text-[#6F676C]">Mở bản xem trước để kiểm tra giao diện học viên trước khi lưu.</p></div><button type="button" onClick={openPreview} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#AD4C64] px-4 text-xs font-bold text-[#AD4C64] hover:bg-[#F7E5EA]"><Eye size={18} /> Xem trước như học viên</button></div></section>
            <footer className="flex flex-wrap items-center justify-between gap-3 pb-3"><button type="button" onClick={() => setStep("REVIEW")} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-[#6F676C] hover:bg-[#F2ECEE]"><ArrowLeft size={18} /> Quay lại kiểm tra</button><button type="button" onClick={() => void createDraft()} disabled={creating || !parseResult.title.trim()} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#247052] px-6 text-sm font-bold text-white transition hover:bg-[#1D5B43] focus:outline-none focus:ring-2 focus:ring-[#247052] focus:ring-offset-2 disabled:opacity-60">{creating ? <SpinnerGap size={19} className="animate-spin" /> : <ShieldCheck size={19} />} {creating ? "Đang tạo bản nháp" : "Tạo bản nháp và tiếp tục chỉnh sửa"}</button></footer>
          </div>
        )}
      </main>
      {showVisualPreview && previewTestItem && <TestPreviewModal test={previewTestItem} onClose={() => setShowVisualPreview(false)} />}
    </div>
  );
}
