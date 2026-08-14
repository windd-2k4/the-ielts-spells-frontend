import { useEffect, useMemo, useState } from "react";
import { CalendarDots, Check, Exam, FloppyDisk, Plus, SpinnerGap, Trash, X } from "@phosphor-icons/react";
import type { ScheduleTemplate, ScheduleTemplateEntry, SkillPair, TeacherOption } from "../../academic-types";
import { apiFetch } from "../../lib/api";

type WeeklySlot = { dayOfWeek: number; startsAt: string; endsAt: string; enabled: boolean };
type Props = {
  courseId: string; skillPair: SkillPair; teachers: TeacherOption[];
  onClose: () => void; onApplied: () => Promise<void>;
};

const LR = [
  ["Listening: Multiple Choice", "Reading: Gap-filling & True/False/Not Given"],
  ["Listening: Multiple Choice", "Reading: Gap-filling & True/False/Not Given"],
  ["Listening: Map Labeling", "Reading: Matching Headings"],
  ["Listening: Map Labeling", "Reading: Matching Headings"],
  ["Listening: Diagram & Flow-chart", "Reading: Matching Information"],
  ["Listening: Diagram & Flow-chart", "Reading: Matching Information"],
  ["Listening: Matching Features", "Reading: Multiple Choice"],
  ["Listening: Matching Features", "Reading: Multiple Choice"],
  ["Listening: Sentence Completion", "Reading: Yes/No/Not Given & Matching Endings"],
  ["Listening: Form Completion", "Reading: Review"],
  ["Listening: Note Completion", "Reading: Full Reading Practice test"],
  ["Listening: Full Listening Practice test"], ["Reading: Full Reading Practice test"],
  ["Listening: Full Listening Practice test"], ["Reading: Full Reading Practice test"],
  ["Listening: Full Listening Practice test"], ["Reading: Full Reading Practice test"],
  ["Assessment Test"],
];
const SW = [
  ["Writing: Line Graph", "Speaking: Part 1 Interview"],
  ["Writing: Pie Chart", "Speaking: Part 2 Cue Card"],
  ["Writing: Bar Chart", "Speaking: Part 3 Discussion"],
  ["Writing: Table", "Speaking: Pronunciation & Fluency"],
  ["Writing: Mixed Graph", "Speaking: Vocabulary & Ideas"],
  ["Writing: Map", "Speaking: Part 2 Cue Card"],
  ["Writing: Process", "Speaking: Part 3 Discussion"],
  ["Writing: Task 1 Review", "Speaking: Mock Speaking Test"],
];
export const CONTENT_SUGGESTIONS: Record<SkillPair, string[]> = {
  LISTENING_READING: [
    "Listening: Multiple Choice", "Listening: Map Labeling", "Listening: Diagram & Flow-chart",
    "Listening: Matching Features", "Listening: Sentence Completion", "Listening: Full Listening Practice test",
    "Listening: Form Completion", "Listening: Note Completion", "Listening: Table Completion", "Listening: Summary Completion",
    "Reading: Gap-filling & True/False/Not Given", "Reading: Matching Headings", "Reading: Matching Information",
    "Reading: Multiple Choice", "Reading: Yes/No/Not Given & Matching Endings", "Reading: Full Reading Practice test",
  ],
  SPEAKING_WRITING: [
    "Writing: Line Graph", "Writing: Pie Chart", "Writing: Bar Chart", "Writing: Table",
    "Writing: Mixed Graph", "Writing: Map", "Writing: Process", "Speaking: Part 1 Interview",
    "Speaking: Part 2 Cue Card", "Speaking: Part 3 Discussion", "Speaking: Pronunciation & Fluency",
    "Speaking: Vocabulary & Ideas", "Speaking: Mock Speaking Test",
  ],
};

function builtInEntries(skillPair: SkillPair): ScheduleTemplateEntry[] {
  const source = skillPair === "LISTENING_READING" ? LR : SW;
  return source.map((contents, index) => ({
    sessionNo: index + 1, entryType: contents[0] === "Assessment Test" ? "TEST" : "SESSION",
    phaseName: index < (skillPair === "LISTENING_READING" ? 11 : 7)
      ? "Giai đoạn 1 · Nắm vững chiến thuật" : "Giai đoạn 2 · Luyện đề và đánh giá",
    contents,
  }));
}
const inputClass = "w-full rounded-xl border border-outline-variant/60 bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";

