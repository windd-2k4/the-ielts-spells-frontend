import {
  ArrowClockwise, Brain, CaretDown, ChartBar, CheckCircle, CircleNotch, ClipboardText, FloppyDisk,
  Infinity as InfinityIcon, MagnifyingGlass, Microphone, NotePencil, PaperPlaneTilt,
  ShieldCheck, Sparkle, UsersThree, WarningCircle,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import AuthenticatedMediaImage from "../components/test-builder/AuthenticatedMediaImage";
import { apiFetch } from "../lib/api";

type Criterion = { aiBand: number | null; teacherBand: number | null; aiFeedback: string | null; teacherFeedback?: string | null };
type TeacherAnnotation = { id: string | null; start: number; end: number; selectedText: string | null; replacement: string | null; comment: string | null; criterion: string | null; kind: "COMMENT" | "REPLACE" | "HIGHLIGHT" | null; severity: "SUGGESTION" | "ERROR" | "MAJOR" | null };
type WritingEvaluation = {
  id: string; studentName: string; studentCode: string; testTitle: string; taskKey: string; taskType: string; essayText: string;
  attemptOrigin: "ASSIGNMENT" | "SELF_PRACTICE"; courseCode: string | null; courseName: string | null; courseSkillPair: string | null;
  status: string; teacherStatus: string; overallBandAi: number | null; overallBandTeacher: number | null;
  criteria: Record<string, Criterion>; aiStrengths: string[]; aiImprovements: string[];
  strengths: string[]; improvements: string[]; errorMessage: string | null; createdAt: string;
  teacherEditedText: string | null; teacherAnnotations: TeacherAnnotation[]; teacherRevision: number;
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
        {canManageAi ? <Tab active={tab === "access"} onClick={() => setTab("access")} icon={<UsersThree/>}>Quyền AI Writing</Tab> : null}
      </nav>
      <div className="ml-auto hidden items-center gap-2 rounded-xl bg-surface-container-low px-3 py-2 text-xs font-bold text-on-surface-variant xl:flex"><ShieldCheck size={18} className="text-primary"/> Điểm giáo viên hiện sau khi công bố</div>
    </header>
    {tab === "overview" ? <OverviewPanel/> : tab === "writing" ? <WritingPanel/> : tab === "speaking" ? <SpeakingPanel/> : <EntitlementsPanel/>}
  </div>;
}

function Tab({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} aria-current={active ? "page" : undefined} className={`my-1.5 inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-bold transition ${active ? "bg-primary-fixed/45 text-primary" : "text-on-surface-variant hover:bg-surface-container-low"}`}>{icon}{children}</button>;
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
  const [reviewMode, setReviewMode] = useState<"ai" | "teacher">("ai");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [bands, setBands] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [editedText, setEditedText] = useState("");
  const [annotations, setAnnotations] = useState<TeacherAnnotation[]>([]);
  const [draftDirty, setDraftDirty] = useState(false);
  const [draftStatus, setDraftStatus] = useState<"saved" | "saving" | "error">("saved");
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const criterionKeys = useMemo(() => selected ? [selected.taskType === "task_2" ? "task_response" : "task_achievement", "coherence_cohesion", "lexical_resource", "grammatical_range_accuracy"] : [], [selected?.taskType]);
  const overallBand = calculatedBand(criterionKeys, bands);

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
    setAnnotations(selected.teacherAnnotations ?? []);
    setDraftDirty(false); setDraftStatus("saved");
  }, [criterionKeys, selectedId, selected?.teacherStatus]);
  useEffect(() => {
    if (!selected || !draftDirty) return;
    const timer = window.setTimeout(() => {
      setDraftStatus("saving");
      void apiFetch<WritingEvaluation>(`/admin/writing-evaluations/${selected.id}/draft`, {
        method: "PUT", body: JSON.stringify({ editedText, annotations }),
      }).then((updated) => { replace(setItems, updated); setDraftDirty(false); setDraftStatus("saved"); })
        .catch((reason) => { setDraftStatus("error"); setError(message(reason, "Không thể tự lưu bản sửa.")); });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [selectedId, draftDirty, editedText, annotations]);
  function changeEditedText(value: string) { setEditedText(value); setDraftDirty(true); setDraftStatus("saving"); }
  function changeAnnotations(value: React.SetStateAction<TeacherAnnotation[]>) { setAnnotations(value); setDraftDirty(true); setDraftStatus("saving"); }
  async function save(publish: boolean) {
    if (!selected || !validBand(overallBand) || criterionKeys.some((key) => !validBand(bands[key] ?? ""))) {
      setError("Nhập đủ bốn điểm tiêu chí và điểm tổng từ 0 đến 9, theo bước 0.5."); return;
    }
    const criteria = Object.fromEntries(criterionKeys.map((key) => [key, { band: Number(bands[key]), feedback: feedback[key] ?? "" }]));
    setSaving(true); setError("");
    try {
      const updated = await apiFetch<WritingEvaluation>(`/admin/writing-evaluations/${selected.id}/review`, { method: "PUT", body: JSON.stringify({ overallBand: Number(overallBand), criteria, strengths: lines(strengths), improvements: lines(improvements), publish, editedText, annotations }) });
      replace(setItems, updated);
      setDraftDirty(false); setDraftStatus("saved");
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
      meta={`${taskLabel(item.taskType)} · ${wordCount(item.essayText)} từ · ${shortDate(item.createdAt)}`}/>) }
    empty={!selected ? "Không có bài Writing phù hợp với bộ lọc." : undefined}>
    {selected ? <div className="space-y-4">
      <WritingEvaluationBar evaluation={selected} criteria={criterionKeys}/>
      <section className="grid items-start gap-4 2xl:grid-cols-[minmax(0,1.08fr)_minmax(440px,.92fr)]">
        <WritingReviewEditor evaluation={selected} prompt={prompt} editedText={editedText} setEditedText={changeEditedText} annotations={annotations} setAnnotations={changeAnnotations} draftStatus={draftStatus}/>
        <div className="space-y-3 2xl:sticky 2xl:top-0">
          <ReviewSwitcher value={reviewMode} onChange={setReviewMode}/>
          {reviewMode === "ai"
            ? <AiSummary status={selected.status} overall={selected.overallBandAi} criteria={selected.criteria} labels={writingLabels} strengths={selected.aiStrengths} improvements={selected.aiImprovements} error={selected.errorMessage} onRetry={selected.status === "FAILED" ? retry : undefined}/>
            : <TeacherForm overall={overallBand} setOverall={() => undefined} overallReadOnly criteria={criterionKeys} labels={writingLabels} bands={bands} setBands={setBands} feedback={feedback} setFeedback={setFeedback} strengths={strengths} setStrengths={setStrengths} improvements={improvements} setImprovements={setImprovements} saving={saving} published={selected.teacherStatus === "PUBLISHED"} onSave={save}/>}
        </div>
      </section>
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
  const [overall, setOverall] = useState("");
  const [feedback, setFeedback] = useState("");
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const keys = Object.keys(speakingLabels);

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
    setFeedback(selected.teacherFeedback ?? ""); setStrengths(selected.teacherStrengths.join("\n")); setImprovements(selected.teacherImprovements.join("\n"));
  }, [selectedId, selected?.teacherStatus]);
  const filtered = useMemo(() => filterItems(items, query, (item) => `${item.studentName} ${item.testTitle} ${item.questionKey}`), [items, query]);

  async function save(publish: boolean) {
    if (!selected || !validBand(overall) || keys.some((key) => !validBand(bands[key] ?? ""))) { setError("Nhập đủ bốn điểm Speaking và điểm tổng theo bước 0.5."); return; }
    setSaving(true); setError("");
    try {
      const updated = await apiFetch<SpeakingEvaluation>(`/admin/speaking-evaluations/${selected.id}/review`, { method: "PUT", body: JSON.stringify({
        overallBand: Number(overall), fluencyBand: Number(bands.fluency_coherence), lexicalBand: Number(bands.lexical_resource),
        grammarBand: Number(bands.grammatical_range_accuracy), pronunciationBand: Number(bands.pronunciation), feedback,
        strengths: lines(strengths), improvements: lines(improvements), publish,
      }) });
      replace(setItems, updated);
    } catch (reason) { setError(message(reason, "Không thể lưu đánh giá Speaking.")); }
    finally { setSaving(false); }
  }

  return <EvaluationLayout loading={loading} error={error} query={query} setQuery={setQuery} onRefresh={load}
    queueTitle="Bài Speaking" count={filtered.length}
    list={filtered.map((item) => <QueueItem key={item.id} active={item.id === selectedId} onClick={() => setSelectedId(item.id)} ai="AI đã chấm" teacher={teacherStatuses[item.teacherStatus] ?? item.teacherStatus} title={item.studentName} subtitle={item.testTitle} source="Speaking" meta={`${item.questionKey} · ${shortDate(item.createdAt)}`}/>) }
    empty={!selected ? "Chưa có bài Speaking được ghi nhận." : undefined}>
    {selected ? <div className="space-y-6">
      <EvaluationHeading student={selected.studentName} title={selected.testTitle} meta={selected.questionKey} teacherStatus={selected.teacherStatus}/>
      <section className="grid gap-5 xl:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)]">
        <InfoBlock title="Transcript" text={selected.transcript || "Chưa có transcript."} serif/>
        <div className="space-y-4">
          <AiSummary status={selected.aiStatus} overall={selected.overallBandAi} criteria={selected.criteria} labels={speakingLabels} strengths={selected.aiStrengths} improvements={selected.aiImprovements}/>
          <TeacherForm overall={overall} setOverall={setOverall} criteria={keys} labels={speakingLabels} bands={bands} setBands={setBands} feedbackText={feedback} setFeedbackText={setFeedback} strengths={strengths} setStrengths={setStrengths} improvements={improvements} setImprovements={setImprovements} saving={saving} published={selected.teacherStatus === "PUBLISHED"} onSave={save}/>
        </div>
      </section>
    </div> : null}
  </EvaluationLayout>;
}

function EntitlementsPanel() {
  const [items, setItems] = useState<Entitlement[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  async function load() {
    setLoading(true); setError("");
    try { setItems(await apiFetch<Entitlement[]>("/admin/writing-evaluations/entitlements")); }
    catch (reason) { setError(message(reason, "Không tải được quyền AI Writing.")); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  const filtered = useMemo(() => filterItems(items, query, (item) => `${item.studentCode} ${item.studentName} ${item.email ?? ""}`), [items, query]);
  function update(id: string, patch: Partial<Entitlement>) { setItems((current) => current.map((item) => item.studentId === id ? { ...item, ...patch } : item)); }
  async function save(item: Entitlement) {
    setSavingId(item.studentId); setError("");
    try {
      const updated = await apiFetch<Entitlement>(`/admin/writing-evaluations/entitlements/${item.studentId}`, { method: "PUT", body: JSON.stringify({ mode: item.mode, monthlyLimit: item.mode === "LIMITED" ? item.monthlyLimit : null, expiresAt: item.expiresAt, note: item.note }) });
      update(item.studentId, updated);
    } catch (reason) { setError(message(reason, "Không thể cập nhật quyền AI.")); }
    finally { setSavingId(""); }
  }
  return <section className="rounded-[22px] border border-outline-variant/55 bg-surface-container-lowest p-5">
    <div className="flex flex-col gap-4 border-b border-outline-variant/55 pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div><h2 className="font-display text-xl font-extrabold">Quyền chấm AI Writing</h2><p className="mt-1 text-sm text-on-surface-variant">Giới hạn theo tháng hoặc bật không giới hạn cho từng học viên. Giới hạn toàn hệ thống vẫn được áp dụng.</p></div>
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
  return <>{error ? <ErrorNotice value={error}/> : null}<section className="grid min-h-[720px] overflow-hidden rounded-2xl border border-outline-variant/55 bg-surface-container-lowest xl:grid-cols-[340px_minmax(0,1fr)]">
    <aside className="flex min-h-0 flex-col border-b border-outline-variant/55 bg-surface-container-low/35 xl:border-b-0 xl:border-r">
      <div className="border-b border-outline-variant/55 p-3">
        <div className="flex items-center justify-between gap-3 px-1"><div><h2 className="text-sm font-extrabold">{queueTitle}</h2><p className="mt-0.5 text-xs text-on-surface-variant">{count} bài phù hợp</p></div><button type="button" aria-label="Làm mới danh sách" title="Làm mới danh sách" disabled={loading} onClick={() => void onRefresh()} className="grid size-10 shrink-0 place-content-center rounded-xl border border-outline-variant bg-surface text-on-surface-variant transition hover:text-primary disabled:opacity-50"><ArrowClockwise className={loading ? "animate-spin" : ""}/></button></div>
        <div className="mt-3"><Search value={query} onChange={setQuery} placeholder="Tìm học viên hoặc đề"/></div>
        {filters ? <div className="mt-3">{filters}</div> : null}
      </div>
      <div className="custom-scrollbar min-h-[480px] flex-1 overflow-y-auto p-3 xl:max-h-[calc(100dvh-245px)]">{loading ? <Loading/> : list}</div>
      {pagination ? <div className="border-t border-outline-variant/55 p-3">{pagination}</div> : null}
    </aside>
    <div className="custom-scrollbar min-w-0 overflow-y-auto p-4 lg:p-5">{empty ? <Empty text={empty}/> : children}</div>
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
    <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-container p-1" aria-label="Lọc nguồn bài Writing">{sourceOptions.map((option) => <button key={option.value} type="button" aria-pressed={source === option.value} onClick={() => onSourceChange(option.value)} className={`min-h-9 rounded-lg px-2 text-[11px] font-bold transition ${source === option.value ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}><span>{option.label}</span><span className="ml-1 tabular-nums opacity-70">{option.count}</span></button>)}</div>
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
  return <section className="overflow-x-auto rounded-2xl border border-outline-variant/55" aria-label="Thông tin và bảng điểm Writing">
    <div className="grid min-w-[880px] grid-cols-[minmax(220px,1.45fr)_repeat(6,minmax(96px,.75fr))] gap-px bg-outline-variant/55">
      <div className="min-w-0 bg-surface px-3 py-2.5">
        <div className="flex items-center gap-2"><strong className="min-w-0 flex-1 truncate text-xs text-primary">{evaluation.studentName} · {evaluation.studentCode}</strong>{evaluation.teacherStatus === "PUBLISHED" ? <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">Đã công bố</span> : null}</div>
        <h2 className="mt-1 truncate font-display text-base font-extrabold leading-5">{evaluation.testTitle}</h2>
        <p className="mt-0.5 truncate text-[10px] text-on-surface-variant">{writingSource(evaluation)} · {taskLabel(evaluation.taskType)} · {wordCount(evaluation.essayText)} từ</p>
      </div>
      <ScoreCell label="AI Overall" value={formatBand(evaluation.overallBandAi)} note={aiStatuses[evaluation.status] ?? evaluation.status} emphasis/>
      <ScoreCell label="Giáo viên" value={formatBand(evaluation.overallBandTeacher)} note={teacherStatuses[evaluation.teacherStatus] ?? evaluation.teacherStatus}/>
      {criteria.map((key) => <ScoreCell key={key} label={compactWritingLabel(key)} value={formatBand(evaluation.criteria[key]?.teacherBand ?? evaluation.criteria[key]?.aiBand ?? null)} note={evaluation.criteria[key]?.teacherBand != null ? `GV · AI ${formatBand(evaluation.criteria[key]?.aiBand ?? null)}` : "Điểm AI"}/>) }
    </div>
  </section>;
}

function ScoreCell({ label, value, note, emphasis = false }: { label: string; value: string; note: string; emphasis?: boolean }) {
  return <div className={`min-h-[76px] min-w-0 px-2.5 py-2 ${emphasis ? "bg-primary text-on-primary" : "bg-surface"}`}><span className={`block truncate text-[9px] font-extrabold uppercase tracking-[.05em] ${emphasis ? "text-on-primary/75" : "text-on-surface-variant"}`}>{label}</span><strong className="mt-0.5 block truncate font-display text-xl leading-6 tabular-nums">{value}</strong><span className={`mt-0.5 block truncate text-[9px] font-semibold ${emphasis ? "text-on-primary/75" : "text-on-surface-variant"}`}>{note}</span></div>;
}

function WritingReviewEditor({ evaluation, prompt, editedText, setEditedText, annotations, setAnnotations, draftStatus }: {
  evaluation: WritingEvaluation;
  prompt: string;
  editedText: string;
  setEditedText: (value: string) => void;
  annotations: TeacherAnnotation[];
  setAnnotations: React.Dispatch<React.SetStateAction<TeacherAnnotation[]>>;
  draftStatus: "saved" | "saving" | "error";
}) {
  const [view, setView] = useState<"edit" | "compare">("edit");
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [comment, setComment] = useState("");
  const [replacement, setReplacement] = useState("");
  const [criterion, setCriterion] = useState("");
  const [kind, setKind] = useState<TeacherAnnotation["kind"]>("COMMENT");
  const [severity, setSeverity] = useState<TeacherAnnotation["severity"]>("SUGGESTION");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const selectedText = editedText.slice(selection.start, selection.end);
  const paragraphs = (view === "edit" ? editedText : evaluation.essayText).split(/\n+/).map((item) => item.trim()).filter(Boolean);

  function readSelection() {
    const element = textareaRef.current;
    if (!element) return;
    setSelection({ start: element.selectionStart, end: element.selectionEnd });
  }

  function openAnnotation() {
    readSelection();
    setShowAnnotation(true);
  }

  function saveAnnotation() {
    if (selection.end <= selection.start || !selectedText.trim()) return;
    const nextReplacement = kind === "REPLACE" ? replacement : "";
    const annotation: TeacherAnnotation = {
      id: crypto.randomUUID(), start: selection.start, end: selection.end, selectedText,
      replacement: nextReplacement || null, comment: comment.trim() || null,
      criterion: criterion || null, kind, severity,
    };
    if (nextReplacement) setEditedText(editedText.slice(0, selection.start) + nextReplacement + editedText.slice(selection.end));
    setAnnotations((current) => [...current, annotation]);
    setComment(""); setReplacement(""); setCriterion(""); setShowAnnotation(false);
  }

  return <article className="overflow-hidden rounded-2xl border border-outline-variant/55 bg-surface">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/55 px-4 py-3">
      <div className="flex items-center gap-2"><ClipboardText size={19} className="text-primary"/><div><h3 className="text-sm font-extrabold">Bài viết của học viên</h3><p className="text-[11px] text-on-surface-variant">Bản gốc được giữ nguyên · Revision {evaluation.teacherRevision ?? 0}</p></div></div>
      <div className="flex rounded-lg bg-surface-container p-1 text-xs font-bold"><button type="button" onClick={() => setView("edit")} className={`rounded-md px-3 py-1.5 ${view === "edit" ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant"}`}>Sửa bài</button><button type="button" onClick={() => setView("compare")} className={`rounded-md px-3 py-1.5 ${view === "compare" ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant"}`}>So sánh</button></div>
    </header>
    <div className="border-b border-outline-variant/55 bg-surface-container-low/60 p-4"><span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-primary">Đề bài</span><p className="mt-2 whitespace-pre-wrap text-sm font-semibold italic leading-6">{prompt}</p>{evaluation.taskContext.imageUrl ? <div className="mt-3 overflow-hidden rounded-xl border border-outline-variant/55 bg-white p-2"><AuthenticatedMediaImage fileUrl={evaluation.taskContext.imageUrl} alt={evaluation.taskContext.imageAltText || "Hình đề IELTS Writing Task 1"} className="mx-auto max-h-[320px] w-auto object-contain"/></div> : null}</div>
    {view === "edit" ? <>
      <div className="flex flex-wrap items-center gap-2 border-b border-outline-variant/55 px-4 py-2.5 text-xs font-bold"><button type="button" onClick={openAnnotation} disabled={selection.end <= selection.start} className="min-h-9 rounded-lg bg-primary px-3 text-on-primary disabled:cursor-not-allowed disabled:opacity-45">Thêm nhận xét</button><span className="text-on-surface-variant">Bôi chọn một đoạn trong bài để gắn lỗi hoặc đề xuất sửa.</span><span className="ml-auto text-[11px] font-semibold text-on-surface-variant">{draftStatus === "saving" ? "Đang tự lưu…" : draftStatus === "error" ? "Tự lưu lỗi" : "Đã tự lưu"}</span></div>
      <textarea ref={textareaRef} value={editedText} onChange={(event) => setEditedText(event.target.value)} onSelect={readSelection} className="min-h-[430px] w-full resize-y border-0 bg-surface p-5 text-[15px] leading-7 outline-none focus:ring-2 focus:ring-inset focus:ring-primary" aria-label="Bản giáo viên sửa trực tiếp" />
      {showAnnotation ? <div className="m-4 rounded-xl border border-primary/30 bg-primary-fixed/15 p-4"><div className="flex items-center justify-between gap-3"><strong className="text-sm">Gắn nhận xét cho đoạn đã chọn</strong><button type="button" onClick={() => setShowAnnotation(false)} className="text-xs font-bold text-on-surface-variant">Hủy</button></div><p className="mt-2 rounded-lg bg-surface px-3 py-2 text-xs italic text-on-surface-variant">“{selectedText.slice(0, 180)}{selectedText.length > 180 ? "…" : ""}”</p><div className="mt-3 grid gap-3 sm:grid-cols-3"><label className="text-xs font-bold">Loại<select value={kind ?? "COMMENT"} onChange={(event) => setKind(event.target.value as TeacherAnnotation["kind"])} className="mt-1 min-h-10 w-full rounded-lg border-outline-variant text-sm"><option value="COMMENT">Nhận xét</option><option value="REPLACE">Đề xuất sửa</option><option value="HIGHLIGHT">Đánh dấu</option></select></label><label className="text-xs font-bold">Tiêu chí<select value={criterion} onChange={(event) => setCriterion(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border-outline-variant text-sm"><option value="">Chưa gắn tiêu chí</option>{Object.entries(writingLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className="text-xs font-bold">Mức độ<select value={severity ?? "SUGGESTION"} onChange={(event) => setSeverity(event.target.value as TeacherAnnotation["severity"])} className="mt-1 min-h-10 w-full rounded-lg border-outline-variant text-sm"><option value="SUGGESTION">Gợi ý</option><option value="ERROR">Lỗi</option><option value="MAJOR">Lỗi nghiêm trọng</option></select></label></div>{kind === "REPLACE" ? <label className="mt-3 block text-xs font-bold">Nội dung đề xuất<input value={replacement} onChange={(event) => setReplacement(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border-outline-variant text-sm" placeholder="Nhập câu hoặc từ thay thế"/></label> : null}<label className="mt-3 block text-xs font-bold">Nhận xét<textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border-outline-variant text-sm" placeholder="Giải thích lỗi và hướng cải thiện"/></label><button type="button" disabled={!comment.trim() && kind !== "HIGHLIGHT" && !replacement.trim()} onClick={saveAnnotation} className="mt-3 min-h-10 rounded-lg bg-primary px-4 text-xs font-bold text-on-primary disabled:opacity-45">Lưu nhận xét</button></div> : null}
    </> : <div className="grid gap-px bg-outline-variant/55 md:grid-cols-2"><div className="bg-rose-50/40 p-5"><span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-rose-700">Bản gốc học viên</span><div className="mt-3 space-y-5 text-[15px] leading-7">{evaluation.essayText.split(/\n+/).filter(Boolean).map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)}</div></div><div className="bg-emerald-50/35 p-5"><span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-emerald-700">Bản giáo viên sửa</span><div className="mt-3 space-y-5 text-[15px] leading-7">{paragraphs.length ? paragraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>) : <p className="text-on-surface-variant">Chưa có bản sửa.</p>}</div></div></div>}
    {annotations.length ? <footer className="border-t border-outline-variant/55 bg-surface-container-low/50 px-4 py-3"><div className="flex items-center justify-between gap-3"><strong className="text-xs">Nhận xét trong bài ({annotations.length})</strong><span className="text-[11px] text-on-surface-variant">Sẽ hiển thị cho học viên sau khi công bố</span></div><div className="mt-2 grid gap-2">{annotations.map((item) => <div key={item.id ?? `${item.start}-${item.end}`} className="flex items-start justify-between gap-3 rounded-lg bg-surface p-2.5 text-xs"><div><span className="font-bold text-primary">{item.criterion ? writingLabels[item.criterion] : "Nhận xét chung"}</span><p className="mt-1 italic text-on-surface-variant">“{item.selectedText}”</p>{item.comment ? <p className="mt-1">{item.comment}</p> : null}{item.replacement ? <p className="mt-1 text-emerald-700">Đề xuất: {item.replacement}</p> : null}</div><button type="button" aria-label="Xóa nhận xét" onClick={() => setAnnotations((current) => current.filter((value) => value.id !== item.id))} className="shrink-0 font-bold text-on-surface-variant">Xóa</button></div>)}</div></footer> : null}
  </article>;
  }

function ReviewSwitcher({ value, onChange }: { value: "ai" | "teacher"; onChange: (value: "ai" | "teacher") => void }) {
  return <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-container p-1" aria-label="Chọn loại đánh giá"><button type="button" aria-pressed={value === "ai"} onClick={() => onChange("ai")} className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold transition ${value === "ai" ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant"}`}><Sparkle/>Đánh giá AI</button><button type="button" aria-pressed={value === "teacher"} onClick={() => onChange("teacher")} className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold transition ${value === "teacher" ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant"}`}><Brain/>Chấm giáo viên</button></div>;
}

function AiSummary({ status, overall, criteria, labels, strengths, improvements, error, onRetry }: { status: string; overall: number | null; criteria: Record<string, Criterion>; labels: Record<string, string>; strengths: string[]; improvements: string[]; error?: string | null; onRetry?: () => Promise<void> }) {
  return <section className="rounded-2xl border border-primary/25 bg-primary-fixed/20 p-5"><div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-sm font-extrabold"><Sparkle className="text-primary"/>Đánh giá của AI</h3><span className="text-xs font-bold text-primary">{aiStatuses[status] ?? status}</span></div>{overall == null ? <p className="mt-4 text-sm text-on-surface-variant">{status === "NOT_ELIGIBLE" ? "Học viên không có quyền AI cho lần nộp này. Giáo viên vẫn có thể chấm bình thường." : error || "Chưa có kết quả AI."}{onRetry ? <button type="button" onClick={() => void onRetry()} className="ml-2 min-h-11 font-bold text-primary">Thử lại</button> : null}</p> : <><div className="mt-4 flex items-end gap-2"><strong className="font-display text-4xl text-primary">{overall.toFixed(1)}</strong><span className="pb-1 text-xs font-bold text-on-surface-variant">Overall band</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{Object.entries(criteria).filter(([, value]) => value.aiBand != null).map(([key, value]) => <div key={key} className="rounded-xl bg-surface p-3"><div className="flex justify-between gap-3 text-xs font-bold"><span>{labels[key] ?? key}</span><strong>{value.aiBand?.toFixed(1)}</strong></div>{value.aiFeedback ? <p className="mt-2 text-xs leading-5 text-on-surface-variant">{value.aiFeedback}</p> : null}</div>)}</div><FeedbackLists strengths={strengths} improvements={improvements}/></>}</section>;
}

function TeacherForm({ overall, setOverall, overallReadOnly = false, criteria, labels, bands, setBands, feedback, setFeedback, feedbackText, setFeedbackText, strengths, setStrengths, improvements, setImprovements, saving, published, onSave }: { overall: string; setOverall: (value: string) => void; overallReadOnly?: boolean; criteria: string[]; labels: Record<string, string>; bands: Record<string, string>; setBands: React.Dispatch<React.SetStateAction<Record<string, string>>>; feedback?: Record<string, string>; setFeedback?: React.Dispatch<React.SetStateAction<Record<string, string>>>; feedbackText?: string; setFeedbackText?: (value: string) => void; strengths: string; setStrengths: (value: string) => void; improvements: string; setImprovements: (value: string) => void; saving: boolean; published: boolean; onSave: (publish: boolean) => Promise<void> }) {
  return <section className="rounded-2xl border border-outline-variant/65 bg-surface p-5"><div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-sm font-extrabold"><Brain className="text-primary"/>Chấm của giáo viên</h3>{published ? <span className="text-xs font-bold text-emerald-700">Đã công bố</span> : null}</div><label className="mt-4 block text-xs font-bold">Overall band<input type="number" min="0" max="9" step="0.5" value={overall} readOnly={overallReadOnly} aria-describedby={overallReadOnly ? "writing-overall-help" : undefined} onChange={(event) => setOverall(event.target.value)} className="mt-2 min-h-11 w-28 rounded-xl border-outline-variant text-lg font-extrabold read-only:bg-surface-container-low"/></label>{overallReadOnly ? <p id="writing-overall-help" className="mt-2 text-xs text-on-surface-variant">Tự tính trung bình bốn tiêu chí và làm tròn đến 0.5.</p> : null}<div className="mt-4 grid gap-3 sm:grid-cols-2">{criteria.map((key) => <div key={key} className="rounded-xl border border-outline-variant/65 p-3"><label className="flex items-center justify-between gap-3 text-xs font-extrabold">{labels[key] ?? key}<input aria-label={`Band ${labels[key] ?? key}`} type="number" min="0" max="9" step="0.5" value={bands[key] ?? ""} onChange={(event) => setBands((current) => ({ ...current, [key]: event.target.value }))} className="w-20 rounded-lg border-outline-variant"/></label>{feedback && setFeedback ? <textarea aria-label={`Nhận xét ${labels[key] ?? key}`} rows={3} value={feedback[key] ?? ""} onChange={(event) => setFeedback((current) => ({ ...current, [key]: event.target.value }))} className="mt-3 w-full rounded-xl border-outline-variant text-sm" placeholder="Nhận xét tiêu chí"/> : null}</div>)}</div>{setFeedbackText ? <label className="mt-4 block text-xs font-bold">Nhận xét tổng<textarea rows={3} value={feedbackText ?? ""} onChange={(event) => setFeedbackText(event.target.value)} className="mt-2 w-full rounded-xl border-outline-variant text-sm"/></label> : null}<div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold">Điểm mạnh<textarea rows={4} value={strengths} onChange={(event) => setStrengths(event.target.value)} className="mt-2 w-full rounded-xl border-outline-variant text-sm" placeholder="Mỗi ý một dòng"/></label><label className="text-xs font-bold">Cần cải thiện<textarea rows={4} value={improvements} onChange={(event) => setImprovements(event.target.value)} className="mt-2 w-full rounded-xl border-outline-variant text-sm" placeholder="Mỗi ý một dòng"/></label></div><div className="mt-5 flex flex-wrap justify-end gap-3"><button type="button" disabled={saving || published} onClick={() => void onSave(false)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary px-4 text-sm font-bold text-primary disabled:opacity-50"><FloppyDisk/>Lưu bản chấm</button><button type="button" disabled={saving} onClick={() => void onSave(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary disabled:opacity-50">{saving ? <CircleNotch className="animate-spin"/> : <PaperPlaneTilt/>}Công bố</button></div></section>;
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
function formatBand(value: number | null) { return value == null ? "Chưa có" : value.toFixed(1); }
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
