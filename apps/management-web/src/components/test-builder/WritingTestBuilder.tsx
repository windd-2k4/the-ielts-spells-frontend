import {
  ArrowLeft, CheckCircle, Eye, FloppyDisk, NotePencil,
  ShieldCheck, SpinnerGap, Trash, UploadSimple, WarningCircle,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import type { MediaAsset, TestBankItem, WritingTaskSection } from "../../library-types";
import { apiFetch, apiUpload } from "../../lib/api";
import AuthenticatedMediaImage from "./AuthenticatedMediaImage";
import PublishValidationModal from "./PublishValidationModal";
import ReadingRichTextEditor from "./ReadingRichTextEditor";
import TestPreviewModal from "./TestPreviewModal";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}`;
}

function emptyTask(taskNo: 1 | 2): WritingTaskSection {
  return {
    id: newId("writing-task"),
    taskNo,
    title: `Writing Task ${taskNo}`,
    promptHtml: "",
    suggestedTimeMinutes: taskNo === 1 ? 20 : 40,
    minWords: taskNo === 1 ? 150 : 250,
    responseMode: "STRUCTURED",
    rubric: {
      taskAchievementWeight: 25,
      coherenceCohesionWeight: 25,
      lexicalResourceWeight: 25,
      grammaticalAccuracyWeight: 25,
      notes: "",
    },
    sampleBand8Answer: "",
    teacherNotes: "",
    enableAiAssessment: false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeTask(value: unknown, taskNo: 1 | 2): WritingTaskSection {
  const fallback = emptyTask(taskNo);
  if (!isRecord(value)) return fallback;
  const rubric = isRecord(value.rubric) ? value.rubric : {};
  return {
    ...fallback,
    id: typeof value.id === "string" ? value.id : fallback.id,
    taskNo,
    title: typeof value.title === "string" ? value.title : fallback.title,
    promptHtml: typeof value.promptHtml === "string" ? value.promptHtml : "",
    imageUrl: typeof value.imageUrl === "string" ? value.imageUrl : undefined,
    imageAssetId: typeof value.imageAssetId === "string" ? value.imageAssetId : undefined,
    imageFilename: typeof value.imageFilename === "string" ? value.imageFilename : undefined,
    imageAltText: typeof value.imageAltText === "string" ? value.imageAltText : undefined,
    suggestedTimeMinutes: typeof value.suggestedTimeMinutes === "number" ? value.suggestedTimeMinutes : fallback.suggestedTimeMinutes,
    minWords: typeof value.minWords === "number" ? value.minWords : fallback.minWords,
    responseMode: value.responseMode === "FREEFORM" ? "FREEFORM" : "STRUCTURED",
    rubric: {
      taskAchievementWeight: typeof rubric.taskAchievementWeight === "number" ? rubric.taskAchievementWeight : 25,
      coherenceCohesionWeight: typeof rubric.coherenceCohesionWeight === "number" ? rubric.coherenceCohesionWeight : 25,
      lexicalResourceWeight: typeof rubric.lexicalResourceWeight === "number" ? rubric.lexicalResourceWeight : 25,
      grammaticalAccuracyWeight: typeof rubric.grammaticalAccuracyWeight === "number" ? rubric.grammaticalAccuracyWeight : 25,
      notes: typeof rubric.notes === "string" ? rubric.notes : "",
    },
    sampleBand8Answer: typeof value.sampleBand8Answer === "string" ? value.sampleBand8Answer : "",
    teacherNotes: typeof value.teacherNotes === "string" ? value.teacherNotes : "",
    enableAiAssessment: Boolean(value.enableAiAssessment),
  };
}

function normalizeTasks(test: TestBankItem): WritingTaskSection[] {
  const content = test.builderContent ?? {};
  if (Array.isArray(content.tasks) && content.tasks.length) {
    return content.tasks
      .filter(isRecord)
      .map((task, index) => normalizeTask(task, task.taskNo === 2 || index === 1 ? 2 : 1));
  }

  const preset = typeof content.sectionsPreset === "string" ? content.sectionsPreset : "TASK_1";
  const taskNumbers: Array<1 | 2> = preset === "FULL" ? [1, 2] : [preset === "TASK_2" ? 2 : 1];
  return taskNumbers.map((taskNo) => ({
    ...emptyTask(taskNo),
    promptHtml: typeof content.promptText === "string" ? content.promptText : "",
    minWords: typeof content.minWords === "number" ? content.minWords : taskNo === 1 ? 150 : 250,
    suggestedTimeMinutes: typeof content.timeMinutes === "number" ? content.timeMinutes : taskNo === 1 ? 20 : 40,
    sampleBand8Answer: typeof content.sampleAnswer === "string" ? content.sampleAnswer : "",
  }));
}

function plainText(html: string) {
  if (typeof document === "undefined") return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const container = document.createElement("div");
  container.innerHTML = html;
  return (container.textContent ?? "").replace(/\s+/g, " ").trim();
}

function TaskImageField({ task, onChange }: { task: WritingTaskSection; onChange: (task: WritingTaskSection) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn đúng tệp ảnh.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Ảnh không được vượt quá 10 MB.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const asset = await apiUpload<MediaAsset>("/admin/library/media", body);
      if (asset.mimeType !== "IMAGE") throw new Error("Tệp tải lên không được nhận diện là hình ảnh.");
      onChange({
        ...task,
        imageAssetId: asset.id,
        imageUrl: asset.fileUrl,
        imageFilename: asset.filename,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tải ảnh lên.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-2xl bg-[#F2ECEE] p-4" aria-labelledby="writing-image-title">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = "";
        }}
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="writing-image-title" className="text-sm font-bold text-[#292528]">Hình minh họa Task 1</h3>
          <p className="mt-1 text-xs leading-5 text-[#6F676C]">Biểu đồ, bản đồ hoặc quy trình. Hỗ trợ PNG, JPG, WebP và GIF, tối đa 10 MB.</p>
        </div>
        <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#AD4C64] bg-white px-3 text-xs font-bold text-[#AD4C64] transition hover:-translate-y-0.5 hover:bg-[#F7E5EA] focus:outline-none focus:ring-2 focus:ring-[#C85F78] disabled:opacity-50">
          {uploading ? <SpinnerGap size={17} className="animate-spin" /> : <UploadSimple size={17} />}
          {task.imageUrl ? "Thay ảnh" : "Tải ảnh lên"}
        </button>
      </div>
      {error && <p role="alert" className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-[#B42335]"><WarningCircle size={16} />{error}</p>}
      {task.imageUrl && (
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold" title={task.imageFilename}>{task.imageFilename || "Ảnh đề bài"}</p>
            <label className="mt-3 block text-xs font-semibold text-[#6F676C]">
              Mô tả ảnh cho học viên
              <textarea value={task.imageAltText ?? ""} onChange={(event) => onChange({ ...task, imageAltText: event.target.value })} rows={3} className="mt-1.5 w-full resize-y rounded-xl border border-[#DED7DA] bg-white p-3 text-sm text-[#292528] focus:border-[#C85F78] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA]" placeholder="Mô tả thông tin chính của biểu đồ hoặc hình ảnh" />
            </label>
            <button type="button" onClick={() => onChange({ ...task, imageAssetId: undefined, imageUrl: undefined, imageFilename: undefined, imageAltText: undefined })} className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-[#B42335] transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-100"><Trash size={15} /> Gỡ ảnh khỏi đề</button>
          </div>
          <AuthenticatedMediaImage fileUrl={task.imageUrl} alt={task.imageAltText || "Ảnh minh họa đề Writing Task 1"} className="max-h-60 w-full rounded-xl bg-white object-contain p-2" />
        </div>
      )}
    </section>
  );
}

export default function WritingTestBuilder() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const { roles } = useAuth();
  const [test, setTest] = useState<TestBankItem | null>(null);
  const [title, setTitle] = useState("");
  const [tasks, setTasks] = useState<WritingTaskSection[]>([]);
  const [activeTaskId, setActiveTaskId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const canPublish = roles.includes("admin");
  const workflowStatus = canPublish ? "PUBLISHED" : "IN_REVIEW";
  const workflowLabel = canPublish ? "Xuất bản" : "Gửi duyệt";

  useEffect(() => {
    if (!testId) {
      setError("Không tìm thấy mã đề Writing.");
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    void apiFetch<TestBankItem>(`/admin/test-bank/${testId}`)
      .then((record) => {
        if (!active) return;
        const normalized = normalizeTasks(record);
        setTest(record);
        setTitle(record.title);
        setTasks(normalized);
        setActiveTaskId(normalized[0]?.id ?? "");
      })
      .catch((reason: Error) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [testId]);

  const activeTask = tasks.find((task) => task.id === activeTaskId) ?? tasks[0];
  const durationMinutes = useMemo(() => tasks.reduce((total, task) => total + Math.max(1, task.suggestedTimeMinutes), 0), [tasks]);
  const draftTest = useMemo<TestBankItem | null>(() => test ? {
    ...test,
    title,
    sectionsCount: tasks.length,
    totalQuestions: tasks.length,
    durationMinutes,
    builderContent: {
      ...(test.builderContent ?? {}),
      format: tasks.length === 2 ? "FULL" : `TASK_${tasks[0]?.taskNo ?? 1}`,
      sectionsPreset: tasks.length === 2 ? "FULL" : `TASK_${tasks[0]?.taskNo ?? 1}`,
      tasks,
    },
  } : null, [durationMinutes, tasks, test, title]);

  function updateTask(next: WritingTaskSection) {
    setTasks((current) => current.map((task) => task.id === next.id ? next : task));
  }

  async function saveDraft() {
    if (saving || !testId || !test || test.status !== "DRAFT" || !draftTest) return null;
    setSaving(true);
    setError("");
    try {
      const saved = await apiFetch<TestBankItem>(`/admin/test-bank/${testId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: draftTest.title,
          description: null,
          skill: "WRITING",
          testType: draftTest.testType,
          durationMinutes: draftTest.durationMinutes,
          version: test.version,
          tags: test.tags,
          draftRevision: test.draftRevision,
          builderContent: draftTest.builderContent,
        }),
      });
      setTest(saved);
      setLastSavedAt(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
      return saved;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu đề Writing.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (loading || !test || test.status !== "DRAFT") return undefined;
    const timeout = window.setTimeout(() => { void saveDraft(); }, 1600);
    return () => window.clearTimeout(timeout);
  }, [loading, tasks, title]);

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#F7F5F4]"><p className="flex items-center gap-2 text-sm font-semibold text-[#6F676C]"><SpinnerGap size={20} className="animate-spin" /> Đang tải đề Writing...</p></div>;
  if (!test || !activeTask || !draftTest) return <div className="grid min-h-screen place-items-center bg-[#F7F5F4] p-6"><div className="max-w-md text-center"><WarningCircle size={32} className="mx-auto text-[#B42335]" /><h1 className="mt-3 font-display text-xl font-bold">Không thể mở Writing Builder</h1><p className="mt-2 text-sm text-[#6F676C]">{error || "Đề chưa có cấu hình Writing hợp lệ."}</p><Link to="/test-bank" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#AD4C64] px-4 text-sm font-bold text-white">Quay lại ngân hàng đề</Link></div></div>;
  if (test.status !== "DRAFT") return <div className="grid min-h-screen place-items-center bg-[#F7F5F4] p-6"><div className="max-w-md rounded-2xl border border-[#DED7DA] bg-white p-7 text-center shadow-sm"><WarningCircle size={32} className="mx-auto text-[#AD4C64]" /><h1 className="mt-3 font-display text-xl font-bold">Đề không ở chế độ soạn thảo</h1><p className="mt-2 text-sm leading-6 text-[#6F676C]">Đề đang chờ duyệt hoặc đã xuất bản. Hãy quay lại ngân hàng đề để xem trước hoặc tạo bản chỉnh sửa.</p><Link to="/test-bank" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#AD4C64] px-4 text-sm font-bold text-white">Quay lại ngân hàng đề</Link></div></div>;

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-[#F7F5F4] text-[#292528]">
      <header className="z-30 flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#DED7DA] bg-white px-4 py-2 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/test-bank" aria-label="Quay lại ngân hàng đề" className="grid size-11 shrink-0 place-items-center rounded-xl text-[#6F676C] transition hover:bg-[#F2ECEE] hover:text-[#AD4C64] focus:outline-none focus:ring-2 focus:ring-[#C85F78]"><ArrowLeft size={19} /></Link>
          <span className="hidden h-6 w-px bg-[#DED7DA] sm:block" />
          <div className="min-w-0">
            <input value={title} onChange={(event) => setTitle(event.target.value)} aria-label="Tên đề Writing" className="w-full min-w-0 border-b border-transparent bg-transparent font-display text-base font-bold focus:border-[#C85F78] focus:outline-none sm:min-w-80" />
            <p className="mt-0.5 text-[11px] text-[#6F676C]">Writing Builder • {tasks.length === 2 ? "Full test" : `Task ${tasks[0]?.taskNo}`} • {durationMinutes} phút</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastSavedAt && <span className="hidden items-center gap-1 text-[11px] font-semibold text-[#247052] xl:flex"><CheckCircle size={15} /> Đã lưu {lastSavedAt}</span>}
          <button type="button" onClick={() => void saveDraft()} disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#DED7DA] bg-white px-3 text-xs font-bold transition hover:-translate-y-0.5 hover:border-[#C85F78] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA] disabled:opacity-50"><FloppyDisk size={17} />{saving ? "Đang lưu" : "Lưu nháp"}</button>
          <button type="button" onClick={() => setShowPreview(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#AD4C64] px-3 text-xs font-bold text-[#AD4C64] transition hover:-translate-y-0.5 hover:bg-[#F7E5EA] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA]"><Eye size={17} /> Xem trước</button>
          <button type="button" onClick={() => { void saveDraft().then((saved) => { if (saved) setShowValidation(true); }); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#AD4C64] px-4 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#943B52] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA]"><ShieldCheck size={17} /> {workflowLabel}</button>
        </div>
      </header>

      <nav aria-label="Các task Writing" className="flex h-12 shrink-0 items-end gap-1 overflow-x-auto border-b border-[#DED7DA] bg-[#F2ECEE] px-5">
        {tasks.map((task) => <button key={task.id} type="button" onClick={() => setActiveTaskId(task.id)} aria-current={task.id === activeTask.id ? "page" : undefined} className={`min-h-10 shrink-0 rounded-t-xl px-5 text-xs font-bold transition ${task.id === activeTask.id ? "bg-white text-[#AD4C64]" : "text-[#6F676C] hover:bg-white/60"}`}>Task {task.taskNo} <span className="ml-1 font-medium">{task.taskNo === 1 ? "Report" : "Essay"}</span></button>)}
      </nav>

      {error && <div role="alert" className="flex shrink-0 items-center gap-2 border-b border-rose-200 bg-rose-50 px-5 py-2 text-xs font-semibold text-[#B42335]"><WarningCircle size={16} />{error}</div>}

      <main className="grid min-h-0 flex-1 overflow-y-auto xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] xl:overflow-hidden">
        <section className="space-y-6 p-5 lg:p-7 xl:overflow-y-auto xl:border-r xl:border-[#DED7DA]" aria-labelledby="writing-source-title">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#AD4C64]">Nội dung hiển thị cho học viên</p>
            <div className="mt-2 flex flex-wrap items-end gap-4">
              <label className="min-w-0 flex-1"><span id="writing-source-title" className="mb-1.5 block text-xs font-semibold text-[#6F676C]">Tiêu đề Task {activeTask.taskNo}</span><input value={activeTask.title} onChange={(event) => updateTask({ ...activeTask, title: event.target.value })} className="min-h-12 w-full rounded-xl border border-[#DED7DA] bg-white px-4 font-display text-base font-bold focus:border-[#C85F78] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA]" /></label>
            </div>
          </div>

          <div>
            <div className="mb-3"><h2 className="font-display text-lg font-bold">Đề bài và hướng dẫn</h2><p className="mt-1 text-xs text-[#6F676C]">Nội dung này xuất hiện ở cột trái trong màn hình làm bài.</p></div>
            <ReadingRichTextEditor passageId={activeTask.id} value={activeTask.promptHtml} onChange={(promptHtml) => updateTask({ ...activeTask, promptHtml })} editorLabel={`Đề bài Writing Task ${activeTask.taskNo}`} placeholder="Nhập hoặc dán đề bài Writing bằng tiếng Anh..." minHeight={250} />
          </div>

          {activeTask.taskNo === 1 && <TaskImageField task={activeTask} onChange={updateTask} />}

          <section className="rounded-[22px] bg-white p-5 shadow-[0_18px_45px_rgba(105,76,87,0.08)]" aria-labelledby="sample-answer-title">
            <div className="mb-4 flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F7E5EA] text-[#AD4C64]"><NotePencil size={20} /></span><div><h2 id="sample-answer-title" className="font-display text-base font-bold">Bài mẫu và ghi chú giáo viên</h2><p className="mt-1 text-xs leading-5 text-[#6F676C]">Chỉ dùng trong chế độ xem lại hoặc tài liệu hướng dẫn, không hiển thị khi học viên đang làm bài.</p></div></div>
            <ReadingRichTextEditor passageId={`${activeTask.id}-sample`} value={activeTask.sampleBand8Answer ?? ""} onChange={(sampleBand8Answer) => updateTask({ ...activeTask, sampleBand8Answer })} editorLabel={`Bài mẫu Writing Task ${activeTask.taskNo}`} placeholder="Nhập bài mẫu tham khảo..." minHeight={220} />
            <label className="mt-4 block text-xs font-semibold text-[#6F676C]">Ghi chú nội bộ cho giáo viên<textarea value={activeTask.teacherNotes ?? ""} onChange={(event) => updateTask({ ...activeTask, teacherNotes: event.target.value })} rows={3} className="mt-1.5 w-full resize-y rounded-xl border border-[#DED7DA] p-3 text-sm text-[#292528] focus:border-[#C85F78] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA]" placeholder="Lưu ý khi giao bài hoặc chấm bài..." /></label>
          </section>
        </section>

        <aside className="space-y-5 bg-white p-5 lg:p-7 xl:overflow-y-auto" aria-labelledby="writing-config-title">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#AD4C64]">Cấu hình bài làm</p><h2 id="writing-config-title" className="mt-1 font-display text-xl font-bold">Task {activeTask.taskNo}</h2><p className="mt-1 text-sm leading-6 text-[#6F676C]">Thiết lập cách học viên nhập bài, thời lượng và tiêu chí hoàn thành.</p></div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <label className="text-xs font-semibold text-[#6F676C]">Thời gian gợi ý<input type="number" min={1} max={180} value={activeTask.suggestedTimeMinutes} onChange={(event) => updateTask({ ...activeTask, suggestedTimeMinutes: Number(event.target.value) || 1 })} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#DED7DA] px-3 text-sm text-[#292528] focus:border-[#C85F78] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA]" /></label>
            <label className="text-xs font-semibold text-[#6F676C]">Số từ tối thiểu<input type="number" min={1} max={2000} value={activeTask.minWords} onChange={(event) => updateTask({ ...activeTask, minWords: Number(event.target.value) || 1 })} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#DED7DA] px-3 text-sm text-[#292528] focus:border-[#C85F78] focus:outline-none focus:ring-2 focus:ring-[#F7E5EA]" /></label>
          </div>

          <fieldset><legend className="text-xs font-semibold text-[#6F676C]">Bố cục vùng nhập bài</legend><div className="mt-2 grid gap-2"><label className={`cursor-pointer rounded-xl border p-3 transition ${activeTask.responseMode !== "FREEFORM" ? "border-[#C85F78] bg-[#F7E5EA]" : "border-[#DED7DA]"}`}><input type="radio" name={`response-mode-${activeTask.id}`} checked={activeTask.responseMode !== "FREEFORM"} onChange={() => updateTask({ ...activeTask, responseMode: "STRUCTURED" })} className="accent-[#C85F78]" /><span className="ml-2 text-sm font-bold">Chia theo từng phần</span><p className="ml-6 mt-1 text-xs leading-5 text-[#6F676C]">Task 1 gồm Introduction, Overview, Body 1, Body 2. Task 2 gồm Introduction, Body 1, Body 2, Conclusion.</p></label><label className={`cursor-pointer rounded-xl border p-3 transition ${activeTask.responseMode === "FREEFORM" ? "border-[#C85F78] bg-[#F7E5EA]" : "border-[#DED7DA]"}`}><input type="radio" name={`response-mode-${activeTask.id}`} checked={activeTask.responseMode === "FREEFORM"} onChange={() => updateTask({ ...activeTask, responseMode: "FREEFORM" })} className="accent-[#C85F78]" /><span className="ml-2 text-sm font-bold">Một trình soạn thảo</span><p className="ml-6 mt-1 text-xs leading-5 text-[#6F676C]">Phù hợp giao diện thi thật, học viên tự tổ chức toàn bộ bài viết.</p></label></div></fieldset>

          <section className="rounded-2xl bg-[#F2ECEE] p-4"><h3 className="text-sm font-bold">Tiêu chí chấm IELTS</h3><div className="mt-3 space-y-2 text-xs text-[#6F676C]"><p className="flex justify-between"><span>Task Achievement hoặc Task Response</span><strong className="text-[#292528]">25%</strong></p><p className="flex justify-between"><span>Coherence and Cohesion</span><strong className="text-[#292528]">25%</strong></p><p className="flex justify-between"><span>Lexical Resource</span><strong className="text-[#292528]">25%</strong></p><p className="flex justify-between"><span>Grammatical Range and Accuracy</span><strong className="text-[#292528]">25%</strong></p></div></section>

          <label className="flex items-start justify-between gap-4 rounded-2xl border border-[#DED7DA] p-4"><span><strong className="block text-sm">Cho phép AI hỗ trợ chấm</strong><span className="mt-1 block text-xs leading-5 text-[#6F676C]">Lưu cấu hình để dịch vụ đánh giá sử dụng khi đã được kết nối.</span></span><input type="checkbox" checked={Boolean(activeTask.enableAiAssessment)} onChange={(event) => updateTask({ ...activeTask, enableAiAssessment: event.target.checked })} className="mt-1 size-5 accent-[#C85F78]" /></label>

          <section className="rounded-2xl border border-[#DED7DA] p-4"><h3 className="text-sm font-bold">Kiểm tra nhanh</h3><ul className="mt-3 space-y-2 text-xs"><li className={`flex items-center gap-2 ${plainText(activeTask.promptHtml) ? "text-[#247052]" : "text-[#B42335]"}`}>{plainText(activeTask.promptHtml) ? <CheckCircle size={16} /> : <WarningCircle size={16} />} Đã nhập đề bài</li><li className={`flex items-center gap-2 ${activeTask.taskNo === 2 || activeTask.imageUrl ? "text-[#247052]" : "text-[#B42335]"}`}>{activeTask.taskNo === 2 || activeTask.imageUrl ? <CheckCircle size={16} /> : <WarningCircle size={16} />} {activeTask.taskNo === 1 ? "Đã có hình minh họa" : "Task 2 không yêu cầu hình"}</li><li className={`flex items-center gap-2 ${activeTask.minWords > 0 ? "text-[#247052]" : "text-[#B42335]"}`}>{activeTask.minWords > 0 ? <CheckCircle size={16} /> : <WarningCircle size={16} />} Đã đặt số từ tối thiểu</li></ul></section>
        </aside>
      </main>

      {showPreview && <TestPreviewModal test={draftTest} onClose={() => setShowPreview(false)} />}
      {showValidation && <PublishValidationModal test={draftTest} actionLabel={`Xác nhận ${workflowLabel.toLowerCase()}`} onClose={() => setShowValidation(false)} onPublished={async () => { const saved = await saveDraft(); if (!saved || !testId) return; await apiFetch(`/admin/test-bank/${testId}/status`, { method: "PATCH", body: JSON.stringify({ status: workflowStatus, draftRevision: saved.draftRevision }) }); navigate("/test-bank"); }} />}
    </div>
  );
}