export default function ScheduleSetupModal({ courseId, skillPair, teachers, onClose, onApplied }: Props) {
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [selectedId, setSelectedId] = useState("builtin");
  const [name, setName] = useState(skillPair === "LISTENING_READING" ? "Lộ trình Listening & Reading chuẩn" : "Lộ trình Speaking & Writing chuẩn");
  const [entries, setEntries] = useState<ScheduleTemplateEntry[]>(() => builtInEntries(skillPair));
  const [startsOn, setStartsOn] = useState(new Date().toISOString().slice(0, 10));
  const [fromSession, setFromSession] = useState(1);
  const [toSession, setToSession] = useState(entries.length);
  const [teacherId, setTeacherId] = useState("");
  const [zoomUrl, setZoomUrl] = useState("");
  const [slots, setSlots] = useState<WeeklySlot[]>([1, 2, 3, 4, 5, 6, 7].map(day => ({ dayOfWeek: day, startsAt: "19:00", endsAt: "21:00", enabled: day === 1 || day === 3 })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [customFor, setCustomFor] = useState<number | null>(null);
  const [customContent, setCustomContent] = useState("");

  useEffect(() => {
    void apiFetch<ScheduleTemplate[]>(`/admin/schedule-templates?skillPair=${skillPair}`)
      .then(setTemplates).catch(() => setTemplates([]));
  }, [skillPair]);

  const visibleEntries = useMemo(() => entries.filter(entry => entry.sessionNo >= fromSession && entry.sessionNo <= toSession), [entries, fromSession, toSession]);
  function chooseTemplate(id: string) {
    setSelectedId(id);
    if (id === "builtin") {
      const values = builtInEntries(skillPair); setEntries(values); setToSession(values.length);
      setName(skillPair === "LISTENING_READING" ? "Lộ trình Listening & Reading chuẩn" : "Lộ trình Speaking & Writing chuẩn");
      return;
    }
    const template = templates.find(value => value.id === id);
    if (template) { setEntries(template.entries); setToSession(template.entries.length); setName(template.name); }
  }
  function newTemplate() {
    setSelectedId("new"); setName("Lộ trình mới"); setEntries([{ sessionNo: 1, entryType: "SESSION", phaseName: "Giai đoạn 1", contents: [] }]); setFromSession(1); setToSession(1);
  }
  function patchEntry(sessionNo: number, patch: Partial<ScheduleTemplateEntry>) {
    setEntries(values => values.map(value => value.sessionNo === sessionNo ? { ...value, ...patch } : value));
  }
  function addSuggestion(sessionNo: number, content: string) {
    if (!content) return;
    const entry = entries.find(value => value.sessionNo === sessionNo);
    if (entry && !entry.contents.includes(content)) patchEntry(sessionNo, { contents: [...entry.contents, content] });
  }
  function addEntry() {
    const next = Math.max(0, ...entries.map(value => value.sessionNo)) + 1;
    setEntries(values => [...values, { sessionNo: next, entryType: "SESSION", phaseName: "", contents: [] }]); setToSession(next);
  }
  async function saveTemplate() {
    if (!name.trim() || entries.some(entry => entry.contents.length === 0)) { setError("Tên lộ trình và nội dung từng session không được để trống."); return; }
    setBusy(true); setError("");
    try {
      const saved = await apiFetch<ScheduleTemplate>(`/admin/schedule-templates${selectedId !== "builtin" && selectedId !== "new" ? `/${selectedId}` : ""}`, {
        method: selectedId !== "builtin" && selectedId !== "new" ? "PUT" : "POST",
        body: JSON.stringify({ name: name.trim(), skillPair, description: null, entries }),
      });
      setTemplates(values => [...values.filter(value => value.id !== saved.id), saved]); setSelectedId(saved.id);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không lưu được lộ trình mẫu."); }
    finally { setBusy(false); }
  }
  async function applySchedule() {
    const weeklySlots = slots.filter(slot => slot.enabled).map(({ dayOfWeek, startsAt, endsAt }) => ({ dayOfWeek, startsAt, endsAt }));
    if (!weeklySlots.length) { setError("Chọn ít nhất một buổi học trong tuần."); return; }
    if (!visibleEntries.length || visibleEntries.some(entry => entry.contents.length === 0)) { setError("Khoảng session hoặc nội dung lộ trình chưa hợp lệ."); return; }
    setBusy(true); setError("");
    try {
      await apiFetch(`/admin/courses/${courseId}/sessions/bulk`, { method: "POST", body: JSON.stringify({ startsOn, weeklySlots, teacherId: teacherId || null, zoomUrl: zoomUrl || null, entries: visibleEntries }) });
      await onApplied(); onClose();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể thiết lập lịch học."); }
    finally { setBusy(false); }
  }

  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#21191d]/50 p-4 backdrop-blur-[2px]" onMouseDown={event => { if (event.currentTarget === event.target) onClose(); }}>
    <section className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface shadow-2xl">
      <header className="flex items-start justify-between border-b border-outline-variant/40 px-6 py-5">
        <div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-primary">Thiết lập nhanh</p><h2 className="mt-1 font-display text-2xl font-extrabold">Lộ trình và lịch học tuần</h2><p className="mt-1 text-sm text-on-surface-variant">Chọn mẫu, đổi ngày bắt đầu và hệ thống tự xếp session theo các thứ đã chọn.</p></div>
        <button onClick={onClose} className="rounded-lg border border-outline-variant/50 p-2" aria-label="Đóng"><X size={19}/></button>
      </header>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-5 overflow-y-auto border-r border-outline-variant/40 bg-surface-container-low/35 p-5">
          <label className="block"><span className="mb-1.5 block text-xs font-extrabold uppercase text-on-surface-variant">Lộ trình mẫu</span><select value={selectedId} onChange={event => chooseTemplate(event.target.value)} className={inputClass}><option value="builtin">Mẫu chuẩn của hệ thống</option>{templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}{selectedId === "new" && <option value="new">Lộ trình mới</option>}</select></label>
          <button onClick={newTemplate} className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 px-3 py-2.5 text-sm font-extrabold text-primary"><Plus size={17}/>Tạo lộ trình mẫu khác</button>
          <label className="block"><span className="mb-1.5 block text-xs font-extrabold uppercase text-on-surface-variant">Tên lộ trình</span><input value={name} onChange={event => setName(event.target.value)} className={inputClass}/></label>
          <div className="grid grid-cols-2 gap-3"><label><span className="mb-1.5 block text-xs font-extrabold uppercase text-on-surface-variant">Từ session</span><input type="number" min={1} value={fromSession} onChange={event => setFromSession(Number(event.target.value))} className={inputClass}/></label><label><span className="mb-1.5 block text-xs font-extrabold uppercase text-on-surface-variant">Đến session</span><input type="number" min={fromSession} value={toSession} onChange={event => setToSession(Number(event.target.value))} className={inputClass}/></label></div>
          <label className="block"><span className="mb-1.5 block text-xs font-extrabold uppercase text-on-surface-variant">Ngày bắt đầu</span><input type="date" value={startsOn} onChange={event => setStartsOn(event.target.value)} className={inputClass}/></label>
          <div><p className="mb-2 text-xs font-extrabold uppercase text-on-surface-variant">Lịch học hằng tuần</p><div className="space-y-2">{slots.map((slot, index) => <div key={slot.dayOfWeek} className={`rounded-xl border p-3 ${slot.enabled ? "border-primary/35 bg-primary/5" : "border-outline-variant/40"}`}><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={slot.enabled} onChange={event => setSlots(values => values.map((value, itemIndex) => itemIndex === index ? { ...value, enabled: event.target.checked } : value))} className="accent-primary"/>Thứ {slot.dayOfWeek === 7 ? "Chủ nhật" : slot.dayOfWeek + 1}</label>{slot.enabled && <div className="mt-2 grid grid-cols-2 gap-2"><input type="time" value={slot.startsAt} onChange={event => setSlots(values => values.map((value, itemIndex) => itemIndex === index ? { ...value, startsAt: event.target.value } : value))} className={inputClass}/><input type="time" value={slot.endsAt} onChange={event => setSlots(values => values.map((value, itemIndex) => itemIndex === index ? { ...value, endsAt: event.target.value } : value))} className={inputClass}/></div>}</div>)}</div></div>
          <label className="block"><span className="mb-1.5 block text-xs font-extrabold uppercase text-on-surface-variant">Giáo viên mặc định</span><select value={teacherId} onChange={event => setTeacherId(event.target.value)} className={inputClass}><option value="">Chưa phân công</option>{teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>)}</select></label>
          <label className="block"><span className="mb-1.5 block text-xs font-extrabold uppercase text-on-surface-variant">Link Zoom mặc định</span><input value={zoomUrl} onChange={event => setZoomUrl(event.target.value)} className={inputClass}/></label>
        </aside>
        <main className="min-h-0 overflow-y-auto p-5"><div className="mb-4 flex items-center justify-between"><div><h3 className="font-display text-lg font-extrabold">Nội dung từng session</h3><p className="text-xs text-on-surface-variant">Một buổi có thể có nhiều nội dung. Session và bài test là hai loại riêng.</p></div><button onClick={addEntry} className="flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-2 text-xs font-extrabold text-primary"><Plus size={15}/>Thêm session</button></div>
          <div className="space-y-3">{entries.map(entry => <article key={entry.sessionNo} className={`rounded-xl border p-4 ${entry.sessionNo >= fromSession && entry.sessionNo <= toSession ? "border-outline-variant/50" : "border-outline-variant/20 opacity-50"}`}><div className="flex flex-wrap items-center gap-3"><strong className="min-w-24 text-sm">Session {String(entry.sessionNo).padStart(2,"0")}</strong><div className="flex rounded-lg bg-surface-container-low p-1"><button onClick={() => patchEntry(entry.sessionNo,{entryType:"SESSION"})} className={`rounded-md px-3 py-1.5 text-xs font-bold ${entry.entryType === "SESSION" ? "bg-primary text-on-primary" : ""}`}>Buổi học</button><button onClick={() => patchEntry(entry.sessionNo,{entryType:"TEST"})} className={`rounded-md px-3 py-1.5 text-xs font-bold ${entry.entryType === "TEST" ? "bg-primary text-on-primary" : ""}`}>Bài test</button></div><input value={entry.phaseName ?? ""} onChange={event => patchEntry(entry.sessionNo,{phaseName:event.target.value})} placeholder="Giai đoạn" className={`${inputClass} ml-auto max-w-64`}/><button onClick={() => setEntries(values => values.filter(value => value.sessionNo !== entry.sessionNo))} className="p-2 text-rose-700" aria-label="Xóa session"><Trash size={17}/></button></div><div className="mt-3 flex flex-wrap gap-2">{entry.contents.map(content => <span key={content} className="flex items-center gap-1 rounded-lg bg-primary/8 px-2.5 py-1.5 text-xs font-bold text-primary">{content}<button onClick={() => patchEntry(entry.sessionNo,{contents:entry.contents.filter(value=>value!==content)})}><X size={13}/></button></span>)}</div><div className="mt-3 flex gap-2"><select defaultValue="" onChange={event => { addSuggestion(entry.sessionNo,event.target.value); event.target.value=""; }} className={inputClass}><option value="">Chọn nội dung gợi ý...</option>{CONTENT_SUGGESTIONS[skillPair].map(value => <option key={value} value={value}>{value}</option>)}</select><button onClick={() => setCustomFor(customFor === entry.sessionNo ? null : entry.sessionNo)} className="shrink-0 rounded-xl border border-outline-variant/60 px-3 text-xs font-extrabold"><Plus size={15}/></button></div>{customFor === entry.sessionNo && <div className="mt-2 flex gap-2"><input value={customContent} onChange={event=>setCustomContent(event.target.value)} placeholder="Nhập nội dung mới" className={inputClass}/><button onClick={()=>{if(customContent.trim())addSuggestion(entry.sessionNo,customContent.trim());setCustomContent("");setCustomFor(null);}} className="rounded-xl bg-primary px-4 text-sm font-bold text-on-primary">Thêm</button></div>}</article>)}</div>
          <button onClick={addEntry} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/35 py-3 text-sm font-extrabold text-primary"><Plus size={18}/>Thêm nội dung/session mới vào cuối lộ trình</button>
        </main>
      </div>
      {error && <div className="border-t border-rose-200 bg-rose-50 px-6 py-3 text-sm font-semibold text-rose-800">{error}</div>}
      <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-outline-variant/40 px-6 py-4"><button onClick={onClose} className="rounded-xl border border-outline-variant/60 px-4 py-2.5 text-sm font-bold">Hủy</button><button disabled={busy} onClick={()=>void saveTemplate()} className="flex items-center gap-2 rounded-xl border border-primary/35 px-4 py-2.5 text-sm font-extrabold text-primary disabled:opacity-50">{busy?<SpinnerGap className="animate-spin"/>:<FloppyDisk/>}Lưu làm mẫu</button><button disabled={busy} onClick={()=>void applySchedule()} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-extrabold text-on-primary disabled:opacity-50">{busy?<SpinnerGap className="animate-spin"/>:<CalendarDots/>}Thiết lập lịch</button></footer>
    </section>
  </div>;
}
