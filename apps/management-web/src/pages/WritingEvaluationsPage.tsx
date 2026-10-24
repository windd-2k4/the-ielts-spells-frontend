import {
  ArrowClockwise, Brain, CaretDown, CaretLeft, CaretRight, ChartBar, Check, CheckCircle, CircleNotch, ClipboardText, Copy,
  DotsSixVertical, FileText, FloppyDisk, Infinity as InfinityIcon, MagnifyingGlass, Microphone, Minus, NotePencil,
  PaperPlaneTilt, Plus, ShieldCheck, Sparkle, UsersThree, WarningCircle,
} from "@phosphor-icons/react";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import AuthenticatedMediaImage from "../components/test-builder/AuthenticatedMediaImage";
import { apiFetch } from "../lib/api";

const WritingWordReviewModal = lazy(() =>
  import("../components/writing/WritingWordReviewModal").then((module) => ({
    default: module.WritingWordReviewModal,
  })),
);

type Criterion = { aiBand: number | null; teacherBand: number | null; aiFeedback: string | null; teacherFeedback?: string | null };
type TeacherAnnotation = { id: string | null; start: number; end: number; selectedText: string | null; replacement: string | null; comment: string | null; criterion: string | null; kind: "COMMENT" | "REPLACE" | "HIGHLIGHT" | null; severity: "SUGGESTION" | "ERROR" | "MAJOR" | null };
type WritingEvaluation = {
  id: string; studentName: string; studentCode: string; testTitle: string; taskKey: string; taskType: string; essayText: string;
  attemptOrigin: "ASSIGNMENT" | "SELF_PRACTICE"; courseCode: string | null; courseName: string | null; courseSkillPair: string | null;
  status: string; teacherStatus: string; overallBandAi: number | null; overallBandTeacher: number | null;
  criteria: Record<string, Criterion>; aiStrengths: string[]; aiImprovements: string[];
  strengths: string[]; improvements: string[]; errorMessage: string | null; createdAt: string;
  teacherEditedText: string | null; teacherEditedHtml: string | null; teacherAnnotations: TeacherAnnotation[]; teacherRevision: number;
  taskContext: { promptHtml?: string; imageUrl?: string; imageAssetId?: string; imageAltText?: string };
};
type PageResult<T> = { content: T[]; page: number; size: number; totalElements: number; totalPages: number; first: boolean; last: boolean };
type WritingFilterOptions = {
  totalCount: number; selfPracticeCount: number; courseCount: number;
  courses: Array<{ id: string; code: string; name: string; status: string; studentCount: number; evaluationCount: number; awaitingTeacherCount: number }>;
};
type CalibrationMetric = { sampleSize: number; meanAbsoluteError: number | null; withinHalfBandPercent: number | null; withinOneBandPercent: number | null };
type WritingCalibration = CalibrationMetric & { rubricVersion: string; criteria: Record<string, CalibrationMetric> };
type SpeakingEvaluation = {
  id: string; studentName: string; testTitle: string; questionKey: string; transcript: string; audioUrl: string | null;
  segments: Array<{ questionKey: string; audioUrl: string | null; transcript: string | null }>;
  aiStatus: string; overallBandAi: number | null; criteria: Record<string, Criterion>;
  aiStrengths: string[]; aiImprovements: string[]; teacherStatus: string; overallBandTeacher: number | null;
  teacherFeedback: string | null; teacherStrengths: string[]; teacherImprovements: string[]; createdAt: string;
};
type EntitlementMode = "DISABLED" | "LIMITED" | "UNLIMITED";
type Entitlement = {
  studentId: string; studentCode: string; studentName: string; email: string | null; mode: EntitlementMode;
  monthlyLimit: number | null; usedThisMonth: number; activeFrom: string | null; expiresAt: string | null;
  source: string | null; note: string | null;
};

const writingLabels: Record<string, string> = {
  task_achievement: "Task Achievement", task_response: "Task Response", coherence_cohesion: "Coherence & Cohesion",
  lexical_resource: "Lexical Resource", grammatical_range_accuracy: "Grammar Range & Accuracy",
};
const speakingLabels: Record<string, string> = {
  fluency_coherence: "Fluency & Coherence", lexical_resource: "Lexical Resource",
  grammatical_range_accuracy: "Grammar Range & Accuracy", pronunciation: "Pronunciation",
};
const aiStatuses: Record<string, string> = {
  QUEUED: "Chờ AI", PROCESSING: "AI đang chấm", AI_COMPLETED: "AI đã chấm",
  FAILED: "AI chấm lỗi", NOT_ELIGIBLE: "Không dùng AI",
};
const teacherStatuses: Record<string, string> = { AVAILABLE: "Chưa chấm", REVIEWED: "Đã lưu", PUBLISHED: "Đã công bố" };

export function WritingEvaluationsPage() {
  const { roles } = useAuth();
  const canManageAi = roles.includes("admin");
  const [tab, setTab] = useState<"overview" | "writing" | "speaking" | "access">("writing");

  return <div className="mx-auto max-w-[1540px] space-y-3">
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-outline-variant/55 bg-surface-container-lowest px-3 sm:px-4">
      <div className="shrink-0 py-3">
        <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-primary">Assessment workspace</p>
        <h1 className="font-display text-xl font-extrabold leading-tight">Chấm Writing & Speaking</h1>
      </div>
      <nav className="order-3 flex w-full gap-1 overflow-x-auto border-t border-outline-variant/55 sm:order-none sm:w-auto sm:border-l sm:border-t-0 sm:pl-3" aria-label="Loại bài chấm">
        <Tab active={tab === "overview"} onClick={() => setTab("overview")} icon={<ChartBar/>}>Tổng quan</Tab>
        <Tab active={tab === "writing"} onClick={() => setTab("writing")} icon={<NotePencil/>}>Writing</Tab>
        <Tab active={tab === "speaking"} onClick={() => setTab("speaking")} icon={<Microphone/>}>Speaking</Tab>
        {canManageAi ? <Tab active={tab === "access"} onClick={() => setTab("access")} icon={<UsersThree/>}>Quyền AI</Tab> : null}
      </nav>
      <div className="ml-auto hidden items-center gap-2 rounded-xl bg-surface-container-low px-3 py-2 text-xs font-bold text-on-surface-variant xl:flex"><ShieldCheck size={18} className="text-primary"/> Điểm giáo viên hiện sau khi công bố</div>
    </header>
    {tab === "overview" ? <OverviewPanel/> : tab === "writing" ? <WritingPanel/> : tab === "speaking" ? <SpeakingPanel/> : <EntitlementsPanel/>}
  </div>;
}

