import { ArrowSquareOut, BookOpenText, Check, FileText, MagnifyingGlass, SpinnerGap, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import type { Page, SkillPair } from "../../academic-types";
import type { ExerciseTemplate, LearningResource, LibraryItem, LibrarySkill } from "../../library-types";
import { isResource } from "../../library-types";
import { apiFetch } from "../../lib/api";
import { categoryLabel } from "./library-config";

type Props = {
  open: boolean; courseId: string; skillPair: SkillPair; onClose: () => void;
  onAttach: (items: LibraryItem[]) => void;
};

export default function AttachLibraryModal({ open, courseId, skillPair, onClose, onAttach }: Props) {
  const skills: LibrarySkill[] = skillPair === "LISTENING_READING" ? ["LISTENING", "READING"] : ["SPEAKING", "WRITING"];
  const [skill, setSkill] = useState<LibrarySkill>(skills[0]);
  const [kind, setKind] = useState<"ALL"|"RESOURCES"|"EXERCISES">("ALL");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelected(new Set()); setQuery(""); setSkill(skills[0]);
  }, [open, skillPair]);
  useEffect(() => {
    if (!open) return;
    setLoading(true); setError("");
    // Only published assets are attachable to a session. Do not use the staff/enrolment ACTIVE status here.
    const params = `skill=${skill}&courseId=${courseId}&includeGlobal=true&status=PUBLISHED&size=100`;
    Promise.all([
      apiFetch<Page<LearningResource>>(`/admin/library/resources?${params}`),
      apiFetch<Page<ExerciseTemplate>>(`/admin/library/exercises?${params}`),
    ]).then(([resources, exercises])=>setItems([...resources.content, ...exercises.content]))
      .catch(reason=>setError(reason instanceof Error ? reason.message : "Không tải được kho học liệu."))
      .finally(()=>setLoading(false));
  }, [courseId, open, skill]);

  const visible = useMemo(() => items.filter(item => {
    const matchKind = kind === "ALL" || (kind === "RESOURCES" ? isResource(item) : !isResource(item));
    const search = query.trim().toLowerCase();
    return matchKind && (!search || `${item.code} ${item.title} ${item.category}`.toLowerCase().includes(search));
  }), [items, kind, query]);

  if (!open) return null;
  function toggle(id: string) { setSelected(current=>{const next=new Set(current);next.has(id)?next.delete(id):next.add(id);return next}); }
  function submit() { onAttach(items.filter(item=>selected.has(item.id))); onClose(); }

  return <div className="fixed inset-0 z-[70] grid place-items-center bg-on-background/50 p-4" role="dialog" aria-modal="true" aria-labelledby="attach-library-title">
    <div className="flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-[22px] border border-outline-variant/50 bg-surface shadow-2xl">
      <header className="flex items-start justify-between border-b border-outline-variant/40 px-6 py-5"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Gắn vào session</p><h2 id="attach-library-title" className="mt-1 font-display text-2xl font-bold">Chọn từ kho học liệu</h2><p className="mt-1 text-sm text-on-surface-variant">Tài liệu không bắt buộc deadline; bài tập mặc định hạn nộp sau buổi học 2 ngày.</p></div><button onClick={onClose} aria-label="Đóng" className="grid h-11 w-11 place-items-center rounded-xl border border-outline-variant/50"><X size={20}/></button></header>
      <div className="space-y-4 border-b border-outline-variant/40 p-4"><div className="flex flex-wrap gap-2">{skills.map(value=><button key={value} onClick={()=>setSkill(value)} className={`min-h-10 rounded-xl px-4 text-sm font-bold ${skill===value?"bg-primary text-on-primary":"border border-outline-variant/50"}`}>{value[0]+value.slice(1).toLowerCase()}</button>)}</div><div className="flex flex-col gap-3 md:flex-row"><label className="relative flex-1"><MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"/><input value={query} onChange={event=>setQuery(event.target.value)} className="min-h-11 w-full rounded-xl border-outline-variant/60 pl-11 text-sm focus:border-primary focus:ring-primary" placeholder="Tìm tài liệu hoặc bài tập mẫu..."/></label><select value={kind} onChange={event=>setKind(event.target.value as typeof kind)} className="min-h-11 rounded-xl border-outline-variant/60 text-sm focus:border-primary focus:ring-primary"><option value="ALL">Tất cả</option><option value="RESOURCES">Tài liệu</option><option value="EXERCISES">Bài tập mẫu</option></select></div></div>
      <div className="flex-1 overflow-y-auto p-4">{loading?<div className="grid min-h-52 place-items-center"><span className="inline-flex items-center gap-2 text-sm font-semibold"><SpinnerGap className="animate-spin"/>Đang tải...</span></div>:error?<p className="rounded-xl bg-error-container/20 p-4 text-sm font-semibold text-error">{error}</p>:visible.length===0?<div className="grid min-h-52 place-items-center rounded-xl border border-dashed border-outline-variant/70 text-center"><div><FileText size={32} className="mx-auto text-outline"/><p className="mt-3 font-bold">Chưa có học liệu phù hợp</p><p className="mt-1 text-sm text-on-surface-variant">Hãy tạo trong Kho học liệu trước khi gắn vào session.</p></div></div>:<div className="grid gap-2 md:grid-cols-2">{visible.map(item=>{const checked=selected.has(item.id);const url=isResource(item)?item.externalUrl:item.sourceUrl;return <button key={item.id} onClick={()=>toggle(item.id)} className={`flex items-start gap-3 rounded-xl border p-4 text-left ${checked?"border-primary bg-primary-container/15":"border-outline-variant/50 hover:border-primary/40"}`}><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${checked?"bg-primary text-on-primary":"bg-surface-container text-primary"}`}>{checked?<Check size={18} weight="bold"/>:isResource(item)?<FileText size={19}/>:<BookOpenText size={19}/>}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><small className="font-bold text-primary">{item.code}</small><small className="rounded-full bg-surface-container px-2 py-0.5 font-bold">{isResource(item)?"TÀI LIỆU":"BÀI TẬP"}</small></span><strong className="mt-1 block line-clamp-2 text-sm">{item.title}</strong><small className="mt-1 block text-on-surface-variant">{categoryLabel(item.skill,item.category)} · {item.scope==="GLOBAL"?"Dùng chung":"Riêng khóa"}</small>{url&&<span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary"><ArrowSquareOut size={14}/>Có đường dẫn nguồn</span>}</span></button>})}</div>}</div>
      <footer className="flex items-center justify-between gap-3 border-t border-outline-variant/40 px-6 py-4"><p className="text-sm font-semibold text-on-surface-variant">Đã chọn <strong className="text-on-surface">{selected.size}</strong> mục</p><div className="flex gap-3"><button onClick={onClose} className="min-h-11 rounded-xl border border-outline-variant/60 px-5 text-sm font-bold">Hủy</button><button onClick={submit} disabled={!selected.size} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary disabled:opacity-40">Gắn vào session</button></div></footer>
    </div>
  </div>;
}
