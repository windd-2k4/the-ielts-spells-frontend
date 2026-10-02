import { CheckCircle, CircleNotch, FloppyDisk, MagnifyingGlass, PaperPlaneTilt, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

type Criterion = { aiBand: number | null; teacherBand: number | null; aiFeedback: string | null; teacherFeedback: string | null };
type Evaluation = { id: string; studentName: string; testTitle: string; taskKey: string; taskType: string; essayText: string; status: string; overallBandAi: number | null; overallBandTeacher: number | null; criteria: Record<string, Criterion>; strengths: string[]; improvements: string[]; errorMessage: string | null; createdAt: string };
const labels: Record<string, string> = { task_achievement: "Task Achievement", task_response: "Task Response", coherence_cohesion: "Coherence & Cohesion", lexical_resource: "Lexical Resource", grammatical_range_accuracy: "Grammar Range & Accuracy" };

export function WritingEvaluationsPage() {
  const [items, setItems] = useState<Evaluation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [bands, setBands] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [overallBand, setOverallBand] = useState("");
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const selectedCriterionKeys = selected
    ? [selected.taskType === "task_2" ? "task_response" : "task_achievement", "coherence_cohesion", "lexical_resource", "grammatical_range_accuracy"]
    : [];

  async function load() {
    setLoading(true); setError("");
    try {
      const values = await apiFetch<Evaluation[]>("/admin/writing-evaluations");
      setItems(values); setSelectedId((current) => current || values[0]?.id || "");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không tải được hàng chờ chấm Writing."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!selected) return;
    setOverallBand(String(selected.overallBandTeacher ?? selected.overallBandAi ?? ""));
    const keys = [selected.taskType === "task_2" ? "task_response" : "task_achievement", "coherence_cohesion", "lexical_resource", "grammatical_range_accuracy"];
    setBands(Object.fromEntries(keys.map((key) => [key, String(selected.criteria[key]?.teacherBand ?? selected.criteria[key]?.aiBand ?? "")])));
    setFeedback(Object.fromEntries(keys.map((key) => [key, selected.criteria[key]?.teacherFeedback ?? selected.criteria[key]?.aiFeedback ?? ""])));
    setStrengths(selected.strengths.join("\n")); setImprovements(selected.improvements.join("\n"));
  }, [selected]);
  const filtered = useMemo(() => items.filter((item) => `${item.studentName} ${item.testTitle} ${item.status}`.toLowerCase().includes(query.trim().toLowerCase())), [items, query]);

  async function save(publish: boolean) {
    if (!selected) return;
    const criteria = Object.fromEntries(selectedCriterionKeys.map((key) => [key, { band: Number(bands[key]), feedback: feedback[key] ?? "" }]));
    setSaving(true); setError("");
    try {
      const updated = await apiFetch<Evaluation>(`/admin/writing-evaluations/${selected.id}/review`, { method: "PUT", body: JSON.stringify({ overallBand: Number(overallBand), criteria, strengths: strengths.split("\n").filter(Boolean), improvements: improvements.split("\n").filter(Boolean), publish }) });
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể lưu đánh giá Writing."); }
    finally { setSaving(false); }
  }

  return <div className="mx-auto max-w-[1500px] space-y-5">
    <header className="rounded-[22px] border border-outline-variant/55 bg-surface-container-lowest p-6"><p className="text-xs font-extrabold uppercase tracking-[.14em] text-primary">Assessment quality</p><h1 className="mt-1 font-display text-3xl font-extrabold">Chấm bài Writing</h1><p className="mt-2 text-sm text-on-surface-variant">AI tạo bản nháp qua NVIDIA → Gemini fallback. Giáo viên luôn là người duyệt và công bố kết quả.</p></header>
    {error ? <div role="alert" className="flex items-center gap-2 rounded-xl border border-error/25 bg-error-container/35 p-3 text-sm text-on-error-container"><WarningCircle size={18}/>{error}</div> : null}
    <section className="grid min-h-[680px] overflow-hidden rounded-[22px] border border-outline-variant/55 bg-surface-container-lowest xl:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="border-r border-outline-variant/55">
        <label className="relative m-4 block"><MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm học viên hoặc đề" className="min-h-11 w-full rounded-xl border-outline-variant bg-surface-container-low pl-10 text-sm"/></label>
        <div className="custom-scrollbar max-h-[620px] overflow-y-auto p-2">{loading ? <p className="flex items-center gap-2 p-4"><CircleNotch className="animate-spin"/> Đang tải...</p> : filtered.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`mb-2 w-full rounded-xl border p-4 text-left ${item.id === selectedId ? "border-primary bg-primary-fixed/45" : "border-outline-variant/55 hover:bg-surface-container-low"}`}><span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">{item.status.replaceAll("_", " ")}</span><strong className="mt-1 block text-sm">{item.studentName}</strong><span className="mt-1 block truncate text-xs text-on-surface-variant">{item.testTitle} · {item.taskType.replaceAll("_", " ")}</span></button>)}</div>
      </aside>
      {!selected ? <div className="grid place-content-center text-center text-on-surface-variant">Chọn một bài Writing để chấm.</div> : <div className="custom-scrollbar overflow-y-auto p-6 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><span className="text-xs font-bold text-primary">{selected.studentName}</span><h2 className="mt-1 font-display text-2xl font-extrabold">{selected.testTitle}</h2><p className="mt-1 text-xs text-on-surface-variant">{selected.taskType.replaceAll("_", " ")} · {selected.essayText.trim().split(/\s+/).length} từ</p></div>{selected.status === "PUBLISHED" ? <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"><CheckCircle/>Đã công bố</span> : null}</div>
        <article className="mt-6 whitespace-pre-wrap rounded-2xl border border-outline-variant bg-surface p-6 font-serif text-base leading-8">{selected.essayText}</article>
        <section className="mt-6 grid gap-4 lg:grid-cols-2">{selectedCriterionKeys.map((key) => <div key={key} className="rounded-2xl border border-outline-variant p-4"><label className="text-xs font-extrabold text-on-surface">{labels[key] ?? key}<input type="number" min="0" max="9" step="0.5" value={bands[key] ?? ""} onChange={(event) => setBands((current) => ({...current,[key]:event.target.value}))} className="ml-3 w-20 rounded-lg border-outline-variant"/></label><textarea rows={3} value={feedback[key] ?? ""} onChange={(event) => setFeedback((current) => ({...current,[key]:event.target.value}))} className="mt-3 w-full rounded-xl border-outline-variant text-sm" placeholder="Nhận xét tiêu chí"/></div>)}</section>
        <div className="mt-5 grid gap-4 lg:grid-cols-[180px_1fr_1fr]"><label className="text-xs font-bold">Overall band<input type="number" min="0" max="9" step="0.5" value={overallBand} onChange={(event)=>setOverallBand(event.target.value)} className="mt-2 w-full rounded-xl border-outline-variant text-lg font-extrabold"/></label><label className="text-xs font-bold">Điểm mạnh<textarea rows={4} value={strengths} onChange={(event)=>setStrengths(event.target.value)} className="mt-2 w-full rounded-xl border-outline-variant text-sm" placeholder="Mỗi ý một dòng"/></label><label className="text-xs font-bold">Cần cải thiện<textarea rows={4} value={improvements} onChange={(event)=>setImprovements(event.target.value)} className="mt-2 w-full rounded-xl border-outline-variant text-sm" placeholder="Mỗi ý một dòng"/></label></div>
        <div className="mt-6 flex justify-end gap-3"><button type="button" disabled={saving} onClick={()=>void save(false)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary px-4 text-sm font-bold text-primary"><FloppyDisk/>Lưu đánh giá</button><button type="button" disabled={saving} onClick={()=>void save(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary">{saving?<CircleNotch className="animate-spin"/>:<PaperPlaneTilt/>}Công bố cho học viên</button></div>
      </div>}
    </section>
  </div>;
}