function Tab({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`my-1.5 inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-xs font-black transition-all duration-150 ${
        active
          ? "bg-gradient-to-r from-[#894c5b] to-[#6d3544] text-white shadow-md shadow-[#894c5b]/25 ring-1 ring-white/20 scale-[1.02]"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <span className={active ? "text-rose-200" : "text-slate-400"}>{icon}</span>
      <span>{children}</span>
    </button>
  );
}

function OverviewPanel() {
  const [value, setValue] = useState<WritingCalibration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() {
    setLoading(true); setError("");
    try { setValue(await apiFetch<WritingCalibration>("/admin/writing-evaluations/calibration")); }
    catch (reason) { setError(message(reason, "Không tải được tổng quan đánh giá.")); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  const criteria = value ? Object.entries(value.criteria) : [];
  return <section className="overflow-hidden rounded-2xl border border-outline-variant/55 bg-surface-container-lowest">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/55 px-5 py-4">
      <div><h2 className="font-display text-xl font-extrabold">Tổng quan chất lượng chấm</h2><p className="mt-1 text-sm text-on-surface-variant">Theo dõi mức đồng thuận giữa AI và điểm giáo viên đã công bố.</p></div>
      <button type="button" disabled={loading} onClick={() => void load()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-outline-variant bg-surface px-3 text-sm font-bold"><ArrowClockwise className={loading ? "animate-spin" : ""}/> Làm mới</button>
    </div>
    {error ? <div className="px-5"><ErrorNotice value={error}/></div> : null}
    {loading ? <Loading/> : <div className="p-5">
      <div className="grid gap-px overflow-hidden rounded-2xl border border-outline-variant/55 bg-outline-variant/55 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewMetric label="Bài đã đối chiếu" value={String(value?.sampleSize ?? 0)} note="Có cả điểm AI và giáo viên"/>
        <OverviewMetric label="Sai số tuyệt đối TB" value={value?.meanAbsoluteError?.toFixed(2) ?? "Chưa có"} note="Càng thấp càng ổn định"/>
        <OverviewMetric label="Lệch tối đa 0.5 band" value={percent(value?.withinHalfBandPercent ?? null)} note="Mức đồng thuận gần"/>
        <OverviewMetric label="Lệch tối đa 1.0 band" value={percent(value?.withinOneBandPercent ?? null)} note="Mức đồng thuận chấp nhận"/>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2"><h3 className="font-display text-lg font-extrabold">Độ lệch theo tiêu chí</h3><span className="text-xs font-semibold text-on-surface-variant">Rubric {value?.rubricVersion ?? "IELTS Writing hiện hành"}</span></div>
      {criteria.length === 0 || value?.sampleSize === 0 ? <Empty text="Chưa đủ bài có cả điểm AI và điểm giáo viên đã công bố."/> : <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {criteria.map(([key, metric]) => <section key={key} className="rounded-2xl border border-outline-variant/55 p-4">
          <div className="flex items-start justify-between gap-4"><div><strong className="text-sm">{writingLabels[key] ?? key}</strong><p className="mt-1 text-xs text-on-surface-variant">{metric.sampleSize} bài đối chiếu</p></div><span className="font-display text-2xl font-extrabold text-primary">{metric.meanAbsoluteError?.toFixed(2) ?? "Chưa có"}</span></div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div className="rounded-xl bg-surface-container-low p-3"><span className="text-on-surface-variant">Trong 0.5 band</span><strong className="mt-1 block text-base">{percent(metric.withinHalfBandPercent)}</strong></div><div className="rounded-xl bg-surface-container-low p-3"><span className="text-on-surface-variant">Trong 1.0 band</span><strong className="mt-1 block text-base">{percent(metric.withinOneBandPercent)}</strong></div></div>
        </section>)}
      </div>}
    </div>}
  </section>;
}

function OverviewMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="bg-surface p-5"><span className="text-xs font-bold text-on-surface-variant">{label}</span><strong className="mt-2 block font-display text-3xl text-primary">{value}</strong><p className="mt-1 text-xs text-on-surface-variant">{note}</p></div>;
}

function WritingPanel() {
  const [items, setItems] = useState<WritingEvaluation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"ALL" | "SELF_PRACTICE" | "ASSIGNMENT">("ALL");
  const [courseId, setCourseId] = useState("");
  const [teacherFilter, setTeacherFilter] = useState<"ALL" | "AVAILABLE" | "REVIEWED" | "PUBLISHED">("ALL");
  const [filterOptions, setFilterOptions] = useState<WritingFilterOptions>({ totalCount: 0, selfPracticeCount: 0, courseCount: 0, courses: [] });
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [reviewMode, setReviewMode] = useState<"ai" | "teacher">("teacher");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [bands, setBands] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [editedText, setEditedText] = useState("");
  const [editedHtml, setEditedHtml] = useState("");
  const [annotations, setAnnotations] = useState<TeacherAnnotation[]>([]);
  const [draftDirty, setDraftDirty] = useState(false);
  const [draftStatus, setDraftStatus] = useState<"saved" | "dirty" | "saving" | "error">("saved");
  const [gradingDirty, setGradingDirty] = useState(false);
  const [isWordEditorOpen, setIsWordEditorOpen] = useState(false);
  const draftVersionRef = useRef(0);
  const gradingVersionRef = useRef(0);
  const draftSaveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const criterionKeys = useMemo(() => selected ? [selected.taskType === "task_2" ? "task_response" : "task_achievement", "coherence_cohesion", "lexical_resource", "grammatical_range_accuracy"] : [], [selected?.taskType]);
  const overallBand = calculatedBand(criterionKeys, bands);
  const missingCriteriaCount = criterionKeys.filter((key) => !validBand(bands[key] ?? "")).length;
  const gradingComplete = criterionKeys.length === 4 && missingCriteriaCount === 0 && validBand(overallBand);

  async function load(signal?: AbortSignal) {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ origin: sourceFilter, page: String(page), size: "30" });
      if (courseId && sourceFilter === "ASSIGNMENT") params.set("courseId", courseId);
      if (teacherFilter !== "ALL") params.set("teacherStatus", teacherFilter);
      if (debouncedQuery) params.set("q", debouncedQuery);
      const result = await apiFetch<PageResult<WritingEvaluation>>(`/admin/writing-evaluations?${params}`, { signal });
      setItems(result.content); setTotalElements(result.totalElements); setTotalPages(result.totalPages);
      setSelectedId((current) => result.content.some((item) => item.id === current) ? current : result.content[0]?.id ?? "");
    } catch (reason) { if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(message(reason, "Không tải được hàng chờ Writing.")); }
    finally { if (!signal?.aborted) setLoading(false); }
  }
  async function loadFilterOptions() {
    try { setFilterOptions(await apiFetch<WritingFilterOptions>("/admin/writing-evaluations/filter-options")); }
    catch (reason) { setError(message(reason, "Không tải được danh sách lớp Writing & Speaking.")); }
  }
  useEffect(() => { const timer = window.setTimeout(() => { setDebouncedQuery(query.trim()); setPage(0); }, 300); return () => window.clearTimeout(timer); }, [query]);
  useEffect(() => { void loadFilterOptions(); }, []);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [sourceFilter, courseId, teacherFilter, page, debouncedQuery]);
  useEffect(() => {
    if (!selected) return;
    setBands(Object.fromEntries(criterionKeys.map((key) => [key, String(selected.criteria[key]?.teacherBand ?? selected.criteria[key]?.aiBand ?? "")])));
    setFeedback(Object.fromEntries(criterionKeys.map((key) => [key, selected.criteria[key]?.teacherFeedback ?? selected.criteria[key]?.aiFeedback ?? ""])));
    setStrengths(selected.strengths.join("\n")); setImprovements(selected.improvements.join("\n"));
    setEditedText(selected.teacherEditedText ?? selected.essayText);
    setEditedHtml(selected.teacherEditedHtml ?? "");
    setAnnotations(selected.teacherAnnotations ?? []);
    setDraftDirty(false); setDraftStatus("saved");
    setGradingDirty(false);
    draftVersionRef.current += 1;
    gradingVersionRef.current += 1;
  }, [criterionKeys, selectedId]);
  useEffect(() => {
    if (!selected || !draftDirty) return;
    const version = draftVersionRef.current;
    const evaluationId = selected.id;
    const timer = window.setTimeout(() => {
      setDraftStatus("saving");
      draftSaveQueueRef.current = draftSaveQueueRef.current.then(async () => {
        try {
          const updated = await apiFetch<WritingEvaluation>(`/admin/writing-evaluations/${evaluationId}/draft`, {
            method: "PUT", body: JSON.stringify({ editedText, editedHtml, annotations }),
          });
          replace(setItems, updated);
          if (evaluationId === selectedId && version === draftVersionRef.current) {
            setDraftDirty(false); setDraftStatus("saved");
          }
        } catch (reason) {
          if (evaluationId === selectedId && version === draftVersionRef.current) {
            setDraftStatus("error"); setError(message(reason, "Không thể tự lưu bản sửa."));
          }
        }
      });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [selectedId, draftDirty, editedText, editedHtml, annotations]);
  useEffect(() => {
    if (!draftDirty && !gradingDirty) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [draftDirty, gradingDirty]);
  function markDraftDirty() { draftVersionRef.current += 1; setDraftDirty(true); setDraftStatus("dirty"); }
  function changeEditedText(value: string) { setEditedText(value); markDraftDirty(); }
  function changeEditedHtml(value: string) { setEditedHtml(value); markDraftDirty(); }
  function changeAnnotations(value: React.SetStateAction<TeacherAnnotation[]>) { setAnnotations(value); markDraftDirty(); }
  function markGradingDirty() { gradingVersionRef.current += 1; setGradingDirty(true); }
  function changeBands(value: React.SetStateAction<Record<string, string>>) { setBands(value); markGradingDirty(); }
  function changeFeedback(value: React.SetStateAction<Record<string, string>>) { setFeedback(value); markGradingDirty(); }
  function changeStrengths(value: string) { setStrengths(value); markGradingDirty(); }
  function changeImprovements(value: string) { setImprovements(value); markGradingDirty(); }
  async function save(publish: boolean) {
    if (!selected || !gradingComplete) {
      setError(`Còn thiếu ${missingCriteriaCount} tiêu chí. Nhập đủ bốn điểm từ 0 đến 9 theo bước 0.5 trước khi lưu hoặc công bố.`); return;
    }
    const criteria = Object.fromEntries(criterionKeys.map((key) => [key, { band: Number(bands[key]), feedback: feedback[key] ?? "" }]));
    const draftVersion = draftVersionRef.current;
    const gradingVersion = gradingVersionRef.current;
    setSaving(true); setError("");
    try {
      const request = draftSaveQueueRef.current.then(() => apiFetch<WritingEvaluation>(`/admin/writing-evaluations/${selected.id}/review`, { method: "PUT", body: JSON.stringify({ overallBand: Number(overallBand), criteria, strengths: lines(strengths), improvements: lines(improvements), publish, editedText, editedHtml, annotations }) }));
      draftSaveQueueRef.current = request.then(() => undefined, () => undefined);
      const updated = await request;
      replace(setItems, updated);
      if (draftVersion === draftVersionRef.current) { setDraftDirty(false); setDraftStatus("saved"); }
      if (gradingVersion === gradingVersionRef.current) setGradingDirty(false);
    } catch (reason) { setError(message(reason, "Không thể lưu đánh giá Writing.")); }
    finally { setSaving(false); }
  }
  async function retry() {
    if (!selected) return;
    setSaving(true); setError("");
    try { replace(setItems, await apiFetch<WritingEvaluation>(`/admin/writing-evaluations/${selected.id}/retry`, { method: "POST" })); }
    catch (reason) { setError(message(reason, "Không thể thử AI chấm lại.")); }
    finally { setSaving(false); }
  }
  const prompt = selected?.taskContext?.promptHtml ? new DOMParser().parseFromString(selected.taskContext.promptHtml, "text/html").body.textContent ?? "" : "Chưa có đề bài trong dữ liệu chấm.";

  function changeSource(value: "ALL" | "SELF_PRACTICE" | "ASSIGNMENT") { setSourceFilter(value); if (value !== "ASSIGNMENT") setCourseId(""); setPage(0); }
  async function refresh() { await Promise.all([load(), loadFilterOptions()]); }

  return <EvaluationLayout loading={loading} error={error} query={query} setQuery={setQuery} onRefresh={refresh}
    queueTitle="Bài Writing" count={totalElements}
    filters={<WritingFilters source={sourceFilter} onSourceChange={changeSource} courseId={courseId} onCourseChange={(value) => { setCourseId(value); setPage(0); }} teacherStatus={teacherFilter} onTeacherStatusChange={(value) => { setTeacherFilter(value); setPage(0); }} options={filterOptions}/>}
    pagination={totalPages > 1 ? <Pagination page={page} totalPages={totalPages} onChange={setPage}/> : undefined}
    list={items.map((item) => <QueueItem key={item.id} active={item.id === selectedId} onClick={() => setSelectedId(item.id)}
      ai={aiStatuses[item.status] ?? item.status} teacher={teacherStatuses[item.teacherStatus] ?? item.teacherStatus}
      title={item.studentName} subtitle={`${item.studentCode} · ${item.testTitle}`} source={writingSource(item)}
      meta={`${taskLabel(item.taskType)} · ${wordCount(item.essayText)} từ, ${shortDate(item.createdAt)}`}/>) }
    empty={!selected ? "Không có bài Writing phù hợp với bộ lọc." : undefined}>
    {selected ? <div className="flex h-full min-h-0 flex-col gap-3">
      <WritingEvaluationBar evaluation={selected} criteria={criterionKeys}/>
      <WritingWorkspaceSplitPane
        left={
          <div className="h-full min-h-0">
            <WritingReviewEditor
              evaluation={selected}
              prompt={prompt}
              editedText={editedText}
              annotations={annotations}
              draftStatus={draftStatus}
              onOpenWordEditor={() => setIsWordEditorOpen(true)}
            />
          </div>
        }
        right={
          <div className="flex h-full min-h-0 flex-col space-y-3 overflow-hidden">
            <ReviewSwitcher value={reviewMode} onChange={setReviewMode} />
            {reviewMode === "ai" ? (
              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
                <AiSummary
                  status={selected.status}
                  overall={selected.overallBandAi}
                  criteria={selected.criteria}
                  labels={writingLabels}
                  strengths={selected.aiStrengths}
                  improvements={selected.aiImprovements}
                  error={selected.errorMessage}
                  onRetry={selected.status === "FAILED" ? retry : undefined}
                />
              </div>
            ) : (
              <TeacherForm
                workspace
                overall={overallBand}
                setOverall={() => undefined}
                overallReadOnly
                criteria={criterionKeys}
                labels={writingLabels}
                bands={bands}
                setBands={changeBands}
                feedback={feedback}
                setFeedback={changeFeedback}
                strengths={strengths}
                setStrengths={changeStrengths}
                improvements={improvements}
                setImprovements={changeImprovements}
                saving={saving}
                published={selected.teacherStatus === "PUBLISHED"}
                onSave={save}
              />
            )}
          </div>
        }
      />
      {isWordEditorOpen ? (
        <Suspense fallback={<div className="fixed inset-0 z-50 grid place-content-center bg-surface/90 text-sm font-bold text-primary">Đang mở trình sửa Word…</div>}>
          <WritingWordReviewModal
            isOpen={isWordEditorOpen}
            onClose={() => setIsWordEditorOpen(false)}
            evaluation={selected}
            prompt={prompt}
            editedText={editedText}
            setEditedText={changeEditedText}
            editedHtml={editedHtml}
            setEditedHtml={changeEditedHtml}
            annotations={annotations}
            setAnnotations={changeAnnotations}
            draftStatus={draftStatus}
            overallBand={overallBand}
            bands={bands}
            setBands={changeBands}
            feedback={feedback}
            setFeedback={changeFeedback}
            strengths={strengths}
            setStrengths={changeStrengths}
            improvements={improvements}
            setImprovements={changeImprovements}
            gradingDirty={gradingDirty}
            gradingComplete={gradingComplete}
            missingCriteriaCount={missingCriteriaCount}
            saving={saving}
            published={selected.teacherStatus === "PUBLISHED"}
            onSave={save}
          />
        </Suspense>
      ) : null}
    </div> : null}
  </EvaluationLayout>;
}

function SpeakingPanel() {
  const [items, setItems] = useState<SpeakingEvaluation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [bands, setBands] = useState<Record<string, string>>({});
  const [, setOverall] = useState("");
  const [feedback, setFeedback] = useState("");
  const [criterionFeedback, setCriterionFeedback] = useState<Record<string, string>>({});
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const keys = Object.keys(speakingLabels);
  const calculatedOverall = calculatedBand(keys, bands);

  async function load() {
    setLoading(true); setError("");
    try {
      const values = await apiFetch<SpeakingEvaluation[]>("/admin/speaking-evaluations");
      setItems(values); setSelectedId((current) => values.some((item) => item.id === current) ? current : values[0]?.id ?? "");
    } catch (reason) { setError(message(reason, "Không tải được hàng chờ Speaking.")); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!selected) return;
    setOverall(String(selected.overallBandTeacher ?? selected.overallBandAi ?? ""));
    setBands(Object.fromEntries(keys.map((key) => [key, String(selected.criteria[key]?.teacherBand ?? selected.criteria[key]?.aiBand ?? "")])));
    setCriterionFeedback(Object.fromEntries(keys.map((key) => [key, selected.criteria[key]?.teacherFeedback ?? ""])));
    setFeedback(selected.teacherFeedback ?? ""); setStrengths(selected.teacherStrengths.join("\n")); setImprovements(selected.teacherImprovements.join("\n"));
  }, [selectedId, selected?.teacherStatus]);
  const filtered = useMemo(() => filterItems(items, query, (item) => `${item.studentName} ${item.testTitle} ${item.questionKey}`), [items, query]);

  async function save(publish: boolean) {
    if (!selected || !validBand(calculatedOverall) || keys.some((key) => !validBand(bands[key] ?? ""))) { setError("Nhập đủ bốn điểm Speaking theo bước 0.5."); return; }
    setSaving(true); setError("");
    try {
      const updated = await apiFetch<SpeakingEvaluation>(`/admin/speaking-evaluations/${selected.id}/review`, { method: "PUT", body: JSON.stringify({
        overallBand: Number(calculatedOverall), fluencyBand: Number(bands.fluency_coherence), lexicalBand: Number(bands.lexical_resource),
        grammarBand: Number(bands.grammatical_range_accuracy), pronunciationBand: Number(bands.pronunciation),
        criterionFeedback, feedback,
        strengths: lines(strengths), improvements: lines(improvements), publish,
      }) });
      replace(setItems, updated);
    } catch (reason) { setError(message(reason, "Không thể lưu đánh giá Speaking.")); }
    finally { setSaving(false); }
  }

  return <EvaluationLayout loading={loading} error={error} query={query} setQuery={setQuery} onRefresh={load}
    queueTitle="Bài Speaking" count={filtered.length}
    list={filtered.map((item) => <QueueItem key={item.id} active={item.id === selectedId} onClick={() => setSelectedId(item.id)} ai={aiStatuses[item.aiStatus] ?? item.aiStatus} teacher={teacherStatuses[item.teacherStatus] ?? item.teacherStatus} title={item.studentName} subtitle={item.testTitle} source="Speaking" meta={`Toàn bài · ${shortDate(item.createdAt)}`}/>) }
    empty={!selected ? "Chưa có bài Speaking được ghi nhận." : undefined}>
    {selected ? <div className="space-y-6">
      <EvaluationHeading student={selected.studentName} title={selected.testTitle} meta={selected.questionKey} teacherStatus={selected.teacherStatus}/>
      <section className="grid gap-5 xl:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)]">
        <section className="rounded-2xl border border-outline-variant/65 bg-surface p-4"><h3 className="text-sm font-extrabold">Bản ghi toàn bài</h3><div className="custom-scrollbar mt-3 max-h-[650px] space-y-3 overflow-y-auto pr-1">{selected.segments?.map((segment, index) => <article key={`${segment.questionKey}-${index}`} className="rounded-xl border border-outline-variant/55 bg-surface-container-low/35 p-3"><strong className="block text-xs text-primary">Câu {index + 1}</strong><p className="mt-2 whitespace-pre-wrap font-serif text-sm leading-6">{segment.transcript || "Chưa có transcript."}</p>{segment.audioUrl ? <audio controls preload="none" className="mt-3 h-9 w-full" src={segment.audioUrl}>Trình duyệt không hỗ trợ audio.</audio> : <span className="mt-2 block text-[11px] text-on-surface-variant">Không có file ghi âm.</span>}</article>)}</div></section>
        <div className="space-y-4">
          <AiSummary status={selected.aiStatus} overall={selected.overallBandAi} criteria={selected.criteria} labels={speakingLabels} strengths={selected.aiStrengths} improvements={selected.aiImprovements}/>
          <TeacherForm overall={calculatedOverall} setOverall={setOverall} overallReadOnly criteria={keys} labels={speakingLabels} bands={bands} setBands={setBands} feedback={criterionFeedback} setFeedback={setCriterionFeedback} feedbackText={feedback} setFeedbackText={setFeedback} strengths={strengths} setStrengths={setStrengths} improvements={improvements} setImprovements={setImprovements} saving={saving} published={selected.teacherStatus === "PUBLISHED"} onSave={save}/>
        </div>
      </section>
    </div> : null}
  </EvaluationLayout>;
}

function EntitlementsPanel() {
  const [skill, setSkill] = useState<"writing" | "speaking">("writing");
  const [items, setItems] = useState<Entitlement[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  async function load() {
    setLoading(true); setError("");
    try { setItems(await apiFetch<Entitlement[]>(`/admin/${skill}-evaluations/entitlements`)); }
    catch (reason) { setError(message(reason, `Không tải được quyền AI ${skill === "writing" ? "Writing" : "Speaking"}.`)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [skill]);
  const filtered = useMemo(() => filterItems(items, query, (item) => `${item.studentCode} ${item.studentName} ${item.email ?? ""}`), [items, query]);
  function update(id: string, patch: Partial<Entitlement>) { setItems((current) => current.map((item) => item.studentId === id ? { ...item, ...patch } : item)); }
  async function save(item: Entitlement) {
    setSavingId(item.studentId); setError("");
    try {
      const updated = await apiFetch<Entitlement>(`/admin/${skill}-evaluations/entitlements/${item.studentId}`, { method: "PUT", body: JSON.stringify({ mode: item.mode, monthlyLimit: item.mode === "LIMITED" ? item.monthlyLimit : null, expiresAt: item.expiresAt, note: item.note }) });
      update(item.studentId, updated);
    } catch (reason) { setError(message(reason, "Không thể cập nhật quyền AI.")); }
    finally { setSavingId(""); }
  }
  return <section className="rounded-[22px] border border-outline-variant/55 bg-surface-container-lowest p-5">
    <div className="flex flex-col gap-4 border-b border-outline-variant/55 pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div><h2 className="font-display text-xl font-extrabold">Quyền chấm AI</h2><p className="mt-1 text-sm text-on-surface-variant">Cấp riêng ngân sách Writing và Speaking cho từng học viên.</p><div className="mt-3 inline-flex rounded-xl bg-surface-container p-1"><button type="button" onClick={() => setSkill("writing")} className={`rounded-lg px-3 py-2 text-xs font-extrabold ${skill === "writing" ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant"}`}>Writing</button><button type="button" onClick={() => setSkill("speaking")} className={`rounded-lg px-3 py-2 text-xs font-extrabold ${skill === "speaking" ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant"}`}>Speaking</button></div></div>
      <Search value={query} onChange={setQuery} placeholder="Tìm tên, email hoặc mã học viên"/>
    </div>
    {error ? <ErrorNotice value={error}/> : null}
    {loading ? <Loading/> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[950px] border-separate border-spacing-y-2 text-left text-sm">
      <thead className="text-xs text-on-surface-variant"><tr><th className="px-3">Học viên</th><th className="px-3">Chế độ</th><th className="px-3">Quota tháng</th><th className="px-3">Đã dùng</th><th className="px-3">Hết hạn</th><th className="px-3 text-right">Thao tác</th></tr></thead>
      <tbody>{filtered.map((item) => <tr key={item.studentId} className="bg-surface-container-low">
        <td className="rounded-l-xl px-3 py-3"><strong className="block">{item.studentName}</strong><span className="text-xs text-on-surface-variant">{item.studentCode} · {item.email || "Chưa có email"}</span></td>
        <td className="px-3 py-3"><select aria-label={`Quyền AI của ${item.studentName}`} value={item.mode} onChange={(event) => update(item.studentId, { mode: event.target.value as EntitlementMode, monthlyLimit: event.target.value === "LIMITED" ? item.monthlyLimit ?? 2 : null })} className="min-h-11 rounded-xl border-outline-variant bg-surface text-sm font-bold"><option value="DISABLED">Tắt AI</option><option value="LIMITED">Giới hạn</option><option value="UNLIMITED">Không giới hạn</option></select></td>
        <td className="px-3 py-3">{item.mode === "LIMITED" ? <input aria-label={`Quota tháng của ${item.studentName}`} type="number" min="1" value={item.monthlyLimit ?? 2} onChange={(event) => update(item.studentId, { monthlyLimit: Math.max(1, Number(event.target.value)) })} className="min-h-11 w-24 rounded-xl border-outline-variant"/> : item.mode === "UNLIMITED" ? <span className="inline-flex items-center gap-1 font-bold text-primary"><InfinityIcon/> Không giới hạn</span> : "Không áp dụng"}</td>
        <td className="px-3 py-3 font-bold tabular-nums">{item.usedThisMonth}</td>
        <td className="px-3 py-3"><input aria-label={`Ngày hết hạn của ${item.studentName}`} type="datetime-local" value={toLocalInput(item.expiresAt)} onChange={(event) => update(item.studentId, { expiresAt: event.target.value ? new Date(event.target.value).toISOString() : null })} className="min-h-11 rounded-xl border-outline-variant bg-surface text-sm"/></td>
        <td className="rounded-r-xl px-3 py-3 text-right"><button type="button" disabled={savingId === item.studentId || item.mode === "LIMITED" && !item.monthlyLimit} onClick={() => void save(item)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 font-bold text-on-primary disabled:opacity-50">{savingId === item.studentId ? <CircleNotch className="animate-spin"/> : <FloppyDisk/>} Lưu</button></td>
      </tr>)}</tbody>
    </table>{filtered.length === 0 ? <Empty text="Không tìm thấy học viên phù hợp."/> : null}</div>}
  </section>;
}

function EvaluationLayout({ loading, error, query, setQuery, onRefresh, queueTitle = "Hàng chờ", count = 0, filters, pagination, list, empty, children }: { loading: boolean; error: string; query: string; setQuery: (value: string) => void; onRefresh: () => Promise<void>; queueTitle?: string; count?: number; filters?: React.ReactNode; pagination?: React.ReactNode; list: React.ReactNode; empty?: string; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("management-writing-queue-collapsed") === "1");
  useEffect(() => {
    window.localStorage.setItem("management-writing-queue-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);
  return <>{error ? <ErrorNotice value={error}/> : null}<section className={`grid min-h-[720px] overflow-hidden rounded-2xl border border-outline-variant/55 bg-surface-container-lowest xl:h-[calc(100dvh-224px)] xl:min-h-[620px] ${collapsed ? "xl:grid-cols-[68px_minmax(0,1fr)]" : "xl:grid-cols-[340px_minmax(0,1fr)]"}`}>
    <aside className={`flex min-h-0 flex-col border-b border-outline-variant/55 bg-surface-container-low/35 xl:border-b-0 xl:border-r ${collapsed ? "xl:w-[68px]" : ""}`}>
      {collapsed ? <div className="flex flex-col items-center gap-2 border-b border-outline-variant/55 p-2">
        <button type="button" aria-label="Mở rộng bộ lọc và danh sách" aria-expanded={false} title="Mở rộng bộ lọc và danh sách" onClick={() => setCollapsed(false)} className="grid size-10 place-content-center rounded-xl border border-outline-variant bg-surface text-on-surface-variant transition hover:border-primary hover:text-primary"><CaretRight size={17}/></button>
        <span className="writing-queue-count rounded-full bg-primary-fixed/45 px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums text-primary" title={`${count} bài phù hợp`}>{count}</span>
      </div> : <div className="border-b border-outline-variant/55 p-3">
        <div className="flex items-center justify-between gap-3 px-1"><div><h2 className="text-sm font-extrabold">{queueTitle}</h2><p className="mt-0.5 text-xs text-on-surface-variant">{count} bài phù hợp</p></div><div className="flex shrink-0 items-center gap-1"><button type="button" aria-label="Thu gọn bộ lọc và danh sách" aria-expanded={true} title="Thu gọn bộ lọc và danh sách" onClick={() => setCollapsed(true)} className="grid size-10 place-content-center rounded-xl border border-outline-variant bg-surface text-on-surface-variant transition hover:border-primary hover:text-primary"><CaretLeft size={17}/></button><button type="button" aria-label="Làm mới danh sách" title="Làm mới danh sách" disabled={loading} onClick={() => void onRefresh()} className="grid size-10 place-content-center rounded-xl border border-outline-variant bg-surface text-on-surface-variant transition hover:text-primary disabled:opacity-50"><ArrowClockwise className={loading ? "animate-spin" : ""}/></button></div></div>
        <div className="mt-3"><Search value={query} onChange={setQuery} placeholder="Tìm học viên hoặc đề"/></div>
        {filters ? <div className="mt-3">{filters}</div> : null}
      </div>}
      {!collapsed ? <><div className="custom-scrollbar min-h-[320px] flex-1 overflow-y-auto p-3 xl:min-h-0">{loading ? <Loading/> : list}</div>
      {pagination ? <div className="border-t border-outline-variant/55 p-3">{pagination}</div> : null}</> : null}
    </aside>
    <div className="custom-scrollbar min-h-0 min-w-0 overflow-y-auto p-3 lg:p-4">{empty ? <Empty text={empty}/> : children}</div>
  </section></>;
}

function QueueItem({ active, onClick, ai, teacher, title, subtitle, source = "Bài đánh giá", meta }: { active: boolean; onClick: () => void; ai: string; teacher: string; title: string; subtitle: string; source?: string; meta?: string }) {
  const teacherDone = teacher === "Đã lưu" || teacher === "Đã công bố";
  return <button type="button" onClick={onClick} aria-pressed={active} className={`mb-1.5 w-full rounded-xl border px-3 py-2.5 text-left transition ${active ? "border-primary bg-primary-fixed/35 shadow-[inset_3px_0_0_var(--color-primary)]" : "border-outline-variant/55 bg-surface hover:border-primary/45 hover:bg-primary-fixed/15"}`}>
    <div className="flex items-center gap-2"><span className="min-w-0 flex-1 truncate text-[9px] font-extrabold uppercase tracking-[.09em] text-primary">{source}</span><span className="rounded-md bg-primary-fixed/45 px-1.5 py-0.5 text-[9px] font-extrabold text-primary">{ai}</span><span className={`rounded-md px-1.5 py-0.5 text-[9px] font-extrabold ${teacherDone ? "bg-emerald-50 text-emerald-700" : "bg-surface-container text-on-surface-variant"}`}>GV: {teacher}</span></div>
    <div className="mt-1.5 flex items-center gap-2"><strong className="min-w-0 flex-1 truncate text-[13px] leading-4">{title}</strong>{active ? <CheckCircle size={15} weight="fill" className="shrink-0 text-primary"/> : null}</div>
    <span className="mt-0.5 block truncate text-[11px] leading-4 text-on-surface-variant">{subtitle}</span>
    {meta ? <span className="mt-0.5 block truncate text-[10px] leading-4 text-on-surface-variant/80">{meta}</span> : null}
  </button>;
}

function EvaluationHeading({ student, title, meta, teacherStatus }: { student: string; title: string; meta: string; teacherStatus: string }) {
  return <div className="flex flex-wrap items-start justify-between gap-4"><div><span className="text-xs font-bold text-primary">{student}</span><h2 className="mt-1 font-display text-2xl font-extrabold">{title}</h2><p className="mt-1 text-xs text-on-surface-variant">{meta}</p></div>{teacherStatus === "PUBLISHED" ? <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"><CheckCircle/>Đã công bố</span> : null}</div>;
}

function InfoBlock({ title, text, serif = false }: { title: string; text: string; serif?: boolean }) {
  return <section className="rounded-2xl border border-outline-variant/65 bg-surface p-5"><h3 className="text-sm font-extrabold">{title}</h3><p className={`mt-3 whitespace-pre-wrap leading-8 ${serif ? "font-serif text-base" : "text-sm"}`}>{text}</p></section>;
}

function WritingFilters({ source, onSourceChange, courseId, onCourseChange, teacherStatus, onTeacherStatusChange, options }: { source: "ALL" | "SELF_PRACTICE" | "ASSIGNMENT"; onSourceChange: (value: "ALL" | "SELF_PRACTICE" | "ASSIGNMENT") => void; courseId: string; onCourseChange: (value: string) => void; teacherStatus: "ALL" | "AVAILABLE" | "REVIEWED" | "PUBLISHED"; onTeacherStatusChange: (value: "ALL" | "AVAILABLE" | "REVIEWED" | "PUBLISHED") => void; options: WritingFilterOptions }) {
  const sourceOptions = [
    { value: "ALL" as const, label: "Tất cả", count: options.totalCount },
    { value: "SELF_PRACTICE" as const, label: "Tự do", count: options.selfPracticeCount },
    { value: "ASSIGNMENT" as const, label: "Theo lớp", count: options.courseCount },
  ];
  return <div className="space-y-2">
    <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-200/80 p-1" aria-label="Lọc nguồn bài Writing">
      {sourceOptions.map((option) => {
        const isSelected = source === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSourceChange(option.value)}
            className={`min-h-9 rounded-lg px-2 text-[11px] font-black transition-all ${
              isSelected
                ? "bg-gradient-to-r from-[#894c5b] to-[#713c4a] text-white shadow-sm scale-[1.02]"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <span>{option.label}</span>
            <span
              className={`ml-1.5 tabular-nums text-[10px] rounded-md px-1.5 py-0.5 ${
                isSelected ? "bg-white/20 text-white font-bold" : "bg-white text-slate-500 shadow-xs"
              }`}
            >
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
    <div className={`grid gap-2 ${source === "ASSIGNMENT" ? "grid-cols-[minmax(0,1.25fr)_minmax(0,.75fr)]" : "grid-cols-1"}`}>
      {source === "ASSIGNMENT" ? <CoursePicker value={courseId} onChange={onCourseChange} options={options}/> : null}
      <label className="block"><span className="sr-only">Tiến độ giáo viên</span><select aria-label="Tiến độ giáo viên" value={teacherStatus} onChange={(event) => onTeacherStatusChange(event.target.value as "ALL" | "AVAILABLE" | "REVIEWED" | "PUBLISHED")} className="min-h-9 w-full rounded-xl border-outline-variant bg-surface px-2 text-[11px] font-semibold"><option value="ALL">Tất cả trạng thái</option><option value="AVAILABLE">Chưa chấm</option><option value="REVIEWED">Đã lưu</option><option value="PUBLISHED">Đã công bố</option></select></label>
    </div>
  </div>;
}

function CoursePicker({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: WritingFilterOptions }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.courses.find((course) => course.id === value);
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const courses = options.courses.filter((course) => !normalizedQuery || `${course.code} ${course.name}`.toLocaleLowerCase("vi").includes(normalizedQuery));
  useEffect(() => {
    function close(event: PointerEvent) {
      if (rootRef.current && event.target instanceof Node && !rootRef.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  function choose(id: string) { onChange(id); setOpen(false); setQuery(""); }
  return <div ref={rootRef} className="relative min-w-0">
    <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="flex min-h-9 w-full items-center gap-2 rounded-xl border border-outline-variant bg-surface px-2.5 text-left text-[11px] font-semibold">
      <span className="min-w-0 flex-1 truncate">{selected ? `${selected.code} · ${selected.name}` : `Tất cả lớp (${options.courseCount})`}</span><CaretDown size={14} className={`shrink-0 transition ${open ? "rotate-180" : ""}`}/>
    </button>
    {open ? <div className="absolute left-0 z-30 mt-1 w-[310px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-xl">
      <label className="relative block border-b border-outline-variant/55 p-2"><span className="sr-only">Tìm lớp</span><MagnifyingGlass size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"/><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã hoặc tên lớp" className="min-h-9 w-full rounded-lg border-outline-variant bg-surface-container-low pl-8 pr-2 text-xs"/></label>
      <div role="listbox" aria-label="Chọn lớp Writing & Speaking" className="custom-scrollbar max-h-64 overflow-y-auto p-1.5">
        <button type="button" role="option" aria-selected={!value} onClick={() => choose("")} className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs ${!value ? "bg-primary-fixed/45 text-primary" : "hover:bg-surface-container-low"}`}><strong>Tất cả lớp S&amp;W</strong><span className="tabular-nums opacity-70">{options.courseCount} bài</span></button>
        {courses.map((course) => <button key={course.id} type="button" role="option" aria-selected={value === course.id} onClick={() => choose(course.id)} className={`mt-0.5 w-full rounded-lg px-2.5 py-2 text-left ${value === course.id ? "bg-primary-fixed/45" : "hover:bg-surface-container-low"}`}>
          <span className="flex items-center justify-between gap-3"><strong className="min-w-0 truncate text-xs">{course.code} · {course.name}</strong>{course.awaitingTeacherCount > 0 ? <span className="shrink-0 rounded-md bg-primary-fixed px-1.5 py-0.5 text-[9px] font-extrabold text-primary">{course.awaitingTeacherCount} chờ</span> : null}</span>
          <span className="mt-0.5 block text-[10px] text-on-surface-variant">{course.evaluationCount} bài · {course.studentCount} học viên</span>
        </button>)}
        {courses.length === 0 ? <p className="px-3 py-5 text-center text-xs text-on-surface-variant">Không tìm thấy lớp phù hợp.</p> : null}
      </div>
    </div> : null}
  </div>;
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  return <div className="flex items-center justify-between gap-2"><button type="button" disabled={page === 0} onClick={() => onChange(page - 1)} className="min-h-9 rounded-lg border border-outline-variant bg-surface px-3 text-xs font-bold disabled:opacity-40">Trước</button><span className="text-[11px] font-semibold tabular-nums text-on-surface-variant">Trang {page + 1}/{totalPages}</span><button type="button" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)} className="min-h-9 rounded-lg border border-outline-variant bg-surface px-3 text-xs font-bold disabled:opacity-40">Sau</button></div>;
}

function WritingEvaluationBar({ evaluation, criteria }: { evaluation: WritingEvaluation; criteria: string[] }) {
  return <section className="shrink-0 overflow-x-auto rounded-xl border border-outline-variant/55" aria-label="Thông tin và bảng điểm Writing">
    <div className="grid min-w-[780px] grid-cols-[minmax(210px,1.35fr)_repeat(6,minmax(84px,.7fr))] gap-px bg-outline-variant/55">
      <div className="flex min-w-0 items-center bg-surface px-3 py-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><strong className="min-w-0 flex-1 truncate text-xs text-primary">{evaluation.studentName} · {evaluation.studentCode}</strong>{evaluation.teacherStatus === "PUBLISHED" ? <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">Đã công bố</span> : null}</div>
          <h2 className="mt-0.5 truncate font-display text-sm font-extrabold leading-5">{evaluation.testTitle}</h2>
          <p className="mt-0.5 truncate text-[10px] text-on-surface-variant">{writingSource(evaluation)} · {taskLabel(evaluation.taskType)}, {wordCount(evaluation.essayText)} từ</p>
        </div>
      </div>
      <ScoreCell label="AI Overall" value={formatBand(evaluation.overallBandAi)} note={aiStatuses[evaluation.status] ?? evaluation.status} emphasis/>
      <ScoreCell label="Giáo viên" value={formatBand(evaluation.overallBandTeacher)} note={teacherStatuses[evaluation.teacherStatus] ?? evaluation.teacherStatus}/>
      {criteria.map((key) => <ScoreCell key={key} label={compactWritingLabel(key)} value={formatBand(evaluation.criteria[key]?.teacherBand ?? evaluation.criteria[key]?.aiBand ?? null)} note={evaluation.criteria[key]?.teacherBand != null ? `GV · AI ${formatBand(evaluation.criteria[key]?.aiBand ?? null)}` : "Điểm AI"}/>) }
    </div>
  </section>;
}

function ScoreCell({ label, value, note, emphasis = false }: { label: string; value: string; note: string; emphasis?: boolean }) {
  return <div className={`min-h-[60px] min-w-0 px-2.5 py-1.5 ${emphasis ? "bg-primary text-on-primary" : "bg-surface"}`}><span className={`block truncate text-[8px] font-extrabold uppercase tracking-[.05em] ${emphasis ? "text-on-primary/75" : "text-on-surface-variant"}`}>{label}</span><strong className="block truncate font-display text-lg leading-5 tabular-nums">{value}</strong><span className={`block truncate text-[8px] font-semibold ${emphasis ? "text-on-primary/75" : "text-on-surface-variant"}`}>{note}</span></div>;
}

function WritingWorkspaceSplitPane({
  left,
  right,
  initialRatio = 55,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  initialRatio?: number;
}) {
  const [splitRatio, setSplitRatio] = useState<number>(() => {
    if (typeof window === "undefined") return initialRatio;
    const saved = window.localStorage.getItem("management-writing-split-ratio");
    const num = saved ? parseFloat(saved) : initialRatio;
    return isNaN(num) || num < 26 || num > 74 ? initialRatio : num;
  });

  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isWide, setIsWide] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 1200;
  });

  useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth >= 1200);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const offset = e.clientX - rect.left;
      const percent = (offset / rect.width) * 100;
      const clamped = Math.min(Math.max(percent, 26), 74);
      setSplitRatio(clamped);
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("management-writing-split-ratio", String(Math.round(splitRatio * 10) / 10));
    } catch {
      // ignore
    }
  }, [splitRatio]);

  const resetRatio = () => {
    setSplitRatio(55);
  };

  if (!isWide) {
    return (
      <section className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="w-full">{left}</div>
        <div className="w-full">{right}</div>
      </section>
    );
  }

  const leftWidth = `calc(${splitRatio}% - 7px)`;
  const rightWidth = `calc(${100 - splitRatio}% - 7px)`;

  return (
    <section
      ref={containerRef}
      className={`relative flex min-h-0 flex-1 flex-row items-stretch overflow-hidden ${
        isDragging ? "cursor-col-resize select-none" : ""
      }`}
    >
      {isDragging ? (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none" />
      ) : null}

      <div
        className="min-h-0 shrink-0 overflow-hidden"
        style={{
          width: leftWidth,
          minWidth: "320px",
          transition: isDragging ? "none" : "width 0.15s ease-out",
        }}
      >
        {left}
      </div>

      <div
        role="separator"
        tabIndex={0}
        aria-orientation="vertical"
        aria-label="Thanh điều chỉnh tỉ lệ bài viết và đánh giá"
        aria-valuenow={Math.round(splitRatio)}
        aria-valuemin={26}
        aria-valuemax={74}
        onMouseDown={handleMouseDown}
        onDoubleClick={resetRatio}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setSplitRatio((r) => Math.max(26, r - 2));
          else if (e.key === "ArrowRight") setSplitRatio((r) => Math.min(74, r + 2));
          else if (e.key === "Enter" || e.key === " ") resetRatio();
        }}
        className={`group relative z-20 flex w-[14px] shrink-0 cursor-col-resize items-center justify-center select-none focus:outline-none ${
          isDragging ? "bg-primary/10" : "hover:bg-primary/5"
        }`}
        title="Kéo sang trái/phải để thay đổi tỉ lệ (Nhấp đúp: đặt lại 55/45)"
      >
        <div
          className={`h-full w-[2px] rounded-full transition-colors ${
            isDragging
              ? "bg-primary"
              : "bg-outline-variant/60 group-hover:bg-primary/70 group-focus:bg-primary"
          }`}
        />

        <div
          className={`absolute flex h-9 w-5 items-center justify-center rounded-md border border-outline-variant/70 bg-surface shadow-xs transition-all ${
            isDragging
              ? "scale-110 border-primary bg-primary text-on-primary shadow-md ring-2 ring-primary/20"
              : "text-on-surface-variant group-hover:border-primary group-hover:text-primary group-hover:shadow-sm"
          }`}
        >
          <DotsSixVertical size={13} weight="bold" />
        </div>

        <div
          className={`pointer-events-none absolute -top-1 z-30 flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold tracking-tight text-white shadow-md transition-opacity ${
            isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <span>{Math.round(splitRatio)}%</span>
          <span className="opacity-50">:</span>
          <span>{100 - Math.round(splitRatio)}%</span>
        </div>
      </div>

      <div
        className="min-h-0 shrink-0 overflow-hidden"
        style={{
          width: rightWidth,
          minWidth: "360px",
          transition: isDragging ? "none" : "width 0.15s ease-out",
        }}
      >
        {right}
      </div>
    </section>
  );
}

function WritingReviewEditor({
  evaluation,
  prompt,
  editedText,
  annotations,
  draftStatus,
  onOpenWordEditor,
}: {
  evaluation: WritingEvaluation;
  prompt: string;
  editedText: string;
  annotations: TeacherAnnotation[];
  draftStatus: "saved" | "dirty" | "saving" | "error";
  onOpenWordEditor: () => void;
}) {
  const [view, setView] = useState<"submission" | "revision">("submission");
  const hasRevision = editedText.trim() !== "" && editedText !== evaluation.essayText;
  const visibleText = view === "revision" && hasRevision ? editedText : evaluation.essayText;
  const paragraphs = visibleText.split(/\n+/).map((item) => item.trim()).filter(Boolean);

  const [fontSize, setFontSize] = useState<number>(() => {
    if (typeof window === "undefined") return 15;
    const saved = window.localStorage.getItem("management-writing-font-size");
    const num = saved ? parseInt(saved, 10) : 15;
    return isNaN(num) || num < 13 || num > 22 ? 15 : num;
  });

  const [fontFamily, setFontFamily] = useState<"sans" | "serif">(() => {
    if (typeof window === "undefined") return "sans";
    return window.localStorage.getItem("management-writing-font-family") === "serif" ? "serif" : "sans";
  });

  const [lineHeight, setLineHeight] = useState<"normal" | "relaxed" | "loose">(() => {
    if (typeof window === "undefined") return "relaxed";
    const saved = window.localStorage.getItem("management-writing-line-height");
    return saved === "normal" || saved === "loose" ? saved : "relaxed";
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.localStorage.setItem("management-writing-font-size", String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    window.localStorage.setItem("management-writing-font-family", fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    window.localStorage.setItem("management-writing-line-height", lineHeight);
  }, [lineHeight]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(visibleText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const totalWords = wordCount(visibleText);
  const targetWords = evaluation.taskType === "task_2" ? 250 : 150;
  const meetsWordTarget = totalWords >= targetWords;
  const wordDiff = targetWords - totalWords;

  const changeFontSize = (delta: number) => {
    setFontSize((prev) => Math.min(22, Math.max(13, prev + delta)));
  };

  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-outline-variant/55 bg-surface shadow-2xs">
      {/* Ultra-compact Header (Single Row) */}
      <header className="sticky top-0 z-10 border-b border-outline-variant/55 bg-surface/95 backdrop-blur-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2">
          {/* Left: Title + word count badge + revision toggle */}
          <div className="flex min-w-0 items-center gap-2">
            <ClipboardText size={17} className="shrink-0 text-primary" />
            <h3 className="truncate text-xs font-extrabold text-on-surface">Bài viết học viên</h3>

            {/* Word count status pill */}
            <span
              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                meetsWordTarget
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
              title={
                meetsWordTarget
                  ? `Đạt yêu cầu tối thiểu ${targetWords} từ (${totalWords}/${targetWords})`
                  : `Thiếu ${wordDiff} từ so với chuẩn tối thiểu ${targetWords} từ`
              }
            >
              <span>{totalWords} từ</span>
              <span>{meetsWordTarget ? "✓" : "⚠"}</span>
            </span>

            {/* Version switcher */}
            {hasRevision ? (
              <div className="flex rounded-md bg-surface-container p-0.5 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setView("submission")}
                  className={`rounded px-1.5 py-0.5 transition ${
                    view === "submission"
                      ? "bg-surface text-primary shadow-2xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Bài nộp
                </button>
                <button
                  type="button"
                  onClick={() => setView("revision")}
                  className={`rounded px-1.5 py-0.5 transition ${
                    view === "revision"
                      ? "bg-surface text-primary shadow-2xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Bản sửa
                </button>
              </div>
            ) : null}
          </div>

          {/* Right: Typography controls + Copy + Sửa bằng Word */}
          <div className="flex items-center gap-1.5">
            {/* Font Size Stepper */}
            <div className="flex items-center rounded-lg border border-outline-variant/60 bg-surface p-0.5">
              <button
                type="button"
                disabled={fontSize <= 13}
                onClick={() => changeFontSize(-1)}
                className="flex size-6 items-center justify-center rounded text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface disabled:opacity-35"
                title="Giảm cỡ chữ (A-)"
                aria-label="Giảm cỡ chữ"
              >
                <Minus size={11} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => setFontSize(15)}
                className="px-1.5 text-[11px] font-bold tabular-nums text-on-surface hover:text-primary"
                title="Nhấp để đặt lại cỡ chữ 15px"
              >
                {fontSize}px
              </button>
              <button
                type="button"
                disabled={fontSize >= 22}
                onClick={() => changeFontSize(1)}
                className="flex size-6 items-center justify-center rounded text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface disabled:opacity-35"
                title="Tăng cỡ chữ (A+)"
                aria-label="Tăng cỡ chữ"
              >
                <Plus size={11} weight="bold" />
              </button>
            </div>

            {/* Font Family Switcher */}
            <div className="flex rounded-lg border border-outline-variant/60 bg-surface p-0.5 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setFontFamily("sans")}
                className={`rounded px-1.5 py-0.5 transition ${
                  fontFamily === "sans"
                    ? "bg-primary-fixed/50 text-primary shadow-2xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                title="Phông Sans-serif"
              >
                Sans
              </button>
              <button
                type="button"
                onClick={() => setFontFamily("serif")}
                className={`rounded px-1.5 py-0.5 font-serif transition ${
                  fontFamily === "serif"
                    ? "bg-primary-fixed/50 text-primary shadow-2xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                title="Phông Serif học thuật"
              >
                Serif
              </button>
            </div>

            {/* Line Height Toggle */}
            <button
              type="button"
              onClick={() =>
                setLineHeight((curr) =>
                  curr === "normal" ? "relaxed" : curr === "relaxed" ? "loose" : "normal"
                )
              }
              className="flex items-center gap-0.5 rounded-lg border border-outline-variant/60 bg-surface px-1.5 py-1 text-[10px] font-semibold text-on-surface-variant transition hover:border-primary/50 hover:text-primary"
              title="Đổi khoảng cách dòng"
            >
              <span>Dòng:</span>
              <strong className="text-on-surface">
                {lineHeight === "normal" ? "1.6" : lineHeight === "relaxed" ? "1.8" : "2.1"}
              </strong>
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold transition ${
                copied
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-outline-variant/60 bg-surface text-on-surface-variant hover:border-primary/50 hover:text-primary"
              }`}
              title="Sao chép bài viết"
            >
              {copied ? (
                <>
                  <Check size={11} weight="bold" />
                  <span>Đã chép</span>
                </>
              ) : (
                <>
                  <Copy size={11} />
                  <span>Sao chép</span>
                </>
              )}
            </button>

            {/* Sửa bằng Word Button */}
            <button
              type="button"
              onClick={onOpenWordEditor}
              className="inline-flex min-h-7 items-center gap-1.5 rounded-lg bg-[#185abd] px-2.5 text-[11px] font-bold text-white transition hover:bg-[#124996] active:scale-[.98]"
              title="Mở trình sửa bài bằng Word"
            >
              <NotePencil size={13} weight="fill" />
              <span>Sửa bằng Word</span>
            </button>
          </div>
        </div>
      </header>

      {/* Ultra-compact Collapsible Prompt (Đề bài) */}
      <details className="group border-b border-outline-variant/55 bg-surface-container-low/40">
        <summary className="flex min-h-8 cursor-pointer list-none items-center gap-2 px-3.5 py-1 text-left [&::-webkit-details-marker]:hidden">
          <CaretRight size={13} className="shrink-0 text-primary transition-transform group-open:rotate-90"/>
          <strong className="shrink-0 text-[11px] font-bold">Đề bài</strong>
          <span className="min-w-0 flex-1 truncate text-[11px] text-on-surface-variant">{prompt}</span>
          {evaluation.taskContext.imageUrl ? <span className="shrink-0 text-[10px] font-semibold text-primary">Có hình Task 1</span> : null}
        </summary>
        <div className="border-t border-outline-variant/55 px-3.5 py-2.5">
          <p className="whitespace-pre-wrap text-xs font-semibold italic leading-5 text-slate-800 dark:text-slate-100">{prompt}</p>
          {evaluation.taskContext.imageUrl ? (
            <div className="mt-2 overflow-hidden rounded-lg border border-outline-variant/55 bg-white p-2">
              <AuthenticatedMediaImage fileUrl={evaluation.taskContext.imageUrl} alt={evaluation.taskContext.imageAltText || "Hình đề IELTS Writing Task 1"} className="mx-auto max-h-[220px] w-auto object-contain"/>
            </div>
          ) : null}
        </div>
      </details>

      {/* Essay Content Area */}
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        <div
          className="space-y-4 text-justify text-[#1e293b] dark:text-slate-100"
          style={{
            fontFamily:
              fontFamily === "serif"
                ? 'Georgia, Cambria, "Times New Roman", Times, serif'
                : 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: `${fontSize}px`,
            lineHeight:
              lineHeight === "normal" ? 1.6 : lineHeight === "relaxed" ? 1.8 : 2.05,
          }}
        >
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, index) => (
              <p
                key={`${index}-${paragraph.slice(0, 24)}`}
                className="whitespace-pre-wrap rounded-md p-1.5 transition-colors hover:bg-primary-fixed/10"
              >
                {paragraph}
              </p>
            ))
          ) : (
            <p className="py-8 text-center text-sm italic text-on-surface-variant">
              Bài viết chưa có nội dung.
            </p>
          )}

          {paragraphs.length > 0 ? (
            <div className="mt-5 flex items-center justify-between border-t border-outline-variant/35 pt-3 text-[11px] text-on-surface-variant select-none">
              <span className="font-medium italic opacity-70">--- Hết bài làm ---</span>
              <span className="tabular-nums font-semibold">
                {totalWords} từ · {paragraphs.length} đoạn
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between gap-3 border-t border-outline-variant/55 bg-surface-container-low/50 px-3.5 py-1.5 text-[11px] text-on-surface-variant">
        <span>{annotations.length ? `${annotations.length} nhận xét trong Word` : "Chưa có nhận xét trong Word"}</span>
        <span>{draftStatus === "saving" ? "Đang lưu…" : draftStatus === "dirty" ? "Nội dung chưa lưu" : draftStatus === "error" ? "Lưu lỗi" : "Nội dung đã lưu"}</span>
      </footer>
    </article>
  );
}

function ReviewSwitcher({ value, onChange }: { value: "ai" | "teacher"; onChange: (value: "ai" | "teacher") => void }) {
  return (
    <div className="sticky top-0 z-10 grid shrink-0 grid-cols-2 gap-1 rounded-xl border border-outline-variant/55 bg-surface-container p-1" aria-label="Chọn loại đánh giá">
      <button
        type="button"
        aria-pressed={value === "ai"}
        onClick={() => onChange("ai")}
        className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-xs font-extrabold transition ${
          value === "ai"
            ? "bg-surface text-primary shadow-sm"
            : "text-on-surface-variant hover:bg-surface/70 hover:text-on-surface"
        }`}
      >
        <Sparkle weight={value === "ai" ? "fill" : "bold"} />
        <span>Đánh giá AI</span>
      </button>
      <button
        type="button"
        aria-pressed={value === "teacher"}
        onClick={() => onChange("teacher")}
        className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-xs font-extrabold transition ${
          value === "teacher"
            ? "bg-surface text-primary shadow-sm"
            : "text-on-surface-variant hover:bg-surface/70 hover:text-on-surface"
        }`}
      >
        <Brain weight={value === "teacher" ? "fill" : "bold"} />
        <span>Chấm giáo viên</span>
      </button>
    </div>
  );
}

function AiSummary({ status, overall, criteria, labels, strengths, improvements, error, onRetry }: { status: string; overall: number | null; criteria: Record<string, Criterion>; labels: Record<string, string>; strengths: string[]; improvements: string[]; error?: string | null; onRetry?: () => Promise<void> }) {
  return <section className="rounded-2xl border border-primary/25 bg-primary-fixed/20 p-5"><div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-sm font-extrabold"><Sparkle className="text-primary"/>Đánh giá của AI</h3><span className="text-xs font-bold text-primary">{aiStatuses[status] ?? status}</span></div>{overall == null ? <p className="mt-4 text-sm text-on-surface-variant">{status === "NOT_ELIGIBLE" ? "Học viên không có quyền AI cho lần nộp này. Giáo viên vẫn có thể chấm bình thường." : error || "Chưa có kết quả AI."}{onRetry ? <button type="button" onClick={() => void onRetry()} className="ml-2 min-h-11 font-bold text-primary">Thử lại</button> : null}</p> : <><div className="mt-4 flex items-end gap-2"><strong className="font-display text-4xl text-primary">{overall.toFixed(1)}</strong><span className="pb-1 text-xs font-bold text-on-surface-variant">Overall band</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{Object.entries(criteria).filter(([, value]) => value.aiBand != null).map(([key, value]) => <div key={key} className="rounded-xl bg-surface p-3"><div className="flex justify-between gap-3 text-xs font-bold"><span>{labels[key] ?? key}</span><strong>{value.aiBand?.toFixed(1)}</strong></div>{value.aiFeedback ? <p className="mt-2 text-xs leading-5 text-on-surface-variant">{value.aiFeedback}</p> : null}</div>)}</div><FeedbackLists strengths={strengths} improvements={improvements}/></>}</section>;
}

const bandPresetOptions = ["4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"];

const criterionMetaMap: Record<string, { name: string; shortName: string }> = {
  task_achievement: { name: "Task Achievement", shortName: "Task" },
  task_response: { name: "Task Response", shortName: "Task" },
  coherence_cohesion: { name: "Coherence & Cohesion", shortName: "C&C" },
  fluency_coherence: { name: "Fluency & Coherence", shortName: "Fluency" },
  lexical_resource: { name: "Lexical Resource", shortName: "Lexical" },
  grammatical_range_accuracy: { name: "Grammar Range & Accuracy", shortName: "Grammar" },
  pronunciation: { name: "Pronunciation", shortName: "Pronun" },
};

function TeacherForm({
  workspace = false,
  overall,
  setOverall,
  overallReadOnly = false,
  criteria,
  labels,
  bands,
  setBands,
  feedback,
  setFeedback,
  feedbackText,
  setFeedbackText,
  strengths,
  setStrengths,
  improvements,
  setImprovements,
  saving,
  published,
  onSave,
}: {
  workspace?: boolean;
  overall: string;
  setOverall: (value: string) => void;
  overallReadOnly?: boolean;
  criteria: string[];
  labels: Record<string, string>;
  bands: Record<string, string>;
  setBands: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  feedback?: Record<string, string>;
  setFeedback?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  feedbackText?: string;
  setFeedbackText?: (value: string) => void;
  strengths: string;
  setStrengths: (value: string) => void;
  improvements: string;
  setImprovements: (value: string) => void;
  saving: boolean;
  published: boolean;
  onSave: (publish: boolean) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<string>(() => criteria[0] ?? "");
  const [activeFeedbackTab, setActiveFeedbackTab] = useState<"strengths" | "improvements" | "overall">("strengths");

  useEffect(() => {
    if (!criteria.includes(activeTab) && criteria.length > 0) {
      setActiveTab(criteria[0]);
    }
  }, [criteria, activeTab]);

  const activeKey = activeTab || criteria[0];
  const activeMeta = (activeKey ? criterionMetaMap[activeKey] : null) ?? {
    name: (activeKey ? labels[activeKey] : "") ?? activeKey ?? "",
    shortName: activeKey ?? "",
  };

  const currentBand = activeKey ? bands[activeKey] ?? "" : "";
  const missingCriteriaCount = criteria.filter((key) => !validBand(bands[key] ?? "")).length;
  const gradingComplete = criteria.length === 4 && missingCriteriaCount === 0 && validBand(overall);

  return (
    <section className={`rounded-2xl border border-outline-variant/65 bg-surface p-4 shadow-xs ${workspace ? "flex min-h-0 flex-1 flex-col overflow-hidden" : ""}`}>
      <div className={workspace ? "custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1" : ""}>
      {!workspace ? <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Brain size={18} weight="fill" />
          </span>
          <h3 className="text-sm font-extrabold text-slate-900">Chấm của giáo viên</h3>
        </div>
        {published ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle size={15} weight="fill" />
            Đã công bố
          </span>
        ) : null}
      </div> : null}

      <div className={`${workspace ? "" : "mt-3"} flex min-h-12 flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant/55 bg-surface-container-low/60 px-3 py-2`}>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-black text-on-primary">
            {overall || "-"}
          </div>
          <div><span className="block text-xs font-extrabold text-on-surface">Overall band</span><span className="text-[10px] text-on-surface-variant">{overallReadOnly ? "Tính từ 4 tiêu chí" : "Giáo viên xác nhận"}</span></div>
        </div>

        {!overallReadOnly && (
          <label className="flex items-center gap-2 text-xs font-bold" aria-label="Điểm overall">
            <input
              type="number"
              min="0"
              max="9"
              step="0.5"
              value={overall}
              onChange={(e) => setOverall(e.target.value)}
              className="h-9 w-20 rounded-lg border-outline-variant text-center text-sm font-extrabold"
            />
          </label>
        )}
      </div>

      <div className="mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-container p-1 sm:grid-cols-4" role="tablist" aria-label="Tiêu chí chấm">
          {criteria.map((key) => {
            const meta = criterionMetaMap[key] ?? {
              name: labels[key] ?? key,
              shortName: key,
            };
            const isSelected = activeKey === key;
            const b = bands[key] ?? "";
            const isGraded = b.trim() !== "";

            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveTab(key)}
                className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-center text-xs font-extrabold transition ${
                  isSelected
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-surface hover:text-on-surface"
                }`}
              >
                <span className="truncate">{meta.shortName || meta.name}</span>
                <span className={isSelected ? "text-on-primary/75" : "text-on-surface-variant/70"}>{isGraded ? b : "–"}</span>
              </button>
            );
          })}
        </div>

        {activeKey && (
          <div className="rounded-xl border border-outline-variant/55 bg-surface-container-low/35 p-3">
            <div className="flex items-center justify-between gap-2"><h4 className="text-sm font-extrabold text-slate-900">{activeMeta.name}</h4>{currentBand ? <span className="text-xs font-extrabold text-primary">Band {currentBand}</span> : null}</div>
            <div className="mt-3">
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                {bandPresetOptions.map((opt) => {
                  const isOptSelected = currentBand === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setBands((curr) => ({ ...curr, [activeKey]: opt }))}
                      className={`h-8 w-full rounded-lg border px-2 text-xs font-extrabold transition ${
                        isOptSelected
                          ? "border-primary bg-primary text-on-primary"
                          : "border-outline-variant bg-surface text-on-surface hover:border-primary"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}

                <div>
                  <input
                    aria-label={`Band ${activeMeta.name}`}
                    type="number"
                    min="0"
                    max="9"
                    step="0.5"
                    value={currentBand}
                    onChange={(e) => setBands((curr) => ({ ...curr, [activeKey]: e.target.value }))}
                    className="h-8 w-full rounded-lg border-outline-variant bg-surface text-center text-xs font-extrabold focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="0-9"
                  />
                </div>
              </div>
            </div>

            {feedback && setFeedback ? (
              <div className="mt-3">
                <label className="mb-1 block text-[11px] font-bold text-slate-700">Nhận xét</label>
                <textarea
                  aria-label={`Nhận xét ${activeMeta.name}`}
                  rows={3}
                  value={feedback[activeKey] ?? ""}
                  onChange={(e) => setFeedback((curr) => ({ ...curr, [activeKey]: e.target.value }))}
                  className="w-full rounded-xl border-outline-variant bg-surface p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder={`Nhận xét về ${activeMeta.name}`}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex gap-1 rounded-xl bg-surface-container p-1" role="tablist" aria-label="Nhận xét tổng hợp">
          <button
            type="button"
            onClick={() => setActiveFeedbackTab("strengths")}
            className={`flex-1 rounded-lg px-2 py-2 text-xs font-extrabold transition ${
              activeFeedbackTab === "strengths"
                ? "bg-surface text-primary shadow-sm"
                : "text-on-surface-variant hover:bg-surface/70"
            }`}
          >
            <span>Điểm mạnh {strengths.split("\n").filter(Boolean).length || ""}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFeedbackTab("improvements")}
            className={`flex-1 rounded-lg px-2 py-2 text-xs font-extrabold transition ${
              activeFeedbackTab === "improvements"
                ? "bg-surface text-primary shadow-sm"
                : "text-on-surface-variant hover:bg-surface/70"
            }`}
          >
            <span>Cần cải thiện {improvements.split("\n").filter(Boolean).length || ""}</span>
          </button>
          {setFeedbackText ? (
            <button
              type="button"
              onClick={() => setActiveFeedbackTab("overall")}
              className={`flex-1 rounded-lg px-2 py-2 text-xs font-extrabold transition ${
                activeFeedbackTab === "overall"
                  ? "bg-surface text-primary shadow-sm"
                  : "text-on-surface-variant hover:bg-surface/70"
              }`}
            >
              <span>Nhận xét tổng</span>
            </button>
          ) : null}
        </div>

        {activeFeedbackTab === "strengths" ? (
          <div>
            <textarea
              rows={3}
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              className="w-full rounded-xl border-outline-variant bg-surface p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Mỗi ý một dòng"
            />
          </div>
        ) : activeFeedbackTab === "improvements" ? (
          <div>
            <textarea
              rows={3}
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              className="w-full rounded-xl border-outline-variant bg-surface p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Mỗi ý một dòng"
            />
          </div>
        ) : setFeedbackText ? (
          <div>
            <textarea
              rows={3}
              value={feedbackText ?? ""}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full rounded-xl border-outline-variant bg-surface p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Nhận xét tổng thể"
            />
          </div>
        ) : null}
      </div>

      </div>
      <div className="-mx-4 -mb-4 mt-3 flex shrink-0 flex-wrap items-center gap-2 border-t border-outline-variant/55 bg-surface px-4 py-3">
        {!gradingComplete ? (
          <span role="status" className="mr-auto inline-flex items-center gap-1.5 text-xs font-bold text-amber-700">
            <WarningCircle size={15} weight="fill" />
            Còn thiếu {missingCriteriaCount}/4 tiêu chí
          </span>
        ) : null}
        <button
          type="button"
          disabled={saving || published || !gradingComplete}
          onClick={() => void onSave(false)}
          title={gradingComplete ? "Lưu điểm và nhận xét" : `Còn thiếu ${missingCriteriaCount} tiêu chí`}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-primary px-4 text-xs font-bold text-primary transition hover:bg-primary/10 disabled:opacity-50"
        >
          <FloppyDisk size={16} />
          Lưu bản chấm
        </button>
        <button
          type="button"
          disabled={saving || !gradingComplete}
          onClick={() => void onSave(true)}
          title={gradingComplete ? "Công bố kết quả chấm" : `Còn thiếu ${missingCriteriaCount} tiêu chí`}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-on-primary transition hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? <CircleNotch size={16} className="animate-spin" /> : <PaperPlaneTilt size={16} />}
          Công bố
        </button>
      </div>
    </section>
  );
}

function FeedbackLists({ strengths, improvements }: { strengths: string[]; improvements: string[] }) {
  if (!strengths.length && !improvements.length) return null;
  return <div className="mt-4 grid gap-3 sm:grid-cols-2">{strengths.length ? <div><strong className="text-xs">Điểm mạnh</strong><ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5">{strengths.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}{improvements.length ? <div><strong className="text-xs">Cần cải thiện</strong><ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5">{improvements.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}</div>;
}

function Search({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="relative block w-full max-w-md"><span className="sr-only">{placeholder}</span><MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"/><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-11 w-full rounded-xl border-outline-variant bg-surface pl-10 text-sm"/></label>; }
function ErrorNotice({ value }: { value: string }) { return <div role="alert" className="my-3 flex items-center gap-2 rounded-xl border border-error/25 bg-error-container/35 p-3 text-sm text-on-error-container"><WarningCircle size={18}/>{value}</div>; }
function Loading() { return <p className="flex items-center justify-center gap-2 p-8 text-sm text-on-surface-variant"><CircleNotch className="animate-spin"/> Đang tải...</p>; }
function Empty({ text }: { text: string }) { return <div className="grid min-h-52 place-content-center text-center text-sm text-on-surface-variant">{text}</div>; }
function validBand(value: string) { return value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 9 && Number.isInteger(Number(value) * 2); }
function calculatedBand(criteria: string[], bands: Record<string, string>) { if (criteria.length !== 4 || criteria.some((key) => !validBand(bands[key] ?? ""))) return ""; return (Math.round(criteria.reduce((sum, key) => sum + Number(bands[key]), 0) / criteria.length * 2) / 2).toFixed(1); }
function formatBand(value: number | null) { return value == null ? "-" : value.toFixed(1); }
function compactWritingLabel(value: string) { return value === "coherence_cohesion" ? "Coherence" : value === "lexical_resource" ? "Lexical" : value === "grammatical_range_accuracy" ? "Grammar" : writingLabels[value] ?? value; }
function writingSource(item: WritingEvaluation) { return item.attemptOrigin === "SELF_PRACTICE" ? "Bài viết tự do" : item.courseSkillPair === "SPEAKING_WRITING" ? item.courseCode ? `Khóa ${item.courseCode}` : "Khóa Writing & Speaking" : "Bài theo lớp"; }
function taskLabel(value: string) { return value === "task_2" ? "Academic Task 2" : "Academic Task 1"; }
function shortDate(value: string) { return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)); }
function percent(value: number | null) { return value == null ? "Chưa có" : `${value.toFixed(1)}%`; }
function lines(value: string) { return value.split("\n").map((item) => item.trim()).filter(Boolean); }
function wordCount(value: string) { return value.trim() ? value.trim().split(/\s+/).length : 0; }
function message(reason: unknown, fallback: string) { return reason instanceof Error ? reason.message : fallback; }
function filterItems<T>(items: T[], query: string, text: (item: T) => string) { const value = query.trim().toLowerCase(); return value ? items.filter((item) => text(item).toLowerCase().includes(value)) : items; }
function replace<T extends { id: string }>(setItems: React.Dispatch<React.SetStateAction<T[]>>, updated: T) { setItems((current) => current.map((item) => item.id === updated.id ? updated : item)); }
function toLocalInput(value: string | null) { if (!value) return ""; const date = new Date(value); const offset = date.getTimezoneOffset(); return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16); }
